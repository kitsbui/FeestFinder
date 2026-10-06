import type { Metadata } from 'next';
import { HomePage } from '@/kd/web/home/page';

// /?lang=en, rewritten here in next.config.ts.
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: 'FeestFinder — festivals, gigs and night markets' },
  alternates: { canonical: '/?lang=en', languages: { vi: '/', en: '/?lang=en', 'x-default': '/' } },
};

export default function Page() {
  return <HomePage lang="en" />;
}
