import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { slugify } from '../lib/contact.ts';
import { plainText } from '../lib/places.ts';

/*
 * Artists: one record per performer, however each listing spells the name. The accent-free,
 * lower-case name is the identity; the first spelling seen is the one shown.
 */

export const artistKey = (name: string) => plainText(name);

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
  const found = await many<{ id: string; normalized_name: string }>(q,
    'select id, normalized_name from artists where normalized_name = any($1::text[])', [[...wanted.keys()]]);
  for (const r of found) out.set(r.normalized_name, r.id);
  for (const [key, name] of wanted) {
    if (out.has(key)) continue;
    const base = slugify(name).slice(0, 70) || 'artist';
    let slug = base;
    for (let i = 2; await one(q, 'select 1 from artists where slug = $1', [slug]); i++) slug = `${base}-${i}`;
    const row = await one<{ id: string }>(q,
      `insert into artists (slug, name, normalized_name) values ($1,$2,$3)
       on conflict (normalized_name) do update set normalized_name = excluded.normalized_name returning id`, [slug, name, key]);
    out.set(key, row!.id);
  }
  return out;
}

/** Links an event to the artists it lists, in its order. */
export async function syncEventArtists(q: Queryable, eventId: string, names: string[]): Promise<void> {
  const ids = await ensureArtists(q, names);
  await q.query('delete from event_artists where event_id = $1', [eventId]);
  const seen = new Set<string>();
  let sort = 0;
  for (const n of names) {
    const id = ids.get(artistKey(n));
    if (!id || seen.has(id)) continue;
    seen.add(id);
    await q.query('insert into event_artists (event_id, artist_id, sort) values ($1,$2,$3)', [eventId, id, sort++]);
  }
}

/** Links every event made before artists had records of their own. Runs once, when there are none. */
export async function backfillArtists(q: Queryable): Promise<number> {
  const done = await one(q, 'select 1 from event_artists limit 1');
  if (done) return 0;
  const events = await many<{ id: string; artists: string[] }>(q, `select id, artists from events where cardinality(artists) > 0`);
  for (const e of events) await syncEventArtists(q, e.id, e.artists);
  return events.length;
}

/** Each listed name with its artist page, for an event's lineup. */
export async function artistLinks(q: Queryable, eventId: string): Promise<{ name: string; slug: string }[]> {
  return many<{ name: string; slug: string }>(q,
    `select a.name, a.slug from event_artists ea join artists a on a.id = ea.artist_id where ea.event_id = $1 order by ea.sort`, [eventId]);
}
