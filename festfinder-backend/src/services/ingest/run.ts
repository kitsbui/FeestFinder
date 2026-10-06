import type { Ctx } from '../../context.ts';
import type { Queryable } from '../../db/index.ts';
import { json, many, one } from '../../db/index.ts';
import { slugify } from '../../lib/contact.ts';
import { randomCode, sha256 } from '../../lib/crypto.ts';
import { haversineKm } from '../../lib/geo.ts';
import { L } from '../../lib/i18n.ts';
import { appendAudit } from '../audit.ts';
import { communityOrganizerId } from '../community.ts';
import { refreshDerived } from '../events.ts';
import { assessRisk } from '../risk.ts';
import { refreshConfidence } from './confidence.ts';
import { politeIO } from './fetch.ts';
import { hostOf } from './normalize.ts';
import { EVENT_TYPES } from '../../lib/styles.ts';
import { ADAPTERS, PROVIDER_CONFIDENCE } from './providers.ts';
import { findExact, findSimilar, MATCH_RULES, venueLikeness, type Match } from './resolve.ts';
import { isRejection, type IngestIO, type IngestSource, type NormalizedEvent, type RawRecord } from './types.ts';

/*
 * One run of one source:
 *
 *   discover → raw_events (as sent) → normalize → resolve → merge into an event, or a new
 *   candidate in the review queue → event_sources → confidence → ingest_runs
 *
 * Running it twice changes nothing the second time: records are keyed by (source, external
 * id), an unchanged record only refreshes "last seen", and a record already attached to an
 * event, even one a moderator rejected, always finds that event again. Nothing here
 * publishes: new events wait for a moderator like any community submission.
 */

export interface RunSummary {
  sourceId: string;
  name: string;
  fetched: number;
  parsed: number;
  rejected: number;
  created: number;
  merged: number;
  unchanged: number;
  failed: number;
  errors: string[];
  notModified: boolean;
  ms: number;
}

const MAX_PAYLOAD = 100_000;

/** A stable hash of a record: the same JSON in any key order. */
function stableHash(v: unknown): string {
  const norm = (x: any): any => (Array.isArray(x) ? x.map(norm) : x && typeof x === 'object'
    ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, norm(x[k])])) : x);
  return sha256(JSON.stringify(norm(v)));
}

export function ioFor(ctx: Ctx): IngestIO {
  return ctx.ingestIO?.() ?? politeIO(ctx.clock.now(), { secrets: { ticketmasterKey: process.env.TICKETMASTER_API_KEY } });
}

/** Sources due now, run one after another until the time budget is spent. */
export async function runDueSources(ctx: Ctx, opts: { budgetMs?: number; io?: IngestIO } = {}): Promise<RunSummary[]> {
  const started = Date.now();
  const budget = opts.budgetMs ?? 40_000;
  const due = await many<{ id: string }>(ctx.db,
    `select id from ingest_sources where enabled and next_run_at <= $1 order by next_run_at limit 10`, [ctx.clock.now()]);
  const out: RunSummary[] = [];
  for (const s of due) {
    const left = budget - (Date.now() - started);
    if (left < 5_000) break;
    out.push(await runSource(ctx, s.id, { io: opts.io, deadline: Date.now() + left }));
  }
  return out;
}

export async function runSource(ctx: Ctx, sourceId: string, opts: { io?: IngestIO; trigger?: 'schedule' | 'manual'; deadline?: number } = {}): Promise<RunSummary> {
  const t0 = Date.now();
  const now = ctx.clock.now();
  const source = await one<IngestSource & { last_run_at: Date | null }>(ctx.db, 'select * from ingest_sources where id = $1', [sourceId]);
  if (!source) throw new Error(`ingest source ${sourceId} not found`);
  const sum: RunSummary = { sourceId, name: source.name, fetched: 0, parsed: 0, rejected: 0, created: 0, merged: 0, unchanged: 0, failed: 0, errors: [], notModified: false, ms: 0 };
  const adapter = ADAPTERS[source.adapter];
  const run = await one<{ id: string }>(ctx.db,
    `insert into ingest_runs (source_id, started_at, trigger) values ($1,$2,$3) returning id`, [sourceId, now, opts.trigger ?? 'schedule']);
  const touched = new Set<string>();
  const base = opts.io ?? ioFor(ctx);
  const io: IngestIO = {
    ...base,
    deadline: opts.deadline,
    lastFetched: async (urls) => {
      const rows = await many<{ source_url: string; at: Date }>(ctx.db,
        `select source_url, max(fetched_at) as at from raw_events where source_id = $1 and source_url = any($2::text[]) group by source_url`, [sourceId, urls]);
      return new Map(rows.map((r) => [r.source_url, new Date(r.at).getTime()]));
    },
  };

  const finish = async (error: string | null) => {
    sum.ms = Date.now() - t0;
    // A failing source waits an hour, or its own interval if shorter, before the next try.
    const next = new Date(now.getTime() + (error ? Math.min(60, source.interval_minutes) : source.interval_minutes) * 60_000);
    await ctx.db.query(
      `update ingest_runs set finished_at = $2, fetched = $3, parsed = $4, rejected = $5, created = $6, merged = $7, unchanged = $8, failed = $9, errors = $10 where id = $1`,
      [run!.id, ctx.clock.now(), sum.fetched, sum.parsed, sum.rejected, sum.created, sum.merged, sum.unchanged, sum.failed, json(sum.errors.slice(0, 50))]);
    await ctx.db.query(`update ingest_sources set last_run_at = $2, next_run_at = $3, last_error = $4 where id = $1`, [sourceId, now, next, error]);
    if (touched.size) await refreshConfidence(ctx.db, now, [...touched]);
    ctx.log(`ingest ${source.name}: fetched ${sum.fetched}, parsed ${sum.parsed}, new ${sum.created}, merged ${sum.merged}, unchanged ${sum.unchanged}, rejected ${sum.rejected}, failed ${sum.failed}${error ? `, error: ${error}` : ''} (${sum.ms} ms)`);
    return sum;
  };

  if (!adapter) { sum.errors.push(`unknown adapter ${source.adapter}`); return finish(sum.errors[0]); }
  let found;
  try {
    found = await adapter.discover(source, io);
  } catch (e) {
    sum.errors.push((e as Error).message.slice(0, 300));
    return finish(sum.errors[0]);
  }
  sum.errors.push(...(found.errors ?? []));
  await ctx.db.query(
    `update ingest_sources set etag = coalesce($2, etag), last_modified = coalesce($3, last_modified), content_hash = coalesce($4, content_hash) where id = $1`,
    [sourceId, found.etag ?? null, found.lastModified ?? null, found.contentHash ?? null]);

  if (found.notModified) {
    // Unchanged since the last run: everything it listed then is still listed.
    sum.notModified = true;
    const since = source.last_run_at ?? new Date(0);
    await ctx.db.query(`update raw_events set last_seen_at = $2 where source_id = $1 and last_seen_at >= $3`, [sourceId, now, since]);
    const seen = await many<{ event_id: string }>(ctx.db,
      `update event_sources set last_seen_at = $2 where ingest_source_id = $1 and last_seen_at >= $3 returning event_id`, [sourceId, now, since]);
    seen.forEach((r) => touched.add(r.event_id));
    sum.unchanged = seen.length;
    return finish(null);
  }

  for (const record of found.records) {
    if (opts.deadline && Date.now() > opts.deadline) { sum.errors.push('time budget spent; the rest waits for the next run'); break; }
    sum.fetched++;
    try {
      const outcome = await ingestRecord(ctx, source, record, now);
      sum[outcome.kind]++;
      if (outcome.kind === 'created' || outcome.kind === 'merged') sum.parsed++;
      if (outcome.eventId) touched.add(outcome.eventId);
    } catch (e) {
      sum.failed++;
      sum.errors.push(`${record.externalId}: ${(e as Error).message}`.slice(0, 300));
    }
  }
  return finish(sum.failed && !sum.parsed && !sum.unchanged ? sum.errors[0] ?? 'every record failed' : null);
}

type Outcome = { kind: 'created' | 'merged' | 'unchanged' | 'rejected' | 'failed'; eventId?: string };

/** A source's `skip` pattern: records whose title or venue match it are not nights out (brunches, tours, day passes). */
function skips(source: IngestSource, n: NormalizedEvent): boolean {
  const pattern = typeof source.config.skip === 'string' ? source.config.skip : '';
  if (!pattern) return false;
  try { return new RegExp(pattern, 'i').test(`${n.title} ${n.venueName ?? ''}`); } catch { return false; }
}

/** One record: kept as sent, then normalised and resolved, in one transaction. */
export async function ingestRecord(ctx: Ctx, source: IngestSource, record: RawRecord, now: Date, opts: { force?: boolean } = {}): Promise<Outcome> {
  const adapter = ADAPTERS[source.adapter];
  const hash = stableHash(record.payload);
  const payload = JSON.stringify(record.payload);
  if (payload.length > MAX_PAYLOAD) throw new Error('record too large');

  return ctx.db.tx(async (q) => {
    const prev = await one<{ id: string; content_hash: string; status: string; event_id: string | null }>(q,
      'select id, content_hash, status, event_id from raw_events where source_id = $1 and external_id = $2 for update', [source.id, record.externalId]);
    if (!opts.force && prev && prev.content_hash === hash && (prev.status === 'rejected' || (prev.event_id && (prev.status === 'created' || prev.status === 'merged')))) {
      await q.query('update raw_events set last_seen_at = $2 where id = $1', [prev.id, now]);
      if (prev.event_id) await q.query('update event_sources set last_seen_at = $2 where raw_event_id = $1', [prev.id, now]);
      return { kind: prev.status === 'rejected' ? 'rejected' : 'unchanged', eventId: prev.event_id ?? undefined };
    }
    const raw = await one<{ id: string }>(q,
      `insert into raw_events (source_id, provider, external_id, source_url, payload, content_hash, fetched_at, last_seen_at, status)
       values ($1,$2,$3,$4,$5,$6,$7,$7,'pending')
       on conflict (source_id, external_id) do update set source_url = excluded.source_url, payload = excluded.payload,
         content_hash = excluded.content_hash, fetched_at = excluded.fetched_at, last_seen_at = excluded.last_seen_at, status = 'pending', error = null
       returning id`,
      [source.id, source.adapter, record.externalId, record.url, payload, hash, now]);

    const normalized = adapter.normalize(record, { source, now });
    const n = !isRejection(normalized) && skips(source, normalized) ? { rejected: 'skipped' as const, detail: normalized.title } : normalized;
    // A club's own site lists club nights, whatever its pages call them.
    if (!isRejection(n) && typeof source.config.eventType === 'string' && (EVENT_TYPES as readonly string[]).includes(source.config.eventType)) {
      n.eventType = source.config.eventType as NormalizedEvent['eventType'];
    }
    if (isRejection(n)) {
      await q.query(`update raw_events set status = 'rejected', error = $2, processed_at = $3 where id = $1`, [raw!.id, n.detail ? `${n.rejected}: ${n.detail}` : n.rejected, now]);
      return { kind: 'rejected' };
    }
    const applied = await resolveAndApply(q, source, raw!.id, record, n, now);
    await q.query(`update raw_events set status = $2, event_id = $3, match_score = $4, match_reason = $5, processed_at = $6, error = $7 where id = $1`,
      [raw!.id, applied.kind, applied.eventId, applied.match?.score ?? null, applied.match?.reason ?? null, now, 'error' in applied ? applied.error : null]);
    return { kind: applied.kind, eventId: applied.eventId ?? undefined };
  });
}

async function resolveAndApply(q: Queryable, source: IngestSource, rawId: string, record: RawRecord, n: NormalizedEvent, now: Date) {
  const exact = await findExact(q, source.adapter, record.externalId, [n.eventUrl, record.url]);
  const venue = await matchVenue(q, n);
  const similar = exact ? null : await findSimilar(q, {
    title: n.title, startsOn: n.startsOn, startTime: n.startTime, city: n.city, venueId: venue?.id ?? null,
    venueName: venue?.name ?? n.venueName, lat: n.lat ?? venue?.lat ?? null, lng: n.lng ?? venue?.lng ?? null, lineup: n.lineup,
  });
  const match = exact ?? similar;
  if (match && (match.exact || match.score >= MATCH_RULES.mergeAt)) {
    await attachSource(q, match.eventId, source, rawId, record, n, match, now);
    await enrich(q, match.eventId, n, now);
    return { kind: 'merged' as const, eventId: match.eventId, match };
  }
  // A cancelled night nobody listed is not worth a moderator's time.
  if (n.cancelled) return { kind: 'rejected' as const, eventId: null, match, error: 'cancelled' };
  const eventId = await createCandidate(q, source, n, venue, match, now);
  await attachSource(q, eventId, source, rawId, record, n, null, now);
  await refreshDerived(q, eventId, now);
  await flagRisk(q, eventId, match, now);
  return { kind: 'created' as const, eventId, match };
}

/** A venue already in the registry for this city, by name, alias or a pin next door. */
export async function matchVenue(q: Queryable, n: { city: string; venueName: string | null; lat: number | null; lng: number | null }) {
  if (!n.venueName && n.lat === null) return null;
  const venues = await many<any>(q, 'select id, name, aliases, address, area, lat, lng, verified from venues where city = $1', [n.city]);
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

async function attachSource(q: Queryable, eventId: string, source: IngestSource, rawId: string, record: RawRecord, n: NormalizedEvent, match: Match | null, now: Date) {
  const url = n.eventUrl ?? record.url;
  const conflicts = match ? await conflictsWith(q, eventId, n) : [];
  await q.query(
    `insert into event_sources (event_id, provider, authority, external_id, source_url, source_host, ingest_source_id, raw_event_id,
                                provider_confidence, match_score, match_reason, conflicts, cancelled, first_seen_at, last_seen_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)
     on conflict (provider, external_id) where external_id is not null do update set
       source_url = excluded.source_url, source_host = excluded.source_host, ingest_source_id = excluded.ingest_source_id,
       raw_event_id = excluded.raw_event_id, conflicts = excluded.conflicts, cancelled = excluded.cancelled, last_seen_at = excluded.last_seen_at`,
    [eventId, source.adapter, source.authority, record.externalId, url, hostOf(url) ?? hostOf(source.url), source.id, rawId,
      PROVIDER_CONFIDENCE[source.authority], match?.score ?? null, match?.reason ?? null, json(conflicts), n.cancelled, now]);
}

/**
 * Fills what the event is missing from what the source says. Never overwrites: an organiser's
 * or moderator's words stand, and a disagreement is recorded as a conflict instead.
 */
export async function enrich(q: Queryable, eventId: string, n: NormalizedEvent, now: Date) {
  const ev = await one<any>(q, `select e.*, o.is_community from events e join organizers o on o.id = e.organizer_id where e.id = $1`, [eventId]);
  if (!ev) return;
  const set: Record<string, unknown> = {};
  if (!(ev.styles ?? []).length && n.styles.length) set.styles = n.styles;
  if (!ev.event_type && n.eventType) set.event_type = n.eventType;
  if (!ev.genre && n.genre) set.genre = n.genre;
  // Events nobody runs yet (community and imported ones) also take the source's pictures, lineup and pin.
  if (ev.is_community) {
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

/** A new event in the review queue, held by the community organiser until someone claims it. */
export async function createCandidate(q: Queryable, source: Pick<IngestSource, 'name' | 'url'>, n: NormalizedEvent, venue: any, match: Match | null, now: Date): Promise<string> {
  const organizerId = await communityOrganizerId(q);
  const slug = `${slugify(n.title) || 'event'}-${randomCode(4).toLowerCase()}`;
  const paid = !n.free;
  const row = await one<{ id: string }>(q,
    `insert into events (slug, organizer_id, title, genre, description, city, venue_id, venue_name, address, area, lat, lng,
                         starts_on, ends_on, start_time, end_time, entry_mode, price_from, ticket_url, event_url, lineup, artists,
                         cover_url, styles, event_type, status, submitted_at, ticket_link_status, first_seen_at, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$21,$22,$23,$24,'in_review',$25,$26,$25,$25)
     returning id`,
    [slug, organizerId, n.title, n.genre, json({ en: n.description ?? '', vi: n.description ?? '' }), n.city,
      venue?.id ?? null, venue?.name ?? n.venueName, venue?.address ?? n.address, venue?.area ?? n.area,
      venue?.lat ?? n.lat, venue?.lng ?? n.lng, n.startsOn, n.endsOn, n.startTime, n.endTime,
      paid ? 'paid' : 'free', paid ? n.priceFrom ?? 0 : 0, n.ticketUrl, n.eventUrl, n.lineup,
      n.imageUrl, n.styles, n.eventType, now, n.ticketUrl ? 'unchecked' : null]);
  await appendAudit(q, {
    at: now, actorType: 'system', actorId: null, actorLabel: `Import · ${source.name}`, action: 'listing.imported',
    targetType: 'event', targetId: row!.id, targetLabel: n.title,
    diff: [{ f: 'status', a: '—', b: 'in_review' }, { f: 'source', a: '—', b: n.eventUrl ?? source.url ?? source.name },
      ...(match ? [{ f: 'possible_duplicate', a: '—', b: `${match.title} (${match.score}: ${match.reason})` }] : [])],
  });
  return row!.id;
}

/** The moderator's advice for an imported candidate, with a possible duplicate first. */
export async function flagRisk(q: Queryable, eventId: string, match: Match | null, now: Date) {
  const risk = await assessRisk(q, eventId, now);
  const dup = match ? [{ ok: false, label: L(`Maybe a duplicate of “${match.title}” (${match.reason})`, `Có thể trùng “${match.title}” (${match.reason})`) }] : [];
  const ev = await one<{ entry_mode: string; price_from: number }>(q, 'select entry_mode, price_from from events where id = $1', [eventId]);
  if (ev && ev.entry_mode === 'paid' && !ev.price_from) dup.push({ ok: false, label: L('The source gives no ticket price', 'Nguồn không ghi giá vé') });
  await q.query('update events set risk_score = $2, risk_factors = $3, signals = $4, flag = $5 where id = $1',
    [eventId, risk.score, json(risk.factors), json([...dup, ...risk.signals].slice(0, 3)), match ? 'duplicate' : risk.flag]);
}

/**
 * Runs a source's stored records through today's rules again, without fetching anything:
 * after the normaliser, the style list or the matching rules change.
 */
export async function reprocessSource(ctx: Ctx, sourceId: string): Promise<RunSummary> {
  const t0 = Date.now();
  const now = ctx.clock.now();
  const source = await one<IngestSource>(ctx.db, 'select * from ingest_sources where id = $1', [sourceId]);
  if (!source) throw new Error(`ingest source ${sourceId} not found`);
  const sum: RunSummary = { sourceId, name: source.name, fetched: 0, parsed: 0, rejected: 0, created: 0, merged: 0, unchanged: 0, failed: 0, errors: [], notModified: false, ms: 0 };
  const rows = await many<any>(ctx.db, 'select external_id, source_url, payload from raw_events where source_id = $1 order by fetched_at desc limit 2000', [sourceId]);
  const touched = new Set<string>();
  for (const r of rows) {
    try {
      const out = await ingestRecord(ctx, source, { externalId: r.external_id, url: r.source_url, payload: r.payload }, now, { force: true });
      sum[out.kind]++;
      if (out.kind === 'created' || out.kind === 'merged') sum.parsed++;
      if (out.eventId) touched.add(out.eventId);
    } catch (e) {
      sum.failed++;
      sum.errors.push(`${r.external_id}: ${(e as Error).message}`.slice(0, 300));
    }
  }
  if (touched.size) await refreshConfidence(ctx.db, now, [...touched]);
  sum.ms = Date.now() - t0;
  return sum;
}
