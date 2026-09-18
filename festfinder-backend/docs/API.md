# FestFinder API reference

Grouped by the surface and screen in the design handoff. 🔒 needs a signed-in user, 🏢 an organiser team member, 🚪 the organiser team or an invited door scanner, 🛡 the admin.

Conventions (see the README): bilingual fields are `{en, vi}`; errors are `{error: {code, message, details}}`; lists page with `cursor` / `nextCursor`; money is integer VND; times are Ho Chi Minh City local.

The four screens in `../festfinder-frontend/` call these endpoints directly. Each surface's `pages/<surface>/data.js` has one loader per screen — `FF.loadOrg` for the chrome, then `FF.orgDoor`, `FF.orgMoney` and so on — which is the quickest way to see what a given screen depends on.

---

## Sign-up and sign-in (Web + App gate)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/otp/start` | `{channel: email\|zalo\|wa, identifier}` → `{challengeId, resendIn: 30, expiresIn: 600}`. 30 s resend cooldown, 5 codes/hour. |
| POST | `/auth/otp/verify` | `{challengeId, code}`. Zalo/WhatsApp: signs in (creates the account on first use). Email: new address → `{next: 'set_password', signupToken}`; existing account → signs in. 5 wrong tries lock the code. |
| POST | `/auth/password` | `{token, password, passwordConfirm?}` — finish email sign-up or a reset. 8+ characters. |
| POST | `/auth/login` | `{identifier: email or phone, password}`. 10 failures / 15 min per identifier or IP. |
| POST | `/auth/password/reset` → `/auth/password/reset/verify` | Email code → `{resetToken}` for `/auth/password`. |
| GET | `/auth/oauth/:provider/start?redirectUri=` | `fb` or `ig`. `redirectUri` must be on an allowed origin. Signed in → connects instead of signing in. |
| POST | `/auth/oauth/:provider/callback` | `{code, state}` from the provider redirect. |
| GET | `/auth/session` 🔒 | Current user, organiser memberships, `readOnly`, `impersonatedBy`. |
| DELETE | `/auth/session` 🔒 | Sign out (also ends an impersonated session). |

Successful sign-in returns `{token, expiresAt, created, user}` and sets the `ff_session` cookie.

## Explore, detail, map, SEO (Web + App)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/events` | Explore feed. `time=tonight\|weekend\|7days\|month\|all` (default `weekend`) or `from`/`to`; `q` (all dates, diacritic-insensitive); `genre`; `artist`; `price=free,under,over`; `area`; `organizer`; `friendsOnly` 🔒; `sort=date\|hype\|price\|relevance` (relevance = followed organisers → featured → interests → soonest); `lat`/`lng` for distance; `limit` (6), `cursor`. Returns `items`, `total`, `hero`, `facets.time` counts, `window`. Ended events sort last. |
| GET | `/events/map` | `bbox=minLng,minLat,maxLng,maxLat` ("Search this area"), `genre`, `free`, `friendsOnly`, `time`. Upcoming only. |
| GET | `/events/:idOrSlug` | Detail: facts, description, `tickets` (tier ladder with state `onsale\|last\|soldout\|soon`, `left`, price-rise note, `urgency`, `refundPolicy`), `timetable` (days → stages → sets with minute offsets), organiser card, `similar`, and for a signed-in viewer `me` (following, artist follows, set plan with `clashes`, reported, group plan). Organisers and admins can preview non-live listings. |
| GET | `/explore/stats?view=free\|weekend\|venues` | Hero stat cards and their drill-downs; takes the same filters as `/events`. |
| GET | `/organizers/:slug` | Profile with stats, upcoming and past events, `me.following`. |
| GET | `/shelves` | Featured rows that are on and inside their date window. |
| GET | `/genres`, `/artists?q=`, `/venues?q=` | Filter sheets and wizard venue autocomplete. |
| GET | `/seo/landing/:locale/:city/*` | Programmatic landing page, e.g. `/seo/landing/vi/ho-chi-minh/edm/this-weekend`. Facets: genre (`edm`, `night-market`, `live-music`…), district (`quan-1`, `thao-dien`…), `free`, timeframe (`tonight`, `this-weekend`, `next-7-days`, `this-month`, `2026-09`). Returns `meta` (title, description, canonical, hreflang alternates), `h1`, answers, events, FAQ, related links, JSON-LD (ItemList + FAQPage + BreadcrumbList), `revalidateSeconds: 900`. |
| POST | `/events/:id/track` | `{type: view\|ticket_click, source: feed\|shelf\|shared\|search\|own\|ads\|map}`. Counted once per visitor per 30 min. |
| GET | `/events/:id/calendar.ics` | Add to calendar (with a 24 h alarm). |
| GET | `/ads?placement=feed\|banner\|live&genre&area` | One sponsored card. Alcohol only reaches accounts known to be 18+. |
| POST | `/ads/:id/impression`, `/ads/:id/click`, `/ads/:id/hide` 🔒 | |
| POST | `/ad-inquiries` 🔒 | "Advertise" form. |

## Attendee actions (Web + App)

| Method | Path | Notes |
| --- | --- | --- |
| GET / PATCH | `/me` 🔒 | Profile, connections, counts, payee. PATCH `name, email, zalo, city, photoUrl, locale, interests, birthYear`. The sign-in email/number can't be changed here. |
| PUT | `/me/payee` 🔒 | Bank account for group-plan VietQR requests. |
| PUT / DELETE | `/me/saves/:eventId`, `/me/hypes/:eventId`, `/me/going/:eventId` 🔒 | Idempotent toggles; counters stay in step. |
| GET | `/me/saves`, `/me/hypes`, `/me/going` 🔒 | `past=include\|only\|exclude`. |
| PUT / DELETE | `/me/follows/organizers/:id`, `/me/follows/artists/:name` 🔒 | |
| GET | `/me/follows` 🔒 | Organisers panel: followed + discover, each with next event. |
| PUT / DELETE | `/me/plan/sets/:setId` 🔒 | Clash-finder picks; body `{remind}`. Returns `setIds`, `remindSetIds`, `clashes` with "{a} and {b} overlap by {m} minutes". |
| PATCH | `/me/plan/events/:eventId` 🔒 | `{clear}` or `{remindAll}` ("Remind me 15 min before"). |
| GET / PUT | `/me/notification-preferences` 🔒 | Topic × channel matrix: `saved, tickets, artists, orgs, friends, weekly, sets` × `push, zalo, email`. PUT accepts a partial matrix. |
| GET / PUT | `/me/alert` 🔒 | Smart Alert (genres, artists, organiserIds, areas, priceCap: null any / 0 free) with live `matches`. |
| GET | `/me/notifications` 🔒 | Notification centre; `POST /me/notifications/:id/read`, `POST /me/notifications/read-all`. |
| POST / DELETE | `/me/devices`, `/me/devices/:token` 🔒 | Push tokens. |
| POST | `/me/connections/:provider/start` → `/verify` 🔒 | Connect Zalo or WhatsApp by phone code. `DELETE /me/connections/:provider` disconnects (not your only sign-in method). |
| POST | `/events/:id/reports` 🔒 | `{code: wrong\|cancelled\|scam\|duplicate\|offensive\|price\|refund\|safety, note}`. Two reporters pull the listing from the feed. |
| PUT | `/events/:id/tiers/:tierId/watch` 🔒 | "Notify me" when a tier opens. |
| POST | `/events/:id/remind` 🔒 | "Remind me 24 h before". |
| GET | `/events/:id/guide?lang=` 🔒 | AI local guide `{before, after, explore, wear, tip}`; 503 `guide_unavailable` without credentials. |
| GET / POST | `/events/:id/recap`, `/events/:id/recaps` 🔒 | Post-event stats and rating (`stars`, `aspects`, `photoUrls`). Only after it starts, only for people who went. |
| POST | `/uploads?purpose=cover\|logo\|avatar\|recap` 🔒 | Multipart image, 8 MB. Covers must be 16:9 at 1600×900+. Returns `url`, dimensions, sha256. |

## Friends, chat, group plans (App)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/me/friends` 🔒 | With online status, events they're going to, last message, unread. |
| GET | `/friends/:id` 🔒 | Friend sheet. |
| GET | `/me/chats`, `/me/chats/:friendId` 🔒 | Threads and messages (text, invite cards, waves). |
| POST | `/me/chats/:friendId` 🔒 | `{body}`; friends only. |
| POST | `/events/:eventId/invites` 🔒 | `{friendIds}` — "Go together". Creates or extends your plan, sends invite cards, marks you going. |
| GET | `/me/plans`, `/plans/:id` 🔒 | Members, meet spots (gate at doors, café −60 min, parking −30 min), `split` (per head, paid count, owed line), messages. |
| POST | `/plans/:id/respond` 🔒 | `{status: going\|declined}`. |
| PATCH | `/plans/:id` 🔒 | `{meetSpot: gate\|cafe\|park}`. |
| PATCH | `/plans/:id/members/:userId` 🔒 | `{paid}` — owner only. |
| POST | `/plans/:id/members/:userId/remind` 🔒 | Owner only; once an hour. |
| GET / POST | `/plans/:id/messages` 🔒 | Group chat. |
| POST | `/plans/:id/payment-requests` 🔒 | `{method: vietqr\|momo\|zalopay, post}` → VietQR payload with per-head amount and reference `FF-XXXX-NP-XXX`, payee line, transfer details. `post: true` drops it into the chat and notifies whoever still owes. |

## Tickets, checkout, live mode (App)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/checkout/quote` 🔒 | `{eventId, tierId, qty 1–6, promoCode?}` → line items, discount, service fee, total, refund policy. |
| POST | `/orders` 🔒 | Same + `paymentMethod`. Holds seats 15 min. Mock provider → `payment.status: paid` with tickets; VietQR → `awaiting_transfer` with QR, bank, reference. |
| GET | `/orders/:id` 🔒, POST `/orders/:id/cancel` 🔒 | |
| POST | `/payments/bank-transfer/webhook` | `x-signature: base64url(HMAC-SHA256(PAYMENT_WEBHOOK_SECRET, raw body))`; `{transactionId, amount, description}`. Idempotent. |
| GET | `/me/tickets` 🔒 | One card per order with ticket codes and signed `qr` tokens (valid offline). |
| POST | `/me/tickets/:id/wallet` 🔒 | `{platform: apple\|google}`. |
| GET | `/events/:id/live` 🔒 | Per stage: now playing (minutes left, progress), next, set list with states `played\|now\|next\|later` and your reminders; site zones; friends on site. |
| PUT / DELETE | `/events/:id/presence` 🔒 | "Check in" on the day, optional `{zoneId}`. |
| POST | `/events/:id/waves/:friendId` 🔒 | Once a minute. |
| POST | `/events/:id/share-location` 🔒 | `{zoneId}` to your group plan. |

---

## Organizer back office 🏢

| Method | Path | Screen |
| --- | --- | --- |
| GET / PATCH | `/organizer/profile` | Business profile modal. Tax code 10–14 digits. |
| PUT | `/organizer/bank` | Payout account (owner). |
| GET | `/organizer/events?status=all\|live\|review` | Dashboard table: status label, meta line, views/saves/clicks. |
| GET | `/organizer/dashboard?range=7d\|30d\|all` | KPI cards with deltas; suggested next steps. |
| GET | `/organizer/audience` | Audience breakdown sidebar. |
| GET | `/organizer/events/:id/performance` | Performance drawer: sold vs capacity, pace, need per day, projection, verdict, funnel, 14-day trend, sources, tiers, vs last edition. |
| POST | `/organizer/events` | Wizard: new draft (any subset of fields). |
| GET / PATCH / DELETE | `/organizer/events/:id` | Draft with `quality` score and moderation state/appeal. Editing dates, venue, price or cover on a live listing sends it back to review. Only drafts delete. |
| GET | `/organizer/events/:id/quality` | Listing quality card: score, band, verdict, nine checks with `why` and the wizard `step` to jump to. |
| POST | `/organizer/events/:id/submit` | Needs title, genre, dates, venue, price + ticket link if paid, logo and event page (`details.missing`). |
| PUT | `/organizer/events/:id/tiers` | Replace ticket tiers; keeps sales, refuses capacity below sold. |
| PUT | `/organizer/events/:id/timetable` | Stages and sets (`day`, `start`, `end` — after-midnight times handled). |
| PUT | `/organizer/events/:id/zones` | On-site map zones. |
| GET | `/organizer/events/:id/attendees` | `q` (name, phone digits, order code), `filter=all\|in\|out\|vip\|refunded`; KPIs and filter counts. Phones masked for non-owners. |
| GET | `/organizer/events/:id/attendees.csv` | Full export. |
| POST | `/organizer/tickets/:ticketId/resend` | Refunded tickets refuse. |
| POST | `/organizer/orders/:orderId/refund` | Owner; seats go back on sale. |
| GET | `/organizer/events/:id/announcements/estimate?audience&channels` | Union reach and per-channel reachable counts. |
| GET / POST | `/organizer/events/:id/announcements` | `{audience: saved\|holders\|vip\|past, channels, subject, body ≤ 320, sendAt?}`. One per event per 24 h (`announcement_cooldown`). |
| DELETE | `/organizer/announcements/:id` | Cancel a scheduled one. |
| GET / POST | `/organizer/events/:id/staff`; PATCH / DELETE `/organizer/events/:id/staff/:staffId` | Door roster; invite by SMS; pause/resume. |
| GET / POST | `/organizer/events/:id/promos`; PATCH `…/promos/:promoId` | Promo codes and stats. |
| GET / POST | `/organizer/events/:id/guests`; PATCH / DELETE `…/guests/:guestId` | Guest list. |
| GET | `/organizer/events/:id/revenue` | KPIs, 14-day paid vs promo chart, tier table, payout ledger, account, fees. |
| GET | `/organizer/events/:id/payouts/:kind/statement.csv`, `…/invoice` | `kind = advance\|post_event\|refund_hold`. |
| GET | `/organizer/inbox`, `/organizer/inbox/:threadId` | Threads with FestFinder; opening marks read. |
| POST | `/organizer/inbox/:threadId/messages` | Reply (auto-acknowledged). |
| POST | `/organizer/events/:eventId/appeal` | `{reply}` once, within 7 days of a rejection. |
| GET | `/organizer/notifications`; POST `…/:id/read`, `…/read-all`, `…/test` | Notification bell. |
| GET / PUT | `/organizer/notification-preferences` | `moderation, tickets, payouts, crew`. |

## Door scanning 🚪

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/door/auth/start` → `/door/auth/verify` | Scanner signs in with the invited phone number (SMS code). Several events → `{next: 'pick_event', events}`; send `eventId`. |
| GET | `/door/events/:id/manifest` | `scanKey` + every ticket code and status for offline checking. |
| POST | `/door/events/:id/scans` | `{token (QR content), deviceId, clientScanId, gate?, scannedAt?, manual?}` → `valid` / `duplicate` ("Already scanned 19:42 at the main gate") / `invalid` (refunded, wrong event, forged). |
| POST | `/door/events/:id/scans/sync` | `{deviceId, scans: [...]}` offline queue, processed in time order, idempotent. |
| GET | `/door/events/:id/summary` | Inside vs capacity, throughput per hour, recent scans, staff, last sync. |

---

## Admin 🛡

| Method | Path | Tab |
| --- | --- | --- |
| GET | `/admin/counts` | Tab badges. |
| GET | `/admin/queue?filter=all\|breach\|flagged\|new\|clean&sort=age\|risk\|new` | Moderation queue with SLA pill, flag, risk score, signals, saved-view counts, age buckets, oldest. |
| GET | `/admin/listings/:eventId/risk` | Risk signals panel (recomputed). |
| POST | `/admin/listings/approve` | `{ids}` — single or bulk. Notifies the organiser; tells artist followers, organiser followers and matching Smart Alerts once each. |
| GET | `/admin/reject-reasons` | Codes with bilingual templates and whether appeals are allowed. |
| POST | `/admin/listings/reject` | `{ids, code, message?, allowAppeal}` — `policy` never allows an appeal. Posts to the organiser's inbox. |
| GET / POST | `/admin/listings/:eventId/thread` | "Message organizer" drawer with quick asks. |
| GET | `/admin/appeals`; POST `/admin/appeals/:id/overturn`, `/admin/appeals/:id/uphold` | Appeals. |
| GET | `/admin/reports`; POST `/admin/reports/:eventId/take-down`, `…/warn`, `…/dismiss` | User reports grouped by listing and category (refund, wrong, price, safety), last 30 days. Warn adds a strike; 3 suspends. |
| GET | `/admin/organizers?state=`; PATCH `/admin/organizers/:id` | Verification (`state`, `docs`, `bankVerified`). Verifying needs an ID document. |
| GET / POST | `/admin/shelves`; PATCH `/admin/shelves/:id`; PUT `…/items`; GET `…/preview` | Featured shelves with on/off, `startsOn`/`endsOn`, phase label, preview. |
| GET | `/admin/ads`; POST `/admin/ads/inquiries/:id/approve`, `…/decline`; PATCH `/admin/ads/campaigns/:id`; PUT `/admin/ads/rates` | Ads & partners. |
| GET | `/admin/insights` | Health tiles, organiser table, user stats, cities, genres, recent accounts. |
| GET | `/admin/audit?actor=all\|admin\|system\|organizer`, `/admin/audit.csv`, `/admin/audit/verify` | Audit log with diffs and hash; chain verification. |
| GET | `/admin/impersonation/options`; POST / DELETE `/admin/impersonation` | "View as": `{targetType: user\|organizer, targetId}` → read-only token and banner. |
| POST | `/admin/payouts/:eventId/:kind` | `{reference}` — record a transfer; the organiser's ledger row shows paid. |
