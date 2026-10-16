# Night build 2026-10-16

Plan: `docs/NIGHT_BUILD_PLAN_2026-10-16.md` · Xuất phát: main `cebeb3d` · Nhánh: `night/2026-10-16`

| Việc | Commit | Cổng | Ghi chú |
| --- | --- | --- | --- |
| N0 Khởi động | `5405e4e` | typecheck sạch · API 368 (367 qua, 1 bỏ qua) · screens 211/211 | Docs ngày 16/10 commit trên nhánh đêm, không trên `main` |
| N1 Bỏ phí 5% | night/2026-10-16-N1 | attendee + resale 23/23 · app + event spec 25/25 | **Chủ SP: xoá biến `SERVICE_FEE_PCT` trên Vercel nếu có** (code không đọc nữa). Console vẫn hiện cột phí cho đơn cũ. |
| N2 Bỏ cấp admin, tách `admin/ops.ts` | night/2026-10-16-N2 | API 369 (368 qua, 1 bỏ qua) · Console specs 47/47 | `ops.ts` 1.030 → 446 dòng + venues, organizers, users, orders, ops-shared. Gỡ admin giờ chỉ bằng cách sửa `ADMIN_EMAIL` trên Vercel rồi redeploy. |
| N3 Sửa tin đang bán không 404 (migration 040) | night/2026-10-16-N3 | API 371 (370 qua, 1 bỏ qua) · review/organizer/admin 36/36 · Studio events 7/7, studio + console-review 25/25 | Bản tạm theo D4: tin giữ `live`, cờ `needs_review_*`; duyệt xoá cờ, trả lại phục hồi giá trị cũ. Next migration giờ là `041`. |
| N4 Báo cáo theo tin, cảnh cáo theo tin, báo admin | night/2026-10-16-N4 | API 373 (372 qua, 1 bỏ qua) · console + console-moderation 14/14 | D8 mặc định: tài khoản dưới 7 ngày tính 0,5; ngưỡng ẩn vẫn 2. |
| N5 Font gọn | night/2026-10-16-N5 | fonts.spec 3/3 · **screens 215/215** | Trang Việt: 2 file Noto Sans (~50 KB), không latin-ext/Thai/JP; CSS font từ ~190 KB xuống ~92 KB. JP tách ra `public/fonts` (sinh lúc build). Sửa thêm: build e2e xoá fetch cache của Next (gây lỗi live mode chập chờn khi chạy liền nhau). |
| N6 Cache CDN cho API đọc công khai | night/2026-10-16-N6 | API 374 (373 qua, 1 bỏ qua) · screens 215/215 | **Sáng mai kiểm trên production:** `curl -sI https://feestfinder.com/events?limit=5` lần 2 có `x-vercel-cache: HIT`; với cookie `ff_session` thì `private, no-store`. Nếu Vercel không cache phản hồi của proxy, lợi ích nằm ở chặng web → API (CDN của project API). |
| N7 Thư mục nghệ sĩ: loại hồ sơ, follow theo hồ sơ (migration 041) | night/2026-10-16-N7 | API 377 (376 qua, 1 bỏ qua) | Màn hình làm ở N8. `owned` = nghệ sĩ tự chạy hồ sơ **hoặc đội đã xác minh** (`verified`); ghi ra để chủ SP xác nhận. Demo thêm 2 nghệ sĩ có chủ: Trần Duy, SlimV (chỉ test/preview). Next migration giờ là `042`. |
| N8 Thư mục nghệ sĩ, phần web | night/2026-10-16-N8 | **screens 215/215** · directory + artist 15/15 | Làm trước N7b để giao diện xanh lại ngay sau N7. Chưa làm: bộ lọc Có chủ · Chưa nhận · Radar trong `/console/artists` (để ban ngày). Các màn "Đang theo dõi" trong app vẫn đọc `artistPages` (API vẫn trả). |
| N7b Bắt tay lineup ↔ hồ sơ, phần API | night/2026-10-16-N7b | API 383 (382 qua, 1 bỏ qua) · lineup.test 6/6 · artist/directory/studio specs 33/33 | Hồ sơ có chủ chỉ hiện show đã xác nhận. Ba màn hình (ô lineup của NTC, Lịch nghệ sĩ có Xác nhận/Không phải tôi, dấu xác nhận trên trang sự kiện) để ban ngày. |
| N9 Mười lỗi nhỏ (10 commit) | night/2026-10-16-N9 | API 384 (383 qua, 1 bỏ qua) · **screens 218/218** | 9.1 Bận/Rảnh · 9.2 link thông báo kế hoạch · 9.3 focus trong sheet · 9.4 lịch đã báo đang duyệt không link 404 · 9.5 "Mời nghệ sĩ" chỉ nghệ sĩ có chủ · 9.6 wizard hết ghi "Nháp" sau khi gửi · 9.7 gợi ý địa điểm cùng thành phố · 9.8 `/list` trên điện thoại mở dạng lưới · 9.9 menu Dòng nhạc dẫn tới `/list?style=` · 9.10 hàng hướng dẫn AI chỉ khi chạy được. |
| N10 ESLint với ngân sách | night/2026-10-16-N10 | lint 0 lỗi / 56 cảnh báo (ngân sách) · screens 218/218 | **Chỉ web.** API dùng TypeScript 7 nên typescript-eslint không chạy được; ghi vào TECH_DEBT #15 với hai hướng (oxlint type-aware, hoặc chờ). 135 promise không ai chờ được đánh dấu `void` (hành vi không đổi). |
| N11 Lấp đầy bề ngang, không cuộn ngang | `133e747` | **layout.spec 10/10** (5 vai × 390/1440) · screens 228 (1 bỏ qua) · lint 0 lỗi / 56 | Rail back-office gập thành thanh menu dưới 900px (`ui/rail.tsx`); bảng co cột, thành thẻ khi hẹp hơn 640px; timetable trên điện thoại liệt kê set theo sân khấu; ô hạng vé và số liệu dự án xuống dòng. Chỉ tabs, hàng chip và `data-scroll-x` được cuộn ngang, và mờ dần ở mép. Lần chạy đầu: 7/10 vai đỏ. |

## Dùng mặc định
- D4: bản tạm (tin vẫn `live`, cờ chờ duyệt), theo plan.
- D8: báo admin khi tin bị ẩn; báo cáo của tài khoản dưới 7 ngày tính nửa.

## Bỏ dở
- N10 phía API: không có linter type-aware cho TypeScript 7; cần chủ SP chọn hướng.

## Kết quả cuối (N12)
Trên `night/2026-10-16`, 17/10:
- typecheck API + e2e sạch · web `tsc` sạch
- API 384 test: 383 qua, 1 bỏ qua, 0 lỗi
- screens 229: 228 qua, 1 bỏ qua (phân trang thư mục nghệ sĩ, chỉ chạy khi demo có hơn 24 nghệ sĩ)
- lint web: 0 lỗi, 56 cảnh báo (đúng ngân sách)
- Đã đẩy `night/2026-10-16` lên origin. `main` không đổi, không deploy.
- Plan đêm được chép vào `docs/NIGHT_BUILD_PLAN_2026-10-16.md` (trước đó chỉ nằm ngoài repo).

## Sáng hôm sau (chủ sản phẩm)
1. Đọc bảng trên.
2. `preview_start festfinder-preview`; thu cửa sổ về cỡ điện thoại rồi kéo rộng: không trang nào cuộn ngang, rail back-office gập thành thanh menu.
3. Bốn luồng: mua vé (không phí) · sửa tin đang bán (trang vẫn mở, Console thấy "Bản sửa · vẫn đang đăng") · /a và /a/radar · trang nghệ sĩ có chủ và trang Radar.
4. Việc của chủ SP: xoá `SERVICE_FEE_PCT` trên Vercel nếu có; sau khi ship, `curl -sI https://feestfinder.com/events?limit=5` hai lần để xem `x-vercel-cache: HIT`; chọn hướng linter cho API (TECH_DEBT #15); xác nhận "owned" gồm cả hồ sơ đội đã xác minh.
5. Ổn: "commit all merge main redeploy". Một việc hỏng: "revert N<k>", phần còn lại vẫn ship.
6. Ban ngày: ba màn của bắt tay lineup, bộ lọc Có chủ · Chưa nhận · Radar trong `/console/artists`.
