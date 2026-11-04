import { cityGuide, type CityGuide } from './shared.ts';
import { CLUB_MEDIA } from './media.ts';

/** Kuala Lumpur (research 2026-10-22: Zouk KL closed in November 2020, so the list starts from the rooms open now). */
const kualaLumpur: CityGuide = {
  key: 'club-guides/kuala-lumpur',
  slug: 'club-kuala-lumpur',
  city: null,
  name: { vi: 'Kuala Lumpur', en: 'Kuala Lumpur' },
  title: {
    vi: 'Club ở Kuala Lumpur 2026: Kyo, Over & Above và khu TREC',
    en: 'Clubs in Kuala Lumpur 2026: Kyo, Over & Above and TREC',
  },
  excerpt: {
    vi: 'Đi club ở Kuala Lumpur năm 2026: Over & Above cho techno, Kyo và Pitt Club ở trung tâm, khu TREC mở đến 5 giờ sáng. Giờ mở, giá vé bằng ringgit, tuổi 21+ và Grab về nhà.',
    en: 'Clubbing in Kuala Lumpur in 2026: Over & Above for techno, Kyo and Pitt Club downtown, the TREC strip open till 5 am. Hours, ringgit prices, the 21+ rule and a Grab home.',
  },
  cover: CLUB_MEDIA.kualaLumpur[0],
  figure: {
    media: CLUB_MEDIA.kualaLumpur[1],
    alt: { vi: 'Phố Changkat Bukit Bintang trong mưa về đêm', en: 'Changkat Bukit Bintang at night in the rain' },
    caption: { vi: 'Changkat Bukit Bintang: dãy nhà phố cũ thành bar, cạnh Pisco Bar', en: 'Changkat Bukit Bintang: old shophouses turned bars, next to Pisco Bar' },
  },
  styles: ['techno', 'hard-techno', 'house', 'edm', 'mainstage'],
  lead: {
    vi: '**Club ở Kuala Lumpur** chia làm ba khu: TREC trên đường Tun Razak, mở đến 5 giờ sáng; Bukit Bintang và KLCC với Kyo, Pitt Club và Pisco Bar; và Chinatown với Over & Above, phòng techno của thành phố. Phần lớn các phòng chính chơi hip-hop, nên bài này chỉ giữ những nơi có nhạc điện tử thật sự, tháng 10/2026.',
    en: '**Kuala Lumpur\'s clubs** fall into three areas: TREC on Jalan Tun Razak, open until 5 am; Bukit Bintang and KLCC with Kyo, Pitt Club and Pisco Bar; and Chinatown with Over & Above, the city\'s techno room. Most main rooms play hip-hop, so this guide keeps only the places with real electronic music, as of October 2026.',
  },
  quick: {
    areas: {
      vi: 'TREC (438 Jalan Tun Razak) là khu club: năm khu với 24 điểm vui chơi, dãy Electric Boulevard là club. Tam giác vàng (Bukit Bintang/KLCC) có phố bar Changkat Bukit Bintang, Pisco Bar ở Jalan Mesui, Pitt Club ở Life Centre và Kyo dưới hầm Mandarin Oriental. Chinatown/Masjid Jamek có Over & Above. Bangsar (Jalan Telawi) là các bar nhỏ.',
      en: 'TREC (438 Jalan Tun Razak) is the club precinct: five zones with 24 venues, the Electric Boulevard strip being the clubs. The Golden Triangle (Bukit Bintang/KLCC) has the Changkat Bukit Bintang bar street, Pisco Bar on Jalan Mesui, Pitt Club in Life Centre and Kyo under the Mandarin Oriental. Chinatown/Masjid Jamek has Over & Above. Bangsar (Jalan Telawi) has the smaller bars.',
    },
    hours: {
      vi: 'Đêm club thường là 22:00–03:00 (Kyo thứ Tư–Chủ nhật 22:00–03:00); khu TREC và The Iron Fairies mở đến 05:00 từ thứ Tư đến Chủ nhật. Phòng đông từ khoảng 23:00 đến nửa đêm. Không thấy luật giờ đóng cửa chung: đây là giờ của từng nơi.',
      en: 'A club night usually runs 22:00–03:00 (Kyo Wednesday to Sunday 22:00–03:00); the TREC precinct and The Iron Fairies stay open until 05:00 from Wednesday to Sunday. Rooms fill from about 23:00 to midnight. No citywide closing law was found: these are each venue\'s own hours.',
    },
    music: {
      vi: 'Hip-hop và R&B dẫn đầu hầu hết các phòng chính. Nhạc điện tử nhỏ hơn nhưng rõ ràng: techno và hard techno ở Over & Above, house, techno và disco ở phòng Ren của Kyo, EDM big-room và house ở Pitt Club, và các đêm của nhóm tổ chức (Beatlab, Less Is More, Ohrwurm) ở The Iron Fairies và Pisco Bar.',
      en: 'Hip-hop and R&B lead most main rooms. The electronic circuit is smaller but clear: techno and hard techno at Over & Above, house, techno and disco in Kyo\'s Ren room, big-room EDM and house at Pitt Club, and promoter nights (Beatlab, Less Is More, Ohrwurm) at The Iron Fairies and Pisco Bar.',
    },
    prices: {
      vi: 'Ít club công bố giá. TREC không thu vé vào khu, nhưng các club thu phí vào cửa vào một số ngày; giá vào cửa Kyo công bố lần cuối là RM40 trước 01:00 và RM60 sau đó (2018). Đêm techno ở Over & Above bán vé qua Ticketmelon; bàn và chai phải đặt trước. Mọi con số đều cũ: hãy xem trang sự kiện.',
      en: 'Few clubs publish prices. TREC charges no precinct entry, but its clubs add cover on some nights; Kyo\'s last published cover was RM40 before 01:00 and RM60 after (2018). Techno nights at Over & Above sell through Ticketmelon; booths and bottles are by reservation. Every figure is dated: check the event page.',
    },
    home: {
      vi: 'Tàu LRT, MRT và Monorail chạy khoảng 06:00–23:00, chỉ kéo dài vào những đêm đặc biệt như Giao thừa và Merdeka. Sau nửa đêm là Grab: GrabCar và taxi có đồng hồ của Grab chạy 24/7 khắp Malaysia. TREC có bãi đỗ xe và dịch vụ đỗ hộ; lái xe khi say bị kiểm tra nồng độ và phạt nặng.',
      en: 'LRT, MRT and Monorail trains run about 06:00–23:00, extended only on special nights such as New Year\'s Eve and Merdeka. After midnight it is Grab: GrabCar and Grab\'s metered taxis run 24/7 across Malaysia. TREC has parking and valet service; drink-driving brings breath tests and heavy penalties.',
    },
    safety: {
      vi: 'Phải từ 21 tuổi: tuổi mua rượu hợp pháp ở Malaysia là 21 từ năm 2017; mang hộ chiếu. Đồ uống bị bỏ thuốc xảy ra cả ở bar uy tín và methanol không thể nếm ra, nên đừng rời mắt khỏi ly. Luật ma tuý rất nặng, cảnh sát có thể khám club đông khách nước ngoài và yêu cầu xét nghiệm. Cẩn thận giật túi quanh các khu bar.',
      en: 'Entry is 21 and over: Malaysia\'s legal purchase age for alcohol has been 21 since 2017; carry your passport. Drink spiking happens even in reputable bars and methanol cannot be tasted, so keep your glass in sight. Drug laws are severe, and police raid clubs popular with foreigners and may require a test. Watch for bag-snatching around the bar streets.',
    },
  },
  clubs: [
    {
      name: 'Over & Above KL',
      tagline: { vi: 'phòng techno của Kuala Lumpur', en: 'Kuala Lumpur\'s techno room' },
      area: { vi: 'Chinatown / Masjid Jamek', en: 'Chinatown / Masjid Jamek' },
      address: '53 Jalan Tun H.S. Lee, 50050 Kuala Lumpur',
      hours: { vi: 'Theo từng đêm (không công bố giờ cố định)', en: 'Per night (no fixed hours published)' },
      music: { vi: 'Techno, hard techno, hardstyle; melodic và drum & bass theo đêm', en: 'Techno, hard techno, hardstyle; melodic and drum & bass on concept nights' },
      vibe: { vi: 'Kiểu nhà kho, khách quốc tế', en: 'Warehouse-style, international guests' },
      dress: { vi: 'Không công bố', en: 'Not published' },
      price: { vi: 'Theo đêm, bán qua Ticketmelon', en: 'Per night, sold through Ticketmelon' },
      url: 'https://overandabove.com.my/',
      why: {
        vi: 'Over & Above nằm trong một toà nhà di sản ở Chinatown, ngay cạnh ga LRT Masjid Jamek, và là nơi duy nhất ở Kuala Lumpur đặt techno lên trước. Hai resident TCHUNO và MR YANG chơi techno, hard techno và hardstyle; lịch 2026 có Jeff Mills (Liquid Room, 31/5), Angerfist (Evo Asia, 16/1) và Darren Styles (30/5). FirstClasse (2026) gọi đây là sân khấu kiểu nhà kho thường có DJ quốc tế. Trang của club trích Mixmag mô tả mục tiêu trở thành "trung tâm của house và techno" với hệ thống âm thanh và hình ảnh hàng đầu. Hỏi đáp qua WhatsApp +60 10-655 1788.',
        en: 'Over & Above sits in a heritage building in Chinatown, right by Masjid Jamek LRT station, and is the one Kuala Lumpur venue that puts techno first. Residents TCHUNO and MR YANG play techno, hard techno and hardstyle; the 2026 calendar has had Jeff Mills (Liquid Room, 31 May), Angerfist (Evo Asia, 16 January) and Darren Styles (30 May). FirstClasse (2026) calls it a warehouse-style stage that often hosts international guests. The club\'s site quotes Mixmag on its aim to be "a key hub for house and techno" with top-tier sound and visual systems. Questions go to WhatsApp +60 10-655 1788.',
      },
    },
    {
      name: 'Kyo KL',
      tagline: { vi: 'house và techno dưới hầm Mandarin Oriental', en: 'house and techno under the Mandarin Oriental' },
      area: { vi: 'KLCC', en: 'KLCC' },
      address: 'Mandarin Oriental Kuala Lumpur, Basement Level 3, Kuala Lumpur City Centre, 50450 Kuala Lumpur',
      hours: { vi: 'Thứ Tư–Chủ nhật 22:00–03:00', en: 'Wed–Sun 22:00–03:00' },
      music: { vi: 'Phòng Ren: house, techno, disco; phòng chính: hip-hop, R&B', en: 'Ren room: house, techno, disco; main room: hip-hop, R&B' },
      vibe: { vi: 'Hai phòng, khoảng 770 người', en: 'Two rooms, about 770 people' },
      dress: { vi: 'Không công bố', en: 'Not published' },
      price: { vi: 'RM40 trước 01:00, RM60 sau đó (giá 2018); hiện không công bố', en: 'RM40 before 01:00, RM60 after (2018 prices); none published now' },
      url: 'https://clubkyokl.asia/',
      why: {
        vi: 'Kyo là chi nhánh Kuala Lumpur của club cùng tên ở Singapore, công bố tháng 6/2016 và mở dưới tầng hầm B3 của khách sạn Mandarin Oriental; khi Kyo Singapore đóng tháng 6/2017, đội ngũ chuyển hẳn sang chi nhánh này (Bandwagon). Khoảng 6.000 ft² trên hai tầng, sức chứa khoảng 770 (Time Out KL, 2019), phòng Ren có tranh Nhật và cửa shoji tre. Những năm đầu, Kyo mang về Seth Troxler, Dubfire và Pan-Pot với chính sách chỉ house và techno; nay phòng chính chơi hip-hop và R&B, còn phòng Ren giữ house, techno và disco. Vé qua TicketMelon hoặc WhatsApp, bàn đặt trước.',
        en: 'Kyo is the Kuala Lumpur branch of the Singapore club of the same name, announced in June 2016 and opened on Basement Level 3 of the Mandarin Oriental; when Kyo Singapore closed in June 2017, the team moved its focus here (Bandwagon). About 6,000 sq ft over two floors, around 770 capacity (Time Out KL, 2019), with Japanese art and bamboo shoji doors in the Ren room. In its early years Kyo brought Seth Troxler, Dubfire and Pan-Pot under a house-and-techno-only policy; today the main room plays hip-hop and R&B while Ren keeps house, techno and disco. Tickets through TicketMelon or WhatsApp, booths by reservation.',
      },
    },
    {
      name: 'Pitt Club KL',
      tagline: { vi: 'EDM big-room ở Bukit Bintang', en: 'big-room EDM in Bukit Bintang' },
      area: { vi: 'Bukit Bintang (Jalan Sultan Ismail)', en: 'Bukit Bintang (Jalan Sultan Ismail)' },
      address: '3rd Floor, Life Centre, 20 Jalan Sultan Ismail, 50250 Kuala Lumpur',
      hours: { vi: 'Thứ Tư–thứ Bảy (giờ không công bố)', en: 'Wed–Sat (hours not published)' },
      music: { vi: 'EDM, mainstage, house', en: 'EDM, mainstage, house' },
      vibe: { vi: 'Club lớn, đèn LED động', en: 'Big room, kinetic LED lighting' },
      dress: { vi: 'Không công bố', en: 'Not published' },
      price: { vi: 'Không công bố; đặt chỗ qua WhatsApp', en: 'Not published; RSVP on WhatsApp' },
      url: 'https://www.pittclubkl.com/',
      why: {
        vi: 'Pitt Club tự gọi mình là "club nhảy hàng đầu Malaysia": 15.000 ft² trên tầng ba của Life Centre, sàn nhảy lớn, khu sofa, hệ thống AV và đèn LED động (FirstClasse, 2026). Đây là nơi cho EDM lễ hội ở trung tâm thành phố, với khách mời mainstage như MORTEN, KAAZE, DBSTF và WUKONG trên trang của club, và lịch hằng tuần từ thứ Tư đến thứ Bảy. FirstClasse khuyên đặt chỗ trước một ngày; club nhận đặt chỗ qua WhatsApp. Trang có hình huy hiệu DJ Mag nhưng không ghi giải thưởng nào, nên chúng tôi không nêu thứ hạng.',
        en: 'Pitt Club calls itself "Malaysia\'s Ultimate Dance Club": 15,000 sq ft on the third floor of Life Centre, with a big dancefloor, a sofa deck, an AV system and kinetic LED lighting (FirstClasse, 2026). It is the downtown room for festival EDM, with mainstage guests such as MORTEN, KAAZE, DBSTF and WUKONG on the club\'s site and a weekly Wednesday-to-Saturday programme. FirstClasse advises booking a day ahead; the club takes RSVPs on WhatsApp. Its site shows a DJ Mag badge but names no award, so we quote no ranking.',
      },
    },
    {
      name: 'The Iron Fairies KL',
      tagline: { vi: 'nơi các nhóm underground tổ chức đêm', en: 'where the underground crews throw their nights' },
      area: { vi: 'TREC, Jalan Tun Razak', en: 'TREC, Jalan Tun Razak' },
      address: 'H-G-06, The Hive, TREC (Entry 3), 438 Jalan Tun Razak, 50400 Kuala Lumpur',
      hours: { vi: 'Thứ Ba 17:00–00:00; thứ Tư–Chủ nhật 17:00–05:00', en: 'Tue 17:00–00:00; Wed–Sun 17:00–05:00' },
      music: { vi: 'House, disco, techno; ban nhạc sống mỗi tối', en: 'House, disco, techno; a house band nightly' },
      vibe: { vi: 'Bar chủ đề, phòng Butterfly', en: 'Themed bar, the Butterfly Room' },
      dress: { vi: 'Không công bố', en: 'Not published' },
      price: { vi: 'Không công bố', en: 'Not published' },
      url: 'https://www.theironfairies.com/stores/iron-fairies-kl',
      why: {
        vi: 'The Iron Fairies mở tại TREC tháng 9/2018, do Ashley Sutton thiết kế với chi phí 12 triệu ringgit: 10.000 tiên sắt nhỏ trong trang trí, 50.000 con bướm trên trần phòng Butterfly và cầu thang xoắn lên tầng lửng của ban nhạc (Free Malaysia Today, 2019). Đây là chi nhánh lớn nhất của thương hiệu, nhìn ra tháp đôi Petronas. Không hẳn là club: ban nhạc chơi mỗi tối, còn DJ địa phương giữ phòng Butterfly với house, disco và techno. Trên Resident Advisor, năm 2026 đây là nơi các nhóm underground của KL dùng nhiều nhất: BEATLAB, The Bump, NoMind với Tissanai, Less Is More với STAU. Nhạc lên từ khoảng 23:00, nên đến sớm để tránh hàng.',
        en: 'The Iron Fairies opened at TREC in September 2018, designed by Ashley Sutton at a cost of RM12 million: 10,000 tiny iron fairies in the decor, 50,000 butterflies on the Butterfly Room ceiling and a spiral staircase to the band mezzanine (Free Malaysia Today, 2019). It is the brand\'s largest venue, looking out on the Petronas Twin Towers. It is not quite a club: a house band plays nightly, while local DJs take the Butterfly Room with house, disco and techno. On Resident Advisor it was the room KL\'s underground crews used most in 2026: BEATLAB, The Bump, NoMind with Tissanai, Less Is More with STAU. The music picks up around 23:00, so arrive early to skip the queue.',
      },
    },
    {
      name: 'Pisco Bar',
      tagline: { vi: 'sàn nhảy house trên tầng hai', en: 'a house dancefloor upstairs' },
      area: { vi: 'Bukit Bintang (Jalan Mesui)', en: 'Bukit Bintang (Jalan Mesui)' },
      address: '29 Jalan Mesui, Bukit Bintang, 50200 Kuala Lumpur',
      hours: { vi: 'Chủ nhật, thứ Ba–thứ Năm 17:00–02:00; thứ Sáu–thứ Bảy 17:00–03:00 (giờ công bố năm 2014)', en: 'Sun, Tue–Thu 17:00–02:00; Fri–Sat 17:00–03:00 (hours published in 2014)' },
      music: { vi: 'House, techno, nu-disco; DJ thứ Sáu và thứ Bảy', en: 'House, techno, nu-disco; DJs on Fridays and Saturdays' },
      vibe: { vi: 'Bar Peru dưới nhà, sàn nhảy trên lầu', en: 'Peruvian bar downstairs, dancefloor upstairs' },
      dress: { vi: 'Không công bố', en: 'Not published' },
      price: { vi: 'Không công bố', en: 'Not published' },
      url: 'https://ra.co/clubs/83420',
      why: {
        vi: 'Tầng trệt là quán ăn và bar kiểu Peru và Tây Ban Nha, tầng hai là sàn nhảy (Zafigo, 2022), với DJ vào thứ Sáu và thứ Bảy. Pisco Bar đã đón Crazy P, Archie Hamilton, Matthias Meyer và Jesse Rose, cùng những đêm open decks và chỉ chơi vinyl (New Rhythms, 2018), và năm 2026 vẫn có các đêm techno như Ohrwurm. Đây là nơi xuất hiện nhiều nhất trong mục "club chơi nhiều nhất" trên trang Resident Advisor của các DJ Kuala Lumpur. Club không có trang riêng: theo dõi lịch trên Resident Advisor. Giờ mở là của năm 2014, hãy kiểm tra trước khi đi.',
        en: 'The ground floor is a Peruvian and Spanish-influenced resto-bar, the second floor a dancefloor (Zafigo, 2022), with DJs on Fridays and Saturdays. Pisco Bar has hosted Crazy P, Archie Hamilton, Matthias Meyer and Jesse Rose, along with open-decks and vinyl-only nights (New Rhythms, 2018), and in 2026 it still runs techno nights such as Ohrwurm\'s. It is the venue that appears most under "clubs most played" on Kuala Lumpur DJs\' Resident Advisor pages. It has no site of its own: follow it on Resident Advisor. The hours date from 2014, so check before you go.',
      },
    },
    {
      name: '404 Club Not Found',
      tagline: { vi: 'micro-club trên Electric Boulevard', en: 'the micro-club on Electric Boulevard' },
      area: { vi: 'TREC, Jalan Tun Razak', en: 'TREC, Jalan Tun Razak' },
      address: 'E-1-01, Electric Boulevard, TREC, 438 Jalan Tun Razak, 50400 Kuala Lumpur',
      hours: { vi: 'Không công bố', en: 'Not published' },
      music: { vi: 'EDM, house, trap, hip-hop', en: 'EDM, house, trap, hip-hop' },
      vibe: { vi: 'Micro-club tối, chú trọng âm thanh và hình ảnh', en: 'Dark micro-club, audiovisual focus' },
      dress: { vi: 'Không công bố', en: 'Not published' },
      price: { vi: 'Không công bố', en: 'Not published' },
      url: 'https://www.trec.com.my/directory',
      why: {
        vi: '404 là chi nhánh Malaysia đầu tiên của một chuỗi micro-club Trung Quốc có hơn 30 điểm, với không gian tối và nhạc EDM, house, trap và hip-hop (FirstClasse, 2026). TREC xếp nó vào loại lounge sang trọng (điện thoại +6018 766 8404), và danh bạ Trip.com 2026 ghi nhận hệ thống âm thanh và hình ảnh. Đây là lựa chọn EDM thương mại ở TREC; chưa có giờ hay giá công bố, hãy gọi trước.',
        en: '404 is the first Malaysian outpost of a Chinese micro-club chain with more than 30 venues, a dark room playing EDM, house, trap and hip-hop (FirstClasse, 2026). TREC files it as a luxury lounge (phone +6018 766 8404), and Trip.com\'s 2026 directory notes its audiovisual set-up. It is TREC\'s commercial EDM choice; no hours or prices are published, so call ahead.',
      },
    },
    {
      name: 'NONO Club KL',
      tagline: { vi: 'club mới nhất của TREC (cần kiểm tra)', en: 'TREC\'s newest club (to be checked)' },
      area: { vi: 'TREC, Jalan Tun Razak', en: 'TREC, Jalan Tun Razak' },
      address: 'Electric Boulevard, TREC, 438 Jalan Tun Razak, 50400 Kuala Lumpur',
      hours: { vi: 'Thứ Tư, thứ Sáu, thứ Bảy (giờ không công bố)', en: 'Wed, Fri, Sat (hours not published)' },
      music: { vi: 'EDM, house, techno', en: 'EDM, house, techno' },
      vibe: { vi: 'Nhiều phòng, sàn nhảy nảy', en: 'Several rooms, a bouncing dancefloor' },
      dress: { vi: 'Không công bố', en: 'Not published' },
      price: { vi: 'Không công bố', en: 'Not published' },
      url: 'https://www.trec.com.my/dance-clubs',
      why: {
        vi: 'TREC giới thiệu NONO là club nhảy mới nhất của khu: nhiều phòng, mỗi phòng một âm thanh, DJ resident và quốc tế, mở thứ Tư, thứ Sáu và thứ Bảy, với "sàn nhảy thiết kế" có độ nảy. Chúng tôi chưa tìm thấy bài báo hay trang riêng nào về NONO, nên thông tin chỉ đến từ TREC: hãy xem như một gợi ý cần kiểm tra (điện thoại +6011 1198 1919).',
        en: 'TREC presents NONO as the precinct\'s newest dance club: several rooms, each with its own sound, resident and international DJs, open Wednesday, Friday and Saturday, with a "designer dance floor" that bounces. We found no press coverage or page of its own, so everything here comes from TREC: treat it as a lead to check (phone +6011 1198 1919).',
      },
    },
  ],
  extra: {
    vi: `## Zouk KL và những cái tên đã đóng

Nhiều cẩm nang vẫn nhắc Zouk KL, nhưng club này đã đóng hẳn vào tháng 11/2020 sau đợt đóng cửa vì dịch. Toà nhà ở số 436 Jalan Tun Razak mở lại năm 2022 với tên Spark Club, song chúng tôi không xác minh được Spark còn hoạt động năm 2026, nên không đưa vào danh sách. Play Club ở Bandar Utama đã đóng; Vertigo là bar sân thượng, W Club là club ban nhạc sống, và Hakkasan không có chi nhánh ở Kuala Lumpur. Nếu bạn biết một phòng nhạc điện tử đang mở mà chúng tôi bỏ sót, hãy gửi góp ý.`,
    en: `## Zouk KL and the names that closed

Many guides still mention Zouk KL, but it closed for good in November 2020 after the pandemic shutdown. The building at 436 Jalan Tun Razak reopened in 2022 as Spark Club, but we could not verify that Spark is still running in 2026, so it is not on the list. Play Club in Bandar Utama has closed; Vertigo is a rooftop bar, W Club a live-band club, and Hakkasan has no Kuala Lumpur venue. If you know an electronic room that is open and missing here, send us feedback.`,
  },
  tips: {
    vi: [
      'Mang hộ chiếu: mọi club đều giới hạn 21+.',
      'Theo dõi Over & Above trên Ticketmelon, The Iron Fairies và Pisco Bar trên Resident Advisor.',
      'Đến trước 23:00 ở The Iron Fairies và Kyo để tránh hàng.',
      'Tàu dừng khoảng 23:00: dùng GrabCar hoặc taxi đồng hồ của Grab để về.',
      'Giữ ly trong tầm mắt và tránh mọi chất cấm: luật Malaysia rất nặng.',
    ],
    en: [
      'Carry your passport: every club is 21+.',
      'Follow Over & Above on Ticketmelon, The Iron Fairies and Pisco Bar on Resident Advisor.',
      'Arrive before 23:00 at The Iron Fairies and Kyo to skip the queue.',
      'Trains stop around 23:00: take GrabCar or Grab\'s metered taxis home.',
      'Keep your glass in sight and stay away from any drugs: Malaysian law is severe.',
    ],
  },
  related: [
    { slug: 'club-singapore', line: { vi: 'Top club ở Singapore · Marquee, CÉ LA VI và Tanjong Pagar', en: 'Best clubs in Singapore · Marquee, CÉ LA VI and Tanjong Pagar' } },
    { slug: 'club-edm-chau-a', line: { vi: 'Club EDM ở châu Á · cẩm nang 11 thành phố', en: 'EDM clubs in Asia · the 11-city guide' } },
    { slug: 'techno', line: { vi: 'Techno là gì? · âm thanh của Over & Above', en: 'What is techno? · the sound of Over & Above' } },
    { slug: 'hardstyle', line: { vi: 'Hardstyle là gì? · những đêm Angerfist và Darren Styles', en: 'What is hardstyle? · the Angerfist and Darren Styles nights' } },
  ],
  facts: [
    { label: { vi: 'Số địa điểm', en: 'Venues' }, value: { vi: '7, tháng 10/2026', en: '7, October 2026' } },
    { label: { vi: 'Khu vực', en: 'Areas' }, value: { vi: 'TREC · Bukit Bintang/KLCC · Chinatown', en: 'TREC · Bukit Bintang/KLCC · Chinatown' } },
    { label: { vi: 'Độ tuổi', en: 'Age' }, value: { vi: '21+', en: '21+' } },
    { label: { vi: 'Giờ', en: 'Hours' }, value: { vi: '22:00–03:00; TREC đến 05:00', en: '22:00–03:00; TREC until 05:00' } },
    { label: { vi: 'Về nhà', en: 'Getting home' }, value: { vi: 'Tàu 06:00–23:00; sau đó Grab', en: 'Rail 06:00–23:00; then Grab' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Club techno nào ở Kuala Lumpur?', en: 'Where is techno in Kuala Lumpur?' }, a: { vi: 'Over & Above ở 53 Jalan Tun H.S. Lee, Chinatown, là phòng techno chính, với Jeff Mills và Angerfist năm 2026. Phòng Ren của Kyo và các đêm ở Pisco Bar, The Iron Fairies cũng chơi house và techno.', en: 'Over & Above at 53 Jalan Tun H.S. Lee, Chinatown, is the main techno room, with Jeff Mills and Angerfist in 2026. Kyo\'s Ren room and the nights at Pisco Bar and The Iron Fairies play house and techno too.' } },
    { q: { vi: 'Zouk KL còn mở không?', en: 'Is Zouk KL still open?' }, a: { vi: 'Không. Zouk KL đóng hẳn tháng 11/2020. Toà nhà mở lại năm 2022 với tên Spark Club, nhưng chưa xác minh được Spark còn hoạt động năm 2026.', en: 'No. Zouk KL closed for good in November 2020. The building reopened in 2022 as Spark Club, but Spark could not be verified as open in 2026.' } },
    { q: { vi: 'Đi club ở Kuala Lumpur cần bao nhiêu tuổi?', en: 'What is the clubbing age in Kuala Lumpur?' }, a: { vi: '21 tuổi: tuổi mua rượu hợp pháp ở Malaysia là 21 từ năm 2017. Mang hộ chiếu.', en: '21: Malaysia\'s legal purchase age for alcohol has been 21 since 2017. Carry your passport.' } },
    { q: { vi: 'Club ở Kuala Lumpur mở đến mấy giờ?', en: 'How late do Kuala Lumpur clubs open?' }, a: { vi: 'Thường đến 03:00; khu TREC và The Iron Fairies mở đến 05:00 từ thứ Tư đến Chủ nhật.', en: 'Usually until 03:00; the TREC precinct and The Iron Fairies stay open until 05:00 from Wednesday to Sunday.' } },
    { q: { vi: 'Về nhà sau club ở Kuala Lumpur thế nào?', en: 'How do I get home after a club in Kuala Lumpur?' }, a: { vi: 'Tàu chạy khoảng 06:00–23:00, nên sau nửa đêm hãy dùng GrabCar hoặc taxi có đồng hồ qua Grab, chạy 24/7.', en: 'Trains run about 06:00–23:00, so after midnight use GrabCar or a metered taxi through Grab, available 24/7.' } },
  ],
  sources: [
    { title: '13 hottest nightclubs in KL you\'ll never get bored of', url: 'https://firstclasse.com.my/hottest-nightclubs-kl/', publisher: 'FirstClasse' },
    { title: 'The best clubs for dancing in KL', url: 'https://www.timeout.com/kuala-lumpur/nightlife/best-clubs-for-dancing-in-kl', publisher: 'Time Out Kuala Lumpur' },
    { title: 'Post-pandemic partying: 5 KL clubs for a night out', url: 'https://zafigo.com/travel/zafigo-stories/20221209-partying-kl-clubs-night-out/', publisher: 'Zafigo' },
    { title: 'Myth and mayhem reign supreme at The Iron Fairies KL', url: 'https://www.freemalaysiatoday.com/category/leisure/2019/05/08/myth-and-mayhem-reign-supreme-at-the-iron-fairies-kl/', publisher: 'Free Malaysia Today' },
    { title: 'Club Kyo to open in Kuala Lumpur', url: 'https://bandwagon.asia/articles/club-kyo-to-open-in-kuala-lumpur', publisher: 'Bandwagon' },
    { title: 'Zouk officially reopens, now called Spark Club KL', url: 'https://says.com/my/lifestyle/zouk-officially-reopens-now-called-spark-club-kl', publisher: 'SAYS' },
    { title: 'A traveller\'s guide to electronic music in Kuala Lumpur', url: 'https://newrhythmsmusic.com/2018/03/27/a-travellers-guide-to-electronic-music-in-kuala-lumpur/', publisher: 'New Rhythms' },
  ],
};

export const clubKualaLumpur = cityGuide(kualaLumpur);
