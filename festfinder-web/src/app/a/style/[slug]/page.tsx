import { DirectoryPage, directoryMetadata } from '@/components/seo-page';

export const revalidate = 300;

// The artists playing one style. Rendered on the first visit, then served from cache.

export async function generateStaticParams() {
  return [];
}

const key = (slug?: string) => `style:${slug}`;
export const generateMetadata = directoryMetadata(key, 'vi');
export default DirectoryPage(key, 'vi');
