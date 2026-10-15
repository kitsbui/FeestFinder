---
name: feestfinder-migration
description: Add a database migration to FeestFinder (festfinder-backend/src/db/migrations). Use whenever a change needs a new table, column, index, constraint or data fix.
---

# A new migration

1. The next number is in `CLAUDE.md` ("The next one is `0NN_*.sql`"). Name it `0NN_what_it_does.sql` and bump that line in `CLAUDE.md` in the same change.
2. Never edit a migration that has shipped (anything on `main`); write a new one instead. Migrations run on boot, in order, on PGlite (tests, preview) and on Supabase (staging, production).
3. Start with a comment that says why, in plain words, like the others do.
4. A migration that creates tables ends with the row-level-security block every such migration carries (copy it from `034_projects.sql`): on Supabase the API never reaches public tables through `anon` or `authenticated`.
5. Use checks and partial unique indexes to hold rules in the database too (see `033_one_craft.sql`).
6. A data fix must be safe on production data you cannot see: make it idempotent, and keep what it turns off (status columns) rather than deleting.
7. Test it: `node --test test/<area>.test.ts` (each test boots a fresh PGlite with every migration), then `npm test`. Add a test that shows the rule the migration holds.
8. Mention it in `docs/FEESTFINDER_ROADMAP.md`.
