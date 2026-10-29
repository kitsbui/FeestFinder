import type { NextConfig } from 'next';
import { buildId } from './scripts/build-id.ts';
import { LIST_KEYS } from './src/kd/home-place.ts';

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
  // An artist's MP3 playlist (kd/web/artist/playlist.tsx) streams from the artist's own https links.
  "media-src 'self' https:",
  `connect-src 'self'${MAP_ORIGINS.map((o) => ` ${o}`).join('')}${dev ? ' ws: wss:' : ''}`,
  // The music players an artist's page and a blog post embed (festfinder-backend lib/mixes.ts EMBED_HOSTS and YOUTUBE_EMBED_HOST), and nothing else.
  'frame-src https://w.soundcloud.com https://player-widget.mixcloud.com https://www.mixcloud.com https://open.spotify.com https://www.youtube-nocookie.com',
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

/*
 * While no other key the home page's list reads is in the address (kd/home-place.ts LIST_KEYS),
 * /?city=<slug> is that city's own cached page (app/(kd)/in/[city]); with one, the browser asks the
 * API for what it narrows.
 */
const ONLY_CITY = LIST_KEYS.map((key) => ({ type: 'query' as const, key }));
const CITY = { type: 'query' as const, key: 'city', value: '(?<city>[a-z0-9-]+)' };

const config: NextConfig = {
  // festfinder-backend's Lighthouse runner (tools/lighthouse, --serve) builds into .next-lh, beside the screen checks' .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Strict mode's deliberate double mount would run the pages' effects twice in development
  // (the OAuth hand-back, timers, loaders).
  reactStrictMode: false,
  poweredByHeader: false,
  // Which build a bug report came from (kd/feedback/telemetry.ts). A build whose API sits behind
  // Vercel's protection (a preview: FF_API_BYPASS) draws stored pictures from their own links, since
  // /img reaches the API through the fallback rewrite, which cannot send the bypass (kd/img.ts).
  env: { NEXT_PUBLIC_BUILD_ID: buildId(), NEXT_PUBLIC_IMG_RAW: process.env.FF_API_BYPASS?.trim() ? '1' : '' },
  // src/proxy.ts sees the request as it came: Next would hide the router's headers from it
  // (next-router-prefetch among them), and the proxy answers a prefetch it would move with no content.
  // It drops the router's `_rsc` from the address itself, and its redirects go out as it writes them
  // (absolute, on the host the visitor asked for; Next no longer makes them relative).
  skipProxyUrlNormalize: true,

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
        { source: '/blog/:file([^/]+\\.md)', destination: `${API}/blog/:file` },
        { source: '/a/:by(style|city)/:file([^/]+\\.md)', destination: `${API}/a/:by/:file` },
        // One city's home page, /?city=<slug> with nothing else the list reads, is a cached page of its own
        // in each language, drawn with that city's nights (first: the rules below would take its `/`).
        { source: '/', has: [CITY], missing: [...ONLY_CITY, { type: 'query', key: 'lang' }], destination: '/in/:city' },
        { source: '/', has: [CITY, { type: 'query', key: 'lang', value: 'vi' }], missing: ONLY_CITY, destination: '/in/:city' },
        { source: '/', has: [CITY, { type: 'query', key: 'lang', value: '(?<lang>en|th|ja|id)' }], missing: ONLY_CITY, destination: '/in/:city/:lang' },
        // The home page in English is /?lang=en: a cached page of its own; in Thai, Japanese and
        // Indonesian /?lang=th|ja|id (design v2 phase 10), each its own too.
        { source: '/', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/en' },
        { source: '/', has: [{ type: 'query', key: 'lang', value: '(?<lang>th|ja|id)' }], destination: '/:lang' },
        // An event or organiser page in English is /e/<slug>?lang=en: a cached page of its own.
        { source: '/e/:slug', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/e/:slug/en' },
        { source: '/e/:slug', has: [{ type: 'query', key: 'lang', value: '(?<lang>th|ja|id)' }], destination: '/e/:slug/:lang' },
        { source: '/o/:slug', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/o/:slug/en' },
        { source: '/o/:slug', has: [{ type: 'query', key: 'lang', value: '(?<lang>th|ja|id)' }], destination: '/o/:slug/:lang' },
        { source: '/c/:slug', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/c/:slug/en' },
        { source: '/c/:slug', has: [{ type: 'query', key: 'lang', value: '(?<lang>th|ja|id)' }], destination: '/c/:slug/:lang' },
        { source: '/a/:slug', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/a/:slug/en' },
        { source: '/a/:slug', has: [{ type: 'query', key: 'lang', value: '(?<lang>th|ja|id)' }], destination: '/a/:slug/:lang' },
        { source: '/a', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/a/en' },
        { source: '/a', has: [{ type: 'query', key: 'lang', value: '(?<lang>th|ja|id)' }], destination: '/a/:lang' },
        // The slug first: a rewritten path is matched again by the rules after it (/p → /p/en must not become /p/en/en).
        { source: '/p/:slug', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/p/:slug/en' },
        { source: '/p/:slug', has: [{ type: 'query', key: 'lang', value: '(?<lang>th|ja|id)' }], destination: '/p/:slug/:lang' },
        { source: '/p', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/p/en' },
        { source: '/p', has: [{ type: 'query', key: 'lang', value: '(?<lang>th|ja|id)' }], destination: '/p/:lang' },
        // The blog's frame speaks Vietnamese and English; Thai, Japanese and Indonesian read the English one. A post keeps the language it was written in.
        { source: '/blog/:slug', has: [{ type: 'query', key: 'lang', value: '(en|th|ja|id)' }], destination: '/blog/:slug/en' },
        { source: '/blog', has: [{ type: 'query', key: 'lang', value: '(en|th|ja|id)' }], destination: '/blog/en' },
        { source: '/a/:by(style|city)/:slug', has: [{ type: 'query', key: 'lang', value: 'en' }], destination: '/a/:by/:slug/en' },
        { source: '/a/:by(style|city)/:slug', has: [{ type: 'query', key: 'lang', value: '(?<lang>th|ja|id)' }], destination: '/a/:by/:slug/:lang' },
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
      // Noto Sans JP (scripts/fonts-css.ts): file names change only with the package version.
      { source: '/fonts/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=2592000' }] },
    ];
  },

  async redirects() {
    // The back offices moved off /organizer and /admin, which are API paths.
    return [
      { source: '/organizer', destination: '/studio', permanent: false },
      { source: '/admin', destination: '/console', permanent: false },
      // The English pages' one address is ?lang=en.
      { source: '/en', destination: '/?lang=en', permanent: true },
      // The list is the home page (owner, 2026-10-17): its old address keeps its filters.
      { source: '/list', destination: '/', permanent: true },
      { source: '/list/en', destination: '/?lang=en', permanent: true },
      { source: '/e/:slug/en', destination: '/e/:slug?lang=en', permanent: true },
      { source: '/o/:slug/en', destination: '/o/:slug?lang=en', permanent: true },
      { source: '/c/:slug/en', destination: '/c/:slug?lang=en', permanent: true },
      { source: '/a/en', destination: '/a?lang=en', permanent: true },
      { source: '/p/en', destination: '/p?lang=en', permanent: true },
      { source: '/p/:slug/en', destination: '/p/:slug?lang=en', permanent: true },
      { source: '/blog/en', destination: '/blog?lang=en', permanent: true },
      { source: '/blog/:slug/en', destination: '/blog/:slug?lang=en', permanent: true },
      { source: '/a/:slug/en', destination: '/a/:slug?lang=en', permanent: true },
      { source: '/a/:by(style|city)/:slug/en', destination: '/a/:by/:slug?lang=en', permanent: true },
      // One city's home page has the home page's address.
      { source: '/in/:city', destination: '/?city=:city', permanent: true },
      { source: '/in/:city/:lang(en|th|ja|id)', destination: '/?city=:city&lang=:lang', permanent: true },
      // One country's home page (src/proxy.ts rewrites the home page there for a visitor from it) is the home page.
      { source: '/from/:country', destination: '/', permanent: true },
      { source: '/from/:country/:lang(en|th|ja|id)', destination: '/?lang=:lang', permanent: true },
      // The same for Thai, Japanese and Indonesian (design v2 phase 10).
      { source: '/:lang(th|ja|id)', destination: '/?lang=:lang', permanent: true },
      { source: '/list/:lang(th|ja|id)', destination: '/?lang=:lang', permanent: true },
      { source: '/e/:slug/:lang(th|ja|id)', destination: '/e/:slug?lang=:lang', permanent: true },
      { source: '/o/:slug/:lang(th|ja|id)', destination: '/o/:slug?lang=:lang', permanent: true },
      { source: '/c/:slug/:lang(th|ja|id)', destination: '/c/:slug?lang=:lang', permanent: true },
      { source: '/a/:lang(th|ja|id)', destination: '/a?lang=:lang', permanent: true },
      { source: '/p/:lang(th|ja|id)', destination: '/p?lang=:lang', permanent: true },
      { source: '/p/:slug/:lang(th|ja|id)', destination: '/p/:slug?lang=:lang', permanent: true },
      { source: '/a/:slug/:lang(th|ja|id)', destination: '/a/:slug?lang=:lang', permanent: true },
      { source: '/a/:by(style|city)/:slug/:lang(th|ja|id)', destination: '/a/:by/:slug?lang=:lang', permanent: true },
      // The map is a view of the list.
      { source: '/map', destination: '/?view=map', permanent: false },
      // FeestFinder sells no tickets and runs no door (owner, 2026-10-20): the old screens lead to their nearest place.
      { source: '/app/tickets', destination: '/profile', permanent: true },
      { source: '/app/checkout/:slug', destination: '/e/:slug', permanent: true },
      { source: '/studio/:page(attendees|door|revenue|promos)', destination: '/studio', permanent: true },
      { source: '/console/orders/:rest*', destination: '/console', permanent: true },
      { source: '/app/map', destination: '/?view=map', permanent: true },
    ];
  },
};

export default config;
