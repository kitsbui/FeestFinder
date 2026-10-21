import type { Ctx } from '../../context.ts';
import { many, type Queryable } from '../../db/index.ts';
import { directoryPages } from './directory.ts';
import { baseOf, esc, PUBLIC_EVENT } from './shared.ts';

/* What crawlers read about the site: robots.txt, the sitemap, IndexNow. Part of services/seo.ts. */

/**
 * AI companies run two kinds of crawler. Search and answer crawlers (OAI-SearchBot,
 * ChatGPT-User, PerplexityBot, Claude-SearchBot…) fetch a page to answer someone and link
 * back to it: they follow the `*` rules, which let them read every public page. Training
 * crawlers copy pages into the data a future model learns from and send no visitors; they
 * are turned away unless ALLOW_AI_TRAINING is on. Blocking them changes nothing in Google
 * Search or its AI Overviews, which read pages as Googlebot.
 */
export const AI_TRAINING_BOTS = ['GPTBot', 'ClaudeBot', 'anthropic-ai', 'Google-Extended', 'CCBot', 'Applebot-Extended', 'meta-externalagent', 'Bytespider', 'cohere-training-data-crawler'];

export function robotsTxt(ctx: Ctx): string {
  const privatePaths = ['/app', '/studio', '/console', '/ops', '/door', '/admin/', '/organizer/', '/internal/', '/me/', '/auth/', '/orders', '/resale/', '/payments/', '/checkout/', '/go/', '/partners/'];
  const lines = ['User-agent: *', 'Allow: /', ...privatePaths.map((p) => `Disallow: ${p}`), ''];
  if (!ctx.config.allowAiTraining) {
    for (const bot of AI_TRAINING_BOTS) lines.push(`User-agent: ${bot}`);
    lines.push('Disallow: /', '');
  }
  lines.push(`Sitemap: ${baseOf(ctx)}/sitemap.xml`, `# For AI agents: an index of every page as Markdown at ${baseOf(ctx)}/llms.txt`, '');
  return lines.join('\n');
}

/** A page's address and when it last changed. */
type Stamped = { slug: string; updated_at: Date };

/**
 * A page the sitemap lists, with which languages it is: every language the site speaks (the web
 * names Thai, Japanese and Indonesian too, design v2 phase 10), Vietnamese and English (a blog
 * post written in both, the blog itself), or the one it is written in.
 */
export type SitemapPage = { path: string; lastmod?: string; priority: number; langs: 'every' | 'pair' | 'one' };

/**
 * Every public page worth a search result: the home page, events (upcoming, and the last six
 * months' for their recaps and next editions), organisers and artists with a show to come, public
 * collections with something still on, projects and the blog, the artist directory pages that list
 * enough artists, and the about page. The web's /sitemap.xml (festfinder-web/src/app/sitemap.ts)
 * and the API's own read this one list.
 */
export async function sitemapPages(ctx: Ctx): Promise<SitemapPage[]> {
  const now = ctx.clock.now();
  const since = new Date(now.getTime() - 183 * 86400_000);
  const [events, orgs, artists, collections, projects, posts, directories] = await Promise.all([
    many<Stamped>(ctx.db,
      `select slug, updated_at from events where status in ('live', 'cancelled') and not held_for_reports and published_at is not null and ends_at >= $1
        order by starts_at limit 20000`, [since]),
    many<Stamped>(ctx.db,
      `select o.slug, max(e.updated_at) as updated_at from organizers o join events e on e.organizer_id = o.id
        where e.status = 'live' and not e.held_for_reports and e.ends_at >= $1 group by o.slug`, [now]),
    // Artists with a show still to come.
    many<Stamped>(ctx.db,
      `select a.slug, max(e.updated_at) as updated_at from artists a join event_artists ea on ea.artist_id = a.id join events e on e.id = ea.event_id
        where e.status = 'live' and not e.held_for_reports and e.published_at is not null and e.ends_at >= $1 and a.hidden_at is null group by a.slug limit 20000`, [now]),
    // Public collections with something still on.
    many<Stamped>(ctx.db,
      `select c.slug, greatest(c.updated_at, max(e.updated_at)) as updated_at
         from collections c join collection_items i on i.collection_id = c.id join events e on e.id = i.event_id
        where c.is_public and ${PUBLIC_EVENT} and e.ends_at >= $1 group by c.slug, c.updated_at limit 5000`, [now]),
    // Projects open to backers, and the ones that became events.
    many<Stamped>(ctx.db, `select slug, updated_at from projects where status in ('open', 'realized') order by published_at desc limit 5000`),
    // Published blog posts: two pages when written in both languages, else one (services/seo/blog.ts).
    many<Stamped & { both: boolean }>(ctx.db,
      `select slug, updated_at, (title->>'en' <> '' and title->>'vi' <> '' and body->>'en' <> '' and body->>'vi' <> '') as both
         from blog_posts where status = 'published' order by published_at desc limit 10000`),
    directoryPages(ctx.db),
  ]);
  const day = (d: Date | string | null) => (d ? new Date(d).toISOString().slice(0, 10) : now.toISOString().slice(0, 10));
  const every = (prefix: string, rows: Stamped[], priority: number): SitemapPage[] =>
    rows.map((r) => ({ path: `${prefix}${r.slug}`, lastmod: day(r.updated_at), priority, langs: 'every' }));
  return [
    { path: '/', lastmod: day(now), priority: 1, langs: 'every' },
    ...every('/e/', events, 0.9),
    ...every('/o/', orgs, 0.6),
    ...every('/a/', artists, 0.6),
    ...every('/c/', collections, 0.5),
    ...every('/p/', projects, 0.5),
    ...(projects.length ? [{ path: '/p', lastmod: day(projects[0].updated_at), priority: 0.5, langs: 'every' as const }] : []),
    ...posts.map((x): SitemapPage => ({ path: `/blog/${x.slug}`, lastmod: day(x.updated_at), priority: x.both ? 0.6 : 0.5, langs: x.both ? 'pair' : 'one' })),
    ...(posts.length ? [{ path: '/blog', lastmod: day(posts[0].updated_at), priority: 0.5, langs: 'pair' as const }] : []),
    ...directories.map((path): SitemapPage => ({ path, lastmod: day(now), priority: 0.5, langs: 'every' })),
    { path: '/about', priority: 0.3, langs: 'every' },
  ];
}

/** The same pages as XML, each in Vietnamese and English where it has both (the API's own /sitemap.xml). */
export async function sitemapXml(ctx: Ctx): Promise<string> {
  const base = baseOf(ctx);
  const alt = (vi: string, en: string) => [['vi', vi], ['en', en], ['x-default', vi]]
    .map(([l, href]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(href)}"/>`).join('');
  const url = (loc: string, p: SitemapPage, priority: number, alternates = '') =>
    `<url><loc>${esc(loc)}</loc>${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ''}<priority>${priority.toFixed(1)}</priority>${alternates}</url>`;
  const urls = (await sitemapPages(ctx)).flatMap((p) => {
    const vi = `${base}${p.path}`;
    if (p.langs === 'one') return [url(vi, p, p.priority)];
    const en = `${vi}?lang=en`, links = alt(vi, en);
    return [url(vi, p, p.priority, links), url(en, p, Math.max(0.1, p.priority - 0.2), links)];
  });
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    + urls.join('\n') + '\n</urlset>\n';
}

// ---- IndexNow ----------------------------------------------------------------------------

/** Notes an event page to announce. A no-op without INDEXNOW_KEY. */
export async function queueIndexNow(q: Queryable, ctx: Ctx, slug: string) {
  if (!ctx.config.indexNowKey) return;
  await q.query(`insert into indexnow_queue (url, queued_at) values ($1, $2) on conflict (url) do update set queued_at = excluded.queued_at`,
    [`${baseOf(ctx)}/e/${slug}`, ctx.clock.now()]);
}

/**
 * Announces, in one batch, every event and organiser page whose content changed since it was
 * last announced (the events_touch trigger keeps updated_at to real changes; an organiser page
 * changes with its events), in both languages, and any queued by hand. Bing shares IndexNow
 * submissions with Yandex, Naver and Seznam; ChatGPT search and Copilot read Bing's index.
 */
export async function pingIndexNow(ctx: Ctx, send: typeof fetch = fetch): Promise<number> {
  const key = ctx.config.indexNowKey;
  if (!key) return 0;
  const base = baseOf(ctx);
  const [changed, queued] = await Promise.all([
    many<{ url: string }>(ctx.db,
      `select $1 || e.slug as url, e.updated_at as at from events e left join indexnow_sent s on s.url = $1 || e.slug
        where ${PUBLIC_EVENT} and (s.sent_at is null or e.updated_at > s.sent_at)
       union all
       select $2 || o.slug, max(e.updated_at) from organizers o join events e on e.organizer_id = o.id left join indexnow_sent s on s.url = $2 || o.slug
        where ${PUBLIC_EVENT} and o.suspended_at is null
        group by o.slug, s.sent_at having s.sent_at is null or max(e.updated_at) > s.sent_at
       order by at desc limit 4000`, [`${base}/e/`, `${base}/o/`]),
    many<{ url: string }>(ctx.db, 'select url from indexnow_queue order by queued_at limit 1000'),
  ]);
  // Each page goes out in both languages; the record keeps the Vietnamese address.
  const pages = [...new Set([...queued, ...changed].map((r) => r.url.replace(/\?lang=en$/, '')))].slice(0, 5_000);
  if (!pages.length) return 0;
  const urls = pages.flatMap((u) => [u, `${u}?lang=en`]);
  const res = await send('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(base).host, key, keyLocation: `${base}/${key}.txt`, urlList: urls }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok && res.status !== 202) throw new Error(`IndexNow answered ${res.status}`);
  await ctx.db.tx(async (q) => {
    await q.query('delete from indexnow_queue where url = any($1::text[])', [pages]);
    await q.query(`insert into indexnow_sent (url, sent_at) select u, now() from unnest($1::text[]) u
                   on conflict (url) do update set sent_at = excluded.sent_at`, [pages]);
  });
  return pages.length;
}
