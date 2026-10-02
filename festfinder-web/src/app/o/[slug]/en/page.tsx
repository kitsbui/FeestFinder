import { SeoPage, seoMetadata } from '@/components/seo-page';

export const revalidate = 300;

// /o/<slug>?lang=en, rewritten here in next.config.ts. Rendered on the first visit, then cached.
export async function generateStaticParams() {
  return [];
}

export const generateMetadata = seoMetadata('organizers', 'en');
export default SeoPage('organizers', 'en');
