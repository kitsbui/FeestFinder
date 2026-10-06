import type { Metadata } from 'next';
import { ListPage } from '@/kd/web/list/page';

// /list?lang=en, rewritten here in next.config.ts.
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Every event',
  alternates: { canonical: '/list?lang=en', languages: { vi: '/list', en: '/list?lang=en' } },
};

export default function Page() {
  return <ListPage lang="en" />;
}
