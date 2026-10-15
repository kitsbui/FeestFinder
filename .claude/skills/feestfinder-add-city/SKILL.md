---
name: feestfinder-add-city
description: Add or launch a city in FeestFinder (places, currency, timezone, map tiles). Use when asked to support a new city or country.
---

# A new city

1. Add it to `festfinder-backend/src/lib/places.ts` (country, timezone, currency, centre, bounds; `launched` when it should show). Never hard-code a city, a UTC offset or a currency anywhere else: `places.ts` is synced to the `cities` table after every migration.
2. Run `npm run typecheck` and `npm test` from `festfinder-backend/`; places and ingestion tests check cities, timezones and money.
3. Map tiles: the cities archive covers each listed city's bounds.
   ```bash
   cd festfinder-backend && bash scripts/build-tiles.sh
   ```
   Then upload both archives to the Vercel Blob store `feestfinder-tiles` under a **new** folder named after the planet build (`tiles/<build>/…`; the old folder is cached for a year), point `MAP_OVERVIEW_URL` and `MAP_TILES_URL` at them on both Vercel projects (`feestfinder`, `feestfinder-web`; the web reads them at build time for its CSP), and redeploy. Delete the old folder once production uses the new one.
4. Ingestion sources for the city go in the Console (`/console/sources`); no Resident Advisor or Facebook adapters.
5. Note it in `docs/FEESTFINDER_ROADMAP.md`.
