'use client';
/**
 * The home page's calendar (owner, 2026-11-06): Google Calendar's month view. A toolbar (Hôm nay,
 * ‹ ›, the month, "Thêm vào Google Calendar", which subscribes Google Calendar to /calendar.ics),
 * then the weeks, Monday first. Each day shows its nights as one-line chips (a festival on every day
 * it spans) and "+n" when they do not fit; a chip is the event's link, and a click opens its card
 * beside it (a sheet on a phone, where a tap on the day lists its nights). Under the weeks, the next
 * nights as a list (#tonight, where the map's "Tối nay" leads). Dates are calendar days
 * ('YYYY-MM-DD', already in each event's city), counted in UTC so the server and the browser agree.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { CalendarPlusIcon, CaretLeftIcon, CaretRightIcon, XIcon } from '@phosphor-icons/react/ssr';
import { fill, INTL, pick, tx, type Lang } from '../../copy';
import { cx } from '../../cx';
import { dayMonth, timeRange, weekdayLong, weekdayShort, whenLong } from '../../format';
import { KdLink, inLang } from '../../link';
import { useKd } from '../../runtime';
import { Button, IconButton, LinkButton, buttonClass } from '../../ui/actions';
import { Sheet } from '../../ui/sheet';
import type { Card } from '../../types';
import { priceLine } from '../price';
import { calendarFields, googleCalendarUrl } from '../event/calendar';
import { LIST } from './copy';
import { EventStamp, isLive } from './stamp';

/** One night as GET /events/map answers it: what the map and the calendar draw. */
export type HomeEvent = Pick<Card, 'id' | 'slug' | 'title' | 'genre' | 'styles' | 'startsOn' | 'endsOn' | 'startTime' | 'endTime' | 'startsAt' | 'endsAt' | 'timezone' | 'cityLabel' | 'coverUrl' | 'logoUrl' | 'priceFrom' | 'currency' | 'isFree' | 'priceUnknown' | 'soldOut'> & {
  venue: string | null; lat: number; lng: number; approx: boolean;
};

const DAY = 86_400_000;
const at = (iso: string) => Date.parse(iso + 'T00:00:00Z');
const isoOf = (t: number) => new Date(t).toISOString().slice(0, 10);
/** 'YYYY-MM' moved by n months. */
const shift = (ym: string, n: number) => isoOf(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1 + n, 1)).slice(0, 7);
/** Columns × rows for a day's n stamps, nine at most (the ninth then says how many more). */
const GRID: [number, number][] = [[1, 1], [1, 1], [2, 1], [3, 1], [2, 2], [3, 2], [3, 2], [3, 3], [3, 3], [3, 3]];
const MAX = 9;

/**
 * The days a night fills: a festival every day from its first to its last, a club night that ends
 * the next morning only its first.
 */
function daysOf(e: HomeEvent): string[] {
  if (!e.startsOn) return [];
  const end = e.endsOn && e.endsOn > e.startsOn ? e.endsOn : e.startsOn;
  const n = Math.min(Math.round((at(end) - at(e.startsOn)) / DAY), 30);
  if (n === 1 && e.endTime && e.endTime <= '12:00') return [e.startsOn];
  return Array.from({ length: n + 1 }, (_, i) => isoOf(at(e.startsOn!) + i * DAY));
}
const spans = (e: HomeEvent) => daysOf(e).length > 1;

/** Each day's nights, festivals first, then by the time they start (Google's order). */
function byDayOf(events: HomeEvent[]) {
  const m = new Map<string, HomeEvent[]>();
  for (const e of events) for (const d of daysOf(e)) m.set(d, [...(m.get(d) ?? []), e]);
  for (const list of m.values()) list.sort((a, b) => Number(spans(b)) - Number(spans(a)) || (a.startTime ?? '').localeCompare(b.startTime ?? ''));
  return m;
}

/**
 * The next nights (persona review, 2026-11-07: "what's on tonight?"): today's that have not ended,
 * else the first day after with any. `now` is 0 on the server, where every one of today's counts.
 */
export function nextNights(events: HomeEvent[], today: string, now: number, byDay = byDayOf(events)): { day: string; list: HomeEvent[] } | null {
  const day = [...byDay.keys()].filter((d) => d >= today).sort().find((d) => d > today || byDay.get(d)!.some((e) => !now || !e.endsAt || Date.parse(e.endsAt) > now));
  if (!day) return null;
  return { day, list: byDay.get(day)!.filter((e) => day > today || !now || !e.endsAt || Date.parse(e.endsAt) > now) };
}

/** "Tối nay", "Ngày mai", else the day's name. */
export function dayName(day: string, today: string, lang: Lang) {
  const T = pick(LIST, lang);
  return day === today ? T.tonight : day === isoOf(at(today) + DAY) ? T.tomorrow : `${weekdayLong(day, lang)} ${dayMonth(day, lang)}`;
}

type Open = { kind: 'event'; ev: HomeEvent; from: HTMLElement } | { kind: 'day'; day: string; from: HTMLElement };

export function Calendar({ lang, events, today, now, city, siteUrl }: {
  lang: Lang; events: HomeEvent[]; today: string; city?: string; siteUrl: string;
  /** The API's clock in ms (0 on the server): which nights are under way. */
  now: number;
}) {
  const T = pick(LIST, lang);
  const [ym, setYm] = useState(today.slice(0, 7));
  const [open, setOpen] = useState<Open | null>(null);
  const [sheet, setSheet] = useState(false);

  const byDay = useMemo(() => byDayOf(events), [events]);
  const next = nextNights(events, today, now, byDay);

  const first = at(ym + '-01');
  const lead = (new Date(first).getUTCDay() + 6) % 7;
  const inMonth = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 0)).getUTCDate();
  const weeks = Math.ceil((lead + inMonth) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => isoOf(first + (i - lead) * DAY));
  const title = new Intl.DateTimeFormat(INTL[lang], { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(first);

  const feed = new URL('/calendar.ics', siteUrl);
  if (city) feed.searchParams.set('city', city);
  if (lang !== 'vi') feed.searchParams.set('lang', 'en');
  const subscribe = 'https://calendar.google.com/calendar/r?cid=' + encodeURIComponent(`webcal://${feed.host}${feed.pathname}${feed.search}`);

  /** A phone shows a sheet; a wider screen a card beside what was clicked. */
  const show = (o: Open) => { setSheet(matchMedia('(max-width: 759px)').matches); setOpen(o); };
  const close = () => { const from = open?.from; setOpen(null); from?.focus(); };

  /** A night's stamp: its link (in the HTML), named by its time and title; a click opens its card. */
  const stamp = (e: HomeEvent, d: string) => (
    <KdLink
      key={e.id}
      href={inLang('/e/' + e.slug, lang)}
      aria-label={[d === e.startsOn ? e.startTime : null, e.title].filter(Boolean).join(' ')}
      title={e.title}
      onClick={(ev) => {
        if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
        ev.preventDefault();
        show({ kind: 'event', ev: e, from: ev.currentTarget });
      }}
    >
      <EventStamp e={e} live={isLive(e, now)} />
    </KdLink>
  );

  return (
    <section aria-labelledby="cal-h" className="kd-wrap relative flex flex-col gap-4 pt-10">
      <div className="flex flex-wrap items-center gap-2">
        <Button tone="default" size="sm" onClick={() => setYm(today.slice(0, 7))}>{T.today}</Button>
        <IconButton label={T.prevMonth} onClick={() => setYm((m) => shift(m, -1))}><CaretLeftIcon size={18} aria-hidden="true" /></IconButton>
        <IconButton label={T.nextMonth} onClick={() => setYm((m) => shift(m, 1))}><CaretRightIcon size={18} aria-hidden="true" /></IconButton>
        <h2 id="cal-h" className="kd-d3 mr-auto first-letter:uppercase" aria-live="polite" suppressHydrationWarning>{title}</h2>
        <a href={subscribe} target="_blank" rel="noopener" className={buttonClass({ tone: 'default', size: 'sm' }, 'gap-2')}>
          <CalendarPlusIcon size={18} aria-hidden="true" />{T.addGoogleCal}
        </a>
      </div>

      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr>{days.slice(0, 7).map((d) => <th key={d} scope="col" className="kd-m pb-2 text-center font-normal">{weekdayShort(d, lang)}</th>)}</tr>
        </thead>
        <tbody>
          {Array.from({ length: weeks }, (_, w) => (
            <tr key={w}>
              {days.slice(w * 7, w * 7 + 7).map((d) => {
                const list = byDay.get(d) ?? [];
                const out = d.slice(0, 7) !== ym;
                const named = `${weekdayLong(d, lang)} ${dayMonth(d, lang)}`;
                return (
                  <td key={d} className="relative border border-line-1 p-0 align-top">
                    <div className="flex h-16 flex-col p-0.5 tab:h-28 tab:p-1">
                      <div className="flex justify-center pb-0.5">
                        <span className={cx('kd-num grid size-6 place-items-center rounded-full text-xs', d === today ? 'bg-info font-semibold text-on-accent' : out ? 'text-fg-3' : 'text-fg-1')}>{+d.slice(8)}</span>
                      </div>
                      {list.length ? (
                        <div className="kd-cstamp-box min-h-0 flex-1 max-tab:pointer-events-none">
                          <div className="kd-cstamps" style={{ '--cols': GRID[Math.min(list.length, MAX)][0], '--rows': GRID[Math.min(list.length, MAX)][1] } as CSSProperties}>
                            {list.slice(0, list.length > MAX ? MAX - 1 : MAX).map((e) => stamp(e, d))}
                            {list.length > MAX ? (
                              <button type="button" className="kd-cstamp-more kd-num" onClick={(ev) => show({ kind: 'day', day: d, from: ev.currentTarget })}>
                                +{list.length - MAX + 1}<span className="sr-only"> {T.moreRest}</span>
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    {/* A phone: the whole day is one tap, listing its nights. */}
                    {list.length ? (
                      <button type="button" className="absolute inset-0 tab:hidden" aria-label={`${named}, ${fill(T.nNights, { n: list.length })}`} onClick={(ev) => show({ kind: 'day', day: d, from: ev.currentTarget })} />
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* The next nights as a list, where the map's "Tối nay" leads. */}
      {next ? (
        <section id="tonight" aria-labelledby="tonight-h" className="flex scroll-mt-20 flex-col gap-2 pt-4">
          <h3 id="tonight-h" className="kd-h first-letter:uppercase">{dayName(next.day, today, lang)}</h3>
          <ul className="flex flex-col">
            {next.list.map((e) => (
              <li key={e.id} className="border-b border-line-1 last:border-0">
                <KdLink href={inLang('/e/' + e.slug, lang)} className="flex min-h-16 min-w-0 items-center gap-3 py-2 hover:bg-surface-1">
                  <span className="size-11 shrink-0"><EventStamp e={e} live={isLive(e, now)} /></span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="kd-ell text-fg-1">{e.title}</span>
                    <span className="kd-s kd-ell">{[e.startsOn === next.day ? timeRange(e) : null, e.venue, tx(e.cityLabel, lang)].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className={cx('kd-mb kd-num shrink-0', e.isFree && 'text-info')}>{priceLine({ ...e, entryMode: e.isFree ? 'free' : 'paid' }, lang)}</span>
                </KdLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {open && sheet ? (
        <Sheet onClose={close} closeLabel={T.close} title={open.kind === 'event' ? open.ev.title : `${weekdayLong(open.day, lang)} ${dayMonth(open.day, lang)}`}>
          {open.kind === 'event' ? <EventFacts ev={open.ev} lang={lang} /> : <DayList day={open.day} list={byDay.get(open.day) ?? []} lang={lang} onPick={(ev, from) => show({ kind: 'event', ev, from })} />}
        </Sheet>
      ) : open ? (
        <Pop from={open.from} onClose={close} label={open.kind === 'event' ? open.ev.title : `${weekdayLong(open.day, lang)} ${dayMonth(open.day, lang)}`} closeLabel={T.close}>
          {open.kind === 'event' ? <EventFacts ev={open.ev} lang={lang} /> : <DayList day={open.day} list={byDay.get(open.day) ?? []} lang={lang} onPick={(ev, from) => show({ kind: 'event', ev, from })} />}
        </Pop>
      ) : null}
    </section>
  );
}

/** A card beside what opened it, like Google Calendar's, placed in the calendar so it scrolls with it: Escape or a click elsewhere closes it. */
function Pop({ from, onClose, label, closeLabel, children }: { from: HTMLElement; onClose: () => void; label: string; closeLabel: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const r = from.getBoundingClientRect(), box = ref.current!.getBoundingClientRect();
    const host = (ref.current!.offsetParent ?? document.body).getBoundingClientRect();
    const right = r.right + 8 + box.width <= host.right;
    setPos({
      left: (right ? r.right + 8 : Math.max(host.left, r.left - 8 - box.width)) - host.left,
      top: Math.max(0, Math.min(r.top - host.top, host.height - box.height)),
    });
    ref.current!.focus({ preventScroll: true });
  }, [from]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const down = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node) && !from.contains(e.target as Node)) onClose(); };
    addEventListener('keydown', key);
    addEventListener('pointerdown', down);
    return () => { removeEventListener('keydown', key); removeEventListener('pointerdown', down); };
  }, [from, onClose]);
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      tabIndex={-1}
      className={cx('absolute z-40 flex w-80 max-w-[calc(100vw-1rem)] flex-col gap-3 rounded-card bg-surface-1 p-4 shadow-lg ring-1 ring-line-2 outline-none', !pos && 'invisible')}
      style={pos ?? undefined}
    >
      <IconButton label={closeLabel} size="sm" className="absolute right-1 top-1" onClick={onClose}><XIcon size={16} aria-hidden="true" /></IconButton>
      {children}
    </div>
  );
}

/** One night's card: when, where, the price, its page and Google Calendar. */
function EventFacts({ ev, lang }: { ev: HomeEvent; lang: Lang }) {
  const T = pick(LIST, lang);
  const kd = useKd();
  const where = [ev.venue, tx(ev.cityLabel, lang)].filter(Boolean).join(' · ');
  const google = googleCalendarUrl(calendarFields({ ...ev, venue: { name: ev.venue }, description: null }, lang, location.origin), kd.user?.email);
  return (
    <div className="flex flex-col gap-3 pr-8">
      <h3 className="kd-hs">{ev.title}</h3>
      <div className="flex flex-col gap-1">
        <span className="kd-s text-fg-2">{whenLong(ev, lang)}{timeRange(ev) ? ` · ${timeRange(ev)}` : ''}</span>
        {where ? <span className="kd-s text-fg-2">{where}</span> : null}
        <span className={cx('kd-mb kd-num', ev.isFree && 'text-info')}>{priceLine({ ...ev, entryMode: ev.isFree ? 'free' : 'paid' }, lang)}{ev.soldOut ? ` · ${T.stSold}` : ''}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <LinkButton tone="acc" size="sm" href={inLang('/e/' + ev.slug, lang)}>{T.details}</LinkButton>
        <a href={google} target="_blank" rel="noopener" className={buttonClass({ tone: 'default', size: 'sm' }, 'gap-2')}>
          <CalendarPlusIcon size={16} aria-hidden="true" />{T.addOne}
        </a>
      </div>
    </div>
  );
}

/** A day's nights, each opening its card. */
function DayList({ day, list, lang, onPick }: { day: string; list: HomeEvent[]; lang: Lang; onPick: (ev: HomeEvent, from: HTMLElement) => void }) {
  return (
    <ul className="flex flex-col">
      {list.map((e) => (
        <li key={e.id}>
          <KdLink
            href={inLang('/e/' + e.slug, lang)}
            className="flex min-h-11 min-w-0 items-center gap-2 rounded-sm px-1 hover:bg-surface-2"
            onClick={(ev) => {
              if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
              ev.preventDefault();
              onPick(e, ev.currentTarget);
            }}
          >
            <span className="kd-num kd-s w-12 shrink-0">{e.startsOn === day ? e.startTime : null}</span>
            <span className="flex min-w-0 flex-col">
              <span className="kd-ell text-fg-1">{e.title}</span>
              {e.venue ? <span className="kd-ell kd-s">{e.venue}</span> : null}
            </span>
          </KdLink>
        </li>
      ))}
    </ul>
  );
}
