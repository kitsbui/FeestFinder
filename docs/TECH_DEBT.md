# Technical debt

Found in the 2026-10-05 audit, ranked by how much each item blocks the Asia event-intelligence plan. "Phase" refers to [FEESTFINDER_IMPLEMENTATION_PLAN.md](FEESTFINDER_IMPLEMENTATION_PLAN.md).

## Blocks the plan

| # | Debt | Where | Why it matters | Phase |
| --- | --- | --- | --- | --- |
| 1 | Time is fixed to UTC+7 | `lib/time.ts` (`atVn`, `eventBounds`, windows), about 70 call sites, `services/seo.ts` writes `+07:00` | Tokyo (+9), Singapore and Bali (+8) events would get the wrong `starts_at`, the wrong "tonight" window and wrong JSON-LD | 1, 8 |
| 2 | Cities are a 4-entry constant | `lib/i18n.ts` `CITIES`, `CITY_LIST` copies in `pages/web/logic.js` and `pages/app/logic.js`, `cityFrom()` regexes, `HCMC_CENTRE` | Adding a city means editing three files and a regex; there is no country, timezone or currency | 1, 8 |
| 3 | The web front loads one 60-event snapshot and filters it in the browser | `pages/web/data.js` (`/events?time=all&limit=60`), `board` in `logic.js` | With five cities the list silently drops events; the brief forbids loading every event into the browser | 6 |
| 4 | Provenance is one URL | `events.event_url`, audit-log diff | No multi-source record, so no "verified from N sources", no reprocessing, no debugging | 1 |
| 5 | Genre is one value from 8 broad categories, under a CHECK constraint | `events.genre`, `GENRES` | No way to say "hard techno + acid techno"; music filters need a taxonomy | 7 |
| 6 | Duplicate detection is the first three title words on the same day | `routes/community.ts` submit | Misses renamed or translated titles; no venue, time, artist or distance signal; no score or reason stored | 4 |
| 7 | Money is integer VND with `₫` formatting everywhere | `price_from`, tiers, orders, `presenters/event.ts`, both runtimes | Foreign events need their own currency; FeestFinder checkout (VietQR/Momo) only works in VND | 8 |
| 8 | Venues cannot be matched | `venues` has no normalised name, aliases, country or website | "THE WAREHOUSE" / "Warehouse Club" cannot resolve to one venue | 1, 4 |

## Worth fixing while nearby

| # | Debt | Where | Note |
| --- | --- | --- | --- |
| 9 | Cursor pagination is an offset in disguise | `http/sql.ts` `decodeCursor` | Fine at today's size; switch to keyset (`starts_at, id`) once the catalogue passes a few thousand rows |
| 10 | `/events/map` has no caller and a 100-row cap | `routes/catalog.ts` | Becomes the map's query; needs date, style, type, country and confidence filters |
| 11 | `prefillFromJsonLd` converts to Vietnam time and returns form fields, not instants | `services/prefill.ts` | Generalise into a JSON-LD normaliser that keeps the source offset; the form keeps using it |
| 12 | `CLAUDE.md` said the next migration was `015`, but `015_collections.sql` had shipped | `CLAUDE.md` | Fixed: the next is `017` |
| 13 | `ops.ts` `AREA_GROUPS` uses pre-2025 districts | `routes/admin/ops.ts` | Noted on 2026-10-01; unrelated to this plan |
| 14 | Seed covers point at a dead host `assets.feestfinder.com` | `test/fixtures/seed.ts` | Tests only; `/ops` falls back to gradients |
| 15 | No linter | repo | The unused-code typecheck covers most of it; leave as is |

## Resolved on 2026-10-05

Items 1–8 and 10–12 were handled by phases 1–8. The Vietnam helpers in `lib/time.ts` remain for back-office dates (the team works in Vietnam); event instants, windows and JSON-LD use the city's zone. Item 9 (keyset cursor) is still open, and so are 13–15.

## Accepted, not debt

- Two fronts (API-served and Next) for the same screens. This is deliberate, and a change to `ff-client.js` needs the same change in `festfinder-web/src/runtime/ff.ts`.
- One Postgres database with no separate ingestion service. The brief allows keeping the stack, and the ingestion load (a few thousand pages a day) fits in the existing jobs.
- No Playwright or headless browser on Vercel. Sources must expose JSON-LD, ICS or an API; browser scraping stays out (brief §35).
