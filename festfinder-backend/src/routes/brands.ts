import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../db/index.ts';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { cityBySlug, cityLabel, citySlug } from '../lib/places.ts';
import { isStyle } from '../lib/styles.ts';
import { dateStr, parse, uuid } from '../lib/validate.ts';
import { requireAdmin, requireUser } from '../http/guards.ts';
import { appendAudit } from '../services/audit.ts';
import { notifyUser } from '../services/notify.ts';
import { styleItem } from '../services/artists.ts';

/*
 * Brand campaigns (migration 026). The team posts them for a brand; only artists who said
 * they are open to brands see them and say they are interested; the team picks.
 *
 *   artists   GET /brand-campaigns, POST /brand-campaigns/:id/interest, GET /me/artist/brand-interests,
 *             POST /me/artist/brand-interests/:id/withdraw
 *   team      GET/POST /admin/brand-campaigns, PATCH /admin/brand-campaigns/:id,
 *             GET /admin/brand-campaigns/:id/interests, POST /admin/brand-campaigns/:id/interests/:iid
 */

const fee = z.coerce.number().int().min(0).max(1e12);
const Fields = {
  brandName: z.string().trim().min(2).max(80),
  title: z.string().trim().min(3).max(120),
  brief: z.string().trim().max(3000),
  cities: z.array(citySlug).max(10),
  styles: z.array(z.string().refine(isStyle, 'unknown style')).max(8),
  feeMin: fee.nullable(),
  feeMax: fee.nullable(),
  startsOn: dateStr.nullable(),
  closesOn: dateStr.nullable(),
  status: z.enum(['draft', 'open', 'closed']),
  affiliateLinkId: uuid.nullable(),
};
const Create = z.object({
  ...Fields,
  brief: Fields.brief.default(''), cities: Fields.cities.default([]), styles: Fields.styles.default([]),
  feeMin: Fields.feeMin.default(null), feeMax: Fields.feeMax.default(null), startsOn: Fields.startsOn.default(null),
  closesOn: Fields.closesOn.default(null), status: Fields.status.default('open'), affiliateLinkId: Fields.affiliateLinkId.default(null),
});
const Update = z.object(Fields).partial();
const COLUMN: Record<string, string> = {
  brandName: 'brand_name', title: 'title', brief: 'brief', cities: 'cities', styles: 'styles', feeMin: 'fee_min', feeMax: 'fee_max',
  startsOn: 'starts_on', closesOn: 'closes_on', status: 'status', affiliateLinkId: 'affiliate_link_id',
};
/** A campaign's fees are in its first city's currency; one with no city is in VND. */
const currencyOf = (cities: string[]) => (cities.length ? cityBySlug(cities[0])!.currency : 'VND');

export default async function brandRoutes(app: FastifyInstance) {
  const ctx = app.ctx;
  const today = () => ctx.clock.now().toISOString().slice(0, 10);
  const base = () => ctx.config.publicBaseUrl.replace(/\/$/, '');

  const present = (c: any) => ({
    id: c.id, brandName: c.brand_name, title: c.title, brief: c.brief,
    cities: c.cities.map((s: string) => ({ slug: s, label: cityLabel(s) })), styles: c.styles.map(styleItem),
    feeMin: c.fee_min === null ? null : Number(c.fee_min), feeMax: c.fee_max === null ? null : Number(c.fee_max), currency: c.currency,
    startsOn: c.starts_on, closesOn: c.closes_on, status: c.status, createdAt: c.created_at,
    link: c.link_code ? `${base()}/go/link/${c.link_code}?src=artist` : null,
    interests: c.interests ?? undefined,
  });
  const CAMPAIGN = `select c.*, c.starts_on::text as starts_on, c.closes_on::text as closes_on, l.code as link_code
                      from brand_campaigns c left join affiliate_links l on l.id = c.affiliate_link_id and l.enabled`;
  const feeCheck = (min: number | null | undefined, max: number | null | undefined) => {
    if (min != null && max != null && max < min) throw badRequest('fee_range', L('The top of the fee is below the bottom', 'Mức phí tối đa thấp hơn mức tối thiểu'));
  };
  const ownArtist = async (userId: string) => {
    const a = await one<{ id: string; name: string; open_to_brands: boolean }>(ctx.db, 'select id, name, open_to_brands from artists where owner_user_id = $1', [userId]);
    if (!a) throw notFound(L('You have no artist profile yet', 'Bạn chưa có hồ sơ nghệ sĩ'));
    return a;
  };
  const audit = (s: { user: { id: string; name: string | null } }, action: string, id: string, label: string, diff: { f: string; a: string; b: string }[]) =>
    appendAudit(ctx.db, {
      at: ctx.clock.now(), actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action,
      targetType: 'brand_campaign', targetId: id, targetLabel: label, diff,
    });

  // ---- artists ------------------------------------------------------------------------------

  /** Open campaigns, for an artist open to brands. Anyone else gets none, and is told why. */
  app.get('/brand-campaigns', async (req) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    if (!a.open_to_brands) return { openToBrands: false, items: [] };
    const rows = await many<any>(ctx.db,
      `${CAMPAIGN} where c.status = 'open' and (c.closes_on is null or c.closes_on >= $1) order by c.closes_on nulls last, c.created_at desc limit 100`, [today()]);
    const mine = new Map((await many<any>(ctx.db, 'select campaign_id, status from brand_campaign_interests where artist_id = $1', [a.id])).map((r) => [r.campaign_id, r.status]));
    return { openToBrands: true, items: rows.map((c) => ({ ...present(c), interest: mine.get(c.id) ?? null })) };
  });

  app.post<{ Params: { id: string } }>('/brand-campaigns/:id/interest', async (req, reply) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    if (!a.open_to_brands) throw forbidden('not_open_to_brands', L('Turn on "Open to brands" in your profile first', 'Hãy bật "Nhận hợp tác thương hiệu" trong hồ sơ trước'));
    const b = parse(z.object({ message: z.string().trim().max(2000).default('') }), req.body);
    const c = await one<any>(ctx.db, `${CAMPAIGN} where c.id = $1`, [parse(uuid, req.params.id)]);
    if (!c || c.status === 'draft') throw notFound(L('Campaign not found', 'Không tìm thấy chiến dịch'));
    if (c.status !== 'open' || (c.closes_on && c.closes_on < today())) throw conflict('campaign_closed', L('This campaign is closed', 'Chiến dịch này đã đóng'));
    const row = await one<{ id: string; created: boolean }>(ctx.db,
      `insert into brand_campaign_interests (campaign_id, artist_id, user_id, message, created_at) values ($1,$2,$3,$4,$5)
       on conflict (campaign_id, artist_id) do update set message = excluded.message,
         status = case when brand_campaign_interests.status = 'withdrawn' then 'sent' else brand_campaign_interests.status end
       returning id, (xmax = 0) as created`,
      [c.id, a.id, s.user.id, b.message, ctx.clock.now()]);
    return reply.code(row!.created ? 201 : 200).send({ id: row!.id, message: L('Interest sent', 'Đã gửi quan tâm') });
  });

  app.get('/me/artist/brand-interests', async (req) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    const rows = await many<any>(ctx.db,
      `select x.*, i.id as interest_id, i.status as interest_status, i.created_at as interest_at
         from brand_campaign_interests i join (${CAMPAIGN}) x on x.id = i.campaign_id where i.artist_id = $1 order by i.created_at desc limit 100`, [a.id]);
    return { items: rows.map((r) => ({ id: r.interest_id, status: r.interest_status, createdAt: r.interest_at, campaign: present(r) })) };
  });

  app.post<{ Params: { id: string } }>('/me/artist/brand-interests/:id/withdraw', async (req) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    const out = await one(ctx.db, `update brand_campaign_interests set status = 'withdrawn' where id = $1 and artist_id = $2 and status in ('sent', 'shortlisted') returning id`,
      [parse(uuid, req.params.id), a.id]);
    if (!out) throw notFound();
    return { ok: true };
  });

  // ---- the team -----------------------------------------------------------------------------

  app.get('/admin/brand-campaigns', async (req) => {
    requireAdmin(req);
    const rows = await many<any>(ctx.db,
      `${CAMPAIGN.replace('select c.*', `select c.*, (select count(*)::int from brand_campaign_interests i where i.campaign_id = c.id and i.status <> 'withdrawn') as interests`)}
        order by c.status = 'open' desc, c.created_at desc limit 300`);
    const open = await one<{ n: number }>(ctx.db, `select count(*)::int as n from artists where open_to_brands and owner_user_id is not null`);
    return { items: rows.map(present), artistsOpenToBrands: open!.n };
  });

  app.post('/admin/brand-campaigns', async (req, reply) => {
    const s = requireAdmin(req);
    const b = parse(Create, req.body);
    feeCheck(b.feeMin, b.feeMax);
    const row = await one<{ id: string }>(ctx.db,
      `insert into brand_campaigns (brand_name, title, brief, cities, styles, fee_min, fee_max, currency, starts_on, closes_on, status, affiliate_link_id, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id`,
      [b.brandName, b.title, b.brief, b.cities, b.styles, b.feeMin, b.feeMax, currencyOf(b.cities), b.startsOn, b.closesOn, b.status, b.affiliateLinkId, s.user.id]);
    await audit(s, 'brand_campaign.created', row!.id, `${b.brandName} · ${b.title}`, [{ f: 'status', a: '—', b: b.status }]);
    return reply.code(201).send(present(await one<any>(ctx.db, `${CAMPAIGN} where c.id = $1`, [row!.id])));
  });

  app.patch<{ Params: { id: string } }>('/admin/brand-campaigns/:id', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const before = await one<any>(ctx.db, 'select * from brand_campaigns where id = $1', [id]);
    if (!before) throw notFound();
    const b = parse(Update, req.body);
    feeCheck(b.feeMin === undefined ? (before.fee_min === null ? null : Number(before.fee_min)) : b.feeMin,
      b.feeMax === undefined ? (before.fee_max === null ? null : Number(before.fee_max)) : b.feeMax);
    const keys = Object.keys(b).filter((k) => (b as any)[k] !== undefined);
    if (!keys.length) throw badRequest('nothing_to_change', L('Nothing to change', 'Không có gì để thay đổi'));
    const cols = keys.map((k) => COLUMN[k]);
    const values = keys.map((k) => (b as any)[k]);
    if (b.cities) { cols.push('currency'); values.push(currencyOf(b.cities)); }
    await ctx.db.query(`update brand_campaigns set ${cols.map((c, i) => `${c} = $${i + 2}`).join(', ')}, updated_at = now() where id = $1`, [id, ...values]);
    await audit(s, 'brand_campaign.updated', id, `${before.brand_name} · ${before.title}`,
      keys.map((k) => ({ f: k, a: JSON.stringify(before[COLUMN[k]] ?? null).slice(0, 80), b: JSON.stringify((b as any)[k] ?? null).slice(0, 80) })));
    return present(await one<any>(ctx.db, `${CAMPAIGN} where c.id = $1`, [id]));
  });

  app.get<{ Params: { id: string } }>('/admin/brand-campaigns/:id/interests', async (req) => {
    requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const c = await one<any>(ctx.db, `${CAMPAIGN} where c.id = $1`, [id]);
    if (!c) throw notFound();
    const rows = await many<any>(ctx.db,
      `select i.*, a.slug, a.name, a.based_city, a.styles, u.email from brand_campaign_interests i join artists a on a.id = i.artist_id
         left join users u on u.id = i.user_id where i.campaign_id = $1 and i.status <> 'withdrawn' order by i.created_at`, [id]);
    return {
      campaign: present(c),
      items: rows.map((r) => ({
        id: r.id, status: r.status, message: r.message, createdAt: r.created_at,
        artist: { id: r.artist_id, slug: r.slug, name: r.name, basedIn: r.based_city ? cityLabel(r.based_city) : null, styles: r.styles.slice(0, 3).map(styleItem), email: r.email },
      })),
    };
  });

  app.post<{ Params: { id: string; iid: string } }>('/admin/brand-campaigns/:id/interests/:iid', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const { status } = parse(z.object({ status: z.enum(['shortlisted', 'declined', 'selected']) }), req.body);
    const i = await one<any>(ctx.db,
      `select i.*, a.owner_user_id, a.name as artist_name, c.brand_name, c.title from brand_campaign_interests i
         join artists a on a.id = i.artist_id join brand_campaigns c on c.id = i.campaign_id where i.id = $1 and i.campaign_id = $2`, [parse(uuid, req.params.iid), id]);
    if (!i) throw notFound();
    if (i.status === 'withdrawn') throw conflict('withdrawn', L('The artist withdrew', 'Nghệ sĩ đã rút'));
    const now = ctx.clock.now();
    await ctx.db.tx(async (q) => {
      await q.query('update brand_campaign_interests set status = $2, decided_at = $3 where id = $1', [i.id, status, now]);
      if (i.owner_user_id) {
        const words = { shortlisted: L('You are on a brand shortlist', 'Bạn đã vào danh sách chọn của thương hiệu'), declined: L('Not this time', 'Lần này chưa phù hợp'), selected: L('A brand picked you', 'Thương hiệu đã chọn bạn') }[status];
        await notifyUser(q, now, {
          userId: i.owner_user_id, topic: null, kind: 'brand_campaign', title: words, body: L(`${i.brand_name} · ${i.title}`, `${i.brand_name} · ${i.title}`),
          link: { screen: 'ops', path: '/ops/artist/opportunities?tab=brands' }, dedupeKey: `brand:${i.id}:${status}`,
        });
      }
    });
    await audit(s, 'brand_campaign.interest_decided', id, `${i.brand_name} · ${i.title}`, [{ f: i.artist_name, a: i.status, b: status }]);
    return { id: i.id, status };
  });
}
