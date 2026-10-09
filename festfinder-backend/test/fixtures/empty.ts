/**
 * An embedded database the way production starts: the migrations, one account per role and
 * an organiser with no listings — no demo data. The /ops checks (e2e/empty.spec.ts) open every
 * route on it.
 *
 *   PGLITE_DIR=./.data/pglite-empty node test/fixtures/empty.ts
 */
import { rmSync } from 'node:fs';
import { loadConfig } from '../../src/config.ts';
import { openDb } from '../../src/db/index.ts';
import { migrate } from '../../src/db/migrate.ts';
import { hashPassword } from '../../src/lib/crypto.ts';
import { EMPTY_ACCOUNTS } from './empty-accounts.ts';

const config = loadConfig();
if (config.databaseUrl || !config.pgliteDir || config.pgliteDir.startsWith('memory://')) {
  console.error('This fixture only goes into an embedded test database: set PGLITE_DIR to a directory and leave DATABASE_URL unset.');
  process.exit(1);
}
rmSync(config.pgliteDir, { recursive: true, force: true });
const db = await openDb({ databaseUrl: null, pgliteDir: config.pgliteDir });
await migrate(db);

const user = async (name: string, who: keyof typeof EMPTY_ACCOUNTS, role: 'user' | 'admin') =>
  (await db.query<{ id: string }>(`insert into users (name, email, password_hash, signup_method, role) values ($1, $2, $3, 'email', $4) returning id`,
    [name, EMPTY_ACCOUNTS[who].identifier, await hashPassword(EMPTY_ACCOUNTS[who].password), role])).rows[0].id;
await user('FeestFinder Team', 'admin', 'admin');
await user('Lan', 'attendee', 'user');
const owner = await user('Saigon Sound', 'organizer', 'user');
const org = (await db.query<{ id: string }>(
  `insert into organizers (slug, name, initials, type, art) values ('saigon-sound', 'Saigon Sound', 'SS', 'promoter', 'linear-gradient(135deg,#8C6BFF,#2AC4E8)') returning id`)).rows[0].id;
await db.query(`insert into organizer_members (organizer_id, user_id, role) values ($1, $2, 'owner')`, [org, owner]);
console.log(`empty database at ${config.pgliteDir}: 3 accounts, 1 organiser, no listings`);
await db.close();
