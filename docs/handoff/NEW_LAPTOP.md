# Chuyển FeestFinder sang laptop mới

Bàn giao ngày 21.10.2026. Làm theo thứ tự; phần lớn là một lệnh `bash scripts/setup-laptop.sh`. Không có mật khẩu hay token nào trong repo: những thứ đó bạn nhập lại trên máy mới (bước 4).

## Trạng thái lúc bàn giao

- `main` là production (feestfinder.com, API ở feestfinder-api.vercel.app). Mọi việc đã merge, không còn nhánh dở. Các PR gần nhất:
  - #32: yêu cầu ngày 20.10 và night build;
  - #33: một thanh điều hướng (Sự kiện · Nghệ sĩ · Blog · Đã lưu · Tôi);
  - #34: 17 bài "Kỹ năng DJ";
  - #35, #36: sitemap đủ trang, dựng theo yêu cầu;
  - #37: file xác minh Google Search Console;
  - PR mang tài liệu này.
- Blog: 27 bài đã công khai, gồm 10 bài dòng nhạc (gói `edm-genres`) và 17 bài Kỹ năng DJ (gói `dj-skills`).
- Sitemap: https://feestfinder.com/sitemap.xml có khoảng 200 địa chỉ, CDN giữ 15 phút.
- Google Search Console: thuộc tính `https://feestfinder.com/` xác minh bằng file `festfinder-web/public/google69f1c7d1cf79cd6d.html`. **Đừng xoá file đó.** Bạn gửi sitemap bằng tài khoản đã xác minh.
- Bộ nhớ và ghi chú chi tiết của Claude nằm ở `docs/handoff/claude-memory/` (bước 7).

## 1. Cài công cụ

| Công cụ | Dùng để | Cài |
| --- | --- | --- |
| Node.js 24 | Chạy API (TypeScript chạy thẳng) và web | `nvm install 24 && nvm alias default 24` |
| Python 3 | Script của skill viết blog (YouTube, Commons, kiểm link) | Có sẵn trên Linux/macOS |
| git + SSH key | Clone, push | `ssh-keygen -t ed25519`, thêm khoá công khai vào GitHub (Settings → SSH keys) |
| GitHub CLI `gh` | PR, CI, merge | https://cli.github.com, rồi `gh auth login` |
| Vercel CLI (tuỳ chọn) | Xem log, deployment | `npm i -g vercel`, rồi `vercel login` |
| Claude desktop app | Code tab, bản preview, trình duyệt tích hợp | Đăng nhập đúng tài khoản claude.ai: plugin (trình duyệt tích hợp…) và connector đi theo tài khoản |

Đặt danh tính git một lần: `git config --global user.name "…"` và `git config --global user.email "…"`.

## 2. Clone hai repo vào cùng một thư mục

```bash
mkdir -p ~/Desktop
```

```bash
cd ~/Desktop && git clone git@github.com:kitsbui/FeestFinder.git && git clone git@github.com:kitsbui/design-kit.git
```

`design-kit` phải nằm **cạnh** `FeestFinder` (`../design-kit`): `.mcp.json`, `.codex/config.toml` và cấu hình preview `design-kit-usertest` trỏ tới đó. Script ở bước 3 sẽ tự clone nếu bạn quên.

## 3. Chạy script cài đặt

```bash
cd ~/Desktop/FeestFinder && bash scripts/setup-laptop.sh
```

Script làm sáu việc và không đụng tới bí mật nào:
1. Kiểm tra công cụ.
2. `npm install` cho `festfinder-backend` và `festfinder-web`.
3. Cài Chromium cho test màn hình.
4. Clone hoặc cập nhật `design-kit`, rồi cài MCP server của nó.
5. Chép bộ nhớ của Claude vào đúng chỗ (bước 7).
6. Chạy `test/blog-content.test.ts` và nhắc những biến môi trường còn thiếu.

## 4. Biến môi trường và bí mật (nhập lại, không commit)

| Ở đâu | Cái gì | Khi nào cần |
| --- | --- | --- |
| `~/.bashrc` hoặc `~/.zshrc` | `export SUPABASE_PROJECT_REF=<ref của project staging>` và `export SUPABASE_ACCESS_TOKEN=<token cá nhân>` (supabase.com → Account → Access Tokens) | MCP Supabase (chỉ đọc, dùng staging) |
| `~/.bashrc` (tuỳ chọn) | `export BLOG_KIT_UA="FeestFinder/1.0 (https://feestfinder.com; <email liên hệ>)"` | Script Commons của skill blog (Wikimedia xin một địa chỉ liên hệ) |
| `festfinder-backend/.env` | Chép từ `.env.example`, lấy giá trị từ Vercel (môi trường Preview của project `feestfinder`) | Chỉ khi chạy `npm run dev` với database staging. Bản preview không cần |
| Vercel | `GOOGLE_CLIENT_SECRET`, `WEB_PROXY_SECRET`, `ANTHROPIC_API_KEY`, `POSTHOG_KEY`, `SENTRY_DSN`… | Đã nằm trên Vercel, không chép về máy |

Không bao giờ ghi ref, token, mật khẩu hay danh sách email admin vào repo (`CLAUDE.md`).

## 5. MCP server

Khai báo trong `.mcp.json` (Claude Code) và `.codex/config.toml` (Codex). Lần đầu mở repo, Claude hỏi có bật các server của dự án không: chọn bật.

| Server | Là gì | Cần |
| --- | --- | --- |
| `vercel` | Deployment, log, biến môi trường của hai project | Đăng nhập OAuth khi được hỏi (trong app: bấm đăng nhập trên thông báo; trong terminal: `claude` rồi `/mcp`) |
| `supabase` | Đọc database staging (`--read-only`) | Hai biến ở bước 4 |
| `design-kit` | 15 công cụ: `blog_check` (chấm bài blog), `blog_jsonld`, quy tắc thiết kế, đo màn đầu của một URL… | `../design-kit` đã clone và đã `npm install` trong `design-kit/mcp` (script làm) |

Các connector của claude.ai (Gmail, Drive…) và plugin như trình duyệt tích hợp đi theo tài khoản, không cần cài lại.

## 6. Skill

**Trong repo, tự nạp** (`.claude/skills/`):

| Skill | Dùng khi |
| --- | --- |
| `feestfinder-preview` | Chạy hoặc khởi động lại bản preview ở máy (`bash scripts/preview.sh`, http://localhost:3000, database PGlite trong máy) |
| `feestfinder-ship` | Kiểm tra, mở PR, merge khi CI xanh, kiểm tra production |
| `feestfinder-blog-content` | Bạn gửi tài liệu, Claude làm trọn: nghiên cứu, bài song ngữ, ảnh có giấy phép, test. Script nằm trong `scripts/` của skill |
| `feestfinder-migration` | Thêm một migration (số tiếp theo ghi trong `CLAUDE.md`) |
| `feestfinder-add-city` | Thêm thành phố: places, tiles bản đồ, Vercel Blob, `MAP_*` |
| `feestfinder-radar-adapter` | Thêm nguồn sự kiện cho Feest Radar |

**Từ design-kit, tuỳ chọn, cho mọi dự án:** `design-review`, `design-system-setup`, `design-gates`, `design-phase`, `newcomer-flow`, `user-test`, `page-patterns`, `blog-writing`.

```bash
mkdir -p ~/.claude/skills && cp -r ~/Desktop/design-kit/skills/* ~/.claude/skills/
```

**Codex:** `AGENTS.md` trỏ về `CLAUDE.md` (có sẵn); `.agents/skills/` là bản sao y hệt `.claude/skills/` (sửa skill thì chép lại bản sao); MCP nằm trong `.codex/config.toml`.

## 7. Bộ nhớ của Claude

Claude giữ ghi chú riêng của dự án ở `~/.claude/projects/<đường dẫn repo, mọi ký tự không phải chữ hay số thành ->/memory/`, chỉ nằm trên máy. Bản chụp ngày 21.10 ở `docs/handoff/claude-memory/`:
- quyết định của chủ sản phẩm;
- các phase thiết kế;
- cách viết blog từ tài liệu;
- night build;
- design-kit.

Script ở bước 3 chép vào đúng chỗ khi thư mục đó còn trống. Từ đó bộ nhớ trên máy mới tự lớn; `CLAUDE.md` vẫn là nguồn quy tắc chính.

## 8. Kiểm tra máy mới

1. Trong app (Code tab), mở repo và bảo Claude chạy bản preview (`festfinder-preview`): http://localhost:3000, tài khoản demo in ra trong log.
2. `cd festfinder-backend && npm run typecheck && npm test` (vài phút; 447 pass, 1 bỏ qua).
3. Tuỳ chọn: `npm run test:screens` (cần Chromium, build Next production).
4. Hỏi Claude: "chạy blog_check cho bài beatmatch-bang-tai" để thử MCP `design-kit`.

## 9. Cách làm việc đã thống nhất

- Làm trên nhánh, mở PR, merge khi các check kỹ thuật xanh (API pglite/postgres, Web, Screens 1–3). Không push thẳng `main`: push `main` là deploy production.
- "Visual" và "Design checklist" chỉ đỏ khi giao diện đổi; nhãn `visual-ok` là của bạn sau khi xem ảnh so sánh.
- Bật Auto-fix cho PR trong app nếu muốn Claude tự sửa khi CI lỗi.
- Blog: gửi tài liệu, Claude viết gói nội dung và mở PR. Sau deploy, bài vào hàng chờ; bạn duyệt ở `/console/blog` ("Duyệt bài biên tập (n)") hoặc bảo Claude duyệt khi trình duyệt tích hợp đã đăng nhập tài khoản admin.
- Trình duyệt tích hợp trên máy mới chưa đăng nhập gì. Bạn tự đăng nhập: Google admin cho Console, tài khoản Search Console. Claude không nhập mật khẩu.

## 10. Tài khoản và dịch vụ (không có mật khẩu ở đây)

| Dịch vụ | Gì |
| --- | --- |
| GitHub `kitsbui` | `FeestFinder` (private), `design-kit` |
| Vercel, team `buingockieuanhwork-2826s-projects` | `feestfinder-web` (feestfinder.com), `feestfinder` (API), cả hai ở `hnd1`; tiles bản đồ trên Blob `feestfinder-tiles` |
| Supabase | Hai project production và staging (từ chối nhãn của nhau) |
| Google Search Console | `https://feestfinder.com/` (file HTML) |
| DNS | Mắt Bão (`ns1/ns2.matbao.com`) |
| PostHog (US Cloud), Sentry | Khoá nằm trong Vercel |
