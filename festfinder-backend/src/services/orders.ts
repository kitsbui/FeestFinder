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
  const used = await one<any>(q, `select count(*)::int as n from tickets where order_id = $1 and status = 'used'`, [o.id]);
  if (used.n) throw conflict('ticket_used', L('A ticket on this order was already scanned in', 'Một vé trong đơn đã được quét vào cửa'));
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
