'use client';
/**
 * Noto Sans JP, only where Japanese or Chinese text shows (a Tokyo listing, a lineup name). Its
 * stylesheet is about 100 KB of @font-face rules, so it is not part of the site's CSS
 * (scripts/fonts-css.ts writes it to /fonts/noto-sans-jp.css): this adds it the first time a page
 * shows a CJK character, and the browser then fetches only the slices those characters need.
 * Thai is small and always declared in kd/fonts.css.
 */
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const CJK = /[　-ヿ㐀-䶿一-鿿豈-﫿＀-￯]/;
const HREF = '/fonts/noto-sans-jp.css';

export function ScriptFonts() {
  const path = usePathname();
  useEffect(() => {
    if (document.querySelector(`link[href="${HREF}"]`)) return;
    const check = () => {
      if (!CJK.test(document.body.textContent ?? '')) return false;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = HREF;
      document.head.append(link);
      return true;
    };
    if (check()) return;
    // Content that arrives after the first paint (a list loaded in the browser, a sheet).
    const seen = new MutationObserver(() => { if (check()) seen.disconnect(); });
    seen.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => seen.disconnect();
  }, [path]);
  return null;
}
