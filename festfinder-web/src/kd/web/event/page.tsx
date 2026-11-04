/**
 * /e/<slug> (and /e/<slug>?lang=en) in Kính đêm: everything a person or a search engine needs
 * is in the server's HTML (the hero, about, line-up, tickets, venue, the organiser's updates
 * and answers, structured data); the personal and interactive parts hydrate on top.
 */
import { KdLink as Link, inLang } from '../../link';
import { BroadcastIcon, CalendarBlankIcon, HandshakeIcon, IdentificationBadgeIcon, MapPinIcon, SealCheckIcon, ArrowUpRightIcon, TicketIcon } from '@phosphor-icons/react/ssr';
import { ViewTransition, type ReactNode } from 'react';
import { api, jsonLdHtml, type EventSeo, type Lang } from '@/lib/api';
import { fill, pick, tx } from '../../copy';
import { cx } from '../../cx';
import { count, dayMonth, money, timeRange, weekdayLong, whenLong, whenShort } from '../../format';
import { familyOf, g, styleLabel } from '../../genre';
import { KdProvider } from '../../runtime';
import { buttonClass } from '../../ui/actions';
import { Clamp } from '../../ui/clamp';
import { RadarTag } from '../../ui/origin';
import { Accordion, Art, Avatar, Tag } from '../../ui/parts';
import { VenueMap } from '../../map/venue-map';
import type { Card, EventDetail } from '../../types';
import { EventCard } from '../card';
import { WebFooter, WebNav } from '../chrome';
import { Crumbs } from '../crumbs';
import { WEB } from '../copy';
import { CommunityLine, CopyAddress, Countdown, FollowOrg, ReportLink, SaveWithCount, ShareButton } from './actions';
import { EventExtras } from './extras';
import { EventMore } from './more';
import { EventClientProvider } from './context';
import { Lineup } from './lineup';
import { ListenFirst } from './previews';
import { RideButton } from './ride';
import { TicketsPanel } from './tickets';
import { directionsUrl } from './directions';
import { BuyDock } from './dock';
import { InLang } from '@/kd/ui/in-lang';
import { FIT } from '../../fits';
import { square } from '../../img';

const enc = encodeURIComponent;

export async function loadEvent(slug: string, lang: Lang) {
  const [ev, seo] = await Promise.all([
    api<EventDetail>(`/events/${enc(slug)}`, { lang }),
    api<EventSeo>(`/seo/events/${enc(slug)}${lang === 'vi' ? '' : '?lang=en'}`, { lang }),
  ]);
  return ev && seo ? { ev, seo } : null;
}

/** lib/styles.ts EVENT_TYPE_LABEL; "other" says nothing, so it is left out. */
const EVENT_TYPE: Record<string, { vi: string; en: string }> = {
  club: { vi: 'Club', en: 'Club night' }, festival: { vi: 'Lễ hội', en: 'Festival' }, concert: { vi: 'Concert', en: 'Concert' },
  rave: { vi: 'Rave', en: 'Rave' }, party: { vi: 'Tiệc', en: 'Party' }, show: { vi: 'Show', en: 'Show' }, day: { vi: 'Ban ngày', en: 'Day party' },
};

export async function EventPage({ ev, seo, lang }: { ev: EventDetail; seo: EventSeo; lang: Lang }) {
  const T = pick(WEB, lang);
  const fam = familyOf(ev.genre);
  const free = ev.isFree || ev.entryMode === 'free';
  const status = ev.past ? null : ev.soldOut ? T.soldOut : ev.badge ? tx(ev.badge.label, lang) : null;
  const statusTone = ev.soldOut ? 'bg-bad' : ev.badge?.key === 'low_tickets' || ev.badge?.key === 'selling_fast' ? 'bg-warn' : 'bg-ok';
  // The hero's poster when there is no cover: the day (or the days) large, then the weekday, the time and the city.
  const several = !!ev.startsOn && !!ev.endsOn && ev.endsOn !== ev.startsOn;
  const poster = ev.startsOn ? {
    big: several ? whenShort(ev, lang) : dayMonth(ev.startsOn, lang),
    line: [several ? null : weekdayLong(ev.startsOn, lang), ev.startTime, tx(ev.cityLabel, lang)].filter(Boolean).join(' · '),
  } : null;
  // FeestFinder sells no tickets: the price is the organiser's "from", and every button goes through /go to the seller.
  const cheapest = ev.priceFrom;
  const hasTickets = !free && !ev.past && !!ev.links.go;
  const address = [ev.venue.address, ev.venue.area, tx(ev.cityLabel, lang)].filter(Boolean).join(', ');
  const mapsHref = directionsUrl(ev.venue, address);
  const otherLang = { href: seo.page.otherLang.path, label: lang === 'vi' ? T.english : T.vietnamese };
  const description = tx(ev.description, lang) || ev.description?.vi || ev.description?.en || '';
  // A machine wrote this language of it (phase 15): say so, and keep the organiser's or the source's own words below.
  const textLang = lang === 'vi' ? 'vi' : 'en';
  const machine = !!ev.descriptionAuto?.includes(textLang) && description === (ev.description?.[textLang] ?? '').trim();
  const original = machine ? (textLang === 'vi' ? ev.description?.en : ev.description?.vi) ?? '' : '';
  // The chips under "Giới thiệu": the kind of night, the room and the styles. The age is a fact of the hero already.
  const facts = [
    ev.eventType ? tx(EVENT_TYPE[ev.eventType], lang) : null,
    ev.capacity ? fill(T.places, { n: count(ev.capacity, lang) }) : null,
    ...(ev.styles ?? []).slice(0, 3).map((s) => styleLabel(s, lang)),
  ].filter((x): x is string => !!x);
  const org = ev.organizer;
  // Nobody posted a Radar event: it is Feest Radar's find, not its placeholder organiser's.
  const radarHosts = [...new Set(ev.sources.map((s) => s.host || tx(s.label, lang)).filter(Boolean))].join(', ');
  const orgData = org ? await api<{ upcoming: Card[] }>(`/organizers/${enc(org.slug)}`, { lang }).catch(() => null) : null;
  const more = (orgData?.upcoming ?? []).filter((x) => x.id !== ev.id).slice(0, 3);
  const also = more.length ? more : ev.similar.slice(0, 3);
  const alsoIsOrg = more.length > 0;

  return (
    <InLang lang={lang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(seo.jsonLd) }} />
      <KdProvider lang={lang}>
        <EventClientProvider ev={ev}>
          <div className={cx('flex min-h-dvh flex-col', g(fam))} lang={lang}>
            <WebNav lang={lang} current="list" />
            <Crumbs label={T.crumbs} items={seo.page.crumbs.map((c, i, all) => (i === all.length - 1 ? { name: c.name } : { name: c.name, href: c.path }))} />

            {/* The page's own content: where the skip link (ui/skip-link.tsx) leads. */}
            <main id="main" className="flex flex-col">
            {/* ---- hero ---- */}
            <section className="kd-wrap">
              <div className="grid grid-cols-1 items-start gap-6 desk:grid-cols-2 desk:gap-14">
                <div className="relative">
                  {/* Without a cover, a poster of the date: the name is the H1 beside it, never twice. */}
                  <ViewTransition name={'ev-' + ev.slug} share="morph" default="none">
                    <Art family={fam} cover={ev.coverUrl} alt={ev.title} title={ev.title} layout="hero" eager fit={FIT.hero} className="aspect-video w-full" off={ev.past} kicker={ev.styles?.[0] ? styleLabel(ev.styles[0], lang) : null} poster={poster} />
                  </ViewTransition>
                  <div className="absolute left-3.5 top-3.5 z-[1] flex gap-1.5">
                    {ev.age ? <span className="kd-tag kd-tag-glass text-fg-1">{ev.age}</span> : null}
                    {status ? <span className="kd-tag kd-tag-glass text-fg-1"><span className={cx('h-[7px] w-[7px] rounded-full', statusTone)} aria-hidden="true" />{status}</span> : null}
                    {ev.festival?.flagship && ev.festival.label && !ev.past ? <span className="kd-tag kd-tag-featured">{tx(ev.festival.label, lang)}</span> : null}
                    {ev.origin === 'radar' ? <RadarTag lang={lang} glass /> : null}
                  </div>
                  <Countdown lang={lang} />
                </div>
                <div className="flex min-w-0 flex-col gap-4.5">
                  {/* The name alone, nothing above it: the style is on the poster and under "Giới thiệu", the city in the trail and the facts. */}
                  <h1 className="kd-d1">{ev.title}</h1>
                  {/* The four facts (design v2 phase 2): a grid of two on a computer, rows on a phone. Only facts
                      (design v2 phase 12): "Chỉ đường" is under the venue, "Thêm lịch" under "Thêm". */}
                  <div data-facts className="grid grid-cols-1 border-t border-line-1 desk:grid-cols-2 desk:gap-x-6">
                    <FactCell icon={<CalendarBlankIcon size={18} aria-hidden="true" />} label={T.factWhen}>
                      <span className="kd-num">{whenLong(ev, lang)}{timeRange(ev) ? ' · ' + timeRange(ev) : ''}</span>
                    </FactCell>
                    <FactCell icon={<MapPinIcon size={18} aria-hidden="true" />} label={T.factWhere}>
                      {ev.venue.name}{ev.venue.area ? <span className="text-fg-3"> · {ev.venue.area}</span> : null}
                    </FactCell>
                    {free || cheapest > 0 || ev.priceUnknown ? (
                      <FactCell icon={<TicketIcon size={18} aria-hidden="true" />} label={T.factPrice}>
                        <span className={cx('kd-num', free && 'text-info')}>{free ? T.free : cheapest > 0 ? fill(T.fromPrice, { p: money(cheapest, ev.currency, lang) }) : T.priceAtSeller}</span>
                      </FactCell>
                    ) : null}
                    {ev.age ? (
                      <FactCell icon={<IdentificationBadgeIcon size={18} aria-hidden="true" />} label={T.factAge}>{ev.age}</FactCell>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* No ticket button of its own: the panel right under the hero (the dock on a phone) is the one way to the
                        tickets, and a free night says so in its price fact. One primary action in sight. */}
                    <SaveWithCount lang={lang} />
                    <ShareButton lang={lang} />
                  </div>
                  <div className="border-t border-line-1">
                    {ev.origin === 'radar' ? (
                      <div className="kd-lrow min-h-15">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-fg-1" aria-hidden="true"><BroadcastIcon size={18} /></span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="kd-hs kd-ell">Feest Radar</span>
                          {radarHosts ? <span className="kd-s kd-ell">{fill(T.radarFound, { s: radarHosts })}</span> : null}
                        </span>
                      </div>
                    ) : org ? (
                      <div className="kd-lrow min-h-15">
                        <Link href={inLang('/o/' + org.slug, lang)} className="flex min-w-0 flex-1 items-center gap-3">
                          <Avatar name={org.name} src={org.logoUrl} size={36} org fit={square(36)} />
                          <span className="kd-hs kd-ell">{org.name}</span>
                          {org.verified ? <SealCheckIcon size={16} weight="fill" className="shrink-0 text-info" role="img" aria-label={T.verifiedOrg} /> : null}
                        </Link>
                        <FollowOrg lang={lang} />
                      </div>
                    ) : null}
                    {ev.sponsors?.length ? (
                      <div className="kd-lrow min-h-13">
                        <HandshakeIcon size={18} className="text-fg-3" aria-hidden="true" />
                        <span className="kd-t flex-1 text-fg-1"><span className="text-fg-3">{T.sponsoredBy} </span>{ev.sponsors.map((x) => x.name).join(', ')}</span>
                      </div>
                    ) : null}
                  </div>
                  <CommunityLine lang={lang} />
                </div>
              </div>
            </section>

            {/* ---- body ---- */}
            {/* One column, the tickets first (owner, 2026-10-20: no side column on any page). */}
            <section className="kd-wrap pt-10 tab:pt-14">
                <div className="flex flex-col gap-11">
                  <TicketsPanel lang={lang} />
                  {ev.updates.length ? (
                    <section aria-labelledby="upd-h" className="flex max-w-read flex-col gap-2">
                      <h2 id="upd-h" className="kd-d3">{T.updates}</h2>
                      <ul className="flex flex-col">
                        {ev.updates.map((u) => (
                          <li key={u.id} className="flex flex-col gap-1 border-t border-line-1 py-3">
                            <span className="kd-m flex items-center gap-2">
                              <span className={cx('h-[7px] w-[7px] rounded-full', u.kind === 'safety' || u.kind === 'delay' ? 'bg-warn' : 'bg-ok')} aria-hidden="true" />
                              {tx(u.kindLabel, lang)}
                            </span>
                            <p className="kd-t text-fg-1">{u.body}</p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {/* Who plays, before what it is (design v2 phase 12): the line-up decides a night. */}
                  <Lineup lang={lang} />

                  <ListenFirst lang={lang} />

                  <section id="about" aria-labelledby="about-h" className="flex max-w-read scroll-mt-32 flex-col gap-3">
                    <h2 id="about-h" className="kd-d3 flex flex-wrap items-center gap-x-3 gap-y-1">{T.about2}{machine ? <Tag tone="line">{T.autoTranslated}</Tag> : null}</h2>
                    {description ? (
                      <Clamp lines={3} more={pick({ m: { vi: 'Xem thêm', en: 'Show more' } }, lang).m} less={pick({ l: { vi: 'Thu gọn', en: 'Show less' } }, lang).l} className="kd-tl max-w-[680px] whitespace-pre-line text-fg-1">
                        {description}
                      </Clamp>
                    ) : null}
                    {facts.length ? <div className="flex flex-wrap gap-1.5">{facts.map((f) => <Tag key={f} tone="line">{f}</Tag>)}</div> : null}
                    {original ? (
                      <Accordion small summary={T.original} className="border-t border-line-1">
                        <p className="kd-t whitespace-pre-line text-fg-3" lang={textLang === 'vi' ? 'en' : 'vi'}>{original}</p>
                      </Accordion>
                    ) : null}
                    <Accordion small summary={seo.headings.facts} className="border-t border-line-1">
                      <div className="flex flex-col gap-3">
                        <p className="kd-s">{seo.page.summary}</p>
                        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 tab:grid-cols-2">
                          {seo.page.facts.map((f) => (
                            <div key={f.label} className="flex flex-col gap-0.5">
                              <dt className="kd-m">{f.label}</dt>
                              <dd className="kd-s text-fg-2">{f.href ? <a href={f.href} rel={/^https?:/.test(f.href) ? 'noopener' : undefined} className="kd-hit underline decoration-line-2 underline-offset-4 hover:text-fg-1">{f.value}</a> : f.value}</dd>
                            </div>
                          ))}
                        </dl>
                        {ev.sources.length ? (
                          <p className="kd-s">{T.sources}: {ev.sources.map((s, i) => (
                            <span key={i}>{i ? ' · ' : ''}{s.url ? <a href={s.url} rel="noopener nofollow" className="underline decoration-line-2 underline-offset-4">{tx(s.label, lang)}</a> : tx(s.label, lang)}</span>
                          ))}</p>
                        ) : null}
                      </div>
                    </Accordion>
                  </section>

                  <EventExtras lang={lang} />
                </div>
            </section>

            {/* ---- venue ---- */}
            <section id="venue" aria-labelledby="venue-h" className="kd-wrap scroll-mt-32 pt-[clamp(56px,7vw,88px)]">
              <div className="flex flex-col gap-6">
                <div className="flex max-w-read flex-col gap-3">
                  {/* The name is the heading; the address and "Chỉ đường" under it say what it is. No label above it. */}
                  <h2 id="venue-h" className="kd-d2">{ev.venue.name}</h2>
                  {address ? <p className="kd-t">{address}</p> : null}
                  <div className="mt-1 flex flex-wrap gap-2">
                    <a className={buttonClass({})} href={mapsHref} target="_blank" rel="noopener">{T.directions}<ArrowUpRightIcon size={16} aria-hidden="true" /></a>
                    <RideButton lang={lang} size="md" tone="default" fromLink />
                    {address ? <CopyAddress lang={lang} text={[ev.venue.name, address].filter(Boolean).join(', ')} /> : null}
                  </div>
                  {ev.travel || ev.entryRules ? (
                    <div className="mt-2 border-t border-line-1">
                      {ev.travel ? <Accordion small summary={T.travel}><p className="kd-t text-fg-3">{ev.travel}</p></Accordion> : null}
                      {ev.entryRules ? <Accordion small summary={T.entryRules}><p className="kd-t text-fg-3">{ev.entryRules}</p></Accordion> : null}
                    </div>
                  ) : null}
                </div>
                {ev.venue.lat != null && ev.venue.lng != null ? (
                  <a className="kd-card relative aspect-video max-h-120 min-h-80 overflow-hidden after:pointer-events-none after:absolute after:inset-0 after:rounded-card after:shadow-[inset_0_0_0_1px_var(--color-line-1)] after:content-['']" href={inLang(`/?view=map&city=${enc(ev.city)}`, lang)} aria-label={T.onMap}>
                    <VenueMap lat={ev.venue.lat} lng={ev.venue.lng} family={fam} label={(ev.venue.name ?? ev.title).split(' — ')[0]} className="absolute inset-0 bg-map" />
                  </a>
                ) : null}
              </div>
            </section>

            {/* ---- the rest: going with friends, the guide, the calendar, Hỏi đáp and Hype, folded under "Thêm" (design v2 phase 12) ---- */}
            <section className="kd-wrap pt-[clamp(56px,7vw,88px)]">
              <EventMore lang={lang} />
            </section>

            {/* ---- also by the organiser ---- */}
            {also.length ? (
              <section aria-labelledby="also-h" className="kd-wrap flex flex-col gap-5 pt-[clamp(56px,7vw,88px)]">
                <div className="kd-sec">
                  <h2 id="also-h" className="kd-d2">{alsoIsOrg && org ? fill(T.alsoBy, { o: org.name }) : T.youMayLike}</h2>
                  {alsoIsOrg && org ? <Link className={buttonClass({ size: 'sm' })} href={inLang('/o/' + org.slug, lang)}>{T.viewProfile}</Link> : null}
                </div>
                {/* Rows, a column on a phone and side by side wider (design v2 phase 11): a night without a cover is no big title tile. */}
                <div className="grid tab:grid-cols-2 tab:gap-x-8 wide:grid-cols-3">
                  {also.map((e) => <EventCard key={e.id} e={e} lang={lang} look="row" />)}
                </div>
              </section>
            ) : null}
            </main>

            {hasTickets ? <BuyDock lang={lang} price={cheapest > 0 && !ev.priceUnknown ? money(cheapest, ev.currency, lang) : null} /> : null}
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
    </InLang>
  );
}

/** One fact of the hero: a label, the value, and the action that goes with it (add to the calendar, directions). */
function FactCell({ icon, label, action, children }: { icon: ReactNode; label: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="kd-lrow min-h-15 gap-3">
      <span className="text-fg-3">{icon}</span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="kd-m">{label}</span>
        <span className="kd-t text-fg-1">{children}</span>
      </div>
      {action}
    </div>
  );
}
