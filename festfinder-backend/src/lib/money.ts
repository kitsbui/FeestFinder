import type { Lang } from './i18n.ts';

/**
 * A price in whole units of its currency. Đồng keep the way Vietnamese write them
 * (1.200.000₫); other currencies use the locale's own format (¥5,000, THB 800).
 * The same rules are in money() in festfinder-web/src/kd/format.ts.
 */
export function formatMoney(amount: number, currency = 'VND', lang: Lang = 'vi'): string {
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US';
  if (currency === 'VND') return `${Number(amount).toLocaleString(locale)}₫`;
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}


/**
 * Whole đồng per unit of a currency a partner may report a sale in, for sharing commission
 * with referrers (lib/affiliate.ts). Fixed on purpose: the team updates these by hand once a
 * month (last 2026-10-20). A currency missing here leaves the earning pending with a reason.
 */
export const VND_PER: Record<string, number> = {
  VND: 1, USD: 26_300, EUR: 30_500, SGD: 20_300, THB: 790, JPY: 172, IDR: 1.6, MYR: 6_200, PHP: 450, KRW: 18.8, AUD: 17_200, HKD: 3_380,
};

/** An amount in VND, or null when the currency has no rate. */
export function toVnd(amount: number, currency: string): number | null {
  const rate = VND_PER[currency.toUpperCase()];
  return rate === undefined ? null : Math.round(amount * rate);
}
