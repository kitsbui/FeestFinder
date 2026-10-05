import { GENRES, type Genre } from '../../lib/i18n.ts';
import { cityAt, cityBySlug, cityFromText, countryCodeOf } from '../../lib/places.ts';
import { classifyStyles, genreFromStyles, inferEventType } from '../../lib/styles.ts';
import { addDays, dateIn, daysBetween, timeIn, toMinutes } from '../../lib/time.ts';
import type { NormalizedEvent, Rejection } from './types.ts';

/*
 * What every adapter does to a record once it has read its fields: clean the text, put the
 * times in the event city's clock, find the city, classify the music, and refuse what the
 * catalogue cannot hold. Scraped text is untrusted, so everything is capped and stripped.
 */

const ENTITIES: Record<string, string> = { quot: '"', apos: "'", lt: '<', gt: '>', amp: '&', nbsp: ' ', '#39': "'" };

export function decodeEntities(s: string): string {
  return s.replace(/&(#\d+|#x[\da-f]+|[a-z]+\d*);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** Plain text from whatever a source sent: no tags, no entities, one space between words. */
export function cleanText(s: unknown, max: number): string | null {
  if (s === null || s === undefined) return null;
  const t = decodeEntities(String(s).replace(/<br\s*\/?>|<\/(p|div|li|h\d)>/gi, '\n').replace(/<[^>]*>/g, ' '))
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').replace(/[ \t\f\v]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
  return t ? t.slice(0, max) : null;
}

/** An http(s) URL, made absolute against the page it was found on. */
export function cleanUrl(u: unknown, base?: string | null): string | null {
  if (typeof u !== 'string' || !u.trim()) return null;
  try {
    const url = new URL(u.trim(), base ?? undefined);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    url.hash = '';
    return url.toString().slice(0, 500);
  } catch { return null; }
}

/** The host a URL lives on, without "www.". */
export function hostOf(u: string | null | undefined): string | null {
  if (!u) return null;
  try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; }
}

/**
 * A date or date-time as a source wrote it, on the event city's wall clock. A value with an
 * offset ("…T13:00:00Z") is an instant and is converted; one without is already local.
 */
export function localParts(value: unknown, timezone: string): { date: string; time: string | null } | null {
  if (typeof value !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?\s*([zZ]|[+-]\d{2}:?\d{2})?$/.exec(value.trim());
  if (!m) return null;
  const date = `${m[1]}-${m[2]}-${m[3]}`;
  if (!m[4]) return { date, time: null };
  if (!m[6]) return { date, time: `${m[4]}:${m[5]}` };
  const at = new Date(value.trim().replace(' ', 'T'));
  if (Number.isNaN(at.getTime())) return null;
  return { date: dateIn(at, timezone), time: timeIn(at, timezone) };
}

/**
 * The city a record is in: coordinates first, then each address line in turn, then the
 * source's own city, unless the record names another country.
 */
export function resolveCity(where: { lat?: number | null; lng?: number | null; texts: (string | null | undefined)[]; fallback?: string | null; country?: string | null }): string | null {
  const byPoint = cityAt(where.lat, where.lng);
  if (byPoint) return byPoint;
  for (const t of where.texts) {
    const c = cityFromText(t);
    if (c) return c;
  }
  const fallback = cityBySlug(where.fallback);
  if (!fallback) return null;
  const named = countryCodeOf(where.country);
  return named && named !== fallback.countryCode ? null : fallback.slug;
}

const num = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v));
export const coord = (v: unknown, max: number) => { const n = num(v); return n !== null && Number.isFinite(n) && Math.abs(n) <= max ? n : null; };

/** Everything an adapter could read, before the checks. */
export interface Draft {
  title?: string | null;
  description?: string | null;
  start?: string | null;
  end?: string | null;
  venueName?: string | null;
  address?: string | null;
  area?: string | null;
  cityTexts?: (string | null | undefined)[];
  /** The country the source names, as a code or a name. */
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  lineup?: string[];
  tags?: string[];
  schemaType?: string | null;
  genre?: string | null;
  imageUrl?: string | null;
  ticketUrl?: string | null;
  eventUrl?: string | null;
  price?: number | null;
  currency?: string | null;
  free?: boolean | null;
  cancelled?: boolean;
  organizerName?: string | null;
}

export const MAX_DAYS = 14;

/** Checks a draft and puts it in FeestFinder's terms, or says why it cannot be listed. */
export function finalize(d: Draft, opts: { now: Date; fallbackCity?: string | null; requireLaunched?: boolean }): NormalizedEvent | Rejection {
  const title = cleanText(d.title, 160);
  if (!title) return { rejected: 'no_title' };
  if (!d.start) return { rejected: 'no_date' };
  const lat = coord(d.lat, 90);
  const lng = coord(d.lng, 180);
  const slug = resolveCity({ lat, lng, texts: [d.address, ...(d.cityTexts ?? []), d.venueName], fallback: opts.fallbackCity, country: d.country });
  const city = cityBySlug(slug);
  if (!city || (opts.requireLaunched !== false && !city.launched)) return { rejected: 'out_of_area', detail: [d.address, ...(d.cityTexts ?? [])].filter(Boolean).join(' · ').slice(0, 200) };

  const start = localParts(d.start, city.timezone);
  if (!start) return { rejected: 'bad_date', detail: String(d.start).slice(0, 60) };
  const end = localParts(d.end, city.timezone);
  let endsOn = end && end.date >= start.date ? end.date : start.date;
  // Doors 22:00, close 04:00 the next morning is one night, not two days: the catalogue
  // writes that as an end time earlier than the start on the same date.
  if (end && start.time && end.time && endsOn === addDays(start.date, 1) && toMinutes(end.time) <= toMinutes(start.time)) endsOn = start.date;
  if (daysBetween(start.date, endsOn) > MAX_DAYS) return { rejected: 'too_long' };
  if (endsOn < dateIn(opts.now, city.timezone)) return { rejected: 'past' };

  const lineup = [...new Set((d.lineup ?? []).map((a) => cleanText(a, 100)).filter((a): a is string => !!a))].slice(0, 60);
  const description = cleanText(d.description, 3000);
  const styles = classifyStyles({ tags: d.tags, title, description, lineup });
  const declared = (GENRES as readonly string[]).find((g) => g.toLowerCase() === String(d.genre ?? '').toLowerCase()) as Genre | undefined;
  const sameCurrency = !d.currency || d.currency.toUpperCase() === city.currency;
  const price = d.price !== null && d.price !== undefined && Number.isFinite(d.price) && d.price >= 0 && sameCurrency ? Math.round(d.price) : null;
  return {
    title,
    description,
    startsOn: start.date,
    endsOn,
    startTime: start.time,
    endTime: end?.time ?? null,
    city: city.slug,
    venueName: cleanText(d.venueName, 160),
    address: cleanText(d.address, 240),
    area: cleanText(d.area, 60),
    lat: lat !== null && lng !== null ? lat : null,
    lng: lat !== null && lng !== null ? lng : null,
    lineup,
    genre: declared ?? genreFromStyles(styles) ?? (d.schemaType === 'Festival' ? 'Festival' : null),
    styles,
    eventType: inferEventType({ schemaType: d.schemaType, title, description, startTime: start.time, endTime: end?.time ?? null }),
    imageUrl: cleanUrl(d.imageUrl),
    ticketUrl: cleanUrl(d.ticketUrl),
    eventUrl: cleanUrl(d.eventUrl),
    priceFrom: d.free ? 0 : price,
    free: d.free ?? (price === 0 ? true : price ? false : null),
    cancelled: !!d.cancelled,
    organizerName: cleanText(d.organizerName, 120),
  };
}
