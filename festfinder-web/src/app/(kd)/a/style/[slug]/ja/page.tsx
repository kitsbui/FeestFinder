import { directoryMetadata } from '@/components/seo-meta';
import { directoryRoute } from '@/kd/web/directory/page';

export const revalidate = 300;

// /a/style/<style>?lang=ja, rewritten here in next.config.ts. Rendered on the first visit, then served from cache.
export async function generateStaticParams() {
  return [];
}

export const generateMetadata = directoryMetadata((slug) => `style:${slug}`, 'ja');
export default directoryRoute((slug) => ({ style: slug }), 'ja');
