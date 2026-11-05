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
const SECRET = (process.env.WEB_PROXY_SECRET ?? '').trim();
const SIGNED: Record<string, string> = SECRET.length >= 32 ? { 'x-ff-web-secret': SECRET } : {};
/** A preview reaching a preview of the API through Vercel Authentication (src/proxy.ts, FF_API_BYPASS). */
const BYPASS = (process.env.FF_API_BYPASS ?? '').trim();
if (BYPASS) SIGNED['x-vercel-protection-bypass'] = BYPASS;
export const SITE_URL = (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export type { Lang } from '@/kd/copy';
import { dataLang, type Lang } from '@/kd/copy';
import { imgAttrs, type Fit } from '@/kd/img';
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
      // x-ff-session: never the CDN's shared copy (src/proxy.ts sends 1 for a signed-in visitor). A
      // page keeps its own cache (revalidate) and a save refreshes it at once (kd/fresh.ts), so a
      // second cache in front of the API would only show an owner their old cover for longer.
      headers: { 'x-lang': dataLang(opts.lang ?? 'vi'), accept: 'application/json', 'x-ff-session': 'render', ...SIGNED },
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
  kind: 'event' | 'organizer' | 'collection' | 'artist' | 'directory' | 'project' | 'blog';
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

/** A project looking for backers (festfinder-backend services/seo.ts buildProjectSeo). */
export interface ProjectSeo extends Omit<OrganizerSeo, 'kind'> {
  kind: 'project';
}

/** A blog post (festfinder-backend services/seo/blog.ts): one address, in the language it was written in. */
export interface BlogSeo extends Omit<OrganizerSeo, 'kind'> {
  kind: 'blog';
}

/** An artist directory page (/a, /a/style/<style>, /a/city/<city>): GET /seo/directory/:key. */
export interface DirectorySeo extends Omit<OrganizerSeo, 'kind'> {
  kind: 'directory';
}

/** Structured data goes in as a JSON data block, never as script the browser runs. */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** The inlined copy may weigh this much (base64 adds a third): a hero at 384px wide is 10–20 KB, a thumb at 192px about 14. */
const INLINE_MAX = 40 * 1024;

/**
 * A stored picture's copy (/img, `width` px wide, 384 by default) as a data URI, for the page's one eager picture (Art `inline`,
 * Lighthouse 2026-11-05): drawn with the HTML, it is painted at the first paint, so the largest
 * contentful paint is the first paint itself instead of the copy's download after it; the ladder's
 * copy takes over once React is up (ui/lq-cover.tsx). `null` when /img has no copy (a preview, a
 * link it cannot fetch, one too heavy): the picture then loads as every other.
 */
export async function inlineCover(url: string | null | undefined, box: Fit, width = 384): Promise<string | null> {
  if (!url) return null;
  const { src, srcSet } = imgAttrs(url, { ...box, from: width, to: width });
  if (!srcSet) return null;
  try {
    const res = await fetch(API_ORIGIN + src, { headers: SIGNED, redirect: 'manual', signal: AbortSignal.timeout(4000), next: { revalidate: 86400 } });
    if (!res.ok || res.headers.get('content-type') !== 'image/webp') return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return bytes.length <= INLINE_MAX ? 'data:image/webp;base64,' + bytes.toString('base64') : null;
  } catch {
    return null;
  }
}
