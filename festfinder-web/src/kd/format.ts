/**
 * Dates, times and prices the way Kính đêm writes them: "T7 19.09", "Thứ Bảy 19.09",
 * "16:00 – 02:00", "1.200.000₫". An event's days and times are already in its city's
 * timezone (startsOn, startTime…), so dates are read as calendar days, never as instants.
 * Thai, Japanese and Indonesian (design v2 phase 10) write them their own way: "19 ก.ย.", "9月19日", "19 Sep".
 */
import { INTL, type Lang, tx } from './copy';

const DOW_SHORT: Record<Lang, string[]> = {
  vi: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  th: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'], ja: ['日', '月', '火', '水', '木', '金', '土'], id: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
};
const DOW_LONG: Record<Lang, string[]> = {
  vi: ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  th: ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'],
  ja: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  id: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
};
const MON: Record<Lang, string[]> = {
  vi: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  th: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
  ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
};
/** The languages that write a decimal comma. */
const COMMA = new Set<Lang>(['vi', 'id']);

/** 'YYYY-MM-DD' as its parts and its weekday (0 = Sunday), without any timezone. */
export function day(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, dow };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "19.09" (vi) / "19 Sep" (en, id) / "19 ก.ย." (th) / "9月19日" (ja). */
export function dayMonth(iso: string, lang: Lang) {
  const x = day(iso);
  if (lang === 'vi') return `${pad(x.d)}.${pad(x.m)}`;
  if (lang === 'ja') return `${x.m}月${x.d}日`;
  return `${x.d} ${MON[lang][x.m - 1]}`;
}

export const weekdayShort = (iso: string, lang: Lang) => tx(DOW_SHORT, lang)[day(iso).dow];
export const weekdayLong = (iso: string, lang: Lang) => tx(DOW_LONG, lang)[day(iso).dow];
export const monthShort = (iso: string, lang: Lang) => tx(MON, lang)[day(iso).m - 1];

interface Dated { startsOn: string | null; endsOn?: string | null; startTime?: string | null; endTime?: string | null }

/** "T7 19.09", or "24–25.10" / "T6 24 – CN 26.10" for an event over several days. */
export function whenShort(e: Dated, lang: Lang): string {
  if (!e.startsOn) return '';
  const end = e.endsOn && e.endsOn !== e.startsOn ? e.endsOn : null;
  if (!end) return `${weekdayShort(e.startsOn, lang)} ${dayMonth(e.startsOn, lang)}`;
  const a = day(e.startsOn), b = day(end);
  if (a.m === b.m && a.y === b.y) {
    if (lang === 'vi') return `${pad(a.d)}–${pad(b.d)}.${pad(b.m)}`;
    if (lang === 'ja') return `${b.m}月${a.d}日–${b.d}日`;
    return `${a.d}–${b.d} ${MON[lang][b.m - 1]}`;
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
  const locale = INTL[lang];
  if (!currency || currency === 'VND') return Number(n || 0).toLocaleString(locale) + '₫';
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
}

/** A round amount in a few characters, for preset buttons: 50 triệu, 1 tỷ (dong in Vietnamese) / ₫50M, $25K. */
export function moneyCompact(n: number, currency: string, lang: Lang = 'vi'): string {
  if (currency === 'VND' && lang === 'vi') {
    const [v, unit] = n >= 1e9 ? [n / 1e9, 'tỷ'] : n >= 1e6 ? [n / 1e6, 'triệu'] : [n / 1e3, 'nghìn'];
    return `${v.toLocaleString(INTL.vi, { maximumFractionDigits: 1 })} ${unit}`;
  }
  return new Intl.NumberFormat(INTL[lang], { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** A short price for pins and tight rows: 350K, 1,2TR (vi) / 350K, 1.2M (en). */
export function moneyShort(n: number, currency?: string | null, lang: Lang = 'vi'): string {
  if (currency && currency !== 'VND') return money(n, currency, lang);
  if (n >= 1_000_000) {
    const v = (n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0);
    return lang === 'vi' ? v.replace('.', ',') + 'TR' : (COMMA.has(lang) ? v.replace('.', ',') : v) + 'M';
  }
  return Math.round(n / 1000) + 'K';
}

/** 12.400 / 12,400; and 12,4K / 12.4K from ten thousand up. */
export function count(n: number, lang: Lang): string {
  if (n >= 10_000) {
    const v = (Math.round(n / 100) / 10).toFixed(1).replace(/\.0$/, '');
    return (COMMA.has(lang) ? v.replace('.', ',') : v) + 'K';
  }
  return n.toLocaleString(INTL[lang]);
}

/** "0,8 km" / "0.8 km". */
export function km(n: number, lang: Lang): string {
  const v = n < 10 ? n.toFixed(1) : String(Math.round(n));
  return (COMMA.has(lang) ? v.replace('.', ',') : v) + ' km';
}

/** 2730 → "45:30", 3725 → "1:02:05". */
export const clock = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return (h ? `${h}:${String(m).padStart(2, '0')}` : String(m)) + ':' + String(x).padStart(2, '0');
};
