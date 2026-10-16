import type { NextConfig } from 'next';

/** Where the FeestFinder API runs. The browser never talks to it directly. */
const API = process.env.FF_API_ORIGIN ?? 'http://localhost:4000';

const dev = process.env.NODE_ENV !== 'production';

/** Where the map's PMTiles archive and glyphs live (the API's MAP_TILES_URL / MAP_GLYPHS_URL). */
const MAP_ORIGINS = [...new Set([process.env.MAP_TILES_URL, process.env.MAP_OVERVIEW_URL, process.env.MAP_GLYPHS_URL]
  .filter((u): u is string => !!u && /^https?:\/\//.test(u))
  .map((u) => new URL(u.replace(/\{[^}]+\}/g, 'x')).origin))];

/**
 * Every page is React; nothing is evaluated from strings: no 'unsafe-eval' outside
 * development (React's dev tools need it there).
 *
 * Scripts: this origin only. Next's own inline bootstrap scripts need 'unsafe-inline'
 * unless every page carries a per-request nonce — and a nonce makes every page dynamic,
 * which would give up the static and ISR caching the public pages rely on for speed. The
 * pages render no HTML from strings besides the escaped JSON-LD data blocks.
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  `connect-src 'self'${MAP_ORIGINS.map((o) => ` ${o}`).join('')}${dev ? ' ws: wss:' : ''}`,
  // The music players an artist's page embeds (festfinder-backend lib/mixes.ts EMBED_HOSTS), and nothing else.
  'frame-src https://w.soundcloud.com https://player-widget.mixcloud.com https://www.mixcloud.com https://open.spotify.com',
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(dev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), geolocation=(self), microphone=(), browsing-topics=()' },
  ...(dev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]),
];

const config: NextConfig = {
  // Strict mode's deliberate double mount would run the pages' effects twice in development
  // (the OAuth hand-back, timers, loaders).
  reactStrictMode: false,
  poweredByHeader: false,
  // Which build a bug report came from (kd/feedback/telemetry.ts).
  env: { NEXT_PUBLIC_BUILD_ID: (process.env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 12) },

  async rewrites() {
    return {
      beforeFiles: [
        // The Markdown versions for AI agents come straight from the API (first: they take ?lang=en too).
        { source: '/e/:file([^/]+\\.md)', destination: `${API}/e/:file` },
        { source: '/o/:file([^/]+\\.md)', destination: `${API}/o/:file` },
        { source: '/c/:file([^/]+\\.md)', destination: `${API}/c/:file` },
        { source: '/a/:file([^/]+\\.md)', destination: `${API}/a/:file` },
        { source: '/a.md', destination: `${API}/a.md` },
        { source: '/p/:file([^/]+\\.md)', destination: `${API}/p/:file` },
        { source: '/a/:by(style|city)/:file([^/]+\\.md)', destination: `${API}/a/:by/:file` },
        // The home page in English is /?lang=en: a cached page of its own.
        { source: '/', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/en' },
        { source: '/list', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/list/en' },
        // An event or organiser page in English is /e/<slug>?lang=en: a cached page of its own.
        { source: '/e/:slug', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/e/:slug/en' },
        { source: '/o/:slug', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/o/:slug/en' },
        { source: '/c/:slug', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/c/:slug/en' },
        { source: '/a/:slug', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/a/:slug/en' },
        { source: '/a', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/a/en' },
        // The slug first: a rewritten path is matched again by the rules after it (/p → /p/en must not become /p/en/en).
        { source: '/p/:slug', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/p/:slug/en' },
        { source: '/p', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/p/en' },
        { source: '/a/:by(style|city)/:slug', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/a/:by/:slug/en' },
      ],
      afterFiles: [],
      // Anything that is not one of this app's pages is the API: same origin for the
      // browser, so the session cookie and every relative fetch in the pages just work.
      // src/proxy.ts forwards most of these itself (it signs them); this catches the rest.
      fallback: [{ source: '/:path*', destination: `${API}/:path*` }],
    };
  },

  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      // The worker must never be served stale, or a fix to it would take a day to land.
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Service-Worker-Allowed', value: '/' }] },
      // The map's code (1.1 MB of MapLibre) and its loader: an hour without asking, then served
      // while it is checked. Not immutable: the names stay the same when they are upgraded.
      { source: '/ui/vendor/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }] },
      { source: '/ui/map/ff-map.js', headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }] },
      // The map's glyphs are one font, cut once.
      { source: '/ui/map/glyphs/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=2592000' }] },
    ];
  },

  async redirects() {
    // The back offices moved off /organizer and /admin, which are API paths.
    return [
      { source: '/organizer', destination: '/studio', permanent: false },
      { source: '/admin', destination: '/console', permanent: false },
      // The English pages' one address is ?lang=en.
      { source: '/en', destination: '/?lang=en', permanent: true },
      { source: '/list/en', destination: '/list?lang=en', permanent: true },
      { source: '/e/:slug/en', destination: '/e/:slug?lang=en', permanent: true },
      { source: '/o/:slug/en', destination: '/o/:slug?lang=en', permanent: true },
      { source: '/c/:slug/en', destination: '/c/:slug?lang=en', permanent: true },
      { source: '/a/en', destination: '/a?lang=en', permanent: true },
      { source: '/p/en', destination: '/p?lang=en', permanent: true },
      { source: '/p/:slug/en', destination: '/p/:slug?lang=en', permanent: true },
      { source: '/a/:slug/en', destination: '/a/:slug?lang=en', permanent: true },
      { source: '/a/:by(style|city)/:slug/en', destination: '/a/:by/:slug?lang=en', permanent: true },
      // The map is a view of the list.
      { source: '/map', destination: '/list?view=map', permanent: false },
      { source: '/app/map', destination: '/app/list', permanent: true },
    ];
  },
};

export default config;
