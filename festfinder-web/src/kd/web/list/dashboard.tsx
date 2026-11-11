'use client';
/**
 * The home page's body (owner, 2026-11-06): the map of every night, the highlight, the calendar.
 * Nothing filters it but an address that arrives with `?q=` (the search) or `?style=` (a style's
 * link): then the API's answer for it fills the map and the calendar, the highlight steps aside and
 * one chip above the map names it; its × goes back to every night. Beside it, "Tối nay · n",
 * "Cuối tuần · n" and "Miễn phí · n" lead to their lists under the calendar. A search also names up to
 * three artists, a row of links under those chips.
 */
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { XIcon } from '@phosphor-icons/react/ssr';
import dynamic from 'next/dynamic';
import { FF } from '@/runtime/ff';
import { fill, pick, tx, type Lang, type Pair } from '../../copy';
import { Button, Chip, LinkButton } from '../../ui/actions';
import { KdLink, inLang } from '../../link';
import { useKd } from '../../runtime';
import { Calendar, dayName, freeNights, nextNights, weekendNights, type HomeEvent } from './calendar';
import { LIST } from './copy';
import { MapBoard } from './map-board';

const HomeMap = dynamic(() => import('./home-map').then((m) => m.HomeMap), { ssr: false });

const never = () => () => {};
/** The API's clock to the minute (FF.now), so a night under way starts and stops bouncing on time. */
const everyMinute = (tick: () => void) => { const t = setInterval(tick, 60_000); return () => clearInterval(t); };
const minute = () => Math.floor(FF.now().getTime() / 60_000) * 60_000;

export function Dashboard({ lang, heading, events, today, city, styles, places, highlight, siteUrl }: {
  lang: Lang; heading: string; events: HomeEvent[]; today: string; city?: string; places: { name: string; at: [number, number] }[];
  styles: { key: string; label: Pair }[]; highlight: ReactNode; siteUrl: string;
}) {
  const T = pick(LIST, lang);
  // The cached page is every visitor's; the address is read in the browser only.
  const search = useSyncExternalStore(never, () => location.search, () => '');
  // 0 on the server and until the API's clock is known (a device's own clock may be wrong): the
  // cached page shows no night under way and every one of today's; then the browser knows the minute.
  const { clockReady } = useKd();
  // The snapshot reads 0 until the clock is ready, so the first check after hydration matches the server's and does not re-render the page.
  const now = useSyncExternalStore(everyMinute, () => (clockReady ? minute() : 0), () => 0);
  const [cleared, setCleared] = useState(false);
  const [found, setFound] = useState<HomeEvent[] | 'error' | null>(null);
  const [tries, setTries] = useState(0);
  const [artists, setArtists] = useState<{ q: string; items: { slug: string; name: string }[] } | null>(null);
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

  // A search's artists: the profiles an artist runs or the team verified, three at most (followers never rank them).
  useEffect(() => {
    if (!q) return;
    let on = true;
    FF.get('/artists/suggest?' + new URLSearchParams({ q })).then((r: { items: { slug: string; name: string; claimed: boolean }[] }) => {
      if (on) setArtists({ q, items: r.items.filter((a) => a.claimed).slice(0, 3) });
    }, () => {});
    return () => { on = false; };
  }, [q]);

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
  // Recomputed only when the nights or the minute change, not on every render (the clock and the map's wake re-render).
  const { next, weekend, free } = useMemo(() => ({
    next: nextNights(shown, today, now),
    weekend: weekendNights(shown, today, now),
    free: freeNights(shown, today, now),
  }), [shown, today, now]);
  const arts = artists?.q === q ? artists.items : [];
  // Nothing to show, or the search's answer did not come: a title and the one thing to do.
  const note = found === 'error' ? { title: T.loadFailed, action: <Button size="sm" onClick={() => { setFound(null); setTries((n) => n + 1); }}>{T.retry}</Button> }
    : asked && Array.isArray(found) && !found.length ? { title: T.noMatch, action: <Button size="sm" onClick={clear}>{T.clear}</Button> }
    : !asked && !events.length ? { title: T.noUpcoming, action: <LinkButton size="sm" href={inLang('/studio/new', lang)}>{T.postEvent}</LinkButton> }
    : null;
  const quick = !note && !!(next || weekend.length || free.length);
  return (
    <main id="main" className="flex flex-1 flex-col">
      <h1 className="sr-only">{heading}</h1>
      <section
        aria-label={T.mapLabel}
        className="relative h-[60dvh] min-h-80 overflow-hidden bg-map tab:h-[70dvh]"
        onPointerEnter={wake} onPointerDown={wake} onTouchStart={wake} onWheel={wake} onFocus={wake}
      >
        {live ? <HomeMap lang={lang} events={shown} now={now} places={places} onReady={ready} /> : null}
        {drawn ? null : <MapBoard lang={lang} events={shown} now={now} places={places} />}
        {note ? (
          <div className="pointer-events-none absolute inset-0 z-[2] grid place-items-center p-4">
            <div className="kd-glass pointer-events-auto flex flex-col items-center gap-3 rounded-card p-5">
              <p className="kd-hs">{note.title}</p>
              {note.action}
            </div>
          </div>
        ) : null}
        {asked || quick || arts.length ? (
          <div className="absolute left-4 top-4 z-[3] flex max-w-[calc(100%-2rem)] flex-col items-start gap-2">
            {asked || quick ? (
              <div className="flex flex-wrap gap-2">
                {asked ? (
                  <Chip on className="kd-glass" onClick={clear}>
                    <span className="kd-ell">{q ? `“${q}”` : tx(styles.find((s) => s.key === style)?.label, lang) ?? style}</span>
                    <XIcon size={14} aria-hidden="true" />
                    <span className="sr-only">{T.clear}</span>
                  </Chip>
                ) : null}
                {/* What's on tonight, in one tap from the first screen (persona review, 2026-11-07). */}
                {next && !note ? <a href="#tonight" className="kd-chip kd-glass">{dayName(next.day, today, lang)} · {fill(T.nNights, { n: next.list.length })}</a> : null}
                {weekend.length && !note ? <a href="#weekend" className="kd-chip kd-glass">{T.weekend} · {fill(T.nNights, { n: weekend.length })}</a> : null}
                {free.length && !note ? <a href="#free" className="kd-chip kd-glass">{T.free} · {fill(T.nNights, { n: free.length })}</a> : null}
              </div>
            ) : null}
            {arts.length ? (
              <nav aria-label={T.artists} className="kd-glass flex max-w-full flex-wrap items-center gap-2 rounded-card p-2">
                <span className="kd-s px-1 text-fg-2">{T.artists}</span>
                {arts.map((a) => <KdLink key={a.slug} href={inLang('/a/' + a.slug, lang)} className="kd-chip kd-ell max-w-full">{a.name}</KdLink>)}
              </nav>
            ) : null}
          </div>
        ) : null}
      </section>
      {asked ? null : highlight}
      <Calendar lang={lang} events={shown} today={today} now={now} city={city} siteUrl={siteUrl} />
    </main>
  );
}
