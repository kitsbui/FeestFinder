import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { openDb, poolConfig, type Db } from '../src/db/index.ts';
import { migrate } from '../src/db/migrate.ts';
import { ensureAdmin } from '../src/bootstrap.ts';
import { runDueJobs } from '../src/jobs.ts';

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
      assert.equal(Object.keys(everyJob).length, 7);
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
      await ensureAdmin(db, 'owner@feestfinder.vn', () => {});
      await ensureAdmin(db, 'owner@feestfinder.vn', () => {});
      await ensureAdmin(db, 'second@feestfinder.vn', () => {});
      assert.deepEqual(await admins(), ['owner@feestfinder.vn', 'second@feestfinder.vn']);
      const row = (await db.query<{ password_hash: string | null }>(`select password_hash from users where email = 'owner@feestfinder.vn'`)).rows[0];
      assert.equal(row.password_hash, null);
    });

    it('never promotes an existing account', async () => {
      await db.query(`delete from users`);
      await db.query(`insert into users (email, signup_method) values ('taken@feestfinder.vn', 'email')`);
      await ensureAdmin(db, 'taken@feestfinder.vn', () => {});
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
