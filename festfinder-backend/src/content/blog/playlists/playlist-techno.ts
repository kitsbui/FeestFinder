import { playlistPost, wiki, type Playlist } from './shared.ts';
import { PLAYLIST_MEDIA_B } from './media-b.ts';

/** Techno from 1990 to now, past the five tracks of the techno guide (research 2026-10-23: Beatportal, Wikipedia, Mixmag, the labels' channels). */
const techno: Playlist = {
  key: 'playlists/playlist-techno',
  slug: 'playlist-techno',
  kind: 'style',
  title: {
    vi: 'Playlist techno: 11 bài từ Energy Flash đến Overdrive',
    en: 'Techno playlist: 11 tracks from Energy Flash to Overdrive',
  },
  excerpt: {
    vi: 'Playlist techno 11 bài, từ Energy Flash (1990) và Spastik của Plastikman đến Amelie Lens và Charlotte de Witte 2023: peak time, hypnotic, hard techno, mỗi bài một lý do nghe.',
    en: 'An 11-track techno playlist from Energy Flash (1990) and Plastikman\'s Spastik to Amelie Lens and Charlotte de Witte in 2023: peak time, hypnotic and hard, each with a reason.',
  },
  cover: PLAYLIST_MEDIA_B.techno,
  styles: ['techno', 'hard-techno', 'minimal'],
  style: 'techno',
  lead: {
    vi: '**Playlist techno** này đi tiếp từ cẩm nang Techno: 11 bài từ "Energy Flash" của Joey Beltram năm 1990 đến "Overdrive" của Charlotte de Witte năm 2023, qua Plastikman, Green Velvet, Laurent Garnier và Paula Temple. Có bài peak time, bài hypnotic và bài hard techno, theo thứ tự năm, mỗi bài đều phát từ kênh chính thức của nghệ sĩ hoặc label.',
    en: '**This techno playlist** picks up where our Techno guide leaves off: 11 tracks from Joey Beltram\'s "Energy Flash" in 1990 to Charlotte de Witte\'s "Overdrive" in 2023, by way of Plastikman, Green Velvet, Laurent Garnier and Paula Temple. Peak-time, hypnotic and hard tracks, in order of year, each playing from the artist\'s or label\'s official channel.',
  },
  tracks: [
    {
      youtube: '43W62fFY8C4', artist: 'Joey Beltram', title: 'Energy Flash', year: 1990, channel: 'GROUND:FAULT:INTERRUPT', label: 'R&S Records',
      style: { vi: 'Techno thời đầu', en: 'Early techno' },
      note: {
        vi: 'Joey Beltram, DJ người New York, phát hành "Energy Flash" trên R&S Records, label Bỉ khi đó đã bảy năm tuổi (Beatportal). Bài gần như không có giai điệu: một tiếng stab lặp, bassline u tối và giọng thì thầm. Hãy nghe cách sáu phút chỉ đổi rất ít mà vẫn giữ được sàn, đó là bài học đầu tiên của techno.',
        en: 'New York DJ Joey Beltram released "Energy Flash" on R&S Records, a Belgian label already seven years old by then (Beatportal). There is barely a melody: one looping stab, a dark bassline and a whispered voice. Listen to how six minutes change very little and still hold a floor; that is techno\'s first lesson.',
      },
    },
    {
      youtube: '6TYsOMYaz6E', artist: 'Plastikman', title: 'Spastik', channel: 'Richie Hawtin', label: 'Plus 8 (PLUS8078)',
      style: { vi: 'Minimal techno, chỉ có trống', en: 'Minimal techno, drums only' },
      note: {
        vi: 'Plastikman là bí danh của Richie Hawtin, người lập label Plus 8 cùng John Acquaviva năm 1990. Theo Beatportal, "Spastik" là bản phát hành đầu tiên của Plastikman và lập tức thành vũ khí peak time. Cả bài chỉ có trống: tiếng snare và tom cuộn lên, dồn lại rồi mở ra. Nghe để hiểu techno tạo cao trào mà không cần một nốt nhạc nào.',
        en: 'Plastikman is Richie Hawtin\'s alias; he founded Plus 8 with John Acquaviva in 1990. Beatportal calls "Spastik", Plastikman\'s first release, an instant peak-time weapon. The whole track is drums: snare and tom rolls that build, crowd together and open up. Listen to learn how techno climbs without a single melodic note.',
      },
    },
    {
      youtube: '9lnrQqNeoFE', artist: 'Dave Clarke', title: 'Wisdom To The Wise (Red 2)', year: 1994, channel: 'Dave Clarke',
      style: { vi: 'Techno Anh, thô và funky', en: 'UK techno, raw and funky' },
      note: {
        vi: 'Bài nằm trong "Red 2" (1994), một phần của loạt EP "Red" mà Dave Clarke làm sau khi lập label Magnetic North; một EP trong loạt này được DJ Mag đưa vào danh sách "All Time Techno Top 100" (Wikipedia). Nghe tiếng trống khô, vòng synth lặp và độ "bẩn" có chủ đích: techno Anh giữa thập niên 1990 nghe gắt hơn Detroit.',
        en: 'It sits on "Red 2" (1994), part of the "Red" EP series Dave Clarke made after starting his Magnetic North label; one of the series made DJ Mag\'s "All Time Techno Top 100" (Wikipedia). Listen for the dry drums, the looping synth and the deliberate grit: mid-1990s UK techno sounds harsher than Detroit.',
      },
    },
    {
      youtube: 'l_RfediFJFQ', artist: 'Green Velvet', title: 'Flash', year: 1995, channel: 'Green Velvet',
      style: { vi: 'Techno Chicago, acid và giọng nói', en: 'Chicago techno, acid and spoken word' },
      note: {
        vi: 'Curtis Jones phát hành "Flash" năm 1995 dưới tên Green Velvet, và bài lên số 1 bảng Dance Club Songs của Billboard (Wikipedia). Giọng nói đều đều kể chuyện một đêm club, bên dưới là đường acid và kick không nghỉ. Nghe để thấy techno có thể hài hước và kể chuyện mà vẫn đủ lực cho giờ cao điểm.',
        en: 'Curtis Jones released "Flash" in 1995 as Green Velvet, and it reached No. 1 on Billboard\'s Dance Club Songs chart (Wikipedia). A deadpan spoken voice tells the story of a club night over an acid line and a kick that never stops. Listen to hear techno be funny and tell a story while keeping peak-time weight.',
      },
    },
    {
      youtube: '4p_WxAA-OcQ', artist: 'Laurent Garnier', title: 'The Man With The Red Face', year: 2000, channel: 'fcommunications', label: 'F Communications',
      style: { vi: 'Techno Pháp, có saxophone', en: 'French techno with saxophone' },
      note: {
        vi: 'Laurent Garnier phát hành bài năm 2000 trên F Communications; bài lên hạng 65 bảng đĩa đơn Anh, và bản kép với "Greed" lên hạng 36 (Wikipedia). Điều làm nó khác mọi bài trong danh sách là tiếng saxophone: một đoạn solo như jazz trên nền techno dày dần. Nghe cách nhạc cụ sống và máy móc nói chuyện với nhau trong chín phút.',
        en: 'Laurent Garnier released it in 2000 on F Communications; it reached No. 65 in the UK, and the double A-side with "Greed" No. 36 (Wikipedia). What sets it apart from everything here is the saxophone: a jazz-like solo over techno that keeps thickening. Listen to a live instrument and the machines talk to each other for nine minutes.',
      },
    },
    {
      youtube: 'Ec-Tw50k8Oc', artist: 'Pan-Pot', title: 'Confronted', year: 2009, channel: 'Pan-Pot', label: 'Mobilee',
      style: { vi: 'Techno Berlin, hypnotic', en: 'Berlin techno, hypnotic' },
      note: {
        vi: 'Bộ đôi Berlin Pan-Pot gặp nhau năm 2003 ở SAE Institute và ra mắt trên Mobilee, label của Anja Schneider; "Confronted" ra năm 2009 cùng một EP remix (Wikipedia). Đây là techno hypnotic gần mười phút: bassline cuộn, vài tiếng synth thoáng qua, gần như không có điểm dừng. Bài hợp để nghe cách một set giữ người ta nhảy hàng giờ.',
        en: 'Berlin duo Pan-Pot met in 2003 at the SAE Institute and debuted on Anja Schneider\'s Mobilee; "Confronted" came out in 2009, with a remix EP (Wikipedia). It is close to ten minutes of hypnotic techno: a rolling bassline, a few passing synths and almost no stops. A good track for hearing how a set keeps people dancing for hours.',
      },
    },
    {
      youtube: 'PuriyWZt9uM', artist: 'Paula Temple', title: 'Colonized', year: 2013, channel: 'R&S Records', label: 'R&S Records',
      style: { vi: 'Industrial techno', en: 'Industrial techno' },
      note: {
        vi: 'Paula Temple sống ở Berlin từ 2012 và trở lại biểu diễn; năm 2013 cô phát hành "Colonized" trên R&S Records, rồi EP "Deathvox" năm 2014 (Wikipedia). Bài là một khối âm thanh công nghiệp: kick nặng, tiếng kim loại rít và nhịp không khoan nhượng. Nghe để hiểu nguồn gốc của làn sóng hard techno và industrial những năm sau đó.',
        en: 'Paula Temple has lived in Berlin since 2012 and returned to playing live; in 2013 she released "Colonized" on R&S Records, then the "Deathvox" EP in 2014 (Wikipedia). The track is a block of industrial sound: heavy kicks, screeching metal and a relentless pulse. Listen to hear where the hard and industrial techno wave of the following years came from.',
      },
    },
    {
      youtube: 'aU6z-pPEmY0', artist: 'Adam Beyer & Bart Skils', title: 'Your Mind', year: 2018, channel: 'drumcodeofficial', label: 'Drumcode',
      style: { vi: 'Peak time techno', en: 'Peak-time techno' },
      note: {
        vi: '"Your Mind" của Adam Beyer và Bart Skils ra năm 2018 trên Drumcode, label của Beyer (Wikipedia), và đã có thêm bản remix của HNTR cũng trên Drumcode. Đây là techno sân khấu lớn: một câu vocal lặp, đoạn build dài và cú thả cho cả festival. Nghe để hiểu vì sao Drumcode thống trị các sân khấu techno chính cuối thập niên 2010.',
        en: 'Adam Beyer and Bart Skils released "Your Mind" in 2018 on Beyer\'s Drumcode (Wikipedia), and it has since had an HNTR remix, also on Drumcode. This is big-stage techno: one looping vocal line, a long build and a drop made for a festival. Listen to hear why Drumcode ruled techno main stages in the late 2010s.',
      },
    },
    {
      youtube: 'xjCb4CB-hdw', artist: 'I Hate Models', title: 'Daydream', channel: 'HATE', label: 'ARTS (ARTS020)',
      style: { vi: 'Hard techno, rave cảm xúc', en: 'Hard techno, emotional rave' },
      note: {
        vi: 'I Hate Models là nghệ sĩ Pháp Guillaume Labadie, bắt đầu từ năm 2015 với "Persephone" và ra EP "Spreading Plague" trên Perc Trax cuối năm 2018 (Wikipedia). "Daydream" ra trên label ARTS. Bài pha kick cứng của hard techno với giai điệu buồn kiểu rave thập niên 1990. Nghe phần breakdown: đây là kiểu cảm xúc đã kéo nhiều người trẻ đến với techno tối.',
        en: 'I Hate Models is French artist Guillaume Labadie, who started in 2015 with "Persephone" and released the "Spreading Plague" EP on Perc Trax at the end of 2018 (Wikipedia). "Daydream" came out on ARTS. It mixes hard techno\'s stiff kick with a melancholy, 1990s-rave melody. Listen to the breakdown: this is the feeling that drew many young ravers to dark techno.',
      },
    },
    {
      youtube: 'YPuGEJ5fiew', artist: 'Amelie Lens', title: 'Feel It', year: 2023, channel: 'Amelie Lens', label: 'EXHALE',
      style: { vi: 'Techno nhanh, acid', en: 'Fast techno, acid' },
      note: {
        vi: 'Amelie Lens, DJ người Bỉ sinh năm 1990, điều hành hai label EXHALE và Lenske; Mixmag đưa tin cô lập Lenske năm 2018. "Feel It" ra năm 2023 trên EXHALE (Wikipedia). Bài nhanh, gọn, với vocal ngắn và đường acid xoáy lên. Nghe để hiểu thứ techno nhanh và thẳng đã đưa thế hệ DJ Bỉ lên các sân khấu lớn nhất.',
        en: 'Belgian DJ Amelie Lens, born in 1990, runs two labels, EXHALE and Lenske; Mixmag reported Lenske\'s launch in 2018. "Feel It" came out in 2023 on EXHALE (Wikipedia). It is fast and lean, with a short vocal and a spiralling acid line. Listen to hear the quick, direct techno that took the Belgian generation of DJs to the biggest stages.',
      },
    },
    {
      youtube: 'u1v-TN6j0Rk', artist: 'Charlotte de Witte', title: 'Overdrive', year: 2023, channel: 'Charlotte de Witte', label: 'KNTXT (KNTXT021)',
      style: { vi: 'Acid techno', en: 'Acid techno' },
      note: {
        vi: 'Charlotte de Witte lập label KNTXT năm 2019; DJ Mag đưa tin EP "Overdrive" tháng 5/2023, và album đầu tay mang tên cô ra trên KNTXT tháng 11/2025 (Wikipedia). "Overdrive" là acid techno tối giản: kick, một đường acid và khoảng lặng đúng lúc. Nghe để hiểu chất "tối và tối giản" làm nên tên tuổi của cô.',
        en: 'Charlotte de Witte launched KNTXT in 2019; DJ Mag reported the "Overdrive" EP in May 2023, and her self-titled debut album came out on KNTXT in November 2025 (Wikipedia). "Overdrive" is stripped-back acid techno: a kick, one acid line and silences in the right place. Listen to hear the dark, minimal sound that made her name.',
      },
    },
  ],
  method: {
    vi: 'Chúng tôi chọn 11 bài theo bốn tiêu chí: mỗi giai đoạn của techno có ít nhất một bài, từ năm 1990 đến 2023; bài được một nguồn uy tín nhắc tới (Beatportal, Wikipedia, Mixmag, DJ Mag) hoặc có thành tích trên bảng xếp hạng; không lặp năm bài đã có trong cẩm nang Techno; và bài phát từ kênh chính thức của nghệ sĩ hoặc label, đã kiểm tra qua oEmbed của YouTube. Năm và label chỉ ghi khi nguồn nói rõ; bài nào thiếu thì để trống thay vì đoán.',
    en: 'We chose 11 tracks on four rules: every era of techno has at least one, from 1990 to 2023; each is named by a reputable source (Beatportal, Wikipedia, Mixmag, DJ Mag) or has a chart record; none repeats the five tracks already in our Techno guide; and each plays from the artist\'s or label\'s official channel, checked through YouTube\'s oEmbed. Years and labels appear only where a source states them; where one is missing it is left blank rather than guessed.',
  },
  notes: {
    vi: 'Năm 2026 techno vẫn ở các sân khấu lớn nhất: kênh chính thức của Tomorrowland đăng hai set của Sara Landry ở Tomorrowland 2026, Amelie Lens và Sara Landry chơi B2B ở Ultra 2026, và Charlotte de Witte đóng sân khấu Kinetic Field ở EDC Las Vegas 2026. Hướng đi rõ nhất là hard techno nhanh và acid, nên hai bài cuối của danh sách là nơi tốt để bắt đầu nếu bạn mới nghe. Danh sách được cập nhật khi có bài mới đủ tiêu chí.',
    en: 'In 2026 techno is still on the biggest stages: Tomorrowland\'s official channel posted two Sara Landry sets from Tomorrowland 2026, Amelie Lens and Sara Landry played back to back at Ultra 2026, and Charlotte de Witte closed the Kinetic Field stage at EDC Las Vegas 2026. The clearest direction is fast, acid-tinged hard techno, so the last two tracks here are a good place to start if you are new. The list is updated when a new track meets the rules.',
  },
  related: [
    { slug: 'techno', line: { vi: 'Techno là gì? · lịch sử, nghệ sĩ và năm bài kinh điển', en: 'What is techno? · history, artists and five classics' } },
    { slug: 'xu-huong-hard-techno', line: { vi: 'Xu hướng hard techno · vì sao techno nhanh và mạnh hơn', en: 'The hard techno trend · why techno got faster and harder' } },
    { slug: 'playlist-peak-time', line: { vi: 'Playlist peak time · những bài cho giờ cao điểm', en: 'Peak-time playlist · tracks for the peak hour' } },
    { slug: 'playlist-edm', line: { vi: 'Playlist EDM · mọi playlist theo dòng nhạc', en: 'EDM playlists · every playlist by style' } },
  ],
  facts: [
    { label: { vi: 'Dòng nhạc', en: 'Style' }, value: { vi: 'Techno: peak time, hypnotic, industrial, acid', en: 'Techno: peak time, hypnotic, industrial, acid' } },
    { label: { vi: 'Số bài', en: 'Tracks' }, value: { vi: '11', en: '11' } },
    { label: { vi: 'Giai đoạn', en: 'Span' }, value: { vi: '1990–2023', en: '1990–2023' } },
    { label: { vi: 'BPM thường gặp', en: 'Typical BPM' }, value: { vi: '120–150 (hard techno 140–160)', en: '120–150 (hard techno 140–160)' } },
    { label: { vi: 'Hợp với', en: 'Best for' }, value: { vi: 'Hiểu techno qua từng thời kỳ; chuẩn bị cho một đêm club', en: 'Learning techno era by era; getting ready for a club night' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Nên bắt đầu nghe techno từ bài nào?', en: 'Which techno track should I start with?' }, a: { vi: '"Energy Flash" của Joey Beltram (1990) cho thấy techno tối giản ra sao, còn "Overdrive" của Charlotte de Witte (2023) là âm thanh của các sân khấu techno hôm nay.', en: 'Joey Beltram\'s "Energy Flash" (1990) shows how minimal techno can be, and Charlotte de Witte\'s "Overdrive" (2023) is the sound of today\'s techno stages.' } },
    { q: { vi: 'Techno có tốc độ bao nhiêu BPM?', en: 'What BPM is techno?' }, a: { vi: 'Thường 120–150 BPM; peak time khoảng 128–135, hard techno 140–160.', en: 'Usually 120–150 BPM; peak time around 128–135, hard techno 140–160.' } },
    { q: { vi: 'Nghe những bài này ở đâu?', en: 'Where can I stream these tracks?' }, a: { vi: 'Mỗi bài có trình phát YouTube từ kênh chính thức của nghệ sĩ hoặc label, chỉ tải khi bạn bấm phát; các bài cũng có trên những dịch vụ nghe nhạc lớn.', en: 'Each track has a YouTube player from the artist\'s or label\'s official channel, loading only when you press play; the tracks are also on the major streaming services.' } },
    { q: { vi: 'Hard techno khác techno thế nào?', en: 'How is hard techno different from techno?' }, a: { vi: 'Hard techno nhanh hơn (thường 140–160 BPM), kick nặng và méo hơn, như "Colonized" của Paula Temple hay "Daydream" của I Hate Models trong danh sách này.', en: 'Hard techno is faster (often 140–160 BPM) with heavier, more distorted kicks, like Paula Temple\'s "Colonized" or I Hate Models\' "Daydream" on this list.' } },
    { q: { vi: 'Danh sách này cập nhật bao lâu một lần?', en: 'How often is this list updated?' }, a: { vi: 'Khi có bài mới đủ tiêu chí; lần kiểm tra gần nhất là tháng 10/2026.', en: 'When a new track meets the rules; it was last checked in October 2026.' } },
  ],
  sources: [
    { title: 'Beatport\'s definitive guide to techno', url: 'https://www.beatportal.com/features/beatports-definitive-guide-to-techno/', publisher: 'Beatportal' },
    { title: 'Amelie Lens to launch new label Lenske', url: 'https://mixmag.net/read/amelie-lens-to-launch-new-label-lenske-news', publisher: 'Mixmag' },
    { title: 'Green Velvet', url: wiki('Green Velvet'), publisher: 'Wikipedia' },
    { title: 'Laurent Garnier', url: wiki('Laurent Garnier'), publisher: 'Wikipedia' },
    { title: 'Paula Temple', url: wiki('Paula Temple'), publisher: 'Wikipedia' },
    { title: 'Charlotte de Witte', url: wiki('Charlotte de Witte'), publisher: 'Wikipedia' },
    { title: 'Pan-Pot', url: wiki('Pan-Pot'), publisher: 'Wikipedia' },
  ],
};

export const playlistTechno = playlistPost(techno);
