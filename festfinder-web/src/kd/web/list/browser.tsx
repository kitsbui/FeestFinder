'use client';
/**
 * /list: every upcoming event as a table, a grid or a map, by city, time, genre family (or one
 * API genre), kind of night and music style, and text. The address carries the choices with
 * the legacy names (city, genre, time, style, type, view, bbox, q) so old links and the
 * /vi/… and /en/… redirects keep landing on the right list. The list re-reads itself every
 * minute while it is open.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowDownIcon, ArrowUpIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../../copy';
import { cx } from '../../cx';
import { moneyShort, whenShort, count as fmtCount } from '../../format';
import { FAMILY_LABEL, familyOf, type Family } from '../../genre';
import { KdLink as Link, inLang } from '../../link';
import { useKd } from '../../runtime';
import { Button } from '../../ui/actions';
import { Input, Segmented } from '../../ui/forms';
import { Menu, MenuItem, MenuSeparator, Picker } from '../../ui/menu';
import { Card as Panel, Marker, Status, type StatusTone } from '../../ui/parts';
import type { Card } from '../../types';
import { EventCard } from '../card';
import { LIST } from './copy';
import type { Box } from '../../map/kd-map';
import { MapView } from './map-view';

export type View = 'table' | 'grid' | 'map';
export type Time = 'all' | 'tonight' | 'weekend' | '7days' | 'month';
export interface Meta {
  cities: { slug: string; name: Pair; timezone: string; center: [number, number] | null; bbox: [number, number, number, number] | null }[];
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
}

const TIMES: Time[] = ['all', 'tonight', 'weekend', '7days', 'month'];
const FAMILIES: Family[] = ['fest', 'live', 'edm', 'cult', 'free'];
/** The kinds of night and music styles the list offers as one picker (the legacy chips). */
const TYPE_CHIPS = ['club', 'festival', 'concert'];
const STYLE_CHIPS = ['techno', 'hard-techno', 'house', 'trance', 'psytrance', 'drum-and-bass', 'hardstyle', 'bass', 'hip-hop'];

export const DEFAULT: Filters = { city: 'all', time: 'all', family: null, genre: null, style: null, type: null, q: '', view: 'table', bbox: null };

export function readFilters(q: URLSearchParams, meta: Meta): Filters {
  const time = q.get('time') as Time | null;
  const view = q.get('view') as View | null;
  const fam = q.get('price') === 'free' ? 'free' : (q.get('family') as Family | null);
  const bbox = (q.get('bbox') || '').split(',').map(Number);
  return {
    city: meta.cities.some((c) => c.slug === q.get('city')) ? q.get('city')! : 'all',
    time: time && TIMES.includes(time) ? time : 'all',
    family: fam && FAMILIES.includes(fam) ? fam : null,
    genre: meta.genres.includes(q.get('genre') ?? '') ? q.get('genre') : null,
    style: q.get('style') || null,
    type: q.get('type') || null,
    q: (q.get('q') || '').slice(0, 100),
    view: view === 'grid' || view === 'map' ? view : 'table',
    bbox: bbox.length === 4 && bbox.every(Number.isFinite) ? (bbox as Filters['bbox']) : null,
  };
}

/** The API's filters (the map leaves out the city: its box is the place). */
export function apiQuery(f: Filters, opts: { city?: boolean } = {}) {
  const q = new URLSearchParams();
  if (opts.city !== false && f.city !== 'all') q.set('city', f.city);
  if (f.genre) q.set('genre', f.genre);
  if (f.family === 'free') q.set('price', 'free');
  else if (f.family) q.set('family', f.family);
  q.set('time', f.time);
  if (f.style) q.set('style', f.style);
  if (f.type) q.set('type', f.type);
  if (f.q) q.set('q', f.q);
  return q;
}

function address(f: Filters, lang: Lang) {
  const q = new URLSearchParams();
  if (f.city !== 'all') q.set('city', f.city);
  if (f.genre) q.set('genre', f.genre);
  if (f.family === 'free') q.set('price', 'free');
  else if (f.family) q.set('family', f.family);
  if (f.time !== 'all') q.set('time', f.time);
  if (f.style) q.set('style', f.style);
  if (f.type) q.set('type', f.type);
  if (f.q) q.set('q', f.q);
  if (f.view !== 'table') q.set('view', f.view);
  if (f.view === 'map' && f.bbox) q.set('bbox', f.bbox.join(','));
  if (lang === 'en') q.set('lang', 'en');
  const s = q.toString();
  return '/list' + (s ? '?' + s : '');
}

interface Page { items: Card[]; total: number; nextCursor: string | null; facets: { city: Record<string, number> } }

export function ListBrowser({ lang, meta, initial }: { lang: Lang; meta: Meta; initial: Page }) {
  const T = pick(LIST, lang);
  const [f, setF] = useState<Filters>(DEFAULT);
  const [page, setPage] = useState<Page>(initial);
  const [rows, setRows] = useState<Card[]>(initial.items);
  const [busy, setBusy] = useState(false);
  const [sort, setSort] = useState<{ by: 'date' | 'price' | 'hype'; desc: boolean }>({ by: 'date', desc: false });
  const [at, setAt] = useState<Date | null>(null);
  const [added, setAdded] = useState(0);
  const [ready, setReady] = useState(false);
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
    setAt(FF.now());
    if (mode === 'more') { setRows((r) => [...r, ...out.items]); setPage((p) => ({ ...p, nextCursor: out.nextCursor })); return; }
    if (mode === 'refresh') {
      const known = new Set(rowsRef.current.map((e) => e.id));
      setAdded(out.items.filter((e) => !known.has(e.id)).length);
    } else setAdded(0);
    setPage(out);
    setRows(out.items);
  }, []);

  // The address decides; then the list asks the API.
  useEffect(() => {
    const next = readFilters(new URLSearchParams(location.search), meta);
    setF(next);
    setReady(true);
    const same = JSON.stringify({ ...next, view: 'table', bbox: null }) === JSON.stringify({ ...DEFAULT });
    if (!same || next.view === 'map') load(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When it was read, by the API's clock (it is pinned in the tests).
  const { clockReady } = useKd();
  useEffect(() => { if (clockReady) setAt(FF.now()); }, [clockReady]);

  // Every minute while the list is on screen (not more pages: they would be dropped).
  useEffect(() => {
    if (!ready || f.view === 'map') return;
    const t = setInterval(() => { if (!page.nextCursor || rowsRef.current.length <= 60) load(f, 'refresh'); }, 60_000);
    return () => clearInterval(t);
  }, [ready, f, page.nextCursor, load]);

  // The address follows the choices, so a copied link opens the same list.
  useEffect(() => {
    if (ready) history.replaceState(history.state, '', address(f, lang));
  }, [f, ready, lang]);
  // From the map, after each search: whatever else was chosen meanwhile stays.
  const onBbox = useCallback((bbox: Box) => setF((cur) => ({ ...cur, bbox })), []);

  const set = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch };
    if (patch.view && patch.view !== 'map') next.bbox = null;
    setF(next);
    if ('view' in patch && Object.keys(patch).length === 1 && patch.view !== 'map' && f.view !== 'map') return;
    load(next);
  };

  const sorted = useMemo(() => {
    const key = { date: (e: Card) => (e.startsAt ? Date.parse(e.startsAt) : 0), price: (e: Card) => (e.isFree ? 0 : e.priceFrom), hype: (e: Card) => e.saveCount }[sort.by];
    return [...rows].filter((e) => !e.past).sort((a, b) => (key(a) - key(b)) * (sort.desc ? -1 : 1));
  }, [rows, sort]);

  const cityCounts = page.facets?.city ?? {};
  const tz = meta.cities.find((c) => c.slug === f.city)?.timezone ?? meta.cities[0]?.timezone ?? 'UTC';
  const allCount = Object.values(cityCounts).reduce((n, x) => n + x, 0);
  const cityName = (slug: string) => meta.cities.find((c) => c.slug === slug)?.name[lang] ?? '';
  const timeLabel = (t: Time) => ({ all: T.anyTime, tonight: T.tonight, weekend: T.weekend, '7days': T.next7, month: T.month })[t];
  const kindLabel = f.type ? meta.eventTypes.find((x) => x.key === f.type)?.label[lang] : f.style ? meta.styles.find((x) => x.key === f.style)?.label[lang] : null;
  const filtered = f.city !== 'all' || f.time !== 'all' || !!f.family || !!f.genre || !!f.style || !!f.type || !!f.q;
  const clear = () => set({ city: 'all', time: 'all', family: null, genre: null, style: null, type: null, q: '' });

  const search = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = String(new FormData(e.currentTarget).get('q') ?? '').trim();
    if (v) FF.track('search', { screen: 'list' });
    set({ q: v });
  };

  const filters = (
    <div className="flex flex-wrap items-center gap-2">
      <Picker
        label={T.city}
        value={f.city}
        onChange={(v) => set({ city: v })}
        options={[{ value: 'all', label: T.allCities, aside: allCount }, ...meta.cities.map((c) => ({ value: c.slug, label: c.name[lang], aside: cityCounts[c.slug] ?? 0 }))]}
        display={f.city === 'all' ? T.allCities : cityName(f.city)}
      />
      <Picker label={T.when} value={f.time} onChange={(v) => set({ time: v })} options={TIMES.map((t) => ({ value: t, label: timeLabel(t) }))} />
      <Menu
        label={T.genre}
        trigger={(p) => (
          <button type="button" {...p} ref={p.ref} className={cx('kd-chip', (f.family || f.genre) && 'kd-chip-on')} aria-label={T.genre}>
            {f.family ? <Marker family={f.family} /> : null}
            {f.family ? FAMILY_LABEL[f.family][lang] : f.genre ?? T.allGenres}
          </button>
        )}
      >
        <MenuItem checked={!f.family && !f.genre} onSelect={() => set({ family: null, genre: null })}>{T.allGenres}</MenuItem>
        {FAMILIES.map((fam) => (
          <MenuItem key={fam} checked={f.family === fam} icon={<Marker family={fam} />} onSelect={() => set({ family: fam, genre: null })}>{FAMILY_LABEL[fam][lang]}</MenuItem>
        ))}
        <MenuSeparator />
        {meta.genres.map((gen) => (
          <MenuItem key={gen} checked={f.genre === gen} icon={<Marker family={familyOf(gen)} />} onSelect={() => set({ genre: gen, family: null })}>{gen}</MenuItem>
        ))}
      </Menu>
      <Menu
        label={T.kind}
        trigger={(p) => (
          <button type="button" {...p} ref={p.ref} className={cx('kd-chip', kindLabel && 'kd-chip-on')} aria-label={T.kind}>
            {kindLabel ?? T.anyKind}
          </button>
        )}
      >
        <MenuItem checked={!f.type && !f.style} onSelect={() => set({ type: null, style: null })}>{T.anyKind}</MenuItem>
        {TYPE_CHIPS.map((k) => (
          <MenuItem key={k} checked={f.type === k} onSelect={() => set({ type: f.type === k ? null : k })}>{meta.eventTypes.find((x) => x.key === k)?.label[lang] ?? k}</MenuItem>
        ))}
        <MenuSeparator />
        {STYLE_CHIPS.map((k) => (
          <MenuItem key={k} checked={f.style === k} onSelect={() => set({ style: f.style === k ? null : k })}>{meta.styles.find((x) => x.key === k)?.label[lang] ?? k}</MenuItem>
        ))}
      </Menu>
      {filtered ? <button type="button" className="kd-more ml-1" onClick={clear}><XIcon size={14} aria-hidden="true" />{T.clear}</button> : null}
    </div>
  );

  if (f.view === 'map') {
    return (
      <MapView
        lang={lang}
        meta={meta}
        filters={f}
        onFilters={set}
        onBbox={onBbox}
        viewSwitch={<Segmented label={T.view} value={f.view} onChange={(v) => set({ view: v })} options={[{ value: 'table', label: T.table }, { value: 'grid', label: T.grid }, { value: 'map', label: T.map }]} />}
      />
    );
  }

  const head = (label: string, by?: 'date' | 'price' | 'hype') => by ? (
    <button
      type="button"
      className="kd-m inline-flex items-center gap-1 text-left hover:text-paper"
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
    const today = at ? new Intl.DateTimeFormat('en-CA', { timeZone: e.timezone || 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(at) : null;
    if (today && e.startsOn && e.startsOn <= today && (e.endsOn ?? e.startsOn) >= today) return { tone: 'live', text: T.stTonight };
    if (e.badge) return { tone: 'warn', text: e.badge.label[lang] };
    if (e.isFree) return { tone: 'ok', text: T.stFree };
    return { tone: 'none', text: T.stOn };
  };
  const COLS = '120px 64px minmax(200px,2fr) minmax(160px,1.4fr) 120px 120px 96px 132px';

  return (
    <main className="kd-wrap flex flex-col gap-5 py-8">
      <div className="kd-sec items-center">
        <div className="flex flex-col gap-1.5">
          <h1 className="kd-d1">{T.title}</h1>
          <span className="kd-m kd-num" aria-live="polite">
            {fill(T.count, { n: page.nextCursor ? page.total : sorted.length })}
            {at ? ' · ' + fill(T.updated, { t: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(at) }) : ''}
            {added ? ' · ' + fill(T.added, { n: added }) : ''}
          </span>
        </div>
        <Segmented label={T.view} value={f.view} onChange={(v) => set({ view: v })} options={[{ value: 'table', label: T.table }, { value: 'grid', label: T.grid }, { value: 'map', label: T.map }]} />
      </div>
      <form role="search" onSubmit={search} className="max-w-xl">
        <Input
          key={f.q}
          name="q"
          type="search"
          defaultValue={f.q}
          placeholder={T.searchPh}
          aria-label={T.search}
          icon={<MagnifyingGlassIcon size={18} aria-hidden="true" />}
        />
      </form>
      {filters}
      {sorted.length ? (
        f.view === 'grid' ? (
          <div className={cx('kd-cards mt-2 transition-opacity', busy && 'opacity-60')}>
            {sorted.map((e, i) => <EventCard key={e.id} e={e} i={i} lang={lang} />)}
          </div>
        ) : (
          <div className={cx('kd-tbl -mx-4 tab:mx-0 transition-opacity', busy && 'opacity-60')} role="table" aria-label={T.title}>
            <div role="row" className="kd-tr kd-tr-head min-w-[1020px]" style={{ gridTemplateColumns: COLS }}>
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
                <Link key={e.id} role="row" href={inLang('/e/' + e.slug, lang)} className="kd-tr min-w-[1020px] hover:bg-white/[0.03]" style={{ gridTemplateColumns: COLS }}>
                  <span role="cell" className="kd-s kd-num text-mist">{whenShort(e, lang)}</span>
                  <span role="cell" className="kd-mb kd-num">{e.startTime ?? ''}</span>
                  <span role="cell" className="kd-hs flex min-w-0 items-center gap-2"><Marker family={familyOf(e.genre)} /><span className="kd-ell">{e.title}</span></span>
                  <span role="cell" className="kd-s kd-ell">{[e.venue.name, e.venue.area].filter(Boolean).join(' · ')}</span>
                  <span role="cell" className="kd-s kd-ell">{cityName(e.city)}</span>
                  <span role="cell" className={cx('kd-mb kd-num', e.isFree && 'text-acc')}>{e.isFree ? T.free : moneyShort(e.priceFrom, e.currency, lang)}</span>
                  <span role="cell" className="kd-mb kd-num text-mist">{fmtCount(e.saveCount, lang)}</span>
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
    </main>
  );
}

