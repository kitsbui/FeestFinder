/**
 * Frames: tabs, the app's top bar, floating tab bar and dock, and the back offices' shell
 * with its side nav and tables. Server-safe; current state is aria-current / aria-selected.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cx } from '../cx';

// ---- tabs ---------------------------------------------------------------------------

export interface TabItem { key: string; label: ReactNode; count?: number | null; href?: string }

/** Tabs as links (a page per tab) or buttons (a panel per tab, with `onSelect`). */
export function Tabs({ items, current, onSelect, label, className }: {
  items: TabItem[]; current: string; onSelect?: (key: string) => void; label: string; className?: string;
}) {
  return (
    <div role={onSelect ? 'tablist' : undefined} aria-label={label} className={cx('kd-tabs', className)}>
      {items.map((t) => {
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
          <button key={t.key} type="button" role="tab" aria-selected={on} className="kd-tab" onClick={() => onSelect?.(t.key)}>
            {body}
          </button>
        );
      })}
    </div>
  );
}

// ---- mobile -------------------------------------------------------------------------

export function AppBar({ children, className }: { children: ReactNode; className?: string }) {
  return <header className={cx('kd-bar', className)}>{children}</header>;
}

export interface TabBarItem { key: string; label: string; href: string; icon: ReactNode; external?: boolean }

/** The floating glass tab bar: five tabs, the current one marked with a lime tick. */
export function TabBar({ items, current, label }: { items: TabBarItem[]; current: string; label: string }) {
  return (
    <nav aria-label={label} className="kd-tabbar kd-glass">
      {items.map((t) => {
        const props = { className: 'kd-tb', 'aria-current': t.key === current ? ('page' as const) : undefined };
        const body = (<>{t.icon}<span>{t.label}</span></>);
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
    <nav aria-label={label} className="kd-side-nav">
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
    </nav>
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

/** A table built from grid rows; `cols` is the grid-template-columns of every row. */
export function Table({ cols, head, children, label }: { cols: string; head: ReactNode[]; children: ReactNode; label?: string }) {
  return (
    <div className="kd-tbl" role="table" aria-label={label}>
      <div role="row" className="kd-tr kd-tr-head" style={{ gridTemplateColumns: cols }}>
        {head.map((h, i) => <span role="columnheader" key={i} className="kd-m">{h}</span>)}
      </div>
      {children}
    </div>
  );
}

export function Row({ cols, children, onClick, href, current, className }: {
  cols: string; children: ReactNode; onClick?: () => void; href?: string; current?: boolean; className?: string;
}) {
  const style = { gridTemplateColumns: cols };
  const cls = cx('kd-tr', current && 'bg-white/[0.04]', className);
  if (href) return <Link role="row" href={href} className={cls} style={style} aria-current={current || undefined}>{children}</Link>;
  if (onClick) return <button role="row" type="button" className={cls} style={style} onClick={onClick} aria-current={current || undefined}>{children}</button>;
  return <div role="row" className={cls} style={style}>{children}</div>;
}
