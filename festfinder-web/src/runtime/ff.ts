/**
 * FeestFinder's client runtime for the Kính đêm pages: the API, the session, the server
 * clock, sign-in, analytics, the map loader, story images and the small helpers the pages
 * call as `FF.*`.
 */
import { dataLang, tx, type Lang } from '@/kd/copy';

export type { Lang };
export type Localized = { en: string; vi: string };

export interface Session {
  user: { id: string; name: string | null; email: string | null; phone: string | null; role: string; [k: string]: unknown } | null;
  organizers: { id: string; slug: string; name: string; role: string }[];
  readOnly: boolean;
  impersonatedBy: string | null;
  /** Personas (festfinder-backend services/roles.ts personasOf): the one craft on besides attending, if any. */
  roles?: { artist: 'active' | 'pending' | 'disabled' | null; organizer: 'active' | 'pending' | 'disabled' | null };
  craft?: 'artist' | 'organizer' | null;
  artist?: { id: string; slug: string; name: string } | null;
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

// Every event is EDM (design v2): its hue is the information turquoise (theme.css `info`). The other
// genres' tones stay for old links; the story art below is v2's dark ground with the accent's glow.
const GENRE_TONE: Record<string, string> = { Festival: 'fest', EDM: 'edm', Indie: 'live', Rock: 'live', 'Hip-Hop': 'live', Pop: 'live', Jazz: 'live', Food: 'culture', Culture: 'culture' };
const TONES: Record<string, { hue: string; art: string }> = {
  fest: { hue: '#FF8709', art: 'radial-gradient(circle at 76% 72%,#FFF1FE 0,#FEC5FB 12%,#F100CB 30%,rgba(241,0,203,0) 30.5%),linear-gradient(150deg,#FFD29C 0%,#FF8709 48%,#E8388A 118%)' },
  edm: { hue: '#00D9D0', art: 'radial-gradient(circle at 76% 72%,#FFFCE1 0,#FEC5FB 12%,#9D95FF 30%,rgba(157,149,255,0) 30.5%),linear-gradient(150deg,#BFF3FF 0%,#00BAE2 48%,#5A62E0 120%)' },
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
  // The API writes Vietnamese and English; a page in another language reads English (kd/copy dataLang).
  const headers: Record<string, string> = { 'x-lang': dataLang(opts?.lang || FF.lang) };
  // Studio acts for one organiser at a time when the account belongs to several (http/guards.ts requireOrganizer).
  if (FF.organizerId && /^\/(organizer|door)\//.test(path)) headers['x-organizer-id'] = FF.organizerId;
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
    const err = (data && (data).error) || {};
    // The last failure, for a bug report (kd/feedback): the path without its query, never the body.
    FF.lastApiError = { method, path: path.split('?')[0], status: res.status, code: err.code || 'http_' + res.status };
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
FF.text = (loc: unknown, lang: Lang) => (loc && typeof loc === 'object' ? tx((loc as any), lang) || (loc as any).en || '' : loc || '');
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

// ---- story images (runtime/story.ts, loaded when someone shares) -----------------------

type StorySpec = import('./story').StorySpec;
FF.storyPng = async (spec: StorySpec) => (await import('./story')).storyPng(spec);
FF.storyVideo = async (spec: StorySpec, seconds?: number) => (await import('./story')).storyVideo(spec, seconds);

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
FF.authProviders = () => FF.maybe(FF.get('/auth/providers'), { google: true, fb: false, ig: false, tiktok: false, sms: false, zalo: false, wa: false, email: true, password: true });

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
    const body = JSON.stringify({ name, anonId: anonId(), props: { path: location.pathname, build: process.env.NEXT_PUBLIC_BUILD_ID || undefined, ...(props || {}) } });
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
