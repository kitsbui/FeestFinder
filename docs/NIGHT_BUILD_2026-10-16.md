# Night build 2026-10-16

Plan: `docs/NIGHT_BUILD_PLAN_2026-10-16.md` · Xuất phát: main `cebeb3d` · Nhánh: `night/2026-10-16`

| Việc | Commit | Cổng | Ghi chú |
| --- | --- | --- | --- |
| N0 Khởi động | `5405e4e` | typecheck sạch · API 368 (367 qua, 1 bỏ qua) · screens 211/211 | Docs ngày 16/10 commit trên nhánh đêm, không trên `main` |
| N1 Bỏ phí 5% | night/2026-10-16-N1 | attendee + resale 23/23 · app + event spec 25/25 | **Chủ SP: xoá biến `SERVICE_FEE_PCT` trên Vercel nếu có** (code không đọc nữa). Console vẫn hiện cột phí cho đơn cũ. |
| N2 Bỏ cấp admin, tách `admin/ops.ts` | night/2026-10-16-N2 | API 369 (368 qua, 1 bỏ qua) · Console specs 47/47 | `ops.ts` 1.030 → 446 dòng + venues, organizers, users, orders, ops-shared. Gỡ admin giờ chỉ bằng cách sửa `ADMIN_EMAIL` trên Vercel rồi redeploy. |

## Dùng mặc định
- D4: bản tạm (tin vẫn `live`, cờ chờ duyệt), theo plan.
- D8: báo admin khi tin bị ẩn; báo cáo của tài khoản dưới 7 ngày tính nửa.

## Bỏ dở

## Kết quả cuối (N12)
