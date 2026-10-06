'use client';
/**
 * Long text clamped to 2–3 lines with "Xem thêm / Thu gọn". The toggle only appears when the
 * text is actually cut. Lists use `ShowMore`: the first few items, then "Xem thêm N".
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react/ssr';
import { cx } from '../cx';

export function Clamp({ lines = 3, children, more, less, className }: {
  lines?: 2 | 3; children: ReactNode; more: string; less: string; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [cut, setCut] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const check = () => setCut(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, children]);
  return (
    <div className="flex flex-col gap-2">
      <div ref={ref} className={cx(!open && (lines === 2 ? 'kd-clamp2' : 'kd-clamp3'), className)}>{children}</div>
      {cut || open ? (
        <button type="button" className="kd-more" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? less : more}
          <CaretDownIcon size={14} className="kd-chev" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

/** The first `n` items, then a button that shows the rest. */
export function ShowMore<T>({ items, n, render, more, less, className }: {
  items: T[]; n: number; render: (item: T, i: number) => ReactNode; more: (rest: number) => string; less: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, n);
  return (
    <>
      <div className={className}>{shown.map(render)}</div>
      {items.length > n ? (
        <button type="button" className="kd-more mt-3" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? less : more(items.length - n)}
          <CaretDownIcon size={14} className="kd-chev" aria-hidden="true" />
        </button>
      ) : null}
    </>
  );
}
