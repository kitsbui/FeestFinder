import type { Config } from './config.ts';
import type { Ctx } from './context.ts';
import { openDb, type Db } from './db/index.ts';
import { migrate } from './db/migrate.ts';
import { seed } from './db/seed.ts';
import { scheduleSupabaseCron } from './jobs.ts';
import { fixedClock, systemClock } from './lib/time.ts';
import { ConsoleTransport, RoutingTransport, SmtpTransport, WebhookTransport, WebPushTransport } from './services/messaging.ts';
import { NoopReporter, SentryReporter } from './services/errors.ts';
import { LocalStorage, S3Storage } from './services/storage.ts';
import { ClaudeGuide, DisabledGuide } from './services/guide.ts';
import { FacebookOAuth, InstagramOAuth, MockOAuth } from './services/oauth.ts';
import { checkLink } from './services/risk.ts';

/** Wires real dependencies from configuration. Tests build their own Ctx instead. */
export async function createContext(config: Config): Promise<Ctx> {
  const log = (msg: string) => console.log(`[festfinder] ${msg}`);
  const db = await openDb(config);
  await migrate(db, log);
  const clock = config.fixedNow ? fixedClock(config.fixedNow) : systemClock;
  // A fresh demo deployment fills itself with the sample data. The seed skips a database
  // that has users and runs in one transaction, so a second instance starting at the same
  // time rolls back instead of adding a copy.
  // Vercel previews sit behind Vercel's own sign-in, so they may keep the published passwords.
  const publicDeployment = config.env === 'production' && process.env.VERCEL_ENV !== 'preview';
  if (config.seedIfEmpty) {
    if (publicDeployment && !config.demoPassword) log('SEED_IF_EMPTY is set without DEMO_PASSWORD; not seeding accounts with the published passwords');
    else {
      try {
        const { ids: _ids, ...summary } = (await seed(db, clock.now(), { volume: 'full', password: config.demoPassword ?? undefined, log })) as Record<string, unknown>;
        log(`seed: ${JSON.stringify(summary)}`);
      } catch (e) {
        log(`seed did not run: ${(e as Error).message}`);
      }
    }
  }
  if (config.adminEmail) await ensureAdmin(db, config.adminEmail, log);
  if (config.cronSecret && db.kind === 'postgres') {
    await scheduleSupabaseCron(db, `${config.publicBaseUrl}/internal/jobs`, config.cronSecret, log)
      .catch((e) => log(`pg_cron not scheduled: ${(e as Error).message}`));
  }
  const hasAnthropic = !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_PROFILE);
  const oauthFor = (provider: 'fb' | 'ig') => {
    const id = process.env[provider === 'fb' ? 'FACEBOOK_APP_ID' : 'INSTAGRAM_APP_ID'];
    const secret = process.env[provider === 'fb' ? 'FACEBOOK_APP_SECRET' : 'INSTAGRAM_APP_SECRET'];
    if (id && secret) return provider === 'fb' ? new FacebookOAuth(id, secret) : new InstagramOAuth(id, secret);
    return config.env === 'production' ? null : new MockOAuth(provider);
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
  const storage = config.s3 ? new S3Storage(config.s3) : new LocalStorage(config.uploadDir, config.publicBaseUrl);
  const errors = config.sentryDsn
    ? new SentryReporter(config.sentryDsn, { release: config.release, environment: config.env, log })
    : new NoopReporter();
  for (const [what, on] of [['object storage', !!config.s3], ['email', !!config.smtp], ['push/Zalo/SMS', !!config.messagingWebhook], ['browser push', !!config.webPush], ['error reporting', !!config.sentryDsn]] as const) {
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
    oauth: { fb: oauthFor('fb'), ig: oauthFor('ig') },
    checkLink,
    log,
  };
}

/**
 * The first admin of a fresh database: an account with no password, which its owner
 * claims with "Forgot password" on /ops. Nothing happens once any admin exists, and an
 * existing account with that email is never promoted, so the variable cannot hand out access.
 */
export async function ensureAdmin(db: Db, email: string, log: (msg: string) => void) {
  const out = await db.query<{ id: string }>(
    `insert into users (name, email, signup_method, role)
     select 'FeestFinder Admin', $1, 'email', 'admin'
     where not exists (select 1 from users where role = 'admin') and not exists (select 1 from users where email = $1)
     returning id`, [email]);
  if (out.rows.length) log(`created the first admin account (${email}); set its password with "Forgot password" on /ops`);
  else {
    const taken = await db.query<{ role: string }>('select role from users where email = $1', [email]);
    const admins = await db.query<{ n: number }>(`select count(*)::int as n from users where role = 'admin'`);
    if (!admins.rows[0]?.n && taken.rows.length) log(`warning: ADMIN_EMAIL ${email} belongs to an existing account; not promoting it`);
  }
}
