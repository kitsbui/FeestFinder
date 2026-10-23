import type { Metadata } from 'next';
import { homeMetadata } from '@/components/seo-meta';
import { cityPage, cityParams } from '@/kd/web/list/city';

// /?city=<slug> while nothing else narrows the list, rewritten here in next.config.ts: the home page
// with that city's nights drawn on the server. Its address and its head stay the home page's.
export const revalidate = 60;
export const generateStaticParams = cityParams;

export const metadata: Metadata = homeMetadata('vi');

export default cityPage('vi');
