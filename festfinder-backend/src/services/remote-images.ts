import type { Ctx } from '../context.ts';
import { many, one } from '../db/index.ts';
import { AppError, badRequest } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { baseOf, fragmentIsFrame, frameOf, withFrame } from '../lib/frame.ts';
import { webImageInfo, type WebImageMime } from '../lib/image.ts';
import { checkDimensions, type ImagePurpose } from '../lib/image-rules.ts';
import { isHttpsLink, normalizeImageUrl, previewImageOf, upstreamFor } from '../lib/remote-image.ts';
import { UPLOAD_PATH } from '../lib/validate.ts';
import { sha256 } from '../lib/crypto.ts';
import { fetchPublic, PageUnavailable } from './fetchpage.ts';
import { notifyOrganizer, notifyUser } from './notify.ts';

/*
 * Linked images: every picture that is not an event's own media is a link, checked here before
 * it is saved (it opens, it is an image, it is big enough, it will not expire) and checked again
 * every week by the checkRemoteImages job. A link that keeps failing is marked broken and its
 * owner is told; the screens show the initials or the art underneath meanwhile.
 */

/** What reading the start of a link gives back. */
export interface ImageFetch { url: string; status: number; contentType: string; bytes: Buffer; totalBytes: number | null }
export type ImageFetcher = (url: string) => Promise<ImageFetch>;

/** Reads only the head of a link: enough for an image's size, or a page's preview picture. */
export const fetchImageHead: ImageFetcher = (url) => fetchPublic(url, {
  accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif,text/html;q=0.5',
  headers: { range: 'bytes=0-262143' },
  maxBytes: 262_144,
  truncate: true,
  timeoutMs: 8000,
});

/**
 * The network of the screen tests and the offline preview (FAKE_REMOTE_MEDIA): every https link is
 * a 1600×1000 PNG, except one with "broken" in it, which does not open. Never used in production.
 */
export const fakeImageFetcher: ImageFetcher = async (url) => {
  if (/broken/i.test(url)) throw new PageUnavailable('upstream', 'fake network: broken');
  const png = Buffer.alloc(33);
  png.writeUInt32BE(0x89504e47, 0); png.write('IHDR', 12, 'ascii'); png.writeUInt32BE(1600, 16); png.writeUInt32BE(1000, 20);
  return { url, status: 200, contentType: 'image/png', bytes: png, totalBytes: 180_000 };
};

/** Heavier than this and a phone on 4G waits too long for one picture. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Reads a whole linked image, to resize it for GET /img (resizedImage below). */
export const fetchImageFull: ImageFetcher = (url) => fetchPublic(url, {
  accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif',
  types: /^(?:image\/|application\/octet-stream|binary\/octet-stream)|^$/i,
  maxBytes: MAX_IMAGE_BYTES,
  timeoutMs: 8000,
  // GET /img's fetch: https on every hop, and 12 s for the whole of it.
  httpsOnly: true,
  totalMs: 12_000,
});

/**
 * The whole-file network of the screen tests and the offline preview (FAKE_REMOTE_MEDIA): only
 * https://pics.example/ answers, with a real PNG (1600×1000, or ?w=&h=); any other link does not
 * open, so /img sends the browser to the link itself and the screens show the art as before.
 */
export const fakeImageFull: ImageFetcher = async (url) => {
  const u = new URL(url);
  if (u.hostname !== 'pics.example' || /broken/i.test(url)) throw new PageUnavailable('upstream', 'fake network: only pics.example opens');
  const side = (name: string, fallback: number) => Math.min(4000, Math.max(1, Number(u.searchParams.get(name)) || fallback));
  const sharp = await loadSharp();
  const bytes = await sharp({ create: { width: side('w', 1600), height: side('h', 1000), channels: 3, background: { r: 40, g: 120, b: 200 } } }).png().toBuffer();
  return { url, status: 200, contentType: 'image/png', bytes, totalBytes: bytes.length };
};

/** A link checked this recently is not fetched again when someone saves it. */
const FRESH_MS = 24 * 3600_000;
/** How often a saved link is checked again, and after how many failures in a row it counts as broken. */
export const RECHECK_MS = 7 * 24 * 3600_000;
export const BROKEN_AFTER = 3;

export interface LinkedImage { url: string; width: number; height: number; mime: WebImageMime }

/** The hosts FeestFinder's own files are served from: their pictures are uploads, not links. */
function ownHosts(ctx: Ctx): string[] {
  return [ctx.config.publicBaseUrl, ctx.config.s3?.publicBaseUrl ?? null]
    .filter((u): u is string => !!u)
    .map((u) => { try { return new URL(u).hostname; } catch { return ''; } })
    .filter((h) => h && h !== 'localhost');
}

const unreachable = () => badRequest('image_unreachable', L('That link does not open', 'Không mở được link này'));
const notAnImage = () => badRequest('not_an_image', L('That link is not an image', 'Link này không phải ảnh'));

async function read(ctx: Ctx, url: string): Promise<ImageFetch> {
  try {
    return await ctx.fetchImage(url);
  } catch (e) {
    if (e instanceof PageUnavailable || e instanceof TypeError) throw unreachable();
    throw e;
  }
}

/**
 * The image a pasted link shows, checked for `purpose`: a direct image, or the preview picture
 * of a page (Google Photos, Imgur, Flickr, SoundCloud…). The address kept is the one asked for,
 * not where it redirected: a redirect target can be a signed address that expires.
 */
export async function probeImage(ctx: Ctx, raw: string, purpose: ImagePurpose): Promise<LinkedImage> {
  // The framing (lib/frame.ts) is the screen's, not the host's: checked without it, given back with it.
  const frame = frameOf(raw.trim());
  const found = await probeBase(ctx, raw, purpose);
  return { ...found, url: withFrame(found.url, frame) };
}

async function probeBase(ctx: Ctx, raw: string, purpose: ImagePurpose): Promise<LinkedImage> {
  const asked = normalizeImageUrl(raw, ownHosts(ctx));
  const now = ctx.clock.now();
  const cached = await one<any>(ctx.db,
    `select url, mime, width, height from remote_images where (url = $1 or page_url = $1) and status = 'ok' and checked_at > $2 order by checked_at desc limit 1`,
    [asked, new Date(now.getTime() - FRESH_MS)]);
  if (cached) {
    checkDimensions(purpose, cached.width, cached.height);
    return { url: cached.url, width: cached.width, height: cached.height, mime: cached.mime };
  }

  let url = asked;
  let page: string | null = null;
  let res = await read(ctx, url);
  if (/text\/html|application\/xhtml/i.test(res.contentType)) {
    const preview = previewImageOf(res.bytes.toString('utf8'), res.url);
    if (!preview) throw notAnImage();
    page = asked;
    url = normalizeImageUrl(preview, ownHosts(ctx));
    res = await read(ctx, url);
  }
  const info = webImageInfo(res.bytes);
  if (!info) throw notAnImage();
  if (res.totalBytes != null && res.totalBytes > MAX_IMAGE_BYTES) {
    throw new AppError(400, 'image_too_heavy', L('That image is over 10 MB; use a lighter one', 'Ảnh này nặng hơn 10 MB, hãy dùng ảnh nhẹ hơn'));
  }
  checkDimensions(purpose, info.width, info.height);
  await ctx.db.query(
    `insert into remote_images (url, page_url, mime, width, height, bytes, status, fail_count, checked_at, created_at)
     values ($1,$2,$3,$4,$5,$6,'ok',0,$7,$7)
     on conflict (url) do update set page_url = coalesce(excluded.page_url, remote_images.page_url), mime = excluded.mime, width = excluded.width,
       height = excluded.height, bytes = excluded.bytes, status = 'ok', fail_count = 0, checked_at = excluded.checked_at`,
    [url, page, info.mime, info.width, info.height, res.totalBytes, now]);
  return { url, width: info.width, height: info.height, mime: info.mime };
}

/**
 * What to store for an image field of a profile: undefined leaves it as it is, null clears it,
 * a string is the checked link. A value that did not change is kept without a check, so a
 * picture uploaded before links were the rule still saves with the rest of the form.
 */
export async function imageChange(ctx: Ctx, before: string | null | undefined, after: string | null | undefined, purpose: ImagePurpose): Promise<string | null | undefined> {
  if (after === undefined) return undefined;
  if (after === null || !after.trim()) return null;
  if (after === before) return undefined;
  // The same picture framed anew: nothing to check again.
  if (before && baseOf(after.trim()) === baseOf(before)) {
    if (!fragmentIsFrame(after.trim())) throw badRequest('invalid_input', L('That link is not valid', 'Link này không hợp lệ'));
    const next = withFrame(before, frameOf(after.trim()));
    return next === before ? undefined : next;
  }
  return (await probeImage(ctx, after, purpose)).url;
}

/** Tells whoever shows a broken link that it no longer opens: the person, the artist's owner, the organiser's team. */
async function tellOwners(ctx: Ctx, url: string) {
  const now = ctx.clock.now();
  const key = `broken-image:${sha256(url).slice(0, 32)}`;
  const title = L('A picture of yours no longer opens', 'Một ảnh của bạn không còn hiển thị');
  const body = L('The link stopped working. Paste a new one.', 'Link ảnh đã hỏng. Hãy dán link mới.');
  const users = await many<{ id: string; url: string }>(ctx.db,
    `select id, '/app/settings' as url from users where split_part(photo_url, '#', 1) = $1
     union select owner_user_id, '/studio/artist' from artists where owner_user_id is not null and (split_part(image_url, '#', 1) = $1 or split_part(cover_url, '#', 1) = $1)
     union select owner_user_id, '/p/' || slug || '/manage' from projects where split_part(cover_url, '#', 1) = $1
     union select m.owner_id, '/profile' from moments m where m.owner_kind = 'user' and m.url = $1 and m.removed_at is null
     union select a.owner_user_id, '/studio/artist' from moments m join artists a on a.id = m.owner_id
       where m.owner_kind = 'artist' and m.url = $1 and m.removed_at is null and a.owner_user_id is not null`, [url]);
  const orgs = await many<{ id: string }>(ctx.db,
    `select id from organizers where split_part(logo_url, '#', 1) = $1 or split_part(cover_url, '#', 1) = $1
     union select owner_id from moments where owner_kind = 'organizer' and url = $1 and removed_at is null`, [url]);
  for (const u of users) {
    await notifyUser(ctx.db, now, { userId: u.id, topic: null, kind: 'broken_image', title, body, link: { url: u.url }, dedupeKey: key });
  }
  for (const o of orgs) {
    await notifyOrganizer(ctx.db, now, { organizerId: o.id, topic: 'moderation', kind: 'broken_image', title, body, link: { url: '/studio/profile' }, dedupeKey: key });
  }
  return users.length + orgs.length;
}

/** One pass of the weekly check: the links checked longest ago, a few at a time. */
export async function checkRemoteImages(ctx: Ctx, max = 20): Promise<{ checked: number; broken: number }> {
  const now = ctx.clock.now();
  const due = await many<{ url: string; fail_count: number }>(ctx.db,
    `select url, fail_count from remote_images where status = 'ok' and checked_at < $1 order by checked_at limit $2`,
    [new Date(now.getTime() - RECHECK_MS), max]);
  let broken = 0;
  for (const r of due) {
    let ok = false;
    try { ok = !!webImageInfo((await ctx.fetchImage(r.url)).bytes); } catch { ok = false; }
    if (ok) {
      await ctx.db.query(`update remote_images set fail_count = 0, checked_at = $2 where url = $1`, [r.url, now]);
      continue;
    }
    const fails = r.fail_count + 1;
    // A failure is tried again within a day, not a week, so a dead link is known in days.
    const next = fails >= BROKEN_AFTER ? now : new Date(now.getTime() - RECHECK_MS + 24 * 3600_000);
    await ctx.db.query(`update remote_images set fail_count = $2, checked_at = $3, status = $4 where url = $1`,
      [r.url, fails, next, fails >= BROKEN_AFTER ? 'broken' : 'ok']);
    if (fails >= BROKEN_AFTER) { broken++; await tellOwners(ctx, r.url); }
  }
  return { checked: due.length, broken };
}

// ---- resized copies (GET /img) ------------------------------------------------------------------

/**
 * Every column a page shows a picture link from (`lists` are arrays of links), and which rows
 * still show it. GET /img resizes only a link one of these holds, so it is never an open proxy;
 * test/img.test.ts fails when a picture column is missing here.
 */
export const PICTURE_COLUMNS: { table: string; columns: string[]; lists?: string[]; shown?: string }[] = [
  { table: 'events', columns: ['cover_url', 'logo_url'] },
  { table: 'artists', columns: ['image_url', 'cover_url'], shown: 'hidden_at is null' },
  { table: 'organizers', columns: ['logo_url', 'cover_url'] },
  { table: 'users', columns: ['photo_url'] },
  { table: 'projects', columns: ['cover_url'] },
  { table: 'moments', columns: ['url'], shown: 'removed_at is null' },
  { table: 'event_posts', columns: ['photo_url'], shown: `status = 'visible'` },
  { table: 'artist_mixes', columns: ['thumbnail_url'] },
  { table: 'blog_tracks', columns: ['thumbnail_url'] },
  { table: 'blog_posts', columns: ['cover_url'], shown: `status <> 'hidden'` },
  { table: 'ad_campaigns', columns: ['logo_url'], lists: ['images'] },
  { table: 'recaps', columns: [], lists: ['photo_urls'] },
];
/** Picture columns no page shows to the public (a brand's request, read by the team as linked): never resized. */
export const UNSERVED_PICTURE_COLUMNS = ['ad_inquiries.logo_url', 'ad_inquiries.product_images'];

/** One query: whether a stored link (framed or not) or a picture in a post's body is `$1`. */
const KNOWN_IMAGE_SQL = `select (${[
  ...PICTURE_COLUMNS.flatMap(({ table, columns, lists = [], shown }) => [
    ...(columns.length ? [`exists (select 1 from ${table} where ${shown ? `${shown} and ` : ''}(${columns.map((c) => `split_part(${c}, '#', 1) = $1`).join(' or ')}))`] : []),
    ...lists.map((l) => `exists (select 1 from ${table} t, unnest(t.${l}) as x(link) where ${shown ? `t.${shown} and ` : ''}split_part(x.link, '#', 1) = $1)`),
  ]),
  // A post's body names its pictures as ![alt](link) or ![alt](link "caption"), each checked as an
  // image when it was added (routes/blog.ts); a plain [text](link) is a link, never a picture.
  String.raw`exists (select 1 from blog_posts p, jsonb_each_text(case when jsonb_typeof(p.body) = 'object' then p.body else '{}' end) as b(lang, text),
     regexp_matches(b.text, '!\[[^\]]*\]\((https://[^[:space:])#]+)', 'g') as m(found) where p.status <> 'hidden' and (m.found)[1] = $1)`,
].join('\n  or ')}) as known`;

/** Whether a page shows this link (given without its fragment): the gate of GET /img. */
export async function knownImage(ctx: Ctx, link: string): Promise<boolean> {
  return !!(await one<{ known: boolean }>(ctx.db, KNOWN_IMAGE_SQL, [link]))?.known;
}

/** The storage key of one of FeestFinder's own uploads, from its link in any spelling, or null. */
export function uploadKeyOf(ctx: Ctx, link: string): string | null {
  const prefixes = ['/files/', `${ctx.config.publicBaseUrl.replace(/\/+$/, '')}/files/`];
  const s3 = ctx.config.s3?.publicBaseUrl?.replace(/\/+$/, '');
  if (s3) prefixes.push(`${s3}/`);
  const prefix = prefixes.find((p) => link.startsWith(p));
  const key = prefix ? link.slice(prefix.length) : null;
  return key && UPLOAD_PATH.test(`/files/${key}`) ? key : null;
}

type Sharp = typeof import('sharp').default;
let sharpLib: Promise<Sharp> | null = null;
/** sharp, loaded with the first picture resized: the API starts without libvips. */
function loadSharp(): Promise<Sharp> {
  sharpLib ??= import('sharp').then(({ default: sharp }) => {
    // Every picture is read once per box and then kept by the CDN: nothing to gain from libvips' cache.
    sharp.cache(false);
    // One thread per picture: two at once (AT_ONCE) leave the rest of the machine to the API.
    sharp.concurrency(1);
    return sharp;
  });
  return sharpLib;
}

/** A source bigger than this many pixels is not decoded (about 130 MB of memory): the browser loads it as linked. */
const MAX_PIXELS = 32_000_000;
/** The formats a copy is made from; anything else (SVG, TIFF, HEIC…) is left to the browser as linked. */
const FORMATS = new Set(['jpeg', 'png', 'webp', 'gif', 'avif']);
/** Pictures decoded at once by this process, the rest wait their turn: the API serves the site meanwhile. */
const AT_ONCE = 2;
let running = 0;
const waiting: (() => void)[] = [];
async function inTurn<T>(work: () => Promise<T>): Promise<T> {
  if (running >= AT_ONCE) await new Promise<void>((go) => waiting.push(go));
  else running++;
  try {
    return await work();
  } finally {
    const next = waiting.shift();
    if (next) next(); else running--;
  }
}

/**
 * A picture as WebP covering a box of width × height: scaled so its shorter side fills the box,
 * never cropped (the framing, #ff=, stays the screen's object-position) and never enlarged.
 * Null when it cannot be read, or moves: an animated picture is left to the browser as linked.
 */
async function toWebp(source: Buffer, width: number, height: number): Promise<Buffer | null> {
  try {
    const sharp = await loadSharp();
    return await inTurn(async () => {
      const image = sharp(source, { limitInputPixels: MAX_PIXELS, failOn: 'none' });
      const meta = await image.metadata();
      // sharp names AVIF 'heif' with AV1 compression; HEIC (HEVC) is not drawn by browsers anyway.
      const format = meta.format === 'heif' && meta.compression === 'av1' ? 'avif' : meta.format;
      if (!FORMATS.has(format ?? '') || (meta.pages ?? 1) > 1) return null;
      return await image.autoOrient()
        .resize({ width, height, fit: 'outside', withoutEnlargement: true })
        .webp({ quality: 75 })
        .timeout({ seconds: 5 })
        .toBuffer();
    });
  } catch {
    return null;
  }
}

/** A linked picture's bytes: a smaller copy its host makes when there is one, else the link. Null when neither opens. */
async function fetchSource(ctx: Ctx, link: string, need: number): Promise<Buffer | null> {
  const smaller = upstreamFor(link, need);
  for (const url of smaller ? [smaller, link] : [link]) {
    try {
      const res = await ctx.fetchImageFull(url);
      if (res.bytes.length) return res.bytes;
    } catch (e) {
      ctx.log(`img: ${new URL(url).hostname} did not give the picture (${(e as Error).message})`);
    }
  }
  return null;
}

/**
 * The picture at `link` (an https link a page shows, or an upload) resized for a box: 'unknown'
 * when nothing stores it, 'unavailable' when it cannot be fetched or read (the browser then loads
 * the link itself).
 */
export async function resizedImage(ctx: Ctx, link: string, width: number, height: number): Promise<Buffer | 'unknown' | 'unavailable'> {
  const key = uploadKeyOf(ctx, link);
  let source: Buffer | null;
  if (key) {
    source = await ctx.storage.get(key);
    if (!source) return 'unknown';
  } else {
    if (!isHttpsLink(link) || !(await knownImage(ctx, link))) return 'unknown';
    // The width a landscape source up to 2:1 needs to cover the box.
    source = await fetchSource(ctx, link, Math.max(width, 2 * height));
    if (!source) return 'unavailable';
  }
  return (await toWebp(source, width, height)) ?? 'unavailable';
}
