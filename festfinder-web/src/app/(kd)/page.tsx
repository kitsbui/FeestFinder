import type { Metadata } from 'next';
import { ListPage } from '@/kd/web/list/page';

// The home page is the list of every event (owner, 2026-10-17); /list redirects here.
export const metadata: Metadata = {
  alternates: { canonical: '/', languages: { vi: '/', en: '/?lang=en', 'x-default': '/' } },
};

// The listing changes as events are added and approved; a minute is fresh enough.
export const revalidate = 60;

export default function Page() {
  return <ListPage lang="vi" />;
}
