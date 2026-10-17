'use client';
/**
 * The home page's list (Sự kiện in the nav): every upcoming event by day (the grid, the default
 * since design v2 phase 2: days.tsx), as a table (the advanced view) or on a map, by city, time,
 * kind of night and music style, price, source and text (the nav's search). The views share one
 * title, one view switch and one sticky row of filters (a "Lọc" sheet on a phone), so a choice
 * made in one view is there, and visible, in the others. The address carries the choices with
 * the legacy names (city, genre, time, style, type, view, bbox, q) so old links and the
 * /vi/… and /en/… redirects keep landing on the right list. The list re-reads itself every
 * minute while it is open.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { ArrowDownIcon, ArrowUpIcon, FunnelSimpleIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../../copy';
import { cx } from '../../cx';
import { moneyShort, todayIn, whenShort, count as fmtCount } from '../../format';
import { FAMILY_LABEL, familyOf, type Family } from '../../genre';
import { KdLink as Link, inLang } from '../../link';
import { useKd } from '../../runtime';
import { Button, Chip } from '../../ui/actions';
import { Segmented } from '../../ui/forms';
import { Menu, MenuItem, MenuSeparator, Picker } from '../../ui/menu';
import { Card as Panel, Marker, Status, type StatusTone } from '../../ui/parts';
import type { Card } from '../../types';
import { ORIGIN, RadarTag, type Origin } from '../../ui/origin';
import { Sheet } from '../../ui/sheet';
import { DayGrid, ListRail, groupByDay } from './days';
import { LIST } from './copy';
import { warmKdMap, type Box } from '../../map/kd-map';
import { MapView } from './map-view';
import { shrinkable } from '../../ui/shell';

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
  /** Posted, or found by Feest Radar; null is both. */
  origin: Origin | null;
}

const TIMES: Time[] = ['all', 'tonight', 'weekend', '7days', 'month'];
/** The kinds of night and music styles the list offers as one picker (the legacy chips). */
const TYPE_CHIPS = ['club', 'festival', 'concert'];
const STYLE_CHIPS = ['techno', 'hard-techno', 'house', 'trance', 'psytrance', 'drum-and-bass', 'hardstyle', 'bass'];

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
  if (lang === 'en') q.set('lang', 'en');
  const s = q.toString();
  return '/' + (s ? '?' + s : '');
}

interface Page { items: Card[]; total: number; nextCursor: string | null; facets: { city: Record<string, number>; origin?: { posted: number; radar: number } } }

export function ListBrowser({ lang, meta, initial, highlight }: { lang: Lang; meta: Meta; initial: Page; highlight?: ReactNode }) {
  const T = pick(LIST, lang);
  const [f, setF] = useState<Filters>(DEFAULT);
  const [page, setPage] = useState<Page>(initial);
  const [rows, setRows] = useState<Card[]>(initial.items);
  const [busy, setBusy] = useState(false);
  const [sort, setSort] = useState<{ by: 'date' | 'price' | 'hype'; desc: boolean }>({ by: 'date', desc: false });
  const [at, setAt] = useState<Date | null>(null);
  const [ready, setReady] = useState(false);
  const [sheet, setSheet] = useState(false);
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
    setPage(out);
    setRows(out.items);
  }, []);

  // The address decides; then the list asks the API.
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const next = readFilters(q, meta);
    setF(next);
    setReady(true);
    const same = JSON.stringify({ ...next, view: 'grid', bbox: null }) === JSON.stringify({ ...DEFAULT });
    if (!same || next.view === 'map') void load(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When it was read, by the API's clock (it is pinned in the tests).
  const { clockReady } = useKd();
  useEffect(() => { if (clockReady) setAt(FF.now()); }, [clockReady]);

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
    const key = { date: (e: Card) => (e.startsAt ? Date.parse(e.startsAt) : 0), price: (e: Card) => (e.isFree ? 0 : e.priceFrom), hype: (e: Card) => e.saveCount }[sort.by];
    return [...rows].filter((e) => !e.past).sort((a, b) => (key(a) - key(b)) * (sort.desc ? -1 : 1));
  }, [rows, sort]);

  const cityCounts = page.facets?.city ?? {};
  const allCount = Object.values(cityCounts).reduce((n, x) => n + x, 0);
  const cityName = (slug: string) => meta.cities.find((c) => c.slug === slug)?.name[lang] ?? '';
  const timeLabel = (t: Time) => timeName(T, t);
  const kindLabel = f.type ? meta.eventTypes.find((x) => x.key === f.type)?.label[lang] : f.style ? meta.styles.find((x) => x.key === f.style)?.label[lang] : null;
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
      onChange={(v) => set({ city: v })}
      options={[{ value: 'all', label: T.allCities, aside: allCount }, ...meta.cities.map((c) => ({ value: c.slug, label: c.name[lang], aside: cityCounts[c.slug] ?? 0 }))]}
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
        <MenuItem key={k} checked={f.type === k} onSelect={() => set({ type: f.type === k ? null : k })}>{meta.eventTypes.find((x) => x.key === k)?.label[lang] ?? k}</MenuItem>
      ))}
      <MenuSeparator />
      {STYLE_CHIPS.map((k) => (
        <MenuItem key={k} checked={f.style === k} onSelect={() => set({ style: f.style === k ? null : k })}>{meta.styles.find((x) => x.key === k)?.label[lang] ?? k}</MenuItem>
      ))}
    </Menu>
  );
  const freeChip = <Chip family="free" on={f.family === 'free'} onClick={() => set({ family: f.family === 'free' ? null : 'free', genre: null })}>{FAMILY_LABEL.free[lang]}</Chip>;
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
  const filters = (extra?: ReactNode) => (
    <div className="flex flex-wrap items-center gap-2">
      {cityPicker}{timePicker}{kindMenu}{freeChip}{sourcePicker}{queryChip}{extra}{clearButton}
    </div>
  );
  const active = [f.city !== 'all', f.time !== 'all', !!(f.type || f.style), f.family === 'free', !!f.origin, !!f.q].filter(Boolean).length;

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
    if (e.festival?.flagship && e.festival.label) return { tone: 'live', text: e.festival.label[lang] };
    const today = at ? new Intl.DateTimeFormat('en-CA', { timeZone: e.timezone || 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(at) : null;
    if (today && e.startsOn && e.startsOn <= today && (e.endsOn ?? e.startsOn) >= today) return { tone: 'live', text: T.stTonight };
    if (e.badge) return { tone: 'warn', text: e.badge.label[lang] };
    if (e.isFree) return { tone: 'ok', text: T.stFree };
    return { tone: 'none', text: T.stOn };
  };
  const COLS = '120px 64px minmax(200px,2fr) minmax(160px,1.4fr) 120px 120px 96px 132px';

  const heading = [f.time !== 'all' ? timeLabel(f.time) : T.title, f.city !== 'all' ? cityName(f.city) : null].filter(Boolean).join(' · ');
  const today = at ? todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone, at) : null;
  const groups = f.view === 'grid' ? groupByDay(sorted, lang, today) : [];

  return (
    <>
      {/* The sticky bar: every filter on a computer; on a phone "Lọc" (a sheet with all of them) and the two used most. */}
      <div className="kd-cmd">
        <div className="kd-wrap flex min-h-14 items-center gap-2 py-2">
          <div role="group" aria-label={T.filtersBar} className="flex min-w-0 flex-wrap items-center gap-2 max-tab:hidden">
            {cityPicker}{timePicker}{kindMenu}{freeChip}{sourcePicker}{queryChip}{clearButton}
          </div>
          <div className="flex min-w-0 items-center gap-2 tab:hidden">
            <button type="button" className={cx('kd-chip', active && 'kd-chip-on')} aria-haspopup="dialog" onClick={() => setSheet(true)}>
              <FunnelSimpleIcon size={16} aria-hidden="true" />{T.filters}{active ? <span className="kd-num">{active}</span> : null}
            </button>
            {timePicker}{kindMenu}
          </div>
          {/* Pointing at the switch starts loading the map, so "Bản đồ" opens at once. On a phone the tab bar has the map. */}
          <div className="ml-auto max-tab:hidden" onPointerOver={warmKdMap} onFocus={warmKdMap}>{viewSwitch()}</div>
        </div>
      </div>
      <main className="kd-wrap flex flex-col gap-6 pb-8 pt-6" onClickCapture={openCard}>
        <h1 className="kd-d2">{heading}</h1>
        {/* The world's biggest festivals, always first, while nothing narrows the list. */}
        {highlight && JSON.stringify({ ...f, view: 'grid', bbox: null }) === JSON.stringify(DEFAULT) ? highlight : null}
        {sorted.length ? (
          f.view === 'grid' ? (
            <div className="flex items-start gap-10">
              <DayGrid groups={groups} lang={lang} className={cx('min-w-0 flex-1 transition-opacity', busy && 'opacity-60')} />
              <ListRail
                lang={lang}
                items={sorted}
                today={today}
                cities={meta.cities.map((c) => ({ slug: c.slug, name: c.name[lang], center: c.center, count: cityCounts[c.slug] ?? 0 }))}
                onCity={(slug) => set({ city: slug })}
                onMap={() => set({ view: 'map' })}
              />
            </div>
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
                    <span role="cell" className={cx('kd-mb kd-num', e.isFree && 'text-info')}>{e.isFree ? T.free : moneyShort(e.priceFrom, e.currency, lang)}</span>
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
      </main>
      {sheet ? (
        <FilterSheet
          lang={lang}
          meta={meta}
          f={f}
          counts={cityCounts}
          origins={origins}
          onChange={set}
          onClear={clear}
          onClose={() => setSheet(false)}
        />
      ) : null}
    </>
  );
}

/** "Lọc" on a phone: every filter as chips, applied at once; "Xem sự kiện" closes it. */
function FilterSheet({ lang, meta, f, counts, origins, onChange, onClear, onClose }: {
  lang: Lang; meta: Meta; f: Filters; counts: Record<string, number>; origins: { posted: number; radar: number } | null;
  onChange: (patch: Partial<Filters>) => void; onClear: () => void; onClose: () => void;
}) {
  const T = pick(LIST, lang);
  const O = pick(ORIGIN, lang);
  const group = (label: string, chips: ReactNode) => (
    <div role="group" aria-label={label} className="flex flex-col gap-2.5">
      <h3 className="kd-m">{label}</h3>
      <div className="flex flex-wrap gap-2">{chips}</div>
    </div>
  );
  return (
    <Sheet title={T.filtersBar} closeLabel={T.close} onClose={onClose}>
      <div className="flex flex-col gap-5 pt-1">
        {group(T.city, [
          <Chip key="all" on={f.city === 'all'} onClick={() => onChange({ city: 'all' })}>{T.allCities}</Chip>,
          ...meta.cities.filter((c) => counts[c.slug] || f.city === c.slug).map((c) => (
            <Chip key={c.slug} on={f.city === c.slug} count={counts[c.slug] ?? 0} onClick={() => onChange({ city: c.slug })}>{c.name[lang]}</Chip>
          )),
        ])}
        {group(T.when, TIMES.map((t) => <Chip key={t} on={f.time === t} onClick={() => onChange({ time: t })}>{timeName(T, t)}</Chip>))}
        {group(T.kind, [
          <Chip key="any" on={!f.type && !f.style} onClick={() => onChange({ type: null, style: null })}>{T.anyKind}</Chip>,
          ...TYPE_CHIPS.map((k) => <Chip key={k} on={f.type === k} onClick={() => onChange({ type: f.type === k ? null : k, style: null })}>{meta.eventTypes.find((x) => x.key === k)?.label[lang] ?? k}</Chip>),
          ...STYLE_CHIPS.map((k) => <Chip key={k} on={f.style === k} onClick={() => onChange({ style: f.style === k ? null : k, type: null })}>{meta.styles.find((x) => x.key === k)?.label[lang] ?? k}</Chip>),
        ])}
        {group(T.price, [
          <Chip key="any" on={f.family !== 'free'} onClick={() => onChange({ family: null })}>{T.anyPrice}</Chip>,
          <Chip key="free" family="free" on={f.family === 'free'} onClick={() => onChange({ family: 'free', genre: null })}>{FAMILY_LABEL.free[lang]}</Chip>,
        ])}
        {group(T.source, [
          <Chip key="all" on={!f.origin} count={origins ? origins.posted + origins.radar : null} onClick={() => onChange({ origin: null })}>{T.anySource}</Chip>,
          <Chip key="posted" on={f.origin === 'posted'} count={origins?.posted ?? null} onClick={() => onChange({ origin: 'posted' })}>{O.posted}</Chip>,
          <Chip key="radar" on={f.origin === 'radar'} count={origins?.radar ?? null} onClick={() => onChange({ origin: 'radar' })}>{O.radar}</Chip>,
        ])}
        <div className="flex gap-2 pt-1">
          <Button onClick={onClear}>{T.clear}</Button>
          <Button tone="acc" className="flex-1" onClick={onClose}>{T.done}</Button>
        </div>
      </div>
    </Sheet>
  );
}
