import { isIP } from 'node:net';
import { badRequest } from './errors.ts';
import { L } from './i18n.ts';
import { UPLOAD_PATH } from './validate.ts';
import { baseOf } from './frame.ts';

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

/*
 * Resized copies: the pages show a stored picture through GET /img/<w>x<h>/<key>.webp
 * (routes/images.ts), where <key> is the link without its fragment as base64url, and the box is
 * one of a few: a width from IMG_WIDTHS and a shape from IMG_SHAPES. festfinder-web/src/kd/img.ts
 * builds the same addresses, with the same arithmetic.
 */

/** The widths a resized picture comes in. */
export const IMG_WIDTHS = [96, 192, 256, 384, 640, 828, 1080, 1280, 1600, 1920] as const;
/**
 * The shapes of a box, as its height over its width: square, card (1.6:1), wide (16:9), banner
 * (2:1) and strip (4:1). The height is Math.round(width × n / d), and every d is a power of two,
 * so it comes out the same in any language.
 */
export const IMG_SHAPES = { square: [1, 1], card: [5, 8], wide: [9, 16], banner: [1, 2], strip: [1, 4] } as const;
export type ImgShape = keyof typeof IMG_SHAPES;

export const imgHeight = (width: number, shape: ImgShape): number => Math.round((width * IMG_SHAPES[shape][0]) / IMG_SHAPES[shape][1]);

/** Whether width × height is one of the boxes. */
export function isImgBox(width: number, height: number): boolean {
  return (IMG_WIDTHS as readonly number[]).includes(width) && (Object.keys(IMG_SHAPES) as ImgShape[]).some((s) => imgHeight(width, s) === height);
}

/** A picture's key in /img: its link without the fragment (the framing is the screen's), as base64url. */
export const imgKey = (link: string): string => Buffer.from(baseOf(link), 'utf8').toString('base64url');

/** The link a key names, or null when the key is not one imgKey makes (one picture, one address). */
export function linkOfKey(key: string): string | null {
  if (!/^[\w-]{1,2800}$/.test(key)) return null;
  const link = Buffer.from(key, 'base64url').toString('utf8');
  return link && imgKey(link) === key ? link : null;
}

/** An https link with nothing a public fetch refuses (credentials, another port). */
export function isHttpsLink(link: string): boolean {
  try {
    const u = new URL(link);
    return u.protocol === 'https:' && !u.username && !u.password && (!u.port || u.port === '443') && u.hostname.includes('.');
  } catch {
    return false;
  }
}

/** The thumbnail steps Wikimedia makes for everyone. */
const WIKIMEDIA_STEPS = [500, 960, 1280, 1920];

/**
 * A smaller copy of a linked picture that its host makes itself, for a resize that needs `need`
 * pixels across: a lower Wikimedia thumbnail step, microCMS's (imgix) ?w=, Pinterest's 736 px copy.
 * Null when the host makes none or the link is small already: the link itself is fetched.
 */
export function upstreamFor(link: string, need: number): string | null {
  let u: URL;
  try { u = new URL(link); } catch { return null; }
  if (u.hostname === 'upload.wikimedia.org' && !u.search) {
    const m = u.pathname.match(/^(\/.+\/thumb\/.+\/)(\d+)px-([^/]+)$/);
    const step = WIKIMEDIA_STEPS.find((s) => s >= need);
    return m && step && step < Number(m[2]) ? `${u.origin}${m[1]}${step}px-${m[3]}` : null;
  }
  if (u.hostname === 'images.microcms-assets.io' && ![...u.searchParams.keys()].length) {
    u.searchParams.set('w', String(need));
    u.searchParams.set('fit', 'max');
    u.searchParams.set('fm', 'webp');
    return u.toString();
  }
  if (u.hostname === 'i.pinimg.com' && u.pathname.startsWith('/originals/') && need <= 736) {
    u.pathname = `/736x/${u.pathname.slice('/originals/'.length)}`;
    return u.toString();
  }
  return null;
}
