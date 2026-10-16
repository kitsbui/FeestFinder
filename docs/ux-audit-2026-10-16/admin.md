# FeestFinder Console: kiểm thử UX dưới vai admin / đội FeestFinder

Người thử: vai admin (admin@feestfinder.com, đăng nhập bằng mật khẩu của bản preview). Preview: http://localhost:3000, đồng hồ cố định 14/09/2026 10:00. Desktop 1440px là chính, kiểm thêm 390px.
Ảnh chụp: `/tmp/claude-1000/-home-patrickstar-Desktop-FeestFinder/373f1ad5-e8b8-4d0a-ace8-9dd5ba44a801/scratchpad/ux/shots/` (dưới đây ghi tắt là `shots/…`). Script: `ux/adm-*.mjs`.

Việc tôi tạo ra để thử (bằng tài khoản fan mới có số điện thoại đã xác nhận): một sự kiện cộng đồng "ADM Test · Deep House Sunset", hai báo cáo trên "Saigon Outcast Night Market" (từ hai tài khoản khác nhau), một góp ý loại "Thắc mắc & hỗ trợ", một dự án "ADM Test · Rooftop Techno Series", một yêu cầu quảng cáo thương hiệu "ADM Test Cold Brew". Trong Console tôi đã: duyệt rồi hoàn tác, trả lại tin cộng đồng của mình, bỏ qua một báo cáo của mình, tạo chiến dịch từ yêu cầu của mình rồi tắt nó đi, thử "Xem dưới" rồi thoát qua API.

Ghi chú: phiên trước, trước khi máy khởi động lại, tôi đã lỡ bấm "Thêm nguồn gợi ý" ở `/console/sources` (thêm 7 nguồn thật đang bật). Preview đã được dựng lại, các nguồn đó không còn. Lần này tôi không thêm và không chạy nguồn nào.

---

## 1. Các luồng trải nghiệm

✓ = trơn tru · ✗ = hỏng / gây khó hiểu

### A. Buổi sáng dọn việc tồn ("Cần xử lý")
1. ✓ Trên trang công khai, bấm nút "Console" ở header hoặc trong menu tài khoản → `/console` (Kiểm duyệt).
2. ✗ Không có chỗ nào cho biết hôm nay có tổng cộng bao nhiêu việc. `/console/overview` › "Việc cần làm" chỉ gồm 7 dòng: quá hạn, sắp quá hạn, báo cáo, kháng nghị, tin chưa ghim, NTC chờ xác minh, yêu cầu quảng cáo. Thiếu yêu cầu nhận hồ sơ, dự án chờ duyệt, góp ý, yêu cầu quảng cáo sự kiện, thiết bị chờ duyệt, báo cáo bài thảo luận/khoảnh khắc/bình luận mix, và sự kiện bị nguồn Radar báo huỷ. (`shots/adm-overview.png`)
3. ✗ Tôi phải mở 10–12 màn để dọn hết: `/console` (tin + kháng nghị), `/console/claims` (2 tab), `/console/reports` (4 tab), `/console/feedback`, `/console/projects`, `/console/verification`, `/console/venues?tab=unresolved`, `/console/featured` (yêu cầu sự kiện ở cột phải, yêu cầu thương hiệu ở cuối trang), `/console/artists?tab=gear`, `/console/sources` (sự kiện bị huỷ).
4. ✗ Số đếm ở rail không khớp việc thật: "Nhà tổ chức 6" so với "5 nhà tổ chức chờ xác minh" ở Tổng quan; "Kệ nổi bật 4" thực ra là số yêu cầu thương hiệu, và yêu cầu quảng cáo sự kiện không được đếm ở đâu; "Góp ý" không bao giờ có số.

### B. Duyệt một tin (organiser / cộng đồng / Radar)
1. ✓ Thông báo "Cần duyệt: ADM Test · Deep House Sunset" → `/console?id=…` mở đúng tin. (`shots/adm-app-notifications.png`)
2. ✓ Danh sách bên trái có hạn SLA, rủi ro, cờ. Bên phải là toàn bộ tin, gồm bản xem trước như trong feed, ảnh, ghim, chất lượng và tín hiệu rủi ro. (`shots/adm-queue-community.png`)
3. ✓ Bấm "Duyệt" thì quyết định được giữ 5 giây, có nút "Hoàn tác", rồi tin kế tiếp tự mở. Phím j/k/a/r/e/x chạy được.
4. ✗ Tín hiệu rủi ro bị lặp: "Địa chỉ không có định vị trên bản đồ" và "Địa chỉ không định vị được trên bản đồ" (+26) cùng xuất hiện. Với tin cộng đồng, dòng "5 tin đăng, không bị báo cáo · ĐẠT" là thành tích của tài khoản giữ chỗ "Cộng đồng FeestFinder", không phải của người gửi (người gửi có "0 tin đã duyệt").
5. ✗ Bộ lọc "Thể loại" và ô chọn "Thể loại: EDM & điện tử" vẫn còn, dù chỉ có một thể loại.
6. ✗ "Yêu cầu sửa › Kèm lời nhắn…" mở drawer tiêu đề "Trả lại tin cho nhà tổ chức", ô "Tin nhắn gửi nhà tổ chức", nhưng người nhận là fan đã gửi tin. (`shots/adm-sendback-drawer.png`)
7. ✗ Tin Radar hoặc tin từ báo cáo gig của nghệ sĩ hiện "Cộng đồng FeestFinder · Chưa xác minh" và không có link nguồn trong hàng chờ. Chỉ khi vào `/console/events/<id>` › "Nguồn & độ tin cậy" mới thấy "Nghệ sĩ", trong khi ô độ tin cậy lại ghi "Cộng đồng gửi +10".

### C. Xử lý báo cáo
1. ✓ Thẻ báo cáo có số người báo, lý do, trích dẫn, trạng thái "Đang ẩn khỏi feed". Các nút Bỏ qua / Cảnh cáo / Hạ tin đều hỏi xác nhận.
2. ✗ Một sự kiện bị tách thành nhiều thẻ theo lý do: "Warehouse Rave · Quận 4" có 2 thẻ, "Saigon Outcast" có 2 thẻ, mỗi thẻ "1 NGƯỜI". Tab ghi "Báo cáo người dùng 4" nhưng có 6 thẻ. (`shots/adm-reports.png`)
3. ✗ Bấm "Bỏ qua" một thẻ: hộp thoại hứa "Tin giữ nguyên và hiện lại nếu đang bị tạm ẩn." Nhưng sau đó API cho thấy `openReports 1, heldForReports true`: tin vẫn bị ẩn, dù chỉ còn 1 báo cáo, dưới ngưỡng 2. (`shots/adm-reports-after-dismiss.png`)
4. ✗ Hai báo cáo từ hai tài khoản mới tạo là đủ ẩn tin khỏi feed (`heldFromFeed: true`), mà admin không nhận thông báo nào.
5. ✗ "Xem tin" mở `/console/events/<id>`. Nút "‹ Sự kiện" ở đó dẫn về danh sách sự kiện, không về lại trang báo cáo.

### D. Yêu cầu nhận quản lý (claims)
1. ✗ `/console/claims` mở tab "Sự kiện", hiện "Không có yêu cầu nào", trong khi rail báo "Yêu cầu nhận 1". Việc đang chờ nằm ở tab "Hồ sơ nghệ sĩ & BTC", và tab này không có số. (`shots/adm-claims.png`, `shots/adm-claims-profiles.png`)
2. ✗ Dòng yêu cầu nhận chỉ hiện: người gửi "—", email bị cắt, "Lời nhắn —", không có bằng chứng, không link đến hồ sơ người gửi trong Console. Vậy mà nút "Duyệt" giao quyền quản lý một hồ sơ đang có trên trang.
3. ✓ Duyệt hay từ chối đều có hộp xác nhận, và từ chối cho kèm lời nhắn.

### E. Xác minh nhà tổ chức
1. ✓ Thẻ có các công tắc giấy tờ, nút "Xác minh" và "Gắn cờ".
2. ✗ "Cộng đồng FeestFinder" (tổ chức giữ chỗ của nội bộ) nằm trong "Chờ xác minh". (`shots/adm-verification.png`)
3. ✗ Bấm "Mở hồ sơ" thì drawer mở trên tab "Danh bạ" (`/console/organizers?id=…`). Đóng drawer xong, tôi không ở lại danh sách xác minh nữa. Drawer có bộ công tắc thứ hai với tên khác ("Giấy tờ tuỳ thân người đại diện", "Giấy phép KD / mã số thuế", "Xác nhận tài khoản ngân hàng") so với thẻ ("Giấy tờ tuỳ thân", "Đăng ký thuế", "Sao kê ngân hàng"). (`shots/adm-verif-open-profile.png`)

### F. Quảng cáo
1. ✗ Thông báo "Yêu cầu quảng cáo thương hiệu: …" → `/console/featured#ads` nhưng trang dừng ở `scrollY 0`, tức đầu các kệ. Yêu cầu nằm cuối một trang dài khoảng 3000px. (`shots/adm-notif-ad-landing.png`)
2. ✗ Bấm "Tạo chiến dịch" một lần là tạo ngay chiến dịch đang chạy (công tắc bật), không hỏi xác nhận, không cho sửa tiêu đề hay hình, không hiện ngày hay thành phố. Brand xin cả `feed` và `banner`, nhưng chiến dịch chỉ lấy `feed`. (`shots/adm-ads-inquiry.png`, `shots/adm-ads-after-create.png`)
3. ✗ Yêu cầu quảng cáo sự kiện "Org Test Night" (Ravolution) có "Duyệt / Duyệt + lên kệ" trong khi sự kiện vẫn đang `in_review`. Thẻ không nói điều đó. (`shots/adm-featured-top.png`)
4. ✗ Ô "Giá CPM" ghi nhãn thô `feed` / `banner` / `live`, số không định dạng (`180000`), không có đơn vị tiền. (`shots/adm-featured.png`)

### G. Dự án
1. ✓ Hàng "Chờ duyệt 1", drawer có pitch, ý tưởng, ngân sách, "Lý do gửi chủ dự án", "Gửi lại" / "Duyệt". (`shots/adm-project-drawer.png`)
2. ✗ Admin không được báo khi có dự án gửi duyệt. Drawer không cho biết chủ dự án đã xác nhận số điện thoại chưa (điều kiện để đăng), không hiện gói tài trợ, không có link xem trước `/p/<slug>`, và URL không đổi (không có `?id=`).

### H. Góp ý
1. ✓ Danh sách, lọc theo loại, drawer có trạng thái, JSON, "Tạo GitHub issue". (`shots/adm-feedback-drawer.png`)
2. ✗ Một câu hỏi loại "Thắc mắc & hỗ trợ" ("đổi email đăng nhập thế nào?") không có cách trả lời người gửi, chỉ có đổi trạng thái hoặc tạo GitHub issue. Bấm mở dòng không thêm `?id=` (dù trang có hỗ trợ). Mức độ hiện "Mức medium", chưa dịch.

### I. Thông báo cho admin
1. ✗ Console không có chuông thông báo. Header trang công khai cũng không có chuông, và menu tài khoản không có mục "Thông báo" (`shots/adm-site-avatar-menu.png`). Lối vào duy nhất là chuông trên `/app` (`kd/app/explore.tsx:178`).
2. ✗ Chỉ 3 loại việc báo cho admin: `review_needed`, `ad_inquiry`, `ad_request`. Yêu cầu nhận, báo cáo (kể cả khi tin bị tự ẩn), dự án, góp ý và khiếu nại được phản hồi đều không báo.
3. ✗ Nội dung thông báo lẫn tiếng Anh: "Community · Adm Tester Fan · 2026-10-10 · TP.HCM".

### J. "Xem dưới" (impersonation) để hỗ trợ một tài khoản
1. ✗ Menu avatar chỉ có 7 lựa chọn cố định, không có ô tìm. Không thể chọn đúng tổ chức đang cần hỗ trợ (ví dụ Neon District, Tripside Travel). (`shots/adm-viewas-menu.png`)
2. ✗ Chọn "Ravolution Entertainment" thì hiện băng vàng "Đang xem dưới Ravolution Entertainment · chỉ đọc", nhưng màn hình vẫn là Console của admin. Mở `/studio` thì thấy "Tài khoản này chưa có hồ sơ nhà tổ chức", tức vẫn là tài khoản admin. (`shots/adm-viewas-banner.png`, `shots/adm-viewas-studio.png`)
3. ✗ Tải lại trang thì băng vàng và nút "Thoát" biến mất. Chọn lại thì báo "Hãy kết thúc phiên xem hộ hiện tại trước", và giao diện không có cách nào kết thúc. (`shots/adm-viewas-second.png`)

### K. Danh mục (sự kiện, NTC, địa điểm, nghệ sĩ, tài khoản, đơn hàng)
1. ✓ Bảng dạng lưới, có lọc và phân trang. Các route chi tiết `/console/organizers/<id>`, `/console/users/<id>`, `/console/orders/<id>` đều chuyển về drawer `?id=` một cách nhất quán.
2. ✗ Ô tìm ở thanh trên ("Tìm tin, nhà tổ chức, mã…") không làm gì ở Sự kiện, Tài khoản, Đơn hàng, Tổng quan… (vẫn 26 dòng sau khi gõ). Các trang này có ô tìm riêng ngay bên dưới, nên trên màn có hai ô tìm. (`shots/adm-events-topsearch.png`)
3. ✗ Console không có chỗ nào phân biệt Đã đăng / Radar: không cột, không lọc, không nhãn ở Sự kiện, Nghệ sĩ hay hàng chờ. Tin Radar hiện người tổ chức là "Cộng đồng FeestFinder". (`shots/adm-events.png`)
4. ✗ Địa điểm › "Tin chưa có ghim": "DnB Sunday", ở The Warehouse, Sukhumvit, Bangkok, được gợi ý "Có thể là: The Reverie Rooftop · Quận 1". Gợi ý không xét thành phố. (`shots/adm-venues-unresolved.png`)

### L. Trên điện thoại (390px)
1. ✗ Rail thành một khối cột ở đầu trang, cao khoảng 450px, các nhóm bên phải bị cắt ("Đối t", "Tiếp", "Chiế"). Hàng chờ cắt tiêu đề còn "U…", "W…". Chạm một tin thì URL đổi nhưng trang vẫn ở `scrollY 0`, phần chi tiết nằm dưới cả danh sách. `/console/events` rộng 1020px, phải cuộn ngang. (`shots/adm-m-console.png`, `shots/adm-m-queue-tap.png`, `shots/adm-m-console-events.png`)
2. Kết luận: trên điện thoại admin chỉ duyệt nhanh được kiểu "đọc rồi bấm Duyệt", không phân loại việc được.

---

## 2. Phát hiện

| # | Mức | Ở đâu | Chuyện gì xảy ra | Bằng chứng | Đề xuất sửa |
|---|---|---|---|---|---|
| 1 | P0 | Menu avatar Console › "Xem dưới"; `festfinder-web/src/kd/console/root.tsx:104-105` | Client gọi `POST /admin/impersonation` nhưng không dùng `token` trả về, chỉ đặt `viewing` trong state. Không xem được gì dưới tài khoản kia. Tải lại thì mất băng vàng; phiên phía server vẫn còn và chặn lần thử sau với "Hãy kết thúc phiên xem hộ hiện tại trước". | `shots/adm-viewas-banner.png`, `adm-viewas-studio.png`, `adm-viewas-second.png` | Mở phiên chỉ đọc trong tab mới (hoặc gắn token vào phiên hiện tại) rồi đưa tới `/studio` hoặc `/app`. Lấy trạng thái băng vàng từ server (`/auth/session`). Thêm ô tìm và nút "Xem dưới" trong drawer tài khoản / NTC. |
| 2 | P1 | Toàn Console | Không có hộp việc chung. Tổng quan thiếu claims, dự án, góp ý, yêu cầu quảng cáo sự kiện, thiết bị, báo cáo bài/khoảnh khắc/mix, sự kiện bị nguồn huỷ. Phải mở 10–12 màn. | `shots/adm-overview.png` | Biến "Tổng quan" thành "Cần xử lý": một danh sách gộp mọi loại việc đang chờ, mỗi dòng có loại, tuổi, SLA và mở thẳng đúng mục. Làm nó thành trang mặc định của `/console`. |
| 3 | P1 | Rail; `festfinder-backend/src/routes/admin/platform.ts:27` so với `ops.ts:182`; `platform.ts:31` | "Nhà tổ chức 6" đếm `verification_state <> 'verified'` (gồm cả bị gắn cờ), còn Tổng quan ghi "5 chờ xác minh". "Kệ nổi bật N" chỉ đếm `ad_inquiries`, bỏ yêu cầu quảng cáo sự kiện. "Góp ý" và "Thiết bị" không có số. Số "Đang đăng" là 17 ở Tổng quan nhưng 15 ở Số liệu; "người dùng mới 7 ngày" là 137 so với 120. | `shots/adm-overview.png`, `adm-insights.png`, `adm-verification.png` | Lấy mọi số đếm từ một nguồn với cùng định nghĩa. Đặt số đúng mục: quảng cáo sự kiện + thương hiệu ở mục Quảng cáo; góp ý mới; thiết bị chờ duyệt. |
| 4 | P1 | Thông báo admin; `routes/projects.ts:200`, `routes/community.ts` (claims), `routes/event-actions.ts`, `routes/feedback.ts` | Chỉ tin cần duyệt và yêu cầu quảng cáo báo cho admin. Dự án gửi duyệt, claims, tin bị tự ẩn do báo cáo, góp ý thì không. Console không có chuông, menu tài khoản cũng không có "Thông báo". | `shots/adm-site-avatar-menu.png`, `adm-app-notifications.png` | Thêm chuông, hoặc mục "Cần xử lý" có số, vào header Console. Gọi `notifyAdmins` cho dự án, claims, tin bị tự ẩn và góp ý loại lỗi nặng. |
| 5 | P1 | `/console/featured#ads`; `routes/discovery.ts:131` | Thông báo yêu cầu thương hiệu mở trang tại đầu các kệ (`scrollY 0`); anchor không cuộn vì nội dung tải sau. | `shots/adm-notif-ad-landing.png` | Link thẳng `?inquiry=<id>` và cuộn hoặc mở drawer đúng yêu cầu; hoặc tách Quảng cáo thành màn riêng (xem mục 3). |
| 6 | P1 | `/console/featured` › "Tạo chiến dịch"; `festfinder-web/src/kd/console/featured.tsx:321` | Một cú bấm tạo chiến dịch đang chạy ngay, không xác nhận, không xem trước hay sửa tiêu đề, nội dung, link. Chỉ lấy vị trí đầu tiên brand chọn. Dòng chiến dịch không hiện ngày, thành phố hay ngân sách. | `shots/adm-ads-inquiry.png`, `adm-ads-after-create.png` | Mở drawer "Tạo chiến dịch" với nội dung điền sẵn (tiêu đề, link, vị trí, giới hạn ngày, khoảng ngày), xem trước thẻ quảng cáo, rồi mới bật. Dòng chiến dịch hiện khoảng ngày và trạng thái "chờ tới ngày". |
| 7 | P1 | `/console/featured` › "Yêu cầu quảng cáo sự kiện" | Có thể "Duyệt + lên kệ" một sự kiện vẫn đang `in_review`; thẻ không nói trạng thái tin. | `shots/adm-featured-top.png` | Hiện trạng thái tin trên thẻ; tắt "lên kệ" cho tới khi tin đã đăng, hoặc nối hai việc: "Duyệt tin + quảng cáo". |
| 8 | P1 | `/console/reports`; `routes/admin/moderation.ts:357-361`, `:392` | Thẻ tách theo (sự kiện × lý do). "Bỏ qua" một thẻ không bỏ ẩn tin nếu còn thẻ khác, trái với lời trong hộp thoại (`moderation/copy.ts:24`). "Cảnh cáo" tính theo từng thẻ, nên một sự kiện có 2–3 thẻ có thể bị 2–3 lần cảnh cáo, và 3 lần là tạm dừng tài khoản. Một tin cộng đồng hay Radar bị báo cáo sẽ cảnh cáo vào tổ chức giữ chỗ "Cộng đồng FeestFinder". | `shots/adm-reports.png`, `adm-reports-after-dismiss.png` | Gộp một thẻ cho mỗi sự kiện, liệt kê các lý do bên trong. Bỏ qua hay cảnh cáo áp cho cả sự kiện. Tính lại `held_for_reports` theo ngưỡng. Ẩn "Cảnh cáo" với tin của tổ chức giữ chỗ. |
| 9 | P1 | Ẩn tự động khi bị báo cáo | Hai tài khoản mới tạo (chỉ cần số điện thoại) là đủ ẩn một tin đã đăng khỏi feed; admin không được báo. | API `heldFromFeed: true` sau báo cáo thứ 2 | Báo admin ngay khi một tin bị ẩn; cân nhắc trọng số theo tuổi hoặc độ tin cậy của tài khoản báo cáo. |
| 10 | P1 | `/console/claims`; `kd/console/claims/claims.tsx:73` | Mở trang thấy tab "Sự kiện" rỗng, trong khi việc đang chờ ở tab "Hồ sơ nghệ sĩ & BTC" (không có số). Dòng claim không có lời nhắn, bằng chứng, hay link tới người gửi trong Console. | `shots/adm-claims.png`, `adm-claims-profiles.png` | Đặt số trên từng tab và mở tab có việc. Hiện ghi chú và bằng chứng; link người gửi tới `/console/users?id=` và hồ sơ tới drawer Console. |
| 11 | P1 | Ô tìm ở thanh trên | Chỉ chạy ở hàng chờ, Báo cáo, Xác minh, Nhật ký. Ở những màn khác ô này không làm gì, và có thêm một ô tìm riêng. | `shots/adm-events-topsearch.png` | Biến nó thành tìm toàn Console (tin, NTC, tài khoản, mã đơn, mã góp ý), kết quả gom theo nhóm. Bỏ ô tìm trùng trong từng trang, hoặc nối hai ô với nhau. |
| 12 | P1 | Sự kiện, Nghệ sĩ, hàng chờ | Không có cột, lọc hay nhãn Đã đăng / Radar. Tin Radar hoặc báo cáo gig hiện là "Cộng đồng FeestFinder", không có nguồn trong hàng chờ. | `shots/adm-events.png`, `adm-artists.png` | Thêm `RadarTag` và bộ lọc `origin` vào bảng Sự kiện, Nghệ sĩ và hàng chờ. Đầu thẻ duyệt ghi "FeestFinder Radar · <nguồn>" hoặc "Báo cáo gig · <nghệ sĩ>". |
| 13 | P1 | Địa điểm › Tin chưa có ghim; `routes/admin/ops.ts:597` | Gợi ý so tên mà không xét thành phố: The Warehouse (Bangkok) được gợi ý thành The Reverie Rooftop (Quận 1). | `shots/adm-venues-unresolved.png` | Lọc gợi ý theo `city` của sự kiện; bỏ mạo từ ("The") khi so tên. |
| 14 | P1 | Góp ý | Không trả lời được câu hỏi "Thắc mắc & hỗ trợ"; chỉ có trạng thái và GitHub. | `shots/adm-feedback-drawer.png` | Thêm "Trả lời" (email hoặc thông báo trong app cho người gửi), hoặc nối với hộp thư sẵn có. |
| 15 | P1 | Dự án | Admin không được báo. Drawer thiếu trạng thái số điện thoại của chủ dự án, gói tài trợ, link xem trước, `?id=`. | `shots/adm-project-drawer.png` | Thêm các thông tin đó và một link "Xem trang". |
| 16 | P1 | Điện thoại 390px | Rail chiếm hơn nửa màn đầu và bị cắt; chạm một tin không cuộn tới chi tiết; `/console/events` cuộn ngang (rộng 1020px). | `shots/adm-m-console.png`, `adm-m-queue-tap.png`, `adm-m-console-events.png` | Trên điện thoại, đưa rail vào nút menu; chi tiết tin mở như trang hoặc sheet toàn màn; bảng chuyển thành thẻ. |
| 17 | P1 | Xác minh | "Cộng đồng FeestFinder" nằm trong "Chờ xác minh". Hai bộ công tắc giấy tờ (thẻ và drawer) đặt tên khác nhau. "Mở hồ sơ" đưa sang tab Danh bạ. | `shots/adm-verification.png`, `adm-verif-open-profile.png` | Loại tổ chức giữ chỗ (`is_community`) khỏi xác minh và số đếm. Dùng một bộ công tắc với một bộ tên. Giữ tab Xác minh khi mở drawer. |
| 18 | P2 | `/console/insights` | Không có tiêu đề trang. Biểu đồ "Sự kiện mới theo thể loại" chia Lễ hội / Nhạc sống / EDM / Văn hoá, trái quy tắc chỉ-EDM. Giá trị cuối bảng "Người dùng" bị nút góp ý che. | `shots/adm-insights.png` | Thêm tiêu đề "Số liệu"; chia theo phong cách (`styles`) thay vì thể loại. |
| 19 | P2 | Hàng chờ | Lọc "Thể loại" và ô chọn "EDM & điện tử" vô ích. Tín hiệu rủi ro bị lặp. Thành tích người gửi lấy từ tổ chức giữ chỗ. | `shots/adm-queue-community.png` | Bỏ lọc thể loại, thay bằng phong cách. Gộp tín hiệu trùng. Với tin cộng đồng, tính thành tích theo `submitted_by`. |
| 20 | P2 | Drawer trả lại tin | Ghi "nhà tổ chức" cho cả tin cộng đồng, nơi người nhận là fan. | `shots/adm-sendback-drawer.png` | Đổi chữ theo người nhận ("người gửi"). |
| 21 | P2 | Nhật ký, Tổng quan › Hoạt động gần đây; `festfinder-backend/src/services/audit.ts` | Mã thô `listing.imported`, `source.starter_added` (thiếu nhãn). Diff thô `STATUS`, `REASON_CODE`, `in_review`. Người gửi cộng đồng hiện là "Hệ thống". Dòng nhật ký không bấm được để mở đối tượng. | `shots/adm-audit.png`, `adm-overview.png` | Thêm nhãn cho mọi action (đã có danh sách so sánh: `listing.imported`, `boost.requested`, `feedback.*`, `gear.edited_by_team`, `order.refunded`, `resale.*`, `source.*`, `venue.*`, `user.role_changed`, `admin.*`, `artist.*`, `mix_comment.removed`). Hiện `actorLabel`. Link đối tượng sang Console. |
| 22 | P2 | Sự kiện | Nhãn phụ tiếng Anh trong giao diện tiếng Việt: "SELLING FAST", "JUST ADDED", "TRENDING", "LOW TICKETS", "GOING 500". Cột NTC bị cắt. | `shots/adm-events.png` | Dịch các nhãn này. |
| 23 | P2 | Kệ nổi bật | Một trang dài trộn kệ, yêu cầu sự kiện, yêu cầu thương hiệu, chiến dịch và giá CPM. Nhiều nút vàng "Tạo chiến dịch" cùng lúc, trái quy tắc một hành động vàng. CPM ghi nhãn thô. | `shots/adm-featured.png` | Tách màn (mục 3); nhãn CPM theo `BRAND_AD_PLACEMENT_LABEL`, định dạng bằng `money()`. |
| 24 | P2 | Tên trong rail khác tiêu đề trang | "Yêu cầu nhận" / "Nhận quản lý"; "Tài khoản" / "Người dùng"; "Tiếp thị liên kết" / "Affiliate"; "Đối tác vé" / "Đối tác bán vé"; "Khiếu nại" (chip hàng chờ) / "Kháng nghị" (Tổng quan, Báo cáo). | các ảnh tương ứng | Mỗi khái niệm một tên. |
| 25 | P2 | "Chiến dịch thương hiệu" (`/console/brands`) | Tên này trùng với "Chiến dịch" quảng cáo ở Kệ nổi bật, dù là việc khác (brand tìm nghệ sĩ hợp tác). | `shots/adm-brands.png` | Đổi thành "Hợp tác nghệ sĩ" hoặc "Brief cho nghệ sĩ", đặt cạnh Nghệ sĩ. |
| 26 | P2 | Nghệ sĩ | Các cột Xác minh, Tên khác, Người quản lý, Định danh đều "—" cho mọi dòng. Bấm dòng không mở gì (chỉ có bút chì). Tab "Thiết bị" là một hàng duyệt ẩn, không có số. | `shots/adm-artists.png`, `adm-artists-gear.png` | Ẩn cột rỗng; cả dòng mở drawer; đưa thiết bị chờ duyệt vào "Cần xử lý". |
| 27 | P2 | Góp ý, Dự án | Mở drawer không cập nhật URL (không có `?id=`), nên không copy link gửi đồng đội được. | — | Đồng bộ `?id=` như Đơn hàng, Tài khoản, NTC. |
| 28 | P2 | Tạo sự kiện (`/console/events/new`) | "Đăng ngay sau khi tạo" mặc định tắt và nút là "Tạo bản nháp", trong khi quy tắc là bài admin đăng sẽ lên ngay. Bảng chất lượng ghi "Dễ bị trả lại" cho chính admin. | `shots/adm-event-new.png` | Mặc định "Đăng ngay"; với admin, đổi nhãn chất lượng thành "Thiếu…". |
| 29 | P2 | Tài khoản (drawer) | Không có link tới tin, báo cáo, góp ý, dự án hay claims của người đó; không có "Xem dưới". | `shots/adm-user-drawer.png` | Thêm các mục liên quan và nút "Xem dưới". |
| 30 | P2 | Báo cáo | Toast "Đã bỏ qua" đè lên nút "Hạ tin" của thẻ bên dưới. | (quan sát ở phiên trước) | Đặt toast ở góc dưới, ngoài lưới thẻ. |
| 31 | — | `PATCH /admin/users/:id` (`routes/admin/ops.ts:924`), nút "Cấp quyền admin" trong drawer tài khoản | Có route và nút cấp quyền admin, trái quy tắc trong CLAUDE.md. Đã biết; theo dặn, tôi chỉ ghi lại, không đánh giá thêm. | `shots/adm-user-drawer.png` | — |

---

## 3. Tính năng trùng lặp hoặc chồng chéo, và đề xuất sắp lại rail

### Trùng lặp
- **Ba nơi cho tiền và lượt bấm của đối tác:** "Đối tác vé" (cấu hình, số 30 ngày, "settled here one by one"), "Tiếp thị liên kết" (lượt bấm theo vị trí/thiết bị/quốc gia, link ngắn, thanh toán cho đối tác) và "Số liệu" (Bấm mua vé). Việc thanh toán đối tác xuất hiện ở cả Đối tác vé lẫn Affiliate › Thanh toán.
- **Hai loại "chiến dịch":** "Chiến dịch thương hiệu" (`/console/brands`, brand tìm nghệ sĩ) và "Chiến dịch" quảng cáo (trong Kệ nổi bật).
- **Quảng cáo nằm trong "Kệ nổi bật":** kệ là việc biên tập nội dung, quảng cáo là việc bán hàng; gộp một trang dài khiến thông báo không dẫn tới đúng chỗ.
- **Hai nơi gắn ghim địa điểm:** hàng chờ (gắn địa điểm có sẵn) và Địa điểm › Tin chưa có ghim. Cả hai đều ổn, nhưng nên dùng chung gợi ý (đã sửa theo thành phố).
- **Hai nơi xác minh NTC:** thẻ Xác minh và drawer NTC, mỗi nơi một bộ công tắc với tên khác nhau.
- **Kháng nghị:** là một chip trong hàng chờ, một nút "Kháng nghị · 2" ở Báo cáo, một dòng ở Tổng quan; còn `/console/appeals` chuyển hướng về `/console?filter=appeals`.
- **Nhật ký:** có ở Nhật ký, ở Tổng quan › Hoạt động gần đây, và ở Số liệu › Nhật ký gần đây (thu gọn).
- **Ô tìm:** thanh trên và ô trong từng trang.

### Đề xuất rail (5 nhóm, mỗi số đếm đúng một loại việc)
```
CẦN XỬ LÝ  (số tổng)          → /console  (hộp việc chung, mặc định)
  Kiểm duyệt tin   n           (tin mới + sửa lại + kháng nghị, có lọc Radar)
  Báo cáo          n           (tin · bài · khoảnh khắc · bình luận mix: một thẻ mỗi đối tượng)
  Yêu cầu nhận     n           (sự kiện + hồ sơ, tab có số)
  Dự án            n
  Góp ý            n
DANH MỤC
  Sự kiện · Nhà tổ chức (xác minh là một bộ lọc, có số) · Địa điểm · Nghệ sĩ (+ thiết bị)
  Radar (Nguồn dữ liệu: nguồn, lần chạy, sự kiện bị nguồn huỷ)
KHÁCH HÀNG & DOANH THU
  Quảng cáo  n     (yêu cầu sự kiện + yêu cầu thương hiệu + chiến dịch + giá CPM)
  Đối tác & affiliate (gộp Đối tác vé + Tiếp thị liên kết: đối tác, link, lượt bấm, thanh toán)
  Hợp tác nghệ sĩ  (đổi tên từ "Chiến dịch thương hiệu")
  Đơn hàng
BIÊN TẬP
  Kệ nổi bật (chỉ kệ)
NỀN TẢNG
  Tài khoản · Số liệu · Nhật ký
```
Ít dùng hằng ngày mà đang chiếm chỗ ở cấp cao nhất: Tiếp thị liên kết, Đối tác vé (khi chưa có đối tác: "Chưa có đối tác nào"), Chiến dịch thương hiệu (rỗng), Số liệu. Nên gom vào một nhóm có thể thu gọn.

---

## 4. Ngõ cụt và link còn thiếu

- "Xem dưới": không đến được giao diện của người kia; sau khi tải lại thì không thoát được (P0).
- Thông báo quảng cáo thương hiệu → đầu trang Kệ nổi bật, không tới đúng yêu cầu.
- `/console/claims` mở tab rỗng; việc nằm ở tab bên cạnh, không có số.
- Báo cáo › "Xem tin" → trang sự kiện có "‹ Sự kiện", không có đường quay lại Báo cáo.
- Xác minh › "Mở hồ sơ" → drawer trên tab Danh bạ; đóng xong mất danh sách xác minh.
- Dòng Nhật ký và dòng Hoạt động gần đây không bấm được; bảng "Nhà tổ chức" ở Số liệu không bấm được.
- Dòng Nghệ sĩ: bấm tên không mở gì, chỉ có bút chì.
- Claim: tên hồ sơ mở trang công khai ở tab mới; người gửi không link tới tài khoản trong Console.
- Drawer Đơn hàng: không link tới tài khoản người mua; drawer Tài khoản không link tới tin, báo cáo, dự án, góp ý của người đó.
- Góp ý loại hỗ trợ: không có đường trả lời.
- Chiến dịch quảng cáo: không link về yêu cầu gốc; không mở hay sửa được, chỉ có công tắc.
- Tin Radar hoặc báo cáo gig trong hàng chờ: không có link nguồn ở đầu thẻ.
- Console không có lối tới thông báo của admin; lối duy nhất là chuông trên `/app`.

---

## 5. Điều làm tốt

- Hàng chờ kiểm duyệt là màn mạnh nhất: chia đôi danh sách và chi tiết, SLA rõ ("Quá hạn · 5H 18M"), giữ 5 giây kèm "Hoàn tác", phím tắt j/k/a/r/e/x, chọn nhiều để duyệt hoặc trả lại, mẫu lời nhắn VI/EN cho mỗi lý do, công tắc "Cho phép kháng nghị trong 7 ngày".
- Thông báo "Cần duyệt" mở thẳng đúng tin (`/console?id=…`).
- Mọi thao tác phá huỷ ở Báo cáo và Claims đều có hộp xác nhận rõ ràng ("Cảnh cáo lần 3 sẽ tạm dừng tài khoản.").
- Detail tin hiện bản xem trước như trong feed, trạng thái ảnh ("Ảnh bìa không tải được"), link vé lỗi, ghim địa điểm có thể sửa ngay.
- Nhật ký có chuỗi băm ("Chuỗi hash hợp lệ") và tải CSV.
- Drawer phải nhất quán cho Đơn hàng, Tài khoản, NTC, Nguồn; các route chi tiết cũ chuyển về `?id=`.
- Trang Kháng nghị đặt "FeestFinder đã viết" cạnh "Nhà tổ chức phản hồi", dễ quyết định.
