import { directoryMetadata } from '@/components/seo-meta';
import { directoryRoute } from '@/kd/web/directory/page';

// No dynamic segment, so Next would render it at build time, when the API may not be there:
// rendered on request instead (the API caches the list for five minutes).
export const dynamic = 'force-dynamic';

// /a?lang=en (and its filters), rewritten here in next.config.ts.

const scope = () => ({});
export const generateMetadata = directoryMetadata(() => 'all', 'en');
export default directoryRoute(scope, 'en', { query: true });
