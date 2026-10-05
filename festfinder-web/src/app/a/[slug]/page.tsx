import { SeoPage, seoMetadata } from '@/components/seo-page';

export const revalidate = 300;

// An artist's page. Rendered on the first visit, then served from cache and refreshed in the background.
export async function generateStaticParams() {
  return [];
}

export const generateMetadata = seoMetadata('artists', 'vi');
export default SeoPage('artists', 'vi');
