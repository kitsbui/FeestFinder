# FeestFinder API

The backend for all four FeestFinder surfaces in `design_handoff_festfinder/`: the public **Web** site, the attendee **App**, the **Organizer** back office and the internal **Admin** tool. One JSON API, Vietnamese-first, bilingual throughout.

- **Node 24 + TypeScript**, run directly (Node strips types, so there is no build step)
- **Fastify 5**, **zod** validation
- **PostgreSQL** with plain SQL migrations. Locally it runs on **PGlite** (Postgres compiled to WebAssembly, in-process), so there is nothing to install. Set `DATABASE_URL` to use a real Postgres server (Supabase, Neon, RDS…).
- **Claude** (`@anthropic-ai/sdk`) for the App's AI local guide

## Quick start

```bash
npm install
```

```bash
npm run db:reset
```

```bash
npm run dev
```

The API is on http://localhost:4000, and it serves the four screens too — see [The screens](#the-screens). The same screens on Next.js, with server-rendered pages for search engines, are in [`../festfinder-web`](../festfinder-web/README.md). `db:reset` loads the demo data from the prototypes (6,000 attendees, 28 events, about 3,600 orders). To make the seeded festival weekend (18–20 Sep 2026) count as "this weekend", pin the clock:

```bash
FF_NOW=2026-09-14T10:00:00+07:00 npm run dev
```

| Account | Login | Password |
| --- | --- | --- |
| Attendee (Minh Anh, has tickets, friends, a group plan) | `minh@example.com` | `festfinder123` |
| Organizer (Ravolution Entertainment) | `team@ravolution.vn` | `ravolution2026` |
| Admin | `admin@festfinder.vn` | `festfinder-admin` |

In development, OTP codes are returned in the response as `devCode` and every outbound push, Zalo, email or SMS message is printed to the console.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | API with auto-reload and background jobs |
| `npm start` | API without reload |
| `npm run migrate` | Apply pending migrations |
| `npm run seed` | Load demo data into an empty database (`SEED_VOLUME=small` for a light set) |
| `npm run db:reset` | Delete the embedded database, migrate and seed |
| `npm test` | 95 integration and unit tests (about 20 s on PGlite) |
| `npm run typecheck` | `tsc --noEmit` for the server, then for the Playwright tests (with browser types) |
| `npm run test:screens` | Playwright: every route of the four screens, served by this API, boots cleanly |
| `npm run test:screens:next` | The same routes on the Next.js app, plus its SEO pages, headers and offline tickets |

The tests use in-memory PGlite. To run the same suite against a real Postgres server, point `TEST_DATABASE_URL` at a role that can create databases:

```bash
TEST_DATABASE_URL=postgres://user:pass@localhost:5432/postgres npm test
```

## The screens

`../festfinder-frontend/` holds the four design prototypes with their fake data replaced by calls to this API. Every template, style and string is the handoff's own; only the data layer changed. With the server running they are served from the same origin, so the session cookie just works.

**Every screen, tab and panel has its own URL**, so anything can be linked, bookmarked and reopened, and back and forward work:

| Surface | Routes | Sign-in |
| --- | --- | --- |
| Web | `/` · `/map` · `/saved` · `/about` · `/advertise` · `/e/:slug` · `/o/:slug` · `/stats/:key` · `/vi/ho-chi-minh/this-weekend` · `/en/ho-chi-minh/this-weekend` (`/city/…` still works) | optional (sign-up sheet in place) |
| App | `/app` · `/app/saved` · `/app/map` · `/app/profile` · `/app/tickets` · `/app/notifications` · `/app/alerts` · `/app/settings` · `/app/hyped` · `/app/following` · `/app/e/:slug` · `/app/live/:slug` · `/app/plan/:slug` · `/app/recap/:slug` · `/app/guide/:slug` · `/app/checkout/:slug` · `/app/chat/:friendId` | optional; the demo attendee is signed in after `db:reset` |
| Organizer | `/studio` · `/studio/new` · `/studio/attendees` · `/studio/announce` · `/studio/door` · `/studio/promos` · `/studio/revenue` · `/studio/inbox` · `/studio/profile` | the design's own sign-in gate |
| Admin | `/console` · `/console/verification` · `/console/reports` · `/console/featured` · `/console/ads` · `/console/insights` · `/console/audit` · `/console/appeals` | a small sign-in card (the design ships no admin gate) |
| Ops | Team: `/ops` · `/ops/review/:id?` · `/ops/events` · `/ops/events/new` · `/ops/events/:id` · `/ops/reports` · `/ops/organizers/:id?` · `/ops/venues` · `/ops/featured` · `/ops/users/:id?` · `/ops/orders/:id?` · `/ops/audit` — Organizer: `/ops/org` · `/ops/org/events` · `/ops/org/events/new` · `/ops/org/events/:id` · `/ops/org/inbox/:threadId?` · `/ops/org/profile` | its own sign-in, with "forgot password" for accounts the team opened |
| Dev | `/_console` — API explorer with one-click demo sign-in (disabled in production) | — |

**Ops** is the working back office, in two modes on one page: the FeestFinder team (review queue, catalogue, venues, organiser onboarding, accounts, orders, audit) and organisers (their listings, the event form, submit for review, messages from moderation). It is not a design prototype: plain ES modules on the vendored React, under the strict Content-Security-Policy (no `'unsafe-eval'`), styled with `ui/theme.css` plus `pages/ops/ops.css`. Every filter lives in the URL. Fixed lists (genres, districts, statuses, banks, reject reasons…) come from `GET /meta/form-options`, so forms pick rather than type.

The back offices sit on `/studio`, `/console` and `/ops` because `/organizer/*` and `/admin/*` are API paths and a screen URL must never shadow an endpoint; both old entry points redirect. Point `FRONTEND_DIR` elsewhere to serve a different folder.

**How a screen loads.** Each surface is a ~700-byte shell that fetches three cacheable chunks — `template.html`, `logic.js`, `data.js` — alongside the session and only the data the open route needs, then hands the lot to the prototype runtime. So a screen renders live data on its first paint, a tab switch is a URL change plus one small fetch, and the next route's data is warmed on idle. Opening `/studio/revenue` makes four API calls, not twenty; the app's feed makes nine, not seventeen. Everything static is served with an ETag and gzip, so repeat visits and moving between surfaces mostly hit cache: a first visit transfers 57–92 KB, of which 24 KB is the shared runtime that is then reused.

Two notes when demoing:

- **Live mode and check-in** open on the day of an event. With the clock pinned to 14 Sep the API answers "Live mode opens on the day of the event"; use `FF_NOW=2026-09-19T20:30:00+07:00` to walk the in-event screens (set times, site map, friends on site, the door scanner).
- **The AI local guide** needs `ANTHROPIC_API_KEY`. Without one the guide panel shows its own "taking a break" state.

## How clients talk to it

- **Auth.** Web clients get an `httpOnly` `ff_session` cookie. The App (and any client) can instead read `token` from the login response and send `Authorization: Bearer <token>`.
- **Language.** Content the organiser or editor wrote comes back as `{ "en": "…", "vi": "…" }`, so the language toggle never needs a refetch. Server-written messages (errors, toasts) use `?lang=`, `x-lang` or `Accept-Language`, defaulting to Vietnamese.
- **Errors** are always `{ "error": { "code", "message", "details" } }`. Branch on `code`; show `message`.
- **Toasts.** Mutations return a bilingual `message` wherever the design shows a confirmation.
- **Money** is integer VND, never floats. **Dates** are `YYYY-MM-DD` and **times** `HH:MM` in Ho Chi Minh City time; instants are ISO strings.
- **Lists** return `{ items, nextCursor }`; pass `cursor` back for the next page.
- **Organizers** who belong to several organiser accounts pick one with an `x-organizer-id` header.

The full endpoint list, organised by surface and screen, is in [docs/API.md](docs/API.md).

## Project layout

```
src/
  server.ts            entry point: config → context → app → jobs
  app.ts               Fastify setup, session hook, read-only guard, error rendering
  bootstrap.ts         wires real providers from env
  jobs.ts              scheduler: outbox, announcements, reminders, expiries, alerts, link checks
  db/
    migrations/*.sql   schema (identity, catalog, commerce, engagement, operations)
    index.ts           one query interface over node-postgres and PGlite
    seed.ts            demo data lifted from the prototypes
  routes/              one file per area; organizer/ and admin/ mirror the design files
  services/            audit chain, notifications, outbox, payouts, risk, quality, tickets, AI guide, OAuth
  presenters/          event card/detail and timetable shapes shared by Web and App
  lib/                 VN time, VietQR, i18n, validation, CSV, image headers
  routes/frontend.ts   serves the screens, their chunks, ETags and gzip
test/                  node:test suites per surface
```

The wired screens live next door, one folder per surface:

```
../festfinder-frontend/
  pages/<surface>/     web · app · organizer · admin
    shell.html         ~700 B: answers every route of the surface and calls FF.mount
    template.html      the design's markup, fetched once and cached
    logic.js           the design's component logic, with the routes for its screens
    data.js            one loader per screen, so a route only fetches what it shows
  ui/ff-client.js      shared glue: fetch helpers, router, session, clock, QR signing, sign-in card
  ui/support.js        the prototype runtime from the handoff, unchanged
```

## Decisions worth knowing

**Time.** Ho Chi Minh City is UTC+7 with no daylight saving, so all "tonight / this weekend / next 7 days / this month" windows are computed on local calendar dates. An event whose close is at or before its opening time (16:00 – 02:00) ends the next morning, and set times after midnight are numbered past 1440 minutes, so the clash-finder grid stays continuous.

**Moderation.**
- Submitting a listing computes the organiser-facing **quality score**: the nine weighted checks from the wizard, 100 points in total.
- It also computes the admin-facing **risk score**, which is advisory only: first listing +30, no map pin +26, reused image +24, broken ticket link +22, refund reports against the organiser +18, price above the district median +14, new payout account +14, no capacity +6.
- Nothing is auto-rejected.
- Rejections carry a reason code and open a 7-day appeal, except for `policy`.
- Two separate user reports pull a listing from the feed until a moderator decides.

**Audit log.** Append-only, enforced by a database trigger. Each row stores the SHA-256 of the previous row, so `GET /admin/audit/verify` detects any tampering. Every admin action and every organiser submission writes a before/after diff.

**Impersonation.** "View as" issues a separate read-only session that lasts an hour. Any write with it returns `403 read_only_session`. While it is open, the admin's own `/admin` writes are blocked too, and both starting and ending it are audited.

**Tickets and the door.**
- QR codes contain `<code>.<signature>`, where the signature is an HMAC under a per-event key.
- Scanners download that key and the ticket list in `/door/events/:id/manifest`, so they can verify tickets with no signal.
- Scans are idempotent per device and scan id.
- Offline queues upload in the order they happened, and a second scan of the same ticket comes back as `duplicate`.
- Door staff sign in with the phone number they were invited on, via SMS code. There is no separate account.

**Payments.**
- `PAYMENT_PROVIDER=mock` confirms instantly (development only).
- `vietqr` returns a NAPAS VietQR code for the order total with the order code as the transfer note. A signed bank-transfer webhook (the format SePay and Casso use) marks the order paid, and it is safe to replay.
- Group plans produce VietQR requests against the organiser's own bank account; Momo and ZaloPay both scan these.

**Payouts** are computed live from orders, and only actual transfers are stored:
- **Advance:** 50% of sales to date, available from 14 days before the event.
- **Post-event:** the remainder, settling three working days after the event.
- **Refund hold:** 1.5% of gross, released seven days after the event.
- **Fees:** a 4% platform fee and a 1.8% payment fee; see `PAYOUT_POLICY` in `src/services/payouts.ts`.

**Notifications.** Every alert writes an in-app notification, then queues one outbox row per channel the person has switched on (the topic × Push/Zalo/Email matrix). A worker delivers with retries and backoff. Nothing is sent between 23:00 and 08:00 unless it concerns an event starting that day. Announcements count reach as the union of people each chosen channel actually reaches, and are limited to one per event per 24 hours.

**AI local guide.** `GET /events/:id/guide` asks Claude (`claude-opus-5`, structured JSON output, low effort, server-side refusal fallback) for where to eat before, where to go after and what to wear. The result is cached per event and language for 24 hours, and each user is limited to 20 generations an hour.

## Running it in production

Every outside service is switched on by its environment variables and logged instead when they are missing, so a deployment can turn them on one at a time. At startup in production, the API warns about each one that is still missing. [`.env.example`](.env.example) lists all of them.

| Area | Variables | What happens |
| --- | --- | --- |
| Database | `DATABASE_URL` | Postgres. Migration `006` adds a `pg_trgm` index for search where the extension is available |
| File storage | `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` | Uploads go to S3 or any S3-compatible store (R2, B2, MinIO), with year-long immutable caching; point `S3_PUBLIC_BASE_URL` at a CDN |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | OTP codes and email notifications go through any SMTP relay (SES, Postmark, Resend…) |
| Browser push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Sent straight to the browser's push service; a subscription the service reports gone is deleted and not retried. Make keys with `npx web-push generate-vapid-keys` |
| Native push, Zalo ZNS, SMS | `MESSAGING_WEBHOOK_URL`, `MESSAGING_WEBHOOK_SECRET` | Each message is POSTed to one endpoint with an `x-ff-signature` HMAC-SHA256 header, which fans out to FCM/APNs, Zalo and the SMS gateway. A non-2xx answer is retried with backoff |
| Errors | `SENTRY_DSN`, `RELEASE` | Unhandled errors go to Sentry (or anything that speaks its envelope API) with the route, user and request id |
| Abuse | `RATE_LIMIT_PER_MINUTE`, `TRUST_PROXY` | Per-client limit on the API (default 300/min), answered with `429` and `Retry-After`. Static files are exempt, and so are calls from our own network that carry no forwarding headers — the Next.js app rendering pages on the server. A browser's call through the Next.js proxy is always counted, whatever address it claims. The client address comes from `X-Forwarded-For` only when the peer is a trusted proxy (default: loopback and private networks), so a client talking to the API directly cannot fake it. Next.js passes on an `X-Forwarded-For` the client sent and never adds the client's own address, so in production put a load balancer or CDN in front of Next that appends or sets it; without one, every browser shares one limit and the API logs a warning |

**Security headers.** Every response carries helmet's headers. JSON answers have a strict Content-Security-Policy. The design-runtime shells get one that also allows `'unsafe-eval'`, because the prototype runtime evaluates the screens' logic from strings. The Next.js app does not need that.

**Several instances.** Background jobs take a Postgres advisory lock per job and tick, so any number of API instances can run with `JOBS_ENABLED=true` and each job still runs once.

**Backups.** [`scripts/backup.sh`](scripts/backup.sh) writes a compressed `pg_dump` and keeps the last 14 (`BACKUP_DIR`, `KEEP`). [`scripts/restore-check.sh`](scripts/restore-check.sh) restores a dump into a throwaway database. It then counts users, events, orders and tickets and checks that the audit chain is unbroken, and exits non-zero if anything is off. Schedule both, and copy the dumps off the machine.

**Vercel + Supabase.** The `feestfinder` project builds this folder (Root Directory `festfinder-backend`, functions in `hnd1`, next to the Supabase project in Tokyo) with the Fastify preset. The preset runs the first of `app`, `index`, `server`, `src/app`… that imports fastify, so [`index.ts`](index.ts) exists to point it at `src/server.ts`. The frontend folder, the migrations and the Supabase certificate are referenced as `new URL(…, import.meta.url)`, which is how file tracing ships them with the function.

| | Production | Preview |
| --- | --- | --- |
| Database | Supabase Postgres through the transaction pooler, verified against Supabase's root CA | In-memory PGlite, seeded at startup (`SEED_IF_EMPTY`) |
| Clock | Real time | `FF_NOW`, the demo weekend |
| Uploads | Supabase Storage over S3, public bucket `uploads` (made by migration `007`) | `/tmp` |
| Jobs | pg_cron calls `POST /internal/jobs` every minute (`CRON_SECRET`) | Off |
| Admins | `ADMIN_EMAIL` (comma-separated), passwords set with "Forgot password" | The demo accounts |

Migration `007` also closes Supabase's Data API over our tables: it serves the public schema to anyone with the project's anon key, and this API never uses it, so the `anon` and `authenticated` roles lose their grants and every table gets row level security with no policies.

**CI.** [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs the suite on PGlite and on Postgres 18. It typechecks and builds the Next.js app, and runs the Playwright route tests against both fronts.

## Before production: what still needs a real provider

These are interfaces with development stand-ins, or providers that need contracts of their own. Each has one place to plug in:

| Area | Where | Today |
| --- | --- | --- |
| Native push, Zalo ZNS, SMS providers | behind `MESSAGING_WEBHOOK_URL` | The API signs and sends; the endpoint that talks to FCM/APNs, Zalo and the SMS gateway is yours to run |
| Card, Momo and ZaloPay checkout | `routes/commerce.ts` | `mock` confirms instantly; `vietqr` bank transfer is real |
| Apple / Google Wallet | `POST /me/tickets/:id/wallet` | Returns pass fields; signing needs issuer certificates |
| Facebook / Instagram | `services/oauth.ts` | Real Graph API adapters; verify scopes and friend access in app review |
| Zalo / WhatsApp friend graph | `services/friends.ts` | Only Facebook exposes friends; contact matching is not built |
| Geocoding free-typed venues | wizard `venueName` | Venues from the list have pins; others stay unresolved |
| Duplicate-image detection | `services/risk.ts` | Exact SHA-256 match only; perceptual hashing would catch edits |
| Invoice PDF / Vietnamese e-invoice | `…/payouts/:kind/invoice` | Returns invoice data to render |
| Rate limits | global, auth, OTP, guide | In memory per process; with several instances, each keeps its own count. Give `@fastify/rate-limit` a Redis store to share them |

## Where the design contradicts itself

I picked a behaviour for each of these; they're worth a product decision:

1. **Booking fee.** The Web says "FeestFinder does not add a booking fee", but the App checkout adds a 5% "Service fee". The fee is configurable with `SERVICE_FEE_PCT`; set it to `0` to match the Web copy.
2. **Moderation promise.** The admin notes say "a decision within two working hours", but the SLA pills breach at 4 hours. The code uses 4 (`SLA_HOURS`).
3. **App "Check in" button.** In the prototype it marks the ticket used. Here it records presence on site (live mode, friends on the map), and only a gate scan marks a ticket used, so the button can't lock someone out at the door.
4. **Rap Việt Live Stage** is marked sold out but shows a GA tier "on sale" in the tier ladder. The seed makes every tier sold out.
5. **Organizer numbers.** The prototype's hard-coded stats (views, reach, sold) don't agree with each other. Everything is computed from real rows, so seeded figures differ slightly from the mock-ups.
