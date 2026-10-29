/**
 * Which cached home page answers a request for the home page (owner, 2026-10-29): the city this
 * device chose (the `ff_city` cookie, kd/app/place.ts), else the listed country Vercel's edge places
 * the visitor in (`x-vercel-ip-country`), else the home page of every city as it is. src/proxy.ts asks
 * `homeRewrite` on every page request and rewrites `/` to one city's page (app/(kd)/in/[city], the
 * page /?city=<slug> is) or to one country's (app/(kd)/from/[country]: every city, that country's
 * nights first), both cached like the home page, so the list is in its final order in the first HTML.
 *
 * An address that says what to show (a city, a filter, the map, the installed app's start) is left as
 * it is, and so is any request from a search engine or a link preview: they read the home page of
 * every city. Lighthouse and other headless browsers are not crawlers here: they get what a person
 * opening the page from the same place gets.
 *
 * Pure, with no imports, so the screen checks can test it as it is (e2e/next/newcomer.spec.ts).
 */

/** Every query key the home page's list reads besides the city and the language (kd/web/list/browser.tsx `readFilters`, list/from-app.ts). */
export const LIST_KEYS = ['view', 'q', 'bbox', 'style', 'time', 'type', 'price', 'origin', 'genre', 'source'] as const;

/** Where kd/app/place.ts keeps the chosen city for the server ('all' when someone chose every city). */
export const CITY_COOKIE = 'ff_city';
/** The visitor's country as Vercel's edge reads it from their address (ISO 3166-1 alpha-2). */
export const COUNTRY_HEADER = 'x-vercel-ip-country';

/** Search engines and link previews (kd/lang-pref.ts BOT, without Lighthouse, PageSpeed and headless browsers). */
const CRAWLER = /bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|facebot|embedly|preview|zalo|whatsapp|telegram|discord|slack|skype|vkshare|pinterest|quora|inspectiontool/i;
export const isCrawler = (ua: string | null | undefined) => !ua || CRAWLER.test(ua);

const SLUG = /^[a-z0-9-]+$/;
const OTHER_LANGS = ['en', 'th', 'ja', 'id'];

/** The city a cookie header names, if it names one. */
export function cookieCity(header: string | null | undefined): string | null {
  const v = (header ?? '').match(/(?:^|;\s*)ff_city=([a-z0-9-]{1,40})(?:;|$)/)?.[1];
  return v ?? null;
}

/**
 * The page that draws a home page request, or null to serve the address as it is. `listed`: the slugs
 * of the cities the site lists and the codes of their countries (/meta/discovery).
 */
export function homeRewrite(o: {
  path: string; search: string; cookie: string | null; country: string | null; ua: string | null;
  listed: { cities: readonly string[]; countries: readonly string[] };
}): string | null {
  if (o.path !== '/' || isCrawler(o.ua)) return null;
  const q = new URLSearchParams(o.search);
  if (q.has('city') || LIST_KEYS.some((k) => q.has(k))) return null;
  const lang = q.get('lang');
  // Vietnamese is the address without a language (next.config.ts rewrites the others to pages of their own).
  if (lang !== null && lang !== 'vi' && !OTHER_LANGS.includes(lang)) return null;
  const suffix = lang && lang !== 'vi' ? `/${lang}` : '';
  const city = o.cookie;
  if (city && SLUG.test(city) && o.listed.cities.includes(city)) return `/in/${city}${suffix}`;
  const code = (o.country ?? '').trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(code) && o.listed.countries.includes(code)) return `/from/${code.toLowerCase()}${suffix}`;
  return null;
}
