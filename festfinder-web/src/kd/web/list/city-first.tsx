/**
 * The home page in the order this visitor reads it, decided before the first paint. The server
 * decides most of it (owner, 2026-10-29: kd/home-place.ts): the city this device chose (the `ff_city`
 * cookie) or the listed country Vercel places the visitor in is a cached page of its own, drawn in
 * its final order. What is left is this device's storage: a city chosen before the cookie existed,
 * or one the cookie lost, still comes first, and its cookie is written so the next visit is drawn on
 * the server. An address that says what to show (a city, a filter, the map) is left as it is.
 *
 * The script only marks <html>: `data-city-first` (a chosen city the server did not draw:
 * ListBrowser asks for its nights) and, for an address with a filter other than the city (not the
 * map), `data-list-wait` (the server drew every night: ListBrowser asks for the filter's) and
 * `data-asked` (the highlight, which shows only while nothing but the city narrows the list, is never
 * painted). kd.css keeps the list's place hidden until the browser has drawn it, 2.5 s at most, so
 * nothing on screen moves.
 */
import type { Meta } from './browser';

/** What an address can say, any of which keeps the page as the address asks. */
const ASKED = ['city', 'view', 'q', 'bbox', 'style', 'time', 'type', 'price', 'origin', 'genre'];
const SLUG = /^[a-z0-9-]+$/;
/** The filters that hide the highlight, as ListBrowser reads them (browser.tsx `readFilters`): null takes any value. */
const FILTERS = { q: null, style: null, type: null, time: ['tonight', 'weekend', '7days', 'month'], price: ['free'], origin: ['radar', 'posted'] };

/** `drawn`: the city whose nights the server drew for this address (a rewrite by the `ff_city` cookie). */
export function CityFirst({ meta, drawn }: { meta: Meta; drawn?: string }) {
  const cities = meta.cities.filter((c) => SLUG.test(c.slug)).map((c) => c.slug);
  const filters = { ...FILTERS, genre: meta.genres };
  // place.ts keeps the chosen city under ff_city, in the storage and as a cookie ('all' when someone chose every city).
  const js = `(function(){try{var q=new URLSearchParams(location.search),f=${JSON.stringify(filters)},h=document.documentElement;`
    + `if(q.get('view')!=='map'&&Object.keys(f).some(function(k){var v=q.get(k);return !!v&&(!f[k]||f[k].indexOf(v)>=0)})){h.setAttribute('data-list-wait','');h.setAttribute('data-asked','')}`
    + `if(${JSON.stringify(ASKED)}.some(function(k){return q.has(k)}))return;`
    + `var c=null;try{c=localStorage.getItem('ff_city')}catch(e){}`
    + `if(!c||(c!=='all'&&${JSON.stringify(cities)}.indexOf(c)<0))return;`
    + `if((document.cookie.match(/(?:^|;\\s*)ff_city=([a-z0-9-]+)/)||[])[1]!==c)document.cookie='ff_city='+c+'; path=/; max-age=${400 * 86400}; samesite=lax'+(location.protocol==='https:'?'; secure':'');`
    + `if(c!=='all'&&c!==${JSON.stringify(drawn ?? null)})h.setAttribute('data-city-first',c)}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
