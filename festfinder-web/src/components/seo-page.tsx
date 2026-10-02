import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import WebScreen from '@/surfaces/web';
import { EventSummary, OrganizerSummary } from '@/components/summaries';
import { api, jsonLdHtml, type EventSeo, type Lang, type OrganizerSeo } from '@/lib/api';

/*
 * An event or organiser page in one language: Vietnamese at /e/<slug>, English at
 * /e/<slug>?lang=en (which next.config.ts rewrites to /e/<slug>/en, so both stay cached pages);
 * the same for /o/<slug>. The API builds the head, the structured data and the facts, the same
 * as for its own pages.
 */

type Kind = 'events' | 'organizers';
type Props = { params: Promise<{ slug: string }> };

const load = async (kind: Kind, slug: string, lang: Lang) =>
  api<EventSeo | OrganizerSeo>(`/seo/${kind}/${encodeURIComponent(slug)}${lang === 'en' ? '?lang=en' : ''}`);

const MISSING = {
  events: { vi: 'Không tìm thấy sự kiện', en: 'Event not found' },
  organizers: { vi: 'Không tìm thấy nhà tổ chức', en: 'Organiser not found' },
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
      type: seo.kind === 'organizer' ? 'profile' : 'website', url: seo.url, siteName: 'FeestFinder', title: seo.page.h1, description: seo.description,
      locale: vi ? 'vi_VN' : 'en_US', alternateLocale: [vi ? 'en_US' : 'vi_VN'],
      images: [{ url: seo.image.url, width: seo.image.width, height: seo.image.height, alt: seo.image.alt, type: seo.image.type }],
    },
    twitter: { card: 'summary_large_image', title: seo.page.h1, description: seo.description, images: [{ url: seo.image.url, alt: seo.image.alt }] },
  };
};

export const SeoPage = (kind: Kind, lang: Lang) => async function Page({ params }: Props) {
  const seo = await load(kind, (await params).slug, lang);
  if (!seo) notFound();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(seo.jsonLd) }} />
      <WebScreen>{seo.kind === 'event' ? <EventSummary seo={seo} /> : <OrganizerSummary seo={seo} />}</WebScreen>
    </>
  );
};
