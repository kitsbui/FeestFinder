import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { L } from '../lib/i18n.ts';
import { notFound } from '../lib/errors.ts';
import { parse } from '../lib/validate.ts';
import { genreArtPng } from '../services/ogimage.ts';
import { buildArtistSeo, buildCollectionSeo, buildDirectorySeo, buildEventSeo, buildOrganizerSeo, llmsTxt, pageMarkdown, robotsTxt, sitemapXml } from '../services/seo.ts';

/** robots.txt, the sitemap, llms.txt, the IndexNow key file, link-preview art, and what each public page says to search engines and AI agents. */
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

  /**
   * An event, organiser, artist or public collection page's head, structured data and server-rendered facts, for a front
   * that renders its own HTML (the Next.js app). The API's own pages build the same thing
   * in-process.
   */
  const langOf = (query: unknown) => parse(z.object({ lang: z.enum(['vi', 'en']).default('vi') }), query).lang;
  const kinds = [
    { prefix: 'e', api: 'events', build: buildEventSeo, missing: L('Event not found', 'Không tìm thấy sự kiện') },
    { prefix: 'o', api: 'organizers', build: buildOrganizerSeo, missing: L('Organiser not found', 'Không tìm thấy nhà tổ chức') },
    { prefix: 'c', api: 'collections', build: buildCollectionSeo, missing: L('Collection not found', 'Không tìm thấy bộ sưu tập') },
    { prefix: 'a', api: 'artists', build: buildArtistSeo, missing: L('Artist not found', 'Không tìm thấy nghệ sĩ') },
  ] as const;
  for (const k of kinds) {
    app.get<{ Params: { slug: string } }>(`/seo/${k.api}/:slug`, async (req, reply) => {
      const seo = await k.build(ctx, req.params.slug, langOf(req.query));
      if (!seo) throw notFound(k.missing);
      return reply.header('cache-control', 'public, max-age=60').send(seo);
    });

    // The same page as Markdown, for AI agents that read text: /e/<slug>.md, /o/<slug>.md?lang=en.
    app.get<{ Params: { slug: string } }>(`/${k.prefix}/:slug.md`, async (req, reply) => {
      const seo = await k.build(ctx, req.params.slug, langOf(req.query));
      if (!seo) throw notFound(k.missing);
      return reply.type('text/markdown; charset=utf-8').header('cache-control', 'public, max-age=300')
        .header('content-language', seo.lang)
        // Search engines keep the HTML page as the one to show.
        .header('link', `<${seo.canonical}>; rel="canonical"`)
        .send(pageMarkdown(ctx, seo));
    });
  }

  // The artist directory: /seo/directory/all, /seo/directory/style:hard-techno, /seo/directory/city:tokyo.
  app.get<{ Params: { key: string } }>('/seo/directory/:key', async (req, reply) => {
    const seo = await buildDirectorySeo(ctx, req.params.key, langOf(req.query));
    if (!seo) throw notFound(L('No such artist list', 'Không có danh sách nghệ sĩ này'));
    return reply.header('cache-control', 'public, max-age=300').send(seo);
  });
  const directoryMd = (key: (p: { slug: string }) => string) => async (req: any, reply: any) => {
    const seo = await buildDirectorySeo(ctx, key(req.params), langOf(req.query));
    if (!seo) throw notFound(L('No such artist list', 'Không có danh sách nghệ sĩ này'));
    return reply.type('text/markdown; charset=utf-8').header('cache-control', 'public, max-age=300').header('content-language', seo.lang)
      .header('link', `<${seo.canonical}>; rel="canonical"`).send(pageMarkdown(ctx, seo));
  };
  app.get('/a.md', directoryMd(() => 'all'));
  app.get('/a/style/:slug.md', directoryMd((p) => `style:${p.slug}`));
  app.get('/a/city/:slug.md', directoryMd((p) => `city:${p.slug}`));

  // What FeestFinder is, and where its pages are as Markdown (llmstxt.org).
  app.get('/llms.txt', { config: { rateLimit: false } }, async (_req, reply) => {
    return reply.type('text/plain; charset=utf-8').header('cache-control', 'public, max-age=900').send(await llmsTxt(ctx));
  });

  // The link-preview picture of an event without a cover. Versioned in the path, so it can be cached for good.
  app.get<{ Params: { tone: string } }>('/og/v1/:tone', { config: { rateLimit: false } }, async (req, reply) => {
    const png = genreArtPng(req.params.tone.replace(/\.png$/, ''));
    if (!png) throw notFound();
    return reply.type('image/png').header('cache-control', 'public, max-age=31536000, immutable').send(png);
  });
}
