import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Ctx } from '../../context.ts';
import type { Queryable } from '../../db/index.ts';
import { json, many, one } from '../../db/index.ts';
import { badRequest, conflict, notFound } from '../../lib/errors.ts';
import { BADGES, GENRES, L, REJECT_REASONS, REPORT_CATEGORY, REPORT_CODES, TIER_NAMES, type Localized } from '../../lib/i18n.ts';
import { initialsOf, isEmail, normalizeEmail, searchNormalize, slugify } from '../../lib/contact.ts';
import { randomCode } from '../../lib/crypto.ts';
import { toCsv } from '../../lib/csv.ts';
import { addDays, atVn, monthEnd, vnDate, weekendRange } from '../../lib/time.ts';
import { bool, csv, dateStr, limit, localized, parse, uuid } from '../../lib/validate.ts';
import { BANKS } from '../../lib/vietqr.ts';
import { requireAdmin, type UserSession } from '../../http/guards.ts';
import { SqlParams } from '../../http/sql.ts';
import { actionLabel, appendAudit, type DiffRow } from '../../services/audit.ts';
import { refreshDerived } from '../../services/events.ts';
import { announceNewListing } from '../../services/listing.ts';
import { notifyOrganizer } from '../../services/notify.ts';
import { refundOrder } from '../../services/orders.ts';
import { assessRisk, riskBand } from '../../services/risk.ts';
import { approveListing } from './moderation.ts';
import { moderationThread } from '../organizer/inbox.ts';
import {
  applyDraft, DraftInput, duplicateEvent, missingForSubmit, presentDraft, replaceTiers, STATUS_LABEL, TiersInput,
} from '../organizer/events.ts';

/*
 * The operations back office (/ops): what the FeestFinder team needs beyond the moderation
 * console — the whole catalogue with filters, listings created or fixed by the team, venues,
 * organiser onboarding, accounts and orders — plus the option lists every form draws from,
 * so a genre, a district or a bank is always picked, never typed.
 */

const STATUSES = ['draft', 'in_review', 'live', 'rejected', 'removed', 'cancelled'] as const;

const GENRE_LABEL: Record<string, { label: Localized; hint: Localized }> = {
  EDM: { label: L('EDM & electronic', 'EDM & điện tử'), hint: L('Raves, club nights, DJ sets', 'Rave, club night, DJ set') },
  Festival: { label: L('Festival', 'Lễ hội'), hint: L('Multi-stage, multi-day, mixed genres', 'Nhiều sân khấu, nhiều ngày, nhiều thể loại') },
  Indie: { label: L('Indie', 'Indie'), hint: L('Singer-songwriters, bands, acoustic', 'Singer-songwriter, band, acoustic') },
  'Hip-Hop': { label: L('Hip-hop & rap', 'Hip-hop & rap'), hint: L('Rap shows, cyphers, battles', 'Show rap, cypher, battle') },
  Pop: { label: L('Pop', 'Pop'), hint: L('Concerts, pop and rock nights', 'Concert, đêm nhạc pop & rock') },
  Jazz: { label: L('Jazz & blues', 'Jazz & blues'), hint: L('Jazz bars, blues nights, recitals', 'Jazz bar, đêm blues, recital') },
  Food: { label: L('Food & night markets', 'Ẩm thực & chợ đêm'), hint: L('Night markets, food fairs, pop-ups', 'Chợ đêm, hội chợ ẩm thực, pop-up') },
  Culture: { label: L('Culture & arts', 'Văn hoá & nghệ thuật'), hint: L('Book fairs, exhibitions, classical', 'Hội sách, triển lãm, nhạc cổ điển') },
};

const ORG_TYPES: Record<string, Localized> = {
  promoter: L('Promoter', 'Đơn vị tổ chức'),
  venue: L('Venue (bar, club, space)', 'Địa điểm (bar, club, không gian)'),
  company: L('Company or brand', 'Doanh nghiệp / thương hiệu'),
  agency: L('Agency or travel', 'Agency / lữ hành'),
  public: L('Public body or non-profit', 'Cơ quan / tổ chức công'),
};

/** Districts grouped the way people in the city think about them. Areas already in the data are added under "Other". */
const AREA_GROUPS: { key: string; label: Localized; areas: string[] }[] = [
  { key: 'central', label: L('Central', 'Trung tâm'), areas: ['Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 10', 'Phú Nhuận', 'Bình Thạnh'] },
  { key: 'east', label: L('East · Thủ Đức', 'Phía Đông · Thủ Đức'), areas: ['Thảo Điền', 'Thủ Đức', 'Quận 2', 'Quận 9'] },
  { key: 'south', label: L('South', 'Phía Nam'), areas: ['Quận 7', 'Quận 8', 'Nhà Bè'] },
  { key: 'west', label: L('West & north', 'Phía Tây & Bắc'), areas: ['Quận 6', 'Quận 11', 'Quận 12', 'Tân Bình', 'Tân Phú', 'Gò Vấp', 'Bình Tân'] },
  { key: 'outside', label: L('Outside the city', 'Ngoài TP.HCM'), areas: ['Vũng Tàu', 'Bình Dương', 'Cần Giờ', 'Đà Lạt'] },
];

const ENTRY_MODES: Record<string, { label: Localized; hint: Localized }> = {
  free: { label: L('Free entry', 'Miễn phí'), hint: L('No ticket needed', 'Không cần vé') },
  paid: { label: L('Paid tickets', 'Bán vé'), hint: L('Price and a ticket link', 'Có giá và link bán vé') },
  donation: { label: L('Donation', 'Tuỳ tâm'), hint: L('Pay what you want at the door', 'Trả tuỳ ý tại cửa') },
};

const AGES: Record<string, Localized> = { 'All ages': L('All ages', 'Mọi lứa tuổi'), '16+': L('16+', '16+'), '18+': L('18+ (ID checked)', '18+ (kiểm tra giấy tờ)') };

const ORDER_STATUS: Record<string, Localized> = {
  pending: L('Awaiting payment', 'Chờ thanh toán'), paid: L('Paid', 'Đã thanh toán'), cancelled: L('Cancelled', 'Đã huỷ'),
  expired: L('Expired', 'Hết hạn'), refunded: L('Refunded', 'Đã hoàn tiền'),
};
const PAY_METHOD: Record<string, string> = { card: 'Card', momo: 'MoMo', zalopay: 'ZaloPay', vietqr: 'VietQR', mock: 'Demo' };
const SIGNUP: Record<string, string> = { email: 'Email', zalo: 'Zalo', wa: 'WhatsApp', fb: 'Facebook', ig: 'Instagram', staff: 'Staff' };

const ARTS = ['linear-gradient(135deg,#8C6BFF,#2AC4E8)', 'linear-gradient(135deg,#1B6BD6,#8C6BFF)', 'linear-gradient(135deg,#FFB35C,#FF8A3D)',
  'linear-gradient(135deg,#2AC4E8,#2E9E5B)', 'linear-gradient(135deg,#FF8A3D,#8A2BE2)', 'linear-gradient(135deg,#2E9E5B,#FFD35C)'];

const minutesSince = (now: Date, at: Date | string | null) => (at ? Math.max(0, Math.round((now.getTime() - new Date(at).getTime()) / 60000)) : 0);
const short = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '—';
  const s = Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
  return s.length > 80 ? `${s.slice(0, 77)}…` : s;
};
const actorOf = (s: UserSession) => ({ actorType: 'admin' as const, actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin' });

/** The columns a team edit can touch, with the name the audit diff uses. */
const EDIT_COLUMNS: [string, string][] = [
  ['title', 'title'], ['genre', 'genre'], ['starts_on', 'starts_on'], ['ends_on', 'ends_on'], ['start_time', 'start_time'], ['end_time', 'end_time'],
  ['venue_name', 'venue'], ['address', 'address'], ['area', 'area'], ['entry_mode', 'entry'], ['price_from', 'price_from'], ['capacity', 'capacity'],
  ['age', 'age'], ['lineup', 'lineup'], ['ticket_url', 'ticket_url'], ['event_url', 'event_url'], ['brand_url', 'brand_url'], ['cover_url', 'cover'],
  ['logo_url', 'logo'], ['featured', 'featured'], ['badge', 'badge'],
];

function diffRows(before: any, after: any): DiffRow[] {
  const rows: DiffRow[] = [];
  for (const [col, f] of EDIT_COLUMNS) {
    if (JSON.stringify(before[col] ?? null) !== JSON.stringify(after[col] ?? null)) rows.push({ f, a: short(before[col]), b: short(after[col]) });
  }
  if (before.lat !== after.lat || before.lng !== after.lng) {
    const pin = (e: any) => (e.lat === null || e.lng === null ? '—' : `${Number(e.lat).toFixed(4)}, ${Number(e.lng).toFixed(4)}`);
    rows.push({ f: 'pin', a: pin(before), b: pin(after) });
  }
  for (const lang of ['vi', 'en'] as const) {
    if ((before.description?.[lang] ?? '') !== (after.description?.[lang] ?? '')) rows.push({ f: `description_${lang}`, a: `${(before.description?.[lang] ?? '').length} chars`, b: `${(after.description?.[lang] ?? '').length} chars` });
  }
  return rows;
}

/** What the team needs before a listing may go live without the organiser's own submit (the logo and event page are optional here). */
function missingForPublish(ev: any): string[] {
  return missingForSubmit(ev).filter((m) => m !== 'logo' && m !== 'eventUrl');
}

async function publishByTeam(ctx: Ctx, q: Queryable, s: UserSession, ev: any, now: Date) {
  await q.query(`update events set status = 'live', published_at = coalesce(published_at, $2), decided_at = $2 where id = $1`, [ev.id, now]);
  await q.query(`insert into moderation_decisions (event_id, decision, decided_by, decided_at) values ($1,'approved',$2,$3)`, [ev.id, s.user.id, now]);
  await appendAudit(q, {
    at: now, ...actorOf(s), action: 'listing.published_by_team', targetType: 'event', targetId: ev.id, targetLabel: ev.title,
    diff: [{ f: 'status', a: ev.status, b: 'live' }, { f: 'visible_in', a: '—', b: 'Explore · TP.HCM' }],
  });
  await notifyOrganizer(q, now, {
    organizerId: ev.organizer_id, topic: 'moderation', kind: 'live',
    title: L(`${ev.title} is live`, `${ev.title} đã lên sóng`),
    body: L('Published by the FeestFinder team and now showing in Ho Chi Minh City.', 'Đội FeestFinder đã đăng tin này, đang hiển thị tại TP.HCM.'),
    cta: L('View dashboard', 'Xem dashboard'), link: { screen: 'dash', eventId: ev.id },
  });
  if (!ev.published_at) await announceNewListing(q, ev.id, now);
}

/** Two venue names are probably the same place when most of their longer words match. */
function venueLikeness(a: string, b: string): number {
  const words = (s: string) => new Set(searchNormalize(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 || /^\d+$/.test(w)));
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return 0;
  let common = 0;
  for (const w of A) if (B.has(w)) common++;
  return common / Math.min(A.size, B.size);
}

export default async function adminOpsRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  // ---- option lists: every dropdown in the back office reads from here ---------------------

  app.get('/meta/form-options', async () => {
    const [areas, venueAreas] = await Promise.all([
      many<{ area: string }>(ctx.db, `select distinct area from events where area is not null and area <> ''`),
      many<{ area: string }>(ctx.db, `select distinct area from venues`),
    ]);
    const known = new Set(AREA_GROUPS.flatMap((g) => g.areas));
    const other = [...new Set([...areas, ...venueAreas].map((a) => a.area))].filter((a) => !known.has(a)).sort();
    return {
      genres: GENRES.map((g) => ({ value: g, label: GENRE_LABEL[g].label, hint: GENRE_LABEL[g].hint })),
      areaGroups: [...AREA_GROUPS, ...(other.length ? [{ key: 'other', label: L('Other', 'Khác'), areas: other }] : [])],
      entryModes: Object.entries(ENTRY_MODES).map(([value, v]) => ({ value, ...v })),
      ages: Object.entries(AGES).map(([value, label]) => ({ value, label })),
      organizerTypes: Object.entries(ORG_TYPES).map(([value, label]) => ({ value, label })),
      statuses: STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] })),
      badges: Object.entries(BADGES).map(([value, label]) => ({ value, label })),
      tierPresets: Object.entries(TIER_NAMES).map(([key, name]) => ({ key, name })),
      banks: Object.entries(BANKS).map(([bin, name]) => ({ bin, name })),
      rejectReasons: Object.entries(REJECT_REASONS).map(([code, r]) => ({ code, label: r.label, appeal: r.appeal })),
      reportCategories: [...new Set(Object.values(REPORT_CATEGORY))].map((value) => ({ value, codes: Object.entries(REPORT_CATEGORY).filter(([, c]) => c === value).map(([k]) => ({ code: k, label: REPORT_CODES[k] })) })),
      orderStatuses: Object.entries(ORDER_STATUS).map(([value, label]) => ({ value, label })),
      paymentMethods: Object.entries(PAY_METHOD).map(([value, label]) => ({ value, label })),
      signupMethods: Object.entries(SIGNUP).map(([value, label]) => ({ value, label })),
    };
  });

  // ---- overview -----------------------------------------------------------------------------

  app.get('/admin/overview', async (req) => {
    requireAdmin(req);
    const now = ctx.clock.now();
    const today = vnDate(now);
    const dayStart = atVn(today);
    const [queue, counts, decided, orders, upcoming, activity] = await Promise.all([
      many<any>(ctx.db, `select submitted_at, flag, risk_score from events where status = 'in_review'`),
      one<any>(ctx.db,
        `select (select count(distinct event_id)::int from listing_reports where resolved_at is null) as reports,
                (select count(*)::int from appeals where state in ('open','replied') and closes_at > $1) as appeals,
                (select count(*)::int from organizers where verification_state = 'pending') as verification,
                (select count(*)::int from organizers where verification_state = 'flagged' or suspended_at is not null) as flagged_orgs,
                (select count(*)::int from events where venue_id is null and lat is null and venue_name is not null
                   and status in ('in_review','live') and coalesce(ends_on, starts_on, $2) >= $2) as unresolved_venues,
                (select count(*)::int from events where status = 'live' and starts_on between $2 and $3) as next7,
                (select count(*)::int from events where status = 'live' and ends_at >= $1) as live,
                (select count(*)::int from events where status = 'draft') as drafts,
                (select count(*)::int from users where created_at >= $4) as new_users,
                (select count(*)::int from organizers where created_at >= $5) as new_orgs,
                (select count(*)::int from ad_inquiries where status = 'new') as ads`,
        [now, today, addDays(today, 7), new Date(now.getTime() - 7 * 86400_000), new Date(now.getTime() - 30 * 86400_000)]),
      many<any>(ctx.db, `select decision, count(*)::int as n from moderation_decisions where decided_at >= $1 group by decision`, [dayStart]),
      one<any>(ctx.db, `select count(*)::int as n, coalesce(sum(total), 0)::bigint as gross from orders where status = 'paid' and paid_at >= $1`, [dayStart]),
      many<any>(ctx.db,
        `select e.id, e.title, e.starts_on, e.start_time, e.venue_name, e.capacity, e.art, e.cover_url, o.name as org_name,
                (select count(*)::int from tickets t where t.event_id = e.id and t.status in ('valid','used')) as sold
           from events e join organizers o on o.id = e.organizer_id
          where e.status = 'live' and coalesce(e.ends_on, e.starts_on) >= $1 order by e.starts_on, e.start_time limit 6`, [today]),
      many<any>(ctx.db, `select seq, at, actor_type, actor_label, action, target_type, target_id, target_label from audit_log order by seq desc limit 8`),
    ]);
    const waits = queue.map((r) => minutesSince(now, r.submitted_at));
    const sla = 4 * 60;
    const byDecision = Object.fromEntries(decided.map((d) => [d.decision, d.n]));
    return {
      queue: {
        total: queue.length, breach: waits.filter((m) => m >= sla).length, soon: waits.filter((m) => m >= sla - 120 && m < sla).length,
        flagged: queue.filter((r) => r.flag).length, highRisk: queue.filter((r) => riskBand(r.risk_score ?? 0) === 'high').length,
        oldestMinutes: waits.reduce((m, x) => Math.max(m, x), 0), slaMinutes: sla,
      },
      reports: counts.reports, appeals: counts.appeals, verification: counts.verification, flaggedOrganizers: counts.flagged_orgs,
      unresolvedVenues: counts.unresolved_venues, adInquiries: counts.ads,
      catalog: { live: counts.live, next7Days: counts.next7, drafts: counts.drafts },
      today: { approved: (byDecision.approved ?? 0) + (byDecision.overturned ?? 0), rejected: byDecision.rejected ?? 0, takenDown: byDecision.taken_down ?? 0, orders: orders.n, gross: Number(orders.gross) },
      growth: { newUsers7Days: counts.new_users, newOrganizers30Days: counts.new_orgs },
      upcoming: upcoming.map((e) => ({ id: e.id, title: e.title, startsOn: e.starts_on, startTime: e.start_time, venueName: e.venue_name, organizer: e.org_name, sold: e.sold, capacity: e.capacity, art: e.art, coverUrl: e.cover_url })),
      activity: activity.map((a) => ({
        seq: Number(a.seq), at: a.at, actorType: a.actor_type, actor: a.actor_label, action: a.action,
        label: { en: actionLabel(a.action, null, 'en'), vi: actionLabel(a.action, null, 'vi') },
        target: { type: a.target_type, id: a.target_id, label: a.target_label },
      })),
    };
  });

  // ---- the catalogue ------------------------------------------------------------------------

  const EventsQuery = z.object({
    q: z.string().max(80).optional(),
    status: csv(z.enum(STATUSES)).optional(),
    genre: csv(z.enum(GENRES)).optional(),
    area: z.string().max(400).optional(),
    organizerId: uuid.optional(),
    entry: csv(z.enum(['free', 'paid', 'donation'])).optional(),
    when: z.enum(['all', 'upcoming', 'today', 'week', 'weekend', 'month', 'past', 'undated', 'range']).default('all'),
    from: dateStr.optional(),
    to: dateStr.optional(),
    featured: bool.optional(),
    reported: bool.optional(),
    unresolved: bool.optional(),
    sort: z.enum(['date', 'date_desc', 'updated', 'hype', 'saves', 'sold', 'quality', 'title']).default('date'),
    limit: limit(200, 25),
    offset: z.coerce.number().int().min(0).max(100_000).default(0),
  });

  /** WHERE clauses for a catalogue query; `skip` leaves one filter out, for that filter's own counts. */
  function eventWhere(f: z.infer<typeof EventsQuery>, sql: SqlParams, today: string, skip?: 'status') {
    const where: string[] = ['true'];
    if (f.q?.trim()) {
      const raw = f.q.trim().replace(/[%_\\]/g, '');
      const n = sql.p(searchNormalize(raw));
      const r = sql.p(raw);
      where.push(`(e.search_text like '%' || ${n} || '%' or o.name ilike '%' || ${r} || '%' or e.slug = ${r} or e.id::text = ${r})`);
    }
    if (f.status?.length && skip !== 'status') where.push(`e.status = any(${sql.p(f.status)}::text[])`);
    if (f.genre?.length) where.push(`e.genre = any(${sql.p(f.genre)}::text[])`);
    const areas = (f.area ?? '').split('|').map((a) => a.trim()).filter(Boolean);
    if (areas.length) where.push(`e.area = any(${sql.p(areas)}::text[])`);
    if (f.organizerId) where.push(`e.organizer_id = ${sql.p(f.organizerId)}`);
    if (f.entry?.length) where.push(`e.entry_mode = any(${sql.p(f.entry)}::text[])`);
    if (f.featured !== undefined) where.push(`e.featured = ${sql.p(f.featured)}`);
    if (f.reported) where.push(`exists (select 1 from listing_reports r where r.event_id = e.id and r.resolved_at is null)`);
    if (f.unresolved) where.push(`e.venue_id is null and e.lat is null`);
    const overlap = (from: string, to: string) => where.push(`e.starts_on <= ${sql.p(to)} and coalesce(e.ends_on, e.starts_on) >= ${sql.p(from)}`);
    switch (f.when) {
      case 'upcoming': where.push(`coalesce(e.ends_on, e.starts_on) >= ${sql.p(today)}`); break;
      case 'today': overlap(today, today); break;
      case 'week': overlap(today, addDays(today, 6)); break;
      case 'weekend': { const w = weekendRange(today); overlap(w.from, w.to); break; }
      case 'month': overlap(today, monthEnd(today)); break;
      case 'past': where.push(`coalesce(e.ends_on, e.starts_on) < ${sql.p(today)}`); break;
      case 'undated': where.push('e.starts_on is null'); break;
      case 'range': overlap(f.from ?? '1900-01-01', f.to ?? '2999-12-31'); break;
    }
    return where.join(' and ');
  }

  const ORDER_BY: Record<string, string> = {
    date: '(e.starts_on is null), e.starts_on, e.start_time, e.title',
    date_desc: 'e.starts_on desc nulls last, e.start_time desc',
    updated: 'e.updated_at desc',
    hype: 'e.hype_count desc, e.starts_on',
    saves: 'e.save_count desc, e.starts_on',
    sold: 'sold desc, e.starts_on',
    quality: 'e.quality_score desc nulls last, e.starts_on',
    title: 'e.title',
  };

  const EVENT_LIST_SQL = `
    select e.*, o.name as org_name, o.initials as org_initials, o.verification_state as org_state,
           (select count(*)::int from tickets t where t.event_id = e.id and t.status in ('valid','used')) as sold,
           (select count(*)::int from listing_reports r where r.event_id = e.id and r.resolved_at is null) as open_reports
      from events e join organizers o on o.id = e.organizer_id`;

  const presentRow = (e: any) => ({
    id: e.id, slug: e.slug, title: e.title, art: e.art, coverUrl: e.cover_url, logoUrl: e.logo_url,
    status: e.status, statusLabel: STATUS_LABEL[e.status], genre: e.genre, area: e.area,
    venueName: e.venue_name, venueResolved: !!e.venue_id || e.lat !== null,
    startsOn: e.starts_on, endsOn: e.ends_on, startTime: e.start_time, endTime: e.end_time,
    entryMode: e.entry_mode, priceFrom: Number(e.price_from), capacity: e.capacity, age: e.age,
    organizer: { id: e.organizer_id, name: e.org_name, initials: e.org_initials, verified: e.org_state === 'verified' },
    featured: e.featured, badge: e.badge, hype: e.hype_count, saves: e.save_count, sold: e.sold, openReports: e.open_reports,
    heldForReports: e.held_for_reports, qualityScore: e.quality_score, riskScore: e.risk_score,
    submittedAt: e.submitted_at, publishedAt: e.published_at, updatedAt: e.updated_at, createdAt: e.created_at,
  });

  app.get('/admin/events', async (req) => {
    requireAdmin(req);
    const f = parse(EventsQuery, req.query);
    const today = vnDate(ctx.clock.now());
    const sql = new SqlParams();
    const where = eventWhere(f, sql, today);
    const facetSql = new SqlParams();
    const facetWhere = eventWhere(f, facetSql, today, 'status');
    const [rows, total, facets] = await Promise.all([
      many<any>(ctx.db, `${EVENT_LIST_SQL} where ${where} order by ${ORDER_BY[f.sort]} limit ${f.limit} offset ${f.offset}`, sql.values),
      one<any>(ctx.db, `select count(*)::int as n from events e join organizers o on o.id = e.organizer_id where ${where}`, sql.values),
      many<any>(ctx.db, `select e.status, count(*)::int as n from events e join organizers o on o.id = e.organizer_id where ${facetWhere} group by e.status`, facetSql.values),
    ]);
    return {
      items: rows.map(presentRow), total: total.n, offset: f.offset, limit: f.limit,
      facets: { status: Object.fromEntries(STATUSES.map((st) => [st, facets.find((x) => x.status === st)?.n ?? 0])) },
    };
  });

  app.get('/admin/events.csv', async (req, reply) => {
    requireAdmin(req);
    const f = parse(EventsQuery, { ...(req.query as object), limit: 200 });
    const today = vnDate(ctx.clock.now());
    const sql = new SqlParams();
    const rows = await many<any>(ctx.db, `${EVENT_LIST_SQL} where ${eventWhere(f, sql, today)} order by ${ORDER_BY[f.sort]} limit 5000`, sql.values);
    const out = toCsv(
      ['id', 'title', 'status', 'organizer', 'genre', 'area', 'venue', 'starts_on', 'ends_on', 'doors', 'close', 'entry', 'price_from', 'capacity', 'sold', 'hype', 'saves', 'open_reports', 'quality', 'featured', 'url'],
      rows.map((e) => [e.id, e.title, e.status, e.org_name, e.genre, e.area, e.venue_name, e.starts_on, e.ends_on, e.start_time, e.end_time, e.entry_mode,
        e.price_from, e.capacity, e.sold, e.hype_count, e.save_count, e.open_reports, e.quality_score, e.featured, `${ctx.config.publicBaseUrl}/e/${e.slug}`]));
    return reply.type('text/csv; charset=utf-8').header('content-disposition', `attachment; filename="events-${today}.csv"`).send(out);
  });

  /** Everything the team sees about one listing: the draft, its organiser, tiers, reviews, reports and trail. */
  async function eventDetail(id: string) {
    const now = ctx.clock.now();
    const ev = await one<any>(ctx.db, 'select * from events where id = $1', [id]);
    if (!ev) throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
    const [org, tiers, stages, decisions, appeal, reports, metrics, sales, thread, history, shelves] = await Promise.all([
      one<any>(ctx.db, 'select * from organizers where id = $1', [ev.organizer_id]),
      many<any>(ctx.db, 'select * from ticket_tiers where event_id = $1 order by sort, price', [id]),
      many<any>(ctx.db, `select s.id, s.name, (select count(*)::int from sets x where x.stage_id = s.id) as sets from stages s where s.event_id = $1 order by s.sort`, [id]),
      many<any>(ctx.db, `select d.*, u.name as by_name from moderation_decisions d left join users u on u.id = d.decided_by where d.event_id = $1 order by d.decided_at desc`, [id]),
      one<any>(ctx.db, 'select * from appeals where event_id = $1 order by created_at desc limit 1', [id]),
      many<any>(ctx.db, `select code, count(*)::int as n, max(note) as note from listing_reports where event_id = $1 and resolved_at is null group by code`, [id]),
      one<any>(ctx.db, `select coalesce(sum(views), 0)::int as views, coalesce(sum(ticket_clicks), 0)::int as clicks from event_metrics_daily where event_id = $1`, [id]),
      one<any>(ctx.db, `select count(*) filter (where status = 'paid')::int as orders, coalesce(sum(qty) filter (where status = 'paid'), 0)::int as tickets,
                               coalesce(sum(total) filter (where status = 'paid'), 0)::bigint as gross, count(*) filter (where status = 'refunded')::int as refunded
                          from orders where event_id = $1`, [id]),
      one<any>(ctx.db, `select t.id, (select count(*)::int from inbox_messages m where m.thread_id = t.id) as messages from inbox_threads t where t.event_id = $1 and t.topic = 'moderation' order by t.created_at desc limit 1`, [id]),
      many<any>(ctx.db, `select seq, at, actor_type, actor_label, action, diff from audit_log where target_id = $1 order by seq desc limit 30`, [id]),
      many<any>(ctx.db, `select s.id, s.name, s.enabled from shelf_items i join shelves s on s.id = i.shelf_id where i.event_id = $1`, [id]),
    ]);
    const band = riskBand(ev.risk_score ?? 0);
    return {
      ...presentDraft(ev),
      art: ev.art, city: ev.city, featured: ev.featured, badge: ev.badge, soldOut: ev.sold_out, heldForReports: ev.held_for_reports,
      createdAt: ev.created_at, updatedAt: ev.updated_at, decidedAt: ev.decided_at,
      ticketLinkStatus: ev.ticket_link_status, flag: ev.flag ? { code: ev.flag, label: REJECT_REASONS[ev.flag]?.label ?? null } : null,
      risk: { score: ev.risk_score ?? 0, band, factors: ev.risk_factors ?? [], signals: ev.signals ?? [] },
      waitingMinutes: ev.status === 'in_review' ? minutesSince(now, ev.submitted_at) : null,
      missing: missingForSubmit(ev), missingForPublish: missingForPublish(ev),
      organizer: org && {
        id: org.id, slug: org.slug, name: org.name, initials: org.initials, type: org.type, verified: org.verification_state === 'verified',
        state: org.verification_state, strikes: org.strikes, suspended: !!org.suspended_at, logoUrl: org.logo_url, email: org.email, hotline: org.hotline,
      },
      tiers: tiers.map((t) => ({ id: t.id, key: t.key, name: t.name, note: t.note, price: Number(t.price), capacity: t.capacity, sold: t.sold, isLast: t.is_last, salesOpenAt: t.sales_open_at, priceRiseOn: t.price_rise_on, priceRiseTo: t.price_rise_to ? Number(t.price_rise_to) : null })),
      stages: stages.map((st) => ({ id: st.id, name: st.name, sets: st.sets })),
      decisions: decisions.map((d) => ({
        id: d.id, decision: d.decision, reasonCode: d.reason_code, reason: d.reason_code ? REJECT_REASONS[d.reason_code]?.label ?? null : null,
        message: d.message, allowAppeal: d.allow_appeal, by: d.by_name, at: d.decided_at,
      })),
      appeal: appeal && { id: appeal.id, state: appeal.state, reply: appeal.reply, closesAt: appeal.closes_at, reasonCode: appeal.reason_code },
      reports: reports.map((r) => ({ code: r.code, label: REPORT_CODES[r.code] ?? null, category: REPORT_CATEGORY[r.code] ?? null, count: r.n, note: r.note })),
      metrics: { views: metrics.views, clicks: metrics.clicks, saves: ev.save_count, hype: ev.hype_count, orders: sales.orders, tickets: sales.tickets, gross: Number(sales.gross), refunded: sales.refunded },
      thread: thread ? { id: thread.id, messages: thread.messages } : null,
      history: history.map((a) => ({ seq: Number(a.seq), at: a.at, actorType: a.actor_type, actor: a.actor_label, action: a.action, label: { en: actionLabel(a.action, a.diff, 'en'), vi: actionLabel(a.action, a.diff, 'vi') }, diff: (a.diff ?? []).map((d: any) => ({ field: d.f, before: d.a, after: d.b })) })),
      shelves: shelves.map((sh) => ({ id: sh.id, name: sh.name, enabled: sh.enabled })),
      publicUrl: `/e/${ev.slug}`,
    };
  }

  app.get<{ Params: { id: string } }>('/admin/events/:id', async (req) => {
    requireAdmin(req);
    return eventDetail(parse(uuid, req.params.id));
  });

  const TeamExtras = z.object({
    featured: z.boolean(),
    badge: z.enum(Object.keys(BADGES) as [string, ...string[]]).nullable(),
  }).partial();

  app.post('/admin/events', async (req, reply) => {
    const s = requireAdmin(req);
    const body = parse(DraftInput.merge(TeamExtras).extend({ organizerId: uuid, publish: z.boolean().default(false) }), req.body ?? {});
    const now = ctx.clock.now();
    const id = await ctx.db.tx(async (q) => {
      const org = await one<any>(q, 'select id, name, art from organizers where id = $1', [body.organizerId]);
      if (!org) throw badRequest('organizer_unknown', L('Pick the organiser from the list', 'Chọn nhà tổ chức trong danh sách'));
      const title = body.title?.trim() || 'Untitled event';
      const ev = await one<any>(q,
        `insert into events (slug, organizer_id, title, status, art, featured, badge) values ($1,$2,$3,'draft',$4,$5,$6) returning id`,
        [`${slugify(title) || 'event'}-${randomCode(4).toLowerCase()}`, org.id, title, org.art ?? ARTS[0], body.featured ?? false, body.badge ?? null]);
      await applyDraft(ctx, q, ev.id, body);
      await appendAudit(q, {
        at: now, ...actorOf(s), action: 'listing.created_by_team', targetType: 'event', targetId: ev.id, targetLabel: title,
        diff: [{ f: 'organizer', a: '—', b: org.name }, { f: 'status', a: '—', b: body.publish ? 'live' : 'draft' }],
      });
      if (body.publish) {
        const row = await one<any>(q, 'select * from events where id = $1', [ev.id]);
        const missing = missingForPublish(row);
        if (missing.length) throw badRequest('not_ready', L('Fill in the required fields before publishing', 'Điền đủ thông tin bắt buộc trước khi đăng'), { missing });
        await publishByTeam(ctx, q, s, row, now);
      }
      return ev.id as string;
    });
    return reply.code(201).send({ ...(await eventDetail(id)), message: body.publish ? L('Published', 'Đã đăng') : L('Draft saved', 'Đã lưu nháp') });
  });

  app.patch<{ Params: { id: string } }>('/admin/events/:id', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const body = parse(DraftInput.merge(TeamExtras), req.body ?? {});
    const now = ctx.clock.now();
    const changed = await ctx.db.tx(async (q) => {
      const before = await one<any>(q, 'select * from events where id = $1 for update', [id]);
      if (!before) throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
      await applyDraft(ctx, q, id, body);
      if (body.featured !== undefined || body.badge !== undefined) {
        await q.query('update events set featured = coalesce($2, featured), badge = case when $3::boolean then $4 else badge end where id = $1',
          [id, body.featured ?? null, body.badge !== undefined, body.badge ?? null]);
      }
      const after = await one<any>(q, 'select * from events where id = $1', [id]);
      const diff = diffRows(before, after);
      if (after.status === 'in_review' && diff.some((d) => ['venue', 'address', 'area', 'ticket_url', 'entry', 'price_from', 'cover'].includes(d.f))) {
        const risk = await assessRisk(q, id, now);
        await q.query('update events set risk_score = $2, risk_factors = $3, signals = $4, flag = $5 where id = $1', [id, risk.score, json(risk.factors), json(risk.signals), risk.flag]);
      }
      if (diff.length) {
        await appendAudit(q, { at: now, ...actorOf(s), action: 'listing.edited_by_team', targetType: 'event', targetId: id, targetLabel: after.title, diff: diff.slice(0, 12) });
      }
      return diff.length;
    });
    return { ...(await eventDetail(id)), message: changed ? L('Changes saved', 'Đã lưu thay đổi') : L('Nothing changed', 'Không có thay đổi') };
  });

  app.put<{ Params: { id: string } }>('/admin/events/:id/tiers', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const { tiers } = parse(TiersInput, req.body);
    const now = ctx.clock.now();
    await ctx.db.tx(async (q) => {
      const ev = await one<any>(q, 'select id, title from events where id = $1', [id]);
      if (!ev) throw notFound();
      const before = await many<any>(q, 'select key from ticket_tiers where event_id = $1', [id]);
      await replaceTiers(q, id, tiers);
      await appendAudit(q, { at: now, ...actorOf(s), action: 'listing.tiers_changed', targetType: 'event', targetId: id, targetLabel: ev.title,
        diff: [{ f: 'tiers', a: before.map((t) => t.key).join(', ') || '—', b: tiers.map((t) => t.key).join(', ') }] });
    });
    return eventDetail(id);
  });

  app.post<{ Params: { id: string } }>('/admin/events/:id/duplicate', async (req, reply) => {
    const s = requireAdmin(req);
    const ev = await one<any>(ctx.db, 'select * from events where id = $1', [parse(uuid, req.params.id)]);
    if (!ev) throw notFound();
    const copy = await duplicateEvent(ctx, ev, ev.organizer_id);
    await ctx.db.tx((q) => appendAudit(q, { at: ctx.clock.now(), ...actorOf(s), action: 'listing.created_by_team', targetType: 'event', targetId: copy.id, targetLabel: copy.title,
      diff: [{ f: 'copied_from', a: '—', b: ev.title }] }));
    return reply.code(201).send({ id: copy.id, message: L('Copied into a new draft', 'Đã sao chép thành bản nháp mới') });
  });

  /** Status changes the team makes outside the queue: publish, take down, mark cancelled, restore. */
  app.post<{ Params: { id: string } }>('/admin/events/:id/status', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const body = parse(z.object({
      action: z.enum(['publish', 'take_down', 'cancel', 'restore']),
      code: z.enum(Object.keys(REJECT_REASONS) as [string, ...string[]]).optional(),
      message: z.string().trim().max(2000).optional(),
    }), req.body);
    const now = ctx.clock.now();
    const message = await ctx.db.tx(async (q): Promise<Localized> => {
      const ev = await one<any>(q, 'select * from events where id = $1 for update', [id]);
      if (!ev) throw notFound();
      const allowed: Record<string, string[]> = {
        publish: ['draft', 'in_review', 'rejected'], take_down: ['live', 'in_review'], cancel: ['live', 'in_review', 'draft'], restore: ['removed', 'cancelled'],
      };
      if (!allowed[body.action].includes(ev.status)) {
        throw conflict('wrong_status', L(`A listing that is ${STATUS_LABEL[ev.status].en.toLowerCase()} can't do that`, `Tin đang ở trạng thái "${STATUS_LABEL[ev.status].vi}" không làm được thao tác này`));
      }
      const tell = async (title: Localized, text: Localized) => {
        if (body.message) {
          const threadId = await moderationThread(q, ev, now);
          await q.query(`insert into inbox_messages (thread_id, sender, author_id, body, created_at) values ($1,'ff',$2,$3,$4)`, [threadId, s.user.id, json({ en: body.message, vi: body.message }), now]);
          await q.query('update inbox_threads set organizer_unread = true, updated_at = $2 where id = $1', [threadId, now]);
        }
        await notifyOrganizer(q, now, { organizerId: ev.organizer_id, topic: 'moderation', kind: 'reject', title, body: text, cta: L('Open moderation thread', 'Mở thư kiểm duyệt'), link: { screen: 'inbox' } });
      };
      if (body.action === 'publish') {
        const missing = missingForPublish(ev);
        if (missing.length) throw badRequest('not_ready', L('Fill in the required fields before publishing', 'Điền đủ thông tin bắt buộc trước khi đăng'), { missing });
        if (ev.status === 'in_review') await approveListing(ctx, q, s, id, 'listing.approved');
        else await publishByTeam(ctx, q, s, ev, now);
        return L('Published', 'Đã đăng');
      }
      if (body.action === 'take_down') {
        await q.query(`update events set status = 'removed', decided_at = $2 where id = $1`, [id, now]);
        await q.query(`insert into moderation_decisions (event_id, decision, reason_code, message, decided_by, decided_at) values ($1,'taken_down',$2,$3,$4,$5)`, [id, body.code ?? null, body.message ?? null, s.user.id, now]);
        await appendAudit(q, { at: now, ...actorOf(s), action: 'listing.taken_down', targetType: 'event', targetId: id, targetLabel: ev.title,
          diff: [{ f: 'status', a: ev.status, b: 'removed' }, ...(body.code ? [{ f: 'reason_code', a: '—', b: body.code }] : [])] });
        await tell(L('Listing taken down', 'Tin đã bị hạ'), L(`${ev.title} was taken down by the FeestFinder team.`, `${ev.title} đã bị đội FeestFinder hạ xuống.`));
        return L(`Taken down · ${ev.title}`, `Đã hạ · ${ev.title}`);
      }
      if (body.action === 'cancel') {
        const sold = await one<any>(q, `select count(*)::int as n from orders where event_id = $1 and status = 'paid'`, [id]);
        await q.query(`update events set status = 'cancelled', decided_at = $2 where id = $1`, [id, now]);
        await appendAudit(q, { at: now, ...actorOf(s), action: 'listing.cancelled', targetType: 'event', targetId: id, targetLabel: ev.title,
          diff: [{ f: 'status', a: ev.status, b: 'cancelled' }, { f: 'paid_orders', a: String(sold.n), b: String(sold.n) }] });
        await tell(L('Event marked cancelled', 'Sự kiện được đánh dấu huỷ'), L(`${ev.title} now shows as cancelled.`, `${ev.title} đang hiển thị là đã huỷ.`));
        return sold.n
          ? L(`Marked cancelled · ${sold.n} paid orders still need refunds`, `Đã đánh dấu huỷ · còn ${sold.n} đơn đã thanh toán cần hoàn tiền`)
          : L('Marked cancelled', 'Đã đánh dấu huỷ');
      }
      await q.query(`update events set status = 'live', decided_at = $2, published_at = coalesce(published_at, $2) where id = $1`, [id, now]);
      await appendAudit(q, { at: now, ...actorOf(s), action: 'listing.restored', targetType: 'event', targetId: id, targetLabel: ev.title, diff: [{ f: 'status', a: ev.status, b: 'live' }] });
      return L('Restored and live again', 'Đã khôi phục, tin đang chạy lại');
    });
    return { ...(await eventDetail(id)), message };
  });

  // ---- venues ------------------------------------------------------------------------------

  const VenueInput = z.object({
    name: z.string().trim().min(2).max(160),
    address: z.string().trim().min(3).max(240),
    area: z.string().trim().min(2).max(60),
    lat: z.number().min(8).max(24),
    lng: z.number().min(102).max(110),
    verified: z.boolean().default(true),
    permitOnFile: z.boolean().default(false),
  });

  app.get('/admin/venues', async (req) => {
    requireAdmin(req);
    const f = parse(z.object({ q: z.string().max(80).optional(), area: z.string().max(60).optional(), verified: bool.optional(), permit: bool.optional() }), req.query);
    const now = ctx.clock.now();
    const today = vnDate(now);
    const [rows, unresolved] = await Promise.all([
      many<any>(ctx.db,
        `select v.*, (select count(*)::int from events e where e.venue_id = v.id) as events,
                (select count(*)::int from events e where e.venue_id = v.id and e.status = 'live' and coalesce(e.ends_on, e.starts_on) >= $1) as upcoming,
                (select max(e.starts_on) from events e where e.venue_id = v.id and e.published_at is not null) as last_event
           from venues v order by v.name`, [today]),
      many<any>(ctx.db,
        `select e.id, e.title, e.status, e.starts_on, e.venue_name, e.address, e.area, o.name as org_name
           from events e join organizers o on o.id = e.organizer_id
          where e.venue_id is null and e.lat is null and e.venue_name is not null and e.status in ('in_review','live')
            and coalesce(e.ends_on, e.starts_on, $1) >= $1
          order by (e.status = 'in_review') desc, e.starts_on`, [today]),
    ]);
    const needle = f.q ? searchNormalize(f.q) : '';
    const items = rows
      .filter((v) => !needle || searchNormalize(`${v.name} ${v.address} ${v.area}`).includes(needle))
      .filter((v) => !f.area || v.area === f.area)
      .filter((v) => f.verified === undefined || v.verified === f.verified)
      .filter((v) => f.permit === undefined || v.permit_on_file === f.permit)
      .map((v) => ({ id: v.id, name: v.name, address: v.address, area: v.area, city: v.city, lat: v.lat, lng: v.lng, verified: v.verified, permitOnFile: v.permit_on_file, events: v.events, upcoming: v.upcoming, lastEvent: v.last_event }));
    return {
      items, total: rows.length,
      unresolved: unresolved.map((e) => ({
        id: e.id, title: e.title, status: e.status, statusLabel: STATUS_LABEL[e.status], startsOn: e.starts_on, organizer: e.org_name,
        venueName: e.venue_name, address: e.address, area: e.area,
        suggestions: rows.map((v) => ({ id: v.id, name: v.name, area: v.area, score: Math.max(venueLikeness(`${e.venue_name}`, v.name), venueLikeness(`${e.address ?? ''}`, v.address) * 0.9) }))
          .filter((x) => x.score >= 0.5).sort((a, b) => b.score - a.score).slice(0, 3),
      })),
    };
  });

  app.post('/admin/venues', async (req, reply) => {
    const s = requireAdmin(req);
    const body = parse(VenueInput, req.body);
    const now = ctx.clock.now();
    const row = await ctx.db.tx(async (q) => {
      const all = await many<any>(q, 'select id, name from venues');
      const dupe = all.find((v) => searchNormalize(v.name) === searchNormalize(body.name));
      if (dupe) throw conflict('venue_exists', L('A venue with this name already exists', 'Đã có địa điểm trùng tên'), { id: dupe.id });
      const v = await one<any>(q, 'insert into venues (name, address, area, lat, lng, verified, permit_on_file) values ($1,$2,$3,$4,$5,$6,$7) returning *',
        [body.name, body.address, body.area, body.lat, body.lng, body.verified, body.permitOnFile]);
      await appendAudit(q, { at: now, ...actorOf(s), action: 'venue.created', targetType: 'venue', targetId: v.id, targetLabel: v.name,
        diff: [{ f: 'area', a: '—', b: v.area }, { f: 'pin', a: '—', b: `${v.lat.toFixed(4)}, ${v.lng.toFixed(4)}` }] });
      return v;
    });
    return reply.code(201).send({ id: row.id, name: row.name, address: row.address, area: row.area, lat: row.lat, lng: row.lng, verified: row.verified, permitOnFile: row.permit_on_file, message: L('Venue added', 'Đã thêm địa điểm') });
  });

  app.patch<{ Params: { id: string } }>('/admin/venues/:id', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const body = parse(VenueInput.partial(), req.body);
    const now = ctx.clock.now();
    return ctx.db.tx(async (q) => {
      const old = await one<any>(q, 'select * from venues where id = $1 for update', [id]);
      if (!old) throw notFound();
      const v = await one<any>(q,
        `update venues set name = coalesce($2, name), address = coalesce($3, address), area = coalesce($4, area), lat = coalesce($5, lat), lng = coalesce($6, lng),
                verified = coalesce($7, verified), permit_on_file = coalesce($8, permit_on_file) where id = $1 returning *`,
        [id, body.name ?? null, body.address ?? null, body.area ?? null, body.lat ?? null, body.lng ?? null, body.verified ?? null, body.permitOnFile ?? null]);
      // Listings copy the venue's details; keep the ones still to come in step.
      const moved = await many<any>(q,
        `update events set venue_name = $2, address = $3, area = $4, lat = $5, lng = $6
          where venue_id = $1 and coalesce(ends_on, starts_on, $7) >= $7 returning id`, [id, v.name, v.address, v.area, v.lat, v.lng, vnDate(now)]);
      for (const e of moved) await refreshDerived(q, e.id);
      const diff: DiffRow[] = [];
      for (const [col, f] of [['name', 'name'], ['address', 'address'], ['area', 'area'], ['verified', 'verified'], ['permit_on_file', 'permit']] as const) {
        if (old[col] !== v[col]) diff.push({ f, a: short(old[col]), b: short(v[col]) });
      }
      if (old.lat !== v.lat || old.lng !== v.lng) diff.push({ f: 'pin', a: `${old.lat.toFixed(4)}, ${old.lng.toFixed(4)}`, b: `${v.lat.toFixed(4)}, ${v.lng.toFixed(4)}` });
      if (diff.length) await appendAudit(q, { at: now, ...actorOf(s), action: 'venue.updated', targetType: 'venue', targetId: id, targetLabel: v.name, diff });
      return {
        id: v.id, name: v.name, address: v.address, area: v.area, lat: v.lat, lng: v.lng, verified: v.verified, permitOnFile: v.permit_on_file,
        message: moved.length ? L(`Saved · ${moved.length} upcoming listings updated`, `Đã lưu · cập nhật ${moved.length} tin sắp diễn ra`) : L('Saved', 'Đã lưu'),
      };
    });
  });

  // ---- organisers: profile, standing, team, onboarding -----------------------------------------

  app.get<{ Params: { id: string } }>('/admin/organizers/:id', async (req) => {
    requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const now = ctx.clock.now();
    const o = await one<any>(ctx.db, 'select * from organizers where id = $1', [id]);
    if (!o) throw notFound();
    const [members, events, stats, decisions] = await Promise.all([
      many<any>(ctx.db, `select u.id, u.name, u.email, u.phone, u.last_active_at, u.password_hash is not null as has_password, m.role
                           from organizer_members m join users u on u.id = m.user_id where m.organizer_id = $1 order by m.role = 'owner' desc, u.name`, [id]),
      many<any>(ctx.db, `select id, slug, title, status, starts_on, genre, quality_score from events where organizer_id = $1 order by starts_on desc nulls first limit 60`, [id]),
      one<any>(ctx.db,
        `select (select count(*)::int from events where organizer_id = $1 and status = 'live' and (ends_at is null or ends_at >= $2)) as live,
                (select count(*)::int from listing_reports r join events e on e.id = r.event_id where e.organizer_id = $1) as reports,
                coalesce((select sum(x.total - x.fee) from orders x join events e on e.id = x.event_id where e.organizer_id = $1 and x.status = 'paid'), 0)::bigint as gmv`, [id, now]),
      many<any>(ctx.db, `select d.decision, count(*)::int as n from moderation_decisions d join events e on e.id = d.event_id where e.organizer_id = $1 group by d.decision`, [id]),
    ]);
    return {
      id: o.id, slug: o.slug, name: o.name, initials: o.initials, type: o.type, typeLabel: ORG_TYPES[o.type], bio: o.bio, art: o.art, logoUrl: o.logo_url,
      website: o.website, legalName: o.legal_name, taxCode: o.tax_code, address: o.address, email: o.email, hotline: o.hotline, zalo: o.zalo,
      contactName: o.contact_name, contactRole: o.contact_role, since: o.since_year, followers: o.followers_count, createdAt: o.created_at,
      state: o.verification_state, docs: { id: o.doc_id, tax: o.doc_tax, bank: o.doc_bank }, strikes: o.strikes, suspended: !!o.suspended_at, suspendedAt: o.suspended_at,
      bank: o.bank_account_no ? { bin: o.bank_bin, bankName: o.bank_name, accountNo: o.bank_account_no, accountName: o.bank_account_name, verified: o.bank_verified, addedAt: o.bank_added_at } : null,
      members: members.map((m) => ({ id: m.id, name: m.name, email: m.email, phone: m.phone, role: m.role, lastActiveAt: m.last_active_at, hasPassword: m.has_password })),
      events: events.map((e) => ({ id: e.id, slug: e.slug, title: e.title, status: e.status, statusLabel: STATUS_LABEL[e.status], startsOn: e.starts_on, genre: e.genre, qualityScore: e.quality_score })),
      stats: { live: stats.live, reports: stats.reports, gmv: Number(stats.gmv), decisions: Object.fromEntries(decisions.map((d) => [d.decision, d.n])) },
    };
  });

  /** Finds the account for an email, or opens one with no password: the person sets it with "Forgot password". */
  async function accountFor(q: Queryable, email: string, name: string | undefined, now: Date): Promise<{ id: string; created: boolean }> {
    const e = normalizeEmail(email);
    if (!isEmail(e)) throw badRequest('invalid_email', L('That email address does not look right', 'Email chưa đúng định dạng'));
    const u = await one<any>(q, 'select id from users where email = $1', [e]);
    if (u) return { id: u.id, created: false };
    const row = await one<any>(q, `insert into users (email, name, signup_method, locale, created_at) values ($1,$2,'email','vi',$3) returning id`, [e, name?.trim() ?? '', now]);
    return { id: row.id, created: true };
  }

  const ProfileInput = z.object({
    name: z.string().trim().min(2).max(80), type: z.enum(['promoter', 'venue', 'company', 'agency', 'public']), bio: localized,
    logoUrl: z.string().url().nullable(), website: z.string().url().nullable().or(z.literal('')), legalName: z.string().max(160),
    taxCode: z.string().max(20), address: z.string().max(240), email: z.string().max(200), hotline: z.string().max(30),
    zalo: z.string().max(80), contactName: z.string().max(80), contactRole: z.string().max(80),
  }).partial();

  const PROFILE_COLUMNS: Record<string, string> = {
    name: 'name', type: 'type', logoUrl: 'logo_url', website: 'website', legalName: 'legal_name', taxCode: 'tax_code', address: 'address',
    email: 'email', hotline: 'hotline', zalo: 'zalo', contactName: 'contact_name', contactRole: 'contact_role',
  };

  function profileSet(body: z.infer<typeof ProfileInput>): Record<string, unknown> {
    if (body.email && !isEmail(body.email)) throw badRequest('invalid_email', L('That email address does not look right', 'Email chưa đúng định dạng'));
    if (body.taxCode && !/^\d{10,14}$/.test(body.taxCode.replace(/[\s-]/g, ''))) throw badRequest('invalid_tax_code', L('Tax codes are 10 to 14 digits', 'Mã số thuế gồm 10 đến 14 chữ số'));
    const set: Record<string, unknown> = {};
    for (const [k, col] of Object.entries(PROFILE_COLUMNS)) {
      const v = (body as any)[k];
      if (v !== undefined) set[col] = typeof v === 'string' ? v.trim() || null : v;
    }
    if (body.name) { set.name = body.name.trim(); set.initials = initialsOf(body.name.replace(/[^\p{L}\p{N}\s]/gu, '')) || 'FF'; }
    if (body.email) set.email = normalizeEmail(body.email);
    if (body.taxCode) set.tax_code = body.taxCode.replace(/[\s-]/g, '');
    if (body.bio) set.bio = json(body.bio);
    return set;
  }

  app.post('/admin/organizers', async (req, reply) => {
    const s = requireAdmin(req);
    const body = parse(ProfileInput.extend({
      name: z.string().trim().min(2).max(80), type: z.enum(['promoter', 'venue', 'company', 'agency', 'public']),
      ownerEmail: z.string().max(200), ownerName: z.string().max(80).optional(),
    }), req.body);
    const now = ctx.clock.now();
    const out = await ctx.db.tx(async (q) => {
      const set = profileSet(body);
      let slug = slugify(body.name) || 'organizer';
      if (await one(q, 'select 1 from organizers where slug = $1', [slug])) slug = `${slug}-${randomCode(4).toLowerCase()}`;
      const cols = ['slug', 'art', 'since_year', 'verification_state', ...Object.keys(set)];
      const vals = [slug, ARTS[Math.floor(Math.random() * ARTS.length)], Number(vnDate(now).slice(0, 4)), 'pending', ...Object.values(set)];
      if (!set.bio) { cols.push('bio'); vals.push(json({ en: '', vi: '' })); }
      const org = await one<any>(q, `insert into organizers (${cols.join(', ')}) values (${cols.map((_, i) => `$${i + 1}`).join(', ')}) returning *`, vals);
      const owner = await accountFor(q, body.ownerEmail, body.ownerName ?? body.contactName, now);
      await q.query(`insert into organizer_members (organizer_id, user_id, role) values ($1,$2,'owner') on conflict do nothing`, [org.id, owner.id]);
      await appendAudit(q, { at: now, ...actorOf(s), action: 'organizer.created', targetType: 'organizer', targetId: org.id, targetLabel: org.name,
        diff: [{ f: 'type', a: '—', b: org.type }, { f: 'owner', a: '—', b: normalizeEmail(body.ownerEmail) }, { f: 'account', a: '—', b: owner.created ? 'new' : 'existing' }] });
      return { org, owner };
    });
    return reply.code(201).send({
      id: out.org.id, slug: out.org.slug, name: out.org.name, ownerCreated: out.owner.created,
      message: out.owner.created
        ? L(`${out.org.name} created. The owner sets a password from "Forgot password" on the sign-in screen.`, `Đã tạo ${out.org.name}. Chủ tài khoản đặt mật khẩu qua "Quên mật khẩu" ở màn hình đăng nhập.`)
        : L(`${out.org.name} created and linked to the existing account.`, `Đã tạo ${out.org.name} và gắn với tài khoản sẵn có.`),
    });
  });

  app.patch<{ Params: { id: string } }>('/admin/organizers/:id/profile', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const body = parse(ProfileInput, req.body);
    const now = ctx.clock.now();
    await ctx.db.tx(async (q) => {
      const old = await one<any>(q, 'select * from organizers where id = $1 for update', [id]);
      if (!old) throw notFound();
      const set = profileSet(body);
      const keys = Object.keys(set);
      if (!keys.length) return;
      await q.query(`update organizers set ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')} where id = $1`, [id, ...keys.map((k) => set[k])]);
      const diff = keys.filter((k) => k !== 'initials' && JSON.stringify(old[k] ?? null) !== JSON.stringify(k === 'bio' ? JSON.parse(set[k] as string) : set[k]))
        .map((k) => ({ f: k, a: k === 'bio' ? '…' : short(old[k]), b: k === 'bio' ? '…' : short(set[k]) }));
      if (diff.length) await appendAudit(q, { at: now, ...actorOf(s), action: 'organizer.updated', targetType: 'organizer', targetId: id, targetLabel: (set.name as string) ?? old.name, diff });
    });
    return { ok: true, message: L('Profile saved', 'Đã lưu hồ sơ') };
  });

  app.post<{ Params: { id: string } }>('/admin/organizers/:id/standing', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const body = parse(z.object({ strikes: z.number().int().min(0).max(3).optional(), suspended: z.boolean().optional(), note: z.string().trim().max(500).optional() }), req.body);
    const now = ctx.clock.now();
    return ctx.db.tx(async (q) => {
      const o = await one<any>(q, 'select * from organizers where id = $1 for update', [id]);
      if (!o) throw notFound();
      const strikes = body.strikes ?? o.strikes;
      const suspended = body.suspended ?? !!o.suspended_at;
      await q.query('update organizers set strikes = $2, suspended_at = $3 where id = $1', [id, strikes, suspended ? (o.suspended_at ?? now) : null]);
      if (suspended !== !!o.suspended_at) {
        await appendAudit(q, { at: now, ...actorOf(s), action: suspended ? 'organizer.suspended' : 'organizer.reinstated', targetType: 'organizer', targetId: id, targetLabel: o.name,
          diff: [{ f: 'suspended', a: String(!!o.suspended_at), b: String(suspended) }, ...(body.note ? [{ f: 'note', a: '—', b: short(body.note) }] : [])] });
        await notifyOrganizer(q, now, {
          organizerId: id, topic: 'moderation', kind: 'reject',
          title: suspended ? L('Account suspended', 'Tài khoản bị tạm dừng') : L('Account reinstated', 'Tài khoản đã được mở lại'),
          body: suspended ? L('New listings cannot be submitted until FeestFinder lifts the suspension.', 'Không gửi được tin mới cho tới khi FeestFinder mở lại tài khoản.') : L('You can submit listings again.', 'Bạn có thể gửi tin trở lại.'),
          link: { screen: 'inbox' },
        });
      }
      if (strikes !== o.strikes) {
        await appendAudit(q, { at: now, ...actorOf(s), action: 'organizer.strikes_changed', targetType: 'organizer', targetId: id, targetLabel: o.name, diff: [{ f: 'strikes', a: String(o.strikes), b: String(strikes) }] });
      }
      return { ok: true, strikes, suspended, message: L('Standing updated', 'Đã cập nhật') };
    });
  });

  app.post<{ Params: { id: string } }>('/admin/organizers/:id/members', async (req, reply) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const body = parse(z.object({ email: z.string().max(200), name: z.string().max(80).optional(), role: z.enum(['owner', 'manager']).default('manager') }), req.body);
    const now = ctx.clock.now();
    const out = await ctx.db.tx(async (q) => {
      const o = await one<any>(q, 'select id, name from organizers where id = $1', [id]);
      if (!o) throw notFound();
      const u = await accountFor(q, body.email, body.name, now);
      await q.query(`insert into organizer_members (organizer_id, user_id, role) values ($1,$2,$3) on conflict (organizer_id, user_id) do update set role = excluded.role`, [id, u.id, body.role]);
      await appendAudit(q, { at: now, ...actorOf(s), action: 'organizer.member_added', targetType: 'organizer', targetId: id, targetLabel: o.name,
        diff: [{ f: 'member', a: '—', b: normalizeEmail(body.email) }, { f: 'role', a: '—', b: body.role }] });
      return u;
    });
    return reply.code(201).send({ ok: true, userId: out.id, created: out.created, message: out.created ? L('Added. They set a password with "Forgot password".', 'Đã thêm. Người này đặt mật khẩu qua "Quên mật khẩu".') : L('Added to the team', 'Đã thêm vào nhóm') });
  });

  app.delete<{ Params: { id: string; userId: string } }>('/admin/organizers/:id/members/:userId', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const userId = parse(uuid, req.params.userId);
    const now = ctx.clock.now();
    await ctx.db.tx(async (q) => {
      const m = await one<any>(q, `select m.role, u.email, o.name from organizer_members m join users u on u.id = m.user_id join organizers o on o.id = m.organizer_id where m.organizer_id = $1 and m.user_id = $2`, [id, userId]);
      if (!m) throw notFound();
      if (m.role === 'owner') {
        const owners = await one<any>(q, `select count(*)::int as n from organizer_members where organizer_id = $1 and role = 'owner'`, [id]);
        if (owners.n <= 1) throw conflict('last_owner', L('Every organizer keeps at least one owner', 'Mỗi nhà tổ chức cần ít nhất một chủ tài khoản'));
      }
      await q.query('delete from organizer_members where organizer_id = $1 and user_id = $2', [id, userId]);
      await appendAudit(q, { at: now, ...actorOf(s), action: 'organizer.member_removed', targetType: 'organizer', targetId: id, targetLabel: m.name, diff: [{ f: 'member', a: m.email ?? userId, b: '—' }] });
    });
    return { ok: true, message: L('Removed from the team', 'Đã gỡ khỏi nhóm') };
  });

  // ---- accounts -------------------------------------------------------------------------------

  app.get('/admin/users', async (req) => {
    requireAdmin(req);
    const f = parse(z.object({
      q: z.string().max(80).optional(),
      kind: z.enum(['all', 'attendee', 'organizer', 'admin']).default('all'),
      method: csv(z.enum(['email', 'zalo', 'wa', 'fb', 'ig', 'staff'])).optional(),
      city: z.string().max(60).optional(),
      active: z.enum(['all', '7d', '30d', 'dormant']).default('all'),
      sort: z.enum(['new', 'active', 'tickets', 'name']).default('new'),
      limit: limit(200, 25),
      offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
    }), req.query);
    const now = ctx.clock.now();
    const sql = new SqlParams();
    const where: string[] = ['true'];
    if (f.q?.trim()) {
      const raw = f.q.trim().replace(/[%_\\]/g, '');
      const digits = raw.replace(/\D/g, '');
      const r = sql.p(raw);
      where.push(`(u.name ilike '%' || ${r} || '%' or u.email ilike '%' || ${r} || '%'${digits.length >= 4 ? ` or u.phone like '%' || ${sql.p(digits.replace(/^0/, ''))} || '%'` : ''} or u.id::text = ${r})`);
    }
    if (f.kind === 'admin') where.push(`u.role = 'admin'`);
    if (f.kind === 'organizer') where.push('exists (select 1 from organizer_members m where m.user_id = u.id)');
    if (f.kind === 'attendee') where.push(`u.role = 'user' and not exists (select 1 from organizer_members m where m.user_id = u.id)`);
    if (f.method?.length) where.push(`u.signup_method = any(${sql.p(f.method)}::text[])`);
    if (f.city) where.push(`u.city = ${sql.p(f.city)}`);
    if (f.active === '7d') where.push(`u.last_active_at >= ${sql.p(new Date(now.getTime() - 7 * 86400_000))}`);
    if (f.active === '30d') where.push(`u.last_active_at >= ${sql.p(new Date(now.getTime() - 30 * 86400_000))}`);
    if (f.active === 'dormant') where.push(`(u.last_active_at is null or u.last_active_at < ${sql.p(new Date(now.getTime() - 30 * 86400_000))})`);
    const order = { new: 'u.created_at desc', active: 'u.last_active_at desc nulls last', tickets: 'tickets desc, u.created_at desc', name: 'u.name' }[f.sort];
    const w = where.join(' and ');
    const [rows, total, cities] = await Promise.all([
      many<any>(ctx.db,
        `select u.id, u.name, u.email, u.phone, u.city, u.role, u.signup_method, u.created_at, u.last_active_at, u.photo_url,
                (select count(*)::int from tickets t where t.user_id = u.id and t.status in ('valid','used')) as tickets,
                (select count(*)::int from saves s where s.user_id = u.id) as saves,
                (select coalesce(json_agg(json_build_object('id', o.id, 'name', o.name, 'role', m.role)), '[]'::json)
                   from organizer_members m join organizers o on o.id = m.organizer_id where m.user_id = u.id) as orgs
           from users u where ${w} order by ${order} limit ${f.limit} offset ${f.offset}`, sql.values),
      one<any>(ctx.db, `select count(*)::int as n from users u where ${w}`, sql.values),
      many<any>(ctx.db, `select city, count(*)::int as n from users where city <> '' group by city order by n desc limit 12`),
    ]);
    return {
      items: rows.map((u) => ({
        id: u.id, name: u.name, email: u.email, phone: u.phone, city: u.city, role: u.role, signupMethod: u.signup_method, signupLabel: SIGNUP[u.signup_method],
        createdAt: u.created_at, lastActiveAt: u.last_active_at, photoUrl: u.photo_url, tickets: u.tickets, saves: u.saves, organizers: u.orgs,
      })),
      total: total.n, offset: f.offset, limit: f.limit,
      cities: cities.map((c) => ({ value: c.city, count: c.n })),
    };
  });

  app.get<{ Params: { id: string } }>('/admin/users/:id', async (req) => {
    requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const u = await one<any>(ctx.db, 'select * from users where id = $1', [id]);
    if (!u) throw notFound();
    const [counts, orgs, orders, connections] = await Promise.all([
      one<any>(ctx.db,
        `select (select count(*)::int from saves where user_id = $1) as saves, (select count(*)::int from hypes where user_id = $1) as hypes,
                (select count(*)::int from going where user_id = $1) as going, (select count(*)::int from tickets where user_id = $1 and status in ('valid','used')) as tickets,
                (select count(*)::int from friendships where user_id = $1) as friends, (select count(*)::int from listing_reports where user_id = $1) as reports,
                (select count(*)::int from orders where user_id = $1) as orders, (select count(*)::int from user_activity_days where user_id = $1) as active_days`, [id]),
      many<any>(ctx.db, `select o.id, o.name, m.role from organizer_members m join organizers o on o.id = m.organizer_id where m.user_id = $1`, [id]),
      many<any>(ctx.db, `select x.id, x.code, x.status, x.total, x.qty, x.created_at, e.title from orders x join events e on e.id = x.event_id where x.user_id = $1 order by x.created_at desc limit 8`, [id]),
      many<any>(ctx.db, `select provider, display_name, connected_at from social_connections where user_id = $1`, [id]),
    ]);
    return {
      id: u.id, name: u.name, email: u.email, phone: u.phone, city: u.city, role: u.role, locale: u.locale, signupMethod: u.signup_method, signupLabel: SIGNUP[u.signup_method],
      interests: u.interests, birthYear: u.birth_year, createdAt: u.created_at, lastActiveAt: u.last_active_at, photoUrl: u.photo_url, hasPassword: !!u.password_hash,
      counts: { saves: counts.saves, hypes: counts.hypes, going: counts.going, tickets: counts.tickets, friends: counts.friends, reports: counts.reports, orders: counts.orders, activeDays: counts.active_days },
      organizers: orgs, connections: connections.map((c) => ({ provider: c.provider, label: SIGNUP[c.provider] ?? c.provider, name: c.display_name, at: c.connected_at })),
      orders: orders.map((o) => ({ id: o.id, code: o.code, status: o.status, statusLabel: ORDER_STATUS[o.status], total: Number(o.total), qty: o.qty, createdAt: o.created_at, event: o.title })),
    };
  });

  app.patch<{ Params: { id: string } }>('/admin/users/:id', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const body = parse(z.object({ role: z.enum(['user', 'admin']) }), req.body);
    if (id === s.user.id) throw badRequest('own_role', L('You cannot change your own role', 'Không thể tự đổi quyền của chính mình'));
    const now = ctx.clock.now();
    await ctx.db.tx(async (q) => {
      const u = await one<any>(q, 'select id, name, email, phone, role from users where id = $1 for update', [id]);
      if (!u) throw notFound();
      if (u.role === body.role) return;
      await q.query('update users set role = $2 where id = $1', [id, body.role]);
      // A demoted admin's open sessions keep working as a normal account; a promoted one needs no new sign-in.
      await appendAudit(q, { at: now, ...actorOf(s), action: 'user.role_changed', targetType: 'user', targetId: id, targetLabel: u.name || u.email || u.phone || id, diff: [{ f: 'role', a: u.role, b: body.role }] });
    });
    return { ok: true, message: body.role === 'admin' ? L('Now a FeestFinder admin', 'Đã cấp quyền admin FeestFinder') : L('Admin access removed', 'Đã gỡ quyền admin') };
  });

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
