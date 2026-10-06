import type { Metadata } from 'next';
import { HomePage } from '@/kd/web/home/page';

export const metadata: Metadata = {
  alternates: { canonical: '/', languages: { vi: '/', en: '/?lang=en', 'x-default': '/' } },
};

// The listing changes as events are added and approved; a minute is fresh enough.
export const revalidate = 60;

export default function Page() {
  return <HomePage lang="vi" />;
}
