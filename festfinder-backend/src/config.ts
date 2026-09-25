import { randomBytes } from 'node:crypto';

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
   * postgres://… for a real server; unset uses embedded PGlite at `pgliteDir`. Read from
   * DATABASE_URL, or from the variable DATABASE_URL_FROM names, for an integration that
   * prefixes its own (Vercel's Neon connection sets PROD_FEESTFINDER_DATABASE_URL).
   */
  databaseUrl: string | null;
  /** Directory for embedded PGlite data. `memory://` keeps it in RAM. */
  pgliteDir: string;
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
  uploadDir: string;
  anthropicModel: string;
  aiGuideEnabled: boolean;
  jobsEnabled: boolean;
  /** Fixed "now" for demos and tests, e.g. 2026-09-14T10:00:00+07:00. */
  fixedNow: string | null;
  /** Fill an empty database with the sample data at startup (a demo deployment). */
  seedIfEmpty: boolean;
  /** Password for the seeded demo accounts; required to seed a public production deployment. */
  demoPassword: string | null;
  /** First admin account, made at startup while no admin exists. It has no password yet. */
  adminEmail: string | null;
  /**
   * Bearer secret for POST /internal/jobs, the serverless stand-in for the job timers. On
   * Supabase the API schedules pg_cron to call it every minute.
   */
  cronSecret: string | null;
  /** Return OTP codes in API responses. Never enable in production. */
  exposeDevCodes: boolean;
  linkChecksEnabled: boolean;
  /** Requests allowed per IP per minute on the public API. */
  rateLimitPerMinute: number;
  /**
   * Which peers may tell us the client's address in X-Forwarded-For. Default: proxies on
   * this machine or a private network (the Next.js app, a load balancer). `true` would let
   * any client claim any address, and dodge the rate limit with it.
   */
  trustProxy: boolean | number | string;
  /** Object storage for uploads. Without S3_BUCKET, files stay on local disk. */
  s3: { bucket: string; region: string; endpoint: string | null; accessKeyId: string; secretAccessKey: string; publicBaseUrl: string | null } | null;
  /** SMTP relay for email. Without SMTP_HOST, email is printed to the log. */
  smtp: { host: string; port: number; secure: boolean; user: string; pass: string; from: string } | null;
  /** One endpoint that forwards push, Zalo and SMS to whichever provider is in use. */
  messagingWebhook: { url: string; secret: string } | null;
  /** VAPID keys for browser push. Without them, browser subscriptions go to the webhook too. */
  webPush: { publicKey: string; privateKey: string; subject: string } | null;
  /** Sentry-compatible DSN for unhandled errors. */
  sentryDsn: string | null;
  /** Release name reported alongside errors. */
  release: string;
}

export function loadConfig(overrides: Partial<Config> = {}): Config {
  const env = (process.env.NODE_ENV === 'production' ? 'production' : process.env.NODE_ENV === 'test' ? 'test' : 'development') as Config['env'];
  const prod = env === 'production';
  const cfg: Config = {
    env,
    port: int('PORT', 4000),
    host: str('HOST', '0.0.0.0'),
    databaseUrl: process.env.DATABASE_URL || (process.env.DATABASE_URL_FROM ? process.env[process.env.DATABASE_URL_FROM] : '') || null,
    pgliteDir: str('PGLITE_DIR', './.data/pglite'),
    // A Vercel preview answers on its own URL.
    publicBaseUrl: str('PUBLIC_BASE_URL', process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:4000'),
    corsOrigins: str('CORS_ORIGINS', 'http://localhost:3000').split(',').map((s) => s.trim()).filter(Boolean),
    cookieSecure: bool('COOKIE_SECURE', prod),
    ticketSigningSecret: prod ? str('TICKET_SIGNING_SECRET') : str('TICKET_SIGNING_SECRET', 'dev-ticket-secret'),
    paymentWebhookSecret: prod ? str('PAYMENT_WEBHOOK_SECRET') : str('PAYMENT_WEBHOOK_SECRET', 'dev-webhook-secret'),
    paymentProvider: (str('PAYMENT_PROVIDER', prod ? 'vietqr' : 'mock') as Config['paymentProvider']),
    platformBank: {
      bin: str('PLATFORM_BANK_BIN', '970436'),
      accountNo: str('PLATFORM_BANK_ACCOUNT', '0000000000'),
      accountName: str('PLATFORM_BANK_ACCOUNT_NAME', 'CONG TY FESTFINDER'),
    },
    uploadDir: str('UPLOAD_DIR', './.data/uploads'),
    anthropicModel: str('ANTHROPIC_MODEL', 'claude-opus-5'),
    aiGuideEnabled: bool('AI_GUIDE_ENABLED', true),
    jobsEnabled: bool('JOBS_ENABLED', env !== 'test'),
    fixedNow: process.env.FF_NOW || null,
    seedIfEmpty: bool('SEED_IF_EMPTY', false),
    demoPassword: process.env.DEMO_PASSWORD || null,
    adminEmail: process.env.ADMIN_EMAIL?.trim().toLowerCase() || null,
    cronSecret: process.env.CRON_SECRET || null,
    exposeDevCodes: !prod && bool('EXPOSE_DEV_CODES', true),
    linkChecksEnabled: bool('LINK_CHECKS_ENABLED', env !== 'test'),
    rateLimitPerMinute: int('RATE_LIMIT_PER_MINUTE', 300),
    trustProxy: trust(process.env.TRUST_PROXY),
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
        from: str('SMTP_FROM', 'FeestFinder <no-reply@festfinder.vn>'),
      }
      : null,
    messagingWebhook: process.env.MESSAGING_WEBHOOK_URL
      ? { url: str('MESSAGING_WEBHOOK_URL'), secret: str('MESSAGING_WEBHOOK_SECRET', '') }
      : null,
    webPush: process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
      ? { publicKey: str('VAPID_PUBLIC_KEY'), privateKey: str('VAPID_PRIVATE_KEY'), subject: str('VAPID_SUBJECT', 'mailto:hello@festfinder.vn') }
      : null,
    sentryDsn: process.env.SENTRY_DSN || null,
    release: str('RELEASE', 'dev'),
    ...overrides,
  };
  if (prod && cfg.paymentProvider === 'mock') {
    throw new Error('PAYMENT_PROVIDER=mock is not allowed in production');
  }
  return cfg;
}

export function randomSecret(): string {
  return randomBytes(32).toString('base64url');
}
