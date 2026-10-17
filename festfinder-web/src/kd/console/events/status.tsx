'use client';
/**
 * Status changes the team makes outside the queue, shared by the catalogue and one listing:
 * publish (or approve and publish), take down with a reason code and a message to the
 * organiser, mark cancelled, restore. Each asks first; a publish the API refuses for missing
 * details says which.
 */
import { useState, type ReactNode } from 'react';
import { ArrowCounterClockwiseIcon, ProhibitIcon, RocketLaunchIcon, XCircleIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { freshen } from '../../fresh';
import { fill, pick, type Lang } from '../../copy';
import { useKd } from '../../runtime';
import { Button } from '../../ui/actions';
import { Select, TextArea } from '../../ui/forms';
import { MenuItem, MenuSeparator } from '../../ui/menu';
import { Sheet } from '../../ui/sheet';
import { Field, useAsk, useOptions } from '../kit';
import { useConsole } from '../root';
import { EVENTS } from './copy';
import type { Status } from './model';

type Action = 'publish' | 'take_down' | 'cancel' | 'restore';
interface Target { id: string; slug?: string; title: string; status: Status }

const MISSING: Record<string, keyof typeof EVENTS> = { title: 'rTitle', genre: 'rGenre', dates: 'rDates', venue: 'rVenue', price: 'rPrice', logo: 'rLogo', eventUrl: 'rEventUrl' };

/** The toast for an API error: the missing items of a refused publish, or the error's message. */
export function errorLine(e: unknown, lang: Lang): string {
  const T = pick(EVENTS, lang);
  const missing = (e as { details?: { missing?: string[] } })?.details?.missing;
  if (missing?.length) return fill(T.missingList, { m: missing.map((k) => (MISSING[k] ? T[MISSING[k]] : k)).join(', ') });
  return FF.errorText(e, lang);
}

export function useStatusActions(onChanged: (out: any) => void) {
  const { lang, refreshCounts } = useConsole();
  const T = pick(EVENTS, lang);
  const kd = useKd();
  const ask = useAsk();
  const [takeDown, setTakeDown] = useState<Target | null>(null);
  const run = async (ev: Target, action: Action) => {
    if (action === 'take_down') { setTakeDown(ev); return; }
    const q = {
      publish: { title: T.askPublish, body: T.askPublishBody, confirm: T.askPublishOk, danger: false },
      cancel: { title: T.askCancel, body: T.askCancelBody, confirm: T.cancel, danger: true },
      restore: { title: T.askRestore, body: undefined, confirm: T.restore, danger: false },
    }[action];
    if (!(await ask({ ...q, body: q.body ? <>{ev.title}<br />{q.body}</> : ev.title }))) return;
    try {
      const out = await FF.post(`/admin/events/${ev.id}/status`, { action });
      kd.toast(FF.text(out.message, lang));
      if (ev.slug) void freshen('e', ev.slug);
      refreshCounts();
      onChanged(out);
    } catch (e) { kd.toast(errorLine(e, lang)); }
  };
  const dialog = takeDown ? <TakeDown ev={takeDown} onClose={() => setTakeDown(null)} onDone={(out) => { if (takeDown.slug) void freshen('e', takeDown.slug); setTakeDown(null); refreshCounts(); onChanged(out); }} /> : null;
  return { run, dialog };
}

/** The menu items for a listing's status, in the order /ops lists them. */
export function statusItems(ev: Target, run: (ev: Target, a: Action) => void, lang: Lang, { publish = true } = {}): ReactNode[] {
  const T = pick(EVENTS, lang);
  const i = (Icon: typeof ProhibitIcon) => <Icon size={16} aria-hidden="true" />;
  const out: ReactNode[] = [];
  if (publish && ['draft', 'in_review', 'rejected'].includes(ev.status)) {
    out.push(<MenuItem key="publish" icon={i(RocketLaunchIcon)} onSelect={() => run(ev, 'publish')}>{ev.status === 'in_review' ? T.approvePublish : T.publishNow}</MenuItem>);
  }
  if (['removed', 'cancelled', 'expired'].includes(ev.status)) out.push(<MenuItem key="restore" icon={i(ArrowCounterClockwiseIcon)} onSelect={() => run(ev, 'restore')}>{T.restore}</MenuItem>);
  if (['live', 'in_review', 'draft'].includes(ev.status)) out.push(<MenuSeparator key="sep" />);
  if (['live', 'in_review'].includes(ev.status)) out.push(<MenuItem key="take" icon={i(ProhibitIcon)} onSelect={() => run(ev, 'take_down')}>{T.takeDown}</MenuItem>);
  if (['live', 'in_review', 'draft'].includes(ev.status)) out.push(<MenuItem key="cancel" icon={i(XCircleIcon)} onSelect={() => run(ev, 'cancel')}>{T.cancel}</MenuItem>);
  return out;
}

function TakeDown({ ev, onClose, onDone }: { ev: Target; onClose: () => void; onDone: (out: any) => void }) {
  const { lang } = useConsole();
  const T = pick(EVENTS, lang);
  const kd = useKd();
  const o = useOptions();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try {
      const out = await FF.post(`/admin/events/${ev.id}/status`, { action: 'take_down', code: code || undefined, message: message.trim() || undefined });
      kd.toast(FF.text(out.message, lang));
      onDone(out);
    } catch (e) { kd.toast(errorLine(e, lang)); }
    setBusy(false);
  };
  return (
    <Sheet onClose={onClose} title={T.tdTitle} closeLabel={T.close}>
      <div className="flex flex-col gap-4">
        <p className="kd-hs">{ev.title}</p>
        <Field label={<>{T.tdReason} <span className="font-normal text-fog">{T.optional}</span></>} htmlFor="tdCode">
          <Select id="tdCode" value={code} onChange={(e) => setCode(e.target.value)}>
            <option value="">{T.tdNoReason}</option>
            {(o?.rejectReasons ?? []).map((r: { code: string; label: { vi: string; en: string } }) => <option key={r.code} value={r.code}>{r.label[lang]}</option>)}
          </Select>
        </Field>
        <Field label={<>{T.tdMessage} <span className="font-normal text-fog">{T.optional}</span></>} htmlFor="tdMsg">
          <TextArea id="tdMsg" rows={4} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{T.cancelBtn}</Button>
          <Button className="kd-btn-danger" disabled={busy} onClick={send}><ProhibitIcon size={16} aria-hidden="true" />{T.tdOk}</Button>
        </div>
      </div>
    </Sheet>
  );
}
