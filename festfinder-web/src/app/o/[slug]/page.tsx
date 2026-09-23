import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import WebScreen from '@/surfaces/web';
import { OrganizerSummary } from '@/components/summaries';
import { api, jsonLdHtml, SITE_URL, text, type Organizer } from '@/lib/api';

export const revalidate = 300;

// Rendered on the first visit, then served from cache and refreshed in the background.
export async function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ slug: string }> };

const load = (slug: string) => api<Organizer>(`/organizers/${encodeURIComponent(slug)}`);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const o = await load(slug);
  if (!o) return { title: 'Không tìm thấy nhà tổ chức' };
  const url = `${SITE_URL}/o/${o.slug}`;
  return {
    title: o.name,
    description: text(o.bio, 'vi').slice(0, 300) || `${o.name} trên FeestFinder`,
    alternates: { canonical: url },
    openGraph: { type: 'profile', url, title: o.name, images: o.logoUrl ? [{ url: o.logoUrl }] : undefined },
  };
}

export default async function OrganizerPage({ params }: Params) {
  const { slug } = await params;
  const o = await load(slug);
  if (!o) notFound();
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: o.name,
    url: `${SITE_URL}/o/${o.slug}`,
    logo: o.logoUrl ?? undefined,
    sameAs: o.website ? [o.website] : undefined,
    description: text(o.bio, 'vi') || undefined,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(ld) }} />
      <WebScreen>
        <OrganizerSummary o={o} />
      </WebScreen>
    </>
  );
}
