/**
 * What /about and /advertise say about the site's reach, read from the API on the server:
 * the listed cities (/meta/discovery, from lib/places.ts) with their upcoming events, and the
 * number of upcoming events. Null when the API does not answer: the sections then hide.
 */
import { apiOr } from '@/lib/api';
import type { Pair } from '../../copy';

export interface ReachCity { slug: string; name: Pair; n: number }
export interface Reach { events: number; cities: ReachCity[]; withEvents: number }

type Meta = { cities: { slug: string; name: Pair }[] };
type Feed = { total: number; facets?: { city?: Record<string, number> } };

export async function loadReach(): Promise<Reach | null> {
  const [meta, feed] = await Promise.all([
    apiOr<Meta | null>('/meta/discovery', null, { revalidate: 300 }),
    apiOr<Feed | null>('/events?time=all&upcoming=1&limit=1', null, { revalidate: 300 }),
  ]);
  if (!meta || !feed) return null;
  const perCity = feed.facets?.city ?? {};
  const cities = meta.cities.map((c) => ({ slug: c.slug, name: c.name, n: perCity[c.slug] ?? 0 }));
  return { events: feed.total ?? 0, cities, withEvents: cities.filter((c) => c.n > 0).length };
}
