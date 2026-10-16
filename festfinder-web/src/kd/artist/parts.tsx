'use client';
/** Pieces the artist screens share: a section card, chip pickers, fees and statuses. */
import type { ReactNode } from 'react';
import { fill, pick, type Lang } from '../copy';
import { cx } from '../cx';
import { dayMonth, money } from '../format';
import { Chip } from '../ui/actions';
import { Card as Panel, type StatusTone } from '../ui/parts';
import { ARTIST } from './copy';

/** A section card with a heading row. */
export function Block({ title, aside, children, className }: { title: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Panel as="section" className={cx('flex min-w-0 flex-col gap-4 p-5', className)} aria-label={typeof title === 'string' ? title : undefined}>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="kd-h">{title}</h2>{aside}</div>
      {children}
    </Panel>
  );
}

/** Chips that toggle values in a list; `max` stops adding past it. */
export function ChipPick({ label, options, value, onChange, max }: {
  label: string; options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; max?: number;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="kd-flabel mb-2">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value.includes(o.value);
          return (
            <Chip key={o.value} on={on} disabled={!on && !!max && value.length >= max} onClick={() => onChange(on ? value.filter((x) => x !== o.value) : [...value, o.value])}>
              {o.label}
            </Chip>
          );
        })}
      </div>
    </fieldset>
  );
}

/** "5.000.000₫ – 8.000.000₫", one end, or a dash. */
export function feeText(min: number | null, max: number | null, currency: string, lang: Lang) {
  const ends = [min, max].filter((x): x is number => x != null);
  return ends.length ? ends.map((x) => money(x, currency, lang)).join(' – ') : '—';
}

/** Applications, booking requests and brand interests share their statuses. */
export function statusOf(s: string, lang: Lang): { tone: StatusTone; label: string } {
  const T = pick(ARTIST, lang);
  const map: Record<string, { tone: StatusTone; label: string }> = {
    sent: { tone: 'none', label: T.stSent },
    shortlisted: { tone: 'warn', label: T.stShortlisted },
    declined: { tone: 'bad', label: T.stDeclined },
    booked: { tone: 'ok', label: T.stBooked },
    withdrawn: { tone: 'none', label: T.stWithdrawn },
    accepted: { tone: 'ok', label: T.stAccepted },
    selected: { tone: 'ok', label: T.stSelected },
  };
  return map[s] ?? { tone: 'none', label: s };
}

/** "hạn 12.11" for a closing date. */
export const closesText = (iso: string, lang: Lang) => fill(pick(ARTIST, lang).closes, { d: dayMonth(iso, lang) });
