# Tech lead review: đưa FeestFinder lên mức enterprise về vận hành và trải nghiệm

- Ngày: 2026-10-16 · Người viết: tech lead (review) · Đầu vào: `docs/HANDOFF_2026-10-16_ux-audit.md`, 5 báo cáo trong `docs/ux-audit-2026-10-16/`, mã nguồn ở `main` `01bd8da` cộng thay đổi chưa commit, CI `.github/workflows/ci.yml`, `docs/CURRENT_ARCHITECTURE.md`, `docs/TECH_DEBT.md`.
- Phạm vi: (1) đánh giá plan UX đã viết, (2) chấm mức trưởng thành vận hành và trải nghiệm hiện tại, (3) action plan theo giai đoạn, có tiêu chí đo.
- "Enterprise" ở đây hiểu là: **người dùng làm xong việc mà không cần ai chỉ**, **đội vận hành biết trước khi khách hàng báo**, **thay đổi nào cũng có đường lùi**, và **mọi quyết định có số liệu**.

---

## 1. Kết luận ngắn

Sản phẩm có nền kỹ thuật tốt hơn phần lớn startup cùng giai đoạn: kiểm thử rộng (38 file test API chạy trên cả PGlite lẫn Postgres thật, 211 test trình duyệt), tài liệu kiến trúc đầy đủ, quy tắc rõ trong `CLAUDE.md`, CSP, rate limit, audit log có chuỗi hash, hàng chờ kiểm duyệt rất tốt. **Điểm yếu không nằm ở từng màn hình mà ở ba chỗ hệ thống:**

1. **Sản phẩm bị tách đôi** (web và `/app` cho fan; wizard và editor cho nhà tổ chức; 10 hàng chờ cho admin). Mỗi bản thiếu thứ bản kia có. Đây là nguồn của phần lớn 150 phát hiện.
2. **Có lỗi đang làm mất tiền và lòng tin ngay hôm nay:** thu phí 5% dù hứa không thu; sửa một chữ trên tin đang bán vé là trang thành 404; admin cấp được quyền admin; hai tài khoản mới là ẩn được một tin đang đăng.
3. **Vận hành chưa có "mắt":** không giám sát uptime, không cảnh báo, báo lỗi chưa bật, deploy production không chờ CI, migration chạy lúc boot không có đường lùi, chưa diễn tập khôi phục dữ liệu, chưa có analytics nên không đo được gì.

Plan UX hiện tại đúng về chẩn đoán và đủ chi tiết để code, nhưng **thiếu mục tiêu đo được, ước lượng lạc quan, và không có track vận hành**. Phần dưới sửa ba thiếu sót đó.

---

## 2. Review plan `HANDOFF_2026-10-16_ux-audit.md`

### 2.1 Đúng và nên giữ

- Chẩn đoán đúng ba vấn đề hệ thống ở trên; W1 (một sản phẩm cho fan), W3 (một hộp việc cho admin) và W5.2 (một form sự kiện) là ba thay đổi có đòn bẩy lớn nhất.
- W0 liệt kê lỗi kèm `file:line`, cách sửa và test. Đó là định dạng đúng để giao cho agent.
- 12 quyết định sản phẩm được tách riêng với mặc định. Tốt: không để agent tự quyết việc của chủ sản phẩm.
- W9 (một họ chữ) đã làm xong, có test chứng minh.

### 2.2 Thiếu và cần sửa trước khi thực hiện

| # | Thiếu gì | Hệ quả nếu không sửa | Sửa thế nào |
| --- | --- | --- | --- |
| R1 | **Không có mục tiêu đo được.** Plan nói "sửa ✗ thành ✓" nhưng không nói fan mua vé nhanh hơn bao nhiêu, admin dọn việc nhanh hơn bao nhiêu. | Không biết khi nào xong, không biết có đáng không. | Mỗi workstream gắn 1–2 KPI ở mục 4; đo trước và sau. |
| R2 | **Không đo được vì analytics chưa bật.** W1 bước 3 nói "đo `FF.track` trước", nhưng `FF.track` không gửi gì khi chưa có `POSTHOG_KEY`. | W1 không có cơ sở để quyết. | Bật PostHog (hoặc tương đương) là việc đầu tiên của giai đoạn 0. |
| R3 | **Ước lượng W0 "1–2 ngày" cho 24 dòng là sai.** Riêng 0.3 (bản sửa chờ duyệt) là một tính năng: migration, logic áp bản sửa, UI chênh lệch trong Console, test. Khoảng 3–5 ngày. 0.2 (xem dưới) và 0.11 (gộp báo cáo) cũng 1–2 ngày mỗi cái. | Trượt lịch ngay tuần đầu, mất niềm tin vào plan. | Tách W0 thành W0a (sửa trong ngày, 15 dòng) và W0b (tính năng nhỏ, 5 dòng: 0.2, 0.3, 0.11, 0.16, 0.18). Xem mục 5. |
| R4 | **Không có track vận hành.** Plan chỉ nói về màn hình. | Lên "enterprise" về UX mà không có giám sát thì mỗi lỗi mới vẫn do khách hàng phát hiện. | Thêm workstream OPS (mục 5, giai đoạn 0 và 1). |
| R5 | **Thiếu phụ thuộc giữa các workstream.** W3, W6 trên điện thoại đều cần W7.1 (rail thành thanh tab) làm trước; W2 (chuông) cần API `scope=all` trước khi làm UI ở 4 khung. | Làm song song thì xung đột, làm lại. | Thứ tự ở mục 5 đã xếp theo phụ thuộc. |
| R6 | **Không có chiến lược rollout cho W1.** Redirect 308 `/app/e` → `/e` là thay đổi một chiều với người đã cài PWA. | Nếu sai, không lùi được nhanh. | Mỗi bước W1 sau một cờ tính năng (`FF_WEB_FIRST=saved,profile,event,explore`), bật dần, giữ 2 tuần rồi mới xoá route cũ. |
| R7 | **Không có tiêu chí hoàn thành (DoD) chung.** | Mỗi PR một chuẩn. | DoD ở mục 6. |
| R8 | **Không có kiểm thử trên thiết bị thật.** Hai lỗi chỉ hiện trên iPhone Safari (camera check-in không có `BarcodeDetector`; ô ngày hiện `mm/dd/yyyy`). Playwright headless không bắt được. | Lỗi lọt sau khi "test xanh". | Một checklist tay 15 phút trên iPhone và Android thật trước mỗi release có đụng điện thoại (mục 6). |
| R9 | **Hai quyết định mang tính chiến lược bị trộn vào sprint UX:** D3 (gộp Hype vào Lưu, đổi ý nghĩa mục tiêu hype của NTC) và D9 (hồ sơ nghệ sĩ không lên thư mục khi chưa có show). | Tranh cãi sản phẩm làm chậm sửa lỗi. | Tách ra khỏi giai đoạn 0–1; quyết sau khi có số liệu. |
| R10 | **W8 trộn việc nhỏ với việc có hệ quả dữ liệu** (ảnh recap thành bài công khai, kế hoạch mời bằng link). | Dễ làm vội. | Hai việc đó chuyển sang giai đoạn 3 với thiết kế riêng về quyền riêng tư. |

### 2.3 Thứ tự ưu tiên trong W0 cần đảo

Plan xếp 0.1 (cấp admin) và 0.3 (404 khi sửa tin) trước. Đúng, nhưng theo tiêu chí **tiền và lòng tin** thì thứ tự là:

1. **0.7 Phí 5% dù hứa không thu.** Đang thu tiền sai với lời hứa trên trang, ngay hôm nay, với mọi đơn.
2. **0.1 Cấp admin.** Lỗ hổng quyền; chưa có bằng chứng bị lợi dụng nhưng không được để.
3. **0.3 404 khi sửa tin đang bán.** Mất doanh thu của NTC trong lúc chờ duyệt. Có cách sửa tạm trong ngày (mục 5, giai đoạn 0).
4. **0.11 + D8 Báo cáo:** hai tài khoản mới là ẩn được tin; cảnh cáo tính sai có thể tạm dừng nhầm NTC.
5. **0.18 Đối soát đối tác hai đường:** sổ sách lệch tiền.

---

## 3. Bảng điểm trưởng thành (hiện tại → mục tiêu)

Thang 1–5: 1 chưa có · 2 có nhưng tay · 3 có quy trình · 4 đo được và tự động · 5 tự cải thiện. "Bằng chứng" là thứ đã kiểm trong repo.

### 3.1 Vận hành

| Lĩnh vực | Nay | Mục tiêu 90 ngày | Bằng chứng và khoảng trống |
| --- | --- | --- | --- |
| Kiểm thử tự động | 4 | 4 | 38 file test API chạy trên PGlite và Postgres 18 thật; 211 test Playwright; typecheck bật `noUnusedLocals`. Thiếu: test theo hành trình người dùng (mục 6), test ở 390px cho back office, một test đã chập chờn ("Lưu sự kiện"). |
| Release và deploy | 2 | 4 | Push `main` = deploy production trên 2 project Vercel; CI chạy **song song**, không chặn. Rollback web bằng Instant Rollback (tay). Không có changelog, không có nhãn release gắn với deploy (`RELEASE` đọc từ env, mặc định `'dev'` ở `config.ts:267`; chưa thấy đặt trên Vercel). Thiếu: deploy chỉ sau khi CI xanh; smoke test sau deploy tự động. |
| Migration | 2 | 3 | Chạy lúc boot (`bootstrap.ts:29`), có chặn migration chưa release từ laptop. Không có đường lùi schema, không có quy ước "expand → migrate → contract" cho thay đổi phá vỡ. Hai instance boot cùng lúc thì an toàn: `migrate.ts:49` lấy `pg_advisory_xact_lock` trước mỗi migration. |
| Giám sát và cảnh báo | 1 | 4 | Có `/health` (DB, storage, proxy). Không có uptime check, không cảnh báo, không SLO. Báo lỗi (`SentryReporter`) chỉ chạy khi có `SENTRY_DSN`; `bootstrap.ts:85` ghi log "what still needs a real provider", tức chưa bật. |
| Log và truy vết | 2 | 3 | Log dạng text qua `ctx.log`. Chưa thấy request id xuyên suốt web proxy → API → job. Audit log cho hành động của đội thì tốt (chuỗi hash, CSV). |
| Job nền | 3 | 4 | Một bảng job trong `jobs.ts`, pg_cron gọi mỗi phút qua proxy. Thiếu: cảnh báo khi một job lỗi liên tiếp, bảng theo dõi lần chạy cuối của từng job (Radar có `ingest_runs`, các job khác chưa). |
| Sao lưu và khôi phục | 2 | 3 | Dựa vào Supabase; `030_9_backup_before_edm.sql` là sao lưu thủ công trước một migration. Chưa có diễn tập khôi phục, chưa ghi RPO/RTO. |
| Bảo mật | 3 | 4 | Tốt: CSP, helmet, rate limit theo route, admin chỉ từ allowlist qua Google, không fallback DB, prod/staging từ chối nhãn của nhau. Lỗ hổng: `PATCH /admin/users/:id` cấp admin; impersonation hỏng và kẹt phiên; ngưỡng ẩn tin do báo cáo quá thấp. Thiếu: quét dependency trong CI (Dependabot hoặc `npm audit`), quy trình review bảo mật cho route admin mới. |
| Analytics sản phẩm | 1 | 3 | `FF.track` có danh sách sự kiện và thuộc tính được phép (tốt về riêng tư), nhưng không gửi đi khi chưa có `POSTHOG_KEY`. Không có funnel nào được định nghĩa. |
| Tài liệu và quy tắc | 4 | 4 | `CLAUDE.md`, kiến trúc, roadmap có nhật ký quyết định, skill cho agent. Thiếu: runbook sự cố, sổ tay vận hành cho đội (dọn việc buổi sáng, xử lý báo cáo, hoàn tiền). |
| Hỗ trợ khách hàng | 2 | 3 | Có widget góp ý, hộp thư NTC. Thiếu: trả lời góp ý từ Console, SLA phản hồi được theo dõi, câu "phản hồi trong 2 giờ" đang hứa mà không ai được báo. |

### 3.2 Trải nghiệm

| Lĩnh vực | Nay | Mục tiêu 90 ngày | Bằng chứng và khoảng trống |
| --- | --- | --- | --- |
| Hệ thống thiết kế | 3 | 4 | Token trong `theme.css`, bộ `kd-*`, `/kit` hiển thị mọi phần, một họ chữ. Nhưng 3 back office có 3 bộ thành phần, 4 bảng màu trạng thái, 2 cỡ tiêu đề trang. Chưa có từ điển tên gọi được tuân thủ. |
| Luồng người dùng | 2 | 4 | Mỗi vai đều hoàn thành được việc chính, nhưng với ✗ ở hầu hết bước (mục 3 của plan). Không luồng nào được định nghĩa là "hành trình chuẩn" để bảo vệ bằng test. |
| Điện thoại | 2 | 4 | Web fan tốt. Cả ba back office hỏng ở 390px (rail, bảng, không đăng xuất). Hai lỗi chỉ có trên iOS. |
| Tiếp cận (a11y) | 3 | 4 | 1.138 thuộc tính `aria-*`/`role` trong `kd/`, `prefers-reduced-motion`, focus ring, trạng thái không chỉ bằng màu. Thiếu: `<html lang="vi">` cố định kể cả trên `/en` (`app/(kd)/layout.tsx:33`; trình đọc màn hình đọc tiếng Anh bằng giọng Việt), sheet mở không đưa focus vào ô nhập, chưa có kiểm tra a11y tự động (axe) trong e2e. |
| Hiệu năng | 3 | 4 | Font tải theo bộ ký tự, bản đồ tự host, cache `/ui` có version. Chưa có ngân sách hiệu năng (LCP, bundle) trong CI; chưa đo Web Vitals thật. |
| Nội dung và ngôn ngữ | 3 | 4 | Song ngữ đầy đủ ở web. Console còn nhãn tiếng Anh, thông báo lẫn tiếng Anh, 4 nghĩa cho "Thông báo", 5 tên cho quảng cáo. |
| Niềm tin | 2 | 4 | Lời hứa "không thu phí" bị checkout phá; tin đang bán biến mất khi sửa; nhận hồ sơ im lặng. Đây là mục tụt điểm nhiều nhất so với kỹ thuật. |

---

## 4. Mục tiêu đo được (KPI) cho từng vai

Đo trước (tuần 1, sau khi bật analytics) và sau mỗi giai đoạn. Tất cả tên sự kiện phải nằm trong `CLIENT_EVENTS`, thuộc tính trong `ALLOWED_PROPS` (`services/analytics.ts`); không bao giờ gửi email, tên hay IP.

| Vai | KPI | Cách đo | Mục tiêu 90 ngày |
| --- | --- | --- | --- |
| Fan | Tỷ lệ từ trang sự kiện → thanh toán xong | `event_view` → `checkout_start` → `order_paid` | +25% so với mốc |
| Fan | Thời gian từ `/e` tới thanh toán xong (median) | timestamp giữa hai sự kiện | < 90 giây trên điện thoại |
| Fan | Tỷ lệ hoàn tất đăng ký bằng email | `signup_start` → `signup_done` | > 70% (D7) |
| Fan | Tỷ lệ bấm "Mua vé" khi chưa đăng nhập rồi bỏ | `checkout_start` không có `order_paid` trong 15 phút, phân theo trạng thái đăng nhập | giảm một nửa |
| NTC | Thời gian từ tạo tài khoản → gửi duyệt tin đầu tiên | `org_created` → `listing_submitted` | < 20 phút median |
| NTC | Tỷ lệ tin bị trả lại vì thiếu địa chỉ hoặc ảnh | lý do trả lại trong hàng chờ | giảm một nửa |
| NTC | Số tin đang bán bị ẩn vì sửa | đếm `in_review` từ `live` | 0 sau W0b |
| Nghệ sĩ | Tỷ lệ yêu cầu nhận hồ sơ có bằng chứng | trường `proofUrl` khác null | > 80% |
| Nghệ sĩ | Booking được chốt có liên hệ hai chiều | `accepted` kèm `contact_shown` | 100% |
| Admin | Thời gian dọn hết việc chờ mỗi sáng | tự ghi trong Console: mở "Cần xử lý" → hàng chờ về 0 | < 30 phút |
| Admin | SLA duyệt tin (median từ gửi → quyết) | đã có trong hàng chờ | < 4 giờ làm việc |
| Admin | Số màn phải mở để dọn hết việc | đếm route khác nhau trong một phiên | 1–2 (từ 10–12) |
| Vận hành | Uptime `/health` và trang chủ | uptime monitor ngoài | 99.9% / tháng |
| Vận hành | Lỗi 5xx trên 1.000 request | log Vercel hoặc Sentry | < 1 |
| Vận hành | Thời gian phát hiện sự cố (MTTD) | cảnh báo → ghi nhận | < 5 phút |
| Vận hành | Thời gian khôi phục (MTTR) | ghi nhận → hết | < 60 phút |
| Chất lượng | Lỗi do khách hàng báo trước khi đội biết | góp ý loại "lỗi" đối chiếu cảnh báo | < 20% số sự cố |

---

## 5. Action plan theo giai đoạn

Nguyên tắc: **mỗi giai đoạn kết thúc bằng một thứ đo được**, không phải một danh sách việc đã tick. Mỗi dòng có chủ sở hữu (vai), không ghi tên người. "Agent" là Claude Code làm theo handoff; "Chủ SP" là chủ sản phẩm; "Đội" là đội FeestFinder dùng Console.

### Giai đoạn 0 · Tuần 1: cầm máu và mở mắt

Mục tiêu: không còn thu tiền sai, không còn lỗ hổng quyền, và từ cuối tuần đội biết khi site hỏng trước khách hàng.

| # | Việc | Chủ | Nguồn | Xong khi |
| --- | --- | --- | --- | --- |
| 0.1 | Bỏ phí dịch vụ 5% ở checkout và Pass vé; giữ câu "không thu phí" | Agent | Plan W0.7, D1 đã chốt | Test API: đơn 1 vé 350.000 có `total` 350.000; e2e checkout không có dòng phí. Xoá `SERVICE_FEE_PCT` trên Vercel nếu có (Chủ SP). |
| 0.2 | Bỏ cấp quyền admin qua Console | Agent | Plan W0.1 | `PATCH /admin/users/:id` không đổi `role`; drawer không có nút; test chứng minh. |
| 0.3 | **Sửa tạm** 404 khi sửa tin đang bán: tin **giữ `live`**, đặt cờ `needs_review = true` và ghi các trường đã đổi vào audit; hàng chờ Console hiện tin có cờ như một mục "Bản sửa"; duyệt thì xoá cờ, trả lại thì phục hồi từ audit. Hộp thoại nói rõ trường đã đổi. | Agent | Plan W0.3 (bản đầy đủ ở giai đoạn 2) | `/e/<slug>` vẫn 200 sau khi sửa; tin xuất hiện trong hàng chờ. Migration `040` chỉ thêm một cột boolean. |
| 0.4 | Báo cáo: một thẻ mỗi đối tượng, bỏ qua và cảnh cáo áp cho cả đối tượng, báo admin khi tin bị tự ẩn, báo cáo của tài khoản dưới 7 ngày tính nửa | Agent | Plan W0.11, D8 | Test trong `moderation.test.ts`. |
| 0.5 | Đối soát đối tác một đường (`paid` chỉ từ phiếu chi trả) | Agent | Plan W0.18 | Test API. |
| 0.6 | Bật báo lỗi: đặt `SENTRY_DSN` (hoặc dịch vụ tương thích) trên cả hai project Vercel; kiểm bằng một lỗi thử | Chủ SP | `config.ts:159`, `bootstrap.ts:81` | Lỗi thử xuất hiện trong dashboard trong 1 phút, có `release` và `environment`. |
| 0.7 | Bật analytics: đặt `POSTHOG_KEY`; định nghĩa 6 funnel ở mục 4; kiểm `CLIENT_EVENTS` đủ sự kiện (thêm `signup_start`, `signup_done`, `org_created`, `listing_submitted`, `contact_shown` nếu thiếu) | Chủ SP + Agent | `services/analytics.ts` | Funnel fan hiện số thật sau 24 giờ. |
| 0.8 | Uptime monitor ngoài (ví dụ Better Stack, UptimeRobot, Checkly) cho `https://feestfinder.com/`, `/health` (qua proxy), `/sitemap.xml`, `/map/style.json`; cảnh báo tới email và Zalo/Telegram của đội | Chủ SP | skill `feestfinder-ship` đã liệt kê 4 URL này để kiểm tay | Tắt API thử 2 phút thì có cảnh báo. |
| 0.9 | Deploy production chỉ sau khi CI xanh: bật "Require status checks" cho `main` trên GitHub và tắt auto-deploy của Vercel trên push, thay bằng deploy trong workflow sau job test (hoặc Vercel "Deployment Protection" theo check) | Chủ SP + Agent | `ci.yml`, `CLAUDE.md` mục Deploying | Một PR cố tình hỏng test thì không có deploy. Cập nhật `CLAUDE.md` và skill `feestfinder-ship`. |
| 0.10 | Diễn tập khôi phục: khôi phục bản sao lưu Supabase gần nhất vào project staging, ghi lại thời gian và các bước thành runbook | Chủ SP | Supabase PITR/daily backup | `docs/RUNBOOK.md` có mục "Khôi phục dữ liệu" với RPO và RTO đo được. |
| 0.11 | Sửa "Xem dưới" (impersonation) hoặc **tắt hẳn** nút cho tới khi sửa | Agent | Plan W0.2 | Không còn phiên kẹt; nếu tắt thì menu không có mục. |

Ước lượng: 0.1–0.5 và 0.11 khoảng 4–5 ngày agent; 0.6–0.10 khoảng 1 ngày của chủ sản phẩm, rải trong tuần.

### Giai đoạn 1 · Tuần 2–3: nền tảng dùng chung

Mục tiêu: ba back office dùng được trên điện thoại, một bộ thành phần, một trung tâm thông báo, một hộp việc; và vận hành có quy trình.

| # | Việc | Chủ | Nguồn | Xong khi |
| --- | --- | --- | --- | --- |
| 1.1 | 15 lỗi nhỏ còn lại của W0 (0.4–0.6, 0.8–0.10, 0.12–0.15, 0.17, 0.19–0.24) | Agent | Plan W0 | Mỗi dòng một test. |
| 1.2 | Back office trên điện thoại: rail thành thanh tab + "Thêm"; chân rail giống nhau ở cả ba; bảng thành thẻ dưới 640px; chiều cao cố định | Agent | Plan W7.1–3 | E2E mới ở 390px cho `/studio`, `/studio/artist`, `/console`: có Đăng xuất, có Đổi vai, nút hành động của bảng nằm trong màn. |
| 1.3 | Bộ thành phần back office chung (`kd/ui/backoffice.tsx`), một từ điển trạng thái, một `tone()` | Agent | Plan W7.4 | `/kit` hiển thị bộ này; không còn `Block`, `Kpi`, `Tile` trùng. |
| 1.4 | Từ điển tên gọi (bảng W7.8) thành file `festfinder-web/src/kd/copy/glossary.ts` và áp vào mọi `copy.ts`; review PR kiểm theo file này | Agent | Plan W7.8, D10 | Grep không còn "Đẩy tin", "Người tham dự" ở chân rail, "Chiến dịch thương hiệu". |
| 1.4b | Thư mục nghệ sĩ như mạng xã hội: `/a` chỉ hồ sơ có chủ, `/a/radar` cho tên chưa nhận, follow theo id (migration `041`) | Agent | Handoff W10, D13 đã chốt | `/artists` không trả hồ sơ chưa có chủ; follow hồ sơ chưa có chủ bị từ chối; e2e `directory`, `artist`. |
| 1.5 | Trung tâm thông báo: API `scope=all`, chuông ở 4 khung, một trang cài đặt thông báo, báo admin thêm 4 loại việc | Agent | Plan W2 | Admin nhận thông báo dự án và yêu cầu nhận; e2e chuông trên nav web và Console. |
| 1.6 | Console "Cần xử lý": một hộp việc, một nguồn số đếm, rail sắp lại, Radar thấy được | Agent | Plan W3.1–3, 5 | Mọi loại việc ở mục 3.4 của plan có mặt; rail và Tổng quan cùng số. |
| 1.7 | Quảng cáo: một tên, tách màn Console, ngừng bán chỗ không hiển thị, "Tạo chiến dịch" có drawer xem trước | Agent | Plan W4.1–3, W0.16–17 | `/advertise` không còn `feed`, `live`; Studio không còn "Đẩy tin". |
| 1.8 | Runbook vận hành `docs/RUNBOOK.md`: sự cố (ai nhận cảnh báo, bước đầu, rollback web bằng Instant Rollback, rollback API, khi nào gọi Supabase), dọn việc buổi sáng, xử lý báo cáo, hoàn tiền, khôi phục dữ liệu | Agent viết nháp, Đội duyệt | mới | Đội tự chạy được một lần theo runbook mà không hỏi. |
| 1.8b | `<html lang>` theo ngôn ngữ trang (`en` trên `/en` và `?lang=en`) | Agent | `app/(kd)/layout.tsx:33` | E2E: `/en` có `html[lang=en]`. |
| 1.9 | CI: thêm `npm audit --audit-level=high` (hoặc Dependabot), Playwright ở viewport 390px cho back office, kiểm a11y bằng `@axe-core/playwright` trên 10 trang chính (chỉ lỗi `serious`/`critical`) | Agent | `ci.yml` | CI đỏ khi có lỗi a11y nghiêm trọng mới. |
| 1.10 | Migration: khoá advisory đã có (`migrate.ts:49`); viết quy ước "expand → migrate → contract" vào skill `feestfinder-migration`; mỗi migration phá vỡ phải có bước lùi ghi trong file | Agent | skill `feestfinder-migration` | Skill cập nhật; migration `040` theo quy ước. |
| 1.11 | Gắn `RELEASE` = SHA commit vào deploy (Vercel env từ `VERCEL_GIT_COMMIT_SHA`), hiện ở `/health` và trong báo lỗi | Agent | `config.ts` | `/health` trả `release`; Sentry nhóm lỗi theo release. |

### Giai đoạn 2 · Tuần 4–9: luồng người dùng

Mục tiêu: mỗi vai có **một** đường đi cho việc chính, được bảo vệ bằng test hành trình.

| # | Việc | Chủ | Nguồn | Xong khi |
| --- | --- | --- | --- | --- |
| 2.1 | Fan, bước 1: `/saved`, `/profile` là bản chính, cài đặt vào `/profile`; sau cờ `FF_WEB_FIRST` | Agent | Plan W1.3 bước 1 | Redirect bật cho 100% sau 1 tuần không tăng lỗi; route cũ xoá sau 2 tuần. |
| 2.2 | Fan, bước 2: trang sự kiện một bản (thanh mua dính đáy, khối Vé sau Lineup, "Chuẩn bị cho đêm"); mua vé khi chưa đăng nhập giữ ý định; checkout luôn có tóm tắt | Agent | Plan W1.3 bước 2, W1.4 | KPI thời gian `/e` → thanh toán giảm; e2e hành trình fan. |
| 2.3 | Fan, bước 3: `/app` → `/`, một bản đồ, `start_url` | Agent | Plan W1.3 bước 3 | Chỉ sau khi số liệu `/app` (0.7) cho thấy dưới 10% phiên bắt đầu ở `/app`, hoặc chủ SP quyết. |
| 2.4 | Bản sửa chờ duyệt đầy đủ (`pending_changes`, Console hiện chênh lệch) thay cho bản tạm 0.3 | Agent | Plan W0.3 | Test: duyệt áp đúng trường; trả lại giữ nguyên bản đang bán. |
| 2.5 | NTC: form cộng đồng cho người chưa là NTC; sửa wizard (4 điểm); trình sửa hiện tin kiểm duyệt; một điểm chất lượng | Agent | Plan W5.1, 3, 4 | KPI "tin bị trả lại vì thiếu địa chỉ/ảnh" giảm; fan gửi được sự kiện. |
| 2.6 | NTC: một form sự kiện (wizard chỉ tạo mới); khách mời về Người tham dự; "Gửi tin tới khách" gộp hai kênh; Dự án trong Studio | Agent | Plan W5.2, 7, 8, 9 | E2E `studio-events` theo một form; `/studio/promos` redirect. |
| 2.7 | Nghệ sĩ: luồng nhận hồ sơ có bằng chứng và trạng thái (dùng chung với NTC); liên hệ hai chiều khi chốt; rail 4 mục với pipeline booking | Agent | Plan W6.1–4 | KPI bằng chứng > 80%; `contact_shown` 100%. |
| 2.8 | Thanh chủ sở hữu trên `/e` và `/o`; lối vào Studio nghệ sĩ từ hồ sơ, footer, `/a` | Agent | Plan W5.6, W6.7 | E2E. |
| 2.9 | Test hành trình (mục 6) cho 4 vai, chạy trong CI | Agent | mới | 4 spec mới xanh; mỗi bước ✗ của mục 3 trong plan có ít nhất một assertion. |
| 2.10 | Checklist thiết bị thật trước mỗi release đụng điện thoại; sửa camera check-in trên iOS (thư viện quét tự host) và ô ngày | Đội + Agent | Plan W5.10, W8.9 | Check-in bằng camera chạy trên iPhone Safari thật. |

### Giai đoạn 3 · Tuần 10+: tự cải thiện

| # | Việc | Chủ | Xong khi |
| --- | --- | --- | --- |
| 3.1 | Mô hình vị trí quảng cáo có ngày; hiển thị kệ trên `/`; bán lại `feed`/`live` khi đã render | Agent | Plan W4.4 |
| 3.2 | Hoãn/huỷ sự kiện với hoàn tiền; lịch diễn và sân khấu; mời thành viên | Agent | Plan W5.5 |
| 3.3 | Recap có lối vào; ảnh recap lên tường ảnh với đồng ý; kế hoạch mời bằng link (thiết kế riêng về quyền riêng tư) | Chủ SP thiết kế, Agent làm | Plan W8.1–2 |
| 3.4 | Quyết D3 (Hype và Lưu) và D9 (thư mục nghệ sĩ) bằng số liệu 8 tuần | Chủ SP | Quyết định ghi vào roadmap |
| 3.5 | Audit UX theo vai mỗi quý, cùng khuôn 5 tester; so KPI với quý trước | Agent | Báo cáo trong `docs/ux-audit-<ngày>/` |
| 3.6 | Ngân sách hiệu năng trong CI (Lighthouse CI cho `/`, `/e/<slug>`, `/list`: LCP < 2,5 s trên mobile giả lập, JS < 250 KB cho trang web fan) | Agent | CI đỏ khi vượt |
| 3.7 | Web Vitals thật qua PostHog hoặc Vercel Speed Insights | Chủ SP | Dashboard p75 theo trang |
| 3.8 | Hỗ trợ: trả lời góp ý từ Console; SLA phản hồi NTC được đo; bỏ hoặc giữ lời hứa "2 giờ" theo số thật | Agent + Đội | KPI hỗ trợ |

---

## 5b. Night build: kế hoạch một đêm chạy liền

> Bản đầy đủ để chạy, tự đứng được, ở `docs/NIGHT_BUILD_PLAN_2026-10-16.md`. Mục này giữ phần tóm tắt.

Chủ sản phẩm muốn gom việc thành một "night build": agent chạy nhiều giờ liền, không có người xem, sáng hôm sau có kết quả kiểm được. Nguyên tắc của night build khác ban ngày: **chỉ làm việc đã có quyết định**, **mỗi việc một branch và một commit**, **không deploy**, **dừng và ghi lại khi gặp quyết định mới** thay vì tự quyết.

### Quy tắc bố cục bắt buộc cho mọi việc trong đêm (chủ sản phẩm chốt 2026-10-16)

**Mọi giao diện phải lấp đầy bề ngang màn hình, trên desktop lẫn điện thoại, và tuyệt đối không có cuộn ngang.** Áp cho site, app, Studio, Studio nghệ sĩ và Console; cho mọi màn có sẵn mà việc trong đêm chạm tới, và cho mọi màn mới.

- Lấp đầy: `.kd-wrap` không có `max-width` (đã đúng); phần nội dung của mọi màn trải hết chiều rộng còn lại sau rail hoặc gutter. Không có cột trống bên phải (checkout đang 624 px trái, phải trống: fan #31). Chữ dài vẫn giữ `max-w-read`, lưới thẻ thì thêm cột.
- Không cuộn ngang: `document.documentElement.scrollWidth` phải bằng `window.innerWidth` ở **mọi** route, ở 390 px và 1440 px, kể cả khi mở drawer, sheet, menu. Không phần tử nào được dựa vào `overflow-x: auto` để "chứa" nội dung rộng hơn màn hình, vì `kd.css` ẩn thanh cuộn nên người dùng không biết có thứ bị cắt.
- Bảng: dưới `tab` (760 px) bảng đổi thành thẻ (tên, dòng phụ, số, nút hành động rộng hết thẻ); trên desktop cột co theo `minmax(0, …)`, chữ dài `kd-ell`, không `min-width` cố định lớn hơn màn hình. Hiện đang sai ở: `/list` bảng 1020 px (fan #2), `/console/events` 1020 px (admin #16), mọi `.kd-tr { min-width: 640px }` của ba back office (nghệ sĩ #3, NTC L.1), rail Studio thành dải 1.503 px trên điện thoại.
- Dải chip, tab, rail ngang: được cuộn ngang **bên trong** chính nó chỉ khi có dấu hiệu rõ (mờ dần ở mép và vẫn cuộn bằng tay), nhưng không được làm trang cuộn ngang; ưu tiên xuống dòng.
- Ảnh, iframe, mã QR, bản đồ, `<pre>` JSON: `max-width: 100%`, `min-width: 0` trên mọi flex item chứa chữ dài.

**Cổng kiểm tra chung, chạy sau mỗi việc N1–N11:** một spec Playwright mới `e2e/next/layout.spec.ts` đi qua **mọi** route trong `src/app/(kd)` (lấy từ danh sách route, với slug seed) ở 390 px và 1440 px, đăng nhập theo vai cần thiết, và khẳng định: `scrollWidth === innerWidth`; không phần tử nào có `getBoundingClientRect().right > innerWidth + 1` trừ phần tử bị `overflow: hidden` bởi cha; phần nội dung chính rộng ≥ 95% chiều rộng còn lại. Spec này **đỏ là không được sang việc kế**.

### Đầu vào bắt buộc trước khi bắt đầu

| # | Điều kiện | Lý do |
| --- | --- | --- |
| 1 | Mọi quyết định D1–D13 của handoff đã chốt hoặc chấp nhận mặc định (chủ SP ghi một dòng vào roadmap: "chấp nhận mặc định D2–D12") | Agent không được tự quyết việc sản phẩm |
| 2 | `main` sạch, CI xanh, `npm test` và `npm run test:screens` xanh trên máy chạy | Để biết lỗi mới là của đêm nay |
| 3 | Máy không ngủ (skill `ccd_host` request_keep_awake), còn đủ hạn mức phiên; preview không chạy để tránh tranh cổng 3000/4300/4100 | Hai lần hôm nay agent bị dừng vì hết hạn mức |
| 4 | Một file `docs/NIGHT_BUILD_<ngày>.md` do agent ghi tiến độ sau **mỗi** việc: branch, commit, test đã chạy, điều còn mở | Nếu bị dừng giữa chừng, sáng sau vẫn đọc được |

### Thứ tự trong đêm (khoảng 15 giờ agent; nếu hạn mức không đủ thì cắt từ N7b trở đi sang đêm sau; mỗi việc có cổng kiểm tra)

| Giờ | Việc | Nguồn | Cổng để sang việc kế |
| --- | --- | --- | --- |
| 0:00 | Khởi động: tạo file tiến độ, `git fetch`, xác nhận điều kiện 1–2 | | Ghi dòng đầu tiên |
| 0:10 | **N1** Bỏ phí 5% checkout và Pass vé | Handoff W0.7 | `test/attendee.test.ts`, `resale.test.ts` xanh; e2e `event.spec.ts` xanh |
| 1:00 | **N2** Bỏ cấp admin qua Console; tách `admin/ops.ts` thành 4 file nhân tiện | Handoff W0.1, Audit Q3 | `admin.test.ts` xanh; test 403 cho người không phải admin |
| 2:00 | **N3** Sửa tạm 404 khi sửa tin đang bán (cờ `needs_review`, migration `040`) | Review 0.3 | `organizer` tests xanh; `/events/<slug>` 200 sau khi sửa |
| 3:30 | **N4** Báo cáo: một thẻ mỗi đối tượng, cảnh cáo theo đối tượng, báo admin khi tin bị ẩn | Handoff W0.11, D8 | `moderation.test.ts` xanh |
| 4:30 | **N5** Font gọn: 3 `@font-face` Noto Sans, Thai/JP chỉ dải riêng, preload | Audit P1 | e2e mới: trang Việt không tải latin-ext, jp, thai; font < 60 KB |
| 5:30 | **N6** Cache CDN cho API đọc công khai và `/map/style.json` | Audit P3 | test API: không cookie → `s-maxage`; có cookie → `private, no-store` |
| 6:30 | **N7** W10 phần API và migration `041`: follow theo id, `artistKind()`, `/artists` chỉ loại A, `?kind=unclaimed` | Handoff W10.4, 8 | `artists.test.ts` theo danh sách test của W10 |
| 8:00 | **N8** W10 phần web: `/a` không tab, `/a/radar`, đầu trang nghệ sĩ theo loại, breadcrumb | Handoff W10.1–3, 6 | `directory.spec.ts`, `artist.spec.ts` xanh |
| 9:30 | **N9** 10 lỗi nhỏ của W0 không cần quyết định: 0.8, 0.9, 0.10, 0.12, 0.13, 0.14, 0.15, 0.19, 0.20, 0.21 | Handoff W0 | mỗi lỗi một test |
| 11:00 | **N10** ESLint bật với baseline (không sửa `any` cũ), `no-floating-promises` sửa hết vì là lỗi thật | Audit Q1 | `npm run lint` 0 lỗi; CI có job lint |
| 11:40 | **N7b** Bắt tay lineup ↔ hồ sơ, phần API: cột `confirmed_*`/`disputed_*` trong cùng migration `041`, thông báo `lineup_added` khi NTC đăng tên có hồ sơ chính thức, `lineup_claim` khi báo lịch ghép vào tin NTC, endpoint xác nhận / không phải tôi / thêm vào lineup; hồ sơ chính thức không bao giờ ở `/a/radar` | Handoff W10.11 | `test/lineup.test.ts` xanh. Phần màn hình (ô lineup của NTC, Lịch nghệ sĩ, dấu trên trang sự kiện) để đêm sau hoặc ban ngày vì cần xem bằng mắt |
| 13:00 | **N11** Lấp đầy bề ngang, không cuộn ngang: viết `layout.spec.ts` **trước**, chạy để có danh sách màn đang sai, rồi sửa theo thứ tự: `.kd-tr` thành thẻ dưới 760 px (ba back office), `/list` mặc định lưới trên điện thoại và bảng co được trên desktop, `/console/events` co cột, rail Studio và Console trên điện thoại thành thanh tab + "Thêm" (Handoff W7.1), checkout hai cột trên desktop, `.kd-shell` `align-content: flex-start` | Quy tắc bố cục ở trên; Handoff W7.1–2, W0.19; Audit fan #2 #31, admin #16, nghệ sĩ #3 #12 | `layout.spec.ts` xanh ở 390 và 1440 cho mọi route |
| 15:00 | Khép: `npm run typecheck`, `npm test`, `npm run test:screens` trên nhánh gộp `night/2026-10-xx`; cập nhật roadmap, `CLAUDE.md` (font, `/a`, follow, hồ sơ chính thức và bắt tay lineup, và quy tắc "lấp đầy bề ngang, không cuộn ngang" vào mục Look), file tiến độ; **không push `main`** | | Báo cáo sáng: bảng việc, số test, điều còn mở |

Việc **không** làm trong đêm, dù có thời gian: gộp web và app (W1), gộp wizard và editor (W5.2), hộp việc Console (W3.1), trung tâm thông báo (W2). Chúng đụng nhiều màn và cần người xem bằng mắt trước khi đi tiếp.

### Sáng hôm sau (chủ sản phẩm, 30 phút)

1. Đọc `docs/NIGHT_BUILD_<ngày>.md`: việc nào xong, việc nào dừng vì gặp quyết định.
2. Chạy preview (skill `feestfinder-preview`), thu cửa sổ về cỡ điện thoại rồi kéo rộng ra: không trang nào cuộn ngang, không cột trống. Đi 4 luồng ngắn: mua vé (không phí), sửa tin đang bán (trang vẫn mở), `/a` và `/a/radar`, trang nghệ sĩ có chủ và trang Radar.
3. Nếu ổn: "commit all merge main redeploy" như thường lệ (skill `feestfinder-ship`). Nếu một việc hỏng: bảo agent revert đúng commit đó, phần còn lại vẫn ship.

## 6. Tiêu chí hoàn thành (Definition of Done) và test hành trình

### 6.1 DoD cho mọi PR từ nay

1. Typecheck sạch cả hai package; test API của khu vực và `npm test` xanh; `npm run test:screens` xanh.
2. Có test cho hành vi mới hoặc lỗi đã sửa (API trong `test/`, màn hình trong `e2e/next/`).
3. Chuỗi hiển thị song ngữ qua `pick()` / `L()`; không còn tiếng Anh lọt trong giao diện tiếng Việt; tên gọi theo `glossary.ts`.
4. Mỗi màn một nút lime; không có câu giải thích ngoài quy tắc định dạng (Lean UI).
5. Màn mới hoặc sửa phải chụp ở 390px và 1440px, đính vào PR. Màn lấp đầy bề ngang ở cả hai cỡ và `layout.spec.ts` xanh: không cuộn ngang ở bất kỳ route nào.
6. Thay đổi route có redirect và được ghi trong `CLAUDE.md`; thay đổi quy tắc có dòng trong roadmap.
7. Migration theo quy ước expand → contract và có bước lùi ghi trong file.
8. Không thêm route, vai hay mật khẩu nào cấp admin; route admin mới có test 403 cho người không phải admin.
9. Không gửi email, tên, IP qua `FF.track`; sự kiện mới thêm vào `CLIENT_EVENTS`.

### 6.2 Bốn test hành trình (chạy trong CI, giai đoạn 2)

Mỗi spec đi đúng luồng ở mục 3 của plan, trên 390px và 1440px, và khẳng định những thứ đã từng ✗:

- `journey-fan.spec.ts`: `/` → `/list` (lưới trên điện thoại) → `/e` (vé thấy được không cần cuộn qua thảo luận) → mua khi chưa đăng nhập (giữ hạng vé) → đăng nhập bằng mã (không bắt mật khẩu) → checkout (không có dòng phí) → vé → recap có lối vào.
- `journey-organizer.spec.ts`: đăng ký → tạo NTC → nhập tài khoản nhận tiền ở Hồ sơ → wizard không bắt link bán vé ngoài → gửi duyệt → yêu cầu sửa hiện trong trình sửa → sửa tin đang bán vẫn 200 → check-in → quảng cáo.
- `journey-artist.spec.ts`: đăng ký → tạo hồ sơ có phong cách → nhận hồ sơ Radar với bằng chứng → màn chờ có tên hồ sơ và nút huỷ → lời mời → đồng ý → thấy liên hệ → đổi vai và huỷ giữa chừng vẫn giữ vai.
- `journey-admin.spec.ts`: thông báo → "Cần xử lý" có đủ loại việc → duyệt tin → báo cáo một thẻ mỗi sự kiện → yêu cầu nhận có bằng chứng → quảng cáo mở đúng yêu cầu → xem dưới mở Studio của NTC → không có nút cấp admin.

### 6.3 Checklist thiết bị thật (15 phút, trước release đụng điện thoại)

iPhone Safari và Android Chrome, mạng 4G:
- `/e/<slug>`: thanh mua dính đáy, Đặt xe mở đúng app.
- Checkout → VietQR thật ở staging → vé có QR → tắt mạng, QR vẫn hiện.
- `/studio/door`: camera quét được một QR thật.
- `/studio`, `/studio/artist`, `/console`: có Đăng xuất và Đổi vai; một bảng bất kỳ có nút hành động thấy được.
- Ô ngày ở Báo lịch diễn hiện dd/mm.

---

## 7. Rủi ro và cách giảm

| Rủi ro | Xác suất | Tác động | Giảm bằng |
| --- | --- | --- | --- |
| W1 làm hỏng PWA/offline của người đã cài | Trung bình | Cao | Cờ tính năng, bật dần, giữ route cũ 2 tuần, service worker vẫn cache `/app/tickets`. |
| Bỏ phí 5% ảnh hưởng doanh thu nền tảng | Chắc chắn | Trung bình | Phí nền tảng của NTC giữ nguyên; theo dõi doanh thu 4 tuần; D1 đã chốt. |
| Gộp wizard và editor làm vỡ nhiều e2e | Cao | Trung bình | Làm sau 2.5, trong một branch, sửa e2e cùng lúc; không gộp chung với việc khác. |
| Deploy gate làm chậm hotfix | Thấp | Thấp | Workflow có nhãn `hotfix` chạy test nhanh (typecheck + test khu vực) rồi deploy, ghi audit. |
| Đội không dùng runbook | Trung bình | Cao | Diễn tập 1 lần mỗi quý; runbook ngắn, mỗi mục 10 dòng. |
| Analytics vi phạm riêng tư | Thấp | Cao | Danh sách `ALLOWED_PROPS` đã chặn; review PR theo DoD mục 9. |
| Agent tự quyết việc sản phẩm | Trung bình | Trung bình | Mọi quyết định D* phải có dòng trong roadmap trước khi code; agent dừng và hỏi khi gặp quyết định mới. |

---

## 8. Việc chủ sản phẩm cần làm trong 7 ngày tới

1. Chốt 11 quyết định còn lại ở mục 2 của plan (D1 đã chốt). Hai cái cần sớm nhất: D4 (sửa tin đang bán: chấp nhận bản tạm ở 0.3) và D7 (mật khẩu tuỳ chọn).
2. Đặt `SENTRY_DSN`, `POSTHOG_KEY` trên Vercel; xoá `SERVICE_FEE_PCT` nếu có.
3. Lập uptime monitor (0.8) và kênh nhận cảnh báo của đội.
4. Bật "Require status checks" cho `main` (0.9).
5. Chạy một lần khôi phục sao lưu vào staging, ghi thời gian (0.10).
6. Bảo agent bắt đầu giai đoạn 0 theo thứ tự 0.1 → 0.2 → 0.3 → 0.4 → 0.5 → 0.11, mỗi việc một branch, commit và deploy chỉ khi bạn bảo.
