import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../../db/index.ts';
import { notFound } from '../../lib/errors.ts';
import { L } from '../../lib/i18n.ts';
import { addDays, atVn } from '../../lib/time.ts';
import { csv, dateStr, limit, parse, uuid } from '../../lib/validate.ts';
import { requireAdmin } from '../../http/guards.ts';
import { SqlParams } from '../../http/sql.ts';
import { appendAudit } from '../../services/audit.ts';
import { refundOrder } from '../../services/orders.ts';

import { ORDER_STATUS, PAY_METHOD, short, actorOf } from './ops-shared.ts';

/* Ticket orders as the team sees them, and refunds. */

export default async function adminOrderRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  // ---- orders -------------------------------------------------------------------------------

  app.get('/admin/orders', async (req) => {
    requireAdmin(req);
    const f = parse(z.object({
      q: z.string().max(80).optional(),
      status: csv(z.enum(['pending', 'paid', 'cancelled', 'expired', 'refunded'])).optional(),
      method: csv(z.enum(['card', 'momo', 'zalopay', 'vietqr', 'mock'])).optional(),
      eventId: uuid.optional(),
      from: dateStr.optional(),
      to: dateStr.optional(),
      limit: limit(200, 25),
      offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
    }), req.query);
    /** WHERE for the order list; the status tiles leave the status filter out so they count every status. */
    const orderWhere = (sql: SqlParams, withStatus: boolean) => {
      const where: string[] = ['true'];
      if (f.q?.trim()) {
        const raw = f.q.trim().replace(/[%_\\]/g, '');
        const digits = raw.replace(/\D/g, '');
        const r = sql.p(raw);
        where.push(`(x.code ilike ${r} || '%' or u.email ilike '%' || ${r} || '%' or u.name ilike '%' || ${r} || '%'${digits.length >= 4 ? ` or u.phone like '%' || ${sql.p(digits.replace(/^0/, ''))} || '%'` : ''})`);
      }
      if (withStatus && f.status?.length) where.push(`x.status = any(${sql.p(f.status)}::text[])`);
      if (f.method?.length) where.push(`x.payment_method = any(${sql.p(f.method)}::text[])`);
      if (f.eventId) where.push(`x.event_id = ${sql.p(f.eventId)}`);
      if (f.from) where.push(`x.created_at >= ${sql.p(atVn(f.from))}`);
      if (f.to) where.push(`x.created_at < ${sql.p(atVn(addDays(f.to, 1)))}`);
      return where.join(' and ');
    };
    const sql = new SqlParams();
    const w = orderWhere(sql, true);
    const sumSql = new SqlParams();
    const noStatus = orderWhere(sumSql, false);
    const from = 'from orders x join users u on u.id = x.user_id join events e on e.id = x.event_id join ticket_tiers t on t.id = x.tier_id';
    const [rows, total, summary] = await Promise.all([
      many<any>(ctx.db,
        `select x.*, u.name as buyer_name, u.email as buyer_email, u.phone as buyer_phone, e.title as event_title, e.starts_on as event_starts_on, t.name as tier_name
           ${from} where ${w} order by x.created_at desc limit ${f.limit} offset ${f.offset}`, sql.values),
      one<any>(ctx.db, `select count(*)::int as n ${from} where ${w}`, sql.values),
      many<any>(ctx.db, `select x.status, count(*)::int as n, coalesce(sum(x.total), 0)::bigint as total ${from} where ${noStatus} group by x.status`, sumSql.values),
    ]);
    return {
      items: rows.map((o) => ({
        id: o.id, code: o.code, status: o.status, statusLabel: ORDER_STATUS[o.status], method: o.payment_method, methodLabel: PAY_METHOD[o.payment_method],
        qty: o.qty, unitPrice: Number(o.unit_price), subtotal: Number(o.subtotal), discount: Number(o.discount), fee: Number(o.fee), total: Number(o.total),
        createdAt: o.created_at, paidAt: o.paid_at, refundedAt: o.refunded_at,
        buyer: { id: o.user_id, name: o.buyer_name, email: o.buyer_email, phone: o.buyer_phone },
        event: { id: o.event_id, title: o.event_title, startsOn: o.event_starts_on }, tier: o.tier_name,
      })),
      total: total.n, offset: f.offset, limit: f.limit,
      summary: Object.fromEntries(summary.map((x) => [x.status, { count: x.n, total: Number(x.total) }])),
    };
  });

  app.get<{ Params: { id: string } }>('/admin/orders/:id', async (req) => {
    requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const o = await one<any>(ctx.db,
      `select x.*, u.name as buyer_name, u.email as buyer_email, u.phone as buyer_phone, e.title as event_title, e.starts_on as event_starts_on, e.slug as event_slug,
              t.name as tier_name, p.code as promo
         from orders x join users u on u.id = x.user_id join events e on e.id = x.event_id join ticket_tiers t on t.id = x.tier_id
         left join promo_codes p on p.id = x.promo_code_id where x.id = $1`, [id]);
    if (!o) throw notFound();
    const tickets = await many<any>(ctx.db, 'select id, code, holder_name, status, checked_in_at, checked_in_gate, resent_at from tickets where order_id = $1 order by code', [id]);
    return {
      id: o.id, code: o.code, status: o.status, statusLabel: ORDER_STATUS[o.status], method: o.payment_method, methodLabel: PAY_METHOD[o.payment_method], providerRef: o.provider_ref,
      qty: o.qty, unitPrice: Number(o.unit_price), subtotal: Number(o.subtotal), discount: Number(o.discount), fee: Number(o.fee), total: Number(o.total), promo: o.promo,
      createdAt: o.created_at, paidAt: o.paid_at, refundedAt: o.refunded_at, expiresAt: o.expires_at,
      buyer: { id: o.user_id, name: o.buyer_name, email: o.buyer_email, phone: o.buyer_phone },
      event: { id: o.event_id, title: o.event_title, startsOn: o.event_starts_on, slug: o.event_slug }, tier: o.tier_name,
      tickets: tickets.map((t) => ({ id: t.id, code: t.code, holder: t.holder_name, status: t.status, checkedInAt: t.checked_in_at, gate: t.checked_in_gate })),
      refundable: o.status === 'paid' && !tickets.some((t) => t.status === 'used'),
    };
  });

  app.post<{ Params: { id: string } }>('/admin/orders/:id/refund', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const { reason } = parse(z.object({ reason: z.string().trim().max(300).optional() }), req.body ?? {});
    const now = ctx.clock.now();
    const o = await ctx.db.tx(async (q) => {
      const out = await refundOrder(q, id, now);
      await appendAudit(q, { at: now, ...actorOf(s), action: 'order.refunded', targetType: 'order', targetId: id, targetLabel: `${out.code} · ${out.title}`,
        diff: [{ f: 'status', a: 'paid', b: 'refunded' }, { f: 'amount', a: '—', b: String(out.total) }, ...(reason ? [{ f: 'reason', a: '—', b: short(reason) }] : [])] });
      return out;
    });
    return { ok: true, orderCode: o.code, message: L(`Refunded · ${o.code}`, `Đã hoàn tiền · ${o.code}`) };
  });
}
