import { playlistPost, wiki, type Playlist } from './shared.ts';
import { PLAYLIST_MEDIA_C } from './media-c.ts';

/** Drum & bass from 1997 to 2026, past the five tracks of the drum & bass guide (research 2026-10-23: Wikipedia, DJ Mag, Mixmag, the BRITs, the artists' channels). */
const drumAndBass: Playlist = {
  key: 'playlists/playlist-drum-and-bass',
  slug: 'playlist-drum-and-bass',
  kind: 'style',
  title: {
    vi: 'Playlist drum & bass: 11 bài từ liquid đến neurofunk',
    en: 'Drum & bass playlist: 11 tracks from liquid to neurofunk',
  },
  excerpt: {
    vi: 'Playlist drum & bass 11 bài, từ Brown Paper Bag (1997) và Shake Ur Body đến Baddadan, Nia Archives và Hedex ở Reading 2026: jungle, liquid, neurofunk, jump-up.',
    en: 'An 11-track drum & bass playlist from Brown Paper Bag (1997) and Shake Ur Body to Baddadan, Nia Archives and Hedex at Reading 2026: jungle, liquid, neuro, jump-up.',
  },
  cover: PLAYLIST_MEDIA_C.drumAndBass,
  styles: ['drum-and-bass'],
  style: 'drum-and-bass',
  lead: {
    vi: '**Playlist drum & bass** này đi tiếp từ cẩm nang Drum & bass: 11 bài từ "Brown Paper Bag" của Roni Size & Reprazent năm 1997 đến set của Hedex ở Reading 2026, qua liquid của Calibre và High Contrast, neurofunk của Noisia và cú bùng nổ của "Baddadan". Mỗi bài có trình phát và lý do nên nghe.',
    en: '**This drum & bass playlist** picks up where our Drum & bass guide leaves off: 11 tracks from Roni Size & Reprazent\'s "Brown Paper Bag" in 1997 to Hedex\'s Reading 2026 set, by way of Calibre and High Contrast\'s liquid, Noisia\'s neurofunk and the breakout of "Baddadan". Each has a player and a reason to listen.',
  },
  tracks: [
    {
      youtube: 'cwI0gbGEyuI', artist: 'Roni Size & Reprazent', title: 'Brown Paper Bag', year: 1997, channel: 'RoniSizeReprazenVEVO',
      style: { vi: 'Drum & bass Bristol, có nhạc cụ sống', en: 'Bristol drum & bass with live instruments' },
      note: {
        vi: 'Single trong album đầu tay New Forms của Roni Size & Reprazent, phát hành ngày 23/6/1997; album thắng giải Mercury năm đó (Wikipedia). Giọng hát là của Onallee. Hãy nghe tiếng double bass gảy và trống breakbeat chạy nhanh bên dưới: bài cho thấy drum & bass có thể vừa tinh tế như jazz vừa đủ nhanh cho sàn nhảy.',
        en: 'A single from Roni Size & Reprazent\'s debut album New Forms, released on 23 June 1997; the album won that year\'s Mercury Prize (Wikipedia). The vocal is Onallee\'s. Listen to the plucked double bass over the fast breakbeat underneath: proof that drum & bass could be as subtle as jazz and still fast enough for the floor.',
      },
    },
    {
      youtube: 'pHfTFmjSa-M', artist: 'Shy FX & T-Power', title: 'Shake Ur Body', channel: 'London Records', label: 'Positiva',
      style: { vi: 'Drum & bass có giọng hát, lên bảng xếp hạng', en: 'Vocal drum & bass for the charts' },
      note: {
        vi: 'Bài đột phá của Shy FX và T-Power với giọng ca Di, phát hành trên Positiva (một nhánh của EMI) và lên hạng 7 bảng xếp hạng đĩa đơn Anh (Wikipedia). Đây là lúc drum & bass bước từ club ra radio. Nghe cách giọng hát mềm nằm trên bassline nảy và nhịp trống gọn: một công thức nhiều bài liquid sau này còn dùng.',
        en: 'Shy FX and T-Power\'s breakthrough with the singer Di, released on Positiva (an EMI imprint) and a No. 7 hit on the UK Singles Chart (Wikipedia). This is drum & bass stepping out of the club and onto the radio. Listen to the soft vocal riding a bouncing bassline and tidy drums: a formula plenty of liquid tracks still use.',
      },
    },
    {
      youtube: 'Pz1W1OLkw14', artist: 'High Contrast', title: 'If We Ever', year: 2007, channel: 'High Contrast',
      style: { vi: 'Liquid funk', en: 'Liquid funk' },
      note: {
        vi: 'Single thứ hai trong album Tough Guys Don\'t Dance (10/2007) của nhà sản xuất xứ Wales High Contrast. Được Annie Mac, Zane Lowe và Jo Whiley phát trên BBC Radio 1, bài lên số 1 bảng drum & bass và bảng dance của Anh (Wikipedia). Nghe phần piano và dây trong trẻo trên nhịp 170 BPM: liquid là drum & bass để vừa nhảy vừa hát theo.',
        en: 'The second single from Welsh producer High Contrast\'s album Tough Guys Don\'t Dance (October 2007). Played on BBC Radio 1 by Annie Mac, Zane Lowe and Jo Whiley, it reached No. 1 on the UK drum & bass and dance charts (Wikipedia). Listen to the bright piano and strings over a 170 BPM roll: liquid is drum & bass to dance and sing along to.',
      },
    },
    {
      youtube: 'SAO-lzl3vVQ', artist: 'Noisia', title: 'Machine Gun', year: 2010, channel: 'Noisia',
      style: { vi: 'Neurofunk', en: 'Neurofunk' },
      note: {
        vi: 'Bộ ba Hà Lan Noisia phát hành "Machine Gun" ngày 8/3/2010, mở đường cho album đầu tay Split the Atom (5/4/2010; Wikipedia). Đây là mặt tối của drum & bass: bass được bẻ cong, cắt nhỏ và lọc như máy móc đang nói. Hãy nghe độ sạch của từng âm trầm và khoảng lặng trước drop, thứ khiến Noisia thành chuẩn mực về sound design.',
        en: 'Dutch trio Noisia released "Machine Gun" on 8 March 2010, ahead of their debut album Split the Atom (5 April 2010; Wikipedia). This is drum & bass\'s dark side: bass bent, chopped and filtered until it sounds like a machine talking. Listen to how clean every low note is and to the silence before the drop, the things that made Noisia a byword for sound design.',
      },
    },
    {
      youtube: 'AQ2ZPNo9Oio', artist: 'Calibre', title: 'Even If', channel: 'UKF Drum & Bass', label: 'Signature Records',
      style: { vi: 'Liquid funk, tối giản', en: 'Minimal liquid funk' },
      note: {
        vi: 'Calibre, nhà sản xuất người Belfast, có ảnh hưởng lớn tới liquid funk, dòng nhạc được đặt tên một phần theo cách làm nhạc của anh; anh phát hành chủ yếu trên label riêng Signature Records (Wikipedia). "Even If" là liquid ở dạng tiết chế nhất. Nghe bassline ấm, ít nốt và trống mỏng nhẹ: không có drop, chỉ có độ trôi.',
        en: 'Belfast producer Calibre is a major influence on liquid funk, a style partly named after the way he makes music, and he releases mostly on his own Signature Records (Wikipedia). "Even If" is liquid at its most restrained. Listen to the warm bassline with few notes and the light drums: no drop, only the roll.',
      },
    },
    {
      youtube: 'G0zRsIpMKHA', artist: 'Camo & Krooked', title: 'Loving You Is Easy', year: 2013, channel: 'Hospital Records', label: 'Hospital Records',
      style: { vi: 'Drum & bass có giọng hát, lạc quan', en: 'Upbeat vocal drum & bass' },
      note: {
        vi: 'Single thứ ba trong album Zeitgeist của bộ đôi người Vienna Camo & Krooked, phát hành ngày 11/11/2013 (Wikipedia). Bài sáng và vui hơn hẳn neurofunk: hợp âm guitar, giọng hát và một drop vừa đủ nặng. Nghe cách bài giữ năng lượng sàn nhảy mà vẫn có giai điệu dễ nhớ, lý do nó thường mở màn những set lớn.',
        en: 'The third single from Vienna duo Camo & Krooked\'s album Zeitgeist, released on 11 November 2013 (Wikipedia). It is far brighter than neurofunk: guitar chords, a vocal and a drop just heavy enough. Listen to how it keeps the floor\'s energy while carrying a melody you remember, which is why it so often opens big sets.',
      },
    },
    {
      youtube: 'EqaPQeRkLKw', artist: 'Andy C & Fiora', title: 'Heartbeat Loud (Andy C VIP)', channel: 'RAM Records', label: 'RAM Records',
      style: { vi: 'Drum & bass sàn nhảy', en: 'Dancefloor drum & bass' },
      note: {
        vi: 'Andy C là đồng sáng lập RAM Records và là một trong những DJ drum & bass được biết đến nhất; đây là bản VIP anh tự làm lại cho bài hát cùng ca sĩ Fiora. Bản VIP là phiên bản DJ dành cho club. Nghe đoạn giọng hát mở đầu rồi bass được kéo mạnh hơn bản gốc: đúng kiểu bài để cả sân khấu cùng hát trước khi drop.',
        en: 'Andy C co-founded RAM Records and is one of drum & bass\'s best-known DJs; this is his own VIP rework of his song with the singer Fiora. A VIP is the DJ\'s club version. Listen to the vocal opening, then the bass pushed harder than in the original: a track for a whole field to sing before the drop.',
      },
    },
    {
      youtube: 'riauJmRJnG0', artist: 'Dimension', title: 'Offender', channel: 'Dimension',
      style: { vi: 'Drum & bass sân khấu lớn', en: 'Big-stage drum & bass' },
      note: {
        vi: 'Dimension là nhà sản xuất người London; album đầu tay Organ của anh ra mắt tháng 3/2021 ở vị trí số 1 bảng Official Dance Chart của Anh (Wikipedia). "Offender" cho thấy âm thanh khiến anh lấp đầy các sân khấu lễ hội: bass rộng như tường, nhịp trống thẳng và căng. Nghe cách bài dồn lên mà không cần giọng hát.',
        en: 'Dimension is a London producer whose debut album, Organ, entered the UK Official Dance Chart at No. 1 in March 2021 (Wikipedia). "Offender" shows the sound that fills festival stages for him: bass as wide as a wall and straight, tense drums. Listen to how it builds with no vocal at all.',
      },
    },
    {
      youtube: 'rkjNL4dX-U4', artist: 'Chase & Status, Bou feat. IRAH, Flowdan, Trigga, Takura', title: 'Baddadan', year: 2023, channel: 'ChaseAndStatusVEVO',
      style: { vi: 'Jungle và jump-up với MC', en: 'Jungle and jump-up with MCs' },
      note: {
        vi: 'Single mở đường cho album 2 Ruff, Vol. 1 của Chase & Status, lọt top 5 bảng đĩa đơn Anh (Wikipedia), và năm 2024 bộ đôi thắng giải BRIT Nhà sản xuất của năm (Mixmag). Bốn MC thay nhau trên một bản jungle thô. Nghe cách mỗi MC có giọng và nhịp riêng, rồi bass gầm lên ở drop: drum & bass lại thành nhạc đại chúng ở Anh.',
        en: 'The lead single from Chase & Status\'s 2 Ruff, Vol. 1, a UK Singles Chart top-five hit (Wikipedia); in 2024 the duo won the BRIT Award for Producer of the Year (Mixmag). Four MCs trade bars over a raw jungle track. Listen to each MC\'s own voice and flow, then the bass roaring at the drop: drum & bass as British pop music again.',
      },
    },
    {
      youtube: 'dMwzooIPbHw', artist: 'Nia Archives', title: 'Crowded Roomz', year: 2024, channel: 'NiaArchivesVEVO', label: 'HIJINXX / Island',
      style: { vi: 'Jungle pha indie rock', en: 'Jungle with indie rock' },
      note: {
        vi: 'Nia Archives phát hành "Crowded Roomz" tháng 1/2024, viết và sản xuất cùng Ethan P. Flynn, về cảm giác cô đơn giữa đám đông khi đi tour (Wikipedia). Album Silence Is Loud được đề cử giải Mercury 2024, khiến cô thành nghệ sĩ jungle đầu tiên được đề cử sau hơn 25 năm (DJ Mag). Nghe breakbeat jungle cổ điển dưới giọng hát và guitar.',
        en: 'Nia Archives released "Crowded Roomz" in January 2024, co-written and co-produced with Ethan P. Flynn, about feeling alone in a crowd while touring (Wikipedia). Her album Silence Is Loud was shortlisted for the 2024 Mercury Prize, making her the first jungle artist nominated in over 25 years (DJ Mag). Listen to the classic jungle breaks under the vocal and guitar.',
      },
    },
    {
      youtube: 'Nmo436OgZ2Q', artist: 'Hedex ft. MC Eksman', title: 'Live from Reading Festival 2026 (DJ set)', year: 2026, channel: 'Hedex',
      style: { vi: 'Jump-up, set lễ hội', en: 'Jump-up, a festival set' },
      note: {
        vi: 'Đây là set gần một giờ, không phải single: Hedex chơi ở Reading Festival 2026 với MC Eksman, do kênh chính thức của Hedex đăng. Hedex nổi lên với "Liquor & Cigarettes" cùng Chase & Status và ArrDee. Nghe nhịp độ của một set jump-up: bài thay nhau rất nhanh, MC giữ đám đông, và drop nối drop gần như không nghỉ.',
        en: 'This is a set of nearly an hour, not a single: Hedex playing Reading Festival 2026 with MC Eksman, posted by Hedex\'s official channel. Hedex broke through with "Liquor & Cigarettes" alongside Chase & Status and ArrDee. Listen to the pace of a jump-up set: tracks change fast, the MC holds the crowd, and drop follows drop almost without a break.',
      },
    },
  ],
  method: {
    vi: 'Chúng tôi chọn 11 bài theo bốn tiêu chí: mỗi nhánh lớn của drum & bass (jungle, liquid, neurofunk, jump-up, drum & bass có giọng hát) có ít nhất một bài, từ năm 1997 đến 2026; mỗi bài được một nguồn uy tín nhắc tới (Wikipedia, DJ Mag, Mixmag, BRIT Awards) hoặc có thành tích trên bảng xếp hạng; không bài nào lặp lại năm bài trong cẩm nang Drum & bass; và mọi trình phát đều từ kênh chính thức của nghệ sĩ hoặc label, đã kiểm tra qua oEmbed của YouTube. Năm phát hành chỉ ghi khi có nguồn.',
    en: 'We chose 11 tracks on four rules: every big branch of drum & bass (jungle, liquid, neurofunk, jump-up, vocal drum & bass) has at least one, from 1997 to 2026; each is named by a reputable source (Wikipedia, DJ Mag, Mixmag, the BRIT Awards) or has a chart record; none repeats the five tracks in our Drum & bass guide; and every player comes from the artist\'s or label\'s official channel, checked through YouTube\'s oEmbed. A release year is given only when a source gives it.',
  },
  notes: {
    vi: 'Drum & bass những năm 2020 sống lại ở Anh: "Baddadan" lọt top 5, Chase & Status thắng giải BRIT năm 2024, và Nia Archives được đề cử giải Mercury, lần đầu cho jungle kể từ khi New Forms thắng năm 1997. Ở lễ hội, jump-up với MC như set của Hedex ở Reading 2026 là thứ kéo đám đông lớn nhất. Nếu mới nghe, hãy bắt đầu bằng High Contrast và Camo & Krooked rồi mới tới Noisia.',
    en: 'Drum & bass came back in the UK in the 2020s: "Baddadan" went top five, Chase & Status won a BRIT Award in 2024, and Nia Archives was shortlisted for the Mercury Prize, the first time for jungle since New Forms won in 1997. At festivals, jump-up with an MC, like Hedex\'s Reading 2026 set, draws the biggest crowds. New to it? Start with High Contrast and Camo & Krooked before Noisia.',
  },
  related: [
    { slug: 'drum-and-bass', line: { vi: 'Drum & bass là gì? · BPM, jungle và các nhánh', en: 'What is drum & bass? · BPM, jungle and sub-genres' } },
    { slug: 'playlist-dubstep', line: { vi: 'Playlist dubstep · từ Croydon đến riddim', en: 'Dubstep playlist · from Croydon to riddim' } },
    { slug: 'playlist-peak-time', line: { vi: 'Playlist peak time · những bài cho giờ cao điểm', en: 'Peak-time playlist · tracks for the peak hour' } },
    { slug: 'playlist-edm', line: { vi: 'Playlist EDM · mọi playlist theo dòng nhạc', en: 'EDM playlists · every playlist by style' } },
  ],
  facts: [
    { label: { vi: 'Dòng nhạc', en: 'Style' }, value: { vi: 'Drum & bass: jungle, liquid, neurofunk, jump-up', en: 'Drum & bass: jungle, liquid, neurofunk, jump-up' } },
    { label: { vi: 'Số bài', en: 'Tracks' }, value: { vi: '11', en: '11' } },
    { label: { vi: 'Giai đoạn', en: 'Span' }, value: { vi: '1997–2026', en: '1997–2026' } },
    { label: { vi: 'BPM thường gặp', en: 'Typical BPM' }, value: { vi: '160–180 (thường 172–175)', en: '160–180 (usually 172–175)' } },
    { label: { vi: 'Hợp với', en: 'Best for' }, value: { vi: 'Hiểu các nhánh drum & bass; chuẩn bị cho một đêm DnB', en: 'Learning the branches of drum & bass; getting ready for a DnB night' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Nên bắt đầu nghe drum & bass từ bài nào?', en: 'Which drum & bass track should I start with?' }, a: { vi: '"If We Ever" của High Contrast (2007) là liquid dễ nghe; "Baddadan" của Chase & Status (2023) cho thấy drum & bass hôm nay mạnh mẽ ra sao.', en: 'High Contrast\'s "If We Ever" (2007) is easy-going liquid; Chase & Status\'s "Baddadan" (2023) shows how hard drum & bass hits today.' } },
    { q: { vi: 'Drum & bass có tốc độ bao nhiêu BPM?', en: 'What BPM is drum & bass?' }, a: { vi: 'Khoảng 160–180 BPM, thường 172–175.', en: 'About 160–180 BPM, usually 172–175.' } },
    { q: { vi: 'Liquid và neurofunk khác nhau thế nào?', en: 'How is liquid different from neurofunk?' }, a: { vi: 'Liquid giàu giai điệu và mềm, như Calibre hay High Contrast; neurofunk tối và kỹ thuật, bass được bẻ cong như "Machine Gun" của Noisia.', en: 'Liquid is melodic and soft, like Calibre or High Contrast; neurofunk is dark and technical, its bass bent like Noisia\'s "Machine Gun".' } },
    { q: { vi: 'Nghe những bài này ở đâu?', en: 'Where can I stream these tracks?' }, a: { vi: 'Mỗi bài có trình phát YouTube từ kênh chính thức của nghệ sĩ hoặc label, chỉ tải khi bạn bấm phát; các bài cũng có trên các dịch vụ nghe nhạc.', en: 'Each has a YouTube player from the artist\'s or label\'s official channel, loading only when you press play; the tracks are on the streaming services too.' } },
    { q: { vi: 'Danh sách này cập nhật bao lâu một lần?', en: 'How often is this list updated?' }, a: { vi: 'Khi có bài mới đủ tiêu chí; lần kiểm tra gần nhất là tháng 10/2026.', en: 'When a new track meets the rules; it was last checked in October 2026.' } },
  ],
  sources: [
    { title: 'Chase & Status win Producer Of The Year at the BRIT Awards 2024', url: 'https://mixmag.net/read/chase-status-win-producer-of-the-year-at-the-brit-awards-2024-news', publisher: 'Mixmag' },
    { title: 'Nia Archives, Charli XCX, Barry Can\'t Swim nominated for 2024 Mercury Prize', url: 'https://djmag.com/news/nia-archives-charli-xcx-barry-cant-swim-nominated-2024-mercury-prize', publisher: 'DJ Mag' },
    { title: 'Roni Size', url: wiki('Roni Size'), publisher: 'Wikipedia' },
    { title: 'Shy FX', url: wiki('Shy FX'), publisher: 'Wikipedia' },
    { title: 'High Contrast', url: wiki('High Contrast'), publisher: 'Wikipedia' },
    { title: 'Noisia', url: wiki('Noisia'), publisher: 'Wikipedia' },
    { title: 'Nia Archives', url: wiki('Nia Archives'), publisher: 'Wikipedia' },
    { title: 'Chase & Status', url: wiki('Chase & Status'), publisher: 'Wikipedia' },
  ],
};

export const playlistDrumAndBass = playlistPost(drumAndBass);
