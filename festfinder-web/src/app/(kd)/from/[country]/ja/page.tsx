import type { Metadata } from 'next';
import { homeMetadata } from '@/components/seo-meta';
import { countryPage, countryParams } from '@/kd/web/list/city';

// /?lang=ja for a visitor from a listed country, rewritten here by src/proxy.ts (kd/home-place.ts).
export const revalidate = 60;
export const generateStaticParams = countryParams;

export const metadata: Metadata = homeMetadata('ja');

export default countryPage('ja');
