import { buildApp } from '../src/app.ts';
import { loadConfig, type Config } from '../src/config.ts';
import type { Ctx } from '../src/context.ts';
import { openDb } from '../src/db/index.ts';
import { migrate } from '../src/db/migrate.ts';
import { seed } from '../src/db/seed.ts';
import { fixedClock } from '../src/lib/time.ts';
import { NoopReporter } from '../src/services/errors.ts';
import { ConsoleTransport } from '../src/services/messaging.ts';
import { MemoryStorage } from '../src/services/storage.ts';
import { DisabledGuide, type GuideGenerator } from '../src/services/guide.ts';
import { MockOAuth } from '../src/services/oauth.ts';

/** Monday 14 September 2026, 10:00 in Ho Chi Minh City — "today" in the design prototypes. */
export const PROTOTYPE_NOW = '2026-09-14T10:00:00+07:00';

export interface Res<T = any> { status: number; body: T; headers: Record<string, any> }

/**
 * Tests run on in-memory PGlite. Set TEST_DATABASE_URL to a Postgres server you can create
 * databases on, and each test file gets its own fresh database there instead.
 */
async function freshDatabaseUrl(): Promise<string | null> {
  const admin = process.env.TEST_DATABASE_URL;
  if (!admin) return null;
  const { default: pg } = await import('pg');
  const name = `ff_test_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const client = new pg.Client({ connectionString: admin });
  await client.connect();
  await client.query(`create database ${name}`);
  await client.end();
  const url = new URL(admin);
  url.pathname = `/${name}`;
  return url.toString();
}

export async function setup(opts: { now?: string; guide?: GuideGenerator; checkLink?: Ctx['checkLink']; config?: Partial<Config> } = {}) {
  const clock = fixedClock(opts.now ?? PROTOTYPE_NOW);
  const config = loadConfig({
    env: 'test', databaseUrl: await freshDatabaseUrl(), pgliteDir: 'memory://', jobsEnabled: false, exposeDevCodes: true, linkChecksEnabled: false,
    paymentProvider: 'mock', publicBaseUrl: 'http://test.local', corsOrigins: ['http://localhost:3000'], cookieSecure: false,
    ticketSigningSecret: 'test-ticket-secret', paymentWebhookSecret: 'test-webhook-secret', aiGuideEnabled: true, fixedNow: null,
    ...opts.config,
  });
  const db = await openDb(config);
  await migrate(db);
  const seeded: any = await seed(db, clock.now(), { volume: 'small' });
  const transport = new ConsoleTransport(() => {});
  const ctx: Ctx = {
    config, db, clock, transport, storage: new MemoryStorage(),
    errors: new NoopReporter(),
    guide: opts.guide ?? new DisabledGuide(),
    oauth: { fb: new MockOAuth('fb'), ig: new MockOAuth('ig') },
    checkLink: opts.checkLink ?? (async () => 'ok'),
    log: () => {},
  };
  const app = await buildApp(ctx);

  const call = async (method: string, url: string, init: { token?: string; body?: unknown; headers?: Record<string, string> } = {}): Promise<Res> => {
    const res = await app.inject({
      method: method as any, url,
      payload: init.body as any,
      headers: { 'x-lang': 'en', ...(init.token ? { authorization: `Bearer ${init.token}` } : {}), ...init.headers },
    });
    let body: any = res.body;
    if (String(res.headers['content-type'] ?? '').includes('application/json')) body = res.json();
    return { status: res.statusCode, body, headers: res.headers };
  };

  const as = (token?: string) => ({
    get: (url: string, headers?: Record<string, string>) => call('GET', url, { token, headers }),
    post: (url: string, body?: unknown) => call('POST', url, { token, body: body ?? {} }),
    put: (url: string, body?: unknown) => call('PUT', url, { token, body: body ?? {} }),
    patch: (url: string, body?: unknown) => call('PATCH', url, { token, body: body ?? {} }),
    delete: (url: string, body?: unknown) => call('DELETE', url, { token, body }),
  });

  const login = async (identifier: string, password: string): Promise<string> => {
    const r = await call('POST', '/auth/login', { body: { identifier, password } });
    if (r.status !== 200) throw new Error(`login failed for ${identifier}: ${JSON.stringify(r.body)}`);
    return r.body.token;
  };

  return {
    app, ctx, clock, transport, ids: seeded.ids as { event: Record<string, string>; org: Record<string, string>; friend: Record<string, string> },
    call, as, login,
    attendee: () => login('minh@example.com', 'festfinder123'),
    organizer: () => login('team@ravolution.vn', 'ravolution2026'),
    admin: () => login('admin@festfinder.vn', 'festfinder-admin'),
    close: async () => { await app.close(); await db.close(); },
  };
}

export type TestEnv = Awaited<ReturnType<typeof setup>>;
