import type { PackPost } from '../../../services/blog-content.ts';
import { cityNights } from '../club-guides/shared.ts';
import { coverOf, eventSection, guide, LABEL, PILLAR, UPDATED, type Media, type NewsEvent } from './shared.ts';

type Lang = 'vi' | 'en';

const cover: Media = {
  url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Saigon_skyline_night_view.jpg/1920px-Saigon_skyline_night_view.jpg',
  page: 'https://commons.wikimedia.org/wiki/File:Saigon_skyline_night_view.jpg',
  author: 'Gurval Le Bouter',
  license: 'CC BY 2.0',
};

const g = (slug: string, lang: Lang) => guide(slug, lang);

const RAVO_POST = 'https://www.ravolution.asia/post/ph%C3%A1-v%E1%BB%A1-gi%E1%BB%9Bi-h%E1%BA%A1n-ravolution-music-festival-10-n%C4%83m-%C4%91%C6%B0a-vi%E1%BB%87t-nam-th%C3%A0nh-t%C3%A2m-%C4%91i%E1%BB%83m-edm-ch%C3%A2u-%C3%A1-v%C3%A0o-13-6-t-1';

const ravolution: NewsEvent = {
  name: 'Ravolution Music Festival 10 Years x A State of Trance Vietnam',
  tagline: { vi: 'show EDM quốc tế lớn nhất năm của Việt Nam', en: 'Vietnam\'s biggest international EDM show of the year' },
  start: '2026-06-13',
  place: { vi: 'RAVOLAND, Khu đô thị Vạn Phúc (Vạn Phúc City), TP.HCM', en: 'RAVOLAND, Vạn Phúc City, Ho Chi Minh City' },
  country: 'VN',
  lineup: ['Armin van Buuren', 'Cosmic Gate', 'Ruben de Ronde', 'Nifra', 'Ferry Corsten (Gouryella)', 'KI/KI'],
  tickets: { vi: 'Vé thường 1.799.000 ₫; VIP và SVIP đã bán hết (theo ban tổ chức)', en: 'General admission 1,799,000 ₫; VIP and SVIP sold out (per the organiser)' },
  url: 'https://www.ravolution.asia/ravo10years',
  verified: true,
  why: {
    vi: 'Chapter 12 của Ravolution, chủ đề "TIME", mừng mười năm của lễ hội ra đời năm 2016. Armin van Buuren mang tour A State of Trance 25 Years tới, và ban tổ chức gọi TP.HCM là điểm dừng duy nhất ở Đông Nam Á của tour; KI/KI chơi một set "Face2Face" cùng Armin. Insomniac (đơn vị của EDC) và Livescape (Malaysia) là đối tác. Nhà sáng lập Tris Truong gọi đây là sự kiện nhạc điện tử quốc tế lớn nhất Việt Nam từng tổ chức; đó là lời của ban tổ chức, chưa có con số khán giả độc lập.',
    en: 'Ravolution\'s Chapter 12, themed "TIME", marking ten years of a festival born in 2016. Armin van Buuren brought his A State of Trance 25 Years tour, with Ho Chi Minh City billed as its only Southeast Asian stop; KI/KI played a "Face2Face" set with him. Insomniac (the people behind EDC) and Malaysia\'s Livescape were partners. Founder Tris Truong called it the largest international electronic music event Vietnam has held; that is the organiser\'s claim, with no independent attendance figure.',
  },
};

const vi = `**EDM Việt Nam năm 2026** lớn lên nhờ ba thứ: làn sóng concert khiến các sân lớn bán hết vé, Ravolution mừng mười năm với Armin van Buuren tại TP.HCM, và hai club Sài Gòn trong DJ Mag Top 100 Clubs. Mặt trái: Monsoon im lặng từ 2023, The Observatory đóng cửa, và Việt Nam vẫn chưa có Tomorrowland hay Ultra.

${UPDATED.vi}

Bài này tách rõ điều đã xảy ra (**Sự kiện**) với cách chúng tôi đọc nó (**Phân tích**). Con số nào cũng có nguồn; chỗ nào chưa có nguồn, chúng tôi nói vậy.

## 2025–2026 trong một bảng

| Thời gian | Sự kiện | Nơi | Vì sao đáng nhớ |
| --- | --- | --- | --- |
| 23/8/2025 | 8Wonder "Moments of Wonder" | Trung tâm Hội chợ Triển lãm Quốc gia, Đông Anh, Hà Nội | DJ Snake trước hơn 50.000 người |
| 27–31/12/2025 | HOZO City Tết Fest 2025 | Công viên Bờ sông Sài Gòn | Lễ hội âm nhạc thường niên nhiều ngày duy nhất của cả nước |
| 13/6/2026 | Ravolution 10 Years x ASOT Vietnam | Vạn Phúc City, TP.HCM | Armin van Buuren, tour ASOT 25 Years |
| 10/2026 | DJ Mag Top 100 Clubs 2026 | TP.HCM | APLUS Saigon hạng 59, Ciné Saigon hạng 68 |
| 24/10/2026 | The Observatory x Organik | 85 Cách Mạng Tháng 8, TP.HCM | Một trong những đêm thứ Bảy lớn cuối cùng của The Observatory |
| 11–13/12/2026 | Tomorrowland Thailand | Wisdom Valley, Chonburi, Thái Lan | Tomorrowland đầu tiên ở châu Á, gần Việt Nam nhất |

## Concert bùng nổ: EDM được gì

${LABEL.fact.vi} Tại hội nghị cuối năm 2024 của Bộ Văn hoá, Thể thao và Du lịch, Thủ tướng nêu hai chuỗi concert: "Anh trai say hi" thu hút gần 78.000 người ở hai đêm TP.HCM và gần 100.000 ở hai đêm Hà Nội; "Anh trai vượt ngàn chông gai" có hơn 130.000 người ở Hưng Yên ngày 14/12/2024. Tối 17/10/2026, TP.HCM có bốn concert cùng lúc, phần lớn bán hết vé. Tại một diễn đàn tháng 5/2026, Jason Yan (Ultra Worldwide) nói Việt Nam có khoảng 700–900 sự kiện âm nhạc mỗi năm, hơn 10% trong số đó trên 25.000 người.

${LABEL.analysis.vi} Những concert này không phải EDM, nhưng chúng dựng hạ tầng mà EDM dùng chung: các bãi diễn lớn như Vạn Phúc City, Mỹ Đình, Vinhomes Ocean Park 3, hệ thống bán vé chịu được hàng chục nghìn người cùng lúc, và chính quyền thấy rõ một đêm nhạc lớn kéo theo khách sạn và mua sắm. Ravolution 2026 diễn ra ở đúng Vạn Phúc City. Đổi lại, các show EDM phải cạnh tranh cùng một ví tiền với những concert bán hết trong 45 phút.

## Festival EDM và show lớn

${eventSection(ravolution, 'vi')}

${LABEL.fact.vi} 8Wonder 2025 "Moments of Wonder" ngày 23/8/2025 tại Trung tâm Hội chợ Triển lãm Quốc gia (Đông Anh, Hà Nội), do Vingroup tổ chức, có DJ Snake cùng J Balvin, The Kid LAROI, DPR IAN và Soobin, trước hơn 50.000 người. HOZO, Liên hoan âm nhạc quốc tế TP.HCM, tổ chức cố định vào tuần thứ ba tháng 12, kéo dài 3–5 ngày; HOZO 2025 mở màn ngày 27/12/2025 tại Công viên Bờ sông Sài Gòn. Tính đến 22/10/2026, chưa có ngày hay lineup nào của HOZO 2026 được công bố.

${LABEL.fact.vi} Monsoon Music Festival (Hà Nội, ra đời 2014) không có hoạt động đáng kể từ năm 2023; trang chính thức vẫn chỉ có kỳ 2023. Về Epizode ở Phú Quốc, chúng tôi không đọc được trang nào xác nhận ngày, lineup hay giá của kỳ 2025/26 hoặc 2026/27, nên không nêu. 808 Festival là lễ hội ở Bangkok, kỳ 2026 diễn ra ngày 2–3/10/2026 tại BITEC; không có phiên bản Việt Nam. Tomorrowland và Ultra cũng chưa có phiên bản Việt Nam: lịch của Tomorrowland ở châu Á là Tomorrowland Thailand (11–13/12/2026). Ravolution Asia có trang "CreamFields Viet Nam" nhưng chưa nêu ngày, địa điểm hay lineup.

${LABEL.analysis.vi} Việt Nam đang có một trục festival rõ: Ravolution cho trance và mainstage, 8Wonder cho các tên tuổi toàn cầu, HOZO cho lễ hội thành phố. Thứ còn thiếu là một festival EDM nhiều ngày đều đặn mỗi năm. Tomorrowland Thailand sẽ là phép thử: nếu dân rave Việt bay sang Chonburi đông, các nhà tổ chức trong nước có lý lẽ để làm lớn hơn.

## Club, collective và Vinahouse

${LABEL.fact.vi} Trong DJ Mag Top 100 Clubs 2026, APLUS Saigon đứng hạng 59 và Ciné Saigon hạng 68, cả hai ở trung tâm TP.HCM. Mixmag Asia gọi đêm 24/10/2026, khi Organik Festival (Đài Loan) tiếp quản, là "một trong những đêm thứ Bảy lớn cuối cùng" của The Observatory, nhà của house và techno underground Sài Gòn từ năm 2013. Ở Hà Nội, Unmute là phòng techno chính từ cuối năm 2023; ở Đà Nẵng, SAGA giữ techno bên sông Hàn (xem cẩm nang club của từng thành phố).

${LABEL.fact.vi} Vinahouse, dòng nhạc ra đời cuối thập niên 1990, đầu 2000 từ house, trance và hard dance phương Tây, vẫn là nhạc nền của các bar ở Bùi Viện, và đang được các collective queer như Bung L0n, Vấp Cục Đá và Gái Nhảy chơi lại theo cách của mình (Saigoneer, 8/2026). Heart Beat được ghi nhận mở đường cho techno Sài Gòn từ năm 2012, và Nhạc Gãy là một collective không cần địa điểm cố định (Gray Area, 2022).

${LABEL.analysis.vi} Club lớn đang mạnh hơn bao giờ hết, còn underground mất một mái nhà khi The Observatory đóng. Năm 2027 có thể là năm của các collective: đêm di động, địa điểm thuê theo đêm, và Vinahouse bước ra khỏi Bùi Viện thành một bản sắc chứ không còn là trò đùa. Kiểm tra ma tuý ở club vẫn diễn ra thường xuyên, như ở APLUS tháng 2/2026; xem bài quy định nightlife để biết điều này có nghĩa gì với bạn.

## Nhà sản xuất Việt ra thế giới

${LABEL.fact.vi} Hoaprox là nghệ sĩ Việt đầu tiên ký với Spinnin' Records, có bài "Saviour" phát hành trên Monstercat và được dùng trong game Rocket League (theo Tuổi Trẻ). Tháng 3/2025, anh phát hành "Afterglow" cùng K-391 (Na Uy) và Nick Strand; bài "Ngẫu hứng" có hơn 2 tỷ lượt nghe. Tháng 4/2026, anh ra album đầu tay 12 bài "Tầng sâu nhất - Love core".

${LABEL.analysis.vi} Hoaprox cho thấy con đường xuất khẩu đi qua label và streaming chứ không qua sân khấu festival. Chúng tôi chưa thấy nguồn nào nêu tên một DJ Việt chơi ở Tomorrowland, Ultra hay DWP năm 2025–2026.

## Du lịch: ai đến nghe

${LABEL.fact.vi} Năm 2025, Việt Nam đón gần 21,2 triệu lượt khách quốc tế, tăng 20,4%; chín tháng đầu 2026 đón 17,7 triệu lượt, tăng 14,5%, khoảng 71% mục tiêu 25 triệu của năm (Cục Thống kê). Doanh thu du lịch của TP.HCM chín tháng đầu 2026 ước đạt 282.696 tỷ đồng, tăng 43,4%.

${LABEL.analysis.vi} Khách quốc tế tăng là lý do các festival nói tới "khách từ hơn 50 quốc gia". Với club và festival, đây là khán giả thứ hai bên cạnh dân rave trong nước, và cũng là lý do giờ mở cửa sẽ còn được bàn tiếp.

## Điều cần theo dõi cuối 2026

- HOZO 2026: tuần thứ ba tháng 12, chưa công bố lineup.
- Tomorrowland Thailand, 11–13/12/2026: bao nhiêu khách Việt sẽ đi.
- Nơi underground Sài Gòn tụ lại sau The Observatory.
- Dự thảo sửa Nghị định 144/2020 về biểu diễn, có thể rút ngắn thủ tục cho festival.

## Đọc tiếp

- [Quy định nightlife Việt Nam 2026](${g('quy-dinh-nightlife-viet-nam', 'vi')})
- [Club ở TP.HCM](${g('club-sai-gon', 'vi')}) · [Club ở Hà Nội](${g('club-ha-noi', 'vi')}) · [Club ở Đà Nẵng](${g('club-da-nang', 'vi')})
- [Tomorrowland Thailand 2026](${g('tomorrowland-thailand-2026', 'vi')}) · [Lịch festival EDM châu Á](${g('lich-festival-edm-chau-a', 'vi')})
- [Dự báo EDM 2026–2030](${g('du-bao-edm-2026-2030', 'vi')}) · [Tin tức EDM](${g('tin-tuc-edm', 'vi')})
- [DJ ở Việt Nam](${g('dj-viet-nam', 'vi')})
- [Lịch đêm nhạc ở TP.HCM](${cityNights('ho-chi-minh', 'vi')}) · [Hà Nội](${cityNights('ha-noi', 'vi')}) · [Đà Nẵng](${cityNights('da-nang', 'vi')})`;

const en = `**Vietnam's EDM scene in 2026** grew on three things: a concert boom that sells out the biggest grounds, Ravolution's tenth birthday with Armin van Buuren in Ho Chi Minh City, and two Saigon clubs in DJ Mag's Top 100 Clubs. The other side: Monsoon has been quiet since 2023, The Observatory is closing, and Vietnam still has no Tomorrowland or Ultra.

${UPDATED.en}

This report keeps what happened (**Fact**) apart from how we read it (**Analysis**). Every figure has a source; where there is none, we say so.

## 2025–2026 in one table

| When | Event | Where | Why it matters |
| --- | --- | --- | --- |
| 23 Aug 2025 | 8Wonder "Moments of Wonder" | National Exhibition Center, Đông Anh, Hanoi | DJ Snake before more than 50,000 people |
| 27–31 Dec 2025 | HOZO City Tết Fest 2025 | Saigon Riverside Park | The country's only annual multi-day music festival |
| 13 Jun 2026 | Ravolution 10 Years x ASOT Vietnam | Vạn Phúc City, Ho Chi Minh City | Armin van Buuren on the ASOT 25 Years tour |
| Oct 2026 | DJ Mag Top 100 Clubs 2026 | Ho Chi Minh City | APLUS Saigon No. 59, Ciné Saigon No. 68 |
| 24 Oct 2026 | The Observatory x Organik | 85 Cách Mạng Tháng 8, Ho Chi Minh City | One of The Observatory's final big Saturdays |
| 11–13 Dec 2026 | Tomorrowland Thailand | Wisdom Valley, Chonburi, Thailand | Asia's first Tomorrowland, the closest to Vietnam |

## The concert boom: what EDM gets from it

${LABEL.fact.en} At the culture ministry's year-end conference in December 2024, the Prime Minister cited two concert series: "Anh trai say hi" drew nearly 78,000 people over two nights in Ho Chi Minh City and nearly 100,000 over two in Hanoi; "Anh trai vượt ngàn chông gai" drew more than 130,000 in Hưng Yên on 14 December 2024. On the evening of 17 October 2026 Ho Chi Minh City had four concerts at once, most of them sold out. At a May 2026 forum, Jason Yan of Ultra Worldwide said Vietnam holds about 700–900 music events a year, more than 10% of them over 25,000 people.

${LABEL.analysis.en} These concerts are not EDM, but they build the infrastructure EDM shares: big show grounds such as Vạn Phúc City, Mỹ Đình and Vinhomes Ocean Park 3, ticketing that copes with tens of thousands at once, and authorities who now see that a big night brings hotels and shopping with it. Ravolution 2026 was held at Vạn Phúc City itself. In return, EDM shows compete for the same wallets as concerts that sell out in 45 minutes.

## EDM festivals and big shows

${eventSection(ravolution, 'en')}

${LABEL.fact.en} 8Wonder 2025 "Moments of Wonder" on 23 August 2025 at the National Exhibition Center (Đông Anh, Hanoi), organised by Vingroup, had DJ Snake with J Balvin, The Kid LAROI, DPR IAN and Soobin, before more than 50,000 people. HOZO, the Ho Chi Minh City International Music Festival, runs at a fixed time, the third week of December, over 3–5 days; HOZO 2025 opened on 27 December 2025 at Saigon Riverside Park. As of 22 October 2026 no dates or line-up for HOZO 2026 had been announced.

${LABEL.fact.en} Monsoon Music Festival (Hanoi, founded 2014) has had no notable activity since 2023; its official site still shows only the 2023 edition. For Epizode on Phú Quốc we could read no page confirming the dates, line-up or prices of a 2025/26 or 2026/27 edition, so we give none. 808 Festival is a Bangkok festival, whose 2026 edition ran on 2–3 October 2026 at BITEC; there is no Vietnamese edition. Tomorrowland and Ultra have no Vietnamese edition either: Tomorrowland's Asian date is Tomorrowland Thailand (11–13 December 2026). Ravolution Asia has a "CreamFields Viet Nam" page, but with no date, venue or line-up.

${LABEL.analysis.en} Vietnam now has a clear festival spine: Ravolution for trance and mainstage, 8Wonder for global names, HOZO for the city festival. What is missing is a multi-day EDM festival held every year. Tomorrowland Thailand will be the test: if Vietnamese ravers fly to Chonburi in numbers, local organisers will have the case for going bigger.

## Clubs, collectives and Vinahouse

${LABEL.fact.en} In DJ Mag's Top 100 Clubs 2026, APLUS Saigon is No. 59 and Ciné Saigon No. 68, both in central Ho Chi Minh City. Mixmag Asia calls 24 October 2026, when Taiwan's Organik Festival takes over, "one of the Obs' final big Saturdays" at The Observatory, home of Saigon's underground house and techno since 2013. In Hanoi, Unmute has been the main techno room since late 2023; in Da Nang, SAGA keeps techno on the Hàn riverfront (see each city's club guide).

${LABEL.fact.en} Vinahouse, born in the late 1990s and early 2000s from Western house, trance and hard dance, is still the soundtrack of Bùi Viện's bars, and queer collectives such as Bung L0n, Vấp Cục Đá and Gái Nhảy are playing it again on their own terms (Saigoneer, August 2026). Heart Beat is credited with starting Saigon's techno movement in 2012, and Nhạc Gãy is a collective with no fixed venue (Gray Area, 2022).

${LABEL.analysis.en} The big clubs are stronger than ever, while the underground loses a home as The Observatory closes. 2027 may be the collectives' year: roaming nights, venues hired by the night, and Vinahouse stepping out of Bùi Viện as an identity rather than a joke. Drug checks at clubs remain frequent, as at APLUS in February 2026; see the nightlife rules explainer for what that means for you.

## Vietnamese producers abroad

${LABEL.fact.en} Hoaprox is the first Vietnamese artist signed to Spinnin' Records, and his "Saviour" came out on Monstercat and was used in the game Rocket League (per Tuổi Trẻ). In March 2025 he released "Afterglow" with Norway's K-391 and Nick Strand; his "Ngẫu hứng" has more than 2 billion streams. In April 2026 he released his 12-track debut album, "Tầng sâu nhất - Love core".

${LABEL.analysis.en} Hoaprox shows the export route runs through labels and streaming rather than festival stages. We found no source naming a Vietnamese DJ playing Tomorrowland, Ultra or DWP in 2025–2026.

## Tourism: who comes to listen

${LABEL.fact.en} Vietnam received nearly 21.2 million international visitors in 2025, up 20.4%, and 17.7 million in the first nine months of 2026, up 14.5%, about 71% of the year's 25 million target (National Statistics Office). Ho Chi Minh City's tourism revenue for the first nine months of 2026 was an estimated 282,696 billion VND, up 43.4%.

${LABEL.analysis.en} Rising arrivals are why festivals now talk of "guests from more than 50 countries". For clubs and festivals they are the second audience beside local ravers, and one more reason the debate over opening hours will go on.

## What to watch in late 2026

- HOZO 2026: the third week of December, line-up not yet announced.
- Tomorrowland Thailand, 11–13 December 2026: how many Vietnamese fans make the trip.
- Where Saigon's underground gathers after The Observatory.
- The draft amendment to Decree 144/2020 on performances, which could shorten festival paperwork.

## Read next

- [Vietnam nightlife rules 2026](${g('quy-dinh-nightlife-viet-nam', 'en')})
- [Clubs in Ho Chi Minh City](${g('club-sai-gon', 'en')}) · [Clubs in Hanoi](${g('club-ha-noi', 'en')}) · [Clubs in Da Nang](${g('club-da-nang', 'en')})
- [Tomorrowland Thailand 2026](${g('tomorrowland-thailand-2026', 'en')}) · [Asia's EDM festival calendar](${g('lich-festival-edm-chau-a', 'en')})
- [EDM outlook 2026–2030](${g('du-bao-edm-2026-2030', 'en')}) · [EDM news](${g('tin-tuc-edm', 'en')})
- [DJing in Vietnam](${g('dj-viet-nam', 'en')})
- [Coming nights in Ho Chi Minh City](${cityNights('ho-chi-minh', 'en')}) · [Hanoi](${cityNights('ha-noi', 'en')}) · [Da Nang](${cityNights('da-nang', 'en')})`;

/** A trend report: Vietnam's scene in 2026, from the concert boom and the festivals to the clubs, Vinahouse, producers abroad and the visitors. */
export const edmVietNam: PackPost = {
  key: 'edm-news/edm-viet-nam-2026',
  slug: 'edm-viet-nam-2026',
  category: 'news',
  lang: 'vi',
  parent: PILLAR,
  title: {
    vi: 'EDM Việt Nam 2026: concert, festival, club và Vinahouse',
    en: 'Vietnam EDM scene 2026: concerts, festivals, clubs, Vinahouse',
  },
  excerpt: {
    vi: 'EDM Việt Nam năm 2026: concert bán hết vé, Ravolution mười năm với Armin van Buuren, APLUS và Ciné trong DJ Mag Top 100 Clubs, The Observatory đóng cửa, Hoaprox vươn xa.',
    en: 'Vietnam\'s EDM in 2026: sold-out concerts, Ravolution at ten with Armin van Buuren, APLUS and Ciné in DJ Mag\'s Top 100 Clubs, The Observatory closing, Hoaprox abroad.',
  },
  body: { vi, en },
  cover: coverOf(cover),
  styles: ['edm', 'trance', 'mainstage', 'techno', 'house'],
  facts: [
    { label: { vi: 'Show EDM lớn nhất', en: 'Biggest EDM show' }, value: { vi: 'Ravolution 10 Years x ASOT, 13/6/2026, Vạn Phúc City', en: 'Ravolution 10 Years x ASOT, 13 June 2026, Vạn Phúc City' } },
    { label: { vi: 'DJ Mag Top 100 Clubs 2026', en: 'DJ Mag Top 100 Clubs 2026' }, value: { vi: 'APLUS Saigon 59 · Ciné Saigon 68', en: 'APLUS Saigon 59 · Ciné Saigon 68' } },
    { label: { vi: 'Sự kiện âm nhạc mỗi năm', en: 'Music events a year' }, value: { vi: 'Khoảng 700–900, hơn 10% trên 25.000 người', en: 'About 700–900, over 10% above 25,000 people' } },
    { label: { vi: 'Khách quốc tế', en: 'International visitors' }, value: { vi: '21,2 triệu (2025); 17,7 triệu trong 9 tháng 2026', en: '21.2 million (2025); 17.7 million in 9 months of 2026' } },
    { label: { vi: 'Tomorrowland, Ultra ở Việt Nam', en: 'Tomorrowland, Ultra in Vietnam' }, value: { vi: 'Chưa có; gần nhất là Tomorrowland Thailand 11–13/12/2026', en: 'None; the closest is Tomorrowland Thailand, 11–13 Dec 2026' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Festival EDM lớn nhất Việt Nam năm 2026 là gì?', en: 'What was Vietnam\'s biggest EDM festival in 2026?' }, a: { vi: 'Ravolution Music Festival 10 Years x A State of Trance Vietnam, ngày 13/6/2026 tại Vạn Phúc City, TP.HCM, với Armin van Buuren.', en: 'Ravolution Music Festival 10 Years x A State of Trance Vietnam, on 13 June 2026 at Vạn Phúc City, Ho Chi Minh City, with Armin van Buuren.' } },
    { q: { vi: 'Có Tomorrowland ở Việt Nam không?', en: 'Is there a Tomorrowland in Vietnam?' }, a: { vi: 'Chưa. Tomorrowland đầu tiên ở châu Á là Tomorrowland Thailand, 11–13/12/2026 tại Wisdom Valley, Chonburi.', en: 'No. Asia\'s first Tomorrowland is Tomorrowland Thailand, 11–13 December 2026 at Wisdom Valley, Chonburi.' } },
    { q: { vi: '808 Festival có tổ chức ở TP.HCM không?', en: 'Is 808 Festival held in Ho Chi Minh City?' }, a: { vi: 'Không. 808 Festival là lễ hội ở Bangkok; kỳ 2026 diễn ra ngày 2–3/10/2026 tại BITEC. Chúng tôi không tìm thấy phiên bản Việt Nam.', en: 'No. 808 Festival is a Bangkok festival; its 2026 edition ran on 2–3 October 2026 at BITEC. We found no Vietnamese edition.' } },
    { q: { vi: 'Club Việt Nam nào có trong DJ Mag Top 100 Clubs 2026?', en: 'Which Vietnamese clubs are in DJ Mag\'s Top 100 Clubs 2026?' }, a: { vi: 'APLUS Saigon (hạng 59) và Ciné Saigon (hạng 68), cả hai ở TP.HCM.', en: 'APLUS Saigon (No. 59) and Ciné Saigon (No. 68), both in Ho Chi Minh City.' } },
    { q: { vi: 'Vinahouse là gì?', en: 'What is Vinahouse?' }, a: { vi: 'Dòng nhạc dance Việt ra đời cuối thập niên 1990, đầu 2000 từ house, trance và hard dance phương Tây; là nhạc nền của các bar ở Bùi Viện và đang được các collective Sài Gòn chơi lại.', en: 'A Vietnamese dance style born in the late 1990s and early 2000s from Western house, trance and hard dance; the soundtrack of Bùi Viện\'s bars, now being reclaimed by Saigon collectives.' } },
  ],
  sources: [
    { title: 'Phá vỡ giới hạn: Ravolution Music Festival 10 năm đưa Việt Nam thành tâm điểm EDM châu Á vào 13/6', url: RAVO_POST, publisher: 'Ravolution Asia' },
    { title: 'Thủ tướng gợi ý nhân rộng mô hình 2 concert Anh trai vượt ngàn chông gai và Anh trai say hi', url: 'https://dantri.com.vn/giai-tri/thu-tuong-goi-y-nhan-rong-mo-hinh-2-concert-anh-trai-vuot-ngan-chong-gai-va-anh-trai-say-hi-20241218142938081.htm', publisher: 'Dân Trí' },
    { title: 'Lễ hội âm nhạc kiến tạo điểm đến', url: 'https://tuoitre.vn/le-hoi-am-nhac-kien-tao-diem-den-20260511084241056.htm', publisher: 'Tuổi Trẻ' },
    { title: 'Soobin bùng nổ ở 8Wonder', url: 'https://tuoitre.vn/soobin-bung-no-o-8wonder-ke-chuyen-van-hoa-viet-ban-linh-tu-tin-cung-cac-sao-the-gioi-20250826164907066.htm', publisher: 'Tuổi Trẻ' },
    { title: 'Top 100 Clubs 2026: No. 59 APLUS Saigon', url: 'https://djmag.com/top100clubs/2026/59/aplus-saigon', publisher: 'DJ Mag' },
    { title: 'Top 100 Clubs 2026: No. 68 CINÉ Saigon', url: 'https://djmag.com/top100clubs/2026/68/cine-saigon', publisher: 'DJ Mag' },
    { title: 'Ho Chi Minh City: The Observatory presents Organik takeover events', url: 'https://mixmag.asia/read/ho-chi-minh-city-the-observatory-presents-organik-takeover-events', publisher: 'Mixmag Asia' },
    { title: 'How Vinahouse fosters sonic belonging in modern Saigon\'s queer collectives', url: 'https://saigoneer.com/saigon-music-art/29162-how-vinahouse-fosters-sonic-belonging-in-modern-saigon-s-queer-collectives', publisher: 'Saigoneer' },
    { title: 'From Vinahouse to techno: Vietnam\'s complicated history with dance music', url: 'https://grayarea.co/magazine/from-vinahouse-to-techno-vietnams-complicated-history-with-dance-music', publisher: 'Gray Area' },
    { title: 'Hoaprox tung album đầu tay', url: 'https://tuoitre.vn/hoaprox-tung-album-dau-tay-khi-edm-khong-chi-de-quay-ma-de-thau-hieu-20260401140123767.htm', publisher: 'Tuổi Trẻ' },
    { title: 'Monsoon Music Festival: news', url: 'https://www.monsoonfestival.vn/en/news/', publisher: 'Monsoon Music Festival' },
    { title: '808 Festival: about the event', url: 'https://808festival.net/about-event/', publisher: '808 Festival' },
    { title: '4 concert tối nay vé bán hết, fan đón thần tượng ra sao?', url: 'https://tuoitre.vn/4-concert-toi-nay-ve-ban-het-fan-don-than-tuong-ra-sao-100261017105246624.htm', publisher: 'Tuổi Trẻ' },
    { title: 'TP.HCM đặt mục tiêu đón 20 triệu lượt khách quốc tế: 3 bài toán cần giải', url: 'https://tuoitre.vn/tphcm-dat-muc-tieu-don-20-trieu-luot-khach-quoc-te-3-bai-toan-can-giai-100260929125820406.htm', publisher: 'Tuổi Trẻ' },
    { title: 'Tomorrowland', url: 'https://www.tomorrowland.com/', publisher: 'Tomorrowland' },
    { title: 'Một số nét chính tình hình kinh tế - xã hội quý III và 9 tháng năm 2026', url: 'https://www.nso.gov.vn/bai-top/2026/10/mot-so-net-chinh-tinh-hinh-kinh-te-xa-hoi-quy-iii-va-9-thang-nam-2026/', publisher: 'Cục Thống kê' },
  ],
  tracks: [],
};
