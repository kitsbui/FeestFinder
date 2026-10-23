import { playlistPost, type Playlist } from './shared.ts';
import { PLAYLIST_MEDIA_A } from './media-a.ts';

/** The year's list (kind yearly): tracks that defined 2026 on dance floors and charts, refreshed every quarter. */
const year2026: Playlist = {
  key: 'playlists/playlist-edm-2026',
  slug: 'playlist-edm-2026',
  kind: 'yearly',
  title: {
    vi: 'Top track EDM 2026: 11 bài định hình năm nay',
    en: 'Top dance tracks of 2026: the 11 that shaped the year',
  },
  excerpt: {
    vi: 'Những bài dance định hình năm 2026: ANOTR, Swedish House Mafia, John Summit, Calvin Harris, HUGEL, Prospa và UK garage của Silva Bumpa, mỗi bài có player và lý do nên nghe.',
    en: 'The dance tracks that shaped 2026: ANOTR, Swedish House Mafia, John Summit, Calvin Harris, HUGEL, Prospa and Silva Bumpa\'s UK garage, each with a player and why it matters.',
  },
  cover: PLAYLIST_MEDIA_A.year,
  styles: ['house', 'uk-garage', 'mainstage', 'electro'],
  style: 'house',
  lead: {
    vi: '**Top track EDM 2026** là những bài đã thật sự dẫn đầu bảng xếp hạng, phủ sóng các mùa Ibiza và được chơi nhiều nhất ở festival năm nay: disco house của ANOTR, Swedish House Mafia với Lykke Li, piano house của Calvin Harris, UK garage của Silva Bumpa. Mỗi bài có nguồn cho ngày phát hành hoặc thành tích của nó.\n\n*Cập nhật ngày 23/10/2026; danh sách được xem lại mỗi quý đến hết năm.*',
    en: '**The top dance tracks of 2026** are the ones that actually led the charts, owned the Ibiza season and got played most at festivals this year: ANOTR\'s disco house, Swedish House Mafia with Lykke Li, Calvin Harris\'s piano house, Silva Bumpa\'s UK garage. Each one has a source for its release or its record.\n\n*Last updated 23 October 2026; the list is reviewed every quarter until the year ends.*',
  },
  tracks: [
    {
      youtube: 'ajUMhpotf8k', artist: 'ANOTR ft. 54 Ultra', title: 'Talk To You', channel: 'ANOTR', year: 2026, label: 'No Art',
      style: { vi: 'Disco house', en: 'Disco house' },
      note: {
        vi: 'Bộ đôi Hà Lan phát hành bài này trên label riêng No Art ngày 6/3/2026. Bài lên số 1 bảng WARM Global Dance Radio ngày 11/4, đứng hạng 5 Hot Dance/Electronic Songs của Billboard và được Official Charts gọi là ứng viên hàng đầu cho "bài hát của mùa hè" Anh. Guitar funk, synth ngắt nhịp và giọng hát nhiều reverb: nhẹ nhàng nhưng không rời sàn.',
        en: 'The Dutch duo released it on their own No Art label on 6 March 2026. It reached No. 1 on the WARM Global Dance Radio chart dated 11 April, peaked at No. 5 on Billboard\'s Hot Dance/Electronic Songs, and Official Charts named it a key contender for the UK\'s song of the summer. Funk guitar, syncopated synth stabs, reverb-soaked vocals: relaxed, yet never off the floor.',
      },
    },
    {
      youtube: '5N5RfaCyD-Y', artist: 'Swedish House Mafia, Lykke Li', title: 'Happiness Is So Sad', channel: 'Swedish House Mafia', year: 2026,
      style: { vi: 'Progressive house, dance-pop', en: 'Progressive house, dance-pop' },
      note: {
        vi: 'Ra mắt trực tiếp ở Ushuaïa Ibiza ngày 28/6 và phát hành 31/7/2026, đây là lần đầu bộ ba hợp tác với Lykke Li, sản xuất cùng PARISI và Fred again... Tháng 10 bài trở thành quán quân Dance Airplay thứ tư của Swedish House Mafia trên Billboard. Giọng buồn trên một bản dựng hướng sân khấu lớn: đúng tên bài.',
        en: 'Premiered live at Ushuaïa Ibiza on 28 June and released on 31 July 2026, it is the trio\'s first collaboration with Lykke Li, produced with PARISI and Fred again... In October it became Swedish House Mafia\'s fourth Dance Airplay No. 1 on Billboard. A melancholy voice over a build made for big stages: exactly what the title says.',
      },
    },
    {
      youtube: 'TSZo2eZzD6s', artist: 'John Summit ft. LAVINIA', title: 'SHADOWS', channel: 'John Summit', year: 2026,
      style: { vi: 'House', en: 'House' },
      note: {
        vi: 'Phát hành ngày 11/2/2026, đến tháng 10 bài đã gần 24 triệu lượt nghe trên Spotify theo EDMTunes, và ngày 16/10 có thêm EP ba bản remix của REBRN, EdiP và Kade Findley x BLOOM. Đây là bài đi cùng John Summit suốt tour Ctrl Escape ở các arena Bắc Mỹ: giọng LAVINIA tối, bassline đều và kéo dài.',
        en: 'Released on 11 February 2026, it was close to 24 million Spotify streams by October according to EDMTunes, and on 16 October it gained a three-track remix EP by REBRN, EdiP and Kade Findley x BLOOM. It soundtracks John Summit\'s Ctrl Escape arena tour across North America: LAVINIA\'s dark vocal over a steady, rolling bassline.',
      },
    },
    {
      youtube: 'VCUSH0pWnTc', artist: 'Calvin Harris, Jazzy', title: 'Satisfy', channel: 'CalvinHarrisVEVO', year: 2026,
      style: { vi: 'Piano house', en: 'Piano house' },
      note: {
        vi: 'Ra ngày 8/5/2026, EDM.com gọi đây là bài house ấm áp dẫn dắt bằng piano, đúng lúc mùa festival bắt đầu. Calvin Harris mang bài đi khắp mùa diễn ở Ushuaïa Ibiza và Tomorrowland, còn ca sĩ kiêm DJ người Ireland Jazzy hát nhẹ phía trên. Một bài cho hoàng hôn và các sân khấu ngoài trời, dễ nghe ngay lần đầu.',
        en: 'Out on 8 May 2026, it was described by EDM.com as a warm, piano-driven house track arriving just as festival season began. Calvin Harris carried it through his Ushuaïa Ibiza residency and Tomorrowland, with the Irish singer and DJ Jazzy floating above it. A track for sunsets and open-air stages that lands on the first listen.',
      },
    },
    {
      youtube: 'n7QlUH0zrPg', artist: 'HUGEL, Imael Angel, Ultra Naté', title: 'Movin\' To The Sun', channel: 'Make The Girls Dance Records', year: 2026, label: 'Make The Girls Dance Records',
      style: { vi: 'House', en: 'House' },
      note: {
        vi: 'Bài mở màn album đầu tay Twenty One của HUGEL, phát hành ngày 22/5/2026 trên label riêng của anh, Make The Girls Dance Records. Official Charts ghi nhận bài từng đứng đầu Official Trending Chart của Anh. Có giọng của Ultra Naté, người hát "Free" năm 1997, nên bài nghe vừa như house hiện đại vừa như lời chào tới thập niên 90.',
        en: 'The lead single of HUGEL\'s debut album Twenty One, released on 22 May 2026 on his own Make The Girls Dance Records. Official Charts notes it topped the UK\'s Official Trending Chart. It carries the voice of Ultra Naté, of 1997\'s "Free", so it sounds like modern house and a nod to the nineties at once.',
      },
    },
    {
      youtube: 'gJYjbDnyx-o', artist: 'Prospa, Cloonee, Sybil', title: 'Free Your Mind', channel: 'CircoLoco Records', year: 2026, label: 'CircoLoco Records',
      style: { vi: 'House', en: 'House' },
      note: {
        vi: 'Bộ đôi Prospa của Anh cùng Cloonee làm nên một bài club cháy chậm, theo cách nói của Official Charts, và là bài chủ đề của album Prospa phát hành trên CircoLoco Records năm 2026. Groove house đều, piano và giọng hát lặp lại làm phòng nóng dần thay vì bùng nổ ngay: hợp với giờ thứ hai của một set.',
        en: 'The English duo Prospa and Cloonee made what Official Charts calls a slow-burning club track, the title track of Prospa\'s 2026 album on CircoLoco Records. A steady house groove, piano and a looping vocal warm the room up gradually instead of exploding at once: right for the second hour of a set.',
      },
    },
    {
      youtube: 'hFG5ZPtnxsw', artist: 'Dimitri Vegas, Sylver & Pat B', title: 'Turn The Tide', channel: 'Dimitri Vegas & Like Mike',
      style: { vi: 'Mainstage, hard dance', en: 'Mainstage, hard dance' },
      note: {
        vi: 'Bản làm lại bài hit "Turn the Tide" năm 2001 của nhóm Bỉ Sylver. Theo dữ liệu 1001Tracklists mà DJ Mag đăng, đây là bài được chơi nhiều nhất cuối tuần đầu của Tomorrowland 2026. Giai điệu trance quen thuộc được đẩy lên nhịp nhanh và nặng hơn: đoạn cả sân khấu chính hát theo.',
        en: 'A reworking of Belgian band Sylver\'s 2001 hit "Turn the Tide". According to 1001Tracklists data reported by DJ Mag, it was the most-played track of Tomorrowland 2026\'s first weekend. A familiar trance melody pushed faster and harder: the moment the whole main stage sings along.',
      },
    },
    {
      youtube: 'KJueIzCM_9c', artist: 'Interplanetary Criminal, Silva Bumpa', title: 'HOLD DA PHONE', channel: 'IPCVEVO', year: 2026, label: 'Room Two Recordings',
      style: { vi: 'UK garage', en: 'UK garage' },
      note: {
        vi: 'Hai cái tên lớn nhất của làn sóng UK garage mới gặp nhau trên Room Two Recordings; bản audio chính thức lên ngày 28/8/2026 và Mixmag chọn bài vào danh sách những track hay nhất năm 2026 (kỳ tháng 8). Nhịp 2-step lệch, bass đặc và một câu hát ngắn lặp lại: một bài chỉ cần vài giây để nhận ra.',
        en: 'Two of the biggest names of the new UK garage wave meet on Room Two Recordings; the official audio went up on 28 August 2026 and Mixmag put it on its best tracks of 2026 list (the August edition). Swung 2-step drums, a thick bass and a short looping vocal: a track you recognise within seconds.',
      },
    },
    {
      youtube: 'ULPcTknBMqw', artist: 'Silva Bumpa', title: 'On 2nite', channel: 'SilvaBumpaVEVO', year: 2026,
      style: { vi: 'UK garage', en: 'UK garage' },
      note: {
        vi: 'Official Charts gọi đây là bài bùng nổ của Silva Bumpa, ứng viên "bài hát mùa hè 2026" ở mục dance. Nhà sản xuất Leeds đưa UK garage từ các phòng club nhỏ lên bảng xếp hạng phổ thông mà vẫn giữ nhịp lệch và bassline đặc trưng. Nghe cùng "HOLD DA PHONE" để thấy cả hai mặt của anh.',
        en: 'Official Charts calls it Silva Bumpa\'s breakthrough banger and a dance contender for the song of summer 2026. He takes UK garage from small club rooms into the mainstream charts while keeping the swung rhythm and the signature bassline. Play it next to "HOLD DA PHONE" to hear both sides of him.',
      },
    },
    {
      youtube: '6yIQbf6p-Yw', artist: 'Boys Noize, ZEP', title: '1+1+1', channel: 'BOYS NOIZE', year: 2026, label: 'ONES AND ZEROS',
      style: { vi: 'Electro', en: 'Electro' },
      note: {
        vi: 'Ra ngày 24/9/2026, đây là single mở đường cho 7LLVSION, album solo đầu tiên sau năm năm của Boys Noize, phát hành 6/11 trên label ONES AND ZEROS của anh. Mixmag chọn bài vào danh sách track hay nhất năm 2026 (kỳ tháng 9). Bassline gai góc và trống méo: electro cho phần cuối đêm, không dành cho người nhút nhát.',
        en: 'Out on 24 September 2026, it is the lead single of 7LLVSION, Boys Noize\'s first solo album in five years, due on 6 November on his ONES AND ZEROS label. Mixmag put it on its best tracks of 2026 list (the September edition). A gritty bassline and distorted drums: electro for the late part of the night, not for the timid.',
      },
    },
    {
      youtube: 'nS-fOh1CfhQ', artist: 'Disco Lines & Tinashe', title: 'No Broke Boys', channel: 'Disco Lines', year: 2025,
      style: { vi: 'House, dance-pop', en: 'House, dance-pop' },
      note: {
        vi: 'Phát hành ngày 6/6/2025, nên đây là bài của năm ngoái; chúng tôi giữ trong danh sách vì nó vẫn đứng số 1 Hot Dance/Electronic Songs của Billboard vào tháng 1/2026, sau hơn 30 tuần trên bảng. Bản remix của Disco Lines biến bài R&B của Tinashe thành một hit house toàn cầu, lọt top 5 ở Anh, Úc và Đức.',
        en: 'Released on 6 June 2025, so it belongs to last year; it stays on this list because it still sat at No. 1 on Billboard\'s Hot Dance/Electronic Songs in January 2026, more than 30 weeks into its run. Disco Lines\' remix turned Tinashe\'s R&B song into a global house hit, top five in the UK, Australia and Germany.',
      },
    },
  ],
  method: {
    vi: 'Một bài vào danh sách khi có ít nhất một bằng chứng công khai rằng nó định hình năm 2026: đứng đầu hoặc lọt top một bảng xếp hạng uy tín (Billboard, WARM, Official Charts), được chơi nhiều nhất ở một festival lớn theo 1001Tracklists, hoặc được Mixmag chọn vào danh sách track hay nhất năm. Chúng tôi chỉ ghi ngày phát hành, label và thứ hạng khi nguồn nói rõ; bài nào chưa có nguồn cho ngày phát hành thì không ghi năm. Mỗi video là bản chính thức trên kênh của nghệ sĩ hoặc label, đã kiểm tra phát được qua oEmbed của YouTube. Danh sách có 11 bài thay vì 10 vì một bài (No Broke Boys) là của năm 2025 nhưng vẫn dẫn đầu bảng dance của Billboard đầu năm 2026; chúng tôi nói rõ điều đó thay vì xếp nó như bài mới. Thứ tự không phải bảng xếp hạng: các bài đi từ house nhẹ đến UK garage và electro, như một mạch nghe liền. Chúng tôi xem lại danh sách mỗi quý và thêm bài khi một bảng xếp hạng cuối năm (Beatport, Billboard, DJ Mag, Mixmag) được công bố.',
    en: 'A track makes the list when there is at least one public piece of evidence that it shaped 2026: a top place on a reputable chart (Billboard, WARM, Official Charts), the most plays at a major festival according to 1001Tracklists, or a place on Mixmag\'s best tracks of the year. We give release dates, labels and chart positions only when a source states them; a track with no source for its release date carries no year. Every video is the official upload on the artist\'s or label\'s channel, checked to play through YouTube\'s oEmbed. The list has 11 tracks rather than 10 because one (No Broke Boys) is a 2025 release that still led Billboard\'s dance chart in early 2026; we say so rather than passing it off as new. The order is not a ranking: the tracks run from light house to UK garage and electro, as one continuous listen. We review the list every quarter and add tracks when the year-end charts (Beatport, Billboard, DJ Mag, Mixmag) come out.',
  },
  notes: {
    vi: 'Năm 2026 là năm của house dễ nghe. Disco house của ANOTR, piano house của Calvin Harris và house thập niên 90 của HUGEL cùng chiếm sóng radio và mùa Ibiza, trong khi Swedish House Mafia quay lại bảng Dance Airplay với một bài buồn hơn hẳn những gì người ta chờ ở họ. Ở phía Anh, UK garage của Silva Bumpa và Interplanetary Criminal đi từ club nhỏ lên bảng xếp hạng phổ thông. Trên sân khấu chính các festival, các bản làm lại những bài hit trance cũ, như "Turn The Tide", vẫn là thứ khiến cả đám đông hát theo. Còn nếu bạn muốn nghe phần gai góc hơn của năm, hãy bắt đầu từ electro của Boys Noize hoặc danh sách techno và hard techno của chúng tôi.',
    en: '2026 was the year of easy-going house. ANOTR\'s disco house, Calvin Harris\'s piano house and HUGEL\'s nineties-flavoured house shared the radio and the Ibiza season, while Swedish House Mafia returned to the top of Dance Airplay with a far sadder song than anyone expected from them. In the UK, Silva Bumpa\'s and Interplanetary Criminal\'s UK garage moved from small clubs into the mainstream charts. On festival main stages, reworkings of old trance hits such as "Turn The Tide" were still what made a whole crowd sing. For the harder side of the year, start with Boys Noize\'s electro or our techno and hard techno lists.',
  },
  related: [
    { slug: 'playlist-thang-10-2026', line: { vi: 'Track mới tháng 10/2026 · những bài vừa ra trong tháng', en: 'New tracks, October 2026 · what came out this month' } },
    { slug: 'playlist-peak-time', line: { vi: 'Playlist peak time · khi cả phòng ở đỉnh', en: 'Peak-time playlist · when the room is at its height' } },
    { slug: 'playlist-house', line: { vi: 'Playlist house · nền tảng của dance music', en: 'House playlist · the foundation of dance music' } },
    { slug: 'mainstage-edm', line: { vi: 'Mainstage EDM là gì? · âm thanh của sân khấu lớn', en: 'What is mainstage EDM? · the sound of the big stages' } },
    { slug: 'playlist-edm', line: { vi: 'Playlist EDM · mọi danh sách của FeestFinder', en: 'EDM playlists · every FeestFinder list' } },
  ],
  facts: [
    { label: { vi: 'Giai đoạn', en: 'Period' }, value: { vi: 'Tháng 1–12/2026', en: 'January–December 2026' } },
    { label: { vi: 'Số bài', en: 'Tracks' }, value: { vi: '11 (10 bài của 2026, 1 bài 2025 dẫn đầu bảng đầu năm)', en: '11 (10 from 2026, one 2025 track that led the charts early in the year)' } },
    { label: { vi: 'Dòng nhạc', en: 'Styles' }, value: { vi: 'House, UK garage, mainstage, electro', en: 'House, UK garage, mainstage, electro' } },
    { label: { vi: 'Biên tập', en: 'Curated by' }, value: { vi: 'Ban biên tập FeestFinder', en: 'FeestFinder editorial' } },
    { label: { vi: 'Làm mới', en: 'Refreshed' }, value: { vi: 'Mỗi quý', en: 'Every quarter' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: '23/10/2026', en: '23 October 2026' } },
  ],
  faq: [
    { q: { vi: 'Bài dance nào nổi bật nhất năm 2026?', en: 'What was the biggest dance track of 2026?' }, a: { vi: '"Talk To You" của ANOTR ft. 54 Ultra là một trong những bài lớn nhất: số 1 bảng WARM Global Dance Radio tháng 4 và hạng 5 Hot Dance/Electronic Songs của Billboard. "Happiness Is So Sad" của Swedish House Mafia và Lykke Li đứng đầu Dance Airplay tháng 10.', en: 'ANOTR ft. 54 Ultra\'s "Talk To You" was one of the biggest: No. 1 on the WARM Global Dance Radio chart in April and No. 5 on Billboard\'s Hot Dance/Electronic Songs. Swedish House Mafia and Lykke Li\'s "Happiness Is So Sad" topped Dance Airplay in October.' } },
    { q: { vi: 'Danh sách này được xếp hạng thế nào?', en: 'How was this list ranked?' }, a: { vi: 'Không xếp hạng: mỗi bài cần một bằng chứng công khai (bảng xếp hạng, số lần được chơi ở festival hoặc danh sách của Mixmag), rồi các bài được sắp như một mạch nghe từ house đến electro.', en: 'It is not ranked: each track needs public evidence (a chart, festival plays or Mixmag\'s list), and the tracks are ordered as one listen from house to electro.' } },
    { q: { vi: 'Nghe các bài này ở đâu?', en: 'Where can I stream these tracks?' }, a: { vi: 'Mỗi bài có player YouTube chính thức ngay trong bài viết, chỉ tải khi bạn bấm phát. Tất cả đều có trên Spotify, Apple Music và các dịch vụ nghe nhạc lớn.', en: 'Each track has its official YouTube player in the post, loading only when you press play. All of them are on Spotify, Apple Music and the major streaming services.' } },
    { q: { vi: 'Danh sách có thay đổi không?', en: 'Will this list change?' }, a: { vi: 'Có. Chúng tôi xem lại mỗi quý và khi các bảng tổng kết năm của Beatport, Billboard, DJ Mag và Mixmag được công bố vào tháng 12.', en: 'Yes. We review it every quarter and again when Beatport, Billboard, DJ Mag and Mixmag publish their year-end lists in December.' } },
    { q: { vi: 'Vì sao có một bài năm 2025?', en: 'Why is there a 2025 track?' }, a: { vi: '"No Broke Boys" của Disco Lines và Tinashe ra tháng 6/2025 nhưng vẫn đứng số 1 Hot Dance/Electronic Songs của Billboard vào tháng 1/2026, nên nó thuộc về năm nay trên bảng xếp hạng.', en: 'Disco Lines and Tinashe\'s "No Broke Boys" came out in June 2025 but still sat at No. 1 on Billboard\'s Hot Dance/Electronic Songs in January 2026, so on the charts it belongs to this year.' } },
  ],
  sources: [
    { title: 'Talk to You (Anotr song)', url: 'https://en.wikipedia.org/wiki/Talk_to_You_(Anotr_song)', publisher: 'Wikipedia' },
    { title: 'Songs of Summer 2026 contenders', url: 'https://www.officialcharts.com/chart-news/songs-of-summer-2026-contenders/', publisher: 'Official Charts' },
    { title: 'Swedish House Mafia scores fourth Dance Airplay No. 1 with ‘Happiness Is So Sad’', url: 'https://www.billboard.com/music/chart-beat/swedish-house-mafia-happiness-is-so-sad-number-1-dance-airplay-1236362665/', publisher: 'Billboard' },
    { title: 'John Summit and LAVINIA’s ‘SHADOWS’ now has three-track remix EP', url: 'https://www.edmtunes.com/2026/10/21/john-summit-and-lavinias-shadows-now-has-three-track-remix-ep/', publisher: 'EDMTunes' },
    { title: 'Calvin Harris and Jazzy drop sun-soaked house track ‘Satisfy’', url: 'https://edm.com/music-releases/calvin-harris-jazzy-satisfy/', publisher: 'EDM.com' },
    { title: 'The best tracks of the year 2026 so far (September)', url: 'https://mixmag.net/feature/the-best-tracks-of-the-year-2026-so-far-september', publisher: 'Mixmag' },
    { title: 'The best tracks of the year 2026 so far (August)', url: 'https://mixmag.net/feature/the-best-tracks-of-the-year-2026-so-far-august', publisher: 'Mixmag' },
    { title: 'Tomorrowland 2026 most played tracks: weekend one revealed', url: 'https://djmag.com/news/tomorrowland-2026-most-played-tracks-weekend-one-revealed', publisher: 'DJ Mag' },
    { title: 'Disco Lines', url: 'https://en.wikipedia.org/wiki/Disco_Lines', publisher: 'Wikipedia' },
  ],
};

export const playlist2026 = playlistPost(year2026);
