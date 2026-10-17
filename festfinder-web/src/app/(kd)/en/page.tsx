import type { Metadata } from 'next';
import { ListPage } from '@/kd/web/list/page';

// /?lang=en, rewritten here in next.config.ts.
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: 'FeestFinder — EDM club nights, raves and festivals' },
  alternates: { canonical: '/?lang=en', languages: { vi: '/', en: '/?lang=en', 'x-default': '/' } },
};

export default function Page() {
  return <ListPage lang="en" />;
}
