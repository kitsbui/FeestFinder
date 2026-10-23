import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../db/index.ts';
import { conflict, notFound } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { isStyle } from '../lib/styles.ts';
import { limit, parse, uuid } from '../lib/validate.ts';
import { requireAdmin } from '../http/guards.ts';
import { appendAudit } from '../services/audit.ts';
import {
  digestPending, fetchNewsSource, NEWS_ITEM, NEWS_REGIONS, NEWS_TOPICS, type NewsItemRow, type NewsSourceRow, presentNewsItem, presentNewsSource,
} from '../services/news.ts';
import { addStarterNewsSources } from '../services/news-starter.ts';

/*
 * The news feed (migration 063, services/news.ts): the latest headlines of the EDM press.
 *
 *   anyone   GET /news (?topic= &region= &style= &limit= &offset=): the items, newest first, each linking to its publisher
 *   team     GET /admin/news (the sources and their runs), POST /admin/news/sources, PATCH /admin/news/sources/:id,
 *            POST /admin/news/sources/:id/run (read it now), POST /admin/news/sources/starter (the suggested publications),
 *            GET /admin/news/items (?source= &hidden=1), POST /admin/news/items/:id/hide | /show, POST /admin/news/digest (write the digests now)
 */

const SourceInput = z.object({
  name: z.string().trim().min(2).max(80),
  siteUrl: z.string().trim().url().max(300),
  feedUrl: z.string().trim().url().max(500).regex(/^https:\/\//, 'an https link'),
  lang: z.enum(['en', 'vi', 'th', 'ja', 'id']).default('en'),
  region: z.enum(NEWS_REGIONS).default('global'),
  intervalMinutes: z.coerce.number().int().min(15).max(1440).default(60),
  enabled: z.boolean().default(true),
});

const SOURCES = `select s.*, (select count(*)::int from news_items i where i.source_id = s.id and i.hidden_at is null) as items,
                        (select count(*)::int from news_items i where i.source_id = s.id and i.hidden_at is not null) as hidden
                   from news_sources s`;

export default async function newsRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  const sourceRow = async (id: string) => {
    const s = await one<NewsSourceRow & { items: number; hidden: number }>(ctx.db, `${SOURCES} where s.id = $1`, [id]);
    if (!s) throw notFound(L('No such source', 'Không có nguồn này'));
    return s;
  };

  app.get('/news', async (req) => {
    const f = parse(z.object({
      topic: z.enum(NEWS_TOPICS).optional(),
      region: z.enum(NEWS_REGIONS).optional(),
      style: z.string().refine(isStyle, 'unknown style').optional(),
      limit: limit(50, 24),
      offset: z.coerce.number().int().min(0).default(0),
    }), req.query);
    const where = ['i.hidden_at is null', 's.enabled'];
    const params: unknown[] = [];
    const p = (v: unknown) => { params.push(v); return `$${params.length}`; };
    if (f.topic) where.push(`i.topic = ${p(f.topic)}`);
    if (f.region) where.push(`i.region = ${p(f.region)}`);
    if (f.style) where.push(`${p(f.style)} = any(i.styles)`);
    const rows = await many<NewsItemRow & { total: number }>(ctx.db,
      `${NEWS_ITEM} where ${where.join(' and ')} order by i.published_at desc, i.id limit ${p(f.limit)} offset ${p(f.offset)}`, params);
    const total = (await one<{ n: number }>(ctx.db, `select count(*)::int as n from news_items i join news_sources s on s.id = i.source_id where ${where.join(' and ')}`, params.slice(0, -2)))!.n;
    const topics = await many<{ topic: string; n: number }>(ctx.db,
      `select i.topic, count(*)::int as n from news_items i join news_sources s on s.id = i.source_id where i.hidden_at is null and s.enabled group by i.topic`);
    return {
      items: rows.map(presentNewsItem),
      total,
      nextOffset: f.offset + rows.length < total ? f.offset + rows.length : null,
      topics: Object.fromEntries(NEWS_TOPICS.map((t) => [t, topics.find((x) => x.topic === t)?.n ?? 0])),
    };
  });

  // ---- the team ----------------------------------------------------------------------------

  app.get('/admin/news', async (req) => {
    requireAdmin(req);
    const rows = await many<NewsSourceRow & { items: number; hidden: number }>(ctx.db, `${SOURCES} order by s.enabled desc, s.name`);
    const undigested = (await one<{ n: number }>(ctx.db, `select count(*)::int as n from news_items where digest is null and hidden_at is null`))!.n;
    return { items: rows.map(presentNewsSource), undigested, digests: ctx.digester.enabled };
  });

  app.post('/admin/news/sources', async (req, reply) => {
    const s = requireAdmin(req);
    const b = parse(SourceInput, req.body);
    if (await one(ctx.db, 'select 1 from news_sources where feed_url = $1', [b.feedUrl])) throw conflict('news_source_exists', L('That feed is already listed', 'Feed này đã có trong danh sách'));
    const now = ctx.clock.now();
    const made = await one<{ id: string }>(ctx.db,
      `insert into news_sources (name, site_url, feed_url, lang, region, enabled, interval_minutes, next_run_at, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$8,$8) returning id`,
      [b.name, b.siteUrl, b.feedUrl, b.lang, b.region, b.enabled, b.intervalMinutes, now]);
    await appendAudit(ctx.db, { at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'news_source.add', targetType: 'news_source', targetId: made!.id, targetLabel: b.name, diff: [] });
    reply.code(201);
    return presentNewsSource(await sourceRow(made!.id));
  });

  app.patch<{ Params: { id: string } }>('/admin/news/sources/:id', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const before = await sourceRow(id);
    const b = parse(SourceInput.partial(), req.body);
    if (b.feedUrl && b.feedUrl !== before.feed_url && await one(ctx.db, 'select 1 from news_sources where feed_url = $1 and id <> $2', [b.feedUrl, id])) {
      throw conflict('news_source_exists', L('That feed is already listed', 'Feed này đã có trong danh sách'));
    }
    const now = ctx.clock.now();
    await ctx.db.query(
      `update news_sources set name = coalesce($2, name), site_url = coalesce($3, site_url), feed_url = coalesce($4, feed_url), lang = coalesce($5, lang), region = coalesce($6, region),
              enabled = coalesce($7, enabled), interval_minutes = coalesce($8, interval_minutes),
              etag = case when $4 is not null and $4 <> feed_url then null else etag end, last_modified = case when $4 is not null and $4 <> feed_url then null else last_modified end,
              next_run_at = case when $7 and not enabled then $9 else next_run_at end, updated_at = $9
        where id = $1`,
      [id, b.name ?? null, b.siteUrl ?? null, b.feedUrl ?? null, b.lang ?? null, b.region ?? null, b.enabled ?? null, b.intervalMinutes ?? null, now]);
    const after = await sourceRow(id);
    const diff = (['name', 'site_url', 'feed_url', 'lang', 'region', 'enabled', 'interval_minutes'] as const)
      .filter((k) => before[k] !== after[k]).map((k) => ({ f: k, a: String(before[k]), b: String(after[k]) }));
    if (diff.length) await appendAudit(ctx.db, { at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'news_source.edit', targetType: 'news_source', targetId: id, targetLabel: after.name, diff });
    return presentNewsSource(after);
  });

  app.post<{ Params: { id: string } }>('/admin/news/sources/:id/run', async (req) => {
    requireAdmin(req);
    const id = parse(uuid, req.params.id);
    await sourceRow(id);
    const run = await fetchNewsSource(ctx, id);
    return { run, source: presentNewsSource(await sourceRow(id)) };
  });

  app.post('/admin/news/sources/starter', async (req) => {
    requireAdmin(req);
    const added = await addStarterNewsSources(ctx.db, ctx.clock.now());
    return { added, message: L(`${added} ${added === 1 ? 'source' : 'sources'} added`, `Đã thêm ${added} nguồn`) };
  });

  app.get('/admin/news/items', async (req) => {
    requireAdmin(req);
    const f = parse(z.object({ source: uuid.optional(), hidden: z.enum(['1', '0']).optional(), limit: limit(100, 50), offset: z.coerce.number().int().min(0).default(0) }), req.query);
    const where: string[] = [];
    const params: unknown[] = [];
    const p = (v: unknown) => { params.push(v); return `$${params.length}`; };
    if (f.source) where.push(`i.source_id = ${p(f.source)}`);
    if (f.hidden === '1') where.push('i.hidden_at is not null');
    if (f.hidden === '0') where.push('i.hidden_at is null');
    const rows = await many<NewsItemRow>(ctx.db,
      `${NEWS_ITEM}${where.length ? ` where ${where.join(' and ')}` : ''} order by i.published_at desc, i.id limit ${p(f.limit)} offset ${p(f.offset)}`, params);
    const total = (await one<{ n: number }>(ctx.db, `select count(*)::int as n from news_items i${where.length ? ` where ${where.join(' and ')}` : ''}`, params.slice(0, -2)))!.n;
    return { items: rows.map(presentNewsItem), total, nextOffset: f.offset + rows.length < total ? f.offset + rows.length : null };
  });

  for (const action of ['hide', 'show'] as const) {
    app.post<{ Params: { id: string } }>(`/admin/news/items/:id/${action}`, async (req) => {
      const s = requireAdmin(req);
      const id = parse(uuid, req.params.id);
      const now = ctx.clock.now();
      const row = await one<NewsItemRow>(ctx.db, `${NEWS_ITEM} where i.id = $1`, [id]);
      if (!row) throw notFound(L('No such item', 'Không có tin này'));
      await ctx.db.query(`update news_items set hidden_at = $2, updated_at = $3 where id = $1`, [id, action === 'hide' ? now : null, now]);
      await appendAudit(ctx.db, { at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: `news_item.${action}`, targetType: 'news_item', targetId: id, targetLabel: row.title.slice(0, 120), diff: [] });
      return presentNewsItem((await one<NewsItemRow>(ctx.db, `${NEWS_ITEM} where i.id = $1`, [id]))!);
    });
  }

  app.post('/admin/news/digest', async (req) => {
    requireAdmin(req);
    return digestPending(ctx, 20);
  });
}
