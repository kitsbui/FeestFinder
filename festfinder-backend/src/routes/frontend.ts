import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import type { Config } from '../config.ts';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { notFound } from '../lib/errors.ts';
import { GENRES } from '../lib/i18n.ts';
import { isCity } from '../lib/places.ts';
import { slugify } from '../lib/contact.ts';

/**
 * The operations back office (/ops), and the /ui and /pages files it loads. The site's own
 * screens are the Next front in festfinder-web.
 *
 * The /ops shell answers every route below it, so its tabs and panels have real URLs while
 * the browser keeps one copy of the scripts. It is plain scripts on vendored React, so it
 * keeps the strict policy from app.ts.
 */
const OPS = { shell: 'pages/ops/shell.html', routes: ['/ops', '/ops/*'] };

/** The hosts the map's tiles and glyphs come from, for connect-src. */
export function mapOrigins(map: Config['map']): string[] {
  return [...new Set([map.tilesUrl, map.overviewUrl, map.glyphsUrl].filter((u): u is string => !!u).map((u) => new URL(u.replace(/\{[^}]+\}/g, 'x')).origin))];
}

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
 * - shell: the empty /ops shell; the browser checks back, the edge keeps it.
 */
type Policy = 'asset' | 'file' | 'shell';
const POLICY: Record<Policy, string> = {
  asset: 'public, max-age=31536000, immutable',
  file: 'public, max-age=3600, s-maxage=86400',
  shell: 'public, max-age=0, s-maxage=86400',
};

/** A short hash of every file under pages/ and ui/, so a deployment's URLs change with its content. */
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
 * stylesheet loads next to it.
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
  if (!existsSync(join(dir, OPS.shell))) {
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

  for (const route of OPS.routes) {
    app.get(route, async (req, reply) => {
      const entry = await load(join(dir, OPS.shell));
      if (!entry) throw notFound();
      // The shell carries no data of its own, so the edge may keep it for the deployment.
      return serve(req, reply, entry, 'shell');
    });
  }

  // The old city landing pages (/city/ho-chi-minh/edm/this-weekend…) land on the list with the
  // same filters. The Next front answers /vi/… and /en/… itself and sends /city/… here.
  for (const route of ['/city/:city', '/city/:city/*']) {
    app.get<{ Params: { city: string; '*'?: string } }>(route, async (req, reply) => reply.redirect(legacyListPath(req.url.split('/')[1], req.params.city, req.params['*'] ?? ''), 301));
  }

  // The modules and styles the /ops shell pulls in, and the shared /ui files (fonts, icons,
  // theme, map, brand images).
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
