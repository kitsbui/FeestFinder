/**
 * The list's grid, its default view (design v2 phase 2): the events by day. Each of the first
 * seven days has its heading ("Thứ Bảy 17.10 · hôm nay"), a lead card and the next nights as rows
 * beside it, then cards; after the first week, a heading per month. In a box narrower than 600px (a
 * phone) every event is a row (kd.css `.kd-days`). Grouped by the events' own calendar days, so the
 * server and the browser draw the same headings; "hôm nay" and "ngày mai" come once the clock is known.
 *
 * Beside it on a wide screen, the rail: the next seven days with how many nights each (a tap goes
 * to that day), and the cities placed by where they are, each with its count (a tap filters).
 */
import { ArrowRightIcon } from '@phosphor-icons/react/ssr';
import type { ReactNode } from 'react';
import { pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import { day, daysBetween, dayMonth, weekdayLong, weekdayShort } from '../../format';
import type { Card } from '../../types';
import { EventCard } from '../card';
import { LIST } from './copy';

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** How many days from the first get a heading of their own. */
const DAYS = 7;

export interface DayGroup { key: string; id: string; title: string; note: string | null; items: Card[]; byDay: boolean }

const addDays = (iso: string, n: number) => {
  const x = day(iso);
  return new Date(Date.UTC(x.y, x.m - 1, x.d + n)).toISOString().slice(0, 10);
};

/** The first day the list counts from: today once the clock is known, else the first night listed. */
export function anchorDay(items: Card[], today: string | null): string | null {
  const first = items.find((e) => e.startsOn)?.startsOn ?? null;
  return today ?? first;
}

/** The events (already in date order) under their day, or their month after the first week. */
export function groupByDay(items: Card[], lang: Lang, today: string | null): DayGroup[] {
  const T = pick(LIST, lang);
  const anchor = anchorDay(items, today);
  const groups = new Map<string, DayGroup>();
  for (const e of items) {
    // A night that started before the anchor and is still on is today's.
    const on = e.startsOn && anchor && e.startsOn < anchor ? anchor : e.startsOn;
    let key: string, title: string, note: string | null = null, byDay = false;
    if (!on || !anchor) {
      key = 'none'; title = T.noDate;
    } else if (daysBetween(anchor, on) < DAYS) {
      key = on; byDay = true;
      title = `${weekdayLong(on, lang)} ${dayMonth(on, lang)}`;
      if (today && on === today) note = T.today;
      else if (today && on === addDays(today, 1)) note = T.tomorrow;
    } else {
      const x = day(on), a = day(anchor);
      key = on.slice(0, 7);
      const name = lang === 'vi' ? `Tháng ${x.m}` : MONTHS_EN[x.m - 1];
      title = x.y === a.y ? name : `${name} ${x.y}`;
    }
    const g = groups.get(key) ?? { key, id: 'day-' + key, title, note, items: [], byDay };
    g.items.push(e);
    groups.set(key, g);
  }
  return [...groups.values()];
}

/** The groups: a day's first night leads (a featured one first), the next three sit beside it as rows. */
export function DayGrid({ groups, lang, className }: { groups: DayGroup[]; lang: Lang; className?: string }) {
  return (
    <div className={cx('kd-days flex flex-col gap-10', className)}>
      {groups.map((g) => {
        // Three nights or more: one alone beside a single row leaves a hole.
        const pickLead = g.byDay && g.items.length > 2;
        const lead = pickLead ? g.items.find((e) => e.festival?.flagship || e.featured) ?? g.items[0] : null;
        const others = lead ? g.items.filter((e) => e !== lead) : g.items;
        const stack = lead ? others.slice(0, 3) : [];
        const rest = lead ? others.slice(3) : others;
        return (
          <section key={g.key} id={g.id} aria-labelledby={g.id + '-h'} className="flex scroll-mt-36 flex-col gap-4">
            <h2 id={g.id + '-h'} className="kd-d3 flex flex-wrap items-baseline gap-x-2.5">
              {g.title}
              {g.note ? <span className="kd-s font-normal">{g.note}</span> : null}
            </h2>
            {lead ? (
              <div className="kd-day-top">
                <EventCard e={lead} lang={lang} look="lead" />
                <div className="kd-day-stack">{stack.map((e) => <EventCard key={e.id} e={e} lang={lang} look="row" />)}</div>
              </div>
            ) : null}
            {rest.length ? <div className="kd-cards">{rest.map((e) => <EventCard key={e.id} e={e} lang={lang} />)}</div> : null}
          </section>
        );
      })}
    </div>
  );
}

interface City { slug: string; name: string; center: [number, number] | null; count: number }

/** The rail beside the days (from 1200px): the week ahead and the cities. */
export function ListRail({ lang, items, today, cities, onCity, onMap }: {
  lang: Lang; items: Card[]; today: string | null; cities: City[]; onCity: (slug: string) => void; onMap: () => void;
}) {
  const T = pick(LIST, lang);
  const anchor = anchorDay(items, today);
  const week = anchor ? Array.from({ length: DAYS }, (_, i) => addDays(anchor, i)) : [];
  const perDay = new Map<string, number>();
  for (const e of items) {
    const on = e.startsOn && anchor && e.startsOn < anchor ? anchor : e.startsOn;
    if (on) perDay.set(on, (perDay.get(on) ?? 0) + 1);
  }
  const go = (iso: string) => {
    document.getElementById('day-' + iso)?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const placed = cities.filter((c) => c.count > 0);
  return (
    <aside aria-label={T.rail} className="sticky top-36 hidden w-75 shrink-0 flex-col gap-4 self-start wide:flex">
      {week.length ? (
        <Box title={T.next7}>
          <div className="grid grid-cols-7 gap-1">
            {week.map((iso) => {
              const n = perDay.get(iso) ?? 0;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!n}
                  onClick={() => go(iso)}
                  className={cx('flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-btn text-fg-1 hover:bg-white/[0.05] disabled:text-fg-3 disabled:hover:bg-transparent', iso === today && 'shadow-[inset_0_0_0_1px_var(--color-info)]')}
                >
                  <span className="kd-m">{weekdayShort(iso, lang)}</span>
                  <span className="kd-hs kd-num">{day(iso).d}</span>
                  <span className={cx('kd-m kd-num', n ? 'text-info' : '')}>{n}</span>
                  <span className="sr-only">, {weekdayLong(iso, lang)} {dayMonth(iso, lang)}</span>
                </button>
              );
            })}
          </div>
        </Box>
      ) : null}
      {placed.length ? (
        <Box title={T.cities}>
          <CityDots cities={placed} />
          <ul className="flex flex-col">
            {placed.map((c) => (
              <li key={c.slug}>
                <button type="button" onClick={() => onCity(c.slug)} className="flex min-h-11 w-full items-center justify-between border-b border-line-1 text-left text-sm text-fg-2 hover:text-fg-1">
                  <span>{c.name}</span><span className="kd-num text-fg-1">{c.count}</span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={onMap} className="kd-nl -mx-2.5 self-start">{T.seeMap}<ArrowRightIcon size={14} aria-hidden="true" /></button>
        </Box>
      ) : null}
    </aside>
  );
}

function Box({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-card p-4 shadow-[inset_0_0_0_1px_var(--color-line-1)]">
      <h2 className="kd-hs">{title}</h2>
      {children}
    </section>
  );
}

/** The cities where they are on the globe (a plain projection of their centres), each a dot with its count. */
function CityDots({ cities }: { cities: City[] }) {
  const pts = cities.filter((c) => c.center);
  if (pts.length < 2) return null;
  const W = 268, H = 150, P = 18;
  const lons = pts.map((c) => c.center![0]), lats = pts.map((c) => c.center![1]);
  const [x0, x1, y0, y1] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
  const x = (lon: number) => P + ((lon - x0) / (x1 - x0 || 1)) * (W - 2 * P);
  const y = (lat: number) => H - P - ((lat - y0) / (y1 - y0 || 1)) * (H - 2 * P);
  return (
    // A picture of where the cities are; the list under it is what a tap or a screen reader uses.
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-btn bg-map" aria-hidden="true">
      {pts.map((c) => {
        const cx0 = x(c.center![0]), cy0 = y(c.center![1]);
        const right = cx0 < W - 90;
        return (
          <g key={c.slug}>
            <circle cx={cx0} cy={cy0} r={5} className="fill-info" />
            <text x={cx0 + (right ? 9 : -9)} y={cy0 + 4} textAnchor={right ? 'start' : 'end'} fontSize={11} className="fill-fg-2">{c.name} · {c.count}</text>
          </g>
        );
      })}
    </svg>
  );
}
