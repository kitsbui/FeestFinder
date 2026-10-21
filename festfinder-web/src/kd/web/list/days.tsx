/**
 * The list's grid, its default view (design v2 phase 2): the events by day. Each of the first
 * seven days has its heading ("Thứ Bảy 17.10 · hôm nay"), a lead card and the next nights as rows
 * beside it, then cards; after the first week, a heading per month. In a box narrower than 600px (a
 * phone) every event is a row (kd.css `.kd-days`). Grouped by the events' own calendar days, so the
 * server and the browser draw the same headings; "hôm nay" and "ngày mai" come once the clock is known.
 *
 * The days take the page's whole width (owner, 2026-10-20: the rail of the week and the cities is
 * gone); on a wide screen the lead and its rows share the row evenly (kd.css).
 */
import { pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import { day, daysBetween, dayMonth, weekdayLong } from '../../format';
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

/**
 * The groups: a day's first night leads (a featured one first), the next three sit beside it as rows.
 * A day of one night shows it across the width, its picture beside its words; a day of two, two
 * leads side by side (design v2 phase 8), so a quiet day never leaves the row half empty.
 */
export function DayGrid({ groups, lang, className, eager = false }: { groups: DayGroup[]; lang: Lang; className?: string; /** The first day's lead picture loads first (it is the page's largest). */ eager?: boolean }) {
  return (
    <div className={cx('kd-days flex flex-col gap-10', className)}>
      {groups.map((g, gi) => {
        const first = eager && gi === 0;
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
            {g.byDay && g.items.length === 1 ? (
              <div className="kd-day-solo"><EventCard e={g.items[0]} lang={lang} look="lead" morph eager={first} /></div>
            ) : g.byDay && g.items.length === 2 ? (
              <div className="kd-day-pair">{g.items.map((e, i) => <EventCard key={e.id} e={e} lang={lang} look="lead" morph eager={first && i === 0} />)}</div>
            ) : lead ? (
              <div className="kd-day-top">
                <EventCard e={lead} lang={lang} look="lead" morph eager={first} />
                <div className="kd-day-stack">{stack.map((e) => <EventCard key={e.id} e={e} lang={lang} look="row" morph />)}</div>
              </div>
            ) : null}
            {rest.length && !(g.byDay && g.items.length <= 2) ? <div className="kd-cards">{rest.map((e, i) => <EventCard key={e.id} e={e} lang={lang} morph eager={first && !lead && i === 0} />)}</div> : null}
          </section>
        );
      })}
    </div>
  );
}
