import type { Genre } from '../../lib/i18n.ts';
import type { EventType } from '../../lib/styles.ts';
import type { PageFetcher } from '../fetchpage.ts';

/** One configured source, as stored in ingest_sources. */
export interface IngestSource {
  id: string;
  adapter: string;
  name: string;
  url: string | null;
  city: string | null;
  authority: 'official' | 'ticketing' | 'listing';
  config: Record<string, unknown>;
  interval_minutes: number;
  etag: string | null;
  last_modified: string | null;
  content_hash: string | null;
}

/** One event as a source sent it, before any cleaning. */
export interface RawRecord {
  /** Stable within the source: the provider's id, else the event's URL. */
  externalId: string;
  url: string | null;
  /** The source's own record for this event (a JSON-LD node, an ICS VEVENT, an API object). */
  payload: unknown;
}

/** An event in FeestFinder's terms, ready to be matched against the catalogue. */
export interface NormalizedEvent {
  title: string;
  description: string | null;
  /** Local dates and wall-clock times in the event city's timezone. */
  startsOn: string;
  endsOn: string;
  startTime: string | null;
  endTime: string | null;
  city: string;
  venueName: string | null;
  address: string | null;
  area: string | null;
  lat: number | null;
  lng: number | null;
  lineup: string[];
  genre: Genre | null;
  styles: string[];
  eventType: EventType | null;
  imageUrl: string | null;
  ticketUrl: string | null;
  eventUrl: string | null;
  /** Whole units of the city's currency; null when the source gives none or another currency. */
  priceFrom: number | null;
  free: boolean | null;
  cancelled: boolean;
  organizerName: string | null;
}

export type Rejection = { rejected: RejectReason; detail?: string };
export type RejectReason = 'no_title' | 'no_date' | 'bad_date' | 'past' | 'out_of_area' | 'too_long' | 'cancelled' | 'skipped';

export const isRejection = (x: NormalizedEvent | Rejection): x is Rejection => 'rejected' in x;

/** What a source run may touch: the network goes through here, so tests hand in fixtures. */
export interface IngestIO {
  fetchPage: PageFetcher;
  /**
   * For APIs and feeds: GET a URL with conditional headers, through the same safety checks.
   * `api: true` is an official API, which robots.txt (written for crawlers) does not cover.
   */
  fetchText: (url: string, init?: { headers?: Record<string, string>; accept?: string; api?: boolean }) => Promise<FetchedText>;
  now: Date;
  /** API keys from the environment; never stored with a source. */
  secrets: { ticketmasterKey?: string };
  /** When this run must stop reading (ms since epoch), so a long listing finishes in a later run. */
  deadline?: number;
  /** When each of these pages was last read for this source, so new pages are read first. */
  lastFetched?: (urls: string[]) => Promise<Map<string, number>>;
}

export interface FetchedText { status: number; url: string; text: string; etag: string | null; lastModified: string | null }

export interface NormalizeContext {
  source: IngestSource;
  now: Date;
}

export interface SourceAdapter {
  readonly id: string;
  /** Fetches the source and splits it into records. Network only through `io`. */
  discover(source: IngestSource, io: IngestIO): Promise<DiscoverResult>;
  /** Pure: one record into FeestFinder's terms, or why not. */
  normalize(raw: RawRecord, ctx: NormalizeContext): NormalizedEvent | Rejection;
}

export interface DiscoverResult {
  records: RawRecord[];
  /** Set when the source answered "not modified": nothing to do this run. */
  notModified?: boolean;
  etag?: string | null;
  lastModified?: string | null;
  contentHash?: string | null;
  errors?: string[];
}
