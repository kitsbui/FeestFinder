# FeestFinder: notes for coding agents

Event discovery for Vietnam and Asia (HCMC, Hà Nội, Đà Nẵng, Nha Trang, Bangkok, Tokyo, Singapore, Bali). Vietnamese first, bilingual everywhere. Live at https://feestfinder.com. The brand is spelled FeestFinder; code names, packages and folders keep `festfinder`.

## Where things are

| Path | What it is |
| --- | --- |
| `festfinder-backend/` | The API and the production server: Node 24, TypeScript run directly (no build step), Fastify, Postgres on Supabase. It also serves `/ops`, the working back office, with the `/ui` and `/pages` files it loads; feestfinder.com reaches it through the Next proxy. |
| `festfinder-backend/src/routes/` | One file per area. `admin/*` serves the team, `organizer/*` the organisers' back office, `frontend.ts` serves `/ops` and the `/ui` and `/pages` files, with their caching, `seo.ts` serves robots, the sitemap, llms.txt and OG images. |
| `festfinder-backend/src/services/` | Logic shared by routes: `seo.ts` (one builder for every page's SEO/AIO), `oauth.ts`, `notify.ts`, `messaging.ts`, `tickets.ts`, `resale.ts`… |
| `festfinder-backend/src/services/ingest/` | Event intelligence: `adapters/` (website JSON-LD, ICS, Ticketmaster), `normalize.ts`, `resolve.ts` (deterministic dedupe), `confidence.ts` (rules + freshness), `run.ts` (the pipeline), `fetch.ts` (robots.txt, per-host spacing). Imports never publish: they merge into an event or wait in the review queue. |
| `festfinder-backend/src/lib/` | `i18n.ts` (`L(en, vi)`, genres), `places.ts` (countries and cities with timezone, currency, bounds; synced to the tables after every migration), `styles.ts` (music styles, event types, classifier), `money.ts`, `errors.ts`, `validate.ts` (`parse`, `limit`, `csv`), `time.ts` (`atZone`, `dateIn`, `isoIn` for event times; the `vn*` helpers for back-office dates), `format.ts`. |
| `festfinder-backend/src/db/migrations/` | Numbered SQL files, applied on boot. The next one is `031_*.sql`. Never edit a migration that has shipped. |
| `festfinder-backend/test/` | `node --test` on PGlite in memory. `helpers.ts` has `setup()`, `people.ts` has `emailUser()`, and `fixtures/seed.ts` is the demo data. Demo data exists only in the tests. |
| `festfinder-backend/e2e/` | Playwright. `screens.spec.ts` and `empty.spec.ts` check every /ops route on the demo data and on an empty database, against the API alone (`playwright.config.ts`); `next/` holds the site's checks, and `playwright.next.config.ts` runs them with the seeded /ops checks through the proxy. |
| `festfinder-frontend/pages/ops/` | `/ops`, the working back office, served by the API: plain ES modules on vendored React (`js/core.js`, `js/ui.js`, `js/team/*`, `js/org/*`, `js/artist/*`), copy inline as `t('Tiếng Việt', 'English')`. |
| `festfinder-frontend/ui/` | The files /ops and the site load from `/ui`: `theme.css` (the "Bảng phấn" look /ops uses), `fonts/` (Be Vietnam Pro, served from this site; no Google Fonts request, and the CSP allows none), `map/ff-map.js` (the map, loaded by `FF.loadMap()` in `festfinder-web/src/runtime/ff.ts`), `assets/` (brand images, favicons), `_ds/` (the Nocturne design-system bundle) and `vendor/` (React for /ops, MapLibre + pmtiles, and the Phosphor icons /ops uses, cut to the ones in use). The Next build copies `vendor`, `fonts`, `_ds`, `assets` and `map` to `festfinder-web/public/ui/`. |
| `festfinder-frontend/vendor-src/`, `scripts/` | The full Phosphor fonts and `subset-icons.py`, which cuts them. Neither is deployed. |
| `festfinder-web/` | The Kính đêm ("night glass") redesign on Next.js 16: hand-written React 19 + Tailwind v4. Routes in `src/app/(kd)/`; the screens in `src/kd/` (`ui/` the parts, `web/`, `app/`, `studio/`, `console/`, strings in `copy/` and each screen's `copy.ts`); `src/kd/theme.css` holds the tokens; `/kit` (with `FF_KIT=1`) shows every part. `src/runtime/ff.ts` is the browser runtime (`FF`). `scripts/copy-ui.ts` (`npm run copy-ui`) copies `public/ui/` from `festfinder-frontend/ui` before dev and build. The board files are in `design_handoff_kinh_dem/` (reference only). Production runs this front at feestfinder.com; every path that is not one of its pages goes to the API through `src/proxy.ts`. |
| `design_handoff_festfinder/` | The original handoff. Reference only; never edit it. |
| `docs/` | `CURRENT_ARCHITECTURE.md`, `TECH_DEBT.md`, `FEESTFINDER_IMPLEMENTATION_PLAN.md` (the event-intelligence plan and the decisions behind it) and `FEESTFINDER_ROADMAP.md`. Update the roadmap with the work. |

## Commands

Run from `festfinder-backend/` unless noted.

```bash
npm run typecheck          # tsc for src+test and for e2e; noUnusedLocals/Parameters are on
npm test                   # every API test (a few minutes)
node --test test/auth.test.ts                  # one file
npm run test:screens       # Playwright on /ops served by the API (ports 4100/4101, own PGlite)
npm run test:screens:next  # e2e/next, plus /ops through the proxy, against a production Next build (3100)
npm run dev                # API + /ops on :4000 against the staging database in .env
```

For the Next front, run `npm run dev` / `npm run build` from `festfinder-web/`. Both copy `public/ui/` first.

## Rules this codebase follows

- **Copy:** server text uses `L('English', 'Tiếng Việt')`. Screen text on the site is `{en, vi}` pairs in `festfinder-web/src/kd/copy/` and each screen's `copy.ts`, read with `pick()`; /ops writes it inline as `t('Tiếng Việt', 'English')` (`pages/ops/js/core.js`). The web defaults to Vietnamese.
- **Lean UI:** the user wants titles and actions, not explanations. Add a hint only for a format rule. No tips cards, no "why we ask" lines.
- **Look:** the site (Kính đêm): `void` `#08090a` with glass panels, one lime action per screen (`acc` `#E4F222`), type in Be Vietnam Pro and JetBrains Mono, icons from `@phosphor-icons/react` (Regular, imported per icon). Pages are full width on desktop: `.kd-wrap` has no max width, only the gutter (`--kd-gutter`: 16, 32, then up to 64px); long text keeps `max-w-read`, and card grids add columns rather than widen. On desktop `/app` fills the screen beside its tab bar, which becomes a side rail. Colour stands for genre (`familyOf` / `g()` in `festfinder-web/src/kd/genre.ts`; the OG art in `services/ogimage.ts`). /ops keeps the Bảng phấn look (`ui/theme.css` + `pages/ops/ops.css`): cream `#FFFCE1` on `#0E100F`, accent green `#ABFF84` / `#0AE448`, icons Phosphor `ph-bold` / `ph-fill`.
- **Icons (/ops):** the /ops icon fonts hold only the icons in use. After using a new one, run `python3 -m pip install fonttools brotli` once, then `python3 festfinder-frontend/scripts/subset-icons.py`. `test/icons.test.ts` fails until you do, and also fails on a name Phosphor does not have.
- **Changing a screen:** the site's screens are in `festfinder-web/src/kd/`; /ops is in `festfinder-frontend/pages/ops/`.
- **The runtime:** there is one, `festfinder-web/src/runtime/ff.ts` (`FF`, with `src/kd/runtime.tsx`). The map stays in `festfinder-frontend/ui/map/ff-map.js`, which the Next build copies and `FF.loadMap()` loads. /ops has its own small helpers in `pages/ops/js/core.js`.
- **Validation:** validate input with zod through `parse()`. Throw `AppError` helpers so the error reaches the client as `{error: {code, message}}`. Build SQL only with positional parameters (`$1` or `SqlParams.p()`). Interpolate column names only from fixed lists.
- **Sign-in:** Google first. OAuth comes back through `/auth/oauth/:provider/return`, which redirects with `?auth=…&via=…` or `?auth_error=…`. `GET /auth/providers` says which ways in are configured, and the sign-in card shows only those. `GET /auth/session?optional=1` answers `{user: null}` instead of a 401.
- **Personas and admin:** every account is a fan; artist and organiser are `user_roles`, and listed profiles are claimed, never duplicated. Admin comes only from the `ADMIN_EMAIL` allowlist on a Google sign-in with a verified email: never add a route, role choice or shared password that grants it, and never write the allowlist into the repo.
- **Artists and gigs:** follower counts never rank an artist, a directory or a gig applicant. Network lines are read from events with their evidence, not stored. An artist's gig report is a source, never a publisher. The artist directory lives at `/a` (`/a/style/<style>`, `/a/city/<city>`) because `/artists` is the API.
- **Analytics:** `FF.track(name, props)` only with a name in `CLIENT_EVENTS` and keys in `ALLOWED_PROPS` (`services/analytics.ts`); never an email, a name or an IP. Nothing leaves without `POSTHOG_KEY`.
- **Production data:** there is no demo data and no seed in production, and there must never be a fallback database. Production and staging Supabase projects refuse each other's labels.
- **Places, time and money:** never hard-code a city, a UTC offset or `₫`. A city comes from `lib/places.ts` (add one there; it is synced to the `cities` table); an event's instants use its city's timezone (`atZone`, `isoIn`); prices are whole units of `events.currency`, shown with `formatMoney` / `money()` (`festfinder-web/src/kd/format.ts`). FeestFinder checkout and ticket tiers are VND only.
- **Sources:** ingestion is one more source next to organisers and the community, never a publisher. No adapter for Resident Advisor or Facebook (their terms forbid it); their links are kept as provenance only. New adapters go in `services/ingest/adapters/` and `ADAPTERS`, with fixture tests in `test/ingest.test.ts` (no live requests).
- **Ticket buttons:** every one goes through `/go/<event>` (`routes/outbound.ts`), never straight to `ticket_url`: it counts the click, picks FeestFinder's checkout or the seller, and adds a partner's tracking (`services/partners.ts`, `/ops/partners`).
- **Map:** the map view asks `/events/map` when it opens and on "search this area" only, never on pan. The basemap is two self-hosted PMTiles archives, cut by `festfinder-backend/scripts/build-tiles.sh`: `MAP_OVERVIEW_URL` (the region, zoom 0–7) and `MAP_TILES_URL` (the listed cities, zoom 0–14), plus optional `MAP_GLYPHS_URL`. Without them the map draws the board and the events. Rebuild the tiles after adding a city.
- **Commits:** commit, push or deploy only when the user asks. A push to `main` is a production deploy.

## Caching (frontend.ts)

Outside development, the `/ui` and `/pages` URLs in the /ops shell and in CSS carry `?v=<content hash>`:
- `stampUrls()` adds it.
- Versioned files are `immutable`; the same file without it (a module /ops imports) gets `max-age=3600`. The /ops shell gets `s-maxage=86400`.
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
2. Browser checks: `npm run test:screens` for /ops, `npm run test:screens:next` for the site (its checks are in `e2e/next/`; it also runs the /ops checks through the proxy).
3. Add a test next to similar ones: API behaviour in `test/*.test.ts`, a page of the site in `e2e/next/<area>.spec.ts`, an /ops flow in `e2e/screens.spec.ts`.
