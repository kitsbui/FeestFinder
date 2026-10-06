import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../db/index.ts';
import { badRequest, conflict, forbidden, notFound, tooMany } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { cityBySlug, cityLabel, citySlug } from '../lib/places.ts';
import { isStyle } from '../lib/styles.ts';
import { GIG_TYPE, SET_LENGTH, ARTIST_ROLE } from '../lib/network.ts';
import { dateStr, limit, parse, uuid } from '../lib/validate.ts';
import { requireOrganizer, requireUser } from '../http/guards.ts';
import { notifyOrganizer, notifyUser } from '../services/notify.ts';
import { personId } from '../services/analytics.ts';
import { artistForMatch, matchScore } from '../services/gigs.ts';
import { label, styleItem } from '../services/artists.ts';

/*
 * The gig marketplace. Fees are whole units of the city's currency and only a starting point
 * for a conversation: no money moves through FeestFinder here.
 *
 *   organisers   GET/POST /organizer/gigs, PATCH /organizer/gigs/:id,
 *                GET /organizer/gigs/:id/applications, POST /organizer/gigs/:id/applications/:appId,
 *                GET/POST /organizer/inquiries
 *   artists      GET /gigs, POST /gigs/:id/apply, GET /me/artist/applications,
 *                POST /me/artist/applications/:id/withdraw, GET /me/artist/inquiries,
 *                POST /me/artist/inquiries/:id, GET/PUT /me/artist/availability
 */

const gigType = z.enum(GIG_TYPE.keys as [string, ...string[]]);
const setLength = z.enum(SET_LENGTH.keys as [string, ...string[]]);
const fee = z.coerce.number().int().min(0).max(1e12);

const GigFields = {
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(3000),
  city: citySlug,
  startsOn: dateStr,
  styles: z.array(z.string().refine(isStyle, 'unknown style')).max(6),
  gigType: gigType.nullable(),
  setLength: setLength.nullable(),
  feeMin: fee.nullable(),
  feeMax: fee.nullable(),
  travelCovered: z.boolean(),
  closesOn: dateStr.nullable(),
  eventId: uuid.nullable(),
};
const GigCreate = z.object({
  ...GigFields,
  description: GigFields.description.default(''),
  styles: GigFields.styles.default([]),
  gigType: GigFields.gigType.default(null),
  setLength: GigFields.setLength.default(null),
  feeMin: GigFields.feeMin.default(null),
  feeMax: GigFields.feeMax.default(null),
  travelCovered: GigFields.travelCovered.default(false),
  closesOn: GigFields.closesOn.default(null),
  eventId: GigFields.eventId.default(null),
});
const GigUpdate = z.object({ ...GigFields, status: z.enum(['open', 'closed', 'filled']) }).partial();
const COLUMN: Record<string, string> = {
  title: 'title', description: 'description', city: 'city', startsOn: 'starts_on', styles: 'styles', gigType: 'gig_type', setLength: 'set_length',
  feeMin: 'fee_min', feeMax: 'fee_max', travelCovered: 'travel_covered', closesOn: 'closes_on', eventId: 'event_id', status: 'status',
};

const INQUIRIES_PER_DAY = 20;

export default async function gigRoutes(app: FastifyInstance) {
  const ctx = app.ctx;
  const today = () => ctx.clock.now().toISOString().slice(0, 10);

  const presentGig = (g: any) => ({
    id: g.id, title: g.title, description: g.description, city: g.city, cityLabel: cityLabel(g.city), startsOn: g.starts_on,
    styles: (g.styles ?? []).map(styleItem), gigType: g.gig_type ? label(GIG_TYPE, g.gig_type) : null, setLength: g.set_length ? label(SET_LENGTH, g.set_length) : null,
    feeMin: g.fee_min === null ? null : Number(g.fee_min), feeMax: g.fee_max === null ? null : Number(g.fee_max), currency: g.currency,
    travelCovered: g.travel_covered, closesOn: g.closes_on, status: g.status, createdAt: g.created_at,
    organizer: g.org_slug ? { id: g.organizer_id, slug: g.org_slug, name: g.org_name, verified: g.org_verification === 'verified' } : undefined,
    applications: g.applications ?? undefined,
  });
  const GIG = `select g.*, g.starts_on::text as starts_on, g.closes_on::text as closes_on, o.slug as org_slug, o.name as org_name, o.verification_state as org_verification
                 from gig_opportunities g join organizers o on o.id = g.organizer_id`;

  const ownArtist = async (userId: string) => {
    const a = await one<{ id: string; name: string; slug: string }>(ctx.db, 'select id, name, slug from artists where owner_user_id = $1', [userId]);
    if (!a) throw notFound(L('You have no artist profile yet', 'Bạn chưa có hồ sơ nghệ sĩ'));
    return a;
  };
  const feeCheck = (b: { feeMin?: number | null; feeMax?: number | null }) => {
    if (b.feeMin != null && b.feeMax != null && b.feeMax < b.feeMin) throw badRequest('fee_range', L('The top of the fee is below the bottom', 'Mức phí tối đa thấp hơn mức tối thiểu'));
  };

  // ---- organisers ---------------------------------------------------------------------------

  app.get('/organizer/gigs', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const rows = await many<any>(ctx.db,
      `${GIG.replace('select g.*', `select g.*, (select count(*)::int from gig_applications a where a.opportunity_id = g.id and a.status <> 'withdrawn') as applications`)}
        where g.organizer_id = $1 order by g.status = 'open' desc, g.starts_on limit 200`, [org.organizerId]);
    return { items: rows.map(presentGig) };
  });

  app.post('/organizer/gigs', async (req, reply) => {
    const org = await requireOrganizer(ctx, req);
    const b = parse(GigCreate, req.body);
    feeCheck(b);
    if (b.startsOn < today()) throw badRequest('past_date', L('That date has passed', 'Ngày này đã qua'));
    if (b.eventId && !(await one(ctx.db, 'select 1 from events where id = $1 and organizer_id = $2', [b.eventId, org.organizerId]))) {
      throw badRequest('not_your_event', L('That event is not yours', 'Sự kiện này không thuộc bạn'));
    }
    const row = await one<{ id: string }>(ctx.db,
      `insert into gig_opportunities (organizer_id, event_id, title, description, city, starts_on, styles, gig_type, set_length, fee_min, fee_max, currency,
                                      travel_covered, closes_on, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) returning id`,
      [org.organizerId, b.eventId, b.title, b.description, b.city, b.startsOn, b.styles, b.gigType, b.setLength, b.feeMin, b.feeMax,
        cityBySlug(b.city)!.currency, b.travelCovered, b.closesOn, org.userId]);
    void ctx.analytics.capture('gig_posted', personId(org.userId), { city: b.city, kind: b.gigType ?? undefined });
    return reply.code(201).send(presentGig(await one<any>(ctx.db, `${GIG} where g.id = $1`, [row!.id])));
  });

  const ownGig = async (organizerId: string, id: string) => {
    const g = await one<any>(ctx.db, `${GIG} where g.id = $1`, [parse(uuid, id)]);
    if (!g || g.organizer_id !== organizerId) throw notFound(L('Gig not found', 'Không tìm thấy gig'));
    return g;
  };

  app.patch<{ Params: { id: string } }>('/organizer/gigs/:id', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const g = await ownGig(org.organizerId, req.params.id);
    const b = parse(GigUpdate, req.body);
    feeCheck({ feeMin: b.feeMin ?? (g.fee_min === null ? null : Number(g.fee_min)), feeMax: b.feeMax ?? (g.fee_max === null ? null : Number(g.fee_max)) });
    const keys = Object.keys(b).filter((k) => (b as any)[k] !== undefined);
    if (!keys.length) throw badRequest('nothing_to_change', L('Nothing to change', 'Không có gì để thay đổi'));
    const values = keys.map((k) => (b as any)[k]);
    if (b.city) { keys.push('currency'); values.push(cityBySlug(b.city)!.currency); }
    const col = (k: string) => COLUMN[k] ?? k;
    await ctx.db.query(`update gig_opportunities set ${keys.map((k, i) => `${col(k)} = $${i + 2}`).join(', ')}, updated_at = now() where id = $1`, [g.id, ...values]);
    return presentGig(await one<any>(ctx.db, `${GIG} where g.id = $1`, [g.id]));
  });

  app.get<{ Params: { id: string } }>('/organizer/gigs/:id/applications', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const g = await ownGig(org.organizerId, req.params.id);
    const rows = await many<any>(ctx.db,
      `select p.*, a.slug, a.name, a.artist_roles, a.based_city, a.booking_status from gig_applications p join artists a on a.id = p.artist_id
        where p.opportunity_id = $1 and p.status <> 'withdrawn' order by p.match_score desc, p.created_at`, [g.id]);
    return {
      gig: presentGig(g),
      items: rows.map((p) => ({
        id: p.id, status: p.status, message: p.message, matchScore: p.match_score, createdAt: p.created_at,
        artist: { id: p.artist_id, slug: p.slug, name: p.name, roles: p.artist_roles.map((r: any) => label(ARTIST_ROLE, r)), basedIn: p.based_city ? cityLabel(p.based_city) : null },
      })),
    };
  });

  app.post<{ Params: { id: string; appId: string } }>('/organizer/gigs/:id/applications/:appId', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const g = await ownGig(org.organizerId, req.params.id);
    const { status } = parse(z.object({ status: z.enum(['shortlisted', 'declined', 'booked']) }), req.body);
    const now = ctx.clock.now();
    const p = await one<any>(ctx.db,
      `select p.*, a.owner_user_id from gig_applications p join artists a on a.id = p.artist_id where p.id = $1 and p.opportunity_id = $2`, [parse(uuid, req.params.appId), g.id]);
    if (!p) throw notFound();
    if (p.status === 'withdrawn') throw conflict('withdrawn', L('The artist withdrew this application', 'Nghệ sĩ đã rút hồ sơ này'));
    await ctx.db.tx(async (q) => {
      await q.query('update gig_applications set status = $2, decided_at = $3 where id = $1', [p.id, status, now]);
      if (status === 'booked') await q.query(`update gig_opportunities set status = 'filled', updated_at = $2 where id = $1`, [g.id, now]);
      if (p.owner_user_id) {
        const words = { shortlisted: L('You are on the shortlist', 'Bạn đã vào danh sách chọn'), declined: L('Not this time', 'Lần này chưa phù hợp'), booked: L('You are booked', 'Bạn đã được chốt') }[status];
        await notifyUser(q, now, {
          userId: p.owner_user_id, topic: null, kind: 'gig_application', title: words, body: L(`${g.org_name} · ${g.title}`, `${g.org_name} · ${g.title}`),
          link: { screen: 'ops', path: '/ops/artist/opportunities?tab=mine' }, dedupeKey: `gig_app:${p.id}:${status}`,
        });
      }
    });
    return { id: p.id, status };
  });

  app.get('/organizer/inquiries', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const rows = await many<any>(ctx.db,
      `select i.*, i.event_on::text as event_on, a.slug, a.name from booking_inquiries i join artists a on a.id = i.artist_id
        where i.organizer_id = $1 order by i.created_at desc limit 200`, [org.organizerId]);
    return { items: rows.map((i) => presentInquiry(i)) };
  });

  const presentInquiry = (i: any) => ({
    id: i.id, eventOn: i.event_on, city: i.city, cityLabel: cityLabel(i.city), message: i.message, feeOffer: i.fee_offer === null ? null : Number(i.fee_offer),
    currency: i.currency, status: i.status, reply: i.reply, createdAt: i.created_at, answeredAt: i.answered_at,
    artist: i.slug ? { id: i.artist_id, slug: i.slug, name: i.name } : undefined,
    organizer: i.org_slug ? { id: i.organizer_id, slug: i.org_slug, name: i.org_name, verified: i.org_verification === 'verified' } : undefined,
  });

  app.post('/organizer/inquiries', async (req, reply) => {
    const org = await requireOrganizer(ctx, req);
    const b = parse(z.object({ artistId: uuid, eventOn: dateStr, city: citySlug, message: z.string().trim().min(10).max(2000), feeOffer: fee.nullable().default(null) }), req.body);
    if (b.eventOn < today()) throw badRequest('past_date', L('That date has passed', 'Ngày này đã qua'));
    const a = await one<{ id: string; name: string; owner_user_id: string | null }>(ctx.db, 'select id, name, owner_user_id from artists where id = $1', [b.artistId]);
    if (!a) throw notFound(L('Artist not found', 'Không tìm thấy nghệ sĩ'));
    if (!a.owner_user_id) throw conflict('not_claimed', L(`${a.name} has not claimed their profile yet, so nobody would read this`, `${a.name} chưa nhận quản lý hồ sơ nên chưa ai đọc được lời mời`));
    const now = ctx.clock.now();
    const sent = await one<{ n: number }>(ctx.db, 'select count(*)::int as n from booking_inquiries where organizer_id = $1 and created_at > $2', [org.organizerId, new Date(now.getTime() - 86400_000)]);
    if ((sent?.n ?? 0) >= INQUIRIES_PER_DAY) throw tooMany('too_many_inquiries', L('That is a lot of booking requests for one day', 'Bạn đã gửi nhiều lời mời trong hôm nay'));
    const o = await one<{ name: string }>(ctx.db, 'select name from organizers where id = $1', [org.organizerId]);
    const id = await ctx.db.tx(async (q) => {
      const row = await one<{ id: string }>(q,
        `insert into booking_inquiries (organizer_id, artist_id, from_user_id, event_on, city, message, fee_offer, currency, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
        [org.organizerId, a.id, org.userId, b.eventOn, b.city, b.message, b.feeOffer, cityBySlug(b.city)!.currency, now]);
      await notifyUser(q, now, {
        userId: a.owner_user_id!, topic: null, kind: 'booking_inquiry', title: L('A booking request', 'Lời mời booking'),
        body: L(`${o!.name} · ${b.eventOn} · ${cityLabel(b.city)?.en ?? b.city}`, `${o!.name} · ${b.eventOn} · ${cityLabel(b.city)?.vi ?? b.city}`),
        link: { screen: 'ops', path: '/ops/artist/opportunities?tab=requests' }, dedupeKey: `inquiry:${row!.id}`,
      });
      return row!.id;
    });
    void ctx.analytics.capture('booking_requested', personId(org.userId), { city: b.city });
    return reply.code(201).send({ id, message: L('Request sent', 'Đã gửi lời mời') });
  });

  // ---- artists ------------------------------------------------------------------------------

  /** Open gigs, best fit first for an artist, soonest first for anyone else signed in. */
  app.get('/gigs', async (req) => {
    const s = requireUser(req);
    const f = parse(z.object({ city: citySlug.optional(), style: z.string().refine(isStyle).optional(), limit: limit(100, 40) }), req.query);
    const rows = await many<any>(ctx.db,
      `${GIG} where g.status = 'open' and g.starts_on >= $1 and (g.closes_on is null or g.closes_on >= $1)
          and ($2::text is null or g.city = $2) and ($3::text is null or $3 = any(g.styles)) order by g.starts_on limit $4`,
      [today(), f.city ?? null, f.style ?? null, f.limit]);
    const mine = await one<{ id: string }>(ctx.db, 'select id from artists where owner_user_id = $1', [s.user.id]);
    const m = mine ? await artistForMatch(ctx.db, mine.id) : null;
    const applied = mine ? new Map((await many<any>(ctx.db, 'select opportunity_id, status from gig_applications where artist_id = $1', [mine.id])).map((r) => [r.opportunity_id, r.status])) : new Map();
    const items = rows.map((g) => {
      const match = m ? matchScore(m.artist, g, m.windows) : null;
      return { ...presentGig(g), match, applied: applied.get(g.id) ?? null };
    });
    if (m) items.sort((x, y) => (y.match!.score - x.match!.score) || x.startsOn.localeCompare(y.startsOn));
    return { items };
  });

  app.post<{ Params: { id: string } }>('/gigs/:id/apply', async (req, reply) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    const b = parse(z.object({ message: z.string().trim().max(2000).default('') }), req.body);
    const g = await one<any>(ctx.db, `${GIG} where g.id = $1`, [parse(uuid, req.params.id)]);
    if (!g) throw notFound(L('Gig not found', 'Không tìm thấy gig'));
    if (g.status !== 'open' || g.starts_on < today() || (g.closes_on && g.closes_on < today())) throw conflict('gig_closed', L('This gig is no longer open', 'Gig này đã đóng'));
    if (await one(ctx.db, 'select 1 from organizer_members where organizer_id = $1 and user_id = $2', [g.organizer_id, s.user.id])) {
      throw forbidden('own_gig', L('You cannot apply to your own gig', 'Bạn không thể ứng tuyển gig của mình'));
    }
    const m = (await artistForMatch(ctx.db, a.id))!;
    const match = matchScore(m.artist, g, m.windows);
    const now = ctx.clock.now();
    const row = await ctx.db.tx(async (q) => {
      const r = await one<{ id: string; created: boolean }>(q,
        `insert into gig_applications (opportunity_id, artist_id, user_id, message, match_score, created_at) values ($1,$2,$3,$4,$5,$6)
         on conflict (opportunity_id, artist_id) do update set message = excluded.message, match_score = excluded.match_score,
           status = case when gig_applications.status = 'withdrawn' then 'sent' else gig_applications.status end
         returning id, (xmax = 0) as created`,
        [g.id, a.id, s.user.id, b.message, match.score, now]);
      if (r!.created) {
        await notifyOrganizer(q, now, {
          organizerId: g.organizer_id, topic: 'bookings', kind: 'gig', title: L('A new application', 'Hồ sơ ứng tuyển mới'),
          body: L(`${a.name} · ${g.title}`, `${a.name} · ${g.title}`), link: { screen: 'gigs', id: g.id }, dedupeKey: `gig_apply:${r!.id}`,
        });
      }
      return r!;
    });
    if (row.created) void ctx.analytics.capture('gig_applied', personId(s.user.id), { city: g.city });
    return reply.code(row.created ? 201 : 200).send({ id: row.id, match, message: L('Application sent', 'Đã gửi hồ sơ') });
  });

  app.get('/me/artist/applications', async (req) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    const rows = await many<any>(ctx.db,
      `select x.*, p.id as app_id, p.status as app_status, p.message as app_message, p.created_at as app_at, p.decided_at as app_decided_at
         from gig_applications p join (${GIG}) x on x.id = p.opportunity_id where p.artist_id = $1 order by p.created_at desc limit 100`, [a.id]);
    return { items: rows.map((r) => ({ id: r.app_id, status: r.app_status, message: r.app_message, createdAt: r.app_at, decidedAt: r.app_decided_at, gig: presentGig(r) })) };
  });

  app.post<{ Params: { id: string } }>('/me/artist/applications/:id/withdraw', async (req) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    const out = await one(ctx.db, `update gig_applications set status = 'withdrawn' where id = $1 and artist_id = $2 and status in ('sent', 'shortlisted') returning id`,
      [parse(uuid, req.params.id), a.id]);
    if (!out) throw notFound();
    return { ok: true };
  });

  app.get('/me/artist/inquiries', async (req) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    const rows = await many<any>(ctx.db,
      `select i.*, i.event_on::text as event_on, o.slug as org_slug, o.name as org_name, o.verification_state as org_verification
         from booking_inquiries i join organizers o on o.id = i.organizer_id where i.artist_id = $1 order by i.created_at desc limit 100`, [a.id]);
    return { items: rows.map((i) => presentInquiry(i)) };
  });

  app.post<{ Params: { id: string } }>('/me/artist/inquiries/:id', async (req) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    const b = parse(z.object({ accept: z.boolean(), reply: z.string().trim().max(2000).default('') }), req.body);
    const i = await one<any>(ctx.db, 'select * from booking_inquiries where id = $1 and artist_id = $2', [parse(uuid, req.params.id), a.id]);
    if (!i) throw notFound();
    if (i.status !== 'sent') throw conflict('already_answered', L('You already answered this request', 'Bạn đã trả lời lời mời này'));
    const now = ctx.clock.now();
    const status = b.accept ? 'accepted' : 'declined';
    await ctx.db.tx(async (q) => {
      await q.query('update booking_inquiries set status = $2, reply = $3, answered_at = $4 where id = $1', [i.id, status, b.reply, now]);
      await notifyOrganizer(q, now, {
        organizerId: i.organizer_id, topic: 'bookings', kind: 'gig',
        title: b.accept ? L(`${a.name} is interested`, `${a.name} đồng ý trao đổi`) : L(`${a.name} declined`, `${a.name} đã từ chối`),
        body: L(b.reply || 'No message', b.reply || 'Không có lời nhắn'), link: { screen: 'gigs' }, dedupeKey: `inquiry_answer:${i.id}`,
      });
    });
    return { id: i.id, status };
  });

  app.get('/me/artist/availability', async (req) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    const rows = await many<any>(ctx.db, `select id, from_on::text, to_on::text, kind, city, note from artist_availability where artist_id = $1 and to_on >= $2 order by from_on`, [a.id, today()]);
    return { items: rows.map((r) => ({ id: r.id, from: r.from_on, to: r.to_on, kind: r.kind, city: r.city, note: r.note })) };
  });

  /** Replaces the windows still to come; past ones go. */
  app.put('/me/artist/availability', async (req) => {
    const s = requireUser(req);
    const a = await ownArtist(s.user.id);
    const b = parse(z.object({ items: z.array(z.object({
      from: dateStr, to: dateStr, kind: z.enum(['available', 'unavailable']), city: citySlug.nullable().default(null), note: z.string().trim().max(200).default(''),
    })).max(50) }), req.body);
    if (b.items.some((w) => w.to < w.from)) throw badRequest('bad_window', L('A window ends before it starts', 'Có khoảng thời gian kết thúc trước khi bắt đầu'));
    await ctx.db.tx(async (q) => {
      await q.query('delete from artist_availability where artist_id = $1', [a.id]);
      for (const w of b.items) {
        await q.query('insert into artist_availability (artist_id, from_on, to_on, kind, city, note) values ($1,$2,$3,$4,$5,$6)', [a.id, w.from, w.to, w.kind, w.city, w.note]);
      }
    });
    return { ok: true, message: L('Availability saved', 'Đã lưu lịch trống') };
  });
}
