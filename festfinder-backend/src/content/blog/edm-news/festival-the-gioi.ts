import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, eventSection, figure, guide, LABEL, PILLAR, UPDATED, type Media, type NewsEvent } from './shared.ts';

type Lang = 'vi' | 'en';

/** Read on Wikimedia Commons on 2026-10-23. */
const COVER: Media = {
  url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/23/Mysteryland_2019_-_Main_Floor.jpg/1920px-Mysteryland_2019_-_Main_Floor.jpg',
  page: 'https://commons.wikimedia.org/wiki/File:Mysteryland_2019_-_Main_Floor.jpg',
  author: 'Gerard.koymans',
  license: 'CC BY-SA 4.0',
};
const MAINSTAGE: Media = {
  url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/Tomorrowland_2019_WeekEnd2_Mainstage_yellow.jpg/1920px-Tomorrowland_2019_WeekEnd2_Mainstage_yellow.jpg',
  page: 'https://commons.wikimedia.org/wiki/File:Tomorrowland_2019_WeekEnd2_Mainstage_yellow.jpg',
  author: 'Arroser',
  license: 'CC BY-SA 4.0',
};

const fig = (lang: Lang) => figure(MAINSTAGE,
  { vi: 'Mainstage của Tomorrowland ở Boom, Bỉ, tuần thứ hai năm 2019', en: 'Tomorrowland\'s Mainstage in Boom, Belgium, on the second weekend of 2019' },
  { vi: 'Mainstage của Tomorrowland: lễ hội đứng đầu DJ Mag Top 100 Festivals 2026', en: 'Tomorrowland\'s Mainstage: the festival at the top of DJ Mag\'s Top 100 Festivals 2026' }, lang);

/** The 2027 editions whose dates the organisers have printed on their own pages (read 2026-10-22). */
const EDITIONS: NewsEvent[] = [
  {
    name: 'Ultra Music Festival 2027',
    tagline: { vi: 'Miami mở màn mùa lễ hội', en: 'Miami opens the season' },
    start: '2027-03-26', end: '2027-03-28',
    place: { vi: 'Bayfront Park, Miami, Mỹ', en: 'Bayfront Park, Miami, United States' },
    country: 'US',
    lineup: ['Adam Beyer', 'Armin van Buuren', 'Boris Brejcha b2b Eric Prydz presents Cirez D', 'Calvin Harris', 'Dom Dolla', 'Marshmello b2b Subtronics', 'Martin Garrix', 'Sara Landry'],
    tickets: { vi: 'Đang bán: GA 3 ngày 479,16 USD, VIP 3 ngày 2.396,03 USD (chưa gồm thuế và phí gửi); GA từ 18 tuổi, VIP từ 21', en: 'On sale: GA 3-day $479.16, VIP 3-day $2,396.03 (before tax and shipping); GA 18+, VIP 21+' },
    url: 'https://ultramusicfestival.com/',
    verified: true,
    why: {
      vi: 'Ultra đã công bố đợt nghệ sĩ đầu tiên cho 2027, xếp theo thứ tự chữ cái và không ghi ai là headliner. Danh sách cho thấy hướng đi của lễ hội: nhiều set b2b ra mắt (Marshmello b2b Subtronics lần đầu trên thế giới, Boris Brejcha b2b Cirez D lần đầu ở Mỹ) và nhiều tên techno, hard techno như I Hate Models, Indira Paganotto, Klangkuenstler và Sara Landry bên cạnh các tên mainstage quen thuộc.',
      en: 'Ultra has published its first wave of artists for 2027, listed alphabetically with no headliner billing. The list shows where the festival is heading: many debut back-to-backs (Marshmello b2b Subtronics as a world debut, Boris Brejcha b2b Cirez D as a U.S. debut) and many techno and hard techno names such as I Hate Models, Indira Paganotto, Klangkuenstler and Sara Landry beside the familiar mainstage acts.',
    },
  },
  {
    name: 'Tomorrowland Winter 2027',
    tagline: { vi: 'một tuần lễ hội trên núi tuyết', en: 'a festival week in the snow' },
    start: '2027-03-20', end: '2027-03-27',
    place: { vi: 'Alpe d\'Huez, Pháp', en: 'Alpe d\'Huez, France' },
    country: 'FR',
    lineup: [],
    tickets: { vi: 'Gói 4 và 7 ngày đã bán hết; vé lễ hội 1, 4 và 7 ngày (kèm vé cáp treo và trượt tuyết) đang bán', en: '4- and 7-day packages sold out; 1-, 4- and 7-day festival tickets (with a lift and ski pass) on sale' },
    url: 'https://winter.tomorrowland.com/en/welcome/',
    verified: true,
    why: {
      vi: 'Tomorrowland Winter diễn ra ở Alpe d\'Huez từ lần đầu năm 2019. Ban tổ chức hứa hơn 150 nghệ sĩ, hơn 30.000 người tham dự và 250 km đường trượt tuyết trong bảy ngày. Các gói 4 và 7 ngày mở bán ngày 3 và 10/10/2026 và đã hết; lineup chưa công bố.',
      en: 'Tomorrowland Winter has run in Alpe d\'Huez since its debut in 2019. The organiser promises more than 150 artists, more than 30,000 visitors and 250 km of slopes over seven days. The 4- and 7-day packages went on sale on 3 and 10 October 2026 and are gone; the line-up is not out yet.',
    },
  },
  {
    name: 'Tomorrowland Brasil 2027',
    tagline: { vi: 'chương cuối của Consciencia', en: 'the last chapter of Consciencia' },
    start: '2027-04-30', end: '2027-05-02',
    place: { vi: 'Parque Maeda, Itu, São Paulo, Brazil', en: 'Parque Maeda, Itu, São Paulo, Brazil' },
    country: 'BR',
    lineup: [],
    tickets: { vi: 'Đợt bán WorldWide đã mở từ 24/9/2026; mua trước 24/10/2026 để nhận Treasure Case', en: 'The WorldWide Ticket Sale opened on 24 September 2026; buy by 24 October 2026 to receive a Treasure Case' },
    url: 'https://www.tomorrowland.com/article/tomorrowland-brasil-2027-all-you-need-to-know/',
    verified: true,
    why: {
      vi: 'Consciencia là chủ đề đầu tiên của Tomorrowland đi qua mọi phiên bản trên thế giới: Bỉ, Thái Lan rồi Brazil, nơi ban tổ chức gọi là chương cuối. Lineup đầy đủ vẫn "sắp công bố". Gói Global Journey mới có thêm chuyến đi Rio de Janeiro và São Paulo trước lễ hội.',
      en: 'Consciencia is the first Tomorrowland theme to travel to every edition in the world: Belgium, Thailand and finally Brazil, which the organiser calls its last chapter. The full line-up is still "coming soon". A new Global Journey package adds a trip to Rio de Janeiro and São Paulo before the festival.',
    },
  },
  {
    name: 'EDC Las Vegas 2027',
    tagline: { vi: 'lần đầu hai cuối tuần', en: 'two weekends for the first time' },
    start: '2027-05-14', end: '2027-05-23',
    place: { vi: 'Las Vegas Motor Speedway, Las Vegas, Mỹ', en: 'Las Vegas Motor Speedway, Las Vegas, United States' },
    country: 'US',
    lineup: [],
    tickets: { vi: 'Đang bán: GA từ 479,99 USD (EDC Dusk) đến 859,99 USD (cả hai cuối tuần), đặt cọc 10 USD', en: 'On sale: GA from $479.99 (EDC Dusk) to $859.99 (both weekends), with a $10 deposit' },
    url: 'https://lasvegas.edc.com/',
    verified: true,
    why: {
      vi: 'EDC Las Vegas 2027 chia thành EDC Dusk (14–16/5) và EDC Dawn (21–23/5), và Insomniac lấp những ngày giữa bằng "12 Days of EDC". Pasquale Rotella gọi đó là "điều chúng tôi chưa từng thử", với nhiều phần miễn phí. Lineup 2027 vẫn "sắp công bố".',
      en: 'EDC Las Vegas 2027 splits into EDC Dusk (14–16 May) and EDC Dawn (21–23 May), and Insomniac fills the days in between with "12 Days of EDC". Pasquale Rotella calls it "something we\'ve never attempted before", with much of it free. The 2027 line-up is still "coming soon".',
    },
  },
  {
    name: 'Movement 2027',
    tagline: { vi: 'techno ở quê nhà Detroit', en: 'techno in its Detroit home' },
    start: '2027-05-29', end: '2027-05-31',
    place: { vi: 'Hart Plaza, Detroit, Mỹ', en: 'Hart Plaza, Detroit, United States' },
    country: 'US',
    lineup: [],
    tickets: { vi: 'Đợt 1 đang bán, trả trước từ 55 USD (GA) hoặc 60 USD (VIP) rồi chia bảy kỳ', en: 'Wave 1 on sale, from $55 down (GA) or $60 down (VIP), the rest in seven payments' },
    url: 'https://www.movementfestival.com/tickets',
    verified: true,
    why: {
      vi: 'Movement trở lại Hart Plaza vào cuối tuần Memorial Day như mọi năm. Lineup 2026 được in theo thứ tự chữ cái, không có headliner; lineup 2027 chưa công bố.',
      en: 'Movement returns to Hart Plaza on the Memorial Day weekend as every year. The 2026 line-up was printed alphabetically with no headliners; the 2027 line-up is not out yet.',
    },
  },
  {
    name: 'Sónar 2027',
    tagline: { vi: 'Barcelona giữa tháng Sáu', en: 'Barcelona in mid-June' },
    start: '2027-06-17', end: '2027-06-19',
    place: { vi: 'Barcelona, Tây Ban Nha', en: 'Barcelona, Spain' },
    country: 'ES',
    lineup: [],
    tickets: { vi: 'Chưa công bố', en: 'Not announced' },
    url: 'https://sonar.es/en',
    verified: true,
    why: {
      vi: 'Sónar đã in ngày 2027 trên trang chủ. Bản tổng kết 2026 của lễ hội nhắc đến The Prodigy, Skepta, Chris Stussy và Boys Noize; tên nghệ sĩ 2027 và ngày mở bán chưa có.',
      en: 'Sónar has printed its 2027 dates on its home page. The festival\'s 2026 recap highlights The Prodigy, Skepta, Chris Stussy and Boys Noize; 2027 names and the sale date are not out.',
    },
  },
  {
    name: 'Defqon.1 2027',
    tagline: { vi: 'hardstyle trở lại sau năm bị hủy', en: 'hardstyle returns after a cancelled year' },
    start: '2027-06-24', end: '2027-06-27',
    place: { vi: 'Spijkweg 30, Biddinghuizen, Hà Lan', en: 'Spijkweg 30, Biddinghuizen, the Netherlands' },
    country: 'NL',
    lineup: [],
    tickets: { vi: 'Bán cho thành viên Dediqated 27/10, Travel & Stay 29/10, bán chung 31/10; từ 18 tuổi', en: 'Dediqated members 27 October, Travel & Stay 29 October, general sale 31 October; 18+' },
    url: 'https://www.q-dance.com/l/defqon1-2027-faq',
    verified: true,
    why: {
      vi: 'Q-dance hủy Defqon.1 2026 cùng chính quyền vì thời tiết khắc nghiệt. Người có vé được chọn giữ vé cho 2027 hoặc hoàn tiền, và Q-dance cho biết nhiều người đã giữ vé nên số vé còn lại có hạn. Lễ hội kéo dài từ The Gathering ngày thứ Năm đến The Closing Ritual ngày Chủ nhật.',
      en: 'Q-dance cancelled Defqon.1 2026 with the authorities because of extreme weather. Ticket holders could keep their ticket for 2027 or take a refund, and Q-dance says many kept theirs, so what remains is limited. The festival runs from The Gathering on Thursday to The Closing Ritual on Sunday.',
    },
  },
  {
    name: 'Awakenings Festival 2027',
    tagline: { vi: 'techno ở Hilvarenbeek', en: 'techno in Hilvarenbeek' },
    start: '2027-07-09', end: '2027-07-11',
    place: { vi: 'Hilvarenbeek, Hà Lan', en: 'Hilvarenbeek, the Netherlands' },
    country: 'NL',
    lineup: [],
    tickets: { vi: 'Đang bán (trang không ghi giá); lineup công bố cuối năm 2026', en: 'On sale (no prices on the page); line-up announced later in 2026' },
    url: 'https://www.awakenings.com/en/events/2027/07/awakenings-festival-2027/399344/',
    verified: true,
    why: {
      vi: 'Awakenings tổ chức techno hơn 25 năm, từ đêm đầu ở Gashouder, Amsterdam năm 1997. Lễ hội mùa hè đón khoảng 80.000 người từ hơn 80 nước trong một cuối tuần, với hơn 120 nghệ sĩ ở tám khu vực.',
      en: 'Awakenings has run techno events for more than 25 years, since its first night at Amsterdam\'s Gashouder in 1997. The summer festival draws about 80,000 visitors from more than 80 countries in a weekend, with more than 120 artists across eight areas.',
    },
  },
  {
    name: 'Creamfields 2027',
    tagline: { vi: '30 năm Creamfields', en: '30 years of Creamfields' },
    start: '2027-08-26', end: '2027-08-29',
    place: { vi: 'Daresbury, Cheshire, Anh', en: 'Daresbury, Cheshire, United Kingdom' },
    country: 'GB',
    lineup: ['The Prodigy', 'Franky Rizardo', 'Marco Carola', 'Jamie Jones', 'Hannah Laing'],
    tickets: { vi: 'Vé cắm trại 3 ngày từ 280 GBP + 25 GBP phí; cắm trại 2 ngày đã hết', en: '3-day camping from £280 + £25 fee; 2-day camping sold out' },
    url: 'https://creamfields.com/news/first-2027-headliner-revealed/',
    verified: true,
    why: {
      vi: 'Creamfields 2027 là lần thứ 30 của lễ hội. The Prodigy là headliner đầu tiên, diễn ở sân khấu APEX tối thứ Bảy 28/8 (công bố ngày 10/9/2026); Franky Rizardo, Marco Carola, Jamie Jones và Hannah Laing được công bố tiếp trong tháng Chín.',
      en: 'Creamfields 2027 is the festival\'s 30th edition. The Prodigy are the first headliner, on the APEX stage on Saturday 28 August (announced 10 September 2026); Franky Rizardo, Marco Carola, Jamie Jones and Hannah Laing followed in September.',
    },
  },
  {
    name: 'Mysteryland 2027',
    tagline: { vi: 'Haarlemmermeer cuối tháng Tám', en: 'Haarlemmermeer at the end of August' },
    start: '2027-08-27', end: '2027-08-29',
    place: { vi: 'Haarlemmermeer, Hà Lan', en: 'Haarlemmermeer, the Netherlands' },
    country: 'NL',
    lineup: [],
    tickets: { vi: 'Đăng ký trước đang mở; giá và ngày bán chưa công bố; từ 18 tuổi', en: 'Pre-registration open; prices and sale date not announced; 18+' },
    url: 'https://www.mysteryland.nl/info',
    verified: true,
    why: {
      vi: 'Mysteryland chỉ còn trang đăng ký trước cho 2027 với khẩu hiệu "Unlock a new mystery". Lễ hội tăng 18 bậc lên hạng 15 trong DJ Mag Top 100 Festivals 2026.',
      en: 'Mysteryland\'s site now carries only the 2027 pre-registration and the line "Unlock a new mystery". The festival rose 18 places to No. 15 in DJ Mag\'s Top 100 Festivals 2026.',
    },
  },
];

const editions = (lang: Lang) => EDITIONS.map((e) => eventSection(e, lang)).join('\n\n');

const vi = `**Festival EDM lớn nhất thế giới năm 2026** vẫn là Tomorrowland, đứng đầu DJ Mag Top 100 Festivals, trước EDC Las Vegas và Untold. Năm nay Tomorrowland lần đầu tổ chức trọn vẹn ở châu Á, Defqon.1 bị hủy vì thời tiết, ADE tròn 30 tuổi, và hầu hết lễ hội lớn đã công bố ngày cho 2027.

${UPDATED.vi}

${fig('vi')}

## Lịch các lễ hội lớn 2026–2027

| Lễ hội | 2026 | 2027 |
| --- | --- | --- |
| Tomorrowland (Boom, Bỉ) | 17–19 và 24–26/7 | Chưa công bố |
| Tomorrowland Thailand (Pattaya) | 11–13/12, đã bán hết | Chưa công bố |
| Tomorrowland Winter (Alpe d'Huez) | Đã diễn ra | 20–27/3 |
| Tomorrowland Brasil (Itu) | — | 30/4–2/5 |
| Ultra (Miami) | 27–29/3 | 26–28/3 |
| EDC Las Vegas | 15–17/5 | 14–16 và 21–23/5 |
| Movement (Detroit) | 23–25/5 | 29–31/5 |
| Sónar (Barcelona) | 18–20/6 | 17–19/6 |
| Defqon.1 (Biddinghuizen) | Bị hủy vì thời tiết | 24–27/6 |
| Awakenings Festival (Hilvarenbeek) | Không còn trên trang | 9–11/7 |
| Creamfields (Daresbury) | 27–30/8 | 26–29/8 |
| Mysteryland (Haarlemmermeer) | Không còn trên trang | 27–29/8 |
| ADE (Amsterdam) | 21–25/10 | Chưa công bố |
| Coachella (Indio) | 10–12 và 17–19/4 | Chưa in ngày |

Ngày trong bảng lấy từ trang của chính ban tổ chức, đọc ngày 22/10/2026. "Chưa công bố" nghĩa là trang chính thức chưa có ngày; chúng tôi không đoán.

## Nhìn lại năm 2026

${LABEL.fact.vi} **Tomorrowland** diễn ra ở Boom hai cuối tuần 17–19 và 24–26/7 với chủ đề Consciencia. Ban tổ chức gọi Mainstage năm nay là "lớn và tham vọng nhất từng có": cao hơn 43 mét, rộng 140 mét, 56 laser, 38 đài phun nước, hai thác nước và sáu chiếc đầu khổng lồ cho sáu cảm xúc nguyên thủy. Trước lễ hội, Tomorrowland dự kiến khoảng 400.000 người từ hơn 200 quốc gia; đây là con số trước sự kiện, chưa có số đếm sau. Martin Garrix, Calvin Harris, David Guetta và Hardwell là những tên được nêu cho Mainstage. Ngày 11–13/12, Tomorrowland Thailand ở Wisdom Valley, Pattaya, là lễ hội Tomorrowland trọn vẹn đầu tiên ở châu Á và đã bán hết vé; xem [bài riêng về Tomorrowland Thailand](${guide('tomorrowland-thailand-2026', 'vi')}).

${LABEL.fact.vi} **Ultra Miami** lần thứ 26 diễn ra 27–29/3 ở Bayfront Park. Lineup được công bố ba đợt, với 14 màn ra mắt ở đợt đầu và nhiều set b2b như Amelie Lens b2b Sara Landry, Alesso b2b Martin Garrix và Adam Beyer b2b Joseph Capriati. Ultra cũng là lễ hội điện tử lớn đầu tiên ở Mỹ chạy một sân khấu bằng pin không phát thải.

${LABEL.fact.vi} **EDC Las Vegas** diễn ra 15–17/5, với lineup in theo thứ tự chữ cái từng sân khấu và câu kết "headliner quan trọng nhất: chính bạn". Insomniac còn tổ chức EDC Korea ở Incheon (3–4/10) và EDC Colombia ở Medellín (10–11/10); EDC Thailand ở Phuket diễn ra 18–20/12, một tuần sau Tomorrowland Thailand.

${LABEL.fact.vi} **Defqon.1** bị hủy: Q-dance cho biết đã cùng chính quyền đưa ra "quyết định vô cùng khó khăn" vì thời tiết khắc nghiệt. Người có vé được chọn giữ vé cho 2027 hoặc hoàn tiền trước 31/7; chỗ ở, đỗ xe và tủ đồ được hoàn tự động.

${LABEL.fact.vi} **Creamfields** diễn ra 27–30/8 ở Daresbury với Swedish House Mafia, Martin Garrix và Duke Dumont ở sân khấu APEX, Disclosure (live) ở Arc và Amelie Lens, Tiësto ở Steel Yard. **Sónar** ở Barcelona (18–20/6) nhắc lại các màn diễn của The Prodigy, Skepta, Chris Stussy và Boys Noize. **Movement** trở lại Hart Plaza, Detroit (23–25/5).

${LABEL.fact.vi} **ADE**, lần thứ 30, diễn ra 21–25/10 ở Amsterdam với hơn 3.600 nghệ sĩ, hơn 1.300 sự kiện và hơn 300 địa điểm; Jean-Michel Jarre là khách mời danh dự. Theo Pollstar, ADE 2025 là kỷ lục với khoảng 600.000 lượt khách từ hơn 150 quốc gia. Mọi đêm Awakenings ở SugarFactory trong tuần ADE đều bán hết.

## DJ Mag Top 100 năm 2026

${LABEL.fact.vi} **Top 100 DJs:** David Guetta giữ hạng 1, Martin Garrix hạng 2, Anyma tăng bảy bậc lên hạng 3, tiếp theo là Alok, Dimitri Vegas & Like Mike và Charlotte de Witte (tăng ba bậc lên hạng 6). Fred again.. tăng 17 bậc lên hạng 16, John Summit tăng 22 bậc lên hạng 24, Josh Baker vào thẳng hạng 40. Danh sách đã có trên trang DJ Mag nhưng chúng tôi chưa thấy bài công bố kết quả có ngày, nên ghi là "danh sách trên trang DJ Mag, tháng 10/2026".

${LABEL.fact.vi} **Top 100 Clubs:** [UNVRS] mới vào đã đứng hạng 1, trước Green Valley và Ushuaïa Ibiza; Hï Ibiza, số 1 bốn năm liền, xuống hạng 4. Việt Nam có ba club: APLUS HANOI hạng 43 (tăng 24 bậc), APLUS SAIGON hạng 59 và CINÉ Saigon hạng 68, hai club sau mới vào; xem [cẩm nang club EDM ở châu Á](${guide('club-edm-chau-a', 'vi')}).

${LABEL.fact.vi} **Top 100 Festivals:** Tomorrowland giữ hạng 1, EDC Las Vegas tăng lên hạng 2, Untold hạng 3, Ultra xuống hạng 4 và Defqon.1 tăng năm bậc lên hạng 5 dù năm nay bị hủy. Châu Á có Sunburn (6), Siam Songkran (29, tăng 42 bậc), S2O Songkran (32), Ultra Japan (59), Djakarta Warehouse Project (64) và EDC Thailand (81).

## Ngành nhạc điện tử trong một con số

${LABEL.fact.vi} Theo báo cáo IMS Electronic Music Business Report 2025/26 (công bố 21/4/2026, do Mark Mulligan của MIDiA Research viết), ngành nhạc điện tử toàn cầu đạt **15,1 tỷ USD năm 2025, tăng 7%**. Doanh thu vé club ở Ibiza đạt 160 triệu euro dù số sự kiện ít hơn, và tech house là dòng nhạc bán chạy nhất trên Beatport. Báo cáo công khai không có số liệu lượng khách lễ hội, nên chúng tôi không đưa con số nào.

## Lịch 2027 đã công bố

${editions('vi')}

## Năm 2026 cho thấy điều gì

${LABEL.analysis.vi} Bốn điều nổi lên từ lịch và lineup ở trên. Thứ nhất, lễ hội lớn đang kéo dài thời gian thay vì nới chỗ: EDC Las Vegas 2027 có hai cuối tuần và 12 ngày sự kiện ở giữa, giống cách Tomorrowland và Coachella đã làm. Thứ hai, set b2b và màn "ra mắt" trở thành cách bán vé, nhìn rõ ở cả hai năm Ultra. Thứ ba, techno và hard techno đã lên sân khấu chính, với Sara Landry, Amelie Lens và I Hate Models ở Ultra và Charlotte de Witte trong top 10 DJ Mag; đọc thêm ở [xu hướng hard techno](${guide('xu-huong-hard-techno', 'vi')}). Thứ tư, châu Á là nơi các thương hiệu lớn mở rộng: Tomorrowland và EDC cùng có mặt ở Thái Lan trong tháng 12, và DJ Mag Top 100 Clubs 2026 có ít nhất tám club châu Á mới vào. Defqon.1 nhắc rằng thời tiết là rủi ro lớn của mọi lễ hội ngoài trời.

## Đọc tiếp

- [Tin tức EDM: toàn cầu, châu Á và Việt Nam](${guide('tin-tuc-edm', 'vi')})
- [Lịch festival EDM châu Á](${guide('lich-festival-edm-chau-a', 'vi')})
- [Cách đọc lineup festival](${guide('cach-doc-lineup-festival', 'vi')})
- [Dự báo EDM 2026–2030](${guide('du-bao-edm-2026-2030', 'vi')})
- [Mainstage EDM là gì?](${guide('mainstage-edm', 'vi')}) · [Hardstyle là gì?](${guide('hardstyle', 'vi')})`;

const en = `**The world's biggest EDM festival in 2026** is still Tomorrowland, No. 1 in DJ Mag's Top 100 Festivals ahead of EDC Las Vegas and Untold. This year Tomorrowland held its first full festival in Asia, Defqon.1 was cancelled for the weather, ADE turned 30, and most major festivals have printed their 2027 dates.

${UPDATED.en}

${fig('en')}

## The big festivals, 2026–2027

| Festival | 2026 | 2027 |
| --- | --- | --- |
| Tomorrowland (Boom, Belgium) | 17–19 and 24–26 July | Not announced |
| Tomorrowland Thailand (Pattaya) | 11–13 December, sold out | Not announced |
| Tomorrowland Winter (Alpe d'Huez) | Held | 20–27 March |
| Tomorrowland Brasil (Itu) | — | 30 April – 2 May |
| Ultra (Miami) | 27–29 March | 26–28 March |
| EDC Las Vegas | 15–17 May | 14–16 and 21–23 May |
| Movement (Detroit) | 23–25 May | 29–31 May |
| Sónar (Barcelona) | 18–20 June | 17–19 June |
| Defqon.1 (Biddinghuizen) | Cancelled for the weather | 24–27 June |
| Awakenings Festival (Hilvarenbeek) | No longer on its site | 9–11 July |
| Creamfields (Daresbury) | 27–30 August | 26–29 August |
| Mysteryland (Haarlemmermeer) | No longer on its site | 27–29 August |
| ADE (Amsterdam) | 21–25 October | Not announced |
| Coachella (Indio) | 10–12 and 17–19 April | No dates printed |

The dates come from the organisers' own pages, read on 22 October 2026. "Not announced" means the official page has no date yet; we do not guess.

## 2026 in review

${LABEL.fact.en} **Tomorrowland** ran in Boom over two weekends, 17–19 and 24–26 July, under the theme Consciencia. The organiser called this year's Mainstage "the largest and most ambitious Mainstage ever created": over 43 metres tall, 140 metres wide, with 56 lasers, 38 fountains, two waterfalls and six giant heads for the six primal emotions. Before the festival Tomorrowland expected around 400,000 people from more than 200 countries; that is a pre-event figure, and no post-event count has been published. Martin Garrix, Calvin Harris, David Guetta and Hardwell were the names given for the Mainstage. On 11–13 December, Tomorrowland Thailand at Wisdom Valley, Pattaya, is the first full-scale Tomorrowland in Asia and is sold out; see [our Tomorrowland Thailand coverage](${guide('tomorrowland-thailand-2026', 'en')}).

${LABEL.fact.en} **Ultra Miami**'s 26th edition ran 27–29 March at Bayfront Park. Its line-up came in three phases, with 14 debut performances in the first and many back-to-backs such as Amelie Lens b2b Sara Landry, Alesso b2b Martin Garrix and Adam Beyer b2b Joseph Capriati. Ultra was also the first major U.S. electronic festival to power a stage with zero-emission batteries.

${LABEL.fact.en} **EDC Las Vegas** ran 15–17 May, with a line-up printed alphabetically by stage and the closing line "the most important headliner of all: You". Insomniac also ran EDC Korea in Incheon (3–4 October) and EDC Colombia in Medellín (10–11 October); EDC Thailand in Phuket runs 18–20 December, a week after Tomorrowland Thailand.

${LABEL.fact.en} **Defqon.1** was cancelled: Q-dance said it was "forced to make the incredibly difficult decision" with the authorities because of extreme weather. Ticket holders could keep their ticket for 2027 or take a refund by 31 July; accommodation, parking and lockers were refunded automatically.

${LABEL.fact.en} **Creamfields** ran 27–30 August at Daresbury with Swedish House Mafia, Martin Garrix and Duke Dumont on the APEX stage, Disclosure (live) on the Arc and Amelie Lens and Tiësto in the Steel Yard. **Sónar** in Barcelona (18–20 June) looks back on sets by The Prodigy, Skepta, Chris Stussy and Boys Noize. **Movement** returned to Hart Plaza, Detroit (23–25 May).

${LABEL.fact.en} **ADE**, in its 30th edition, runs 21–25 October in Amsterdam with more than 3,600 artists, 1,300 events and 300 venues; Jean-Michel Jarre is guest of honour. According to Pollstar, ADE 2025 was a record with about 600,000 visitors from more than 150 countries. Every Awakenings night at SugarFactory during ADE is sold out.

## DJ Mag's Top 100 in 2026

${LABEL.fact.en} **Top 100 DJs:** David Guetta stays No. 1, Martin Garrix No. 2, Anyma climbs seven places to No. 3, followed by Alok, Dimitri Vegas & Like Mike and Charlotte de Witte (up three to No. 6). Fred again.. rises 17 places to No. 16, John Summit 22 places to No. 24, and Josh Baker enters at No. 40. The list is live on DJ Mag's site but we have not seen a dated results article, so we call it "the list on DJ Mag's site, October 2026".

${LABEL.fact.en} **Top 100 Clubs:** [UNVRS] enters straight at No. 1, ahead of Green Valley and Ushuaïa Ibiza; Hï Ibiza, No. 1 for four years running, drops to No. 4. Vietnam has three clubs: APLUS HANOI at No. 43 (up 24), APLUS SAIGON at No. 59 and CINÉ Saigon at No. 68, the last two new entries; see [our guide to EDM clubs in Asia](${guide('club-edm-chau-a', 'en')}).

${LABEL.fact.en} **Top 100 Festivals:** Tomorrowland holds No. 1, EDC Las Vegas rises to No. 2, Untold is No. 3, Ultra drops to No. 4 and Defqon.1 climbs five places to No. 5 despite this year's cancellation. Asia has Sunburn (6), Siam Songkran (29, up 42), S2O Songkran (32), Ultra Japan (59), Djakarta Warehouse Project (64) and EDC Thailand (81).

## The industry in one number

${LABEL.fact.en} According to the IMS Electronic Music Business Report 2025/26 (published 21 April 2026 and written by Mark Mulligan of MIDiA Research), the global electronic music industry reached **$15.1 billion in 2025, up 7%**. Ibiza's club ticketing revenue reached €160 million despite fewer events, and tech house is the top-selling genre on Beatport. The public report gives no festival attendance figures, so we print none.

## The 2027 dates announced so far

${editions('en')}

## What 2026 tells us

${LABEL.analysis.en} Four things stand out from the calendar and line-ups above. First, the big festivals are growing in time rather than in space: EDC Las Vegas 2027 has two weekends with 12 days of events in between, as Tomorrowland and Coachella already do. Second, back-to-backs and "debuts" have become a way to sell tickets, visible in both years of Ultra. Third, techno and hard techno have reached the main stages, with Sara Landry, Amelie Lens and I Hate Models at Ultra and Charlotte de Witte in DJ Mag's top ten; read more in [our hard techno trend report](${guide('xu-huong-hard-techno', 'en')}). Fourth, Asia is where the big brands expand: Tomorrowland and EDC are both in Thailand in December, and DJ Mag's Top 100 Clubs 2026 has at least eight new Asian entries. Defqon.1 is a reminder that the weather is the biggest risk of every outdoor festival.

## Read next

- [EDM news: global, Asia and Vietnam](${guide('tin-tuc-edm', 'en')})
- [The EDM festival calendar in Asia](${guide('lich-festival-edm-chau-a', 'en')})
- [How to read a festival line-up](${guide('cach-doc-lineup-festival', 'en')})
- [EDM outlook 2026–2030](${guide('du-bao-edm-2026-2030', 'en')})
- [What is mainstage EDM?](${guide('mainstage-edm', 'en')}) · [What is hardstyle?](${guide('hardstyle', 'en')})`;

/** Event coverage: the world's big festivals in 2026 and the 2027 dates their organisers have printed. */
export const festivalTheGioi: PackPost = {
  key: 'edm-news/festival-edm-the-gioi-2026',
  slug: 'festival-edm-the-gioi-2026',
  category: 'news',
  lang: 'vi',
  parent: PILLAR,
  title: {
    vi: 'Festival EDM thế giới 2026: Tomorrowland, Ultra, EDC và lịch 2027',
    en: 'World EDM festivals 2026: Tomorrowland, Ultra, EDC and 2027 dates',
  },
  excerpt: {
    vi: 'Festival EDM lớn nhất thế giới năm 2026 và lịch 2027: Tomorrowland, Ultra, EDC, ADE, Creamfields, Defqon.1 bị hủy, DJ Mag Top 100 năm 2026 và quy mô ngành theo IMS.',
    en: 'The world\'s biggest EDM festivals of 2026 and their 2027 dates: Tomorrowland, Ultra, EDC, ADE, Creamfields, the cancelled Defqon.1, DJ Mag\'s Top 100s and IMS.',
  },
  body: { vi, en },
  cover: coverOf(COVER),
  styles: ['edm', 'mainstage', 'techno', 'hardstyle', 'trance'],
  facts: [
    { label: { vi: 'Lễ hội số 1', en: 'No. 1 festival' }, value: { vi: 'Tomorrowland (DJ Mag 2026)', en: 'Tomorrowland (DJ Mag 2026)' } },
    { label: { vi: 'DJ số 1', en: 'No. 1 DJ' }, value: { vi: 'David Guetta (DJ Mag 2026)', en: 'David Guetta (DJ Mag 2026)' } },
    { label: { vi: 'Club số 1', en: 'No. 1 club' }, value: { vi: '[UNVRS] (DJ Mag 2026)', en: '[UNVRS] (DJ Mag 2026)' } },
    { label: { vi: 'Quy mô ngành', en: 'Industry size' }, value: { vi: '15,1 tỷ USD năm 2025, +7% (IMS)', en: '$15.1bn in 2025, +7% (IMS)' } },
    { label: { vi: 'Lễ hội lớn đầu tiên 2027', en: 'First big festival of 2027' }, value: { vi: 'Tomorrowland Winter, 20–27/3', en: 'Tomorrowland Winter, 20–27 March' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Festival EDM nào lớn nhất thế giới năm 2026?', en: 'What was the world\'s biggest EDM festival in 2026?' }, a: { vi: 'Tomorrowland, hạng 1 DJ Mag Top 100 Festivals 2026, trước EDC Las Vegas và Untold. Tomorrowland Bỉ diễn ra hai cuối tuần 17–19 và 24–26/7/2026.', en: 'Tomorrowland, No. 1 in DJ Mag\'s Top 100 Festivals 2026, ahead of EDC Las Vegas and Untold. Tomorrowland Belgium ran over two weekends, 17–19 and 24–26 July 2026.' } },
    { q: { vi: 'Ultra Miami 2027 diễn ra khi nào?', en: 'When is Ultra Miami 2027?' }, a: { vi: '26–28/3/2027 ở Bayfront Park, Miami. Vé đang bán; GA 3 ngày 479,16 USD trước thuế và phí gửi.', en: '26–28 March 2027 at Bayfront Park, Miami. Tickets are on sale; a GA 3-day ticket is $479.16 before tax and shipping.' } },
    { q: { vi: 'Vì sao Defqon.1 2026 bị hủy?', en: 'Why was Defqon.1 2026 cancelled?' }, a: { vi: 'Q-dance và chính quyền hủy lễ hội vì thời tiết khắc nghiệt. Defqon.1 2027 diễn ra 24–27/6/2027 ở Biddinghuizen.', en: 'Q-dance and the authorities cancelled it because of extreme weather. Defqon.1 2027 runs 24–27 June 2027 in Biddinghuizen.' } },
    { q: { vi: 'Ai là DJ số 1 DJ Mag năm 2026?', en: 'Who is DJ Mag\'s No. 1 DJ in 2026?' }, a: { vi: 'David Guetta, trước Martin Garrix và Anyma, theo danh sách Top 100 DJs 2026 trên trang DJ Mag.', en: 'David Guetta, ahead of Martin Garrix and Anyma, according to the Top 100 DJs 2026 list on DJ Mag\'s site.' } },
    { q: { vi: 'Tomorrowland Bỉ 2027 diễn ra khi nào?', en: 'When is Tomorrowland Belgium 2027?' }, a: { vi: 'Chưa công bố. Tính đến 22/10/2026, trang Tomorrowland Bỉ chưa có ngày, lịch đăng ký trước hay ngày bán vé cho 2027.', en: 'Not announced yet. As of 22 October 2026 the Tomorrowland Belgium site has no 2027 dates, pre-registration or sale dates.' } },
    { q: { vi: 'Club Việt Nam nào có trong DJ Mag Top 100 Clubs 2026?', en: 'Which Vietnamese clubs are in DJ Mag\'s Top 100 Clubs 2026?' }, a: { vi: 'Ba club: APLUS HANOI hạng 43, APLUS SAIGON hạng 59 và CINÉ Saigon hạng 68.', en: 'Three: APLUS HANOI at No. 43, APLUS SAIGON at No. 59 and CINÉ Saigon at No. 68.' } },
  ],
  sources: [
    { title: 'Top 100 Festivals 2026', url: 'https://djmag.com/top100festivals', publisher: 'DJ Mag' },
    { title: 'Top 100 DJs 2026', url: 'https://djmag.com/top100djs', publisher: 'DJ Mag' },
    { title: 'Top 100 Clubs 2026', url: 'https://djmag.com/top100clubs', publisher: 'DJ Mag' },
    { title: 'This is the Tomorrowland Belgium 2026 Mainstage: Consciencia', url: 'https://www.tomorrowland.com/article/tomorrowland-belgium-2026-mainstage-reveal/', publisher: 'Tomorrowland' },
    { title: 'Everything you need to know about Tomorrowland Brasil 2027', url: 'https://www.tomorrowland.com/article/tomorrowland-brasil-2027-all-you-need-to-know/', publisher: 'Tomorrowland' },
    { title: 'Ultra Music Festival 2027', url: 'https://ultramusicfestival.com/', publisher: 'Ultra Music Festival' },
    { title: 'EDC Las Vegas 2027', url: 'https://lasvegas.edc.com/', publisher: 'Insomniac' },
    { title: 'Defqon.1 2026: important update', url: 'https://www.q-dance.com/l/defqon1-2026-important-update', publisher: 'Q-dance' },
    { title: 'First 2027 headliner revealed', url: 'https://creamfields.com/news/first-2027-headliner-revealed/', publisher: 'Creamfields' },
    { title: '30 YEARS ADE: festival program complete', url: 'https://www.amsterdam-dance-event.nl/en/news/30-years-ade-festival-program-complete/2927685/', publisher: 'Amsterdam Dance Event' },
    { title: '"ADE is built together": a look at 30 years of Amsterdam Dance Event', url: 'https://news.pollstar.com/2026/10/21/ade-is-built-together-a-look-at-30-years-of-amsterdam-dance-event-with-md-jan-willem-van-de-ven/', publisher: 'Pollstar' },
    { title: 'IMS Electronic Music Business Report 2025/26', url: 'https://www.internationalmusicsummit.com/news/ims-electronic-music-business-report-2025-26', publisher: 'International Music Summit' },
  ],
  tracks: [],
};
