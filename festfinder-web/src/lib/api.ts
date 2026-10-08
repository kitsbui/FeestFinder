/**
 * Server-side reads from the FeestFinder API, for the pages search engines crawl.
 *
 * Screens in the browser call the API through this app's own origin (see the fallback
 * rewrite in next.config.ts); server components call it directly.
 */
import 'server-only';

export const API_ORIGIN = process.env.FF_API_ORIGIN ?? 'http://localhost:4000';

/**
 * Signs this server's own reads when the API is another deployment (WEB_PROXY_SECRET on both,
 * see src/proxy.ts): a render has no visitor behind it, so the API does not rate-limit it.
 */
const SIGNED: Record<string, string> = (process.env.WEB_PROXY_SECRET ?? '').length >= 32 ? { 'x-ff-web-secret': process.env.WEB_PROXY_SECRET! } : {};
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
      headers: { 'x-lang': opts.lang ?? 'vi', accept: 'application/json', ...SIGNED },
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

type Fact = { label: string; value: string; href?: string; datetime?: string };
type PageLink = { title: string; path: string; line: string };

/**
 * What a public page says to search engines and AI assistants: GET /seo/events/:slug and
 * GET /seo/organizers/:slug, GET /seo/artists/:slug and GET /seo/collections/:slug (festfinder-backend/src/services/seo.ts).
 */
export interface PageSeo {
  kind: 'event' | 'organizer' | 'collection' | 'artist' | 'directory';
  lang: Lang;
  url: string;
  canonical: string;
  alternates: { vi: string; en: string; 'x-default': string };
  markdown: string;
  title: string;
  description: string;
  robots: string;
  image: { url: string; width: number; height: number; alt: string; type: string };
  publishedAt: string | null;
  updatedAt: string;
  page: {
    crumbs: { name: string; path: string }[];
    kicker: string;
    h1: string;
    summary: string;
    facts: Fact[];
    about: string;
    otherLang: { label: string; path: string };
  };
  jsonLd: unknown;
}

export interface EventSeo extends PageSeo {
  kind: 'event';
  headings: Record<'facts' | 'about' | 'lineup' | 'timetable' | 'tickets' | 'updates' | 'faq' | 'editions' | 'related' | 'updated', string>;
  page: PageSeo['page'] & {
    lineup: string[];
    timetable: { day: string; sets: { time: string; artist: string; stage: string }[] }[];
    tickets: { name: string; price: string; state: string }[];
    updates: { kind: string; body: string; at: string; atLabel: string }[];
    faq: { question: string; answer: string }[];
    editions: (PageLink & { label: string })[];
    related: PageLink[];
  };
}

export interface OrganizerSeo extends PageSeo {
  kind: 'organizer';
  headings: Record<'facts' | 'about' | 'upcoming' | 'past' | 'updated', string>;
  page: PageSeo['page'] & { upcoming: PageLink[]; past: PageLink[] };
}

/** A collection someone made public: the same lists as an organiser page. */
export interface CollectionSeo extends Omit<OrganizerSeo, 'kind'> {
  kind: 'collection';
}

/** An artist: where they play next and where they have played, the same lists again. */
export interface ArtistSeo extends Omit<OrganizerSeo, 'kind'> {
  kind: 'artist';
}

/** An artist directory page (/a, /a/style/<style>, /a/city/<city>): GET /seo/directory/:key. */
export interface DirectorySeo extends Omit<OrganizerSeo, 'kind'> {
  kind: 'directory';
}

/** Structured data goes in as a JSON data block, never as script the browser runs. */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
