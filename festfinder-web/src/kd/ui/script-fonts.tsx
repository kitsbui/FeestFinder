'use client';
/**
 * Noto Sans JP, only where Japanese or Chinese text shows (a Tokyo listing, a lineup name). Its
 * stylesheet is about 100 KB of @font-face rules, so it is not part of the site's CSS
 * (scripts/fonts-css.ts writes it to /fonts/noto-sans-jp.css): this adds it the first time a page
 * shows a CJK character, and the browser then fetches only the slices those characters need.
 * Only text one can see counts: the page's data in a script (a Tokyo venue in the list's data) or a
 * template asks for nothing. Thai is small and always declared in kd/fonts.css.
 */
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** Kana, CJK ideographs and full-width forms, written as escapes so no editor's normalising moves a range (U+F900 became U+8C48 once, taking in emoji and Hangul). */
const CJK = /[\u3000-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;
const HREF = '/fonts/noto-sans-jp.css';
/** Text inside these is never drawn. */
const UNSEEN = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT']);

const shown = (t: Node) => CJK.test(t.nodeValue ?? '') && !UNSEEN.has(t.parentElement?.tagName ?? '');

/** Whether a node, or a text inside it, shows a CJK character. */
function showsCjk(root: Node): boolean {
  if (root.nodeType === Node.TEXT_NODE) return shown(root);
  if (root.nodeType !== Node.ELEMENT_NODE || UNSEEN.has((root as Element).tagName)) return false;
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (t) => (shown(t) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
  return walk.nextNode() !== null;
}

export function ScriptFonts() {
  const path = usePathname();
  useEffect(() => {
    if (document.querySelector(`link[href="${HREF}"]`)) return;
    const add = () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = HREF;
      document.head.append(link);
    };
    if (showsCjk(document.body)) { add(); return; }
    // Content that arrives after the first paint (a list loaded in the browser, a sheet): only what changed is read.
    const seen = new MutationObserver((records) => {
      const hit = records.some((r) => (r.type === 'characterData' ? showsCjk(r.target) : Array.from(r.addedNodes).some(showsCjk)));
      if (!hit) return;
      seen.disconnect();
      if (!document.querySelector(`link[href="${HREF}"]`)) add();
    });
    seen.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => seen.disconnect();
  }, [path]);
  return null;
}
