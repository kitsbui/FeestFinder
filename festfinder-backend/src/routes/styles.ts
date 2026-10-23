import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../db/index.ts';
import { conflict, notFound } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { isStyle, styleByKey } from '../lib/styles.ts';
import { parse, uuid } from '../lib/validate.ts';
import { requireAdmin } from '../http/guards.ts';
import { appendAudit } from '../services/audit.ts';
import { styleItem } from '../services/artists.ts';
import { CHART_PROVIDERS, chartKeysFromEnv, chartsEnabled, chartsOf, type ChartSourceRow, presentChartSource, refreshChart } from '../services/charts.ts';

/*
 * The style hub (owner, 2026-10-22, from the playlist handoff): one answer that links everything
 * the site has about a style, so a style chip anywhere leads to its nights, its artists, its
 * guide, its playlists, its news and its charts.
 *
 *   anyone   GET /styles/:key, GET /charts?style=
 *   team     GET /admin/charts, POST /admin/charts/sources, PATCH /admin/charts/sources/:id, POST /admin/charts/sources/:id/run
 */

const SourceInput = z.object({
  provider: z.enum(CHART_PROVIDERS),
  name: z.string().trim().min(2).max(80),
  style: z.string().refine(isStyle, 'unknown style'),
  externalId: z.string().trim().min(1).max(120),
  url: z.string().trim().url().max(500).regex(/^https:\/\//, 'an https link'),
  enabled: z.boolean().default(true),
  intervalMinutes: z.coerce.number().int().min(60).max(10080).default(1440),
});

const SOURCES = `select s.*, (select count(*)::int from chart_entries e where e.source_id = s.id) as entries from chart_sources s`;

export default async function styleRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  app.get<{ Params: { key: string } }>('/styles/:key', async (req) => {
    const key = req.params.key;
    const style = styleByKey(key);
    if (!style) throw notFound(L('No such style', 'Không có dòng nhạc này'));
    const now = ctx.clock.now();
    const [nights, artists, posts, news, charts] = await Promise.all([
      one<{ n: number }>(ctx.db, `select count(*)::int as n from events e where e.status = 'live' and not e.held_for_reports and (e.ends_at is null or e.ends_at >= $1) and $2 = any(e.styles)`, [now, key]),
      one<{ n: number }>(ctx.db, `select count(*)::int as n from artists a where (a.owner_user_id is not null or a.verified) and a.hidden_at is null and $1 = any(a.styles)`, [key]),
      many<{ slug: string; title: unknown; category: string; styles: string[]; published_at: Date }>(ctx.db,
        `select slug, title, category, styles, published_at from blog_posts where status = 'published' and $1 = any(styles) and category in ('styles', 'playlist', 'news', 'venues', 'dj') order by published_at desc limit 40`, [key]),
      one<{ n: number }>(ctx.db, `select count(*)::int as n from news_items i join news_sources s on s.id = i.source_id where i.hidden_at is null and s.enabled and $1 = any(i.styles)`, [key]),
      chartsOf(ctx.db, key),
    ]);
    const guides = posts.filter((p) => p.category === 'styles');
    // The guide of the style itself first (its first style), else the guide that names it.
    const guide = guides.find((p) => p.styles[0] === key) ?? guides[0] ?? null;
    const pick = (category: string, n: number) => posts.filter((p) => p.category === category).slice(0, n).map((p) => ({ slug: p.slug, title: p.title }));
    return {
      style: styleItem(key),
      nights: nights!.n, artists: artists!.n, news: news!.n,
      guide: guide ? { slug: guide.slug, title: guide.title } : null,
      playlists: pick('playlist', 6),
      posts: posts.filter((p) => p.category !== 'styles' && p.category !== 'playlist').slice(0, 6).map((p) => ({ slug: p.slug, title: p.title, category: p.category })),
      charts,
      links: { nights: `/?style=${key}`, artists: `/a/style/${key}`, news: '/blog?category=news', guide: guide ? `/blog/${guide.slug}` : null },
    };
  });

  app.get('/charts', async (req) => {
    const f = parse(z.object({ style: z.string().refine(isStyle, 'unknown style') }), req.query);
    return { items: await chartsOf(ctx.db, f.style) };
  });

  // ---- the team ----------------------------------------------------------------------------

  const sourceRow = async (id: string) => {
    const s = await one<ChartSourceRow & { entries: number }>(ctx.db, `${SOURCES} where s.id = $1`, [id]);
    if (!s) throw notFound(L('No such chart', 'Không có bảng xếp hạng này'));
    return s;
  };

  app.get('/admin/charts', async (req) => {
    requireAdmin(req);
    const rows = await many<ChartSourceRow & { entries: number }>(ctx.db, `${SOURCES} order by s.style, s.provider, s.name`);
    return { items: rows.map(presentChartSource), providers: chartsEnabled(chartKeysFromEnv()) };
  });

  app.post('/admin/charts/sources', async (req, reply) => {
    const s = requireAdmin(req);
    const b = parse(SourceInput, req.body);
    if (await one(ctx.db, 'select 1 from chart_sources where provider = $1 and external_id = $2', [b.provider, b.externalId])) throw conflict('chart_source_exists', L('That chart is already listed', 'Bảng xếp hạng này đã có'));
    const now = ctx.clock.now();
    const made = await one<{ id: string }>(ctx.db,
      `insert into chart_sources (provider, name, style, external_id, url, enabled, interval_minutes, next_run_at, created_at, updated_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$8,$8) returning id`,
      [b.provider, b.name, b.style, b.externalId, b.url, b.enabled, b.intervalMinutes, now]);
    await appendAudit(ctx.db, { at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'chart_source.add', targetType: 'chart_source', targetId: made!.id, targetLabel: b.name, diff: [] });
    reply.code(201);
    return presentChartSource(await sourceRow(made!.id));
  });

  app.patch<{ Params: { id: string } }>('/admin/charts/sources/:id', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const before = await sourceRow(id);
    const b = parse(SourceInput.partial(), req.body);
    const now = ctx.clock.now();
    await ctx.db.query(
      `update chart_sources set provider = coalesce($2, provider), name = coalesce($3, name), style = coalesce($4, style), external_id = coalesce($5, external_id), url = coalesce($6, url),
              enabled = coalesce($7, enabled), interval_minutes = coalesce($8, interval_minutes), next_run_at = case when $7 and not enabled then $9 else next_run_at end, updated_at = $9 where id = $1`,
      [id, b.provider ?? null, b.name ?? null, b.style ?? null, b.externalId ?? null, b.url ?? null, b.enabled ?? null, b.intervalMinutes ?? null, now]);
    const after = await sourceRow(id);
    const diff = (['provider', 'name', 'style', 'external_id', 'url', 'enabled', 'interval_minutes'] as const).filter((k) => before[k] !== after[k]).map((k) => ({ f: k, a: String(before[k]), b: String(after[k]) }));
    if (diff.length) await appendAudit(ctx.db, { at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'chart_source.edit', targetType: 'chart_source', targetId: id, targetLabel: after.name, diff });
    return presentChartSource(after);
  });

  app.post<{ Params: { id: string } }>('/admin/charts/sources/:id/run', async (req) => {
    requireAdmin(req);
    const id = parse(uuid, req.params.id);
    await sourceRow(id);
    const run = await refreshChart(ctx, id);
    return { run, source: presentChartSource(await sourceRow(id)) };
  });
}
