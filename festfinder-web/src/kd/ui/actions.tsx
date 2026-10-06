/**
 * Actions: buttons, icon buttons, chips. A button with `href` is a link styled as a button.
 * Lime (`acc`) is the one action a screen exists for; there is at most one per screen.
 */
import { KdLink as Link } from '../link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import { g, type Family } from '../genre';

export type ButtonTone = 'default' | 'acc' | 'light' | 'dark' | 'ghost' | 'glass';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonLook {
  tone?: ButtonTone;
  size?: ButtonSize;
  pill?: boolean;
  block?: boolean;
}

export function buttonClass({ tone = 'default', size = 'md', pill, block }: ButtonLook, extra?: string) {
  return cx(
    'kd-btn',
    tone !== 'default' && `kd-btn-${tone}`,
    size !== 'md' && `kd-btn-${size}`,
    pill && 'kd-btn-pill',
    block && 'kd-btn-block',
    extra,
  );
}

type ButtonProps = ButtonLook & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ tone, size, pill, block, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass({ tone, size, pill, block }, className)} {...rest} />;
}

type LinkButtonProps = ButtonLook & AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  /** A full page load: for paths that are not Next pages (the API, /go/…) or that cross looks. */
  external?: boolean;
};

export function LinkButton({ tone, size, pill, block, className, href, external, ...rest }: LinkButtonProps) {
  const cls = buttonClass({ tone, size, pill, block }, className);
  if (external) return <a href={href} className={cls} {...rest} />;
  return <Link href={href} className={cls} {...rest} />;
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  line?: boolean;
  size?: 'sm' | 'md';
  glass?: boolean;
  /** A toggle (save, follow): announced as pressed, lime when on. */
  pressed?: boolean;
};

export function IconButton({ label, line, size = 'md', glass, pressed, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cx('kd-ib', line && 'kd-ib-line', size === 'sm' && 'kd-ib-sm', glass && 'kd-glass', className)}
      {...rest}
    />
  );
}

export function IconLink({ label, href, line, glass, size = 'md', className, external, children }: {
  label: string; href: string; line?: boolean; glass?: boolean; size?: 'sm' | 'md'; className?: string; external?: boolean; children: ReactNode;
}) {
  const cls = cx('kd-ib', line && 'kd-ib-line', size === 'sm' && 'kd-ib-sm', glass && 'kd-glass', className);
  if (external) return <a href={href} aria-label={label} title={label} className={cls}>{children}</a>;
  return <Link href={href} aria-label={label} title={label} className={cls}>{children}</Link>;
}

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  on?: boolean;
  family?: Family;
  count?: number | null;
};

/** A filter chip: on = paper fill. With a family, it leads with the genre marker. */
export function Chip({ on, family, count, className, children, type = 'button', ...rest }: ChipProps) {
  return (
    <button type={type} aria-pressed={!!on} className={cx('kd-chip', family && g(family), className)} {...rest}>
      {family ? <span className="kd-mk" aria-hidden="true" /> : null}
      {children}
      {count != null ? <span className="kd-chip-n">{count}</span> : null}
    </button>
  );
}

export function ChipLink({ on, family, count, href, children, className }: {
  on?: boolean; family?: Family; count?: number | null; href: string; children: ReactNode; className?: string;
}) {
  return (
    <Link href={href} aria-current={on ? 'true' : undefined} className={cx('kd-chip', on && 'kd-chip-on', family && g(family), className)} scroll={false}>
      {family ? <span className="kd-mk" aria-hidden="true" /> : null}
      {children}
      {count != null ? <span className="kd-chip-n">{count}</span> : null}
    </Link>
  );
}
