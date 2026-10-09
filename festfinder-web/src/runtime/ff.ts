/**
 * FeestFinder's client runtime for the Kính đêm pages: the API, the session, the server
 * clock, sign-in, analytics, the map loader, story images and the small helpers the pages
 * call as `FF.*`.
 */

export type Lang = 'en' | 'vi';
export type Localized = { en: string; vi: string };

export interface Session {
  user: { id: string; name: string | null; email: string | null; phone: string | null; role: string; [k: string]: unknown } | null;
  organizers: { id: string; slug: string; name: string; role: string }[];
  readOnly: boolean;
  impersonatedBy: string | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  constructor(status: number, code: string, message?: string, details?: unknown) {
    super(message || code);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Colour is genre: Lễ hội orange, EDM blue, Nhạc sống lilac (indie, hip-hop, pop, jazz),
// Văn hoá pink (food, culture), and FeestFinder green for anything else. Each genre's art is
// a two-hue body with a lit sphere of the neighbouring hue; the API's OG images
// (services/ogimage.ts) draw the same stops.
const GENRE_TONE: Record<string, string> = { Festival: 'fest', EDM: 'edm', Indie: 'live', Rock: 'live', 'Hip-Hop': 'live', Pop: 'live', Jazz: 'live', Food: 'culture', Culture: 'culture' };
const TONES: Record<string, { hue: string; art: string }> = {
  fest: { hue: '#FF8709', art: 'radial-gradient(circle at 76% 72%,#FFF1FE 0,#FEC5FB 12%,#F100CB 30%,rgba(241,0,203,0) 30.5%),linear-gradient(150deg,#FFD29C 0%,#FF8709 48%,#E8388A 118%)' },
  edm: { hue: '#00BAE2', art: 'radial-gradient(circle at 76% 72%,#FFFCE1 0,#FEC5FB 12%,#9D95FF 30%,rgba(157,149,255,0) 30.5%),linear-gradient(150deg,#BFF3FF 0%,#00BAE2 48%,#5A62E0 120%)' },
  live: { hue: '#9D95FF', art: 'radial-gradient(circle at 76% 72%,#E9FCFF 0,#7FE3F5 12%,#00BAE2 30%,rgba(0,186,226,0) 30.5%),linear-gradient(150deg,#E4E1FF 0%,#9D95FF 48%,#C22FCF 120%)' },
  culture: { hue: '#FEC5FB', art: 'radial-gradient(circle at 76% 72%,#FFF3DF 0,#FFB35C 12%,#FF8709 30%,rgba(255,135,9,0) 30.5%),linear-gradient(150deg,#FFF1FE 0%,#FEC5FB 45%,#E86FD8 120%)' },
  brand: { hue: '#0AE448', art: 'radial-gradient(circle at 76% 72%,#FFFCE1 0,#DFFFD1 12%,#00BAE2 30%,rgba(0,186,226,0) 30.5%),linear-gradient(150deg,#DFFFD1 0%,#ABFF84 35%,#0AE448 75%,#00BAE2 130%)' },
};

const inflight = new Map<string, Promise<unknown>>();

/**
 * One instance per page. The helpers below hang off it and pages set a few hooks on it
 * (beforeSignOut), which is why it is typed loosely beyond the core.
 */
export const FF: {
  data: Record<string, any>;
  session: Session | null;
  lang: Lang;
  clockOffset: number;
  ApiError: typeof ApiError;
  [k: string]: any;
} = {
  data: {},
  session: null,
  lang: 'en',
  clockOffset: 0,
  ApiError,
};

// ---- the API -------------------------------------------------------------------------

/** JSON request against the same-origin API. The session cookie rides along. */
FF.api = async function api(method: string, path: string, body?: unknown, opts?: { lang?: Lang }) {
  // Signing out: let the app detach this device first (push, offline copies).
  if (method === 'DELETE' && path === '/auth/session' && FF.beforeSignOut) await FF.beforeSignOut().catch(() => {});
  const headers: Record<string, string> = { 'x-lang': opts?.lang || FF.lang };
  let payload: BodyInit | undefined;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(path, { method, headers, body: payload, credentials: 'same-origin' });
  const type = res.headers.get('content-type') || '';
  const data = type.includes('json') ? await res.json() : await res.text();
  if (!res.ok) {
    const err = (data && (data as any).error) || {};
    throw new ApiError(res.status, err.code || 'http_' + res.status, err.message, err.details);
  }
  return data;
};
FF.get = (p: string, o?: { lang?: Lang }) => FF.api('GET', p, undefined, o);
FF.post = (p: string, b?: unknown, o?: { lang?: Lang }) => FF.api('POST', p, b === undefined ? {} : b, o);
FF.put = (p: string, b?: unknown, o?: { lang?: Lang }) => FF.api('PUT', p, b === undefined ? {} : b, o);
FF.patch = (p: string, b?: unknown, o?: { lang?: Lang }) => FF.api('PATCH', p, b === undefined ? {} : b, o);
FF.del = (p: string, o?: { lang?: Lang }) => FF.api('DELETE', p, undefined, o);

/** Resolve to a fallback instead of throwing — for optional data. */
FF.maybe = async function maybe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 401)) console.warn('[ff]', e);
    return fallback;
  }
};

/** Fire an API call from a click handler: log failures, optionally surface them. */
FF.fire = function fire<T>(promise: Promise<T>, onError?: (e: unknown) => void) {
  return promise.catch((e) => {
    console.warn('[ff]', e);
    if (onError) onError(e);
  });
};

FF.loadScript = function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('failed to load ' + src));
    document.head.appendChild(s);
  });
};

// ---- time: the server clock may be pinned (FF_NOW) for the demo ------------------------

FF.now = () => new Date(Date.now() + FF.clockOffset);
FF.hhmm = function hhmm(d: string | number | Date) {
  const v = new Date(new Date(d).getTime() + 7 * 3600000);
  return String(v.getUTCHours()).padStart(2, '0') + ':' + String(v.getUTCMinutes()).padStart(2, '0');
};

// ---- devices and ticket QR -------------------------------------------------------------

/** A stable id for this browser, so door scans stay idempotent per device. */
FF.deviceId = function deviceId() {
  let id: string | null = null;
  try {
    id = localStorage.getItem('ff_device');
  } catch {
    // Private window: fall back to a per-session id.
  }
  if (!id) {
    id = 'web-' + Math.random().toString(36).slice(2, 10);
    try {
      localStorage.setItem('ff_device', id);
    } catch {
      // The id lives for this page only.
    }
  }
  return id;
};

/** The ticket QR signature: HMAC-SHA256(scan key, code), base64url, first 22 chars. */
FF.hmac22 = async function hmac22(key: string, message: string) {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(message));
  let b64 = '';
  for (const b of new Uint8Array(sig)) b64 += String.fromCharCode(b);
  return btoa(b64).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '').slice(0, 22);
};

// ---- shared presentation helpers --------------------------------------------------------

FF.tone = (genre: string) => GENRE_TONE[genre] || 'brand';
FF.genreHue = (genre: string) => TONES[FF.tone(genre)].hue;
FF.text = (loc: unknown, lang: Lang) => (loc && typeof loc === 'object' ? (loc as any)[lang] || (loc as any).en || '' : loc || '');
FF.errorText = (e: any, lang: Lang) => (e && e.message) || (lang === 'vi' ? 'Đã có lỗi xảy ra' : 'Something went wrong');
/** A /ui file. Next serves public/ui as it is, without the API's version stamp. */
FF.asset = (url: string) => url;
/** The map module (ui/map/ff-map.js) and MapLibre, loaded the first time a map opens. */
let mapLoad: Promise<any> | null = null;
FF.loadMap = function loadMap() {
  if (!mapLoad) {
    const loading: Promise<any> = ((window as any).FFMap ? Promise.resolve() : FF.loadScript('/ui/map/ff-map.js'))
      .then(() => (window as any).FFMap.load(FF.asset).then(() => (window as any).FFMap));
    loading.catch(() => { mapLoad = null; });
    mapLoad = loading;
  }
  return mapLoad;
};

// ---- story images ---------------------------------------------------------------------

interface StorySpec { genre?: string; kicker?: string; title: string; lines?: string[]; stats?: { value: string | number; label: string }[]; url?: string }

// The genre art as canvas stops: the body's three hues and the lit sphere's three.
const STORY_TONES: Record<string, { body: string[]; ball: string[] }> = {
  fest: { body: ['#FFD29C', '#FF8709', '#E8388A'], ball: ['#FFF1FE', '#FEC5FB', '#F100CB'] },
  edm: { body: ['#BFF3FF', '#00BAE2', '#5A62E0'], ball: ['#FFFCE1', '#FEC5FB', '#9D95FF'] },
  live: { body: ['#E4E1FF', '#9D95FF', '#C22FCF'], ball: ['#E9FCFF', '#7FE3F5', '#00BAE2'] },
  culture: { body: ['#FFF1FE', '#FEC5FB', '#E86FD8'], ball: ['#FFF3DF', '#FFB35C', '#FF8709'] },
  brand: { body: ['#DFFFD1', '#ABFF84', '#0AE448'], ball: ['#FFFCE1', '#DFFFD1', '#00BAE2'] },
};
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
const storyFont = (w: number, px: number) => w + ' ' + px + 'px "Be Vietnam Pro", system-ui, sans-serif';
const storyFonts = async () => {
  try { await Promise.all([document.fonts.load(storyFont(600, 96)), document.fonts.load(storyFont(500, 44))]); } catch { /* the system font will do */ }
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
  x.fillStyle = '#0E100F'; x.fillRect(0, 0, W, H);
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
  // Text slides up into place, one block after another.
  const block = (a: number, b: number) => { const k = ease(a, b, p); x.globalAlpha = k; return (1 - k) * 40; };
  let y = ay + ah + 110;
  x.textBaseline = 'alphabetic';
  if (spec.kicker) { const o = block(0.1, 0.4); x.font = font(600, 40); x.fillStyle = FF.genreHue(spec.genre); x.fillText(String(spec.kicker).toUpperCase(), ax, y + o); y += 96; }
  let o = block(0.2, 0.55);
  x.font = font(600, 92); x.fillStyle = '#FFFCE1';
  for (const l of wrapLines(x, spec.title, aw, 3)) { x.fillText(l, ax, y + o); y += 104; }
  y += 18;
  o = block(0.4, 0.75);
  if (spec.stats) {
    const col = aw / 2;
    spec.stats.slice(0, 4).forEach((st, i) => {
      const sx = ax + (i % 2) * col, sy = y + Math.floor(i / 2) * 190 + o;
      x.font = font(600, 84); x.fillStyle = '#ABFF84'; x.fillText(String(st.value), sx, sy + 60);
      x.font = font(500, 36); x.fillStyle = '#A5A493';
      x.fillText(wrapLines(x, st.label, col - 30, 1)[0] || '', sx, sy + 116);
    });
    y += Math.ceil(Math.min(4, spec.stats.length) / 2) * 190;
  }
  x.font = font(500, 44); x.fillStyle = '#E6E3C8';
  for (const l of spec.lines || []) for (const w of wrapLines(x, l, aw, 2)) { if (y > H - 260) break; x.fillText(w, ax, y + o); y += 62; }
  block(0.55, 0.9);
  x.fillStyle = 'rgba(255,252,225,.19)'; x.fillRect(ax, H - 210, aw, 2);
  x.font = font(600, 48); x.fillStyle = '#FFFCE1'; x.fillText('FeestFinder', ax, H - 120);
  if (spec.url) { x.font = font(500, 34); x.fillStyle = '#ABFF84'; x.textAlign = 'right'; x.fillText(String(spec.url).replace(/^https?:\/\//, ''), ax + aw, H - 122); x.textAlign = 'left'; }
  x.globalAlpha = 1;
}
const storyCanvas = () => { const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; return c; };

/** The story as a PNG, for an Instagram or Zalo story. */
FF.storyPng = async function (spec: StorySpec): Promise<Blob> {
  const c = storyCanvas();
  await storyFonts();
  drawStory(c.getContext('2d')!, spec, 1, 0);
  return new Promise((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error('canvas'))), 'image/png'));
};

/**
 * The story as a short vertical clip for TikTok and Reels, recorded from the canvas as it
 * builds up. MP4 where the browser records it (Chrome, Safari), WebM otherwise; null where
 * it cannot record at all, so the caller can fall back to the picture.
 */
FF.storyVideo = async function (spec: StorySpec, seconds?: number): Promise<Blob | null> {
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
};

/** Hands a file to the phone's share sheet, or saves it where sharing files is not possible. */
FF.canShareFile = (file: File) => !!(navigator.canShare && navigator.canShare({ files: [file] }));
FF.shareFile = async function (file: File, title?: string) {
  if (FF.canShareFile(file)) {
    try { await navigator.share({ files: [file], title }); return 'shared'; } catch (e) { if ((e as Error)?.name === 'AbortError') return 'cancelled'; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'saved';
};
FF.shareStory = async function (spec: StorySpec, name?: string) {
  const blob = await FF.storyPng(spec);
  return FF.shareFile(new File([blob], (name || 'feestfinder-story') + '.png', { type: 'image/png' }), spec.title);
};
/** Whether a link opens the Messenger or Zalo app: on a phone, yes. */
FF.isPhone = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// ---- sign-in with Google, and with a linked Facebook / Instagram -----------------------

/**
 * Leave for the provider. The API takes the answer and sends the browser back to this
 * address with ?auth=<provider>&via=signin|signup|connect, or ?auth_error=<code>.
 * `next` is what the page was about to do, done once the browser is back.
 */
FF.oauthStart = async function oauthStart(provider: string, next?: string | null) {
  const out = await FF.get('/auth/oauth/' + provider + '/start?redirectUri=' + encodeURIComponent(location.href.split('#')[0]));
  try { if (next) sessionStorage.setItem('ff_auth_next', next); else sessionStorage.removeItem('ff_auth_next'); } catch { /* storage blocked */ }
  location.href = out.url;
};

/** What the provider's return left in the address: read once, then taken out of it. */
FF.takeOAuthResult = takeOAuthResult;
function takeOAuthResult() {
  const u = new URL(location.href);
  const provider = u.searchParams.get('auth'), error = u.searchParams.get('auth_error');
  if (!provider && !error) return;
  let next: string | null = null;
  try { next = sessionStorage.getItem('ff_auth_next'); sessionStorage.removeItem('ff_auth_next'); } catch { /* storage blocked */ }
  FF.data.oauth = error ? { error, next } : { provider, via: u.searchParams.get('via') || 'signin', next };
  ['auth', 'via', 'auth_error'].forEach((k) => u.searchParams.delete(k));
  history.replaceState(history.state, '', u.pathname + u.search + u.hash);
}

const OAUTH_ERRORS: Record<string, { en: string; vi: string }> = {
  cancelled: { en: 'Sign-in cancelled', vi: 'Đã huỷ đăng nhập' },
  connection_taken: { en: 'That account is linked to another FeestFinder account', vi: 'Tài khoản này đã liên kết với một tài khoản FeestFinder khác' },
  provider_unavailable: { en: 'This sign-in is not available yet', vi: 'Cách đăng nhập này chưa mở' },
  email_taken: { en: 'That email already has an account', vi: 'Email này đã có tài khoản' },
};
FF.oauthErrorText = (code: string, lang: string) => {
  const t = OAUTH_ERRORS[code] || { en: 'Sign-in failed, try again', vi: 'Đăng nhập không thành công, thử lại' };
  return lang === 'vi' ? t.vi : t.en;
};

/** Which ways in work on this server: { google, fb, ig, zalo, wa, email, password }. */
FF.authProviders = () => FF.maybe(FF.get('/auth/providers'), { google: true, fb: false, ig: false, zalo: false, wa: false, email: true, password: true });

FF.refreshSession = async function refreshSession() {
  const s = await FF.maybe(FF.get('/auth/session?optional=1'), null);
  FF.session = s && s.user ? s : null;
  return FF.session;
};

// ---- analytics ---------------------------------------------------------------------------
//
// A few named events to /analytics/collect, which forwards them only when the site has an
// analytics provider. A visitor is a random id made here; "Do Not Track" and Global Privacy
// Control send nothing at all.

function anonId(): string | undefined {
  try {
    let id = localStorage.getItem('ff_aid');
    if (!id) { id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join(''); localStorage.setItem('ff_aid', id); }
    return id;
  } catch { return undefined; }
}
FF.track = function track(name: string, props?: Record<string, unknown>) {
  try {
    if (typeof navigator === 'undefined') return;
    if (navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
    const body = JSON.stringify({ name, anonId: anonId(), props: { path: location.pathname, ...(props || {}) } });
    if (navigator.sendBeacon) navigator.sendBeacon('/analytics/collect', new Blob([body], { type: 'text/plain' }));
    else fetch('/analytics/collect', { method: 'POST', body, keepalive: true, credentials: 'same-origin' }).catch(() => {});
  } catch { /* analytics never breaks a screen */ }
};

// ---- data loaded once ----------------------------------------------------------------------

/**
 * Fetch something at most once per page life. Pages call this when a tab or panel
 * opens, so the first paint only waits for what it actually shows.
 */
FF.once = function once<T>(key: string, loader: () => Promise<T> | T): Promise<T> {
  if (!inflight.has(key)) inflight.set(key, Promise.resolve().then(loader));
  return inflight.get(key) as Promise<T>;
};
FF.forget = function forget(key?: string) {
  if (key === undefined) inflight.clear();
  else inflight.delete(key);
};
