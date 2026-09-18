/*
 * FestFinder client glue for the Claude Design screens.
 *
 * A page is a small shell that calls FF.mount(). We read the route, fetch the session,
 * the server clock and only the data that route needs, fill in the template and logic,
 * and then load the design runtime (support.js) — so a screen renders real data on its
 * first frame and every screen, tab and panel has a URL of its own.
 */
(function () {
  // Keep the raw template hidden and the ground dark while data loads.
  const style = document.createElement('style');
  style.textContent = 'x-dc{display:none!important}html,body{background:#06080D;margin:0}';
  document.head.appendChild(style);

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
    'linear-gradient(135deg,#4EA1FF,#1B6BD6)', 'linear-gradient(135deg,#FF8A3D,#FF6FA5)', 'linear-gradient(135deg,#2AC4E8,#1B6BD6)',
    'linear-gradient(135deg,#8C6BFF,#B9A8FF)', 'linear-gradient(135deg,#2E9E5B,#2AC4E8)', 'linear-gradient(135deg,#FFD35C,#FF8A3D)',
  ];
  FF.colorFor = function (key) {
    let h = 0;
    for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return GRADIENTS[h % GRADIENTS.length];
  };
  FF.initials = (n) => String(n || '').trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
  FF.text = (loc, lang) => (loc && typeof loc === 'object' ? loc[lang] || loc.en || '' : loc || '');
  FF.errorText = (e, lang) => (e && e.message) || (lang === 'vi' ? 'Đã có lỗi xảy ra' : 'Something went wrong');

  // ---- sign-in with Facebook / Instagram ------------------------------------------

  FF.oauthStart = async function (provider) {
    const redirectUri = location.origin + location.pathname;
    const out = await FF.get('/auth/oauth/' + provider + '/start?redirectUri=' + encodeURIComponent(redirectUri));
    sessionStorage.setItem('ff_oauth', provider);
    location.href = out.url;
  };

  async function finishOAuth() {
    const q = new URLSearchParams(location.search);
    const provider = sessionStorage.getItem('ff_oauth');
    if (!provider || !q.get('code') || !q.get('state')) return;
    sessionStorage.removeItem('ff_oauth');
    try {
      await FF.post('/auth/oauth/' + provider + '/callback', { code: q.get('code'), state: q.get('state') });
      FF.data.oauthJustConnected = provider;
    } catch (e) {
      console.warn('[ff] oauth', e);
    }
    history.replaceState(null, '', location.pathname);
  }

  /**
   * A minimal sign-in card for a screen the designs ship without one (the admin console).
   * Resolves once the session satisfies `ok`; nothing is auto-signed-in.
   */
  FF.gate = function (opts) {
    const o = opts || {};
    const wrap = document.createElement('div');
    wrap.setAttribute('style', 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:#06080D;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;padding:20px');
    wrap.innerHTML =
      '<form style="width:100%;max-width:360px;background:rgba(18,24,38,.9);border:1px solid #262F44;border-radius:18px;padding:26px">' +
      '<div style="font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#7FE0F5;margin-bottom:8px">' + (o.kicker || 'FestFinder') + '</div>' +
      '<div style="font-size:20px;font-weight:800;color:#F3F6FC;line-height:1.25;margin-bottom:6px">' + (o.title || 'Sign in') + '</div>' +
      '<div style="font-size:13px;color:#8891A8;line-height:1.5;margin-bottom:18px">' + (o.note || '') + '</div>' +
      '<input name="id" autocomplete="username" placeholder="' + (o.idPlaceholder || 'Email') + '" style="width:100%;box-sizing:border-box;margin-bottom:10px;padding:12px 14px;border-radius:12px;border:1px solid #262F44;background:rgba(10,14,26,.7);color:#F3F6FC;font-size:14px">' +
      '<input name="pw" type="password" autocomplete="current-password" placeholder="Password" style="width:100%;box-sizing:border-box;margin-bottom:14px;padding:12px 14px;border-radius:12px;border:1px solid #262F44;background:rgba(10,14,26,.7);color:#F3F6FC;font-size:14px">' +
      '<button type="submit" style="width:100%;padding:13px;border:0;border-radius:12px;background:#2AC4E8;color:#06080D;font-size:14px;font-weight:800;cursor:pointer">Sign in</button>' +
      '<div data-err style="min-height:18px;margin-top:10px;font-size:12px;color:#FF9A9A"></div>' +
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
    FF.session = await FF.maybe(FF.get('/auth/session'), null);
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
    readRoute(opts.base);

    const template = text(dir + 'template.html');
    const logic = text(dir + 'logic.js');
    const data = FF.loadScript(dir + 'data.js');

    try {
      await finishOAuth();
      const [health] = await Promise.all([FF.get('/health'), FF.refreshSession(), data]);
      FF.clockOffset = new Date(health.time).getTime() - Date.now();
      if (FF.preload) await FF.preload(FF);
    } catch (e) {
      console.error('[ff] preload failed', e);
      FF.data.bootError = e;
    }

    try {
      const [tpl, js] = await Promise.all([template, logic]);
      document.querySelector('x-dc').innerHTML = tpl;
      document.querySelector('script[data-dc-script]').textContent = js;
    } catch (e) {
      console.error('[ff] could not load the screen', e);
      document.body.innerHTML = '<p style="color:#8891A8;font:15px system-ui;padding:24px">'
        + 'This screen could not load. Reload the page to try again.</p>';
      return;
    }
    await FF.loadScript('/ui/support.js');
  };
})();
