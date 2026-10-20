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
| 14 | Seed covers point at a dead host `assets.feestfinder.com` | `test/fixtures/seed.ts` | Tests only; the screens fall back to gradients |
| 15 | No linter | repo | Resolved on 2026-10-17. The web has type-aware ESLint (`npm run lint`, budget 56 warnings, 48 on 2026-10-18). The API has oxlint with its type-aware mode (`oxlint-tsgolint`, built on typescript-go, so TypeScript 7 works), in CI: 0 errors, a budget of 1,322 warnings (mostly `any` on untyped SQL rows, and object-to-string) that may only go down. The first run found two promises returned where nothing waited (the job timer and the shutdown handler), now handled; the control-character rule is off because those regexes strip control characters on purpose. |
| 16 | Screens could scroll sideways on phones (fixed-width tables, rails, timetable) | `festfinder-web/src/kd` | Fixed on 2026-10-16 (night build N11): rails fold, tables shrink and become cards, `e2e/next/layout.spec.ts` checks 5 roles × 390/1440. A new screen that needs a wide grid must fold the same way. |
| 17 | Featured shelves have no public screen | `routes/catalog.ts` `/shelves`, `/console/featured`, `lib/ads.ts` | Found on 2026-10-17: the Console curates shelves and the API serves `/shelves`, but no page or app screen reads them; the old home's featured card went with the home (the list is the home now). The paid "Kệ Nổi bật" placement therefore shows nowhere. Needs an owner decision: a shelf above the list on the home page, in the app, or retire the placement. Resolved on 2026-10-20 (growth plan card 5): the first shelf that is on with three live events or more takes the home page's highlight slot instead of the festivals, with "Được tài trợ" when the team marks it paid for (migration 055); a card on a live shelf is "Nổi bật". |
| 18 | The app keeps its own "Khám phá" tab (`/app`) | `kd/app/explore.tsx`, `kd/app/root.tsx` | The web's Khám phá page was removed on 2026-10-17; the app's feed tab was left as it is until the owner says whether it goes the same way (to `/app/list`). Decided 2026-10-17: it merges into `/` in design v2 phase 4 (docs/FEESTFINDER_ROADMAP.md). Resolved on 2026-10-17 in phase 4: `/app` and its map, saved, profile and event addresses redirect into the site with their query. |
| 19 | Ultra's and Tomorrowland's sites carry no event data | `services/ingest/starter.ts` | Checked 2026-10-17: their Asian editions reach Radar only through ticket sites or the team. A custom reader per site would break with every redesign; ask them for a feed or use a ticketing partner. |
| 20 | Festival cities without detailed map tiles | `lib/places.ts`, `scripts/build-tiles.sh` | Pattaya, Phú Quốc, Incheon and Chiba (and Phuket) are known, not launched: a festival there shows on the overview map only until the tiles are cut again with them (skill `feestfinder-add-city`). |
| 21 | Community submissions shared Feest Radar | `services/community.ts` | Resolved on 2026-10-17 (migration 044): Feest Radar holds ingestion's finds, Cộng đồng FeestFinder (`/o/cong-dong` again) what people send in; the events someone posted moved back to the community. |
| 22 | `any` on the API's SQL rows | `festfinder-backend/src` (`many<any>`, `one<any>`, presenters taking `any`) | Found again in the design v2 review (artboard 23, 2026-10-18): about 1,300 of the API's lint warnings. The plan: named row types per table where a query is read, zod schemas shared as the contract, a typed client for the web instead of `FF.get` returning `any`; 1,312 → 300 → 0, the oxlint budget lowered as it goes (docs/RELIABILITY.md). Started 2026-10-18: `src/db/rows.ts` names every table's row (written by `npm run rows` from the migrations, checked by `test/rows.test.ts`), the SEO builders use it (1,282 left, budget 1,292). |
| 23 | Two files too long to read | `services/seo.ts` (1,173 lines), `kd/studio/wizard.tsx` (709) | `services/seo.ts` was split on 2026-10-18: one file per page kind in `services/seo/` (shared, event, organizer, collection, artist, directory, text, crawlers), `seo.ts` re-exports them. The wizard's form model (`kd/studio/wizard-model.ts`) and the fields it shares with the editor (`kd/studio/fields.tsx`) left it the same day (446 lines); its four steps are still one component, to split next. |
| 24 | Thai, Japanese and Indonesian pages read the API in English | `services/seo.ts`, every `L(en, vi)` | Design v2 phase 10 (2026-10-18) gave the public pages' own lines those languages (`festfinder-web/src/kd/copy/asia/`); titles and descriptions the API builds (SEO, JSON-LD, emails) and what organisers write stay English there. A native speaker of each reads the lines before a city is promoted. |
| 25 | The event page's JS is over the first budget step | `kd/web/event` (221 KB gzipped, `perf.spec.ts`; the ride sheet's QR code loads with the sheet since 2026-10-18) | The discussion and the share sheet could load when they near the screen; the budget only goes down. |

## Resolved on 2026-10-05

Items 1–8 and 10–12 were handled by phases 1–8. The Vietnam helpers in `lib/time.ts` remain for back-office dates (the team works in Vietnam); event instants, windows and JSON-LD use the city's zone. Item 9 (keyset cursor) is still open, and so are 13–15.

## Accepted, not debt

- One Postgres database with no separate ingestion service. The brief allows keeping the stack, and the ingestion load (a few thousand pages a day) fits in the existing jobs.
- No Playwright or headless browser on Vercel. Sources must expose JSON-LD, ICS or an API; browser scraping stays out (brief §35).
