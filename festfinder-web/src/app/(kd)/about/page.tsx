import type { Metadata } from 'next';
import { ABOUT } from '@/kd/web/about/copy';
import { langOf, sitePageMetadata, type SearchProps } from '@/kd/web/about/meta';
import { AboutPage } from '@/kd/web/about/page';

// /about, and /about?lang=en in English.
export async function generateMetadata({ searchParams }: SearchProps): Promise<Metadata> {
  return sitePageMetadata('/about', ABOUT.title, ABOUT.metaDesc, await langOf(searchParams));
}

export default async function Page({ searchParams }: SearchProps) {
  return <AboutPage lang={await langOf(searchParams)} />;
}
