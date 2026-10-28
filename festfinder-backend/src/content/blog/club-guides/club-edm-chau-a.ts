import type { PackPost } from '../../../services/blog-content.ts';
import { CLUB_MEDIA } from './media.ts';
import { coverOf, guide, PILLAR } from './shared.ts';
import { figure } from '../edm-genres/media.ts';

type Lang = 'vi' | 'en';

const fig = (lang: Lang) => figure(CLUB_MEDIA.tokyo[1],
  { vi: 'Phòng chính của WOMB ở Shibuya, Tokyo', en: 'The main room of WOMB in Shibuya, Tokyo' },
  { vi: 'WOMB, Shibuya: một trong những phòng club lâu đời nhất châu Á', en: 'WOMB, Shibuya: one of Asia\'s longest-running club rooms' }, lang);

const g = (slug: string, lang: Lang) => guide(slug, lang);

const vi = `**Club EDM ở châu Á** năm 2026 tập trung ở 11 thành phố: Hà Nội, TP.HCM và Đà Nẵng ở Việt Nam; Singapore và Kuala Lumpur; Tokyo, Osaka và Seoul; Thượng Hải, Bắc Kinh và Thâm Quyến. Mỗi thành phố có một cẩm nang riêng với địa chỉ, giờ mở, giá và cách về nhà đã kiểm tra; trang này giúp bạn chọn thành phố và biết điều gì giống, điều gì khác.

${fig('vi')}

## 11 thành phố trong một bảng

| Thành phố | Đi đâu | Bắt đầu từ | Nhạc | Cẩm nang |
| --- | --- | --- | --- | --- |
| Hà Nội | Phố cổ, Tây Hồ, Yên Phụ | Unmute, 1900 Le Théâtre | Techno, house, bass; mainstage ở A Plus | [Club ở Hà Nội](${g('club-ha-noi', 'vi')}) |
| TP.HCM | Quận 1, Quận 3 | Ciné Saigon, APLUS Saigon | Mainstage, house, melodic techno, Vinahouse | [Club ở TP.HCM](${g('club-sai-gon', 'vi')}) |
| Đà Nẵng | Sông Hàn, An Thượng, Mỹ Khê | SAGA, Sky36 | Techno ở SAGA; EDM, Vinahouse | [Club ở Đà Nẵng](${g('club-da-nang', 'vi')}) |
| Singapore | Clarke Quay, Marina Bay, CBD | Zouk, Marquee | EDM, house, techno ở CBD | [Club ở Singapore](${g('club-singapore', 'vi')}) |
| Kuala Lumpur | TREC, Bukit Bintang, Chinatown | Over & Above, Kyō | Techno, house, EDM | [Club ở Kuala Lumpur](${g('club-kuala-lumpur', 'vi')}) |
| Tokyo | Shibuya, Kabukicho, Aoyama, Ginza | WOMB, ZEROTOKYO | Techno, house, EDM | [Club ở Tokyo](${g('club-tokyo', 'vi')}) |
| Osaka | Shinsaibashi, Umeda | Circus, Joule | Techno, house, EDM | [Club ở Osaka](${g('club-osaka', 'vi')}) |
| Seoul | Itaewon, Hongdae, Gangnam | Cakeshop, Faust | Techno, house; EDM ở Gangnam | [Club ở Seoul](${g('club-seoul', 'vi')}) |
| Thượng Hải | Huaihai, C·PARK, INS | Abyss, Heim | Hard techno, house, techno | [Club ở Thượng Hải](${g('club-thuong-hai', 'vi')}) |
| Bắc Kinh | Tam Lý Đồn, 798, Dongba | Zhao Dai, Dada | Techno, hard dance, house | [Club ở Bắc Kinh](${g('club-bac-kinh', 'vi')}) |
| Thâm Quyến | Futian, Nam Sơn | OIL, PLAY X | Techno; EDM ở mega-club | [Club ở Thâm Quyến](${g('club-tham-quyen', 'vi')}) |

## Việt Nam: Hà Nội, TP.HCM và Đà Nẵng

**Hà Nội** là thành phố underground nhất trong ba: Unmute mở tháng 11/2023 trong một chợ đầu mối ở Phúc Tân và trở thành phòng techno chính sau khi Savage đóng năm 2025; Le Maquis và Mirage giữ house và techno bên Hồ Tây, Birdcage là bass và drum & bass. Ở đầu kia, 1900 Le Théâtre và A Plus, hạng 43 DJ Mag Top 100 Clubs 2026, là những phòng lớn với mainstage và trance. Giờ đóng cửa là chỗ cần để ý: quy định năm 2016 cho phố cổ là 2 giờ sáng cuối tuần, trong khi các đêm underground ghi đến 5 giờ.

**TP.HCM** có hai club trong DJ Mag Top 100 Clubs 2026: APLUS Saigon hạng 59 và Ciné Saigon hạng 68, cả hai ở Quận 1 (club Việt Nam thứ ba trong danh sách là APLUS Hanoi, hạng 43). POCPOC Garden, Canalis và Lush hoàn thiện bức tranh từ house ngoài trời đến phòng thương mại. Tin đáng chú ý của mùa này là The Observatory, nhà của house và techno underground Sài Gòn từ năm 2013, đóng cửa cuối tháng 10/2026; sau đó, techno underground sẽ đi theo các nhóm tổ chức như Nhạc Gãy.

**Đà Nẵng** là thành phố biển: SAGA bên sông Hàn là phòng techno và mở đến 4 giờ sáng cuối tuần, Sky36 là sky bar trên tầng cao, còn An Thượng và biển Mỹ Khê có các pub và beach club. Phần lớn nơi miễn phí vào cửa; đêm có khách quốc tế ở SAGA là 250.000–550.000 ₫. Cả ba thành phố đều có lịch đêm nhạc trên FeestFinder, nên bạn có thể xem ai chơi tối nay trước khi chọn club.

## Đông Nam Á: Singapore và Kuala Lumpur

**Singapore** có club xếp hạng cao nhất trong danh sách này: Zouk, hạng 17 DJ Mag Top 100 Clubs 2026, ở Clarke Quay. Marquee ở Marina Bay Sands và CÉ LA VI trên sân thượng là phòng lớn cho EDM, còn khu CBD và Tanjong Pagar giữ những phòng nhỏ chơi techno và house như Tuff Club, Rasa và MDLR. Singapore đắt nhất trong 11 thành phố: vé S$27–80, bàn từ S$1.000. Giờ đóng cửa được luật hoá: 3 giờ sáng từ Chủ nhật đến thứ Sáu và 4 giờ sáng thứ Bảy.

**Kuala Lumpur** khác: phần lớn các phòng chính chơi hip-hop, nên nhạc điện tử nằm ở vài nơi rõ ràng. Over & Above ở Chinatown là phòng techno, với Jeff Mills và Angerfist năm 2026; Kyō dưới hầm Mandarin Oriental giữ house và techno ở phòng Ren; khu TREC mở đến 5 giờ sáng. Club ở Malaysia giới hạn 21 tuổi, và Zouk KL mà nhiều cẩm nang vẫn nhắc đã đóng hẳn từ tháng 11/2020.

## Nhật Bản và Hàn Quốc: Tokyo, Osaka, Seoul

**Tokyo** là thủ đô club của châu Á về chiều sâu. Từ ngày 23/6/2016, club ở Nhật được phép mở suốt đêm, nên phòng thường mở cửa 21:00–23:00 và đóng 4–5 giờ sáng. WOMB ở Shibuya, ZEROTOKYO ở Kabukicho, Vent ở Aoyama và Circus là các phòng dance music; Zouk Tokyo ở Ginza, mở tháng 10/2023, đứng hạng 51 DJ Mag 2026. Vé thường ¥800–5.000. Phải từ 20 tuổi và mang giấy tờ có ảnh bản gốc.

**Osaka** gọn hơn: Minami (Shinsaibashi, Dotonbori) là nơi gần như mọi club tập trung, Kita (Umeda) là phần còn lại. Circus Osaka và Club Joule là hai phòng dance music chính; vé ¥1.000–4.000, thường kèm một đồ uống ở các club lớn.

**Seoul** chia theo khu: Itaewon cho techno và house (Cakeshop, Faust, Volnost), Hongdae và Hapjeong cho các phòng nhỏ và trẻ, Gangnam cho phòng lớn, nơi Lion Super Club là club Seoul duy nhất trong DJ Mag Top 100 Clubs 2026, hạng 57. Tuổi vào club là 19 theo cách tính tuổi của Hàn Quốc; mang hộ chiếu.

## Trung Quốc: Thượng Hải, Bắc Kinh, Thâm Quyến

**Thượng Hải** có cảnh techno sôi động nhất Trung Quốc đại lục: Abyss cho hard techno, Heim cho house và techno du dương ở Green Station (trở về địa điểm cũ và mừng sinh nhật năm thứ năm tháng 7/2026), Reactor ở C·PARK và các phòng ở toà INS bên công viên Phục Hưng. Metro đóng khoảng 22:30–23:00, và taxi tăng 30% sau 23:00.

**Bắc Kinh** sống ở quận Triều Dương: Zhao Dai ở phía bắc Tam Lý Đồn và Dada ở Nhật Đàn là các phòng techno và house lâu năm, Groundless Factory trong khu nghệ thuật 798 cho những đêm thể nghiệm, Pillbox ở Dongba. Lantern, phòng techno nổi tiếng của thành phố từ 2009, mất địa điểm năm 2020 khi sân vận động Công Nhân được xây lại, và chưa có lịch nào sau đó.

**Thâm Quyến** nhỏ nhất trong danh sách: chúng tôi chỉ xác minh được bốn địa điểm đang mở. OIL ở Futian là phòng underground từ 2017, PLAY X hạng 27 DJ Mag 2026 là mega-club 3.000 người, Jade là mega-club EDM ở khu CBD. Ở cả ba thành phố Trung Quốc, hãy cài Alipay hoặc WeChat Pay với thẻ quốc tế trước khi đi: gần như mọi thứ đều trả qua ứng dụng.

## Những điều giống nhau ở mọi thành phố

- **Giấy tờ:** mang hộ chiếu hoặc giấy tờ có ảnh bản gốc; bản chụp thường không được nhận.
- **Chuyến tàu cuối:** metro ở hầu hết các thành phố dừng khoảng 23:00–24:00. Hãy biết trước ứng dụng gọi xe: Grab ở Việt Nam, Singapore và Malaysia; DiDi ở Trung Quốc; taxi ở Nhật và Hàn.
- **Đồ uống:** đừng rời mắt khỏi ly và đừng nhận đồ uống từ người lạ. Methanol trong rượu pha không thể nếm ra.
- **Ma tuý:** luật ở mọi nước trong danh sách đều rất nặng, cảnh sát có thể khám club và yêu cầu xét nghiệm. Đừng mang, đừng mua, đừng nhận.
- **Lịch:** các phòng underground đăng lịch trên Resident Advisor và Instagram; mega-club ở Trung Quốc đăng trên WeChat. Ở Việt Nam, xem lịch trên FeestFinder.

## Giờ, tuổi và tiền: điều khác nhau

Giờ mở khác nhau nhiều nhất. Tokyo và Osaka mở suốt đêm hợp pháp; phòng lớn ở Seoul thường đến 5–6 giờ sáng, ở Thượng Hải đến 4–5 giờ; Singapore có giờ đóng theo luật; Hà Nội và TP.HCM có quy định cũ về giờ đóng cửa nhưng các đêm underground vẫn ghi đến sáng, nên hãy tin giờ mà club đăng cho từng đêm.

Tuổi cũng khác: 18 ở Việt Nam, 19 theo tuổi Hàn ở Seoul, 20 ở Nhật và 21 ở Malaysia. Về giá, Việt Nam và Trung Quốc có nhiều đêm miễn phí hoặc dưới 300.000 ₫ hay ¥150, Nhật và Hàn ở giữa, Singapore cao nhất. Mọi con số trong các cẩm nang là của tháng 10/2026: hãy xem trang sự kiện trước khi đi.

## Cách chúng tôi chọn club

Mỗi club trong các cẩm nang đã được đối chiếu với trang chính thức, Resident Advisor, DJ Mag hoặc báo chí địa phương vào tháng 10/2026. Chúng tôi bỏ những nơi đã đóng (Zouk KL, Lantern ở địa điểm cũ, Savage ở Hà Nội, Pepper Club và LAX ở Thâm Quyến), những quán bar không có DJ, và mọi tên không tìm được nguồn. Vì vậy số club mỗi thành phố không đều: bảy ở Hà Nội, năm ở TP.HCM, bốn ở Thâm Quyến. Một địa chỉ, giờ hay giá chưa có nguồn được ghi là "không công bố" thay vì đoán.

Chúng tôi cập nhật các cẩm nang khi một club mở, đóng hay đổi địa điểm. Nếu bạn thấy thông tin sai, hãy bấm "Góp ý" ở cuối trang.

## Đọc tiếp

- [Club ở Hà Nội](${g('club-ha-noi', 'vi')}) · [TP.HCM](${g('club-sai-gon', 'vi')}) · [Đà Nẵng](${g('club-da-nang', 'vi')})
- [Club ở Singapore](${g('club-singapore', 'vi')}) · [Kuala Lumpur](${g('club-kuala-lumpur', 'vi')})
- [Club ở Tokyo](${g('club-tokyo', 'vi')}) · [Osaka](${g('club-osaka', 'vi')}) · [Seoul](${g('club-seoul', 'vi')})
- [Club ở Thượng Hải](${g('club-thuong-hai', 'vi')}) · [Bắc Kinh](${g('club-bac-kinh', 'vi')}) · [Thâm Quyến](${g('club-tham-quyen', 'vi')})
- [EDM là gì?](${g('edm', 'vi')}) · [Techno là gì?](${g('techno', 'vi')})`;

const en = `**EDM clubs in Asia** in 2026 cluster in 11 cities: Hanoi, Ho Chi Minh City and Da Nang in Vietnam; Singapore and Kuala Lumpur; Tokyo, Osaka and Seoul; Shanghai, Beijing and Shenzhen. Each city has its own guide with checked addresses, opening hours, prices and the way home; this page helps you pick a city and shows what is the same and what differs.

${fig('en')}

## 11 cities in one table

| City | Where to go | Start with | Music | Guide |
| --- | --- | --- | --- | --- |
| Hanoi | Old Quarter, Tây Hồ, Yên Phụ | Unmute, 1900 Le Théâtre | Techno, house, bass; mainstage at A Plus | [Clubs in Hanoi](${g('club-ha-noi', 'en')}) |
| Ho Chi Minh City | District 1, District 3 | Ciné Saigon, APLUS Saigon | Mainstage, house, melodic techno, Vinahouse | [Clubs in HCMC](${g('club-sai-gon', 'en')}) |
| Da Nang | Hàn riverfront, An Thượng, Mỹ Khê | SAGA, Sky36 | Techno at SAGA; EDM, Vinahouse | [Clubs in Da Nang](${g('club-da-nang', 'en')}) |
| Singapore | Clarke Quay, Marina Bay, CBD | Zouk, Marquee | EDM, house, techno in the CBD | [Clubs in Singapore](${g('club-singapore', 'en')}) |
| Kuala Lumpur | TREC, Bukit Bintang, Chinatown | Over & Above, Kyō | Techno, house, EDM | [Clubs in Kuala Lumpur](${g('club-kuala-lumpur', 'en')}) |
| Tokyo | Shibuya, Kabukicho, Aoyama, Ginza | WOMB, ZEROTOKYO | Techno, house, EDM | [Clubs in Tokyo](${g('club-tokyo', 'en')}) |
| Osaka | Shinsaibashi, Umeda | Circus, Joule | Techno, house, EDM | [Clubs in Osaka](${g('club-osaka', 'en')}) |
| Seoul | Itaewon, Hongdae, Gangnam | Cakeshop, Faust | Techno, house; EDM in Gangnam | [Clubs in Seoul](${g('club-seoul', 'en')}) |
| Shanghai | Huaihai, C·PARK, INS | Abyss, Heim | Hard techno, house, techno | [Clubs in Shanghai](${g('club-thuong-hai', 'en')}) |
| Beijing | Sanlitun, 798, Dongba | Zhao Dai, Dada | Techno, hard dance, house | [Clubs in Beijing](${g('club-bac-kinh', 'en')}) |
| Shenzhen | Futian, Nanshan | OIL, PLAY X | Techno; EDM at the mega-clubs | [Clubs in Shenzhen](${g('club-tham-quyen', 'en')}) |

## Vietnam: Hanoi, Ho Chi Minh City and Da Nang

**Hanoi** is the most underground of the three: Unmute opened in November 2023 inside a wholesale market in Phúc Tân and became the main techno room after Savage closed in 2025; Le Maquis and Mirage keep house and techno by West Lake, and Birdcage is bass and drum & bass. At the other end, 1900 Le Théâtre and A Plus, No. 43 in DJ Mag's Top 100 Clubs 2026, are the big rooms for mainstage and trance. Closing time is the thing to watch: the 2016 rule for the Old Quarter is 2 am at weekends, while underground nights list 5 am.

**Ho Chi Minh City** has two clubs in DJ Mag's Top 100 Clubs 2026: APLUS Saigon at No. 59 and Ciné Saigon at No. 68, both in District 1 (the third Vietnamese club on the list is APLUS Hanoi, at No. 43). POCPOC Garden, Canalis and Lush complete the picture, from open-air house to commercial rooms. The news of the season is that The Observatory, home of Saigon's underground house and techno since 2013, closes at the end of October 2026; after that the underground will travel with collectives such as Nhạc Gãy.

**Da Nang** is the beach city: SAGA on the Hàn riverfront is the techno room and stays open until 4 am at weekends, Sky36 is the sky bar high above the river, and An Thượng and Mỹ Khê beach have the pubs and beach clubs. Most places are free to enter; international nights at SAGA cost 250,000–550,000 ₫. All three cities have their nights listed on FeestFinder, so you can see who plays tonight before you pick a club.

## Southeast Asia: Singapore and Kuala Lumpur

**Singapore** has the highest-ranked club on this list: Zouk, No. 17 in DJ Mag's Top 100 Clubs 2026, at Clarke Quay. Marquee at Marina Bay Sands and CÉ LA VI on the rooftop are the big EDM rooms, while the CBD and Tanjong Pagar keep the smaller techno and house rooms such as Tuff Club, Rasa and MDLR. Singapore is the most expensive of the 11 cities: tickets S$27–80, tables from S$1,000. Closing time is set by law: 3 am from Sunday to Friday and 4 am on Saturday.

**Kuala Lumpur** is different: most main rooms play hip-hop, so electronic music lives in a few clear places. Over & Above in Chinatown is the techno room, with Jeff Mills and Angerfist in 2026; Kyō under the Mandarin Oriental keeps house and techno in its Ren room; the TREC precinct stays open until 5 am. Malaysian clubs are 21 and over, and Zouk KL, which many guides still mention, closed for good in November 2020.

## Japan and Korea: Tokyo, Osaka, Seoul

**Tokyo** is Asia's club capital for depth. Since 23 June 2016 Japanese clubs may open all night, so doors usually open at 21:00–23:00 and close at 4–5 am. WOMB in Shibuya, ZEROTOKYO in Kabukicho, Vent in Aoyama and Circus are the dance-music rooms; Zouk Tokyo in Ginza, opened in October 2023, is No. 51 in DJ Mag 2026. Tickets usually cost ¥800–5,000. You must be 20 or over and carry original photo ID.

**Osaka** is more compact: Minami (Shinsaibashi, Dotonbori) holds nearly every club and Kita (Umeda) the rest. Circus Osaka and Club Joule are the two main dance-music rooms; tickets cost ¥1,000–4,000, usually with a drink at the big clubs.

**Seoul** splits by district: Itaewon for techno and house (Cakeshop, Faust, Volnost), Hongdae and Hapjeong for the small, young rooms, and Gangnam for the big rooms, where Lion Super Club is the only Seoul club in DJ Mag's Top 100 Clubs 2026, at No. 57. The clubbing age is 19 by Korean reckoning; carry your passport.

## China: Shanghai, Beijing, Shenzhen

**Shanghai** has mainland China's liveliest techno scene: Abyss for hard techno, Heim for melodic house and techno at Green Station (back at its first site and five years old in July 2026), Reactor at C·PARK and the rooms of the INS building by Fuxing Park. The metro closes around 22:30–23:00, and taxis cost 30% more after 23:00.

**Beijing** lives in Chaoyang: Zhao Dai north of Sanlitun and Dada in Ritan are the long-running techno and house rooms, Groundless Factory in the 798 Art District hosts the experimental nights, and Pillbox is in Dongba. Lantern, the city's famous techno room since 2009, lost its home in 2020 when the Workers' Stadium was rebuilt and has no listing since.

**Shenzhen** is the smallest on the list: we could verify only four venues open. OIL in Futian is the underground room since 2017, PLAY X, No. 27 in DJ Mag 2026, is a 3,000-capacity mega-club, and Jade is the EDM mega-club in the CBD. In all three Chinese cities, set up Alipay or WeChat Pay with a foreign card before you travel: almost everything is paid by app.

## What every city has in common

- **ID:** carry your passport or original photo ID; a photo of it is usually refused.
- **Last trains:** the metro in most of these cities stops around 23:00–24:00. Know your ride app in advance: Grab in Vietnam, Singapore and Malaysia; DiDi in China; taxis in Japan and Korea.
- **Drinks:** keep your glass in sight and never accept a drink from a stranger. Methanol in mixed drinks cannot be tasted.
- **Drugs:** the law in every country on this list is severe, and police may raid clubs and require a test. Don't carry, buy or accept anything.
- **Listings:** underground rooms post on Resident Advisor and Instagram; China's mega-clubs post on WeChat. In Vietnam, check the nights on FeestFinder.

## Hours, age and money: what differs

Opening hours differ the most. Tokyo and Osaka can legally open all night; Seoul's big rooms usually run to 5–6 am and Shanghai's to 4–5 am; Singapore has a closing time set by law; Hanoi and Ho Chi Minh City have older closing rules, yet underground nights still list the early morning, so trust the hours each club posts for each night.

Age differs too: 18 in Vietnam, 19 by Korean reckoning in Seoul, 20 in Japan and 21 in Malaysia. On price, Vietnam and China have many free nights or nights under 300,000 ₫ or ¥150, Japan and Korea sit in the middle, and Singapore is the highest. Every figure in the guides is from October 2026: check the event page before you go.

## How we chose the clubs

Every club in the guides was checked against its official page, Resident Advisor, DJ Mag or the local press in October 2026. We dropped places that have closed (Zouk KL, Lantern at its old site, Savage in Hanoi, Pepper Club and LAX in Shenzhen), bars with no DJs, and any name we could not source. That is why the number of clubs per city varies: seven in Hanoi, five in Ho Chi Minh City, four in Shenzhen. An address, hour or price with no source is marked "not published" rather than guessed.

We update the guides when a club opens, closes or moves. If you spot something wrong, tap "Feedback" at the bottom of the page.

## Read next

- [Clubs in Hanoi](${g('club-ha-noi', 'en')}) · [Ho Chi Minh City](${g('club-sai-gon', 'en')}) · [Da Nang](${g('club-da-nang', 'en')})
- [Clubs in Singapore](${g('club-singapore', 'en')}) · [Kuala Lumpur](${g('club-kuala-lumpur', 'en')})
- [Clubs in Tokyo](${g('club-tokyo', 'en')}) · [Osaka](${g('club-osaka', 'en')}) · [Seoul](${g('club-seoul', 'en')})
- [Clubs in Shanghai](${g('club-thuong-hai', 'en')}) · [Beijing](${g('club-bac-kinh', 'en')}) · [Shenzhen](${g('club-tham-quyen', 'en')})
- [What is EDM?](${g('edm', 'en')}) · [What is techno?](${g('techno', 'en')})`;

/** The pillar of the club guides: the eleven cities in one table, then what they share and where they differ. */
export const clubEdmChauA: PackPost = {
  key: PILLAR,
  slug: 'club-edm-chau-a',
  category: 'venues',
  lang: 'vi',
  title: {
    vi: 'Club EDM ở châu Á 2026: cẩm nang 11 thành phố từ Hà Nội đến Tokyo',
    en: 'EDM clubs in Asia 2026: an 11-city guide from Hanoi to Tokyo',
  },
  excerpt: {
    vi: 'Club EDM ở 11 thành phố châu Á năm 2026: Hà Nội, TP.HCM, Đà Nẵng, Singapore, Kuala Lumpur, Tokyo, Osaka, Seoul và Trung Quốc. Đi đâu, mấy giờ, bao nhiêu tuổi, giá ra sao.',
    en: 'EDM clubs in 11 Asian cities in 2026: Hanoi, Saigon, Da Nang, Singapore, Kuala Lumpur, Tokyo, Osaka, Seoul and China. Where to go, the hours, the age rules, the prices.',
  },
  body: { vi, en },
  cover: coverOf(CLUB_MEDIA.tokyo[0]),
  styles: ['techno', 'house', 'edm', 'mainstage', 'hard-techno'],
  facts: [
    { label: { vi: 'Thành phố', en: 'Cities' }, value: { vi: '11 ở 6 nước', en: '11 in 6 countries' } },
    { label: { vi: 'DJ Mag Top 100 Clubs 2026', en: 'DJ Mag Top 100 Clubs 2026' }, value: { vi: 'Zouk 17 · PLAY X 27 · APLUS Hanoi 43 · Zouk Tokyo 51 · Lion 57 · APLUS Saigon 59 · Ciné 68', en: 'Zouk 17 · PLAY X 27 · APLUS Hanoi 43 · Zouk Tokyo 51 · Lion 57 · APLUS Saigon 59 · Ciné 68' } },
    { label: { vi: 'Mở suốt đêm', en: 'All night' }, value: { vi: 'Tokyo, Osaka (từ 2016)', en: 'Tokyo, Osaka (since 2016)' } },
    { label: { vi: 'Độ tuổi', en: 'Age' }, value: { vi: '18 Việt Nam · 19 Hàn · 20 Nhật · 21 Malaysia', en: '18 Vietnam · 19 Korea · 20 Japan · 21 Malaysia' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Thành phố nào ở châu Á có club EDM tốt nhất?', en: 'Which Asian city has the best EDM clubs?' }, a: { vi: 'Tokyo có chiều sâu nhất (WOMB, ZEROTOKYO, Vent, mở suốt đêm hợp pháp); Singapore có club xếp hạng cao nhất (Zouk, hạng 17 DJ Mag 2026); Thượng Hải có cảnh techno sôi động nhất Trung Quốc.', en: 'Tokyo has the most depth (WOMB, ZEROTOKYO, Vent, legally open all night); Singapore has the highest-ranked club (Zouk, No. 17 in DJ Mag 2026); Shanghai has China\'s liveliest techno scene.' } },
    { q: { vi: 'Club nào ở Việt Nam có trong DJ Mag Top 100 Clubs 2026?', en: 'Which Vietnamese clubs are in DJ Mag\'s Top 100 Clubs 2026?' }, a: { vi: 'Ba club: APLUS Hanoi hạng 43, APLUS Saigon hạng 59 và Ciné Saigon hạng 68 (hai club sau ở Quận 1, TP.HCM).', en: 'Three: APLUS Hanoi at No. 43, APLUS Saigon at No. 59 and Ciné Saigon at No. 68 (the last two in District 1, Ho Chi Minh City).' } },
    { q: { vi: 'Đi club ở châu Á cần bao nhiêu tuổi?', en: 'What is the clubbing age in Asia?' }, a: { vi: '18 ở Việt Nam, 19 theo tuổi Hàn ở Seoul, 20 ở Nhật Bản và 21 ở Malaysia. Luôn mang hộ chiếu hoặc giấy tờ có ảnh bản gốc.', en: '18 in Vietnam, 19 by Korean reckoning in Seoul, 20 in Japan and 21 in Malaysia. Always carry your passport or original photo ID.' } },
    { q: { vi: 'Club ở châu Á mở đến mấy giờ?', en: 'How late do Asian clubs stay open?' }, a: { vi: 'Tokyo và Osaka mở suốt đêm hợp pháp từ 2016; Seoul thường đến 5–6 giờ, Thượng Hải 4–5 giờ; Singapore đóng 3 giờ (4 giờ thứ Bảy) theo luật; Việt Nam tuỳ club, hãy xem giờ đăng cho từng đêm.', en: 'Tokyo and Osaka may open all night since 2016; Seoul usually runs to 5–6 am and Shanghai to 4–5 am; Singapore closes at 3 am (4 am on Saturday) by law; in Vietnam it depends on the club, so check each night\'s hours.' } },
    { q: { vi: 'Zouk KL còn mở không?', en: 'Is Zouk KL still open?' }, a: { vi: 'Không. Zouk KL đóng hẳn tháng 11/2020; Zouk vẫn mở ở Singapore và Tokyo.', en: 'No. Zouk KL closed for good in November 2020; Zouk is still open in Singapore and Tokyo.' } },
  ],
  sources: [
    { title: 'Zouk Singapore – Top 100 Clubs 2026', url: 'https://djmag.com/top100clubs/2026/17/zouk-singapore', publisher: 'DJ Mag' },
    { title: 'Top 100 Clubs 2026: No. 43 APLUS Hanoi', url: 'https://djmag.com/top100clubs/2026/43/aplus-hanoi', publisher: 'DJ Mag' },
    { title: 'Top 100 Clubs 2026: No. 59 APLUS Saigon', url: 'https://djmag.com/top100clubs/2026/59/aplus-saigon', publisher: 'DJ Mag' },
    { title: 'Ho Chi Minh City club The Observatory rings in ten years', url: 'https://ra.co/news/79830', publisher: 'Resident Advisor' },
    { title: 'Best clubs in Tokyo by music genre', url: 'https://www.timeout.com/tokyo/nightlife/best-clubs-in-tokyo-by-music-genre', publisher: 'Time Out Tokyo' },
    { title: 'An essential city guide to Tokyo', url: 'https://mixmag.net/feature/an-essential-city-guide-to-tokyo', publisher: 'Mixmag' },
    { title: 'Beijing club Lantern reopens at new location with three rooms', url: 'https://ra.co/news/74187', publisher: 'Resident Advisor' },
    { title: 'The best clubs for dancing in KL', url: 'https://www.timeout.com/kuala-lumpur/nightlife/best-clubs-for-dancing-in-kl', publisher: 'Time Out Kuala Lumpur' },
  ],
  tracks: [],
};
