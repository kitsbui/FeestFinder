import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one } from '../db/index.ts';
import { AppError, badRequest, notFound } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { sha256 } from '../lib/crypto.ts';
import { imageInfo } from '../lib/image.ts';
import { checkDimensions } from '../lib/image-rules.ts';
import { parse } from '../lib/validate.ts';
import { requireUser } from '../http/guards.ts';

const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' } as const;
/** What can still be uploaded: event media only. */
export const UPLOAD_PURPOSES = ['cover', 'logo', 'recap'] as const;
const MIME_BY_EXT: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };

export default async function uploadRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  app.post('/uploads', async (req, reply) => {
    const s = requireUser(req);
    const { purpose: asked } = parse(z.object({ purpose: z.string().max(40) }), req.query);
    // Only an event's own media is uploaded (its cover and logo, and the photos fans take at it).
    // Every other picture is a link: see services/remote-images.ts. Files uploaded before stay served.
    if (!(UPLOAD_PURPOSES as readonly string[]).includes(asked)) {
      throw badRequest('upload_not_allowed', L('Paste an image link instead', 'Hãy dán link ảnh thay vì tải lên'));
    }
    const purpose = asked as (typeof UPLOAD_PURPOSES)[number];
    if (!req.isMultipart()) throw badRequest('multipart_required', L('Send the image as multipart/form-data', 'Gửi ảnh dạng multipart/form-data'));
    const file = await req.file();
    if (!file) throw badRequest('file_required', L('Choose an image', 'Chọn một ảnh'));
    const buf = await file.toBuffer();
    if (file.file.truncated) throw new AppError(413, 'file_too_large', L('Images can be up to 8 MB', 'Ảnh tối đa 8 MB'));
    const info = imageInfo(buf);
    if (!info) throw badRequest('unsupported_image', L('Use a PNG, JPEG or WebP image', 'Dùng ảnh PNG, JPEG hoặc WebP'));
    checkDimensions(purpose, info.width, info.height);
    const hash = sha256(buf);
    const key = `${purpose}/${hash.slice(0, 2)}/${hash}.${EXT[info.mime]}`;
    const url = await ctx.storage.put(key, buf, info.mime);
    const row = await one<any>(ctx.db,
      `insert into uploads (owner_id, purpose, mime, bytes, width, height, sha256, url) values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
      [s.user.id, purpose, info.mime, buf.length, info.width, info.height, hash, url]);
    return reply.code(201).send({ id: row.id, url, width: info.width, height: info.height, sha256: hash, mime: info.mime });
  });

  app.get<{ Params: { '*': string } }>('/files/*', async (req, reply) => {
    const key = req.params['*'];
    if (!/^(cover|logo|avatar|recap|moment)\/[0-9a-f]{2}\/[0-9a-f]{64}\.(png|jpg|webp)$/.test(key)) throw notFound();
    const data = await ctx.storage.get(key);
    if (!data) throw notFound();
    // Content-addressed, so browsers and the CDN in front of the API keep it for good.
    return reply
      .type(MIME_BY_EXT[key.split('.').pop()!])
      .header('cache-control', 'public, max-age=31536000, s-maxage=31536000, immutable')
      .send(data);
  });
}
