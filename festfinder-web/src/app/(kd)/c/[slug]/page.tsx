import { notFound } from 'next/navigation';
import { seoMetadata } from '@/components/seo-meta';
import { CollectionPage, loadCollection } from '@/kd/web/collection/page';

export const revalidate = 300;

// A collection someone made public. Rendered on the first visit, then served from cache and refreshed in the background.
export async function generateStaticParams() {
  return [];
}

export const generateMetadata = seoMetadata('collections', 'vi');

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const data = await loadCollection((await params).slug, 'vi');
  if (!data) notFound();
  return <CollectionPage col={data.col} seo={data.seo} lang="vi" />;
}
