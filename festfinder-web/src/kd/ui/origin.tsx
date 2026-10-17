/**
 * Two kinds of listing, so nobody mistakes one for the other: posted (by an organiser, the
 * community, the team or an artist) and found by Feest Radar on another site, which nobody
 * on FeestFinder has posted yet (the API's `origin`, migration 032). Radar ones wear RadarTag; the
 * home page's list splits them with its "Nguồn" filter, the artist directory with its tabs.
 */
import { BroadcastIcon } from '@phosphor-icons/react/ssr';
import { pick, type Lang } from '../copy';
import { cx } from '../cx';

export type Origin = 'posted' | 'radar';

export const ORIGIN = {
  radar: { en: 'Radar', vi: 'Radar' },
  radarLong: { en: 'Found by Feest Radar', vi: 'Do Feest Radar tìm thấy' },
  all: { en: 'All', vi: 'Tất cả' },
  posted: { en: 'Posted', vi: 'Đã đăng' },
  tabs: { en: 'Who listed it', vi: 'Nguồn đăng' },
};

/** "Radar", with its icon; read out in full. `glass` over a picture. */
export function RadarTag({ lang, glass, className }: { lang: Lang; glass?: boolean; className?: string }) {
  const T = pick(ORIGIN, lang);
  return (
    <span className={cx('kd-tag shrink-0', glass && 'kd-tag-glass text-fg-1', className)} title={T.radarLong}>
      <BroadcastIcon size={12} aria-hidden="true" />
      <span aria-hidden="true">{T.radar}</span>
      <span className="sr-only">{T.radarLong}</span>
    </span>
  );
}
