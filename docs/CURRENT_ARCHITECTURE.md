# FeestFinder: current architecture

Audit of 2026-10-05, branch `feat/next` at `11dcd08`. The file map, commands and house rules for coding agents live in the root [`CLAUDE.md`](../CLAUDE.md). This page covers what the Asia event-intelligence brief needs to know: data, sources, map, jobs, deployment.

## Baseline

| Check | Result |
| --- | --- |
| `npm run typecheck` (backend `src`, `test`, `e2e`) | passes (TypeScript 7, `noUnusedLocals`/`noUnusedParameters`) |
| `npm test` (node:test on PGlite) | 198 tests in 31 suites: 197 pass, 0 fail, 1 skipped (Postgres-only) |
| Lint | none configured; the typecheck with the unused-code flags is the lint |
| Build | none for the API (Node 24 runs TypeScript directly); `festfinder-web` builds with `next build` |
| Playwright | `npm run test:screens` (API front) and `test:screens:next` (Next front); not re-run in this audit |

## Stack

| Layer | What | Version |
| --- | --- | --- |
| Runtime | Node, TypeScript run directly (type stripping) | Node 24.x, TS 7 (backend), TS 5.9 (Next) |
| API + screens | Fastify with helmet (strict CSP), cors, cookie, multipart, rate-limit | Fastify 5 |
| Database | Postgres on Supabase (production + staging projects, each labelled); PGlite in tests | pg 8, PGlite 0.5 |
| Validation | zod through `lib/validate.ts` `parse()`; errors as `AppError` → `{error:{code,message}}` | zod 4 |
| Screens | design templates (`template.html` + `logic.js` + `data.js`) run by `ui/support.js` on vendored React, served by the API | React 18 UMD |
| Second front | `festfinder-web`, Next.js; since the Kính đêm redesign (2026-10), hand-written React + Tailwind (see the last section) | Next 16, React 19, Tailwind 4 |
| Back office | `/ops`, plain ES modules on vendored React | |
| AI | Anthropic SDK for the submission form fill-in (`claude-opus-5-5`), optional | SDK 0.128 |
| Hosting | Vercel project `feestfinder`, functions in `hnd1`; GitHub `main` = production | |

## Request path

```
browser ──► Vercel (hnd1) ──► index.ts ──► src/server.ts ──► src/app.ts (Fastify)
                                                 │
            ┌────────────────────────────────────┼─────────────────────────────┐
            ▼                                    ▼                             ▼
  routes/frontend.ts                  routes/*.ts (JSON API)          routes/seo.ts
  shells, /ui, /pages,                catalog, community, me,          robots, sitemap,
  ?v=<hash> caching                   organizer/*, admin/*, …          llms.txt, OG images
                                                 │
                                       services/* ──► Postgres (Supabase)
```

`festfinder-web` (not in production) serves the same screens and proxies every non-page path to the API.

## Data model (15 migrations, applied on boot)

| Area | Tables | Notes |
| --- | --- | --- |
| Identity | `users`, `social_connections`, `friendships`, `otp_challenges`, `password_tokens`, `oauth_states`, `sessions` | Google first; FB/IG/Zalo/WA when configured. Writing needs a proven Vietnamese phone (Decree 147/2024). |
| Catalogue | `organizers`, `organizer_members`, `venues`, `events`, `ticket_tiers`, `stages`, `sets`, `site_zones`, `shelves`, `shelf_items` | One row per event; `events` is already the canonical table. |
| Commerce | `orders`, `tickets`, `scans`, `guest_list`, `promo_codes`, `payout_transfers`, `ticket_listings`, `resale_orders`, `ticket_transfers` | VND only; VietQR/Momo/ZaloPay/card. |
| Engagement | `saves`, `hypes`, `going`, `organizer_follows`, `artist_follows`, `smart_alerts`, `notifications`, `outbox`, `collections`, … | `smart_alerts` already matches genres, artists, organisers, areas and price on new listings. |
| Community | `event_posts`, `hype_goals`, `event_shares`, `share_visits`, `event_claims`, `event_updates` | |
| Operations | `moderation_decisions`, `appeals`, `listing_reports`, `audit_log` (hash-chained), `ai_calls`, `indexnow_queue` | |

### `events`, the canonical record today

- Identity and copy: `slug` (unique), `title`, `description {en, vi}`.
- Classification: `genre`, one of 8 (`EDM, Festival, Indie, Hip-Hop, Pop, Jazz, Food, Culture`) under a CHECK constraint. Genre also picks the card colour (`FF.genreArt`).
- Place: `city`, text defaulting to `ho-chi-minh` and validated against 4 slugs in `lib/i18n.ts`; `venue_id` (nullable) plus free-text `venue_name`, `address`, `area`, `lat`, `lng`.
- Time: `starts_on`/`ends_on` (local dates) and `start_time`/`end_time` (`HH:MM`). `starts_at`/`ends_at` are derived by `refreshDerived()` with a fixed UTC+7.
- People: `lineup text[]`, `artists text[]` (GIN index).
- Lifecycle: `status` (`draft → in_review → live | rejected | removed | cancelled`), `submitted_by` (community), `previous_edition_id`.
- Scores: `quality_score` (listing completeness, `services/quality.ts`), `risk_score` + `risk_factors` + `signals` + `flag` (moderation advice, `services/risk.ts`). Neither one measures whether the event is real or current.
- Provenance: only `event_url`, the submitter's source link, plus an audit-log diff line. Nothing records several sources.
- Freshness: `updated_at`, bumped only by content changes (migration 013). There is no last-seen or last-verified.

### `venues`

`name`, `address`, `area`, `city`, `lat`, `lng` (both required), `verified`, `permit_on_file`. There is no normalised name, alias, country, website or type. Team members create venues in `/ops/venues`, and the event form picks from them.

## Where events come from today

| Path | Code | Lands as |
| --- | --- | --- |
| Organisers | `/ops/org`, `/studio`, `routes/organizer/events.ts` | draft → `in_review` → moderator → `live` |
| Community | `POST /community/events` (web and app "Gửi sự kiện") | `in_review` under the community organiser `cong-dong` |
| Team | `/ops` catalogue create/duplicate | any status |
| Form fill-in | `POST /community/prefill` → `services/prefill.ts` | fills the form only: JSON-LD for free, otherwise Claude reads the page or poster |

The building blocks an ingestion pipeline can reuse:
- `services/fetchpage.ts`: SSRF-safe page fetch. It checks every redirect hop, blocks private addresses, caps pages at 2 MB with an 8 s timeout and identifies as `FeestFinderBot`.
- `prefillFromJsonLd()`: walks the JSON-LD `@graph` for `Event`/`MusicEvent`/`Festival`. It handles AggregateOffer and performers, but converts times to Vietnam time only.
- `ClaudePrefill`: structured extraction with zod output.
- Duplicate check on submit: same `starts_on` plus the first three normalised title words, written as a `duplicate` flag for the moderator.
- `assessRisk`: venue pin, ticket link, reused cover (sha256), organiser history.
- `checkLink()`: HEAD then GET to test ticket links.

There is no crawler, raw store, provider list or scheduled ingestion. On 2026-10-01 the product chose community- and organiser-driven listings over crawling. Ticketbox (JSON-LD on event pages) was confirmed readable; RA forbids scraping; Meta closed public event search.

## Discovery API

- `GET /events`: time (`tonight|weekend|7days|month|all`) or `from`/`to`, `q` (accent-free `search_text`, trigram index on Postgres), `genre`, `artist`, `price`, `area`, `city`, `organizer`, `friendsOnly`, `sort`, `lat`/`lng` for distance. It pages with `limit` plus an opaque cursor that encodes an offset, and returns time facet counts.
- `GET /events/map`: `bbox=minLng,minLat,maxLng,maxLat`, `genre`, `free`, `time`, at most 100 rows. It survived the map's removal and has no caller.
- `GET /events/:idOrSlug`: full page data, plus `/seo/events/:slug`, `/e/:slug.md` and `/llms.txt`.

## Screens

| Surface | URL | Notes |
| --- | --- | --- |
| Web | `/`, `/list`, `/e/:slug`, `/o/:slug`, `/c/:slug`, `/saved` | The browser loads `GET /events?time=all&limit=60` once and filters on the client. `/list` has Table and Grid views with city/time/genre chips; `/map` redirects to `/list`. |
| App | `/app/*` | Feed, tickets, plans, live mode, `/app/list` |
| Studio / Console | `/studio`, `/console` | design-template back offices |
| Ops | `/ops`, `/ops/org` | the working back office: review queue (bulk, keys), catalogue, venues, claims, organisers, accounts, orders, audit |

The map was removed on 2026-10-02 (commit `138fa3a`) because it cost more than it gave. No map library is vendored. The CSP allows `connect-src 'self'` only, in both fronts.

## Jobs

`src/jobs.ts` holds one table of jobs and intervals: outbox, announcements, order expiry, reminders, low-ticket alerts, appeal expiry, ticket-link checks and IndexNow. On Supabase, pg_cron calls `POST /internal/jobs` every minute (pg_net, 55 s timeout, Bearer `CRON_SECRET`). `runDueJobs` runs whatever is due, and each job takes a Postgres advisory lock. Locally, `JOBS_ENABLED` runs the same table on timers.

## Geography and time assumptions

- Cities: `CITIES`/`CITY_SLUGS` constant (4 Vietnamese cities) in `lib/i18n.ts`, mirrored as `CITY_LIST` in `pages/web/logic.js` and the app; `cityFrom()` regexes in `prefill.ts`; `HCMC_CENTRE` as the distance origin.
- Time: `lib/time.ts` fixes UTC+7 (`atVn`, `vnDate`, `eventBounds`, windows, quiet hours). About 70 call sites in routes and services, and the SEO builder writes `+07:00`.
- Money: integer VND everywhere (`price_from`, tiers, orders, payouts), formatted with `₫`.

## Configuration

Read in `src/config.ts`. Secrets are entered by the user in Vercel. Groups:

- Database and environment: `DATABASE_URL` / `DATABASE_URL_FROM`, `FF_ENV`, `PGLITE_DIR` (tests), `FF_NOW` (tests).
- Site: `PUBLIC_BASE_URL`, `CORS_ORIGINS`, `COOKIE_SECURE`, `TRUST_PROXY`, `RATE_LIMIT_PER_MINUTE`, `RELEASE`, `SENTRY_DSN`.
- Jobs: `CRON_SECRET`, `JOBS_ENABLED`, `LINK_CHECKS_ENABLED`.
- Sign-in: `ADMIN_EMAIL`, `GOOGLE_CLIENT_ID`/`SECRET`, FB/IG credentials, `MESSAGING_WEBHOOK_URL`/`SECRET`, `EXPOSE_DEV_CODES`.
- Money: `PAYMENT_PROVIDER`, `PAYMENT_WEBHOOK_SECRET`, `TICKET_SIGNING_SECRET`, `PLATFORM_BANK_*`.
- Files, mail, push: `S3_*`, `UPLOAD_DIR`, `SMTP_*`, `VAPID_*`.
- AI and search: `AI_GUIDE_ENABLED`, `ANTHROPIC_MODEL`, `ANTHROPIC_API_KEY`, `ALLOW_AI_TRAINING`, `INDEXNOW_KEY`.

## What the brief can build on

1. `events` is already a rich canonical table with moderation, SEO and commerce attached. Extend it; do not replace it.
2. The review queue in `/ops` (bulk approve, keyboard) is the natural landing place for imported candidates.
3. JSON-LD parsing, safe fetching and AI extraction exist and need generalising, not rewriting.
4. Scheduling (pg_cron → `/internal/jobs` → advisory locks) can carry ingestion without new infrastructure.
5. `smart_alerts` and `artist_follows` already cover part of "alerts".

## Since the audit: the artist and organiser network

Everything above describes the code at Phase 0. Phase 10 (migrations 019–026) added a layer on top of the canonical events, without a graph database:

| Area | Tables | Code |
| --- | --- | --- |
| Personas | `user_roles`, `artist_claims`, `organizer_claims`; `users.onboarded_at`, `users.email_verified_at`; `sessions.method` | `services/roles.ts`, `routes/roles.ts`, `bootstrap.ts` (`syncAdmins`) |
| Artists | columns on `artists` (roles, base, styles, booking, travel, links, anchors, `owner_user_id`, `alias_keys`) | `routes/artists.ts`, `services/artists.ts` |
| Network | none: read from `event_artists` and `events` | `services/network.ts` |
| Gig reports | `artist_gig_reports`; an `event_sources` row with provider `artist` | `services/ingest/report.ts` |
| Affiliate | `affiliate_links`, `affiliate_payouts`; `outbound_clicks` gains `link_id`, `device`, `country`, `referrer_host` | `routes/outbound.ts`, `routes/admin/affiliate.ts` |
| Gear | `gear_items`, `artist_gear` | `services/gear.ts`, `routes/gear.ts` |
| Gigs | `gig_opportunities`, `gig_applications`, `booking_inquiries`, `artist_availability` | `services/gigs.ts`, `routes/gigs.ts` |
| Analytics | none stored | `services/analytics.ts`, `routes/analytics.ts`, `FF.track` |
| Brand campaigns | `brand_campaigns`, `brand_campaign_interests` | `routes/brands.ts` |

Rules that hold across it: admin comes only from `ADMIN_EMAIL`; follower counts never rank an artist or a gig applicant; nothing an artist reports publishes an event or edits an organiser's lineup; fees in the marketplace are not payments.

## Since the audit: the Kính đêm front

The Next front (`festfinder-web`) was rebuilt in the Kính đêm design (`design_handoff_kinh_dem/`, plan in `docs/KINH_DEM_PLAN.md`), route by route, in six phases. Production still runs the API-served front with the Bảng phấn look; nothing in the deployment changed.

| Area | Where | Notes |
| --- | --- | --- |
| Pages | `festfinder-web/src/app/(kd)/` | Every route: `/`, `/list`, `/e`, `/o`, `/a` (+ directory), `/c`, `/saved`, `/about`, `/advertise`, `/stats`, `/profile`, `/app/*`, `/studio/*`, `/console/*`. Public pages render on the server with the API's SEO data. |
| Screens and parts | `festfinder-web/src/kd/` | `ui/` parts, `web/`, `app/`, `studio/`, `console/`; strings as `{en, vi}` pairs per screen; tokens in `theme.css`; `/kit` shows the parts. |
| Runtime | `festfinder-web/src/runtime/ff.ts`, `src/kd/runtime.tsx` | `FF` mirrors `ui/ff-client.js`; `KdProvider` holds the session, sign-in card, toasts, saves and follows. |
| Compile step | `festfinder-web/scripts/compile-screens.ts` | Still copies `public/ui/` (map, brand images); its compiled screens are no longer routed and stay until production moves to Next. |
| New API (Phase 4–5) | migrations `027`–`030` | Boost requests (`027`), badges (`028`, `services/badges.ts`), Moments (`029`, `routes/moments.ts`), row level security on them (`030`); per-day Studio performance, the Console's numbers board. |
| Tests | `festfinder-backend/e2e/next/` | One spec per rebuilt area; the shared `e2e/screens.spec.ts` skips every path in `src/kd/cutover.ts` on Next. |

