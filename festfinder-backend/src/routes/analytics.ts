import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { deviceOf } from '../services/partners.ts';
import { CLIENT_EVENTS, personId } from '../services/analytics.ts';

/*
 * POST /analytics/collect {name, props?, anonId?}: a screen's event (services/analytics.ts).
 * Always 204, whatever happens to it: dropped for robots, for "Do Not Track" and Global
 * Privacy Control, for unknown names, and when no analytics provider is configured.
 */

const Body = z.object({
  name: z.string().max(40),
  props: z.record(z.string(), z.unknown()).optional(),
  anonId: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/).optional(),
});

export default async function analyticsRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  app.post('/analytics/collect', { bodyLimit: 4096 }, async (req, reply) => {
    reply.code(204).header('cache-control', 'no-store');
    if (!ctx.analytics.enabled) return reply.send();
    if (req.headers.dnt === '1' || req.headers['sec-gpc'] === '1') return reply.send();
    if (!deviceOf(req.headers['user-agent'] as string | undefined)) return reply.send();
    // sendBeacon posts text/plain; the body is JSON either way.
    let raw: unknown = req.body;
    if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { return reply.send(); } }
    const b = Body.safeParse(raw);
    if (!b.success || !(CLIENT_EVENTS as readonly string[]).includes(b.data.name)) return reply.send();
    const userId = req.session?.user?.id;
    const distinct = userId ? personId(userId) : b.data.anonId ? `a_${b.data.anonId}` : null;
    if (!distinct) return reply.send();
    await ctx.analytics.capture(b.data.name as (typeof CLIENT_EVENTS)[number], distinct, b.data.props);
    return reply.send();
  });
}

