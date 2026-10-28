/**
 * The newcomer's place, decided before the first paint (design v2 phase 11, owner 2026-10-18; by
 * country since phase 13, owner 2026-10-19): the city this device chose before, else the listed
 * country of its time zone (or of its language: vi, th, ja, id), whose nights the list then puts
 * first under the country's name, the rest under "Nơi khác". An address that says what to show (a
 * city, a filter, the map) is left as it is. The script only marks <html>: `data-city-first` (a
 * chosen city: ListBrowser asks for its nights) or `data-place-first` (a country: ListBrowser groups
 * what it has); an address with a filter other than the city (not the map) `data-list-wait` (the
 * server drew every night: ListBrowser asks for the filter's) and `data-asked` (the highlight, which
 * shows only while nothing but the city narrows the list, is never painted). kd.css keeps the list's
 * place hidden until the browser has drawn it, 2.5 s at most, so nothing on screen moves: a country
 * is marked only when the server drew its nights and another country's, so grouping changes the
 * list; otherwise the list the server drew is the one shown, at once.
 */
import type { Meta } from './browser';

/** Other names browsers give the same zones. */
const ALIAS: Record<string, string[]> = { 'Asia/Ho_Chi_Minh': ['Asia/Saigon'], 'Asia/Makassar': ['Asia/Ujung_Pandang'], 'Asia/Jakarta': ['Asia/Pontianak'] };
/** A device's language, when its zone is not one of ours (someone from Vietnam abroad). */
const LANG_COUNTRY: Record<string, string> = { vi: 'VN', th: 'TH', ja: 'JP', id: 'ID' };
/** What an address can say, any of which keeps the page as the address asks. */
const ASKED = ['city', 'view', 'q', 'bbox', 'style', 'time', 'type', 'price', 'origin', 'genre'];
const SLUG = /^[a-z0-9-]+$/;
/** The filters that hide the highlight, as ListBrowser reads them (browser.tsx `readFilters`): null takes any value. */
const FILTERS = { q: null, style: null, type: null, time: ['tonight', 'weekend', '7days', 'month'], price: ['free'], origin: ['radar', 'posted'] };

/** `listed`: the countries of the nights the server drew; the list is grouped (and held back) only when they are its country and another. */
export function CityFirst({ meta, listed }: { meta: Meta; listed: string[] }) {
  const cities = meta.cities.filter((c) => SLUG.test(c.slug));
  const codes = new Set(meta.countries.map((c) => c.code));
  // Every zone a listed city or country keeps, to its country.
  const zones: Record<string, string> = {};
  for (const c of cities) for (const z of [c.timezone, ...(ALIAS[c.timezone] ?? [])]) zones[z] = c.country;
  for (const c of meta.countries) for (const z of [c.timezone, ...(ALIAS[c.timezone] ?? [])]) zones[z] ??= c.code;
  const langs = Object.fromEntries(Object.entries(LANG_COUNTRY).filter(([, code]) => codes.has(code)));
  const filters = { ...FILTERS, genre: meta.genres };
  // place.ts keeps the chosen city under ff_city ('all' when someone chose every city: the grouped list).
  const js = `(function(){try{var q=new URLSearchParams(location.search),f=${JSON.stringify(filters)},h=document.documentElement;`
    + `if(q.get('view')!=='map'&&Object.keys(f).some(function(k){var v=q.get(k);return !!v&&(!f[k]||f[k].indexOf(v)>=0)})){h.setAttribute('data-list-wait','');h.setAttribute('data-asked','')}`
    + `if(${JSON.stringify(ASKED)}.some(function(k){return q.has(k)}))return;`
    + `var cities=${JSON.stringify(cities.map((c) => c.slug))},z=${JSON.stringify(zones)},l=${JSON.stringify(langs)},c=null;try{c=localStorage.getItem('ff_city')}catch(e){}`
    + `if(c&&cities.indexOf(c)>=0){h.setAttribute('data-city-first',c);return}`
    + `var k=z[Intl.DateTimeFormat().resolvedOptions().timeZone]||l[String(navigator.language||'').slice(0,2).toLowerCase()];`
    + `if(k&&${JSON.stringify(listed)}.length>1&&${JSON.stringify(listed)}.indexOf(k)>=0)h.setAttribute('data-place-first',k)}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
