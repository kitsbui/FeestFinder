import type { Ctx } from '../../context.ts';
import { json, many, one } from '../../db/index.ts';
import { tooMany } from '../../lib/errors.ts';
import { L } from '../../lib/i18n.ts';
import { cityBySlug } from '../../lib/places.ts';
import { refreshDerived } from '../events.ts';
import { refreshConfidence } from './confidence.ts';
import { finalize, hostOf } from './normalize.ts';
import { findSimilar, MATCH_RULES } from './resolve.ts';
import { conflictsWith, createCandidate, enrich, flagRisk, matchVenue } from './run.ts';
import { isRejection } from './types.ts';

/*
 * An artist says "I'm playing here". The report goes through the same matching as an import:
 *
 *   report → normalize → resolve → a source on the event already listed, or a new candidate
 *   in the review queue (held by the community organiser, status in_review)
 *
 * The artist's word is worth what a community submission is worth (authority "community"),
 * so it adds a source and some confidence but never publishes, and it fills in only what an
 * event nobody runs yet is missing. Whether they really are on an organiser's lineup is the
 * organiser's call: the report shows "not on the lineup yet" until they are.
 */

export const REPORT_PROVIDER = 'artist';
/** Reports one artist may send a day. */
export const REPORTS_PER_DAY = 10;

export interface GigReport {
  title: string;
  /** Local date and optional wall-clock time in the city's timezone. */
  startsOn: string;
  startTime: string | null;
  city: string;
  venueName: string;
  address: string | null;
  ticketUrl: string | null;
  eventUrl: string | null;
  /** Other names on the bill. */
  with: string[];
}

export type ReportOutcome =
  | { outcome: 'created' | 'merged'; reportId: string; event: { id: string; slug: string; title: string; status: string }; onLineup: boolean }
  | { outcome: 'rejected'; reportId: string; reason: string };

export async function reportGig(ctx: Ctx, artist: { id: string; name: string }, userId: string, r: GigReport): Promise<ReportOutcome> {
  const now = ctx.clock.now();
  const recent = await one<{ n: number }>(ctx.db,
    `select count(*)::int as n from artist_gig_reports where artist_id = $1 and created_at > $2`, [artist.id, new Date(now.getTime() - 86400_000)]);
  if ((recent?.n ?? 0) >= REPORTS_PER_DAY) throw tooMany('too_many_reports', L('That is a lot of gigs for one day. Try again tomorrow.', 'Bạn đã gửi nhiều lịch diễn trong hôm nay. Thử lại vào ngày mai.'));

  const city = cityBySlug(r.city)!;
  const n = finalize({
    title: r.title,
    start: r.startTime ? `${r.startsOn}T${r.startTime}` : r.startsOn,
    venueName: r.venueName,
    address: r.address,
    lineup: [artist.name, ...r.with],
    ticketUrl: r.ticketUrl,
    eventUrl: r.eventUrl,
  }, { now, fallbackCity: city.slug, wallClock: true });

  return ctx.db.tx(async (q) => {
    const record = async (outcome: string, eventId: string | null, score: number | null, reason: string | null, error: string | null) =>
      (await one<{ id: string }>(q,
        `insert into artist_gig_reports (artist_id, user_id, payload, outcome, event_id, match_score, match_reason, error, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
        [artist.id, userId, json(r), outcome, eventId, score, reason, error, now]))!.id;

    if (isRejection(n)) return { outcome: 'rejected' as const, reportId: await record('rejected', null, null, null, n.rejected), reason: n.rejected };
    // The city they picked stands, whatever the venue text resolves to.
    n.city = city.slug;

    const venue = await matchVenue(q, n);
    const match = await findSimilar(q, {
      title: n.title, startsOn: n.startsOn, startTime: n.startTime, city: n.city, venueId: venue?.id ?? null,
      venueName: venue?.name ?? n.venueName, lat: venue?.lat ?? null, lng: venue?.lng ?? null, lineup: n.lineup,
    });
    let eventId: string;
    let outcome: 'created' | 'merged';
    if (match && match.score >= MATCH_RULES.mergeAt) {
      eventId = match.eventId;
      outcome = 'merged';
      await enrich(q, eventId, n, now);
    } else {
      eventId = await createCandidate(q, { name: `${artist.name} (artist report)`, url: null }, n, venue, match, now);
      outcome = 'created';
    }
    const reportId = await record(outcome, eventId, match?.score ?? null, match?.reason ?? null, null);
    const url = n.eventUrl ?? n.ticketUrl;
    const conflicts = outcome === 'merged' ? await conflictsWith(q, eventId, n) : [];
    await q.query(
      `insert into event_sources (event_id, provider, authority, external_id, source_url, source_host, provider_confidence,
                                  match_score, match_reason, conflicts, first_seen_at, last_seen_at, added_by)
       values ($1,$2,'community',$3,$4,$5,40,$6,$7,$8,$9,$9,$10)`,
      [eventId, REPORT_PROVIDER, `report:${reportId}`, url, hostOf(url), outcome === 'merged' ? match!.score : null,
        outcome === 'merged' ? match!.reason : null, json(conflicts), now, userId]);
    // After the source is on: a candidate with an outside source gets no "added by the team" line.
    if (outcome === 'created') {
      await refreshDerived(q, eventId, now);
      await flagRisk(q, eventId, match, now);
    }
    const ev = (await one<{ id: string; slug: string; title: string; status: string }>(q, 'select id, slug, title, status from events where id = $1', [eventId]))!;
    const onLineup = !!(await one(q, 'select 1 from event_artists where event_id = $1 and artist_id = $2', [eventId, artist.id]));
    return { outcome, reportId, event: ev, onLineup };
  }).then(async (out) => {
    if (out.outcome !== 'rejected') await refreshConfidence(ctx.db, now, [out.event.id]);
    return out;
  });
}

/** An artist's reports, newest first, with where each one stands now. */
export async function reportsOf(ctx: Ctx, artistId: string) {
  const rows = await many<any>(ctx.db,
    `select r.*, e.slug, e.title as event_title, e.status as event_status, e.starts_on::text as starts_on,
            exists (select 1 from event_artists ea where ea.event_id = r.event_id and ea.artist_id = r.artist_id) as on_lineup
       from artist_gig_reports r left join events e on e.id = r.event_id
      where r.artist_id = $1 order by r.created_at desc limit 100`, [artistId]);
  return rows.map((r) => ({
    id: r.id, outcome: r.outcome, createdAt: r.created_at, error: r.error, report: r.payload,
    event: r.event_id ? { id: r.event_id, slug: r.slug, title: r.event_title, status: r.event_status, startsOn: r.starts_on } : null,
    onLineup: r.on_lineup,
  }));
}
