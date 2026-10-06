/**
 * Dates, times and prices the way Kính đêm writes them: "T7 19.09", "Thứ Bảy 19.09",
 * "16:00 – 02:00", "1.200.000₫". An event's days and times are already in its city's
 * timezone (startsOn, startTime…), so dates are read as calendar days, never as instants.
 */
import type { Lang } from './copy';

const DOW_SHORT = { vi: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
const DOW_LONG = {
  vi: ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
const MON = {
  vi: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** 'YYYY-MM-DD' as its parts and its weekday (0 = Sunday), without any timezone. */
export function day(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, dow };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "19.09" (vi) / "19 Sep" (en). */
export function dayMonth(iso: string, lang: Lang) {
  const x = day(iso);
  return lang === 'vi' ? `${pad(x.d)}.${pad(x.m)}` : `${x.d} ${MON.en[x.m - 1]}`;
}

export const weekdayShort = (iso: string, lang: Lang) => DOW_SHORT[lang][day(iso).dow];
export const weekdayLong = (iso: string, lang: Lang) => DOW_LONG[lang][day(iso).dow];
export const monthShort = (iso: string, lang: Lang) => MON[lang][day(iso).m - 1];

interface Dated { startsOn: string | null; endsOn?: string | null; startTime?: string | null; endTime?: string | null }

/** "T7 19.09", or "24–25.10" / "T6 24 – CN 26.10" for an event over several days. */
export function whenShort(e: Dated, lang: Lang): string {
  if (!e.startsOn) return '';
  const end = e.endsOn && e.endsOn !== e.startsOn ? e.endsOn : null;
  if (!end) return `${weekdayShort(e.startsOn, lang)} ${dayMonth(e.startsOn, lang)}`;
  const a = day(e.startsOn), b = day(end);
  if (a.m === b.m && a.y === b.y) {
    return lang === 'vi' ? `${pad(a.d)}–${pad(b.d)}.${pad(b.m)}` : `${a.d}–${b.d} ${MON.en[b.m - 1]}`;
  }
  return `${dayMonth(e.startsOn, lang)} – ${dayMonth(end, lang)}`;
}

/** "Thứ Bảy 19.09", or a range of days. */
export function whenLong(e: Dated, lang: Lang): string {
  if (!e.startsOn) return '';
  const end = e.endsOn && e.endsOn !== e.startsOn ? e.endsOn : null;
  const one = (iso: string) => `${weekdayLong(iso, lang)} ${dayMonth(iso, lang)}`;
  return end ? `${one(e.startsOn)} – ${one(end)}` : one(e.startsOn);
}

/** "16:00 – 02:00", or the one time there is. */
export function timeRange(e: Dated): string {
  return [e.startTime, e.endTime].filter(Boolean).join(' – ');
}

/** Today in a timezone, as 'YYYY-MM-DD'. */
export function todayIn(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** Whole days from one calendar day to another. */
export function daysBetween(fromIso: string, toIso: string): number {
  const a = day(fromIso), b = day(toIso);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
}

/** A price in whole units of its currency: 1.200.000₫, ¥5,000 (the API's formatMoney). */
export function money(n: number, currency?: string | null, lang: Lang = 'vi'): string {
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US';
  if (!currency || currency === 'VND') return Number(n || 0).toLocaleString(locale) + '₫';
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
}

/** A short price for pins and tight rows: 350K, 1,2TR (vi) / 350K, 1.2M (en). */
export function moneyShort(n: number, currency?: string | null, lang: Lang = 'vi'): string {
  if (currency && currency !== 'VND') return money(n, currency, lang);
  if (n >= 1_000_000) {
    const v = (n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0);
    return lang === 'vi' ? v.replace('.', ',') + 'TR' : v + 'M';
  }
  return Math.round(n / 1000) + 'K';
}

/** 12.400 / 12,400; and 12,4K / 12.4K from ten thousand up. */
export function count(n: number, lang: Lang): string {
  if (n >= 10_000) {
    const v = (Math.round(n / 100) / 10).toFixed(1).replace(/\.0$/, '');
    return (lang === 'vi' ? v.replace('.', ',') : v) + 'K';
  }
  return n.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US');
}

/** "0,8 km" / "0.8 km". */
export function km(n: number, lang: Lang): string {
  const v = n < 10 ? n.toFixed(1) : String(Math.round(n));
  return (lang === 'vi' ? v.replace('.', ',') : v) + ' km';
}
