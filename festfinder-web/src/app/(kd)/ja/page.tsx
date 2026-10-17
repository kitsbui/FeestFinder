import type { Metadata } from 'next';
import { ListPage } from '@/kd/web/list/page';
import { homeAlternates } from '@/components/seo-meta';

// /?lang=ja, rewritten here in next.config.ts (design v2 phase 10).
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: 'FeestFinder — EDMのクラブナイト、レイブ、フェス' },
  alternates: { canonical: '/?lang=ja', languages: homeAlternates },
};

export default function Page() {
  return <ListPage lang="ja" />;
}
