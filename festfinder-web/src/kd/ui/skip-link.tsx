'use client';
/**
 * "Bỏ qua tới nội dung": the first Tab stop of every page, out of sight until it has focus. It moves
 * focus to the page's <main>, past the nav or a back office's rail.
 */
import { useSyncExternalStore, type MouseEvent } from 'react';
import { COMMON, pageLang, pick, type Lang } from '../copy';

const never = () => () => {};

export function SkipLink() {
  const lang = useSyncExternalStore<Lang>(never, pageLang, () => 'vi');
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    const main = document.querySelector('main');
    if (!main) return;
    e.preventDefault();
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    main.focus();
  };
  return <a href="#main" className="kd-skip" onClick={go}>{pick(COMMON, lang).skip}</a>;
}
