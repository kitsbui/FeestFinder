import type { Metadata } from 'next';
import { KdProvider } from '@/kd/runtime';
import { WebNav } from '@/kd/web/chrome';
import { SavedPage } from '@/kd/web/saved/page';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// The signed-in person's saved events and collections: nothing here for a search engine.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const en = (await searchParams).lang === 'en';
  return { title: en ? 'Saved' : 'Đã lưu', robots: { index: false, follow: false } };
}

export default async function Page({ searchParams }: Props) {
  const q = await searchParams;
  const lang = q.lang === 'en' ? 'en' : 'vi';
  // /saved?c=<id> opens one of the person's collections; the browser checks it is theirs.
  const c = typeof q.c === 'string' && q.c.length <= 64 ? q.c : null;
  return (
    <KdProvider lang={lang}>
      <div className="flex min-h-dvh flex-col" lang={lang}>
        <WebNav lang={lang} />
        <SavedPage lang={lang} initial={c} />
      </div>
    </KdProvider>
  );
}
