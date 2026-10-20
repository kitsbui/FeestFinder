'use client';
/** The listing fields the wizard and the editor share: the lineup, the venue, an upload, an appeal. */
import { useRef, useState } from 'react';
import { CameraIcon, ImageSquareIcon, MapPinIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, type Lang, pick } from '../copy';
import { useKd } from '../runtime';
import { Button, Chip } from '../ui/actions';
import { FieldLabel, Input, TextArea } from '../ui/forms';
import { Status } from '../ui/parts';
import { STUDIO } from './copy';
import { FrameButton, FramedThumb } from '../ui/frame-editor';
import { type Venue } from './wizard-model';

/** A listing sent back can be appealed once, within its window. */
export function Appeal({ lang, eventId }: { lang: Lang; eventId: string }) {
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  if (done) return <Status tone="ok">{T.appealSent}</Status>;
  return (
    <div className="mt-2 flex flex-col gap-2">
      <FieldLabel htmlFor="appeal">{T.appeal}</FieldLabel>
      <TextArea id="appeal" rows={2} minLength={10} maxLength={2000} placeholder={T.appealPh} value={text} onChange={(e) => setText(e.target.value)} />
      <Button size="sm" className="self-start" disabled={text.trim().length < 10} onClick={async () => {
        try { const out = await FF.post(`/organizer/events/${eventId}/appeal`, { reply: text.trim() }); kd.toast(FF.text(out.message, lang)); setDone(true); } catch (e) { kd.toast(FF.errorText(e, lang)); }
      }}>{T.appealSend}</Button>
    </div>
  );
}

export function Lineup({ lang, value, onChange }: { lang: Lang; value: string[]; onChange: (v: string[]) => void }) {
  const T = pick(STUDIO, lang);
  const [text, setText] = useState('');
  const add = () => {
    const n = text.trim().slice(0, 100);
    if (n && !value.includes(n) && value.length < 80) onChange([...value, n]);
    setText('');
  };
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor="evLineup">{T.fLineup} <span className="font-normal text-fg-3">{T.optional}</span></FieldLabel>
      {value.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((a) => (
            <li key={a}><Chip on onClick={() => onChange(value.filter((x) => x !== a))} aria-label={fill(T.fRemoveArtist, { n: a })}>{a}<XIcon size={12} aria-hidden="true" /></Chip></li>
          ))}
        </ul>
      ) : null}
      <Input id="evLineup" value={text} placeholder={T.fLineupPh} onChange={(e) => setText(e.target.value)} onBlur={add} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }} />
    </div>
  );
}

export function VenueField({ lang, venues, recent, value, onChange }: {
  lang: Lang; venues: Venue[]; recent: string[]; value: { id: string | null; name: string }; onChange: (v: { id: string | null; name: string }) => void;
}) {
  const T = pick(STUDIO, lang);
  const [focus, setFocus] = useState(false);
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
  const q = norm(value.name.trim());
  const hits = q && !value.id ? venues.filter((v) => norm(`${v.name} ${v.address ?? ''} ${v.area ?? ''}`).includes(q)).slice(0, 6) : [];
  const pick_ = (name: string) => { const v = venues.find((x) => x.name === name); onChange({ id: v?.id ?? null, name }); };
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor="evVenue">{T.fVenue}</FieldLabel>
      <div className="relative">
        <Input
          id="evVenue"
          icon={<MapPinIcon size={18} className="text-fg-3" aria-hidden="true" />}
          value={value.name}
          placeholder={T.fVenuePh}
          role="combobox"
          aria-expanded={focus && hits.length > 0}
          aria-controls="evVenueList"
          aria-autocomplete="list"
          autoComplete="off"
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 150)}
          onChange={(e) => onChange({ id: null, name: e.target.value })}
        />
        {focus && hits.length ? (
          <ul id="evVenueList" role="listbox" className="kd-menu absolute inset-x-0 top-full z-30 mt-1.5 flex flex-col p-1.5">
            {hits.map((v) => (
              <li key={v.id} role="option" aria-selected={false}>
                <button type="button" className="kd-mi w-full text-left" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange({ id: v.id, name: v.name }); setFocus(false); }}>
                  <span className="flex min-w-0 flex-col"><span className="kd-hs kd-ell">{v.name}</span><span className="kd-s kd-ell">{[v.address, v.area].filter(Boolean).join(' · ')}</span></span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {value.name.trim() && !value.id ? <span className="kd-s">{T.fVenueNew}</span> : null}
      {recent.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="kd-s">{T.fRecent}</span>
          {recent.map((n) => <Chip key={n} on={value.name === n} onClick={() => pick_(n)}>{n}</Chip>)}
        </div>
      ) : null}
    </div>
  );
}

export function Upload({ lang, kind, label, hint, value, onChange, required }: {
  lang: Lang; kind: 'logo' | 'cover'; label: string; hint: string; value: string | null; onChange: (v: string | null) => void; required?: boolean;
}) {
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const input = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const send = async (file: File) => {
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const out = await FF.api('POST', '/uploads?purpose=' + kind, form);
      onChange(out.url);
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
    setBusy(false);
  };
  return (
    <div className="flex min-h-16 w-full flex-wrap items-center gap-3 rounded-[10px] border border-dashed border-line-2 px-4 py-3">
      {value
        ? <FramedThumb src={value} className={kind === 'logo' ? 'size-11 rounded-lg' : 'h-11 w-[78px] rounded-md'} />
        : <ImageSquareIcon size={22} className="shrink-0 text-fg-3" aria-hidden="true" />}
      <span className="flex min-w-0 flex-1 basis-40 flex-col gap-0.5">
        <span className="kd-hs">{label} {required ? null : <span className="font-normal text-fg-3">{T.optional}</span>}</span>
        <span className="kd-s">{busy ? T.fUploading : hint}</span>
      </span>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { const file = e.target.files?.[0]; if (file) void send(file); e.target.value = ''; }} />
      {/* A phone's camera for the cover (design v2 phase 16): the back camera opens straight away. */}
      {kind === 'cover' ? <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { const file = e.target.files?.[0]; if (file) void send(file); e.target.value = ''; }} /> : null}
      <FrameButton lang={lang} value={value} shapes={kind === 'logo' ? ['square', 'round'] : ['banner', 'card', 'square']} onChange={onChange} />
      {value && !required ? <Button tone="ghost" size="sm" onClick={() => onChange(null)}>{T.fRemove}</Button> : null}
      {kind === 'cover' ? <Button size="sm" tone="ghost" className="hidden pointer-coarse:inline-flex" disabled={busy} onClick={() => { if (kd.requireSignIn(undefined, T.wSignUpload)) camera.current?.click(); }} aria-label={`${T.fCamera} · ${label}`}><CameraIcon size={14} aria-hidden="true" />{T.fCamera}</Button> : null}
      {/* Pictures go to FeestFinder: signed in first (before that the form is only on this device). */}
      <Button size="sm" disabled={busy} onClick={() => { if (kd.requireSignIn(undefined, T.wSignUpload)) input.current?.click(); }} aria-label={`${value ? T.fChange : T.fUpload} · ${label}`}>{value ? T.fChange : T.fUpload}</Button>
    </div>
  );
}
