import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { notFound } from '../lib/errors.ts';

/**
 * The four Claude Design surfaces, wired to this API and served from the same origin, and
 * the operations back office (/ops) next to them.
 *
 * Each surface is a small shell that answers every route below its base, so the screens,
 * tabs and panels all have real URLs while the browser keeps one copy of the template,
 * the logic and the runtime.
 */
const SURFACES = [
  { base: '/', shell: 'pages/web/shell.html', routes: ['/', '/e/:slug', '/o/:slug', '/about', '/advertise', '/map', '/saved', '/stats/:key', '/city/:city/:when', '/vi/:city/:when', '/en/:city/:when'] },
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
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
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
const COMPRESS = new Set(['.html', '.js', '.css', '.json', '.svg', '.md']);

type Cached = { etag: string; body: Buffer; gzip?: Buffer; type: string };

export default async function frontendRoutes(app: FastifyInstance) {
  const dir = resolve(process.env.FRONTEND_DIR ?? '../festfinder-frontend');
  if (!existsSync(join(dir, 'pages/web/shell.html'))) {
    app.ctx.log(`frontend not found at ${dir}; serving the API only`);
    return;
  }
  const dev = app.ctx.config.env !== 'production';
  const cache = new Map<string, Cached & { mtime: number }>();

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
    const body = await readFile(file);
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

  function serve(req: FastifyRequest, reply: FastifyReply, entry: Cached, maxAge: number) {
    reply.type(entry.type).header('etag', entry.etag)
      .header('cache-control', dev ? 'no-cache' : `public, max-age=${maxAge}`)
      .header('vary', 'accept-encoding');
    if (req.headers['if-none-match'] === entry.etag) return reply.code(304).send();
    const accepts = String(req.headers['accept-encoding'] ?? '').includes('gzip');
    if (entry.gzip && accepts) return reply.header('content-encoding', 'gzip').send(entry.gzip);
    return reply.send(entry.body);
  }

  for (const surface of SURFACES) {
    const shell = join(dir, surface.shell);
    for (const route of surface.routes) {
      app.get(route, async (req, reply) => {
        const entry = await load(shell);
        if (!entry) throw notFound();
        if (!('strict' in surface)) reply.header('content-security-policy', DESIGN_RUNTIME_CSP);
        // The shell carries no data of its own, so it may be revalidated cheaply.
        return serve(req, reply, entry, 0);
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

  // The template, logic and data chunks a shell pulls in, plus the shared runtime.
  for (const folder of ['pages', 'ui']) {
    app.get<{ Params: { '*': string } }>(`/${folder}/*`, async (req, reply) => {
      const rel = normalize(req.params['*']).replace(/^(\.\.[/\\])+/, '');
      const file = join(dir, folder, rel);
      if (!file.startsWith(join(dir, folder))) throw notFound();
      const entry = await load(file);
      if (!entry) throw notFound();
      return serve(req, reply, entry, 3600);
    });
  }

  // Browsers ask for this path on their own, whatever the page links.
  app.get('/favicon.ico', async (req, reply) => {
    const entry = await load(join(dir, 'ui/assets/favicon.ico'));
    if (!entry) throw notFound();
    return serve(req, reply, entry, 86400);
  });
}
