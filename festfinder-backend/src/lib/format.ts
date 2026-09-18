import type { Lang } from './i18n.ts';

const dec = (x: number, lang: Lang) => {
  const s = (Math.round(x * 10) / 10).toFixed(1).replace(/\.0$/, '');
  return lang === 'vi' ? s.replace('.', ',') : s;
};

/** 1,200,000₫ / 1.200.000₫ */
export function vnd(amount: number, lang: Lang): string {
  return amount.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US') + '₫';
}

/** 3.42bn₫ / 3,42 tỷ₫ · 842.6M₫ / 842,6tr₫ — the compact form the dashboards use. */
export function vndShort(amount: number, lang: Lang): string {
  const vi = lang === 'vi';
  if (Math.abs(amount) >= 1e9) return dec(amount / 1e9, lang) + (vi ? ' tỷ₫' : 'bn₫');
  if (Math.abs(amount) >= 1e6) return dec(amount / 1e6, lang) + (vi ? 'tr₫' : 'M₫');
  return vnd(amount, lang);
}

export function count(n: number, lang: Lang): string {
  return n.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US');
}

const DOW = { en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], vi: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] };
const MON = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  vi: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
};

/** "Sat, 19 Sep" / "T7, 19 Th9" for a YYYY-MM-DD date. */
export function shortDate(date: string, lang: Lang): string {
  const [y, m, d] = date.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DOW[lang][wd]}, ${d} ${MON[lang][m - 1]}`;
}

/** "19 Sep" / "19/9" */
export function dayMonth(date: string, lang: Lang): string {
  const [, m, d] = date.split('-').map(Number);
  return lang === 'vi' ? `${d}/${m}` : `${d} ${MON.en[m - 1]}`;
}
