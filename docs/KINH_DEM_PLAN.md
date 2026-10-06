# Kính đêm: plan

The Phase 0 plan for rebuilding the Next front (`festfinder-web`) in the Kính đêm look, as hand-written React + Tailwind CSS v4. The brief is `design_handoff_kinh_dem/README.md`; this file says how the work fits this codebase. Production (`festfinder-backend` serving `festfinder-frontend`) does not change.

## 0. Before Phase 1

- **`main` is merged in.** `feat/kinh-dem` was cut from an old local copy of `main`. Its last five commits had been rebased onto `main` under new hashes, with the same content (`ebad3b6` and `799d354` hold the same tree). The merge takes `main`'s side throughout, so the branch is `main` plus `design_handoff_kinh_dem/`.
- **The handoff is a little older than `main`.** Its §7 says the next migration is `017_*.sql`. On `main` it is `027_*.sql`. Its route list misses `/a` (the directory and `/a/style|city/…`) and `/c/[slug]`, which already exist as server-rendered pages. Both are covered below.

## 1. How old and new routes coexist

Two Next **root layouts** in route groups, one per look:

```
src/app/
  (legacy)/layout.tsx   today's layout: theme.css, Be Vietnam Pro, globals.css, <ff-app>, extension guard
  (legacy)/…            every route not rebuilt yet (moved here unchanged at the start of Phase 1)
  (kd)/layout.tsx       the new layout: kinh-dem.css (Tailwind + tokens), self-hosted fonts, no theme.css
  (kd)/kit/page.tsx     the component kit (Phase 1)
  (kd)/…                each route as it is rebuilt
  sitemap.ts, robots.ts, manifest.ts   stay at the top (they are not pages)
```

- **Cutting a route over means moving it** from `(legacy)` to `(kd)`. URLs do not change, because route groups are not part of the path.
- **Styles stay apart.** Next does a full page load when navigation crosses root layouts (`route-groups.md`, `layout.md`). Legacy pages never load Tailwind's preflight, and new pages never load `theme.css` or the `ff-*` classes, so README §3.1 step 3 (scoping preflight) is not needed. The `kd-` prefix stays as a second guard.
- **The legacy routers need one change.** Each legacy surface is a single-page app: `FF.navigate()` (`src/runtime/ff.ts`) uses `pushState` and the surface draws its own screen. Left alone, a click from the legacy `/list` to `/e/x` would draw the old event screen even after `/e/[slug]` is rebuilt. Add `src/kd/cutover.ts`, one list of rebuilt path patterns. `FF.navigate()` checks it and uses `location.assign()` for those paths, and the `popstate` handler does the same. This changes the Next runtime only: the API front has no rebuilt routes, so `ui/ff-client.js` stays untouched, and the plan says so on purpose.
- **Catch-all surfaces split by path.** `/app`, `/studio` and `/console` are each one catch-all page today. A rebuilt screen gets a specific route in `(kd)` (for example `(kd)/app/tickets/page.tsx`), which Next prefers over `(legacy)/app/[[...path]]`. The pattern also goes into `cutover.ts`. The catch-all keeps serving everything else until it is empty.
- **404s.** Each group gets its own `not-found.tsx`. Unknown paths keep falling through to the API (the `fallback` rewrite), as today.
- **SEO stays server-rendered.** `/e`, `/o`, `/a`, `/c` keep `seoMetadata`, the JSON-LD block, the `?lang=en` → `/en` rewrites and `revalidate`. The rebuilt page renders its real content on the server (React server components reading `src/lib/api.ts`), and the hydrated client parts take over interaction. The `summaries.tsx` fallback stays only for routes still on `(legacy)`.
- **Shared code.** The new screens import `FF` from `src/runtime/ff.ts` (API calls, session, money, clock, track) and `src/lib/api.ts`. They do not use `dc.tsx`, `view.ts` or `screen.tsx`. Copy comes from each surface's `logic.js` `{en, vi}` dictionary, moved into a typed `src/kd/copy/<surface>.ts` as each route is rebuilt.

## 2. Components

Under `festfinder-web/src/kd/`:

```
kd/
  ui/        the parts below, one file each, server-safe unless marked (client)
  genre.ts   familyOf(genre) → 'fest' | 'live' | 'edm' | 'cult' | 'free', chart order
  cutover.ts the rebuilt path patterns (§1)
  copy/      the {en, vi} strings per surface, typed
  hooks/     useMenu (one open at a time, Escape, outside click, arrow keys), useClamp, useScrollSpy
styles/kinh-dem.css   @import "tailwindcss"; + tokens/tailwind-theme.css, compiled and fixed
```

| Group | Components |
| --- | --- |
| Actions | `Button` (acc, light, dark, ghost, glass; sm, lg, pill, block), `IconButton` (line, sm, on), `Chip`, `Segmented` |
| Labels | `Tag` (glass, acc, bone, line), `Status` (ok, warn, bad, live), `Marker`, `Stat`, `DateBlock` (hi) |
| Forms | `Field` (tall, glass) + `FieldLabel`, `Switch` (client), `Option` (radio card), `QuantityStepper` (client) |
| Surfaces | `Card`, `BoneCard`, `Art` (family, bone, off; cover when `coverUrl`), `Avatar` (person circle, organiser square, ring) |
| Disclosure | `Menu` + `MenuItem` + `Scrim` (client), `InlineDropdown` (client), `Accordion` (native `<details>`, exclusive by `name`), `Clamp` + "Xem thêm / Thu gọn" (client) |
| Navigation | `WebNav` (Thể loại menu, account menu), `NavLink`, `Tabs`, `SectionBar` (scroll spy), `AppBar`, `TabBar`, `Dock`, `AppShell` + `SideNav` (Studio, Console), `Table` rows |
| Profile | `ProfileCover` (mosaic), `BadgeTile` + `Emblem`, `PassportStamp`, `Moments` grid + `Lightbox` (client) |
| Data | `BarTrack`, `LineChart` with tooltip, `StackedWeekly` (fixed family order) |
| Map | `MapView` wrapping `ui/map/ff-map.js` via `FF.loadMap()`, glass pins, the selected-event card |

**`/kit`** is in `(kd)`. It shows every component in every state, in the order of `System.dc.html`. It answers 404 in production builds unless `FF_KIT=1`, and is listed in neither the sitemap nor robots.

**Fonts and icons.** Be Vietnam Pro 400/500 from the existing `/ui/fonts` files. JetBrains Mono 400/500 (latin, latin-ext, vietnamese) self-hosted through `next/font/local`. Icons are `@phosphor-icons/react`, imported per icon (question 7).

## 3. Cutover order

Each step is one route or one screen, merged only when it is at parity (README §9's "done when").

| Phase | Order | Notes |
| --- | --- | --- |
| 1 | Tailwind, tokens, fonts, icons, `(legacy)`/`(kd)` split, `cutover.ts`, the `kd` library, `/kit` | Legacy routes unchanged: the existing Next specs pass as they are |
| 2 | 1. `WebNav` + footer. 2. `/e/[slug]` (+ `/en`). 3. `/` 4. `/list` with `?view=map`, then the table and grid views. 5. `/o/[slug]`. 6. `/a/[slug]` | The event page first: it is the most visited, the SEO page, and it exercises most parts (art, tiers, accordion, section bar, clamp). Home reuses its cards. |
| 3 | `/app` Explore → event → map → tickets → live → onboarding → profile tab; then plan, chat, recap, resale, checkout, settings, notifications, following, guide | The PWA keeps installing and `sw.js` keeps registering, checked on each step |
| 4 | Studio: dashboard → wizard → check-in → attendees, money, inbox, announce, promos, gigs. Console: moderation → insights → verification, reports, featured shelves, audit | |
| 5 | §7 features, one at a time, from migration `027` | Each needs migration, routes, tests, then UI that hides without data |
| 6 | `/a` directory, `/c/[slug]`, `/saved`, `/about`, `/advertise`, `/stats/[key]`, sign-in card; delete `(legacy)` and the compile step from Next if nothing uses it (question 1) | Docs updated (README §8) |

## 4. Tests

- **Every step:** `npm run typecheck` and `npm run build` in `festfinder-web`. `npm run typecheck` and `npm test` in `festfinder-backend` when the API changes.
- **Playwright, Next.** `npm run test:screens:next`. `e2e/screens.spec.ts` stays as it is for the API front. When a route moves to `(kd)`, its Next expectations move out of that shared spec run into `e2e/next/<route>.spec.ts`, written against the new markup with roles and labels, not classes. The Next config skips the shared spec's tests for cut-over routes by reading `cutover.ts`, so the two lists cannot drift.
- **Behaviour per route.** The things the old screen did, as tests: saving updates the count, the ticket button goes through `/go/<event>`, tier quantity limits, `FF.money` with the event currency, the map asks `/events/map` on open and on "search this area" only, menus close on Escape and outside click, `aria-expanded`/`aria-pressed`/`aria-checked`.
- **SEO.** For each rebuilt public route: the JSON-LD, the canonical and `hreflang` links, and the server HTML containing the title and key facts before any script runs.
- **Coexistence.** A legacy → rebuilt link does a full load and draws the new page. Back and forward work across the boundary. A legacy page has no Tailwind stylesheet, and a new page has no `theme.css`.
- **Look.** Playwright screenshots of each rebuilt route at 390, 760 and 1440, placed next to its board for review (not pixel-asserted: the boards hold invented data). Plus a keyboard pass, reduced motion, and 200% zoom at 390.
- **Accessibility.** `@axe-core/playwright` on `/kit` and each rebuilt route, as a devDependency of `festfinder-backend` next to Playwright.

## 5. Decisions

Answered by the owner on 2026-10-06: every recommendation below was accepted.

| # | Question | Decision |
| --- | --- | --- |
| 1 | **Production cutover.** When does production move to Next, and does the API front keep the old look meanwhile? | Not before Phase 4 is done. Until then the API front keeps Bảng phấn and no deploy setting changes. Decide again then; the compile step stays until that decision. |
| 2 | **Fan profile.** URL, public or not, default of "Hồ sơ công khai". | Own profile at `/app/profile` (the app's "Tôi" tab) and `/profile` on the web, signed-in only (`/me` is the API). A public `/u/[handle]` later, off by default, `noindex` even when on. Phase 5 adds a `handle` (unique, chosen by the person), because no such column exists today. |
| 3 | **Moments.** Upload vs. pasted link, moderation, who gets them on day one. | Upload through the existing file storage (`routes/uploads.ts`). It keeps the CSP as it is and the image under our control. No pasted links. Reported like events are (a report table next to `listing_reports`) and removed in Console. Day one: artists and organisers only. Fans later, with the public fan profile. |
| 4 | **Badges.** Approve the starter catalogue, and show them on public artist and organiser pages? | The catalogue minus the follower-count badges (10K/50K theo dõi, 10K/25K theo dõi): follower counts never rank an artist (`CLAUDE.md`). Badges show on public pages. |
| 5 | **Organiser rating and response time.** Real sources, or drop the stats. | Dropped. No ratings table exists. Response time from `inbox` would be a separate decision. |
| 6 | **Console undo.** Client-side hold or revert endpoint. | A client-side hold of 5 seconds before sending. No new endpoint, and the audit log records only decisions that stood. |
| 7 | **Icons.** Phosphor Regular or keep Bold. | Regular, through `@phosphor-icons/react`, imported per icon. The legacy font subset and `test/icons.test.ts` stay for the template fronts only. |
| 8 | **Featured placement in the wizard.** Step 4 or the success card. | The success card. |
| 9 | **Branch base.** Merge `main` into `feat/kinh-dem`. | Done (§0). |
| 10 | **Fonts.** Self-host JetBrains Mono (OFL). | Yes, 400/500, latin, latin-ext and vietnamese. |
