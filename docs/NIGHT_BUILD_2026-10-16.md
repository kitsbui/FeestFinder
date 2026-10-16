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

## Dùng mặc định
- D4: bản tạm (tin vẫn `live`, cờ chờ duyệt), theo plan.
- D8: báo admin khi tin bị ẩn; báo cáo của tài khoản dưới 7 ngày tính nửa.

## Bỏ dở

## Kết quả cuối (N12)
