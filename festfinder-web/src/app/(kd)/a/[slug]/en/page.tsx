import { notFound } from 'next/navigation';
import { seoMetadata } from '@/components/seo-meta';
import { ArtistPage, loadArtist } from '@/kd/web/artist/page';

export const revalidate = 300;

// /a/<slug>?lang=en, rewritten here in next.config.ts.
// Rendered on the first visit, then served from cache and refreshed in the background.
export async function generateStaticParams() {
  return [];
}

export const generateMetadata = seoMetadata('artists', 'en');

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const data = await loadArtist((await params).slug, 'en');
  if (!data) notFound();
  return <ArtistPage data={data.data} seo={data.seo} lang="en" />;
}
