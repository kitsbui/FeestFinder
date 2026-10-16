'use client';
/**
 * A back office's rail (Studio, Studio nghệ sĩ, Console). On a desktop it is the side column; below
 * 900px it folds into a bar with the current page's name and a "Menu" button that opens every item,
 * the head and the foot (public page, switching role, signing out), so nothing on a phone scrolls
 * sideways or hides the way out. It closes again on every move.
 */
import { useEffect, useId, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ListIcon, XIcon } from '@phosphor-icons/react/ssr';

export function Rail({ label, current, menuLabel = 'Menu', children }: { label: string; current: string; menuLabel?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const id = useId();
  useEffect(() => { setOpen(false); }, [path]);
  return (
    <nav aria-label={label} className="kd-side-nav" data-open={open || undefined}>
      <div className="kd-sn-bar">
        <span className="kd-hs kd-ell flex-1">{current || label}</span>
        <button type="button" className="kd-ib kd-ib-line" aria-expanded={open} aria-controls={id} aria-label={menuLabel} onClick={() => setOpen((o) => !o)}>
          {open ? <XIcon size={20} aria-hidden="true" /> : <ListIcon size={20} aria-hidden="true" />}
        </button>
      </div>
      <div id={id} className="kd-sn-body">{children}</div>
    </nav>
  );
}
