import { notFound } from 'next/navigation';
import { seoMetadata } from '@/components/seo-meta';
import { BlogPostPage, loadPost } from '@/kd/web/blog/page';

export const revalidate = 120;

// A published post in the English frame (?lang=en, rewritten here in next.config.ts). Rendered on the first visit, then served from cache and refreshed in the background.
export async function generateStaticParams() {
  return [];
}

export const generateMetadata = seoMetadata('blog', 'en');

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const data = await loadPost((await params).slug, 'en');
  if (!data) notFound();
  return <BlogPostPage post={data.post} seo={data.seo} coverInline={data.inline} lang="en" />;
}
