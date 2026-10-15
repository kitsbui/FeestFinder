# FeestFinder: notes for coding agents

EDM event discovery for Vietnam and Asia (HCMC, Hà Nội, Đà Nẵng, Nha Trang, Bangkok, Tokyo, Singapore, Bali): club nights, raves and festivals of electronic music only. Vietnamese first, bilingual everywhere. Live at https://feestfinder.com. The brand is spelled FeestFinder; code names, packages and folders keep `festfinder`.

## Where things are

| Path | What it is |
| --- | --- |
| `festfinder-backend/` | The API and the production server: Node 24, TypeScript run directly (no build step), Fastify, Postgres on Supabase. feestfinder.com reaches it through the Next proxy. |
| `festfinder-backend/src/routes/` | One file per area. `admin/*` serves the team, `organizer/*` the organisers' back office, `frontend.ts` serves the `/ui` files with their caching and redirects the old `/ops` addresses, `seo.ts` serves robots, the sitemap, llms.txt and OG images. |
| `festfinder-backend/src/services/` | Logic shared by routes: `seo.ts` (one builder for every page's SEO/AIO), `oauth.ts`, `notify.ts`, `messaging.ts`, `tickets.ts`, `resale.ts`… |
| `festfinder-backend/src/services/ingest/` | Event intelligence: `adapters/` (website JSON-LD, ICS, Ticketmaster), `normalize.ts`, `resolve.ts` (deterministic dedupe), `confidence.ts` (rules + freshness), `run.ts` (the pipeline), `fetch.ts` (robots.txt, per-host spacing). Imports never publish: they merge into an event or wait in the review queue. |
| `festfinder-backend/src/lib/` | `i18n.ts` (`L(en, vi)`, genres), `places.ts` (countries and cities with timezone, currency, bounds; synced to the tables after every migration), `styles.ts` (music styles, event types, classifier), `money.ts`, `errors.ts`, `validate.ts` (`parse`, `limit`, `csv`), `time.ts` (`atZone`, `dateIn`, `isoIn` for event times; the `vn*` helpers for back-office dates), `format.ts`. |
| `festfinder-backend/src/db/migrations/` | Numbered SQL files, applied on boot. The next one is `035_*.sql`. Never edit a migration that has shipped. |
| `festfinder-backend/test/` | `node --test` on PGlite in memory. `helpers.ts` has `setup()`, `people.ts` has `emailUser()`, and `fixtures/seed.ts` is the demo data. Demo data exists only in the tests. |
| `festfinder-backend/e2e/` | Playwright. `next/` holds the checks of the site, the Console, Studio and the artist studio; `playwright.next.config.ts` runs them against a production Next build with the API behind it. |
| `festfinder-frontend/ui/` | The files the site loads from `/ui`: `fonts/` (Be Vietnam Pro, served from this site; no Google Fonts request, and the CSP allows none), `map/ff-map.js` (the map, loaded by `FF.loadMap()` in `festfinder-web/src/runtime/ff.ts`), `assets/` (brand images, favicons) and `vendor/` (MapLibre + pmtiles). The Next build copies `vendor`, `fonts`, `assets` and `map` to `festfinder-web/public/ui/`. |
| `festfinder-web/` | The Kính đêm ("night glass") redesign on Next.js 16: hand-written React 19 + Tailwind v4. Routes in `src/app/(kd)/`; the screens in `src/kd/` (`ui/` the parts, `web/`, `app/`, `studio/` (organisers), `artist/` (the artist studio, `/studio/artist`), `console/` (the team's back office; `console/kit.tsx` holds its shared parts), strings in `copy/` and each screen's `copy.ts`); `src/kd/theme.css` holds the tokens; `/kit` (with `FF_KIT=1`) shows every part. `src/runtime/ff.ts` is the browser runtime (`FF`). `scripts/copy-ui.ts` (`npm run copy-ui`) copies `public/ui/` from `festfinder-frontend/ui` before dev and build. Production runs this front at feestfinder.com; every path that is not one of its pages goes to the API through `src/proxy.ts`. |
| `docs/` | `CURRENT_ARCHITECTURE.md`, `TECH_DEBT.md`, `FEESTFINDER_IMPLEMENTATION_PLAN.md` (the event-intelligence plan and the decisions behind it) and `FEESTFINDER_ROADMAP.md`. Update the roadmap with the work. |

## Commands

Run from `festfinder-backend/` unless noted.

```bash
npm run typecheck          # tsc for src+test and for e2e; noUnusedLocals/Parameters are on
npm test                   # every API test (a few minutes)
node --test test/auth.test.ts                  # one file
npm run test:screens       # Playwright: e2e/next against a production Next build (3100) and its own API (4100, own PGlite)
npm run dev                # the API on :4000 against the staging database in .env
```

For the Next front, run `npm run dev` / `npm run build` from `festfinder-web/`. Both copy `public/ui/` first.

## Rules this codebase follows

- **Copy:** server text uses `L('English', 'Tiếng Việt')`. Screen text on the site is `{en, vi}` pairs in `festfinder-web/src/kd/copy/` and each screen's `copy.ts`, read with `pick()`. The web defaults to Vietnamese.
- **Lean UI:** the user wants titles and actions, not explanations. Add a hint only for a format rule. No tips cards, no "why we ask" lines.
- **Look:** the site (Kính đêm): `void` `#08090a` with glass panels, one lime action per screen (`acc` `#E4F222`), type in Be Vietnam Pro and JetBrains Mono, icons from `@phosphor-icons/react` (Regular, imported per icon). Pages are full width on desktop: `.kd-wrap` has no max width, only the gutter (`--kd-gutter`: 16, 32, then up to 64px); long text keeps `max-w-read`, and card grids add columns rather than widen. On desktop `/app` fills the screen beside its tab bar, which becomes a side rail. Every event wears the `edm` colour (`familyOf` / `g()` in `festfinder-web/src/kd/genre.ts`; the OG art in `services/ogimage.ts`); chips name styles (`styleChips`, `styleLabel`). The back offices (`/console`, `/studio`, `/studio/artist`) are Kính đêm too: a side rail, tables of grid rows, drawers from the right. No browser scrollbar takes room: `kd.css` hides them all and `kd/ui/scrollbars.tsx` (in the root layout) draws a 3px thumb over whatever scrolls, only while it scrolls; don't style scrollbars per screen.
- **Changing a screen:** every screen is in `festfinder-web/src/kd/`. `/ops` is gone: the API redirects its old addresses (`opsPath` in `routes/frontend.ts`).
- **The runtime:** there is one, `festfinder-web/src/runtime/ff.ts` (`FF`, with `src/kd/runtime.tsx`). The map stays in `festfinder-frontend/ui/map/ff-map.js`, which the Next build copies and `FF.loadMap()` loads.
- **Validation:** validate input with zod through `parse()`. Throw `AppError` helpers so the error reaches the client as `{error: {code, message}}`. Build SQL only with positional parameters (`$1` or `SqlParams.p()`). Interpolate column names only from fixed lists.
- **Sign-in:** Google first. OAuth comes back through `/auth/oauth/:provider/return`, which redirects with `?auth=…&via=…` or `?auth_error=…`. `GET /auth/providers` says which ways in are configured, and the sign-in card shows only those. `GET /auth/session?optional=1` answers `{user: null}` instead of a 401.
- **Personas and admin:** every account attends (a fan); besides that it has at most one craft, artist or organiser (`user_roles`, migration 033: the API refuses a second with `one_craft`, `POST /me/roles/switch` swaps them and keeps both profiles; the screens switch from the account menu and the workspace rails, `kd/craft.ts`). Listed profiles are claimed, never duplicated. Admin comes only from the `ADMIN_EMAIL` allowlist on a Google sign-in with a verified email: never add a route, role choice or shared password that grants it, and never write the allowlist into the repo.
- **Projects:** anyone signed in (no craft needed) pitches an idea for a night at `/p` (`routes/projects.ts`, `services/projects.ts`, migration 034): what it is, its budget, what it looks for (investment, sponsors, artists, a venue, a partner) and sponsor packages. The team reviews it before it is public (`/console/projects`); publishing needs a confirmed phone, like every post. Others offer (`invest`, `sponsor`, `perform` from an active artist profile, `venue`, `partner`); an accepted offer shows both sides each other's contact. FeestFinder never takes, holds or moves money, and every project page says so; never add a payment to it. A project linked to its event puts the accepted sponsors on the event page and in its JSON-LD (`Event.sponsor`).
- **Artists and gigs:** follower counts never rank an artist, a directory or a gig applicant. Network lines are read from events with their evidence, not stored. An artist's gig report is a source, never a publisher. The artist directory lives at `/a` (`/a/style/<style>`, `/a/city/<city>`) because `/artists` is the API.
- **Analytics:** `FF.track(name, props)` only with a name in `CLIENT_EVENTS` and keys in `ALLOWED_PROPS` (`services/analytics.ts`); never an email, a name or an IP. Nothing leaves without `POSTHOG_KEY`.
- **Production data:** there is no demo data and no seed in production, and there must never be a fallback database. Production and staging Supabase projects refuse each other's labels.
- **Places, time and money:** never hard-code a city, a UTC offset or `₫`. A city comes from `lib/places.ts` (add one there; it is synced to the `cities` table); an event's instants use its city's timezone (`atZone`, `isoIn`); prices are whole units of `events.currency`, shown with `formatMoney` / `money()` (`festfinder-web/src/kd/format.ts`). FeestFinder checkout and ticket tiers are VND only.
- **EDM only:** the one genre is `EDM` (`lib/i18n.ts` `GENRES`, a database check since migration 031); people filter by its styles (`lib/styles.ts` `STYLES`, `?style=`). An import that names another genre and no EDM style is dropped (`OTHER_GENRES`), one with no style waits for review, and approving it makes it EDM. Sources that list every kind of music set `requireStyle`.
- **Posted or Radar:** every event and artist is one or the other, and the site says which. `events.origin` is `radar` when nobody on FeestFinder posted it (no `organizer`, `community`, `team` or `artist` source), only FeestFinder Radar (ingestion) found it; `refreshConfidence` keeps it current, so an organiser claiming it makes it posted. An artist is Radar when nobody runs or verified the profile and every event it plays is Radar (`ORIGIN` in `services/artists.ts`). `?origin=posted|radar` filters `/events`, `/events/map` and `/artists`; `facets.origin` / `origins` count them. On the site, `kd/ui/origin.tsx`: `RadarTag` on anything Radar found, `OriginTabs` (Tất cả · Đã đăng · Radar) on `/list` and `/a`, and a Radar event's page names FeestFinder Radar instead of its placeholder organiser. The local preview seeds a few Radar finds (`SEED_RADAR=1`, `test/fixtures/radar.ts`); the screen tests do not.
- **Sources:** ingestion is one more source next to organisers and the community, never a publisher. No adapter for Resident Advisor or Facebook (their terms forbid it); their links are kept as provenance only. New adapters go in `services/ingest/adapters/` and `ADAPTERS`, with fixture tests in `test/ingest.test.ts` (no live requests).
- **Ticket buttons:** every one goes through `/go/<event>` (`routes/outbound.ts`), never straight to `ticket_url`: it counts the click, picks FeestFinder's checkout or the seller, and adds a partner's tracking (`services/partners.ts`, `/console/partners`).
- **Map:** the map view asks `/events/map` when it opens and on "search this area" only, never on pan. The basemap is two self-hosted PMTiles archives, cut by `festfinder-backend/scripts/build-tiles.sh`: `MAP_OVERVIEW_URL` (the whole world, zoom 0–6, drawn below zoom 7) and `MAP_TILES_URL` (the listed cities, zoom 0–14, drawn from zoom 7, so no tile is drawn twice), on Vercel Blob (store `feestfinder-tiles`, `tiles/<planet build>/…`). Street, ward and city names use the site's own Noto Sans glyphs in `festfinder-frontend/ui/map/glyphs` (`MAP_GLYPHS_URL` overrides them). Without the archives the map draws the board and the events. Rebuild the tiles after adding a city, upload them under a new build folder and point the variables there.
- **Commits:** commit, push or deploy only when the user asks. A push to `main` is a production deploy.

## Skills and MCP (for coding agents)

- `.claude/skills/`: `feestfinder-preview` (run or restart the local preview), `feestfinder-migration`, `feestfinder-add-city` (places, tiles, Blob, `MAP_*`), `feestfinder-radar-adapter` and `feestfinder-ship` (checks, merge, deploy, verify). Keep them true when the commands they name change.
- `.mcp.json`: the Vercel MCP server (sign in with OAuth when asked) and the Supabase one, read-only, on the project in `SUPABASE_PROJECT_REF` with the token in `SUPABASE_ACCESS_TOKEN` (both from your own environment; use staging). Never write a ref, token or password into the repo.

## Caching (frontend.ts)

Outside development, the `/ui` URLs in CSS carry `?v=<content hash>`:
- `stampUrls()` adds it.
- Versioned files are `immutable`; the same file without it gets `max-age=3600`.
- Vercel starts a fresh CDN cache on every deployment.
- Responses for a signed-in person get `private, no-store` (`app.ts` onSend hook).

## Deploying

- Two Vercel projects, both in `hnd1` (Tokyo), next to the Supabase database:
  - `feestfinder-web` (root directory `festfinder-web`) holds feestfinder.com (`www` and `feestfinder.vercel.app` redirect to it). Its proxy (`src/proxy.ts`) forwards every non-page path to the API with fetch, signed with `WEB_PROXY_SECRET` so the API sees each visitor (`festfinder-web/README.md`, "Deploy on Vercel").
  - `feestfinder` (root directory `festfinder-backend`) is the API, at `https://feestfinder-api.vercel.app` (the web project's `FF_API_ORIGIN`). Its `PUBLIC_BASE_URL` and `CORS_ORIGINS` stay `https://feestfinder.com`.
- Pushing to `main` deploys production on both projects (both are linked to GitHub with `main` as the production branch). The API's other branches get preview deployments on the staging database; the web project builds `main` only (`festfinder-web/vercel.json`). Migrations run on boot.
- Work happens on a branch and reaches `main` by merge. CI (`.github/workflows/ci.yml`) runs on pushes to `main` and on pull requests.
- To ship the API from a branch without merging it, run `vercel deploy --prod --yes` from the repo root (the root `.vercelignore` leaves `festfinder-web` out).
- pg_cron calls `POST https://feestfinder.com/internal/jobs` every minute; the web proxy forwards it with its `Authorization`.
- There is no way back to the API's old screens: they were removed on 2026-10-09. To undo a bad web release, promote an earlier `feestfinder-web` deployment in Vercel (Instant Rollback).
- Secrets, such as `GOOGLE_CLIENT_SECRET`, are entered by the user in Vercel.

## Checking a change

1. `npm run typecheck`, then the test file for the area, then `npm test`.
2. Browser checks: `npm run test:screens` (the checks are in `e2e/next/`).
3. Add a test next to similar ones: API behaviour in `test/*.test.ts`, a page of the site or a back-office flow in `e2e/next/<area>.spec.ts`.
