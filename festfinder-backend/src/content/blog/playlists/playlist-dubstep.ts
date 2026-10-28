import { playlistPost, wiki, type Playlist } from './shared.ts';
import { PLAYLIST_MEDIA_C } from './media-c.ts';

/** Dubstep from DMZ to riddim and 2026, past the five tracks of the dubstep guide (research 2026-10-23: Wikipedia, DJ Mag, EDM.com, Beatportal, the artists' channels). */
const dubstep: Playlist = {
  key: 'playlists/playlist-dubstep',
  slug: 'playlist-dubstep',
  kind: 'style',
  title: {
    vi: 'Playlist dubstep: 11 bài từ DMZ đến riddim và A.F.B.1.',
    en: 'Dubstep playlist: 11 tracks from DMZ to riddim and A.F.B.1.',
  },
  excerpt: {
    vi: 'Playlist dubstep 11 bài, từ Mala và Rusko đến Scary Monsters, Rumble và A.F.B.1. của Excision & Subtronics năm 2026: deep, brostep, melodic, riddim, kèm lý do nghe.',
    en: 'An 11-track dubstep playlist from Mala and Rusko to Scary Monsters, Rumble and Excision & Subtronics\'s A.F.B.1. in 2026: deep, brostep, melodic, riddim, and why.',
  },
  cover: PLAYLIST_MEDIA_C.dubstep,
  styles: ['dubstep', 'bass'],
  style: 'dubstep',
  lead: {
    vi: '**Playlist dubstep** này đi tiếp từ cẩm nang Dubstep: 11 bài từ sub bass của Mala và nhóm DMZ ở Nam London đến "A.F.B.1." của Excision & Subtronics năm 2026, qua Rusko, Skrillex, Seven Lions, Hamdi và "Rumble" thắng Grammy. Từ deep đến riddim, mỗi bài có trình phát và lý do nên nghe.',
    en: '**This dubstep playlist** picks up where our Dubstep guide leaves off: 11 tracks from the sub bass of Mala and South London\'s DMZ to Excision & Subtronics\'s "A.F.B.1." in 2026, by way of Rusko, Skrillex, Seven Lions, Hamdi and the Grammy-winning "Rumble". From deep to riddim, each has a player and a reason to listen.',
  },
  tracks: [
    {
      youtube: 'PLozoX1RdnM', artist: 'Mala', title: 'Changes (Harmonimix)', channel: 'DEEP MEDi', label: 'DEEP MEDi Musik',
      style: { vi: 'Deep dubstep', en: 'Deep dubstep' },
      note: {
        vi: 'Mala là một nửa của Digital Mystikz cùng Coki; hai người điều hành label DMZ và đêm nhạc DMZ ở Brixton, nơi dubstep thành hình, và từng được John Peel ủng hộ từ sớm (Wikipedia). Đây là bản phối của Harmonimix trên DEEP MEDi, label của Mala. Nghe sub bass chiếm gần hết khoảng trống và nhịp half-time thong thả: dubstep thời đầu để cảm bằng cơ thể.',
        en: 'Mala is one half of Digital Mystikz with Coki; the two run the DMZ label and the DMZ night in Brixton where dubstep took shape, and John Peel was an early supporter (Wikipedia). This is the Harmonimix remix, on Mala\'s DEEP MEDi label. Listen to the sub bass filling almost all the space and the unhurried half-time beat: early dubstep, felt in the body.',
      },
    },
    {
      youtube: 'WtMlB-BEMso', artist: 'Rusko', title: 'Woo Boost', year: 2010, channel: 'Mad Decent', label: 'Mad Decent',
      style: { vi: 'Dubstep vui, chuyển sang Mỹ', en: 'Playful dubstep crossing to the US' },
      note: {
        vi: 'Rusko, nhà sản xuất người York, phát hành "Woo Boost" trên Mad Decent năm 2010, cùng năm với album O.M.G.! (Wikipedia). Bài nằm giữa dubstep London và khán giả Mỹ: nhịp nảy, giọng hát cắt nhỏ, bass lắc lư hơn là đe doạ. Nghe tiếng "wobble" chậm và vui: âm thanh đã dẫn đường cho dubstep tới các lễ hội Mỹ.',
        en: 'York producer Rusko released "Woo Boost" on Mad Decent in 2010, the year of his album O.M.G.! (Wikipedia). It sits between London dubstep and the American crowd: a bouncing beat, chopped vocals and a bass that swaggers more than it threatens. Listen to the slow, cheeky wobble: the sound that led dubstep to US festivals.',
      },
    },
    {
      youtube: 'WSeNSzJ2-Jw', artist: 'Skrillex', title: 'Scary Monsters and Nice Sprites', year: 2010, channel: 'Skrillex', label: 'mau5trap / Big Beat',
      style: { vi: 'Brostep', en: 'Brostep' },
      note: {
        vi: 'Phát hành ngày 22/10/2010 trên mau5trap và Big Beat, bài bắt đầu như một lần thử synth FM8 của Native Instruments (Wikipedia). Ở Grammy lần thứ 54, Skrillex thắng ba giải, trong đó có Best Dance Recording. Nghe sự tương phản giữa đoạn mở đầu ngọt ngào và drop gầm gừ như kim loại: khoảnh khắc dubstep Mỹ thành hiện tượng.',
        en: 'Released on 22 October 2010 on mau5trap and Big Beat, it began as a test of Native Instruments\' FM8 synth (Wikipedia). At the 54th Grammys Skrillex won three awards, Best Dance Recording among them. Listen to the contrast between the sweet opening and the metallic, snarling drop: the moment American dubstep became a phenomenon.',
      },
    },
    {
      youtube: 'Wtz8QANnHH4', artist: 'Flux Pavilion', title: 'I Can\'t Stop', year: 2010, channel: 'Big Beat Records', label: 'Circus Records',
      style: { vi: 'Dubstep có giai điệu, lễ hội', en: 'Melodic festival dubstep' },
      note: {
        vi: 'Bài nằm trong EP đầu tay Lines in Wax của Flux Pavilion, phát hành ngày 11/10/2010 trên Circus Records (Wikipedia), và về sau được Kanye West và Jay-Z lấy mẫu trong "Who Gon Stop Me". Nghe đoạn build dài với giọng hát lặp, rồi drop mang giai điệu: dubstep cho đám đông hát theo, không chỉ để rung.',
        en: 'It comes from Flux Pavilion\'s debut EP Lines in Wax, released on 11 October 2010 on Circus Records (Wikipedia), and was later sampled by Kanye West and Jay-Z on "Who Gon Stop Me". Listen to the long build with its looping vocal, then a drop that keeps a melody: dubstep for a crowd to sing to, not only to shake.',
      },
    },
    {
      youtube: 'y1hWi-vgoaU', artist: 'Seven Lions feat. Fiora', title: 'Days to Come', year: 2012, channel: 'OWSLA', label: 'OWSLA',
      style: { vi: 'Melodic dubstep', en: 'Melodic dubstep' },
      note: {
        vi: 'Bài chủ đề của EP Days to Come, Seven Lions phát hành trên OWSLA tháng 10/2012; đây là bài dubstep duy nhất của EP, với giọng ca Úc Fiora, và EP lên hạng 10 bảng Dance/Electronic Albums của Billboard (Wikipedia). Nghe cách giai điệu trance và giọng hát dẫn tới một drop nặng nhưng buồn: gốc rễ của melodic dubstep.',
        en: 'The title track of the Days to Come EP, which Seven Lions released on OWSLA in October 2012; it is the EP\'s only dubstep song, sung by the Australian Fiora, and the EP reached No. 10 on Billboard\'s Dance/Electronic Albums chart (Wikipedia). Listen to the trance melody and the vocal leading to a heavy but wistful drop: the roots of melodic dubstep.',
      },
    },
    {
      youtube: 'kod5PkTm_ts', artist: 'Zomboy', title: 'Like A Bitch', channel: 'Zomboy Official',
      style: { vi: 'Dubstep nặng, sân khấu lớn', en: 'Heavy big-stage dubstep' },
      note: {
        vi: 'Zomboy là nhà sản xuất người Anh với linh vật là một xác sống; EP đầu tay Game Time (2011), phát hành qua Never Say Die Records, nằm trong top 5 dubstep của Beatport hơn tám tuần (Wikipedia). "Like A Bitch" là âm thanh khiến anh nổi tiếng: nhịp nhanh, bass cắt nhỏ và các khoảng dừng bất ngờ. Nghe cách drop thay đổi liên tục mà không mất nhịp.',
        en: 'Zomboy is an English producer whose mascot is a zombie; his 2011 debut EP Game Time, released through Never Say Die Records, spent over eight weeks in Beatport\'s dubstep top five (Wikipedia). "Like A Bitch" is the sound that made his name: a fast beat, chopped bass and sudden stops. Listen to how the drop keeps changing without losing the groove.',
      },
    },
    {
      youtube: 'K9crshqpPB0', artist: 'GRiZ & Subtronics', title: 'Griztronics', year: 2019, channel: 'UKF Dubstep',
      style: { vi: 'Riddim gặp funk', en: 'Riddim meets funk' },
      note: {
        vi: 'Griztronics là dự án chung của GRiZ, người vừa sản xuất vừa thổi saxophone, và Subtronics, bắt đầu từ năm 2019 với chính bài này (Wikipedia). Nghe hai thế giới va nhau: kèn và nhịp funk của GRiZ, rồi drop riddim lặp đi lặp lại của Subtronics. Riddim là dubstep tối giản, nhấn vào một mẫu bass lặp, và đây là cửa vào dễ nghe nhất.',
        en: 'Griztronics is the joint project of GRiZ, a producer who also plays saxophone, and Subtronics, which began in 2019 with this very track (Wikipedia). Listen to two worlds colliding: GRiZ\'s horns and funk groove, then Subtronics\'s repeating riddim drop. Riddim is stripped-back dubstep built on one looping bass pattern, and this is its friendliest way in.',
      },
    },
    {
      youtube: '9DcWmQs-LPg', artist: 'Hamdi', title: 'Skanka', channel: 'UKF Dubstep',
      style: { vi: 'Dubstep pha UK garage và grime', en: 'Dubstep with UK garage and grime' },
      note: {
        vi: 'Theo Beatportal (5/2023), "Skanka" là bản bass bùng nổ đưa Hamdi, nhà sản xuất sống ở Oxford, tới danh tiếng toàn cầu, và Skrillex đã đứng ra ủng hộ anh. Nghe nhịp lắc kiểu UK garage và cách bass bật nảy thay vì gầm rú: dubstep những năm 2020 quay về gốc London, nhẹ hơn và dễ nhảy hơn.',
        en: 'In Beatportal\'s words (May 2023), "Skanka" is the massive bass banger that launched Hamdi, an Oxford-based producer, into global stardom, and Skrillex co-signed him. Listen to the UK garage swing and the bass that bounces instead of roaring: 2020s dubstep turning back to its London roots, lighter and easier to dance to.',
      },
    },
    {
      youtube: 'i8Vgo5S-_NM', artist: 'Skrillex, Fred again.. & Flowdan', title: 'Rumble', year: 2023, channel: 'Skrillex', label: 'Atlantic / OWSLA',
      style: { vi: 'Dubstep với MC grime', en: 'Dubstep with a grime MC' },
      note: {
        vi: 'Phát hành ngày 4/1/2023 trên Atlantic và OWSLA (Wikipedia), "Rumble" thắng Grammy Best Dance/Electronic Recording năm 2024 (DJ Mag), giải Grammy đầu tiên của Fred again.. và Flowdan. Nghe giọng trầm của Flowdan trên nhịp half-time và tiếng bass rền như sấm: một bài dubstep mà người chưa từng nghe dubstep cũng nhận ra.',
        en: 'Released on 4 January 2023 on Atlantic and OWSLA (Wikipedia), "Rumble" won the 2024 Grammy for Best Dance/Electronic Recording (DJ Mag), the first Grammy for Fred again.. and Flowdan. Listen to Flowdan\'s low voice over the half-time beat and the bass rolling like thunder: a dubstep track even people who never listen to dubstep recognise.',
      },
    },
    {
      youtube: 'PW2OZeyaVsg', artist: 'Excision & Subtronics', title: 'A.F.B.1.', year: 2026, channel: 'Excision', label: 'Subsidia',
      style: { vi: 'Riddim, dubstep nặng', en: 'Riddim, heavy dubstep' },
      note: {
        vi: 'EDM.com đưa tin ngày 13/2/2026 rằng bài ra trên Subsidia, label của Excision; bài từng mở màn set chung của hai người ở Lost Lands 2025 và là lần hợp tác thứ ba sau "Asteroid" và "Bunker Buster". Nghe drop đầu với các mẫu riddim kiểu Excision, rồi drop thứ hai đổi sang một tiếng bass trườn: hai chữ ký âm thanh trong một bài.',
        en: 'EDM.com reported on 13 February 2026 that it came out on Subsidia, Excision\'s label; it had opened the pair\'s Lost Lands 2025 set and is their third collaboration after "Asteroid" and "Bunker Buster". Listen to the first drop\'s Excision-style riddim patterns, then the second drop switching to a slithering bass: two sound signatures in one track.',
      },
    },
    {
      youtube: 'aR3Q5QJTtnU', artist: 'Subtronics', title: 'Live @ Coachella 2026 (Weekend 1)', year: 2026, channel: 'Subtronics',
      style: { vi: 'Set lễ hội, riddim và dubstep', en: 'A festival set, riddim and dubstep' },
      note: {
        vi: 'Đây là set khoảng một giờ, không phải single: Subtronics chơi tuần đầu Coachella 2026, do kênh chính thức của anh đăng. Subtronics là DJ người Philadelphia, từng chơi trống từ nhỏ trước khi đến với EDM, và nay có các lễ hội riêng ở Bắc Mỹ (Wikipedia). Nghe cách một set dubstep lớn xếp drop nối drop và dùng khoảng lặng để đám đông thở.',
        en: 'This is a set of about an hour, not a single: Subtronics playing Coachella 2026\'s first weekend, posted by his official channel. Subtronics is a Philadelphia DJ who played drums as a child before finding EDM and now runs his own festivals in North America (Wikipedia). Listen to how a big dubstep set stacks drop on drop and uses silence to let the crowd breathe.',
      },
    },
  ],
  method: {
    vi: 'Chúng tôi chọn 11 bài theo bốn tiêu chí: mỗi nhánh của dubstep (deep, brostep, melodic, riddim, dubstep pha garage) có ít nhất một bài, từ đêm DMZ ở London đến năm 2026; mỗi bài được một nguồn uy tín nhắc tới (Wikipedia, DJ Mag, EDM.com, Beatportal) hoặc có giải thưởng; không bài nào lặp lại năm bài trong cẩm nang Dubstep; và mọi trình phát đều từ kênh chính thức của nghệ sĩ hoặc label, đã kiểm tra qua oEmbed của YouTube. Năm phát hành chỉ ghi khi có nguồn.',
    en: 'We chose 11 tracks on four rules: every branch of dubstep (deep, brostep, melodic, riddim, garage-leaning) has at least one, from the DMZ nights in London to 2026; each is named by a reputable source (Wikipedia, DJ Mag, EDM.com, Beatportal) or won an award; none repeats the five tracks in our Dubstep guide; and every player comes from the artist\'s or label\'s official channel, checked through YouTube\'s oEmbed. A release year is given only when a source gives it.',
  },
  notes: {
    vi: 'Dubstep năm 2026 đi hai hướng: riddim và dubstep nặng vẫn kín các sân khấu bass ở Mỹ (Excision và Subtronics ở Lost Lands, Subtronics ở Coachella), trong khi ở Anh những nhà sản xuất như Hamdi kéo dubstep về gần UK garage và grime. Nếu mới nghe, hãy bắt đầu bằng "Rumble" và "Days to Come" rồi mới tới riddim.',
    en: 'Dubstep in 2026 runs two ways: riddim and heavy dubstep still fill the bass stages in the US (Excision and Subtronics at Lost Lands, Subtronics at Coachella), while in the UK producers such as Hamdi pull it back towards UK garage and grime. New to it? Start with "Rumble" and "Days to Come" before riddim.',
  },
  related: [
    { slug: 'dubstep', line: { vi: 'Dubstep là gì? · 140 BPM half-time, lịch sử và các nhánh', en: 'What is dubstep? · 140 BPM half-time, history and sub-genres' } },
    { slug: 'playlist-drum-and-bass', line: { vi: 'Playlist drum & bass · từ liquid đến neurofunk', en: 'Drum & bass playlist · from liquid to neurofunk' } },
    { slug: 'bass-house', line: { vi: 'Bass house là gì? · họ hàng bốn phách của dubstep', en: 'What is bass house? · dubstep\'s four-to-the-floor cousin' } },
    { slug: 'playlist-edm', line: { vi: 'Playlist EDM · mọi playlist theo dòng nhạc', en: 'EDM playlists · every playlist by style' } },
  ],
  facts: [
    { label: { vi: 'Dòng nhạc', en: 'Style' }, value: { vi: 'Dubstep: deep, brostep, melodic, riddim', en: 'Dubstep: deep, brostep, melodic, riddim' } },
    { label: { vi: 'Số bài', en: 'Tracks' }, value: { vi: '11', en: '11' } },
    { label: { vi: 'Giai đoạn', en: 'Span' }, value: { vi: 'Thời DMZ đến 2026', en: 'The DMZ years to 2026' } },
    { label: { vi: 'BPM thường gặp', en: 'Typical BPM' }, value: { vi: 'Khoảng 140 (cảm giác half-time 70)', en: 'Around 140 (a 70 half-time feel)' } },
    { label: { vi: 'Hợp với', en: 'Best for' }, value: { vi: 'Hiểu các nhánh dubstep; chuẩn bị cho một sân khấu bass', en: 'Learning the branches of dubstep; getting ready for a bass stage' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Nên bắt đầu nghe dubstep từ bài nào?', en: 'Which dubstep track should I start with?' }, a: { vi: '"Rumble" của Skrillex, Fred again.. và Flowdan (2023) dễ nghe và thắng Grammy; "Changes" của Mala cho thấy dubstep thời đầu sâu lắng ra sao.', en: 'Skrillex, Fred again.. and Flowdan\'s "Rumble" (2023) is easy to get into and won a Grammy; Mala\'s "Changes" shows how deep early dubstep was.' } },
    { q: { vi: 'Dubstep có tốc độ bao nhiêu BPM?', en: 'What BPM is dubstep?' }, a: { vi: 'Khoảng 140 BPM, với cảm giác half-time như 70 BPM.', en: 'Around 140 BPM, with a half-time feel like 70.' } },
    { q: { vi: 'Riddim là gì?', en: 'What is riddim?' }, a: { vi: 'Một nhánh dubstep tối giản, xây trên một mẫu bass lặp lại, như drop của "Griztronics" hay "A.F.B.1.".', en: 'A stripped-back branch of dubstep built on one repeating bass pattern, like the drops of "Griztronics" or "A.F.B.1.".' } },
    { q: { vi: 'Nghe những bài này ở đâu?', en: 'Where can I stream these tracks?' }, a: { vi: 'Mỗi bài có trình phát YouTube từ kênh chính thức của nghệ sĩ hoặc label, chỉ tải khi bạn bấm phát; các bài cũng có trên các dịch vụ nghe nhạc.', en: 'Each has a YouTube player from the artist\'s or label\'s official channel, loading only when you press play; the tracks are on the streaming services too.' } },
    { q: { vi: 'Danh sách này cập nhật bao lâu một lần?', en: 'How often is this list updated?' }, a: { vi: 'Khi có bài mới đủ tiêu chí; lần kiểm tra gần nhất là tháng 10/2026.', en: 'When a new track meets the rules; it was last checked in October 2026.' } },
  ],
  sources: [
    { title: 'Grammys 2024: Skrillex, Flowdan, Fred again..\'s \'Rumble\' wins Best Dance/Electronic Recording', url: 'https://djmag.com/news/grammys-2024-skrillex-flowdan-fred-agains-rumble-wins-best-danceelectronic-recording', publisher: 'DJ Mag' },
    { title: 'Subtronics and Excision drop squelching dubstep banger, \'A.F.B.1.\'', url: 'https://edm.com/music-releases/subtronics-excision-afb1/', publisher: 'EDM.com' },
    { title: 'Introducing: Hamdi', url: 'https://www.beatportal.com/features/introducing-hamdi', publisher: 'Beatportal' },
    { title: 'Digital Mystikz', url: wiki('Digital Mystikz'), publisher: 'Wikipedia' },
    { title: 'Scary Monsters and Nice Sprites (song)', url: wiki('Scary Monsters and Nice Sprites (song)'), publisher: 'Wikipedia' },
    { title: 'Lines in Wax', url: wiki('Lines in Wax'), publisher: 'Wikipedia' },
    { title: 'Seven Lions', url: wiki('Seven Lions'), publisher: 'Wikipedia' },
    { title: 'Rumble (Skrillex, Fred Again and Flowdan song)', url: wiki('Rumble (Skrillex, Fred Again and Flowdan song)'), publisher: 'Wikipedia' },
  ],
};

export const playlistDubstep = playlistPost(dubstep);
