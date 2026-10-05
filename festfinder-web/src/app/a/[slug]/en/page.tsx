import { SeoPage, seoMetadata } from '@/components/seo-page';

export const revalidate = 300;

// /a/<slug>?lang=en, rewritten here in next.config.ts. Rendered on the first visit, then cached.
export async function generateStaticParams() {
  return [];
}

export const generateMetadata = seoMetadata('artists', 'en');
export default SeoPage('artists', 'en');
