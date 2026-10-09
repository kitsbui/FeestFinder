'use client';
/**
 * /app in Kính đêm (design/Main): the city in the bar, "Cuối tuần này ▾ có gì chơi?", genre
 * chips, the featured card, then "Gần bạn · n" (nearest first once the device has shared where
 * it is), "Xem bản đồ", and an empty state. A device seen for the first time, signed out,
 * goes through onboarding (design/App-Onboarding) first.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowRightIcon, BellIcon, CaretDownIcon, MagnifyingGlassIcon, MapPinIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../copy';
import { cx } from '../cx';
import { dayMonth, km, money, moneyShort, weekdayLong, whenShort } from '../format';
import { FAMILY_LABEL, familyOf, g, type Family } from '../genre';
import { KdLink as Link } from '../link';
import { useKd } from '../runtime';
import { Button, buttonClass, Chip, IconButton } from '../ui/actions';
import { Input } from '../ui/forms';
import { Menu, MenuItem, Picker } from '../ui/menu';
import { Art, Card as Panel, Marker } from '../ui/parts';
import { AppBar } from '../ui/shell';
import { Sheet } from '../ui/sheet';
import type { Card } from '../types';
import { cardTag } from '../web/card';
import { SaveToggle } from '../web/save-toggle';
import { APP } from './copy';
import { distanceKm, nearestCity, place } from './place';
import { useApp } from './root';

export type TimeKey = 'tonight' | 'weekend' | '7days' | 'month';
export interface City { slug: string; name: { vi: string; en: string }; timezone: string; center: [number, number] | null; bbox: [number, number, number, number] | null }
interface Feed {
  items: Card[]; total: number; nextCursor: string | null; hero: Card | null;
  facets: { time: Record<TimeKey, number>; city: Record<string, number>; family: Record<Family, number> };
}
const TIMES: TimeKey[] = ['tonight', 'weekend', '7days', 'month'];
const FAMILIES: Family[] = ['fest', 'live', 'edm', 'cult', 'free'];
const PAGE = 20;

/** /meta/discovery, once per page. */
export function useDiscovery() {
  const [meta, setMeta] = useState<{ defaultCity: string; cities: City[] } | null>(null);
  useEffect(() => {
    FF.once('kd:discovery', () => FF.maybe(FF.get('/meta/discovery'), null)).then((d: any) => d && setMeta(d));
  }, []);
  return meta;
}

/** The city this device looks at: its choice, else the one nearest its position, else the default. */
export function useCity(meta: { defaultCity: string; cities: City[] } | null): [string | null, (slug: string) => void] {
  const [city, setCity] = useState<string | null>(null);
  useEffect(() => {
    if (!meta) return;
    const saved = place.city();
    const at = place.at();
    const near = at ? nearestCity(meta.cities, at)?.slug : null;
    setCity(saved && meta.cities.some((c) => c.slug === saved) ? saved : near ?? meta.defaultCity);
  }, [meta]);
  return [city, (slug: string) => { place.setCity(slug); setCity(slug); }];
}

export function Explore({ lang }: { lang: Lang }) {
  const kd = useKd();
  const meta = useDiscovery();
  const [onboard, setOnboard] = useState<boolean | null>(null);
  const { setTabs } = useApp();
  useEffect(() => { setTabs(!onboard); }, [onboard, setTabs]);
  // Onboarding: a device that has never said where it is, and nobody signed in.
  useEffect(() => {
    if (kd.session === undefined) return;
    setOnboard(!place.known() && !kd.user);
  }, [kd.session, kd.user]);
  if (onboard === null || !meta) return <ExploreSkeleton />;
  if (onboard) return <Onboarding lang={lang} meta={meta} onDone={() => setOnboard(false)} />;
  return <Feed lang={lang} meta={meta} />;
}

function ExploreSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-4" aria-hidden="true">
      <div className="kd-skel h-10 w-40" />
      <div className="kd-skel h-16 w-64" />
      <div className="kd-skel h-56" />
    </div>
  );
}

function Feed({ lang, meta }: { lang: Lang; meta: { defaultCity: string; cities: City[] } }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [city, setCity] = useCity(meta);
  const [time, setTime] = useState<TimeKey>('weekend');
  const [family, setFamily] = useState<Family | null>(() => { const l = place.likes(); return l.length === 1 ? l[0] : null; });
  const [feed, setFeed] = useState<Feed | null>(null);
  const [items, setItems] = useState<Card[]>([]);
  const [busy, setBusy] = useState(false);
  const [at] = useState(() => place.at());
  const [today, setToday] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [searching, setSearching] = useState(false);
  const seq = useRef(0);

  const query = useCallback((cursor?: string | null) => {
    const q = new URLSearchParams({ time, limit: String(PAGE), upcoming: '1' });
    if (city) q.set('city', city);
    if (family === 'free') q.set('price', 'free');
    else if (family) q.set('family', family);
    if (at) { q.set('lat', String(at.lat)); q.set('lng', String(at.lng)); }
    if (cursor) q.set('cursor', cursor);
    return '/events?' + q;
  }, [time, city, family, at]);

  useEffect(() => {
    if (!city) return;
    const n = ++seq.current;
    setBusy(true);
    FF.maybe(FF.get(query()), null).then((out: Feed | null) => {
      if (n !== seq.current) return;
      setBusy(false);
      if (out) { setFeed(out); setItems(out.items); }
    });
  }, [city, query]);

  useEffect(() => {
    if (!kd.user) { setUnread(0); return; }
    FF.once('kd:unread', () => FF.maybe(FF.get('/me/notifications?limit=1'), null)).then((r: any) => setUnread(r?.unread ?? 0));
  }, [kd.user]);

  const cityRow = meta.cities.find((c) => c.slug === city);
  useEffect(() => {
    if (!kd.clockReady) return;
    const tz = cityRow?.timezone || 'Asia/Ho_Chi_Minh';
    setToday(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(FF.now()));
  }, [cityRow, kd.clockReady]);

  const more = async () => {
    if (!feed?.nextCursor || busy) return;
    setBusy(true);
    const out: Feed | null = await FF.maybe(FF.get(query(feed.nextCursor)), null);
    setBusy(false);
    if (out) { setItems((xs) => [...xs, ...out.items]); setFeed((f) => f && { ...f, nextCursor: out.nextCursor }); }
  };

  const timeLabel = (k: TimeKey) => ({ tonight: T.tonight, weekend: T.weekend, '7days': T.next7, month: T.month })[k];
  const hero = feed?.hero && !feed.hero.past ? feed.hero : items[0] ?? null;
  const rest = useMemo(() => {
    const xs = items.filter((e) => e.id !== hero?.id).map((e) => ({ e, d: at ? e.distanceKm ?? distanceKm(at, e.venue) : null }));
    return at ? xs.sort((a, b) => (a.d ?? 1e9) - (b.d ?? 1e9)) : xs;
  }, [items, hero, at]);
  const counts = feed?.facets?.time;

  return (
    <>
      <AppBar>
        <div className="relative">
          <Menu
            label={T.city}
            trigger={(p) => (
              <button type="button" {...p} ref={p.ref} className={buttonClass({ tone: 'ghost', size: 'sm' }, '-ml-2 gap-1.5 px-2 text-paper')}>
                <MapPinIcon size={18} className="text-acc" aria-hidden="true" />
                {cityRow?.name[lang] ?? T.city}
                <CaretDownIcon size={16} className="kd-chev text-fog" aria-hidden="true" />
              </button>
            )}
          >
            {meta.cities.map((c) => {
              const n = feed?.facets?.city?.[c.slug] ?? null;
              const empty = n === 0 && c.slug !== city;
              return (
                <MenuItem key={c.slug} checked={c.slug === city} disabled={empty} aside={empty ? T.soon : n} onSelect={() => setCity(c.slug)}>{c.name[lang]}</MenuItem>
              );
            })}
          </Menu>
        </div>
        <IconButton label={T.search} className="ml-auto" onClick={() => setSearching(true)}><MagnifyingGlassIcon size={22} aria-hidden="true" /></IconButton>
        <a className="kd-ib relative" href="/app/notifications" aria-label={unread ? fill(T.notificationsNew, { n: unread }) : T.notifications}>
          <BellIcon size={22} aria-hidden="true" />
          {unread ? <span className="absolute right-[11px] top-[11px] h-[7px] w-[7px] rounded-full bg-hot shadow-[0_0_0_2px_var(--color-void)]" aria-hidden="true" /> : null}
        </a>
      </AppBar>

      <div className="relative z-[27] flex flex-col gap-2 px-4 pt-1.5">
        <span className="kd-m kd-num" suppressHydrationWarning>
          {today ? `${weekdayLong(today, lang)} ${dayMonth(today, lang)}` : ''}{feed ? ' · ' + fill(T.nEvents, { n: feed.total }) : ''}
        </span>
        <h1 className="kd-d2">
          <Picker tone="inline" label={T.timeMenu} value={time} onChange={setTime} options={TIMES.map((k) => ({ value: k, label: timeLabel(k), aside: counts?.[k] ?? null }))} />
          <span className="block">{T.whatsOn}</span>
        </h1>
      </div>

      <div className="kd-hscroll px-4 pt-4" role="group" aria-label={T.genres}>
        <Chip on={!family} onClick={() => setFamily(null)}>{T.allGenres}</Chip>
        {FAMILIES.map((f) => (
          <Chip key={f} family={f} on={family === f} onClick={() => setFamily(family === f ? null : f)}>{FAMILY_LABEL[f][lang]}</Chip>
        ))}
      </div>

      {hero ? (
        <>
          <Featured e={hero} lang={lang} km={at ? hero.distanceKm ?? distanceKm(at, hero.venue) : null} />
          <div className="flex items-center justify-between px-4 pb-1 pt-5">
            <span className="kd-m">{fill(at ? T.nearYou : T.soonest, { n: rest.length })}</span>
            <Link className="kd-s inline-flex min-h-8 items-center gap-1 text-mist" href="/app/list">{T.seeMap}<ArrowRightIcon size={14} aria-hidden="true" /></Link>
          </div>
          <ul className={cx('flex flex-col px-4 transition-opacity', busy && 'opacity-60')}>
            {rest.map(({ e, d }) => {
              const fam = familyOf(e.genre);
              return (
                <li key={e.id}>
                  <Link className={cx('kd-row', g(fam))} href={'/app/e/' + e.slug}>
                    <Art family={fam} cover={e.coverUrl} off={e.soldOut} />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="kd-hs kd-ell">{e.title}</span>
                      <span className="kd-s kd-ell flex items-center gap-1.5"><Marker family={fam} />{whenShort(e, lang)}{e.venue.area ? ' · ' + e.venue.area : ''}</span>
                    </span>
                    <span className="flex flex-col items-end gap-0.5">
                      <span className={cx('kd-mb kd-num', e.isFree && 'text-acc')}>{e.isFree ? T.free : moneyShort(e.priceFrom, e.currency, lang)}</span>
                      {d != null ? <span className="kd-s kd-num">{km(d, lang)}</span> : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {feed?.nextCursor ? <Button className="mx-4 mt-3" size="sm" onClick={more} disabled={busy}>{T.more}</Button> : null}
        </>
      ) : feed && !busy ? (
        <Panel role="status" className="m-4 flex flex-col items-start gap-3 px-5 py-7">
          <span className="kd-h">{T.emptyTitle}</span>
          <span className="kd-s">{T.emptyBody}</span>
          <Button size="sm" onClick={() => { setFamily(null); setTime('month'); }}>{T.reset}</Button>
        </Panel>
      ) : (
        <div className="kd-skel mx-4 mt-4 h-56" aria-hidden="true" />
      )}

      {searching ? <SearchSheet lang={lang} city={city} onClose={() => setSearching(false)} /> : null}
    </>
  );
}

function Featured({ e, lang, km: d }: { e: Card; lang: Lang; km: number | null }) {
  const T = pick(APP, lang);
  const fam = familyOf(e.genre);
  const tag = cardTag(e, lang) ?? T.featured;
  return (
    <article className={cx('relative mx-4 mt-4 h-57', g(fam))}>
      <Art family={fam} cover={e.coverUrl} className="absolute inset-0" />
      <div className="absolute inset-x-2.5 top-2.5 z-[1] flex items-center justify-between">
        <span className="kd-tag kd-tag-glass text-paper">{tag}</span>
        <SaveToggle id={e.id} label={T.saveEvent} />
      </div>
      <Link href={'/app/e/' + e.slug} className={cx('kd-glass absolute inset-x-2.5 bottom-2.5 z-[1] grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 gap-y-1 rounded-[10px] px-3.5 py-3', g(fam))}>
        <span className="kd-m flex items-center gap-1.5 text-mist"><span className="kd-mk" aria-hidden="true" />{FAMILY_LABEL[fam][lang]}</span>
        <span />
        <span className="kd-h kd-ell">{e.title}</span>
        <span className={cx('kd-mb kd-num', e.isFree && 'text-acc')}>{e.isFree ? T.free : fill(T.fromPrice, { p: money(e.priceFrom, e.currency, lang) })}</span>
        <span className="kd-s kd-ell text-mist">{whenShort(e, lang)}{d != null ? ' · ' + km(d, lang) : e.venue.name ? ' · ' + e.venue.name : ''}</span>
      </Link>
    </article>
  );
}

function SearchSheet({ lang, city, onClose }: { lang: Lang; city: string | null; onClose: () => void }) {
  const T = pick(APP, lang);
  const [q, setQ] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    FF.track('search', { screen: 'app' });
    location.assign('/app/list?q=' + encodeURIComponent(v) + (city ? '&city=' + city : ''));
  };
  return (
    <Sheet title={T.search} closeLabel={T.close} onClose={onClose}>
      <form role="search" onSubmit={submit} className="flex flex-col gap-3 pt-1">
        <Input type="search" autoFocus placeholder={T.searchPh} aria-label={T.search} value={q} onChange={(e) => setQ(e.target.value)} icon={<MagnifyingGlassIcon size={18} aria-hidden="true" />} />
        <Button type="submit" tone="acc" block>{T.searchGo}</Button>
      </form>
    </Sheet>
  );
}

// ---- onboarding -------------------------------------------------------------------------

function Onboarding({ lang, meta, onDone }: { lang: Lang; meta: { defaultCity: string; cities: City[] }; onDone: () => void }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [likes, setLikes] = useState<Family[]>(() => place.likes());
  const [count, setCount] = useState<Record<Family, number> | null>(null);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    FF.maybe(FF.get('/events?time=7days&limit=1&upcoming=1'), null).then((r: any) => r?.facets?.family && setCount(r.facets.family));
  }, []);
  const matching = count ? (likes.length ? likes : (['fest', 'live', 'edm', 'cult'] as Family[])).reduce((s, f) => s + (count[f] ?? 0), 0) : null;
  const toggle = (f: Family) => setLikes((xs) => (xs.includes(f) ? xs.filter((x) => x !== f) : [...xs, f]));
  const finish = (city: string) => {
    place.setCity(city);
    place.setLikes(likes);
    onDone();
  };
  const locate = () => {
    if (!navigator.geolocation) { setPicking(true); kd.toast(T.obNoLocation); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const at = { lat: p.coords.latitude, lng: p.coords.longitude };
        place.setAt(at);
        setBusy(false);
        finish(nearestCity(meta.cities, at)?.slug ?? meta.defaultCity);
      },
      () => { setBusy(false); setPicking(true); kd.toast(T.obNoLocation); },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };
  // Twelve tiles in the colours of the picks (every family when none is picked).
  const shown: Family[] = likes.length ? likes : ['fest', 'live', 'edm', 'cult'];
  return (
    <div className="flex min-h-dvh flex-col desk:mx-auto desk:w-full desk:max-w-[640px] pb-[calc(20px+env(safe-area-inset-bottom))]">
      <AppBar className="pr-1.5">
        <img src="/kd/ff-mark.svg" alt="FeestFinder" width={16} height={28} />
        <button type="button" className={buttonClass({ tone: 'ghost', size: 'sm' }, 'ml-auto')} onClick={() => finish(meta.defaultCity)}>{T.skip}</button>
      </AppBar>
      <div className="relative mx-4 mt-2">
        <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => <Art key={i} family={shown[i % shown.length]} bone={i % 5 === 2} className="aspect-square rounded-[10px]" />)}
        </div>
        {matching != null ? <span className="kd-tag kd-tag-glass kd-num absolute bottom-2.5 left-2.5 h-7 px-2.5 text-paper">{fill(T.obCount, { n: matching })}</span> : null}
      </div>
      <div className="flex flex-col gap-2.5 px-4 pt-6">
        <h1 className="kd-d2 text-[42px] leading-none tracking-[-0.04em]">{T.obTitle}</h1>
        <p className="kd-t text-fog">{T.obBody}</p>
      </div>
      <div className="flex flex-col gap-2.5 px-4 pt-5.5" role="group" aria-label={T.obLike}>
        <span className="kd-m">{T.obLike}</span>
        <div className="flex flex-wrap gap-2">
          {(['fest', 'live', 'edm', 'cult'] as Family[]).map((f) => (
            <Chip key={f} family={f} on={likes.includes(f)} onClick={() => toggle(f)} className="h-11 px-4 text-[15px]">{FAMILY_LABEL[f][lang]}</Chip>
          ))}
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-2 px-4 pt-8">
        {picking ? (
          <div className="flex flex-col gap-1.5" role="group" aria-label={T.city}>
            {meta.cities.map((c) => (
              <button key={c.slug} type="button" className="kd-opt" onClick={() => finish(c.slug)}><span className="kd-hs">{c.name[lang]}</span></button>
            ))}
          </div>
        ) : (
          <>
            <Button tone="acc" size="lg" block onClick={locate} disabled={busy}><MapPinIcon size={18} aria-hidden="true" />{T.obLocate}</Button>
            <Button tone="ghost" block onClick={() => setPicking(true)}>{T.obPickCity}</Button>
            <span className="kd-s text-center">{T.obPrivacy}</span>
          </>
        )}
      </div>
    </div>
  );
}
