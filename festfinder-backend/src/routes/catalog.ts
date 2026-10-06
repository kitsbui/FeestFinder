import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { Ctx } from '../context.ts';
import { many, one } from '../db/index.ts';
import { notFound } from '../lib/errors.ts';
import { FAMILY_KEYS, GENRE_FAMILIES, GENRES, L } from '../lib/i18n.ts';
import { searchNormalize } from '../lib/contact.ts';
import { cityBySlug, cityLabel, countryByCode, countryCode, launchedCities, launchedCity, placesForClient } from '../lib/places.ts';
import { artistLinks } from '../services/artists.ts';
import { countEventMetric } from '../services/partners.ts';
import { EVENT_TYPE_LABEL, EVENT_TYPES, isStyle, styleByKey, STYLES } from '../lib/styles.ts';
import { ORGANIZER_TYPE, type OrganizerType } from '../lib/network.ts';
import { organizerArtists, organizerVenues } from '../services/network.ts';
import { presentOrgLinks } from '../services/organizers.ts';
import { dateIn, TIME_KEYS, timeWindow, vnDate, weekendRange, type TimeKey } from '../lib/time.ts';
import { bool, csv, dateStr, limit, parse, uuid } from '../lib/validate.ts';
import { decodeCursor, isUuid, page, SqlParams } from '../http/sql.ts';
import { CARD_COLUMNS, loadPublicSources, loadViewer, ORG_COLUMNS, presentCard, presentTiers } from '../presenters/event.ts';
import { findClashes, loadTimetable } from '../presenters/timetable.ts';
import { SHARE_CHANNELS } from '../services/community.ts';
import { eventExtras } from '../services/eventpage.ts';
import { recordShareVisit } from './community.ts';

const PRICE_BANDS = ['free', 'under', 'over'] as const;
const BBOX = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;

/** "Today" for a time filter: the chosen city's, else the chosen country's, else Vietnam's. */
export function todayFor(f: { city?: string; country?: string }, now: Date): string {
  const tz = cityBySlug(f.city)?.timezone ?? countryByCode(f.country)?.timezone;
  return tz ? dateIn(now, tz) : vnDate(now);
}

/** The four corners of a map box, west to east even across the antimeridian. */
export function parseBbox(s: string): { minLng: number; minLat: number; maxLng: number; maxLat: number } {
  const [minLng, minLat, maxLng, maxLat] = s.split(',').map(Number);
  return { minLng, minLat: Math.min(minLat, maxLat), maxLng, maxLat: Math.max(minLat, maxLat) };
}
const TIME_FILTERS = ['tonight', 'weekend', '7days', 'month', 'all'] as const;
const MAP_LIMIT = 500;

const ExploreQuery = z.object({
  time: z.enum(TIME_FILTERS).default('weekend'),
  from: dateStr.optional(),
  to: dateStr.optional(),
  q: z.string().max(100).optional(),
  genre: z.enum(GENRES).optional(),
  /** A genre family: every genre in it (lib/i18n.ts GENRE_FAMILIES). */
  family: z.enum(FAMILY_KEYS as [string, ...string[]]).optional(),
  artist: z.string().max(100).optional(),
  price: csv(z.enum(PRICE_BANDS)).optional(),
  area: z.string().max(60).optional(),
  city: launchedCity.optional(),
  country: countryCode.optional(),
  style: csv(z.string().refine(isStyle, 'unknown style')).optional(),
  type: csv(z.enum(EVENT_TYPES)).optional(),
  venue: uuid.optional(),
  confidenceMin: z.coerce.number().int().min(0).max(100).optional(),
  source: z.string().regex(/^[a-z_]{2,30}$/).optional(),
  bbox: z.string().regex(BBOX, 'minLng,minLat,maxLng,maxLat').optional(),
  /** Only events that have not ended. */
  upcoming: bool.optional(),
  organizer: z.string().max(80).optional(),
  friendsOnly: bool.optional(),
  sort: z.enum(['date', 'hype', 'price', 'relevance']).default('date'),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  limit: limit(60, 6),
  cursor: z.string().optional(),
});

/** Filters shared by the Explore feed, the stat drill-downs and the facet counts. */
function feedFilters(sql: SqlParams, f: z.infer<typeof ExploreQuery>, today: string, userId: string | null, opts: { time: boolean; genre: boolean; city?: boolean }) {
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
  if (opts.genre && f.family) where.push(`e.genre = any(${sql.p([...GENRE_FAMILIES[f.family as keyof typeof GENRE_FAMILIES]])}::text[])`);
  if (f.artist) where.push(`${sql.p(f.artist)} = any(e.artists)`);
  if (f.area) where.push(`e.area = ${sql.p(f.area)}`);
  if (opts.city !== false && f.city) where.push(`e.city = ${sql.p(f.city)}`);
  // Only listed cities appear in discovery, whatever the country filter says.
  where.push(`e.city = any(${sql.p(launchedCities().map((c) => c.slug))}::text[])`);
  if (f.country) where.push(`e.city in (select slug from cities where country_code = ${sql.p(f.country)})`);
  if (f.style?.length) where.push(`e.styles && ${sql.p(f.style)}::text[]`);
  if (f.type?.length) where.push(`e.event_type = any(${sql.p(f.type)}::text[])`);
  if (f.venue) where.push(`e.venue_id = ${sql.p(f.venue)}`);
  if (f.confidenceMin !== undefined) where.push(`coalesce(e.confidence_score, 0) >= ${sql.p(f.confidenceMin)}`);
  if (f.source) where.push(`exists (select 1 from event_sources s where s.event_id = e.id and s.provider = ${sql.p(f.source)})`);
  if (f.bbox) {
    const b = parseBbox(f.bbox);
    const lng = b.minLng <= b.maxLng
      ? `e.lng between ${sql.p(b.minLng)} and ${sql.p(b.maxLng)}`
      : `(e.lng >= ${sql.p(b.minLng)} or e.lng <= ${sql.p(b.maxLng)})`;
    where.push(`e.lat between ${sql.p(b.minLat)} and ${sql.p(b.maxLat)} and ${lng}`);
  }
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

async function canPreview(ctx: Ctx, req: FastifyRequest, organizerId: string, submittedBy: string | null = null): Promise<boolean> {
  const user = req.session?.user;
  if (!user) return false;
  if (user.role === 'admin' || user.id === submittedBy) return true;
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
    const today = todayFor(f, now);
    const userId = req.session?.user?.id ?? null;
    const offset = decodeCursor(f.cursor);

    const sql = new SqlParams();
    const where = feedFilters(sql, f, today, userId, { time: true, genre: true });
    if (f.upcoming) where.push(`(e.ends_at is null or e.ends_at >= ${sql.p(now)})`);
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
    // City chips count upcoming events in each city under every other filter.
    const csql = new SqlParams();
    const cwhere = feedFilters(csql, f, today, userId, { time: true, genre: true, city: false });
    cwhere.push(`(e.ends_at is null or e.ends_at >= ${csql.p(now)})`);
    const facetCity = await many<{ city: string; n: number }>(ctx.db,
      `select e.city, count(*)::int as n from events e join organizers o on o.id = e.organizer_id where ${cwhere.join(' and ')} group by e.city`, csql.values);
    // Family chips count each family (and what is free) under every filter but the genre.
    const gsql = new SqlParams();
    const gwhere = feedFilters(gsql, f, today, userId, { time: true, genre: false });
    if (f.upcoming) gwhere.push(`(e.ends_at is null or e.ends_at >= ${gsql.p(now)})`);
    const familyCounts = FAMILY_KEYS.map((k) => `count(*) filter (where e.genre = any(${gsql.p([...GENRE_FAMILIES[k]])}::text[]))::int as "${k}"`);
    const facetFamily = await one<Record<string, number>>(ctx.db,
      `select ${familyCounts.join(', ')}, count(*) filter (where e.entry_mode = 'free' or e.price_from = 0)::int as "free"
         from events e join organizers o on o.id = e.organizer_id where ${gwhere.join(' and ')}`, gsql.values);

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
      facets: { time: facetTime, city: Object.fromEntries(facetCity.map((r) => [r.city, r.n])), family: facetFamily },
      window: f.q ? null : f.from ? { from: f.from, to: f.to ?? f.from } : f.time !== 'all' ? timeWindow(f.time as TimeKey, today) : null,
    };
  });

  /**
   * The map: events with a pin inside a box, under the same filters as the list. The map asks
   * once when it opens and again only when someone presses "search this area", never on every
   * pan. Pins are light; the drawer opens the full page.
   */
  app.get('/events/map', async (req) => {
    const f = parse(ExploreQuery.extend({ time: z.enum(TIME_FILTERS).default('all'), limit: limit(MAP_LIMIT, 300), free: bool.optional() }), req.query);
    if (f.free) f.price = ['free'];
    const now = ctx.clock.now();
    const userId = req.session?.user?.id ?? null;
    const sql = new SqlParams();
    const where = feedFilters(sql, f, todayFor(f, now), userId, { time: true, genre: true });
    where.push(`(e.ends_at is null or e.ends_at >= ${sql.p(now)})`, 'e.lat is not null', 'e.lng is not null');
    const rows = await many<any>(ctx.db,
      `select ${CARD_COLUMNS}, count(*) over () as total from events e join organizers o on o.id = e.organizer_id
        where ${where.join(' and ')} order by e.starts_at, e.id limit ${sql.p(f.limit)}`, sql.values);
    const total = rows[0]?.total ?? 0;
    return {
      items: rows.map((r) => {
        const c = presentCard(r, { now, viewer: null });
        return {
          id: c.id, slug: c.slug, title: c.title, genre: c.genre, styles: c.styles, eventType: c.eventType,
          lat: c.venue.lat, lng: c.venue.lng, venue: c.venue.name, area: c.venue.area, city: c.city, cityLabel: c.cityLabel,
          startsOn: c.startsOn, endsOn: c.endsOn, startTime: c.startTime, endTime: c.endTime,
          art: c.art, coverUrl: c.coverUrl, priceFrom: c.priceFrom, currency: c.currency, isFree: c.isFree, soldOut: c.soldOut,
          lineup: c.lineup.slice(0, 6), confidence: c.confidence,
        };
      }),
      total,
      truncated: total > rows.length,
    };
  });

  app.get<{ Params: { idOrSlug: string } }>('/events/:idOrSlug', async (req) => {
    const now = ctx.clock.now();
    const ev = await findEvent(ctx, req.params.idOrSlug);
    const visible = ev && ev.status === 'live' && !ev.held_for_reports;
    if (!ev || (!visible && !(await canPreview(ctx, req, ev.organizer_id, ev.submitted_by)))) throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
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
          ? L(`Following ${followedArtists.size} of this lineup. We will tell you when any of them announce a show.`,
            `Đang theo dõi ${followedArtists.size} nghệ sĩ trong đội hình này. Khi họ có show mới, chúng tôi sẽ nhắn bạn.`)
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
      sources: await loadPublicSources(ctx.db, ev.id),
      artistLinks: await artistLinks(ctx.db, ev.id),
      ...(await eventExtras(ctx.db, ev, userId, now)),
      description: ev.description,
      age: ev.age,
      capacity: ev.capacity,
      links: {
        event: ev.event_url ?? `${ctx.config.publicBaseUrl.replace(/\/$/, '')}/e/${ev.slug}`,
        brand: ev.brand_url,
        tickets: ev.entry_mode === 'paid' ? ev.ticket_url : null,
        // Every ticket button goes through here: counted, then to the checkout or the seller.
        go: ev.entry_mode === 'paid' && (tierRows.length || ev.ticket_url) ? `/go/${ev.slug}` : null,
      },
      ticketNote: L('Tickets are sold by the organiser. FeestFinder does not add a booking fee.', 'Vé do nhà tổ chức bán. FeestFinder không thu thêm phí đặt vé.'),
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

  /**
   * The basemap in Bảng phấn colours: board-dark land, darker water, roads as faint chalk
   * lines. Built from the Protomaps schema of the configured PMTiles archive; without one,
   * the board alone, and the map shows the events on it.
   */
  app.get('/map/style.json', async (_req, reply) => {
    reply.header('cache-control', 'public, max-age=300, s-maxage=3600');
    return mapStyle(ctx.config.map);
  });

  /** What the discovery screens build their chips from: listed cities, music styles, event types. */
  app.get('/meta/discovery', async (_req, reply) => {
    reply.header('cache-control', 'public, max-age=300');
    return {
      ...placesForClient(),
      genres: GENRES,
      styles: STYLES.map((x) => ({ key: x.key, label: x.label, genre: x.genre })),
      eventTypes: EVENT_TYPES.map((key) => ({ key, label: EVENT_TYPE_LABEL[key] })),
    };
  });

  app.get('/genres', async () => {
    const rows = await many<any>(ctx.db,
      `select genre, count(*)::int as n from events where status = 'live' and not held_for_reports and ends_at >= $1 group by genre`, [ctx.clock.now()]);
    const counts = Object.fromEntries(rows.map((r) => [r.genre, r.n]));
    return { items: GENRES.map((g) => ({ genre: g, count: counts[g] ?? 0 })) };
  });

  app.get('/venues', async (req) => {
    // The organiser wizard takes the whole verified list for its autocomplete.
    const { q, limit: max } = parse(z.object({ q: z.string().max(100).optional(), limit: limit(200, 5) }), req.query);
    // Only venues the team has verified are offered; anything else is typed as a new venue and checked in review.
    const rows = await many<any>(ctx.db, 'select id, name, address, area, lat, lng, verified from venues where verified order by name');
    const needle = q ? searchNormalize(q) : '';
    return {
      items: rows
        .filter((v) => !needle || searchNormalize(`${v.name} ${v.address} ${v.area}`).includes(needle))
        .slice(0, max),
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
    const [following, artists, venues, member] = await Promise.all([
      userId ? one(ctx.db, 'select 1 from organizer_follows where user_id = $1 and organizer_id = $2', [userId, org.id]) : null,
      organizerArtists(ctx.db, org.id),
      organizerVenues(ctx.db, org.id),
      userId ? one(ctx.db, 'select 1 from organizer_members where user_id = $1 and organizer_id = $2', [userId, org.id]) : null,
    ]);
    // The styles it runs: what its profile says, then what its events say.
    const played = [...cards.flatMap((c) => c.styles).reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>())]
      .sort((x, y) => y[1] - x[1]).map(([x]) => x);
    const styles = [...new Set([...(org.styles ?? []), ...played])].slice(0, 6);
    return {
      id: org.id, slug: org.slug, name: org.name, initials: org.initials, art: org.art, logoUrl: org.logo_url, coverUrl: org.cover_url,
      bio: org.bio, type: org.type, typeLabel: ORGANIZER_TYPE.label[org.type as OrganizerType] ?? null, website: org.website,
      verified: org.verification_state === 'verified',
      // The cities it says it runs events in, or else the ones its events are in.
      markets: (org.markets?.length ? org.markets as string[] : [...new Set(cards.map((c) => c.city))]).map((slug) => ({ slug, label: cityLabel(slug) })),
      styles: styles.map((k) => ({ key: k, label: styleByKey(k)?.label ?? L(k, k) })),
      openForSubmissions: org.open_for_submissions,
      links: presentOrgLinks(org),
      stats: { events: cards.length, followers: org.followers_count, since: org.since_year, artists: artists.length },
      upcoming: cards.filter((c) => !c.past),
      past: cards.filter((c) => c.past).reverse(),
      artists, venues,
      me: userId ? { following: !!following, member: !!member } : null,
    };
  });

  /** Featured shelves that are switched on and inside their date window. */
  app.get('/shelves', async () => {
    const now = ctx.clock.now();
    const today = vnDate(now);
    const shelves = await many<any>(ctx.db,
      `select * from shelves where enabled and (starts_on is null or starts_on <= $1) and (ends_on is null or ends_on >= $1) order by sort`, [today]);
    // Every shelf's events in one query.
    const rows = shelves.length ? await many<any>(ctx.db,
      `select si.shelf_id, ${CARD_COLUMNS} from shelf_items si join events e on e.id = si.event_id join organizers o on o.id = e.organizer_id
        where si.shelf_id = any($1::uuid[]) and e.status = 'live' and not e.held_for_reports and e.ends_at >= $2 order by si.sort`,
      [shelves.map((s) => s.id), now]) : [];
    return {
      items: shelves
        .map((s) => ({ id: s.id, slug: s.slug, name: s.name, items: rows.filter((r) => r.shelf_id === s.id).map((r) => presentCard(r, { now, viewer: null })) }))
        .filter((s) => s.items.length),
    };
  });

  /** Anonymous view / ticket-click counters that feed the organiser dashboard. */
  const seen = new Map<string, number>();
  app.post<{ Params: { id: string } }>('/events/:id/track', async (req, reply) => {
    const body = parse(z.object({
      type: z.enum(['view', 'ticket_click']),
      source: z.enum(['feed', 'shelf', 'shared', 'search', 'own', 'ads', 'map', 'list']).default('feed'),
      // A view that arrived on a share link: where it was shared, and who shared it.
      channel: z.enum(SHARE_CHANNELS).optional(),
      ref: z.string().regex(/^[2-9A-HJ-NP-Z]{6}$/).optional(),
    }), req.body);
    if (!isUuid(req.params.id)) throw notFound();
    const now = ctx.clock.now();
    const key = `${req.ip}|${req.session?.user?.id ?? ''}|${req.params.id}|${body.type}`;
    const last = seen.get(key);
    if (body.type === 'view' && body.ref) {
      const visitor = req.session?.user?.id ?? `${req.ip}|${req.headers['user-agent'] ?? ''}`;
      await recordShareVisit(app, req.params.id, body.ref, body.channel ?? 'copy', visitor).catch(() => false);
    }
    if (last && now.getTime() - last < 30 * 60_000) return reply.code(202).send({ counted: false });
    seen.set(key, now.getTime());
    if (seen.size > 50_000) seen.clear();
    const counted = await countEventMetric(ctx.db, req.params.id, body.type === 'view' ? 'views' : 'ticket_clicks',
      body.source === 'shared' && body.channel ? `shared:${body.channel}` : body.source, now);
    if (!counted) throw notFound();
    return reply.code(202).send({ counted: true });
  });
}

const CHALK = 'rgba(255,252,225,';

/**
 * A MapLibre style for Protomaps basemaps, or the plain board when there is none. The
 * overview archive (the region at low zoom) draws underneath up to zoom 8; the detail
 * archive (the listed cities) draws on top at every zoom. The two are styled the same,
 * so where both have a tile nobody can tell.
 */
export function mapStyle(map: { tilesUrl: string | null; overviewUrl?: string | null; glyphsUrl: string | null }) {
  const layers: Record<string, unknown>[] = [{ id: 'board', type: 'background', paint: { 'background-color': '#0E100F' } }];
  const sources: Record<string, unknown> = {};
  const attribution = '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>';
  const archives = [map.overviewUrl ? { src: 'overview', url: map.overviewUrl, maxzoom: map.tilesUrl ? 8 : undefined } : null,
    map.tilesUrl ? { src: 'detail', url: map.tilesUrl, maxzoom: undefined } : null].filter((a): a is NonNullable<typeof a> => !!a);
  if (!archives.length) return { version: 8, name: 'FeestFinder board', sources, layers };
  for (const a of archives) {
    sources[a.src] = { type: 'vector', url: `pmtiles://${a.url}`, attribution };
    const z = a.maxzoom ? { maxzoom: a.maxzoom } : {};
    const layer = (id: string, def: Record<string, unknown>) => layers.push({ id: `${a.src}-${id}`, source: a.src, ...z, ...def });
    const road = (id: string, filter: unknown[], color: string, width: unknown[], minzoom: number) =>
      layer(id, { type: 'line', 'source-layer': 'roads', minzoom, filter, paint: { 'line-color': color, 'line-width': width } });
    layer('earth', { type: 'fill', 'source-layer': 'earth', paint: { 'fill-color': '#151714' } });
    layer('parks', { type: 'fill', 'source-layer': 'landuse', filter: ['in', ['get', 'kind'], ['literal', ['park', 'nature_reserve', 'forest', 'wood', 'golf_course']]], paint: { 'fill-color': '#181b17' } });
    layer('water', { type: 'fill', 'source-layer': 'water', paint: { 'fill-color': '#0A0F10' } });
    layer('buildings', { type: 'fill', 'source-layer': 'buildings', minzoom: 14, paint: { 'fill-color': `${CHALK}0.035)` } });
    road('roads-minor', ['in', ['get', 'kind'], ['literal', ['minor_road', 'other']]], `${CHALK}0.06)`, ['interpolate', ['linear'], ['zoom'], 12, 0.4, 16, 2], 12);
    road('roads-major', ['==', ['get', 'kind'], 'major_road'], `${CHALK}0.12)`, ['interpolate', ['linear'], ['zoom'], 8, 0.4, 16, 3], 7);
    road('roads-highway', ['==', ['get', 'kind'], 'highway'], `${CHALK}0.2)`, ['interpolate', ['linear'], ['zoom'], 5, 0.4, 16, 4], 5);
    layer('borders', { type: 'line', 'source-layer': 'boundaries', filter: ['<=', ['get', 'kind_detail'], 2],
      paint: { 'line-color': `${CHALK}0.28)`, 'line-width': 0.8, 'line-dasharray': [3, 2] } });
  }
  if (map.glyphsUrl) {
    // Place names from the most detailed archive, in Vietnamese or English where the map has them.
    const src = archives[archives.length - 1].src;
    layers.push({
      id: 'places', type: 'symbol', source: src, 'source-layer': 'places',
      filter: ['in', ['get', 'kind'], ['literal', ['country', 'region', 'locality']]],
      layout: { 'text-field': ['coalesce', ['get', 'name:vi'], ['get', 'name:en'], ['get', 'name']], 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 3, 11, 10, 14], 'symbol-sort-key': ['get', 'min_zoom'] },
      paint: { 'text-color': '#A5A493', 'text-halo-color': '#0E100F', 'text-halo-width': 1.4 },
    });
  }
  return { version: 8, name: 'FeestFinder Bảng phấn', ...(map.glyphsUrl ? { glyphs: map.glyphsUrl } : {}), sources, layers };
}
