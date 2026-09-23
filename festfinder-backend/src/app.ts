import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import type { Ctx } from './context.ts';
import { one } from './db/index.ts';
import { AppError, readOnlySession } from './lib/errors.ts';
import { langFrom, type Lang } from './lib/i18n.ts';
import { vnDate } from './lib/time.ts';
import { resolveSession, type SessionInfo } from './http/session.ts';

import authRoutes from './routes/auth.ts';
import catalogRoutes from './routes/catalog.ts';
import meRoutes from './routes/me.ts';
import socialRoutes from './routes/social.ts';
import eventActionRoutes from './routes/event-actions.ts';
import planRoutes from './routes/plans.ts';
import commerceRoutes from './routes/commerce.ts';
import liveRoutes from './routes/live.ts';
import discoveryRoutes from './routes/discovery.ts';
import uploadRoutes from './routes/uploads.ts';
import organizerEventRoutes from './routes/organizer/events.ts';
import organizerInsightRoutes from './routes/organizer/insights.ts';
import organizerAudienceRoutes from './routes/organizer/audience.ts';
import doorRoutes from './routes/organizer/door.ts';
import organizerMoneyRoutes from './routes/organizer/money.ts';
import organizerInboxRoutes from './routes/organizer/inbox.ts';
import adminModerationRoutes from './routes/admin/moderation.ts';
import adminCatalogRoutes from './routes/admin/catalog.ts';
import adminPlatformRoutes from './routes/admin/platform.ts';
import adminOpsRoutes from './routes/admin/ops.ts';
import devConsoleRoutes from './routes/dev-console.ts';
import frontendRoutes from './routes/frontend.ts';

declare module 'fastify' {
  interface FastifyInstance { ctx: Ctx }
  interface FastifyRequest { session: SessionInfo | null; lang: Lang; rawBody?: string }
}

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Loopback and private-network addresses (IPv4, IPv6, and IPv4 mapped into IPv6). */
export function isInternal(ip: string): boolean {
  const v4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(v4)) return true;
  return ip === '::1' || /^f[cd][0-9a-f]{2}:/i.test(ip) || /^fe[89ab][0-9a-f]:/i.test(ip);
}

export async function buildApp(ctx: Ctx): Promise<FastifyInstance> {
  const app = Fastify({
    logger: ctx.config.env === 'development' ? { level: 'info' } : ctx.config.env === 'production' ? { level: 'warn' } : false,
    // A hop count trusts that many proxies nearest to us.
    trustProxy: typeof ctx.config.trustProxy === 'number'
      ? ((hops: number) => (_addr: string, i: number) => i < hops)(ctx.config.trustProxy)
      : ctx.config.trustProxy,
    bodyLimit: 1024 * 1024,
  });

  app.decorate('ctx', ctx);
  app.decorateRequest('session', null);
  app.decorateRequest('lang', 'vi');

  await app.register(cors, { origin: ctx.config.corsOrigins, credentials: true });
  await app.register(cookie);
  await app.register(multipart, { limits: { fileSize: 8 * 1024 * 1024, files: 1 } });

  /*
   * The screens carry no inline script and load React from this origin, so the policy
   * can be strict. Inline *styles* stay allowed: the design's markup is styled with
   * style attributes, and the runtime injects a stylesheet of its own.
   */
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'connect-src': ["'self'"],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'object-src': ["'none'"],
        'upgrade-insecure-requests': ctx.config.env === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    // Google Fonts and uploaded images are loaded cross-origin by the design.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  /*
   * A ceiling per IP so one client cannot flood the API. Sign-in, OTP and the door
   * scanner have their own tighter limits in their routes; webhooks and the screens'
   * own static chunks are not counted.
   *
   * Nor are calls from our own network with no client behind them: the Next.js app
   * rendering pages on the server, so a crawler burst cannot turn those pages into errors.
   * Such a call carries no forwarding headers. A browser's call through the Next.js proxy
   * always does (at least X-Forwarded-Host), so it is counted even when it arrives from
   * our network — otherwise a browser could claim a private address in X-Forwarded-For,
   * or send none at all, and never be limited.
   */
  let warnedNoClientAddress = false;
  await app.register(rateLimit, {
    global: true,
    max: ctx.config.rateLimitPerMinute,
    timeWindow: '1 minute',
    allowList: (req) => req.url.startsWith('/ui/') || req.url.startsWith('/pages/') || req.url.startsWith('/files/')
      || (isInternal(req.ip) && !req.headers['x-forwarded-for'] && !req.headers['x-forwarded-host']),
    keyGenerator: (req) => {
      // Next.js forwards the client's X-Forwarded-For but never adds the client's address
      // itself: without a load balancer in front that does, every browser shares one key.
      if (!warnedNoClientAddress && ctx.config.env === 'production' && req.headers['x-forwarded-host'] && !req.headers['x-forwarded-for']) {
        warnedNoClientAddress = true;
        ctx.log('warning: proxied requests arrive without X-Forwarded-For, so every client shares one rate limit. Put a proxy that sets it in front of the web app.');
      }
      return req.ip;
    },
    errorResponseBuilder: (req, ctx2) => ({
      statusCode: 429,
      error: {
        code: 'rate_limited',
        message: req.lang === 'en'
          ? `Too many requests. Try again in ${Math.ceil(ctx2.ttl / 1000)}s.`
          : `Quá nhiều yêu cầu. Thử lại sau ${Math.ceil(ctx2.ttl / 1000)} giây.`,
      },
    }),
  });

  // Keep the raw JSON so payment webhooks can verify their signature over exact bytes.
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    const text = body as string;
    req.rawBody = text;
    if (!text) return done(null, {});
    try {
      done(null, JSON.parse(text));
    } catch {
      done(new AppError(400, 'invalid_json', { en: 'Body is not valid JSON', vi: 'Nội dung không phải JSON hợp lệ' }), undefined);
    }
  });

  const activeToday = new Set<string>();
  app.addHook('onRequest', async (req) => {
    req.lang = langFrom(req.query, req.headers);
    req.session = await resolveSession(ctx, req);
    const user = req.session?.user;
    if (user && !req.session!.impersonatorId) {
      const key = `${user.id}:${vnDate(ctx.clock.now())}`;
      if (!activeToday.has(key)) {
        activeToday.add(key);
        if (activeToday.size > 100_000) activeToday.clear();
        await ctx.db.query(`insert into user_activity_days (user_id, day) values ($1, $2) on conflict do nothing`, [user.id, vnDate(ctx.clock.now())]);
        await ctx.db.query('update users set last_active_at = $2 where id = $1', [user.id, ctx.clock.now()]);
      }
    }
  });

  // Impersonated sessions are read-only, and so is the admin who opened one until they end it.
  app.addHook('preHandler', async (req) => {
    if (!WRITE_METHODS.has(req.method) || !req.session) return;
    const path = req.routeOptions.url ?? '';
    if (req.session.readOnly && path !== '/auth/session') throw readOnlySession();
    if (req.session.user?.role === 'admin' && path.startsWith('/admin') && path !== '/admin/impersonation') {
      const active = await one(ctx.db, 'select 1 from sessions where impersonator_id = $1 and expires_at > $2', [req.session.user.id, ctx.clock.now()]);
      if (active) throw readOnlySession();
    }
  });

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof AppError) {
      return reply.code(err.status).send({ error: { code: err.code, message: err.text[req.lang], details: err.details } });
    }
    const e = err as { statusCode?: number; code?: string; message: string; error?: { code: string; message: string } };
    // The rate limiter throws its own response body.
    if (e.statusCode === 429 && e.error) return reply.code(429).send({ error: e.error });
    if (e.statusCode && e.statusCode < 500) {
      const code = e.code === 'FST_REQ_FILE_TOO_LARGE' ? 'file_too_large' : 'bad_request';
      return reply.code(e.statusCode).send({ error: { code, message: e.message } });
    }
    req.log.error(err);
    ctx.log(`unhandled error on ${req.method} ${req.url}: ${(err as Error).stack ?? err}`);
    ctx.errors.capture(err, { method: req.method, url: req.url, userId: req.session?.user?.id ?? null, requestId: req.id });
    return reply.code(500).send({ error: { code: 'internal', message: req.lang === 'en' ? 'Something went wrong' : 'Đã có lỗi xảy ra' } });
  });

  app.setNotFoundHandler((req, reply) => {
    reply.code(404).send({ error: { code: 'route_not_found', message: `${req.method} ${req.url}` } });
  });

  app.get('/health', async () => {
    await ctx.db.query('select 1');
    return { ok: true, time: ctx.clock.now() };
  });

  await app.register(authRoutes);
  await app.register(catalogRoutes);
  await app.register(discoveryRoutes);
  await app.register(meRoutes);
  await app.register(socialRoutes);
  await app.register(eventActionRoutes);
  await app.register(planRoutes);
  await app.register(commerceRoutes);
  await app.register(liveRoutes);
  await app.register(uploadRoutes);
  await app.register(organizerEventRoutes);
  await app.register(organizerInsightRoutes);
  await app.register(organizerAudienceRoutes);
  await app.register(doorRoutes);
  await app.register(organizerMoneyRoutes);
  await app.register(organizerInboxRoutes);
  await app.register(adminModerationRoutes);
  await app.register(adminCatalogRoutes);
  await app.register(adminPlatformRoutes);
  await app.register(adminOpsRoutes);
  await app.register(devConsoleRoutes);
  if (ctx.config.env !== 'test') await app.register(frontendRoutes);

  return app;
}
