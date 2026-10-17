'use client';
/**
 * Dropdown menus (README §4): near-opaque, one open at a time, closed by Escape, by a click
 * outside (a transparent scrim at the root of the page) or by choosing; arrow keys move
 * between items. The trigger carries aria-expanded.
 */
import { KdLink as Link } from '../link';
import {
  createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState,
  type CSSProperties, type KeyboardEvent, type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { CaretDownIcon, CheckIcon } from '@phosphor-icons/react/ssr';
import { cx } from '../cx';

const OPEN_EVENT = 'kd-menu-open';

interface TriggerProps {
  id: string;
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  'aria-controls'?: string;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  ref: (el: HTMLElement | null) => void;
}

const MenuCtx = createContext<{ close: () => void } | null>(null);

/** Where the scrim goes: the page's own box, so no ancestor's backdrop-filter clips a fixed layer. */
function rootOf(): Element | null {
  return typeof document === 'undefined' ? null : document.querySelector('ff-app') || document.body;
}

const items = (menu: HTMLElement | null) =>
  menu ? Array.from(menu.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"]):not(:disabled)')) : [];

export function Menu({ trigger, children, align = 'start', label, width, className, up, inline }: {
  trigger: (p: TriggerProps, open: boolean) => ReactNode;
  children: ReactNode;
  align?: 'start' | 'end';
  label: string;
  width?: number;
  className?: string;
  /** Open above the trigger (for controls at the bottom of the screen). */
  up?: boolean;
  /** The trigger flows inside a line of text (a heading word). */
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const focusOnOpen = useRef<'first' | 'last' | null>(null);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  // One menu open at a time.
  useEffect(() => {
    const other = (e: Event) => { if ((e as CustomEvent).detail !== id) setOpen(false); };
    window.addEventListener(OPEN_EVENT, other);
    return () => window.removeEventListener(OPEN_EVENT, other);
  }, [id]);

  // Inside a table the box would clip the menu: there it is placed against the window instead, on
  // the side of the trigger with more room (a row near the foot of a phone opens upwards), no taller
  // than that room (it scrolls inside), and it closes when the page scrolls.
  const [fixedAt, setFixedAt] = useState<CSSProperties | null>(null);
  useLayoutEffect(() => {
    const t = triggerRef.current;
    if (!open || !t?.closest('.kd-tbl')) { setFixedAt(null); return; }
    const r = t.getBoundingClientRect();
    const below = innerHeight - r.bottom - 16, above = r.top - 16;
    const goUp = up || (below < 320 && above > below);
    setFixedAt({
      position: 'fixed',
      ...(goUp ? { bottom: innerHeight - r.top + 8, maxHeight: above - 8 } : { top: r.bottom + 8, maxHeight: below - 8 }),
      overflowY: 'auto',
      ...(align === 'end' ? { right: innerWidth - r.right } : { left: r.left }),
    });
    const onScroll = (e: Event) => { if (!menuRef.current?.contains(e.target as Node)) close(false); };
    addEventListener('scroll', onScroll, { capture: true });
    return () => removeEventListener('scroll', onScroll, { capture: true });
  }, [open, up, align, close]);

  useEffect(() => {
    if (!open) return;
    // A menu in a table moves to the page's root once it is placed: focus its items there, not in
    // the copy that is about to go (focus would fall to the body).
    if (!fixedAt && triggerRef.current?.closest('.kd-tbl')) return;
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
    const list = items(menuRef.current);
    const which = focusOnOpen.current;
    focusOnOpen.current = null;
    if (which === 'last') list[list.length - 1]?.focus();
    else if (which === 'first') list[0]?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      close(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open, id, close, fixedAt]);

  const onTriggerKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      focusOnOpen.current = e.key === 'ArrowDown' ? 'first' : 'last';
      if (open) {
        const list = items(menuRef.current);
        (e.key === 'ArrowDown' ? list[0] : list[list.length - 1])?.focus();
      } else setOpen(true);
    }
  };

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = items(menuRef.current);
    const i = list.indexOf(document.activeElement as HTMLElement);
    let next: HTMLElement | undefined;
    if (e.key === 'ArrowDown') next = list[(i + 1) % list.length];
    else if (e.key === 'ArrowUp') next = list[(i - 1 + list.length) % list.length];
    else if (e.key === 'Home') next = list[0];
    else if (e.key === 'End') next = list[list.length - 1];
    else if (e.key === 'Tab') close(false);
    if (next) { e.preventDefault(); next.focus(); }
  };

  const root = open ? rootOf() : null;
  // Placed against the window, the menu lives beside its scrim at the page's root, above any layer the trigger sits in.
  const list = (
    <MenuCtx.Provider value={{ close: () => close() }}>
      <div
        ref={menuRef}
        id={id + '-m'}
        role="menu"
        aria-label={label}
        onKeyDown={onMenuKey}
        className={cx('kd-menu', !fixedAt && (align === 'end' ? 'right-0' : 'left-0'), !fixedAt && (up ? 'bottom-full mb-2' : 'top-full mt-2'))}
        style={{ ...fixedAt, ...(width ? { width } : null) }}
      >
        {children}
      </div>
    </MenuCtx.Provider>
  );
  return (
    <div className={cx(inline ? 'relative inline' : 'relative inline-flex', className)}>
      {trigger({
        id: id + '-t',
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        // Only while the menu is open: the list is not in the page when it is shut.
        'aria-controls': open ? id + '-m' : undefined,
        onClick: () => { if (!open) focusOnOpen.current = null; setOpen((o) => !o); },
        onKeyDown: onTriggerKey,
        ref: (el) => { triggerRef.current = el; },
      }, open)}
      {open ? (fixedAt && root ? createPortal(list, root) : list) : null}
      {root ? createPortal(<button type="button" tabIndex={-1} aria-hidden="true" className="kd-scrim" onClick={() => close(false)} />, root) : null}
    </div>
  );
}

/** A menu item: a choice (with a turquoise tick when chosen), an action, or a link. */
export function MenuItem({ children, onSelect, checked, aside, href, disabled, external, icon }: {
  children: ReactNode;
  onSelect?: () => void;
  /** Present on choices: the item becomes a menuitemradio. */
  checked?: boolean;
  aside?: ReactNode;
  href?: string;
  disabled?: boolean;
  external?: boolean;
  icon?: ReactNode;
}) {
  const ctx = useContext(MenuCtx);
  const body = (
    <>
      {icon}
      <span className="min-w-0 kd-ell">{children}</span>
      {checked ? <CheckIcon size={16} weight="bold" className="kd-tick" aria-hidden="true" /> : aside != null ? <span className="kd-aside kd-num">{aside}</span> : null}
    </>
  );
  if (href && !disabled) {
    const props = { role: 'menuitem', className: 'kd-mi', tabIndex: -1, onClick: () => ctx?.close() } as const;
    return external ? <a href={href} {...props}>{body}</a> : <Link href={href} {...props}>{body}</Link>;
  }
  return (
    <button
      type="button"
      role={checked !== undefined ? 'menuitemradio' : 'menuitem'}
      aria-checked={checked !== undefined ? checked : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={-1}
      className="kd-mi"
      onClick={() => { if (disabled) return; onSelect?.(); ctx?.close(); }}
    >
      {body}
    </button>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="kd-mi-sep" />;
}

export function MenuHeader({ children }: { children: ReactNode }) {
  return <div className="px-2.5 pt-2 pb-1">{children}</div>;
}

/** The trigger for a picker: a chip, a field-like button, or a heading word (`InlineDropdown`). */
export function Picker<T extends string>({ value, options, onChange, label, display, tone = 'chip', align, width }: {
  value: T;
  options: { value: T; label: ReactNode; aside?: ReactNode; disabled?: boolean }[];
  onChange: (v: T) => void;
  label: string;
  display?: ReactNode;
  tone?: 'chip' | 'button' | 'inline' | 'nav';
  align?: 'start' | 'end';
  width?: number;
}) {
  const current = options.find((o) => o.value === value);
  // A screen reader hears the field and what is chosen: "Thời gian: Cuối tuần này". The field name is
  // read before the visible words (not instead of them), so the name contains what is on screen (WCAG 2.5.3).
  return (
    <Menu
      label={label}
      align={align}
      width={width}
      inline={tone === 'inline'}
      trigger={(p, open) => (
        <button
          type="button"
          {...p}
          ref={p.ref}
          className={cx(
            tone === 'chip' && 'kd-chip',
            tone === 'button' && 'kd-btn',
            tone === 'inline' && 'kd-dd kd-dd-inline',
            tone === 'nav' && 'kd-nl',
            open && tone === 'chip' && 'kd-chip-on',
          )}
        >
          {tone === 'inline' ? null : <span className="sr-only">{label}: </span>}
          {display ?? current?.label}
          <CaretDownIcon size={tone === 'inline' ? 18 : 14} weight={tone === 'inline' ? 'bold' : 'regular'} className="kd-chev" aria-hidden="true" />
        </button>
      )}
    >
      {options.map((o) => (
        <MenuItem key={o.value} checked={o.value === value} aside={o.aside} disabled={o.disabled} onSelect={() => onChange(o.value)}>
          {o.label}
        </MenuItem>
      ))}
    </Menu>
  );
}
