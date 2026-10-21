import type { MetadataRoute } from 'next';
import { apiOr, SITE_URL } from '@/lib/api';
import { LANGS, type Lang } from '@/kd/copy';

// Rebuilt at most every 15 minutes: new listings reach search engines the same hour.
export const revalidate = 900;

/**
 * A page the API lists (GET /seo/sitemap, services/seo/crawlers.ts `sitemapPages`): in every
 * language the site speaks, in Vietnamese and English (a blog post written in both), or in one.
 */
type Page = { path: string; lastmod?: string; priority: number; langs: 'every' | 'pair' | 'one' };

const at = (vi: string, l: Lang) => (l === 'vi' ? vi : `${vi}?lang=${l}`);

/** A page's addresses, each naming the others: Vietnamese first, the other languages a little lower. */
function entries(p: Page): MetadataRoute.Sitemap {
  const vi = `${SITE_URL}${p.path}`;
  const entry = { lastModified: p.lastmod };
  if (p.langs === 'one') return [{ url: vi, ...entry, priority: p.priority }];
  // Five languages for the pages that speak them (design v2 phase 10); a post has its two.
  const langs: readonly Lang[] = p.langs === 'every' ? LANGS : ['vi', 'en'];
  const alternates = { languages: { ...Object.fromEntries(langs.map((l) => [l, at(vi, l)])), 'x-default': vi } };
  return langs.map((l) => ({ url: at(vi, l), ...entry, priority: l === 'vi' ? p.priority : Math.round(p.priority * (l === 'en' ? 8 : 6)) / 10, alternates }));
}

/** Every public page worth a search result: events, organisers, artists, collections, projects, the blog, the directory, about. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const out = await apiOr<{ pages: Page[] } | null>('/seo/sitemap', null, { revalidate: 900 });
  const pages: Page[] = out?.pages ?? [{ path: '/', priority: 1, langs: 'every' }, { path: '/about', priority: 0.3, langs: 'every' }];
  // One file holds 50,000 addresses at most (the sitemap protocol's limit).
  return pages.flatMap(entries).slice(0, 50_000);
}
