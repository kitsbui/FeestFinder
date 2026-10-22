import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { parse } from '../lib/validate.ts';
import { badRequest, notFound } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { sha256 } from '../lib/crypto.ts';
import { isHttpsLink, isImgBox, linkOfKey } from '../lib/remote-image.ts';
import { requireUser } from '../http/guards.ts';
import { probeImage, resizedImage, uploadKeyOf } from '../services/remote-images.ts';

/*
 * POST /images/check {url, purpose}: what the screens call when someone pastes an image link,
 * so the preview and any problem (not an image, too small, an expiring address) show before the
 * form is saved. Saving checks again (services/remote-images.ts imageChange), so this is a
 * courtesy, not the gate. It fetches the link, so each person gets a few a minute.
 *
 * GET /img/<w>x<h>/<key>.webp: a picture the pages show, resized to cover the box (one of the
 * boxes in lib/remote-image.ts) as WebP; <key> is its link without the fragment, as base64url.
 * Only a link a page shows (knownImage) or one of FeestFinder's uploads, so never an open proxy.
 * The answer is the same for everyone and never changes, so browsers and the CDN keep it for a
 * year; it reads no session and sets no cookie. A link that does not open, or a picture that
 * moves, sends the browser to the link itself for a few minutes.
 */

const CheckBody = z.object({
  url: z.string().trim().min(1).max(2048),
  purpose: z.enum(['avatar', 'logo', 'profile_cover', 'moment']),
});

const IMG_PATH = /^(\d{2,4})x(\d{2,4})\/([\w-]+)\.webp$/;
/** A resized picture never changes: its address names the picture and the box. */
const YEAR = 31_536_000;

/**
 * Kept `seconds` by browsers and CDNs. CDN-Cache-Control says it again for the CDN in front of
 * the web app: Vercel's CDN here takes s-maxage out of Cache-Control before passing the answer on
 * to the web app's rewrite, but forwards CDN-Cache-Control as it is.
 */
function keep(reply: FastifyReply, seconds: number) {
  const forGood = seconds === YEAR ? ', immutable' : '';
  return reply
    .header('cache-control', `public, max-age=${seconds}, s-maxage=${seconds}${forGood}`)
    .header('cdn-cache-control', `public, max-age=${seconds}${forGood}`);
}

export default async function imageRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  app.post('/images/check', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (req) => {
    requireUser(req);
    const body = parse(CheckBody, req.body);
    return probeImage(ctx, body.url, body.purpose);
  });

  app.get<{ Params: { '*': string } }>('/img/*', async (req, reply) => {
    const path = req.params['*'];
    const m = IMG_PATH.exec(path);
    const width = Number(m?.[1]);
    const height = Number(m?.[2]);
    const link = m ? linkOfKey(m[3]) : null;
    if (!m || !isImgBox(width, height) || !link || !(isHttpsLink(link) || uploadKeyOf(ctx, link))) {
      throw badRequest('invalid_image_address', L('That is not the address of a resized picture', 'Đây không phải địa chỉ của một ảnh đã thu nhỏ'));
    }
    // One address per picture and box: a query would only make the CDN keep another copy.
    if (req.url.includes('?')) return keep(reply.code(301), 3600).header('location', `/img/${path}`).send();

    const out = await resizedImage(ctx, link, width, height);
    if (out === 'unknown') {
      const e = notFound();
      return keep(reply.code(404), 300).send({ error: { code: e.code, message: e.text[req.lang] } });
    }
    if (out === 'unavailable') return keep(reply.code(302), 600).header('location', link).send();
    const etag = `"${sha256(out).slice(0, 32)}"`;
    keep(reply, YEAR).header('etag', etag).type('image/webp');
    return req.headers['if-none-match'] === etag ? reply.code(304).send() : reply.send(out);
  });
}
