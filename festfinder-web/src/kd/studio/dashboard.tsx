'use client';
/**
 * /studio in Kính đêm (design/Studio-Dashboard): for the chosen event, over 7, 14 or 30 days:
 * views (against the period before), saves and ticket (or sign-up) clicks as a share of views, and
 * sold or signed up against capacity; views per day; the selling pace with "Đẩy tin" when behind;
 * every event (a row picks it, a draft continues in the wizard); where views come from; to do.
 */
import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRightIcon, RocketLaunchIcon, TrendDownIcon, TrendUpIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Pair } from '../copy';
import { cx } from '../cx';
import { count, dayMonth } from '../format';
import { familyOf, g } from '../genre';
import { KdLink } from '../link';
import { useKd } from '../runtime';
import { Button, buttonClass } from '../ui/actions';
import { BarRow, LineChart } from '../ui/charts';
import { Segmented } from '../ui/forms';
import { Accordion, Card as Panel, Marker, Status } from '../ui/parts';
import { Row, Table } from '../ui/shell';
import { STUDIO } from './copy';
import { StudioHead, statusTone } from './head';
import { isPast, useStudio } from './root';

type Range = '7d' | '14d' | '30d';
interface Perf {
  sold: number; capacity: number; soldPct: number; daysLeft: number; pacePerDay: number; needPerDay: number;
  verdict: { key: 'on_pace' | 'behind'; label: Pair };
  daily: { day: string; views: number; clicks: number; saves: number; sold: number }[];
  period: { views: number; clicks: number; saves: number; sold: number; viewsBefore: number };
  sources: { key: string; pct: number }[];
  boost: { status: 'open' | 'approved' | 'done' | 'declined' | 'withdrawn' } | null;
  /** Presses of "Đặt xe" (Grab, Green SM) on the event page, all time. */
  rideClicks?: number;
}

interface Clicks { clicks: number; byPlacement: Tally[]; byDevice: Tally[]; byCountry: Tally[]; byEvent: { id: string; title: string; n: number }[] }
interface Tally { key: string | null; n: number }

export function Dashboard() {
  const { lang, org, events, event, setEvent } = useStudio();
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const [range, setRange] = useState<Range>('14d');
  const [perf, setPerf] = useState<Perf | null | undefined>(undefined);
  const [todo, setTodo] = useState<{ eventId: string; text: Pair }[]>([]);
  // How Google and AI assistants see the listings still to come, weakest first.
  const [search, setSearch] = useState<{ average: number | null; items: { id: string; title: string; score: number; missing: Pair[] }[] } | null>(null);
  const [clicks, setClicks] = useState<Clicks | null>(null);
  const [gaps, setGaps] = useState<string[] | null>(null);
  const load = useCallback(async () => {
    if (!event?.hasPerformance) { setPerf(null); return; }
    setPerf(undefined);
    setPerf(await FF.maybe(FF.get(`/organizer/events/${event.id}/performance?range=${range}`), null));
  }, [event, range]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    FF.maybe(FF.get('/organizer/dashboard?range=30d'), null).then((d: { todo: { eventId: string; text: Pair }[] } | null) => setTodo(d?.todo ?? []));
    FF.maybe(FF.get('/organizer/search'), null).then((d: typeof search) => setSearch(d));
    FF.maybe(FF.get('/organizer/affiliate?days=30'), null).then(setClicks);
  }, []);
  // Verification is on the same list: what the profile still lacks before FeestFinder can check it.
  useEffect(() => {
    if (org.verified) { setGaps(null); return; }
    FF.maybe(FF.get('/organizer/profile'), null).then((p: { legalName: string | null; taxCode: string | null; bank: unknown } | null) => {
      if (p) setGaps([[p.legalName, T.gapLegal], [p.taxCode, T.gapTax], [p.bank, T.gapBank]].filter(([ok]) => !ok).map(([, l]) => l as string));
    });
  }, [org.verified, T.gapLegal, T.gapTax, T.gapBank]);
  const sentBack = events.filter((e) => e.status === 'rejected');

  const free = event?.entryMode === 'free';
  const pct = (a: number, b: number) => (b ? `${(Math.round((a / b) * 1000) / 10).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}%` : '0%');
  const delta = perf ? (perf.period.viewsBefore ? Math.round(((perf.period.views - perf.period.viewsBefore) / perf.period.viewsBefore) * 100) : null) : null;
  const srcLabel: Record<string, string> = { feed: T.srcFeed, shelf: T.srcShelf, shared: T.srcShared, search: T.srcSearch, own: T.srcOwn, ads: T.srcAds, map: T.srcMap, list: T.srcList, artist: T.srcArtist };
  // "Đẩy tin" asks for advertising: the form opens on this event.
  const boost = () => { if (event) location.assign('/studio/ads?event=' + encodeURIComponent(event.id)); };
  const cols = 'minmax(200px,2fr) 72px 120px 120px';

  return (
    <div className="flex flex-col gap-3 p-[clamp(20px,3vw,32px)]">
      <StudioHead
        label={T.dash}
        right={(
          <>
            <Segmented label={T.range} value={range} onChange={setRange} options={(['7d', '14d', '30d'] as Range[]).map((r) => ({ value: r, label: fill(T.days, { n: r.slice(0, -1) }) }))} />
            {event?.status === 'live' ? <a className={buttonClass({ size: 'sm' })} href={'/e/' + event.slug}>{T.viewPage}<ArrowUpRightIcon size={14} aria-hidden="true" /></a> : null}
            {event ? <KdLink className={buttonClass({ size: 'sm' })} href={'/studio/events/' + event.id}>{T.wEdit}</KdLink> : null}
          </>
        )}
      />

      {perf === undefined ? <div className="kd-skel h-32" aria-hidden="true" /> : perf ? (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-3">
            <Panel className="kd-kpi">
              <span className="kd-m">{T.views}</span>
              <span className="kd-d2 kd-num">{count(perf.period.views, lang)}</span>
              <span className="kd-s flex items-center gap-1.5">
                {delta === null ? T.noBefore : <>{delta >= 0 ? <TrendUpIcon size={14} className="text-ok" aria-hidden="true" /> : <TrendDownIcon size={14} className="text-hot" aria-hidden="true" />}{fill(T.vsBefore, { d: (delta > 0 ? '+' : '') + delta + '%' })}</>}
              </span>
            </Panel>
            <Panel className="kd-kpi"><span className="kd-m">{T.saves}</span><span className="kd-d2 kd-num">{count(perf.period.saves, lang)}</span><span className="kd-s kd-num">{fill(T.ofViews, { p: pct(perf.period.saves, perf.period.views) })}</span></Panel>
            <Panel className="kd-kpi"><span className="kd-m">{free ? T.registerClicks : T.clicks}</span><span className="kd-d2 kd-num">{count(perf.period.clicks, lang)}</span><span className="kd-s kd-num">{fill(T.ofViews, { p: pct(perf.period.clicks, perf.period.views) })}</span></Panel>
            <div className="kd-bonecard kd-kpi">
              <span className="kd-m">{free ? T.registered : T.sold}</span>
              <span className="flex items-baseline gap-1.5"><span className="kd-d2 kd-num">{count(perf.sold, lang)}</span><span className="kd-s kd-num">/ {count(perf.capacity, lang)}</span></span>
              <div className="flex items-center gap-2.5">
                <div className="h-2 flex-1 overflow-hidden rounded bg-[#d4d4d4]"><div className="h-full rounded-r bg-ink" style={{ width: `${Math.min(100, perf.soldPct)}%` }} /></div>
                <span className="kd-mb kd-num text-ink">{pct(perf.sold, perf.capacity)}</span>
              </div>
            </div>
          </div>

          <div className="kd-split gap-3">
            <Panel as="section" className="kd-main flex flex-col gap-4 p-5" aria-label={T.viewsPerDay}>
              <div className="flex items-baseline justify-between gap-3"><span className="kd-h">{T.viewsPerDay}</span><span className="kd-m kd-num">{fill(T.days, { n: range.slice(0, -1) })}</span></div>
              <LineChart label={T.viewsPerDay} height={200} points={perf.daily.map((d) => ({ label: dayMonth(d.day, lang), value: d.views }))} format={(n) => fill(T.nViews, { n: count(n, lang) })} />
            </Panel>
            {event && !isPast(event) ? <Panel as="section" className="kd-side flex flex-col gap-4 p-5" aria-label={T.pace}>
              <div className="flex items-center justify-between"><span className="kd-h">{T.pace}</span><Status tone={perf.verdict.key === 'on_pace' ? 'ok' : 'warn'}>{perf.verdict.key === 'on_pace' ? T.onPace : T.behind}</Status></div>
              <div className="flex items-baseline gap-2.5"><span className="kd-d1 kd-num">{perf.daysLeft}</span><span className="kd-t text-fog">{T.daysToDoors}</span></div>
              <div className="mt-auto flex flex-col gap-3.5">
                <BarRow label={T.needPerDay} value={perf.needPerDay} max={Math.max(perf.needPerDay, perf.pacePerDay, 1)} display={count(perf.needPerDay, lang)} />
                <BarRow label={T.ratePerDay} value={perf.pacePerDay} max={Math.max(perf.needPerDay, perf.pacePerDay, 1)} display={count(perf.pacePerDay, lang)} />
              </div>
              {perf.verdict.key === 'behind' || perf.boost ? (
                <div className="flex items-center justify-between gap-2.5 border-t border-line pt-3">
                  <span className="kd-s">{T.boostLine}</span>
                  {perf.boost?.status === 'open' ? <Status tone="warn">{T.boostAsked}</Status>
                    : perf.boost?.status === 'done' || perf.boost?.status === 'approved' ? <Status tone="ok">{T.boostDone}</Status>
                    : <Button size="sm" onClick={boost}><RocketLaunchIcon size={14} aria-hidden="true" />{T.boost}</Button>}
                </div>
              ) : null}
            </Panel> : null}
          </div>
        </>
      ) : event ? <Panel className="p-5"><span className="kd-s">{T.noNumbers}</span></Panel> : null}

      <div className="kd-split gap-3">
        <Panel as="section" className="kd-main overflow-hidden" aria-label={T.yourEvents}>
          <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4"><span className="kd-h">{T.yourEvents}</span><span className="flex items-center gap-3"><span className="kd-m max-sm:hidden">{T.pickRow}</span><KdLink className={buttonClass({ tone: 'ghost', size: 'sm' }, '-mr-3')} href="/studio/events">{T.evAll}</KdLink></span></div>
          <div className="overflow-x-auto"><div className="min-w-[540px]">
          <Table cols={cols} label={T.yourEvents} head={[T.colEvent, T.colDate, T.colStatus, T.colFill]}>
            {events.map((e) => {
              const body = (
                <>
                  <span role="cell" className={cx('kd-hs kd-ell flex items-center gap-2.5', e.status === 'draft' && 'text-fog', g(familyOf(e.genre)))}><Marker family={familyOf(e.genre)} />{e.title}</span>
                  <span role="cell" className="kd-s kd-num">{e.startsOn ? dayMonth(e.startsOn, lang) : '—'}</span>
                  <span role="cell"><Status tone={statusTone(e.status)}>{e.statusLabel[lang]}</Status></span>
                  <span role="cell" className="kd-mb kd-num text-right">
                    {e.status === 'draft' || e.status === 'rejected'
                      ? <a className={buttonClass({ tone: 'ghost', size: 'sm' }, '-mr-3')} href={'/studio/new?draft=' + e.id} onClick={(x) => x.stopPropagation()}>{T.continue}</a>
                      : e.sold != null ? count(e.sold, lang) : '—'}
                  </span>
                </>
              );
              return e.status === 'draft' || e.status === 'rejected'
                ? <Row key={e.id} cols={cols}>{body}</Row>
                : <Row key={e.id} cols={cols} current={e.id === event?.id} onClick={() => setEvent(e.id)}>{body}</Row>;
            })}
          </Table>
          </div></div>
        </Panel>
        <div className="kd-side flex flex-col gap-3">
          {perf?.rideClicks ? (
            <Panel as="section" className="flex items-baseline justify-between gap-3 p-5" aria-label={T.rideClicks}>
              <span className="kd-h">{T.rideClicks}</span><span className="kd-d3 kd-num">{count(perf.rideClicks, lang)}</span>
            </Panel>
          ) : null}
          {perf?.sources.length ? (
            <Panel as="section" className="flex flex-col gap-3.5 p-5" aria-label={T.sources}>
              <span className="kd-h">{T.sources}</span>
              {perf.sources.map((s) => <BarRow key={s.key} label={srcLabel[s.key] ?? s.key} value={s.pct} max={perf.sources[0].pct} display={s.pct + '%'} />)}
            </Panel>
          ) : null}
          {clicks?.clicks ? (
            <Panel as="section" className="flex flex-col gap-3 p-5" aria-label={T.clicks30}>
              <div className="flex items-baseline justify-between gap-3"><span className="kd-h">{T.clicks30}</span><span className="kd-d3 kd-num">{count(clicks.clicks, lang)}</span></div>
              {([[T.byEvent, clicks.byEvent.map((r) => ({ key: r.title, n: r.n }))], [T.byPlacement, clicks.byPlacement], [T.byDevice, clicks.byDevice], [T.byCountry, clicks.byCountry]] as [string, Tally[]][]).map(([title, rows]) => rows.length ? (
                <div key={title} className="flex flex-col gap-1.5 border-t border-line pt-3">
                  <span className="kd-m">{title}</span>
                  {rows.slice(0, 4).map((r) => <BarRow key={String(r.key)} label={r.key ?? '—'} value={r.n} max={rows[0].n} display={count(r.n, lang)} />)}
                </div>
              ) : null)}
            </Panel>
          ) : null}
          {todo.length || sentBack.length || gaps ? (
            <Panel className="px-5 py-1">
              <Accordion small summary={T.todo} aside={todo.length + sentBack.length + (gaps ? 1 : 0)} open>
                <ul className="flex flex-col gap-2.5">
                  {sentBack.map((e) => (
                    <li key={'r' + e.id} className="kd-s">
                      <KdLink className="hover:text-paper" href={'/studio/events/' + e.id}>{fill(T.todoSentBack, { t: e.title, r: e.lastDecision?.reason?.[lang] ?? T.evRejected })}</KdLink>
                    </li>
                  ))}
                  {gaps ? (
                    <li className="kd-s">
                      <KdLink className="hover:text-paper" href="/studio/profile">{gaps.length ? fill(T.todoVerify, { m: gaps.join(', ') }) : T.todoVerifyWait}</KdLink>
                    </li>
                  ) : null}
                  {todo.map((t, i) => (
                    <li key={i} className="kd-s">
                      {events.some((e) => e.id === t.eventId && (e.status === 'draft' || e.status === 'rejected'))
                        ? <a className="hover:text-paper" href={'/studio/new?draft=' + t.eventId}>{t.text[lang]}</a>
                        : t.text[lang]}
                    </li>
                  ))}
                </ul>
              </Accordion>
            </Panel>
          ) : null}
          {search?.items.length ? (
            <Panel as="section" className="flex flex-col gap-3 p-5" aria-label={T.searchTitle}>
              <div className="flex items-baseline justify-between gap-3"><span className="kd-h">{T.searchTitle}</span><span className="kd-d3 kd-num">{search.average}<span className="kd-s"> / 100</span></span></div>
              <ul className="flex flex-col gap-2 border-t border-line pt-3">
                {search.items.slice(0, 3).map((x) => (
                  <li key={x.id}>
                    <KdLink className="flex flex-col gap-0.5 hover:text-paper" href={'/studio/events/' + x.id}>
                      <span className="kd-s flex justify-between gap-3 text-mist"><span className="kd-ell">{x.title}</span><span className="kd-mb kd-num">{x.score}</span></span>
                      {x.missing[0] ? <span className="kd-s text-xs text-fog">{x.missing[0][lang]}</span> : null}
                    </KdLink>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
