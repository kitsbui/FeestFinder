'use client';
/**
 * The home page's map before MapLibre (owner, 2026-11-06: the map loads at a touch, a pointer, or once
 * the page is idle, so its script never weighs on the first seconds): the same pins, prices and
 * clusters, and the cities' names, placed where the map will put them. The frame is MapLibre's own
 * fit of the pins' bounds (Web Mercator, 40px padding, zoom 12 at most), so the map takes over in place.
 */
import { useEffect, useRef, useState } from 'react';
import { pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import { moneyShort } from '../../format';
import { familyOf } from '../../genre';
import type { Box } from '../../map/kd-map';
import type { HomeEvent } from './calendar';
import { LIST } from './copy';

/** The box around the pins; Vietnam and its neighbours when there are none. */
export function boxOf(items: { lat: number; lng: number }[]): Box {
  if (!items.length) return [102, 8, 110, 23.5];
  const lats = items.map((x) => x.lat), lngs = items.map((x) => x.lng);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

/** What a pin says: free, "see price", or the price in short. */
export function pinText(x: HomeEvent, lang: Lang): string {
  const T = pick(LIST, lang);
  return x.isFree ? T.free : x.priceUnknown ? T.seePrice : moneyShort(x.priceFrom, x.currency, lang);
}

/** Web Mercator, the world as a unit square. */
const mx = (lng: number) => (lng + 180) / 360;
const my = (lat: number) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2;

/** MapLibre's fitBounds: the scale (px per world) and the centre that fit `box` in w × h. */
export function frame(box: Box, w: number, h: number, pad = 40, maxZoom = 12) {
  const [x0, x1, y0, y1] = [mx(box[0]), mx(box[2]), my(box[3]), my(box[1])];
  const fit = Math.min((w - 2 * pad) / Math.max(x1 - x0, 1e-9), (h - 2 * pad) / Math.max(y1 - y0, 1e-9));
  const scale = Math.max(512, Math.min(fit, 512 * 2 ** maxZoom));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return (lng: number, lat: number) => [w / 2 + (mx(lng) - cx) * scale, h / 2 + (my(lat) - cy) * scale] as const;
}

type Dot = { x: number; y: number; items: HomeEvent[] };

export function MapBoard({ lang, events, places }: { lang: Lang; events: HomeEvent[]; places: { name: string; at: [number, number] }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dots: Dot[] = [];
  let names: { name: string; x: number; y: number }[] = [];
  if (size) {
    const at = frame(boxOf(events), size.w, size.h);
    // MapLibre's clusters gather pins within 52px.
    for (const e of events) {
      const [x, y] = at(e.lng, e.lat);
      const near = dots.find((d) => Math.hypot(d.x - x, d.y - y) < 52);
      if (near) near.items.push(e);
      else dots.push({ x, y, items: [e] });
    }
    names = places.map((p) => { const [x, y] = at(p.at[0], p.at[1]); return { name: p.name, x, y }; })
      .filter((p) => p.x > 0 && p.x < size.w && p.y > 0 && p.y < size.h);
  }

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {names.map((p) => <span key={p.name} className="kd-area absolute -translate-x-1/2 translate-y-3" style={{ left: p.x, top: p.y }}>{p.name}</span>)}
      {dots.map((d) => (
        <span key={d.items[0].id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: d.x, top: d.y }}>
          {d.items.length > 1 ? (
            <span className="kd-mb kd-num grid size-9 place-items-center rounded-full bg-surface-0/70 ring-1 ring-line-2">{d.items.length}</span>
          ) : (
            <span className={cx('kd-ppin', `kd-g-${familyOf(d.items[0].genre)}`, d.items[0].approx && 'kd-ppin-approx')}>
              <span className="kd-mk" />{pinText(d.items[0], lang)}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
