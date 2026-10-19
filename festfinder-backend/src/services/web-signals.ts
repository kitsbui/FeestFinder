import { many, one, type Queryable } from '../db/index.ts';
import { L } from '../lib/i18n.ts';
import { notifyAdmins } from './notify.ts';

/*
 * What the browsers report, kept for the team (design v2 phase 19): every page sends its Web
 * Vitals (`web_vital` {kind, value, rating}, kd/ui/vitals.tsx) and its uncaught errors
 * (POST /client-errors). Both land here as one row each, 30 days, paths only, nobody named, so
 * the Console's numbers read the real p75 and the error rate, and an hour with too many errors
 * tells the admins. PostHog and Sentry get the same reports when their keys are set.
 */

export const VITALS = ['LCP', 'INP', 'CLS'] as const;
export type Vital = (typeof VITALS)[number];
export type Rating = 'good' | 'needs-improvement' | 'poor';

/** Google's thresholds: good up to the first, poor from the second. */
export const VITAL_THRESHOLDS: Record<Vital, [number, number]> = { LCP: [2500, 4000], INP: [200, 500], CLS: [0.1, 0.25] };

export const ratingOf = (name: Vital, value: number): Rating => (value <= VITAL_THRESHOLDS[name][0] ? 'good' : value <= VITAL_THRESHOLDS[name][1] ? 'needs-improvement' : 'poor');

/** Browser errors per measured page, above which the admins are told (artboard 26: 0.1 % of sessions). */
export const ERROR_RATE_ALERT_PCT = 0.1;
/** Fewer measured pages in the hour say nothing: one error in ten pages is not a trend. */
export const ALERT_MIN_PAGES = 100;
export const KEEP_DAYS = 30;

const noQuery = (p: string | null | undefined) => (p ? p.split('?')[0].slice(0, 200) : null);

/** One vital as a page reported it; anything that is not a listed vital with a finite value is dropped. */
export async function recordVital(q: Queryable, now: Date, r: { kind: unknown; value: unknown; rating?: unknown; path?: unknown }): Promise<boolean> {
  if (typeof r.kind !== 'string' || !(VITALS as readonly string[]).includes(r.kind)) return false;
  const value = typeof r.value === 'number' ? r.value : Number(r.value);
  if (!Number.isFinite(value) || value < 0) return false;
  const name = r.kind as Vital;
  const rating = typeof r.rating === 'string' && ['good', 'needs-improvement', 'poor'].includes(r.rating) ? (r.rating as Rating) : ratingOf(name, value);
  await q.query(`insert into web_signals (at, kind, name, value, rating, path) values ($1, 'vital', $2, $3, $4, $5)`,
    [now, name, value, rating, noQuery(typeof r.path === 'string' ? r.path : null)]);
  return true;
}

/** One uncaught error or rejection in a browser. */
export async function recordError(q: Queryable, now: Date, kind: 'error' | 'rejection', path: string | null | undefined): Promise<void> {
  await q.query(`insert into web_signals (at, kind, name, path) values ($1, 'error', $2, $3)`, [now, kind, noQuery(path)]);
}

export interface WebNumbers {
  days: number;
  vitals: Record<Vital, { p75: number | null; rating: Rating | null; n: number }>;
  /** Errors against the pages that reported an LCP (one a page load at most). */
  errors: { n: number; pages: number; pct: number | null };
}

/** The last `days` days as the Console shows them. */
export async function webNumbers(q: Queryable, now: Date, days = 7): Promise<WebNumbers> {
  const since = new Date(now.getTime() - days * 86400_000);
  const [vitals, errors] = await Promise.all([
    many<{ name: Vital; p75: number | null; n: number }>(q,
      `select name, percentile_cont(0.75) within group (order by value) as p75, count(*)::int as n
         from web_signals where kind = 'vital' and at > $1 group by name`, [since]),
    one<{ n: number; pages: number }>(q,
      `select count(*) filter (where kind = 'error')::int as n, count(*) filter (where kind = 'vital' and name = 'LCP')::int as pages
         from web_signals where at > $1`, [since]),
  ]);
  const out = { days, vitals: {} as WebNumbers['vitals'], errors: { n: errors?.n ?? 0, pages: errors?.pages ?? 0, pct: null as number | null } };
  for (const v of VITALS) {
    const row = vitals.find((r) => r.name === v);
    const p75 = row?.p75 == null ? null : v === 'CLS' ? Math.round(Number(row.p75) * 1000) / 1000 : Math.round(Number(row.p75));
    out.vitals[v] = { p75, rating: p75 == null ? null : ratingOf(v, p75), n: row?.n ?? 0 };
  }
  if (out.errors.pages) out.errors.pct = Math.round((out.errors.n / out.errors.pages) * 10000) / 100;
  return out;
}

/**
 * The hourly pass: tells every admin when the last hour's browser errors pass the line, once
 * an hour at most, and forgets reports older than 30 days. Returns what it found.
 */
export async function webHealth(q: Queryable, now: Date): Promise<{ errors: number; pages: number; pct: number | null; alerted: boolean; purged: number }> {
  const hourAgo = new Date(now.getTime() - 3600_000);
  const last = await one<{ n: number; pages: number }>(q,
    `select count(*) filter (where kind = 'error')::int as n, count(*) filter (where kind = 'vital' and name = 'LCP')::int as pages
       from web_signals where at > $1`, [hourAgo]);
  const errors = last?.n ?? 0;
  const pages = last?.pages ?? 0;
  const pct = pages ? Math.round((errors / pages) * 10000) / 100 : null;
  let alerted = false;
  if (pct !== null && pages >= ALERT_MIN_PAGES && pct > ERROR_RATE_ALERT_PCT) {
    const hour = now.toISOString().slice(0, 13);
    const sent = await notifyAdmins(q, now, {
      kind: 'web_errors',
      title: L('Browser errors above the line', 'Lỗi trình duyệt vượt mức'),
      body: L(`${errors} errors on ${pages} pages in the last hour (${pct} %, the line is ${ERROR_RATE_ALERT_PCT} %)`,
        `${errors} lỗi trên ${pages} trang trong giờ qua (${pct} %, mức cho phép ${ERROR_RATE_ALERT_PCT} %)`),
      cta: L('Open the numbers', 'Mở Số liệu'),
      link: { url: '/console/insights' },
      dedupeKey: `web_errors:${hour}`,
    });
    alerted = sent > 0;
  }
  const purged = await many<{ id: number }>(q, `delete from web_signals where at < $1 returning id`, [new Date(now.getTime() - KEEP_DAYS * 86400_000)]);
  return { errors, pages, pct, alerted, purged: purged.length };
}
