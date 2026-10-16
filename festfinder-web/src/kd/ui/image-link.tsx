'use client';
/**
 * A picture as a link: a person's or an artist's photo, an organiser's logo or cover, a project's
 * cover, a moment. Only an event's own media is uploaded (console/events/parts.tsx Upload). The
 * link is checked by the API (POST /images/check) when it is pasted, on Enter or when the field
 * is left, and the preview shows what will be saved; saving checks it again.
 */
import { useId, useState } from 'react';
import { LinkSimpleIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { pick, type Lang } from '../copy';
import { cx } from '../cx';
import { Button } from './actions';
import { FieldError, Input } from './forms';

export type ImagePurpose = 'avatar' | 'logo' | 'profile_cover' | 'moment';

const COPY = {
  checking: { en: 'Checking…', vi: 'Đang kiểm tra…' },
  use: { en: 'Use', vi: 'Dùng' },
  remove: { en: 'Remove', vi: 'Xoá' },
};

export function ImageLinkField({ lang, purpose, label, hint, value, onChange, className }: {
  lang: Lang; purpose: ImagePurpose; label: string; hint: string; value: string | null; onChange: (url: string | null) => void; className?: string;
}) {
  const T = pick(COPY, lang);
  const id = useId();
  const [text, setText] = useState(value ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  // A newer value from the screen (a reload, a removal) replaces what is typed.
  const [seen, setSeen] = useState(value);
  if (value !== seen) { setSeen(value); setText(value ?? ''); setErr(''); }

  const check = async (raw: string) => {
    const url = raw.trim();
    setErr('');
    if (!url) { if (value) onChange(null); return; }
    if (url === value || busy) return;
    setBusy(true);
    try {
      const out = await FF.post('/images/check', { url, purpose });
      setText(out.url);
      onChange(out.url);
    } catch (e) {
      setErr(FF.errorText(e, lang));
    }
    setBusy(false);
  };

  const round = purpose === 'avatar';
  return (
    <div className={cx('flex flex-col gap-2 rounded-[10px] border border-dashed border-line2 px-4 py-3', className)}>
      <div className="flex min-h-11 items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- a link to another site, checked by the API
          <img src={value} alt="" referrerPolicy="no-referrer" className={cx('shrink-0 object-cover', round ? 'size-11 rounded-full' : purpose === 'profile_cover' ? 'h-11 w-[78px] rounded-md' : 'size-11 rounded-lg')} />
        ) : null}
        <label htmlFor={id} className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="kd-hs">{label}</span>
          <span className="kd-s">{busy ? T.checking : hint}</span>
        </label>
        {value ? <Button size="sm" tone="ghost" onClick={() => { setText(''); setErr(''); onChange(null); }} aria-label={`${T.remove} · ${label}`}>{T.remove}</Button> : null}
      </div>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://"
          maxLength={2048}
          boxClass="min-w-0 flex-1"
          icon={<LinkSimpleIcon size={16} className="text-fog" aria-hidden="true" />}
          invalid={!!err}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => { const v = e.clipboardData.getData('text'); if (v) { e.preventDefault(); setText(v.trim()); void check(v); } }}
          onBlur={() => { void check(text); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void check(text); } }}
        />
        {text.trim() && text.trim() !== value ? <Button size="sm" disabled={busy} onClick={() => void check(text)}>{T.use}</Button> : null}
      </div>
      <FieldError>{err}</FieldError>
    </div>
  );
}
