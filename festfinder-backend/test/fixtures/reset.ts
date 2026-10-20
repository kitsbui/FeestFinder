/**
 * A fresh embedded database with the demo data, for the screen tests (Playwright starts the
 * API on it). Only ever touches the directory in PGLITE_DIR: the demo data never goes into
 * Supabase.
 *
 *   PGLITE_DIR=./.data/pglite-screens node test/fixtures/reset.ts
 */
import { rmSync } from 'node:fs';
import { loadConfig } from '../../src/config.ts';
import type { Ctx } from '../../src/context.ts';
import { openDb } from '../../src/db/index.ts';
import { migrate } from '../../src/db/migrate.ts';
import { fixedClock, systemClock } from '../../src/lib/time.ts';
import { importBlogContent } from '../../src/services/blog-content.ts';
import { seedRadar } from './radar.ts';
import { seed } from './seed.ts';

const config = loadConfig();
if (config.databaseUrl || !config.pgliteDir || config.pgliteDir.startsWith('memory://')) {
  console.error('The demo data only goes into an embedded test database: set PGLITE_DIR to a directory and leave DATABASE_URL unset.');
  process.exit(1);
}
rmSync(config.pgliteDir, { recursive: true, force: true });
const db = await openDb({ databaseUrl: null, pgliteDir: config.pgliteDir });
await migrate(db, (m) => console.log(m));
const clock = config.fixedNow ? fixedClock(config.fixedNow) : systemClock;
const { ids: _ids, ...summary } = (await seed(db, clock.now(), { volume: process.env.SEED_VOLUME === 'small' ? 'small' : 'full' })) as Record<string, unknown>;
// The local preview also shows what Feest Radar finds (test/fixtures/radar.ts).
if (process.env.SEED_RADAR === '1') Object.assign(summary, await seedRadar(db, clock));
// And the blog's editorial packs (src/content/blog), published as the team would publish them: a
// reset preview never shows an empty blog (the import job does not run there).
if (process.env.SEED_BLOG === '1') {
  const blog = await importBlogContent({ db, clock } as unknown as Ctx);
  await db.query(`update blog_posts set status = 'published', published_at = $1, decided_at = $1 where import_key is not null and status = 'in_review'`, [clock.now()]);
  Object.assign(summary, { blog: blog.added });
}
console.log(`seeded ${config.pgliteDir}: ${JSON.stringify(summary)}`);
await db.close();
