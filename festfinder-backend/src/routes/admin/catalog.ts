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
import { notifyOrganizer, notifyUser } from '../../services/notify.ts';
import { cityLabel } from '../../lib/places.ts';
import { AD_CATEGORY_LABEL, BRAND_AD_PLACEMENT_LABEL, type AdCategory } from '../../lib/ads.ts';
import { AD_REQUEST_COLUMNS, presentAdRequest } from '../organizer/ads.ts';

const AD_ART: Record<string, string> = {
  'F&B': 'linear-gradient(135deg,#FFB35C,#FF5C5C)',
  Fashion: 'linear-gradient(135deg,#8C6BFF,#FF6FA5)',
  Healthcare: 'linear-gradient(135deg,#2AC4E8,#1B6BD6)',
  Beauty: 'linear-gradient(135deg,#FF8FB1,#C24DFF)',
  Tech: 'linear-gradient(135deg,#5AE0C8,#1B6BD6)',
  Travel: 'linear-gradient(135deg,#FFD25C,#2AC4E8)',
  Lifestyle: 'linear-gradient(135deg,#ABFF84,#0AE448)',
  Other: 'linear-gradient(135deg,#9D95FF,#5A62E0)',
  Event: 'linear-gradient(150deg,#BFF3FF,#00BAE2 48%,#5A62E0 120%)',
};
const day = (v: unknown) => (v ? String(v).slice(0, 10) : null);

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
        // The "Verified" badge is a state, not a milestone: it goes with the verification.
        if (!verified) await q.query(`delete from badge_awards where subject_kind = 'organizer' and subject_id = $1 and code = 'verified'`, [o.id]);
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
    id: c.id, brand: c.brand, category: c.category, logo: c.logo, logoUrl: c.logo_url, images: c.images ?? [], art: c.art, placement: c.placement, active: c.active,
    startsOn: day(c.starts_on), endsOn: day(c.ends_on), cities: c.cities ?? [], eventId: c.event_id,
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
        id: q.id, brand: q.brand, category: q.category, categoryLabel: AD_CATEGORY_LABEL[q.category as AdCategory] ?? null, logo: initialsOf(q.brand), logoUrl: q.logo_url,
        art: AD_ART[q.category], email: q.email, budget: q.budget, budgetAmount: q.budget_amount == null ? null : Number(q.budget_amount), currency: q.currency,
        placements: q.placements, placementLabels: (q.placements as string[]).map((k) => BRAND_AD_PLACEMENT_LABEL[k as keyof typeof BRAND_AD_PLACEMENT_LABEL] ?? L(k, k)),
        message: q.message, website: q.website, links: q.links ?? {}, productImages: q.product_images ?? [], description: q.description,
        contactName: q.contact_name, phone: q.phone, startsOn: day(q.starts_on), endsOn: day(q.ends_on), isAlcohol: q.is_alcohol,
        cities: (q.cities ?? []).map((c: string) => ({ slug: c, label: cityLabel(c) })),
        ageMinutes: Math.round((now.getTime() - new Date(q.created_at).getTime()) / 60000),
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
      isAlcohol: z.boolean().optional(),
      reply: z.string().trim().max(1000).optional(),
    }), req.body ?? {});
    const now = ctx.clock.now();
    const campaign = await ctx.db.tx(async (q) => {
      const inq = await one<any>(q, `select * from ad_inquiries where id = $1 for update`, [parse(uuid, req.params.id)]);
      if (!inq) throw notFound();
      if (inq.status !== 'new') throw conflict('already_decided', L('This enquiry was already handled', 'Yêu cầu này đã được xử lý'));
      await q.query(`update ad_inquiries set status = 'approved', decided_at = $2, reply = $3 where id = $1`, [inq.id, now, body.reply || null]);
      // What the brand sent becomes the campaign: its logo and images, its site, its dates and cities.
      const links = Object.values((inq.links ?? {}) as Record<string, string>);
      const text = (v: string) => ({ en: v, vi: v });
      const c = await one<any>(q,
        `insert into ad_campaigns (inquiry_id, brand, category, logo, art, headline, body, cta, url, placement, genres, areas, is_alcohol, budget_total, daily_cap,
                                   logo_url, images, starts_on, ends_on, cities)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) returning *`,
        [inq.id, inq.brand, inq.category, initialsOf(inq.brand), AD_ART[inq.category], json(body.headline ?? text(inq.brand)), json(body.body ?? text(inq.description ?? '')),
          json(body.cta ?? { en: 'Visit', vi: 'Xem ngay' }), body.url ?? inq.website ?? links[0] ?? null, body.placement ?? inq.placements[0], body.genres, body.areas,
          body.isAlcohol ?? inq.is_alcohol, body.budgetTotal || Number(inq.budget_amount ?? 0), body.dailyCap,
          inq.logo_url, inq.product_images ?? [], inq.starts_on, inq.ends_on, inq.cities ?? []]);
      if (inq.user_id) {
        await notifyUser(q, now, {
          userId: inq.user_id, topic: null, kind: 'ad_inquiry', dedupeKey: `ad-inquiry-answer:${inq.id}`, email: true,
          title: L(`Your ad for ${inq.brand} is approved`, `Quảng cáo ${inq.brand} đã được duyệt`),
          body: body.reply ? { en: body.reply, vi: body.reply } : L('Our partnerships team will be in touch about the next steps.', 'Đội đối tác sẽ liên hệ bạn về các bước tiếp theo.'),
          link: { url: '/advertise' },
        });
      }
      await appendAudit(q, { at: now, ...admin(s), action: 'ads.campaign_created', targetType: 'campaign', targetId: c.id, targetLabel: inq.brand,
        diff: [{ f: 'placement', a: '—', b: c.placement }, { f: 'daily_cap', a: '—', b: String(c.daily_cap) }] });
      return c;
    });
    return reply.code(201).send({ ...presentCampaign(campaign), message: L(`Campaign created · ${campaign.brand}`, `Đã tạo chiến dịch · ${campaign.brand}`) });
  });

  app.post<{ Params: { id: string } }>('/admin/ads/inquiries/:id/decline', async (req) => {
    const s = requireAdmin(req);
    const { reply } = parse(z.object({ reply: z.string().trim().max(1000).optional() }), req.body ?? {});
    const now = ctx.clock.now();
    const brand = await ctx.db.tx(async (q) => {
      const inq = await one<any>(q, `update ad_inquiries set status = 'declined', decided_at = $2, reply = $3 where id = $1 and status = 'new' returning *`, [parse(uuid, req.params.id), now, reply || null]);
      if (!inq) throw notFound();
      await appendAudit(q, { at: now, ...admin(s), action: 'ads.inquiry_declined', targetType: 'inquiry', targetId: inq.id, targetLabel: inq.brand, diff: null });
      if (inq.user_id) {
        await notifyUser(q, now, {
          userId: inq.user_id, topic: null, kind: 'ad_inquiry', dedupeKey: `ad-inquiry-answer:${inq.id}`, email: true,
          title: L(`About your ad for ${inq.brand}`, `Về quảng cáo ${inq.brand}`),
          body: reply ? { en: reply, vi: reply } : L('We cannot run this one. Thank you for asking.', 'Lần này chúng tôi chưa thể chạy quảng cáo này. Cảm ơn bạn đã gửi.'),
          link: { url: '/advertise' },
        });
      }
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

  /** Organisers' advertising requests (organizer/ads.ts), open ones first. */
  app.get('/admin/boosts', async (req) => {
    requireAdmin(req);
    const rows = await many<any>(ctx.db,
      `select ${AD_REQUEST_COLUMNS}, e.genre, o.name as organizer from boost_requests b join events e on e.id = b.event_id join organizers o on o.id = b.organizer_id
        where b.status <> 'withdrawn' order by (b.status = 'open') desc, b.created_at desc limit 60`);
    return { items: rows.map((r) => ({ ...presentAdRequest(r), organizer: r.organizer as string, event: { ...presentAdRequest(r).event, genre: r.genre } })) };
  });

  /**
   * The team's answer to an advertising request: approved (with a reply; for the Explore banner a
   * campaign is made from the event, within the request's dates and budget) or declined.
   * "done" is the old "featured" answer, kept for the shelves' button.
   */
  app.post<{ Params: { id: string } }>('/admin/boosts/:id', async (req) => {
    const s = requireAdmin(req);
    const body = parse(z.object({ status: z.enum(['approved', 'done', 'declined']), reply: z.string().trim().max(1000).optional() }), req.body);
    const status = body.status;
    const now = ctx.clock.now();
    return ctx.db.tx(async (q) => {
      const b = await one<any>(q,
        `select b.*, e.title, e.slug, e.cover_url, e.starts_on::text as event_on, e.venue_name, e.city, o.name as org_name, o.logo_url as org_logo
           from boost_requests b join events e on e.id = b.event_id join organizers o on o.id = b.organizer_id where b.id = $1 for update of b`, [parse(uuid, req.params.id)]);
      if (!b) throw notFound();
      if (b.status !== 'open') throw conflict('already_answered', L('This request was already answered', 'Yêu cầu này đã được trả lời'));
      await q.query('update boost_requests set status = $2, answered_at = $3, answered_by = $4, reply = $5 where id = $1', [b.id, status, now, s.user.id, body.reply || null]);
      let campaign: string | null = null;
      if (status === 'approved' && (b.placements ?? []).includes('banner')) {
        const c = await one<{ id: string }>(q,
          `insert into ad_campaigns (brand, category, logo, art, headline, body, cta, url, placement, budget_total, logo_url, images, starts_on, ends_on, cities, event_id, boost_id)
           values ($1,'Event',$2,$3,$4,$5,$6,$7,'banner',$8,$9,$10,$11,$12,$13,$14,$15) returning id`,
          [b.org_name, initialsOf(b.org_name), AD_ART.Event, json({ en: b.title, vi: b.title }),
            json({ en: [b.event_on, b.venue_name].filter(Boolean).join(' · '), vi: [b.event_on, b.venue_name].filter(Boolean).join(' · ') }),
            json({ en: 'See the event', vi: 'Xem sự kiện' }), `/e/${b.slug}`, Number(b.budget ?? 0), b.org_logo, b.cover_url ? [b.cover_url] : [],
            b.starts_on, b.ends_on, b.city ? [b.city] : [], b.event_id, b.id]);
        campaign = c!.id;
      }
      await appendAudit(q, {
        at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin',
        action: status === 'declined' ? 'boost.declined' : 'boost.done', targetType: 'event', targetId: b.event_id, targetLabel: b.title,
        diff: [{ f: 'boost', a: 'open', b: status }, ...(campaign ? [{ f: 'campaign', a: '—', b: 'banner' }] : [])],
      });
      const yes = status !== 'declined';
      await notifyOrganizer(q, now, {
        organizerId: b.organizer_id, topic: 'moderation', kind: 'boost',
        title: yes ? L(`Advertising for ${b.title} is approved`, `Quảng cáo cho ${b.title} đã được duyệt`) : L(`Advertising for ${b.title} was declined`, `Quảng cáo cho ${b.title} chưa được duyệt`),
        body: body.reply ? { en: body.reply, vi: body.reply }
          : yes ? L('It runs on the dates you asked for.', 'Quảng cáo sẽ chạy theo thời gian bạn chọn.') : L('The placements are full for those dates. Ask again with other dates.', 'Các vị trí đã kín cho những ngày này. Hãy gửi lại với thời gian khác.'),
        link: { url: '/studio/ads' }, dedupeKey: `boost:${b.id}`,
      });
      return { id: b.id, status, campaignId: campaign, message: yes ? L('Approved', 'Đã duyệt') : L('Declined', 'Đã từ chối') };
    });
  });
}
