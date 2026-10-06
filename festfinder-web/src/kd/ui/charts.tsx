'use client';
/**
 * Charts: a daily line with a hover tooltip, and weekly bars stacked by family in the fixed
 * order. Lines and grids are drawn in SVG; the tooltip is glass and flips under the point
 * near the top. Values are listed for screen readers too.
 */
import { useId, useState, type ReactNode } from 'react';
import { CHART_ORDER, FAMILY_LABEL, type Family } from '../genre';
import type { Lang } from '../copy';

export interface Point { label: string; value: number }

export function LineChart({ points, height = 180, format = (n) => String(n), label }: {
  points: Point[]; height?: number; format?: (n: number) => string; label: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const id = useId();
  const W = 600, H = height, padT = 12, padB = 24;
  const max = Math.max(1, ...points.map((p) => p.value));
  const nice = niceMax(max);
  const x = (i: number) => (points.length < 2 ? W / 2 : (i / (points.length - 1)) * W);
  const y = (v: number) => padT + (1 - v / nice) * (H - padT - padB);
  const path = points.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.value).toFixed(1)).join(' ');
  const h = hover != null ? points[hover] : null;
  const tipUnder = h ? y(h.value) < H * 0.3 : false;
  return (
    <figure className="relative m-0" aria-labelledby={id}>
      <figcaption id={id} className="sr-only">{label}</figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block h-auto w-full overflow-visible"
        style={{ height }}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const i = Math.round(((e.clientX - r.left) / r.width) * (points.length - 1));
          setHover(Math.max(0, Math.min(points.length - 1, i)));
        }}
        aria-hidden="true"
      >
        {[0, 0.5, 1].map((t) => (
          <line key={t} x1={0} x2={W} y1={y(nice * t)} y2={y(nice * t)} stroke="var(--color-slate)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        ))}
        <path d={path} fill="none" stroke="var(--color-mist)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {h ? (
          <>
            <line x1={x(hover!)} x2={x(hover!)} y1={padT} y2={H - padB} stroke="var(--color-line2)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <circle cx={x(hover!)} cy={y(h.value)} r={4} fill="var(--color-paper)" vectorEffect="non-scaling-stroke" />
          </>
        ) : null}
      </svg>
      <div className="mt-1 flex justify-between">
        <span className="kd-m">{points[0]?.label}</span>
        <span className="kd-m">{points[points.length - 1]?.label}</span>
      </div>
      {h ? (
        <div
          className={'kd-tip kd-glass flex flex-col gap-0.5' + (tipUnder ? ' kd-tip-under' : '')}
          style={{ left: `${(x(hover!) / W) * 100}%`, top: (y(h.value) / H) * height - (tipUnder ? 0 : 10) }}
        >
          <span className="kd-m">{h.label}</span>
          <span className="kd-mb kd-num">{format(h.value)}</span>
        </div>
      ) : null}
      <table className="sr-only">
        <tbody>{points.map((p) => <tr key={p.label}><th scope="row">{p.label}</th><td>{format(p.value)}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

export interface StackedWeek { label: string; values: Partial<Record<Exclude<Family, 'free'>, number>> }

/** Weekly bars, each stacked fest → live → edm → cult. */
export function StackedBars({ weeks, height = 180, lang, label, legend = true }: {
  weeks: StackedWeek[]; height?: number; lang: Lang; label: string; legend?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = (w: StackedWeek) => CHART_ORDER.reduce((n, f) => n + (w.values[f] ?? 0), 0);
  const max = niceMax(Math.max(1, ...weeks.map(total)));
  return (
    <figure className="m-0 flex flex-col gap-3">
      <figcaption className="sr-only">{label}</figcaption>
      <div className="relative flex items-end gap-2" style={{ height }} onPointerLeave={() => setHover(null)}>
        {weeks.map((w, i) => (
          <div key={w.label} className="relative flex h-full flex-1 flex-col justify-end" onPointerEnter={() => setHover(i)}>
            {CHART_ORDER.slice().reverse().map((f) => {
              const v = w.values[f] ?? 0;
              if (!v) return null;
              return <div key={f} className={`kd-g-${f}`} style={{ height: `${(v / max) * 100}%`, background: 'var(--g)', opacity: hover == null || hover === i ? 1 : 0.4 }} />;
            })}
            {hover === i ? (
              <div className="kd-tip kd-glass flex flex-col gap-1" style={{ left: '50%', top: 0 }}>
                <span className="kd-m">{w.label}</span>
                {CHART_ORDER.map((f) => (
                  <span key={f} className={`kd-g-${f} flex items-center gap-2 kd-s text-mist`}>
                    <span className="kd-mk" aria-hidden="true" />
                    {FAMILY_LABEL[f][lang]}
                    <span className="kd-mb kd-num ml-auto">{w.values[f] ?? 0}</span>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {weeks.map((w) => <span key={w.label} className="kd-m flex-1 text-center">{w.label}</span>)}
      </div>
      {legend ? <Legend lang={lang} /> : null}
      <table className="sr-only">
        <thead><tr><th scope="col" />{CHART_ORDER.map((f) => <th scope="col" key={f}>{FAMILY_LABEL[f][lang]}</th>)}</tr></thead>
        <tbody>{weeks.map((w) => <tr key={w.label}><th scope="row">{w.label}</th>{CHART_ORDER.map((f) => <td key={f}>{w.values[f] ?? 0}</td>)}</tr>)}</tbody>
      </table>
    </figure>
  );
}

export function Legend({ lang, families = CHART_ORDER }: { lang: Lang; families?: Exclude<Family, 'free'>[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {families.map((f) => (
        <span key={f} className={`kd-g-${f} inline-flex items-center gap-2 kd-s`}>
          <span className="kd-mk" aria-hidden="true" />
          {FAMILY_LABEL[f][lang]}
        </span>
      ))}
    </div>
  );
}

/** A labelled bar: a name, a value, and a track. */
export function BarRow({ label, value, max, display, family }: { label: ReactNode; value: number; max: number; display?: ReactNode; family?: Family }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="kd-s text-mist kd-ell">{label}</span>
        <span className="kd-mb kd-num">{display ?? value}</span>
      </div>
      <div className={'kd-bar-track' + (family ? ` kd-g-${family}` : '')}>
        <div className="kd-bar-fill" style={{ width: pct + '%', background: family ? 'var(--g)' : undefined }} />
      </div>
    </div>
  );
}

function niceMax(n: number) {
  const p = Math.pow(10, Math.floor(Math.log10(n)));
  const m = n / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}
