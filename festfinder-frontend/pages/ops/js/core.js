/*
 * FeestFinder Ops — the plumbing every screen shares: React without a build step, the
 * two languages, the API, the router, the session and the option lists, and formatting.
 *
 * Screens are React function components written with `h` (React.createElement), so the
 * page needs no bundler and no 'unsafe-eval': the strict Content-Security-Policy holds.
 */

export const React = window.React;
export const { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect, Fragment } = React;
export const h = React.createElement;

// ---- a tiny event bus ---------------------------------------------------------------

const listeners = new Map();
export function on(name, fn) {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name).add(fn);
  return () => listeners.get(name).delete(fn);
}
export function emit(name, payload) {
  for (const fn of listeners.get(name) ?? []) fn(payload);
}
/** Re-render when any of the named events fires. */
export function useEvents(...names) {
  const [, bump] = useState(0);
  useEffect(() => {
    const offs = names.map((n) => on(n, () => bump((x) => x + 1)));
    return () => offs.forEach((off) => off());
  }, []);
}

// ---- languages: Vietnamese first, English one click away ---------------------------

const storage = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private window: nothing to keep */ } },
};
export { storage };

let lang = storage.get('ff_ops_lang') === 'en' ? 'en' : 'vi';
document.documentElement.lang = lang;
export const getLang = () => lang;
export function setLang(next) {
  lang = next;
  storage.set('ff_ops_lang', next);
  document.documentElement.lang = next;
  emit('lang');
}
/** Inline copy: t('Vietnamese', 'English'). */
export const t = (vi, en) => (lang === 'en' && en !== undefined ? en : vi);
/** A bilingual value from the API: {en, vi} → the current language. */
export const tx = (loc) => (loc == null ? '' : typeof loc === 'string' ? loc : loc[lang] || loc.vi || loc.en || '');

// ---- API --------------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message || code);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const state = { session: null, options: null, orgId: storage.get('ff_ops_org'), clockOffset: 0 };
export const store = state;

export async function api(method, path, body) {
  const headers = { 'x-lang': lang };
  if (state.orgId && path.startsWith('/organizer/')) headers['x-organizer-id'] = state.orgId;
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
    if (res.status === 401 && !path.startsWith('/auth/')) emit('unauthorized');
    throw new ApiError(res.status, err.code || 'http_' + res.status, typeof err.message === 'object' ? tx(err.message) : err.message, err.details);
  }
  return data;
}
export const get = (p) => api('GET', p);
export const post = (p, b) => api('POST', p, b === undefined ? {} : b);
export const put = (p, b) => api('PUT', p, b === undefined ? {} : b);
export const patch = (p, b) => api('PATCH', p, b === undefined ? {} : b);
export const del = (p) => api('DELETE', p);

/** Build a query string, leaving out empty values. Arrays are joined with commas. */
export function qs(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) continue;
    q.set(k, Array.isArray(v) ? v.join(',') : String(v));
  }
  const s = q.toString();
  return s ? '?' + s : '';
}

export const errorText = (e) => (e && e.message) || t('Đã có lỗi xảy ra', 'Something went wrong');

/**
 * Fetch data for a screen. `key` changes refetch; `setData` lets a screen patch the result
 * after a write without a round trip.
 */
export function useFetch(path, deps = []) {
  const [s, set] = useState({ data: null, error: null, loading: !!path });
  const seq = useRef(0);
  const load = useCallback(async (quiet) => {
    if (!path) return;
    const n = ++seq.current;
    if (!quiet) set((x) => ({ ...x, loading: true, error: null }));
    try {
      const data = await get(path);
      if (n === seq.current) set({ data, error: null, loading: false });
    } catch (error) {
      if (n === seq.current) set((x) => ({ data: x.data, error, loading: false }));
    }
  }, [path]);
  useEffect(() => { load(); }, [path, ...deps]);
  return { ...s, reload: load, setData: (fn) => set((x) => ({ ...x, data: typeof fn === 'function' ? fn(x.data) : fn })) };
}

// ---- session, organiser context and option lists -------------------------------------

export async function refreshSession() {
  try {
    state.session = await get('/auth/session');
  } catch {
    state.session = null;
  }
  const orgs = state.session?.organizers ?? [];
  if (!orgs.some((o) => o.id === state.orgId)) state.orgId = orgs[0]?.id ?? null;
  if (state.orgId) storage.set('ff_ops_org', state.orgId);
  emit('session');
  return state.session;
}
export const isAdmin = () => state.session?.user?.role === 'admin';
export const isOrganizer = () => (state.session?.organizers ?? []).length > 0;
export const currentOrg = () => (state.session?.organizers ?? []).find((o) => o.id === state.orgId) ?? null;
export function setOrg(id) {
  state.orgId = id;
  storage.set('ff_ops_org', id);
  emit('session');
}

export async function loadOptions() {
  if (!state.options) state.options = await get('/meta/form-options');
  return state.options;
}
export const options = () => state.options;

export async function syncClock() {
  try {
    const t0 = Date.now();
    const health = await get('/health');
    state.clockOffset = new Date(health.time).getTime() - Math.round((t0 + Date.now()) / 2);
  } catch { /* keep the device clock */ }
}
/** The server's now: the demo pins it with FF_NOW, so "today" and "overdue" follow the data. */
export const now = () => new Date(Date.now() + state.clockOffset);
/** YYYY-MM-DD in Ho Chi Minh City. */
export function vnDate(d = now()) {
  const v = new Date(d.getTime() + 7 * 3600000);
  return v.toISOString().slice(0, 10);
}
export function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ---- router: every screen, filter and panel has a URL ---------------------------------

const BASE = '/ops';
export function readRoute() {
  const rest = location.pathname.startsWith(BASE) ? location.pathname.slice(BASE.length) : '';
  const parts = rest.split('/').filter(Boolean).map(decodeURIComponent);
  return { path: location.pathname, parts, query: new URLSearchParams(location.search) };
}
const guards = new Set();
/** A screen with unsaved edits registers a guard; leaving asks first. */
export function useLeaveGuard(dirty, message) {
  useEffect(() => {
    if (!dirty) return;
    const fn = () => window.confirm(message || t('Bạn có thay đổi chưa lưu. Rời trang?', 'You have unsaved changes. Leave this page?'));
    const unload = (e) => { e.preventDefault(); e.returnValue = ''; };
    guards.add(fn);
    window.addEventListener('beforeunload', unload);
    return () => { guards.delete(fn); window.removeEventListener('beforeunload', unload); };
  }, [dirty, message]);
}
function allowedToLeave() {
  for (const g of guards) if (!g()) return false;
  guards.clear();
  return true;
}
export function href(...parts) {
  const tail = parts.filter((p) => p !== null && p !== undefined && p !== '').map((p) => encodeURIComponent(p)).join('/');
  return tail ? `${BASE}/${tail}` : BASE;
}
export function navigate(to, opts = {}) {
  if (to === location.pathname + location.search) return;
  const samePath = to.split('?')[0] === location.pathname;
  if (!samePath && !opts.force && !allowedToLeave()) return;
  history[opts.replace ? 'replaceState' : 'pushState']({ ops: true }, '', to);
  if (!samePath) window.scrollTo(0, 0);
  emit('route');
}
window.addEventListener('popstate', () => emit('route'));
export function useRoute() {
  useEvents('route');
  return readRoute();
}
/**
 * One filter kept in the URL query. Changing it replaces the history entry, so filtering
 * does not pile up back-button steps but a copied link reopens the same view.
 */
export function useQueryState(key, fallback = '') {
  const route = useRoute();
  const value = route.query.has(key) ? route.query.get(key) : fallback;
  const set = (next) => {
    const q = new URLSearchParams(location.search);
    if (next === fallback || next === '' || next === null || next === undefined) q.delete(key);
    else q.set(key, next);
    const s = q.toString();
    navigate(location.pathname + (s ? '?' + s : ''), { replace: true });
  };
  return [value, set];
}
/** Several filters at once, e.g. clearing them all. */
export function setQuery(patchObj) {
  const q = new URLSearchParams(location.search);
  for (const [k, v] of Object.entries(patchObj)) {
    if (v === undefined || v === null || v === '') q.delete(k);
    else q.set(k, v);
  }
  const s = q.toString();
  navigate(location.pathname + (s ? '?' + s : ''), { replace: true });
}

// ---- toasts ------------------------------------------------------------------------------

let toastId = 0;
export function toast(message, tone = 'ok') {
  if (!message) return;
  emit('toast', { id: ++toastId, message: typeof message === 'object' && !(message instanceof Error) ? tx(message) : String(message instanceof Error ? errorText(message) : message), tone });
}
export const toastError = (e) => toast(errorText(e), 'error');

/** Run a write, toast what the server said, and hand back the result (or null on failure). */
export async function act(promise, okText) {
  try {
    const out = await promise;
    toast(okText ?? (out && out.message ? tx(out.message) : t('Đã lưu', 'Saved')));
    return out ?? {};
  } catch (e) {
    toastError(e);
    return null;
  }
}

// ---- formatting --------------------------------------------------------------------------

const DOW = { vi: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function money(n) {
  if (n === null || n === undefined || n === '') return '—';
  return Number(n).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US') + ' ₫';
}
/** 1 200 000 → '1,2tr' / '1.2M'; 350 000 → '350k'. */
export function moneyShort(n) {
  const v = Number(n || 0);
  if (v >= 1e9) return (v / 1e9).toFixed(v >= 1e10 ? 0 : 1).replace('.', lang === 'vi' ? ',' : '.') + (lang === 'vi' ? ' tỷ' : 'B');
  if (v >= 1e6) return (Math.round(v / 1e5) / 10).toString().replace('.', lang === 'vi' ? ',' : '.') + (lang === 'vi' ? 'tr' : 'M');
  if (v >= 1e3) return Math.round(v / 1e3) + 'k';
  return String(v);
}
export const num = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US'));

/** '2026-09-19' → 'T7 19/09' or 'Sat 19 Sep'; with the year when it is not this year. */
export function day(iso, opts = {}) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const thisYear = Number(vnDate().slice(0, 4));
  const yr = opts.year || y !== thisYear ? (lang === 'vi' ? `/${y}` : ` ${y}`) : '';
  const base = lang === 'vi' ? `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}${yr}` : `${d} ${MON[m - 1]}${yr}`;
  return opts.dow === false ? base : `${DOW[lang][dow]} ${base}`;
}
/** A span of days: '19–20/09' or '19 Sep' when it is one day. */
export function dayRange(from, to) {
  if (!from) return '—';
  if (!to || to === from) return day(from);
  return `${day(from, { dow: false })} → ${day(to, { dow: false })}`;
}
/** An instant in Ho Chi Minh City time: '19/09 14:30'. */
export function stamp(ts, withYear) {
  if (!ts) return '—';
  const v = new Date(new Date(ts).getTime() + 7 * 3600000);
  const d = v.getUTCDate(), m = v.getUTCMonth() + 1, y = v.getUTCFullYear();
  const hm = `${String(v.getUTCHours()).padStart(2, '0')}:${String(v.getUTCMinutes()).padStart(2, '0')}`;
  const date = lang === 'vi' ? `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}` : `${d} ${MON[m - 1]}`;
  return `${date}${withYear ? (lang === 'vi' ? '/' : ' ') + y : ''} · ${hm}`;
}
/** Minutes → '3h 12m' / '45m' / '2d'. */
export function duration(min) {
  const m = Math.max(0, Math.round(min || 0));
  if (m < 60) return `${m}${lang === 'vi' ? ' phút' : 'm'}`;
  if (m < 48 * 60) return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
  return `${Math.round(m / 1440)} ${t('ngày', 'days')}`;
}
export function ago(ts) {
  if (!ts) return '—';
  const m = Math.round((now().getTime() - new Date(ts).getTime()) / 60000);
  if (m < 1) return t('vừa xong', 'just now');
  if (m < 60) return t(`${m} phút trước`, `${m}m ago`);
  if (m < 1440) return t(`${Math.round(m / 60)} giờ trước`, `${Math.round(m / 60)}h ago`);
  if (m < 60 * 24 * 45) return t(`${Math.round(m / 1440)} ngày trước`, `${Math.round(m / 1440)}d ago`);
  return day(new Date(new Date(ts).getTime() + 7 * 3600000).toISOString().slice(0, 10), { dow: false, year: true });
}
/** '2024-09-14T…' → '09/2024' or 'Sep 2024'. */
export function monthYear(ts) {
  if (!ts) return '—';
  const v = new Date(new Date(ts).getTime() + 7 * 3600000);
  return lang === 'vi' ? `${String(v.getUTCMonth() + 1).padStart(2, '0')}/${v.getUTCFullYear()}` : `${MON[v.getUTCMonth()]} ${v.getUTCFullYear()}`;
}
export const initials = (s) => String(s || '').trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('') || '·';
/** Diacritic-free lower case, so 'thu duc' finds 'Thủ Đức'. */
export const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
export const cx = (...xs) => xs.filter(Boolean).join(' ');
