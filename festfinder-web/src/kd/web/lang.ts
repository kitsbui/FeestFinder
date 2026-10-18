'use client';
/**
 * The page in the other language: the same address with `?lang=en` added or taken away, read from
 * the address bar (kept current when a screen rewrites it: the list's filters send `kd:url`), and
 * the choice remembered on this device for the next visit (WebFooter moves a Vietnamese page to
 * its English address when it was English last time).
 */
import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import type { Lang } from '../copy';

/** Where the chosen language is kept: the old web screen's key, so a visitor's choice carries over. */
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

/** The same page in the other language. */
export function useOtherLang(lang: Lang): string {
  const u = new URL(useHere(lang), 'http://x');
  if (lang === 'vi') u.searchParams.set('lang', 'en');
  else u.searchParams.delete('lang');
  return u.pathname + u.search;
}

/** Keeps the language the person moves to for their next visit. */
export function rememberLang(next: Lang) {
  try { localStorage.setItem(LANG_KEY, next); } catch { /* storage blocked */ }
}
