'use client';
/**
 * /console/insights in Kính đêm (design/Console-Insights): this week against the week before
 * (live listings, new accounts, ticket clicks, decisions inside the review promise); new
 * listings per week for eight weeks, stacked by genre family in the fixed order; the areas with
 * the most live listings; and the recent audit log folded, its hash-chain state in the summary.
 * Below the board: organisers and people.
 */
import { useEffect, useState } from 'react';
import { TrendDownIcon, TrendUpIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../copy';
import { count, dayMonth } from '../format';
import { familyOf, type Family } from '../genre';
import { BarRow, StackedBars } from '../ui/charts';
import { Accordion, Card as Panel, Status } from '../ui/parts';
import { Row, Table } from '../ui/shell';
import { CONSOLE } from './copy';
import { AuditRows, type AuditItem } from './audit';
import { useConsole } from './root';

interface Board {
  live: { n: number; new7: number };
  newUsers: { n7: number; prev7: number };
  ticketClicks: { n7: number; prev7: number };
  withinPromise: { hours: number; pct7: number | null; prevPct7: number | null };
  weekly: { startsOn: string; genres: Record<string, number> }[];
  areas: { area: string; n: number }[];
}
interface Insights {
  board: Board;
  organizers: { id: string; name: string; verified: boolean; live: number; views: number; ctrPct: number; reports: number }[];
  users: { accounts: number; weeklyActive: number; weeklyActivePct: number; sevenDayReturnPct: number; savesPerUser: number };
}

export function InsightsScreen() {
  const { lang } = useConsole();
  const T = pick(CONSOLE, lang);
  const [data, setData] = useState<Insights | null>(null);
  const [audit, setAudit] = useState<AuditItem[] | null>(null);
  const [chain, setChain] = useState<boolean | null>(null);
  useEffect(() => {
    FF.maybe(FF.get('/admin/insights'), null).then(setData);
    FF.maybe(FF.get('/admin/audit?limit=6'), { items: [] }).then((a: { items: AuditItem[] }) => setAudit(a.items));
    FF.maybe(FF.get('/admin/audit/verify'), null).then((v: { ok: boolean } | null) => setChain(v ? v.ok : null));
  }, []);
  if (!data) return <div className="kd-skel m-6 h-80" aria-hidden="true" />;
  const b = data.board;
  const nf = (n: number) => n.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US');
  const weeks = b.weekly.map((w) => {
    const values: Partial<Record<Exclude<Family, 'free'>, number>> = {};
    for (const [genre, n] of Object.entries(w.genres)) {
      const f = familyOf(genre);
      if (f !== 'free') values[f] = (values[f] ?? 0) + n;
    }
    return { label: dayMonth(w.startsOn, lang), values };
  });
  const maxArea = Math.max(1, ...b.areas.map((a) => a.n));
  const cols = 'minmax(180px,2fr) 80px 100px 100px 80px';

  return (
    <div className="flex flex-col gap-3 p-[clamp(16px,3vw,32px)]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(210px,100%),1fr))] gap-3">
        <Panel className="kd-kpi"><span className="kd-m">{T.kLive}</span><span className="kd-d2 kd-num">{count(b.live.n, lang)}</span><span className="kd-s">{fill(T.kLiveNew, { n: b.live.new7 })}</span></Panel>
        <Kpi lang={lang} label={T.kUsers} now={b.newUsers.n7} before={b.newUsers.prev7} />
        <Kpi lang={lang} label={T.kClicks} now={b.ticketClicks.n7} before={b.ticketClicks.prev7} />
        <Panel className="kd-kpi">
          <span className="kd-m">{fill(T.kPromise, { h: b.withinPromise.hours })}</span>
          <span className="kd-d2 kd-num">{b.withinPromise.pct7 == null ? '—' : nf(b.withinPromise.pct7) + '%'}</span>
          {b.withinPromise.pct7 != null && b.withinPromise.prevPct7 != null ? (
            <Trend lang={lang} d={Math.round((b.withinPromise.pct7 - b.withinPromise.prevPct7) * 10) / 10} line={T.ptsPrev} />
          ) : <span className="kd-s">{T.noPrev}</span>}
        </Panel>
      </div>

      <div className="kd-split gap-3">
        <Panel as="section" className="kd-main flex flex-col gap-4 p-5" aria-label={T.weekly}>
          <span className="kd-h">{T.weekly}</span>
          <StackedBars lang={lang} label={T.weekly} weeks={weeks} height={240} />
        </Panel>
        <Panel as="section" className="kd-side flex flex-col gap-3.5 p-5" aria-label={T.areas}>
          <span className="kd-h">{T.areas}</span>
          {b.areas.map((a) => <BarRow key={a.area} label={a.area} value={a.n} max={maxArea} display={count(a.n, lang)} />)}
        </Panel>
      </div>

      <Panel as="section" className="px-4" aria-label={T.recentAudit}>
        <Accordion
          className="border-b-0"
          summary={<span className="flex flex-wrap items-center gap-2">{T.recentAudit}{chain === null ? null : <Status tone={chain ? 'ok' : 'bad'}>{chain ? T.chainOk : T.chainBroken}</Status>}</span>}
        >
          {audit ? <div className="-mx-4"><AuditRows lang={lang} items={audit} /></div> : null}
        </Accordion>
      </Panel>

      <div className="kd-split gap-3">
        <Panel as="section" className="kd-main overflow-hidden" aria-label={T.organisers}>
          <div className="px-4 pb-3 pt-4"><span className="kd-h">{T.organisers}</span></div>
          <div className="overflow-x-auto"><div className="min-w-[560px]">
            <Table cols={cols} label={T.organisers} head={[T.colOrg, T.colLive, T.colViews, T.colCtr, T.colReports]}>
              {data.organizers.map((o) => (
                <Row key={o.id} cols={cols}>
                  <span role="cell" className="kd-hs kd-ell">{o.name}{o.verified ? ' ✓' : ''}</span>
                  <span role="cell" className="kd-s kd-num">{o.live}</span>
                  <span role="cell" className="kd-s kd-num">{count(o.views, lang)}</span>
                  <span role="cell" className="kd-s kd-num">{nf(o.ctrPct)}%</span>
                  <span role="cell" className="kd-s kd-num">{o.reports}</span>
                </Row>
              ))}
            </Table>
          </div></div>
        </Panel>
        <Panel as="section" className="kd-side flex flex-col gap-3 self-start p-5" aria-label={T.people}>
          <span className="kd-h">{T.people}</span>
          {([[T.pAccounts, count(data.users.accounts, lang)], [T.pWeekly, `${count(data.users.weeklyActive, lang)} · ${nf(data.users.weeklyActivePct)}%`], [T.pReturn, `${nf(data.users.sevenDayReturnPct)}%`], [T.pSaves, nf(data.users.savesPerUser)]] as [string, string][]).map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-b-0"><span className="kd-s">{k}</span><span className="kd-mb kd-num">{v}</span></div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

function Kpi({ lang, label, now, before }: { lang: Lang; label: string; now: number; before: number }) {
  const T = pick(CONSOLE, lang);
  return (
    <Panel className="kd-kpi">
      <span className="kd-m">{label}</span>
      <span className="kd-d2 kd-num">{count(now, lang)}</span>
      {before ? <Trend lang={lang} d={Math.round(((now - before) / before) * 100)} line={T.vsPrev} /> : <span className="kd-s">{T.noPrev}</span>}
    </Panel>
  );
}

function Trend({ lang, d, line }: { lang: Lang; d: number; line: string }) {
  return (
    <span className="kd-s flex items-center gap-1.5">
      {d >= 0 ? <TrendUpIcon size={14} className="text-ok" aria-hidden="true" /> : <TrendDownIcon size={14} className="text-hot" aria-hidden="true" />}
      {fill(line, { d: (d > 0 ? '+' : '') + d.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US') })}
    </span>
  );
}

