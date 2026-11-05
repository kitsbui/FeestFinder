/**
 * The home page (/ and /?lang=en; /list redirects here, owner 2026-10-17): every upcoming event
 * by day (the grid), as a table or on a map, the first featured shelf (paid ones say so) or else the
 * world's biggest festivals first, then the banner ad. The questions moved to /about (owner, 2026-10-17). The server renders the first events by
 * day, of one city at /?city=<slug> or for a device that chose one, its country's nights first for a
 * visitor from a listed country (city.tsx, kd/home-place.ts); the browser takes the other filters from the address.
 */
import { apiOr, type Lang } from '@/lib/api';
import { pick, tx, type Pair } from '../../copy';
import { KdProvider } from '../../runtime';
import type { Card } from '../../types';
import { EventCard } from '../card';
import { DAY } from '../card-fit';
import { WebFooter, WebNav } from '../chrome';
import { AdBanner, type Ad } from './ad';
import { ListBrowser, type Meta } from './browser';
import { LIST } from './copy';
import { InLang } from '@/kd/ui/in-lang';
import { CityFirst } from './city-first';

type Answer = { items: Card[]; total: number; nextCursor: string | null; facets: { city: Record<string, number> } };
const EVERY = '/events?time=all&upcoming=true&limit=60';
const NONE: Answer = { items: [], total: 0, nextCursor: null, facets: { city: {} } };

/**
 * `city`: one city's list (/?city=<slug>, or the city this device chose: app/(kd)/in/[city]); one the
 * site does not list is every city, as the browser reads it. `country`: every city, that listed
 * country's nights first (the visitor's country: app/(kd)/from/[country], kd/home-place.ts).
 */
export async function ListPage({ lang, city, country }: { lang: Lang; city?: string; country?: string }) {
  const T = pick(LIST, lang);
  const asked = city && city !== 'all' ? `/events?city=${encodeURIComponent(city)}&time=all&upcoming=true&limit=60` : EVERY;
  const [meta, first, ad, flagship, shelves] = await Promise.all([
    apiOr<Meta>('/meta/discovery', { cities: [], countries: [], styles: [], eventTypes: [], genres: [] }, { revalidate: 300 }),
    apiOr<Answer>(asked, NONE, { lang }),
    apiOr<{ ad: Ad | null }>('/ads?placement=banner', { ad: null }, { lang }),
    apiOr<{ items: Card[] }>('/events?time=all&upcoming=true&flagship=true&limit=8', { items: [] }, { lang }),
    apiOr<{ items: { id: string; slug: string; name: Pair; sponsored: boolean; items: Card[] }[] }>('/shelves', { items: [] }, { lang }),
  ]);
  const known = city && meta.cities.some((c) => c.slug === city) ? city : undefined;
  const initial = asked === EVERY || known ? first : await apiOr<Answer>(EVERY, NONE, { lang });
  const place = !known && country && meta.countries.some((c) => c.code === country) ? country : undefined;
  // One highlight slot (growth plan card 5): the first shelf on (three live events or more), else the festivals.
  const shelf = shelves.items[0] ?? null;
  const items = shelf ? shelf.items.slice(0, 8) : flagship.items;
  // Above the list, so its first picture is the page's first: fetched first, the one with high priority (the list's waits).
  const hero = items.find((e) => e.coverUrl)?.id;
  // A world festival names its country: the highlight shows every city's nights, whoever reads it.
  const countryName = (code: string) => tx(meta.countries.find((c) => c.code === code)?.name, lang) || null;
  const cards = items.map((e) => <EventCard key={e.id} e={e} lang={lang} eager={e.id === hero} fit={DAY} country={countryName(e.country)} />);
  const highlight = shelf ? (
    <section key="shelf" aria-labelledby="shelf-h" data-surface="shelf" className="kd-days flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="shelf-h" className="kd-d3">{tx(shelf.name, lang)}</h2>
        {shelf.sponsored ? <span className="kd-m">{T.sponsored}</span> : null}
      </div>
      <div className="kd-cards">{cards}</div>
    </section>
  ) : flagship.items.length ? (
    // Keyed: it is handed to ListBrowser, a client component, which places it among its own children.
    <section key="flagship" aria-labelledby="flagship-h" data-surface="flagship" className="kd-days flex flex-col gap-3">
      <h2 id="flagship-h" className="kd-d3">{T.flagship}</h2>
      <div className="kd-cards">{cards}</div>
    </section>
  ) : null;
  return (
    <InLang lang={lang}>
      <KdProvider lang={lang}>
        <div className="flex min-h-dvh flex-col" lang={lang}>
          <WebNav lang={lang} current="list" />
          {/* Before the list, so a city this device chose that the server did not draw is known before the list is. */}
          <CityFirst meta={meta} drawn={known} />
          <ListBrowser lang={lang} meta={meta} initial={initial} city={known} country={place} highlight={highlight} />
          {ad.ad ? <section className="kd-wrap pt-14"><AdBanner ad={ad.ad} lang={lang} /></section> : null}
          <div className="mt-auto pt-12"><WebFooter lang={lang} otherLang={lang === 'vi' ? { href: '/?lang=en', label: 'English' } : { href: '/', label: 'Tiếng Việt' }} /></div>
        </div>
      </KdProvider>
    </InLang>
  );
}
