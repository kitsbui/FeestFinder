import { DirectoryPage, directoryMetadata } from '@/components/seo-page';

export const revalidate = 300;

// /a/city/<city>?lang=en, rewritten here in next.config.ts. Rendered on the first visit, then served from cache.

export async function generateStaticParams() {
  return [];
}

const key = (slug?: string) => `city:${slug}`;
export const generateMetadata = directoryMetadata(key, 'en');
export default DirectoryPage(key, 'en');
