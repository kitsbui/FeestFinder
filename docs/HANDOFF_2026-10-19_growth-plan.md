# Kế hoạch tăng trưởng · handoff 2026-10-19 (bản 3, rà lại 2026-10-20)

| | |
| --- | --- |
| Nền code | `main` ở `48b2cf3` (design v2 phase 0–14, 17). Rà toàn bộ dự án ngày 2026-10-20 theo ba điều chỉnh của chủ sản phẩm (mục 8 là bảng kiểm kê). |
| Ba điều chỉnh (chủ sản phẩm, 2026-10-20) | **(1)** Không xác minh số điện thoại: đăng nhập Gmail là đủ để bình luận và dùng gần hết web; admin xoá được bình luận không phù hợp. **(2)** Bình luận và trả lời nhau như Facebook. **(3)** FeestFinder **không bán vé**, không cần hệ bán vé hay check-in: gỡ hết; thay bằng cơ chế giới thiệu link affiliate thông minh, hiện đại nhất. |
| Luật trên hết | `CLAUDE.md`, rồi `docs/DESIGN_GOVERNANCE.md`, rồi design-kit (`/home/patrickstar/Desktop/design-kit`): đo trước, ngân sách chỉ giảm, một màn một việc, ba khái niệm trước, gấp chứ không bỏ, dữ liệu thử xấu như production, quyết định của chủ sản phẩm là lựa chọn có hệ quả chép nguyên văn. |
| Trạng thái | **Final cho hai đêm night build**: `docs/NIGHT_BUILD_PLAN_2026-10-19.md` là lịch chạy; file này là thiết kế. Zalo OA để sau (2026-10-19). D1, D4, D5, D6 = A (2026-10-19); D3 cũ hết hiệu lực vì không còn bán vé, thay bằng D8; D7–D12 mới ở mục 2, mỗi cái có mặc định. |
| Cách đọc | Mục 1 trong ba phút. Mỗi việc là một thẻ cùng khuôn ở mục 4. Thẻ chỉ "xong" khi cột **Xong khi** có số thật. |

---

## 1. Ba phút

**Kết luận.** Ba điều chỉnh làm sản phẩm **gọn hơn**, không rối hơn: bỏ nguyên một mảng (vé, pass vé, check-in, doanh thu, khuyến mãi, hoàn tiền, payout) là bỏ 11 bảng, hơn 3.500 dòng code và năm khái niệm người dùng từng gặp ("Vé của tôi", "Pass vé", "Check-in", "Doanh thu", "Khuyến mãi"); rail Studio từ 7 mục xuống 5; trang sự kiện mất khối "Pass vé 0". Tiền đi về **một đường duy nhất**: mỗi nút "Mua vé" là một link affiliate theo dõi được, FeestFinder ăn hoa hồng của bên bán vé và chia cho người đã giới thiệu. Cổng đăng nhập hạ xuống Gmail làm bình luận thành việc thật. Năm thẻ của bản 2 vẫn đứng (Ban ngày, Kệ, Lịch, Agent) trừ thẻ 3, viết lại thành thẻ D.

| # | Việc | Cho ai | Người mới thấy gì thay đổi | Số đo 10 điểm sau 2 tuần | Công |
| --- | --- | --- | --- | --- | --- |
| C | **Gỡ bán vé và check-in**: không checkout, đơn, vé, QR, quét cửa, pass vé, chuyển vé, khuyến mãi, payout; mọi "Mua vé" đi `/go` tới bên bán | Mọi người; nhà tổ chức | Trang sự kiện: một nút "Mua vé · từ {giá}" tới trang bán; không khối vé, không "Pass vé 0". "Tôi" không còn hàng "Vé". Studio không còn Check-in, Doanh thu, Khuyến mãi | 0 route cũ còn trả 200 · 0 khái niệm vé trên 3 màn đầu · test và lint xanh với ngân sách thấp hơn | 2 ngày |
| A | **Gmail là đủ**: bỏ mọi cổng xác minh số điện thoại; admin xoá bình luận | Mọi người đăng nhập | Bấm bình luận, gửi sự kiện, dự án, mix: không còn sheet "Xác thực số điện thoại" | ≥ 60% người đăng nhập mới bình luận hoặc lưu trong 7 ngày · 0 lần hiện sheet số điện thoại | ½ ngày |
| B | **Bình luận như Facebook**: một dòng bình luận mỗi sự kiện, trả lời bất kỳ bình luận nào (hiện phẳng dưới bài gốc với @tên), thích, sửa trong 15 phút, xoá của mình, admin xoá, báo cáo, báo cho người được trả lời | Fan, nhà tổ chức | Mục "Bình luận (n)" trong "Thêm" thay ba tab Hỏi đáp · Trò chuyện · Kỷ niệm; một ô viết, một nút | ≥ 20% người xem sự kiện đã đăng nhập bình luận hoặc trả lời · thời gian admin xoá bình luận bị báo ≤ 24 giờ | 1,5 ngày |
| D | **Affiliate thông minh**: `/go` chọn bên bán theo nước người xem, gắn click id và UTM, nhớ ai giới thiệu 30 ngày; postback của bên bán ghi chuyển đổi; hoa hồng chia cho người giới thiệu; dashboard cho NTC, fan và team; agent cũng đi `/go` | Fan chia sẻ, NTC, team, agent | Nút "Mua vé" như cũ. Đã đăng nhập: sheet chia sẻ có "Hoa hồng {p}%"; "Tôi" có hàng "Hoa hồng" khi > 0 | ≥ 2 partner postback thật · ≥ 5% click Mua vé mang `ref` · ≥ 1 chuyển đổi được ghi và chia · 0 đơn tự giới thiệu | 3 ngày |
| 4 | **Ban ngày** (như bản 2) | Mọi người | Một giá trị trong menu "Loại" | ≥ 10 sự kiện `day` · ≤ 1/20 gán nhầm | 1 ngày |
| 5 | **Nổi bật trả tiền trong ô có sẵn** (như bản 2) | NTC mua chỗ, brand | Cùng ô, có nhãn "Được tài trợ" | ≥ 1 chỗ bán · card_open ≥ 3% | 1 ngày |
| 6 | **Dữ liệu cho agent** (như bản 2, mọi link vé trong kết quả là `/go`) | Agent | Không gì | 5/5 agent đúng · ≥ 200 gọi | 1,5 ngày |
| 1 | **Lịch của nhà tổ chức** (như bản 2) | Venue, collective | Không gì (Studio) | 20 lịch nhúng · 10 lịch kết nối · 100 sự kiện | 2,5 ngày |

Thứ tự: **đêm 1: C → A → B** (gỡ trước để mọi thứ sau không phải né mảng vé); **đêm 2: D → 4 → 5 → 6 → 1**. Tổng ≈ 13 ngày công, hai night build. Thẻ 2 (Zalo OA) để sau.

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

## 2. Chủ sản phẩm quyết

Đã chốt (2026-10-19): D1, D4, D5, D6 = A; D5b, D3c mặc định A. **D3 (hoa hồng trả qua payout của FeestFinder) hết hiệu lực** vì FeestFinder không còn thu tiền vé; thay bằng D8. Câu mới của bản 3, mỗi câu có mặc định để chạy đêm luôn; chủ sản phẩm đổi được sáng sau.

| # | Câu hỏi | Lựa chọn và hệ quả |
| --- | --- | --- |
| D7 | 11 bảng của mảng vé (`ticket_tiers`, `promo_codes`, `orders`, `tickets`, `scans`, `guest_list`, `payout_transfers`, `ticket_listings`, `resale_orders`, `ticket_transfers`, `resale_watchers`, cộng `tier_watchers`) xoá hay để lại? | **A (khuyến nghị): xoá bằng migration `048_drop_ticketing.sql`, có khoá an toàn: migration dừng (`raise exception`) nếu production có bất kỳ đơn `paid` nào.** Hệ quả: schema sạch, test và lint gọn; không quay lại được bằng revert code, chỉ bằng backup. *Checklist: "048 drop 12 bảng sau khi kiểm không có đơn paid; events bỏ cột `featured`? không: giữ; bỏ `ticket_link_status`? giữ (link vé vẫn được kiểm)."* · B: giữ bảng, chỉ gỡ route và màn. Hệ quả: 1.300 cảnh báo lint của `any` không giảm, bảng chết trong schema. |
| D8 | Hoa hồng cho người giới thiệu lấy từ đâu, bao nhiêu? | **A (khuyến nghị): từ hoa hồng FeestFinder nhận của bên bán vé (partner postback), chia **50%** cho người giới thiệu; team chuyển khoản tay theo kỳ qua `/me/payee`; sự kiện của bên bán chưa có deal thì chỉ đếm lượt mở và click.** *Checklist: "partner_conversions.ref_user; ambassador_earnings = round(commission × share); share trong `lib/affiliate.ts` SHARE_PCT = 50; payable khi conversion approved; paid theo kỳ ambassador_payouts; không tiền từ NTC."* · B: 30%. · C: không chia tiền, chỉ bảng xếp hạng. Hệ quả: ít động lực chia sẻ. |
| D9 | Bình luận: một dòng duy nhất hay giữ ba tab Hỏi đáp · Trò chuyện · Kỷ niệm (+ Track ID, Crew ẩn)? | **A (khuyến nghị): một dòng "Bình luận"**; bài cũ của mọi kind hiện trong cùng dòng (cũ nhất dưới); câu hỏi có câu trả lời của NTC vẫn hiện như bình luận có trả lời "Nhà tổ chức"; ảnh đính kèm vẫn được; Track ID để sau. Hệ quả: ba tab bớt, một ô viết. *Checklist: "GET discussion không còn tabs; POST posts kind mặc định talk; replies hai cấp hiện phẳng dưới bài gốc với @tên; thích thay helpful; sửa 15 phút; xoá của mình; admin xoá bất kỳ; báo cáo giữ."* · B: giữ tab. Hệ quả: ba khái niệm trên trang sự kiện. |
| D10 | Bỏ xác minh số điện thoại ở đâu? | **A (khuyến nghị): mọi nơi `requireWriter` đang đứng** (bình luận, gửi sự kiện cộng đồng và prefill, dự án, mix). Đăng nhập bằng Google, email, SMS, Zalo, WhatsApp đều đủ; số điện thoại chỉ là cách đăng nhập tuỳ chọn. **Rủi ro pháp lý**: Nghị định 147/2024 yêu cầu mạng xã hội xác thực tài khoản bằng số điện thoại Việt Nam (hoặc định danh) trước khi đăng; `http/guards.ts:18` ghi lý do đó. Chủ sản phẩm nhận rủi ro này hoặc giữ cổng cho **đăng tin**, bỏ cho **bình luận**. · B: bỏ cho bình luận và mix, giữ cho gửi sự kiện và dự án. Hệ quả: gần với Nghị định hơn; người gửi tin vẫn gặp sheet số điện thoại một lần. |
| D11 | "Đi cùng bạn bè" có yêu cầu tiền giữa bạn bè qua VietQR (`/plans/:id/payment-requests`, `lib/vietqr.ts`, `/me/payee`). Giữ không? | **A (khuyến nghị): giữ** (tiền giữa bạn bè, FeestFinder không cầm; `payee` còn cần cho hoa hồng D8). · B: gỡ cùng mảng vé. Hệ quả: `vietqr.ts` và payee của plans đi; `payee` chỉ còn cho hoa hồng. |
| D12 | Một sự kiện có nhiều bên bán vé (Megatix cho SG, Ticketbox cho VN…)? | **A (khuyến nghị): có, bảng `event_ticket_links` (url, host, nước, tiền tệ, giá từ, chính)**; `/go` chọn theo nước của người xem (header CDN), không thì link chính. Studio: "Link vé" thành danh sách. · B: một link như hôm nay. Hệ quả: fan Việt vào Megatix SG trả bằng SGD. |

Đã chốt sẵn, không hỏi lại: Feest Scout không cần code; thẻ 2 Zalo OA, link du lịch, Mini App, Crew, Night Pass, merch để sau (mục 6). Sign-in: Google đứng đầu sheet như `CLAUDE.md` nói; phase 17 xếp cách bằng số điện thoại trước ở `kd/sign-in.tsx:135` cho người Việt: giữ thứ tự ấy, chỉ bỏ **bắt buộc**.

---

## 3. Tự đánh giá, cập nhật 2026-10-20

Ba điều chỉnh soi lại bản 2:

| Chỗ của bản 2 | Điều chỉnh | Hệ quả |
| --- | --- | --- |
| Thẻ 3 "Hoa hồng cho đại sứ" tính trên đơn FeestFinder bán | Không bán vé | Viết lại thành thẻ D: hoa hồng từ postback của bên bán, chia cho người giới thiệu (D8). Bỏ `events.ambassador_pct`, bỏ dòng ledger, bỏ ô % trong editor. |
| Mọi chỗ nói "FeestFinder không thu phí người mua" | Không còn người mua | Câu đó thành "FeestFinder không bán vé; nút Mua vé đưa bạn tới bên bán" ở `/about`, FAQ, trang sự kiện. |
| Cổng `requireWriter` ở form cộng đồng, dự án, mix, bình luận | Gmail là đủ | Thẻ A. Một sheet (`kd/phone.tsx`) chỉ còn cho người **muốn** thêm số. |
| Ba tab thảo luận + Hype trong "Thêm" | Bình luận như Facebook | Thẻ B: một mục "Bình luận (n)"; Hype giữ nguyên (quyết định cũ của chủ sản phẩm). |
| Thẻ 1, widget hiện giá từ tier | Không tier | Giá từ `events.price_from` và tiền tệ, hay "Giá ở trang bán vé". |
| Thẻ 6, MCP trả link | Affiliate | Mọi link vé trong `/list.md` và tool là `/go/<slug>?src=agent`, để chuyển đổi từ agent cũng được ghi. |
| Huy hiệu `doors` (quét vé), `sold_out`, `sold_out_5` | Không check-in, không bán | Gỡ khỏi `BADGE_CATALOGUE`; huy hiệu đã trao thì migration xoá dòng của chúng. |
| Thẻ 5, kệ và `featured` | Không đổi | Giữ. |
| Thẻ 4 | Không đổi | Giữ. |

**Khái niệm cho khách sau bản 3:** trang sự kiện bớt "Pass vé", "Vé" (khối), ba tab thảo luận thành một; "Tôi" bớt "Vé"; Studio bớt Check-in, Doanh thu, Khuyến mãi, Khách; thêm duy nhất "Hoa hồng" (chỉ khi có tiền) và "Bình luận" (thay ba từ). Số khái niệm người mới gặp ở trang sự kiện: ≈ 7 → ≈ 5, đúng mục tiêu của kit.

---

## 4. Thẻ việc

Khuôn mỗi thẻ: **Một câu** · **Người dùng thấy** (chữ vi · en, chép nguyên văn) · **Không làm** · **10 điểm** (cổng, 5 người, số sau 2 tuần) · **Ngân sách không tăng** · **Dữ liệu xấu phải chạy** · **Xây** (lát ≤ 1 ngày, một PR mỗi lát) · **Xong khi**.

### Thẻ C · Gỡ bán vé và check-in (đêm 1, trước mọi thẻ khác)

**Một câu.** FeestFinder không bán vé: mọi nút "Mua vé" đi `/go` tới bên bán; checkout, đơn, vé QR, quét cửa, pass vé, chuyển vé, khuyến mãi, hoàn tiền, payout và khách mời biến mất khỏi API, màn hình, job, test và schema.

**Người dùng thấy.** Trang sự kiện: khối vé thành một hàng `Mua vé · từ {giá} · Buy tickets · from {price}` (hay `Chưa rõ giá`, `Miễn phí`) với dòng `Giá ở trang bán vé · Price on the ticket page` khi có link; dock điện thoại giữ "Mua vé" (đi `/go`). Không "Pass vé", không "Đổi vé", không "Theo dõi vé mở bán". "Tôi": bỏ hàng `Vé của tôi`. Studio rail: `Hôm nay · Sự kiện · Quảng bá (Thông báo, Quảng cáo) · Hộp thư · Gig`; bỏ `Khách và cửa` (Khách, Check-in), `Doanh thu`, `Khuyến mãi`. Wizard bước 3 thành `Vé · Tickets`: link bán vé (một hay nhiều, D12), giá từ, tiền tệ, miễn phí; không hạng vé. Console: bỏ `Đơn hàng`; `Số liệu` bỏ cột bán được. `/about` và FAQ: `FeestFinder không bán vé. Nút Mua vé đưa bạn tới trang bán. · FeestFinder sells no tickets. Buy tickets takes you to the seller.`

**Không làm.** Không đụng `plans` payment requests (D11 A). Không gỡ `outbound_clicks`, `ticket_partners`, `partner_conversions`, `affiliate_*` (nền của thẻ D). Không gỡ `events.entry_mode`, `price_from`, `currency`, `ticket_url`, `ticket_link_status` (link vé vẫn được kiểm bởi job `checkTicketLinks`). Không gỡ Moments, live mode (`/app/live`: presence, waves; không cần vé), recap, badges khác.

**10 điểm.**
- Cổng: `npm run typecheck` sạch sau khi xoá; `npm test` xanh với `test/attendee.test.ts`, `test/resale.test.ts` đã xoá và các bài khác sửa; `test/public.test.ts`: `/go/<slug>` luôn tới bên bán hay trang gốc, không bao giờ `/app/checkout`; `GET /app/checkout/*`, `/app/tickets`, `/studio/door`, `/studio/revenue`, `/studio/promos`, `/studio/attendees`, `/console/orders` → 404 (trang) và API cũ → 404; `routes.ts`, `perf.spec.ts`, `nav.spec.ts`, `backoffice.spec.ts` bỏ các route ấy; `event.spec.ts`: hàng Mua vé đi `/go`; `newcomer.spec.ts`: `IN_SIGHT.event` **giảm** (khối vé bớt nút) và ghi số mới; `layout`, `wcag`, `targets` cả bộ; lint budget hạ theo số cảnh báo biến mất (`--max-warnings`).
- 5 người: 2 người đi chơi tìm một đêm và bấm "Mua vé" tới trang bán; 2 nhà tổ chức đăng một sự kiện với link vé và giá từ; 1 admin thấy Console không còn Đơn hàng và không có lỗi.
- 2 tuần: 0 lỗi 5xx ở `/go`; lượt `ticket_click` không giảm so với 2 tuần trước; 0 route cũ được gọi (Sentry không có 404 lạ từ app cũ).

**Ngân sách không tăng.** Màn đầu trang sự kiện giảm (mục tiêu ≤ 7 + khung). Rail Studio 7 → 5. JS trang sự kiện giảm (`perf.spec.ts` ghi số mới, chỉ giảm).

**Dữ liệu xấu phải chạy.** Sự kiện có `entry_mode paid` mà không link → "Chưa rõ giá", nút tới trang gốc như design v2 phase 11. Sự kiện có tier cũ trong staging → migration xoá; seed không còn tier. Badge `doors` đã trao → xoá dòng. `event_metrics_daily` giữ `ticket_clicks`. `plans.pricePerHead` (`plans.ts`) đọc `bought.unit_price` từ `orders`: đổi về `events.price_from`.

**Xây.**
- P0 (1 ngày, API): migration `048_drop_ticketing.sql` (D7 A: khoá an toàn `raise exception` nếu `orders` có `paid`; `drop table` 12 bảng theo thứ tự khoá ngoại; xoá `badge_awards` code `doors`, `sold_out`, `sold_out_5`; `notification_prefs` topic `tickets` giữ hay đổi tên: giữ); xoá `routes/commerce.ts`, `routes/resale.ts`, `routes/organizer/door.ts`, `routes/organizer/money.ts`, `routes/admin/orders.ts`, `services/tickets.ts`, `services/resale.ts`, `services/payouts.ts`, `services/orders.ts`; `routes/organizer/audience.ts` giữ phần thông báo (`announcements`, dòng 30–100), xoá attendees/refund/resend; `routes/organizer/events.ts` bỏ `TiersInput`, `replaceTiers`; `routes/outbound.ts` `/go` bỏ nhánh `checkout` (luôn partner/organizer/trang gốc); `jobs.ts` bỏ `expireOrders`, `lowTicketAlerts`, nhánh `tier_open` của `reminders`; `services/badges.ts`; `services/eventpage.ts` bỏ `resale`, `tickets.tiers`, `mine.validTickets`; `presenters/event.ts`; `services/seo/*` bỏ `offers` theo tier, giữ `offers` một dòng từ `price_from` và `ticket_url`; `lib/money.ts`, `lib/vietqr.ts` giữ (plans); `config.ts` bỏ `PAYMENT_*`, `TICKET_SIGNING_SECRET`, `PLATFORM_BANK_*`; `app.ts` bỏ đăng ký route; `db/rows.ts` bỏ type; test: xoá `attendee`, `resale`; sửa `public`, `organizer`, `admin`, `ops`, `seo`, `partners`, `affiliate`, `roles`, `jobs`, `fresh`, `ads`, `radar`, `ingest`, `deploy`, `unit`; seed bỏ tier, order, ticket, promo, resale.
- P1 (1 ngày, web): xoá `kd/app/checkout.tsx`, `kd/app/tickets.tsx`, `kd/studio/door.tsx`, `kd/studio/revenue.tsx`, `kd/studio/promos.tsx`, `kd/studio/attendees.tsx`, `kd/web/event/resale.tsx`, `kd/console/orders/*` và các `app/(kd)/*/page.tsx` tương ứng; `kd/web/event/tickets.tsx` thành khối một hàng đi `/go`; `kd/web/event/dock.tsx` giữ; `kd/web/me.tsx` bỏ `tickets`; `kd/studio/root.tsx` rail 5 mục; `kd/studio/wizard.tsx`, `wizard-model.ts`, `editor.tsx`, `fields.tsx` bước Vé thành link và giá; `kd/console/events/*`, `review/*` bỏ tier; `kd/app/root.tsx`, `screens.tsx`, `inbox.tsx`, `live.tsx` bỏ nhánh vé; `kd/web/about/copy.ts`, `kd/web/copy.ts` câu mới; `kd/types.ts`; `kd/banks.ts` giữ (plans); `copy/asia/*` dòng mới theo khoá; `e2e/next/routes.ts`, `perf.spec.ts` bỏ route; `event.spec.ts`, `studio.spec.ts`, `studio-events.spec.ts`, `app.spec.ts`, `app-more.spec.ts`, `nav.spec.ts`, `site.spec.ts`, `backoffice.spec.ts`, `console-commerce.spec.ts` (xoá), `newcomer.spec.ts` (ghi `IN_SIGHT` mới, thấp hơn).
- P2 (½ ngày, docs): `CLAUDE.md`: bỏ mọi câu về checkout VND, tiers, resale, check-in, payouts, phí người mua; thêm "FeestFinder sells no tickets: every ticket button goes through `/go` to the seller; commerce tables were dropped in 048"; `docs/CURRENT_ARCHITECTURE.md` bảng Commerce; `TECH_DEBT.md`; roadmap. Hạ `--max-warnings` của oxlint và ESLint theo số thật.

**Xong khi.** Cổng xanh; `grep -rn "checkout\|ticket_tiers\|resale" src` chỉ còn ở `/go` (nhánh bên bán) và lịch sử migration; script phụ lục A: trang sự kiện có ít nút hơn 10 và không chữ "Pass vé"; `CLAUDE.md` không còn câu nào về bán vé.

### Thẻ A · Gmail là đủ (đêm 1)

**Một câu.** Đăng nhập (Google hay cách khác) là đủ để bình luận, gửi sự kiện, dự án, mix; không nơi nào đòi số điện thoại; admin xoá được bình luận.

**Người dùng thấy.** Sheet "Xác thực số điện thoại" không hiện ở hành động nào. Cài đặt vẫn có `Thêm số điện thoại · Add a phone number` (tuỳ chọn, cho đăng nhập bằng SMS). Mục bình luận: người đã đăng nhập thấy ô viết ngay. Console: ở `/console/reports` (bài bị báo) nút `Xoá · Delete` đã có qua `isEventTeam` (`community.ts:106-108`: admin là team của mọi sự kiện); thêm tab `Bình luận · Comments` liệt kê 100 bình luận mới nhất mọi sự kiện với `Xoá` (thẻ B dùng).

**Không làm.** Không gỡ đăng nhập SMS/Zalo/WhatsApp của phase 17. Không đổi thứ tự sheet đăng nhập. Không gỡ `users.phone_verified_at` (vẫn ghi khi người ta chứng minh số).

**10 điểm.**
- Cổng: `test/community.test.ts`, `test/projects.test.ts`, `test/mixes.test.ts`: tài khoản Google không số điện thoại đăng được bình luận, gửi sự kiện, dự án, mix; `discussion` `canWrite` trả `ok` cho mọi người đăng nhập; e2e `event.spec.ts`: fan seed (không số) bình luận được; `profiles.spec.ts` Cài đặt còn "Thêm số điện thoại".
- 5 người: 3 người mới đăng nhập Google và bình luận trong < 1 phút không gặp sheet nào khác; 2 người gửi một sự kiện cộng đồng.
- 2 tuần: 0 lần `phone_unverified` trong log; ≥ 60% người đăng nhập mới làm một việc (bình luận, lưu, gửi) trong 7 ngày.

**Ngân sách không tăng.** Màn đầu không đổi. Bớt một sheet trên đường tới bình luận (chạm từ "Bình luận" tới gửi: 2).

**Dữ liệu xấu phải chạy.** Tài khoản email chưa xác minh email: `requireUser` đủ. Tài khoản bị khoá (`users.status`?) vẫn bị chặn như hôm nay. Người đã có `phone_verified_at` không đổi gì.

**Xây.**
- P0 (½ ngày): `http/guards.ts` `requireWriter` = `requireUser` (giữ tên để không đổi 8 call site, comment ghi quyết định 2026-10-20 và rủi ro Nghị định 147); `routes/discussion.ts:108-112` `canWrite` bỏ `verify_phone`; web `kd/web/event/community.tsx:177` bỏ nhánh `verify_phone`; `kd/moments.tsx` bỏ gọi `kd/phone.tsx` trước khi đăng; `kd/phone.tsx` chỉ còn từ Cài đặt; Console tab Bình luận (`GET /admin/posts/recent`); `CLAUDE.md` mục "Personas and admin": "publishing needs a confirmed phone" → "signing in is enough (owner 2026-10-20; Decree 147 risk accepted)"; tests.

**Xong khi.** Cổng xanh; trên preview của branch, tài khoản Google mới bình luận được ngay; `CLAUDE.md` đã đổi câu.

### Thẻ B · Bình luận như Facebook (đêm 1, sau A)

**Một câu.** Dưới mỗi sự kiện có một dòng bình luận: viết, trả lời bất kỳ bình luận nào (trả lời hiện phẳng dưới bài gốc, mở đầu bằng @tên người được trả lời), thích, sửa trong 15 phút, xoá của mình, admin xoá, báo cáo; người được trả lời được báo.

**Người dùng thấy.** Trong "Thêm" của trang sự kiện: mục `Bình luận (n) · Comments (n)` thay ba tab. Mở ra: ô `Viết bình luận… · Write a comment…` và nút `Đăng · Post`; mỗi bình luận: avatar, tên, `{thời gian}`, nội dung, hàng hành động `Thích {n} · Like {n}`, `Trả lời · Reply`, menu `⋯` (`Sửa · Edit` trong 15 phút của mình, `Xoá · Delete` của mình hoặc admin, `Báo cáo · Report`); trả lời xếp dưới bài gốc thụt một cấp, tối đa 3 hiện rồi `Xem thêm {n} trả lời · See {n} more replies`; trả lời một trả lời: bắt đầu bằng `@Tên` và vẫn nằm trong cụm của bài gốc (như Facebook). Bình luận của nhà tổ chức mang nhãn `Nhà tổ chức · Organiser` (đã có `official`). Ghim của NTC giữ. Sắp xếp: mới nhất; bài ghim trên cùng. Thông báo: `{Tên} đã trả lời bình luận của bạn · {Name} replied to your comment`. Rỗng: `Chưa có bình luận. Viết bình luận · No comments yet. Write one`.

**Không làm.** Không thêm emoji phản ứng, không GIF, không ảnh trong trả lời (ảnh ở bình luận gốc giữ như `memory`/`talk` hôm nay), không @mention tự do (chỉ @tên tự sinh khi trả lời), không chỉnh sửa vô hạn, không bảng xếp hạng người bình luận. Hype giữ nguyên ngoài mục này. Track ID để sau.

**10 điểm.**
- Cổng: `test/community.test.ts`: trả lời một trả lời được nhận (`parent_id` = bài gốc, `reply_to_user_id` = người được trả lời), hiện phẳng; sửa sau 15 phút → 403; xoá của mình → `removed`; admin xoá bất kỳ → `removed`, `moderated_by`; thích/bỏ thích; báo cáo; thông báo tới người được trả lời (không tới chính mình); 10 phút 20 bài → `posting_too_fast` (giữ); e2e `event.spec.ts`: viết, trả lời, trả lời trả lời có @tên, xoá; `console.spec.ts` tab Bình luận xoá được; `newcomer.spec.ts` không đổi (mục trong "Thêm").
- 5 người: 3 fan bình luận và trả lời nhau trên điện thoại, không hỏi "tab nào"; 1 NTC trả lời câu hỏi; 1 admin xoá một bình luận từ Console trong < 1 phút.
- 2 tuần: ≥ 20% người xem sự kiện đã đăng nhập bình luận hay trả lời; bình luận bị báo được xử lý ≤ 24 giờ (Console › Số liệu).

**Ngân sách không tăng.** Màn đầu không đổi; mục nằm trong "Thêm". Trên trang sự kiện bớt hai tab.

**Dữ liệu xấu phải chạy.** Bài cũ kind `qa` có `answer` của NTC → hiện như bình luận gốc với trả lời gắn nhãn Nhà tổ chức; kind `crew`, `trackid`, `memory` cũ hiện trong dòng với ảnh nếu có; bài `removed` không hiện, trả lời của nó vẫn hiện với dòng `Bình luận đã xoá · Comment deleted` ở chỗ bài gốc; người được trả lời đã xoá tài khoản → không thông báo; nội dung 1 ký tự → 400 (giữ `checkPostText`).

**Xây.**
- P0 (1 ngày): migration `049_comments.sql`: `event_posts` thêm `reply_to_user_id uuid references users on delete set null`, `edited_at timestamptz`; (`event_post_votes` đã có cho thích). `routes/discussion.ts`: bỏ lỗi `reply_depth` (`discussion.ts:212`): trả lời một trả lời ghi `parent_id` = gốc của cụm và `reply_to_user_id`; `GET /events/:id/discussion` không chia tab: một danh sách bài gốc mới nhất (ghim trước) với 3 trả lời đầu và `replyCount`; `PATCH /posts/:id` chỉ trong 15 phút kể từ `created_at` và chỉ của mình (admin không sửa, chỉ xoá); `DELETE` giữ (admin qua `isEventTeam`); `PUT/DELETE /posts/:id/helpful` đổi nhãn thành thích (route giữ tên để không gãy); thông báo `notifyUser` kind `reply` topic `friends`? → topic mới không thêm: dùng `null` (transactional, in-app + push); `GET /admin/posts/recent`; tests.
- P1 (½ ngày): `kd/web/event/community.tsx` bỏ chip kinds, một composer, `Thread` hiện trả lời phẳng với `@Tên`, hành động Thích/Trả lời/⋯; `kd/web/event/more.tsx` mục `Bình luận (n)` thay `discussion`; copy vi/en và th/ja/id theo khoá; `kd/console/reports.tsx` tab Bình luận; e2e.

**Xong khi.** Cổng xanh; trên preview, hai tài khoản trả lời nhau và thấy @tên; `CLAUDE.md` mục "Feedback" hay "Community" thêm một dòng: comments are one stream per event, replies two levels shown flat, admins delete.

### Thẻ D · Affiliate thông minh (đêm 2, thay thẻ 3 của bản 2)

**Một câu.** Mỗi "Mua vé" là một link theo dõi được: `/go` chọn bên bán theo nước người xem, gắn click id và UTM, nhớ ai đã giới thiệu trong 30 ngày; bên bán báo chuyển đổi về bằng postback (đã có); FeestFinder nhận hoa hồng và chia cho người giới thiệu; NTC, fan, team và agent đều thấy số của mình.

**Đã có, dùng lại (`routes/outbound.ts`, `services/partners.ts`, migration 018 và 022):** `/go/:event` đếm `outbound_clicks` (device, nước, referrer, nguồn), nhận partner theo host và gắn `{click}` vào link partner; `/partners/<slug>/postback` ghi `partner_conversions` khớp click; `/go/link/:code` cho affiliate link tự do; `users.ref_code`, `?ref=` trên link chia sẻ, `share_visits`, mục "Đại sứ" trên trang sự kiện, huy hiệu `spread`; `/console/partners` liệt kê các host bán vé chưa có deal với số click; `/me/payee`.

**Cái mới, theo thứ tự giá trị:**
1. **Nhớ người giới thiệu tới tận bên bán.** `ff:ref:<eventId>` (30 ngày, từ `?ref=`) được gửi kèm khi bấm Mua vé: `/go/<slug>?src=…&ref=<code>`; `outbound_clicks.ref_user` ghi người giới thiệu (không phải chính người bấm); `partner_conversions.ref_user` chép từ click khi postback về. Attribution kiểu last-click 30 ngày, server-side, không cookie bên thứ ba.
2. **Chia hoa hồng (D8).** `ambassador_earnings (conversion_id unique, event_id, user_id, partner_id, amount, status pending|payable|paid|void)`: `amount = round(conversion.commission × SHARE_PCT / 100)` khi conversion `approved`; `void` khi `rejected`; `ambassador_payouts` theo kỳ, team đánh dấu đã trả (như partner payouts). `lib/affiliate.ts` giữ `SHARE_PCT = 50`, `MIN_PAYOUT = 50_000` VND, quy đổi tiền tệ của conversion về VND bằng tỷ giá cố định trong `lib/money.ts` (D: team cập nhật tỷ giá tay mỗi tháng; ghi rõ).
3. **Nhiều bên bán, chọn theo nước (D12).** `event_ticket_links (event_id, url, host, countries text[], currency, price_from, primary)`; `/go` chọn link có `countries` chứa nước của người xem (`x-ff-client-country`), không thì `primary`; wizard và editor: danh sách link vé. `events.ticket_url` giữ làm link chính (đồng bộ từ link `primary`) để mọi code cũ, SEO và Radar không đổi.
4. **UTM cho bên bán không có deal.** Link không partner nhận `utm_source=feestfinder&utm_medium=referral&utm_campaign=<slug>&utm_content=<ref|src>` (chỉ khi URL không đã có `utm_`); NTC thấy FeestFinder trong analytics của họ; là lý lẽ để ký deal.
5. **Dashboard.** Studio › Sự kiện › tab `Link vé · Ticket links` (thay Doanh thu): click theo ngày, theo nguồn (card, detail, map, share, agent, widget), theo bên bán, số người giới thiệu; `/organizer/affiliate` đã có một phần. "Tôi" › `Hoa hồng · Commission` (chỉ khi > 0) → `/app/commission`: sự kiện · lượt mở · click Mua vé · chuyển đổi · hoa hồng · trạng thái; `Tài khoản nhận tiền`. Console `/console/affiliate` tab `Đại sứ` (payouts) và `/console/partners` thêm "cần ký": top host theo click 30 ngày không có partner (có sẵn một phần).
6. **Agent và widget cũng là nguồn.** `/list.md` và MCP trả `/go/<slug>?src=agent`; widget trả `/e/<slug>?src=widget`; `PLACEMENTS` (`partners.ts:139`) thêm `agent`, `widget`, `share`.
7. **Chống gian.** `ref_user ≠ user_id` người bấm; dedupe click 30 phút đã có; conversion chỉ tính khi partner `approved`; một `ref` chỉ được tính khi `share_visits` có lượt mở trước click (chống dán ref tay).

**Người dùng thấy.** Sheet chia sẻ (đã đăng nhập): dòng `Hoa hồng {p}% · Commission {p}%` khi sự kiện có bên bán partner (p = `commission_pct × SHARE_PCT`); "Tôi": hàng `Hoa hồng` chỉ khi > 0; `/app/commission` như thẻ 3 cũ với cột `Chuyển đổi · Conversions` thay `Đơn`; Studio tab `Link vé`; Console như trên. Người chưa đăng nhập: không gì đổi.

**Không làm.** Không tiền từ NTC, không payout cho NTC (họ bán ở chỗ của họ). Không coupon của FeestFinder. Không bảng xếp hạng mới ngoài mục Đại sứ (D3c A). Không cookie bên thứ ba, không pixel. Không hoa hồng cho sự kiện của bên bán không có deal (chỉ đếm).

**10 điểm.**
- Cổng: `test/affiliate.test.ts`, `test/partners.test.ts` mở rộng: `/go` với `ref` ghi `outbound_clicks.ref_user` (không ghi khi `ref` là chính người bấm, không ghi khi chưa có `share_visits` của ref đó cho sự kiện); postback với click id → `partner_conversions.ref_user`; `approved` → earnings đúng số (commission 100.000 → 50.000); `rejected` → void; tiền tệ SGD quy về VND bằng tỷ giá cố định; chọn link theo nước (người Singapore → Megatix SG, người Việt → link chính); UTM thêm khi không partner và không có sẵn; `/list.md` chứa `/go/...?src=agent`; `GET /me/commission`; e2e: `event.spec.ts` sheet chia sẻ có dòng khi đăng nhập và sự kiện seed có partner; `app-more.spec.ts` `/app/commission`; `studio-events.spec.ts` tab Link vé với hai link và nước; `routes.ts` thêm `/app/commission`; `perf.spec.ts` đo một lần.
- 5 người: 3 fan chia sẻ, bạn mở và bấm Mua vé: fan thấy click trong `/app/commission`; 2 NTC thêm hai link bán vé theo nước và đọc được tab Link vé.
- 2 tuần: ≥ 2 partner có postback thật (team ký: Megatix, Ticketmaster qua Impact, Klook; mục 6); ≥ 5% click Mua vé mang `ref`; ≥ 1 chuyển đổi được ghi và chia; 0 earnings tự giới thiệu.

**Ngân sách không tăng.** Màn đầu không đổi. "Tôi" +1 hàng chỉ khi có tiền. Studio rail: `Link vé` là tab trong Sự kiện, không mục rail.

**Dữ liệu xấu phải chạy.** Postback không có click id → conversion `pending` không `ref_user`; click id của sự kiện khác → bỏ qua `ref`; `ref` của tài khoản đã xoá → bỏ; conversion tiền tệ không có tỷ giá → `pending` với lý do, team xử; sự kiện Radar với link trang gốc (không bán) → UTM vẫn gắn, không partner; hai link cùng nước → `primary` thắng; người xem không nước (header thiếu) → `primary`.

**Xây.**
- P0 (1 ngày, API): migration `051_affiliate.sql`: `outbound_clicks.ref_user`, `partner_conversions.ref_user`, `event_ticket_links`, `ambassador_earnings`, `ambassador_payouts` (SQL như thẻ 3 cũ, bỏ cột `order_id`/`pct`, thêm `conversion_id unique`, `partner_id`, `currency`, `amount_src`); `lib/affiliate.ts`; `/go` nhận `ref` (regex `^[2-9A-HJ-NP-Z]{6}$`), chọn link theo nước, UTM, ghi `ref_user`; `recordConversion` chép `ref_user` và tạo earnings khi `approved` (cả khi admin đổi trạng thái ở `PATCH /admin/conversions/:id`); `GET /me/commission`; `GET /organizer/events/:id/links` CRUD; `/list.md` và MCP (thẻ 6) dùng `/go?src=agent`; `PLACEMENTS` mới; tests.
- P1 (1 ngày, web): `context.tsx` lưu `ff:ref`; `tickets.tsx` và `dock.tsx` gắn `ref` vào `/go`; sheet chia sẻ dòng hoa hồng (đăng nhập); `me.tsx` hàng; `/app/commission`; Studio tab Link vé (`kd/studio/editor.tsx` bước Vé: danh sách link với nước và tiền tệ; `kd/studio/dashboard.tsx` số click); `routes.ts`; e2e.
- P2 (½ ngày): job `settleAmbassadors` (payable → gom kỳ), Console tab Đại sứ và "cần ký"; `CLAUDE.md` mục "Ticket buttons" viết lại: "`/go` picks the seller by the viewer's country, adds the partner's tracking or UTM, remembers who referred for 30 days (`ref`); a partner's approved conversion earns the referrer `SHARE_PCT` of FeestFinder's commission, paid by the team by period; never money from an organiser or a buyer"; roadmap.

**Xong khi.** Cổng xanh; trên preview: chia sẻ → mở → Mua vé → postback giả (curl với token của partner seed) → earnings hiện trong `/app/commission`; `CLAUDE.md` đã đổi.

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

### Thẻ 1 · Lịch của nhà tổ chức

**Một câu.** Trong Studio › Hồ sơ có khối "Lịch": dán hai dòng vào website của mình để lịch FeestFinder hiện ở đó; hoặc dán địa chỉ lịch có sẵn (ICS, trang có JSON-LD) để sự kiện tự về Studio chờ duyệt dưới tên mình.

**Người dùng thấy.** Studio › Hồ sơ (`kd/studio/profile.tsx`, một `Block` mới sau "Hồ sơ công khai", trước "Doanh nghiệp và liên hệ"), tên `Lịch · Calendar`, hai phần:
- `Nhúng vào website · Embed on your website`: snippet trong `<pre>` gói dòng, nút `Sao chép · Copy`, chọn ngôn ngữ và nền (`Tối · Sáng`), `Xem trước · Preview` (iframe `srcdoc`). Snippet:
  ```html
  <div data-ff-org="<slug>" data-ff-lang="vi" data-ff-theme="dark" data-ff-limit="6"></div>
  <script src="https://feestfinder.com/ui/widget/ff-widget.js" async></script>
  ```
- `Kết nối lịch có sẵn · Connect an existing calendar`: một ô `Địa chỉ lịch · Calendar address` (hint định dạng duy nhất: `https://…`), nút `Kết nối · Connect`. Khi đã nối: một hàng `Đọc lần cuối {t} · Last read {t}`, `{n} chờ duyệt · {n} in review` làm aside, nút `Ngắt · Disconnect`. Lỗi: `Không tìm thấy sự kiện ở địa chỉ này · No events at this address`, `Trang không cho đọc (robots.txt) · The page does not allow reading (robots.txt)`, `Không mở được · Could not reach it`.
- Widget (trên site của họ): mỗi dòng thứ + ngày, tên, venue · giá (`Miễn phí`, `Chưa rõ giá`, hay "từ {giá}" của trang bán vé; FeestFinder không bán vé từ bản 3), chân `Xem tất cả trên FeestFinder · See all on FeestFinder`. Vanilla JS, Shadow DOM, không tải font, dưới 8 KB gzip, không theo dõi.
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

---

## 5. Nhịp làm

1. **Hai đêm** (`docs/NIGHT_BUILD_PLAN_2026-10-19.md`): đêm 1 **C → A → B**; đêm 2 **D → 4 → 5 → 6 → 1**. Gỡ vé trước để không thẻ nào phải né mảng vé; A trước B vì B dựa trên cổng mới.
2. **Mỗi lát một PR** sáng sau (đêm chỉ branch), theo skill `design-phase` của design-kit; checklist "Thiết kế" đánh thật; `visual-ok` sau khi xem ảnh; merge khi chủ sản phẩm nói.
3. **Migration:** `048_drop_ticketing`, `049_comments`, `050_day_events`, `051_affiliate`, `052_organizer_calendar` (thứ tự hai đêm; đổi số theo merge thật; bump `CLAUDE.md`).
4. **Seed xấu như production** trước đêm 1: không tier, không đơn; một sự kiện có hai link bán vé (VN và SG) với partner seed `megatix` có `postback_token`; một bình luận có 4 trả lời và một trả lời của trả lời; một coffee rave; một kệ.
5. **Sau mỗi merge:** script phụ lục A trên production, ghi số vào roadmap. Số không được tăng.
6. **Không làm trong kế hoạch này:** Zalo OA, đổi điều hướng, thêm tab hay chip trên điện thoại, du lịch, Track ID, Crew, Night Pass, merch.

---

## 6. Việc của chủ sản phẩm, và những gì chờ điều kiện

**Chủ sản phẩm và team:**
1. Chọn D7–D12 (mục 2) hoặc để mặc định; xác nhận production **không có đơn `paid`** (Console › Đơn hàng trước khi gỡ; migration 048 cũng tự kiểm).
2. Nghị định 147 (D10): quyết định nhận rủi ro hay giữ cổng số điện thoại cho đăng tin.
3. **Ký affiliate**: Megatix (SG, TH, ID, VN), Ticketmaster (qua Impact), Klook, Ticketbox (hỏi chương trình), Eventbrite (affiliate qua Impact); nhập vào `/console/partners` với host, template link và token postback. Không có deal thì thẻ D chỉ đếm.
4. Tỷ giá cố định cho SGD, THB, IDR, JPY → VND trong `lib/money.ts` mỗi tháng (hoa hồng về VND).
5. Danh sách venue và collective cho thẻ 1; 5 người cho mỗi bài thử; sau thẻ 6 nối 5 agent.
6. Lint budget hạ sau đêm 1 theo số thật.

**Chờ điều kiện:**

| Việc | Làm khi | Hình hài đã định |
| --- | --- | --- |
| Zalo OA bot (thẻ 2) | Chủ sản phẩm mở lại; OA xác minh, webhook bật | Thiết kế ở bản 2 (lịch sử git), bốn chỗ chặn của mục 7 |
| Hoa hồng từ NTC (NTC thưởng người giới thiệu) | ≥ 3 NTC hỏi và có cách trả không qua FeestFinder | Trường `organizer_reward` hiển thị, FeestFinder không cầm tiền |
| Coupon của FeestFinder ở bên bán | Partner cấp mã | `promo` của partner trong `event_ticket_links` |
| Track ID, Crew vote, Drop, Night Pass, merch, du lịch, Mini App, Bàn người đi một mình | Như bản 2 | Như bản 2 |

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


### Bổ sung 2026-10-20 cho thẻ C, A, B, D

| Thẻ | Mức | Thấy gì | Làm gì |
| --- | --- | --- | --- |
| C | **chặn** | `plans.ts` `pricePerHead` đọc `orders.unit_price` | Đổi về `events.price_from` trước khi drop |
| C | **chặn** | `services/badges.ts` có `doors` (scans), `sold_out`, `sold_out_5` (tiers) | Gỡ khỏi catalogue và xoá `badge_awards` của chúng trong 048 |
| C | lệch | `services/seo/event.ts` viết `offers` theo tier | Một `Offer` từ `price_from`, `currency`, `ticket_url` |
| C | lệch | `routes/organizer/audience.ts` trộn attendees và announcements | Giữ announcements, xoá phần còn lại |
| C | lệch | `notification_prefs.topic 'tickets'` và `jobs` `tier_open` | Topic giữ (tên không hiện), job bỏ |
| C | nhỏ | `copy/asia/*` có dòng vé | Để lại, không hại; dọn khi rà bản dịch |
| A | lệch | `requireWriter` ở 8 chỗ, `canWrite` ở discussion, nhánh `verify_phone` ở web, `kd/moments.tsx` gọi `kd/phone.tsx` | Giữ tên hàm, đổi ruột; bỏ nhánh web |
| B | lệch | `reply_depth` chặn trả lời của trả lời (`discussion.ts:212`); `GET discussion` chia tab theo `kind` | Bỏ chặn, `reply_to_user_id`; một danh sách |
| B | nhỏ | `event_post_votes` đã là "thích" | Chỉ đổi nhãn |
| D | **chặn** | `/go` có nhánh `checkout` (`outbound.ts:69-80`) | Thẻ C gỡ trước; D chỉ thêm `ref`, nước, UTM |
| D | lệch | `recordConversion` không biết `ref`; trạng thái đổi ở `PATCH /admin/conversions/:id` | Tạo/void earnings ở cả hai chỗ |
| D | lệch | Tiền tệ của conversion theo bên bán | Tỷ giá cố định trong `lib/money.ts`, `pending` khi thiếu |

---

## 8. Kiểm kê dự án 2026-10-20 (cho ba điều chỉnh)

| Trục | Có gì | Ở đâu |
| --- | --- | --- |
| Cổng số điện thoại | `requireWriter` (= `requireUser` + `phoneVerified`) ở 8 call site: bình luận 1, cộng đồng 3, dự án 1, mix 3; `canWrite` trả `verify_phone`; web nhánh `verify_phone` và sheet `kd/phone.tsx` (chỉ `kd/moments.tsx` gọi) | `http/guards.ts:21-27`, `routes/discussion.ts:108-112`, `routes/community.ts:60,139,160`, `routes/projects.ts:195`, `routes/mixes.ts:147,155,241`, `kd/web/event/community.tsx:177` |
| Bình luận | `event_posts` (parent một cấp, 5 kind, ảnh, ghim, official, helpful, reply_count, report_count, status), `event_post_votes`, báo cáo, admin dismiss; xoá của mình hoặc team (admin là team mọi sự kiện); thông báo NTC khi có câu hỏi; chưa thông báo người được trả lời; chặn trả lời của trả lời | migration 010, `routes/discussion.ts`, `services/community.ts:65-150`, `kd/web/event/community.tsx`, `kd/console/reports.tsx` |
| Mảng vé | 12 bảng; API 2.051 dòng trong 11 file; web 1.511 dòng trong 10 file màn chính cộng 40 file có nhánh vé; test `attendee`, `resale` và nhánh trong 15 file; e2e `console-commerce` và nhánh trong 9 spec; job `expireOrders`, `lowTicketAlerts`, `tier_open`; config `PAYMENT_*`, `TICKET_SIGNING_SECRET`, `PLATFORM_BANK_*` | mục 3 và thẻ C |
| Affiliate | `/go/:event` với click id, partner theo host, template link; `/go/link/:code`; postback `partner_conversions`; `affiliate_links`, `affiliate_payouts`; `users.ref_code`, `share_visits`, mục Đại sứ; `/console/partners` với host chưa có deal; `/organizer/affiliate`; `/me/payee` | migration 018, 022; `routes/outbound.ts`, `services/partners.ts`, `routes/admin/partners.ts`, `routes/admin/affiliate.ts` |
| Đăng nhập | Google, email, SMS, Zalo, WhatsApp, mật khẩu; sheet xếp số điện thoại trước cho người Việt | `kd/sign-in.tsx`, `routes/auth.ts`, `services/sms.ts` |

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
