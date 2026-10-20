/**
 * Story images and clips (1080×1920), loaded only when someone shares: the runtime (ff.ts) asks
 * for this chunk from FF.storyPng, FF.storyVideo and FF.shareStory, so no page carries it at boot.
 */
import { FF } from './ff';


export interface StorySpec {
  genre?: string; kicker?: string; title: string; lines?: string[]; stats?: { value: string | number; label: string }[]; url?: string;
  /** A badge drawn large in the art (growth plan card E): its sign's paths (a 256 box) or its number, ringed by its tier. */
  badge?: { paths: string[] | null; number: string | null; tier: 'common' | 'rare' | 'legendary' };
}

/** The badge ring's colour by tier: line-2, info, lime (kd/theme.css). */
const BADGE_RING = { common: '#383B3F', rare: '#00D9D0', legendary: '#E4F222' }; // tokens-ok: canvas needs literals

/** A badge's mark, 480px, centred in the story's art. */
function drawBadge(x: CanvasRenderingContext2D, b: NonNullable<StorySpec['badge']>, cx: number, cy: number, k: number) {
  const r = 240 * (0.85 + 0.15 * k);
  x.save();
  x.globalAlpha = k;
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2);
  x.fillStyle = '#0F1011'; x.fill(); // tokens-ok: surface-1 on canvas
  x.lineWidth = 14; x.strokeStyle = BADGE_RING[b.tier]; x.stroke();
  x.fillStyle = '#F7F8F8'; // tokens-ok: fg-1 on canvas
  if (b.paths?.length) {
    const s = (r * 0.92) / 256;
    x.translate(cx - 128 * s, cy - 128 * s); x.scale(s, s);
    for (const d of b.paths) x.fill(new Path2D(d));
  } else if (b.number) {
    x.font = storyFont(700, b.number.length > 3 ? 150 : 190); x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(b.number, cx, cy + 6);
  }
  x.restore();
}

// The story art as canvas stops (design v2, logo pack v2): a dark body and a glow of the accent,
// lime at its heart through mint to turquoise, fading out at its edge.
const V2_ART = { body: ['#161718', '#0D1A1A', '#08090A'], ball: ['#E4F222', '#72E679', 'rgba(0,217,208,0)'] };
const STORY_TONES: Record<string, { body: string[]; ball: string[] }> = { edm: V2_ART, brand: V2_ART };
const wrapLines = (x: CanvasRenderingContext2D, text: unknown, width: number, max: number) => {
  const words = String(text || '').split(/\s+/), out: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? line + ' ' + w : w;
    if (x.measureText(next).width > width && line) { out.push(line); line = w; } else line = next;
  }
  if (line) out.push(line);
  if (out.length > max) { out.length = max; out[max - 1] = out[max - 1].replace(/\s*\S*$/, '') + '…'; }
  return out;
};
const storyFont = (w: number, px: number) => w + ' ' + px + 'px "Noto Sans Variable", "Noto Sans Thai Variable", "Noto Sans JP Variable", "Noto Sans", system-ui, sans-serif';
const storyFonts = async () => {
  try { await Promise.all([document.fonts.load(storyFont(700, 96)), document.fonts.load(storyFont(500, 44))]); } catch { /* the system font will do */ }
};
const ease = (a: number, b: number, p: number) => { const k = Math.max(0, Math.min(1, (p - a) / (b - a))); return 1 - Math.pow(1 - k, 3); };

/**
 * One 1080×1920 story frame: the genre's art, a kicker, the title, a few lines (or big
 * numbers), and the link. `p` builds it up from 0 to 1 (1 is the still image); `drift`
 * moves the lit sphere for a clip.
 */
function drawStory(x: CanvasRenderingContext2D, spec: StorySpec, p: number, drift: number) {
  const W = 1080, H = 1920, t = STORY_TONES[FF.tone(spec.genre)] || STORY_TONES.brand;
  const font = storyFont;
  x.globalAlpha = 1;
  x.fillStyle = '#08090A'; x.fillRect(0, 0, W, H);
  const ax = 72, ay = 140, aw = W - 144, ah = spec.stats ? 640 : 860;
  x.save();
  x.beginPath(); x.roundRect(ax, ay, aw, ah, 40); x.clip();
  const body = x.createLinearGradient(ax, ay, ax + aw * 0.7, ay + ah);
  body.addColorStop(0, t.body[0]); body.addColorStop(0.48, t.body[1]); body.addColorStop(1, t.body[2]);
  x.fillStyle = body; x.fillRect(ax, ay, aw, ah);
  const bx = ax + aw * (0.76 - 0.06 * Math.sin(drift * Math.PI * 2)), by = ay + ah * (0.72 - 0.05 * Math.cos(drift * Math.PI * 2));
  const br = Math.max(aw, ah) * (0.42 + 0.03 * Math.sin(drift * Math.PI * 4)) * (0.8 + 0.2 * ease(0, 0.4, p));
  const ball = x.createRadialGradient(bx, by, 0, bx, by, br);
  ball.addColorStop(0, t.ball[0]); ball.addColorStop(0.4, t.ball[1]); ball.addColorStop(1, t.ball[2]);
  x.fillStyle = ball; x.beginPath(); x.arc(bx, by, br, 0, Math.PI * 2); x.fill();
  x.restore();
  if (spec.badge) drawBadge(x, spec.badge, ax + aw / 2, ay + ah / 2, ease(0, 0.35, p));
  // Text slides up into place, one block after another.
  const block = (a: number, b: number) => { const k = ease(a, b, p); x.globalAlpha = k; return (1 - k) * 40; };
  let y = ay + ah + 110;
  x.textBaseline = 'alphabetic';
  if (spec.kicker) { const o = block(0.1, 0.4); x.font = font(600, 40); x.fillStyle = FF.genreHue(spec.genre); x.fillText(String(spec.kicker).toUpperCase(), ax, y + o); y += 96; }
  let o = block(0.2, 0.55);
  x.font = font(700, 92); x.fillStyle = '#F7F8F8';
  for (const l of wrapLines(x, spec.title, aw, 3)) { x.fillText(l, ax, y + o); y += 104; }
  y += 18;
  o = block(0.4, 0.75);
  if (spec.stats) {
    const col = aw / 2;
    spec.stats.slice(0, 4).forEach((st, i) => {
      const sx = ax + (i % 2) * col, sy = y + Math.floor(i / 2) * 190 + o;
      x.font = font(700, 84); x.fillStyle = '#E4F222'; x.fillText(String(st.value), sx, sy + 60);
      x.font = font(500, 36); x.fillStyle = '#8A8F98';
      x.fillText(wrapLines(x, st.label, col - 30, 1)[0] || '', sx, sy + 116);
    });
    y += Math.ceil(Math.min(4, spec.stats.length) / 2) * 190;
  }
  x.font = font(500, 44); x.fillStyle = '#D0D6E0';
  for (const l of spec.lines || []) for (const w of wrapLines(x, l, aw, 2)) { if (y > H - 260) break; x.fillText(w, ax, y + o); y += 62; }
  block(0.55, 0.9);
  x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(ax, H - 210, aw, 2);
  x.font = font(700, 48); x.fillStyle = '#F7F8F8'; x.fillText('FeestFinder', ax, H - 120);
  if (spec.url) { x.font = font(500, 34); x.fillStyle = '#00D9D0'; x.textAlign = 'right'; x.fillText(String(spec.url).replace(/^https?:\/\//, ''), ax + aw, H - 122); x.textAlign = 'left'; }
  x.globalAlpha = 1;
}
const storyCanvas = () => { const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; return c; };

/** The story as a PNG, for an Instagram or Zalo story. */
export async function storyPng(spec: StorySpec): Promise<Blob> {
  const c = storyCanvas();
  await storyFonts();
  drawStory(c.getContext('2d')!, spec, 1, 0);
  return new Promise((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error('canvas'))), 'image/png'));
}

/**
 * The story as a short vertical clip for TikTok and Reels, recorded from the canvas as it
 * builds up. MP4 where the browser records it (Chrome, Safari), WebM otherwise; null where
 * it cannot record at all, so the caller can fall back to the picture.
 */
export async function storyVideo(spec: StorySpec, seconds?: number): Promise<Blob | null> {
  const c = storyCanvas();
  if (typeof MediaRecorder === 'undefined' || !c.captureStream) return null;
  const type = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t));
  if (!type) return null;
  await storyFonts();
  const x = c.getContext('2d')!;
  drawStory(x, spec, 0, 0);
  const stream = c.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 6000000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise((ok) => { rec.onstop = ok; });
  rec.start(250);
  const total = (seconds || 6) * 1000, t0 = performance.now();
  // Timers, not animation frames: a clip still finishes if the tab goes to the background.
  await new Promise<void>((ok) => {
    const tick = () => {
      const t = performance.now() - t0;
      drawStory(x, spec, Math.min(1, t / 1800), t / total);
      if (t < total) setTimeout(tick, 1000 / 30); else ok();
    };
    tick();
  });
  rec.stop();
  await stopped;
  stream.getTracks().forEach((tr) => tr.stop());
  return new Blob(chunks, { type: type.split(';')[0] });
}

