import { DirectoryPage, directoryMetadata } from '@/components/seo-page';

export const revalidate = 300;

// The artist directory: every artist, next show first. Rendered on the first visit, then served from cache.

const key = () => 'all';
export const generateMetadata = directoryMetadata(key, 'vi');
export default DirectoryPage(key, 'vi');
