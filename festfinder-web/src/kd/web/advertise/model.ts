/**
 * What POST /ad-inquiries takes (festfinder-backend/src/routes/discovery.ts): its categories,
 * budget bands and placements, with how each one is labelled on screen.
 */
import { fill, type Lang, type Strings } from '../../copy';
import { money } from '../../format';
import type { ADVERTISE } from './copy';

type T = Strings<typeof ADVERTISE>;

export type Placement = 'feed' | 'banner' | 'live';
export type Category = 'F&B' | 'Fashion' | 'Healthcare';
export type Rates = Record<Placement, number>;
export interface RateCard { rates: Rates; currency: string }

export const PLACEMENTS: readonly { key: Placement; label: 'placeFeed' | 'placeBanner' | 'placeLive' }[] = [
  { key: 'feed', label: 'placeFeed' },
  { key: 'banner', label: 'placeBanner' },
  { key: 'live', label: 'placeLive' },
];

export const CATEGORIES: readonly { key: Category; label: 'catFB' | 'catFashion' | 'catHealth' }[] = [
  { key: 'F&B', label: 'catFB' },
  { key: 'Fashion', label: 'catFashion' },
  { key: 'Healthcare', label: 'catHealth' },
];

/** Advertising is sold in VND: the budget bands below are amounts in it. */
export const AD_CURRENCY = 'VND';

/**
 * The budget bands. `value` is the API's own key for the band (its enum, sent as is and never
 * shown); the label is written from the amounts with money().
 */
export const BUDGETS: readonly { value: string; lo: number | null; hi: number | null }[] = [
  { value: 'Dưới 50tr₫', lo: null, hi: 50_000_000 },
  { value: '50–150tr₫', lo: 50_000_000, hi: 150_000_000 },
  { value: '150–400tr₫', lo: 150_000_000, hi: 400_000_000 },
  { value: '400tr₫+', lo: 400_000_000, hi: null },
];

export function budgetLabel(b: (typeof BUDGETS)[number], T: T, lang: Lang): string {
  const m = (n: number) => money(n, AD_CURRENCY, lang);
  if (b.lo == null && b.hi != null) return fill(T.under, { a: m(b.hi) });
  if (b.hi == null && b.lo != null) return fill(T.over, { a: m(b.lo) });
  return fill(T.between, { a: m(b.lo ?? 0), b: m(b.hi ?? 0) });
}

/** The legacy screen's default band. */
export const DEFAULT_BUDGET = BUDGETS[1].value;

/** A plausible address; the API checks it again. */
export const looksLikeEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
