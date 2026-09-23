import type { Config } from './config.ts';
import type { Db } from './db/index.ts';
import type { Clock } from './lib/time.ts';
import type { ErrorReporter } from './services/errors.ts';
import type { Transport } from './services/messaging.ts';
import type { Storage } from './services/storage.ts';
import type { GuideGenerator } from './services/guide.ts';
import type { OAuthProvider } from './services/oauth.ts';

/** Everything a route or job needs. Built once in server.ts, or per test. */
export interface Ctx {
  config: Config;
  db: Db;
  clock: Clock;
  transport: Transport;
  storage: Storage;
  /** Where unhandled errors are reported. A no-op unless SENTRY_DSN is set. */
  errors: ErrorReporter;
  guide: GuideGenerator;
  oauth: { fb: OAuthProvider | null; ig: OAuthProvider | null };
  checkLink: (url: string) => Promise<'ok' | 'broken'>;
  log: (msg: string) => void;
}
