/**
 * An artist in the directory: the family's shapes with their photo or initials over them (the
 * profile's cover and avatar, small), then the name, what they do and where, their styles,
 * the next show, and whether they take bookings. The whole of it comes from GET /artists;
 * follower counts are not part of it.
 */
import { CalendarCheckIcon, SealCheckIcon } from '@phosphor-icons/react/ssr';
import { pick, type Lang, type Pair } from '../../copy';
import { cx } from '../../cx';
import { whenShort } from '../../format';
import { familyOf, g } from '../../genre';
import { KdLink as Link, inLang } from '../../link';
import { Art, Avatar, Status, type StatusTone } from '../../ui/parts';
import { DIR } from './copy';
import type { DirArtist } from './model';

const text = (v: Pair | null | undefined, lang: Lang) => (v ? v[lang] || v.vi || v.en || '' : '');

const BOOKING_TONE: Record<string, StatusTone> = { available: 'ok', limited: 'warn', touring: 'live' };

export function ArtistCard({ a, i, lang }: { a: DirArtist; i: number; lang: Lang }) {
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
    <article className="flex min-w-0 flex-col" aria-labelledby={id}>
      <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
        {fam ? <Art family={fam} bone={i % 2 === 1} className="h-24" /> : <div className="kd-art h-24" />}
      </Link>
      <div className="flex items-end justify-between gap-3 pl-3">
        {/* The name is in the heading below. */}
        <span aria-hidden="true" className="-mt-8 flex"><Avatar ring name={a.name} src={a.imageUrl} size={64} /></span>
        {booking ? <Status tone={BOOKING_TONE[booking.key] ?? 'none'}>{text(booking.label, lang)}</Status> : null}
      </div>
      <div className="flex min-w-0 flex-col gap-1.5 pt-3">
        <h2 id={id} className="kd-h flex min-w-0 items-center gap-2">
          <Link href={href} className="kd-ell hover:underline">{a.name}</Link>
          {a.verified ? <SealCheckIcon size={18} weight="fill" className="shrink-0 text-acc" role="img" aria-label={T.verified} /> : null}
        </h2>
        {line ? <span className="kd-s kd-ell">{line}</span> : null}
        {a.styles.length ? (
          <span className="flex flex-wrap gap-1.5 pt-0.5">
            {a.styles.slice(0, 3).map((s) => {
              const f = familyOf(s.genre);
              return (
                <span key={s.key} className={cx('kd-tag', f !== 'free' && g(f))}>
                  {f !== 'free' ? <span className="kd-mk" aria-hidden="true" /> : null}
                  {text(s.label, lang)}
                </span>
              );
            })}
          </span>
        ) : null}
        {next ? (
          <span className="kd-s flex min-w-0 items-center gap-1.5 pt-0.5">
            <CalendarCheckIcon size={16} className="shrink-0 text-fog" aria-hidden="true" />
            <span className="kd-ell">
              {T.next}{' '}
              <Link href={inLang('/e/' + encodeURIComponent(next.slug), lang)} className="text-mist hover:underline">{next.title}</Link>
              <span className="kd-num">{' · ' + whenShort({ startsOn: next.startsOn }, lang)}</span>
              {next.cityLabel ? ' · ' + text(next.cityLabel, lang) : ''}
            </span>
          </span>
        ) : null}
      </div>
    </article>
  );
}
