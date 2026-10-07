import { z } from 'zod';
import { badRequest } from './errors.ts';
import { L } from './i18n.ts';

/** Parses input or throws a 400 listing every failing field. */
export function parse<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const r = schema.safeParse(input);
  if (r.success) return r.data;
  const fields = r.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
  throw badRequest('invalid_input', L('Some fields need another look', 'Một số trường cần kiểm tra lại'), { fields });
}

export const uuid = z.string().uuid();
export const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
export const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM');
export const localized = z.object({ en: z.string().max(4000), vi: z.string().max(4000) });
/** The path POST /uploads gives an image it keeps in the database (see DbStorage). */
export const UPLOAD_PATH = /^\/files\/(cover|logo|avatar|recap|moment)\/[0-9a-f]{2}\/[0-9a-f]{64}\.(png|jpg|webp)$/;
const anyUrl = z.string().url();
/** An image: a full URL, or the path of an upload kept in the database, the same in every environment. */
export const imageUrl = z.string().max(2048).refine((v) => UPLOAD_PATH.test(v) || anyUrl.safeParse(v).success, 'Invalid URL');
export const limit = (max = 50, def = 20) => z.coerce.number().int().min(1).max(max).default(def);
export const bool = z.union([z.boolean(), z.enum(['true', 'false', '1', '0']).transform((v) => v === 'true' || v === '1')]);
/** Comma-separated list in a query string. */
export const csv = <T extends z.ZodType<string, string>>(item: T) =>
  z.string().transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)).pipe(z.array(item));
