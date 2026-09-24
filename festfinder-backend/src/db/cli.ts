import { rmSync } from 'node:fs';
import { loadConfig } from '../config.ts';
import { openDb } from './index.ts';
import { migrate } from './migrate.ts';
import { seed } from './seed.ts';
import { fixedClock, systemClock } from '../lib/time.ts';

const command = process.argv[2];
const config = loadConfig();
const log = (m: string) => console.log(m);

if (command === 'reset') {
  if (config.databaseUrl) {
    console.error('db:reset only wipes the embedded PGlite database. Drop and recreate a Postgres database yourself.');
    process.exit(1);
  }
  rmSync(config.pgliteDir, { recursive: true, force: true });
  log(`removed ${config.pgliteDir}`);
}

const db = await openDb(config);
await migrate(db, log);
if (command === 'seed' || command === 'reset') {
  const clock = config.fixedNow ? fixedClock(config.fixedNow) : systemClock;
  const { ids: _ids, ...summary } = (await seed(db, clock.now(), { volume: process.env.SEED_VOLUME === 'small' ? 'small' : 'full', password: config.demoPassword ?? undefined })) as Record<string, unknown>;
  log(`seeded: ${JSON.stringify(summary)}`);
}
await db.close();
