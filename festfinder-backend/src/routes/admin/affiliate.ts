import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../../db/index.ts';
import { badRequest, conflict, notFound } from '../../lib/errors.ts';
import { L } from '../../lib/i18n.ts';
import { slugify } from '../../lib/contact.ts';
import { randomCode } from '../../lib/crypto.ts';
import { dateStr, parse, uuid } from '../../lib/validate.ts';
import { requireAdmin, requireOrganizer, requireUser } from '../../http/guards.ts';
import { appendAudit } from '../../services/audit.ts';

/*
 * Affiliate links and the money side of partners.
 *
 *   GET/POST/PATCH /admin/affiliate/links        short /go/link/<code> links: merch, products, campaigns
 *   GET  /admin/affiliate/summary?days=30        clicks by placement, device, country, partner and link; sales by partner
 *   GET  /admin/affiliate/payouts                each partner's settled periods
 *   POST /admin/affiliate/payouts                settle a partner's approved sales over a period
 *   POST /admin/affiliate/payouts/:id/paid       the money arrived
 *   GET  /organizer/affiliate                    where an organiser's ticket buttons sent people
 *   GET  /me/artist/links                        an artist's own links and their clicks
 */

const KIND = ['artist', 'product', 'brand', 'campaign', 'partner'] as const;

const LinkFields = {
  label: z.string().trim().min(2).max(120),
  destinationUrl: z.string().trim().url().max(1000).refine((u) => u.startsWith('https://'), 'An https link'),
  kind: z.enum(KIND),
  code: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,40}$/),
  artistId: uuid.nullable(),
  organizerId: uuid.nullable(),
  partnerId: uuid.nullable(),
  enabled: z.boolean(),
};
const LinkCreate = z.object({
  ...LinkFields,
  kind: LinkFields.kind.default('campaign'),
  code: LinkFields.code.optional(),
  artistId: LinkFields.artistId.default(null),
  organizerId: LinkFields.organizerId.default(null),
  partnerId: LinkFields.partnerId.default(null),
  enabled: LinkFields.enabled.default(true),
});
const LinkUpdate = z.object(LinkFields).partial();
const COLUMN: Record<string, string> = {
  label: 'label', destinationUrl: 'destination_url', kind: 'kind', code: 'code', artistId: 'artist_id', organizerId: 'organizer_id', partnerId: 'partner_id', enabled: 'enabled',
};

export default async function adminAffiliateRoutes(app: FastifyInstance) {
  const ctx = app.ctx;
  const base = () => ctx.config.publicBaseUrl.replace(/\/$/, '');
  const since = (days: number) => new Date(ctx.clock.now().getTime() - days * 86400_000);

  const present = (r: any) => ({
    id: r.id, code: r.code, label: r.label, destinationUrl: r.destination_url, kind: r.kind, enabled: r.enabled, createdAt: r.created_at,
    url: `${base()}/go/link/${r.code}`,
    artist: r.artist_id ? { id: r.artist_id, slug: r.artist_slug, name: r.artist_name } : null,
    organizer: r.organizer_id ? { id: r.organizer_id, slug: r.organizer_slug, name: r.organizer_name } : null,
    partner: r.partner_id ? { id: r.partner_id, name: r.partner_name } : null,
    clicks30: r.clicks30 ?? 0,
  });
  const LINKS = `select l.*, a.slug as artist_slug, a.name as artist_name, o.slug as organizer_slug, o.name as organizer_name, p.name as partner_name,
                        (select count(*)::int from outbound_clicks k where k.link_id = l.id and k.created_at >= $1) as clicks30
                   from affiliate_links l left join artists a on a.id = l.artist_id left join organizers o on o.id = l.organizer_id
                   left join ticket_partners p on p.id = l.partner_id`;

  const audit = (s: { user: { id: string; name: string | null } }, action: string, target: { type: string; id: string; label: string }, diff: { f: string; a: string; b: string }[]) =>
    appendAudit(ctx.db, {
      at: ctx.clock.now(), actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action,
      targetType: target.type, targetId: target.id, targetLabel: target.label, diff,
    });

  app.get('/admin/affiliate/links', async (req) => {
    requireAdmin(req);
    const rows = await many<any>(ctx.db, `${LINKS} order by l.enabled desc, l.created_at desc limit 500`, [since(30)]);
    return { items: rows.map(present), kinds: KIND };
  });

  app.post('/admin/affiliate/links', async (req, reply) => {
    const s = requireAdmin(req);
    const b = parse(LinkCreate, req.body);
    let code = b.code ?? (slugify(b.label).slice(0, 32) || 'link');
    if (await one(ctx.db, 'select 1 from affiliate_links where code = $1', [code])) {
      if (b.code) throw conflict('code_taken', L('Another link has this code', 'Đã có liên kết dùng mã này'));
      code = `${code}-${randomCode(4).toLowerCase()}`;
    }
    const row = await one<{ id: string }>(ctx.db,
      `insert into affiliate_links (code, label, destination_url, kind, artist_id, organizer_id, partner_id, enabled, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
      [code, b.label, b.destinationUrl, b.kind, b.artistId, b.organizerId, b.partnerId, b.enabled, s.user.id]).catch((e) => {
      if (e.code === '23503') throw badRequest('unknown_owner', L('That artist, organiser or partner does not exist', 'Không có nghệ sĩ, nhà tổ chức hay đối tác này'));
      throw e;
    });
    await audit(s, 'affiliate_link.created', { type: 'affiliate_link', id: row!.id, label: b.label }, [{ f: 'destination', a: '—', b: b.destinationUrl.slice(0, 80) }]);
    const out = await one<any>(ctx.db, `${LINKS} where l.id = $2`, [since(30), row!.id]);
    return reply.code(201).send(present(out));
  });

  app.patch<{ Params: { id: string } }>('/admin/affiliate/links/:id', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const before = await one<any>(ctx.db, 'select * from affiliate_links where id = $1', [id]);
    if (!before) throw notFound();
    const b = parse(LinkUpdate, req.body);
    const keys = Object.keys(b).filter((k) => (b as any)[k] !== undefined);
    if (!keys.length) throw badRequest('nothing_to_change', L('Nothing to change', 'Không có gì để thay đổi'));
    if (b.code && b.code !== before.code && await one(ctx.db, 'select 1 from affiliate_links where code = $1', [b.code])) {
      throw conflict('code_taken', L('Another link has this code', 'Đã có liên kết dùng mã này'));
    }
    await ctx.db.query(`update affiliate_links set ${keys.map((k, i) => `${COLUMN[k]} = $${i + 2}`).join(', ')}, updated_at = now() where id = $1`,
      [id, ...keys.map((k) => (b as any)[k])]);
    await audit(s, 'affiliate_link.updated', { type: 'affiliate_link', id, label: before.label },
      keys.map((k) => ({ f: k, a: JSON.stringify(before[COLUMN[k]] ?? null).slice(0, 80), b: JSON.stringify((b as any)[k] ?? null).slice(0, 80) })));
    return present(await one<any>(ctx.db, `${LINKS} where l.id = $2`, [since(30), id]));
  });

  app.get('/admin/affiliate/summary', async (req) => {
    requireAdmin(req);
    const { days } = parse(z.object({ days: z.coerce.number().int().min(1).max(365).default(30) }), req.query);
    const from = since(days);
    const by = (col: string) => many<{ key: string | null; n: number }>(ctx.db,
      `select ${col} as key, count(*)::int as n from outbound_clicks where created_at >= $1 group by 1 order by n desc limit 12`, [from]);
    const [placement, device, country, target, partners, links, sales] = await Promise.all([
      by('source'), by('device'), by('country'), by('target'),
      many<any>(ctx.db, `select p.id, p.name, count(k.id)::int as n from outbound_clicks k join ticket_partners p on p.id = k.partner_id
                          where k.created_at >= $1 group by p.id order by n desc limit 12`, [from]),
      many<any>(ctx.db, `select l.id, l.code, l.label, count(k.id)::int as n from outbound_clicks k join affiliate_links l on l.id = k.link_id
                          where k.created_at >= $1 group by l.id order by n desc limit 12`, [from]),
      many<any>(ctx.db, `select p.id, p.name, c.currency, count(*)::int as orders,
                                coalesce(sum(c.amount) filter (where c.status in ('approved', 'paid')), 0)::bigint as sales,
                                coalesce(sum(c.commission) filter (where c.status in ('approved', 'paid')), 0)::bigint as earned,
                                coalesce(sum(c.commission) filter (where c.status = 'approved' and c.payout_id is null), 0)::bigint as unsettled
                           from partner_conversions c join ticket_partners p on p.id = c.partner_id
                          where c.occurred_at >= $1 group by p.id, c.currency order by earned desc`, [from]),
    ]);
    return {
      days,
      clicks: target.reduce((a, r) => a + r.n, 0),
      byPlacement: placement, byDevice: device, byCountry: country, byTarget: target,
      byPartner: partners, byLink: links,
      sales: sales.map((r) => ({ partner: { id: r.id, name: r.name }, currency: r.currency, orders: r.orders, sales: Number(r.sales), earned: Number(r.earned), unsettled: Number(r.unsettled) })),
    };
  });

  // ---- payouts ------------------------------------------------------------------------------

  const presentPayout = (r: any) => ({
    id: r.id, partner: { id: r.partner_id, name: r.partner_name }, from: r.period_from, to: r.period_to, currency: r.currency,
    conversions: r.conversions, amount: Number(r.amount), commission: Number(r.commission), status: r.status, note: r.note, createdAt: r.created_at, paidAt: r.paid_at,
  });
  const PAYOUTS = `select y.*, y.period_from::text as period_from, y.period_to::text as period_to, p.name as partner_name
                     from affiliate_payouts y join ticket_partners p on p.id = y.partner_id`;

  app.get('/admin/affiliate/payouts', async (req) => {
    requireAdmin(req);
    return { items: (await many<any>(ctx.db, `${PAYOUTS} order by y.created_at desc limit 200`)).map(presentPayout) };
  });

  /**
   * Settles a partner's approved, unsettled sales in a period (by when they happened). Pending
   * and rejected ones stay out; a sale already settled never joins another payout.
   */
  app.post('/admin/affiliate/payouts', async (req, reply) => {
    const s = requireAdmin(req);
    const b = parse(z.object({ partnerId: uuid, from: dateStr, to: dateStr, currency: z.string().regex(/^[A-Z]{3}$/).default('VND'), note: z.string().max(1000).default('') }), req.body);
    if (b.to < b.from) throw badRequest('bad_period', L('The period ends before it starts', 'Kỳ kết thúc trước khi bắt đầu'));
    const partner = await one<{ id: string; name: string }>(ctx.db, 'select id, name from ticket_partners where id = $1', [b.partnerId]);
    if (!partner) throw notFound();
    const out = await ctx.db.tx(async (q) => {
      const due = await many<{ id: string; amount: string; commission: string }>(q,
        `select id, amount, commission from partner_conversions
          where partner_id = $1 and currency = $2 and status = 'approved' and payout_id is null
            and occurred_at >= ($3::date)::timestamptz and occurred_at < ($4::date + 1)::timestamptz for update`,
        [b.partnerId, b.currency, b.from, b.to]);
      if (!due.length) throw badRequest('nothing_to_settle', L('No approved sales to settle in that period', 'Không có đơn đã duyệt nào trong kỳ này'));
      const amount = due.reduce((a, r) => a + Number(r.amount), 0);
      const commission = due.reduce((a, r) => a + Number(r.commission), 0);
      const row = await one<{ id: string }>(q,
        `insert into affiliate_payouts (partner_id, period_from, period_to, currency, conversions, amount, commission, note, created_by)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
        [b.partnerId, b.from, b.to, b.currency, due.length, amount, commission, b.note, s.user.id]);
      await q.query('update partner_conversions set payout_id = $2 where id = any($1::uuid[])', [due.map((r) => r.id), row!.id]);
      return row!.id;
    });
    await audit(s, 'affiliate_payout.created', { type: 'ticket_partner', id: partner.id, label: partner.name }, [{ f: 'period', a: '—', b: `${b.from} → ${b.to}` }]);
    return reply.code(201).send(presentPayout(await one<any>(ctx.db, `${PAYOUTS} where y.id = $1`, [out])));
  });

  app.post<{ Params: { id: string } }>('/admin/affiliate/payouts/:id/paid', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const y = await one<any>(ctx.db, `${PAYOUTS} where y.id = $1`, [id]);
    if (!y) throw notFound();
    if (y.status === 'paid') throw conflict('already_paid', L('Already marked paid', 'Đã đánh dấu đã nhận tiền'));
    const now = ctx.clock.now();
    await ctx.db.tx(async (q) => {
      await q.query(`update affiliate_payouts set status = 'paid', paid_at = $2 where id = $1`, [id, now]);
      await q.query(`update partner_conversions set status = 'paid' where payout_id = $1`, [id]);
    });
    await audit(s, 'affiliate_payout.paid', { type: 'ticket_partner', id: y.partner_id, label: y.partner_name }, [{ f: 'payout', a: 'open', b: 'paid' }]);
    return presentPayout(await one<any>(ctx.db, `${PAYOUTS} where y.id = $1`, [id]));
  });

  // ---- what organisers and artists see --------------------------------------------------------

  /** Where an organiser's ticket buttons sent people. Partner commissions are FeestFinder's, not shown. */
  app.get('/organizer/affiliate', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const { days } = parse(z.object({ days: z.coerce.number().int().min(1).max(365).default(30) }), req.query);
    const from = since(days);
    const by = (col: string) => many<{ key: string | null; n: number }>(ctx.db,
      `select k.${col} as key, count(*)::int as n from outbound_clicks k join events e on e.id = k.event_id
        where e.organizer_id = $1 and k.created_at >= $2 group by 1 order by n desc limit 10`, [org.organizerId, from]);
    const [placement, device, country, target, events] = await Promise.all([
      by('source'), by('device'), by('country'), by('target'),
      many<any>(ctx.db, `select e.id, e.slug, e.title, count(*)::int as n from outbound_clicks k join events e on e.id = k.event_id
                          where e.organizer_id = $1 and k.created_at >= $2 group by e.id order by n desc limit 10`, [org.organizerId, from]),
    ]);
    return { days, clicks: target.reduce((a, r) => a + r.n, 0), byPlacement: placement, byDevice: device, byCountry: country, byTarget: target, byEvent: events };
  });

  app.get('/me/artist/links', async (req) => {
    const s = requireUser(req);
    const a = await one<{ id: string }>(ctx.db, 'select id from artists where owner_user_id = $1', [s.user.id]);
    if (!a) throw notFound(L('You have no artist profile yet', 'Bạn chưa có hồ sơ nghệ sĩ'));
    const rows = await many<any>(ctx.db, `${LINKS} where l.artist_id = $2 and l.enabled order by l.created_at desc`, [since(30), a.id]);
    return { items: rows.map((r) => ({ code: r.code, label: r.label, url: `${base()}/go/link/${r.code}`, destinationUrl: r.destination_url, clicks30: r.clicks30 })) };
  });
}
