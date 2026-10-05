import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../db/index.ts';
import { AppError, notFound } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { parse } from '../lib/validate.ts';
import { sha256, safeEqual } from '../lib/crypto.ts';
import { isUuid } from '../http/sql.ts';
import { tierState } from '../presenters/event.ts';
import { hostOf } from '../services/ingest/normalize.ts';
import { conversionStatus, countEventMetric, partnerForUrl, partnerLink, recordConversion, type Partner } from '../services/partners.ts';

/*
 * The way out to tickets, and the way back in for what was sold.
 *
 *   GET /go/<event>?src=detail[&tier=<id>]   every ticket button: counted, then redirected
 *   GET|POST /partners/<slug>/postback       a partner reports a sale (token, order, amount, click…)
 */

export const GO_SOURCES = ['detail', 'tier', 'hero', 'card', 'map', 'list', 'app', 'link'] as const;

const GoQuery = z.object({
  src: z.enum(GO_SOURCES).catch('detail'),
  tier: z.string().uuid().optional().catch(undefined),
});

const pick = (o: Record<string, unknown>, ...keys: string[]) => {
  for (const k of keys) if (o[k] !== undefined && o[k] !== '') return o[k];
  return undefined;
};

const Postback = z.object({
  order: z.string().trim().min(1).max(120),
  amount: z.coerce.number().min(0).max(1e12).default(0),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/).default('VND').transform((c) => c.toUpperCase()),
  status: z.unknown().optional(),
  click: z.string().optional(),
  commission: z.coerce.number().min(0).max(1e12).optional(),
  at: z.coerce.date().optional(),
});

export default async function outboundRoutes(app: FastifyInstance) {
  const ctx = app.ctx;
  // One counted click per person per event every 30 minutes, like the view counter.
  const seen = new Map<string, number>();

  app.get<{ Params: { event: string } }>('/go/:event', async (req, reply) => {
    const q = parse(GoQuery, req.query);
    const key = req.params.event;
    const ev = await one<any>(ctx.db,
      `select id, slug, status, held_for_reports, entry_mode, ticket_url from events where ${isUuid(key) ? 'id = $1' : 'slug = $1'}`, [key]);
    if (!ev) throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
    reply.header('cache-control', 'no-store').header('x-robots-tag', 'noindex, nofollow');
    const page = `/e/${encodeURIComponent(ev.slug)}`;
    if (ev.status !== 'live' || ev.held_for_reports) return reply.redirect(page, 302);

    const now = ctx.clock.now();
    const userId = req.session?.user?.id ?? null;
    // FeestFinder's own checkout first, when one of its tiers is on sale.
    const tiers = ev.entry_mode === 'paid' ? await many<any>(ctx.db, 'select id, capacity, sold, is_last, sales_open_at from ticket_tiers where event_id = $1', [ev.id]) : [];
    const open = tiers.filter((t) => ['onsale', 'last'].includes(tierState(t, now)));
    let target: 'checkout' | 'partner' | 'organizer';
    let location: string;
    let partner: Partner | null = null;
    const ticketUrl = ev.entry_mode === 'paid' && /^https?:\/\//i.test(ev.ticket_url ?? '') ? String(ev.ticket_url) : null;
    if (open.length) {
      target = 'checkout';
      const tier = q.tier && open.some((t) => t.id === q.tier) ? `?tier=${q.tier}` : '';
      location = `/app/checkout/${encodeURIComponent(ev.slug)}${tier}`;
    } else if (ticketUrl) {
      partner = await partnerForUrl(ctx.db, ticketUrl);
      target = partner ? 'partner' : 'organizer';
      location = ticketUrl;
    } else {
      return reply.redirect(page, 302);
    }

    const click = await one<{ id: string }>(ctx.db,
      `insert into outbound_clicks (event_id, partner_id, user_id, source, target, target_host, created_at) values ($1,$2,$3,$4,$5,$6,$7) returning id`,
      [ev.id, partner?.id ?? null, userId, q.src, target, target === 'checkout' ? null : hostOf(location), now]);
    if (partner) {
      try { location = partnerLink(location, partner, click!.id); } catch { /* a broken template: the plain link still sells */ }
    }
    const dedupe = `${req.ip}|${userId ?? ''}|${ev.id}`;
    const last = seen.get(dedupe);
    if (!last || now.getTime() - last >= 30 * 60_000) {
      seen.set(dedupe, now.getTime());
      if (seen.size > 50_000) seen.clear();
      await countEventMetric(ctx.db, ev.id, 'ticket_clicks', q.src, now);
    }
    return reply.redirect(location, 302);
  });

  /** A partner's sale report. Networks call it with GET and their own macros, or POST JSON. */
  app.route<{ Params: { slug: string } }>({
    method: ['GET', 'POST'],
    url: '/partners/:slug/postback',
    handler: async (req, reply) => {
      const raw = { ...(req.query as Record<string, unknown>), ...(req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {}) };
      const partner = await one<Partner & { postback_token_hash: string | null }>(ctx.db, 'select * from ticket_partners where slug = $1', [req.params.slug]);
      if (!partner) throw notFound();
      const token = String(req.headers['x-partner-token'] ?? pick(raw, 'token') ?? '');
      if (!partner.postback_token_hash || !token || !safeEqual(sha256(token), partner.postback_token_hash)) {
        throw new AppError(401, 'bad_token', L('Wrong or missing partner token', 'Mã đối tác sai hoặc thiếu'));
      }
      const b = parse(Postback, {
        order: pick(raw, 'order', 'order_id', 'transaction_id'),
        amount: pick(raw, 'amount', 'sale_amount'),
        currency: pick(raw, 'currency'),
        status: pick(raw, 'status'),
        click: pick(raw, 'click', 'click_id', 'sub1', 'subid'),
        commission: pick(raw, 'commission'),
        at: pick(raw, 'at', 'time'),
      });
      const { token: _drop, ...payload } = raw;
      const now = ctx.clock.now();
      const out = await recordConversion(ctx.db, partner, {
        orderRef: b.order, amount: Math.round(b.amount), currency: b.currency, status: conversionStatus(b.status),
        clickId: b.click && isUuid(b.click) ? b.click : null,
        commission: b.commission === undefined ? null : Math.round(b.commission),
        occurredAt: b.at ?? now, payload,
      }, now);
      return reply.code(out.created ? 201 : 200).send({ ok: true, id: out.id, matchedClick: out.matched });
    },
  });
}
