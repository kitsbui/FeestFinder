'use client';
/**
 * Feedback and bug reports from any page: a small glass button in the corner (above the app's
 * tab bar and the ticket dock, hidden while a sheet is open and on the door scanner) opens a
 * sheet: what it is about, a title and details, how bad (bugs), steps, a score, up to two
 * screenshots (picked, dropped or pasted; made smaller in the browser), an email for guests,
 * and what the page attaches by itself, listed. The API answers with a ticket
 * (festfinder-backend routes/feedback.ts). It lives in the root layout, outside the pages'
 * KdProvider, so it reads the session and the language itself. `ff:feedback` opens it.
 */
import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type FormEvent } from 'react';
import { usePathname } from 'next/navigation';
import { BugIcon, ChatTextIcon, LightbulbIcon, PaintBrushIcon, QuestionIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../copy';
import { cx } from '../cx';
import { Button } from '../ui/actions';
import { FieldError, FieldLabel, Input, TextArea } from '../ui/forms';
import { Accordion } from '../ui/parts';
import { Sheet } from '../ui/sheet';
import { FEEDBACK } from './copy';
import { installErrorLog, snapshot, type Telemetry } from './telemetry';

type Kind = 'bug' | 'ui_ux' | 'feature' | 'support';
type Severity = 'low' | 'medium' | 'high' | 'critical';
const KINDS: { key: Kind; icon: typeof BugIcon }[] = [
  { key: 'bug', icon: BugIcon }, { key: 'ui_ux', icon: PaintBrushIcon }, { key: 'feature', icon: LightbulbIcon }, { key: 'support', icon: QuestionIcon },
];
const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical'];
/** Screens where a floating button would be in the way. */
const HIDDEN = [/^\/studio\/door/, /^\/kit/];

/** The language the page is in: ?lang=en, or a part of the page marked English. */
const pageLang = (): Lang => (new URLSearchParams(location.search).get('lang') === 'en' || document.querySelector('[lang="en"]') ? 'en' : 'vi');

/** A screenshot made smaller in the browser: JPEG, 1600 px on the long side at most. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

export function FeedbackWidget() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    installErrorLog();
    const show = () => setOpen(true);
    window.addEventListener('ff:feedback', show);
    return () => window.removeEventListener('ff:feedback', show);
  }, []);
  if (HIDDEN.some((r) => r.test(path ?? ''))) return null;
  return (
    <>
      <button type="button" className="kd-fab kd-glass" aria-label={pick(FEEDBACK, 'vi').open + ' / ' + pick(FEEDBACK, 'en').open} onClick={() => setOpen(true)}>
        <ChatTextIcon size={20} aria-hidden="true" />
      </button>
      {open ? <FeedbackSheet onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function FeedbackSheet({ onClose }: { onClose: () => void }) {
  const [lang] = useState<Lang>(pageLang);
  const T = pick(FEEDBACK, lang);
  const [user, setUser] = useState<{ id: string } | null | undefined>(undefined);
  const [telemetry] = useState<Telemetry>(() => snapshot(lang));
  const [kind, setKind] = useState<Kind | null>(null);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [steps, setSteps] = useState('');
  const [csat, setCsat] = useState<number | null>(null);
  const [shots, setShots] = useState<{ blob: Blob; url: string }[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [trap, setTrap] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    FF.maybe(FF.get('/auth/session?optional=1'), { user: null }).then((s: { user: { id: string } | null }) => setUser(s.user));
  }, []);
  useEffect(() => () => shots.forEach((s) => URL.revokeObjectURL(s.url)), [shots]);

  const addFiles = async (files: Iterable<File>) => {
    const picked = [...files].filter((f) => /^image\/(png|jpeg|webp)$/.test(f.type)).slice(0, 2 - shots.length);
    const made = await Promise.all(picked.map(async (f) => { const blob = await shrink(f); return { blob, url: URL.createObjectURL(blob) }; }));
    setShots((xs) => [...xs, ...made].slice(0, 2));
  };
  const onPaste = (e: ClipboardEvent) => { const fs = [...e.clipboardData.files]; if (fs.length) { e.preventDefault(); void addFiles(fs); } };
  const onDrop = (e: DragEvent) => { e.preventDefault(); void addFiles(e.dataTransfer.files); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!kind || busy) return;
    if (!title.trim() || !details.trim() || (!user && !email.trim())) { setErr(user ? T.neededSignedIn : T.needed); return; }
    setBusy(true); setErr('');
    const payload = {
      type: kind, title: title.trim(), description: details.trim(), csat,
      ...(kind === 'bug' ? { severity, steps: steps.trim() || null } : {}),
      ...(user ? {} : { name: name.trim() || null, email: email.trim() }),
      telemetry, website: trap,
    };
    const form = new FormData();
    form.append('payload', JSON.stringify(payload));
    shots.forEach((s, i) => form.append('attachments', s.blob, `screenshot-${i + 1}.jpg`));
    try {
      const out = await FF.api('POST', '/feedback', form, { lang });
      setTicket(out.ticketId);
    } catch (x) { setErr(FF.errorText(x, lang)); }
    setBusy(false);
  };

  return (
    <Sheet onClose={onClose} title={ticket ? T.thanks : T.title} closeLabel={T.close} wide>
      {ticket ? (
        <div className="flex flex-col items-start gap-4 pt-1">
          <p className="kd-t text-fg-1">{fill(T.ticket, { t: ticket })}</p>
          <Button onClick={onClose}>{T.close}</Button>
        </div>
      ) : !kind ? (
        <fieldset className="flex flex-col gap-3 pt-1">
          <legend className="kd-flabel mb-1">{T.kind}</legend>
          <div className="grid grid-cols-1 gap-2 tab:grid-cols-2">
            {KINDS.map(({ key, icon: Icon }) => (
              <button key={key} type="button" className="kd-lrow min-h-14 rounded-card border-b-0 px-3.5 text-left shadow-[inset_0_0_0_1px_var(--color-line-2)] hover:bg-white/[0.04]" onClick={() => setKind(key)}>
                <Icon size={20} className="text-fg-1" aria-hidden="true" />
                <span className="kd-hs flex-1">{T[key]}</span>
              </button>
            ))}
          </div>
        </fieldset>
      ) : (
        <form className="flex flex-col gap-4 pt-1" onSubmit={submit} onPaste={onPaste} onDragOver={(e) => e.preventDefault()} onDrop={onDrop} noValidate>
          <div className="flex items-center gap-2">
            <span className="kd-tag">{T[kind]}</span>
            <Button size="sm" tone="ghost" onClick={() => setKind(null)}>{T.back}</Button>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="fb-title" hint={`${title.length}/120`}>{T.summary}</FieldLabel>
            <Input id="fb-title" required maxLength={120} placeholder={T.summaryPh} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="fb-details">{T.details}</FieldLabel>
            <TextArea id="fb-details" required rows={4} maxLength={4000} placeholder={T.detailsPh} value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
          {kind === 'bug' ? (
            <>
              <fieldset className="flex flex-col gap-1.5">
                <legend className="kd-flabel mb-1.5">{T.severity}</legend>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={T.severity}>
                  {SEVERITIES.map((s) => (
                    <button key={s} type="button" role="radio" aria-checked={severity === s} className={cx('kd-chip', severity === s && 'kd-chip-on')} onClick={() => setSeverity(s)}>{T[s]}</button>
                  ))}
                </div>
              </fieldset>
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="fb-steps">{T.steps}</FieldLabel>
                <TextArea id="fb-steps" rows={3} maxLength={2000} placeholder={T.stepsPh} value={steps} onChange={(e) => setSteps(e.target.value)} />
              </div>
            </>
          ) : null}
          <fieldset className="flex flex-col gap-1.5">
            <legend className="kd-flabel mb-1.5">{T.csat}</legend>
            <div className="flex gap-1.5" role="radiogroup" aria-label={T.csat}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={csat === n} aria-label={fill(T.csatN, { n })} className={cx('kd-chip kd-num min-w-11 justify-center', csat === n && 'kd-chip-on')} onClick={() => setCsat(csat === n ? null : n)}>{n}</button>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-1.5">
            <FieldLabel hint={T.shotsHint}>{T.shots}</FieldLabel>
            <div className="flex flex-wrap items-center gap-2">
              {shots.map((s, i) => (
                <span key={s.url} className="relative">
                  { }
                  <img src={s.url} alt="" className="h-16 w-16 rounded-seg object-cover" />
                  <button type="button" className="kd-ib kd-ib-sm kd-glass absolute -top-2 -right-2" aria-label={T.removeShot} onClick={() => setShots((xs) => xs.filter((_, j) => j !== i))}><XIcon size={12} aria-hidden="true" /></button>
                </span>
              ))}
              {shots.length < 2 ? <Button size="sm" onClick={() => file.current?.click()}>{T.addShot}</Button> : null}
              <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" multiple className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { if (e.target.files) void addFiles(e.target.files); e.target.value = ''; }} />
            </div>
          </div>
          {user === null ? (
            <div className="grid gap-3 tab:grid-cols-2">
              <div className="flex flex-col gap-1.5"><FieldLabel htmlFor="fb-name">{T.name}</FieldLabel><Input id="fb-name" maxLength={80} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><FieldLabel htmlFor="fb-email">{T.email}</FieldLabel><Input id="fb-email" type="email" required maxLength={200} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            </div>
          ) : null}
          {/* For bots only: people never see it. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" value={trap} onChange={(e) => setTrap(e.target.value)} />
          <Accordion small summary={T.attached} className="border-t border-line-1">
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5">
              <dt className="kd-m">{T.page}</dt><dd className="kd-s kd-ell">{telemetry.pagePath}</dd>
              <dt className="kd-m">{T.browser}</dt><dd className="kd-s kd-ell">{telemetry.userAgent}</dd>
              <dt className="kd-m">{T.screenSize}</dt><dd className="kd-s kd-num">{telemetry.viewport} · {telemetry.screen} · ×{telemetry.dpr}</dd>
              <dt className="kd-m">{T.lastError}</dt><dd className="kd-s kd-ell">{telemetry.errors.at(-1) ?? (telemetry.lastApiError ? `${telemetry.lastApiError.status} ${telemetry.lastApiError.path}` : T.none)}</dd>
            </dl>
          </Accordion>
          <FieldError>{err}</FieldError>
          <Button type="submit" tone="acc" disabled={busy || user === undefined}>{busy ? T.sending : T.send}</Button>
        </form>
      )}
    </Sheet>
  );
}
