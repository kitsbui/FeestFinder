'use client';
/**
 * The home page's live part: the city and the time ("Cuối tuần này ▾ có gì chơi?"), search,
 * the featured card, and the list with its sort and family chips. The server renders the
 * default (this weekend, every family) for search engines; any other choice is asked of
 * /events from here and kept in the address (?time=&family=&price=free&sort=&city=).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowRightIcon, CaretDownIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import { dayMonth, km, money, weekdayLong, whenShort } from '../../format';
import { FAMILY_LABEL, familyOf, g, type Family } from '../../genre';
import { KdLink as Link, inLang } from '../../link';
import { useKd } from '../../runtime';
import { buttonClass, Button, Chip } from '../../ui/actions';
import { Menu, MenuItem, Picker } from '../../ui/menu';
import { Art, Card as Panel } from '../../ui/parts';
import type { Card } from '../../types';
import { EventCard, cardTag } from '../card';
import { HOME } from './copy';

export type TimeKey = 'tonight' | 'weekend' | '7days' | 'month';
export type Sort = 'date' | 'hype' | 'price';
export interface City { slug: string; name: { vi: string; en: string }; timezone: string; center?: [number, number] | null }
export interface Feed {
  items: Card[];
  total: number;
  nextCursor: string | null;
  hero: Card | null;
  facets: { time: Record<TimeKey, number>; city: Record<string, number>; family: Record<Family, number> };
}

const TIMES: TimeKey[] = ['tonight', 'weekend', '7days', 'month'];
const FAMILIES: Family[] = ['fest', 'live', 'edm', 'cult', 'free'];
const PAGE = 12;

interface Filters { city: string; time: TimeKey; family: Family | null; sort: Sort }

function query(f: Filters, cursor?: string | null) {
  const q = new URLSearchParams({ time: f.time, limit: String(PAGE), sort: f.sort, upcoming: '1' });
  if (f.city) q.set('city', f.city);
  if (f.family === 'free') q.set('price', 'free');
  else if (f.family) q.set('family', f.family);
  if (cursor) q.set('cursor', cursor);
  return '/events?' + q;
}

/** The address for the choices: only what differs from the default. */
function address(f: Filters, defaultCity: string) {
  const q = new URLSearchParams();
  if (f.city && f.city !== defaultCity) q.set('city', f.city);
  if (f.time !== 'weekend') q.set('time', f.time);
  if (f.family === 'free') q.set('price', 'free');
  else if (f.family) q.set('family', f.family);
  if (f.sort !== 'date') q.set('sort', f.sort);
  const s = q.toString();
  return '/' + (s ? '?' + s : '');
}

export function HomeBrowser({ lang, initial, cities, defaultCity }: { lang: Lang; initial: Feed; cities: City[]; defaultCity: string }) {
  const T = pick(HOME, lang);
  const [f, setF] = useState<Filters>({ city: defaultCity, time: 'weekend', family: null, sort: 'date' });
  const [feed, setFeed] = useState<Feed>(initial);
  const [items, setItems] = useState<Card[]>(initial.items);
  const [busy, setBusy] = useState(false);
  const [today, setToday] = useState<string | null>(null);
  const seq = useRef(0);

  const load = useCallback(async (next: Filters) => {
    const n = ++seq.current;
    setBusy(true);
    const out: Feed | null = await FF.maybe(FF.get(query(next)), null);
    if (n !== seq.current) return;
    setBusy(false);
    if (out) { setFeed(out); setItems(out.items); }
  }, []);

  // The address says what to show: the nav's genre links land here with ?family=.
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const time = q.get('time') as TimeKey | null;
    const fam = q.get('price') === 'free' ? 'free' : (q.get('family') as Family | null);
    const sort = q.get('sort') as Sort | null;
    const city = q.get('city');
    const next: Filters = {
      city: city && cities.some((c) => c.slug === city) ? city : defaultCity,
      time: time && TIMES.includes(time) ? time : 'weekend',
      family: fam && FAMILIES.includes(fam) ? fam : null,
      sort: sort && ['date', 'hype', 'price'].includes(sort) ? sort : 'date',
    };
    if (address(next, defaultCity) !== '/') { setF(next); load(next); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Today in the chosen city, by the API's clock.
  const { clockReady } = useKd();
  useEffect(() => {
    if (!clockReady) return;
    const tz = cities.find((c) => c.slug === f.city)?.timezone || 'Asia/Ho_Chi_Minh';
    setToday(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(FF.now()));
  }, [f.city, cities, clockReady]);

  const set = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch };
    setF(next);
    history.replaceState(history.state, '', address(next, defaultCity));
    load(next);
  };

  const more = async () => {
    if (!feed.nextCursor || busy) return;
    setBusy(true);
    const out: Feed | null = await FF.maybe(FF.get(query(f, feed.nextCursor)), null);
    setBusy(false);
    if (out) { setItems((xs) => [...xs, ...out.items]); setFeed((x) => ({ ...x, nextCursor: out.nextCursor })); }
  };

  const timeLabel = (k: TimeKey) => T[('t_' + k) as 't_tonight'];
  const timeLower = (k: TimeKey) => T[('tl_' + k) as 'tl_tonight'];
  const counts = feed.facets?.time;
  const famCounts = feed.facets?.family;
  const cityCounts = feed.facets?.city ?? {};
  const city = cities.find((c) => c.slug === f.city);
  const hero = feed.hero && !feed.hero.past ? feed.hero : items[0] ?? null;

  const search = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = String(new FormData(e.currentTarget).get('q') ?? '').trim();
    if (!v) return;
    FF.track('search', { screen: 'home' });
    location.assign(inLang('/list?q=' + encodeURIComponent(v) + (f.city ? '&city=' + f.city : ''), lang));
  };

  return (
    <>
      <section className="kd-wrap pt-8 tab:pt-12">
        <div className="grid grid-cols-1 items-center gap-8 desk:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] desk:gap-12">
          <div className="flex min-w-0 flex-col gap-5.5">
            <div className="kd-m relative z-[27] flex items-center gap-2">
              <Menu
                label={T.city}
                trigger={(p) => (
                  <button type="button" {...p} ref={p.ref} className="kd-dd min-h-8 underline-offset-[5px]">
                    {city?.name[lang] ?? T.city}
                    <CaretDownIcon size={14} className="kd-chev" aria-hidden="true" />
                  </button>
                )}
              >
                {cities.map((c) => {
                  const n = cityCounts[c.slug] ?? 0;
                  return (
                    <MenuItem key={c.slug} checked={c.slug === f.city} disabled={!n && c.slug !== f.city} aside={!n && c.slug !== f.city ? T.soon : n} onSelect={() => set({ city: c.slug })}>
                      {c.name[lang]}
                    </MenuItem>
                  );
                })}
              </Menu>
              {today ? <span className="kd-num" suppressHydrationWarning>· {weekdayLong(today, lang)} {dayMonth(today, lang)}</span> : null}
            </div>
            <h1 className="kd-d0">
              <Picker
                tone="inline"
                label={T.when}
                value={f.time}
                onChange={(v) => set({ time: v })}
                options={TIMES.map((k) => ({ value: k, label: timeLabel(k), aside: counts?.[k] ?? null }))}
              />{' '}
              {T.whatsOn}
            </h1>
            <form role="search" onSubmit={search} className="kd-field h-14 rounded-opt pl-4 pr-1.5">
              <MagnifyingGlassIcon size={20} aria-hidden="true" />
              <input name="q" type="search" placeholder={T.searchPh} aria-label={T.search} className="!text-base" />
              <Button type="submit" tone="acc">{T.searchGo}</Button>
            </form>
            <div className="flex flex-wrap gap-2" role="group" aria-label={T.when}>
              {TIMES.map((k) => (
                <Chip key={k} on={f.time === k} count={counts?.[k] ?? null} onClick={() => set({ time: k })}>{timeLabel(k)}</Chip>
              ))}
            </div>
          </div>
          {hero ? <HeroCard e={hero} lang={lang} /> : null}
        </div>
      </section>

      <section aria-labelledby="list-h" className="kd-wrap flex flex-col gap-4.5 pt-[clamp(48px,6vw,80px)]">
        <div className="kd-sec items-center">
          <h2 id="list-h" className="kd-d2" aria-live="polite">{fill(T.countLine, { n: feed.total, t: timeLower(f.time) })}</h2>
          <Picker
            tone="button"
            label={T.sort}
            value={f.sort}
            onChange={(v) => set({ sort: v })}
            align="end"
            display={<><span className="text-fog">{T.sort}</span>{T[('s_' + f.sort) as 's_date']}</>}
            options={(['date', 'hype', 'price'] as Sort[]).map((s) => ({ value: s, label: T[('s_' + s) as 's_date'] }))}
          />
        </div>
        <div className="kd-hscroll" role="group" aria-label={T.genres}>
          <Chip on={!f.family} onClick={() => set({ family: null })}>{T.all}</Chip>
          {FAMILIES.map((fam) => (
            <Chip key={fam} family={fam} on={f.family === fam} count={famCounts?.[fam] ?? null} onClick={() => set({ family: f.family === fam ? null : fam })}>
              {FAMILY_LABEL[fam][lang]}
            </Chip>
          ))}
        </div>
        {items.length ? (
          <>
            <div className={cx('kd-cards mt-1.5 transition-opacity duration-150', busy && 'opacity-60')}>
              {items.map((e, i) => <EventCard key={e.id} e={e} i={i} lang={lang} />)}
            </div>
            {feed.nextCursor ? (
              <Button className="mt-2.5 self-center" onClick={more} disabled={busy}>
                {T.more}<CaretDownIcon size={16} aria-hidden="true" />
              </Button>
            ) : null}
          </>
        ) : busy ? (
          <div className="kd-skel h-40" aria-hidden="true" />
        ) : (
          <Panel role="status" className="flex flex-wrap items-center justify-between gap-4 p-7">
            <span className="flex flex-col gap-1"><span className="kd-h">{T.emptyTitle}</span><span className="kd-s">{T.emptyBody}</span></span>
            <span className="flex gap-2">
              {f.family ? <Button onClick={() => set({ family: null })}><XIcon size={16} aria-hidden="true" />{T.clearGenre}</Button> : null}
              {f.time !== 'month' ? <Button tone="light" onClick={() => set({ time: 'month' })}>{T.widen}</Button> : null}
            </span>
          </Panel>
        )}
      </section>
    </>
  );
}

/** The featured placement: art, and a glass card with the family, title, when · where and price. */
function HeroCard({ e, lang }: { e: Card; lang: Lang }) {
  const T = pick(HOME, lang);
  const fam = familyOf(e.genre);
  const tag = cardTag(e, lang);
  return (
    <Link href={inLang('/e/' + e.slug, lang)} aria-label={fill(T.featuredLabel, { t: e.title })} className={cx('relative grid h-[clamp(300px,34vw,460px)] grid-cols-[1.35fr_1fr] grid-rows-2 gap-2', g(fam))}>
      <Art family={fam} cover={e.coverUrl} className="row-span-2" />
      <Art family={fam} bone />
      <Art family={fam === 'live' ? 'fest' : 'live'} />
      <span className={cx('kd-glass absolute bottom-3.5 left-3.5 flex w-[min(300px,calc(100%-28px))] flex-col gap-1.5 rounded-card px-4 py-3.5', g(fam))}>
        <span className="kd-m flex items-center gap-1.5 text-mist"><span className="kd-mk" aria-hidden="true" />{FAMILY_LABEL[fam][lang]} · {T.featured}</span>
        <span className="kd-h">{e.title}</span>
        <span className="kd-s text-mist">{whenShort(e, lang)}{e.venue.name ? ' · ' + e.venue.name : ''}</span>
        <span className="flex items-center justify-between gap-2 pt-0.5">
          <span className={cx('kd-mb kd-num', e.isFree && 'text-acc')}>{e.isFree ? T.free : fill(T.fromPrice, { p: money(e.priceFrom, e.currency, lang) })}</span>
          {tag && tag !== T.featured ? <span className="kd-tag bg-hot text-void">{tag}</span> : null}
        </span>
      </span>
    </Link>
  );
}

/** "Gần đây, tối nay": the nearest places with something tonight, and the map. */
export function NearbyTonight({ lang, items }: { lang: Lang; items: Card[] }) {
  const T = pick(HOME, lang);
  const near = useMemo(() => [...items].filter((e) => !e.past).sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99)).slice(0, 4), [items]);
  if (!near.length) return null;
  return (
    <div className="flex flex-col gap-4.5">
      <div className="flex flex-col gap-2">
        <span className="kd-m">{T.aroundYou}</span>
        <h2 className="kd-d2">{T.nearTonight}</h2>
      </div>
      <ul className="border-t border-line">
        {near.map((e) => (
          <li key={e.id} className={cx('grid min-h-15 grid-cols-[14px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line', g(familyOf(e.genre)))}>
            <span className="kd-mk" aria-hidden="true" />
            <Link href={inLang('/e/' + e.slug, lang)} className="flex min-w-0 flex-col">
              <span className="kd-hs kd-ell">{e.venue.name}</span>
              <span className="kd-s kd-ell">{[e.venue.area, e.title].filter(Boolean).join(' · ')}</span>
            </Link>
            {e.distanceKm != null ? <span className="kd-mb kd-num">{km(e.distanceKm, lang)}</span> : null}
          </li>
        ))}
      </ul>
      <a className={buttonClass({}, 'self-start')} href={inLang('/list?view=map', lang)}>{T.openMap}<ArrowRightIcon size={16} aria-hidden="true" /></a>
    </div>
  );
}

