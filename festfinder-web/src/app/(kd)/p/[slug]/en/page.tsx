import { notFound } from 'next/navigation';
import { seoMetadata } from '@/components/seo-meta';
import { loadProject, ProjectPage } from '@/kd/web/projects/page';

export const revalidate = 120;

// A public project, in English (?lang=en, rewritten here in next.config.ts). Rendered on the first visit, then served from cache and refreshed in the background.
export async function generateStaticParams() {
  return [];
}

export const generateMetadata = seoMetadata('projects', 'en');

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const data = await loadProject((await params).slug, 'en');
  if (!data) notFound();
  return <ProjectPage p={data.p} seo={data.seo} lang="en" />;
}
