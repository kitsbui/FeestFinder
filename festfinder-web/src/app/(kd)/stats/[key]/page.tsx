import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { STATS } from '@/kd/web/stats/copy';
import { isStatKey, langOf, type Search } from '@/kd/web/stats/model';
import { StatPage } from '@/kd/web/stats/page';

type Props = { params: Promise<{ key: string }>; searchParams: Promise<Search> };

// One explore stat (/stats/free, /stats/weekend, /stats/venues), and ?lang=en in English.
// A filtered view of the list: followed by search engines, not indexed.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { key } = await params;
  if (!isStatKey(key)) return {};
  return { title: STATS[key][langOf(await searchParams)], robots: { index: false, follow: true } };
}

export default async function Page({ params, searchParams }: Props) {
  const { key } = await params;
  if (!isStatKey(key)) notFound();
  const search = await searchParams;
  return <StatPage statKey={key} lang={langOf(search)} search={search} />;
}
