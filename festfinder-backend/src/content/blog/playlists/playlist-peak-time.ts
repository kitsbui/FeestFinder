import { playlistPost, type Playlist } from './shared.ts';
import { PLAYLIST_MEDIA_A } from './media-a.ts';

/** A mood (kind mood): the peak of the night, tech house to techno to the main stage, evergreen. */
const peakTime: Playlist = {
  key: 'playlists/playlist-peak-time',
  slug: 'playlist-peak-time',
  kind: 'mood',
  title: {
    vi: 'Playlist peak time: 10 bài cho đỉnh của đêm',
    en: 'Peak-time playlist: 10 tracks for the top of the night',
  },
  excerpt: {
    vi: 'Playlist peak time: tech house của FISHER và Mau P, techno của Charlotte de Witte và Drumcode, anthem của Avicii, Swedish House Mafia, Garrix và Underworld.',
    en: 'Peak-time tracks: tech house from FISHER and Mau P, techno from Charlotte de Witte and Drumcode, anthems by Avicii, Swedish House Mafia, Garrix and Underworld.',
  },
  cover: PLAYLIST_MEDIA_A.peak,
  styles: ['tech-house', 'techno', 'mainstage', 'progressive-house'],
  style: 'techno',
  lead: {
    vi: '**Playlist peak time** là những bài cho lúc cả phòng ở đỉnh: đông nhất, ồn nhất, ai cũng giơ tay. Mười bài đi từ tech house (FISHER, Mau P) qua techno (Charlotte de Witte, Adam Beyer) đến các anthem sân khấu chính đã thành kinh điển (Avicii, Swedish House Mafia, Martin Garrix, Underworld, Faithless).\n\n*Danh sách bền vững, cập nhật ngày 23/10/2026.*',
    en: '**A peak-time playlist** is music for the moment the room is at its height: fullest, loudest, every hand in the air. Ten tracks run from tech house (FISHER, Mau P) through techno (Charlotte de Witte, Adam Beyer) to main-stage anthems that became classics (Avicii, Swedish House Mafia, Martin Garrix, Underworld, Faithless).\n\n*An evergreen list, last updated 23 October 2026.*',
  },
  tracks: [
    {
      youtube: 'u31thuMehjM', artist: 'FISHER', title: 'Losing It', channel: 'FISHER', year: 2018, label: 'Catch & Release',
      style: { vi: 'Tech house', en: 'Tech house' },
      note: {
        vi: 'Nhà sản xuất Úc phát hành bài này ngày 13/7/2018 trên Catch & Release; bài lên số 1 bảng Dance Club Songs của Mỹ và bảng Club Tracks của Úc. Một bản build dài với tiếng hô "losing it" và cú drop bass khô: bài tech house khiến cả phòng đồng loạt nhảy lên.',
        en: 'The Australian producer released it on 13 July 2018 on Catch & Release; it went to No. 1 on the US Dance Club Songs chart and Australia\'s Club Tracks chart. A long build around the "losing it" chant and a dry bass drop: the tech house track that makes a whole room jump at once.',
      },
    },
    {
      youtube: 'juuIhW8V1Xw', artist: 'Mau P', title: 'Drugs From Amsterdam', channel: 'Mau P', year: 2022, label: 'Repopulate Mars',
      style: { vi: 'Tech house', en: 'Tech house' },
      note: {
        vi: 'Single đầu tay của DJ Hà Lan, phát hành ngày 19/8/2022 trên Repopulate Mars, lên số 1 bảng chính của Beatport và được Billboard chọn vào 50 bài dance hay nhất năm 2022. Năm 2023 bài thắng cả Song of the Year lẫn Dance Song of the Year ở EDMA. Giọng kể nói, bassline vặn xoắn: không thể lẫn.',
        en: 'The Dutch DJ\'s debut single, released on 19 August 2022 on Repopulate Mars, went to No. 1 on Beatport\'s main chart and made Billboard\'s 50 best dance songs of 2022. In 2023 it won both Song of the Year and Dance Song of the Year at the EDMAs. A spoken vocal and a twisting bassline: impossible to mistake.',
      },
    },
    {
      youtube: 'aU6z-pPEmY0', artist: 'Adam Beyer & Bart Skils', title: 'Your Mind', channel: 'Drumcode', label: 'Drumcode',
      style: { vi: 'Techno', en: 'Techno' },
      note: {
        vi: 'Hai DJ techno lâu năm, người Thuỵ Điển Adam Beyer và người Hà Lan Bart Skils, gặp nhau trên Drumcode, label của Beyer. Hơn tám phút techno dồn dập và thôi miên: kiểu peak time cho phòng lớn, nhiều năng lượng mà vẫn giữ được mạch.',
        en: 'Two long-serving techno DJs, Sweden\'s Adam Beyer and the Netherlands\' Bart Skils, meet on Drumcode, Beyer\'s label. More than eight minutes of driving, hypnotic techno: peak time for a big room, full of energy without losing the thread.',
      },
    },
    {
      youtube: 'u1v-TN6j0Rk', artist: 'Charlotte de Witte', title: 'Overdrive', channel: 'Charlotte de Witte', label: 'KNTXT (KNTXT021)',
      style: { vi: 'Techno, acid', en: 'Techno, acid' },
      note: {
        vi: 'DJ người Bỉ được biết với techno "tối và tối giản", và là người sáng lập label KNTXT, nơi bài này ra với mã KNTXT021. Cứng, thôi miên và tối giản: "Overdrive" cho thấy peak time không cần nhiều giai điệu, chỉ cần áp lực tăng dần.',
        en: 'The Belgian DJ is known for "dark and stripped-back" techno and founded the KNTXT label, where this came out as KNTXT021. Hard, hypnotic and stripped down: "Overdrive" shows that peak time needs little melody, only rising pressure.',
      },
    },
    {
      youtube: 'XiMrrleH_hI', artist: 'Underworld', title: 'Born Slippy .NUXX', channel: 'Underworld', year: 1995,
      style: { vi: 'Techno, progressive', en: 'Techno, progressive' },
      note: {
        vi: 'Ra lần đầu tháng 5/1995 làm mặt B của "Born Slippy", rồi trở thành một trong những bài nhạc điện tử nổi tiếng nhất của thập niên 90 nhờ bộ phim Trainspotting. Lời hát rời rạc kể từ góc nhìn của một người say. Khi tiếng "lager, lager, lager" vang lên, ai trên sàn cũng biết.',
        en: 'First released in May 1995 as the B-side of "Born Slippy", it became one of the best-known electronic tracks of the nineties through the film Trainspotting. Its fragmented lyrics take the point of view of a drunk. When the "lager, lager, lager" line hits, everyone on the floor knows it.',
      },
    },
    {
      youtube: 'P8JEm4d6Wu4', artist: 'Faithless', title: 'Insomnia', channel: 'FaithlessVEVO', year: 1995,
      style: { vi: 'Progressive house, trance', en: 'Progressive house, trance' },
      note: {
        vi: 'Phát hành năm 1995 và đứng đầu bảng UK Dance Chart, khi phát hành lại tháng 10/1996 bài lên hạng 3 ở Anh và số 1 ở Phần Lan, Na Uy, Thuỵ Sĩ cùng các bảng dance của Mỹ và Canada. Đoạn synth stab nổi tiếng vẫn được DJ dùng ở đỉnh đêm ba mươi năm sau.',
        en: 'Released in 1995, it topped the UK Dance Chart; reissued in October 1996, it reached No. 3 in the UK and No. 1 in Finland, Norway and Switzerland and on the American and Canadian dance charts. Its famous synth stabs are still how DJs mark the top of the night thirty years on.',
      },
    },
    {
      youtube: '_ovdm2yX4MA', artist: 'Avicii', title: 'Levels', channel: 'AviciiOfficialVEVO', year: 2011,
      style: { vi: 'Progressive house', en: 'Progressive house' },
      note: {
        vi: 'Ra mắt dưới dạng bài chưa đặt tên trong Essential Mix của Pete Tong trên BBC Radio 1 ngày 11/12/2010, rồi phát hành ngày 28/10/2011. Giai điệu synth lệch nhịp với bass và đoạn giọng mượn từ Etta James: bài định nghĩa EDM đầu thập niên 2010, và vẫn làm cả sân khấu hát theo.',
        en: 'Premiered as an untitled track on Pete Tong\'s Essential Mix on BBC Radio 1 on 11 December 2010, then released on 28 October 2011. A synth lead offset against the bass and a vocal lifted from Etta James: the track that defined early-2010s EDM, and still has whole fields singing.',
      },
    },
    {
      youtube: '1y6smkh6c-0', artist: 'Swedish House Mafia ft. John Martin', title: 'Don\'t You Worry Child', channel: 'SHMVEVO', year: 2012,
      style: { vi: 'Progressive house, mainstage', en: 'Progressive house, mainstage' },
      note: {
        vi: 'Single cuối cùng trước khi Swedish House Mafia tan rã đầu năm 2013, lấy từ album tổng hợp Until Now, với giọng của John Martin. Đây là hit lớn nhất của nhóm và được đề cử Grammy. Đoạn piano mở đầu là tín hiệu để cả đám đông chuẩn bị hát.',
        en: 'Swedish House Mafia\'s last single before they split in early 2013, from the compilation Until Now, with John Martin on vocals. It is the group\'s biggest hit and earned a Grammy nomination. The opening piano is the signal for the whole crowd to get ready to sing.',
      },
    },
    {
      youtube: 'gCYcHz2k5x0', artist: 'Martin Garrix', title: 'Animals', channel: 'STMPD RCRDS', year: 2013,
      style: { vi: 'Big room house', en: 'Big room house' },
      note: {
        vi: 'Phát hành ngày 17/6/2013, bài big room không lời này đưa Martin Garrix thành nhà sản xuất trẻ nhất từng có bài số 1 trên Beatport, rồi đứng đầu bảng xếp hạng đĩa đơn ở Anh. Kick nặng và đoạn drop tối giản: khuôn mẫu cho cả một thế hệ sân khấu chính.',
        en: 'Released on 17 June 2013, this big room instrumental made Martin Garrix the youngest producer ever to reach No. 1 on Beatport, then topped the UK singles chart. A heavy kick and a minimal drop: the template for a generation of main stages.',
      },
    },
    {
      youtube: 'Q22MCFC0CP0', artist: 'Fred again.. x Swedish House Mafia ft. Future', title: 'Turn On The Lights again..', channel: 'Fred again . .', year: 2022,
      style: { vi: 'House', en: 'House' },
      note: {
        vi: 'Fred again.. và Swedish House Mafia lấy mẫu từ "Turn On the Lights" năm 2012 của rapper Future để làm một bài house đầy cảm xúc, phát hành năm 2022. Đây là bài cho những phút cuối của đỉnh đêm, khi phòng vẫn nhảy nhưng bắt đầu hát.',
        en: 'Fred again.. and Swedish House Mafia sample Future\'s 2012 "Turn On the Lights" for an emotional house track released in 2022. It is a track for the last minutes of the peak, when the room is still dancing but starting to sing.',
      },
    },
  ],
  method: {
    vi: 'Peak time là giờ mà DJ chính chơi: phòng đã đông và đã nóng nhờ set warm-up, và việc bây giờ là giữ năng lượng ở mức cao nhất mà không làm mọi người mệt. Chúng tôi chọn những bài đã chứng minh được điều đó trên sàn nhảy thật: đứng đầu bảng club hoặc bảng dance (FISHER, Mau P, Faithless, Martin Garrix), được giới phê bình chọn (Billboard với Mau P, đề cử Grammy với Swedish House Mafia), hoặc vẫn được chơi ở các festival lớn sau hơn một thập kỷ (Avicii, Underworld). Danh sách gồm ba phần: tech house, techno, rồi các anthem sân khấu chính, để bạn chọn đoạn hợp với phòng của mình. Mỗi video là bản chính thức trên kênh của nghệ sĩ hoặc label, đã kiểm tra phát được qua oEmbed của YouTube. Ngày phát hành, label và thứ hạng chỉ ghi khi nguồn nói rõ; không ghi BPM.',
    en: 'Peak time is the headliner\'s hour: the room is full and warmed up by the opening set, and the job now is to hold the energy at its highest without wearing people out. We chose tracks that have proved it on real floors: No. 1 on club or dance charts (FISHER, Mau P, Faithless, Martin Garrix), picked by critics (Billboard for Mau P, a Grammy nomination for Swedish House Mafia), or still played at major festivals more than a decade on (Avicii, Underworld). The list has three parts, tech house, techno, then main-stage anthems, so you can take the stretch that fits your room. Every video is the official upload on the artist\'s or label\'s channel, checked to play through YouTube\'s oEmbed. Release dates, labels and chart positions are given only when a source states them; no BPMs.',
  },
  notes: {
    vi: 'Peak time ở club và ở festival khác nhau. Ở một club techno, đỉnh đêm có thể là ba tiếng của kick và acid không có một câu hát nào. Ở sân khấu chính festival, đỉnh đêm là lúc hàng chục nghìn người cùng hát "Levels" hay "Don\'t You Worry Child". Danh sách này giữ cả hai, nên nếu bạn chơi, đừng nhảy thẳng từ Charlotte de Witte sang Martin Garrix: hãy để một bài nối giữa hai thế giới. Khi đêm qua đỉnh, chuyển sang danh sách warm-up theo chiều ngược lại để đưa phòng xuống nhẹ nhàng.',
    en: 'Peak time in a club and at a festival are different things. In a techno club, the top of the night can be three hours of kick and acid without a single lyric. On a festival main stage, it is the moment tens of thousands sing "Levels" or "Don\'t You Worry Child" together. This list keeps both, so if you play it, don\'t jump straight from Charlotte de Witte to Martin Garrix: let one track bridge the two worlds. Once the night passes its peak, run the warm-up list in reverse to bring the room down gently.',
  },
  related: [
    { slug: 'playlist-warm-up', line: { vi: 'Playlist warm-up · giờ mở màn của đêm', en: 'Warm-up playlist · the opening hour' } },
    { slug: 'playlist-techno', line: { vi: 'Playlist techno · những bài nên nghe ngay', en: 'Techno playlist · the tracks to hear now' } },
    { slug: 'playlist-mainstage-edm', line: { vi: 'Playlist mainstage · anthem của sân khấu lớn', en: 'Mainstage playlist · big-stage anthems' } },
    { slug: 'techno', line: { vi: 'Techno là gì? · lịch sử và các nhánh', en: 'What is techno? · its history and branches' } },
    { slug: 'playlist-edm', line: { vi: 'Playlist EDM · mọi danh sách của FeestFinder', en: 'EDM playlists · every FeestFinder list' } },
  ],
  facts: [
    { label: { vi: 'Tâm trạng', en: 'Mood' }, value: { vi: 'Đỉnh đêm, giờ của DJ chính', en: 'Peak hour, the headliner\'s slot' } },
    { label: { vi: 'Dòng nhạc', en: 'Styles' }, value: { vi: 'Tech house, techno, progressive house, big room', en: 'Tech house, techno, progressive house, big room' } },
    { label: { vi: 'Số bài', en: 'Tracks' }, value: { vi: '10, từ 1995 đến 2022', en: '10, from 1995 to 2022' } },
    { label: { vi: 'Hợp với', en: 'Best for' }, value: { vi: 'Set chính ở club và festival, buổi tập trước khi ra ngoài', en: 'Main sets at clubs and festivals, pre-party listening' } },
    { label: { vi: 'Loại', en: 'Type' }, value: { vi: 'Danh sách bền vững, xem lại mỗi năm', en: 'Evergreen, reviewed every year' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: '23/10/2026', en: '23 October 2026' } },
  ],
  faq: [
    { q: { vi: 'Peak time trong DJ là gì?', en: 'What is peak time in DJing?' }, a: { vi: 'Là giờ cao điểm của đêm, thường do DJ chính chơi, khi phòng đông và nhiều năng lượng nhất. Nhạc peak time mạnh, rõ và có những khoảnh khắc cả phòng cùng phản ứng.', en: 'It is the busiest hour of the night, usually played by the headliner, when the room is fullest and most energetic. Peak-time music is strong, clear and built around moments the whole room reacts to.' } },
    { q: { vi: 'Bài peak time kinh điển nhất là gì?', en: 'What are the classic peak-time tracks?' }, a: { vi: '"Levels" của Avicii, "Insomnia" của Faithless, "Born Slippy .NUXX" của Underworld và "Don\'t You Worry Child" của Swedish House Mafia vẫn được chơi ở đỉnh đêm sau hơn một thập kỷ.', en: 'Avicii\'s "Levels", Faithless\'s "Insomnia", Underworld\'s "Born Slippy .NUXX" and Swedish House Mafia\'s "Don\'t You Worry Child" still get played at the top of the night more than a decade on.' } },
    { q: { vi: 'Techno peak time khác tech house thế nào?', en: 'How does peak-time techno differ from tech house?' }, a: { vi: 'Tech house (FISHER, Mau P) dựa vào bassline nảy và giọng hát; techno peak time (Charlotte de Witte, Adam Beyer) dựa vào kick nặng, acid và áp lực tăng dần, ít lời hơn.', en: 'Tech house (FISHER, Mau P) relies on a bouncing bassline and vocals; peak-time techno (Charlotte de Witte, Adam Beyer) relies on a heavy kick, acid and rising pressure, with fewer words.' } },
    { q: { vi: 'Nghe playlist này ở đâu?', en: 'Where can I listen to this playlist?' }, a: { vi: 'Ngay trong bài: mỗi bài có player YouTube chính thức chỉ tải khi bấm phát. Tất cả đều có trên Spotify và Apple Music.', en: 'Right here: each track has its official YouTube player, loading only when you press play. All of them are on Spotify and Apple Music.' } },
    { q: { vi: 'Danh sách có được cập nhật không?', en: 'Is this list updated?' }, a: { vi: 'Đây là danh sách bền vững; chúng tôi xem lại mỗi năm. Các bài mới nhất nằm trong danh sách năm 2026 và danh sách tháng.', en: 'It is an evergreen list; we review it every year. The newest tracks are in the 2026 list and the monthly list.' } },
  ],
  sources: [
    { title: 'Losing It (song)', url: 'https://en.wikipedia.org/wiki/Losing_It_(song)', publisher: 'Wikipedia' },
    { title: 'Mau P', url: 'https://en.wikipedia.org/wiki/Mau_P', publisher: 'Wikipedia' },
    { title: 'The 50 best dance songs of 2022: critics’ picks', url: 'https://www.billboard.com/lists/best-dance-songs-2022/', publisher: 'Billboard' },
    { title: 'Animals – Martin Garrix', url: 'https://www.officialcharts.com/songs/martin-garrix-animals/', publisher: 'Official Charts' },
    { title: 'Levels (Avicii song)', url: 'https://en.wikipedia.org/wiki/Levels_(Avicii_song)', publisher: 'Wikipedia' },
    { title: 'Born Slippy .NUXX', url: 'https://en.wikipedia.org/wiki/Born_Slippy_(Nuxx)', publisher: 'Wikipedia' },
    { title: 'Insomnia (Faithless song)', url: 'https://en.wikipedia.org/wiki/Insomnia_(Faithless_song)', publisher: 'Wikipedia' },
    { title: 'Don\'t You Worry Child', url: 'https://en.wikipedia.org/wiki/Don%27t_You_Worry_Child', publisher: 'Wikipedia' },
    { title: 'Drumcode', url: 'https://www.drumcode.se/', publisher: 'Drumcode' },
  ],
};

export const playlistPeakTime = playlistPost(peakTime);
