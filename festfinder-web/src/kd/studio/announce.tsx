'use client';
/**
 * /studio/announce: a message to the chosen event's people. Who (saved it, ticket holders,
 * VIP, past guests, each with its size), which channels (with how many each reaches, nobody
 * counted twice), subject and message, now or at a time; then what went out and what is
 * scheduled, with the open rate, and cancel for a scheduled one.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { FF } from '@/runtime/ff';
import { fill, pick, type Pair } from '../copy';
import { count, dayMonth } from '../format';
import { useKd } from '../runtime';
import { Button, Chip } from '../ui/actions';
import { FieldLabel, Input, Segmented, TextArea } from '../ui/forms';
import { Status } from '../ui/parts';
import { STUDIO } from './copy';
import { StudioHead } from './head';
import { Block, NeedEvent, Page } from './parts';
import { useStudio } from './root';

type Audience = 'saved' | 'holders' | 'vip' | 'past';
type Channel = 'push' | 'zalo' | 'email';
interface Sent { id: string; subject: string; body: string; status: 'scheduled' | 'sent' | string; audienceLabel: Pair; channels: Channel[]; sendAt: string; reach: number | null; openedPct: number | null }
interface Estimate { audienceSize: number; reach: number; channels: { channel: Channel; reachable: number; rate: number }[] }
const MAX = 320;

export function Announce() {
  const { lang, event } = useStudio();
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const [audience, setAudience] = useState<Audience>('saved');
  const [channels, setChannels] = useState<Channel[]>(['push']);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [later, setLater] = useState(false);
  const [at, setAt] = useState('');
  const [sizes, setSizes] = useState<Partial<Record<Audience, number>>>({});
  const [est, setEst] = useState<Estimate | null>(null);
  const [sent, setSent] = useState<Sent[] | null>(null);
  const [busy, setBusy] = useState(false);
  const base = event ? `/organizer/events/${event.id}/announcements` : null;

  const loadSent = useCallback(async () => {
    if (!base) return;
    const out = await FF.maybe(FF.get(base), { items: [] });
    setSent(out.items);
  }, [base]);
  useEffect(() => {
    if (!base) return;
    loadSent();
    Promise.all((['saved', 'holders', 'vip', 'past'] as Audience[]).map((a) => FF.maybe(FF.get(`${base}/estimate?audience=${a}&channels=`), null)))
      .then((r: (Estimate | null)[]) => setSizes({ saved: r[0]?.audienceSize, holders: r[1]?.audienceSize, vip: r[2]?.audienceSize, past: r[3]?.audienceSize }));
  }, [base, loadSent]);
  useEffect(() => {
    if (!base) return;
    FF.maybe(FF.get(`${base}/estimate?audience=${audience}&channels=${channels.join(',')}`), null).then(setEst);
  }, [base, audience, channels]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!base || busy) return;
    setBusy(true);
    try {
      const out = await FF.post(base, { audience, channels, subject, body, sendAt: later && at ? new Date(at).toISOString() : null });
      kd.toast(FF.text(out.message, lang));
      setSubject(''); setBody(''); setLater(false); setAt('');
      loadSent();
    } catch (x) { kd.toast(FF.errorText(x, lang)); }
    setBusy(false);
  };
  const cancel = async (id: string) => {
    try { const out = await FF.del('/organizer/announcements/' + id); kd.toast(FF.text(out.message, lang)); loadSent(); } catch (x) { kd.toast(FF.errorText(x, lang)); }
  };
  const audiences: { value: Audience; label: string }[] = [
    { value: 'saved', label: T.audSaved }, { value: 'holders', label: T.audHolders }, { value: 'vip', label: T.audVip }, { value: 'past', label: T.audPast },
  ];
  const chLabel: Record<Channel, string> = { push: 'Push', zalo: 'Zalo', email: 'Email' };
  const toggle = (c: Channel) => setChannels((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  const when = (iso: string) => `${dayMonth(iso.slice(0, 10), lang)} ${FF.hhmm(iso)}`;

  return (
    <Page>
      <StudioHead label={T.announce} />
      {!event ? <NeedEvent /> : (
        <div className="kd-split gap-3">
          <Block className="kd-main" title={T.annNew}>
            {event.status !== 'live' ? <p className="kd-s">{T.annNotLive}</p> : null}
            <form className="flex flex-col gap-5" onSubmit={send}>
              <fieldset className="flex flex-col gap-2">
                <legend className="kd-flabel mb-2">{T.annTo}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {audiences.map((a) => <Chip key={a.value} on={audience === a.value} count={sizes[a.value] ?? null} onClick={() => setAudience(a.value)}>{a.label}</Chip>)}
                </div>
              </fieldset>
              <fieldset className="flex flex-col gap-2">
                <legend className="kd-flabel mb-2">{T.annChannels}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {(['push', 'zalo', 'email'] as Channel[]).map((c) => {
                    const n = est?.channels.find((x) => x.channel === c)?.reachable;
                    return <Chip key={c} on={channels.includes(c)} count={n ?? null} onClick={() => toggle(c)}>{chLabel[c]}</Chip>;
                  })}
                </div>
                {est ? <span className="kd-s kd-num" role="status">{fill(T.annReach, { n: count(est.reach, lang), m: count(est.audienceSize, lang) })}</span> : null}
              </fieldset>
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="annSubject">{T.annSubject}</FieldLabel>
                <Input id="annSubject" required maxLength={120} value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="annBody" hint={`${body.length} / ${MAX}`}>{T.annBody}</FieldLabel>
                <TextArea id="annBody" required rows={4} maxLength={MAX} value={body} onChange={(e) => setBody(e.target.value)} />
                <span className="kd-s">{T.annRule}</span>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <Segmented label={T.annWhen} value={later ? 'later' : 'now'} onChange={(v) => setLater(v === 'later')} options={[{ value: 'now', label: T.annNow }, { value: 'later', label: T.annLater }]} />
                {later ? (
                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="annAt">{T.annAt}</FieldLabel>
                    <Input id="annAt" type="datetime-local" className="kd-num" required value={at} onChange={(e) => setAt(e.target.value)} />
                  </div>
                ) : null}
              </div>
              <Button tone="acc" type="submit" className="self-start" disabled={busy || event.status !== 'live' || !channels.length || !subject.trim() || !body.trim()}>{later ? T.annSchedule : T.annSend}</Button>
            </form>
          </Block>
          <Block className="kd-side self-start" title={T.annSent}>
            {sent === null ? <div className="kd-skel h-24" aria-hidden="true" /> : !sent.length ? <span className="kd-s">{T.annNone}</span> : (
              <ul className="flex flex-col">
                {sent.map((a) => (
                  <li key={a.id} className="flex flex-col gap-1 border-b border-line py-3 first:pt-0 last:border-b-0">
                    <span className="flex items-center justify-between gap-3">
                      <Status tone={a.status === 'sent' ? 'ok' : 'warn'}>{a.status === 'sent' ? T.annSentSt : T.annScheduled}</Status>
                      <span className="kd-m kd-num">{when(a.sendAt)}</span>
                    </span>
                    <span className="kd-hs">{a.subject}</span>
                    <span className="kd-s">{a.body}</span>
                    <span className="kd-m kd-num">
                      {[a.audienceLabel[lang], a.channels.map((c) => chLabel[c]).join(' + '), a.reach != null ? fill(T.annPeople, { n: count(a.reach, lang) }) : null, a.openedPct != null ? fill(T.annOpened, { p: a.openedPct }) : null].filter(Boolean).join(' · ')}
                    </span>
                    {a.status === 'scheduled' ? <Button tone="ghost" size="sm" className="-ml-3 self-start" onClick={() => cancel(a.id)}>{T.annCancel}</Button> : null}
                  </li>
                ))}
              </ul>
            )}
          </Block>
        </div>
      )}
    </Page>
  );
}
