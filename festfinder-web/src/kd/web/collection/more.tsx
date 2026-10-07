'use client';
/**
 * The first cards, then "Xem thêm N". Every card is in the page's HTML (the rest hidden until
 * asked for), so a long collection stays whole for search engines and short on screen.
 */
import { Children, useState, type ReactNode } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react/ssr';
import { fill } from '../../copy';

export function MoreCards({ children, first, more, less, className }: {
  /** "Xem thêm {n}": `{n}` is the number still hidden. */
  children: ReactNode; first: number; more: string; less: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const items = Children.toArray(children);
  return (
    <>
      <div className={className}>
        {items.map((c, i) => <div key={i} className={!open && i >= first ? 'hidden' : 'contents'}>{c}</div>)}
      </div>
      {items.length > first ? (
        <button type="button" className="kd-more mt-4" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? less : fill(more, { n: items.length - first })}
          <CaretDownIcon size={14} className="kd-chev" aria-hidden="true" />
        </button>
      ) : null}
    </>
  );
}
