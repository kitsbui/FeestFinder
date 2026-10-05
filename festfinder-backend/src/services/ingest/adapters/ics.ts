import { sha256 } from '../../../lib/crypto.ts';
import { atZone } from '../../../lib/time.ts';
import { coord, finalize, hostOf } from '../normalize.ts';
import type { DiscoverResult, IngestIO, IngestSource, NormalizeContext, RawRecord, SourceAdapter } from '../types.ts';

/*
 * An iCalendar feed (RFC 5545): the public calendar a venue or promoter keeps, often a
 * Google Calendar "public address in iCal format". Each VEVENT is one record.
 */

export interface IcsEvent {
  uid: string | null;
  summary: string | null;
  description: string | null;
  location: string | null;
  url: string | null;
  status: string | null;
  categories: string[];
  geo: [number, number] | null;
  start: string | null;
  end: string | null;
}

const unescape = (v: string) => v.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');

/** A DTSTART/DTEND value as an ISO string: an instant (with Z) when it has a zone, a local time or date otherwise. */
export function icsDate(value: string, params: Record<string, string>): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(value.trim());
  if (!m) return null;
  const date = `${m[1]}-${m[2]}-${m[3]}`;
  if (!m[4]) return date;
  const time = `${m[4]}:${m[5]}`;
  if (m[7]) return `${date}T${time}:00Z`;
  const tz = params.TZID?.replace(/^"|"$/g, '');
  if (tz) {
    try { return atZone(date, time, tz).toISOString(); } catch { /* a zone Intl does not know: read as local */ }
  }
  return `${date}T${time}`;
}

/** Every VEVENT in a calendar, with folded lines joined and text unescaped. */
export function parseIcs(text: string): IcsEvent[] {
  const lines = text.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n');
  const out: IcsEvent[] = [];
  let cur: IcsEvent | null = null;
  let depth = 0;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { cur = { uid: null, summary: null, description: null, location: null, url: null, status: null, categories: [], geo: null, start: null, end: null }; depth = 0; continue; }
    if (!cur) continue;
    if (line.startsWith('BEGIN:')) { depth++; continue; }   // VALARM and friends
    if (line.startsWith('END:') && depth > 0) { depth--; continue; }
    if (line === 'END:VEVENT') { out.push(cur); cur = null; continue; }
    if (depth > 0) continue;
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const [name, ...rawParams] = line.slice(0, colon).split(';');
    const params = Object.fromEntries(rawParams.map((p) => { const i = p.indexOf('='); return [p.slice(0, i).toUpperCase(), p.slice(i + 1)]; }));
    const value = line.slice(colon + 1);
    switch (name.toUpperCase()) {
      case 'UID': cur.uid = value.trim(); break;
      case 'SUMMARY': cur.summary = unescape(value); break;
      case 'DESCRIPTION': cur.description = unescape(value); break;
      case 'LOCATION': cur.location = unescape(value); break;
      case 'URL': cur.url = value.trim(); break;
      case 'STATUS': cur.status = value.trim().toUpperCase(); break;
      case 'CATEGORIES': cur.categories.push(...unescape(value).split(',').map((c) => c.trim()).filter(Boolean)); break;
      case 'GEO': { const [a, b] = value.split(';').map(Number); if (Number.isFinite(a) && Number.isFinite(b)) cur.geo = [a, b]; break; }
      case 'DTSTART': cur.start = icsDate(value, params); break;
      case 'DTEND': cur.end = icsDate(value, params); break;
    }
  }
  return out;
}

export const icsAdapter: SourceAdapter = {
  id: 'ics',

  async discover(source: IngestSource, io: IngestIO): Promise<DiscoverResult> {
    if (!source.url) return { records: [], errors: ['no_url'] };
    const headers: Record<string, string> = {};
    if (source.etag) headers['if-none-match'] = source.etag;
    if (source.last_modified) headers['if-modified-since'] = source.last_modified;
    const res = await io.fetchText(source.url, { headers, accept: 'text/calendar,text/plain;q=0.8' });
    if (res.status === 304) return { records: [], notModified: true };
    const contentHash = sha256(res.text);
    const meta = { etag: res.etag, lastModified: res.lastModified, contentHash };
    if (contentHash === source.content_hash) return { records: [], notModified: true, ...meta };
    if (!/BEGIN:VCALENDAR/.test(res.text)) return { records: [], errors: ['not_a_calendar'], ...meta };
    const host = hostOf(source.url) ?? 'ics';
    const records = parseIcs(res.text).map((ev) => ({
      externalId: `${host}:${ev.uid ?? sha256(`${ev.summary}|${ev.start}`).slice(0, 24)}`,
      url: ev.url,
      payload: ev,
    }));
    return { records, ...meta };
  },

  normalize(raw: RawRecord, ctx: NormalizeContext) {
    const ev = raw.payload as IcsEvent;
    const venue = ev.location?.split(',')[0]?.trim() ?? null;
    return finalize({
      title: ev.summary,
      description: ev.description,
      start: ev.start,
      end: ev.end,
      venueName: venue,
      address: ev.location,
      lat: ev.geo ? coord(ev.geo[0], 90) : null,
      lng: ev.geo ? coord(ev.geo[1], 180) : null,
      tags: ev.categories,
      eventUrl: ev.url,
      ticketUrl: ev.url,
      cancelled: ev.status === 'CANCELLED',
    }, { now: ctx.now, fallbackCity: ctx.source.city });
  },
};
