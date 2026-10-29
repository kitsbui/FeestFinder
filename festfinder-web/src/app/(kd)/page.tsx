import type { Metadata } from 'next';
import { ListPage } from '@/kd/web/list/page';
import { homeMetadata } from '@/components/seo-meta';

// The home page is the list of every event (owner, 2026-10-17); /list redirects here. One city's
// list, /?city=<slug>, is in/[city].
export const metadata: Metadata = homeMetadata('vi');

// The listing changes as events are added and approved; a minute is fresh enough.
export const revalidate = 60;

export default function Page() {
  return <ListPage lang="vi" />;
}
