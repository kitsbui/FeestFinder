/**
 * Sends one test error to Sentry with the DSN in the environment, the way the API reports its
 * own, so the owner sees the project receive it within a minute before setting SENTRY_DSN in
 * Vercel:
 *
 *   SENTRY_DSN=https://…@….ingest.sentry.io/… node scripts/sentry-test-error.ts
 */
import { SentryReporter } from '../src/services/errors.ts';

const dsn = process.env.SENTRY_DSN;
if (!dsn) {
  console.error('usage: SENTRY_DSN=https://… node scripts/sentry-test-error.ts');
  process.exit(2);
}
const reporter = new SentryReporter(dsn, { release: 'test', environment: 'test', log: (l) => console.error(l) });
const err = new Error(`FeestFinder test error ${new Date().toISOString()}`);
reporter.capture(err, { method: 'GET', url: '/sentry-test', requestId: 'test' });
console.log(`sent "${err.message}" to Sentry; it should appear in the project's issues within a minute.`);
// The reporter posts in the background: give it a moment before the process ends.
await new Promise((r) => setTimeout(r, 2500));
