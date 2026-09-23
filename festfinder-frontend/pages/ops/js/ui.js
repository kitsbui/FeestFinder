/*
 * The Ops component kit: Midnight Glass controls built for data entry. Enumerations are
 * always picked (Select, FilterSelect, Combobox), money and times have their own inputs,
 * and every list view shares one table, one filter bar and one drawer.
 */
import {
  h, Fragment, useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect,
  t, tx, cx, fold, money, num, initials, on, emit, api, errorText, options,
} from './core.js';

const { createPortal } = window.ReactDOM;

// ---- icons and small pieces -----------------------------------------------------------

export const Icon = (name, fill, cls) => h('i', { className: cx(fill ? 'ph-fill' : 'ph-bold', `ph-${name}`, cls), 'aria-hidden': true });

export function Button({ variant = 'ghost', size, icon, iconRight, busy, disabled, onClick, type = 'button', title, children, className, href, ...rest }) {
  const cls = cx('op-btn', `op-btn--${variant}`, size && `op-btn--${size}`, !children && 'op-btn--icon', variant === 'cta' && 'ff-cta', variant === 'ghost' && 'ff-ghost', busy && 'is-busy', className);
  const inner = [busy ? h('span', { key: 's', className: 'op-spin' }) : icon ? h(Fragment, { key: 'i' }, Icon(icon)) : null, children != null ? h('span', { key: 'c' }, children) : null, iconRight ? h(Fragment, { key: 'r' }, Icon(iconRight)) : null];
  if (href) return h('a', { className: cls, href, title, 'aria-label': title, target: rest.target, rel: rest.target ? 'noopener noreferrer' : undefined, onClick }, ...inner);
  return h('button', { type, className: cls, disabled: disabled || busy, onClick, title, 'aria-label': !children ? title : undefined, ...rest }, ...inner);
}

export function Pill({ tone = 'neutral', icon, children, title, className }) {
  return h('span', { className: cx('op-pill', `op-pill--${tone}`, className), title }, icon ? Icon(icon, true) : null, children);
}

const STATUS_TONE = { draft: 'neutral', in_review: 'warn', live: 'ok', rejected: 'danger', removed: 'danger', cancelled: 'muted' };
const STATUS_ICON = { draft: 'pencil-simple', in_review: 'hourglass-medium', live: 'broadcast', rejected: 'arrow-u-up-left', removed: 'prohibit', cancelled: 'x-circle' };
export function StatusPill({ status, label }) {
  const opt = options()?.statuses.find((s) => s.value === status);
  return h(Pill, { tone: STATUS_TONE[status] ?? 'neutral', icon: STATUS_ICON[status] }, label ? tx(label) : opt ? tx(opt.label) : status);
}

/** An image that falls back quietly when its URL does not load (dead links in old data, a CDN outage). */
export function Img({ src, fallback = null, ...rest }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  if (!src || broken) return fallback;
  return h('img', { src, alt: '', loading: 'lazy', onError: () => setBroken(true), ...rest });
}

export function Avatar({ name, src, art, size = 32, square }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38), borderRadius: square ? Math.round(size * 0.28) : '50%', background: art || 'linear-gradient(135deg,#3159D6,#7A55F6)' };
  return h('span', { className: 'op-avatar', style }, h(Img, { src, fallback: initials(name) }));
}

/** Event art: the cover when there is one, the organiser's gradient otherwise. */
export function Thumb({ src, art, title, w = 56, ratio = 16 / 9 }) {
  return h('span', { className: 'op-thumb ff-art ff-art--flat', style: { width: w, height: Math.round(w / ratio), background: art || 'linear-gradient(135deg,#1B6BD6,#8C6BFF)' } },
    h(Img, { src, fallback: h('span', null, initials(title)) }));
}

export const Spinner = ({ label }) => h('div', { className: 'op-loading', role: 'status' }, h('span', { className: 'op-spin' }), label ?? t('Đang tải…', 'Loading…'));

export function Skeleton({ rows = 6 }) {
  return h('div', { className: 'op-skel', 'aria-hidden': true }, Array.from({ length: rows }, (_, i) => h('div', { key: i, className: 'op-skel-row', style: { '--i': i } })));
}

export function Empty({ icon = 'tray', title, body, action }) {
  return h('div', { className: 'op-empty' }, h('div', { className: 'op-empty-icon' }, Icon(icon)), h('div', { className: 'op-empty-title' }, title), body ? h('div', { className: 'op-empty-body' }, body) : null, action ?? null);
}

export function ErrorBox({ error, onRetry }) {
  return h('div', { className: 'op-error', role: 'alert' }, Icon('warning-circle', true), h('span', null, errorText(error)), onRetry ? h(Button, { size: 'sm', onClick: () => onRetry() }, t('Thử lại', 'Retry')) : null);
}

export function PageHeader({ eyebrow, title, sub, actions, back }) {
  return h('header', { className: 'op-page-head' },
    h('div', { className: 'op-page-head-text' },
      back ? h('a', { className: 'op-back', href: back.href, onClick: back.onClick }, Icon('caret-left'), back.label) : null,
      eyebrow ? h('div', { className: 'ff-eyebrow op-eyebrow' }, eyebrow) : null,
      h('h1', { className: 'op-title ff-skywash' }, title),
      sub ? h('p', { className: 'op-sub' }, sub) : null),
    actions ? h('div', { className: 'op-page-actions' }, actions) : null);
}

export function Card({ title, icon, actions, children, className, pad = true, sub }) {
  return h('section', { className: cx('op-card', !pad && 'op-card--flush', className) },
    title ? h('div', { className: 'op-card-head' },
      h('div', { className: 'op-card-title' }, icon ? Icon(icon) : null, h('span', null, title), sub ? h('span', { className: 'op-card-sub' }, sub) : null),
      actions ? h('div', { className: 'op-card-actions' }, actions) : null) : null,
    h('div', { className: 'op-card-body' }, children));
}

export function Stat({ label, value, note, tone, icon, onClick, href, active }) {
  const Tag = href ? 'a' : onClick ? 'button' : 'div';
  return h(Tag, { className: cx('op-stat ff-spot', tone && `op-stat--${tone}`, (onClick || href) && 'is-link', active && 'is-active'), href, onClick, type: Tag === 'button' ? 'button' : undefined },
    h('div', { className: 'op-stat-label' }, icon ? Icon(icon) : null, label),
    h('div', { className: 'op-stat-value ff-num' }, value),
    note ? h('div', { className: 'op-stat-note' }, note) : null);
}

/** Label / value pairs in a two-column grid. */
export function KV({ items, cols = 2 }) {
  return h('dl', { className: 'op-kv', style: { '--cols': cols } }, items.filter(Boolean).map(([k, v, wide], i) =>
    h('div', { key: i, className: cx('op-kv-item', wide && 'is-wide') }, h('dt', null, k), h('dd', null, v ?? '—'))));
}

export function Tabs({ value, onChange, items }) {
  return h('div', { className: 'op-tabs', role: 'tablist' }, items.map((it) =>
    h('button', { key: it.value, type: 'button', role: 'tab', 'aria-selected': value === it.value, className: cx('op-tab', value === it.value && 'is-on'), onClick: () => onChange(it.value) },
      it.icon ? Icon(it.icon) : null, it.label, it.count != null ? h('span', { className: cx('op-count', it.alert && it.count ? 'is-alert' : '') }, num(it.count)) : null)));
}

export function Meter({ value, max = 100, tone }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return h('span', { className: cx('op-meter', tone && `op-meter--${tone}`) }, h('span', { style: { width: pct + '%' } }));
}

/** The listing quality score as a ring: strong ≥ 85, passable ≥ 60. */
export function QualityRing({ score, size = 64 }) {
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  const tone = s >= 85 ? 'ok' : s >= 60 ? 'warn' : 'danger';
  const r = 26, c = 2 * Math.PI * r;
  return h('span', { className: cx('op-ring', `op-ring--${tone}`), style: { width: size, height: size } },
    h('svg', { viewBox: '0 0 64 64', width: size, height: size, 'aria-hidden': true },
      h('circle', { cx: 32, cy: 32, r, className: 'op-ring-track' }),
      s > 0 ? h('circle', { cx: 32, cy: 32, r, className: 'op-ring-fill', strokeDasharray: `${(c * s) / 100} ${c}` }) : null),
    h('span', { className: 'op-ring-value ff-num' }, s));
}

// ---- form controls -------------------------------------------------------------------------

let uid = 0;
export const useId = (prefix = 'op') => useMemo(() => `${prefix}-${++uid}`, []);

export function Field({ label, required, optional, hint, error, counter, children, id, className, aside }) {
  return h('div', { className: cx('op-field', error && 'has-error', className) },
    label ? h('div', { className: 'op-field-top' },
      h('label', { className: 'op-label', htmlFor: id }, label, required ? h('span', { className: 'op-req', title: t('Bắt buộc', 'Required') }, '*') : null,
        optional ? h('span', { className: 'op-opt' }, t('Không bắt buộc', 'Optional')) : null),
      counter || aside ? h('span', { className: 'op-field-aside' }, aside ?? null, counter ? h('span', { className: cx('op-counter ff-num', counter[0] > counter[1] && 'is-over') }, `${counter[0]}/${counter[1]}`) : null) : null) : null,
    children,
    error ? h('div', { className: 'op-field-error', role: 'alert' }, Icon('warning-circle', true), error) : hint ? h('div', { className: 'op-hint' }, hint) : null);
}

export function Input({ value, onChange, icon, suffix, className, invalid, ...rest }) {
  const input = h('input', { className: cx('op-input', icon && 'has-icon', suffix && 'has-suffix', invalid && 'is-invalid', className), value: value ?? '', onChange: (e) => onChange?.(e.target.value, e), ...rest });
  if (!icon && !suffix) return input;
  return h('div', { className: 'op-input-wrap' }, icon ? h('span', { className: 'op-input-icon' }, Icon(icon)) : null, input, suffix ? h('span', { className: 'op-input-suffix' }, suffix) : null);
}

export function TextArea({ value, onChange, rows = 4, className, invalid, ...rest }) {
  return h('textarea', { className: cx('op-input op-textarea', invalid && 'is-invalid', className), rows, value: value ?? '', onChange: (e) => onChange?.(e.target.value, e), ...rest });
}

/**
 * A native select, styled: the right control for short fixed lists (status, age, role) —
 * keyboard, screen readers and phones all handle it natively. Options may carry `group`.
 */
export function Select({ value, onChange, options: opts, placeholder, className, invalid, id, disabled, ...rest }) {
  const groups = [];
  for (const o of opts) {
    const g = o.group ?? '';
    let bucket = groups.find((x) => x.name === g);
    if (!bucket) groups.push((bucket = { name: g, items: [] }));
    bucket.items.push(o);
  }
  const optionEl = (o) => h('option', { key: String(o.value), value: o.value ?? '', disabled: o.disabled }, o.label);
  return h('div', { className: cx('op-select', invalid && 'is-invalid', className) },
    h('select', { id, value: value ?? '', disabled, onChange: (e) => onChange?.(e.target.value, e), ...rest },
      placeholder !== undefined ? h('option', { value: '' }, placeholder) : null,
      groups.map((g) => (g.name ? h('optgroup', { key: g.name, label: g.name }, g.items.map(optionEl)) : g.items.map(optionEl)))),
    Icon('caret-down', false, 'op-select-caret'));
}

export function Segmented({ value, onChange, options: opts, size, ariaLabel }) {
  return h('div', { className: cx('op-seg', size && `op-seg--${size}`), role: 'radiogroup', 'aria-label': ariaLabel },
    opts.map((o) => h('button', { key: o.value, type: 'button', role: 'radio', 'aria-checked': value === o.value, className: cx('op-seg-item', value === o.value && 'is-on'), onClick: () => onChange(o.value), title: o.hint },
      o.icon ? Icon(o.icon) : null, o.label)));
}

/** Big radio cards for a choice that changes the rest of the form (entry mode, organiser type). */
export function RadioCards({ value, onChange, options: opts, cols = 3 }) {
  return h('div', { className: 'op-radio-cards', role: 'radiogroup', style: { '--cols': cols } },
    opts.map((o) => h('button', { key: o.value, type: 'button', role: 'radio', 'aria-checked': value === o.value, className: cx('op-radio-card ff-spot', value === o.value && 'is-on'), onClick: () => onChange(o.value) },
      h('span', { className: 'op-radio-dot' }),
      o.icon ? h('span', { className: 'op-radio-icon' }, Icon(o.icon)) : null,
      h('span', { className: 'op-radio-label' }, o.label),
      o.hint ? h('span', { className: 'op-radio-hint' }, o.hint) : null)));
}

export function Switch({ checked, onChange, label, hint, disabled }) {
  return h('label', { className: cx('op-switch', disabled && 'is-disabled') },
    h('input', { type: 'checkbox', checked: !!checked, disabled, onChange: (e) => onChange(e.target.checked) }),
    h('span', { className: 'op-switch-track' }, h('span', { className: 'op-switch-knob' })),
    label ? h('span', { className: 'op-switch-text' }, h('span', null, label), hint ? h('small', null, hint) : null) : null);
}

export function Checkbox({ checked, onChange, label, indeterminate, disabled, title }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate; }, [indeterminate]);
  return h('label', { className: cx('op-check', disabled && 'is-disabled'), title, 'data-stop': true, onClick: (e) => e.stopPropagation() },
    h('input', { ref, type: 'checkbox', checked: !!checked, disabled, onChange: (e) => onChange(e.target.checked) }),
    h('span', { className: 'op-check-box' }, Icon(indeterminate ? 'minus' : 'check')),
    label ? h('span', null, label) : null);
}

/** Money in whole đồng: typed with separators, stored as an integer; quick picks underneath. */
export function MoneyInput({ value, onChange, presets = [], invalid, id, placeholder }) {
  const [text, setText] = useState(value ? num(value) : '');
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setText(value ? num(value) : ''); }, [value]);
  return h('div', { className: 'op-money' },
    h(Input, {
      id, inputMode: 'numeric', value: text, invalid, placeholder: placeholder ?? '0', suffix: '₫',
      onFocus: () => { focused.current = true; }, onBlur: () => { focused.current = false; setText(value ? num(value) : ''); },
      onChange: (v) => { const digits = v.replace(/\D/g, '').slice(0, 11); setText(digits ? num(Number(digits)) : ''); onChange(digits ? Number(digits) : 0); },
    }),
    presets.length ? h('div', { className: 'op-quick' }, presets.map((p) => h('button', { key: p, type: 'button', className: cx('op-chip', value === p && 'is-on'), onClick: () => onChange(p) }, moneyLabel(p)))) : null);
}
const moneyLabel = (n) => (n >= 1e6 ? `${(n / 1e6).toString().replace('.', ',')}tr` : `${Math.round(n / 1e3)}k`);

/** Every quarter hour, so times are picked, not typed; a value off the grid is kept as its own option. */
export const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`);
export function TimeSelect({ value, onChange, placeholder, invalid, id, after }) {
  const list = value && !TIME_OPTIONS.includes(value) ? [...TIME_OPTIONS, value].sort() : TIME_OPTIONS;
  const note = (tm) => (after && tm <= after && tm !== '' ? ` ${t('(hôm sau)', '(next day)')}` : '');
  return h(Select, { id, value, invalid, onChange, placeholder: placeholder ?? '--:--', options: list.map((tm) => ({ value: tm, label: tm + note(tm) })) });
}

export function DateInput({ value, onChange, min, max, invalid, id }) {
  return h('input', { id, type: 'date', className: cx('op-input op-date', invalid && 'is-invalid'), value: value ?? '', min, max, onChange: (e) => onChange(e.target.value || null) });
}

// ---- anchored popovers ------------------------------------------------------------------------

/** Keeps a floating panel under (or above) its anchor, with position: fixed so no container clips it. */
function useAnchored(open, anchorRef, { width, minWidth = 220, maxHeight = 360, align = 'left' } = {}) {
  const [style, setStyle] = useState(null);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const w = width === 'anchor' ? r.width : Math.max(minWidth, width ?? r.width);
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      const up = below < Math.min(maxHeight, 240) && above > below;
      let left = align === 'right' ? r.right - w : r.left;
      left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
      setStyle({ position: 'fixed', left, width: w, maxHeight: Math.min(maxHeight, up ? above : below), ...(up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }) });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open, width, minWidth, maxHeight, align]);
  return style;
}

function useOutside(open, refs, close) {
  useEffect(() => {
    if (!open) return;
    const down = (e) => { if (!refs.some((r) => r.current && r.current.contains(e.target))) close(); };
    const key = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', down, true);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down, true); document.removeEventListener('keydown', key); };
  }, [open]);
}

/** A button that opens a small menu of actions (row "…" menus, "More"). */
export function Menu({ trigger, items, align = 'right', label }) {
  const [open, setOpen] = useState(false);
  const btn = useRef(null), panel = useRef(null);
  const style = useAnchored(open, btn, { width: 230, align });
  useOutside(open, [btn, panel], () => setOpen(false));
  const list = items.filter(Boolean);
  return h(Fragment, null,
    h('span', { ref: btn, className: 'op-menu-anchor', 'data-stop': true, onClick: (e) => { e.stopPropagation(); setOpen((o) => !o); } }, trigger ?? h(Button, { variant: 'quiet', size: 'sm', icon: 'dots-three', title: label ?? t('Thao tác', 'Actions') })),
    open && style ? createPortal(h('div', { ref: panel, className: 'op-pop op-menu', style, role: 'menu' },
      list.map((it, i) => it === '-' ? h('div', { key: i, className: 'op-menu-sep' }) :
        h('button', { key: i, type: 'button', role: 'menuitem', className: cx('op-menu-item', it.tone && `is-${it.tone}`), disabled: it.disabled, title: it.title,
          onClick: (e) => { e.stopPropagation(); setOpen(false); it.onClick?.(); } }, it.icon ? Icon(it.icon) : null, h('span', null, it.label), it.hint ? h('small', null, it.hint) : null))), document.body) : null);
}

/**
 * A filter chip that opens a checklist: "Genre: EDM +1 ▾". Multi-select filters take an
 * array; single ones a string. Long lists get a search box; options can show counts.
 */
export function FilterSelect({ label, icon, value, onChange, options: opts, multi, search, allLabel, width = 260 }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const btn = useRef(null), panel = useRef(null);
  const style = useAnchored(open, btn, { width, maxHeight: 420 });
  useOutside(open, [btn, panel], () => setOpen(false));
  const values = multi ? (Array.isArray(value) ? value : value ? String(value).split(',') : []) : value ? [value] : [];
  const chosen = opts.filter((o) => values.includes(String(o.value)));
  const showSearch = search ?? opts.length > 8;
  const list = q ? opts.filter((o) => fold(`${o.label} ${o.group ?? ''}`).includes(fold(q))) : opts;
  const toggle = (v) => {
    v = String(v);
    if (!multi) { onChange(values[0] === v ? '' : v); setOpen(false); return; }
    const next = values.includes(v) ? values.filter((x) => x !== v) : [...values, v];
    onChange(next);
  };
  let lastGroup = null;
  return h(Fragment, null,
    h('button', { ref: btn, type: 'button', className: cx('op-filter', chosen.length && 'is-set', open && 'is-open'), 'aria-haspopup': 'listbox', 'aria-expanded': open, onClick: () => { setOpen((o) => !o); setQ(''); } },
      icon ? Icon(icon) : null,
      h('span', { className: 'op-filter-label' }, label),
      chosen.length ? h('span', { className: 'op-filter-value' }, chosen[0].short ?? chosen[0].label) : null,
      chosen.length > 1 ? h('span', { className: 'op-filter-more' }, `+${chosen.length - 1}`) : null,
      Icon('caret-down', false, 'op-filter-caret')),
    open && style ? createPortal(h('div', { ref: panel, className: 'op-pop op-filter-pop', style, role: 'listbox', 'aria-multiselectable': !!multi },
      showSearch ? h('div', { className: 'op-pop-search' }, Icon('magnifying-glass'), h('input', { autoFocus: true, value: q, placeholder: t('Tìm trong danh sách…', 'Search the list…'), onChange: (e) => setQ(e.target.value) })) : null,
      h('div', { className: 'op-pop-list' },
        !multi && allLabel ? h('button', { type: 'button', className: cx('op-opt-row', !values.length && 'is-on'), onClick: () => { onChange(''); setOpen(false); } }, h('span', { className: 'op-opt-mark' }, !values.length ? Icon('check') : null), h('span', { className: 'op-opt-text' }, allLabel)) : null,
        list.length ? list.map((o) => {
          const head = o.group && o.group !== lastGroup ? h('div', { key: 'g-' + o.group, className: 'op-opt-group' }, o.group) : null;
          lastGroup = o.group ?? lastGroup;
          const on = values.includes(String(o.value));
          return h(Fragment, { key: String(o.value) }, head,
            h('button', { type: 'button', role: 'option', 'aria-selected': on, className: cx('op-opt-row', on && 'is-on'), onClick: () => toggle(o.value) },
              h('span', { className: cx('op-opt-mark', multi && 'is-box') }, on ? Icon('check') : null),
              o.dot ? h('span', { className: 'op-dot', style: { background: o.dot } }) : null,
              h('span', { className: 'op-opt-text' }, o.label, o.hint ? h('small', null, o.hint) : null),
              o.count != null ? h('span', { className: 'op-opt-count ff-num' }, num(o.count)) : null));
        }) : h('div', { className: 'op-pop-empty' }, t('Không có lựa chọn phù hợp', 'Nothing matches'))),
      multi || values.length ? h('div', { className: 'op-pop-foot' },
        h('button', { type: 'button', className: 'op-link', disabled: !values.length, onClick: () => onChange(multi ? [] : '') }, t('Bỏ chọn', 'Clear')),
        multi ? h(Button, { size: 'sm', onClick: () => setOpen(false) }, t('Xong', 'Done')) : null) : null), document.body) : null);
}

/**
 * Searchable single choice for long or growing lists (organisers, venues, districts, events).
 * Type to narrow — accents optional — and pick with the arrow keys and Enter. `load(q)` makes
 * it ask the server; `onCreate` adds a "Use “…”" row for a value that is not in the list yet.
 */
export function Combobox({ value, onChange, options: opts, load, valueLabel, placeholder, icon = 'magnifying-glass', onCreate, createLabel, invalid, id, disabled, clearable = true, emptyText, renderOption }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState(null);
  const [loading, setLoading] = useState(false);
  const wrap = useRef(null), panel = useRef(null), input = useRef(null);
  const style = useAnchored(open, wrap, { width: 'anchor', maxHeight: 340 });
  useOutside(open, [wrap, panel], () => { setOpen(false); setQ(''); });

  useEffect(() => {
    if (!open || !load) return;
    let live = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try { const out = await load(q); if (live) setRemote(out); } catch { if (live) setRemote([]); } finally { if (live) setLoading(false); }
    }, q ? 220 : 0);
    return () => { live = false; clearTimeout(timer); };
  }, [open, q]);

  const all = load ? remote ?? [] : opts ?? [];
  const list = load ? all : q ? all.filter((o) => fold(`${o.label} ${o.sub ?? ''} ${o.keywords ?? ''} ${o.group ?? ''}`).includes(fold(q))) : all;
  const exact = q && all.some((o) => fold(o.label) === fold(q));
  const rows = [...list.slice(0, 80), ...(onCreate && q.trim() && !exact ? [{ __create: true, value: '__create', label: q.trim() }] : [])];
  const selected = (opts ?? []).find((o) => String(o.value) === String(value)) ?? (remote ?? []).find((o) => String(o.value) === String(value));
  const shown = open ? q : selected?.label ?? valueLabel ?? (value && !load ? String(value) : '');

  const choose = (o) => {
    if (!o) return;
    if (o.__create) onCreate(o.label);
    else onChange(o.value, o);
    setOpen(false);
    setQ('');
    input.current?.blur();
  };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(rows.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { if (open && rows[active]) { e.preventDefault(); choose(rows[active]); } }
    else if (e.key === 'Escape') { setOpen(false); setQ(''); }
    else if (e.key === 'Tab') { setOpen(false); setQ(''); }
  };
  useEffect(() => {
    const el = panel.current?.querySelector('.is-active');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [active]);

  let lastGroup = null;
  return h('div', { ref: wrap, className: cx('op-combo', open && 'is-open', invalid && 'is-invalid', disabled && 'is-disabled') },
    h('span', { className: 'op-input-icon' }, Icon(icon)),
    h('input', {
      ref: input, id, className: 'op-input has-icon has-suffix', value: shown, placeholder: selected || valueLabel ? '' : placeholder, disabled,
      role: 'combobox', 'aria-expanded': open, 'aria-autocomplete': 'list', autoComplete: 'off',
      onFocus: () => { setOpen(true); setActive(0); }, onChange: (e) => { setQ(e.target.value); setOpen(true); setActive(0); }, onKeyDown: onKey,
    }),
    clearable && value && !disabled ? h('button', { type: 'button', className: 'op-combo-clear', title: t('Xoá lựa chọn', 'Clear'), onClick: () => { onChange(null, null); setQ(''); } }, Icon('x')) : h('span', { className: 'op-combo-caret' }, Icon('caret-down')),
    open && style ? createPortal(h('div', { ref: panel, className: 'op-pop op-combo-pop', style, role: 'listbox' },
      loading && !rows.length ? h('div', { className: 'op-pop-empty' }, h('span', { className: 'op-spin' }), t('Đang tìm…', 'Searching…')) : null,
      !loading && !rows.length ? h('div', { className: 'op-pop-empty' }, emptyText ?? t('Không tìm thấy', 'No matches')) : null,
      rows.map((o, i) => {
        const head = o.group && o.group !== lastGroup ? h('div', { key: 'g-' + o.group + i, className: 'op-opt-group' }, o.group) : null;
        lastGroup = o.group ?? lastGroup;
        return h(Fragment, { key: String(o.value) + i }, head,
          h('button', {
            type: 'button', role: 'option', 'aria-selected': String(o.value) === String(value),
            className: cx('op-opt-row', i === active && 'is-active', String(o.value) === String(value) && 'is-on', o.__create && 'is-create'),
            onMouseEnter: () => setActive(i), onMouseDown: (e) => e.preventDefault(), onClick: () => choose(o),
          }, o.__create
            ? h(Fragment, null, h('span', { className: 'op-opt-mark' }, Icon('plus')), h('span', { className: 'op-opt-text' }, (createLabel ?? t('Dùng “{q}”', 'Use “{q}”')).replace('{q}', o.label)))
            : renderOption ? renderOption(o) : h(Fragment, null,
              h('span', { className: 'op-opt-mark' }, String(o.value) === String(value) ? Icon('check') : null),
              o.avatar ?? null,
              h('span', { className: 'op-opt-text' }, o.label, o.sub ? h('small', null, o.sub) : null),
              o.badge ?? null)));
      })), document.body) : null);
}

/** Tags typed or picked: artists in a lineup, areas on a campaign. Enter or comma adds; paste a list to add many. */
export function ChipsInput({ value = [], onChange, suggest, placeholder, max = 80, invalid, id }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [found, setFound] = useState([]);
  const wrap = useRef(null), panel = useRef(null);
  const style = useAnchored(open && found.length > 0, wrap, { width: 'anchor', maxHeight: 280 });
  useOutside(open, [wrap, panel], () => setOpen(false));
  useEffect(() => {
    if (!suggest || !open) return;
    let live = true;
    const timer = setTimeout(async () => {
      const out = await suggest(q).catch(() => []);
      if (live) setFound(out.filter((s) => !value.some((v) => fold(v) === fold(s.value))).slice(0, 8));
    }, 180);
    return () => { live = false; clearTimeout(timer); };
  }, [q, open, value.length]);
  const add = (items) => {
    const next = [...value];
    for (const raw of items) {
      const v = raw.trim().replace(/\s+/g, ' ');
      if (v && !next.some((x) => fold(x) === fold(v)) && next.length < max) next.push(v);
    }
    onChange(next);
    setQ('');
    setActive(0);
  };
  const onKey = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && (q.trim() || found[active])) {
      e.preventDefault();
      add([open && found[active] && (!q.trim() || fold(found[active].value).startsWith(fold(q.trim()))) ? found[active].value : q]);
    } else if (e.key === 'Backspace' && !q && value.length) onChange(value.slice(0, -1));
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(found.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
  };
  const move = (i, d) => { const next = [...value]; const j = i + d; if (j < 0 || j >= next.length) return; [next[i], next[j]] = [next[j], next[i]]; onChange(next); };
  return h('div', { ref: wrap, className: cx('op-chips', invalid && 'is-invalid'), onClick: () => wrap.current.querySelector('input')?.focus() },
    value.map((v, i) => h('span', { key: v, className: 'op-tag' },
      i > 0 ? h('button', { type: 'button', className: 'op-tag-move', title: t('Lên trước', 'Move earlier'), onClick: (e) => { e.stopPropagation(); move(i, -1); } }, Icon('caret-left')) : null,
      h('span', null, v),
      h('button', { type: 'button', className: 'op-tag-x', title: t('Bỏ', 'Remove'), onClick: (e) => { e.stopPropagation(); onChange(value.filter((x) => x !== v)); } }, Icon('x')))),
    h('input', {
      id, value: q, placeholder: value.length ? '' : placeholder, onFocus: () => setOpen(true),
      onChange: (e) => { setQ(e.target.value); setOpen(true); setActive(0); }, onKeyDown: onKey,
      onPaste: (e) => { const text = e.clipboardData.getData('text'); if (/[,\n;]/.test(text)) { e.preventDefault(); add(text.split(/[,\n;]/)); } },
      onBlur: () => { if (q.trim()) add([q]); },
    }),
    style ? createPortal(h('div', { ref: panel, className: 'op-pop op-combo-pop', style },
      found.map((s, i) => h('button', { key: s.value, type: 'button', className: cx('op-opt-row', i === active && 'is-active'), onMouseDown: (e) => e.preventDefault(), onClick: () => add([s.value]) },
        h('span', { className: 'op-opt-mark' }, Icon('plus')), h('span', { className: 'op-opt-text' }, s.value, s.sub ? h('small', null, s.sub) : null)))), document.body) : null);
}

// ---- uploads ------------------------------------------------------------------------------

const RULES = {
  cover: { min: [1600, 900], ratio: 16 / 9, text: () => t('Ảnh ngang 16:9, tối thiểu 1600×900, JPG/PNG/WebP, tối đa 8 MB', 'Landscape 16:9, at least 1600×900, JPG/PNG/WebP, up to 8 MB') },
  logo: { min: [256, 256], text: () => t('PNG/SVG nền trong, tối thiểu 256×256', 'PNG on a transparent background, at least 256×256') },
  avatar: { min: [128, 128], text: () => t('Tối thiểu 128×128', 'At least 128×128') },
};
async function imageSize(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((ok, bad) => { img.onload = ok; img.onerror = bad; img.src = url; });
    return [img.naturalWidth, img.naturalHeight];
  } finally { URL.revokeObjectURL(url); }
}

/** Drop or pick an image. Size and shape are checked before anything is sent. */
export function Uploader({ purpose = 'cover', value, onChange, compact }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [drag, setDrag] = useState(false);
  const input = useRef(null);
  const rule = RULES[purpose];
  const take = async (file) => {
    setErr(null);
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setErr(t('Chỉ nhận ảnh PNG, JPEG hoặc WebP', 'Use a PNG, JPEG or WebP image'));
    if (file.size > 8 * 1024 * 1024) return setErr(t('Ảnh tối đa 8 MB', 'Images can be up to 8 MB'));
    try {
      const [w, hgt] = await imageSize(file);
      if (w < rule.min[0] || hgt < rule.min[1]) return setErr(t(`Ảnh ${w}×${hgt} nhỏ hơn mức tối thiểu ${rule.min.join('×')}`, `This image is ${w}×${hgt}; the minimum is ${rule.min.join('×')}`));
      if (rule.ratio && Math.abs(w / hgt - rule.ratio) > 0.01) return setErr(t(`Ảnh ${w}×${hgt} chưa đúng tỉ lệ 16:9 — hãy cắt lại (vd 1600×900, 1920×1080)`, `This image is ${w}×${hgt}, not 16:9 — crop it to e.g. 1600×900 or 1920×1080`));
    } catch { return setErr(t('Không đọc được ảnh này', 'Could not read this image')); }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const out = await api('POST', `/uploads?purpose=${purpose}`, fd);
      onChange(out.url);
    } catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
  };
  return h('div', { className: cx('op-upload', `op-upload--${purpose}`, compact && 'is-compact') },
    value
      ? h('div', { className: 'op-upload-preview' },
        h(Img, { src: value, fallback: h('div', { className: 'op-upload-missing' }, Icon('image-broken'), t('Không tải được ảnh — hãy tải lại', 'The image does not load — upload it again')) }),
        h('div', { className: 'op-upload-actions' },
          h(Button, { size: 'sm', icon: 'upload-simple', busy, onClick: () => input.current.click() }, t('Đổi ảnh', 'Replace')),
          h(Button, { size: 'sm', variant: 'quiet', icon: 'trash', onClick: () => onChange(null) }, t('Xoá', 'Remove'))))
      : h('button', {
        type: 'button', className: cx('op-drop', drag && 'is-drag'), onClick: () => input.current.click(),
        onDragOver: (e) => { e.preventDefault(); setDrag(true); }, onDragLeave: () => setDrag(false),
        onDrop: (e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files[0]); },
      }, busy ? h('span', { className: 'op-spin' }) : Icon(purpose === 'logo' ? 'seal' : 'image'),
        h('span', { className: 'op-drop-title' }, busy ? t('Đang tải lên…', 'Uploading…') : t('Kéo ảnh vào đây hoặc bấm để chọn', 'Drop an image here or click to choose')),
        h('span', { className: 'op-drop-hint' }, rule.text())),
    h('input', { ref: input, type: 'file', accept: 'image/png,image/jpeg,image/webp', hidden: true, onChange: (e) => { take(e.target.files[0]); e.target.value = ''; } }),
    err ? h('div', { className: 'op-field-error', role: 'alert' }, Icon('warning-circle', true), err) : null);
}

// ---- lists ------------------------------------------------------------------------------------

/** The bar above every list: a search box, filter chips, a reset link and a right-hand slot. */
export function FilterBar({ search, onSearch, placeholder, children, active = 0, onReset, right }) {
  const [text, setText] = useState(search ?? '');
  useEffect(() => { setText(search ?? ''); }, [search]);
  useEffect(() => {
    if ((search ?? '') === text) return;
    const timer = setTimeout(() => onSearch?.(text), 280);
    return () => clearTimeout(timer);
  }, [text]);
  return h('div', { className: 'op-filterbar' },
    onSearch ? h('div', { className: 'op-search' }, Icon('magnifying-glass'),
      h('input', { value: text, placeholder: placeholder ?? t('Tìm kiếm…', 'Search…'), onChange: (e) => setText(e.target.value), 'aria-label': placeholder }),
      text ? h('button', { type: 'button', className: 'op-search-x', onClick: () => { setText(''); onSearch(''); }, title: t('Xoá', 'Clear') }, Icon('x')) : null) : null,
    h('div', { className: 'op-filters' }, children,
      active > 0 && onReset ? h('button', { type: 'button', className: 'op-link op-reset', onClick: onReset }, Icon('arrow-counter-clockwise'), t(`Bỏ ${active} bộ lọc`, `Clear ${active} filter${active > 1 ? 's' : ''}`)) : null),
    right ? h('div', { className: 'op-filterbar-right' }, right) : null);
}

/**
 * One table for every list. Columns: {key, label, width, align, render(row), className}.
 * Clicking a row opens it unless the click was on a control inside the row.
 */
export function DataTable({ columns, rows, rowKey = (r) => r.id, onRowClick, selectable, selected = [], onSelect, loading, empty, activeKey, rowTone, minWidth = 860 }) {
  const allOn = selectable && rows.length > 0 && rows.every((r) => selected.includes(rowKey(r)));
  const someOn = selectable && rows.some((r) => selected.includes(rowKey(r)));
  return h('div', { className: cx('op-table-wrap', loading && 'is-loading') },
    h('table', { className: 'op-table', style: { minWidth } },
      h('thead', null, h('tr', null,
        selectable ? h('th', { className: 'op-col-check' }, h(Checkbox, { checked: allOn, indeterminate: !allOn && someOn, onChange: (v) => onSelect(v ? [...new Set([...selected, ...rows.map(rowKey)])] : selected.filter((k) => !rows.some((r) => rowKey(r) === k))), title: t('Chọn tất cả', 'Select all') })) : null,
        columns.map((c) => h('th', { key: c.key, style: { width: c.width, textAlign: c.align }, className: c.className }, c.label)))),
      h('tbody', null, rows.map((r, i) => {
        const key = rowKey(r);
        return h('tr', {
          key, className: cx(onRowClick && 'is-link', activeKey === key && 'is-active', selected.includes(key) && 'is-selected', rowTone?.(r)), style: { '--i': Math.min(i, 14) },
          onClick: onRowClick ? (e) => { if (e.target.closest('button,a,input,select,label,[data-stop]')) return; onRowClick(r, e); } : undefined,
        },
        selectable ? h('td', { className: 'op-col-check' }, h(Checkbox, { checked: selected.includes(key), onChange: (v) => onSelect(v ? [...selected, key] : selected.filter((k) => k !== key)) })) : null,
        columns.map((c) => h('td', { key: c.key, style: { textAlign: c.align }, className: c.className }, c.render ? c.render(r, i) : r[c.key] ?? '—')));
      }))),
    !loading && !rows.length ? empty ?? h(Empty, { title: t('Không có dữ liệu phù hợp', 'Nothing matches'), body: t('Thử bỏ bớt bộ lọc.', 'Try removing a filter.') }) : null,
    loading && !rows.length ? h(Skeleton, { rows: 8 }) : null);
}

export function Pagination({ offset, limit, total, onChange, onLimit }) {
  if (!total) return null;
  const from = offset + 1, to = Math.min(total, offset + limit);
  return h('div', { className: 'op-pager' },
    h('span', { className: 'op-pager-text ff-num' }, t(`${num(from)}–${num(to)} trên ${num(total)}`, `${num(from)}–${num(to)} of ${num(total)}`)),
    onLimit ? h(Select, { className: 'op-pager-size', value: String(limit), onChange: (v) => onLimit(Number(v)), options: [25, 50, 100].map((n) => ({ value: String(n), label: t(`${n} / trang`, `${n} per page`) })) }) : null,
    h(Button, { size: 'sm', icon: 'caret-left', disabled: offset <= 0, onClick: () => onChange(Math.max(0, offset - limit)), title: t('Trang trước', 'Previous page') }),
    h(Button, { size: 'sm', icon: 'caret-right', disabled: to >= total, onClick: () => onChange(offset + limit), title: t('Trang sau', 'Next page') }));
}

// ---- layers: drawer, modal, confirm, toasts -------------------------------------------------

function useEscape(open, close) {
  useEffect(() => {
    if (!open) return;
    const key = (e) => { if (e.key === 'Escape' && !document.querySelector('.op-pop')) close(); };
    document.addEventListener('keydown', key);
    document.body.classList.add('op-locked');
    return () => { document.removeEventListener('keydown', key); document.body.classList.remove('op-locked'); };
  }, [open]);
}

export function Drawer({ open, onClose, title, sub, width = 640, children, footer, head }) {
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(h('div', { className: 'op-layer' },
    h('div', { className: 'op-scrim', onClick: onClose }),
    h('aside', { className: 'op-drawer ff-deep', style: { width: `min(${width}px, 100vw)` }, role: 'dialog', 'aria-modal': true, 'aria-label': typeof title === 'string' ? title : undefined },
      h('div', { className: 'op-drawer-head' },
        h('div', { className: 'op-drawer-titles' }, head ?? null, h('h2', { className: 'op-drawer-title' }, title), sub ? h('div', { className: 'op-drawer-sub' }, sub) : null),
        h(Button, { variant: 'quiet', icon: 'x', onClick: onClose, title: t('Đóng (Esc)', 'Close (Esc)') })),
      h('div', { className: 'op-drawer-body' }, children),
      footer ? h('div', { className: 'op-drawer-foot' }, footer) : null)), document.body);
}

export function Modal({ open, onClose, title, children, footer, width = 520, tone }) {
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(h('div', { className: 'op-layer op-layer--center' },
    h('div', { className: 'op-scrim', onClick: onClose }),
    h('div', { className: cx('op-modal ff-deep ff-in', tone && `op-modal--${tone}`), style: { width: `min(${width}px, calc(100vw - 24px))` }, role: 'dialog', 'aria-modal': true },
      h('div', { className: 'op-modal-head' }, h('h2', null, title), h(Button, { variant: 'quiet', icon: 'x', onClick: onClose, title: t('Đóng', 'Close') })),
      h('div', { className: 'op-modal-body' }, children),
      footer ? h('div', { className: 'op-modal-foot' }, footer) : null)), document.body);
}

/** await confirm({title, body, confirm, tone}) → true when the person confirmed. */
export function confirm(opts) {
  return new Promise((resolve) => emit('confirm', { ...opts, resolve }));
}
export function ConfirmHost() {
  const [req, setReq] = useState(null);
  const [note, setNote] = useState('');
  useEffect(() => on('confirm', (r) => { setNote(''); setReq(r); }), []);
  if (!req) return null;
  const done = (ok) => { req.resolve(ok ? (req.withNote ? { note } : true) : false); setReq(null); };
  return h(Modal, {
    open: true, onClose: () => done(false), title: req.title, tone: req.tone, width: 460,
    footer: h(Fragment, null,
      h(Button, { onClick: () => done(false) }, req.cancel ?? t('Huỷ', 'Cancel')),
      h(Button, { variant: req.tone === 'danger' ? 'danger' : 'cta', onClick: () => done(true), autoFocus: true, disabled: req.withNote?.required && !note.trim() }, req.confirm ?? t('Xác nhận', 'Confirm'))),
  }, req.body ? h('div', { className: 'op-confirm-body' }, req.body) : null,
  req.withNote ? h(Field, { label: req.withNote.label, required: req.withNote.required }, h(TextArea, { rows: 3, value: note, onChange: setNote, placeholder: req.withNote.placeholder })) : null);
}

export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => on('toast', (tst) => {
    setItems((xs) => [...xs.slice(-3), tst]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== tst.id)), tst.tone === 'error' ? 6500 : 3800);
  }), []);
  return createPortal(h('div', { className: 'op-toasts', role: 'status', 'aria-live': 'polite' }, items.map((x) =>
    h('div', { key: x.id, className: cx('op-toast ff-deep', `is-${x.tone}`) }, Icon(x.tone === 'error' ? 'warning-circle' : 'check-circle', true), h('span', null, x.message)))), document.body);
}

/** Keyboard shortcuts for a screen; ignored while typing in a field. */
export function useKeys(map, deps = []) {
  useEffect(() => {
    const fn = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag) || e.target.isContentEditable) return;
      if (document.querySelector('.op-layer')) return;
      const handler = map[e.key.toLowerCase()];
      if (handler) { e.preventDefault(); handler(e); }
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, deps);
}

const MON_EN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
/** A small calendar leaf: month over day. */
export function DateBox({ iso, sub }) {
  const m = Number(String(iso).slice(5, 7));
  return h('div', { className: 'op-datebox' }, h('span', null, t(`TH ${m}`, MON_EN[m - 1])), h('strong', null, String(iso).slice(8, 10)), sub ? h('small', null, sub) : null);
}

export const External = ({ href: link, children }) => link ? h('a', { className: 'op-ext', href: link, target: '_blank', rel: 'noopener noreferrer', title: link }, children ?? link.replace(/^https?:\/\//, '').replace(/\/$/, ''), Icon('arrow-square-out')) : '—';
