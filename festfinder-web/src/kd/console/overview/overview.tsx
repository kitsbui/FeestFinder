'use client';
/**
 * /console/overview: the team's first screen. Four tiles (in queue, decided today, live
 * listings, orders today), what needs a person now (each line opens the screen that handles
 * it), the next live events with how much has sold, and the latest entries of the log.
 */
import type { ReactNode } from 'react';
import {
  AlarmIcon, CaretRightIcon, FlagIcon, GavelIcon, HourglassMediumIcon, MapPinIcon, MegaphoneIcon, PlusIcon, SealWarningIcon, TrayIcon,
} from '@phosphor-icons/react/ssr';
import { fill, pick, type Lang, type Pair } from '../../copy';
import { cx } from '../../cx';
import { count, money, monthShort, weekdayShort, day } from '../../format';
import { familyOf } from '../../genre';
import { KdLink as Link } from '../../link';
import { LinkButton } from '../../ui/actions';
import { Art, BarTrack, Card as Panel, DateBlock } from '../../ui/parts';
import { Body, Empty, Loaded, PageHead, ago, useLoad } from '../kit';
import { useConsole } from '../root';
import { duration } from '../review/types';
import { OVERVIEW } from './copy';

interface Overview {
  queue: { total: number; breach: number; soon: number; flagged: number; highRisk: number; oldestMinutes: number; slaMinutes: number };
  reports: number; appeals: number; verification: number; flaggedOrganizers: number; unresolvedVenues: number; adInquiries: number;
  catalog: { live: number; next7Days: number; drafts: number };
  today: { approved: number; rejected: number; takenDown: number; orders: number; gross: number };
  upcoming: { id: string; title: string; startsOn: string; startTime: string | null; venueName: string | null; organizer: string; sold: number; capacity: number | null; coverUrl: string | null }[];
  activity: { seq: number; at: string; actorType: string; actor: string; action: string; label: Pair; target: { type: string; id: string | null; label: string } }[];
}

type Tone = 'bad' | 'warn' | 'info';
const TONE: Record<Tone, string> = { bad: 'text-hot', warn: 'text-warn', info: 'text-live' };

function Tile({ label, value, note, href, valueClass }: { label: string; value: ReactNode; note: ReactNode; href?: string; valueClass?: string }) {
  const body = (
    <>
      <span className="kd-m">{label}</span>
      <span className={cx('kd-d3 kd-num', valueClass)}>{value}</span>
      <span className="kd-s">{note}</span>
    </>
  );
  return href
    ? <Link href={href} className="kd-card flex flex-col gap-1.5 p-5 transition-colors hover:bg-white/[0.04]">{body}</Link>
    : <Panel className="flex flex-col gap-1.5 p-5">{body}</Panel>;
}

export function OverviewScreen() {
  const { lang } = useConsole();
  const O = pick(OVERVIEW, lang);
  const load = useLoad<Overview>('/admin/overview');
  return (
    <>
      <PageHead
        title={O.title}
        actions={(
          <>
            <LinkButton href="/console/events/new"><PlusIcon size={16} aria-hidden="true" />{O.newListing}</LinkButton>
            <LinkButton tone="acc" href="/console">{load.data?.queue.total ? fill(O.reviewN, { n: load.data.queue.total }) : O.reviewQueue}</LinkButton>
          </>
        )}
      />
      <Body>
        <Loaded load={load}>{(d) => <Board lang={lang} d={d} />}</Loaded>
      </Body>
    </>
  );
}

function Board({ lang, d }: { lang: Lang; d: Overview }) {
  const O = pick(OVERVIEW, lang);
  const q = d.queue;
  const ic = (Icon: typeof AlarmIcon) => <Icon size={18} aria-hidden="true" />;
  const todo: { tone: Tone; icon: ReactNode; title: string; note?: string; href: string }[] = [
    q.breach ? { tone: 'bad' as const, icon: ic(AlarmIcon), title: fill(O.tBreach, { n: q.breach, h: q.slaMinutes / 60 }), note: fill(O.tOldest, { d: duration(q.oldestMinutes, lang) }), href: '/console?view=breach' } : null,
    q.soon ? { tone: 'warn' as const, icon: ic(HourglassMediumIcon), title: fill(O.tSoon, { n: q.soon }), href: '/console?view=soon' } : null,
    d.reports ? { tone: 'bad' as const, icon: ic(FlagIcon), title: fill(O.tReports, { n: d.reports }), href: '/console/reports' } : null,
    d.appeals ? { tone: 'warn' as const, icon: ic(GavelIcon), title: fill(O.tAppeals, { n: d.appeals }), href: '/console?filter=appeals' } : null,
    d.unresolvedVenues ? { tone: 'info' as const, icon: ic(MapPinIcon), title: fill(O.tVenues, { n: d.unresolvedVenues }), href: '/console/venues?tab=unresolved' } : null,
    d.verification ? { tone: 'info' as const, icon: ic(SealWarningIcon), title: fill(O.tVerify, { n: d.verification }), href: '/console/organizers?state=pending' } : null,
    d.adInquiries ? { tone: 'info' as const, icon: ic(MegaphoneIcon), title: fill(O.tAds, { n: d.adInquiries }), href: '/console/featured#ads' } : null,
  ].filter((x) => x !== null);

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-3">
        <Tile
          label={O.inQueue}
          value={<span className="inline-flex items-center gap-2"><TrayIcon size={22} aria-hidden="true" />{count(q.total, lang)}</span>}
          valueClass={q.breach ? 'text-hot' : q.total ? 'text-warn' : 'text-ok'}
          note={q.total ? fill(O.inQueueNote, { d: duration(q.oldestMinutes, lang), n: q.flagged }) : O.queueClear}
          href="/console"
        />
        <Tile label={O.decided} value={count(d.today.approved + d.today.rejected, lang)} note={fill(O.decidedNote, { a: d.today.approved, r: d.today.rejected })} />
        <Tile label={O.live} value={count(d.catalog.live, lang)} valueClass="text-ok" note={fill(O.liveNote, { n: d.catalog.next7Days })} href="/console/events?status=live&when=upcoming" />
        {/* FeestFinder checkout is VND only, so the day's gross is in đồng. */}
        <Tile label={O.orders} value={count(d.today.orders, lang)} note={money(d.today.gross, 'VND', lang)} href="/console/orders" />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(440px,100%),1fr))] items-start gap-4">
        <div className="flex flex-col gap-4">
          <Panel as="section" aria-labelledby="ov-todo" className="flex flex-col">
            <h2 id="ov-todo" className="kd-h px-5 pb-2 pt-4">{O.todo}</h2>
            {todo.length ? (
              <ul className="flex flex-col">
                {todo.map((x) => (
                  <li key={x.href} className="border-t border-line">
                    <Link href={x.href} className="flex min-h-14 items-center gap-3 px-5 py-3 hover:bg-white/[0.03]">
                      <span className={cx('flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]', TONE[x.tone])}>{x.icon}</span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5"><span className="kd-hs">{x.title}</span>{x.note ? <span className="kd-s">{x.note}</span> : null}</span>
                      <CaretRightIcon size={16} className="text-fog" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <div className="px-5 pb-5"><Empty title={O.allClear} /></div>}
          </Panel>

          <Panel as="section" aria-labelledby="ov-up" className="flex flex-col">
            <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
              <h2 id="ov-up" className="kd-h">{O.upcoming}</h2>
              <Link href="/console/events?when=week&status=live" className="kd-s inline-flex items-center gap-1 hover:text-paper">{O.next7}<CaretRightIcon size={14} aria-hidden="true" /></Link>
            </div>
            {d.upcoming.length ? (
              <ul className="flex flex-col">
                {d.upcoming.map((e) => (
                  <li key={e.id} className="border-t border-line">
                    <Link href={`/console/events/${e.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03]">
                      <DateBlock day={day(e.startsOn).d} top={weekdayShort(e.startsOn, lang)} bottom={monthShort(e.startsOn, lang)} />
                      <Art family={familyOf('EDM')} cover={e.coverUrl} className="hidden size-12 shrink-0 rounded-lg sm:block" />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="kd-hs kd-ell">{e.title}</span>
                        <span className="kd-s kd-ell">{[e.startTime, e.organizer, e.venueName].filter(Boolean).join(' · ')}</span>
                      </span>
                      {e.capacity ? (
                        <span className="flex w-28 shrink-0 flex-col items-end gap-1">
                          <span className="kd-m kd-num">{fill(O.sold, { s: count(e.sold, lang), c: count(e.capacity, lang) })}</span>
                          <BarTrack value={e.sold} max={e.capacity} className={cx('w-full', e.sold / e.capacity > 0.85 && 'text-warn')} label={fill(O.sold, { s: e.sold, c: e.capacity })} />
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <div className="px-5 pb-5"><Empty title={O.nothingUp} /></div>}
          </Panel>
        </div>

        <Panel as="section" aria-labelledby="ov-act" className="flex flex-col">
          <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
            <h2 id="ov-act" className="kd-h">{O.activity}</h2>
            <Link href="/console/audit" className="kd-s inline-flex items-center gap-1 hover:text-paper">{O.auditLog}<CaretRightIcon size={14} aria-hidden="true" /></Link>
          </div>
          {d.activity.length ? (
            <ul className="flex flex-col">
              {d.activity.map((a) => (
                <li key={a.seq} className="flex flex-col gap-0.5 border-t border-line px-5 py-3">
                  <span className="kd-t"><span className="text-paper">{a.actorType === 'system' ? O.system : a.actor}</span> · {a.label[lang]} · <span className="text-paper">{a.target.label}</span></span>
                  <span className="kd-m kd-num">{ago(a.at, lang)}</span>
                </li>
              ))}
            </ul>
          ) : <div className="px-5 pb-5"><Empty title={O.noActivity} /></div>}
        </Panel>
      </div>
    </>
  );
}
