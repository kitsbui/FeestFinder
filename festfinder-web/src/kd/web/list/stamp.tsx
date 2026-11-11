'use client';
/**
 * An event as a stamp on the home page (owner, 2026-11-06): its logo whole, else its cover in the
 * information colour, else its initials, with a turn of its own (the passport's stamps' look,
 * ui/parts.tsx Stamp); a night under way bounces, on the calendar and on the map.
 */
import { useState } from 'react';
import { cx } from '../../cx';
import { square } from '../../img';
import { monogram, tilt } from '../../ui/parts';
import type { HomeEvent } from './calendar';

/** Stamps are drawn from about 16 to 64px: one ladder for all. */
const BOX = square(64);

/** What a stamp shows, for the calendar and for the map's pins (kd/map/kd-map.ts draws its own). */
export function stampOf(e: Pick<HomeEvent, 'id' | 'title' | 'logoUrl' | 'coverUrl'>) {
  const url = e.logoUrl || e.coverUrl;
  return { src: url ? BOX.attrs(url, true).src : null, logo: !!e.logoUrl, mono: monogram(e.title), tilt: tilt(e.id) };
}

/** The night under way: it started and has not ended (a night with no end counts six hours). */
export function isLive(e: Pick<HomeEvent, 'startsAt' | 'endsAt'>, now: number): boolean {
  if (!now || !e.startsAt) return false;
  const from = Date.parse(e.startsAt), to = e.endsAt ? Date.parse(e.endsAt) : from + 6 * 3_600_000;
  return from <= now && now < to;
}

export function EventStamp({ e, live }: { e: Pick<HomeEvent, 'id' | 'title' | 'logoUrl' | 'coverUrl'>; live?: boolean }) {
  const s = stampOf(e);
  const url = e.logoUrl || e.coverUrl;
  const [bad, setBad] = useState(false);
  return (
    <span className={cx(live && 'kd-bounce')} aria-hidden="true">
      <span className="kd-cstamp" style={{ '--tilt': s.tilt } as React.CSSProperties}>
        {url && !bad ? (
          <img className={s.logo ? 'kd-cstamp-logo' : 'kd-stamp-img'} {...BOX.attrs(url, true)} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBad(true)}
            // A picture that failed before React arrived fired its error to nobody: the stamp is checked as it mounts.
            ref={(img) => { if (img?.complete && !img.naturalWidth && img.currentSrc) setBad(true); }} />
        ) : <b className="kd-stamp-mono" data-t={s.mono} />}
      </span>
    </span>
  );
}
