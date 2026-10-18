import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { openDb } from '../src/db/index.ts';
import { migrate } from '../src/db/migrate.ts';
import { rowTypes } from '../src/db/row-types.ts';

// src/db/rows.ts names every table's row for the queries (docs/TECH_DEBT.md, item 22): a migration
// that changes a table writes it again with `npm run rows`.
test('src/db/rows.ts matches the tables the migrations make', async () => {
  const db = await openDb({ databaseUrl: null, pgliteDir: 'memory://' });
  try {
    await migrate(db);
    const file = readFileSync(new URL('../src/db/rows.ts', import.meta.url), 'utf8');
    assert.equal(file, await rowTypes(db), 'run `npm run rows` in festfinder-backend after changing a table');
  } finally {
    await db.close();
  }
});
