import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { cityBySlug } from '../lib/places.ts';
import { TRAVEL_ORDER, type TravelScope } from '../lib/network.ts';

/*
 * How well an artist fits a gig, out of 100, from fixed rules over what both sides wrote. It
 * helps an organiser sort applications and an artist find slots; it decides nothing. Follower
 * counts play no part, so a new name that fits beats a famous one that does not.
 */

export const MATCH_WEIGHTS = { styles: 35, place: 25, gigType: 15, availability: 15, booking: 10 } as const;

const SOUTHEAST_ASIA = new Set(['VN', 'TH', 'SG', 'ID', 'MY', 'PH', 'KH', 'LA', 'MM', 'BN', 'TL']);

export interface MatchArtist {
  styles: string[];
  based_city: string | null;
  based_country: string | null;
  travel_scope: TravelScope | null;
  gig_types: string[];
  booking_status: string | null;
}
export interface MatchGig { city: string; starts_on: string; styles: string[]; gig_type: string | null }
export interface Window { from_on: string; to_on: string; kind: 'available' | 'unavailable'; city: string | null }

export interface Match { score: number; because: Record<keyof typeof MATCH_WEIGHTS, number>; unavailable: boolean }

const reaches = (scope: TravelScope | null, wanted: TravelScope) => !!scope && TRAVEL_ORDER.indexOf(scope) >= TRAVEL_ORDER.indexOf(wanted);

export function matchScore(a: MatchArtist, g: MatchGig, windows: Window[]): Match {
  const W = MATCH_WEIGHTS;
  const shared = g.styles.filter((s) => a.styles.includes(s)).length;
  const styles = g.styles.length ? Math.round((W.styles * shared) / g.styles.length) : Math.round(W.styles * 0.6);

  const city = cityBySlug(g.city);
  const country = city?.countryCode ?? null;
  const place = a.based_city === g.city ? W.place
    : country && a.based_country === country && reaches(a.travel_scope, 'domestic') ? 20
    : country && SOUTHEAST_ASIA.has(country) && a.based_country && SOUTHEAST_ASIA.has(a.based_country) && reaches(a.travel_scope, 'southeast_asia') ? 15
    : reaches(a.travel_scope, 'asia') ? 12
    : 0;

  const gigType = !g.gig_type ? Math.round(W.gigType * 0.6) : a.gig_types.includes(g.gig_type) ? W.gigType : a.gig_types.length ? 0 : Math.round(W.gigType * 0.4);

  const on = (w: Window) => w.from_on <= g.starts_on && w.to_on >= g.starts_on;
  const unavailable = windows.some((w) => w.kind === 'unavailable' && on(w));
  const available = windows.some((w) => w.kind === 'available' && on(w) && (!w.city || w.city === g.city));
  const availability = unavailable ? 0 : available ? W.availability : Math.round(W.availability / 2);

  const booking = { available: W.booking, limited: 6, touring: 4, unavailable: 0 }[a.booking_status ?? ''] ?? 5;

  const because = { styles, place, gigType, availability, booking };
  return { score: Object.values(because).reduce((x, y) => x + y, 0), because, unavailable };
}

export async function artistForMatch(q: Queryable, artistId: string) {
  const a = await one<MatchArtist & { id: string; name: string; slug: string }>(q,
    `select a.id, a.name, a.slug, a.based_city, a.based_country, a.travel_scope, a.gig_types, a.booking_status,
            a.styles || coalesce((select array_agg(distinct s) from event_artists ea join events e on e.id = ea.event_id, unnest(e.styles) s
                                   where ea.artist_id = a.id and e.status = 'live'), '{}') as styles
       from artists a where a.id = $1`, [artistId]);
  const windows = await many<Window>(q, `select from_on::text, to_on::text, kind, city from artist_availability where artist_id = $1`, [artistId]);
  return a ? { artist: a, windows } : null;
}
