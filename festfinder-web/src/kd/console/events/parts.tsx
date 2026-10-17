'use client';
/**
 * The event form's own fields: a numbered section with its done tick, the image uploader
 * (size and shape checked before anything is sent), quarter-hour time picks, the price field,
 * the lineup with artist suggestions, and the ticket-tier editor with its presets.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { CheckIcon, ImageSquareIcon, PlusIcon, TrashIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../../copy';
import { cx } from '../../cx';
import { useKd } from '../../runtime';
import { Button, Chip, IconButton } from '../../ui/actions';
import { FieldError, Input, Select } from '../../ui/forms';
import { Card as Panel } from '../../ui/parts';
import { qs } from '../kit';
import { EVENTS } from './copy';
import { FrameButton, FramedThumb } from '../../ui/frame-editor';

// ---- a section ------------------------------------------------------------------------------

export function Section({ id, n, title, done, sub, doneLabel, children }: {
  id: string; n: number; title: string; done: boolean; sub?: ReactNode; doneLabel: string; children: ReactNode;
}) {
  return (
    <Panel as="section" id={'sec-' + id} aria-labelledby={'sec-' + id + '-h'} className="flex scroll-mt-6 flex-col gap-5 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className={cx('kd-mb flex size-7 shrink-0 items-center justify-center rounded-full text-xs', done ? 'bg-ok text-ink' : 'text-fog shadow-[inset_0_0_0_1px_var(--color-line2)]')}>
          {done ? <CheckIcon size={14} weight="bold" aria-label={doneLabel} /> : n}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id={'sec-' + id + '-h'} className="kd-h">{title}</h2>
          {sub ? <span className="kd-s kd-num">{sub}</span> : null}
        </div>
      </div>
      {children}
    </Panel>
  );
}

/** Scrolls to a section and moves focus into it. */
export function jump(id: string) {
  const el = document.getElementById('sec-' + id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.querySelector<HTMLElement>('input, select, textarea, button:not([disabled])')?.focus({ preventScroll: true });
}

// ---- times and prices -----------------------------------------------------------------------

/** Every quarter hour, so times are picked, not typed; a value off the grid is kept as its own option. */
const TIMES = Array.from({ length: 96 }, (_, i) => `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`);

export function TimeSelect({ id, value, onChange, after, nextDay }: { id: string; value: string; onChange: (v: string) => void; after?: string; nextDay: string }) {
  const list = value && !TIMES.includes(value) ? [...TIMES, value].sort() : TIMES;
  return (
    <Select id={id} className="kd-num" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">--:--</option>
      {list.map((t) => <option key={t} value={t}>{t}{after && t <= after ? ` ${nextDay}` : ''}</option>)}
    </Select>
  );
}

/** Whole units, grouped as they are typed. */
export function PriceInput({ id, value, onChange, lang, invalid, label }: { id: string; value: number; onChange: (n: number) => void; lang: Lang; invalid?: boolean; label?: string }) {
  const fmt = (n: number) => (n ? n.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US') : '');
  return (
    <Input id={id} aria-label={label} className="kd-num" inputMode="numeric" invalid={invalid} value={fmt(value)} placeholder="0"
      onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 9); onChange(d ? Number(d) : 0); }} />
  );
}

// ---- images ---------------------------------------------------------------------------------

const RULES = { cover: { min: [1600, 900], ratio: 16 / 9 }, logo: { min: [256, 256], ratio: 0 } } as const;

async function imageSize(file: File): Promise<[number, number]> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((ok, bad) => { img.onload = ok; img.onerror = bad; img.src = url; });
    return [img.naturalWidth, img.naturalHeight];
  } finally { URL.revokeObjectURL(url); }
}

export function Upload({ lang, purpose, label, value, onChange, disabled }: {
  lang: Lang; purpose: 'cover' | 'logo'; label: ReactNode; value: string | null; onChange: (v: string | null) => void; disabled?: boolean;
}) {
  const T = pick(EVENTS, lang);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const rule = RULES[purpose];
  const take = async (file: File | undefined) => {
    setErr(null);
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setErr(T.upType);
    if (file.size > 8 * 1024 * 1024) return setErr(T.upSize);
    try {
      const [w, h] = await imageSize(file);
      if (w < rule.min[0] || h < rule.min[1]) return setErr(fill(T.upSmall, { s: `${w}×${h}`, m: rule.min.join('×') }));
      if (rule.ratio && Math.abs(w / h - rule.ratio) > 0.01) return setErr(fill(T.upRatio, { s: `${w}×${h}` }));
    } catch { return setErr(T.upRead); }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const out = await FF.api('POST', '/uploads?purpose=' + purpose, fd);
      onChange(out.url);
    } catch (e) { setErr(FF.errorText(e, lang)); }
    setBusy(false);
  };
  const name = typeof label === 'string' ? label : purpose;
  return (
    <div className="flex flex-col gap-2">
      <span className="kd-flabel">{label}</span>
      <div
        className={cx('flex min-h-20 flex-wrap items-center gap-3 rounded-[10px] border border-dashed px-4 py-3', drag ? 'border-acc' : 'border-line2')}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (!disabled) void take(e.dataTransfer.files[0]); }}
      >
        {value
          ? <FramedThumb src={value} className={purpose === 'logo' ? 'size-12 rounded-lg' : 'h-12 w-[86px] rounded-md'} />
          : <ImageSquareIcon size={22} className="shrink-0 text-fog" aria-hidden="true" />}
        <span className="kd-s min-w-0 flex-1 basis-40">{busy ? T.uploading : purpose === 'cover' ? T.coverRule : T.logoRule}</span>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { void take(e.target.files?.[0]); e.target.value = ''; }} />
        <FrameButton lang={lang} value={value} disabled={disabled} shapes={purpose === 'logo' ? ['square', 'round'] : ['banner', 'card', 'square']} onChange={onChange} />
        {value ? <Button tone="ghost" size="sm" disabled={disabled} aria-label={`${T.remove} · ${name}`} onClick={() => onChange(null)}>{T.remove}</Button> : null}
        <Button size="sm" disabled={busy || disabled} aria-label={`${value ? T.replace : T.upload} · ${name}`} onClick={() => input.current?.click()}>{value ? T.replace : T.upload}</Button>
      </div>
      <FieldError>{err}</FieldError>
    </div>
  );
}

// ---- lineup ---------------------------------------------------------------------------------

/** Names as chips; typing suggests artists already on listings, so a name is spelled one way. */
export function Lineup({ lang, id, value, onChange }: { lang: Lang; id: string; value: string[]; onChange: (v: string[]) => void }) {
  const T = pick(EVENTS, lang);
  const [text, setText] = useState('');
  const [hits, setHits] = useState<{ name: string; events: number }[]>([]);
  const [open, setOpen] = useState(false);
  const list = useId();
  useEffect(() => {
    const q = text.trim();
    if (q.length < 2) { setHits([]); return; }
    let live = true;
    const t = setTimeout(() => {
      FF.maybe(FF.get('/artists' + qs({ q })), { items: [] }).then((out: { items: { name: string; events: number }[] }) => {
        if (live) setHits(out.items.filter((a) => !value.includes(a.name)).slice(0, 8));
      });
    }, 200);
    return () => { live = false; clearTimeout(t); };
  }, [text, value]);
  const add = (raw: string) => {
    const names = raw.split(',').map((s) => s.trim().slice(0, 100)).filter(Boolean);
    const next = [...value];
    for (const n of names) if (!next.includes(n) && next.length < 80) next.push(n);
    if (next.length !== value.length) onChange(next);
    setText('');
  };
  return (
    <div className="flex flex-col gap-2">
      {value.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((a) => (
            <li key={a}><Chip on onClick={() => onChange(value.filter((x) => x !== a))} aria-label={fill(T.removeArtist, { n: a })}>{a}<XIcon size={12} aria-hidden="true" /></Chip></li>
          ))}
        </ul>
      ) : null}
      <div className="relative">
        <Input
          id={id}
          value={text}
          placeholder={T.lineupPh}
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-controls={list}
          aria-autocomplete="list"
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => { setOpen(false); if (text.trim()) add(text); }, 150)}
          onChange={(e) => { if (e.target.value.includes(',')) add(e.target.value); else setText(e.target.value); setOpen(true); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(text); } }}
        />
        {open && hits.length ? (
          <ul id={list} role="listbox" aria-label={T.lineup} className="kd-menu absolute inset-x-0 top-full z-30 mt-1.5 flex flex-col p-1.5">
            {hits.map((a) => (
              <li key={a.name} role="option" aria-selected={false}>
                <button type="button" className="kd-mi w-full text-left" onMouseDown={(e) => e.preventDefault()} onClick={() => add(a.name)}>
                  <span className="min-w-0 flex-1 kd-ell">{a.name}</span><span className="kd-aside kd-num">{fill(T.artistEvents, { n: a.events })}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

// ---- ticket tiers ---------------------------------------------------------------------------

export interface TierRow { key: string; nameVi: string; nameEn: string; price: number; capacity: string; sold: number }

export function TierEditor({ lang, rows, onChange, presets, priceFrom, currency, disabled }: {
  lang: Lang; rows: TierRow[]; onChange: (r: TierRow[]) => void; presets: { key: string; name: Pair }[]; priceFrom: number; currency: string; disabled?: boolean;
}) {
  const T = pick(EVENTS, lang);
  const upd = (i: number, p: Partial<TierRow>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const add = () => {
    const used = new Set(rows.map((r) => r.key));
    const p = presets.find((x) => !used.has(x.key));
    onChange([...rows, p
      ? { key: p.key, nameVi: p.name.vi, nameEn: p.name.en, price: priceFrom || 0, capacity: '100', sold: 0 }
      : { key: `tier-${rows.length + 1}`, nameVi: '', nameEn: '', price: 0, capacity: '100', sold: 0 }]);
  };
  const total = rows.reduce((n, r) => n + (Number(r.capacity) || 0), 0);
  const cols = 'grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] @min-[600px]:grid-cols-[150px_minmax(0,1fr)_130px_110px_44px] items-center gap-2';
  const price = fill(T.tierPrice, { c: currency });
  return (
    <div className="flex flex-col gap-2">
      {rows.length ? (
        <div className="@container">
          <div className="flex flex-col gap-2">
            <div className={cx(cols, 'kd-m hidden @min-[600px]:grid')}><span>{T.tier}</span><span>{T.tierName}</span><span>{price}</span><span>{T.tierQty}</span><span /></div>
            {rows.map((r, i) => (
              <div key={i} className={cx(cols, 'border-b border-line pb-2 @min-[600px]:border-0 @min-[600px]:pb-0')}>
                <Select aria-label={`${T.tier} ${i + 1}`} disabled={r.sold > 0 || disabled}
                  value={presets.some((p) => p.key === r.key) ? r.key : '__custom'}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '__custom') upd(i, { key: `tier-${i + 1}-${Math.random().toString(36).slice(2, 5)}` });
                    else { const p = presets.find((x) => x.key === v)!; upd(i, { key: v, nameVi: p.name.vi, nameEn: p.name.en }); }
                  }}>
                  {presets.map((p) => <option key={p.key} value={p.key} disabled={rows.some((x, j) => j !== i && x.key === p.key)}>{p.name[lang]}</option>)}
                  <option value="__custom">{T.tierCustom}</option>
                </Select>
                <Input aria-label={`${T.tierName} ${i + 1}`} boxClass="col-span-2 @min-[600px]:col-span-1" value={r.nameVi} placeholder={T.tierNamePh} maxLength={60} disabled={disabled}
                  onChange={(e) => upd(i, { nameVi: e.target.value, nameEn: r.nameEn || e.target.value })} />
                <PriceInput id={`tierPrice${i}`} label={`${price} ${i + 1}`} lang={lang} value={r.price} onChange={(v) => upd(i, { price: v })} />
                <Input aria-label={`${T.tierQty} ${i + 1}`} className="kd-num" inputMode="numeric" value={r.capacity} disabled={disabled}
                  end={r.sold ? <span className="kd-m shrink-0">{fill(T.tierSold, { n: r.sold })}</span> : null}
                  onChange={(e) => upd(i, { capacity: e.target.value.replace(/\D/g, '').slice(0, 6) })} />
                <IconButton size="sm" label={r.sold ? T.tierHasSales : T.tierRemove} disabled={r.sold > 0 || disabled} onClick={() => onChange(rows.filter((_, j) => j !== i))}><TrashIcon size={16} aria-hidden="true" /></IconButton>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" disabled={rows.length >= 12 || disabled} onClick={add}><PlusIcon size={16} aria-hidden="true" />{T.addTier}</Button>
        {rows.length ? <span className="kd-s kd-num">{fill(T.tierTotal, { n: total.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US') })}</span> : null}
      </div>
    </div>
  );
}
