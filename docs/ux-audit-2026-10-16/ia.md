# FeestFinder: kiểm toán kiến trúc thông tin (IA)

Ngày 2026-10-16. Người viết: kiểm toán viên IA của nhóm UX. Đọc mã ở nhánh `main` cùng các thay đổi chưa commit (`ui/back-link.tsx`, `ui/post-kind.tsx`). Không sửa file nào trong repo. Đường dẫn file tính từ `festfinder-web/src/` (giao diện) hoặc `festfinder-backend/src/` (API), trừ khi ghi rõ khác.

Có ba script trình duyệt kiểm chứng (`scratchpad/ux/ia-01.mjs` … `ia-04.mjs`), chạy trên bản xem trước cục bộ:
- `ia-01`: nav trên desktop ở `/app/*` so với `/saved`, `/profile`.
- `ia-02`: nav trên điện thoại ở `/` và `/app/*`.
- `ia-03`, `ia-04`: dữ liệu demo của các màn hình back-office.

---

## 0. Tóm tắt: những đề xuất gộp mạnh nhất

| # | Vấn đề | Đề xuất | Lợi ích | Rủi ro |
|---|---|---|---|---|
| 1 | Fan có **hai sản phẩm song song**: web (`/`, `/list`, `/e`, `/saved`, `/profile`) và app (`/app`, `/app/list`, `/app/e`, `/app/saved`, `/app/profile`). Trên desktop, cả hai nav cùng hiện một lúc: "Khám phá" trỏ tới `/` và `/app`, "Đã lưu" trỏ tới `/saved` và `/app/saved` | Giữ route web làm route chính. Thanh tab trên điện thoại trỏ về route web. `/app` chỉ còn các màn cần chạy offline hoặc theo phiên: vé, checkout, live | Rất cao | Trung bình |
| 2 | "Thông báo" mang 4 nghĩa. Danh sách thông báo chỉ mở được từ cái chuông ở `/app`. Web, Studio nghệ sĩ và Console không có chuông. Tổ chức có hộp thông báo riêng | Một trung tâm thông báo và một chuông trong mọi khung. Gộp ba trang cài đặt thành một | Cao | Thấp |
| 3 | Việc chờ admin quyết rải ở **10 nơi**, trong 3 nhóm của rail. Số đếm trên rail khác số ở Tổng quan. Yêu cầu quảng cáo của NTC, báo cáo bài thảo luận, báo cáo bình luận mix và tin nhắn NTC **không được đếm ở đâu** | Gom vào nhóm "Việc cần làm", lấy số từ một endpoint. Có thể tiến tới một hàng chờ có tab theo loại | Cao | Trung bình |
| 4 | Quảng bá: "Kệ nổi bật" được sửa trong Console nhưng **không trang nào hiển thị** (`GET /shelves` không có ai gọi). Hai vị trí quảng cáo `feed` và `live` được bán nhưng không render. Một việc có 5 tên gọi: "Đẩy tin", "Quảng cáo", "Đang hot", "Kệ nổi bật", "Ưu tiên feed" | Dùng một mô hình vị trí, có ngày bắt đầu và kết thúc. Chỉ bán vị trí có hiển thị thật. Một tên: "Quảng cáo" | Cao (doanh thu và lòng tin) | Trung bình |
| 5 | "Đăng sự kiện" ép fan và nghệ sĩ nhận vai Nhà tổ chức. Với nghệ sĩ, việc này buộc đổi vai. Trong khi đó API "cộng đồng gửi sự kiện" (`POST /community/events`, prefill từ link hoặc poster, `/me/submissions`) vẫn còn, có test, nhưng **không có màn hình** | Khôi phục form cộng đồng làm lối "Sự kiện" cho người chưa là NTC. Đưa prefill vào wizard | Cao | Thấp |
| 6 | Studio có **hai form cho cùng một sự kiện** (wizard và editor), và một bản nháp mở ở form nào tùy chỗ bấm. Danh sách khách mời nằm trong "Mã giảm giá". "Thông báo" (gửi khách) chồng với "cập nhật trong đêm" có `notify` | Một form. Khách mời chuyển về Người tham dự. Gộp kênh gửi tin cho khách | Trung bình-cao | Trung bình |
| 7 | Nghệ sĩ theo dõi đề nghị biểu diễn ở 3 nơi, với 4 bảng dữ liệu có trạng thái gần giống nhau | Một danh sách "Lịch diễn & booking" có cột nguồn | Trung bình | Thấp |
| 8 | Đối soát đối tác vé có hai đường: màn Đối tác đánh "đã trả" từng đơn, còn màn Affiliate gom thành kỳ thanh toán. Đơn đã đánh "đã trả" lẻ thì không vào được kỳ nào | Chỉ giữ một đường trả tiền | Trung bình (sai tiền) | Thấp |

Mỗi mục có bằng chứng và đề xuất chi tiết ở phần 3. Ba mục 1, 3 và 4 tạo khác biệt lớn nhất cho người dùng. Hai mục 4 và 8 đáng sửa trước vì đụng tới tiền và lời hứa với khách.

---

## 1. Sơ đồ trang

Ký hiệu persona: F = fan (mọi tài khoản), N = nhà tổ chức (NTC), A = nghệ sĩ, Ad = admin, K = khách vãng lai hoặc máy tìm kiếm.
Ký hiệu cảnh báo: ⚠️ mồ côi (không chỗ nào trong UI trỏ tới), 🔸 chỉ tới được từ một chỗ sâu.

### 1.1 Web công khai

| Route | Mục đích | Persona | Được liên kết từ |
|---|---|---|---|
| `/` (`?lang=en` → `/en`) | Trang chủ: tiêu đề theo thời gian, thẻ nổi bật (`hero`), sự kiện cuối tuần, chip dòng nhạc, "Tối nay ở đâu", FAQ, banner quảng cáo | K, F | Logo và "Khám phá" trên nav (`kd/web/chrome.tsx:61,65`), sheet menu điện thoại (`chrome.tsx:148`), menu Dòng nhạc (`/?style=`, `chrome.tsx:30,78`) |
| `/list` (`?view=table\|grid\|map`) | Mọi sự kiện, ba kiểu xem, bộ lọc nằm trên địa chỉ | K, F | "Sự kiện" trên nav (`chrome.tsx:66,148`), sheet tìm kiếm (`chrome.tsx:209`), nút "Mở bản đồ" ở trang chủ (`kd/web/home/browser.tsx:253`), redirect `/map` (`next.config.ts:120`) |
| `/e/<slug>` | Trang sự kiện, có SEO đầy đủ | K, F | Mọi thẻ và dòng sự kiện trên web |
| `/o/<slug>` | Trang nhà tổ chức | K, F | Trang sự kiện; thẻ tổ chức ở đầu rail Studio (`kd/studio/root.tsx:197`) |
| `/a`, `/a/style/<s>`, `/a/city/<c>` | Thư mục nghệ sĩ | K, F | "Nghệ sĩ" trên nav (`chrome.tsx:67`) |
| `/a/<slug>` | Trang nghệ sĩ | K, F | Lineup, thư mục, thẻ nghệ sĩ ở đầu rail nghệ sĩ (`kd/artist/root.tsx:355`) |
| `/c/<slug>` | Bộ sưu tập công khai | K | Nút chia sẻ ở `/saved` (`kd/web/saved/share.tsx`), công tắc "liên kết công khai" ở `/app/saved` |
| `/p`, `/p/<slug>` | Dự án kêu gọi tài trợ | K, F, A | 🔸 Chỉ có dòng "Xem dự án đang kêu gọi" ở cuối sheet "Đăng sự kiện" (`chrome.tsx:195`), tab Dự án của Cơ hội nghệ sĩ (`kd/artist/opportunities.tsx:222`), khối nhà tài trợ trên trang sự kiện. Nav đã bỏ tab Dự án hôm 2026-10-16 (`docs/FEESTFINDER_ROADMAP.md:176`) |
| `/p/new` | Tạo dự án | F | Sheet "Đăng sự kiện" (`kd/ui/post-kind.tsx:12`), `/p/mine` |
| `/p/mine` | Dự án của tôi và đề nghị tôi đã gửi | F, A | Menu tài khoản (`chrome.tsx:127`) |
| `/p/<slug>/manage` | Chủ dự án sửa và trả lời đề nghị | F | `/p/mine` (`kd/web/projects/manage.tsx`) |
| `/about` | Giới thiệu | K | Footer (`chrome.tsx:247`) |
| `/advertise` | Thương hiệu đặt quảng cáo, kèm các yêu cầu của chính họ | K (thương hiệu) | Footer (`chrome.tsx:248`), `/about` |
| `/stats/venues` | Địa điểm có sự kiện | K | 🔸 "Mọi địa điểm" ở trang chủ (`kd/web/home/browser.tsx:254`) |
| `/stats/free`, `/stats/weekend` | Danh sách lọc "miễn phí" và "cuối tuần" | K | ⚠️ Chỉ có chip bên trong chính `/stats` trỏ tới (`kd/web/stats/model.ts:95-104`) |
| `/saved` (`?c=<id>`) | Sự kiện đã lưu và bộ sưu tập: tạo, đổi tên, chia sẻ, xoá | F | Menu tài khoản (`chrome.tsx:129`) |
| `/profile` | Hồ sơ fan trên web | F | Menu tài khoản (`chrome.tsx:126`) |
| `/kit` | Bộ thành phần giao diện (chỉ bản dev, hoặc khi `FF_KIT=1`) | dev | Không có (có chủ đích) |

### 1.2 App (`/app/*`, không index)

| Route | Mục đích | Persona | Được liên kết từ |
|---|---|---|---|
| `/app` | Khám phá trong app: onboarding, thành phố, "Gần bạn", chuông | F | `start_url` của PWA (`app/manifest.ts:10`), tab Khám phá (`kd/app/root.tsx:63`), nút Back trong app. Web không có link nào tới đây |
| `/app/list` | Bản đồ thành phố, kèm danh sách dòng | F | Tab Bản đồ (`root.tsx:64`), "Xem bản đồ" ở Explore (`kd/app/explore.tsx:207`) |
| `/app/saved` | Đã lưu (bản rút gọn) | F | 🔸 Chỉ tab Đã lưu (`root.tsx:65`) |
| `/app/tickets` | Vé có QR, chạy offline | F | Tab Vé (`root.tsx:66`), menu tài khoản (`chrome.tsx:128`), `/profile` (`kd/web/fan/page.tsx:95`), khung vé trên web (`kd/web/event/tickets.tsx:197`) |
| `/app/profile` | "Tôi": passport, Wrapped, đang theo dõi, cài đặt | F | Tab Tôi (`root.tsx:67`) |
| `/app/e/<slug>` | Trang sự kiện trong app | F | Thẻ ở Explore và Bản đồ (`explore.tsx:214`, `kd/app/map.tsx:203`), tem passport (`kd/app/profile.tsx:151`) |
| `/app/checkout/<slug>` | Mua vé | F | Khung vé web, qua `/go` (`kd/web/event/tickets.tsx:187`) |
| `/app/live/<slug>` | Chế độ live trong đêm | F | 🔸 Nút "Live mode" chỉ hiện khi đã mở cửa (`kd/app/tickets.tsx:193`); thông báo "vẫy tay" (`routes/live.ts:138`) |
| `/app/plan/<slug>` | Đi cùng bạn bè | F | 🔸 Chỉ một dòng ở `/app/e` (`kd/app/event.tsx:111`). Thông báo về kế hoạch **mở nhầm `/app`** (xem 4.3) |
| `/app/guide/<slug>` | Hướng dẫn AI quanh địa điểm | F | 🔸 Chỉ một dòng ở `/app/e` (`kd/app/event.tsx:118`) |
| `/app/recap/<slug>` | Đánh giá sau đêm | F | ⚠️ Không chỗ nào trỏ tới. Hàm `hrefOf` có nhánh `screen:'recap'` (`kd/app/inbox.tsx:53`) nhưng API không tạo thông báo nào như vậy |
| `/app/chat/<id>` | Chat 1-1 | F | 🔸 Chỉ mở được từ thông báo (`routes/social.ts:104`). Không có danh sách chat |
| `/app/notifications` | Danh sách thông báo | F, A, Ad | 🔸 Chỉ cái chuông ở `/app` (`explore.tsx:178`) |
| `/app/alerts` | Cảnh báo thông minh | F | 🔸 Chỉ phần cài đặt ở `/app/profile` (`profile.tsx:228`) |
| `/app/settings` | Ma trận kênh thông báo | F | Cài đặt ở `/app/profile` (`profile.tsx:229`), nút "Thông báo" ở `/profile` (`fan/page.tsx:81`) |
| `/app/hyped` | Sự kiện đã hype | F | ⚠️ Không có (chỉ e2e mở bằng URL, `e2e/next/app-more.spec.ts:100`) |
| `/app/following` | Đang theo dõi | F | ⚠️ Không có (`app-more.spec.ts:103`) |

### 1.3 Studio (NTC)

| Route | Mục đích | Được liên kết từ |
|---|---|---|
| `/studio` | Bảng điều khiển của một sự kiện | Footer "Cho nhà tổ chức" (`chrome.tsx:246`), mục vai nghề trong menu tài khoản (`kd/craft.ts:6`, `WORKSPACE`), `OwnerLink` trên trang tổ chức (`kd/web/org/page.tsx:126`), rail Console (`kd/console/root.tsx:161`) |
| `/studio/new` | Wizard tạo sự kiện | Sheet "Đăng sự kiện" (`ui/post-kind.tsx:12`), nút lime trên rail (`studio/root.tsx:218`), bảng điều khiển (nháp: `dashboard.tsx:153,205`) |
| `/studio/events` | Danh sách tin | Rail (`studio/root.tsx:223`) |
| `/studio/events/<id>` | Editor | Danh sách tin (`events.tsx:128,146`), bảng điều khiển (`dashboard.tsx:88,194,219`) |
| `/studio/attendees` | Người giữ vé | 🔸 Chỉ rail |
| `/studio/door` | Check-in (màn riêng, không có rail) | Rail, thông báo |
| `/studio/revenue` | Doanh thu và chi trả | 🔸 Chỉ rail |
| `/studio/inbox` | Tin nhắn với FeestFinder, thông báo và cài đặt chủ đề | Rail (có số chưa đọc) |
| `/studio/announce` | Gửi tin cho khách | 🔸 Chỉ rail |
| `/studio/promos` | Mã giảm giá và khách mời | 🔸 Chỉ rail |
| `/studio/ads` | Yêu cầu quảng cáo | Rail, nút "Đẩy tin" ở bảng điều khiển (`dashboard.tsx:77`), thẻ thành công của wizard (`wizard.tsx:256`) |
| `/studio/gigs` | Slot cho nghệ sĩ và lời mời booking | Rail, thông báo |
| `/studio/profile` | Thông tin doanh nghiệp | Chân rail, bảng điều khiển, editor |
| `/studio/event/<id>` | Redirect cũ → `/studio?event=` | Link cũ |

### 1.4 Studio nghệ sĩ

| Route | Mục đích | Được liên kết từ |
|---|---|---|
| `/studio/artist` | Hồ sơ nghệ sĩ | Mục vai nghề trong menu tài khoản, `OwnerLink` trên trang nghệ sĩ (`kd/web/artist/page.tsx:178`), rail Console (`console/root.tsx:162`) |
| `/studio/artist/mixes` | Mix | 🔸 Chỉ rail |
| `/studio/artist/gigs` | Lịch diễn và booking (tab: đã ứng tuyển, lời mời, ngày rảnh, tự báo) | Rail, redirect từ tab cũ của Cơ hội (`opportunities.tsx:46`) |
| `/studio/artist/opportunities` | Cơ hội: slot mở, thương hiệu, dự án | Rail, thông báo (`?tab=brands`) |
| `/studio/artist/gear` | Thiết bị | 🔸 Chỉ rail |

### 1.5 Console (admin)

Mọi tab đều nằm trên rail (`console/root.tsx:133-159`): `overview`, `/console` (Kiểm duyệt), `claims`, `reports`, `feedback`, `events` (+`/new`, `/<id>`), `organizers`, `venues`, `artists`, `sources`, `partners`, `affiliate`, `brands`, `projects`, `featured`, `users`, `orders`, `insights`, `audit`.

`/console/verification` là trang thật nhưng chỉ vào được bằng tab trong `OrgHead` (`console/organizers/parts.tsx:19`). Tổng quan lại trỏ "Xác minh" về `/console/organizers?state=pending` (`console/overview/overview.tsx:80`).

Các route chỉ để redirect: `/console/ads` → `featured#ads`, `/console/appeals` → `/console?filter=appeals`, và `/console/{orders,organizers,users}/<id>` → danh sách có drawer mở sẵn.

### 1.6 Dự án và quảng cáo (xuyên vùng)

- **Dự án:** `/p` (công khai), `/p/new` · `/p/mine` · `/p/<slug>/manage` (của chủ), `/console/projects` (duyệt), tab Dự án ở `/studio/artist/opportunities` (nghệ sĩ).
- **Quảng cáo:** `/advertise` (thương hiệu), `/studio/ads` (NTC), `/console/featured` (gồm kệ, yêu cầu quảng cáo của NTC, yêu cầu của thương hiệu, chiến dịch, bảng giá CPM), `/console/brands` (không phải quảng cáo, xem 3.4).

---

## 2. Kiểm kê điều hướng

### 2.1 Thứ tự mục trên từng bề mặt

| Bề mặt | Các mục, theo thứ tự |
|---|---|
| **Nav web, desktop** (`chrome.tsx:61-137`) | Logo→`/` · Khám phá→`/` · Sự kiện→`/list` · Nghệ sĩ→`/a` · Dòng nhạc ▾ (10 dòng → `/?style=`) ‖ Tìm kiếm (sheet → `/list?q=`) · [admin] Console · **Đăng sự kiện** (sheet: Sự kiện→`/studio/new`, Dự án→`/p/new`, Xem dự án→`/p`) · avatar hoặc Đăng nhập |
| **Menu tài khoản** (`chrome.tsx:103-131`) | Tên và email · [admin] Đội FeestFinder › Console · **Vai trò:** Người tham dự ✓ (không bấm được), vai nghề→workspace (nhãn "Chờ duyệt") hoặc "Thêm vai nghề", "Đổi sang …" · Hồ sơ của tôi→`/profile` · Dự án của tôi→`/p/mine` · Vé của tôi→`/app/tickets` (n) · Đã lưu→`/saved` (n) · Đăng xuất |
| **Sheet menu điện thoại** (`chrome.tsx:145-171`) | Khám phá · Sự kiện · Nghệ sĩ · chip Dòng nhạc · Đăng sự kiện · [admin] Console. Mục tài khoản nằm ở avatar |
| **Footer** (`chrome.tsx:246-252`) | Cho nhà tổ chức→`/studio` · Về FeestFinder · Quảng cáo→`/advertise` · Góp ý · email · ngôn ngữ kia |
| **Thanh tab app** (điện thoại) và **rail app** (desktop) (`app/root.tsx:63-67`) | Khám phá→`/app` · Bản đồ→`/app/list` · Đã lưu→`/app/saved` · Vé→`/app/tickets` · Tôi→`/app/profile`. Trên desktop, nav web vẫn nằm phía trên (`root.tsx:45`) |
| **Phần cài đặt trong "Tôi"** (`app/profile.tsx:219-243`) | [admin] Console · Cảnh báo thông minh→`/app/alerts` · Thông báo→`/app/settings` · Thành phố · Ngôn ngữ · Đăng xuất |
| **Rail Studio** (`studio/root.tsx:190-240`) | Đầu rail: wordmark "Studio" · thẻ tổ chức "Xem hồ sơ công khai" · [n>1] Đổi nhà tổ chức · **Sự kiện mới** (lime). Mục chính: Bảng điều khiển · Sự kiện · Người tham dự · Check-in · Doanh thu · Hộp thư (n) · Thông báo · Mã giảm giá & khách mời · Quảng cáo · Gig & booking. Chân rail: Thông tin doanh nghiệp · **Người tham dự**→`/` · Đổi sang Nghệ sĩ · Đăng xuất |
| **Rail nghệ sĩ** (`artist/root.tsx:349-375`) | Đầu rail: wordmark "Nghệ sĩ" · thẻ nghệ sĩ "Xem trang công khai". Mục chính: Hồ sơ nghệ sĩ · Mix · Lịch diễn & booking · Cơ hội diễn · Thiết bị. Chân rail: Người tham dự→`/` · Đổi sang Nhà tổ chức · Đăng xuất |
| **Rail Console** (`console/root.tsx:127-165`) | *Việc cần làm:* Tổng quan · Kiểm duyệt (n) · Yêu cầu nhận (n) · Báo cáo (n) · Góp ý. *Danh mục:* Sự kiện · Nhà tổ chức (n) · Địa điểm (n) · Nghệ sĩ · Nguồn dữ liệu. *Đối tác:* Đối tác vé · Tiếp thị liên kết · Chiến dịch thương hiệu · Dự án (n). *Nền tảng:* Kệ nổi bật (n) · Tài khoản · Đơn hàng · Số liệu · Nhật ký. Chân rail: Studio · Studio nghệ sĩ · Mở trang công khai. Thanh trên: ô tìm kiếm, avatar (Xem với vai trò…, Đăng xuất) |

### 2.2 Chỗ không nhất quán

**Một tên, hai đích đến (cùng một màn hình)**

Kiểm chứng ở `ia-01`, `/app/tickets` trên desktop:
- "Khám phá": nav trên trỏ `/`, rail trỏ `/app`.
- "Đã lưu": rail trỏ `/app/saved`, menu tài khoản trỏ `/saved`.
- "Tôi" (`/app/profile`) và "Hồ sơ của tôi" (`/profile`) là hai trang khác nhau.
- Hai `<nav>` cùng được gắn nhãn là nav chính: "Chính" và "Điều hướng chính".

**"Người tham dự" xuất hiện hai lần trên rail Studio**
- Mục chính dẫn tới danh sách người giữ vé (`studio/copy.ts:11`).
- Mục ở chân rail dẫn ra site, theo nghĩa vai "attendee" (`craft.ts:23`, `studio/root.tsx:237`).

**"Thông báo" mang bốn nghĩa**
1. Danh sách thông báo (`app/copy.ts:17,258`).
2. Cài đặt kênh: nhãn `notifSettings` (`app/copy.ts:157`), dùng ở `/app/profile` và trên nút ở `/profile` (`fan/page.tsx:81`), nhưng nút này dẫn tới `/app/settings`, không phải danh sách.
3. Gửi tin cho khách trong Studio (`studio/copy.ts:15`).
4. Tab thông báo trong Hộp thư Studio (`studio/copy.ts:339`).

**Một đích, nhiều tên**
- `/studio`: "Cho nhà tổ chức" (footer), "Nhà tổ chức" (menu), "Studio" (Console).
- `/studio/artist`: "Nghệ sĩ" (menu, đầu rail: `artist/copy.ts:6`), "Studio nghệ sĩ" (`console/copy.ts:34`).
- Link trang công khai: "Xem hồ sơ công khai" (`studio/copy.ts:8`) và "Xem trang công khai" (`artist/copy.ts:8`).
- Cùng tiếng Anh "Gigs & bookings" nhưng tiếng Việt là "Gig & booking" (`studio/copy.ts:33`) và "Lịch diễn & booking" (`artist/copy.ts:10`).

**Cùng loại mục, vị trí khác nhau**
- Hồ sơ: Studio để ở chân rail ("Thông tin doanh nghiệp"), nghệ sĩ để ở mục đầu tiên.
- Đăng xuất: Studio và nghệ sĩ để ở chân rail, Console để trong avatar, app để trong accordion cài đặt, web để trong avatar.
- Console không có đăng xuất trên rail, cũng không có lối "Người tham dự".

**Mục hiện sai persona**
- "Đăng sự kiện" → Sự kiện → `/studio/new` dẫn fan tới cổng "Bạn chưa là nhà tổ chức" (`studio/root.tsx:109-121`), và dẫn nghệ sĩ tới màn "đổi vai" (`studio/root.tsx:124-141`). Nghệ sĩ muốn đăng đêm diễn của chính mình thì phải rời vai nghệ sĩ. Xem 3.6.
- Footer có "Cho nhà tổ chức" nhưng không có "Cho nghệ sĩ".
- "Tôi" trong app không có lối vào Studio hay Studio nghệ sĩ, không có "Dự án của tôi", không đổi được vai. Chỉ admin có một dòng Console (`app/profile.tsx:223`).

**App trên điện thoại là một thế giới đóng** (`ia-02`)
- Từ `/app/*` không đi tới được thư mục nghệ sĩ `/a`, dự án `/p`, `/about`, Studio hay `/p/mine`.
- Ngược lại, web trên điện thoại không có chuông thông báo và không có lối vào `/app` ngoài "Vé của tôi".

**Nhóm trên rail Console**
- "Dự án" là một hàng chờ duyệt có số đếm, nhưng lại nằm trong nhóm Đối tác.
- "Kệ nổi bật" (nhóm Nền tảng) chứa cả yêu cầu quảng cáo.
- "Chiến dịch thương hiệu" (nhóm Đối tác) thực ra là nghệ sĩ nhận tài trợ thương hiệu, không phải quảng cáo.

---

## 3. Phân tích chồng chéo

### 3.1 Web và app cho fan: `/` với `/app`, `/list` với `/app/list`, `/e` với `/app/e`, `/saved` với `/app/saved`, `/profile` với `/app/profile`

**Hiện trạng**

*Trang chủ và Khám phá*
- `/` (`kd/web/home/page.tsx`) và `/app` (`kd/app/explore.tsx`) đều có hero lấy từ `events.featured` (`routes/catalog.ts:215`), chip dòng nhạc và khối "gần đây".
- Riêng app có thêm onboarding (thành phố, sở thích, lưu trên máy) và chuông thông báo.

*Bản đồ*
- `/list?view=map` (`kd/web/list/map-view.tsx`, 243 dòng) và `/app/list` (`kd/app/map.tsx`, 245 dòng) là hai bản cài đặt bản đồ riêng, cùng gọi `/events/map`.

*Trang sự kiện*
- `/app/e` dùng lại các phần của trang web (`kd/app/event.tsx:1-7`), thêm dock giá, dòng "Đi cùng bạn bè" và "Hướng dẫn" (`event.tsx:111,118`).
- Hai dòng đó **không có trên `/e`**, nên chỉ ai đang ở trong app mới thấy.

*Đã lưu*
- `/saved` (`kd/web/saved/*`, khoảng 700 dòng) tạo, đổi tên, xoá bộ sưu tập, thêm hoặc bỏ sự kiện, chia sẻ.
- `/app/saved` (`kd/app/saved.tsx`, 126 dòng) chỉ có công tắc công khai và xoá. **Không tạo hay đổi tên được.** Cả hai dùng chung `/me/saves` và `/me/collections`.

*Hồ sơ*
- `/profile` (`kd/web/fan/page.tsx`) và `/app/profile` dùng chung `EditSheet`, `PassportSection`, `FollowingSection`, `WrappedSheet` (`fan/page.tsx:21`). Khác nhau ở chỗ:
  - `/profile` không có cài đặt (thành phố, ngôn ngữ, cảnh báo) mà gửi người dùng sang `/app/settings`.
  - App không có "Dự án của tôi", không đổi vai, không vào được workspace.

*Desktop*
- Từ 2026-10-16, `/app/*` hiện cả nav web lẫn rail app (`app/root.tsx:45`, `kd/kd.css:230-242`). Hai hệ nav có nhãn trùng nhau như đã nêu ở 2.2.

**Ai dùng và bao lâu một lần.** Fan, hằng ngày hoặc hằng tuần. Đây là cặp chồng chéo người dùng gặp nhiều nhất: người đến từ Google vào `/e`, bấm "Vé của tôi" là sang app, bấm "Đã lưu" thì sang một trang khác hẳn.

**Đề xuất**
1. **Route web là route chính.** Chúng được index và đầy đủ tính năng hơn.
   - Trên điện thoại vẫn hiện thanh tab, nhưng trỏ tới `/`, `/list?view=map`, `/saved`, `/app/tickets`, `/profile`.
   - Trên desktop chỉ còn nav web, bỏ rail app.
2. **`/app` chỉ giữ màn cần service worker hoặc gắn với phiên:** `/app/tickets` (offline), `/app/checkout`, `/app/live`, có thể thêm `/app/recap`.
3. **Redirect 308:**

   | Từ | Tới |
   |---|---|
   | `/app` | `/` |
   | `/app/list` | `/list?view=map` |
   | `/app/saved` | `/saved` |
   | `/app/profile` | `/profile` |
   | `/app/e/<slug>` | `/e/<slug>` |

   Đổi `start_url` sang `/`, hoặc giữ `/app` và để nó redirect.
4. **Đưa vào bản web:**
   - Dòng "Đi cùng bạn bè" và "Hướng dẫn" lên `/e`, chỉ hiện khi đêm chưa diễn ra.
   - Onboarding thành phố và sở thích của app thành một bước tuỳ chọn ở `/`.
   - Phần cài đặt (thành phố, ngôn ngữ, cảnh báo, thông báo) vào `/profile`.
5. **Dữ liệu và API:** không cần đổi gì, vì cùng endpoint.
   - Service worker: phạm vi cache vé vẫn ở `/app/tickets`.
   - Test cần sửa: `e2e/next/app.spec.ts`, `app-more.spec.ts`, `saved.spec.ts`, `profiles.spec.ts`.

**Rủi ro.** Trung bình. Người đã cài PWA quen màn Explore của app, và bản đồ app có ô tìm địa điểm riêng. Nên đo `FF.track` trên `/app` trước. Có thể làm theo từng bước, mỗi bước một redirect, bắt đầu với `/app/saved` và `/app/profile`, nơi bản web đã hơn hẳn.

### 3.2 Thông báo, hộp thư, gửi tin, cảnh báo

**Hiện trạng: các thành phần**

| Thành phần | Ở đâu | Bằng chứng |
|---|---|---|
| Thông báo cá nhân | `/app/notifications`, một bảng `notifications` có `user_id` | `db/migrations/004_engagement.sql:170` |
| Thông báo của đội NTC | Tab trong `/studio/inbox`, cùng bảng, có `organizer_id` | `services/notify.ts:117` |
| Tin nhắn NTC với FeestFinder | `inbox_threads` | `005_operations.sql:20` |
| Chat bạn bè | `/app/chat/<id>` | |
| Chat nhóm của kế hoạch | Trong `/app/plan` | |
| Gửi tin cho khách | `/studio/announce`, bảng `announcements` | |
| Cập nhật trong đêm | Editor Studio, có cờ `notify` | `kd/studio/editor.tsx:466-494`, `routes/night.ts:87` |
| Cảnh báo thông minh | `/app/alerts` | |
| Cài đặt kênh cá nhân | `/app/settings` | |
| Cài đặt chủ đề của đội | `/studio/inbox?tab=settings` | |

**Hiện trạng: lỗ hổng**
- **Chỉ một chỗ mở được danh sách thông báo:** chuông ở `/app` (`explore.tsx:178`). Nav web, Studio nghệ sĩ và Console đều không có chuông.
  - Admin được báo "trong app" (`notifyAdmins`, `services/notify.ts:76`) nhưng làm việc trong Console, nơi không có chuông.
  - Nghệ sĩ nhận thông báo booking qua `/app/notifications` (`inbox.tsx:49`), Studio nghệ sĩ không có hộp thư.
- **Thông báo kế hoạch mở nhầm.** API gửi `link:{screen:'plan', planId}` (`routes/plans.ts:125,165,220,244,290`). Nhưng `hrefOf` chỉ đọc `screen:'plan'` khi có `eventId` (`kd/app/inbox.tsx:47-59`), nên mọi thông báo kế hoạch rơi về `/app`.
- **Tin nhắn NTC rơi vào khoảng trống.** Khi NTC trả lời một thread, hệ thống tự gửi "phản hồi trong 2 giờ làm việc" (`routes/organizer/inbox.ts:19,78`) và bật `admin_unread` (`inbox.ts:75`). Nhưng chỉ khung chi tiết của hàng chờ duyệt đọc thread, và chỉ cho đúng sự kiện đang mở (`routes/admin/moderation.ts:238-240`). Console không có danh sách thread nào. Chủ đề `partnerships` và `support` có trong schema nhưng không chỗ nào tạo ra.

**Đề xuất**
1. **Một trung tâm thông báo**, ví dụ `/notifications`, hoặc giữ `/app/notifications`.
   - Có bộ lọc "Cá nhân · Studio · <tổ chức>".
   - Một chuông trong mọi khung: nav web, rail Studio, rail nghệ sĩ, thanh trên Console.
   - API: `GET /me/notifications?scope=all` gộp các dòng có `organizer_id` thuộc những đội tài khoản đó tham gia. Trạng thái đã đọc của dòng tổ chức vẫn chung cho cả đội, như hiện nay.
2. **Một trang "Cài đặt thông báo"** gồm 3 phần: kênh cá nhân (`/app/settings`), Cảnh báo thông minh (`/app/alerts`), chủ đề của đội (tab của Studio). Ba route cũ redirect về đây.
3. **Hộp thư Studio chỉ còn tin nhắn**, đặt tên rõ là "Tin nhắn với FeestFinder".
   - Console thêm hàng chờ "Tin nhắn NTC" lọc theo `admin_unread`, đếm trên rail.
   - Hoặc bỏ câu tự động "2 giờ", vì hiện không ai được báo là có tin mới.
4. **Đổi tên** `/studio/announce` thành "Gửi tin cho khách", và gộp phần "Cập nhật trong đêm" có `notify` vào đó với lựa chọn thời điểm: ngay, hẹn giờ, hoặc ghim lên trang sự kiện. Hai việc này cùng là "gửi tới người của sự kiện", cùng tính lượt tiếp cận.
5. **Sửa lỗi liên kết** `planId`: API thêm `eventId`, hoặc `hrefOf` đọc `planId`.

**Nên giữ riêng.** Chat bạn bè và tin nhắn NTC phục vụ hai đối tượng khác nhau, không nên gộp.

**Rủi ro.** Thấp. Phần lớn là thay đổi UI và một tham số API.

### 3.3 Theo dõi, hype, lưu, bộ sưu tập, kệ nổi bật

**Hiện trạng: các tín hiệu "tôi quan tâm"**

| Tín hiệu | Cơ chế | Hiển thị |
|---|---|---|
| Lưu (tim) | `saves` | Số "N quan tâm" công khai trên trang sự kiện (`kd/web/event/actions.tsx:25-40`, `web/copy.ts:48`) |
| Hype (lửa) | `hypes` | Số "N hype" công khai, mở khoá mục tiêu hype của NTC (`community.tsx:37-77`) |
| Theo dõi NTC hoặc nghệ sĩ | `organizer_follows`, `artist_follows` | "Chúng tôi sẽ báo khi họ công bố show" (`routes/catalog.ts:299-300`) |
| Cảnh báo thông minh | Danh sách tên nghệ sĩ và id NTC **riêng** (`kd/app/inbox.tsx:102,149`) | |
| Theo dõi giá vé, resale, nhắc | Các nút chuông khác | `web/event/tickets.tsx:67,168` |

Như vậy trang sự kiện có **hai bộ đếm công khai gần nghĩa nhau**. Nghệ sĩ thì có hai cách "theo dõi": follow và thêm vào cảnh báo.

**Hiện trạng: danh sách**
- Đã lưu có hai trang (xem 3.1).
- Đã hype chỉ có `/app/hyped`, trang mồ côi.
- Đang theo dõi: `FollowingSection` hiện tối đa 6 dòng và **không có "xem tất cả"** (`app/profile.tsx:191`). Trang `/app/following` có tồn tại nhưng không ai trỏ tới.

**Đề xuất**
1. Hype là tín hiệu công khai duy nhất. Bỏ số "N quan tâm" của lượt lưu, vì lượt lưu là riêng tư. Thêm tab "Đã hype" trong `/saved`, và `/app/hyped` redirect về đó.
   - Hướng thay thế mạnh tay hơn: gộp hẳn hype vào lưu, mục tiêu hype tính theo lượt lưu. Cần migration gộp bảng `hypes` vào `saves`, và đổi ý nghĩa với các NTC đã đặt mục tiêu. Rủi ro cao hơn.
2. `/app/following` thành trang "xem tất cả" của `FollowingSection` trên cả hai hồ sơ.
3. Cảnh báo thông minh dùng chính danh sách follow nghệ sĩ và NTC, thay cho danh sách tên riêng. API: `/me/alert` đọc từ `artist_follows` và `organizer_follows`, kèm migration chuyển `smart_alerts.artists` sang follow.

**Nên giữ riêng**
- Bộ sưu tập (`/c/<slug>`) là lớp tổ chức nằm trên lượt lưu. Nên giữ.
- Kệ nổi bật do biên tập viên làm. Kệ có thể dùng chung component thẻ với bộ sưu tập, nhưng vấn đề lớn hơn là kệ không hề hiển thị (3.4).

### 3.4 Quảng bá: `/console/featured`, `/console/brands`, `/studio/ads`, `/advertise`, các vị trí

**Hiện trạng: năm cơ chế "nổi bật"**

| # | Cơ chế | Tình trạng |
|---|---|---|
| 1 | Cờ `events.featured` | Bật trong form Console ("Ưu tiên trong feed Khám phá", `console/events/copy.ts:239`) hoặc menu của danh sách (`console/events/list.tsx:78`). **Hiển thị thật:** là hero (`catalog.ts:215`) và được ưu tiên trong feed app |
| 2 | Kệ (`shelves`) | Sửa ở `/console/featured` (`featured.tsx:3`). API công khai `GET /shelves` (`routes/catalog.ts:459`) **không được trang nào gọi**: chỉ có trong `kd/console/*`. Demo có 3 kệ nhưng `/shelves` trả về 0 (`ia-03`, `ia-04`). Tên kệ demo còn sót từ thời chưa EDM-only: "Đêm nhạc nhẹ", "Ăn uống & văn hoá" |
| 3 | `ad_campaigns` | Vị trí `banner`, `feed`, `live` (`lib/ads.ts:32`, bảng giá CPM ở `/advertise`). Chỉ có **`banner` trên trang chủ web** được render (`kd/web/home/page.tsx:29,44`). `feed` và `live` có chiến dịch đang chạy trong demo (`ia-03`) nhưng không màn nào hiện. `/app` Explore cũng không có banner |
| 4 | Yêu cầu quảng cáo của NTC (`boost_requests`) | Vị trí `featured`, `banner`, `social` (`lib/ads.ts:14`). Duyệt `banner` sẽ tạo chiến dịch. Duyệt kèm "lên kệ" thì đưa sự kiện vào một kệ không ai thấy (`featured.tsx:139-142`). Duyệt `featured` không tự làm gì (`routes/admin/catalog.ts:374-420`) |
| 5 | Huy hiệu thẻ | `badge` trong form Console |

**Hiện trạng: tên gọi lẫn lộn**
- Phía Studio: "Đẩy tin" (`studio/copy.ts:67`), "Đẩy tin lên mục Đang hot" (`:66`), "Đưa lên mục Đang hot khi tin được duyệt" (`:170`), "Quảng cáo" (`:17`).
- Phía Console: "Kệ nổi bật" (rail), "Yêu cầu quảng cáo sự kiện" (`console/copy.ts:139`), "Quảng cáo & đối tác" (`:151`), "Chiến dịch" (`:153`, chiến dịch quảng cáo).
- Rail Console còn có "Chiến dịch thương hiệu" (`console/copy.ts:24`, `/console/brands`). Đây là **thương hiệu tìm nghệ sĩ** (`026_brand_campaigns.sql:1-4`), không phải quảng cáo. Hai thứ khác nhau mang gần như cùng tên.

**Hiện trạng: số đếm.** Rail "Kệ nổi bật (n)" chỉ đếm `ad_inquiries` mới (`routes/admin/platform.ts:31`). Yêu cầu của NTC không được đếm ở đâu, kể cả trên Tổng quan (`overview.tsx:81`).

**Ai dùng.** NTC dùng theo từng sự kiện. Thương hiệu dùng hiếm. Admin dùng vài lần mỗi tuần. **Đây là phần có tiền.** Hiện đang bán ba thứ không có chỗ hiển thị: kệ "Đang hot", vị trí feed, vị trí live.

**Đề xuất**
1. **Màn Console "Quảng cáo"** (đổi tên `/console/featured`, giữ hai redirect cũ) gồm:
   - Một danh sách yêu cầu chung, lọc theo loại "Sự kiện · Thương hiệu".
   - Chiến dịch đang chạy.
   - Bảng giá.
   - Đếm cả `boost_requests` mở lẫn `ad_inquiries` mới trong `/admin/counts`.
2. **Một mô hình vị trí có ngày:** hero, kệ, banner, thẻ feed, live. Mỗi lần duyệt sẽ ghi một vị trí có ngày bắt đầu và kết thúc. Chọn một trong hai:
   - (a) render kệ trên `/` và `/app` (API đã có);
   - (b) bỏ kệ, và vị trí `featured` trở thành cờ `featured` có cửa sổ ngày.
   Trong lúc chưa có chỗ render, **ngừng bán** `feed`, `live` và lời hứa "mục Đang hot".
3. **Một tên ở Studio: "Quảng cáo".** Nút trên bảng điều khiển và wizard ghi "Quảng cáo sự kiện này".
4. **Đổi tên `/console/brands`** thành "Tài trợ nghệ sĩ", và chuyển sang nhóm cùng Nghệ sĩ hoặc Gig.

**Nên giữ riêng**
- Mã giảm giá (`/studio/promos`) và quảng cáo: một bên là giá vé, một bên là vị trí hiển thị.
- Yêu cầu của NTC và yêu cầu của thương hiệu: dữ liệu vào khác nhau (sự kiện so với thương hiệu, logo, có cồn), nên giữ hai form, chỉ gộp phía Console.

**Rủi ro.** Trung bình. Phương án (a) cần thiết kế hiển thị kệ. Phương án (b) cần migration thêm `featured_from` và `featured_until`.

### 3.5 Gig, cơ hội, đề nghị biểu diễn, tự báo gig, booking

**Hiện trạng: các luồng giữa nghệ sĩ và bên có nhu cầu**

| Luồng | Bảng | Trạng thái | Nghệ sĩ xem ở | Bên kia xem ở |
|---|---|---|---|---|
| Ứng tuyển slot | `gig_applications` | sent / shortlisted / declined / booked / withdrawn | Lịch diễn › Đã ứng tuyển | `/studio/gigs` |
| Lời mời booking (NTC gửi) | `booking_inquiries` | sent / accepted / declined / withdrawn | Lịch diễn › Lời mời | `/studio/gigs` › "Đã gửi" |
| Thương hiệu | `brand_campaign_interests` | | Cơ hội › Thương hiệu | `/console/brands` |
| Dự án › biểu diễn | `project_offers` (`kind='perform'`) | sent / accepted / declined | **`/p/mine`** (ngoài Studio nghệ sĩ) | `/p/<slug>/manage` |
| Tự báo gig | `artist_gig_reports` | | Lịch diễn › Tự báo | Hàng chờ duyệt |

Năm luồng này rải ở 3 nơi trong Studio nghệ sĩ, 1 nơi trên web và 3 nơi phía bên kia.

**Hiện trạng: lỗi tài liệu.** `kd/studio/gigs.tsx:4` ghi "booking requests sent from artist profiles", nhưng `/a/<slug>` không có nút booking nào. Chỉ form "Hỏi trực tiếp một nghệ sĩ" trong Studio tạo được lời mời (`gigs.tsx:216`).

**Đề xuất**
1. "Lịch diễn & booking" của nghệ sĩ thành **một danh sách mọi đề nghị**, có cột nguồn: Slot NTC, Lời mời, Thương hiệu, Dự án, Tự báo. Trạng thái quy về bốn nhóm: Đã gửi, Đang xét, Nhận, Từ chối.
   - API: endpoint đọc `GET /me/artist/pipeline` hợp các bảng lại. Giữ nguyên các bảng.
2. "Cơ hội" vẫn là nơi duyệt tìm: slot, thương hiệu, dự án.
3. `/p/mine` vẫn giữ đề nghị của các vai khác (đầu tư, tài trợ, địa điểm).

**Nên giữ riêng.** `/studio/gigs` và Cơ hội của nghệ sĩ là hai phía của cùng một chợ. Có hai màn là đúng.

**Cần kiểm tra thêm.** Đánh "booked" một ứng viên có làm nghệ sĩ xuất hiện trong lineup của sự kiện liên kết (`gig_opportunities.event_id`) không? Tôi chưa thấy UI nào nối hai việc này.

**Rủi ro.** Thấp.

### 3.6 Đăng sự kiện: wizard, editor, form Console và form cộng đồng đã mất

**Hiện trạng: ba form cho cùng một thực thể**

| Form | File | Dùng cho |
|---|---|---|
| Wizard Studio | `kd/studio/wizard.tsx`, 629 dòng | Tạo mới, tiếp tục nháp (`?draft=`) |
| Editor Studio | `kd/studio/editor.tsx`, 569 dòng | Sửa mọi trạng thái, kể cả nháp |
| Form Console | `kd/console/events/form.tsx` 554 dòng + `parts.tsx` 259 dòng | Admin tạo hoặc sửa. Admin cũng đăng được từ Studio (`teamSession`) |

Cùng một bản nháp mở ra form khác nhau tùy chỗ bấm:
- Bảng điều khiển mở nháp bằng **wizard** (`studio/dashboard.tsx:153,205`).
- Danh sách tin mở nháp bằng **editor** (`studio/events.tsx:128,146`).

**Hiện trạng: form cộng đồng đã mất UI**
- API vẫn đủ: `POST /community/events` (`routes/community.ts:58`, chỉ cần số điện thoại đã xác nhận, không cần vai nghề), prefill từ link hoặc poster (`community.ts:138,159`, `services/prefill.ts`), `GET /me/submissions` (`community.ts:252`).
- Có test API: `test/community.test.ts`, `submissions.test.ts`.
- `docs/CURRENT_ARCHITECTURE.md:79` vẫn ghi "web and app 'Gửi sự kiện'", nhưng **không màn Kính đêm nào gọi tới**. Màn cũ bị xoá ngày 2026-10-09 và không có màn thay thế.
- Nút "Đăng sự kiện" giờ luôn dẫn tới `/studio/new` (`ui/post-kind.tsx:12`).

**Đề xuất**
1. **"Đăng sự kiện" → Sự kiện:**
   - NTC: vào wizard như hiện nay.
   - Người chưa là NTC, gồm fan và nghệ sĩ: vào form cộng đồng rút gọn (link sự kiện, tên, ngày, địa điểm, giá), có nút "Dán link hoặc ảnh poster" để prefill, kèm danh sách "Sự kiện tôi đã gửi".
   - Đưa prefill vào wizard luôn.
2. **Một form sự kiện cho Studio:** wizard là chế độ "lần đầu" của editor, các bước thu gọn. Mọi lối vào nháp mở cùng một chỗ.
3. Về lâu dài, form Console và form Studio dùng chung các field: `missingForSubmit` và điểm chất lượng hiện được tính lại ở 3 nơi.

**Rủi ro.** Thấp với form cộng đồng, vì API có sẵn. Trung bình với việc gộp wizard và editor, vì đụng nhiều e2e (`studio.spec.ts`, `studio-events.spec.ts`).

### 3.7 Các hàng chờ duyệt của Console

**Hiện trạng: 10 nơi chờ quyết định**

| Hàng chờ | Màn | Nhóm rail | Đếm trên rail? |
|---|---|---|---|
| Tin đăng, kể cả import và khiếu nại | `/console` (khiếu nại là bộ lọc) | Việc cần làm | Có |
| Yêu cầu nhận (sự kiện, hồ sơ) | `/console/claims` | Việc cần làm | Có |
| Báo cáo tin đăng và ảnh | `/console/reports` | Việc cần làm | Có, **thiếu** bài thảo luận và bình luận mix (`platform.ts:28-30`) |
| Góp ý | `/console/feedback` | Việc cần làm | Không |
| Xác minh NTC | `/console/verification` hoặc drawer NTC | Danh mục | Có, nhưng **đếm mọi NTC chưa xác minh** (`platform.ts:27`), trong khi Tổng quan chỉ đếm `pending` (`routes/admin/ops.ts:182`) |
| Địa điểm chưa ghim | `/console/venues?tab=unresolved` | Danh mục | Có |
| Thiết bị nghệ sĩ gợi ý | `/console/artists?tab=gear` | Danh mục | Không |
| Dự án | `/console/projects` | Đối tác | Có |
| Quảng cáo | `/console/featured` | Nền tảng | Một nửa (3.4) |
| Tin nhắn NTC | Không có | | (3.2) |

Thêm nữa, báo cáo trên Tổng quan chỉ đếm báo cáo tin đăng (`ops.ts:180`), còn rail cộng cả ảnh. **Cùng một nhãn cho ra hai con số khác nhau.**

**Hai chỗ xác minh NTC chồng lên nhau.** Drawer NTC có mục xác minh (`console/organizers/drawer.tsx:3`), và `/console/verification` có xác minh, thu hồi, gắn cờ (`console/verification.tsx:3`).

**Đề xuất**
1. **Bước 1, nhỏ:**
   - Chuyển Xác minh, Dự án, Quảng cáo, Thiết bị và Địa điểm chưa ghim vào nhóm "Việc cần làm".
   - `/admin/counts` đếm đủ mọi loại, gồm `boost_requests` mở, báo cáo bài và mix, góp ý mới, thiết bị chờ và thread có `admin_unread`.
   - Rail và Tổng quan dùng chung một nguồn số.
2. **Bước 2:** gộp Tổng quan và Số liệu.
   - Hiện cả hai đều có ô số và đuôi nhật ký (`overview.tsx:152`, `insights.tsx:3-6`).
   - "Số liệu" trở thành một phần của Tổng quan. Đuôi nhật ký chỉ còn ở Nhật ký.
3. **Bước 3, tuỳ chọn:** một màn "Hàng chờ" có tab theo loại. Mỗi loại giữ khung chi tiết riêng, và hàng chờ tin đăng giữ SLA, nút hàng loạt, phím tắt.

**Nên giữ riêng**
- Yêu cầu nhận (quyền sở hữu) và xác minh (giấy tờ).
- Báo cáo (lạm dụng) và góp ý (lỗi sản phẩm).
Mỗi cặp có quy trình khác nhau, chỉ cần nằm cạnh nhau.

**Rủi ro.** Bước 1 thấp, bước 3 trung bình.

### 3.8 Recap, khoảnh khắc, tường ảnh, live

**Hiện trạng**
- **Recap** (`/app/recap`): sao, điều nổi bật, tối đa 3 ảnh, tải lên với `purpose=recap` (`kd/app/recap.tsx:71-79`).
  - Ảnh recap **chỉ người tải lên xem được lại** (`routes/event-actions.ts:126-160`).
  - Tường ảnh lấy ảnh từ bài thảo luận, không lấy từ recap (`routes/night.ts:144-151`).
  - Không có link nào dẫn tới recap (1.2).
- **Bài thảo luận "kỷ niệm" có ảnh** (`web/event/community.tsx:196-212`, cũng `purpose=recap`) là nguồn duy nhất của tường ảnh.
- **Khoảnh khắc:** 9 ảnh dạng link trên hồ sơ (`kd/moments.tsx`).

**Đề xuất**
1. Ảnh recap thành bài "kỷ niệm" trên tường ảnh. Có thể hỏi "chia sẻ công khai?" lúc gửi, hoặc ghi `event_posts` cùng lúc với `recaps`.
2. Recap có lối vào thật:
   - tab "Đã qua" ở `/app/tickets`;
   - một khối "Đêm qua thế nào?" trên `/e` sau khi sự kiện kết thúc, chỉ hiện với người đã check-in;
   - một thông báo `screen:'recap'` sau đêm.
3. Live (trong đêm) giữ nguyên là màn riêng.
4. Trên `/e` có khối "Đêm của bạn" đổi theo giai đoạn: trước đêm là kế hoạch, hướng dẫn, đặt xe; trong đêm là live; sau đêm là recap và ảnh.

**Nên giữ riêng.** Khoảnh khắc là hồ sơ tự chọn ảnh. Có thể thêm "ghim ảnh từ tường ảnh của sự kiện vào khoảnh khắc".

**Rủi ro.** Thấp.

### 3.9 Kế hoạch và hướng dẫn AI

**Hiện trạng**
- `/app/plan`: nhóm bạn, điểm hẹn, chia tiền bằng VietQR, chat. Bạn bè **chỉ đến từ việc đồng bộ Facebook hoặc Instagram** (`services/friends.ts:8-27`, gọi ở `routes/auth.ts:371,386`). Sign-in ưu tiên Google, nên với đa số tài khoản danh sách bạn bè trống, kéo theo lời mời, chat, "bạn bè ở đây" trong live và "bạn bè" trong recap đều trống.
- `/app/guide`: AI gợi ý ăn, chơi, mặc gì.
- Cả hai chỉ có một dòng ở `/app/e`.

**Đề xuất.** Giữ hai chức năng riêng, vì nội dung khác hẳn nhau. Nhưng:
- đưa cả hai lên `/e` (3.1), gom dưới "Chuẩn bị cho đêm" cùng Đặt xe, Chỉ đường, Thêm lịch;
- cho kế hoạch một cách mời không cần bạn bè, ví dụ link mời. Nếu không, nên ẩn "Đi cùng bạn bè" khi `friends=0`.

### 3.10 Studio: người tham dự, khách mời, mã giảm giá

**Hiện trạng: hai cơ chế khách mời chạy song song**
1. Bảng `guest_list`: tên, số ghế, check-in bằng công tắc tay. Quản lý ở `/studio/promos` (`kd/studio/promos.tsx:35-100`, `routes/organizer/money.ts:74-106`). Màn check-in đếm số ghế đã vào (`routes/organizer/door.ts:306`), nhưng **danh sách Người tham dự không hiện họ**.
2. Vé loại `kind='guest'` (`003_commerce.sql:64`) có nhánh hiển thị "Khách mời" trong Người tham dự (`routes/organizer/audience.ts:134-139`), check-in và resale. Nhưng **không chỗ nào tạo ra vé loại này**: lệnh `insert into tickets` duy nhất là `services/tickets.ts:59`.

**Đề xuất**
1. Khách mời chuyển sang `/studio/attendees`, với nút "+ Thêm khách mời". Có thể cấp QR bằng cách tạo vé loại `guest`, để nhánh code đang chết có việc làm.
2. Mã giảm giá chuyển vào phần "Vé & vào cửa" của editor, vì nó thuộc về giá.
3. `/studio/promos` redirect về một trong hai chỗ trên.

**Rủi ro.** Thấp đến trung bình. Cần migration chuyển `guest_list` thành vé, nếu chọn cấp QR.

### 3.11 Đối tác vé và tiếp thị liên kết

**Hiện trạng: hai đường đối soát cho cùng `partner_conversions`**
- `/console/partners` đổi trạng thái từng đơn, trong đó có `paid` (`routes/admin/partners.ts:166-177`; `services/partners.ts:25`).
- `/console/affiliate` gom các đơn `approved` trong một kỳ thành phiếu chi trả, rồi đánh `paid` (`routes/admin/affiliate.ts:165-219`).

Một đơn đã đánh `paid` lẻ ở màn Đối tác sẽ không bao giờ vào phiếu kỳ nào, và **sổ sách lệch**.

Phần "nợ của từng đối tác" có ở cả hai màn. Demo không có dữ liệu cho cả hai màn (`ia-03`), nên chưa ai thử bằng mắt.

**Đề xuất.** Gộp thành một màn "Đối tác vé" với các tab: Đối tác, Liên kết, Đối soát.
- Màn Đối tác chỉ cho duyệt hoặc từ chối đơn.
- `paid` chỉ đến từ phiếu chi trả.
- `/console/affiliate` redirect về tab.

**Rủi ro.** Thấp.

### 3.12 `/stats/*` và `/list`

**Hiện trạng.** `/stats/free` và `/stats/weekend` là danh sách lọc theo "miễn phí" và "cuối tuần", tức là bản sao của `/list` với bộ lọc tương ứng. Chỉ `/stats/venues` có link từ trang chủ (`home/browser.tsx:254`).

**Đề xuất**
- `/stats/free` → `/list?free=1`.
- `/stats/weekend` → `/list?time=weekend`.
- `/stats/venues` thành kiểu xem "Địa điểm" của `/list`.

Hiện cả ba được đánh `noindex` (`app/(kd)/stats/[key]/page.tsx`), nên gần như không mất SEO.

**Rủi ro.** Thấp. Cần sửa `e2e/next/stats.spec.ts`.

### 3.13 Các bộ thành phần back-office

**Hiện trạng**
- Studio nghệ sĩ dùng `console/kit.tsx`: `PageHead`, `Body`, `Loaded`, `Empty`, `Drawer` (`artist/*.tsx`).
- Studio có bộ riêng: `Page`, `Kpi`, `Block`, `NeedEvent` (`studio/parts.tsx:13-47`) và `StudioHead` (`studio/head.tsx:19`).

**Các bản trùng**

| Thứ trùng | Các bản |
|---|---|
| `Block` | `studio/parts.tsx:34` và `artist/parts.tsx:12`, gần như y hệt |
| Ô số | `Kpi` (`studio/parts.tsx:21`), `Tile` (`console/orders/parts.tsx:33`), `Tile` (`overview.tsx:35`), `StatFilter` (`console/organizers/parts.tsx:44`), `Stat` (`ui/parts.tsx:79`) |
| Hằng số tiền tệ | `CHECKOUT` (`studio/parts.tsx:11`) và `CHECKOUT_CURRENCY` (`console/orders/parts.tsx:12`) |
| Hàm `ago()` | `console/kit.tsx:113` và `web/event/community.tsx` (app inbox dùng bản này) |
| Bảng màu trạng thái | `statusTone` (`studio/head.tsx:17`), `STATUS_TONE` (`console/orders/parts.tsx:15`), `statusOf` (`artist/parts.tsx:49`), `STATUS_TONE` (`web/projects/manage.tsx:29`) |
| Badge trạng thái | `Pill` chỉ bọc lại `Status` (`console/kit.tsx:238`) |

**Đề xuất**
1. Chuyển `console/kit.tsx` thành `ui/backoffice.tsx`, dùng cho cả ba back-office. Studio bỏ `Page` và `Block` riêng, giữ `StudioHead` vì phần chọn sự kiện là của riêng Studio.
2. Một hàm `tone(status)` chung.

**Nên giữ riêng.** `ui/shell.tsx` (khung: `SideNav`, `Table`, `TabBar`) là lớp dưới, nên giữ tách.

**Rủi ro.** Thấp, chỉ là refactor.

---

## 4. Phần thừa

| # | Thứ gì | Bằng chứng | Đề xuất |
|---|---|---|---|
| 4.1 | `/app/hyped`, `/app/following` | Không có link nào. Chỉ e2e mở bằng URL (`app-more.spec.ts:100,103`) | 3.3 |
| 4.2 | `/app/recap` | Không có link. Không thông báo nào có `screen:'recap'` (đã tìm khắp `festfinder-backend/src`) | 3.8 |
| 4.3 | Liên kết của thông báo kế hoạch | `planId` không có `eventId` → rơi về `/app` (`plans.ts:125…`, `inbox.tsx:47-59`) | 3.2 |
| 4.4 | `/app/chat` và bạn bè | Không có danh sách chat. Bạn bè chỉ đến từ Facebook hoặc Instagram (`services/friends.ts:8`) | Ẩn khi không có bạn bè, hoặc thêm lời mời bằng link |
| 4.5 | Kệ nổi bật (`GET /shelves`) | Không màn nào gọi. Kệ demo còn nội dung không phải EDM | 3.4 |
| 4.6 | Vị trí quảng cáo `feed`, `live` | Có giá, có chiến dịch, không render (`lib/ads.ts:32`, `home/page.tsx:29`) | 3.4 |
| 4.7 | Form cộng đồng và prefill | API và test còn, UI không còn (`community.ts:58,138,159,252`) | 3.6 |
| 4.8 | Vé loại `guest` | Có nhánh hiển thị, không có code tạo | 3.10 |
| 4.9 | Chủ đề thread `partnerships`, `support` | Có trong `005_operations.sql:24`, không chỗ nào tạo | Bỏ, hoặc mở từ Studio |
| 4.10 | `/stats/free`, `/stats/weekend` | Chỉ tới được từ chip của chính `/stats` | 3.12 |
| 4.11 | Route chỉ để redirect | `/console/ads`, `/console/appeals`, `/console/{orders,organizers,users}/[id]`, `/studio/event/[id]` | Giữ cho link cũ, chi phí thấp. Đặt hạn xoá trong roadmap |
| 4.12 | Chú thích cũ, sai sự thật | `artist/root.tsx:5` ("Studio when the account also organises": không còn, vì mỗi tài khoản một vai nghề), `studio/gigs.tsx:4` ("booking requests sent from artist profiles"), `docs/CURRENT_ARCHITECTURE.md:79` ("Gửi sự kiện") | Sửa |
| 4.13 | Màn không có dữ liệu demo | `/console/brands`, `/console/partners`, `/console/affiliate` (links và payouts), `/studio/gigs` (`/gigs` trả 0): `ia-03` | Thêm dữ liệu vào `test/fixtures/seed.ts` để người kiểm thử thấy được. Cân nhắc ẩn cho tới khi có hợp đồng đối tác đầu tiên (roadmap dòng 52 và 121 vẫn chưa xong) |
| 4.14 | `/studio/promos` như một màn riêng | Hai nửa của nó thuộc về chỗ khác | 3.10 |

---

## 5. Tính nhất quán

**Cách mở để sửa (drawer hay trang)**
- Console dùng drawer cho NTC, tài khoản, đơn hàng, địa điểm, nguồn, góp ý, dự án, thương hiệu, đối tác, affiliate. Riêng sự kiện là trang đầy đủ.
- Studio dùng trang (editor) và form ngay trên trang (gigs, mã giảm giá, gửi tin). Drawer chỉ có ở `studio/ads.tsx`.
- Studio nghệ sĩ dùng drawer cho mix, nhưng sheet cho thư ứng tuyển (`artist/opportunities.tsx`, `artist/gigs.tsx`).
- Đề xuất quy tắc: **thực thể nhỏ thì drawer bên phải; thực thể có hơn 3 phần (sự kiện, hồ sơ) thì trang riêng**.

**Tiêu đề và khoảng lề**
- Console và Studio nghệ sĩ: `PageHead` cỡ `kd-d3`, lề theo `--kd-gutter` (`console/kit.tsx:134`).
- Studio: `h1` cỡ `kd-d2` (`studio/events.tsx:99`, `inbox.tsx:59`, `gigs.tsx:58`), lề `clamp(20px,3vw,32px)` (`studio/parts.tsx:14`).
- Ba back-office được mô tả là một hệ thống nhưng nhìn khác nhau.

**Trạng thái rỗng và đang tải**
- Console và nghệ sĩ: `Empty`, `Loaded`.
- Studio: chỉ `studio/events.tsx` dùng `Empty`. Chỗ khác dùng Panel tự viết và `kd-skel`.

**Xác nhận**
- `AskHost` được dùng chung, trừ `studio/attendees.tsx:103`, nơi hoàn tiền dùng `window.confirm` gốc của trình duyệt.

**Nút Back**
- App có `BackLink` (mới, quay về trang trước nếu cùng site). Wizard Studio dùng `goBack`.
- Console dùng link cố định. Trang web dùng breadcrumb (`Crumbs`, `chrome.tsx:261`).
- Nên dùng `BackLink` ở mọi màn chi tiết.

**Cách hiện trạng thái.** Có 4 bảng màu riêng (3.13). Từ ngữ cũng khác nhau:
- NTC: "Đang chờ duyệt".
- Console: "Đang chờ".
- Nhãn vai: "Chờ duyệt".
- Dự án: `in_review` với tông `warn`.
Nên dùng một từ điển trạng thái chung.

**Từ ngữ**
- "Đẩy tin" và "Quảng cáo" (3.4).
- "Thông báo" mang 4 nghĩa (2.2).
- "Người tham dự" mang 2 nghĩa (2.2).
- "Chiến dịch" mang 2 nghĩa (3.4).
- "Gig & booking" và "Lịch diễn & booking".
- "Hồ sơ công khai" và "trang công khai".
- "Studio" là tên hai workspace, nhưng đầu rail nghệ sĩ lại ghi "Nghệ sĩ".
- Đề xuất: "Studio" cho NTC, "Studio nghệ sĩ" cho nghệ sĩ, ở mọi nơi.

**Ngôn ngữ**
- Back-office chỉ đọc khoá `ff_lang` (`studio/root.tsx:78`, `console/root.tsx:51`), không có công tắc ngôn ngữ.
- Muốn đổi sang tiếng Anh, người dùng phải ra footer web hoặc phần cài đặt của app.
- Nên thêm công tắc ở chân rail.

**Vị trí đăng xuất và đổi vai.** Xem 2.2. Đề xuất chân rail giống nhau ở cả ba back-office: [Trang công khai] · Người tham dự (đổi tên thành "Về trang khám phá" cho khỏi trùng) · Đổi vai · Ngôn ngữ · Đăng xuất.

**Ngoài phạm vi IA nhưng cần báo**
- `PATCH /admin/users/:id` cấp quyền admin cho bất kỳ tài khoản nào (`routes/admin/ops.ts:924-940`, màn `/console/users`).
- Điều này mâu thuẫn với quy tắc trong `CLAUDE.md`: "never add a route, role choice or shared password that grants it".
- Chú thích nói danh sách cho phép (allowlist) sẽ quyết định lại mỗi lần khởi động. Dù vậy, giữa hai lần khởi động, quyền admin vẫn được cấp qua UI.
- Người kiểm thử vai admin và chủ sản phẩm nên xem.

---

## 6. Lộ trình gợi ý, từ rẻ tới đắt

1. **Sửa trong ngày, chỉ UI và một tham số:**
   - Liên kết `planId` của thông báo kế hoạch.
   - Đổi tên trùng: "Người tham dự", "Thông báo", "Chiến dịch thương hiệu" thành "Tài trợ nghệ sĩ", "Đẩy tin" thành "Quảng cáo".
   - Thêm "xem tất cả" từ `FollowingSection` tới `/app/following`.
   - Thêm lối vào recap.
   - Thêm chuông thông báo trên nav web.
2. **Trong tuần:**
   - `/admin/counts` đếm đủ mọi loại, rail và Tổng quan dùng chung số.
   - Ngừng bán `feed`, `live` và "mục Đang hot", hoặc render chúng.
   - Gộp đường đối soát đối tác.
   - Khôi phục form cộng đồng.
   - Chuyển khách mời về Người tham dự.
3. **Trong một sprint:**
   - Gộp web và app cho fan: Đã lưu, Hồ sơ, rồi trang sự kiện, rồi Khám phá và Bản đồ.
   - Một trung tâm thông báo và một trang cài đặt thông báo.
   - Gộp wizard và editor.
   - Bộ thành phần back-office chung.
4. **Sau đó:**
   - Một hàng chờ có tab trong Console.
   - Mô hình vị trí quảng cáo có ngày.
   - Danh sách đề nghị chung cho nghệ sĩ.
   - Gộp hype và lưu, nếu chủ sản phẩm đồng ý.

---

## Phụ lục: kết quả chạy trình duyệt

`ia-01` (desktop 1440, fan đăng nhập):
```
/app/tickets
  Chính: Khám phá→/ | Sự kiện→/list | Nghệ sĩ→/a | Dòng nhạc
  Điều hướng chính: Khám phá→/app | Bản đồ→/app/list | Đã lưu→/app/saved | Vé→/app/tickets | Tôi→/app/profile
MENU Người tham dự | Thêm vai nghề | Hồ sơ của tôi→/profile | Dự án của tôi→/p/mine | Vé của tôi→/app/tickets | Đã lưu→/saved | Đăng xuất
```
Ảnh chụp: `scratchpad/ux/shots/ia-desk-app-tickets-menu.png`.

`ia-02` (điện thoại 390):
```
/app          HEADER: TP.HCM | Tìm kiếm | Thông báo→/app/notifications ; NAV: Khám phá→/app | Bản đồ | Đã lưu | Vé | Tôi
/app/profile  HEADER: Cài đặt→#settings (không có lối tới /a, /p, /studio, /about)
/ (menu)      Khám phá→/ | Sự kiện→/list | Nghệ sĩ→/a | chip dòng nhạc | Đăng sự kiện (không có chuông)
```

`ia-03` (admin):
```
/admin/counts {"queue":8,"verification":6,"reports":4,"ads":5,...}
/admin/shelves items=3   /shelves items=0   /admin/boosts items=0
/ads?placement=feed → có chiến dịch "Zenkai Energy"   /ads?placement=live → có "Hydra Salts"   (không màn nào hiển thị)
/admin/brand-campaigns 0 · /admin/partners 0 · /admin/affiliate/links 0 · /gigs 0
```
