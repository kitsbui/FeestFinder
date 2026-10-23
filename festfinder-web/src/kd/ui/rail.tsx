'use client';
/**
 * A back office's rail (Studio, Studio nghệ sĩ, Console). On a desktop it is the side column; below
 * 900px it folds into a bar with the current page's name and a "Menu" button that opens every item,
 * the head and the foot (public page, switching role, signing out), so nothing on a phone scrolls
 * sideways or hides the way out. It closes at the tap on a link, and again on every move.
 */
import { useEffect, useId, useState, type MouseEvent, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ListIcon, XIcon } from '@phosphor-icons/react/ssr';

export function Rail({ label, current, menuLabel = 'Menu', children }: { label: string; current: string; menuLabel?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const id = useId();
  // A tap on a link closes the menu at once, while the tap still counts as the cause of the move:
  // waiting for the next page (the effect, kept for moves made otherwise) would shift the screen
  // well after it on a slow phone.
  useEffect(() => { setOpen(false); }, [path]);
  const closeOnLink = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((e.target as Element).closest('a[href]')) setOpen(false);
  };
  return (
    <nav aria-label={label} className="kd-side-nav" data-open={open || undefined}>
      <div className="kd-sn-bar">
        <span className="kd-hs kd-ell flex-1">{current || label}</span>
        <button type="button" className="kd-ib kd-ib-line" aria-expanded={open} aria-controls={id} aria-label={menuLabel} onClick={() => setOpen((o) => !o)}>
          {open ? <XIcon size={20} aria-hidden="true" /> : <ListIcon size={20} aria-hidden="true" />}
        </button>
      </div>
      <div id={id} className="kd-sn-body" onClickCapture={closeOnLink}>{children}</div>
    </nav>
  );
}
