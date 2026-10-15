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

/** FeestFinder sells tickets itself only in đồng; elsewhere an event links to its ticket seller. */
export const CHECKOUT_CURRENCY = 'VND';
