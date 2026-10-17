'use client';
/**
 * An organiser's upcoming events as cards, with a sort and filters once there are enough to need
 * them (Feest Radar's page, owner 2026-10-17): the styles and cities its events are in, and the
 * order (soonest, world-class festivals first, most interest). All in the browser: the page
 * already holds every upcoming event.
 */
import { useMemo, useState } from 'react';
import { pick, type Lang } from '../../copy';
import { styleLabel } from '../../genre';
import { Picker } from '../../ui/menu';
import type { Card } from '../../types';
import { EventCard } from '../card';

const COPY = {
  style: { en: 'Style', vi: 'Dòng nhạc' },
  anyStyle: { en: 'Every style', vi: 'Mọi dòng nhạc' },
  city: { en: 'City', vi: 'Thành phố' },
  anyCity: { en: 'Every city', vi: 'Mọi thành phố' },
  sort: { en: 'Sort', vi: 'Sắp xếp' },
  soonest: { en: 'Soonest', vi: 'Sớm nhất' },
  festivals: { en: 'Big festivals first', vi: 'Lễ hội lớn trước' },
  interest: { en: 'Most interest', vi: 'Được quan tâm nhất' },
  none: { en: 'Nothing matches', vi: 'Không có sự kiện khớp' },
};

/** From how many events the sort and filters show. */
const FILTER_FROM = 6;

type Sort = 'soonest' | 'festivals' | 'interest';

export function UpcomingCards({ lang, items }: { lang: Lang; items: Card[] }) {
  const T = pick(COPY, lang);
  const [style, setStyle] = useState('');
  const [city, setCity] = useState('');
  const [sort, setSort] = useState<Sort>('soonest');
  const styles = useMemo(() => [...new Set(items.flatMap((e) => e.styles ?? []))].sort(), [items]);
  const cities = useMemo(() => [...new Map(items.map((e) => [e.city, e.cityLabel])).entries()], [items]);
  const shown = useMemo(() => {
    const at = (e: Card) => (e.startsAt ? Date.parse(e.startsAt) : Number.MAX_SAFE_INTEGER);
    return items
      .filter((e) => !style || (e.styles ?? []).includes(style))
      .filter((e) => !city || e.city === city)
      .sort((a, b) => sort === 'festivals' ? Number(!!b.festival?.flagship) - Number(!!a.festival?.flagship) || Number(!!b.festival) - Number(!!a.festival) || at(a) - at(b)
        : sort === 'interest' ? b.saveCount - a.saveCount || at(a) - at(b)
          : at(a) - at(b));
  }, [items, style, city, sort]);

  return (
    <div className="flex flex-col gap-4 pt-5">
      {items.length >= FILTER_FROM ? (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={T.sort}>
          {styles.length > 1 ? (
            <Picker label={T.style} value={style || 'all'} onChange={(v) => setStyle(v === 'all' ? '' : v)}
              options={[{ value: 'all', label: T.anyStyle }, ...styles.map((k) => ({ value: k, label: styleLabel(k, lang), aside: String(items.filter((e) => (e.styles ?? []).includes(k)).length) }))]}
              display={style ? styleLabel(style, lang) : T.anyStyle} />
          ) : null}
          {cities.length > 1 ? (
            <Picker label={T.city} value={city || 'all'} onChange={(v) => setCity(v === 'all' ? '' : v)}
              options={[{ value: 'all', label: T.anyCity }, ...cities.map(([k, l]) => ({ value: k, label: l[lang], aside: String(items.filter((e) => e.city === k).length) }))]}
              display={city ? cities.find(([k]) => k === city)?.[1][lang] : T.anyCity} />
          ) : null}
          <Picker<Sort> label={T.sort} value={sort} onChange={setSort}
            options={[{ value: 'soonest', label: T.soonest }, { value: 'festivals', label: T.festivals }, { value: 'interest', label: T.interest }]} />
        </div>
      ) : null}
      {shown.length ? <div className="kd-cards">{shown.map((e, i) => <EventCard key={e.id} e={e} i={i} lang={lang} />)}</div> : <p className="kd-t text-fog">{T.none}</p>}
    </div>
  );
}
