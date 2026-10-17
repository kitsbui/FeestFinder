import { directoryMetadata } from '@/components/seo-meta';
import { directoryRoute } from '@/kd/web/directory/page';

// No dynamic segment, so Next would render it at build time, when the API may not be there:
// rendered on request instead (the API caches the list for five minutes).
export const dynamic = 'force-dynamic';

// /a?lang=id (and its filters), rewritten here in next.config.ts.

const scope = () => ({});
export const generateMetadata = directoryMetadata(() => 'all', 'id');
export default directoryRoute(scope, 'id', { query: true });
