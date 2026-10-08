# FeestFinder on Next.js

FeestFinder's four surfaces — the public web, the attendee app, Studio for organisers and the Console for the team — in the **Kính đêm** ("night glass") design, on **Next.js 16, React 19, TypeScript and Tailwind v4**. Public pages render on the server for search engines; the attendee app installs as a PWA.

Every page is written by hand in React from the boards in [`design_handoff_kinh_dem/`](../design_handoff_kinh_dem/README.md). Production still runs the API-served front (`festfinder-frontend`, the "Bảng phấn" look); this one is kept working and tested next to it.

## Run it

The API has to be running, on the staging Supabase database in its `.env` (see [`../festfinder-backend`](../festfinder-backend/README.md)):

```bash
npm install --prefix festfinder-backend
```

```bash
npm run dev --prefix festfinder-backend
```

Then, in a second terminal:

```bash
npm install --prefix festfinder-web
```

```bash
npm run dev --prefix festfinder-web
```

Open http://localhost:3000. Paths the app does not own (`/auth/*`, `/me/*`, `/events/*`, `/files/*`…) are proxied to the API, so the browser sees one origin and the session cookie works as it does on the API's own server.

| Script | What it does |
| --- | --- |
| `npm run dev` | Compile the screens, then `next dev` on :3000 |
| `npm run build` / `npm start` | Production build and server |
| `npm run compile` | Copy `public/ui/` (the map, brand images, fonts) from `../festfinder-frontend`, and compile its templates to `src/screens/` (no route uses those any more; kept until production moves to this front) |
| `npm run typecheck` | Compile, generate Next's route types, `tsc --noEmit` |

The Playwright tests live with the API: `npm run test:screens:next --prefix festfinder-backend` builds this app, starts it with a fresh API behind it, and runs `e2e/next/*.spec.ts` (the shared `e2e/screens.spec.ts` is the API front's: it skips every path listed in `src/kd/cutover.ts`). Set `FF_KIT=1` to serve `/kit`, the page of every part.

## Settings

| Variable | When it is read | Default |
| --- | --- | --- |
| `FF_API_ORIGIN` | **build time** (it becomes a rewrite) and at runtime for server-rendered pages | `http://localhost:4000` |
| `SITE_URL` | runtime: canonical links, sitemap, structured data | `http://localhost:3000` |
| `WEB_PROXY_SECRET` | runtime: signs the requests this app sends the API (below) | off |
| `MAP_TILES_URL`, `MAP_OVERVIEW_URL`, `MAP_GLYPHS_URL` | build time: their origins join the CSP's `connect-src` | none |
| `FF_KIT` | runtime: `1` serves `/kit` | off |

When this app is at the site's public address (feestfinder.com), the API's `PUBLIC_BASE_URL` is that address, so the links and file URLs the API writes point here; while it runs on an address of its own, leave the API's as it is. `.env.example` lists them all.

## Deploy on Vercel

This app is its own Vercel project, next to the API's (`feestfinder`, Root Directory `festfinder-backend`), and calls the API across the internet. Vercel overwrites `X-Forwarded-For` on the way in, so without help the API would see this app's address for every visitor (one rate limit, one sign-in throttle for everyone). `src/proxy.ts` fixes that: with the same `WEB_PROXY_SECRET` on both projects it names the visitor (address, country) and this site's origin in `x-ff-*` headers signed by the secret, and `lib/api.ts` signs the server's own reads, which share one rate-limit bucket at 20 times a visitor's (a page with a query is rendered on request). Google sign-in then comes back to this site. The proxy signs only on Vercel (`VERCEL=1`), whose edge sets the visitor's address; the secret is trimmed on both sides, and the API logs a warning once when a request carries a secret that does not match.

1. **New project.** Vercel → Add New → Project → import `kitsbui/FeestFinder`. Root Directory `festfinder-web`; keep "Include files outside the Root Directory in the Build Step" on (the build copies `../festfinder-frontend/ui`). Framework Next.js, the default install and build commands (`npm run build` compiles, then builds). Node 24 comes from `engines`; `vercel.json` puts the functions in `hnd1`, next to the API and the database.
2. **Its variables** (Production, and Preview pointing at the staging API if wanted):
   - `FF_API_ORIGIN` = the API's address, e.g. `https://feestfinder.com` (a rebuild is needed when it changes).
   - `SITE_URL` = this project's address, e.g. `https://<project>.vercel.app` or its own domain.
   - `WEB_PROXY_SECRET` = a random value of 32+ characters (`openssl rand -hex 32`).
   - `MAP_TILES_URL`, `MAP_OVERVIEW_URL`, `MAP_GLYPHS_URL` = the API's values.
3. **On the API project** (`feestfinder`), then redeploy it:
   - `WEB_PROXY_SECRET` = the same value.
   - `CORS_ORIGINS` += this site's origin (sign-in may return only to listed origins).
4. **Google Cloud console** → the OAuth client → add the authorised redirect URI `<this site>/auth/oauth/google/return` (and the same for Facebook and Instagram if they are on).
5. **Check.** `<this site>/health` answers `"webProxy":"visitor"` (the API sees each visitor; `false` means the secret is missing or differs, and the API logs a warning when it differs); sign in with Google; `/list` and an event page load.
6. **Previews.** The API's preview deployments sit behind Vercel Authentication, so this project builds `main` only (Settings → Git → Ignored Build Step: `[ "$VERCEL_ENV" != "production" ]`).

Production keeps serving the API's own screens at feestfinder.com until its domain moves here.

### Moving feestfinder.com to this project

The API keeps running as it is; only the address people type changes hands. The API's own `*.vercel.app` addresses cannot stand in for it: `feestfinder.vercel.app` redirects to feestfinder.com, and the team address sits behind Vercel Authentication.

1. **The API's own address.** On the API project (`feestfinder`) → Domains → add `api.feestfinder.com`. If feestfinder.com's DNS is not on Vercel, add the CNAME record Vercel shows at the registrar. Wait until `https://api.feestfinder.com/health` answers `{"ok":true…}`.
2. **This project, aimed at it.** Steps 1–2 above with `FF_API_ORIGIN=https://api.feestfinder.com` and `SITE_URL=https://feestfinder.com`; deploy, and check its `*.vercel.app` address renders `/`, `/list` and an event page.
3. **The API's settings.** `WEB_PROXY_SECRET` (the same value), `CORS_ORIGINS` including `https://feestfinder.com` and `https://www.feestfinder.com`; keep `PUBLIC_BASE_URL=https://feestfinder.com` (sign-in returns, emails, share links and file URLs all stay on the public address). Redeploy the API.
4. **The domain.** Remove `feestfinder.com` and `www.feestfinder.com` from the API project and add them to this one (same redirect between them as before). Google's redirect URI `https://feestfinder.com/auth/oauth/google/return` stays as it is: it now reaches the API through this app.
5. **Check.** `https://feestfinder.com/` is the Kính đêm home; `/health` answers through the proxy; Google sign-in comes back signed in; a ticket button (`/go/<slug>`) redirects; `/ops` and `/door` still open (they are the API's screens, through the proxy); the pg_cron job `POST https://feestfinder.com/internal/jobs` still answers 200 (it is forwarded with its `Authorization`).
6. **Back out** if anything is wrong: move the two domains back to the API project. Nothing else needs undoing.

## How it is put together

```
src/
  app/
    (kd)/                    every page: layout (fonts, tokens), /, /list, /e, /o, /a (+ the directory), /c, /saved,
                             /about, /advertise, /stats, /profile, /app/*, /studio/*, /console/*, /kit;
                             /vi/… and /en/… redirect old landing URLs to /list
    sitemap.ts, robots.ts, manifest.ts
  kd/
    theme.css, kd.css        the tokens (Tailwind @theme) and the few classes Tailwind cannot express
    ui/                      the parts: actions, forms, menus, sheets, tabs and tables, cards, charts, badges, moments
    copy/                    Lang, pick(), fill(), COMMON; each screen keeps its strings in its own copy.ts
    runtime.tsx              KdProvider / useKd: session, sign-in card, toasts, saves and follows, the server clock
    web/                     the public pages (chrome.tsx is the nav and footer)
    app/, studio/, console/  the attendee app, the organisers' Studio, the team's Console (one layout each)
    map/                     the map views on FF.loadMap()
    cutover.ts               the rebuilt paths; the Playwright run reads it
  lib/api.ts                 server-side reads from the API and their types
  components/                the SEO head builder (seo-meta.ts) and the extension guard
  runtime/
    ff.ts                    FF: API calls, session, clock, loaders — typed; mirrors festfinder-frontend/ui/ff-client.js
    pwa.ts                   service worker registration, Web Push, sign-out clean-up
    dc.tsx, view.ts, screen.tsx   the compiled screens' runtime (with src/surfaces and src/screens: unused since Phase 6)
public/sw.js                 the service worker
```

- **Copy.** Every string is an `{en, vi}` pair, read with `pick(DICT, lang)`. Vietnamese is the default; English pages are `?lang=en`, and `inLang()` keeps links in the reader's language.
- **Server and browser.** Public pages are server components that render the content and its JSON-LD; the parts that depend on who is looking (saves, follows, the owner's controls) are client islands that ask the API once more in the browser.
- **Icons.** `@phosphor-icons/react`, Regular weight, imported one icon at a time from `/ssr`.

## Design system: Kính đêm

The tokens are in [`src/kd/theme.css`](src/kd/theme.css), from `design_handoff_kinh_dem/tokens/`. `/kit` shows every part.

- **Surface.** A near-black `void` (`#08090a`) with glass panels (`carbon`, `obsidian`, `slate`) and hairlines (`line`, `line2`). Type is `paper` and `mist`, quiet text `fog`.
- **One lime action.** The accent `acc` (`#e4f222`, ink `#08090a`) is for the one thing a screen is for; everything else is a quiet button.
- **Colour is genre.** Lễ hội `fest` `#ee6018`, Nhạc sống `live` `#0aa5b8`, EDM `edm` `#8b5cf6`, Văn hoá `cult` `#d6589e`. `familyOf(genre)` and `g(family)` (`src/kd/genre.ts`) set them on a card or a chart.
- **Type.** Be Vietnam Pro for words and JetBrains Mono for numbers, dates and labels, 400 and 500, served from this site (latin, latin-ext, vietnamese).
- **Motion and access.** Animations stop under `prefers-reduced-motion`; menus close on Escape and outside clicks; toggles carry `aria-pressed` or `aria-expanded`.

## Brand

The product is **FeestFinder** (renamed from FestFinder on 2026-09-23), at **feestfinder.com** (since 2026-10-02; its email addresses are `@feestfinder.com`). Code names, folders and packages keep the old spelling. So do the company's legal name on invoices and the payout bank account name, which change only if the company's do.

| File | Use |
| --- | --- |
| [`ff-logo.svg`](../festfinder-frontend/ui/assets/ff-logo.svg) | The wordmark: cream letters, green flags and sparkles. Headers and sign-in screens, on dark backgrounds only. Size it by height (26px in headers, 22px in the app); its width is 5.77× that. |
| [`ff-mark.svg`](../festfinder-frontend/ui/assets/ff-mark.svg) | The flag F on its own, where the wordmark does not fit: sign-in sheets, the share card. |
| [`ff-appicon.svg`](../festfinder-frontend/ui/assets/ff-appicon.svg) | The mark on its board-black tile: the app icon, also shown in notification previews. |
| `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` | Favicons for both fronts. The SVG follows the browser's theme: ink on light, cream on dark. The ICO and the touch icon use the tile. |
| `public/icons/app-icon-*.png`, `notification-badge.png` | The installed app's icons. The maskable one is full-bleed with the mark inside the safe zone. The badge is the white mark that Android shows in the status bar. |

The SVGs are the vectors from the logo pack (`FeestFinder_logo_pack_2`), cropped to the artwork, with coordinates rounded and each outline within 0.15px of the original at any size the screens use. The PNGs are rendered from them. On 2026-09-29 they were recoloured for the Chalkboard system (letters `#fffce1`, flags `#0ae448`, tile `#0e100f`) and the PNGs re-rendered with Playwright's Chromium.

## Search engines

Public pages render their real content on the server before any script runs.

| Page | Server-rendered | Structured data | Caching |
| --- | --- | --- | --- |
| `/`, `/?lang=en` | the city's events for the time chosen, the featured shelf | — | refreshed every minute; `?lang=en` is rewritten to `/en` |
| `/list` | every event, as a table, a grid or a map | — | refreshed every minute |
| `/e/:slug` | from the API (`GET /seo/events/:slug`): the facts, set times, tickets, updates and FAQ, related events | one `@graph` of the site, the page, the event, its breadcrumbs and FAQ | built on first visit, refreshed every minute |
| `/o/:slug`, `/a/:slug` | the organiser or artist, upcoming and past events, who they work with | a `ProfilePage` graph | refreshed every 5 minutes |
| `/a`, `/a/style/:style`, `/a/city/:city` | the artist directory (`GET /seo/directory/:key`) | an `ItemList` | as above |
| `/c/:slug` | a public collection (`GET /seo/collections/:slug`) | from the API | as above |

- **Languages.** Each page's `?lang=en` is rewritten (`next.config.ts`) to an `/en` page of its own, so both languages stay cached; each links the other with `hreflang`.
- **For AI agents.** `/e/<slug>.md`, `/o/<slug>.md`, `/a/<slug>.md`, `/c/<slug>.md` and `/llms.txt` come straight from the API.
- **No landing pages.** Each event page answers search engines itself. `/vi/…` and `/en/<city>/…` redirect (301) to `/list` with the same filters (`lib/legacy.ts`).
- **Unknown pages.** A missing event, organiser, artist or collection answers 404 with a bilingual page.
- **Crawling.** `/sitemap.xml` lists live events, organisers, artists and the directory pages in both languages. `/robots.txt` keeps `/app`, `/studio` and `/console` out; those, `/profile` and `/saved` are `noindex`.

## The installed app

- **`/manifest.webmanifest`.** Makes `/app` installable, with maskable icons and shortcuts to tickets and saved events.
- **`/sw.js`, production builds only.** Next's build assets, whose names change with their content, are cache-first. Design assets and icons keep their names across deploys, so they come from the cache and are refreshed in the background. `/app` pages and the signed-in person's data (tickets, saves, plan, events) are network-first, falling back to the last good copy when there is no signal. So *"your tickets still scan with no signal"* is true, and the tests check it with the network off. Signing out, or someone else signing in, removes every personal response from the cache.
- **Web Push.** Switching on any Push cell in the notification settings asks for permission and registers the browser as a device. The API sends to it with VAPID when `VAPID_*` is set. Tapping a notification opens its event or screen.

## Browser extensions

Extensions such as cursor trails add `<div>`s to `<body>` while a page loads. React pairs a `<div>` it expects in `<body>` with the first one it meets, so an extension's could make it throw the server HTML away, render the page again and delete the extension's element. Two things prevent that:

- The page sits in `<ff-app>` (`src/app/(kd)/layout.tsx`). The only `<div>`s the server puts straight into `<body>` are hidden ones: Next's metadata and React's streaming segments. **Keep it that way:** render new page-level markup inside the layout, never as a visible `<div>` directly in `<body>`.
- A small script in `<head>` (`src/components/extension-guard.tsx`) moves any other `<div>` added to `<body>` onto `<html>` until the page has hydrated, then puts it back.

The Next test suite injects such elements before and after the page content and checks for no hydration errors.

## Security headers

Every page gets a Content-Security-Policy. Scripts may come from this origin only, with no `eval` in production. Fonts come from this site only. Framing, plugins, `<base>` and cross-origin form posts are blocked. Pages also get `nosniff`, a strict referrer policy, a permissions policy and HSTS in production.

Next's inline bootstrap scripts need `'unsafe-inline'`, unless each page carries a per-request nonce. A nonce would make every page dynamic, and the public pages would lose static and ISR caching. The pages render no HTML from strings except escaped JSON-LD data blocks, which browsers do not execute.
