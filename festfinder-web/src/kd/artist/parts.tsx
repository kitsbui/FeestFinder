'use client';
/** Pieces the artist screens share: a section card, chip pickers, an image upload, fees and statuses. */
import { useRef, useState, type ReactNode } from 'react';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../copy';
import { cx } from '../cx';
import { dayMonth, money } from '../format';
import { useKd } from '../runtime';
import { Button, Chip } from '../ui/actions';
import { Card as Panel, type StatusTone } from '../ui/parts';
import { ARTIST } from './copy';

/** A section card with a heading row. */
export function Block({ title, aside, children, className }: { title: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Panel as="section" className={cx('flex min-w-0 flex-col gap-4 p-5', className)} aria-label={typeof title === 'string' ? title : undefined}>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="kd-h">{title}</h2>{aside}</div>
      {children}
    </Panel>
  );
}

/** Chips that toggle values in a list; `max` stops adding past it. */
export function ChipPick({ label, options, value, onChange, max }: {
  label: string; options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; max?: number;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="kd-flabel mb-2">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value.includes(o.value);
          return (
            <Chip key={o.value} on={on} disabled={!on && !!max && value.length >= max} onClick={() => onChange(on ? value.filter((x) => x !== o.value) : [...value, o.value])}>
              {o.label}
            </Chip>
          );
        })}
      </div>
    </fieldset>
  );
}

/** A photo or cover: the preview, and upload or change (POST /uploads?purpose=…). */
export function ImagePick({ lang, purpose, label, hint, value, onChange }: {
  lang: Lang; purpose: 'avatar' | 'cover'; label: string; hint: string; value: string | null; onChange: (v: string | null) => void;
}) {
  const T = pick(ARTIST, lang);
  const kd = useKd();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const send = async (file: File) => {
    setBusy(true);
    try { const form = new FormData(); form.append('file', file); onChange((await FF.api('POST', '/uploads?purpose=' + purpose, form)).url); } catch (e) { kd.toast(FF.errorText(e, lang)); }
    setBusy(false);
  };
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-[10px] border border-dashed border-line2 px-4 py-3">
      {value
        // eslint-disable-next-line @next/next/no-img-element -- uploads come from the API's file storage
        ? <img src={value} alt="" className={purpose === 'avatar' ? 'size-11 shrink-0 rounded-full object-cover' : 'h-11 w-[78px] shrink-0 rounded-md object-cover'} />
        : null}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5"><span className="kd-hs">{label}</span><span className="kd-s">{busy ? T.uploading : hint}</span></span>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { const file = e.target.files?.[0]; if (file) send(file); e.target.value = ''; }} />
      {value ? <Button size="sm" tone="ghost" onClick={() => onChange(null)} aria-label={`${T.remove} · ${label}`}>{T.remove}</Button> : null}
      <Button size="sm" disabled={busy} onClick={() => input.current?.click()} aria-label={`${value ? T.change : T.upload} · ${label}`}>{value ? T.change : T.upload}</Button>
    </div>
  );
}

/** "5.000.000₫ – 8.000.000₫", one end, or a dash. */
export function feeText(min: number | null, max: number | null, currency: string, lang: Lang) {
  const ends = [min, max].filter((x): x is number => x != null);
  return ends.length ? ends.map((x) => money(x, currency, lang)).join(' – ') : '—';
}

/** Applications, booking requests and brand interests share their statuses. */
export function statusOf(s: string, lang: Lang): { tone: StatusTone; label: string } {
  const T = pick(ARTIST, lang);
  const map: Record<string, { tone: StatusTone; label: string }> = {
    sent: { tone: 'none', label: T.stSent },
    shortlisted: { tone: 'warn', label: T.stShortlisted },
    declined: { tone: 'bad', label: T.stDeclined },
    booked: { tone: 'ok', label: T.stBooked },
    withdrawn: { tone: 'none', label: T.stWithdrawn },
    accepted: { tone: 'ok', label: T.stAccepted },
    selected: { tone: 'ok', label: T.stSelected },
  };
  return map[s] ?? { tone: 'none', label: s };
}

/** "hạn 12.11" for a closing date. */
export const closesText = (iso: string, lang: Lang) => fill(pick(ARTIST, lang).closes, { d: dayMonth(iso, lang) });
