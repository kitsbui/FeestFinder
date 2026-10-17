/**
 * The home page (/ and /?lang=en; /list redirects here, owner 2026-10-17): every upcoming event
 * as a table, a grid or a map (design/Web-Map for the map; the table and grid are built from the
 * same parts), then the banner ad and the questions. The server renders every upcoming event in
 * the table; the browser takes the filters from the address.
 */
import { apiOr, type Lang } from '@/lib/api';
import { pick } from '../../copy';
import { KdProvider } from '../../runtime';
import { Accordion } from '../../ui/parts';
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
    <section key="flagship" aria-labelledby="flagship-h" className="flex flex-col gap-3">
      <h2 id="flagship-h" className="kd-d3">{T.flagship}</h2>
      <div className="kd-cards">{flagship.items.map((e, i) => <EventCard key={e.id} e={e} i={i} lang={lang} />)}</div>
    </section>
  ) : null;
  const faq = (['1', '2', '3', '4'] as const).map((n) => ({ q: T[`q${n}`], a: T[`a${n}`] }));
  return (
    <KdProvider lang={lang}>
      <div className="flex min-h-dvh flex-col" lang={lang}>
        <WebNav lang={lang} current="list" />
        <ListBrowser lang={lang} meta={meta} initial={initial} highlight={highlight} />
        {ad.ad ? <section className="kd-wrap pt-14"><AdBanner ad={ad.ad} lang={lang} /></section> : null}
        <section aria-labelledby="faq-h" className="kd-wrap pt-[clamp(56px,7vw,96px)]">
          <div className="flex max-w-read flex-col gap-1.5">
            <h2 id="faq-h" className="kd-m">{T.faq}</h2>
            <div className="border-t border-line">
              {faq.map((x) => (
                <Accordion key={x.q} small name="faq" summary={x.q}>
                  <p className="kd-t pr-6 text-fog">{x.a}</p>
                </Accordion>
              ))}
            </div>
          </div>
        </section>
        <div className="mt-auto pt-12"><WebFooter lang={lang} otherLang={lang === 'vi' ? { href: '/?lang=en', label: 'English' } : { href: '/', label: 'Tiếng Việt' }} /></div>
      </div>
    </KdProvider>
  );
}
