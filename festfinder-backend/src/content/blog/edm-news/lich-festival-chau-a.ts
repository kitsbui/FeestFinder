import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, eventSection, guide, LABEL, PILLAR, UPDATED, type Media, type NewsEvent } from './shared.ts';

type Lang = 'vi' | 'en';

const COVER: Media = {
  url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b1/Sunset_Wonderfruit_2015.jpg/1920px-Sunset_Wonderfruit_2015.jpg',
  page: 'https://commons.wikimedia.org/wiki/File:Sunset_Wonderfruit_2015.jpg',
  author: 'Sdegennaro',
  license: 'CC BY-SA 4.0',
};

/** Every date as the organiser's own page gave it on 2026-10-22. */
const EVENTS: NewsEvent[] = [
  {
    name: 'Ultra Taiwan 2026',
    tagline: { vi: 'Ultra duy nhất còn lại ở châu Á năm nay', en: 'the last Ultra in Asia this year' },
    start: '2026-11-14',
    place: { vi: 'Dajia Riverside Park, Đài Bắc, Đài Loan', en: 'Dajia Riverside Park, Taipei, Taiwan' },
    country: 'TW',
    lineup: [],
    tickets: { vi: 'Xem trang của Ultra; giá chưa có trên lịch chúng tôi đọc', en: 'See Ultra\'s page; prices were not on the calendar we read' },
    url: 'https://umfworldwide.com/',
    verified: true,
    why: {
      vi: 'Lịch của Ultra Worldwide ghi Ultra Taiwan vào ngày 14/11/2026 tại Dajia Riverside Park, Đài Bắc. Sau Ultra Japan tháng 9, đây là sự kiện Ultra duy nhất ở châu Á có ngày cụ thể trên lịch: Ultra Korea, Hong Kong, Singapore, Bali, China và Road to Ultra Thái Lan, Philippines vẫn chưa có ngày. Lineup chưa có trong những trang chúng tôi đọc, nên hãy theo dõi trang chính thức.',
      en: 'Ultra Worldwide\'s calendar lists Ultra Taiwan on 14 November 2026 at Dajia Riverside Park, Taipei. After Ultra Japan in September, it is the only Ultra event in Asia with a date on the calendar: Ultra Korea, Hong Kong, Singapore, Bali, China and Road to Ultra Thailand and Philippines have none yet. The line-up was not on the pages we read, so follow the official page.',
    },
  },
  {
    name: 'Wonderfruit 2026',
    tagline: { vi: 'năm ngày âm nhạc và nghệ thuật ở Chonburi', en: 'five days of music and art in Chonburi' },
    start: '2026-12-03',
    end: '2026-12-07',
    place: { vi: 'The Fields at Siam Country Club, Chonburi, Thái Lan', en: 'The Fields at Siam Country Club, Chonburi, Thailand' },
    country: 'TH',
    lineup: [],
    tickets: {
      vi: 'Đợt tiếp theo 3–9/11/2026 qua danh sách chờ (đóng 2/11): 5-Day Full Pass ฿12.900, Weekend Pass ฿11.500, Sunday Pass ฿5.000',
      en: 'Next phase 3–9 November 2026 by waitlist (closes 2 November): 5-Day Full Pass ฿12,900, Weekend Pass ฿11,500, Sunday Pass ฿5,000',
    },
    url: 'https://wonderfruit.co/',
    verified: true,
    why: {
      vi: 'Wonderfruit diễn ra từ 3 đến 7/12/2026 tại The Fields at Siam Country Club, Chonburi. Hai đợt vé tháng 9 và tháng 10 đã bán hết; đợt tiếp theo mở 3–9/11 qua danh sách chờ, đóng ngày 2/11, với số lượng giới hạn và tối đa bốn vé mỗi người. Giá tại cổng cao hơn nhiều: 5-Day Full Pass là ฿20.000. Có vé Teen (13–19 tuổi), vé Intro cho người lần đầu đến và cả vé cho chó. Lineup 2026 chưa được công bố.',
      en: 'Wonderfruit runs from 3 to 7 December 2026 at The Fields at Siam Country Club, Chonburi. The September and October phases sold out; the next opens on 3–9 November by waitlist, which closes on 2 November, with limited capacity and four tickets per person at most. Door prices are much higher: ฿20,000 for the 5-Day Full Pass. There are Teen passes (13–19), Intro passes for first-timers and even a Dog Pass. The 2026 line-up has not been announced.',
    },
  },
  {
    name: 'Tomorrowland Thailand 2026',
    tagline: { vi: 'Tomorrowland đầu tiên ở châu Á, đã bán hết', en: 'Asia\'s first Tomorrowland, sold out' },
    start: '2026-12-11',
    end: '2026-12-13',
    place: { vi: 'Wisdom Valley, Pattaya, Thái Lan', en: 'Wisdom Valley, Pattaya, Thailand' },
    country: 'TH',
    lineup: ['Martin Garrix', 'Swedish House Mafia', 'Afrojack', 'Alan Walker', 'Steve Aoki', 'Aly & Fila', 'Lilly Palmer'],
    tickets: { vi: 'Đã bán hết', en: 'Sold out' },
    url: 'https://thailand.tomorrowland.com/en/welcome/',
    verified: true,
    why: {
      vi: 'Festival Tomorrowland quy mô đầy đủ đầu tiên ở châu Á: hơn 100 nghệ sĩ trên khu đất 237 mẫu Anh, hơn 50.000 người mỗi ngày, Martin Garrix và Swedish House Mafia dẫn đầu cùng hơn 20 nghệ sĩ Thái. Mọi loại vé đã bán hết. Chi tiết lineup, giá vé và cách đi từ Việt Nam ở bài riêng về Tomorrowland Thailand 2026.',
      en: 'Tomorrowland\'s first full-scale festival in Asia: more than 100 artists on a 237-acre site, more than 50,000 people a day, Martin Garrix and Swedish House Mafia at the top with more than 20 Thai artists. Every pass is sold out. The line-up, prices and the trip from Vietnam are in our Tomorrowland Thailand 2026 article.',
    },
  },
  {
    name: 'DWP26',
    tagline: { vi: 'Djakarta Warehouse Project ở Jakarta', en: 'Djakarta Warehouse Project in Jakarta' },
    start: '2026-12-11',
    end: '2026-12-13',
    place: { vi: 'Jakarta, Indonesia (địa điểm chưa được nêu tên)', en: 'Jakarta, Indonesia (venue not yet named)' },
    country: 'ID',
    lineup: ['Afrojack', 'Alok', 'Axwell B2B Sebastian Ingrosso', 'Cosmic Gate', 'Dimension', 'Dimitri Vegas', 'Eli & Fur', 'Lilly Palmer', 'Maddix', 'R3hab'],
    tickets: {
      vi: 'Vé ba ngày từ IDR 1.700K (GA vào sớm trước 18:00), GA presale IDR 1.900K, VIP presale IDR 3.900K; từ 18 tuổi, không hoàn vé',
      en: '3-day passes from IDR 1,700K (GA early entry before 18:00), GA presale IDR 1,900K, VIP presale IDR 3,900K; 18+, no refunds',
    },
    url: 'https://dwpfest.com/',
    verified: true,
    why: {
      vi: 'DWP26 diễn ra ba ngày 11–13/12/2026 ở Jakarta, trùng cuối tuần với Tomorrowland Thailand. Những cái tên đầu tiên có Axwell B2B Sebastian Ingrosso, Afrojack, Alok, Dimitri Vegas, Cosmic Gate và Eli & Fur. Trang chính thức chưa nêu tên địa điểm; các gói khách sạn đều ở khu Kemayoran. Người tham dự phải từ 18 tuổi (21 tuổi để mua rượu), tối đa tám vé mỗi người, và vé không hoàn lại.',
      en: 'DWP26 runs for three days, 11–13 December 2026, in Jakarta, on the same weekend as Tomorrowland Thailand. The first names include Axwell B2B Sebastian Ingrosso, Afrojack, Alok, Dimitri Vegas, Cosmic Gate and Eli & Fur. The official site does not name the venue yet; its hotel packages are all in Kemayoran. Attendees must be 18 or over (21 to buy alcohol), with eight tickets per person at most and no refunds.',
    },
  },
  {
    name: 'EDC Thailand 2026',
    tagline: { vi: 'EDC chuyển về Phuket', en: 'EDC moves to Phuket' },
    start: '2026-12-18',
    end: '2026-12-20',
    place: { vi: 'Rhythm Park, Phuket, Thái Lan', en: 'Rhythm Park, Phuket, Thailand' },
    country: 'TH',
    lineup: ['Martin Garrix', 'Tiësto', 'DJ Snake', 'Charlotte de Witte', 'Above & Beyond', 'CamelPhat', 'Dom Dolla', 'Kaskade', 'Paul van Dyk', 'Steve Angello', 'Subtronics', 'Da Tweekaz'],
    tickets: {
      vi: 'Đang bán: GA ba ngày ฿10.490, VIP ba ngày ฿16.490, GA một ngày ฿4.700, VIP một ngày ฿7.700',
      en: 'On sale: 3-day GA ฿10,490, 3-day VIP ฿16,490, 1-day GA ฿4,700, 1-day VIP ฿7,700',
    },
    url: 'https://thailand.edc.com/',
    verified: true,
    why: {
      vi: 'Insomniac đưa EDC Thailand về Rhythm Park ở Phuket, ba ngày 18–20/12/2026, với tiệc mở màn trên bãi biển ngày 17/12 tại XANA Beach Club (Mau P, Loco Dice). Lineup khoảng 100 cái tên trải từ mainstage (Martin Garrix, Tiësto, DJ Snake) đến techno (Charlotte de Witte, VTSS, I Hate Models), trance (Above & Beyond, Paul van Dyk) và hardstyle (Coone, Da Tweekaz, Showtek với set hardstyle). Vé đang bán, giá rẻ hơn khi mua sớm.',
      en: 'Insomniac takes EDC Thailand to Rhythm Park in Phuket for three days, 18–20 December 2026, with a beach pre-party on 17 December at XANA Beach Club (Mau P, Loco Dice). The bill of about 100 names runs from mainstage (Martin Garrix, Tiësto, DJ Snake) to techno (Charlotte de Witte, VTSS, I Hate Models), trance (Above & Beyond, Paul van Dyk) and hardstyle (Coone, Da Tweekaz, Showtek with a hardstyle set). Tickets are on sale and cheaper the earlier you buy.',
    },
  },
  {
    name: 'Sunburn Festival 2026',
    tagline: { vi: 'Sunburn rời Goa, đến Mumbai', en: 'Sunburn leaves Goa for Mumbai' },
    start: '2026-12-18',
    end: '2026-12-19',
    place: { vi: 'Mahalaxmi Racecourse, Mumbai, Ấn Độ', en: 'Mahalaxmi Racecourse, Mumbai, India' },
    country: 'IN',
    lineup: [],
    tickets: { vi: 'Chưa công bố', en: 'Not announced' },
    url: 'https://sunburn.in/the-19th-edition-of-sunburn-festival-moves-to-mahalaxmi-racecourse-with-a-reimagined-two-day-format/',
    verified: true,
    why: {
      vi: 'Lần thứ 19 của Sunburn Festival rời Goa đến Mahalaxmi Racecourse ở Mumbai, ngày 18–19/12/2026, theo "định dạng hai ngày làm mới", với tiệc bế mạc ngày 20/12 tại NSCI Dome. Chủ đề là "Awaken the Core". Khi công bố (26/5/2026), lineup và vé vẫn ghi "TBA". Sunburn dẫn khảo sát năm 2025: gần một nửa khán giả đến từ ngoài Mumbai.',
      en: 'The 19th Sunburn Festival leaves Goa for Mahalaxmi Racecourse in Mumbai on 18–19 December 2026, in a "reimagined two-day format", with a closing party on 20 December at NSCI Dome. The theme is "Awaken the Core". At the announcement (26 May 2026), the line-up and tickets still read "TBA". Sunburn cites a 2025 survey in which close to half the audience travelled from outside Mumbai.',
    },
  },
  {
    name: 'Ultra Japan 2027',
    tagline: { vi: 'đã mở bán vé đợt đầu', en: 'Tier 1 tickets on sale' },
    start: '2027-09-18',
    end: '2027-09-19',
    place: { vi: 'Tokyo, Nhật Bản (địa điểm 2027 chưa ghi; năm 2026 là Odaiba Ultra Park)', en: 'Tokyo, Japan (2027 venue not stated; 2026 was Odaiba Ultra Park)' },
    country: 'JP',
    lineup: [],
    tickets: {
      vi: 'Tier 1 hai ngày: GA ¥27.000, U-23 ¥15.000, PGA ¥43.000',
      en: 'Tier 1 two-day: GA ¥27,000, U-23 ¥15,000, PGA ¥43,000',
    },
    url: 'https://ultrajapan.com/tickets',
    verified: false,
    why: {
      vi: 'Trang vé của Ultra Japan đã bán vé Tier 1 cho ngày 18–19/9/2027: GA ¥27.000, U-23 ¥15.000 (chỉ dành cho người dưới 23 tuổi) và PGA ¥43.000 với lối vào ưu tiên. Trang chưa ghi địa điểm năm 2027, và phần cuối trang vẫn nhắc sự kiện 2026 ở Odaiba, nên chúng tôi để mục này là "cần kiểm tra" cho đến khi ban tổ chức xác nhận nơi tổ chức.',
      en: 'Ultra Japan\'s ticket page already sells Tier 1 passes for 18–19 September 2027: GA ¥27,000, U-23 ¥15,000 (under 23 only) and PGA ¥43,000 with front-of-line access. The page does not state the 2027 venue, and its footer still names the 2026 event at Odaiba, so we mark this one "to be checked" until the organiser confirms where it will be.',
    },
  },
];

const g = (slug: string, lang: Lang) => guide(slug, lang);
const sections = (lang: Lang) => EVENTS.map((e) => eventSection(e, lang)).join('\n\n');

const vi = `**Lịch festival EDM châu Á** từ cuối 2026 đến 2027 dồn vào tháng 12: Wonderfruit (3–7/12), Tomorrowland Thailand và DWP26 (11–13/12), EDC Thailand và Sunburn ở Mumbai (18–20/12). Trước đó có Ultra Taiwan ngày 14/11; Ultra Japan 2027 đã mở bán cho 18–19/9/2027. Mọi ngày dưới đây lấy từ trang của ban tổ chức.

${UPDATED.vi}

## Lịch sắp tới

| Ngày | Festival | Thành phố | Vé |
| --- | --- | --- | --- |
| 14/11/2026 | Ultra Taiwan | Đài Bắc | Xem trang chính thức |
| 3–7/12/2026 | Wonderfruit | Chonburi | Đợt mới 3–9/11, qua danh sách chờ |
| 11–13/12/2026 | [Tomorrowland Thailand](${g('tomorrowland-thailand-2026', 'vi')}) | Pattaya | Đã bán hết |
| 11–13/12/2026 | DWP26 | Jakarta | Đang bán, từ IDR 1.700K |
| Tuần thứ ba của tháng 12 | HOZO | TP.HCM | Chưa công bố ngày 2026 |
| 18–20/12/2026 | EDC Thailand | Phuket | Đang bán, từ ฿4.700 một ngày |
| 18–19/12/2026 | Sunburn Festival | Mumbai | Chưa công bố |
| 18–19/9/2027 | Ultra Japan | Tokyo | Tier 1 đang bán |

${LABEL.analysis.vi} Tháng 12/2026 là tháng dày đặc của festival EDM ở Đông Nam Á: bốn sự kiện lớn trong ba tuần, ba trong số đó ở Thái Lan. Martin Garrix chơi cả Tomorrowland Thailand lẫn EDC Thailand, cách nhau một tuần. Với người đi từ Việt Nam, một chuyến Thái Lan tháng 12 có thể ghép hai festival.

${sections('vi')}

## Đã diễn ra trong năm 2026

| Ngày | Festival | Nơi | Ghi chú |
| --- | --- | --- | --- |
| Tháng 4/2026 | S2O Songkran Music Festival | S2O LAND, Bangkok | Ba ngày ở địa điểm cố định mới; K2O ra mắt ngày 14/4 |
| 13/6/2026 | Ravolution 10 Years × A State of Trance | Vạn Phúc City, TP.HCM | Armin van Buuren, điểm dừng Đông Nam Á duy nhất của tour ASOT 25 năm |
| 13–14/6/2026 | S2O Taiwan | Dajia Riverside Park, Đài Bắc | |
| 11–12/7/2026 | S2O Korea | Seoul Land | |
| 19–20/9/2026 | Ultra Japan | Odaiba Ultra Park, Tokyo | Alan Walker, Alesso, Peggy Gou, Sara Landry |
| 2–3/10/2026 | 808 Festival | BITEC Bangna, Bangkok | Adam Beyer B2B Chris Avantgarde, Illenium, W&W |
| 3–4/10/2026 | EDC Korea | Inspire, Incheon | Chuyển từ tháng 4 sang tháng 10 |

${LABEL.fact.vi} 808 Festival là festival của Bangkok, tổ chức từ năm 2013; năm 2026 diễn ra ngày 2–3/10 tại BITEC. Chúng tôi không tìm thấy trang nào về một "808 Festival" ở TP.HCM vào tháng 12.

## Chưa có ngày: đừng tin tin đồn

Những festival sau chưa có ngày nào cho cuối 2026 hay 2027 trên trang của ban tổ chức (kiểm tra ngày 22/10/2026). Chúng tôi sẽ cập nhật khi có công bố chính thức.

- **Ultra Korea:** lần gần nhất là ngày 20/9/2025 ở Oil Tank Culture Park, Seoul. Lịch của Ultra Worldwide ghi Ultra Korea không kèm ngày. Không có nghĩa là đã huỷ: chỉ là chưa công bố.
- **Road to Ultra Thái Lan và Philippines, Ultra Singapore, Hong Kong, Bali, China:** có tên trên lịch của Ultra nhưng chưa có ngày.
- **It's The Ship:** trang của festival trên biển này không truy cập được khi chúng tôi kiểm tra; đơn vị đứng sau, Livescape, đã ký hợp tác chiến lược với Ravolution Asia năm 2026.
- **ZoukOut:** trang của Zouk Group chỉ liệt kê đến bản 2023 trên bãi Siloso, Sentosa.
- **EDC China:** lần gần nhất là 22–23/3/2025 ở Yang Cheng Lake, Tô Châu.
- **Creamfields Hong Kong, Đài Loan, Thành Đô:** trang chính của Creamfields không còn liệt kê. Ravolution Asia giới thiệu "CreamFields Viet Nam" là một thương hiệu của mình nhưng chưa nêu ngày hay địa điểm.
- **World DJ Festival:** nay là sự kiện đường phố nhỏ ở Hongdae, Seoul; lần gần nhất là 18/10/2025.

## Việt Nam: Ravolution, HOZO, Monsoon, Epizode

${LABEL.fact.vi} Sự kiện EDM lớn nhất Việt Nam năm 2026 là Ravolution 10 Years × A State of Trance ngày 13/6 tại Vạn Phúc City, TP.HCM, với Armin van Buuren, Cosmic Gate, Ferry Corsten và Ruben de Ronde; vé GA là 1.799.000 ₫. Ravolution chưa công bố bản tháng 12/2026.

HOZO, lễ hội âm nhạc quốc tế của TP.HCM, theo lời tổng đạo diễn Huy Tuấn với Tuổi Trẻ, được tổ chức cố định vào tuần thứ ba của tháng 12, kéo dài 3–5 ngày; ngày cụ thể của năm 2026 chưa được công bố. HOZO là lễ hội đa thể loại, không riêng EDM. Monsoon Music Festival ở Hà Nội chưa có bản nào kể từ năm 2023. Về Epizode ở Phú Quốc, chúng tôi chưa xác minh được thông tin nào cho 2026–2027: các trang của festival đều không hoạt động.

${LABEL.analysis.vi} Lịch của Tomorrowland và Ultra Worldwide hiện chưa có sự kiện nào ở Việt Nam. Bối cảnh trong nước có ở bài [EDM Việt Nam 2026](${g('edm-viet-nam-2026', 'vi')}) và [quy định nightlife ở Việt Nam](${g('quy-dinh-nightlife-viet-nam', 'vi')}).

## Mẹo khi lên kế hoạch

- **Tuổi:** Thái Lan giới hạn 20 tuổi (S2O, 808), DWP ở Jakarta 18 tuổi, Ultra Japan 18 tuổi. Mang hộ chiếu.
- **Mua sớm:** EDC Thailand và DWP rẻ hơn khi mua ở đợt đầu; Wonderfruit bán qua danh sách chờ.
- **Chỉ mua qua kênh chính thức:** DWP ghi rõ không hoàn vé, và Tomorrowland Thailand đã hết vé từ kênh chính thức.
- **Đọc lineup theo ngày:** xem [cách đọc lineup festival](${g('cach-doc-lineup-festival', 'vi')}) trước khi chọn ngày.

## Đọc tiếp

- [Tomorrowland Thailand 2026: ngày, lineup, vé và cách đi](${g('tomorrowland-thailand-2026', 'vi')})
- [Festival EDM thế giới năm 2026](${g('festival-edm-the-gioi-2026', 'vi')})
- [Dự báo EDM 2026–2030](${g('du-bao-edm-2026-2030', 'vi')})
- [Mainstage EDM là gì?](${g('mainstage-edm', 'vi')}) · [Techno là gì?](${g('techno', 'vi')}) · [Hardstyle là gì?](${g('hardstyle', 'vi')})
- [Tin tức EDM](${g('tin-tuc-edm', 'vi')})`;

const en = `**The Asia EDM festival calendar** for late 2026 and 2027 piles up in December: Wonderfruit (3–7 December), Tomorrowland Thailand and DWP26 (11–13 December), EDC Thailand and Sunburn in Mumbai (18–20 December). Before that comes Ultra Taiwan on 14 November; Ultra Japan 2027 is on sale for 18–19 September 2027. Every date here comes from the organiser's own page.

${UPDATED.en}

## Coming up

| Dates | Festival | City | Tickets |
| --- | --- | --- | --- |
| 14 Nov 2026 | Ultra Taiwan | Taipei | See the official page |
| 3–7 Dec 2026 | Wonderfruit | Chonburi | New phase 3–9 Nov, by waitlist |
| 11–13 Dec 2026 | [Tomorrowland Thailand](${g('tomorrowland-thailand-2026', 'en')}) | Pattaya | Sold out |
| 11–13 Dec 2026 | DWP26 | Jakarta | On sale, from IDR 1,700K |
| Third week of December | HOZO | Ho Chi Minh City | 2026 dates not announced |
| 18–20 Dec 2026 | EDC Thailand | Phuket | On sale, from ฿4,700 a day |
| 18–19 Dec 2026 | Sunburn Festival | Mumbai | Not announced |
| 18–19 Sep 2027 | Ultra Japan | Tokyo | Tier 1 on sale |

${LABEL.analysis.en} December 2026 is a crowded month for Southeast Asia's EDM festivals: four big events in three weeks, three of them in Thailand. Martin Garrix plays both Tomorrowland Thailand and EDC Thailand, a week apart. For people travelling from Vietnam, one December trip to Thailand can take in two festivals.

${sections('en')}

## Already happened in 2026

| Dates | Festival | Place | Notes |
| --- | --- | --- | --- |
| April 2026 | S2O Songkran Music Festival | S2O LAND, Bangkok | Three days at a new permanent venue; K2O debuted on 14 April |
| 13 Jun 2026 | Ravolution 10 Years × A State of Trance | Vạn Phúc City, Ho Chi Minh City | Armin van Buuren, the ASOT 25 Years tour's only Southeast Asian stop |
| 13–14 Jun 2026 | S2O Taiwan | Dajia Riverside Park, Taipei | |
| 11–12 Jul 2026 | S2O Korea | Seoul Land | |
| 19–20 Sep 2026 | Ultra Japan | Odaiba Ultra Park, Tokyo | Alan Walker, Alesso, Peggy Gou, Sara Landry |
| 2–3 Oct 2026 | 808 Festival | BITEC Bangna, Bangkok | Adam Beyer B2B Chris Avantgarde, Illenium, W&W |
| 3–4 Oct 2026 | EDC Korea | Inspire, Incheon | Moved from April to October |

${LABEL.fact.en} 808 Festival is a Bangkok festival, running since 2013; its 2026 edition was on 2–3 October at BITEC. We found no page for an "808 Festival" in Ho Chi Minh City in December.

## No dates yet: don't trust the rumours

The festivals below have no date for late 2026 or 2027 on their organisers' pages (checked on 22 October 2026). We will update this page when they announce.

- **Ultra Korea:** the last edition was on 20 September 2025 at Oil Tank Culture Park, Seoul. Ultra Worldwide's calendar lists Ultra Korea with no date. That does not mean it was cancelled: only that nothing is announced.
- **Road to Ultra Thailand and Philippines, Ultra Singapore, Hong Kong, Bali, China:** named on Ultra's calendar, with no dates.
- **It's The Ship:** the festival-at-sea's site could not be reached when we checked; the company behind it, Livescape, signed a strategic partnership with Ravolution Asia in 2026.
- **ZoukOut:** Zouk Group's page lists editions up to 2023 on Siloso Beach, Sentosa.
- **EDC China:** the last edition was on 22–23 March 2025 at Yang Cheng Lake, Suzhou.
- **Creamfields Hong Kong, Taiwan, Chengdu:** no longer listed on Creamfields' main site. Ravolution Asia presents "CreamFields Viet Nam" as one of its brands but gives no date or venue.
- **World DJ Festival:** now a small street event in Hongdae, Seoul; the last one was on 18 October 2025.

## Vietnam: Ravolution, HOZO, Monsoon, Epizode

${LABEL.fact.en} Vietnam's biggest EDM event of 2026 was Ravolution 10 Years × A State of Trance on 13 June at Vạn Phúc City, Ho Chi Minh City, with Armin van Buuren, Cosmic Gate, Ferry Corsten and Ruben de Ronde; general admission was 1,799,000 ₫. Ravolution has not announced a December 2026 edition.

HOZO, Ho Chi Minh City's international music festival, is held at a fixed time, the third week of December, over 3–5 days, according to its general director Huy Tuấn speaking to Tuổi Trẻ; the 2026 dates have not been announced. HOZO is a multi-genre festival, not an EDM one. Hanoi's Monsoon Music Festival has had no edition since 2023. For Epizode on Phú Quốc, we could verify nothing for 2026–2027: the festival's sites are all down.

${LABEL.analysis.en} Neither Tomorrowland's nor Ultra Worldwide's calendar lists an event in Vietnam yet. The local picture is in our articles on [Vietnam's EDM scene in 2026](${g('edm-viet-nam-2026', 'en')}) and [Vietnam's nightlife rules](${g('quy-dinh-nightlife-viet-nam', 'en')}).

## Planning tips

- **Age:** Thailand sets 20 (S2O, 808), DWP in Jakarta 18, Ultra Japan 18. Carry your passport.
- **Buy early:** EDC Thailand and DWP cost less in the first phases; Wonderfruit sells by waitlist.
- **Only buy through official channels:** DWP states there are no refunds, and Tomorrowland Thailand is sold out through its own channels.
- **Read the line-up by day:** see [how to read a festival line-up](${g('cach-doc-lineup-festival', 'en')}) before picking your days.

## Read next

- [Tomorrowland Thailand 2026: dates, line-up, tickets, travel](${g('tomorrowland-thailand-2026', 'en')})
- [The world's EDM festivals in 2026](${g('festival-edm-the-gioi-2026', 'en')})
- [EDM forecast 2026–2030](${g('du-bao-edm-2026-2030', 'en')})
- [What is mainstage EDM?](${g('mainstage-edm', 'en')}) · [What is techno?](${g('techno', 'en')}) · [What is hardstyle?](${g('hardstyle', 'en')})
- [EDM news](${g('tin-tuc-edm', 'en')})`;

/** Event coverage (handoff Template B) for the whole region: what is coming, what has been, what has no date yet. */
export const lichFestivalChauA: PackPost = {
  key: 'edm-news/lich-festival-edm-chau-a',
  slug: 'lich-festival-edm-chau-a',
  category: 'news',
  lang: 'vi',
  parent: PILLAR,
  title: {
    vi: 'Lịch festival EDM châu Á cuối 2026 và 2027',
    en: 'Asia EDM festival calendar: late 2026 and 2027',
  },
  excerpt: {
    vi: 'Lịch festival EDM châu Á cuối 2026 và 2027: Wonderfruit, Tomorrowland Thailand, DWP26, EDC Thailand, Sunburn, Ultra. Ngày, nơi tổ chức, vé, theo trang ban tổ chức.',
    en: 'The Asia EDM festival calendar for late 2026 and 2027: Wonderfruit, Tomorrowland Thailand, DWP26, EDC Thailand, Sunburn and Ultra, with dates, places and tickets.',
  },
  body: { vi, en },
  cover: coverOf(COVER),
  styles: ['edm', 'mainstage', 'techno', 'trance', 'hardstyle'],
  facts: [
    { label: { vi: 'Tháng dày nhất', en: 'Busiest month' }, value: { vi: 'Tháng 12/2026: bốn festival lớn trong ba tuần', en: 'December 2026: four big festivals in three weeks' } },
    { label: { vi: 'Sắp tới gần nhất', en: 'Next up' }, value: { vi: 'Ultra Taiwan, 14/11/2026, Đài Bắc', en: 'Ultra Taiwan, 14 Nov 2026, Taipei' } },
    { label: { vi: 'Đã bán hết', en: 'Sold out' }, value: { vi: 'Tomorrowland Thailand (11–13/12)', en: 'Tomorrowland Thailand (11–13 Dec)' } },
    { label: { vi: 'Đã mở bán 2027', en: 'On sale for 2027' }, value: { vi: 'Ultra Japan, 18–19/9/2027', en: 'Ultra Japan, 18–19 Sep 2027' } },
    { label: { vi: 'Việt Nam', en: 'Vietnam' }, value: { vi: 'HOZO tuần thứ ba của tháng 12; chưa có Tomorrowland hay Ultra', en: 'HOZO in the third week of December; no Tomorrowland or Ultra' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Festival EDM nào ở châu Á vào tháng 12/2026?', en: 'Which EDM festivals are on in Asia in December 2026?' }, a: { vi: 'Wonderfruit (3–7/12, Chonburi), Tomorrowland Thailand (11–13/12, Pattaya), DWP26 (11–13/12, Jakarta), EDC Thailand (18–20/12, Phuket) và Sunburn (18–19/12, Mumbai).', en: 'Wonderfruit (3–7 Dec, Chonburi), Tomorrowland Thailand (11–13 Dec, Pattaya), DWP26 (11–13 Dec, Jakarta), EDC Thailand (18–20 Dec, Phuket) and Sunburn (18–19 Dec, Mumbai).' } },
    { q: { vi: '808 Festival tổ chức ở đâu?', en: 'Where is 808 Festival held?' }, a: { vi: 'Ở Bangkok, Thái Lan. Năm 2026 diễn ra ngày 2–3/10 tại BITEC Bangna; không có 808 Festival ở TP.HCM.', en: 'In Bangkok, Thailand. The 2026 edition was on 2–3 October at BITEC Bangna; there is no 808 Festival in Ho Chi Minh City.' } },
    { q: { vi: 'Ultra Korea 2026 có diễn ra không?', en: 'Is there an Ultra Korea in 2026?' }, a: { vi: 'Chưa có công bố. Lần gần nhất là 20/9/2025 ở Seoul; lịch của Ultra Worldwide ghi Ultra Korea không kèm ngày.', en: 'Nothing is announced. The last edition was on 20 September 2025 in Seoul; Ultra Worldwide\'s calendar lists Ultra Korea with no date.' } },
    { q: { vi: 'Việt Nam có festival EDM nào cuối năm 2026?', en: 'Does Vietnam have an EDM festival in late 2026?' }, a: { vi: 'Chưa có festival EDM lớn nào được công bố. HOZO ở TP.HCM thường diễn ra tuần thứ ba của tháng 12 nhưng là lễ hội đa thể loại và chưa công bố ngày 2026.', en: 'No big EDM festival is announced. HOZO in Ho Chi Minh City usually runs in the third week of December, but it is multi-genre and its 2026 dates are not out.' } },
    { q: { vi: 'Vé EDC Thailand 2026 giá bao nhiêu?', en: 'How much are EDC Thailand 2026 tickets?' }, a: { vi: 'GA ba ngày ฿10.490, VIP ba ngày ฿16.490, GA một ngày ฿4.700, VIP một ngày ฿7.700, theo trang vé chính thức.', en: 'A 3-day GA pass is ฿10,490, 3-day VIP ฿16,490, 1-day GA ฿4,700 and 1-day VIP ฿7,700, per the official ticket page.' } },
  ],
  sources: [
    { title: 'Ultra Worldwide events calendar', url: 'https://umfworldwide.com/', publisher: 'Ultra Worldwide' },
    { title: 'Wonderfruit 2026 tickets', url: 'https://wonderfruit.co/tickets', publisher: 'Wonderfruit' },
    { title: 'Welcome to Tomorrowland Thailand', url: 'https://thailand.tomorrowland.com/en/welcome/', publisher: 'Tomorrowland' },
    { title: 'DWP26', url: 'https://dwpfest.com/', publisher: 'Ismaya Live' },
    { title: 'EDC Thailand 2026', url: 'https://thailand.edc.com/', publisher: 'Insomniac' },
    { title: 'The 19th edition of Sunburn Festival moves to Mahalaxmi Racecourse', url: 'https://sunburn.in/the-19th-edition-of-sunburn-festival-moves-to-mahalaxmi-racecourse-with-a-reimagined-two-day-format/', publisher: 'Sunburn' },
    { title: 'Ultra Japan 2027 tickets', url: 'https://ultrajapan.com/tickets', publisher: 'Ultra Japan' },
    { title: '808 Festival 2026 line-up', url: 'https://808festival.net/line-up/', publisher: '808 Festival' },
    { title: 'EDC Korea 2026', url: 'https://korea.edc.com/', publisher: 'Insomniac' },
    { title: 'Lễ hội âm nhạc kiến tạo điểm đến', url: 'https://tuoitre.vn/le-hoi-am-nhac-kien-tao-diem-den-20260511084241056.htm', publisher: 'Tuổi Trẻ' },
    { title: 'RAVO 10 Years', url: 'https://www.ravolution.asia/ravo10years', publisher: 'Ravolution Asia' },
  ],
  tracks: [],
};
