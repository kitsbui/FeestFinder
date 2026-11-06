'use client';
/**
 * The home page's body (owner, 2026-11-06): the map of every night, the highlight, the calendar.
 * Nothing filters it but an address that arrives with `?q=` (the search) or `?style=` (a style's
 * link): then the API's answer for it fills the map and the calendar, the highlight steps aside and
 * one chip above the map names it; its × goes back to every night.
 */
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { XIcon } from '@phosphor-icons/react/ssr';
import dynamic from 'next/dynamic';
import { FF } from '@/runtime/ff';
import { pick, tx, type Lang, type Pair } from '../../copy';
import { Button, Chip, LinkButton } from '../../ui/actions';
import { inLang } from '../../link';
import { Calendar, type HomeEvent } from './calendar';
import { LIST } from './copy';
import { MapBoard } from './map-board';

const HomeMap = dynamic(() => import('./home-map').then((m) => m.HomeMap), { ssr: false });

const never = () => () => {};

export function Dashboard({ lang, heading, events, today, city, styles, places, highlight, siteUrl }: {
  lang: Lang; heading: string; events: HomeEvent[]; today: string; city?: string; places: { name: string; at: [number, number] }[];
  styles: { key: string; label: Pair }[]; highlight: ReactNode; siteUrl: string;
}) {
  const T = pick(LIST, lang);
  // The cached page is every visitor's; the address is read in the browser only.
  const search = useSyncExternalStore(never, () => location.search, () => '');
  const [cleared, setCleared] = useState(false);
  const [found, setFound] = useState<HomeEvent[] | 'error' | null>(null);
  const [tries, setTries] = useState(0);
  const p = new URLSearchParams(cleared ? '' : search);
  const q = p.get('q')?.trim() ?? '', style = p.get('style') ?? '';
  const asked = !!(q || style);

  useEffect(() => {
    if (!asked) return;
    const query = new URLSearchParams({ time: 'all', upcoming: 'true', limit: '500' });
    if (city) query.set('city', city);
    if (q) query.set('q', q);
    if (style) query.set('style', style);
    let live = true;
    FF.get('/events/map?' + query, { lang }).then((r: { items: HomeEvent[] }) => { if (live) setFound(r.items); }, () => { if (live) setFound('error'); });
    return () => { live = false; };
  }, [asked, q, style, city, lang, tries]);

  const clear = () => {
    const keep = new URLSearchParams(location.search);
    keep.delete('q');
    keep.delete('style');
    history.replaceState(history.state, '', location.pathname + (keep.size ? '?' + keep : ''));
    document.documentElement.removeAttribute('data-asked');
    setCleared(true);
    setFound(null);
  };

  // MapLibre at a touch, a pointer, a key or the wheel on the map, else once the page has been still
  // five seconds: its script never weighs on the page's first seconds (Lighthouse's TBT).
  const [live, setLive] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const wake = () => setLive(true);
  const ready = useCallback(() => setDrawn(true), []);
  useEffect(() => {
    if (live) return;
    let t = 0;
    const later = () => { t = window.setTimeout(() => setLive(true), 5000); };
    if (document.readyState === 'complete') later();
    else addEventListener('load', later, { once: true });
    return () => { removeEventListener('load', later); clearTimeout(t); };
  }, [live]);

  const shown = asked && Array.isArray(found) ? found : events;
  // Nothing to show, or the search's answer did not come: a title and the one thing to do.
  const note = found === 'error' ? { title: T.loadFailed, action: <Button size="sm" onClick={() => { setFound(null); setTries((n) => n + 1); }}>{T.retry}</Button> }
    : asked && Array.isArray(found) && !found.length ? { title: T.noMatch, action: <Button size="sm" onClick={clear}>{T.clear}</Button> }
    : !asked && !events.length ? { title: T.noUpcoming, action: <LinkButton size="sm" href={inLang('/studio/new', lang)}>{T.postEvent}</LinkButton> }
    : null;
  return (
    <main id="main" className="flex flex-1 flex-col">
      <h1 className="sr-only">{heading}</h1>
      <section
        aria-label={T.mapLabel}
        className="relative h-[60dvh] min-h-80 overflow-hidden bg-map tab:h-[70dvh]"
        onPointerEnter={wake} onPointerDown={wake} onTouchStart={wake} onWheel={wake} onFocus={wake}
      >
        {live ? <HomeMap lang={lang} events={shown} places={places} onReady={ready} /> : null}
        {drawn ? null : <MapBoard lang={lang} events={shown} places={places} />}
        {note ? (
          <div className="pointer-events-none absolute inset-0 z-[2] grid place-items-center p-4">
            <div className="kd-glass pointer-events-auto flex flex-col items-center gap-3 rounded-card p-5">
              <p className="kd-hs">{note.title}</p>
              {note.action}
            </div>
          </div>
        ) : null}
        {asked ? (
          <div className="absolute left-4 top-4 z-[3] max-w-[calc(100%-2rem)]">
            <Chip on className="kd-glass" onClick={clear}>
              <span className="kd-ell">{q ? `“${q}”` : tx(styles.find((s) => s.key === style)?.label, lang) ?? style}</span>
              <XIcon size={14} aria-hidden="true" />
              <span className="sr-only">{T.clear}</span>
            </Chip>
          </div>
        ) : null}
      </section>
      {asked ? null : highlight}
      <Calendar lang={lang} events={shown} today={today} city={city} siteUrl={siteUrl} />
    </main>
  );
}
