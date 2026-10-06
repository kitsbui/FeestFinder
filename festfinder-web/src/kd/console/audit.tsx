'use client';
/**
 * /console/audit: every decision, as it happened, newest first: who (admin, organiser or the
 * system), what, on what, and what changed, with the entry's hash. Filtered by who, searched
 * from the top bar, more on demand, the last 30 days as CSV. Nothing here can be changed.
 */
import { useCallback, useEffect, useState } from 'react';
import { DownloadSimpleIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { pick, type Lang, type Pair } from '../copy';
import { dayMonth } from '../format';
import { Button, buttonClass, Chip } from '../ui/actions';
import { Card as Panel, Status } from '../ui/parts';
import { CONSOLE } from './copy';
import { useConsole } from './root';

export interface AuditItem {
  seq: number; at: string; action: string; label: Pair; actorType: 'admin' | 'organizer' | 'system' | string; actor: Pair;
  target: { type: string; id: string | null; label: string }; diff: { field: string; before: string; after: string }[]; hash: string;
}
type Who = 'all' | 'admin' | 'organizer' | 'system';

/** Audit rows: time, what was done to what, and who · the entry's hash; the changes under it. */
export function AuditRows({ lang, items }: { lang: Lang; items: AuditItem[] }) {
  return (
    <ul className="flex flex-col">
      {items.map((a) => (
        <li key={a.seq} className="grid grid-cols-[60px_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-line px-4 py-3 sm:grid-cols-[60px_minmax(0,1fr)_220px]">
          <span className="kd-m kd-num pt-0.5">{FF.hhmm(a.at)}<br />{dayMonth(a.at.slice(0, 10), lang)}</span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="kd-t">{a.label[lang]} <span className="text-paper">{a.target.label}</span></span>
            {a.diff.length ? <span className="kd-s kd-num">{a.diff.map((d) => `${d.field}: ${d.before} → ${d.after}`).join(' · ')}</span> : null}
          </span>
          <span className="kd-m kd-num col-start-2 sm:col-start-auto sm:text-right">{a.actor[lang]} · {a.hash.replace('sha256:', '#')}</span>
        </li>
      ))}
    </ul>
  );
}

export function Audit() {
  const { lang, q } = useConsole();
  const T = pick(CONSOLE, lang);
  const [who, setWho] = useState<Who>('all');
  const [data, setData] = useState<{ items: AuditItem[]; nextCursor: string | null } | null>(null);
  const [chain, setChain] = useState<boolean | null>(null);
  const load = useCallback(async (cursor?: string) => {
    const p = new URLSearchParams({ actor: who, limit: '30' });
    if (q.trim()) p.set('q', q.trim());
    if (cursor) p.set('cursor', cursor);
    const out = await FF.maybe(FF.get('/admin/audit?' + p), { items: [], nextCursor: null });
    setData((d) => (cursor && d ? { items: [...d.items, ...out.items], nextCursor: out.nextCursor } : out));
  }, [who, q]);
  useEffect(() => { const t = setTimeout(() => load(), q ? 250 : 0); return () => clearTimeout(t); }, [load, q]);
  useEffect(() => { FF.maybe(FF.get('/admin/audit/verify'), null).then((v: { ok: boolean } | null) => setChain(v ? v.ok : null)); }, []);
  const whos: { key: Who; label: string }[] = [{ key: 'all', label: T.aAll }, { key: 'admin', label: T.aAdmin }, { key: 'organizer', label: T.aOrganizer }, { key: 'system', label: T.aSystem }];
  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3 p-[clamp(16px,3vw,32px)]">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={T.tabAudit}>
          {whos.map((w) => <Chip key={w.key} on={who === w.key} onClick={() => setWho(w.key)}>{w.label}</Chip>)}
        </div>
        {chain === null ? null : <Status tone={chain ? 'ok' : 'bad'}>{chain ? T.chainOk : T.chainBroken}</Status>}
        <a className={buttonClass({ size: 'sm' }, 'ml-auto')} href={`/admin/audit.csv?actor=${who}&days=30`} download><DownloadSimpleIcon size={14} aria-hidden="true" />{T.aCsv}</a>
      </div>
      <Panel as="section" aria-label={T.tabAudit}>
        {data === null ? <div className="kd-skel m-4 h-60" aria-hidden="true" /> : !data.items.length ? <p className="kd-s p-5">{T.aNone}</p> : <AuditRows lang={lang} items={data.items} />}
        {data?.nextCursor ? <div className="border-t border-line px-4 py-3"><Button tone="ghost" size="sm" onClick={() => load(data.nextCursor!)}>{T.more}</Button></div> : null}
      </Panel>
    </div>
  );
}
