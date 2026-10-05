import { DirectoryPage, directoryMetadata } from '@/components/seo-page';

export const revalidate = 300;

// /a?lang=en, rewritten here in next.config.ts. Rendered on the first visit, then served from cache.

const key = () => 'all';
export const generateMetadata = directoryMetadata(key, 'en');
export default DirectoryPage(key, 'en');
