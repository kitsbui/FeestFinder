/**
 * What POST /ad-inquiries takes (festfinder-backend/src/routes/discovery.ts): its categories,
 * budget bands and placements, with how each one is labelled on screen.
 */
import { fill, type Lang, type Strings } from '../../copy';
import { money } from '../../format';
import type { ADVERTISE } from './copy';

type T = Strings<typeof ADVERTISE>;

export type Placement = 'feed' | 'banner' | 'live';
export type Category = 'F&B' | 'Fashion' | 'Healthcare' | 'Beauty' | 'Tech' | 'Travel' | 'Lifestyle' | 'Other';
export type Rates = Record<Placement, number>;
export interface RateCard { rates: Rates; currency: string }

export const PLACEMENTS: readonly { key: Placement; label: 'placeFeed' | 'placeBanner' | 'placeLive' }[] = [
  { key: 'feed', label: 'placeFeed' },
  { key: 'banner', label: 'placeBanner' },
  { key: 'live', label: 'placeLive' },
];

/** festfinder-backend lib/ads.ts AD_CATEGORIES, in the same order. */
export const CATEGORIES: readonly { key: Category; label: 'catFB' | 'catFashion' | 'catHealth' | 'catBeauty' | 'catTech' | 'catTravel' | 'catLife' | 'catOther' }[] = [
  { key: 'F&B', label: 'catFB' },
  { key: 'Fashion', label: 'catFashion' },
  { key: 'Healthcare', label: 'catHealth' },
  { key: 'Beauty', label: 'catBeauty' },
  { key: 'Tech', label: 'catTech' },
  { key: 'Travel', label: 'catTravel' },
  { key: 'Lifestyle', label: 'catLife' },
  { key: 'Other', label: 'catOther' },
];

/** A brand's own channels (lib/ads.ts BRAND_LINKS) that the form asks for. */
export const LINKS = [
  { key: 'facebook', label: 'Facebook' }, { key: 'instagram', label: 'Instagram' }, { key: 'tiktok', label: 'TikTok' }, { key: 'shopee', label: 'Shopee' },
] as const;
export type LinkKey = (typeof LINKS)[number]['key'];

/** The smallest budget the API takes, in AD_CURRENCY. */
export const MIN_BUDGET = 1_000_000;
/** Up to this many product pictures. */
export const MAX_IMAGES = 4;

/** Advertising is sold in VND: the budget bands below are amounts in it. */
export const AD_CURRENCY = 'VND';

/** "Từ 1.000.000₫": the smallest budget, written with money(). */
export const minBudgetLabel = (T: T, lang: Lang) => fill(T.budgetMin, { a: money(MIN_BUDGET, AD_CURRENCY, lang) });

/** A plausible address; the API checks it again. */
export const looksLikeEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
