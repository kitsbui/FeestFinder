import type { Queryable } from '../../db/index.ts';
import { json, one } from '../../db/index.ts';
import { slugify } from '../../lib/contact.ts';
import { randomCode } from '../../lib/crypto.ts';
import { haversineKm } from '../../lib/geo.ts';
import { L } from '../../lib/i18n.ts';
import { appendAudit } from '../audit.ts';
import { placeholderOrganizerId, type Placeholder } from '../community.ts';
import { refreshDerived } from '../events.ts';
import { assessRisk } from '../risk.ts';
import { venueLikeness, type Match } from './resolve.ts';
import type { IngestSource, NormalizedEvent } from './types.ts';

/** Facts the source states differently from the event: they cost confidence and tell the moderator to look. */
export async function conflictsWith(q: Queryable, eventId: string, n: NormalizedEvent) {
  const ev = await one<any>(q, 'select starts_on::text as starts_on, venue_name, lat, lng from events where id = $1', [eventId]);
  const out: { field: string; source: string; event: string }[] = [];
  if (!ev) return out;
  if (ev.starts_on && ev.starts_on !== n.startsOn) out.push({ field: 'starts_on', source: n.startsOn, event: ev.starts_on });
  const far = n.lat !== null && n.lng !== null && ev.lat !== null && ev.lng !== null ? haversineKm(n.lat, n.lng, ev.lat, ev.lng) > 1 : null;
  if (n.venueName && ev.venue_name && venueLikeness(n.venueName, ev.venue_name) < 0.34 && far !== false) {
    out.push({ field: 'venue', source: n.venueName, event: ev.venue_name });
  }
  return out;
}

/**
 * Fills what the event is missing from what the source says. Never overwrites: an organiser's
 * or moderator's words stand, and a disagreement is recorded as a conflict instead.
 */
export async function enrich(q: Queryable, eventId: string, n: NormalizedEvent, now: Date, fromOrganizer: string | null = null) {
  const ev = await one<any>(q, `select e.*, o.is_community from events e join organizers o on o.id = e.organizer_id where e.id = $1`, [eventId]);
  if (!ev) return;
  const set: Record<string, unknown> = {};
  if (!(ev.styles ?? []).length && n.styles.length) set.styles = n.styles;
  if (!ev.event_type && n.eventType) set.event_type = n.eventType;
  if (!ev.genre && n.genre) set.genre = n.genre;
  // Events nobody runs yet (community and imported ones) also take the source's pictures, lineup and pin,
  // and so does an organiser's event from their own calendar. Times, title and price never change here.
  if (ev.is_community || (fromOrganizer && ev.organizer_id === fromOrganizer)) {
    if (!ev.cover_url && n.imageUrl) set.cover_url = n.imageUrl;
    if (!(ev.lineup ?? []).length && n.lineup.length) { set.lineup = n.lineup; set.artists = n.lineup; }
    if (ev.lat === null && !ev.venue_id && n.lat !== null && n.lng !== null) { set.lat = n.lat; set.lng = n.lng; }
    if (!ev.ticket_url && n.ticketUrl) { set.ticket_url = n.ticketUrl; set.ticket_link_status = 'unchecked'; }
    if (!ev.end_time && n.endTime) set.end_time = n.endTime;
  }
  const keys = Object.keys(set);
  if (!keys.length) return;
  await q.query(`update events set ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')} where id = $1`, [eventId, ...keys.map((k) => set[k])]);
  await refreshDerived(q, eventId, now);
}

/**
 * Find a matching venue in the event's city. Matches by name likeness (75%+) or proximity (< 150m).
 */
export async function matchVenue(q: Queryable, n: { city: string; venueName: string | null; lat: number | null; lng: number | null }) {
  if (!n.venueName && n.lat === null) return null;
  const venues = await q.query('select id, name, aliases, address, area, lat, lng, verified from venues where city = $1', [n.city]).then((r: any) => r.rows);
  let best: { v: any; score: number } | null = null;
  for (const v of venues) {
    const names = [v.name, ...(v.aliases ?? [])];
    const like = Math.max(...names.map((x: string) => venueLikeness(n.venueName, x)));
    const near = n.lat !== null && n.lng !== null ? haversineKm(n.lat, n.lng, v.lat, v.lng) <= 0.15 : false;
    const score = like >= 0.75 ? like + (near ? 0.5 : 0) : near && like >= 0.4 ? 0.8 : 0;
    if (score > 0 && (!best || score > best.score)) best = { v, score };
  }
  return best?.v ?? null;
}

/**
 * A new event in the review queue, held until someone claims it: by the community organiser when
 * a person reported it (an artist's gig report or other submission).
 */
export async function createCandidate(q: Queryable, source: Pick<IngestSource, 'name' | 'url'>, n: NormalizedEvent, venue: any, match: Match | null, now: Date, holder: Placeholder = 'radar', organizer: string | null = null): Promise<string> {
  const organizerId = organizer ?? await placeholderOrganizerId(q, holder);
  const slug = `${slugify(n.title) || 'event'}-${randomCode(4).toLowerCase()}`;
  const paid = !n.free;
  const row = await one<{ id: string }>(q,
    `insert into events (slug, organizer_id, title, genre, description, city, venue_id, venue_name, address, area, lat, lng,
                         starts_on, ends_on, start_time, end_time, entry_mode, price_from, ticket_url, event_url, lineup, artists,
                         cover_url, styles, event_type, status, submitted_at, ticket_link_status, first_seen_at, created_at, festival)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$21,$22,$23,$24,'in_review',$25,$26,$25,$25,$27)
     returning id`,
    [slug, organizerId, n.title, n.genre, json({ en: n.description ?? '', vi: n.description ?? '' }), n.city,
      venue?.id ?? null, venue?.name ?? n.venueName, venue?.address ?? n.address, venue?.area ?? n.area,
      venue?.lat ?? n.lat, venue?.lng ?? n.lng, n.startsOn, n.endsOn, n.startTime, n.endTime,
      paid ? 'paid' : 'free', paid ? n.priceFrom ?? 0 : 0, n.ticketUrl, n.eventUrl, n.lineup,
      n.imageUrl, n.styles, n.eventType, now, n.ticketUrl ? 'unchecked' : null, n.festival]);
  await appendAudit(q, {
    at: now, actorType: 'system', actorId: null, actorLabel: `Report · ${source.name}`, action: 'listing.imported',
    targetType: 'event', targetId: row!.id, targetLabel: n.title,
    diff: [{ f: 'status', a: '—', b: 'in_review' }, { f: 'source', a: '—', b: n.eventUrl ?? source.url ?? source.name },
      ...(match ? [{ f: 'possible_duplicate', a: '—', b: `${match.title} (${match.score}: ${match.reason})` }] : [])],
  });
  return row!.id;
}

/** The moderator's advice for an imported candidate, with a possible duplicate first. */
export async function flagRisk(q: Queryable, eventId: string, match: Match | null, now: Date) {
  const risk = await assessRisk(q, eventId, now);
  const dup = match ? [{ ok: false, label: L(`Maybe a duplicate of "${match.title}" (${match.reason})`, `Có thể trùng "${match.title}" (${match.reason})`) }] : [];
  const ev = await one<{ entry_mode: string; price_from: number; genre: string | null }>(q, 'select entry_mode, price_from, genre from events where id = $1', [eventId]);
  if (ev && !ev.genre) dup.push({ ok: false, label: L('No EDM style in the source', 'Nguồn không ghi dòng nhạc EDM') });
  if (ev && ev.entry_mode === 'paid' && !ev.price_from) dup.push({ ok: false, label: L('The source gives no ticket price', 'Nguồn không ghi giá vé') });
  await q.query('update events set risk_score = $2, risk_factors = $3, signals = $4, flag = $5 where id = $1',
    [eventId, risk.score, json(risk.factors), json([...dup, ...risk.signals].slice(0, 3)), match ? 'duplicate' : risk.flag]);
}
