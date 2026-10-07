/**
 * The artist directory's data and its filters, shared by the server page and the browser.
 * The address carries the filters: one style alone is /a/style/<style>, one city alone
 * /a/city/<city> (the pages search engines see), anything more is /a with a query.
 */
import { fill, pick, type Lang, type Pair } from '../../copy';
import { DIR } from './copy';

type Keyed = { key: string; label: Pair };

/** One artist as GET /artists lists them (festfinder-backend/src/services/artists.ts, searchArtists). */
export interface DirArtist {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  roles: Keyed[];
  basedIn: { city: string; label: Pair | null } | null;
  styles: (Keyed & { genre: string | null })[];
  verified: boolean;
  claimed: boolean;
  booking: Keyed | null;
  upcoming: number;
  events: number;
  /** The genre of most of their listed shows: it colours the card when no style says. */
  genre: string | null;
  nextShow: { slug: string; title: string; startsOn: string; city: string | null; cityLabel: Pair | null } | null;
}

export interface DirPage {
  items: DirArtist[];
  total: number;
  nextOffset: number | null;
  filters?: { roles: Keyed[] };
}

/** What /meta/discovery gives the filters: the listed cities and the music styles. */
export interface DirMeta {
  cities: { slug: string; name: Pair }[];
  styles: (Keyed & { genre: string | null })[];
}

export interface Filters {
  q: string;
  role: string;
  style: string;
  city: string;
  /** Taking bookings: available or limited dates. */
  booking: boolean;
  /** With a show still to come. */
  soon: boolean;
}

export type Scope = { style?: string; city?: string };

export const NO_FILTERS: Filters = { q: '', role: '', style: '', city: '', booking: false, soon: false };

export const PAGE = 24;

export const scopeKey = (s: Scope) => (s.style ? `style:${s.style}` : s.city ? `city:${s.city}` : 'all');

export const fromScope = (s: Scope): Filters => ({ ...NO_FILTERS, style: s.style ?? '', city: s.city ?? '' });

export const sameFilters = (a: Filters, b: Filters) =>
  a.q === b.q && a.role === b.role && a.style === b.style && a.city === b.city && a.booking === b.booking && a.soon === b.soon;

export const isFiltered = (f: Filters) => !sameFilters(f, NO_FILTERS);

/** The API's query for one page of the list. */
export function apiQuery(f: Filters, offset = 0, limit = PAGE): string {
  const q = new URLSearchParams({ limit: String(limit) });
  if (offset) q.set('offset', String(offset));
  if (f.q) q.set('q', f.q);
  if (f.role) q.set('role', f.role);
  if (f.style) q.set('style', f.style);
  if (f.city) q.set('city', f.city);
  if (f.booking) q.set('booking', 'available,limited');
  if (f.soon) q.set('upcoming', '1');
  return q.toString();
}

/** The directory page's own path for these filters: a style or a city alone has one. */
export function pathOf(f: Filters): string {
  const only = !f.q && !f.role && !f.booking && !f.soon;
  if (only && f.style && !f.city) return '/a/style/' + encodeURIComponent(f.style);
  if (only && f.city && !f.style) return '/a/city/' + encodeURIComponent(f.city);
  return '/a';
}

/** The address for these filters, in this language. */
export function addressOf(f: Filters, lang: Lang): string {
  const path = pathOf(f);
  const q = new URLSearchParams();
  if (path === '/a') {
    if (f.q) q.set('q', f.q);
    if (f.role) q.set('role', f.role);
    if (f.style) q.set('style', f.style);
    if (f.city) q.set('city', f.city);
    if (f.booking) q.set('booking', '1');
    if (f.soon) q.set('upcoming', '1');
  }
  if (lang === 'en') q.set('lang', 'en');
  const s = q.toString();
  return path + (s ? '?' + s : '');
}

/** A page's query as Next hands it to the server, as the address would write it. */
export function queryOf(search: Record<string, string | string[] | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(search)) if (typeof v === 'string') q.set(k, v);
  return q.toString();
}

/** The filters an address names; anything the lists do not know is left out. */
export function readAddress(pathname: string, search: string, known: { roles: Keyed[]; meta: DirMeta }): Filters {
  const f: Filters = { ...NO_FILTERS };
  const at = pathname.replace(/\/+$/, '').split('/');
  // ['', 'a', 'style' | 'city', '<slug>']
  if (at[1] === 'a' && at[2] === 'style' && at[3]) f.style = decodeURIComponent(at[3]);
  if (at[1] === 'a' && at[2] === 'city' && at[3]) f.city = decodeURIComponent(at[3]);
  const q = new URLSearchParams(search);
  f.q = (q.get('q') ?? '').trim().slice(0, 80);
  const role = q.get('role');
  if (role && known.roles.some((r) => r.key === role)) f.role = role;
  const style = q.get('style');
  if (style && known.meta.styles.some((s) => s.key === style)) f.style = style;
  const city = q.get('city');
  if (city && known.meta.cities.some((c) => c.slug === city)) f.city = city;
  f.booking = q.get('booking') === '1';
  f.soon = q.get('upcoming') === '1';
  return f;
}

const text = (v: Pair | null | undefined, lang: Lang) => (v ? v[lang] || v.vi || v.en || '' : '');

/** The heading for these filters, worded as the API words its pages. */
export function titleOf(f: Filters, lang: Lang, meta: DirMeta): string {
  const T = pick(DIR, lang);
  const s = f.style ? text(meta.styles.find((x) => x.key === f.style)?.label, lang) || f.style : '';
  const c = f.city ? text(meta.cities.find((x) => x.slug === f.city)?.name, lang) || f.city : '';
  if (s && c) return fill(T.titleBoth, { s, c });
  if (s) return fill(T.titleStyle, { s });
  if (c) return fill(T.titleCity, { c });
  return T.titleAll;
}
