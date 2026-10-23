import { playlistPost, wiki, type Playlist } from './shared.ts';
import { PLAYLIST_MEDIA_C } from './media-c.ts';

/** House from Chicago in 1986 to 2026: tech, afro and melodic (research 2026-10-23: Wikipedia, News24, EDMTunes, the labels' and artists' channels). */
const house: Playlist = {
  key: 'playlists/playlist-house',
  slug: 'playlist-house',
  kind: 'style',
  title: {
    vi: 'Playlist house: 12 bài từ Chicago 1986 đến afro house 2026',
    en: 'House playlist: 12 tracks from 1986 Chicago to 2026',
  },
  excerpt: {
    vi: 'Playlist house 12 bài, từ Move Your Body và Acid Tracks của Trax Records đến Daft Punk, Black Coffee, Mau P, Peggy Gou, Move và SHADOWS năm 2026: tech, afro, melodic.',
    en: 'A 12-track house playlist from Trax Records\' Move Your Body and Acid Tracks to Daft Punk, Black Coffee, Mau P, Peggy Gou, Move and 2026\'s SHADOWS: tech, afro, melodic.',
  },
  cover: PLAYLIST_MEDIA_C.house,
  styles: ['house', 'tech-house', 'afro-house', 'deep-house'],
  style: 'house',
  lead: {
    vi: '**Playlist house** này đi từ gốc đến hôm nay: 12 bài từ "Move Your Body" của Marshall Jefferson trên Trax Records năm 1986 đến "SHADOWS" của John Summit năm 2026, qua acid house, French house, melodic, tech house và afro house. House là nền của gần như mọi dòng EDM; mỗi bài có trình phát và lý do nên nghe.',
    en: '**This house playlist** runs from the roots to today: 12 tracks from Marshall Jefferson\'s "Move Your Body" on Trax Records in 1986 to John Summit\'s "SHADOWS" in 2026, by way of acid house, French house, melodic, tech house and afro house. House sits under almost every EDM style; each track has a player and a reason to listen.',
  },
  tracks: [
    {
      youtube: 'dZVxqo2xAd4', artist: 'Marshall Jefferson', title: 'Move Your Body', year: 1986, channel: 'Trax Records', label: 'Trax Records',
      style: { vi: 'Chicago house', en: 'Chicago house' },
      note: {
        vi: 'Bài house năm 1986 của Marshall Jefferson, phát hành trên Trax Records, label của Chicago nơi anh sau đó làm A&R (Wikipedia); bài thường được gọi là "quốc ca của house music". Nghe tiếng piano dồn dập trên nhịp bốn phách, thứ khi đó còn lạ với nhạc house chủ yếu dùng máy trống và synth: house đã biết hát và gọi người ta đứng dậy.',
        en: 'Marshall Jefferson\'s 1986 house track, released on Trax Records, the Chicago label where he went on to work in A&R (Wikipedia); it is often called the house music anthem. Listen to the pounding piano over the four-on-the-floor beat, unusual for a house record of drum machines and synths back then: house learning to sing and call people to their feet.',
      },
    },
    {
      youtube: 'nS6HBakP4f0', artist: 'Phuture', title: 'Acid Tracks', year: 1987, channel: 'Trax Records', label: 'Trax Records',
      style: { vi: 'Acid house', en: 'Acid house' },
      note: {
        vi: 'Phuture là bộ ba DJ Pierre, Earl Smith Jr và Herbert Jackson; "Acid Tracks" (1987) do Marshall Jefferson sản xuất và Trax Records phát hành (Wikipedia). Đây là bài acid house đầu tiên. Nghe tiếng bass rít, uốn lượn của máy Roland TB-303 thay đổi chậm suốt hơn mười phút: âm thanh sinh ra cả một dòng nhạc và về sau là acid techno.',
        en: 'Phuture were DJ Pierre, Earl Smith Jr and Herbert Jackson; "Acid Tracks" (1987) was produced by Marshall Jefferson and released by Trax Records (Wikipedia). It is the first acid house record. Listen to the squelching, bending Roland TB-303 bass changing slowly over more than ten minutes: the sound that started a whole style, and later acid techno.',
      },
    },
    {
      youtube: 'FQlAEiCb8m0', artist: 'Stardust', title: 'Music Sounds Better With You', year: 1998, channel: 'Stardust', label: 'Roulé',
      style: { vi: 'French house', en: 'French house' },
      note: {
        vi: 'Bài duy nhất của Stardust, bộ ba gồm Thomas Bangalter (Daft Punk), Alan Braxe và ca sĩ Benjamin Diamond, phát hành ngày 20/7/1998 trên Roulé, label của Bangalter, rồi trên Virgin; riff guitar lấy mẫu từ "Fate" của Chaka Khan (Wikipedia). Nghe hiệu ứng filter mở dần trên mẫu disco lặp: dấu hiệu nhận ra French house.',
        en: 'The only song by Stardust, the trio of Thomas Bangalter (Daft Punk), Alan Braxe and singer Benjamin Diamond, released on 20 July 1998 on Bangalter\'s Roulé label and then on Virgin; its guitar riff is sampled from Chaka Khan\'s "Fate" (Wikipedia). Listen to the filter slowly opening on a looping disco sample: the signature of French house.',
      },
    },
    {
      youtube: 'FGBhQbmPwH8', artist: 'Daft Punk', title: 'One More Time', year: 2000, channel: 'Daft Punk', label: 'Virgin',
      style: { vi: 'French house', en: 'French house' },
      note: {
        vi: 'Single mở đường cho album Discovery (2001), Virgin phát hành tháng 11/2000; giọng hát auto-tune là của Romanthony, và bài lấy mẫu "More Spell on You" của Eddie Johns (Wikipedia). Nghe đoạn giữa bài khi nhịp trống biến mất và chỉ còn tiếng kèn và giọng hát: một khoảng nghỉ dài mà cả hội trường chờ để nhảy lại.',
        en: 'The lead single from Discovery (2001), released by Virgin in November 2000; the auto-tuned vocal is Romanthony\'s, and it samples Eddie Johns\'s "More Spell on You" (Wikipedia). Listen to the middle, when the drums drop away and only the horns and the voice remain: a long breakdown a whole room waits through to dance again.',
      },
    },
    {
      youtube: 'Tx9zMFodNtA', artist: 'RÜFÜS DU SOL', title: 'Innerbloom', year: 2015, channel: 'RÜFÜS DU SOL',
      style: { vi: 'Melodic house, alternative dance', en: 'Melodic house, alternative dance' },
      note: {
        vi: 'Phát hành ngày 20/11/2015, single thứ ba của album Bloom; bài đứng hạng 5 trong Hottest 100 of the Decade của đài Triple J (Wikipedia). Gần mười phút, "Innerbloom" xây chậm từ giọng hát và synth mềm tới nhịp house đều. Nghe cách bài không vội tới drop: melodic house là nghe cảm xúc lên dần, hợp lúc hoàng hôn.',
        en: 'Released on 20 November 2015 as the third single from the album Bloom; it ranked No. 5 in Triple J\'s Hottest 100 of the Decade (Wikipedia). At nearly ten minutes, "Innerbloom" builds slowly from a voice and soft synths to a steady house groove. Listen to how it never rushes a drop: melodic house is feeling rise, made for sunset.',
      },
    },
    {
      youtube: 'vu1QsEUVLQs', artist: 'Black Coffee & David Guetta feat. Delilah Montagu', title: 'Drive', year: 2018, channel: 'Ultra Records',
      style: { vi: 'Afro house', en: 'Afro house' },
      note: {
        vi: 'Phát hành ngày 24/8/2018, bài có trong album 7 của David Guetta và Subconsciously (2021) của Black Coffee (Wikipedia); Subconsciously thắng Grammy Best Dance/Electronic Album năm 2022 (News24). Nghe bộ gõ và nhịp afro house của Black Coffee, DJ Nam Phi, dưới giọng hát của Delilah Montagu: afro house bước ra sân khấu thế giới.',
        en: 'Released on 24 August 2018, it appears on David Guetta\'s album 7 and on Black Coffee\'s Subconsciously (2021) (Wikipedia); Subconsciously won the 2022 Grammy for Best Dance/Electronic Album (News24). Listen to the South African DJ\'s percussion and afro house groove under Delilah Montagu\'s vocal: afro house stepping onto the world stage.',
      },
    },
    {
      youtube: 'u31thuMehjM', artist: 'FISHER', title: 'Losing It', year: 2018, channel: 'FISHER', label: 'Catch & Release',
      style: { vi: 'Tech house', en: 'Tech house' },
      note: {
        vi: 'Nhà sản xuất người Úc FISHER phát hành "Losing It" ngày 13/7/2018 trên Catch & Release; bài lên số 1 bảng ARIA Club Tracks và bảng Dance Club Songs của Mỹ (Wikipedia). Đây là tech house ở dạng đơn giản nhất: một câu nói lặp, bassline và đoạn build kéo dài như lò xo. Nghe đoạn build dài, căng dần trước khi bass trở lại.',
        en: 'Australian producer FISHER released "Losing It" on 13 July 2018 on Catch & Release; it reached No. 1 on the ARIA Club Tracks chart and the US Dance Club Songs chart (Wikipedia). This is tech house at its simplest: one looped phrase, a bassline and a build stretched like a spring. Listen to the long, tightening build before the bass returns.',
      },
    },
    {
      youtube: 'ZwqhrzksG8A', artist: 'Mau P', title: 'Drugs From Amsterdam', year: 2022, channel: 'Repopulate Mars', label: 'Repopulate Mars',
      style: { vi: 'Tech house', en: 'Tech house' },
      note: {
        vi: 'Single đầu tay của DJ người Hà Lan Mau P, phát hành ngày 19/8/2022 trên Repopulate Mars, và lên số 1 bảng xếp hạng chính của Beatport (Wikipedia). Nghe giọng nói được xử lý, bassline nảy lệch nhịp và các khoảng hở giữa các tiếng kick: tech house những năm 2020 tối giản, hài hước và rất hợp để mix.',
        en: 'The debut single by Dutch DJ Mau P, released on 19 August 2022 on Repopulate Mars, and a No. 1 on Beatport\'s main chart (Wikipedia). Listen to the processed voice, the off-beat bouncing bassline and the gaps between kicks: 2020s tech house, minimal, playful and easy to mix.',
      },
    },
    {
      youtube: '5BqjhUmldDc', artist: 'John Summit & Hayla', title: 'Where You Are', year: 2023, channel: 'John Summit',
      style: { vi: 'Tech house có giọng hát, lễ hội', en: 'Vocal tech house for festivals' },
      note: {
        vi: 'John Summit, chủ label Experts Only, phát hành "Where You Are" với giọng ca Hayla đầu năm 2023 cùng Darkroom Records; Rolling Stone gọi bài là "a festival mainstay" và bài đưa anh vào top 10 Billboard lần đầu (Wikipedia). Nghe đường synth chính và giọng hát buồn trên nhịp house nhanh: house đứng ở sân khấu chính.',
        en: 'John Summit, who owns the Experts Only label, released "Where You Are" with singer Hayla in early 2023 together with Darkroom Records; Rolling Stone called it "a festival mainstay" and it gave him his first Billboard top 10 (Wikipedia). Listen to the lead synth line and the melancholy vocal over a fast house beat: house on the main stage.',
      },
    },
    {
      youtube: 'sCz5y84dwuA', artist: 'Peggy Gou', title: '(It Goes Like) Nanana', year: 2023, channel: 'Peggy Gou', label: 'XL Recordings',
      style: { vi: 'House pha trance thập niên 1990', en: 'House with a 1990s trance hook' },
      note: {
        vi: 'Peggy Gou, DJ sinh ở Incheon, phát hành bài tháng 6/2023 trên XL Recordings; bài lấy mẫu "9 PM (Till I Come)" (1998) của ATB và là single mở đường cho album đầu tay I Hear You, ra ngày 7/6/2024 (Wikipedia). Nghe đoạn "nanana" dễ nhớ và tiếng piano house cổ điển: một DJ châu Á đưa house lên các bảng xếp hạng.',
        en: 'Peggy Gou, a DJ born in Incheon, released it in June 2023 on XL Recordings; it samples ATB\'s "9 PM (Till I Come)" (1998) and was the lead single from her debut album I Hear You, out on 7 June 2024 (Wikipedia). Listen to the catchy "nanana" and the classic house piano: an Asian DJ taking house up the charts.',
      },
    },
    {
      youtube: '95dB-ObZ7Ho', artist: 'Adam Port, Stryv feat. Malachiii', title: 'Move (Extended Version)', year: 2024, channel: 'keinemusik', label: 'Keinemusik',
      style: { vi: 'Afro house', en: 'Afro house' },
      note: {
        vi: 'DJ người Đức Adam Port và nhà sản xuất Stryv phát hành "Move" với giọng ca Malachiii ngày 7/6/2024 trên Keinemusik; bài lan truyền sau khi được chơi ở các sự kiện của nhóm Keinemusik, rồi có bản phối với Camila Cabello (Wikipedia). Nghe nhịp gõ afro chậm và câu hát lặp: một bài club trở thành hit toàn cầu.',
        en: 'German DJ Adam Port and producer Stryv released "Move" with singer Malachiii on 7 June 2024 on Keinemusik; it went viral after being played at Keinemusik\'s events and later got a version with Camila Cabello (Wikipedia). Listen to the slow afro percussion and the looping vocal line: a club track turned global hit.',
      },
    },
    {
      youtube: 'TSZo2eZzD6s', artist: 'John Summit feat. LAVINIA', title: 'SHADOWS', year: 2026, channel: 'John Summit',
      style: { vi: 'House pha speed garage', en: 'House with speed garage' },
      note: {
        vi: 'Ra tháng 2/2026, "SHADOWS" là bài giới thiệu lớn thứ hai cho album thứ hai CTRL ESCAPE của John Summit, theo EDMTunes; bài pha các yếu tố speed garage, giọng hát mờ ảo của LAVINIA và một đường synth được so với "Where You Are". Nghe hai bài cạnh nhau để thấy âm thanh của anh đi từ 2023 đến 2026 thế nào.',
        en: 'Out in February 2026, "SHADOWS" is the second big preview of John Summit\'s sophomore album CTRL ESCAPE, says EDMTunes; it mixes speed garage elements, LAVINIA\'s ethereal vocal and a synth line the site compares to "Where You Are". Play the two side by side to hear how his sound moved from 2023 to 2026.',
      },
    },
  ],
  method: {
    vi: 'Chúng tôi chọn 12 bài theo bốn tiêu chí: mỗi giai đoạn và nhánh lớn của house (Chicago, acid, French house, melodic, tech house, afro house) có ít nhất một bài, từ năm 1986 đến 2026; mỗi bài được một nguồn uy tín nhắc tới (Wikipedia, News24, EDMTunes) hoặc có thành tích trên bảng xếp hạng; không bài nào trùng các bài trong cẩm nang EDM và Bass house; và mọi trình phát đều từ kênh chính thức của nghệ sĩ hoặc label, đã kiểm tra qua oEmbed của YouTube. Năm phát hành chỉ ghi khi có nguồn.',
    en: 'We chose 12 tracks on four rules: every era and big branch of house (Chicago, acid, French house, melodic, tech house, afro house) has at least one, from 1986 to 2026; each is named by a reputable source (Wikipedia, News24, EDMTunes) or has a chart record; none repeats the tracks in our EDM and Bass house guides; and every player comes from the artist\'s or label\'s official channel, checked through YouTube\'s oEmbed. A release year is given only when a source gives it.',
  },
  notes: {
    vi: 'House những năm 2020 có hai sức kéo lớn: tech house tối giản và vui (FISHER, Mau P, John Summit) ở các sân khấu chính, và afro house (Black Coffee, Keinemusik) ở các đêm hoàng hôn và lễ hội. Cả hai vẫn giữ nhịp bốn phách và tinh thần của Chicago năm 1986. Nếu mới nghe, hãy bắt đầu bằng "Music Sounds Better With You" và "Move".',
    en: 'House in the 2020s has two big pulls: minimal, playful tech house (FISHER, Mau P, John Summit) on the main stages, and afro house (Black Coffee, Keinemusik) at sunset sessions and festivals. Both keep the four-on-the-floor beat and the spirit of Chicago in 1986. New to it? Start with "Music Sounds Better With You" and "Move".',
  },
  related: [
    { slug: 'edm', line: { vi: 'EDM là gì? · bản đồ các dòng nhạc điện tử', en: 'What is EDM? · a map of electronic dance music' } },
    { slug: 'bass-house', line: { vi: 'Bass house là gì? · house với bass nặng', en: 'What is bass house? · house with heavy bass' } },
    { slug: 'playlist-mainstage-edm', line: { vi: 'Playlist mainstage · big room và progressive', en: 'Mainstage playlist · big room and progressive' } },
    { slug: 'playlist-edm', line: { vi: 'Playlist EDM · mọi playlist theo dòng nhạc', en: 'EDM playlists · every playlist by style' } },
  ],
  facts: [
    { label: { vi: 'Dòng nhạc', en: 'Style' }, value: { vi: 'House: Chicago, acid, French, melodic, tech, afro', en: 'House: Chicago, acid, French, melodic, tech, afro' } },
    { label: { vi: 'Số bài', en: 'Tracks' }, value: { vi: '12', en: '12' } },
    { label: { vi: 'Giai đoạn', en: 'Span' }, value: { vi: '1986–2026', en: '1986–2026' } },
    { label: { vi: 'BPM thường gặp', en: 'Typical BPM' }, value: { vi: '115–130', en: '115–130' } },
    { label: { vi: 'Hợp với', en: 'Best for' }, value: { vi: 'Hiểu gốc của EDM; một đêm club hay buổi hoàng hôn', en: 'Learning the roots of EDM; a club night or a sunset session' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Bài house đầu tiên nên nghe là gì?', en: 'Which house track should I hear first?' }, a: { vi: '"Move Your Body" của Marshall Jefferson (1986) cho thấy house Chicago; "Music Sounds Better With You" của Stardust (1998) là cửa vào dễ nghe nhất.', en: 'Marshall Jefferson\'s "Move Your Body" (1986) shows Chicago house; Stardust\'s "Music Sounds Better With You" (1998) is the easiest way in.' } },
    { q: { vi: 'House có tốc độ bao nhiêu BPM?', en: 'What BPM is house?' }, a: { vi: 'Thường 115–130 BPM, với nhịp bốn phách đều.', en: 'Usually 115–130 BPM, on a steady four-on-the-floor beat.' } },
    { q: { vi: 'Tech house và afro house khác nhau thế nào?', en: 'How is tech house different from afro house?' }, a: { vi: 'Tech house mượn bass và tiếng trống khô của techno, như "Losing It" của FISHER; afro house dựa trên bộ gõ và nhịp châu Phi, như "Drive" của Black Coffee hay "Move".', en: 'Tech house borrows techno\'s bass and dry drums, like FISHER\'s "Losing It"; afro house rests on African percussion and rhythm, like Black Coffee\'s "Drive" or "Move".' } },
    { q: { vi: 'Nghe những bài này ở đâu?', en: 'Where can I stream these tracks?' }, a: { vi: 'Mỗi bài có trình phát YouTube từ kênh chính thức của nghệ sĩ hoặc label, chỉ tải khi bạn bấm phát; các bài cũng có trên các dịch vụ nghe nhạc.', en: 'Each has a YouTube player from the artist\'s or label\'s official channel, loading only when you press play; the tracks are on the streaming services too.' } },
    { q: { vi: 'Danh sách này cập nhật bao lâu một lần?', en: 'How often is this list updated?' }, a: { vi: 'Khi có bài mới đủ tiêu chí; lần kiểm tra gần nhất là tháng 10/2026.', en: 'When a new track meets the rules; it was last checked in October 2026.' } },
  ],
  sources: [
    { title: 'Black Coffee wins first Grammy', url: 'https://www.news24.com/life/arts-and-entertainment/music/black-coffee-wins-first-grammy-20220404', publisher: 'News24' },
    { title: 'John Summit drops long-awaited single \'SHADOWS\'', url: 'https://www.edmtunes.com/2026/02/john-summit-drops-long-awaited-single-shadows/', publisher: 'EDMTunes' },
    { title: 'House music', url: wiki('House music'), publisher: 'Wikipedia' },
    { title: 'Move Your Body (Marshall Jefferson song)', url: wiki('Move Your Body (Marshall Jefferson song)'), publisher: 'Wikipedia' },
    { title: 'Acid Tracks', url: wiki('Acid Tracks'), publisher: 'Wikipedia' },
    { title: 'Music Sounds Better with You', url: wiki('Music Sounds Better with You'), publisher: 'Wikipedia' },
    { title: 'Drive (Black Coffee and David Guetta song)', url: wiki('Drive (Black Coffee and David Guetta song)'), publisher: 'Wikipedia' },
    { title: 'Move (Adam Port and Stryv song)', url: wiki('Move (Adam Port and Stryv song)'), publisher: 'Wikipedia' },
  ],
};

export const playlistHouse = playlistPost(house);
