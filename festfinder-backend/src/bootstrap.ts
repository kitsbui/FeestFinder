import type { Config } from './config.ts';
import type { Ctx } from './context.ts';
import { openDb, type Db } from './db/index.ts';
import { checkEnvironment, claimEnvironment } from './db/environment.ts';
import { migrate } from './db/migrate.ts';
import { scheduleSupabaseCron } from './jobs.ts';
import { fixedClock, systemClock } from './lib/time.ts';
import { ConsoleTransport, RoutingTransport, SmtpTransport, WebhookTransport, WebPushTransport } from './services/messaging.ts';
import { NoopReporter, SentryReporter } from './services/errors.ts';
import { DbStorage, LocalStorage, S3Storage } from './services/storage.ts';
import { ClaudeGuide, DisabledGuide } from './services/guide.ts';
import { ClaudePrefill, DisabledPrefill } from './services/prefill.ts';
import { fetchPublicPage } from './services/fetchpage.ts';
import { FacebookOAuth, InstagramOAuth, MockOAuth } from './services/oauth.ts';
import { checkLink } from './services/risk.ts';

/** Wires real dependencies from configuration. Tests build their own Ctx instead. */
export async function createContext(config: Config): Promise<Ctx> {
  const log = (msg: string) => console.log(`[festfinder] ${msg}`);
  const db = await openDb(config);
  log(`database: ${db.provider} (${db.location})`);
  // Before the migrations, so a laptop's unreleased migration never reaches production.
  const unlabelled = db.kind === 'postgres' && await checkEnvironment(db, config.environment);
  await migrate(db, log);
  if (unlabelled) await claimEnvironment(db, config.environment, log);
  if (db.kind === 'postgres') log(`environment: ${config.environment}`);
  // The pinned clock exists for the demo data in the tests. On a shared database it would
  // stamp real orders, sessions and audit entries with a made-up date.
  if (config.fixedNow && db.kind !== 'pglite') log(`FF_NOW is ignored: the clock is only pinned on the embedded test database`);
  const clock = config.fixedNow && db.kind === 'pglite' ? fixedClock(config.fixedNow) : systemClock;
  // Demo data lives in the test fixtures only; nothing loads it into a real database.
  for (const name of ['SEED_IF_EMPTY', 'DEMO_PASSWORD']) {
    if (process.env[name]) log(`${name} is no longer used: nothing seeds demo data into the database. Remove it from this environment.`);
  }
  for (const email of config.adminEmails) await ensureAdmin(db, email, log);
  if (config.schedulesCron && config.cronSecret && db.kind === 'postgres') {
    await scheduleSupabaseCron(db, `${config.publicBaseUrl}/internal/jobs`, config.cronSecret, log)
      .catch((e) => log(`pg_cron not scheduled: ${(e as Error).message}`));
  }
  const hasAnthropic = !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_PROFILE);
  const oauthFor = (provider: 'fb' | 'ig') => {
    const id = process.env[provider === 'fb' ? 'FACEBOOK_APP_ID' : 'INSTAGRAM_APP_ID'];
    const secret = process.env[provider === 'fb' ? 'FACEBOOK_APP_SECRET' : 'INSTAGRAM_APP_SECRET'];
    if (id && secret) return provider === 'fb' ? new FacebookOAuth(id, secret) : new InstagramOAuth(id, secret);
    // The stand-in signs anyone in as a made-up profile: the embedded test database only.
    return db.kind === 'pglite' ? new MockOAuth(provider) : null;
  };
  // Each provider is used when it is configured, and logged instead when it is not, so a
  // deployment can turn them on one at a time.
  const console_ = new ConsoleTransport(log);
  const transport = config.smtp || config.messagingWebhook || config.webPush
    ? new RoutingTransport({
      email: config.smtp ? new SmtpTransport(config.smtp) : null,
      webPush: config.webPush
        ? new WebPushTransport(config.webPush, async (token) => { await db.query('delete from devices where token = $1', [token]); })
        : null,
      webhook: config.messagingWebhook ? new WebhookTransport(config.messagingWebhook.url, config.messagingWebhook.secret) : null,
      fallback: console_,
    })
    : console_;
  // Uploads land where the data does: Supabase Storage when it is configured, else the
  // database. A serverless instance's disk goes away with the instance.
  const storage = config.s3 ? new S3Storage(config.s3)
    : db.kind === 'postgres' ? new DbStorage(db)
    : new LocalStorage(config.uploadDir, config.publicBaseUrl);
  log(`uploads: ${storage.kind === 's3' ? `object storage (${config.s3!.bucket})` : storage.kind === 'database' ? 'the database (stored_files)' : `disk (${config.uploadDir})`}`);
  const errors = config.sentryDsn
    ? new SentryReporter(config.sentryDsn, { release: config.release, environment: config.env, log })
    : new NoopReporter();
  for (const [what, on] of [['email', !!config.smtp], ['push/Zalo/SMS', !!config.messagingWebhook], ['browser push', !!config.webPush], ['error reporting', !!config.sentryDsn]] as const) {
    if (!on && config.env === 'production') log(`warning: no ${what} provider configured`);
  }

  return {
    config,
    db,
    clock,
    transport,
    storage,
    errors,
    guide: config.aiGuideEnabled && hasAnthropic ? new ClaudeGuide(config.anthropicModel) : new DisabledGuide(),
    prefill: config.aiGuideEnabled && hasAnthropic ? new ClaudePrefill(config.anthropicModel) : new DisabledPrefill(),
    fetchPage: (url: string) => fetchPublicPage(url),
    oauth: { fb: oauthFor('fb'), ig: oauthFor('ig') },
    checkLink,
    log,
  };
}

/**
 * An admin account for an email that has no account yet. It has no password: its owner
 * claims it with "Forgot password" on /ops, which only the mailbox's owner can do. An
 * existing account is never promoted, so signing up first with a listed email gets nothing.
 */
export async function ensureAdmin(db: Db, email: string, log: (msg: string) => void) {
  const out = await db.query<{ id: string }>(
    `insert into users (name, email, signup_method, role) values ('FeestFinder Admin', $1, 'email', 'admin')
     on conflict (email) do nothing returning id`, [email]);
  if (out.rows.length) log(`created admin account ${email}; set its password with "Forgot password" on /ops`);
  else {
    const row = await db.query<{ role: string }>('select role from users where email = $1', [email]);
    if (row.rows[0]?.role !== 'admin') log(`warning: ADMIN_EMAIL ${email} belongs to an existing account; not promoting it`);
  }
}

