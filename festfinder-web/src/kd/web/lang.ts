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

/** This page's address with its query (only the path while the server renders). */
export function useHere(): string {
  const path = usePathname() ?? '/';
  return useSyncExternalStore(listen, here, () => path);
}

/** The same page in the other language. */
export function useOtherLang(lang: Lang): string {
  const u = new URL(useHere(), 'http://x');
  if (lang === 'vi') u.searchParams.set('lang', 'en');
  else u.searchParams.delete('lang');
  return u.pathname + u.search;
}

/** Keeps the language the person moves to for their next visit. */
export function rememberLang(next: Lang) {
  try { localStorage.setItem(LANG_KEY, next); } catch { /* storage blocked */ }
}
