/**
 * GET /sitemap.xml, the one robots.txt names: every page the API lists (GET /seo/sitemap,
 * `sitemapPages` in festfinder-backend/src/services/seo/crawlers.ts), each in its languages: the
 * five a page speaks (design v2 phase 10), the two of a blog post written in both, or one.
 *
 * A route handler rendered on request, not a metadata `sitemap.ts`: Vercel served that one as a
 * file fixed at build time, so new pages waited for the next deploy and a build that ran before
 * the API knew a route kept a short list until then (2026-10-21). Vercel's CDN keeps each answer
 * 15 minutes; when the API cannot answer, a 503 tells crawlers to come back rather than giving
 * them a shorter list.
 */
import { api, SITE_URL } from '@/lib/api';
import { LANGS, type Lang } from '@/kd/copy';

export const dynamic = 'force-dynamic';

type Page = { path: string; lastmod?: string; priority: number; langs: 'every' | 'pair' | 'one' };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const at = (vi: string, l: Lang) => (l === 'vi' ? vi : `${vi}?lang=${l}`);

/** A page's addresses, each naming the others: Vietnamese first, the other languages a little lower. */
function urls(p: Page): string[] {
  const vi = `${SITE_URL}${p.path}`;
  const lastmod = p.lastmod ? `<lastmod>${esc(p.lastmod)}</lastmod>` : '';
  const url = (loc: string, priority: number, links = '') => `<url><loc>${esc(loc)}</loc>${lastmod}<priority>${priority.toFixed(1)}</priority>${links}</url>`;
  if (p.langs === 'one') return [url(vi, p.priority)];
  const langs: readonly Lang[] = p.langs === 'every' ? LANGS : ['vi', 'en'];
  const links = [...langs.map((l) => [l, at(vi, l)] as const), ['x-default', vi] as const]
    .map(([l, href]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(href)}"/>`).join('');
  return langs.map((l) => url(at(vi, l), l === 'vi' ? p.priority : Math.round(p.priority * (l === 'en' ? 8 : 6)) / 10, links));
}

export async function GET(): Promise<Response> {
  let pages: Page[] | null = null;
  try {
    pages = (await api<{ pages: Page[] }>('/seo/sitemap', { revalidate: 0 }))?.pages ?? null;
  } catch { /* the API did not answer: below */ }
  if (!pages) {
    return new Response('Sitemap unavailable, try again shortly.\n', {
      status: 503, headers: { 'content-type': 'text/plain; charset=utf-8', 'retry-after': '300', 'cache-control': 'no-store' },
    });
  }
  // One file holds 50,000 addresses at most (the sitemap protocol's limit).
  const body = pages.flatMap(urls).slice(0, 50_000);
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    + body.join('\n') + '\n</urlset>\n';
  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      // Browsers ask again each time; Vercel's CDN keeps it 15 minutes and refreshes it behind the scenes.
      'cache-control': 'public, max-age=0, must-revalidate',
      'vercel-cdn-cache-control': 'max-age=900, stale-while-revalidate=900',
    },
  });
}
