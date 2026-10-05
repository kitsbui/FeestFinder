import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { seed } from './fixtures/seed.ts';
import { loadConfig } from '../src/config.ts';
import { openDb, poolConfig, type Db } from '../src/db/index.ts';
import { migrate } from '../src/db/migrate.ts';
import { ensureAdmin } from '../src/bootstrap.ts';
import { checkEnvironment, claimEnvironment, readEnvironment } from '../src/db/environment.ts';
import { runDueJobs } from '../src/jobs.ts';
import { DbStorage } from '../src/services/storage.ts';

/** Runs `fn` with these environment variables (undefined unsets one), then puts them back. */
function withEnv<T>(vars: Record<string, string | undefined>, fn: () => T): T {
  const saved = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]));
  const put = (v: Record<string, string | undefined>) => {
    for (const [k, x] of Object.entries(v)) {
      if (x === undefined) delete process.env[k];
      else process.env[k] = x;
    }
  };
  put(vars);
  try { return fn(); } finally { put(saved); }
}

const SUPABASE_URL = 'postgresql://postgres.ref:pw@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';
/** A clean slate: none of the variables these tests are about. */
const BLANK = {
  NODE_ENV: undefined, VERCEL: undefined, VERCEL_ENV: undefined, VERCEL_URL: undefined, VERCEL_PROJECT_PRODUCTION_URL: undefined,
  DATABASE_URL: undefined, DATABASE_URL_FROM: undefined, PGLITE_DIR: undefined, PUBLIC_BASE_URL: undefined,
  PAYMENT_PROVIDER: undefined, JOBS_ENABLED: undefined, CRON_SECRET: undefined, EXPOSE_DEV_CODES: undefined, FF_ENV: undefined,
  TICKET_SIGNING_SECRET: 'test-secret', PAYMENT_WEBHOOK_SECRET: 'test-secret',
};

describe('where the data goes', () => {
  it('never starts a deployment without the Supabase database', () => {
    withEnv({ ...BLANK, NODE_ENV: 'production', PGLITE_DIR: 'memory://' }, () => assert.throws(() => loadConfig(), /DATABASE_URL is not set/));
    withEnv({ ...BLANK, VERCEL: '1', VERCEL_ENV: 'preview', PGLITE_DIR: 'memory://' }, () => assert.throws(() => loadConfig(), /DATABASE_URL is not set/));
    withEnv({ ...BLANK, NODE_ENV: 'production', DATABASE_URL: SUPABASE_URL }, () => assert.equal(loadConfig().databaseUrl, SUPABASE_URL));
  });

  it('opens no database unless one is named', async () => {
    await assert.rejects(openDb({ databaseUrl: null, pgliteDir: null }), /Set DATABASE_URL/);
  });

  it('puts the production deployment on production and everything else on staging', () => {
    const envOf = (vars: Record<string, string>) => withEnv({ ...BLANK, DATABASE_URL: SUPABASE_URL, ...vars }, () => loadConfig().environment);
    assert.equal(envOf({}), 'staging', 'a laptop');
    assert.equal(envOf({ NODE_ENV: 'production', VERCEL: '1', VERCEL_ENV: 'preview' }), 'staging');
    assert.equal(envOf({ NODE_ENV: 'production', VERCEL: '1', VERCEL_ENV: 'development' }), 'staging', 'vercel dev');
    assert.equal(envOf({ NODE_ENV: 'production', VERCEL: '1', VERCEL_ENV: 'production' }), 'production');
    assert.equal(envOf({ NODE_ENV: 'production' }), 'production', 'a long-lived server');
    assert.equal(envOf({ FF_ENV: 'production' }), 'production', 'a command run against production on purpose');
    assert.equal(envOf({ NODE_ENV: 'production', FF_ENV: 'staging' }), 'staging', 'a self-hosted staging server');
    withEnv({ ...BLANK, FF_ENV: 'prod' }, () => assert.throws(() => loadConfig(), /FF_ENV must be/));
  });

  it('needs real ticket and payment secrets in production only', () => {
    const noSecrets = { ...BLANK, TICKET_SIGNING_SECRET: undefined, PAYMENT_WEBHOOK_SECRET: undefined, DATABASE_URL: SUPABASE_URL };
    withEnv({ ...noSecrets, NODE_ENV: 'production', VERCEL: '1', VERCEL_ENV: 'production' }, () => assert.throws(() => loadConfig(), /TICKET_SIGNING_SECRET/));
    withEnv({ ...noSecrets, NODE_ENV: 'production', VERCEL: '1', VERCEL_ENV: 'preview' }, () => {
      const c = loadConfig();
      assert.equal(c.ticketSigningSecret, 'dev-ticket-secret', 'a preview holds test data only');
      assert.equal(c.cronSecret, null, 'and no jobs endpoint anyone could work out');
    });
  });

  it('keeps sign-in codes out of responses on real accounts', () => {
    withEnv({ ...BLANK, DATABASE_URL: SUPABASE_URL }, () => assert.equal(loadConfig().exposeDevCodes, false));
    withEnv({ ...BLANK, DATABASE_URL: SUPABASE_URL, EXPOSE_DEV_CODES: 'true' }, () => assert.equal(loadConfig().exposeDevCodes, true, 'staging, when asked for'));
    withEnv({ ...BLANK, NODE_ENV: 'production', DATABASE_URL: SUPABASE_URL, EXPOSE_DEV_CODES: 'true' }, () => assert.equal(loadConfig().exposeDevCodes, false));
    withEnv({ ...BLANK, PGLITE_DIR: 'memory://' }, () => assert.equal(loadConfig().exposeDevCodes, true));
  });

  it('allows fake payments on staging when asked for, never in production', () => {
    withEnv({ ...BLANK, DATABASE_URL: SUPABASE_URL }, () => assert.equal(loadConfig().paymentProvider, 'vietqr'));
    withEnv({ ...BLANK, DATABASE_URL: SUPABASE_URL, PAYMENT_PROVIDER: 'mock' }, () => assert.equal(loadConfig().paymentProvider, 'mock'));
    withEnv({ ...BLANK, NODE_ENV: 'production', VERCEL: '1', VERCEL_ENV: 'preview', DATABASE_URL: SUPABASE_URL, PAYMENT_PROVIDER: 'mock' },
      () => assert.equal(loadConfig().paymentProvider, 'mock'));
    withEnv({ ...BLANK, NODE_ENV: 'production', DATABASE_URL: SUPABASE_URL, PAYMENT_PROVIDER: 'mock' }, () => assert.throws(() => loadConfig(), /PAYMENT_PROVIDER=mock/));
    withEnv({ ...BLANK, FF_ENV: 'production', DATABASE_URL: SUPABASE_URL, PAYMENT_PROVIDER: 'mock' }, () => assert.throws(() => loadConfig(), /PAYMENT_PROVIDER=mock/));
    withEnv({ ...BLANK, PGLITE_DIR: 'memory://' }, () => assert.equal(loadConfig().paymentProvider, 'mock'));
  });

  it('leaves the pg_cron schedule to the production deployment', () => {
    withEnv({ ...BLANK, DATABASE_URL: SUPABASE_URL }, () => {
      const c = loadConfig();
      assert.equal(c.jobsEnabled, true, 'a laptop runs the jobs on its own, staging, database');
      assert.equal(c.schedulesCron, false);
    });
    withEnv({ ...BLANK, NODE_ENV: 'production', VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_URL: 'feestfinder-git-x.vercel.app', DATABASE_URL: SUPABASE_URL }, () => {
      const c = loadConfig();
      assert.equal(c.schedulesCron, false, 'a preview must not take the schedule over');
      assert.equal(c.jobsEnabled, false);
      assert.equal(c.publicBaseUrl, 'https://feestfinder-git-x.vercel.app');
    });
    withEnv({ ...BLANK, NODE_ENV: 'production', VERCEL: '1', VERCEL_ENV: 'production', VERCEL_URL: 'feestfinder-abc123.vercel.app',
      VERCEL_PROJECT_PRODUCTION_URL: 'feestfinder.vercel.app', DATABASE_URL: SUPABASE_URL }, () => {
      const c = loadConfig();
      assert.equal(c.schedulesCron, true);
      assert.equal(c.jobsEnabled, false, 'pg_cron calls /internal/jobs instead');
      assert.equal(c.publicBaseUrl, 'https://feestfinder.vercel.app', 'the production domain, which Vercel sign-in does not guard');
    });
    withEnv({ ...BLANK, NODE_ENV: 'production', DATABASE_URL: SUPABASE_URL }, () => assert.equal(loadConfig().jobsEnabled, true));
  });

  it('applies a migration once when instances start together', { skip: !process.env.TEST_DATABASE_URL && 'needs TEST_DATABASE_URL: PGlite is a single connection' }, async () => {
    const { default: pg } = await import('pg');
    const admin = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
    const name = `ff_test_migrate_${Date.now()}`;
    await admin.connect();
    await admin.query(`create database ${name}`);
    const url = new URL(process.env.TEST_DATABASE_URL!);
    url.pathname = `/${name}`;
    const dbs = await Promise.all([1, 2, 3].map(() => openDb({ databaseUrl: url.toString(), pgliteDir: null })));
    try {
      const applied = (await Promise.all(dbs.map((d) => migrate(d)))).flat();
      assert.equal(new Set(applied).size, applied.length, 'no migration applied twice');
      const recorded = await dbs[0].query<{ n: number }>('select count(*)::int as n from schema_migrations');
      assert.equal(recorded.rows[0].n, applied.length, 'every migration applied by one of them');
    } finally {
      await Promise.all(dbs.map((d) => d.close()));
      await admin.query(`drop database ${name}`);
      await admin.end();
    }
  });

  describe('the environment label', () => {
    let db: Db;
    const noLog = () => {};
    const fresh = async () => { const d = await openDb({ databaseUrl: null, pgliteDir: 'memory://' }); await migrate(d); return d; };
    after(async () => { await db?.close(); });

    it('is claimed by the first deployment on an empty database', async () => {
      db = await fresh();
      assert.equal(await readEnvironment(db), null);
      assert.equal(await checkEnvironment(db, 'staging'), true);
      await claimEnvironment(db, 'staging', noLog);
      assert.equal(await readEnvironment(db), 'staging');
      assert.equal(await checkEnvironment(db, 'staging'), false, 'claimed once');
    });

    it('stops a deployment on the other environment\'s database', async () => {
      await assert.rejects(checkEnvironment(db, 'production'), /production deployment, but DATABASE_URL is the staging database/);
      await db.close();
      db = await fresh();
      await claimEnvironment(db, 'production', noLog);
      await assert.rejects(checkEnvironment(db, 'staging'), /staging deployment .* but DATABASE_URL is the production database/);
      await assert.rejects(claimEnvironment(db, 'staging', noLog), /production database/, 'a late claim does not relabel it');
    });

    it('is never claimed by staging on a database that already holds data', async () => {
      await db.close();
      db = await fresh();
      await ensureAdmin(db, 'owner@example.com', noLog);
      await assert.rejects(checkEnvironment(db, 'staging'), /already holds data and has no environment label/);
      assert.equal(await checkEnvironment(db, 'production'), true, 'production may claim it');
    });

    it('is checked before the migrations, which have not made its table yet', async () => {
      const bare = await openDb({ databaseUrl: null, pgliteDir: 'memory://' });
      try {
        assert.equal(await readEnvironment(bare), null);
        assert.equal(await checkEnvironment(bare, 'staging'), true);
      } finally { await bare.close(); }
    });
  });

  it('never loads the demo data into Supabase', async () => {
    const db = await openDb({ databaseUrl: null, pgliteDir: 'memory://' });
    try {
      await migrate(db);
      await assert.rejects(seed({ ...db, provider: 'supabase' }, new Date(), { volume: 'small' }), /never goes into the Supabase database/);
    } finally { await db.close(); }
  });

  describe('uploads without object storage', () => {
    let db: Db;
    before(async () => { db = await openDb({ databaseUrl: null, pgliteDir: 'memory://' }); await migrate(db); });
    after(async () => { await db.close(); });

    it('are kept in the database and served from a path every environment shares', async () => {
      const store = new DbStorage(db);
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
      const key = `cover/ab/${'ab'.repeat(32)}.png`;
      assert.equal(await store.put(key, png, 'image/png'), `/files/${key}`);
      assert.equal(await store.put(key, png, 'image/png'), `/files/${key}`, 'the same content twice is one row');
      assert.deepEqual(await store.get(key), png);
      assert.equal(await store.get(`cover/cd/${'cd'.repeat(32)}.png`), null);
    });
  });

  it('says in /health where reads, writes and uploads go', async () => {
    const env = await setup();
    try {
      const h = await env.as().get('/health');
      assert.equal(h.status, 200);
      assert.equal(h.body.database, process.env.TEST_DATABASE_URL ? 'postgres' : 'pglite');
      assert.equal(h.body.environment, 'staging');
      assert.equal(h.body.uploads, 'memory');
    } finally { await env.close(); }
  });
});

describe('deployment', () => {
  it('verifies Supabase against its own root certificate, and leaves other hosts alone', () => {
    const supa = poolConfig('postgresql://postgres.ref:pw@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x');
    assert.equal(new URL(supa.connectionString!).search, '');
    assert.ok(typeof supa.ssl === 'object' && String(supa.ssl.ca).includes('BEGIN CERTIFICATE'));
    assert.equal((supa.ssl as any).rejectUnauthorized, true);
    const plain = poolConfig('postgres://u:p@localhost:5432/db?sslmode=disable');
    assert.equal(plain.connectionString, 'postgres://u:p@localhost:5432/db?sslmode=disable');
    assert.equal(plain.ssl, undefined);
  });

  it('runs each job about as often as its timer did', async () => {
    const env = await setup();
    try {
      const everyJob = await runDueJobs(env.ctx, new Date(60_000 * 60 * 1000));
      assert.equal(Object.keys(everyJob).length, 10);
      const minuteJobs = await runDueJobs(env.ctx, new Date(60_000 * (60 * 1000 + 1)));
      assert.deepEqual(Object.keys(minuteJobs).sort(), ['deliverOutbox', 'expireOrders', 'sendScheduledAnnouncements']);
    } finally { await env.close(); }
  });

  describe('admin accounts', () => {
    let db: Db;
    before(async () => { db = await openDb({ databaseUrl: null, pgliteDir: 'memory://' }); await migrate(db); });
    after(async () => { await db.close(); });
    const admins = async () => (await db.query<{ email: string }>(`select email from users where role = 'admin' order by email`)).rows.map((r) => r.email);

    it('is created once per listed email, without a password', async () => {
      await ensureAdmin(db, 'owner@feestfinder.com', () => {});
      await ensureAdmin(db, 'owner@feestfinder.com', () => {});
      await ensureAdmin(db, 'second@feestfinder.com', () => {});
      assert.deepEqual(await admins(), ['owner@feestfinder.com', 'second@feestfinder.com']);
      const row = (await db.query<{ password_hash: string | null }>(`select password_hash from users where email = 'owner@feestfinder.com'`)).rows[0];
      assert.equal(row.password_hash, null);
    });

    it('never promotes an existing account', async () => {
      await db.query(`delete from users`);
      await db.query(`insert into users (email, signup_method) values ('taken@feestfinder.com', 'email')`);
      await ensureAdmin(db, 'taken@feestfinder.com', () => {});
      assert.deepEqual(await admins(), []);
    });
  });
});

describe('POST /internal/jobs', () => {
  let env: TestEnv;
  before(async () => { env = await setup({ config: { cronSecret: 'cron-test-secret' } }); });
  after(async () => { await env.close(); });

  it('needs the cron secret', async () => {
    assert.equal((await env.as().post('/internal/jobs')).status, 401);
    assert.equal((await env.as('wrong').post('/internal/jobs')).status, 401);
    const ok = await env.as('cron-test-secret').post('/internal/jobs');
    assert.equal(ok.status, 200);
    assert.ok('deliverOutbox' in ok.body.ran);
  });

  it('does not exist without a secret', async () => {
    const plain = await setup();
    try { assert.equal((await plain.as('anything').post('/internal/jobs')).status, 404); } finally { await plain.close(); }
  });
});
