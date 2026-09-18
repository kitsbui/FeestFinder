import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { one } from '../db/index.ts';
import { AppError, badRequest, notFound } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { sha256 } from '../lib/crypto.ts';
import { imageInfo } from '../lib/image.ts';
import { parse } from '../lib/validate.ts';
import { requireUser } from '../http/guards.ts';

const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' } as const;
const MIME_BY_EXT: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };

/** Size rules per purpose. Event covers must be 16:9 at 1600×900 or larger. */
function checkDimensions(purpose: string, w: number, h: number) {
  if (purpose === 'cover') {
    if (w < 1600 || h < 900 || Math.abs(w / h - 16 / 9) > 0.01) {
      throw badRequest('cover_size', L('Use a landscape image of at least 1600×900 (16:9)', 'Dùng ảnh ngang tối thiểu 1600×900 (16:9)'), { width: w, height: h });
    }
  }
  if (purpose === 'logo' && (w < 256 || h < 256)) {
    throw badRequest('logo_size', L('Logos need to be at least 256×256', 'Logo cần tối thiểu 256×256'), { width: w, height: h });
  }
  if (purpose === 'avatar' && (w < 128 || h < 128)) {
    throw badRequest('avatar_size', L('Photos need to be at least 128×128', 'Ảnh cần tối thiểu 128×128'), { width: w, height: h });
  }
}

export default async function uploadRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  app.post('/uploads', async (req, reply) => {
    const s = requireUser(req);
    const { purpose } = parse(z.object({ purpose: z.enum(['cover', 'logo', 'avatar', 'recap']) }), req.query);
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
    if (!/^(cover|logo|avatar|recap)\/[0-9a-f]{2}\/[0-9a-f]{64}\.(png|jpg|webp)$/.test(key)) throw notFound();
    const data = await ctx.storage.get(key);
    if (!data) throw notFound();
    return reply
      .type(MIME_BY_EXT[key.split('.').pop()!])
      .header('cache-control', 'public, max-age=31536000, immutable')
      .send(data);
  });
}
