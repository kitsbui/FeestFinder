import { notFound } from 'next/navigation';
import { seoMetadata } from '@/components/seo-meta';
import { EventPage, loadEvent } from '@/kd/web/event/page';

export const revalidate = 60;

// /e/<slug>?lang=id, rewritten here in next.config.ts. Rendered on the first visit, then cached.
export async function generateStaticParams() {
  return [];
}

export const generateMetadata = seoMetadata('events', 'id');

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const data = await loadEvent((await params).slug, 'id');
  if (!data) notFound();
  return <EventPage ev={data.ev} seo={data.seo} lang="id" />;
}
