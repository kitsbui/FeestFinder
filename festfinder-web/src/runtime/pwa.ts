/**
 * The attendee app as an installed app: the service worker that keeps tickets working
 * offline, and browser push through it.
 */
import { FF } from './ff';

let vapidKey: string | null | undefined;

/** The browser's own install prompt (Chrome, Edge, Samsung Internet), kept until a tap asks for it. */
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
type WithPrompt = Window & { __ffInstall?: InstallPrompt | null };
/** The prompt the head's line kept (kd/ui/worker.tsx InstallCapture), or one that comes later. */
let deferred: InstallPrompt | null = typeof window !== 'undefined' ? (window as WithPrompt).__ffInstall ?? null : null;
if (typeof window !== 'undefined') {
  window.addEventListener('ff:installable', () => { deferred = (window as WithPrompt).__ffInstall ?? deferred; });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    (window as WithPrompt).__ffInstall = null;
    try { localStorage.setItem('ff:installed', '1'); } catch { /* storage blocked */ }
    FF.track('install', { kind: 'appinstalled' });
    window.dispatchEvent(new Event('ff:installed'));
  });
}

/** Whether the browser will show its own install prompt on a tap. */
export const canPromptInstall = () => !!(deferred ?? (window as WithPrompt).__ffInstall);

/** Shows the browser's install prompt; false when it has none (the steps sheet then). */
export async function promptInstall(): Promise<boolean> {
  const p = deferred ?? (window as WithPrompt).__ffInstall ?? null;
  if (!p) return false;
  deferred = null;
  (window as WithPrompt).__ffInstall = null;
  FF.track('install_prompt', { kind: 'native' });
  await p.prompt();
  const choice = await p.userChoice.catch(() => ({ outcome: 'dismissed' as const }));
  FF.track('install_prompt', { kind: 'native', outcome: choice.outcome });
  return true;
}

/**
 * Register /sw.js. Production builds only: in development, Next serves unhashed modules
 * that a cache-first worker would pin to stale copies.
 */
let registered = false;

export function registerWorker(): boolean {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return false;
  if (registered) return true;
  registered = true;
  // A page a worker already controlled is an update when the controller changes; the very first
  // install also fires controllerchange, and must not reload a first visit (meeting 2026-10-20).
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) reloadWhenIdle(); });
  // updateViaCache 'none': the browser asks for /sw.js itself every time (the server says no-cache too).
  navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then((reg) => {
    const check = () => { reg.update().catch(() => { /* offline: next time */ }); };
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
    setInterval(check, 30 * 60_000);
  }).catch((e) => console.warn('[ff] service worker', e));
  return true;
}

/** Nobody is typing, no sheet is open and the page has not scrolled in the last two seconds. */
export function isIdle(doc: Pick<Document, 'activeElement' | 'querySelector'> = document, lastScroll = lastScrollAt, now = Date.now()): boolean {
  const el = doc.activeElement as HTMLElement | null;
  const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
  const sheet = !!doc.querySelector('dialog[open], [data-sheet-open]');
  return !typing && !sheet && now - lastScroll > 2000;
}

let lastScrollAt = 0;
if (typeof window !== 'undefined') window.addEventListener('scroll', () => { lastScrollAt = Date.now(); }, { passive: true, capture: true });

/**
 * A new build took over (growth plan card F, D18): the page reloads once, when it is idle and
 * seen; otherwise when the person next leaves or comes back to it. A hidden tab waits.
 */
function reloadWhenIdle(): void {
  let done = false;
  const go = () => { if (!done) { done = true; location.reload(); } };
  const tryNow = () => { if (document.visibilityState === 'visible' && isIdle()) go(); };
  tryNow();
  if (done) return;
  const timer = setInterval(tryNow, 5000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tryNow(); else { clearInterval(timer); } });
  window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
}

/** The worker, and the push key ahead of a tap that switches push on (the app's screens). */
export function registerServiceWorker(): void {
  if (!registerWorker()) return;
  // Fetched ahead so that switching push on can ask for permission straight away, inside
  // the tap: browsers only show the prompt during a user gesture.
  FF.maybe(FF.get('/push/public-key'), { key: null }).then((r: { key: string | null }) => { vapidKey = r.key; });
}

export type PushResult = 'on' | 'denied' | 'unsupported' | 'unconfigured';

/** Ask for notifications and register this browser as one of the person's devices. */
export async function enablePush(): Promise<PushResult> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported';
  if (!vapidKey) return 'unconfigured';
  const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
  if (permission !== 'granted') return 'denied';
  const reg = await navigator.serviceWorker.getRegistration('/');
  if (!reg) return 'unsupported';
  const sub = (await reg.pushManager.getSubscription())
    ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: fromBase64Url(vapidKey) }));
  await FF.post('/me/devices', { token: JSON.stringify(sub.toJSON()), platform: 'web' });
  return 'on';
}

/**
 * Before signing out: stop this browser receiving the person's notifications and drop
 * their cached tickets and plans from the device.
 */
export async function forgetDevice(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration('/');
  if (!reg) return;
  const sub = await reg.pushManager?.getSubscription();
  if (sub) {
    await FF.maybe(FF.del('/me/devices/' + encodeURIComponent(JSON.stringify(sub.toJSON()))), null);
    await sub.unsubscribe().catch(() => false);
  }
  reg.active?.postMessage('ff:signed-out');
}

function fromBase64Url(s: string): Uint8Array<ArrayBuffer> {
  const b64 = (s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
