# Handoff: FeestFinder "Kính đêm" (Night Glass) — rebuild the Next front in React + Tailwind

> **Tóm tắt cho chủ dự án (Kitty):** thư mục này là gói bàn giao thiết kế "Kính đêm" cho Claude Code. Claude Code sẽ dựng lại giao diện trong `festfinder-web` (Next.js) bằng React + Tailwind, theo từng giai đoạn, trên một nhánh riêng. Bản production hiện tại (do API phục vụ) chưa đổi cho tới khi bạn quyết định chuyển production sang Next. Những điểm cần bạn chốt nằm ở mục 10.

This folder is the design handoff for the "Kính đêm" redesign of FeestFinder. It sits next to `design_handoff_festfinder/` (the original handoff). Like that one, it is **reference only**: read it, never edit it.

---

## 0. Read this first

**The decision.** The owner chose to rebuild the screens of the Next front (`festfinder-web`) as hand-written **React components styled with Tailwind CSS**, instead of restyling the design templates in `festfinder-frontend/pages/`. The owner was told what this means and chose it. Concretely:

- New UI code lives in `festfinder-web/`. The compile pipeline (`scripts/compile-screens.ts` → `src/screens/*`) keeps serving every route that has not been rebuilt yet, so the Next front works at every step.
- **Production is not affected** until the owner decides otherwise. Production runs `festfinder-backend`, which serves `festfinder-frontend` (the "Bảng phấn" look). Do not change the Vercel project, its root directory, or any deploy setting. Moving production to Next is an owner decision (see §10).
- `festfinder-frontend/` stays as it is. Do not restyle `theme.css` or the templates for this work. The API-served front and `/ops` keep the old look.
- Shared runtime code is still shared. Reuse `src/runtime/ff.ts` (the `FF` API client, session, router, clock, money, loaders) and `src/lib/api.ts` (server-side reads). Read each surface's `logic.js` (`festfinder-frontend/pages/<surface>/logic.js`) as the specification of current behaviour and copy. It holds every `{en, vi}` string and every rule the screen follows today.

**The order of work** is in §9. Start with Phase 0: read, then write a short plan and the questions for the owner, and wait for answers before you build anything §10 lists.

**House rules still apply.** Everything in the root `CLAUDE.md` holds, except the screen-editing rule, which this work replaces for the Next front (§8 lists what to update). Work on a branch. Commit, push or deploy only when the owner asks. A push to `main` deploys production.

**Next.js 16 is not the Next.js you know.** Read `festfinder-web/AGENTS.md`, then the guides in `node_modules/next/dist/docs/`, before writing route or data code.

---

## 1. What is in this folder

```
design_handoff_kinh_dem/
  README.md                 this brief
  PROMPT.md                 the message the owner pastes into Claude Code to start
  tokens/
    kinh-dem.tokens.json    every token (W3C design-token format), with contrast notes
    tailwind-theme.css      Tailwind v4 @theme + base + the kd-* component classes
  design/
    *.dc.html               21 boards: the design, interactive (see the table in §5)
    ff.css                  the design system as the boards use it (the visual source of truth)
    canvas.json             board titles, groups (pages) and sizes
    support.js              prototype runtime, only so the boards open in a browser
    assets/                 ff-wordmark.svg, ff-wordmark-ink.svg, ff-mark.svg
```

### Opening the boards

```bash
cd design_handoff_kinh_dem/design && python3 -m http.server 8077
# open http://localhost:8077/Web-Home.dc.html  (any board)
```

`support.js` loads React from unpkg and the boards load Be Vietnam Pro and JetBrains Mono from Google Fonts. That only happens in this preview. The product must self-host everything (§8). Phone boards are drawn at 390 px wide. Web, Studio and Console boards are fluid: check them at 390, 760, 1024 and 1440.

### Reading a board

Each `.dc.html` has the same three parts as the original handoff:

1. `<helmet>`: fonts and a few page styles. Every board also links `ff.css`.
2. A template: `{{ value }}` holes, `<sc-if value="{{ flag }}">`, `<sc-for list="{{ rows }}" as="row">`. Styling is the classes in `ff.css` plus inline `style` for layout.
3. `class Component extends DCLogic`: `state` holds prototype state and `renderVals()` returns every value and handler the template uses.

So: **look and layout are in the template and `ff.css`; behaviour is in `renderVals()`.** Port both. Do not port `support.js`.

**All data in the boards is invented** (Saola, Kira, Tre Xanh, Đêm Trắng Collective, Nguyễn Minh, the dates around 18.09.2026, view counts, ratings). Real venue names appear for flavour only. Never seed any of it. Production has no demo data and never will (`CLAUDE.md`).

**The boards are Vietnamese only.** Every string you write goes into an `{en, vi}` pair. Take the English from the matching string in the surface's `logic.js` when one exists.

---

## 2. The design in one page

Use these principles when you build a screen nobody drew.

- **Practical and minimal, mobile first.** No space that does no work. No tips cards and no "why we ask" lines (the repo's Lean UI rule).
- **Night ground, hairlines.** Surfaces step `void → carbon → obsidian`. Edges are 1 px hairlines (`line`, hover `line2`), drawn as `box-shadow: inset 0 0 0 1px`. There are **no drop shadows** and **no gradients**.
- **One lime action per screen.** `acc #e4f222` marks the single primary action, "Miễn phí", the current user's location and avatar, and active marks (nav underline, tab-bar tick, selected tier ring). Nothing else is lime.
- **Bone figure on dark ground.** `bone #eeeeee` with `ink` text is for the thing a person holds: a ticket card, the headline artist, today's date block, the sold/capacity KPI, the light button.
- **Emphasis = genre colour + genre shape.** Four families, each one colour and one shape (§3.3). Default event art is a composition of the family's shapes (`.art`), never a photo stand-in or a gradient. Genre colours are for shapes, markers and charts, never for text.
- **Glass only over colour or a moving page.** Use glass for the nav, the mobile tab bar, docks, map pins and controls, tags over art, and tooltips. A dropdown menu is near-opaque (`.menu`), because a blur inside a blurred bar cannot reach the page.
- **Type.** Be Vietnam Pro 400/500 for words. JetBrains Mono 400/500 for labels (uppercase, 11 px, +3% tracking), prices, counts, codes and dates. Use tabular numbers wherever a number can change.
- **Status is a dot and a word**, never colour alone (`.st ok|warn|bad|live`).
- **Disclosure: show what decides, fold the rest.** Pickers are dropdowns (city, time, sort, event, reasons). Secondary sections are native `<details>` accordions. Long text is clamped to 2–3 lines with "Xem thêm / Thu gọn". Lists show the first few items with "Xem thêm N". Badge grids show only the earned badges, and in-progress ones sit under a collapsed "Đang làm".
- **Motion is short and mechanical.** 150 ms with `cubic-bezier(.4,0,.2,1)`. The only loops are the live pulse and the QR scan line. `prefers-reduced-motion` turns everything off.
- **Accessibility.** Hit targets are at least 44 px (small controls pad their hit area with `::after`). Focus is visible (2 px lime outline). Body text is at least 4.5:1 and `ash` is never text. Menus close on Escape and on an outside click. Expanding controls carry `aria-expanded`, and toggles carry `aria-pressed` or `aria-checked`.

`design/System.dc.html` shows the whole system: colour, genre shapes, type, components, profile parts, and "07 Mở & gập" (the disclosure patterns).

---

## 3. Tokens and Tailwind

### 3.1 Setup

1. Add Tailwind CSS v4 to `festfinder-web` with its PostCSS plugin, following the Tailwind docs for the installed version and the Next 16 docs in `node_modules`.
2. Copy `tokens/tailwind-theme.css` into the app (for example `src/styles/kinh-dem.css`) and import it right after `@import "tailwindcss";`. This file was written by hand and **not compiled** in the design session (no npm access there). Compile it once and fix anything your Tailwind version names differently.
3. Leave Tailwind's preflight on for the new routes only if it does not disturb the compiled legacy screens that still render on other routes. Check one legacy route after adding it. If preflight breaks them, scope the new UI under a root element and import preflight only there.
4. Fonts must be self-hosted, because the CSP allows no font CDN.
   - **Be Vietnam Pro** is already served at `/ui/fonts/be-vietnam-pro.css`.
   - **JetBrains Mono** 400/500 (latin, latin-ext, vietnamese subsets) needs adding, through `next/font/local` or as files under `public/`.
   - Weights 600–800 are not used.

### 3.2 Names you will use

| Token | Utility examples | Use |
| --- | --- | --- |
| `void #08090a` · `carbon #0f1011` · `obsidian #161718` · `slate #1c1d20` | `bg-void`, `bg-carbon` | page, cards, raised; `slate` = chart grid |
| `line #23252a` · `line2 #383b3f` | `border-line`, `shadow-[inset_0_0_0_1px_var(--color-line)]` | hairlines |
| `paper #f7f8f8` · `mist #d0d6e0` · `fog #8a8f98` · `ash #62666d` | `text-paper`, `text-mist`, `text-fog` | titles, body, meta, icons only |
| `bone #eeeeee` · `ink #101010` · `ink2 #57534f` | `bg-bone text-ink` | bone figures |
| `acc #e4f222` · `acc-hi #eef75c` · `acc-ink #08090a` | `bg-acc text-acc-ink hover:bg-acc-hi` | the one action |
| `hot #eb5757` · `ok #46c37b` · `warn #f0b429` | `text-ok` | status |
| `fest #ee6018` · `live #0aa5b8` · `edm #8b5cf6` · `cult #d6589e` | `bg-edm` | shapes, markers, charts only |
| type `d0 d1 d2 d3 h hs tl t s` | `text-d2`, `text-hs` (size, leading, tracking, weight in one) | §2 type |
| `m`, `mb` | `kd-m`, `kd-mb` | mono label, mono value |
| radii `tag 4 · btn 6 · seg 8 · opt 10 · card 12 · org 14 · sheet 20 · pill` | `rounded-btn`, `rounded-card` | |
| breakpoints `tab 760 · desk 900` | `tab:px-8`, `desk:flex` | wrap gutters 16→32; show-sm/hide-sm at 900 |
| `max-w-wrap` (1200) | page width | |
| `ease-ff` · `animate-kd-pulse` · `animate-kd-scan` | | |

The `kd-*` component classes in `tailwind-theme.css` cover what utilities cannot express. They need pseudo-elements or a `--g` custom property:

- `kd-g-fest|live|edm|cult|free`: set the genre family on any ancestor.
- `kd-mk`: the genre marker.
- `kd-art`: art tile; modifiers `kd-b` (bone variant) and `kd-off` (dimmed).
- `kd-emb`: badge emblem; modifiers `kd-sm` and `kd-off`.
- `kd-st`: status dot + word; modifiers `kd-ok`, `kd-warn`, `kd-bad`, `kd-live`.
- `kd-glass`, `kd-glass-hi`, `kd-menu`.
- `kd-switch`: driven by `aria-checked`.
- `kd-acc`: `<details>` accordion, with `kd-sm` and `kd-chev`.
- `kd-hit`: 44 px hit area for small controls.

They are prefixed so they never collide with the legacy `ff-*` classes in `theme.css`, which the compiled screens still load.

### 3.3 Genre families (API genre → family)

| Family | Colour | Shape | API genres (`events.genre`) |
| --- | --- | --- | --- |
| Lễ hội / Festival | `fest #ee6018` | circle | Festival |
| Nhạc sống / Live music | `live #0aa5b8` | square / column | Indie, Hip-Hop, Pop, Jazz |
| EDM | `edm #8b5cf6` | triangle | EDM |
| Văn hoá / Culture | `cult #d6589e` | half-disc | Food, Culture |
| Miễn phí / Free (not a genre) | `acc` | ring | price 0; also the fallback for an event with no genre |

- This is the same grouping as `GENRE_TONE` in `festfinder-frontend/ui/ff-client.js` (`culture` there is `cult` here). Make one helper, `familyOf(genre)`, and use it everywhere.
- The chart category order is fixed: fest, live, edm, cult. It was checked for colour-blind separation on the dark ground.
- An event that has a cover (`coverUrl`) shows the cover. Without one, it shows `kd-art kd-g-<family>`, alternating plain and `kd-b` in lists (by index).

---

## 4. Components

Build these once under `festfinder-web/src/kd/` (or the location your Phase 0 plan picks). The middle column is the class in `design/ff.css` that is the visual spec. Measurements below come from that file.

| Component | ff.css | Essentials |
| --- | --- | --- |
| Button | `.btn` `.acc .light .dark .ghost .glass` `.sm .lg .pill .block` | h44 (sm 36 with 44 hit area, lg 52), r6, 14px/500, default = 5% white + hairline; `acc` lime is the one action |
| IconButton | `.ib` `.line .sm .on` | 44 round; `.on` = lime icon, fillable path filled (save/heart) |
| Chip | `.chip` (+ genre marker) | h36 pill; on = paper fill, void text; counts in mono at 60% |
| Tag | `.tag` `.glass .acc .bone .line` | h24 r4 mono 11 uppercase |
| Status | `.st ok warn bad live` | dot + word, mono 11 uppercase |
| Field | `.field` `.tall` `.glass`, `.flabel` | h44 r6, focus ring = mist hairline; label 13/500 mist |
| Segmented | `.seg` `.full` | track r8, button h32 r6; for 2–3 options only, otherwise a dropdown |
| Card / BoneCard | `.card`, `.bonecard` | carbon + hairline r12 / bone + ink |
| Art tile | `.art .g-* .b .off` | §3.3; events, moments without image, covers |
| Marker | `.mk` | 10px genre shape before genre labels, venues, rows |
| Date block | `.dblk .hi` | 56×60, day 22/500 + mono weekday/month; `hi` = bone (next show) |
| Stat | `.stat` | value 22/500 tabular + mono label; hairline separators |
| Avatar | `.av .sq .ring` | people circle, organisers rounded square r14; `.ring` = 4px void ring and z-index above any cover |
| Tabs | `.tabs .tab .c` | h44, active = paper + 2px paper underline, count in mono |
| Nav link | `.nl .on` | h44, active = 2px lime underline |
| Dropdown menu | `.menu .mi .on .tick .aside`, `.scrim` | near-opaque r12, item h40, tick = lime check, aside = mono count or "Sắp có"; root-level transparent scrim closes it; Escape closes; arrow keys move |
| Inline dropdown | `.dd` | a heading word that opens a menu ("**Cuối tuần này** ▾ có gì chơi?", the Studio event title); underline line2 → lime on hover |
| Accordion | `.acc .sm`, `<details>` | summary h56 (sm 48) 17/500, chevron rotates; exclusive groups use `<details name>` |
| Clamp + more | `.clamp2 .clamp3 .more` | `line-clamp-*`; "Xem thêm / Thu gọn" with chevron, `aria-expanded` |
| Switch | `.switch` | 44×26, lime when on, knob moves |
| Option (radio card) | `.opt .on` | ticket tier: name, price (mono), note, status; on = lime 1.5px ring + 6% lime fill; disabled 45% |
| Quantity stepper | Web-Event `.qty` (helmet) | − n +, 36px buttons, 1…max |
| Badge tile | `.bdg .on`, `.emb .sm .off .n` | emblem 56 (sm 40): the genre shape or a mono number on a 2px ring of the family colour; "Mới" lime tag on new; detail card on select |
| Passport stamp | `.stamp .dim` | square tile, dashed inner frame, big genre marker, date + name |
| Moments | `.mgrid .mtile .mplus` + lightbox | 3×3, gap 4–6; owner sees a dashed "+ Thêm" tile while < 9; lightbox: glass controls, prev/next, position "i / n", owner "Xoá ảnh" |
| Map | `.map .ppin .on .me .area` | real map (MapLibre, `ui/map/ff-map.js`); pins are glass pills (mono price or "Miễn phí" + marker), selected = paper fill; user = lime dot with two halos; labels mono 10 |
| Mobile bars | `.bar`, `.tabbar .tb .on`, `.dock` | top bar h56; floating glass tab bar inset 12 r20 h64, 5 tabs, active = lime tick; dock = glass bottom bar with price + lime CTA |
| Web layout | `.wrap .nav .cards .ev .sec .split .hide-sm .show-sm` | wrap 1200, gutters 16/32; sticky glass nav h64; cards auto-fill min 260; split main/side (side min 320) |
| App shell | `.shell .side-nav .sn .count .kpi .tbl .tr` | Studio/Console: side nav 240 (becomes a top scroller below 900), table rows h52 |
| Charts | `.bar-track .bar-fill .tip` | 8px tracks; tooltip = glass, flips under the point near the top |

Add a dev-only route (`/kit`, excluded from the sitemap and robots) that renders every component in every state, mirroring `System.dc.html`. Use it for visual review.

---

## 5. Screen map

`canvas.json` groups the boards into pages: Mobile, Hồ sơ (profiles), Web, Studio, Console, Hệ thống.

### Web (fluid, 390 → 1440)

| Board | Route | Notes |
| --- | --- | --- |
| `Web-Home` | `/` | discovery |
| `Web-Event` | `/e/[slug]` (+ `/en`) | keep the server-rendered summary and JSON-LD the route has today (`components/seo-page.tsx`, `summaries.tsx`) |
| `Web-Map` | `/list?view=map` | the map view inside `/list`; `/map` keeps redirecting |
| `Profile-Artist-Web` | `/a/[slug]` (+ `/en`) | artist page (web screen `artist`) |
| `Profile-Org-Web` | `/o/[slug]` (+ `/en`) | organiser page |
| `Profile-Fan-Web` | new, route to confirm (§10) | the signed-in person's own profile; public view depends on §10 |

### App (`/app/*`, phone first; on wide screens keep the existing centred app frame)

| Board | Screen |
| --- | --- |
| `Main` | Explore tab (feed) |
| `App-Onboarding` | first run (genres, location) |
| `App-Event` | event detail inside the app |
| `App-Map` | map in `/app/list` (on the roadmap as "Map view in the app") |
| `App-Ticket` | tickets |
| `App-Live` | live mode at the event |
| `Profile-Fan-App` | "Tôi" tab |
| `Profile-Artist-App`, `Profile-Org-App` | artist and organiser pages inside the app |

### Studio (`/studio/*`)

| Board | Screen |
| --- | --- |
| `Studio-Dashboard` | home |
| `Studio-Wizard` | create / continue an event |
| `Studio-Checkin` | door check-in (phone) |

### Console (`/console/*`)

| Board | Screen |
| --- | --- |
| `Console-Moderation` | review queue |
| `Console-Insights` | stats |

### Not drawn: rebuild with the same parts and rules

`/list` table and grid views, `/c/[slug]` collections, `/saved`, `/about`, `/advertise`, `/stats/[key]`, the SEO landing routes `/vi/[city]` and `/en/[city]`, app plans, chat, recap and resale, Studio attendees, revenue, inbox and announcements, Console verification, reports, featured shelves and audit, and the sign-in card. Take the nearest board's pattern. Keep every capability these screens have today unless this brief says it was removed on purpose.

**Removed on purpose:**

- From the web event page: the "friends interested" row and the separate Q&A tab.
- From the web home: the "Chọn gu của bạn" genre tiles section (the genre chips and the nav "Thể loại" menu cover it).
- From the Studio dashboard: the conversion funnel card (its percentages now sit in the KPI tiles).
- From the Console queue: the three stat cards (one line of counts replaces them).

Group plans stay in the app.

---

## 6. Behaviour, board by board

Data always comes from the API. Where a board shows something the API does not have yet, see §7.

**Shared web nav** (on every web board).

- Glass sticky header h64: wordmark, then Khám phá and Bản đồ links, then a **"Thể loại" dropdown** (families + Miễn phí with live counts).
- On the right: search, "Đăng sự kiện" (light pill, hidden below 900) and the **account avatar dropdown** (name + handle, Hồ sơ của tôi, Vé của tôi n, Đã lưu n, Đăng xuất). Signed out, the avatar becomes "Đăng nhập".
- Only one menu is open at a time. A root-level scrim closes it.

**Web-Home**

- City dropdown: cities come from `/meta/discovery`; cities without events are disabled with "Sắp có". The page date follows the city's timezone.
- The headline follows the time chip: "{Tối nay | Cuối tuần này | 7 ngày tới | 30 ngày tới} có gì chơi?". Chips show counts from the `/events` time facets. Search sits under the headline.
- Hero card = the current featured placement (shelves / featured), never a hard-coded event. When there is none, show the first event.
- List: the title says "{n} sự kiện {time}". Next to it is a **sort dropdown** (Gần nhất / Được quan tâm / Giá thấp trước → API `sort`), with genre chips below (horizontal scroll on phones).
- Cards: art, glass status tag, save toggle, then title, marker + when · venue, price (lime for free), and "n quan tâm".
- Empty state with two recovery actions: clear the genre, or widen to 30 days.
- "Gần đây, tối nay": nearest places + a map teaser that opens the map.
- Email signup only if an endpoint exists; otherwise leave it out.
- FAQ as exclusive `<details>`. One-line footer.

**Web-Event**

- **Hero:**
  - Art with 18+, availability and countdown tags; mono family line; title.
  - Organiser row: links to `/o/…`, verified mark, follow toggle.
  - Date/time row with "Thêm lịch" (.ics). Venue row with "Chỉ đường" (jumps to the venue section).
  - Lime **"Chọn vé · từ {price}"** that scrolls to tickets, plus save and share. Saving updates the "quan tâm" count.
- **Sticky section bar** under the nav: anchor tabs Giới thiệu, Line-up, Vé, Địa điểm (`scroll-margin-top` ≈ 124px), with a small lime "Mua vé" on desktop. The active tab follows scroll.
- **About:** clamp 3 + "Xem thêm", plus fact tags.
- **Line-up:**
  - The headline artist row links to `/a/…` with a bone "Headline" tag; then time · name · stage rows.
  - "Lịch theo sân khấu" accordion with the stage timeline (the headline set is the bone block).
  - The legacy set-times features (picking sets into your plan, clash warnings, reminders) stay. Present them inside this accordion in the new style.
- **Tickets** (sticky side panel on desktop, inline on phones):
  - Tier options with status; quantity stepper (1 → the tier's or API's max).
  - Lime "Mua {n} vé {tier} · {total}", using `FF.money` with the event currency. It goes into the existing purchase flow (FeestFinder checkout or the partner link, as today).
  - Seller and no-fee line. Keep the legacy tier states and copy ("Last tier", price-rise note, refund policy).
- **Venue:** name, address, Chỉ đường, copy address (with "Đã chép" feedback), the "Đi lại & gửi xe" and "Quy định vào cổng" accordions (from event data when present), and a map card.
- **"Cũng của {organiser}":** upcoming events by the same organiser, plus "Xem hồ sơ".

**Web-Map**

- Full-height split. The list column has a place search, a **time dropdown chip** (with counts), "Miễn phí" and "Dưới 5 km" toggles, "{n} sự kiện · gần nhất trước", and rows (art 48, title, marker + when · area, distance + price).
- On the map: zoom, locate-me, glass pins and the selected-event glass card with "Xem chi tiết".
- Selecting a row or a pin selects both.
- Empty state with "Bỏ lọc".
- Follow `CLAUDE.md` for the map: fetch `/events/map` when the view opens and on "search this area" only, never on pan.

**Profiles** (artist, organiser, fan; web and app share the parts).

- **Cover and avatar:**
  - Mosaic cover of genre art. The avatar overlaps the cover and **always sits above it** (`.av.ring`): people are circles, organisers rounded squares.
  - Name + verified mark; mono meta line; family tags.
  - Primary action: Theo dõi (lime) ↔ Đang theo dõi, plus a bell for show alerts (artists) or "Nhắn tin" (organisers).
- **Stats row:** followers, shows/events, cities or rating, badges.
- **Artist and organiser tabs:** Artist: Sắp diễn / Đã diễn, as date-block rows; the next show uses the bone block. Organiser: Sắp tới / Đã tổ chức (cards, then year groups).
- **Bio:** clamp 2–3 + "Xem thêm"; listen links for artists.
- **Moments:** 3×3 grid + lightbox (§7).
- **Huy hiệu:** the earned grid only, selecting one opens a detail card (date earned, rarity "x% {role} có", description); then a collapsed "Đang làm (n)" with emblem, progress bar and rule.
- **Secondary sections** fold into `<details>`: past shows list, frequent venues, business information (verified mark, tax ID, website, refund rule), settings.
- **Fan profile:**
  - Stats Đã đi / Sắp đi / Huy hiệu.
  - "Sắp đi" = bone ticket cards linking to the ticket and the event.
  - **Hộ chiếu** (passport): one stamp per attended event, with family filter chips that dim the rest; phone shows 8 + "Xem thêm n".
  - "Gu của bạn" bar (attended events by family); "Đang theo dõi"; "Cài đặt" (show alerts, public profile, city, language, download my data).
- Owner-only controls (adding or removing moments, settings) appear only to the owner. The boards have an `ownerView` prop to preview both.

**Main (app Explore)**

- City dropdown in the bar, then the **inline time dropdown in the title** ("Cuối tuần này ▾", items with counts).
- Genre chips; a featured card (featured placement when it matches the filter); "Gần bạn · n" rows; "Xem bản đồ"; an empty state with "Xoá bộ lọc".
- Tab bar: Khám phá · Bản đồ · Đã lưu · Vé · Tôi.

**App-Event**

- Art header with glass back/share/save.
- Organiser, date ("Thêm lịch") and venue ("Chỉ đường") rows.
- About clamp 3. Line-up: the headline row, then a "Lịch diễn đầy đủ" accordion.
- Tier options. A glass dock with the price and a lime "Mua vé".

**App-Ticket, App-Live, App-Map, App-Onboarding** are restyles of the existing screens. Keep their behaviour, including:

- the bone ticket card with QR and the doors countdown;
- live mode's now/next stage cards with "nhắc trước 10 phút" and the walking-distance map;
- onboarding's genre picks with "Dùng vị trí của tôi" / "Chọn thành phố khác".

**Studio-Dashboard**

- **Side nav:** the organiser identity links to its public page, then a lime "Sự kiện mới", then Bảng điều khiển, Người tham dự, Check-in, Doanh thu, Hộp thư (count).
- **Header:** the **event title is an inline dropdown** (every live event, with dates). Status, a range control (7 / 14 / 30 ngày) and "Xem trang".
- **KPI tiles:** views (Δ vs previous period), saves (% of views), buy or register clicks (% of views), and a bone tile with sold or registered / capacity and a bar.
- **Charts:** "Lượt xem mỗi ngày" line chart with a hover tooltip; a pace card ("Cần mỗi ngày" vs "Đang đạt mỗi ngày", Đúng nhịp / Chậm nhịp; when slow, a one-line nudge to boost the listing).
- **Tables:** clicking an event row selects that event for the whole page. Draft rows show "Tiếp tục", which opens the wizard on that draft. Plus a traffic-sources card.
- Free events say "đăng ký" where paid ones say "vé".

**Studio-Wizard**

- **One page, four accordion steps:**
  1. Cơ bản: name with a 60-character count, family chips, optional description, optional cover.
  2. Thời gian & địa điểm: date, doors, end, venue, with recent-venue chips.
  3. Vé: Bán vé ↔ Miễn phí. Paid: tier rows (name, price) + "Thêm hạng vé" + the ticket link. Free: "Cần đăng ký trước" switch.
  4. Xem lại & gửi duyệt: missing items as links back to their step, a confirmation checkbox, and lime "Gửi duyệt", which is disabled until valid. After sending, a success card.
- **Step headers:** each shows a numbered dot (current = paper, done = green check), and when collapsed a one-line summary of its content.
- "x / 3 phần bắt buộc". A sticky live preview card on the right. The draft autosaves, so closing keeps it.
- **Keep the existing featured-placement upsell.** Offer it in step 4 or on the success card, not as an extra step. Keep any other required field the API enforces today.

**Studio-Checkin**

- Gate segmented control. A QR viewfinder with the lime scan line, plus a manual code field.
- A full-width result banner: green Hợp lệ (tier · holder · ticket i of n), amber Đã dùng (when and where), red Không hợp lệ (reason). Each has an icon and words.
- The live "x / capacity đã vào" counter with rate, and the recent scans list.

**Console-Moderation**

- **Queue:** "Hàng chờ" with counts; filter chips with counts (Tất cả / Sắp quá mốc / Bị gắn cờ). Rows show art, title, organiser · age, the SLA status and a "Gắn cờ" status.
- **Detail:**
  - Family · submitted ago; title; organiser + verification status.
  - **"Từ chối ▾" and "Yêu cầu sửa ▾" are reason dropdowns.** Picking a reason acts. Lime "Duyệt".
  - After any action, a status line "Đã duyệt / Đã từ chối / Đã yêu cầu sửa · {title} · {reason}" with **"Hoàn tác"** (§10), and the next item opens.
- **Content checks:**
  - A flag card when flagged; the feed preview card.
  - Automatic checks show only the failing ones, with the passing ones folded under "{n} mục đạt"; key facts below.
- Reasons map to `moderation_decisions`.

**Console-Insights:** KPIs, a stacked weekly chart by family (fixed order), top areas, and the audit log folded in an accordion (hash-chain status in the summary). Keep the Console tab set the boards show: Kiểm duyệt · Xác minh nhà tổ chức · Báo cáo · Kệ nổi bật · Số liệu · Nhật ký.

---

## 7. New features that need API work

Build the UI so a section **hides itself when its data is absent**. Never fill a section with sample data. Each item needs a numbered migration (the next is `017_*.sql`; never edit a shipped one), routes and services in the existing style (zod via `parse()`, `AppError`, positional SQL), and tests in `festfinder-backend/test/` (plus e2e). Write actions need the proven phone that the sign-in rules require.

| Feature | Where | What it needs |
| --- | --- | --- |
| **Moments** (≤ 9 images per profile, lightbox) | all profiles | Storage of an ordered list per user/artist/organiser with caption and date. **The boards add images by URL, but the CSP will block arbitrary image hosts.** Decide in §10: upload to the existing file storage (`/files`, `S3_*`), or import a pasted link server-side through `services/fetchpage.ts` and store the copy. Reporting and removal by moderators. |
| **Badges** (milestones) | all profiles | A badge catalogue (code, role, family, shape or number, rule, threshold) and awards (who, badge, earned at), computed by a job from existing tables (`scans`, `tickets`, `saves`, `hypes`, `*_follows`, events, sold-out tiers, shares). Progress for unearned badges, rarity = share of the role that holds it, a "new" flag. The boards define a starter catalogue: fan — Lần đầu, Đủ 4 gu, Hộ chiếu 10/25, Cú đêm, Mở cửa, Thổ địa, Fan cứng, Lan toả; artist — Ra mắt, 10K/50K theo dõi, 25/50 show, Lưu diễn, Khép đêm, Cháy vé, Được fan chọn; organiser — Đã xác minh, 50/100 sự kiện, 10K/25K theo dõi, Cháy vé ×5, Đa thể loại, Khách hài lòng, Phản hồi nhanh. The rules text is in each profile board's `B` array. |
| **Passport** | fan profile | Attended events = scanned tickets (`scans`). Probably no new table; an endpoint grouping by family. |
| **Fan profile page** | web + app | Own profile (stats, upcoming, passport, badges, follows, settings). A public page only if §10 says so, with a "Hồ sơ công khai" setting that defaults to off. |
| **Artist stats and pages** | `/a/[slug]` | Followers (`artist_follows`), show counts, cities, "most played with". The roadmap lists an artist entity (phase 7b) as postponed, so check what `/a/[slug]` has today and show only what exists. |
| **Organiser rating, response time** | `/o/[slug]` | Only if a ratings or response-time source exists. Otherwise drop the stat. |
| **Studio metrics** | dashboard | Views, saves, clicks per day per event, traffic sources, pacing. Reuse what the organiser API returns today and add what is missing. |
| **Moderation reasons and undo** | console | Reason codes on decisions. Undo: either hold the decision for a few seconds client-side before sending, or add a revert endpoint that writes to the audit log (§10). |

---

## 8. Rules that carry over (from `CLAUDE.md`)

- **Copy.** `{en, vi}` everywhere; Vietnamese is the default on the web. No explanatory copy beyond format hints.
- **Places, time, money.** Cities come from `lib/places.ts` and `/meta/discovery`, never hard-coded. Event instants use the city's timezone. Prices are whole units of `events.currency`, shown with `FF.money` / `formatMoney`. FeestFinder checkout and tiers are VND only.
- **CSP.** `connect-src 'self'`; no font CDN; images only from allowed origins. Self-host fonts and icons.
- **Icons.** Stay with Phosphor. The design's 1.6 px line icons match Phosphor **Regular** weight (`@phosphor-icons/react`, imported per icon). The legacy font subset (`subset-icons.py`, `test/icons.test.ts`) only governs the template fronts.
- **Sign-in, validation, errors, SQL.** As written in `CLAUDE.md`.
- **No demo data in production, ever.** Fixtures belong to tests.
- **Docs to update with the work:**
  - Root `CLAUDE.md`: the screen-editing rule and the "Look" line, which are no longer true for the Next front.
  - `festfinder-web/README.md`: structure and scripts.
  - `docs/CURRENT_ARCHITECTURE.md`: the Screens and Stack tables.
  - `docs/FEESTFINDER_ROADMAP.md`: add a "Kính đêm" section and log each phase.

---

## 9. Plan and checks

| Phase | Work | Done when |
| --- | --- | --- |
| 0 | Read `CLAUDE.md`, `festfinder-web/README.md`, `AGENTS.md` + the Next 16 docs, this folder, and each surface's `logic.js`. Write `docs/KINH_DEM_PLAN.md`: component list, route-by-route cutover order, how compiled and new routes coexist, test plan, and the §10 questions. | The owner has answered §10 |
| 1 | Tailwind + tokens + fonts + icons; the `kd` component library; `/kit` | `/kit` matches `System.dc.html`; `npm run typecheck` and `npm run build` pass; legacy routes unchanged |
| 2 | Web: nav, `/`, `/e/[slug]`, `/list` + map, `/o/[slug]`, `/a/[slug]` | Each route at parity with today's behaviour, SSR summaries and JSON-LD intact, matching its board at 390 / 760 / 1440 |
| 3 | App: Explore, event, map, tickets, live, onboarding, profile tab; then the undrawn app screens | As above at 390; the PWA still installs and its service worker still registers |
| 4 | Studio, then Console | As above |
| 5 | §7 features, each with migration, API, tests, UI | Tests green; the sections appear only with real data |
| 6 | Undrawn routes, clean-up, docs | Every Next route is on the new UI, the compile step can be retired from Next (keep it if the owner keeps the API front) |

**Checks for every phase:**

- `npm run typecheck` and `npm run build` in `festfinder-web`. `npm run typecheck` and `npm test` in `festfinder-backend` when the API changed.
- `npm run test:screens:next`. The shared `e2e/screens.spec.ts` was written for the old screens, so move the Next-only expectations for rebuilt routes into `e2e/next/` and keep the API-front specs passing untouched.
- Screenshots of each rebuilt route at 390, 760 and 1440 next to its board. Look for spacing, type sizes, colours, and the one-lime-action rule.
- Keyboard pass (Tab order, Escape on menus, Enter/Space on toggles), reduced motion, and 200% zoom on a phone width.

---

## 10. Decisions to confirm with the owner before building them

1. **Production cutover.** When, if ever, production moves from the API-served front to Next, and whether the API front keeps the old look meanwhile. Until answered, change no deployment setting.
2. **Fan profile.** The URL (e.g. `/u/[handle]`), whether it is public, and the default of "Hồ sơ công khai".
3. **Moments.** Upload vs. pasted link (CSP), moderation and reporting, and whether artists and organisers get them on day one.
4. **Badges.** Approve the starter catalogue and rules (§7), and whether badges show on public artist and organiser pages.
5. **Organiser rating and response time.** Real sources, or drop those stats.
6. **Console undo.** A client-side hold vs. a revert endpoint.
7. **Icons.** Phosphor Regular in the new UI (recommended) vs. keeping Bold.
8. **Featured placement.** Its position in the new wizard (step 4 vs. the success card).
