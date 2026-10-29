import type { Metadata } from 'next';
import { ListPage } from '@/kd/web/list/page';
import { homeMetadata } from '@/components/seo-meta';

// /?lang=id, rewritten here in next.config.ts (design v2 phase 10).
export const revalidate = 60;

export const metadata: Metadata = homeMetadata('id');

export default function Page() {
  return <ListPage lang="id" />;
}
