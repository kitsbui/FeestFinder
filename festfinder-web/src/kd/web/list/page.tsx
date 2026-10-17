/**
 * The home page (/ and /?lang=en; /list redirects here, owner 2026-10-17): every upcoming event
 * by day (the grid), as a table or on a map, the world's biggest festivals first, then the banner
 * ad. The questions moved to /about (owner, 2026-10-17). The server renders the first events by
 * day; the browser takes the filters from the address.
 */
import { apiOr, type Lang } from '@/lib/api';
import { pick } from '../../copy';
import { KdProvider } from '../../runtime';
import type { Card } from '../../types';
import { EventCard } from '../card';
import { WebFooter, WebNav } from '../chrome';
import { AdBanner, type Ad } from './ad';
import { ListBrowser, type Meta } from './browser';
import { LIST } from './copy';

export async function ListPage({ lang }: { lang: Lang }) {
  const T = pick(LIST, lang);
  const [meta, initial, ad, flagship] = await Promise.all([
    apiOr<Meta>('/meta/discovery', { cities: [], styles: [], eventTypes: [], genres: [] }, { revalidate: 300 }),
    apiOr<{ items: Card[]; total: number; nextCursor: string | null; facets: { city: Record<string, number> } }>(
      '/events?time=all&upcoming=true&limit=60', { items: [], total: 0, nextCursor: null, facets: { city: {} } }, { lang }),
    apiOr<{ ad: Ad | null }>('/ads?placement=banner', { ad: null }, { lang }),
    apiOr<{ items: Card[] }>('/events?time=all&upcoming=true&flagship=true&limit=8', { items: [] }, { lang }),
  ]);
  const highlight = flagship.items.length ? (
    // Keyed: it is handed to ListBrowser, a client component, which places it among its own children.
    <section key="flagship" aria-labelledby="flagship-h" data-surface="flagship" className="kd-days flex flex-col gap-3">
      <h2 id="flagship-h" className="kd-d3">{T.flagship}</h2>
      <div className="kd-cards">{flagship.items.map((e) => <EventCard key={e.id} e={e} lang={lang} />)}</div>
    </section>
  ) : null;
  return (
    <KdProvider lang={lang}>
      <div className="flex min-h-dvh flex-col" lang={lang}>
        <WebNav lang={lang} current="list" />
        <ListBrowser lang={lang} meta={meta} initial={initial} highlight={highlight} />
        {ad.ad ? <section className="kd-wrap pt-14"><AdBanner ad={ad.ad} lang={lang} /></section> : null}
        <div className="mt-auto pt-12"><WebFooter lang={lang} otherLang={lang === 'vi' ? { href: '/?lang=en', label: 'English' } : { href: '/', label: 'Tiếng Việt' }} /></div>
      </div>
    </KdProvider>
  );
}
