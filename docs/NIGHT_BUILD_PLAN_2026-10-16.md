# Night build plan: một đêm, 12 việc, không deploy

- Ngày viết: 2026-10-16 · Dành cho: Claude Code chạy nhiều giờ liền, không có người xem · Chủ sản phẩm đọc sáng hôm sau.
- Đây là tài liệu **tự đứng được**: agent chỉ cần `CLAUDE.md` và file này. Chi tiết nền nằm ở `docs/HANDOFF_2026-10-16_ux-audit.md` (W0–W10), `docs/TECH_LEAD_REVIEW_2026-10-16.md` (mục 5b, 6) và `docs/TECH_LEAD_AUDIT_2026-10-16_performance-quality.md` (P1, P3, Q1). Khi file này và các file đó khác nhau, **file này thắng**.
- Trạng thái: **chưa chạy**. Chạy khi chủ sản phẩm nói "bắt đầu night build".

---

## 0. Luật của đêm

1. **Chỉ làm việc đã có quyết định.** Các quyết định dùng trong đêm: D1 (không thu phí), D4 mặc định (sửa tin đang bán: bản tạm, tin vẫn hiện), D8 mặc định (báo cáo: báo admin, tài khoản mới tính nửa), D13 (thư mục nghệ sĩ là hồ sơ có chủ; tên chưa nhận ở `/a/radar`; follow theo id; hồ sơ nghệ sĩ là chính thức; bắt tay lineup), và quy tắc bố cục (lấp đầy bề ngang, không cuộn ngang). Gặp quyết định mới: **dừng việc đó, ghi vào file tiến độ, sang việc kế.**
2. **Mỗi việc một branch `night/<ngày>-N<k>`, một commit**, tác giả `git -c user.name="Claude" -c user.email="noreply@anthropic.com"`, dòng cuối `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Cuối đêm gộp vào `night/<ngày>` bằng merge thường (không squash) để sáng sau revert được từng việc.
3. **Không push `main`, không deploy, không chạy `vercel`.** Push nhánh `night/<ngày>` lên origin để CI chạy (web project chỉ build `main`, API có preview deployment trên staging: chấp nhận).
4. **Cổng:** mỗi việc có test riêng (cột "Cổng"). Đỏ thì sửa tối đa 2 lần; vẫn đỏ thì `git stash`/bỏ branch, ghi lý do, sang việc kế. **`layout.spec.ts` (N11) đỏ ở việc nào thì việc đó chưa xong.**
5. **Sau mỗi việc, ghi `docs/NIGHT_BUILD_<ngày>.md`** theo mẫu ở mục 4, trước khi bắt đầu việc kế. Bị dừng giữa chừng (hết hạn mức, máy ngủ) thì sáng sau vẫn đọc được.
6. **Không làm trong đêm** dù còn giờ: gộp web và app (W1), gộp wizard và editor (W5.2), hộp việc Console (W3.1), trung tâm thông báo (W2), ba màn hình của bắt tay lineup (W10.11 phần UI). Chúng cần người xem bằng mắt.
7. **Không** đặt secret, token, mật khẩu vào repo; **không** gọi ra site ngoài trong test (fixture only); **không** sửa migration đã ship; số migration tiếp theo là `040`.
8. **Chuỗi hiển thị** song ngữ qua `L()` / `pick()`, tên gọi theo bảng W7.8 của handoff ("Quảng cáo" không "Đẩy tin"; "Đang duyệt" không "Chờ duyệt"). UI gọn: tiêu đề và hành động, không câu giải thích.
9. **Bố cục:** mọi màn chạm tới phải lấp đầy bề ngang ở 390 và 1440 px, không cuộn ngang ở bất kỳ route nào, kể cả khi mở drawer, sheet, menu. Bảng dưới 760 px thành thẻ. Không dựa vào `overflow-x: auto` (thanh cuộn bị ẩn, người dùng không thấy).

---

## 1. Điều kiện trước khi bắt đầu (chủ sản phẩm, 10 phút)

| # | Điều kiện | Cách kiểm |
| --- | --- | --- |
| 1 | Chủ sản phẩm ghi một dòng vào `docs/FEESTFINDER_ROADMAP.md`: "2026-10-xx: night build chạy với D1, D4 (mặc định), D8 (mặc định), D13 và quy tắc bố cục" | Agent đọc dòng đó; không có thì không bắt đầu |
| 2 | `main` sạch và bằng `origin/main`; 4 file docs của ngày 16/10 đã commit | `git status`, `git fetch && git diff origin/main --stat` trống |
| 3 | CI xanh trên `main`; cục bộ `npm run typecheck`, `npm test` (368: 367 qua, 1 bỏ qua), `npm run test:screens` (211) xanh | Agent chạy lại cả ba trước N1, ghi số vào file tiến độ |
| 4 | Preview **không** chạy (cổng 3000, 4300, 4100 trống); máy không ngủ; hạn mức phiên đủ cho 15 giờ | `preview_list` trống; `ccd_host request_keep_awake` |
| 5 | Supabase và Vercel **không** cần: đêm nay chỉ PGlite và build cục bộ | — |

---

## 2. Lịch đêm

Thời gian là ước lượng; mỗi dòng có mục tiêu, việc làm với file, test, và cổng. Thứ tự là bắt buộc vì N2 tách file mà N3, N4 sửa; N7 làm migration mà N7b dùng chung; N11 cần mọi màn đã xong.

### N0 · 0:00 · Khởi động (15 phút)

- Tạo `docs/NIGHT_BUILD_<ngày>.md` từ mẫu mục 4. Ghi: commit `main` xuất phát, kết quả ba lệnh kiểm tra ở điều kiện 3, giờ bắt đầu.
- `git checkout -b night/<ngày>` từ `main`; mỗi việc rẽ từ nhánh này và merge lại vào nó khi qua cổng.

### N1 · 0:15 · Bỏ phí dịch vụ 5% (D1) · ~45 phút

- **Mục tiêu:** checkout và Pass vé không cộng phí; tổng bằng giá vé trừ giảm giá; câu "không thu phí đặt vé" trên trang sự kiện, FAQ, `/about` thành đúng.
- **Làm:**
  - `routes/commerce.ts:20,58,71,76`: bỏ `SERVICE_FEE_PCT`; `fee = 0`; bỏ `feeLabel` và dòng "Phí dịch vụ" khỏi `lines`; `total = subtotal - discount`. Cột `orders.fee` giữ, ghi 0.
  - `services/resale.ts:10`: `RESALE_FEE_PCT = 0`; `services/eventpage.ts:70`, `routes/resale.ts:68` trả `feePct: 0`; `kd/web/copy.ts:124` (`resaleFee`) không hiện khi 0.
  - `kd/app/checkout.tsx`: không render dòng phí khi `fee === 0`; tóm tắt đơn còn hai dòng (vé, giảm giá nếu có) và tổng.
  - Không đọc `process.env.SERVICE_FEE_PCT` nữa; ghi vào file tiến độ: "chủ SP xoá biến `SERVICE_FEE_PCT` trên Vercel nếu có".
- **Test:** `test/attendee.test.ts`, `test/resale.test.ts`: sửa các khẳng định phí 5% thành 0; thêm: đơn 1 vé 350.000 có `fee = 0`, `total = 350.000`; giá Pass vé bằng giá niêm yết. E2E `event.spec.ts`: checkout không có chữ "Phí dịch vụ", tổng bằng giá trên trang sự kiện.
- **Cổng:** `node --test test/attendee.test.ts test/resale.test.ts`; `npx playwright test -c playwright.next.config.ts e2e/next/event.spec.ts`.
- **Commit:** `No booking fee: checkout and ticket passes charge the ticket price alone`.

### N2 · 1:00 · Bỏ cấp admin qua Console; tách `admin/ops.ts` · ~1 giờ

- **Mục tiêu:** không route, không nút nào cấp admin; `routes/admin/ops.ts` (1.030 dòng) thành 4 file.
- **Làm:**
  - Tách `routes/admin/ops.ts` thành `admin/users.ts`, `admin/orders.ts`, `admin/venues.ts`, `admin/insights.ts` (giữ phần còn lại trong `ops.ts` nếu có); đăng ký trong `app.ts`; **không đổi hành vi**.
  - Trong `admin/users.ts`: route `PATCH /admin/users/:id` không nhận `role` nữa (xoá route nếu nó không làm gì khác). Console `kd/console/users/*`: bỏ nút "Cấp quyền admin" và "Gỡ quyền admin"; drawer hiện "Admin (từ ADMIN_EMAIL)" dạng chữ khi `role === 'admin'`.
  - Giữ `syncAdmins` và đường Google trong `auth.ts` nguyên vẹn.
- **Test:** `test/admin.test.ts`: `PATCH /admin/users/:id` với `{role:'admin'}` trả 404 hoặc 400 và `role` không đổi; người không phải admin gọi mọi route admin mới tách vẫn 403 (thêm một vòng lặp qua 4 file). E2E `console.spec.ts` hoặc `console-orgs.spec.ts`: drawer tài khoản không có nút cấp quyền.
- **Cổng:** `node --test test/admin.test.ts test/ops.test.ts`; `npm run typecheck`.
- **Commit:** `Admin comes only from ADMIN_EMAIL: the Console can no longer grant it; admin/ops.ts split by area`.

### N3 · 2:00 · Sửa tin đang bán không còn làm trang 404 (D4 bản tạm) · ~1,5 giờ

- **Mục tiêu:** NTC sửa trường được duyệt (`REVIEWED_FIELDS`, `routes/organizer/events.ts:95`) của tin `live` thì tin **vẫn `live`**, mang cờ chờ duyệt; Console thấy nó trong hàng chờ như một "bản sửa"; duyệt thì xoá cờ, trả lại thì phục hồi giá trị cũ từ audit.
- **Làm:**
  - Migration `040_event_needs_review.sql`: `alter table events add column needs_review_at timestamptz;` cộng `needs_review_fields text[] not null default '{}'`, `needs_review_before jsonb` (giá trị cũ của các trường đó); chỉ mục partial `events_needs_review (needs_review_at) where needs_review_at is not null`. Ghi comment mở đầu vì sao, khối RLS như `034_projects.sql` nếu tạo bảng (ở đây không tạo bảng). Bump "The next one is `041_*.sql`" trong `CLAUDE.md`.
  - `routes/organizer/events.ts:308-313`: thay nhánh `sendsBack`: không đổi `status`; ghi `needs_review_at = now`, `needs_review_fields`, `needs_review_before` (gộp với bản trước nếu đang chờ). `notifyAdmins` như `askForReview` với tiêu đề "Bản sửa: <tin>". Hộp thoại ở `kd/studio/copy.ts:463` ghi đúng các trường đã đổi (lấy từ `REVIEWED_FIELDS` có nhãn) và câu "Trang vẫn hiện trong lúc đội duyệt".
  - Hàng chờ Console (`routes/admin/moderation.ts`, `kd/console/moderation/*`): mục có `needs_review_at` xuất hiện với nhãn "Bản sửa", phần chi tiết hiện bảng trước → sau cho `needs_review_fields`. Duyệt: xoá ba cột. Trả lại: viết `needs_review_before` ngược vào tin, xoá ba cột, gửi thư kiểm duyệt như hiện nay.
  - Số đếm `/admin/counts` cộng bản sửa vào hàng chờ.
- **Test:** `test/organizer.test.ts`, `test/review.test.ts`: sửa tên tin live → `GET /events/<slug>` 200 với tên mới, tin có trong hàng chờ với `kind: 'revision'`; duyệt → cờ xoá; trả lại → tên cũ quay lại; admin (`teamSession`) sửa thì không có cờ. Sửa test cũ đang khẳng định `in_review`.
- **Cổng:** `node --test test/organizer.test.ts test/review.test.ts test/admin.test.ts`; `npx playwright test ... e2e/next/studio-events.spec.ts e2e/next/console-review.spec.ts`.
- **Commit:** `A live listing stays live while its edit waits for review (migration 040)`.

### N4 · 3:30 · Báo cáo: một thẻ mỗi đối tượng, cảnh cáo đúng, báo admin (D8) · ~1 giờ

- **Mục tiêu:** `/console/reports` gom theo đối tượng; "Bỏ qua" và "Cảnh cáo" áp cho cả đối tượng; `held_for_reports` tính lại theo ngưỡng; admin được báo khi một tin bị tự ẩn; báo cáo của tài khoản dưới 7 ngày tính nửa; không cảnh cáo tổ chức giữ chỗ.
- **Làm:**
  - `routes/admin/moderation.ts:357-361,392`: group by `(target_type, target_id)`, lý do thành mảng; `dismiss` và `warn` nhận id đối tượng, cập nhật mọi báo cáo mở của nó; sau `dismiss` tính lại `held_for_reports = (trọng số báo cáo mở ≥ ngưỡng)`.
  - `routes/event-actions.ts:44` (chỗ đặt `held_for_reports = true`): trọng số = 1, hoặc 0,5 khi `users.created_at` dưới 7 ngày; khi lần đầu vượt ngưỡng gọi `notifyAdmins(kind: 'listing_hidden')` với link tới `/console/reports?target=<id>`.
  - `warn`: bỏ qua khi `organizers.is_community` (tổ chức giữ chỗ).
  - `kd/console/reports/*`: một thẻ mỗi đối tượng, lý do liệt kê bên trong, số người báo đúng; câu trong hộp thoại "Bỏ qua" (`moderation/copy.ts:24`) đúng với hành vi mới.
- **Test:** `test/review.test.ts` hoặc `test/ops.test.ts` (nơi đang test báo cáo): hai báo cáo hai lý do trên một tin → một mục; bỏ qua → tin hiện lại; cảnh cáo một lần dù hai lý do; hai tài khoản 1 ngày tuổi → chưa ẩn (0,5 + 0,5 < 2); tin bị ẩn → admin có thông báo `listing_hidden`; tin của `is_community` không bị cảnh cáo.
- **Cổng:** test trên xanh; `npx playwright test ... e2e/next/console-moderation.spec.ts`.
- **Commit:** `Reports: one case per listing, warnings per listing, admins told when a listing is hidden`.

### N5 · 4:30 · Font gọn: trang Việt không tải latin-ext, JP, Thai · ~1 giờ

- **Mục tiêu:** trang tiếng Việt tải 2 lát Noto Sans (vietnamese 14 KB, latin 35 KB); latin-ext chỉ khi có ký tự Âu khác; Thai và JP chỉ khi có chữ Thái hoặc Nhật; không còn file CSS 98 KB của gói JP.
- **Làm:**
  - Bỏ ba import `@fontsource-variable/*` trong `app/(kd)/layout.tsx`. Giữ ba gói trong `package.json` (file woff2 lấy từ đó).
  - Tạo `src/kd/fonts.css` (import trong layout trước `kd.css`) với `@font-face` tự viết, `font-display: swap`, `src: url()` trỏ tới file trong `node_modules/@fontsource-variable/…/files/` (Next bundler sao chép và băm tên). Ba face Noto Sans: `vietnamese` (dải gốc của gói), `latin` (dải gốc), `latin-ext` với dải **đã bỏ** các điểm trùng vietnamese: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB. Noto Sans Thai: một face, dải U+0E01-0E5B, U+200C-200D, U+25CC. Noto Sans JP: 3 face theo lát của gói chỉ cho U+3000-30FF, U+4E00-9FFF, U+FF00-FFEF (chọn các file lát tương ứng trong gói; nếu gói chia lát theo số, gom dải của các lát CJK, bỏ mọi lát latin/vietnamese/cyrillic của JP).
  - `theme.css` `--font-sans`: `"Noto Sans Variable", "Noto Sans Thai Variable", "Noto Sans JP Variable", system-ui, sans-serif` giữ nguyên; thêm `--font-symbols` không cần. Nếu sau khi sửa vẫn thấy lát JP tải trên trang Việt: tìm ký tự kéo nó (chạy script đọc `document.fonts` và duyệt `textContent` tìm mã ngoài dải Noto Sans) rồi thay ký tự đó bằng icon Phosphor hoặc `&middot;`.
  - `<link rel="preload" as="font">` cho lát vietnamese và latin trong layout (`crossOrigin="anonymous"`).
  - `runtime/ff.ts:209` (`storyFont`) không đổi.
- **Test:** E2E mới `e2e/next/fonts.spec.ts`: trên `/` tiếng Việt, `performance.getEntriesByType('resource')` không có `latin-ext`, `jp`, `thai`, tổng `.woff2` < 60 KB, `document.fonts.check('500 16px "Noto Sans Variable"', 'Tối nay ư ơ đ ₫')` true; trên `/en` cũng không có latin-ext; một trang seed có tên Thái (thêm vào `test/fixtures/seed.ts` một sự kiện Bangkok với tiêu đề có chữ Thái) tải đúng một file thai.
- **Cổng:** `fonts.spec.ts` xanh; `npm run test:screens` toàn bộ xanh (font đổi có thể lệch layout).
- **Commit:** `Fonts: three Noto Sans faces by script, Thai and JP only for their own characters`.

### N6 · 5:30 · Cache CDN cho API đọc công khai · ~1 giờ

- **Mục tiêu:** request ẩn danh tới route đọc công khai được CDN giữ 60 giây; request có phiên vẫn `private, no-store`; `/map/style.json` giữ 1 giờ.
- **Làm:**
  - `app.ts` hook `onSend` (cạnh dòng 248): nếu `!req.session && !reply.hasHeader('set-cookie') && req.method === 'GET'` và route nằm trong danh sách cố định `PUBLIC_CACHED = ['/events', '/events/map', '/artists', '/organizers/', '/collections/', '/shelves', '/map/style.json', '/places']` (so tiền tố, không regex người dùng) và status 200: `cache-control: public, s-maxage=60, stale-while-revalidate=300`; riêng `/map/style.json`: `s-maxage=3600`. Thêm `vary: x-lang, accept-language`.
  - `festfinder-web/src/proxy.ts:60`: khi request không có cookie phiên, chuyển tiếp `cache-control` và `vary` từ API về client (đang `cache: 'no-store'` và có thể đang ghi đè header: kiểm và giữ `no-store` cho request có cookie).
  - Trang `/list` và `/a` (`app/(kd)/list/page.tsx`, `a/page.tsx`): `export const revalidate = 60` nếu chưa có và trang không đọc cookie.
- **Test:** `test/public.test.ts` hoặc `test/webproxy.test.ts`: `GET /events` không cookie → header `s-maxage`; có cookie phiên → `private, no-store`; `POST` không bao giờ public; `/map/style.json` → 3600; `/me/*` không bao giờ public.
- **Cổng:** test trên xanh; `npm run test:screens` (trang `/list` vẫn hiện số đã lưu đúng cho người đăng nhập).
- **Commit:** `Public API reads are cached at the CDN for a minute; signed-in responses stay private`.

### N7 · 6:30 · Thư mục nghệ sĩ: ba loại hồ sơ, follow theo id (D13, API và migration) · ~1,5 giờ

- **Mục tiêu:** `/artists` chỉ trả hồ sơ có chủ; `/artists?kind=unclaimed` trả tên chưa nhận (lineup, Radar) với nguồn; follow theo id hồ sơ, chỉ với hồ sơ có chủ, không tự theo dõi; follow cũ theo tên được chuyển.
- **Làm:**
  - Migration `041_artist_follows_by_id.sql`: `alter table artist_follows add column artist_id uuid references artists on delete cascade;` chỉ mục `(artist_id, user_id)`; backfill `update artist_follows f set artist_id = a.id from artists a where f.artist_id is null and (a.normalized_name = <chuẩn hoá>(f.artist) or <chuẩn hoá>(f.artist) = any(a.alias_keys))` (dùng cùng hàm chuẩn hoá SQL mà `017` dùng, hoặc backfill bằng code trong `bootstrap` một lần nếu hàm chỉ có ở TypeScript, ghi rõ idempotent). **Cũng trong migration này** (N7b dùng): `alter table event_artists add column confirmed_at timestamptz, add column confirmed_by text check (confirmed_by in ('artist','organizer','both')), add column disputed_at timestamptz, add column disputed_note text;` và bảng `lineup_disputes (event_id uuid references events on delete cascade, normalized_name text, created_at timestamptz default now(), primary key (event_id, normalized_name))` với khối RLS. Bump số kế tiếp trong `CLAUDE.md` thành `042`.
  - `services/artists.ts`: thay `ORIGIN` hai giá trị bằng `artistKind()` trả `'owned' | 'unclaimed' | 'radar'`: `owned` khi `owner_user_id` khác null hoặc `verified`; `radar` khi mọi sự kiện công khai là Radar; `unclaimed` còn lại (kể cả không có sự kiện nhưng không có chủ, là hồ sơ placeholder cũ). `searchArtists`: mặc định `kind = 'owned'`; `f.kind = 'unclaimed'` trả `unclaimed` và `radar` kèm `source: {kind:'lineup'|'radar', event: {slug,title}}` (sự kiện gần nhất có tên đó). Bỏ `f.origin`; `origins` trong response thành `kinds: {owned, unclaimed, radar}`.
  - `routes/me.ts:208-220`: `PUT/DELETE /me/follows/artists/:ref` nhận id hoặc slug; tìm hồ sơ; `conflict('own_profile')` khi `owner_user_id === user`; `badRequest('not_claimed')` khi `artistKind !== 'owned'`; ghi `artist_id` (và `artist = name` để tương thích). Route cũ theo tên: giữ, nhưng khi tên khớp hồ sơ có chủ thì ghi `artist_id`; khi không khớp vẫn ghi tên (dùng cho Cảnh báo). `GET /me/follows` thêm `artists: [{id, slug, name, imageUrl, next}]` từ `artist_id`; giữ `artistPages` một bản phát hành.
  - `routes/artists.ts:96,123`: `followers = count(distinct user_id) where artist_id = a.id`; `following` theo `artist_id`; response thêm `kind`, giữ `origin` (= `kind === 'radar' ? 'radar' : 'posted'`) một bản phát hành cho web cũ.
  - Khi claim được duyệt (`services/roles.ts` hoặc nơi đặt `owner_user_id`): chuyển `artist_follows` theo tên của hồ sơ đó sang `artist_id`; chuyển `smart_alerts.artists` chứa tên đó thành follow (insert, bỏ tên khỏi mảng), ghi audit `artist.claimed_follows_moved`.
  - `services/seo.ts` `buildArtistSeo`: `noindex` khi `kind === 'radar'` và không có show sắp tới. Sitemap: chỉ `owned` và `unclaimed`.
  - `routes/admin/*` nghệ sĩ: bộ lọc `kind`.
- **Test:** `test/artists.test.ts`: `/artists` không có hồ sơ chưa chủ; `?kind=unclaimed` có "Kobosil" (Radar seed khi `SEED_RADAR`) với `source.kind = 'radar'` và một tên lineup chưa nhận (thêm vào seed: tên "Mây Đêm" trong lineup Ravolution không có chủ) với `source.kind = 'lineup'`; follow hồ sơ chưa chủ → `not_claimed`; chủ tự follow → `own_profile`; follow theo id rồi đổi tên hồ sơ → số follower không đổi; backfill: seed có một follow theo tên "Hoaprox" → sau boot `artist_id` khớp; nhận hồ sơ → hồ sơ vào `/artists`, follow cũ và alert theo tên đi theo; `/artists/kobosil` có `kind: 'radar'`; sitemap không có Radar không show.
- **Cổng:** `node --test test/artists.test.ts test/roles.test.ts test/seo.test.ts test/network.test.ts`; `npm run typecheck`.
- **Commit:** `Artists: owned, unclaimed or Radar; the directory lists owned profiles; follows are by profile (migration 041)`.

### N7b · 8:00 · Bắt tay lineup ↔ hồ sơ, phần API · ~1,5 giờ

- **Mục tiêu:** nghệ sĩ được báo khi NTC đưa tên họ vào lineup và xác nhận hoặc từ chối được; NTC được báo khi nghệ sĩ nói mình diễn ở tin của họ và thêm hoặc từ chối được; hồ sơ chính thức không bao giờ là `unclaimed`/`radar`.
- **Làm:**
  - `services/artists.ts` `syncEventArtists`: bỏ qua `(event_id, normalized_name)` có trong `lineup_disputes`; giữ `confirmed_*` của dòng cũ khi đồng bộ lại (không `delete` toàn bộ rồi insert, mà upsert theo `(event_id, artist_id)` và xoá dòng không còn).
  - Hook sau gửi duyệt và sau đăng (`routes/organizer/events.ts`, nơi gọi `askForReview` và nơi đặt `status = 'live'`): với mỗi `event_artists` có hồ sơ `owned` và chưa `confirmed_at`/`disputed_at`: `notifyUser(owner, kind: 'lineup_added', dedupeKey: 'lineup:<event>:<artist>')`, tiêu đề "<NTC> đã đưa bạn vào lineup <tin>", body ngày · thành phố, link `/studio/artist/gigs?confirm=<event>`. Nhắc lại một lần 48 giờ trước `starts_at` nếu chưa trả lời: thêm vào `jobs.ts` (job `lineupReminders`, mỗi giờ).
  - Endpoint nghệ sĩ: `POST /me/artist/lineup/:eventId/confirm` → `confirmed_at = now, confirmed_by = 'artist'` (hoặc `'both'` nếu NTC đã thêm từ báo cáo); `POST /me/artist/lineup/:eventId/dispute {note?}` → xoá dòng `event_artists`, ghi `lineup_disputes`, `notifyOrganizer(kind: 'lineup_disputed')`. `GET /me/artist/lineup` liệt kê show có tên mình với trạng thái.
  - Chiều ngược: trong `services/gigs.ts` hoặc nơi xử lý `artist_gig_reports` khi `outcome = 'merged'` vào tin của NTC: `notifyOrganizer(kind: 'lineup_claim')` với link `/studio/gigs?claim=<reportId>`. Endpoint NTC: `POST /organizer/lineup-claims/:reportId/accept` → thêm tên vào `events.artists`, `syncEventArtists`, `confirmed_by = 'both'`; `/decline {reason}` → báo cáo `rejected`, `notifyUser(artist, kind: 'lineup_declined')`.
  - Khi hồ sơ được tạo hoặc nhận và tên đã có trong `event_artists` của sự kiện sắp tới: một thông báo gộp cho nghệ sĩ `lineup_pending_n` ("Có N show đang ghi tên bạn"), và cho mỗi NTC đã đăng một thông báo thông tin `artist_claimed_name`.
  - `routes/artists.ts`: `upcoming` của hồ sơ `owned` chỉ gồm show `confirmed_at` khác null hoặc `confirmed_by` khác null; cho chủ hồ sơ (`editable`) trả thêm `unconfirmed` để màn Lịch hiện.
  - Presenter lineup của trang sự kiện: thêm `confirmed: boolean` mỗi tên (UI làm ban ngày).
- **Test:** `test/lineup.test.ts` mới: NTC đăng tin có tên hồ sơ có chủ → nghệ sĩ có `lineup_added` đúng một lần dù sửa tin hai lần; xác nhận → `confirmed_by = 'artist'`, show vào `upcoming`; từ chối → dòng mất, tên vẫn trong `events.artists`, NTC có `lineup_disputed`, sửa tin lại không nối lại; báo lịch ghép vào tin NTC → NTC có `lineup_claim`; chấp nhận → tên vào lineup, `confirmed_by = 'both'`; từ chối → nghệ sĩ có `lineup_declined`; tạo hồ sơ trùng tên đang trong 3 lineup sắp tới → một `lineup_pending_n` với N = 3; Radar quét tên có hồ sơ chính thức (fixture ingest) → `event_artists` trỏ hồ sơ, `?kind=unclaimed` không có nó; job nhắc chạy ở 47 giờ trước đêm và không chạy hai lần.
- **Cổng:** `node --test test/lineup.test.ts test/gig-reports.test.ts test/artists.test.ts test/jobs.test.ts`.
- **Commit:** `Lineups and profiles shake hands: an artist confirms a listing, an organiser accepts a gig report`.
- **Nếu hạn mức thấp lúc này:** bỏ N7b sang đêm sau, nhưng **vẫn giữ các cột của nó trong migration 041** (đã tạo ở N7) để không cần migration mới.

### N8 · 9:30 · Thư mục nghệ sĩ, phần web · ~1,5 giờ

- **Mục tiêu:** `/a` là mạng xã hội của nghệ sĩ; `/a/radar` là "Chưa có người quản lý"; đầu trang nghệ sĩ theo loại; một nút lime.
- **Làm:**
  - `kd/web/directory/browser.tsx`: bỏ `OriginTabs`; gọi `/artists` (mặc định owned). Route mới `app/(kd)/a/radar/page.tsx` (+ `/en`) dùng cùng browser với `kind=unclaimed`, tiêu đề "Chưa có người quản lý", thẻ có nhãn nguồn (`RadarTag` cho radar, "Lineup · <tin>" cho lineup) và nút "Đây là tôi" mở sheet nhận hồ sơ (`kd/role-picker.tsx` bước claim, điền sẵn tên). Ở `/a`, khi tìm không ra: dòng "Có N tên trùng ở Chưa có người quản lý →" (gọi `?kind=unclaimed&q=`). Link tới `/a/radar` ở cuối `/a` ("Tên từ lineup và Radar chưa ai nhận →").
  - `kd/web/artist/page.tsx:160-200`: theo `kind`: `owned` → `FollowButton` (ẩn khi `editable`, thay bằng `OwnerLink` "Chỉnh hồ sơ" là nút lime), `FollowersStat`; `unclaimed`/`radar` → nhãn "Chưa có người quản lý" (+ `RadarTag`), nút lime "Đây là tôi", nút phụ "Nhắc khi có show" (gọi `PUT /me/alert` thêm tên; cần đăng nhập), không follow, không follower, không Mix, không booking. Breadcrumb thêm "Nghệ sĩ" → `/a`. Nút "Mua vé" trong dòng show tông thường. Câu trống cho chủ hồ sơ: link "Báo lịch diễn".
  - `kd/runtime.tsx:134,207` và `FollowButton`: gửi id hồ sơ thay vì tên; `kd/app/social.tsx`, `kd/app/profile.tsx`, `kd/web/fan/page.tsx`: đọc `artists` thay `artistPages`.
  - `kd/ui/origin.tsx`: `OriginTabs` chỉ còn dùng ở `/list` (giữ component); thêm `UnclaimedTag`.
  - Console `kd/console/artists/*`: bộ lọc Có chủ · Chưa nhận · Radar.
  - `CLAUDE.md`: sửa mục "Artists and gigs" và "Posted or Radar".
- **Test:** E2E `directory.spec.ts`: `/a` không có thẻ Radar hay chưa nhận; `/a/radar` có thẻ "Kobosil" với `RadarTag` và nút "Đây là tôi"; tìm "Kobosil" ở `/a` ra dòng chuyển hướng. `artist.spec.ts`: trang có chủ (tạo qua API trong test) có đúng một nút lime "Theo dõi", chủ hồ sơ thấy "Chỉnh hồ sơ" và không có "Theo dõi"; `/a/kobosil` có "Đây là tôi", không có "Theo dõi"; breadcrumb có "Nghệ sĩ". `app-more.spec.ts`: "Đang theo dõi" hiện hồ sơ theo id.
- **Cổng:** ba spec trên xanh; `npm run typecheck` web.
- **Commit:** `/a lists the artists who run their profile; unclaimed names wait at /a/radar with "Đây là tôi"`.

### N9 · 11:00 · Mười lỗi nhỏ không cần quyết định · ~1,5 giờ (mỗi lỗi một commit, cùng branch)

| # | Lỗi | Sửa | Test |
| --- | --- | --- | --- |
| 9.1 | Ngày "Bận" hiện "RẢNH" | `kd/web/artist/page.tsx:57,239`: `'unavailable'` | `artist.spec.ts` |
| 9.2 | Thông báo kế hoạch mở `/app` | `routes/plans.ts:125,165,220,244,290`: thêm `eventId` (slug) vào `link` | `test/night.test.ts` hoặc nơi test plans |
| 9.3 | Sheet mở, gõ không vào ô | `kd/ui/sheet.tsx:17`: sau `showModal()` focus `[autofocus]` hoặc ô nhập đầu | `site.spec.ts`: mở Tìm kiếm, gõ, ô có chữ |
| 9.4 | Lịch đã báo đang duyệt → 404 | `kd/artist/gigs.tsx:270`: link chỉ khi `status === 'live'` | `studio-artist.spec.ts` |
| 9.5 | Mời nghệ sĩ chưa có người quản lý báo 409 sau khi gửi | `kd/studio/gigs.tsx:209`: nhãn "Chưa có người quản lý", tắt nút gửi; sửa chú thích `gigs.tsx:4`, câu trống `studio/copy.ts:389` | `studio.spec.ts` |
| 9.6 | Wizard ghi "NHÁP · TỰ LƯU" sau khi gửi | `kd/studio/wizard.tsx:295`: cập nhật `draft.status` | `studio-events.spec.ts` |
| 9.7 | Gợi ý địa điểm không xét thành phố | `routes/admin/venues.ts` (từ `ops.ts:597` sau N2): lọc `city`, bỏ mạo từ | `test/ops.test.ts` |
| 9.8 | `/list` trên điện thoại là bảng 1020 px | `kd/web/list/browser.tsx:58`: mặc định `grid` dưới `tab` | `list.spec.ts` ở 390 |
| 9.9 | Menu "Dòng nhạc" dẫn sai chỗ | `kd/web/chrome.tsx:30,43,78`: `/list?style=<k>`, một nguồn đếm | `site.spec.ts` |
| 9.10 | "Trước & sau show" hiện khi AI tắt | `kd/app/event.tsx:118`: chỉ khi API báo có hướng dẫn | `app-more.spec.ts` |

- **Cổng:** từng spec; cuối N9 chạy `npm run test:screens` toàn bộ.

### N10 · 12:30 · ESLint với baseline · ~45 phút

- **Làm:** `eslint.config.js` ở gốc repo: `typescript-eslint` `recommended-type-checked` cho hai package, `react-hooks`, `@next/eslint-plugin-next` cho web. Bật `no-floating-promises` và `no-misused-promises` là **error** và sửa hết (đây là lỗi thật). `no-explicit-any`: **warn** với số hiện tại ghi vào `docs/TECH_DEBT.md` (764 API, 41 web); CI job `lint` fail khi số warn tăng (script `scripts/lint-budget.mjs` so với số trong `TECH_DEBT.md`). Script `npm run lint` ở cả hai package và gốc. Thêm vào `ci.yml` và `CLAUDE.md` mục "Checking a change".
- **Cổng:** `npm run lint` 0 error; `npm run typecheck`.
- **Commit:** `ESLint with a budget: floating promises fixed, any counted and not allowed to grow`.

### N11 · 13:15 · Lấp đầy bề ngang, không cuộn ngang · ~1,5 giờ

- **Làm, theo thứ tự:**
  1. Viết `e2e/next/layout.spec.ts` **trước**: danh sách route lấy từ `src/app/(kd)` (thay `[slug]`/`[id]` bằng seed: `ravo`, `hoaprox`, `ravoent`, một project, một order…), ba vai (ẩn danh, fan, NTC, nghệ sĩ, admin tuỳ route), hai cỡ 390 và 1440. Mỗi route: `scrollWidth === innerWidth`; không phần tử nào `getBoundingClientRect().right > innerWidth + 1` trừ khi cha có `overflow: hidden`; phần tử nội dung chính (`main`, `.kd-app`, `.kd-shell > section`) rộng ≥ 95% chiều rộng còn lại; mở drawer/sheet/menu đầu tiên tìm thấy rồi kiểm lại. Chạy để có danh sách đỏ, ghi vào file tiến độ.
  2. `kd/kd.css:283` `.kd-tr { min-width: 640px }`: dưới 760 px thành thẻ (`display: grid`, một cột, nút hành động `width: 100%`); `kd/ui/shell.tsx` `Table`/`Row` nhận `cols` chỉ trên desktop.
  3. `/list` bảng (`kd/web/list/browser.tsx:320` `min-w-[1020px]`): cột `minmax(0, …)`, `kd-ell`, bỏ `min-w`; `/console/events` tương tự.
  4. Rail Studio, Studio nghệ sĩ, Console dưới 760 px: thanh tab dưới 4–5 mục + "Thêm" mở sheet chứa phần còn lại và chân rail (trang công khai, Về trang khám phá, Đổi vai, Ngôn ngữ, Đăng xuất); `.kd-shell` thêm `align-content: flex-start` (`kd.css:262`); `.kd-sn-hide` không còn giấu chân rail.
  5. Checkout desktop hai cột (form trái, tóm tắt và nút phải).
  6. Chạy lại `layout.spec.ts` tới xanh.
- **Cổng:** `layout.spec.ts` xanh ở 390 và 1440 cho mọi route; `npm run test:screens`.
- **Commit:** `Every screen fills the width on phones and desktops and never scrolls sideways (layout.spec.ts)`.

### N12 · 14:45 · Khép đêm · ~30 phút

1. Trên `night/<ngày>` (đã merge N1…N11): `npm run typecheck` (API và e2e), `npx tsc --noEmit -p .` (web), `npm test`, `npm run test:screens`, `npm run lint`. Ghi số vào file tiến độ.
2. `docs/FEESTFINDER_ROADMAP.md`: một dòng cho mỗi việc đã qua cổng. `CLAUDE.md`: next migration `042`; mục Look thêm "Every screen fills the width on phones and desktops; no route scrolls sideways (`layout.spec.ts`)"; mục Artists and gigs và Posted or Radar theo N8; mục Checking a change thêm `npm run lint`; mục Advertising/Ticket không đổi; thêm câu "FeestFinder charges buyers no fee".
3. `docs/TECH_DEBT.md`: số `any`, kết quả `layout.spec.ts` lần đầu, việc bỏ dở.
4. `git push -u origin night/<ngày>`. **Không** đụng `main`.
5. File tiến độ: mục "Sáng hôm sau" điền sẵn theo mẫu.

---

## 3. Khi nào dừng sớm

- Hết hạn mức: ghi "dừng vì hạn mức, đang ở N<k>, bước <x>" rồi thôi. Khi được gọi lại: đọc file tiến độ, tiếp từ bước đó, không làm lại từ đầu.
- Một việc đỏ sau 2 lần sửa: bỏ branch việc đó, ghi lỗi và trace, sang việc kế. N3 hoặc N7 bỏ thì **N7b, N8 vẫn làm được** vì không phụ thuộc N3; N8 phụ thuộc N7.
- Gặp quyết định sản phẩm chưa chốt (ví dụ: muốn ẩn hồ sơ có chủ nhưng không có show? muốn đổi ngưỡng báo cáo?): giữ mặc định của handoff, ghi "đã dùng mặc định X" vào file tiến độ, không hỏi (không có ai trả lời).

---

## 4. Mẫu `docs/NIGHT_BUILD_<ngày>.md`

```markdown
# Night build <ngày>

Xuất phát: main <sha> · Bắt đầu: <giờ> · Kiểm tra ban đầu: typecheck ok · API 368 (367 pass) · screens 211

| Việc | Branch / commit | Bắt đầu → xong | Cổng | Ghi chú |
| --- | --- | --- | --- | --- |
| N1 Bỏ phí | night/…-N1 · <sha> | 0:15 → 0:50 | attendee 24/24, resale 9/9, event.spec 15/15 | Chủ SP: xoá SERVICE_FEE_PCT trên Vercel nếu có |
| N2 … | | | | |

## Dùng mặc định
- D4: bản tạm với cờ needs_review (không có bản sửa riêng).

## Bỏ dở
- (việc, lý do, trace)

## Kết quả cuối (N12)
typecheck · test · screens · lint

## Sáng hôm sau (chủ sản phẩm)
1. Đọc bảng trên.
2. `preview_start festfinder-preview`; thu cửa sổ về cỡ điện thoại rồi kéo rộng: không trang nào cuộn ngang.
3. Bốn luồng: mua vé (không phí) · sửa tin đang bán (trang vẫn mở) · /a và /a/radar · trang nghệ sĩ có chủ và trang Radar.
4. Ổn: "commit all merge main redeploy". Một việc hỏng: "revert N<k>", phần còn lại vẫn ship.
```

---

## 5. Sau đêm: việc ban ngày nối tiếp

Ba màn của bắt tay lineup (ô Lineup trong trình sửa NTC, Lịch nghệ sĩ với Xác nhận / Không phải tôi, dấu xác nhận trên trang sự kiện); W2 trung tâm thông báo (chuông ở 4 khung); W3 hộp việc Console; bản sửa đầy đủ thay bản tạm (W0.3); W1 từng bước sau cờ. Thứ tự và cổng ở `TECH_LEAD_REVIEW_2026-10-16.md` mục 5.
