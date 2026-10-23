'use client';
/**
 * The home page's list (Sự kiện in the nav): every upcoming event by day (the grid, the default
 * since design v2 phase 2: days.tsx), as a table (the advanced view) or on a map, by city, time,
 * kind of night and music style, price, source and text (the nav's search). The views share one
 * title, one view switch and one sticky row of filters (on a phone, design v2 phase 12: four times in
 * the bar, the city and the styles with nights here above the list, the rest on a computer), so a choice
 * made in one view is there, and visible, in the others. The address carries the choices with
 * the legacy names (city, genre, time, style, type, view, bbox, q) so old links and the
 * /vi/… and /en/… redirects keep landing on the right list. The list re-reads itself every
 * minute while it is open.
 */
import { startTransition, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { ArrowDownIcon, ArrowUpIcon, XIcon } from '@phosphor-icons/react/ssr';
import dynamic from 'next/dynamic';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair, tx } from '../../copy';
import { cx } from '../../cx';
import { moneyShort, todayIn, whenShort, count as fmtCount } from '../../format';
import { FAMILY_LABEL, familyOf, type Family } from '../../genre';
import { KdLink as Link, inLang } from '../../link';
import { useKd } from '../../runtime';
import { Button, Chip, IconButton } from '../../ui/actions';
import { Segmented } from '../../ui/forms';
import { Menu, MenuItem, MenuSeparator, Picker } from '../../ui/menu';
import { Card as Panel, Marker, Status, type StatusTone } from '../../ui/parts';
import type { Card } from '../../types';
import { ORIGIN, RadarTag, type Origin } from '../../ui/origin';
import { DayGrid, groupByDay } from './days';
import { fromApp } from './from-app';
import { place } from '../../app/place';
import { LIST } from './copy';
import type { Box } from '../../map/kd-map';
import { shrinkable } from '../../ui/shrinkable';

/** The installed app's first run is a sheet few ever see: it loads when it opens (first-run.tsx). */
const FirstRun = dynamic(() => import('./first-run').then((m) => m.FirstRun), { ssr: false });

/** The map view loads when it opens (or when someone points at "Bản đồ"): its box holds the screen meanwhile. */
const MapView = dynamic(() => import('./map-view').then((m) => m.MapView), {
  ssr: false,
  loading: () => <main className="min-h-[calc(100dvh-64px)] desk:h-[calc(100dvh-64px)]" aria-busy="true" />,
});
/** Starts loading the map view, MapLibre and the style, for a map about to open. */
const warmKdMap = () => {
  void import('./map-view');
  void import('../../map/kd-map').then((m) => m.warmKdMap());
};

export type View = 'table' | 'grid' | 'map';
export type Time = 'all' | 'tonight' | 'weekend' | '7days' | 'month';
export interface Meta {
  cities: { slug: string; country: string; name: Pair; timezone: string; center: [number, number] | null; bbox: [number, number, number, number] | null }[];
  countries: { code: string; name: Pair; timezone: string }[];
  styles: { key: string; label: Pair; genre: string | null }[];
  eventTypes: { key: string; label: Pair }[];
  genres: string[];
}
export interface Filters {
  city: string;
  time: Time;
  family: Family | null;
  genre: string | null;
  style: string | null;
  type: string | null;
  q: string;
  view: View;
  bbox: [number, number, number, number] | null;
  /** Posted, or found by Feest Radar; null is both. */
  origin: Origin | null;
}

const TIMES: Time[] = ['all', 'tonight', 'weekend', '7days', 'month'];
/** The kinds of night and music styles the list offers as one picker (the legacy chips). */
const TYPE_CHIPS = ['club', 'festival', 'concert', 'day'];
const STYLE_CHIPS = ['techno', 'hard-techno', 'house', 'trance', 'psytrance', 'drum-and-bass', 'hardstyle', 'bass'];
/** A phone's three times, one tap each (design v2 phase 12, owner 2026-10-18; three since phase 13: the list by day already shows the week). */
const PHONE_TIMES: Time[] = ['tonight', 'weekend', 'all'];
/** A phone's row of styles: the ones with nights here, most first; shown once there are two to choose from. */
const PHONE_STYLES = 6;

/** A time choice's name. */
const timeName = (T: ReturnType<typeof pick<typeof LIST>>, t: Time) => ({ all: T.anyTime, tonight: T.tonight, weekend: T.weekend, '7days': T.next7, month: T.month })[t];

export const DEFAULT: Filters = { city: 'all', time: 'all', family: null, genre: null, style: null, type: null, q: '', view: 'grid', bbox: null, origin: null };

export function readFilters(q: URLSearchParams, meta: Meta): Filters {
  const time = q.get('time') as Time | null;
  const view = q.get('view') as View | null;
  const bbox = (q.get('bbox') || '').split(',').map(Number);
  return {
    city: meta.cities.some((c) => c.slug === q.get('city')) ? q.get('city')! : 'all',
    time: time && TIMES.includes(time) ? time : 'all',
    family: q.get('price') === 'free' ? 'free' : null,
    genre: meta.genres.includes(q.get('genre') ?? '') ? q.get('genre') : null,
    style: q.get('style') || null,
    type: q.get('type') || null,
    q: (q.get('q') || '').slice(0, 100),
    view: view === 'table' || view === 'map' ? view : 'grid',
    bbox: bbox.length === 4 && bbox.every(Number.isFinite) ? (bbox as Filters['bbox']) : null,
    origin: q.get('origin') === 'radar' || q.get('origin') === 'posted' ? (q.get('origin') as Origin) : null,
  };
}

/** The API's filters (the map leaves out the city: its box is the place). */
export function apiQuery(f: Filters, opts: { city?: boolean } = {}) {
  const q = new URLSearchParams();
  if (opts.city !== false && f.city !== 'all') q.set('city', f.city);
  if (f.genre) q.set('genre', f.genre);
  if (f.family === 'free') q.set('price', 'free');
  q.set('time', f.time);
  if (f.style) q.set('style', f.style);
  if (f.type) q.set('type', f.type);
  if (f.q) q.set('q', f.q);
  if (f.origin) q.set('origin', f.origin);
  return q;
}

function address(f: Filters, lang: Lang) {
  const q = new URLSearchParams();
  if (f.city !== 'all') q.set('city', f.city);
  if (f.genre) q.set('genre', f.genre);
  if (f.family === 'free') q.set('price', 'free');
  if (f.time !== 'all') q.set('time', f.time);
  if (f.style) q.set('style', f.style);
  if (f.type) q.set('type', f.type);
  if (f.q) q.set('q', f.q);
  if (f.origin) q.set('origin', f.origin);
  if (f.view !== 'grid') q.set('view', f.view);
  if (f.view === 'map' && f.bbox) q.set('bbox', f.bbox.join(','));
  if (lang !== 'vi') q.set('lang', lang);
  const s = q.toString();
  return '/' + (s ? '?' + s : '');
}

interface Page { items: Card[]; total: number; nextCursor: string | null; facets: { city: Record<string, number>; style?: Record<string, number>; origin?: { posted: number; radar: number } } }

export function ListBrowser({ lang, meta, initial, city, highlight, highlightArt = false }: {
  lang: Lang; meta: Meta; initial: Page; highlight?: ReactNode;
  /** The city whose nights the server drew (/?city=<slug>, list/city.tsx): the list starts there and asks nothing on load. */
  city?: string;
  /** The highlight has a picture, which then loads first (list/page.tsx); else the list's first picture does. */
  highlightArt?: boolean;
}) {
  const T = pick(LIST, lang);
  /** What the server drew: every city, or the address's one. */
  const drawn = useMemo<Filters>(() => (city ? { ...DEFAULT, city } : DEFAULT), [city]);
  const [f, setF] = useState<Filters>(drawn);
  const [page, setPage] = useState<Page>(initial);
  const [rows, setRows] = useState<Card[]>(initial.items);
  const [busy, setBusy] = useState(false);
  const [sort, setSort] = useState<{ by: 'date' | 'price' | 'hype'; desc: boolean }>({ by: 'date', desc: false });
  /** Counts the list's answers, so "today" is read again with each (by the API's clock: `at` below). */
  const [reads, setReads] = useState(0);
  const [ready, setReady] = useState(false);
  /** The newcomer's country (city-first.tsx): its nights lead the list while every city shows. */
  const [country, setCountry] = useState<string | null>(null);
  const [firstRun, setFirstRun] = useState(false);
  const openedByApp = useRef(false);
  const seq = useRef(0);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const load = useCallback(async (next: Filters, mode: 'replace' | 'more' | 'refresh' = 'replace', cursor?: string | null) => {
    if (next.view === 'map') return;
    const n = ++seq.current;
    if (mode !== 'refresh') setBusy(true);
    const q = apiQuery(next);
    q.set('upcoming', 'true');
    q.set('limit', '60');
    if (mode === 'more' && cursor) q.set('cursor', cursor);
    const out: Page | null = await FF.maybe(FF.get('/events?' + q), null);
    if (n !== seq.current) return;
    setBusy(false);
    if (!out) return;
    setReads((n) => n + 1);
    if (mode === 'more') { setRows((r) => [...r, ...out.items]); setPage((p) => ({ ...p, nextCursor: out.nextCursor })); return; }
    setPage(out);
    setRows(out.items);
  }, []);

  // The address decides; then the list asks the API.
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const next = readFilters(q, meta);
    // The installed app opens on the city this device chose (its onboarding, below), as its feed did.
    // Read before the list rewrites its address, which drops ?source=app.
    openedByApp.current = fromApp();
    // The installed app keeps its tickets working offline from its first screen on.
    if (openedByApp.current) void import('@/runtime/pwa').then((m) => m.registerServiceWorker());
    if (!q.has('city') && openedByApp.current) {
      const c = place.city();
      if (c && meta.cities.some((x) => x.slug === c)) next.city = c;
    }
    // The newcomer's city, marked before the first paint (city-first.tsx): the list shows once its nights are in.
    const first = document.documentElement.getAttribute('data-city-first');
    if (first && !q.has('city') && meta.cities.some((x) => x.slug === first)) next.city = first;
    else if (first) document.documentElement.removeAttribute('data-city-first');
    // Or the newcomer's country: what the list has, its nights first (design v2 phase 13, owner 2026-10-19).
    const placeFirst = document.documentElement.getAttribute('data-place-first');
    const country = placeFirst && !q.has('city') && meta.countries.some((x) => x.code === placeFirst) ? placeFirst : null;
    if (placeFirst && !country) document.documentElement.removeAttribute('data-place-first');
    // In a transition, and only what changed: the list the server drew stays while this draws.
    startTransition(() => {
      if (country) setCountry(country);
      if (JSON.stringify(next) !== JSON.stringify(drawn)) setF(next);
      setReady(true);
    });
    const same = JSON.stringify({ ...next, view: 'grid', bbox: null }) === JSON.stringify(drawn);
    if (!same || next.view === 'map') void load(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kd = useKd();
  const { clockReady } = kd;
  // The installed app's first run: a device it has never seen, nobody signed in (first-run.tsx).
  const asked = useRef(false);
  useEffect(() => {
    if (kd.session === undefined || asked.current) return;
    asked.current = true;
    if (openedByApp.current && !place.known() && !kd.user) setFirstRun(true);
  }, [kd.session, kd.user]);
  // When the list was read, by the API's clock (it is pinned in the tests; null until it is known, as on the server).
  const at = useMemo(() => (clockReady && reads >= 0 ? FF.now() : null), [clockReady, reads]);
  // The newcomer's city is in (or the list asked nothing), its country is grouped, or the address's filters
  // have their answer: show the list (and drop the highlight's hiding) city-first.tsx held back.
  useEffect(() => {
    if (!ready || busy) return;
    for (const a of ['data-city-first', 'data-place-first', 'data-list-wait', 'data-asked']) document.documentElement.removeAttribute(a);
  }, [ready, busy, rows, country]);

  // Every minute while the list is on screen (not more pages: they would be dropped).
  useEffect(() => {
    if (!ready || f.view === 'map') return;
    const t = setInterval(() => { if (!page.nextCursor || rowsRef.current.length <= 60) void load(f, 'refresh'); }, 60_000);
    return () => clearInterval(t);
  }, [ready, f, page.nextCursor, load]);

  // The address follows the choices, so a copied link opens the same list; the nav's tab bar and
  // language link read it again (web/lang.ts).
  useEffect(() => {
    if (!ready) return;
    history.replaceState(history.state, '', address(f, lang));
    window.dispatchEvent(new Event('kd:url'));
  }, [f, ready, lang]);
  // From the map, after each search: whatever else was chosen meanwhile stays.
  const onBbox = useCallback((bbox: Box) => setF((cur) => ({ ...cur, bbox })), []);

  const set = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch };
    if (patch.view && patch.view !== 'map') next.bbox = null;
    setF(next);
    if ('view' in patch && Object.keys(patch).length === 1 && patch.view !== 'map' && f.view !== 'map') return;
    void load(next);
  };

  const sorted = useMemo(() => {
    const key = { date: (e: Card) => (e.startsAt ? Date.parse(e.startsAt) : 0), price: (e: Card) => (e.isFree ? 0 : e.priceUnknown ? Number.MAX_SAFE_INTEGER : e.priceFrom), hype: (e: Card) => e.saveCount }[sort.by];
    return [...rows].filter((e) => !e.past).sort((a, b) => (key(a) - key(b)) * (sort.desc ? -1 : 1));
  }, [rows, sort]);

  const cityCounts = page.facets?.city ?? {};
  const allCount = Object.values(cityCounts).reduce((n, x) => n + x, 0);
  const cityName = (slug: string) => tx(meta.cities.find((c) => c.slug === slug)?.name, lang) ?? '';
  const timeLabel = (t: Time) => timeName(T, t);
  const kindLabel = f.type ? tx(meta.eventTypes.find((x) => x.key === f.type)?.label, lang) : f.style ? tx(meta.styles.find((x) => x.key === f.style)?.label, lang) : null;
  const filtered = f.city !== 'all' || f.time !== 'all' || !!f.family || !!f.genre || !!f.style || !!f.type || !!f.q || !!f.origin;
  const clear = () => set({ city: 'all', time: 'all', family: null, genre: null, style: null, type: null, q: '', origin: null });

  const viewSwitch = (full?: boolean) => (
    <Segmented label={T.view} value={f.view} full={full} onChange={(v) => set({ view: v })} options={[{ value: 'grid', label: T.grid }, { value: 'table', label: T.table }, { value: 'map', label: T.map }]} />
  );
  const origins = page.facets?.origin ?? null;
  const O = pick(ORIGIN, lang);

  // ---- the filters: one set of parts, in the sticky bar, the phone's "Lọc" sheet and the map's column ----
  const cityPicker = (
    <Picker
      label={T.city}
      value={f.city}
      // Remembered on this device: the newcomer's city next time (city-first.tsx), 'all' included.
      onChange={(v) => { place.setCity(v); set({ city: v }); }}
      options={[{ value: 'all', label: T.allCities, aside: allCount }, ...meta.cities.map((c) => ({ value: c.slug, label: tx(c.name, lang), aside: cityCounts[c.slug] ?? 0 }))]}
      display={f.city === 'all' ? T.allCities : cityName(f.city)}
    />
  );
  const timePicker = <Picker label={T.when} value={f.time} onChange={(v) => set({ time: v })} options={TIMES.map((t) => ({ value: t, label: timeLabel(t) }))} />;
  const kindMenu = (
    <Menu
      label={T.kind}
      trigger={(p) => (
        <button type="button" {...p} ref={p.ref} className={cx('kd-chip', kindLabel && 'kd-chip-on')} aria-label={`${kindLabel ?? T.anyKind}, ${T.kind}`}>
          {kindLabel ?? T.anyKind}
        </button>
      )}
    >
      <MenuItem checked={!f.type && !f.style} onSelect={() => set({ type: null, style: null })}>{T.anyKind}</MenuItem>
      {TYPE_CHIPS.map((k) => (
        <MenuItem key={k} checked={f.type === k} onSelect={() => set({ type: f.type === k ? null : k })}>{tx(meta.eventTypes.find((x) => x.key === k)?.label, lang) ?? k}</MenuItem>
      ))}
      <MenuSeparator />
      {STYLE_CHIPS.map((k) => (
        <MenuItem key={k} checked={f.style === k} onSelect={() => set({ style: f.style === k ? null : k })}>{tx(meta.styles.find((x) => x.key === k)?.label, lang) ?? k}</MenuItem>
      ))}
    </Menu>
  );
  const freeChip = <Chip family="free" on={f.family === 'free'} onClick={() => set({ family: f.family === 'free' ? null : 'free', genre: null })}>{tx(FAMILY_LABEL.free, lang)}</Chip>;
  /** Posted or found by Radar, with their counts where the list has them. */
  const sourcePicker = (
    <Picker
      label={T.source}
      value={f.origin ?? 'all'}
      onChange={(v) => set({ origin: v === 'all' ? null : v })}
      display={f.origin ? O[f.origin] : T.anySource}
      options={[
        { value: 'all' as const, label: T.anySource, aside: origins ? origins.posted + origins.radar : null },
        { value: 'posted' as const, label: O.posted, aside: origins?.posted ?? null },
        { value: 'radar' as const, label: O.radar, aside: origins?.radar ?? null },
      ]}
    />
  );
  /** The nav's search, as a choice that can be taken back. */
  const queryChip = f.q ? (
    <button type="button" className="kd-chip kd-chip-on" aria-label={fill(T.clearQuery, { q: f.q })} onClick={() => set({ q: '' })}>
      <span className="kd-ell">“{f.q}”</span><XIcon size={14} aria-hidden="true" />
    </button>
  ) : null;
  const clearButton = filtered ? <button type="button" className="kd-more ml-1" onClick={clear}><XIcon size={14} aria-hidden="true" />{T.clear}</button> : null;
  /** Every filter in a row (the bar on a computer, the map's column); the map adds its own "Dưới 5 km". */
  // The map's column: on a phone the city and the time only (design v2 phase 12).
  const filters = (extra?: ReactNode) => (
    <div className="flex flex-wrap items-center gap-2">
      {cityPicker}{timePicker}<span className="contents max-tab:hidden">{kindMenu}{freeChip}{sourcePicker}</span>{queryChip}{extra}{clearButton}
    </div>
  );
  /**
   * A phone (design v2 phase 12, owner 2026-10-18): four times in one tap, and the styles that have
   * nights here as a row of chips; price, kind, source and the table stay on a computer.
   */
  const phoneTimes = (
    <Segmented
      full
      label={T.when}
      value={PHONE_TIMES.includes(f.time) ? f.time : 'all'}
      onChange={(v) => set({ time: v })}
      options={PHONE_TIMES.map((t) => ({ value: t, label: t === 'all' ? T.allTimes : timeLabel(t) }))}
    />
  );
  const styleCounts = page.facets?.style ?? {};
  const phoneStyles = Object.entries(styleCounts).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, PHONE_STYLES).map(([k]) => k);
  if (f.style && !phoneStyles.includes(f.style)) phoneStyles.unshift(f.style);
  const styleRow = phoneStyles.length < 2 ? null : phoneStyles.map((k) => (
    <Chip key={k} on={f.style === k} onClick={() => set({ style: f.style === k ? null : k, type: null })}>
      {tx(meta.styles.find((x) => x.key === k)?.label, lang) ?? k}
    </Chip>
  ));

  /** An event opened from the list, in any view: the step between the list and the event page (the design funnel). */
  const openCard = (ev: MouseEvent) => {
    const a = (ev.target as Element).closest?.('a[href]');
    const slug = a?.getAttribute('href')?.match(/^\/e\/([^/?#]+)/)?.[1];
    if (!a || !slug) return;
    FF.track('card_open', { slug: decodeURIComponent(slug), surface: a.closest('[data-surface]')?.getAttribute('data-surface') ?? f.view });
  };

  if (f.view === 'map') {
    return (
      <div className="contents" onClickCapture={openCard}>
      <MapView
        lang={lang}
        meta={meta}
        filters={f}
        onBbox={onBbox}
        onClear={clear}
        viewSwitch={viewSwitch(true)}
        search={null}
        toolbar={filters}
        tabs={null}
      />
      </div>
    );
  }

  const head = (label: string, by?: 'date' | 'price' | 'hype') => by ? (
    <button
      type="button"
      className="kd-m inline-flex items-center gap-1 text-left hover:text-fg-1"
      aria-label={fill(T.sortBy, { c: label })}
      aria-pressed={sort.by === by}
      onClick={() => setSort((s) => (s.by === by ? { by, desc: !s.desc } : { by, desc: by !== 'date' }))}
    >
      {label}
      {sort.by === by ? (sort.desc ? <ArrowDownIcon size={12} aria-hidden="true" /> : <ArrowUpIcon size={12} aria-hidden="true" />) : null}
    </button>
  ) : label;

  const status = (e: Card): { tone: StatusTone; text: string } => {
    if (e.soldOut) return { tone: 'bad', text: T.stSold };
    if (e.festival?.flagship && e.festival.label) return { tone: 'live', text: tx(e.festival.label, lang) };
    const today = at ? new Intl.DateTimeFormat('en-CA', { timeZone: e.timezone || 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(at) : null;
    if (today && e.startsOn && e.startsOn <= today && (e.endsOn ?? e.startsOn) >= today) return { tone: 'live', text: T.stTonight };
    if (e.badge) return { tone: 'warn', text: tx(e.badge.label, lang) };
    if (e.isFree) return { tone: 'ok', text: T.stFree };
    return { tone: 'none', text: T.stOn };
  };
  const COLS = '120px 64px minmax(200px,2fr) minmax(160px,1.4fr) 120px 120px 96px 132px';

  const heading = [f.time !== 'all' ? timeLabel(f.time) : T.title, f.city !== 'all' ? cityName(f.city) : null].filter(Boolean).join(' · ');
  const today = at ? todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone, at) : null;
  // The newcomer's country first (phase 13): its nights under its name, the rest under "Nơi khác", while every city shows.
  const countryOf = (slug: string) => meta.cities.find((c) => c.slug === slug)?.country ?? null;
  const mine = country && f.city === 'all' ? sorted.filter((e) => countryOf(e.city) === country) : [];
  const split = mine.length > 0 && mine.length < sorted.length;
  const groups = f.view === 'grid' ? groupByDay(split ? mine : sorted, lang, today) : [];
  const elsewhere = split ? groupByDay(sorted.filter((e) => countryOf(e.city) !== country), lang, today) : [];
  const countryName = country ? tx(meta.countries.find((c) => c.code === country)?.name, lang) : null;
  // The world's biggest festivals (or the shelf on), while nothing but the city narrows the list. Decided
  // once, from the filters: the server and the first render in the browser (both what the server drew, a city at most) agree.
  const showHighlight = !!highlight && JSON.stringify({ ...f, city: 'all', view: 'grid', bbox: null }) === JSON.stringify(DEFAULT);
  // One picture first on the page: the highlight's when it has one, else the list's.
  const listEager = !(showHighlight && highlightArt);

  return (
    <>
      {/* The sticky bar: every filter on a computer; on a phone "Lọc" (a sheet with all of them) and the two used most. */}
      <div className="kd-cmd">
        <div className="kd-wrap flex min-h-14 items-center gap-2 py-2">
          <div role="group" aria-label={T.filtersBar} className="flex min-w-0 flex-wrap items-center gap-2 max-tab:hidden">
            {cityPicker}{timePicker}{kindMenu}{freeChip}{sourcePicker}{queryChip}{clearButton}
          </div>
          {/* On a phone the bar holds the time; the city and the styles open the list below it. */}
          <div className="min-w-0 flex-1 tab:hidden">{phoneTimes}</div>
          {/* The map is a view of the list on a phone too (owner, 2026-10-21: it left the tab bar for Nghệ sĩ and Blog). */}
          <IconButton label={T.map} className="shrink-0 tab:hidden" onPointerDown={warmKdMap} onClick={() => set({ view: 'map' })}>
            <span className="kd-pi kd-pi-map" style={{ ['--pi' as string]: '20px' }} aria-hidden="true" />
          </IconButton>
          {/* Pointing at the switch starts loading the map, so "Bản đồ" opens at once. */}
          <div className="ml-auto max-tab:hidden" onPointerOver={warmKdMap} onFocus={warmKdMap}>{viewSwitch()}</div>
        </div>
      </div>
      {/* A screen's height before the footer: the list changes after the first paint (the address's city, a
          filter, an empty answer) and must not pull the footer into view (CLS). */}
      <main className="kd-wrap flex min-h-dvh flex-col gap-6 pb-8 pt-6" onClickCapture={openCard}>
        {/* On a phone the day headings lead; the page keeps its heading for screen readers and search. */}
        <h1 className="kd-d2 max-tab:sr-only">{heading}</h1>
        {/* A phone: the city first (the newcomer's question), then the styles that have nights here. */}
        <div className="flex flex-wrap items-center gap-2 tab:hidden">{cityPicker}{styleRow}{queryChip}</div>
        {/* The world's biggest festivals, always first, while nothing narrows the list. */}
        {showHighlight ? highlight : null}
        {/* data-list: held back while the newcomer's city, or the address's filters, load (city-first.tsx). */}
        <div data-list className="contents">
        {sorted.length ? (
          f.view === 'grid' ? (
            split ? (
              <div className={cx('flex min-w-0 flex-col gap-10 transition-opacity', busy && 'opacity-60')}>
                <h2 id="here-h" className="kd-d2">{countryName}</h2>
                <DayGrid groups={groups} lang={lang} eager={listEager} />
                <h2 id="elsewhere-h" className="kd-d2 border-t border-line-1 pt-10">{T.elsewhere}</h2>
                <DayGrid groups={elsewhere} lang={lang} />
              </div>
            ) : (
              <DayGrid groups={groups} lang={lang} eager={listEager} className={cx('min-w-0 transition-opacity', busy && 'opacity-60')} />
            )
          ) : (
            <div className={cx('kd-tbl -mx-4 tab:mx-0 transition-opacity', busy && 'opacity-60')} role="table" aria-label={T.title} data-fold="xl">
              <div role="row" className="kd-tr kd-tr-head" style={{ gridTemplateColumns: shrinkable(COLS) }}>
                <span role="columnheader">{head(T.colDate, 'date')}</span>
                <span role="columnheader" className="kd-m">{T.colTime}</span>
                <span role="columnheader" className="kd-m">{T.colEvent}</span>
                <span role="columnheader" className="kd-m">{T.colVenue}</span>
                <span role="columnheader" className="kd-m">{T.colCity}</span>
                <span role="columnheader">{head(T.colPrice, 'price')}</span>
                <span role="columnheader">{head(T.colInterest, 'hype')}</span>
                <span role="columnheader" className="kd-m">{T.colStatus}</span>
              </div>
              {sorted.map((e) => {
                const st = status(e);
                return (
                  <Link key={e.id} role="row" href={inLang('/e/' + e.slug, lang)} className="kd-tr hover:bg-white/[0.03]" style={{ gridTemplateColumns: shrinkable(COLS) }}>
                    <span role="cell" className="kd-s kd-num text-fg-2">{whenShort(e, lang)}</span>
                    <span role="cell" className="kd-mb kd-num">{e.startTime ?? ''}</span>
                    <span role="cell" className="kd-hs flex min-w-0 items-center gap-2"><Marker family={familyOf(e.genre)} /><span className="kd-ell">{e.title}</span>{e.origin === 'radar' ? <RadarTag lang={lang} /> : null}</span>
                    <span role="cell" className="kd-s kd-ell">{[e.venue.name, e.venue.area].filter(Boolean).join(' · ')}</span>
                    <span role="cell" className="kd-s kd-ell">{cityName(e.city)}</span>
                    <span role="cell" className={cx('kd-mb kd-num', e.isFree && 'text-info')}>{e.isFree ? T.free : e.priceUnknown ? T.priceUnknown : moneyShort(e.priceFrom, e.currency, lang)}</span>
                    <span role="cell" className="kd-mb kd-num text-fg-2">{fmtCount(e.saveCount, lang)}</span>
                    <span role="cell"><Status tone={st.tone}>{st.text}</Status></span>
                  </Link>
                );
              })}
            </div>
          )
        ) : busy ? (
          <div className="kd-skel h-40" aria-hidden="true" />
        ) : (
          <Panel role="status" className="flex flex-wrap items-center justify-between gap-4 p-7">
            <span className="kd-h">{T.empty}</span>
            {filtered ? <Button onClick={clear}>{T.clear}</Button> : null}
          </Panel>
        )}
        {page.nextCursor && sorted.length ? (
          <Button className="self-center" disabled={busy} onClick={() => load(f, 'more', page.nextCursor)}>{T.more}</Button>
        ) : null}
        </div>
      </main>
      {firstRun ? (
        <FirstRun
          lang={lang}
          cities={meta.cities}
          onDone={(city, styles) => {
            setFirstRun(false);
            if (city || styles.length) set({ ...(city ? { city } : {}), ...(styles.length ? { style: styles.join(','), type: null } : {}) });
          }}
        />
      ) : null}
    </>
  );
}
