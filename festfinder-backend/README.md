# FeestFinder API

The backend for all four FeestFinder surfaces in `design_handoff_festfinder/`: the public **Web** site, the attendee **App**, the **Organizer** back office and the internal **Admin** tool. One JSON API, Vietnamese-first, bilingual throughout.

- **Node 24 + TypeScript**, run directly (Node strips types, so there is no build step)
- **Fastify 5**, **zod** validation
- **PostgreSQL** with plain SQL migrations, on **Supabase**, in two projects: **production**, used by the production deployment only, and **staging**, shared by laptops and Vercel previews. Each database is labelled with the environment it serves, and a deployment on the other one's refuses to start before it migrates or writes anything. The automated tests use **PGlite** (Postgres compiled to WebAssembly, in-process) instead, with the demo data from `test/fixtures`.
- **Claude** (`@anthropic-ai/sdk`) for the App's AI local guide and for filling in a sent-in event from its link or poster

## Quick start

```bash
npm install
```

Put the **staging** project's connection string in `.env` as `DATABASE_URL` (Supabase → Connect → Transaction pooler, port 6543), then check it:

```bash
npm run db:check
```

```bash
npm run dev
```

The API is on http://localhost:4000, and it serves the four screens too — see [The screens](#the-screens). The same screens on Next.js, with server-rendered pages for search engines, are in [`../festfinder-web`](../festfinder-web/README.md). At startup the API checks the database's environment label, applies pending migrations and logs where the data goes (`database: supabase (…pooler.supabase.com)`, `environment: staging`); `GET /health` says the same.

There is no demo data outside the tests. Admins are the emails in `ADMIN_EMAIL`: each gets an account with no password, set with "Forgot password" on `/ops`. The team then adds organisers, venues and events on `/ops`.

In development every outbound push, Zalo, email or SMS message is printed to the console, OTP codes included, and the background jobs run (`JOBS_ENABLED=false` turns them off). On staging, `EXPOSE_DEV_CODES=true` also returns OTP codes in the response as `devCode`, and `PAYMENT_PROVIDER=mock` makes payments instant; production refuses both. The stand-in Facebook/Instagram sign-in only exists on the tests' embedded database.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | API with auto-reload, on the database in `DATABASE_URL` |
| `npm start` | API without reload |
| `npm run migrate` | Apply pending migrations to the database in `DATABASE_URL`: staging from a laptop. For production, on purpose: `FF_ENV=production npm run migrate` with its URL |
| `npm run db:check` | Connect with `DATABASE_URL` the way the API does, say whether it is the production or the staging database, and report what is wrong, never the password |
| `npm test` | Integration and unit tests, on the demo data and on an empty database (about 35 s on PGlite) |
| `npm run typecheck` | `tsc --noEmit` for the server, then for the Playwright tests (with browser types) |
| `npm run test:screens` | Playwright: every route of the four screens and Ops, served by this API, boots cleanly on the demo data and on an empty database |
| `npm run test:screens:next` | The same routes on the Next.js app, plus its SEO pages, headers and offline tickets |

The tests never touch Supabase: they run on in-memory PGlite, and the screen tests start their own APIs on throwaway embedded databases. The demo data from the prototypes (6,000 attendees, 28 events around the 18–20 Sep 2026 weekend, about 3,600 orders, with the clock pinned to 14 Sep by `FF_NOW`) lives in [`test/fixtures/seed.ts`](test/fixtures/seed.ts) and refuses to load into Supabase. To run the suite against a real Postgres server, point `TEST_DATABASE_URL` at a role that can create databases:

```bash
TEST_DATABASE_URL=postgres://user:pass@localhost:5432/postgres npm test
```

## The screens

`../festfinder-frontend/` holds the four design prototypes with their fake data replaced by calls to this API. With the server running they are served from the same origin, so the session cookie just works.

**Every screen, tab and panel has its own URL**, so anything can be linked, bookmarked and reopened, and back and forward work:

| Surface | Routes | Sign-in |
| --- | --- | --- |
| Web | `/` · `/map` · `/saved` · `/about` · `/advertise` · `/e/:slug` · `/o/:slug` · `/stats/:key` · `/vi/ho-chi-minh/this-weekend` · `/en/ho-chi-minh/this-weekend` (`/city/…` still works) | optional (sign-up sheet in place) |
| App | `/app` · `/app/saved` · `/app/map` · `/app/profile` · `/app/tickets` · `/app/notifications` · `/app/alerts` · `/app/settings` · `/app/hyped` · `/app/following` · `/app/e/:slug` · `/app/live/:slug` · `/app/plan/:slug` · `/app/recap/:slug` · `/app/guide/:slug` · `/app/checkout/:slug` · `/app/chat/:friendId` | optional |
| Organizer | `/studio` · `/studio/new` · `/studio/attendees` · `/studio/announce` · `/studio/door` · `/studio/promos` · `/studio/revenue` · `/studio/inbox` · `/studio/profile` | the design's own sign-in gate |
| Admin | `/console` · `/console/verification` · `/console/reports` · `/console/featured` · `/console/ads` · `/console/insights` · `/console/audit` · `/console/appeals` | a small sign-in card (the design ships no admin gate) |
| Ops | Team: `/ops` · `/ops/review/:id?` · `/ops/events` · `/ops/events/new` · `/ops/events/:id` · `/ops/reports` · `/ops/organizers/:id?` · `/ops/venues` · `/ops/featured` · `/ops/users/:id?` · `/ops/orders/:id?` · `/ops/audit` — Organizer: `/ops/org` · `/ops/org/events` · `/ops/org/events/new` · `/ops/org/events/:id` · `/ops/org/inbox/:threadId?` · `/ops/org/profile` | its own sign-in, with "forgot password" for accounts the team opened |
| Dev | `/_console` — API explorer, using the session signed in on `/ops` (disabled in production) | — |

**Ops** is the working back office, in two modes on one page: the FeestFinder team (review queue, catalogue, venues, organiser onboarding, accounts, orders, audit) and organisers (their listings, the event form, submit for review, messages from moderation). It is not a design prototype: plain ES modules on the vendored React, under the strict Content-Security-Policy (no `'unsafe-eval'`), styled with `ui/theme.css` plus `pages/ops/ops.css`. Every filter lives in the URL. Fixed lists (genres, districts, statuses, banks, reject reasons…) come from `GET /meta/form-options`, so forms pick rather than type.

The back offices sit on `/studio`, `/console` and `/ops` because `/organizer/*` and `/admin/*` are API paths and a screen URL must never shadow an endpoint; both old entry points redirect. Point `FRONTEND_DIR` elsewhere to serve a different folder.

**How a screen loads.** Each surface is a ~700-byte shell that fetches three cacheable chunks — `template.html`, `logic.js`, `data.js` — alongside the session and only the data the open route needs, then hands the lot to the prototype runtime. So a screen renders live data on its first paint, a tab switch is a URL change plus one small fetch, and the next route's data is warmed on idle. Opening `/studio/revenue` makes four API calls, not twenty; the app's feed makes nine, not seventeen. Everything static is served with an ETag and gzip, so repeat visits and moving between surfaces mostly hit cache: a first visit transfers 57–92 KB, of which 24 KB is the shared runtime that is then reused.

Two notes:

- **Live mode and check-in** open on the day of an event: before then the API answers "Live mode opens on the day of the event".
- **The AI local guide and the form fill-in** need `ANTHROPIC_API_KEY`. Without one the guide panel shows its own "taking a break" state, and a pasted link still fills the form when the page carries schema.org Event data; posters need the key.

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
    migrations/*.sql   schema (identity, catalog, commerce, engagement, operations, stored files)
    index.ts           one query interface over node-postgres (Supabase) and PGlite (tests)
  routes/              one file per area; organizer/ and admin/ mirror the design files
  services/            audit chain, notifications, outbox, payouts, risk, quality, tickets, AI guide, OAuth
  presenters/          event card/detail and timetable shapes shared by Web and App
  lib/                 VN time, VietQR, i18n, validation, CSV, image headers
  routes/frontend.ts   serves the screens, their chunks, ETags and gzip
test/                  node:test suites per surface
  fixtures/            the demo data (seed.ts) and the empty database (empty.ts) the tests run on
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

**AI local guide.** `GET /events/:id/guide` asks Claude (`claude-opus-5-5`, structured JSON output, low effort, server-side refusal fallback) for where to eat before, where to go after and what to wear. The result is cached per event and language for 24 hours, and each user is limited to 20 generations an hour.

**Filling in a sent-in event.** `POST /community/prefill` fetches the pasted page (public addresses only, every redirect checked, 2 MB, 8 s) and reads its schema.org Event data first; only a page without one goes to Claude, which also reads posters (`/community/prefill/poster`). The person checks the form before sending. Each person gets 30 pages and 10 AI reads an hour, logged in `ai_calls`.

**The night itself.** Organisers post updates (a set running late, a quieter gate) from the event editor in `/ops`; with "notify" on, ticket holders and people going get them at once, at most ten a day. Attendees' memory and talk posts can carry a photo, which also lands on the event's photo wall. Each night the door scanned, or the person checked in, is a stamp in their raver passport (`/me/passport`), and `/me/wrapped` sums up their year; the App turns both into story images for Instagram.

**Taking over a community event.** An organiser presses "I organise this" on an event the community sent in, with a note and a proof link; a moderator approves it in `/ops/claims`, which moves the event to their account and tells the person who sent it in.

## Running it in production

Every outside service is switched on by its environment variables and logged instead when they are missing, so a deployment can turn them on one at a time. At startup in production, the API warns about each one that is still missing. [`.env.example`](.env.example) lists all of them.

| Area | Variables | What happens |
| --- | --- | --- |
| Database | `DATABASE_URL`, `FF_ENV` | Required: this environment's Supabase database, the production project for the production deployment and the staging project for everything else. The API refuses to start without it, and on the other environment's database. `FF_ENV` (`production` or `staging`) settles which one a server is, e.g. a self-hosted staging server. Migration `006` adds a `pg_trgm` index for search where the extension is available |
| Secrets | `TICKET_SIGNING_SECRET`, `PAYMENT_WEBHOOK_SECRET` | Required in production, which does not start without them; staging uses development values. The ticket secret signs every ticket's QR code, so it is set once and never changed. Make each with `openssl rand -base64 32` |
| File storage | `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` | Uploads go to Supabase Storage (or any S3-compatible store), with year-long immutable caching. Without these they are kept in the database (`stored_files`) and served from `/files/…`, the same path in every environment |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | OTP codes and email notifications go through any SMTP relay (SES, Postmark, Resend…) |
| Browser push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Sent straight to the browser's push service; a subscription the service reports gone is deleted and not retried. Make keys with `npx web-push generate-vapid-keys` |
| Native push, Zalo ZNS, SMS | `MESSAGING_WEBHOOK_URL`, `MESSAGING_WEBHOOK_SECRET` | Each message is POSTed to one endpoint with an `x-ff-signature` HMAC-SHA256 header, which fans out to FCM/APNs, Zalo and the SMS gateway. A non-2xx answer is retried with backoff |
| Errors | `SENTRY_DSN`, `RELEASE` | Unhandled errors go to Sentry (or anything that speaks its envelope API) with the route, user and request id |
| Search engines | `INDEXNOW_KEY`, `ALLOW_AI_TRAINING` | With a key (8–128 letters, digits or dashes), approved and changed event pages are announced to IndexNow every five minutes (Bing, and the assistants that search its index); the key is served at `/<key>.txt`. `robots.txt` lets AI search and answer crawlers (OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot…) read every public page; training crawlers (GPTBot, ClaudeBot, Google-Extended, CCBot…) are turned away unless `ALLOW_AI_TRAINING=true`. Neither changes Google Search or its AI Overviews |
| Abuse | `RATE_LIMIT_PER_MINUTE`, `TRUST_PROXY` | Per-client limit on the API (default 300/min), answered with `429` and `Retry-After`. Static files are exempt, and so are calls from our own network that carry no forwarding headers — the Next.js app rendering pages on the server. A browser's call through the Next.js proxy is always counted, whatever address it claims. The client address comes from `X-Forwarded-For` only when the peer is a trusted proxy (default: loopback and private networks), so a client talking to the API directly cannot fake it. Next.js passes on an `X-Forwarded-For` the client sent and never adds the client's own address, so in production put a load balancer or CDN in front of Next that appends or sets it; without one, every browser shares one limit and the API logs a warning |

**Event and organiser pages for search engines and AI assistants.** There are no landing pages: each event and organiser page answers for itself, and the old `/vi/…`, `/en/…` and `/city/…` addresses redirect (301) to `/list` with the same city, genre and time filters. Two builders in `src/services/seo.ts`, `buildEventSeo` and `buildOrganizerSeo`, make everything a page says to crawlers; the API's own pages use them in-process and the Next.js app reads them from `GET /seo/events/:slug` and `GET /seo/organizers/:slug`.

- **Two languages, two addresses.** The site opens in Vietnamese; the VI/EN switch in the floating bar changes it and the browser remembers the choice. `/e/:slug` and `/o/:slug` are Vietnamese and `?lang=en` English, each with its own canonical, `hreflang` links to the other, and the screen opening in that language, so a crawler that runs JavaScript sees the same language as the head.
- **The head.** A title short enough for a search result, a factual description under 160 characters, `robots` allowing large image previews and full snippets, and Open Graph and Twitter tags. The preview image is the cover, or the event's genre art painted as a 1200×630 PNG at `/og/v1/<tone>.png` (`src/services/ogimage.ts`, no image library).
- **One schema.org graph.** `Organization` and `WebSite` (FeestFinder), the `WebPage` with its dates, the event (`MusicEvent`, `Festival` or `FoodEvent`) with its offers (an `AggregateOffer` across tiers, with availability), place (a Vietnamese postal address, coordinates, a map link), performers and organiser, a `BreadcrumbList`, and a `FAQPage` of the organiser's answers only, since those are what the page shows as its FAQ.
- **The facts as plain HTML.** Most AI crawlers run no script, so the page arrives with an answer first (what, when, where, how much, for whom, who plays, who organises), then the key facts, set times, tickets and their state, the organiser's latest updates, the FAQ, other editions, related events in the same city and genre, and when it last changed. The screen replaces it when it mounts.
- **Organiser pages** carry the same head and frame: an answer first (what they put on, where, since when, what is next), key facts (no private contact details), their upcoming and past events, and a `ProfilePage` graph with the organiser as an `Organization` listing its upcoming events.
- **For AI agents that read text.** Every event and organiser page is also Markdown at the same address plus `.md` (`/e/ravo.md`, `/o/ravoent.md?lang=en`), linked from the page's head and pointing back to it as canonical. `/llms.txt` (llmstxt.org) says what FeestFinder is and lists every upcoming event and organiser by its Markdown address; `robots.txt` points to it. Search engines do not use llms.txt yet; agents browsing on someone's behalf can.
- **Freshness.** Migration `013` keeps `events.updated_at` to real changes of what the page shows (counters do not count), and touches it when the organiser posts an update or answers a question. The sitemap lists every page in both languages with that date and its `hreflang` pairs, including events of the last six months; with `INDEXNOW_KEY`, each event or organiser page whose content changed since it was last announced goes to IndexNow within five minutes, in both languages.

`/robots.txt` and `/sitemap.xml` are served by the API too.

**Community, discussion and resale (migration `010`).** Anyone whose phone number is proven by a code can post on an event page, or send an event in; it waits in the review queue like any listing, owned by the "Cộng đồng FeestFinder" organiser. A number typed into a profile is unproven, and never signs anyone in to that account. Tickets move between attendees as gifts or resold at no more than face value, until the event ends: each move gives the ticket a new QR version, and scanners refresh what changed every 20 seconds. FeestFinder holds a resale buyer's money and pays the seller two days after the event, from `/ops/orders → Pass vé`.

**Security headers.** Every response carries helmet's headers. JSON answers have a strict Content-Security-Policy. The design-runtime shells get one that also allows `'unsafe-eval'`, because the prototype runtime evaluates the screens' logic from strings. The Next.js app does not need that.

**Several instances.** Background jobs take a Postgres advisory lock per job and tick, so any number of API instances can run with `JOBS_ENABLED=true` and each job still runs once.

**Backups.** [`scripts/backup.sh`](scripts/backup.sh) writes a compressed `pg_dump` and keeps the last 14 (`BACKUP_DIR`, `KEEP`). [`scripts/restore-check.sh`](scripts/restore-check.sh) restores a dump into a throwaway database. It then counts users, events, orders and tickets and checks that the audit chain is unbroken, and exits non-zero if anything is off. Schedule both, and copy the dumps off the machine.

**Vercel + Supabase.** The `feestfinder` project builds this folder (Root Directory `festfinder-backend`, functions in `hnd1`, next to the Supabase project in Tokyo) with the Fastify preset. The preset runs the first of `app`, `index`, `server`, `src/app`… that imports fastify, so [`index.ts`](index.ts) exists to point it at `src/server.ts`. The frontend folder, the migrations and the Supabase certificate are referenced as `new URL(…, import.meta.url)`, which is how file tracing ships them with the function.

The two Supabase projects:

| | Supabase org | Project | Ref | Region |
| --- | --- | --- | --- | --- |
| **Production** | Feest Finder | Feest Finder | `ggrhmtdfxqrltzpiancl` | Tokyo (`ap-northeast-1`) |
| **Staging** | Events Org (billed through the Vercel Marketplace) | Event Org | `cokiqvsoholtlruqgifn` | Singapore (`ap-southeast-1`) |

| | Production | Preview |
| --- | --- | --- |
| Address | https://feestfinder.com: `PUBLIC_BASE_URL` and `CORS_ORIGINS` for Production. It is what canonicals, the sitemap, llms.txt and pg_cron use. `feestfinder.vercel.app` and `www.feestfinder.com` redirect (308) to it; the domain's DNS is at Mắt Bão | The preview's own `*.vercel.app` address |
| Database | The production Supabase project: `DATABASE_URL` for Production. Through the transaction pooler, verified against Supabase's root CA | The staging project: `DATABASE_URL` for Preview and Development |
| Clock | Real time | Real time |
| Uploads | The production project's Storage over S3, public bucket `uploads` (made by migration `007`), or its database | The staging project's: `S3_*` for Preview point at its Storage |
| Jobs | pg_cron calls `POST /internal/jobs` on the production domain every minute (`CRON_SECRET`) | Off: previews schedule nothing. A laptop runs them itself |
| Admins | `ADMIN_EMAIL` (comma-separated), passwords set with "Forgot password" | The staging database's own accounts |

A deployment's startup log names its database and environment (`database: supabase (…)`, `environment: production`) and where uploads go, and `GET /health` answers `{"environment":"production","database":"supabase","uploads":…}`, so each environment can be checked from outside. `SEED_IF_EMPTY`, `DEMO_PASSWORD`, `PGLITE_DIR` and `FF_NOW` no longer do anything on a deployment: remove them from the Vercel project. Work that finishes after a response — sending a sign-in code, checking a ticket link — is handed to Vercel's `waitUntil`, so it is not frozen with the instance.

Migration `007` also closes Supabase's Data API over our tables: it serves the public schema to anyone with the project's anon key, and this API never uses it, so the `anon` and `authenticated` roles lose their grants and every table gets row level security with no policies.

**CI.** [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs the suite on PGlite and on Postgres 18. It typechecks and builds the Next.js app, and runs the Playwright route tests against both fronts, on the demo data and on an empty database.

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
4. **Organizer numbers.** The prototype's hard-coded stats (views, reach, sold) don't agree with each other. Everything is computed from real rows.
