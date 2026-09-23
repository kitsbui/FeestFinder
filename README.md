# FeestFinder

An event-discovery platform for Ho Chi Minh City: festivals, gigs and night markets, with ticketing, group plans, an organiser back office and an internal moderation console. Vietnamese-first and bilingual throughout (₫, Zalo/Momo/ZaloPay/VietQR, district naming).

```
design_handoff_festfinder/   the original Claude Design handoff (untouched reference)
festfinder-backend/          the API: Node 24 + TypeScript, Fastify, PostgreSQL
festfinder-frontend/         the four screens, wired to that API (served by the API itself)
festfinder-web/              the same screens on Next.js 16 + React 19 + TypeScript: SEO pages, PWA
```

## Run it

```bash
npm install --prefix festfinder-backend
```

```bash
npm run db:reset --prefix festfinder-backend
```

```bash
npm run dev --prefix festfinder-backend
```

Then open http://localhost:4000. Nothing else to install: locally the database runs in-process on PGlite (Postgres compiled to WebAssembly), and the same code talks to a real Postgres server when `DATABASE_URL` is set.

For the Next.js front — server-rendered event and landing pages, sitemap, the installable app — keep the API running and start it next to it:

```bash
npm install --prefix festfinder-web
```

```bash
npm run dev --prefix festfinder-web
```

Then open http://localhost:3000. It has the same screens and URLs; everything that is not a page is proxied to the API. Details are in [festfinder-web/README.md](festfinder-web/README.md).

| Screen | URL |
| --- | --- |
| Web — discovery, event pages, city landings | `/` · `/e/:slug` · `/vi/ho-chi-minh/this-weekend` |
| App — feed, tickets, group plans, live mode | `/app` |
| Organizer — listings, attendees, door, revenue | `/studio` |
| Admin — moderation queue, verification, audit log | `/console` |
| Ops — the working back office: the FeestFinder team (review, catalogue, organizers, venues, accounts, orders) and organizers (create and submit events) | `/ops` · `/ops/org` |
| API explorer (development only) | `/_console` |

| Demo account | Login | Password |
| --- | --- | --- |
| Attendee | `minh@example.com` | `festfinder123` |
| Organizer | `team@ravolution.vn` | `ravolution2026` |
| Admin | `admin@festfinder.vn` | `festfinder-admin` |

The full picture — endpoints, decisions, production settings (storage, email, push, errors, backups), what still needs a real provider — is in [festfinder-backend/README.md](festfinder-backend/README.md) and [festfinder-backend/docs/API.md](festfinder-backend/docs/API.md). CI (typecheck, tests on PGlite and Postgres, the Next build, Playwright on both fronts) is in [.github/workflows/ci.yml](.github/workflows/ci.yml).
