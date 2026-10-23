import { playlistPost, wiki, type Playlist } from './shared.ts';
import { PLAYLIST_MEDIA_C } from './media-c.ts';

/** Mainstage anthems, big room and progressive, from Levels to 2026, past the five tracks of the mainstage guide (research 2026-10-23: Wikipedia, Billboard, DJ Mag, EDMTunes, the labels' channels). */
const mainstage: Playlist = {
  key: 'playlists/playlist-mainstage-edm',
  slug: 'playlist-mainstage-edm',
  kind: 'style',
  title: {
    vi: 'Playlist mainstage: 10 bài big room và progressive',
    en: 'Mainstage playlist: 10 big room and progressive anthems',
  },
  excerpt: {
    vi: 'Playlist mainstage 10 bài, từ Levels và Don\'t You Worry Child đến Tremor, Bigfoot, Hardwell ở Tomorrowland 2025 và Happiness Is So Sad năm 2026, kèm lý do nghe.',
    en: 'A 10-track mainstage playlist from Levels and Don\'t You Worry Child to Tremor, Bigfoot, Hardwell at Tomorrowland 2025 and 2026\'s Happiness Is So Sad, with why to listen.',
  },
  cover: PLAYLIST_MEDIA_C.mainstage,
  styles: ['mainstage', 'progressive-house', 'edm'],
  style: 'mainstage',
  lead: {
    vi: '**Playlist mainstage** này đi tiếp từ cẩm nang Mainstage EDM: 10 bài của các sân khấu chính lễ hội, từ "Levels" của Avicii đến "Happiness Is So Sad" của Swedish House Mafia năm 2026, qua progressive house, big room và set đóng màn Tomorrowland 2025 của Hardwell. Mỗi bài có trình phát và lý do nên nghe.',
    en: '**This mainstage playlist** picks up where our Mainstage EDM guide leaves off: 10 tracks from the festival main stages, from Avicii\'s "Levels" to Swedish House Mafia\'s "Happiness Is So Sad" in 2026, by way of progressive house, big room and Hardwell\'s Tomorrowland 2025 closing set. Each has a player and a reason to listen.',
  },
  tracks: [
    {
      youtube: '_ovdm2yX4MA', artist: 'Avicii', title: 'Levels', year: 2011, channel: 'AviciiOfficialVEVO',
      style: { vi: 'Progressive house', en: 'Progressive house' },
      note: {
        vi: 'Bài ra mắt không tên trong Essential Mix của Pete Tong trên BBC Radio 1 ngày 11/12/2010, được Avicii chơi suốt năm 2011 rồi phát hành ngày 28/10/2011 (Wikipedia). Nghe giai điệu synth sáng lặp lại và đoạn giọng hát lấy mẫu: progressive house với một câu nhạc cả sân vận động hát theo, khuôn mẫu của mainstage những năm 2010.',
        en: 'It premiered untitled on Pete Tong\'s Essential Mix on BBC Radio 1 on 11 December 2010, was played live by Avicii throughout 2011 and released on 28 October 2011 (Wikipedia). Listen to the bright repeating synth melody and the sampled vocal: progressive house with a hook a whole stadium sings, the template for 2010s mainstage.',
      },
    },
    {
      youtube: '9G1I16gJBvU', artist: 'Sebastian Ingrosso & Alesso feat. Ryan Tedder', title: 'Calling (Lose My Mind)', channel: 'IngrossoAlessoVEVO',
      style: { vi: 'Progressive house có giọng hát', en: 'Vocal progressive house' },
      note: {
        vi: 'Sebastian Ingrosso của Swedish House Mafia làm bài với Alesso, khi đó vừa ký với label của Ingrosso, và Ryan Tedder của OneRepublic hát; bài đạt hai lần bạch kim ở Thuỵ Điển (Wikipedia). Nghe đường piano và hợp âm dâng lên rồi vỡ ra ở drop: âm thanh Thuỵ Điển đã định hình các sân khấu lớn.',
        en: 'Sebastian Ingrosso of Swedish House Mafia made it with Alesso, newly signed to Ingrosso\'s label, and OneRepublic\'s Ryan Tedder sings; it went double platinum in Sweden (Wikipedia). Listen to the piano line and the chords swelling and breaking at the drop: the Swedish sound that shaped the big stages.',
      },
    },
    {
      youtube: '1y6smkh6c-0', artist: 'Swedish House Mafia feat. John Martin', title: 'Don\'t You Worry Child', channel: 'SHMVEVO',
      style: { vi: 'Progressive house, anthem lễ hội', en: 'Progressive house, festival anthem' },
      note: {
        vi: 'Single cuối trong tuyển tập Until Now của Swedish House Mafia, với giọng ca Thuỵ Điển John Martin; ở Mỹ đây là bài thứ hai của nhóm đứng đầu bảng Dance/Mix Show Airplay của Billboard sau "Save the World", và là hit lớn nhất của nhóm (Wikipedia). Nghe đoạn guitar mộc mở đầu rồi lead synth vang dội: bài để kết một đêm lễ hội.',
        en: 'The last single from Swedish House Mafia\'s compilation Until Now, sung by Swedish singer John Martin; in the US it was the group\'s second No. 1 on Billboard\'s Dance/Mix Show Airplay chart after "Save the World", and it is their biggest hit (Wikipedia). Listen to the acoustic guitar opening and then the soaring lead: a song to end a festival night.',
      },
    },
    {
      youtube: '9vMh9f41pqE', artist: 'Dimitri Vegas, Martin Garrix, Like Mike', title: 'Tremor', year: 2014, channel: 'Spinnin\' Records', label: 'Spinnin\' Records',
      style: { vi: 'Big room', en: 'Big room' },
      note: {
        vi: 'Bài chính thức của sự kiện Sensation năm 2014, Spinnin\' Records phát hành trên Beatport ngày 20/4/2014, và vào bảng xếp hạng đĩa đơn Anh ở hạng 30 (Wikipedia). Đây là big room ở đỉnh cao: đoạn build với tiếng snare dồn, một khoảng lặng, rồi drop chỉ có vài nốt synth và kick rất to. Nghe cách sự tối giản ấy làm đám đông nhảy cùng lúc.',
        en: 'The official anthem of the 2014 Sensation event, released by Spinnin\' Records on Beatport on 20 April 2014; it entered the UK Singles Chart at No. 30 (Wikipedia). This is big room at its peak: a snare-roll build, a silence, then a drop of a few synth notes and a huge kick. Listen to how that simplicity makes a whole crowd jump at once.',
      },
    },
    {
      youtube: 'UwsY_foobEw', artist: 'Sander van Doorn, Martin Garrix, DVBBS feat. Aleesia', title: 'Gold Skies', year: 2014, channel: 'Spinnin\' Records',
      style: { vi: 'Big room có giọng hát', en: 'Vocal big room' },
      note: {
        vi: 'Bài của Sander van Doorn, Martin Garrix và bộ đôi Canada DVBBS với giọng ca Aleesia, phát hành trên Beatport ngày 2/6/2014 (Wikipedia). Bài cho thấy big room không chỉ có drop: phần giọng hát và hợp âm mở đầu làm đám đông dịu xuống trước khi lead synth lớn trở lại. Nghe cách bài chuyển giữa hai năng lượng đó.',
        en: 'A track by Sander van Doorn, Martin Garrix and Canadian duo DVBBS with singer Aleesia, released on Beatport on 2 June 2014 (Wikipedia). It shows big room is not only drops: the vocal and opening chords calm the crowd before the big lead synth returns. Listen to how it moves between those two energies.',
      },
    },
    {
      youtube: '1FPRNHHw79g', artist: 'W&W', title: 'Bigfoot', year: 2014, channel: 'Armada Music TV',
      style: { vi: 'Big room', en: 'Big room' },
      note: {
        vi: 'Sau năm năm làm trance, bộ đôi Hà Lan W&W lập label Mainstage Music và chuyển sang big room; "Bigfoot" năm 2014 là bài đột phá của họ (Wikipedia), và EDMTunes khi đó gọi đây là một trong những bản lớn nhất năm, được gần như mọi sân khấu lễ hội chơi. Nghe tiếng lead synth thô, mạnh và drop như tiếng bước chân khổng lồ.',
        en: 'After five years of trance, Dutch duo W&W founded the Mainstage Music label and moved into big room; "Bigfoot" in 2014 was their breakthrough (Wikipedia), and EDMTunes called it one of the year\'s biggest releases, played on virtually every festival stage. Listen to the raw, forceful lead synth and a drop like giant footsteps.',
      },
    },
    {
      youtube: 'Dr1nN__-2Po', artist: 'Tiësto & KSHMR feat. Vassy', title: 'Secrets', year: 2015, channel: 'Spinnin\' Records', label: 'Musical Freedom',
      style: { vi: 'Big room pha giai điệu phương Đông', en: 'Big room with an Eastern melody' },
      note: {
        vi: 'Phát hành ngày 16/3/2015 trên Musical Freedom, label của Tiësto, và có trong tuyển tập Club Life, Vol. 4 – New York City (Wikipedia). KSHMR mang vào giai điệu và tiếng nhạc cụ gợi Nam Á, Vassy hát phần chính. Nghe cách tiếng lead mang âm sắc phương Đông thay cho synth big room thường gặp: một hướng đi khác cho sân khấu chính.',
        en: 'Released on 16 March 2015 on Tiësto\'s Musical Freedom label and included on the compilation Club Life, Vol. 4 – New York City (Wikipedia). KSHMR brings South Asian-sounding melodies and instruments, and Vassy sings the lead. Listen to the lead carrying an Eastern tone instead of the usual big room synth: another road for the main stage.',
      },
    },
    {
      youtube: 'd9mJPcIl6eo', artist: 'Hardwell', title: 'REBELS NEVER DIE', year: 2022, channel: 'Hardwell', label: 'Revealed Recordings',
      style: { vi: 'Big room tối, pha techno', en: 'Dark big room with techno' },
      note: {
        vi: 'Bài chủ đề của Rebels Never Die, album thứ hai của Hardwell, phát hành ngày 9/9/2022 trên label riêng Revealed Recordings (Wikipedia). Hardwell được DJ Mag bầu là DJ số 1 thế giới năm 2013 và 2014. Album đánh dấu sự trở lại với âm thanh tối và nặng hơn. Nghe kick dày, bass thấp và không khí u ám: mainstage những năm 2020 mượn sức nặng của techno.',
        en: 'The title track of Rebels Never Die, Hardwell\'s second album, released on 9 September 2022 on his own Revealed Recordings (Wikipedia). DJ Mag voted Hardwell the world\'s No. 1 DJ in 2013 and 2014. The album marked his return with a darker, heavier sound. Listen to the thick kick, the low bass and the gloom: 2020s mainstage borrowing techno\'s weight.',
      },
    },
    {
      youtube: 'b3esC6cJ7RQ', artist: 'Hardwell', title: 'Tomorrowland 2025 (MainStage closing set)', year: 2025, channel: 'Hardwell',
      style: { vi: 'Set đóng màn sân khấu chính', en: 'A main-stage closing set' },
      note: {
        vi: 'Đây là set gần một giờ, không phải single: Hardwell đóng màn sân khấu chính Tomorrowland 2025, do kênh chính thức của anh đăng. Một set mainstage là cách tốt nhất để hiểu dòng nhạc này: bài mới, bản edit riêng và những anthem cũ nối vào nhau. Nghe cách anh xếp các đoạn build và drop, và cách pháo hoa của buổi đóng màn đi cùng âm nhạc.',
        en: 'This is a set of nearly an hour, not a single: Hardwell closing Tomorrowland 2025\'s main stage, posted by his official channel. A mainstage set is the best way to understand the style: new tracks, his own edits and old anthems run into one another. Listen to how he stacks builds and drops, and how the closing show\'s fireworks move with the music.',
      },
    },
    {
      youtube: 'bkeYOAbPCYg', artist: 'Swedish House Mafia & Lykke Li', title: 'Happiness Is So Sad', year: 2026, channel: 'Swedish House Mafia', label: 'DANSA',
      style: { vi: 'Progressive house có giọng hát', en: 'Vocal progressive house' },
      note: {
        vi: 'Phát hành ngày 30/7/2026 qua DANSA, label độc lập của Swedish House Mafia, bài lên số 1 bảng Dance Airplay của Billboard (ngày 24/10/2026), lần thứ tư của nhóm và lần đầu tiên Lykke Li đứng đầu một bảng Billboard ở Mỹ (Billboard). Nghe giọng hát buồn của Lykke Li trên hợp âm progressive: mainstage năm 2026 vẫn cần một bài hát thật.',
        en: 'Released on 30 July 2026 via DANSA, Swedish House Mafia\'s independent label, it reached No. 1 on Billboard\'s Dance Airplay chart (dated 24 October 2026), the group\'s fourth and Lykke Li\'s first No. 1 on any US Billboard chart (Billboard). Listen to Lykke Li\'s melancholy vocal over progressive chords: 2026 mainstage still needs a real song.',
      },
    },
  ],
  method: {
    vi: 'Chúng tôi chọn 10 bài theo bốn tiêu chí: mỗi nhánh của mainstage (progressive house, big room, big room có giọng hát, mainstage pha techno) có ít nhất một bài, từ năm 2011 đến 2026; mỗi bài được một nguồn uy tín nhắc tới (Wikipedia, Billboard, EDMTunes) hoặc có thành tích trên bảng xếp hạng; không bài nào lặp lại năm bài trong cẩm nang Mainstage EDM; và mọi trình phát đều từ kênh chính thức của nghệ sĩ hoặc label, đã kiểm tra qua oEmbed của YouTube. Năm phát hành chỉ ghi khi có nguồn.',
    en: 'We chose 10 tracks on four rules: every branch of mainstage (progressive house, big room, vocal big room, techno-leaning mainstage) has at least one, from 2011 to 2026; each is named by a reputable source (Wikipedia, Billboard, EDMTunes) or has a chart record; none repeats the five tracks in our Mainstage EDM guide; and every player comes from the artist\'s or label\'s official channel, checked through YouTube\'s oEmbed. A release year is given only when a source gives it.',
  },
  notes: {
    vi: 'Mainstage năm 2026 quay về bài hát: Swedish House Mafia lên số 1 Dance Airplay với Lykke Li, và tháng 10/2026 Martin Garrix công bố album thứ ba MARTY với Madonna, Ed Sheeran, U2 và Aitana (EDMTunes). Big room thuần drop của năm 2014 vẫn sống trong các set đóng màn, như của Hardwell ở Tomorrowland 2025. Nếu mới nghe, hãy bắt đầu bằng "Levels" và "Don\'t You Worry Child".',
    en: 'Mainstage in 2026 is turning back to songs: Swedish House Mafia reached No. 1 on Dance Airplay with Lykke Li, and in October 2026 Martin Garrix announced his third album, MARTY, with Madonna, Ed Sheeran, U2 and Aitana (EDMTunes). The pure-drop big room of 2014 lives on in closing sets such as Hardwell\'s at Tomorrowland 2025. New to it? Start with "Levels" and "Don\'t You Worry Child".',
  },
  related: [
    { slug: 'mainstage-edm', line: { vi: 'Mainstage EDM là gì? · big room, BPM và các nhánh', en: 'What is mainstage EDM? · big room, BPM and styles' } },
    { slug: 'playlist-house', line: { vi: 'Playlist house · từ Chicago đến afro house', en: 'House playlist · from Chicago to afro house' } },
    { slug: 'festival-edm-the-gioi-2026', line: { vi: 'Festival EDM thế giới 2026 · Tomorrowland, Ultra, EDC', en: 'World EDM festivals 2026 · Tomorrowland, Ultra, EDC' } },
    { slug: 'playlist-edm', line: { vi: 'Playlist EDM · mọi playlist theo dòng nhạc', en: 'EDM playlists · every playlist by style' } },
  ],
  facts: [
    { label: { vi: 'Dòng nhạc', en: 'Style' }, value: { vi: 'Mainstage: progressive house, big room', en: 'Mainstage: progressive house, big room' } },
    { label: { vi: 'Số bài', en: 'Tracks' }, value: { vi: '10', en: '10' } },
    { label: { vi: 'Giai đoạn', en: 'Span' }, value: { vi: '2011–2026', en: '2011–2026' } },
    { label: { vi: 'BPM thường gặp', en: 'Typical BPM' }, value: { vi: '126–132 (thường 128)', en: '126–132 (usually 128)' } },
    { label: { vi: 'Hợp với', en: 'Best for' }, value: { vi: 'Chuẩn bị cho một lễ hội; giờ cao điểm của bữa tiệc', en: 'Getting ready for a festival; the peak of a party' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Bài mainstage nào nên nghe trước?', en: 'Which mainstage track should I hear first?' }, a: { vi: '"Levels" của Avicii (2011) là khuôn mẫu của progressive house sân khấu lớn; "Tremor" (2014) là big room ở đỉnh cao.', en: 'Avicii\'s "Levels" (2011) is the template of big-stage progressive house; "Tremor" (2014) is big room at its peak.' } },
    { q: { vi: 'Mainstage EDM có tốc độ bao nhiêu BPM?', en: 'What BPM is mainstage EDM?' }, a: { vi: 'Khoảng 126–132 BPM, thường là 128.', en: 'About 126–132 BPM, usually 128.' } },
    { q: { vi: 'Big room và progressive house khác nhau thế nào?', en: 'How is big room different from progressive house?' }, a: { vi: 'Progressive house xây giai điệu và hợp âm dần dần, như "Levels"; big room dồn vào drop tối giản với kick rất to, như "Tremor" hay "Bigfoot".', en: 'Progressive house builds melody and chords gradually, like "Levels"; big room pours everything into a minimal drop with a huge kick, like "Tremor" or "Bigfoot".' } },
    { q: { vi: 'Nghe những bài này ở đâu?', en: 'Where can I stream these tracks?' }, a: { vi: 'Mỗi bài có trình phát YouTube từ kênh chính thức của nghệ sĩ hoặc label, chỉ tải khi bạn bấm phát; các bài cũng có trên các dịch vụ nghe nhạc.', en: 'Each has a YouTube player from the artist\'s or label\'s official channel, loading only when you press play; the tracks are on the streaming services too.' } },
    { q: { vi: 'Danh sách này cập nhật bao lâu một lần?', en: 'How often is this list updated?' }, a: { vi: 'Khi có bài mới đủ tiêu chí; lần kiểm tra gần nhất là tháng 10/2026.', en: 'When a new track meets the rules; it was last checked in October 2026.' } },
  ],
  sources: [
    { title: 'Swedish House Mafia scores fourth Dance Airplay No. 1 with \'Happiness Is So Sad\'', url: 'https://www.billboard.com/music/chart-beat/swedish-house-mafia-happiness-is-so-sad-number-1-dance-airplay-1236362665/', publisher: 'Billboard' },
    { title: 'W&W – Bigfoot (Dillon Francis Remix)', url: 'https://www.edmtunes.com/2014/09/ww-bigfoot-dillon-francis-remix/', publisher: 'EDMTunes' },
    { title: 'Martin Garrix announces third studio album MARTY', url: 'https://www.edmtunes.com/2026/10/21/martin-garrix-announces-third-studio-album-marty/', publisher: 'EDMTunes' },
    { title: 'Levels (Avicii song)', url: wiki('Levels (Avicii song)'), publisher: 'Wikipedia' },
    { title: 'Don\'t You Worry Child', url: wiki('Don\'t You Worry Child'), publisher: 'Wikipedia' },
    { title: 'Tremor (song)', url: wiki('Tremor (song)'), publisher: 'Wikipedia' },
    { title: 'Gold Skies', url: wiki('Gold Skies'), publisher: 'Wikipedia' },
    { title: 'W&W', url: wiki('W&W'), publisher: 'Wikipedia' },
    { title: 'Rebels Never Die', url: wiki('Rebels Never Die'), publisher: 'Wikipedia' },
  ],
};

export const playlistMainstage = playlistPost(mainstage);
