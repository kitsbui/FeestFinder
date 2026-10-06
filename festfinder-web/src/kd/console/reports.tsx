'use client';
/**
 * /console/reports: open user reports on listings, grouped by listing and kind, most reporters
 * first, with what one of them wrote; dismiss, warn the organiser (three warnings suspend), or
 * take the listing down. The last 30 days by kind above them.
 */
import { useCallback, useEffect, useState } from 'react';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { count } from '../format';
import { useKd } from '../runtime';
import { Button } from '../ui/actions';
import { Card as Panel, Status } from '../ui/parts';
import { CONSOLE } from './copy';
import { useConsole } from './root';

interface Report { id: string; eventId: string; category: string; categoryLabel: Pair; subject: string; eventStatus: string; heldFromFeed: boolean; count: number; quote: string | null; ageMinutes: number }

const ago = (min: number, lang: Lang) => (min < 60 ? `${min} ${lang === 'vi' ? 'phút' : 'min'}` : min < 1440 ? `${Math.floor(min / 60)} ${lang === 'vi' ? 'giờ' : 'h'}` : `${Math.floor(min / 1440)} ${lang === 'vi' ? 'ngày' : 'd'}`);

export function Reports() {
  const { lang, q, refreshCounts } = useConsole();
  const T = pick(CONSOLE, lang);
  const kd = useKd();
  const [data, setData] = useState<{ items: Report[]; last30Days: { category: string; label: Pair; count: number }[] } | null>(null);
  const load = useCallback(async () => setData(await FF.maybe(FF.get('/admin/reports'), { items: [], last30Days: [] })), []);
  useEffect(() => { load(); }, [load]);
  const act = async (path: string, body: Record<string, unknown>) => {
    try { const out = await FF.post(path, body); kd.toast(FF.text(out.message, lang)); load(); refreshCounts(); } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  const needle = q.trim().toLowerCase();
  const items = (data?.items ?? []).filter((r) => !needle || r.subject.toLowerCase().includes(needle));
  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3 p-[clamp(16px,3vw,32px)]">
      {data ? (
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <span className="kd-m">{T.reports30}</span>
          {data.last30Days.map((c) => <span key={c.category} className="kd-s kd-num">{c.label[lang]} {count(c.count, lang)}</span>)}
        </div>
      ) : null}
      {data === null ? <div className="kd-skel h-60" aria-hidden="true" /> : !items.length ? <Panel className="p-5"><span className="kd-s">{T.noReports}</span></Panel> : (
        <ul className="flex flex-col gap-3">
          {items.map((r) => (
            <li key={r.id}>
              <Panel as="article" className="flex flex-col gap-3 p-5" aria-label={r.subject}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="kd-m">{r.categoryLabel[lang]} · {fill(T.reporters, { n: r.count })} · {ago(r.ageMinutes, lang)}</span>
                    <h2 className="kd-h">{r.subject}</h2>
                  </div>
                  {r.heldFromFeed ? <Status tone="warn">{T.heldFromFeed}</Status> : null}
                </div>
                {r.quote ? <p className="kd-s border-l-2 border-line2 pl-3 text-mist">“{r.quote}”</p> : null}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => act(`/admin/reports/${r.eventId}/dismiss`, { category: r.category })}>{T.dismiss}</Button>
                  <Button size="sm" onClick={() => act(`/admin/reports/${r.eventId}/warn`, { category: r.category })}>{T.warn}</Button>
                  {r.eventStatus !== 'removed' ? (
                    <Button size="sm" tone="ghost" className="text-hot" onClick={() => { if (confirm(fill(T.takeDownAsk, { t: r.subject }))) act(`/admin/reports/${r.eventId}/take-down`, {}); }}>{T.takeDown}</Button>
                  ) : null}
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
