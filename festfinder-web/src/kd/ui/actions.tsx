/**
 * Actions: buttons, icon buttons, chips. A button with `href` is a link styled as a button.
 * Four tones: `acc` is the one action a screen exists for (the turquoise → lime gradient, at most
 * one per screen, `glow` on the one that leads the page), `default` the outlined secondary,
 * `ghost` a text action in a row, `danger` only inside a confirm dialog.
 */
import { KdLink as Link } from '../link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';
import { g, type Family } from '../genre';

export type ButtonTone = 'default' | 'acc' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonLook {
  tone?: ButtonTone;
  size?: ButtonSize;
  pill?: boolean;
  block?: boolean;
  /** The primary that leads the screen breathes (a soft lime halo); one per screen, never in a list. */
  glow?: boolean;
}

export function buttonClass({ tone = 'default', size = 'md', pill, block, glow }: ButtonLook, extra?: string) {
  return cx(
    'kd-btn',
    tone !== 'default' && `kd-btn-${tone}`,
    size !== 'md' && `kd-btn-${size}`,
    pill && 'kd-btn-pill',
    block && 'kd-btn-block',
    glow && tone === 'acc' && 'kd-btn-glow',
    extra,
  );
}

type ButtonProps = ButtonLook & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ tone, size, pill, block, glow, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass({ tone, size, pill, block, glow }, className)} {...rest} />;
}

type LinkButtonProps = ButtonLook & AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  /** A full page load: for paths that are not Next pages (the API, /go/…) or that cross looks. */
  external?: boolean;
};

export function LinkButton({ tone, size, pill, block, glow, className, href, external, ...rest }: LinkButtonProps) {
  const cls = buttonClass({ tone, size, pill, block, glow }, className);
  if (external) return <a href={href} className={cls} {...rest} />;
  return <Link href={href} className={cls} {...rest} />;
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  line?: boolean;
  size?: 'sm' | 'md';
  glass?: boolean;
  /** A toggle (save, follow): announced as pressed, turquoise when on. */
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


type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  on?: boolean;
  family?: Family;
  count?: number | null;
};

/** A filter chip: on = a light fill. With a family, it leads with the turquoise marker. */
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
