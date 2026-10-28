import { cityGuide, type CityGuide } from './shared.ts';
import { CLUB_MEDIA } from './media.ts';

/** TP.HCM (research 2026-10-22: addresses in the 2025 ward names, prices only where the club publishes them). */
const saiGon: CityGuide = {
  key: 'club-guides/sai-gon',
  slug: 'club-sai-gon',
  city: 'ho-chi-minh',
  name: { vi: 'TP.HCM', en: 'Ho Chi Minh City' },
  title: {
    vi: 'Club ở TP.HCM 2026: Ciné Saigon, APLUS và đêm Sài Gòn',
    en: 'Best clubs in Ho Chi Minh City 2026: Saigon after dark',
  },
  excerpt: {
    vi: 'Club đáng đi nhất TP.HCM năm 2026: Ciné Saigon, APLUS Saigon, POCPOC Garden, Canalis và Lush. Địa chỉ phường mới, giờ mở, giá đã kiểm chứng, chia tay The Observatory.',
    en: 'Saigon clubs worth a night in 2026: Ciné Saigon, APLUS Saigon, POCPOC Garden, Canalis and Lush, with new addresses, checked hours, prices and The Observatory\'s goodbye.',
  },
  cover: CLUB_MEDIA.saiGon[0],
  figure: {
    media: CLUB_MEDIA.saiGon[1],
    alt: { vi: 'Phố đi bộ Bùi Viện về đêm', en: 'Bùi Viện walking street at night' },
    caption: { vi: 'Bùi Viện: cấm xe từ 19:00 đến 02:00 tối cuối tuần', en: 'Bùi Viện: car-free from 19:00 to 02:00 on weekend nights' },
  },
  styles: ['edm', 'house', 'techno', 'melodic-techno', 'mainstage'],
  lead: {
    vi: '**Club ở TP.HCM** năm 2026 là thời của superclub: ba phòng của thành phố có tên trong DJ Mag Top 100 Clubs (Ciné Saigon, APLUS Saigon, POCPOC Garden), bên cạnh những tên tuổi lâu đời như Canalis và Lush. Bài này chọn 5 club đang hoạt động, kèm địa chỉ theo tên phường mới, giờ mở và giá chỉ khi club tự công bố.',
    en: '**Ho Chi Minh City\'s clubs** in 2026 are a superclub story: three of its rooms sit in DJ Mag\'s Top 100 Clubs (Ciné Saigon, APLUS Saigon, POCPOC Garden), next to long-standing names such as Canalis and Lush. This guide picks five that are open, with addresses in the new ward names, hours, and prices only where the club publishes them.',
  },
  quick: {
    areas: {
      vi: 'Quận 1 là trung tâm: phố đi bộ Bùi Viện (phường Bến Thành), rooftop quanh Nguyễn Huệ. Các club lớn nằm ở rìa Quận 1 và Quận 3: Ciné Saigon trên Cống Quỳnh, APLUS trên Võ Văn Kiệt, Canalis và POCPOC quanh Nam Kỳ Khởi Nghĩa. Từ cải cách năm 2025, địa chỉ ghi tên phường mới (Bến Thành, Cầu Ông Lãnh, Xuân Hòa).',
      en: 'District 1 is the centre: Bùi Viện walking street (Bến Thành ward) and the rooftops around Nguyễn Huệ. The big clubs sit on the edges of District 1 and in District 3: Ciné Saigon on Cống Quỳnh, APLUS on Võ Văn Kiệt, Canalis and POCPOC around Nam Kỳ Khởi Nghĩa. Since the 2025 reform, addresses use the new ward names (Bến Thành, Cầu Ông Lãnh, Xuân Hòa).',
    },
    hours: {
      vi: 'Club ghi giờ muộn: Canalis 21:00–03:00, POCPOC 17:00–02:00, sự kiện ở Ciné từ 21:00, Lush đến 04:00–05:00. Bùi Viện cấm xe 19:00–02:00 tối cuối tuần. Năm 2016 Tuổi Trẻ đưa tin quy định đóng cửa lúc nửa đêm; không tìm thấy văn bản hiện hành, nên hãy theo giờ club tự công bố.',
      en: 'Clubs publish late hours: Canalis 21:00–03:00, POCPOC 17:00–02:00, Ciné\'s events from 21:00, Lush to 04:00–05:00. Bùi Viện is car-free 19:00–02:00 on weekend nights. In 2016 Tuổi Trẻ reported a midnight closing rule; no current text was found, so go by the hours the clubs publish.',
    },
    music: {
      vi: 'Mainstage EDM, house, melodic techno và Vinahouse ở các phòng lớn; underground house và techno từng có nhà ở The Observatory, đóng cửa cuối tháng 10/2026; bass và drum & bass qua chuỗi Ravex và nhóm Nhạc Gãy.',
      en: 'Mainstage EDM, house, melodic techno and Vinahouse in the big rooms; underground house and techno had their home at The Observatory, closing at the end of October 2026; bass and drum & bass through the Ravex series and the Nhạc Gãy collective.',
    },
    prices: {
      vi: 'Ciné Saigon công bố giá: vé sự kiện 350.000–400.000 ₫ kèm 2 bia, nữ vào cửa miễn phí kèm một đồ uống mỗi tối, combo bàn 1.299.000 ₫ (thứ Hai–Năm) và 2.990.000 ₫ (thứ Sáu–Chủ nhật). Cocktail rooftop 199.000–280.000 ₫, bia khoảng 95.000 ₫.',
      en: 'Ciné Saigon publishes its prices: event tickets 350,000–400,000 ₫ with two beers, free entry and a drink for women every night, table combos 1,299,000 ₫ (Mon–Thu) and 2,990,000 ₫ (Fri–Sun). Rooftop cocktails run 199,000–280,000 ₫, beer about 95,000 ₫.',
    },
    home: {
      vi: 'Gọi Grab; ở Bùi Viện tối cuối tuần, hẹn tài xế đón trên Trần Hưng Đạo hoặc Cống Quỳnh vì xe không vào được 19:00–02:00. Metro số 1 dừng ở Bến Thành, cách Bùi Viện khoảng 800 m đi bộ.',
      en: 'Call a Grab; on Bùi Viện at weekends, meet the driver on Trần Hưng Đạo or Cống Quỳnh, since cars cannot enter between 19:00 and 02:00. Metro Line 1 stops at Bến Thành, about 800 m on foot from Bùi Viện.',
    },
    safety: {
      vi: 'Bóng cười là phạm pháp: tháng 8/2025 công an phường Bến Thành thu 348 bình quanh Bùi Viện. Xem giá đồ uống trên menu ở club lớn. Triều cường cuối tháng 10 và tháng 11 kèm mưa lớn có thể làm ngập Bùi Viện. Giữ điện thoại túi trước; mang giấy tờ, đủ 18 tuổi.',
      en: 'Laughing-gas balloons are illegal: in August 2025 Bến Thành ward police seized 348 cylinders around Bùi Viện. Check drink prices on the menu in the big clubs. Late-October and November king tides with heavy rain can flood Bùi Viện. Keep your phone in a front pocket; bring ID, 18+.',
    },
  },
  clubs: [
    {
      name: 'Ciné Saigon',
      tagline: { vi: 'superclub trong rạp chiếu bóng cũ', en: 'the superclub in an old cinema' },
      area: { vi: 'Quận 1, phường Bến Thành', en: 'District 1, Bến Thành ward' },
      address: '148 Cống Quỳnh, phường Bến Thành, TP.HCM',
      hours: { vi: 'Mỗi tối từ 21:00', en: 'Every night from 21:00' },
      music: { vi: 'House, techno, mainstage EDM, bass', en: 'House, techno, mainstage EDM, bass' },
      vibe: { vi: 'Superclub, 800 người, kiến trúc rạp hát', en: 'Superclub, 800 people, theatre architecture' },
      dress: { vi: 'Không công bố', en: 'Not published' },
      price: { vi: 'Vé sự kiện 350.000–400.000 ₫ kèm 2 bia; nữ miễn phí kèm 1 đồ uống', en: 'Event tickets 350,000–400,000 ₫ with 2 beers; women free with a drink' },
      url: 'https://cinesaigon.vn/',
      why: {
        vi: 'Ciné Saigon đứng trên nền rạp Thăng Long, nơi theo club có hơn 60 năm lịch sử, và giữ lại kiến trúc rạp hát: một phòng chính trần cao, tháp LED treo giữa phòng trên booth DJ, đèn 360 độ, sức chứa 800 người. Năm 2026 club vào thẳng vị trí 68 của DJ Mag Top 100 Clubs. DJ Mag mô tả nhạc là house, techno và hip-hop, với Paul van Dyk và Markus Schulz năm 2025; chuỗi "Roadtrip to Ciné" mời Tchami, Julian Jordan, Marnik, và Ravex là chuỗi lễ hội trong nhà (Gaztik, bass và drum & bass, 24/10/2026). Đây là club hiếm hoi ở Sài Gòn công bố giá rõ ràng trên trang của mình.',
        en: 'Ciné Saigon stands on the site of the Thăng Long cinema, which the club says had more than 60 years of history, and keeps its theatre architecture: one high-ceilinged main room, an LED tower hanging over the DJ booth, 360-degree lighting, room for 800. In 2026 it entered DJ Mag\'s Top 100 Clubs at No. 68. DJ Mag describes the music as house, techno and hip-hop, with Paul van Dyk and Markus Schulz in 2025; the "Roadtrip to Ciné" series brought Tchami, Julian Jordan and Marnik, and Ravex is its indoor-festival series (Gaztik, bass and drum & bass, 24 October 2026). It is one of the few Saigon clubs that publishes clear prices on its own site.',
      },
    },
    {
      name: 'APLUS Saigon',
      tagline: { vi: 'lễ hội trong nhà trên Võ Văn Kiệt', en: 'an indoor festival on Võ Văn Kiệt' },
      area: { vi: 'Quận 1, phường Cầu Ông Lãnh', en: 'District 1, Cầu Ông Lãnh ward' },
      address: '492 Võ Văn Kiệt, phường Cầu Ông Lãnh, TP.HCM',
      hours: { vi: 'Không công bố', en: 'Not published' },
      music: { vi: 'Mainstage EDM, house, melodic techno', en: 'Mainstage EDM, house, melodic techno' },
      vibe: { vi: 'Superclub, LED, hơn 1.000 người', en: 'Superclub, LED, 1,000+ people' },
      dress: { vi: 'Không công bố', en: 'Not published' },
      price: { vi: 'Không công bố', en: 'Not published' },
      url: 'https://www.instagram.com/aplus.saigon/',
      why: {
        vi: 'APLUS Saigon mở cửa tháng 1/2026 với hai tuần khai trương mời Dombresky (17/1, house) và Argy (23/1, melodic techno), và chỉ vài tháng sau đã vào vị trí 59 của DJ Mag Top 100 Clubs 2026. Phòng được dựng như một lễ hội trong nhà: tấm LED phủ kín, trần LED chuyển động trong lúc diễn, terrace VIP quanh sàn, hơn 1.000 khách, và hệ thống L-Acoustics L2 mà DJ Mag gọi là đầu tiên ở Việt Nam. Đây là chi nhánh của APLUS Hà Nội (hạng 67 năm 2025), nên chương trình cũng theo hướng đó: Tungevaag, Trisha Vu, WADE, KINGMCK, 2Spade. Club chưa công bố giờ mở và giá; xem Instagram trước khi đi.',
        en: 'APLUS Saigon opened in January 2026 with two soft-opening weekends headlined by Dombresky (17 January, house) and Argy (23 January, melodic techno), and within months stood at No. 59 in DJ Mag\'s Top 100 Clubs 2026. The room is built as an indoor festival: wall-to-wall LED panels, an LED ceiling that moves during sets, VIP terraces around the floor, more than 1,000 guests, and an L-Acoustics L2 system that DJ Mag calls the first in Vietnam. It is the sister of APLUS Hanoi (No. 67 in 2025), and the bookings follow the same line: Tungevaag, Trisha Vu, WADE, KINGMCK, 2Spade. It publishes no hours or prices yet; check Instagram before you go.',
      },
    },
    {
      name: 'POCPOC Garden',
      tagline: { vi: 'phòng kính với bể nước và nàng tiên cá', en: 'the glass room with a water tank and mermaids' },
      area: { vi: 'Quận 3, phường Xuân Hòa', en: 'District 3, Xuân Hòa ward' },
      address: '79A Nguyễn Đình Chiểu, phường Xuân Hòa, TP.HCM',
      hours: { vi: '17:00–02:00 (theo danh sách của Trip.com)', en: '17:00–02:00 (per Trip.com\'s listing)' },
      music: { vi: 'EDM mạnh, mainstage', en: 'Hard-edged EDM, mainstage' },
      vibe: { vi: 'Show diễn, 1.100 người', en: 'Show club, 1,100 people' },
      dress: { vi: 'Không công bố', en: 'Not published' },
      price: { vi: 'Không công bố', en: 'Not published' },
      url: 'https://www.instagram.com/pocpocgarden/',
      why: {
        vi: 'POCPOC Garden là một không gian đô thị bỏ trống năm 2020 trước khi thành club: phòng kính cao khoảng 8,5 m, một khu ngoài trời, sức chứa 1.100, và một bể nước lớn với show nàng tiên cá mỗi ngày. DJ Mag xếp club vào vị trí 81 năm 2024 rồi 73 năm 2025, mô tả nhạc thuộc "đầu mạnh của dance music", với khách EDM lớn và các nhóm nhảy từ Cuba. Hệ thống loa Martin Audio TORUS do Duc Pro Audio lắp tháng 3/2023, cùng một hệ thống tời trên trần cho các show hình ảnh. Đây là đêm của show diễn và EDM lớn, không phải phòng underground.',
        en: 'POCPOC Garden was a vacant urban space in 2020 before it became a club: a glass room about 8.5 m high, an outdoor area, room for 1,100, and a big water tank with a mermaid show every day. DJ Mag placed it at No. 81 in 2024 and No. 73 in 2025, describing its music as "the harder end of dance music", with big EDM guests and dance crews from Cuba. Its Martin Audio TORUS system was installed by Duc Pro Audio in March 2023, with a ceiling hoist for visual shows. It is a night of shows and big EDM, not an underground room.',
      },
    },
    {
      name: 'Canalis Club',
      tagline: { vi: 'Vinahouse và EDM đúng chất Sài Gòn', en: 'Vinahouse and EDM, Saigon style' },
      area: { vi: 'Quận 3, phường Xuân Hòa', en: 'District 3, Xuân Hòa ward' },
      address: '264Bis Nam Kỳ Khởi Nghĩa, phường Xuân Hòa, TP.HCM',
      hours: { vi: '21:00–03:00 mỗi ngày', en: '21:00–03:00 daily' },
      music: { vi: 'Vinahouse, EDM, hip-hop', en: 'Vinahouse, EDM, hip-hop' },
      vibe: { vi: 'Club Việt, laser, bàn VIP', en: 'Vietnamese club, lasers, VIP tables' },
      dress: { vi: 'Không công bố', en: 'Not published' },
      price: { vi: 'Bàn Standard, VIP và Super VIP; giá theo hotline', en: 'Standard, VIP and Super VIP tables; prices on request' },
      url: 'https://canalisclub.com/',
      why: {
        vi: 'Canalis là một định chế của kiểu club Việt Nam chứ không phải phòng underground: trang của club ghi "Vinahouse & EDM" với DJ khách, show laser và bàn VIP ba hạng, mở 21:00–03:00 mỗi tối và đông nhất quanh 23 giờ thứ Bảy. Vinahouse là dòng club nhanh của Việt Nam hình thành từ thập niên 1990, và nếu bạn muốn nghe nó trong căn phòng của nó, đêm "Vinahouse Night Fever" ở đây là nơi đó. Club không công bố giá, chỉ hotline 0903 435 267; hỏi giá combo trước khi ngồi. Nằm ở Nam Kỳ Khởi Nghĩa, cách POCPOC Garden vài phút đi bộ.',
        en: 'Canalis is an institution of the Vietnamese club scene rather than an underground room: its site says "Vinahouse & EDM", with guest DJs, laser shows and three tiers of VIP tables, open 21:00–03:00 every night and busiest around 23:00 on Saturdays. Vinahouse is Vietnam\'s fast club sound, born in the 1990s, and to hear it in its own room, the "Vinahouse Night Fever" nights here are the place. The club publishes no prices, only a hotline, 0903 435 267; ask for the combo price before you sit. It is on Nam Kỳ Khởi Nghĩa, a few minutes\' walk from POCPOC Garden.',
      },
    },
    {
      name: 'Lush',
      tagline: { vi: 'tên tuổi từ năm 2004', en: 'the name since 2004' },
      area: { vi: 'Quận 1, Lý Tự Trọng', en: 'District 1, Lý Tự Trọng' },
      address: '2 Lý Tự Trọng, Quận 1, TP.HCM',
      hours: { vi: 'Thứ Ba–Chủ nhật 21:00–05:00, nghỉ thứ Hai (theo hướng dẫn 11/2024)', en: 'Tue–Sun 21:00–05:00, closed Monday (per a Nov 2024 guide)' },
      music: { vi: 'EDM, hip-hop', en: 'EDM, hip-hop' },
      vibe: { vi: 'Sàn nhỏ, hai quầy bar ngoài trời', en: 'Small floor, two outdoor bars' },
      dress: { vi: 'Không công bố', en: 'Not published' },
      price: { vi: 'Không công bố', en: 'Not published' },
      url: 'https://www.instagram.com/lushsaigon/',
      why: {
        vi: 'Lush mở năm 2004 và là cái tên mà ai đi đêm Sài Gòn cũng nhắc: một sàn nhảy trong nhà nhỏ và hai quầy bar ngoài trời đông kín cuối tuần, cách trung tâm khoảng 5 phút taxi. Nhạc là EDM và hip-hop, thứ Ba là ladies\' night với đồ uống miễn phí cho nữ, một trong những tối đông nhất. Mixcloud năm 2022 xếp Lush cùng The Observatory và Piu Piu vào nhóm những nơi đầu tiên ở Sài Gòn đón văn hoá rave châu Âu, và Paul van Dyk từng chơi ở đây tháng 1/2020. Chúng tôi chưa đọc được trang nào năm 2025–2026 xác nhận lịch hiện tại, nên hãy kiểm tra Instagram của club trước khi đi.',
        en: 'Lush opened in 2004 and is the name everyone who goes out in Saigon mentions: a small indoor dancefloor and two outdoor bars that fill up at weekends, about five minutes by taxi from the centre. The music is EDM and hip-hop, and Tuesday is ladies\' night with free drinks for women, one of its busiest. Mixcloud in 2022 counted Lush with The Observatory and Piu Piu among the first Saigon venues to welcome European rave culture, and Paul van Dyk played it in January 2020. We found no page from 2025–2026 confirming its current schedule, so check the club\'s Instagram before you go.',
      },
    },
  ],
  extra: {
    vi: `## The Observatory: chia tay sau gần 13 năm

The Observatory, do Dan Bi Mong (Hibiya Line) lập năm 2013, là nhà của underground house và techno ở Sài Gòn qua ba địa điểm, với Giegling, Peter Van Hoesen và Wata Igarashi, và Resident Advisor từng viết về sinh nhật mười năm kéo dài cả tháng của họ. Club đóng cửa cuối tháng 10/2026; thứ Bảy 24/10 là một trong những đêm thứ Bảy lớn cuối cùng. Sau đó, techno và house underground của thành phố sẽ đi theo các nhóm như Nhạc Gãy và những đêm ở Ciné Saigon. Chúng tôi sẽ cập nhật bài này khi có nơi mới.`,
    en: `## The Observatory: goodbye after nearly 13 years

The Observatory, founded in 2013 by Dan Bi Mong (Hibiya Line), was the home of Saigon's underground house and techno across three venues, with Giegling, Peter Van Hoesen and Wata Igarashi, and Resident Advisor covered its month-long tenth birthday. It closes at the end of October 2026; Saturday 24 October is one of its final big Saturdays. After that, the city's underground techno and house will travel with collectives such as Nhạc Gãy and nights at Ciné Saigon. We will update this guide when a new room opens.`,
  },
  tips: {
    vi: [
      'Ở Ciné Saigon, mua vé early bird online: rẻ hơn 50.000 ₫ và đã gồm 2 bia.',
      'Cuối tuần Bùi Viện cấm xe từ 19 giờ: hẹn Grab ở Trần Hưng Đạo hoặc Cống Quỳnh.',
      'Ở Canalis và POCPOC, hỏi giá combo bàn trước khi ngồi; VAT và phí phục vụ có thể chưa gồm.',
      'Smart casual, không dép tông: phần lớn club từ chối dép.',
      'Mang giấy tờ bản gốc, đủ 18 tuổi.',
      'Tránh bóng cười: phạm pháp và bị kiểm tra thường xuyên quanh Bùi Viện.',
    ],
    en: [
      'At Ciné Saigon, buy the early-bird ticket online: 50,000 ₫ cheaper, with two beers included.',
      'Bùi Viện is car-free from 19:00 at weekends: meet your Grab on Trần Hưng Đạo or Cống Quỳnh.',
      'At Canalis and POCPOC, ask the table-combo price before you sit; VAT and service may be extra.',
      'Smart casual, no flip-flops: most clubs refuse them.',
      'Bring original ID; you must be 18.',
      'Skip the laughing gas: it is illegal and checked often around Bùi Viện.',
    ],
  },
  related: [
    { slug: 'club-ha-noi', line: { vi: 'Top club ở Hà Nội · Unmute, 1900 và phố cổ', en: 'Best clubs in Hanoi · Unmute, 1900 and the Old Quarter' } },
    { slug: 'club-da-nang', line: { vi: 'Top club ở Đà Nẵng · SAGA, Sky36 và bờ biển', en: 'Best clubs in Đà Nẵng · SAGA, Sky36 and the beach' } },
    { slug: 'club-edm-chau-a', line: { vi: 'Club EDM ở châu Á · cẩm nang 11 thành phố', en: 'EDM clubs in Asia · the 11-city guide' } },
    { slug: 'mainstage-edm', line: { vi: 'Mainstage EDM là gì? · âm thanh của các superclub', en: 'What is mainstage EDM? · the sound of the superclubs' } },
  ],
  facts: [
    { label: { vi: 'Số club', en: 'Clubs' }, value: { vi: '5, đang hoạt động tháng 10/2026', en: '5, open as of October 2026' } },
    { label: { vi: 'DJ Mag Top 100 Clubs', en: 'DJ Mag Top 100 Clubs' }, value: { vi: 'APLUS Saigon 59 và Ciné Saigon 68 (2026); POCPOC Garden 73 (2025)', en: 'APLUS Saigon 59 and Ciné Saigon 68 (2026); POCPOC Garden 73 (2025)' } },
    { label: { vi: 'Khu vực', en: 'Areas' }, value: { vi: 'Quận 1 (Bến Thành, Cầu Ông Lãnh) · Quận 3 (Xuân Hòa)', en: 'District 1 (Bến Thành, Cầu Ông Lãnh) · District 3 (Xuân Hòa)' } },
    { label: { vi: 'Nhạc', en: 'Music' }, value: { vi: 'Mainstage EDM, house, melodic techno, Vinahouse', en: 'Mainstage EDM, house, melodic techno, Vinahouse' } },
    { label: { vi: 'Giá vào cửa', en: 'Entry' }, value: { vi: 'Vé sự kiện ở Ciné 350.000–400.000 ₫ kèm 2 bia', en: 'Event tickets at Ciné 350,000–400,000 ₫ with 2 beers' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Club nào ở TP.HCM nổi tiếng nhất năm 2026?', en: 'Which Ho Chi Minh City club is best known in 2026?' }, a: { vi: 'Ba club có tên trong DJ Mag Top 100 Clubs: APLUS Saigon (59, 2026), Ciné Saigon (68, 2026) và POCPOC Garden (73, 2025). Canalis và Lush là hai tên tuổi lâu đời của kiểu club Việt.', en: 'Three clubs sit in DJ Mag\'s Top 100 Clubs: APLUS Saigon (59, 2026), Ciné Saigon (68, 2026) and POCPOC Garden (73, 2025). Canalis and Lush are the long-standing names of the Vietnamese club style.' } },
    { q: { vi: 'Nghe techno ở Sài Gòn ở đâu?', en: 'Where can I hear techno in Saigon?' }, a: { vi: 'The Observatory, nhà của underground techno và house từ 2013, đóng cửa cuối tháng 10/2026. Ciné Saigon có techno trong chương trình, và các nhóm như Nhạc Gãy tổ chức đêm riêng; xem lịch techno trên FeestFinder.', en: 'The Observatory, home of underground techno and house since 2013, closes at the end of October 2026. Ciné Saigon programmes techno, and collectives such as Nhạc Gãy run their own nights; see the techno listings on FeestFinder.' } },
    { q: { vi: 'Đi club TP.HCM tốn bao nhiêu?', en: 'How much does a club night in Saigon cost?' }, a: { vi: 'Ở Ciné Saigon vé sự kiện 350.000–400.000 ₫ kèm 2 bia, nữ vào miễn phí kèm một đồ uống; combo bàn từ 1.299.000 ₫. Cocktail rooftop 199.000–280.000 ₫.', en: 'At Ciné Saigon an event ticket is 350,000–400,000 ₫ with two beers, women enter free with a drink, and table combos start at 1,299,000 ₫. Rooftop cocktails cost 199,000–280,000 ₫.' } },
    { q: { vi: 'Club TP.HCM mở đến mấy giờ?', en: 'How late do Saigon clubs open?' }, a: { vi: 'Club công bố đến 2–3 giờ sáng (Canalis 03:00, POCPOC 02:00), Lush đến 4–5 giờ. Không tìm thấy văn bản hiện hành về giờ đóng cửa; hãy theo giờ club tự ghi.', en: 'Clubs publish closing at 2–3 am (Canalis 03:00, POCPOC 02:00), Lush 4–5 am. No current closing rule was found; go by the hours each club publishes.' } },
    { q: { vi: 'Đi club xong về bằng gì?', en: 'How do I get home after a club?' }, a: { vi: 'Grab là cách dễ nhất. Ở Bùi Viện tối cuối tuần, hẹn tài xế ở Trần Hưng Đạo hoặc Cống Quỳnh vì phố cấm xe 19:00–02:00.', en: 'Grab is the easiest way. On Bùi Viện at weekends, meet the driver on Trần Hưng Đạo or Cống Quỳnh, since the street is car-free 19:00–02:00.' } },
  ],
  sources: [
    { title: 'Ciné Saigon: events, tickets and tables', url: 'https://cinesaigon.vn/', publisher: 'Ciné Saigon' },
    { title: 'Top 100 Clubs 2026: No. 68 CINÉ Saigon', url: 'https://djmag.com/top100clubs/2026/68/cine-saigon', publisher: 'DJ Mag' },
    { title: 'Top 100 Clubs 2026: No. 59 APLUS Saigon', url: 'https://djmag.com/top100clubs/2026/59/aplus-saigon', publisher: 'DJ Mag' },
    { title: 'TORUS helps Vietnam\'s POC POC Garden remain in DJ Mag\'s top clubs', url: 'https://martin-audio.com/news/press-release/torus-helps-vietnams-poc-poc-garden-remain-in-dj-mags-top-clubs', publisher: 'Martin Audio' },
    { title: 'Canalis Club', url: 'https://canalisclub.com/', publisher: 'Canalis Club' },
    { title: 'Ho Chi Minh City club The Observatory rings in ten years', url: 'https://ra.co/news/79830', publisher: 'Resident Advisor' },
    { title: 'The fearless spirit of Saigon\'s underground scene', url: 'https://www.mixcloud.com/blog/2022/04/08/the-fearless-spirit-of-saigons-underground-scene/', publisher: 'Mixcloud' },
  ],
};

export const clubSaiGon = cityGuide(saiGon);
