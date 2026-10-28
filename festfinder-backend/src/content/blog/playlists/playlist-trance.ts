import { playlistPost, wiki, type Playlist } from './shared.ts';
import { PLAYLIST_MEDIA_B } from './media-b.ts';

/** Trance from Age of Love (1990/1992) to the ASOT 2026 anthem, past the five tracks of the trance guide (research 2026-10-23: Wikipedia, Armada, A State of Trance, the labels' channels). */
const trance: Playlist = {
  key: 'playlists/playlist-trance',
  slug: 'playlist-trance',
  kind: 'style',
  title: {
    vi: 'Playlist trance: 12 bài từ Age of Love đến ASOT 2026',
    en: 'Trance playlist: 12 tracks from Age of Love to ASOT 2026',
  },
  excerpt: {
    vi: 'Playlist trance 12 bài, từ "The Age of Love" và "Children" thập niên 1990 qua "Sandstorm", "Saltwater" đến anthem A State of Trance 2026, kèm năm, label và lý do nghe.',
    en: 'A 12-track trance playlist from 1990s "The Age of Love" and "Children" through "Sandstorm" and "Saltwater" to the 2026 A State of Trance anthem: years, labels, why.',
  },
  cover: PLAYLIST_MEDIA_B.trance,
  styles: ['trance'],
  style: 'trance',
  lead: {
    vi: '**Playlist trance** này đi tiếp từ cẩm nang Trance: 12 bài từ bản remix "Watch Out for Stella" năm 1992 đến "Always You", anthem của A State of Trance 2026. Phần lớn là những bài đã lên bảng xếp hạng cuối thập niên 1990, thời trance phủ khắp châu Âu, rồi đến các anthem của ASOT, chương trình radio trance đã sang năm thứ 25.',
    en: '**This trance playlist** picks up where our Trance guide leaves off: 12 tracks from the 1992 "Watch Out for Stella" remix to "Always You", the anthem of A State of Trance 2026. Most are the chart records of the late 1990s, when trance ran across Europe, followed by the anthems of ASOT, the trance radio show now in its 25th year.',
  },
  tracks: [
    {
      youtube: 'I4Et0DJ2L8k', artist: 'Age of Love', title: 'The Age of Love (Jam & Spoon Watch Out For Stella Mix)', year: 1992, channel: 'Trance Classics', label: 'React',
      style: { vi: 'Trance thời đầu', en: 'Early trance' },
      note: {
        vi: '"The Age of Love" ra ở Bỉ tháng 3/1990 và chỉ bán khoảng 720 bản. Năm 1992, label Anh React phát hành bản remix "Watch Out for Stella" của bộ đôi Đức Jam & Spoon, và doanh số bùng nổ (Wikipedia). Đây là bản được biết đến nhiều nhất. Nghe đoạn giữa: dây đàn và giọng hát mở ra trên nhịp kick kéo dài, khuôn mẫu cho breakdown của trance sau này.',
        en: '"The Age of Love" came out in Belgium in March 1990 and sold about 720 copies. In 1992 the British label React released German duo Jam & Spoon\'s "Watch Out for Stella" remix, and sales took off (Wikipedia). It is the best-known version. Listen to the middle: strings and voice open up over a long-running kick, the template for every trance breakdown that followed.',
      },
    },
    {
      youtube: 'yyvp_nCM15Q', artist: 'Energy 52', title: 'Café Del Mar (Three \'n One Radio Remix)', year: 1993, channel: 'Energy 52', label: 'Eye Q Records',
      style: { vi: 'Trance Balearic', en: 'Balearic trance' },
      note: {
        vi: '"Café del Mar" ra lần đầu năm 1993 trên Eye Q Records (EYE Q 001). Bài hai lần vào bảng đĩa đơn Anh, cả hai lần với remix của Three \'N One: hạng 24 tháng 3/1997, và bản "Café del Mar \'98" hạng 12 tháng 7/1998 (Wikipedia). Nghe giai điệu synth lặp chậm rãi: trance ở đây là cảm giác hoàng hôn hơn là cú thả.',
        en: '"Café del Mar" first came out in 1993 on Eye Q Records (EYE Q 001). It charted twice in the UK, both times with Three \'N One remixes: No. 24 in March 1997, and "Café del Mar \'98" No. 12 in July 1998 (Wikipedia). Listen to the slowly repeating synth melody: here trance is a sunset feeling more than a drop.',
      },
    },
    {
      youtube: 'DvyCbevQbtI', artist: 'Robert Miles', title: 'Children', year: 1995, channel: 'RobertMilesVEVO', label: 'DBX',
      style: { vi: 'Dream trance', en: 'Dream trance' },
      note: {
        vi: '"Children" của nhà soạn nhạc Ý Robert Miles ra lần đầu tháng 1/1995 trong EP "Soundtracks" trên label DBX và không lên bảng nào; bài chỉ nổi lên sau khi được mang tới một club ở Miami (Wikipedia). Đây là một trong những bài mở đường cho dream trance. Nghe tiếng piano: một giai điệu đơn giản trên nhịp kick đều, dễ nhớ đến mức nhiều người biết bài mà không biết tên.',
        en: 'Italian composer Robert Miles first released "Children" in January 1995 on the "Soundtracks" EP on DBX, and it did not chart; it took off only after it was taken to a club in Miami (Wikipedia). It is one of the pioneering tracks of dream trance. Listen to the piano: one simple melody over a steady kick, so catchy that many know the tune without its name.',
      },
    },
    {
      youtube: 'ri6Efk1SPJc', artist: 'ATB', title: '9 PM (Till I Come)', year: 1998, channel: 'Kontor.TV', label: 'Kontor Records',
      style: { vi: 'Trance Đức', en: 'German trance' },
      note: {
        vi: 'Kontor Records phát hành "9 PM (Till I Come)" ngày 26/10/1998, đĩa đơn đầu tay của DJ Đức ATB; một bản remix đã đứng đầu bảng đĩa đơn Anh và Ireland (Wikipedia). Nghe tiếng guitar điện chơi giai điệu chính và câu hát ngắn: đây là âm thanh trance dễ nghe nhất cuối thập niên 1990, sinh ra cho radio cũng như cho club.',
        en: 'Kontor Records released "9 PM (Till I Come)" on 26 October 1998, the debut single of German DJ ATB; a remix topped the UK and Irish singles charts (Wikipedia). Listen to the electric guitar carrying the lead melody and the short vocal line: this is the most radio-friendly trance of the late 1990s, made for radio as much as for clubs.',
      },
    },
    {
      youtube: 'ncb_0vRcQcY', artist: 'Binary Finary', title: '1998', year: 1998, channel: 'Armada Music TV',
      style: { vi: 'Uplifting trance', en: 'Uplifting trance' },
      note: {
        vi: 'Binary Finary là nhóm trance Anh; "1998" là bài nổi tiếng nhất của họ, lên hạng 24 bảng đĩa đơn Anh năm 1998, và Gouryella còn remix nó thành "1999" (Wikipedia). Bài là uplifting trance đúng nghĩa: breakdown dài, rồi giai điệu chính quay lại với toàn bộ năng lượng. Nghe để biết vì sao trance cuối thập niên 1990 được gọi là "euphoric".',
        en: 'Binary Finary are a British trance act; "1998" is their best-known track, reaching No. 24 in the UK in 1998, and Gouryella even remixed it as "1999" (Wikipedia). It is uplifting trance in the full sense: a long breakdown, then the main melody returning at full power. Listen to hear why late-1990s trance was called "euphoric".',
      },
    },
    {
      youtube: 'TrRXCV7qhBU', artist: 'Gouryella', title: 'Gouryella', year: 1999, channel: 'Trance Classics',
      style: { vi: 'Trance Hà Lan', en: 'Dutch trance' },
      note: {
        vi: 'Gouryella là dự án năm 1998 của Ferry Corsten và Tiësto; tên lấy từ tiếng Warlpiri, nghĩa là "thiên đường". Đĩa đơn đầu tiên ra tháng 5/1999 và vào top 15 bảng đĩa đơn Anh (Wikipedia). Nghe giai điệu chính lớn dần qua từng lớp synth: đây là lúc trance Hà Lan bắt đầu dẫn đầu thế giới.',
        en: 'Gouryella was Ferry Corsten and Tiësto\'s 1998 project; the name comes from the Warlpiri language and means "heaven". The first single came out in May 1999 and reached the UK top 15 (Wikipedia). Listen to the lead melody grow layer by layer: this is when Dutch trance began to lead the world.',
      },
    },
    {
      youtube: 'ypDtUUtuNzQ', artist: 'Rank 1', title: 'Airwave', year: 1999, channel: 'Be Yourself Music',
      style: { vi: 'Dutch anthem trance', en: 'Dutch anthem trance' },
      note: {
        vi: 'Rank 1 là nhóm Hà Lan do Piet Bervoets và Benno de Goeij lập năm 1999; "Airwave" là nhạc chủ đề Innercity 1999 và đến năm 2025 vẫn là một trong những bài được nghe nhiều nhất của họ trên Spotify (Wikipedia). Nghe tiếng synth "gọi" ở đầu bài: một motif ngắn, lặp lại và lớn dần, kiểu anthem mà Hà Lan đã xuất khẩu ra khắp thế giới.',
        en: 'Rank 1 is a Dutch group founded in 1999 by Piet Bervoets and Benno de Goeij; "Airwave" was the Innercity 1999 theme and as of 2025 is still among their most-streamed tracks on Spotify (Wikipedia). Listen to the calling synth at the start: a short motif that repeats and grows, the kind of anthem the Netherlands exported everywhere.',
      },
    },
    {
      youtube: 'tqY3UIRee-o', artist: 'Chicane feat. Moya Brennan', title: 'Saltwater', year: 1999, channel: 'Armada Music TV', label: 'Xtravaganza',
      style: { vi: 'Trance có vocal', en: 'Vocal trance' },
      note: {
        vi: '"Saltwater" của Chicane với giọng ca Ireland Moya Brennan ra ngày 24/5/1999 trên Xtravaganza, dùng lại một phần "Theme from Harry\'s Game" năm 1982 của Clannad, và lên hạng 6 bảng đĩa đơn Anh (Wikipedia). Nghe cách giọng hát Gaelic hoà vào nhịp trance: một bài cho lúc sàn chậm lại trước bình minh.',
        en: 'Chicane\'s "Saltwater", with Irish singer Moya Brennan, came out on 24 May 1999 on Xtravaganza, reworking part of Clannad\'s 1982 "Theme from Harry\'s Game", and reached No. 6 in the UK (Wikipedia). Listen to the Gaelic vocal melt into the trance beat: a track for when the floor slows down before dawn.',
      },
    },
    {
      youtube: 'y6120QOlsfU', artist: 'Darude', title: 'Sandstorm', year: 1999, channel: 'Darude', label: '16 Inch Records',
      style: { vi: 'Trance Phần Lan', en: 'Finnish trance' },
      note: {
        vi: '"Sandstorm" ra ở Phần Lan ngày 26/10/1999 trên 16 Inch Records, lên số 1 ở Na Uy, bán khoảng hai triệu bản, và tháng 3/2025 được Billboard xếp hạng 65 trong 100 bài dance hay nhất mọi thời đại (Wikipedia). Nghe cái riff synth lặp không ngừng: đây có lẽ là giai điệu trance được nhận ra nhanh nhất trên thế giới.',
        en: '"Sandstorm" came out in Finland on 26 October 1999 on 16 Inch Records, went to No. 1 in Norway, sold about two million copies, and in March 2025 Billboard ranked it No. 65 of the 100 best dance songs of all time (Wikipedia). Listen to the relentless synth riff: it may be the most instantly recognised trance melody in the world.',
      },
    },
    {
      youtube: 'ZShIBWhiTCQ', artist: 'Armin van Buuren feat. Trevor Guthrie', title: 'This Is What It Feels Like', year: 2013, channel: 'Armin van Buuren', label: 'Armind / Armada',
      style: { vi: 'Progressive trance', en: 'Progressive trance' },
      note: {
        vi: 'Armada phát hành bài ngày 5/4/2013, đĩa đơn thứ hai của album "Intense"; bài lên hạng 3 Dutch Top 40, vào top 10 ở mười nước và được đề cử Grammy năm 2014 cho Bản thu dance hay nhất (Wikipedia). Nghe cách trance mở cửa cho giọng hát pop mà vẫn giữ đoạn build và synth đặc trưng.',
        en: 'Armada released it on 5 April 2013 as the second single from the album "Intense"; it reached No. 3 on the Dutch Top 40, the top ten in ten countries, and a 2014 Grammy nomination for Best Dance Recording (Wikipedia). Listen to trance opening up to a pop vocal while keeping its build and its signature synths.',
      },
    },
    {
      youtube: 'mQsc1WK4QGA', artist: 'Armin van Buuren, Ferry Corsten, Rank 1 & Ruben de Ronde', title: 'Destination (ASOT 2024 Anthem)', year: 2024, channel: 'Armin van Buuren',
      style: { vi: 'Trance anthem', en: 'Trance anthem' },
      note: {
        vi: 'Năm 2024 A State of Trance chuyển festival chính về Rotterdam Ahoy với chủ đề "Destination", diễn ra ngày 23–24/2 (Wikipedia), và đây là anthem của sự kiện, do Armin van Buuren, Ferry Corsten, Rank 1 và Ruben de Ronde cùng làm. Nghe để thấy ba thế hệ trance Hà Lan, từ Rank 1 năm 1999 đến người đồng dẫn chương trình ASOT, trong cùng một bài.',
        en: 'In 2024 A State of Trance moved its flagship festival to Rotterdam Ahoy under the theme "Destination", on 23–24 February (Wikipedia), and this is that edition\'s anthem, made by Armin van Buuren, Ferry Corsten, Rank 1 and Ruben de Ronde. Listen to three generations of Dutch trance, from 1999\'s Rank 1 to ASOT\'s co-host, in one track.',
      },
    },
    {
      youtube: 'oGyHnVZ9Ay0', artist: 'Armin van Buuren & Richard Durand & Dicosis', title: 'Always You (ASOT 2026 Anthem)', year: 2026, channel: 'Armada Music TV',
      style: { vi: 'Trance anthem', en: 'Trance anthem' },
      note: {
        vi: 'Chương trình radio A State of Trance phát số đầu ngày 1/6/2001 và mừng 25 năm bằng hai ngày ở Rotterdam Ahoy, 27–28/2/2026 (Wikipedia). "Always You" là anthem của dịp này, theo tên video trên kênh Armada Music. Nghe để biết trance năm 2026 nghe thế nào: vẫn breakdown dài và giai điệu lớn, nhưng gọn hơn, hợp với cả sân khấu lẫn danh sách phát.',
        en: 'The A State of Trance radio show first aired on 1 June 2001 and marked 25 years with two days at Rotterdam Ahoy on 27–28 February 2026 (Wikipedia). "Always You" is that edition\'s anthem, as its video on Armada Music\'s channel says. Listen to hear trance in 2026: still a long breakdown and a big melody, but tighter, made for the stage and the playlist alike.',
      },
    },
  ],
  method: {
    vi: 'Chúng tôi chọn 12 bài theo bốn tiêu chí: mỗi giai đoạn của trance có ít nhất một bài, từ đầu thập niên 1990 đến 2026; bài có thành tích được ghi lại (bảng xếp hạng, đề cử, danh sách của Billboard) hoặc là anthem chính thức của một sự kiện; không lặp năm bài đã có trong cẩm nang Trance; và bài phát từ kênh chính thức của nghệ sĩ, label hoặc kênh được YouTube xác minh, đã kiểm tra qua oEmbed. Năm, label và thứ hạng chỉ ghi khi nguồn nói rõ.',
    en: 'We chose 12 tracks on four rules: every era of trance has at least one, from the early 1990s to 2026; each has a documented record (a chart position, a nomination, a Billboard list) or is an event\'s official anthem; none repeats the five tracks already in our Trance guide; and each plays from the artist\'s or label\'s official channel or a YouTube-verified one, checked through oEmbed. Years, labels and chart positions appear only where a source states them.',
  },
  notes: {
    vi: 'Danh sách nghiêng về cuối thập niên 1990 vì đó là lúc trance có nhiều bài lên bảng xếp hạng nhất: "9 PM (Till I Come)", "Saltwater", "Gouryella" và "Sandstorm" đều ra trong khoảng 1998–1999. Từ thập niên 2010, trance sống chủ yếu ở các sự kiện riêng như A State of Trance, nên hai bài cuối là anthem của ASOT. Nếu thích phần giai điệu và breakdown, hãy nghe tiếp psytrance; nếu thích phần năng lượng, hãy thử hardstyle, dòng nhạc lớn lên từ hard trance.',
    en: 'The list leans on the late 1990s because that is when trance had the most chart records: "9 PM (Till I Come)", "Saltwater", "Gouryella" and "Sandstorm" all came out in 1998–1999. From the 2010s trance has lived mostly at its own events such as A State of Trance, so the last two tracks are ASOT anthems. If you love the melodies and breakdowns, go on to psytrance; if you love the energy, try hardstyle, which grew out of hard trance.',
  },
  related: [
    { slug: 'trance', line: { vi: 'Trance là gì? · lịch sử, nhánh nhạc và năm bài kinh điển', en: 'What is trance? · history, subgenres and five classics' } },
    { slug: 'playlist-psytrance', line: { vi: 'Playlist psytrance · từ Goa đến các sân khấu 2026', en: 'Psytrance playlist · from Goa to the 2026 stages' } },
    { slug: 'playlist-hardstyle', line: { vi: 'Playlist hardstyle · lịch sử qua các anthem', en: 'Hardstyle playlist · the history in its anthems' } },
    { slug: 'playlist-edm', line: { vi: 'Playlist EDM · mọi playlist theo dòng nhạc', en: 'EDM playlists · every playlist by style' } },
  ],
  facts: [
    { label: { vi: 'Dòng nhạc', en: 'Style' }, value: { vi: 'Trance: dream, uplifting, vocal, progressive', en: 'Trance: dream, uplifting, vocal, progressive' } },
    { label: { vi: 'Số bài', en: 'Tracks' }, value: { vi: '12', en: '12' } },
    { label: { vi: 'Giai đoạn', en: 'Span' }, value: { vi: '1992–2026', en: '1992–2026' } },
    { label: { vi: 'BPM thường gặp', en: 'Typical BPM' }, value: { vi: '128–140 (uplifting 136–140)', en: '128–140 (uplifting 136–140)' } },
    { label: { vi: 'Hợp với', en: 'Best for' }, value: { vi: 'Những ai yêu giai điệu; lúc bình minh của một đêm dài', en: 'Lovers of melody; the sunrise end of a long night' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Bài trance nổi tiếng nhất là bài nào?', en: 'What is the most famous trance track?' }, a: { vi: '"Sandstorm" của Darude là ứng viên mạnh: số 1 ở Na Uy, khoảng hai triệu bản, và hạng 65 trong 100 bài dance hay nhất mọi thời đại của Billboard (2025).', en: 'Darude\'s "Sandstorm" is a strong candidate: No. 1 in Norway, about two million copies, and No. 65 in Billboard\'s 100 best dance songs of all time (2025).' } },
    { q: { vi: 'A State of Trance là gì?', en: 'What is A State of Trance?' }, a: { vi: 'Chương trình radio trance hằng tuần của Armin van Buuren, phát từ ngày 1/6/2001, kèm label và festival riêng; năm 2026 mừng 25 năm ở Rotterdam Ahoy.', en: 'Armin van Buuren\'s weekly trance radio show, on air since 1 June 2001, with its own label and festival; it marked 25 years at Rotterdam Ahoy in 2026.' } },
    { q: { vi: 'Trance có tốc độ bao nhiêu BPM?', en: 'What BPM is trance?' }, a: { vi: 'Thường 128–140 BPM; uplifting trance khoảng 136–140.', en: 'Usually 128–140 BPM; uplifting trance around 136–140.' } },
    { q: { vi: 'Nghe những bài này ở đâu?', en: 'Where can I stream these tracks?' }, a: { vi: 'Mỗi bài có trình phát YouTube từ kênh chính thức hoặc kênh đã xác minh, chỉ tải khi bạn bấm phát; các bài cũng có trên những dịch vụ nghe nhạc lớn.', en: 'Each track has a YouTube player from an official or verified channel, loading only when you press play; they are also on the major streaming services.' } },
    { q: { vi: 'Danh sách này cập nhật bao lâu một lần?', en: 'How often is this list updated?' }, a: { vi: 'Khi có anthem hoặc bài mới đủ tiêu chí; lần kiểm tra gần nhất là tháng 10/2026.', en: 'When a new anthem or track meets the rules; it was last checked in October 2026.' } },
  ],
  sources: [
    { title: 'The Age of Love (Age of Love song)', url: wiki('The Age of Love (Age of Love song)'), publisher: 'Wikipedia' },
    { title: 'Children (composition)', url: wiki('Children (composition)'), publisher: 'Wikipedia' },
    { title: 'Sandstorm (instrumental)', url: wiki('Sandstorm (instrumental)'), publisher: 'Wikipedia' },
    { title: 'This Is What It Feels Like', url: wiki('This Is What It Feels Like'), publisher: 'Wikipedia' },
    { title: 'A State of Trance', url: wiki('A State of Trance'), publisher: 'Wikipedia' },
    { title: 'A State Of Trance (label)', url: 'https://www.armadamusic.com/labels/a-state-of-trance', publisher: 'Armada Music' },
    { title: 'A State of Trance', url: 'https://www.astateoftrance.com/', publisher: 'A State of Trance' },
  ],
};

export const playlistTrance = playlistPost(trance);
