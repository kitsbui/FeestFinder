import { cityGuide, type CityGuide } from './shared.ts';
import { CLUB_MEDIA } from './media.ts';

/** Shenzhen (research 2026-10-22: only four venues could be verified open; the guide says so rather than padding the list). */
const shenzhen: CityGuide = {
  key: 'club-guides/tham-quyen',
  slug: 'club-tham-quyen',
  city: null,
  name: { vi: 'Thâm Quyến', en: 'Shenzhen' },
  title: {
    vi: 'Club ở Thâm Quyến 2026: OIL, Jade, PLAY X và Futian',
    en: 'Clubs in Shenzhen 2026: OIL, Jade, PLAY X and Futian',
  },
  excerpt: {
    vi: 'Đi club ở Thâm Quyến năm 2026: OIL cho techno underground, Jade và PLAY X cho EDM lớn, Bar Mine cho sàn disco. Khu Futian, giờ mở, giá vé bằng tệ và cách về nhà.',
    en: 'Clubbing in Shenzhen in 2026: OIL for underground techno, Jade and PLAY X for big-room EDM, Bar Mine for a disco floor. Futian, hours, yuan prices and getting home.',
  },
  cover: CLUB_MEDIA.shenzhen[0],
  figure: {
    media: CLUB_MEDIA.shenzhen[1],
    alt: { vi: 'Trung tâm hành chính Thâm Quyến về đêm nhìn từ núi Liên Hoa', en: 'Shenzhen\'s Civic Center at night from Lianhua Mountain' },
    caption: { vi: 'Futian về đêm: khu tập trung club lớn và OIL', en: 'Futian at night: home of the big clubs and OIL' },
  },
  styles: ['techno', 'house', 'edm', 'mainstage', 'progressive-house'],
  lead: {
    vi: '**Club ở Thâm Quyến** gói gọn trong quận Futian: OIL, phòng underground của thành phố từ năm 2017, và hai mega-club Jade và PLAY X với EDM lớn. Chúng tôi chỉ xác minh được bốn địa điểm đang mở năm 2026, nên bài này giới thiệu đúng bốn nơi đó, thêm khu vực, giờ, giá và cách về nhà.',
    en: '**Shenzhen\'s clubs** sit almost entirely in Futian: OIL, the city\'s underground room since 2017, and two mega-clubs, Jade and PLAY X, for big-room EDM. We could verify only four venues open in 2026, so this guide covers exactly those four, with the areas, hours, prices and the way home.',
  },
  quick: {
    areas: {
      vi: 'Futian: dải Coco Park / Shopping Park (khu mua sắm ngoài trời với hơn 50 bar, club và quán khuya, ga tuyến 1/3 cửa C) cho club thương mại; khu Chegongmiao / Tairan Road phía tây cho OIL; Jade ở khu CBD. Shekou (Nam Sơn) là khu pub và ban nhạc sống; OCT-LOFT là khu nghệ thuật. Các khu cách nhau 30–50 phút đi xe.',
      en: 'Futian: the Coco Park / Shopping Park strip (an outdoor mall with 50+ bars, clubs and late eateries, Line 1/3 exit C) for the commercial clubs; the Chegongmiao / Tairan Road blocks to the west for OIL; Jade in the CBD. Shekou (Nanshan) is pubs and live bands; OCT-LOFT is the arts quarter. The districts are 30–50 minutes apart by road.',
    },
    hours: {
      vi: 'Club mở đến khoảng 2–3 giờ ngày thường và 4–6 giờ cuối tuần; Jade mở thứ Tư–Chủ nhật 23:00–06:00; các đêm của OIL trên Resident Advisor bắt đầu 20:00 hoặc 22:00 và kết thúc 05:00. Không tìm thấy quy định giờ đóng cửa chung.',
      en: 'Clubs run to about 2–3 am on weekdays and 4–6 am at weekends; Jade opens Wednesday to Sunday 23:00–06:00; OIL\'s nights on Resident Advisor start at 20:00 or 22:00 and end at 05:00. No citywide last call was found.',
    },
    music: {
      vi: 'OIL chơi techno (thô, industrial, hardgroove), house, electro, bass và drum & bass; Jade và PLAY X là EDM, big-room progressive house và trance, PLAY X còn có phòng techno XLAB; Coco Park là nhạc thương mại.',
      en: 'OIL plays techno (raw, industrial, hardgroove), house, electro, bass and drum & bass; Jade and PLAY X are EDM, big-room progressive house and trance, and PLAY X has a techno room, XLAB; Coco Park is commercial.',
    },
    prices: {
      vi: 'Vé OIL trên Resident Advisor ¥100–120 (tháng 10/2026). Mega-club thường miễn phí vào cửa nhưng có mức tối thiểu cho bàn cao; Jade và PLAY X đặt bàn qua WeChat, giá không công bố.',
      en: 'OIL\'s tickets on Resident Advisor are ¥100–120 (October 2026). The mega-clubs are often free to enter but set high table minimums; Jade and PLAY X take table bookings on WeChat, with no published prices.',
    },
    home: {
      vi: 'Metro Thâm Quyến chạy khoảng 06:30–23:00, chuyến cuối tuyến 1 từ Shopping Park lúc 23:16–23:52. Sau đó là taxi hoặc DiDi; cài Alipay hoặc WeChat Pay với thẻ quốc tế trước.',
      en: 'The Shenzhen Metro runs about 06:30–23:00, with Line 1\'s last trains from Shopping Park at 23:16–23:52. After that it is a taxi or DiDi; set up Alipay or WeChat Pay with a foreign card first.',
    },
    safety: {
      vi: 'Ma tuý bị xử lý không khoan nhượng; cảnh sát có thể kiểm tra giấy tờ và xét nghiệm. Đừng để đồ uống không trông, chỉ đi taxi có đồng hồ, luôn mang hộ chiếu bản gốc. Jade dùng nhận diện khuôn mặt cho bàn đặt trước, liên kết với tài khoản WeChat hoặc Alipay đã xác minh.',
      en: 'Drugs carry zero tolerance; police may check IDs and test. Never leave a drink unattended, take metered taxis only, always carry your original passport. Jade uses facial recognition for booked tables, linked to a verified WeChat or Alipay account.',
    },
  },
  clubs: [
    {
      name: 'OIL Club',
      tagline: { vi: 'phòng underground của Thâm Quyến từ 2017', en: 'Shenzhen\'s underground room since 2017' },
      area: { vi: 'Futian, Chegongmiao / Tairan Road', en: 'Futian, Chegongmiao / Tairan Road' },
      address: '11A, G/F, Tairan Mansion, Tairan 8th Road, Futian District, Shenzhen',
      hours: { vi: 'Đêm trên Resident Advisor 20:00 hoặc 22:00 đến 05:00', en: 'Resident Advisor nights 20:00 or 22:00 to 05:00' },
      music: { vi: 'Techno, industrial, house, electro, bass, drum & bass', en: 'Techno, industrial, house, electro, bass, drum & bass' },
      vibe: { vi: 'Underground, 300 người', en: 'Underground, 300 people' },
      dress: { vi: 'Không công bố', en: 'Not published' },
      price: { vi: '¥100–120 vé bán trước (10/2026)', en: '¥100–120 advance (October 2026)' },
      url: 'https://de.ra.co/clubs/143168',
      why: {
        vi: 'OIL mở năm 2017 và được hướng dẫn của Cathay Pacific (12/2025) gọi là "ngôi đền cho người mê nhạc điện tử", nơi đã thay karaoke và set DJ thương mại bằng những booking tiên phong suốt tám năm. Sức chứa 300; người đồng sáng lập là DJ Yangyang, cũng là người đứng sau các nhóm Silicon Kure, TURMOIL và FAR Radio. Năm 2019 Goldthread của SCMP coi OIL là địa điểm dẫn đầu làn sóng techno của Thâm Quyến, và tháng 11/2024 club tổ chức Boiler Room Shenzhen. Nhạc là techno thô, industrial và hardgroove, house, electro, bass, jungle và drum & bass, với các nhóm địa phương (Knot, ROOMTOO, NEO ILLUSION) và khách quốc tế như RP Boo, SPFDJ, Ben UFO, Schwefelgelb. Tháng 10/2026 OIL là địa điểm duy nhất ở Thâm Quyến có sự kiện sắp tới trên trang thành phố của Resident Advisor.',
        en: 'OIL opened in 2017, and Cathay Pacific\'s December 2025 guide calls it "a temple for electronic music devotees" that replaced karaoke and commercial DJ sets with cutting-edge bookings over eight years. It holds 300; its co-founder is DJ Yangyang, also behind the Silicon Kure and TURMOIL crews and FAR Radio. In 2019 SCMP\'s Goldthread named OIL the leading venue of Shenzhen\'s techno rise, and in November 2024 it hosted Boiler Room Shenzhen. The music is raw, industrial and hardgroove techno, house, electro, bass, jungle and drum & bass, with local crews (Knot, ROOMTOO, NEO ILLUSION) and guests such as RP Boo, SPFDJ, Ben UFO and Schwefelgelb. In October 2026 it was the only Shenzhen venue with upcoming events on Resident Advisor\'s city guide.',
      },
    },
    {
      name: 'PLAY X Shenzhen',
      tagline: { vi: 'mega-club hạng 27 DJ Mag', en: 'the mega-club at DJ Mag No. 27' },
      area: { vi: 'Thâm Quyến (địa chỉ chưa công bố)', en: 'Shenzhen (address not published)' },
      address: 'Shenzhen (địa chỉ không có trong các nguồn đã đọc; vé và bàn qua WeChat PLAY_X_Official)',
      hours: { vi: 'Không công bố', en: 'Not published' },
      music: { vi: 'EDM, big-room progressive, trance; techno ở XLAB', en: 'EDM, big-room progressive, trance; techno in XLAB' },
      vibe: { vi: 'Mega-club, 3.000 người, bốn phòng', en: 'Mega-club, 3,000 people, four rooms' },
      dress: { vi: 'Không công bố', en: 'Not published' },
      price: { vi: 'Không công bố; đặt qua WeChat', en: 'Not published; book on WeChat' },
      url: 'https://djmag.com/top100clubs/2026/27/play-x',
      why: {
        vi: 'PLAY X đứng hạng 27 trong DJ Mag Top 100 Clubs 2026, thứ hạng cao nhất của club này, với sức chứa 3.000 người. DJ Mag mô tả loa NEXO thiết kế riêng, ánh sáng điều khiển bằng AI và đôi khi cả hình chiếu ba chiều, cùng những hợp tác với Tomorrowland và Creamfields, và gọi club là "điểm khởi đầu của các hợp tác quốc tế ở miền Nam Trung Quốc". Bốn phòng: Main Room (PLAY X LIVE, EDM), Golden Face Lounge, LeBaron (hip-hop) và XLAB (techno). Tháng 9/2026 có Matisse & Sadko, Mike Williams và HNTR; Armin van Buuren và Steve Aoki đã từng chơi. Club cùng thương hiệu với PLAY X Thành Đô. Địa chỉ chưa có trong các nguồn đã đọc; vé và bàn đặt qua tài khoản WeChat PLAY_X_Official.',
        en: 'PLAY X stands at No. 27 in DJ Mag\'s Top 100 Clubs 2026, its best rank, with room for 3,000. DJ Mag describes bespoke NEXO speakers, AI-driven lighting and occasional holographic projections, partnerships with Tomorrowland and Creamfields, and calls it "ground zero for international collaborations in southern China". Four rooms: the Main Room (PLAY X LIVE, EDM), Golden Face Lounge, LeBaron (hip-hop) and XLAB (techno). September 2026 brought Matisse & Sadko, Mike Williams and HNTR; Armin van Buuren and Steve Aoki have played. It shares its brand with PLAY X Chengdu. Its address is not in any source we read; tickets and tables go through the WeChat account PLAY_X_Official.',
      },
    },
    {
      name: 'Jade',
      tagline: { vi: 'mega-club EDM ở khu CBD', en: 'the EDM mega-club in the CBD' },
      area: { vi: 'Futian CBD, Excellence Times Square', en: 'Futian CBD, Excellence Times Square' },
      address: '10, Phase II, Excellence Times Square, No 8 Central 3rd Road, Fu\'an Community, Futian District, Shenzhen',
      hours: { vi: 'Thứ Tư–Chủ nhật 23:00–06:00', en: 'Wed–Sun 23:00–06:00' },
      music: { vi: 'Progressive house, EDM, mainstage', en: 'Progressive house, EDM, mainstage' },
      vibe: { vi: 'Mega-club, nhận diện khuôn mặt', en: 'Mega-club, facial-recognition entry' },
      dress: { vi: 'Không công bố', en: 'Not published' },
      price: { vi: 'Không công bố; bàn qua WeChat jadesz888', en: 'Not published; tables via WeChat jadesz888' },
      url: 'https://www.cathaypacific.com/cx/en_CN/inspiration/dining/best-shenzhen-bars.html',
      why: {
        vi: 'Jade là một thương hiệu club Trung Quốc ra mắt ở Thành Đô cuối năm 2024 và mở chi nhánh Thâm Quyến đầu năm 2025, trong khu Excellence Times Square ở trung tâm Futian. Đây là mặt đối lập của OIL: một mega-club chơi progressive house và EDM lễ hội cho đám đông lớn, có liên kết với label STMPD RCRDS của Martin Garrix, và đã mời Matisse & Sadko, DubVision, Third Party và Will Sparks. Mở thứ Tư đến Chủ nhật, 23:00–06:00. Bàn đặt qua tài khoản WeChat jadesz888, và khách có bàn vào bằng nhận diện khuôn mặt, liên kết hồ sơ WeChat hoặc Alipay đã xác minh với mini-program của club trước khi đến. Giá vào và giá bàn chưa được công bố.',
        en: 'Jade is a Chinese club brand that debuted in Chengdu at the end of 2024 and opened in Shenzhen in early 2025, in Excellence Times Square in the heart of Futian. It is OIL\'s opposite: a mega-club playing progressive house and festival EDM to a big crowd, with ties to Martin Garrix\'s label STMPD RCRDS, and it has hosted Matisse & Sadko, DubVision, Third Party and Will Sparks. It opens Wednesday to Sunday, 23:00–06:00. Tables are booked through the WeChat account jadesz888, and booked guests enter by facial recognition, linking a verified WeChat or Alipay profile to the club\'s mini-program before arriving. Entry and table prices are not published.',
      },
    },
    {
      name: 'Bar Mine',
      tagline: { vi: 'quán cocktail có sàn disco, không phải club', en: 'a cocktail bar with a disco floor, not a club' },
      area: { vi: 'Nam Sơn, Yuehai (gần cửa khẩu vịnh Thâm Quyến)', en: 'Nanshan, Yuehai (near the Shenzhen Bay checkpoint)' },
      address: '1/F, Kaledo, 4 Wenxin 6th Road, Haizhu Community, Yuehai, Nanshan District, Shenzhen',
      hours: { vi: 'Không công bố', en: 'Not published' },
      music: { vi: 'Disco, party', en: 'Disco, party' },
      vibe: { vi: 'Cà phê ban ngày, disco ban đêm', en: 'Café by day, disco by night' },
      dress: { vi: 'Không công bố', en: 'Not published' },
      price: { vi: 'Không công bố', en: 'Not published' },
      url: 'https://www.cathaypacific.com/cx/en_CN/inspiration/dining/best-shenzhen-bars.html',
      why: {
        vi: 'Bar Mine mở nửa cuối năm 2025 gần cửa khẩu vịnh Thâm Quyến, với chủ đề "cuộc thám hiểm hầm mỏ": một lounge bên ngoài thoải mái và một sàn nhảy khép kín ở giữa "biến thành xứ sở quả cầu disco vào ban đêm", theo Cathay Pacific. Ban ngày là quán cà phê, tối là cocktail và disco. Chúng tôi đưa vào vì đây là một trong số ít địa điểm có sàn nhảy mới và đã xác minh ở Nam Sơn, nhưng nói rõ: không có lịch DJ hay dòng nhạc được công bố, và đây không phải club điện tử. Nếu bạn ở phía Nam Sơn và muốn nhảy nhẹ trước khi sang Futian, đây là lựa chọn.',
        en: 'Bar Mine opened in the second half of 2025 near the Shenzhen Bay checkpoint, on a "mining expedition" theme: a relaxed outer lounge and an enclosed central dancefloor that "flips into a glitterball wonderland at night", in Cathay Pacific\'s words. It is a coffee bar by day, cocktails and disco after dark. We include it because it is one of the few new, verified dancefloors in Nanshan, but to be clear: it publishes no DJ programme or music policy, and it is not an electronic club. If you are on the Nanshan side and want a light dance before heading to Futian, this is the option.',
      },
    },
  ],
  extra: {
    vi: `## Vì sao chỉ có bốn nơi

Chúng tôi đã kiểm tra hơn mười cái tên thường được nhắc. B10 Live ở OCT-LOFT là live house, lịch tháng 10–12/2026 là jazz, indie và nhạc thể nghiệm, không có đêm DJ. Pepper Club và LAX Club đã đóng năm 2024. Superface từng đứng hạng 55 DJ Mag năm 2020 nhưng không còn trong danh sách 2022–2026 và không có sự kiện 2025–2026. Sector, CLUB WHY và Vinylhouse có trong danh bạ của Resident Advisor nhưng không có sự kiện nào mở được. Hutong, M2 và Park 1901 không xuất hiện trong nguồn nào. Khi những nơi này có lịch mới, chúng tôi sẽ cập nhật bài.`,
    en: `## Why only four

We checked more than ten names that guides often mention. B10 Live in OCT-LOFT is a live house whose October–December 2026 programme is jazz, indie and experimental, with no DJ nights. Pepper Club and LAX Club closed in 2024. Superface was No. 55 in DJ Mag in 2020 but is absent from the 2022–2026 lists, with no 2025–2026 events. Sector, CLUB WHY and Vinylhouse appear in Resident Advisor's directory but no event of theirs could be opened. Hutong, M2 and Park 1901 appear in no source at all. We will update this guide when any of them shows a new programme.`,
  },
  tips: {
    vi: [
      'Cài DiDi, Alipay hoặc WeChat Pay với thẻ quốc tế: hầu hết thanh toán qua ứng dụng.',
      'Theo dõi lịch OIL trên Resident Advisor; PLAY X và Jade đăng trên WeChat.',
      'Ở Jade, liên kết hồ sơ WeChat hoặc Alipay với mini-program trước khi đến nếu đặt bàn.',
      'Chuyến tàu cuối tuyến 1 từ Shopping Park khoảng 23:16–23:52: sau đó gọi xe.',
      'Mang hộ chiếu bản gốc; tránh mọi chất cấm.',
    ],
    en: [
      'Install DiDi and Alipay or WeChat Pay with a foreign card: nearly everything is paid by app.',
      'Follow OIL on Resident Advisor; PLAY X and Jade post on WeChat.',
      'At Jade, link your WeChat or Alipay profile to the mini-program before arriving if you book a table.',
      'Line 1\'s last train from Shopping Park leaves around 23:16–23:52: after that, book a ride.',
      'Carry your original passport; stay away from any drugs.',
    ],
  },
  related: [
    { slug: 'club-thuong-hai', line: { vi: 'Top club ở Thượng Hải · Abyss, Heim và Reactor', en: 'Best clubs in Shanghai · Abyss, Heim and Reactor' } },
    { slug: 'club-bac-kinh', line: { vi: 'Top club ở Bắc Kinh · Zhao Dai, Pillbox và 798', en: 'Best clubs in Beijing · Zhao Dai, Pillbox and 798' } },
    { slug: 'club-edm-chau-a', line: { vi: 'Club EDM ở châu Á · cẩm nang 11 thành phố', en: 'EDM clubs in Asia · the 11-city guide' } },
    { slug: 'mainstage-edm', line: { vi: 'Mainstage EDM là gì? · âm thanh của Jade và PLAY X', en: 'What is mainstage EDM? · the sound of Jade and PLAY X' } },
  ],
  facts: [
    { label: { vi: 'Số địa điểm', en: 'Venues' }, value: { vi: '4 đã xác minh, tháng 10/2026', en: '4 verified, October 2026' } },
    { label: { vi: 'Khu vực', en: 'Areas' }, value: { vi: 'Futian (Coco Park, Chegongmiao, CBD) · Nam Sơn', en: 'Futian (Coco Park, Chegongmiao, CBD) · Nanshan' } },
    { label: { vi: 'DJ Mag Top 100 Clubs', en: 'DJ Mag Top 100 Clubs' }, value: { vi: 'PLAY X hạng 27 (2026)', en: 'PLAY X No. 27 (2026)' } },
    { label: { vi: 'Giá vào cửa', en: 'Entry' }, value: { vi: 'OIL ¥100–120; mega-club thường miễn phí, bàn có mức tối thiểu', en: 'OIL ¥100–120; mega-clubs often free, with table minimums' } },
    { label: { vi: 'Về nhà', en: 'Getting home' }, value: { vi: 'Metro 06:30–23:00; sau đó taxi hoặc DiDi', en: 'Metro 06:30–23:00; then taxi or DiDi' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Club techno nào ở Thâm Quyến?', en: 'Is there a techno club in Shenzhen?' }, a: { vi: 'OIL Club ở Tairan Mansion, Futian, là phòng underground của thành phố từ năm 2017, với techno, house, electro và drum & bass. PLAY X có phòng techno XLAB.', en: 'OIL Club in Tairan Mansion, Futian, is the city\'s underground room since 2017, with techno, house, electro and drum & bass. PLAY X has a techno room, XLAB.' } },
    { q: { vi: 'Club lớn nhất Thâm Quyến là gì?', en: 'What is Shenzhen\'s biggest club?' }, a: { vi: 'PLAY X, sức chứa 3.000, hạng 27 DJ Mag Top 100 Clubs 2026, với loa NEXO và bốn phòng. Jade là mega-club EDM thứ hai, ở khu CBD Futian.', en: 'PLAY X, capacity 3,000, No. 27 in DJ Mag\'s Top 100 Clubs 2026, with NEXO speakers and four rooms. Jade is the second EDM mega-club, in the Futian CBD.' } },
    { q: { vi: 'Đi club Thâm Quyến tốn bao nhiêu?', en: 'How much does clubbing in Shenzhen cost?' }, a: { vi: 'Vé OIL ¥100–120; mega-club thường miễn phí vào cửa nhưng bàn có mức chi tối thiểu cao, giá không công bố.', en: 'OIL tickets are ¥100–120; the mega-clubs are often free to enter but tables carry high, unpublished minimums.' } },
    { q: { vi: 'Club Thâm Quyến mở đến mấy giờ?', en: 'How late do Shenzhen clubs open?' }, a: { vi: 'Khoảng 2–3 giờ ngày thường và 4–6 giờ cuối tuần; Jade 23:00–06:00, các đêm của OIL đến 05:00.', en: 'About 2–3 am on weekdays and 4–6 am at weekends; Jade runs 23:00–06:00, OIL\'s nights to 05:00.' } },
    { q: { vi: 'B10 Live có phải club không?', en: 'Is B10 Live a club?' }, a: { vi: 'Không. B10 Live ở OCT-LOFT là live house; lịch tháng 10–12/2026 là jazz, indie và nhạc thể nghiệm, không có đêm DJ.', en: 'No. B10 Live in OCT-LOFT is a live house; its October–December 2026 programme is jazz, indie and experimental, with no DJ nights.' } },
  ],
  sources: [
    { title: 'The best Shenzhen bars and nightlife spots', url: 'https://www.cathaypacific.com/cx/en_CN/inspiration/dining/best-shenzhen-bars.html', publisher: 'Cathay Pacific' },
    { title: 'Top 100 Clubs 2026: No. 27 PLAY X', url: 'https://djmag.com/top100clubs/2026/27/play-x', publisher: 'DJ Mag' },
    { title: 'Shenzhen nightlife and bars guide (2026)', url: 'https://citiesinsider.com/country/china/shenzhen/nightlife-and-bars/en', publisher: 'Cities Insider' },
    { title: 'A guide to Shenzhen\'s nightlife', url: 'https://www.eyeshenzhen.com/content/2025-08/25/content_31673135.htm', publisher: 'EYESHENZHEN' },
    { title: 'Tech by day, DJ by night: Shenzhen\'s creative underground', url: 'https://jingdaily.com/posts/tech-by-day-dj-by-night-shenzhen-s-creative-underground', publisher: 'Jing Daily' },
    { title: 'Shenzhen nightlife 2026', url: 'https://www.trip.com/guide/destination/shenzhen-nightlife.html', publisher: 'Trip.com' },
  ],
};

export const clubThamQuyen = cityGuide(shenzhen);
