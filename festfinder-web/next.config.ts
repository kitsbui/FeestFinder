import type { NextConfig } from 'next';

/** Where the FeestFinder API runs. The browser never talks to it directly. */
const API = process.env.FF_API_ORIGIN ?? 'http://localhost:4000';

const dev = process.env.NODE_ENV !== 'production';

/**
 * The screens are compiled to React, so unlike the design runtime nothing is evaluated
 * from strings: no 'unsafe-eval' outside development (React's dev tools need it there).
 *
 * Scripts: this origin only. Next's own inline bootstrap scripts need 'unsafe-inline'
 * unless every page carries a per-request nonce — and a nonce makes every page dynamic,
 * which would give up the static and ISR caching the public pages rely on for speed. The
 * pages render no HTML from strings besides the escaped JSON-LD data blocks.
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  `connect-src 'self'${dev ? ' ws: wss:' : ''}`,
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
  // The screens' logic was written for the design runtime, which mounted each screen once.
  // Strict mode's deliberate double mount would start its timers and loaders twice.
  reactStrictMode: false,
  poweredByHeader: false,

  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      // Anything that is not one of this app's pages is the API: same origin for the
      // browser, so the session cookie and every relative fetch in the screens just work.
      fallback: [{ source: '/:path*', destination: `${API}/:path*` }],
    };
  },

  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      // The worker must never be served stale, or a fix to it would take a day to land.
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Service-Worker-Allowed', value: '/' }] },
    ];
  },

  async redirects() {
    // The back offices moved off /organizer and /admin, which are API paths.
    return [
      { source: '/organizer', destination: '/studio', permanent: false },
      { source: '/admin', destination: '/console', permanent: false },
    ];
  },
};

export default config;
