import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { json, many, one } from '../../db/index.ts';
import { badRequest, conflict, notFound } from '../../lib/errors.ts';
import { L } from '../../lib/i18n.ts';
import { cityLabel, citySlug } from '../../lib/places.ts';
import { limit, parse, uuid } from '../../lib/validate.ts';
import { requireAdmin } from '../../http/guards.ts';
import { appendAudit } from '../../services/audit.ts';
import { CONFIDENCE_LABEL, CONFIDENCE_RULES, refreshConfidence } from '../../services/ingest/confidence.ts';
import { hostOf } from '../../services/ingest/normalize.ts';
import { ADAPTER_IDS, PROVIDER_CONFIDENCE, PROVIDER_LABEL, providerOfLink } from '../../services/ingest/providers.ts';
import { MATCH_RULES } from '../../services/ingest/resolve.ts';
import { reprocessSource, runSource } from '../../services/ingest/run.ts';

/*
 * The team's view of ingestion: which sources FeestFinder reads, what each run found, the raw
 * records it kept, and for any event, where its facts came from and why it scores what it does.
 */

const SourceInput = z.object({
  adapter: z.enum(ADAPTER_IDS),
  name: z.string().trim().min(2).max(80),
  url: z.string().url().max(500).nullable().optional(),
  city: citySlug.nullable().optional(),
  authority: z.enum(['official', 'ticketing', 'listing']).default('listing'),
  config: z.record(z.string(), z.unknown()).default({}),
  intervalMinutes: z.coerce.number().int().min(30).max(7 * 24 * 60).default(720),
  enabled: z.boolean().default(true),
});

const RAW_STATUS = ['pending', 'created', 'merged', 'rejected', 'failed'] as const;

function presentSource(r: any) {
  return {
    id: r.id, adapter: r.adapter, name: r.name, url: r.url, city: r.city, cityLabel: cityLabel(r.city), authority: r.authority,
    config: r.config, intervalMinutes: r.interval_minutes, enabled: r.enabled,
    nextRunAt: r.next_run_at, lastRunAt: r.last_run_at, lastError: r.last_error, createdAt: r.created_at,
    events: r.events ?? 0, lastRun: r.run_id ? {
      id: r.run_id, startedAt: r.run_started, finishedAt: r.run_finished, fetched: r.run_fetched, created: r.run_created,
      merged: r.run_merged, unchanged: r.run_unchanged, rejected: r.run_rejected, failed: r.run_failed,
    } : null,
  };
}

export default async function adminIngestRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  const sourceRow = (id: string) => one<any>(ctx.db,
    `select s.*, (select count(distinct es.event_id)::int from event_sources es where es.ingest_source_id = s.id) as events,
            r.id as run_id, r.started_at as run_started, r.finished_at as run_finished, r.fetched as run_fetched, r.created as run_created,
            r.merged as run_merged, r.unchanged as run_unchanged, r.rejected as run_rejected, r.failed as run_failed
       from ingest_sources s
       left join lateral (select * from ingest_runs x where x.source_id = s.id order by x.started_at desc limit 1) r on true
      where s.id = $1`, [id]);

  // ---- sources ----------------------------------------------------------------------------

  app.get('/admin/sources', async (req) => {
    requireAdmin(req);
    const ids = await many<{ id: string }>(ctx.db, 'select id from ingest_sources order by enabled desc, city nulls last, name');
    const items = await Promise.all(ids.map((r) => sourceRow(r.id)));
    // Live events whose own source now says they are cancelled: a moderator decides.
    const cancelled = await many<any>(ctx.db,
      `select distinct e.id, e.slug, e.title, e.starts_on::text as starts_on, s.source_host from event_sources s join events e on e.id = s.event_id
        where s.cancelled and e.status = 'live' order by starts_on limit 50`);
    return {
      items: items.map(presentSource),
      cancelledBySource: cancelled.map((c) => ({ id: c.id, slug: c.slug, title: c.title, startsOn: c.starts_on, host: c.source_host })),
      adapters: ADAPTER_IDS,
      rules: { confidence: CONFIDENCE_RULES, match: MATCH_RULES },
    };
  });

  app.post('/admin/sources', async (req, reply) => {
    const s = requireAdmin(req);
    const b = parse(SourceInput, req.body);
    if (b.adapter !== 'ticketmaster' && !b.url) throw badRequest('url_required', L('Add the address to read', 'Nhập địa chỉ cần đọc'));
    if (b.url && /(^|\.)(ra\.co|residentadvisor\.net|facebook\.com|instagram\.com)$/.test(hostOf(b.url) ?? '')) {
      throw badRequest('source_not_allowed', L('FeestFinder does not read this site automatically', 'FeestFinder không tự động đọc trang này'));
    }
    const row = await one<{ id: string }>(ctx.db,
      `insert into ingest_sources (adapter, name, url, city, authority, config, interval_minutes, enabled, created_by, next_run_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
      [b.adapter, b.name, b.url ?? null, b.city ?? null, b.authority, json(b.config), b.intervalMinutes, b.enabled, s.user.id, ctx.clock.now()]);
    await appendAudit(ctx.db, {
      at: ctx.clock.now(), actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'source.created',
      targetType: 'ingest_source', targetId: row!.id, targetLabel: b.name, diff: [{ f: 'url', a: '—', b: b.url ?? b.adapter }],
    });
    return reply.code(201).send(presentSource(await sourceRow(row!.id)));
  });

  app.patch<{ Params: { id: string } }>('/admin/sources/:id', async (req) => {
    requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const b = parse(SourceInput.partial(), req.body);
    const cols: Record<string, unknown> = {
      name: b.name, url: b.url, city: b.city, authority: b.authority, config: b.config === undefined ? undefined : json(b.config),
      interval_minutes: b.intervalMinutes, enabled: b.enabled,
    };
    const keys = Object.keys(cols).filter((k) => cols[k] !== undefined);
    if (keys.length) {
      const out = await ctx.db.query(`update ingest_sources set ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')} where id = $1 returning id`, [id, ...keys.map((k) => cols[k])]);
      if (!out.rows.length) throw notFound();
    }
    const row = await sourceRow(id);
    if (!row) throw notFound();
    return presentSource(row);
  });

  app.post<{ Params: { id: string } }>('/admin/sources/:id/run', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req) => {
    requireAdmin(req);
    const id = parse(uuid, req.params.id);
    if (!(await sourceRow(id))) throw notFound();
    const summary = await runSource(ctx, id, { trigger: 'manual', deadline: Date.now() + 50_000 });
    return { summary, source: presentSource(await sourceRow(id)) };
  });

  app.post<{ Params: { id: string } }>('/admin/sources/:id/reprocess', async (req) => {
    requireAdmin(req);
    const id = parse(uuid, req.params.id);
    if (!(await sourceRow(id))) throw notFound();
    return { summary: await reprocessSource(ctx, id) };
  });

  app.get<{ Params: { id: string } }>('/admin/sources/:id/runs', async (req) => {
    requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const rows = await many<any>(ctx.db, 'select * from ingest_runs where source_id = $1 order by started_at desc limit 30', [id]);
    return {
      items: rows.map((r) => ({
        id: r.id, startedAt: r.started_at, finishedAt: r.finished_at, trigger: r.trigger, fetched: r.fetched, parsed: r.parsed,
        created: r.created, merged: r.merged, unchanged: r.unchanged, rejected: r.rejected, failed: r.failed, errors: r.errors,
      })),
    };
  });

  app.get<{ Params: { id: string } }>('/admin/sources/:id/raw', async (req) => {
    requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const f = parse(z.object({ status: z.enum(RAW_STATUS).optional(), limit: limit(200, 50) }), req.query);
    const rows = await many<any>(ctx.db,
      `select r.id, r.external_id, r.source_url, r.status, r.error, r.event_id, r.match_score, r.match_reason, r.fetched_at, r.last_seen_at,
              e.title as event_title, e.slug as event_slug, e.status as event_status
         from raw_events r left join events e on e.id = r.event_id
        where r.source_id = $1 and ($2::text is null or r.status = $2) order by r.fetched_at desc limit $3`, [id, f.status ?? null, f.limit]);
    return {
      items: rows.map((r) => ({
        id: r.id, externalId: r.external_id, url: r.source_url, status: r.status, error: r.error, matchScore: r.match_score, matchReason: r.match_reason,
        fetchedAt: r.fetched_at, lastSeenAt: r.last_seen_at,
        event: r.event_id ? { id: r.event_id, title: r.event_title, slug: r.event_slug, status: r.event_status } : null,
      })),
    };
  });

  app.get<{ Params: { id: string } }>('/admin/raw/:id', async (req) => {
    requireAdmin(req);
    const row = await one<any>(ctx.db, 'select * from raw_events where id = $1', [parse(uuid, req.params.id)]);
    if (!row) throw notFound();
    return {
      id: row.id, sourceId: row.source_id, provider: row.provider, externalId: row.external_id, url: row.source_url, payload: row.payload,
      status: row.status, error: row.error, eventId: row.event_id, matchScore: row.match_score, matchReason: row.match_reason,
      fetchedAt: row.fetched_at, lastSeenAt: row.last_seen_at,
    };
  });

  // ---- where one event came from ---------------------------------------------------------------

  app.get<{ Params: { id: string } }>('/admin/events/:id/provenance', async (req) => {
    requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const ev = await one<any>(ctx.db,
      `select id, title, status, confidence_score, confidence, confidence_breakdown, source_count, first_seen_at, last_seen_at, last_verified_at
         from events where id = $1`, [id]);
    if (!ev) throw notFound();
    const sources = await many<any>(ctx.db,
      `select s.*, i.name as ingest_name, u.name as added_by_name from event_sources s
         left join ingest_sources i on i.id = s.ingest_source_id left join users u on u.id = s.added_by
        where s.event_id = $1 order by s.first_seen_at`, [id]);
    return {
      event: {
        id: ev.id, title: ev.title, status: ev.status, sourceCount: ev.source_count,
        firstSeenAt: ev.first_seen_at, lastSeenAt: ev.last_seen_at, lastVerifiedAt: ev.last_verified_at,
      },
      confidence: ev.confidence_score == null ? null : {
        score: ev.confidence_score, label: ev.confidence, labelText: CONFIDENCE_LABEL[ev.confidence as keyof typeof CONFIDENCE_LABEL], breakdown: ev.confidence_breakdown,
      },
      sources: sources.map((s) => ({
        id: s.id, provider: s.provider, providerLabel: PROVIDER_LABEL[s.provider] ?? L(s.provider, s.provider), authority: s.authority,
        externalId: s.external_id, url: s.source_url, host: s.source_host, ingestSource: s.ingest_source_id ? { id: s.ingest_source_id, name: s.ingest_name } : null,
        rawEventId: s.raw_event_id, matchScore: s.match_score, matchReason: s.match_reason, conflicts: s.conflicts, cancelled: s.cancelled,
        firstSeenAt: s.first_seen_at, lastSeenAt: s.last_seen_at, addedBy: s.added_by_name ?? null,
      })),
    };
  });

  /** A link where the team saw the event (RA, Facebook, a promoter's post). Kept, never fetched. */
  app.post<{ Params: { id: string } }>('/admin/events/:id/sources', async (req, reply) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const b = parse(z.object({ url: z.string().url().max(500) }), req.body);
    const ev = await one<any>(ctx.db, 'select id, title from events where id = $1', [id]);
    if (!ev) throw notFound();
    const provider = providerOfLink(b.url);
    const now = ctx.clock.now();
    const out = await ctx.db.query(
      `insert into event_sources (event_id, provider, authority, source_url, source_host, provider_confidence, first_seen_at, last_seen_at, added_by)
       values ($1,$2,'listing',$3,$4,$5,$6,$6,$7) on conflict do nothing returning id`,
      [id, provider, b.url, hostOf(b.url), PROVIDER_CONFIDENCE.listing, now, s.user.id]);
    if (!out.rows.length) throw conflict('source_exists', L('That link is already a source', 'Liên kết này đã có trong nguồn'));
    await refreshConfidence(ctx.db, now, [id]);
    await appendAudit(ctx.db, {
      at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'source.linked',
      targetType: 'event', targetId: id, targetLabel: ev.title, diff: [{ f: 'source', a: '—', b: b.url }],
    });
    return reply.code(201).send({ ok: true });
  });

  /**
   * A source attached to the wrong event. Its record is set aside, so the next run does not
   * attach it again; reprocessing the source looks at it afresh.
   */
  app.delete<{ Params: { id: string; sourceId: string } }>('/admin/events/:id/sources/:sourceId', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const sourceId = parse(uuid, req.params.sourceId);
    const now = ctx.clock.now();
    const row = await one<any>(ctx.db, 'delete from event_sources where id = $1 and event_id = $2 returning *', [sourceId, id]);
    if (!row) throw notFound();
    if (row.raw_event_id) {
      await ctx.db.query(`update raw_events set status = 'rejected', error = 'detached by a moderator', event_id = null where id = $1`, [row.raw_event_id]);
    }
    await refreshConfidence(ctx.db, now, [id]);
    await appendAudit(ctx.db, {
      at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'source.detached',
      targetType: 'event', targetId: id, targetLabel: row.source_url ?? row.provider, diff: [{ f: 'source', a: row.source_url ?? row.provider, b: '—' }],
    });
    return { ok: true };
  });
}
