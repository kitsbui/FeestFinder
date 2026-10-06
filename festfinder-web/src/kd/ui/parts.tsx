/**
 * The small parts every screen is made of: tags, status, markers, cards, art, date blocks,
 * stats, avatars, accordions, emblems and passport stamps. All server-safe.
 */
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react/ssr';
import { cx } from '../cx';
import { g, type Family } from '../genre';

// ---- type ---------------------------------------------------------------------------

/** The mono label: 11px uppercase, +3% tracking. */
export function Mono({ children, className, as: As = 'span', ...rest }: HTMLAttributes<HTMLElement> & { as?: 'span' | 'p' | 'div' | 'dt' | 'time' }) {
  return <As className={cx('kd-m', className)} {...rest}>{children}</As>;
}

// ---- tags and status ----------------------------------------------------------------

export type TagTone = 'default' | 'glass' | 'acc' | 'bone' | 'line' | 'hot';

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
 * Event art: the cover when there is one, else the family's shapes. In lists, alternate the
 * plain and bone variants by index. `off` dims it (sold out, past, not chosen).
 */
export function Art({ family, cover, bone, off, className, style, children, alt = '' }: {
  family: Family; cover?: string | null; bone?: boolean; off?: boolean; className?: string; style?: CSSProperties; children?: ReactNode; alt?: string;
}) {
  return (
    <div className={cx('kd-art', g(family), bone && 'kd-b', off && 'kd-off', className)} style={style}>
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- covers come from the API's file storage and partners' CDNs
        <img src={cover} alt={alt} loading="lazy" decoding="async" className={cx('kd-cover', off && 'opacity-40 grayscale')} />
      ) : null}
      {children}
    </div>
  );
}

// ---- data ---------------------------------------------------------------------------

/** A day: the number, with the weekday and month in mono. `hi` = bone (the next show, today). */
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
export function Avatar({ name, src, size = 40, org, ring, acc, className }: {
  name: string; src?: string | null; size?: number; org?: boolean; ring?: boolean; acc?: boolean; className?: string;
}) {
  const initials = String(name || '').trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
  return (
    <span
      className={cx('kd-av', org && 'kd-av-sq', ring && 'kd-av-ring', acc && 'kd-av-acc', className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden={src ? undefined : true}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- profile photos come from the API's file storage
        <img src={src} alt={name} loading="lazy" />
      ) : (
        initials
      )}
    </span>
  );
}

// ---- disclosure ---------------------------------------------------------------------

/** A native <details> accordion. Give a group the same `name` to make it exclusive. */
export function Accordion({ summary, aside, children, open, name, small, className, id }: {
  summary: ReactNode; aside?: ReactNode; children: ReactNode; open?: boolean; name?: string; small?: boolean; className?: string; id?: string;
}) {
  return (
    <details className={cx('kd-acc', small && 'kd-sm', className)} open={open} name={name} id={id}>
      <summary>
        <span className="min-w-0">{summary}</span>
        {aside != null ? <span className="kd-m kd-num">{aside}</span> : null}
        <CaretDownIcon size={18} className="kd-chev" aria-hidden="true" />
      </summary>
      <div className="kd-acc-b">{children}</div>
    </details>
  );
}

// ---- badges and passport ------------------------------------------------------------

/** A badge's emblem: the family shape, or a mono number, on a ring of the family colour. */
export function Emblem({ family = 'free', n, off, small, className }: { family?: Family; n?: string | number | null; off?: boolean; small?: boolean; className?: string }) {
  return (
    <span className={cx('kd-emb', g(family), small && 'kd-sm', off && 'kd-off', className)} aria-hidden="true">
      {n != null && n !== '' ? <span className="kd-n">{n}</span> : <span className="kd-mk" />}
    </span>
  );
}

/** One attended event in the passport: a stamp tile, then the date and name. */
export function Stamp({ family, date, name, dim, href }: { family: Family; date: string; name: string; dim?: boolean; href?: string }) {
  const body = (
    <>
      <span className="kd-tile"><span className="kd-mk" aria-hidden="true" /></span>
      <span className="kd-m kd-num">{date}</span>
      <span className="kd-s kd-ell text-mist">{name}</span>
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
      <dd className="kd-t text-paper">{children}</dd>
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
