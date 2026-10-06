/**
 * The head of every public page the API describes (GET /seo/…): title, description, canonical
 * and hreflang links, Open Graph. Shared by the legacy pages (seo-page.tsx) and the Kính đêm
 * ones, so it imports no screen.
 */
import type { Metadata } from 'next';
import { api, type ArtistSeo, type CollectionSeo, type DirectorySeo, type EventSeo, type Lang, type OrganizerSeo } from '@/lib/api';

export type Kind = 'events' | 'organizers' | 'collections' | 'artists';
export type Props = { params: Promise<{ slug: string }> };

export const load = async (kind: Kind, slug: string, lang: Lang) =>
  api<EventSeo | OrganizerSeo | CollectionSeo | ArtistSeo>(`/seo/${kind}/${encodeURIComponent(slug)}${lang === 'en' ? '?lang=en' : ''}`);

const MISSING = {
  events: { vi: 'Không tìm thấy sự kiện', en: 'Event not found' },
  organizers: { vi: 'Không tìm thấy nhà tổ chức', en: 'Organiser not found' },
  collections: { vi: 'Không tìm thấy bộ sưu tập', en: 'Collection not found' },
  artists: { vi: 'Không tìm thấy nghệ sĩ', en: 'Artist not found' },
};

export const seoMetadata = (kind: Kind, lang: Lang) => async ({ params }: Props): Promise<Metadata> => {
  const seo = await load(kind, (await params).slug, lang);
  if (!seo) return { title: MISSING[kind][lang] };
  const vi = seo.lang === 'vi';
  return {
    title: { absolute: seo.title },
    description: seo.description,
    robots: seo.robots,
    alternates: {
      canonical: seo.canonical,
      languages: { vi: seo.alternates.vi, en: seo.alternates.en, 'x-default': seo.alternates['x-default'] },
      types: { 'text/markdown': seo.markdown },
    },
    openGraph: {
      type: seo.kind === 'organizer' || seo.kind === 'artist' ? 'profile' : 'website', url: seo.url, siteName: 'FeestFinder', title: seo.page.h1, description: seo.description,
      locale: vi ? 'vi_VN' : 'en_US', alternateLocale: [vi ? 'en_US' : 'vi_VN'],
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

export const loadDir = (key: string, lang: Lang) => api<DirectorySeo>(`/seo/directory/${encodeURIComponent(key)}${lang === 'en' ? '?lang=en' : ''}`);

export const directoryMetadata = (keyOf: DirKey, lang: Lang) => async ({ params }: DirProps): Promise<Metadata> => {
  const seo = await loadDir(keyOf((await params).slug), lang);
  if (!seo) return { title: lang === 'vi' ? 'Không tìm thấy danh sách nghệ sĩ' : 'No such artist list' };
  return {
    title: { absolute: seo.title },
    description: seo.description,
    robots: seo.robots,
    alternates: {
      canonical: seo.canonical,
      languages: { vi: seo.alternates.vi, en: seo.alternates.en, 'x-default': seo.alternates['x-default'] },
      types: { 'text/markdown': seo.markdown },
    },
    openGraph: {
      type: 'website', url: seo.url, siteName: 'FeestFinder', title: seo.page.h1, description: seo.description,
      locale: seo.lang === 'vi' ? 'vi_VN' : 'en_US', alternateLocale: [seo.lang === 'vi' ? 'en_US' : 'vi_VN'],
      images: [{ url: seo.image.url, width: seo.image.width, height: seo.image.height, alt: seo.image.alt, type: seo.image.type }],
    },
  };
};

