/** Writes src/db/rows.ts from the migrations, on an empty in-memory database (npm run rows). */
import { writeFileSync } from 'node:fs';
import { openDb } from '../src/db/index.ts';
import { migrate } from '../src/db/migrate.ts';
import { rowTypes } from '../src/db/row-types.ts';

const db = await openDb({ databaseUrl: null, pgliteDir: 'memory://' });
await migrate(db);
const out = new URL('../src/db/rows.ts', import.meta.url);
writeFileSync(out, await rowTypes(db));
await db.close();
console.log('wrote', out.pathname);
