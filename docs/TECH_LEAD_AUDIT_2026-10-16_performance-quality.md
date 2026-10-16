# Tech lead audit lần 2: tốc độ tải và chất lượng code

- Ngày: 2026-10-16, sau khi `cebeb3d` lên production · Bổ sung cho `docs/TECH_LEAD_REVIEW_2026-10-16.md` (vận hành và trải nghiệm). File này chỉ nói về **tốc độ tải** và **chất lượng code**, với số đo thật.
- Cách đo: bản build production trong `festfinder-web/.next` (từ `npm run test:screens`), `curl` tới feestfinder.com từ Việt Nam, Chromium giả lập điện thoại 375px trên feestfinder.com đọc `performance.getEntriesByType`, và đếm trong mã nguồn. Advisor của Supabase chưa chạy được vì `SUPABASE_ACCESS_TOKEN` chưa có trong môi trường của agent; chủ sản phẩm chạy "Performance Advisor" và "Security Advisor" trong dashboard Supabase rồi dán kết quả vào đây.

---

## 1. Kết luận ngắn

Site đã nhanh ở phần hạ tầng: HTML trang chủ và trang sự kiện có CDN cache (`x-vercel-cache: HIT`, TTFB 90 ms), JS và CSS nén Brotli, file tĩnh `immutable`, server pages cache 60 giây, DB có 122 chỉ mục đúng chỗ. **Phần lãng phí nằm ở những gì tải xuống máy khách**: trên điện thoại, trang chủ tải khoảng **645 KB JS thô, 190 KB CSS thô, 220 KB font và 737 KB ảnh**, trong đó khoảng **300 KB font và CSS là không cần cho trang tiếng Việt** và ảnh bìa hotlink không được thu nhỏ. Về chất lượng code: không có lint, 764 chỗ `any` trong API, 97 `select *`, hai file hơn 1.000 dòng, và một số helper viết hai lần. Không có gì nguy hiểm, nhưng đủ để làm chậm người mới vào dự án và che lỗi kiểu.

Ba việc **nhanh nhất, lợi nhất**: (1) khai báo font gọn, bỏ gói JP và Thai mặc định, tiết kiệm khoảng 280 KB mỗi trang; (2) thu nhỏ ảnh bìa qua bộ tối ưu ảnh, tiết kiệm 500–700 KB trên trang chủ; (3) bật ESLint với `typescript-eslint` ở mức "recommended-type-checked" và cấm `any` mới. Ba việc này không đổi hành vi, làm được trong hai ngày.

---

## 2. Số đo

### 2.1 Mạng, từ Việt Nam, trang tiếng Việt

| Trang | TTFB (curl) | TTFB (trình duyệt) | HTML Brotli | Ghi chú |
| --- | --- | --- | --- | --- |
| `/` | 320 ms | 92 ms | 11,7 KB | CDN HIT, revalidate 60 s |
| `/e/artbat-9vvp` | 410 ms | 90 ms | — | CDN HIT |
| `/list` | 390 ms | 406 ms | — | Dynamic: proxy → API → DB mỗi lần |
| `/a` | 550 ms | — | — | Dynamic |
| `/app/tickets` | 680 ms | — | — | Dynamic, cần phiên |
| `/events?limit=24` (API qua proxy) | 445 ms | — | 8,3 KB | `x-vercel-cache: MISS` mỗi lần; `cache-control: public, max-age=0, must-revalidate` |
| `/map/style.json` | — | — | — | `max-age=300`, MISS |

TTFB curl cao hơn trình duyệt vì curl không có kết nối sẵn (TLS mới mỗi lần). Server ở Tokyo, người dùng ở Việt Nam: khoảng 60–80 ms round-trip là sàn.

### 2.2 Tải xuống trên điện thoại (375px), lần đầu, không cache

| Loại | Trang chủ | Trang sự kiện | `/list` |
| --- | --- | --- | --- |
| JS | 14 file, ~645 KB thô (lớn nhất 230 KB: React và Next; 166 KB: mã của site) | 12 file, ~600 KB | 10 file |
| CSS | 3 file, 190 KB thô: **98 KB là 124 `@font-face` của Noto Sans JP**, 90 KB là Tailwind + `kd.css` | như trên | 6 file, 272 KB |
| Font | 5 file, ~220 KB: latin-ext **164 KB**, latin 35 KB, vietnamese 14 KB, **3 lát Noto Sans JP ~59 KB** | như trên | như trên |
| Ảnh | 3 ảnh, **737 KB** (ảnh bìa hotlink từ nhà tổ chức, không thu nhỏ) | 737 KB | — |
| Số request | 29 | 31 | 23 |
| DOMContentLoaded | 138 ms | 325 ms | 432 ms |
| `load` | 265 ms | 414 ms | 1.268 ms |
| CLS | 0 | 0 | 0 |

Hai điểm bất ngờ:

1. **Font latin-ext 164 KB tải trên trang tiếng Việt.** Trong `@fontsource-variable/noto-sans/wght.css`, ký tự `₫` (U+20AB) và vài dấu nằm trong `unicode-range` của cả `vietnamese` lẫn `latin-ext`; trình duyệt chọn face khai báo sau, là latin-ext, và tải cả 164 KB cho một ký tự.
2. **Noto Sans JP tải 3 lát (~59 KB) và 98 KB CSS trên mọi trang**, dù không có chữ Nhật. CSS vì gói JP khai báo 124 `@font-face`; các lát tải vì một vài ký hiệu (mũi tên, dấu chấm giữa, dấu tick) không có trong Noto Sans nên trình duyệt đi xuống JP trong chuỗi `font-family`.

### 2.3 Mã nguồn

| Chỉ số | API (`festfinder-backend/src`) | Web (`festfinder-web/src`) |
| --- | --- | --- |
| File / dòng | 128 / 22.755 | 315 / 33.768 |
| Test | 44 file, 7.144 dòng; 368 test | e2e 28 file, 4.610 dòng; 211 test |
| `any` | **764** | 41 |
| `@ts-ignore` / `TODO` / `console.log` | 0 / 0 / 0 | 0 / 0 / 0 |
| `select *` | 97 | — |
| File > 500 dòng | `services/seo.ts` 1.164, `routes/admin/ops.ts` 1.030, `routes/catalog.ts` 593, `routes/organizer/events.ts` 557 | `studio/wizard.tsx` 629, `studio/editor.tsx` 569, `console/events/form.tsx` 554, `studio/copy.ts` 544 |
| Linter | không có (ghi là "accepted" trong `TECH_DEBT.md` #15) | không có |
| Client component | — | 123 / 245 file `.tsx` có `'use client'` |
| Ảnh | — | 31 `<img>`, 1 `next/image`, 10 `loading="lazy"`, 0 `fetchpriority` |
| Phosphor icons | — | 140 icon khác nhau, 107 import theo icon từ `/ssr`, 2 import từ gói gốc |
| Zod inline trong route | 159 `parse(z.object(...))` trên 365 `parse(` | — |
| Promise.all trong route/service | 59 chỗ | — |
| Vòng `for … of` có `await` truy vấn bên trong | 53 chỗ (hầu hết trong job và admin; đường đọc nóng `catalog.ts`, `eventpage.ts` dùng `Promise.all`) | — |
| Pool DB | `max: 10`, `connectionTimeoutMillis: 10s`, **không có `statement_timeout`** | — |

Tốt và nên giữ: không `ts-ignore`, không `console.log`, không TODO treo; `noUnusedLocals` bật; icon import theo từng icon (tree-shake được); trang chủ và trang sự kiện cache 60 s; `generateStaticParams` cho các trang app theo sự kiện; `kd.css` chỉ 33 KB.

---

## 3. Tối ưu tốc độ tải, xếp theo lợi ích trên công sức

Mỗi dòng: việc, bằng chứng, cách làm, lợi ích ước lượng, cách kiểm. Số KB là thô, Brotli thường giảm JS/CSS còn 25–30%, font woff2 thì không giảm thêm.

### P1. Font: khai báo gọn, chỉ tải bộ ký tự trang cần (tiết kiệm ~280 KB mỗi trang, nửa ngày)

- **Bằng chứng:** mục 2.2, điểm 1 và 2.
- **Làm:**
  1. Bỏ import `@fontsource-variable/noto-sans/wght.css`, `noto-sans-thai/wght.css`, `noto-sans-jp/wght.css` trong `app/(kd)/layout.tsx`.
  2. Viết `src/kd/fonts.css` với đúng 3 `@font-face` cho Noto Sans (`vietnamese`, `latin`, `latin-ext`), trỏ vào file `.woff2` trong `node_modules/@fontsource-variable/noto-sans/files/` (hoặc chuyển sang `next/font/local`, cho Next tự host và preload). Sửa `unicode-range` của `latin-ext` để **bỏ** các điểm mã trùng với `vietnamese` (U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB), để `₫` lấy từ lát vietnamese 14 KB.
  3. Thai và JP: chỉ khai báo `@font-face` cho các dải ký tự của chính họ (Thai U+0E01-0E5B; JP: hiragana, katakana, CJK U+3000-30FF, U+4E00-9FFF, U+FF00-FFEF), **không** kèm lát latin/vietnamese của hai gói đó. Vì `unicode-range` làm trình duyệt chỉ tải khi gặp ký tự, có thể giữ trong `font-family` chung mà không tốn gì trên trang Việt.
  4. Ký hiệu đang kéo JP vào (mũi tên, tick, chấm giữa): thay bằng icon Phosphor hoặc để rơi về font hệ thống bằng cách đặt `system-ui` trước JP trong chuỗi `font-family` cho dải ký hiệu (U+2000-2BFF).
  5. `<link rel="preload">` cho lát `vietnamese` và `latin` (Next làm tự động với `next/font/local`).
- **Lợi:** CSS từ 190 KB còn ~92 KB; font từ 220 KB còn ~50 KB; bớt 4 request.
- **Kiểm:** e2e mới: trên `/` tiếng Việt, `performance.getEntriesByType('resource')` không có file `latin-ext`, `jp`, `thai`; tổng font < 60 KB. Thêm một trang có tên sự kiện tiếng Thái trong seed để kiểm Thai tải đúng lúc.

### P2. Ảnh bìa qua bộ tối ưu ảnh (tiết kiệm 500–700 KB trên trang chủ, 1 ngày)

- **Bằng chứng:** 3 ảnh = 737 KB trên trang chủ 375px; 31 `<img>` so với 1 `next/image`; 6/8 ảnh không có `width`/`height` (CLS đo được 0 nhờ `aspect-ratio` trong CSS, nhưng không bảo đảm ở mọi thẻ).
- **Làm:**
  1. Bật Vercel Image Optimization: `images.remotePatterns` trong `next.config.ts` cho host upload (S3) và cho ảnh link đã qua `probeImage` (quy tắc "Images" trong `CLAUDE.md`). Ảnh hotlink từ host lạ dùng `unoptimized` kèm `loading="lazy"`.
  2. Thay `<img>` của thẻ sự kiện, hero, cover nghệ sĩ và NTC bằng `next/image` với `sizes` đúng cột (`(max-width: 760px) 100vw, 33vw`), `priority` cho hero duy nhất, `loading="lazy"` cho còn lại. Giữ `referrerPolicy="no-referrer"` và fallback của `kd/ui/covers.tsx`.
  3. Khi upload cover (`POST /uploads?purpose=cover`), tạo sẵn bản 1200 và 600 px dạng WebP trong `services/storage.ts` (sharp chạy được trên Vercel), lưu URL bản nhỏ vào `events.cover_small` (migration `04x`). Trang danh sách dùng bản nhỏ.
- **Lợi:** LCP trên 4G giảm rõ nhất trong mọi việc ở đây; chi phí băng thông S3 giảm.
- **Kiểm:** Lighthouse CI (P7) với ngưỡng "ảnh đúng kích thước"; e2e: hero có `fetchpriority="high"`, các ảnh thẻ có `loading="lazy"`.

### P3. Cache API công khai ở CDN (TTFB `/list`, `/a`, bản đồ: 400 ms → ~100 ms, 1 ngày)

- **Bằng chứng:** `/events?limit=24` luôn `MISS` với `max-age=0`; `/list` TTFB 406 ms so với 92 ms của trang chủ đã cache.
- **Làm:**
  1. Trong `app.ts` hook `onSend`: với request **không có phiên** và route đọc công khai (`/events`, `/events/map`, `/artists`, `/organizers/:slug`, `/collections/:slug`, `/shelves`, `/map/style.json`), đặt `cache-control: public, s-maxage=60, stale-while-revalidate=300`. Request có phiên giữ `private, no-store` như hiện nay.
  2. `/map/style.json` lên `s-maxage=3600` (chỉ đổi khi deploy; tên file tile đã có build folder riêng).
  3. Web proxy (`src/proxy.ts`) đang `cache: 'no-store'` khi chuyển tiếp: giữ cho request có cookie, nhưng cho request ẩn danh trả thẳng header của API để CDN của web cache.
  4. Trang `/list` và `/a`: đặt `export const revalidate = 60` như trang chủ, với bộ lọc trong URL thì Next cache theo URL.
- **Lợi:** `/list`, `/a`, `/list?view=map` và lần mở bản đồ trong app nhanh ngang trang chủ; API Tokyo bớt khoảng 70% lượt gọi đọc.
- **Kiểm:** test API: `GET /events` không cookie trả `s-maxage`; có cookie trả `private, no-store`. curl sau deploy: lần hai `x-vercel-cache: HIT`.

### P4. Bớt JS: biết chunk 166 KB chứa gì rồi mới cắt (1 ngày phân tích, 1–2 ngày cắt)

- **Bằng chứng:** 645 KB JS thô trên trang chủ; chunk 230 KB là React và Next (không cắt được, ~70 KB Brotli); chunk 166 KB không nhận ra nội dung vì không có source map.
- **Làm:**
  1. Chạy `ANALYZE=1 next build` với `@next/bundle-analyzer` một lần; ghi 10 module lớn nhất vào `docs/TECH_DEBT.md`.
  2. Khả năng cao: `runtime/ff.ts` (21 KB nguồn) nằm trong mọi trang kể cả trang không cần (`FF.loadMap`, story canvas, push); tách phần story và push thành `import()` động.
  3. 123/245 file là client component. Rà các màn web công khai (`kd/web/*`): phần chỉ hiển thị (thẻ, lineup, FAQ, footer) để server component; chỉ nút Lưu/Hype/Chia sẻ, sheet và bản đồ là client. Mục tiêu: trang `/e` dưới 80 KB JS của site (ngoài framework).
  4. `qrcode-generator` chỉ import trong `/app/tickets`; kiểm xem có lọt vào chunk chung không.
  5. Bật `experimental.optimizePackageImports: ['@phosphor-icons/react']` để chắc tree-shake ngay cả hai chỗ import từ gói gốc.
- **Lợi:** ước 100–200 KB thô (30–60 KB Brotli) mỗi trang; thời gian hydrate ngắn hơn trên máy yếu.
- **Kiểm:** ngân sách trong CI (P7): JS của site trên `/`, `/e`, `/list` ≤ 250 KB thô ngoài framework.

### P5. Tối ưu đường đọc nóng của API (nửa ngày)

- **Bằng chứng:** 97 `select *`; không `statement_timeout`; pool 10 kết nối trên mỗi instance serverless.
- **Làm:**
  1. `select *` trong `catalog.ts`, `eventpage.ts`, `listing.ts`, `me.ts` đổi thành danh sách cột (`CARD_COLUMNS` đã có; dùng nó nhất quán). Giữ `select *` trong admin và job, nơi cần mọi cột.
  2. `statement_timeout = 8000` trong `db/index.ts` cho pool của API (job dùng pool riêng với 60 s). Một truy vấn kẹt không được giữ instance tới hết hạn Vercel.
  3. Bật `pg_stat_statements` trên Supabase, mỗi tháng lấy 10 truy vấn tốn nhất; thêm chỉ mục theo số thật thay vì đoán. Chỉ mục nghi thiếu: `notifications (user_id, read_at)`, `tickets (user_id, status)`, `orders (event_id, status)`, `event_posts (event_id, created_at)` — kiểm bằng `EXPLAIN` trước khi thêm.
  4. 53 vòng lặp có `await` bên trong: rà 5 chỗ trong `routes/me.ts`, `routes/discovery.ts`, `services/notify.ts`; gộp thành một truy vấn `= any($1)` khi vòng lặp theo danh sách id.
- **Lợi:** ít băng thông DB → API, không còn instance treo vì một truy vấn, số liệu thật để quyết chỉ mục.
- **Kiểm:** test API vẫn xanh; `/health` thêm `db.p95` (ms) từ 100 truy vấn gần nhất để theo dõi.

### P6. Hạ tầng Vercel (nửa ngày, chủ sản phẩm)

- Bật **Fluid compute** và **Speed Insights** cho `feestfinder-web`: có p75 LCP, INP, CLS thật theo trang và theo quốc gia, miễn phí ở mức này.
- Kiểm `WEB_PROXY_SECRET` đã cho phép web gọi API không qua CDN công khai (đã làm). Cân nhắc `FF_API_ORIGIN` trỏ tới hostname nội bộ cùng region nếu Vercel hỗ trợ, bớt một chặng TLS.
- Tile bản đồ trên Blob đã `immutable` theo build folder: tốt, giữ.

### P7. Ngân sách hiệu năng trong CI (1 ngày)

- Thêm job `perf` vào `ci.yml`: build, chạy Lighthouse CI (`@lhci/cli`, 3 lần, mobile) cho `/`, `/e/<slug seed>`, `/list` trên server production build cục bộ với API test (như `test:screens`). Ngưỡng: Performance ≥ 85, LCP ≤ 2,5 s, TBT ≤ 200 ms, tổng byte ≤ 1,2 MB, "ảnh đúng kích thước" không lỗi.
- Một test Playwright đọc `performance` như mục 2.2 và khẳng định: font < 60 KB, không file JP/Thai trên trang Việt, JS site ≤ 250 KB thô.

### Thứ tự và tổng lợi ích

| Bước | Việc | Trang chủ 375px: trước → sau (thô) |
| --- | --- | --- |
| 1 | P1 font | 1,8 MB → 1,5 MB |
| 2 | P2 ảnh | → ~0,9 MB |
| 3 | P3 cache API | TTFB `/list` 400 → ~100 ms |
| 4 | P4 JS | → ~0,75 MB |
| 5 | P5, P6, P7 | giữ được kết quả |

---

## 4. Chất lượng code: biện pháp

Nguyên tắc: **không viết lại**, chỉ thêm lưới an toàn và sửa chỗ nóng. Mỗi biện pháp có cách đo để biết có tiến bộ.

### Q1. Lint và kiểu (2 ngày, lợi lâu dài)

- **Hiện trạng:** không linter; `TECH_DEBT.md` #15 ghi "leave as is". Với 764 `any` trong API và `noUnusedLocals` là lưới duy nhất, quyết định đó nên đổi.
- **Làm:**
  1. ESLint 9 flat config ở gốc repo, chung cho hai package: `typescript-eslint` `recommended-type-checked`, `eslint-plugin-react-hooks`, `@next/eslint-plugin-next` cho web. Chạy trong CI.
  2. Bật ngay các luật **không cho phép lỗi mới** mà không bắt sửa cũ: `no-explicit-any: error` với baseline (dùng `eslint-baseline` hoặc `// eslint-disable-next-line` tự động cho 764 chỗ cũ bằng một commit riêng, rồi giảm dần). Số `any` ghi vào roadmap mỗi tháng.
  3. `@typescript-eslint/no-floating-promises: error` (bắt `await` quên, lỗi thật trong Fastify và job), `no-misused-promises`, `exhaustive-deps` cho hooks.
  4. `tsconfig`: bật `noUncheckedIndexedAccess` cho web trước (ít `any`), API sau.
- **Đo:** số `any` (764 → mục tiêu 300 trong 90 ngày), số lỗi lint = 0 trong CI.

### Q2. Kiểu cho dữ liệu DB thay cho `any` (3–5 ngày, theo khu vực)

- **Hiện trạng:** `one<any>` và `many<any>` khắp nơi; cột đổi tên thì compiler không biết.
- **Làm:**
  1. `src/db/types.ts`: một interface cho mỗi bảng nóng (`EventRow`, `OrganizerRow`, `TicketRow`, `OrderRow`, `UserRow`, `NotificationRow`), sinh từ migration bằng tay một lần (hoặc bằng `supabase gen types` từ staging rồi cắt gọn).
  2. Thay `any` trong `catalog.ts`, `eventpage.ts`, `organizer/events.ts`, `me.ts` trước; `presenters/` nhận kiểu hàng và trả kiểu DTO.
  3. Quy ước: `one<any>` chỉ còn trong admin tổng hợp và job; mỗi chỗ phải có chú thích vì sao.
- **Đo:** `any` trong 4 file trên = 0.

### Q3. Tách hai file nghìn dòng (2 ngày)

- `services/seo.ts` 1.164 dòng: tách theo loại trang (`seo/event.ts`, `seo/artist.ts`, `seo/organizer.ts`, `seo/collection.ts`, `seo/site.ts`) với một `seo/index.ts` giữ API cũ. Không đổi output; test `seo.test.ts` giữ nguyên là bằng chứng.
- `routes/admin/ops.ts` 1.030 dòng: tách `admin/users.ts`, `admin/orders.ts`, `admin/venues.ts`, `admin/insights.ts`; đăng ký trong `app.ts`. Nhân tiện bỏ `PATCH /admin/users/:id` cấp admin (W0.1 của plan).
- **Đo:** không file nào trên 700 dòng trong `src/`.

### Q4. Trùng lặp (1 ngày, một phần trùng W7.4 của plan UX)

- `ago()` có hai bản (`web/event/community.tsx:25`, `console/kit.tsx:113`): một bản trong `kd/format.ts`.
- `Block`, `Kpi`/`Tile`/`Stat`, 4 bảng màu trạng thái, 2 hằng tiền tệ checkout: gộp vào `kd/ui/backoffice.tsx` (plan W7.4).
- `money()` web và `formatMoney()` API: giữ hai bản vì hai runtime, nhưng thêm một test đối chiếu 10 giá trị để không lệch.
- 159 schema zod inline trong route: những schema dùng ở hơn một chỗ (`citySlug`, `dateStr`, `limit`, `EventFilters`) đã ở `lib/validate.ts`; rà thêm `Pagination`, `LangQuery`, `IdParams` và gom.
- **Đo:** `jscpd` (phát hiện trùng) chạy một lần, ghi tỷ lệ; mục tiêu dưới 3% dòng trùng.

### Q5. Kiểm thử: lấp chỗ hở và chống chập chờn (2 ngày)

- Heuristic theo tên file cho thấy `routes/commerce.ts` và `routes/event-actions.ts` không được test nào gọi thẳng theo tên (checkout có thể đang được test qua `attendee.test.ts`); kiểm bằng **coverage**: `node --test --experimental-test-coverage` trong CI, ngưỡng dòng ≥ 70% cho `src/routes` và `src/services`, in bảng file dưới 50%.
- Test "Lưu sự kiện" chập chờn (đã thấy 1 lần hôm nay): đổi `expect(...).toHaveAttribute('aria-pressed','true')` thành chờ response của `POST /me/saves` rồi mới khẳng định; Playwright `retries: 1` trong CI, `0` cục bộ để lỗi chập chờn hiện ra.
- Test hành trình theo vai (mục 6.2 của review): 4 spec.
- **Đo:** coverage ≥ 70%, không test nào cần retry trong 2 tuần.

### Q6. Quy ước và tài liệu sống (nửa ngày)

- `docs/TECH_DEBT.md`: cập nhật #15 (có lint), thêm mục "Kết quả bundle analyzer" và "10 truy vấn tốn nhất" với ngày đo.
- `CLAUDE.md` mục "Checking a change": thêm `npm run lint` và ngân sách hiệu năng; mục "Look": font khai báo trong `kd/fonts.css`.
- Mẫu PR (`.github/pull_request_template.md`): checklist DoD của review (mục 6.1), ô "ảnh hưởng tải trang: KB trước/sau".
- Dependabot cho hai `package-lock.json` và GitHub Actions, gộp theo tuần.

---

## 5. Lịch gợi ý (song song với giai đoạn 0–1 của review)

| Tuần | Việc | Chủ |
| --- | --- | --- |
| 1 | P1 font · P3 cache API · Q1 lint (bật, baseline) · P6 (Speed Insights, Fluid compute) | Agent · Chủ SP |
| 2 | P2 ảnh · P5 (select cột, statement_timeout) · Q3 tách hai file lớn · Q6 | Agent |
| 3 | P4 (analyzer rồi cắt) · P7 ngân sách CI · Q5 coverage | Agent |
| 4–6 | Q2 kiểu DB theo khu vực · Q4 trùng lặp (cùng W7.4) · chỉ mục theo `pg_stat_statements` | Agent |

Sau tuần 3, đo lại bảng ở mục 2.2 và ghi vào roadmap. Mục tiêu 90 ngày: trang chủ 375px ≤ 800 KB thô, LCP p75 ≤ 2,5 s trên Speed Insights, `/list` TTFB ≤ 150 ms, `any` ≤ 300, lint 0 lỗi, coverage ≥ 70%.

---

## 6. Việc chủ sản phẩm cần làm

1. Chạy Supabase Performance Advisor và Security Advisor trên **staging** và **production**, dán kết quả vào mục 2 của file này (hoặc đặt `SUPABASE_ACCESS_TOKEN` và `SUPABASE_PROJECT_REF` của staging trong môi trường của agent để agent tự chạy).
2. Bật Speed Insights và Fluid compute cho `feestfinder-web` trên Vercel.
3. Duyệt việc đổi quyết định `TECH_DEBT.md` #15 (thêm linter).
4. Chọn cách lưu bản ảnh nhỏ (P2.3): sharp lúc upload (mặc định) hay Vercel Image Optimization hoàn toàn (ít code hơn, tính theo lượt tối ưu).
