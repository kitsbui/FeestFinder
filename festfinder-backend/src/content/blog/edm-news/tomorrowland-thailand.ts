import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, eventSection, guide, LABEL, PILLAR, UPDATED, type Media, type NewsEvent } from './shared.ts';

type Lang = 'vi' | 'en';

const COVER: Media = {
  url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/83/Pattaya_at_night_by_Don_Ramey_Logan.jpg/1920px-Pattaya_at_night_by_Don_Ramey_Logan.jpg',
  page: 'https://commons.wikimedia.org/wiki/File:Pattaya_at_night_by_Don_Ramey_Logan.jpg',
  author: 'Don Ramey Logan',
  license: 'CC BY-SA 4.0',
};

/** As Tomorrowland announced it (thailand.tomorrowland.com and the line-up article, read 2026-10-22). */
const festival: NewsEvent = {
  name: 'Tomorrowland Thailand 2026',
  tagline: { vi: 'festival Tomorrowland đầu tiên ở châu Á', en: 'Tomorrowland\'s first Asian festival' },
  start: '2026-12-11',
  end: '2026-12-13',
  place: { vi: 'Wisdom Valley, khu Khao Mai Kaew, Pattaya, Thái Lan', en: 'Wisdom Valley, Khao Mai Kaew, Pattaya, Thailand' },
  country: 'TH',
  lineup: ['Martin Garrix', 'Swedish House Mafia', 'Afrojack', 'Alan Walker', 'Steve Aoki', 'Dimitri Vegas & Like Mike', 'Alok', 'Lost Frequencies', 'Aly & Fila', 'Cosmic Gate', 'Ferry Corsten', 'Kevin de Vries', 'Kölsch', 'Lilly Palmer', 'Infected Mushroom', 'Nakadia'],
  tickets: {
    vi: 'Đã bán hết. Full Madness Pass ฿12.500, Full Madness Comfort ฿20.200, Day Pass ฿5.100, Day Comfort ฿8.200',
    en: 'Sold out. Full Madness Pass ฿12,500, Full Madness Comfort ฿20,200, Day Pass ฿5,100, Day Comfort ฿8,200',
  },
  url: 'https://thailand.tomorrowland.com/en/welcome/',
  verified: true,
  why: {
    vi: 'Tomorrowland gọi đây là "festival quy mô đầy đủ đầu tiên của Tomorrowland ở châu Á", và vé đã bán hết. Wisdom Valley rộng 237 mẫu Anh, đón hơn 50.000 người mỗi ngày. Bài công bố lineup hứa hơn 100 nghệ sĩ từ hơn 20 quốc tịch trong ba ngày. Martin Garrix và Swedish House Mafia dẫn đầu, cả hai lần đầu biểu diễn ở Thái Lan. Hơn 20 nghệ sĩ Thái có tên, trong đó có Nakadia, Mike Bond và Botcash.',
    en: 'Tomorrowland calls it "Tomorrowland\'s first full-scale Asian festival", and it is sold out. Wisdom Valley covers 237 acres and holds more than 50,000 people a day. The line-up article promises more than 100 artists from over 20 nationalities across three days. Martin Garrix and Swedish House Mafia headline, both playing Thailand for the first time. More than 20 Thai artists are billed, among them Nakadia, Mike Bond and Botcash.',
  },
};

const g = (slug: string, lang: Lang) => guide(slug, lang);

const vi = `**Tomorrowland Thailand 2026** diễn ra từ 11 đến 13/12/2026 tại Wisdom Valley, Pattaya. Đây là festival Tomorrowland quy mô đầy đủ đầu tiên ở châu Á, và vé đã bán hết. Martin Garrix và Swedish House Mafia dẫn đầu hơn 100 nghệ sĩ, cùng hơn 20 nghệ sĩ Thái. Dưới đây là lineup, giá vé, sân khấu và những gì người đi từ Việt Nam cần biết.

${UPDATED.vi}

## Thông tin nhanh

| Mục | Thông tin |
| --- | --- |
| Ngày | Thứ Sáu 11 – Chủ nhật 13/12/2026 |
| Địa điểm | Wisdom Valley, khu Khao Mai Kaew, Pattaya, Thái Lan |
| Sức chứa | Hơn 50.000 người mỗi ngày, khu đất 237 mẫu Anh |
| Vé | Đã bán hết (theo trang vé chính thức) |
| Trang chính thức | [thailand.tomorrowland.com](https://thailand.tomorrowland.com/en/welcome/) |

${eventSection(festival, 'vi')}

## Lineup: những cái tên đã công bố

${LABEL.fact.vi} Theo bài công bố của Tomorrowland, hai headliner là **Martin Garrix** và **Swedish House Mafia**. Đi cùng họ là những tên tuổi mainstage quen thuộc: Afrojack, Alan Walker, Steve Aoki, Dimitri Vegas & Like Mike, Alok, Lost Frequencies, Laidback Luke, R3HAB và Yellow Claw. Trance có Aly & Fila, Cosmic Gate và Ferry Corsten. Techno có Kevin de Vries, Kölsch và Lilly Palmer. Danh sách còn có Nervo, Netsky và Infected Mushroom.

Phần dành cho chủ nhà là hơn 20 nghệ sĩ Thái: Nakadia, Mike Bond, Botcash, Honey Gee, Lonskii, Yukio, Pixzy, Maysaa, Riviere, Karty, Meltmode và Tiger Drama. Trong những cái tên Tomorrowland nêu ở bài công bố, chưa có nghệ sĩ Việt Nam.

${LABEL.analysis.vi} Lineup nghiêng về [mainstage EDM](${g('mainstage-edm', 'vi')}), đúng với sân khấu chính của Tomorrowland ở Bỉ, nhưng vẫn có chỗ cho [trance](${g('trance', 'vi')}), [techno](${g('techno', 'vi')}) và [psytrance](${g('psytrance', 'vi')}). Nếu bạn mới đi festival lớn lần đầu, bài [cách đọc lineup festival](${g('cach-doc-lineup-festival', 'vi')}) giúp bạn chia ngày và chọn sân khấu.

## Sân khấu và những gì có thể chờ đợi

${LABEL.fact.vi} Trang chào mừng của Tomorrowland Thailand nêu sáu sân khấu, trong đó có MainStage, CORE và Freedom, cộng với những sân khấu thiết kế riêng cho Thái Lan. Bài công bố lineup lại viết "7 sân khấu". Hai trang chính thức chưa thống nhất, nên hãy xem bản đồ festival khi ban tổ chức đăng.

Chủ đề năm 2026 là "Consciencia". Tomorrowland Bỉ dùng chủ đề này cho hai cuối tuần 17–19 và 24–26/7/2026 ở Boom; nó đi tiếp đến Thái Lan và khép lại ở Tomorrowland Brasil vào tháng 4/2027. Người từng xem video sân khấu chính ở Boom có thể đoán được tinh thần chung, nhưng thiết kế sân khấu ở Pattaya chưa được công bố chi tiết.

${LABEL.analysis.vi} CORE là sân khấu của Tomorrowland dành cho house, techno và những set sâu hơn, còn Freedom thường là nơi của các label và showcase. Với ba ngày và nhiều sân khấu, đừng cố xem tất cả: chọn hai hoặc ba set bạn không muốn bỏ lỡ mỗi ngày, rồi để phần còn lại cho bất ngờ.

## Vé: đã bán hết

${LABEL.fact.vi} Trang vé chính thức ghi mọi loại vé đều đã bán hết. Giá niêm yết là ฿12.500 cho Full Madness Pass ba ngày, ฿20.200 cho Full Madness Comfort (VIP), ฿5.100 cho Day Pass và ฿8.200 cho Day Comfort. Phí Treasure Case (hộp đựng vòng tay) là ฿570 nếu gửi trong Thái Lan và ฿1.150 nếu gửi quốc tế; nhận tại chỗ thì miễn phí.

Theo Ravolution Asia (bài ngày 21/3/2026), hơn 330.000 người đã đăng ký trước cho 50.000 vé mỗi ngày. Con số này do một đơn vị tổ chức Việt Nam đưa ra, không phải Tomorrowland.

Nếu chưa có vé, cách chính thức còn lại là cuộc thi Tomorrowland Stories (16/10/2026): hai Full Madness Pass kèm vé máy bay và ba đêm khách sạn, nhận bài đến 4/11/2026, dành cho người từ 20 tuổi. Vé bán lại ngoài kênh của Tomorrowland có rủi ro bị từ chối ở cổng: hãy đọc điều khoản trên trang chính thức trước khi mua.

## Đi từ Việt Nam

- **Tuổi:** các festival ở Thái như S2O ghi tuổi tối thiểu 20 theo luật Thái Lan, và cuộc thi của Tomorrowland cũng chỉ nhận người từ 20 tuổi. Mang hộ chiếu.
- **Đến Pattaya:** Wisdom Valley ở khu Khao Mai Kaew của Pattaya. Hãy xem chỉ dẫn đi lại và gói lưu trú trên trang chính thức trước khi đặt vé máy bay và khách sạn.
- **Giấy tờ:** kiểm tra quy định nhập cảnh Thái Lan và hạn hộ chiếu trước khi đi.
- **Tiền:** giá vé tính bằng baht (฿); chuẩn bị thẻ quốc tế hoặc tiền mặt cho chi tiêu tại chỗ.
- **Tháng 12 ở Thái Lan:** cùng tháng còn có Wonderfruit (3–7/12, Chonburi) và EDC Thailand (18–20/12, Phuket). Lịch đầy đủ ở bài [lịch festival EDM châu Á](${g('lich-festival-edm-chau-a', 'vi')}).

## Tomorrowland đi đâu tiếp theo

| Sự kiện | Ngày | Nơi | Trạng thái |
| --- | --- | --- | --- |
| CORE Melbourne | 28/11/2026 | Flemington Racecourse, Melbourne | Đã bán hết |
| Tomorrowland Thailand | 11–13/12/2026 | Wisdom Valley, Pattaya | Đã bán hết |
| Tomorrowland Winter | 20–27/3/2027 | Alpe d'Huez, Pháp | Đã công bố |
| Tomorrowland Brasil | 30/4 – 2/5/2027 | Parque Maeda, Itu (São Paulo) | Đã mở bán từ 24/9/2026 |

${LABEL.fact.vi} CORE Melbourne là lần đầu CORE đến Úc, "lục địa thứ năm" của sân khấu này, với Mall Grab B2B Effy, Honey Dijon, Moodymann và TSHA. Lịch của Tomorrowland chưa có sự kiện nào ở Việt Nam, và ngày của Tomorrowland Bỉ 2027 chưa có trên các trang chúng tôi đọc.

## Điều này có nghĩa gì với Đông Nam Á

${LABEL.analysis.vi} Trong ba tuần của tháng 12/2026, Đông Nam Á có Wonderfruit, Tomorrowland Thailand, DWP ở Jakarta và EDC Thailand. Việc Tomorrowland chọn Thái Lan cho festival đầy đủ đầu tiên ở châu Á, và bán hết vé, cho thấy khán giả trong vùng sẵn sàng đi xa vì một thương hiệu festival lớn. Với người đi từ Việt Nam, Thái Lan đang là điểm đến festival gần nhất có tầm cỡ quốc tế. Xem thêm [tin tức EDM](${g('tin-tuc-edm', 'vi')}) và [các festival thế giới năm 2026](${g('festival-edm-the-gioi-2026', 'vi')}).

## Đọc tiếp

- [Lịch festival EDM châu Á cuối 2026 và 2027](${g('lich-festival-edm-chau-a', 'vi')})
- [Mainstage EDM là gì?](${g('mainstage-edm', 'vi')})
- [Cách đọc lineup festival như người trong nghề](${g('cach-doc-lineup-festival', 'vi')})
- [Club EDM ở châu Á: cẩm nang 11 thành phố](${g('club-edm-chau-a', 'vi')})`;

const en = `**Tomorrowland Thailand 2026** runs from 11 to 13 December 2026 at Wisdom Valley, Pattaya. It is Tomorrowland's first full-scale festival in Asia, and it is sold out. Martin Garrix and Swedish House Mafia lead more than 100 artists, with more than 20 Thai acts. Here are the line-up, the ticket prices, the stages and what travellers from Vietnam should know.

${UPDATED.en}

## Quick facts

| Detail | Info |
| --- | --- |
| Dates | Friday 11 – Sunday 13 December 2026 |
| Place | Wisdom Valley, Khao Mai Kaew, Pattaya, Thailand |
| Capacity | More than 50,000 people a day on a 237-acre site |
| Tickets | Sold out (per the official ticket page) |
| Official site | [thailand.tomorrowland.com](https://thailand.tomorrowland.com/en/welcome/) |

${eventSection(festival, 'en')}

## Line-up: the names announced so far

${LABEL.fact.en} According to Tomorrowland's announcement, the two headliners are **Martin Garrix** and **Swedish House Mafia**. Around them are familiar mainstage names: Afrojack, Alan Walker, Steve Aoki, Dimitri Vegas & Like Mike, Alok, Lost Frequencies, Laidback Luke, R3HAB and Yellow Claw. Trance comes from Aly & Fila, Cosmic Gate and Ferry Corsten; techno from Kevin de Vries, Kölsch and Lilly Palmer. The bill also includes Nervo, Netsky and Infected Mushroom.

The host country gets more than 20 slots: Nakadia, Mike Bond, Botcash, Honey Gee, Lonskii, Yukio, Pixzy, Maysaa, Riviere, Karty, Meltmode and Tiger Drama. Among the names Tomorrowland lists in its announcement, there is no Vietnamese artist yet.

${LABEL.analysis.en} The bill leans towards [mainstage EDM](${g('mainstage-edm', 'en')}), as the main stage in Belgium does, but it leaves room for [trance](${g('trance', 'en')}), [techno](${g('techno', 'en')}) and [psytrance](${g('psytrance', 'en')}). If this is your first big festival, our guide on [how to read a festival line-up](${g('cach-doc-lineup-festival', 'en')}) helps you split the days and pick your stages.

## Stages and what to expect

${LABEL.fact.en} Tomorrowland Thailand's welcome page lists six stages, including the MainStage, CORE and Freedom, plus stages designed for Thailand. The line-up article says "7 stages". The two official pages do not agree yet, so check the festival map when the organiser publishes it.

The 2026 theme is "Consciencia". Tomorrowland Belgium used it for its two weekends, 17–19 and 24–26 July 2026, in Boom; it travels on to Thailand and closes at Tomorrowland Brasil in April 2027. If you have watched the Boom main stage online you can guess the mood, but the Pattaya stage designs have not been published in detail.

${LABEL.analysis.en} CORE is Tomorrowland's stage for house, techno and deeper sets, while Freedom usually hosts labels and showcases. With three days and several stages, don't try to see everything: pick two or three sets a day you refuse to miss and leave the rest to chance.

## Tickets: sold out

${LABEL.fact.en} The official ticket page shows every pass as sold out. The listed prices were ฿12,500 for the three-day Full Madness Pass, ฿20,200 for Full Madness Comfort (VIP), ฿5,100 for a Day Pass and ฿8,200 for Day Comfort. The Treasure Case fee (the wristband box) is ฿570 for delivery in Thailand and ฿1,150 worldwide; pick-up on site is free.

According to Ravolution Asia (a post dated 21 March 2026), more than 330,000 people pre-registered for 50,000 tickets a day. That figure comes from a Vietnamese promoter, not from Tomorrowland.

If you have no pass, the remaining official route is the Tomorrowland Stories competition (16 October 2026): two Full Madness Passes with flights and three hotel nights, entries until 4 November 2026, open to people aged 20 and over. Passes resold outside Tomorrowland's own channels risk being refused at the gate: read the terms on the official site before buying.

## Travelling from Vietnam

- **Age:** Thai festivals such as S2O set a minimum age of 20 under Thai law, and Tomorrowland's competition only accepts people aged 20 and over. Carry your passport.
- **Getting to Pattaya:** Wisdom Valley is in Pattaya's Khao Mai Kaew area. Read the travel and stay information on the official site before booking flights and a hotel.
- **Papers:** check Thailand's entry rules and your passport's validity before you go.
- **Money:** prices are in baht (฿); bring an international card or cash for spending on site.
- **December in Thailand:** the same month has Wonderfruit (3–7 December, Chonburi) and EDC Thailand (18–20 December, Phuket). The full calendar is in our [Asia EDM festival calendar](${g('lich-festival-edm-chau-a', 'en')}).

## Where Tomorrowland goes next

| Event | Dates | Place | Status |
| --- | --- | --- | --- |
| CORE Melbourne | 28 Nov 2026 | Flemington Racecourse, Melbourne | Sold out |
| Tomorrowland Thailand | 11–13 Dec 2026 | Wisdom Valley, Pattaya | Sold out |
| Tomorrowland Winter | 20–27 Mar 2027 | Alpe d'Huez, France | Announced |
| Tomorrowland Brasil | 30 Apr – 2 May 2027 | Parque Maeda, Itu (São Paulo) | On sale since 24 Sep 2026 |

${LABEL.fact.en} CORE Melbourne is CORE's first Australian edition, the stage's "fifth continent", with Mall Grab B2B Effy, Honey Dijon, Moodymann and TSHA. Tomorrowland's calendar has no event in Vietnam, and Tomorrowland Belgium's 2027 dates were not on the pages we read.

## What it means for Southeast Asia

${LABEL.analysis.en} Within three weeks of December 2026, Southeast Asia hosts Wonderfruit, Tomorrowland Thailand, DWP in Jakarta and EDC Thailand. Tomorrowland choosing Thailand for its first full-scale Asian festival, and selling it out, shows that audiences in the region will travel for a major festival brand. For people in Vietnam, Thailand is now the nearest festival destination of international scale. See also our [EDM news](${g('tin-tuc-edm', 'en')}) and [the world's festivals in 2026](${g('festival-edm-the-gioi-2026', 'en')}).

## Read next

- [The Asia EDM festival calendar for late 2026 and 2027](${g('lich-festival-edm-chau-a', 'en')})
- [What is mainstage EDM?](${g('mainstage-edm', 'en')})
- [How to read a festival line-up like an insider](${g('cach-doc-lineup-festival', 'en')})
- [EDM clubs in Asia: the 11-city guide](${g('club-edm-chau-a', 'en')})`;

/** Event coverage (handoff Template B): the festival, its line-up so far, its passes and the trip from Vietnam. */
export const tomorrowlandThailand: PackPost = {
  key: 'edm-news/tomorrowland-thailand-2026',
  slug: 'tomorrowland-thailand-2026',
  category: 'news',
  lang: 'vi',
  parent: PILLAR,
  title: {
    vi: 'Tomorrowland Thailand 2026: ngày, lineup, vé và cách đi',
    en: 'Tomorrowland Thailand 2026: dates, line-up, tickets, travel',
  },
  excerpt: {
    vi: 'Tomorrowland Thailand 2026 diễn ra 11–13/12 tại Wisdom Valley, Pattaya, đã bán hết vé. Lineup với Martin Garrix, Swedish House Mafia, giá vé và cách đi từ Việt Nam.',
    en: 'Tomorrowland Thailand 2026 runs 11–13 December at Wisdom Valley, Pattaya, and is sold out. The line-up led by Martin Garrix, the pass prices and the trip from Vietnam.',
  },
  body: { vi, en },
  cover: coverOf(COVER),
  styles: ['mainstage', 'edm', 'techno', 'trance', 'psytrance'],
  facts: [
    { label: { vi: 'Ngày', en: 'Dates' }, value: { vi: '11–13/12/2026', en: '11–13 December 2026' } },
    { label: { vi: 'Địa điểm', en: 'Place' }, value: { vi: 'Wisdom Valley, Pattaya, Thái Lan', en: 'Wisdom Valley, Pattaya, Thailand' } },
    { label: { vi: 'Headliner', en: 'Headliners' }, value: { vi: 'Martin Garrix, Swedish House Mafia', en: 'Martin Garrix, Swedish House Mafia' } },
    { label: { vi: 'Quy mô', en: 'Scale' }, value: { vi: 'Hơn 100 nghệ sĩ, hơn 50.000 người mỗi ngày', en: '100+ artists, 50,000+ people a day' } },
    { label: { vi: 'Vé', en: 'Tickets' }, value: { vi: 'Đã bán hết; Full Madness Pass ฿12.500', en: 'Sold out; Full Madness Pass ฿12,500' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Tomorrowland Thailand 2026 diễn ra khi nào và ở đâu?', en: 'When and where is Tomorrowland Thailand 2026?' }, a: { vi: 'Từ 11 đến 13/12/2026 tại Wisdom Valley, khu Khao Mai Kaew của Pattaya, Thái Lan.', en: 'From 11 to 13 December 2026 at Wisdom Valley, in the Khao Mai Kaew area of Pattaya, Thailand.' } },
    { q: { vi: 'Còn vé Tomorrowland Thailand không?', en: 'Are Tomorrowland Thailand tickets still available?' }, a: { vi: 'Không. Trang vé chính thức ghi mọi loại vé đã bán hết. Cách chính thức còn lại là cuộc thi Tomorrowland Stories, nhận bài đến 4/11/2026, cho người từ 20 tuổi.', en: 'No. The official ticket page shows every pass as sold out. The remaining official route is the Tomorrowland Stories competition, open until 4 November 2026 to people aged 20 and over.' } },
    { q: { vi: 'Ai là headliner của Tomorrowland Thailand?', en: 'Who headlines Tomorrowland Thailand?' }, a: { vi: 'Martin Garrix và Swedish House Mafia, cả hai lần đầu biểu diễn ở Thái Lan, cùng Afrojack, Alan Walker, Steve Aoki và Dimitri Vegas & Like Mike.', en: 'Martin Garrix and Swedish House Mafia, both playing Thailand for the first time, with Afrojack, Alan Walker, Steve Aoki and Dimitri Vegas & Like Mike.' } },
    { q: { vi: 'Lineup có nghệ sĩ châu Á không?', en: 'Are there Asian artists on the line-up?' }, a: { vi: 'Có hơn 20 nghệ sĩ Thái, trong đó có Nakadia, Mike Bond và Botcash. Trong những cái tên Tomorrowland đã nêu, chưa có nghệ sĩ Việt Nam.', en: 'More than 20 Thai artists, including Nakadia, Mike Bond and Botcash. Among the names Tomorrowland has listed, there is no Vietnamese artist yet.' } },
    { q: { vi: 'Có Tomorrowland ở Việt Nam không?', en: 'Is there a Tomorrowland in Vietnam?' }, a: { vi: 'Chưa. Lịch của Tomorrowland (tháng 10/2026) không có sự kiện nào ở Việt Nam; gần nhất là Tomorrowland Thailand ở Pattaya.', en: 'Not yet. Tomorrowland\'s calendar (October 2026) lists no event in Vietnam; the nearest is Tomorrowland Thailand in Pattaya.' } },
    { q: { vi: 'Tomorrowland Thailand có bao nhiêu sân khấu?', en: 'How many stages does Tomorrowland Thailand have?' }, a: { vi: 'Trang chào mừng nêu sáu sân khấu (có MainStage, CORE và Freedom), còn bài công bố lineup viết bảy. Hãy xem bản đồ festival khi được công bố.', en: 'The welcome page lists six (including the MainStage, CORE and Freedom), while the line-up article says seven. Check the festival map when it is published.' } },
  ],
  sources: [
    { title: 'Welcome to Tomorrowland Thailand', url: 'https://thailand.tomorrowland.com/en/welcome/', publisher: 'Tomorrowland' },
    { title: 'Tomorrowland Thailand 2026 line-up', url: 'https://www.tomorrowland.com/article/tomorrowland-thailand-2026-line-up-new/', publisher: 'Tomorrowland' },
    { title: 'Festival passes', url: 'https://thailand.tomorrowland.com/en/tickets/festival-passes/', publisher: 'Tomorrowland' },
    { title: 'CORE Melbourne 2026: tickets available', url: 'https://www.tomorrowland.com/article/core-melbourne-2026-tickets-available/', publisher: 'Tomorrowland' },
    { title: 'Tomorrowland Brasil 2027: all you need to know', url: 'https://www.tomorrowland.com/article/tomorrowland-brasil-2027-all-you-need-to-know/', publisher: 'Tomorrowland' },
    { title: 'Win a trip to Tomorrowland Thailand', url: 'https://stories.tomorrowland.com/news/thailandcompetitiontloc', publisher: 'Tomorrowland' },
    { title: 'Tomorrowland Thailand cháy vé: cú hích cho thị trường EDM Đông Nam Á', url: 'https://www.ravolution.asia/post/tomorrowland-thailand-ch%C3%A1y-v%C3%A9-c%C3%BA-h%C3%ADch-cho-th%E1%BB%8B-tr%C6%B0%E1%BB%9Dng-edm-%C4%91%C3%B4ng-nam-%C3%A1-v%C3%A0-th%C3%B4ng-%C4%91i%E1%BB%87p-h%C3%B2a-b%C3%ACnh-t%E1%BB%AB-l%E1%BB%85', publisher: 'Ravolution Asia' },
    { title: 'S2O FAQ: age and entry', url: 'https://www.s2ofestival.com/faq', publisher: 'S2O Songkran Music Festival' },
  ],
  tracks: [],
};
