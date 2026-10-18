/**
 * The newcomer's city, decided before the first paint (design v2 phase 11, owner 2026-10-18): the city
 * this device chose before, else the listed city of its time zone that has at least GUESS_MIN nights
 * coming (several cities share a zone: the one with the most), else every city. An address that says
 * what to show (a city, a filter, the map) is left as it is. The script only marks <html>; ListBrowser
 * reads the mark, asks for that city's nights and shows the list once they are in, so nothing on screen
 * moves (kd.css keeps the list's place hidden meanwhile, and shows it anyway after 2.5 s).
 */
import type { Meta } from './browser';

/** Other names browsers give the same zones. */
const ALIAS: Record<string, string[]> = { 'Asia/Ho_Chi_Minh': ['Asia/Saigon'], 'Asia/Makassar': ['Asia/Ujung_Pandang'] };
/** A guessed city needs this many nights coming, or the newcomer would open on a nearly empty page. */
export const GUESS_MIN = 3;
/** What an address can say, any of which keeps the page as the address asks. */
const ASKED = ['city', 'view', 'q', 'bbox', 'style', 'time', 'type', 'price', 'origin', 'genre'];
const SLUG = /^[a-z0-9-]+$/;

export function CityFirst({ meta, counts }: { meta: Meta; counts: Record<string, number> }) {
  const cities = meta.cities.filter((c) => SLUG.test(c.slug));
  const n = Object.fromEntries(cities.map((c) => [c.slug, counts[c.slug] ?? 0]));
  const zones: Record<string, string> = {};
  for (const c of cities) {
    for (const z of [c.timezone, ...(ALIAS[c.timezone] ?? [])]) {
      if (!zones[z] || n[c.slug] > n[zones[z]]) zones[z] = c.slug;
    }
  }
  // place.ts keeps the chosen city under ff_city ('all' when someone chose every city).
  const js = `(function(){try{var q=new URLSearchParams(location.search);if(${JSON.stringify(ASKED)}.some(function(k){return q.has(k)}))return;`
    + `var n=${JSON.stringify(n)},z=${JSON.stringify(zones)},c=null;try{c=localStorage.getItem('ff_city')}catch(e){}if(c==='all')return;`
    + `if(!c||!(c in n)){c=z[Intl.DateTimeFormat().resolvedOptions().timeZone];if(!c||n[c]<${GUESS_MIN})return}`
    + `document.documentElement.setAttribute('data-city-first',c)}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
