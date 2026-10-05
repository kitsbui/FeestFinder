import { z } from 'zod';
import type { Queryable } from '../db/index.ts';
import { L, type Localized } from './i18n.ts';

/*
 * Countries and cities. The built-in list below is written to the `countries` and `cities`
 * tables after every migration (syncPlaces), and the API reads the tables once at start
 * (loadPlaces). A city is listed on the site when it is `launched`; the others are known so
 * that imported events and venues can already point at them.
 *
 * None of these timezones has daylight saving, but every conversion goes through the IANA
 * name, so one that does would still be right.
 */

export interface Country { code: string; name: Localized; currency: string; timezone: string; sort: number }

export interface City {
  slug: string;
  countryCode: string;
  name: Localized;
  timezone: string;
  currency: string;
  lat: number;
  lng: number;
  /** minLng, minLat, maxLng, maxLat */
  bbox: [number, number, number, number];
  /** Accent-free, lower-case words that name the city in an address. */
  aliases: string[];
  launched: boolean;
  sort: number;
}

const C = (code: string, en: string, vi: string, currency: string, timezone: string, sort: number): Country =>
  ({ code, name: L(en, vi), currency, timezone, sort });

export const BUILTIN_COUNTRIES: Country[] = [
  C('VN', 'Vietnam', 'Việt Nam', 'VND', 'Asia/Ho_Chi_Minh', 10),
  C('TH', 'Thailand', 'Thái Lan', 'THB', 'Asia/Bangkok', 20),
  C('SG', 'Singapore', 'Singapore', 'SGD', 'Asia/Singapore', 30),
  C('ID', 'Indonesia', 'Indonesia', 'IDR', 'Asia/Jakarta', 40),
  C('JP', 'Japan', 'Nhật Bản', 'JPY', 'Asia/Tokyo', 50),
  C('KR', 'South Korea', 'Hàn Quốc', 'KRW', 'Asia/Seoul', 60),
  C('TW', 'Taiwan', 'Đài Loan', 'TWD', 'Asia/Taipei', 70),
  C('HK', 'Hong Kong', 'Hồng Kông', 'HKD', 'Asia/Hong_Kong', 80),
  C('MY', 'Malaysia', 'Malaysia', 'MYR', 'Asia/Kuala_Lumpur', 90),
  C('PH', 'Philippines', 'Philippines', 'PHP', 'Asia/Manila', 100),
];

type CitySeed = [slug: string, country: string, en: string, vi: string, lat: number, lng: number, bbox: City['bbox'], aliases: string[], launched: boolean, timezone?: string];

// The 2025-07-01 reform: HCM now includes Bình Dương and Vũng Tàu, Đà Nẵng includes Quảng Nam,
// Khánh Hòa absorbed Ninh Thuận. The bounds and aliases follow the new provinces.
const CITY_SEEDS: CitySeed[] = [
  ['ho-chi-minh', 'VN', 'Ho Chi Minh City', 'TP.HCM', 10.7769, 106.7009, [106.33, 10.3, 107.6, 11.52],
    ['ho chi minh', 'hcm', 'hcmc', 'tp hcm', 'tphcm', 'sai gon', 'saigon', 'thu duc', 'binh duong', 'thu dau mot', 'di an', 'vung tau', 'ba ria'], true],
  ['ha-noi', 'VN', 'Hanoi', 'Hà Nội', 21.0285, 105.8542, [105.28, 20.56, 106.02, 21.39], ['ha noi', 'hanoi'], true],
  ['da-nang', 'VN', 'Da Nang', 'Đà Nẵng', 16.0544, 108.2022, [107.2, 14.9, 108.75, 16.35], ['da nang', 'danang', 'hoi an', 'quang nam', 'tam ky'], true],
  ['nha-trang', 'VN', 'Nha Trang', 'Nha Trang', 12.2388, 109.1967, [108.55, 11.25, 109.48, 12.88], ['nha trang', 'khanh hoa', 'cam ranh', 'phan rang', 'ninh thuan'], true],
  // Districts people write instead of the city, where the name belongs to that city alone.
  ['bangkok', 'TH', 'Bangkok', 'Bangkok', 13.7563, 100.5018, [100.3, 13.45, 100.95, 14.1],
    ['bangkok', 'krung thep', 'bkk', 'กรุงเทพ', 'pathumwan', 'pathum wan', 'sukhumvit', 'silom', 'sathorn', 'sathon', 'thonglor', 'thong lo', 'ekkamai', 'watthana', 'khlong toei', 'bang rak', 'chatuchak', 'ratchathewi', 'huai khwang', 'phra nakhon'], true],
  ['tokyo', 'JP', 'Tokyo', 'Tokyo', 35.6762, 139.6503, [139.45, 35.45, 139.95, 35.85],
    ['tokyo', '東京', 'shibuya', 'shinjuku', 'roppongi', 'minato ku', 'shinagawa', 'setagaya', 'ebisu', 'harajuku', 'ikebukuro', 'meguro', 'koto ku', '渋谷', '新宿'], true],
  ['singapore', 'SG', 'Singapore', 'Singapore', 1.3521, 103.8198, [103.6, 1.2, 104.05, 1.48], ['singapore', '新加坡'], true],
  ['bali', 'ID', 'Bali', 'Bali', -8.4095, 115.1889, [114.43, -8.85, 115.71, -8.06],
    ['bali', 'denpasar', 'canggu', 'seminyak', 'kuta', 'ubud', 'uluwatu', 'badung', 'gianyar'], true, 'Asia/Makassar'],
  ['phuket', 'TH', 'Phuket', 'Phuket', 7.8804, 98.3923, [98.25, 7.75, 98.48, 8.2], ['phuket'], false],
  ['jakarta', 'ID', 'Jakarta', 'Jakarta', -6.2088, 106.8456, [106.65, -6.4, 107.0, -6.08], ['jakarta'], false],
  ['osaka', 'JP', 'Osaka', 'Osaka', 34.6937, 135.5023, [135.35, 34.55, 135.65, 34.8], ['osaka', '大阪'], false],
  ['seoul', 'KR', 'Seoul', 'Seoul', 37.5665, 126.978, [126.76, 37.42, 127.19, 37.7], ['seoul', '서울'], false],
  ['taipei', 'TW', 'Taipei', 'Đài Bắc', 25.033, 121.5654, [121.45, 24.95, 121.67, 25.21], ['taipei', '台北', '臺北'], false],
  ['hong-kong', 'HK', 'Hong Kong', 'Hồng Kông', 22.3193, 114.1694, [113.83, 22.15, 114.44, 22.57], ['hong kong', '香港'], false],
  ['kuala-lumpur', 'MY', 'Kuala Lumpur', 'Kuala Lumpur', 3.139, 101.6869, [101.58, 3.03, 101.77, 3.25], ['kuala lumpur'], false],
  ['manila', 'PH', 'Manila', 'Manila', 14.5995, 120.9842, [120.9, 14.35, 121.15, 14.78], ['manila', 'makati', 'taguig', 'bgc'], false],
];

export const BUILTIN_CITIES: City[] = CITY_SEEDS.map(([slug, countryCode, en, vi, lat, lng, bbox, aliases, launched, timezone], i) => {
  const country = BUILTIN_COUNTRIES.find((c) => c.code === countryCode)!;
  return { slug, countryCode, name: L(en, vi), timezone: timezone ?? country.timezone, currency: country.currency, lat, lng, bbox, aliases, launched, sort: (i + 1) * 10 };
});

export const DEFAULT_CITY = 'ho-chi-minh';

// ---- the registry the API reads -----------------------------------------------------------

let countries = new Map(BUILTIN_COUNTRIES.map((c) => [c.code, c]));
let cities = new Map(BUILTIN_CITIES.map((c) => [c.slug, c]));

/** Writes the built-in list to the tables. Rows added to the tables by hand are left alone. */
export async function syncPlaces(q: Queryable): Promise<void> {
  for (const c of BUILTIN_COUNTRIES) {
    await q.query(
      `insert into countries (code, name, currency, timezone, sort) values ($1,$2,$3,$4,$5)
       on conflict (code) do update set name = excluded.name, currency = excluded.currency, timezone = excluded.timezone, sort = excluded.sort`,
      [c.code, JSON.stringify(c.name), c.currency, c.timezone, c.sort]);
  }
  for (const c of BUILTIN_CITIES) {
    await q.query(
      `insert into cities (slug, country_code, name, timezone, currency, lat, lng, bbox, aliases, launched, sort)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict (slug) do update set country_code = excluded.country_code, name = excluded.name, timezone = excluded.timezone,
         currency = excluded.currency, lat = excluded.lat, lng = excluded.lng, bbox = excluded.bbox, aliases = excluded.aliases,
         launched = excluded.launched, sort = excluded.sort`,
      [c.slug, c.countryCode, JSON.stringify(c.name), c.timezone, c.currency, c.lat, c.lng, c.bbox, c.aliases, c.launched, c.sort]);
  }
}

/** Reads the tables into memory. Called once when the API starts. */
export async function loadPlaces(q: Queryable): Promise<void> {
  const [cs, ys] = await Promise.all([
    q.query<any>('select * from countries order by sort, code'),
    q.query<any>('select * from cities order by sort, slug'),
  ]);
  countries = new Map(cs.rows.map((r) => [r.code, { code: r.code, name: r.name, currency: r.currency, timezone: r.timezone, sort: r.sort }]));
  cities = new Map(ys.rows.map((r) => [r.slug, {
    slug: r.slug, countryCode: r.country_code, name: r.name, timezone: r.timezone, currency: r.currency,
    lat: r.lat, lng: r.lng, bbox: r.bbox.map(Number) as City['bbox'], aliases: r.aliases, launched: r.launched, sort: r.sort,
  }]));
}

export const cityBySlug = (slug: string | null | undefined): City | null => (slug ? cities.get(slug) ?? null : null);
export const countryByCode = (code: string | null | undefined): Country | null => (code ? countries.get(code.toUpperCase()) ?? null : null);
export const isCity = (slug: string) => cities.has(slug);
export const isLaunched = (slug: string) => !!cities.get(slug)?.launched;
export const allCities = (): City[] => [...cities.values()];
export const launchedCities = (): City[] => [...cities.values()].filter((c) => c.launched);
export const allCountries = (): Country[] => [...countries.values()];

/** The event's city, or the default one for rows written before cities were checked. */
export const cityOf = (slug: string | null | undefined): City => cityBySlug(slug) ?? cities.get(DEFAULT_CITY)!;
export const cityLabel = (slug: string | null | undefined): Localized | null => cityBySlug(slug)?.name ?? null;
export const timezoneOf = (slug: string | null | undefined): string => cityOf(slug).timezone;

/** A city slug the API knows. */
export const citySlug = z.string().max(40).refine(isCity, { message: 'unknown city' });
/** A city the site lists. */
export const launchedCity = z.string().max(40).refine(isLaunched, { message: 'city not listed' });
export const countryCode = z.string().length(2).transform((s) => s.toUpperCase()).refine((s) => countries.has(s), { message: 'unknown country' });

// ---- finding a city from what a source says ------------------------------------------------

/** Lower case, no accents, đ → d, punctuation to spaces. */
export function plainText(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

/** The city an address names, by whole-word alias. */
export function cityFromText(text: string | null | undefined, opts: { launchedOnly?: boolean } = {}): string | null {
  if (!text) return null;
  const t = ` ${plainText(text)} `;
  for (const c of cities.values()) {
    if (opts.launchedOnly && !c.launched) continue;
    // Scripts without spaces (東京, กรุงเทพ) match anywhere; Latin aliases match whole words.
    if (c.aliases.some((a) => (/^[a-z0-9 ]+$/.test(a) ? t.includes(` ${a} `) : t.includes(a)))) return c.slug;
  }
  return null;
}

/** A country's code from how a source writes it: "TH", "Thailand", "Việt Nam". */
export function countryCodeOf(text: string | null | undefined): string | null {
  if (!text) return null;
  const t = plainText(text);
  if (/^[a-z]{2}$/.test(t)) return t.toUpperCase();
  for (const c of countries.values()) if (plainText(c.name.en) === t || plainText(c.name.vi) === t) return c.code;
  return 'other';
}

/** The city whose bounds hold a point. */
export function cityAt(lat: number | null | undefined, lng: number | null | undefined): string | null {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  for (const c of cities.values()) {
    const [minLng, minLat, maxLng, maxLat] = c.bbox;
    if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) return c.slug;
  }
  return null;
}

/** What the screens need: launched cities grouped by country, in order. */
export function placesForClient() {
  const listed = launchedCities();
  const codes = [...new Set(listed.map((c) => c.countryCode))];
  return {
    defaultCity: DEFAULT_CITY,
    countries: allCountries().filter((c) => codes.includes(c.code)).map((c) => ({ code: c.code, name: c.name, currency: c.currency })),
    cities: listed.map((c) => ({
      slug: c.slug, country: c.countryCode, name: c.name, timezone: c.timezone, currency: c.currency,
      center: [c.lng, c.lat] as [number, number], bbox: c.bbox,
    })),
  };
}
