// Serves the map's PMTiles archives on this machine, with the range requests and CORS that
// MapLibre's pmtiles protocol needs (python's http.server answers no ranges):
//
//   node scripts/tiles-server.ts [dir=.data/tiles] [port=4400]
//
// The API then takes MAP_OVERVIEW_URL=http://localhost:4400/feestfinder-world.pmtiles and
// MAP_TILES_URL=http://localhost:4400/feestfinder-cities.pmtiles (localhost is allowed outside
// production only). Build the archives with festfinder-backend/scripts/build-tiles.sh.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { basename, join, resolve } from 'node:path';

const dir = resolve(process.argv[2] ?? '.data/tiles');
const port = Number(process.argv[3] ?? 4400);

createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Range, If-Match');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, ETag');
  if (req.method === 'OPTIONS') return void res.writeHead(204).end();
  const name = basename(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
  if (!name.endsWith('.pmtiles') || (req.method !== 'GET' && req.method !== 'HEAD')) return void res.writeHead(404).end();
  let size: number, mtime: number;
  try { ({ size, mtimeMs: mtime } = statSync(join(dir, name))); } catch { return void res.writeHead(404).end(); }
  const etag = `"${size.toString(16)}-${Math.floor(mtime).toString(16)}"`;
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('ETag', etag);
  res.setHeader('Content-Type', 'application/octet-stream');
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
  let start = 0, end = size - 1;
  if (m) {
    start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
    end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    if (start > end || start >= size) return void res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end();
    res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
  } else {
    res.writeHead(200, { 'Content-Length': size });
  }
  if (req.method === 'HEAD') return void res.end();
  createReadStream(join(dir, name), { start, end }).pipe(res);
}).listen(port, () => console.log(`tiles from ${dir} on http://localhost:${port}/`));
