import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Ctx } from '../../context.ts';
import type { Queryable } from '../../db/index.ts';
import { json, many, one } from '../../db/index.ts';
import { badRequest, conflict } from '../../lib/errors.ts';
import { GENRES, L, REJECT_REASONS, type Localized } from '../../lib/i18n.ts';
import { isEmail, normalizeEmail, slugify } from '../../lib/contact.ts';
import { randomCode } from '../../lib/crypto.ts';
import { vnd } from '../../lib/format.ts';
import { atVn, toMinutes, addDays, vnDate } from '../../lib/time.ts';
import { dateStr, localized, parse, timeStr, uuid } from '../../lib/validate.ts';
import { BANKS } from '../../lib/vietqr.ts';
import { requireOrganizer, requireOwnEvent } from '../../http/guards.ts';
import { appendAudit } from '../../services/audit.ts';
import { draftFacts, refreshDerived } from '../../services/events.ts';
import { qualityScore } from '../../services/quality.ts';
import { assessRisk } from '../../services/risk.ts';
import { refreshSoldOut } from '../../services/tickets.ts';

export const STATUS_LABEL: Record<string, Localized> = {
  draft: L('Draft', 'Nháp'),
  in_review: L('In review', 'Đang duyệt'),
  live: L('Live', 'Đang đăng'),
  rejected: L('Sent back', 'Bị trả lại'),
  removed: L('Taken down', 'Đã hạ'),
  cancelled: L('Cancelled', 'Đã huỷ'),
};

const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function presentDraft(ev: any) {
  return {
    id: ev.id, slug: ev.slug, status: ev.status, statusLabel: STATUS_LABEL[ev.status],
    title: ev.title, genre: ev.genre, description: ev.description,
    logoUrl: ev.logo_url, coverUrl: ev.cover_url,
    startsOn: ev.starts_on, endsOn: ev.ends_on, startTime: ev.start_time, endTime: ev.end_time,
    venue: { id: ev.venue_id, name: ev.venue_name, address: ev.address, area: ev.area, lat: ev.lat, lng: ev.lng, resolved: !!ev.venue_id || ev.lat !== null },
    entryMode: ev.entry_mode, priceFrom: ev.price_from, capacity: ev.capacity, age: ev.age, lineup: ev.lineup,
    ticketUrl: ev.ticket_url, eventUrl: ev.event_url, brandUrl: ev.brand_url,
    submittedAt: ev.submitted_at, publishedAt: ev.published_at,
    quality: qualityScore(draftFacts(ev)),
  };
}

/** Ready to submit: the fields review can't work without, plus the logo and own event page the wizard asks for. */
function missingForSubmit(ev: any): string[] {
  const missing: string[] = [];
  if (!ev.title?.trim()) missing.push('title');
  if (!ev.genre) missing.push('genre');
  if (!ev.starts_on || !ev.start_time || !ev.end_time) missing.push('dates');
  if (!ev.venue_name) missing.push('venue');
  if (ev.entry_mode === 'paid' && (!ev.price_from || !ev.ticket_url)) missing.push('price');
  if (!ev.logo_url) missing.push('logo');
  if (!ev.event_url) missing.push('eventUrl');
  return missing;
}

const DraftInput = z.object({
  title: z.string().max(120),
  genre: z.enum(GENRES).nullable(),
  description: localized,
  logoUrl: z.string().url().nullable(),
  coverUrl: z.string().url().nullable(),
  startsOn: dateStr.nullable(),
  endsOn: dateStr.nullable(),
  startTime: timeStr.nullable(),
  endTime: timeStr.nullable(),
  venueId: uuid.nullable(),
  venueName: z.string().max(160).nullable(),
  address: z.string().max(240).nullable(),
  area: z.string().max(60).nullable(),
  entryMode: z.enum(['free', 'paid', 'donation']),
  priceFrom: z.number().int().min(0).max(100_000_000),
  capacity: z.number().int().min(1).max(500_000).nullable(),
  age: z.enum(['All ages', '16+', '18+']),
  lineup: z.array(z.string().trim().min(1).max(100)).max(80),
  ticketUrl: z.string().url().nullable(),
  eventUrl: z.string().url().nullable(),
  brandUrl: z.string().url().nullable(),
}).partial();

/** Edits to these on a live listing send it back to review. */
const REVIEWED_FIELDS = ['title', 'startsOn', 'endsOn', 'startTime', 'endTime', 'venueId', 'venueName', 'entryMode', 'priceFrom', 'coverUrl'];

async function applyDraft(ctx: Ctx, q: Queryable, id: string, body: z.infer<typeof DraftInput>) {
  const set: Record<string, unknown> = {};
  const map: Record<string, string> = {
    title: 'title', genre: 'genre', logoUrl: 'logo_url', coverUrl: 'cover_url', startsOn: 'starts_on', endsOn: 'ends_on',
    startTime: 'start_time', endTime: 'end_time', entryMode: 'entry_mode', priceFrom: 'price_from', capacity: 'capacity',
    age: 'age', ticketUrl: 'ticket_url', eventUrl: 'event_url', brandUrl: 'brand_url', address: 'address', area: 'area', venueName: 'venue_name',
  };
  for (const [k, col] of Object.entries(map)) if ((body as any)[k] !== undefined) set[col] = (body as any)[k];
  if (body.description) set.description = json(body.description);
  if (body.lineup) { set.lineup = body.lineup; set.artists = body.lineup; }
  if (body.entryMode === 'free') set.price_from = 0;
  if (body.startsOn && body.endsOn === undefined) set.ends_on = body.startsOn;
  if (body.endsOn && body.startsOn && body.endsOn < body.startsOn) throw badRequest('dates_order', L('The end date is before the start date', 'Ngày kết thúc trước ngày bắt đầu'));
  if (body.venueId !== undefined) {
    if (body.venueId) {
      const v = await one<any>(q, 'select * from venues where id = $1', [body.venueId]);
      if (!v) throw badRequest('venue_unknown', L('Pick a venue from the list', 'Chọn địa điểm trong danh sách'));
      Object.assign(set, { venue_id: v.id, venue_name: v.name, address: v.address, area: v.area, lat: v.lat, lng: v.lng });
    } else {
      // Free-typed venue: no pin until we geocode it or a moderator places it.
      Object.assign(set, { venue_id: null, lat: null, lng: null });
    }
  }
  if (body.coverUrl !== undefined) {
    const up = body.coverUrl ? await one<any>(q, 'select sha256 from uploads where url = $1', [body.coverUrl]) : null;
    set.cover_sha256 = up?.sha256 ?? null;
  }
  if (body.ticketUrl !== undefined) set.ticket_link_status = body.ticketUrl ? 'unchecked' : null;
  const keys = Object.keys(set);
  if (keys.length) await q.query(`update events set ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')} where id = $1`, [id, ...keys.map((k) => set[k])]);
  await refreshDerived(q, id);
}

export default async function organizerEventRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  // ---- business profile --------------------------------------------------------

  app.get('/organizer/profile', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const o = await one<any>(ctx.db, 'select * from organizers where id = $1', [org.organizerId]);
    const members = await many<any>(ctx.db, 'select u.id, u.name, u.email, m.role from organizer_members m join users u on u.id = m.user_id where m.organizer_id = $1', [o.id]);
    return {
      id: o.id, slug: o.slug, name: o.name, initials: o.initials, type: o.type, bio: o.bio, logoUrl: o.logo_url, website: o.website,
      legalName: o.legal_name, taxCode: o.tax_code, address: o.address, email: o.email, hotline: o.hotline, zalo: o.zalo,
      contactName: o.contact_name, contactRole: o.contact_role, verified: o.verification_state === 'verified', verificationState: o.verification_state,
      bank: o.bank_account_no ? { bankName: o.bank_name, accountMasked: `•••• ${o.bank_account_no.slice(-4)}`, accountName: o.bank_account_name, verified: o.bank_verified } : null,
      members, myRole: org.role,
    };
  });

  app.patch('/organizer/profile', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const body = parse(z.object({
      name: z.string().max(80), type: z.enum(['promoter', 'venue', 'company', 'agency', 'public']), bio: localized,
      logoUrl: z.string().url().nullable(), website: z.string().url().nullable().or(z.literal('')), legalName: z.string().max(160),
      taxCode: z.string().max(20), address: z.string().max(240), email: z.string().max(200), hotline: z.string().max(30),
      zalo: z.string().max(80), contactName: z.string().max(80), contactRole: z.string().max(80),
    }).partial(), req.body);
    if (body.name !== undefined && !body.name.trim()) throw badRequest('name_required', L('Add the organiser name', 'Nhập tên nhà tổ chức'));
    if (body.email && !isEmail(body.email)) throw badRequest('invalid_email', L('That email address does not look right', 'Email chưa đúng định dạng'));
    if (body.taxCode && !/^\d{10,14}$/.test(body.taxCode.replace(/[\s-]/g, ''))) {
      throw badRequest('invalid_tax_code', L('Tax codes are 10 to 14 digits', 'Mã số thuế gồm 10 đến 14 chữ số'));
    }
    const map: Record<string, string> = {
      name: 'name', type: 'type', logoUrl: 'logo_url', website: 'website', legalName: 'legal_name', taxCode: 'tax_code', address: 'address',
      email: 'email', hotline: 'hotline', zalo: 'zalo', contactName: 'contact_name', contactRole: 'contact_role',
    };
    const set: Record<string, unknown> = {};
    for (const [k, col] of Object.entries(map)) if ((body as any)[k] !== undefined) set[col] = typeof (body as any)[k] === 'string' ? (body as any)[k].trim() || null : (body as any)[k];
    if (body.name) { set.name = body.name.trim(); set.initials = body.name.replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || 'FF'; }
    if (body.email) set.email = normalizeEmail(body.email);
    if (body.taxCode) set.tax_code = body.taxCode.replace(/[\s-]/g, '');
    if (body.bio) set.bio = json(body.bio);
    const keys = Object.keys(set);
    if (keys.length) await ctx.db.query(`update organizers set ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')} where id = $1`, [org.organizerId, ...keys.map((k) => set[k])]);
    return { ok: true, message: L('Business profile saved', 'Đã lưu hồ sơ doanh nghiệp') };
  });

  app.put('/organizer/bank', async (req) => {
    const org = await requireOrganizer(ctx, req);
    if (org.role !== 'owner') throw badRequest('owner_only', L('Only the account owner can change the payout account', 'Chỉ chủ tài khoản đổi được tài khoản nhận tiền'));
    const body = parse(z.object({ bankBin: z.string().regex(/^\d{6}$/), accountNo: z.string().regex(/^\d{6,19}$/), accountName: z.string().min(2).max(80) }), req.body);
    await ctx.db.query(
      `update organizers set bank_bin = $2, bank_name = $3, bank_account_no = $4, bank_account_name = $5, bank_verified = false, bank_added_at = $6 where id = $1`,
      [org.organizerId, body.bankBin, BANKS[body.bankBin] ?? body.bankBin, body.accountNo, body.accountName.toUpperCase(), ctx.clock.now()]);
    return { ok: true, verified: false, message: L('Saved. We verify new accounts with a 1,000₫ test transfer.', 'Đã lưu. Chúng tôi xác minh tài khoản mới bằng giao dịch thử 1.000₫.') };
  });

  // ---- events table & wizard ---------------------------------------------------

  app.get('/organizer/events', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const { status } = parse(z.object({ status: z.enum(['all', 'live', 'review']).default('all') }), req.query);
    const filter = status === 'live' ? `and e.status = 'live'` : status === 'review' ? `and e.status <> 'live'` : '';
    const rows = await many<any>(ctx.db,
      `select e.*, coalesce(m.views, 0)::int as views, coalesce(m.clicks, 0)::int as clicks,
              exists (select 1 from ticket_tiers t where t.event_id = e.id) as has_tiers,
              (select count(*)::int from tickets t where t.event_id = e.id and t.status in ('valid','used')) as sold
         from events e
         left join (select event_id, sum(views) as views, sum(ticket_clicks) as clicks from event_metrics_daily group by event_id) m on m.event_id = e.id
        where e.organizer_id = $1 ${filter}
        -- What is coming up first, soonest at the top; then past editions, newest first.
        order by (e.starts_on is null), (e.starts_on < $2),
                 case when e.starts_on >= $2 then e.starts_on end,
                 e.starts_on desc, e.created_at`, [org.organizerId, vnDate(ctx.clock.now())]);
    return {
      items: rows.map((e) => {
        const hasData = e.status === 'live' || e.published_at;
        const price = e.entry_mode === 'free' ? L('Free', 'Miễn phí') : e.price_from ? { en: vnd(e.price_from, 'en'), vi: vnd(e.price_from, 'vi') } : null;
        const where = e.venue_name ? (e.venue_id || e.lat !== null ? e.venue_name : null) : null;
        const meta: Localized = e.status === 'in_review' && !where
          ? L('Venue awaiting verification', 'Địa điểm chờ xác minh')
          : !price && e.entry_mode === 'paid' ? L('No ticket price yet', 'Chưa có giá vé')
          : L([where, e.start_time && `${e.start_time} – ${e.end_time}`, price?.en].filter(Boolean).join(' · '),
            [where, e.start_time && `${e.start_time} – ${e.end_time}`, price?.vi].filter(Boolean).join(' · '));
        return {
          id: e.id, slug: e.slug, title: e.title, art: e.art, coverUrl: e.cover_url,
          mon: e.starts_on ? MON[Number(e.starts_on.slice(5, 7)) - 1] : null, day: e.starts_on ? e.starts_on.slice(8, 10) : null,
          status: e.status, statusLabel: STATUS_LABEL[e.status], meta,
          views: hasData ? e.views : null, saves: hasData ? e.save_count : null, clicks: hasData ? e.clicks : null,
          sold: e.sold, hasPerformance: e.status === 'live' && e.has_tiers,
        };
      }),
    };
  });

  app.post('/organizer/events', async (req, reply) => {
    const org = await requireOrganizer(ctx, req);
    const body = parse(DraftInput, req.body ?? {});
    const title = body.title?.trim() || 'Untitled event';
    const id = await ctx.db.tx(async (q) => {
      const slug = `${slugify(title) || 'event'}-${randomCode(4).toLowerCase()}`;
      const ev = await one<any>(q,
        `insert into events (slug, organizer_id, title, status, art) values ($1,$2,$3,'draft',$4) returning id`,
        [slug, org.organizerId, title, 'linear-gradient(135deg,#8C6BFF,#2AC4E8)']);
      await applyDraft(ctx, q, ev.id, body);
      return ev.id as string;
    });
    const ev = await one<any>(ctx.db, 'select * from events where id = $1', [id]);
    return reply.code(201).send(presentDraft(ev));
  });

  app.get<{ Params: { id: string } }>('/organizer/events/:id', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const [decision, appeal, tiers] = await Promise.all([
      one<any>(ctx.db, 'select decision, reason_code, message, allow_appeal, decided_at from moderation_decisions where event_id = $1 order by decided_at desc limit 1', [ev.id]),
      one<any>(ctx.db, 'select id, state, reply, closes_at from appeals where event_id = $1 order by created_at desc limit 1', [ev.id]),
      many<any>(ctx.db, 'select id, key, name, note, price, capacity, sold, is_last, sales_open_at, price_rise_on, price_rise_to from ticket_tiers where event_id = $1 order by sort, price', [ev.id]),
    ]);
    return {
      ...presentDraft(ev),
      moderation: decision ? {
        decision: decision.decision, reasonCode: decision.reason_code,
        reason: decision.reason_code ? REJECT_REASONS[decision.reason_code]?.label : null,
        message: decision.message, decidedAt: decision.decided_at,
        appeal: appeal ? { id: appeal.id, state: appeal.state, reply: appeal.reply, closesAt: appeal.closes_at } : null,
      } : null,
      tiers: tiers.map((t) => ({ id: t.id, key: t.key, name: t.name, note: t.note, price: t.price, capacity: t.capacity, sold: t.sold, isLast: t.is_last, salesOpenAt: t.sales_open_at, priceRiseOn: t.price_rise_on, priceRiseTo: t.price_rise_to })),
      moderationNote: L('Every listing is checked by a person. Most are live within two hours.', 'Mọi tin đăng đều được người kiểm duyệt. Phần lớn lên sóng trong hai giờ.'),
    };
  });

  app.patch<{ Params: { id: string } }>('/organizer/events/:id', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const body = parse(DraftInput, req.body);
    if (['removed', 'cancelled'].includes(ev.status)) throw conflict('not_editable', L('This listing can no longer be edited', 'Tin này không còn sửa được'));
    const sendsBack = ev.status === 'live' && REVIEWED_FIELDS.some((f) => (body as any)[f] !== undefined);
    await ctx.db.tx(async (q) => {
      await applyDraft(ctx, q, ev.id, body);
      if (sendsBack) {
        await q.query(`update events set status = 'in_review', submitted_at = $2 where id = $1`, [ev.id, ctx.clock.now()]);
        const risk = await assessRisk(q, ev.id, ctx.clock.now());
        await q.query('update events set risk_score = $2, risk_factors = $3, signals = $4, flag = $5 where id = $1',
          [ev.id, risk.score, json(risk.factors), json(risk.signals), risk.flag]);
      }
    });
    const updated = await one<any>(ctx.db, 'select * from events where id = $1', [ev.id]);
    return {
      ...presentDraft(updated),
      ...(sendsBack ? { message: L('Changes to dates, venue or price go back through review', 'Thay đổi ngày, địa điểm hay giá sẽ được duyệt lại') } : {}),
    };
  });

  app.delete<{ Params: { id: string } }>('/organizer/events/:id', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    if (ev.status !== 'draft') throw conflict('not_a_draft', L('Only drafts can be deleted', 'Chỉ xoá được bản nháp'));
    await ctx.db.query('delete from events where id = $1', [ev.id]);
    return { ok: true };
  });

  app.get<{ Params: { id: string } }>('/organizer/events/:id/quality', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    return qualityScore(draftFacts(ev));
  });

  app.post<{ Params: { id: string } }>('/organizer/events/:id/submit', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    if (!['draft', 'rejected'].includes(ev.status)) throw conflict('already_submitted', L('This listing is already submitted', 'Tin này đã được gửi'));
    const missing = missingForSubmit(ev);
    if (missing.length) {
      throw badRequest('not_ready', L('Add the logo and your event page before submitting', 'Thêm logo và trang sự kiện trước khi gửi'), { missing });
    }
    const now = ctx.clock.now();
    await ctx.db.tx(async (q) => {
      await q.query(`update events set status = 'in_review', submitted_at = $2 where id = $1`, [ev.id, now]);
      const risk = await assessRisk(q, ev.id, now);
      await q.query('update events set risk_score = $2, risk_factors = $3, signals = $4, flag = $5 where id = $1',
        [ev.id, risk.score, json(risk.factors), json(risk.signals), risk.flag]);
      const actor = await one<any>(q, 'select name from organizers where id = $1', [org.organizerId]);
      await appendAudit(q, {
        at: now, actorType: 'organizer', actorId: org.userId, actorLabel: actor.name, action: 'listing.submitted',
        targetType: 'event', targetId: ev.id, targetLabel: ev.title,
        diff: [{ f: 'status', a: ev.status, b: 'in_review' }, { f: 'risk_score', a: String(ev.risk_score ?? 0), b: String(risk.score) }],
      });
    });
    if (ev.ticket_url && ev.entry_mode === 'paid' && ctx.config.linkChecksEnabled) {
      checkTicketLink(ctx, ev.id, ev.ticket_url).catch((e) => ctx.log(`link check failed: ${e}`));
    }
    const updated = await one<any>(ctx.db, 'select * from events where id = $1', [ev.id]);
    return { ...presentDraft(updated), message: L('Submitted for review · usually live within 2 hours', 'Đã gửi kiểm duyệt · thường xong trong 2 giờ') };
  });

  // ---- tiers, timetable and site map ----------------------------------------------

  app.put<{ Params: { id: string } }>('/organizer/events/:id/tiers', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const { tiers } = parse(z.object({
      tiers: z.array(z.object({
        key: z.string().regex(/^[a-z0-9_-]{2,24}$/),
        name: localized,
        note: localized.nullable().optional(),
        price: z.number().int().min(0).max(100_000_000),
        capacity: z.number().int().min(0).max(500_000),
        isLast: z.boolean().default(false),
        salesOpenAt: z.string().datetime({ offset: true }).nullable().optional(),
        priceRiseOn: dateStr.nullable().optional(),
        priceRiseTo: z.number().int().positive().nullable().optional(),
      })).min(1).max(12),
    }), req.body);
    if (new Set(tiers.map((t) => t.key)).size !== tiers.length) throw badRequest('duplicate_tier', L('Each tier needs its own key', 'Mỗi loại vé cần mã riêng'));
    await ctx.db.tx(async (q) => {
      const existing = await many<any>(q, 'select id, key, sold from ticket_tiers where event_id = $1', [ev.id]);
      for (const old of existing) {
        const next = tiers.find((t) => t.key === old.key);
        if (!next && old.sold > 0) throw conflict('tier_has_sales', L(`Tier ${old.key} has sales and can't be removed`, `Loại vé ${old.key} đã bán nên không xoá được`));
        if (next && next.capacity < old.sold) throw conflict('capacity_below_sold', L(`Tier ${old.key} already sold ${old.sold}`, `Loại vé ${old.key} đã bán ${old.sold}`));
        if (!next) await q.query('delete from ticket_tiers where id = $1', [old.id]);
      }
      for (const [i, t] of tiers.entries()) {
        await q.query(
          `insert into ticket_tiers (event_id, key, name, note, price, capacity, is_last, sales_open_at, price_rise_on, price_rise_to, sort)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           on conflict (event_id, key) do update set name = excluded.name, note = excluded.note, price = excluded.price, capacity = excluded.capacity,
             is_last = excluded.is_last, sales_open_at = excluded.sales_open_at, price_rise_on = excluded.price_rise_on,
             price_rise_to = excluded.price_rise_to, sort = excluded.sort`,
          [ev.id, t.key, json(t.name), json(t.note ?? null), t.price, t.capacity, t.isLast, t.salesOpenAt ?? null, t.priceRiseOn ?? null, t.priceRiseTo ?? null, i]);
      }
      const min = Math.min(...tiers.map((t) => t.price));
      await q.query(`update events set price_from = $2, capacity = coalesce(capacity, $3) where id = $1 and entry_mode = 'paid'`,
        [ev.id, min, tiers.reduce((n, t) => n + t.capacity, 0)]);
      await refreshSoldOut(q, ev.id);
    });
    return { ok: true };
  });

  app.put<{ Params: { id: string } }>('/organizer/events/:id/timetable', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const { stages } = parse(z.object({
      stages: z.array(z.object({
        name: localized,
        sets: z.array(z.object({ day: dateStr, artist: z.string().min(1).max(100), start: timeStr, end: timeStr })).max(100),
      })).max(12),
    }), req.body);
    const first = ev.starts_on;
    const last = ev.ends_on ?? ev.starts_on;
    await ctx.db.tx(async (q) => {
      await q.query('delete from stages where event_id = $1', [ev.id]);
      for (const [i, st] of stages.entries()) {
        const row = await one<any>(q, 'insert into stages (event_id, name, sort) values ($1,$2,$3) returning id', [ev.id, json(st.name), i]);
        for (const set of st.sets) {
          if (first && (set.day < first || set.day > last)) {
            throw badRequest('set_outside_event', L(`${set.artist} is scheduled outside the event dates`, `${set.artist} nằm ngoài ngày diễn ra sự kiện`));
          }
          // Times before doors belong to the early hours after midnight.
          const doors = ev.start_time ? toMinutes(ev.start_time) : 0;
          const startDay = toMinutes(set.start) < doors - 60 ? addDays(set.day, 1) : set.day;
          const startsAt = atVn(startDay, set.start);
          let endsAt = atVn(startDay, set.end);
          if (endsAt <= startsAt) endsAt = atVn(addDays(startDay, 1), set.end);
          await q.query('insert into sets (event_id, stage_id, day, artist, starts_at, ends_at) values ($1,$2,$3,$4,$5,$6)',
            [ev.id, row.id, set.day, set.artist.trim(), startsAt, endsAt]);
        }
      }
    });
    return { ok: true };
  });

  app.put<{ Params: { id: string } }>('/organizer/events/:id/zones', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const { zones } = parse(z.object({
      zones: z.array(z.object({
        label: z.string().min(1).max(40), kind: z.enum(['stage', 'food', 'entry', 'medical', 'toilets', 'water', 'bar']),
        x: z.number().min(0).max(100), y: z.number().min(0).max(100), w: z.number().min(5).max(100),
      })).max(30),
    }), req.body);
    await ctx.db.tx(async (q) => {
      await q.query('delete from site_zones where event_id = $1', [ev.id]);
      for (const z0 of zones) await q.query('insert into site_zones (event_id, label, kind, x, y, w) values ($1,$2,$3,$4,$5,$6)', [ev.id, z0.label, z0.kind, z0.x, z0.y, z0.w]);
    });
    return { ok: true };
  });
}

/** Resolves the ticket link in the background and re-scores the listing if it is broken. */
export async function checkTicketLink(ctx: Ctx, eventId: string, url: string) {
  const status = await ctx.checkLink(url);
  await ctx.db.tx(async (q) => {
    await q.query('update events set ticket_link_status = $2 where id = $1 and ticket_url = $3', [eventId, status, url]);
    const ev = await one<any>(q, 'select status from events where id = $1', [eventId]);
    if (ev?.status !== 'in_review') return;
    const risk = await assessRisk(q, eventId, ctx.clock.now());
    await q.query('update events set risk_score = $2, risk_factors = $3, signals = $4, flag = $5 where id = $1',
      [eventId, risk.score, json(risk.factors), json(risk.signals), risk.flag]);
  });
}
