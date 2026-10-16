'use client';
/**
 * The parts every Console screen shares: the page head, filters kept in the address, loading
 * and error states, pagination, the side drawer, the confirm dialog (with an optional or a
 * required note), key/value lists, a search-as-you-type picker and the form options the API
 * serves at /meta/form-options.
 */
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { CaretLeftIcon, CaretRightIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { cx } from '../cx';
import { Button } from '../ui/actions';
import { FieldLabel, Input, TextArea } from '../ui/forms';
import { Menu, MenuItem } from '../ui/menu';
import { Status, type StatusTone } from '../ui/parts';

export const KIT = {
  retry: { en: 'Retry', vi: 'Thử lại' },
  failed: { en: 'This did not load', vi: 'Không tải được' },
  nothing: { en: 'Nothing matches', vi: 'Không có dữ liệu phù hợp' },
  reset: { en: 'Reset', vi: 'Đặt lại' },
  close: { en: 'Close', vi: 'Đóng' },
  cancel: { en: 'Cancel', vi: 'Huỷ' },
  confirm: { en: 'Confirm', vi: 'Xác nhận' },
  note: { en: 'Note', vi: 'Ghi chú' },
  noteNeeded: { en: 'Write a note first', vi: 'Hãy viết ghi chú trước' },
  prev: { en: 'Previous page', vi: 'Trang trước' },
  next: { en: 'Next page', vi: 'Trang sau' },
  range: { en: '{a}–{b} of {n}', vi: '{a}–{b} / {n}' },
  perPage: { en: '{n} a page', vi: '{n} mỗi trang' },
  any: { en: 'Any', vi: 'Tất cả' },
  nPicked: { en: '{n} chosen', vi: 'Đã chọn {n}' },
  searching: { en: 'Searching…', vi: 'Đang tìm…' },
  noMatch: { en: 'No match', vi: 'Không tìm thấy' },
  never: { en: 'never', vi: 'chưa bao giờ' },
  justNow: { en: 'just now', vi: 'vừa xong' },
  minAgo: { en: '{n} min ago', vi: '{n} phút trước' },
  hAgo: { en: '{n}h ago', vi: '{n} giờ trước' },
  dAgo: { en: '{n}d ago', vi: '{n} ngày trước' },
} as const;

// ---- data -----------------------------------------------------------------------------------

/** GET a path; `null` waits. `reload` asks again, keeping what is shown until the answer is in. */
export function useLoad<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!path) return;
    let live = true;
    setError(null);
    FF.get(path).then((d: T) => { if (live) setData(d); }, (e: unknown) => { if (live) setError(e); });
    return () => { live = false; };
  }, [path, tick]);
  const reload = useCallback(() => setTick((n) => n + 1), []);
  return { data, error, reload, setData };
}

/** Query-string parameters as state: `set({a: 'x', b: null})` replaces the address without a reload. */
export function useQuery(): [URLSearchParams, (patch: Record<string, string | null | undefined>) => void] {
  const [search, setSearch] = useState('');
  useEffect(() => {
    const read = () => setSearch(location.search);
    read();
    addEventListener('popstate', read);
    return () => removeEventListener('popstate', read);
  }, []);
  // A link to the same screen with another query (a rail item, a to-do) fires no popstate:
  // the address is read again after each render.
  useEffect(() => { if (location.search !== search) setSearch(location.search); });
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const set = useCallback((patch: Record<string, string | null | undefined>) => {
    const q = new URLSearchParams(location.search);
    for (const [k, v] of Object.entries(patch)) if (v == null || v === '') q.delete(k); else q.set(k, v);
    const s = q.toString();
    history.replaceState(history.state, '', location.pathname + (s ? '?' + s : '') + location.hash);
    setSearch(s ? '?' + s : '');
  }, []);
  return [params, set];
}

/** Builds `?a=1&b=2` from the set values only. */
export function qs(params: Record<string, string | number | boolean | null | undefined | string[]>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '' || v === false || (Array.isArray(v) && !v.length)) continue;
    q.set(k, Array.isArray(v) ? v.join(',') : String(v));
  }
  const s = q.toString();
  return s ? '?' + s : '';
}

export interface FormOptions {
  genres: { value: string; label: Pair }[];
  cities: { value: string; label: Pair; currency?: string; timezone?: string }[];
  styles: { value: string; label: Pair; genre?: string }[];
  eventTypes: { value: string; label: Pair }[];
  areaGroups: { label: Pair; areas: string[] }[];
  [k: string]: any;
}

/** /meta/form-options, read once per page. */
export function useOptions(): FormOptions | null {
  const [o, setO] = useState<FormOptions | null>(null);
  useEffect(() => { FF.once('console:form-options', () => FF.get('/meta/form-options')).then(setO, () => {}); }, []);
  return o;
}

// ---- time -----------------------------------------------------------------------------------

export function ago(iso: string | null | undefined, lang: Lang): string {
  const T = pick(KIT, lang);
  if (!iso) return T.never;
  const min = Math.max(0, Math.round((FF.now().getTime() - new Date(iso).getTime()) / 60000));
  if (min < 1) return T.justNow;
  if (min < 60) return fill(T.minAgo, { n: min });
  if (min < 48 * 60) return fill(T.hAgo, { n: Math.floor(min / 60) });
  return fill(T.dAgo, { n: Math.floor(min / 1440) });
}

/** A date and time in the reader's own clock, for back-office rows (event times use the event's city). */
export function stamp(iso: string | null | undefined, lang: Lang, withTime = true): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB', withTime
    ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ---- layout ---------------------------------------------------------------------------------

/** A screen's head: the title, a line under it, and its actions on the right. */
export function PageHead({ title, sub, actions, eyebrow }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-3 px-[var(--kd-gutter)] pt-6 pb-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {eyebrow ? <div className="flex flex-wrap items-center gap-2">{eyebrow}</div> : null}
        <h1 className="kd-d3">{title}</h1>
        {sub ? <p className="kd-s">{sub}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** The padding of a screen's body. */
export function Body({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('flex flex-col gap-4 px-[var(--kd-gutter)] pb-10', className)}>{children}</div>;
}

/** A row of filters above a table. */
export function FilterBar({ children, onReset }: { children: ReactNode; onReset?: (() => void) | null }) {
  const lang = FF.lang;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
      {onReset ? <button type="button" className="kd-btn kd-btn-sm kd-btn-ghost" onClick={onReset}>{pick(KIT, lang).reset}</button> : null}
    </div>
  );
}

/** One choice from a few: a chip that opens a menu. `''` is "any". */
export function Choice({ label, value, options, onChange, any = true }: {
  label: string; value: string; options: { value: string; label: ReactNode; aside?: ReactNode }[]; onChange: (v: string) => void; any?: boolean;
}) {
  const T = pick(KIT, FF.lang);
  const cur = options.find((o) => o.value === value);
  return (
    <Menu label={label} trigger={(p) => (
      <button type="button" {...p} ref={p.ref} className={cx('kd-chip', value && 'kd-chip-on')} aria-label={label}>
        <span className="kd-ell max-w-[220px]">{cur ? <>{label}: {cur.label}</> : label}</span>
      </button>
    )}>
      {any ? <MenuItem checked={!value} onSelect={() => onChange('')}>{T.any}</MenuItem> : null}
      {options.map((o) => <MenuItem key={o.value} checked={o.value === value} aside={o.aside} onSelect={() => onChange(o.value)}>{o.label}</MenuItem>)}
    </Menu>
  );
}

/** Several choices; picking one toggles it. */
export function MultiChoice({ label, values, options, onChange }: {
  label: string; values: string[]; options: { value: string; label: ReactNode; aside?: ReactNode }[]; onChange: (v: string[]) => void;
}) {
  const T = pick(KIT, FF.lang);
  const one = values.length === 1 ? options.find((o) => o.value === values[0]) : null;
  return (
    <Menu label={label} trigger={(p) => (
      <button type="button" {...p} ref={p.ref} className={cx('kd-chip', values.length && 'kd-chip-on')} aria-label={label}>
        <span className="kd-ell max-w-[220px]">{one ? <>{label}: {one.label}</> : values.length ? <>{label}: {fill(T.nPicked, { n: values.length })}</> : label}</span>
      </button>
    )}>
      {values.length ? <MenuItem onSelect={() => onChange([])}>{T.any}</MenuItem> : null}
      {options.map((o) => (
        <MenuItem key={o.value} checked={values.includes(o.value)} aside={o.aside} onSelect={() => onChange(values.includes(o.value) ? values.filter((v) => v !== o.value) : [...values, o.value])}>{o.label}</MenuItem>
      ))}
    </Menu>
  );
}

/** A search field for a filter bar. */
export function SearchField({ value, onChange, label, placeholder }: { value: string; onChange: (v: string) => void; label: string; placeholder?: string }) {
  return <Input boxClass="h-10 min-h-0 flex-[0_1_300px]" type="search" value={value} aria-label={label} placeholder={placeholder ?? label} onChange={(e) => onChange(e.target.value)} />;
}

export function Loading({ className }: { className?: string }) {
  return <div className={cx('kd-skel h-40', className)} aria-hidden="true" />;
}

export function ErrorBox({ error, retry }: { error: unknown; retry?: () => void }) {
  const lang = FF.lang;
  const T = pick(KIT, lang);
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg p-4 shadow-[inset_0_0_0_1px_var(--color-line2)]">
      <span className="kd-hs">{T.failed}</span>
      <span className="kd-s">{FF.errorText(error, lang)}</span>
      {retry ? <Button size="sm" className="ml-auto" onClick={retry}>{T.retry}</Button> : null}
    </div>
  );
}

export function Empty({ title, children }: { title?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg p-6 shadow-[inset_0_0_0_1px_var(--color-line)]">
      <p className="kd-hs">{title ?? pick(KIT, FF.lang).nothing}</p>
      {children}
    </div>
  );
}

/** Loading, error or the body, for a `useLoad` result. */
export function Loaded<T>({ load, children }: { load: { data: T | null; error: unknown; reload: () => void }; children: (data: T) => ReactNode }) {
  if (load.error && !load.data) return <ErrorBox error={load.error} retry={load.reload} />;
  if (!load.data) return <Loading />;
  return <>{children(load.data)}</>;
}

export function Pill({ tone = 'none', children, className }: { tone?: StatusTone; children: ReactNode; className?: string }) {
  return <Status tone={tone} className={className}>{children}</Status>;
}

/** Label/value rows. */
export function KV({ rows, className }: { rows: [ReactNode, ReactNode][]; className?: string }) {
  return (
    <dl className={cx('grid grid-cols-[minmax(110px,max-content)_1fr] gap-x-4 gap-y-2', className)}>
      {rows.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="kd-m">{k}</dt>
          <dd className="min-w-0 break-words text-sm text-paper">{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Previous / next pages, with the range and the page size. */
export function Pager({ offset, limit, total, onChange, sizes = [25, 50, 100] }: {
  offset: number; limit: number; total: number; onChange: (offset: number, limit: number) => void; sizes?: number[];
}) {
  const T = pick(KIT, FF.lang);
  if (!total) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="kd-m kd-num">{fill(T.range, { a: offset + 1, b: Math.min(total, offset + limit), n: total })}</span>
      <select aria-label={fill(T.perPage, { n: limit })} className="kd-chip ml-auto" value={limit} onChange={(e) => onChange(0, Number(e.target.value))}>
        {sizes.map((s) => <option key={s} value={s}>{fill(T.perPage, { n: s })}</option>)}
      </select>
      <button type="button" className="kd-ib kd-ib-sm" aria-label={T.prev} disabled={offset <= 0} onClick={() => onChange(Math.max(0, offset - limit), limit)}><CaretLeftIcon size={16} aria-hidden="true" /></button>
      <button type="button" className="kd-ib kd-ib-sm" aria-label={T.next} disabled={offset + limit >= total} onClick={() => onChange(offset + limit, limit)}><CaretRightIcon size={16} aria-hidden="true" /></button>
    </div>
  );
}

/** A panel from the right edge (full screen on phones), on a native <dialog>. */
export function Drawer({ open = true, onClose, title, sub, children, footer, wide }: {
  open?: boolean; onClose: () => void; title: ReactNode; sub?: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const T = pick(KIT, FF.lang);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className={cx('kd-sheet kd-drawer m-0 ml-auto h-dvh max-h-none w-full max-w-none bg-carbon p-0 text-mist shadow-[inset_1px_0_0_var(--color-line2)]', wide ? 'tab:w-[760px]' : 'tab:w-[560px]')}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start gap-2 border-b border-line px-5 py-4">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h2 id={id} className="kd-h kd-ell">{title}</h2>
            {sub ? <p className="kd-s">{sub}</p> : null}
          </div>
          <button type="button" className="kd-ib kd-ib-sm" aria-label={T.close} onClick={onClose}><XIcon size={18} aria-hidden="true" /></button>
        </div>
        {/* Sections keep their height and the body scrolls: a flex child would shrink and overlap the next. */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 [&>*]:shrink-0">{children}</div>
        {footer ? <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3">{footer}</div> : null}
      </div>
    </dialog>
  );
}

/** A labelled field block for forms. */
export function Field({ label, hint, error, children, htmlFor }: { label: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={htmlFor} hint={hint}>{label}</FieldLabel>
      {children}
      {error ? <p role="alert" className="kd-s text-hot">{error}</p> : null}
    </div>
  );
}

// ---- search-as-you-type picker -------------------------------------------------------------

export interface PickItem { value: string; label: string; sub?: string }

/** A text field that searches as you type and offers matches below; picking one calls `onPick`. */
export function AsyncPick({ load, onPick, label, placeholder, value }: {
  load: (q: string) => Promise<PickItem[]>; onPick: (item: PickItem | null) => void; label: string; placeholder?: string; value?: PickItem | null;
}) {
  const T = pick(KIT, FF.lang);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PickItem[] | null>(null);
  const [at, setAt] = useState(0);
  const list = useId();
  // Closing waits for a click on an option to land; coming back to the field cancels it.
  const closing = useRef<ReturnType<typeof setTimeout>>(undefined);
  // The latest loader, so a parent passing a new function on each render does not search again.
  const loader = useRef(load);
  loader.current = load;
  useEffect(() => {
    if (!open) return;
    let live = true;
    setItems(null);
    const t = setTimeout(() => { loader.current(q.trim()).then((r) => { if (live) { setItems(r); setAt(0); } }, () => { if (live) setItems([]); }); }, 200);
    return () => { live = false; clearTimeout(t); };
  }, [q, open]);
  const choose = (i: PickItem) => { onPick(i); setQ(''); setOpen(false); };
  if (value) {
    return (
      <div className="kd-field justify-between gap-2">
        <span className="kd-ell text-sm text-paper">{value.label}{value.sub ? <span className="kd-s"> · {value.sub}</span> : null}</span>
        <button type="button" className="kd-ib kd-ib-sm" aria-label={T.reset + ': ' + label} onClick={() => onPick(null)}><XIcon size={14} aria-hidden="true" /></button>
      </div>
    );
  }
  return (
    <div className="relative">
      <Input
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={list}
        aria-autocomplete="list"
        placeholder={placeholder ?? label}
        value={q}
        onFocus={() => { clearTimeout(closing.current); setOpen(true); }}
        onClick={() => setOpen(true)}
        onBlur={() => { closing.current = setTimeout(() => setOpen(false), 150); }}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onKeyDown={(e) => {
          if (!items?.length) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setAt((a) => Math.min(items.length - 1, a + 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setAt((a) => Math.max(0, a - 1)); }
          if (e.key === 'Enter') { e.preventDefault(); choose(items[at]); }
        }}
      />
      {open ? (
        <ul id={list} role="listbox" aria-label={label} className="kd-glass absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-lg p-1">
          {items === null ? <li className="kd-s px-3 py-2">{T.searching}</li>
            : !items.length ? <li className="kd-s px-3 py-2">{T.noMatch}</li>
            : items.map((i, n) => (
              <li key={i.value} role="option" aria-selected={n === at}>
                <button type="button" className={cx('flex w-full flex-col rounded-md px-3 py-2 text-left', n === at && 'bg-white/[0.07]')} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(i)}>
                  <span className="text-sm text-paper">{i.label}</span>
                  {i.sub ? <span className="kd-s text-xs">{i.sub}</span> : null}
                </button>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}

// ---- confirm --------------------------------------------------------------------------------

export interface Ask {
  title: string;
  body?: ReactNode;
  confirm?: string;
  danger?: boolean;
  /** 'optional' or 'required' shows a note field; its text comes back. */
  note?: 'optional' | 'required';
  noteLabel?: string;
}
type Answer = false | { note: string };
const AskCtx = createContext<((a: Ask) => Promise<Answer>) | null>(null);

/** `const ask = useAsk(); const ok = await ask({...}); if (ok) …ok.note` */
export function useAsk() {
  const v = useContext(AskCtx);
  if (!v) throw new Error('useAsk outside AskHost');
  return v;
}

export function AskHost({ lang, children }: { lang: Lang; children: ReactNode }) {
  const T = pick(KIT, lang);
  const [cur, setCur] = useState<(Ask & { resolve: (a: Answer) => void }) | null>(null);
  const [note, setNote] = useState('');
  const [miss, setMiss] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const ask = useCallback((a: Ask) => new Promise<Answer>((resolve) => { setNote(''); setMiss(false); setCur({ ...a, resolve }); }), []);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (cur && !d.open) d.showModal();
    if (!cur && d.open) d.close();
  }, [cur]);
  const done = (a: Answer) => { cur?.resolve(a); setCur(null); };
  return (
    <AskCtx.Provider value={ask}>
      {children}
      <dialog ref={ref} role="alertdialog" aria-labelledby={id} onCancel={(e) => { e.preventDefault(); done(false); }} className="kd-sheet m-auto w-[calc(100%-32px)] max-w-[440px] rounded-sheet bg-carbon p-0 text-mist shadow-[inset_0_0_0_1px_var(--color-line2)]">
        {cur ? (
          <form
            className="flex flex-col gap-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (cur.note === 'required' && !note.trim()) { setMiss(true); return; }
              done({ note: note.trim() });
            }}
          >
            <h2 id={id} className="kd-h">{cur.title}</h2>
            {cur.body ? <div className="kd-s">{cur.body}</div> : null}
            {cur.note ? (
              <Field label={cur.noteLabel ?? T.note} error={miss ? T.noteNeeded : null}>
                <TextArea rows={3} value={note} aria-label={cur.noteLabel ?? T.note} onChange={(e) => { setNote(e.target.value); setMiss(false); }} />
              </Field>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => done(false)}>{T.cancel}</Button>
              <button type="submit" className={cx('kd-btn', cur.danger ? 'kd-btn-danger' : 'kd-btn-acc')}>{cur.confirm ?? T.confirm}</button>
            </div>
          </form>
        ) : null}
      </dialog>
    </AskCtx.Provider>
  );
}

/** Runs an action, toasts its message or its error, and says whether it went through. */
export async function act(kd: { toast: (t: string) => void }, lang: Lang, run: () => Promise<any>): Promise<any> {
  try {
    const out = await run();
    if (out && typeof out === 'object' && out.message) kd.toast(FF.text(out.message, lang));
    return out ?? true;
  } catch (e) {
    kd.toast(FF.errorText(e, lang));
    return false;
  }
}
