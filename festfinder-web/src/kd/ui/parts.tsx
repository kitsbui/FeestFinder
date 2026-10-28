/**
 * The small parts every screen is made of: tags, status, markers, cards, art, date blocks,
 * stats, avatars, accordions, emblems and passport stamps. All server-safe.
 */
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react/ssr';
import { cx } from '../cx';
import { g, type Family } from '../genre';
import { frameStyle } from '../frame';
import type { Fit } from '../img';

// ---- type ---------------------------------------------------------------------------

/** The mono label: 11px uppercase, +3% tracking. */
export function Mono({ children, className, as: As = 'span', ...rest }: HTMLAttributes<HTMLElement> & { as?: 'span' | 'p' | 'div' | 'dt' | 'time' }) {
  return <As className={cx('kd-m', className)} {...rest}>{children}</As>;
}

// ---- tags and status ----------------------------------------------------------------

/** acc: information (new, chosen, free) · featured: the gradient, only Nổi bật and a flagship festival. */
export type TagTone = 'default' | 'glass' | 'acc' | 'featured' | 'bone' | 'line' | 'bad';

export function Tag({ tone = 'default', className, children }: { tone?: TagTone; className?: string; children: ReactNode }) {
  return <span className={cx('kd-tag', tone !== 'default' && `kd-tag-${tone}`, className)}>{children}</span>;
}

export type StatusTone = 'ok' | 'warn' | 'bad' | 'live' | 'none';

/** A dot and a word: status is never colour alone. */
export function Status({ tone = 'none', className, children }: { tone?: StatusTone; className?: string; children: ReactNode }) {
  return <span className={cx('kd-st', tone !== 'none' && `kd-${tone}`, className)}>{children}</span>;
}

/** The genre's shape at text size. */
export function Marker({ family, className, style }: { family?: Family; className?: string; style?: CSSProperties }) {
  // data-f wins over a family set on an ancestor (kd.css), so a marker can differ from its row.
  return <span aria-hidden="true" data-f={family} className={cx('kd-mk', className)} style={style} />;
}

// ---- surfaces -----------------------------------------------------------------------

export function Card({ className, children, as: As = 'div', ...rest }: HTMLAttributes<HTMLElement> & { as?: 'div' | 'section' | 'article' | 'aside' | 'li' }) {
  return <As className={cx('kd-card', className)} {...rest}>{children}</As>;
}

export function BoneCard({ className, children, as: As = 'div', ...rest }: HTMLAttributes<HTMLElement> & { as?: 'div' | 'section' | 'article' | 'li' }) {
  return <As className={cx('kd-bonecard', className)} {...rest}>{children}</As>;
}

/**
 * Two characters for a tile too small for a name: the first letter or digit of each of the first two
 * words ("Headsmasher 5" → H5), or the first two of a single word ("Zamna" → ZA). Whole characters
 * (a Vietnamese mark, a CJK character, never half an emoji); punctuation and symbols are skipped.
 */
let segmenter: Intl.Segmenter | null | undefined;
/** Made on the first monogram, not while the page's script loads. */
function graphemes() {
  if (segmenter === undefined) segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  return segmenter;
}
const chars = (s: string) => {
  const seg = graphemes();
  return (seg ? Array.from(seg.segment(s), (x) => x.segment) : Array.from(s)).filter((c) => /[\p{L}\p{N}]/u.test(c));
};
export function monogram(title: string): string {
  const words = title.trim().split(/\s+/).map(chars).filter((w) => w.length);
  const picked = words.length > 1 ? [words[0][0], words[1][0]] : (words[0] ?? []).slice(0, 2);
  return picked.map((c) => (c.toUpperCase().length === c.length ? c.toUpperCase() : c)).join('');
}

/**
 * Event art: the cover when there is one; under it (and alone without one) a text tile, the name
 * set large with `meta` (a style, a day) beneath, or a monogram when the tile is under 160px wide;
 * on a page that names the event beside it, a poster of its date instead (`poster`).
 * No shapes and no gradients stand in for a picture. `off` dims it (sold out, past, not chosen).
 */
export function Art({ family, cover, off, className, style, children, alt = '', title, kicker, meta, poster, layout = 'card', eager = false, fit }: {
  family: Family; cover?: string | null; off?: boolean; className?: string; style?: CSSProperties; children?: ReactNode; alt?: string;
  /** The page's main picture (a hero, the home page's first picture): fetched first, with high priority, never lazily. One per page. */
  eager?: boolean;
  /** The box it is drawn in (kd/img.ts, kd/fits.ts): a stored cover then loads as a copy of that size (/img). Without it, the
   *  link itself: a cover not saved yet, which /img does not know. */
  fit?: Fit;
  /** The name a text tile shows when there is no cover, or the cover does not load. */
  title?: string | null;
  /** The style, in the information colour, at the start of the line under the name ("Hard techno"). */
  kicker?: string | null;
  /** The rest of that line ("T7 24.10"). */
  meta?: string | null;
  /** Where other parts sit on the tile: `card` (a tag and the save button on top), `banner` (a profile
   *  cover an avatar overlaps at its foot: one line, high up), `hero` (a back button above, a countdown below),
   *  `mono` (a person without a photo: the initials, large, at any size). */
  layout?: 'card' | 'banner' | 'hero' | 'mono';
  /** Instead of the name, for a hero whose page sets the name in its H1 beside it (design v2 phase 8): the
   *  date set large (`big`) and a line under it, `kicker` first. The name is never printed twice. */
  poster?: { big: string; line?: string | null } | null;
}) {
  return (
    <div className={cx('kd-art', g(family), off && 'kd-off', layout !== 'card' && `kd-art-${layout}`, className)} style={style}>
      {poster ? (
        <span className="kd-art-p" aria-hidden="true"><b data-t={poster.big} /><i data-k={kicker ?? ''} data-m={poster.line ? (kicker ? ' · ' : '') + poster.line : ''} /></span>
      ) : title ? (
        <>
          {/* Drawn by CSS from these attributes (theme.css): the name is not page text a second time beside the card's own title. */}
          <span className="kd-art-t" aria-hidden="true"><b data-t={title} /><i data-k={kicker ?? ''} data-m={meta ? (kicker ? ' · ' : '') + meta : ''} /></span>
          <span className="kd-art-m" aria-hidden="true"><b data-t={monogram(title)} /><i data-k={kicker ?? ''} /></span>
        </>
      ) : null}
      {cover ? (
        <img src={cover} {...fit?.attrs(cover, !eager)} alt={alt} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} decoding="async" referrerPolicy="no-referrer" className={cx('kd-cover', off && 'opacity-40 grayscale')} style={frameStyle(cover)} />
      ) : null}
      {children}
    </div>
  );
}

// ---- data ---------------------------------------------------------------------------

/** A day: the number, with the weekday and month in mono. `hi` = the light block (the next show, today). */
export function DateBlock({ day, top, bottom, hi, className }: { day: string | number; top?: string; bottom?: string; hi?: boolean; className?: string }) {
  return (
    <div className={cx('kd-dblk', hi && 'kd-dblk-hi', className)}>
      {top ? <span className="kd-mm">{top}</span> : null}
      <span className="kd-dd">{day}</span>
      {bottom ? <span className="kd-mm">{bottom}</span> : null}
    </div>
  );
}

export function Stat({ value, label, className }: { value: ReactNode; label: ReactNode; className?: string }) {
  return (
    <div className={cx('kd-stat', className)}>
      <span className="kd-v">{value}</span>
      <span className="kd-m">{label}</span>
    </div>
  );
}

export function StatRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('flex flex-wrap gap-y-4', className)}>{children}</div>;
}

/** People are circles, organisers rounded squares. `ring` sits above a cover it overlaps. */
export function Avatar({ name, src, size = 40, org, ring, acc, className, eager = false, fit }: {
  name: string; src?: string | null; size?: number; org?: boolean; ring?: boolean; acc?: boolean; className?: string;
  /** Never lazily: 'high' when it is the page's main picture (an artist's page without a cover). */
  eager?: boolean | 'high';
  /** Its box (kd/img.ts `square`), for a stored photo: a copy its size (/img). Without it, the link itself (a form's preview). */
  fit?: Fit;
}) {
  const initials = String(name || '').trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
  return (
    <span
      className={cx('kd-av', org && 'kd-av-sq', ring && 'kd-av-ring', acc && 'kd-av-acc', className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden={src ? undefined : true}
    >
      {/* Under the photo, so a link that does not open (ui/covers.tsx) leaves the initials. Drawn by CSS
          (kd.css .kd-av-i), so a button around an avatar is named by its label alone (WCAG 2.5.3). */}
      <span className="kd-av-i" data-i={initials} aria-hidden="true" />
      {src ? (
         
        <img src={src} {...fit?.attrs(src, !eager)} alt={name} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager === 'high' ? 'high' : undefined} decoding="async" referrerPolicy="no-referrer" style={frameStyle(src)} />
      ) : null}
    </span>
  );
}

// ---- disclosure ---------------------------------------------------------------------

/** A native <details> accordion. Give a group the same `name` to make it exclusive. */
export function Accordion({ summary, aside, children, open, name, small, className, id, onToggle }: {
  summary: ReactNode; aside?: ReactNode; children: ReactNode; open?: boolean; name?: string; small?: boolean; className?: string; id?: string;
  onToggle?: (open: boolean) => void;
}) {
  return (
    <details className={cx('kd-acc', small && 'kd-sm', className)} open={open} name={name} id={id} onToggle={onToggle ? (e) => onToggle(e.currentTarget.open) : undefined}>
      <summary>
        <span className="min-w-0 flex-1">{summary}</span>
        {aside != null ? <span className="kd-m kd-num">{aside}</span> : null}
        <CaretDownIcon size={18} className="kd-chev" aria-hidden="true" />
      </summary>
      <div className="kd-acc-b">{children}</div>
    </details>
  );
}

// ---- badges and passport ------------------------------------------------------------

/** A badge's emblem: a marker, or a number, on a ring of the information colour. */
export function Emblem({ family = 'free', n, off, small, className, icon }: { family?: Family; n?: string | number | null; off?: boolean; small?: boolean; className?: string; icon?: ReactNode }) {
  return (
    <span className={cx('kd-emb', g(family), small && 'kd-sm', off && 'kd-off', className)} aria-hidden="true">
      {n != null && n !== '' ? <span className="kd-n">{n}</span> : icon ? <span className="kd-emb-i">{icon}</span> : <span className="kd-mk" />}
    </span>
  );
}

/** A small turn of a stamp, the same every time for the same night (-5° to 5°): stamped by hand, not printed. */
function tilt(seed: string): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  return `${(Math.abs(h) % 11) - 5}deg`;
}

/**
 * A night in the passport (design v2 phase 8): each stamp its own, the night's cover in the information
 * colour or, without one, the event's initials, the city along its foot, a turn of its own.
 */
export function Stamp({ family, date, name, dim, href, cover, city, fit }: {
  family: Family; date: string; name: string; dim?: boolean; href?: string; cover?: string | null; city?: string | null;
  /** The stamp's box (kd/img.ts), for a stored cover: a copy its size. */
  fit?: Fit;
}) {
  const body = (
    <>
      <span className="kd-tile" style={{ '--tilt': tilt(name + date) } as CSSProperties} aria-hidden="true">
        {cover ? <img className="kd-stamp-img" src={cover} {...fit?.attrs(cover, true)} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" /> : <b className="kd-stamp-mono" data-t={monogram(name)} />}
        {city ? <i className="kd-stamp-city" data-c={city} /> : null}
      </span>
      <span className="kd-m kd-num">{date}</span>
      <span className="kd-s kd-ell text-fg-2">{name}</span>
    </>
  );
  const cls = cx('kd-stamp', g(family), dim && 'kd-dim');
  return href ? <a href={href} className={cls}>{body}</a> : <div className={cls}>{body}</div>;
}

// ---- layout -------------------------------------------------------------------------

/** A section header: a title on the left, an action or count on the right. */
export function SectionHead({ title, aside, as: As = 'h2', className, id }: { title: ReactNode; aside?: ReactNode; as?: 'h2' | 'h3'; className?: string; id?: string }) {
  return (
    <div className={cx('kd-sec', className)}>
      <As className="kd-d3" id={id}>{title}</As>
      {aside}
    </div>
  );
}

/** A labelled line in a fact list. */
export function Fact({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <dt className="kd-m">{label}</dt>
      <dd className="kd-t text-fg-1">{children}</dd>
    </div>
  );
}

/** A horizontal progress bar. */
export function BarTrack({ value, max, family, className, label }: { value: number; max: number; family?: Family; className?: string; label?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={cx('kd-bar-track', family && g(family), className)} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
      <div className="kd-bar-fill" style={{ width: pct + '%', background: family ? 'var(--g)' : undefined }} />
    </div>
  );
}
