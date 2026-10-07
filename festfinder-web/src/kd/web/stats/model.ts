/**
 * /stats/<key>: the three explore stats GET /explore/stats answers (free entry, this weekend,
 * the venues with something on), the filters the address carries (the legacy screen's
 * "current filters": time, genre, search, and the city), and the addresses between them.
 */
import type { Lang, Pair } from '../../copy';
import type { Card } from '../../types';

export const STAT_KEYS = ['free', 'weekend', 'venues'] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export const isStatKey = (k: string): k is StatKey => (STAT_KEYS as readonly string[]).includes(k);

export const TIMES = ['tonight', 'weekend', '7days', 'month'] as const;
export type Time = (typeof TIMES)[number];

/** The genre families the API filters by (lib/i18n.ts GENRE_FAMILIES); free is a stat of its own here. */
const FAMILIES = ['fest', 'live', 'edm', 'cult'] as const;
export type StatFamily = (typeof FAMILIES)[number];

export interface StatFilters {
  time: Time;
  city: string | null;
  family: StatFamily | null;
  genre: string | null;
  q: string;
}

/** Where the legacy screen started: this weekend, everywhere, every genre. */
export const NO_FILTERS: StatFilters = { time: 'weekend', city: null, family: null, genre: null, q: '' };

/** What /meta/discovery gives the filters. */
export interface Discovery {
  cities: { slug: string; name: Pair }[];
  genres: string[];
}

/** One venue of the venues stat (GET /explore/stats?view=venues). */
export interface StatVenue {
  name: string;
  area: string | null;
  distanceKm: number | null;
  eventCount: number;
  /** In date order. */
  events: { id: string; slug: string; title: string; genre: string | null; startsOn: string | null; endsOn: string | null; startTime: string | null }[];
  firstEventId: string;
}

/** GET /explore/stats: the three counts, and the rows of the stat asked for. */
export interface StatAnswer {
  counts: Record<StatKey, number>;
  rows?: Card[];
  venues?: StatVenue[];
}

export type Search = Record<string, string | string[] | undefined>;

const one = (sp: Search, k: string) => {
  const v = sp[k];
  return (Array.isArray(v) ? v[0] : v) ?? '';
};

/** ?lang=en opens the English page; anything else is Vietnamese. */
export const langOf = (sp: Search): Lang => (one(sp, 'lang') === 'en' ? 'en' : 'vi');

/**
 * The address's filters, kept only when the API takes them: a city it lists, a family or a
 * genre it knows (not both), a search of at most 100 characters. The weekend stat is always
 * this weekend.
 */
export function readFilters(sp: Search, key: StatKey, d: Discovery): StatFilters {
  const time = one(sp, 'time') as Time;
  const city = one(sp, 'city');
  const family = one(sp, 'family') as StatFamily;
  const genre = one(sp, 'genre');
  const fam = FAMILIES.includes(family) ? family : null;
  return {
    time: key === 'weekend' ? 'weekend' : TIMES.includes(time) ? time : 'weekend',
    city: d.cities.some((c) => c.slug === city) ? city : null,
    family: fam,
    genre: !fam && d.genres.includes(genre) ? genre : null,
    q: one(sp, 'q').trim().slice(0, 100),
  };
}

/** Whether anything narrows the stat beyond where it starts. */
export const isFiltered = (f: StatFilters) => f.time !== 'weekend' || !!f.city || !!f.family || !!f.genre || !!f.q;

/** The API's question for one stat under the filters; with no stat, the three counts alone. */
export function apiPath(key: StatKey | null, f: StatFilters): string {
  const q = new URLSearchParams(key ? { view: key, time: f.time } : { time: f.time });
  if (f.city) q.set('city', f.city);
  if (f.family) q.set('family', f.family);
  if (f.genre) q.set('genre', f.genre);
  if (f.q) q.set('q', f.q);
  return '/explore/stats?' + q;
}

/** The page of a stat under the filters, in a language: the defaults are left out of the address. */
export function statHref(key: StatKey, f: StatFilters, lang: Lang): string {
  const q = new URLSearchParams();
  if (key !== 'weekend' && f.time !== 'weekend') q.set('time', f.time);
  if (f.city) q.set('city', f.city);
  if (f.family) q.set('family', f.family);
  if (f.genre) q.set('genre', f.genre);
  if (f.q) q.set('q', f.q);
  if (lang === 'en') q.set('lang', 'en');
  const s = q.toString();
  return '/stats/' + key + (s ? '?' + s : '');
}
