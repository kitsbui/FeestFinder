import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { hmac, randomCode, safeEqual } from '../lib/crypto.ts';

/**
 * Per-event scanning key. Door devices download it with the manifest, so they can
 * verify QR tokens with no signal without ever holding the master secret.
 */
export const eventScanKey = (secret: string, eventId: string) => hmac(secret, `scan:${eventId}`);

const sign = (key: string, payload: string) => hmac(key, payload).slice(0, 22);

/**
 * What a ticket's QR carries. A ticket that never changed hands is `<code>.<signature>`;
 * each time it moves to someone else its version goes up and the QR becomes
 * `<code>~<version>.<signature>`, signed over both. The holder's QR is always the latest
 * version, and the door turns away any older one.
 */
const qrPayload = (code: string, version: number) => (version > 0 ? `${code}~${version}` : code);

export const qrToken = (secret: string, eventId: string, code: string, version = 0) =>
  `${qrPayload(code, version)}.${sign(eventScanKey(secret, eventId), qrPayload(code, version))}`;

export function readQrToken(token: string): { code: string; version: number; payload: string; sig: string | null } {
  const t = token.trim();
  const dot = t.lastIndexOf('.');
  const payload = dot > 0 ? t.slice(0, dot) : t;
  const tilde = payload.lastIndexOf('~');
  const version = tilde > 0 && /^\d{1,6}$/.test(payload.slice(tilde + 1)) ? Number(payload.slice(tilde + 1)) : 0;
  return { code: version ? payload.slice(0, tilde) : payload, version, payload, sig: dot > 0 ? t.slice(dot + 1) : null };
}

/** Checks the signature over what the QR says, version included. */
export function verifyQrSignature(scanKey: string, payload: string, sig: string): boolean {
  return safeEqual(sign(scanKey, payload), sig);
}

/** FF-RAVO-7K2Q: event prefix so gate staff can spot a wrong-event ticket by eye. */
export function ticketCode(slug: string): string {
  const prefix = slug.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase().padEnd(4, 'X');
  return `FF-${prefix}-${randomCode(4)}`;
}

/**
 * Marks a pending order paid and issues one ticket per seat. Idempotent: a second
 * call (e.g. a replayed payment webhook) finds the order already paid and does nothing.
 */
export async function fulfilOrder(q: Queryable, orderId: string, now: Date): Promise<{ fulfilled: boolean }> {
  const order = await one<any>(q,
    `select o.*, e.slug from orders o join events e on e.id = o.event_id where o.id = $1 for update of o`, [orderId]);
  if (!order || order.status !== 'pending') return { fulfilled: false };
  const user = await one<any>(q, 'select name, phone, email from users where id = $1', [order.user_id]);
  await q.query(`update orders set status = 'paid', paid_at = $2 where id = $1`, [orderId, now]);
  await q.query('update ticket_tiers set sold = sold + $2 where id = $1', [order.tier_id, order.qty]);
  if (order.promo_code_id) await q.query('update promo_codes set used = used + 1 where id = $1', [order.promo_code_id]);
  for (let i = 0; i < order.qty; i++) {
    for (let attempt = 0; ; attempt++) {
      const inserted = await one(q,
        `insert into tickets (order_id, event_id, tier_id, user_id, code, holder_name, holder_phone, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (code) do nothing returning id`,
        [orderId, order.event_id, order.tier_id, order.user_id, ticketCode(order.slug), user?.name ?? '', user?.phone ?? null, now]);
      if (inserted) break;
      if (attempt > 5) throw new Error('could not allocate a unique ticket code');
    }
  }
  await q.query('insert into going (user_id, event_id) values ($1,$2) on conflict do nothing', [order.user_id, order.event_id]);
  await refreshSoldOut(q, order.event_id);
  return { fulfilled: true };
}

/** An event is sold out once every tier that is on sale has no seats left. */
export async function refreshSoldOut(q: Queryable, eventId: string): Promise<void> {
  const tiers = await many<any>(q, 'select capacity, sold from ticket_tiers where event_id = $1', [eventId]);
  if (!tiers.length) return;
  const soldOut = tiers.every((t) => t.sold >= t.capacity);
  await q.query('update events set sold_out = $2 where id = $1', [eventId, soldOut]);
}
