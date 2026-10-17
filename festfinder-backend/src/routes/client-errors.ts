import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { deviceOf } from '../services/partners.ts';

/*
 * POST /client-errors {kind, message, source?, line?, col?, stack?}: an uncaught error or
 * rejection in someone's browser (festfinder-web kd/feedback/telemetry.ts), sent to the same
 * reporter as the API's own (Sentry when SENTRY_DSN is set). Design v2 phase 7: the web had no
 * error reporting. Paths only, never a query string; no form contents, cookies or storage.
 * Always 204, and robots are ignored.
 */

const Body = z.object({
  kind: z.enum(['error', 'rejection']),
  message: z.string().min(1).max(300),
  source: z.string().max(300).optional(),
  line: z.number().int().nonnegative().optional(),
  col: z.number().int().nonnegative().optional(),
  stack: z.string().max(4000).optional(),
});

/** A URL or a stack without what follows `?` (codes and tokens ride there). */
const noQuery = (s: string) => s.replace(/\?[^\s:)]*/g, '');

/** The error as the browser saw it, under its own name so the team tells it from the API's. */
export class WebError extends Error {
  override name = 'WebError';
}

export default async function clientErrorRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  app.post('/client-errors', { bodyLimit: 8192 }, async (req, reply) => {
    reply.code(204).header('cache-control', 'no-store');
    if (!deviceOf(req.headers['user-agent'] as string | undefined)) return reply.send();
    // sendBeacon posts text/plain; the body is JSON either way.
    let raw: unknown = req.body;
    if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { return reply.send(); } }
    const b = Body.safeParse(raw);
    if (!b.success) return reply.send();
    const err = new WebError(noQuery(b.data.message));
    const where = b.data.source ? `${noQuery(b.data.source)}:${b.data.line ?? 0}:${b.data.col ?? 0}` : null;
    err.stack = `WebError: ${err.message}\n${b.data.stack ? noQuery(b.data.stack) : where ? `    at ${where}` : ''}`;
    // The page it happened on is the Referer's path; the request's own URL is this endpoint.
    let page: string | undefined;
    try { page = req.headers.referer ? new URL(req.headers.referer).pathname : undefined; } catch { /* no page */ }
    ctx.errors.capture(err, { method: b.data.kind, url: page, userId: req.session?.user?.id ?? null, requestId: req.id });
    return reply.send();
  });
}
