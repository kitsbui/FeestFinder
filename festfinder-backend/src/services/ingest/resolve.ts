import type { Queryable } from '../../db/index.ts';
import { many, one } from '../../db/index.ts';
import { haversineKm } from '../../lib/geo.ts';
import { plainText } from '../../lib/places.ts';
import { addDays, toMinutes } from '../../lib/time.ts';

/*
 * Is this the same event as one already in the catalogue? Exact provenance first (the same
 * provider's id, or the same page), then a deterministic score. No AI: every match can be
 * explained by its reason, e.g. "title+venue+date".
 */

export const MATCH_RULES = {
  titleSame: 30,
  titleClose: 20,
  venue: 25,
  date: 25,
  timeWithin2h: 10,
  artist: 10,
  within500m: 10,
  /** At or above: the same event. */
  mergeAt: 70,
  /** At or above (and below mergeAt): a candidate the moderator should compare. */
  possibleAt: 45,
};

/** Words that say nothing about which event it is. */
const STOP = new Set([
  'the', 'a', 'an', 'and', 'of', 'at', 'in', 'on', 'with', 'by', 'for', 'feat', 'ft', 'x', 'vs', 'b2b', 'live', 'presents', 'present', 'pres',
  'tour', 'night', 'party', 'event', 'show', 'official', 'tickets', 'ticket', 'vol', 'edition',
  'dem', 'tai', 'cung', 've', 'su', 'kien', 'chuong', 'trinh', 'le', 'hoi',
  '2024', '2025', '2026', '2027', '2028',
]);

export function titleWords(s: string): string[] {
  return plainText(s).split(' ').filter((w) => w && !STOP.has(w));
}

/** 1 when the titles say the same thing, 0 when they share nothing. */
export function titleLikeness(a: string, b: string): number {
  const A = new Set(titleWords(a));
  const B = new Set(titleWords(b));
  if (!A.size || !B.size) return 0;
  let common = 0;
  for (const w of A) if (B.has(w)) common++;
  const shorter = Math.min(A.size, B.size);
  // One title inside the other ("Boiler Room Bangkok" in "Boiler Room Bangkok: Sara Landry").
  if (common === shorter) return shorter >= 2 ? 1 : 0.7;
  return common / Math.max(A.size, B.size);
}

/** Venue names match when most of their longer words do: "THE WAREHOUSE BKK" and "The Warehouse". */
export function venueLikeness(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b) return 0;
  const words = (s: string) => new Set(plainText(s).split(' ').filter((w) => (w.length >= 3 || /^\d+$/.test(w)) && !['the', 'club', 'bar', 'bkk', 'hcm', 'sgn'].includes(w)));
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return 0;
  let common = 0;
  for (const w of A) if (B.has(w)) common++;
  return common / Math.min(A.size, B.size);
}

export interface Probe {
  title: string;
  startsOn: string;
  startTime: string | null;
  city: string;
  venueId?: string | null;
  venueName: string | null;
  lat: number | null;
  lng: number | null;
  lineup: string[];
}

export interface Candidate {
  id: string;
  title: string;
  starts_on: string;
  start_time: string | null;
  venue_id: string | null;
  venue_name: string | null;
  lat: number | null;
  lng: number | null;
  lineup: string[] | null;
  artists: string[] | null;
  status: string;
}

export interface Scored { score: number; reasons: string[] }

export function scoreMatch(p: Probe, c: Candidate): Scored {
  const R = MATCH_RULES;
  const reasons: string[] = [];
  let score = 0;
  const t = titleLikeness(p.title, c.title);
  if (t >= 0.95) { score += R.titleSame; reasons.push('title'); } else if (t >= 0.6) { score += R.titleClose; reasons.push('title~'); }
  if ((p.venueId && p.venueId === c.venue_id) || venueLikeness(p.venueName, c.venue_name) >= 0.75) { score += R.venue; reasons.push('venue'); }
  if (p.startsOn === c.starts_on) { score += R.date; reasons.push('date'); }
  if (p.startTime && c.start_time) {
    const d = Math.abs(toMinutes(p.startTime) - toMinutes(c.start_time));
    if (Math.min(d, 1440 - d) <= 120) { score += R.timeWithin2h; reasons.push('time'); }
  }
  const mine = new Set(p.lineup.map((a) => plainText(a)).filter(Boolean));
  if ([...(c.lineup ?? []), ...(c.artists ?? [])].some((a) => mine.has(plainText(a)))) { score += R.artist; reasons.push('artist'); }
  if (p.lat !== null && p.lng !== null && c.lat !== null && c.lng !== null && haversineKm(p.lat, p.lng, c.lat, c.lng) <= 0.5) { score += R.within500m; reasons.push('geo'); }
  return { score, reasons };
}

export interface Match { eventId: string; title: string; score: number; reason: string; exact: boolean }

/** The event a record is already attached to: same provider id, or the same page. */
export async function findExact(q: Queryable, provider: string, externalId: string, urls: (string | null)[]): Promise<Match | null> {
  const byId = await one<{ event_id: string; title: string }>(q,
    `select s.event_id, e.title from event_sources s join events e on e.id = s.event_id where s.provider = $1 and s.external_id = $2`, [provider, externalId]);
  if (byId) return { eventId: byId.event_id, title: byId.title, score: 100, reason: 'same_record', exact: true };
  const pages = urls.filter((u): u is string => !!u);
  if (!pages.length) return null;
  const byUrl = await one<{ id: string; title: string }>(q,
    `select e.id, e.title from events e
      where e.status not in ('removed') and (e.event_url = any($1::text[])
         or exists (select 1 from event_sources s where s.event_id = e.id and s.source_url = any($1::text[])))
      order by e.created_at limit 1`, [pages]);
  return byUrl ? { eventId: byUrl.id, title: byUrl.title, score: 100, reason: 'same_page', exact: true } : null;
}

/** The best fuzzy match among events in the same city a day either side, or null below possibleAt. */
export async function findSimilar(q: Queryable, p: Probe, opts: { excludeId?: string } = {}): Promise<Match | null> {
  const rows = await many<Candidate>(q,
    `select id, title, starts_on::text as starts_on, start_time, venue_id, venue_name, lat, lng, lineup, artists, status
       from events
      where city = $1 and starts_on between $2 and $3 and status in ('live', 'in_review', 'cancelled')
        and ($4::uuid is null or id <> $4)`,
    [p.city, addDays(p.startsOn, -1), addDays(p.startsOn, 1), opts.excludeId ?? null]);
  let best: Match | null = null;
  for (const c of rows) {
    const s = scoreMatch(p, c);
    if (s.score >= MATCH_RULES.possibleAt && (!best || s.score > best.score)) {
      best = { eventId: c.id, title: c.title, score: s.score, reason: s.reasons.join('+'), exact: false };
    }
  }
  return best;
}
