/**
 * The home page (/ and its languages; /list and /map redirect here): a dashboard (owner, 2026-11-06).
 * The map of every coming night, framed on where they are; the highlight (the featured shelf on, with
 * three live events or more, else the world's festivals); Google Calendar's month view of the same
 * nights; the banner. No filters, no list, no table. `city`: one city's dashboard (/?city=<slug>,
 * app/(kd)/in/[city]). The questions moved to /about (owner, 2026-10-17).
 */
import { apiOr, SITE_URL, type Lang } from '@/lib/api';
import { pick, tx, type Pair } from '../../copy';
import { KdProvider } from '../../runtime';
import type { Card } from '../../types';
import { EventCard } from '../card';
import { DAY } from '../card-fit';
import { WebFooter, WebNav } from '../chrome';
import { AdBanner, type Ad } from './ad';
import type { HomeEvent } from './calendar';
import { Dashboard } from './dashboard';
import { LIST } from './copy';
import { InLang } from '@/kd/ui/in-lang';

export interface Meta {
  cities: { slug: string; country: string; name: Pair; timezone: string; center: [number, number] | null; bbox: [number, number, number, number] | null }[];
  countries: { code: string; name: Pair; timezone: string }[];
  styles: { key: string; label: Pair; genre: string | null }[];
}

const ASKED = "if(/[?&](q|style)=[^&]/.test(location.search))document.documentElement.setAttribute('data-asked','')";

type Shelf = { id: string; slug: string; name: Pair; sponsored: boolean; items: Card[] };

/** Only what the map and the calendar draw goes to the browser. */
const slim = (e: HomeEvent): HomeEvent => ({
  id: e.id, slug: e.slug, title: e.title, genre: e.genre, styles: e.styles, startsOn: e.startsOn, endsOn: e.endsOn,
  startTime: e.startTime, endTime: e.endTime, startsAt: e.startsAt, endsAt: e.endsAt, timezone: e.timezone, cityLabel: e.cityLabel,
  coverUrl: e.coverUrl, logoUrl: e.logoUrl ?? null, priceFrom: e.priceFrom, currency: e.currency, isFree: e.isFree, priceUnknown: e.priceUnknown, soldOut: e.soldOut,
  venue: e.venue, lat: e.lat, lng: e.lng, approx: e.approx,
});

export async function ListPage({ lang, city }: { lang: Lang; city?: string }) {
  const T = pick(LIST, lang);
  const [meta, nights, ad, flagship, shelves] = await Promise.all([
    apiOr<Meta>('/meta/discovery', { cities: [], countries: [], styles: [] }, { revalidate: 300 }),
    apiOr<{ items: HomeEvent[]; today?: string }>(`/events/map?time=all&upcoming=true&limit=500${city ? '&city=' + encodeURIComponent(city) : ''}`, { items: [] }, { lang }),
    apiOr<{ ad: Ad | null }>('/ads?placement=banner', { ad: null }, { lang }),
    apiOr<{ items: Card[] }>('/events?time=all&upcoming=true&flagship=true&limit=8', { items: [] }, { lang }),
    apiOr<{ items: Shelf[] }>('/shelves', { items: [] }, { lang }),
  ]);
  const known = city && meta.cities.some((c) => c.slug === city) ? city : undefined;

  // One highlight slot, on the page of all cities only: the first shelf on, else the festivals.
  const shelf = known ? null : shelves.items[0] ?? null;
  const items = known ? [] : shelf ? shelf.items.slice(0, 8) : flagship.items;
  const hero = items.find((e) => e.coverUrl)?.id;
  const countryName = (code: string) => tx(meta.countries.find((c) => c.code === code)?.name, lang) || null;
  const cards = items.map((e) => <EventCard key={e.id} e={e} lang={lang} eager={e.id === hero} fit={DAY} country={countryName(e.country)} />);
  const highlight = items.length ? (
    <section aria-labelledby="hl-h" data-surface={shelf ? 'shelf' : 'flagship'} className="kd-wrap kd-days flex flex-col gap-3 pt-10">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="hl-h" className="kd-d3">{shelf ? tx(shelf.name, lang) : T.flagship}</h2>
        {shelf?.sponsored ? <span className="kd-m">{T.sponsored}</span> : null}
      </div>
      <div className="kd-cards">{cards}</div>
    </section>
  ) : null;

  return (
    <InLang lang={lang}>
      <KdProvider lang={lang}>
        <div className="flex min-h-dvh flex-col" lang={lang}>
          <WebNav lang={lang} current="list" />
          {/* An address that narrows (?q=, ?style=) hides the highlight before the first paint (kd.css), as the dashboard drops it. */}
          <script dangerouslySetInnerHTML={{ __html: ASKED }} />
          <Dashboard
            lang={lang}
            heading={[T.title, known ? tx(meta.cities.find((c) => c.slug === known)?.name, lang) : null].filter(Boolean).join(' · ')}
            events={nights.items.map(slim)}
            // The API's day, so the server and the browser mark the same today.
            today={nights.today ?? new Date().toISOString().slice(0, 10)}
            city={known}
            styles={meta.styles.map((s) => ({ key: s.key, label: s.label }))}
            places={meta.cities.flatMap((c) => (c.center ? [{ name: tx(c.name, lang), at: c.center }] : []))}
            highlight={highlight}
            siteUrl={SITE_URL}
          />
          {ad.ad ? <section className="kd-wrap pt-14"><AdBanner ad={ad.ad} lang={lang} /></section> : null}
          <div className="mt-auto pt-12"><WebFooter lang={lang} otherLang={lang === 'vi' ? { href: '/?lang=en', label: 'English' } : { href: '/', label: 'Tiếng Việt' }} /></div>
        </div>
      </KdProvider>
    </InLang>
  );
}
