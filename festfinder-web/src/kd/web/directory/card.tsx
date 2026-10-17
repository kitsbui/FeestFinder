/**
 * An artist in the directory (design v2 phase 3): a square picture (their photo, else their cover,
 * else their initials large) with whether they take bookings and "Radar" over it, then the name,
 * what they do and where, the next show, their styles, and for a name nobody runs, "Đây là tôi".
 * The whole of it comes from GET /artists; follower counts are not part of it.
 */
import { CalendarCheckIcon, SealCheckIcon } from '@phosphor-icons/react/ssr';
import { fill, pick, type Lang, type Pair } from '../../copy';
import { whenShort } from '../../format';
import { familyOf } from '../../genre';
import { KdLink as Link, inLang } from '../../link';
import { RadarTag } from '../../ui/origin';
import { Art, Status, type StatusTone } from '../../ui/parts';
import { ClaimButton } from '../profile/parts';
import { DIR } from './copy';
import type { DirArtist } from './model';

const text = (v: Pair | null | undefined, lang: Lang) => (v ? v[lang] || v.vi || v.en || '' : '');

const BOOKING_TONE: Record<string, StatusTone> = { available: 'ok', limited: 'warn', touring: 'live' };

export function ArtistCard({ a, lang }: { a: DirArtist; lang: Lang }) {
  const T = pick(DIR, lang);
  const href = inLang('/a/' + encodeURIComponent(a.slug), lang);
  // The art takes the family of the genre they play most (the API's `genre`), else of their first
  // style that has one; none known, a plain tile.
  const fam = [familyOf(a.genre), ...a.styles.map((s) => familyOf(s.genre))].find((f) => f !== 'free');
  const line = [
    a.roles.map((r) => text(r.label, lang)).join(' / '),
    a.basedIn ? text(a.basedIn.label, lang) || a.basedIn.city : '',
  ].filter(Boolean).join(' · ');
  // "Not taking bookings" says nothing a directory needs.
  const booking = a.booking && a.booking.key !== 'unavailable' ? a.booking : null;
  const next = a.nextShow;
  const id = 'dir-a-' + a.id;

  return (
    <article className="flex min-w-0 flex-col gap-3" aria-labelledby={id}>
      <div className="relative">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
          <Art family={fam ?? 'free'} cover={a.imageUrl ?? a.coverUrl} title={a.name} layout="mono" className="aspect-square" />
        </Link>
        {booking || a.origin === 'radar' ? (
          <span className="pointer-events-none absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            {booking ? <span className="kd-tag kd-tag-glass text-fg-1"><Status tone={BOOKING_TONE[booking.key] ?? 'none'}>{text(booking.label, lang)}</Status></span> : null}
            {a.origin === 'radar' ? <RadarTag lang={lang} glass /> : null}
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id={id} className="kd-h flex min-w-0 items-center gap-2">
          <Link href={href} className="kd-ell hover:underline">{a.name}</Link>
          {a.verified ? <SealCheckIcon size={18} weight="fill" className="shrink-0 text-info" role="img" aria-label={T.verified} /> : null}
        </h2>
        {line ? <span className="kd-s kd-ell">{line}</span> : null}
        {next ? (
          <span className="kd-s flex min-w-0 items-center gap-1.5">
            <CalendarCheckIcon size={16} className="shrink-0 text-fg-3" aria-hidden="true" />
            <span className="kd-ell">
              {T.next}{' '}
              <span className="kd-num">{whenShort({ startsOn: next.startsOn }, lang)} · </span>
              <Link href={inLang('/e/' + encodeURIComponent(next.slug), lang)} className="text-fg-2 underline decoration-line-2 underline-offset-2 hover:decoration-fg-2">{next.title}</Link>
              {next.cityLabel ? ' · ' + text(next.cityLabel, lang) : ''}
            </span>
          </span>
        ) : null}
        {/* A name nobody runs (/a/radar): where it was seen, and the way to claim it. */}
        {a.source?.kind === 'lineup' ? (
          <span className="kd-s kd-ell">
            {fill(T.fromLineup, { t: '' })}
            <Link href={inLang('/e/' + encodeURIComponent(a.source.event.slug), lang)} className="text-fg-2 underline decoration-line-2 underline-offset-2 hover:decoration-fg-2">{a.source.event.title}</Link>
          </span>
        ) : null}
        {a.styles.length ? (
          <span className="flex flex-wrap gap-1.5 pt-1">
            {a.styles.slice(0, 3).map((s) => (
              <span key={s.key} className="kd-tag">{text(s.label, lang)}</span>
            ))}
          </span>
        ) : null}
        {a.kind && a.kind !== 'owned' ? <ClaimButton lang={lang} kind="artist" name={a.name} size="sm" className="mt-1.5 self-start" /> : null}
      </div>
    </article>
  );
}
