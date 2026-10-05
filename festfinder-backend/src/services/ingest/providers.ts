import { L, type Localized } from '../../lib/i18n.ts';
import { icsAdapter } from './adapters/ics.ts';
import { ticketmasterAdapter } from './adapters/ticketmaster.ts';
import { websiteAdapter } from './adapters/website.ts';
import type { Authority } from './confidence.ts';
import { hostOf } from './normalize.ts';
import type { SourceAdapter } from './types.ts';

/** The adapters a source can use. Adding one here is all a new kind of source needs. */
export const ADAPTERS: Record<string, SourceAdapter> = {
  website: websiteAdapter,
  ics: icsAdapter,
  ticketmaster: ticketmasterAdapter,
};
export const ADAPTER_IDS = Object.keys(ADAPTERS) as [string, ...string[]];

/** Who a fact came from, as shown in /ops and on the event page. */
export const PROVIDER_LABEL: Record<string, Localized> = {
  organizer: L('Organiser', 'Nhà tổ chức'),
  community: L('Community', 'Cộng đồng'),
  team: L('FeestFinder team', 'Đội FeestFinder'),
  artist: L('Artist', 'Nghệ sĩ'),
  website: L('Website', 'Trang web'),
  ics: L('Calendar feed', 'Lịch ICS'),
  ticketmaster: L('Ticketmaster', 'Ticketmaster'),
  resident_advisor: L('Resident Advisor', 'Resident Advisor'),
  facebook: L('Facebook', 'Facebook'),
  instagram: L('Instagram', 'Instagram'),
  link: L('Link', 'Liên kết'),
};

/**
 * Sites FeestFinder never fetches (their terms forbid it, or there is nothing public to
 * read). A link to them is still kept as a source, as a person saw and pasted it.
 */
const LINK_ONLY: [RegExp, string][] = [
  [/(^|\.)(ra\.co|residentadvisor\.net)$/, 'resident_advisor'],
  [/(^|\.)(facebook\.com|fb\.me|fb\.com)$/, 'facebook'],
  [/(^|\.)instagram\.com$/, 'instagram'],
];

/** Which provider a pasted link belongs to. */
export function providerOfLink(url: string): string {
  const host = hostOf(url) ?? '';
  return LINK_ONLY.find(([re]) => re.test(host))?.[1] ?? 'link';
}

/** True for a link the ingestion must not fetch. */
export function isLinkOnly(url: string): boolean {
  const host = hostOf(url) ?? '';
  return LINK_ONLY.some(([re]) => re.test(host));
}

export const PROVIDER_CONFIDENCE: Record<Authority, number> = { official: 90, ticketing: 80, listing: 60, community: 40 };
