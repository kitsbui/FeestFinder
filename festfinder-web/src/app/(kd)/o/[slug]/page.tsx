import { notFound } from 'next/navigation';
import { seoMetadata } from '@/components/seo-meta';
import { OrgPage, loadOrg } from '@/kd/web/org/page';

export const revalidate = 300;

// Rendered on the first visit, then served from cache and refreshed in the background.
export async function generateStaticParams() {
  return [];
}

export const generateMetadata = seoMetadata('organizers', 'vi');

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const data = await loadOrg((await params).slug, 'vi');
  if (!data) notFound();
  return <OrgPage org={data.org} seo={data.seo} lang="vi" />;
}
