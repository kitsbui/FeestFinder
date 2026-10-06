import { notFound } from 'next/navigation';
import { seoMetadata } from '@/components/seo-meta';
import { EventPage, loadEvent } from '@/kd/web/event/page';

export const revalidate = 60;

// Rendered on the first visit, then served from cache and refreshed in the background.
export async function generateStaticParams() {
  return [];
}

export const generateMetadata = seoMetadata('events', 'vi');

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const data = await loadEvent((await params).slug, 'vi');
  if (!data) notFound();
  return <EventPage ev={data.ev} seo={data.seo} lang="vi" />;
}
