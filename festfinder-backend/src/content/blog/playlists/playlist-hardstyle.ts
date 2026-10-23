import { playlistPost, wiki, type Playlist } from './shared.ts';
import { PLAYLIST_MEDIA_B } from './media-b.ts';

/** Hardstyle told through its anthems, Qlimax 2003 to Defqon.1 2026, past the five tracks of the hardstyle guide (research 2026-10-23: Wikipedia, Q-dance, Hard News, Scantraxx, the official channels). */
const hardstyle: Playlist = {
  key: 'playlists/playlist-hardstyle',
  slug: 'playlist-hardstyle',
  kind: 'style',
  title: {
    vi: 'Playlist hardstyle: 12 anthem từ Qlimax 2003 đến Defqon.1 2026',
    en: 'Hardstyle playlist: 12 anthems, Qlimax 2003 to Defqon.1 2026',
  },
  excerpt: {
    vi: 'Playlist hardstyle 12 bài kể lịch sử dòng nhạc qua anthem của Qlimax và Defqon.1, từ The Prophet năm 2003 đến "Sacred Oath" năm 2026: euphoric, rawstyle, kèm lý do nghe.',
    en: 'A 12-track hardstyle playlist told through the Qlimax and Defqon.1 anthems, from The Prophet in 2003 to 2026\'s "Sacred Oath": euphoric and raw, and why.',
  },
  cover: PLAYLIST_MEDIA_B.hardstyle,
  styles: ['hardstyle', 'rawstyle', 'hard-dance'],
  style: 'hardstyle',
  lead: {
    vi: '**Playlist hardstyle** này kể lịch sử dòng nhạc qua 12 anthem, những bài mà Q-dance đặt làm nhạc chủ đề cho Qlimax và Defqon.1 mỗi năm. Danh sách đi từ "Follow The Leader" của The Prophet năm 2003 đến "Sacred Oath" của D-Sturb năm 2026, qua euphoric và rawstyle, và không lặp năm bài đã có trong cẩm nang Hardstyle.',
    en: '**This hardstyle playlist** tells the genre\'s history through 12 anthems, the tracks Q-dance commissions each year as the theme of Qlimax and Defqon.1. It runs from The Prophet\'s "Follow The Leader" in 2003 to D-Sturb\'s "Sacred Oath" in 2026, through euphoric and rawstyle, without repeating the five tracks already in our Hardstyle guide.',
  },
  tracks: [
    {
      youtube: '4Xqsw6bi6-Q', artist: 'The Prophet', title: 'Follow The Leader (Qlimax 2003 Anthem)', year: 2003, channel: 'DJ The Prophet',
      style: { vi: 'Hardstyle thời đầu', en: 'Early hardstyle' },
      note: {
        vi: 'Scantraxx gọi The Prophet là "bố già của hardstyle": ông bắt đầu với hardcore từ năm 1990, thuộc thế hệ Thunderdome, rồi chuyển hướng sau một set hard house ở sự kiện Houseqlassics của Q-dance năm 1999. "Follow The Leader" là anthem của Qlimax ngày 12/4/2003 ở Thialf Stadion, Heerenveen (Wikipedia). Nghe kick còn mộc, chưa méo nhiều: hardstyle khi mới tách khỏi hard trance.',
        en: 'Scantraxx calls The Prophet the "Godfather of Hardstyle": he started producing hardcore in 1990, part of the Thunderdome generation, and changed course after a hard house set at Q-dance\'s Houseqlassics in 1999. "Follow The Leader" was the anthem of Qlimax on 12 April 2003 at Thialf Stadion, Heerenveen (Wikipedia). Listen to a kick still plain, barely distorted: hardstyle just split from hard trance.',
      },
    },
    {
      youtube: 'pMU6ndrUi5I', artist: 'Technoboy', title: 'Next Dimensional World (Qlimax 2008 Anthem)', year: 2008, channel: 'TNT aka TECHNOBOY\'N\'TUNEBOY',
      style: { vi: 'Hardstyle Ý', en: 'Italian hardstyle' },
      note: {
        vi: '"Next Dimensional World" là anthem Qlimax ngày 22/11/2008 ở GelreDome, Arnhem, và Technoboy tự trình diễn anthem show hôm đó (Wikipedia). Đây là video anthem show trên kênh của TNT, bộ đôi của Technoboy và Tuneboy. Nghe tiếng lead synth sắc và những cú dừng đột ngột: hardstyle cuối thập niên 2000 bắt đầu dựa vào màn trình diễn trên sân khấu.',
        en: '"Next Dimensional World" was the anthem of Qlimax on 22 November 2008 at the GelreDome, Arnhem, and Technoboy performed its anthem show himself (Wikipedia). This is that anthem show, on the channel of TNT, his duo with Tuneboy. Listen to the sharp lead synth and sudden stops: late-2000s hardstyle began leaning on the stage show.',
      },
    },
    {
      youtube: '58HUgtK7sHM', artist: 'D-Block & S-te-Fan', title: 'The Nature Of Our Mind (Qlimax Anthem 2009)', year: 2009, channel: 'D-Block & S-te-Fan (DBSTF)',
      style: { vi: 'Euphoric hardstyle', en: 'Euphoric hardstyle' },
      note: {
        vi: 'Anthem của Qlimax ngày 21/11/2009, chủ đề "The Nature of Our Mind", do D-Block & S-te-Fan làm và trình diễn anthem show (Wikipedia); họ còn làm anthem Defqon.1 2022 "Primal Energy" dưới tên Ghost Stories. Nghe đoạn breakdown dài như trance rồi kick quay lại: công thức euphoric mà cả thập niên sau đi theo.',
        en: 'The anthem of Qlimax on 21 November 2009, themed "The Nature of Our Mind", made and performed as the anthem show by D-Block & S-te-Fan (Wikipedia); they also made the Defqon.1 2022 anthem "Primal Energy" as Ghost Stories. Listen to the long, trance-like breakdown before the kick returns: the euphoric formula the following decade kept to.',
      },
    },
    {
      youtube: 'lGBLZyYlDtI', artist: 'Brennan Heart', title: 'Alternate Reality (Qlimax 2010 Anthem)', year: 2010, channel: 'Q-dance',
      style: { vi: 'Euphoric hardstyle', en: 'Euphoric hardstyle' },
      note: {
        vi: '"Alternate Reality" là anthem Qlimax ngày 27/11/2010 ở GelreDome (Wikipedia), phát từ kênh chính thức của Q-dance. Cẩm nang đã có "Imaginary" của Brennan Heart; đây là mặt khác của ông, tối và kịch tính hơn. Nghe cách giai điệu chính chạy cùng kick distorted, nặng hơn hẳn thời The Prophet.',
        en: '"Alternate Reality" was the anthem of Qlimax on 27 November 2010 at the GelreDome (Wikipedia), playing here from Q-dance\'s official channel. The guide already has Brennan Heart\'s "Imaginary"; this is his other side, darker and more dramatic. Listen to the lead melody run with the distorted kick, far heavier than in The Prophet\'s day.',
      },
    },
    {
      youtube: 'UlyuOu6Idvk', artist: 'Gunz For Hire ft. Ruffian', title: 'Immortal (Qlimax 2013 Anthem)', year: 2013, channel: 'Q-dance',
      style: { vi: 'Rawstyle', en: 'Rawstyle' },
      note: {
        vi: 'Qlimax ngày 23/11/2013 mang chủ đề "Immortal Essence", và anthem là "Immortal" của Gunz For Hire với giọng của Ruffian, MC của Qlimax từ năm 2003 (Wikipedia). Đây là lần rawstyle chiếm sân khấu anthem: kick thô, gắt và giọng MC thay cho giai điệu. Nghe để hiểu nhánh "raw" khác euphoric thế nào.',
        en: 'Qlimax on 23 November 2013 was themed "Immortal Essence", and its anthem was Gunz For Hire\'s "Immortal" with the voice of Ruffian, Qlimax\'s MC since 2003 (Wikipedia). This is rawstyle taking the anthem stage: a rough, harsh kick and an MC\'s voice in place of a melody. Listen to hear how the "raw" branch differs from euphoric.',
      },
    },
    {
      youtube: 'LfhiHn0u-tk', artist: 'Wildstylez', title: 'Temple of Light (Qlimax 2017 Anthem)', year: 2017, channel: 'Q-dance',
      style: { vi: 'Euphoric hardstyle', en: 'Euphoric hardstyle' },
      note: {
        vi: 'Anthem của Qlimax ngày 18/11/2017, chủ đề "Temple of Light", do Wildstylez làm và trình diễn anthem show (Wikipedia). Nghe phần giai điệu như nhạc phim và đoạn cao trào khi kick quay lại sau breakdown: euphoric hardstyle của cuối thập niên 2010 dày lớp, gần với nhạc giao hưởng hơn bao giờ hết.',
        en: 'The anthem of Qlimax on 18 November 2017, themed "Temple of Light", made and performed as the anthem show by Wildstylez (Wikipedia). Listen to the film-score melody and the climax when the kick returns after the breakdown: late-2010s euphoric hardstyle, layered and closer to orchestral music than ever.',
      },
    },
    {
      youtube: 'JzBUGARFC4k', artist: 'Sub Zero Project', title: 'The Game Changer (Qlimax 2018 Anthem)', year: 2018, channel: 'Q-dance',
      style: { vi: 'Hardstyle hiện đại', en: 'Modern hardstyle' },
      note: {
        vi: 'Sub Zero Project làm anthem Qlimax ngày 24/11/2018, "The Game Changer", và trình diễn anthem show (Wikipedia); họ còn làm anthem Defqon.1 2023 "Path of the Warrior". Cẩm nang đã có "The Project". Nghe sound design: kick và lead được thiết kế như hiệu ứng điện ảnh, hướng mà hardstyle những năm 2020 đi theo.',
        en: 'Sub Zero Project made the anthem of Qlimax on 24 November 2018, "The Game Changer", and performed its anthem show (Wikipedia); they also made the Defqon.1 2023 anthem "Path of the Warrior". The guide already has "The Project". Listen to the sound design: kick and lead built like film effects, the direction 2020s hardstyle took.',
      },
    },
    {
      youtube: 'K5tSjwdy1QM', artist: 'B-Front', title: 'Symphony of Shadows (Qlimax 2019 Anthem)', year: 2019, channel: 'Q-dance',
      style: { vi: 'Rawstyle giai điệu', en: 'Melodic rawstyle' },
      note: {
        vi: 'Anthem của Qlimax ngày 23/11/2019, chủ đề "Symphony of Shadows", do B-Front làm và trình diễn anthem show (Wikipedia), phát từ kênh chính thức của Q-dance. Đây là rawstyle có giai điệu: phần mở đầu như dàn nhạc giao hưởng, rồi kick raw nặng. Nghe để thấy ranh giới giữa euphoric và raw mờ dần cuối thập niên 2010.',
        en: 'The anthem of Qlimax on 23 November 2019, themed "Symphony of Shadows", made and performed as the anthem show by B-Front (Wikipedia), playing from Q-dance\'s official channel. This is rawstyle with a melody: an orchestral opening, then a heavy raw kick. Listen to hear the line between euphoric and raw blur at the end of the 2010s.',
      },
    },
    {
      youtube: 'WwAhtA0uHhc', artist: 'Hard Driver', title: 'Enter the Void (Qlimax 2023 Anthem)', year: 2023, channel: 'Q-dance',
      style: { vi: 'Euphoric hardstyle', en: 'Euphoric hardstyle' },
      note: {
        vi: '"Enter the Void" là anthem cuối cùng của Qlimax, ngày 18/11/2023 ở GelreDome: ngày 25/7/2024 Q-dance công bố Qlimax 2024 sẽ là lần cuối, và lần cuối ấy (chủ đề "The Final Prophecy") không có anthem (Wikipedia). Nghe như lời tạm biệt của một sự kiện hơn hai mươi năm: giai điệu lớn, kick euphoric, đoạn kết dài.',
        en: '"Enter the Void" was Qlimax\'s last anthem, on 18 November 2023 at the GelreDome: on 25 July 2024 Q-dance announced that Qlimax 2024 would be the very last edition, and that last edition (themed "The Final Prophecy") had no anthem (Wikipedia). Hear it as the farewell of an event that ran over twenty years: a big melody, a euphoric kick, a long ending.',
      },
    },
    {
      youtube: 'UmIB-s-3ZAA', artist: 'Sound Rush', title: 'Power of the Tribe (Defqon.1 2024 Anthem)', year: 2024, channel: 'Q-dance',
      style: { vi: 'Euphoric hardstyle', en: 'Euphoric hardstyle' },
      note: {
        vi: '"Power of the Tribe" là anthem của Defqon.1 2024, diễn ra 27–30/6 với khoảng 250.000 khách (Wikipedia). Hard News gọi Defqon.1, ở Biddinghuizen (Hà Lan), là sự kiện harder styles lớn nhất thế giới. Nghe phần hô "tribe" và giai điệu cho cả đám đông hát theo: anthem Defqon.1 được viết để hàng chục nghìn người cùng giơ tay ở sân khấu RED.',
        en: '"Power of the Tribe" was the anthem of Defqon.1 2024, held 27–30 June with about 250,000 visitors (Wikipedia). Hard News calls Defqon.1, in Biddinghuizen in the Netherlands, the world\'s biggest harder styles event. Listen to the "tribe" chant and the sing-along melody: a Defqon.1 anthem is written for tens of thousands to raise their hands at the RED stage.',
      },
    },
    {
      youtube: '1PQbbCIP9BI', artist: 'Vertile', title: 'Where Legends Rise (Defqon.1 2025 Anthem)', year: 2025, channel: 'Q-dance',
      style: { vi: 'Euphoric hardstyle', en: 'Euphoric hardstyle' },
      note: {
        vi: 'Anthem của Defqon.1 2025, diễn ra 26–29/6 với 268.236 khách (Wikipedia); năm đó Hard News đưa tin một set "Legends" dài năm tiếng mừng 25 năm hardstyle. Vertile là thế hệ mới của euphoric. Nghe cách bài nhắc lại không khí của các anthem cũ trong lớp âm thanh hiện đại: đúng tinh thần "nơi huyền thoại trỗi dậy".',
        en: 'The anthem of Defqon.1 2025, held 26–29 June with 268,236 visitors (Wikipedia); that year Hard News reported a five-hour "Legends" set honouring 25 years of hardstyle. Vertile belongs to euphoric\'s new generation. Listen to how it recalls the old anthems inside a modern sound: true to "where legends rise".',
      },
    },
    {
      youtube: 'Nwkq9-6F6Wo', artist: 'D-Sturb ft. E-Life', title: 'Sacred Oath (Defqon.1 2026 Anthem)', year: 2026, channel: 'Q-dance',
      style: { vi: 'Rawstyle', en: 'Rawstyle' },
      note: {
        vi: 'Hard News đưa tin Defqon.1 công bố "Sacred Oath" của D-Sturb và E-Life làm anthem 2026, cho bốn ngày 25–28/6 ở The Holy Grounds, Biddinghuizen. Ngày 26/6, sau cảnh báo đỏ đầu tiên vì nắng nóng của Viện Khí tượng Hà Lan, các ngày còn lại bị huỷ. Nghe đây là anthem của một năm dang dở: rawstyle nặng, giọng của E-Life, nhịp như lời thề.',
        en: 'Hard News reported Defqon.1 naming D-Sturb and E-Life\'s "Sacred Oath" its 2026 anthem, for four days on 25–28 June at The Holy Grounds, Biddinghuizen. On 26 June, after the Dutch weather institute\'s first-ever code red warning for heat, the remaining days were cancelled. Hear the anthem of an unfinished year: heavy rawstyle, E-Life\'s vocal, a beat like an oath.',
      },
    },
  ],
  method: {
    vi: 'Chúng tôi chọn anthem thay vì bảng xếp hạng vì hardstyle kể lịch sử của nó qua các sự kiện: mỗi năm Q-dance đặt một nghệ sĩ làm nhạc chủ đề cho Qlimax và Defqon.1, và danh sách anthem được ghi lại đầy đủ trên Wikipedia. Từ hơn hai mươi anthem, chúng tôi lấy 12 bài phủ từ 2003 đến 2026, cả euphoric lẫn rawstyle, không lặp năm bài của cẩm nang Hardstyle, và chỉ dùng video từ kênh chính thức của Q-dance hoặc của nghệ sĩ, đã kiểm tra qua oEmbed.',
    en: 'We chose anthems rather than charts because hardstyle tells its history through events: each year Q-dance commissions an artist to write the theme of Qlimax and Defqon.1, and the anthem lists are fully recorded on Wikipedia. From more than twenty anthems we took 12 covering 2003 to 2026, euphoric and rawstyle alike, repeating none of the five tracks in our Hardstyle guide, and only from Q-dance\'s or the artist\'s official channel, checked through oEmbed.',
  },
  notes: {
    vi: 'Qlimax đã khép lại sau lần cuối năm 2024, nên Defqon.1 giờ là nơi hardstyle công bố anthem lớn nhất mỗi năm. Trang của Q-dance hẹn Defqon.1 2027 vào 24–27/6/2027, và theo Wikipedia, chủ đề năm đó là "The Deepening" với anthem của Rebelion, một tên tuổi rawstyle. Nếu bạn đến hardstyle từ trance, hãy bắt đầu với các bài euphoric (Brennan Heart, Wildstylez); nếu thích techno nặng, hãy thử rawstyle (Gunz For Hire, D-Sturb).',
    en: 'Qlimax closed after its last edition in 2024, so Defqon.1 is now where hardstyle unveils its biggest anthem each year. Q-dance\'s page sets Defqon.1 2027 for 24–27 June 2027, and per Wikipedia that year\'s theme is "The Deepening", with an anthem by Rebelion, a rawstyle name. If you come to hardstyle from trance, start with the euphoric tracks (Brennan Heart, Wildstylez); if you like heavy techno, try rawstyle (Gunz For Hire, D-Sturb).',
  },
  related: [
    { slug: 'hardstyle', line: { vi: 'Hardstyle là gì? · lịch sử, euphoric, rawstyle và năm bài kinh điển', en: 'What is hardstyle? · history, euphoric, rawstyle and five classics' } },
    { slug: 'playlist-trance', line: { vi: 'Playlist trance · nơi hardstyle bắt đầu', en: 'Trance playlist · where hardstyle began' } },
    { slug: 'playlist-peak-time', line: { vi: 'Playlist peak time · những bài cho giờ cao điểm', en: 'Peak-time playlist · tracks for the peak hour' } },
    { slug: 'playlist-edm', line: { vi: 'Playlist EDM · mọi playlist theo dòng nhạc', en: 'EDM playlists · every playlist by style' } },
  ],
  facts: [
    { label: { vi: 'Dòng nhạc', en: 'Style' }, value: { vi: 'Hardstyle: euphoric, rawstyle', en: 'Hardstyle: euphoric, rawstyle' } },
    { label: { vi: 'Số bài', en: 'Tracks' }, value: { vi: '12 anthem (9 Qlimax, 3 Defqon.1)', en: '12 anthems (9 Qlimax, 3 Defqon.1)' } },
    { label: { vi: 'Giai đoạn', en: 'Span' }, value: { vi: '2003–2026', en: '2003–2026' } },
    { label: { vi: 'BPM thường gặp', en: 'Typical BPM' }, value: { vi: '150–160 (thời đầu 140–150)', en: '150–160 (early years 140–150)' } },
    { label: { vi: 'Defqon.1 2027', en: 'Defqon.1 2027' }, value: { vi: '24–27/6/2027, Biddinghuizen', en: '24–27 June 2027, Biddinghuizen' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Anthem hardstyle là gì?', en: 'What is a hardstyle anthem?' }, a: { vi: 'Bài nhạc chủ đề mà Q-dance đặt một nghệ sĩ viết cho mỗi năm của Qlimax hoặc Defqon.1, thường được trình diễn trong một "anthem show" ở sân khấu chính.', en: 'The theme track Q-dance commissions from one artist for each edition of Qlimax or Defqon.1, usually performed as an "anthem show" on the main stage.' } },
    { q: { vi: 'Qlimax còn tổ chức không?', en: 'Is Qlimax still running?' }, a: { vi: 'Không. Ngày 25/7/2024 Q-dance công bố Qlimax 2024 là lần cuối; anthem cuối cùng là "Enter the Void" của Hard Driver năm 2023.', en: 'No. On 25 July 2024 Q-dance announced Qlimax 2024 as the last edition; the last anthem was Hard Driver\'s "Enter the Void" in 2023.' } },
    { q: { vi: 'Euphoric và rawstyle khác nhau thế nào?', en: 'How do euphoric and rawstyle differ?' }, a: { vi: 'Euphoric dựa vào giai điệu và breakdown như trance (Brennan Heart, Wildstylez); rawstyle có kick thô, gắt và ít giai điệu hơn (Gunz For Hire, D-Sturb).', en: 'Euphoric leans on melody and trance-like breakdowns (Brennan Heart, Wildstylez); rawstyle has a rough, harsh kick and less melody (Gunz For Hire, D-Sturb).' } },
    { q: { vi: 'Defqon.1 2026 có bị huỷ không?', en: 'Was Defqon.1 2026 cancelled?' }, a: { vi: 'Một phần: lễ hội mở ngày 25/6, rồi các ngày còn lại bị huỷ từ 26/6 sau cảnh báo đỏ đầu tiên vì nắng nóng của Viện Khí tượng Hà Lan (Hard News).', en: 'Partly: it opened on 25 June, then the remaining days were cancelled from 26 June after the Dutch weather institute\'s first-ever code red warning for heat (Hard News).' } },
    { q: { vi: 'Danh sách này cập nhật bao lâu một lần?', en: 'How often is this list updated?' }, a: { vi: 'Mỗi khi Defqon.1 có anthem mới; lần kiểm tra gần nhất là tháng 10/2026.', en: 'Whenever Defqon.1 has a new anthem; it was last checked in October 2026.' } },
  ],
  sources: [
    { title: 'Qlimax', url: wiki('Qlimax'), publisher: 'Wikipedia' },
    { title: 'Defqon.1', url: wiki('Defqon.1'), publisher: 'Wikipedia' },
    { title: 'Defqon.1 2026', url: 'https://www.q-dance.com/l/defqon1-2026', publisher: 'Q-dance' },
    { title: 'Defqon.1 has been cancelled for the remainder of the weekend', url: 'https://hardnews.nl/en/defqon-1-has-been-cancelled-for-the-remainder-of-the-weekend/', publisher: 'Hard News' },
    { title: 'Defqon.1 2026 line-up packed with unique moments: Sacred Oath', url: 'https://hardnews.nl/en/defqon-1-2026-line-up-packed-with-unique-moments-sacred-oath/', publisher: 'Hard News' },
    { title: '25 years of hardstyle honored during 5-hour Legends set at Defqon.1', url: 'https://hardnews.nl/en/25-years-of-hardstyle-honored-during-5-hour-legends-set-at-defqon-1/', publisher: 'Hard News' },
    { title: 'The Prophet', url: 'https://www.scantraxx.com/artists/the-prophet', publisher: 'Scantraxx' },
  ],
};

export const playlistHardstyle = playlistPost(hardstyle);
