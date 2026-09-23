/*
 * FeestFinder's service worker.
 *
 * The attendee app promises that tickets, saved events and set times still work with no
 * signal, which is exactly where festivals are. This keeps that promise:
 *
 *  - Next's build assets: cache-first (their names change when they do)
 *  - design assets and icons: from the cache, refreshed in the background (fixed names)
 *  - /app pages: network-first, falling back to the last copy that loaded
 *  - the signed-in person's data (tickets, saves, plan, events): network-first, falling
 *    back to the last answer, and wiped on sign-out or when someone else signs in
 *  - Web Push: shows the notification and opens its link
 */

const VERSION = 'ff-2';
const STATIC = VERSION + '-static';
const PAGES = VERSION + '-pages';
const DATA = VERSION + '-data';

/** API reads the app needs offline. Everything else goes straight to the network. */
const DATA_PATHS = [/^\/auth\/session$/, /^\/me(\/|$)/, /^\/events(\/|$)/, /^\/genres$/, /^\/plans\//];
/** Requests after which cached personal data belongs to nobody (or someone else). */
const SESSION_CHANGES = [/^\/auth\/session$/, /^\/auth\/login$/, /^\/auth\/otp\/verify$/, /^\/auth\/oauth\//, /^\/auth\/register$/];

/** How long to wait on a bad connection before answering from the cache. */
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGES)
      .then((c) => c.add(new Request('/app', { credentials: 'same-origin' })))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (!key.startsWith(VERSION + '-')) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'ff:signed-out') event.waitUntil(forgetPersonalData());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.method !== 'GET') {
    if (SESSION_CHANGES.some((re) => re.test(url.pathname))) event.waitUntil(forgetPersonalData());
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(req));
    return;
  }

  if (url.pathname.startsWith('/ui/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(staleWhileRevalidate(req, event));
    return;
  }

  if (req.mode === 'navigate') {
    if (url.pathname === '/app' || url.pathname.startsWith('/app/')) event.respondWith(page(req));
    return;
  }

  if (DATA_PATHS.some((re) => re.test(url.pathname))) event.respondWith(networkFirst(req, DATA));
});

async function cacheFirst(req) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok && res.type === 'basic') cache.put(req, res.clone());
  return res;
}

/** Same name, new content after a deploy: answer from the cache, fetch the new copy for next time. */
async function staleWhileRevalidate(req, event) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(req);
  const fresh = fetch(req).then((res) => {
    if (res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  });
  if (!hit) return fresh;
  event.waitUntil(fresh.catch(() => {}));
  return hit;
}

/** An /app page: fresh when there is signal, the last good copy (or the app's home) when not. */
async function page(req) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(req);
    if (res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = (await cache.match(req, { ignoreSearch: true })) || (await cache.match('/app'));
    if (hit) return hit;
    throw err;
  }
}

async function networkFirst(req, name) {
  const cache = await caches.open(name);
  const network = fetch(req).then((res) => {
    if (res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  });
  const cached = await cache.match(req);
  if (!cached) return network;
  network.catch(() => {}); // the cache answers instead
  // A cached answer exists: use the network if it answers in time, the cache if not.
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), NETWORK_TIMEOUT_MS));
  try {
    return (await Promise.race([network, timeout])) || cached;
  } catch {
    return cached;
  }
}

async function forgetPersonalData() {
  await caches.delete(DATA);
  await caches.delete(PAGES);
}

// ---- push --------------------------------------------------------------------------------

self.addEventListener('push', (event) => {
  let msg = {};
  try {
    msg = event.data ? event.data.json() : {};
  } catch {
    msg = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(self.registration.showNotification(msg.title || 'FeestFinder', {
    body: msg.body || '',
    icon: '/icons/app-icon-192.png',
    // Android draws the badge from its alpha alone: the white mark on transparent.
    badge: '/icons/notification-badge.png',
    tag: msg.tag || undefined,
    lang: 'vi',
    // A path on this site only: '//host' and '/\\host' lead elsewhere.
    data: { url: typeof msg.url === 'string' && /^\/(?![/\\])/.test(msg.url) ? msg.url : '/app/notifications' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/app', self.location.origin).href;
  event.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const app = open.find((c) => new URL(c.url).pathname.startsWith('/app'));
    if (app) {
      await app.focus();
      return app.navigate(url);
    }
    return self.clients.openWindow(url);
  })());
});
