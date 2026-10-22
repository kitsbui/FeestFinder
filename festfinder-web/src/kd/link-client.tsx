'use client';
/**
 * A link to a page of this app that prefetches it on intent (owner, 2026-10-22): once, when a
 * pointer comes over it, a finger touches it or it takes focus, never because it came into sight.
 * A page full of cards fetches nothing for them until someone reaches for one. kd/link.tsx picks it.
 */
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, type AnchorHTMLAttributes, type ReactNode } from 'react';

export type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string; scroll?: boolean; children?: ReactNode };

export function IntentLink({ href, onPointerEnter, onTouchStart, onFocus, ...rest }: LinkProps) {
  const router = useRouter();
  const warmed = useRef<string | null>(null);
  const warm = () => {
    if (warmed.current === href) return;
    warmed.current = href;
    router.prefetch(href);
  };
  return (
    <NextLink
      href={href}
      prefetch={false}
      onPointerEnter={(e) => { onPointerEnter?.(e); warm(); }}
      onTouchStart={(e) => { onTouchStart?.(e); warm(); }}
      onFocus={(e) => { onFocus?.(e); warm(); }}
      {...rest}
    />
  );
}
