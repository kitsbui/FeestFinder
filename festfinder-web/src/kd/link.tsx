/**
 * A link inside the site. To a Kính đêm page it is a Next client navigation; to a path the API
 * serves (/go/<event>, files) it is a plain link: a full load, never prefetched.
 */
import type { Lang } from './copy';
import NextLink from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { isCutOver } from './cutover';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string; scroll?: boolean; children?: ReactNode };

export function KdLink({ href, scroll, ...rest }: Props) {
  if (isCutOver(href)) return <NextLink href={href} scroll={scroll} {...rest} />;
  return <a href={href} {...rest} />;
}

/** The address of a page in the reader's language: a page in another language than Vietnamese is the same path with ?lang=<it>. */
export function inLang(href: string, lang: Lang): string {
  if (lang === 'vi' || /[?&]lang=/.test(href)) return href;
  const [path, hash] = href.split('#');
  return path + (path.includes('?') ? '&' : '?') + 'lang=' + lang + (hash !== undefined ? '#' + hash : '');
}
