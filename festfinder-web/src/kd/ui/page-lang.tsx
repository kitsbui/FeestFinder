'use client';
/**
 * <html lang> follows the address (feedback FF-007, 2026-11-04). The ISR HTML is one copy per path and says
 * "vi"; the root layout's inline script sets the language from ?lang= before React arrives, and this effect
 * sets it again after React has drawn (a page React re-renders from scratch would have put "vi" back).
 */
import { useEffect } from 'react';

export const PAGE_LANGS = /^(en|th|ja|id)$/;

export function PageLang() {
  useEffect(() => {
    const l = new URLSearchParams(location.search).get('lang');
    document.documentElement.lang = l && PAGE_LANGS.test(l) ? l : 'vi';
  }, []);
  return null;
}
