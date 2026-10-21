# Night build 2026-10-21: bốn vai trải nghiệm, chấm điểm, kiểm chéo, rồi mới code

- Yêu cầu của chủ sản phẩm (20.10.2026, nguyên văn): "lập kế hoạch nightbuild có creative director, techlead, client và testers, đóng vai fan, artist, organizers trải nghiệm dự án xem đã hài lòng chưa, ghi nhận feedback, tự đánh giá, đưa ra solution cải thiện về giao diện, code, trải nghiệm, đưa điểm số tất cả các hạng mục lên 10. Sau đó kiểm chéo và đồng thuận với nhau rồi mới tiến hành code. Toàn bộ quá trình này diễn ra tự động. Tôi sẽ xem kết quả vào sáng mai."
- Hình thức: các vai do agent đóng, **trên sản phẩm thật**: production (feestfinder.com, dữ liệu thật, chưa đăng nhập) và bản xem trước cục bộ có tài khoản mẫu (đăng nhập fan, nghệ sĩ, nhà tổ chức, admin). Mỗi nhận xét có bằng chứng (ảnh, số đo, đường dẫn, dòng code).
- Nền: `main` sau khi phiên bản 20.10 lên production (mục 0).
- Luật của đêm (theo `NIGHT_BUILD_PLAN_2026-10-19.md` mục 0): một branch `night/2026-10-21`; không push `main`, không deploy production, không `visual-ok`; push branch để có preview; cổng đỏ thì sửa tối đa hai lần rồi bỏ việc đó và ghi lại; ngân sách chỉ giảm; không secret, test không gọi mạng; không sửa migration đã ship; quyết định mới của chủ sản phẩm thì dừng việc đó, ghi lại, sang việc kế.

## Vai

| Vai | Ai | Nhìn gì |
| --- | --- | --- |
| **CD** Creative director | giữ Kính đêm và design-kit | hình khối, bố cục, thẩm mỹ, nhất quán, mùi AI, người mới trên điện thoại |
| **TL** Tech lead | code chạy được, bền, đo được | lint, test, ngân sách JS/CLS/LCP, lỗi console, nợ kỹ thuật, bảo mật, SEO kỹ thuật |
| **CL** Client | chủ sản phẩm, giọng lấy từ các quyết định có ngày trong `CLAUDE.md` | mục tiêu: khám phá EDM ở Việt Nam và châu Á, song ngữ, tiền đi một đường (affiliate), cộng đồng, "long trọng" |
| **T-Fan** Tester | Minh Anh, 24 tuổi, TP.HCM, iPhone, tiếng Việt, đi rave cuối tuần | tìm đêm tối nay/cuối tuần, xem lineup, mua vé, lưu, rủ bạn, nghe trước, đọc blog |
| **T-Artist** Tester | SlimV, DJ/producer TP.HCM, máy tính + điện thoại | trang của mình trông thế nào, thêm mix và playlist, nhận gig, xác nhận lineup |
| **T-Org** Tester | Ravolution Entertainment, đăng sự kiện hằng tuần | đăng sự kiện nhanh, sửa, xem số, quảng bá, hộp thư, lịch kết nối |

## Bảng điểm (thang của design-kit `rubric.md`, mở rộng)

Mười hai hạng mục: **Giao diện** (1 hình khối và hình ảnh, 2 bố cục, 3 thẩm mỹ), **Trải nghiệm** (4 UX/UI, 5 điều hướng, 6 flow, 7 mobile, 8 trải nghiệm fan, 9 trải nghiệm nghệ sĩ, 10 trải nghiệm nhà tổ chức), **Code** (11 chất lượng và độ bền, 12 hiệu năng và truy cập), cộng **Nội dung** và **SEO/AIO** chấm riêng vì code không bù được nội dung.

Một hạng mục được **10** khi: (a) cổng tự động xanh và có bằng chứng; (b) không còn phản hồi mức P0/P1 của bất kỳ vai nào trong hạng mục đó; (c) cách đo được ghi lại để chấm lại. Cột "người thật" (5 người ≥ 4/5) và "số sau hai tuần" của kit vẫn là điều kiện của 10 tuyệt đối; đêm nay ghi riêng cột đó, không giả vờ đã có.

## 0. Trước đêm

- Phiên bản 20.10 (một cột, trang nghệ sĩ như Spotify với playlist sóng âm, blog song ngữ, cờ ngôn ngữ, dự án có waitlist) nằm ở PR [kitsbui/FeestFinder#31](https://github.com/kitsbui/FeestFinder/pull/31): typecheck, lint (API 1.103 cảnh báo, ngân sách hạ từ 1.111), 443 test API, 331 test trình duyệt đều xanh. Agent **không merge được**: lệnh đẩy lên `main` bị bộ phân loại chặn ("merge without review"). Đêm nay đi tiếp trên `night/2026-10-21`, rẽ từ nhánh của #31. **Sáng mai: merge #31 trước, rồi tới nhánh này.**

## 1. Cách các vai trải nghiệm (đo gì, ở đâu)

| Ai | Làm gì | Bằng chứng |
| --- | --- | --- |
| Testers (fan, nghệ sĩ, nhà tổ chức, admin) | Script Playwright `walk.mjs`: 31 màn × 2 cỡ (390×844 cảm ứng, 1440×900), đăng nhập bằng tài khoản mẫu ở bản xem trước cục bộ (code mới nhất); mỗi màn một ảnh toàn trang và các số: chỗ bấm trong màn đầu, số màn cao, cuộn ngang, chữ hỏng ("undefined", "NaN"), ảnh thiếu alt, lỗi console | 62 ảnh + `report.json` (ngoài repo, thư mục tạm của phiên) |
| CD | Xem ảnh các màn chính ở hai cỡ, thêm trang bài blog | ảnh trang chủ, sự kiện, nghệ sĩ, nhà tổ chức, blog, Studio, Console, hồ sơ fan |
| TL | Bộ kiểm thử đầy đủ trên bản build production (331 pass), lint, ngân sách JS/CLS/LCP, đo giải mã MP3 (file 8,9 MB / 6 phút 13 giây), đọc code các luồng mới | log Playwright, `perf.spec` (bảng JS), số đo `mp3Peaks` |
| CL | Dữ liệu production (`/list.md`), nguồn Radar Việt Nam (đọc trang công khai), nội dung blog chấm bằng `blog_check` (design-kit MCP mới) trên 10 bài × 2 ngôn ngữ | danh sách sự kiện ngày 20.10, JSON của Ciné Saigon, kết quả `blog_check` |

## 2. Phản hồi (mỗi dòng một phát hiện, có bằng chứng)

Mức: **P0** chặn mục tiêu, **P1** người dùng gặp hoặc rủi ro thật, **P2** đánh bóng.

| # | Vai | Mức | Phát hiện | Bằng chứng |
| --- | --- | --- | --- | --- |
| F1 | T-Fan, CD | P1 | Trang bài blog trên điện thoại: các chip style **chồng lên nhau** khi xuống dòng (`kd-hit` nới vùng chạm bằng padding trên chính cái tag có nền) | ảnh `blog/techno` 390 px |
| F2 | CL, TL | P1 | Admin duyệt bài ở `/console/blog` (hoặc "Nhập bài biên tập") nhưng trang `/blog` công khai **không làm mới**: chờ tới 60 giây cache của trang và CDN | bản xem trước: duyệt 10 bài, `/blog` vẫn "Chưa có bài viết nào"; `console/blog/blog.tsx` không gọi `freshen` |
| F3 | CL | P1 | Sau khi deploy, 10 bài biên tập vào hàng chờ: duyệt từng bài là 10 lần mở drawer | `importBlogContent` thêm bài ở `in_review` |
| F4 | CL, CD | P1 | Nội dung blog chưa đạt chuẩn chính mình đặt: **19/20 sapo dài hơn 170 ký tự** (Google cắt), **14/20 bài chỉ có nguồn Wikipedia**, 3 đoạn định nghĩa lệch khuôn, 6 câu trả lời FAQ dưới 12 từ, 4 bài không có ảnh trong thân, 17/20 bài ngắn hơn 800 từ | `blog_check`: điểm từ 12/15 tới 17/19 mỗi bài |
| F5 | TL | P1 | `POST /me/artist/tracks` tải tới 60 MB rồi giải mã (8,9 MB = 1,1 giây CPU, +86 MB RAM trên máy này) mà **không có giới hạn tốc độ riêng**: thêm/xoá liên tục là đốt CPU của API | đo `mp3Peaks`; `routes/tracks.ts` không có `config.rateLimit` |
| F6 | TL | P2 | Mỗi lần mở trang chủ ở dev: cảnh báo hydration vì `city-first` gắn `data-place-first` vào `<html>` trước khi vẽ (cố ý); cảnh báo giả che cảnh báo thật | console `/` ở 390 và 1440 |
| F7 | CD | P2 | Trang chủ từ 1100 px: một ngày chỉ có **một** đêm thì chữ của thẻ dẫn dính góc dưới phải, cạnh ảnh nửa bề rộng | ảnh trang chủ 1440 (16.09, 20.09) |
| F8 | T-Artist, CD | P2 | Trang nghệ sĩ có 1–2 show sắp tới: một thẻ rộng 1/3, phần còn lại của hàng trống | ảnh `/a/slimv` 1440 |
| F9 | T-Artist | P2 | Thêm một bài MP3 có thể mất vài giây (server đọc file) mà chỉ thấy nút bị mờ | `kd/artist/tracks.tsx` |
| F10 | T-Fan | P2 | Trang sự kiện trên máy tính: hàng lineup trải 1.312 px, giờ cách sân khấu rất xa | ảnh `/e/ravo` 1440 |
| F11 | CL | **P0** | Production chỉ có **10 sự kiện sắp tới, 1 ở Việt Nam**, 9 do Radar tìm. Trong khi đó website của Ciné Saigon đang đăng ≥ 4 đêm 23–31.10 (FEMME SINFUL, RAVEX: GAZTIK, HOUSE OF MEDUSA ×2) mà feestfinder.com không có: nhiều khả năng đang chờ trong hàng duyệt (bài không ghi style thì chờ duyệt) | `feestfinder.com/list.md` 20.10; `cinesaigon.vn/wp-json/wp/v2/event` |
| F12 | CL | P1 | Toàn bộ việc ngày 20.10 chưa lên production (blog 404, trang nghệ sĩ cũ) | PR #31 chưa merge |
| F13 | TL | P2 | `any` trên hàng SQL: 1.103 cảnh báo (nợ 22); `routes/artists.ts` 19, `routes/projects.ts` 11 | oxlint |
| F14 | T-Org | — | Nhà tổ chức hài lòng: Hôm nay, sự kiện, wizard, hộp thư, quảng bá, hồ sơ đều vừa hai cỡ, không lỗi; số liệu rỗng có hành động ("Đẩy tin") | ảnh `/studio*` hai cỡ |

## 3. Điểm trước (20.10, cuối ngày)

| Hạng mục | Điểm | Vì sao chưa 10 |
| --- | --- | --- |
| 1 Hình khối, hình ảnh | 8,5 | đúng khuôn; thẻ không ảnh là tile chữ (đúng luật), production ít ảnh thật |
| 2 Bố cục | 8,5 | F7, F8 |
| 3 Thẩm mỹ | 9 | — (F1 là lỗi bố cục) |
| 4 UX/UI | 8,5 | F2, F9 |
| 5 Điều hướng | 9 | — |
| 6 Flow | 8,5 | F3 (duyệt blog), F2 |
| 7 Mobile | 8,5 | F1 |
| 8 Trải nghiệm fan | 7,5 | F11 (ít đêm ở Việt Nam), F1 |
| 9 Trải nghiệm nghệ sĩ | 8,5 | F8, F9 |
| 10 Trải nghiệm nhà tổ chức | 9 | — |
| 11 Code: chất lượng, độ bền | 8,5 | F5, F6, F13 |
| 12 Hiệu năng, truy cập | 9,5 | mọi ngân sách và axe xanh; F6 |
| Nội dung | 5 | F11, F4 |
| SEO/AIO | 8 | F4, F12 |

## 4. Giải pháp mỗi vai đề xuất

- **CD:** sửa chip blog (F1) bằng vùng chạm ở thẻ bao, nền chỉ quanh chữ; ngày một đêm cân chữ giữa theo ảnh (F7); 1–2 show của nghệ sĩ dùng lưới hai cột (F8); thu hẹp thân trang sự kiện về 760 px cho đều (F10).
- **TL:** giới hạn tốc độ thêm bài MP3 (F5); `suppressHydrationWarning` đúng chỗ trên `<html>` (F6); Console gọi `freshen` sau mọi quyết định và sau khi nhập (F2); gán kiểu hàng SQL ở hai route nặng nhất rồi hạ ngân sách lint (F13).
- **CL:** cho bài biên tập tự đăng khi nhập (F3); tìm lý do nguồn Việt Nam không lên site và sửa ngay (F11); viết dài mọi bài lên 800+ từ (F4).
- **T-Fan:** lineup hai cột trên máy tính (F10).
- **T-Artist:** chữ "Đang đọc file…" trên nút khi thêm bài (F9).

## 5. Kiểm chéo và đồng thuận

| Đề xuất | Ý kiến chéo | Kết luận |
| --- | --- | --- |
| CD: thân trang sự kiện 760 px (F10) | CL: chủ sản phẩm vừa bỏ cột bên vì trang "lệch một bên"; một cột 760 dưới hero tràn ngang lại lệch. T-Fan đồng ý lineup đọc như một bảng | **Bỏ.** Giữ bề rộng; F10 ghi nhận, không sửa |
| T-Fan: lineup hai cột | TL: thứ tự theo giờ đọc sai khi chia cột; CD: thêm một kiểu bố cục | **Bỏ** |
| CL: bài biên tập tự đăng (F3) | TL, CD: đổi một quyết định đã ghi (bài qua kiểm duyệt) là việc của chủ sản phẩm, không làm trong đêm | **Thay bằng "Duyệt tất cả"** ở tab Chờ duyệt (vẫn là người bấm, một lần); câu hỏi tự đăng để sáng mai |
| CL: sửa nguồn Việt Nam (F11) | TL: không đọc được DB production/staging đêm nay (MCP Supabase chưa có token), Node trong sandbox không ra mạng nên không chạy adapter thật; đổi luật "không style thì chờ duyệt" là luật của chủ sản phẩm; Ciné Saigon có cả đêm drag (FEMME SINFUL), không chắc mọi đêm là EDM | **Không code.** Việc của chủ sản phẩm sáng mai: mở hàng chờ "Từ Radar" và duyệt các đêm Ciné Saigon; đề xuất cờ `styles` mặc định theo nguồn cho câu lạc bộ chỉ chơi nhạc điện tử, chờ quyết |
| CL: mọi bài 800+ từ (F4) | TL: viết thêm hàng nghìn từ ban đêm dễ đưa vào dữ kiện chưa kiểm; CD: sửa cái người đọc và Google thấy trước (sapo, định nghĩa, FAQ, nguồn, ảnh) | **Làm phần nhìn thấy**: 20 sapo ≤ 170, định nghĩa đúng khuôn, FAQ ≥ 25 từ, mỗi bài thêm ít nhất một nguồn uy tín không phải Wikipedia (đã kiểm 200), ảnh có giấy phép cho 4 bài thiếu. Độ dài để đợt sau, ghi điểm thật |
| TL: hạ `any` (F13) | CD: không đụng giao diện; CL: không ảnh hưởng | **Làm** ở `routes/artists.ts` và `routes/projects.ts`, hạ ngân sách |
| Còn lại (F1, F2, F5, F6, F7, F8, F9) | Không phản đối | **Làm** |

## 6. Việc đã thống nhất (thứ tự làm)

| Việc | Phát hiện | Xong khi | Cổng |
| --- | --- | --- | --- |
| N1 | F1 | chip blog không chồng ở 390 px, vùng chạm vẫn ≥ 44 px | `blog.spec` đo khung chip không giao nhau; targets |
| N2 | F2, F3 | quyết định/nhập ở Console làm mới `/blog` và bài ngay; "Duyệt tất cả (n)" ở tab Chờ duyệt | `blog.spec` (Console) |
| N3 | F5 | thêm bài MP3 quá 10 lần/10 phút trả 429 | `test/tracks.test.ts` |
| N4 | F6 | không còn cảnh báo hydration ở `/` | chạy lại script, console sạch |
| N5 | F7 | ngày một đêm từ 1100 px: chữ giữa theo chiều dọc cạnh ảnh | ảnh 1440 |
| N6 | F8 | 1–2 show: lưới hai cột | ảnh `/a/slimv` 1440; `artist.spec` |
| N7 | F9 | nút thêm bài nói "Đang đọc file…" khi chờ | `studio-artist` hoặc kiểm bằng mắt |
| N8 | F4 | `blog_check` chỉ còn cảnh báo về độ dài trên cả 20 bài; test gói nội dung giữ sapo ≤ 170 và ≥ 2 nhà xuất bản | `test/blog-content.test.ts`, `blog_check` |
| N9 | F13 | lint API dưới 1.103, ngân sách hạ | `npm run lint` |
| Đóng đêm | — | typecheck, lint, `npm test`, `test:screens` đầy đủ; điểm sau; push nhánh | tất cả |

## 7. Tiến độ (mỗi việc một commit trên `night/2026-10-21`)

| Việc | Commit | Đã làm | Kiểm |
| --- | --- | --- | --- |
| Kế hoạch | `a2f41bb` | tài liệu này: vai, phản hồi, điểm trước, giải pháp, kiểm chéo | — |
| N1 | `a2f41bb` | link chip giữ vùng chạm 44 px, nền tag chỉ quanh chữ; hàng cách 8 px | `blog.spec`: khung các chip ở 390 px không giao nhau |
| N2 | `dbc490b` | Console gọi `freshen` sau Duyệt/Gửi lại/Gỡ/Đăng lại; nút "Duyệt bài biên tập (n)" chỉ cho bài từ content pack (bài của người dùng vẫn đọc từng bài: kiểm chéo thêm điều kiện này), một thông báo "Đã duyệt n bài" | `blog.spec`: khách mở `/blog` trước, admin duyệt, khách thấy bài ngay |
| N3 | `0a9b182` | `POST /me/artist/tracks`: 20 lần mỗi 15 phút **theo tài khoản** (đổi địa chỉ IP không lách được) | `tracks.test`: lần thứ 21 trả 429, người khác cùng IP không bị chặn |
| N4 | `122ab89` | `suppressHydrationWarning` trên `<html>` kèm lý do | script: console `/` sạch |
| N5 | `067d695` | ngày một đêm từ 1100 px: ảnh 2:1, tên 32 px (đo DOM: chữ vốn đã căn giữa; cái lệch là tỉ lệ ảnh/chữ) | ảnh 1440 trước/sau |
| N6 | `ae98e8b` | 1–2 show: lưới hai cột | ảnh `/a/slimv` 1440 |
| N7 | `ae221f6` | nút thêm bài: "Đang đọc file…", `aria-busy` | typecheck |
| N8 | `6236448` | 19 sapo viết lại (140–170 ký tự, hai ngôn ngữ); nguồn mới đã kiểm từng link: Britannica (EDM, techno, drum and bass, trance; mở bằng trình duyệt vì Cloudflare chặn script), Merriam-Webster, Red Bull (techno 2019, drum'n'bass 2020), Dancing Astronaut, Boom Festival, Mixmag, Beatportal, EDMTunes; bỏ 4 link Wikipedia trùng; 3 câu trả lời FAQ đầy đủ hơn; định nghĩa psytrance EN 60 từ. Bỏ DJ Mag (trang thử thách chống bot, không vượt). `blog_check` của kit sửa hai lỗi của chính nó (Wikipedia en/vi là một nhà xuất bản; dấu phẩy sau thuật ngữ in đậm) | `blog-content.test`: sapo 140–170, ≥ 3 tên miền; `blog_check`: chỉ còn lỗi độ dài |
| N9 | `a670d6c` | kiểu cho hàng và body ở route nghệ sĩ, dự án | lint API 1.093 (ngân sách hạ từ 1.103) |
| Tài liệu | `7120b2a` | CLAUDE.md, roadmap, tech debt | — |

Ngoài kế hoạch, ghi lại: design-kit nhận bản sửa `blog_check` (`f0d4380`, đã push).

## 8. Đóng đêm: cổng

- `npm run typecheck` (API, test, e2e) xanh; `npm run lint`: API 1.093 cảnh báo (ngân sách 1.093), web 41/41, px 98/98, mọi dòng công khai đủ năm ngôn ngữ.
- `npm test`: 445 test, 444 pass, 0 fail (1 bỏ qua có chủ ý).
- `npm run test:screens`: 354 test, **332 pass, 0 fail**, 22 bỏ qua (ảnh so sánh, chạy riêng với `FF_VISUAL`). Ngân sách JS giữ nguyên hoặc thấp hơn: `/` 194/195, `/e/ravo` 193/193, `/a/slimv` 196/196, `/p` 181/181, `/studio/new` 210/210; CLS ≤ 0,015; LCP ≤ 568 ms ở trang chủ, ≤ 1,7 giây ở back office (ngân sách 2,0 và 3,5 giây).
- Bản xem trước khởi động lại: 10 bài blog đã đăng, sapo 149–160 ký tự.
- Script dùng thử chạy lại sau các sửa (62 ảnh): không cảnh báo hydration, không màn nào cuộn ngang hay có chữ hỏng; lỗi console còn lại là ảnh mẫu trỏ host không tồn tại (đúng ý: dữ liệu mẫu) và một 404 `/events/<id>/photos` do bản xem trước giữ cache trang của database trước (id mới sau mỗi lần khởi động). Đã sửa `scripts/preview.sh`: xoá cache fetch của Next mỗi lần tạo database mới.

- CI của PR #31 (chạy trên GitHub): API, Web, shard 1–2 xanh; **shard 3 đỏ** ở `studio-artist.spec.ts:54`. Trace của CI cho thấy menu "Không gian làm việc" chưa mở: cú bấm rơi vào lúc Studio chưa hydrate xong (máy CI chậm hơn; ở máy này shard 3 chạy riêng vẫn xanh, 95 pass). Test bấm lại tới khi menu mở (`9c8964b` ở nhánh này, `8f6d7d6` ở nhánh của #31) và push cả hai. **CI chạy lại trên #31: API (pglite, postgres), Web, cả ba shard Screens đều xanh.** "Design checklist" và "Visual" đỏ vì chờ người xem `visual-diff` và gắn `visual-ok` (luật của repo, agent không tự gắn).

## 9. Điểm sau

"10" theo định nghĩa ở đầu tài liệu: cổng tự động xanh có bằng chứng, không còn phản hồi P0/P1 của vai nào trong hạng mục, cách đo đã ghi. Cột "5 người thật" và "số sau hai tuần" của kit **chưa có ở hạng mục nào**: đó là điều kiện của 10 tuyệt đối, không làm được trong một đêm.

| Hạng mục | Trước | Sau | Còn thiếu gì cho 10 tuyệt đối |
| --- | --- | --- | --- |
| 1 Hình khối, hình ảnh | 8,5 | 9 | ≥ 80 % thẻ trên production có ảnh thật: việc nội dung |
| 2 Bố cục | 8,5 | 10 | 5 người thật |
| 3 Thẩm mỹ | 9 | 10 | 5 người thật |
| 4 UX/UI | 8,5 | 10 | 5 người thật |
| 5 Điều hướng | 9 | 10 | 5 người thật |
| 6 Flow | 8,5 | 10 | 5 người thật; duyệt blog cần chủ sản phẩm bấm một lần |
| 7 Mobile | 8,5 | 10 | 5 người thật trên máy thật (iPhone, Android) |
| 8 Trải nghiệm fan | 7,5 | 8 | **F11**: thêm đêm ở Việt Nam (hàng duyệt Radar, nguồn mới) |
| 9 Trải nghiệm nghệ sĩ | 8,5 | 10 | một nghệ sĩ thật dán MP3 của họ trên production |
| 10 Trải nghiệm nhà tổ chức | 9 | 10 | 5 người thật |
| 11 Code: chất lượng, độ bền | 8,5 | 9,5 | nợ 22: còn 1.093 `any` trên hàng SQL |
| 12 Hiệu năng, truy cập | 9,5 | 10 | số Web Vitals p75 thật sau deploy (Console › Số liệu) |
| Nội dung | 5 | 6 | F11; mười bài hướng dẫn còn 600–750 từ (chuẩn của kit là 800) |
| SEO/AIO | 8 | 9 | merge #31 để blog và JSON-LD mới lên production; độ dài bài |

Bốn vai đồng ý đánh giá này. CL ghi chú: Nội dung và Trải nghiệm fan là hai điểm thấp nhất, và không vai nào kéo chúng lên được bằng code trong một đêm.

## 10. Sáng mai (chủ sản phẩm, khoảng 15 phút)

1. **Merge [#31](https://github.com/kitsbui/FeestFinder/pull/31)** (Vercel tự deploy cả hai project; migration 058–061 chạy khi API khởi động). Sau đó tới nhánh `night/2026-10-21` (đã push lên GitHub, chưa mở PR theo luật của đêm): mở PR vào `main` sau khi #31 vào, hoặc nói "ship night build" để agent mở PR và chạy lại cổng.
2. Trong vòng 10 phút sau deploy, job nhập 10 bài blog: vào **Console › Blog**, bấm **"Duyệt bài biên tập (10)"**. Bài lên `/blog` ngay.
3. **Console › Kiểm duyệt**, lọc "Từ Radar": duyệt các đêm của Ciné Saigon (23–31.10) nếu đúng là EDM.
4. Quyết định (chọn một mỗi dòng):
   - Bài từ content pack: **A** giữ duyệt (một nút như trên, khuyến nghị) · **B** tự đăng khi nhập.
   - Câu lạc bộ chỉ chơi nhạc điện tử (Ciné Saigon…): **A** đặt style mặc định cho nguồn để đêm không ghi style vẫn lên hàng duyệt với style đó (khuyến nghị) · **B** giữ như hiện tại.
   - Độ dài bài hướng dẫn: **A** viết thêm lên 800+ từ trong đợt nội dung sau (khuyến nghị) · **B** giữ 600–750.
5. Buổi thử 5 người (`docs/DESIGN_GOVERNANCE.md`, design-kit `usertest/`): cột còn thiếu của mọi điểm 10.

## 11. Sáng 21.10: ba quyết định, làm theo khuyến nghị

Chủ sản phẩm: "tự động thực hiện cho đến khi hoàn thành, khởi động lại dev server cho tôi preview". Bản xem trước chạy lại ở http://localhost:3000 (nhánh này, 10 bài blog đã đăng). Ba quyết định của mục 10 làm theo phương án A:

| Quyết định | Đã làm |
| --- | --- |
| Bài biên tập | Giữ duyệt; nút "Duyệt bài biên tập (n)" (N2) là một lần bấm |
| Style mặc định theo nguồn | `config.styles` (tối đa 3 style có thật) cho câu lạc bộ chỉ chơi nhạc điện tử: đêm không ghi style nhận các style đó và thể loại EDM, điểm fit tăng ≥ 25, vẫn chờ duyệt. Ô "Dòng nhạc của nguồn" trong form nguồn của Console; Ciné Saigon đặt techno + house qua migration 062. Kiểm tra lại giả thuyết của đêm: một đêm club có link trang riêng đã đủ 27 điểm (> 25), nên các đêm Ciné Saigon nhiều khả năng **đang chờ trong hàng duyệt**, không bị loại; style mặc định giúp chúng có style, đứng cao hơn trong hàng và lọc được theo style. Test: `radar.test` (đêm không style, đặt style cho nguồn, "Xử lý lại", có techno + house, EDM, fit +25) |
| Độ dài bài hướng dẫn | Mỗi bài vệ tinh thêm "DJ mix … thế nào?" (tempo, phrase, EQ, harmonic mixing, nét riêng từng dòng); "EDM là gì?" thêm "Một track EDM được dựng thế nào?", "Club, rave và lễ hội khác nhau thế nào?", "Đêm EDM đầu tiên của bạn", "Đọc trang sự kiện trên FeestFinder". EN 800–930 từ, bài trụ 1.200+; VI 836–1.290 âm tiết. **20/20 bản đạt trọn `blog_check`**; `blog-content.test` giữ ngưỡng 800 và 1.200 |

Điểm Nội dung: 6 → 7 (blog đạt chuẩn của kit; production vẫn ít đêm ở Việt Nam cho tới khi hàng duyệt được xử lý). SEO/AIO giữ 9 cho tới khi merge.

