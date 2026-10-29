'use client';
/**
 * "Bỏ qua tới nội dung": the first Tab stop of every page, out of sight until it has focus. It moves
 * focus to the page's <main id="main">, past the nav or a back office's rail. Each frame draws it
 * first with the page's language (the site's WebNav, a back office's Shell, the Studio wizard, the
 * 404), so an English page's HTML says it in English.
 */
import type { MouseEvent } from 'react';
import { COMMON, pick, type Lang } from '../copy';

const go = (e: MouseEvent<HTMLAnchorElement>) => {
  const main = document.getElementById('main');
  if (!main) return;
  e.preventDefault();
  if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
  main.focus();
};

export function SkipLink({ lang }: { lang: Lang }) {
  return <a href="#main" className="kd-skip" onClick={go}>{pick(COMMON, lang).skip}</a>;
}
