import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one, json } from '../db/index.ts';
import { badRequest, conflict, notFound } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { cityBySlug, cityLabel, citySlug, countryCode } from '../lib/places.ts';
import { isStyle } from '../lib/styles.ts';
import {
  ARTIST_LINK, ARTIST_ROLE, BOOKING_STATUS, cleanLink, GIG_TYPE, SET_LENGTH, TRAVEL_SCOPE, type ArtistLink,
} from '../lib/network.ts';
import { bool, csv, imageUrl, limit, localized, parse, uuid } from '../lib/validate.ts';
import { requireAdmin, requireUser } from '../http/guards.ts';
import { CARD_COLUMNS, loadViewer, presentCard } from '../presenters/event.ts';
import { artistKey, presentLinks, searchArtists } from '../services/artists.ts';
import { appendAudit } from '../services/audit.ts';
import { artistOrganizers, artistStyles, artistVenues, sharedLineups, similarArtists } from '../services/network.ts';

/*
 * Artists: the directory (/artists), an artist's page (/artists/:slug), and the profile its
 * owner edits (/me/artist). Gigs are never typed into a profile: upcoming and past shows,
 * organisers, venues and shared lineups all come from canonical events.
 */

const keysOf = <K extends string>(l: { keys: K[] }) => l.keys as [K, ...K[]];

const LIVE = `e.status = 'live' and not e.held_for_reports and e.published_at is not null`;
const PUBLIC = `e.status in ('live', 'cancelled') and not e.held_for_reports and e.published_at is not null`;

const DirectoryQuery = z.object({
  q: z.string().trim().max(80).optional(),
  role: csv(z.enum(keysOf(ARTIST_ROLE))).optional(),
  style: csv(z.string().refine(isStyle, 'unknown style')).optional(),
  city: citySlug.optional(),
  country: countryCode.optional(),
  booking: csv(z.enum(keysOf(BOOKING_STATUS))).optional(),
  travel: z.enum(keysOf(TRAVEL_SCOPE)).optional(),
  gig: csv(z.enum(keysOf(GIG_TYPE))).optional(),
  verified: bool.optional(),
  upcoming: bool.optional(),
  sort: z.enum(['next', 'name', 'active']).default('next'),
  limit: limit(60, 24),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

import { label, styleItem } from '../services/artists.ts';




export default async function artistRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  // ---- the directory ------------------------------------------------------------------------

  app.get('/artists', async (req) => {
    const f = parse(DirectoryQuery, req.query);
    const out = await searchArtists(ctx.db, f, ctx.clock.now());
    return {
      ...out,
      filters: {
        roles: ARTIST_ROLE.keys.map((k) => label(ARTIST_ROLE, k)),
        booking: BOOKING_STATUS.keys.map((k) => label(BOOKING_STATUS, k)),
        travel: TRAVEL_SCOPE.keys.map((k) => label(TRAVEL_SCOPE, k)),
        gigs: GIG_TYPE.keys.map((k) => label(GIG_TYPE, k)),
      },
    };
  });

  // ---- an artist's page ---------------------------------------------------------------------

  app.get<{ Params: { slug: string } }>('/artists/:slug', async (req) => {
    const a = await one<any>(ctx.db, 'select * from artists where slug = $1', [req.params.slug]);
    if (!a) throw notFound(L('Artist not found', 'Không tìm thấy nghệ sĩ'));
    const now = ctx.clock.now();
    const userId = req.session?.user?.id ?? null;
    const [rows, past, follows, styles, organizers, venues, lineups, similar] = await Promise.all([
      many<any>(ctx.db,
        `select ${CARD_COLUMNS} from event_artists ea join events e on e.id = ea.event_id join organizers o on o.id = e.organizer_id
          where ea.artist_id = $1 and e.status = 'live' and not e.held_for_reports and (e.ends_at is null or e.ends_at >= $2) order by e.starts_at limit 60`, [a.id, now]),
      many<any>(ctx.db,
        `select e.id, e.slug, e.title, e.starts_on::text as starts_on, e.city, e.venue_name from event_artists ea join events e on e.id = ea.event_id
          where ea.artist_id = $1 and e.status = 'live' and not e.held_for_reports and e.ends_at < $2 order by e.starts_at desc limit 20`, [a.id, now]),
      // A follow is of a name; any spelling of this artist counts.
      many<{ user_id: string; artist: string }>(ctx.db, 'select user_id, artist from artist_follows where artist = any($1::text[])', [[a.name, ...(a.aliases ?? [])]]),
      artistStyles(ctx.db, a.id),
      artistOrganizers(ctx.db, a.id),
      artistVenues(ctx.db, a.id),
      sharedLineups(ctx.db, a.id),
      similarArtists(ctx.db, a.id),
    ]);
    const viewer = await loadViewer(ctx.db, userId, rows.map((r) => r.id));
    const cards = rows.map((r) => presentCard(r, { now, viewer }));
    const rank = (xs: string[]) => [...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>())].sort((x, y) => y[1] - x[1]).map(([x]) => x);
    return {
      artist: {
        id: a.id, slug: a.slug, name: a.name, bio: a.bio, imageUrl: a.image_url, coverUrl: a.cover_url, website: a.website,
        styles: styles.slice(0, 6),
        styleLabels: styles.slice(0, 6).map(styleItem),
        roles: a.artist_roles.map((r: any) => label(ARTIST_ROLE, r)),
        basedIn: a.based_city ? { city: a.based_city, label: cityLabel(a.based_city), country: a.based_country } : null,
        languages: a.languages, activeSince: a.active_since,
        booking: label(BOOKING_STATUS, a.booking_status), travel: label(TRAVEL_SCOPE, a.travel_scope),
        gigTypes: a.gig_types.map((k: any) => label(GIG_TYPE, k)), setLengths: a.set_lengths.map((k: any) => label(SET_LENGTH, k)),
        links: presentLinks(a), openToBrands: a.open_to_brands, verified: a.verified, claimed: !!a.owner_user_id,
        cities: rank(cards.map((c) => c.city)).map((slug) => ({ slug, label: cityLabel(slug) })),
        followers: new Set(follows.map((f) => f.user_id)).size,
        following: !!userId && follows.some((f) => f.user_id === userId),
        editable: !!userId && a.owner_user_id === userId,
      },
      upcoming: cards,
      past: past.map((e) => ({ id: e.id, slug: e.slug, title: e.title, startsOn: e.starts_on, city: e.city, cityLabel: cityLabel(e.city), venue: e.venue_name })),
      relationships: { organizers, venues, sharedLineups: lineups, similar },
    };
  });

  /** Artists with a show still to come, for sitemaps. */
  app.get('/meta/artists', async () => {
    const rows = await many<{ slug: string; name: string }>(ctx.db,
      `select distinct a.slug, a.name from artists a join event_artists ea on ea.artist_id = a.id join events e on e.id = ea.event_id
        where ${LIVE} and e.ends_at >= $1 order by a.slug limit 20000`, [ctx.clock.now()]);
    return { items: rows };
  });

  // ---- the owner's profile ------------------------------------------------------------------

  const owned = async (userId: string) => {
    const a = await one<any>(ctx.db, 'select * from artists where owner_user_id = $1', [userId]);
    if (!a) throw notFound(L('You have no artist profile yet', 'Bạn chưa có hồ sơ nghệ sĩ'));
    return a;
  };

  const editable = (a: any) => ({
    id: a.id, slug: a.slug, name: a.name, aliases: a.aliases, bio: a.bio, imageUrl: a.image_url, coverUrl: a.cover_url, website: a.website,
    roles: a.artist_roles, basedCity: a.based_city, languages: a.languages, activeSince: a.active_since, styles: a.styles,
    bookingStatus: a.booking_status, travelScope: a.travel_scope, gigTypes: a.gig_types, setLengths: a.set_lengths,
    links: a.links, openToBrands: a.open_to_brands, verified: a.verified,
  });

  app.get('/me/artist', async (req) => {
    const s = requireUser(req);
    const a = await owned(s.user.id);
    const [stats] = await Promise.all([
      one<any>(ctx.db,
        `select (select count(*)::int from event_artists ea join events e on e.id = ea.event_id where ea.artist_id = $1 and ${LIVE} and e.ends_at >= $2) as upcoming,
                (select count(*)::int from event_artists ea join events e on e.id = ea.event_id where ea.artist_id = $1 and ${PUBLIC}) as events,
                (select count(distinct user_id)::int from artist_follows where artist = any($3::text[])) as followers`,
        [a.id, ctx.clock.now(), [a.name, ...(a.aliases ?? [])]]),
    ]);
    return {
      profile: editable(a), stats,
      options: {
        roles: ARTIST_ROLE.keys.map((k) => label(ARTIST_ROLE, k)), booking: BOOKING_STATUS.keys.map((k) => label(BOOKING_STATUS, k)),
        travel: TRAVEL_SCOPE.keys.map((k) => label(TRAVEL_SCOPE, k)), gigs: GIG_TYPE.keys.map((k) => label(GIG_TYPE, k)),
        setLengths: SET_LENGTH.keys.map((k) => label(SET_LENGTH, k)), links: ARTIST_LINK.keys.map((k) => label(ARTIST_LINK, k)),
      },
    };
  });

  const ProfilePatch = z.object({
    name: z.string().trim().min(2).max(80),
    bio: localized,
    imageUrl: imageUrl.nullable(),
    coverUrl: imageUrl.nullable(),
    website: z.string().url().max(500).nullable(),
    roles: z.array(z.enum(keysOf(ARTIST_ROLE))).max(5),
    basedCity: citySlug.nullable(),
    languages: z.array(z.string().trim().regex(/^[a-z]{2}$/)).max(8),
    activeSince: z.number().int().min(1950).max(2100).nullable(),
    styles: z.array(z.string().refine(isStyle, 'unknown style')).max(6),
    bookingStatus: z.enum(keysOf(BOOKING_STATUS)).nullable(),
    travelScope: z.enum(keysOf(TRAVEL_SCOPE)).nullable(),
    gigTypes: z.array(z.enum(keysOf(GIG_TYPE))).max(9),
    setLengths: z.array(z.enum(keysOf(SET_LENGTH))).max(5),
    links: z.partialRecord(z.enum(keysOf(ARTIST_LINK)), z.string().max(500).nullable()),
    openToBrands: z.boolean(),
  }).partial();

  app.patch('/me/artist', async (req) => {
    const s = requireUser(req);
    const a = await owned(s.user.id);
    const b = parse(ProfilePatch, req.body);
    const set: Record<string, unknown> = {};
    if (b.name !== undefined && b.name !== a.name) {
      const key = artistKey(b.name);
      const clash = await one<{ name: string }>(ctx.db, 'select name from artists where (normalized_name = $1 or $1 = any(alias_keys)) and id <> $2', [key, a.id]);
      if (clash) throw conflict('name_taken', L(`Another artist is listed as ${clash.name}`, `Đã có nghệ sĩ khác tên ${clash.name}`));
      // The old spelling stays an alias: lineups and follows that use it keep finding this artist.
      set.name = b.name;
      set.normalized_name = key;
      // The written form stays even when only accents changed ("Mây Đêm" to "May Dem"): follows use it.
      set.aliases = [...new Set([...(a.aliases ?? []), a.name])].filter((x) => x !== b.name);
      set.alias_keys = [...new Set((set.aliases as string[]).map(artistKey))].filter((k) => k !== key);
    }
    if (b.links) {
      const links: Record<string, string> = { ...(a.links ?? {}) };
      for (const [k, v] of Object.entries(b.links)) {
        if (!v) { delete links[k]; continue; }
        const clean = cleanLink(k as ArtistLink, v);
        if (!clean) throw badRequest('invalid_link', L(`That is not a ${ARTIST_LINK.label[k as ArtistLink].en} link`, `Đây không phải link ${ARTIST_LINK.label[k as ArtistLink].vi}`), { kind: k });
        links[k] = clean;
      }
      set.links = json(links);
    }
    if (b.basedCity !== undefined) {
      set.based_city = b.basedCity;
      set.based_country = b.basedCity ? cityBySlug(b.basedCity)?.countryCode ?? null : null;
    }
    const direct: Record<string, string> = {
      imageUrl: 'image_url', coverUrl: 'cover_url', website: 'website', roles: 'artist_roles', languages: 'languages', activeSince: 'active_since',
      bookingStatus: 'booking_status', travelScope: 'travel_scope', gigTypes: 'gig_types', setLengths: 'set_lengths', openToBrands: 'open_to_brands',
    };
    for (const [k, col] of Object.entries(direct)) if ((b as any)[k] !== undefined) set[col] = (b as any)[k];
    if (b.styles) set.styles = [...new Set(b.styles)];
    if (b.bio) set.bio = json(b.bio);
    const keys = Object.keys(set);
    if (!keys.length) return { profile: editable(a) };
    const row = await one<any>(ctx.db,
      `update artists set ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')}, updated_at = now() where id = $1 returning *`, [a.id, ...keys.map((k) => set[k])]);
    return { profile: editable(row), message: L('Profile saved', 'Đã lưu hồ sơ') };
  });

  // ---- the team -----------------------------------------------------------------------------

  app.get('/admin/artists', async (req) => {
    requireAdmin(req);
    const { q, limit: max } = parse(z.object({ q: z.string().trim().max(80).optional(), limit: limit(200, 50) }), req.query);
    const key = q ? artistKey(q) : '';
    const rows = await many<any>(ctx.db,
      `select a.id, a.slug, a.name, a.aliases, a.verified, a.musicbrainz_id, a.wikidata_id, a.spotify_id, a.owner_user_id, u.email as owner_email,
              (select count(*)::int from event_artists ea where ea.artist_id = a.id) as events
         from artists a left join users u on u.id = a.owner_user_id
        where ($1 = '' or a.normalized_name like '%' || $1 || '%')
        order by a.verified desc, events desc, a.name limit $2`, [key, max]);
    return { items: rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name, aliases: r.aliases, verified: r.verified, musicbrainzId: r.musicbrainz_id,
      wikidataId: r.wikidata_id, spotifyId: r.spotify_id, owner: r.owner_user_id ? { id: r.owner_user_id, email: r.owner_email } : null, events: r.events })) };
  });

  /** What only the team sets: the verified tick and the identity anchors that beat a name match. */
  app.patch<{ Params: { id: string } }>('/admin/artists/:id', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const b = parse(z.object({
      verified: z.boolean(),
      musicbrainzId: z.string().uuid().nullable(),
      wikidataId: z.string().regex(/^Q\d{1,12}$/).nullable(),
      spotifyId: z.string().regex(/^[A-Za-z0-9]{22}$/).nullable(),
      aliases: z.array(z.string().trim().min(1).max(120)).max(20),
    }).partial(), req.body);
    const before = await one<any>(ctx.db, 'select * from artists where id = $1', [id]);
    if (!before) throw notFound();
    const map: Record<string, string> = { verified: 'verified', musicbrainzId: 'musicbrainz_id', wikidataId: 'wikidata_id', spotifyId: 'spotify_id' };
    const set: Record<string, unknown> = {};
    for (const [k, col] of Object.entries(map)) if ((b as any)[k] !== undefined) set[col] = (b as any)[k];
    if (b.aliases) {
      set.aliases = [...new Set(b.aliases)].filter((x) => artistKey(x) !== before.normalized_name);
      set.alias_keys = [...new Set((set.aliases as string[]).map(artistKey))];
    }
    const keys = Object.keys(set);
    if (!keys.length) throw badRequest('nothing_to_change', L('Nothing to change', 'Không có gì để thay đổi'));
    try {
      await ctx.db.query(`update artists set ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')}, updated_at = now() where id = $1`, [id, ...keys.map((k) => set[k])]);
    } catch (e: any) {
      if (e.code === '23505') throw conflict('anchor_taken', L('Another artist already has that identity', 'Nghệ sĩ khác đã dùng định danh này'));
      throw e;
    }
    await appendAudit(ctx.db, {
      at: ctx.clock.now(), actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'artist.edited_by_team',
      targetType: 'artist', targetId: id, targetLabel: before.name, diff: keys.map((k) => ({ f: k, a: JSON.stringify(before[k] ?? null).slice(0, 80), b: JSON.stringify(set[k] ?? null).slice(0, 80) })),
    });
    return { ok: true };
  });

}
