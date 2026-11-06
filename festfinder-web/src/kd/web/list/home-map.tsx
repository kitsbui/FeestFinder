'use client';
/**
 * The home page's map (owner, 2026-11-06): every night it is given, framed on where they are (two
 * nights in Japan and Australia show half the world, nights in Vietnam alone show Vietnam). One finger
 * and the wheel scroll the page past it. A pin opens the night's card over the map. It takes over from
 * the board (./map-board.tsx) once drawn (`onReady`).
 */
import { useEffect, useRef, useState } from 'react';
import { XIcon } from '@phosphor-icons/react/ssr';
import { pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import { timeRange, whenShort } from '../../format';
import { familyOf, g } from '../../genre';
import { inLang } from '../../link';
import { createKdMap, type KdMap, type Pin } from '../../map/kd-map';
import { IconButton, LinkButton } from '../../ui/actions';
import { Art } from '../../ui/parts';
import { square } from '../../img';
import { priceLine } from '../price';
import type { HomeEvent } from './calendar';
import { LIST } from './copy';
import { boxOf, pinText } from './map-board';

export function HomeMap({ lang, events, places, onReady }: {
  lang: Lang; events: HomeEvent[]; places: { name: string; at: [number, number] }[]; onReady: () => void;
}) {
  const T = pick(LIST, lang);
  const el = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<KdMap | null>(null);
  const [failed, setFailed] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const first = useRef({ events, places });

  useEffect(() => {
    const T = pick(LIST, lang);
    let dead = false, made: KdMap | null = null;
    createKdMap(el.current!, {
      bounds: boxOf(first.current.events),
      fitMaxZoom: 12,
      cooperative: { windows: T.gestureWin, mac: T.gestureMac, mobile: T.gestureTouch },
      zoomLabels: { in: T.zoomIn, out: T.zoomOut },
      // The name starts with what the pin shows (its price), then says whose it is.
      pinLabel: (p) => `${p.label}, ${p.title ?? ''}`,
      places: first.current.places,
      onSelect: setSel,
    }).then(async (m) => {
      made = m;
      if (dead) return m.destroy();
      await m.ready;
      if (!dead) setMap(m);
    }, () => setFailed(true));
    return () => { dead = true; made?.destroy(); };
  }, [lang]);

  // The pins, and the frame whenever the nights change (a search from the address).
  useEffect(() => {
    if (!map) return;
    map.setEvents(events.map((x): Pin => ({ id: x.id, lat: x.lat, lng: x.lng, family: familyOf(x.genre), title: x.title, approx: x.approx, label: pinText(x, lang) })));
    if (events !== first.current.events) map.fit(boxOf(events));
    onReady();
  }, [map, events, lang, onReady]);

  useEffect(() => { map?.select(sel); }, [map, sel]);

  const chosen = events.find((e) => e.id === sel) ?? null;
  return (
    <>
      {/* MapLibre makes its container `position: relative`: the box that fills the section is around it. */}
      <div className="absolute inset-0"><div ref={el} className="size-full" /></div>
      {failed ? <p className="kd-s absolute inset-0 grid place-items-center">{T.mapFailed}</p> : null}
      {chosen ? (
        <div className={cx('kd-glass absolute bottom-4 left-4 z-[3] grid w-[min(380px,calc(100%-32px))] grid-cols-[76px_minmax(0,1fr)] items-center gap-3 rounded-org p-3', g(familyOf(chosen.genre)))}>
          <Art family={familyOf(chosen.genre)} cover={chosen.coverUrl} title={chosen.title} fit={square(76)} className="h-19 w-19 rounded-seg" />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="flex items-start gap-2">
              <span className="kd-hs kd-ell flex-1">{chosen.title}</span>
              <IconButton label={T.close} size="sm" className="-mr-1 -mt-1" onClick={() => setSel(null)}><XIcon size={16} aria-hidden="true" /></IconButton>
            </span>
            <span className="kd-s kd-ell text-fg-2">{[whenShort(chosen, lang), timeRange(chosen), chosen.venue].filter(Boolean).join(' · ')}</span>
            <span className="mt-0.5 flex items-center justify-between gap-2">
              <span className={cx('kd-mb kd-num', chosen.isFree && 'text-info')}>{priceLine({ ...chosen, entryMode: chosen.isFree ? 'free' : 'paid' }, lang)}</span>
              <LinkButton size="sm" href={inLang('/e/' + chosen.slug, lang)}>{T.details}</LinkButton>
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
}
