# FeestFinder roadmap

How each phase of [the implementation plan](FEESTFINDER_IMPLEMENTATION_PLAN.md) is progressing. Update this page in the same change as the work.

- [x] Phase 0: Audit ([current architecture](CURRENT_ARCHITECTURE.md), [tech debt](TECH_DEBT.md), [plan](FEESTFINDER_IMPLEMENTATION_PLAN.md))
- [x] Phase 1: Canonical data architecture
  - Migration `016_intelligence.sql`: `countries`, `cities`, venue fields, event currency/styles/type/confidence/freshness, `ingest_sources`, `ingest_runs`, `raw_events`, `event_sources` with a backfill.
  - `lib/places.ts`, event times in each city's timezone, `lib/money.ts`.
- [x] Phase 2: Ingestion framework
  - `services/ingest/` with adapter contract, normaliser, idempotent runs and the `ingest` job (every 5 min, 35 s budget).
  - Responsible fetching: robots.txt, 2 s per host, ETag/Last-Modified, content hash, one retry.
- [x] Phase 3: Sources
  - Adapters: website JSON-LD (single page or list page with a link pattern), ICS, Ticketmaster Discovery (needs `TICKETMASTER_API_KEY`).
  - RA/Facebook links are kept as provenance only, never fetched.
  - `/ops/sources` adds sources, runs them, shows runs and raw records.
  - Starter sources (`services/ingest/starter.ts`): Megatix SG/ID/TH/VN, WOMB Tokyo, Savaya Bali, TicketGo (âm nhạc), Ticketmaster SG (enabled only with its key). Production adds the missing ones on boot; elsewhere "Add suggested sources" in `/ops/sources`. Once added, a source is the team's.
  - Website adapter reads unseen pages first, then the oldest, within the run's time budget; finds links in embedded Next/Nuxt data; drops tracking parameters. Per-source `skip` (not a night out), `eventType` and `wallClock` (sources that stamp one offset on every city).
  - Normaliser: English dates ("Oct 10, 2026 10 PM"), a city name in front of the title or as the venue, Bangkok/Tokyo district names.
  - [ ] Configure more sources per city in production (team task; see below).
- [x] Phase 4: Deduplication
  - One voice per brand: megatix.com.sg and megatix.vn count as one source (`brandOf`).
  - Exact provenance first, then the deterministic score (title, venue, date, time, artist, 500 m).
  - Merge at 70 or more; 45–69 becomes a flagged candidate. Reason stored.
  - Community submissions use the same resolver.
- [x] Phase 5: Confidence system
  - Configurable rules, stored breakdown, labels and freshness.
  - On cards, on the event page ("Xác minh từ N nguồn"), in the map drawer, and in the `/ops` provenance tab.
  - `confidenceMin` filter, hourly recompute job.
- [x] Phase 6: Map discovery (web)
  - MapLibre view in `/list` next to Table and Grid, with "search this area" (no fetch on pan), clusters, drawer card and URL state (`view=map&bbox=…`).
  - `/events/map` takes every list filter and caps at 500.
  - Basemap from two self-hosted PMTiles archives (`scripts/build-tiles.sh`): `MAP_OVERVIEW_URL` and `MAP_TILES_URL`.
  - [ ] Upload the archives and set the variables in production (until then the map draws the board, city names and events).
  - [x] Map view in the app (`/app/list`), sharing `FFMap.session` with the web (search on open, on a city chip and on "search this area" only).
- [x] Phase 7: Music intelligence
  - [x] Style taxonomy, event types, deterministic classifier.
  - [x] Style and type chips in the list and map; styles and type in the ops event form.
  - [x] Smart Alerts by city and style (migration `017_artists_alerts.sql`; `/me/alert` takes `cities`, `styles`; app settings chips).
  - [x] Phase 7b: artists as records (`artists`, `event_artists`, kept in step on every save, backfilled once), `/artists/:slug`, the `/a/<slug>` page on both fronts with `MusicGroup` structured data, Markdown copy and sitemap entries; lineup chips link to it.
- [x] Phase 8: Asia expansion
  - Bangkok, Tokyo, Singapore, Bali launched next to the four Vietnamese cities.
  - City chips from `/meta/discovery`; prices in local currency.
  - Venues anywhere, checked against the city's bounds.
  - FeestFinder checkout and tiers stay VND-only.

## What the team does next in production

1. Set `TICKETMASTER_API_KEY` in Vercel if Ticketmaster is wanted (Singapore has the most coverage).
2. Add sources in `/ops/sources` for each city: Ticketbox event lists, venue and festival programme pages that carry schema.org data, public ICS calendars.
3. Approve candidates in the review queue (bulk approve works). The "500+ upcoming events in 5 cities" goal depends on these sources.
4. Produce the PMTiles extract for the launched cities, upload it to the bucket with range requests enabled, and set `MAP_TILES_URL` (and `MAP_GLYPHS_URL` for place names).

## Postponed

- Resident Advisor and Facebook adapters: terms forbid scraping. Their links are kept as provenance only.
- Eventbrite and Bandsintown adapters, Playwright scraping.
- EventSignal / early warning, AI duplicate fallback, AI style classifier, semantic search, recommendations.
- "Festival within 500 km" alerts; artist bios and photos (the columns exist, nothing fills them yet).
- FeestFinder checkout in currencies other than VND.

## Log

- 2026-10-05: Phase 0 audit written. Decisions taken: hybrid ingestion, no RA/FB crawling, map back now, five cities now.
- 2026-10-05: Phases 1–6 and 8 built, phase 7 in part. API suite 224 tests (223 pass, 1 skipped as before); new `test/ingest.test.ts` (26 tests, fixtures only).
- 2026-10-05: Phase 7 finished (Smart Alerts by city and style, artist pages), the map in the app, starter sources and fixes from reading real sources.
