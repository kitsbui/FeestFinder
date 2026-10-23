/**
 * The bottom tab bar and the dock, on their own so a public page's frame (web/chrome.tsx) carries
 * none of the back offices' shell (ui/shell.tsx re-exports them). Server-safe.
 */
import type { ReactNode } from 'react';
import { KdLink as Link } from '../link';
import { cx } from '../cx';

export interface TabBarItem { key: string; label: string; href?: string; icon: ReactNode; external?: boolean; onClick?: () => void; dialog?: boolean; prefetch?: 'viewport' }

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
          : <Link key={t.key} href={t.href} prefetch={t.prefetch} {...props}>{body}</Link>;
      })}
    </nav>
  );
}

/** The glass bottom bar with the price and the one action. */
export function Dock({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('kd-dock kd-glass', className)}>{children}</div>;
}
