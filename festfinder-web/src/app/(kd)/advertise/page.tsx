import type { Metadata } from 'next';
import { langOf, sitePageMetadata, type SearchProps } from '@/kd/web/about/meta';
import { ADVERTISE } from '@/kd/web/advertise/copy';
import { AdvertisePage } from '@/kd/web/advertise/page';

// /advertise, and /advertise?lang=en in English.
export async function generateMetadata({ searchParams }: SearchProps): Promise<Metadata> {
  return sitePageMetadata('/advertise', ADVERTISE.title, ADVERTISE.metaDesc, await langOf(searchParams));
}

export default async function Page({ searchParams }: SearchProps) {
  return <AdvertisePage lang={await langOf(searchParams)} />;
}
