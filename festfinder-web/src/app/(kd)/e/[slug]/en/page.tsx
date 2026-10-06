import { notFound } from 'next/navigation';
import { seoMetadata } from '@/components/seo-meta';
import { EventPage, loadEvent } from '@/kd/web/event/page';

export const revalidate = 60;

// /e/<slug>?lang=en, rewritten here in next.config.ts. Rendered on the first visit, then cached.
export async function generateStaticParams() {
  return [];
}

export const generateMetadata = seoMetadata('events', 'en');

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const data = await loadEvent((await params).slug, 'en');
  if (!data) notFound();
  return <EventPage ev={data.ev} seo={data.seo} lang="en" />;
}
