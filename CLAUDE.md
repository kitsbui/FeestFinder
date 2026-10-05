# FeestFinder: notes for coding agents

Event discovery for Vietnam and Asia (HCMC, Hà Nội, Đà Nẵng, Nha Trang, Bangkok, Tokyo, Singapore, Bali). Vietnamese first, bilingual everywhere. Live at https://feestfinder.com. The brand is spelled FeestFinder; code names, packages and folders keep `festfinder`.

## Where things are

| Path | What it is |
| --- | --- |
| `festfinder-backend/` | The API and the production server: Node 24, TypeScript run directly (no build step), Fastify, Postgres on Supabase. It also serves the screens below. |
| `festfinder-backend/src/routes/` | One file per area. `admin/*` serves the team, `organizer/*` the organisers' back office, `frontend.ts` serves the screens and their caching, `seo.ts` serves robots, the sitemap, llms.txt and OG images. |
| `festfinder-backend/src/services/` | Logic shared by routes: `seo.ts` (one builder for every page's SEO/AIO), `oauth.ts`, `notify.ts`, `messaging.ts`, `tickets.ts`, `resale.ts`… |
| `festfinder-backend/src/services/ingest/` | Event intelligence: `adapters/` (website JSON-LD, ICS, Ticketmaster), `normalize.ts`, `resolve.ts` (deterministic dedupe), `confidence.ts` (rules + freshness), `run.ts` (the pipeline), `fetch.ts` (robots.txt, per-host spacing). Imports never publish: they merge into an event or wait in the review queue. |
| `festfinder-backend/src/lib/` | `i18n.ts` (`L(en, vi)`, genres), `places.ts` (countries and cities with timezone, currency, bounds; synced to the tables after every migration), `styles.ts` (music styles, event types, classifier), `money.ts`, `errors.ts`, `validate.ts` (`parse`, `limit`, `csv`), `time.ts` (`atZone`, `dateIn`, `isoIn` for event times; the `vn*` helpers for back-office dates), `format.ts`. |
| `festfinder-backend/src/db/migrations/` | Numbered SQL files, applied on boot. The next one is `018_*.sql`. Never edit a migration that has shipped. |
| `festfinder-backend/test/` | `node --test` on PGlite in memory. `helpers.ts` has `setup()`, `people.ts` has `emailUser()`, and `fixtures/seed.ts` is the demo data. Demo data exists only in the tests. |
| `festfinder-backend/e2e/` | Playwright. `screens.spec.ts` runs against both fronts; `next/` holds checks that only apply to Next. |
| `festfinder-frontend/pages/<surface>/` | The four screens built from the Claude Design handoff: `web`, `app`, `organizer` (URL `/studio`), `admin` (URL `/console`). Each has `template.html` (markup with `{{ bindings }}`), `logic.js` (one class with a `renderVals()` that returns every binding), `data.js` (API loaders) and `shell.html`. |
| `festfinder-frontend/pages/ops/` | `/ops`, the working back office: plain ES modules on vendored React (`js/core.js`, `js/ui.js`, `js/team/*`, `js/org/*`). It does not use the design runtime. |
| `festfinder-frontend/ui/` | `ff-client.js` (the `FF` runtime: API calls, routing, session, OAuth return, mount), `theme.css` (the "Bảng phấn" Chalkboard look), `support.js` (**generated** design runtime; do not edit), `fonts/` (Be Vietnam Pro, served from this site; no Google Fonts request, and the CSP allows none), `map/ff-map.js` (the map, shared by both fronts, loaded by `FF.loadMap()`), and `vendor/` (React, MapLibre + pmtiles, and the Phosphor icons cut to the ones in use). |
| `festfinder-frontend/vendor-src/`, `scripts/` | The full Phosphor fonts and `subset-icons.py`, which cuts them. Neither is deployed. |
| `festfinder-web/` | The same screens on Next.js 16. `scripts/compile-screens.ts` turns each `template.html` into `src/screens/*/view.tsx` (generated, gitignored); `logic.js` and `data.js` are shared as they are. `src/runtime/ff.ts` mirrors `ui/ff-client.js`. Production does not run this front; keep it working and tested anyway. |
| `design_handoff_festfinder/` | The original handoff. Reference only; never edit it. |
| `docs/` | `CURRENT_ARCHITECTURE.md`, `TECH_DEBT.md`, `FEESTFINDER_IMPLEMENTATION_PLAN.md` (the event-intelligence plan and the decisions behind it) and `FEESTFINDER_ROADMAP.md`. Update the roadmap with the work. |

## Commands

Run from `festfinder-backend/` unless noted.

```bash
npm run typecheck          # tsc for src+test and for e2e; noUnusedLocals/Parameters are on
npm test                   # every API test (a few minutes)
node --test test/auth.test.ts                  # one file
npm run test:screens       # Playwright on the API-served screens (ports 4100/4101, own PGlite)
npm run test:screens:next  # the same specs against a production Next build (3100)
npm run dev                # API + screens on :4000 against the staging database in .env
```

For the Next front, run `npm run dev` / `npm run build` from `festfinder-web/`. Both compile the screens first.

## Rules this codebase follows

- **Copy:** server text uses `L('English', 'Tiếng Việt')`. Screen text lives in the `{en, vi}` dictionary at the top of each `logic.js` and is read as `L.key`. The web defaults to Vietnamese.
- **Lean UI:** the user wants titles and actions, not explanations. Add a hint only for a format rule. No tips cards, no "why we ask" lines.
- **Look:** cream `#FFFCE1` on `#0E100F`. Accent green is `#ABFF84` / `#0AE448`. Colour stands for genre (`FF.genreArt`). Icons are Phosphor `ph-bold` / `ph-fill`.
- **Icons:** the fonts hold only the icons in use. After using a new one, run `python3 -m pip install fonttools brotli` once, then `python3 festfinder-frontend/scripts/subset-icons.py`. `test/icons.test.ts` fails until you do, and also fails on a name Phosphor does not have.
- **Changing a screen:** edit `festfinder-frontend/pages/<surface>/`, never `festfinder-web/src/screens/`. Anything added to `renderVals()` must be used in the template.
- **The two runtimes:** a change to `ui/ff-client.js` almost always needs the same change in `festfinder-web/src/runtime/ff.ts`.
- **Validation:** validate input with zod through `parse()`. Throw `AppError` helpers so the error reaches the client as `{error: {code, message}}`. Build SQL only with positional parameters (`$1` or `SqlParams.p()`). Interpolate column names only from fixed lists.
- **Sign-in:** Google first. OAuth comes back through `/auth/oauth/:provider/return`, which redirects with `?auth=…&via=…` or `?auth_error=…`. `GET /auth/providers` says which ways in are configured, and the sign-in card shows only those. `GET /auth/session?optional=1` answers `{user: null}` instead of a 401.
- **Production data:** there is no demo data and no seed in production, and there must never be a fallback database. Production and staging Supabase projects refuse each other's labels.
- **Places, time and money:** never hard-code a city, a UTC offset or `₫`. A city comes from `lib/places.ts` (add one there; it is synced to the `cities` table); an event's instants use its city's timezone (`atZone`, `isoIn`); prices are whole units of `events.currency`, shown with `formatMoney` / `FF.money`. FeestFinder checkout and ticket tiers are VND only.
- **Sources:** ingestion is one more source next to organisers and the community, never a publisher. No adapter for Resident Advisor or Facebook (their terms forbid it); their links are kept as provenance only. New adapters go in `services/ingest/adapters/` and `ADAPTERS`, with fixture tests in `test/ingest.test.ts` (no live requests).
- **Map:** the map view asks `/events/map` when it opens and on "search this area" only, never on pan. The basemap is two self-hosted PMTiles archives, cut by `festfinder-backend/scripts/build-tiles.sh`: `MAP_OVERVIEW_URL` (the region, zoom 0–7) and `MAP_TILES_URL` (the listed cities, zoom 0–14), plus optional `MAP_GLYPHS_URL`. Without them the map draws the board and the events. Rebuild the tiles after adding a city.
- **Commits:** commit, push or deploy only when the user asks. A push to `main` is a production deploy.

## Caching (frontend.ts)

Outside development, every `/ui` and `/pages` URL carries `?v=<content hash>`:
- `ff-client.js` adds it to what it fetches, and `stampUrls()` adds it to HTML and CSS.
- Versioned files are `immutable`. Shells get `s-maxage=86400`. Event and organiser pages get `s-maxage=60`.
- Vercel starts a fresh CDN cache on every deployment.
- Responses for a signed-in person get `private, no-store` (`app.ts` onSend hook).

## Deploying

- Vercel project `feestfinder`, root directory `festfinder-backend`. Functions run in `hnd1` (Tokyo), next to the Supabase database.
- Pushing to `main` deploys production: the project is linked to GitHub with `main` as its production branch. Other branches get preview deployments on the staging database. Migrations run on boot.
- Work happens on a branch and reaches `main` by merge. CI (`.github/workflows/ci.yml`) runs on pushes to `main` and on pull requests.
- To ship a branch without merging it, run `vercel deploy --prod --yes` from the repo root.
- pg_cron calls `POST https://feestfinder.com/internal/jobs` every minute.
- Secrets, such as `GOOGLE_CLIENT_SECRET`, are entered by the user in Vercel.

## Checking a change

1. `npm run typecheck`, then the test file for the area, then `npm test`.
2. Screen changes: `npm run test:screens`, and `npm run test:screens:next` too when shared logic or a runtime changed.
3. Add a test next to similar ones: API behaviour in `test/*.test.ts`, a flow on screen in `e2e/screens.spec.ts`.
