import { cityGuide, type CityGuide } from './shared.ts';
import { CLUB_MEDIA } from './media.ts';

/** Beijing (research 2026-10-22: 2025–2026 Resident Advisor listings, KEYI Magazine, Trippin and the city government's pages; the clubs publish on WeChat, so their Resident Advisor or Instagram page is the link kept). */
const beijing: CityGuide = {
  key: 'club-guides/bac-kinh',
  slug: 'club-bac-kinh',
  city: null,
  name: { vi: 'Bắc Kinh', en: 'Beijing' },
  title: {
    vi: 'Club ở Bắc Kinh 2026: Zhao Dai, Dada, Pillbox và 798',
    en: 'Best clubs in Beijing 2026: Zhao Dai, Dada, Pillbox, 798',
  },
  excerpt: {
    vi: '6 nơi đi đêm nhạc điện tử ở Bắc Kinh năm 2026: Dada, Zhao Dai, Groundless Factory, Pillbox, Rugs* và rooftop Migas. Khu vực, nhạc, giá vé bằng tệ và lưu ý an toàn.',
    en: 'Six places for electronic nights in Beijing in 2026: Dada, Zhao Dai, Groundless Factory, Pillbox, Rugs* and the Migas rooftop, with areas, music, yuan prices, safety.',
  },
  cover: CLUB_MEDIA.beijing[0],
  figure: {
    media: CLUB_MEDIA.beijing[1],
    alt: { vi: 'Sân vận động Công nhân Bắc Kinh', en: 'Beijing\'s Workers\' Stadium' },
    caption: { vi: 'Sân vận động Công nhân: các club quanh đây bị giải toả năm 2020; sân mở lại tháng 4/2023', en: 'The Workers\' Stadium: the clubs around it were cleared in 2020; it reopened in April 2023' },
  },
  styles: ['techno', 'hard-techno', 'house', 'electro', 'drum-and-bass', 'industrial-techno'],
  lead: {
    vi: '**Club ở Bắc Kinh** đã rời dải Gongti cũ: các club quanh Sân vận động Công nhân bị giải toả năm 2020, và các phòng điện tử nay rải khắp quận Triều Dương, từ căn hầm Zhao Dai phía bắc Tam Lý Đồn đến Groundless Factory trong khu nghệ thuật 798. Bài này chọn 6 nơi có lịch năm 2025–2026, theo Resident Advisor và báo chí địa phương.',
    en: '**Beijing\'s clubs** have left the old Gongti strip: the clubs around the Workers\' Stadium were cleared in 2020, and the electronic rooms are now scattered across Chaoyang, from the Zhao Dai basement north of Sanlitun to Groundless Factory in the 798 Art District. This guide picks six with 2025–2026 programmes, following Resident Advisor and local press.',
  },
  quick: {
    areas: {
      vi: 'Triều Dương: Zhao Dai ở Xinyuanli Xijie phía bắc Tam Lý Đồn, Dada dưới Ritan International Trade Center gần công viên Nhật Đàn, Groundless Factory trong 798, Rugs* trên Jiangtai Road, Pillbox ở Lang Yuan Station (Dongba), rooftop Migas ở khu CBD. Các mega-club thương mại nay ở 6 Gongti Xi Lu cạnh Tam Lý Đồn.',
      en: 'Chaoyang: Zhao Dai on Xinyuanli Xijie north of Sanlitun, Dada under the Ritan International Trade Center near Ritan Park, Groundless Factory in 798, Rugs* on Jiangtai Road, Pillbox at Lang Yuan Station (Dongba), the Migas rooftop in the CBD. The commercial mega-clubs now sit at 6 Gongti Xi Lu by Sanlitun.',
    },
    hours: {
      vi: 'Đêm club bắt đầu 22:00 hoặc 23:00 và chạy đến 04:00–06:00; Dada mở sáu tối một tuần từ 21:00, nghỉ thứ Hai, các nơi khác thường thứ Năm đến thứ Bảy. Không có giờ đóng cửa công bố, nhưng club có thể bị đóng theo lệnh quanh các sự kiện chính trị (Lantern chỉ được báo trước ba ngày năm 2020).',
      en: 'Club nights start at 22:00 or 23:00 and run to 04:00–06:00; Dada opens six nights a week from 21:00, closed Mondays, the others usually Thursday to Saturday. There is no published last call, but venues can be closed by order around political events (Lantern got three days\' notice in 2020).',
    },
    music: {
      vi: 'Techno dẫn đầu (Zhao Dai, hard dance ở Pillbox, industrial và thể nghiệm ở Groundless Factory), với house mạnh (ByeByeDisco, House Attack, House of Visions), drum & bass và bass (BADNESS, UNDERCURRENT), và cảnh điện tử live, modular (Modular Commune, Pantheon).',
      en: 'Techno leads (Zhao Dai, Pillbox\'s hard dance, Groundless Factory\'s industrial and experimental sets), with strong house (ByeByeDisco, House Attack, House of Visions), drum & bass and bass (BADNESS, UNDERCURRENT), and live electronic and modular scenes (Modular Commune, Pantheon).',
    },
    prices: {
      vi: 'Cửa underground rẻ: ¥50–120 là phổ biến trên Resident Advisor (Dada ¥0–90, Rugs* ¥50–90, Groundless Factory ¥60–120, Pillbox ¥98–150, Zhao Dai ¥110–138 cho khách quốc tế); lễ hội và khách lớn đến ¥168–388. Rooftop Migas ¥68–120.',
      en: 'Underground doors are cheap: ¥50–120 is the norm on Resident Advisor (Dada ¥0–90, Rugs* ¥50–90, Groundless Factory ¥60–120, Pillbox ¥98–150, Zhao Dai ¥110–138 for international guests); festivals and big guests run ¥168–388. The Migas rooftop is ¥68–120.',
    },
    home: {
      vi: 'Gọi xe là cách về: chính quyền thành phố gọi DiDi là "chìa khoá" gọi xe ở Bắc Kinh, 24/7, có giao diện tiếng Anh, trả bằng WeChat Pay, Alipay hoặc thẻ (không tiền mặt), và nói vẫy taxi ngoài đường nay "cực kỳ khó". Chuyến tàu cuối chạy trước khi club mở.',
      en: 'Ride-hailing is the way home: the city government calls DiDi "the one-stop key" to rides in Beijing, 24/7 with an English interface, paid by WeChat Pay, Alipay or card (not cash), and says hailing a taxi on the street is now "extremely difficult". The last trains run before the clubs open.',
    },
    safety: {
      vi: 'Cẩn thận lời mời của "người lạ thân thiện" đến bar hay quán trà rồi đòi hoá đơn lớn; đừng để đồ uống không trông. Trung Quốc không khoan nhượng với ma tuý, có xét nghiệm ngẫu nhiên, phạt nặng, giam giữ và trục xuất; bar và club có thể bị kiểm tra đột xuất. Luôn mang hộ chiếu bản gốc.',
      en: 'Beware "friendly strangers" inviting you to a bar or tea house that ends in a huge bill; never leave a drink unattended. China has zero tolerance for drugs, with random tests, heavy fines, detention and deportation; bars and clubs can be raided. Always carry your original passport.',
    },
  },
  clubs: [
    {
      name: 'Zhao Dai (招待所)',
      tagline: { vi: 'cửa đen không biển, techno trong ánh đỏ', en: 'an unmarked black door, techno in red light' },
      area: { vi: 'Xinyuanli, bắc Tam Lý Đồn', en: 'Xinyuanli, north of Sanlitun' },
      address: 'Glass Hotel, No. 19 Xinyuanli Xijie, Chaoyang District, Beijing',
      hours: { vi: 'Thứ Sáu và thứ Bảy (đôi khi thứ Năm), 22:00–05:00 hoặc 06:00', en: 'Fri and Sat (some Thursdays), 22:00–05:00 or 06:00' },
      music: { vi: 'Techno, minimal, house, deep house', en: 'Techno, minimal, house, deep house' },
      vibe: { vi: 'Hầm, 300 người, không điện thoại', en: 'Basement, 300 people, no phones' },
      dress: { vi: 'Không công bố', en: 'Not published' },
      price: { vi: '¥110–138 cho đêm khách mời có công bố giá', en: '¥110–138 for guest nights that publish a price' },
      url: 'https://ra.co/clubs/139615',
      why: {
        vi: 'Zhao Dai mở năm 2017 "để mang một không gian mở cho những tâm trí cởi mở" đến thủ đô: một club dưới hầm sau cánh cửa đen không biển hiệu, nội thất bê tông, ánh đỏ, sức chứa 300 và quy định không dùng điện thoại trên sàn. Club đóng cửa vì phong toả tháng 4/2022 và mở lại ngày 9/12/2022; Resident Advisor gọi đây là "nền móng của cộng đồng club Bắc Kinh". Các chuỗi resident Tunnel (techno) và House of Visions (house), và khách năm 2026 gồm Danny Daze, Eric Cloutier, Demuja, Simone de Kunovich. Đội ngũ của club còn làm lễ hội bên biển Zhao Dai On Leave ở Hà Bắc.',
        en: 'Zhao Dai opened in 2017 "to bring an open space for open minds" to the capital: a basement behind an unmarked black door, concrete and red light, room for 300 and a no-phones policy on the floor. It closed with the lockdown of April 2022 and reopened on 9 December 2022; Resident Advisor calls it "a cornerstone of Beijing\'s club community". Its resident series are Tunnel (techno) and House of Visions (house), and 2026 guests include Danny Daze, Eric Cloutier, Demuja and Simone de Kunovich. Its team also runs the seaside festival Zhao Dai On Leave in Hebei.',
      },
    },
    {
      name: 'Dada Beijing',
      tagline: { vi: 'từ năm 2012, nay dưới Nhật Đàn', en: 'since 2012, now under Ritan' },
      area: { vi: 'Nhật Đàn, Triều Dương', en: 'Ritan, Chaoyang' },
      address: 'Ritan International Trade Center, Block A, B1 (Nanyinfang Hutong, Chaowai Shichang Jie), Chaoyang District, Beijing',
      hours: { vi: 'Sáu tối một tuần từ 21:00, nghỉ thứ Hai; party thứ Sáu và thứ Bảy', en: 'Six nights a week from 21:00, closed Mondays; parties Fri and Sat' },
      music: { vi: 'Techno, minimal, house, disco, drum & bass, bass', en: 'Techno, minimal, house, disco, drum & bass, bass' },
      vibe: { vi: 'Hầm, 300 người, chiết trung', en: 'Basement, 300 people, eclectic' },
      dress: { vi: 'Không công bố; phần lớn đêm từ 18 tuổi', en: 'Not published; most nights 18+' },
      price: { vi: '¥0–90 theo Resident Advisor năm 2026; nhiều đêm miễn phí', en: '¥0–90 per Resident Advisor in 2026; several free nights' },
      url: 'https://www.instagram.com/dadabarbeijing/',
      why: {
        vi: 'Dada mở ngày 18/8/2012, ban đầu ở phía đông Lầu Trống (Gulou), và năm 2021 chuyển về căn hầm hiện tại gần công viên Nhật Đàn, sức chứa 300. Club tự mô tả chính sách nhạc là "rất chiết trung" và "kén chọn": techno, electro, minimal và dub techno, house, disco, breakbeat, drum & bass, jungle và dubstep, với các đêm BADNESS, UNDERCURRENT, ByeByeDisco và Flaeming. Danh sách khách cũ của club có Kevin Saunderson, Derrick May, Ben UFO, Kode9, Goldie, Objekt và Moritz von Oswald. Một hướng dẫn du lịch năm 2026 nói Dada đã đóng cửa, nhưng lịch Resident Advisor năm 2026 cho thấy club vẫn mở.',
        en: 'Dada opened on 18 August 2012, first east of the Drum Tower (Gulou), and in 2021 moved to its current basement near Ritan Park, with room for 300. It calls its music policy "very eclectic" and "picky": techno, electro, minimal and dub techno, house, disco, breakbeat, drum & bass, jungle and dubstep, with nights by BADNESS, UNDERCURRENT, ByeByeDisco and Flaeming. Its past guests include Kevin Saunderson, Derrick May, Ben UFO, Kode9, Goldie, Objekt and Moritz von Oswald. A 2026 travel guide claimed Dada had closed, but its 2026 Resident Advisor listings show it open.',
      },
    },
    {
      name: 'Groundless Factory (莫须有工厂)',
      tagline: { vi: 'nhà kho nghệ thuật và âm thanh trong 798', en: 'an art-and-sound warehouse in 798' },
      area: { vi: 'Khu nghệ thuật 798', en: '798 Art District' },
      address: 'B06-2, 706 North 1st Street, 798 Art District, Chaoyang District, Beijing',
      hours: { vi: 'Đêm sự kiện, thường thứ Sáu và thứ Bảy, 22:00–05:00; ban ngày triển lãm', en: 'Event nights, usually Fri and Sat, 22:00–05:00; exhibitions by day' },
      music: { vi: 'Techno, industrial, hard techno, hardcore, live modular', en: 'Techno, industrial, hard techno, hardcore, live modular' },
      vibe: { vi: 'Thô, thể nghiệm, nghệ thuật', en: 'Raw, experimental, art space' },
      dress: { vi: 'Không công bố; từ 18 tuổi', en: 'Not published; 18+' },
      price: { vi: '¥60–120 phần lớn các đêm; lễ hội đến ¥388', en: '¥60–120 most nights; festivals up to ¥388' },
      url: 'https://ra.co/clubs/216700',
      why: {
        vi: 'Groundless Factory lớn lên từ Groundless Camp, một nhóm nghệ thuật thể nghiệm bắt đầu năm 2017; club được lập năm 2022 giữa đại dịch và chuyển sang địa điểm mới năm 2025. Người sáng lập nói với KEYI Magazine: "Ở Trung Quốc, những không gian underground thật sự tự do cực kỳ hiếm", và nơi mới được để thô có chủ ý, với triển lãm ban ngày, chiếu phim miễn phí và party ban đêm. Nhạc là techno, industrial, hardcore, bass và live modular (after-party của Modular Commune); Tommy Four Seven (22/8/2026), Carl Stone, Max Durante và Zanias, người gọi nơi này là "nhà kho chiết trung đầy báu vật", đã chơi ở đây.',
        en: 'Groundless Factory grew out of Groundless Camp, an experimental art collective started in 2017; the club was founded in 2022 during the pandemic and moved to a new venue in 2025. Its founder told KEYI Magazine that "in China, truly free underground spaces are extremely rare", and the new space is left raw by design, with exhibitions and free film screenings by day and parties by night. The music is techno, industrial, hardcore, bass and live modular (Modular Commune\'s after-parties); Tommy Four Seven (22 August 2026), Carl Stone, Max Durante and Zanias, who called it "an eclectic warehouse of treasures", have played.',
      },
    },
    {
      name: 'Pillbox Beijing',
      tagline: { vi: 'hard dance trong một "boongke"', en: 'hard dance in a "bunker"' },
      area: { vi: 'Lang Yuan Station, Dongba', en: 'Lang Yuan Station, Dongba' },
      address: 'C9-9, Lang Yuan Station, No. 53 Banjieta Road, Dongba, Chaoyang District, Beijing',
      hours: { vi: 'Nhiều tối một tuần (thứ Năm–thứ Bảy và hơn), thường 23:00–06:00', en: 'Several nights a week (Thu–Sat and more), usually 23:00–06:00' },
      music: { vi: 'Hard techno, techno, trance, electro, bass', en: 'Hard techno, techno, trance, electro, bass' },
      vibe: { vi: '500 người, kiểu boongke', en: '500 people, bunker-style' },
      dress: { vi: 'Không công bố; từ 18 tuổi', en: 'Not published; 18+' },
      price: { vi: '¥98–150 cho đêm có công bố giá', en: '¥98–150 for nights that publish a price' },
      url: 'https://www.instagram.com/pillbox_beijing/',
      why: {
        vi: 'Pillbox ra mắt tháng 3/2024 như một club "lấy hard dance làm trung tâm", đặt tên theo boongke bê tông, trong khu sáng tạo Lang Yuan Station ở Dongba, phía đông Bắc Kinh, sức chứa 500. Đây là một trong những địa điểm điện tử sôi động nhất thành phố trên Resident Advisor: lịch tháng 10/2026 có Partok (9/10) và Boris (16/10) của Berghain, DMX Krew cùng Schwefelgelb (17/10), Dopplereffekt (24/10), sau Randomer tháng 9. Bên cạnh hard techno, trance và electro là các đêm drum & bass như Sustance của Shogun Audio, và các nhóm địa phương Antigen, Toxic, Flaeming, PAiN.',
        en: 'Pillbox launched in March 2024 as a "hard dance-centred venue", named after the concrete bunker, in the Lang Yuan Station creative complex in Dongba, east Beijing, with room for 500. It is one of the city\'s busiest electronic venues on Resident Advisor: its October 2026 calendar has Berghain\'s Partok (9 October) and Boris (16 October), DMX Krew with Schwefelgelb (17 October) and Dopplereffekt (24 October), after Randomer in September. Beside hard techno, trance and electro come drum & bass nights such as Shogun Audio\'s Sustance, and local crews Antigen, Toxic, Flaeming and PAiN.',
      },
    },
    {
      name: 'Rugs*',
      tagline: { vi: 'phòng mới nhất, không chạy theo một thể loại', en: 'the newest room, no single genre' },
      area: { vi: 'Jiangtai Road, Lido', en: 'Jiangtai Road, Lido' },
      address: 'Jiangtai Road, Chaoyang District, Beijing (số nhà chưa công bố)',
      hours: { vi: 'Thứ Năm–thứ Bảy, 22:00–05:00/06:00', en: 'Thu–Sat, 22:00–05:00/06:00' },
      music: { vi: 'House, techno, electro, drum & bass, live thể nghiệm', en: 'House, techno, electro, drum & bass, experimental live' },
      vibe: { vi: 'Nhỏ, kiểu phòng nghe', en: 'Small, listening room' },
      dress: { vi: 'Không công bố', en: 'Not published' },
      price: { vi: '¥50–90 khi có công bố', en: '¥50–90 where published' },
      url: 'https://ra.co/clubs/297382',
      why: {
        vi: 'Rugs* là một trong những phòng mới nhất của Bắc Kinh: đêm đầu tiên trên Resident Advisor là ngày 17/7/2026 (UNDERCURRENT, drum & bass), và đến cuối tháng 10 đã có 20 đêm. Tuyên ngôn của nơi này: "Âm nhạc xảy ra giữa con người. Chúng tôi không chạy theo một nhãn thể loại; sân khấu ở đây thuộc về những người nghiêm túc với âm nhạc, và về mọi người sẵn lòng lắng nghe." Lịch đi từ house (House Attack, PLAYTIME) và techno, electro (Flaeming) đến trance, dub techno và live thể nghiệm (chuỗi Pantheon; Drew McDowall của Coil và Hiro Kone ngày 13/11/2026). Số nhà chưa được công bố; xem sự kiện trên Resident Advisor.',
        en: 'Rugs* is one of Beijing\'s newest rooms: its first Resident Advisor night was 17 July 2026 (UNDERCURRENT, drum & bass), and by late October it had 20. Its statement: "Music happens between people. We don\'t chase a single genre label — the stage here belongs to those who take music seriously, and to everyone willing to listen." The calendar runs from house (House Attack, PLAYTIME) and techno and electro (Flaeming) to trance, dub techno and experimental live sets (the Pantheon series; Coil\'s Drew McDowall and Hiro Kone on 13 November 2026). No street number is published; check the event on Resident Advisor.',
      },
    },
    {
      name: 'Migas Mercado (rooftop)',
      tagline: { vi: 'house trên sân thượng khu CBD', en: 'house on a CBD rooftop' },
      area: { vi: 'Quốc Mậu, CBD', en: 'Guomao, CBD' },
      address: '7th Floor, North Zone, China World Mall (Phase 3), No. 1 Jianguomenwai Avenue, Chaoyang District, Beijing',
      hours: { vi: 'Đêm party (chủ yếu thứ Sáu, thứ Bảy, xuân đến thu) 22:00–04:00', en: 'Party nights (mostly Fri and Sat, spring to autumn) 22:00–04:00' },
      music: { vi: 'House, tech house, disco, Afro house', en: 'House, tech house, disco, Afro house' },
      vibe: { vi: 'Rooftop, khách lounge', en: 'Rooftop, lounge crowd' },
      dress: { vi: 'Không công bố; từ 18 tuổi', en: 'Not published; 18+' },
      price: { vi: '¥68–120', en: '¥68–120' },
      url: 'https://ra.co/clubs/46922',
      why: {
        vi: 'Migas Mercado là nhà hàng Tây Ban Nha có thiết kế công nghiệp và một lounge trên sân thượng, ở tầng 7 khu bắc của China World Mall: ban ngày là bữa ăn, đêm party mùa xuân đến mùa thu là house, tech house, disco, Afro house và minimal với chuỗi "House on the Roof" và "Secret Garden" của Wildkats, Sunset Sessions và Trust, do các DJ địa phương như Aliberti, Stefano DVT, Mr Stretch và Pei chơi. Đây không phải phòng tối mà là đêm lounge có view khu CBD; lịch năm 2026 chưa được xác minh, nên xem trên Resident Advisor trước khi đi.',
        en: 'Migas Mercado is an industrial-styled Spanish restaurant with a rooftop lounge on the seventh floor of China World Mall\'s north zone: dinner by day, and on party nights from spring to autumn house, tech house, disco, Afro house and minimal with Wildkats\' "House on the Roof" and "Secret Garden" series, Sunset Sessions and Trust, played by local DJs such as Aliberti, Stefano DVT, Mr Stretch and Pei. It is not a dark room but a lounge night with a CBD view; its 2026 calendar is not verified, so check Resident Advisor before you go.',
      },
    },
  ],
  extra: {
    vi: `## Lantern và dải Gongti cũ

Lantern (灯笼俱乐部) là định chế techno của Bắc Kinh từ cuối năm 2009, với hệ thống Funktion-One, ở dải club quanh Sân vận động Công nhân. Năm 2020 sân bị giải toả để xây lại và Lantern chỉ được báo trước ba ngày; club mở lại ở địa điểm mới với ba phòng (Resident Advisor, 2020), nhưng chúng tôi không tìm thấy lịch nào sau tháng 1/2020, nên không đưa vào danh sách. Mix, Vics và Elements cũng mất chỗ cùng lúc. Sân mở lại tháng 4/2023, và các mega-club thương mại nay ở 6 Gongti Xi Lu.`,
    en: `## Lantern and the old Gongti strip

Lantern (灯笼俱乐部) was Beijing's techno institution from late 2009, on a Funktion-One system, in the strip of clubs around the Workers' Stadium. In 2020 the stadium was cleared for rebuilding and Lantern got three days' notice; it reopened at a new location with three rooms (Resident Advisor, 2020), but we found no listing after January 2020, so it is not on this list. Mix, Vics and Elements lost their homes at the same time. The stadium reopened in April 2023, and the commercial mega-clubs now sit at 6 Gongti Xi Lu.`,
  },
  tips: {
    vi: [
      'Cài DiDi và Alipay hoặc WeChat Pay với thẻ quốc tế: tiền mặt và taxi ngoài đường đều khó.',
      'Lịch đăng trên WeChat; Resident Advisor có lịch tiếng Anh cho các club trong bài.',
      'Ở Zhao Dai, không dùng điện thoại trên sàn.',
      'Pillbox ở xa trung tâm: gọi xe hai chiều và đi theo nhóm.',
      'Luôn mang hộ chiếu bản gốc; có thể bị kiểm tra và xét nghiệm.',
      'Từ chối lời mời của người lạ đến bar hay quán trà.',
    ],
    en: [
      'Install DiDi and Alipay or WeChat Pay with a foreign card: cash and street taxis are both hard.',
      'Programmes are posted on WeChat; Resident Advisor has English listings for the clubs here.',
      'At Zhao Dai, no phones on the floor.',
      'Pillbox is far from the centre: book rides both ways and go as a group.',
      'Always carry your original passport; checks and tests happen.',
      'Turn down strangers\' invitations to a bar or tea house.',
    ],
  },
  related: [
    { slug: 'club-thuong-hai', line: { vi: 'Top club ở Thượng Hải · Abyss, Heim và Reactor', en: 'Best clubs in Shanghai · Abyss, Heim and Reactor' } },
    { slug: 'club-tham-quyen', line: { vi: 'Club ở Thâm Quyến · OIL, Jade và PLAY X', en: 'Clubs in Shenzhen · OIL, Jade and PLAY X' } },
    { slug: 'club-edm-chau-a', line: { vi: 'Club EDM ở châu Á · cẩm nang 11 thành phố', en: 'EDM clubs in Asia · the 11-city guide' } },
    { slug: 'techno', line: { vi: 'Techno là gì? · âm thanh của Zhao Dai', en: 'What is techno? · the sound of Zhao Dai' } },
  ],
  facts: [
    { label: { vi: 'Số địa điểm', en: 'Venues' }, value: { vi: '6, có lịch năm 2025–2026', en: '6, with 2025–2026 programmes' } },
    { label: { vi: 'Khu vực', en: 'Areas' }, value: { vi: 'Triều Dương: Tam Lý Đồn, Nhật Đàn, 798, Dongba, CBD', en: 'Chaoyang: Sanlitun, Ritan, 798, Dongba, CBD' } },
    { label: { vi: 'Nhạc', en: 'Music' }, value: { vi: 'Techno, hard dance, house, drum & bass, thể nghiệm', en: 'Techno, hard dance, house, drum & bass, experimental' } },
    { label: { vi: 'Giá vào cửa', en: 'Entry' }, value: { vi: '¥0–150; lễ hội đến ¥388', en: '¥0–150; festivals up to ¥388' } },
    { label: { vi: 'Về nhà', en: 'Getting home' }, value: { vi: 'DiDi 24/7, trả bằng ứng dụng', en: 'DiDi 24/7, paid by app' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Club techno nào ở Bắc Kinh đáng đi nhất?', en: 'Which Beijing club is best for techno?' }, a: { vi: 'Zhao Dai cho techno và house trong căn hầm không điện thoại, Pillbox cho hard techno và hard dance, Groundless Factory cho industrial và thể nghiệm trong khu 798.', en: 'Zhao Dai for techno and house in a no-phones basement, Pillbox for hard techno and hard dance, Groundless Factory for industrial and experimental sets in 798.' } },
    { q: { vi: 'Lantern còn mở không?', en: 'Is Lantern still open?' }, a: { vi: 'Chưa xác minh được: Lantern mở lại năm 2020 ở địa điểm mới sau khi dải Gongti bị giải toả, nhưng chúng tôi không tìm thấy lịch nào sau tháng 1/2020.', en: 'Not verified: Lantern reopened at a new site in 2020 after the Gongti strip was cleared, but we found no listing after January 2020.' } },
    { q: { vi: 'Đi club Bắc Kinh tốn bao nhiêu?', en: 'How much does clubbing in Beijing cost?' }, a: { vi: 'Cửa underground thường ¥50–120, khách lớn ¥110–150, lễ hội đến ¥388; Dada có nhiều đêm miễn phí. Rooftop Migas ¥68–120.', en: 'Underground doors are usually ¥50–120, big guests ¥110–150, festivals up to ¥388; Dada has several free nights. The Migas rooftop is ¥68–120.' } },
    { q: { vi: 'Club Bắc Kinh mở đến mấy giờ?', en: 'How late do Beijing clubs open?' }, a: { vi: 'Đêm club thường 22:00 hoặc 23:00 đến 04:00–06:00; không có giờ đóng cửa công bố, nhưng có thể đóng theo lệnh quanh các sự kiện chính trị.', en: 'Club nights usually run from 22:00 or 23:00 to 04:00–06:00; there is no published last call, but closures can be ordered around political events.' } },
    { q: { vi: 'Về nhà sau club ở Bắc Kinh thế nào?', en: 'How do I get home after a Beijing club?' }, a: { vi: 'Gọi DiDi: chạy 24/7, có tiếng Anh, trả bằng WeChat Pay, Alipay hoặc thẻ. Vẫy taxi ngoài đường rất khó, và tàu đã ngừng trước giờ club mở.', en: 'Book a DiDi: 24/7, in English, paid by WeChat Pay, Alipay or card. Hailing a street taxi is very hard, and the trains stop before the clubs open.' } },
  ],
  sources: [
    { title: 'RA guide: Beijing', url: 'https://ra.co/guide/cn/beijing', publisher: 'Resident Advisor' },
    { title: 'Groundless Factory: inside Beijing\'s raw and rebellious underground', url: 'https://www.keyimagazine.com/?p=34956', publisher: 'KEYI Magazine' },
    { title: 'What went down at Trippin\'s Zhao Dai party in Beijing', url: 'https://trippin.world/feature/zhao-dai-on-leave-club-beijing-china-festival-dj-swisha-de-schuurman-kimmah', publisher: 'Trippin' },
    { title: 'Beijing club Lantern reopens at new location with three rooms', url: 'https://ra.co/news/74187', publisher: 'Resident Advisor' },
    { title: '21 best house and techno clubs in Asia', url: 'https://www.6amgroup.com/best-house-techno-clubs-asia/', publisher: '6AM Group' },
    { title: 'Top five night clubs in Beijing', url: 'https://english.visitbeijing.com.cn/article/47OMz4ztnHg', publisher: 'Visit Beijing' },
  ],
};

export const clubBacKinh = cityGuide(beijing);
