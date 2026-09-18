import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Db } from './index.ts';

const MIGRATIONS_DIR = join(import.meta.dirname, 'migrations');

/** Applies every migrations/*.sql not yet recorded, in filename order, each in its own transaction. */
export async function migrate(db: Db, log: (msg: string) => void = () => {}): Promise<string[]> {
  await db.query(`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`);
  const done = new Set((await db.query<{ name: string }>('select name from schema_migrations')).rows.map((r) => r.name));
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  const applied: string[] = [];
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    await db.tx(async (q) => {
      await execScript(db, q, sql);
      await q.query('insert into schema_migrations (name) values ($1)', [file]);
    });
    log(`applied ${file}`);
    applied.push(file);
  }
  return applied;
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
