# Handoff: ảnh bằng URL · mix player trên trang nghệ sĩ · nút đặt xe · thành phố trong hướng dẫn AI

- Ngày viết: 2026-10-15 · Dành cho: Claude Code (Opus 5.5) · Trạng thái: **đã code xong cả 5 workstream ngày 2026-10-15** trên branch `feat/handoff-2026-10-15` (chưa commit); chủ sản phẩm duyệt toàn bộ mặc định D0–D9.

> **Kết quả thực hiện (khác plan ở đâu)**
> - Grab và Green SM đã kiểm chứng từ link web-to-app chính thức của chính họ: Grab `grab://open?screenType=BOOKING`, `com.grabtaxi.passenger`, id647268330; Green SM `xanhsm.com://homepage`, `com.gsm.customer`, id6446425595. Android mở app theo package bằng `intent://`. Vẫn chưa có tham số điểm đến công khai, nên app nào cũng `prefilled: false` và địa chỉ được chép sẵn.
> - Mixcloud thật trả iframe ở `www.mixcloud.com/widget/iframe/` với `feed` là URL đầy đủ (không phải `player-widget…` như plan đoán). `embedFrom` nhận cả hai dạng; CSP cho phép cả hai host.
> - Job xoá ảnh góp ý chạy mỗi 4 giờ (vẫn giữ 90 ngày), để khớp lịch của `runDueJobs`.
> - Chưa làm (tuỳ chọn trong plan): tự lưu cover event dán bằng link về storage (A.2 mục 10), embed cấp profile khi chưa có mix (B-2), mục "Nghe lại" trên trang event (B-3), lối vào góp ý trong menu tài khoản và cài đặt app (đã có nút nổi và link ở footer).
> - Kiểm tra: API 360 test (359 qua, 1 bỏ qua như trước); e2e 209 qua; typecheck sạch; đã xem trong preview với link SoundCloud, Mixcloud, Spotify thật; e2e có spec mới cho cả 5 phần.
- Người viết đã đọc code ở commit `34dcd75` (`main`). Lúc viết, cây làm việc có một thay đổi chưa commit ở `festfinder-web/next.config.ts` (thứ tự rewrite của `/p`), do người khác làm: **đừng revert nó**.
- Đọc `CLAUDE.md` ở gốc repo trước khi làm. Các quy tắc ở đó thắng mọi thứ trong file này.

---

## 0. Cách làm việc với handoff này

1. Có **5 workstream độc lập**: A (ảnh), B (mix), C (đặt xe), D (bỏ TP.HCM ghi cứng trong hướng dẫn AI), E (widget góp ý và báo lỗi, mục 6b). Mỗi cái là một branch, merge riêng được.
   Thứ tự nên làm: **D trước** (nhỏ, không có migration, sửa lỗi đang chạy trên production), rồi **A → B** (B dùng thumbnail từ URL và `RemoteImg` của A). **C** làm song song được.
2. Migration: số tiếp theo là `035`. Dự kiến: A = `035_remote_images.sql`, B = `036_artist_mixes.sql`, C = `037_ride_clicks.sql`, E = `038_feedback.sql`. Nếu các branch merge theo thứ tự khác thì đổi số lúc merge. Dùng skill `feestfinder-migration`. Không bao giờ sửa migration đã ship.
3. Mỗi workstream xong thì: `npm run typecheck` → file test của khu vực đó → `npm test` → `npm run test:screens` (từ `festfinder-backend/`). Xem bằng skill `feestfinder-preview`.
4. Commit, push, deploy **chỉ khi người dùng bảo** (push lên `main` là deploy production). Khi được bảo thì dùng skill `feestfinder-ship`.
5. Cập nhật `docs/FEESTFINDER_ROADMAP.md` ngay trong thay đổi đó (có cả mục nhật ký quyết định, xem D0).
6. Chuỗi hiển thị: server dùng `L('English', 'Tiếng Việt')`, web dùng cặp `{en, vi}` trong `copy.ts` của từng màn hình, đọc bằng `pick()`. UI gọn: tiêu đề và hành động, chỉ có hint khi đó là quy tắc định dạng.

---

## 1. Các quyết định chủ sản phẩm cần xác nhận

Mỗi quyết định đều đã có mặc định để bạn làm luôn. Nếu người dùng chọn khác thì làm theo người dùng.

| # | Câu hỏi | Mặc định trong plan |
| --- | --- | --- |
| D0 | Yêu cầu này **đảo ngược** quyết định ngày 2026-10-06 ("moments uploaded", roadmap dòng 137). | Ghi vào nhật ký quyết định của roadmap: từ 2026-10-15, moments và ảnh hồ sơ chỉ dùng URL. |
| D1 | Logo/cover của **nhà tổ chức** (`/o/<slug>`) và cover của **dự án** (`/p/<slug>`) có tính là "trang event" không? | **Không**: chỉ dùng URL (theo nguyên văn "chỉ duy nhất trang event"). |
| D2 | Ảnh cộng đồng trên trang event (ảnh recap, ảnh trong thảo luận "Kỷ niệm", photo wall) | **Vẫn cho tải lên**, vì chúng nằm trên trang event. Phương án khác: chuyển luôn sang URL. |
| D3 | Cover của event Radar (ingestion lấy từ JSON-LD hoặc Ticketmaster, đang hotlink) | **Giữ hotlink** + job kiểm tra link + art dự phòng. Không tự copy ảnh của bên thứ ba về storage. Khi nhà tổ chức claim event thì họ tải ảnh lên. |
| D4 | Ảnh đã tải lên trước đây cho avatar, moments, cover nghệ sĩ hay logo nhà tổ chức | **Giữ nguyên** (grandfather): `/files/*` vẫn phục vụ, giá trị cũ không đổi thì vẫn lưu được. Không xoá file nào. Chỉ dọn khi người dùng đồng ý rõ ràng. |
| D5 | Đặt xe: chưa có hợp đồng với Grab hay Green SM | **Phase 1 không cần hợp đồng**: mở app (kèm điểm đến khi tham số đã kiểm chứng trên máy thật) + tự chép địa chỉ. Phase 2 là deep link đối tác có ghi nhận nguồn. |
| D6 | Bình luận dưới mix có cần số điện thoại đã xác nhận không? | **Có**, như mọi bài đăng công khai (`requireWriter`). Like chỉ cần đăng nhập. |
| D7 | Ảnh URL: hotlink trực tiếp hay đi qua proxy của mình? | **Hotlink trực tiếp** với `referrerpolicy="no-referrer"`. Proxy (`/img?u=`) hoặc Vercel Image Optimization giúp riêng tư và resize tốt hơn nhưng tốn bandwidth và tiền, để làm sau nếu cần. |

---

## 2. Hiện trạng codebase (người viết đã kiểm tra)

### Ảnh và upload
- `festfinder-backend/src/routes/uploads.ts`: `POST /uploads?purpose=cover|logo|avatar|recap|moment` (PNG/JPEG/WebP, tối đa 8 MB, đặt tên theo sha256), kèm `GET /files/*`. Luật kích thước: cover 16:9 ≥1600×900, logo ≥256, moment ≥400 cạnh ngắn, avatar ≥128.
- `services/storage.ts`: S3 (Supabase Storage), DB (`stored_files` bytea), disk hoặc memory. **Production dùng S3**: `GET https://feestfinder.com/health` → `"uploads":"s3"`.
- `lib/validate.ts`: `imageUrl` nhận **mọi URL** hoặc đường dẫn `/files/...`. Tức là API **đã** nhận URL cho ảnh nghệ sĩ, nhà tổ chức và người dùng; chỉ có màn hình là ép phải tải lên. Riêng `routes/moments.ts` bắt URL phải là một upload `moment` của chính người đó.
- Những chỗ đang **tải lên** ảnh:

| Bề mặt | File màn hình | API ghi | Purpose | Đích (mặc định) |
| --- | --- | --- | --- | --- |
| Cover và logo event (Console) | `festfinder-web/src/kd/console/events/form.tsx:478` (`Upload` trong `console/events/parts.tsx`) | `routes/admin/ops.ts`, `routes/organizer/events.ts:69-70` | cover, logo | **Giữ tải lên** |
| Cover và logo event (Studio wizard) | `kd/studio/wizard.tsx:603` | `routes/organizer/events.ts` | cover, logo | **Giữ tải lên** |
| Cover event do cộng đồng gửi | (submit form) | `routes/community.ts:44` | URL | Giữ như hiện tại (event) |
| Ảnh recap | `kd/app/recap.tsx:70` | `routes/event-actions.ts:150` | recap | Giữ tải lên (D2) |
| Ảnh "Kỷ niệm" trong thảo luận | `kd/web/event/community.tsx:212` | `routes/discussion.ts:225` | recap | Giữ tải lên (D2) |
| Ảnh và cover nghệ sĩ | `kd/artist/profile.tsx:153-154` (`ImagePick` trong `kd/artist/parts.tsx:44`) | `routes/artists.ts` `PATCH /me/artist` | avatar, cover | **Chỉ URL** |
| Logo và cover nhà tổ chức (Studio) | `kd/studio/profile.tsx:180` (`ImagePick`) | `routes/organizer/events.ts:162-163` | logo, cover | **Chỉ URL** (D1) |
| Logo nhà tổ chức (Console) | `kd/console/organizers/drawer.tsx:216` | `routes/admin/ops.ts:707` | logo | **Chỉ URL** (D1) |
| Cover dự án | `kd/web/projects/manage.tsx:131` | `routes/projects.ts:55` | cover | **Chỉ URL** (D1) |
| Moments (fan, nghệ sĩ, nhà tổ chức) | `kd/moments.tsx:58` | `routes/moments.ts` `POST /me/moments` | moment | **Chỉ URL** |
| Ảnh người dùng | (chỉ lấy từ Google OAuth, `routes/auth.ts:358`) | `routes/me.ts:63` | URL | **Chỉ URL** |

- Hiển thị: `Art`, `Avatar` (`kd/ui/parts.tsx:52,93`), `MomentsGrid` (`kd/ui/moments.tsx`) và các preview trong `ImagePick` đều là `<img>` trần: chỉ có `BrokenCovers` (`kd/ui/covers.tsx`, một listener chung) che ảnh `.kd-cover` hỏng; `Avatar` và moments chưa có ảnh dự phòng; không `referrerPolicy`, không `width`/`height`.
- CSP: cả `festfinder-web/next.config.ts` lẫn `festfinder-backend/src/app.ts:158` đều có `img-src 'self' data: blob: https:`, nên ảnh từ host khác **đã hiển thị được**. Các comment "CSP không cho host ảnh nào khác" ở `routes/moments.ts:88`, `029_moments.sql`, `kd/moments.tsx` và trong roadmap đã **lỗi thời**: hãy sửa comment, đừng sửa migration.
- `services/fetchpage.ts` → `fetchPublic()` đã chặn SSRF (kiểm tra từng bước redirect, chặn IP private, giới hạn kích thước body) nhưng chỉ đọc **text**. `lib/image.ts` → `imageInfo()` đọc kích thước PNG/JPEG/WebP từ header.

### Nghệ sĩ và bình luận
- Trang: `festfinder-web/src/kd/web/artist/page.tsx` (ISR `revalidate = 300`); API là `GET /artists/:slug` trong `routes/artists.ts:81`.
- `lib/network.ts` `ARTIST_LINK` có `spotify` và `soundcloud` nhưng **chưa có `mixcloud`**. Link chỉ được coi là "của nghệ sĩ" khi profile đã có chủ hoặc được team xác minh (`sameAsOf` trong `services/seo.ts:638`).
- Hạ tầng bình luận có sẵn để tái dùng: `routes/discussion.ts` (`checkPostText`, 6 bài/10 phút, báo cáo → ẩn sau `HIDE_AFTER_REPORTS = 3`, `notifyUser`/`notifyOrganizer`, phân trang bằng `page`/`decodeCursor` trong `http/sql.ts`). Kiểu chặn bằng số điện thoại: `PhoneSheet` khi gặp lỗi `phone_unverified` (xem `kd/moments.tsx`).
- CSP của web **không có `frame-src`**, nên `default-src 'self'` sẽ **chặn mọi iframe** SoundCloud, Mixcloud hay Spotify. Phải thêm vào.
- Link trong thông báo được dịch ra đường dẫn ở `festfinder-web/src/kd/app/inbox.tsx:51-57`.

### Trang event
- Web: `kd/web/event/page.tsx` (ISR 60 s). Trong app: `kd/app/event.tsx`. Cả hai đều có hàng địa điểm với nút "Chỉ đường" (`mapsHref`), và một mục `#venue`. `ev.venue.lat/lng` có thể null.
- Mẫu "đếm click rồi đi ra ngoài": `routes/outbound.ts` (`/go/<event>`, chống trùng 30 phút, `deviceOf` loại bot), `countEventMetric()` trong `services/partners.ts:94`, bảng `event_metrics_daily`.
- Analytics: `CLIENT_EVENTS` và `ALLOWED_PROPS` trong `services/analytics.ts` (đã có key `kind`, `surface`, `source`).
- Quy tắc giao diện: mỗi màn hình chỉ **một hành động lime**, nên nút đặt xe và nút like **không được** dùng `tone: 'acc'`.

### Hướng dẫn AI của event
- `services/guide.ts` ghi cứng "Ho Chi Minh City" trong prompt hệ thống và "HCMC" ở dòng địa điểm, và ghi cứng "VND" ở dòng giá vé. Cả hai trái quy tắc của `CLAUDE.md`. Đã đưa vào plan thành **workstream D** (mục 6).

---

## 3. Workstream A: ảnh dùng URL, chỉ event được tải lên

### A.1 Chính sách cuối cùng
- **Tải lên** (S3): cover và logo của event; ảnh cộng đồng trên trang event (D2).
- **Chỉ URL** (https): avatar người dùng, ảnh và cover nghệ sĩ, logo và cover nhà tổ chức, cover dự án, moments.
- URL được **kiểm tra phía server** trước khi lưu (là ảnh thật, đủ kích thước, không phải link sắp hết hạn), được **kiểm tra lại định kỳ**, và luôn có **ảnh dự phòng** khi hỏng (chữ cái đầu hoặc `Art`).

### A.2 Backend
1. **`src/lib/remote-image.ts`** (mới), các hàm thuần, dễ test:
   - `normalizeImageUrl(raw)`: chỉ `https:`, ≤2048 ký tự, không có user/pass, không có cổng lạ, không dùng IP làm host.
   - Chuyển link chia sẻ thành link ảnh: Dropbox `?dl=0` → `?raw=1`; GitHub `/blob/` → `raw.githubusercontent.com`; Google Drive `file/d/<id>` → `https://drive.google.com/thumbnail?id=<id>&sz=w2000` (**phải kiểm chứng** với file công khai).
   - `REFUSED`: host có URL ký sẵn và sẽ hết hạn, như `*.fbcdn.net`, `*.cdninstagram.com`, `*.tiktokcdn*.com`, và URL có `X-Amz-Signature`, `Expires=`, `oe=`, `x-expires`. Mã lỗi `image_link_expires`: `L('This link expires; use another one', 'Link ảnh này có hạn dùng, hãy dùng link khác')`.
   - Không nhận đường dẫn `/files/...` hay host `S3_PUBLIC_BASE_URL` cho các purpose không phải event (mã `upload_not_allowed`).
2. **`services/fetchpage.ts`**: tách vòng lặp redirect và kiểm tra SSRF ra dùng chung, rồi thêm `fetchPublicBytes(url, {maxBytes, timeoutMs, accept, range})`. Gửi `Range: bytes=0-131071`; nếu server không hỗ trợ Range thì ngắt khi đã đọc đủ 256 KB.
3. **`services/remote-images.ts`** (mới), `probeImage(ctx, url, purpose)`:
   - Nếu phản hồi là ảnh: đọc header. Nếu là HTML: lấy `og:image` hoặc `twitter:image` (đường dẫn tương đối thì ghép với URL trang), rồi probe tiếp **một lần**. Cách này xử lý được Google Photos, Imgur, Flickr, Unsplash, trang SoundCloud, Spotify, Bandcamp.
   - MIME phải là `image/(png|jpeg|webp|gif|avif)`. Kích thước tổng (lấy từ `Content-Range`/`Content-Length`) ≤10 MB (mã `image_too_heavy`).
   - Kích thước ảnh: mở rộng `lib/image.ts` để đọc GIF (`GIF8`, width/height LE16 ở byte 6/8) và AVIF (box `ispe`).
   - Luật tối thiểu theo purpose: chuyển `checkDimensions` từ `uploads.ts` sang `lib/image-rules.ts` để upload và URL dùng chung. Avatar ≥128×128, logo ≥256×256, moment ≥400 cạnh ngắn, cover hồ sơ hoặc dự án ≥1200 px chiều ngang và là ảnh ngang. Cover **event** vẫn giữ 16:9 ≥1600×900.
   - Ghi kết quả vào `remote_images` (xem migration bên dưới). Một URL đã `ok` và kiểm tra trong 24 giờ qua thì không fetch lại.
   - Cho phép **inject qua `ctx`** (thêm `ctx.fetchImage`, cùng kiểu với `fetchPage` trong `context.ts`, và trong `test/helpers.ts` `setup()`), để test chạy bằng fixture, không gọi mạng.
4. **Migration `035_remote_images.sql`**: tạo bảng `remote_images(url text primary key, final_url text, mime text, width int, height int, bytes int, status text check (status in ('ok','broken')), fail_count int default 0, checked_at timestamptz, created_at timestamptz default now())` và index `(checked_at) where status = 'ok'`. Thêm khối RLS như các migration trước (bật RLS, revoke `anon`/`authenticated`). **Không** đụng vào check của `uploads.purpose`, vì các dòng cũ vẫn ở đó.
5. **`POST /images/check`** `{url, purpose}` → `{url, width, height, mime}`: cần `requireUser`, giới hạn khoảng 20 lần/phút mỗi người (config rate limit trên route). Lỗi trả về dạng `{error:{code,message}}` bằng `AppError`.
6. **Schema zod** trong `lib/validate.ts`: thêm `remoteImageUrl` (https, ≤2048, không phải `UPLOAD_PATH`). Giữ `imageUrl` cho các trường event và thêm comment "event media only".
   Helper `keepOrProbe(before, after, purpose)`: nếu `after === before` thì bỏ qua (giá trị upload cũ vẫn lưu được, theo D4); nếu khác thì `remoteImageUrl` + `probeImage`, và lưu `final_url` đã chuẩn hoá.
7. **Áp vào các chỗ ghi**: `routes/artists.ts` (`imageUrl`, `coverUrl` trong `ProfilePatch`), `routes/organizer/events.ts:162-163`, `routes/admin/ops.ts` (`logoUrl` của nhà tổ chức), `routes/me.ts:63`, `routes/projects.ts` (`coverUrl`), `routes/moments.ts` (bỏ yêu cầu phải có upload; giữ advisory lock, `MOMENTS_MAX`, và điều kiện xác nhận số điện thoại với hồ sơ công khai).
8. **`routes/uploads.ts`**: chỉ nhận `purpose ∈ {cover, logo, recap}` cho upload mới. `avatar` và `moment` trả lỗi 400 `upload_not_allowed`: `L('Paste an image link instead', 'Hãy dán link ảnh thay vì tải lên')`. `GET /files/*` **giữ nguyên regex** để file cũ vẫn mở được.
9. **Job `checkRemoteImages`** trong `src/jobs.ts`: mỗi lượt kiểm tra lại tối đa 20 URL có `checked_at` cũ hơn 7 ngày, cách nhau ít nhất 2 giây nếu cùng host. Sau 3 lần lỗi liên tiếp thì đặt `status='broken'` và `notifyUser` cho chủ sở hữu (tìm chủ qua `artists.image_url/cover_url`, `organizers.logo_url/cover_url` (gửi cho team qua `notifyOrganizer`), `users.photo_url`, `moments.url`, `projects.cover_url`), với `dedupeKey: 'broken-image:<sha256(url)>'`.
   **Không tự xoá giá trị** trong các bảng đó; client đã có ảnh dự phòng. Thêm danh sách ảnh hỏng vào Console (tab Báo cáo, hoặc `console/artists`) nếu còn thời gian.
10. **(Tuỳ chọn, liên quan "hiển thị hoàn hảo")**: khi nhà tổ chức lưu một event *posted* mà `coverUrl`/`logoUrl` là URL ngoài, server tải ảnh về và lưu thành upload `cover`/`logo` (cùng luật kích thước), để cover event không bao giờ mất link trong lúc đang truyền thông. Event Radar thì không làm việc này (D3).

### A.3 Web
1. **`kd/ui/remote-img.tsx`** (`'use client'`): `RemoteImg({src, alt, width?, height?, className, fallback})` dùng `referrerPolicy="no-referrer"`, `loading="lazy"`, `decoding="async"`, và `onError` → hiển thị `fallback`. Dùng trong `Avatar` (dự phòng là chữ cái đầu), `Art` (dự phòng là nền màu family), `MomentsGrid` (cả ô lẫn lightbox), và các ô preview.
2. **`kd/ui/image-link.tsx`**: `ImageLinkField({lang, purpose, label, value, onChange, suggestions?})` gồm `Input type="url"`; khi dán hoặc blur thì gọi `POST /images/check` (debounce 400 ms) → hiện preview kèm kích thước, hoặc `FieldError` với message của server; có nút "Xoá". Hint chỉ ghi định dạng, ví dụ `https · JPG, PNG, WebP · ≥1200 px`. Gợi ý một chạm (tuỳ chọn): "Dùng ảnh Google" cho avatar người dùng; "Dùng ảnh từ SoundCloud/Spotify" cho nghệ sĩ (lấy `thumbnail_url` qua oEmbed từ link của họ, xem B.3).
3. **Thay** `ImagePick` ở `kd/artist/profile.tsx`, `kd/artist/parts.tsx` (xoá component cũ), `kd/studio/profile.tsx`, `kd/console/organizers/drawer.tsx`, `kd/web/projects/manage.tsx` bằng `ImageLinkField`. Trong `kd/moments.tsx`, nút "+ Thêm" mở `Sheet` gồm `ImageLinkField` + chú thích, rồi `POST /me/moments {url}`.
4. **Giữ** `Upload` cho event (`console/events/parts.tsx`, `studio/wizard.tsx`) cùng recap và thảo luận (D2).
5. Sửa các comment lỗi thời về CSP. Thêm chuỗi vào `copy.ts` của từng màn hình.

### A.4 Test
- `test/remote-images.test.ts` (mới): chuẩn hoá URL, host bị từ chối, chuyển đổi Dropbox/GitHub/Drive, lấy `og:image` từ fixture HTML, luật kích thước theo purpose, từ chối IP private/`localhost` (tái dùng `isPrivateAddress`), đọc kích thước GIF/AVIF.
- `test/moments.test.ts`: nhận URL, không cần upload, URL hỏng bị từ chối, upload `moment` trả 400.
- `test/artists.test.ts`: `PATCH` từ chối đường dẫn `/files/...` mới nhưng nhận lại giá trị cũ không đổi.
- `test/jobs.test.ts`: 3 lần lỗi thì `broken` và có một thông báo (dedupe).
- `e2e/next/studio-artist.spec.ts` (luồng dán link), `e2e/next/profiles.spec.ts` (moments bằng link; ảnh hỏng hiện chữ cái đầu). Trong e2e, API dùng PGlite riêng nên **không được** gọi mạng: cho fetcher của e2e đọc fixture (ví dụ khi `FF_FIXTURE_FETCH=1`) hoặc seed sẵn `remote_images`.

### A.5 Tài liệu
- `CLAUDE.md`: thêm một dòng quy tắc **Images** ("event media is uploaded; every other image is an https link checked by `probeImage`; never add an upload purpose for profiles").
- `docs/CURRENT_ARCHITECTURE.md` (mục uploads) và roadmap (D0).

---

## 4. Workstream B: nghe mix trên trang nghệ sĩ, like và bình luận

### B.1 Trải nghiệm
- Trên `/a/<slug>`: thêm mục **"Nghe"** trong cột chính, ngay sau tab lịch diễn (`EventTabs`) và trước `ProfileMoments`.
  Mix được ghim hiện to, bấm là phát. Các mix còn lại là hàng gọn: thumbnail, tên, tag nhà cung cấp, thời lượng nếu có, ♥ kèm số, 💬 kèm số.
- **Facade**: không tải iframe hay request nào của bên thứ ba cho đến khi người dùng bấm phát (trang nhẹ, không cookie bên thứ ba khi chưa tương tác). Mỗi lúc chỉ **một** iframe: bấm mix khác thì iframe cũ trở lại thành facade.
- Bình luận mở trong `Sheet` (bên phải trên desktop, từ dưới lên trên mobile). Có một cấp trả lời, tuỳ chọn ghi mốc thời gian "tại mm:ss" (giống `heardAt` của track ID ở thảo luận event).
  Like hay bình luận khi chưa đăng nhập → `kd.openSignIn()`. Bình luận khi chưa xác nhận số điện thoại → `PhoneSheet`.
- Không có mix nào nhưng nghệ sĩ có link SoundCloud, Mixcloud hoặc Spotify **và** profile đã có chủ hoặc được xác minh → hiện **một embed cấp profile** (widget user của SoundCloud hoặc artist embed của Spotify), không có like hay bình luận. Đây là B-2, tuỳ chọn.
- **Studio nghệ sĩ** `/studio/artist/mixes` (trang mới, thêm mục vào rail ở `kd/artist/root.tsx`): bảng các hàng; drawer "Thêm mix" (dán link → server trả preview → lưu); sắp xếp bằng nút lên/xuống, ghim, gắn "Thu tại sự kiện…" (chọn từ các event đã diễn), xoá. Tối đa 12 mix.

### B.2 Migration `036_artist_mixes.sql`
```sql
create table artist_mixes (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists on delete cascade,
  provider text not null check (provider in ('soundcloud','mixcloud','spotify')),
  kind text not null,                 -- track | set | playlist | show | episode | album | artist
  url text not null,                  -- canonical page URL
  embed_src text not null,            -- iframe src we rebuilt, host on the allowlist
  title text not null, author_name text, thumbnail_url text, duration_s int,
  event_id uuid references events on delete set null,   -- "recorded at"
  pinned boolean not null default false, sort int not null default 0,
  like_count int not null default 0, comment_count int not null default 0,
  created_by uuid not null references users on delete cascade,
  created_at timestamptz not null default now(), checked_at timestamptz,
  removed_at timestamptz, removed_by uuid references users on delete set null, removed_reason text,
  unique (artist_id, url)
);
create table artist_mix_likes (mix_id uuid references artist_mixes on delete cascade, user_id uuid references users on delete cascade,
  created_at timestamptz not null default now(), primary key (mix_id, user_id));
create table artist_mix_comments (id uuid primary key default gen_random_uuid(), mix_id uuid not null references artist_mixes on delete cascade,
  user_id uuid not null references users on delete cascade, parent_id uuid references artist_mix_comments on delete cascade,
  body text not null, at_s int check (at_s >= 0), status text not null default 'visible' check (status in ('visible','hidden','removed')),
  report_count int not null default 0, created_at timestamptz not null default now(), edited_at timestamptz);
create table artist_mix_comment_reports (comment_id uuid references artist_mix_comments on delete cascade, user_id uuid references users on delete cascade,
  reason text not null, created_at timestamptz not null default now(), resolved_at timestamptz, resolution text, primary key (comment_id, user_id));
-- + index (artist_id, sort) where removed_at is null; (mix_id, created_at) on comments; RLS block like 029/030.
```

### B.3 Danh sách nhà cung cấp: `festfinder-backend/src/lib/mixes.ts`
| Provider | URL nhận | oEmbed (không cần key) | Host iframe cho phép |
| --- | --- | --- | --- |
| SoundCloud | `soundcloud.com/*`, `on.soundcloud.com/*` (link rút gọn được resolve qua oEmbed) | `https://soundcloud.com/oembed?format=json&url=…&maxheight=166` | `w.soundcloud.com` |
| Mixcloud | `mixcloud.com/<user>/<show>/` | `https://app.mixcloud.com/oembed/?format=json&url=…` | `player-widget.mixcloud.com` (**kiểm chứng** bằng `html` mà oEmbed trả về) |
| Spotify | `open.spotify.com/(track|album|playlist|artist|show|episode)/<id>`, `spotify.link/*` | `https://open.spotify.com/oembed?url=…` | `open.spotify.com` (`/embed/…`) |

- Server **không bao giờ lưu hay render `html` của oEmbed**. Lấy `src` của thẻ iframe trong đó (Spotify có thể có sẵn `iframe_url`), kiểm tra host nằm trong danh sách trên và scheme là `https:`, rồi **dựng lại** query bằng tham số của mình:
  - SoundCloud: `auto_play` (chỉ bật khi mount do người dùng bấm), `visual=false`, `show_comments=false`, `hide_related=true`, `show_teaser=false`, `color` chọn màu trung tính (không lime, theo quy tắc một hành động lime).
  - Mixcloud: `hide_cover=1`, `light=0`, `autoplay=1` khi người dùng bấm.
  - Spotify: `theme=0`.
- Lưu `title`, `author_name`, `thumbnail_url` (một ảnh URL, đúng chính sách A), và `duration_s` nếu có.
- Fetch oEmbed qua `fetchPublic` (chặn SSRF, timeout 8 s) và inject qua `ctx.oembed` để test dùng fixture.
- `lib/network.ts`: thêm `mixcloud` vào `ARTIST_LINK` và `LINK_HOSTS` (`mixcloud.com`). Cột `links` là jsonb nên không cần migration.

### B.4 API: `festfinder-backend/src/routes/mixes.ts` (đăng ký trong `app.ts`)
- Công khai: `GET /artists/:slug` thêm `mixes` (đã ghim trước, rồi theo `sort`, tối đa 12, kèm số đếm). Thêm `GET /mixes/:id/comments?cursor=` (dùng `page` trong `http/sql.ts`).
- Trạng thái của người xem (`liked`) lấy qua `GET /artists/:slug/mixes/me` trong trình duyệt, để trang ISR vẫn cache được (`app.ts` đặt `private, no-store` cho phản hồi của người đã đăng nhập).
- Chủ profile (`requireWriter`): `GET|POST /me/artist/mixes` `{url, eventId?}`, `PATCH /me/artist/mixes/:id` `{title?, eventId?, pinned?}`, `DELETE /me/artist/mixes/:id` (xoá mềm), `PUT /me/artist/mixes/order`. Đặt `pg_advisory_xact_lock` như moments. Lỗi `mixes_full` khi vượt 12.
- Team: `POST /admin/artists/:id/mixes` cho nghệ sĩ Radar hoặc chưa có chủ, có `appendAudit`.
- Like (`requireUser`): `PUT /mixes/:id/like` và `DELETE /mixes/:id/like`, idempotent, cập nhật `like_count` trong transaction.
- Bình luận (`requireWriter`): `POST /mixes/:id/comments {body, parentId?, at?}` (`at` dạng `m:ss` hoặc `h:mm:ss` → giây, không vượt `duration_s` nếu biết). Dùng `checkPostText` và giới hạn 6/10 phút.
  `DELETE /mix-comments/:id` cho tác giả, chủ profile nghệ sĩ hoặc team. `POST /mix-comments/:id/reports` ẩn bình luận sau `HIDE_AFTER_REPORTS`.
- Kiểm duyệt: `GET /admin/mix-comments/reported`, `POST /admin/mix-comments/:id/remove|keep`, có audit, hiện trong tab **Báo cáo** của Console.
- Thông báo: chủ profile nghệ sĩ nhận khi có bình luận mới (`dedupeKey: mix-comment:<mixId>:<vnDate>`); tác giả bình luận gốc nhận khi có trả lời.
  `link: {screen: 'artist', slug, mixId}` → thêm nhánh trong `kd/app/inbox.tsx` để mở `/a/<slug>?mix=<id>`.
- Analytics: thêm `mix_play` vào `CLIENT_EVENTS` (props `kind` = provider, `surface`); thêm `mix_liked`, `mix_commented` vào `SERVER_EVENTS`. Không gửi tên hay nội dung.
- Quy tắc sản phẩm: like và số đếm **không bao giờ dùng để xếp hạng** nghệ sĩ trong thư mục hay gig (đúng tinh thần quy tắc follower count).

### B.5 SEO và AIO (`services/seo.ts` `buildArtistSeo`)
- Thêm vào `MusicGroup` mảng `track` gồm `MusicRecording` hoặc `MusicPlaylist`: `name`, `url` (trang của nhà cung cấp), `embedUrl`, `thumbnailUrl`, `duration` (ISO 8601), `interactionStatistic` (`LikeAction`, `CommentAction`), và `recordedAt: {'@id': <event url>#event}` nếu có gắn event.
- `/a/<slug>.md` liệt kê các mix. Thêm test trong `test/seo.test.ts`.

### B.6 Web
- **CSP** (`festfinder-web/next.config.ts`): thêm `frame-src https://w.soundcloud.com https://player-widget.mixcloud.com https://open.spotify.com` (thêm `https://www.mixcloud.com` nếu oEmbed trả host đó). **Không** thêm `script-src`, vì phase 1 không tải widget JS.
- `kd/ui/mix-player.tsx` (`'use client'`): `MixCard` hiện facade bằng `RemoteImg` và nút Play. Khi bấm thì mount `<iframe title=… src=embed_src allow="autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture" loading="lazy">`. Chiều cao: SoundCloud 166, Mixcloud 120 (classic) hoặc 60 (mini), Spotify 152 (compact) hoặc 352. Dùng một context `activeMixId` cho cả trang.
  Thử `sandbox` trên cả 3 nhà cung cấp; nếu Spotify không phát được thì bỏ sandbox cho Spotify và ghi lý do.
- `kd/web/artist/mixes.tsx`: mục "Nghe", nút like (`HeartIcon`, đổi sang fill khi đã like), `Sheet` bình luận (`TextArea` + ô "tại mm:ss" tuỳ chọn). Icon Phosphor đã có trong repo: `HeartIcon`, `ChatCircleIcon`, `PlayIcon`, `HeadphonesIcon`.
- `kd/artist/mixes.tsx` + `src/app/(kd)/studio/artist/mixes/page.tsx`: màn quản lý. Chuỗi đặt trong `kd/artist/copy.ts`.
- (B-3, tuỳ chọn) Trên trang event đã kết thúc: mục "Nghe lại" liệt kê các mix có `event_id` trỏ vào event đó.

### B.7 Test
- `test/mixes.test.ts`: fixture oEmbed cho cả 3 nhà cung cấp. Từ chối URL sai host hoặc kind. **Từ chối `html` có iframe trỏ sang host lạ hoặc `javascript:`**. Giới hạn 12. Like idempotent và số đếm đúng. Bình luận: cần số điện thoại, giới hạn tốc độ, `checkPostText`, báo cáo thì ẩn. Thông báo có dedupe. Audit khi team thêm mix.
- `test/seo.test.ts`: JSON-LD có `track`.
- `e2e/next/artist.spec.ts`: lúc đầu không có iframe; bấm Play thì có đúng một iframe với host trong danh sách; like khi chưa đăng nhập mở sheet đăng nhập.
- `e2e/next/studio-artist.spec.ts`: thêm mix (oEmbed dùng fixture hoặc seed thẳng vào DB).

---

## 5. Workstream C: nút đặt xe Grab và Green SM trên trang event

### C.1 Sự thật cần biết trước
- Lúc viết, cả **Grab lẫn Green SM (Xanh SM)** đều **không có API đặt xe công khai** cho bên thứ ba.
  GrabPlatform SDK (`github.com/grab/grabplatform-sdk-ios|android`) phục vụ GrabID và thanh toán, không phải đặt xe. Green SM có "Xanh For Business" (tài khoản doanh nghiệp) nhưng không công bố tài liệu deep link.
- Vì vậy "liên kết API" chia làm 3 phase:
  1. **Phase 1 (không cần hợp đồng):** mở app bằng URL scheme hoặc Android intent, truyền điểm đến khi tham số **đã kiểm chứng trên máy thật**, và **luôn chép địa chỉ** vào clipboard làm phương án dự phòng.
  2. **Phase 2 (cần hợp đồng):** deep link hoặc universal link của đối tác, kèm mã ghi nhận nguồn (ví dụ `sourceID` của Grab, OneLink).
  3. **Phase 3:** API ước tính giá hoặc đặt xe, nếu đối tác cấp.
- **Không đoán tham số trong production.** Tham số chưa kiểm chứng thì giữ ở chế độ `open+copy`.

### C.2 Danh sách app: `festfinder-backend/src/lib/rides.ts`
| App | Quốc gia (lấy theo `countryCode` của thành phố event trong `lib/places.ts`; không ghi cứng thành phố) | iOS | Android | Điểm đến |
| --- | --- | --- | --- | --- |
| Grab | VN, TH, SG, MY, ID, PH, KH, MM | App Store id `647268330` (bundle `com.grabtaxi.iphone`), scheme `grab://` | package `com.grabtaxi.passenger` | Ứng viên, **CHƯA KIỂM CHỨNG**: `grab://open?screenType=BOOKING&dropOffLatitude=…&dropOffLongitude=…&dropOffAddress=…` (đối tác thêm `sourceID`) |
| Green SM | VN (và LA, ID, PH: **kiểm chứng** theo thành phố) | App Store id `6446425595` | package: **kiểm chứng** trên trang Google Play | Chưa có tài liệu → `open+copy` |

- Nhật Bản (Tokyo) không có app nào trong danh sách, nên **không hiện nút**. Thành phố nào Green SM chưa chạy thì để danh sách cho phép ghi đè theo thành phố, ví dụ `onlyCities?: string[]`, có comment giải thích.
- Kiểm chứng scheme và package: xem intent-filter trong `AndroidManifest.xml` của APK (apktool) hoặc `CFBundleURLTypes` của bản iOS, rồi thử trên máy thật. Ghi kết quả vào comment kèm ngày kiểm.
- Tham số đối tác lấy từ env (`GRAB_PARTNER_SOURCE_ID`, `GREENSM_DEEPLINK_TEMPLATE`), không bao giờ ghi vào repo. Nếu sau này có nhiều đối tác thì chuyển sang bảng quản lý trong Console, giống `ticket_partners`.

### C.3 Dựng link ở một chỗ (presenter của event)
Chi tiết event trả thêm `rides`, và **chỉ** khi event `live`, chưa qua, và có `lat/lng` hoặc địa chỉ:
```ts
rides: { key: 'grab' | 'greensm'; name: string; prefilled: boolean; copyText: string;   // "Venue, address, city"
         android: string;   // intent://…#Intent;scheme=…;package=…;S.browser_fallback_url=<Play Store>;end
         ios: { app: string | null; store: string } }[]
```
Test thuần cho bộ dựng link: mã hoá địa chỉ tiếng Việt, độ chính xác lat/lng (6 chữ số), JP → `[]`, event đã qua hoặc huỷ → `[]`, thiếu toạ độ → chỉ `copyText`.

### C.4 Web
- `kd/web/event/ride.tsx` (`'use client'`): `RideButton` (tone `default` hoặc `ghost`, **không lime**, `CarProfileIcon` hoặc `TaxiIcon`, nhãn "Đặt xe") và `RideSheet` liệt kê các app, mỗi app một hàng ("Grab · Điểm đến: <venue>").
  Khi chạm vào một app:
  1. `navigator.clipboard.writeText(copyText)`.
  2. Gửi beacon đếm click (C.5).
  3. Android: `location.href = android` (Chrome tự về Play Store nhờ `S.browser_fallback_url`). iOS: `location.href = ios.app`; sau khoảng 1,2 s, nếu trang vẫn hiển thị (`document.visibilityState === 'visible'`) thì chuyển sang `ios.store`.
  4. App chế độ `open+copy` thì hiện toast "Đã chép địa chỉ, dán vào ô điểm đến".
- Desktop: sheet hiện `QrCode` (`kd/ui/qr.tsx`) trỏ tới `https://feestfinder.com/e/<slug>?ride=1`. Trang event thấy `?ride=1` thì tự mở sheet ở phía client.
- Trình duyệt trong app (Zalo, Facebook, Messenger, Instagram, TikTok, rất phổ biến ở VN) thường chặn custom scheme. Nhận diện UA và hiện hàng "Mở bằng trình duyệt" (chép link trang).
- Vị trí: `kd/web/event/page.tsx` (hàng địa điểm ở hero, cạnh "Chỉ đường"; và mục `#venue`), `kd/app/event.tsx` (thêm một `kd-lrow` "Đặt xe tới đây" dưới hàng địa điểm; và mục venue). Ẩn với event đã qua.

### C.5 Đếm (tuỳ chọn nhưng nên làm: nhà tổ chức thấy được giá trị)
- Thêm `ride_click` vào `CLIENT_EVENTS` (props `kind` = app, `surface` = `web_event` | `app_event`).
- Migration `037_ride_clicks.sql`: `alter table event_metrics_daily add column ride_clicks int not null default 0`. Mở rộng `countEventMetric` cho `'ride_clicks'`.
- `POST /events/:id/ride-clicks {app, src}`: không cần đăng nhập, loại bot bằng `deviceOf`, chống trùng 30 phút như `/go`. Gửi bằng `navigator.sendBeacon`.
- Studio insights (`routes/organizer/insights.ts` và màn hình tương ứng): thêm chỉ số "Lượt đặt xe".

### C.6 Test
- Unit test cho `lib/rides.ts` và presenter (như C.3).
- `e2e/next/event.spec.ts`: event VN có địa điểm → có nút; sheet có Grab và Green SM; với UA Android (device `Pixel 7`) thì href bắt đầu bằng `intent://`, với UA iPhone thì bắt đầu bằng `grab://` hoặc link App Store; trên desktop thì hiện QR; event JP không có nút.
- **Kiểm tra bắt buộc trên máy thật** (ghi kết quả vào PR): iOS Safari, iOS Chrome, Android Chrome, Samsung Internet, trình duyệt trong Zalo và Facebook; mỗi nơi thử khi có cài app và khi không cài app.

### C.7 Việc kinh doanh cho Phase 2 (chủ sản phẩm làm, không phải agent)
- Grab: liên hệ đội đối tác (Grab for Business / Grab Ads) để xin deep link đối tác có mã nguồn và universal link (không bị cảnh báo "không mở được trang" trên iOS).
- Green SM: liên hệ qua kênh doanh nghiệp trên greensm.com, xin đặc tả deep link có điểm đến kèm ghi nhận nguồn.

---

## 6. Workstream D: bỏ TP.HCM ghi cứng trong hướng dẫn AI

### D.1 Lỗi hiện tại
- `GET /events/:id/guide` (`festfinder-backend/src/routes/event-actions.ts:169`) dựng một `GuideEvent` rồi gọi `ctx.guide.generate(...)`. Đây là màn hình `/app/guide/<slug>`.
- `services/guide.ts`:
  - `SYSTEM` luôn viết "FeestFinder's local guide for Ho Chi Minh City, Vietnam".
  - `prompt()` nối thêm `'HCMC'` vào dòng `Venue:`.
  - Dòng giá vé ghi cứng `` `${ev.priceFrom} VND` ``.
- Hậu quả: event ở Hà Nội, Đà Nẵng, Nha Trang, Bangkok, Tokyo, Singapore hay Bali nhận gợi ý quán xá ở TP.HCM, và giá vé bị ghi sai đơn vị tiền.
- Quy tắc trong `CLAUDE.md`: thành phố lấy từ `lib/places.ts`; giá là số nguyên theo `events.currency`, hiển thị bằng `formatMoney`.

### D.2 Cách sửa
1. **`GuideEvent`**: thêm `city: string` (slug) và `currency: string`.
   - Ở `event-actions.ts`, điền `city: ev.city` và `currency: ev.currency`. `liveEvent()` đã `select *` nên không cần đổi truy vấn.
2. **Tên địa phương** lấy từ `lib/places.ts`, không ghi cứng chữ nào:
   - Viết hàm `placeOf(slug)`: `cityBySlug(slug)` → `city.name.en`, rồi `countryByCode(city.countryCode)` → `country.name.en`. Prompt luôn viết bằng tiếng Anh; ngôn ngữ trả lời đã do dòng cuối của prompt quyết định.
   - Event không có thành phố hoặc slug lạ thì **không** rơi về TP.HCM. Bỏ hẳn tên thành phố, chỉ dùng địa chỉ và khu vực (`address`, `area`). Không dùng `cityOf()`, vì nó tự rơi về `DEFAULT_CITY` (TP.HCM).
3. **Tách phần dựng prompt thành hàm thuần và export ra**: `guideSystem(ev)` và `guidePrompt(ev, lang)`.
   - Ví dụ prompt hệ thống: `` `You are FeestFinder's local guide for ${city}, ${country}. Name real, well-known places in or near the given district. Keep every line under 18 words.` ``
   - Dòng `Venue:` dùng `[venueName, address, area, city, country]`, bỏ phần tử rỗng.
   - `ClaudeGuide.generate` gọi hai hàm này, nên test không cần gọi Anthropic.
4. **Giá vé**: event miễn phí (`entryMode === 'free'` hoặc không có `priceFrom`) thì giữ `'free entry'`; còn lại dùng `formatMoney(ev.priceFrom, ev.currency, 'en')` từ `lib/money.ts`.
5. **Cache cũ**: hướng dẫn đã lưu trong `ai_guides` sẽ tự hết hạn sau 24 giờ (`GUIDE_TTL_MS`).
   - **Không** xoá dòng nào trong production.
   - Nếu người dùng muốn làm mới ngay thì hỏi trước rồi mới chạy lệnh xoá các dòng của event ngoài TP.HCM, vì đó là thao tác xoá dữ liệu.
6. Không đổi schema, không cần migration, không đổi màn hình.

### D.3 Test
- Unit test trong `test/unit.test.ts`, hoặc file mới `test/guide.test.ts`:
  - Event Bangkok: `guidePrompt` và `guideSystem` chứa "Bangkok" và "Thailand", không chứa "Ho Chi Minh" hay "HCMC", và giá được định dạng theo THB.
  - Event Hà Nội: chứa "Hanoi" (đúng tên tiếng Anh trong `places.ts`).
  - Không có thành phố: không có tên thành phố nào, và không rơi về TP.HCM.
  - Event miễn phí: `free entry`.
- `test/attendee.test.ts`: test có sẵn "generates the AI local guide once…" đang dùng `FakeGuide`. Thêm một test kiểm tra `GuideEvent` mà `FakeGuide` nhận có `city` và `currency` đúng với event.
  - Nếu seed không có event ngoài TP.HCM thì tạo một event ở thành phố khác trong test, đừng sửa `fixtures/seed.ts` theo cách làm hỏng test khác.
- Chạy (từ `festfinder-backend/`): `npm run typecheck`, `node --test test/attendee.test.ts` và file unit test vừa sửa, rồi `npm test`.

### D.4 Xong khi
- Không còn chữ "Ho Chi Minh", "HCMC" hay "VND" nào ghi cứng trong `services/guide.ts`. Kiểm bằng `grep -nE "Ho Chi Minh|HCMC|VND" festfinder-backend/src/services/guide.ts`, kết quả phải rỗng.
- Thêm một dòng vào roadmap.

---

## 6b. Workstream E: widget góp ý và báo lỗi ngay trên site

Nguồn: `~/Downloads/feest_finder_feedback_widget_handoff.md` của chủ sản phẩm. Phần dưới **giữ mục tiêu** của tài liệu đó nhưng **đổi cách làm cho khớp quy ước repo**. Chỗ nào khác tài liệu gốc thì có ghi lý do.

### E.1 Khác với tài liệu gốc

| Tài liệu gốc | Trong repo này | Lý do |
| --- | --- | --- |
| `src/components/feedback/*.jsx` | `festfinder-web/src/kd/feedback/` (`widget.tsx`, `sheet.tsx`, `telemetry.ts`, `copy.ts`), mount trong `src/app/(kd)/layout.tsx` cạnh `<Scrollbars />` | Mọi màn hình nằm trong `src/kd/`; chuỗi viết bằng `{en, vi}` + `pick()` |
| `POST /api/v1/feedback` | `POST /feedback` trong `festfinder-backend/src/routes/feedback.ts` | API không có tiền tố `/api/v1`; Next proxy chuyển mọi đường dẫn không phải trang sang API |
| Payload snake_case | Body gửi lên API dùng camelCase như mọi route khác. Bản ghi được **xuất ra đúng schema snake_case `FeedbackPayload`** qua `GET /admin/feedback/:id/export` cho quy trình AI hoặc issue | Giữ quy ước API, mà vẫn đúng schema gốc ở đầu ra (quyết định D8) |
| Client tạo `ticket_id`, `created_at`, `user_info` | **Server** tạo `ticket_id` (`FF-FB-YYYYMMDD-XXXX`, ngày tính bằng helper `vn*` trong `lib/time.ts`, 4 ký tự base32 ngẫu nhiên, có unique constraint), `created_at`, và `user_info` lấy từ session | Không tin dữ liệu client gửi |
| Emoji ở các loại góp ý | Icon Phosphor Regular: `BugIcon`, `PaintBrushIcon`, `LightbulbIcon`, `QuestionIcon` | Giao diện Kính đêm |
| FAB cố định góc phải dưới, `z-index: 9999` | Nút tròn 44px kiểu glass (không lime), dùng biến CSS `--kd-fab-bottom` để **nằm trên** `.kd-tabbar`, `.kd-dock` và toast (`kd.css:214,219,353`). Ẩn ở `/studio/door`, `/kit`, lúc đang mở một Sheet, và khi in | Không che "Mua vé", tab bar hay điều khiển bản đồ; mỗi màn hình chỉ một hành động lime |
| Đính kèm base64 trong JSON | Multipart, tối đa 2 ảnh, mỗi ảnh ≤2 MB (PNG/JPEG/WebP). Lưu **riêng tư** (bảng `feedback_attachments` bytea, hoặc S3 key không public), chỉ admin xem được, **xoá sau 90 ngày** (job) | Ảnh chụp màn hình có thể lộ QR vé hay email; không đi qua `/files` công khai. Đây không phải ảnh hồ sơ nên không trái chính sách của A |
| Chụp màn hình bằng canvas | Phase 1: chọn, kéo-thả hoặc dán ảnh (điện thoại tự chụp màn hình được). Phase 2 tuỳ chọn: chỉ tải `html-to-image` khi bấm | Ảnh từ host khác làm canvas bị "taint", và canvas WebGL của bản đồ ra ảnh trống |
| Gửi thẳng lên GitHub Issues | Lưu DB + trang Console `/console/feedback` (bảng các hàng, drawer bên phải). Nút "Tạo GitHub issue" do team bấm (`GITHUB_TOKEN`, `FEEDBACK_GITHUB_REPO` lấy từ env, không có email hay tên người gửi). Webhook Slack/Discord tuỳ chọn (`FEEDBACK_WEBHOOK_URL`) chỉ gửi loại, tiêu đề, mã ticket và link Console | Không tự công bố nội dung của người dùng ra ngoài |

### E.2 Giao diện (các bước như tài liệu gốc)
1. Nút mở ra `Sheet` → **chọn loại**: `bug`, `ui_ux`, `feature`, `support` (dùng `Option`/`Segmented` trong `kd/ui/forms.tsx`).
2. **Form:**
   - `title` (≤120, bắt buộc), `description` (≤4000, bắt buộc), `csatRating` 1–5 (tuỳ chọn).
   - Nếu là `bug` thì thêm `severity` (low/medium/high/critical) và `stepsToReproduce` (≤2000).
   - Ảnh đính kèm.
   - Khách chưa đăng nhập: thêm `name` (tuỳ chọn) và `email` (bắt buộc, kiểm định dạng).
3. Một hàng thu gọn **"Đính kèm tự động"** liệt kê đúng dữ liệu sẽ gửi (trang, trình duyệt, kích thước màn hình, lỗi gần nhất). Đây là liệt kê dữ liệu, không phải dòng giải thích.
4. **Thành công**: mã ticket kèm nút Đóng. Nút gửi là hành động lime duy nhất trong sheet.
5. Thêm lối vào phụ: mục "Góp ý / Báo lỗi" trong `WebFooter`, menu tài khoản và `/app/settings`.

### E.3 Telemetry (`kd/feedback/telemetry.ts`, cài một lần ở layout gốc)
- Gồm: `pagePath` (**bỏ query string**, giữ hash nếu có), `userAgent`, `screen`, `viewport`, `dpr`, `language`, `lang` của site, `displayMode` (PWA standalone hay không), `buildId` (`VERCEL_GIT_COMMIT_SHA`, inline lúc build).
- Lỗi: ring buffer 5 lỗi gần nhất từ `error` và `unhandledrejection` (đường dẫn file bỏ query, mỗi lỗi ≤500 ký tự) + **lỗi API gần nhất** (method, path, status, `error.code`), thêm hook vào `FF.api` trong `src/runtime/ff.ts`.
- Không gửi query string vì nó có thể chứa `?auth=…` khi quay về từ OAuth hay token khác. Không gửi IP, không gửi cookie.

### E.4 Backend
- **Migration `038_feedback.sql`**:
  - `feedback(id, ticket_id unique, type check, severity check, title, description, steps, csat int check 1..5, user_id references users on delete set null, guest_name, guest_email, telemetry jsonb, status check ('new','triaged','in_progress','done','wont_fix') default 'new', github_issue_url, created_at)`.
  - `feedback_attachments(feedback_id, n, mime, bytes, data bytea, created_at)`.
  - Khối RLS như các migration trước.
- **`POST /feedback`**:
  - Multipart, kiểm bằng zod qua `parse()`.
  - Đã đăng nhập thì `user_id` lấy từ session; khách thì bắt buộc email.
  - Chống spam: giới hạn 5 lần/giờ mỗi IP hoặc user, có trường honeypot.
  - Trả `{ ok: true, ticketId }`.
- **Admin** (`requireAdmin`): `GET /admin/feedback` (lọc theo loại, trạng thái, mức độ), `PATCH /admin/feedback/:id` (đổi trạng thái), `GET /admin/feedback/:id/attachments/:n`, `GET /admin/feedback/:id/export` (snake_case `FeedbackPayload`), `POST /admin/feedback/:id/github`. Mọi thay đổi ghi `appendAudit`.
- **Job** trong `jobs.ts`: xoá ảnh đính kèm cũ hơn 90 ngày. Đây là việc xoá theo chính sách lưu trữ đã ghi trong plan; cần chủ sản phẩm xác nhận con số 90 ngày.
- **Analytics**: thêm `feedback_sent` vào `SERVER_EVENTS` (prop `kind` = loại). Không gửi nội dung hay email.

### E.5 Test và tiêu chí nghiệm thu (theo mục 5 của tài liệu gốc)
- `test/feedback.test.ts`:
  - Validate: trường bắt buộc, khách phải có email, vượt độ dài.
  - Định dạng `ticket_id` đúng và không trùng.
  - `user_id` lấy từ session, bỏ qua giá trị client gửi.
  - Query string bị bỏ khỏi đường dẫn trang.
  - Giới hạn số lượng, kích thước và loại ảnh đính kèm; rate limit.
  - Chỉ admin xem được danh sách và ảnh.
  - `export` khớp đúng schema snake_case gốc.
  - Job xoá ảnh sau 90 ngày.
- `e2e/next/feedback.spec.ts`:
  - Nút hiện trên `/`, `/e/<slug>`, `/a/<slug>`, `/app`, `/console`.
  - Ở 375×812, nút không đè lên Dock "Mua vé" hay tab bar.
  - Chọn `bug` thì hiện các trường riêng của bug; thiếu trường bắt buộc thì báo lỗi.
  - Gửi xong thấy mã ticket; Console hiện bản ghi đó.

### E.6 Quyết định thêm
- **D8**: body API dùng camelCase, còn đầu ra export đúng schema snake_case (mặc định), *hay* chính body API cũng snake_case.
- **D9**: giữ ảnh đính kèm 90 ngày (mặc định); có tự tạo GitHub issue hay không (mặc định: không, team bấm tay).

---

## 7. Công cụ hỗ trợ (MCP, skill, repo)

**Đã có trong repo hoặc phiên này**
- Skill của project: `feestfinder-migration` (dùng cho 035–037), `feestfinder-preview`, `feestfinder-ship` (chỉ khi được bảo), `feestfinder-radar-adapter` (không cần cho việc này).
- `.mcp.json`: Supabase MCP (chỉ đọc, staging) và Vercel MCP.
  Trong phiên viết plan, Supabase MCP báo **Unauthorized** (thiếu `SUPABASE_ACCESS_TOKEN`), còn Vercel MCP cần đăng nhập OAuth qua `/mcp`. Khi có quyền, chạy truy vấn này để đo lượng ảnh có thể tiết kiệm:
  `select purpose, count(*), pg_size_pretty(sum(bytes)) from uploads group by purpose;`

**Nên cài thêm (có hướng dẫn công khai)**
- **Chrome DevTools MCP** (`github.com/ChromeDevTools/chrome-devtools-mcp`): `performance_start_trace` đo LCP và CLS của `/a/<slug>` và `/e/<slug>` trước và sau thay đổi (facade embed, `width`/`height` cho ảnh).
- **Skills của Vercel** (`npx skills add vercel-labs/agent-skills`): `react-best-practices`, `web-design-guidelines` (kiểm tra ảnh, form, a11y).
- **Skill `webapp-testing` của Anthropic** (repo `anthropics/skills`): chạy Playwright với nhiều kiểu thiết bị.
- **Supabase agent skills** (`npx skills add supabase/agent-skills`), như Supabase MCP gợi ý.
- Next 16 trong repo khác với kiến thức cũ: đọc `festfinder-web/node_modules/next/dist/docs/` trước khi viết code (xem `festfinder-web/AGENTS.md`).

**Repo để tham khảo (không thêm làm dependency)**
- `paulirish/lite-youtube-embed`: mẫu facade cho embed.
- `iamcal/oembed`: danh sách nhà cung cấp oEmbed.
- **Không dùng** `react-player`: bundle nặng và tải SDK nhà cung cấp quá sớm.

---

## 8. Rủi ro và cách giảm

| Rủi ro | Giảm thiểu |
| --- | --- |
| Moments chỉ bằng URL làm fan khó đăng ảnh từ điện thoại (họ không có link sẵn) | Resolver `og:image` nhận link Google Photos, Imgur, Flickr; ghi trade-off vào roadmap (D0). Theo dõi số moments mới sau khi ra mắt. |
| Ảnh hotlink mất hoặc bị chặn hotlink | `no-referrer`, chặn link sắp hết hạn, job kiểm tra lại mỗi 7 ngày, ảnh dự phòng phía client, thông báo cho chủ. |
| Lộ IP người xem cho host ảnh hoặc embed | `no-referrer`; facade nên không có request bên thứ ba khi chưa bấm; proxy là phương án sau (D7). |
| SSRF qua probe ảnh hoặc oEmbed | Chỉ đi qua `fetchPublic` hoặc `fetchPublicBytes` (kiểm tra từng bước redirect, chặn IP private, giới hạn byte, timeout), giới hạn tốc độ `/images/check`. |
| XSS qua `html` của oEmbed | Không render `html`; dựng lại `src` từ danh sách host cho phép; CSP `frame-src` chỉ gồm 3 host. |
| Deep link sai làm người dùng mắc kẹt | Chỉ bật điểm đến sau khi kiểm chứng; luôn chép địa chỉ; Android có fallback URL; iOS có hẹn giờ chuyển App Store; desktop có QR. |
| Spam bình luận | Cần số điện thoại, giới hạn tốc độ, `checkPostText`, ẩn sau 3 báo cáo, hàng đợi kiểm duyệt trong Console. |

---

## 9. Định nghĩa "xong" cho từng workstream

- [ ] Typecheck sạch; test API của khu vực đó và `npm test` đều qua; `npm run test:screens` qua; có test mới như trong mục test của workstream.
- [ ] Xem bằng preview cả desktop lẫn mobile (375×812); chụp màn hình bằng chứng.
- [ ] Không ghi cứng thành phố, múi giờ hay `₫`; chuỗi có cả `en` và `vi`; mỗi màn hình chỉ một hành động lime.
- [ ] Đã cập nhật roadmap, `CURRENT_ARCHITECTURE.md` và `CLAUDE.md` nếu quy tắc đổi.
- [ ] Chưa commit hay push nếu người dùng chưa bảo.

---

## 10. Nguồn (tra ngày 2026-10-15)

- SoundCloud oEmbed: https://developers.soundcloud.com/docs/oembed · Widget API: https://developers.soundcloud.com/docs/api/html5-widget
- Mixcloud developers (oEmbed `app.mixcloud.com/oembed/`): https://www.mixcloud.com/developers/ · Widget API: https://www.mixcloud.com/developers/widget/ · Hướng dẫn embed: https://www.mixcloud.com/blog/2025/10/07/mixcloud-embeds
- Spotify embeds: https://developer.spotify.com/documentation/embeds · oEmbed: https://developer.spotify.com/documentation/embeds/tutorials/using-the-oembed-api · iFrame API (chỉ cho podcast episode): https://developer.spotify.com/documentation/embeds/references/iframe-api
- Grab: https://developer.grab.com/ · GrabPlatform SDK: https://github.com/grab/grabplatform-sdk-ios, https://github.com/grab/grabplatform-sdk-android · App Store id 647268330: https://apps.apple.com/DE/app/id647268330
- Green SM: https://en.wikipedia.org/wiki/Green_SM · Tải app: https://www.greensm.com/vn-vi/download · App Store: https://apps.apple.com/vn/app/green-sm-di-chuy%E1%BB%83n-thu%E1%BA%A7n-%C4%91i%E1%BB%87n/id6446425595?l=vi · Doanh nghiệp: https://www.greensm.com/vn-vi/business-transport
- Mẫu deep link (tham khảo cách làm): https://developer.uber.com/docs/deep-linking
- Chrome DevTools MCP: https://github.com/chromedevtools/chrome-devtools-mcp · Vercel agent skills: https://vibeindex.ai/collection/vercel-labs/agent-skills · Anthropic webapp-testing: https://www.mdskills.ai/skills/webapp-testing
