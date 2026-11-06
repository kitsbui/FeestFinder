import { cityOf } from '../lib/places.ts';
import { isoIn } from '../lib/time.ts';

/**
 * ICS (iCalendar) utilities for building calendar feeds.
 * RFC 5545 format: https://tools.ietf.org/html/rfc5545
 */

export interface IcsEvent {
  id: string;
  slug: string;
  title: string;
  city: string;
  venue_name: string | null;
  address: string | null;
  area: string | null;
  starts_at: Date;
  ends_at: Date;
  updated_at: Date | null;
  description: { vi?: string; en?: string } | null;
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Folds a line at 75 octets, as RFC 5545 asks. */
const fold = (line: string) => {
  const out: string[] = [];
  let rest = line;
  while (Buffer.byteLength(rest) > 75) {
    let cut = 75;
    while (Buffer.byteLength(rest.slice(0, cut)) > 75) cut--;
    out.push(rest.slice(0, cut));
    rest = ' ' + rest.slice(cut);
  }
  out.push(rest);
  return out.join('\r\n');
};

export function buildIcs(opts: {
  events: IcsEvent[];
  calendarName: string;
  baseUrl: string;
  now: Date;
  refreshable?: boolean; // Add refresh interval and TTL (for public feeds)
  productId?: string; // Custom PRODID (defaults to Events calendar)
  lang?: 'vi' | 'en'; // The description's language first (default vi)
}): string {
  const [first, second] = opts.lang === 'en' ? ['en', 'vi'] as const : ['vi', 'en'] as const;
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const local = (d: Date, tz: string) => isoIn(d, tz).slice(0, 19).replace(/[-:]/g, '');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//FeestFinder//${opts.productId ?? 'Events calendar'}//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(opts.calendarName)}`,
    ...(opts.refreshable ? ['REFRESH-INTERVAL;VALUE=DURATION:PT6H', 'X-PUBLISHED-TTL:PT6H'] : []),
    ...opts.events.flatMap((e) => {
      const tz = cityOf(e.city).timezone;
      const url = `${opts.baseUrl}/e/${e.slug}`;
      return [
        'BEGIN:VEVENT',
        `UID:${e.id}@feestfinder.com`,
        `DTSTAMP:${stamp(new Date(e.updated_at ?? opts.now))}`,
        `DTSTART;TZID=${tz}:${local(new Date(e.starts_at), tz)}`,
        `DTEND;TZID=${tz}:${local(new Date(e.ends_at), tz)}`,
        `SUMMARY:${esc(e.title)}`,
        `LOCATION:${esc([e.venue_name, e.address, e.area].filter(Boolean).join(', '))}`,
        `URL:${url}`,
        `DESCRIPTION:${esc(`${(e.description?.[first] || e.description?.[second] || '').slice(0, 500)}\n${url}`)}`,
        'END:VEVENT',
      ];
    }),
    'END:VCALENDAR',
    '',
  ];

  return lines.map(fold).join('\r\n');
}
