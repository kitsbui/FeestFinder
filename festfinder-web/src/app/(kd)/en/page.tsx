import type { Metadata } from 'next';
import { ListPage } from '@/kd/web/list/page';
import { homeMetadata } from '@/components/seo-meta';

// /?lang=en, rewritten here in next.config.ts.
export const revalidate = 60;

export const metadata: Metadata = homeMetadata('en');

export default function Page() {
  return <ListPage lang="en" />;
}
