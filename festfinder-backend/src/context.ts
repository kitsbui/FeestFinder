import type { Config } from './config.ts';
import type { Db } from './db/index.ts';
import type { Clock } from './lib/time.ts';
import type { ErrorReporter } from './services/errors.ts';
import type { Transport } from './services/messaging.ts';
import type { Storage } from './services/storage.ts';
import type { GuideGenerator } from './services/guide.ts';
import type { Translator } from './services/translate.ts';
import type { NewsDigester } from './services/news.ts';
import type { ChartFetch } from './services/charts.ts';
import type { OAuthProvider } from './services/oauth.ts';
import type { PrefillGenerator } from './services/prefill.ts';
import type { PageFetcher } from './services/fetchpage.ts';
import type { IngestIO } from './services/ingest/types.ts';
import type { Analytics } from './services/analytics.ts';
import type { ImageFetcher } from './services/remote-images.ts';
import type { OembedFetcher } from './services/mixes.ts';
import type { AudioFetcher } from './services/audio.ts';

/** Everything a route or job needs. Built once in server.ts, or per test. */
export interface Ctx {
  config: Config;
  db: Db;
  clock: Clock;
  transport: Transport;
  storage: Storage;
  /** Where unhandled errors are reported. A no-op unless SENTRY_DSN is set. */
  errors: ErrorReporter;
  /** Product analytics. A no-op unless POSTHOG_KEY is set. */
  analytics: Analytics;
  guide: GuideGenerator;
  /** Machine translation of listings' text (phase 15). Off without ANTHROPIC_API_KEY. */
  translator: Translator;
  /** Two-sentence digests of the news feed's headlines, in both languages (services/news.ts). Off without ANTHROPIC_API_KEY. */
  digester: NewsDigester;
  /** Reads an event's details off a poster or a page for the submission form. */
  prefill: PrefillGenerator;
  /** Fetches a public page someone pasted, never one on a private network. */
  fetchPage: PageFetcher;
  /** Reads the head of a linked image (or the page it is on), never anything on a private network. */
  fetchImage: ImageFetcher;
  /** Asks SoundCloud, Mixcloud or Spotify about a pasted link (oEmbed). */
  oembed: OembedFetcher;
  /** Reads an MP3 an artist linked, once, to measure its waveform (services/audio.ts). */
  fetchAudio: AudioFetcher;
  oauth: { google: OAuthProvider | null; fb: OAuthProvider | null; ig: OAuthProvider | null; tiktok: OAuthProvider | null };
  checkLink: (url: string) => Promise<'ok' | 'broken'>;
  /** The network an ingestion run reads through. Tests hand in fixtures; otherwise the polite fetcher. */
  ingestIO?: () => IngestIO;
  /** The chart providers' APIs (services/charts.ts). Tests hand in a fake; otherwise the real one. */
  chartFetch?: ChartFetch;
  log: (msg: string) => void;
  /** Sends the log lines waiting for PostHog Logs (when switched on); the app calls it after each response. */
  flushLogs?: () => Promise<void>;
}
