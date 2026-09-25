import type { FastifyInstance } from 'fastify';
import { runDueJobs } from '../jobs.ts';
import { safeEqual } from '../lib/crypto.ts';
import { unauthorized } from '../lib/errors.ts';

/** Machine-to-machine endpoints, answered only when their secret is configured. */
export default async function internalRoutes(app: FastifyInstance) {
  const secret = app.ctx.config.cronSecret;
  if (!secret) return;
  app.post('/internal/jobs', { config: { rateLimit: false } }, async (req) => {
    if (!safeEqual(req.headers.authorization ?? '', `Bearer ${secret}`)) throw unauthorized();
    return { ran: await runDueJobs(app.ctx) };
  });
}
