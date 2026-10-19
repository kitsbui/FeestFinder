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

/** Event pages (upcoming, and the last six months' for their recaps and next editions) and organiser pages, in both languages; the list. */
export async function sitemapXml(ctx: Ctx): Promise<string> {
  const now = ctx.clock.now();
  const since = new Date(now.getTime() - 183 * 86400_000);
  const [events, orgs, artists, collections, projects] = await Promise.all([
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
  ]);
  const base = baseOf(ctx);
  const day = (d: Date | string | null) => (d ? new Date(d).toISOString().slice(0, 10) : now.toISOString().slice(0, 10));
  const alt = (vi: string, en: string) => [['vi', vi], ['en', en], ['x-default', vi]]
    .map(([l, href]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(href)}"/>`).join('');
  const urls: { loc: string; lastmod?: string; priority: string; alternates?: string }[] = [
    { loc: `${base}/`, lastmod: day(now), priority: '1.0' },
    { loc: `${base}/list`, lastmod: day(now), priority: '0.6' },
    ...events.flatMap((e) => {
      const vi = `${base}/e/${e.slug}`, en = `${vi}?lang=en`, links = alt(vi, en);
      return [{ loc: vi, lastmod: day(e.updated_at), priority: '0.9', alternates: links }, { loc: en, lastmod: day(e.updated_at), priority: '0.7', alternates: links }];
    }),
    ...orgs.flatMap((o) => {
      const vi = `${base}/o/${o.slug}`, en = `${vi}?lang=en`, links = alt(vi, en);
      return [{ loc: vi, lastmod: day(o.updated_at), priority: '0.6', alternates: links }, { loc: en, lastmod: day(o.updated_at), priority: '0.4', alternates: links }];
    }),
    ...artists.flatMap((a) => {
      const vi = `${base}/a/${a.slug}`, en = `${vi}?lang=en`, links = alt(vi, en);
      return [{ loc: vi, lastmod: day(a.updated_at), priority: '0.6', alternates: links }, { loc: en, lastmod: day(a.updated_at), priority: '0.4', alternates: links }];
    }),
    ...collections.flatMap((c) => {
      const vi = `${base}/c/${c.slug}`, en = `${vi}?lang=en`, links = alt(vi, en);
      return [{ loc: vi, lastmod: day(c.updated_at), priority: '0.5', alternates: links }, { loc: en, lastmod: day(c.updated_at), priority: '0.3', alternates: links }];
    }),
    ...projects.flatMap((x) => {
      const vi = `${base}/p/${x.slug}`, en = `${vi}?lang=en`, links = alt(vi, en);
      return [{ loc: vi, lastmod: day(x.updated_at), priority: '0.5', alternates: links }, { loc: en, lastmod: day(x.updated_at), priority: '0.3', alternates: links }];
    }),
    ...(projects.length ? [{ loc: `${base}/p`, lastmod: day(projects[0].updated_at), priority: '0.5' }] : []),
    // The directory pages that list enough artists to be worth a search result.
    ...(await directoryPages(ctx.db)).flatMap((path) => {
      const vi = `${base}${path}`, en = `${vi}?lang=en`, links = alt(vi, en);
      return [{ loc: vi, lastmod: day(now), priority: '0.5', alternates: links }, { loc: en, lastmod: day(now), priority: '0.3', alternates: links }];
    }),
    { loc: `${base}/about`, priority: '0.3' },
  ];
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    + urls.map((u) => `<url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority>${u.alternates ?? ''}</url>`).join('\n')
    + '\n</urlset>\n';
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
