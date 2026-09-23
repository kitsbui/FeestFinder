import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import WebScreen from '@/surfaces/web';
import { EventSummary } from '@/components/summaries';
import { api, eventJsonLd, jsonLdHtml, price, SITE_URL, text, when, type EventDetail } from '@/lib/api';

export const revalidate = 60;

// Rendered on the first visit, then served from cache and refreshed in the background.
export async function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ slug: string }> };

const load = (slug: string) => api<EventDetail>(`/events/${encodeURIComponent(slug)}`);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const e = await load(slug);
  if (!e) return { title: 'Không tìm thấy sự kiện' };
  const description = [when(e, 'vi'), e.venue.name, price(e, 'vi'), text(e.description, 'vi')].filter(Boolean).join(' · ').slice(0, 300);
  const url = `${SITE_URL}/e/${e.slug}`;
  return {
    title: e.title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, title: e.title, description, images: e.coverUrl ? [{ url: e.coverUrl, width: 1600, height: 900 }] : undefined },
    twitter: { card: e.coverUrl ? 'summary_large_image' : 'summary', title: e.title, description },
  };
}

export default async function EventPage({ params }: Params) {
  const { slug } = await params;
  const e = await load(slug);
  if (!e) notFound();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(eventJsonLd(e, `${SITE_URL}/e/${e.slug}`)) }} />
      <WebScreen>
        <EventSummary e={e} />
      </WebScreen>
    </>
  );
}
