import type { Localized } from '../lib/i18n.ts';
import { ARTIST_LINK, cleanLink, type ArtistLink } from '../lib/network.ts';

/*
 * Organisers as a network profile: the channels a promoter, club or festival keeps, beside
 * the website column it always had.
 */

/** The channels an organiser can list. */
export const ORG_LINKS: ArtistLink[] = ['instagram', 'facebook', 'tiktok', 'x', 'youtube', 'soundcloud', 'spotify'];

export function presentOrgLinks(o: { links?: Record<string, string> | null }): { kind: ArtistLink; label: Localized; url: string }[] {
  const links = o.links ?? {};
  return ORG_LINKS.filter((k) => links[k]).map((k) => ({ kind: k, label: ARTIST_LINK.label[k], url: links[k] }));
}

/** The links from a form, each on its own site, or the kind that is not. */
export function cleanOrgLinks(current: Record<string, string> | null, patch: Record<string, string | null>): { links: Record<string, string> } | { bad: ArtistLink } {
  const links: Record<string, string> = { ...(current ?? {}) };
  for (const [k, v] of Object.entries(patch)) {
    const kind = k as ArtistLink;
    if (!ORG_LINKS.includes(kind)) continue;
    if (!v) { delete links[kind]; continue; }
    const clean = cleanLink(kind, v);
    if (!clean) return { bad: kind };
    links[kind] = clean;
  }
  return { links };
}
