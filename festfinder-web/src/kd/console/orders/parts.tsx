'use client';
/**
 * Small parts the commerce screens share (orders, users, partners, affiliate, brands): a table
 * cell, a stat tile that toggles a filter, a section heading in a drawer, and copying text.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import type { StatusTone } from '../../ui/parts';

/** FeestFinder's checkout sells in đồng only (ticket tiers and orders are VND). */
export const CHECKOUT_CURRENCY = 'VND';

/** An order status's tone. */
export const STATUS_TONE: Record<string, StatusTone> = { paid: 'ok', pending: 'warn', refunded: 'live', cancelled: 'none', expired: 'none' };

/** One cell of a `Row`. */
export function Cell({ children, className, end }: { children?: ReactNode; className?: string; end?: boolean }) {
  return <span role="cell" className={cx('min-w-0', end && 'text-right', className)}>{children}</span>;
}

/** A title and a line under it, for the first cell of a row. */
export function Two({ title, sub }: { title: ReactNode; sub?: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="kd-ell text-sm text-paper">{title}</span>
      {sub ? <span className="kd-s kd-ell text-xs">{sub}</span> : null}
    </span>
  );
}

/** A number with its label; with `onClick` it is a toggle (a status filter, for one). */
export function Tile({ label, value, note, on, onClick }: { label: ReactNode; value: ReactNode; note?: ReactNode; on?: boolean; onClick?: () => void }) {
  const body = (
    <>
      <span className="kd-m">{label}</span>
      <span className="kd-num text-[22px] leading-tight font-medium tracking-tight text-paper">{value}</span>
      {note ? <span className="kd-s kd-num text-xs">{note}</span> : null}
    </>
  );
  const cls = cx(
    'flex min-w-[160px] flex-1 flex-col items-start gap-1 rounded-lg p-4 text-left shadow-[inset_0_0_0_1px_var(--color-line)]',
    on && 'bg-white/[0.05] shadow-[inset_0_0_0_1px_var(--color-paper)]',
  );
  if (!onClick) return <div className={cls}>{body}</div>;
  return <button type="button" aria-pressed={!!on} className={cx(cls, 'transition-colors hover:bg-white/[0.03]')} onClick={onClick}>{body}</button>;
}

export function Tiles({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-3">{children}</div>;
}

/** A heading inside a drawer. */
export function Section({ title, children, aside }: { title: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2"><h3 className="kd-hs flex-1">{title}</h3>{aside}</div>
      {children}
    </section>
  );
}

export const PARTS = {
  copied: { en: 'Copied', vi: 'Đã chép' },
} as const;

/** Copies text and says so (or shows the text when the clipboard is refused). */
export async function copyText(kd: { toast: (t: string) => void }, lang: Lang, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    kd.toast(pick(PARTS, lang).copied);
  } catch {
    kd.toast(text);
  }
}

/**
 * A search box over an address parameter: typing shows at once, the address (and the request)
 * follows a quarter second after the last key.
 */
export function useTyped(value: string, commit: (v: string) => void, ms = 250): [string, (v: string) => void] {
  const [text, setText] = useState(value);
  const last = useRef(value);
  useEffect(() => { if (value !== last.current) { last.current = value; setText(value); } }, [value]);
  useEffect(() => {
    if (text === last.current) return;
    const t = setTimeout(() => { last.current = text; commit(text); }, ms);
    return () => clearTimeout(t);
  }, [text, commit, ms]);
  return [text, setText];
}
