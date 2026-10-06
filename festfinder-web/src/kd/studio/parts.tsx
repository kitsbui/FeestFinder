'use client';
/** Pieces the Studio screens share: the page frame, KPI tiles, and the line when no event is picked. */
import type { ReactNode } from 'react';
import { pick } from '../copy';
import { cx } from '../cx';
import { Card as Panel } from '../ui/parts';
import { STUDIO } from './copy';
import { useStudio } from './root';

/** FeestFinder's own checkout sells in đồng only (lib/money.ts CHECKOUT_CURRENCY): promo codes, revenue and payouts. */
export const CHECKOUT = 'VND';

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('flex flex-col gap-3 p-[clamp(20px,3vw,32px)]', className)}>{children}</div>;
}

export function Kpis({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-3">{children}</div>;
}

export function Kpi({ label, value, note, bone, children }: { label: string; value: ReactNode; note?: ReactNode; bone?: boolean; children?: ReactNode }) {
  const body = (
    <>
      <span className="kd-m">{label}</span>
      <span className="kd-d2 kd-num">{value}</span>
      {note != null ? <span className="kd-s kd-num">{note}</span> : null}
      {children}
    </>
  );
  return bone ? <div className="kd-bonecard kd-kpi">{body}</div> : <Panel className="kd-kpi">{body}</Panel>;
}

/** A section card with a heading row. */
export function Block({ title, aside, children, className, label }: { title: ReactNode; aside?: ReactNode; children: ReactNode; className?: string; label?: string }) {
  return (
    <Panel as="section" className={cx('flex min-w-0 flex-col gap-4 p-5', className)} aria-label={label ?? (typeof title === 'string' ? title : undefined)}>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="kd-h">{title}</h2>{aside}</div>
      {children}
    </Panel>
  );
}

/** The screens about one event say so when there is none to show. */
export function NeedEvent() {
  const { lang } = useStudio();
  return <Panel className="p-5"><span className="kd-s">{pick(STUDIO, lang).pickAnEvent}</span></Panel>;
}
