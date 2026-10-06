import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { cityLabel } from '../lib/places.ts';

/*
 * The industry graph, read from canonical events. An artist "worked with" an organiser when
 * one of that organiser's public events lists them; two artists "shared a lineup" when one
 * event lists both; an organiser "worked at" a venue when it ran an event there. Nothing here
 * is stored: every line is a count over events, with the most recent one and a few examples,
 * so each relationship says where it comes from.
 */

const PUBLIC = `e.status in ('live', 'cancelled') and not e.held_for_reports and e.published_at is not null`;

export interface Evidence { events: number; lastOn: string | null; examples: { slug: string; title: string }[] }

const evidence = (r: any): Evidence => ({
  events: r.events,
  lastOn: r.last_on ?? null,
  examples: (r.examples ?? []).slice(0, 3).map((x: string) => {
    const i = x.indexOf('|');
    return { slug: x.slice(0, i), title: x.slice(i + 1) };
  }),
});
const EXAMPLES = `(array_agg(e.slug || '|' || e.title order by e.starts_at desc))[1:3] as examples`;

/** Organisers whose events list this artist, most events first. */
export async function artistOrganizers(q: Queryable, artistId: string, max = 8) {
  const rows = await many<any>(q,
    `select o.id, o.slug, o.name, o.art, o.logo_url, o.verification_state, count(distinct e.id)::int as events, max(e.starts_on)::text as last_on, ${EXAMPLES}
       from event_artists ea join events e on e.id = ea.event_id join organizers o on o.id = e.organizer_id
      where ea.artist_id = $1 and ${PUBLIC} and not o.is_community
      group by o.id order by events desc, last_on desc limit $2`, [artistId, max]);
  return rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name, art: r.art, logoUrl: r.logo_url, verified: r.verification_state === 'verified', ...evidence(r) }));
}

/** Venues this artist has played or will play. */
export async function artistVenues(q: Queryable, artistId: string, max = 8) {
  const rows = await many<any>(q,
    `select e.venue_name as name, e.city, count(distinct e.id)::int as events, max(e.starts_on)::text as last_on, ${EXAMPLES}
       from event_artists ea join events e on e.id = ea.event_id
      where ea.artist_id = $1 and ${PUBLIC} and e.venue_name is not null
      group by e.venue_name, e.city order by events desc, last_on desc limit $2`, [artistId, max]);
  return rows.map((r) => ({ name: r.name, city: r.city, cityLabel: cityLabel(r.city), ...evidence(r) }));
}

/** Artists who appeared on the same lineups. */
export async function sharedLineups(q: Queryable, artistId: string, max = 8) {
  const rows = await many<any>(q,
    `select a.id, a.slug, a.name, count(distinct e.id)::int as events, max(e.starts_on)::text as last_on, ${EXAMPLES}
       from event_artists mine join event_artists theirs on theirs.event_id = mine.event_id and theirs.artist_id <> mine.artist_id
       join events e on e.id = mine.event_id join artists a on a.id = theirs.artist_id
      where mine.artist_id = $1 and ${PUBLIC}
      group by a.id order by events desc, last_on desc limit $2`, [artistId, max]);
  return rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name, ...evidence(r) }));
}

/** Artists on this organiser's lineups. */
export async function organizerArtists(q: Queryable, organizerId: string, max = 12) {
  const rows = await many<any>(q,
    `select a.id, a.slug, a.name, count(distinct e.id)::int as events, max(e.starts_on)::text as last_on, ${EXAMPLES}
       from events e join event_artists ea on ea.event_id = e.id join artists a on a.id = ea.artist_id
      where e.organizer_id = $1 and ${PUBLIC}
      group by a.id order by events desc, last_on desc limit $2`, [organizerId, max]);
  return rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name, ...evidence(r) }));
}

/** Venues this organiser has run events at. */
export async function organizerVenues(q: Queryable, organizerId: string, max = 12) {
  const rows = await many<any>(q,
    `select e.venue_name as name, e.city, count(*)::int as events, max(e.starts_on)::text as last_on, ${EXAMPLES}
       from events e where e.organizer_id = $1 and ${PUBLIC} and e.venue_name is not null
      group by e.venue_name, e.city order by events desc, last_on desc limit $2`, [organizerId, max]);
  return rows.map((r) => ({ name: r.name, city: r.city, cityLabel: cityLabel(r.city), ...evidence(r) }));
}

/** The styles an artist plays: what their profile says first, then what their events say. */
export async function artistStyles(q: Queryable, artistId: string): Promise<string[]> {
  const row = await one<{ own: string[]; played: string[] }>(q,
    `select a.styles as own,
            coalesce((select array_agg(s order by n desc) from (
               select s, count(*) as n from event_artists ea join events e on e.id = ea.event_id, unnest(e.styles) s
                where ea.artist_id = a.id and ${PUBLIC} group by s) x), '{}') as played
       from artists a where a.id = $1`, [artistId]);
  return [...new Set([...(row?.own ?? []), ...(row?.played ?? [])])];
}

// ---- affinity ----------------------------------------------------------------------------

/** How alike two artists are, out of 100. Fixed weights; no follower count, so new names surface. */
export const AFFINITY_WEIGHTS = { styles: 25, sharedLineups: 25, organizers: 20, venues: 10, cities: 10, audience: 10 } as const;

interface Profile { styles: Set<string>; organizers: Set<string>; venues: Set<string>; cities: Set<string>; fans: Set<string> }

const jaccard = (a: Set<string>, b: Set<string>) => {
  if (!a.size || !b.size) return 0;
  let both = 0;
  for (const x of a) if (b.has(x)) both++;
  return both / (a.size + b.size - both);
};
const overlap = (a: Set<string>, b: Set<string>) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n; };

async function profiles(q: Queryable, ids: string[]): Promise<Map<string, Profile>> {
  const out = new Map<string, Profile>(ids.map((id) => [id, { styles: new Set(), organizers: new Set(), venues: new Set(), cities: new Set(), fans: new Set() }]));
  if (!ids.length) return out;
  const [own, played, fans] = await Promise.all([
    many<{ id: string; styles: string[]; based_city: string | null }>(q, 'select id, styles, based_city from artists where id = any($1::uuid[])', [ids]),
    many<{ artist_id: string; styles: string[]; organizer_id: string; venue: string | null; city: string | null }>(q,
      `select ea.artist_id, e.styles, e.organizer_id, lower(e.venue_name) || '@' || e.city as venue, e.city
         from event_artists ea join events e on e.id = ea.event_id where ea.artist_id = any($1::uuid[]) and ${PUBLIC}`, [ids]),
    // A follow is of a name; any spelling of the artist counts.
    many<{ id: string; user_id: string }>(q,
      `select a.id, f.user_id from artists a join artist_follows f on f.artist = a.name or f.artist = any(a.aliases) where a.id = any($1::uuid[])`, [ids]),
  ]);
  for (const r of own) {
    const p = out.get(r.id)!;
    r.styles.forEach((s) => p.styles.add(s));
    if (r.based_city) p.cities.add(r.based_city);
  }
  for (const r of played) {
    const p = out.get(r.artist_id)!;
    (r.styles ?? []).forEach((s) => p.styles.add(s));
    p.organizers.add(r.organizer_id);
    if (r.venue) p.venues.add(r.venue);
    if (r.city) p.cities.add(r.city);
  }
  for (const r of fans) out.get(r.id)!.fans.add(r.user_id);
  return out;
}

export interface Affinity { id: string; slug: string; name: string; score: number; because: { styles: number; sharedLineups: number; organizers: number; venues: number; cities: number; audience: number } }

/** Artists most like this one, each with the points behind its score. */
export async function similarArtists(q: Queryable, artistId: string, max = 6): Promise<Affinity[]> {
  const target = (await profiles(q, [artistId])).get(artistId)!;
  // Candidates: shared lineups, the same organisers' lineups, and the same styles.
  const cands = await many<{ id: string; shared: number }>(q,
    `with lineup as (
       select theirs.artist_id as id, count(distinct mine.event_id)::int as shared
         from event_artists mine join event_artists theirs on theirs.event_id = mine.event_id and theirs.artist_id <> mine.artist_id
         join events e on e.id = mine.event_id where mine.artist_id = $1 and ${PUBLIC} group by theirs.artist_id),
     orgs as (
       select distinct ea.artist_id as id from event_artists ea join events e on e.id = ea.event_id
        where e.organizer_id = any($2::uuid[]) and ea.artist_id <> $1 and ${PUBLIC} limit 300),
     styled as (
       (select distinct ea.artist_id as id from event_artists ea join events e on e.id = ea.event_id
         where e.styles && $3::text[] and ea.artist_id <> $1 and ${PUBLIC} limit 300)
       union (select id from artists where styles && $3::text[] and id <> $1 limit 300))
     select c.id, coalesce(l.shared, 0) as shared from (select id from lineup union select id from orgs union select id from styled) c
       left join lineup l on l.id = c.id limit 400`,
    [artistId, [...target.organizers], [...target.styles]]);
  if (!cands.length) return [];
  const others = await profiles(q, cands.map((c) => c.id));
  const W = AFFINITY_WEIGHTS;
  const scored = cands.map((c) => {
    const p = others.get(c.id)!;
    const because = {
      styles: Math.round(W.styles * jaccard(target.styles, p.styles)),
      sharedLineups: Math.round(W.sharedLineups * Math.min(c.shared, 4) / 4),
      organizers: Math.round(W.organizers * Math.min(overlap(target.organizers, p.organizers), 3) / 3),
      venues: Math.round(W.venues * Math.min(overlap(target.venues, p.venues), 3) / 3),
      cities: Math.round(W.cities * jaccard(target.cities, p.cities)),
      audience: Math.round(W.audience * Math.min(overlap(target.fans, p.fans), 5) / 5),
    };
    return { id: c.id, score: Object.values(because).reduce((a, b) => a + b, 0), because };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, max);
  const names = await many<{ id: string; slug: string; name: string }>(q, 'select id, slug, name from artists where id = any($1::uuid[])', [scored.map((s) => s.id)]);
  const by = new Map(names.map((n) => [n.id, n]));
  return scored.map((s) => ({ ...by.get(s.id)!, score: s.score, because: s.because }));
}
