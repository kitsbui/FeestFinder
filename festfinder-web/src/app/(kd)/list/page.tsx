import type { Metadata } from 'next';
import { ListPage } from '@/kd/web/list/page';

export const metadata: Metadata = {
  title: 'Tất cả sự kiện',
  alternates: { canonical: '/list', languages: { vi: '/list', en: '/list?lang=en' } },
};

// The listing changes as events are added and approved; a minute is fresh enough.
export const revalidate = 60;

export default function Page() {
  return <ListPage lang="vi" />;
}
