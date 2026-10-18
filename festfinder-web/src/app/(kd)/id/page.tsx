import type { Metadata } from 'next';
import { ListPage } from '@/kd/web/list/page';
import { homeAlternates } from '@/components/seo-meta';

// /?lang=id, rewritten here in next.config.ts (design v2 phase 10).
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: 'FeestFinder — Malam klub, rave, dan festival EDM' },
  alternates: { canonical: '/?lang=id', languages: homeAlternates },
};

export default function Page() {
  return <ListPage lang="id" />;
}
