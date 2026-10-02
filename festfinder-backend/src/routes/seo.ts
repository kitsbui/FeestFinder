import type { FastifyInstance } from 'fastify';
import { robotsTxt, sitemapXml } from '../services/seo.ts';

/** robots.txt, the sitemap and the IndexNow key file, at the site's root. */
export default async function seoRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  app.get('/robots.txt', { config: { rateLimit: false } }, async (_req, reply) => {
    return reply.type('text/plain; charset=utf-8').header('cache-control', 'public, max-age=3600').send(robotsTxt(ctx));
  });

  app.get('/sitemap.xml', async (_req, reply) => {
    return reply.type('application/xml; charset=utf-8').header('cache-control', 'public, max-age=900').send(await sitemapXml(ctx));
  });

  // Proves to IndexNow that the key announcing our pages is ours.
  const key = ctx.config.indexNowKey;
  if (key) {
    app.get(`/${key}.txt`, async (_req, reply) => reply.type('text/plain; charset=utf-8').send(key));
  }
}
