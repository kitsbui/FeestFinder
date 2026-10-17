/**
 * What a bug report says about the page it came from (festfinder-backend routes/feedback.ts keeps
 * the same fixed list): the path without its query, the browser, the screen, the last errors and
 * the last failed API call. Never cookies, storage, form contents or anything typed.
 */
import { FF } from '@/runtime/ff';

const errors: string[] = [];
let installed = false;

const clean = (s: string) => s.replace(/\?[^\s:)]*/g, '').slice(0, 500);

/**
 * Tells the API about an uncaught error (festfinder-backend routes/client-errors.ts, which hands it
 * to the same reporter as its own): at most three different ones per page, never a query string.
 */
const reported = new Set<string>();
function report(kind: 'error' | 'rejection', message: string, extra: { source?: string; line?: number; col?: number; stack?: string } = {}) {
  try {
    const key = kind + message;
    if (reported.has(key) || reported.size >= 3) return;
    reported.add(key);
    const body = JSON.stringify({ kind, message: clean(message).slice(0, 300), ...extra, stack: extra.stack ? clean(extra.stack).slice(0, 4000) : undefined });
    if (navigator.sendBeacon) navigator.sendBeacon('/client-errors', new Blob([body], { type: 'text/plain' }));
    else fetch('/client-errors', { method: 'POST', body, keepalive: true, credentials: 'same-origin' }).catch(() => {});
  } catch { /* reporting never breaks a screen */ }
}

/** Listens for uncaught errors once per page: the last five are kept for a report, and each is told to the API. */
export function installErrorLog() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (e) => {
    if (!e.message) return;
    errors.push(clean(`${e.message} at ${e.filename || '?'}:${e.lineno}:${e.colno}`));
    if (errors.length > 5) errors.shift();
    report('error', e.message, { source: e.filename ? clean(e.filename) : undefined, line: e.lineno || undefined, col: e.colno || undefined, stack: (e.error as Error | undefined)?.stack });
  });
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason as { message?: string; stack?: string } | string | undefined;
    const message = typeof r === 'string' ? r : r?.message ?? String(r);
    errors.push(clean(`Unhandled rejection: ${message}`));
    if (errors.length > 5) errors.shift();
    report('rejection', message || 'Unhandled rejection', { stack: typeof r === 'object' ? r?.stack : undefined });
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
