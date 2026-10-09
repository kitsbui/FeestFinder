/**
 * A link inside the site. To a Kính đêm page it is a Next client navigation; to a path the API
 * serves (/ops, /go/<event>, files) it is a plain link: a full load, never prefetched.
 */
import NextLink from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { isCutOver } from './cutover';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string; scroll?: boolean; children?: ReactNode };

export function KdLink({ href, scroll, ...rest }: Props) {
  if (isCutOver(href)) return <NextLink href={href} scroll={scroll} {...rest} />;
  return <a href={href} {...rest} />;
}

/** The address of a page in the reader's language: an English page is the same path with ?lang=en. */
export function inLang(href: string, lang: 'vi' | 'en'): string {
  if (lang !== 'en' || /[?&]lang=/.test(href)) return href;
  const [path, hash] = href.split('#');
  return path + (path.includes('?') ? '&' : '?') + 'lang=en' + (hash !== undefined ? '#' + hash : '');
}
