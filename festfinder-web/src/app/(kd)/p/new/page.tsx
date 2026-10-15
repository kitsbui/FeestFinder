import type { Metadata } from 'next';
import { KdProvider } from '@/kd/runtime';
import { WebFooter, WebNav } from '@/kd/web/chrome';
import { ProjectManage } from '@/kd/web/projects/manage';

// The owner's side of projects: theirs alone, never in search results.
export const metadata: Metadata = { title: 'Dự án | FeestFinder', robots: { index: false, follow: false } };

export default async function Page() {
  return (
    <KdProvider lang="vi">
      <div className="flex min-h-dvh flex-col" lang="vi">
        <WebNav lang="vi" current="projects" />
        <main className="kd-wrap py-8"><ProjectManage lang="vi" slug={null} /></main>
        <div className="mt-auto"><WebFooter lang="vi" /></div>
      </div>
    </KdProvider>
  );
}
