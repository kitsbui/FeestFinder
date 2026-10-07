'use client';
/**
 * A list's first rows, then "Xem thêm N". Every row is in the page's HTML (the rest hidden
 * until asked for), so a long stat stays whole for links and short on screen.
 */
import { useId, useState, type ReactNode } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react/ssr';
import { fill } from '../../copy';

export function MoreRows({ rows, first, label, more, less }: {
  rows: { key: string; node: ReactNode }[];
  first: number;
  /** The list's name for assistive technology. */
  label: string;
  /** "Xem thêm {n}": `{n}` is the number still hidden. */
  more: string;
  less: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <ul id={id} aria-label={label} className="border-t border-line">
        {rows.map((r, i) => <li key={r.key} hidden={!open && i >= first}>{r.node}</li>)}
      </ul>
      {rows.length > first ? (
        <button type="button" className="kd-more mt-4" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
          {open ? less : fill(more, { n: rows.length - first })}
          <CaretDownIcon size={14} className="kd-chev" aria-hidden="true" />
        </button>
      ) : null}
    </>
  );
}
