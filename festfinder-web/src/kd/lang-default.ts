/**
 * What the browser needs of the language rule (kd/lang-pref.ts holds the rest, for src/proxy.ts):
 * the first-visit language and the language links. Apart, so no page's script carries the proxy's
 * rules; DEFAULT_LANG is the same rule as there.
 */

const LANGS = ['vi', 'en', 'th', 'ja', 'id'] as const;
type Lang = (typeof LANGS)[number];
export const isLang = (v: unknown): v is Lang => (LANGS as readonly string[]).includes(v as string);

/** The language of the `ff_lang` cookie and the device's storage. */
export const LANG_COOKIE = 'ff_lang';

/**
 * The language of a first visit: English, unless the deployment says otherwise
 * (NEXT_PUBLIC_DEFAULT_LANG; the screen checks read the Vietnamese site, playwright.next.config.ts).
 */
export const DEFAULT_LANG: Lang = isLang(process.env.NEXT_PUBLIC_DEFAULT_LANG) ? process.env.NEXT_PUBLIC_DEFAULT_LANG : 'en';

/** A language link (the flags, "Tôi"): `?setlang=` asks src/proxy.ts to keep the choice and open the page in it. */
export function chooseHref(address: string, to: Lang): string {
  const u = new URL(address, 'http://x');
  u.searchParams.delete('lang');
  u.searchParams.set('setlang', to);
  return u.pathname + u.search;
}
