/**
 * The attendee app as an installed app: the service worker that keeps tickets working
 * offline, and browser push through it.
 */
import { FF } from './ff';

let vapidKey: string | null | undefined;

/**
 * Register /sw.js. Production builds only: in development, Next serves unhashed modules
 * that a cache-first worker would pin to stale copies.
 */
export function registerServiceWorker(): void {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((e) => console.warn('[ff] service worker', e));
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
