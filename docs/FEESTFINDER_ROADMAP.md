# FeestFinder roadmap

How each phase of [the implementation plan](FEESTFINDER_IMPLEMENTATION_PLAN.md) is progressing. Update this page in the same change as the work.

- [x] Phase 0: Audit ([current architecture](CURRENT_ARCHITECTURE.md), [tech debt](TECH_DEBT.md), [plan](FEESTFINDER_IMPLEMENTATION_PLAN.md))
- [x] Phase 1: Canonical data architecture
  - Migration `016_intelligence.sql`: `countries`, `cities`, venue fields, event currency/styles/type/confidence/freshness, `ingest_sources`, `ingest_runs`, `raw_events`, `event_sources` with a backfill.
  - `lib/places.ts`, event times in each city's timezone, `lib/money.ts`.
- [x] Phase 2: Ingestion framework
  - `services/ingest/` with adapter contract, normaliser, idempotent runs and the `ingest` job (every 5 min, 35 s budget).
  - Responsible fetching: robots.txt, 2 s per host, ETag/Last-Modified, content hash, one retry.
- [x] Phase 3: Sources
  - Adapters: website JSON-LD (single page or list page with a link pattern), ICS, Ticketmaster Discovery (needs `TICKETMASTER_API_KEY`).
  - RA/Facebook links are kept as provenance only, never fetched.
  - `/ops/sources` adds sources, runs them, shows runs and raw records.
  - Starter sources (`services/ingest/starter.ts`): Megatix SG/ID/TH/VN, WOMB Tokyo, Savaya Bali, TicketGo (âm nhạc), Ticketmaster SG (enabled only with its key). Production adds the missing ones on boot; elsewhere "Add suggested sources" in `/ops/sources`. Once added, a source is the team's.
  - Website adapter reads unseen pages first, then the oldest, within the run's time budget; finds links in embedded Next/Nuxt data; drops tracking parameters. Per-source `skip` (not a night out), `eventType` and `wallClock` (sources that stamp one offset on every city).
  - Normaliser: English dates ("Oct 10, 2026 10 PM"), a city name in front of the title or as the venue, Bangkok/Tokyo district names.
  - [ ] Configure more sources per city in production (team task; see below).
- [x] Phase 4: Deduplication
  - One voice per brand: megatix.com.sg and megatix.vn count as one source (`brandOf`).
  - Exact provenance first, then the deterministic score (title, venue, date, time, artist, 500 m).
  - Merge at 70 or more; 45–69 becomes a flagged candidate. Reason stored.
  - Community submissions use the same resolver.
- [x] Phase 5: Confidence system
  - Configurable rules, stored breakdown, labels and freshness.
  - On cards, on the event page ("Xác minh từ N nguồn"), in the map drawer, and in the `/ops` provenance tab.
  - `confidenceMin` filter, hourly recompute job.
- [x] Phase 6: Map discovery (web)
  - MapLibre view in `/list` next to Table and Grid, with "search this area" (no fetch on pan), clusters, drawer card and URL state (`view=map&bbox=…`).
  - `/events/map` takes every list filter and caps at 500.
  - Basemap from two self-hosted PMTiles archives (`scripts/build-tiles.sh`): `MAP_OVERVIEW_URL` and `MAP_TILES_URL`.
  - [ ] Upload the archives and set the variables in production (until then the map draws the board, city names and events).
  - [x] Map view in the app (`/app/list`), sharing `FFMap.session` with the web (search on open, on a city chip and on "search this area" only).
- [x] Phase 7: Music intelligence
  - [x] Style taxonomy, event types, deterministic classifier.
  - [x] Style and type chips in the list and map; styles and type in the ops event form.
  - [x] Smart Alerts by city and style (migration `017_artists_alerts.sql`; `/me/alert` takes `cities`, `styles`; app settings chips).
  - [x] Phase 7b: artists as records (`artists`, `event_artists`, kept in step on every save, backfilled once), `/artists/:slug`, the `/a/<slug>` page on both fronts with `MusicGroup` structured data, Markdown copy and sitemap entries; lineup chips link to it.
- [x] Phase 8: Asia expansion
  - Bangkok, Tokyo, Singapore, Bali launched next to the four Vietnamese cities.
  - City chips from `/meta/discovery`; prices in local currency.
  - Venues anywhere, checked against the city's bounds.
  - FeestFinder checkout and tiers stay VND-only.
- [x] Phase 9: Ticket partners (affiliate)
  - Every ticket button, web and app, goes through `GET /go/<event>`: counted in `outbound_clicks` (and the organiser's ticket-click counter), then sent to FeestFinder's checkout when a tier is on sale, else to the seller's page. No sign-in to leave for a seller.
  - Migration `018_ticket_partners.sql`: `ticket_partners` (sites, link parameters or a network's tracking link, commission), `outbound_clicks`, `partner_conversions`.
  - A partner's link gets its parameters, `{click}` becomes the click's id; partners report sales to `/partners/<slug>/postback?token=…` (GET or POST), matched back to the click and the event. Paid stays paid.
  - `/ops/partners`: partners, the token (shown once), sales and their status, the most-clicked events, and the ticket sites people use that no partner covers yet.
  - [ ] Sign the first affiliate deals and enter them in `/ops/partners` (team task).

- [x] Phase 10: The artist and organiser network (Night Build)
  - A. Personas: every account is a fan; `user_roles` adds artist and organiser, chosen in a role picker after the first sign-in. A profile already listed is claimed (`artist_claims`, `organizer_claims`), decided in `/ops/claims`. Admin only from the `ADMIN_EMAIL` allowlist, on a Google sign-in with a verified email (`ADMIN_SIGN_IN`); no route grants it. Only a proven email finds or links an account (`users.email_verified_at`). Migration `019_roles_profiles.sql`.
  - B. Artists: roles, base city, styles, booking status, travel scope, gig types, set lengths, links on fixed sites, identity anchors (MusicBrainz, Wikidata, Spotify) and aliases set by the team (`/ops/artists`). Directory at `/a`, `/a/style/<style>`, `/a/city/<city>` (indexed from 3 artists), ordered by next show, then completeness, never followers. Rock is its own genre. Migration `020_artist_organizer_network.sql`.
  - C. Organisers: type, markets, styles, open for submissions, links; pages list the artists and venues they worked with.
  - D. Relationships are read from canonical events with their evidence (`services/network.ts`); similar artists by fixed weights. Artists report gigs (`POST /me/artist/gigs`, migration `021`): matched like an import, an "artist" source with community weight, never published or put on an organiser's lineup by itself.
  - E. Affiliate: `/go/link/<code>` links (migration `022`), click placement, device, country and referrer (no IP, no user agent, no robots), payouts that settle approved sales once; `/ops/affiliate`, ticket clicks on the organiser overview.
  - F. Gear and software: curated `gear_items` (migration `023`), artists list theirs on `/ops/artist/gear`, new names wait for the team; artist pages and `?gear=` in the directory.
  - G. Gig marketplace (migration `024`): opportunities, applications sorted by a fixed fit score (`services/gigs.ts`), booking requests, availability; `/ops/org/gigs`, `/ops/artist/opportunities`.
  - H. Analytics: `FF.track` → `/analytics/collect`, plus a few server events; forwarded to PostHog only with `POSTHOG_KEY`, pseudonymous, listed properties only, nothing under Do Not Track or GPC.
  - Follow-ups: gig alerts under their own "bookings" notification topic (migration `025`); free and busy dates on public artist pages; payout CSV export; brand campaigns for artists open to brands (migration `026`, `/ops/brands`, the Brands tab in artist opportunities, `?brands=1` in the directory); gigs in `/studio/gigs`.
  - [ ] Set `ADMIN_EMAIL` (and `POSTHOG_KEY` if wanted) in Vercel; rotate the admin password that was shared in chat (team task).

## Kính đêm (the Next front in React + Tailwind)

The redesign from `design_handoff_kinh_dem/`, built in `festfinder-web` on the `feat/kinh-dem` branch. Production keeps the API-served front. Plan and decisions: [KINH_DEM_PLAN.md](KINH_DEM_PLAN.md).

- [x] Phase 0: Plan, and the owner's answers to the handoff's questions
- [x] Phase 1: Tailwind, tokens, fonts, icons, the `(legacy)`/`(kd)` split, the `kd` components, `/kit`
  - Tailwind CSS 4.3 with the tokens (`festfinder-web/src/kd/theme.css`, the default palette off) and the design system as `kd-*` classes (`kd.css`); Be Vietnam Pro and JetBrains Mono self-hosted (`@fontsource`); Phosphor Regular from `@phosphor-icons/react/ssr`.
  - Two root layouts: `src/app/(legacy)` (every compiled screen, unchanged) and `src/app/(kd)`. `src/kd/cutover.ts` lists the rebuilt paths; the legacy router loads them as pages.
  - Components in `src/kd/ui`, the browser runtime (session, saves, follows, sign-in sheet, toast) in `src/kd/runtime.tsx`, and `/kit` (404 in production builds unless `FF_KIT=1`), checked by `e2e/next/kit.spec.ts`.
- [x] Phase 2: Web: nav, `/e/[slug]`, `/`, `/list` + map, `/o/[slug]`, `/a/[slug]`
  - [x] Nav, footer (remembers the language), search, the role picker, `KdLink` (a link to a compiled screen is a plain link, never prefetched).
  - [x] `/e/[slug]` (+ `?lang=en`): hero, section bar, about with the SEO facts, line-up with plan picks and clashes, hype, FAQ, discussion, photos, ambassadors, the tickets panel (tier and quantity through `/go`, up to 6), resale, venue map, the organiser's other events. JSON-LD kept.
  - [x] `/` (+ `?lang=en`): city and inline time headline, featured card, sort and family chips, "Gần đây, tối nay" with the map teaser, FAQ. `/events?family=` filters by genre family.
  - [x] `/list` (+ `?lang=en`): table, grid and map with the legacy filters in the address; the map asks `/events/map` on open and on "search this area" only, in the Kính đêm map style (`/map/style.json?theme=kd`).
  - [x] `/o/[slug]` (+ `?lang=en`): cover, organiser, numbers, upcoming cards and past events by year, what it runs, the artists it books, venues, business details. No rating or response time (no source). A listing that is not verified offers its people the role picker with its name filled in.
  - [x] `/a/[slug]` (+ `?lang=en`): cover, artist, numbers, upcoming shows as dated rows (tickets through `/go/<slug>?src=artist`) and past shows, bio and links, who they play with most, free dates, venues, similar artists, gear, booking details. The directory (`/a`, `/a/style/…`, `/a/city/…`) stays compiled until Phase 6.
- [x] Phase 3: App
  - [x] The app root (`src/kd/app/root.tsx`): Vietnamese unless the device chose English, the service worker, the tab bar (Khám phá · Bản đồ · Đã lưu · Vé · Tôi). `/app` itself moved, so the legacy catch-all is `[...path]`.
  - [x] `/app` Explore and first-visit onboarding (genres, "Dùng vị trí của tôi" or a city; kept on the device only), `/app/e/[slug]` (the web event parts, a glass dock), `/app/list` (map, and the same events as rows; `?q=` search), `/app/saved` (saves and collections with the public link), `/app/tickets` (a real, scannable QR per ticket: `qrcode-generator`; the doors countdown; give or resell at face value), `/app/profile` (passport, Wrapped, your sound, following, settings), `/app/checkout/[slug]` (tier and quantity from `/go`, promo codes, VietQR transfer with polling, resale listings).
  - [x] `/app/live/[slug]` (now and next per stage, reminders, site map), `/app/recap/[slug]` (stars, what stood out, photos), `/app/plan/[slug]` (members, meet spot, splitting with a VietQR request, group chat; inviting friends when there is no plan), `/app/chat/[id]`, `/app/guide/[slug]` (the AI guide), `/app/notifications`, `/app/alerts` (Smart Alerts), `/app/settings` (the channel matrix, push), `/app/hyped`, `/app/following`. The compiled app has no route left: every `/app` path is rebuilt.
- [ ] Phase 4: Studio, then Console
- [ ] Phase 5: Moments, badges, passport, fan profile, Studio metrics, moderation reasons and undo
- [ ] Phase 6: Undrawn routes, clean-up, docs

## What the team does next in production

1. Set `TICKETMASTER_API_KEY` in Vercel if Ticketmaster is wanted (Singapore has the most coverage).
2. Add sources in `/ops/sources` for each city: venue and festival programme pages that carry schema.org data, public ICS calendars. Hà Nội is covered by TicketGo; Đà Nẵng and Nha Trang have no public structured source yet (see the note in `services/ingest/starter.ts`), so their events come from organisers and the community.
3. In `/ops/partners`, add each ticket seller FeestFinder has an affiliate deal with, give them the sale report address, and settle reported sales.
4. Approve candidates in the review queue (bulk approve works). The "500+ upcoming events in 5 cities" goal depends on these sources.
5. Set `ADMIN_EMAIL` in Vercel to the team's Google addresses. Admins sign in with Google; the shared password disclosed earlier must be rotated and is not used by this build.
6. Approve profile claims in `/ops/claims` (Profiles tab) and gear suggestions in `/ops/artists` (Gear tab); verify the artists you know and add their MusicBrainz or Spotify ids.
7. Produce the PMTiles extract for the launched cities, upload it to the bucket with range requests enabled, and set `MAP_TILES_URL` (and `MAP_GLYPHS_URL` for place names).

## Postponed

- Resident Advisor and Facebook adapters: terms forbid scraping. Their links are kept as provenance only.
- Eventbrite and Bandsintown adapters, Playwright scraping.
- EventSignal / early warning, AI duplicate fallback, AI style classifier, semantic search, recommendations.
- "Festival within 500 km" alerts; artist bios and photos (the columns exist, nothing fills them yet).
- FeestFinder checkout in currencies other than VND.

## Log

- 2026-10-05: Phase 0 audit written. Decisions taken: hybrid ingestion, no RA/FB crawling, map back now, five cities now.
- 2026-10-05: Phases 1–6 and 8 built, phase 7 in part. API suite 224 tests (223 pass, 1 skipped as before); new `test/ingest.test.ts` (26 tests, fixtures only).
- 2026-10-05: Phase 7 finished (Smart Alerts by city and style, artist pages), the map in the app, starter sources and fixes from reading real sources.
- 2026-10-05: Ticket buttons fixed on the web (they only showed a message) and in the app (imported events said no tier was on sale); phase 9, ticket partners; normaliser splits a venue from its address and drops a city after the title. No new source for Đà Nẵng or Nha Trang: none publishes event data.
- 2026-10-05: Phase 10, the Night Build: personas and the admin allowlist, the artist directory and network, organiser network, artist gig reports, affiliate links and payouts, gear, the gig marketplace and first-party analytics (migrations 019–024). Fixed on the way: an unproven email could take over an account by signing in with it.
- 2026-10-06: Phase 10 follow-ups: bookings notification topic, public availability, payout CSV, brand campaigns, gigs in the studio (migrations 025–026).
- 2026-10-06: Kính đêm Phase 0: plan written, all of the owner's decisions taken (production stays on the API front until after Phase 4, fan profile private at `/profile`, moments uploaded, no follower-count badges, no organiser rating, client-side undo, Phosphor Regular, featured placement on the success card).
- 2026-10-06: Kính đêm Phase 1: foundation, components and `/kit`. The Next Playwright run passes as before (114 tests, 5 of them new).
- 2026-10-06: Kính đêm Phase 2, first half: the event page, home and list in React + Tailwind (`e2e/next/event.spec.ts`, `home.spec.ts`, `list.spec.ts`). Checkout takes at most 6 tickets from `/go`, as the panel offers. The Next run: 122 passed, 19 shared tests skipped on rebuilt paths.
- 2026-10-06: Kính đêm Phase 2 done: organiser and artist pages (`e2e/next/org.spec.ts`, `artist.spec.ts`). Links on the rebuilt pages keep the reader's language (`inLang`). The Next run: 131 passed, 22 shared tests skipped on rebuilt paths.
- 2026-10-06: Kính đêm Phase 3, first part: the app root and eight app screens (`e2e/next/app.spec.ts`, 10 tests). The wallet's event carries its instant, timezone, genre and position; `/me/follows` gives each followed artist's page (`artistPages`). The rebuilt runtime keeps the last server-clock offset, so tickets stay "upcoming" offline.
- 2026-10-06: Kính đêm Phase 3 done: every app screen rebuilt (`e2e/next/app-more.spec.ts`, 9 more tests). Signing out from the app stops this browser's push again (`FF.beforeSignOut`). The Next run: 139 passed, 39 shared tests skipped on rebuilt paths.
