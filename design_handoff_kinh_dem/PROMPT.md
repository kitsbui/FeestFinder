# Lời nhắn dán vào Claude Code

Mở Claude Code ở thư mục `FestFinder FrontEnd` (gốc repo) rồi dán đoạn dưới đây.

---

```text
Mình muốn dựng giao diện mới "Kính đêm" cho FeestFinder.

Đọc theo thứ tự:
1. CLAUDE.md ở gốc repo (quy tắc của codebase).
2. design_handoff_kinh_dem/README.md — bản bàn giao thiết kế. Bản vẽ nằm ở design_handoff_kinh_dem/design/*.dc.html, tokens ở design_handoff_kinh_dem/tokens/.
3. festfinder-web/AGENTS.md và tài liệu Next 16 trong node_modules/next/dist/docs/.

Quyết định đã chốt: dựng lại các màn hình của festfinder-web (Next.js) bằng React + Tailwind CSS v4, theo từng route; route nào chưa làm thì vẫn dùng màn hình biên dịch cũ. Không động vào festfinder-frontend, không đổi cấu hình deploy, production giữ nguyên.

Bắt đầu bằng Phase 0 trong README (mục 9):
- Tạo nhánh mới feat/kinh-dem.
- Viết docs/KINH_DEM_PLAN.md: danh sách component, thứ tự chuyển từng route, cách route cũ và mới cùng chạy, kế hoạch test.
- Liệt kê các câu hỏi ở mục 10 kèm đề xuất của bạn, rồi dừng lại chờ mình trả lời.

Chưa viết code giao diện trước khi mình trả lời. Chỉ commit/push khi mình bảo.
```

---

Sau khi trả lời các câu hỏi, đi tiếp từng giai đoạn: "Làm Phase 1" → xem trang `/kit` → "Làm Phase 2" … (xem mục 9 của README).
