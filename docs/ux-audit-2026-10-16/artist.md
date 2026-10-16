# UX test: vai Nghệ sĩ (DJ / producer)

Người test đóng vai một DJ techno ở TP.HCM, bắt đầu từ tài khoản mới tinh. Preview ở http://localhost:3000, đồng hồ cố định 14.09.2026. Thử trên desktop 1440px và điện thoại 390px.

Ảnh chụp nằm trong `/tmp/claude-1000/-home-patrickstar-Desktop-FeestFinder/373f1ad5-e8b8-4d0a-ace8-9dd5ba44a801/scratchpad/ux/shots/`. Trong báo cáo này ghi tắt là `shots/…`. Kịch bản là các file `art-*.mjs` cùng thư mục `ux/`.

Tài khoản đã tạo:
- `art-acc1.txt`: nghệ sĩ mới "DJ Sao Bien", trang `/a/dj-sao-bien`.
- `art-acc2.txt`: tài khoản đã gửi yêu cầu nhận hồ sơ "DJ Mie", đang chờ duyệt.
- `art-acc-org.txt`: nhà tổ chức phụ "Art Tester Collective 8301", tạo qua API. Tài khoản này đăng 1 gig và gửi 1 lời mời booking để phía nghệ sĩ có thứ để xử lý.

Bên tester nhà tổ chức cũng đăng gig "DJ mở màn Org Test Night", gig đó hiện ra trong Cơ hội diễn.

**Về môi trường (cần biết khi đọc):**
- **Preview không chạy `FAKE_REMOTE_MEDIA`.**
  - Link ảnh `https://example.com/photo.jpg` báo "Không mở được link này" (`image_unreachable`).
  - Link mix SoundCloud bị API gọi oEmbed thật và trả về "SoundCloud không chia sẻ link này; hãy kiểm tra nó đang công khai".
  - Khi dò API, tôi lỡ làm server tự gọi ra ngoài một lần tới picsum.photos và một lần tới SoundCloud. Trình duyệt không rời localhost lần nào.
  - Hệ quả: không kiểm được đường đi thành công của ảnh đại diện, ảnh bìa và mix (trình phát, thích, bình luận trên trang công khai). Phần đó tôi chỉ đọc code.
- **Code thay đổi giữa chừng lúc đang test.** `festfinder-web/src/app/(kd)/layout.tsx` chuyển font sang Noto Sans.
  - Có vài trang trả 500 tạm thời ("Module not found: @fontsource/be-vietnam-pro"), sau đó tự hết.
  - Ảnh chụp trước và sau mốc đó khác font.
- Không có dự án công khai nào (`/projects` total = 0), nên không thử thật được việc "Đề nghị biểu diễn" ở `/p/<slug>`. Phần này đánh giá theo code `kd/web/projects/offer.tsx`.

---

## 1. Các luồng trải nghiệm

### A. Từ tài khoản mới thành nghệ sĩ (desktop)

1. ✓ Đăng ký xong, vào `/`: sheet "Bạn đến với âm nhạc thế nào?" tự mở, có 3 lựa chọn (`shots/art-01-home-after-signup.png`).
2. ✓ Chọn "Biểu diễn": điền Nghệ danh, Bạn làm gì, Thành phố, rồi bấm "Tạo hồ sơ" (`shots/art-01-picker-filled.png`). Form gọn.
3. ✗ Vào thẳng `/studio/artist`, không có toast báo đã tạo hồ sơ, không có bước nào gợi ý làm gì trước.
   - Màn đầu là một form rất dài: 13 ô link, 20 chip phong cách, booking…
   - Ba số "0 Show sắp tới · 0 Tổng sự kiện · 0 Người theo dõi" vô nghĩa với người mới (`shots/art-01-studio-first.png`).
4. ✗ Phong cách nhạc đã có trong API `/me/roles/artist` nhưng sheet không hỏi, nên phải chọn lại trong studio.
5. ✗ Dán link ảnh (`https://example.com/photo.jpg`) thì báo "Không mở được link này". Đây là do môi trường, xem ở trên (`shots/art-02-photo-checked.png`).
6. ✗ Gõ SoundCloud thiếu `https://` rồi bấm Lưu:
   - Toast báo "Đây không phải link SoundCloud". Câu này sai, vì link đúng là SoundCloud, chỉ thiếu `https://`.
   - Lỗi của ô đó nằm ở cuối trang, ngoài màn hình, và trang không cuộn tới (`shots/art-02-saved-badlink.png`).
7. ✓ Sửa lại link, lưu được: "Đã lưu hồ sơ" (`shots/art-02-saved.png`).
8. ✓ "Xem trang công khai" mở `/a/dj-sao-bien` (`shots/art-02-public-owner.png`).
9. ✗ Trên trang của chính mình:
   - Nút chanh duy nhất là "Theo dõi". Nghệ sĩ bấm được để theo dõi chính mình và số người theo dõi thành 1 (`shots/art-18-follow-self.png`).
   - Dòng trống "Chưa có show sắp tới. Theo dõi để nhận tin sớm nhất." cũng hiện cho chủ hồ sơ.

### B. Nhận một hồ sơ đã có sẵn (điện thoại, DJ Mie / Radar Kobosil)

1. ✗ Vào `/a/dj-mie` bằng tài khoản mới: sheet chọn vai bật đè lên trang.
   - Đóng sheet là thành "fan" (`shots/art-08-m-djmie-onboard.png`).
2. ✗ Link "Bạn là nghệ sĩ này?" nằm **dưới cả footer**. Đó là dòng chữ cuối cùng của trang, chữ nhỏ (`shots/art-08-m-claimlink.png`, desktop `shots/art-12-radar-artist.png`).
3. ✓ Bấm link: sheet mở ở bước Nghệ sĩ, tên đã điền sẵn, có mục "ĐÃ CÓ TRÊN FEESTFINDER? NHẬN QUẢN LÝ · DJ Mie · Nhận" (`shots/art-08-m-claim-picker.png`).
4. ✗ Bấm "Nhận": sheet đóng im lặng (toast rỗng). Câu của server "Đã gửi yêu cầu. Đội ngũ sẽ kiểm tra, thường trong một ngày." không hiện.
   - Không hỏi bằng chứng hay lời nhắn, dù API nhận `note` và `proofUrl`.
   - Link "Bạn là nghệ sĩ này?" vẫn còn trên trang (`shots/art-08-m-after-claim.png`).
5. ✓ Menu tài khoản hiện "Nghệ sĩ · CHỜ DUYỆT" (`shots/art-08-m-account-menu.png`).
6. ✗ Vào `/studio/artist` thì gặp ngõ cụt (`shots/art-08-m-studio-pending.png`):
   - Thẻ "Yêu cầu nhận hồ sơ đang chờ duyệt" chỉ có một nút "Đổi tài khoản", và nút đó thực chất là đăng xuất.
   - Không nói hồ sơ nào, không có hạn chờ, không huỷ được, không có đường về trang.
7. ✗ Khi chưa đăng nhập, bấm "Bạn là nghệ sĩ này?" thì hiện sheet đăng nhập "Đăng nhập để quản lý hồ sơ này" (`shots/art-14-claim-signin.png`).
   - Đăng nhập xong không quay lại bước nhận hồ sơ, vì `requireSignIn` không mang intent.
   - Tài khoản mới thì rơi vào sheet chọn vai từ đầu và phải gõ lại tên.

### C. Studio nghệ sĩ: từng màn hình của rail

- **Hồ sơ `/studio/artist`**
  - ✓ Đủ trường, chia khối rõ: Bạn là ai / Nghe và theo dõi / Booking.
  - ✗ Rời trang bằng rail khi chưa lưu thì **mất thay đổi mà không hỏi** (đã thử: sửa Giới thiệu, bấm "Mix", quay lại là mất).
  - ✗ Trên điện thoại form cao khoảng 6.900px, nút "Lưu thay đổi" chỉ có ở đầu trang (`shots/art-10-m-studio-full.png`, `shots/art-10-m-studio-bottom.png`).
- **Mix `/studio/artist/mixes`**
  - ✓ Trống thì hiện "Chưa có mix" và nút "Thêm mix" ở đầu trang.
  - ✓ Drawer có thông báo lỗi rõ: "Hãy dán link SoundCloud, Mixcloud hoặc Spotify" (`shots/art-05-mix-bad.png`, `shots/art-10-m-mix-drawer.png`).
  - ✗ Thêm mix cần SĐT đã xác nhận (`requireWriter`), nhưng màn này chỉ hiện toast lỗi, không mở `PhoneSheet` như trang công khai. Đọc code, không thử thật được vì oEmbed thật bị chặn.
  - ✗ Nút xoá mix xoá ngay, không hỏi lại (code).
- **Lịch diễn & booking `/studio/artist/gigs`** (4 tab)
  - ✗ "Đã ứng tuyển" trống chỉ hiện "Chưa ứng tuyển gig nào", không có link sang Cơ hội diễn (`shots/art-05-gigs-mine.png`).
  - ✓ "Lời mời": trả lời trong sheet được, toast "Đã gửi trả lời" (`shots/art-17-m-answer-sheet.png`).
  - ✗ Sau khi chọn "Đồng ý trao đổi" thì **không có liên hệ nào** của nhà tổ chức. Dòng chỉ còn trạng thái "ĐỒNG Ý TRAO ĐỔI" (`shots/art-19-requests-accepted.png`).
  - ✓ "Lịch trống": thêm khoảng, lưu được, toast "Đã lưu lịch trống" (`shots/art-18-dates-saved.png`).
  - ✗ Ngày đã đánh dấu **Bận** lại hiện **"RẢNH"** trên trang công khai (`shots/art-20-public-avail.png`).
  - ✓ "Lịch diễn đã báo": báo một đêm đã có sẵn thì nhận "Đã gắn vào sự kiện đang có"; báo đêm mới thì nhận "Đã gửi để kiểm duyệt" (`shots/art-07-report-2.png`).
  - ✗ Dòng đêm đang duyệt dẫn tới trang **404** "Không tìm thấy trang này. Sự kiện có thể đã kết thúc, bị gỡ…" (`shots/art-22-inreview-event.png`).
- **Cơ hội diễn `/studio/artist/opportunities`** (3 tab)
  - ✓ Có gig, điểm phù hợp "78/100", phí, nút "Ứng tuyển".
  - ✓ Sheet ứng tuyển ngắn gọn, toast "Đã gửi hồ sơ" (`shots/art-17-m-apply-sheet.png`).
  - ✗ Không mở được chi tiết gig: tên gig không bấm được, mô tả bị cắt 2 dòng, và sheet ứng tuyển không hiện mô tả.
  - ✗ Ngày bận chỉ làm điểm tụt từ 78 xuống 70. Câu "Bạn đã báo bận ngày này" chỉ có trong `title`/`sr-only`, nên trên màn hình không thấy (`shots/art-18-opp-busy.png`).
  - ✗ Tab "Thương hiệu" khi tắt: nút "Mở hồ sơ" về đầu trang hồ sơ, trong khi công tắc nằm ở cuối, và bật xong vẫn phải bấm "Lưu thay đổi".
  - ✗ Tab "Dự án": "Đề nghị biểu diễn" chỉ là link sang `/p/<slug>`, ở đó phải bấm "Đề nghị tham gia" rồi chọn chip "Biểu diễn" lần nữa. Không hiện mình đã đề nghị dự án nào (code).
- **Thiết bị `/studio/artist/gear`**
  - ✓ Tìm "CDJ" ra "Pioneer DJ CDJ-3000". Thêm tên ngoài danh mục thì có nhãn "CHỜ DUYỆT" (`shots/art-18-gear-search.png`, `shots/art-18-gear-added.png`).
  - Ổn, nhưng đây là màn ít khi dùng mà lại chiếm 1 trong 5 mục rail.
- **Inbox / thông báo**
  - ✗ Studio không có chuông hay danh sách thông báo.
  - Lời mời booking chỉ thấy ở `/app/notifications` ("Lời mời booking · Art Tester Collective 8301 · 2026-10-17 · TP.HCM") (`shots/art-17-m-notifications.png`).
  - Header của site (`/`) không có chuông (`shots/art-17-m-home-with-notif.png`).

### D. Studio trên điện thoại

1. ✗ Rail biến thành dải tab ngang; "Cơ hội diễn" và "Thiết bị" bị đẩy ra ngoài màn hình (`shots/art-10-m-studio-top.png`).
2. ✗ Ở màn có ít nội dung, dải rail cao khoảng 240px, trống trơn (`shots/art-17-m-opp-open.png`, `shots/art-17-m-requests.png`, `shots/art-10-m-gigs-dates.png`).
3. ✗ Phần đầu và cuối rail bị ẩn (`kd-sn-hide`), nên trên điện thoại không có:
   - đăng xuất,
   - "Đổi sang Nhà tổ chức",
   - "Người tham dự" (về site),
   - logo, link "Xem trang công khai" (trừ ở màn Hồ sơ).
   Người dùng chỉ thoát ra được bằng nút back của trình duyệt.
4. ✗ Bảng có `min-width: 640px` và thanh cuộn bị ẩn. Cột hành động nằm ngoài màn hình mà không có dấu hiệu gì: "Ứng tuyển", "Trả lời", "Phí", "Lineup / Chờ BTC thêm tên" (`shots/art-17-m-opp-open.png`, `shots/art-17-m-requests.png`, `shots/art-10-m-gigs-report.png`).

### E. Đổi vai sang Nhà tổ chức rồi quay lại

1. ✓ Menu tài khoản → "Đổi sang Nhà tổ chức" → hỏi "Mỗi tài khoản một vai nghề… Hồ sơ Nghệ sĩ vẫn được giữ" (`shots/art-09-switch-ask.png`).
   - Tiêu đề vẫn là "Bạn đến với âm nhạc thế nào?", không khớp nội dung.
2. ✗ Bấm "Đổi sang Nhà tổ chức" thì vai nghệ sĩ **bị tắt ngay**, rồi mới hiện form tạo nhà tổ chức (`shots/art-09-switch-orgform.png`).
   - Đóng form lại thì tài khoản không còn vai nghề nào: `roles.artist = disabled, craft = null`.
   - Nếu làm từ rail của studio, màn hình lập tức đổi thành "Hồ sơ nghệ sĩ đang tắt" (`shots/art-21-after-close.png`).
3. ✗ Menu lúc này chỉ còn "Thêm vai nghề". Chọn "Biểu diễn" thì phải điền **Nghệ danh** lại.
   - Gõ "Sao Bien Moi" rồi "Tạo hồ sơ": server lặng lẽ bật lại hồ sơ cũ "DJ Sao Bien" và bỏ qua tên vừa gõ (`shots/art-21-readd-typed.png`).
4. ✓ Đường đúng là vào `/studio/artist` → "Bật lại hồ sơ nghệ sĩ". Nút này chạy tốt (`shots/art-09-studio-off.png`, `shots/art-09-studio-back.png`).
   - Trong lúc tắt, trang công khai vẫn hiện bình thường và vẫn có nút "Chỉnh hồ sơ".
5. ✗ Menu tài khoản tick "Người tham dự ✓", còn "Nghệ sĩ" thì không tick (`shots/art-09-account-menu-artist.png`).
   - Nghệ sĩ dễ hiểu là mình *không* ở vai nghệ sĩ.
   - Thực ra "Nghệ sĩ" là link vào studio.

### F. Di chuyển giữa studio, site công khai và app

- ✗ `/app/profile` (tab "Tôi") và `/profile` (menu "Hồ sơ của tôi") không có link tới studio nghệ sĩ hay trang `/a/<slug>` (`shots/art-13-m-app-profile.png`, `shots/art-13-m-web-profile.png`).
  - "Hồ sơ của tôi" là hồ sơ fan, tên hiện "…".
  - Từ app chỉ vào studio được qua menu tài khoản trên header của site.
- ✗ Menu hamburger trên điện thoại không có mục vai/studio (`shots/art-13-m-hamburger.png`).
- ✗ Footer có "Cho nhà tổ chức" nhưng không có gì cho nghệ sĩ.
- ✗ `/a` không có lời mời kiểu "Bạn là nghệ sĩ?" (`shots/art-11-dir.png`).
- ✗ Show sắp tới của chính mình chỉ thấy ở trang công khai.
  - Studio chỉ có con số "Show sắp tới".
  - Gig được nhận ("Đã chốt") hay lời mời được đồng ý đều không thành mục nào trong lịch.
- ✓ Từ studio có hai link "Xem trang công khai" (rail và đầu trang Hồ sơ).
- ✓ Từ trang công khai, chủ hồ sơ có "Chỉnh hồ sơ".

### G. Thư mục và trang công khai

- ✓ `/a` có tab "Tất cả 36 · Đã đăng 29 · Radar 7", bộ lọc vai trò, phong cách, thành phố, "Nhận booking", "Sắp diễn", và ô tìm (`shots/art-11-dir.png`).
- ✓ `/a/style/techno` và `/a/city/ho-chi-minh` có breadcrumb và "Bỏ lọc" (`shots/art-12-dir-techno.png`, `shots/art-12-dir-hcm.png`).
- ✓ Nghệ sĩ mới (0 show) vẫn được liệt kê, có huy hiệu "ĐANG NHẬN BOOKING".
- ✓ Trang Radar `/a/kobosil` có nhãn "RADAR", có "Diễn nhiều nhất với" (`shots/art-12-radar-artist.png`).
- ✗ Trang Radar có hai nút chanh ("Theo dõi" và "Mua vé") trên cùng một màn.
- ✗ Breadcrumb trang nghệ sĩ là "FeestFinder / DJ Sao Bien", thiếu cấp "Nghệ sĩ".
- ✗ Trang hiện "ĐANG NHẬN BOOKING" nhưng không có nút nào để nhà tổ chức gửi lời mời; lời mời chỉ gửi được từ Studio.
- Không kiểm được mục "Nghe" (mix), thích và bình luận vì không thêm được mix (xem phần môi trường).

---

## 2. Phát hiện

| # | Mức | Ở đâu | Chuyện gì xảy ra | Bằng chứng | Đề xuất |
|---|---|---|---|---|---|
| 1 | P0 | `/studio/artist` khi yêu cầu nhận hồ sơ đang chờ; `kd/artist/root.tsx:74` | Ngõ cụt: "Yêu cầu nhận hồ sơ đang chờ duyệt", nút duy nhất là "Đổi tài khoản" (= đăng xuất). Không biết nhận hồ sơ nào, chờ bao lâu, không huỷ được, không có đường về. | `shots/art-08-m-studio-pending.png` | Hiện tên và link hồ sơ đang nhận, ngày gửi, "thường trong một ngày". Thêm nút "Về trang chủ" và "Huỷ yêu cầu". Bỏ "Đổi tài khoản" khỏi vị trí nút chính. |
| 2 | P0 | Điện thoại, mọi màn studio; `kd/kd.css:270-272` (`.kd-side-nav .kd-sn-hide`) | Trên điện thoại không đăng xuất được, không đổi vai được, không có đường về site; logo và "Xem trang công khai" bị ẩn. | `shots/art-10-m-studio-top.png`, `shots/art-17-m-opp-open.png` | Thêm một nút "⋯" hoặc avatar ở đầu dải rail trên điện thoại, mở sheet: trang công khai, về site, đổi vai, đăng xuất. |
| 3 | P1 | Điện thoại, bảng Cơ hội diễn, Lời mời, Đã ứng tuyển, Đã báo; `kd/kd.css:283` (`.kd-tr { min-width: 640px }`) | Nút hành động ("Ứng tuyển", "Trả lời", "Rút"), Phí và cột Lineup nằm ngoài màn hình. Thanh cuộn bị ẩn nên không ai biết phải vuốt ngang. | `shots/art-17-m-opp-open.png`, `shots/art-17-m-requests.png`, `shots/art-10-m-gigs-report.png` | Dưới 640px, bảng hiện thành thẻ: tên, dòng phụ, phí, rồi nút hành động full-width ở cuối. |
| 4 | P1 | Đổi vai; `kd/role-picker.tsx:62` (`doSwitch`) + `services/roles.ts` `switchCraft` | "Đổi sang Nhà tổ chức" tắt vai nghệ sĩ *trước khi* có nhà tổ chức. Đóng form thì không còn vai nào; ở studio thì bị đá ra màn "đang tắt". | `shots/art-09-switch-orgform.png`, `shots/art-21-after-close.png` | Chỉ gọi `/me/roles/switch` khi đã có hồ sơ đích, hoặc gộp tạo nhà tổ chức và tắt nghệ sĩ vào một bước. Đóng form thì giữ nguyên vai cũ. |
| 5 | P1 | Trang công khai, mục "Lịch"; `kd/web/artist/page.tsx:239` | Ngày đánh dấu **Bận** hiện **"RẢNH"**. API trả `kind: 'unavailable'`, còn trang so với `'busy'`. Nhà tổ chức sẽ thấy sai. | `shots/art-20-public-avail.png` | So với `'unavailable'` (hoặc thống nhất một tên ở API). Thêm test. |
| 6 | P1 | Lời mời → "Đồng ý trao đổi"; `kd/artist/gigs.tsx:148-150`, `routes/gigs.ts:184-189` (`presentInquiry`) | Đồng ý xong không có cách liên lạc: không có email, SĐT hay chat của nhà tổ chức. Gig ứng tuyển chuyển "Đã chốt" cũng vậy. Ở Dự án thì offer được nhận lại cho hai bên thấy liên hệ của nhau. | `shots/art-19-requests-accepted.png` | Làm như Dự án: khi `accepted` hoặc `booked` thì cho hai bên thấy liên hệ (hoặc mở chat `/app/chat`). |
| 7 | P1 | Nhận hồ sơ; `kd/role-picker.tsx:110` (`claim`) | Bấm "Nhận" thì sheet đóng im, không toast (server có câu "Đã gửi yêu cầu…"). Không hỏi bằng chứng hay lời nhắn dù API có `note` và `proofUrl`, nên admin không có gì để xác minh. | `shots/art-08-m-after-claim.png` | Thêm một bước sau "Nhận": ô "Link chứng minh (Instagram, SoundCloud…)" và lời nhắn, rồi màn xác nhận với câu của server. |
| 8 | P1 | Trang công khai; `kd/web/artist/page.tsx:314`, `kd/web/profile/parts.tsx:122` | Link "Bạn là nghệ sĩ này?" nằm dưới footer, rất khó thấy. Sau khi gửi yêu cầu, link vẫn còn. | `shots/art-08-m-claimlink.png`, `shots/art-12-radar-artist.png` | Đưa thành nút phụ cạnh "Theo dõi" ở hồ sơ chưa ai nhận, nhất là hồ sơ Radar. Ẩn hoặc đổi thành "Đang chờ duyệt" khi đã gửi. |
| 9 | P1 | `/studio/artist`, rời trang bằng rail; `kd/artist/profile.tsx:60-65` | Chỉ có `beforeunload`; bấm mục trên rail (Next `Link`) thì mất thay đổi mà không hỏi. | (art-18: sửa bio, sang "Mix", quay lại là mất) | Chặn điều hướng client khi đang `dirty` (hỏi qua `useAsk`), hoặc tự lưu nháp. |
| 10 | P1 | `/studio/artist` trên điện thoại; `kd/artist/profile.tsx:113` | Form dài khoảng 6.900px, nút Lưu chỉ ở đầu trang. Sửa công tắc ở cuối xong phải cuộn lên. | `shots/art-10-m-studio-full.png` | Thanh "Lưu thay đổi" dính ở đáy khi `dirty`, như các form khác. |
| 11 | P1 | "Lịch diễn đã báo"; `kd/artist/gigs.tsx:270` | Đêm đang duyệt vẫn là link tới `/e/<slug>` và ra 404 "Sự kiện có thể đã kết thúc, bị gỡ…". Đáng sợ với người vừa báo lịch. | `shots/art-22-inreview-event.png` | Chỉ thành link khi `status === 'live'`; khi chưa thì hiện chữ thường. |
| 12 | P1 | Studio trên điện thoại, màn ít nội dung; `kd/kd.css:262` (`.kd-shell` flex-wrap + `min-height:100dvh`, `align-content` mặc định stretch) | Dải rail cao khoảng 240px, trống, đẩy nội dung xuống. | `shots/art-17-m-opp-open.png`, `shots/art-10-m-gigs-dates.png` | Thêm `align-content: flex-start` cho `.kd-shell` khi màn hẹp. |
| 13 | P1 | App và site không dẫn vào studio; `kd/app/profile.tsx`, menu hamburger và footer trong `kd/web/chrome.tsx:246` | Tab "Tôi", "Hồ sơ của tôi", menu điện thoại và footer đều không có đường tới studio hay trang nghệ sĩ. Footer chỉ có "Cho nhà tổ chức". | `shots/art-13-m-app-profile.png`, `shots/art-13-m-hamburger.png` | Thêm một dòng "Studio nghệ sĩ · /a/<slug>" ở tab Tôi và /profile khi có vai nghệ sĩ. Footer thêm "Cho nghệ sĩ" (mở `?role=artist`). |
| 14 | P1 | Thông báo cho nghệ sĩ | Lời mời booking chỉ thấy ở `/app/notifications`. Studio và header site không có chuông hay số đếm. | `shots/art-17-m-notifications.png`, `shots/art-17-m-home-with-notif.png` | Đặt số đếm ở mục "Lịch diễn & booking" trên rail (SideItem có sẵn `count`) và một chấm ở avatar. |
| 15 | P1 | Menu tài khoản; `kd/web/chrome.tsx:118-120` | "Người tham dự ✓", còn "Nghệ sĩ" không tick, trông như vai chưa bật; thực ra là link vào studio. | `shots/art-09-account-menu-artist.png` | Bỏ kiểu radio. Dùng "Studio nghệ sĩ →" (kèm tên nghệ danh) và "Đổi sang Nhà tổ chức". |
| 16 | P1 | Cơ hội diễn; `kd/artist/opportunities.tsx:92,97,116` | Không xem được chi tiết gig: tên không bấm được, mô tả cắt 2 dòng, sheet ứng tuyển không có mô tả. Gig "DJ mở màn Org Test Night" không có mô tả nào. | `shots/art-18-opp-busy.png` | Bấm dòng thì mở drawer chi tiết (mô tả đầy đủ, nhà tổ chức, sự kiện nếu có, hạn) với nút "Ứng tuyển" ở đáy. |
| 17 | P2 | Cơ hội diễn; `kd/artist/opportunities.tsx:99-101` | "Bạn đã báo bận ngày này" chỉ có trong `title`/`sr-only`, nên trên cảm ứng không ai thấy. | `shots/art-18-opp-busy.png` | Hiện nhãn "Bận" màu cảnh báo ngay trên dòng. |
| 18 | P2 | Thêm lại vai nghệ sĩ sau khi tắt; `kd/role-picker.tsx:73`, `services/roles.ts` `startArtistProfile` (nhánh `owned`) | Hỏi "Nghệ danh" lại, rồi bỏ qua tên vừa gõ và bật hồ sơ cũ. | `shots/art-21-readd-typed.png` | Khi đã có hồ sơ: hiện thẳng "Bật lại DJ Sao Bien", không hỏi tên. |
| 19 | P2 | Trang công khai của chính mình; `kd/web/artist/page.tsx:177,137` | Chủ hồ sơ thấy "Theo dõi" màu chanh và theo dõi được chính mình (người theo dõi = 1). Câu trống "Theo dõi để nhận tin sớm nhất" hiện cho chủ hồ sơ. | `shots/art-18-follow-self.png`, `shots/art-19-m-public-owner.png` | Với chủ hồ sơ: ẩn "Theo dõi", để "Chỉnh hồ sơ" làm nút chính. Câu trống đổi thành "Báo lịch diễn" (link sang tab báo lịch). API từ chối tự theo dõi. |
| 20 | P2 | Lưu hồ sơ với link thiếu `https://`; `kd/artist/profile.tsx:99-100` | Toast "Đây không phải link SoundCloud" (sai). Lỗi nằm ở ô ngoài màn hình. | `shots/art-02-saved-badlink.png` | Tự thêm `https://` khi thiếu. Cuộn tới và focus ô lỗi đầu tiên. |
| 21 | P2 | Mix; `kd/artist/mixes.tsx:80,106` | Xoá mix không hỏi lại. Khi cần SĐT, màn này chỉ toast lỗi, không mở `PhoneSheet`. | (code) | Hỏi trước khi xoá (`useAsk`). Bắt lỗi cần SĐT và mở `PhoneSheet` như `web/artist/mixes.tsx`. |
| 22 | P2 | Thương hiệu tắt → "Mở hồ sơ"; `kd/artist/opportunities.tsx:155` | Về đầu trang hồ sơ; công tắc ở cuối, bật xong còn phải "Lưu thay đổi". | `shots/art-05-opp-brands.png` | Bật ngay tại chỗ (một nút "Bật nhận hợp tác"), hoặc link có `#brands` và tự lưu khi gạt. |
| 23 | P2 | "Lịch trống" công khai | Studio không nói rằng các khoảng Rảnh/Bận sẽ hiện công khai ở trang `/a/<slug>`. | `shots/art-20-public-avail.png` | Thêm một dòng gợi ý định dạng ("Hiện trên trang công khai"), hoặc công tắc ẩn/hiện. |
| 24 | P2 | Màn đầu studio của nghệ sĩ mới | Không có bước đầu: ba số 0, form dài; sheet tạo hồ sơ không hỏi phong cách (API có). | `shots/art-01-studio-first.png` | Thêm chip phong cách vào sheet. Ở studio mới, hiện 3 việc còn thiếu (ảnh, phong cách, một mix), không viết giải thích. |
| 25 | P2 | Ẩn rail trên điện thoại | "Cơ hội diễn" và "Thiết bị" nằm ngoài màn. | `shots/art-10-m-studio-top.png` | Rút rail còn 4 mục (xem mục 3 bên dưới), đủ chỗ trên 390px. |
| 26 | P2 | Rail desktop, chân: "Người tham dự" | Nhãn là tên vai nhưng thực ra là link về site. | `shots/art-05-gear.png` | Đổi thành "Về FeestFinder" hoặc "Khám phá". |
| 27 | P2 | Hộp thoại đổi vai | Tiêu đề "Bạn đến với âm nhạc thế nào?" đứng trên nội dung "Mỗi tài khoản một vai nghề". | `shots/art-09-switch-ask.png` | Tiêu đề theo bước: "Đổi sang Nhà tổ chức?". |
| 28 | P2 | Trang công khai | Breadcrumb thiếu "Nghệ sĩ". "ĐANG NHẬN BOOKING" nhưng không có nút gửi lời mời. Trang Radar có 2 nút chanh. | `shots/art-14-public-fan-view.png`, `shots/art-12-radar-artist.png` | Breadcrumb `FeestFinder / Nghệ sĩ / <tên>`. Thêm "Gửi lời mời booking" cho tài khoản nhà tổ chức. Nút "Mua vé" ở dòng show để tông thường. |
| 29 | P2 | Hồ sơ nghệ sĩ tự tạo | Lên `/a` ngay với nhãn "Đã đăng" dù chưa ai xác minh. Ai cũng tạo được tên một nghệ sĩ nổi tiếng chưa có trên hệ thống. | `shots/art-12-dir-techno.png` | Tối thiểu: chưa xác minh thì không lên thư mục khi chưa có show. Hoặc đưa vào hàng duyệt như các listing khác. |
| 30 | P2 | Ngày tháng | Ô `type=date` hiện "mm/dd/yyyy" trong context `vi-VN` (headless) ở Báo lịch diễn và Lịch trống. | `shots/art-05-gigs-report.png` | Kiểm lại trên thiết bị thật. Nếu vẫn vậy, dùng bộ chọn ngày của Kính đêm theo dd/mm. |

---

## 3. Tính năng trùng hoặc chồng lấn

1. **Bốn đường "được đi diễn" nằm ở bốn chỗ.** Đó là: ứng tuyển gig, lời mời booking, đề nghị biểu diễn ở Dự án, và quan tâm chiến dịch thương hiệu.
   - Cái tìm thì nằm ở "Cơ hội diễn" (Gig đang mở / Thương hiệu / Dự án).
   - Cái theo dõi thì rải rác:
     - ứng tuyển ở "Lịch diễn & booking › Đã ứng tuyển",
     - lời mời ở "› Lời mời",
     - offer dự án ở `/p/mine` (ngoài studio),
     - thương hiệu đã chọn mình ở cuối tab "Thương hiệu".
   - **Gộp:**
     - **"Booking"**: một danh sách hồ sơ (pipeline) duy nhất, mỗi dòng có nguồn (Gig · Lời mời · Dự án · Thương hiệu) và trạng thái (Đã gửi → Danh sách chọn → Đã chốt / Chưa phù hợp). Hành động ngay trên dòng: Trả lời, Rút, Liên hệ khi đã chốt.
     - **"Tìm gig"**: chỉ để khám phá, ba nguồn là bộ lọc chứ không phải ba tab.
2. **Lịch nằm ba nơi.** "Lịch trống" (tab), "Lịch diễn đã báo" (tab), còn show đã xác nhận chỉ có ở trang công khai.
   - **Gộp thành "Lịch"**: một dòng thời gian gồm
     - show đã xác nhận (từ events),
     - lịch đã báo đang chờ (có nhãn "Chờ BTC thêm tên" hoặc "Đang duyệt"),
     - các khoảng Rảnh/Bận.
   - Nút "Báo lịch diễn" mở drawer, không chiếm nửa màn như bây giờ.
   - Khi đó nghệ sĩ có đúng chỗ để thấy "show của tôi".
3. **Link SoundCloud ở hai chỗ.** "Nghe và theo dõi › SoundCloud" (link trang cá nhân) trong Hồ sơ và "Mix" (link từng set). Trên trang công khai, mục mix tên là "Nghe", còn link trang cá nhân nằm ở "Giới thiệu".
   - **Gộp**: màn "Nhạc" = các link nền tảng ở đầu + danh sách mix bên dưới. Hoặc giữ chỗ cũ nhưng đổi tên khối hồ sơ thành "Mạng xã hội & nền tảng" để không trùng chữ "Nghe".
4. **Nội dung trang nghệ sĩ sửa ở hai nơi.** Mix sửa trong studio; Khoảnh khắc ("Khoảnh khắc 0/9 · Thêm") chỉ sửa ngay trên trang công khai. Số liệu (show sắp tới, người theo dõi) cũng lặp ở đầu Hồ sơ studio và trên trang công khai.
   - **Đề xuất**: studio có mục Khoảnh khắc (hoặc link "Quản lý khoảnh khắc"); bỏ ba số 0 ở studio cho đến khi có dữ liệu.
5. **Hai "hồ sơ".** Menu "Hồ sơ của tôi" là hồ sơ fan (`/profile`, tên "…"), còn hồ sơ nghệ sĩ ở `/a/<slug>` và `/studio/artist`.
   - **Đề xuất**: khi có vai nghệ sĩ, menu hiện "Trang nghệ sĩ" và "Studio" ở trên, đổi "Hồ sơ của tôi" thành "Hồ sơ người tham dự", hoặc lấy nghệ danh làm tên hiển thị.
6. **Thiết bị** là một màn riêng trên rail cho thứ sửa một lần.
   - **Gộp** thành một khối trong Hồ sơ (hoặc một drawer). Rail còn 4 mục: Hồ sơ · Nhạc · Lịch · Booking (+ Tìm gig). Vừa trên điện thoại.

---

## 4. Ngõ cụt và link còn thiếu

- **Ngõ cụt**
  - `/studio/artist` lúc chờ duyệt nhận hồ sơ: chỉ có "Đổi tài khoản" (#1).
  - `/studio/artist` sau khi đóng form tạo nhà tổ chức: "Hồ sơ nghệ sĩ đang tắt" (#4).
  - "Đồng ý trao đổi" và "Đã chốt": không có liên hệ, không có bước tiếp (#6).
  - Lịch đã báo đang duyệt dẫn tới 404 (#11).
  - Studio trên điện thoại: không có lối ra nào ngoài nút back (#2).
  - Thẻ "Đăng nhập để quản lý hồ sơ nghệ sĩ" khi chưa đăng nhập: không có link về site, không có "Chưa có tài khoản?" (`shots/art-14-studio-loggedout.png`).
- **Trạng thái trống không dẫn đi đâu**
  - "Chưa ứng tuyển gig nào": thiếu link "Tìm gig".
  - "Chưa có lời mời nào": thiếu gợi ý bật "Đang nhận booking".
  - "Chưa có gig nào đang mở": không có gì (ví dụ đặt "Lịch trống" để được ghép).
  - "Chưa có dự án nào đang tìm nghệ sĩ": không có link sang `/p`.
- **Link còn thiếu**
  - Tab "Tôi" (`/app/profile`) và `/profile` sang studio hoặc trang nghệ sĩ.
  - Footer, `/a` và menu điện thoại: không có lối vào cho nghệ sĩ mới. Hiện chỉ có sheet chọn vai lúc đăng ký, và mục "Thêm vai nghề" ẩn trong menu avatar.
  - Từ thông báo `/app/notifications` vào studio thì không có đường quay lại app.
  - Gig trong Cơ hội diễn sang sự kiện liên quan (`eventId`) hoặc trang chi tiết.
  - Dòng Dự án ("Đề nghị biểu diễn") sang `/p/<slug>`: sang tới nơi phải chọn lại "Biểu diễn", không biết mình đã đề nghị chưa, và không có đường về studio.
  - Trang sự kiện có tên mình trong lineup: không có gì cho nghệ sĩ (ví dụ "Chia sẻ show", "Thêm mix thu tại đêm này").
  - Lịch đã báo "Chờ BTC thêm tên": không có cách nhắn nhà tổ chức.

---

## 5. Những gì làm tốt

- Sheet chọn vai ngắn, ba lựa chọn rõ. Gõ nghệ danh trùng thì gợi ý luôn "ĐÃ CÓ TRÊN FEESTFINDER? NHẬN QUẢN LÝ", tránh tạo trùng hồ sơ.
- Báo lịch diễn ghép đúng vào sự kiện có sẵn ("Đã gắn vào sự kiện đang có"). Trạng thái tách bạch giữa sự kiện ("Đang đăng" / "Đang duyệt") và lineup ("Có tên bạn" / "Chờ BTC thêm tên").
- Cơ hội diễn có điểm phù hợp không dựa vào follower, phí hiện bằng đơn vị tiền của thành phố, ứng tuyển chỉ cần một bước.
- Hỏi lại trước khi rút hồ sơ: "Rút hồ sơ ứng tuyển này?".
- Thiết bị: tìm trong danh mục nhanh; tên ngoài danh mục có nhãn "Chờ duyệt" rõ ràng.
- Drawer Mix báo lỗi đúng chỗ, nói rõ chấp nhận dịch vụ nào.
- Trang nghệ sĩ công khai đẹp và đúng phong cách Kính đêm, đặc biệt "Diễn nhiều nhất với" lấy từ dữ liệu sự kiện. Nhãn RADAR và tab Đã đăng/Radar trong thư mục rõ.
- "Bật lại hồ sơ nghệ sĩ" giữ nguyên hồ sơ, lịch sử, mix và thiết bị.
