/**
 * The head of every public page the API describes (GET /seo/…): title, description, canonical
 * and hreflang links, Open Graph. Used by the Kính đêm pages.
 */
import type { Metadata } from 'next';
import { api, type ArtistSeo, type BlogSeo, type CollectionSeo, type DirectorySeo, type EventSeo, type Lang, type OrganizerSeo, type ProjectSeo } from '@/lib/api';
import { LANGS, tx } from '@/kd/copy';

/**
 * The page in every language (design v2 phase 10): the API names the Vietnamese and English
 * addresses; Thai, Japanese and Indonesian are the Vietnamese one with ?lang=<it>.
 */
const withLang = (url: string, l: Lang) => (l === 'vi' ? url : url + (url.includes('?') ? '&' : '?') + 'lang=' + l);
/** A page's address in every language, for its hreflang links. */
export const everyLang = (vi: string): Record<string, string> => ({ ...Object.fromEntries(LANGS.map((l) => [l, withLang(vi, l)])), 'x-default': vi });
const OG_LOCALE: Record<Lang, string> = { vi: 'vi_VN', en: 'en_US', th: 'th_TH', ja: 'ja_JP', id: 'id_ID' };
const ogLocales = (lang: Lang) => ({ locale: OG_LOCALE[lang], alternateLocale: LANGS.filter((l) => l !== lang).map((l) => OG_LOCALE[l]) });
/** The home page's addresses in every language. */
export const homeAlternates = everyLang('/');

export type Kind = 'events' | 'organizers' | 'collections' | 'artists' | 'projects' | 'blog';
export type Props = { params: Promise<{ slug: string }> };

export const load = async (kind: Kind, slug: string, lang: Lang) =>
  api<EventSeo | OrganizerSeo | CollectionSeo | ArtistSeo | ProjectSeo | BlogSeo>(`/seo/${kind}/${encodeURIComponent(slug)}${lang === 'vi' ? '' : '?lang=en'}`);

const MISSING = {
  events: { vi: 'Không tìm thấy sự kiện', en: 'Event not found' },
  organizers: { vi: 'Không tìm thấy nhà tổ chức', en: 'Organiser not found' },
  collections: { vi: 'Không tìm thấy bộ sưu tập', en: 'Collection not found' },
  artists: { vi: 'Không tìm thấy nghệ sĩ', en: 'Artist not found' },
  projects: { vi: 'Không tìm thấy dự án', en: 'Project not found' },
  blog: { vi: 'Không tìm thấy bài viết', en: 'Post not found' },
};

export const seoMetadata = (kind: Kind, lang: Lang) => async ({ params }: Props): Promise<Metadata> => {
  const seo = await load(kind, (await params).slug, lang);
  if (!seo) return { title: tx(MISSING[kind], lang) };
  const url = withLang(seo.alternates.vi, lang);
  // A post's pages: one per language it is written in (services/seo/blog.ts).
  if (seo.kind === 'blog') {
    return {
      title: { absolute: seo.title }, description: seo.description, robots: seo.robots,
      alternates: {
        canonical: seo.canonical, types: { 'text/markdown': seo.markdown },
        // Written in both languages: two pages that name each other.
        ...(seo.alternates.vi !== seo.alternates.en ? { languages: { vi: seo.alternates.vi, en: seo.alternates.en, 'x-default': seo.alternates.vi } } : {}),
      },
      openGraph: {
        type: 'article', url: seo.canonical, siteName: 'FeestFinder', title: seo.page.h1, description: seo.description, publishedTime: seo.publishedAt ?? undefined, modifiedTime: seo.updatedAt,
        images: [{ url: seo.image.url, width: seo.image.width, height: seo.image.height, alt: seo.image.alt, type: seo.image.type }],
      },
      twitter: { card: 'summary_large_image', title: seo.page.h1, description: seo.description, images: [{ url: seo.image.url, alt: seo.image.alt }] },
    };
  }
  return {
    title: { absolute: seo.title },
    description: seo.description,
    robots: seo.robots,
    alternates: {
      canonical: lang === 'vi' || lang === 'en' ? seo.canonical : url,
      languages: everyLang(seo.alternates.vi),
      types: { 'text/markdown': seo.markdown },
    },
    openGraph: {
      type: seo.kind === 'organizer' || seo.kind === 'artist' ? 'profile' : 'website', url: lang === 'vi' || lang === 'en' ? seo.url : url, siteName: 'FeestFinder', title: seo.page.h1, description: seo.description,
      ...ogLocales(lang),
      images: [{ url: seo.image.url, width: seo.image.width, height: seo.image.height, alt: seo.image.alt, type: seo.image.type }],
    },
    twitter: { card: 'summary_large_image', title: seo.page.h1, description: seo.description, images: [{ url: seo.image.url, alt: seo.image.alt }] },
  };
};

/*
 * The artist directory: /a, /a/style/<style> and /a/city/<city>, each with ?lang=en rewritten
 * to an /en page of its own. The key names the list the API builds (/seo/directory/:key).
 */
export type DirProps = { params: Promise<{ slug?: string }> };
export type DirKey = (slug?: string) => string;

export const loadDir = (key: string, lang: Lang) => api<DirectorySeo>(`/seo/directory/${encodeURIComponent(key)}${lang === 'vi' ? '' : '?lang=en'}`);

export const directoryMetadata = (keyOf: DirKey, lang: Lang) => async ({ params }: DirProps): Promise<Metadata> => {
  const seo = await loadDir(keyOf((await params).slug), lang);
  if (!seo) return { title: lang === 'vi' ? 'Không tìm thấy danh sách nghệ sĩ' : 'No such artist list' };
  return {
    title: { absolute: seo.title },
    description: seo.description,
    robots: seo.robots,
    alternates: {
      canonical: lang === 'vi' || lang === 'en' ? seo.canonical : withLang(seo.alternates.vi, lang),
      languages: everyLang(seo.alternates.vi),
      types: { 'text/markdown': seo.markdown },
    },
    openGraph: {
      type: 'website', url: lang === 'vi' || lang === 'en' ? seo.url : withLang(seo.alternates.vi, lang), siteName: 'FeestFinder', title: seo.page.h1, description: seo.description,
      ...ogLocales(lang),
      images: [{ url: seo.image.url, width: seo.image.width, height: seo.image.height, alt: seo.image.alt, type: seo.image.type }],
    },
  };
};

