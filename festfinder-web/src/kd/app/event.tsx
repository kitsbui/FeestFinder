'use client';
/**
 * /app/e/<slug> in Kính đêm (design/App-Event): the art with glass back / share / save, the
 * organiser, date ("Thêm lịch") and venue ("Chỉ đường") rows, about, line-up with the full
 * timetable (plan picks and clashes), the organiser's updates, hype, tickets, FAQ, the
 * discussion, and a glass dock with the price and "Mua vé". The parts are the web event page's,
 * reading the same live copy of the event.
 */
import { useEffect, useState } from 'react';
import { ArrowLeftIcon, ArrowUpRightIcon, CalendarBlankIcon, CaretRightIcon, HeartIcon, MapPinIcon, ShareNetworkIcon } from '@phosphor-icons/react/ssr';
import { fill, pick, type Lang } from '../copy';
import { cx } from '../cx';
import { km, money, timeRange, whenLong } from '../format';
import { FAMILY_LABEL, familyOf, g } from '../genre';
import { useSaved } from '../runtime';
import { buttonClass, IconButton } from '../ui/actions';
import { Clamp } from '../ui/clamp';
import { Accordion, Art, Avatar, Status } from '../ui/parts';
import { Dock } from '../ui/shell';
import type { EventDetail } from '../types';
import { CopyAddress, Countdown, ShareSheet } from '../web/event/actions';
import { Ambassadors, DiscussionSection, Hype, PhotoWall } from '../web/event/community';
import { EventClientProvider, useEvent } from '../web/event/context';
import { Lineup } from '../web/event/lineup';
import { TicketsPanel } from '../web/event/tickets';
import { APP } from './copy';
import { distanceKm, place } from './place';

const EVENT_TYPE: Record<string, { vi: string; en: string }> = {
  club: { vi: 'Club', en: 'Club night' }, festival: { vi: 'Lễ hội', en: 'Festival' }, concert: { vi: 'Concert', en: 'Concert' },
  rave: { vi: 'Rave', en: 'Rave' }, party: { vi: 'Tiệc', en: 'Party' }, show: { vi: 'Show', en: 'Show' },
};

export function AppEvent({ lang, ev }: { lang: Lang; ev: EventDetail }) {
  return (
    <EventClientProvider ev={ev}>
      <EventBody lang={lang} />
    </EventClientProvider>
  );
}

function EventBody({ lang }: { lang: Lang }) {
  const T = pick(APP, lang);
  const { ev } = useEvent();
  const [saved, toggleSave] = useSaved(ev.id);
  const [sharing, setSharing] = useState(false);
  const [at, setAt] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => { setAt(place.at()); }, []);
  const fam = familyOf(ev.genre);
  const free = ev.isFree || ev.entryMode === 'free';
  const tiers = ev.tickets?.tiers ?? [];
  const open = tiers.filter((t) => t.state === 'onsale' || t.state === 'last');
  const cheapest = open.length ? Math.min(...open.map((t) => t.price)) : ev.priceFrom;
  const canBuy = !free && !ev.past && (open.length > 0 || !!ev.links.go);
  const status = ev.past ? T.ended : ev.soldOut ? pick({ s: { vi: 'Hết vé', en: 'Sold out' } }, lang).s : ev.badge ? ev.badge.label[lang] : null;
  const statusTone = ev.soldOut ? 'bg-hot' : ev.badge?.key === 'low_tickets' || ev.badge?.key === 'selling_fast' ? 'bg-warn' : 'bg-ok';
  const familyLine = [FAMILY_LABEL[fam][lang], ev.eventType ? EVENT_TYPE[ev.eventType]?.[lang] : null, ev.cityLabel?.[lang]].filter(Boolean).join(' · ');
  const description = ev.description?.[lang] || ev.description?.vi || ev.description?.en || '';
  const address = [ev.venue.address, ev.venue.area, ev.cityLabel?.[lang]].filter(Boolean).join(', ');
  const mapsHref = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(ev.venue.lat != null && ev.venue.lng != null ? `${ev.venue.lat},${ev.venue.lng}` : [ev.venue.name, address].filter(Boolean).join(', '));
  const d = at ? distanceKm(at, ev.venue) : null;
  const org = ev.organizer;
  const back = (e: React.MouseEvent) => {
    // Back where they came from inside the app; a link from outside lands on Explore.
    if (document.referrer.startsWith(location.origin + '/app') && history.length > 1) { e.preventDefault(); history.back(); }
  };

  return (
    <div className={cx('flex flex-col', g(fam), canBuy && 'pb-[calc(96px+env(safe-area-inset-bottom))]')}>
      <div className="relative">
        <Art family={fam} cover={ev.coverUrl} alt={ev.title} off={ev.past} className="h-[300px] rounded-none" />
        <div className="absolute inset-x-3 top-2.5 z-[3] flex gap-2">
          <a className="kd-ib kd-glass text-paper" href="/app" aria-label={T.back} onClick={back}><ArrowLeftIcon size={20} aria-hidden="true" /></a>
          <IconButton glass label={T.share} className="ml-auto text-paper" onClick={() => setSharing(true)}><ShareNetworkIcon size={20} aria-hidden="true" /></IconButton>
          <IconButton glass label={T.saveEvent} pressed={saved} className={saved ? 'text-acc' : 'text-paper'} onClick={toggleSave}>
            <HeartIcon size={20} weight={saved ? 'fill' : 'regular'} aria-hidden="true" />
          </IconButton>
        </div>
        <div className="absolute bottom-9 left-4 z-[3] flex flex-wrap gap-1.5">
          {ev.age ? <span className="kd-tag kd-tag-glass text-paper">{ev.age}</span> : null}
          {status ? <span className="kd-tag kd-tag-glass text-paper"><span className={cx('h-[7px] w-[7px] rounded-full', statusTone)} aria-hidden="true" />{status}</span> : null}
          <Countdown lang={lang} inline />
        </div>
      </div>

      <section className="relative z-[4] -mt-5 flex flex-col rounded-t-[20px] bg-void px-4 pt-5">
        <span className="kd-m flex items-center gap-1.5"><span className="kd-mk" aria-hidden="true" />{familyLine}</span>
        <h1 className="kd-d2 mt-2">{ev.title}</h1>

        <div className="mt-2.5 border-t border-line">
          {org ? (
            <a className="kd-lrow min-h-16" href={'/o/' + org.slug + (lang === 'en' ? '?lang=en' : '')}>
              <Avatar org name={org.name} src={org.logoUrl} size={40} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="kd-hs kd-ell">{org.name}</span>
                {org.verified ? <Status tone="ok">{T.verifiedOrg}</Status> : <span className="kd-s">{T.orgLabel}</span>}
              </span>
              <CaretRightIcon size={16} className="text-fog" aria-hidden="true" />
            </a>
          ) : null}
          <div className="kd-lrow min-h-13">
            <CalendarBlankIcon size={18} className="text-fog" aria-hidden="true" />
            <span className="kd-t kd-num flex-1 text-paper">{whenLong(ev, lang)}{timeRange(ev) ? ' · ' + timeRange(ev) : ''}</span>
            {!ev.past ? <a className={buttonClass({ tone: 'ghost', size: 'sm' }, '-mr-3')} href={`/events/${ev.id}/calendar.ics`} download>{T.addCalendar}</a> : null}
          </div>
          <div className="kd-lrow min-h-13">
            <MapPinIcon size={18} className="text-fog" aria-hidden="true" />
            <span className="kd-t flex-1 text-paper">{ev.venue.name}{d != null ? <span className="kd-num text-fog"> · {km(d, lang)}</span> : ev.venue.area ? <span className="text-fog"> · {ev.venue.area}</span> : null}</span>
            <a className={buttonClass({ tone: 'ghost', size: 'sm' }, '-mr-3')} href={mapsHref} target="_blank" rel="noopener">{T.directions}</a>
          </div>
        </div>

        {description ? (
          <div className="pt-4.5">
            <Clamp lines={3} more={pick({ m: { vi: 'Xem thêm', en: 'Show more' } }, lang).m} less={pick({ l: { vi: 'Thu gọn', en: 'Show less' } }, lang).l} className="kd-t whitespace-pre-line text-mist">
              {description}
            </Clamp>
          </div>
        ) : null}

        {ev.updates.length ? (
          <section aria-labelledby="app-upd-h" className="flex flex-col gap-1 pt-6">
            <h2 id="app-upd-h" className="kd-m">{T.fromOrg}</h2>
            <ul className="flex flex-col">
              {ev.updates.map((u) => (
                <li key={u.id} className="flex flex-col gap-1 border-t border-line py-3">
                  <span className="kd-m flex items-center gap-2"><span className={cx('h-[7px] w-[7px] rounded-full', u.kind === 'safety' || u.kind === 'delay' ? 'bg-warn' : 'bg-ok')} aria-hidden="true" />{u.kindLabel?.[lang]}</span>
                  <p className="kd-t text-paper">{u.body}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="flex flex-col gap-9 pt-6">
          <Lineup lang={lang} />
          <Hype lang={lang} />
          <TicketsPanel lang={lang} />
          {ev.faq.length ? (
            <section aria-labelledby="app-faq-h" className="flex flex-col">
              <h2 id="app-faq-h" className="kd-m pb-1.5">{pick({ f: { vi: 'Câu hỏi thường gặp', en: 'Frequently asked' } }, lang).f}</h2>
              <div className="border-t border-line">
                {ev.faq.map((f) => (
                  <Accordion key={f.question} small name="faq" summary={f.question}><p className="kd-t text-fog">{f.answer}</p></Accordion>
                ))}
              </div>
            </section>
          ) : null}
          <DiscussionSection lang={lang} />
          <PhotoWall lang={lang} />
          <Ambassadors lang={lang} />
          <section id="venue" aria-labelledby="app-venue-h" className="flex scroll-mt-4 flex-col gap-2 pb-8">
            <span className="kd-m">{pick({ v: { vi: 'Địa điểm', en: 'Venue' } }, lang).v}</span>
            <h2 id="app-venue-h" className="kd-h">{ev.venue.name}</h2>
            {address ? <p className="kd-s">{address}</p> : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <a className={buttonClass({ size: 'sm' })} href={mapsHref} target="_blank" rel="noopener">{T.directions}<ArrowUpRightIcon size={14} aria-hidden="true" /></a>
              {address ? <CopyAddress lang={lang} text={[ev.venue.name, address].filter(Boolean).join(', ')} /> : null}
            </div>
          </section>
        </div>
      </section>

      {canBuy ? (
        <Dock>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="kd-h kd-num">{open.length ? fill(T.fromPrice, { p: money(cheapest, ev.currency, lang) }) : T.buy}</span>
            <span className="kd-s kd-ell">{open.find((t) => t.price === cheapest)?.name[lang] ?? ev.venue.name}</span>
          </div>
          <a className={buttonClass({ tone: 'acc', size: 'lg' }, 'ml-auto')} href="#tickets">{T.buy}</a>
        </Dock>
      ) : null}

      {sharing ? <ShareSheet lang={lang} onClose={() => setSharing(false)} /> : null}
    </div>
  );
}
