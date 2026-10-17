/**
 * Frames: tabs, the app's top bar, floating tab bar and dock, and the back offices' shell
 * with its side nav and tables. Server-safe; current state is aria-current / aria-selected.
 */
import { KdLink as Link } from '../link';
import type { KeyboardEvent, ReactNode } from 'react';
import { cx } from '../cx';
import { Rail } from './rail';

// ---- tabs ---------------------------------------------------------------------------

export interface TabItem { key: string; label: ReactNode; count?: number | null; href?: string }

/** Tabs as links (a page per tab) or buttons (a panel per tab, with `onSelect`). */
export function Tabs({ items, current, onSelect, label, className }: {
  items: TabItem[]; current: string; onSelect?: (key: string) => void; label: string; className?: string;
}) {
  const Box = onSelect ? 'div' : 'nav';
  // A tablist takes one Tab stop (the chosen tab); the arrows, Home and End move along it and choose.
  const anyOn = items.some((t) => t.key === current);
  const onKey = onSelect ? (e: KeyboardEvent<HTMLElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const tabs = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const at = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    e.preventDefault();
    const n = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (at + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[n].focus();
    onSelect(items[n].key);
  } : undefined;
  return (
    // Tabs that are links are a small navigation (a landmark with its name); tabs that switch panels are a tablist.
    <Box role={onSelect ? 'tablist' : undefined} aria-label={label} className={cx('kd-tabs', className)} onKeyDown={onKey}>
      {items.map((t, i) => {
        const on = t.key === current;
        const body = (
          <>
            {t.label}
            {t.count != null ? <span className="kd-c kd-num">{t.count}</span> : null}
          </>
        );
        if (t.href) {
          return <Link key={t.key} href={t.href} scroll={false} aria-current={on ? 'page' : undefined} className="kd-tab">{body}</Link>;
        }
        return (
          <button key={t.key} type="button" role="tab" aria-selected={on} tabIndex={on || (!anyOn && i === 0) ? 0 : -1} className="kd-tab" onClick={() => onSelect?.(t.key)}>
            {body}
          </button>
        );
      })}
    </Box>
  );
}

// ---- mobile -------------------------------------------------------------------------

export function AppBar({ children, className }: { children: ReactNode; className?: string }) {
  return <header className={cx('kd-bar', className)}>{children}</header>;
}

export interface TabBarItem { key: string; label: string; href?: string; icon: ReactNode; external?: boolean; onClick?: () => void; dialog?: boolean }

/**
 * The bottom tab bar: five tabs, the current one marked with a turquoise tick. `edge` is the site's
 * (design v2): solid and edge to edge, hidden from 900px where the nav takes over; without it, the
 * app's floating glass bar. A tab without `href` is a button (the site's "Tìm" opens a sheet).
 */
export function TabBar({ items, current, label, edge }: { items: TabBarItem[]; current: string; label: string; edge?: boolean }) {
  return (
    <nav aria-label={label} className={edge ? 'kd-tabbar kd-tabbar-edge' : 'kd-tabbar kd-glass'}>
      {items.map((t) => {
        const body = (<>{t.icon}<span>{t.label}</span></>);
        if (!t.href) return <button key={t.key} type="button" className="kd-tb" aria-haspopup={t.dialog ? 'dialog' : undefined} onClick={t.onClick}>{body}</button>;
        const props = { className: 'kd-tb', 'aria-current': t.key === current ? ('page' as const) : undefined, onClick: t.onClick };
        return t.external
          ? <a key={t.key} href={t.href} {...props}>{body}</a>
          : <Link key={t.key} href={t.href} {...props}>{body}</Link>;
      })}
    </nav>
  );
}

/** The glass bottom bar with the price and the one action. */
export function Dock({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('kd-dock kd-glass', className)}>{children}</div>;
}

// ---- back offices -------------------------------------------------------------------

export interface SideItem { key: string; label: string; href: string; icon?: ReactNode; count?: number | null; hideSmall?: boolean; external?: boolean }

export function SideNav({ items, current, head, label, footer }: { items: SideItem[]; current: string; head?: ReactNode; label: string; footer?: ReactNode }) {
  return (
    <Rail label={label} current={items.find((i) => i.key === current)?.label as string ?? ''}>
      {head}
      {items.map((i) => {
        const props = { className: cx('kd-sn', i.hideSmall && 'kd-sn-hide'), 'aria-current': i.key === current ? ('page' as const) : undefined };
        const body = (
          <>
            {i.icon}
            <span className="kd-ell">{i.label}</span>
            {i.count ? <span className="kd-count kd-num">{i.count}</span> : null}
          </>
        );
        return i.external ? <a key={i.key} href={i.href} {...props}>{body}</a> : <Link key={i.key} href={i.href} {...props}>{body}</Link>;
      })}
      {footer}
    </Rail>
  );
}

export function Shell({ nav, children }: { nav: ReactNode; children: ReactNode }) {
  return (
    <div className="kd-shell">
      {nav}
      <main className="kd-content">{children}</main>
    </div>
  );
}

/**
 * Every column may shrink below the size it asks for, so a row never pushes past its box (the cells
 * clip; kd.css turns rows into cards below 640px): `110px` becomes `minmax(0,110px)`, and
 * `minmax(160px,2fr)` becomes `minmax(0,2fr)`.
 */
export const shrinkable = (cols: string) =>
  cols.replace(/minmax\(\s*[^,()]+,/g, 'minmax(0,').replace(/(^|\s)(\d+(?:\.\d+)?(?:px|rem))(?=\s|$)/g, '$1minmax(0,$2)');

/** A table built from grid rows; `cols` is the grid-template-columns of every row. */
/**
 * `fold`: the container width under which rows become cards, for a table whose fixed columns leave its
 * name column nothing below that width (md 900, lg 1000, xl 1160; every table folds under 640).
 */
export function Table({ cols, head, children, label, fold }: { cols: string; head: ReactNode[]; children: ReactNode; label?: string; fold?: 'md' | 'lg' | 'xl' }) {
  return (
    <div className="kd-tbl" role="table" aria-label={label} data-fold={fold}>
      <div role="row" className="kd-tr kd-tr-head" style={{ gridTemplateColumns: shrinkable(cols) }}>
        {head.map((h, i) => <span role="columnheader" key={i} className="kd-m">{h}</span>)}
      </div>
      {children}
    </div>
  );
}

export function Row({ cols, children, onClick, href, current, className }: {
  cols: string; children: ReactNode; onClick?: () => void; href?: string; current?: boolean; className?: string;
}) {
  const style = { gridTemplateColumns: shrinkable(cols) };
  const cls = cx('kd-tr', current && 'bg-white/[0.04]', className);
  if (href) return <Link role="row" href={href} className={cls} style={style} aria-current={current || undefined}>{children}</Link>;
  if (onClick) return <button role="row" type="button" className={cls} style={style} onClick={onClick} aria-current={current || undefined}>{children}</button>;
  return <div role="row" className={cls} style={style}>{children}</div>;
}
