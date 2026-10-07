import { directoryMetadata } from '@/components/seo-meta';
import { directoryRoute } from '@/kd/web/directory/page';

export const revalidate = 300;

// The artists based in or playing one city. Rendered on the first visit, then served from cache.
export async function generateStaticParams() {
  return [];
}

export const generateMetadata = directoryMetadata((slug) => `city:${slug}`, 'vi');
export default directoryRoute((slug) => ({ city: slug }), 'vi');
