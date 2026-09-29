import { loadConfig } from '../config.ts';
import { checkEnvironment, claimEnvironment } from './environment.ts';
import { openDb } from './index.ts';
import { migrate } from './migrate.ts';

/**
 * `npm run migrate`: applies pending migrations to the database in DATABASE_URL, the way the
 * server does at startup. From a laptop that is the staging database; to migrate production
 * ahead of a deploy, run `FF_ENV=production npm run migrate` with production's URL.
 */
const command = process.argv[2];
if (command !== 'migrate') {
  console.error(`Unknown command ${command ?? '(none)'}. The only one is: migrate`);
  process.exit(1);
}
const config = loadConfig();
const db = await openDb(config);
console.log(`database: ${db.provider} (${db.location}), ${config.environment}`);
const unlabelled = db.kind === 'postgres' && await checkEnvironment(db, config.environment);
const applied = await migrate(db, (m) => console.log(m));
if (unlabelled) await claimEnvironment(db, config.environment, (m) => console.log(m));
if (!applied.length) console.log('up to date');
await db.close();
