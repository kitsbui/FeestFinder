import { playlistPost, type Playlist } from './shared.ts';
import { PLAYLIST_MEDIA_A } from './media-a.ts';

/** The month's list (kind monthly): new dance tracks released in October 2026, each with a source for its release. */
const october2026: Playlist = {
  key: 'playlists/playlist-thang-10-2026',
  slug: 'playlist-thang-10-2026',
  kind: 'monthly',
  title: {
    vi: 'Track EDM mới tháng 10/2026: 10 bài đáng nghe',
    en: 'Best new dance tracks of October 2026: 10 to hear',
  },
  excerpt: {
    vi: '10 bài dance mới phát hành tháng 10/2026: Above & Beyond, Moonfire trên A State of Trance, album của Sara Landry, Bicep, Orbital và bản remix psytrance.',
    en: 'Ten new dance tracks released in October 2026: Above & Beyond, Moonfire on A State of Trance, Sara Landry\'s album, Bicep, Orbital and a psytrance remix.',
  },
  cover: PLAYLIST_MEDIA_A.month,
  styles: ['trance', 'techno', 'hard-techno', 'psytrance', 'tech-house'],
  style: 'trance',
  lead: {
    vi: '**Track EDM mới tháng 10/2026** nghiêng hẳn về trance và các dòng nhạc nặng: Above & Beyond và Moonfire cho sàn trance, album thứ hai của Sara Landry cho hard techno, một bản remix psytrance của Charlotte de Witte, cùng những bài mở đường cho album mới của Bicep và Orbital. Mười bài, đều phát hành trong tháng.\n\n*Giai đoạn 1–31/10/2026, cập nhật ngày 23/10/2026; danh sách tháng 11 sẽ ra đầu tháng 12.*',
    en: '**The best new dance tracks of October 2026** lean towards trance and the harder styles: Above & Beyond and Moonfire for the trance floor, Sara Landry\'s second album for hard techno, a psytrance remix of Charlotte de Witte, and the first tracks from new albums by Bicep and Orbital. Ten tracks, all released this month.\n\n*Period 1–31 October 2026, last updated 23 October 2026; the November list follows in early December.*',
  },
  tracks: [
    {
      youtube: 'L8YS4f2Ws-E', artist: 'Above & Beyond', title: 'Nights Like This', channel: 'Above & Beyond', year: 2026, label: 'Anjunabeats',
      style: { vi: 'Trance', en: 'Trance' },
      note: {
        vi: 'Bộ ba chơi bài này lần đầu trong set bình minh ở EDC Las Vegas năm nay và phát hành trên Anjunabeats giữa tháng 10, ngay trước tour Anjunabeats UK Warehouse. TranceAttack nhận xét bài không đi theo trance uplifting 138–140 BPM truyền thống mà hướng hẳn về sàn chính: cảm xúc quen thuộc của Above & Beyond, nhưng nhiều năng lượng club hơn.',
        en: 'The trio first played it in their sunrise set at EDC Las Vegas this year and released it on Anjunabeats in mid-October, just ahead of the Anjunabeats UK Warehouse Tour. TranceAttack notes it skips the traditional 138–140 BPM uplifting formula for a main-floor direction: Above & Beyond\'s familiar emotion, with more club energy.',
      },
    },
    {
      youtube: 'CL-LRn2vmhc', artist: 'DIM3NSION x Frankyeffe', title: 'Moonfire', channel: 'DIM3NSION', year: 2026, label: 'A State of Trance', bpm: 145,
      style: { vi: 'Uplifting trance', en: 'Uplifting trance' },
      note: {
        vi: 'Ra trên A State of Trance ngày 16/10/2026, ở 145 BPM. DIM3NSION người Tây Ban Nha gặp Frankyeffe người Ý, vốn từ techno, để làm một bài trance mang tinh thần cuối thập niên 90. Armin van Buuren đã chơi bài từ tháng 8, kể cả ở sân khấu Freedom của Tomorrowland và trong nhiều tập A State of Trance.',
        en: 'Out on A State of Trance on 16 October 2026, at 145 BPM. Spain\'s DIM3NSION meets Italy\'s Frankyeffe, who comes from techno, for a trance track in the spirit of the late nineties. Armin van Buuren had been playing it since August, including on Tomorrowland\'s Freedom Stage and in several A State of Trance episodes.',
      },
    },
    {
      youtube: 'T6jgPRXsPKU', artist: 'Sara Landry, Electric Universe', title: 'Divine Intervention', channel: 'Sara Landry', year: 2026, label: 'HEKATE',
      style: { vi: 'Hard techno, psytrance', en: 'Hard techno, psytrance' },
      note: {
        vi: 'Bài mở đầu và đặt tên cho album thứ hai của Sara Landry, 14 bài, phát hành ngày 16/10/2026 trên label riêng HEKATE sau mười tháng làm giữa các chuyến lưu diễn. Hợp tác với Electric Universe, một tên tuổi psytrance, bài cho thấy hướng mới của album: hard techno pha psytrance, hard bounce và hardstyle.',
        en: 'The opener and title track of Sara Landry\'s 14-track second album, released on 16 October 2026 on her own HEKATE label after ten months of work between tours. A collaboration with the psytrance act Electric Universe, it sets out the album\'s new direction: hard techno mixed with psytrance, hard bounce and hardstyle.',
      },
    },
    {
      youtube: 'RVFVvau_yF0', artist: 'Charlotte de Witte', title: 'How You Move (Age of Acid Remix)', channel: 'KNTXT', year: 2026, label: 'RPM by KNTXT (RPMX020)',
      style: { vi: 'Psytrance, acid', en: 'Psytrance, acid' },
      note: {
        vi: 'Age of Acid là tên mới của Avalon và GMS, hai cái tên lâu năm của psytrance, và bản remix này là bài ra mắt chính thức của bộ đôi. Họ biến single techno năm 2024 của Charlotte de Witte thành psytrance, phát hành tháng 10 trên RPM by KNTXT với mã RPMX020. Nghe để thấy techno và psytrance đang gặp nhau ở đâu.',
        en: 'Age of Acid is the new name of Avalon and GMS, two veterans of psytrance, and this remix is their debut release as a duo. They turn Charlotte de Witte\'s 2024 techno single into psytrance, out in October on RPM by KNTXT as RPMX020. Listen to hear where techno and psytrance now meet.',
      },
    },
    {
      youtube: 'ydRyOr3KYD0', artist: 'BICEP ft. Lauren Duffus & SOARR', title: 'Gas', channel: 'BICEP', year: 2026, label: 'Ninja Tune',
      style: { vi: 'Breakbeat, electronica', en: 'Breakbeat, electronica' },
      note: {
        vi: 'Ra ngày 20/10/2026 cùng lúc Bicep công bố SLUG, album thứ ba gồm 18 bài, phát hành 29/1/2027 trên Ninja Tune và là album đầu tiên từ Isles (2021). "Gas" đi cùng hai bài mới khác, "Ultra" và "Equarium". Bộ đôi kể họ đã quay lại các demo cũ, thử trống méo và xử lý giọng analog: nghe kỹ phần trống.',
        en: 'Out on 20 October 2026 as Bicep announced SLUG, their 18-track third album due on 29 January 2027 on Ninja Tune and their first since Isles (2021). "Gas" came with two more new tracks, "Ultra" and "Equarium". The duo say they revisited old demos and tried distorted drums and analogue vocal processing: listen to the drums.',
      },
    },
    {
      youtube: 'AgLheItOgLo', artist: 'Massano ft. Ekko', title: 'Accelerate', channel: 'Massano', year: 2026,
      style: { vi: 'Tech house, techno', en: 'Tech house, techno' },
      note: {
        vi: 'Massano thường được biết với techno điện ảnh và giai điệu bay bổng, nhưng "Accelerate" nghiêng về tech house: một câu hát bắt tai mở đầu, synth leo dần, rồi cú drop có độ nặng. Bản gốc chưa đến năm phút. The Groove Cartel viết về bài ngày 16/10 và gọi đây là bước lệch khỏi chất âm quen thuộc của anh.',
        en: 'Massano is known for cinematic techno and soaring melodies, but "Accelerate" leans into tech house: a catchy vocal hook up front, a climbing synth, then a drop with weight behind it. The original mix runs just under five minutes. The Groove Cartel covered it on 16 October as a step away from his usual sound.',
      },
    },
    {
      youtube: '9lJlWfAV9oA', artist: 'Shkodra Elektronike', title: 'Me Dashtë', channel: 'Shkodra Elektronike', year: 2026,
      style: { vi: 'Techno, nhạc điện tử dân gian', en: 'Techno, electronic folk' },
      note: {
        vi: 'Bộ đôi Albania từng thắng Festivali i Këngës với "Zjerm" tháng 12/2024 và về thứ tám ở Eurovision 2025 tại Basel. "Me Dashtë", ra tháng 10, mở đường cho album Passport và đưa họ sang vùng techno nặng hơn, vẫn giữ giai điệu dân gian miền bắc và miền nam Albania. Một bài lạ tai giữa danh sách.',
        en: 'The Albanian duo won Festivali i Këngës with "Zjerm" in December 2024 and came eighth at Eurovision 2025 in Basel. "Me Dashtë", out in October, opens the way to their album Passport and takes them into heavier techno territory while keeping the folk melodies of Albania\'s north and south. An unexpected sound in this list.',
      },
    },
    {
      youtube: 'GSajmzi1uxc', artist: 'tommi', title: 'Keep Dancing', channel: 'Data Transmission', year: 2026, label: '63b',
      style: { vi: 'Tech house', en: 'Tech house' },
      note: {
        vi: 'Bài chủ đề của release hai bài (cùng "Thoughts") mà tommi phát hành trên label 63b ngày 16/10/2026. Bassline nặng và cuộn, bộ gõ gọn, một câu hát lặp lại kéo người nghe về groove. Data Transmission mô tả đây là bài làm cho phòng đông và những giờ khuya: đơn giản, ít lớp, dễ đặt vào một set dài.',
        en: 'The title track of the two-track release (with "Thoughts") tommi put out on 63b on 16 October 2026. A heavy, rolling bassline, tight percussion and a repeated vocal hook that pulls you back into the groove. Data Transmission describes it as built for packed rooms and late sessions: simple, uncluttered and easy to place in a long set.',
      },
    },
    {
      youtube: 'FRgCamxm_lY', artist: 'Orbital ft. Maxine Peake', title: 'Mother, Maiden & Crone', channel: 'Orbital', year: 2026,
      style: { vi: 'Electronica, techno', en: 'Electronica, techno' },
      note: {
        vi: 'Single đầu tiên của Other, album phòng thu thứ 11 của Orbital, phát hành 19/3/2027 trên London Records. Anh em Hartnoll mời diễn viên Maxine Peake đọc trên nền nhạc lấy cảm hứng từ phù thuỷ và văn hoá dân gian. Một bài để nghe bằng tai nghe hơn là ở peak time, từ một trong những nhóm đặt nền móng cho nhạc rave Anh.',
        en: 'The first single from Other, Orbital\'s 11th studio album, due on 19 March 2027 on London Records. The Hartnoll brothers bring in the actor Maxine Peake over music drawn from witchcraft and folklore. More one for headphones than for peak time, from one of the groups that laid the foundations of British rave.',
      },
    },
    {
      youtube: 'jzhDJM4Mj0Y', artist: 'Sara Landry, Alex Farell, SIKOTI', title: 'Get Inside', channel: 'Sara Landry', year: 2026,
      style: { vi: 'Hard techno, neo rave', en: 'Hard techno, neo rave' },
      note: {
        vi: 'Ra ngày 16/10/2026, cùng ngày với "Satellite" của SIKOTI trên A State of Trance, nên trong một tuần nhà sản xuất Glasgow này có mặt ở cả hai thế giới trance và hard techno. SIKOTI làm nhạc giữa techno, trance và neo rave từ năm 2021. Bài khép lại danh sách ở phía nặng nhất.',
        en: 'Out on 16 October 2026, the same day as SIKOTI\'s "Satellite" on A State of Trance, so in one week the Glasgow producer stood in both the trance and the hard techno worlds. SIKOTI has worked across techno, trance and neo rave since 2021. It closes the list on its heaviest side.',
      },
    },
  ],
  method: {
    vi: 'Một bài vào danh sách tháng khi nó phát hành trong tháng 10/2026 (hoặc cuối tháng 9 mà đến tháng 10 mới lan rộng) và có một nguồn ghi nhận việc phát hành: trang của label, bài đăng "out now" của A State of Trance, hoặc bài viết trên DJ Mag, Mixmag, TranceAttack, EDM Maniac, Electronic Groove, Magnetic, Data Transmission, The Groove Cartel và We Rave You. Chúng tôi đọc các nguồn này qua dòng tin tự động của FeestFinder, rồi nghe từng bài. Mỗi video là bản chính thức trên kênh của nghệ sĩ, label hoặc nơi công bố bài, đã kiểm tra phát được qua oEmbed của YouTube. Vài bài hay trong tháng không có mặt vì chưa có video chính thức trên YouTube (các bài mới của John Askew, Matt Fax & ØRA, ANOTR và SIKOTI chỉ có bản tải lên của người khác). BPM chỉ ghi khi nguồn nói rõ. Danh sách gồm mười bài, sắp từ trance qua techno đến hard techno như một mạch nghe.',
    en: 'A track makes the month\'s list when it was released in October 2026 (or in late September and only spread in October) and a source records the release: the label\'s page, A State of Trance\'s "out now" post, or a story in DJ Mag, Mixmag, TranceAttack, EDM Maniac, Electronic Groove, Magnetic, Data Transmission, The Groove Cartel or We Rave You. We read these sources through FeestFinder\'s automatic news feed, then listened to each track. Every video is the official upload on the artist\'s, label\'s or publisher\'s channel, checked to play through YouTube\'s oEmbed. A few good October tracks are missing because they have no official YouTube video yet (new tracks by John Askew, Matt Fax & ØRA, ANOTR and SIKOTI exist only as other people\'s uploads). BPM is given only when a source states it. The list has ten tracks, ordered from trance through techno to hard techno as one listen.',
  },
  notes: {
    vi: 'Tháng 10 là tháng của Amsterdam Dance Event và của những album công bố cho đầu năm 2027: Bicep, Orbital và album pop đầu tay của Martin Garrix đều được công bố trong tháng. Trance có một tháng mạnh, với các bài đã được Armin van Buuren thử suốt mùa hè ở Ibiza và Tomorrowland, nay mới phát hành. Hard techno tiếp tục đi về phía psytrance và hard bounce, như album của Sara Landry cho thấy. Nếu bạn là DJ, phần lớn các bài có bản extended trên Beatport và các cửa hàng nhạc số; hãy kiểm tra quyền sử dụng trước khi đưa vào mix đăng công khai.',
    en: 'October was the month of Amsterdam Dance Event and of albums announced for early 2027: Bicep, Orbital and Martin Garrix\'s debut pop album were all announced this month. Trance had a strong month, with tracks Armin van Buuren tested all summer in Ibiza and at Tomorrowland finally released. Hard techno kept moving towards psytrance and hard bounce, as Sara Landry\'s album shows. If you DJ, most of these have extended mixes on Beatport and the download stores; check the rights before putting them in a mix you publish.',
  },
  related: [
    { slug: 'playlist-edm-2026', line: { vi: 'Top track EDM 2026 · những bài định hình năm nay', en: 'Top dance tracks of 2026 · the ones that shaped the year' } },
    { slug: 'playlist-trance', line: { vi: 'Playlist trance · từ uplifting đến psy', en: 'Trance playlist · from uplifting to psy' } },
    { slug: 'playlist-techno', line: { vi: 'Playlist techno · những bài nên nghe ngay', en: 'Techno playlist · the tracks to hear now' } },
    { slug: 'trance', line: { vi: 'Trance là gì? · lịch sử và các nhánh', en: 'What is trance? · its history and branches' } },
    { slug: 'playlist-edm', line: { vi: 'Playlist EDM · mọi danh sách của FeestFinder', en: 'EDM playlists · every FeestFinder list' } },
  ],
  facts: [
    { label: { vi: 'Giai đoạn', en: 'Period' }, value: { vi: '1–31/10/2026', en: '1–31 October 2026' } },
    { label: { vi: 'Số bài', en: 'Tracks' }, value: { vi: '10, đều phát hành trong tháng', en: '10, all released this month' } },
    { label: { vi: 'Dòng nhạc', en: 'Styles' }, value: { vi: 'Trance, techno, hard techno, psytrance, tech house', en: 'Trance, techno, hard techno, psytrance, tech house' } },
    { label: { vi: 'Hợp với', en: 'Best for' }, value: { vi: 'Người tìm nhạc mới, DJ chuẩn bị set cuối năm', en: 'Fresh-music hunters, DJs preparing year-end sets' } },
    { label: { vi: 'Danh sách kế tiếp', en: 'Next list' }, value: { vi: 'Tháng 11/2026, ra đầu tháng 12', en: 'November 2026, out in early December' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: '23/10/2026', en: '23 October 2026' } },
  ],
  faq: [
    { q: { vi: 'Bài EDM mới nào đáng nghe nhất tháng 10/2026?', en: 'What are the best new dance tracks of October 2026?' }, a: { vi: '"Nights Like This" của Above & Beyond, "Moonfire" của DIM3NSION x Frankyeffe trên A State of Trance, "Divine Intervention" của Sara Landry và "Gas" của Bicep là những bài nổi bật nhất trong danh sách.', en: 'Above & Beyond\'s "Nights Like This", DIM3NSION x Frankyeffe\'s "Moonfire" on A State of Trance, Sara Landry\'s "Divine Intervention" and Bicep\'s "Gas" stand out in the list.' } },
    { q: { vi: 'Khi nào có danh sách tháng sau?', en: 'When is the next monthly update?' }, a: { vi: 'Danh sách tháng 11/2026 sẽ ra đầu tháng 12; danh sách tháng 10 giữ nguyên làm lưu trữ.', en: 'The November 2026 list comes out in early December; the October list stays as an archive.' } },
    { q: { vi: 'Các bài này có trên Spotify không?', en: 'Are these tracks on streaming platforms?' }, a: { vi: 'Có. Tất cả đều có trên Spotify, Apple Music và các dịch vụ lớn; trong bài, mỗi bài có player YouTube chính thức chỉ tải khi bạn bấm phát.', en: 'Yes. All of them are on Spotify, Apple Music and the major services; in this post each has its official YouTube player, loading only when you press play.' } },
    { q: { vi: 'DJ có thể chơi các bài này không?', en: 'Can I use these in my DJ set?' }, a: { vi: 'Có, khi bạn mua bản nhạc từ Beatport hoặc cửa hàng số. Chơi ở club thường do địa điểm trả phí bản quyền; đăng mix công khai thì kiểm tra quy định của nền tảng.', en: 'Yes, once you buy the tracks from Beatport or a download store. Playing in a club is usually covered by the venue\'s licence; for a mix you publish, check the platform\'s rules.' } },
    { q: { vi: 'Vì sao thiếu vài bài hay trong tháng?', en: 'Why are some good October tracks missing?' }, a: { vi: 'Chúng tôi chỉ dùng video chính thức. Vài bài mới của John Askew, Matt Fax & ØRA, ANOTR và SIKOTI chưa có bản chính thức trên YouTube.', en: 'We only use official videos. A few new tracks by John Askew, Matt Fax & ØRA, ANOTR and SIKOTI have no official YouTube upload yet.' } },
  ],
  sources: [
    { title: 'Above & Beyond – Nights Like This', url: 'https://tranceattack.net/above-beyond-nights-like-this/', publisher: 'TranceAttack' },
    { title: 'DIM3NSION & Frankyeffe – Moonfire', url: 'https://tranceattack.net/dim3nsion-frankyeffe-moonfire/', publisher: 'TranceAttack' },
    { title: 'Out now on A State of Trance: Dim3nsion x Frankyeffe – Moonfire', url: 'https://www.astateoftrance.com/out-now-on-a-state-of-trance-dim3nsion-x-frankyeffe-moonfire/', publisher: 'A State of Trance' },
    { title: 'Out now on A State of Trance: SIKOTI – Satellite', url: 'https://www.astateoftrance.com/out-now-on-a-state-of-trance-sikoti-satellite/', publisher: 'A State of Trance' },
    { title: 'Sara Landry releases second album ‘Divine Intervention’', url: 'https://electronicgroove.com/sara-landry-releases-second-album-divine-intervention/', publisher: 'Electronic Groove' },
    { title: 'BICEP announces new album ‘SLUG’ alongside three singles', url: 'https://electronicgroove.com/bicep-announces-new-album-slug-alongside-three-singles/', publisher: 'Electronic Groove' },
    { title: 'Massano x Ekko: the tension and release of “Accelerate”', url: 'https://thegroovecartel.com/news/massano-ekko-accelerate/', publisher: 'The Groove Cartel' },
    { title: 'Shkodra Elektronike tease forthcoming album with techno-influenced single “Me Dashtë”', url: 'https://magneticmag.com/2026/10/shkodra-elektronike-tease-forthcoming-album-with-emphatic-techno-influenced-single-me-dashte/', publisher: 'Magnetic Magazine' },
    { title: 'tommi returns to 63b with ‘Keep Dancing’', url: 'https://datatransmission.co/63b/tommi-keep-dancing/', publisher: 'Data Transmission' },
    { title: 'Avalon & GMS debut ‘Age of Acid’ with remix of Charlotte de Witte’s ‘How You Move’', url: 'https://weraveyou.com/2026/10/charlotte-de-witte-how-you-move-age-of-acid-remix-avalon-gms-kntxt/', publisher: 'We Rave You' },
    { title: 'Orbital announce new album ‘Other’ and share ‘Mother, Maiden & Crone’', url: 'https://weraveyou.com/2026/10/orbital-other-album-2027-mother-maiden-crone-maxine-peake-tour/', publisher: 'We Rave You' },
  ],
};

export const playlistThang10 = playlistPost(october2026);
