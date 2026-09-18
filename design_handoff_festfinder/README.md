# Handoff: FestFinder — event discovery platform (4 surfaces)

## Overview

FestFinder is an event-discovery platform for Ho Chi Minh City: festivals, concerts, night markets, book fairs. Four surfaces are designed here and ship as one product:

| Surface | File | Audience |
| --- | --- | --- |
| **Web** | `design/FestFinder Web.dc.html` | public discovery site, SEO landing pages, event detail, organiser profiles |
| **App** | `design/FestFinder App.dc.html` | attendee mobile app (iOS/Android), tickets, on-site mode, group plans |
| **Organizer** | `design/FestFinder Organizer.dc.html` | organiser back office: list an event, analytics, attendees, announcements, check-in, revenue |
| **Admin** | `design/FestFinder Admin.dc.html` | internal moderation, organiser verification, reports, featured shelves, audit |

Every surface is fully bilingual (English / Vietnamese) with a runtime language toggle. Vietnamese is the primary market: number formatting, currency (`₫`), payment rails (Zalo, Momo, ZaloPay, VietQR) and district naming are all VN-first.

## About the design files

The files in `design/` are **design references created in HTML** — interactive prototypes that show intended look, copy and behaviour. They are **not production code to copy**.

Your task is to **recreate these designs in the target codebase's own environment** (React/Next, Vue, SwiftUI, Jetpack Compose, etc.) using its established patterns, component library, routing and data layer. If no codebase exists yet, pick the appropriate stack per surface — a sensible default would be Next.js (App Router) for Web + Organizer + Admin, and React Native/Expo or native for App — and implement there.

### How to read the prototype files

Each `.dc.html` is a single self-contained file with three parts:

1. `<helmet>` — fonts (Google Fonts: Archivo, Manrope), the Phosphor icon CSS, body resets, keyframes.
2. A markup template using a small templating dialect: `{{ value }}` holes, `<sc-if value="{{ flag }}">`, `<sc-for list="{{ rows }}" as="row">`. Styling is **inline `style=""` only** (plus `style-hover` / `style-active` pseudo-state attributes).
3. A `class Component extends DCLogic` script at the bottom. `state = { … }` holds all prototype state; `renderVals()` returns every value the template consumes — including click handlers as closures.

So: **all copy, colours, sizing and layout are in the template; all logic, data and bilingual strings are in the script.** The bilingual dictionaries are the `S` / `S2` / `L()` objects (`{en:'…', vi:'…'}` pairs) — lift these straight into your i18n files. Open any file in a browser to click through it.

`design/support.js` is the prototype runtime that interprets the template. **Do not port it** — it exists only so the HTML runs standalone.

## Fidelity

**High fidelity.** Colours, typography, spacing, radii, copy (both languages) and interaction states are final and should be recreated pixel-accurately. The layouts are production-intent, not wireframes.

Two caveats:
- Data is mock (fixed arrays in `state`). Wire to real APIs.
- The map surfaces (Web map, App map, App on-site map, Organizer venue pin) are **stylised fake maps** — CSS grids with absolutely positioned pins. In production, replace with a real map SDK (Mapbox GL / Google Maps / MapLibre) keeping the same pin, cluster-avoidance and card-overlay design.

---

## Design tokens

Identical across all four surfaces.

### Colour

| Token | Hex | Use |
| --- | --- | --- |
| `bg` | `#06080D` | page ground |
| `surface-1` | `#0A0E1A` | inputs, sunken wells, app ground |
| `surface-2` | `#121826` | cards (opaque) |
| `surface-glass` | `rgba(18,24,38,.62)` – `.75` | cards over the ambient glow (with `backdrop-filter: blur(18–26px) saturate(1.4)`) |
| `surface-3` | `#1A2233` | hover ground, chip ground |
| `border` | `#262F44` | default 1px border |
| `border-strong` | `#33405C` | modal / drawer border |
| `border-soft` | `#1A2233`, `#1C2437`, `#1F2739` | internal row rules |
| `text` | `#F3F6FC` | primary text |
| `text-2` | `#C3CBDC` | body copy |
| `text-3` | `#8891A8` | secondary |
| `text-4` | `#7C859C` / `#7C87A1` | labels, meta |
| `text-disabled` | `#39455F` | empty-state glyphs |
| `accent` (cyan) | `#2AC4E8` | primary action, links, active state |
| `accent-hi` | `#7FE0F5` | accent text on dark, hover |
| `violet` | `#8C6BFF` | secondary accent (saves, audience, sponsored) |
| `violet-hi` | `#B9A8FF` / `#CFC6FF` / `#C9BCFF` | violet text tints |
| `violet-ground` | `rgba(36,28,64,.5)` + border `#3A2F6B` | violet info panels |
| `green` | `#2E9E5B`, text `#6FD79B` / `#7BE3A6` | free / valid / paid / success |
| `amber` | `#FF8A3D`, text `#FFB35C` / `#FFD35C` | warnings, "last tier", SLA due-soon, unread dot |
| `red` | `#E04A4A`, text `#FF9A9A` / `#FF8C8C` | reject, invalid, SLA breach |
| `blue` | `#4EA1FF` | Facebook / Zalo / user location pin / VietQR |
| `pink` | `#FF6FA5` | Instagram / Momo |
| `whatsapp` | `#25D366` | WhatsApp |
| `ink-on-accent` | `#0A0E1A` / `#06080D` | text on accent fills |

Alpha tints follow one rule: `rgba(<accent rgb>, .06–.16)` for fills, `.3–.5` for borders. Event artwork is gradient pairs, e.g. `linear-gradient(135deg,#8C6BFF,#2AC4E8)`, `linear-gradient(135deg,#FFB35C,#FF8A3D)`.

Ambient depth: two fixed blurred radial blobs behind the page —
`radial-gradient(circle, rgba(140,107,255,.15), transparent 66%)` top-right and `rgba(42,196,232,.13)` bottom-left, `600×600`, `filter: blur(74–78px)`, drifting on a 26–32s `ffDrift` keyframe, `pointer-events:none; z-index:0`.

### Type

- Display / headings: **Archivo** 900, `text-transform: uppercase`, `line-height: 1.04–1.18`, `letter-spacing: -.02em` on the largest sizes.
- UI / body: **Manrope** 400–800. `font-variant-numeric: tabular-nums` on `body`.
- Mono (codes, refs, hashes, URLs): `ui-monospace, monospace`.

Scale actually used (px): display `clamp(24–46)` · h2 `19–23` · card title `13.5–16` · body `12.5–14.5` · meta `11–12` · label `10–11` uppercase with `letter-spacing: .09–.12em` · micro `9–9.5`. Weights: 900 display, 800 titles/labels/buttons, 700 body-strong, 600 body, 500 long-form paragraphs.

### Spacing, radius, elevation, motion

- Spacing: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 34 px. Page gutters 28px (web/desktop), 20px (app), 18–20px inside panels.
- Radius: `999px` pills · `8–12px` inputs & small controls · `14–16px` medium cards/buttons · `20px` panels · `24px` hero/modal/drawer · `50%` avatars.
- Shadows: `0 10–14px 26–34px rgba(42,196,232,.22–.26)` on accent buttons · `0 12–22px 30–52px rgba(0,0,0,.4–.6)` on cards/sheets · `0 30–34px 70–80px rgba(0,0,0,.6–.7)` on modals · `-34px 0 74px rgba(0,0,0,.6)` on right drawers.
- Transitions: `all .15s` on interactive chrome, `transform .15s` on buttons (`translateY(-1px)` hover, `translateY(1px)` active), `.18–.24s` on toggles/panels.
- Keyframes (in every file's `<helmet>`): `ffRise` (10px up + fade, panels) · `ffUp` (full-screen app panels, `cubic-bezier(.2,.8,.2,1)`) · `ffSheet` (bottom sheets) · `ffSlideIn` (right drawers) · `ffFade` (backdrops) · `ffPulse` (live dot, user location) · `ffScan` (QR scan line) · `ffDrift` (ambient blobs) · `ffPush` (push-notification toast).

### Icons

**Phosphor** (`@phosphor-icons/web@2.1.1`), `bold` and `fill` weights only, as `<i class="ph-bold ph-…">` / `<i class="ph-fill ph-…">`. Sizes 10–34px, most commonly 13–17px.

### Accessibility rules held in the designs

- Body text ≥ 4.5:1 on its ground; large/heading text ≥ 3:1. Accent text on dark uses `#7FE0F5`, not `#2AC4E8`.
- Every interactive element has an explicit hover state; app hit targets ≥ 44px.
- Toggle switches are 36–42×20–24px with an 16–18px knob; state is carried by track colour **and** knob position.
- Status is never colour-only — every status pill pairs colour with a word and usually an icon.

---

## Note on the bound Nocturne design system

`design/_ds/nocturne-…/` is included because the project has the **Nocturne** design system bound (`styles.css` + `_ds_bundle.js` + its `readme.md`). The four FestFinder prototypes **predate that binding and do not consume it** — they carry the FestFinder dark palette documented above (near-black ground, cyan/violet accents, Archivo + Manrope).

Both are dark, low-chroma systems with 8–12px radii, so they are compatible in spirit but not identical in token values. Decide explicitly before you build:

- **Keep FestFinder's tokens** (recommended for fidelity to these mocks) — use the table above as the source of truth, and treat Nocturne as reference only.
- **Migrate to Nocturne** — map `bg → --color-bg`, `text → --color-text`, `accent → --color-accent` (#9184d9 blurple, not cyan), surfaces/borders to the `--color-neutral-*` ramp, and switch type to Inter at weight 500. This changes the brand's accent hue and flattens the two-accent (cyan + violet) system to one; expect to re-tune every status colour.

Do not mix the two half-way.

---

## Surface 1 — Web (`FestFinder Web.dc.html`)

Prototype entry props: `screen` (`Explore` | `Map` | `SEO landing`), `language`, `signedIn`.

### Screens

**1. Explore** (default) — max-width 1440, 28px gutters.
- Header (sticky, `z-40`, `rgba(10,14,26,.74)` + `blur(26px) saturate(1.6)`, 1px bottom border): logo (127×35) · search input · city selector · "Advertise" · "List your event" on one row; **language toggle + profile at the far right**.
- Hero row: kicker (11px/800/.12em uppercase cyan) + `h1` `clamp(32–46px)` Archivo 900 uppercase with the second half in cyan; right side holds three clickable stat cards (`min-width:126px`, hover `translateY(-2px)`) that open the stat views.
- Body grid `230px | 1fr`, gap 26. Left is a sticky filter rail (top 96px): **When** (radio list with counts), **Genre** (chips), price, area. Right is the event grid.
- Event cards: 16px radius, gradient art header with a `linear-gradient(to top, rgba(18,24,38,.9), transparent 62%)` scrim, genre pill bottom-left, then title (Archivo 900 15.5px) / when / where / price. Hover `translateY(-4px)` + border `#3B4A6B`.
- Skeletons while loading (6 cards), empty state, and a "load more" that steps `limit` by 6.

**2. Map** — grid `380px | 1fr`, gap 22.
- **New: filter row above the split** — genre chips (All / EDM / Festival / Indie / Food) + a "Free only" chip; when an area search is active, a "Whole city" reset pill appears at the right.
- Left: result count, optional "friends going" filter, then list cards (74×74 art + title/when/where/price). Selected card: `rgba(42,196,232,.1)` ground, cyan border.
- Right: sticky 660px-tall fake map, radius 24, `#0C1120` with a 64px grid, radial glow, three rotated "road" bands, pulsing user location dot at 46%/52%.
- Pins: price pill (`padding:7px 12px`, radius 12, blur 10) + 1.5px stem + 7px dot; selected pin inverts to a cyan fill. Friend avatars (22px, `-7px` overlap) sit above a pin when friends are going, with a `+N` chip. Pins de-collide by nudging `+5.5%/-4.5%` up to 12 times.
- **New: map viewport controls** — zoom `+` / `−` / recenter stack top-right (34px, radius 11, `rgba(10,14,26,.86)` + blur); a 3×3 pan pad top-left (26px cells) with the current zoom (`1.4×`) in the centre cell. Any pan/zoom sets `mapMoved`, which reveals a **"Search this area"** pill centred at the top of the map (cyan fill, `0 12px 30px rgba(42,196,232,.35)`). Clicking it snapshots the viewport into `mapLock`; the result list then only contains events whose transformed pin lies inside the frame (`x` 2–98%, `y` 6–98%). Recenter clears the lock.
- Selected-event card: bottom-left overlay (max 420px, radius 20, `rgba(18,24,38,.9)` + blur 26): art, title, when/where, close, buy CTA, "I'm going" toggle, "Invite friends", and a friends-going list with per-friend going/interested icon and chat affordance.

**3. Event detail** — max-width 1180. Hero band `clamp(200–320px)` with gradient art, genre + badge pills, `h1` `clamp(26–44px)`, date and venue lines. Body grid `1fr | 336px`.

Main column, in order:
- Facts grid (auto-fit, min 168px): date, doors, venue, distance, price, age.
- **About** card.
- **Lineup** — *new: each artist chip is a follow toggle.* Idle chip `rgba(10,14,26,.6)` + `#33405C` border + `ph-plus`; followed chip `rgba(42,196,232,.12)` + cyan border + `ph-bell-ringing`. Header carries the hint "Tap an artist to follow them". When ≥1 is followed, a cyan info strip appears: "Following N of this lineup. We will tell you when any of them announce a show in Ho Chi Minh City."
- **New: Set times (clash-finder)** — only for events with timetable data (`TT` map: `hozo` = 3 days × 3 stages, `ravo` = 1 night × 2 stages). Day chips top-right. Horizontally scrollable grid, `min-width:660px`: a 104px stage-label column + a proportional track per stage (52px tall, radius 12, `rgba(10,14,26,.55)`), hour grid lines every 60min, 2-hour tick labels above. Each set is an absolutely positioned block (`left`/`width` as % of the day window) showing artist + `HH:MM – HH:MM`. Tap toggles it into your plan: picked = cyan tint + cyan border + check icon; picked **and overlapping another pick** = amber tint + amber border + warning icon. Footer: "N in your plan", Clear, and a "Remind me 15 min before" CTA. When clashes exist, an amber panel lists each one: "*{a}* and *{b}* overlap by *{m}* minutes".
- **New: Tickets (tier ladder)** — only for paid events with tier data. Rows: tier name + state pill (On sale / **Last tier** / Sold out / Not yet open), a note (for the urgent tier the note is the price-rise line, e.g. "Price rises to 1,450,000₫ on 18 Sep"), price, "N left", and a per-row CTA (Buy / Notify me / Sold out). Sold-out rows drop to `.62` opacity. A header urgency pill repeats the urgent tier's message. Footer: the **refund policy** line.
- Getting there (fake mini-map + "Open in Maps"), Similar events (3 cards).

Sidebar: price card with big Archivo price, primary CTA (Get tickets / Free entry / Sold out), Save + Share, ticket note · friends-going card · organiser card (44px mark, name, `ph-seal-check` verified icon, follower count, caret) **plus a new "Follow this organiser" button** with note "You hear about their next listing before it reaches the feed" · **new "Report this listing"** row (amber on hover).

**4. Organiser profile** — 84px mark, name + verified pill, bio, three stats (events / followers / since), Follow button (state-aware), upcoming grid, past events list at `.66` opacity.

**5. Stat views** — "free this weekend", "weekend events", "venues" drill-downs with chips.

**6. About / SEO landing** — a programmatic `/{locale}/{city}/{genre}/{timeframe}` page: kicker, H1, intro, event list, FAQ block (question/answer pairs), "Related searches" internal links, and a dev-notes panel documenting the route, ISR revalidation (900s), `generateMetadata()`, canonical + `hreflang vi/en`. **Port these notes as real Next.js metadata.**

### Modals / overlays
- Sign-up / log-in gate (triggered by Advertise, List your event, Save, Get tickets): method picker → Zalo/WhatsApp phone → 6-digit OTP; Facebook/Instagram OAuth redirect → permission confirm; Email → password.
- Profile menu: name, verified-via line, Edit profile, **Connect with friends** (Facebook/Instagram/Zalo/WhatsApp, each connect/disconnect independently), Saved count, **new Notifications row** (shows "N on"), Sign out.
- **New: Notifications matrix modal** — 5 rows (saved-event reminders · last tier & price changes · artists and organisers you follow · friend activity · weekly picks) × 3 columns (Push / Zalo / Email). Each cell is a 36px tap target toggling a filled check. Footer: quiet-hours rule ("Nothing between 23:00 and 08:00 except changes to an event starting today").
- **New: Report listing modal** — 6 reason codes as a 2-up grid (details wrong / cancelled / scam / duplicate / offensive / price mismatch), optional free-text, amber "Send report" CTA, and the policy line "Listings with two or more reports are pulled from the feed while we check."
- Advertise form (brand, category, email, budget, placements, message, rate card), friend sheet, invite sheet, chat.
- Toast: centred pill, `bottom:80px`, `rgba(26,34,51,.95)` + blur.

---

## Surface 2 — App (`FestFinder App.dc.html`)

Prototype entry props: `startScreen` (`Explore feed` | onboarding), `language`, `loadSpeed`, `hideUnavailable`, `signedIn`. Rendered inside a phone frame; all panels are `position:absolute; inset:0` layers over a 4-tab shell.

Bottom nav: **Explore · Saved · Map · Profile** (icon + label, active `#2AC4E8`, idle `#7C859C`).

### Explore tab
Location chip, search, date/genre/artist filter sheets (calendar month grid, artist search), Smart Alert card (violet, toggle + "N matches"), event cards, sponsored cards (dismissible), hyped rail.

### Event detail (full-screen panel)
Hero art, title, when/where, facts, lineup, about, **organiser card — now with a `ph-seal-check` verified icon and a wired Follow chip** (Follow ↔ Following, state from `orgFollow`), links list, **new "Report this listing" row** → bottom sheet with 5 reason codes (single-select with a check dot), amber "Send report", note "We come back to you in the app, usually within a day."
Sticky bottom CTA: Get tickets / Free entry + directions / Sold out / Ended.

### Checkout sheet
Event summary, quantity stepper, line items (qty × unit, fee, total), "Pay now" with lock icon, pay note, **new refund-policy line** under a hairline rule.

### Tickets panel
- Header: title, subtitle, **new connection pill** — `Online` (green, `ph-cloud-check`) / `Offline` (amber, `ph-cloud-slash`); tapping simulates signal loss.
- **New: offline banner** when offline — amber panel: "No signal. Your tickets, saved events and set times are on the device — everything here still works."
- Ticket card: 24px radius, 8px gradient art strip, title/when/venue, status pill (Valid / Used), a white `#F3F6FC` QR block (13×13 cell matrix, 6px cells) with code + quantity, "Check in" CTA.
- **New: wallet passes** — two buttons: "Apple Wallet" (white fill, `ph-apple-logo`) and "Google Wallet" (outlined, `ph-google-logo`). Toast: "Pass added · it opens from the lock screen at the gate."
- **New: offline-ready line** per ticket — green "Stored on this device · scans with no signal", switching to amber "Working offline · this code still scans at the gate".
- After check-in: "Live mode" + "Rate it" buttons, and the bestie-light prompt.

### Live / on-site mode (full-screen)
- Header: pulsing red dot + "Live" + event name.
- **Now playing** card (cyan→violet gradient tint): artist in Archivo 25px, stage · time, progress bar, "minutes left", and "Next · time · artist".
- **Set list** per stage with stage tabs; rows carry state chips (played / now / next) and a **bell reminder toggle** per upcoming set ("Reminded · 21:30").
- **Site map** — 250px, stage/water/toilet/exit/food zones as absolutely positioned labelled chips. **New: friend pins** — 28px avatar circles with a 2px `#0A0E1A` ring and a name chip under each, positioned near the zone that friend is at; tapping waves. A bottom-left counter reads "N friends on the site".
- Friends list (avatar, name, "at Stage X", Wave), meet-spot card + "Send my location".
- Sponsored card (dismissible).
- **New: offline strip is now live** — text switches to "No signal. Set times and the site map are cached; friend positions resume when you reconnect." with an inline connection toggle.

### Group plan panel (`Go together`)
Tabs **Group** / **Chat**.
- Group: member list with going/waiting status pills · meet-spot picker (radio rows with tick) · **Split the cost**: total, per-head, "N of M paid", per-person rows with a bell reminder and a Paid/Unpaid toggle.
- **New: payment request block** — appears when anyone still owes. Headline "N still owe you {amount}", hint "Send one request and everyone pays into the same reference, so you can see who settled", then three method tiles: **VietQR** (blue `ph-qr-code`), **Momo** (pink `ph-wallet`), **ZaloPay** (cyan `ph-chat-circle-dots`).
- **New: request sheet** — method icon + "Request by {method}", "N people · {amount} each", a white QR panel with the per-head amount in Archivo 22px, the payee line ("Nguyễn Minh · Vietcombank •••• 8842") and a reference (`FF-XXXX-4P`). Primary "Send request in group chat" (posts "Ticket money: {v} each. QR is in the chat, reference {r}." into the thread and switches to the Chat tab), secondary "Copy the transfer details", note "The QR carries the amount and the reference. Nothing leaves this group."
- Chat: bubbles (me = cyan fill, radius `16 16 5 16`; others = `rgba(26,34,51,.85)`, radius `16 16 16 5`, name above), input pill + circular send.

### Recap (post-event)
132px art header, 5-star rating (30px, `#FFD35C`), aspect chips (sound / crowd / value / organisation / queues / food), 3 photo slots (dashed, file picker), "Your night" stats, "next from this organiser" card, Submit.

### Profile tab
Signed-out CTA / signed-in header, interests chips, then rows: My tickets · Edit profile · Hyped · Following · **new Notifications** · List your event (links to the Organizer surface). Plus **Connect with friends** (Zalo / WhatsApp / Facebook / Instagram, multi-connect with OTP or OAuth-return confirm).
- **New: Notifications panel** — matrix of 5 rows (saved reminders · last tier & price · set reminders on the night · friend activity · organisers you follow) × Push / Zalo / Email, header count "Đang bật N kênh", quiet-hours note.

### Other panels
Onboarding (location permission), auth flow (method → OTP → done), Smart Alert editor (genres, artists, orgs, areas, price cap), Saved/Hyped panels, Organisers panel (followed + discover), notification centre, push toast (`ffPush`), bestie-light splash, toast.

---

## Surface 3 — Organizer (`FestFinder Organizer.dc.html`)

Prototype entry props: `signedIn`, `screen`, `language`. Sign-in gate first (email + password, error states).

**Header** (sticky): logo · mode badge · language · notification bell with unread count · account chip (logo/initials, name, pencil → business profile modal) · sign out.
**New: screen nav row** directly under the header — pill tabs: Dashboard · List an event · **Attendees** · **Announce** · Check-in · Promos · Revenue · Inbox (with an amber dot when the inbox has unread). Active pill = cyan tint + cyan border.

### Wizard — "List your event" (4 steps)
Step chips across the top (number bubble, label, 3px progress bar). Steps: **1** name, genre chips, description (with character counter), logo upload, 1600×900 cover upload (both drag-and-drop) · **2** date, time, venue autocomplete (4 known venues, selected row ticked), geocoding note · **3** entry mode (free / paid / donation), price + ticket URL, event URL + brand URL, age chips, lineup tag input · **4** review rows (label / value / Edit) with a ready/missing banner and the moderation note.

Sticky sidebar: **live card preview** exactly as the event will appear in Explore (art, genre pill, logo + brand host, title, when/where, price, heart).
**New: Listing quality card** — score /100 with a coloured band (Strong ≥85 green · Passable ≥60 amber · At risk red), a progress bar, a verdict sentence ("Listings like this clear review within an hour and qualify for the Trending shelf"), then nine weighted checks: name ≥8 chars (+10) · genre (+8) · description ≥80 chars (+14) · logo (+10) · cover image (+20) · venue resolves to a pin (+14) · price + working ticket link (+12) · ≥3 artists (+8) · own event page (+4). Failing rows show *why it matters* and are tappable — tapping jumps the wizard to that step.

### Dashboard
Range switch (7d / 30d / all), Export CSV, New event. Four KPI cards (views / saves / ticket clicks / conversion). Event table: date block, title + status pill (Live / In review / Draft), meta, views / saves / clicks columns, and a "Performance" button opening the **performance drawer**: sold vs capacity with a verdict pill, days left / need per day / pace, projection, **funnel** (views → saves → ticket clicks → sold with per-step conversion), 14-day trend bars, traffic sources, per-tier progress with sold-out flags, vs-last-edition comparison, and Copy link / Export CSV / Boost actions. Sidebar: audience breakdown, suggested next steps.

### Attendees (new)
Kicker/title/sub, Export CSV, "Message all" (→ Announce). Four KPIs (tickets sold / checked in / not yet in / refunded). Table toolbar: search (name, phone or order code) + filter pills with counts (All / Checked in / Not in / VIP / Refunded). Columns: guest (avatar, name, phone) · order (code, purchase channel + check-in time) · tier (GA / VIP / Guest) · status pill (Inside / Not in / Refunded) · **Resend** action (turns the status to "Resent"; refunded tickets refuse with a toast). Footer: "Showing the first 10 of 2,847 tickets · the CSV exports all of them" + the privacy line "Phone numbers are visible to the account owner and gate leads only".

### Announce (new)
- **Audience** (4 tiles, single-select): everyone who saved (5,842) · ticket holders (2,847) · VIP holders only (412) · past attendees (9,140).
- **Channels** (multi-select tiles with opt-in rates): in-app push 71% · Zalo 83% · Email 44%.
- **Message**: subject + body with a `n / 320` counter (amber past 240, red past 320) and three template chips (Lineup drop / Getting there / Last call) that fill both fields.
- **When**: Send now / Schedule (+ inline date and time inputs).
- Send button (disabled-looking grey until subject, body and ≥1 channel exist), with the rule "One announcement per event per 24 hours. Recipients can switch them off at any time."
- **Estimated reach** sidebar: union reach in Archivo 34px, computed as `audience × (1 − Π(1 − rate))`, per-channel breakdown, and the note "Nobody is counted twice."
- **Phone preview** of the push, plus "Push shows the first two lines. Zalo and email show the whole thing."
- **Sent and scheduled** log: subject + status pill, meta line, reach, opened %, and View / Cancel.

### Check-in
QR viewfinder (240px, animated scan line, corner brackets), "Scan next ticket", result card with three states — **valid** (green, "Valid — let them in", tier · e-ticket), **duplicate** (amber, `ph-copy`, "Already used — call a gate lead", "Already scanned 19:42 at the main gate"), **invalid** (red, "Rejected", e.g. "Refunded ticket — do not admit" / "Code not from this event") — and a recent-scans list carrying the same three states.
Sidebar: inside/capacity counter with progress + throughput, door staff roster (status dot, gate + role, scan count, phone, pause/resume, remove, and an invite form with gate/role segmented controls), and the **new offline queue card**: connection state (icon, title, body), a prototype "Simulate: lose signal" toggle, "Waiting to sync" count with a "Sync now" button (spins for 1.2s, then reports "N scans synced"), and "Last synced HH:MM · 3 scanners active". Scans taken while offline are tagged "queued" in the log and "saved offline, will sync" in the result card.

### Promos & guest list
Promo code table (code + copy button, note, value, usage bar, active/paused toggle) + create row; guest list (avatar, name, note, seats, in/out toggle) + add row; impact stats; tip panel.

### Revenue
Four KPIs (gross / net / refunds / payout date), stacked bar chart (paid vs promo) with axis labels, tier table (tier, price, sold, bar, gross).
**New: payout ledger** — each row (Advance 50% · Post-event · Refund hold) expands to show line items (gross share, platform fee 4%, payment fee 1.8%, transfer fee, refund hold), a bold **Net to you**, **Invoice PDF** and **Statement** buttons, and the settlement date ("Settles 26 Sep · three working days after the event"). Sidebar: bank account card (verified), fee summary.

### Inbox
Thread list (sender, subject, snippet, unread dot) + conversation (bubbles, quick replies, composer, response-time note). Notification dropdown with per-type preference toggles and a "test push" that fires the `ffPush` toast.

---

## Surface 4 — Admin (`FestFinder Admin.dc.html`)

Prototype entry props: `language`, `tab`. Header: logo, "Admin" mode badge, role, **View as** dropdown, language, avatar. Tabs: Moderation queue · Organizer verification · User reports · Featured shelves · Ads & partners · Insights · Audit log · **Appeals** (each with a count badge).

### Moderation queue
- **Saved views** (filter pills with counts): All · **Past SLA** · Flagged · **New organizers** · Clean. Plus a sort cycler: Oldest first → Highest risk → Newest first.
- **Queue-age bar**: a four-bucket stacked histogram (<1h green · 1–2h cyan · 2–4h amber · past the 4-hour promise red) with "Oldest 5h 18m" (red when any item is past SLA), a select-all control, and a **Shortcuts** link.
- Queue rows: select checkbox · 104×78 art with a risk score badge · title · **SLA pill** (waiting 2h 36m / due soon / past SLA, with clock, countdown or timer icon) · optional flag pill · organiser · auto-check signals · Approve / Reject / Message actions. The focused row carries a cyan border plus a `0 0 0 3px rgba(42,196,232,.14)` ring; selected rows a cyan-tinted ground.
- **Keyboard shortcuts** (`?` opens the sheet): `j`/`k` move · `a` approve · `r` reject sheet · `x` select · `⇧A` select all in view · `m` message organiser · `esc` close any panel. Disabled while typing in a field.
- **Bulk action bar** (fixed, centred, pill): "N selected", Approve N, Reject N, Clear.
- **Risk signals panel** (sticky sidebar): score /100 with band (High ≥60 red · Medium ≥25 amber · Low green), weighted factors (e.g. "First listing from this account +30", "Address does not resolve to a pin +26", "Image reused from a 2025 listing +24", "Price 18% above district median +14", plus passing checks at 0) and the guardrail "The score is advisory. Nothing is auto-rejected; a human still decides." Below it, the automated-checks card.
- **Reject sheet**: six reason codes with machine keys (`venue` · `ticket` · `image` · `permit` · `duplicate` · `policy`), each pre-filling an editable organiser message (bilingual, with a "Reset to template" link), a note that it is sent over Zalo and email with the code attached, and an **"Allow an appeal within 7 days"** toggle — forced off for `policy` ("This reason code does not allow an appeal"). Works for a single listing or the whole bulk selection.

### Appeals (new tab)
One card per rejected listing: art, title, status pill (Awaiting reply / Organizer replied), the reason + the exact message sent, the organiser's reply when there is one, the deadline ("Closes in 5d"), and **Overturn & approve** / **Uphold rejection**. Both write a diffed audit entry. Empty state when clear.

### Organizer verification · User reports · Ads · Insights
Verification cards (documents, checks, approve/reject/ask), report queue (reporter, reason, target, action), ad partners, and an insights board with drill-downs.

### Featured shelves
One card per shelf: name, note, on/off switch, and **new scheduling** — a status chip (Live now / Live · ends 22/09 / Scheduled 01/10 / Ended / Off) plus `dd/mm` start and end inputs (the chip and the inputs are both `flex:none` so they wrap instead of colliding in the narrow column) — item list with remove, and **"Preview in Explore"**, which opens a right drawer showing the shelf exactly as it renders in the app/web feed (title, "See all", horizontally scrolling 174px cards with Featured/Picked tags) plus the live window and a violet note.

### Audit log
**New: actor filters** (All actors / FestFinder Admin / Automatic checks) and Export CSV. Rows: monospace time · tinted icon · action + target · actor · expand caret. Expanding shows a **before/after diff table** (`field` monospace, before struck through in red, after in green) — e.g. `status: pending → live`, `reason_code: — → permit`, `appeal: — → open 7 days`, `risk_score: 0 → 70` — and a tamper-evident hash line. Every admin action performed in the session prepends a real entry with its own diff.

### Impersonation
"View as" dropdown lists a user and two organisers with their role/context. Selecting one shows a persistent amber top banner: "Viewing as @minh.ng" · "Read-only · every action is logged" · "Exit impersonation". While impersonating, every write action refuses with a toast; entering and leaving are both audit-logged (`session: admin → impersonate`, `scope: read+write → read-only`).

---

## Interactions & behaviour (all surfaces)

- **Navigation**: prototypes swap screens by state, not routes. In production: Web `/`, `/map`, `/e/{slug}`, `/o/{slug}`, `/{locale}/{city}/{genre}/{timeframe}`, `/about`; Organizer `/dashboard`, `/new`, `/attendees`, `/announce`, `/check-in`, `/promos`, `/revenue`, `/inbox`; Admin one route per tab. App: stack + 4 tabs.
- **Auth gating**: Save, Get tickets, Follow, Advertise and List your event all check the session first and open the auth modal with a contextual reason; the pending intent resumes after sign-in.
- **Toasts**: every mutation confirms with a short sentence in the active language, auto-dismissing after ~2.1s.
- **Optimistic UI**: all toggles (save, follow, going, paid, reminders, notification cells) flip immediately.
- **Timers to preserve**: OTP resend countdown, the 1.7s simulated moderator reply, the 1.2s offline sync, the 11s "tickets running low" push, the 6.5s bestie-light arm.
- **Language toggle** re-renders every string instantly, including formatted numbers (`vi-VN` vs `en-US`) and currency.
- **Responsive**: Web grids use `repeat(auto-fit, minmax(…, 1fr))` and collapse the sidebar under ~900px; the timetable and attendee table scroll horizontally on narrow screens; App is fixed-width inside a phone frame.

## State to model

Session/user · saved · going · hyped · following (organisers `org:{id}`, artists `art:{name}`) · notification matrix (type × channel) · language · filters (time, genre, price, area, query) · map viewport (`cx`, `cy`, `zoom`, locked frame, moved flag) · timetable plan (per set id) + clash derivation · tickets (+ checked-in flag, wallet-added) · offline flag + queued scans · group plans (members, meet spot, paid map, messages, payment request) · organiser: wizard form (+ derived quality score), range, performance drawer, staff roster, promo codes, guest list, payout row expansion, announcement composer (audience, channels, subject, body, schedule) + sent log · admin: queue filter/sort/focus/selection, reject draft (code, message, appeal), appeals, audit expansion + actor filter, shelf on/off + windows, impersonation session.

## Assets

- `design/assets/ff-logo.png` (127×35 header lockup), `ff-logo-slogan.png`, `ff-icon.png`.
- Fonts: Google Fonts — Archivo 500–900, Manrope 400–800.
- Icons: `@phosphor-icons/web@2.1.1` (bold + fill).
- Event artwork, avatars and site photography are CSS gradients in the prototype. **Real images are needed** — 1600×900 landscape per event (the organiser wizard enforces this), plus organiser logos. No AI-generated imagery is included.

## Files

```
design/
  FestFinder Web.dc.html         public web
  FestFinder App.dc.html         attendee mobile app
  FestFinder Organizer.dc.html   organiser back office
  FestFinder Admin.dc.html       internal admin
  support.js                     prototype runtime — do NOT port
  assets/                        logo lockups
  _ds/nocturne-…/                bound Nocturne design system (styles.css, bundle, readme)
README.md                        this document
```

Open any HTML file directly in a browser to interact with it.
