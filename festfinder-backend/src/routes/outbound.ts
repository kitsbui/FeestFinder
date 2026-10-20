import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one } from '../db/index.ts';
import { AppError, notFound } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { parse } from '../lib/validate.ts';
import { sha256, safeEqual } from '../lib/crypto.ts';
import { isUuid } from '../http/sql.ts';
import { hostOf } from '../services/ingest/normalize.ts';
import { REF_DAYS, REF_RE } from '../lib/affiliate.ts';
import { awardSoon } from '../services/badges.ts';
import { conversionStatus, countEventMetric, countryOf, deviceOf, partnerForUrl, partnerLink, PLACEMENTS, recordConversion, referrerHostOf, sellerFor, utmLink, type Partner } from '../services/partners.ts';

/*
 * The way out to tickets, and the way back in for what was sold.
 *
 *   GET /go/<event>?src=detail&ref=<code>    every ticket button: counted, then sent to the seller for the viewer's country
 *                                            (FeestFinder sells no tickets), with the partner's tracking or UTM tags
 *   GET /r/<code>/<event>                    a short share link: the event page with the sharer's code
 *   GET /go/link/<code>?src=artist           an affiliate link (merch, a product, a campaign): counted, then redirected
 *   GET|POST /partners/<slug>/postback       a partner reports a sale (token, order, amount, click…)
 */

export const GO_SOURCES = PLACEMENTS;

const GoQuery = z.object({
  src: z.enum(GO_SOURCES).catch('detail'),
  /** The code of the person whose share link brought this visitor (kept on the phone for REF_DAYS). */
  ref: z.string().trim().toUpperCase().regex(REF_RE).optional().catch(undefined),
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
  const ownHost = hostOf(ctx.config.publicBaseUrl);
  /** Where a click came from. A robot (a crawler, a link preview) is not a click: null. */
  const origin = (req: { headers: Record<string, string | string[] | undefined>; webOrigin: string | null }) => {
    const device = deviceOf(req.headers['user-agent'] as string | undefined);
    // The web app on an address of its own is this site too.
    const own = req.webOrigin ? hostOf(req.webOrigin) : ownHost;
    return device ? { device, country: countryOf(req.headers), referrer: referrerHostOf(req.headers, own) } : null;
  };

  app.get<{ Params: { event: string } }>('/go/:event', async (req, reply) => {
    const q = parse(GoQuery, req.query);
    const key = req.params.event;
    const ev = await one<any>(ctx.db,
      `select id, slug, status, held_for_reports, entry_mode, ticket_url, event_url, ticket_links from events where ${isUuid(key) ? 'id = $1' : 'slug = $1'}`, [key]);
    if (!ev) throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
    reply.header('cache-control', 'no-store').header('x-robots-tag', 'noindex, nofollow');
    const page = `/e/${encodeURIComponent(ev.slug)}`;
    if (ev.status !== 'live' || ev.held_for_reports) return reply.redirect(page, 302);

    const now = ctx.clock.now();
    const userId = req.session?.user?.id ?? null;
    // FeestFinder sells no tickets: the seller's page, else (a Radar find that names no ticket link) the page it was found on.
    const main = ev.entry_mode !== 'paid' ? null
      : /^https?:\/\//i.test(ev.ticket_url ?? '') ? String(ev.ticket_url)
      : /^https?:\/\//i.test(ev.event_url ?? '') ? String(ev.event_url) : null;
    if (!main) return reply.redirect(page, 302);

    const who = origin(req);
    // The seller for the viewer's country (an extra link the organiser listed for it), else the main link.
    const ticketUrl = sellerFor(main, ev.ticket_links, who?.country ?? countryOf(req.headers));
    const partner: Partner | null = await partnerForUrl(ctx.db, ticketUrl);
    const target: 'partner' | 'organizer' = partner ? 'partner' : 'organizer';
    // A seller without a deal still sees FeestFinder in its analytics.
    let location = partner ? ticketUrl : utmLink(ticketUrl, ev.slug, q.src);
    if (!who) return reply.redirect(location, 302);

    // Who referred this click: a share link's code, never the person clicking, and only once
    // that link was opened for this event in the last REF_DAYS (a code pasted by hand earns nothing).
    let refUser: string | null = null;
    if (q.ref) {
      const r = await one<{ id: string }>(ctx.db,
        `select u.id from users u
          where u.ref_code = $1 and u.id is distinct from $2::uuid
            and exists (select 1 from share_visits v where v.ref_user = u.id and v.event_id = $3 and v.created_at >= $4 and v.created_at <= $5)`,
        [q.ref, userId, ev.id, new Date(now.getTime() - REF_DAYS * 86_400_000), now]);
      refUser = r?.id ?? null;
    }
    const click = await one<{ id: string }>(ctx.db,
      `insert into outbound_clicks (event_id, partner_id, user_id, source, target, target_host, device, country, referrer_host, created_at, ref_user)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id`,
      [ev.id, partner?.id ?? null, userId, q.src, target, hostOf(location), who.device, who.country, who.referrer, now, refUser]);
    if (partner) {
      try { location = partnerLink(location, partner, click!.id); } catch { /* a broken template: the plain link still sells */ }
    }
    const dedupe = `${req.clientIp}|${userId ?? ''}|${ev.id}`;
    const last = seen.get(dedupe);
    if (!last || now.getTime() - last >= 30 * 60_000) {
      seen.set(dedupe, now.getTime());
      if (seen.size > 50_000) seen.clear();
      await countEventMetric(ctx.db, ev.id, 'ticket_clicks', q.src, now);
    }
    return reply.redirect(location, 302);
  });

  /** A short share link: /r/<code>/<event> opens the event page with the sharer's code, so its "Mua vé" carries it. */
  app.get<{ Params: { ref: string; event: string } }>('/r/:ref/:event', async (req, reply) => {
    reply.header('cache-control', 'no-store').header('x-robots-tag', 'noindex, nofollow');
    const ev = await one<{ slug: string }>(ctx.db, 'select slug from events where slug = $1', [req.params.event]);
    if (!ev) return reply.redirect('/', 302);
    const ref = req.params.ref.toUpperCase();
    const page = `/e/${encodeURIComponent(ev.slug)}`;
    return reply.redirect(REF_RE.test(ref) ? `${page}?ref=${ref}&ch=copy` : page, 302);
  });

  app.get<{ Params: { code: string } }>('/go/link/:code', async (req, reply) => {
    const q = parse(z.object({ src: z.enum(GO_SOURCES).catch('external') }), req.query);
    const link = await one<any>(ctx.db, 'select * from affiliate_links where code = $1', [req.params.code.toLowerCase()]);
    if (!link || !link.enabled) throw notFound(L('This link no longer works', 'Liên kết này không còn hoạt động'));
    reply.header('cache-control', 'no-store').header('x-robots-tag', 'noindex, nofollow');
    let location = String(link.destination_url);
    const who = origin(req);
    if (!who) return reply.redirect(location, 302);
    // A link's own partner first, else whichever partner sells on that site.
    const partner = link.partner_id
      ? await one<Partner>(ctx.db, 'select * from ticket_partners where id = $1 and enabled', [link.partner_id])
      : await partnerForUrl(ctx.db, location);
    const click = await one<{ id: string }>(ctx.db,
      `insert into outbound_clicks (link_id, partner_id, user_id, source, target, target_host, device, country, referrer_host, created_at)
       values ($1,$2,$3,$4,'link',$5,$6,$7,$8,$9) returning id`,
      [link.id, partner?.id ?? null, req.session?.user?.id ?? null, q.src, hostOf(location), who.device, who.country, who.referrer, ctx.clock.now()]);
    if (partner) {
      try { location = partnerLink(location, partner, click!.id); } catch { /* the plain link still works */ }
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
      const ref = await one<{ ref_user: string | null }>(ctx.db, 'select ref_user from partner_conversions where id = $1', [out.id]);
      awardSoon(ctx, 'user', ref?.ref_user);
      return reply.code(out.created ? 201 : 200).send({ ok: true, id: out.id, matchedClick: out.matched });
    },
  });
}
