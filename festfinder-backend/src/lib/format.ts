import type { Lang } from './i18n.ts';

/** 1,200,000₫ / 1.200.000₫ */
export function vnd(amount: number, lang: Lang): string {
  return amount.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US') + '₫';
}

export function count(n: number, lang: Lang): string {
  return n.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US');
}


