/**
 * Two kinds of listing, so nobody mistakes one for the other: posted (by an organiser, the
 * community, the team or an artist) and found by FeestFinder Radar on another site, which nobody
 * on FeestFinder has posted yet (the API's `origin`, migration 032). Radar ones wear RadarTag; the
 * event and artist directories split them with OriginTabs.
 */
import { BroadcastIcon } from '@phosphor-icons/react/ssr';
import { pick, type Lang } from '../copy';
import { cx } from '../cx';
import { Tabs } from './shell';

export type Origin = 'posted' | 'radar';

export const ORIGIN = {
  radar: { en: 'Radar', vi: 'Radar' },
  radarLong: { en: 'Found by FeestFinder Radar', vi: 'Do FeestFinder Radar tìm thấy' },
  all: { en: 'All', vi: 'Tất cả' },
  posted: { en: 'Posted', vi: 'Đã đăng' },
  tabs: { en: 'Who listed it', vi: 'Nguồn đăng' },
};

/** "Radar", with its icon; read out in full. `glass` over a picture. */
export function RadarTag({ lang, glass, className }: { lang: Lang; glass?: boolean; className?: string }) {
  const T = pick(ORIGIN, lang);
  return (
    <span className={cx('kd-tag shrink-0', glass && 'kd-tag-glass text-paper', className)} title={T.radarLong}>
      <BroadcastIcon size={12} aria-hidden="true" />
      <span aria-hidden="true">{T.radar}</span>
      <span className="sr-only">{T.radarLong}</span>
    </span>
  );
}

/** All · Posted · Radar, with their counts when known. `null` is all. */
export function OriginTabs({ lang, value, onChange, counts, className }: {
  lang: Lang; value: Origin | null; onChange: (v: Origin | null) => void; counts?: { posted: number; radar: number } | null; className?: string;
}) {
  const T = pick(ORIGIN, lang);
  return (
    <Tabs
      label={T.tabs}
      current={value ?? 'all'}
      onSelect={(k) => onChange(k === 'all' ? null : (k as Origin))}
      className={className}
      items={[
        { key: 'all', label: T.all, count: counts ? counts.posted + counts.radar : null },
        { key: 'posted', label: T.posted, count: counts?.posted ?? null },
        { key: 'radar', label: <><BroadcastIcon size={14} aria-hidden="true" />{T.radar}</>, count: counts?.radar ?? null },
      ]}
    />
  );
}
