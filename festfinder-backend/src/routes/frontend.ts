import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { notFound } from '../lib/errors.ts';
import { GENRES } from '../lib/i18n.ts';
import { isCity } from '../lib/places.ts';
import { slugify } from '../lib/contact.ts';
import { buildCollectionSeo, buildEventSeo, buildOrganizerSeo, collectionSsr, eventSsr, organizerSsr, seoHead, type PageSeo } from '../services/seo.ts';

/**
 * The four Claude Design surfaces, wired to this API and served from the same origin, and
 * the operations back office (/ops) next to them.
 *
 * Each surface is a small shell that answers every route below its base, so the screens,
 * tabs and panels all have real URLs while the browser keeps one copy of the template,
 * the logic and the runtime.
 */
const SURFACES = [
  { base: '/', shell: 'pages/web/shell.html', routes: ['/', '/about', '/advertise', '/list', '/saved', '/stats/:key'] },
  { base: '/app', shell: 'pages/app/shell.html', routes: ['/app', '/app/:screen', '/app/:screen/:param'] },
  // The back offices sit on their own namespaces: /organizer/* and /admin/* are API paths,
  // and a screen URL must never shadow an endpoint.
  { base: '/studio', shell: 'pages/organizer/shell.html', routes: ['/studio', '/studio/:screen', '/studio/:screen/:param'] },
  { base: '/console', shell: 'pages/admin/shell.html', routes: ['/console', '/console/:screen', '/console/:screen/:param'] },
  // The operations back office is plain scripts, not the design runtime, so it keeps the
  // strict policy from app.ts (no 'unsafe-eval').
  { base: '/ops', shell: 'pages/ops/shell.html', routes: ['/ops', '/ops/*'], strict: true },
];

/**
 * The design runtime compiles each screen's template and logic with `new Function`, so
 * its pages need 'unsafe-eval'. Scripts still load only from this origin and nothing runs
 * inline, which is what keeps an injected script out. Every other response keeps the
 * strict policy set in app.ts.
 */
export const DESIGN_RUNTIME_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

/** Where the old entry points went. */
const MOVED: Record<string, string> = { '/organizer': '/studio', '/admin': '/console' };

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  // Icon fonts are already compressed, so they are served as they are.
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
};
/** Where an old landing page's filters point on the list. */
export function legacyListPath(prefix: string, city: string, facets: string): string {
  const q = new URLSearchParams();
  if (isCity(city)) q.set('city', city);
  const time: Record<string, string> = { tonight: 'tonight', 'this-weekend': 'weekend', 'next-7-days': '7days', 'this-month': 'month' };
  for (const f of facets.split('/').map((x) => x.toLowerCase()).filter(Boolean)) {
    const genre = f === 'night-market' ? 'Food' : GENRES.find((g) => slugify(g) === f);
    if (genre && !q.has('genre')) q.set('genre', genre);
    if (time[f] && !q.has('time')) q.set('time', time[f]);
  }
  if (prefix === 'en' || prefix === 'vi') q.set('lang', prefix);
  const qs = q.toString();
  return '/list' + (qs ? `?${qs}` : '');
}

const COMPRESS = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.md']);

type Cached = { etag: string; body: Buffer; gzip?: Buffer; type: string };

/**
 * How long a response may be kept. Vercel's CDN starts a fresh cache with every deployment,
 * so `s-maxage` lets the edge near the visitor answer instead of the function in Tokyo.
 * - asset: a file named with this deployment's version (?v=…), kept for good;
 * - file: the same file without it (an old tab, a hand-typed URL);
 * - shell: a screen's empty shell; the browser checks back, the edge keeps it;
 * - page: an event or organiser page with its facts, edited from Ops now and then.
 */
type Policy = 'asset' | 'file' | 'shell' | 'page' | 'none';
const POLICY: Record<Policy, string> = {
  asset: 'public, max-age=31536000, immutable',
  file: 'public, max-age=3600, s-maxage=86400',
  shell: 'public, max-age=0, s-maxage=86400',
  page: 'public, max-age=0, s-maxage=60, stale-while-revalidate=600',
  none: 'public, max-age=0',
};

/** A short hash of every file the screens load, so a deployment's URLs change with its content. */
async function versionOf(dir: string): Promise<string> {
  const hash = createHash('sha256');
  const walk = async (d: string) => {
    for (const e of (await readdir(d, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const f = join(d, e.name);
      if (e.isDirectory()) await walk(f);
      else hash.update(f.slice(dir.length)).update(await readFile(f));
    }
  };
  for (const folder of ['pages', 'ui']) await walk(join(dir, folder));
  return hash.digest('base64url').slice(0, 10);
}

/**
 * Adds the version to the /ui and /pages URLs an HTML or CSS file names, and to the fonts a
 * stylesheet loads next to it. ff-client.js adds it to what it fetches itself.
 */
export function stampUrls(text: string, version: string): string {
  return text
    .replace(/(["'(])(\/(?:ui|pages)\/[^"'()?#\s]+)(?=["')])/g, `$1$2?v=${version}`)
    .replace(/url\((["']?)(\.\/[^"')?#]+)\1\)/g, `url($1$2?v=${version}$1)`);
}

export default async function frontendRoutes(app: FastifyInstance) {
  // This repo's festfinder-frontend, wherever the process was started from. Written as a
  // URL literal so Vercel's file tracing ships the folder with the function.
  const dir = process.env.FRONTEND_DIR ? resolve(process.env.FRONTEND_DIR) : fileURLToPath(new URL('../../../festfinder-frontend', import.meta.url));
  if (!existsSync(join(dir, 'pages/web/shell.html'))) {
    app.ctx.log(`frontend not found at ${dir}; serving the API only`);
    return;
  }
  const dev = app.ctx.config.env !== 'production';
  const cache = new Map<string, Cached & { mtime: number }>();
  // Outside development every file is fetched with the deployment's version and kept for good.
  const version = dev ? '' : await versionOf(dir);

  /**
   * Static files are read once and kept with their ETag and gzip form. In development
   * the file's mtime is checked first, so editing a page only needs a reload.
   */
  async function load(file: string): Promise<Cached | null> {
    const type = MIME[extname(file)];
    if (!type || !existsSync(file)) return null;
    const mtime = (await stat(file)).mtimeMs;
    const hit = cache.get(file);
    if (hit && hit.mtime === mtime) return hit;
    const ext = extname(file);
    let body = await readFile(file);
    if (version && (ext === '.html' || ext === '.css')) body = Buffer.from(stampUrls(body.toString('utf8'), version));
    const entry = {
      mtime,
      type,
      body,
      etag: '"' + createHash('sha256').update(body).digest('base64url').slice(0, 20) + '"',
      gzip: COMPRESS.has(extname(file)) && body.length > 1024 ? gzipSync(body, { level: 6 }) : undefined,
    };
    cache.set(file, entry);
    return entry;
  }

  function serve(req: FastifyRequest, reply: FastifyReply, entry: Cached, policy: Policy) {
    reply.type(entry.type).header('etag', entry.etag)
      .header('cache-control', dev ? 'no-cache' : POLICY[policy])
      .header('vary', 'accept-encoding');
    if (req.headers['if-none-match'] === entry.etag) return reply.code(304).send();
    const accepts = String(req.headers['accept-encoding'] ?? '').includes('gzip');
    if (entry.gzip && accepts) return reply.header('content-encoding', 'gzip').send(entry.gzip);
    return reply.send(entry.body);
  }

  /**
   * Event and organiser pages arrive with their facts already in them: title, description,
   * language versions and link-preview tags, structured data, and the details as plain HTML
   * inside <x-dc>, which the screen replaces when it mounts. Search engines and AI assistants
   * that run no script read that. Vietnamese at /e/:slug, English at /e/:slug?lang=en.
   */
  const page = <S extends PageSeo>(route: string, build: (slug: string, lang: 'vi' | 'en') => Promise<S | null>, ssr: (seo: S) => string) =>
    app.get<{ Params: { slug: string }; Querystring: { lang?: string } }>(route, async (req, reply) => {
      const entry = await load(join(dir, 'pages/web/shell.html'));
      if (!entry) throw notFound();
      reply.header('content-security-policy', DESIGN_RUNTIME_CSP);
      const lang = req.query?.lang === 'en' ? 'en' : 'vi';
      const seo = await build(req.params.slug, lang).catch((e) => { app.ctx.log(`${route} ${req.params.slug}: ${e}`); return null; });
      if (!seo) return serve(req, reply.code(404), entry, 'none');
      const { title, head } = seoHead(seo);
      const html = entry.body.toString('utf8')
        .replace('<html lang="vi">', `<html lang="${lang}">`)
        .replace(/<title>[^<]*<\/title>/, `<title>${title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>`)
        .replace('</head>', `${head}\n</head>`)
        .replace('<x-dc></x-dc>', `<x-dc>${ssr(seo)}</x-dc>`);
      reply.header('content-language', lang);
      const body = Buffer.from(html);
      return serve(req, reply, {
        type: MIME['.html'], body,
        etag: '"' + createHash('sha256').update(body).digest('base64url').slice(0, 20) + '"',
        gzip: gzipSync(body, { level: 6 }),
      }, 'page');
    });
  page('/e/:slug', (slug, lang) => buildEventSeo(app.ctx, slug, lang), eventSsr);
  page('/o/:slug', (slug, lang) => buildOrganizerSeo(app.ctx, slug, lang), organizerSsr);
  page('/c/:slug', (slug, lang) => buildCollectionSeo(app.ctx, slug, lang), collectionSsr);

  for (const surface of SURFACES) {
    const shell = join(dir, surface.shell);
    for (const route of surface.routes) {
      app.get(route, async (req, reply) => {
        const entry = await load(shell);
        if (!entry) throw notFound();
        if (!('strict' in surface)) reply.header('content-security-policy', DESIGN_RUNTIME_CSP);
        // The shell carries no data of its own, so the edge may keep it for the deployment.
        return serve(req, reply, entry, 'shell');
      });
    }
  }

  // A browser asking for the old entry point gets sent to the screen; API clients asking
  // for the same path with Accept: application/json still reach the endpoint below it.
  for (const [from, to] of Object.entries(MOVED)) {
    app.get(from, async (req, reply) => {
      if (!String(req.headers.accept ?? '').includes('text/html')) throw notFound();
      return reply.redirect(to, 302);
    });
  }

  // The map became the list; old links and bookmarks land on it.
  // The map is a view of the list.
  app.get('/map', async (_req, reply) => reply.redirect('/list?view=map', 302));
  app.get('/app/map', async (_req, reply) => reply.redirect('/app/list', 301));

  // The city landing pages (/vi/ho-chi-minh/edm/this-weekend…) are gone: each event page now
  // answers search engines itself. Their links land on the list with the same filters.
  for (const route of ['/vi/:city', '/en/:city', '/city/:city', '/vi/:city/*', '/en/:city/*', '/city/:city/*']) {
    app.get<{ Params: { city: string; '*'?: string } }>(route, async (req, reply) => reply.redirect(legacyListPath(req.url.split('/')[1], req.params.city, req.params['*'] ?? ''), 301));
  }

  // The template, logic and data chunks a shell pulls in, plus the shared runtime.
  for (const folder of ['pages', 'ui']) {
    app.get<{ Params: { '*': string } }>(`/${folder}/*`, async (req, reply) => {
      const rel = normalize(req.params['*']).replace(/^(\.\.[/\\])+/, '');
      const file = join(dir, folder, rel);
      if (!file.startsWith(join(dir, folder))) throw notFound();
      const entry = await load(file);
      if (!entry) throw notFound();
      const q = req.query as { v?: string };
      return serve(req, reply, entry, version && q.v === version ? 'asset' : 'file');
    });
  }

  // Browsers ask for this path on their own, whatever the page links.
  app.get('/favicon.ico', async (req, reply) => {
    const entry = await load(join(dir, 'ui/assets/favicon.ico'));
    if (!entry) throw notFound();
    return serve(req, reply, entry, 'file');
  });
}
