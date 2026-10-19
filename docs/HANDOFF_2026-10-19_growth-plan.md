# Kế hoạch tăng trưởng · handoff 2026-10-19 (bản 2)

| | |
| --- | --- |
| Nền code | `main` ở `48b2cf3` (design v2 phase 0–14 và 17 đã merge; migration tiếp theo `048`). Bản 1 của file này viết trên `f9baae0`, trước design v2, nên đã viết lại toàn bộ. |
| Luật trên hết | `CLAUDE.md`, rồi `docs/DESIGN_GOVERNANCE.md`. File này không lặp lại chúng. Nguyên tắc thiết kế lấy từ design-kit (`/home/patrickstar/Desktop/design-kit`, repo `kitsbui/design-kit`): đo trước, ngân sách chỉ giảm, hai thang điểm, một màn một việc, ba khái niệm trước, một cách làm một việc, gấp chứ không bỏ, dữ liệu thử xấu như production, quyết định của chủ dự án là lựa chọn có hệ quả và được chép nguyên văn. |
| Trạng thái | Chưa code. Tech lead và team đã duyệt hướng. **Chủ sản phẩm chọn A cho cả D1–D6 (2026-10-19)**; checklist đã chép vào roadmap, mục "Growth plan". Đối chiếu code xong (mục 7): còn **D5b và D3c** chờ chọn, mặc định A. Agent bắt đầu theo mục 5. |
| Cách đọc | Mục 1 trong ba phút. Mỗi việc là một **thẻ** cùng khuôn ở mục 4; agent làm đúng một thẻ, một lát (P0/P1/P2) mỗi PR. Thẻ chỉ "xong" khi cột **Xong khi** có số thật. |

---

## 1. Ba phút

**Kết luận.** Hạ tầng của FeestFinder lớn hơn catalogue và lớn hơn lượng người dùng. Thị trường 2026 trả tiền cho kinh tế fan, đi chơi theo nhóm, format ban ngày, và Đông Nam Á là nơi các brand EDM lớn đổ vào. Nhưng design v2 vừa mất ba ngày để gỡ "lằng nhằng" (≈30 khái niệm, 22 nút màn đầu); kế hoạch tăng trưởng không được trả lại số đó. Vì vậy từ 20 ý tưởng của buổi brainstorm còn **6 việc**, mỗi việc **không thêm khái niệm nào vào màn đầu của người mới**, 4 việc nằm trong back office hoặc vô hình, và mỗi việc có định nghĩa 10 điểm đo được ngay từ ngày đầu.

| # | Việc | Cho ai | Người mới thấy gì thay đổi | Số đo 10 điểm sau 2 tuần | Công |
| --- | --- | --- | --- | --- | --- |
| 1 | **Lịch** của nhà tổ chức: nhúng vào site của họ, hoặc kết nối lịch có sẵn để sự kiện tự về Studio chờ duyệt | Venue, promoter, collective | Không gì (Studio) | 20 lịch nhúng sống · 10 lịch kết nối · 100 sự kiện đến từ lịch · Đà Nẵng hoặc Nha Trang ≥ 5 sự kiện | 2,5 ngày |
| 2 | **Gửi sự kiện qua Zalo**: gửi poster hoặc link cho OA, nhận lại bản nháp và một link để gửi duyệt | Fan, collective, đội "scout" (chương trình vận hành, không code) | Không gì (Zalo và form cộng đồng có sẵn) | 100 bản nháp · 40% được gửi · 60% được duyệt · OA 1.000 follower | 2,5 ngày |
| 3 | **Hoa hồng cho đại sứ**: nhà tổ chức đặt % cho vé bán qua link chia sẻ; "Đại sứ" đã có trên trang sự kiện | Fan chia sẻ, nhà tổ chức bán vé trên FeestFinder | Một dòng "Hoa hồng 10%" trong sheet chia sẻ, chỉ khi có; một hàng "Hoa hồng" trong "Tôi", chỉ khi > 0 | ≥ 1 NTC bật · ≥ 5% đơn mang ref · 0 đơn tự giới thiệu | 2,5 ngày |
| 4 | **Ban ngày**: coffee rave, day party là một loại sự kiện; Radar tự nhận | Mọi người, cả Hà Nội đang siết club đêm | Thêm một giá trị trong menu "Kiểu đêm" trên máy tính; không tag, không chip mới trên điện thoại | ≥ 10 sự kiện ban ngày trong catalogue · ≤ 1/20 Radar gán nhầm | 1 ngày |
| 5 | **Nổi bật có trả tiền hiện trên trang chủ**: kệ của Console chiếm đúng ô "Lễ hội lớn thế giới" đang có, không thêm hàng | Nhà tổ chức mua chỗ, brand | Cùng một ô nổi bật, có khi là lễ hội, có khi là kệ với nhãn "Được tài trợ" | ≥ 1 chỗ bán được · card_open từ ô này ≥ 3% lượt xem trang chủ · màn đầu không tăng nút | 1 ngày |
| 6 | **Dữ liệu cho agent**: MCP server chỉ đọc và `/list.md` | ChatGPT, Claude, Gemini, người dùng của chúng | Không gì | 5/5 agent trả lời đúng "techno Sài Gòn cuối tuần" bằng dữ liệu FeestFinder · ≥ 200 lượt gọi · 0 lỗi 5xx | 1,5 ngày |

Thứ tự: **4 → 5 → 1 → 3 → 6 → 2** (mục 5). Tổng ≈ 11 ngày công, 14 PR.

**Số đo hôm nay** (2026-10-19, production, iPhone 13 giả lập, vi-VN, Asia/Ho_Chi_Minh; script ở phụ lục A). Đây là ngân sách: không việc nào được làm tăng.

| Số | Hôm nay | Cổng trong repo | Mục tiêu kit |
| --- | --- | --- | --- |
| Chỗ bấm màn đầu trang chủ (điện thoại) | 16 | `newcomer.spec.ts` `IN_SIGHT.home = 20` | ≤ 12 |
| Chỗ bấm màn đầu trang sự kiện (điện thoại) | 10 | `IN_SIGHT.event = 12` | ≤ 7 + khung |
| Sự kiện đầu tiên ở y | 255 px (trong màn đầu) | `pages.spec.ts` | trong màn đầu |
| Số màn của trang sự kiện | 4,2 | — | ≤ 5 |
| Khái niệm người mới gặp ở trang sự kiện | ≈ 7 (Radar ×4 lần nhắc, Pass vé, Hype, Hỏi đáp, Đi cùng bạn bè, Lễ hội lớn thế giới, quan tâm) | — | 5 |
| Tag mỗi thẻ | 1 (thẻ lễ hội: 1 tag + dấu Radar) | `card.tsx` một tag | 1 |
| Chỗ bấm màn đầu trang chủ (máy tính) | 29; bộ lọc vẫn "Mọi thành phố · Mọi lúc · Mọi kiểu · Mọi nguồn" | — | mùi AI #4, việc của design v2 |
| Lỗi JS | 0 | `health.spec.ts` | 0 |
| Nội dung | 22 sự kiện sắp tới, 1 ở TP.HCM, gần hết là Radar | — | 500+ |

Hai số đo lệch (16 so với ngân sách 20) vì cách đếm khác nhau; **`controlsInSight` trong `newcomer.spec.ts` là thước chuẩn**, script phụ lục A là cách đo nhanh trên production. Hai thứ thấy thêm khi đo, không thuộc kế hoạch này nhưng nên vào design v2: "Pass vé 0" vẫn hiện số 0 (mùi #15) và máy tính còn bộ lọc "Mọi X" (mùi #4).

---

## 2. Chủ sản phẩm quyết (trước khi code)

Mỗi câu hỏi 2–3 lựa chọn có hệ quả, lựa chọn đầu là khuyến nghị. **Đã chọn: A cho cả sáu (chủ sản phẩm, 2026-10-19).** Dòng "Checklist" của mỗi lựa chọn A đã chép nguyên văn vào roadmap; agent code theo checklist đó, không theo trí nhớ.

| # | Câu hỏi | Lựa chọn và hệ quả |
| --- | --- | --- |
| D1 | Sự kiện đến từ lịch mà nhà tổ chức tự kết nối là gì? | **A (khuyến nghị): "Đã đăng", dưới tên nhà tổ chức, chờ duyệt như mọi tin.** Hệ quả: thêm một dòng `event_sources` provider `organizer`; `origin = posted`. *Checklist: "Sự kiện từ lịch kết nối thuộc NTC đó, in_review, provider organizer + adapter; không gộp vào sự kiện của NTC khác."* · B: "Radar" dưới Feest Radar, NTC nhận sau. Hệ quả: thêm một bước cho NTC, họ thấy tin của mình gắn tên Feest Radar. · C: lên thẳng không duyệt. Không đề xuất: trái quy tắc mọi tin đều chờ duyệt. |
| D2 | Zalo làm gì trước? | **A (khuyến nghị): OA bot gửi poster (thẻ 2). Mini App chỉ khi OA ≥ 1.000 follower và có quyết định pháp lý về số điện thoại Zalo (mục 6).** *Checklist: "Zalo OA nhận poster hoặc link → bản nháp → form cộng đồng → hàng chờ; không đăng từ Zalo; Mini App để sau."* · B: cả hai ngay. Hệ quả: +5 ngày, cần review của Zalo, CORS cho `h5.zdn.vn`. · C: chỉ Mini App. Hệ quả: mất luồng poster, là luồng có giá trị nhất. |
| D3 | Hoa hồng đại sứ trả bằng cách nào? | **A (khuyến nghị): qua payout của FeestFinder, trừ khỏi payout của NTC, trả cho đại sứ bằng tài khoản `/me/payee` có sẵn; trần 20%.** Hệ quả: FeestFinder chuyển tiền cho cá nhân, cần kế toán xác nhận (mục 6). *Checklist: "events.ambassador_pct ≤ 20; orders.ref_user; earnings pending → payable sau sự kiện 24h → paid qua ambassador_payouts; dòng trừ trong ledger của NTC; không phí người mua."* · B: NTC tự trả ngoài, FeestFinder chỉ hiện số. Hệ quả: không cầm tiền, nhưng đại sứ phải tin NTC. · C: thưởng bằng vé, không tiền. Hệ quả: cần nối `guest_list`; ít hấp dẫn hơn với fan. |
| D4 | "Ban ngày" là gì trong dữ liệu? | **A (khuyến nghị): `event_type = 'day'`.** Hệ quả: một migration nới CHECK; Studio và Console chọn được; Radar gán tự động. *Checklist: "EVENT_TYPES thêm day; inferEventType theo giờ 06–15:59 bắt đầu và kết thúc trước 21:00 hoặc từ khoá; festival thắng."* · B: cờ suy ra từ giờ, không lưu. Hệ quả: không migration, nhưng NTC không chọn được, Smart Alerts không lọc được. |
| D5 | Kệ nổi bật hiện ở đâu và ghi gì? | **A (khuyến nghị): kệ chiếm đúng ô "Lễ hội lớn thế giới" (`data-surface="flagship"`) khi có kệ bật với ≥ 3 sự kiện; tiêu đề là tên kệ, cạnh đó chữ nhỏ "Được tài trợ" khi kệ đến từ placement trả tiền; thẻ mang tag "Nổi bật" sẵn có.** Hệ quả: không thêm hàng, màn đầu không tăng nút. *Checklist: "Một ô nổi bật duy nhất: kệ nếu có, không thì lễ hội; nhãn Được tài trợ khi trả tiền; không hiện trong /app."* · B: kệ dưới danh sách cạnh banner quảng cáo. Hệ quả: ngoài màn đầu, ít giá trị bán. · C: ngừng bán placement này. |
| D6 | MCP cho agent có xác thực không? | **A (khuyến nghị): chỉ đọc, không khoá, rate-limit 60/phút/IP, không bao giờ trả dữ liệu người xem.** *Checklist: "/mcp và /list.md stateless, chỉ dữ liệu đã công khai ở /e/<slug>.md; không mua vé qua agent."* · B: khoá API theo agent. Hệ quả: ít agent dùng. · C: chưa làm. |

Hai câu mới từ đối chiếu code (mục 7), chưa chốt, có mặc định để làm luôn:

| # | Câu hỏi | Lựa chọn và hệ quả |
| --- | --- | --- |
| D5b | Ô nổi bật chỉ vẽ khi bộ lọc ở mặc định (`browser.tsx:416`: mọi thành phố, lưới, không bbox). Từ phase 13 người Việt quay lại được nhớ thành phố đã chọn, nên sẽ **không bao giờ** thấy kệ trả tiền. | **A (khuyến nghị): ô nổi bật cũng vẽ khi thành phố đã chọn có ít nhất một sự kiện trong kệ (lọc kệ theo thành phố đó); lễ hội giữ luật cũ.** Hệ quả: một điều kiện thêm trong `browser.tsx`, kệ đến được người đã chọn thành phố. · B: giữ luật cũ, nói với người mua chỗ rằng kệ chỉ hiện ở chế độ mặc định. · C: luôn vẽ kệ ở mọi bộ lọc. Hệ quả: kệ Bangkok hiện cho người đang lọc TP.HCM, mùi quảng cáo. |
| D3c | Mục "Đại sứ" cuối trang sự kiện đã công khai tên (chỉ tên gọi) và số khách của người chia sẻ. Khi có tiền, đó cũng là danh sách người đang nhận hoa hồng. | **A (khuyến nghị): giữ như hiện nay** (tên gọi, số lượt mở; không số tiền). · B: ẩn mục khi sự kiện có hoa hồng. Hệ quả: mất bằng chứng xã hội đang có. · C: thêm nút tắt hiển thị trong Cài đặt. Hệ quả: thêm một điều khiển. |

Đã chốt sẵn, không hỏi lại: Feest Scout **không cần code** (chương trình vận hành trên Zalo OA và form cộng đồng, mục 6); link du lịch, Mini App, Crew, Night Pass, merch để sau với điều kiện ở mục 6.

---

## 3. Tự đánh giá: 20 ý tưởng thành 6 việc

Áp nguyên tắc của kit lên bản brainstorm và bản handoff 1. Cột "Vì" là nguyên tắc đã quyết.

| Ý tưởng (brainstorm) | Quyết định | Vì |
| --- | --- | --- |
| Widget lịch venue + kết nối lịch | **Giữ, gộp thành một khối "Lịch"** trong Studio › Hồ sơ | Một màn một việc; không thêm mục rail (rail Studio đã 7) |
| Zalo OA bot | **Giữ** | Phân phối ở nơi scene đang sống; tái dùng app Zalo của phase 17 (`provider_tokens`, `ZaloZnsTransport`) |
| Zalo Mini App | **Để sau** | Thêm một sản phẩm, một nền tảng review, một quyết định pháp lý |
| Feest Scout | **Bỏ khỏi code** | "Scout" và "Đại sứ" là hai từ cho một hành vi (người góp sức); form cộng đồng, huy hiệu `spread`, Console đã đủ để vận hành |
| Đại sứ đêm (hoa hồng) | **Giữ, không đặt tên mới**: "Đại sứ" đã là mục trên trang sự kiện (`ev.ambassadors`), chỉ thêm tiền | Một khái niệm đã có; màn mới duy nhất là "Hoa hồng" trong "Tôi", gấp theo kit |
| Loại "Ban ngày" + tag mặt trời trên thẻ | **Giữ loại, bỏ tag** | Một thẻ một tag, và chỉ tag đổi quyết định; giờ bắt đầu đã nói "ban ngày" |
| Kệ nổi bật thành hàng mới trên trang chủ | **Giữ, nhưng chiếm ô đang có** | Màn đầu không được tăng nút; sự kiện đầu tiên phải ở màn đầu |
| "Đến <thành phố>" 3 nút du lịch | **Để sau**, một hàng trong "Thêm", khi ≥ 2 thành phố có ≥ 50 sự kiện | Mỗi hành động một lần, phần phụ gấp vào "Thêm"; chưa có cầu liên thành phố |
| MCP + /list.md | **Giữ** | Vô hình với người dùng, đi trước vùng |
| Hỏi Feest (trợ lý AI) | **Để sau** | Thêm khái niệm; `/app/guide` đã có |
| Crew vote nhiều sự kiện | **Để sau**, mở rộng "Đi cùng bạn bè" có sẵn, không từ mới | Chờ 5 người thật nói cần |
| Bàn cho người đi một mình | **Để sau** | Khái niệm mới, quy tắc an toàn chưa có |
| Drop bí mật | **Để sau** (một trường trên sự kiện) | Nhỏ; chờ NTC đầu tiên hỏi |
| Track ID | **Để sau** (`event_posts.kind = 'trackid'` đã có) | Chờ Moments có người dùng |
| Vé an toàn | **Để sau** | Chưa có khối lượng vé FeestFinder để nói chuyện |
| Night Pass | **Để sau** | Cần hợp đồng ≥ 4 venue trước dòng code đầu |
| Merch drop | **Để sau** | Đổi cấu trúc đơn hàng; chưa ai hỏi |
| Insights cho brand | **Để sau** (Console) | Chờ 3 yêu cầu quảng cáo hỏi số |
| Báo cáo quý, EPK, live-selling | **Để sau** | Chặng 3 |

Lỗi của bản 1 đã sửa ở bản này: viết trên `f9baae0`, trước 22 PR của design v2 (hai ngày code); đặt `integration_tokens` trùng `provider_tokens` (migration 047); dùng `payout_transfers` sai mục đích; "Scout" thêm khái niệm trùng; hàng kệ mới và tag mặt trời phá ngân sách màn đầu và luật một tag; ba nút du lịch phá "mỗi hành động một lần"; format kể việc theo workstream thay cho bằng chứng đo được.

---

## 4. Sáu thẻ việc

Khuôn mỗi thẻ: **Một câu** · **Người dùng thấy** (chữ trên màn, vi · en, chép nguyên văn) · **Không làm** · **10 điểm** (ba cột của `DESIGN_GOVERNANCE.md`: cổng tự động, 5 người thật, số sau 2 tuần) · **Ngân sách không tăng** · **Dữ liệu xấu phải chạy** · **Xây** (lát ≤ 1 ngày, một PR mỗi lát) · **Xong khi**.

### Thẻ 4 · Ban ngày

**Một câu.** Coffee rave, matcha rave, sunset session, day party là một loại sự kiện FeestFinder biết: Radar tự nhận, menu loại có nó, Studio chọn được.

**Người dùng thấy.** Máy tính: menu "Kiểu đêm" thêm giá trị `Ban ngày · Day party`. Studio wizard và Console editor: ô loại có thêm giá trị đó (đọc từ `/meta/discovery`, không hard-code). Điện thoại: không thêm chip, không thêm tag; giờ bắt đầu "10:00" trên hàng đã nói đủ. Markdown của trang (`/e/<slug>.md`): "Loại: Ban ngày".

**Không làm.** Không tag trên thẻ. Không chip lọc mới trên điện thoại. Không đổi JSON-LD `@type`. Smart Alerts theo loại: P2 tuỳ chọn, chỉ khi thêm được vào màn cài đặt mà không thêm hàng điều khiển (một chip trong hàng chip style sẵn có).

**10 điểm.**
- Cổng: `test/radar.test.ts` 6 ca `inferEventType` (coffee rave 09:00–13:00 → `day`; club 22:00–04:00 → `club`; festival 14:00–23:00 → `festival`; "Sunset Session" 17:00–21:00 → `day`; không `endTime` → không `day`; "tiệc ban ngày" → `day`); `test/public.test.ts` `?type=day` chỉ trả `day`; `list.spec.ts` menu máy tính có "Ban ngày" và chọn nó còn đúng 1 thẻ seed; `newcomer.spec.ts` không đổi số.
- 5 người: 2 nhà tổ chức đăng một sự kiện ban ngày trong wizard và chọn đúng loại mà không cần gợi ý.
- 2 tuần: ≥ 10 sự kiện `day` trong catalogue (Radar và đăng); team mở 20 Radar `day` ngẫu nhiên từ Console, ≤ 1 gán nhầm.

**Ngân sách không tăng.** Màn đầu điện thoại 16/10 chỗ bấm; menu máy tính thêm một mục trong menu đã có (không phải chỗ bấm màn đầu).

**Dữ liệu xấu phải chạy.** Festival 14:00 → vẫn `festival`. 05:00–10:00 afterhours → không `day` (bắt đầu trước 06:00). Nguồn ghi "brunch" bị `skip` theo cấu hình nguồn như hiện nay, không phải việc của loại. Sự kiện cũ không có loại → giữ null.

**Xây.**
- P0 (½ ngày): migration `048_day_events.sql` nới CHECK `events.event_type` và `projects.event_type` (lấy tên constraint thật từ `pg_constraint`, không đoán); `lib/styles.ts`: `EVENT_TYPES` thêm `'day'` trước `'other'`, `EVENT_TYPE_LABEL.day = L('Day party', 'Ban ngày')`, `inferEventType` theo checklist D4 (từ khoá: `coffee rave|matcha rave|day ?party|daytime|morning rave|sunset session|sunrise|tiệc ban ngày|ban ngày|sober rave|wellness rave`). **Thứ tự quyết định** (mục 7): luật `day` đứng ngay sau luật festival và **trước** các luật từ khoá `rave`, `party`, `club`, vì "coffee rave" đang trả `rave` và "day party" trả `party` ở `lib/styles.ts:150-153`. `services/ingest/fit.ts:82-85` cho `day` cùng điểm với `party` (hiện `day` rơi vào không điểm). Test.
- P1 (½ ngày): seed một coffee rave 09:00–13:00 ở TP.HCM style house (`test/fixtures/seed.ts`); đổi nhãn menu máy tính `kind: { en: 'Night', vi: 'Kiểu đêm' }` (`kd/web/list/copy.ts:22`) thành `{ en: 'Kind', vi: 'Loại' }`, vì "Kiểu đêm: Ban ngày" tự mâu thuẫn (ảnh `visual.spec.ts` của thanh lọc đổi: xem rồi `visual-ok`); `TYPE_CHIPS` ở `browser.tsx:66` giữ nguyên (không thêm chip); `list.spec.ts`; `pageMarkdown` ghi loại; `CLAUDE.md` mục "EDM only" thêm một dòng về `day`; roadmap.

**Xong khi.** Cổng xanh; trên production một Radar find thật được gán `day` (team kiểm 20 bản ghi, ghi số vào roadmap); `CLAUDE.md` có dòng mới.

### Thẻ 5 · Nổi bật có trả tiền hiện trên trang chủ

**Một câu.** Kệ mà Console đã bán ("Kệ nổi bật", tech debt 17) hiện ở đúng ô nổi bật đang có trên trang chủ, thay lễ hội khi có kệ, với nhãn tài trợ.

**Người dùng thấy.** Ô đầu danh sách (hôm nay là "Lễ hội lớn thế giới"): khi có kệ bật trong khung ngày với ≥ 3 sự kiện live sắp tới, tiêu đề là tên kệ, cạnh tiêu đề chữ `kd-m` `Được tài trợ · Sponsored` nếu kệ đến từ placement trả tiền; thẻ trong kệ mang tag `Nổi bật · Featured` sẵn có (`card.tsx` `e.featured`). Không có kệ thì ô là lễ hội như hôm nay. Không có cả hai thì không có ô.

**Không làm.** Không hàng mới. Không trong `/app` (tech debt 18 đã quyết gộp app về site). Không banner thêm. Không "n quan tâm".

**10 điểm.**
- Cổng: `test/public.test.ts` `/shelves` trả `sponsored` và chỉ sự kiện live sắp tới; một nguồn sự thật cho `featured`: sự kiện trong kệ bật trong khung ngày ⇒ `featured` trên thẻ (kiểm nơi `shelf_items` được ghi trong `routes/admin/catalog.ts` và nơi boost được duyệt lên kệ); `home.spec.ts` ô kệ với 3 thẻ ở 390 và 1440, nhãn khi `sponsored`; `newcomer.spec.ts` `IN_SIGHT.home` **không tăng** với seed có kệ (seed W0); `layout.spec.ts`; `visual.spec.ts` (ảnh trang chủ đổi: xem `visual-diff`, gắn `visual-ok`).
- 5 người: hỏi 5 người mới "hàng nào là trả tiền?": ≥ 4/5 chỉ đúng nhờ nhãn; không ai gọi trang chủ là "toàn quảng cáo".
- 2 tuần: ≥ 1 placement bán được; `card_open` với `surface: 'flagship'` ≥ 3% lượt `page_view` trang chủ; sự kiện đầu tiên vẫn trong màn đầu.

**Ngân sách không tăng.** 16 chỗ bấm màn đầu điện thoại; ô nổi bật là ô đang có; số thẻ trong ô ≤ số thẻ lễ hội hôm nay hiện (4 ở 1440, 1–2 ở 390 theo `kd-cards`).

**Dữ liệu xấu phải chạy.** Kệ có sự kiện đã qua, đã hết vé, bị giữ vì báo cáo → bị lọc; kệ chỉ còn 2 sự kiện → không hiện; kệ hết khung ngày → không hiện; kệ và lễ hội cùng có → kệ thắng; sự kiện vừa trong kệ vừa là lễ hội → một tag (`Nổi bật` vì `cardTag` xét theo thứ tự có sẵn: giữ thứ tự hiện tại trong `card.tsx:24-30`, không thêm nhánh).

**Xây.**
- P0 (½ ngày): `GET /shelves` thêm `sponsored` (kệ sinh từ boost request hoặc `ad_campaigns` được duyệt) và nhận `?city=` để lọc mục theo thành phố (D5b); `featured` trên thẻ **suy ra trong `presentCard`**: `e.featured` **hoặc** sự kiện nằm trong một kệ bật trong khung ngày (subquery trong `CARD_COLUMNS`), không ghi thêm cột, vì hôm nay `featured` chỉ được admin đặt tay ở `PATCH /admin/events/:id` (`routes/admin/ops.ts:335`) và boost duyệt lên kệ không chạm cột đó; test.
- P1 (½ ngày): `kd/web/list/page.tsx`: `highlight` = kệ đầu tiên đủ điều kiện, không thì flagship; `browser.tsx:416` thêm điều kiện D5b (kệ vẽ khi `f.city` nằm trong các thành phố của kệ); thẻ mở từ ô này gọi `/events/:id/track` với `source: 'shelf'` (đã có trong enum ở `routes/catalog.ts:514`) và `card_open` với `surface: 'shelf'`; `kd/fresh-paths.ts` thêm kind `s` (kệ) làm mới `/` và `/en`, và `kd/console/featured.tsx` gọi `freshen('s', slug)` sau mỗi thay đổi kệ, nếu không trang chủ giữ bản cũ tới 60 giây; `kd/web/list/copy.ts` `sponsored`; seed một kệ 3 sự kiện (W0); `home.spec.ts`; `TECH_DEBT.md` 17 ghi "Resolved"; roadmap.

**Xong khi.** Cổng xanh, `visual-ok` đã gắn sau khi xem ảnh; trên production team tạo một kệ 3 sự kiện trong Console và script phụ lục A đo lại: chỗ bấm màn đầu ≤ 16, sự kiện đầu tiên trong màn đầu, ô có nhãn.

### Thẻ 1 · Lịch của nhà tổ chức

**Một câu.** Trong Studio › Hồ sơ có khối "Lịch": dán hai dòng vào website của mình để lịch FeestFinder hiện ở đó; hoặc dán địa chỉ lịch có sẵn (ICS, trang có JSON-LD) để sự kiện tự về Studio chờ duyệt dưới tên mình.

**Người dùng thấy.** Studio › Hồ sơ (`kd/studio/profile.tsx`, một `Block` mới sau "Hồ sơ công khai", trước "Doanh nghiệp và liên hệ"), tên `Lịch · Calendar`, hai phần:
- `Nhúng vào website · Embed on your website`: snippet trong `<pre>` gói dòng, nút `Sao chép · Copy`, chọn ngôn ngữ và nền (`Tối · Sáng`), `Xem trước · Preview` (iframe `srcdoc`). Snippet:
  ```html
  <div data-ff-org="<slug>" data-ff-lang="vi" data-ff-theme="dark" data-ff-limit="6"></div>
  <script src="https://feestfinder.com/ui/widget/ff-widget.js" async></script>
  ```
- `Kết nối lịch có sẵn · Connect an existing calendar`: một ô `Địa chỉ lịch · Calendar address` (hint định dạng duy nhất: `https://…`), nút `Kết nối · Connect`. Khi đã nối: một hàng `Đọc lần cuối {t} · Last read {t}`, `{n} chờ duyệt · {n} in review` làm aside, nút `Ngắt · Disconnect`. Lỗi: `Không tìm thấy sự kiện ở địa chỉ này · No events at this address`, `Trang không cho đọc (robots.txt) · The page does not allow reading (robots.txt)`, `Không mở được · Could not reach it`.
- Widget (trên site của họ): mỗi dòng thứ + ngày, tên, venue · giá (`Miễn phí`, `Chưa rõ giá` theo quy tắc `priceUnknown`), chân `Xem tất cả trên FeestFinder · See all on FeestFinder`. Vanilla JS, Shadow DOM, không tải font, dưới 8 KB gzip, không theo dõi.
- Console: hàng chờ gắn nhãn `Từ lịch · From calendar` cho tin có provider `organizer` kèm adapter; `/console/sources` cột `Nhà tổ chức · Organiser`.

**Không làm.** Không mục rail mới. Không trang công khai mới. Một lịch mỗi nhà tổ chức. Không xoá sự kiện khi nó biến mất khỏi lịch. Không gộp bản ghi vào sự kiện của nhà tổ chức khác (tạo candidate riêng cho đội duyệt). Nhà tổ chức placeholder (Feest Radar, Cộng đồng) không có lịch kết nối, nhưng vẫn nhúng được.

**10 điểm.**
- Cổng: `test/embed.test.ts` (mới): `/embed/organizers/:slug` chỉ live sắp tới, header `Access-Control-Allow-Origin: *`, không trường của người xem, 404 slug lạ, `.ics` đọc lại được bằng parser của adapter `ics`, đúng `TZID`; `test/ingest.test.ts`: fixture ICS 3 sự kiện nối bởi Ravolution → 3 `in_review` thuộc Ravolution, `origin = posted`, hai dòng `event_sources`; chạy lại không tạo thêm; đổi giờ sự kiện đã live → `needs_review_fields` có `startTime`, tin vẫn live; `http://` bị từ chối; fixture rỗng → `no_events`; record trùng sự kiện của NTC khác → candidate riêng; `test/organizer.test.ts`: không phải thành viên → 403, placeholder → 400; e2e `widget.spec.ts` (mới): trang HTML tĩnh nhúng `ff-widget.js` từ `:3100` với `data-ff-api` trỏ `:4100` → shadow root đúng số dòng, click mở `/e/<slug>?src=widget`; `studio.spec.ts`: khối Lịch ở 390 không cuộn ngang (`white-space: pre-wrap`), `/studio/profile` đã trong `ROUTES` nên layout, axe, 44 px chạy sẵn; `perf.spec.ts` không gate `/studio/profile`: đo một lần và ghi ngân sách nếu thêm vào danh sách.
- 5 người: 2 chủ venue nhúng được vào một trang test (hoặc site thật) trong < 3 phút không gợi ý; 2 collective dán link Google Calendar công khai (ICS) và thấy sự kiện của mình ở `/studio/events` lọc "Chờ duyệt"; 1 admin duyệt cả đợt bằng bulk approve và thấy nhãn "Từ lịch".
- 2 tuần: ≥ 20 host khác nhau có `event_view` với `source: 'widget'` (PostHog); ≥ 10 `ingest_sources` có `organizer_id`; ≥ 100 sự kiện có `event_sources` provider `organizer` kèm adapter; Đà Nẵng hoặc Nha Trang ≥ 5 sự kiện sắp tới; thời gian duyệt trung vị không tăng (Console › Số liệu).

**Ngân sách không tăng.** Không chạm màn đầu người mới. Rail Studio giữ 7 mục. Profile Studio: +1 `Block`, không bảng rộng.

**Dữ liệu xấu phải chạy.** ICS: sự kiện không `LOCATION`; `DTSTART` ở múi khác thành phố; sự kiện cả ngày (`VALUE=DATE`); `DESCRIPTION` có HTML; `STATUS:CANCELLED` → `cancelled`; `RRULE` → chỉ lấy lần đầu, ghi lý do. JSON-LD: trang có sự kiện ở thành phố khác với NTC (giữ thành phố của bản ghi, `out_of_area` nếu chưa mở); trang Megatix ghi +08:00 cho Sài Gòn (dùng `wallClock` như starter). Lịch 300 sự kiện → đọc theo budget 20 s mỗi lần, phần còn lại lần sau.

**Xây.**
- P0 (1 ngày): migration `049_organizer_calendar.sql` `ingest_sources.organizer_id uuid references organizers on delete cascade` + unique partial index. `services/ingest/run.ts`, chỉ phần **tạo**: `createCandidate` (`run.ts:308`) nhận thêm `organizerId` thay cho `holder` khi nguồn có `organizer_id`; trong `resolveAndApply` (`run.ts:204-237`), một match ≥ `mergeAt` tới sự kiện của **NTC khác** không `attachSource`/`enrich` mà tạo candidate dưới NTC của nguồn với `match` lưu để `flagRisk` đánh dấu trùng; bỏ `FIT_FLOOR` nhưng vẫn lưu fit; thêm dòng `event_sources` provider `organizer` cạnh dòng adapter (mẫu `report.ts:26`). `enrich` (`run.ts:283`) hôm nay chỉ điền chỗ trống và chỉ lấy ảnh, lineup, pin cho NTC `is_community`: mở rộng cho `source.organizer_id === ev.organizer_id`. **Không** đổi giờ, tên, giá của sự kiện đã live trong P0. `routes/organizer/calendar.ts` `GET/POST/DELETE /organizer/calendar` (đoán adapter theo `.ics` hay `text/calendar`, fetch thử bằng `IngestIO`, chạy ngay một lần, rate-limit 5/phút vì fetch chạy đồng bộ); `notifyAdmins` một lần mỗi đợt; tests.
- P1 (1 ngày): `routes/embed.ts` (`/embed/organizers/:slug`, `.ics`; vào `PUBLIC_READS`; header CORS trong route; server dựng `dateLabel`, `timeLabel`, giá bằng `lib/format.ts`, widget không tính giờ); `festfinder-frontend/ui/widget/ff-widget.js`; `scripts/copy-ui.ts` thêm `widget`; khối Lịch trong `kd/studio/profile.tsx` và copy trong `kd/studio/copy.ts`; `kd/web/event/context.tsx` thêm `source: 'widget'` vào `event_view` khi `?src=widget`; `widget.spec.ts`, `studio.spec.ts`.
- P2 (1 ngày): **bản sửa từ lịch**: khi record khớp sự kiện live của cùng NTC và một trường trong `REVIEWED_FIELDS` (`routes/organizer/events.ts:105`) khác, viết `needs_review_at/fields/before` thay vì ghi thẳng. Logic ấy đang nằm trong route (`events.ts:336`); tách thành `services/listing.ts` `proposeRevision(q, eventId, patch, now)` để route và pipeline dùng chung, không chép. Nhãn Console, cột `/console/sources`; `CLAUDE.md` mục "Sources" thêm: lịch kết nối là nguồn có `organizer_id`, sự kiện là đã đăng dưới NTC và chờ duyệt; `/embed/*` là feed công khai mở CORS mà `ui/widget/ff-widget.js` đọc; `docs/CURRENT_ARCHITECTURE.md` bảng nguồn thêm "Organiser calendar"; roadmap.

**Xong khi.** Cổng xanh; trên production: một trang HTML trong scratchpad nhúng lịch của một NTC thật mà chủ sản phẩm chọn và hiện đúng số sự kiện của `/o/<slug>`; `.ics` mở được trong Google Calendar; NTC thử của chủ sản phẩm nối một ICS và thấy tin chờ duyệt; số host có `source: widget` bắt đầu đếm trong PostHog.

### Thẻ 3 · Hoa hồng cho đại sứ

**Một câu.** "Đại sứ" (mục cuối trang sự kiện: những người mang khách tới qua link chia sẻ `?ref=`) có thêm tiền: nhà tổ chức bán vé trên FeestFinder đặt một %, mỗi đơn đã trả qua link của ai sinh hoa hồng cho người đó, trả qua payout có sẵn.

**Người dùng thấy.**
- Sheet chia sẻ (`kd/web/event/actions.tsx`): dưới tiêu đề, một dòng `kd-s` `Hoa hồng {p}% · Commission {p}%`, chỉ khi sự kiện có % **và người xem đã đăng nhập** (chưa đăng nhập thì link chia sẻ không có `ref`, hiện dòng này sẽ khiến họ hỏi "link của tôi đâu"; không ép đăng nhập ở hành động chia sẻ, theo kit). Sau khi sao chép: toast `Đã sao chép link · Link copied` (như hiện nay).
- "Tôi" (`kd/web/me.tsx`): hàng `Hoa hồng · Commission`, aside là tổng đang chờ và đã nhận (`formatMoney`), **chỉ khi > 0**. Mở `/app/commission` (màn mới, vào `ROUTES` vai fan): bảng `Table`/`Row` cột `Sự kiện · Lượt mở · Đơn · Hoa hồng · Trạng thái` (trạng thái: `Chờ · Pending`, `Có thể trả · Payable`, `Đã trả · Paid`, `Huỷ · Void`), nút phụ `Tài khoản nhận tiền · Payout account` tới form payee có sẵn; rỗng: `Chưa có hoa hồng. Chia sẻ một đêm · No commission yet. Share a night` (một câu, một hành động).
- Studio editor, bước Vé: switch `Hoa hồng đại sứ · Ambassador commission` và ô `%` (hint `1–20`). `/studio/revenue`: dòng ledger `Hoa hồng đại sứ · Ambassador commission` (âm). `/studio/attendees`: cột `Đại sứ · Ambassador` (tên người, có thì hiện).
- Console `/console/affiliate`: tab `Đại sứ · Ambassadors` với payout theo kỳ, nút `Đánh dấu đã trả · Mark paid` (như payouts của partner).

**Không làm.** Không từ mới ("Đại sứ" đã có). Không bảng xếp hạng mới (top 5 theo lượt mở đã có, giữ). Không phí người mua. Không hoa hồng cho vé bán ngoài (vẫn đếm lượt mở). Không tự giới thiệu. Không thay đổi màn đầu. `/app/commission` không hiện khi chưa có gì (hàng "Tôi" ẩn).

**10 điểm.**
- Cổng: `test/ambassador.test.ts` (mới): share → `?ref=`; đặt vé với `ref` → `orders.ref_user`; thanh toán giả → earnings `pending` đúng số (vé 350.000, giảm 50.000, 10% → 30.000); tự mua → không ghi; không % → không ghi; hoàn tiền → `void`; job sau `ends_at + 24h` → `payable`; payout → `paid`, ledger NTC trừ đúng; không payee → vẫn `payable`; `GET /me/commission` đúng tổng; `ambassadorPct` 25 → 400. E2E `event.spec.ts`: sheet có dòng khi seed đặt % cho `ravo`; `app-more.spec.ts`: `/app/commission` ở 390 và 1440; `routes.ts` thêm `/app/commission`; `perf.spec.ts` ngân sách đo một lần; `newcomer.spec.ts` không đổi.
- 5 người: 3 fan chia sẻ một đêm cho bạn từ điện thoại và sau một đơn thử tìm thấy hàng "Hoa hồng" trong "Tôi" không gợi ý; 2 nhà tổ chức bật 10% trong editor không gợi ý.
- 2 tuần: ≥ 1 NTC bật; ≥ 5% đơn mang `ref_user`; 0 đơn có `ref_user = user_id`; phễu `share` → `event_view` (ref) → đơn đọc được trong PostHog và Console.

**Ngân sách không tăng.** Màn đầu trang sự kiện 10 chỗ bấm (sheet mở khi bấm; mục Đại sứ nằm cuối trang). "Tôi": +1 hàng chỉ khi có tiền.

**Dữ liệu xấu phải chạy.** `ref` của tài khoản đã xoá → bỏ qua; `ref` quá 30 ngày trong `localStorage` → không gửi; đơn hoàn sau khi `payable` → `void` và trừ lại ledger; đổi % sau khi có đơn → earnings giữ % lúc đặt; sự kiện có % nhưng không có hạng vé → không gì xảy ra; hai đơn cùng người cùng ref → hai earnings, một mỗi đơn.

**Xây.**
- P0 (1 ngày): migration `050_ambassadors.sql`: `events.ambassador_pct numeric(5,2) check (> 0 and <= 20)`; `orders.ref_user uuid references users on delete set null` + index; `ambassador_earnings (id, order_id unique, event_id, organizer_id, user_id, pct, amount bigint, status pending|payable|paid|void, payout_id, created_at, payable_at, paid_at, voided_at)`; `ambassador_payouts (id, user_id, period_from, period_to, amount, status open|paid, created_by, created_at, paid_at)` theo mẫu `affiliate_payouts` (**không** dùng `payout_transfers`: CHECK `kind` và `unique (event_id, kind)` của nó là của NTC theo sự kiện). `routes/commerce.ts` `CheckoutInput` (`commerce.ts:22`) thêm `ref` với đúng regex của `/events/:id/track` (`catalog.ts:517`: `^[2-9A-HJ-NP-Z]{6}$`), ghi `orders.ref_user` khi hợp lệ, bỏ qua im lặng khi không; đơn `total = 0` (promo 100%, `commerce.ts:163`) không sinh earnings; `orders.user_id` hôm nay `not null` nhưng phase 17 sắp có guest checkout: viết kiểm tra tự giới thiệu bằng `ref_user <> coalesce(user_id, '00000000-0000-0000-0000-000000000000')` để không gãy khi `user_id` thành null; khi đơn `paid` (cả webhook VietQR `commerce.ts:209` và nhánh mock/0 đồng) → earnings; hoàn tiền ở `routes/organizer/audience.ts:207` → `void`; `GET /me/commission`; `PATCH` sự kiện của NTC nhận `ambassadorPct`; tests.
- P1 (1 ngày): sheet chia sẻ đọc `ambassadorPct` từ `services/eventpage.ts`; `context.tsx` lưu `ff:ref:<eventId>` 30 ngày khi tới bằng `?ref=` (đã gọi `/events/:id/track`); checkout gửi `ref`; hàng "Tôi" + `/app/commission`; Studio editor; ledger: một `LedgerLine` âm `commission` trong hàng `post_event` của `payoutLedger` (`payouts.ts:49`), và `advance` (50% theo `PAYOUT_POLICY`) tính trên gross **trừ** hoa hồng, nếu không ứng trước có thể vượt số còn lại; cột attendees; e2e.
- P2 (½ ngày): job `settleAmbassadors` (mỗi giờ, `jobs.ts`): `payable` sau sự kiện, gom `ambassador_payouts` theo kỳ của payout NTC, ngưỡng 50.000 VND; tiền trả cho đại sứ là **chuyển khoản tay của team** như payouts của partner (FeestFinder không có API chi tiền), tab Console đánh dấu đã trả; `/me` (`routes/me.ts:36-52`) thêm `counts.commission` để hàng "Tôi" có aside; `CLAUDE.md` dưới "Ticket buttons": `?ref=` nhớ 30 ngày và đi cùng đơn; đơn đã trả sinh `events.ambassador_pct` cho người chia sẻ, trả qua `ambassador_payouts` và `/me/payee`, không bao giờ tính cho người mua; roadmap.

**Xong khi.** Cổng xanh; trên **web preview của branch** (web project build mọi branch, API preview dùng staging): NTC thử bật 10%, một đơn thử qua link có `ref` sinh earnings đúng số, hàng "Hoa hồng" hiện trong "Tôi"; chủ sản phẩm xác nhận kế toán (D3) trước khi NTC thật đầu tiên bật trên production.

### Thẻ 6 · Dữ liệu cho agent

**Một câu.** Một agent (ChatGPT, Claude, Gemini, hay một script) hỏi "techno Sài Gòn thứ bảy dưới 300k" và nhận dữ liệu FeestFinder qua MCP hoặc một trang Markdown, chỉ đọc, không cần tài khoản.

**Người dùng thấy.** Không gì trên site. `/llms.txt` thêm mục `## Agents` nêu `/list.md` (3 ví dụ URL) và `/mcp`. `robots.txt` thêm một dòng chú thích. `GET /list.md?city=&time=&style=&type=&priceMax=&q=&lang=` trả Markdown cùng truy vấn với `/events`: mỗi sự kiện ngày giờ theo thành phố, venue, giá bằng `formatMoney`, style, "Đã đăng" hay "Radar", link `/e/<slug>` và `/e/<slug>.md`; tối đa 50, dòng "Tiếp" với cursor. `POST /mcp` (Streamable HTTP, stateless, `@modelcontextprotocol/sdk`): tool `search_events`, `get_event`, `search_artists`, `get_artist`, `list_places`, `list_styles`; resource `feestfinder://llms.txt`; không prompt.

**Không làm.** Không xác thực (D6). Không session, không cookie đọc. Không mua vé. Không trường riêng tư. Không SQL mới: gọi service của `/events` và `pageMarkdown`.

**10 điểm.**
- Cổng: `test/agent.test.ts` (mới): `initialize` → `tools/list` 6 tool; `search_events` chỉ live, không `held_for_reports`, không draft, `priceMax` theo đơn vị của thành phố; `get_event` slug lạ → lỗi JSON-RPC, không 500; 61 request/phút → 429; body có NUL → `invalid_input`; `/list.md?city=ho-chi-minh&time=weekend` đúng số mục seed; `test/seo.test.ts` llms.txt có mục Agents; `webproxy.test.ts` `/mcp` và `/list.md` đi qua proxy như path không phải trang (kiểm `next.config.ts`: redirect `source: '/list'` không bắt `/list.md`).
- 5 người → **5 agent**: chủ sản phẩm nối Claude Desktop, Claude.ai connector, ChatGPT (connector hoặc fetch `/list.md`), Gemini, Cursor; mỗi cái hỏi "techno Sài Gòn cuối tuần này dưới 300k" và "ai chơi ở WOMB tuần này": 5/5 trả lời bằng dữ liệu FeestFinder có link đúng.
- 2 tuần: ≥ 200 `agent_call` (analytics server, prop `tool`); 0 lỗi 5xx ở `/mcp` và `/list.md` (Sentry); ≥ 1 nguồn referral từ một AI trong PostHog.

**Ngân sách không tăng.** Không chạm giao diện.

**Dữ liệu xấu phải chạy.** Sự kiện `priceUnknown` → "Chưa rõ giá", không lọt `priceMax`; sự kiện thành phố chưa `launched` → có trong kết quả với tên thành phố; `q` 500 ký tự → cắt; `cursor` hỏng → lỗi 400 JSON-RPC; agent gửi 20 request song song → rate-limit, không 500.

**Xây.**
- P0 (1 ngày): `routes/agent.ts` (`/list.md`, `/mcp`, rate-limit riêng, analytics `agent_call` với prop `tool` — thêm vào `SERVER_EVENTS` và `ALLOWED_PROPS`); phụ thuộc `@modelcontextprotocol/sdk` (kiểm chạy trên Node 24 với type stripping). Fastify đã parse JSON thành object (`app.ts:239`): gọi `transport.handleRequest(req.raw, reply.raw, req.body)` và `reply.hijack()` để SDK tự viết response (JSON hoặc SSE); không để Fastify serialize lần hai. Proxy web đã coi mọi path `.md` và `/mcp` là của API (`proxy.ts:40`), không cần sửa proxy. Tests.
- P1 (½ ngày): `llmsTxt`, `robotsTxt`; `CLAUDE.md` thêm `routes/agent.ts` vào bảng và quy tắc "`/mcp` và `/list.md` chỉ đọc, không session, rate-limit; agent không bao giờ nhận dữ liệu người xem và không mua"; `docs/CURRENT_ARCHITECTURE.md` mục Discovery API; roadmap.

**Xong khi.** Cổng xanh; chủ sản phẩm chạy bài 5 agent trên production và ghi 5 câu trả lời vào roadmap; `agent_call` xuất hiện trong PostHog.

### Thẻ 2 · Gửi sự kiện qua Zalo

**Một câu.** Ai follow Zalo OA của FeestFinder gửi ảnh poster hoặc link sự kiện, nhận lại các trường đã đọc và một link "Xem và gửi" mở form cộng đồng đã điền; gửi xong vào hàng chờ duyệt như mọi tin.

**Tái dùng.** App Zalo của phase 17: `ZALO_OA_APP_ID`, `ZALO_OA_SECRET_KEY`, `ZALO_OA_REFRESH_TOKEN` (`config.ts:271`), `provider_tokens` + `DbTokenStore` (key `'zalo'`, `sms.ts:153,163`), và logic refresh của `ZaloZnsTransport` (`services/sms.ts:141-170`): **tách phần token thành `services/zalo-oauth.ts`, một bản duy nhất trong tiến trình, có advisory lock khi refresh**, dùng chung cho ZNS và OA bot. Đây là chỗ dễ hỏng nhất (mục 7): Zalo xoay refresh token mỗi lần refresh, hai nơi refresh riêng sẽ làm token của nơi kia vô hiệu và **đăng nhập bằng Zalo OTP ngừng chạy**. `ClaudePrefill` và `prefillFromJsonLd` (`services/prefill.ts`), `aiBudget` (`community.ts:170`), `POST /community/events`, `otp_challenges` purpose `connect` channel `zalo`. **Không** dùng `social_connections.provider = 'zalo'` cho id người dùng OA: hàng đó đang giữ số điện thoại đã chứng minh (`me.ts:525-526`) và `notify.ts:64-66` đọc `external_id` của nó làm địa chỉ ZNS (`phone:`); ghi id OA vào đó sẽ phá ZNS. Dùng provider mới `zalo_oa` (nới CHECK của `social_connections.provider` trong migration 051).

**Người dùng thấy.** Trong Zalo, tối đa ba tin, tiếng Việt theo locale (mặc định vi):
- Khi follow: `Gửi ảnh poster hoặc link sự kiện, FeestFinder đọc giúp bạn. · Send a poster or an event link and FeestFinder reads it for you.`
- Chưa nối tài khoản: `Nối với tài khoản FeestFinder để gửi sự kiện: {link} · Link your FeestFinder account to send events: {link}`
- Bản nháp: bốn dòng `{title}` / `{date} · {venue}` / `{price}` / `Xem và gửi: {link} · Review and send: {link}`
- Không đọc được: `Chưa đọc được. Gửi lại ảnh rõ hơn hoặc dán link. · Could not read it. Send a clearer picture or paste a link.`
- Quá 10 bản nháp một ngày: `Hôm nay đủ 10 bản nháp rồi. Mai gửi tiếp. · That is 10 drafts today. More tomorrow.`
Trên site: `/zalo/link` (một nút `Nối Zalo · Link Zalo`, xong hiện `Đã nối · Linked` và nút về "Tôi"; chưa đăng nhập thì sheet đăng nhập trước); form cộng đồng đọc `?draft=` và điền; `/app/settings` mục Kết nối: hàng Zalo aside `Đã nối · Linked`. Console: `/console/sources` tab `Zalo` với 50 dòng gần nhất và trạng thái, chỉ admin.

**Không làm.** Không đăng từ Zalo. Không chatbot: văn bản không phải link nhận một câu cố định (câu chào). Không Mini App (D2). Không gửi thông báo marketing qua OA trong lát này (kênh `zalo` của notify giữ ZNS/webhook như hiện nay).

**10 điểm.**
- Cổng: `test/zalo.test.ts` (mới) với `fetch` giả: chữ ký sai → 401, không ghi; webhook gửi lại cùng `message id` → một dòng; `user_send_image` từ người chưa nối → dòng `received`, job trả link nối; nối bằng mã → `user_id` gắn vào dòng cũ; job với prefill giả → `drafted`, tin trả lời đúng 4 dòng; `POST /community/events` với `draft` → `submitted`, `event_id`, tin `in_review` dưới Cộng đồng FeestFinder; quá 10/ngày → tin giới hạn; token hết hạn → refresh một lần, ghi cả hai token vào `provider_tokens`; `test/sms.test.ts` vẫn xanh sau khi tách `zalo-oauth.ts`. E2E: `/zalo/link` vào `ROUTES` vai fan (layout, axe, 44 px); form cộng đồng với `?draft=` điền đúng (fixture).
- 5 người: 3 fan gửi một poster từ điện thoại của họ và hoàn tất gửi duyệt trong < 2 phút không gợi ý; 2 người của collective làm cùng việc với link sự kiện; mỗi người được hỏi "bạn nghĩ nó đã lên chưa?" và trả lời đúng là "chờ duyệt".
- 2 tuần: ≥ 100 `zalo_inbox` `drafted`; ≥ 40% thành `submitted`; ≥ 60% `submitted` được duyệt; OA ≥ 1.000 follower (team); 0 lỗi 5xx ở `/zalo/webhook`.

**Ngân sách không tăng.** Không chạm màn đầu. "Tôi" không thêm hàng (Kết nối nằm trong Cài đặt sẵn có).

**Dữ liệu xấu phải chạy.** Poster không có ngày → bản nháp thiếu ngày, form bắt điền; poster ngày đã qua → nháp vẫn tạo, form báo như hiện nay; link Facebook hay RA → đọc như form cộng đồng đang đọc (một người dán link là hành vi của người, không phải crawl; không lưu nội dung trang); ảnh > 5 MB → `failed`; ảnh không phải poster → `failed`; hai ảnh một tin → lấy ảnh đầu; Zalo gửi lại webhook → idempotent theo `message id`; người gửi 50 tin/giờ → ngoài 10 nháp, mọi tin còn lại không gọi Claude.

**Xây.**
- P0 (1 ngày): `services/zalo-oauth.ts` (tách từ `sms.ts`, một instance, advisory lock khi refresh; `ZaloZnsTransport` chuyển sang dùng nó; `test/sms.test.ts` phải còn xanh); migration `051_zalo_inbox.sql` (`zalo_inbox`: `id, zalo_user_id, zalo_message_id unique, user_id, kind text|image|link|follow|other, text, attachment_url, prefill jsonb, prefill_error, status received|read|drafted|submitted|ignored|failed, event_id, created_at, handled_at`; nới CHECK `social_connections.provider` thêm `'zalo_oa'`; **không** tạo bảng token: `provider_tokens` đã có); `routes/zalo.ts` `POST /zalo/webhook` (`req.rawBody` đã có nhờ parser ở `app.ts:239-241`, kiểm chữ ký như `commerce.ts:211`; `config: { rateLimit: false }` như `/robots.txt` để Zalo gửi dồn không bị 429; 200 ngay; ghi dòng; Zalo trỏ về `https://feestfinder.com/zalo/webhook` để đi qua proxy ký như pg_cron); job `zaloInbox` (`jobs.ts`, mỗi phút, tối đa 2 bản nháp mỗi lần chạy vì mỗi lần gọi Claude 5–15 s trong budget 55 s của pg_cron; ảnh tải bằng `fetchPublic` tối đa 5 MB và chỉ PNG/JPEG/WebP như `community.ts:165-167`, đưa vào `PrefillInput.image`) với trả lời qua `services/zalo-oa.ts` `sendText`; tests. Thiếu `ZALO_OA_*` hoặc `ANTHROPIC_API_KEY` (`DisabledPrefill`) → mọi route Zalo 404, job không chạy.
- P1 (1 ngày): `GET /zalo/link?code=` + `POST /me/connections/zalo-oa` dùng `otp_challenges` (`purpose = 'connect'`, `channel = 'zalo'`, `identifier = zalo_user_id`, 15 phút); trang `src/app/(kd)/zalo/link/page.tsx` **và thêm `/zalo/link` vào danh sách trang của `kd/cutover.ts`** (`proxy.ts:40` `isCutOver`), nếu không proxy chuyển `/zalo/link` sang API và trả 404; `GET /community/drafts/:id` (chủ sở hữu) và `draft` trong `POST /community/events`; form cộng đồng đọc `?draft=` (tìm form bằng `grep -rn "community/events" festfinder-web/src/kd`); hàng Kết nối trong Cài đặt; e2e.
- P2 (½ ngày): tab Console; `CLAUDE.md` mục "Zalo": webhook OA biến poster hay link thành bản nháp cộng đồng mà người đó gửi từ form; không gì đăng từ Zalo; token OA ở `provider_tokens` dùng chung với ZNS; `docs/CURRENT_ARCHITECTURE.md` bảng nguồn thêm "Zalo OA draft"; roadmap.

**Xong khi.** Cổng xanh; trên production chủ sản phẩm gửi một poster thật cho OA từ điện thoại và hoàn tất gửi duyệt; tin hiện trong hàng chờ Console với người gửi đúng; `zalo_inbox` đếm được trong tab Console.

---

## 5. Nhịp làm

1. **Thứ tự:** 4 → 5 → 1 → 3 → 6 → 2. Thẻ 4 và 5 nhỏ, đi trước để seed và cổng màn đầu có dữ liệu mới. Thẻ 1 và 3 độc lập, chạy song song được trên hai branch. Thẻ 2 cuối vì cần tài khoản Zalo OA (mục 6).
2. **Mỗi lát một PR** (`feat/<thẻ>-p<k>`), ≤ 1 ngày, theo skill `design-phase` của design-kit (chưa có trong `.claude/skills/` của repo này: W0 chép `skills/design-phase` và `skills/design-review` từ `/home/patrickstar/Desktop/design-kit/skills/` vào `.claude/skills/`): chép checklist của quyết định đã chọn vào mô tả PR; code, test và docs trong cùng commit; `npm run typecheck`, `npm run lint; echo $?` (không pipe), test khu vực, `npm run test:screens`; checklist "Thiết kế" trong PR đánh thật; `visual-diff` xem rồi mới `visual-ok`; merge khi chủ sản phẩm nói "merge".
3. **Migration** đổi số theo thứ tự merge thật (dự kiến 048 Ban ngày, 049 Lịch, 050 Hoa hồng, 051 Zalo); bump "The next one is" trong `CLAUDE.md`; mỗi file có comment vì sao và khối RLS như `044`.
4. **Seed xấu như production** (W0, nửa ngày, trước thẻ 4): một coffee rave 09:00–13:00; một kệ bật 3 sự kiện; một sự kiện có `ambassador_pct = 10` (ravo); một ICS fixture với bản ghi thiếu `LOCATION`, múi khác, `CANCELLED`; một poster fixture không ngày. `newcomer.spec.ts` chạy trên seed này.
5. **Sau mỗi merge:** chờ deploy bằng marker, chạy script phụ lục A trên production, ghi số vào roadmap (mục "Growth plan") cùng ngày. Số không được tăng so với bảng ở mục 1.
6. **Tài liệu:** mỗi thẻ ghi dòng của nó vào `CLAUDE.md` (đã nêu trong "Xây"); `docs/FEESTFINDER_ROADMAP.md` mục "Growth plan" tick từng lát; `TECH_DEBT.md` 17 đóng ở thẻ 5.
7. **Không làm trong kế hoạch này:** đổi điều hướng, đổi màn đầu, thêm tab, thêm chip trên điện thoại, thêm từ mới cho người mới. Gặp việc cần một trong số đó: dừng, ghi vào roadmap, hỏi chủ sản phẩm bằng 2–4 lựa chọn.

---

## 6. Việc của chủ sản phẩm, và những gì chờ điều kiện

**Chủ sản phẩm và team làm (agent không làm được):**
1. Chọn D1–D6 (mục 2), chép checklist vào roadmap kèm ngày.
2. Zalo OA: xác minh OA doanh nghiệp, bật webhook OA trỏ `https://feestfinder.com/zalo/webhook`, cấp quyền gửi tin tư vấn; app và token đã có từ phase 17 (`ZALO_OA_*` trên Vercel).
3. Kế toán xác nhận cách trả hoa hồng cho cá nhân (D3) trước khi NTC thật đầu tiên bật.
4. Danh sách 15–20 venue và collective mỗi thành phố lớn để mời dùng Lịch; 5 fan mỗi thành phố cho chương trình scout trên Zalo OA (không code).
5. Sau mỗi thẻ: bài 5 người theo `DESIGN_GOVERNANCE.md` với nhiệm vụ ghi trong thẻ; ghi kết quả vào roadmap.
6. Sau thẻ 6: nối 5 agent và ghi câu trả lời; đăng MCP vào thư mục công khai.

**Chờ điều kiện (không code trước khi điều kiện đúng, điều kiện là số đo):**

| Việc | Làm khi | Hình hài đã định |
| --- | --- | --- |
| Link du lịch "Đến <thành phố>" | ≥ 2 thành phố có ≥ 50 sự kiện sắp tới | Một hàng trong "Thêm" của trang sự kiện, chỉ khi thành phố sự kiện ≠ thành phố đã nhớ của người xem; `lib/travel.ts` theo mẫu `lib/rides.ts`; `/go/travel`; mã affiliate trong env |
| Zalo Mini App | OA ≥ 1.000 follower và có quyết định pháp lý về số điện thoại Zalo (Nghị định 147) | Package `festfinder-zalo/`, `POST /auth/zalo-mini`, CORS cho origin Mini App |
| Crew vote nhiều sự kiện | Bài 5 người có ≥ 2 người hỏi | Mở rộng `plans` (ứng viên + vote), không từ mới |
| Địa điểm công bố sau | NTC đầu tiên hỏi | `events.venue_hidden_until`; SEO chỉ thành phố; push lúc công bố |
| Track ID xác nhận | Moments ≥ 50 bài/tháng | `post_votes`; nghệ sĩ trong lineup xác nhận; link Beatport qua `/go/link` |
| Vé an toàn | FeestFinder bán ≥ 100 vé/tháng | Trang `/an-toan-ve`, nhãn trên khối vé, báo cáo lừa vé |
| Night Pass | Hợp đồng ≥ 4 venue một thành phố | `passes`, `pass_subscriptions`, `pass_checkins`; QR ký bằng `TICKET_SIGNING_SECRET`; chia theo check-in |
| Merch | ≥ 2 collective hỏi và D13 (tách `order_items`) | `products`, `order_items` |
| Insights cho brand | ≥ 3 yêu cầu quảng cáo hỏi số | Xuất CSV/PDF từ `/console/insights`, ngưỡng ≥ 50 người mỗi ô |
| Bàn cho người đi một mình | Bài 5 người có 2 người đi một mình xin | Quy tắc an toàn duyệt trước |

---

## 7. Đối chiếu codebase 2026-10-19: xung đột và chỗ dễ lỗi

Đọc trên `48b2cf3`. Mỗi dòng đã được chép vào phần "Xây" của thẻ tương ứng; bảng này để tech lead nhìn một lần. Mức: **chặn** (code sai nếu bỏ qua), **lệch** (chạy nhưng sai ý), nhỏ.

| Thẻ | Mức | Thấy gì trong code | Làm gì |
| --- | --- | --- | --- |
| 2 | **chặn** | `ZaloZnsTransport` và OA bot cùng app, cùng key `provider_tokens 'zalo'`; Zalo xoay refresh token mỗi lần refresh (`sms.ts:152-163`). Hai nơi refresh riêng → token của nơi kia hỏng → **OTP Zalo của phase 17 ngừng** | Một `services/zalo-oauth.ts` duy nhất, advisory lock, cả hai dùng chung; `test/sms.test.ts` là cổng |
| 2 | **chặn** | `social_connections (user_id, provider)` là khoá chính; hàng `provider = 'zalo'` đang giữ **số điện thoại** đã chứng minh (`me.ts:525`), và `notify.ts:64-66` dùng `external_id` ấy làm `phone` cho ZNS | Không ghi id OA vào `'zalo'`; provider mới `'zalo_oa'`, nới CHECK trong 051 |
| 2 | **chặn** | `proxy.ts:40`: path không `.md`, không trong `OWN`, không trong `isCutOver` → chuyển sang API | Thêm `/zalo/link` vào `kd/cutover.ts` |
| 2 | lệch | Webhook của Zalo qua `@fastify/rate-limit` theo IP → gửi dồn bị 429 | `config: { rateLimit: false }` cho `/zalo/webhook`, chữ ký là hàng rào |
| 2 | nhỏ | Job chạy trong lượt pg_cron 55 s; một gọi Claude 5–15 s | Tối đa 2 nháp mỗi lượt; hàng còn lại chờ phút sau |
| 1 | **chặn** | `resolveAndApply` (`run.ts:211-216`) gộp mọi match ≥ `mergeAt` vào sự kiện của **bất kỳ** NTC; `createCandidate` chỉ nhận `holder: Placeholder` | Nhánh `organizer_id`: không gộp sang NTC khác, tạo candidate dưới NTC của nguồn; `createCandidate` nhận `organizerId` |
| 1 | lệch | `enrich` (`run.ts:283-294`) chỉ điền chỗ trống, và ảnh/lineup/pin chỉ cho `is_community`; **không có đường nào đổi giờ, tên, giá của sự kiện live**; logic `needs_review_*` nằm trong route (`organizer/events.ts:336`) | P0 chỉ tạo và điền; P2 tách `proposeRevision` vào `services/listing.ts` cho route và pipeline dùng chung |
| 1 | nhỏ | `POST /organizer/calendar` fetch đồng bộ theo URL người dùng đưa | `fetchPublic` đã chặn địa chỉ nội bộ; thêm rate-limit 5/phút; `interval_minutes ≥ 30` (CHECK) nên 360 hợp lệ |
| 1 | nhỏ | ICS writer đã có ở `routes/event-actions.ts:116-130` | Tái dùng cho `/embed/.../events.ics`, không viết lại |
| 1 | nhỏ | Budget `runDueSources` 35 s chung cho mọi nguồn; 40 lịch NTC sẽ chen Radar | Chấp nhận trong v1; nếu Radar chậm, tăng `interval_minutes` của lịch lên 720 |
| 5 | **lệch** | Ô nổi bật chỉ vẽ khi bộ lọc ở mặc định (`browser.tsx:416`); phase 13 nhớ thành phố đã chọn → người Việt quay lại không thấy kệ | D5b (mục 2), mặc định A |
| 5 | lệch | `featured` chỉ do admin đặt tay (`admin/ops.ts:335`); boost duyệt lên kệ không chạm cột; `/shelves` không có nhãn trả tiền | Suy `featured` trong `presentCard` từ kệ bật; `/shelves` trả `sponsored` |
| 5 | lệch | `/` cache 60 s; `kd-fresh` chỉ biết `e, a, o, p` (`fresh-paths.ts:2`) | Kind `s` làm mới `/`; Console gọi `freshen` khi đổi kệ |
| 4 | **chặn** | `inferEventType` (`styles.ts:150-153`) khớp từ khoá `rave`, `party` trước giờ: "coffee rave" → `rave`, "day party" → `party` | Luật `day` đứng ngay sau festival, trước mọi từ khoá khác |
| 4 | lệch | Nhãn menu `Kiểu đêm` (`list/copy.ts:22`) + giá trị "Ban ngày" tự mâu thuẫn | Đổi nhãn thành `Loại · Kind`; `visual-ok` cho thanh lọc |
| 4 | nhỏ | `fit.ts:82-85` không có điểm cho `day` → Radar find ban ngày dễ rơi dưới `FIT_FLOOR` | Cho `day` điểm như `party` |
| 3 | lệch | `orders.user_id not null` hôm nay, guest checkout của phase 17 sẽ nới | Kiểm tự giới thiệu với `coalesce(user_id, …)`; không giả định có `user_id` |
| 3 | lệch | `payoutLedger` có `advance` 50% gross (`payouts.ts:7-12,49`) | Hoa hồng là `LedgerLine` âm trong `post_event`; `advance` tính trên gross trừ hoa hồng |
| 3 | lệch | Dòng "Hoa hồng {p}%" cho người chưa đăng nhập, mà link của họ không có `ref` | Chỉ hiện khi đã đăng nhập |
| 3 | nhỏ | `/events/:id/track` đã có regex `ref` (`catalog.ts:517`); `/me` trả `counts` (`me.ts:36-52`) | Dùng cùng regex ở checkout; thêm `counts.commission` |
| 3 | nhỏ | Tiền ra cho đại sứ: FeestFinder không có API chi tiền, partner payouts đang đánh dấu tay | `ambassador_payouts` đánh dấu tay như partner; D3 A vẫn đúng |
| 6 | lệch | Fastify parse body thành object (`app.ts:239`); SDK MCP muốn tự viết response | `handleRequest(req.raw, reply.raw, req.body)` + `reply.hijack()` |
| 6 | nhỏ | Proxy đã coi `.md` và `/mcp` là của API | Không sửa proxy |

**Khái niệm và flow cho khách, sau đối chiếu.** Sáu thẻ không thêm từ nào vào màn đầu, không thêm tab, chip hay sheet. Hai sửa chữ để không rối: "Kiểu đêm" thành "Loại" (thẻ 4), và dòng hoa hồng chỉ cho người đã đăng nhập (thẻ 3). Hai chỗ đã có hai nơi nói cùng một việc, **không thêm nơi thứ ba**: lượt mở từ link chia sẻ đã hiện ở passport ("Lan toả") và ở mục Đại sứ; hoa hồng thêm vào hàng "Tôi" là nơi tiền, không lặp số lượt mở ở đó. Thiếu logic đã bổ: kệ không tới người đã chọn thành phố (D5b); sự kiện live không có đường cập nhật từ lịch (P2 thẻ 1); guest checkout sắp tới với `ref` (thẻ 3); OA và ZNS giành token (thẻ 2).

## Phụ lục A · Đo màn đầu trên production (chạy sau mỗi merge)

Đặt ở scratchpad hoặc `festfinder-backend/scripts/measure-first-screen.mjs` nếu team muốn giữ. Dùng Playwright của `festfinder-backend`. Thước chuẩn trong repo là `controlsInSight` của `newcomer.spec.ts`; script này đo nhanh trên production với cùng ý: chỗ bấm nhìn thấy trong `innerHeight`, trừ `aria-hidden`, cộng số màn, vị trí sự kiện đầu tiên, tag mỗi thẻ, lỗi JS.

```js
import { createRequire } from 'node:module';
const { chromium, devices } = createRequire('/home/patrickstar/Desktop/FeestFinder/festfinder-backend/package.json')('playwright');
const BASE = 'https://feestfinder.com';
const count = () => {
  const vh = innerHeight, sel = 'a,button,input,select,textarea,summary,[role=button],[role=tab],[role=menuitem],[role=switch]';
  const vis = [...document.querySelectorAll(sel)].filter((e) => {
    if (e.closest('[aria-hidden="true"]')) return false;
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    return r.width >= 1 && r.height >= 1 && cs.visibility !== 'hidden' && r.top < vh && r.bottom > 0;
  });
  const first = document.querySelector('a[href^="/e/"]');
  return { controls: vis.length, screens: +(document.documentElement.scrollHeight / vh).toFixed(1),
    firstEventY: first ? Math.round(first.getBoundingClientRect().top) : null,
    tagsPerCard: [...document.querySelectorAll('a[href^="/e/"]')].slice(0, 12).map((c) => (c.closest('article,li,div') || c).querySelectorAll('.kd-tag').length),
    labels: vis.map((e) => (e.getAttribute('aria-label') || e.innerText || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 36)) };
};
const browser = await chromium.launch(); const out = {};
for (const [name, opts] of [['phone', { ...devices['iPhone 13'], locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' }], ['desktop', { viewport: { width: 1440, height: 900 }, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' }]]) {
  const page = await (await browser.newContext(opts)).newPage(); const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
  await page.goto(BASE + '/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  out[name] = { home: await page.evaluate(count) };
  const slug = await page.evaluate(() => document.querySelector('a[href^="/e/"]')?.getAttribute('href'));
  if (slug) { await page.goto(BASE + slug, { waitUntil: 'networkidle' }); await page.waitForTimeout(1500); out[name].event = { slug, ...(await page.evaluate(count)) }; }
  out[name].errors = errors;
}
await browser.close(); console.log(JSON.stringify(out, null, 1));
```

Kết quả 2026-10-19 ở mục 1. Ghi cột mới vào roadmap mỗi lần chạy.

## Phụ lục B · Nguồn chính của brainstorm (tra 2026-10-19)

IMS Business Report 2026 (DJ Mag, Beatportal, Billboard) · Eventbrite Social Study 2026 · Global Wellness Institute 2026 về soft clubbing · RMIT Vietnam Music Landscape 2025–2026 · VietnamNet về lừa vé · Loopliner về scene Sài Gòn · Huck về Hà Nội · VietnamPlus, SGGP, Vietcetera về kinh tế đêm · Posh Series B (Yahoo Finance) · Partiful ticketing · Shotgun Pro · NL Times về Nachtpas Amsterdam · RTS.FM và Clubcommission Berlin về nightlife giảm · NewKerala, LBB về du lịch vì nhạc · TheSmartLocal về Tomorrowland Thái Lan · Prodima, Vihat về Zalo · ContentGrip, Asia Circles về social commerce · Ticket Fairy, Posh University về đại sứ bán vé · commercetools, Softjourn, Security Boulevard về agentic commerce · MCP TypeScript SDK. Đường link:

- https://djmag.com/news/global-electronic-music-industry-value-hits-record-151-billion-ims-business-report-reveals · https://www.beatportal.com/articles/1386171-ims-business-report-2026-global-dance-music-industry-now-worth-15.1-billion · https://www.billboard.com/lists/ims-ibiza-2026-ims-business-report-key-takeaways-streaming/
- https://www.eventbrite.co.uk/blog/press/newsroom/eventbrites-inaugural-social-study-report-reveals-the-reset-to-real-how-gen-z-and-millennials-are-redefining-live-experiences-in-2026/ · https://www.yahoo.com/lifestyle/articles/soft-clubbings-rise-explained-why-194910948.html · https://www.yahoo.com/lifestyle/articles/global-wellness-institutes-2026-report-214900046.html
- https://vietnamnews.vn/life-style/1763298/vietnamese-music-enters-a-new-era-of-identity-and-global-reach.html · https://vietnamnet.vn/en/fans-scammed-as-black-market-concert-ticket-fraud-spikes-in-vietnam-2407245.html · https://loopliner.com/news/ho-chi-minh-citys-longest-running-techno-club-is-closing-in-october · https://www.huckmag.com/article/hanoi-nightlife-clubs-raids-police-unmute-outlandish · https://edm.com/events/a-state-of-trance-festival-expanding-vietnam-southeast-asia/
- https://en.vietnamplus.vn/ho-chi-minh-city-eyes-vibrant-night-time-economy-through-cultural-industries-post347999.vnp · https://en.sggp.org.vn/night-economy-set-to-become-a-key-growth-driver-for-ho-chi-minh-city-post124912.html · https://vietcetera.com/en/beyond-bars-and-clubs-hanoi-explores-a-controlled-night-economy
- https://finance.yahoo.com/markets/stocks/articles/exclusive-posh-lands-37m-series-112556989.html · https://www.simpletix.com/partiful-launches-ticketing/ · https://pro.shotgun.live/en-eu/solution/collective · https://hi.events/fees/resident-advisor
- https://nltimes.nl/2026/04/15/amsterdam-nightclubs-launch-eu2450-monthly-pass-boost-falling-attendance · https://rts.fm/blog/why-people-go-out-less-nightlife-data-2026 · https://www.technoairlines.com/blog/berlin-clubs-closing-2026-clubcommission-study
- https://www.newkerala.com/news/a/concerts-drive-travel-choices-62-indias-gen-plans-169.htm · https://lbbonline.com/news/Concert-Cations-Across-Southeast-Asia · https://thesmartlocal.com/read/music-festivals-asia/
- https://prodima.vn/en/what-is-zalo/ · https://vihatsolutions.com/tin-cong-nghe/zalo-mini-app-la-gi/ · https://www.contentgrip.com/tiktok-shop-strategy-southeast-asia/ · https://asiacircles.co/insights/social-commerce-vietnam
- https://www.ticketfairy.com/blog/turning-fans-into-ambassadors-how-referral-programs-can-drive-ticket-sales-in-2026 · https://posh.vip/university/post/ambassador-programs-that-actually-work-turn-fans-into-promoters
- https://commercetools.com/blog/agentic-commerce-protocol-acp-deep-dive-guide · https://softjourn.com/insights/agentic-commerce-in-ticketing · https://securityboulevard.com/2026/04/agentic-commerce-in-ticketing-opportunities-threats-how-to-stay-ahead/ · https://github.com/modelcontextprotocol/typescript-sdk
