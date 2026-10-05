/*
 * FeestFinder client glue for the Claude Design screens.
 *
 * A page is a small shell that calls FF.mount(). We read the route, fetch the session,
 * the server clock and only the data that route needs, fill in the template and logic,
 * and then load the design runtime (support.js) — so a screen renders real data on its
 * first frame and every screen, tab and panel has a URL of its own.
 */
(function () {
  // The API names this script with its deployment's version (?v=…); everything fetched
  // below carries the same one, so browsers and the CDN can keep those files for good.
  const V = document.currentScript ? new URL(document.currentScript.src).searchParams.get('v') : null;
  const vq = (url) => (V ? url + (url.includes('?') ? '&' : '?') + 'v=' + V : url);

  // Keep the raw template hidden and the ground dark while data loads.
  const style = document.createElement('style');
  style.textContent = 'x-dc{display:none!important}html,body{background:#0E100F;margin:0}';
  document.head.appendChild(style);
  for (const href of [vq('/ui/fonts/be-vietnam-pro.css'), vq('/ui/theme.css')]) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  // The runtime asks for React from a CDN unless the host maps those URLs elsewhere.
  // We serve our own copies, so the screens have no third-party dependency at runtime
  // and a strict Content-Security-Policy can stay strict.
  window.__resources = Object.assign({
    'https://unpkg.com/react@18.3.1/umd/react.production.min.js': vq('/ui/vendor/react.production.min.js'),
    'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js': vq('/ui/vendor/react-dom.production.min.js'),
  }, window.__resources);

  const FF = (window.FF = { data: {}, session: null, lang: 'en', clockOffset: 0, route: null });

  class ApiError extends Error {
    constructor(status, code, message, details) {
      super(message || code);
      this.status = status;
      this.code = code;
      this.details = details;
    }
  }
  FF.ApiError = ApiError;

  /** JSON request against the same-origin API. The session cookie rides along. */
  FF.api = async function (method, path, body, opts) {
    const headers = { 'x-lang': (opts && opts.lang) || FF.lang };
    let payload;
    if (body instanceof FormData) payload = body;
    else if (body !== undefined) {
      headers['content-type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    const res = await fetch(path, { method, headers, body: payload, credentials: 'same-origin' });
    const type = res.headers.get('content-type') || '';
    const data = type.includes('json') ? await res.json() : await res.text();
    if (!res.ok) {
      const err = (data && data.error) || {};
      throw new ApiError(res.status, err.code || 'http_' + res.status, err.message, err.details);
    }
    return data;
  };
  FF.get = (p, o) => FF.api('GET', p, undefined, o);
  FF.post = (p, b, o) => FF.api('POST', p, b === undefined ? {} : b, o);
  FF.put = (p, b, o) => FF.api('PUT', p, b === undefined ? {} : b, o);
  FF.patch = (p, b, o) => FF.api('PATCH', p, b === undefined ? {} : b, o);
  FF.del = (p, o) => FF.api('DELETE', p, undefined, o);

  /** Resolve to a fallback instead of throwing — for optional data. */
  FF.maybe = async function (promise, fallback) {
    try {
      return await promise;
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) console.warn('[ff]', e);
      return fallback;
    }
  };

  /** Fire an API call from a click handler: log failures, optionally toast them. */
  FF.fire = function (promise, onError) {
    return promise.catch((e) => {
      console.warn('[ff]', e);
      if (onError) onError(e);
    });
  };

  FF.loadScript = function (src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('failed to load ' + src));
      document.head.appendChild(s);
    });
  };

  // ---- time: the server clock may be pinned (FF_NOW) for the demo -----------------

  FF.now = () => new Date(Date.now() + FF.clockOffset);
  /** YYYY-MM-DD in Ho Chi Minh City. */
  FF.vnDate = function (d) {
    const v = new Date(d.getTime() + 7 * 3600000);
    return v.getUTCFullYear() + '-' + String(v.getUTCMonth() + 1).padStart(2, '0') + '-' + String(v.getUTCDate()).padStart(2, '0');
  };
  /** 'YYYY-MM-DD' → local-midnight Date, the way the design code builds dates. */
  FF.pd = function (s) {
    const p = String(s).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  };
  FF.today = () => FF.pd(FF.vnDate(FF.now()));
  /** '2026-09-19' → '19 Sep' / '19/09', the way the designs write dates in lists and charts. */
  FF.dayLabel = function (iso, lang) {
    if (!iso) return '';
    const p = String(iso).split('-');
    if (p.length < 3) return String(iso);
    const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+p[1] - 1];
    return lang === 'vi' ? +p[2] + '/' + p[1] : +p[2] + ' ' + mon;
  };
  FF.hhmm = function (d) {
    const v = new Date(new Date(d).getTime() + 7 * 3600000);
    return String(v.getUTCHours()).padStart(2, '0') + ':' + String(v.getUTCMinutes()).padStart(2, '0');
  };

  // ---- files, devices and ticket QR ------------------------------------------------

  /** Pull a CSV or PDF the API serves as an attachment. */
  FF.download = function (path) {
    const a = document.createElement('a');
    a.href = path;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  /** A stable id for this browser, so door scans stay idempotent per device. */
  FF.deviceId = function () {
    let id = null;
    try {
      id = localStorage.getItem('ff_device');
    } catch {
      /* private window: fall back to a per-session id */
    }
    if (!id) {
      id = 'web-' + Math.random().toString(36).slice(2, 10);
      try {
        localStorage.setItem('ff_device', id);
      } catch {
        /* nothing to do: the id lives for this page only */
      }
    }
    return id;
  };

  /** The ticket QR signature: HMAC-SHA256(scan key, code), base64url, first 22 chars. */
  FF.hmac22 = async function (key, message) {
    const enc = new TextEncoder();
    const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', k, enc.encode(message));
    let b64 = '';
    for (const b of new Uint8Array(sig)) b64 += String.fromCharCode(b);
    return btoa(b64).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '').slice(0, 22);
  };

  // ---- shared presentation helpers ------------------------------------------------

  const GRADIENTS = [
    'linear-gradient(150deg,#FFD29C,#FF8709)', 'linear-gradient(150deg,#BFF3FF,#00BAE2)', 'linear-gradient(150deg,#E4E1FF,#9D95FF)',
    'linear-gradient(150deg,#FFF1FE,#FEC5FB)', 'linear-gradient(150deg,#DFFFD1,#0AE448)', 'linear-gradient(150deg,#FFFCE1,#ABFF84)',
  ];
  // Colour is genre: Lễ hội orange, EDM blue, Nhạc sống lilac (indie, hip-hop, pop, jazz),
  // Văn hoá pink (food, culture), and FeestFinder green for anything else. An event without
  // a cover wears its genre's art: a two-hue body with a lit sphere of the neighbouring hue.
  const GENRE_TONE = { Festival: 'fest', EDM: 'edm', Indie: 'live', Rock: 'live', 'Hip-Hop': 'live', Pop: 'live', Jazz: 'live', Food: 'culture', Culture: 'culture' };
  const TONES = {
    fest: { hue: '#FF8709', art: 'radial-gradient(circle at 76% 72%,#FFF1FE 0,#FEC5FB 12%,#F100CB 30%,rgba(241,0,203,0) 30.5%),linear-gradient(150deg,#FFD29C 0%,#FF8709 48%,#E8388A 118%)' },
    edm: { hue: '#00BAE2', art: 'radial-gradient(circle at 76% 72%,#FFFCE1 0,#FEC5FB 12%,#9D95FF 30%,rgba(157,149,255,0) 30.5%),linear-gradient(150deg,#BFF3FF 0%,#00BAE2 48%,#5A62E0 120%)' },
    live: { hue: '#9D95FF', art: 'radial-gradient(circle at 76% 72%,#E9FCFF 0,#7FE3F5 12%,#00BAE2 30%,rgba(0,186,226,0) 30.5%),linear-gradient(150deg,#E4E1FF 0%,#9D95FF 48%,#C22FCF 120%)' },
    culture: { hue: '#FEC5FB', art: 'radial-gradient(circle at 76% 72%,#FFF3DF 0,#FFB35C 12%,#FF8709 30%,rgba(255,135,9,0) 30.5%),linear-gradient(150deg,#FFF1FE 0%,#FEC5FB 45%,#E86FD8 120%)' },
    brand: { hue: '#0AE448', art: 'radial-gradient(circle at 76% 72%,#FFFCE1 0,#DFFFD1 12%,#00BAE2 30%,rgba(0,186,226,0) 30.5%),linear-gradient(150deg,#DFFFD1 0%,#ABFF84 35%,#0AE448 75%,#00BAE2 130%)' },
  };
  FF.colorFor = function (key) {
    let h = 0;
    for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return GRADIENTS[h % GRADIENTS.length];
  };
  FF.tone = (genre) => GENRE_TONE[genre] || 'brand';
  FF.genreHue = (genre) => TONES[FF.tone(genre)].hue;
  FF.genreArt = (genre) => TONES[FF.tone(genre)].art;
  /** An event's art: its cover when it has one, else its genre's. */
  FF.artOf = (x) => (x && x.coverUrl ? 'url("' + x.coverUrl + '") center/cover no-repeat' : x && x.genre ? FF.genreArt(x.genre) : (x && x.art) || TONES.brand.art);
  FF.initials = (n) => String(n || '').trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
  FF.text = (loc, lang) => (loc && typeof loc === 'object' ? loc[lang] || loc.en || '' : loc || '');
  FF.errorText = (e, lang) => (e && e.message) || (lang === 'vi' ? 'Đã có lỗi xảy ra' : 'Something went wrong');
  /** A price in whole units of its currency: 1.200.000₫, ¥5,000, THB 800 (the API's formatMoney). */
  FF.money = (n, currency, lang) => (!currency || currency === 'VND'
    ? Number(n || 0).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US') + '₫'
    : new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0));
  /** A /ui or /pages file with this deployment's version. */
  FF.asset = vq;
  /** The map module (ui/map/ff-map.js) and MapLibre, loaded the first time a map opens. */
  let mapLoad = null;
  FF.loadMap = function () {
    if (!mapLoad) {
      mapLoad = (window.FFMap ? Promise.resolve() : FF.loadScript(vq('/ui/map/ff-map.js')))
        .then(() => window.FFMap.load(vq).then(() => window.FFMap));
      mapLoad.catch(() => { mapLoad = null; });
    }
    return mapLoad;
  };

  // ---- story images ---------------------------------------------------------------

  // The genre art as canvas stops: the body's three hues and the lit sphere's three.
  const STORY_TONES = {
    fest: { body: ['#FFD29C', '#FF8709', '#E8388A'], ball: ['#FFF1FE', '#FEC5FB', '#F100CB'] },
    edm: { body: ['#BFF3FF', '#00BAE2', '#5A62E0'], ball: ['#FFFCE1', '#FEC5FB', '#9D95FF'] },
    live: { body: ['#E4E1FF', '#9D95FF', '#C22FCF'], ball: ['#E9FCFF', '#7FE3F5', '#00BAE2'] },
    culture: { body: ['#FFF1FE', '#FEC5FB', '#E86FD8'], ball: ['#FFF3DF', '#FFB35C', '#FF8709'] },
    brand: { body: ['#DFFFD1', '#ABFF84', '#0AE448'], ball: ['#FFFCE1', '#DFFFD1', '#00BAE2'] },
  };
  const wrapLines = (x, text, width, max) => {
    const words = String(text || '').split(/\s+/), out = [];
    let line = '';
    for (const w of words) {
      const next = line ? line + ' ' + w : w;
      if (x.measureText(next).width > width && line) { out.push(line); line = w; } else line = next;
    }
    if (line) out.push(line);
    if (out.length > max) { out.length = max; out[max - 1] = out[max - 1].replace(/\s*\S*$/, '') + '…'; }
    return out;
  };
  const storyFont = (w, px) => w + ' ' + px + 'px "Be Vietnam Pro", system-ui, sans-serif';
  const storyFonts = async () => {
    try { await Promise.all([document.fonts.load(storyFont(600, 96)), document.fonts.load(storyFont(500, 44))]); } catch (e) { /* the system font will do */ }
  };
  const ease = (a, b, p) => { const k = Math.max(0, Math.min(1, (p - a) / (b - a))); return 1 - Math.pow(1 - k, 3); };

  /**
   * One 1080×1920 story frame: the genre's art, a kicker, the title, a few lines (or big
   * numbers), and the link. `p` builds it up from 0 to 1 (1 is the still image); `drift`
   * moves the lit sphere for a clip.
   */
  function drawStory(x, spec, p, drift) {
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
    const d = drift || 0;
    const bx = ax + aw * (0.76 - 0.06 * Math.sin(d * Math.PI * 2)), by = ay + ah * (0.72 - 0.05 * Math.cos(d * Math.PI * 2));
    const br = Math.max(aw, ah) * (0.42 + 0.03 * Math.sin(d * Math.PI * 4)) * (0.8 + 0.2 * ease(0, 0.4, p));
    const ball = x.createRadialGradient(bx, by, 0, bx, by, br);
    ball.addColorStop(0, t.ball[0]); ball.addColorStop(0.4, t.ball[1]); ball.addColorStop(1, t.ball[2]);
    x.fillStyle = ball; x.beginPath(); x.arc(bx, by, br, 0, Math.PI * 2); x.fill();
    x.restore();
    // Text slides up into place, one block after another.
    const block = (a, b) => { const k = ease(a, b, p); x.globalAlpha = k; return (1 - k) * 40; };
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
      spec.stats.slice(0, 4).forEach((s, i) => {
        const sx = ax + (i % 2) * col, sy = y + Math.floor(i / 2) * 190 + o;
        x.font = font(600, 84); x.fillStyle = '#ABFF84'; x.fillText(String(s.value), sx, sy + 60);
        x.font = font(500, 36); x.fillStyle = '#A5A493';
        x.fillText(wrapLines(x, s.label, col - 30, 1)[0] || '', sx, sy + 116);
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
  FF.storyPng = async function (spec) {
    const c = storyCanvas();
    await storyFonts();
    drawStory(c.getContext('2d'), spec, 1, 0);
    return new Promise((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error('canvas'))), 'image/png'));
  };

  /**
   * The story as a short vertical clip for TikTok and Reels, recorded from the canvas as it
   * builds up. MP4 where the browser records it (Chrome, Safari), WebM otherwise; null where
   * it cannot record at all, so the caller can fall back to the picture.
   */
  FF.storyVideo = async function (spec, seconds) {
    const c = storyCanvas();
    if (!window.MediaRecorder || !c.captureStream) return null;
    const type = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t));
    if (!type) return null;
    await storyFonts();
    const x = c.getContext('2d');
    drawStory(x, spec, 0, 0);
    const stream = c.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 6000000 });
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const stopped = new Promise((ok) => { rec.onstop = ok; });
    rec.start(250);
    const total = (seconds || 6) * 1000, t0 = performance.now();
    // Timers, not animation frames: a clip still finishes if the tab goes to the background.
    await new Promise((ok) => {
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
  FF.canShareFile = (file) => !!(navigator.canShare && navigator.canShare({ files: [file] }));
  FF.shareFile = async function (file, title) {
    if (FF.canShareFile(file)) {
      try { await navigator.share({ files: [file], title }); return 'shared'; } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file); a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return 'saved';
  };
  FF.shareStory = async function (spec, name) {
    const blob = await FF.storyPng(spec);
    return FF.shareFile(new File([blob], (name || 'feestfinder-story') + '.png', { type: 'image/png' }), spec.title);
  };
  /** Whether a link opens the Messenger or Zalo app: on a phone, yes. */
  FF.isPhone = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // ---- sign-in with Google, and with a linked Facebook / Instagram -------------------

  /**
   * Leave for the provider. The API takes the answer and sends the browser back to this
   * address with ?auth=<provider>&via=signin|signup|connect, or ?auth_error=<code>.
   * `next` is what the page was about to do, done once the browser is back.
   */
  FF.oauthStart = async function (provider, next) {
    const out = await FF.get('/auth/oauth/' + provider + '/start?redirectUri=' + encodeURIComponent(location.href.split('#')[0]));
    try { if (next) sessionStorage.setItem('ff_auth_next', next); else sessionStorage.removeItem('ff_auth_next'); } catch (e) { /* storage blocked */ }
    location.href = out.url;
  };

  /** What the provider's return left in the address: read once, then taken out of it. */
  function takeOAuthResult() {
    const u = new URL(location.href);
    const provider = u.searchParams.get('auth'), error = u.searchParams.get('auth_error');
    if (!provider && !error) return;
    let next = null;
    try { next = sessionStorage.getItem('ff_auth_next'); sessionStorage.removeItem('ff_auth_next'); } catch (e) { /* storage blocked */ }
    FF.data.oauth = error ? { error, next } : { provider, via: u.searchParams.get('via') || 'signin', next };
    ['auth', 'via', 'auth_error'].forEach((k) => u.searchParams.delete(k));
    history.replaceState(history.state, '', u.pathname + u.search + u.hash);
  }

  const OAUTH_ERRORS = {
    cancelled: { en: 'Sign-in cancelled', vi: 'Đã huỷ đăng nhập' },
    connection_taken: { en: 'That account is linked to another FeestFinder account', vi: 'Tài khoản này đã liên kết với một tài khoản FeestFinder khác' },
    provider_unavailable: { en: 'This sign-in is not available yet', vi: 'Cách đăng nhập này chưa mở' },
    email_taken: { en: 'That email already has an account', vi: 'Email này đã có tài khoản' },
  };
  FF.oauthErrorText = (code, lang) => {
    const t = OAUTH_ERRORS[code] || { en: 'Sign-in failed, try again', vi: 'Đăng nhập không thành công, thử lại' };
    return lang === 'vi' ? t.vi : t.en;
  };

  /** Which ways in work on this server: { google, fb, ig, zalo, wa, email, password }. */
  FF.authProviders = () => FF.maybe(FF.get('/auth/providers'), { google: true, fb: false, ig: false, zalo: false, wa: false, email: true, password: true });

  /**
   * A minimal sign-in card for a screen the designs ship without one (the admin console).
   * Resolves once the session satisfies `ok`; nothing is auto-signed-in.
   */
  FF.gate = function (opts) {
    const o = opts || {};
    const wrap = document.createElement('div');
    wrap.setAttribute('data-ff-gate', '');
    wrap.setAttribute('style', "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#0E100F;font-family:'Be Vietnam Pro', system-ui, sans-serif;padding:20px");
    // The auth-form card of the design system: a deep panel, labelled fields, the green-stroked action.
    wrap.innerHTML =
      '<div class="ff-atmos ff-atmos--local" aria-hidden="true"><div class="ff-aurora"></div><div class="ff-grain"></div></div>' +
      '<form class="ff-deep ff-in" style="position:relative;z-index:1;width:100%;max-width:380px;box-sizing:border-box;border-radius:16px;padding:32px 28px 24px">' +
      '<img src="/ui/assets/ff-logo.svg" alt="FeestFinder" style="height:22px;width:127px;display:block;margin:0 0 28px">' +
      '<div class="ff-eyebrow" style="margin-bottom:10px">' + (o.kicker || 'FeestFinder') + '</div>' +
      '<h1 class="ff-skywash" style="margin:0 0 8px;font-family:\'Be Vietnam Pro\',system-ui,sans-serif;font-size:28px;font-weight:600;line-height:1.1;letter-spacing:-.03em">' + (o.title || 'Sign in') + '</h1>' +
      '<p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#A5A493">' + (o.note || '') + '</p>' +
      '<label class="ff-label" for="ff-gate-id">Email</label>' +
      '<input id="ff-gate-id" class="ff-input" name="id" autocomplete="username" placeholder="' + (o.idPlaceholder || 'Email') + '" style="margin-bottom:14px">' +
      '<label class="ff-label" for="ff-gate-pw">Password</label>' +
      '<input id="ff-gate-pw" class="ff-input" name="pw" type="password" autocomplete="current-password" style="margin-bottom:20px">' +
      '<button type="submit" class="ff-cta" style="width:100%;padding:12px 24px;border:0;border-radius:999px;font:inherit;font-size:14px;font-weight:500;cursor:pointer">Sign in</button>' +
      '<div data-err role="alert" style="min-height:18px;margin-top:12px;font-size:12.5px;color:#FF8A7A;text-align:center"></div>' +
      '</form>';
    document.body.appendChild(wrap);
    const form = wrap.querySelector('form');
    const err = wrap.querySelector('[data-err]');
    return new Promise((resolve) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        err.textContent = '';
        try {
          await FF.post('/auth/login', { identifier: form.id.value.trim(), password: form.pw.value });
          await FF.refreshSession();
          if (o.ok && !o.ok(FF.session)) {
            err.textContent = o.wrongAccount || 'That account cannot open this screen.';
            return;
          }
          wrap.remove();
          resolve(FF.session);
        } catch (e2) {
          err.textContent = FF.errorText(e2, FF.lang);
        }
      });
    });
  };

  FF.refreshSession = async function () {
    const s = await FF.maybe(FF.get('/auth/session?optional=1'), null);
    FF.session = s && s.user ? s : null;
    return FF.session;
  };

  // ---- routing ---------------------------------------------------------------------
  //
  // Every screen, tab and panel has a URL. The shell for a surface answers all of its
  // routes, so moving between tabs is a URL change and a small fetch, never a reload.

  /** The path below the surface's base, e.g. '/app/e/ravo' → ['e', 'ravo']. */
  FF.parseRoute = function (base) {
    const path = location.pathname;
    const rest = base === '/' ? path.slice(1) : path.slice(base.length).replace(/^\//, '');
    const parts = rest.split('/').filter(Boolean).map(decodeURIComponent);
    return { base, path, parts, name: parts[0] || '', param: parts[1] || '', query: new URLSearchParams(location.search) };
  };

  /** Where a route points now — set by FF.mount and kept current by navigation. */
  function readRoute(base) {
    FF.route = FF.parseRoute(base);
    return FF.route;
  }

  /**
   * Point the URL at a screen without reloading. The page's own state has already
   * changed by the time this runs, so nothing re-renders; back and forward replay it.
   */
  FF.navigate = function (path, opts) {
    const o = opts || {};
    if (path === location.pathname + location.search) return;
    history[o.replace ? 'replaceState' : 'pushState']({ ff: true }, '', path);
    readRoute(FF.route ? FF.route.base : '/');
  };

  /** Build a path under the current surface: FF.href('e', 'ravo') → '/app/e/ravo'. */
  FF.href = function (...parts) {
    const base = FF.route ? FF.route.base : '/';
    const tail = parts.filter((p) => p !== null && p !== undefined && p !== '').map(encodeURIComponent).join('/');
    if (base === '/') return '/' + tail;
    return tail ? base + '/' + tail : base;
  };

  window.addEventListener('popstate', () => {
    const r = readRoute(FF.route ? FF.route.base : '/');
    if (FF.onRoute) FF.onRoute(r);
  });

  // ---- data loaded once, per route -------------------------------------------------

  const inflight = new Map();
  /**
   * Fetch something at most once per page life. Screens call this when a tab or panel
   * opens, so the first paint only waits for what it actually shows.
   */
  FF.once = function (key, loader) {
    if (!inflight.has(key)) inflight.set(key, Promise.resolve().then(loader));
    return inflight.get(key);
  };
  FF.forget = function (key) {
    if (key === undefined) inflight.clear();
    else inflight.delete(key);
  };

  /** Warm a route's data and chunks while the user reads the current screen. */
  FF.prefetch = function (loader) {
    const run = () => Promise.resolve().then(loader).catch(() => {});
    if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 2000 });
    else setTimeout(run, 400);
  };

  // ---- boot ------------------------------------------------------------------------

  const text = (url) => fetch(url, { credentials: 'same-origin' }).then((r) => {
    if (!r.ok) throw new Error(url + ' → ' + r.status);
    return r.text();
  });

  /**
   * Boot one surface: template, logic and route data travel in parallel, then the
   * runtime starts with everything already in place.
   */
  FF.mount = async function (opts) {
    const dir = '/pages/' + opts.surface + '/';
    takeOAuthResult();
    readRoute(opts.base);

    const template = text(vq(dir + 'template.html'));
    const logic = text(vq(dir + 'logic.js'));
    const data = FF.loadScript(vq(dir + 'data.js'));

    try {
      const [health] = await Promise.all([FF.get('/health'), FF.refreshSession(), data]);
      FF.clockOffset = new Date(health.time).getTime() - Date.now();
      if (FF.preload) await FF.preload(FF);
    } catch (e) {
      console.error('[ff] preload failed', e);
      FF.data.bootError = e;
    }

    try {
      const [tpl, js] = await Promise.all([template, logic]);
      // The runtime reads the template as text. Parsed into the page, its unfilled
      // {{ bindings }} would be fetched as images and rejected as SVG lengths.
      Object.defineProperty(document.querySelector('x-dc'), 'innerHTML', { configurable: true, get: () => tpl });
      document.querySelector('script[data-dc-script]').textContent = js;
    } catch (e) {
      console.error('[ff] could not load the screen', e);
      document.body.innerHTML = '<p style="color:#A5A493;font:15px system-ui;padding:24px">'
        + 'This screen could not load. Reload the page to try again.</p>';
      return;
    }
    await FF.loadScript(vq('/ui/support.js'));
  };

  // Glass that answers the pointer: cards with .ff-spot get --mx/--my where it is, and
  // the theme draws the light there. One delegated listener for the whole page.
  document.addEventListener('pointermove', (e) => {
    const el = e.target && e.target.closest ? e.target.closest('.ff-spot') : null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  // The shell says which surface it is with data attributes, so the page carries no
  // inline script and the Content-Security-Policy needs no exception for one.
  const boot = () => {
    const d = document.body.dataset;
    if (d.surface) FF.mount({ surface: d.surface, base: d.base || '/' });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
