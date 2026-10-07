import { directoryMetadata } from '@/components/seo-meta';
import { directoryRoute } from '@/kd/web/directory/page';

export const revalidate = 300;

// The artists playing one style. Rendered on the first visit, then served from cache.
export async function generateStaticParams() {
  return [];
}

export const generateMetadata = directoryMetadata((slug) => `style:${slug}`, 'vi');
export default directoryRoute((slug) => ({ style: slug }), 'vi');
