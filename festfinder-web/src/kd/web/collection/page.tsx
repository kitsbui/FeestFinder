/**
 * /c/<slug> (and ?lang=en) in Kính đêm: a collection someone made public. Not drawn; built from
 * Profile-Org-Web's parts: a mosaic of its events' art, the name and who made it, the lime
 * "Chia sẻ", its numbers, the upcoming events as cards with the past ones folded below, and at
 * the side what it holds and the facts. The server renders it all with its structured data;
 * saving an event and sharing come in the browser.
 */
import { api, jsonLdHtml, type CollectionSeo, type Lang } from '@/lib/api';
import { fill, pick } from '../../copy';
import { cx } from '../../cx';
import { count, whenShort } from '../../format';
import { CHART_ORDER, FAMILY_LABEL, familyOf, g, type Family } from '../../genre';
import { inLang } from '../../link';
import { KdProvider } from '../../runtime';
import { LinkButton } from '../../ui/actions';
import { Accordion, Art, Avatar, SectionHead, Stat } from '../../ui/parts';
import type { Card } from '../../types';
import { EventCard } from '../card';
import { Crumbs, WebFooter, WebNav } from '../chrome';
import { WEB } from '../copy';
import { PastList } from '../profile/parts';
import { COLLECTION } from './copy';
import { MoreCards } from './more';
import { ShareCollection } from './share';

const enc = encodeURIComponent;

/** Cards shown before "Xem thêm". */
const FIRST = 12;

/** GET /collections/:slug (festfinder-backend/src/routes/collections.ts). */
export interface PublicCollection {
  name: string;
  slug: string;
  url: string;
  owner: { name: string | null; initials: string | null };
  mine: boolean;
  count: number;
  items: Card[];
}

/** The collection and its SEO; null when there is none, or it is no longer public. */
export async function loadCollection(slug: string, lang: Lang) {
  const [col, seo] = await Promise.all([
    api<PublicCollection>(`/collections/${enc(slug)}`, { lang }),
    // The same request as the head's (seoMetadata's load()), so the two share one fetch.
    api<CollectionSeo>(`/seo/collections/${enc(slug)}${lang === 'en' ? '?lang=en' : ''}`),
  ]);
  return col && seo ? { col, seo } : null;
}

/** Each family's share of the events, biggest first; unknown genres are left out. */
function familyMix(events: Card[]) {
  const n = new Map<Exclude<Family, 'free'>, number>();
  for (const e of events) {
    const f = familyOf(e.genre);
    if (f !== 'free') n.set(f, (n.get(f) ?? 0) + 1);
  }
  return CHART_ORDER.filter((f) => n.get(f)).map((f) => ({ f, n: n.get(f)! }));
}

export function CollectionPage({ col, seo, lang }: { col: PublicCollection; seo: CollectionSeo; lang: Lang }) {
  const T = pick(COLLECTION, lang);
  const W = pick(WEB, lang);
  const upcoming = col.items.filter((e) => !e.past);
  const past = col.items.filter((e) => e.past && e.startsOn).reverse()
    .map((e) => ({ slug: e.slug, title: e.title, startsOn: e.startsOn!, venue: e.venue.name, cityLabel: e.cityLabel ?? null, genre: e.genre, saveCount: e.saveCount }));
  const owner = col.owner.name || T.member;
  const cities = [...new Set(col.items.map((e) => e.cityLabel?.[lang] || e.city).filter(Boolean))];
  const mix = familyMix(col.items);
  const mixTotal = mix.reduce((s, x) => s + x.n, 0);
  // The cover: the art of what it holds, upcoming first, filled out with the families.
  const shown = [...upcoming, ...col.items.filter((e) => e.past)].slice(0, 4);
  const fill4: Family[] = [...mix.map((x) => x.f), ...CHART_ORDER].filter((f, i, a) => a.indexOf(f) === i);
  const tiles = [
    ...shown.map((e) => ({ key: e.id, family: familyOf(e.genre), cover: e.coverUrl })),
    ...fill4.slice(0, 4 - shown.length).map((f) => ({ key: f, family: f, cover: null })),
  ];
  const story = {
    genre: col.items[0]?.genre ?? undefined,
    kicker: T.kicker + ' · ' + fill(T.nEvents, { n: col.items.length }),
    lines: (upcoming.length ? upcoming : col.items).slice(0, 3).map((e) => e.title + ' · ' + whenShort(e, lang)),
  };
  const otherLang = { href: seo.page.otherLang.path, label: lang === 'vi' ? W.english : W.vietnamese };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(seo.jsonLd) }} />
      <KdProvider lang={lang}>
        <div className="flex min-h-dvh flex-col" lang={lang}>
          <WebNav lang={lang} />
          <Crumbs label={W.crumbs} items={seo.page.crumbs.map((c, i, a) => (i === a.length - 1 ? { name: c.name } : { name: c.name, href: c.path }))} />

          <main className="flex flex-col">
            {/* ---- cover ---- */}
            <div className="kd-wrap" aria-hidden="true">
              <div className="grid h-[clamp(96px,12vw,168px)] grid-cols-4 gap-2">
                {tiles.map((x, i) => <Art key={x.key} family={x.family} cover={x.cover} bone={i % 2 === 1} />)}
              </div>
            </div>

            {/* ---- what it is ---- */}
            <section className="kd-wrap pt-7" aria-labelledby="col-h">
              <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
                <div className="flex min-w-0 flex-col gap-2">
                  <span className="kd-m">{T.kicker}</span>
                  <h1 id="col-h" className="kd-d1 [overflow-wrap:anywhere]">{col.name}</h1>
                  <span className="kd-s flex min-w-0 items-center gap-2 pt-1">
                    {/* Initials only for a name: "Thành viên FeestFinder" is not one. */}
                    {col.owner.name ? <Avatar name={col.owner.name} size={28} /> : null}
                    <span className="kd-ell">{fill(T.madeBy, { n: owner })}</span>
                  </span>
                </div>
                <ShareCollection lang={lang} name={col.name} url={inLang(col.url, lang)} slug={col.slug} story={story} />
              </div>
              <div className="mt-7 grid auto-cols-[minmax(0,240px)] grid-flow-col border-y border-line py-4.5">
                <Stat value={count(col.items.length, lang)} label={T.events} />
                <Stat value={count(upcoming.length, lang)} label={T.upcoming} />
                {cities.length ? <Stat value={count(cities.length, lang)} label={T.cities} /> : null}
              </div>
            </section>

            {/* ---- its events, and the rest at the side ---- */}
            <div className="kd-wrap pt-8">
              <div className="kd-split gap-[clamp(28px,4vw,56px)]">
                <div className="kd-main flex flex-col">
                  <section aria-labelledby="col-up">
                    <SectionHead id="col-up" title={T.upcoming} aside={<span className="kd-m kd-num">{upcoming.length}</span>} />
                    {upcoming.length ? (
                      <MoreCards className="kd-cards pt-5" first={FIRST} more={T.moreN} less={T.less}>
                        {upcoming.map((e, i) => <EventCard key={e.id} e={e} i={i} lang={lang} />)}
                      </MoreCards>
                    ) : (
                      <div className="flex flex-col items-start gap-4 pt-5">
                        <p className="kd-t text-fog">{col.items.length ? T.noUpcoming : T.empty}</p>
                        <LinkButton tone="light" href={inLang('/', lang)}>{T.explore}</LinkButton>
                      </div>
                    )}
                  </section>
                  {past.length ? (
                    <section aria-label={T.past} className="mt-10 border-t border-line">
                      <Accordion summary={T.past} aside={past.length} open={!upcoming.length}>
                        <PastList lang={lang} items={past} />
                      </Accordion>
                    </section>
                  ) : null}
                </div>

                <aside className="kd-side flex flex-col gap-8">
                  {mix.length ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-baseline justify-between"><span className="kd-m">{T.families}</span><span className="kd-m kd-num">{fill(T.nEvents, { n: count(mixTotal, lang) })}</span></div>
                      <div className="flex h-2.5 gap-0.5" role="img" aria-label={mix.map((x) => `${FAMILY_LABEL[x.f][lang]} ${x.n}`).join(', ')}>
                        {mix.map((x, i) => (
                          <i key={x.f} className={cx(g(x.f), 'bg-[var(--g)]', i === 0 && 'rounded-l', i === mix.length - 1 && 'rounded-r')} style={{ flex: `${x.n} 1 0` }} />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {mix.map((x) => (
                          <span key={x.f} className={cx('kd-s flex items-center gap-2 text-mist', g(x.f))}>
                            <span className="kd-mk" aria-hidden="true" />{FAMILY_LABEL[x.f][lang]}<span className="kd-mb kd-num ml-auto">{Math.round((x.n / mixTotal) * 100)}%</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col border-t border-line">
                    <Accordion small summary={seo.headings.facts}>
                      <div className="flex flex-col gap-3">
                        <p className="kd-s">{seo.page.summary}</p>
                        <dl className="grid grid-cols-1 gap-y-2">
                          {seo.page.facts.map((f) => (
                            <div key={f.label} className="flex flex-col gap-0.5">
                              <dt className="kd-m">{f.label}</dt>
                              <dd className="kd-s text-mist">{f.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </Accordion>
                  </div>
                </aside>
              </div>
            </div>
          </main>

          <div className="mt-auto">
            <WebFooter lang={lang} otherLang={otherLang} />
          </div>
        </div>
      </KdProvider>
    </>
  );
}
