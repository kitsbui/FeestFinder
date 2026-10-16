import { isIP } from 'node:net';
import { badRequest } from './errors.ts';
import { L } from './i18n.ts';
import { UPLOAD_PATH } from './validate.ts';

/*
 * Images FeestFinder shows from a link: a person's or an artist's photo, an organiser's logo
 * and cover, a project's cover, the moments on a profile. Only an event's own media is
 * uploaded (routes/uploads.ts). Everything here is pure: services/remote-images.ts fetches.
 */

/**
 * Sites whose image addresses are signed and stop working within days (Facebook and Instagram
 * CDNs, TikTok's): a profile would lose its picture without anyone changing it.
 */
const EXPIRING_HOSTS = ['fbcdn.net', 'cdninstagram.com', 'tiktokcdn.com', 'tiktokcdn-us.com', 'tiktokv.com'];
/** Query parameters that mark a signed, expiring address on any site. */
const EXPIRING_PARAMS = ['x-amz-signature', 'x-amz-expires', 'expires', 'x-expires', 'oe', 'key-pair-id'];

const hostIs = (host: string, list: string[]) => list.some((h) => host === h || host.endsWith(`.${h}`));

export const refuse = {
  url: () => badRequest('invalid_image_link', L('Paste a full https:// link to an image', 'Hãy dán một link ảnh đầy đủ bắt đầu bằng https://')),
  expiring: () => badRequest('image_link_expires', L('This link expires; use another one', 'Link ảnh này có hạn dùng, hãy dùng link khác')),
  upload: () => badRequest('upload_not_allowed', L('Paste an image link instead', 'Hãy dán link ảnh thay vì tải lên')),
};

/**
 * A pasted link as the address to fetch: https only, no credentials, ports or bare IPs, and
 * share pages turned into the file itself (Dropbox, GitHub, Google Drive). `ownHosts` are the
 * hosts FeestFinder's own uploads are served from, refused here: those are event media.
 */
export function normalizeImageUrl(raw: string, ownHosts: string[] = []): string {
  const text = raw.trim();
  if (UPLOAD_PATH.test(text) || text.startsWith('/files/')) throw refuse.upload();
  let u: URL;
  try { u = new URL(text); } catch { throw refuse.url(); }
  if (u.protocol !== 'https:' || text.length > 2048 || u.username || u.password || (u.port && u.port !== '443')) throw refuse.url();
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host.includes('.') || isIP(host) || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) throw refuse.url();
  if (ownHosts.some((h) => h && host === h.toLowerCase())) throw refuse.upload();
  if (hostIs(host, EXPIRING_HOSTS)) throw refuse.expiring();
  for (const k of u.searchParams.keys()) if (EXPIRING_PARAMS.includes(k.toLowerCase())) throw refuse.expiring();
  u.hash = '';

  // Dropbox: the share page becomes the file.
  if (hostIs(host, ['dropbox.com'])) {
    u.searchParams.delete('dl');
    u.searchParams.set('raw', '1');
    return u.toString();
  }
  // GitHub: a file's page becomes its raw bytes.
  const blob = host === 'github.com' ? u.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/(.+)$/) : null;
  if (blob) return `https://raw.githubusercontent.com/${blob[1]}/${blob[2]}/${blob[3]}`;
  // Google Drive: a shared file's page becomes its thumbnail, served at up to 2000 pixels.
  if (host === 'drive.google.com') {
    const id = u.pathname.match(/^\/file\/d\/([\w-]{10,})/)?.[1] ?? u.searchParams.get('id');
    if (id && /^[\w-]{10,}$/.test(id)) return `https://drive.google.com/thumbnail?id=${id}&sz=w2000`;
  }
  return u.toString();
}

/** The picture a web page names for link previews (og:image, then twitter:image), as an absolute URL. */
export function previewImageOf(html: string, pageUrl: string): string | null {
  const head = html.slice(0, 200_000);
  for (const name of ['og:image:secure_url', 'og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']) {
    for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
      const key = tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
      if (key !== name) continue;
      const content = tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1];
      if (!content) continue;
      try { return new URL(content.replaceAll('&amp;', '&').trim(), pageUrl).toString(); } catch { /* the next one */ }
    }
  }
  return null;
}
