import type { Metadata } from 'next';
import { KdProvider } from '@/kd/runtime';
import { WebFooter, WebNav } from '@/kd/web/chrome';
import { PostEditor } from '@/kd/web/blog/editor';

// The writer's side of the blog: theirs alone, never in search results.
export const metadata: Metadata = { title: 'Blog | FeestFinder', robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <KdProvider lang="vi">
      <div className="flex min-h-dvh flex-col" lang="vi">
        <WebNav lang="vi" current="blog" />
        <main id="main" className="kd-wrap min-h-dvh py-8"><div className="mx-auto w-full max-w-3xl"><PostEditor lang="vi" slug={(await params).slug} /></div></main>
        <div className="mt-auto"><WebFooter lang="vi" /></div>
      </div>
    </KdProvider>
  );
}
