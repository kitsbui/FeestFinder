/**
 * A link inside the site. To a Kính đêm page it is a Next client navigation, prefetched on intent
 * (link-client.tsx), or as soon as it is in sight with `prefetch="viewport"`, which only the five
 * places of the bar and the tab bar take (owner, 2026-10-22); to a path the API serves
 * (/go/<event>, files) it is a plain link: a full load, never prefetched.
 */
import type { Lang } from './copy';
import NextLink from 'next/link';
import { isCutOver } from './cutover';
import { IntentLink, type LinkProps } from './link-client';

type Props = LinkProps & { prefetch?: 'viewport' };

export function KdLink({ href, scroll, prefetch, ...rest }: Props) {
  if (!isCutOver(href)) return <a href={href} {...rest} />;
  if (prefetch === 'viewport') return <NextLink href={href} scroll={scroll} {...rest} />;
  return <IntentLink href={href} scroll={scroll} {...rest} />;
}

/** The address of a page in the reader's language: a page in another language than Vietnamese is the same path with ?lang=<it>. */
export function inLang(href: string, lang: Lang): string {
  if (lang === 'vi' || /[?&]lang=/.test(href)) return href;
  const [path, hash] = href.split('#');
  return path + (path.includes('?') ? '&' : '?') + 'lang=' + lang + (hash !== undefined ? '#' + hash : '');
}
