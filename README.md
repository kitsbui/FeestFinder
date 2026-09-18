# FestFinder

An event-discovery platform for Ho Chi Minh City: festivals, gigs and night markets, with ticketing, group plans, an organiser back office and an internal moderation console. Vietnamese-first and bilingual throughout (₫, Zalo/Momo/ZaloPay/VietQR, district naming).

```
design_handoff_festfinder/   the original Claude Design handoff (untouched reference)
festfinder-backend/          the API: Node 24 + TypeScript, Fastify, PostgreSQL
festfinder-frontend/         the four screens, wired to that API
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

| Screen | URL |
| --- | --- |
| Web — discovery, event pages, city landings | `/` |
| App — feed, tickets, group plans, live mode | `/app` |
| Organizer — listings, attendees, door, revenue | `/studio` |
| Admin — moderation queue, verification, audit log | `/console` |
| API explorer (development only) | `/_console` |

| Demo account | Login | Password |
| --- | --- | --- |
| Attendee | `minh@example.com` | `festfinder123` |
| Organizer | `team@ravolution.vn` | `ravolution2026` |
| Admin | `admin@festfinder.vn` | `festfinder-admin` |

The full picture — endpoints, decisions, what still needs a real provider — is in [festfinder-backend/README.md](festfinder-backend/README.md) and [festfinder-backend/docs/API.md](festfinder-backend/docs/API.md).
