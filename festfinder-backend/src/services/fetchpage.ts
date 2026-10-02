import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export class PageUnavailable extends Error {
  readonly reason: 'bad_url' | 'private_address' | 'not_html' | 'too_large' | 'upstream';
  constructor(reason: PageUnavailable['reason'], message?: string) {
    super(message ?? reason);
    this.reason = reason;
  }
}

export interface FetchedPage { url: string; html: string }
export type PageFetcher = (url: string) => Promise<FetchedPage>;

/** Loopback, private, link-local, carrier-grade NAT, multicast and reserved addresses. */
export function isPrivateAddress(ip: string): boolean {
  const v4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (isIP(v4) === 4) {
    const [a, b] = v4.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
  }
  const v6 = ip.toLowerCase();
  return v6 === '::' || v6 === '::1' || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6) || v6.startsWith('ff');
}

async function assertPublicHost(hostname: string) {
  const host = hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) throw new PageUnavailable('private_address');
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((a) => a.address);
  if (!addresses.length) throw new PageUnavailable('upstream', `cannot resolve ${host}`);
  if (addresses.some(isPrivateAddress)) throw new PageUnavailable('private_address');
}

/**
 * Fetches a public web page someone pasted, as a browser would, but never anything on a
 * private network: every hop of a redirect is checked, and the page is capped at 2 MB.
 */
export async function fetchPublicPage(raw: string, opts: { maxBytes?: number; timeoutMs?: number } = {}): Promise<FetchedPage> {
  const maxBytes = opts.maxBytes ?? 2_000_000;
  let current: URL;
  try { current = new URL(raw); } catch { throw new PageUnavailable('bad_url'); }
  for (let hop = 0; hop < 4; hop++) {
    if (!['http:', 'https:'].includes(current.protocol) || (current.port && !['80', '443'].includes(current.port))) throw new PageUnavailable('bad_url');
    if (current.username || current.password) throw new PageUnavailable('bad_url');
    await assertPublicHost(current.hostname);
    let res: Response;
    try {
      res = await fetch(current, {
        redirect: 'manual',
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; FeestFinderBot/1.0; +https://festfinder.vn)', accept: 'text/html,application/xhtml+xml', 'accept-language': 'vi,en;q=0.8' },
        signal: AbortSignal.timeout(opts.timeoutMs ?? 8000),
      });
    } catch (e) {
      throw new PageUnavailable('upstream', (e as Error).message);
    }
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, current);
      continue;
    }
    if (!res.ok) throw new PageUnavailable('upstream', `status ${res.status}`);
    if (!/text\/html|application\/xhtml\+xml/i.test(res.headers.get('content-type') ?? '')) throw new PageUnavailable('not_html');
    const reader = res.body?.getReader();
    if (!reader) throw new PageUnavailable('upstream', 'empty body');
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new PageUnavailable('too_large'); }
      chunks.push(value);
    }
    return { url: current.toString(), html: Buffer.concat(chunks).toString('utf8') };
  }
  throw new PageUnavailable('upstream', 'too many redirects');
}
