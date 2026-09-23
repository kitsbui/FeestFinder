import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { json, many, one } from '../../db/index.ts';
import { badRequest, conflict, notFound } from '../../lib/errors.ts';
import { GENRES, L, type Localized } from '../../lib/i18n.ts';
import { initialsOf, searchNormalize, slugify } from '../../lib/contact.ts';
import { vnDate } from '../../lib/time.ts';
import { dateStr, localized, parse, uuid } from '../../lib/validate.ts';
import { requireAdmin, type UserSession } from '../../http/guards.ts';
import { CARD_COLUMNS, presentCard } from '../../presenters/event.ts';
import { appendAudit } from '../../services/audit.ts';

const AD_ART: Record<string, string> = {
  'F&B': 'linear-gradient(135deg,#FFB35C,#FF5C5C)',
  Fashion: 'linear-gradient(135deg,#8C6BFF,#FF6FA5)',
  Healthcare: 'linear-gradient(135deg,#2AC4E8,#1B6BD6)',
};

const admin = (s: UserSession) => ({ actorType: 'admin' as const, actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin' });

const dm = (d: string | null) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : null);

function shelfPhase(s: any, today: string): { phase: string; label: Localized } {
  if (!s.enabled) return { phase: 'off', label: L('Off', 'Đã tắt') };
  if (!s.starts_on && !s.ends_on) return { phase: 'always', label: L('Live now', 'Đang chạy') };
  if (s.starts_on && today < s.starts_on) return { phase: 'scheduled', label: L(`Scheduled ${dm(s.starts_on)}`, `Lên lịch ${dm(s.starts_on)}`) };
  if (s.ends_on && today > s.ends_on) return { phase: 'ended', label: L('Ended', 'Đã kết thúc') };
  return { phase: 'live', label: s.ends_on ? L(`Live · ends ${dm(s.ends_on)}`, `Đang chạy · hết ${dm(s.ends_on)}`) : L('Live now', 'Đang chạy') };
}

export default async function adminCatalogRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  // ---- organiser verification ---------------------------------------------------

  app.get('/admin/organizers', async (req) => {
    requireAdmin(req);
    const { state, type, q } = parse(z.object({
      state: z.enum(['all', 'pending', 'verified', 'flagged']).default('all'),
      type: z.enum(['all', 'promoter', 'venue', 'company', 'agency', 'public']).default('all'),
      q: z.string().max(80).optional(),
    }), req.query);
    const rows = await many<any>(ctx.db,
      `select o.*, (select count(*)::int from events e where e.organizer_id = o.id and e.published_at is not null) as events,
              (select count(*)::int from events e where e.organizer_id = o.id and e.status = 'live' and (e.ends_at is null or e.ends_at >= $3)) as live_events,
              (select count(*)::int from events e where e.organizer_id = o.id and e.status = 'in_review') as review_events,
              (select count(*)::int from events e where e.organizer_id = o.id) as all_events,
              (select count(*)::int from organizer_members m where m.organizer_id = o.id) as members,
              (select u.email from organizer_members m join users u on u.id = m.user_id where m.organizer_id = o.id order by m.role = 'owner' desc limit 1) as owner_email
         from organizers o where ($1 = 'all' or o.verification_state = $1) and ($2 = 'all' or o.type = $2)
        order by (o.verification_state = 'verified'), o.created_at`, [state, type, ctx.clock.now()]);
    const needle = q ? searchNormalize(q) : '';
    return {
      items: rows.filter((o) => !needle || searchNormalize(`${o.name} ${o.legal_name ?? ''} ${o.email ?? ''} ${o.owner_email ?? ''} ${o.tax_code ?? ''}`).includes(needle)).map((o) => ({
        id: o.id, slug: o.slug, name: o.name, initials: o.initials, state: o.verification_state, events: o.events, since: o.since_year,
        strikes: o.strikes, suspended: !!o.suspended_at,
        docs: { id: o.doc_id, tax: o.doc_tax, bank: o.doc_bank },
        legalName: o.legal_name, taxCode: o.tax_code, bankVerified: o.bank_verified,
        type: o.type, logoUrl: o.logo_url, art: o.art, followers: o.followers_count, liveEvents: o.live_events, reviewEvents: o.review_events,
        allEvents: o.all_events, members: o.members, email: o.email ?? o.owner_email, hotline: o.hotline, bankOnFile: !!o.bank_account_no,
        createdAt: o.created_at,
      })),
      note: L('Verified organizers carry a badge on every event card and rank higher in search.', 'Nhà tổ chức đã xác minh được hiện huy hiệu trên mọi thẻ sự kiện và được đẩy lên trong kết quả tìm kiếm.'),
    };
  });

  app.patch<{ Params: { id: string } }>('/admin/organizers/:id', async (req) => {
    const s = requireAdmin(req);
    const body = parse(z.object({
      state: z.enum(['pending', 'verified', 'flagged']).optional(),
      docs: z.object({ id: z.boolean(), tax: z.boolean(), bank: z.boolean() }).partial().optional(),
      bankVerified: z.boolean().optional(),
    }), req.body);
    const now = ctx.clock.now();
    const out = await ctx.db.tx(async (q) => {
      const o = await one<any>(q, 'select * from organizers where id = $1 for update', [parse(uuid, req.params.id)]);
      if (!o) throw notFound();
      if (body.state === 'verified' && !(body.docs?.id ?? o.doc_id)) {
        throw badRequest('documents_missing', L('An ID document is needed before verifying', 'Cần giấy tờ tuỳ thân trước khi xác minh'));
      }
      await q.query(
        `update organizers set verification_state = coalesce($2, verification_state), doc_id = coalesce($3, doc_id), doc_tax = coalesce($4, doc_tax),
                doc_bank = coalesce($5, doc_bank), bank_verified = coalesce($6, bank_verified) where id = $1`,
        [o.id, body.state ?? null, body.docs?.id ?? null, body.docs?.tax ?? null, body.docs?.bank ?? null, body.bankVerified ?? null]);
      if (body.state && body.state !== o.verification_state) {
        const verified = body.state === 'verified';
        await appendAudit(q, {
          at: now, ...admin(s), action: verified ? 'organizer.verified' : 'organizer.revoked', targetType: 'organizer', targetId: o.id, targetLabel: o.name,
          diff: [{ f: 'verified', a: String(o.verification_state === 'verified'), b: String(verified) }, ...(verified ? [{ f: 'badge', a: '—', b: 'shown on all cards' }] : [{ f: 'state', a: o.verification_state, b: body.state }])],
        });
      }
      return { name: o.name, verified: body.state === 'verified', changed: !!body.state && body.state !== o.verification_state };
    });
    return { ok: true, message: out.changed ? (out.verified ? L(`${out.name} verified`, `Đã xác minh ${out.name}`) : L(`${out.name} revoked`, `Đã thu hồi ${out.name}`)) : null };
  });

  // ---- featured shelves -----------------------------------------------------------

  const presentShelf = async (s: any, today: string, now: Date) => {
    const rows = await many<any>(ctx.db,
      `select ${CARD_COLUMNS}, si.sort from shelf_items si join events e on e.id = si.event_id join organizers o on o.id = e.organizer_id
        where si.shelf_id = $1 order by si.sort`, [s.id]);
    const p = shelfPhase(s, today);
    return {
      id: s.id, slug: s.slug, name: s.name, note: s.note, enabled: s.enabled, startsOn: s.starts_on, endsOn: s.ends_on,
      phase: p.phase, phaseLabel: p.label,
      items: rows.map((r) => presentCard(r, { now, viewer: null })),
    };
  };

  app.get('/admin/shelves', async (req) => {
    requireAdmin(req);
    const now = ctx.clock.now();
    const shelves = await many<any>(ctx.db, 'select * from shelves order by sort, created_at');
    const items = [];
    for (const s of shelves) items.push(await presentShelf(s, vnDate(now), now));
    return { items };
  });

  app.post('/admin/shelves', async (req, reply) => {
    requireAdmin(req);
    const body = parse(z.object({ name: localized, note: localized.optional() }), req.body);
    const row = await one<any>(ctx.db,
      `insert into shelves (slug, name, note, sort) values ($1,$2,$3,(select coalesce(max(sort), 0) + 1 from shelves)) returning *`,
      [`${slugify(body.name.en)}-${Date.now().toString(36)}`, json(body.name), json(body.note ?? { en: '', vi: '' })]);
    return reply.code(201).send(await presentShelf(row, vnDate(ctx.clock.now()), ctx.clock.now()));
  });

  app.patch<{ Params: { id: string } }>('/admin/shelves/:id', async (req) => {
    const s = requireAdmin(req);
    const body = parse(z.object({
      enabled: z.boolean().optional(), startsOn: dateStr.nullable().optional(), endsOn: dateStr.nullable().optional(),
      name: localized.optional(), note: localized.optional(),
    }), req.body);
    const now = ctx.clock.now();
    const row = await ctx.db.tx(async (q) => {
      const old = await one<any>(q, 'select * from shelves where id = $1 for update', [parse(uuid, req.params.id)]);
      if (!old) throw notFound();
      const startsOn = body.startsOn !== undefined ? body.startsOn : old.starts_on;
      const endsOn = body.endsOn !== undefined ? body.endsOn : old.ends_on;
      if (startsOn && endsOn && endsOn < startsOn) throw badRequest('window_order', L('The end date is before the start date', 'Ngày kết thúc trước ngày bắt đầu'));
      const next = await one<any>(q,
        `update shelves set enabled = coalesce($2, enabled), starts_on = $3, ends_on = $4, name = coalesce($5, name), note = coalesce($6, note) where id = $1 returning *`,
        [old.id, body.enabled ?? null, startsOn, endsOn, body.name ? json(body.name) : null, body.note ? json(body.note) : null]);
      const win = (a: string | null, b: string | null) => (a && b ? `${dm(a)} → ${dm(b)}` : '—');
      if (body.enabled !== undefined && body.enabled !== old.enabled) {
        await appendAudit(q, {
          at: now, ...admin(s), action: body.enabled ? 'shelf.published' : 'shelf.hidden', targetType: 'shelf', targetId: old.id, targetLabel: old.name.en,
          diff: [{ f: 'visible', a: String(old.enabled), b: String(body.enabled) }, { f: 'window', a: win(old.starts_on, old.ends_on), b: win(startsOn, endsOn) }],
        });
      } else if (startsOn !== old.starts_on || endsOn !== old.ends_on) {
        await appendAudit(q, {
          at: now, ...admin(s), action: 'shelf.window_changed', targetType: 'shelf', targetId: old.id, targetLabel: old.name.en,
          diff: [{ f: 'window', a: win(old.starts_on, old.ends_on), b: win(startsOn, endsOn) }],
        });
      }
      return next;
    });
    return presentShelf(row, vnDate(now), now);
  });

  app.put<{ Params: { id: string } }>('/admin/shelves/:id/items', async (req) => {
    const s = requireAdmin(req);
    const { eventIds } = parse(z.object({ eventIds: z.array(uuid).max(30) }), req.body);
    const now = ctx.clock.now();
    const row = await ctx.db.tx(async (q) => {
      const shelf = await one<any>(q, 'select * from shelves where id = $1', [parse(uuid, req.params.id)]);
      if (!shelf) throw notFound();
      const live = await many<any>(q, `select id, title from events where id = any($1::uuid[]) and status = 'live'`, [eventIds]);
      if (live.length !== new Set(eventIds).size) throw badRequest('events_not_live', L('Only live listings can go on a shelf', 'Chỉ tin đang chạy mới vào được mục nổi bật'));
      const before = await many<any>(q, 'select event_id from shelf_items where shelf_id = $1', [shelf.id]);
      await q.query('delete from shelf_items where shelf_id = $1', [shelf.id]);
      for (const [i, id] of eventIds.entries()) await q.query('insert into shelf_items (shelf_id, event_id, sort) values ($1,$2,$3)', [shelf.id, id, i]);
      const beforeIds = new Set(before.map((b) => b.event_id));
      for (const e of live.filter((x) => !beforeIds.has(x.id))) {
        await appendAudit(q, { at: now, ...admin(s), action: 'shelf.item_added', targetType: 'event', targetId: e.id, targetLabel: e.title,
          diff: [{ f: 'shelf_items', a: String(before.length), b: String(eventIds.length) }] });
      }
      for (const b of before.filter((x) => !eventIds.includes(x.event_id))) {
        const t = await one<any>(q, 'select title from events where id = $1', [b.event_id]);
        await appendAudit(q, { at: now, ...admin(s), action: 'shelf.item_removed', targetType: 'event', targetId: b.event_id, targetLabel: t?.title ?? '—',
          diff: [{ f: 'shelf_items', a: String(before.length), b: String(eventIds.length) }] });
      }
      return shelf;
    });
    return presentShelf(row, vnDate(now), now);
  });

  /** Exactly what the Explore row renders, plus the live window. */
  app.get<{ Params: { id: string } }>('/admin/shelves/:id/preview', async (req) => {
    requireAdmin(req);
    const now = ctx.clock.now();
    const shelf = await one<any>(ctx.db, 'select * from shelves where id = $1', [parse(uuid, req.params.id)]);
    if (!shelf) throw notFound();
    const view = await presentShelf(shelf, vnDate(now), now);
    return {
      ...view,
      items: view.items.map((c, i) => ({ ...c, tag: i === 0 ? L('Featured', 'Nổi bật') : L('Picked', 'Được chọn') })),
      window: shelf.starts_on && shelf.ends_on ? L(`Shows ${dm(shelf.starts_on)} → ${dm(shelf.ends_on)}`, `Hiển thị ${dm(shelf.starts_on)} → ${dm(shelf.ends_on)}`) : L('No date window', 'Không giới hạn thời gian'),
      note: shelf.enabled
        ? L('This is the real Explore row on app and web — it sits directly under the search bar.', 'Đúng thiết kế dãy này trên app và web — vị trí ngay dưới thanh tìm kiếm ở trang Khám phá.')
        : L('The shelf is off. This is how it would look once switched on.', 'Dãy đang tắt. Đây là hình dạng nó sẽ có khi bật.'),
    };
  });

  // ---- advertising ---------------------------------------------------------------------

  const presentCampaign = (c: any) => ({
    id: c.id, brand: c.brand, category: c.category, logo: c.logo, art: c.art, placement: c.placement, active: c.active,
    headline: c.headline, body: c.body, cta: c.cta, url: c.url, genres: c.genres, areas: c.areas, isAlcohol: c.is_alcohol,
    impressions: c.impressions, clicks: c.clicks, ctrPct: c.impressions ? Math.round((c.clicks / c.impressions) * 10000) / 100 : null,
    spend: c.spend, budgetTotal: c.budget_total, dailyCap: c.daily_cap,
    pacingPct: c.budget_total ? Math.min(100, Math.round((c.spend / c.budget_total) * 100)) : 0,
  });

  app.get('/admin/ads', async (req) => {
    requireAdmin(req);
    const [inquiries, campaigns, settings] = await Promise.all([
      many<any>(ctx.db, `select * from ad_inquiries where status = 'new' order by created_at`),
      many<any>(ctx.db, 'select * from ad_campaigns order by active desc, created_at desc'),
      one<any>(ctx.db, 'select rates from ad_settings where id = 1'),
    ]);
    const now = ctx.clock.now();
    return {
      inquiries: inquiries.map((q) => ({
        id: q.id, brand: q.brand, category: q.category, logo: initialsOf(q.brand), art: AD_ART[q.category], email: q.email, budget: q.budget,
        placements: q.placements, message: q.message, ageMinutes: Math.round((now.getTime() - new Date(q.created_at).getTime()) / 60000),
      })),
      campaigns: campaigns.map(presentCampaign),
      rates: settings.rates,
      rules: L('Every ad carries a Sponsored label, uses no personal data, and never targets a user’s saved events. Alcohol ads are withheld from accounts under 18.',
        'Mọi quảng cáo phải gắn nhãn Được tài trợ, không dùng dữ liệu cá nhân, và không nhắm theo sự kiện người dùng đã lưu. Quảng cáo rượu bia không hiện cho tài khoản dưới 18 tuổi.'),
    };
  });

  app.post<{ Params: { id: string } }>('/admin/ads/inquiries/:id/approve', async (req, reply) => {
    const s = requireAdmin(req);
    const body = parse(z.object({
      placement: z.enum(['feed', 'banner', 'live']).optional(),
      genres: z.array(z.enum(GENRES)).default([]),
      areas: z.array(z.string().max(60)).default([]),
      dailyCap: z.number().int().min(1_000_000).max(60_000_000).default(12_000_000),
      budgetTotal: z.number().int().min(0).default(0),
      headline: localized.optional(), body: localized.optional(), cta: localized.optional(), url: z.string().url().optional(),
      isAlcohol: z.boolean().default(false),
    }), req.body ?? {});
    const now = ctx.clock.now();
    const campaign = await ctx.db.tx(async (q) => {
      const inq = await one<any>(q, `select * from ad_inquiries where id = $1 for update`, [parse(uuid, req.params.id)]);
      if (!inq) throw notFound();
      if (inq.status !== 'new') throw conflict('already_decided', L('This enquiry was already handled', 'Yêu cầu này đã được xử lý'));
      await q.query(`update ad_inquiries set status = 'approved', decided_at = $2 where id = $1`, [inq.id, now]);
      const c = await one<any>(q,
        `insert into ad_campaigns (inquiry_id, brand, category, logo, art, headline, body, cta, url, placement, genres, areas, is_alcohol, budget_total, daily_cap)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) returning *`,
        [inq.id, inq.brand, inq.category, initialsOf(inq.brand), AD_ART[inq.category], json(body.headline ?? { en: '', vi: '' }), json(body.body ?? { en: '', vi: '' }),
          json(body.cta ?? { en: '', vi: '' }), body.url ?? null, body.placement ?? inq.placements[0], body.genres, body.areas, body.isAlcohol, body.budgetTotal, body.dailyCap]);
      await appendAudit(q, { at: now, ...admin(s), action: 'ads.campaign_created', targetType: 'campaign', targetId: c.id, targetLabel: inq.brand,
        diff: [{ f: 'placement', a: '—', b: c.placement }, { f: 'daily_cap', a: '—', b: String(c.daily_cap) }] });
      return c;
    });
    return reply.code(201).send({ ...presentCampaign(campaign), message: L(`Campaign created · ${campaign.brand}`, `Đã tạo chiến dịch · ${campaign.brand}`) });
  });

  app.post<{ Params: { id: string } }>('/admin/ads/inquiries/:id/decline', async (req) => {
    const s = requireAdmin(req);
    const now = ctx.clock.now();
    const brand = await ctx.db.tx(async (q) => {
      const inq = await one<any>(q, `update ad_inquiries set status = 'declined', decided_at = $2 where id = $1 and status = 'new' returning *`, [parse(uuid, req.params.id), now]);
      if (!inq) throw notFound();
      await appendAudit(q, { at: now, ...admin(s), action: 'ads.inquiry_declined', targetType: 'inquiry', targetId: inq.id, targetLabel: inq.brand, diff: null });
      return inq.brand;
    });
    return { ok: true, message: L(`${brand} declined`, `Đã từ chối ${brand}`) };
  });

  app.patch<{ Params: { id: string } }>('/admin/ads/campaigns/:id', async (req) => {
    const s = requireAdmin(req);
    const body = parse(z.object({
      active: z.boolean().optional(), genres: z.array(z.enum(GENRES)).optional(), areas: z.array(z.string().max(60)).optional(),
      dailyCap: z.number().int().min(1_000_000).max(60_000_000).optional(), budgetTotal: z.number().int().min(0).optional(),
      headline: localized.optional(), body: localized.optional(), cta: localized.optional(), url: z.string().url().nullable().optional(),
    }), req.body);
    const now = ctx.clock.now();
    const c = await ctx.db.tx(async (q) => {
      const old = await one<any>(q, 'select * from ad_campaigns where id = $1 for update', [parse(uuid, req.params.id)]);
      if (!old) throw notFound();
      const next = await one<any>(q,
        `update ad_campaigns set active = coalesce($2, active), genres = coalesce($3, genres), areas = coalesce($4, areas), daily_cap = coalesce($5, daily_cap),
                budget_total = coalesce($6, budget_total), headline = coalesce($7, headline), body = coalesce($8, body), cta = coalesce($9, cta),
                url = case when $10::boolean then $11 else url end
          where id = $1 returning *`,
        [old.id, body.active ?? null, body.genres ?? null, body.areas ?? null, body.dailyCap ?? null, body.budgetTotal ?? null,
          body.headline ? json(body.headline) : null, body.body ? json(body.body) : null, body.cta ? json(body.cta) : null, body.url !== undefined, body.url ?? null]);
      if (body.active !== undefined && body.active !== old.active) {
        await appendAudit(q, { at: now, ...admin(s), action: body.active ? 'ads.campaign_resumed' : 'ads.campaign_paused', targetType: 'campaign', targetId: old.id, targetLabel: old.brand,
          diff: [{ f: 'active', a: String(old.active), b: String(body.active) }] });
      }
      return next;
    });
    return presentCampaign(c);
  });

  app.put('/admin/ads/rates', async (req) => {
    const s = requireAdmin(req);
    const rates = parse(z.object({ feed: z.number().int().min(10_000).max(9_999_000), banner: z.number().int().min(10_000).max(9_999_000), live: z.number().int().min(10_000).max(9_999_000) }), req.body);
    const now = ctx.clock.now();
    await ctx.db.tx(async (q) => {
      const old = await one<any>(q, 'select rates from ad_settings where id = 1');
      await q.query('update ad_settings set rates = $1 where id = 1', [json(rates)]);
      await appendAudit(q, { at: now, ...admin(s), action: 'ads.rates_changed', targetType: 'settings', targetId: null, targetLabel: 'CPM rates',
        diff: (['feed', 'banner', 'live'] as const).filter((k) => old.rates[k] !== rates[k]).map((k) => ({ f: `cpm_${k}`, a: String(old.rates[k]), b: String(rates[k]) })) });
    });
    return { rates };
  });
}
