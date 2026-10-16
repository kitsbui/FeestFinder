# Báo cáo UX: Nhà tổ chức (organiser)

Người kiểm thử: vai **nhà tổ chức sự kiện**. Preview `http://localhost:3000`, đồng hồ cố định 14/09/2026 10:00 (Asia/Ho_Chi_Minh), dữ liệu demo.
Ảnh chụp nằm ở `/tmp/claude-1000/-home-patrickstar-Desktop-FeestFinder/373f1ad5-e8b8-4d0a-ace8-9dd5ba44a801/scratchpad/ux/shots/` (dưới đây viết tắt là `shots/`). Kịch bản: `ux/org-a-demo.mjs`, `ux/org-b-flows.mjs`.

Tài khoản đã dùng: `team@ravolution.vn` (Ravolution Entertainment) và 3 tài khoản email mới (`signup()`): một tài khoản nhận quản lý **Concrete Crew**, một tài khoản tạo **Org Empty Tester**, rồi đổi vai sang Nghệ sĩ.
Dữ liệu tạo ra (admin có thể duyệt hoặc trả lại): sự kiện **Org Test Night** (đang duyệt, hạng vé Early bird), một yêu cầu quảng cáo cho sự kiện này, dự án **Rooftop Techno Series** (đang duyệt), khách mời "Khách UX" của Warm-up, lượt check-in vé `FF-RW-00044`, yêu cầu nhận quản lý Concrete Crew (đang chờ), nhà tổ chức "Org Empty Tester" cùng bản nháp "Bank draft".

Lưu ý: preview đã được khởi động lại giữa chừng. Một vài phát hiện (gig đã đăng, thông báo hẹn giờ rồi huỷ, dự án trong `/p/mine`) có từ lần chạy đầu và chưa chụp lại. Những dòng đó ghi "lần chạy 1" thay cho đường dẫn ảnh.

---

## 1. Các luồng trải nghiệm

✓ = trơn tru · ✗ = gãy hoặc gây rối · ~ = được nhưng còn vướng

### A. Từ fan trở thành nhà tổ chức (tài khoản mới)
1. ✓ Đăng ký → trang chủ tự mở sheet **"Bạn đến với âm nhạc thế nào?"** với 3 lựa chọn: Khám phá sự kiện / Biểu diễn / Tổ chức sự kiện (`shots/org-new-onboarding.png`).
2. ✓ Chọn "Tổ chức sự kiện" → nhập tên, loại, thành phố → "Tạo hồ sơ" → vào `/studio`.
3. ~ Nếu bỏ qua bước đó, có ba lối vào sau: menu tài khoản **"Thêm vai nghề"**, nút nav "Đăng sự kiện" → "Sự kiện" → `/studio/new`, hoặc footer "Cho nhà tổ chức". Hai lối sau dẫn tới cổng chặn **"Tài khoản này chưa có hồ sơ nhà tổ chức"** → "Tạo hồ sơ nhà tổ chức" (`shots/org-new-gate.png`).
4. ✗ Tạo xong, người dùng bị đưa về `/studio`, không quay lại `/studio/new` nơi họ định đăng sự kiện (`role-picker.tsx:101`).
5. ✗ Studio của nhà tổ chức mới hiện tiêu đề "Chưa có sự kiện nào", một bảng trống chỉ có tiêu đề cột và không có nút "Đăng sự kiện đầu tiên" (`shots/org-empty-dash.png`).
6. ✗ Mục "Việc cần làm" ghi **"Chưa xác minh · thiếu tên pháp nhân, mã số thuế, tài khoản nhận tiền"** và dẫn tới `/studio/profile`. Trang đó **không có ô tài khoản ngân hàng**. Ô này chỉ có ở `/studio/revenue`, và chỉ hiện khi đã chọn được một sự kiện có số liệu doanh thu. Với bản nháp, trang Doanh thu chỉ ghi "Chọn một sự kiện để xem mục này" (`shots/org-empty-revenue-draft.png`). Kết quả: nhà tổ chức mới không thể hoàn tất xác minh.

### B. Nhận quản lý hồ sơ nhà tổ chức đã có trên FeestFinder
1. ✗ Trên `/o/w12` (chưa xác minh), link **"Bạn là nhà tổ chức này?"** nằm *dưới footer*, sát mép cuối trang (`shots/org-claimlink-w12.png`, `web/org/page.tsx:246`).
2. ~ Lối thực tế: Studio → "Tạo hồ sơ nhà tổ chức" → gõ tên. Chỉ khi gõ trùng tên mới hiện **"Đã có trên FeestFinder? Nhận quản lý"** cùng nút "Nhận" (`shots/org-new-claim-suggest.png`).
3. ✗ Bấm "Nhận" thì sheet đóng ngay. Không có lời xác nhận, không hỏi bằng chứng (API nhận được `note` và `proofUrl`, nhưng UI không gửi), không cho biết bao lâu thì có kết quả (`role-picker.tsx:113-116`).
4. ✗ `/studio` vẫn hiện **"Tài khoản này chưa có hồ sơ nhà tổ chức"** kèm nút lime "Tạo hồ sơ nhà tổ chức" (`shots/org-new-after-claim.png`). Màn này mời người dùng tạo bản trùng, trái với quy tắc "listed profiles are claimed, never duplicated". Trong khi đó menu tài khoản ghi "Nhà tổ chức · CHỜ DUYỆT" và trỏ về chính cổng chặn này (`shots/org-new-menu-after-claim.png`).
5. ✗ Sự kiện do Radar tìm thấy (đọc code, preview này không có dữ liệu Radar): trang sự kiện hiện "FeestFinder Radar · tìm thấy trên …" thay cho nhà tổ chức. Trang không có nút nhận quản lý, cũng không link tới hồ sơ placeholder (`web/event/page.tsx:107-114`). `POST /events/:id/claims` chỉ nhận sự kiện của cộng đồng (`routes/community.ts:182`). Nhà tổ chức không có đường nào từ trang sự kiện của mình để nhận lại nó.

### C. Đăng sự kiện mới (wizard `/studio/new`)
1. ✓ Nút "Đăng sự kiện" trên nav hỏi "Sự kiện / Dự án" (`shots/org-site-post-sheet.png`). Nút "Sự kiện mới" trên rail vào thẳng wizard. Nút đóng (X) quay về trang trước.
2. ~ Bước 1 "Cơ bản": tên (tối đa **60**), dòng nhạc, **Logo bắt buộc (tải lên)**, **Trang sự kiện bắt buộc** (placeholder `https://facebook.com/events/…`), mô tả, dàn nghệ sĩ, ảnh bìa (`shots/org-wz-1.png`). Nhà tổ chức nhỏ không có trang web hay event Facebook thì không thể gửi duyệt.
3. ✗ Bước 2 "Thời gian & địa điểm": chỉ có **một ngày** (Ngày / Mở cửa / Kết thúc), nên festival 2–3 ngày không nhập được trong wizard. Địa điểm mới chỉ có tên và thành phố, **không có địa chỉ** (`shots/org-wz-2.png`). Ngay trong demo đã thấy hệ quả: kiểm duyệt nhắn lại "Địa điểm vẫn chưa xác minh. Gửi tên địa điểm chính xác kèm một mốc gần đó".
4. ✗ Bước 3 "Vé": đã bật **"Bán vé trên FeestFinder"** và có hạng vé Early bird mà vẫn bị báo **"Còn thiếu trước khi gửi: Giá và link bán vé"** vì chưa có link bán vé bên ngoài (`shots/org-wz-3-noticketlink.png`, `shots/org-wz-4-missing-link.png`, `wizard.tsx:120`). Câu "Người mua thanh toán tại FeestFinder; hết hạng vé thì dùng link bán vé." xuất hiện hai lần trên cùng màn hình (`wizard.tsx:396`).
5. ~ Bước 4 "Xem lại & gửi duyệt" thực chất không cho xem lại gì: chỉ có ô "Thông tin chính xác và tôi có quyền tổ chức sự kiện này." và nút "Gửi duyệt".
6. ✓ Sau khi gửi có thẻ thành công: "Org Test Night sẽ lên FeestFinder sau khi được duyệt. Bạn sẽ nhận email và thông báo trong Hộp thư.", kèm "Đẩy tin" / "Về bảng điều khiển" / "Đăng sự kiện khác".
   ✗ Thanh trên cùng vẫn ghi **"NHÁP · TỰ LƯU"** (`shots/org-wz-5-sent.png`, `wizard.tsx:295`).

### D. Chờ duyệt và khi bị yêu cầu sửa
1. ✓ `/studio/events?status=in_review` hiện "ĐANG DUYỆT · Gửi vừa xong" (`shots/org-events.png`).
2. ✗ Kiểm duyệt yêu cầu sửa gì (ví dụ "After Hours cần bổ sung hai thứ") thì chỉ nằm trong **Hộp thư** (`shots/org-inbox.png`). Trình sửa của chính sự kiện đó chỉ ghi "ĐANG DUYỆT · gửi 08:00 14/09/2026", không có yêu cầu nào (`shots/org-ed-review.png`). Ghi chú kiểm duyệt chỉ hiện khi status là `rejected` (`editor.tsx:296`).
3. ✗ Tab Thông báo ghi **"Tin bị trả lại: Ravolution After Hours cần ảnh…"** trong khi sự kiện đó đang "Đang duyệt" (`shots/org-inbox-notif.png`).
4. ✗ Trong "Việc cần làm" trên dashboard, mục của sự kiện đang duyệt hay đang đăng là chữ thường, không bấm được. Chỉ mục của bản nháp hoặc tin bị trả lại mới có link (`dashboard.tsx:203-207`).

### E. Sửa một sự kiện đang bán vé
1. ✓ Dashboard → "Sửa sự kiện" → `/studio/events/<id>`, gồm 6 khối. Khối nào sửa sẽ phải duyệt lại thì có nhãn "SỬA SẼ DUYỆT LẠI" (`shots/org-ed-live.png`).
2. ✗ **P0.** Sửa tên rồi bấm "Lưu thay đổi" thì hiện hộp thoại **"Gửi duyệt lại tin đang đăng? Bạn đã sửa ngày, giờ, địa điểm, giá hoặc ảnh bìa. Lượt lưu và quan tâm được giữ."** (`shots/org-live-confirm.png`). Hộp thoại không nhắc tới tên (thứ tôi vừa sửa). Nghiêm trọng hơn, nó **không cảnh báo rằng trang sự kiện sẽ biến mất**: API chuyển status thành `in_review` (`routes/organizer/events.ts:308-313`), và sự kiện đang duyệt trả **404** công khai (đã kiểm: `/e/ravo-after-hours` → 404). Chỉ cần sửa một lỗi chính tả trên sự kiện đã bán 742 vé là trang vé và việc bán vé dừng cho tới khi đội duyệt xong.
3. ✗ Không có thao tác **huỷ hoặc hoãn sự kiện**: menu "…" chỉ có "Nhân bản" (và "Xoá" cho bản nháp). API cũng không có route nào cho việc này.
4. ✗ API đã có `PUT /organizer/events/:id/timetable` và `/zones` (giờ diễn, sân khấu) nhưng Studio không có màn nào dùng tới. Festival nhiều sân khấu không thể đăng lịch diễn.

### F. Bán vé và đêm diễn
1. ✓ `/studio/attendees`: KPI, bộ lọc Tất cả/Đã vào/Chưa vào/VIP/Hoàn tiền, tìm theo tên/SĐT/mã, "Tải CSV", menu từng dòng "Gửi lại vé / Hoàn tiền đơn".
2. ✓ `/studio/door` trên điện thoại: kết quả hiện thành thẻ lớn rõ màu: **"Hợp lệ"** xanh, **"Đã dùng"** vàng ("Đã quét lúc 10:00 tại cổng chính"), **"Không hợp lệ"** đỏ (`shots/org-m-door-valid.png`, `org-m-door-used.png`, `org-m-door-invalid.png`).
   ✗ Hạng vé hiện bằng tiếng Anh, "Standing", dù trên trang là "Vé đứng".
   ✗ Mã vé không hề tồn tại cũng báo "Mã không thuộc sự kiện này".
   ✗ Nút "Bật camera" chỉ có khi trình duyệt có `BarcodeDetector` (`door.tsx:253`), tức là không có trên iPhone Safari. Ở đó khung **"ĐƯA MÃ QR VÀO KHUNG"** chỉ để trang trí.
3. ✓ `/studio/revenue`: Thực nhận / Doanh thu / Phí / Lịch chi trả / Tài khoản nhận tiền, rõ ràng.

### G. Tiếp thị
1. ~ `/studio/announce`: mặc định chọn nhóm **"Đã lưu 0"**, trong khi "Đã mua vé 742" mới là nhóm thường cần gửi. Vì vậy dòng "Tới 0 / 0 người" hiện ngay từ đầu (`shots/org-announce.png`, `announce.tsx:31`).
   ✓ Hẹn giờ rồi "Huỷ lịch" chạy tốt (lần chạy 1).
2. ~ `/studio/promos`: tạo mã chạy tốt. Mỗi khách mời có một công tắc không có nhãn hiển thị (thực ra là "đã check-in") (`shots/org-promos.png`).
3. ✓ `/studio/ads`: "Đẩy tin" từ wizard hoặc dashboard mở sẵn drawer cho đúng sự kiện. Gửi xong có toast "Đã gửi FeestFinder · chúng tôi trả lời trong hai ngày làm việc" và dòng "ĐANG CHỜ / Rút yêu cầu" (`shots/org-ads-drawer.png`, `org-ads-after.png`).
   ~ Thanh chọn sự kiện ở đầu trang không có tác dụng gì: danh sách yêu cầu không lọc theo sự kiện đã chọn.

### H. Gig & booking
1. ✓ Đăng gig thành công (lần chạy 1): "ĐANG NHẬN · 0 hồ sơ".
2. ✗ "Mời nghệ sĩ": ô tìm liệt kê cả nghệ sĩ **chưa có người quản lý**. Phải điền hết rồi bấm "Gửi lời mời" mới nhận toast **"DJ Mie chưa nhận quản lý hồ sơ nên chưa ai đọc được lời mời"** (`shots/org-gigs-invite-409.png`, `gigs.tsx:209`).
3. ✗ Ngay dưới form mời, phần trống "Yêu cầu booking đã gửi" ghi "Gửi yêu cầu booking từ hồ sơ nghệ sĩ", trái với cái form vừa ở trên (`copy.ts:389`).

### I. Dự án (`/p/new`, `/p/<slug>/manage`, `/p/mine`)
1. ✗ Studio không có đường nào tới Dự án. Chỉ vào được qua menu tài khoản trên site ("Dự án của tôi") hoặc nút "Đăng sự kiện" → "Dự án".
2. ~ `/p/new`: nhãn tiền tệ hiện **"Ngân sách (…)" / "Cần gọi (…)"** trước khi chọn thành phố. Số tiền không có dấu phân cách hàng nghìn (400000000), khác với wizard (450.000) (`shots/org-p-new.png`).
3. ✓ "Tạo dự án" → `/p/rooftop-techno-series/manage` → "Gửi duyệt" → toast "Đã gửi duyệt. Đội ngũ thường trả lời trong một ngày." (`shots/org-p-manage-review.png`).
   ~ Khi đang duyệt, tiêu đề "Gói tài trợ" vẫn hiện nhưng bên dưới trống. Trang có hai nút lưu riêng ("Lưu" và "Lưu gói tài trợ").
4. ✗ Bước "Đã thành sự kiện" bắt người dùng gõ phần **slug sau /e/** thay vì chọn từ danh sách sự kiện của mình (`web/projects/manage.tsx:273`).
5. ~ Dự án thuộc về cá nhân chứ không thuộc tổ chức, nên thành viên khác của Ravolution không thấy.

### J. Đổi vai Nhà tổ chức ↔ Nghệ sĩ
1. ✓ Rail Studio → "Đổi sang Nghệ sĩ" → "Mỗi tài khoản một vai nghề … Hồ sơ Nhà tổ chức vẫn được giữ" (`shots/org-craft-prompt.png`).
2. ✗ Bấm "Đổi sang Nghệ sĩ" thì vai nhà tổ chức bị **tắt ngay**, *trước khi* có hồ sơ nghệ sĩ. Sheet chuyển sang form tạo hồ sơ nghệ sĩ, vẫn với tiêu đề "Bạn đến với âm nhạc thế nào?" (`shots/org-craft-after-switch.png`). Đóng sheet lúc này thì Studio báo **"Vai Nhà tổ chức đang tắt"** (`shots/org-craft-gate-off.png`), trong khi tài khoản không có vai nào. Đổi lại thì được (✓).

### K. Trang công khai và đường quay lại Studio
1. ✓ Thẻ tổ chức trên rail → "Xem hồ sơ công khai" → `/o/ravoent`.
2. ✗ Chủ trang thấy nút lime **"Theo dõi"** trên chính trang của mình. Nút "Chỉnh hồ sơ" dẫn về `/studio` (dashboard) chứ không về `/studio/profile` (`shots/org-public-o.png`, `web/org/page.tsx:125-126`).
3. ✗ `/e/ravo-warmup` khi chủ sự kiện đang đăng nhập: không có "Sửa / Quản lý trong Studio". Đường duy nhất về Studio là link footer "Cho nhà tổ chức" (`shots/org-public-e.png`).

### L. Trên điện thoại (390px)
1. ✗ Rail biến thành một dải ngang rộng 1.503px. "Check-in" nằm ở x=547, "Hộp thư" ở x=778, đều ngoài màn hình, phải vuốt ngang mà không có dấu hiệu nào cho biết (`shots/org-m-dash.png`).
2. ✗ Phần chân rail bị ẩn trên điện thoại ("Thông tin doanh nghiệp", "Đổi sang Nghệ sĩ", **"Đăng xuất"**), thẻ "Xem hồ sơ công khai" cũng vậy.
3. ✗ Chiều cao dải này thay đổi theo trang: 65px ở Dashboard, 154px ở Sự kiện, **222px** ở Hộp thư (một khoảng trống lớn, `shots/org-m-inbox.png`).
4. ✓ Màn Check-in là màn riêng, toàn màn hình, nút to và có nút quay lại.

---

## 2. Phát hiện

| Mức | Ở đâu | Chuyện gì xảy ra | Bằng chứng | Đề xuất sửa |
|---|---|---|---|---|
| **P0** | `/studio/events/<id>` (đang đăng) · `routes/organizer/events.ts:308-313`, `studio/copy.ts:463` | Sửa tên, giờ, địa điểm, giá hoặc ảnh bìa là sự kiện chuyển sang `in_review` và trả **404** công khai cho tới khi duyệt lại. Hộp thoại không cảnh báo điều này và còn kể thiếu trường (bỏ sót "tên"). | `shots/org-live-confirm.png`; `/e/ravo-after-hours` → 404 | Giữ bản đang đăng hiển thị trong lúc duyệt bản sửa (duyệt phần chênh lệch). Ít nhất phải ghi rõ: "Trang sự kiện sẽ tạm ẩn cho tới khi duyệt xong". |
| **P0** | Xác minh nhà tổ chức mới · `dashboard.tsx:199`, `revenue.tsx:54`, `studio/profile.tsx` | Việc cần làm đòi "tài khoản nhận tiền" và dẫn tới Hồ sơ, nhưng Hồ sơ không có ô ngân hàng. Ô này chỉ có ở Doanh thu và chỉ hiện khi có số liệu doanh thu, nên nhà tổ chức mới không nhập được. | `shots/org-empty-dash.png`, `shots/org-empty-revenue-draft.png` | Chuyển "Tài khoản nhận tiền" vào `/studio/profile` (khối Doanh nghiệp), để Doanh thu chỉ hiện và link tới đó. |
| **P1** | Nhận quản lý hồ sơ · `studio/root.tsx:109`, `role-picker.tsx:113-116` | Sau "Nhận": không xác nhận, không hỏi bằng chứng. Studio vẫn ghi "chưa có hồ sơ" và mời "Tạo hồ sơ nhà tổ chức", tức là mời tạo bản trùng. | `shots/org-new-after-claim.png`, `org-new-menu-after-claim.png` | Gate đọc `session.claims.organizer` và hiện "Đang chờ duyệt yêu cầu nhận Concrete Crew" (ẩn nút tạo mới). Khi nhận quản lý, hỏi ghi chú và link bằng chứng như claim sự kiện, kèm toast thông báo kết quả. |
| P1 | `/o/<slug>` · `web/org/page.tsx:246` | "Bạn là nhà tổ chức này?" nằm dưới footer, gần như không ai thấy. | `shots/org-claimlink-w12.png` | Đặt link cạnh nút "Theo dõi" ở phần đầu trang. |
| P1 | Sự kiện Radar · `web/event/page.tsx:107-114`, `routes/community.ts:182` | Không có đường nào để nhà tổ chức nhận lại sự kiện Radar từ trang sự kiện. | đọc code | Thêm "Đây là sự kiện của tôi" trên dòng FeestFinder Radar, dẫn vào luồng nhận quản lý hồ sơ placeholder hoặc sự kiện. |
| P1 | Wizard bước 3 · `wizard.tsx:120` | Đã bán trên FeestFinder (có hạng vé) vẫn bị bắt nhập link bán vé ngoài. | `shots/org-wz-4-missing-link.png` | Khi `sellHere` có hạng vé hợp lệ thì link bán vé không bắt buộc. |
| P1 | Wizard bước 1 · `wizard.tsx:125` | "Trang sự kiện" là bắt buộc. Nhà tổ chức nhỏ có thể không có trang nào. | `shots/org-wz-1.png` | Cho phép bỏ trống (trang trên FeestFinder chính là trang sự kiện). Chỉ tính điểm chất lượng. |
| P1 | Wizard bước 2 · `wizard.tsx:100`, `VenueField` | Chỉ nhập được một ngày, không có địa chỉ cho địa điểm mới. Trình sửa thì có "Nhiều ngày", Khu vực, Địa chỉ. | `shots/org-wz-2.png` | Đưa "Một ngày / Nhiều ngày" và Địa chỉ vào wizard. |
| P1 | Trình sửa sự kiện đang duyệt · `editor.tsx:296` | Yêu cầu của kiểm duyệt chỉ có trong Hộp thư, trình sửa không hiện. | `shots/org-ed-review.png`, `shots/org-inbox.png` | Hiện tin mới nhất của luồng kiểm duyệt ở đầu trình sửa (cho mọi status), kèm link "Trả lời". |
| P1 | Studio trên điện thoại · `studio/root.tsx:234`, `ui/shell.tsx` | Rail thành dải vuốt ngang 1.503px. Check-in và Hộp thư nằm ngoài màn hình. Đăng xuất, Đổi vai, Doanh nghiệp bị ẩn. Dải cao 65/154/222px tuỳ trang. | `shots/org-m-dash.png`, `org-m-inbox.png` | Thanh tab dưới cố định 4–5 mục (Dashboard, Sự kiện, Check-in, Hộp thư, Thêm). "Thêm" mở sheet chứa phần còn lại và chân rail. Cố định chiều cao dải. |
| P1 | Check-in · `door.tsx:253` | Không có camera trên iPhone Safari (không có `BarcodeDetector`), mà khung "Đưa mã QR vào khung" vẫn hiện. | `shots/org-m-door-valid.png` | Dùng thư viện quét QR bằng JS khi không có `BarcodeDetector`. Nếu không làm được thì ẩn khung và để ô nhập mã lên đầu. |
| P1 | Đổi vai · `role-picker.tsx:62-72` | Vai nhà tổ chức bị tắt trước khi có hồ sơ nghệ sĩ. Đóng sheet thì tài khoản không còn vai nào. | `shots/org-craft-after-switch.png`, `org-craft-gate-off.png` | Tạo hồ sơ nghệ sĩ trước, đổi vai sau (một bước). Tiêu đề sheet ghi "Đổi sang Nghệ sĩ". |
| P1 | Gig "Mời nghệ sĩ" · `gigs.tsx:209` | Ô tìm cho chọn nghệ sĩ chưa có người quản lý, gửi xong mới báo lỗi 409. | `shots/org-gigs-invite-409.png` | Lọc theo nghệ sĩ đã có người quản lý, hoặc gắn nhãn "Chưa có người quản lý" và tắt nút gửi. |
| P1 | Trình sửa · menu "…" | Không có thao tác huỷ hoặc hoãn sự kiện. Không có màn giờ diễn hay sân khấu dù API đã có `timetable`/`zones`. | `shots/org-ed-live.png` | Thêm "Hoãn / Huỷ sự kiện" (kèm thông báo cho người có vé và hoàn tiền) và khối "Lịch diễn". |
| P1 | `/e/<slug>` khi là chủ | Không có lối "Sửa trong Studio". Đường duy nhất về Studio là link footer "Cho nhà tổ chức". | `shots/org-public-e.png` | Hiện cho chủ sự kiện một thanh mỏng "Bạn quản lý sự kiện này · Sửa · Số liệu". |
| P1 | Rail Studio · `root.tsx:237` vs `copy.ts:11` | Hai mục cùng tên **"Người tham dự"**: một là danh sách khách, một là về trang chủ (vai fan). | `shots/org-dash.png` | Đổi mục ở chân rail thành "Về FeestFinder" hoặc "Trang chủ". |
| P1 | Rail "Thông báo" vs tab Hộp thư "Thông báo" · `copy.ts:15` | Cùng một từ cho việc *gửi* thông báo tới khách và việc *nhận* thông báo. | `shots/org-announce.png`, `org-inbox-notif.png` | Đổi rail thành "Gửi tin tới khách" (hoặc "Nhắn khách"). |
| P2 | Dashboard · `dashboard.tsx:221` | Khối "Hiển thị trên Google & AI" in **"Có ảnh ngang"** dưới mỗi sự kiện, đọc như sự kiện đã có ảnh, trong khi ý là đang thiếu. | `shots/org-dash.png` | Dùng câu hành động: "Thêm ảnh ngang (+14)". |
| P2 | Dashboard vs Sự kiện | KPI "Lượt xem 0 / Bấm mua vé 0" (14 ngày) trong khi danh sách ghi "9.800 · 0 · 620" cho cùng sự kiện. "Ravolution Music Festival 2025" là "ĐANG ĐĂNG" ở dashboard nhưng "ĐÃ DIỄN RA" ở danh sách (`dashboard.tsx:150`). | `shots/org-dash.png`, `org-events.png` | Ghi rõ khoảng thời gian ("tổng" hay "14 ngày"). Dashboard dùng chung `ended()` với danh sách. |
| P2 | Trình sửa | Hai điểm số khác nhau cạnh nhau: "Chất lượng tin 80" và "Hiển thị trên Google & AI 46", trùng tiêu chí với ngưỡng khác nhau ("Mô tả từ 80 ký tự" vs "Mô tả tiếng Việt từ 300 ký tự"). | `shots/org-ed-live.png` | Gộp thành một danh sách "Còn thiếu" với một điểm số. |
| P2 | Lean UI | Câu giải thích dưới mỗi tiêu chí ("Google ưu tiên kết quả sự kiện có ảnh; trợ lý AI dẫn kèm ảnh."), "— thẻ không ảnh mất 40% lượt bấm" trong Việc cần làm, ghi chú bán vé lặp hai lần. | `shots/org-ed-live.png`, `org-dash.png`, `org-wz-3-noticketlink.png` | Chỉ giữ tên việc và số điểm. |
| P2 | Wizard vs trình sửa · `wizard.tsx:35,77`, `editor.tsx:65` | Tên tối đa 60 vs 120. Độ tuổi mặc định 18+ vs "Mọi lứa tuổi". Wizard lưu một mô tả cho cả vi lẫn en (`wizard.tsx:94`). | `shots/org-wz-1.png`, `org-ed-live.png` | Dùng chung một model (xem mục 3). |
| P2 | Wizard sau khi gửi · `wizard.tsx:295` | Thanh trên vẫn ghi "NHÁP · TỰ LƯU". | `shots/org-wz-5-sent.png` | Cập nhật `draft.status` sau khi gửi. |
| P2 | Việc cần làm · `dashboard.tsx:203-207` | Mục của sự kiện đang duyệt hay đang đăng không bấm được. | `shots/org-dash.png` | Mọi mục đều dẫn tới `/studio/events/<id>#<khối>`. |
| P2 | Màn trống (nhà tổ chức mới) · `studio/parts.tsx` `NeedEvent` | "Chọn một sự kiện để xem mục này" ở Người tham dự, Doanh thu, Thông báo, Mã giảm giá khi chưa có sự kiện nào, hoặc khi đã chọn bản nháp. | `shots/org-empty-attendees.png`, `org-empty-revenue-draft.png` | "Chưa có sự kiện · Tạo sự kiện" hoặc "Chưa có vé bán". |
| P2 | Announce · `announce.tsx:31` | Mặc định chọn nhóm "Đã lưu 0". | `shots/org-announce.png` | Mặc định chọn nhóm lớn nhất (thường là "Đã mua vé"). |
| P2 | Promos | Công tắc check-in của khách mời không có nhãn hiển thị. | `shots/org-promos.png` | Thêm nhãn "Đã vào". Cân nhắc chuyển khách mời sang Người tham dự (xem mục 3). |
| P2 | Check-in | Hạng vé hiện "Standing" (tiếng Anh). Mã vé bịa cũng báo "Mã không thuộc sự kiện này". | `shots/org-m-door-valid.png`, `org-m-door-invalid.png` | Dùng tên hạng vé theo ngôn ngữ. Tách lỗi "Không tìm thấy mã" và "Vé của sự kiện khác". |
| P2 | `/o/<slug>` khi là chủ · `web/org/page.tsx:125-126` | Chủ trang thấy nút lime "Theo dõi". "Chỉnh hồ sơ" dẫn về `/studio`. Khối "Thể loại tổ chức: EDM 100%" vô nghĩa vì cả trang chỉ có EDM. | `shots/org-public-o.png` | Ẩn "Theo dõi" với chủ trang, cho "Chỉnh hồ sơ" dẫn tới `/studio/profile` và làm nút chính. Bỏ khối thể loại. |
| P2 | Menu tài khoản · `web/chrome.tsx:118-120` | "Người tham dự ✓" bấm không có tác dụng. "Nhà tổ chức" thực ra là link vào Studio nhưng trông như một lựa chọn vai. | `shots/org-site-account-menu.png` | Hiện "Studio (Nhà tổ chức)" như một link có mũi tên. Bỏ dòng "Người tham dự". |
| P2 | Ads · `studio/ads.tsx` | Thanh chọn sự kiện ở đầu trang không lọc danh sách. | `shots/org-ads-after.png` | Bỏ thanh chọn, hoặc dùng nó để lọc. |
| P2 | Dự án · `web/projects/manage.tsx:160, 273` | Nhãn "(…)" thay cho tiền tệ. Số không có dấu phân cách. Gắn sự kiện bằng cách gõ slug. | `shots/org-p-new.png` | Hiện tiền tệ theo thành phố mặc định. Định dạng số như wizard. Gắn sự kiện bằng ô chọn sự kiện của mình. |
| P2 | Studio trống · `dashboard.tsx:141` | Bảng trống chỉ có tiêu đề cột, không có nút gọi hành động. | `shots/org-empty-dash.png` | Màn trống có nút lime "Đăng sự kiện đầu tiên". |
| P2 | Tạo nhà tổ chức từ `/studio/new` · `role-picker.tsx:101` | Tạo xong bị đưa về `/studio`. | `shots/org-new-gate.png` | Quay lại `/studio/new` khi người dùng vào từ đó. |
| P2 | Trình sửa · `wizard.tsx` `Upload` | Logo demo bị hỏng hiện icon ảnh vỡ của trình duyệt (không có fallback). | `shots/org-ed-live.png` (khối Hình ảnh) | Dùng fallback chữ viết tắt như `kd/ui/covers.tsx`. |
| P2 | Danh sách sự kiện | Tab ghi "Chờ duyệt" nhưng nhãn trạng thái ghi "ĐANG DUYỆT". | `shots/org-events.png` | Dùng một từ cho cả hai. |
| P2 | Hồ sơ doanh nghiệp | Khối "Thành viên" chỉ đọc, không mời được đồng đội. Hiện chỉ mời được nhân sự soát vé. | `shots/org-profile.png` | Thêm "Mời thành viên" (vai Chủ / Thành viên). |
| P2 | Look | Mỗi màn có hai nút lime: "Sự kiện mới" trên rail và nút chính của màn (ví dụ "Yêu cầu quảng cáo", "Tạo mã"). Hồ sơ có hai nút "Lưu" lime. | `shots/org-ads-after.png`, `org-profile.png` | Nút "Sự kiện mới" trên rail để kiểu viền. Mỗi màn chỉ một nút lime. |

Ghi chú về ảnh: Hồ sơ nhà tổ chức (logo, ảnh bìa) và ảnh bìa dự án là link `https://` qua `ImageLinkField` / `probeImage`, còn logo và ảnh bìa của sự kiện thì tải lên. Cùng một "Logo" mà hai cách nhập khác nhau trên hai màn liền nhau (Hồ sơ "Link ảnh · ảnh vuông" vs Wizard "Tải lên"). Đây là quy tắc có chủ ý, nhưng nên thêm gợi ý một dòng ở Hồ sơ. Tôi không dán link ảnh để tránh server gọi ra ngoài; nhận xét này lấy từ code.

---

## 3. Tính năng trùng lặp hoặc chồng nhau

1. **Hai trình sửa cho cùng một sự kiện.** Có wizard (`/studio/new?draft=<id>`, 4 bước, tên ≤60, một ngày, 18+, một mô tả) và trình sửa (`/studio/events/<id>`, 6 khối, tên ≤120, nhiều ngày, "Mọi lứa tuổi", mô tả vi/en). Từ dashboard, bấm "Tiếp tục" của một bản nháp mở wizard (`dashboard.tsx:153, 205`). Từ danh sách Sự kiện, bấm vào tên mở trình sửa (`events.tsx:128`). Wizard còn mở được tin đang đăng ("Sửa sự kiện · Lưu thay đổi").
   → Wizard chỉ dùng để *tạo mới*, giữ phần xem trước thẻ. "Tiếp tục" của bản nháp luôn mở trình sửa. Hai bên dùng chung `payload`, `check` và giới hạn trường.
2. **`/studio/event/<id>` và `/studio/events/<id>`.** Hai URL chỉ khác nhau một chữ "s": một là redirect cũ về dashboard với sự kiện đã chọn, một là trình sửa.
   → Cho redirect cũ trỏ thẳng tới trình sửa, hoặc trả 301 về `/studio/events/<id>`.
3. **Ba cách nhắn khách.** Có "Thông báo" (`/studio/announce`, có nhóm và kênh, hẹn giờ), "Bảng tin trực tiếp" trong trình sửa (công tắc "Gửi thông báo cho người có vé và người sẽ đi"), cộng thêm "Hộp thư → Thông báo" là thông báo *nhận*.
   → Gộp thành một màn "Tin tới khách" với hai kiểu: tin gửi riêng (push/Zalo/email) và cập nhật trên trang sự kiện (bảng tin). Hộp thư giữ đúng nghĩa *nhận*.
4. **Khuyến mãi và quảng cáo.** "Mã giảm giá & khách mời" thì giảm giá vé, "Quảng cáo" thì mua chỗ hiển thị. Hai việc khác nhau, nhưng "khách mời" lại nằm chung với mã giảm giá, trong khi check-in và danh sách khách nằm ở "Người tham dự" (doanh thu còn hiện hạng "Crew & khách mời").
   → Chuyển "Khách mời" sang Người tham dự (một tab "Khách mời"), để màn này chỉ là "Mã giảm giá". Gộp Quảng cáo với "Đẩy tin" (dashboard, wizard) thành một mục "Quảng bá" gồm mã giảm giá và yêu cầu quảng cáo.
5. **Ba con đường giữa nghệ sĩ và nhà tổ chức.** Có Gig (nghệ sĩ nộp hồ sơ), "Mời nghệ sĩ" (yêu cầu booking) và đề nghị "perform" trên dự án. Hồ sơ còn có công tắc "Nhận hồ sơ nghệ sĩ" (`bizOpen`), không rõ khác gì với đăng gig.
   → Trong Studio, hiện tất cả trong một hộp "Booking" với cột Nguồn (Gig / Lời mời / Dự án). Bỏ hoặc giải thích công tắc "Nhận hồ sơ nghệ sĩ" bằng cách gắn nó với gig.
6. **Hai điểm số chất lượng.** "Chất lượng tin" và "Hiển thị trên Google & AI" (xem bảng ở trên).
   → Một điểm, một danh sách việc.
7. **Duyệt sự kiện và dự án.** Cả hai đều dùng "Gửi duyệt" nhưng ở hai nơi: Studio cho sự kiện, site công khai cho dự án. Dự án không xuất hiện trong Studio.
   → Thêm "Dự án" vào rail Studio (cùng dữ liệu với `/p/mine`).
8. **Tài khoản ngân hàng ở Doanh thu và thông tin pháp lý ở Hồ sơ**, trong khi bước xác minh cần cả hai.
   → Gộp về Hồ sơ doanh nghiệp.

## 4. Ngõ cụt và link còn thiếu

- Nhận quản lý xong thì không còn bước nào: gate vẫn ghi "chưa có hồ sơ", không có trạng thái chờ, không có thời gian dự kiến.
- "Việc cần làm → thiếu tài khoản nhận tiền" dẫn tới Hồ sơ, nơi không có ô đó. Doanh thu thì ghi "Chọn một sự kiện" dù đã có sự kiện được chọn.
- Từ trang sự kiện công khai (`/e/<slug>`) không quay lại được trình sửa của sự kiện. Từ `/o/<slug>`, "Chỉnh hồ sơ" về dashboard chứ không về Hồ sơ.
- Sự kiện Radar: không có đường nhận lại.
- Trên điện thoại không có "Đăng xuất", "Đổi vai" hay "Thông tin doanh nghiệp". Check-in và Hộp thư nằm ngoài màn hình.
- Studio không có link tới "Dự án". Dự án không có link về Studio.
- Thông báo "Tin bị trả lại" mở thư kiểm duyệt nhưng không mở trình sửa của sự kiện.
- Sau khi gửi duyệt: thẻ thành công có "Về bảng điều khiển" nhưng không có "Xem tin đang chờ duyệt" (`/studio/events?status=in_review`).
- Mời nghệ sĩ chưa có người quản lý chỉ báo lỗi, không gợi ý gì tiếp (ví dụ "đăng gig" hoặc "gửi link cho nghệ sĩ nhận hồ sơ").
- Bỏ dở việc đổi vai sang Nghệ sĩ thì tài khoản không còn vai nào.
- Gate "Vai Nhà tổ chức đang tắt" có nút "Người tham dự", thực ra là về trang chủ.

## 5. Những điểm làm tốt

- Onboarding tự hỏi vai ngay sau khi đăng ký. Sheet "Đăng sự kiện" phân biệt rõ Sự kiện và Dự án.
- Wizard tự lưu, có thẻ xem trước như trong feed, tóm tắt từng bước khi gập lại, danh sách "Còn thiếu" bấm được để nhảy tới đúng bước. Thẻ thành công rõ ràng.
- Danh sách sự kiện: tab theo trạng thái có đếm số, dòng "Thiếu: …" ngay dưới trạng thái, bộ lọc lưu trong URL.
- Trình sửa đánh dấu khối nào sẽ phải duyệt lại. Có Ctrl/⌘+S và cảnh báo khi rời trang.
- Check-in trên điện thoại rất tốt: thẻ màu lớn, "Đã dùng" kèm giờ và cổng, có danh sách "Vừa quét", đếm "x / 900 đã vào", mời nhân sự soát vé.
- Người tham dự và Doanh thu rõ ràng: CSV, hoàn tiền, gửi lại vé, lịch chi trả, phí.
- Quảng cáo: "Đẩy tin" mở sẵn đúng sự kiện. Sau khi gửi có trạng thái "Đang chờ" và nút "Rút yêu cầu".
- Hộp thư gom luồng kiểm duyệt và đối tác trả lời được, thông báo có link "Mở thư kiểm duyệt →".
