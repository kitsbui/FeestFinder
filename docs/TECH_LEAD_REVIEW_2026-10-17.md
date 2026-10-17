# Tech lead review, 17/10/2026

Phạm vi: bảy thay đổi chủ sản phẩm yêu cầu ngày 17/10, rồi một vòng kiểm tra toàn site tập trung vào corner case. Nhánh `work/2026-10-17` (chưa commit, chưa deploy).

## Đã làm theo yêu cầu

| Yêu cầu | Kết quả | Kiểm bằng |
| --- | --- | --- |
| Bỏ thanh tab dính dưới ảnh bìa trang sự kiện | `SectionBar` xoá khỏi trang sự kiện cùng chuỗi chữ thừa | `covers-follows.spec.ts` |
| Ảnh bìa sự kiện, nghệ sĩ cập nhật mà trang không đổi | Ba nguyên nhân: thẻ thư mục `/a` không vẽ ảnh bìa; cache trang (60 s) cộng cache CDN (60 s + 300 s) cộng router cache của trình duyệt (300 s). Thẻ thư mục giờ vẽ ảnh bìa; mỗi lần lưu gọi `/kd-fresh` để trang công khai render lại ngay; trang server không đọc bản CDN nữa; CDN chỉ giữ bản cũ thêm 60 s | `covers-follows.spec.ts` (trang đã cache vẫn hiện ảnh mới ngay sau khi lưu) |
| Crop và bố cục lại ảnh bìa, ảnh đại diện | Tâm ảnh và độ phóng lưu trong link (`#ff=x,y,z`); nút "Căn khung" ở mọi ô ảnh và ô tải ảnh bìa/logo sự kiện; xem trước dạng ảnh bìa, thẻ, vuông, tròn; kéo, phím mũi tên, thanh phóng | `remote-images.test.ts`, `review.test.ts`, `covers-follows.spec.ts` |
| Quản lý theo dõi trong hồ sơ | Hai tab Đang theo dõi / Người theo dõi, mỗi dòng có nút; bỏ theo dõi xong vẫn còn dòng để theo dõi lại; theo dõi lại người theo dõi mình | `follows.test.ts`, `covers-follows.spec.ts` |
| Đếm người theo dõi và đang theo dõi, là quan hệ thật | Migration 042: người theo dõi người (`user_follows`); mọi số đếm đọc từ lượt theo dõi thật; số của nhà tổ chức giữ bằng trigger, dữ liệu demo không còn số bịa; trang nghệ sĩ và nhà tổ chức hiện cả hai số | `follows.test.ts` |
| Bỏ trang Khám phá, danh sách sự kiện làm trang chủ | `/` là danh sách; `/list`, `/map` chuyển về `/` giữ bộ lọc; banner và câu hỏi thường gặp nằm dưới danh sách; nav chỉ còn Sự kiện | `home.spec.ts`, `list.spec.ts`, `site.spec.ts` |
| Bỏ dòng "11 sự kiện · Cập nhật 03:47" | Bỏ ở danh sách, bản đồ, dự án, thư mục nghệ sĩ | `home.spec.ts` |

## Kiểm tra corner case

1. **Dò toàn bộ API.** Một script gọi cả 407 route với id sai, chuỗi rất dài, emoji, ký tự NUL, query lạ (số khổng lồ, ngày không tồn tại, khung bản đồ ngược), body sai kiểu, dưới năm vai: khách, fan, nhà tổ chức, nghệ sĩ, admin. Tổng 35.560 request. Lần đầu có 11 lỗi 500, cùng một nguyên nhân.
2. **Đi qua mọi màn hình.** `health.spec.ts` mở mọi route của từng vai ở cỡ desktop và điện thoại, ghi lỗi không bắt được, lỗi console, lỗi 5xx, và request màn hình tự gửi sai (400, 404, 405, 422).
3. **Đọc lại logic** thanh toán, mã giảm giá, bắt tay lineup, sửa tin đang bán.

## Lỗi tìm thấy và đã sửa

| Lỗi | Hậu quả | Sửa |
| --- | --- | --- |
| Ký tự NUL trong địa chỉ, query hoặc body đi thẳng xuống Postgres | 500 ở 11 route công khai | Chặn từ đầu, trả `invalid_input` (`app.ts`), có test |
| Trang hướng dẫn AI gọi API khi hướng dẫn đang tắt; cờ `guide` của sự kiện và route hướng dẫn dùng hai điều kiện khác nhau, và bản lưu ở ngôn ngữ khác cũng tính | 503 và nút "Thử lại" vô ích | Một điều kiện chung, theo ngôn ngữ; màn hình không gọi khi tắt |
| Mã giảm 100% với thanh toán chuyển khoản | Đơn 0₫ chờ một lần chuyển khoản không bao giờ đến, người mua không nhận được vé | Tổng 0 thì phát vé ngay |
| Server function làm mới router | Bộ lọc giữ trong địa chỉ của Console bị mất sau khi lưu | Đổi sang route handler `/kd-fresh` |
| Thành viên nhà tổ chức theo dõi được chính trang mình | Số theo dõi sai | API từ chối `own_profile`, như nghệ sĩ |
| Gợi ý trong Console nói dãy Nổi bật hiện trên app và web | Đội tin vào điều không đúng | Sửa câu cho đúng |

## Cần chủ sản phẩm quyết

- **Dãy Nổi bật không hiện ở đâu cả** (TECH_DEBT #17). Console vẫn chọn sự kiện cho dãy, API vẫn trả, nhưng không trang nào đọc. Gói quảng cáo "Kệ Nổi bật" vì thế không có chỗ hiện. Chọn: đặt một dãy trên danh sách trang chủ, đặt trong app, hoặc bỏ gói.
- **Tab Khám phá của app** (`/app`, TECH_DEBT #18) vẫn giữ. Nếu muốn giống web, tab này chuyển sang danh sách `/app/list`.
- **Theo dõi người**: hiện chỉ theo dõi lại được từ danh sách người theo dõi mình. Muốn người dùng tìm và theo dõi nhau ở chỗ khác (bình luận sự kiện, kế hoạch nhóm, trang cá nhân công khai) thì cần quyết, vì trang fan đang để riêng tư.

## Số liệu

| Kiểm tra | Kết quả |
| --- | --- |
| Test API | 394: 393 qua, 1 bỏ qua, 0 lỗi |
| Screen tests | 239: 238 qua, 1 bỏ qua (test thay đổi sau lần chạy đầy đủ cuối đã chạy lại riêng và qua) |
| Dò API | 407 route, 35.560 request, 0 lỗi 5xx |
| Đi qua màn hình | 5 vai × 2 cỡ, 0 lỗi |
| Lint web | 0 lỗi, 55 cảnh báo (ngân sách hạ từ 56) |
| Lint API | 0 lỗi, 1.323 cảnh báo (ngân sách hạ từ 1.325) |
