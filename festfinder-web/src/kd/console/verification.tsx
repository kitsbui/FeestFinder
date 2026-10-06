'use client';
/**
 * /console/verification: organisers by verification state, each with its numbers, its
 * documents (ID, tax registration, bank statement), its payout account, and verify, revoke or
 * flag. Verifying needs the ID document (the API says so). The top bar's search filters by name,
 * legal name, email or tax code.
 */
import { useCallback, useEffect, useState } from 'react';
import { FF } from '@/runtime/ff';
import { fill, pick, type Pair } from '../copy';
import { useKd } from '../runtime';
import { Button, Chip } from '../ui/actions';
import { Switch } from '../ui/forms';
import { Avatar, Card as Panel, Status } from '../ui/parts';
import { CONSOLE } from './copy';
import { useConsole } from './root';

type State = 'all' | 'pending' | 'verified' | 'flagged';
interface Org {
  id: string; slug: string; name: string; state: 'pending' | 'verified' | 'flagged'; logoUrl: string | null; legalName: string | null; taxCode: string | null;
  docs: { id: boolean; tax: boolean; bank: boolean }; bankVerified: boolean; bankOnFile: boolean; strikes: number; suspended: boolean;
  allEvents: number; liveEvents: number; reviewEvents: number; email: string | null; hotline: string | null;
}

export function Verification() {
  const { lang, q, refreshCounts } = useConsole();
  const T = pick(CONSOLE, lang);
  const kd = useKd();
  const [state, setState] = useState<State>('pending');
  const [orgs, setOrgs] = useState<Org[] | null>(null);
  const load = useCallback(async () => {
    const p = new URLSearchParams({ state });
    if (q.trim()) p.set('q', q.trim());
    setOrgs((await FF.maybe(FF.get('/admin/organizers?' + p), { items: [] })).items);
  }, [state, q]);
  useEffect(() => { const t = setTimeout(load, q ? 250 : 0); return () => clearTimeout(t); }, [load, q]);
  const patch = async (o: Org, body: Record<string, unknown>) => {
    try {
      const out = await FF.patch('/admin/organizers/' + o.id, body);
      if (out.message) kd.toast(FF.text(out.message as Pair, lang));
      load(); refreshCounts();
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  const states: { key: State; label: string }[] = [{ key: 'pending', label: T.vPending }, { key: 'flagged', label: T.vFlagged }, { key: 'verified', label: T.vVerified }, { key: 'all', label: T.vAll }];
  const docs: { key: keyof Org['docs']; label: string }[] = [{ key: 'id', label: T.docId }, { key: 'tax', label: T.docTax }, { key: 'bank', label: T.docBank }];

  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-3 p-[clamp(16px,3vw,32px)]">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={T.tabVerify}>
        {states.map((s) => <Chip key={s.key} on={state === s.key} onClick={() => setState(s.key)}>{s.label}</Chip>)}
      </div>
      {orgs === null ? <div className="kd-skel h-60" aria-hidden="true" /> : !orgs.length ? <Panel className="p-5"><span className="kd-s">{T.noOrgs}</span></Panel> : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(420px,100%),1fr))] gap-3">
          {orgs.map((o) => (
            <li key={o.id}>
              <Panel as="article" className="flex h-full flex-col gap-4 p-5" aria-label={o.name}>
                <div className="flex items-start gap-3">
                  <Avatar org name={o.name} src={o.logoUrl} size={44} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <a className="kd-h kd-ell hover:underline" href={'/o/' + o.slug}>{o.name}</a>
                    <span className="kd-s kd-ell">{[o.legalName, o.taxCode, o.email, o.hotline].filter(Boolean).join(' · ') || '—'}</span>
                  </div>
                  <Status tone={o.state === 'verified' ? 'ok' : o.state === 'flagged' ? 'bad' : 'warn'}>{o.state === 'verified' ? T.vVerified : o.state === 'flagged' ? T.vFlagged : T.vPending}</Status>
                </div>
                <span className="kd-m kd-num">
                  {fill(T.orgLine, { e: o.allEvents, l: o.liveEvents, r: o.reviewEvents })}
                  {o.strikes ? ' · ' + fill(T.strikes, { n: o.strikes }) : ''}
                  {o.suspended ? ' · ' + T.suspended : ''}
                </span>
                <div className="flex flex-col border-t border-line">
                  {docs.map((d) => (
                    <div key={d.key} className="flex min-h-11 items-center justify-between gap-3 border-b border-line">
                      <span className="kd-s text-mist">{d.label}</span>
                      <Switch checked={o.docs[d.key]} label={`${d.label} · ${o.name}`} onChange={(v) => patch(o, { docs: { [d.key]: v } })} />
                    </div>
                  ))}
                  {o.bankOnFile ? (
                    <div className="flex min-h-11 items-center justify-between gap-3 border-b border-line">
                      <span className="kd-s text-mist">{T.bankOk}</span>
                      <Switch checked={o.bankVerified} label={`${T.bankOk} · ${o.name}`} onChange={(v) => patch(o, { bankVerified: v })} />
                    </div>
                  ) : null}
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  {o.state !== 'verified' ? <Button size="sm" tone="acc" disabled={!o.docs.id} onClick={() => patch(o, { state: 'verified' })}>{T.verify}</Button> : <Button size="sm" onClick={() => patch(o, { state: 'pending' })}>{T.revoke}</Button>}
                  {o.state !== 'flagged' ? <Button size="sm" tone="ghost" onClick={() => patch(o, { state: 'flagged' })}>{T.flag}</Button> : null}
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
