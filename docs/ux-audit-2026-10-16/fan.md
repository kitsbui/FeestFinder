# Báo cáo UX: người hâm mộ / người tham dự (fan)

Preview: http://localhost:3000, đồng hồ cố định 14.09.2026 10:00 (Asia/Ho_Chi_Minh), dữ liệu demo.
Vai: khách chưa đăng nhập, tài khoản demo `minh@example.com`, và tài khoản mới tạo qua thẻ đăng nhập (email → mã → mật khẩu → chọn vai).
Thiết bị: điện thoại 390px (UA iPhone thật, để trang nhận ra điện thoại) và desktop 1440px. Có xem qua `/en`.
Ảnh chụp: `/tmp/claude-1000/-home-patrickstar-Desktop-FeestFinder/373f1ad5-e8b8-4d0a-ace8-9dd5ba44a801/scratchpad/ux/shots/` (bên dưới ghi ngắn là `shots/…`). Script: `ux/fan-*.mjs`.

Ghi chú về môi trường: nút "N" tròn ở góc trái dưới trong ảnh là Next dev tools, không tính. Máy được khởi động lại giữa chừng, dữ liệu demo đã được tạo lại; các phát hiện dưới đây đều được kiểm lại sau lần khởi động lại đó.

Chưa kiểm được (do thiếu dữ liệu demo hoặc vì sẽ ra ngoài localhost): mix và like/bình luận trên trang nghệ sĩ (không nghệ sĩ demo nào có mix), gửi đề nghị cho một dự án (`/p` đang có 0 dự án công khai), bước VietQR thật (preview tự xác nhận thanh toán), đăng nhập Google/Facebook/Zalo/WhatsApp, mở app Grab/Green SM, trang bán vé bên ngoài.

---

## 1. Các luồng trải nghiệm

**A. Khách tìm sự kiện cuối tuần (điện thoại, chưa đăng nhập)**
`/` ✓ (tiêu đề rõ "Cuối tuần này có gì chơi?", chip thời gian có số đếm) → chạm "Sự kiện" trong menu ☰ → `/list` ✗ (mặc định là **Bảng**, một bảng rộng 1020px bị cắt: chỉ thấy ngày, giờ và nửa tên sự kiện; giá và trạng thái phải vuốt ngang mới thấy) → tự đổi sang "Lưới" ✓ → `/e/ravo` ✓ (hero, ngày giờ, địa điểm, "Đặt xe", "Chỉ đường", "Chọn vé · từ 1.200.000₫") → kéo xuống tìm vé ✗ (khối Vé nằm **sau** cả mục Thảo luận: Thảo luận ở y≈2321, Vé ở y≈3452 trên trang cao 5565px; khi cuộn không có thanh "Mua vé" dính dưới đáy) → "Mua 1 vé thường" → `/go/ravo` → `/app/checkout/ravo?tier=…` ✗ (sang khung app, trang chỉ còn "Đăng nhập để mua vé" + nút Đăng nhập, mất tên hạng vé và giá vừa chọn).

**B. Lọc theo dòng nhạc từ thanh trên (desktop)**
`/list` → "Dòng nhạc" ▾ (Techno 4, House 3, … Industrial techno 1) → chọn "Industrial techno 1" → `/?style=industrial-techno` ✗ ("0 sự kiện cuối tuần này · Chưa có sự kiện phù hợp"). Menu đếm mọi sự kiện sắp tới nhưng lại dẫn về trang chủ, nơi chỉ xem cuối tuần. Cùng menu đó trên điện thoại ở trang chủ lại đếm "House 1 · Techno 1".

**C. Tìm kiếm**
Icon kính lúp trên thanh → sheet "Tìm kiếm" ✗ (con trỏ nằm ở nút "Đóng", gõ "ravo" thì không vào ô) → bấm vào ô, gõ, "Tìm" → tải lại cả trang sang `/list?q=…` (chỉ tìm sự kiện, không gợi ý, không có nghệ sĩ). Ô tìm ngay trong `/list` ✗: gõ "techno" rồi chờ 2 giây vẫn 15 sự kiện; phải nhấn Enter (không có nút) mới ra `?q=techno` · 5 sự kiện. Ô tìm ở trang chủ có nút "Tìm" ✓.

**D. Bản đồ Radar**
`/list` → tab "Radar 5" ✓ → "Bản đồ" ✓ (bản đồ mở nhanh, giá hiện trên ghim) ✗ danh sách bên cạnh ghi "3 SỰ KIỆN": "DnB Sunday" và "Island Pulse Festival 2026" không có toạ độ nên biến mất mà không có lời nào.

**E. Lưu sự kiện khi chưa có tài khoản → đăng ký bằng email (điện thoại)**
`/e/ravo` → ♥ → sheet "Đăng nhập" (Google, Facebook, email, Zalo, WhatsApp, mật khẩu) ✗ (lý do "Đăng nhập để lưu sự kiện" hiện bằng chữ đỏ như báo lỗi, ở tận dưới cùng) → "Tiếp tục với email" → nhập email → "Gửi mã" → "Nhập mã xác minh" (6 số, không tự gửi khi đủ 6 số) → "Xác minh" → ✗ "Đặt mật khẩu" (bắt buộc, có nhập lại) → "Tạo tài khoản" → sheet "Bạn đến với âm nhạc thế nào?" ✗ (toast "Đã lưu" đè lên giữa thẻ "Biểu diễn") → "Khám phá sự kiện" ✓ → sự kiện đã được lưu thật (♥ đặc, "4.103 QUAN TÂM") ✓. Tổng cộng 4 bước cho một cái tim.

**F. Mua vé khi đã đăng nhập**
`/e/ravo-warmup` (ghi "Bán trên FeestFinder · tối đa 6 vé · không thu phí đặt vé") → "Mua 1 vé đứng · 350.000₫" → `/go/ravo-warmup` → `/app/checkout/ravo-warmup` ✗ ("Phí dịch vụ 17.500₫", "Tổng cộng 367.500₫") → "Thanh toán 367.500₫" → preview tự xác nhận → `/app/tickets` ✓ (vé có QR, "Đã lưu trên máy · quét được khi mất mạng", "Thêm vào lịch", "Chỉ đường", "Tặng vé", "Pass vé"). Không có màn "Đã thanh toán" hay biên nhận ở giữa.

**G. Tài khoản từ thanh trên (web) và từ app**
Avatar → menu: "Người tham dự ✓ · Thêm vai nghề · Hồ sơ của tôi (`/profile`) · Dự án của tôi (`/p/mine`) · Vé của tôi (`/app/tickets`, sang khung app) · Đã lưu (`/saved`, ở lại khung web) · Đăng xuất" ✗ (không có Cài đặt, Thông báo hay Cảnh báo; hai mục dẫn sang hai khung khác nhau). Trong app: tab "Tôi" → `/app/profile` (gần giống hệt `/profile`, thêm khối "Cài đặt": Cảnh báo thông minh, Thông báo, Thành phố, Ngôn ngữ, Đăng xuất) → `/app/alerts` ✓, `/app/settings` ✓.

**H. App trên điện thoại**
`/app` ✓ (thành phố, "Cuối tuần này có gì chơi?", chip style, "SỚM NHẤT · 3", "Xem bản đồ") → chạm sự kiện → `/app/e/ravo` ✓ (thanh "từ 1.200.000₫ · Mua vé" dính đáy, "Đặt xe tới đây", "Đi cùng bạn bè", "Trước & sau show") → "Đi cùng bạn bè" → `/app/plan/ravo` ✓ (nhóm, điểm hẹn, chia tiền) ✗ ("3 NGƯỜI" nhưng có 4 dòng) → quay lại → "Trước & sau show" → `/app/guide/ravo` ✗ ("Hướng dẫn địa phương đang tạm nghỉ. Thử lại sau nhé.", API 503) → chạm nhà tổ chức hay nghệ sĩ trong lineup → `/o/…`, `/a/…` ✗ (rời app sang trang web có header khác, không còn tab bar).
`/app/tickets` → "Chế độ tại sự kiện" (khi đang diễn) → `/app/live/ravo` ✓ (sân khấu, "Nhắc tôi", bản đồ khu vực, "Giờ diễn và bản đồ đã lưu trên máy") → "Thoát chế độ tại sự kiện" → `/app/tickets` ✓.
Tab "Tôi" → Hộ chiếu lễ hội → `/app/recap/ravo-2025` ✓ (sao, điểm nổi bật, ảnh) ✗ (câu "Đánh giá khi còn nóng. Nhà tổ chức chỉ thấy điểm trung bình, không thấy tên bạn."; "10:00 VÀO CỬA" cho một đêm năm 2025).
Chuông → `/app/notifications` ✓ (3 thông báo, mỗi cái mở đúng nơi nó nói tới).

**I. Desktop vào `/app`**
`/app` hiện **hai** thanh điều hướng: nav của site ở trên (Khám phá đang sáng, nhưng link về `/`) và rail của app bên trái (Khám phá cũng sáng, link về `/app`), cộng hai icon tìm kiếm ✗.

**J. Nghệ sĩ và nhà tổ chức**
`/a` ✓ (tab Tất cả · Đã đăng · Radar, lọc vai trò/phong cách/thành phố, "Nhận booking", "Sắp diễn", ô "Tìm nghệ sĩ") → `/a/hoaprox` ✓ ("Theo dõi", "Sắp diễn" có nút "Mua vé" qua `/go/ravo?src=artist`, "Diễn nhiều nhất với") → `/o/ravoent` ✓ (sự kiện sắp tới, nghệ sĩ hay mời, địa điểm) → quay về sự kiện ✓.

**K. Bộ sưu tập**
`/saved` → "+ Mới" ✗ (sheet "Bộ sưu tập mới" lại để con trỏ ở nút Đóng) → đặt tên → "Tạo" ✓ → về "Tất cả", nút thư mục trên thẻ → "Lưu vào bộ sưu tập" ✓ → bật "Link công khai" → "Chia sẻ" ✓ → `/c/<slug>` khi chưa đăng nhập ✓ ("Tạo bởi Thành viên FeestFinder", "THỂ LOẠI · EDM 100%").

**L. "Đăng sự kiện" khi là fan**
"Đăng sự kiện" → sheet (Sự kiện · Dự án · "Xem dự án đang kêu gọi") → "Sự kiện" → `/studio/new` ✗ (màn hình trống, không header, không nút quay lại: "Tài khoản này chưa có hồ sơ nhà tổ chức" + "Tạo hồ sơ nhà tổ chức"; fan biết một đêm hay muốn báo cho FeestFinder thì không có đường nào khác) → "Dự án" → `/p/new` ✓ (form đầy đủ) → "Xem dự án đang kêu gọi" → `/p` ("0 DỰ ÁN · Chưa có dự án nào đang tìm điều này").

**M. Khác**
Nút Góp ý nổi → sheet "Bạn muốn gửi gì?" (Báo lỗi kỹ thuật · Góp ý giao diện & trải nghiệm · Đề xuất tính năng · Thắc mắc & hỗ trợ) ✓, nhưng con trỏ cũng nằm ở "Đóng". `/advertise` khi chưa đăng nhập: bảng giá CPM + "Đăng nhập để đặt quảng cáo" ✓. `/about` ✓. `/stats/venues?time=tonight` (từ "Mọi địa điểm" ở trang chủ) ✓ nhưng tên địa điểm không bấm được. `/en` ✓ dịch đầy đủ; `/app/tickets?lang=en` vẫn tiếng Việt.

---

## 2. Phát hiện

Mức độ: P0 chặn việc · P1 gây rối hoặc chậm · P2 đánh bóng. Không có lỗi P0 thật sự chặn việc: mọi luồng đều đi hết được.

| # | Mức | Ở đâu | Chuyện gì xảy ra | Bằng chứng | Đề xuất sửa |
|---|---|---|---|---|---|
| 1 | P1 | `/e/<slug>` → `/app/checkout/<slug>`; `/about`; FAQ trang chủ. `festfinder-web/src/kd/web/copy.ts:110` (`soldHere`), `web/event/tickets.tsx:143`, `festfinder-backend/src/routes/commerce.ts:20,58` | Trang sự kiện ghi "Bán trên FeestFinder · tối đa 6 vé · **không thu phí đặt vé**", `/about` có chỉ số "0 PHÍ ĐẶT VÉ", nhưng checkout cộng "Phí dịch vụ 17.500₫" (5%, `SERVICE_FEE_PCT`). Người mua thấy giá tăng ở bước cuối, trái với lời hứa ngay trên trang. | `shots/fan-checkout-m.png`, `shots/fan-about-d.png`, `shots/fan-event-d.png` | Chọn một hướng: bỏ phí, hoặc giữ phí và nói rõ trên trang sự kiện ("+5% phí dịch vụ"), sửa `soldHere`, FAQ và `/about`. |
| 2 | P1 | `/list` trên điện thoại. `web/list/browser.tsx:58` (`view: 'table'` mặc định), `:320` (`min-w-[1020px]`) | Mặc định là "Bảng"; trên 390px chỉ thấy ngày, giờ và nửa tên, còn giá, thành phố và trạng thái nằm ngoài màn hình. | `shots/fan-list-table-m.png` | Dưới bề rộng tab, mặc định "Lưới" (hoặc dòng gọn kiểu `/app/saved`); giữ "Bảng" cho desktop. |
| 3 | P1 | Menu "Dòng nhạc" (desktop) và ☰ (điện thoại). `web/chrome.tsx:30` (`styleHref` → `/?style=`), `:43` (đếm `time=all`), `:78` | Menu đếm mọi sự kiện sắp tới ("Industrial techno 1") nhưng dẫn về trang chủ, nơi chỉ xem cuối tuần → "0 sự kiện cuối tuần này". Trên trang chủ, cùng menu lại đếm theo cuối tuần ("House 1 · Techno 1"), nên số đổi theo trang đang đứng. | `shots/fan-genre-menu-d.png`, `shots/fan-home-style-industrial-d.png`, `shots/fan-hamburger-m.png` | Dẫn tới `/list?style=<k>` (mọi lúc), hoặc đếm đúng khung thời gian mà link mở ra. Dùng một nguồn đếm cho cả hai menu. |
| 4 | P1 | Mọi sheet có ô nhập: Tìm kiếm, Bộ sưu tập mới, Góp ý. `kd/ui/sheet.tsx:17` (`showModal()` chạy sau `autoFocus` của ô nhập) | Khi sheet mở, con trỏ nằm ở nút "Đóng"; gõ phím thì chữ không vào ô (đã thử gõ "ravo": ô vẫn trống). | `shots/fan-search-focus-d.png`, `shots/fan-collection-new-m.png`, `shots/fan-feedback-d.png` | Sau `showModal()`, focus vào `[autofocus]` hoặc ô nhập đầu tiên trong dialog. |
| 5 | P1 | `/e/<slug>` trên điện thoại | Khối Vé nằm sau cả Thảo luận và "Đại sứ" (Vé ở y≈3452/5565). Nút "Chọn vé" ở hero trôi mất khi cuộn; không có thanh mua dính đáy như `/app/e/<slug>`. Thanh tab lúc cuộn vẫn sáng "Line-up" khi đang ở Thảo luận. | `shots/fan-event-m-full.png`, `shots/fan-event-m-mid.png`, so với `shots/fan-app-event-m.png` | Trên điện thoại, đưa Vé lên ngay sau Lineup và thêm thanh "từ … · Mua vé" dính đáy giống bản app. |
| 6 | P1 | Bấm "Mua vé" khi chưa đăng nhập | Bị đưa sang `/app/checkout/…` (đổi sang khung app, không header) chỉ còn "Đăng nhập để mua vé"; không thấy sự kiện, hạng vé hay giá vừa chọn. | `shots/fan-buy-signedout-m.png` | Mở sheet đăng nhập ngay trên trang sự kiện với intent "mua hạng X", xong rồi mới sang checkout; hoặc checkout vẫn hiện tóm tắt đơn và đặt nút đăng nhập bên trong. |
| 7 | P1 | `/studio/new` khi là fan (từ "Đăng sự kiện" → "Sự kiện") | Màn hình trống, không header, không nút quay lại, chỉ có "Tạo hồ sơ nhà tổ chức". Fan muốn báo một đêm họ biết không có form cộng đồng (CLAUDE.md có nhắc "the community form"). | `shots/fan-studio-new-as-fan-d.png` | Thêm lựa chọn "Gửi sự kiện bạn biết" (form cộng đồng vào hàng chờ duyệt) cho fan, kèm nút quay lại; chỉ đề nghị tạo hồ sơ nhà tổ chức khi người đó là BTC. |
| 8 | P1 | Hai trang sự kiện `/e/<slug>` và `/app/e/<slug>` | Hai trang khác nhau về tính năng: chỉ bản app có "Đi cùng bạn bè", "Trước & sau show", "Nhắc trước 15 phút" và thanh mua dính đáy; chỉ bản web có breadcrumb, FAQ, "Thêm lịch" ở hero, khối "Cũng của …". Mở trang nào tuỳ vào chỗ người dùng đi vào. | `shots/fan-event-d.png`, `shots/fan-app-event-m.png` | Gộp thành một trang sự kiện (xem phần 3). |
| 9 | P1 | `/profile` và `/app/profile`; `/saved` và `/app/saved` | Hai hồ sơ gần như trùng (Sắp đi, Hộ chiếu lễ hội, Gu của bạn, Khoảnh khắc, Huy hiệu, Đang làm, Đang theo dõi); Cài đặt, Cảnh báo, Ngôn ngữ, Thành phố chỉ có ở bản app. Hai trang Đã lưu: bản web có thẻ, bộ sưu tập, chia sẻ; bản app chỉ là dòng, không có bộ sưu tập. Menu tài khoản trỏ tới bản web, tab bar trỏ tới bản app. | `shots/fan-d_profile.png`, `shots/fan-d_app_profile.png`, `shots/fan-d_saved.png`, `shots/fan-d_app_saved.png` | Mỗi thứ một trang (xem phần 3). |
| 10 | P1 | `/app` trên desktop. `kd/app/root.tsx:45` (`current={tab === 'explore' ? 'explore' …}`) | Nav của site và rail của app cùng hiện; "Khám phá" sáng ở cả hai nhưng một cái về `/`, cái kia về `/app`; có hai icon tìm kiếm. | `shots/fan-d_app.png` | Không cho nav của site sáng "Khám phá" khi đang ở `/app`; tốt hơn là chỉ giữ một "Khám phá" (rail trỏ về `/`, hoặc trang chủ dùng chung một màn). |
| 11 | P1 | Lưu, Hype và "Quan tâm" trên trang sự kiện | Ba tín hiệu "thích" chồng lên nhau: ♥ kèm "4.102 QUAN TÂM" (đếm lượt lưu), khối "HYPE 2.140 hype · Hype ngay" có mốc mở khoá, và danh sách "Đã hype" (`/app/hyped`) không có đường nào dẫn tới. Fan không biết khác nhau ở đâu. | `shots/fan-event-d.png` | Gộp Hype vào Lưu (lưu là hype), hoặc nói rõ một câu và hiện "Đã hype" trong hồ sơ. |
| 12 | P1 | Đăng ký bằng email (`kd/sign-in.tsx`) | 4 bước: email → mã → **mật khẩu bắt buộc + nhập lại** → chọn vai. Đã xác minh email bằng mã rồi mà vẫn bắt đặt mật khẩu: thêm ma sát. Mã 6 số không tự gửi khi nhập đủ. | `shots/fan-signup-1-email-m.png` … `shots/fan-signup-4-persona-m.png` | Cho đăng nhập chỉ bằng mã (mật khẩu tuỳ chọn, đặt sau trong Cài đặt); tự gửi khi đủ 6 số. |
| 13 | P1 | "Trước & sau show" → `/app/guide/<slug>`. `kd/app/event.tsx:118` | Mục luôn hiện, kể cả khi hướng dẫn AI không chạy (API 503) → "Hướng dẫn địa phương đang tạm nghỉ. Thử lại sau nhé." Một ngõ cụt có nút "Thử lại" vô ích. | `shots/fan-guide-m.png` | Chỉ hiện mục khi API báo có hướng dẫn cho sự kiện đó. |
| 14 | P2 | Bản đồ `/list?view=map` | Radar có 5 sự kiện, bản đồ ghi "3 SỰ KIỆN"; 2 sự kiện không có toạ độ biến mất mà không có lời nào. | `shots/fan-map-radar-d.png` | Thêm dòng "2 sự kiện chưa có vị trí" (bấm vào thì mở danh sách). |
| 15 | P2 | Ô tìm trong `/list` | Chỉ lọc khi nhấn Enter; không có nút, không lọc khi đang gõ. | (log `fan-ev1.mjs`: 15 → 15 khi chỉ gõ, 5 sau Enter) | Lọc sau khi ngừng gõ (debounce) hoặc thêm nút "Tìm" như trang chủ. |
| 16 | P2 | Sheet đăng nhập. `kd/sign-in.tsx:39` (lý do được lưu vào state `err`) | "Đăng nhập để lưu sự kiện" / "Đăng nhập để theo dõi" hiện bằng chữ đỏ của lỗi, ở cuối sheet. | `shots/fan-signin-sheet-m.png` | Hiện lý do như phụ đề dưới tiêu đề, màu thường. |
| 17 | P2 | Sau khi đăng ký | Toast "Đã lưu" nằm đè lên giữa sheet chọn vai. | `shots/fan-signup-4-persona-m.png` | Đặt toast trên lớp dialog hoặc chờ sheet đóng rồi mới hiện. |
| 18 | P2 | `/e/<slug>` desktop | Ba nút lime cùng lúc: "Chọn vé · từ 1.200.000₫", "Mua vé" (thanh tab), "Mua 1 vé thường · 1.200.000₫", trái quy tắc "một nút lime mỗi màn". | `shots/fan-event-d.png` | Chỉ giữ lime cho nút mua trong khối Vé; hai nút kia dùng kiểu sáng hoặc viền. |
| 19 | P2 | Lineup. `web/event/lineup.tsx:33` (cố ý xếp theo billing, set muộn nhất lên đầu) | Thứ tự hiện: Headline Hoaprox 20:00, rồi 23:30, 22:00, 21:15, 19:00, 18:00. Có ghi giờ nên trông như danh sách bị đảo, không phải thứ hạng. | `shots/fan-event-d.png` | Xếp theo giờ (kiểu timetable), hoặc bỏ giờ ở danh sách billing. |
| 20 | P2 | Khối "ĐẠI SỨ" trên trang sự kiện (`web/event/community.tsx:377`) | "Trần · 37 LƯỢT XEM", "Anh · 12 LƯỢT XEM", không nói đại sứ là gì, cũng không có cách để trở thành đại sứ. | `shots/fan-event-m-mid.png` | Bỏ khỏi trang công khai, hoặc thêm hành động ("Mời bạn bè") để khối này có ý nghĩa. |
| 21 | P2 | Cuối trang sự kiện và trang nghệ sĩ | "Báo cáo tin này" và "Bạn là nghệ sĩ này?" nằm **dưới** footer, sau dòng bản quyền, rất khó thấy. | `shots/fan-event-d.png`, `shots/fan-artist-d.png` | Đưa vào nội dung trang (cuối khối thông tin, hoặc menu "…" cạnh Chia sẻ). |
| 22 | P2 | "Gu của bạn" (`/profile`), "THỂ LOẠI TỔ CHỨC" (`/o/…`), "THỂ LOẠI" (`/c/…`) | Luôn là "EDM 100%" vì chỉ có một thể loại. Hộ chiếu ghi "3 dòng nhạc" nhưng Gu chỉ có EDM. | `shots/fan-d_profile.png`, `shots/fan-org-d.png` | Chia theo style (Techno, House…) như chip. |
| 23 | P2 | Vé `/app/tickets` | Hai mã khác nhau trên một vé: "MÃ VÉ FFDEMO22" và "FF-RAVO-DEM1" dưới QR. Ra cổng không biết đọc mã nào. | `shots/fan-tickets-m.png` | Chỉ hiện một mã (mã của QR), nếu cần thì ghi rõ "Mã đơn". |
| 24 | P2 | Nút Góp ý nổi | Trên điện thoại nút đè lên nội dung: tiêu đề "5 sự kiện cuối tuần này" ở trang chủ, nút "Chỉ đường" ở `/app/tickets`, góc thẻ. | `shots/fan-home-m.png`, `shots/fan-tickets-m.png` | Cho nút nhỏ hơn hoặc thu vào mép khi cuộn; trong app thì để trong tab "Tôi". |
| 25 | P2 | `/app/recap/<slug>` (`kd/app/copy.ts:218`) | Câu giải thích "Đánh giá khi còn nóng. Nhà tổ chức chỉ thấy điểm trung bình, không thấy tên bạn." là loại câu "tại sao chúng tôi hỏi" mà quy tắc Lean UI bỏ. "10:00 VÀO CỬA" cho một đêm năm 2025 trông như lấy giờ hiện tại. | `shots/fan-recap-m.png` | Bỏ câu đó; giờ vào cửa lấy từ lúc check-in thật, không có thì ẩn. |
| 26 | P2 | `/app/plan/<slug>` | Tiêu đề "3 NGƯỜI" nhưng có 4 dòng (3 "Sẽ đi" + 1 "Chưa trả lời"). | `shots/fan-plan-m.png` | "3 sẽ đi · 1 chưa trả lời". |
| 27 | P2 | `/app/chat/<id sai>` | Hiện khung chat trống có nút "Gửi", không báo là không tìm thấy. | `shots/fan-chat-bad-m.png` | Trạng thái không tìm thấy + đường quay lại. |
| 28 | P2 | Ngôn ngữ. `kd/app/root.tsx:27-30` | Web theo URL (`/en`, `?lang=en`); app theo lựa chọn lưu trên máy ở `/app/profile`. Đang đọc `/en` mà bấm "Vé của tôi" thì ra tiếng Việt; `/app/tickets?lang=en` vẫn tiếng Việt. | (log `fan-ev3.mjs`) | Một nguồn ngôn ngữ: `?lang`/cookie dùng chung cho web và app. |
| 29 | P2 | Menu tài khoản (`web/chrome.tsx:126-129`) | Fan nào cũng thấy "Dự án của tôi"; không có Cài đặt, Thông báo hay Cảnh báo; "Vé của tôi" sang khung app còn "Đã lưu" ở lại khung web. | `shots/fan-account-menu-m.png` | Thêm "Cài đặt" và "Thông báo"; chỉ hiện "Dự án của tôi" khi người đó đã có dự án. |
| 30 | P2 | Checkout `ravo-warmup` | Hạng "Bàn 4 người · Mở bán khi VIP hết vé" mà lại có nhãn "CÒN VÉ" và chọn mua được (sự kiện này không có hạng VIP). | `shots/fan-checkout-d.png` | Khi có điều kiện "mở bán khi…" thì hiện "Chưa mở bán" và không cho chọn (như `/e/ravo`). |
| 31 | P2 | Checkout trên desktop | Form hẹp 624px bên trái, phần phải trống; thanh tổng dính đáy trải hết bề ngang (giá ở tận trái, nút ở tận phải). Tổng tiền lặp 3 lần. | `shots/fan-checkout-d.png` | Hai cột trên desktop: form bên trái, tóm tắt đơn + nút ở bên phải. |
| 32 | P2 | Trang chủ `?style=…` | Khối "Tối nay ở đâu" không theo style đang lọc (đang lọc techno mà vẫn hiện blues, pop rock). | `shots/fan-home-style-industrial-d.png` | Áp cùng bộ lọc, hoặc ẩn khối khi đang lọc. |
| 33 | P2 | `/e/<slug>` | Không có landmark `<main>` (các trang khác có). | (Playwright: `locator('main')` hết giờ chờ) | Bọc nội dung trong `<main>`. |
| 34 | P2 | `/stats/venues` | Tên địa điểm không bấm được, chỉ dòng sự kiện có link. | (log `fan-13`) | Cho tên địa điểm mở bản đồ hoặc danh sách đã lọc theo địa điểm đó. |

Ghi chú: "Đặt xe" trên điện thoại thật (UA iPhone) mở Grab / Green SM đúng theo quốc gia ✓ (`shots/fan-ride-m.png`); trên desktop chỉ có QR, cũng hợp lý.

---

## 3. Tính năng trùng hoặc chồng lấn, và cách gộp

1. **Hai trang sự kiện** (`/e/<slug>` ↔ `/app/e/<slug>`). Gộp thành một trang dùng chung một component; khung (header web hay tab bar app) chỉ là vỏ. Lấy từ bản app: thanh mua dính đáy, "Đi cùng bạn bè", "Trước & sau show" (khi có), "Nhắc trước 15 phút". Lấy từ bản web: breadcrumb, FAQ, "Cũng của BTC". `/app/e/<slug>` chuyển hướng về `/e/<slug>`.
2. **Hai hồ sơ** (`/profile` ↔ `/app/profile`). Giữ một trang "Tôi" có khối Cài đặt; menu tài khoản trên web và tab "Tôi" cùng trỏ vào đó.
3. **Hai trang Đã lưu** (`/saved` ↔ `/app/saved`). Giữ bản có bộ sưu tập và chia sẻ (`/saved`); trên điện thoại hiển thị dạng dòng gọn.
4. **Hai trang chủ "Cuối tuần này có gì chơi?"** (`/` ↔ `/app`), cùng tiêu đề, chip và hero. Trên desktop, `/app` còn chồng thêm rail lên nav của site. Gợi ý: `/` là Khám phá cho mọi người; với người đã đăng nhập, rail chỉ thêm Bản đồ / Đã lưu / Vé / Tôi chứ không có Khám phá thứ hai.
5. **Hai bản đồ** (`/list?view=map` ↔ `/app/list`) với hai bộ lọc khác nhau ("Mọi kiểu" so với hàng chip style cố định có cả Trance, Hardstyle đang 0 sự kiện). Dùng một màn bản đồ.
6. **Ba ô tìm kiếm** (icon trên thanh, ô trong `/list`, ô ở trang chủ, cộng icon tìm trong `/app`) cho ra ba kiểu kết quả: sheet tải lại cả trang, ô `/list` chỉ chạy khi nhấn Enter, ô trang chủ có nút. Gộp thành một ô tìm dùng chung: gợi ý ngay sự kiện, nghệ sĩ và địa điểm, Enter thì sang `/list?q=`.
7. **Ba bộ lọc dòng nhạc**: menu "Dòng nhạc" (dẫn về trang chủ cuối tuần), chip trên trang chủ (chỉ style có trong cuối tuần) và "Mọi kiểu" trong `/list` (trộn kiểu đêm với style). Chỉ để một nơi lọc là `/list?style=`; menu và chip đều dẫn về đó với số đếm khớp.
8. **Lưu ♥, Hype 🔥 và "Quan tâm"**: gộp làm một (xem #11). Đồng thời bỏ trang mồ côi `/app/hyped`.
9. **"Đang theo dõi"** có ở `/profile`, ở `/app/profile` và ở `/app/following` (trang mồ côi). Giữ danh sách trong hồ sơ, bỏ hoặc nối link tới `/app/following`.
10. **"Đặt xe"** xuất hiện hai lần trên mỗi trang sự kiện (hàng địa điểm ở hero và khối Địa điểm). Chấp nhận được, nhưng ở hero có thể chỉ để "Chỉ đường".

---

## 4. Ngõ cụt và link còn thiếu

- `/studio/new` khi là fan: không header, không quay lại, không có form cộng đồng (#7).
- `/app/guide/<slug>` khi AI không chạy: "đang tạm nghỉ" + "Thử lại" (#13).
- `/app/checkout/<slug>` khi chưa đăng nhập: mất ngữ cảnh đơn hàng (#6).
- `/?style=<style hiếm>` từ menu "Dòng nhạc": "0 sự kiện cuối tuần này" dù menu hứa có 1 (#3).
- `/app/hyped` và `/app/following`: không có link nào dẫn tới (đã grep `festfinder-web/src`).
- `/app/chat/<id>`: chỉ vào được qua thông báo hoặc kế hoạch; id sai thì ra khung trống (#27).
- Từ app sang `/o/<slug>` hay `/a/<slug>`: rời khung app, mất tab bar, nút back của trình duyệt là đường duy nhất về.
- Trang chủ không có link tới `/p` (dự án): fan chỉ thấy qua sheet "Đăng sự kiện" → "Xem dự án đang kêu gọi". CLAUDE.md nói dự án cố ý không có tab, nhưng cũng nên có một lối từ footer.
- Không có link từ web tới các tính năng chỉ app có: kế hoạch nhóm, hướng dẫn quanh sự kiện, Cảnh báo thông minh, Cài đặt thông báo. Người chỉ dùng web không bao giờ thấy chúng (trừ nút "Thông báo" trên `/profile`).
- `/stats/venues`: tên địa điểm không phải link (#34).
- Sau khi thanh toán xong: nhảy thẳng sang `/app/tickets`, không có màn xác nhận hay biên nhận (preview tự xác nhận; cần kiểm lại với VietQR thật).

---

## 5. Những gì làm tốt

- Trang chủ trả lời ngay câu hỏi của fan; chip thời gian có số đếm.
- Bấm Lưu/Theo dõi/Hype khi chưa đăng nhập mở đúng sheet đăng nhập, và sau khi đăng ký hành động đó được thực hiện luôn (sự kiện đã lưu).
- "Đặt xe" trên điện thoại hiện Grab / Green SM theo quốc gia, kèm địa chỉ đầy đủ để dán.
- Vé trong app: QR lớn, lưu offline, "Thêm vào lịch", "Chỉ đường", "Tặng vé", "Pass vé"; chế độ tại sự kiện (`/app/live`) với giờ diễn từng sân khấu và nhắc giờ rất hợp đêm diễn.
- Tab Tất cả · Đã đăng · Radar và nhãn RADAR rõ ràng trên `/list` và `/a`.
- Bộ sưu tập: tạo, thêm, bật link công khai, chia sẻ đều mượt; trang `/c/<slug>` gọn.
- Thông báo mở đúng màn hình liên quan; Cảnh báo thông minh có số "1 SỰ KIỆN ĐANG KHỚP" ngay khi chỉnh.
- `/en` dịch đầy đủ, kể cả ngày ("MONDAY 14 SEP") và tên thành phố.
