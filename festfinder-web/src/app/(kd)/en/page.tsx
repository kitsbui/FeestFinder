import type { Metadata } from 'next';
import { ListPage } from '@/kd/web/list/page';
import { homeAlternates } from '@/components/seo-meta';

// /?lang=en, rewritten here in next.config.ts.
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: 'FeestFinder — EDM club nights, raves and festivals' },
  alternates: { canonical: '/?lang=en', languages: homeAlternates },
};

export default function Page() {
  return <ListPage lang="en" />;
}
