import type { Metadata } from 'next';
import { KdProvider } from '@/kd/runtime';
import { WebFooter, WebNav } from '@/kd/web/chrome';
import { FanProfile } from '@/kd/web/fan/page';

// The signed-in person's own page: nothing here for a search engine.
export const metadata: Metadata = { title: 'Hồ sơ của tôi', robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const lang = (await searchParams).lang === 'en' ? 'en' : 'vi';
  return (
    <KdProvider lang={lang}>
      <div className="flex min-h-dvh flex-col" lang={lang}>
        <WebNav lang={lang} />
        <FanProfile lang={lang} />
        <div className="mt-auto"><WebFooter lang={lang} otherLang={lang === 'vi' ? { href: '/profile?lang=en', label: 'English' } : { href: '/profile', label: 'Tiếng Việt' }} /></div>
      </div>
    </KdProvider>
  );
}
