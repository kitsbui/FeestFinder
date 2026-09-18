import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { Ctx } from '../context.ts';
import { many, one } from '../db/index.ts';
import { notFound } from '../lib/errors.ts';
import { GENRES, L } from '../lib/i18n.ts';
import { searchNormalize } from '../lib/contact.ts';
import { TIME_KEYS, timeWindow, vnDate, weekendRange, type TimeKey } from '../lib/time.ts';
import { bool, csv, dateStr, limit, parse } from '../lib/validate.ts';
import { decodeCursor, isUuid, page, SqlParams } from '../http/sql.ts';
import { CARD_COLUMNS, loadViewer, ORG_COLUMNS, presentCard, presentTiers } from '../presenters/event.ts';
import { findClashes, loadTimetable } from '../presenters/timetable.ts';

const PRICE_BANDS = ['free', 'under', 'over'] as const;
const TIME_FILTERS = ['tonight', 'weekend', '7days', 'month', 'all'] as const;

const ExploreQuery = z.object({
  time: z.enum(TIME_FILTERS).default('weekend'),
  from: dateStr.optional(),
  to: dateStr.optional(),
  q: z.string().max(100).optional(),
  genre: z.enum(GENRES).optional(),
  artist: z.string().max(100).optional(),
  price: csv(z.enum(PRICE_BANDS)).optional(),
  area: z.string().max(60).optional(),
  organizer: z.string().max(80).optional(),
  friendsOnly: bool.optional(),
  sort: z.enum(['date', 'hype', 'price', 'relevance']).default('date'),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  limit: limit(60, 6),
  cursor: z.string().optional(),
});

/** Filters shared by the Explore feed, the stat drill-downs and the facet counts. */
function feedFilters(sql: SqlParams, f: z.infer<typeof ExploreQuery>, today: string, userId: string | null, opts: { time: boolean; genre: boolean }) {
  const where = [`e.status = 'live'`, 'not e.held_for_reports'];
  const q = f.q?.trim();
  if (q) {
    // A text search spans every date, not just the active time filter.
    where.push(`e.search_text like ${sql.p(`%${searchNormalize(q)}%`)}`);
  } else if (opts.time) {
    const w = f.from ? { from: f.from, to: f.to ?? f.from } : f.time !== 'all' ? timeWindow(f.time as TimeKey, today) : null;
    if (w) where.push(`e.starts_on <= ${sql.p(w.to)} and e.ends_on >= ${sql.p(w.from)}`);
  }
  if (opts.genre && f.genre) where.push(`e.genre = ${sql.p(f.genre)}`);
  if (f.artist) where.push(`${sql.p(f.artist)} = any(e.artists)`);
  if (f.area) where.push(`e.area = ${sql.p(f.area)}`);
  if (f.organizer) where.push(`o.slug = ${sql.p(f.organizer)}`);
  if (f.price?.length) {
    const bands = f.price.map((b: (typeof PRICE_BANDS)[number]) => ({
      free: `(e.entry_mode = 'free' or e.price_from = 0)`,
      under: `(e.price_from > 0 and e.price_from < 500000)`,
      over: `(e.price_from >= 500000)`,
    })[b]);
    where.push(`(${bands.join(' or ')})`);
  }
  if (f.friendsOnly && userId) {
    where.push(`exists (select 1 from going g join friendships fr on fr.friend_id = g.user_id where fr.user_id = ${sql.p(userId)} and g.event_id = e.id)`);
  }
  return where;
}

function orderBy(sql: SqlParams, sort: string, now: Date, userId: string | null): string {
  const pastLast = `(e.ends_at < ${sql.p(now)})`;
  switch (sort) {
    case 'hype': return `${pastLast}, e.hype_count desc, e.starts_at`;
    case 'price': return `${pastLast}, e.price_from, e.starts_at`;
    case 'relevance':
      // App feed: organisers you follow, then featured, then your interests, then soonest.
      if (userId) {
        const u = sql.p(userId);
        return `${pastLast},
          exists (select 1 from organizer_follows f where f.user_id = ${u} and f.organizer_id = e.organizer_id) desc,
          e.featured desc,
          (e.genre = any((select interests from users where id = ${u}))) desc,
          e.starts_at`;
      }
      return `${pastLast}, e.featured desc, e.starts_at`;
    default: return `${pastLast}, e.starts_at, e.title`;
  }
}

async function canPreview(ctx: Ctx, req: FastifyRequest, organizerId: string): Promise<boolean> {
  const user = req.session?.user;
  if (!user) return false;
  if (user.role === 'admin') return true;
  return !!(await one(ctx.db, 'select 1 from organizer_members where user_id = $1 and organizer_id = $2', [user.id, organizerId]));
}

export async function findEvent(ctx: Ctx, idOrSlug: string) {
  return one<any>(ctx.db,
    `select e.*, ${ORG_COLUMNS}
       from events e join organizers o on o.id = e.organizer_id
      where ${isUuid(idOrSlug) ? 'e.id = $1' : 'e.slug = $1'}`, [idOrSlug]);
}

export default async function catalogRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  app.get('/events', async (req) => {
    const f = parse(ExploreQuery, req.query);
    const now = ctx.clock.now();
    const today = vnDate(now);
    const userId = req.session?.user?.id ?? null;
    const offset = decodeCursor(f.cursor);

    const sql = new SqlParams();
    const where = feedFilters(sql, f, today, userId, { time: true, genre: true });
    const rows = await many<any>(ctx.db,
      `select ${CARD_COLUMNS}, count(*) over () as total
         from events e join organizers o on o.id = e.organizer_id
        where ${where.join(' and ')}
        order by ${orderBy(sql, f.sort, now, userId)}
        limit ${sql.p(f.limit + 1)} offset ${sql.p(offset)}`, sql.values);

    // Time facet counts follow the genre filter but ignore the chosen time, like the filter rail.
    const fsql = new SqlParams();
    const fwhere = feedFilters(fsql, { ...f, q: undefined }, today, userId, { time: false, genre: true });
    const counts = TIME_KEYS.map((k) => {
      const w = timeWindow(k, today);
      return `count(*) filter (where e.starts_on <= ${fsql.p(w.to)} and e.ends_on >= ${fsql.p(w.from)})::int as "${k}"`;
    });
    const facetTime = await one<any>(ctx.db,
      `select ${counts.join(', ')} from events e join organizers o on o.id = e.organizer_id where ${fwhere.join(' and ')}`, fsql.values);

    const viewer = await loadViewer(ctx.db, userId, rows.map((r) => r.id));
    const origin = f.lat !== undefined && f.lng !== undefined ? { lat: f.lat, lng: f.lng } : undefined;
    const { items, nextCursor } = page(rows, offset, f.limit);
    const cards = items.map((r) => presentCard(r, { now, viewer, origin }));
    const hero = offset === 0 ? cards.find((c) => c.featured && !c.past && !c.soldOut) ?? cards[0] ?? null : null;
    return {
      items: cards,
      total: rows[0]?.total ?? 0,
      nextCursor,
      hero,
      facets: { time: facetTime },
      window: f.q ? null : f.from ? { from: f.from, to: f.to ?? f.from } : f.time !== 'all' ? timeWindow(f.time as TimeKey, today) : null,
    };
  });

  app.get('/events/map', async (req) => {
    const f = parse(z.object({
      bbox: z.string().regex(/^-?[\d.]+,-?[\d.]+,-?[\d.]+,-?[\d.]+$/, 'minLng,minLat,maxLng,maxLat').optional(),
      genre: z.enum(GENRES).optional(),
      free: bool.optional(),
      friendsOnly: bool.optional(),
      time: z.enum(TIME_FILTERS).default('all'),
      limit: limit(100, 50),
    }), req.query);
    const now = ctx.clock.now();
    const userId = req.session?.user?.id ?? null;
    const sql = new SqlParams();
    const where = [`e.status = 'live'`, 'not e.held_for_reports', `e.ends_at >= ${sql.p(now)}`, 'e.lat is not null'];
    if (f.bbox) {
      const [minLng, minLat, maxLng, maxLat] = f.bbox.split(',').map(Number);
      where.push(`e.lng between ${sql.p(minLng)} and ${sql.p(maxLng)} and e.lat between ${sql.p(minLat)} and ${sql.p(maxLat)}`);
    }
    if (f.genre) where.push(`e.genre = ${sql.p(f.genre)}`);
    if (f.free) where.push(`(e.entry_mode = 'free' or e.price_from = 0)`);
    if (f.time !== 'all') {
      const w = timeWindow(f.time as TimeKey, vnDate(now));
      where.push(`e.starts_on <= ${sql.p(w.to)} and e.ends_on >= ${sql.p(w.from)}`);
    }
    if (f.friendsOnly && userId) {
      where.push(`exists (select 1 from going g join friendships fr on fr.friend_id = g.user_id where fr.user_id = ${sql.p(userId)} and g.event_id = e.id)`);
    }
    const rows = await many<any>(ctx.db,
      `select ${CARD_COLUMNS} from events e join organizers o on o.id = e.organizer_id
        where ${where.join(' and ')} order by e.starts_at limit ${sql.p(f.limit)}`, sql.values);
    const viewer = await loadViewer(ctx.db, userId, rows.map((r) => r.id));
    return { items: rows.map((r) => presentCard(r, { now, viewer })) };
  });

  app.get<{ Params: { idOrSlug: string } }>('/events/:idOrSlug', async (req) => {
    const now = ctx.clock.now();
    const ev = await findEvent(ctx, req.params.idOrSlug);
    const visible = ev && ev.status === 'live' && !ev.held_for_reports;
    if (!ev || (!visible && !(await canPreview(ctx, req, ev.organizer_id)))) throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
    const userId = req.session?.user?.id ?? null;

    const [viewer, tierRows, timetable, org, similarRows] = await Promise.all([
      loadViewer(ctx.db, userId, [ev.id]),
      many<any>(ctx.db, 'select * from ticket_tiers where event_id = $1 order by sort, price', [ev.id]),
      loadTimetable(ctx.db, ev),
      one<any>(ctx.db, 'select id, slug, name, initials, art, logo_url, verification_state, followers_count, since_year from organizers where id = $1', [ev.organizer_id]),
      many<any>(ctx.db,
        `select ${CARD_COLUMNS} from events e join organizers o on o.id = e.organizer_id
          where e.status = 'live' and not e.held_for_reports and e.id <> $1 and e.ends_at >= $2
          order by (e.genre = $3 or e.area = $4) desc, e.hype_count desc limit 3`,
        [ev.id, now, ev.genre, ev.area]),
    ]);

    let mine: any = null;
    if (userId) {
      const [followsOrg, artistFollows, picks, reported, plan] = await Promise.all([
        one(ctx.db, 'select 1 from organizer_follows where user_id = $1 and organizer_id = $2', [userId, ev.organizer_id]),
        many<any>(ctx.db, 'select artist from artist_follows where user_id = $1 and artist = any($2::text[])', [userId, ev.lineup]),
        many<any>(ctx.db, `select s.id, s.artist, s.starts_at, s.ends_at, p.remind from plan_picks p join sets s on s.id = p.set_id where p.user_id = $1 and s.event_id = $2`, [userId, ev.id]),
        one(ctx.db, 'select 1 from listing_reports where user_id = $1 and event_id = $2', [userId, ev.id]),
        one<any>(ctx.db,
          `select gp.id, gp.meet_spot, (select count(*)::int from group_plan_members m where m.plan_id = gp.id and m.status = 'going') + 1 as heads
             from group_plans gp
            where gp.event_id = $1 and (gp.owner_id = $2 or exists (select 1 from group_plan_members m where m.plan_id = gp.id and m.user_id = $2))
            limit 1`, [ev.id, userId]),
      ]);
      const followedArtists = new Set(artistFollows.map((a) => a.artist));
      mine = {
        followingOrganizer: !!followsOrg,
        followingArtists: [...followedArtists],
        followingArtistsLine: followedArtists.size
          ? L(`Following ${followedArtists.size} of this lineup. We will tell you when any of them announce a show in Ho Chi Minh City.`,
            `Đang theo dõi ${followedArtists.size} nghệ sĩ trong đội hình này. Khi họ có show ở TP.HCM, chúng tôi sẽ nhắn bạn.`)
          : null,
        plan: {
          setIds: picks.map((p) => p.id),
          remindSetIds: picks.filter((p) => p.remind).map((p) => p.id),
          clashes: findClashes(picks.map((p) => ({ id: p.id, artist: p.artist, startsAt: p.starts_at, endsAt: p.ends_at }))),
        },
        reported: !!reported,
        groupPlan: plan ? { id: plan.id, heads: plan.heads, meetSpot: plan.meet_spot } : null,
      };
    }

    const card = presentCard(ev, { now, viewer });
    return {
      ...card,
      description: ev.description,
      age: ev.age,
      capacity: ev.capacity,
      links: {
        event: ev.event_url ?? `${ctx.config.publicBaseUrl.replace(/\/$/, '')}/e/${ev.slug}`,
        brand: ev.brand_url,
        tickets: ev.entry_mode === 'paid' ? ev.ticket_url : null,
      },
      ticketNote: L('Tickets are sold by the organiser. FestFinder does not add a booking fee.', 'Vé do nhà tổ chức bán. FestFinder không thu thêm phí đặt vé.'),
      tickets: ev.entry_mode === 'paid' && tierRows.length ? presentTiers(tierRows, now) : null,
      timetable,
      hasLiveMode: !!timetable,
      organizer: org && {
        id: org.id, slug: org.slug, name: org.name, initials: org.initials, art: org.art, logoUrl: org.logo_url,
        verified: org.verification_state === 'verified', followersCount: org.followers_count, sinceYear: org.since_year,
        followNote: L('You hear about their next listing before it reaches the feed.', 'Bạn biết tin sự kiện tiếp theo trước khi nó lên feed.'),
      },
      similar: similarRows.map((r) => presentCard(r, { now, viewer: null })),
      me: mine,
    };
  });

  /** The three clickable hero stat cards and their drill-down rows. */
  app.get('/explore/stats', async (req) => {
    const f = parse(ExploreQuery.extend({ view: z.enum(['free', 'weekend', 'venues']).optional() }), req.query);
    const now = ctx.clock.now();
    const today = vnDate(now);
    const sql = new SqlParams();
    const where = feedFilters(sql, f, today, null, { time: true, genre: true });
    where.push(`e.ends_at >= ${sql.p(now)}`);
    const rows = await many<any>(ctx.db,
      `select ${CARD_COLUMNS} from events e join organizers o on o.id = e.organizer_id where ${where.join(' and ')} order by e.starts_at`, sql.values);
    const cards = rows.map((r) => presentCard(r, { now, viewer: null }));
    const wk = weekendRange(today);
    const free = cards.filter((c) => c.isFree);
    const weekend = cards.filter((c) => c.startsOn! <= wk.to && c.endsOn! >= wk.from);
    const venues = new Map<string, typeof cards>();
    for (const c of cards) {
      const key = c.venue.name ?? '—';
      venues.set(key, [...(venues.get(key) ?? []), c]);
    }
    const out: any = { counts: { free: free.length, weekend: weekend.length, venues: venues.size } };
    if (f.view === 'free') out.rows = free;
    if (f.view === 'weekend') out.rows = weekend;
    if (f.view === 'venues') {
      out.venues = [...venues.entries()].map(([name, list]) => ({
        name, area: list[0].venue.area, distanceKm: list[0].distanceKm, eventCount: list.length,
        events: list.map((c) => ({ id: c.id, slug: c.slug, title: c.title })),
        art: list[0].art, firstEventId: list[0].id,
      }));
    }
    return out;
  });

  app.get('/genres', async () => {
    const rows = await many<any>(ctx.db,
      `select genre, count(*)::int as n from events where status = 'live' and not held_for_reports and ends_at >= $1 group by genre`, [ctx.clock.now()]);
    const counts = Object.fromEntries(rows.map((r) => [r.genre, r.n]));
    return { items: GENRES.map((g) => ({ genre: g, count: counts[g] ?? 0 })) };
  });

  app.get('/artists', async (req) => {
    const { q } = parse(z.object({ q: z.string().max(60).optional() }), req.query);
    const rows = await many<any>(ctx.db,
      `select a as name, count(*)::int as events
         from events e, unnest(e.artists) a
        where e.status = 'live' and not e.held_for_reports and e.ends_at >= $1
        group by a order by a`, [ctx.clock.now()]);
    const needle = q ? searchNormalize(q) : '';
    return { items: rows.filter((r) => !needle || searchNormalize(r.name).includes(needle)) };
  });

  app.get('/venues', async (req) => {
    const { q } = parse(z.object({ q: z.string().max(100).optional() }), req.query);
    const rows = await many<any>(ctx.db, 'select id, name, address, area, lat, lng, verified from venues order by name');
    const needle = q ? searchNormalize(q) : '';
    return {
      items: rows
        .filter((v) => !needle || searchNormalize(`${v.name} ${v.address} ${v.area}`).includes(needle))
        .slice(0, 5),
    };
  });

  app.get<{ Params: { slug: string } }>('/organizers/:slug', async (req) => {
    const now = ctx.clock.now();
    const org = await one<any>(ctx.db, 'select * from organizers where slug = $1 or id::text = $1', [req.params.slug]);
    if (!org) throw notFound(L('Organiser not found', 'Không tìm thấy nhà tổ chức'));
    const userId = req.session?.user?.id ?? null;
    const rows = await many<any>(ctx.db,
      `select ${CARD_COLUMNS} from events e join organizers o on o.id = e.organizer_id
        where e.organizer_id = $1 and e.status = 'live' and not e.held_for_reports order by e.starts_at`, [org.id]);
    const viewer = await loadViewer(ctx.db, userId, rows.map((r) => r.id));
    const cards = rows.map((r) => presentCard(r, { now, viewer }));
    const following = userId ? !!(await one(ctx.db, 'select 1 from organizer_follows where user_id = $1 and organizer_id = $2', [userId, org.id])) : false;
    return {
      id: org.id, slug: org.slug, name: org.name, initials: org.initials, art: org.art, logoUrl: org.logo_url,
      bio: org.bio, type: org.type, website: org.website, verified: org.verification_state === 'verified',
      stats: { events: cards.length, followers: org.followers_count, since: org.since_year },
      upcoming: cards.filter((c) => !c.past),
      past: cards.filter((c) => c.past).reverse(),
      me: userId ? { following } : null,
    };
  });

  /** Featured shelves that are switched on and inside their date window. */
  app.get('/shelves', async () => {
    const now = ctx.clock.now();
    const today = vnDate(now);
    const shelves = await many<any>(ctx.db,
      `select * from shelves where enabled and (starts_on is null or starts_on <= $1) and (ends_on is null or ends_on >= $1) order by sort`, [today]);
    const out = [];
    for (const s of shelves) {
      const rows = await many<any>(ctx.db,
        `select ${CARD_COLUMNS} from shelf_items si join events e on e.id = si.event_id join organizers o on o.id = e.organizer_id
          where si.shelf_id = $1 and e.status = 'live' and not e.held_for_reports and e.ends_at >= $2 order by si.sort`, [s.id, now]);
      if (rows.length) out.push({ id: s.id, slug: s.slug, name: s.name, items: rows.map((r) => presentCard(r, { now, viewer: null })) });
    }
    return { items: out };
  });

  /** Anonymous view / ticket-click counters that feed the organiser dashboard. */
  const seen = new Map<string, number>();
  app.post<{ Params: { id: string } }>('/events/:id/track', async (req, reply) => {
    const body = parse(z.object({
      type: z.enum(['view', 'ticket_click']),
      source: z.enum(['feed', 'shelf', 'shared', 'search', 'own', 'ads', 'map']).default('feed'),
    }), req.body);
    if (!isUuid(req.params.id)) throw notFound();
    const now = ctx.clock.now();
    const key = `${req.ip}|${req.session?.user?.id ?? ''}|${req.params.id}|${body.type}`;
    const last = seen.get(key);
    if (last && now.getTime() - last < 30 * 60_000) return reply.code(202).send({ counted: false });
    seen.set(key, now.getTime());
    if (seen.size > 50_000) seen.clear();
    const col = body.type === 'view' ? 'views' : 'ticket_clicks';
    const res = await one(ctx.db,
      `insert into event_metrics_daily (event_id, day, ${col}, sources)
       select id, $2, 1, case when $4 then jsonb_build_object($3::text, 1) else '{}'::jsonb end from events where id = $1
       on conflict (event_id, day) do update set
         ${col} = event_metrics_daily.${col} + 1,
         sources = case when $4 then jsonb_set(event_metrics_daily.sources, array[$3::text],
           to_jsonb(coalesce((event_metrics_daily.sources->>$3::text)::int, 0) + 1)) else event_metrics_daily.sources end
       returning 1`,
      [req.params.id, vnDate(now), body.source, body.type === 'view']);
    if (!res) throw notFound();
    return reply.code(202).send({ counted: true });
  });
}
