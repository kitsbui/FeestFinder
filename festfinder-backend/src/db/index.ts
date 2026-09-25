import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';

/** Anything that can run a parameterised query: the pool, or a transaction. */
export interface Queryable {
  query<T = Record<string, any>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

export interface Db extends Queryable {
  kind: 'postgres' | 'pglite';
  tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

// Postgres type OIDs we parse ourselves so both drivers return the same shapes.
const INT8 = 20;
const NUMERIC = 1700;
const DATE = 1082;

/** VND amounts and counters fit comfortably inside 2^53. */
const toNumber = (v: string) => (v === null ? null : Number(v));
const asString = (v: string) => v;

/**
 * Supabase signs its Postgres certificates with its own root (Supabase Root 2021 CA, valid
 * to 2031), which Node does not trust, so `sslmode=require` fails there with
 * SELF_SIGNED_CERT_IN_CHAIN. For a Supabase host the connection is verified against that
 * root instead, hostname included. The URL's own SSL parameters are dropped, because pg
 * lets them override `ssl`. A URL literal, so file tracing ships the certificate.
 */
const SUPABASE_ROOT_CA = fileURLToPath(new URL('./certs/supabase-root-2021.crt', import.meta.url));

export function poolConfig(url: string): pg.PoolConfig {
  // Fail in seconds rather than hang a request when the database cannot be reached.
  const base = { max: 10, connectionTimeoutMillis: 10_000 };
  const u = new URL(url);
  if (!/\.supabase\.(com|co)$/.test(u.hostname)) return { ...base, connectionString: url };
  for (const k of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'uselibpqcompat', 'supa']) u.searchParams.delete(k);
  return { ...base, connectionString: u.toString(), ssl: { ca: readFileSync(SUPABASE_ROOT_CA, 'utf8'), rejectUnauthorized: true } };
}

async function openPostgres(url: string): Promise<Db> {
  pg.types.setTypeParser(INT8, toNumber);
  pg.types.setTypeParser(NUMERIC, toNumber);
  pg.types.setTypeParser(DATE, asString);
  const pool = new pg.Pool(poolConfig(url));
  pool.on('connect', (client) => { client.query(`set time zone 'UTC'`).catch(() => {}); });
  return {
    kind: 'postgres',
    query: (sql, params) => pool.query(sql, params as any[]) as any,
    async tx(fn) {
      const client = await pool.connect();
      try {
        await client.query('begin');
        const out = await fn({ query: (sql, params) => client.query(sql, params as any[]) as any });
        await client.query('commit');
        return out;
      } catch (err) {
        await client.query('rollback').catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}

async function openPglite(dir: string): Promise<Db> {
  if (!dir.startsWith('memory://')) mkdirSync(dir, { recursive: true });
  const lite = new PGlite(dir, {
    parsers: { [INT8]: toNumber, [NUMERIC]: toNumber, [DATE]: asString },
  });
  await lite.waitReady;
  await lite.exec(`set time zone 'UTC'`);
  // PGlite is a single connection; serialise transactions so they never interleave.
  let chain: Promise<unknown> = Promise.resolve();
  const run = <T>(fn: () => Promise<T>): Promise<T> => {
    const next = chain.then(fn, fn);
    chain = next.catch(() => {});
    return next;
  };
  return {
    kind: 'pglite',
    query: (sql, params) => run(() => lite.query(sql, params as any[])) as any,
    tx: (fn) => run(() => lite.transaction((t) => fn({ query: (sql, params) => t.query(sql, params as any[]) as any }))),
    close: () => lite.close(),
  };
}

export async function openDb(opts: { databaseUrl: string | null; pgliteDir: string }): Promise<Db> {
  return opts.databaseUrl ? openPostgres(opts.databaseUrl) : openPglite(opts.pgliteDir);
}

/** Serialise a value bound for a jsonb column (node-postgres would turn arrays into PG arrays). */
export const json = (v: unknown): string | null => (v === undefined || v === null ? null : JSON.stringify(v));

/** First row or null. */
export async function one<T = Record<string, any>>(q: Queryable, sql: string, params?: unknown[]): Promise<T | null> {
  const { rows } = await q.query<T>(sql, params);
  return rows[0] ?? null;
}

export async function many<T = Record<string, any>>(q: Queryable, sql: string, params?: unknown[]): Promise<T[]> {
  return (await q.query<T>(sql, params)).rows;
}
