import { SeoPage, seoMetadata } from '@/components/seo-page';

export const revalidate = 60;

// /e/<slug>?lang=en, rewritten here in next.config.ts. Rendered on the first visit, then cached.
export async function generateStaticParams() {
  return [];
}

export const generateMetadata = seoMetadata('events', 'en');
export default SeoPage('events', 'en');
