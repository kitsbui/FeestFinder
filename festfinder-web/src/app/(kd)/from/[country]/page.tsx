import type { Metadata } from 'next';
import { homeMetadata } from '@/components/seo-meta';
import { countryPage, countryParams } from '@/kd/web/list/city';

// The home page for a visitor from a listed country (src/proxy.ts, kd/home-place.ts): every city, that
// country's nights first, drawn on the server. Its address and its head stay the home page's.
export const revalidate = 60;
export const generateStaticParams = countryParams;

export const metadata: Metadata = homeMetadata('vi');

export default countryPage('vi');
