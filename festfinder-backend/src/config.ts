import { createHmac } from 'node:crypto';

function str(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v !== undefined && v !== '') return v;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required environment variable ${name}`);
}

function int(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`${name} must be a number`);
  return n;
}

/** TRUST_PROXY: `true`, `false`, a hop count, or addresses/CIDRs/`loopback`… separated by commas. */
function trust(v: string | undefined): boolean | number | string {
  if (!v) return 'loopback,linklocal,uniquelocal';
  if (v === 'true' || v === 'false') return v === 'true';
  return /^\d+$/.test(v) ? Number(v) : v;
}

function bool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  return v === '1' || v.toLowerCase() === 'true';
}

export interface Config {
  env: 'development' | 'test' | 'production';
  port: number;
  host: string;
  /**
   * Which Supabase project this deployment belongs on. Production is the production
   * deployment (or a long-lived NODE_ENV=production server); laptops and Vercel previews are
   * staging. FF_ENV overrides it. Each database is labelled with the one it serves, and a
   * deployment on the other's database refuses to start (see claimEnvironment).
   */
  environment: 'production' | 'staging';
  /**
   * postgres://… — this environment's Supabase database: the production project in
   * production, the staging project everywhere else. Read from DATABASE_URL, or from the
   * variable DATABASE_URL_FROM names, for an integration that sets its own. Required in
   * production and on Vercel.
   */
  databaseUrl: string | null;
  /**
   * Embedded PGlite for the automated tests: a directory, or `memory://`. Only used when set
   * and DATABASE_URL is not; never in production or on Vercel.
   */
  pgliteDir: string | null;
  publicBaseUrl: string;
  corsOrigins: string[];
  cookieSecure: boolean;
  /** Signs ticket QR tokens so scanners can verify them offline. */
  ticketSigningSecret: string;
  /** Secret shared with the bank-transfer webhook sender (e.g. SePay / Casso). */
  paymentWebhookSecret: string;
  paymentProvider: 'mock' | 'vietqr';
  /** Collecting account for ticket sales paid by VietQR transfer. */
  platformBank: { bin: string; accountNo: string; accountName: string };
  /** Uploads on local disk, with the embedded test database only. */
  uploadDir: string;
  anthropicModel: string;
  aiGuideEnabled: boolean;
  /**
   * Run the job timers in this process: on a laptop (the staging database) and a long-lived
   * server. On Vercel pg_cron calls POST /internal/jobs instead, for production only.
   */
  jobsEnabled: boolean;
  /**
   * Fixed "now" for the demo data in the tests, e.g. 2026-09-14T10:00:00+07:00. Honoured
   * with the embedded test database only: on Supabase it would stamp real rows with a fake date.
   */
  fixedNow: string | null;
  /**
   * The admin allowlist (ADMIN_EMAIL). A listed email gets admin rights when its owner signs
   * in with Google; an account not on the list loses them at startup. Listed emails with no
   * account yet get one with no password.
   */
  adminEmails: string[];
  /**
   * How a session must be signed in to use admin rights: 'google' (production with Google
   * sign-in configured, the default there) or 'any'. ADMIN_SIGN_IN overrides.
   */
  adminSignIn: 'google' | 'any';
  /**
   * Bearer secret for POST /internal/jobs, the serverless stand-in for the job timers. On
   * Supabase the production deployment schedules pg_cron to call it every minute.
   */
  cronSecret: string | null;
  /**
   * Whether this instance (re)points pg_cron at its own /internal/jobs at startup. Only the
   * production deployment does: a second production instance elsewhere would take the
   * schedule over and point it somewhere the production jobs never run.
   */
  schedulesCron: boolean;
  /** Return OTP codes in API responses: never in production; on staging only when asked for. */
  exposeDevCodes: boolean;
  linkChecksEnabled: boolean;
  /**
   * The map's basemap: PMTiles archives (Protomaps schema) served with range requests from
   * storage FeestFinder controls, so there is no per-request fee. `tilesUrl` holds the
   * listed cities in detail, `overviewUrl` the region at low zoom; either works alone.
   * Without them the map draws the events on a plain board. Glyphs (place names) are optional.
   */
  map: { tilesUrl: string | null; overviewUrl: string | null; glyphsUrl: string | null };
  /** The screens and event pages from festfinder-frontend; off in unit tests unless one asks. */
  serveFrontend: boolean;
  /**
   * IndexNow key (8–128 letters, digits or dashes). With it, new and changed event pages are
   * announced to Bing, and so to the assistants that search its index. It is served at
   * /<key>.txt to prove the site is ours.
   */
  indexNowKey: string | null;
  /**
   * Let AI companies' training crawlers (GPTBot, ClaudeBot, Google-Extended, CCBot…) read the
   * site. Their search and answer crawlers are always welcome; this only covers training.
   */
  allowAiTraining: boolean;
  /** Requests allowed per IP per minute on the public API. */
  rateLimitPerMinute: number;
  /**
   * Which peers may tell us the client's address in X-Forwarded-For. Default: proxies on
   * this machine or a private network (the Next.js app, a load balancer). `true` would let
   * any client claim any address, and dodge the rate limit with it.
   */
  trustProxy: boolean | number | string;
  /**
   * Shared with the Next.js web app when it runs as its own deployment (WEB_PROXY_SECRET, at
   * least 32 characters). Its requests then carry the visitor's address, country and the site's
   * own origin in x-ff-* headers, signed by this; without it those headers are ignored.
   */
  webProxySecret: string | null;
  /** Object storage for uploads (Supabase Storage over S3). Without S3_BUCKET they go to the database. */
  s3: { bucket: string; region: string; endpoint: string | null; accessKeyId: string; secretAccessKey: string; publicBaseUrl: string | null } | null;
  /** SMTP relay for email. Without SMTP_HOST, email is printed to the log. */
  smtp: { host: string; port: number; secure: boolean; user: string; pass: string; from: string } | null;
  /** One endpoint that forwards push, Zalo and SMS to whichever provider is in use. */
  messagingWebhook: { url: string; secret: string } | null;
  /** VAPID keys for browser push. Without them, browser subscriptions go to the webhook too. */
  webPush: { publicKey: string; privateKey: string; subject: string } | null;
  /** Sentry-compatible DSN for unhandled errors. */
  sentryDsn: string | null;
  /** PostHog project key and host. Without a key, analytics events go nowhere. */
  posthog: { key: string; host: string } | null;
  /** Release name reported alongside errors. */
  release: string;
}

export function loadConfig(overrides: Partial<Config> = {}): Config {
  const env = (process.env.NODE_ENV === 'production' ? 'production' : process.env.NODE_ENV === 'test' ? 'test' : 'development') as Config['env'];
  const prod = env === 'production';
  const onVercel = !!process.env.VERCEL;
  // Production answers on the project's production domain; each preview on its own URL,
  // which Vercel's sign-in protects.
  const vercelHost = process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL
    : process.env.VERCEL_URL;
  const databaseUrl = process.env.DATABASE_URL || (process.env.DATABASE_URL_FROM ? process.env[process.env.DATABASE_URL_FROM] : '') || null;
  const environment = deploymentEnvironment(prod);
  // Real secrets for real money and tickets. Staging (previews included) holds test data
  // only, so it runs on the development defaults when none is set.
  const live = environment === 'production';
  const ticketSigningSecret = live ? str('TICKET_SIGNING_SECRET') : str('TICKET_SIGNING_SECRET', 'dev-ticket-secret');
  const cfg: Config = {
    env,
    environment,
    port: int('PORT', 4000),
    // A laptop serves only itself.
    host: str('HOST', prod ? '0.0.0.0' : 'localhost'),
    databaseUrl,
    pgliteDir: process.env.PGLITE_DIR || null,
    publicBaseUrl: str('PUBLIC_BASE_URL', vercelHost ? `https://${vercelHost}` : 'http://localhost:4000'),
    corsOrigins: str('CORS_ORIGINS', 'http://localhost:3000').split(',').map((s) => s.trim()).filter(Boolean),
    cookieSecure: bool('COOKIE_SECURE', prod),
    ticketSigningSecret,
    paymentWebhookSecret: live ? str('PAYMENT_WEBHOOK_SECRET') : str('PAYMENT_WEBHOOK_SECRET', 'dev-webhook-secret'),
    // Instant fake payments: the tests' embedded database, or staging when asked for.
    paymentProvider: (str('PAYMENT_PROVIDER', prod || databaseUrl ? 'vietqr' : 'mock') as Config['paymentProvider']),
    platformBank: {
      bin: str('PLATFORM_BANK_BIN', '970436'),
      accountNo: str('PLATFORM_BANK_ACCOUNT', '0000000000'),
      accountName: str('PLATFORM_BANK_ACCOUNT_NAME', 'CONG TY FESTFINDER'),
    },
    uploadDir: str('UPLOAD_DIR', './.data/uploads'),
    anthropicModel: str('ANTHROPIC_MODEL', 'claude-opus-5-5'),
    aiGuideEnabled: bool('AI_GUIDE_ENABLED', true),
    jobsEnabled: bool('JOBS_ENABLED', !onVercel),
    fixedNow: process.env.FF_NOW || null,
    adminEmails: (process.env.ADMIN_EMAIL ?? '').split(/[,;\s]+/).map((e) => e.trim().toLowerCase()).filter((e) => e.includes('@')),
    adminSignIn: process.env.ADMIN_SIGN_IN === 'any' || process.env.ADMIN_SIGN_IN === 'google' ? process.env.ADMIN_SIGN_IN
      : prod && !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'google' : 'any',
    // In production, a key of its own derived from the ticket secret when none is set, so
    // the scheduler works without one more secret to manage. Neither key reveals the other.
    cronSecret: process.env.CRON_SECRET || (live ? createHmac('sha256', ticketSigningSecret).update('feestfinder:internal-jobs').digest('base64url') : null),
    schedulesCron: prod && environment === 'production',
    // A code in a response lets anyone who can reach the server into any account, so never on
    // real accounts; on staging only with EXPOSE_DEV_CODES. The server log has the codes too.
    exposeDevCodes: environment === 'staging' && bool('EXPOSE_DEV_CODES', !databaseUrl),
    linkChecksEnabled: bool('LINK_CHECKS_ENABLED', env !== 'test'),
    map: {
      tilesUrl: tilesUrl(process.env.MAP_TILES_URL, prod),
      overviewUrl: tilesUrl(process.env.MAP_OVERVIEW_URL, prod),
      glyphsUrl: /^https:\/\/\S+\{fontstack\}\S*\{range\}/.test(process.env.MAP_GLYPHS_URL ?? '') ? process.env.MAP_GLYPHS_URL! : null,
    },
    serveFrontend: env !== 'test',
    indexNowKey: /^[A-Za-z0-9-]{8,128}$/.test(process.env.INDEXNOW_KEY ?? '') ? process.env.INDEXNOW_KEY! : null,
    allowAiTraining: bool('ALLOW_AI_TRAINING', false),
    rateLimitPerMinute: int('RATE_LIMIT_PER_MINUTE', 300),
    trustProxy: trust(process.env.TRUST_PROXY),
    webProxySecret: (process.env.WEB_PROXY_SECRET ?? '').length >= 32 ? process.env.WEB_PROXY_SECRET! : null,
    s3: process.env.S3_BUCKET
      ? {
        bucket: str('S3_BUCKET'),
        region: str('S3_REGION', 'auto'),
        endpoint: process.env.S3_ENDPOINT || null,
        accessKeyId: str('S3_ACCESS_KEY_ID'),
        secretAccessKey: str('S3_SECRET_ACCESS_KEY'),
        publicBaseUrl: process.env.S3_PUBLIC_BASE_URL || null,
      }
      : null,
    smtp: process.env.SMTP_HOST
      ? {
        host: str('SMTP_HOST'),
        port: int('SMTP_PORT', 587),
        secure: bool('SMTP_SECURE', false),
        user: str('SMTP_USER', ''),
        pass: str('SMTP_PASSWORD', ''),
        from: str('SMTP_FROM', 'FeestFinder <no-reply@feestfinder.com>'),
      }
      : null,
    messagingWebhook: process.env.MESSAGING_WEBHOOK_URL
      ? { url: str('MESSAGING_WEBHOOK_URL'), secret: str('MESSAGING_WEBHOOK_SECRET', '') }
      : null,
    webPush: process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
      ? { publicKey: str('VAPID_PUBLIC_KEY'), privateKey: str('VAPID_PRIVATE_KEY'), subject: str('VAPID_SUBJECT', 'mailto:hello@feestfinder.com') }
      : null,
    sentryDsn: process.env.SENTRY_DSN || null,
    posthog: process.env.POSTHOG_KEY ? { key: process.env.POSTHOG_KEY, host: process.env.POSTHOG_HOST || 'https://eu.i.posthog.com' } : null,
    release: str('RELEASE', 'dev'),
    ...overrides,
  };
  if (cfg.environment === 'production' && cfg.paymentProvider === 'mock') {
    throw new Error('PAYMENT_PROVIDER=mock is not allowed in production: it issues tickets nobody paid for.');
  }
  // A deployment never falls back to a database of its own: one that lives in memory or on
  // an instance's disk loses every write, and no two instances would ever agree.
  if ((prod || onVercel) && !cfg.databaseUrl) {
    throw new Error(`DATABASE_URL is not set. Every deployment reads and writes a Supabase database: set DATABASE_URL to the ${cfg.environment} project's connection string (Supabase → Connect → Transaction pooler) for this environment.`);
  }
  return cfg;
}

/**
 * Production is the production deployment on Vercel, or a long-lived server started with
 * NODE_ENV=production. Previews, `vercel dev` and laptops are staging. FF_ENV settles it
 * explicitly, e.g. for a self-hosted staging server.
 */
function deploymentEnvironment(prod: boolean): Config['environment'] {
  const named = process.env.FF_ENV;
  if (named) {
    if (named !== 'production' && named !== 'staging') throw new Error('FF_ENV must be production or staging');
    return named;
  }
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === 'production' ? 'production' : 'staging';
  return prod ? 'production' : 'staging';
}

/** A PMTiles archive's address: https, or a laptop's own http server while developing. */
function tilesUrl(raw: string | undefined, prod: boolean): string | null {
  if (!raw || !/\.pmtiles$/.test(raw)) return null;
  if (/^https:\/\/\S+$/.test(raw)) return raw;
  return !prod && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(raw) ? raw : null;
}
