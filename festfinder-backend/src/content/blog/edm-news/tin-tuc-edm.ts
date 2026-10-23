import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, guide, LABEL, PILLAR, UPDATED, type Media } from './shared.ts';

type Lang = 'vi' | 'en';

const cover: Media = {
  url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Swedish_House_Mafia_on_Platform_During_ULTRA_Miami_2018.jpg/1920px-Swedish_House_Mafia_on_Platform_During_ULTRA_Miami_2018.jpg',
  page: 'https://commons.wikimedia.org/wiki/File:Swedish_House_Mafia_on_Platform_During_ULTRA_Miami_2018.jpg',
  author: 'HollywoodAdam78',
  license: 'CC BY-SA 4.0',
};

const g = (slug: string, lang: Lang) => guide(slug, lang);

const vi = `**Tin tức EDM** tháng 10/2026 xoay quanh ba điều: mùa festival cuối năm ở châu Á (Tomorrowland Thailand ở Pattaya 11–13/12, EDC Thailand ở Phuket 18–20/12), bảng xếp hạng DJ Mag 2026 với ba club Việt Nam trong Top 100 Clubs, và AI đổi cách nhạc được làm và nghe. Trang này tóm tắt từng chuyện và dẫn tới bài đầy đủ.

${UPDATED.vi}

## Tóm tắt nhanh

| Chuyện | Điều đã biết | Bài đầy đủ |
| --- | --- | --- |
| Festival châu Á cuối 2026 | Wonderfruit 3–7/12, Tomorrowland Thailand 11–13/12 (đã bán hết), DWP26 11–13/12, EDC Thailand 18–20/12 | [Lịch festival EDM châu Á](${g('lich-festival-edm-chau-a', 'vi')}) |
| Tomorrowland ở châu Á | Lần đầu tiên ở Đông Nam Á, tại Pattaya | [Tomorrowland Thailand 2026](${g('tomorrowland-thailand-2026', 'vi')}) |
| Festival thế giới 2027 | Ultra Miami 26–28/3, EDC Las Vegas hai cuối tuần tháng 5, Defqon.1 24–27/6, Creamfields 26–29/8 | [Festival EDM thế giới 2026](${g('festival-edm-the-gioi-2026', 'vi')}) |
| DJ Mag 2026 | Top 100 Clubs: [UNVRS] số 1; APLUS Hanoi 43, APLUS Saigon 59, Ciné Saigon 68 | [Festival EDM thế giới 2026](${g('festival-edm-the-gioi-2026', 'vi')}) |
| Hard techno | Lên sân khấu chính của Ultra, EDC và các club lớn châu Á | [Xu hướng hard techno](${g('xu-huong-hard-techno', 'vi')}) |
| AI | Tách stem trong phần mềm DJ; nền tảng nghe nhạc gắn nhãn và lọc nhạc AI | [AI trong EDM](${g('ai-trong-edm', 'vi')}) |
| Việt Nam | Vũ trường đóng 02:00–08:00 theo Nghị định 54/2019; ba club trong DJ Mag | [Quy định nightlife Việt Nam](${g('quy-dinh-nightlife-viet-nam', 'vi')}) · [EDM Việt Nam 2026](${g('edm-viet-nam-2026', 'vi')}) |
| 2026–2030 | Ba kịch bản cho thế giới và Việt Nam, có giả định và độ tin cậy | [Dự báo EDM 2026–2030](${g('du-bao-edm-2026-2030', 'vi')}) |

## Lịch những ngày sắp tới

| Ngày | Sự kiện | Nơi |
| --- | --- | --- |
| 14/11/2026 | Ultra Taiwan | Đài Bắc |
| 3–7/12/2026 | Wonderfruit | Chonburi, Thái Lan |
| 11–13/12/2026 | Tomorrowland Thailand | Pattaya, Thái Lan |
| 11–13/12/2026 | DWP26 | Jakarta, Indonesia |
| 18–20/12/2026 | EDC Thailand | Phuket, Thái Lan |
| 18–19/12/2026 | Sunburn | Mumbai, Ấn Độ |
| 20–27/3/2027 | Tomorrowland Winter | Alpe d'Huez, Pháp |
| 26–28/3/2027 | Ultra Music Festival | Miami, Mỹ |
| 14–16 và 21–23/5/2027 | EDC Las Vegas | Las Vegas, Mỹ |
| 24–27/6/2027 | Defqon.1 | Biddinghuizen, Hà Lan |
| 26–29/8/2027 | Creamfields (lần thứ 30) | Daresbury, Anh |

Mọi ngày trong bảng lấy từ trang của ban tổ chức; khi ban tổ chức đổi, chúng tôi đổi theo. Tomorrowland Belgium và ADE chưa công bố ngày 2027.

## Châu Á: mùa festival lớn nhất từ trước tới nay

${LABEL.fact.vi} Tháng 12/2026, Thái Lan có ba festival lớn trong ba tuần: Wonderfruit ở Chonburi, Tomorrowland Thailand ở Pattaya, lần đầu tiên thương hiệu này đến Đông Nam Á, và EDC Thailand ở Phuket. Cùng lúc, DWP26 diễn ra ở Jakarta và Sunburn chuyển từ Goa sang Mumbai. Vé ba ngày của Tomorrowland Thailand đã bán hết.

${LABEL.analysis.vi} Với người đi từ Việt Nam, Bangkok và Phuket chỉ cách một chuyến bay ngắn, nên tháng 12 là lúc dễ nhất để đến một festival tầm cỡ thế giới mà không phải bay sang châu Âu hay Mỹ. Bài [lịch festival châu Á](${g('lich-festival-edm-chau-a', 'vi')}) ghi từng festival với ngày, địa điểm, lineup đã công bố, vé và trạng thái xác minh; bài [Tomorrowland Thailand](${g('tomorrowland-thailand-2026', 'vi')}) nói cách đi, vé và điều cần chuẩn bị. Lưu ý: 808 Festival là festival ở Bangkok, không phải ở TP.HCM, và cả Tomorrowland lẫn Ultra đều chưa có sự kiện nào ở Việt Nam.

## Thế giới: DJ Mag 2026 và lịch 2027

${LABEL.fact.vi} Danh sách DJ Mag Top 100 DJs 2026 trên trang của DJ Mag đặt David Guetta ở vị trí số 1, tiếp theo là Martin Garrix và Anyma. Top 100 Clubs 2026 có [UNVRS] ở Ibiza, club mới, đứng đầu; Top 100 Festivals xếp Tomorrowland số 1. Báo cáo IMS 2025/26 định giá ngành nhạc điện tử năm 2025 ở 15,1 tỷ USD, tăng 7%.

${LABEL.fact.vi} Ngày của mùa 2027 đã có cho phần lớn festival lớn: Ultra Miami 26–28/3, EDC Las Vegas hai cuối tuần 14–16 và 21–23/5, Defqon.1 24–27/6 (bản 2026 bị huỷ vì thời tiết cực đoan), Creamfields lần thứ 30 vào 26–29/8 với The Prodigy là headliner đầu tiên. Bài [festival thế giới](${g('festival-edm-the-gioi-2026', 'vi')}) có từng festival và nhìn lại mùa 2026.

## Xu hướng: hard techno và AI

${LABEL.analysis.vi} Từ 2024 đến 2026, hard techno đi từ phòng club lên sân khấu chính: Ultra Miami 2026 có Amelie Lens b2b Sara Landry, và lineup Ultra Miami 2027 đã có Klangkuenstler, I Hate Models và Indira Paganotto. Ở châu Á, Abyss ở Thượng Hải, Over & Above ở Kuala Lumpur và các sân khấu của EDC Thailand là nơi nghe nó. Chúng tôi chưa thấy số liệu tăng trưởng đáng tin, nên bài [xu hướng hard techno](${g('xu-huong-hard-techno', 'vi')}) dựa trên lineup, không dựa trên phần trăm.

${LABEL.fact.vi} AI thay đổi hai chỗ rõ nhất: tách stem ngay trong phần mềm DJ (rekordbox, Serato, djay), và lượng bài do AI tạo trên nền tảng nghe nhạc. Deezer cho biết nhận gần 90.000 bài hoàn toàn do AI mỗi ngày (6/2026) và đang cho người nghe lọc chúng khỏi tìm kiếm. Bài [AI trong EDM](${g('ai-trong-edm', 'vi')}) tách rõ điều đã xảy ra với điều còn là phỏng đoán.

## Việt Nam: luật chơi và sân khấu

${LABEL.fact.vi} Nghị định 54/2019 cấm vũ trường hoạt động từ 02:00 đến 08:00 và chỉ nhận khách từ 18 tuổi; Nghị định 148/2024 sửa một số điều về phòng cháy và cấp phép. Từ 12/6/2025, cả nước còn 34 tỉnh, thành, nên nhiều địa chỉ club đổi tên phường. Bài [quy định nightlife](${g('quy-dinh-nightlife-viet-nam', 'vi')}) giải thích từng quy định có nghĩa gì với người đi chơi, DJ và nhà tổ chức.

${LABEL.fact.vi} DJ Mag Top 100 Clubs 2026 có ba club Việt Nam: APLUS Hanoi hạng 43, APLUS Saigon hạng 59 và Ciné Saigon hạng 68. The Observatory, nhà của house và techno underground Sài Gòn từ 2013, đi tới những đêm thứ Bảy lớn cuối cùng vào cuối tháng 10/2026. Bài [EDM Việt Nam 2026](${g('edm-viet-nam-2026', 'vi')}) kể về concert, festival, club và Vinahouse năm nay.

## Dự báo đến 2030

${LABEL.forecast.vi} Kịch bản cơ sở của chúng tôi: ngành nhạc điện tử tiếp tục tăng khoảng 6–7% mỗi năm như hai năm gần nhất (độ tin cậy cao), và nhạc AI có giấy phép trở thành chuyện bình thường vào khoảng 2027 (trung bình). Với Việt Nam, khung 2030 dựa trên các kịch bản khách quốc tế của Quyết định 2338; kịch bản cơ sở là 40–45 triệu lượt (trung bình). Đây là phân tích, không phải lời hứa: bài [dự báo 2026–2030](${g('du-bao-edm-2026-2030', 'vi')}) ghi rõ giả định, độ tin cậy và điều có thể làm nó sai.

## Đi festival từ Việt Nam: bốn điều nên làm

1. **Mua vé từ trang chính thức** của festival hoặc đơn vị bán vé mà festival chỉ định; vé chuyển nhượng qua mạng xã hội là nơi lừa đảo nhiều nhất.
2. **Đặt vé máy bay và chỗ ở sớm:** các thành phố tổ chức festival thường kín phòng vào cuối tuần diễn ra sự kiện.
3. **Đọc quy định của festival** về độ tuổi, giấy tờ, đồ được mang vào và cách thanh toán (nhiều festival chỉ nhận thẻ hoặc vòng tay nạp tiền).
4. **Theo dõi trang của ban tổ chức** những ngày trước sự kiện: set time, bản đồ và thay đổi do thời tiết đều được đăng ở đó trước tiên.

## Cách chúng tôi viết tin

- **Nguồn trước:** mỗi ngày, lineup, giá hay con số đều có nguồn ở cuối bài: trang của ban tổ chức, nghệ sĩ, label, văn bản pháp luật hoặc báo chí uy tín. Không có nguồn thì không viết.
- **Ba loại câu:** đoạn mở bằng "Sự kiện" là điều đã xảy ra; "Phân tích" là cách chúng tôi hiểu nó; "Dự báo" là điều có thể xảy ra, kèm giả định và độ tin cậy.
- **Trạng thái xác minh:** một festival chưa được ban tổ chức xác nhận ngày và địa điểm được ghi là "Cần kiểm tra".
- **Tin tự động:** dưới các bài này là tin mới từ báo chí EDM (Mixmag, DJ Mag, Billboard Dance và các trang khác), đọc tự động vài lần mỗi giờ. Mỗi tin dẫn về trang gốc; chúng tôi chỉ giữ tiêu đề, vài dòng tóm tắt và ảnh minh hoạ.

## Đọc tiếp

- [Lịch festival EDM châu Á](${g('lich-festival-edm-chau-a', 'vi')}) · [Tomorrowland Thailand 2026](${g('tomorrowland-thailand-2026', 'vi')}) · [Festival thế giới 2026](${g('festival-edm-the-gioi-2026', 'vi')})
- [Xu hướng hard techno](${g('xu-huong-hard-techno', 'vi')}) · [AI trong EDM](${g('ai-trong-edm', 'vi')}) · [Cách đọc lineup festival](${g('cach-doc-lineup-festival', 'vi')})
- [Quy định nightlife Việt Nam](${g('quy-dinh-nightlife-viet-nam', 'vi')}) · [EDM Việt Nam 2026](${g('edm-viet-nam-2026', 'vi')}) · [Dự báo EDM 2026–2030](${g('du-bao-edm-2026-2030', 'vi')})
- [Club EDM ở châu Á](${g('club-edm-chau-a', 'vi')}) · [EDM là gì?](${g('edm', 'vi')})`;

const en = `**EDM news** in October 2026 turns on three things: Asia's end-of-year festival season (Tomorrowland Thailand in Pattaya on 11–13 December, EDC Thailand in Phuket on 18–20 December), DJ Mag's 2026 rankings with three Vietnamese clubs in the Top 100 Clubs, and AI changing how music is made and heard. This page sums up each story and links to the full post.

${UPDATED.en}

## The short version

| Story | What we know | Full post |
| --- | --- | --- |
| Asia's late-2026 festivals | Wonderfruit 3–7 Dec, Tomorrowland Thailand 11–13 Dec (sold out), DWP26 11–13 Dec, EDC Thailand 18–20 Dec | [Asia EDM festival calendar](${g('lich-festival-edm-chau-a', 'en')}) |
| Tomorrowland in Asia | Its first edition in Southeast Asia, in Pattaya | [Tomorrowland Thailand 2026](${g('tomorrowland-thailand-2026', 'en')}) |
| World festivals 2027 | Ultra Miami 26–28 Mar, EDC Las Vegas over two May weekends, Defqon.1 24–27 Jun, Creamfields 26–29 Aug | [World EDM festivals 2026](${g('festival-edm-the-gioi-2026', 'en')}) |
| DJ Mag 2026 | Top 100 Clubs: [UNVRS] at No. 1; APLUS Hanoi 43, APLUS Saigon 59, Ciné Saigon 68 | [World EDM festivals 2026](${g('festival-edm-the-gioi-2026', 'en')}) |
| Hard techno | Onto the main stages of Ultra, EDC and Asia's big clubs | [The hard techno trend](${g('xu-huong-hard-techno', 'en')}) |
| AI | Stem separation in DJ software; streaming platforms labelling and filtering AI music | [AI in EDM](${g('ai-trong-edm', 'en')}) |
| Vietnam | Dance halls closed 02:00–08:00 under Decree 54/2019; three clubs in DJ Mag | [Vietnam nightlife rules](${g('quy-dinh-nightlife-viet-nam', 'en')}) · [Vietnam EDM scene 2026](${g('edm-viet-nam-2026', 'en')}) |
| 2026–2030 | Three scenarios for the world and Vietnam, with assumptions and confidence | [EDM outlook 2026–2030](${g('du-bao-edm-2026-2030', 'en')}) |

## The dates ahead

| Dates | Event | Where |
| --- | --- | --- |
| 14 Nov 2026 | Ultra Taiwan | Taipei |
| 3–7 Dec 2026 | Wonderfruit | Chonburi, Thailand |
| 11–13 Dec 2026 | Tomorrowland Thailand | Pattaya, Thailand |
| 11–13 Dec 2026 | DWP26 | Jakarta, Indonesia |
| 18–20 Dec 2026 | EDC Thailand | Phuket, Thailand |
| 18–19 Dec 2026 | Sunburn | Mumbai, India |
| 20–27 Mar 2027 | Tomorrowland Winter | Alpe d'Huez, France |
| 26–28 Mar 2027 | Ultra Music Festival | Miami, USA |
| 14–16 and 21–23 May 2027 | EDC Las Vegas | Las Vegas, USA |
| 24–27 Jun 2027 | Defqon.1 | Biddinghuizen, Netherlands |
| 26–29 Aug 2027 | Creamfields (30th edition) | Daresbury, UK |

Every date in the table comes from the organiser's own page; when an organiser changes one, so do we. Tomorrowland Belgium and ADE have not announced their 2027 dates.

## Asia: the biggest festival season yet

${LABEL.fact.en} In December 2026 Thailand hosts three big festivals in three weeks: Wonderfruit in Chonburi, Tomorrowland Thailand in Pattaya, the brand's first edition in Southeast Asia, and EDC Thailand in Phuket. At the same time DWP26 runs in Jakarta and Sunburn moves from Goa to Mumbai. Tomorrowland Thailand's three-day passes are sold out.

${LABEL.analysis.en} From Vietnam, Bangkok and Phuket are a short flight away, so December is the easiest time to reach a world-class festival without flying to Europe or the US. The [Asia festival calendar](${g('lich-festival-edm-chau-a', 'en')}) lists each festival with its dates, place, announced line-up, tickets and whether the organiser confirmed them; the [Tomorrowland Thailand](${g('tomorrowland-thailand-2026', 'en')}) post covers travel, tickets and what to prepare. Note that 808 Festival is a Bangkok festival, not a Ho Chi Minh City one, and neither Tomorrowland nor Ultra has announced anything in Vietnam.

## The world: DJ Mag 2026 and the 2027 calendar

${LABEL.fact.en} DJ Mag's Top 100 DJs 2026 list on its site puts David Guetta at No. 1, followed by Martin Garrix and Anyma. The Top 100 Clubs 2026 has [UNVRS] in Ibiza, a new club, at the top; the Top 100 Festivals ranks Tomorrowland first. The IMS Business Report 2025/26 values the electronic music industry at $15.1 billion in 2025, up 7%.

${LABEL.fact.en} Most big festivals have dated their 2027 editions: Ultra Miami on 26–28 March, EDC Las Vegas over two weekends, 14–16 and 21–23 May, Defqon.1 on 24–27 June (its 2026 edition was cancelled for extreme weather), and Creamfields' 30th edition on 26–29 August with The Prodigy as its first headliner. The [world festivals](${g('festival-edm-the-gioi-2026', 'en')}) post covers each one and looks back at 2026.

## Trends: hard techno and AI

${LABEL.analysis.en} Between 2024 and 2026 hard techno moved from club rooms onto main stages: Ultra Miami 2026 had Amelie Lens b2b Sara Landry, and Ultra Miami 2027's line-up already names Klangkuenstler, I Hate Models and Indira Paganotto. In Asia, Abyss in Shanghai, Over & Above in Kuala Lumpur and EDC Thailand's stages are where to hear it. We found no reliable growth figure, so the [hard techno trend](${g('xu-huong-hard-techno', 'en')}) post rests on line-ups, not percentages.

${LABEL.fact.en} AI changes two things most clearly: stem separation inside DJ software (rekordbox, Serato, djay), and the volume of AI-made tracks on streaming platforms. Deezer says it receives nearly 90,000 fully AI-generated tracks a day (June 2026) and is letting listeners filter them out of search. The [AI in EDM](${g('ai-trong-edm', 'en')}) post keeps what has happened apart from what is still guesswork.

## Vietnam: the rules and the scene

${LABEL.fact.en} Decree 54/2019 bars dance halls from operating between 02:00 and 08:00 and admits guests from 18; Decree 148/2024 amended its fire-safety and licensing rules. Since 12 June 2025 the country has 34 provinces and cities, so many club addresses now carry new ward names. The [Vietnam nightlife rules](${g('quy-dinh-nightlife-viet-nam', 'en')}) post explains what each rule means for a raver, a DJ and an organiser.

${LABEL.fact.en} DJ Mag's Top 100 Clubs 2026 includes three Vietnamese clubs: APLUS Hanoi at No. 43, APLUS Saigon at No. 59 and Ciné Saigon at No. 68. The Observatory, home of Saigon's underground house and techno since 2013, reaches its final big Saturdays at the end of October 2026. The [Vietnam EDM scene 2026](${g('edm-viet-nam-2026', 'en')}) post covers this year's concerts, festivals, clubs and Vinahouse.

## The outlook to 2030

${LABEL.forecast.en} Our base case: the electronic music industry keeps growing about 6–7% a year, as in the last two years (high confidence), and licensed AI music becomes routine around 2027 (medium). For Vietnam, the 2030 frame rests on Decision 2338's international-arrival scenarios; the base case is 40–45 million visits (medium). This is analysis, not a promise: the [2026–2030 outlook](${g('du-bao-edm-2026-2030', 'en')}) gives its assumptions, confidence and what could prove it wrong.

## Going to a festival from Vietnam: four things to do

1. **Buy from the festival's own site** or the seller it names; resold tickets on social media are where most scams happen.
2. **Book flights and a room early:** host cities usually fill up on festival weekends.
3. **Read the festival's rules** on age, ID, what you may bring in and how to pay (many festivals take only cards or a top-up wristband).
4. **Follow the organiser's page** in the days before: set times, maps and weather changes are posted there first.

## How we write the news

- **Sources first:** every date, line-up, price or figure has its source at the end of the post: the organiser's, artist's or label's own page, a legal text or a reputable outlet. No source, no sentence.
- **Three kinds of sentence:** a paragraph opening with "Fact" is what happened; "Analysis" is how we read it; "Forecast" is what may happen, with its assumptions and confidence.
- **Verification status:** a festival whose dates and place the organiser has not confirmed is marked "To be checked".
- **The automatic feed:** under these posts sit the latest headlines from the EDM press (Mixmag, DJ Mag, Billboard Dance and others), read automatically several times an hour. Each headline links to its publisher; we keep only the title, a few lines of summary and the picture.

## Read next

- [Asia EDM festival calendar](${g('lich-festival-edm-chau-a', 'en')}) · [Tomorrowland Thailand 2026](${g('tomorrowland-thailand-2026', 'en')}) · [World festivals 2026](${g('festival-edm-the-gioi-2026', 'en')})
- [The hard techno trend](${g('xu-huong-hard-techno', 'en')}) · [AI in EDM](${g('ai-trong-edm', 'en')}) · [How to read a festival line-up](${g('cach-doc-lineup-festival', 'en')})
- [Vietnam nightlife rules](${g('quy-dinh-nightlife-viet-nam', 'en')}) · [Vietnam EDM scene 2026](${g('edm-viet-nam-2026', 'en')}) · [EDM outlook 2026–2030](${g('du-bao-edm-2026-2030', 'en')})
- [EDM clubs in Asia](${g('club-edm-chau-a', 'en')}) · [What is EDM?](${g('edm', 'en')})`;

/** The pillar of the news pack: the month's stories in one table, the dates ahead, and how the news is written. */
export const tinTucEdm: PackPost = {
  key: PILLAR,
  slug: 'tin-tuc-edm',
  category: 'news',
  lang: 'vi',
  title: {
    vi: 'Tin tức EDM 2026: festival, xếp hạng, xu hướng và Việt Nam',
    en: 'EDM news 2026: festivals, rankings, trends and Vietnam',
  },
  excerpt: {
    vi: 'Tin tức EDM tháng 10/2026: Tomorrowland Thailand và EDC Thailand, DJ Mag 2026 với ba club Việt Nam, hard techno, AI, luật nightlife Việt Nam và dự báo đến 2030.',
    en: 'EDM news for October 2026: Tomorrowland and EDC Thailand, DJ Mag 2026 with three Vietnamese clubs, hard techno, AI, Vietnam\'s nightlife rules and the 2030 outlook.',
  },
  body: { vi, en },
  cover: coverOf(cover),
  styles: ['edm', 'mainstage', 'techno', 'hard-techno'],
  facts: [
    { label: { vi: 'Festival kế tiếp ở châu Á', en: 'Next big Asian festival' }, value: { vi: 'Tomorrowland Thailand, Pattaya, 11–13/12/2026', en: 'Tomorrowland Thailand, Pattaya, 11–13 Dec 2026' } },
    { label: { vi: 'DJ Mag Top 100 DJs 2026', en: 'DJ Mag Top 100 DJs 2026' }, value: { vi: 'Số 1: David Guetta', en: 'No. 1: David Guetta' } },
    { label: { vi: 'Club Việt Nam trong DJ Mag 2026', en: 'Vietnamese clubs in DJ Mag 2026' }, value: { vi: 'APLUS Hanoi 43 · APLUS Saigon 59 · Ciné Saigon 68', en: 'APLUS Hanoi 43 · APLUS Saigon 59 · Ciné Saigon 68' } },
    { label: { vi: 'Ngành nhạc điện tử 2025', en: 'Electronic music industry 2025' }, value: { vi: '15,1 tỷ USD, +7% (IMS)', en: '$15.1bn, +7% (IMS)' } },
    { label: { vi: 'Giờ đóng cửa vũ trường ở Việt Nam', en: 'Vietnam dance-hall closing time' }, value: { vi: '02:00 (Nghị định 54/2019)', en: '02:00 (Decree 54/2019)' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Festival EDM nào lớn nhất ở châu Á cuối 2026?', en: 'What is the biggest EDM festival in Asia in late 2026?' }, a: { vi: 'Tomorrowland Thailand ở Pattaya, 11–13/12/2026, lần đầu Tomorrowland đến Đông Nam Á; vé ba ngày đã bán hết. EDC Thailand ở Phuket diễn ra ngay sau, 18–20/12.', en: 'Tomorrowland Thailand in Pattaya, 11–13 December 2026, Tomorrowland\'s first edition in Southeast Asia; its three-day passes are sold out. EDC Thailand in Phuket follows on 18–20 December.' } },
    { q: { vi: 'Ai đứng đầu DJ Mag Top 100 DJs 2026?', en: 'Who is No. 1 in DJ Mag\'s Top 100 DJs 2026?' }, a: { vi: 'Theo danh sách trên trang DJ Mag tháng 10/2026, David Guetta đứng đầu, tiếp theo là Martin Garrix và Anyma.', en: 'According to the list on DJ Mag\'s site in October 2026, David Guetta is No. 1, followed by Martin Garrix and Anyma.' } },
    { q: { vi: 'Club Việt Nam nào có trong DJ Mag Top 100 Clubs 2026?', en: 'Which Vietnamese clubs are in DJ Mag\'s Top 100 Clubs 2026?' }, a: { vi: 'APLUS Hanoi hạng 43, APLUS Saigon hạng 59 và Ciné Saigon hạng 68.', en: 'APLUS Hanoi at No. 43, APLUS Saigon at No. 59 and Ciné Saigon at No. 68.' } },
    { q: { vi: 'Tomorrowland hay Ultra có tổ chức ở Việt Nam không?', en: 'Is there a Tomorrowland or Ultra in Vietnam?' }, a: { vi: 'Chưa. Tháng 10/2026, cả hai chưa công bố sự kiện nào ở Việt Nam; gần nhất là Tomorrowland Thailand ở Pattaya và Ultra Taiwan ở Đài Bắc.', en: 'Not yet. In October 2026 neither has announced an event in Vietnam; the nearest are Tomorrowland Thailand in Pattaya and Ultra Taiwan in Taipei.' } },
    { q: { vi: 'Vũ trường ở Việt Nam được mở đến mấy giờ?', en: 'How late can clubs open in Vietnam?' }, a: { vi: 'Nghị định 54/2019 cấm vũ trường hoạt động từ 02:00 đến 08:00 và chỉ nhận khách từ 18 tuổi.', en: 'Decree 54/2019 bars dance halls from operating between 02:00 and 08:00 and admits guests from 18.' } },
  ],
  sources: [
    { title: 'Tomorrowland Thailand unveils full Consciencia line-up', url: 'https://www.tomorrowland.com/article/tomorrowland-thailand-2026-line-up-new/', publisher: 'Tomorrowland' },
    { title: 'EDC Thailand 2026', url: 'https://thailand.edc.com/', publisher: 'Insomniac' },
    { title: 'Top 100 DJs 2026', url: 'https://djmag.com/top100djs', publisher: 'DJ Mag' },
    { title: 'Top 100 Clubs 2026: No. 43 APLUS Hanoi', url: 'https://djmag.com/top100clubs/2026/43/aplus-hanoi', publisher: 'DJ Mag' },
    { title: 'IMS Electronic Music Business Report 2025/26', url: 'https://www.internationalmusicsummit.com/news/ims-electronic-music-business-report-2025-26', publisher: 'International Music Summit' },
    { title: 'Ultra Music Festival 2027', url: 'https://ultramusicfestival.com/', publisher: 'Ultra Music Festival' },
    { title: 'Deezer lets listeners filter out fully AI-generated music', url: 'https://newsroom-deezer.com/2026/10/deezer-ai-music-toggle/', publisher: 'Deezer' },
    { title: 'Nghị định 54/2019/NĐ-CP về kinh doanh dịch vụ karaoke, dịch vụ vũ trường', url: 'https://luatvietnam.vn/thuong-mai/nghi-dinh-54-2019-nd-cp-ve-kinh-doanh-dich-vu-karaoke-174772-d1.html', publisher: 'LuatVietnam' },
  ],
  tracks: [],
};
