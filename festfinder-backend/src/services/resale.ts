import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { badRequest, conflict, notFound } from '../lib/errors.ts';
import { fill, L } from '../lib/i18n.ts';
import { randomCode } from '../lib/crypto.ts';
import { vnd } from '../lib/format.ts';
import { notifyUser } from './notify.ts';

/** What a buyer pays on top of the seller's price, the same rate as a first-hand ticket. */
export const RESALE_FEE_PCT = Number(process.env.SERVICE_FEE_PCT ?? 5);
/** How long a buyer has to pay before the ticket goes back on the list. */
export const RESALE_HOLD_MINUTES = 10;
/** Sellers are paid this long after the event ends, once it is clear it happened. */
export const PAYOUT_AFTER_EVENT_MS = 2 * 86400_000;
export const MIN_RESALE_PRICE = 10_000;

/** A ticket with what deciding a move needs: its event and the price first paid for it. */
export async function loadTicket(q: Queryable, ticketId: string, lock = false) {
  return one<any>(q,
    `select t.*, e.title, e.slug, e.status as event_status, e.ends_at, e.starts_at, e.resale_enabled, e.organizer_id,
            o.unit_price as face_value, o.user_id as buyer_of_record, tt.name as tier_name
       from tickets t join events e on e.id = t.event_id left join orders o on o.id = t.order_id left join ticket_tiers tt on tt.id = t.tier_id
      where t.id = $1 ${lock ? 'for update of t' : ''}`, [ticketId]);
}

/** Throws the reason a ticket cannot change hands right now, if there is one. */
export function assertMovable(t: any, holderId: string, now: Date) {
  if (!t || t.user_id !== holderId) throw notFound(L('Ticket not found', 'Không tìm thấy vé'));
  if (t.kind === 'guest') throw conflict('guest_ticket', L('Guest-list entries cannot change hands', 'Vé khách mời không chuyển nhượng được'));
  if (t.status === 'used') throw conflict('ticket_used', L('This ticket was already scanned in', 'Vé này đã được quét vào cửa'));
  if (t.status !== 'valid') throw conflict('ticket_not_valid', L('This ticket is no longer valid', 'Vé này không còn hiệu lực'));
  if (t.event_status !== 'live') throw conflict('event_not_live', L('This event is not on any more', 'Sự kiện này không còn diễn ra'));
  if (t.ends_at && new Date(t.ends_at).getTime() <= now.getTime()) throw conflict('event_ended', L('This event has ended', 'Sự kiện đã kết thúc'));
  if (!t.resale_enabled) throw conflict('transfers_off', L('The organiser has turned off ticket transfers for this event', 'BTC đã tắt chuyển nhượng vé cho sự kiện này'));
}

/**
 * Gives a ticket a new holder and a new QR version, and writes the move down. The old QR
 * stops opening the door the moment this commits; scanners pick the change up on their
 * next refresh, and one that is offline still turns the old QR away once it sees the new one.
 */
export async function moveTicket(q: Queryable, t: any, toUserId: string, now: Date, opts: { kind: 'gift' | 'resale'; resaleOrderId?: string }) {
  const to = await one<any>(q, 'select name, phone from users where id = $1', [toUserId]);
  const moved = await one<{ qr_version: number }>(q,
    `update tickets set user_id = $2, holder_name = $3, holder_phone = $4, qr_version = qr_version + 1 where id = $1 returning qr_version`,
    [t.id, toUserId, to?.name ?? '', to?.phone ?? null]);
  await q.query(
    `insert into ticket_transfers (ticket_id, event_id, from_user, to_user, kind, resale_order_id, from_version, to_version, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [t.id, t.event_id, t.user_id, toUserId, opts.kind, opts.resaleOrderId ?? null, t.qr_version, moved!.qr_version, now]);
  await q.query('insert into going (user_id, event_id, created_at) values ($1,$2,$3) on conflict do nothing', [toUserId, t.event_id, now]);
  // The giver is no longer going, unless they still hold another ticket for the night.
  await q.query(
    `delete from going g where g.user_id = $1 and g.event_id = $2
       and not exists (select 1 from tickets x where x.user_id = $1 and x.event_id = $2 and x.status in ('valid', 'used'))`, [t.user_id, t.event_id]);
  return moved!.qr_version;
}

/** Closes a ticket's open listing, refusing if a buyer is paying for it at this moment. */
export async function closeListingFor(q: Queryable, ticketId: string, now: Date) {
  const open = await one<any>(q, `select id, status from ticket_listings where ticket_id = $1 and status in ('active', 'reserved') for update`, [ticketId]);
  if (!open) return;
  if (open.status === 'reserved') {
    throw conflict('listing_reserved', L('Someone is paying for this ticket right now — try again in a few minutes', 'Đang có người thanh toán vé này — thử lại sau vài phút'));
  }
  await q.query(`update ticket_listings set status = 'cancelled', closed_at = $2 where id = $1`, [open.id, now]);
}

/** Tells the people waiting for a resale ticket, at most once every six hours each. */
export async function alertWatchers(q: Queryable, eventId: string, sellerId: string, price: number, now: Date) {
  const ev = await one<any>(q, 'select title from events where id = $1', [eventId]);
  const rows = await many<{ user_id: string }>(q,
    `update resale_watchers set notified_at = $3
      where event_id = $1 and user_id <> $2 and (notified_at is null or notified_at < $4) returning user_id`,
    [eventId, sellerId, now, new Date(now.getTime() - 6 * 3600_000)]);
  for (const r of rows) {
    await notifyUser(q, now, {
      userId: r.user_id, topic: 'tickets', kind: 'resale_available', urgent: true,
      title: fill(L('A ticket just came up · {t}', 'Vừa có vé pass · {t}'), { t: ev.title }),
      body: L(`From ${vnd(price, 'en')}, at most face value. First to pay gets it.`, `Từ ${vnd(price, 'vi')}, không quá giá gốc. Ai thanh toán trước sẽ có vé.`),
      link: { screen: 'event', eventId, section: 'resale' },
    });
  }
  return rows.length;
}

export const resaleCode = () => `FR${randomCode(6)}`;

/**
 * Completes a paid resale: the ticket moves to the buyer and the seller's payout is
 * scheduled for after the event. Idempotent, like first-hand orders. If the ticket can no
 * longer move (scanned in, refunded, event over) the order is marked failed so the money
 * goes back to the buyer.
 */
export async function fulfilResale(q: Queryable, orderId: string, now: Date): Promise<{ fulfilled: boolean; failed?: boolean }> {
  const o = await one<any>(q, 'select * from resale_orders where id = $1 for update', [orderId]);
  if (!o || !['pending', 'expired'].includes(o.status)) return { fulfilled: false };
  const listing = await one<any>(q, 'select * from ticket_listings where id = $1 for update', [o.listing_id]);
  const t = await loadTicket(q, o.ticket_id, true);
  let ok = !!t && t.user_id === o.seller_id && t.status === 'valid' && t.event_status === 'live' && (!t.ends_at || new Date(t.ends_at) > now);
  // A late payment still counts if nobody else took the ticket meanwhile.
  if (ok && listing.status === 'active') await q.query(`update ticket_listings set status = 'reserved' where id = $1`, [listing.id]);
  else if (ok && listing.status !== 'reserved') ok = false;
  if (ok && listing.status === 'reserved') {
    const other = await one(q, `select 1 from resale_orders where listing_id = $1 and status = 'pending' and id <> $2 and expires_at > $3`, [listing.id, o.id, now]);
    if (other && o.status === 'expired') ok = false;
  }
  if (!ok) {
    await q.query(`update resale_orders set status = 'failed', paid_at = $2 where id = $1`, [o.id, now]);
    await notifyUser(q, now, {
      userId: o.buyer_id, topic: null, kind: 'resale_failed', urgent: true,
      title: L('That ticket was gone before your payment landed', 'Vé đã không còn khi tiền của bạn về'),
      body: L(`We will refund ${vnd(o.total, 'en')} within one working day.`, `Chúng tôi sẽ hoàn ${vnd(o.total, 'vi')} trong một ngày làm việc.`),
      link: { screen: 'tickets' },
    });
    return { fulfilled: false, failed: true };
  }
  await moveTicket(q, t, o.buyer_id, now, { kind: 'resale', resaleOrderId: o.id });
  await q.query(`update ticket_listings set status = 'sold', closed_at = $2 where id = $1`, [listing.id, now]);
  await q.query(`update resale_orders set status = 'paid', paid_at = $2, payout_due_at = $3 where id = $1`,
    [o.id, now, new Date((t.ends_at ? new Date(t.ends_at).getTime() : now.getTime()) + PAYOUT_AFTER_EVENT_MS)]);
  // Anyone else who started paying for this ticket is told it went, and is not charged.
  await q.query(`update resale_orders set status = 'cancelled' where listing_id = $1 and status = 'pending' and id <> $2`, [listing.id, o.id]);
  await notifyUser(q, now, {
    userId: o.buyer_id, topic: null, kind: 'tickets_issued',
    title: L('Your ticket is in My tickets', 'Vé đã vào mục Vé của tôi'),
    body: { en: `${t.title} · new QR, ready at the door`, vi: `${t.title} · QR mới, dùng được ngay ở cửa` },
    link: { screen: 'tickets' },
  });
  await notifyUser(q, now, {
    userId: o.seller_id, topic: 'tickets', kind: 'resale_sold', urgent: true,
    title: fill(L('Your ticket sold · {t}', 'Vé của bạn đã được pass · {t}'), { t: t.title }),
    body: L(`${vnd(o.price, 'en')} goes to your bank account after the event. Your old QR no longer works.`,
      `${vnd(o.price, 'vi')} sẽ về tài khoản của bạn sau sự kiện. QR cũ của bạn đã hết hiệu lực.`),
    link: { screen: 'tickets' },
  });
  return { fulfilled: true };
}

/** Holds nobody paid for go back on the list. */
export async function expireResaleHolds(q: Queryable, now: Date): Promise<number> {
  const expired = await many<{ listing_id: string }>(q,
    `update resale_orders set status = 'expired' where status = 'pending' and expires_at < $1 returning listing_id`, [now]);
  for (const r of expired) {
    await q.query(
      `update ticket_listings l set status = 'active'
        where l.id = $1 and l.status = 'reserved'
          and not exists (select 1 from resale_orders o where o.listing_id = l.id and o.status in ('pending', 'paid'))`, [r.listing_id]);
  }
  // Listings for nights that are over, or tickets that are no longer valid, close.
  await q.query(
    `update ticket_listings l set status = 'expired', closed_at = $1
       from tickets t, events e
      where t.id = l.ticket_id and e.id = l.event_id and l.status = 'active'
        and (e.ends_at < $1 or e.status <> 'live' or t.status <> 'valid')`, [now]);
  return expired.length;
}

export function checkResalePrice(price: number, face: number) {
  if (price < MIN_RESALE_PRICE) throw badRequest('price_too_low', L(`At least ${vnd(MIN_RESALE_PRICE, 'en')}`, `Tối thiểu ${vnd(MIN_RESALE_PRICE, 'vi')}`));
  if (price > face) {
    throw badRequest('above_face_value', L(`At most the face value, ${vnd(face, 'en')}`, `Không quá giá gốc ${vnd(face, 'vi')}`), { faceValue: face });
  }
}
