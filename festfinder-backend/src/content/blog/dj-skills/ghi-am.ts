import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, DJ_MEDIA } from './media.ts';
import { figure, lesson, lessonFacts, MODULES, wiki } from './shared.ts';

const fig = (lang: 'vi' | 'en') => figure(DJ_MEDIA.mindset,
  { vi: 'Một người ngồi trên ghế sofa nghe nhạc với laptop và tai nghe', en: 'Someone on a sofa listening to music with a laptop and headphones' },
  { vi: 'Nghe lại bản ghi ở một chỗ khác chỗ chơi, sau một đêm ngủ: tai mới nghe ra lỗi', en: 'Listen back somewhere other than where you played, after a night’s sleep: fresh ears hear the mistakes' }, lang);

const vi = `**Ghi âm set** là thu lại toàn bộ bản mix bằng chức năng ghi âm của phần mềm DJ để nghe lại, tìm lỗi và chia sẻ. Nghe bản ghi của chính mình là cách tiến bộ nhanh nhất. Sau bài này bạn ghi được một bản mix sạch, tự review theo bảng kiểm và đăng lên đúng nơi để hạn chế bị gỡ vì bản quyền.

## Bạn cần chuẩn bị

- Phần mềm DJ có chức năng ghi âm (rekordbox, Serato DJ, Traktor và djay Pro đều có).
- Một set đã lên sẵn (xem [xây set DJ](${lesson('xay-set-dj', 'vi')})).
- Điện thoại và giá đỡ nếu muốn quay video để xem lại động tác.
- Tai nghe hoặc loa khác với loa bạn dùng khi chơi, để nghe lại.

## Các bước thực hiện

### Bước 1: Chỉnh mức âm trước khi ghi

- **Làm gì:** chơi đoạn mạnh nhất của set, chỉnh gain từng kênh và master sao cho đèn mức master không bao giờ chạm đỏ. Bản ghi lấy tín hiệu master: master rè thì bản ghi rè.
- **Nhìn đâu trên controller:** đèn mức master, và đồng hồ mức ghi trong phần ghi âm của phần mềm.
- **Nghe gì để biết đúng:** đoạn mạnh nhất vẫn sạch, bass chắc, không có tiếng lụp bụp hay méo.

### Bước 2: Bật ghi âm trong phần mềm

- **Làm gì:** mở phần ghi âm (Recording), chọn định dạng WAV để lưu bản gốc, đặt tên file theo ngày và tên set, bấm ghi trước khi bài đầu tiên chạy vài giây.
- **Nhìn đâu:** nút ghi âm và đồng hồ thời gian đang chạy.
- **Nghe gì để biết đúng:** chưa cần nghe; thời gian ghi tăng và đồng hồ mức nhảy theo nhạc.

### Bước 3: Chơi trọn set, không dừng lại

- **Làm gì:** chơi từ đầu tới cuối như đang diễn thật. Vấp thì xử lý tiếp, không dừng ghi để làm lại.
- **Nhìn đâu:** set của bạn, như mọi khi; quên chuyện đang ghi.
- **Nghe gì để biết đúng:** bạn cứu được những lần vấp mà nhạc không dừng: đó chính là kỹ năng bạn cần khi đi diễn.

### Bước 4: Tự review theo bảng kiểm

- **Làm gì:** nghe lại sau ít nhất một đêm, ở chỗ khác chỗ chơi. Ghi thời điểm (phút:giây) của mỗi lỗi theo bảng kiểm bên dưới. Nếu có quay video, xem bạn nhìn màn hình bao nhiêu và có nhìn đám đông không.
- **Nhìn đâu:** một tờ giấy chia cột theo bảng kiểm.
- **Nghe gì để biết đúng:** bạn tìm ra ba lỗi lặp lại nhiều nhất, không chỉ một danh sách dài lỗi lẻ tẻ.

### Bước 5: Xuất file và đăng

- **Làm gì:** cắt khoảng lặng đầu và cuối, giữ bản WAV làm bản lưu, xuất thêm MP3 320 kbps để đăng. Đặt tên rõ ràng, thêm danh sách bài (tracklist) và ảnh bìa.
- **Nhìn đâu:** phần xuất file của phần mềm chỉnh âm thanh hoặc của nền tảng bạn đăng.
- **Nghe gì để biết đúng:** nghe thử vài đoạn của file đã xuất trên điện thoại: âm lượng ổn định, không bị cắt cụt.

${fig('vi')}

## Bảng kiểm khi nghe lại

| Nghe gì | Dấu hiệu lỗi | Bài cần đọc lại |
| --- | --- | --- |
| Phách | Tiếng "thịch-thịch" như ngựa phi khi chồng bài | [Beatmatch bằng tai](${lesson('beatmatch-bang-tai', 'vi')}) |
| Bass | Ù, đục khi hai bài chồng nhau | [EQ mixing](${lesson('eq-mixing', 'vi')}) |
| Câu nhạc | Breakdown chen vào giữa drop | [Phrasing](${lesson('phrasing-dj', 'vi')}) |
| Âm lượng | Bài sau to hoặc nhỏ hẳn bài trước | [Controller DJ](${lesson('controller-dj', 'vi')}), phần gain |
| Năng lượng | Một đoạn dài phẳng hoặc tụt đột ngột | [Xây set](${lesson('xay-set-dj', 'vi')}) |

## Đăng mix ở đâu

| Nền tảng | Hợp với | Cần biết |
| --- | --- | --- |
| Mixcloud | Mix dài, chương trình radio | Được làm cho DJ mix, có thoả thuận bản quyền với các tổ chức quản lý ở nhiều nước; cần tracklist |
| SoundCloud | Khám phá, chia sẻ nhanh, bản edit của chính bạn | Hệ thống nhận diện nội dung có thể gỡ mix chứa bài của người khác |
| YouTube | Video set có hình | Content ID cho phép chủ sở hữu chặn, tắt tiếng hoặc kiếm tiền từ video có bài của họ |
| Instagram, TikTok | Đoạn ngắn 15–60 giây | Đoạn ngắn có hình bạn chơi giúp người ta nhớ mặt; quy định nhạc vẫn áp dụng |

Một bản mix dùng bài của người khác là dùng tác phẩm có bản quyền. Hãy đọc điều khoản của từng nền tảng trước khi đăng. Ở Việt Nam, quyền biểu diễn nhạc ở nơi công cộng do các tổ chức như VCPMC quản lý; với bản mix đăng mạng, nền tảng có thoả thuận bản quyền giúp bạn yên tâm hơn.

## Dấu hiệu bạn làm đúng

- Bản ghi sạch từ đầu tới cuối, không có đoạn rè.
- Bạn tìm ra ba lỗi chính và tuần sau sửa đúng ba lỗi đó.
- Mix bạn đăng có tên rõ, tracklist đủ và ảnh bìa riêng.

## Lỗi thường gặp và cách sửa

| Lỗi | Nghe hoặc nhìn ra sao | Cách sửa |
| --- | --- | --- |
| Master chạm đỏ khi ghi | Bản ghi méo ở đoạn mạnh | Giảm gain các kênh trước khi ghi |
| Dừng ghi mỗi lần vấp | Có hàng chục file dở dang | Chơi tiếp, review sau |
| Nghe lại ngay sau khi chơi | Tai đã quen, không nghe ra lỗi | Nghe lại sau một đêm ngủ |
| Đăng mà không có tracklist | Người nghe không tìm được bài, nền tảng khó báo cáo bản quyền | Ghi tracklist có thời điểm |
| Đăng bản tập đầu tiên | Bản mix chưa đại diện cho bạn | Đăng bản đã review và chơi lại tốt hơn |

## Do & Don't

- ✅ Ghi âm mọi buổi tập, kể cả khi chỉ để mình nghe.
- ✅ Lưu bản WAV gốc, đăng bản MP3 320 kbps.
- ✅ Ghi tên các bài và nghệ sĩ trong tracklist.
- ❌ Đánh giá bản thân qua một bản mix đầu tiên.
- ❌ Đăng mix chứa nhiều bài của các hãng lớn lên nền tảng không có thoả thuận bản quyền rồi bất ngờ khi bị gỡ.
- ❌ Chép set của DJ khác rồi đăng như của mình.

## Động tác thừa cần tránh

- **Sửa từng lỗi nhỏ của bản ghi trong phần mềm chỉnh âm thanh:** bản mix là ảnh chụp một buổi chơi. Sửa ở buổi tập sau, không sửa trên file.
- **Ghi lại hai mươi lần để có bản hoàn hảo:** mỗi lần ghi lại, tai mệt hơn và bạn chơi cứng hơn. Ghi một lần, review, tuần sau ghi bản mới.
- **Đăng mọi buổi tập:** người nghe chỉ cần bản tốt nhất của bạn. Đăng ít mà chất lượng.

## Bài tập 20 phút

1. Ghi âm một mix 15 phút, bốn bài, không dừng.
2. Ngày hôm sau, nghe lại với bảng kiểm, ghi thời điểm của mỗi lỗi.
3. Chọn ba lỗi lặp lại nhiều nhất.
4. Tập riêng ba lần chuyển bài có lỗi đó.
5. Ghi bản mới, so với bản cũ.

## Bài tiếp theo

Bản ghi tốt bắt đầu từ file nhạc tốt: [file nhạc DJ: MP3, WAV, AIFF, FLAC, ALAC và thư viện](${lesson('file-nhac-dj', 'vi')}). Để biết mua nhạc ở đâu cho đúng, đọc [mua nhạc DJ](${lesson('mua-nhac-dj', 'vi')}). Cả lộ trình ở [Học DJ từ số 0](${lesson('hoc-dj-tu-so-0', 'vi')}).`;

const en = `**Recording a set** means capturing the whole mix with your DJ software's recorder so you can listen back, find mistakes and share it. Hearing your own recordings is the fastest way to improve. After this lesson you can record a clean mix, review it with a checklist and post it where takedowns are less likely.

## What you need

- DJ software with a recorder (rekordbox, Serato DJ, Traktor and djay Pro all have one).
- A set you have planned (see [building a DJ set](${lesson('xay-set-dj', 'en')})).
- A phone and a stand if you want to film yourself and watch your movements.
- Headphones or speakers other than the ones you play on, for listening back.

## Step by step

### Step 1: Set your levels before you record

- **Do:** play the loudest part of the set and adjust each channel's gain and the master so the master meter never reaches red. The recording takes the master signal: if the master distorts, so does the recording.
- **Look at:** the master meter, and the recording level meter in the software's recorder.
- **Listen for:** the loudest section still sounds clean, with a firm bass and no crackle or distortion.

### Step 2: Start the recorder in the software

- **Do:** open the recorder, choose WAV to keep an original, name the file after the date and the set, and press record a few seconds before the first track starts.
- **Look at:** the record button and the running time.
- **Listen for:** nothing yet; the recording time climbs and the level meter moves with the music.

### Step 3: Play the whole set without stopping

- **Do:** play from start to finish as if it were a real gig. When you stumble, recover and carry on; never stop the recording to start again.
- **Look at:** your set, as always; forget that you are recording.
- **Listen for:** you rescue your stumbles without the music stopping, which is exactly the skill you need at a gig.

### Step 4: Review with a checklist

- **Do:** listen back after at least one night, somewhere other than where you played. Note the time (minutes:seconds) of every mistake using the checklist below. If you filmed yourself, watch how often you look at the screen and whether you look at the crowd.
- **Look at:** a sheet of paper with a column for each item on the checklist.
- **Listen for:** you find the three mistakes that repeat most, not just a long list of one-offs.

### Step 5: Export and post

- **Do:** trim the silence at the start and end, keep the WAV as your archive and export an MP3 at 320 kbps to post. Give it a clear name, add a tracklist and a cover image.
- **Look at:** the export options of your audio editor or of the platform you post to.
- **Listen for:** play a few parts of the exported file on your phone: steady loudness, nothing cut off.

${fig('en')}

## The listening checklist

| Listen for | Sign of a mistake | Lesson to revisit |
| --- | --- | --- |
| The beat | A "galloping" double kick while tracks overlap | [Beatmatching by ear](${lesson('beatmatch-bang-tai', 'en')}) |
| The bass | Boom and mud when two tracks overlap | [EQ mixing](${lesson('eq-mixing', 'en')}) |
| The phrase | A breakdown cutting into the middle of a drop | [Phrasing](${lesson('phrasing-dj', 'en')}) |
| The volume | The next track is clearly louder or quieter | [DJ controller](${lesson('controller-dj', 'en')}), the gain section |
| The energy | A long flat stretch or a sudden sag | [Building a set](${lesson('xay-set-dj', 'en')}) |

## Where to post a mix

| Platform | Suits | Good to know |
| --- | --- | --- |
| Mixcloud | Long mixes, radio shows | Built for DJ mixes, with licensing agreements with collecting societies in many countries; it asks for a tracklist |
| SoundCloud | Discovery, quick sharing, your own edits | Its content identification can take down mixes that contain other people's tracks |
| YouTube | Filmed sets | Content ID lets owners block, mute or earn from videos that use their music |
| Instagram, TikTok | Short clips of 15–60 seconds | A short clip of you playing helps people remember your face; music rules still apply |

A mix made of other people's tracks uses copyrighted works. Read each platform's terms before you post. In Vietnam, the right to perform music in public places is managed by organisations such as VCPMC; for mixes posted online, a platform with licensing agreements gives you more peace of mind.

## Signs you got it right

- The recording is clean from start to finish, with no distorted passages.
- You find three main mistakes and spend the next week fixing exactly those.
- The mix you post has a clear name, a full tracklist and its own cover.

## Common mistakes and fixes

| Mistake | What you hear or see | Fix |
| --- | --- | --- |
| The master hits red while recording | The recording distorts in the loud parts | Lower the channel gains before you record |
| Stopping every time you stumble | Dozens of unfinished files | Keep playing and review later |
| Listening back straight after playing | Your ears are used to it and miss mistakes | Listen after a night's sleep |
| Posting without a tracklist | Listeners cannot find the tracks and platforms struggle to report rights | Add a tracklist with timestamps |
| Posting your very first practice take | The mix does not represent you yet | Post a reviewed, better-played version |

## Dos and don'ts

- ✅ Record every practice session, even if only you will hear it.
- ✅ Keep the original WAV and post a 320 kbps MP3.
- ✅ Name every track and artist in the tracklist.
- ❌ Judge yourself by your first mix.
- ❌ Post mixes full of major-label tracks on a platform without licensing agreements and then be surprised when they come down.
- ❌ Copy another DJ's set and post it as your own.

## Wasted moves to drop

- **Fixing every small mistake in an audio editor:** a mix is a snapshot of one session. Fix it in your next practice, not in the file.
- **Re-recording twenty times for the perfect take:** each retake tires your ears and stiffens your playing. Record once, review, and record a new one next week.
- **Posting every practice session:** listeners only need your best. Post less, post better.

## A 20-minute drill

1. Record a 15-minute, four-track mix without stopping.
2. The next day, listen back with the checklist and note the time of every mistake.
3. Pick the three mistakes that repeat most.
4. Practise the three transitions where they happened.
5. Record a new version and compare it with the old one.

## Next lesson

A good recording starts with good files: [DJ file formats: MP3, WAV, AIFF, FLAC, ALAC and your library](${lesson('file-nhac-dj', 'en')}). To know where to buy music the right way, read [buying music as a DJ](${lesson('mua-nhac-dj', 'en')}). The whole path is at [Learn to DJ from zero](${lesson('hoc-dj-tu-so-0', 'en')}).`;

export const ghiAm: PackPost = {
  key: 'dj-skills/ghi-am',
  slug: 'ghi-am-dang-mix',
  category: 'dj',
  lang: 'vi',
  title: {
    vi: 'Ghi âm set DJ, tự review và đăng mix đúng cách',
    en: 'Record a DJ set, review it and post the mix the right way',
  },
  excerpt: {
    vi: 'Cách ghi âm set DJ bằng phần mềm, tự review với bảng kiểm năm mục, xuất WAV và MP3 320 kbps, và đăng mix lên Mixcloud, SoundCloud, YouTube mà hạn chế bị gỡ.',
    en: 'How to record a DJ set, review it with a five-point checklist, export WAV and 320 kbps MP3, and post on Mixcloud, SoundCloud or YouTube with fewer takedowns.',
  },
  cover: coverOf(DJ_MEDIA.record),
  styles: [],
  facts: lessonFacts({
    module: MODULES.sets, minutes: '30',
    gear: { vi: 'Phần mềm DJ có ghi âm, một set đã lên, tai nghe hoặc loa khác', en: 'DJ software with a recorder, a planned set, other headphones or speakers' },
    first: { vi: 'Xây set DJ 30–60 phút', en: 'Building a 30–60 minute set' },
    after: { vi: 'Ghi âm sạch, tự review và đăng mix có tracklist', en: 'Record cleanly, review yourself and post with a tracklist' },
  }),
  body: { vi, en },
  faq: [
    { q: { vi: 'Ghi âm set DJ bằng cách nào?', en: 'How do I record a DJ set?' }, a: { vi: 'Cách đơn giản nhất là dùng chức năng ghi âm có sẵn trong phần mềm DJ như rekordbox, Serato DJ, Traktor hay djay Pro. Chỉnh mức âm để master không chạm đỏ, chọn định dạng WAV, bấm ghi rồi chơi trọn set không dừng.', en: 'The simplest way is the recorder built into DJ software such as rekordbox, Serato DJ, Traktor or djay Pro. Set your levels so the master never reaches red, choose WAV, press record and play the whole set without stopping.' } },
    { q: { vi: 'Đăng mix lên SoundCloud có bị gỡ không?', en: 'Will my mix be taken down on SoundCloud?' }, a: { vi: 'Có thể. SoundCloud dùng hệ thống nhận diện nội dung, và mix chứa bài của người khác có thể bị gỡ hoặc chặn nếu chủ sở hữu yêu cầu. Mixcloud được làm cho DJ mix và có thoả thuận bản quyền ở nhiều nước, nên thường phù hợp hơn cho mix dài.', en: 'It can be. SoundCloud uses content identification, and mixes containing other people’s tracks may be removed or blocked if the owners ask. Mixcloud was built for DJ mixes and has licensing agreements in many countries, so it usually suits long mixes better.' } },
    { q: { vi: 'Nên lưu bản ghi ở định dạng nào?', en: 'Which format should I record in?' }, a: { vi: 'Ghi và lưu bản gốc ở WAV để giữ chất lượng đầy đủ. Khi đăng, xuất thêm bản MP3 320 kbps, nhẹ hơn nhiều mà vẫn nghe tốt trên mọi nền tảng. Giữ bản WAV để sau này cắt clip ngắn hay làm lại ảnh bìa.', en: 'Record and keep the original as WAV for full quality. To post, export an MP3 at 320 kbps, which is far smaller and still sounds good on every platform. Keep the WAV for cutting short clips or reworking the release later.' } },
    { q: { vi: 'Tự review bản mix thế nào cho hiệu quả?', en: 'How do I review my own mix well?' }, a: { vi: 'Nghe lại sau ít nhất một đêm, ở chỗ khác chỗ chơi, với bảng kiểm năm mục: phách, bass, câu nhạc, âm lượng, năng lượng. Ghi thời điểm từng lỗi, chọn ba lỗi lặp lại nhiều nhất và tuần sau chỉ tập sửa ba lỗi đó.', en: 'Listen back after at least one night, somewhere other than where you played, with a five-point checklist: beat, bass, phrase, volume, energy. Note the time of each mistake, pick the three that repeat most and spend the next week fixing only those.' } },
    { q: { vi: 'Có nên quay video khi tập DJ không?', en: 'Should I film myself practising?' }, a: { vi: 'Nên, thỉnh thoảng. Video cho thấy những điều bản ghi âm không cho thấy: bạn nhìn màn hình bao nhiêu, có nhìn đám đông không, động tác có thừa không. Đoạn ngắn đẹp nhất còn dùng được làm nội dung giới thiệu bản thân.', en: 'Yes, now and then. Video shows what audio cannot: how much you stare at the screen, whether you look at the crowd, whether you make wasted moves. The best short clips also work as content that introduces you.' } },
  ],
  sources: [
    { title: 'Mixcloud', url: 'https://www.mixcloud.com/', publisher: 'Mixcloud' },
    { title: 'SoundCloud', url: 'https://soundcloud.com/', publisher: 'SoundCloud' },
    { title: 'How Content ID works', url: 'https://support.google.com/youtube/answer/2797370', publisher: 'YouTube Help' },
    { title: 'DJ mix', url: wiki('DJ mix'), publisher: 'Wikipedia' },
    { title: 'VCPMC', url: 'https://www.vcpmc.org/', publisher: 'Trung tâm Bảo vệ Quyền tác giả Âm nhạc Việt Nam' },
  ],
  tracks: [],
};
