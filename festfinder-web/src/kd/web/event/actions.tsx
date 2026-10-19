'use client';
/**
 * The event page's small interactive parts: save, follow, share (with story image and
 * video), collections, copy address, report, claim, and the sticky section bar.
 */
import dynamic from 'next/dynamic';
import { useEffect, useState, type FormEvent } from 'react';
import { CheckIcon, CopyIcon, HeartIcon, ShareNetworkIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { useKd, useSaved } from '../../runtime';
import { Button, IconButton, buttonClass } from '../../ui/actions';
import { FieldError, FieldLabel, Input, TextArea } from '../../ui/forms';
import { Sheet } from '../../ui/sheet';
import { count } from '../../format';
import { WEB } from '../copy';
import { useEvent } from './context';

/** Loaded when they open (design v2 phase 14), never with the page. */
const ShareSheet = dynamic(() => import('./share-sheet').then((m) => m.ShareSheet), { ssr: false });
const ReportSheet = dynamic(() => import('./report-sheet').then((m) => m.ReportSheet), { ssr: false });

const T = (lang: Lang) => pick(WEB, lang);

/** The heart, and the "n quan tâm" count beside it, which moves with it. */
export function SaveWithCount({ lang, size = 'md' }: { lang: Lang; size?: 'sm' | 'md' }) {
  const { ev, personal } = useEvent();
  const kd = useKd();
  const [on, toggle] = useSaved(ev.id);
  // The count the API gave already holds the viewer's own save, if they had one then.
  const was = personal?.viewer ? personal.viewer.saved : kd.user ? null : false;
  const delta = was === null ? 0 : (on ? 1 : 0) - (was ? 1 : 0);
  const t = T(lang);
  return (
    <>
      <IconButton label={on ? t.savedThis : t.saveThis} line pressed={on} onClick={toggle} size={size}>
        <HeartIcon size={20} weight={on ? 'fill' : 'regular'} aria-hidden="true" />
      </IconButton>
      <span className="kd-m kd-num ml-1.5">{fill(t.interested, { n: count(Math.max(0, ev.saveCount + delta), lang) })}</span>
    </>
  );
}

export function FollowOrg({ lang }: { lang: Lang }) {
  const { ev, personal } = useEvent();
  const kd = useKd();
  const org = ev.organizer;
  const initial = !!personal?.me?.followingOrganizer;
  const key = 'org:' + (org?.id ?? '');
  const on = kd.follows.has(key) ? !!kd.follows.get(key) : initial;
  if (!org) return null;
  const C = pick({ follow: { vi: 'Theo dõi', en: 'Follow' }, following: { vi: 'Đang theo dõi', en: 'Following' } }, lang);
  return (
    <button
      type="button"
      aria-pressed={on}
      className={buttonClass({ size: 'sm', tone: on ? 'ghost' : 'default' })}
      onClick={() => kd.setFollow('org', org.id, !on)}
    >
      {on ? C.following : C.follow}
    </button>
  );
}

// ---- share ----------------------------------------------------------------------------

export function ShareButton({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const t = T(lang);
  return (
    <>
      <IconButton label={t.share} line onClick={() => setOpen(true)}>
        <ShareNetworkIcon size={20} aria-hidden="true" />
      </IconButton>
      {open ? <ShareSheet lang={lang} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function CopyAddress({ lang, text }: { lang: Lang; text: string }) {
  const [done, setDone] = useState(false);
  const t = T(lang);
  return (
    <button
      type="button"
      className={buttonClass({ tone: 'ghost' })}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 2400); }, () => {});
      }}
    >
      {done ? <CheckIcon size={16} aria-hidden="true" /> : <CopyIcon size={16} aria-hidden="true" />}
      <span aria-live="polite">{done ? t.copied : t.copyAddress}</span>
    </button>
  );
}

// ---- report and claim --------------------------------------------------------------------


export function ReportLink({ lang }: { lang: Lang }) {
  const { ev, personal, reload } = useEvent();
  const kd = useKd();
  const t = T(lang);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const done = !!personal?.me?.reported;
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!code || busy) return;
    setBusy(true);
    try {
      await FF.post('/events/' + ev.id + '/reports', { code, note: note.trim() });
      setOpen(false);
      kd.toast(t.reportSent);
      void reload();
    } catch (x) { kd.toast(FF.errorText(x, lang)); }
    setBusy(false);
  };
  return (
    <>
      <button
        type="button"
        className="kd-nl"
        disabled={done}
        onClick={() => { if (kd.requireSignIn(undefined, t.gateReport)) setOpen(true); }}
      >
        {done ? t.reported : t.report}
      </button>
      {open ? <ReportSheet lang={lang} code={code} note={note} busy={busy} onCode={setCode} onNote={setNote} onSubmit={send} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

/** A community-sent event: who sent it, and "I organise this" for its real organiser. */
export function CommunityLine({ lang }: { lang: Lang }) {
  const { ev, personal, reload } = useEvent();
  const kd = useKd();
  const t = T(lang);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [proof, setProof] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const c = ev.community;
  if (!c) return null;
  const claim = personal?.mine?.claim;
  const line = c.submittedBy?.name ? fill(t.communityBy, { n: c.submittedBy.name }) : t.communityBySomeone;
  const start = () => {
    if (!kd.requireSignIn(undefined, t.gateClaim)) return;
    if (!claim?.organiser) { location.assign('/studio'); return; }
    setOpen(true);
  };
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (note.trim().length < 10) return setErr(t.claimShort);
    setBusy(true);
    try {
      const p = proof.trim();
      const out = await FF.post('/events/' + ev.id + '/claims', { note: note.trim(), ...(p ? { proofUrl: /^https?:\/\//.test(p) ? p : 'https://' + p } : {}) });
      setOpen(false);
      kd.toast(FF.text(out.message, lang));
      void reload();
    } catch (x) { setErr(FF.errorText(x, lang)); }
    setBusy(false);
  };
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="kd-s">{line}</span>
      {claim?.pending ? <span className="kd-st kd-warn">{t.claimPending}</span> : c.claimable ? (
        <button type="button" className="kd-more" onClick={start}>{t.claim}</button>
      ) : null}
      {open ? (
        <Sheet title={t.claimTitle} closeLabel={t.close} onClose={() => setOpen(false)}>
          <form onSubmit={send} className="flex flex-col gap-3 pt-2">
            <FieldLabel htmlFor="kd-claim-note">{t.claimNote}</FieldLabel>
            <TextArea id="kd-claim-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} invalid={!!err} />
            <FieldLabel htmlFor="kd-claim-proof">{t.claimProof}</FieldLabel>
            <Input id="kd-claim-proof" inputMode="url" value={proof} onChange={(e) => setProof(e.target.value)} />
            <FieldError>{err}</FieldError>
            <Button type="submit" tone="acc" block disabled={busy}>{t.claimSend}</Button>
          </form>
        </Sheet>
      ) : null}
    </div>
  );
}

// ---- the countdown on the cover --------------------------------------------------------

/**
 * "Còn 5 ngày" / "Ngày mai" / "Đang diễn ra", counted in the browser against the API's clock,
 * so a cached page never shows yesterday's count.
 */
export function Countdown({ lang, inline }: { lang: Lang; inline?: boolean }) {
  const { ev } = useEvent();
  const { clockReady } = useKd();
  const t = T(lang);
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (!clockReady) return;
    const tick = () => {
      if (!ev.startsOn) return setText(null);
      const now = FF.now();
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: ev.timezone || 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
      const d = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
      const days = d(today, ev.startsOn), toEnd = ev.endsOn ? d(today, ev.endsOn) : days;
      const live = ev.startsAt && ev.endsAt && now.getTime() >= Date.parse(ev.startsAt) && now.getTime() < Date.parse(ev.endsAt);
      setText(ev.past ? null : live ? t.onNow : days > 1 ? fill(t.daysLeft, { n: days }) : days === 1 ? t.tomorrow : days <= 0 && toEnd >= 0 ? t.today : null);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [ev, clockReady, t.onNow, t.daysLeft, t.tomorrow, t.today]);
  if (!text) return null;
  if (inline) return <span className="kd-tag kd-tag-glass kd-num text-fg-1">{text}</span>;
  return <span className="kd-tag kd-tag-glass kd-num absolute bottom-3.5 left-3.5 z-[1] h-8 px-3 text-fg-1">{text}</span>;
}
