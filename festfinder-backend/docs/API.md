# FeestFinder API reference

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
| GET | `/auth/providers` | Which ways in this server offers: `{google, fb, ig, zalo, wa, email, password}`. |
| GET | `/auth/oauth/:provider/start?redirectUri=` | `google`, `fb` or `ig` → `{url, state}`; send the browser to `url`. `redirectUri` is the page to come back to and must be on an allowed origin. Signed in → links the account instead of signing in. Sets the `ff_oauth` cookie. |
| GET | `/auth/oauth/:provider/return` | Where the provider sends the browser (register `<PUBLIC_BASE_URL>/auth/oauth/<provider>/return` with it). Checks the state against the `ff_oauth` cookie, signs in or links, sets `ff_session`, and redirects to the page with `?auth=<provider>&via=signin\|signup\|connect`, or `?auth_error=cancelled\|oauth_state_invalid\|connection_taken\|oauth_failed\|…`. A confirmed Gmail address signs into the account that already has it. |
| GET | `/auth/session` 🔒 | Current user, organiser memberships, `readOnly`, `impersonatedBy`. |
| DELETE | `/auth/session` 🔒 | Sign out (also ends an impersonated session). |

Successful sign-in returns `{token, expiresAt, created, user}` and sets the `ff_session` cookie.

## Explore, detail, list, SEO (Web + App)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/events` | Explore feed. `time=tonight\|weekend\|7days\|month\|all` (default `weekend`) or `from`/`to`; `q` (all dates, diacritic-insensitive); `genre`; `artist`; `price=free,under,over`; `area`; `organizer`; `city=ho-chi-minh\|ha-noi\|da-nang\|nha-trang`; `friendsOnly` 🔒; `sort=date\|hype\|price\|relevance` (relevance = followed organisers → featured → interests → soonest); `lat`/`lng` for distance; `limit` (6), `cursor`. Returns `items`, `total`, `hero`, `facets.time` counts, `window`. Ended events sort last. |
| GET | `/events/map` | `bbox=minLng,minLat,maxLng,maxLat`, `genre`, `free`, `friendsOnly`, `time`. Upcoming only. The screens no longer use it: the List tab (`/list`, `/app/list`; `/map` redirects there) reads `/events?time=all` and refreshes it every minute while open. |
| GET | `/events/:idOrSlug` | Detail: facts, description, `tickets` (tier ladder with state `onsale\|last\|soldout\|soon`, `left`, price-rise note, `urgency`, `refundPolicy`), `timetable` (days → stages → sets with minute offsets), organiser card, `similar`, and for a signed-in viewer `me` (following, artist follows, set plan with `clashes`, reported, group plan). Organisers and admins can preview non-live listings. |
| GET | `/explore/stats?view=free\|weekend\|venues` | Hero stat cards and their drill-downs; takes the same filters as `/events`. |
| GET | `/organizers/:slug` | Profile with stats, upcoming and past events, `me.following`. |
| GET | `/shelves` | Featured rows that are on and inside their date window. |
| GET | `/genres`, `/artists?q=`, `/venues?q=` | Filter sheets and wizard venue autocomplete. |
| GET | `/seo/events/:slug?lang=vi\|en` | What an event page says to search engines and AI assistants: `title`, `description`, `robots`, `canonical`, `alternates` (vi, en, x-default), preview `image`, `publishedAt`/`updatedAt`, the server-rendered `page` (crumbs, kicker, h1, the answer-first `summary`, `facts`, about, lineup, timetable, tickets, organiser `updates`, `faq`, other `editions`, `related` events, the other language) with its `headings`, and `jsonLd` (one schema.org `@graph`). 404 unless the event is public. The API's own `/e/:slug` pages render the same. |
| GET | `/seo/organizers/:slug?lang=vi\|en` | The same for an organiser page: head, `page` (summary, facts, `upcoming` and `past` events) and a `ProfilePage` graph. |
| GET | `/e/:slug.md`, `/o/:slug.md` | The page as Markdown for AI agents (`?lang=en` for English), with `Link: <…>; rel="canonical"` to the HTML page. |
| GET | `/llms.txt` | What FeestFinder is, every upcoming event and organiser with its Markdown address (llmstxt.org). |
| GET | `/og/v1/:tone.png` | Genre art as a 1200×630 PNG (`fest`, `edm`, `live`, `culture`, `brand`): the link preview of an event without a cover. Cached for good. |
| POST | `/events/:id/track` | `{type: view\|ticket_click, source: feed\|shelf\|shared\|search\|own\|ads\|map\|list}`. Counted once per visitor per 30 min. |
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
| GET | `/me/collections?event=` 🔒 | My collections (`{id, name, isPublic, url, slug, count, cover}`), newest change first; with `event`, each says `has`. |
| POST | `/me/collections` 🔒 | `{name, eventId?}` → 201. Up to 50 collections of 300 events. Collecting an event also saves it. |
| GET / PATCH / DELETE | `/me/collections/:id` 🔒 | Its events as cards; `{name?, isPublic?}` (the public slug is made once and kept through renames); delete leaves the events saved. |
| PUT / DELETE | `/me/collections/:id/events/:eventId` 🔒 | Add or remove one event. |
| GET | `/collections/:slug` | A public collection: `{name, url, owner: {name, initials}, mine, count, items}`; 404 when private. Its page is `/c/:slug` (SEO: `GET /seo/collections/:slug`, Markdown at `/c/:slug.md`, listed in the sitemap). |
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

## Event page community (Web + App)

📱 = needs a phone number proven by a code (`403 phone_unverified` otherwise; `/me/connections/zalo/start` + `/verify` proves one).

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/events/:idOrSlug` | Also: `phase` (before/live/after), `hype` (count, last 24 h, goals, next goal and progress), `discussion` counts, `faq` (the organiser's answers), `resale` summary, `ambassadors` (top sharers), `community` (sent in by, `claimable` while the community still holds it), `updates` (the organiser's latest five), `mine` (ref code, people brought, watching resale, tickets held, `claim` for an organiser: `canClaim`, `pending`). |
| GET | `/events/:idOrSlug/discussion` | `?kind=qa\|talk\|crew\|trackid\|memory&sort=top\|new&cursor`. Threads with their first three replies (the official answer first), author badges (`team`, `ff`, `ticket`, `submitter`), the tabs the phase opens, `me.canWrite` (`ok`, `signin`, `verify_phone`). GET `/posts/:id/replies` for the rest. |
| POST | `/events/:id/posts` 🔒📱 | `{kind, body, parentId?, setId?, heardAt?, photoUrl?}`. `photoUrl` is one of your own uploads (`POST /uploads?purpose=recap`), on memory and talk threads only. No phone numbers or links (except the organiser's), and ticket trading is sent to resale (`use_resale`). Six posts per 10 minutes. The organiser's reply to a question is its official answer and joins the FAQ. |
| PUT / DELETE | `/posts/:id/helpful` 🔒 | Once per person, never your own. |
| POST | `/posts/:id/reports` 🔒 | `{code: spam\|scalping\|abuse\|drugs\|personal\|other}`. Three open reports hide the post until the team decides. |
| PATCH | `/posts/:id` 🔒 | The event's team or FeestFinder: `{pinned?, hidden?, official?}`. DELETE `/posts/:id`: the author, or the team. |
| POST | `/events/:id/shares` | `{channel}` (`zalo`, `messenger`, `facebook`, `instagram`, `tiktok`, `threads`, `x`, `telegram`, `copy`, `native`, `story`) → the share URL, tagged `?ref=<code>&ch=<channel>` when signed in. `POST /events/:id/track` with `{source:'shared', ref, channel}` credits the sharer once per visitor. |
| POST | `/community/events` 🔒📱 | Anyone sends an event in (title, genre, date, `endsOn?`, times, venue, `city`, entry, `sourceUrl`…). Five a day. It joins the review queue; the sender hears the decision. GET `/me/submissions`. |
| POST | `/community/prefill` 🔒📱 | `{url}` → `{fields, source: structured\|ai, sourceUrl}` to fill the form in. The page's schema.org Event data first (free); otherwise Claude reads the page text. Public pages only (private addresses are refused at every redirect), 2 MB, 8 s. 30 pages and 10 AI reads per person per hour (`429 prefill_limit`); `503 prefill_unavailable` when AI is off. |
| POST | `/community/prefill/poster` 🔒📱 | Multipart `file` (JPEG/PNG/WebP, 5 MB) → `{fields}` read from a poster by Claude. Same hourly cap. |
| POST | `/events/:id/claims` 🏢 | `{note (10+ chars), proofUrl?}`: an organiser asks to take over an event the community sent in. One open request per organiser per event (`409 claim_pending`); `409 not_claimable` once an organiser runs it. |
| GET | `/events/:idOrSlug/updates` | The organiser's updates on the night, newest first. |
| GET | `/events/:idOrSlug/photos` | The photo wall: photos from visible posts, newest first. |
| GET / PUT | `/organizer/events/:id/hype-goals` 🏢 | Up to five `{threshold, reward:{vi,en}}`. Reaching one tells the team. |
| POST | `/organizer/events/:id/updates` 🏢 | `{kind: info\|delay\|gate\|safety\|lineup, body (≤500), notify=true}` on a live listing. With `notify`, ticket holders and people going get it at once (ten notified updates a day, `429 updates_limit`). GET lists them; DELETE `/organizer/events/:id/updates/:updateId` takes one down. |
| GET | `/robots.txt`, `/sitemap.xml` | See README → Running it in production. |

---

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
| GET | `/me/tickets` 🔒 | One card per order the caller still holds tickets from (bought, or passed on to them: `received`), each ticket with its signed `qr` of the current version, `transferable`, `faceValue` and any open `listing`; plus `resold` (the caller's resales and payout dates) and `payee`. |
| POST | `/me/tickets/:id/transfer` 🔒 | `{phone}` gives the ticket to the FeestFinder account with that number. New QR version; the old one stops scanning. |
| POST / DELETE | `/me/tickets/:id/listing` 🔒📱 | `{price, payee?}` puts it up for resale at 10.000₫ up to face value; needs a bank account (`payee` saves one). DELETE takes it down unless someone is paying. |
| GET | `/events/:idOrSlug/resale` | Active listings, cheapest first, `watching`, `feePct`. PUT / DELETE `/events/:id/resale/watch` 🔒 asks to be told when one comes up. |
| POST | `/resale/:listingId/quote` 🔒, `/resale/:listingId/orders` 🔒 | Price + fee; then a 10-minute hold and payment (mock → paid at once; VietQR → `FR…` reference, matched by the bank webhook). GET `/resale/orders/:id`, POST `/resale/orders/:id/cancel`. |
| POST | `/me/tickets/:id/wallet` 🔒 | `{platform: apple\|google}`. |
| GET | `/events/:id/live` 🔒 | The organiser's `updates`; per stage: now playing (minutes left, progress), next, set list with states `played\|now\|next\|later` and your reminders; site zones; friends on site. |
| PUT / DELETE | `/events/:id/presence` 🔒 | "Check in" on the day, optional `{zoneId}`. |
| GET | `/me/passport` 🔒 | Raver passport: a stamp per night the door scanned you or you checked in, `stats` (nights, genres, venues, cities) and eight `badges` with `earned`. |
| GET | `/me/wrapped?year=` 🔒 | The year in review: nights, top genre, artist and venue, first and last night, latest night, friends who were there, posts, helpful votes, people brought, tickets passed on, cities. |
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
| GET | `/organizer/inbox`, `/organizer/inbox/:threadId` | Threads with FeestFinder; opening marks read. |
| POST | `/organizer/inbox/:threadId/messages` | Reply (auto-acknowledged). |
| POST | `/organizer/events/:eventId/appeal` | `{reply}` once, within 7 days of a rejection. |
| GET | `/organizer/notifications`; POST `…/:id/read`, `…/read-all`, `…/test` | Notification bell. |
| GET / PUT | `/organizer/notification-preferences` | `moderation, tickets, payouts, crew`. |

## Door scanning 🚪

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/door/auth/start` → `/door/auth/verify` | Scanner signs in with the invited phone number (SMS code). Several events → `{next: 'pick_event', events}`; send `eventId`. |
| GET | `/door/events/:id/manifest` | `scanKey` + every ticket's code, status and QR version `v` for offline checking, and a `cursor`. `?since=<cursor>` returns only what changed. QR is `<code>.<sig>`, or `<code>~<v>.<sig>` once a ticket has changed hands; an older version scans `invalid` / `transferred`. |
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

---

## Community moderation and resale payouts 🛡

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/posts/reported` | Discussion posts with open reports, across every event. POST `/admin/posts/:id/dismiss` keeps one; PATCH / DELETE `/posts/:id` hides or removes it. |
| GET | `/admin/claims?status=pending\|approved\|rejected` | Organisers asking to take over community events, with their note, proof link and verification. POST `/admin/claims/:id/approve` moves the event to them, turns down the other requests and tells the sender; POST `/admin/claims/:id/reject` `{note?}`. `/admin/counts` carries `claims`. |
| GET | `/admin/resale` | `?state=due\|upcoming\|paid_out\|failed`: resales with the seller's bank account. POST `/admin/resale/:id/payout` `{reference}` records the bank transfer; POST `/admin/resale/:id/refund` for a failed sale or a cancelled event. |

---

## Operations back office (/ops) 🛡

The team mode of `/ops` uses the admin endpoints above plus these. Every write is in the audit log.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/meta/form-options` | Public. Every option list the forms and filters use: genres with hints, districts grouped (central, east, south, west & north, outside, plus any other area in the data), entry modes, ages, organiser types, statuses, badges, tier presets, banks, reject reasons, report categories, order statuses, payment and sign-up methods. |
| GET | `/admin/overview` | What needs a person now: queue (total, past SLA, due soon, flagged, high risk, oldest), open reports and appeals, organisers awaiting verification, listings without a map pin, today's decisions and orders, growth, the next six live events, the last eight audit entries. |
| GET | `/admin/events` | The catalogue, every status. `q` (title, venue, area, artists, organiser; diacritic-free), `status`, `genre` (comma lists), `area` (`\|`-separated), `organizerId`, `entry`, `when=all\|upcoming\|today\|week\|weekend\|month\|past\|undated\|range` with `from`/`to`, `featured`, `reported`, `unresolved` (no pin), `sort=date\|date_desc\|updated\|hype\|saves\|sold\|quality\|title`, `limit` ≤ 200, `offset`. Returns `total` and `facets.status` counts (all filters except status). `GET /admin/events.csv` takes the same filters. |
| GET | `/admin/events/:id` | The draft plus organiser, tiers, stages, every moderation decision, appeal, open reports, metrics (views, clicks, saves, hype, tickets, revenue), the moderation thread, the audit trail, shelves it is on, and `missing` / `missingForPublish`. |
| POST | `/admin/events` | Create for an organiser: the organiser draft fields plus `organizerId`, `featured`, `badge`, `publish`. `publish: true` needs title, genre, dates, venue and a price + ticket link when paid (`details.missing`); the organiser is told it went live. |
| PATCH | `/admin/events/:id` | Team edit: the draft fields plus `featured`, `badge`. Does not send a live listing back to review; re-scores risk when a listing in review gets a venue, link, price or cover change. |
| PUT | `/admin/events/:id/tiers` | Same body as the organiser's tiers. |
| POST | `/admin/events/:id/status` | `{action: publish\|take_down\|cancel\|restore, code?, message?}`. A message goes to the organiser's moderation thread. Cancelling reports how many paid orders still need refunds. |
| POST | `/admin/events/:id/duplicate` | Copy into a new draft for the same organiser. |
| GET / POST / PATCH | `/admin/venues`, `/admin/venues/:id` | Registry with upcoming and total listings; `unresolved` lists live or in-review listings whose venue was typed by hand, each with likely matches. Duplicate names are refused (`venue_exists`). Editing a venue updates its upcoming listings. Only `verified` venues appear in `GET /venues`. |
| GET | `/admin/organizers/:id` | Profile, documents, full payout account (for the test transfer), members (with whether they have a password), listings, stats. `GET /admin/organizers` also takes `q` and `type`. |
| POST | `/admin/organizers` | Onboard: profile fields + `ownerEmail` (+ `ownerName`). Opens the owner account without a password when the email is new; they set one with "forgot password". |
| PATCH | `/admin/organizers/:id/profile` | Brand, legal and contact fields (tax code 10–14 digits). |
| POST | `/admin/organizers/:id/standing` | `{strikes 0–3, suspended, note}`. A suspended organiser cannot submit (`organizer_suspended`). |
| POST / DELETE | `/admin/organizers/:id/members`, `…/members/:userId` | Add by email with a role; the last owner cannot be removed. |
| GET / PATCH | `/admin/users`, `/admin/users/:id` | Search by name, email or phone; `kind=attendee\|organizer\|admin`, `method`, `city`, `active=7d\|30d\|dormant`, `sort`. PATCH `{role}` — never your own. |
| GET / POST | `/admin/orders`, `/admin/orders/:id`, `/admin/orders/:id/refund` | Find by code, buyer, event, status, method, dates; `summary` counts every status. Refund takes `{reason}` for the audit log and refuses once a ticket was scanned. |

Also: `GET /admin/audit` takes `area` (the part of the action before the dot), `q` and `targetId`; `GET /admin/queue` items carry genre, area, entry mode, price, quality score, logo and whether the venue is pinned; `GET /organizer/events` items carry raw dates, genre, area, venue, quality score, `missing` (what submitting still needs) and the last moderation decision; `POST /organizer/events/:id/duplicate` copies a listing into a new draft; `GET /venues` takes `limit` (≤ 50).
