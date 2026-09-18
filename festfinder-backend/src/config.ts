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

function bool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  return v === '1' || v.toLowerCase() === 'true';
}

export interface Config {
  env: 'development' | 'test' | 'production';
  port: number;
  host: string;
  /** postgres://… for a real server; unset uses embedded PGlite at `pgliteDir`. */
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
  /** Return OTP codes in API responses. Never enable in production. */
  exposeDevCodes: boolean;
  linkChecksEnabled: boolean;
}

export function loadConfig(overrides: Partial<Config> = {}): Config {
  const env = (process.env.NODE_ENV === 'production' ? 'production' : process.env.NODE_ENV === 'test' ? 'test' : 'development') as Config['env'];
  const prod = env === 'production';
  const cfg: Config = {
    env,
    port: int('PORT', 4000),
    host: str('HOST', '0.0.0.0'),
    databaseUrl: process.env.DATABASE_URL || null,
    pgliteDir: str('PGLITE_DIR', './.data/pglite'),
    publicBaseUrl: str('PUBLIC_BASE_URL', 'http://localhost:4000'),
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
    exposeDevCodes: !prod && bool('EXPOSE_DEV_CODES', true),
    linkChecksEnabled: bool('LINK_CHECKS_ENABLED', env !== 'test'),
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
