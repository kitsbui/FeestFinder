import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parse } from '../lib/validate.ts';
import { requireUser } from '../http/guards.ts';
import { probeImage } from '../services/remote-images.ts';

/*
 * POST /images/check {url, purpose}: what the screens call when someone pastes an image link,
 * so the preview and any problem (not an image, too small, an expiring address) show before the
 * form is saved. Saving checks again (services/remote-images.ts imageChange), so this is a
 * courtesy, not the gate. It fetches the link, so each person gets a few a minute.
 */

const CheckBody = z.object({
  url: z.string().trim().min(1).max(2048),
  purpose: z.enum(['avatar', 'logo', 'profile_cover', 'moment']),
});

export default async function imageRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  app.post('/images/check', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (req) => {
    requireUser(req);
    const body = parse(CheckBody, req.body);
    return probeImage(ctx, body.url, body.purpose);
  });
}
