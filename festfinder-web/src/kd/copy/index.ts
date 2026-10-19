/**
 * Screen text. Every string is an {en, vi} pair; the English comes from the legacy screen's
 * logic.js when it had the same line. `pick(DICT, lang)` gives the strings of one language.
 *
 * The public pages speak five languages (design v2 phase 10): Vietnamese first, English, and Thai,
 * Japanese and Indonesian for Bangkok, Tokyo and Bali. Their lines live in `copy/asia/`, keyed by
 * the English line, and reach the browser only with a page in that language (`learn`, from
 * kd/ui/in-lang.tsx); a pair may also carry `th`, `ja` or `id` itself. Where neither has the line
 * the page reads English, as it does for whatever the API writes (`dataLang`: the API and the back
 * offices write Vietnamese and English only).
 */
export const LANGS = ['vi', 'en', 'th', 'ja', 'id'] as const;
export type Lang = (typeof LANGS)[number];
/** The languages the API writes in: Vietnamese, or English for every other page. */
export type DataLang = 'vi' | 'en';
export type Pair = { vi: string; en: string } & Partial<Record<'th' | 'ja' | 'id', string>>;
export type Dict = Record<string, Pair>;
export type Strings<D extends Dict> = { [K in keyof D]: string };

/** What the API is asked for: Vietnamese, else English. */
export const dataLang = (l: Lang): DataLang => (l === 'vi' ? 'vi' : 'en');
/** A page's language from its `?lang=`: one of the five, Vietnamese when it names none of them. */
export const langOf = (v: unknown): Lang => ((LANGS as readonly string[]).includes(v as string) ? (v as Lang) : 'vi');
/** Each language's name in itself, for the language links. */
export const LANG_NAME: Record<Lang, string> = { vi: 'Tiếng Việt', en: 'English', th: 'ไทย', ja: '日本語', id: 'Bahasa Indonesia' };
/** The locale `Intl` formats numbers and dates in. */
export const INTL: Record<Lang, string> = { vi: 'vi-VN', en: 'en-US', th: 'th-TH', ja: 'ja-JP', id: 'id-ID' };

/** The Thai, Japanese and Indonesian lines this page brought, by their English line. */
const LEARNT: Partial<Record<Lang, Record<string, string>>> = {};
/** Keeps a language's lines for tx(); the same lines every time, so a second call changes nothing. */
export function learn(lang: Lang, lines: Record<string, string>) {
  LEARNT[lang] = lines;
}

/** One language of a pair, or of any record keyed by language: English when it has none. */
export function tx<T>(p: { en: T } & Partial<Record<Lang, T>>, lang: Lang): T;
export function tx<T>(p: ({ en: T } & Partial<Record<Lang, T>>) | null | undefined, lang: Lang): T | undefined;
export function tx<T>(p: ({ en: T } & Partial<Record<Lang, T>>) | null | undefined, lang: Lang): T | undefined {
  if (p == null) return undefined;
  const own = p[lang];
  if (own !== undefined) return own;
  const learnt = typeof p.en === 'string' ? LEARNT[lang]?.[p.en] : undefined;
  return (learnt as T | undefined) ?? p.en;
}

/**
 * The language a page is in, read in the browser: its ?lang=, else the language its first part
 * is marked in (the footer's language links carry their own, so links do not count).
 */
export const pageLang = (): Lang => {
  const asked = new URLSearchParams(location.search).get('lang');
  if ((LANGS as readonly string[]).includes(asked ?? '')) return asked as Lang;
  return langOf(document.querySelector('body [lang]:not(a)')?.getAttribute('lang'));
};

export function pick<D extends Dict>(dict: D, lang: Lang): Strings<D> {
  const out = {} as Strings<D>;
  for (const k of Object.keys(dict) as (keyof D)[]) out[k] = tx(dict[k], lang);
  return out;
}

/** "{n} sự kiện" with the placeholders filled. */
export function fill(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Strings every surface uses. */
export const COMMON = {
  signIn: { en: 'Log in', vi: 'Đăng nhập' },
  signOut: { en: 'Sign out', vi: 'Đăng xuất' },
  signedOut: { en: 'Signed out', vi: 'Đã đăng xuất' },
  loggedIn: { en: 'Logged in', vi: 'Đã đăng nhập' },
  welcome: { en: 'Account created — welcome', vi: 'Đã tạo tài khoản — chào bạn' },
  close: { en: 'Close', vi: 'Đóng' },
  skip: { en: 'Skip to content', vi: 'Bỏ qua tới nội dung' },
  homeLink: { en: 'FeestFinder, home', vi: 'FeestFinder, trang chủ' },
  feedback: { en: 'Feedback', vi: 'Góp ý' },
  back: { en: 'Back', vi: 'Quay lại' },
  more: { en: 'Show more', vi: 'Xem thêm' },
  less: { en: 'Show less', vi: 'Thu gọn' },
  moreN: { en: 'Show {n} more', vi: 'Xem thêm {n}' },
  save: { en: 'Save', vi: 'Lưu' },
  saved: { en: 'Saved', vi: 'Đã lưu' },
  unsave: { en: 'Remove from saved', vi: 'Bỏ lưu' },
  share: { en: 'Share', vi: 'Chia sẻ' },
  linkCopied: { en: 'Link copied', vi: 'Đã chép liên kết' },
  follow: { en: 'Follow', vi: 'Theo dõi' },
  following: { en: 'Following', vi: 'Đang theo dõi' },
  free: { en: 'Free', vi: 'Miễn phí' },
  from: { en: 'from', vi: 'từ' },
  soldOut: { en: 'Sold out', vi: 'Hết vé' },
  ended: { en: 'Ended', vi: 'Đã kết thúc' },
  verified: { en: 'Verified', vi: 'Đã xác minh' },
  interested: { en: '{n} interested', vi: '{n} quan tâm' },
  error: { en: 'Something went wrong', vi: 'Đã có lỗi xảy ra' },
  retry: { en: 'Try again', vi: 'Thử lại' },
  undo: { en: 'Undo', vi: 'Hoàn tác' },
  loading: { en: 'Loading', vi: 'Đang tải' },
  // sign-in
  gateSave: { en: 'Log in to save events', vi: 'Đăng nhập để lưu sự kiện' },
  gateFollow: { en: 'Log in to follow', vi: 'Đăng nhập để theo dõi' },
  gateTickets: { en: 'Log in to buy tickets', vi: 'Đăng nhập để mua vé' },
  emailLabel: { en: 'Email address', vi: 'Địa chỉ email' },
  emailPh: { en: 'you@example.com', vi: 'ban@example.com' },
  zaloLabel: { en: 'Zalo number', vi: 'Số Zalo' },
  smsLabel: { en: 'Phone number', vi: 'Số điện thoại' },
  waLabel: { en: 'WhatsApp number', vi: 'Số WhatsApp' },
  phonePh: { en: '09xx xxx xxx', vi: '09xx xxx xxx' },
  sendCode: { en: 'Send code', vi: 'Gửi mã' },
  otpTitle: { en: 'Enter the code', vi: 'Nhập mã xác minh' },
  otpSentZalo: { en: 'Sent on Zalo to', vi: 'Đã gửi qua Zalo tới' },
  otpSentSms: { en: 'Sent by SMS to', vi: 'Đã gửi SMS tới' },
  otpSentWa: { en: 'Sent on WhatsApp to', vi: 'Đã gửi qua WhatsApp tới' },
  otpHint: { en: '6 digits · expires in 10 minutes', vi: '6 chữ số · hết hạn sau 10 phút' },
  verify: { en: 'Verify', vi: 'Xác minh' },
  continue: { en: 'Continue', vi: 'Tiếp tục' },
  errEmail: { en: 'That email doesn’t look right', vi: 'Email chưa đúng định dạng' },
  errPhone: { en: 'Enter a valid phone number', vi: 'Số điện thoại chưa hợp lệ' },
  errOtp: { en: 'Enter the 6-digit code', vi: 'Nhập mã 6 số' },
} satisfies Dict;
