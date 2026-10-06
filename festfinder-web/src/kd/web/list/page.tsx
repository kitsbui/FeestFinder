/**
 * /list in Kính đêm: every upcoming event as a table, a grid or a map (design/Web-Map for the
 * map; the table and grid are built from the same parts). The server renders every upcoming
 * event in the table; the browser takes the filters from the address.
 */
import { apiOr, type Lang } from '@/lib/api';
import { KdProvider } from '../../runtime';
import type { Card } from '../../types';
import { WebFooter, WebNav } from '../chrome';
import { ListBrowser, type Meta } from './browser';

export async function ListPage({ lang }: { lang: Lang }) {
  const [meta, initial] = await Promise.all([
    apiOr<Meta>('/meta/discovery', { cities: [], styles: [], eventTypes: [], genres: [] }, { revalidate: 300 }),
    apiOr<{ items: Card[]; total: number; nextCursor: string | null; facets: { city: Record<string, number> } }>(
      '/events?time=all&upcoming=true&limit=60', { items: [], total: 0, nextCursor: null, facets: { city: {} } }, { lang }),
  ]);
  return (
    <KdProvider lang={lang}>
      <div className="flex min-h-dvh flex-col" lang={lang}>
        <WebNav lang={lang} current="list" />
        <ListBrowser lang={lang} meta={meta} initial={initial} />
        <div className="mt-auto"><WebFooter lang={lang} otherLang={lang === 'vi' ? { href: '/list?lang=en', label: 'English' } : { href: '/list', label: 'Tiếng Việt' }} /></div>
      </div>
    </KdProvider>
  );
}
