import { SeoPage, seoMetadata } from '@/components/seo-page';

export const revalidate = 300;

// A collection someone made public. Rendered on the first visit, then served from cache.
export async function generateStaticParams() {
  return [];
}

export const generateMetadata = seoMetadata('collections', 'vi');
export default SeoPage('collections', 'vi');
