/**
 * Which language a visitor reads the site in (owner, 2026-10-20): English for anyone new, and from
 * then on the last language they chose, kept in the `ff_lang` cookie (and the device's storage,
 * web/lang.ts rememberLang). src/proxy.ts asks `langRedirect` on every page request: a page at
 * another language's address moves to the chosen one, so someone who chose Vietnamese is never
 * moved back to English, not even by an English link someone shared. Search engines and link
 * previews are never moved: each address stays the page in its own language.
 *
 * Pure, with no imports, so the screen checks can test it as it is (e2e/next/languages.spec.ts);
 * kd/lang-default.ts repeats the few lines the browser needs, so no page's script carries this file.
 */

export const LANG_COOKIE = 'ff_lang';
const LANGS = ['vi', 'en', 'th', 'ja', 'id'] as const;
type Lang = (typeof LANGS)[number];
const isLang = (v: unknown): v is Lang => (LANGS as readonly string[]).includes(v as string);
/** The language of a first visit (the same rule as kd/lang-default.ts DEFAULT_LANG). */
export const DEFAULT_LANG: Lang = isLang(process.env.NEXT_PUBLIC_DEFAULT_LANG) ? process.env.NEXT_PUBLIC_DEFAULT_LANG : 'en';

/** Crawlers, link previews and checkers: they read each address as it is. */
const BOT = /bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|facebot|embedly|preview|zalo|whatsapp|telegram|discord|slack|skype|vkshare|pinterest|quora|lighthouse|pagespeed|inspectiontool|headless/i;
export const isBot = (ua: string | null | undefined) => !ua || BOT.test(ua);

/** The public pages that exist in every language (their language is `?lang=`, Vietnamese without it). */
const PAGES: readonly RegExp[] = [
  /^\/$/,
  /^\/(e|o|c)\/[^/]+$/,
  /^\/a$/,
  /^\/a\/(style|city)\/[^/]+$/,
  /^\/(a|p|blog)\/(?!(en|th|ja|id|new|mine|style|city)$)[^/]+$/,
  /^\/(p|blog)$/,
  /^\/(about|advertise|saved|profile)$/,
  /^\/stats\/[^/]+$/,
];
/** A file (/e/x.md, /sitemap.xml) is never a page in a language. */
export const hasLanguages = (path: string) => !/\.[a-z0-9]+$/i.test(path) && PAGES.some((r) => r.test(path));

/** The language a cookie header names, if it names one. */
export function cookieLang(header: string | null | undefined): Lang | null {
  const v = (header ?? '').match(/(?:^|;\s*)ff_lang=([a-z]{2})(?:;|$)/)?.[1];
  return isLang(v) ? v : null;
}

/**
 * Where a page request should go instead, or null to serve it. A language link (`?setlang=`) keeps
 * the choice (`set`: the cookie to write) and opens the page in it, without JavaScript; otherwise the
 * chosen language when the visitor chose one, else the default when the address names no language
 * (a shared link that names one is kept for someone new).
 */
export function langRedirect(o: { path: string; search: string; cookie: Lang | null; ua: string | null; fallback?: Lang }): { to: string; set?: Lang } | null {
  if (!hasLanguages(o.path)) return null;
  const q = new URLSearchParams(o.search);
  const chose = q.get('setlang');
  if (q.has('setlang')) {
    q.delete('setlang');
    q.delete('lang');
    if (isLang(chose) && chose !== 'vi') q.set('lang', chose);
    const s = q.toString();
    return { to: o.path + (s ? '?' + s : ''), set: isLang(chose) ? chose : undefined };
  }
  if (isBot(o.ua)) return null;
  const asked = q.get('lang');
  const current: Lang = isLang(asked) ? asked : 'vi';
  const want = o.cookie ?? (asked ? null : o.fallback ?? DEFAULT_LANG);
  if (!want || want === current) return null;
  q.delete('lang');
  if (want !== 'vi') q.set('lang', want);
  const s = q.toString();
  return { to: o.path + (s ? '?' + s : '') };
}
