/**
 * Server-side reads from the FeestFinder API, for the pages search engines crawl.
 *
 * Screens in the browser call the API through this app's own origin (see the fallback
 * rewrite in next.config.ts); server components call it directly.
 */
import 'server-only';

export const API_ORIGIN = process.env.FF_API_ORIGIN ?? 'http://localhost:4000';
export const SITE_URL = (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export type Lang = 'en' | 'vi';
export type Localized = { en: string; vi: string };

/** The API did not answer, or answered with an error: not the same as "does not exist". */
export class ApiUnavailable extends Error {}

/**
 * A public read. `null` when the thing does not exist (404, or a path the API rejects).
 * Anything else that goes wrong throws: when a page is regenerated in the background, Next
 * then keeps serving the last good copy instead of caching a "not found".
 */
export async function api<T>(path: string, opts: { lang?: Lang; revalidate?: number } = {}): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(API_ORIGIN + path, {
      headers: { 'x-lang': opts.lang ?? 'vi', accept: 'application/json' },
      next: { revalidate: opts.revalidate ?? 60 },
    });
  } catch (e) {
    throw new ApiUnavailable(`${path}: ${(e as Error).message}`);
  }
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new ApiUnavailable(`${path}: ${res.status}`);
  return (await res.json()) as T;
}

/** For pages built ahead of time, which must render even when the API is not up yet. */
export async function apiOr<T>(path: string, fallback: T, opts: { lang?: Lang; revalidate?: number } = {}): Promise<T> {
  try {
    return (await api<T>(path, opts)) ?? fallback;
  } catch {
    return fallback;
  }
}

export interface Venue {
  id: string | null;
  name: string | null;
  area: string | null;
  address?: string | null;
  lat: number | null;
  lng: number | null;
}

export interface EventCard {
  id: string;
  slug: string;
  title: string;
  genre: string | null;
  art: string | null;
  coverUrl: string | null;
  logoUrl: string | null;
  badge: { key: string; label: Localized } | null;
  featured: boolean;
  soldOut: boolean;
  past: boolean;
  status: string;
  startsOn: string;
  endsOn: string;
  startTime: string | null;
  endTime: string | null;
  startsAt: string | null;
  endsAt: string | null;
  venue: Venue;
  entryMode: 'free' | 'paid' | 'donation';
  priceFrom: number;
  organizer: { id: string; slug: string; name: string; verified: boolean };
  lineup?: string[];
}

export interface EventDetail extends EventCard {
  description: Localized | null;
  age: string | null;
  capacity: number | null;
  lineup: string[];
  artists: string[];
  links: { event?: string | null; brand?: string | null; tickets?: string | null } | null;
  tickets: { tiers: { id: string; name: Localized; price: number; state: string }[] } | null;
}

export interface Organizer {
  id: string;
  slug: string;
  name: string;
  bio: Localized | null;
  website: string | null;
  logoUrl: string | null;
  verified: boolean;
  stats: { events: number; followers: number; since: number };
  upcoming: EventCard[];
  past: EventCard[];
}

export interface Landing {
  locale: Lang;
  path: string;
  meta: { title: string; description: string; canonical: string; alternates: Record<string, string> };
  kicker: string;
  h1: string;
  intro: string;
  count: number;
  answers: { label: string; value: string }[];
  events: EventCard[];
  faqs: { q: string; a: string }[];
  related: { label: string; href: string }[];
  jsonLd: unknown[];
}

// ---- formatting the server-rendered summaries ---------------------------------------

export function text(v: Localized | string | null | undefined, lang: Lang): string {
  if (!v) return '';
  return typeof v === 'string' ? v : v[lang] || v.en || '';
}

export function vnd(n: number, lang: Lang): string {
  return n.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US') + '₫';
}

export function when(e: Pick<EventCard, 'startsOn' | 'endsOn' | 'startTime' | 'endTime'>, lang: Lang): string {
  const fmt = (iso: string) =>
    new Date(iso + 'T12:00:00+07:00').toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Ho_Chi_Minh',
    });
  const days = e.endsOn && e.endsOn !== e.startsOn ? `${fmt(e.startsOn)} – ${fmt(e.endsOn)}` : fmt(e.startsOn);
  const hours = e.startTime ? ` · ${e.startTime}${e.endTime ? '–' + e.endTime : ''}` : '';
  return days + hours;
}

export function price(e: Pick<EventCard, 'entryMode' | 'priceFrom'>, lang: Lang): string {
  if (e.entryMode === 'free') return lang === 'vi' ? 'Miễn phí' : 'Free';
  if (e.entryMode === 'donation') return lang === 'vi' ? 'Tuỳ tâm' : 'Pay what you like';
  return (lang === 'vi' ? 'Từ ' : 'From ') + vnd(e.priceFrom, lang);
}

/** The schema.org Event Google reads for event rich results. */
export function eventJsonLd(e: EventDetail, url: string) {
  const offers = (e.tickets?.tiers ?? []).map((t) => ({
    '@type': 'Offer',
    name: t.name.vi || t.name.en,
    price: t.price,
    priceCurrency: 'VND',
    availability: t.state === 'soldout' ? 'https://schema.org/SoldOut' : t.state === 'soon' ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock',
    url: e.links?.tickets || url,
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.title,
    description: text(e.description, 'vi') || undefined,
    startDate: e.startsAt ?? `${e.startsOn}T${e.startTime ?? '00:00'}:00+07:00`,
    endDate: e.endsAt ?? undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: e.coverUrl ? [e.coverUrl] : undefined,
    url,
    isAccessibleForFree: e.entryMode === 'free',
    location: {
      '@type': 'Place',
      name: e.venue.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: e.venue.address ?? undefined,
        addressLocality: e.venue.area ?? 'Hồ Chí Minh',
        addressRegion: 'Hồ Chí Minh',
        addressCountry: 'VN',
      },
      geo: e.venue.lat !== null && e.venue.lng !== null ? { '@type': 'GeoCoordinates', latitude: e.venue.lat, longitude: e.venue.lng } : undefined,
    },
    organizer: { '@type': 'Organization', name: e.organizer.name, url: `${SITE_URL}/o/${e.organizer.slug}` },
    performer: (e.lineup ?? []).slice(0, 12).map((name) => ({ '@type': 'PerformingGroup', name })),
    offers: offers.length ? offers : e.entryMode === 'free'
      ? [{ '@type': 'Offer', price: 0, priceCurrency: 'VND', availability: 'https://schema.org/InStock', url }]
      : undefined,
  };
}

/** Structured data goes in as a JSON data block, never as script the browser runs. */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
