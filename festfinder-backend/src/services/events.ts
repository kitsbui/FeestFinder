import type { Queryable } from '../db/index.ts';
import { one } from '../db/index.ts';
import { searchNormalize } from '../lib/contact.ts';
import { cityOf } from '../lib/places.ts';
import { addDays, atZone, eventBounds } from '../lib/time.ts';
import { qualityScore, type DraftFacts } from './quality.ts';
import { syncEventArtists } from './artists.ts';
import { refreshConfidence } from './ingest/confidence.ts';
import { hostOf } from './ingest/normalize.ts';

export function draftFacts(ev: any): DraftFacts {
  return {
    title: ev.title ?? '', genre: ev.genre, description: ev.description ?? { en: '', vi: '' },
    logoUrl: ev.logo_url, coverUrl: ev.cover_url, venueResolved: !!ev.venue_id || (ev.lat !== null && ev.lng !== null),
    entryMode: ev.entry_mode, priceFrom: ev.price_from, ticketUrl: ev.ticket_url, lineup: ev.lineup ?? [], eventUrl: ev.event_url,
  };
}

/**
 * When an event starts and ends. Imported events often lack an end time (or both times):
 * the instants then cover the whole day, through 06:00 the next morning, so the event stays
 * listed through its night. The wall-clock fields stay empty for a moderator to fill in.
 */
export function instantsOf(ev: { starts_on: string | null; ends_on: string | null; start_time: string | null; end_time: string | null }, timezone: string) {
  if (!ev.starts_on) return null;
  const endsOn = ev.ends_on ?? ev.starts_on;
  if (ev.start_time && ev.end_time) return eventBounds(ev.starts_on, endsOn, ev.start_time, ev.end_time, timezone);
  return {
    startsAt: atZone(ev.starts_on, ev.start_time ?? '00:00', timezone),
    endsAt: ev.end_time ? atZone(endsOn, ev.end_time, timezone) : atZone(addDays(endsOn, 1), '06:00', timezone),
  };
}

/**
 * Recomputes the columns derived from what an organiser typed: instants, search text,
 * quality score, and how sure we are of the event. Whoever saved it (its organiser, the
 * community member who sent it, the team) has just confirmed it, so its own source is seen now.
 */
export async function refreshDerived(q: Queryable, id: string, now = new Date()): Promise<void> {
  const ev = await one<any>(q, 'select * from events where id = $1', [id]);
  if (!ev) return;
  // Wall-clock times are the event city's; prices are in its currency.
  const city = cityOf(ev.city);
  const bounds = instantsOf(ev, city.timezone);
  const search = searchNormalize([ev.title, ev.venue_name, ev.area, ev.genre, ...(ev.styles ?? []), ...(ev.artists ?? [])].filter(Boolean).join(' '));
  await q.query(
    `update events set starts_at = $2, ends_at = $3, search_text = $4, quality_score = $5, currency = $6, updated_at = now() where id = $1`,
    [id, bounds?.startsAt ?? null, bounds?.endsAt ?? null, search, qualityScore(draftFacts(ev)).score, city.currency]);
  await syncEventArtists(q, id, ev.artists ?? []);
  await ensureOrigin(q, ev, now);
  await refreshConfidence(q, now, [id]);
}

/**
 * The event's own row in event_sources: where it came from inside FeestFinder. Made for
 * events created after migration 016, and kept current as the event is edited.
 */
export async function ensureOrigin(q: Queryable, ev: any, now: Date): Promise<void> {
  const org = await one<{ is_community: boolean; verification_state: string }>(q, 'select is_community, verification_state from organizers where id = $1', [ev.organizer_id]);
  // A claimed community event belongs to its organiser now; the community row stays as history.
  const provider = !org?.is_community ? 'organizer' : ev.submitted_by ? 'community' : 'team';
  const authority = provider === 'community' ? 'community' : provider === 'organizer' && org?.verification_state === 'verified' ? 'official' : 'listing';
  const url = ev.event_url || null;
  // An imported event's origin is its outside source, already recorded.
  if (provider === 'team' && (await one(q, `select 1 from event_sources where event_id = $1 and provider not in ('organizer', 'community', 'team')`, [ev.id]))) return;
  await q.query(
    `insert into event_sources (event_id, provider, authority, source_url, source_host, provider_confidence, first_seen_at, last_seen_at, published_at, added_by)
     values ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9)
     on conflict (event_id, provider) where provider in ('organizer', 'community', 'team')
     do update set authority = excluded.authority, source_url = excluded.source_url, source_host = excluded.source_host,
                   provider_confidence = excluded.provider_confidence, last_seen_at = excluded.last_seen_at`,
    [ev.id, provider, authority, url, hostOf(url), authority === 'official' ? 90 : authority === 'community' ? 40 : 60, now, ev.published_at, ev.submitted_by]);
}
