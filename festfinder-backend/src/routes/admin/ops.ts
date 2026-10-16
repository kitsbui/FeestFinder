import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { json, many, one } from '../../db/index.ts';
import { badRequest, conflict, notFound } from '../../lib/errors.ts';
import { BADGES, GENRES, L, REJECT_REASONS, REPORT_CATEGORY, REPORT_CODES, TIER_NAMES, type Localized } from '../../lib/i18n.ts';
import { formatVnPhone, searchNormalize, slugify } from '../../lib/contact.ts';
import { randomCode } from '../../lib/crypto.ts';
import { toCsv } from '../../lib/csv.ts';
import { addDays, atVn, monthEnd, vnDate, weekendRange } from '../../lib/time.ts';
import { bool, csv, dateStr, limit, parse, uuid } from '../../lib/validate.ts';
import { BANKS } from '../../lib/vietqr.ts';
import { requireAdmin } from '../../http/guards.ts';
import { SqlParams } from '../../http/sql.ts';
import { actionLabel, appendAudit } from '../../services/audit.ts';
import { launchedCities } from '../../lib/places.ts';
import { EVENT_TYPE_LABEL, EVENT_TYPES, STYLES } from '../../lib/styles.ts';
import { notifyOrganizer } from '../../services/notify.ts';
import { assessRisk, riskBand } from '../../services/risk.ts';
import { approveListing } from './moderation.ts';
import { moderationThread } from '../organizer/inbox.ts';
import {
  applyDraft, DraftInput, duplicateEvent, missingForSubmit, presentDraft, replaceTiers, STATUS_LABEL, TiersInput,
} from '../organizer/events.ts';

import { STATUSES, GENRE_LABEL, ORG_TYPES, AREA_GROUPS, ENTRY_MODES, AGES, ORDER_STATUS, PAY_METHOD, SIGNUP, ARTS, minutesSince, actorOf, diffRows, missingForPublish, publishByTeam } from './ops-shared.ts';
/*
 * The team's operations (the Console's catalogue screens; once /ops): what the FeestFinder team needs beyond moderation — the whole catalogue with filters, listings created or fixed by the team, venues,
 * organiser onboarding, accounts and orders — plus the option lists every form draws from,
 * so a style, a district or a bank is always picked, never typed.
 */

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
      cities: launchedCities().map((c) => ({ value: c.slug, label: c.name, country: c.countryCode, currency: c.currency, bbox: c.bbox, center: [c.lng, c.lat] })),
      styles: STYLES.map((x) => ({ value: x.key, label: x.label, genre: x.genre })),
      eventTypes: EVENT_TYPES.map((value) => ({ value, label: EVENT_TYPE_LABEL[value] })),
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
      many<any>(ctx.db, `select coalesce(needs_review_at, submitted_at) as submitted_at, flag, risk_score from events where status = 'in_review' or (status = 'live' and needs_review_at is not null)`),
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
    entryMode: e.entry_mode, priceFrom: Number(e.price_from), currency: e.currency, capacity: e.capacity, age: e.age,
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
      one<any>(ctx.db, `select o.*, u.name as submitter_name, u.phone as submitter_phone,
                               (select count(*)::int from events x where x.submitted_by = u.id and x.published_at is not null) as submitter_published
                          from organizers o left join users u on u.id = $2 where o.id = $1`, [ev.organizer_id, ev.submitted_by]),
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
        community: org.is_community,
      },
      // Sent in by someone in the community: who, and how many of theirs went live before.
      submittedBy: ev.submitted_by ? { id: ev.submitted_by, name: org?.submitter_name || null, phone: org?.submitter_phone ? formatVnPhone(org.submitter_phone) : null, published: org?.submitter_published ?? 0 } : null,
      sourceUrl: ev.submitted_by ? ev.event_url : null,
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
      await applyDraft(q, ev.id, body);
      await appendAudit(q, {
        at: now, ...actorOf(s), action: 'listing.created_by_team', targetType: 'event', targetId: ev.id, targetLabel: title,
        diff: [{ f: 'organizer', a: '—', b: org.name }, { f: 'status', a: '—', b: body.publish ? 'live' : 'draft' }],
      });
      if (body.publish) {
        const row = await one<any>(q, 'select * from events where id = $1', [ev.id]);
        const missing = missingForPublish(row);
        if (missing.length) throw badRequest('not_ready', L('Fill in the required fields before publishing', 'Điền đủ thông tin bắt buộc trước khi đăng'), { missing });
        await publishByTeam(q, s, row, now);
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
      await applyDraft(q, id, body);
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
        else await publishByTeam(q, s, ev, now);
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
      await q.query(`update events set status = 'live', genre = coalesce(genre, 'EDM'), decided_at = $2, published_at = coalesce(published_at, $2) where id = $1`, [id, now]);
      await appendAudit(q, { at: now, ...actorOf(s), action: 'listing.restored', targetType: 'event', targetId: id, targetLabel: ev.title, diff: [{ f: 'status', a: ev.status, b: 'live' }] });
      return L('Restored and live again', 'Đã khôi phục, tin đang chạy lại');
    });
    return { ...(await eventDetail(id)), message };
  });

}
