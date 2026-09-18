import type { Queryable } from '../db/index.ts';
import { one } from '../db/index.ts';
import { searchNormalize } from '../lib/contact.ts';
import { eventBounds } from '../lib/time.ts';
import { qualityScore, type DraftFacts } from './quality.ts';

export function draftFacts(ev: any): DraftFacts {
  return {
    title: ev.title ?? '', genre: ev.genre, description: ev.description ?? { en: '', vi: '' },
    logoUrl: ev.logo_url, coverUrl: ev.cover_url, venueResolved: !!ev.venue_id || (ev.lat !== null && ev.lng !== null),
    entryMode: ev.entry_mode, priceFrom: ev.price_from, ticketUrl: ev.ticket_url, lineup: ev.lineup ?? [], eventUrl: ev.event_url,
  };
}

/** Recomputes the columns derived from what an organiser typed: instants, search text, quality score. */
export async function refreshDerived(q: Queryable, id: string): Promise<void> {
  const ev = await one<any>(q, 'select * from events where id = $1', [id]);
  if (!ev) return;
  const bounds = ev.starts_on && ev.start_time && ev.end_time ? eventBounds(ev.starts_on, ev.ends_on ?? ev.starts_on, ev.start_time, ev.end_time) : null;
  const search = searchNormalize([ev.title, ev.venue_name, ev.area, ev.genre, ...(ev.artists ?? [])].filter(Boolean).join(' '));
  await q.query(
    `update events set starts_at = $2, ends_at = $3, search_text = $4, quality_score = $5, updated_at = now() where id = $1`,
    [id, bounds?.startsAt ?? null, bounds?.endsAt ?? null, search, qualityScore(draftFacts(ev)).score]);
}
