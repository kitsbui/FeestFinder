# FeestFinder

An event-discovery platform for Ho Chi Minh City: festivals, gigs and night markets, with ticketing, group plans, an organiser back office and an internal moderation console. Vietnamese-first and bilingual throughout (₫, Zalo/Momo/ZaloPay/VietQR, district naming).

```
design_handoff_festfinder/   the original Claude Design handoff (untouched reference)
festfinder-backend/          the API: Node 24 + TypeScript, Fastify, PostgreSQL on Supabase
festfinder-frontend/         /ops (the working back office, served by the API) and ui/ (map, fonts, icons, brand images) shared with the site
festfinder-web/              the site at feestfinder.com: Next.js 16 + React 19 + Tailwind (Kính đêm), SEO pages, PWA
```

## Run it

```bash
npm install --prefix festfinder-backend
```

Put the **staging** Supabase project's connection string in `festfinder-backend/.env` as `DATABASE_URL` (Supabase → Connect → Transaction pooler), then:

```bash
npm run dev --prefix festfinder-backend
```

Then open http://localhost:4000/ops. There are two Supabase projects: **production**, used by the production deployment only, and **staging**, shared by laptops and Vercel previews. Each database is labelled with the environment it serves and the API refuses to start on the other one's, so nothing done while developing reaches real accounts. There is no demo data outside the automated tests: the team signs in on `/ops` with an `ADMIN_EMAIL` account (password set with "Forgot password") and adds organisers, venues and events there.

The site itself (Next.js: the web, the app, Studio and the Console, with server-rendered pages and the installable app) runs next to the API:

```bash
npm install --prefix festfinder-web
```

```bash
npm run dev --prefix festfinder-web
```

Then open http://localhost:3000. Everything that is not one of its pages (including `/ops`) is proxied to the API. Details are in [festfinder-web/README.md](festfinder-web/README.md).

| Screen | URL | Port |
| --- | --- | --- |
| Web — discovery, the list, event and organiser pages | `/` · `/list` · `/e/:slug` · `/o/:slug` | :3000 |
| App — feed, tickets, group plans, live mode | `/app` | :3000 |
| Studio — listings, attendees, door, revenue | `/studio` | :3000 |
| Console — moderation queue, verification, audit log | `/console` | :3000 |
| Ops — the working back office: the FeestFinder team (review, catalogue, organizers, venues, accounts, orders) and organizers (create and submit events) | `/ops` · `/ops/org` | :4000 or :3000 |
| API explorer (development only) | `/_console` | :4000 or :3000 |

The full picture — endpoints, decisions, production settings (storage, email, push, errors, backups), what still needs a real provider — is in [festfinder-backend/README.md](festfinder-backend/README.md) and [festfinder-backend/docs/API.md](festfinder-backend/docs/API.md). CI (typecheck, tests on PGlite and Postgres, the Next build, Playwright on /ops (demo data and an empty database) and on the Next site) is in [.github/workflows/ci.yml](.github/workflows/ci.yml). The tests never touch Supabase.
