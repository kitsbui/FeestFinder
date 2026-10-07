import { directoryMetadata } from '@/components/seo-meta';
import { directoryRoute } from '@/kd/web/directory/page';

// No dynamic segment, so Next would render it at build time, when the API may not be there:
// rendered on request instead (the API caches the list for five minutes).
export const dynamic = 'force-dynamic';

// The artist directory: every artist, next show first, or the ones its query's filters name.

const scope = () => ({});
export const generateMetadata = directoryMetadata(() => 'all', 'vi');
export default directoryRoute(scope, 'vi', { query: true });
