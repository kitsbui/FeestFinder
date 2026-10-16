# Handoff: kiểm thử trải nghiệm toàn app · gộp tính năng trùng · một họ chữ Noto Sans

- Ngày viết: 2026-10-16 · Dành cho: Claude Code (Opus 5.5) · Trạng thái: **plan, chưa code**. Riêng phần font Noto Sans (mục W9) đã làm xong theo yêu cầu của chủ sản phẩm, chưa commit.
- Đọc `CLAUDE.md` ở gốc repo trước khi làm. Quy tắc ở đó thắng mọi thứ trong file này.
- Điểm xuất phát: `main` ở `01bd8da` cộng các thay đổi chưa commit của ngày 2026-10-16 (xem mục 0.7). **Đừng revert chúng.**
- Báo cáo gốc của từng tester (luồng chi tiết, bảng phát hiện, `file:line`) nằm trong `docs/ux-audit-2026-10-16/`: `fan.md`, `organizer.md`, `artist.md`, `admin.md`, `ia.md`. Ảnh chụp họ nhắc tới nằm trong thư mục tạm của phiên test và không còn nữa.

---

## 0. Cách làm việc với handoff này

1. Có **11 workstream** (W0–W10). W0 là danh sách lỗi nhỏ, độc lập, nên làm trước. Các workstream còn lại tách được thành branch riêng. Thứ tự đề xuất ở mục 5.
2. Migration: số tiếp theo là `040`. Dự kiến cần: `040_event_revisions.sql` (W0.3), `041_artist_follows_by_id.sql` (W10), có thể `042_event_postpone.sql` (W5). Đổi số theo thứ tự merge thật. Dùng skill `feestfinder-migration`. Không sửa migration đã ship.
3. Mỗi workstream xong: `npm run typecheck` → file test của khu vực → `npm test` → `npm run test:screens` (từ `festfinder-backend/`), và `npx tsc --noEmit -p .` trong `festfinder-web/`. Xem bằng skill `feestfinder-preview`.
4. Commit, push, deploy **chỉ khi người dùng bảo** (push lên `main` là deploy production). Khi được bảo thì dùng skill `feestfinder-ship`.
5. Cập nhật `docs/FEESTFINDER_ROADMAP.md` ngay trong thay đổi đó, và `CLAUDE.md` khi một quy tắc đổi (ví dụ tên gọi ở W7, route `/app` ở W1).
6. Chuỗi hiển thị: server dùng `L('English', 'Tiếng Việt')`, web dùng cặp `{en, vi}` trong `copy.ts`, đọc bằng `pick()`. UI gọn: tiêu đề và hành động; chỉ có hint khi đó là quy tắc định dạng.
7. Đã làm ngày 2026-10-16, chưa commit (nền của handoff này):
   - Nút Console cho admin trên web (nav, menu tài khoản, tab "Tôi" của app; `isTeam` trong `kd/craft.ts`).
   - Dự án không còn là tab trên nav: "Đăng sự kiện" mở sheet chọn Sự kiện hoặc Dự án (`kd/ui/post-kind.tsx`).
   - Điều hướng: trên desktop `/app` giữ nav của site ở trên, rail app nằm dưới nav. Nút quay lại thông minh (`kd/ui/back-link.tsx`).
   - Một họ chữ Noto Sans (W9).

---

## 1. Đội test đã làm gì

Năm tester chạy song song trên bản preview cục bộ (dữ liệu demo, đồng hồ cố định 14/09/2026 10:00). Họ dùng Chromium headless ở 390px và 1440px, chụp màn hình rồi nhìn lại, và đọc code khi cần biết ý định.

| Tester | Vai | Phạm vi | Kết quả |
| --- | --- | --- | --- |
| Fan | Khách chưa đăng nhập, `minh@example.com`, tài khoản mới qua thẻ đăng nhập | Trang chủ, danh sách, bản đồ, trang sự kiện, mua vé, app (vé, live, recap, kế hoạch, hướng dẫn AI), hồ sơ, đã lưu, bộ sưu tập, `/en` | 34 phát hiện (0 P0) |
| Nhà tổ chức | Ravolution và 3 tài khoản mới (tạo NTC, nhận quản lý Concrete Crew, đổi vai) | Mọi màn Studio, wizard từ đầu đến cuối, sửa tin đang bán, check-in trên điện thoại, quảng cáo, gig, dự án | Khoảng 40 phát hiện (2 P0) |
| Nghệ sĩ | 2 tài khoản mới (tạo hồ sơ, nhận hồ sơ có sẵn) và 1 NTC phụ | Mọi màn Studio nghệ sĩ, trang công khai, thư mục, nhận hồ sơ, đổi vai, điện thoại | 30 phát hiện (2 P0) |
| Admin | `admin@feestfinder.com` và các tài khoản fan tạo việc để xử lý | Mọi màn Console, thông báo admin, "Xem dưới", 390px | 31 phát hiện (1 P0) |
| Kiến trúc thông tin | Đọc code | Sơ đồ mọi route, mọi thanh điều hướng, phân tích chồng chéo, phần thừa, tính nhất quán | 8 đề xuất gộp lớn |

Giới hạn khi test:
- Preview không bật `FAKE_REMOTE_MEDIA`, nên đường thành công của ảnh link và mix chỉ được kiểm bằng cách đọc code.
- Không bấm sang host ngoài: Google, Grab, cổng thanh toán, trang bán vé ngoài.
- Không có dự án công khai trong demo, nên "Đề nghị biểu diễn" chỉ được đánh giá theo code.

---

## 2. Các quyết định chủ sản phẩm cần xác nhận

Mỗi quyết định đã có mặc định để làm luôn. Nếu người dùng chọn khác thì làm theo người dùng.

| # | Câu hỏi | Mặc định trong plan |
| --- | --- | --- |
| D1 | Checkout thu "Phí dịch vụ" 5% (`SERVICE_FEE_PCT`, `routes/commerce.ts:20,58`), nhưng trang sự kiện ghi "không thu phí đặt vé" (`kd/web/copy.ts:109-110`) và `/about` ghi "0 phí đặt vé". | **Đã chốt (chủ sản phẩm, 2026-10-16): FeestFinder không thu phí của người mua.** Bỏ phí dịch vụ ở checkout, giữ nguyên các câu "không thu phí". Pass vé (bán lại) cũng dùng `SERVICE_FEE_PCT` (`services/resale.ts:10`), nên cũng về 0. Phí nền tảng mà nhà tổ chức trả trên doanh thu bán vé (`services/payouts.ts:94,110`) không phải phí người mua nên giữ nguyên; nếu muốn bỏ thì là một quyết định riêng. Xem W0.7. |
| D2 | Fan đang có hai sản phẩm song song: web (`/`, `/list`, `/e`, `/saved`, `/profile`) và app (`/app`, `/app/list`, `/app/e`, `/app/saved`, `/app/profile`). | **Web là bản chính.** `/app` chỉ giữ vé, checkout, live, recap. Các route app khác redirect 308 về web, làm theo từng bước (W1). |
| D3 | Ba tín hiệu "thích" chồng nhau: Lưu (♥, đếm "quan tâm" công khai), Hype (🔥, có mốc mở khoá), Theo dõi. | **Lưu là riêng tư** (bỏ số "quan tâm" công khai). **Hype là tín hiệu công khai duy nhất.** "Đã hype" thành một tab trong `/saved`. Không migration. |
| D4 | Sửa tên, giờ, địa điểm, giá hoặc ảnh bìa của một tin đang bán khiến tin chuyển về `in_review` và trả 404 công khai. | **Bản đang đăng vẫn hiện trong lúc bản sửa chờ duyệt**: bản sửa nằm riêng, duyệt xong mới áp vào (W0.3, migration `040`). |
| D5 | Vị trí quảng cáo `feed`, `live` và "mục Đang hot" (kệ) đang được bán nhưng không màn nào hiển thị. | **Ngừng bán ngay** những gì không hiển thị. Hiển thị kệ trên `/` là bước sau (W4). |
| D6 | Fan và nghệ sĩ muốn báo một sự kiện thì bị đẩy vào cổng "tạo hồ sơ nhà tổ chức". API form cộng đồng vẫn còn nhưng không có màn hình. | **Khôi phục form cộng đồng** cho người chưa là NTC (W5). |
| D7 | Đăng ký bằng email bắt đặt mật khẩu ngay sau khi đã xác minh mã (4 bước cho một cái tim). | **Mật khẩu tuỳ chọn**: đăng nhập bằng mã, đặt mật khẩu sau trong Cài đặt. Mã đủ 6 số thì tự gửi. |
| D8 | Hai tài khoản mới tạo là đủ tự ẩn một tin đang đăng, và admin không được báo. | Vẫn ẩn ở ngưỡng hiện tại nhưng **báo admin ngay**. Báo cáo của tài khoản dưới 7 ngày tuổi tính nửa điểm. |
| D9 | Hồ sơ nghệ sĩ tự tạo lên thư mục `/a` ngay, với nhãn "Đã đăng", dù chưa ai xác minh. Ai cũng tạo được tên một nghệ sĩ nổi tiếng. | **Chỉ lên thư mục khi có ít nhất một show hoặc đã xác minh.** Trang `/a/<slug>` vẫn mở được. |
| D10 | Tên gọi đang lẫn lộn (xem bảng ở W7). | Dùng bảng tên của W7. |
| D11 | Noto Sans JP thêm khoảng 5,5 MB file font vào bản build. Trình duyệt chỉ tải khi trang có chữ Nhật. | **Giữ.** Bỏ nếu muốn bản build nhẹ hơn. |
| D12 | Trang mặc định của `/console`. | **Hộp việc "Cần xử lý"** gộp mọi loại việc đang chờ (W3). |
| D13 | Thư mục nghệ sĩ `/a` trộn ba loại: hồ sơ có chủ, tên nhà tổ chức gõ vào lineup (chưa ai nhận), tên Radar quét. Follow theo tên chữ, không theo hồ sơ. | **Đã chốt (chủ sản phẩm, 2026-10-16): `/a` chỉ hiện hồ sơ có chủ, như một mạng xã hội. Mọi tên chưa có chủ, từ lineup hay Radar, vào mục riêng `/a/radar`.** Follow chuyển sang theo id hồ sơ. Xem W10. |

---

## 3. Bản đồ experience flow (tóm tắt)

✓ trơn tru · ✗ gãy hoặc gây rối · ⛔ chặn việc. Luồng đầy đủ nằm trong báo cáo gốc.

### 3.1 Fan

```
Tìm và mua vé (điện thoại, chưa đăng nhập)
/ ✓ → ☰ Sự kiện → /list ✗ bảng rộng 1020px, giá ngoài màn hình
    → /e/<slug> ✓ hero, Đặt xe, Chỉ đường
    → cuộn tìm vé ✗ khối Vé nằm sau Thảo luận, không có thanh mua dính đáy
    → Mua vé → /go → /app/checkout ✗ đổi khung, mất hạng vé và giá, chỉ còn "Đăng nhập để mua vé"
    → đăng nhập → checkout ✗ thêm "Phí dịch vụ 5%" trái với lời hứa "không thu phí" (D1: bỏ phí, W0.7)
    → thanh toán → /app/tickets ✓ QR offline → /app/live ✓ → /app/recap ✗ không có lối vào

Lưu khi chưa có tài khoản
♥ → sheet đăng nhập ✗ lý do in màu đỏ như lỗi → email → mã → mật khẩu bắt buộc → chọn vai ✗ toast đè lên sheet
  → đã lưu ✓ (4 bước cho một cái tim)

Lọc theo dòng nhạc
"Dòng nhạc ▾" (đếm mọi sự kiện) → /?style=… ✗ chỉ xem cuối tuần → "0 sự kiện"

Tài khoản
avatar → Hồ sơ (/profile, web) · Vé (/app/tickets, khung app) · Đã lưu (/saved, web) ✗ không có Cài đặt, Thông báo
tab Tôi (app) → /app/profile ✗ gần trùng /profile; cài đặt chỉ có ở đây

Desktop /app: nav site + rail app, "Khám phá" sáng ở cả hai, một cái về /, một cái về /app ✗
```

### 3.2 Nhà tổ chức

```
Trở thành NTC
đăng ký → "Tổ chức sự kiện" ✓ → /studio ✗ trống, không có nút "Đăng sự kiện đầu tiên"
  → Việc cần làm "thiếu tài khoản nhận tiền" → /studio/profile ⛔ không có ô ngân hàng (chỉ có ở Doanh thu, khi đã có số liệu)

Đăng sự kiện
Đăng sự kiện → Sự kiện → wizard
  B1 ✗ "Trang sự kiện" bắt buộc · B2 ✗ chỉ một ngày, địa điểm mới không có địa chỉ
  B3 ✗ bán trên FeestFinder có hạng vé vẫn bắt link bán vé ngoài · B4 ✗ "Xem lại" không cho xem gì
  → gửi ✓ thẻ thành công (✗ thanh trên vẫn "NHÁP · TỰ LƯU")
  → chờ duyệt ✗ yêu cầu sửa chỉ nằm trong Hộp thư, trình sửa không hiện

Sửa tin đang bán
sửa tên → Lưu → hộp thoại (không nói tới tên, không cảnh báo) → in_review → /e/<slug> trả 404 ⛔

Nhận hồ sơ có sẵn
/o/<slug> ✗ link "Bạn là nhà tổ chức này?" dưới footer → "Nhận" ✗ đóng im, không hỏi bằng chứng
  → /studio ✗ vẫn "chưa có hồ sơ", mời "Tạo hồ sơ nhà tổ chức" (tạo bản trùng)

Đêm diễn: /studio/door ✓ thẻ màu lớn ✗ iPhone Safari không có camera (không có BarcodeDetector)
Điện thoại: rail thành dải ngang 1.503px ✗ Check-in và Hộp thư ngoài màn hình; không có Đăng xuất, Đổi vai
```

### 3.3 Nghệ sĩ

```
Trở thành nghệ sĩ
đăng ký → "Biểu diễn" ✓ → /studio/artist ✗ form dài, ba số 0, không hỏi phong cách nhạc

Nhận hồ sơ có sẵn (kể cả hồ sơ Radar)
/a/<slug> ✗ link dưới footer → "Nhận" ✗ im lặng, không bằng chứng
  → /studio/artist ⛔ "đang chờ duyệt" + nút duy nhất "Đổi tài khoản" (thực chất là đăng xuất)

Booking
Cơ hội diễn → Ứng tuyển ✓ → Lịch diễn › Đã ứng tuyển
Lời mời → "Đồng ý trao đổi" ✗ không có liên hệ của NTC, không có bước tiếp
Lịch trống: ngày "Bận" hiện "RẢNH" trên trang công khai ✗
Lịch đã báo đang duyệt → link /e/<slug> → 404 ✗

Đổi vai
Đổi sang NTC → vai nghệ sĩ tắt ngay, trước khi có hồ sơ NTC ✗ → đóng form = không còn vai nào

Điện thoại: rail mất phần đầu và chân ⛔ không có đăng xuất, đổi vai, đường về site; bảng giấu nút hành động ✗
```

### 3.4 Admin

```
Buổi sáng dọn việc
/console → phải mở 10–12 màn: Kiểm duyệt · Yêu cầu nhận (2 tab) · Báo cáo (4 tab) · Góp ý · Dự án · Xác minh
           · Địa điểm chưa ghim · Kệ nổi bật (quảng cáo) · Nghệ sĩ › Thiết bị · Nguồn dữ liệu ✗
Số đếm trên rail sai hoặc thiếu ✗ (Nhà tổ chức 6 vs 5 chờ xác minh; Kệ nổi bật chỉ đếm yêu cầu thương hiệu)

Duyệt tin: thông báo → /console?id=… ✓ chia đôi, SLA, giữ 5 giây có Hoàn tác, phím tắt (màn mạnh nhất)
Báo cáo ✗ một sự kiện tách thành nhiều thẻ; "Bỏ qua" không bỏ ẩn tin; cảnh cáo tính theo thẻ
Yêu cầu nhận ✗ mở tab rỗng; không lời nhắn, không bằng chứng, không link tới người gửi
Quảng cáo ✗ thông báo dẫn tới đầu trang; "Tạo chiến dịch" một cú bấm là chạy luôn
"Xem dưới" ⛔ không xem được gì; tải lại thì không thoát được
Thông báo admin ✗ Console không có chuông; chỉ 3 loại việc được báo
Cấp admin ⛔ PATCH /admin/users/:id và nút "Cấp quyền admin" trái quy tắc trong CLAUDE.md
```

---

## 4. Workstreams

### W0. Sửa ngay: lỗi và P0 (nhỏ, độc lập)

Làm theo thứ tự trong bảng. Mỗi dòng một commit, mỗi dòng có test.

| # | Lỗi | Ở đâu | Sửa | Test |
| --- | --- | --- | --- | --- |
| 0.1 | **Admin cấp được quyền admin cho tài khoản khác**, trái quy tắc "never add a route … that grants it" | `routes/admin/ops.ts:924-940`, nút "Cấp quyền admin" trong drawer tài khoản Console | Bỏ đổi `role` khỏi route (hoặc bỏ cả route), bỏ nút. Drawer chỉ hiện "Admin (từ ADMIN_EMAIL)". Quyền admin chỉ đến từ `syncAdmins` và đăng nhập Google. | API test: `PATCH` không còn đổi được `role`. E2E: drawer không có nút. |
| 0.2 | "Xem dưới" không làm gì, và kẹt phiên sau khi tải lại | `kd/console/root.tsx:104-105` | Dùng `token` API trả về: mở phiên chỉ đọc trong tab mới tới `/studio` hoặc `/app`. Băng vàng đọc trạng thái từ `/auth/session`. Có nút "Kết thúc" luôn dùng được. Thêm ô tìm và nút "Xem dưới" trong drawer tài khoản và NTC. | E2E `console-orgs`: xem dưới Ravolution thì thấy Studio của Ravolution, ở chế độ chỉ đọc. |
| 0.3 | Sửa tin đang bán → 404 công khai (D4) | `routes/organizer/events.ts:308-313` | Migration `040_event_revisions.sql`: bản sửa chờ duyệt lưu riêng (`pending_changes jsonb`, `pending_at`). Tin vẫn `live`. Console hiện phần chênh lệch; duyệt thì áp, trả lại thì bỏ. Hộp thoại ghi đúng các trường đã sửa (kể cả tên). | API: sửa tên tin live thì `/events/<slug>` vẫn 200, bản sửa nằm trong hàng chờ; duyệt xong tên mới hiện. |
| 0.4 | NTC mới không hoàn tất được xác minh: ô tài khoản nhận tiền không có ở Hồ sơ | `kd/studio/dashboard.tsx:199`, `revenue.tsx:54`, `studio/profile.tsx` | Đưa "Tài khoản nhận tiền" vào `/studio/profile` (khối Doanh nghiệp). Doanh thu chỉ hiện và link tới đó. | E2E `studio`: NTC mới nhập được tài khoản ngân hàng khi chưa có sự kiện. |
| 0.5 | Nhận hồ sơ đang chờ: ngõ cụt (nghệ sĩ) và mời tạo trùng (NTC) | `kd/artist/root.tsx:74`, `kd/studio/root.tsx:109` | Màn chờ chung: tên và link hồ sơ đang nhận, ngày gửi, "Huỷ yêu cầu", "Về trang khám phá". Ẩn nút tạo mới. Bỏ "Đổi tài khoản" khỏi vị trí nút chính. | E2E: sau khi nhận, `/studio` và `/studio/artist` hiện màn chờ đúng tên. |
| 0.6 | Đổi vai tắt vai cũ trước khi có vai mới. Thêm lại vai thì hỏi tên rồi bỏ qua tên đó. | `kd/role-picker.tsx:62-73`, `services/roles.ts` (`switchCraft`, `startArtistProfile`) | Chỉ gọi `/me/roles/switch` khi hồ sơ đích đã có; tạo hồ sơ và đổi vai trong một bước. Đóng form thì giữ vai cũ. Đã có hồ sơ thì hiện thẳng "Bật lại <tên>". Tiêu đề sheet: "Đổi sang Nhà tổ chức?". | E2E `studio-artist`: đóng form giữa chừng thì vai cũ vẫn bật. |
| 0.7 | Trang ghi "không thu phí đặt vé" nhưng checkout cộng "Phí dịch vụ 5%" (D1 đã chốt: **không thu phí**) | `routes/commerce.ts:20,58,71,76` (tính `fee`, `feeLabel`, dòng "Phí dịch vụ"), `services/resale.ts:10` (`RESALE_FEE_PCT` đọc cùng biến), `services/eventpage.ts:70` và `routes/resale.ts:68` (`feePct`), `kd/app/checkout.tsx`, `kd/web/copy.ts:124` (`resaleFee`) | Bỏ `SERVICE_FEE_PCT` và `RESALE_FEE_PCT`: phí luôn 0. Checkout không còn dòng "Phí dịch vụ"; tổng = giá vé − giảm giá. Pass vé không còn "+5% phí dịch vụ". Cột `orders.fee` giữ nguyên (ghi 0) cho đơn mới; đơn cũ giữ số đã thu. Giữ các câu "không thu phí" (`soldHere`, `soldVia`, `/about`, FAQ). Nếu `SERVICE_FEE_PCT` đang đặt trên Vercel thì báo người dùng xoá (code không đọc nữa). Phí nền tảng của nhà tổ chức không đổi. | API test: tạo đơn 1 vé 350.000 thì `fee` = 0, `total` = 350.000; giá Pass vé không cộng phí. Sửa các test đang khẳng định phí 5%. E2E `event`: checkout không có dòng phí, tổng bằng giá trên trang. |
| 0.8 | Ngày "Bận" hiện "RẢNH" | `kd/web/artist/page.tsx:239` so với `'busy'`; API dùng `'unavailable'` (`routes/gigs.ts:330`) | So với `'unavailable'`, sửa cả kiểu ở dòng 57. | E2E `artist`. |
| 0.9 | Thông báo kế hoạch mở `/app` | `routes/plans.ts:125,165,220,244,290` gửi `planId` mà không có `eventId`; `kd/app/inbox.tsx:47-59` | API thêm `eventId` (slug) vào link. | API test cho payload thông báo. |
| 0.10 | Sheet có ô nhập: con trỏ nằm ở nút "Đóng", gõ không vào ô | `kd/ui/sheet.tsx:17` (`showModal()` chạy sau `autoFocus`) | Sau `showModal()`, focus vào `[autofocus]` hoặc ô nhập đầu tiên. | E2E: mở Tìm kiếm, gõ ngay, ô có chữ. |
| 0.11 | Báo cáo: một sự kiện thành nhiều thẻ; "Bỏ qua" không bỏ ẩn; cảnh cáo theo thẻ | `routes/admin/moderation.ts:357-361,392`, `kd/console/moderation/copy.ts:24` | Một thẻ cho mỗi đối tượng, lý do liệt kê bên trong. Bỏ qua và cảnh cáo áp cho cả đối tượng. Tính lại `held_for_reports` theo ngưỡng. Không cảnh cáo tổ chức giữ chỗ "Cộng đồng FeestFinder". Báo admin khi một tin bị tự ẩn (D8). | API test trong `moderation.test.ts`. |
| 0.12 | Lịch đã báo đang duyệt dẫn tới 404 | `kd/artist/gigs.tsx:270` | Chỉ thành link khi `status === 'live'`. | E2E `studio-artist`. |
| 0.13 | Mời nghệ sĩ chưa có người quản lý: gửi xong mới báo lỗi 409 | `kd/studio/gigs.tsx:209`; chú thích sai ở `gigs.tsx:4` và câu trống `studio/copy.ts:389` | Gắn nhãn "Chưa có người quản lý" trong ô tìm và tắt nút gửi; gợi ý "Đăng gig". Sửa chú thích và câu trống. | E2E `studio`. |
| 0.14 | Wizard vẫn ghi "NHÁP · TỰ LƯU" sau khi gửi | `kd/studio/wizard.tsx:295` | Cập nhật `draft.status` sau khi gửi. | E2E `studio-events`. |
| 0.15 | Gợi ý địa điểm không xét thành phố | `routes/admin/ops.ts:597` | Lọc theo `city` của sự kiện; bỏ mạo từ khi so tên. | API test. |
| 0.16 | "Tạo chiến dịch" một cú bấm là chạy ngay, và chỉ lấy vị trí đầu tiên | `kd/console/featured.tsx:321` | Drawer điền sẵn (tiêu đề, link, mọi vị trí đã xin, ngày, thành phố), xem trước thẻ, rồi mới bật. Dòng chiến dịch hiện khoảng ngày và trạng thái "chờ tới ngày". | E2E `console-commerce`. |
| 0.17 | Duyệt quảng cáo cho một tin còn đang duyệt | `/console/featured` › yêu cầu sự kiện | Hiện trạng thái tin trên thẻ; tắt "lên kệ" cho tới khi tin đã đăng. | API test trong `ads.test.ts`. |
| 0.18 | Đối soát đối tác có hai đường: đánh "đã trả" lẻ thì đơn không vào được kỳ thanh toán | `routes/admin/partners.ts:166-177` so với `routes/admin/affiliate.ts:165-219` | Màn Đối tác chỉ duyệt hoặc từ chối. `paid` chỉ đến từ phiếu chi trả. | API test. |
| 0.19 | `/list` trên điện thoại mặc định là bảng 1020px | `kd/web/list/browser.tsx:58,320` | Dưới breakpoint `tab`, mặc định "Lưới". | E2E `list`. |
| 0.20 | Menu "Dòng nhạc" đếm một kiểu, dẫn tới chỗ khác | `kd/web/chrome.tsx:30,43,78` | Dẫn tới `/list?style=<k>`, đếm cùng khung thời gian. Một nguồn đếm cho desktop và điện thoại. | E2E `site`. |
| 0.21 | "Trước & sau show" hiện cả khi hướng dẫn AI đang tắt (503) | `kd/app/event.tsx:118` | Chỉ hiện khi API báo có hướng dẫn. | E2E `app-more`. |
| 0.22 | Hạng "mở bán khi VIP hết vé" chọn mua được, kể cả khi không có hạng VIP | checkout `ravo-warmup` | Hiện "Chưa mở bán" và không cho chọn, như ở `/e`. | API và E2E. |
| 0.23 | Số đếm rail và Tổng quan lệch nhau | `routes/admin/platform.ts:27,31` so với `ops.ts:180-182` | Một hàm đếm dùng chung. Loại tổ chức giữ chỗ (`is_community`) khỏi xác minh. | API test. |
| 0.24 | Chủ trang tự theo dõi mình (nghệ sĩ, NTC) | `kd/web/artist/page.tsx:177`, `kd/web/org/page.tsx:125-126` | Ẩn "Theo dõi" với chủ trang, "Chỉnh hồ sơ" là nút chính và dẫn tới đúng màn hồ sơ. API từ chối tự theo dõi. | API test và E2E. |

### W1. Fan: một sản phẩm (D2)

**Vì sao.** Fan gặp chồng chéo này nhiều nhất. Người đến từ Google vào `/e`, bấm "Vé của tôi" là sang khung app, bấm "Đã lưu" thì sang một trang khác hẳn. Mỗi bản lại thiếu thứ bản kia có:
- `/app/e` có thanh mua dính đáy, "Đi cùng bạn bè", "Trước & sau show"; `/e` thì không.
- `/profile` thiếu Cài đặt.
- `/app/saved` không có bộ sưu tập.

**Làm gì:**
1. Route web là bản chính (được index và đầy đủ hơn). Trên điện thoại vẫn có thanh tab, nhưng trỏ tới `/`, `/list?view=map`, `/saved`, `/app/tickets`, `/profile`. Trên desktop chỉ còn nav của site. Khi đó rail app (đặt dưới nav hôm 2026-10-16) chỉ còn ở các màn `/app` giữ lại; xem lại `kd/kd.css` (`.kd-app ~ .kd-tabbar`).
2. `/app` chỉ giữ màn cần chạy offline hoặc gắn với một đêm: `/app/tickets`, `/app/checkout`, `/app/live`, `/app/recap`, `/app/plan`, `/app/guide`, `/app/chat`, `/app/notifications` (cho tới W2).
3. Redirect 308, mỗi bước một nhóm:
   - Bước 1: `/app/saved` → `/saved`, `/app/profile` → `/profile`. Chuyển khối Cài đặt (thành phố, ngôn ngữ, cảnh báo, thông báo) và "Đăng xuất" vào `/profile`.
   - Bước 2: `/app/e/<slug>` → `/e/<slug>`. Trang `/e` nhận từ bản app: thanh "từ … · Mua vé" dính đáy trên điện thoại, khối Vé lên ngay sau Lineup, một khối "Chuẩn bị cho đêm" (Đi cùng bạn bè, Trước & sau show khi có, Đặt xe, Chỉ đường, Thêm lịch, Nhắc trước 15 phút).
   - Bước 3: `/app` → `/`, `/app/list` → `/list?view=map`. Onboarding thành phố và sở thích thành một bước tuỳ chọn ở `/`. Còn một màn bản đồ (`kd/web/list/map-view.tsx`); `kd/app/map.tsx` bỏ. `start_url` của PWA (`app/manifest.ts:10`) sang `/`.
4. Mua vé khi chưa đăng nhập: mở sheet đăng nhập ngay trên trang sự kiện, mang theo ý định "mua hạng X", xong mới sang checkout. Checkout luôn hiện tóm tắt đơn.
5. Một ô tìm cho cả site: gợi ý ngay sự kiện, nghệ sĩ và địa điểm; Enter thì sang `/list?q=`. Ô trong `/list` lọc sau khi ngừng gõ.
6. Một nơi lọc dòng nhạc: `/list?style=`. Menu và chip đều dẫn về đó, số đếm khớp.
7. Menu tài khoản: thêm "Cài đặt" và "Thông báo". "Dự án của tôi" chỉ hiện khi đã có dự án.
8. Một nguồn ngôn ngữ cho web và app (`?lang` và cookie). Hiện `kd/app/root.tsx:27-30` đọc lựa chọn lưu trên máy.

**Test cần sửa:** `e2e/next/app.spec.ts`, `app-more.spec.ts`, `saved.spec.ts`, `profiles.spec.ts`, `site.spec.ts` (kiểm tra rail ở dòng "the app fills the screen…"), `event.spec.ts`.

**Rủi ro:** trung bình. Người đã cài PWA quen màn Explore. Đo `FF.track` trên `/app` trước bước 3.

### W2. Thông báo và cài đặt

**Hiện trạng:**
- "Thông báo" mang 4 nghĩa (`kd/app/copy.ts:17,157`, `kd/studio/copy.ts:15,339`).
- Danh sách thông báo chỉ mở được từ chuông ở `/app` (`kd/app/explore.tsx:178`). Nav web, Studio nghệ sĩ và Console đều không có chuông.
- Admin được báo "trong app" nhưng làm việc trong Console. Nghệ sĩ nhận lời mời booking mà Studio nghệ sĩ không hiện.

**Làm gì:**
1. Một trung tâm thông báo, có bộ lọc "Cá nhân · Studio · <tổ chức>". API `GET /me/notifications?scope=all` gộp thêm các dòng có `organizer_id` của những đội tài khoản đó tham gia.
2. Chuông có số chưa đọc ở mọi khung: nav web, rail Studio, rail nghệ sĩ, thanh trên Console.
3. Một trang "Cài đặt thông báo" gộp `/app/settings`, `/app/alerts` và tab chủ đề của `/studio/inbox`. Ba chỗ cũ redirect về đó.
4. Báo admin thêm (`notifyAdmins`): dự án gửi duyệt (`routes/projects.ts:200`), yêu cầu nhận, tin bị tự ẩn vì báo cáo, góp ý loại lỗi nặng.
5. Tin nhắn NTC: Console có hàng chờ "Tin nhắn NTC" lọc theo `admin_unread` và đếm trên rail. Nếu không làm thì bỏ câu tự động "phản hồi trong 2 giờ làm việc" (`routes/organizer/inbox.ts:19,78`).
6. Nội dung thông báo hết lẫn tiếng Anh (ví dụ "Community · … · 2026-10-10 · TP.HCM").
7. Studio nghệ sĩ: mục "Booking" trên rail có số đếm (`SideItem` đã có `count`).

**Test:** `test/notify.test.ts` (hoặc file gần nhất) cho các loại mới; E2E chuông trên nav web và Console.

### W3. Console: "Cần xử lý" (D12)

1. **Một hộp việc.** `/console` thành "Cần xử lý": một danh sách gộp mọi loại việc đang chờ, mỗi dòng có loại, tuổi, SLA và mở thẳng đúng mục. Các loại:
   - tin mới, bản sửa chờ duyệt (W0.3), kháng nghị;
   - báo cáo (tin, bài thảo luận, khoảnh khắc, bình luận mix);
   - yêu cầu nhận (sự kiện, hồ sơ);
   - dự án, góp ý, yêu cầu quảng cáo (sự kiện, thương hiệu);
   - thiết bị chờ duyệt, địa điểm chưa ghim, sự kiện bị nguồn Radar báo huỷ;
   - tin nhắn NTC.

   Hàng chờ kiểm duyệt hiện tại giữ nguyên tên "Kiểm duyệt tin", với SLA, giữ 5 giây, phím tắt và thao tác hàng loạt. Đây là màn mạnh nhất, không đụng tới.
2. **Một nguồn số đếm:** `/admin/counts` đếm đủ mọi loại ở trên, với cùng định nghĩa cho rail và Tổng quan (W0.23).
3. **Sắp lại rail:**
   ```
   CẦN XỬ LÝ (số tổng) → /console
     Kiểm duyệt tin · Báo cáo · Yêu cầu nhận · Dự án · Góp ý
   DANH MỤC
     Sự kiện · Nhà tổ chức (xác minh là một bộ lọc có số) · Địa điểm · Nghệ sĩ (+ thiết bị) · Radar (nguồn, lần chạy)
   KHÁCH HÀNG & DOANH THU
     Quảng cáo · Đối tác & affiliate · Hợp tác nghệ sĩ · Đơn hàng
   BIÊN TẬP
     Kệ nổi bật (chỉ kệ)
   NỀN TẢNG
     Tài khoản · Số liệu · Nhật ký
   ```
4. **Yêu cầu nhận:** số trên từng tab, mở tab có việc. Hiện lời nhắn và link bằng chứng (API đã nhận `note`, `proofUrl`; UI phía người gửi phải gửi chúng, xem W6). Người gửi link tới `/console/users?id=`.
5. **Radar thấy được trong Console:** cột và bộ lọc `origin`, `RadarTag` ở bảng Sự kiện, Nghệ sĩ và hàng chờ. Đầu thẻ duyệt ghi "FeestFinder Radar · <nguồn>" hoặc "Báo cáo gig · <nghệ sĩ>", không ghi "Cộng đồng FeestFinder". Với tin cộng đồng, thành tích tính theo người gửi (`submitted_by`), không theo tổ chức giữ chỗ.
6. **Ô tìm ở thanh trên tìm toàn Console** (tin, NTC, tài khoản, mã đơn, mã góp ý), kết quả gom theo nhóm. Bỏ ô tìm trùng trong từng trang.
7. **Gộp Tổng quan và Số liệu.** Số liệu chia theo phong cách nhạc (`styles`), không theo thể loại. Bỏ lọc "Thể loại" và ô "EDM & điện tử" trong hàng chờ.
8. **Góp ý:** thêm "Trả lời" cho loại "Thắc mắc & hỗ trợ" (email hoặc thông báo trong app). Drawer Góp ý và Dự án đồng bộ `?id=` như Đơn hàng.
9. **Dự án:** drawer hiện chủ dự án đã xác nhận số điện thoại chưa, các gói tài trợ, link "Xem trang".
10. **Drawer tài khoản:** link tới tin, báo cáo, góp ý, dự án, yêu cầu nhận của người đó; nút "Xem dưới".
11. **Nhật ký:** nhãn cho mọi action (danh sách thiếu trong `docs/ux-audit-2026-10-16/admin.md`, dòng 21), hiện `actorLabel`, dòng bấm được để mở đối tượng.
12. **Tạo sự kiện** (`/console/events/new`): mặc định "Đăng ngay", vì tin admin đăng lên ngay theo quy tắc `teamSession`.
13. **Dịch các nhãn còn tiếng Anh:** "SELLING FAST", "JUST ADDED", "TRENDING", "LOW TICKETS", "Mức medium".
14. **Một tên cho mỗi khái niệm:** "Yêu cầu nhận" (không dùng "Nhận quản lý"), "Tài khoản", "Đối tác vé", "Kháng nghị" (không dùng "Khiếu nại").

**Test:** `e2e/next/console*.spec.ts`; API test cho `/admin/counts`.

### W4. Quảng cáo và nổi bật (D5)

1. **Một tên: "Quảng cáo".** Bỏ "Đẩy tin", "Đẩy tin lên mục Đang hot", "Đưa lên mục Đang hot khi tin được duyệt" (`kd/studio/copy.ts:66,67,170`). Nút ở dashboard và wizard ghi "Quảng cáo sự kiện này".
2. **Console tách màn:**
   - "Quảng cáo": yêu cầu sự kiện, yêu cầu thương hiệu, chiến dịch, giá CPM. Nhãn CPM theo `BRAND_AD_PLACEMENT_LABEL`, số định dạng bằng `money()`.
   - "Kệ nổi bật" chỉ còn kệ.
   - Thông báo quảng cáo link thẳng tới yêu cầu (`?inquiry=<id>`), không dùng anchor `#ads`.
3. **Ngừng bán chỗ không hiển thị:** `feed` và `live` (`lib/ads.ts:32`, bảng giá ở `/advertise`), và vị trí `featured` của NTC ("mục Đang hot") cho tới khi có chỗ hiển thị. Chiến dịch đang chạy ở các vị trí đó: báo team, không tự tắt.
4. **Bước sau:** một mô hình vị trí có ngày (hero, kệ, banner, thẻ feed, live). Hiển thị kệ trên `/` qua `GET /shelves` (`routes/catalog.ts:459`), rồi mới bán lại. Dọn kệ demo còn sót từ thời chưa chỉ-EDM ("Đêm nhạc nhẹ", "Ăn uống & văn hoá").
5. **Đổi tên** `/console/brands` "Chiến dịch thương hiệu" thành **"Hợp tác nghệ sĩ"** (thương hiệu tìm nghệ sĩ, không phải quảng cáo), đặt cạnh Nghệ sĩ.
6. **Gộp** "Đối tác vé" và "Tiếp thị liên kết" thành một màn có tab Đối tác · Liên kết · Đối soát (cùng W0.18).
7. **Studio:** thanh chọn sự kiện ở `/studio/ads` lọc danh sách, hoặc bỏ đi.

### W5. Đăng và quản lý sự kiện (NTC)

1. **"Đăng sự kiện" → Sự kiện theo vai (D6):**
   - NTC: vào wizard như hiện nay.
   - Người chưa là NTC (fan, nghệ sĩ): form cộng đồng rút gọn, gồm tên, ngày, địa điểm, giá, link. Có nút "Dán link hoặc ảnh poster" để điền sẵn (`POST /community/events`, prefill ở `routes/community.ts:58,138,159`), kèm danh sách "Sự kiện tôi đã gửi" (`GET /me/submissions`, `:252`). Có nút quay lại. API và test đã có (`test/community.test.ts`, `submissions.test.ts`).
   - Sửa `docs/CURRENT_ARCHITECTURE.md:79` cho đúng.
2. **Một form sự kiện:**
   - Wizard chỉ để tạo mới, giữ thẻ xem trước. Mọi lối "Tiếp tục" của bản nháp mở trình sửa (`dashboard.tsx:153,205` đang mở wizard).
   - Dùng chung một model: tên tối đa 120, độ tuổi mặc định như nhau, nhiều ngày, địa chỉ, mô tả vi/en. Hiện `wizard.tsx:35,77,94` lệch với `editor.tsx:65`.
   - `missingForSubmit` và điểm chất lượng đang tính lại ở 3 nơi; gom về một.
3. **Sửa wizard:**
   - "Trang sự kiện" không bắt buộc (`wizard.tsx:125`).
   - Có hạng vé bán trên FeestFinder thì link bán vé ngoài không bắt buộc (`wizard.tsx:120`), và câu ghi chú bán vé chỉ hiện một lần (`wizard.tsx:396`).
   - Có "Một ngày / Nhiều ngày" và ô địa chỉ cho địa điểm mới.
   - Bước 4 cho xem lại thật.
   - Tạo NTC từ `/studio/new` xong thì quay lại `/studio/new` (`role-picker.tsx:101`).
4. **Trình sửa:**
   - Hiện tin mới nhất của luồng kiểm duyệt ở đầu, với mọi trạng thái (`editor.tsx:296` chỉ hiện khi `rejected`), kèm link "Trả lời".
   - Một điểm chất lượng duy nhất, gộp "Chất lượng tin" và "Hiển thị trên Google & AI", với một danh sách "Còn thiếu".
   - Bỏ các câu giải thích (Lean UI).
5. **Thao tác còn thiếu:**
   - "Hoãn / Huỷ sự kiện": báo người có vé và hoàn tiền. Status `cancelled` đã có; hoãn cần trường mới (`041_event_postpone.sql`).
   - Khối "Lịch diễn" dùng API có sẵn: `PUT /organizer/events/:id/timetable` và `/zones`.
   - "Mời thành viên" (Chủ / Thành viên) ở Hồ sơ doanh nghiệp.
6. **Thanh chủ sở hữu** trên `/e/<slug>` và `/o/<slug>`: "Bạn quản lý sự kiện này · Sửa · Số liệu".
7. **Khách mời** chuyển sang `/studio/attendees` thành tab "Khách mời", có nút thêm. Cân nhắc cấp QR bằng vé `kind='guest'` (`003_commerce.sql:64`), loại vé hiện không có code nào tạo. Mã giảm giá vào khối "Vé" của trình sửa hoặc mục "Quảng bá". `/studio/promos` redirect.
8. **"Gửi tin tới khách":** gộp `/studio/announce` với "Bảng tin trực tiếp" của trình sửa (có cờ `notify`). Hai kiểu: tin riêng (push, Zalo, email; ngay hoặc hẹn giờ) và cập nhật ghim trên trang sự kiện. Mặc định chọn nhóm lớn nhất (`announce.tsx:31` đang chọn "Đã lưu 0").
9. **Dự án trong Studio:** một mục trên rail, cùng dữ liệu với `/p/mine`. Gắn sự kiện bằng ô chọn sự kiện của mình, không gõ slug (`web/projects/manage.tsx:273`). Nhãn tiền tệ theo thành phố mặc định; số có dấu phân cách (`manage.tsx:160`).
10. **Check-in:**
    - Khi không có `BarcodeDetector` (iPhone Safari), quét bằng một thư viện JS tự host. Không làm được thì ẩn khung camera và đưa ô nhập mã lên đầu (`door.tsx:253`).
    - Tên hạng vé theo ngôn ngữ.
    - Tách lỗi "Không tìm thấy mã" với "Vé của sự kiện khác".
11. **Sự kiện Radar:** thêm "Đây là sự kiện của tôi" trên dòng FeestFinder Radar (`web/event/page.tsx:107-114`), dẫn vào luồng nhận quản lý. Hiện `POST /events/:id/claims` chỉ nhận tin cộng đồng (`routes/community.ts:182`).
12. **Màn trống có nút:**
    - Dashboard trống: "Đăng sự kiện đầu tiên".
    - `NeedEvent` ghi "Chưa có sự kiện · Tạo sự kiện".
    - Thẻ thành công thêm "Xem tin đang chờ duyệt".
13. `/studio/event/<id>` trả 301 về `/studio/events/<id>`.

**Test:** `e2e/next/studio.spec.ts`, `studio-events.spec.ts`; API test cho bản sửa chờ duyệt, hoãn/huỷ, form cộng đồng.

### W6. Nghệ sĩ

1. **Luồng nhận hồ sơ** (dùng chung với NTC):
   - Link "Bạn là …?" đặt cạnh "Theo dõi" ở đầu trang của hồ sơ chưa ai nhận, nhất là hồ sơ Radar. Hiện nó nằm dưới footer: `kd/web/artist/page.tsx:314`, `kd/web/profile/parts.tsx:122`, `kd/web/org/page.tsx:246`.
   - Sau "Nhận": một bước hỏi link chứng minh và lời nhắn, rồi màn xác nhận với câu của server (`role-picker.tsx:110-116`).
   - Đã gửi thì link đổi thành "Đang chờ duyệt".
   - Ý định nhận hồ sơ được giữ qua bước đăng nhập (`requireSignIn` hiện không mang theo intent).
2. **Rail còn 4 mục**, vừa màn 390px:
   - **Hồ sơ**: gồm khối Thiết bị và quản lý Khoảnh khắc.
   - **Nhạc**: link nền tảng ở đầu, danh sách mix bên dưới.
   - **Lịch**: một dòng thời gian gồm show đã xác nhận, lịch đã báo đang chờ, các khoảng Rảnh/Bận; "Báo lịch diễn" mở drawer.
   - **Booking**: một danh sách mọi đề nghị (ứng tuyển gig, lời mời, đề nghị biểu diễn ở dự án, thương hiệu quan tâm), có cột nguồn và 4 nhóm trạng thái. Phía trên là "Tìm gig" với bộ lọc thay cho tab. API đọc gộp: `GET /me/artist/pipeline`, không đổi bảng.
3. **Đồng ý hoặc chốt thì hai bên thấy liên hệ của nhau**, như dự án đang làm (`routes/gigs.ts:184-189` `presentInquiry`).
4. **Gig có drawer chi tiết:** mô tả đầy đủ, NTC, sự kiện liên quan, hạn, nút "Ứng tuyển" ở đáy. Ngày bận hiện thành nhãn "Bận" thấy được (`opportunities.tsx:99-101` đang để trong `sr-only`).
5. **Form hồ sơ:**
   - Chặn điều hướng phía client khi còn thay đổi chưa lưu (`artist/profile.tsx:60-65` chỉ có `beforeunload`).
   - Thanh "Lưu thay đổi" dính đáy khi có thay đổi (form dài khoảng 6.900px trên điện thoại).
   - Tự thêm `https://`; cuộn tới và focus ô lỗi đầu tiên.
6. **Mix:**
   - Hỏi lại trước khi xoá.
   - Lỗi cần số điện thoại thì mở `PhoneSheet` như `kd/web/artist/mixes.tsx` (`kd/artist/mixes.tsx:80,106`).
7. **Lối vào cho nghệ sĩ:**
   - `/profile` và tab "Tôi" hiện "Studio nghệ sĩ · /a/<slug>" khi có vai nghệ sĩ.
   - Footer thêm "Cho nghệ sĩ".
   - `/a` có lời mời "Bạn là nghệ sĩ?".
8. **Trang công khai `/a/<slug>`:**
   - Breadcrumb `FeestFinder / Nghệ sĩ / <tên>`.
   - "Gửi lời mời booking" cho tài khoản NTC khi hồ sơ đang nhận booking.
   - Một nút lime (trang Radar đang có cả "Theo dõi" lẫn "Mua vé").
   - Với chủ hồ sơ, câu trống "Theo dõi để nhận tin sớm nhất" đổi thành link "Báo lịch diễn".
9. **Thư mục (D9):** hồ sơ tự tạo chỉ lên `/a` khi có show hoặc đã xác minh.
10. **Sheet tạo hồ sơ** hỏi luôn phong cách nhạc (API `/me/roles/artist` đã nhận).
11. **Studio nghệ sĩ mới:** hiện 3 việc còn thiếu (ảnh, phong cách, một mix) thay cho ba số 0.

**Test:** `e2e/next/studio-artist.spec.ts`, `artist.spec.ts`, `directory.spec.ts`; API test cho pipeline và liên hệ khi đồng ý.

### W7. Back office chung (Studio, Studio nghệ sĩ, Console) và tên gọi

1. **Trên điện thoại** (cả ba back office đều hỏng):
   - Rail thành thanh tab dưới 4–5 mục cộng "Thêm". "Thêm" mở sheet chứa phần còn lại và phần chân: trang công khai, Về trang khám phá, Đổi vai, Ngôn ngữ, Đăng xuất. Hiện `kd/kd.css:270-272` (`.kd-sn-hide`) giấu chân rail, nên không có lối ra.
   - Chiều cao cố định; thêm `align-content: flex-start` cho `.kd-shell` (`kd.css:262`) để hết khoảng trống 150–240px.
   - Console: chạm một tin thì chi tiết mở như trang hoặc sheet toàn màn.
2. **Bảng thành thẻ dưới 760px** (`kd/kd.css:283`, `.kd-tr { min-width: 640px }`): tên, dòng phụ, số, rồi nút hành động rộng hết thẻ. **Quy tắc chung (chủ sản phẩm chốt 2026-10-16): mọi giao diện lấp đầy bề ngang màn hình trên desktop lẫn điện thoại, và tuyệt đối không cuộn ngang ở bất kỳ route nào**; `e2e/next/layout.spec.ts` kiểm `scrollWidth === innerWidth` ở 390 và 1440 cho mọi route (chi tiết ở `TECH_LEAD_REVIEW_2026-10-16.md` mục 5b).
3. **Chân rail giống nhau ở cả ba back office:** [Trang công khai] · Về trang khám phá · Đổi vai · Ngôn ngữ · Đăng xuất. Back office hiện không có công tắc ngôn ngữ.
4. **Bộ thành phần chung:**
   - Chuyển `kd/console/kit.tsx` thành `kd/ui/backoffice.tsx`.
   - Studio bỏ `Page` và `Block` riêng (`studio/parts.tsx`); `Block` của nghệ sĩ (`artist/parts.tsx:12`) cũng gộp vào. Giữ `StudioHead`.
   - Một ô số liệu thay cho `Kpi`, các `Tile`, `StatFilter`, `Stat`.
   - Một hàm `tone(status)` và một từ điển trạng thái thay cho 4 bảng màu riêng.
   - Một hằng số tiền tệ checkout.
5. **Quy tắc mở để sửa:** thực thể nhỏ dùng drawer bên phải; thực thể có hơn 3 phần (sự kiện, hồ sơ) dùng trang riêng. Dùng `BackLink` ở mọi màn chi tiết. Hoàn tiền dùng `AskHost` thay cho `window.confirm` (`studio/attendees.tsx:103`).
6. **Một nút lime mỗi màn:**
   - "Sự kiện mới" trên rail Studio đổi sang kiểu viền.
   - Trang sự kiện chỉ để lime cho nút mua trong khối Vé.
   - Hồ sơ doanh nghiệp chỉ một nút "Lưu" lime.
7. **Menu tài khoản:**
   - Bỏ dòng radio "Người tham dự ✓" (bấm không có tác dụng).
   - Hiện "Studio (Nhà tổ chức) →" hoặc "Studio nghệ sĩ →" kèm tên, và "Đổi sang …".
8. **Bảng tên (D10):**

| Đang dùng | Dùng thống nhất |
| --- | --- |
| "Người tham dự" ở chân rail Studio và Studio nghệ sĩ (thực ra là về site) | **Về trang khám phá** ("Người tham dự" chỉ còn là danh sách khách) |
| "Thông báo" trên rail Studio (gửi tới khách) | **Gửi tin tới khách** ("Thông báo" chỉ còn nghĩa *nhận*) |
| "Đẩy tin", "mục Đang hot", "Ưu tiên feed" | **Quảng cáo** |
| "Chiến dịch thương hiệu" (`/console/brands`) | **Hợp tác nghệ sĩ** |
| "Cho nhà tổ chức", "Nhà tổ chức", "Studio" (cùng `/studio`) | **Studio** |
| "Nghệ sĩ", "Studio nghệ sĩ" (cùng `/studio/artist`) | **Studio nghệ sĩ** |
| "Xem hồ sơ công khai" và "Xem trang công khai" | **Xem trang công khai** |
| "Gig & booking" (Studio) và "Lịch diễn & booking" (nghệ sĩ) | **Booking** (Studio), **Lịch** và **Booking** (nghệ sĩ, theo W6) |
| "Chờ duyệt", "Đang chờ duyệt", "Đang duyệt", "Đang chờ" | **Đang duyệt** |
| "Hồ sơ của tôi" khi có vai nghề | **Hồ sơ người tham dự**, cạnh "Studio …" |

### W8. Dọn dẹp, trang mồ côi và Lean UI

1. **Trang mồ côi:**
   - `/app/hyped`: thành tab "Đã hype" trong `/saved` (D3), route cũ redirect.
   - `/app/following`: thành trang "xem tất cả" của `FollowingSection`. Khối này hiện chỉ hiện 6 dòng, không có link thêm (`app/profile.tsx:191`).
   - `/app/recap` có lối vào: tab "Đã qua" ở `/app/tickets`, khối "Đêm qua thế nào?" trên `/e` sau đêm diễn (chỉ cho người đã check-in), và thông báo `screen:'recap'` sau đêm. Ảnh recap thành bài "kỷ niệm" trên tường ảnh nếu người gửi đồng ý; hiện chỉ người tải lên xem được (`routes/event-actions.ts:126-160`).
2. **Kế hoạch không có bạn bè:** bạn bè hiện chỉ đến từ đồng bộ Facebook hoặc Instagram (`services/friends.ts:8`), nên cho mời bằng link. Không làm thì ẩn "Đi cùng bạn bè" khi `friends = 0`. Tiêu đề "3 NGƯỜI" trên 4 dòng đổi thành "3 sẽ đi · 1 chưa trả lời".
3. **`/stats/free`, `/stats/weekend`** redirect về `/list?free=1` và `/list?time=weekend`. Tên địa điểm ở `/stats/venues` bấm được. Sửa `e2e/next/stats.spec.ts`.
4. **Tàn dư nhiều thể loại:**
   - Các khối "EDM 100%" ("Gu của bạn" ở `/profile`, "Thể loại tổ chức" ở `/o`, "Thể loại" ở `/c`) chia theo phong cách nhạc.
   - Khối "Tối nay ở đâu" ở trang chủ theo bộ lọc phong cách đang chọn.
5. **Cắt chữ theo Lean UI:**
   - Câu giải thích dưới từng tiêu chí chất lượng.
   - "— thẻ không ảnh mất 40% lượt bấm".
   - "Đánh giá khi còn nóng. Nhà tổ chức chỉ thấy điểm trung bình…" (`kd/app/copy.ts:218`).
   - Câu ghi chú bán vé bị lặp.
6. **Chi tiết nhỏ (fan):**
   - Lineup xếp theo giờ, hoặc bỏ giờ ở danh sách xếp hạng (`web/event/lineup.tsx:33`).
   - Khối "Đại sứ" bỏ khỏi trang công khai hoặc có hành động đi kèm.
   - Vé chỉ hiện một mã.
   - Nút Góp ý nhỏ lại hoặc thu vào mép khi cuộn trên điện thoại.
   - Recap không ghi giờ vào cửa giả.
   - Chat với id sai hiện "không tìm thấy".
   - `/e` có landmark `<main>`.
   - Lý do đăng nhập hiện như phụ đề, không đỏ (`kd/sign-in.tsx:39`).
   - Toast không đè sheet.
   - Bản đồ ghi "2 sự kiện chưa có vị trí".
   - "Báo cáo tin này" đưa lên khỏi chỗ dưới footer.
7. **Chú thích cũ sai:** `kd/artist/root.tsx:5`, `kd/studio/gigs.tsx:4`, `docs/CURRENT_ARCHITECTURE.md:79`.
8. **Dữ liệu demo cho người test**, chỉ trong `test/fixtures/seed.ts`: một hợp tác nghệ sĩ, một đối tác vé, link affiliate, một gig, một dự án công khai, một nghệ sĩ có mix.
9. **Ô ngày** hiện "mm/dd/yyyy" trong giao diện tiếng Việt (Báo lịch diễn, Lịch trống, Đơn hàng): kiểm trên thiết bị thật; nếu vẫn vậy thì dùng bộ chọn ngày dd/mm của Kính đêm.

### W9. Một họ chữ Noto Sans (đã làm 2026-10-16, chưa commit)

Theo yêu cầu "bỏ font mono, toàn bộ sử dụng noto sans family". Việc đã làm:
- Thay `@fontsource/be-vietnam-pro` và `@fontsource/jetbrains-mono` bằng `@fontsource-variable/noto-sans`, `@fontsource-variable/noto-sans-thai`, `@fontsource-variable/noto-sans-jp`, nạp trong `festfinder-web/src/app/(kd)/layout.tsx`.
  - Font variable: một file mỗi bộ ký tự cho mọi độ đậm.
  - Trình duyệt chỉ tải bộ ký tự trang cần. Trang tiếng Việt tải latin, latin-ext và vietnamese, khoảng 218 KB.
- `kd/theme.css`: `--font-*: initial` rồi chỉ định nghĩa `--font-sans` (Noto Sans → Noto Sans Thai → Noto Sans JP → font hệ thống). Không còn `--font-mono`, nên lớp `font-mono` của Tailwind không còn.
  - `code, kbd, samp, pre` dùng font của trang.
  - Nhãn chữ in hoa nhỏ giãn chữ 0.06em.
  - Số dùng `font-variant-numeric: tabular-nums` (`kd-num`, `kd-mb`).
- Gỡ 23 chỗ `font-mono` trong các màn hình; chỗ nào là mã hoặc số thì dùng `kd-num`.
- Ảnh story chia sẻ (`runtime/ff.ts:209`) và trang dev console của API (`routes/dev-console.ts`) dùng Noto Sans.
- Bản đồ đã dùng Noto Sans từ trước (`festfinder-frontend/ui/map/glyphs`).
- Xoá `festfinder-frontend/ui/fonts` (bản Be Vietnam Pro không còn trang nào nạp). `scripts/copy-ui.ts` không chép `fonts` nữa và dọn bản cũ trong `public/ui`. Test cache ở `test/seo.test.ts` chuyển sang `stampUrls` và `maplibre-gl.css` (`versionOf` được export).
- Tài liệu: `CLAUDE.md` (Look, bảng thư mục), `festfinder-web/README.md`, `docs/CURRENT_ARCHITECTURE.md`, roadmap.
- Đã kiểm:
  - Typecheck web và API sạch.
  - `node --test test/seo.test.ts` 13/13.
  - `npm run test:screens` 211/211 trên bản build production.
  - Xem trên preview: trang chủ, Console, trang sự kiện trên điện thoại.
- Còn mở: D11 (giữ hay bỏ Noto Sans JP). Email không đặt font (để mặc định của trình đọc mail); nếu muốn thì thêm `font-family: "Noto Sans", Arial, sans-serif` vào mẫu email.

---

### W10. Thư mục nghệ sĩ như một mạng xã hội; Radar và tên chưa nhận ở mục riêng (D13 đã chốt)

**Hiện trạng (đã kiểm trong code):**
- `artist_follows` lưu `artist text` (`db/migrations/004_engagement.sql:33`): một follow là của một **tên**, không phải một hồ sơ. Trang nghệ sĩ đếm follower bằng mọi user theo dõi tên hoặc alias (`routes/artists.ts:96,123`); nút Theo dõi gửi `a.name` (`kd/web/artist/page.tsx:178`); `PUT /me/follows/artists/:artist` nhận chuỗi bất kỳ (`routes/me.ts:208`). Hệ quả: tên trùng thì gộp follower; nghệ sĩ tự theo dõi được; đổi nghệ danh là mất follower; `/me/follows` phải suy ra trang từ tên (`artistPages`).
- `searchArtists` (`services/artists.ts:112`) liệt kê mọi artist có chủ **hoặc** có ít nhất một sự kiện công khai; `ORIGIN` (`:97`) chỉ tách Radar với phần còn lại. `/a` mặc định tab "Tất cả" (`kd/web/directory/browser.tsx`, `OriginTabs` trong `kd/ui/origin.tsx`).
- Ba loại hồ sơ đang trộn trong `/a`: (A) có chủ: nghệ sĩ tự tạo hoặc đã nhận (`owner_user_id` khác null, hoặc `verified`); (B) tên nhà tổ chức gõ vào lineup của sự kiện đã đăng, chưa ai nhận; (C) tên FeestFinder Radar quét từ site khác.

**Quy tắc mới:**
1. **`/a` là mạng xã hội của nghệ sĩ: chỉ loại A.** Bỏ `OriginTabs` ở `/a`; giữ bộ lọc vai trò, phong cách, thành phố, "Nhận booking", "Sắp diễn", ô tìm. `/a/style/<s>`, `/a/city/<c>` cũng chỉ loại A. Sắp xếp như cũ (ai diễn sớm nhất, rồi hồ sơ đầy hơn), **không bao giờ theo follower**.
2. **`/a/radar` = "Chưa có người quản lý"**: loại B và C, mỗi thẻ có nhãn nguồn ("Lineup · <tên sự kiện>" hoặc `RadarTag`) và nút "Đây là tôi" mở luồng nhận hồ sơ (W6.1). Có cùng bộ lọc và ô tìm. Khi ô tìm ở `/a` không ra kết quả, hiện dòng "Có N tên trùng ở mục Chưa có người quản lý →".
3. **Trang `/a/<slug>` vẫn mở cho cả ba loại** (lineup và SEO trỏ tới), nhưng khác đầu trang:
   - Loại A: nút lime duy nhất là **Theo dõi** (chủ hồ sơ thấy **Chỉnh hồ sơ** thay vào, không theo dõi được chính mình); số follower; Mix, Khoảnh khắc, Lịch, booking như hiện nay.
   - Loại B, C: nhãn "Chưa có người quản lý" (và `RadarTag` nếu C); nút lime duy nhất là **Đây là tôi** (nhận hồ sơ); nút phụ **Nhắc khi có show** = thêm tên vào Cảnh báo thông minh (`PUT /me/alert`, `routes/me.ts:356`, đã có). Không có Theo dõi, không có số follower, không Mix, không booking. Show sắp tới, đã diễn, "Diễn nhiều nhất với" giữ nguyên vì lấy từ sự kiện.
   - `noindex` cho loại C khi chưa có show sắp tới (tránh hàng nghìn trang Radar mỏng vào Google); loại A và B index như cũ.
4. **Follow theo id hồ sơ.** Migration `041_artist_follows_by_id.sql` (theo skill `feestfinder-migration`, kiểu expand → contract):
   - Thêm cột `artist_id uuid references artists on delete cascade` vào `artist_follows`, cho phép null; chỉ mục `(artist_id, user_id)`.
   - Backfill: khớp `artist` với `artists.name` hoặc `aliases` (cùng cách chuẩn hoá của `017`: bỏ dấu, chữ thường) → ghi `artist_id`. Dòng không khớp giữ `artist_id` null (tên chưa có hồ sơ, vẫn dùng cho Cảnh báo thông minh).
   - Ràng buộc: chỉ cho `insert` khi hồ sơ đích là loại A (kiểm trong API, không trong DB vì loại A/B phụ thuộc sự kiện); `check (artist_id is not null or artist <> '')`.
   - API: `PUT/DELETE /me/follows/artists/:id` nhận **id hoặc slug** của hồ sơ; trả `conflict('own_profile')` khi chủ tự theo dõi, `badRequest('not_claimed')` khi hồ sơ chưa có chủ. Route cũ theo tên giữ 1 bản phát hành rồi bỏ (contract). `GET /me/follows` trả `artists: [{id, slug, name, imageUrl, next}]` thẳng từ bảng, bỏ `artistPages`.
   - Trang nghệ sĩ đếm `count(distinct user_id) where artist_id = a.id`.
   - Cảnh báo thông minh (`smart_alerts.artists`) vẫn theo tên: đó là cách "nhắc tôi khi tên này có show" cho loại B, C. Khi một tên được nhận hồ sơ, job một lần chuyển các alert của tên đó thành follow của hồ sơ (đồng ý ngầm, vì ý nghĩa như nhau), ghi audit.
5. **Khi một tên được nhận hồ sơ** (claim duyệt): hồ sơ chuyển sang `/a`; các follow cũ theo tên (đã có `artist_id` nhờ backfill) đi theo; alias giữ để lineup và link cũ vẫn tới.
6. **Dọn đầu trang nghệ sĩ** (gộp với W6.8): breadcrumb `FeestFinder / Nghệ sĩ / <tên>`; một nút lime; "Mua vé" ở dòng show tông thường; số follower chỉ hiện ở loại A; câu trống cho chủ hồ sơ là link "Báo lịch diễn".
7. **Studio nghệ sĩ:** tab "Người theo dõi" không cần (follower không xếp hạng ai), nhưng số follower hiện ở đầu Hồ sơ lấy từ bảng mới.
8. **Console:** `/console/artists` có bộ lọc Có chủ · Chưa nhận · Radar (dùng chung định nghĩa A/B/C với API, một hàm `artistKind()` trong `services/artists.ts` thay cho `ORIGIN` hai giá trị); `RadarTag` ở bảng (W3.5).
9. **Sơ đồ và SEO:** sitemap liệt kê loại A và B; `services/seo.ts` `buildArtistSeo` nhận `kind` để đặt `noindex` cho C không có show.
10. **Tài liệu:** sửa mục "Artists and gigs" và "Posted or Radar" trong `CLAUDE.md`: thư mục `/a` là hồ sơ có chủ; `/a/radar` là tên chưa nhận; follow theo id; `OriginTabs` chỉ còn ở `/list`.

11. **Bắt tay hai chiều giữa lineup và hồ sơ (chủ sản phẩm thêm 2026-10-16).** Hồ sơ do nghệ sĩ tạo là **hồ sơ chính thức** của tên đó: mọi lineup, dù nhà tổ chức gõ hay Radar quét, trỏ về nó và nó không bao giờ nằm trong `/a/radar`. Hiện `ensureArtists` (`services/artists.ts:30-40`) đã nối tên theo `normalized_name` và alias, nên phần dữ liệu có sẵn; thiếu là thông báo và xác nhận.
    - **Chiều NTC → nghệ sĩ.** Khi một tin được gửi duyệt hoặc đăng (`syncEventArtists`, gọi từ `routes/organizer/events.ts` và luồng duyệt) mà một tên trong lineup trỏ tới hồ sơ có chủ: thông báo trong app (và push, email theo cài đặt) tới tài khoản của nghệ sĩ, `kind: 'lineup_added'`, dedupe theo `(event_id, artist_id)`: "<NTC> đã đưa bạn vào lineup <sự kiện> · <ngày> · <thành phố>", hai hành động: **Xác nhận** và **Không phải tôi**, cùng link "Thêm giờ diễn, mix" mở Lịch trong Studio nghệ sĩ (W6.2). Khi tin được đăng mà nghệ sĩ chưa trả lời thì nhắc lại một lần 48 giờ trước đêm diễn.
    - **Chiều nghệ sĩ → NTC.** Khi nghệ sĩ báo lịch diễn (`artist_gig_reports`, `021`) và báo cáo ghép vào một sự kiện đã đăng của NTC (`outcome = 'merged'`), hoặc khi nghệ sĩ bấm "Tôi diễn ở đây" trên trang sự kiện: thông báo tới NTC (`notifyOrganizer`, `kind: 'gig'` hiện có, thêm `lineup_claim`): "<nghệ sĩ> nói họ diễn ở <sự kiện> · Thêm vào lineup · Không đúng". **Thêm** thì tên vào lineup, trỏ hồ sơ, đánh dấu đã xác nhận bởi cả hai; **Không đúng** thì báo cáo thành `rejected` với lý do về cho nghệ sĩ. Quy tắc của `021` giữ nguyên: báo cáo của nghệ sĩ không bao giờ tự thêm vào lineup của người khác.
    - **Khi nghệ sĩ mới tạo hoặc nhận hồ sơ** mà tên đã có trong lineup của sự kiện sắp tới (loại B hoặc C): một thông báo gộp cho nghệ sĩ "Có N show đang ghi tên bạn · Xác nhận từng show", và với show của NTC đã đăng thì NTC nhận "<nghệ sĩ> vừa mở hồ sơ, đang có tên trong <sự kiện>" (chỉ thông tin, không cần hành động). Từ lúc này hồ sơ rời `/a/radar`, follow và alert theo tên đi theo hồ sơ (mục 4, 5).
    - **Dữ liệu** (trong cùng migration `041`): `event_artists` thêm `confirmed_at timestamptz`, `confirmed_by text check (confirmed_by in ('artist','organizer','both'))`, `disputed_at timestamptz`, `disputed_note text`. Một tên bị nghệ sĩ từ chối: dòng `event_artists` bỏ liên kết (giữ tên chữ trong `events.artists` để lineup không mất tên), NTC được báo, `ensureArtists` không nối lại tên đó cho sự kiện đó nữa (ghi `(event_id, normalized_name)` vào `lineup_disputes`). Tên trùng giữa hai nghệ sĩ thật được xử lý bằng chính nút "Không phải tôi"; `artists.normalized_name` đang unique, nên nghệ sĩ thứ hai cùng tên phải chọn nghệ danh khác hoặc thêm hậu tố, như quy tắc "listed profiles are claimed, never duplicated".
    - **Hiển thị.** Trang sự kiện: dấu xác nhận cạnh tên đã `confirmed_by` (không phải dấu verified của hồ sơ). Trình sửa của NTC, ô Lineup: avatar hồ sơ và trạng thái "Đã xác nhận · Chờ nghệ sĩ · Không phải họ" cạnh mỗi tên có hồ sơ, gợi ý hồ sơ khi gõ (đã có ở "Mời nghệ sĩ", dùng chung). Lịch của nghệ sĩ (W6.2): dòng show có "Đã xác nhận" hoặc hai nút. Hồ sơ công khai chỉ hiện show đã xác nhận ở tab "Sắp diễn"; show chưa xác nhận hiện mờ với nhãn "Chưa xác nhận" cho chủ hồ sơ, ẩn với người xem.
    - **Chống làm phiền.** Một thông báo mỗi `(sự kiện, nghệ sĩ)`; nghệ sĩ tắt được chủ đề "lineup" trong cài đặt thông báo (W2.3); NTC đăng 20 tin một lúc thì nghệ sĩ nhận một thông báo gộp.
    - **Test.** `test/lineup.test.ts` mới: NTC đăng tin có tên hồ sơ có chủ → nghệ sĩ có thông báo `lineup_added`; xác nhận → `confirmed_by = 'artist'`, show hiện ở `/artists/:slug` upcoming; "Không phải tôi" → liên kết bỏ, tên vẫn trong `events.artists`, NTC có thông báo, sửa tin lại không nối lại; nghệ sĩ báo lịch ghép vào tin của NTC → NTC có thông báo, "Thêm" → `confirmed_by = 'both'`; tạo hồ sơ trùng tên đang trong lineup → thông báo gộp N show; Radar quét tên có hồ sơ chính thức → trỏ hồ sơ, hồ sơ không có trong `?kind=unclaimed`. E2E: `studio-artist.spec.ts` xác nhận từ thông báo; `studio-events.spec.ts` ô lineup hiện trạng thái.
    - **Ước lượng:** thêm 1–1,5 ngày vào W10 (API và migration nửa ngày, ba màn 1 ngày).

**Test:**
- API `test/artists.test.ts`: `/artists` không trả hồ sơ chưa có chủ; `/artists?kind=unclaimed` trả loại B và C với `source`; follow hồ sơ chưa có chủ → `not_claimed`; chủ tự follow → `own_profile`; backfill: một follow theo tên "Kobosil" có `artist_id` sau migration; đổi nghệ danh không đổi số follower; nhận hồ sơ xong thì hồ sơ xuất hiện trong `/artists` và follow cũ đi theo.
- E2E `directory.spec.ts`: `/a` không có thẻ Radar; `/a/radar` có và có nút "Đây là tôi"; `artist.spec.ts`: trang loại A có một nút lime "Theo dõi", chủ hồ sơ thấy "Chỉnh hồ sơ"; trang Radar có "Đây là tôi" và không có Theo dõi.
- Seed: thêm một hồ sơ loại B (tên trong lineup Ravolution chưa nhận) để ba loại đều có trong demo.

**Rủi ro:** thấp về dữ liệu (expand → contract, backfill idempotent). Trung bình về SEO: trang Radar không show chuyển `noindex` sẽ rụng khỏi Google, đó là chủ ý. `/a` sẽ ngắn hơn hẳn lúc đầu (demo: 36 → khoảng 10); chấp nhận, vì đó là người thật.

**Ước lượng:** 3–4,5 ngày agent: migration và API 1 ngày, hai trang thư mục và đầu trang nghệ sĩ 1 ngày, bắt tay lineup (mục 11) 1–1,5 ngày, test và tài liệu nửa ngày.

## 5. Thứ tự đề xuất

| Giai đoạn | Việc | Ghi chú |
| --- | --- | --- |
| A (1–2 ngày) | W0 (cả 24 dòng), commit W9 | 0.1 (cấp admin), 0.7 (bỏ phí 5%, đang thu tiền trái lời hứa) và 0.3 (404 khi sửa tin) trước tiên. |
| B (khoảng 1 tuần) | **W10 (thư mục nghệ sĩ, follow theo id)** · W7 mục 1–3 (điện thoại, bảng, chân rail) · W3 mục 1–2 (hộp việc, số đếm) · W4 mục 1–3 (tên, tách màn, ngừng bán) · W5 mục 1, 3 (form cộng đồng, sửa wizard) · W6 mục 1, 3 (nhận hồ sơ, liên hệ) · W2 mục 2, 4 (chuông, báo admin) | Mỗi mục là một branch nhỏ. W10 trước W6.1 vì luồng nhận hồ sơ là lối vào của `/a/radar`. |
| C (một sprint) | W1 từng bước · W2 phần còn lại · W5 mục 2, 4, 7, 8 (một form, khách mời, gửi tin) · W6 mục 2 (rail 4 mục, pipeline) · W3 phần còn lại · W7 mục 4–8 | W1 bước 3 chỉ làm sau khi đo `FF.track`. |
| D (sau đó) | W4 mục 4 (mô hình vị trí, hiển thị kệ) · W5 mục 5 (hoãn/huỷ, lịch diễn, mời thành viên) · W5 mục 10 (QR trên iOS) · W8 | |

---

## 6. Kiểm tra

- Mỗi dòng của W0 có test riêng (cột Test).
- E2E cần sửa vì đổi route hoặc tên: `app.spec.ts`, `app-more.spec.ts`, `saved.spec.ts`, `profiles.spec.ts`, `site.spec.ts`, `event.spec.ts`, `list.spec.ts`, `stats.spec.ts`, `studio*.spec.ts`, `console*.spec.ts`, `projects.spec.ts`.
- Thêm E2E ở 390px cho ba back office: có lối đăng xuất và đổi vai, nút hành động của bảng nằm trong màn hình.
- `e2e/next/layout.spec.ts`: mọi route ở 390 và 1440, không cuộn ngang, nội dung lấp đầy bề ngang.
- Sau mỗi giai đoạn: chạy lại một vòng test theo vai (fan, NTC, nghệ sĩ, admin) trên preview, bám các luồng ở mục 3, và đánh dấu luồng nào đã hết ✗.
