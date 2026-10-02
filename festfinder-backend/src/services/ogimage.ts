import { crc32, deflateSync } from 'node:zlib';

/*
 * The link-preview picture of an event without a cover: its genre's art, the same two-hue
 * body and lit sphere the screens draw in CSS (FF.genreArt), as a 1200×630 PNG. Facebook,
 * Zalo and Google Discover want a raster image at least 1200 wide; there is no image
 * library on the server, so this paints the pixels and writes the PNG itself.
 */

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

type Stop = [string, number];

/** The CSS of FF.genreArt in ff-client.js: a 150° body gradient, and a sphere at 76% 72% sized by the farthest corner. */
const TONES: Record<string, { body: Stop[]; ball: Stop[] }> = {
  fest: { body: [['#FFD29C', 0], ['#FF8709', 0.48], ['#E8388A', 1.18]], ball: [['#FFF1FE', 0], ['#FEC5FB', 0.12], ['#F100CB', 0.3]] },
  edm: { body: [['#BFF3FF', 0], ['#00BAE2', 0.48], ['#5A62E0', 1.2]], ball: [['#FFFCE1', 0], ['#FEC5FB', 0.12], ['#9D95FF', 0.3]] },
  live: { body: [['#E4E1FF', 0], ['#9D95FF', 0.48], ['#C22FCF', 1.2]], ball: [['#E9FCFF', 0], ['#7FE3F5', 0.12], ['#00BAE2', 0.3]] },
  culture: { body: [['#FFF1FE', 0], ['#FEC5FB', 0.45], ['#E86FD8', 1.2]], ball: [['#FFF3DF', 0], ['#FFB35C', 0.12], ['#FF8709', 0.3]] },
  brand: { body: [['#DFFFD1', 0], ['#ABFF84', 0.35], ['#0AE448', 0.75], ['#00BAE2', 1.3]], ball: [['#FFFCE1', 0], ['#DFFFD1', 0.12], ['#00BAE2', 0.3]] },
};
export const OG_TONES = Object.keys(TONES);

const GENRE_TONE: Record<string, string> = { Festival: 'fest', EDM: 'edm', Indie: 'live', 'Hip-Hop': 'live', Pop: 'live', Jazz: 'live', Food: 'culture', Culture: 'culture' };
export const toneOf = (genre: string | null | undefined) => GENRE_TONE[genre ?? ''] ?? 'brand';

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** The colour at position t along a CSS gradient's stops. */
function at(stops: { c: number[]; p: number }[], t: number): number[] {
  if (t <= stops[0].p) return stops[0].c;
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i].p) {
      const a = stops[i - 1], b = stops[i], k = (t - a.p) / (b.p - a.p || 1);
      return [0, 1, 2].map((j) => a.c[j] + (b.c[j] - a.c[j]) * k);
    }
  }
  return stops[stops.length - 1].c;
}

function png(width: number, height: number, rgbRows: Buffer): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(rgbRows, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const cache = new Map<string, Buffer>();

/** The genre art for one tone, painted once per process. */
export function genreArtPng(tone: string): Buffer | null {
  const spec = TONES[tone];
  if (!spec) return null;
  const hit = cache.get(tone);
  if (hit) return hit;
  const W = OG_WIDTH, H = OG_HEIGHT;
  const body = spec.body.map(([c, p]) => ({ c: rgb(c), p }));
  const ball = spec.ball.map(([c, p]) => ({ c: rgb(c), p }));
  // linear-gradient(150deg): the line runs towards 150° clockwise from "up", through the centre.
  const rad = (150 * Math.PI) / 180, dx = Math.sin(rad), dy = -Math.cos(rad);
  const span = Math.abs(W * dx) + Math.abs(H * dy);
  // radial-gradient(circle at 76% 72%): stops are fractions of the distance to the farthest corner.
  const bx = W * 0.76, by = H * 0.72, ray = Math.hypot(Math.max(bx, W - bx), Math.max(by, H - by));
  const edge = ball[ball.length - 1].p * ray;
  const ballStops = ball.map((s) => ({ c: s.c, p: s.p / ball[ball.length - 1].p }));

  // Both gradients as lookup tables, so a pixel costs a few multiplications.
  const N = 1024;
  const lut = (stops: { c: number[]; p: number }[], from: number, to: number) => {
    const t = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const c = at(stops, from + ((to - from) * i) / (N - 1)); t[i * 3] = c[0]; t[i * 3 + 1] = c[1]; t[i * 3 + 2] = c[2]; }
    return t;
  };
  const bodyLut = lut(body, 0, 1), ballLut = lut(ballStops, 0, 1);
  const idx = (v: number) => Math.min(N - 1, Math.max(0, Math.round(v * (N - 1)))) * 3;

  // Each row starts with filter 2 (up): the art changes slowly, so the rows compress to little.
  const stride = W * 3 + 1;
  const raw = Buffer.alloc(stride * H);
  const prev = new Uint8Array(W * 3);
  const row = new Uint8Array(W * 3);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const b = idx(((x + 0.5 - W / 2) * dx + (y + 0.5 - H / 2) * dy) / span + 0.5);
      let r = bodyLut[b], g = bodyLut[b + 1], bl = bodyLut[b + 2];
      const d = Math.hypot(x + 0.5 - bx, y + 0.5 - by);
      const cover = Math.min(1, Math.max(0, edge - d + 0.5)); // a soft pixel at the sphere's rim
      if (cover > 0) {
        const k = idx(d / edge);
        r = r * (1 - cover) + ballLut[k] * cover; g = g * (1 - cover) + ballLut[k + 1] * cover; bl = bl * (1 - cover) + ballLut[k + 2] * cover;
      }
      row[x * 3] = Math.round(r); row[x * 3 + 1] = Math.round(g); row[x * 3 + 2] = Math.round(bl);
    }
    const o = y * stride;
    raw[o] = 2;
    for (let i = 0; i < row.length; i++) raw[o + 1 + i] = (row[i] - prev[i]) & 0xff;
    prev.set(row);
  }
  const out = png(W, H, raw);
  cache.set(tone, out);
  return out;
}
