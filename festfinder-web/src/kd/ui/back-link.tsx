'use client';
/**
 * "Back" that returns where the person came from: the page before, when it was on this site
 * (the web event page they bought from, the account menu they opened "My tickets" from), else
 * `href`, the screen's own parent. Without JavaScript it is a plain link to `href`.
 */
import type { MouseEvent, ReactNode } from 'react';

/** Back to the previous page of this site, else to `fallback`. */
export function goBack(fallback: string) {
  if (document.referrer.startsWith(location.origin + '/') && history.length > 1) history.back();
  else location.assign(fallback);
}

export function BackLink({ href, label, className, children }: { href: string; label: string; className?: string; children: ReactNode }) {
  const click = (e: MouseEvent<HTMLAnchorElement>) => {
    // A new tab or window keeps the link's own address.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    goBack(href);
  };
  return <a href={href} aria-label={label} className={className} onClick={click}>{children}</a>;
}
