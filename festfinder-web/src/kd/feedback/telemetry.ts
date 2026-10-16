/**
 * What a bug report says about the page it came from (festfinder-backend routes/feedback.ts keeps
 * the same fixed list): the path without its query, the browser, the screen, the last errors and
 * the last failed API call. Never cookies, storage, form contents or anything typed.
 */
import { FF } from '@/runtime/ff';

const errors: string[] = [];
let installed = false;

const clean = (s: string) => s.replace(/\?[^\s:)]*/g, '').slice(0, 500);

/** Listens for uncaught errors once per page; the last five are kept. */
export function installErrorLog() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (e) => {
    if (!e.message) return;
    errors.push(clean(`${e.message} at ${e.filename || '?'}:${e.lineno}:${e.colno}`));
    if (errors.length > 5) errors.shift();
  });
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason as { message?: string } | string | undefined;
    errors.push(clean(`Unhandled rejection: ${typeof r === 'string' ? r : r?.message ?? String(r)}`));
    if (errors.length > 5) errors.shift();
  });
}

export interface Telemetry {
  pagePath: string; userAgent: string; screen: string; viewport: string; dpr: number; language: string; lang: 'vi' | 'en';
  displayMode: string; buildId: string | null; errors: string[]; lastApiError: { method: string; path: string; status: number; code: string } | null;
}

export function snapshot(lang: 'vi' | 'en'): Telemetry {
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches;
  return {
    pagePath: location.pathname,
    userAgent: navigator.userAgent,
    screen: `${screen.width}x${screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    dpr: window.devicePixelRatio || 1,
    language: navigator.language,
    lang,
    displayMode: standalone ? 'standalone' : 'browser',
    buildId: process.env.NEXT_PUBLIC_BUILD_ID || null,
    errors: [...errors],
    lastApiError: FF.lastApiError ?? null,
  };
}
