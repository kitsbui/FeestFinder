import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../../db/index.ts';
import { notFound, conflict } from '../../lib/errors.ts';
import { L } from '../../lib/i18n.ts';
import { parse, uuid } from '../../lib/validate.ts';
import { requireAdmin } from '../../http/guards.ts';
import { appendAudit } from '../../services/audit.ts';
import { CONFIDENCE_LABEL, refreshConfidence } from '../../services/ingest/confidence.ts';
import { hostOf } from '../../services/ingest/normalize.ts';
import { PROVIDER_CONFIDENCE, PROVIDER_LABEL, providerOfLink } from '../../services/ingest/providers.ts';

/*
 * Where one event came from: provenance endpoints. These persist manual links and
 * compute confidence from them (ingestion was removed 2026-11-04).
 */

export default async function adminIngestRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  app.get<{ Params: { id: string } }>('/admin/events/:id/provenance', async (req) => {
    requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const ev = await one<any>(ctx.db,
      `select id, title, status, confidence_score, confidence, confidence_breakdown, source_count, first_seen_at, last_seen_at, last_verified_at
         from events where id = $1`, [id]);
    if (!ev) throw notFound();
    const sources = await many<any>(ctx.db,
      `select s.*, u.name as added_by_name from event_sources s
         left join users u on u.id = s.added_by
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
        externalId: s.external_id, url: s.source_url, host: s.source_host, ingestSource: null,
        rawEventId: null, matchScore: null, matchReason: null, conflicts: s.conflicts, cancelled: s.cancelled,
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
   * Remove a source from an event. It is not deleted, but no longer contributes to the event.
   */
  app.delete<{ Params: { id: string; sourceId: string } }>('/admin/events/:id/sources/:sourceId', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const sourceId = parse(uuid, req.params.sourceId);
    const now = ctx.clock.now();
    const row = await one<any>(ctx.db, 'delete from event_sources where id = $1 and event_id = $2 returning *', [sourceId, id]);
    if (!row) throw notFound();
    await refreshConfidence(ctx.db, now, [id]);
    await appendAudit(ctx.db, {
      at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'source.detached',
      targetType: 'event', targetId: id, targetLabel: row.source_url ?? row.provider, diff: [{ f: 'source', a: row.source_url ?? row.provider, b: '—' }],
    });
    return { ok: true };
  });
}
