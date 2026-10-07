/**
 * / in Kính đêm (design/Web-Home): the city and time headline, search, the featured card, this
 * weekend's events with sort and family chips, "Gần đây, tối nay" with the map, the FAQ.
 * Rendered on the server with this weekend in the default city; the rest follows the choices.
 */
import { apiOr, type Lang } from '@/lib/api';
import { inLang } from '../../link';
import { pick } from '../../copy';
import { familyOf } from '../../genre';
import { MiniMap } from '../../map/venue-map';
import { moneyShort } from '../../format';
import { KdProvider } from '../../runtime';
import { Accordion } from '../../ui/parts';
import type { Card } from '../../types';
import { WebFooter, WebNav } from '../chrome';
import { AdBanner, type Ad } from './ad';
import { HomeBrowser, NearbyTonight, type City, type Feed } from './browser';
import { HOME } from './copy';

const EMPTY_FEED: Feed = { items: [], total: 0, nextCursor: null, hero: null, facets: { time: { tonight: 0, weekend: 0, '7days': 0, month: 0 }, city: {}, family: { fest: 0, live: 0, edm: 0, cult: 0, free: 0 } } };

export async function HomePage({ lang }: { lang: Lang }) {
  const T = pick(HOME, lang);
  const meta = await apiOr<{ defaultCity: string; cities: City[] } | null>('/meta/discovery', null, { revalidate: 300 });
  const city = meta?.defaultCity ?? 'ho-chi-minh';
  const [feed, tonight, ad] = await Promise.all([
    apiOr<Feed>(`/events?time=weekend&limit=12&upcoming=1&city=${city}`, EMPTY_FEED, { lang }),
    apiOr<{ items: Card[] }>(`/events?time=tonight&limit=20&upcoming=1&city=${city}`, { items: [] }, { lang }),
    apiOr<{ ad: Ad | null }>('/ads?placement=banner', { ad: null }, { lang }),
  ]);
  const pins = tonight.items.filter((e) => e.venue.lat != null).slice(0, 12).map((e) => ({
    id: e.id, lat: e.venue.lat, lng: e.venue.lng, family: familyOf(e.genre),
    label: e.isFree ? T.free : moneyShort(e.priceFrom, e.currency, lang), title: e.title,
  }));
  const faq = (['1', '2', '3', '4'] as const).map((n) => ({ q: T[`q${n}`], a: T[`a${n}`] }));

  return (
    <KdProvider lang={lang}>
      <div className="flex min-h-dvh flex-col" lang={lang}>
        <WebNav lang={lang} current="explore" familyCounts={feed.facets?.family} />
        <main className="flex flex-col">
          <HomeBrowser lang={lang} initial={feed} cities={meta?.cities ?? []} defaultCity={city} />

          {ad.ad ? <section className="kd-wrap pt-14"><AdBanner ad={ad.ad} lang={lang} /></section> : null}

          {tonight.items.length ? (
            <section className="kd-wrap pt-[clamp(56px,7vw,96px)]">
              <div className="kd-split items-stretch">
                <div className="kd-side"><NearbyTonight lang={lang} items={tonight.items} city={city} /></div>
                <a className="kd-main kd-card relative min-h-[400px] overflow-hidden after:pointer-events-none after:absolute after:inset-0 after:rounded-card after:shadow-[inset_0_0_0_1px_var(--color-line)] after:content-['']" href={inLang('/list?view=map', lang)} aria-label={T.openMap}>
                  <MiniMap pins={pins} className="absolute inset-0 bg-[#0b0c0d]" />
                </a>
              </div>
            </section>
          ) : null}

          <section aria-labelledby="faq-h" className="kd-wrap pt-[clamp(56px,7vw,96px)]">
            <div className="flex max-w-[760px] flex-col gap-1.5">
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
        </main>
        <div className="mt-auto">
          <WebFooter lang={lang} otherLang={lang === 'vi' ? { href: '/?lang=en', label: 'English' } : { href: '/', label: 'Tiếng Việt' }} />
        </div>
      </div>
    </KdProvider>
  );
}
