'use client';
/**
 * /list?view=map (design/Web-Map): the list column (place search, time, Miễn phí, Dưới 5 km,
 * rows nearest first) and the map (glass pins, zoom, my location, the chosen event's card).
 * Selecting a row or a pin selects both. The map asks /events/map when it opens and when
 * someone presses "Tìm trong khu vực này", never on a pan (CLAUDE.md).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CrosshairIcon, MagnifyingGlassIcon, MinusIcon, PlusIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../../copy';
import { cx } from '../../cx';
import { km, money, moneyShort, whenShort } from '../../format';
import { familyOf, g } from '../../genre';
import { KdLink as Link, inLang } from '../../link';
import { createKdMap, type Box, type KdMap } from '../../map/kd-map';
import { useKd } from '../../runtime';
import { buttonClass, Button, Chip, IconButton } from '../../ui/actions';
import { Input } from '../../ui/forms';
import { Picker } from '../../ui/menu';
import { Art } from '../../ui/parts';
import { apiQuery, type Filters, type Meta, type Time } from './browser';
import { LIST } from './copy';

interface MapItem {
  id: string; slug: string; title: string; genre: string | null; lat: number; lng: number; venue: string | null; area: string | null;
  city: string; cityLabel: Pair; startsOn: string; endsOn: string | null; startTime: string | null; coverUrl: string | null;
  priceFrom: number; currency: string; isFree: boolean; soldOut: boolean;
}

/** All the listed cities, when no city is chosen. */
function boxOfCities(meta: Meta): Box {
  const bs = meta.cities.map((c) => c.bbox).filter(Boolean) as Box[];
  if (!bs.length) return [102, 8, 110, 23.5];
  return [Math.min(...bs.map((b) => b[0])), Math.min(...bs.map((b) => b[1])), Math.max(...bs.map((b) => b[2])), Math.max(...bs.map((b) => b[3]))];
}

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function MapView({ lang, meta, filters: f, onFilters, onBbox, viewSwitch }: {
  lang: Lang; meta: Meta; filters: Filters; onFilters: (p: Partial<Filters>) => void; onBbox: (b: Box) => void; viewSwitch: ReactNode;
}) {
  const T = pick(LIST, lang);
  const kd = useKd();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<KdMap | null>(null);
  const seq = useRef(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [items, setItems] = useState<MapItem[]>([]);
  const [total, setTotal] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [place, setPlace] = useState('');
  const [near, setNear] = useState(false);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [timeCounts, setTimeCounts] = useState<Record<string, number> | null>(null);
  const fRef = useRef(f);
  fRef.current = f;

  const cityBox = useCallback((slug: string): Box => meta.cities.find((c) => c.slug === slug)?.bbox ?? boxOfCities(meta), [meta]);

  const search = useCallback(async (box?: Box) => {
    const m = map.current;
    if (!m) return;
    const bbox = box ?? m.bounds();
    const n = ++seq.current;
    setBusy(true); setDirty(false);
    const q = apiQuery(fRef.current, { city: false });
    if (fRef.current.time === 'all') q.delete('time');
    q.set('bbox', bbox.join(','));
    q.set('limit', '500');
    const out = await FF.maybe(FF.get('/events/map?' + q), null);
    if (n !== seq.current) return;
    setBusy(false);
    if (!out) return;
    setItems(out.items);
    setTotal(out.total);
    setTruncated(out.truncated);
    onBbox(bbox);
    m.setEvents(out.items.map((x: MapItem) => ({
      id: x.id, lat: x.lat, lng: x.lng, family: familyOf(x.genre),
      label: x.isFree ? T.free : moneyShort(x.priceFrom, x.currency, lang), title: x.title,
    })));
    setSel((s) => (s && out.items.some((x: MapItem) => x.id === s) ? s : null));
  }, [lang, onBbox, T.free]);

  // The map, once.
  useEffect(() => {
    if (!el.current) return;
    let dead = false;
    const start = f.bbox ?? cityBox(f.city);
    createKdMap(el.current, {
      bounds: start,
      pinLabel: (p) => (p.title ?? '') + ', ' + p.label,
      onSelect: (id) => setSel(id),
      onMove: () => setDirty(true),
    }).then(async (m) => {
      if (dead) { m.destroy(); return; }
      map.current = m;
      await m.ready;
      setReady(true);
      search(start);
    }).catch(() => setFailed(true));
    return () => { dead = true; map.current?.destroy(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // New filters: the same area again. A new city: that city.
  const prev = useRef(f);
  useEffect(() => {
    const p = prev.current;
    prev.current = f;
    if (!ready || !map.current) return;
    if (p.city !== f.city) {
      const box = cityBox(f.city);
      map.current.fit(box, false);
      search(box);
    } else if (p.time !== f.time || p.family !== f.family || p.genre !== f.genre || p.style !== f.style || p.type !== f.type || p.q !== f.q) {
      search();
    }
  }, [f, ready, cityBox, search]);

  // How many each time choice holds, for the time menu.
  useEffect(() => {
    const q = apiQuery({ ...f, time: 'all' });
    q.set('limit', '1');
    q.set('upcoming', 'true');
    FF.maybe(FF.get('/events?' + q), null).then((out: any) => out?.facets?.time && setTimeCounts(out.facets.time));
  }, [f]);

  useEffect(() => { map.current?.select(sel); }, [sel]);

  const centre = useMemo(() => {
    if (me) return me;
    const c = meta.cities.find((x) => x.slug === f.city)?.center;
    return c ? { lng: c[0], lat: c[1] } : null;
  }, [me, meta, f.city]);
  const rows = useMemo(() => {
    const text = place.trim().toLowerCase();
    return items
      .map((x) => ({ ...x, d: centre ? haversine(centre, x) : null }))
      .filter((x) => !text || [x.title, x.venue, x.area].some((v) => (v ?? '').toLowerCase().includes(text)))
      .filter((x) => !near || (x.d != null && x.d <= 5))
      .sort((a, b) => (a.d ?? 1e9) - (b.d ?? 1e9));
  }, [items, place, near, centre]);
  const chosen = rows.find((x) => x.id === sel) ?? items.find((x) => x.id === sel) ?? null;

  const locate = () => {
    if (!navigator.geolocation) { kd.toast(T.locateFail); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const at = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMe(at);
        map.current?.setMe(at);
        map.current?.flyTo(at, 13);
        setDirty(true);
      },
      () => kd.toast(T.locateFail),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };
  const timeLabel = (t: Time) => ({ all: T.anyTime, tonight: T.tonight, weekend: T.weekend, '7days': T.next7, month: T.month })[t];
  const note = failed ? T.mapFailed : truncated ? fill(T.mapMore, { n: items.length, t: total }) : ready && !busy && !items.length ? T.mapEmpty : '';
  const reset = () => { setPlace(''); setNear(false); onFilters({ time: 'all', family: null, genre: null, style: null, type: null, q: '' }); };

  return (
    <main className="flex min-h-[calc(100dvh-64px)] flex-wrap desk:h-[calc(100dvh-64px)]">
      <aside className="flex max-h-full min-w-0 flex-[1_1_340px] flex-col overflow-y-auto border-line desk:border-r">
        <div className="flex flex-col gap-3 px-4 pb-2.5 pt-4.5">
          <div className="flex items-center justify-between gap-3">
            <h1 className="kd-h">{T.map}</h1>
            {viewSwitch}
          </div>
          <Input
            type="search"
            placeholder={T.placePh}
            aria-label={T.place}
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            icon={<MagnifyingGlassIcon size={18} aria-hidden="true" />}
          />
          <div className="relative z-[27] flex flex-wrap items-center gap-1.5">
            <Picker
              label={T.when}
              value={f.time}
              onChange={(v) => onFilters({ time: v })}
              display={timeLabel(f.time)}
              options={(['all', 'tonight', 'weekend', '7days', 'month'] as Time[]).map((t) => ({ value: t, label: timeLabel(t), aside: t === 'all' ? null : timeCounts?.[t] ?? null }))}
            />
            <Chip family="free" on={f.family === 'free'} onClick={() => onFilters({ family: f.family === 'free' ? null : 'free', genre: null })}>{T.free}</Chip>
            <Chip on={near} onClick={() => setNear((x) => !x)}>{T.within5}</Chip>
          </div>
          <span className="kd-m kd-num" aria-live="polite">{fill(T.nearest, { n: rows.length })}</span>
        </div>
        <div className="flex flex-col gap-0.5 px-2 pb-4">
          {rows.map((x, i) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={x.id === sel}
              onClick={() => setSel(x.id)}
              className={cx(
                'grid min-h-16 grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 rounded-opt border-0 bg-transparent px-2 py-2 text-left transition-colors duration-150 hover:bg-white/[0.04]',
                x.id === sel && 'bg-white/[0.06] shadow-[inset_0_0_0_1px_var(--color-line2)]',
                g(familyOf(x.genre)),
              )}
            >
              <Art family={familyOf(x.genre)} cover={x.coverUrl} bone={i % 2 === 1} off={x.soldOut} className="h-12 w-12 rounded-seg" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="kd-hs kd-ell">{x.title}</span>
                <span className="kd-s flex min-w-0 items-center gap-1.5"><span className="kd-mk" aria-hidden="true" /><span className="kd-ell">{whenShort(x, lang)}{x.area ? ' · ' + x.area : ''}</span></span>
              </span>
              <span className="flex flex-col items-end gap-0.5">
                {x.d != null ? <span className="kd-mb kd-num text-xs">{km(x.d, lang)}</span> : null}
                <span className={cx('kd-m', x.isFree && 'text-acc')}>{x.isFree ? T.free : moneyShort(x.priceFrom, x.currency, lang)}</span>
              </span>
            </button>
          ))}
          {ready && !busy && !rows.length ? (
            <div className="flex flex-col items-start gap-2.5 px-2 py-6">
              <span className="kd-hs">{T.empty}</span>
              <Button size="sm" onClick={reset}>{T.clear}</Button>
            </div>
          ) : null}
        </div>
      </aside>

      <section aria-label={T.mapLabel} className="relative min-h-[480px] min-w-0 flex-[999_1_560px] overflow-hidden bg-[#0b0c0d]">
        {/* MapLibre makes its container position: relative, so the box is a wrapper. */}
        <div className="absolute inset-0"><div ref={el} className="h-full w-full" data-kd-map /></div>
        <div className="absolute right-4 top-4 z-[2] flex flex-col gap-1.5">
          <IconButton label={T.zoomIn} glass className="text-paper" onClick={() => map.current?.zoom(1)}><PlusIcon size={18} aria-hidden="true" /></IconButton>
          <IconButton label={T.zoomOut} glass className="text-paper" onClick={() => map.current?.zoom(-1)}><MinusIcon size={18} aria-hidden="true" /></IconButton>
          <IconButton label={T.locate} glass className="mt-1.5 text-paper" onClick={locate}><CrosshairIcon size={18} aria-hidden="true" /></IconButton>
        </div>
        {dirty && ready && !busy ? (
          <button type="button" className="kd-btn kd-btn-sm kd-btn-glass kd-btn-pill absolute left-1/2 top-4 z-[2] -translate-x-1/2" onClick={() => search()}>
            <MagnifyingGlassIcon size={16} aria-hidden="true" />{T.mapSearch}
          </button>
        ) : null}
        {note ? <span role="status" className="kd-tag kd-tag-glass absolute bottom-4 right-4 z-[2] text-paper">{note}</span> : null}
        {chosen ? (
          <div className={cx('kd-glass absolute bottom-4 left-4 z-[3] grid w-[min(380px,calc(100%-32px))] grid-cols-[76px_minmax(0,1fr)] items-center gap-3 rounded-org p-3', g(familyOf(chosen.genre)))}>
            <Art family={familyOf(chosen.genre)} cover={chosen.coverUrl} className="h-[76px] w-[76px] rounded-seg" />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="flex items-start gap-2">
                <span className="kd-hs kd-ell flex-1">{chosen.title}</span>
                <button type="button" className="-mr-1 -mt-1 text-fog hover:text-paper" aria-label={T.close} onClick={() => setSel(null)}><XIcon size={16} aria-hidden="true" /></button>
              </span>
              <span className="kd-s kd-ell text-mist">{whenShort(chosen, lang)}{chosen.venue ? ' · ' + chosen.venue : ''}</span>
              <span className="mt-0.5 flex items-center justify-between gap-2">
                <span className={cx('kd-mb kd-num', chosen.isFree && 'text-acc')}>{chosen.isFree ? T.free : fill(T.fromPrice, { p: money(chosen.priceFrom, chosen.currency, lang) })}</span>
                <Link href={inLang('/e/' + chosen.slug, lang)} className={buttonClass({ size: 'sm' })}>{T.details}</Link>
              </span>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
