import { DirectoryPage, directoryMetadata } from '@/components/seo-page';

// No dynamic segment, so Next would render it at build time, when the API may not be there:
// rendered on request instead (the API caches the list for five minutes).
export const dynamic = 'force-dynamic';

// /a?lang=en, rewritten here in next.config.ts.

const key = () => 'all';
export const generateMetadata = directoryMetadata(key, 'en');
export default DirectoryPage(key, 'en');
