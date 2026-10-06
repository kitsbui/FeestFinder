'use client';
/**
 * /app/list in Kính đêm (design/App-Map): the map of the chosen city with a glass place search
 * and chips over it, glass price pins, "Về vị trí của tôi", and the chosen event's glass card.
 * It asks /events/map when it opens and on "Tìm trong khu vực này" only, never on pan
 * (CLAUDE.md). "Danh sách" shows the same events as rows; a search (?q=) opens on the rows.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CaretRightIcon, CrosshairIcon, ListIcon, MagnifyingGlassIcon, MapTrifoldIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { cx } from '../cx';
import { km, money, moneyShort, whenShort } from '../format';
import { FAMILY_LABEL, familyOf, g, type Family } from '../genre';
import { KdLink as Link } from '../link';
import { createKdMap, type Box, type KdMap } from '../map/kd-map';
import { useKd } from '../runtime';
import { Button, Chip, IconButton } from '../ui/actions';
import { Art, Marker } from '../ui/parts';
import { APP } from './copy';
import { useCity, useDiscovery, type City } from './explore';
import { distanceKm, place } from './place';

interface MapItem {
  id: string; slug: string; title: string; genre: string | null; lat: number; lng: number; venue: string | null; area: string | null;
  city: string; cityLabel: Pair; startsOn: string; endsOn: string | null; startTime: string | null; coverUrl: string | null;
  priceFrom: number; currency: string; isFree: boolean; soldOut: boolean;
}
type Time = 'all' | 'tonight' | 'weekend' | '7days';
const FAMILIES: Family[] = ['fest', 'live', 'edm', 'cult', 'free'];

function boxOf(cities: City[], slug: string | null): Box {
  const c = cities.find((x) => x.slug === slug);
  if (c?.bbox) return c.bbox;
  const bs = cities.map((x) => x.bbox).filter(Boolean) as Box[];
  return bs.length ? [Math.min(...bs.map((b) => b[0])), Math.min(...bs.map((b) => b[1])), Math.max(...bs.map((b) => b[2])), Math.max(...bs.map((b) => b[3]))] : [102, 8, 110, 23.5];
}

export function AppMap({ lang }: { lang: Lang }) {
  const meta = useDiscovery();
  const [city] = useCity(meta);
  if (!meta || !city) return <div className="kd-skel absolute inset-0 rounded-none" aria-hidden="true" />;
  return <MapBody lang={lang} cities={meta.cities} city={city} />;
}

function MapBody({ lang, cities, city }: { lang: Lang; cities: City[]; city: string }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<KdMap | null>(null);
  const seq = useRef(0);
  const [q] = useState(() => new URLSearchParams(location.search).get('q')?.trim() ?? '');
  const [view, setView] = useState<'map' | 'list'>(() => (new URLSearchParams(location.search).get('q') ? 'list' : 'map'));
  const [time, setTime] = useState<Time>('all');
  const [family, setFamily] = useState<Family | null>(null);
  const [items, setItems] = useState<MapItem[]>([]);
  const [total, setTotal] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const filters = useRef({ time, family });
  filters.current = { time, family };

  const search = useCallback(async (box?: Box) => {
    const m = map.current;
    if (!m) return;
    const bbox = box ?? m.bounds();
    const n = ++seq.current;
    setBusy(true); setDirty(false);
    const p = new URLSearchParams({ bbox: bbox.join(','), limit: '500' });
    const f = filters.current;
    if (f.time !== 'all') p.set('time', f.time);
    if (f.family === 'free') p.set('price', 'free');
    else if (f.family) p.set('family', f.family);
    if (q) p.set('q', q);
    const out = await FF.maybe(FF.get('/events/map?' + p), null);
    if (n !== seq.current) return;
    setBusy(false);
    if (!out) return;
    setItems(out.items);
    setTotal(out.total);
    setTruncated(out.truncated);
    m.setEvents(out.items.map((x: MapItem) => ({ id: x.id, lat: x.lat, lng: x.lng, family: familyOf(x.genre), label: x.isFree ? T.free : moneyShort(x.priceFrom, x.currency, lang), title: x.title })));
    setSel((s) => (s && out.items.some((x: MapItem) => x.id === s) ? s : null));
  }, [q, lang, T.free]);

  // The map, once; its first search is the city's box.
  useEffect(() => {
    if (!el.current) return;
    let dead = false;
    const start = boxOf(cities, city);
    const at = place.at();
    if (at) setMe(at);
    createKdMap(el.current, {
      bounds: start,
      pinLabel: (p) => (p.title ?? '') + ', ' + p.label,
      onSelect: (id) => setSel(id),
      onMove: () => setDirty(true),
    }).then(async (m) => {
      if (dead) { m.destroy(); return; }
      map.current = m;
      await m.ready;
      if (at) m.setMe(at);
      setReady(true);
      search(start);
    }).catch(() => setFailed(true));
    return () => { dead = true; map.current?.destroy(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A new chip: the same area again (the first search is the map's own, above).
  const asked = useRef({ time, family });
  useEffect(() => {
    if (!ready || (asked.current.time === time && asked.current.family === family)) return;
    asked.current = { time, family };
    search();
  }, [time, family, ready, search]);

  useEffect(() => { map.current?.select(sel); }, [sel]);
  // Back from the rows, the map takes its size again.
  useEffect(() => { if (view === 'map') map.current?.resize(); }, [view]);

  const locate = () => {
    if (!navigator.geolocation) { kd.toast(T.locateFail); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const at = { lat: p.coords.latitude, lng: p.coords.longitude };
        place.setAt(at);
        setMe(at);
        map.current?.setMe(at);
        map.current?.flyTo(at, 13);
        setDirty(true);
      },
      () => kd.toast(T.locateFail),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  const rows = useMemo(() => {
    const t = text.trim().toLowerCase();
    return items
      .map((x) => ({ ...x, d: me ? distanceKm(me, x) : null }))
      .filter((x) => !t || [x.title, x.venue, x.area].some((v) => (v ?? '').toLowerCase().includes(t)))
      .sort((a, b) => (a.d ?? 1e9) - (b.d ?? 1e9));
  }, [items, text, me]);
  const chosen = rows.find((x) => x.id === sel) ?? null;
  const note = failed ? T.mapFailed : truncated ? fill(T.mapMore, { n: items.length, t: total }) : ready && !busy && !items.length ? T.mapEmpty : '';
  const timeLabel = (k: Time) => ({ all: T.anyTime, tonight: T.tonight, weekend: T.weekend, '7days': T.next7 })[k];

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0b0c0d]">
      <section aria-label={T.mapLabel} className={cx('absolute inset-0', view === 'list' && 'invisible')}>
        {/* MapLibre makes its container position: relative, so the box is a wrapper. */}
        <div className="absolute inset-0"><div ref={el} className="h-full w-full" data-kd-map /></div>
      </section>

      <div className="absolute inset-x-3 top-[calc(10px+env(safe-area-inset-top))] z-[4] flex flex-col gap-2">
        <div className="flex gap-2">
          <label className="kd-field kd-glass h-12 flex-1 rounded-opt">
            <MagnifyingGlassIcon size={18} aria-hidden="true" />
            <input type="search" placeholder={T.placePh} aria-label={T.place} value={text} onChange={(e) => setText(e.target.value)} />
            <span className="kd-m kd-num pr-2">{fill(T.nEvents, { n: rows.length })}</span>
          </label>
          <IconButton glass label={view === 'map' ? T.asList : T.asMap} className="h-12 w-12 text-paper" onClick={() => setView(view === 'map' ? 'list' : 'map')}>
            {view === 'map' ? <ListIcon size={20} aria-hidden="true" /> : <MapTrifoldIcon size={20} aria-hidden="true" />}
          </IconButton>
        </div>
        {q ? (
          <div className="flex items-center gap-2">
            <span className="kd-tag kd-tag-glass text-paper">{fill(T.results, { q })}</span>
            <a className="kd-tag kd-tag-glass text-paper" href="/app/list" aria-label={T.clearSearch}><XIcon size={12} aria-hidden="true" /></a>
          </div>
        ) : null}
        <div className="kd-hscroll" role="group" aria-label={T.genres}>
          {(['all', 'tonight', 'weekend', '7days'] as Time[]).map((k) => (
            <Chip key={k} on={time === k} className="kd-glass" onClick={() => setTime(k)}>{timeLabel(k)}</Chip>
          ))}
          {FAMILIES.map((f) => (
            <Chip key={f} family={f} on={family === f} className="kd-glass" onClick={() => setFamily(family === f ? null : f)}>{FAMILY_LABEL[f][lang]}</Chip>
          ))}
        </div>
      </div>

      {view === 'map' ? (
        <>
          {dirty && ready && !busy ? (
            <button type="button" className="kd-btn kd-btn-sm kd-btn-glass kd-btn-pill absolute left-1/2 top-[calc(126px+env(safe-area-inset-top))] z-[4] -translate-x-1/2 text-paper" onClick={() => search()}>
              <MagnifyingGlassIcon size={16} aria-hidden="true" />{T.mapSearch}
            </button>
          ) : null}
          {note ? <span role="status" className="kd-tag kd-tag-glass absolute left-3 top-[calc(126px+env(safe-area-inset-top))] z-[3] text-paper">{note}</span> : null}
          <IconButton glass label={T.locate} className={cx('absolute right-3 z-[4] text-paper', chosen ? 'bottom-[calc(214px+env(safe-area-inset-bottom))]' : 'bottom-[calc(100px+env(safe-area-inset-bottom))]')} onClick={locate}>
            <CrosshairIcon size={20} aria-hidden="true" />
          </IconButton>
          {chosen ? (
            <Link href={'/app/e/' + chosen.slug} className={cx('kd-glass absolute inset-x-3 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[4] grid grid-cols-[84px_minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] p-2.5', g(familyOf(chosen.genre)))}>
              <Art family={familyOf(chosen.genre)} cover={chosen.coverUrl} className="h-21 w-21 rounded-lg" />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="kd-m flex items-center gap-1.5 text-mist"><span className="kd-mk" aria-hidden="true" />{FAMILY_LABEL[familyOf(chosen.genre)][lang]}</span>
                <span className="kd-hs kd-ell">{chosen.title}</span>
                <span className="kd-s kd-ell text-mist">{whenShort(chosen, lang)}{chosen.d != null ? ' · ' + km(chosen.d, lang) : chosen.area ? ' · ' + chosen.area : ''}</span>
                <span className={cx('kd-mb kd-num', chosen.isFree && 'text-acc')}>{chosen.isFree ? T.free : fill(T.fromPrice, { p: money(chosen.priceFrom, chosen.currency, lang) })}</span>
              </span>
              <CaretRightIcon size={18} className="text-fog" aria-label={T.open} />
            </Link>
          ) : null}
        </>
      ) : (
        <ul className="absolute inset-x-0 bottom-0 top-[calc(120px+env(safe-area-inset-top))] z-[3] flex flex-col overflow-y-auto bg-void px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-2" aria-label={T.mapLabel}>
          {rows.map((x) => {
            const fam = familyOf(x.genre);
            return (
              <li key={x.id}>
                <Link className={cx('kd-row', g(fam))} href={'/app/e/' + x.slug}>
                  <Art family={fam} cover={x.coverUrl} off={x.soldOut} />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="kd-hs kd-ell">{x.title}</span>
                    <span className="kd-s kd-ell flex items-center gap-1.5"><Marker family={fam} />{whenShort(x, lang)}{x.area ? ' · ' + x.area : ''}</span>
                  </span>
                  <span className="flex flex-col items-end gap-0.5">
                    <span className={cx('kd-mb kd-num', x.isFree && 'text-acc')}>{x.isFree ? T.free : moneyShort(x.priceFrom, x.currency, lang)}</span>
                    {x.d != null ? <span className="kd-s kd-num">{km(x.d, lang)}</span> : null}
                  </span>
                </Link>
              </li>
            );
          })}
          {ready && !busy && !rows.length ? (
            <li className="flex flex-col items-start gap-2.5 py-6">
              <span className="kd-hs">{T.mapEmpty}</span>
              <Button size="sm" onClick={() => { setText(''); setFamily(null); setTime('all'); }}>{T.reset}</Button>
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
