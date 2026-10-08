import { NextResponse, type NextRequest } from 'next/server';
import { isCutOver } from './kd/cutover';

/*
 * Every path that is not one of this app's pages is the API's: this proxy forwards it there with
 * fetch and answers with the API's response (the `fallback` rewrite in next.config.ts only
 * catches the paths the matcher below leaves out). Not a rewrite: on Vercel, request headers a
 * proxy adds never reach a rewrite to another deployment, from next.config or from the proxy.
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
/** Hop-by-hop and framing headers, which the fetch sets for itself. */
const HOP = ['host', 'connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'te', 'trailer', 'upgrade', 'expect', 'content-length'];

/** This app's own paths besides its pages: Next's, the sitemap and robots, the old landing URLs it redirects. */
const OWN = /^\/(_next\/|__next|sitemap\.xml$|robots\.txt$|(vi|en)\/)/;

/** Whether this app answers a path itself. The Markdown versions of its pages are the API's. */
function isOwn(path: string): boolean {
  return !path.endsWith('.md') && (OWN.test(path) || isCutOver(path));
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isOwn(pathname)) return NextResponse.next();
  const headers = new Headers(request.headers);
  // Only this proxy speaks these headers; Vercel's own (its OIDC token among them) stay here.
  for (const h of [...OURS, ...HOP]) headers.delete(h);
  for (const h of [...headers.keys()]) if (h.startsWith('x-vercel-') || h.startsWith('x-middleware-')) headers.delete(h);
  // Unencoded, so the body passes through as it came (fetch would decode it and keep the header).
  headers.set('accept-encoding', 'identity');
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
  const method = request.method;
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();
  let res: Response;
  try {
    res = await fetch(new URL(pathname + search, API), { method, headers, body, redirect: 'manual', cache: 'no-store' });
  } catch {
    const message = request.headers.get('x-lang') === 'en' ? 'FeestFinder is not answering. Try again in a moment.' : 'FeestFinder chưa phản hồi. Thử lại sau giây lát.';
    return NextResponse.json({ error: { code: 'unavailable', message } }, { status: 502 });
  }
  const out = new Headers(res.headers);
  for (const h of ['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'keep-alive']) out.delete(h);
  // Next reads a proxy response's Location as an absolute URL (and makes one on this site relative again).
  const location = out.get('location');
  if (location) {
    try { out.set('location', new URL(location, request.nextUrl).href); } catch { out.delete('location'); }
  }
  return new NextResponse(method === 'HEAD' ? null : res.body, { status: res.status, statusText: res.statusText, headers: out });
}

export const config = {
  // Not the files this app serves itself (public/), nor uploads (/files/): those that are the
  // API's (/ui/ files this app lacks, /files/) reach it through the fallback rewrite, unsigned,
  // which is fine because the API does not rate-limit them, and Vercel caches them.
  matcher: ['/((?!_next/static|_next/image|kd/|icons/|ui/|files/|favicon.ico|sw.js|manifest.webmanifest).*)'],
};
