import type { Queryable } from '../db/index.ts';
import { one } from '../db/index.ts';
import { conflict, notFound } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { notifyUser } from './notify.ts';

/**
 * Refunds a whole paid order: its tickets stop scanning, the seats go back on sale and the
 * buyer is told. Refuses once any ticket on the order has been scanned in. The caller checks
 * who may do this (the organiser's owner, or FeestFinder support) and runs it in a transaction.
 */
export async function refundOrder(q: Queryable, orderId: string, now: Date, allowed: (order: any) => boolean = () => true) {
  const o = await one<any>(q, 'select o.*, e.organizer_id, e.title from orders o join events e on e.id = o.event_id where o.id = $1 for update of o', [orderId]);
  if (!o || !allowed(o)) throw notFound();
  if (o.status !== 'paid') throw conflict('not_paid', L('Only paid orders can be refunded', 'Chỉ hoàn được đơn đã thanh toán'));
  // A ticket that changed hands belongs to someone else now: refunding the buyer would void it.
  const moved = await one<any>(q, `select count(*)::int as n from tickets where order_id = $1 and qr_version > 0`, [o.id]);
  if (moved.n) {
    throw conflict('ticket_transferred', L('A ticket on this order was passed on to someone else. Contact FeestFinder support.', 'Một vé trong đơn đã được chuyển nhượng. Liên hệ FeestFinder để được hỗ trợ.'));
  }
  const used = await one<any>(q, `select count(*)::int as n from tickets where order_id = $1 and status = 'used'`, [o.id]);
  if (used.n) throw conflict('ticket_used', L('A ticket on this order was already scanned in', 'Một vé trong đơn đã được quét vào cửa'));
  const paying = await one<any>(q,
    `select count(*)::int as n from ticket_listings l join tickets t on t.id = l.ticket_id where t.order_id = $1 and l.status = 'reserved'`, [o.id]);
  if (paying.n) throw conflict('listing_reserved', L('Someone is paying for a ticket on this order right now', 'Đang có người thanh toán một vé trong đơn này'));
  await q.query(
    `update ticket_listings l set status = 'cancelled', closed_at = $2 from tickets t where t.id = l.ticket_id and t.order_id = $1 and l.status = 'active'`, [o.id, now]);
  await q.query(`update orders set status = 'refunded', refunded_at = $2 where id = $1`, [o.id, now]);
  await q.query(`update tickets set status = 'refunded' where order_id = $1`, [o.id]);
  await q.query('update ticket_tiers set sold = greatest(sold - $2, 0) where id = $1', [o.tier_id, o.qty]);
  await q.query('update events set sold_out = false where id = $1', [o.event_id]);
  await notifyUser(q, now, {
    userId: o.user_id, topic: 'tickets', kind: 'refund', urgent: true,
    title: L('Your order was refunded', 'Đơn của bạn đã được hoàn tiền'), body: { en: o.title, vi: o.title }, link: { screen: 'tickets' },
  });
  return o;
}
