/**
 * /stats/<key> (and ?lang=en) in Kính đêm: one explore stat as a list, under the filters the
 * address carries. Not drawn; built from the list and map boards' rows. `free` and `weekend`
 * are events (art, title, marker + when · time · venue · km, price, hype or sold out); `venues` are
 * the places with something on, each with its events. Chips move between the three stats with
 * their counts; when and city are pickers; a genre or a search from the address shows as a
 * chip that takes it off. Rendered on the server from GET /explore/stats.
 */
import type { ReactNode } from 'react';
import { MapPinIcon, XIcon } from '@phosphor-icons/react/ssr';
import { apiOr } from '@/lib/api';
import { fill, pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import { count, km, moneyShort, whenShort } from '../../format';
import { FAMILY_LABEL, familyOf, g } from '../../genre';
import { KdLink as Link, inLang } from '../../link';
import { KdProvider } from '../../runtime';
import { ChipLink, LinkButton } from '../../ui/actions';
import { Art, Card as Panel, Marker, Status } from '../../ui/parts';
import type { Card } from '../../types';
import { Crumbs, WebFooter, WebNav } from '../chrome';
import { WEB } from '../copy';
import { STATS } from './copy';
import {
  apiPath, isFiltered, NO_FILTERS, readFilters, statHref, STAT_KEYS, TIMES,
  type Discovery, type Search, type StatAnswer, type StatFilters, type StatKey, type StatVenue, type Time,
} from './model';
import { MoreRows } from './more';
import { StatPicker } from './pickers';

/** Rows shown before "Xem thêm". */
const FIRST = 30;
/** A venue's events shown before the rest fold away. */
const VENUE_FIRST = 3;

export async function StatPage({ statKey, lang, search }: { statKey: StatKey; lang: Lang; search: Search }) {
  const T = pick(STATS, lang);
  const W = pick(WEB, lang);
  const meta = await apiOr<Discovery>('/meta/discovery', { cities: [], genres: [] }, { revalidate: 300 });
  const f = readFilters(search, statKey, meta);
  // The weekend stat is always this weekend (its address drops the time), so under another
  // time its chip is counted apart: the count then matches the list the chip opens.
  const weekendApart = statKey !== 'weekend' && f.time !== 'weekend' && !f.q;
  const [data, weekend] = await Promise.all([
    apiOr<StatAnswer | null>(apiPath(statKey, f), null, { lang }),
    weekendApart ? apiOr<StatAnswer | null>(apiPath(null, { ...f, time: 'weekend' }), null, { lang }) : null,
  ]);
  const counts: Record<StatKey, number | null> | null = data
    ? { ...data.counts, weekend: weekendApart ? weekend?.counts.weekend ?? null : data.counts.weekend }
    : null;
  const href = (patch: Partial<StatFilters>, key: StatKey = statKey) => statHref(key, { ...f, ...patch }, lang);

  const title = T[statKey];
  const chip: Record<StatKey, string> = { free: T.chipFree, weekend: T.chipWeekend, venues: T.chipVenues };
  const timeLabel: Record<Time, string> = { tonight: T.tonight, weekend: T.thisWeekend, '7days': T.next7, month: T.month };
  const genreLabel = f.family ? FAMILY_LABEL[f.family][lang] : f.genre;
  const n = data ? (statKey === 'venues' ? data.venues?.length ?? 0 : data.rows?.length ?? 0) : 0;
  const otherLang = { href: statHref(statKey, f, lang === 'vi' ? 'en' : 'vi'), label: lang === 'vi' ? W.english : W.vietnamese };

  const rows: { key: string; node: ReactNode }[] = !data ? [] : statKey === 'venues'
    ? (data.venues ?? []).map((v) => ({ key: v.firstEventId + v.name, node: <VenueRow v={v} lang={lang} /> }))
    : (data.rows ?? []).map((e, i) => ({ key: e.id, node: <EventRow e={e} i={i} lang={lang} /> }));

  return (
    <KdProvider lang={lang}>
      <div className="flex min-h-dvh flex-col" lang={lang}>
        <WebNav lang={lang} />
        <Crumbs label={W.crumbs} items={[{ name: W.explore, href: inLang('/', lang) }, { name: title }]} />

        <main className="kd-wrap flex flex-col gap-6 pt-[clamp(12px,3vw,32px)]">
          <header className="flex max-w-read flex-col gap-3">
            <span className="kd-m">{T.kicker}</span>
            <h1 className="kd-d1">{title}</h1>
          </header>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <nav aria-label={T.views} className="flex flex-wrap gap-2">
              {STAT_KEYS.map((k) => (
                <ChipLink key={k} on={k === statKey} family={k === 'free' ? 'free' : undefined} count={counts ? counts[k] : null} href={href({}, k)}>
                  {chip[k]}
                </ChipLink>
              ))}
            </nav>
            <div role="group" aria-label={T.filters} className="flex flex-wrap items-center gap-2">
              {/* A search spans every date, and the weekend stat is always this weekend. */}
              {statKey !== 'weekend' && !f.q ? (
                <StatPicker label={T.when} value={f.time} choices={TIMES.map((t) => ({ value: t, label: timeLabel[t], href: href({ time: t }) }))} />
              ) : null}
              {meta.cities.length ? (
                <StatPicker
                  label={T.city}
                  value={f.city ?? 'all'}
                  choices={[
                    { value: 'all', label: T.allCities, href: href({ city: null }) },
                    ...meta.cities.map((c) => ({ value: c.slug, label: c.name[lang], href: href({ city: c.slug }) })),
                  ]}
                />
              ) : null}
              {genreLabel ? (
                <Link className={cx('kd-chip kd-chip-on', f.family && g(f.family))} href={href({ family: null, genre: null })} aria-label={fill(T.remove, { f: genreLabel })} scroll={false}>
                  <Marker family={f.family ?? familyOf(f.genre)} />
                  {genreLabel}
                  <XIcon size={14} aria-hidden="true" />
                </Link>
              ) : null}
              {f.q ? (
                <Link className="kd-chip kd-chip-on" href={href({ q: '' })} aria-label={fill(T.remove, { f: f.q })} scroll={false}>
                  <span className="kd-ell max-w-[220px]">“{f.q}”</span>
                  <XIcon size={14} aria-hidden="true" />
                </Link>
              ) : null}
              {isFiltered(f) ? (
                <Link className="kd-more ml-1" href={statHref(statKey, NO_FILTERS, lang)} scroll={false}>
                  <XIcon size={14} aria-hidden="true" />
                  {T.clear}
                </Link>
              ) : null}
            </div>
          </div>

          {!data ? (
            <Panel role="alert" className="flex flex-wrap items-center justify-between gap-4 p-7">
              <span className="kd-h">{T.failed}</span>
              <LinkButton href={statHref(statKey, f, lang)} external>{T.retry}</LinkButton>
            </Panel>
          ) : rows.length ? (
            <section aria-labelledby="st-n" className="flex flex-col gap-3">
              <h2 id="st-n" className="kd-m kd-num">{statKey === 'venues' ? howMany(n, T.oneVenue, T.nVenues, lang) : howMany(n, T.oneEvent, T.nEvents, lang)}</h2>
              {/* Keyed by the address: other filters start folded again. */}
              <MoreRows key={statHref(statKey, f, lang)} rows={rows} first={FIRST} label={title} more={T.moreN} less={T.less} />
            </section>
          ) : (
            <Panel role="status" className="flex flex-wrap items-center justify-between gap-4 p-7">
              <span className="kd-h">{T.empty}</span>
              <span className="flex flex-wrap gap-2">
                {statKey !== 'weekend' && !f.q && f.time !== 'month' ? <LinkButton href={href({ time: 'month' })}>{T.widen}</LinkButton> : null}
                {isFiltered(f) ? <LinkButton href={statHref(statKey, NO_FILTERS, lang)}>{T.clear}</LinkButton> : null}
                {statKey === 'weekend' && !isFiltered(f) ? <LinkButton href={inLang('/', lang)}>{T.explore}</LinkButton> : null}
              </span>
            </Panel>
          )}
        </main>

        <div className="mt-auto">
          <WebFooter lang={lang} otherLang={otherLang} />
        </div>
      </div>
    </KdProvider>
  );
}

/** "1 event" / "{n} events": English has a singular, Vietnamese does not. */
function howMany(n: number, one: string, many: string, lang: Lang) {
  return n === 1 ? one : fill(many, { n: count(n, lang) });
}

/** An event of the free or weekend stat: to its page. */
function EventRow({ e, i, lang }: { e: Card; i: number; lang: Lang }) {
  const T = pick(STATS, lang);
  const W = pick(WEB, lang);
  const fam = familyOf(e.genre);
  const free = e.isFree || e.entryMode === 'free';
  return (
    <Link href={inLang('/e/' + e.slug, lang)} className={cx('kd-row transition-colors duration-150 hover:bg-white/[0.03]', g(fam))}>
      <Art family={fam} cover={e.coverUrl} bone={i % 2 === 1} off={e.soldOut} />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="kd-hs kd-ell">{e.title}</span>
        <span className="kd-s flex min-w-0 items-center gap-1.5">
          <Marker family={fam} />
          <span className="kd-ell">{[whenShort(e, lang), e.startTime, e.venue.name, e.distanceKm != null ? km(e.distanceKm, lang) : null].filter(Boolean).join(' · ')}</span>
        </span>
      </span>
      <span className="flex flex-col items-end gap-1">
        <span className={cx('kd-mb kd-num whitespace-nowrap', free && 'text-acc')}>{free ? W.free : moneyShort(e.priceFrom, e.currency, lang)}</span>
        {e.soldOut ? (
          <Status tone="bad">{W.soldOut}</Status>
        ) : e.hypeCount ? (
          <span className="kd-m kd-num whitespace-nowrap">{fill(T.hype, { n: count(e.hypeCount, lang) })}</span>
        ) : null}
      </span>
    </Link>
  );
}

/** A venue of the venues stat: where it is, and its events, each to its page. */
function VenueRow({ v, lang }: { v: StatVenue; lang: Lang }) {
  const T = pick(STATS, lang);
  const where = [v.area, v.distanceKm != null ? km(v.distanceKm, lang) : null].filter(Boolean).join(' · ');
  const event = (x: StatVenue['events'][number]) => (
    <li key={x.id}>
      <Link href={inLang('/e/' + x.slug, lang)} className="kd-s flex min-h-8 min-w-0 items-center gap-1.5 hover:text-paper">
        <Marker family={familyOf(x.genre)} />
        <span className="kd-ell">{[x.title, whenShort(x, lang), x.startTime].filter(Boolean).join(' · ')}</span>
      </Link>
    </li>
  );
  const rest = v.events.slice(VENUE_FIRST);
  return (
    <div className="grid grid-cols-[52px_minmax(0,1fr)_auto] gap-3 border-b border-line py-3">
      <span className="flex h-[52px] w-[52px] items-center justify-center rounded-seg bg-obsidian text-mist shadow-[inset_0_0_0_1px_var(--color-line)]" aria-hidden="true">
        <MapPinIcon size={22} />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="kd-hs">{v.name}</h3>
        {where ? <span className="kd-s">{where}</span> : null}
        <ul className="flex flex-col pt-0.5">{v.events.slice(0, VENUE_FIRST).map(event)}</ul>
        {rest.length ? (
          <details>
            <summary className="kd-more cursor-pointer list-none [&::-webkit-details-marker]:hidden">{fill(T.moreHere, { n: rest.length })}</summary>
            <ul className="flex flex-col">{rest.map(event)}</ul>
          </details>
        ) : null}
      </div>
      <span className="kd-m kd-num whitespace-nowrap pt-1">{howMany(v.eventCount, T.oneEvent, T.nEvents, lang)}</span>
    </div>
  );
}
