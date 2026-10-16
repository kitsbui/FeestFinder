'use client';
/**
 * /studio/ads: advertising an event the organiser posted (festfinder-backend routes/organizer/ads.ts).
 * Posting is free and goes through review; promoting it is a request: the event, the placements,
 * the budget, from when to when, and a note. The team answers in the Console; its answer and reply
 * show here. An open request can be withdrawn. ?event=<id> opens the form on that event (the
 * dashboard's and the wizard's "Đẩy tin").
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { PlusIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { dayMonth, money } from '../format';
import { useKd } from '../runtime';
import { Button } from '../ui/actions';
import { FieldError, Input, Select, TextArea } from '../ui/forms';
import { Status, type StatusTone } from '../ui/parts';
import { Row, Table } from '../ui/shell';
import { Drawer, Field } from '../console/kit';
import { STUDIO } from './copy';
import { StudioHead } from './head';
import { Block, Page } from './parts';
import { useStudio } from './root';

interface Keyed { key: string; label: Pair }
interface Request {
  id: string; status: 'open' | 'approved' | 'done' | 'declined' | 'withdrawn'; statusLabel: Pair;
  event: { id: string; slug: string; title: string; startsOn: string | null }; placements: Keyed[];
  budget: number | null; currency: string; startsOn: string | null; endsOn: string | null; message: string | null; reply: string | null;
}
interface Eligible { id: string; title: string; status: string; startsOn: string | null; endsOn: string | null; cityLabel: Pair | null }
interface Data { items: Request[]; events: Eligible[]; placements: Keyed[]; minBudget: number; currency: string }

const TONE: Record<Request['status'], StatusTone> = { open: 'warn', approved: 'ok', done: 'ok', declined: 'bad', withdrawn: 'none' };
const COLS = 'minmax(160px,2fr) minmax(140px,1.4fr) 110px 110px 100px 110px';

export function StudioAds() {
  const { lang } = useStudio();
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const [data, setData] = useState<Data | null>(null);
  const [asking, setAsking] = useState<string | null>(null);
  const load = useCallback(async () => setData(await FF.maybe(FF.get('/organizer/ads'), null)), []);
  useEffect(() => { void load(); }, [load]);
  // The dashboard's and the wizard's "Đẩy tin" come with the event.
  useEffect(() => { const e = new URLSearchParams(location.search).get('event'); if (e) setAsking(e); }, []);

  const withdraw = async (r: Request) => {
    try { const out = await FF.del('/organizer/ads/' + r.id); kd.toast(FF.text(out.message, lang)); void load(); } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  const when = (r: Request) => (r.startsOn && r.endsOn ? `${dayMonth(r.startsOn, lang)} – ${dayMonth(r.endsOn, lang)}` : '—');

  return (
    <Page>
      <StudioHead label={T.ads} right={<Button tone="acc" disabled={!data} onClick={() => setAsking('')}><PlusIcon size={16} aria-hidden="true" />{T.adAsk}</Button>} />
      <Block title={T.adRequests}>
        {!data ? <div className="kd-skel h-24" aria-hidden="true" /> : !data.items.length ? <p className="kd-s">{T.adNone}</p> : (
          <Table cols={COLS} head={T.adCols.split('|')} label={T.adRequests}>
            {data.items.map((r) => (
              <Row key={r.id} cols={COLS}>
                <span role="cell" className="flex min-w-0 flex-col gap-0.5">
                  <a className="kd-hs kd-ell hover:underline" href={'/e/' + r.event.slug} target="_blank" rel="noopener">{r.event.title}</a>
                  {r.reply ? <span className="kd-s">{fill(T.adReply, { r: r.reply })}</span> : r.message ? <span className="kd-s kd-ell">{r.message}</span> : null}
                </span>
                <span role="cell" className="kd-s">{r.placements.map((p) => p.label[lang]).join(', ')}</span>
                <span role="cell" className="kd-mb kd-num">{r.budget != null ? money(r.budget, r.currency, lang) : '—'}</span>
                <span role="cell" className="kd-s kd-num">{when(r)}</span>
                <span role="cell"><Status tone={TONE[r.status]}>{r.statusLabel[lang]}</Status></span>
                <span role="cell" className="flex justify-end">{r.status === 'open' ? <Button size="sm" tone="ghost" onClick={() => withdraw(r)}>{T.adWithdraw}</Button> : null}</span>
              </Row>
            ))}
          </Table>
        )}
      </Block>
      {asking !== null && data ? <AskDrawer lang={lang} data={data} eventId={asking} onClose={() => setAsking(null)} onSent={() => { setAsking(null); void load(); }} /> : null}
    </Page>
  );
}

function AskDrawer({ lang, data, eventId, onClose, onSent }: { lang: Lang; data: Data; eventId: string; onClose: () => void; onSent: () => void }) {
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const today = new Date(Date.now() + FF.clockOffset).toISOString().slice(0, 10);
  const [ev, setEv] = useState(data.events.some((e) => e.id === eventId) ? eventId : data.events[0]?.id ?? '');
  const [places, setPlaces] = useState<string[]>(['featured']);
  const [budget, setBudget] = useState('');
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const chosen = data.events.find((e) => e.id === ev);
  const lastDay = chosen?.endsOn ?? chosen?.startsOn ?? undefined;

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const out = await FF.post('/organizer/ads', {
        eventId: ev, placements: places, budget: Number(budget.replace(/\D/g, '')) || 0, startsOn: from, endsOn: to || lastDay, message: note.trim() || undefined,
      });
      kd.toast(FF.text(out.message, lang));
      onSent();
    } catch (x) { setErr(FF.errorText(x, lang)); }
    setBusy(false);
  };

  return (
    <Drawer onClose={onClose} title={T.adAsk} footer={<Button tone="acc" type="submit" form="ad-ask" disabled={busy || !ev || !places.length || !budget}>{T.adSend}</Button>}>
      {!data.events.length ? <p className="kd-t">{T.adNoEvents}</p> : (
        <form id="ad-ask" className="flex flex-col gap-4" onSubmit={send}>
          <Field label={T.adEvent} htmlFor="ad-event">
            <Select id="ad-event" value={ev} onChange={(e) => setEv(e.target.value)}>
              {data.events.map((e) => <option key={e.id} value={e.id}>{[e.title, e.startsOn ? dayMonth(e.startsOn, lang) : null, e.cityLabel?.[lang]].filter(Boolean).join(' · ')}</option>)}
            </Select>
          </Field>
          <fieldset className="flex flex-col">
            <legend className="kd-flabel pb-1">{T.adPlacements}</legend>
            {data.placements.map((p) => (
              <label key={p.key} className="flex min-h-11 cursor-pointer items-center gap-3">
                <input type="checkbox" className="kd-check" checked={places.includes(p.key)}
                  onChange={(e) => setPlaces((xs) => (e.target.checked ? [...xs, p.key] : xs.filter((x) => x !== p.key)))} />
                <span className="kd-t text-paper">{p.label[lang]}</span>
              </label>
            ))}
          </fieldset>
          <Field label={fill(T.adBudget, { c: data.currency })} hint={fill(T.adBudgetHint, { m: money(data.minBudget, data.currency, lang) })} htmlFor="ad-budget">
            <Input id="ad-budget" inputMode="numeric" className="kd-num" value={budget ? Number(budget).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US') : ''}
              onChange={(e) => setBudget(e.target.value.replace(/\D/g, '').slice(0, 12))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={T.adFrom} htmlFor="ad-from"><Input id="ad-from" type="date" min={today} max={lastDay} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label={T.adTo} htmlFor="ad-to"><Input id="ad-to" type="date" min={from || today} max={lastDay} value={to || lastDay || ''} onChange={(e) => setTo(e.target.value)} /></Field>
          </div>
          <Field label={T.adNote} htmlFor="ad-note"><TextArea id="ad-note" rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <FieldError>{err}</FieldError>
        </form>
      )}
    </Drawer>
  );
}
