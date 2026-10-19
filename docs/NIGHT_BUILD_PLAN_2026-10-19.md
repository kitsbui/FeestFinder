# Night build plan 2026-10-19: năm thẻ của kế hoạch tăng trưởng, không deploy

- Dành cho: Claude Code chạy nhiều giờ liền, không có người xem. Chủ sản phẩm đọc sáng hôm sau.
- Tự đứng được: agent cần `CLAUDE.md`, `docs/HANDOFF_2026-10-19_growth-plan.md` (gọi tắt: **handoff**; thẻ 4, 5, 1, 3, 6 và mục 7) và file này. Khi file này và handoff khác nhau, **file này thắng**.
- Nền: `main` = `origin/main` = `48b2cf3`. Migration: `048` Ban ngày, `049` Lịch, `050` Hoa hồng. Không migration nào khác trong đêm.
- Trạng thái: **chưa chạy**. Chạy khi chủ sản phẩm nói "bắt đầu night build".

---

## 0. Luật của đêm

1. **Chỉ làm việc đã có quyết định.** Dùng trong đêm: D1, D3, D4, D5, D6 = A (chủ sản phẩm, 2026-10-19); D5b và D3c = A mặc định (ghi vào roadmap ở N0, chủ sản phẩm đổi được sáng sau, cả hai đảo ngược được bằng một commit). **Zalo OA để sau** (chủ sản phẩm, 2026-10-19): không chạm `services/sms.ts`, `provider_tokens`, đăng nhập, xác minh số điện thoại; SMS giữ như phase 17. Gặp quyết định mới: **dừng việc đó, ghi vào file tiến độ, sang việc kế.**
2. **Mỗi việc một branch `night/2026-10-19-N<k>` rẽ từ `night/2026-10-19`, một commit**, tác giả `git -c user.name="Claude" -c user.email="noreply@anthropic.com"`, dòng cuối `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Qua cổng thì merge thường (không squash) vào `night/2026-10-19`, để sáng sau revert được từng việc.
3. **Không push `main`, không deploy, không `vercel`, không mở PR.** Push `night/2026-10-19` lên origin sau mỗi merge để CI chạy (API và web đều chỉ tạo preview trên staging; chấp nhận). Sáng sau chủ sản phẩm nói mở PR nào thì mở.
4. **Cổng:** mỗi việc có cột "Cổng". Đỏ thì sửa tối đa 2 lần; vẫn đỏ thì bỏ branch, ghi lý do, sang việc kế. **`newcomer.spec.ts`, `layout.spec.ts`, `perf.spec.ts` đỏ ở việc nào thì việc đó chưa xong**; ngân sách trong chúng không bao giờ tăng.
5. **Sau mỗi việc, ghi `docs/NIGHT_BUILD_2026-10-19.md`** theo mẫu mục 4, commit cùng việc đó trên branch đêm. Bị dừng giữa chừng thì sáng sau vẫn đọc được.
6. **Không làm trong đêm** dù còn giờ: thẻ 2 (Zalo), đổi điều hướng, đổi màn đầu, thêm tab, chip hay sheet trên điện thoại, link du lịch, bất kỳ việc ở mục 6 của handoff, gắn nhãn `visual-ok` (người gắn), chép skill từ design-kit vào `.claude/skills/` (việc của chủ sản phẩm, không bắt buộc).
7. Không secret, token, mật khẩu vào repo; test không gọi mạng (fixture); `npm i @modelcontextprotocol/sdk` là lần gọi mạng duy nhất được phép (N5). Không sửa migration đã ship.
8. **Chữ:** server `L()`, web cặp `{en, vi}` qua `pick()`/`tx()`; mọi dòng mới của trang công khai có ở `copy/asia/{th,ja,id}.ts` theo khoá tiếng Anh (chạy script đối chiếu dòng thiếu của repo trước khi commit; nếu không có script, `grep` khoá). Chữ lấy nguyên văn từ bảng "Người dùng thấy" của thẻ. Không câu giải thích, không số 0, không tên nội bộ ở màn đầu.
9. **Bố cục:** mọi màn chạm tới lấp đầy bề ngang ở 390 và 1440, không cuộn ngang; bảng thành thẻ dưới 640; một hành động chính mỗi màn; ba trạng thái (tải, rỗng có việc, lỗi có thử lại) trước đường vui.
10. **Kỷ luật công cụ** (bài học 12 của design-kit): `npm run lint; echo "lint $?"`, không pipe trong chuỗi `&&`; kết quả để quyết định phải từ build mới (không `WEB_SKIP_BUILD`); chạy cả bộ `test:screens` ở N11 vì các spec để dữ liệu cho nhau; `timezoneId` đã ghim trong config.

---

## 1. Điều kiện trước khi bắt đầu (chủ sản phẩm, 10 phút)

| # | Điều kiện | Cách kiểm |
| --- | --- | --- |
| 1 | Một dòng trong `docs/FEESTFINDER_ROADMAP.md` mục "Growth plan": "2026-10-xx: night build chạy với D1, D3–D6 = A, D5b và D3c mặc định A, Zalo OA để sau" | Agent đọc dòng đó ở N0; không có thì không bắt đầu |
| 2 | `main` sạch và bằng `origin/main` (`48b2cf3` hoặc mới hơn sau khi merge branch docs này); nếu mới hơn, agent đọc `git log` từ `48b2cf3` trước N1 và ghi vào file tiến độ những gì đổi ở các file thẻ chạm | `git fetch && git status && git log --oneline origin/main -5` |
| 3 | CI xanh trên `main`; cục bộ `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:screens` xanh (agent chạy lại ở N0 và ghi số) | — |
| 4 | Preview không chạy (cổng 3000, 4300, 4100, 4400 trống); máy không ngủ; hạn mức phiên đủ 16 giờ | `preview_list` trống; `ccd_host request_keep_awake` |
| 5 | Supabase và Vercel không cần: đêm nay chỉ PGlite và build cục bộ | — |

---

## 2. Lịch đêm

Thời gian là trần ước lượng. Thứ tự theo **rủi ro thấp trước, giá trị cao trước**: seed → Ban ngày → Kệ → Agent (chỉ API) → Lịch → Hoa hồng. Hai việc cuối tuỳ chọn. Sáng sau còn việc chưa xong là bình thường.

### N0 · 0:00 · Khởi động (15 phút)

- Kiểm điều kiện 1–2. Tạo `docs/NIGHT_BUILD_2026-10-19.md` từ mẫu mục 4: commit xuất phát, kết quả bốn lệnh kiểm tra với số bài, giờ bắt đầu, dòng "D5b = A, D3c = A (mặc định, chủ sản phẩm đổi được)" chép vào roadmap mục "Growth plan".
- `git checkout -b night/2026-10-19` từ `main`.
- Đọc thẻ 4, 5, 1, 3, 6 và mục 7 của handoff một lần; không đọc lại giữa đêm trừ khi code khác với handoff.

### N1 · 0:15 · W0: seed xấu như production (45 phút)

- **Mục tiêu:** dữ liệu cho mọi việc sau có trong `test/fixtures/seed.ts` và fixture ingest.
- **Làm:** một coffee rave 09:00–13:00 ở TP.HCM style house, `entry_mode` paid, giá có, không ảnh (tile chữ); một kệ `enabled` trong khung ngày với 3 sự kiện live sắp tới, một trong số đó cũng là lễ hội flagship (để test một tag); `ambassador_pct` chưa có cột: để N8 thêm vào seed; fixture `test/fixtures/ingest/organizer-calendar.ics` với 3 VEVENT (một không `LOCATION`, một `TZID` Asia/Tokyo cho sự kiện TP.HCM, một `STATUS:CANCELLED`) và một trùng tên-ngày với sự kiện live của Ravolution, một trùng với sự kiện của NTC khác; `services/analytics.ts`: `SERVER_EVENTS` thêm `calendar_connected`, `ambassador_sale`, `agent_call`; `ALLOWED_PROPS` thêm `tool`.
- **Test:** `npm test` xanh với seed mới (các bài đếm số sự kiện của seed phải sửa theo); `newcomer.spec.ts` ghi lại `IN_SIGHT` thật nếu seed làm số **giảm** (không bao giờ tăng).
- **Cổng:** `npm run typecheck`; `node --test test/public.test.ts test/analytics.test.ts`; `npx playwright test -c playwright.next.config.ts e2e/next/newcomer.spec.ts e2e/next/home.spec.ts`.
- **Commit:** `Seed: a day party, a shelf of three and an organiser calendar fixture for the growth plan`.

### N2 · 1:00 · Thẻ 4 P0: loại `day` (1 giờ)

- **Mục tiêu:** `event_type = 'day'` hợp lệ; Radar gán đúng; fit có điểm.
- **Làm:** migration `048_day_events.sql` nới CHECK của `events.event_type` và `projects.event_type` (tên constraint từ `pg_constraint`); `lib/styles.ts` `EVENT_TYPES` thêm `'day'` trước `'other'`, nhãn `L('Day party', 'Ban ngày')`; `inferEventType`: luật `day` **ngay sau** festival và **trước** `rave`/`concert`/`club`/`party`/`show`: từ khoá `coffee rave|matcha rave|day ?party|daytime|morning rave|sunset session|sunrise|tiệc ban ngày|ban ngày|sober rave|wellness rave` **hoặc** `startTime` trong 06:00–15:59 và `endTime` có mặt và < 21:00; `fit.ts:82-85` `day` cùng điểm `party`; `CLAUDE.md` bump "The next one is `049_*.sql`" và dòng mới ở mục "EDM only".
- **Test:** `test/radar.test.ts` 6 ca của thẻ 4; `test/public.test.ts` `?type=day`; `test/edm.test.ts` (gương `lib/styles.ts` ↔ `kd/genre.ts`) vẫn xanh.
- **Cổng:** `node --test test/radar.test.ts test/public.test.ts test/edm.test.ts test/ingest.test.ts`.
- **Commit:** `Day parties are an event type: inferred before the rave and party keywords (migration 048)`.

### N3 · 2:00 · Thẻ 4 P1: nhãn menu, Markdown (45 phút)

- **Làm:** `kd/web/list/copy.ts:22` `kind` → `{ en: 'Kind', vi: 'Loại' }` và dòng th/ja/id theo khoá `Kind`; `TYPE_CHIPS` giữ nguyên; `services/seo/text.ts` (hoặc nơi `pageMarkdown`) ghi "Loại: Ban ngày"; không tag trên thẻ.
- **Test:** `list.spec.ts`: menu máy tính có "Ban ngày", chọn nó còn 1 thẻ seed; `languages.spec.ts` xanh; `visual.spec.ts` chạy cục bộ (`FF_VISUAL=1`) và ghi vào file tiến độ ảnh nào đổi (thanh lọc) để người xem sáng sau.
- **Cổng:** `npx playwright test -c playwright.next.config.ts e2e/next/list.spec.ts e2e/next/languages.spec.ts e2e/next/newcomer.spec.ts`.
- **Commit:** `The kind picker is "Loại": day parties fit in it; the event's Markdown names its kind`.

### N4 · 2:45 · Thẻ 5: kệ trả tiền trong ô nổi bật (2 giờ)

- **Mục tiêu:** `/shelves` nói kệ nào trả tiền và lọc theo thành phố; thẻ trong kệ bật mang "Nổi bật"; trang chủ vẽ kệ trong ô nổi bật có sẵn (D5, D5b); tech debt 17 đóng.
- **Làm (API):** `routes/catalog.ts` `/shelves` thêm `sponsored` (kệ có mục đến từ boost request được duyệt hoặc `ad_campaigns` placement `featured`; đọc nơi boost được duyệt trong `routes/admin/*` để biết dấu vết) và `?city=`; `CARD_COLUMNS` suy `featured` = `e.featured or exists (shelf bật, trong khung ngày, chứa e)`; không ghi cột.
- **Làm (web):** `kd/web/list/page.tsx` lấy `/shelves` song song; `highlight` = kệ đầu tiên có ≥ 3 mục, không thì flagship, không bao giờ cả hai; tiêu đề `kd-d3` tên kệ, aside `kd-m` `Được tài trợ · Sponsored` khi `sponsored` (dòng th/ja/id theo khoá `Sponsored`, có thể đã có từ quảng cáo: tái dùng); `browser.tsx:416` vẽ `highlight` khi bộ lọc mặc định **hoặc** `f.city` nằm trong các thành phố của kệ (D5b); thẻ mở từ ô này: `/events/:id/track` `source: 'shelf'`, `FF.track('card_open', { surface: 'shelf' })`; `kd/fresh-paths.ts` kind `s` → `/`, `/en`; `kd/console/featured.tsx` gọi `freshen('s', slug)` sau mỗi lưu kệ; `TECH_DEBT.md` 17 "Resolved 2026-10-19 (night build)".
- **Test:** `test/public.test.ts`: `/shelves` `sponsored`, `?city=`, chỉ live sắp tới, thẻ trong kệ có `featured: true`; `home.spec.ts`: ô kệ 3 thẻ ở 390 và 1440, nhãn khi sponsored, một tag mỗi thẻ (thẻ vừa lễ hội vừa kệ); `newcomer.spec.ts` `IN_SIGHT.home` không tăng; `layout.spec.ts` trang chủ; `visual.spec.ts` cục bộ ghi ảnh đổi.
- **Cổng:** `node --test test/public.test.ts`; `npx playwright test -c playwright.next.config.ts e2e/next/home.spec.ts e2e/next/newcomer.spec.ts e2e/next/layout.spec.ts`.
- **Commit:** `A paid shelf takes the home page's one highlight surface, labelled sponsored, and reaches a chosen city (tech debt 17)`.

### N5 · 4:45 · Thẻ 6: MCP và /list.md (2 giờ)

- **Mục tiêu:** `POST /mcp` và `GET /list.md` chỉ đọc, stateless, rate-limit, không dữ liệu người xem; llms.txt nêu chúng.
- **Làm:** `npm i @modelcontextprotocol/sdk@1.32` trong `festfinder-backend` (kiểm `import` chạy trên Node 24 type stripping; lỗi thì import từ `dist`); `routes/agent.ts` đăng ký trong `app.ts`: `/list.md` gọi cùng service với `/events` (không SQL mới), Markdown theo thẻ 6, tối đa 50, cursor; `/mcp` với `StreamableHTTPServerTransport` stateless, `handleRequest(req.raw, reply.raw, req.body)` sau `reply.hijack()`; 6 tool với zod; resource `feestfinder://llms.txt`; `config.rateLimit` 60/phút; analytics `agent_call` prop `tool`; `PUBLIC_READS` thêm `/^\/list\.md$/`; `services/seo/*` `llmsTxt` mục `## Agents`, `robotsTxt` một dòng; `CLAUDE.md` bảng "Where things are" thêm `routes/agent.ts` và quy tắc của thẻ 6; `docs/CURRENT_ARCHITECTURE.md` mục Discovery API.
- **Test:** `test/agent.test.ts` (mới) theo thẻ 6 (initialize, tools/list 6, search_events chỉ live và không held, priceMax theo tiền thành phố, slug lạ → lỗi JSON-RPC, 61/phút → 429, NUL → invalid_input, `/list.md` đúng số seed); `test/seo.test.ts` mục Agents; `test/webproxy.test.ts` không đổi (proxy đã coi `.md` và `/mcp` là của API).
- **Cổng:** `node --test test/agent.test.ts test/seo.test.ts test/webproxy.test.ts`; `npm run typecheck`; `npm run lint; echo "lint $?"` (phụ thuộc mới có thể thêm cảnh báo: không vượt ngân sách).
- **Commit:** `A read-only MCP server and /list.md for agents, named in llms.txt`.

### N6 · 6:45 · Thẻ 1 P0: lịch kết nối là nguồn của nhà tổ chức (3 giờ)

- **Mục tiêu:** NTC nối một URL ICS hay trang JSON-LD; sự kiện mới về `in_review` dưới tên họ, `origin = posted`; không gộp sang NTC khác; sự kiện live chỉ được điền chỗ trống.
- **Làm:** migration `049_organizer_calendar.sql` (`ingest_sources.organizer_id` + unique partial index; `CLAUDE.md` bump `050`); `run.ts`: `createCandidate` nhận `organizerId` (giữ `holder` cho Radar); trong `resolveAndApply`, khi `source.organizer_id` và match thuộc NTC khác → không attach/enrich, tạo candidate dưới NTC của nguồn, `flagRisk` với `match`; khi match cùng NTC → attach + `enrich` (mở `enrich` cho `source.organizer_id === ev.organizer_id`: ảnh, lineup, pin như `is_community`); thêm dòng `event_sources` provider `organizer` cạnh dòng adapter; bỏ `FIT_FLOOR` cho nguồn có `organizer_id` nhưng vẫn `refreshFit`; `notifyAdmins` một lần mỗi đợt có sự kiện mới; `routes/organizer/calendar.ts` `GET/POST/DELETE /organizer/calendar` (thành viên NTC; placeholder → 400; `https` bắt buộc; adapter theo `.ics`/`text/calendar` hay `website`; fetch thử qua `IngestIO` ≥ 1 record hợp lệ, lỗi `no_events`/`robots`/`unreachable`; `authority 'official'`, `interval_minutes 360`, `config.requireStyle false`; chạy ngay một lần trong 20 s; rate-limit 5/phút; analytics `calendar_connected`); `ARCHITECTURE` bảng nguồn.
- **Test:** `test/ingest.test.ts` với fixture N1: 3 sự kiện `in_review` thuộc Ravolution, `origin posted`, hai dòng `event_sources`; chạy lại không tạo thêm; `CANCELLED` → rejected; record trùng sự kiện live của Ravolution → merged, chỉ điền chỗ trống, tin vẫn live và **không** đổi giờ; record trùng NTC khác → candidate riêng có flag; `http://` → 400; fixture rỗng → `no_events`; `test/organizer.test.ts`: 403 ngoài thành viên, 400 placeholder.
- **Cổng:** `node --test test/ingest.test.ts test/organizer.test.ts test/radar.test.ts`.
- **Commit:** `An organiser connects a calendar: its nights are posted under the organiser and wait for review (migration 049)`.

### N7 · 9:45 · Thẻ 1 P1: lịch nhúng (3 giờ)

- **Mục tiêu:** `/embed/organizers/:slug` (+ `.ics`) công khai mở CORS; widget `ff-widget.js`; khối "Lịch" trong Studio › Hồ sơ.
- **Làm:** `routes/embed.ts` theo thẻ 1 (server dựng `dateLabel`, `timeLabel`, giá bằng `lib/format.ts`; `Access-Control-Allow-Origin: *` trong route; `PUBLIC_READS` thêm `/^\/embed\//`; `.ics` tái dùng writer của `routes/event-actions.ts:116-130`); `festfinder-frontend/ui/widget/ff-widget.js` (vanilla, Shadow DOM, < 8 KB gzip, `data-ff-org|lang|theme|limit|api`); `festfinder-web/scripts/copy-ui.ts` thêm `widget`; `kd/studio/profile.tsx` khối "Lịch" với hai phần theo bảng chữ của thẻ 1, copy trong `kd/studio/copy.ts`; `kd/web/event/context.tsx` `event_view` prop `source: 'widget'` khi `?src=widget`.
- **Test:** `test/embed.test.ts` (mới) theo thẻ 1; e2e `widget.spec.ts` (mới): `page.setContent` nhúng từ `:3100` với `data-ff-api` `:4100`, đúng số dòng, click mở `/e/<slug>?src=widget`; `studio.spec.ts` khối Lịch ở 390 không cuộn ngang; `routes.ts` không đổi (`/studio/profile` đã có).
- **Cổng:** `node --test test/embed.test.ts`; `npx playwright test -c playwright.next.config.ts e2e/next/widget.spec.ts e2e/next/studio.spec.ts e2e/next/layout.spec.ts`; `npm run typecheck`.
- **Commit:** `Embed calendar: /embed/organizers/:slug and its .ics feed, the widget, and the Studio "Lịch" block`.

### N8 · 12:45 · Thẻ 3 P0: hoa hồng trên đơn (3 giờ)

- **Mục tiêu:** đơn đã trả qua `?ref=` sinh earnings đúng số; hoàn tiền → void; `GET /me/commission`.
- **Làm:** migration `050_ambassadors.sql` đúng SQL của thẻ 3 (`events.ambassador_pct`, `orders.ref_user`, `ambassador_earnings`, `ambassador_payouts`; `CLAUDE.md` bump `051`); `routes/commerce.ts` `CheckoutInput` thêm `ref` (regex `^[2-9A-HJ-NP-Z]{6}$`), ghi `orders.ref_user` khi hợp lệ và `ref_user <> coalesce(user_id, '00000000-0000-0000-0000-000000000000')`, bỏ qua im lặng khi không; earnings khi đơn `paid` ở cả webhook VietQR và nhánh mock/0 đồng, `amount = round(total * pct / 100)`, không sinh khi `total = 0`; `routes/organizer/audience.ts` refund → `void`; `GET /me/commission`; `PATCH` sự kiện của NTC nhận `ambassadorPct` (1–20, null tắt); `services/eventpage.ts` trả `ambassadorPct` và `mine.commission`; seed đặt `ambassador_pct = 10` cho `ravo`; `/me` `counts.commission`.
- **Test:** `test/ambassador.test.ts` (mới) theo thẻ 3 (vé 350.000, giảm 50.000, 10% → 30.000; tự mua → không; không % → không; hoàn → void; 25% → 400; `GET /me/commission` đúng tổng); `test/attendee.test.ts`, `test/organizer.test.ts` vẫn xanh.
- **Cổng:** `node --test test/ambassador.test.ts test/attendee.test.ts test/organizer.test.ts test/resale.test.ts`.
- **Commit:** `Ambassador commission: a paid order through a share link earns the sharer the organiser's percentage (migration 050)`.

### N9 · 15:45 · Thẻ 3 P1: màn hình (2,5 giờ)

- **Làm:** sheet chia sẻ dòng `Hoa hồng {p}%` chỉ khi có % **và** đã đăng nhập; `context.tsx` lưu `ff:ref:<eventId>` 30 ngày; checkout (`kd/app/checkout.tsx`) gửi `ref`; `kd/web/me.tsx` hàng `Hoa hồng` aside chỉ khi `counts.commission > 0`; `/app/commission` (`src/app/(kd)/app/commission/page.tsx`, `kd/app/commission.tsx`: `Table`/`Row`, trạng thái, nút phụ "Tài khoản nhận tiền", rỗng một câu một hành động; `/app/*` đã trong `kd/cutover.ts`); `e2e/next/routes.ts` fan thêm `/app/commission`; `perf.spec.ts` đo một lần và ghi ngân sách; Studio editor bước Vé switch + `%`; `payouts.ts` `LedgerLine` âm trong `post_event`, `advance` trên gross trừ hoa hồng; cột "Đại sứ" ở attendees.
- **Test:** `event.spec.ts` sheet có dòng khi đăng nhập, không khi chưa; `app-more.spec.ts` `/app/commission` ở 390 và 1440 (rỗng và có dữ liệu); `studio-events.spec.ts` ô %; `newcomer.spec.ts` không đổi; `layout`, `wcag`, `targets` cho route mới.
- **Cổng:** `npx playwright test -c playwright.next.config.ts e2e/next/event.spec.ts e2e/next/app-more.spec.ts e2e/next/studio-events.spec.ts e2e/next/newcomer.spec.ts e2e/next/layout.spec.ts e2e/next/targets.spec.ts e2e/next/wcag.spec.ts e2e/next/perf.spec.ts`.
- **Commit:** `Commission on the screens: the share sheet, "Hoa hồng" in Tôi, /app/commission, the organiser's percentage and ledger line`.

### N10 · 18:15 · Thẻ 3 P2: job tất toán và tab Console (1 giờ, tuỳ chọn)

- **Làm:** job `settleAmbassadors` (mỗi giờ): `payable` khi `ends_at + 24h` và đơn không hoàn; gom `ambassador_payouts` theo kỳ, ngưỡng 50.000; `/console/affiliate` tab "Đại sứ" đánh dấu đã trả (như partner payouts); `CLAUDE.md` dòng của thẻ 3.
- **Cổng:** `node --test test/ambassador.test.ts test/jobs.test.ts`; `npx playwright test -c playwright.next.config.ts e2e/next/console.spec.ts`.
- **Commit:** `Commission settles after the night: payable, then paid by period from the Console`.

### N11 · 19:15 · Đóng đêm (1 giờ)

- Trên `night/2026-10-19`: `npm run typecheck`; `npm run lint; echo "lint $?"` (cả hai package); `npm test`; `npm run test:screens` **cả bộ**; `npx tsc --noEmit -p .` và `npm run lint` trong `festfinder-web/`.
- `FF_VISUAL=1` chạy `visual.spec.ts` cục bộ; ghi danh sách ảnh đổi (trang chủ với kệ, thanh lọc với "Loại") vào file tiến độ. **Không** chụp lại baseline.
- Push `night/2026-10-19`. Viết mục "Sáng sau" của file tiến độ (mẫu mục 4). Cập nhật roadmap "Growth plan": tick lát đã xong, ghi số thật từ `newcomer.spec.ts` (IN_SIGHT trước và sau).
- Thẻ 1 P2 (`proposeRevision`, bản sửa từ lịch) **không** làm trong đêm: nó tách logic khỏi `routes/organizer/events.ts:336` và cần người xem; ghi là việc tiếp theo.

---

## 3. Những gì dễ hỏng trong đêm và cách tránh

| Chỗ | Vì sao | Làm |
| --- | --- | --- |
| `inferEventType` | từ khoá `rave`/`party` khớp trước giờ | luật `day` đứng ngay sau festival (N2); test "coffee rave" là cổng |
| Ô nổi bật và phase 13 | `browser.tsx:416` chỉ vẽ ở bộ lọc mặc định | điều kiện D5b (N4); `newcomer.spec.ts` chạy với seed có kệ |
| Hai nguồn sự thật cho `featured` | admin đặt tay, kệ không chạm cột | suy trong `presentCard`, không ghi cột (N4) |
| Gộp sang NTC khác | `resolveAndApply` không biết NTC | nhánh `organizer_id` (N6); test trùng NTC khác là cổng |
| `enrich` đổi sự kiện live | hôm nay chỉ điền chỗ trống | giữ vậy trong đêm; bản sửa là việc sau |
| `/embed` và CORS | plugin cors theo danh sách origin | header `*` trong route, không credentials; test header là cổng |
| `orders.user_id` sắp nullable | guest checkout phase 17 | `coalesce` trong kiểm tự giới thiệu (N8) |
| `advance` 50% vượt số còn lại | ledger không biết hoa hồng | `advance` trên gross trừ hoa hồng (N9) |
| MCP và Fastify | body đã parse, SDK tự viết response | `reply.hijack()` + `handleRequest(req.raw, reply.raw, req.body)` (N5) |
| Lint budget | phụ thuộc mới, file mới | `npm run lint; echo $?` sau mỗi việc; hạ ngân sách nếu giảm được, không tăng |
| Perf budget | `/app/commission` mới, trang chủ thêm fetch | đo một lần, ghi số; trang chủ: `/shelves` song song, không thêm JS client ngoài điều kiện D5b |
| Dịch th/ja/id | dòng công khai mới: "Loại", "Được tài trợ" (có thể đã có), "Ban ngày" | thêm theo khoá tiếng Anh ở N3, N4; `languages.spec.ts` |

---

## 4. Mẫu file tiến độ `docs/NIGHT_BUILD_2026-10-19.md`

```
# Night build 2026-10-19

Xuất phát: main <sha>. Kiểm tra lúc bắt đầu: typecheck ok · lint ok (<n> cảnh báo / ngân sách) · test <m> bài (<p> qua, <s> bỏ) · screens <k> bài.
Quyết định dùng: D1, D3, D4, D5, D6 = A (chủ SP 2026-10-19); D5b = A, D3c = A (mặc định); Zalo OA để sau.

| N | Việc | Bắt đầu | Kết thúc | Kết quả | Branch · commit | Cổng | Ghi chú |
| N1 | Seed | 0:15 | 0:52 | xong | night/2026-10-19-N1 · <sha> | xanh | newcomer IN_SIGHT home 20 → 20 |
| N2 | … | | | xong / bỏ / dừng vì quyết định | | | |

## Ảnh đổi (visual.spec cục bộ, cho người xem sáng sau)
- home-phone: ô nổi bật là kệ seed (dự kiến)
- filters-desktop: nhãn "Loại" (dự kiến)

## Sáng sau
- Đã xong: …  · Chưa xong: … (vì …)
- Số: newcomer IN_SIGHT home/event trước → sau; perf JS trang chủ trước → sau; lint cảnh báo trước → sau; test tổng.
- Cần chủ sản phẩm: xác nhận hoặc đổi D5b, D3c; mở PR nào (gợi ý: một PR mỗi thẻ từ các branch N, hoặc một PR cho night/2026-10-19); xem ảnh đổi rồi gắn visual-ok; đặt `ANTHROPIC_API_KEY` không liên quan đêm nay.
- Việc tiếp theo: thẻ 1 P2 (bản sửa từ lịch), thẻ 2 khi điều kiện đúng.
```

## 5. Sáng sau, cho chủ sản phẩm (15 phút)

1. Đọc `docs/NIGHT_BUILD_2026-10-19.md`.
2. `git log --oneline main..night/2026-10-19` để thấy từng việc; muốn bỏ việc nào: `git revert -m 1 <merge sha>` trên branch đêm.
3. Mở PR (bảo agent): theo thẻ, nhánh N4+N5 (thẻ 4), N6 (thẻ 5), N7 (thẻ 6), N8+N9 (thẻ 1), N10–N12 (thẻ 3); mỗi PR mang checklist "Thiết kế" đánh thật và ô ảnh để trống; xem `visual-diff`, gắn `visual-ok`; "merge" từng cái.
4. Sau deploy: chạy script phụ lục A của handoff trên production, ghi cột mới vào roadmap; tạo một kệ 3 sự kiện trong Console để thấy ô nổi bật thật.
