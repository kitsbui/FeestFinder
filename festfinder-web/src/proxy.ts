import { NextResponse, type NextRequest } from 'next/server';

/*
 * When this app and the API are separate deployments (two Vercel projects), every path that is
 * not one of this app's pages goes to the API through the `fallback` rewrite in next.config.ts.
 * Vercel overwrites X-Forwarded-For on the way in, so the API would see this app's address for
 * every visitor: one rate limit, one sign-in throttle and one view count for everyone. With
 * WEB_PROXY_SECRET set here and on the API, each request carries the visitor's address and
 * country and this site's origin (so Google sign-in comes back here), signed by the secret.
 * Without it, nothing changes.
 *
 * Only on Vercel, whose edge sets X-Forwarded-For itself: anywhere else a client could put any
 * address there, and this would sign it.
 */

const SECRET = process.env.VERCEL === '1' ? (process.env.WEB_PROXY_SECRET ?? '').trim() : '';
const OURS = ['x-ff-web-secret', 'x-ff-client-ip', 'x-ff-client-country', 'x-ff-web-origin'];

export function proxy(request: NextRequest) {
  if (SECRET.length < 32) return NextResponse.next();
  const headers = new Headers(request.headers);
  // Only this proxy speaks these headers.
  for (const h of OURS) headers.delete(h);
  // Vercel sets X-Forwarded-For to the visitor's address and overwrites anything a client sent.
  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || request.headers.get('x-real-ip');
  if (ip) {
    headers.set('x-ff-web-secret', SECRET);
    headers.set('x-ff-client-ip', ip);
    const country = request.headers.get('x-vercel-ip-country');
    if (country) headers.set('x-ff-client-country', country);
    // The address the visitor used (Vercel's edge sets these); the API takes it only if it is one of ours.
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '');
    if (host) headers.set('x-ff-web-origin', `${proto}://${host}`);
  }
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Everything but the build's own files: any other path may end at the API.
  matcher: ['/((?!_next/static|_next/image).*)'],
};
