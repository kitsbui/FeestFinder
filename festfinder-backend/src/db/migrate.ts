import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Db } from './index.ts';
import { syncPlaces } from '../lib/places.ts';
import { backfillArtists } from '../services/artists.ts';

// A URL literal, so Vercel's file tracing ships the .sql files with the function.
const MIGRATIONS_DIR = fileURLToPath(new URL('./migrations', import.meta.url));

/**
 * Applies every migrations/*.sql not yet recorded, in filename order, each in its own transaction.
 *
 * Every instance migrates as it starts, and production, previews and laptops share one
 * database, so several can reach a new migration at once. Each transaction takes a lock
 * first and checks again, so the migration runs once and the others see it done.
 */
export async function migrate(db: Db, log: (msg: string) => void = () => {}): Promise<string[]> {
  await db.tx(async (q) => {
    await lock(db, q);
    await q.query(`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`);
  });
  const done = new Set((await db.query<{ name: string }>('select name from schema_migrations')).rows.map((r) => r.name));
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  const applied: string[] = [];
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    const ran = await db.tx(async (q) => {
      await lock(db, q);
      if ((await q.query('select 1 from schema_migrations where name = $1', [file])).rows.length) return false;
      await execScript(db, q, sql);
      await q.query('insert into schema_migrations (name) values ($1)', [file]);
      return true;
    });
    if (!ran) continue;
    log(`applied ${file}`);
    applied.push(file);
  }
  // Reference data that lives in code: the countries and cities the site knows.
  await db.tx((q) => syncPlaces(q));
  // Events listed before artists had records of their own get linked to them, once.
  await db.tx((q) => backfillArtists(q));
  return applied;
}

/** Held until the transaction ends. PGlite is one connection in one process: nothing to wait for. */
async function lock(db: Db, q: { query: Db['query'] }) {
  if (db.kind === 'postgres') await q.query(`select pg_advisory_xact_lock(hashtext('ff:migrations'))`);
}

/**
 * Multi-statement scripts can't go through the extended query protocol.
 * PGlite exposes `exec`; node-postgres runs a parameterless query as a simple query.
 */
async function execScript(db: Db, q: { query: Db['query'] }, sql: string) {
  if (db.kind === 'pglite') {
    // Inside PGlite's transaction the tx handle only offers `query`, which is single-statement.
    for (const stmt of splitSql(sql)) await q.query(stmt);
  } else {
    await q.query(sql);
  }
}

/** Splits on semicolons outside quotes, comments and $$ bodies. */
export function splitSql(sql: string): string[] {
  const out: string[] = [];
  let buf = '';
  let i = 0;
  let inSingle = false;
  let inDollar = false;
  while (i < sql.length) {
    const ch = sql[i];
    const two = sql.slice(i, i + 2);
    if (!inSingle && !inDollar && two === '--') {
      const nl = sql.indexOf('\n', i);
      i = nl === -1 ? sql.length : nl + 1;
      continue;
    }
    if (!inSingle && two === '$$') { inDollar = !inDollar; buf += two; i += 2; continue; }
    if (!inDollar && ch === "'") inSingle = !inSingle;
    if (!inSingle && !inDollar && ch === ';') {
      if (buf.trim()) out.push(buf.trim());
      buf = '';
      i++;
      continue;
    }
    buf += ch;
    i++;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}
