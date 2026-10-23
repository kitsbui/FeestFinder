import { playlistPost, wiki, type Playlist } from './shared.ts';
import { PLAYLIST_MEDIA_B } from './media-b.ts';

/** Psytrance from the Goa years to the festival stages of 2026, past the five tracks of the psytrance guide (research 2026-10-23: Wikipedia, Twisted, Iboga, the labels' channels). */
const psytrance: Playlist = {
  key: 'playlists/playlist-psytrance',
  slug: 'playlist-psytrance',
  kind: 'style',
  title: {
    vi: 'Playlist psytrance: 11 bài từ Goa trance đến Vini Vici',
    en: 'Psytrance playlist: 11 tracks from Goa trance to Vini Vici',
  },
  excerpt: {
    vi: 'Playlist psytrance 11 bài: Goa trance của Hallucinogen và Man With No Name, Shpongle, Juno Reactor, rồi full-on và progressive của Infected Mushroom, Vini Vici, Blastoyz.',
    en: 'An 11-track psytrance playlist: Goa trance from Hallucinogen and Man With No Name, Shpongle, Juno Reactor, then the full-on and progressive of Infected Mushroom and Vini Vici.',
  },
  cover: PLAYLIST_MEDIA_B.psytrance,
  styles: ['psytrance'],
  style: 'psytrance',
  lead: {
    vi: '**Playlist psytrance** này đi tiếp từ cẩm nang Psytrance: 11 bài từ "LSD" của Hallucinogen năm 1994, thời Goa trance, đến những bài full-on và progressive đang vang ở các festival năm 2026. Danh sách đi qua bốn chặng: Goa, psychill của Shpongle, psy gặp nhạc phim và EDM, rồi làn sóng Israel và Đức của thập niên 2010 đến nay.',
    en: '**This psytrance playlist** picks up where our Psytrance guide leaves off: 11 tracks from Hallucinogen\'s "LSD" in 1994, the Goa trance years, to the full-on and progressive tracks ringing out at festivals in 2026. It moves through four stages: Goa, Shpongle\'s psychill, psy meeting film scores and EDM, then the Israeli and German wave from the 2010s to now.',
  },
  tracks: [
    {
      youtube: 'iIsVzSMRw8E', artist: 'Hallucinogen', title: 'LSD', year: 1994, channel: 'TwistedMusicUK',
      style: { vi: 'Goa trance', en: 'Goa trance' },
      note: {
        vi: 'Hallucinogen là Simon Posford, nghệ sĩ Anh sinh năm 1971 và là người lập Twisted Records; "LSD" ra năm 1994 cùng "Alpha Centauri", và bản "LSD (Live Mix)" năm 1995 (Wikipedia). Album Goa trance đầu tiên, "Project II Trance" năm 1993, đã có tên ông. Nghe đường acid uốn lượn và tiếng nói lấy mẫu: đây là âm thanh của các bãi biển Goa giữa thập niên 1990.',
        en: 'Hallucinogen is Simon Posford, an English artist born in 1971 and the founder of Twisted Records; "LSD" came out in 1994 alongside "Alpha Centauri", with "LSD (Live Mix)" in 1995 (Wikipedia). The first Goa trance album, 1993\'s "Project II Trance", already featured him. Listen to the bending acid line and the sampled voice: the sound of Goa\'s beaches in the mid-1990s.',
      },
    },
    {
      youtube: 'efc7WLCVWmw', artist: 'Man With No Name', title: 'Teleport', channel: 'Trance Classics',
      style: { vi: 'Goa trance', en: 'Goa trance' },
      note: {
        vi: 'Man With No Name là nghệ sĩ Anh Martin Freeland, biểu diễn dưới tên này từ năm 1990 và nổi tiếng nhất với "Teleport" và "Floor-Essence"; năm 2011 Perfecto Fluoro ra remix mới của "Teleport", có một bản của Astrix (Wikipedia). Nghe phần giai điệu lặp kiểu phương Đông dồn lên từng đợt: Goa trance giai điệu nhất, cầu nối giữa trance và psy.',
        en: 'Man With No Name is British artist Martin Freeland, performing under that name since 1990 and best known for "Teleport" and "Floor-Essence"; in 2011 Perfecto Fluoro released new remixes of "Teleport", one by Astrix (Wikipedia). Listen to the Eastern-sounding melody that climbs in waves: the most melodic Goa trance, a bridge between trance and psy.',
      },
    },
    {
      youtube: 'Ix0lduF1Co4', artist: 'Astral Projection', title: 'Mahadeva', channel: 'Astral Projection',
      style: { vi: 'Goa trance Israel', en: 'Israeli Goa trance' },
      note: {
        vi: 'Astral Projection là nhóm Israel, tiền thân là SFX lập năm 1989, và phần lớn phát hành qua label riêng Trust in Trance Records; "Mahadeva" được kể cùng "Kabalah" và "People Can Fly" trong những bài nổi tiếng nhất của họ (Wikipedia). Cẩm nang đã có "People Can Fly", nên ở đây là "Mahadeva": chín phút dày lớp synth, mở đường cho psy Israel.',
        en: 'Astral Projection are an Israeli group whose precursor, SFX, formed in 1989, and who release mostly through their own Trust in Trance Records; "Mahadeva" is named with "Kabalah" and "People Can Fly" among their best-known tracks (Wikipedia). The guide already has "People Can Fly", so here is "Mahadeva": nine minutes of thick synth layers that opened the road for Israeli psy.',
      },
    },
    {
      youtube: 'XwtT4ZBa3CE', artist: 'Shpongle', title: 'Divine Moments Of Truth', channel: 'TwistedMusicUK', label: 'Twisted Records',
      style: { vi: 'Psychill, psybient', en: 'Psychill, psybient' },
      note: {
        vi: 'Shpongle là dự án Anh lập năm 1996 của Simon Posford (Hallucinogen) và Raja Ram, một trong ba thành viên The Infinity Project; "Divine Moments of Truth" cũng là tên EP họ phát hành năm 2000 (Wikipedia). Nhịp chậm hơn hẳn, đầy tiếng sáo, giọng hát và hiệu ứng: nghe để thấy psy cũng có thể là âm nhạc để ngồi nghe, không chỉ để nhảy.',
        en: 'Shpongle is an English project formed in 1996 by Simon Posford (Hallucinogen) and Raja Ram, one of the three in The Infinity Project; "Divine Moments of Truth" is also the name of the EP they released in 2000 (Wikipedia). Much slower, full of flute, voices and effects: listen to hear that psy can be music to sit with, not only to dance to.',
      },
    },
    {
      youtube: 'OkRm9pnP-SA', artist: 'Juno Reactor', title: 'Navras (BLISS Remix)', channel: 'Juno Reactor',
      style: { vi: 'Psytrance, remix nhạc phim', en: 'Psytrance remix of a film score' },
      note: {
        vi: 'Juno Reactor là nhóm có trụ sở ở Brighton, nổi tiếng với chất điện tử pha nhạc giao hưởng; Ben Watkins cùng nhà soạn nhạc Don Davis làm nhạc cho loạt phim "Matrix", và "Navras" là bài khép lại "The Matrix Revolutions" (Wikipedia). Đây là bản remix psytrance của BLISS trên kênh chính thức của Juno Reactor: nghe dàn hợp xướng gặp bassline psy cuộn.',
        en: 'Juno Reactor is a Brighton-based group known for fusing electronics with orchestral music; Ben Watkins worked with composer Don Davis on the "Matrix" films, and "Navras" closes "The Matrix Revolutions" (Wikipedia). This is BLISS\'s psytrance remix on Juno Reactor\'s official channel: listen to the choir meet a rolling psy bassline.',
      },
    },
    {
      youtube: 'U4XOZeJb2ZQ', artist: 'Infected Mushroom', title: 'Spitfire', channel: 'Infected Mushroom', label: 'Monstercat',
      style: { vi: 'Full-on, psy gặp EDM', en: 'Full-on meets EDM' },
      note: {
        vi: 'Infected Mushroom là bộ đôi Israel Erez Eisen và Amit Duvdevani, lập ở Haifa năm 1996; danh sách label của họ có cả Perfecto, Dim Mak và Monstercat (Wikipedia). "Spitfire" ra trên Monstercat, label quen với khán giả EDM hơn là psy. Nghe tiếng guitar và đoạn thả nặng: đây là psy viết để chạm tới cả người nghe dubstep và electro.',
        en: 'Infected Mushroom are Israeli duo Erez Eisen and Amit Duvdevani, formed in Haifa in 1996; their labels include Perfecto, Dim Mak and Monstercat (Wikipedia). "Spitfire" came out on Monstercat, a label better known to EDM fans than to psy crowds. Listen to the guitars and the heavy drop: psy written to reach dubstep and electro listeners too.',
      },
    },
    {
      youtube: 'tDD5WHewxQk', artist: 'Liquid Soul', title: 'Desire', channel: 'Liquid Soul Official',
      style: { vi: 'Full-on giai điệu', en: 'Melodic full-on' },
      note: {
        vi: 'Liquid Soul là một trong những tên chủ lực của Iboga Records, label psytrance Đan Mạch; kênh của Iboga cũng đăng "Desire" và các bản remix của nó, và năm 2026 Liquid Soul vẫn chơi những set dài ở Adhana Festival (Brazil). Nghe bassline cuộn đều dưới một giai điệu ấm: full-on dễ vào nhất cho người đi từ trance sang.',
        en: 'Liquid Soul is one of the key names on Iboga Records, the Danish psytrance label; Iboga\'s channel also carries "Desire" and its remixes, and in 2026 Liquid Soul was still playing long sets at Adhana Festival in Brazil. Listen to the even rolling bassline under a warm melody: the easiest full-on for anyone coming over from trance.',
      },
    },
    {
      youtube: 'JCO_Kg6Q_v8', artist: 'Hilight Tribe', title: 'Free Tibet (Vini Vici Remix)', channel: 'Vini Vici',
      style: { vi: 'Psytrance gặp nhạc dân tộc', en: 'Psytrance meets world music' },
      note: {
        vi: 'Vini Vici remix "Free Tibet" của ban nhạc Hilight Tribe, và đến năm 2019 bản remix đã vượt 94 triệu lượt nghe trên YouTube (Wikipedia). Năm 2016 hai bên còn làm "Great Spirit" cùng Armin van Buuren, bài đã có trong cẩm nang. Nghe tiếng trống, didgeridoo và giọng hát của ban nhạc sống đặt lên nhịp psy: lý do bài này vang ở cả sân khấu EDM lớn.',
        en: 'Vini Vici remixed the band Hilight Tribe\'s "Free Tibet", and by 2019 the remix had passed 94 million plays on YouTube (Wikipedia). In 2016 they made "Great Spirit" together with Armin van Buuren, which is in the guide. Listen to a live band\'s drums, didgeridoo and chant set on a psy beat: why it rings out on big EDM stages too.',
      },
    },
    {
      youtube: '3_YBIeU7VSU', artist: 'Vini Vici', title: 'The Tribe', year: 2015, channel: 'Psychedelic Universe',
      style: { vi: 'Psytrance Israel, sân khấu lớn', en: 'Israeli psytrance for big stages' },
      note: {
        vi: 'Vini Vici là Aviram Saharai và Matan Kadosh, lấy tên này từ năm 2013; thành công quốc tế đến năm 2015 với "The Tribe" (Wikipedia). Năm 2025 họ chơi sân khấu chính Tomorrowland, theo video trên kênh chính thức. Nghe tiếng hô và giai điệu đơn giản: psytrance được làm gọn lại cho sân khấu festival, nơi hàng chục nghìn người cùng nhảy.',
        en: 'Vini Vici are Aviram Saharai and Matan Kadosh, under that name since 2013; their international breakthrough came in 2015 with "The Tribe" (Wikipedia). In 2025 they played Tomorrowland\'s main stage, as their official channel shows. Listen to the chant and the simple melody: psytrance tightened for the festival stage, where tens of thousands dance together.',
      },
    },
    {
      youtube: '6Gno011k4WA', artist: 'Neelix', title: 'No Way To Leave', channel: 'SpinTwistRecords', label: 'Spin Twist Records',
      style: { vi: 'Progressive psytrance', en: 'Progressive psytrance' },
      note: {
        vi: 'Bài ra trên Spin Twist Records, label phát hành các bài của Neelix, và được đăng là bản chính thức trên kênh của label. Progressive psy chậm hơn full-on (thường 132–138 BPM), sạch và giàu giai điệu. Nghe cách bài đi chín phút mà không cần cú thả lớn: đây là kiểu psy cho giờ chiều ở festival, trước khi đêm xuống.',
        en: 'It came out on Spin Twist Records, the label that releases Neelix\'s music, and is posted as the official version on the label\'s channel. Progressive psy is slower than full-on (often 132–138 BPM), clean and melodic. Listen to how it runs nine minutes without needing a big drop: psy for the late afternoon at a festival, before night falls.',
      },
    },
    {
      youtube: 'Ausckv7bb4g', artist: 'Blastoyz x Sajanka ft. Liora Itzhak', title: 'Indian Spirit', channel: 'Blastoyz',
      style: { vi: 'Psytrance có vocal', en: 'Vocal psytrance' },
      note: {
        vi: 'Video chính thức trên kênh của Blastoyz, mang tên Indian Spirit, lễ hội ở Đức nơi Blastoyz chơi các năm 2024 và 2025 (cả hai set đều có trên kênh của anh). Giọng hát của Liora Itzhak, mang màu nhạc Ấn, đặt trên nhịp psy hiện đại. Nghe để thấy psytrance những năm 2020 kéo cả vocal và giai điệu dân gian lên sân khấu chính.',
        en: 'The official video on Blastoyz\'s channel, named after Indian Spirit, the German festival where Blastoyz played in 2024 and 2025 (both sets are on his channel). Liora Itzhak\'s Indian-tinged vocal rides a modern psy beat. Listen to hear 2020s psytrance bring vocals and folk melodies to the main stage.',
      },
    },
  ],
  method: {
    vi: 'Chúng tôi chọn 11 bài theo bốn tiêu chí: mỗi chặng của psytrance có ít nhất một bài, từ Goa trance thập niên 1990 đến các sân khấu năm 2026; bài được nguồn uy tín nhắc tên (Wikipedia, trang của label) hoặc là bài tiêu biểu của nghệ sĩ; không lặp năm bài đã có trong cẩm nang Psytrance; và bài phát từ kênh chính thức của nghệ sĩ, label hoặc kênh được YouTube xác minh, đã kiểm tra qua oEmbed. Năm và label chỉ ghi khi nguồn nói rõ.',
    en: 'We chose 11 tracks on four rules: every stage of psytrance has at least one, from 1990s Goa trance to the stages of 2026; each is named by a reputable source (Wikipedia, a label\'s page) or is a signature track of its artist; none repeats the five tracks already in our Psytrance guide; and each plays from the artist\'s or label\'s official channel or a YouTube-verified one, checked through oEmbed. Years and labels appear only where a source states them.',
  },
  notes: {
    vi: 'Năm 2026 psytrance sống ở những festival riêng hơn là trong club: kênh chính thức của Vini Vici đăng set ở Indian Spirit Festival 2026, Liquid Soul chơi ở Adhana Festival (Brazil), và Ace Ventura cùng Zen Mechanics chơi dưới tên Zentura ở Ozora 2025, lễ hội Hungary trên ảnh bìa bài này. Ở Việt Nam, psytrance chủ yếu xuất hiện ở các đêm của cộng đồng nhỏ; hãy lọc theo dòng nhạc trên FeestFinder để xem đêm sắp tới.',
    en: 'In 2026 psytrance lives at its own festivals more than in clubs: Vini Vici\'s official channel posted their Indian Spirit Festival 2026 set, Liquid Soul played Adhana Festival in Brazil, and Ace Ventura and Zen Mechanics played as Zentura at Ozora 2025, the Hungarian festival on this post\'s cover. In Vietnam psytrance shows up mostly at small community nights; filter by style on FeestFinder to see what is coming.',
  },
  related: [
    { slug: 'psytrance', line: { vi: 'Psytrance là gì? · Goa, full-on, progressive và năm bài kinh điển', en: 'What is psytrance? · Goa, full-on, progressive and five classics' } },
    { slug: 'playlist-trance', line: { vi: 'Playlist trance · từ Age of Love đến ASOT 2026', en: 'Trance playlist · from Age of Love to ASOT 2026' } },
    { slug: 'playlist-techno', line: { vi: 'Playlist techno · 11 bài từ 1990 đến nay', en: 'Techno playlist · 11 tracks from 1990 to now' } },
    { slug: 'playlist-edm', line: { vi: 'Playlist EDM · mọi playlist theo dòng nhạc', en: 'EDM playlists · every playlist by style' } },
  ],
  facts: [
    { label: { vi: 'Dòng nhạc', en: 'Style' }, value: { vi: 'Psytrance: Goa, psychill, full-on, progressive', en: 'Psytrance: Goa, psychill, full-on, progressive' } },
    { label: { vi: 'Số bài', en: 'Tracks' }, value: { vi: '11', en: '11' } },
    { label: { vi: 'Giai đoạn', en: 'Span' }, value: { vi: 'Từ 1994 đến nay', en: '1994 to now' } },
    { label: { vi: 'BPM thường gặp', en: 'Typical BPM' }, value: { vi: '138–148 (progressive 132–138, dark 148–160+)', en: '138–148 (progressive 132–138, dark 148–160+)' } },
    { label: { vi: 'Hợp với', en: 'Best for' }, value: { vi: 'Festival ngoài trời; những ai thích giai điệu và bassline cuộn', en: 'Open-air festivals; anyone who loves melody and a rolling bassline' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Goa trance và psytrance khác nhau thế nào?', en: 'How are Goa trance and psytrance different?' }, a: { vi: 'Goa trance là giai đoạn đầu, giữa thập niên 1990, giàu giai điệu kiểu phương Đông như "LSD" hay "Teleport"; psytrance là tên chung cho mọi nhánh lớn lên từ đó: full-on, progressive, dark.', en: 'Goa trance is the early, mid-1990s stage, rich in Eastern-sounding melodies like "LSD" or "Teleport"; psytrance is the umbrella for everything that grew from it: full-on, progressive, dark.' } },
    { q: { vi: 'Psytrance có tốc độ bao nhiêu BPM?', en: 'What BPM is psytrance?' }, a: { vi: 'Thường 138–148 BPM; progressive 132–138, dark psy từ 148 trở lên.', en: 'Usually 138–148 BPM; progressive 132–138, dark psy from 148 up.' } },
    { q: { vi: 'Nên nghe bài nào trước?', en: 'Which track should I hear first?' }, a: { vi: 'Bản remix "Free Tibet" của Vini Vici: dễ nghe với người quen EDM, và đã vượt 94 triệu lượt xem trên YouTube vào năm 2019.', en: 'Vini Vici\'s "Free Tibet" remix: easy for EDM listeners, and past 94 million YouTube plays by 2019.' } },
    { q: { vi: 'Nghe những bài này ở đâu?', en: 'Where can I stream these tracks?' }, a: { vi: 'Mỗi bài có trình phát YouTube từ kênh chính thức hoặc kênh đã xác minh, chỉ tải khi bạn bấm phát; các bài cũng có trên những dịch vụ nghe nhạc lớn.', en: 'Each track has a YouTube player from an official or verified channel, loading only when you press play; they are also on the major streaming services.' } },
    { q: { vi: 'Danh sách này cập nhật bao lâu một lần?', en: 'How often is this list updated?' }, a: { vi: 'Khi có bài mới đủ tiêu chí; lần kiểm tra gần nhất là tháng 10/2026.', en: 'When a new track meets the rules; it was last checked in October 2026.' } },
  ],
  sources: [
    { title: 'Psychedelic trance', url: wiki('Psychedelic trance'), publisher: 'Wikipedia' },
    { title: 'Hallucinogen (musician)', url: wiki('Hallucinogen (musician)'), publisher: 'Wikipedia' },
    { title: 'Martin Freeland', url: wiki('Martin Freeland'), publisher: 'Wikipedia' },
    { title: 'Vini Vici', url: wiki('Vini Vici'), publisher: 'Wikipedia' },
    { title: 'Juno Reactor', url: wiki('Juno Reactor'), publisher: 'Wikipedia' },
    { title: 'Twisted Records', url: 'https://www.twistedmusic.com/', publisher: 'Twisted Records' },
    { title: 'Iboga Records', url: 'https://www.ibogarecords.com/', publisher: 'Iboga Records' },
  ],
};

export const playlistPsytrance = playlistPost(psytrance);
