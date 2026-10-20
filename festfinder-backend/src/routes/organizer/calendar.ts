import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one } from '../../db/index.ts';
import { badRequest, conflict } from '../../lib/errors.ts';
import { L } from '../../lib/i18n.ts';
import { parse } from '../../lib/validate.ts';
import { requireOrganizer } from '../../http/guards.ts';
import { runSource } from '../../services/ingest/run.ts';

/*
 * An organiser's own calendar (growth plan card 1): the address of an ICS feed or of a page with
 * schema.org events. FeestFinder reads it like any source, and what it finds is the organiser's,
 * posted, waiting in the review queue (services/ingest/run.ts). One calendar per organiser.
 *
 *   GET    /organizer/calendar     the connected calendar, if any, and what waits for review
 *   POST   /organizer/calendar     connect one: {url}; read at once
 *   DELETE /organizer/calendar     disconnect (its events stay)
 */

/** ICS by its address (.ics, webcal://, Google's ical export), else a page with JSON-LD. */
export function adapterFor(url: string): 'ics' | 'website' {
  return /\.ics(\?|$)|\/ical\/|[?&](format|output)=ics\b|^webcal:/i.test(url) ? 'ics' : 'website';
}

export default async function calendarRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  const present = async (organizerId: string) => {
    const s = await one<{ id: string; url: string; adapter: string; last_run_at: Date | null; last_error: string | null }>(ctx.db,
      'select id, url, adapter, last_run_at, last_error from ingest_sources where organizer_id = $1', [organizerId]);
    if (!s) return { calendar: null };
    const waiting = await one<{ n: number }>(ctx.db,
      `select count(distinct es.event_id)::int as n from event_sources es join events e on e.id = es.event_id
        where es.ingest_source_id = $1 and e.status = 'in_review'`, [s.id]);
    return { calendar: { url: s.url, kind: s.adapter, lastReadAt: s.last_run_at, lastError: s.last_error, inReview: waiting?.n ?? 0 } };
  };

  app.get('/organizer/calendar', async (req) => {
    const org = await requireOrganizer(ctx, req);
    return present(org.organizerId);
  });

  app.post('/organizer/calendar', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (req, reply) => {
    const org = await requireOrganizer(ctx, req);
    const b = parse(z.object({ url: z.string().trim().max(1000) }), req.body);
    const url = b.url.replace(/^webcal:\/\//i, 'https://');
    if (!/^https:\/\/[^\s/]+\.[^\s]+/i.test(url)) throw badRequest('https_only', L('An https:// address', 'Địa chỉ https://'));
    const o = await one<{ name: string; placeholder: string | null }>(ctx.db, 'select name, placeholder from organizers where id = $1', [org.organizerId]);
    if (o?.placeholder) throw badRequest('placeholder', L('This profile holds events nobody runs yet; it has no calendar', 'Hồ sơ này giữ sự kiện chưa ai nhận; không nối lịch được'));
    if (await one(ctx.db, 'select 1 from ingest_sources where organizer_id = $1', [org.organizerId])) {
      throw conflict('calendar_connected', L('A calendar is already connected; disconnect it first', 'Đã nối một lịch; hãy ngắt trước'));
    }
    const src = await one<{ id: string }>(ctx.db,
      `insert into ingest_sources (adapter, name, url, authority, config, interval_minutes, organizer_id, created_by)
       values ($1,$2,$3,'official','{}',360,$4,$5) returning id`,
      [adapterFor(url), `Calendar · ${o?.name ?? 'organiser'}`, url, org.organizerId, org.userId]);
    // Read it now, within a budget: a long calendar finishes on the next run.
    const sum = await runSource(ctx, src!.id, { trigger: 'manual', deadline: Date.now() + 20_000 });
    const err = sum.errors[0] ?? '';
    if (!sum.fetched) {
      await ctx.db.query('delete from ingest_sources where id = $1', [src!.id]);
      if (/robots/i.test(err)) throw badRequest('robots', L('The page does not allow reading (robots.txt)', 'Trang không cho đọc (robots.txt)'));
      if (err && !/no events|0 events/i.test(err)) throw badRequest('unreachable', L('Could not reach it', 'Không mở được'));
      throw badRequest('no_events', L('No events at this address', 'Không tìm thấy sự kiện ở địa chỉ này'));
    }
    return reply.code(201).send({ ...(await present(org.organizerId)), found: sum.fetched, created: sum.created, merged: sum.merged,
      message: L(`Connected · ${sum.created} new waiting for review`, `Đã kết nối · ${sum.created} tin mới chờ duyệt`) });
  });

  app.delete('/organizer/calendar', async (req) => {
    const org = await requireOrganizer(ctx, req);
    await ctx.db.query('delete from ingest_sources where organizer_id = $1', [org.organizerId]);
    return { calendar: null, message: L('Disconnected · its events stay', 'Đã ngắt · sự kiện vẫn giữ') };
  });
}
