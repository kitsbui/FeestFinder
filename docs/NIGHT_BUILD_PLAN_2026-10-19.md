# Night build plan (bản 2, 2026-10-20): hai đêm, không deploy

- Dành cho: Claude Code chạy nhiều giờ liền, không có người xem. Chủ sản phẩm đọc sáng hôm sau.
- Tự đứng được: agent cần `CLAUDE.md`, `docs/HANDOFF_2026-10-19_growth-plan.md` bản 3 (gọi tắt **handoff**: thẻ C, A, B, D, 4, 5, 6, 1; mục 7 và 8) và file này. Khi hai file khác nhau, **file này thắng**.
- Nền: `main` = `origin/main` = `48b2cf3` (hoặc mới hơn sau khi merge branch docs). Migration cố định: đêm 1 `048_drop_ticketing`, `049_comments`; đêm 2 `050_day_events`, `051_affiliate`, `052_organizer_calendar`.
- Trạng thái: **chưa chạy**. Mỗi đêm chạy khi chủ sản phẩm nói "bắt đầu night build 1" / "… 2". Đêm 2 chỉ chạy khi đêm 1 đã merge vào `main` (thẻ D dựa trên `/go` không còn checkout).

---

## 0. Luật của đêm (cả hai đêm)

1. **Chỉ làm việc đã có quyết định.** Dùng: D1, D4, D5, D6 = A (2026-10-19); D5b, D3c = A mặc định; D7–D14 = A mặc định (2026-10-20; chủ sản phẩm đổi được sáng sau; ghi vào roadmap ở N0). Zalo OA để sau. Gặp quyết định mới: **dừng việc đó, ghi vào file tiến độ, sang việc kế.**
2. **Mỗi việc một branch `night/<ngày>-N<k>` rẽ từ `night/<ngày>`, một commit**, tác giả `git -c user.name="Claude" -c user.email="noreply@anthropic.com"`, dòng cuối `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Qua cổng thì merge thường (không squash) vào `night/<ngày>`.
3. **Không push `main`, không deploy, không `vercel`, không mở PR, không `visual-ok`.** Push `night/<ngày>` lên origin sau mỗi merge (preview trên staging; chấp nhận).
4. **Cổng:** mỗi việc có cột "Cổng". Đỏ thì sửa tối đa 2 lần; vẫn đỏ thì bỏ branch, ghi lý do, sang việc kế. `newcomer.spec.ts`, `layout.spec.ts`, `perf.spec.ts` đỏ ở việc nào thì việc đó chưa xong; ngân sách trong chúng chỉ giảm (đêm 1 **ghi số mới thấp hơn** khi khối vé biến mất).
5. **Sau mỗi việc, ghi `docs/NIGHT_BUILD_<ngày>.md`** theo mẫu mục 4, commit cùng việc đó.
6. **Không làm trong đêm:** Zalo, đổi điều hướng, thêm tab/chip/sheet trên điện thoại, du lịch, Track ID, Crew, Night Pass, merch, gỡ `plans` payment requests (D11 A: giữ), gỡ đăng nhập SMS/Zalo/WhatsApp, đổi thứ tự sheet đăng nhập.
7. Không secret vào repo; test không gọi mạng; `npm i @modelcontextprotocol/sdk@1.32` là lần gọi mạng duy nhất (đêm 2). Không sửa migration đã ship. **Migration 048 phải có khoá an toàn**: `raise exception` khi `orders` có dòng `status = 'paid'`.
8. **Chữ:** `L()` / `{en, vi}`; dòng công khai mới có th/ja/id theo khoá tiếng Anh; chữ lấy nguyên văn từ thẻ. Không câu giải thích, không số 0, không tên nội bộ ở màn đầu.
9. **Bố cục:** lấp đầy 390 và 1440, không cuộn ngang; bảng thành thẻ dưới 640; một hành động chính; ba trạng thái.
10. **Kỷ luật công cụ:** `npm run lint; echo "lint $?"`; không pipe trong `&&`; build mới cho mọi kết quả; cả bộ `test:screens` ở việc đóng đêm. Khi xoá file, `npm run typecheck` trước mọi thứ: nó liệt kê mọi import mồ côi.

---

## 1. Điều kiện trước mỗi đêm (chủ sản phẩm, 10 phút)

| # | Điều kiện | Cách kiểm |
| --- | --- | --- |
| 1 | Dòng trong roadmap mục "Growth plan": "2026-10-xx: night build 1 (hoặc 2) chạy với D1, D4–D6 = A; D5b, D3c, D7–D12 mặc định A; Zalo OA để sau" | Agent đọc ở N0; không có thì không bắt đầu |
| 2 | **Đêm 1:** production không có đơn `paid` (Console › Đơn hàng, hoặc Supabase). Migration 048 cũng tự kiểm, nhưng biết trước thì đỡ hỏng đêm | Chủ sản phẩm xem |
| 3 | `main` sạch, bằng `origin/main`; nếu mới hơn `48b2cf3`, agent đọc `git log` và ghi vào file tiến độ những gì đổi ở các file thẻ chạm | `git fetch && git status` |
| 4 | `npm ci` đã chạy trong `festfinder-backend/` và `festfinder-web/` (checkout này thiếu `@axe-core/playwright` tới 2026-10-20); CI xanh; cục bộ `typecheck`, `lint`, `test`, `test:screens` xanh (agent chạy lại ở N0 và ghi số) | `ls festfinder-backend/node_modules/@axe-core` |
| 5 | Preview không chạy; máy không ngủ; hạn mức đủ 16 giờ | `preview_list` trống; `ccd_host request_keep_awake` |

---

## 2. Đêm 1 · 2026-10-2x · Gỡ vé, Gmail là đủ, Bình luận

### N0 · 0:00 · Khởi động (15 phút)
- Kiểm điều kiện. Tạo `docs/NIGHT_BUILD_<ngày>.md` (mẫu mục 4): commit xuất phát, số bài của bốn lệnh, giờ, dòng quyết định chép vào roadmap. `git checkout -b night/<ngày>`.
- Đọc thẻ C, A, B và mục 7, 8 của handoff một lần.

### N1 · 0:15 · Thẻ C P0: gỡ mảng vé khỏi API (4 giờ)
- **Mục tiêu:** API không còn checkout, đơn, vé, quét, pass vé, khuyến mãi, payout; `/go` luôn tới bên bán hay trang gốc; schema sạch.
- **Làm:** đúng **bảng phụ thuộc** của thẻ C (12 file ngoài 9 file bị xoá) và "Xây P0". Thứ tự an toàn: (1) `services/attendance.ts` `attended()` = `presence` ∪ (`going` ∧ đã kết thúc) (D13); `badges.ts:81,216`, `night.ts:46,211,215`, `community.ts:122` dùng nó và bỏ `ticket`; `plans.ts:34` → `price_from`; `eventpage.ts:25,33,34`, `seo/event.ts:31`, `insights.ts` (clicks thay sold) bỏ tier và resale; `outbound.ts` bỏ nhánh checkout và `tier`, `qty` trong `GoQuery`; (2) xoá 9 file route/service, cắt `audience.ts`, `organizer/events.ts`, `outbound.ts` nhánh checkout, `jobs.ts` ba job, `config.ts`, `app.ts`, `db/rows.ts`; (3) `npm run typecheck` và sửa tới sạch; (4) migration `048_drop_ticketing.sql` (khoá an toàn; `drop table` 12 bảng đúng thứ tự FK: `scans`, `ticket_transfers`, `resale_orders`, `ticket_listings`, `resale_watchers`, `tickets`, `guest_list`, `orders`, `payout_transfers`, `promo_codes`, `tier_watchers`, `ticket_tiers`; xoá `badge_awards` ba code); bump `CLAUDE.md` "The next one is `049_*.sql`"; (5) test: xoá `attendee`, `resale`; sửa seed (không tier, đơn, vé, promo, resale); sửa 15 file test có nhánh vé.
- **Cổng:** `npm run typecheck`; `npm test` **cả bộ**; `npm run lint; echo "lint $?"` rồi hạ `--max-warnings` xuống đúng số thật.
- **Commit:** `FeestFinder sells no tickets: checkout, orders, tickets, door, resale, promos and payouts removed; /go always leads to the seller (migration 048)`.

### N2 · 4:15 · Thẻ C P1: gỡ màn hình vé (3 giờ)
- **Làm:** đúng "Xây P1" của thẻ C: xoá 10 màn và page của chúng; `tickets.tsx` thành một hàng `Mua vé · từ {giá}` đi `/go`; `me.tsx` bỏ Vé; rail Studio 5 mục; wizard/editor bước Vé = link và giá (một link; nhiều link là đêm 2); Console bỏ Đơn hàng; `/about`, FAQ câu mới; `routes.ts`, `perf.spec.ts` bỏ route; sửa 9 spec, xoá `console-commerce.spec.ts`; `newcomer.spec.ts` ghi `IN_SIGHT.event` mới (phải thấp hơn 12).
- **Cổng:** `npx tsc --noEmit -p .` và `npm run lint; echo $?` trong `festfinder-web/`; `npm run test:screens` **cả bộ**.
- **Commit:** `The site without tickets: one "Mua vé" row to the seller, no ticket screens in the app, Studio or Console`.

### N3 · 7:15 · Thẻ C P2: tài liệu (30 phút)
- `CLAUDE.md` (bỏ mọi câu về checkout VND, tiers, resale, check-in, payouts, phí người mua; thêm câu của thẻ C), `CURRENT_ARCHITECTURE.md` bảng Commerce, `TECH_DEBT.md`, roadmap.
- **Cổng:** `grep -rn "checkout\|ticket_tiers\|resale\|payout" CLAUDE.md` trống (trừ dòng "commerce tables were dropped in 048").
- **Commit:** `Docs: FeestFinder sells no tickets`.

### N4 · 7:45 · Thẻ A: Gmail là đủ (1 giờ)
- **Làm:** `guards.ts` `requireWriter` = `requireUser` (giữ tên, comment ghi 2026-10-20 và rủi ro Nghị định 147); `discussion.ts` `canWrite` bỏ `verify_phone`; web bỏ nhánh `verify_phone` ở `community.tsx:177`, `kd/moments.tsx` không gọi `kd/phone.tsx` trước khi đăng; `GET /admin/posts/recent` và tab `Bình luận` ở `kd/console/reports.tsx` với nút Xoá; `CLAUDE.md` câu "publishing needs a confirmed phone" → "signing in is enough (owner 2026-10-20; Decree 147 risk accepted)".
- **Test:** `test/community.test.ts`, `test/projects.test.ts`, `test/mixes.test.ts`: tài khoản Google không số đăng được; `test/admin.test.ts`: `/admin/posts/recent` và xoá; e2e `event.spec.ts` fan seed bình luận không gặp sheet; `console.spec.ts` tab Bình luận.
- **Cổng:** `node --test test/community.test.ts test/projects.test.ts test/mixes.test.ts test/admin.test.ts`; `npx playwright test -c playwright.next.config.ts e2e/next/event.spec.ts e2e/next/console.spec.ts`.
- **Commit:** `Signing in is enough: no phone gate on comments, submissions, projects or mixes; the Console deletes comments`.

### N5 · 8:45 · Thẻ B P0: bình luận một dòng, trả lời hai cấp (2 giờ)
- **Làm:** bỏ `kindOpen`, `kindsShown` (D14: luôn mở); migration `049_comments.sql` (`event_posts.reply_to_user_id`, `edited_at`; bump `CLAUDE.md` `050`); `discussion.ts`: bỏ `reply_depth`, trả lời của trả lời ghi `parent_id` gốc + `reply_to_user_id`; `GET discussion` một danh sách (ghim trước, mới nhất) với 3 trả lời đầu và `replyCount`; `PATCH` chỉ 15 phút của mình; thông báo `reply` cho người được trả lời (topic `null`, không tới chính mình); `helpful` giữ route, nhãn "Thích" ở web (N6).
- **Test:** `test/community.test.ts` theo thẻ B (trả lời của trả lời; sửa sau 15 phút → 403; admin xoá; thích; báo cáo; thông báo; tốc độ).
- **Cổng:** `node --test test/community.test.ts test/night.test.ts`.
- **Commit:** `Comments are one stream per event: replies to replies, edits for 15 minutes, a notice to the person replied to (migration 049)`.

### N6 · 10:45 · Thẻ B P1: màn hình bình luận (2 giờ)
- **Làm:** `kd/web/event/community.tsx` bỏ chip kinds; một composer; `Thread` hiện trả lời phẳng với `@Tên`; hành động `Thích {n}` · `Trả lời` · `⋯` (Sửa, Xoá, Báo cáo); rỗng một câu một hành động; `more.tsx` mục `Bình luận (n)` thay ba tab; copy vi/en và th/ja/id theo khoá.
- **Test:** `event.spec.ts` viết, trả lời, trả lời trả lời có @tên, xoá; `newcomer.spec.ts` không đổi; `layout`, `wcag`, `targets` cho `/e/ravo`.
- **Cổng:** `npx playwright test -c playwright.next.config.ts e2e/next/event.spec.ts e2e/next/newcomer.spec.ts e2e/next/layout.spec.ts e2e/next/targets.spec.ts e2e/next/wcag.spec.ts`.
- **Commit:** `Comments like a feed: one box, replies with @name, like, reply, edit, delete, report`.

### N7 · 12:45 · Đóng đêm 1 (1 giờ)
- Cả bộ: `typecheck`, `lint; echo $?` (cả hai package), `npm test`, `npm run test:screens`. `FF_VISUAL=1 visual.spec.ts` cục bộ, ghi ảnh đổi (trang sự kiện: khối vé, mục Thêm). Push `night/<ngày>`. Mục "Sáng sau" của file tiến độ; roadmap "Growth plan" tick C, A, B; ghi `IN_SIGHT` và JS trang sự kiện trước → sau, lint budget trước → sau.

---

## 3. Đêm 2 · sau khi đêm 1 lên `main` · Affiliate, Ban ngày, Kệ, Agent, Lịch

### N0 · 0:00 · Khởi động (15 phút)
- Như đêm 1. Đọc thẻ D, 4, 5, 6, 1 và mục 7. Kiểm `/go` không còn nhánh checkout (`grep -n checkout festfinder-backend/src/routes/outbound.ts` trống).

### N1 · 0:15 · W0: seed (45 phút)
- Một sự kiện có hai link bán vé (VN và SG) và partner seed `megatix` với `postback_token` (giá trị trong seed là cho test, không bí mật); một coffee rave 09:00–13:00; một kệ bật 3 sự kiện (một cũng là lễ hội flagship); fixture `test/fixtures/ingest/organizer-calendar.ics` (thiếu `LOCATION`, `TZID` khác, `CANCELLED`, trùng Ravolution, trùng NTC khác); `SERVER_EVENTS` thêm `calendar_connected`, `ambassador_sale`, `agent_call`; `ALLOWED_PROPS` thêm `tool`.
- **Cổng:** `npm run typecheck`; `node --test test/public.test.ts test/analytics.test.ts`; `newcomer.spec.ts`, `home.spec.ts`.
- **Commit:** `Seed for the growth plan: two ticket sellers, a day party, a shelf, a calendar fixture`.

### N2 · 1:00 · Thẻ 4 P0 + P1: Ban ngày (1,5 giờ)
- Như bản 1 của plan: migration `050_day_events.sql`; `EVENT_TYPES` `day`; `inferEventType` luật `day` **ngay sau festival, trước `rave`/`party`**; `fit.ts` `day` như `party`; nhãn menu `Loại · Kind`; Markdown "Loại"; `CLAUDE.md`.
- **Cổng:** `node --test test/radar.test.ts test/public.test.ts test/edm.test.ts test/ingest.test.ts`; `list.spec.ts`, `languages.spec.ts`, `newcomer.spec.ts`.
- **Commit:** `Day parties are an event type, inferred before the rave and party keywords; the kind picker is "Loại" (migration 050)`.

### N3 · 2:30 · Thẻ 5: kệ trả tiền trong ô nổi bật (2 giờ)
- Như bản 1 của plan: `/shelves` `sponsored` và `?city=`; `featured` suy trong `presentCard`; `highlight` = kệ hoặc lễ hội; `browser.tsx:416` điều kiện D5b; `source: 'shelf'`, `card_open surface shelf`; `fresh-paths` kind `s`; Console `freshen`; `TECH_DEBT` 17.
- **Cổng:** `node --test test/public.test.ts`; `home.spec.ts`, `newcomer.spec.ts`, `layout.spec.ts`.
- **Commit:** `A paid shelf takes the home page's one highlight surface, labelled sponsored, and reaches a chosen city (tech debt 17)`.

### N4 · 4:30 · Thẻ D P0: affiliate ở API (3 giờ)
- **Làm:** đúng "Xây P0" của thẻ D: migration `051_affiliate.sql` (`outbound_clicks.ref_user`, `partner_conversions.ref_user`, `event_ticket_links`, `ambassador_earnings`, `ambassador_payouts`; bump `CLAUDE.md` `052`); `lib/affiliate.ts` (`SHARE_PCT 50`, `MIN_PAYOUT 50_000`); `lib/money.ts` tỷ giá cố định SGD, THB, IDR, JPY → VND với ngày ghi; `/go`: `ref` (regex `^[2-9A-HJ-NP-Z]{6}$`, chỉ ghi khi `share_visits` có lượt mở của ref ấy cho sự kiện và ref ≠ người bấm), chọn link theo `x-ff-client-country`, UTM khi không partner và chưa có `utm_`; `recordConversion` chép `ref_user`, tạo earnings khi `approved`, `void` khi `rejected` (cả `PATCH /admin/conversions/:id`); `GET /me/commission`; `/me` `counts.commission`; CRUD `/organizer/events/:id/links`; `PLACEMENTS` thêm `agent`, `widget`, `share`; `events.ticket_url` đồng bộ từ link `primary`.
- **Test:** `test/affiliate.test.ts`, `test/partners.test.ts` theo thẻ D (ref ghi/không ghi; postback khớp click; approved → 50%; rejected → void; SGD → VND; chọn link theo nước; UTM; `/me/commission`).
- **Cổng:** `node --test test/affiliate.test.ts test/partners.test.ts test/public.test.ts test/organizer.test.ts`.
- **Commit:** `Smart affiliate: /go picks the seller by country, carries the referrer and UTM; a partner's approved conversion earns the referrer half of the commission (migration 051)`.

### N5 · 7:30 · Thẻ 6: MCP và /list.md (2 giờ)
- Như bản 1 của plan, với mọi link vé là `/go/<slug>?src=agent`. `npm i @modelcontextprotocol/sdk@1.32`; `routes/agent.ts`; `reply.hijack()` + `handleRequest(req.raw, reply.raw, req.body)`; rate-limit 60/phút; `PUBLIC_READS` `/list.md`; llms.txt mục Agents; `CLAUDE.md`, ARCHITECTURE.
- **Cổng:** `node --test test/agent.test.ts test/seo.test.ts test/webproxy.test.ts`; `npm run typecheck`; `npm run lint; echo $?`.
- **Commit:** `A read-only MCP server and /list.md for agents; their ticket links go through /go`.

### N6 · 9:30 · Thẻ D P1: màn hình affiliate (2,5 giờ)
- **Làm:** `context.tsx` lưu `ff:ref:<eventId>` 30 ngày; `tickets.tsx`, `dock.tsx` gắn `ref` vào `/go`; sheet chia sẻ dòng `Hoa hồng {p}%` (đã đăng nhập và sự kiện có partner); `me.tsx` hàng `Hoa hồng` khi `counts.commission > 0`; `/app/commission` (`/app/*` đã trong cutover; thêm vào `routes.ts` fan; `perf.spec.ts` đo một lần); Studio editor bước Vé: danh sách link với nước và tiền tệ; tab `Link vé` trong Sự kiện (click theo ngày, nguồn, bên bán, người giới thiệu).
- **Cổng:** `npx playwright test -c playwright.next.config.ts e2e/next/event.spec.ts e2e/next/app-more.spec.ts e2e/next/studio-events.spec.ts e2e/next/newcomer.spec.ts e2e/next/layout.spec.ts e2e/next/targets.spec.ts e2e/next/wcag.spec.ts e2e/next/perf.spec.ts`.
- **Commit:** `Affiliate on the screens: the referrer travels to "Mua vé", commission in Tôi, ticket links by country in Studio`.

### N7 · 12:00 · Thẻ 1 P0: lịch kết nối (3 giờ)
- Như bản 1 của plan: migration `052_organizer_calendar.sql`; `run.ts` nhánh `organizer_id` (không gộp sang NTC khác, `createCandidate` nhận `organizerId`, `enrich` cho NTC của nguồn, provider `organizer`, bỏ `FIT_FLOOR`); `/organizer/calendar` CRUD; thông báo một lần mỗi đợt.
- **Cổng:** `node --test test/ingest.test.ts test/organizer.test.ts test/radar.test.ts`.
- **Commit:** `An organiser connects a calendar: its nights are posted under the organiser and wait for review (migration 052)`.

### N8 · 15:00 · Thẻ 1 P1: lịch nhúng (3 giờ, tuỳ chọn)
- Như bản 1: `routes/embed.ts` (+ `.ics` tái dùng writer `event-actions.ts:116-130`), `ui/widget/ff-widget.js`, `copy-ui.ts`, khối "Lịch" trong Studio › Hồ sơ, `source: 'widget'`.
- **Cổng:** `node --test test/embed.test.ts`; `widget.spec.ts`, `studio.spec.ts`, `layout.spec.ts`; `npm run typecheck`.
- **Commit:** `Embed calendar: /embed/organizers/:slug and its .ics feed, the widget, and the Studio "Lịch" block`.

### N9 · 18:00 · Thẻ D P2 (1 giờ, tuỳ chọn)
- Job `settleAmbassadors`; Console tab Đại sứ và "cần ký" (top host theo click 30 ngày không partner); `CLAUDE.md` mục "Ticket buttons" viết lại theo thẻ D.
- **Cổng:** `node --test test/affiliate.test.ts test/jobs.test.ts`; `console.spec.ts`.

### N10 · 19:00 · Đóng đêm 2 (1 giờ)
- Như N7 của đêm 1. Ghi: thẻ 1 P2 (bản sửa từ lịch) là việc tiếp theo cần người xem.

---

## 4. Mẫu file tiến độ `docs/NIGHT_BUILD_<ngày>.md`

```
# Night build <ngày> (đêm 1 | đêm 2)

Xuất phát: main <sha>. Kiểm tra lúc bắt đầu: typecheck ok · lint ok (<n>/<ngân sách>) · test <m> bài · screens <k> bài.
Quyết định dùng: D1, D4–D6 = A; D5b, D3c, D7–D12 = A (mặc định); Zalo OA để sau.

| N | Việc | Bắt đầu | Kết thúc | Kết quả | Branch · commit | Cổng | Ghi chú |

## Ảnh đổi (visual.spec cục bộ)
## Số trước → sau
- newcomer IN_SIGHT home/event · perf JS /, /e/ravo · lint cảnh báo API/web · test tổng · bảng trong schema
## Sáng sau
- Đã xong · Chưa xong (vì) · Cần chủ sản phẩm (xác nhận D7–D12; mở PR nào; xem ảnh, gắn visual-ok; ký partner) · Việc tiếp theo
```

## 5. Sáng sau (chủ sản phẩm, 15 phút)

1. Đọc file tiến độ. `git log --oneline main..night/<ngày>`; bỏ việc nào: `git revert -m 1 <merge sha>`.
2. Bảo agent mở PR: đêm 1 nên là **một PR cho thẻ C** (N1–N3) và một cho A + B; đêm 2 một PR mỗi thẻ. Checklist "Thiết kế" đánh thật; xem `visual-diff`; gắn `visual-ok`; "merge".
3. Sau deploy: script phụ lục A của handoff trên production; ghi số; với đêm 2 tạo một kệ 3 sự kiện trong Console và kiểm một `/go` thật tới bên bán.
