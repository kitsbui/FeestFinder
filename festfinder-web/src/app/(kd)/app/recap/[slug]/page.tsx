import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { appMetadata, appViewport } from '@/kd/app/meta';
import { RecapScreen } from '@/kd/app/screens';
import type { EventDetail } from '@/kd/types';

export const metadata = appMetadata;
export const viewport = appViewport;
// The event as anyone sees it, cached for a minute; the screen asks again in the browser.
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const ev = await api<EventDetail>(`/events/${encodeURIComponent((await params).slug)}`, { lang: 'vi' });
  if (!ev) notFound();
  return <RecapScreen ev={ev} />;
}
