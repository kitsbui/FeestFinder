# Biên bản họp 2026-10-20: chốt plan cuối, mục tiêu 10 điểm và một hệ thống hoàn chỉnh

- Hình thức: họp mô phỏng, bốn vai do agent đóng trên nền plan bản 3 (`docs/HANDOFF_2026-10-19_growth-plan.md`), lịch đêm bản 3 (`docs/NIGHT_BUILD_PLAN_2026-10-19.md`), design-kit (`/home/patrickstar/Desktop/design-kit`) và code `main` ở `48b2cf3`. **Chủ sản phẩm là người quyết thật**; mọi kết luận ở mục 5 là đề xuất đã được bốn vai thống nhất, có hiệu lực khi chủ sản phẩm nói "chốt".
- Vai: **Tech lead** (TL: code chạy được, bền, đo được), **Creative director** (CD: Kính đêm, kit, người mới trên điện thoại), **Client** (CL: chủ sản phẩm, tiếng nói lấy từ các quyết định đã ghi ngày 19 và 20.10), **Marketing** (MK: tăng trưởng, kênh, chuyện để kể, số để báo).
- Chương trình: (1) mỗi vai chấm plan theo bảng điểm của kit; (2) các điểm tranh luận và cách giải; (3) danh mục cuối; (4) định nghĩa 10 điểm và cổng ra mắt; (5) việc ai làm, khi nào.

---

## 1. Mỗi vai chấm plan

Thang 10 của `design-system/rubric.md`. Cột "sau 3 đêm" là ước lượng nếu lịch đêm chạy đúng; cột "10" là điều kiện còn thiếu.

| Tiêu chí | Hôm nay (đo 19.10) | Sau 3 đêm (ước) | Thiếu gì để 10 |
| --- | --- | --- | --- |
| Hình khối, hình ảnh | 8 | 8,5 | ≥ 80 % thẻ có ảnh thật (nội dung, không phải code) |
| Bố cục | 8 | 8,5 | trang sự kiện ≤ 7 + khung chỗ bấm (thẻ C làm giảm) và 5 người thật xác nhận |
| Thẩm mỹ | 8,5 | 8,5 | giữ; huy hiệu không được thêm mùi AI (CD, mục 2.3) |
| UX / UI | 8 | 8,5 | một cách làm mỗi việc: bình luận một dòng (B), mua vé một đường (C) |
| Điều hướng | 7,5 | 8 | không đổi trong plan; 4 tab giữ; "Tôi" thêm 3 hàng (Hoa hồng khi có, Cài ứng dụng, Huy hiệu là hàng trên trang cá nhân) |
| Flow | 8 | 9 | từ thẻ tới "Mua vé" 2 chạm, tới bên bán 3; không checkout trung gian |
| Mobile | 8 | 8,5 | cài app đúng cách (F), cổng layout/axe/44 px/CLS/LCP/JS giữ xanh |
| Nội dung | 5 | 6 | 500+ sự kiện: thẻ 1 và chương trình venue của team; không code nào bù được |
| Kỹ thuật | 8 | 9 | lint budget hạ sau đêm 1; `any` của SQL rows còn ≈ 1.300 (tech debt 22) |
| Vận hành | 6 | 7 | Sentry, web vitals có; chưa có PostHog key production (roadmap), chưa có bài 5 người nào |

Bốn vai đồng ý: **không tiêu chí nào tới 10 bằng code trong ba đêm**. 10 theo kit cần ba cột cùng xanh: cổng tự động, 5 người thật ≥ 4/5 làm được việc chính không gợi ý, và số sau hai tuần không tụt. Ba đêm đưa cột một lên 9; cột hai và ba là việc sau deploy, có lịch ở mục 4.

**Lời từng vai, ngắn:**

- **TL:** Plan đúng thứ tự (gỡ trước, xây sau) và có bản đồ phụ thuộc chính xác cho thẻ C; chỗ yếu là hai việc ngoài tầm code: deal affiliate (thẻ D chỉ đếm cho tới khi có postback thật) và bài 5 người. Hai chỗ kỹ thuật phải sửa trước khi chạy đêm: `controllerchange` của thẻ F sẽ tải lại trang ngay lần cài worker đầu nếu không chặn; job huy hiệu hằng giờ chạy 53 truy vấn cho mọi người dùng là nặng, phải trao theo sự kiện và chỉ quét người hoạt động 7 ngày.
- **CD:** Gỡ vé là quyết định thiết kế tốt nhất của plan: bớt 5 khái niệm, trang sự kiện gọn hơn. Hai mối lo: huy hiệu dễ đem mùi AI trở lại (từ vựng gamify, nhãn khắp nơi, hình lặp), và dải mời cài app vi phạm luật "không có gì nổi trên trang". Bình luận một dòng: đồng ý, với điều kiện không emoji, không số 0, một nhãn mỗi bình luận.
- **CL:** Cần ba thứ: tiền đi một đường (affiliate), scene về đủ (lịch, cộng đồng), và vui (huy hiệu). Không bán vé, không xác minh số điện thoại, Zalo để sau. Lo lắng duy nhất: Nghị định 147; muốn một đường quay lại nhanh nếu bị hỏi.
- **MK:** Plan có cái để kể theo tuần: "FeestFinder không bán vé, chỉ chỉ đường" (tuần 1), "chia sẻ được tiền" (tuần 2, cần partner đầu), "mùa huy hiệu" (tuần 3), "cài app" (tuần 3). Thiếu: link giới thiệu ngắn để dán vào bio và story; dữ liệu UTM để đi ký partner; trang "Cho nhà tổ chức" chưa nói lại khi không còn bán vé; chưa có PostHog key trên production nên hai tuần sau không có số.

---

## 2. Tranh luận và cách giải

| # | Vấn đề | Vị trí | Giải |
| --- | --- | --- | --- |
| 2.1 | **Nghị định 147** (D10): bỏ cổng số điện thoại mọi nơi | CL: bỏ, Gmail là đủ. TL: đồng ý nhưng muốn đường lui không phải sửa code. CD: cổng là một sheet bớt đi, tốt cho người mới. | **Cổng thành cờ cấu hình** `REQUIRE_PHONE_TO_POST` (mặc định `0`): `requireWriter` đọc cờ; bật lại bằng một biến trên Vercel và redeploy, không sửa code. Thẻ A ghi vậy. Rủi ro pháp lý CL nhận, có đường lui 10 phút. |
| 2.2 | **Dải mời cài app** (thẻ F) nổi trên trang | MK: hiện ngay khi tải, càng sớm càng nhiều cài. CD: kit cấm phần tử nổi và không thêm nút vào màn đầu; Chrome không cho `prompt()` trước tương tác. TL: Chrome Android yêu cầu tương tác, iOS không có prompt. | **Dải là một phần của khung, không nổi**: một thanh đặc chạm mép, gắn **ngay trên thanh tab**, viền 1 px, không bóng, không bo, đẩy nội dung lên chứ không đè. Hiện sau lần tương tác đầu (D17 A), một lần mỗi thiết bị, bỏ là 30 ngày. MK đổi lại: hàng "Cài ứng dụng" trong "Tôi" luôn có, và chiến dịch cài đi qua Zalo OA sau. |
| 2.3 | **Huy hiệu và mùi AI** (thẻ E) | MK: muốn huy hiệu hiện cạnh tên trong bình luận (bằng chứng xã hội). CD: một nhãn mỗi bình luận đã dùng cho "Nhà tổ chức"; hình lặp trên mọi dòng là mùi #11; từ vựng gamify là mùi #9. CL: muốn vui. | **Huy hiệu chỉ ở trang cá nhân và sheet của nó**, không trên bình luận, thẻ sự kiện hay lineup. Tên vui giữ, dòng điều kiện là sự thật, không "điểm", không "cấp", không "chuỗi" trong chữ UI (code `streak_3` hiện là "Đều nhịp · 3 tháng liên tiếp có đêm"). `/kit` là cổng duyệt bằng mắt: 18 biến thể, CD xem trước khi merge. Bằng chứng xã hội của MK đi đường khác: ảnh story của huy hiệu (đã có trong thẻ E). |
| 2.4 | **Bình luận kiểu Facebook** (thẻ B) | MK: thêm emoji phản ứng cho vui. CD: không; "Thích" một nút, số ẩn khi 0. TL: Gmail là đủ mở cửa cho spam; cần hàng rào. | **Giữ một nút Thích, không emoji.** Hàng rào spam (TL, thêm vào thẻ B): tài khoản dưới 10 phút tuổi không đăng được link; `POSTS_PER_10_MIN` giữ; bộ lọc `checkPostText` giữ; ẩn tự động khi bị báo theo ngưỡng của handoff 16.10 (D8) và **báo admin ngay**; tab Bình luận trong Console (thẻ A) là nơi xử. |
| 2.5 | **Affiliate chưa có deal thì thẻ D vô nghĩa?** | TL: code xong vẫn đếm click và cho UTM, không có tiền. MK: UTM chính là vũ khí đi ký deal: "tháng này FeestFinder đưa 3.000 click tới Megatix". CL: ký Megatix trước. | **Thẻ D giữ nguyên thứ tự**, thêm hai việc rẻ cho MK: (a) **link ngắn `/r/<ref>/<slug>`** chuyển hướng 302 tới `/e/<slug>?ref=<ref>&ch=link` cho bio và story (một route, một test); (b) trong `/console/partners` tab "cần ký" xuất **bảng click theo host 30 ngày** làm tài liệu đi gặp partner (đã có một phần, thêm xuất CSV). Thẻ D không phụ thuộc deal để merge; **cột "tiền thật" của 10 điểm chờ deal**. |
| 2.6 | **Trang "Cho nhà tổ chức" và `/about`** nói về bán vé | MK: phải viết lại trước khi gỡ, không thì tin nhắn trái nhau. CD: chữ gọn, một câu một hành động. | Thêm vào **thẻ C P1**: `/about` và "Cho nhà tổ chức" (footer) nói: đăng miễn phí, link vé của bạn, số click và ai giới thiệu; FAQ bỏ mọi câu về vé, pass vé, hoàn tiền. Một câu: "FeestFinder không bán vé. Nút Mua vé đưa bạn tới trang bán." |
| 2.7 | **Job huy hiệu nặng** | TL: 53 điều kiện × mọi người × mỗi giờ không ổn. | **Trao theo sự kiện** (`awardFor` sau hành động, như thẻ E) là đường chính; job hằng giờ chỉ quét người có hoạt động trong 7 ngày (`attended`, `event_posts`, `share_visits`, `going` mới) và huy hiệu trạng thái (`verified`, `calendar`). Ghi vào thẻ E P0. |
| 2.8 | **Tải lại khi cài worker lần đầu** | TL: `controllerchange` cũng bắn khi worker đầu tiên nhận quyền → trang tải lại vô cớ ở lần ghé đầu. | Chỉ tải lại khi **đã có controller trước đó** (`navigator.serviceWorker.controller` khác null lúc đăng ký). Ghi vào thẻ F P0 và test. |
| 2.9 | **Ba đêm, mỗi đêm 13–17 giờ** | CL: muốn nhanh. TL: đêm 1 có thẻ C bốn giờ gỡ; nếu N1 trượt thì cả đêm trượt. | **Đêm 1 có điểm dừng an toàn** sau N3 (thẻ C xong và tài liệu xong): nếu tới N3 đã quá giờ thứ 9, dừng, A và B sang đầu đêm 2. Đêm 2 và 3 giữ. Sáng nào cũng có cái để review. |
| 2.10 | **PostHog chưa có key production** | MK: không có số thì không có cột ba của 10 điểm. TL: `POSTHOG_KEY` là biến môi trường, 5 phút. | **Điều kiện trước đêm 1** thêm: CL đặt `POSTHOG_KEY` trên Vercel và lưu phễu cơ sở (danh sách → sự kiện → `ticket_click`) trước khi đêm 1 merge, để so trước sau. |
| 2.11 | **Huy hiệu theo số follower?** | MK: "100 người theo dõi" là cột mốc hay. CD và TL: `CLAUDE.md` cấm follower xếp hạng ai; một huy hiệu công khai theo follower là cơ chế xếp hạng mềm. | **Không.** Giữ 53 như thẻ E. |
| 2.12 | **Nhắc cài trong sheet lần đầu** (thành phố, dòng nhạc) | MK: tiện, người đang ở chế độ thiết lập. CD: sheet lần đầu có một việc; thêm việc là phá "một màn một việc". | **Không.** D17 A giữ. |

---

## 3. Danh mục cuối (thống nhất)

Mười thẻ, ba đêm, thứ tự không đổi; mỗi thẻ đã có định nghĩa 10 điểm ba cột trong handoff. Cột "Thêm từ họp" là việc mới ghi vào handoff hôm nay.

| Đêm | Thẻ | Việc | Thêm từ họp |
| --- | --- | --- | --- |
| 1 | C | Gỡ bán vé và check-in; mọi "Mua vé" đi `/go` tới bên bán; migration 048 có khoá an toàn | `/about`, "Cho nhà tổ chức", FAQ viết lại (2.6); điểm dừng an toàn sau N3 (2.9) |
| 1 | A | Đăng nhập là đủ; admin xoá bình luận | Cờ `REQUIRE_PHONE_TO_POST=0` thay cho xoá cổng (2.1) |
| 1 | B | Bình luận một dòng, trả lời hai cấp, thích, sửa, xoá, báo cáo, thông báo | Hàng rào spam và báo admin ngay (2.4); không emoji |
| 2 | D | Affiliate thông minh: chọn bên bán theo nước, ref 30 ngày, UTM, postback, chia 50 %, dashboard | Link ngắn `/r/<ref>/<slug>` (2.5a); xuất CSV "cần ký" (2.5b) |
| 2 | 4 | Loại "Ban ngày" | — |
| 2 | 5 | Kệ trả tiền trong ô nổi bật có sẵn | — |
| 2 | 6 | MCP và `/list.md` cho agent, link vé qua `/go` | — |
| 2 | 1 | Lịch của nhà tổ chức: nhúng và kết nối | — |
| 3 | E | 53 huy hiệu tự trao, một hệ biểu tượng ba bậc, ghim 6 trên trang cá nhân, story | Chỉ ở trang cá nhân (2.3); trao theo sự kiện, job quét người hoạt động (2.7) |
| 3 | F | Cài app đúng cách trên Safari và Chrome; worker theo build tự cập nhật | Dải là thanh đặc gắn trên tab bar, không nổi (2.2); chặn tải lại lần cài đầu (2.8) |

**Để sau, đã có điều kiện đo được** (handoff mục 6): Zalo OA, Mini App, link du lịch, Crew vote, Drop, Track ID, Vé an toàn, Night Pass, merch, insights cho brand, bàn người đi một mình, thưởng từ NTC, coupon partner. **Không bao giờ** (đã bác trong họp): huy hiệu theo follower, emoji phản ứng, popup cài ở lần tải đầu, điểm và cấp.

---

## 4. Định nghĩa 10 điểm và cổng ra mắt

Ba cột của `DESIGN_GOVERNANCE.md`, không cột nào thay cột nào:

| Cột | Bằng chứng | Ai | Khi |
| --- | --- | --- | --- |
| 1. Cổng tự động | typecheck, lint dưới ngân sách (hạ sau đêm 1), `npm test`, `test:screens` cả bộ (layout, axe, 44 px, CLS, LCP, JS, màn đầu), `pwa.spec`, `badges.test` 53 × 2, grep bảng đã xoá trống | agent | mỗi lát, mỗi đêm, mỗi PR |
| 2. Năm người thật | mỗi thẻ có nhiệm vụ trong handoff; đạt khi ≥ 4/5 làm xong không gợi ý; ghi bảng vào roadmap | CL + MK tuyển người; TL ghi | sau mỗi PR lên production, trước khi MK kể chuyện về nó |
| 3. Số sau hai tuần | bảng "Số đo hôm nay" chỉ giảm; mục tiêu hai tuần của từng thẻ; phễu PostHog trước sau | MK đọc, TL đo | hai tuần sau mỗi thẻ |
| (D) Tiền thật | ≥ 1 postback thật tạo earnings đúng số; chuyển khoản tay đầu tiên khớp | CL ký deal; TL kiểm | khi có deal |

**Cổng ra mắt (MK không kể chuyện gì về một thẻ cho tới khi):** cột 1 xanh trên production, cột 2 đạt cho thẻ đó, và bản 5 người ghi trong roadmap. Thứ tự kể: tuần sau đêm 1 "FeestFinder không bán vé, chỉ chỉ đường" (cùng lúc với trang "Cho nhà tổ chức" mới); tuần sau đêm 2 "chia sẻ được tiền" **chỉ khi** có partner đầu, không thì "link vé theo nước và hoa hồng sắp có"; tuần sau đêm 3 "mùa huy hiệu" và "cài app".

---

## 5. Kết luận và việc ai làm

**Thống nhất:** plan bản 3 + 8 điều chỉnh của họp (2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8) là **plan cuối**. Agent chép 8 điều chỉnh vào handoff và lịch đêm hôm nay. Không thêm thẻ nào nữa trước khi ba đêm xong và 5 người đã thử.

| Việc | Ai | Khi | Xong khi |
| --- | --- | --- | --- |
| Nói "chốt" cho biên bản này; chọn hay để mặc định D7–D18; ghi dòng quyết định vào roadmap | CL | trước đêm 1 | dòng có trong roadmap |
| Xác nhận production không có đơn `paid` | CL | trước đêm 1 | một câu trong roadmap |
| Đặt `POSTHOG_KEY` trên Vercel; lưu phễu cơ sở | CL + MK | trước khi đêm 1 merge | insight có tên trong PostHog |
| Merge branch `docs/growth-plan-2026-10-19` vào `main` | CL nói "merge", agent làm | trước đêm 1 | `main` có 3 file plan |
| Chạy đêm 1, 2, 3 theo lịch | agent | khi CL nói "bắt đầu night build n" | file tiến độ mỗi sáng |
| Mỗi sáng: xem file tiến độ, ảnh đổi, gắn `visual-ok`, nói "merge" | CL (+ CD cho `/kit` của huy hiệu) | sáng sau mỗi đêm | PR merged |
| Ký affiliate: Megatix trước (SG, TH, ID, VN), rồi Ticketmaster qua Impact, Klook; nhập vào `/console/partners` | CL + MK | trước đêm 2 nếu được, muộn nhất tuần sau đêm 2 | ≥ 1 postback thật |
| Tỷ giá cố định SGD, THB, IDR, JPY → VND mỗi tháng | MK | tháng | giá trị trong `lib/money.ts` có ngày |
| Danh sách 15–20 venue và collective mỗi thành phố để mời dùng Lịch; 5 người mỗi bài thử | MK | trước đêm 2 | danh sách trong roadmap |
| Bài 5 người cho C, A, B (một buổi), rồi D, 4, 5, 1, rồi E, F | CL + MK tuyển, TL ghi | sau mỗi đợt merge | bảng trong roadmap |
| Thử cài trên iPhone và Android thật từ preview; push một commit rỗng để thấy bản cài tự đổi | CL | sau đêm 3 | hai video ngắn |
| Rà `/kit` huy hiệu 18 biến thể bằng mắt trước khi merge thẻ E | CD | sáng sau đêm 3 | `visual-ok` |
| Chuẩn bị bốn mẩu chuyện theo thứ tự ở mục 4; không đăng trước cổng ra mắt | MK | theo tuần | bài đăng |
| Zalo OA: xác minh OA doanh nghiệp, giữ cho sau | CL | khi muốn mở lại | — |

**Rủi ro ghi nhận, không gỡ bằng code:** Nghị định 147 (có cờ lui); deal affiliate (cột tiền chờ); nội dung mỏng (22 sự kiện, TP.HCM 1: thẻ 1 và việc venue của team quyết định điểm "Nội dung"); chưa người thật nào thử.

Ký: TL · CD · CL (chờ "chốt") · MK.
