---
name: feestfinder-preview
description: Run, restart or check the local FeestFinder preview (site on :3000, API on :4300 with the demo data, map tiles on :4400). Use when asked to preview, start localhost, see a change in the browser, or when the preview shows stale data.
---

# Local preview

One command runs everything on this machine with the demo data, never Supabase:

```bash
bash scripts/preview.sh
```

- It installs what is missing, rebuilds a throwaway PGlite database (`festfinder-backend/.data/pglite-preview`) from `test/fixtures/seed.ts` plus a few FeestFinder Radar finds (`SEED_RADAR=1`, `test/fixtures/radar.ts`), starts the API on :4300 (`PUBLIC_BASE_URL=http://localhost:3000`, clock fixed at 2026-09-14) and the site on :3000 (`next dev`), then prints the demo accounts.
- When `.data/tiles/feestfinder-world.pmtiles` exists it also serves `.data/tiles` on :4400 (`scripts/tiles-server.ts`, range requests and CORS) and sets `MAP_OVERVIEW_URL` / `MAP_TILES_URL`. Cut the tiles once with `cd festfinder-backend && bash scripts/build-tiles.sh` (needs the `pmtiles` CLI; about 210 MB).
- In the desktop app, start it with `preview_start {name: "festfinder-preview"}` (`.claude/launch.json`); never run servers with Bash.

## Gotchas

- The API is not in watch mode: after changing `festfinder-backend/src`, stop and start the preview (the database is rebuilt, so sign-ins are lost).
- The site's server pages cache API answers for 60 s (`lib/api.ts`, `revalidate`): right after a restart a page can show the old data once; load it twice.
- Check pages in a tab of your own (`tabs_create`), not the person's tab. A background tab does not render: MapLibre never fires `load` and scroll events never fire there; use Playwright for those.
- Logs are in `.preview/` (`api.log`, `web.log`, `tiles.log`).
