import { NextResponse, type NextRequest } from 'next/server';
import { isCutOver } from './kd/cutover';

/*
 * Every path that is not one of this app's pages is the API's: this proxy rewrites it there
 * (the `fallback` rewrite in next.config.ts only catches the paths the matcher below leaves out).
 * The rewrite is done here, not left to that fallback, because on Vercel the request headers a
 * proxy sets with NextResponse.next() never reach a next.config rewrite to another origin; they
 * do reach a rewrite the proxy makes itself.
 *
 * Vercel overwrites X-Forwarded-For on the way in, so the API would see this app's address for
 * every visitor: one rate limit, one sign-in throttle and one view count for everyone. With
 * WEB_PROXY_SECRET set here and on the API, each request carries the visitor's address and
 * country and this site's origin (so Google sign-in comes back here), signed by the secret.
 * Without it, the API sees the request as before.
 *
 * Signed only on Vercel, whose edge sets X-Forwarded-For itself: anywhere else a client could put
 * any address there, and this would sign it.
 */

/** Where the FeestFinder API runs (as in next.config.ts). */
const API = process.env.FF_API_ORIGIN ?? 'http://localhost:4000';
const SECRET = process.env.VERCEL === '1' ? (process.env.WEB_PROXY_SECRET ?? '').trim() : '';
const OURS = ['x-ff-web-secret', 'x-ff-client-ip', 'x-ff-client-country', 'x-ff-web-origin'];

/** This app's own paths besides its pages: Next's, the sitemap and robots, the old landing URLs it redirects. */
const OWN = /^\/(_next\/|__next|sitemap\.xml$|robots\.txt$|(vi|en)\/)/;

/** Whether this app answers a path itself. The Markdown versions of its pages are the API's. */
function isOwn(path: string): boolean {
  return !path.endsWith('.md') && (OWN.test(path) || isCutOver(path));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isOwn(pathname)) return NextResponse.next();
  const headers = new Headers(request.headers);
  // Only this proxy speaks these headers.
  for (const h of OURS) headers.delete(h);
  // Vercel sets X-Forwarded-For to the visitor's address and overwrites anything a client sent.
  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || request.headers.get('x-real-ip');
  if (SECRET.length >= 32 && ip) {
    headers.set('x-ff-web-secret', SECRET);
    headers.set('x-ff-client-ip', ip);
    const country = request.headers.get('x-vercel-ip-country');
    if (country) headers.set('x-ff-client-country', country);
    // The address the visitor used (Vercel's edge sets these); the API takes it only if it is one of ours.
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '');
    if (host) headers.set('x-ff-web-origin', `${proto}://${host}`);
  }
  return NextResponse.rewrite(new URL(pathname + search, API), { request: { headers } });
}

export const config = {
  // Not the files this app serves itself (public/), nor uploads (/files/): those that are the
  // API's (/ui/ files this app lacks, /files/) reach it through the fallback rewrite, unsigned,
  // which is fine because the API does not rate-limit them.
  matcher: ['/((?!_next/static|_next/image|kd/|icons/|ui/|files/|favicon.ico|sw.js|manifest.webmanifest).*)'],
};
