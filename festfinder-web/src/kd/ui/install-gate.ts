/**
 * Whether the install strip shows on this page (ui/install.tsx), with none of its code: the frame
 * (web/chrome.tsx) counts the visit here and loads the strip, its sheet and its icon only when it
 * will show (a phone, a second visit or more, not installed, not put away in the last 30 days).
 */

export type Platform = 'ios' | 'ios-webview' | 'android' | 'desktop';
const DISMISS_KEY = 'ff:install-dismissed';
const VISITS_KEY = 'ff:visits';

/** Which steps fit this browser. */
export function platformOf(ua: string): Platform {
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);
  if (ios) return /FBAN|FBAV|Instagram|Zalo|Line\/|Messenger|TikTok/i.test(ua) ? 'ios-webview' : 'ios';
  return /Android/.test(ua) ? 'android' : 'desktop';
}

/** Whether this window is the installed app. */
export function isInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  try { if (matchMedia('(display-mode: standalone)').matches) return true; } catch { /* no matchMedia */ }
  if ((navigator as Navigator & { standalone?: boolean }).standalone) return true;
  return new URLSearchParams(location.search).get('source') === 'app';
}

/** The strip's rule: a phone, a second visit or more, not installed, not dismissed in the last 30 days. */
export function shouldNudge(o: { installed: boolean; platform: Platform; visits: number; dismissedAt: number | null; now: number }): boolean {
  if (o.installed || o.platform === 'desktop') return false;
  if (o.dismissedAt && o.now - o.dismissedAt < 30 * 86_400_000) return false;
  return o.visits >= 2;
}

const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };

/** Counts this visit (once per page) and says whether the strip shows: not over a sheet the person is in. */
export function countVisit(): boolean {
  const visits = Number(read(VISITS_KEY) ?? '0') + 1;
  write(VISITS_KEY, String(visits));
  const busy = !!document.querySelector('dialog[open]');
  return !busy && shouldNudge({ installed: isInstalled(), platform: platformOf(navigator.userAgent), visits, dismissedAt: Number(read(DISMISS_KEY) ?? '') || null, now: Date.now() });
}

/** "✕": not for 30 days. */
export function dismissStrip() { write(DISMISS_KEY, String(Date.now())); }
