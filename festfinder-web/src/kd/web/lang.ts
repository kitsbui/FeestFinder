'use client';
/**
 * The page in another language: the same address with `?lang=` set or taken away, read from the
 * address bar (kept current when a screen rewrites it: the list's filters send `kd:url`), and the
 * choice remembered for every visit after (the `ff_lang` cookie src/proxy.ts reads, kd/lang-pref.ts;
 * the device's storage the back offices read; the account's language for what the API writes).
 */
import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { FF } from '@/runtime/ff';
import type { Lang } from '../copy';
import { chooseHref } from '../lang-default';

/** Where the chosen language is kept: the old web screen's key, so a visitor's choice carries over (the cookie has the same name). */
export const LANG_KEY = 'ff_lang';

const listen = (go: () => void) => {
  window.addEventListener('popstate', go);
  window.addEventListener('kd:url', go);
  return () => { window.removeEventListener('popstate', go); window.removeEventListener('kd:url', go); };
};
const here = () => location.pathname + location.search;

/** A page in another language is rewritten to a folder of its own (/e/x/th): its address is /e/x?lang=th. */
const LANG_DIR = /\/(en|th|ja|id)$/;

/**
 * This page's address with its query. While the server renders (and while the browser hydrates
 * what it rendered), the path and the page's language only: the server may know the rewritten path
 * and the browser the address, and both must draw the same links.
 */
export function useHere(lang: Lang): string {
  const path = (usePathname() ?? '/').replace(LANG_DIR, '') || '/';
  const rendered = lang === 'vi' ? path : `${path}?lang=${lang}`;
  return useSyncExternalStore(listen, here, () => rendered);
}

/** The link that moves to a language and keeps the choice, with or without JavaScript (kd/lang-default.ts chooseHref). */
export const useChooseHref = (lang: Lang, to: Lang): string => chooseHref(useHere(lang), to);

/**
 * Keeps the language the person moves to, for every visit after: the cookie (a year, the whole
 * site), the device's storage, and, signed in, the account (the API writes its messages in it).
 */
export function rememberLang(next: Lang, signedIn = false) {
  try { localStorage.setItem(LANG_KEY, next); } catch { /* storage blocked */ }
  document.cookie = `${LANG_KEY}=${next}; path=/; max-age=${400 * 86400}; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`;
  if (signedIn && (next === 'vi' || next === 'en')) FF.fire(FF.patch('/me', { locale: next }));
}
