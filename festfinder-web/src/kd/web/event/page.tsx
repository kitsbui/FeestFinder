/**
 * /e/<slug> (and /e/<slug>?lang=en) in Kính đêm: everything a person or a search engine needs
 * is in the server's HTML (the hero, about, line-up, tickets, venue, the organiser's updates
 * and answers, structured data); the personal and interactive parts hydrate on top.
 */
import { KdLink as Link, inLang } from '../../link';
import { CalendarBlankIcon, MapPinIcon, SealCheckIcon, ArrowUpRightIcon } from '@phosphor-icons/react/ssr';
import { api, jsonLdHtml, type EventSeo, type Lang } from '@/lib/api';
import { fill, pick } from '../../copy';
import { cx } from '../../cx';
import { count, money, timeRange, whenLong } from '../../format';
import { FAMILY_LABEL, familyOf, g } from '../../genre';
import { KdProvider } from '../../runtime';
import { buttonClass } from '../../ui/actions';
import { Clamp } from '../../ui/clamp';
import { Accordion, Art, Avatar, Tag } from '../../ui/parts';
import { VenueMap } from '../../map/venue-map';
import type { Card, EventDetail } from '../../types';
import { EventCard } from '../card';
import { Crumbs, WebFooter, WebNav } from '../chrome';
import { WEB } from '../copy';
import { CommunityLine, CopyAddress, Countdown, FollowOrg, ReportLink, SaveWithCount, SectionBar, ShareButton } from './actions';
import { Ambassadors, DiscussionSection, Hype, PhotoWall } from './community';
import { EventClientProvider } from './context';
import { Lineup } from './lineup';
import { TicketsPanel } from './tickets';

const enc = encodeURIComponent;

export async function loadEvent(slug: string, lang: Lang) {
  const [ev, seo] = await Promise.all([
    api<EventDetail>(`/events/${enc(slug)}`, { lang }),
    api<EventSeo>(`/seo/events/${enc(slug)}${lang === 'en' ? '?lang=en' : ''}`, { lang }),
  ]);
  return ev && seo ? { ev, seo } : null;
}

/** lib/styles.ts EVENT_TYPE_LABEL; "other" says nothing, so it is left out. */
const EVENT_TYPE: Record<string, { vi: string; en: string }> = {
  club: { vi: 'Club', en: 'Club night' }, festival: { vi: 'Lễ hội', en: 'Festival' }, concert: { vi: 'Concert', en: 'Concert' },
  rave: { vi: 'Rave', en: 'Rave' }, party: { vi: 'Tiệc', en: 'Party' }, show: { vi: 'Show', en: 'Show' },
};

export async function EventPage({ ev, seo, lang }: { ev: EventDetail; seo: EventSeo; lang: Lang }) {
  const T = pick(WEB, lang);
  const fam = familyOf(ev.genre);
  const free = ev.isFree || ev.entryMode === 'free';
  const status = ev.past ? null : ev.soldOut ? T.soldOut : ev.badge ? ev.badge.label[lang] : null;
  const statusTone = ev.soldOut ? 'bg-hot' : ev.badge?.key === 'low_tickets' || ev.badge?.key === 'selling_fast' ? 'bg-warn' : 'bg-ok';
  const familyLine = [FAMILY_LABEL[fam][lang], ev.eventType ? EVENT_TYPE[ev.eventType]?.[lang] : null, ev.cityLabel?.[lang]].filter(Boolean).join(' · ');
  const tiers = ev.tickets?.tiers ?? [];
  const openTiers = tiers.filter((t) => t.state === 'onsale' || t.state === 'last');
  const cheapest = openTiers.length ? Math.min(...openTiers.map((t) => t.price)) : ev.priceFrom;
  const hasTickets = !free && !ev.past && (openTiers.length > 0 || !!ev.links.go);
  const address = [ev.venue.address, ev.venue.area, ev.cityLabel?.[lang]].filter(Boolean).join(', ');
  const mapsHref = 'https://www.google.com/maps/search/?api=1&query=' + enc(ev.venue.lat != null && ev.venue.lng != null ? `${ev.venue.lat},${ev.venue.lng}` : [ev.venue.name, address].filter(Boolean).join(', '));
  const otherLang = { href: seo.page.otherLang.path, label: lang === 'vi' ? T.english : T.vietnamese };
  const sections = [
    { id: 'about', label: T.tabAbout },
    ...(ev.lineup.length || ev.timetable ? [{ id: 'lineup', label: T.tabLineup }] : []),
    { id: 'tickets', label: T.tabTickets },
    { id: 'venue', label: T.tabVenue },
  ];
  const description = ev.description?.[lang] || ev.description?.vi || ev.description?.en || '';
  const facts = [
    ev.age,
    ev.capacity ? fill(T.places, { n: count(ev.capacity, lang) }) : null,
    ...(ev.styles ?? []).slice(0, 3),
  ].filter((x): x is string => !!x);
  const org = ev.organizer;
  const orgData = org ? await api<{ upcoming: Card[] }>(`/organizers/${enc(org.slug)}`, { lang }).catch(() => null) : null;
  const more = (orgData?.upcoming ?? []).filter((x) => x.id !== ev.id).slice(0, 3);
  const also = more.length ? more : ev.similar.slice(0, 3);
  const alsoIsOrg = more.length > 0;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(seo.jsonLd) }} />
      <KdProvider lang={lang}>
        <EventClientProvider ev={ev}>
          <div className={cx('flex min-h-dvh flex-col', g(fam))} lang={lang}>
            <WebNav lang={lang} />
            <Crumbs label={T.crumbs} items={seo.page.crumbs.map((c, i, all) => (i === all.length - 1 ? { name: c.name } : { name: c.name, href: c.path }))} />

            {/* ---- hero ---- */}
            <section className="kd-wrap">
              <div className="grid grid-cols-1 items-start gap-6 desk:grid-cols-2 desk:gap-14">
                <div className="relative">
                  <Art family={fam} cover={ev.coverUrl} alt={ev.title} className="h-[clamp(260px,32vw,440px)]" off={ev.past} />
                  <div className="absolute left-3.5 top-3.5 z-[1] flex gap-1.5">
                    {ev.age ? <span className="kd-tag kd-tag-glass text-paper">{ev.age}</span> : null}
                    {status ? <span className="kd-tag kd-tag-glass text-paper"><span className={cx('h-[7px] w-[7px] rounded-full', statusTone)} aria-hidden="true" />{status}</span> : null}
                  </div>
                  <Countdown lang={lang} />
                </div>
                <div className="flex min-w-0 flex-col gap-4.5">
                  <div className="flex flex-col gap-2.5">
                    <span className="kd-m flex items-center gap-1.5"><span className="kd-mk" aria-hidden="true" />{familyLine}</span>
                    <h1 className="kd-d1">{ev.title}</h1>
                  </div>
                  <div className="border-t border-line">
                    {org ? (
                      <div className="kd-lrow min-h-15">
                        <Link href={inLang('/o/' + org.slug, lang)} className="flex min-w-0 flex-1 items-center gap-3">
                          <Avatar name={org.name} src={org.logoUrl} size={36} org />
                          <span className="kd-hs kd-ell">{org.name}</span>
                          {org.verified ? <SealCheckIcon size={16} weight="fill" className="shrink-0 text-acc" role="img" aria-label={T.verifiedOrg} /> : null}
                        </Link>
                        <FollowOrg lang={lang} />
                      </div>
                    ) : null}
                    <div className="kd-lrow min-h-13">
                      <CalendarBlankIcon size={18} className="text-fog" aria-hidden="true" />
                      <span className="kd-t kd-num flex-1 text-paper">
                        {whenLong(ev, lang)}{timeRange(ev) ? ' · ' + timeRange(ev) : ''}
                      </span>
                      {!ev.past ? <a className={buttonClass({ tone: 'ghost', size: 'sm' }, '-mr-3')} href={`/events/${ev.id}/calendar.ics`} download>{T.addCalendar}</a> : null}
                    </div>
                    <div className="kd-lrow min-h-13">
                      <MapPinIcon size={18} className="text-fog" aria-hidden="true" />
                      <span className="kd-t flex-1 text-paper">{ev.venue.name}{ev.venue.area ? <span className="text-fog"> · {ev.venue.area}</span> : null}</span>
                      <a className={buttonClass({ tone: 'ghost', size: 'sm' }, '-mr-3')} href="#venue">{T.directions}</a>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {hasTickets ? (
                      <a className={buttonClass({ tone: 'acc', size: 'lg' }, 'w-full tab:w-auto')} href="#tickets">
                        {openTiers.length ? fill(T.chooseTickets, { p: money(cheapest, ev.currency, lang) }) : T.buyTickets}
                      </a>
                    ) : free && !ev.past ? (
                      <a className={buttonClass({ tone: 'acc', size: 'lg' }, 'w-full tab:w-auto')} href="#venue">{T.freeEntry}</a>
                    ) : null}
                    <SaveWithCount lang={lang} />
                    <ShareButton lang={lang} />
                  </div>
                  <CommunityLine lang={lang} />
                </div>
              </div>
            </section>

            <SectionBar lang={lang} sections={sections} buy={hasTickets ? { href: '#tickets', label: T.buyTickets } : null} />

            {/* ---- body ---- */}
            <section className="kd-wrap pt-9">
              <div className="kd-split gap-[clamp(28px,4vw,56px)]">
                <div className="kd-main flex flex-col gap-11">
                  {ev.updates.length ? (
                    <section aria-labelledby="upd-h" className="flex flex-col gap-2">
                      <h2 id="upd-h" className="kd-m">{T.updates}</h2>
                      <ul className="flex flex-col">
                        {ev.updates.map((u) => (
                          <li key={u.id} className="flex flex-col gap-1 border-t border-line py-3">
                            <span className="kd-m flex items-center gap-2">
                              <span className={cx('h-[7px] w-[7px] rounded-full', u.kind === 'safety' || u.kind === 'delay' ? 'bg-warn' : 'bg-ok')} aria-hidden="true" />
                              {u.kindLabel?.[lang]}
                            </span>
                            <p className="kd-t text-paper">{u.body}</p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  <section id="about" aria-labelledby="about-h" className="flex scroll-mt-32 flex-col gap-3">
                    <h2 id="about-h" className="kd-m">{T.about2}</h2>
                    {description ? (
                      <Clamp lines={3} more={pick({ m: { vi: 'Xem thêm', en: 'Show more' } }, lang).m} less={pick({ l: { vi: 'Thu gọn', en: 'Show less' } }, lang).l} className="kd-tl max-w-[680px] whitespace-pre-line text-paper">
                        {description}
                      </Clamp>
                    ) : null}
                    {facts.length ? <div className="flex flex-wrap gap-1.5">{facts.map((f) => <Tag key={f} tone="line">{f}</Tag>)}</div> : null}
                    <Accordion small summary={seo.headings.facts} className="border-t border-line">
                      <div className="flex flex-col gap-3">
                        <p className="kd-s">{seo.page.summary}</p>
                        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 tab:grid-cols-2">
                          {seo.page.facts.map((f) => (
                            <div key={f.label} className="flex flex-col gap-0.5">
                              <dt className="kd-m">{f.label}</dt>
                              <dd className="kd-s text-mist">{f.href ? <a href={f.href} rel={/^https?:/.test(f.href) ? 'noopener' : undefined} className="underline decoration-line2 underline-offset-4 hover:text-paper">{f.value}</a> : f.value}</dd>
                            </div>
                          ))}
                        </dl>
                        {ev.sources.length ? (
                          <p className="kd-s">{T.sources}: {ev.sources.map((s, i) => (
                            <span key={i}>{i ? ' · ' : ''}{s.url ? <a href={s.url} rel="noopener nofollow" className="underline decoration-line2 underline-offset-4">{s.label[lang]}</a> : s.label[lang]}</span>
                          ))}</p>
                        ) : null}
                      </div>
                    </Accordion>
                  </section>

                  <Lineup lang={lang} />

                  <Hype lang={lang} />

                  {ev.faq.length ? (
                    <section aria-labelledby="faq-h" className="flex flex-col">
                      <h2 id="faq-h" className="kd-m pb-1.5">{seo.headings.faq}</h2>
                      <div className="border-t border-line">
                        {ev.faq.map((f) => (
                          <Accordion key={f.question} small name="faq" summary={f.question}>
                            <p className="kd-t text-fog">{f.answer}</p>
                          </Accordion>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <DiscussionSection lang={lang} />
                  <PhotoWall lang={lang} />
                  <Ambassadors lang={lang} />
                </div>

                <aside data-sticky-col className="kd-side self-start desk:sticky desk:top-32">
                  <TicketsPanel lang={lang} />
                </aside>
              </div>
            </section>

            {/* ---- venue ---- */}
            <section id="venue" aria-labelledby="venue-h" className="kd-wrap scroll-mt-32 pt-[clamp(56px,7vw,88px)]">
              <div className="kd-split items-stretch gap-[clamp(28px,4vw,56px)]">
                <div className="kd-side flex flex-col gap-3">
                  <span className="kd-m">{T.venue}</span>
                  <h2 id="venue-h" className="kd-d2">{ev.venue.name}</h2>
                  {address ? <p className="kd-t">{address}</p> : null}
                  <div className="mt-1 flex flex-wrap gap-2">
                    <a className={buttonClass({})} href={mapsHref} target="_blank" rel="noopener">{T.directions}<ArrowUpRightIcon size={16} aria-hidden="true" /></a>
                    {address ? <CopyAddress lang={lang} text={[ev.venue.name, address].filter(Boolean).join(', ')} /> : null}
                  </div>
                  {ev.travel || ev.entryRules ? (
                    <div className="mt-2 border-t border-line">
                      {ev.travel ? <Accordion small summary={T.travel}><p className="kd-t text-fog">{ev.travel}</p></Accordion> : null}
                      {ev.entryRules ? <Accordion small summary={T.entryRules}><p className="kd-t text-fog">{ev.entryRules}</p></Accordion> : null}
                    </div>
                  ) : null}
                </div>
                {ev.venue.lat != null && ev.venue.lng != null ? (
                  <a className="kd-main kd-card relative min-h-80 overflow-hidden after:pointer-events-none after:absolute after:inset-0 after:rounded-card after:shadow-[inset_0_0_0_1px_var(--color-line)] after:content-['']" href={inLang(`/list?view=map&city=${enc(ev.city)}`, lang)} aria-label={T.onMap}>
                    <VenueMap lat={ev.venue.lat} lng={ev.venue.lng} family={fam} label={(ev.venue.name ?? ev.title).split(' — ')[0]} className="absolute inset-0 bg-[#0b0c0d]" />
                  </a>
                ) : null}
              </div>
            </section>

            {/* ---- also by the organiser ---- */}
            {also.length ? (
              <section aria-labelledby="also-h" className="kd-wrap flex flex-col gap-5 pt-[clamp(56px,7vw,88px)]">
                <div className="kd-sec">
                  <div className="flex flex-col gap-2">
                    {alsoIsOrg && org ? <span className="kd-m">{fill(T.alsoBy, { o: org.name })}</span> : null}
                    <h2 id="also-h" className="kd-d2">{alsoIsOrg ? T.upcoming : T.youMayLike}</h2>
                  </div>
                  {alsoIsOrg && org ? <Link className={buttonClass({ size: 'sm' })} href={inLang('/o/' + org.slug, lang)}>{T.viewProfile}</Link> : null}
                </div>
                <div className="kd-cards">
                  {also.map((e, i) => <EventCard key={e.id} e={e} i={i + 1} lang={lang} />)}
                </div>
              </section>
            ) : null}

            <div className="mt-auto">
              <WebFooter lang={lang} otherLang={otherLang} />
              <div className="kd-wrap -mt-4 flex flex-wrap gap-1 pb-6">
                {ev.links.brand ? <a className="kd-nl" href={ev.links.brand} rel="noopener nofollow">{ev.links.brand.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</a> : null}
                <ReportLink lang={lang} />
              </div>
            </div>
          </div>
        </EventClientProvider>
      </KdProvider>
    </>
  );
}
