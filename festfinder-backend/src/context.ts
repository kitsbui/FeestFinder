import type { Config } from './config.ts';
import type { Db } from './db/index.ts';
import type { Clock } from './lib/time.ts';
import type { ErrorReporter } from './services/errors.ts';
import type { Transport } from './services/messaging.ts';
import type { Storage } from './services/storage.ts';
import type { GuideGenerator } from './services/guide.ts';
import type { OAuthProvider } from './services/oauth.ts';
import type { PrefillGenerator } from './services/prefill.ts';
import type { PageFetcher } from './services/fetchpage.ts';
import type { IngestIO } from './services/ingest/types.ts';
import type { Analytics } from './services/analytics.ts';

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
  /** Reads an event's details off a poster or a page for the submission form. */
  prefill: PrefillGenerator;
  /** Fetches a public page someone pasted, never one on a private network. */
  fetchPage: PageFetcher;
  oauth: { google: OAuthProvider | null; fb: OAuthProvider | null; ig: OAuthProvider | null };
  checkLink: (url: string) => Promise<'ok' | 'broken'>;
  /** The network an ingestion run reads through. Tests hand in fixtures; otherwise the polite fetcher. */
  ingestIO?: () => IngestIO;
  log: (msg: string) => void;
}
