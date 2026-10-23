import type { Metadata } from 'next';
import { homeMetadata } from '@/components/seo-meta';
import { cityPage, cityParams } from '@/kd/web/list/city';

// /?city=<slug>&lang=th while nothing else narrows the list, rewritten here in next.config.ts.
export const revalidate = 60;
export const generateStaticParams = cityParams;

export const metadata: Metadata = homeMetadata('th');

export default cityPage('th');
