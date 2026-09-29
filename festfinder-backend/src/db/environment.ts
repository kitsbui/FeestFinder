import type { Config } from '../config.ts';
import type { Db } from './index.ts';

type Environment = Config['environment'];

/**
 * Production and staging are separate Supabase projects, and each database is labelled with
 * the one it serves (table database_environment, migration 009). A deployment on the other's
 * database stops before it migrates or writes anything.
 *
 * Returns true when the database has no label yet: the caller claims it once migrated. Staging
 * never claims a database that already holds accounts, organisers or events, which may be
 * production's.
 */
export async function checkEnvironment(db: Db, want: Environment): Promise<boolean> {
  const have = await readEnvironment(db);
  if (have) {
    if (have !== want) throw new Error(mismatch(want));
    return false;
  }
  if (want === 'staging' && await exists(db, 'users')) {
    const rows = (await db.query<{ n: number }>(
      'select (select count(*) from users) + (select count(*) from organizers) + (select count(*) from events) as n')).rows[0].n;
    if (rows) {
      throw new Error(`This staging deployment is on a database that already holds data and has no environment label: it may be production's. `
        + `If it is the staging database, label it in the Supabase SQL editor with: insert into database_environment (name) values ('staging'). `
        + `Otherwise put the staging project's connection string in DATABASE_URL.`);
    }
  }
  return true;
}

/** Labels an unlabelled database; the first deployment to get there decides. */
export async function claimEnvironment(db: Db, want: Environment, log: (msg: string) => void) {
  await db.query('insert into database_environment (name) values ($1) on conflict (id) do nothing', [want]);
  if (await readEnvironment(db) !== want) throw new Error(mismatch(want));
  log(`labelled this database ${want}`);
}

/** The database's label, or null before migration 009 or before anyone claimed it. */
export async function readEnvironment(db: Db): Promise<Environment | null> {
  if (!await exists(db, 'database_environment')) return null;
  return (await db.query<{ name: Environment }>('select name from database_environment')).rows[0]?.name ?? null;
}

async function exists(db: Db, table: string) {
  return (await db.query<{ ok: boolean }>('select to_regclass($1) is not null as ok', [`public.${table}`])).rows[0].ok;
}

function mismatch(want: Environment) {
  return want === 'staging'
    ? 'This is a staging deployment (a laptop or a preview), but DATABASE_URL is the production database. Put the staging project\'s connection string in DATABASE_URL (Supabase → Connect → Transaction pooler). To run a command against production on purpose, prefix it with FF_ENV=production.'
    : 'This is the production deployment, but DATABASE_URL is the staging database. Set DATABASE_URL for Production to the production project\'s connection string.';
}
