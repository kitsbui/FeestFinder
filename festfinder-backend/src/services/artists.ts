import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { slugify } from '../lib/contact.ts';
import { L, type Localized } from '../lib/i18n.ts';
import { ARTIST_LINK, ARTIST_ROLE, BOOKING_STATUS, TRAVEL_ORDER, TRAVEL_SCOPE, type ArtistLink, type TravelScope } from '../lib/network.ts';
import { cityLabel, plainText } from '../lib/places.ts';
import { styleByKey } from '../lib/styles.ts';

/*
 * Artists: one record per performer, however each listing spells the name. The accent-free,
 * lower-case name is the identity; the first spelling seen is the one shown.
 */

export const artistKey = (name: string) => plainText(name);

const RESERVED_SLUGS = new Set(['style', 'city', 'en', 'radar']);

/** The artist records for these names, made when missing. Returns name key → id. */
export async function ensureArtists(q: Queryable, names: string[]): Promise<Map<string, string>> {
  const wanted = new Map<string, string>();
  for (const n of names) {
    const name = n.replace(/\s+/g, ' ').trim().slice(0, 120);
    const key = artistKey(name);
    if (key && !wanted.has(key)) wanted.set(key, name);
  }
  const out = new Map<string, string>();
  if (!wanted.size) return out;
  // Another name an artist goes by finds them too ("DJ Mie" for "Mie").
  const found = await many<{ id: string; normalized_name: string; alias_keys: string[] }>(q,
    'select id, normalized_name, alias_keys from artists where normalized_name = any($1::text[]) or alias_keys && $1::text[]', [[...wanted.keys()]]);
  for (const r of found) for (const k of [r.normalized_name, ...r.alias_keys]) if (wanted.has(k) && !out.has(k)) out.set(k, r.id);
  for (const [key, name] of wanted) {
    if (out.has(key)) continue;
    // /a/style/… and /a/city/… are directory pages, so no artist is called "style" or "city".
    const base = RESERVED_SLUGS.has(slugify(name)) ? `${slugify(name)}-artist` : slugify(name).slice(0, 70) || 'artist';
    let slug = base;
    for (let i = 2; await one(q, 'select 1 from artists where slug = $1', [slug]); i++) slug = `${base}-${i}`;
    const row = await one<{ id: string }>(q,
      `insert into artists (slug, name, normalized_name) values ($1,$2,$3)
       on conflict (normalized_name) do update set normalized_name = excluded.normalized_name returning id`, [slug, name, key]);
    out.set(key, row!.id);
  }
  return out;
}

/**
 * Links an event to the artists it lists, in its order. A link an artist or organiser already
 * confirmed keeps its confirmation; a name an artist said is not them is not linked to them again
 * for this event (lineup_disputes, migration 041).
 */
export async function syncEventArtists(q: Queryable, eventId: string, names: string[]): Promise<void> {
  const disputed = new Set((await many<{ normalized_name: string }>(q, 'select normalized_name from lineup_disputes where event_id = $1', [eventId])).map((d) => d.normalized_name));
  const wanted = names.filter((n) => !disputed.has(artistKey(n)));
  const ids = await ensureArtists(q, wanted);
  const keep: string[] = [];
  let sort = 0;
  for (const n of wanted) {
    const id = ids.get(artistKey(n));
    if (!id || keep.includes(id)) continue;
    keep.push(id);
    await q.query(
      `insert into event_artists (event_id, artist_id, sort) values ($1,$2,$3)
       on conflict (event_id, artist_id) do update set sort = excluded.sort`, [eventId, id, sort++]);
  }
  await q.query('delete from event_artists where event_id = $1 and not (artist_id = any($2::uuid[]))', [eventId, keep]);
}

/** Links every event made before artists had records of their own. Runs once, when there are none. */
export async function backfillArtists(q: Queryable): Promise<number> {
  const done = await one(q, 'select 1 from event_artists limit 1');
  if (done) return 0;
  const events = await many<{ id: string; artists: string[] }>(q, `select id, artists from events where cardinality(artists) > 0`);
  for (const e of events) await syncEventArtists(q, e.id, e.artists);
  return events.length;
}

/** Each listed name with its artist page, for an event's lineup; `confirmed` once the artist (or both sides) said so. */
export async function artistLinks(q: Queryable, eventId: string): Promise<{ name: string; slug: string; confirmed: boolean }[]> {
  return many<{ name: string; slug: string; confirmed: boolean }>(q,
    `select a.name, a.slug, ea.confirmed_at is not null as confirmed from event_artists ea join artists a on a.id = ea.artist_id where ea.event_id = $1 order by ea.sort`, [eventId]);
}

// ---- the directory -----------------------------------------------------------------------

/** An artist's streaming and social pages, in the order a profile shows them. */
export function presentLinks(a: { links?: Record<string, string> | null }): { kind: ArtistLink; label: Localized; url: string }[] {
  const links = a.links ?? {};
  return ARTIST_LINK.keys.filter((k) => links[k]).map((k) => ({ kind: k, label: ARTIST_LINK.label[k], url: links[k] }));
}

export const label = <K extends string>(l: { label: Record<K, Localized> }, k: K | null | undefined) => (k ? { key: k, label: l.label[k] } : null);
export const styleItem = (k: string) => ({ key: k, label: styleByKey(k)?.label ?? L(k, k), genre: styleByKey(k)?.genre ?? null });

export interface ArtistFilters {
  q?: string; role?: string[]; style?: string[]; city?: string; country?: string; booking?: string[]; travel?: string;
  gig?: string[]; gear?: string; brands?: boolean; verified?: boolean; upcoming?: boolean;
  /** 'owned' (the directory, the default): profiles an artist runs or the team verified. 'unclaimed': every other name a public event lists, from a lineup or from Radar. */
  kind?: 'owned' | 'unclaimed';
  sort?: 'next' | 'name' | 'active'; limit: number; offset: number;
}

/**
 * Where an artist's profile comes from: 'radar' when nobody runs or vouches for it (no owner, not
 * verified) and every event it plays was found by FeestFinder Radar; 'posted' otherwise. Reads the
 * `pl` counts of searchArtists.
 */
const ORIGIN = `(case when a.owner_user_id is not null or a.verified or coalesce(pl.posted, 0) > 0 or coalesce(pl.events, 0) = 0 then 'posted' else 'radar' end)`;

/**
 * What kind of profile an artist has (D13): 'owned' when the artist runs it (claimed or made it)
 * or the team verified it, and only those are listed in the directory and can be followed;
 * otherwise 'radar' when every event it plays was found by FeestFinder Radar, else 'unclaimed'
 * (a name an organiser typed into a lineup). Reads the `pl` counts of searchArtists.
 */
const KIND = `(case when a.owner_user_id is not null or a.verified then 'owned' when coalesce(pl.events, 0) > 0 and coalesce(pl.posted, 0) = 0 then 'radar' else 'unclaimed' end)`;
export type ArtistKind = 'owned' | 'unclaimed' | 'radar';

/** The same, for one artist. */
export async function artistKind(q: Queryable, a: { id: string; owner_user_id: string | null; verified: boolean }): Promise<ArtistKind> {
  if (a.owner_user_id || a.verified) return 'owned';
  return (await artistOrigin(q, a)) === 'radar' ? 'radar' : 'unclaimed';
}

/** The same, for one artist. */
export async function artistOrigin(q: Queryable, a: { id: string; owner_user_id: string | null; verified: boolean }): Promise<'posted' | 'radar'> {
  if (a.owner_user_id || a.verified) return 'posted';
  const r = await one<{ posted: number; events: number }>(q,
    `select count(*) filter (where e.origin = 'posted')::int as posted, count(*)::int as events
       from event_artists ea join events e on e.id = ea.event_id where ea.artist_id = $1 and ${PUBLIC}`, [a.id]);
  return r && r.events > 0 && r.posted === 0 ? 'radar' : 'posted';
}

/** How much of a profile is filled in, 0–6: it breaks ties in the directory, never follower counts. */
const COMPLETENESS = `((coalesce(a.bio->>'en', '') <> '' or coalesce(a.bio->>'vi', '') <> '')::int + (a.image_url is not null)::int
  + (cardinality(a.artist_roles) > 0)::int + (cardinality(a.styles) > 0)::int + (a.links <> '{}'::jsonb)::int + (a.based_city is not null)::int)`;

const LIVE = `e.status = 'live' and not e.held_for_reports and e.published_at is not null`;
/** A show counts on an artist's profile once confirmed when the artist runs it (someone could type a famous name into a lineup); on a profile nobody runs, every listing counts. */
export const SHOWN = `(ar.owner_user_id is null or ea.confirmed_at is not null)`;
const PUBLIC = `e.status in ('live', 'cancelled') and not e.held_for_reports and e.published_at is not null`;

function presentNextShow(raw: string | null) {
  if (!raw) return null;
  const [slug, title, startsOn, city] = raw.split('|');
  return { slug, title, startsOn, city: city || null, cityLabel: city ? cityLabel(city) : null };
}

/**
 * The directory: profiles an artist runs (or the team verified), under the filters; with
 * `kind: 'unclaimed'`, every other name a public event lists, each with where it came from.
 * Order: who plays soonest, then the fuller profile, then the name. Follower counts never
 * rank anyone, so a new name with a show next week comes before a famous one with none.
 */
export async function searchArtists(q: Queryable, f: ArtistFilters, now: Date) {
  const params: unknown[] = [now];
  const p = (v: unknown) => { params.push(v); return `$${params.length}`; };
  const owned = '(a.owner_user_id is not null or a.verified)';
  const where = [(f.kind ?? 'owned') === 'owned' ? owned : `(not ${owned} and coalesce(pl.events, 0) > 0)`];
  if (f.q) {
    const key = artistKey(f.q);
    where.push(`(a.normalized_name like ${p(`%${key}%`)} or ${p(key)} = any(a.alias_keys))`);
  }
  if (f.role?.length) where.push(`a.artist_roles && ${p(f.role)}::text[]`);
  if (f.style?.length) {
    const s = p(f.style);
    where.push(`(a.styles && ${s}::text[] or coalesce(pl.styles, '{}') && ${s}::text[])`);
  }
  if (f.city) {
    const c = p(f.city);
    where.push(`(a.based_city = ${c} or ${c} = any(coalesce(pl.cities, '{}')))`);
  }
  if (f.country) {
    const c = p(f.country);
    where.push(`(a.based_country = ${c} or exists (select 1 from cities ci where ci.slug = any(coalesce(pl.cities, '{}')) and ci.country_code = ${c}))`);
  }
  if (f.booking?.length) where.push(`a.booking_status = any(${p(f.booking)}::text[])`);
  // Wider travel includes narrower: asking for Southeast Asia finds Asia and worldwide too.
  if (f.travel) where.push(`a.travel_scope = any(${p(TRAVEL_ORDER.slice(TRAVEL_ORDER.indexOf(f.travel as TravelScope)))}::text[])`);
  if (f.gig?.length) where.push(`a.gig_types && ${p(f.gig)}::text[]`);
  if (f.gear) where.push(`exists (select 1 from artist_gear ag join gear_items g on g.id = ag.gear_id where ag.artist_id = a.id and g.approved and g.slug = ${p(f.gear)})`);
  if (f.brands) where.push('a.open_to_brands');
  if (f.verified) where.push('a.verified');
  if (f.upcoming) where.push('coalesce(up.upcoming, 0) > 0');
  // The kinds count under every other filter, so the directory can say how many names wait unclaimed.
  const base = [...params];
  const all = [...where.slice(1)];
  // The id last, so pages never overlap when two artists share a name.
  const order = (f.sort === 'name' ? 'a.name'
    : f.sort === 'active' ? `coalesce(pl.last_on, '0001-01-01') desc, a.name`
    : `up.next_at nulls last, ${COMPLETENESS} desc, a.name`) + ', a.id';
  const ctes = `with up as (
       select ea.artist_id, count(*)::int as upcoming, min(e.starts_at) as next_at,
              (array_agg(e.slug || '|' || e.title || '|' || e.starts_on || '|' || coalesce(e.city, '') order by e.starts_at))[1] as next_show
         from event_artists ea join events e on e.id = ea.event_id join artists ar on ar.id = ea.artist_id
        where ${LIVE} and e.ends_at >= $1 and ${SHOWN} group by ea.artist_id),
     pl as (
       select ea.artist_id, count(distinct e.id)::int as events, count(distinct e.id) filter (where e.origin = 'posted')::int as posted,
              max(e.starts_on) as last_on,
              coalesce(array_agg(distinct s) filter (where s is not null), '{}') as styles, coalesce(array_agg(distinct e.city) filter (where e.city is not null), '{}') as cities,
              (array_agg(e.slug || '|' || e.title order by e.starts_at desc))[1] as last_event
         from event_artists ea join events e on e.id = ea.event_id left join lateral unnest(e.styles) s on true
        where ${PUBLIC} group by ea.artist_id),
     -- The genre each artist has played most, which colours their card.
     gn as (
       select ea.artist_id, mode() within group (order by e.genre) as genre
         from event_artists ea join events e on e.id = ea.event_id where ${PUBLIC} and e.genre is not null group by ea.artist_id)`;
  const from = `from artists a left join up on up.artist_id = a.id left join pl on pl.artist_id = a.id left join gn on gn.artist_id = a.id`;
  const rows = await many<any>(q,
    `${ctes}
     select a.id, a.slug, a.name, a.image_url, a.artist_roles, a.based_city, a.based_country, a.styles, a.booking_status, a.travel_scope,
            a.verified, a.owner_user_id is not null as claimed, coalesce(up.upcoming, 0) as upcoming, up.next_show, coalesce(pl.events, 0) as events,
            coalesce(pl.styles, '{}') as played_styles, gn.genre, a.updated_at, ${ORIGIN} as origin, ${KIND} as kind, pl.last_event, count(*) over () as total
       ${from}
      where ${where.join(' and ')}
      order by ${order} limit ${p(f.limit)} offset ${p(f.offset)}`, params);
  const kinds = await many<{ kind: string; n: number }>(q, `${ctes} select ${KIND} as kind, count(*)::int as n ${from} where ${['(a.owner_user_id is not null or a.verified or coalesce(pl.events, 0) > 0)', ...all].join(' and ')} group by 1`, base);
  const total = rows[0] ? Number(rows[0].total) : 0;
  return {
    items: rows.map((a) => ({
      id: a.id as string, slug: a.slug as string, name: a.name as string, imageUrl: a.image_url as string | null,
      roles: (a.artist_roles as string[]).map((r) => label(ARTIST_ROLE, r as any)!),
      basedIn: a.based_city ? { city: a.based_city as string, label: cityLabel(a.based_city) } : null,
      styles: [...new Set<string>([...a.styles, ...a.played_styles])].slice(0, 4).map(styleItem),
      verified: a.verified as boolean, claimed: a.claimed as boolean,
      booking: label(BOOKING_STATUS, a.booking_status), travel: label(TRAVEL_SCOPE, a.travel_scope),
      upcoming: a.upcoming as number, events: a.events as number, nextShow: presentNextShow(a.next_show), genre: a.genre as string | null, updatedAt: a.updated_at as Date,
      origin: a.origin as 'posted' | 'radar',
      kind: a.kind as ArtistKind,
      // Where an unclaimed name was seen, for "Đây là tôi": the latest event that lists it.
      source: a.kind === 'owned' || !a.last_event ? null : { kind: a.kind === 'radar' ? 'radar' : 'lineup', event: { slug: String(a.last_event).split('|')[0], title: String(a.last_event).split('|').slice(1).join('|') } },
    })),
    total, offset: f.offset, limit: f.limit,
    kinds: { owned: kinds.find((k) => k.kind === 'owned')?.n ?? 0, unclaimed: kinds.find((k) => k.kind === 'unclaimed')?.n ?? 0, radar: kinds.find((k) => k.kind === 'radar')?.n ?? 0 },
    nextOffset: f.offset + rows.length < total ? f.offset + rows.length : null,
  };
}

// ---- follows of a profile (migration 041) ----------------------------------------------------

/** Links follows made by name to the record that name or alias belongs to. Idempotent; runs at boot. */
export async function backfillArtistFollows(q: Queryable): Promise<number> {
  const loose = await many<{ user_id: string; artist: string }>(q, 'select user_id, artist from artist_follows where artist_id is null');
  if (!loose.length) return 0;
  const keys = [...new Set(loose.map((f) => artistKey(f.artist)))];
  const found = await many<{ id: string; normalized_name: string; alias_keys: string[] }>(q,
    'select id, normalized_name, alias_keys from artists where normalized_name = any($1::text[]) or alias_keys && $1::text[]', [keys]);
  const byKey = new Map<string, string>();
  for (const r of found) for (const k of [r.normalized_name, ...r.alias_keys]) if (!byKey.has(k)) byKey.set(k, r.id);
  let n = 0;
  for (const f of loose) {
    const id = byKey.get(artistKey(f.artist));
    if (!id) continue;
    await q.query('update artist_follows set artist_id = $3 where user_id = $1 and artist = $2 and artist_id is null', [f.user_id, f.artist, id]);
    n++;
  }
  return n;
}

/**
 * When an artist takes over a profile: follows of its name join the profile, and people who
 * asked Smart Alerts for that name now follow it (the same wish, now that someone runs it).
 * Returns how many alerts became follows.
 */
export async function adoptNameFollows(q: Queryable, artistId: string): Promise<number> {
  const a = await one<{ name: string; aliases: string[]; normalized_name: string; alias_keys: string[] }>(q, 'select name, aliases, normalized_name, alias_keys from artists where id = $1', [artistId]);
  if (!a) return 0;
  const keys = new Set([a.normalized_name, ...a.alias_keys]);
  const names = await many<{ user_id: string; artist: string }>(q, 'select user_id, artist from artist_follows where artist_id is null');
  for (const f of names) if (keys.has(artistKey(f.artist))) await q.query('update artist_follows set artist_id = $3 where user_id = $1 and artist = $2', [f.user_id, f.artist, artistId]);
  const alerts = await many<{ user_id: string; artists: string[] }>(q, `select user_id, artists from smart_alerts where cardinality(artists) > 0`);
  let moved = 0;
  for (const al of alerts) {
    const hit = al.artists.filter((n) => keys.has(artistKey(n)));
    if (!hit.length) continue;
    await q.query('insert into artist_follows (user_id, artist, artist_id) values ($1,$2,$3) on conflict (user_id, artist) do update set artist_id = excluded.artist_id', [al.user_id, a.name, artistId]);
    await q.query('update smart_alerts set artists = $2 where user_id = $1', [al.user_id, al.artists.filter((n) => !keys.has(artistKey(n)))]);
    moved++;
  }
  return moved;
}
