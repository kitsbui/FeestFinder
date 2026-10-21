import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, DJ_MEDIA } from './media.ts';
import { figure, lesson, lessonFacts, MODULES, wiki } from './shared.ts';

const fig = (lang: 'vi' | 'en') => figure(DJ_MEDIA.controller,
  { vi: 'Controller Pioneer DDJ-RX và laptop đang mở thư viện rekordbox', en: 'A Pioneer DDJ-RX controller and a laptop showing a rekordbox library' },
  { vi: 'Thư viện có tag đủ BPM, key và năng lượng: tìm được bài kế tiếp trong vài giây', en: 'A library tagged with BPM, key and energy: the next track is seconds away' }, lang);

const vi = `**File nhạc DJ** thường ở năm định dạng: MP3 (nén có mất dữ liệu), WAV và AIFF (không nén), FLAC và ALAC (nén không mất dữ liệu). MP3 320 kbps đủ cho tập luyện và phần lớn gig nhỏ; lossless đáng giá khi có dàn âm thanh tốt hoặc khi bạn lưu trữ lâu dài. Sau bài này bạn chọn đúng định dạng và xếp thư viện để tìm bài trong vài giây.

## So sánh các định dạng

| Định dạng | Lossless? | Dung lượng mỗi phút (stereo) | Giữ tag (tên, ảnh bìa) | Dùng khi nào |
| --- | --- | --- | --- | --- |
| MP3 320 kbps | Không | Khoảng 2,4 MB | Tốt | Tập luyện, gig nhỏ, đủ cho phần lớn trường hợp |
| WAV | Có, không nén | Khoảng 10 MB (chất lượng CD) | Kém ổn định giữa các phần mềm | Bản master, chất lượng cao nhất |
| AIFF | Có, không nén | Khoảng 10 MB | Tốt hơn WAV | Như WAV nhưng giữ tag tốt, hợp hệ Apple |
| FLAC | Có, nén gọn | Thường khoảng một nửa đến hai phần ba WAV | Tốt | Lossless gọn nhẹ, phổ biến hiện nay |
| ALAC | Có, nén gọn | Tương tự FLAC | Tốt | Lossless cho hệ Apple |

Một lưu ý thực tế: một số đầu CDJ đời cũ không đọc được FLAC hoặc ALAC. Trước khi chơi ở club, hỏi đầu phát là đời nào, hoặc mang thêm bản AIFF hay MP3 320 kbps cho những bài quan trọng.

## Bitrate và sample rate, nói đơn giản

- **Bitrate** là lượng dữ liệu cho mỗi giây nhạc. Chất lượng CD (44,1 kHz, 16-bit, stereo) là 1.411 kbps; MP3 320 kbps là mức cao nhất của MP3 thông thường.
- **Sample rate** là số lần lấy mẫu mỗi giây. 44,1 kHz hay 48 kHz là đủ cho mọi dàn âm thanh club; file 96 kHz nặng hơn nhiều mà không nghe khác biệt trong club, và một số đầu phát đời cũ không đọc được.
- **Đổi MP3 sang WAV không làm hay hơn:** phần dữ liệu đã mất khi nén MP3 không quay lại. File chỉ to ra.
- **File bitrate thấp** (128 kbps, hay bài tải từ video) nghe rè và tối ở phần cao khi lên loa lớn; phổ tần thường bị cắt từ khoảng 16–17 kHz.

## Bạn cần chuẩn bị

- Phần mềm DJ với thư viện của bạn.
- Một ổ cứng ngoài hoặc dịch vụ lưu trữ để sao lưu.
- 20–30 bài bạn đang dùng để bắt đầu sắp xếp.

## Các bước thực hiện

### Bước 1: Chọn định dạng theo mục đích

- **Làm gì:** bài bạn chắc chắn giữ lâu: mua WAV, AIFF hoặc FLAC. Bài để thử: MP3 320 kbps là đủ. Không dùng file dưới 320 kbps cho gig.
- **Nhìn đâu trên controller:** cột Bitrate và Định dạng (Format) trong thư viện; bật hiện cột nếu chưa có.
- **Nghe gì để biết đúng:** trên loa tốt, hi-hat và cymbal sáng, rõ, không có tiếng "xì" hay lạo xạo.

### Bước 2: Đặt tên và thư mục nhất quán

- **Làm gì:** đặt tên file theo mẫu "Nghệ sĩ - Tên bài (Bản mix)". Để nhạc trong một thư mục gốc, chia nhánh theo năm mua hoặc dòng nhạc. Đừng di chuyển file sau khi đã nạp vào phần mềm.
- **Nhìn đâu:** trình quản lý file của laptop.
- **Nghe gì để biết đúng:** chưa cần nghe; phần mềm không báo file bị thiếu (missing).

### Bước 3: Nạp và phân tích

- **Làm gì:** nạp bài vào phần mềm, chạy phân tích BPM, key, beatgrid và waveform. Kiểm tra nhanh beatgrid của từng bài mới (xem [BPM](${lesson('bpm-la-gi', 'vi')})).
- **Nhìn đâu:** cột BPM, Key và waveform của từng bài.
- **Nghe gì để biết đúng:** tiếng click beatgrid rơi đúng kick; key hiện theo ký hiệu Camelot (xem [harmonic mixing](${lesson('harmonic-mixing', 'vi')})).

### Bước 4: Gắn tag ngay khi nạp bài

- **Làm gì:** gắn dòng nhạc, năng lượng 1–10, có vocal hay không, và vai trò (mở, lên, cao trào, kết). Đặt hot cue ở phách 1 luôn lúc này.
- **Nhìn đâu:** ô Comment, Genre, My Tag hoặc màu và đánh giá sao, tuỳ phần mềm.
- **Nghe gì để biết đúng:** nghe intro, breakdown và drop của bài để chấm năng lượng theo cảm nhận của bạn, không theo bảng xếp hạng.

${fig('vi')}

### Bước 5: Playlist, crate và sao lưu

- **Làm gì:** dùng **playlist** cho một set có thứ tự, **crate** hoặc smart playlist cho các nhóm bài theo dòng nhạc, năng lượng, key. Sao lưu toàn bộ nhạc và thư viện ra hai nơi khác nhau mỗi tuần; với CDJ, xuất playlist ra USB bằng rekordbox.
- **Nhìn đâu:** cây thư mục playlist bên trái màn hình thư viện.
- **Nghe gì để biết đúng:** bạn tìm được ba bài hợp với bài đang chạy trong chưa tới 30 giây.

## Dấu hiệu bạn làm đúng

- Không có bài nào dưới 320 kbps trong playlist đi diễn.
- Mỗi bài có BPM, key, năng lượng và một hot cue ở phách 1.
- Bạn có ít nhất hai bản sao lưu ở hai nơi.

## Lỗi thường gặp và cách sửa

| Lỗi | Nghe hoặc nhìn ra sao | Cách sửa |
| --- | --- | --- |
| Tag của file WAV mất khi đổi phần mềm | Bài không còn tên, ảnh bìa | Dùng AIFF hoặc FLAC cho bài cần giữ tag |
| Đổi MP3 sang WAV cho "hay hơn" | File to gấp bốn, tiếng như cũ | Mua lại bản lossless nếu cần |
| Dùng bài tải từ video | Phần cao rè, tối trên loa lớn | Mua bản chính thức từ cửa hàng |
| Di chuyển thư mục nhạc | Phần mềm báo file bị thiếu | Để nhạc ở một chỗ cố định, dùng chức năng tìm lại file |
| Không sao lưu | Mất ổ là mất hết thư viện | Hai bản sao ở hai nơi, cập nhật hàng tuần |

## Do & Don't

- ✅ Gắn tag BPM, key, dòng nhạc và năng lượng ngay khi nạp bài.
- ✅ Mua bản lossless cho những bài bạn chơi nhiều.
- ✅ Mang một USB dự phòng khi đi diễn.
- ❌ Gom hàng nghìn bài mà không nghe hết.
- ❌ Dùng file 128 kbps cho gig.
- ❌ Đổi tên, di chuyển file bên ngoài phần mềm sau khi đã nạp.

## Động tác thừa cần tránh

- **Gắn tag lại cả thư viện trong một đêm:** mệt và qua loa. Gắn tag từng bài ngay khi nạp, mỗi lần vài bài.
- **Tải mọi bài "có thể sẽ chơi":** thư viện phình ra, tìm bài lâu hơn. Chỉ giữ bài bạn đã nghe trọn và thích.
- **Tự đổi tên file bằng tay:** phần mềm đọc tag; hãy sửa tag trong phần mềm.

## Tư tưởng cũ cần bỏ: "phải thuộc một nghìn bài mới làm DJ"

Chất lượng hơn số lượng: hiểu kỹ 50 bài (intro dài bao nhiêu, breakdown ở đâu, hợp với bài nào) có ích hơn biết tên 1.000 bài. Một thư viện sâu, tag kỹ giúp bạn chơi tự tin hơn một ổ cứng đầy nhạc chưa nghe.

## Bài tập 20 phút

1. Bật cột Bitrate và Định dạng, tìm mọi bài dưới 320 kbps.
2. Chọn 10 bài bạn hay chơi, gắn dòng nhạc, năng lượng và vai trò.
3. Đặt hot cue ở phách 1 cho cả 10 bài.
4. Tạo một crate theo năng lượng 7–9 và một playlist cho set 30 phút.
5. Sao lưu thư viện ra ổ ngoài.

## Bài tiếp theo

Biết định dạng rồi, giờ mua nhạc đúng chỗ: [mua nhạc DJ ở đâu: Beatport, Bandcamp và cửa hàng Việt](${lesson('mua-nhac-dj', 'vi')}). Để dùng thư viện vào một set, đọc [xây set DJ](${lesson('xay-set-dj', 'vi')}). Cả lộ trình ở [Học DJ từ số 0](${lesson('hoc-dj-tu-so-0', 'vi')}).`;

const en = `**DJ music files** usually come in five formats: MP3 (lossy compression), WAV and AIFF (uncompressed), FLAC and ALAC (lossless compression). A 320 kbps MP3 is enough for practice and most small gigs; lossless pays off on a good sound system or for archiving. After this lesson you can choose the right format and organise a library that finds tracks fast.

## The formats compared

| Format | Lossless? | Size per minute (stereo) | Keeps tags (names, artwork) | When to use it |
| --- | --- | --- | --- | --- |
| MP3 320 kbps | No | About 2.4 MB | Well | Practice, small gigs, enough most of the time |
| WAV | Yes, uncompressed | About 10 MB (CD quality) | Unreliably across software | Masters, the highest quality |
| AIFF | Yes, uncompressed | About 10 MB | Better than WAV | Like WAV but keeps tags well, suits Apple systems |
| FLAC | Yes, compressed | Usually about half to two-thirds of WAV | Well | Compact lossless, widely used today |
| ALAC | Yes, compressed | Similar to FLAC | Well | Lossless for Apple systems |

One practical note: some older CDJs cannot read FLAC or ALAC. Before a club gig, ask which players they have, or bring AIFF or 320 kbps MP3 copies of your key tracks.

## Bitrate and sample rate in plain words

- **Bitrate** is the amount of data for each second of music. CD quality (44.1 kHz, 16-bit, stereo) is 1,411 kbps; 320 kbps is the highest standard MP3 bitrate.
- **Sample rate** is the number of samples per second. 44.1 kHz or 48 kHz is enough for any club system; 96 kHz files are much bigger with no audible difference in a club, and some older players cannot read them.
- **Converting an MP3 to WAV does not improve it:** what MP3 compression threw away never comes back. The file just gets bigger.
- **Low-bitrate files** (128 kbps, or tracks ripped from videos) sound harsh and dull at the top on big speakers; their spectrum is usually cut off from around 16–17 kHz.

## What you need

- Your DJ software and its library.
- An external drive or a storage service for backups.
- 20–30 tracks you use now, to start organising.

## Step by step

### Step 1: Choose the format for the purpose

- **Do:** tracks you know you will keep: buy WAV, AIFF or FLAC. Tracks you are trying out: a 320 kbps MP3 is enough. Never play anything below 320 kbps at a gig.
- **Look at:** the Bitrate and Format columns in the library; switch them on if they are hidden.
- **Listen for:** on good speakers, hi-hats and cymbals sound bright and clear, with no hiss or swishing.

### Step 2: Name files and folders consistently

- **Do:** name files "Artist - Title (Mix)". Keep your music in one root folder, split by year bought or by style. Do not move files once they are in the software.
- **Look at:** your laptop's file manager.
- **Listen for:** nothing yet; the software reports no missing files.

### Step 3: Import and analyse

- **Do:** import the tracks and run BPM, key, beatgrid and waveform analysis. Check each new track's beatgrid quickly (see [BPM](${lesson('bpm-la-gi', 'en')})).
- **Look at:** the BPM and Key columns and each track's waveform.
- **Listen for:** the beatgrid click lands on the kick, and keys show in Camelot notation (see [harmonic mixing](${lesson('harmonic-mixing', 'en')})).

### Step 4: Tag tracks the moment you import them

- **Do:** tag the style, energy from 1 to 10, whether it has vocals, and its role (opener, rise, peak, closer). Set a hot cue on beat one while you are there.
- **Look at:** the Comment, Genre or My Tag fields, or colours and star ratings, depending on the software.
- **Listen for:** hear the intro, breakdown and drop to score the energy by your own feel, not by the charts.

${fig('en')}

### Step 5: Playlists, crates and backups

- **Do:** use **playlists** for an ordered set and **crates** or smart playlists for groups by style, energy or key. Back up all your music and your library to two separate places every week; for CDJs, export playlists to USB with rekordbox.
- **Look at:** the playlist tree on the left of the library screen.
- **Listen for:** you find three tracks that suit the playing track in under thirty seconds.

## Signs you got it right

- Nothing below 320 kbps sits in your gig playlists.
- Every track has a BPM, a key, an energy score and a hot cue on beat one.
- You have at least two backups in two places.

## Common mistakes and fixes

| Mistake | What you hear or see | Fix |
| --- | --- | --- |
| WAV tags lost when switching software | Tracks lose their names and artwork | Use AIFF or FLAC for tracks whose tags matter |
| Converting MP3 to WAV "for quality" | Four times the size, the same sound | Buy the lossless version again if you need it |
| Playing tracks ripped from videos | A harsh, dull top end on big speakers | Buy the official release from a store |
| Moving the music folder | The software reports missing files | Keep music in a fixed place and use the relocate feature |
| No backup | Lose the drive, lose the library | Two copies in two places, updated weekly |

## Dos and don'ts

- ✅ Tag BPM, key, style and energy as soon as a track is imported.
- ✅ Buy lossless versions of the tracks you play most.
- ✅ Carry a spare USB stick to gigs.
- ❌ Hoard thousands of tracks you have never listened to in full.
- ❌ Play 128 kbps files at a gig.
- ❌ Rename or move files outside the software after importing them.

## Wasted moves to drop

- **Re-tagging the whole library in one night:** tiring and careless. Tag each track as you import it, a few at a time.
- **Downloading every track you "might play":** the library swells and searching slows down. Keep only tracks you have heard in full and like.
- **Renaming files by hand:** the software reads tags; edit the tags in the software.

## Old idea to drop: "you must know a thousand tracks to be a DJ"

Quality beats quantity: knowing 50 tracks deeply (how long the intro is, where the breakdown sits, what they mix with) is worth more than knowing the names of 1,000. A deep, well-tagged library makes you play with more confidence than a hard drive full of music you have never heard.

## A 20-minute drill

1. Show the Bitrate and Format columns and find every track below 320 kbps.
2. Pick 10 tracks you play often and tag their style, energy and role.
3. Set a hot cue on beat one for all ten.
4. Make a crate for energy 7–9 and a playlist for a 30-minute set.
5. Back up the library to an external drive.

## Next lesson

Now that you know the formats, buy music in the right places: [where to buy DJ music: Beatport, Bandcamp and Vietnamese stores](${lesson('mua-nhac-dj', 'en')}). To put the library to work in a set, read [building a DJ set](${lesson('xay-set-dj', 'en')}). The whole path is at [Learn to DJ from zero](${lesson('hoc-dj-tu-so-0', 'en')}).`;

export const fileNhac: PackPost = {
  key: 'dj-skills/file-nhac',
  slug: 'file-nhac-dj',
  category: 'dj',
  lang: 'vi',
  title: {
    vi: 'File nhạc DJ: MP3, WAV, AIFF, FLAC, ALAC và thư viện',
    en: 'DJ file formats: MP3, WAV, AIFF, FLAC, ALAC and your library',
  },
  excerpt: {
    vi: 'So sánh MP3 320 kbps, WAV, AIFF, FLAC và ALAC cho DJ: lossless là gì, bitrate, sample rate, đầu CDJ đọc gì, và cách gắn tag, xếp playlist, crate, sao lưu thư viện.',
    en: 'MP3 320 kbps, WAV, AIFF, FLAC and ALAC compared for DJs: lossless, bitrate, sample rate, what CDJs read, and how to tag, build playlists and crates, and back up.',
  },
  cover: coverOf(DJ_MEDIA.files),
  styles: [],
  facts: lessonFacts({
    module: MODULES.music, minutes: '30',
    gear: { vi: 'Phần mềm DJ, ổ cứng ngoài để sao lưu', en: 'DJ software, an external drive for backups' },
    first: { vi: 'BPM và harmonic mixing', en: 'BPM and harmonic mixing' },
    after: { vi: 'Chọn đúng định dạng và xếp thư viện gọn', en: 'Pick the right format and keep a tidy library' },
  }),
  body: { vi, en },
  faq: [
    { q: { vi: 'MP3 320 kbps có đủ để chơi DJ không?', en: 'Is a 320 kbps MP3 good enough for DJing?' }, a: { vi: 'Đủ cho tập luyện và phần lớn gig nhỏ: rất ít người nghe phân biệt được với lossless trong một quán bar hay club đông. Lossless như WAV, AIFF, FLAC đáng giá khi bạn chơi trên dàn âm thanh lớn, chất lượng cao hoặc cần lưu trữ lâu dài.', en: 'Yes, for practice and most small gigs: very few people can tell it from lossless in a busy bar or club. Lossless files such as WAV, AIFF and FLAC are worth it on big, high-quality sound systems or for long-term archiving.' } },
    { q: { vi: 'WAV và AIFF khác nhau thế nào?', en: 'What is the difference between WAV and AIFF?' }, a: { vi: 'Cả hai đều không nén và có chất lượng như nhau. Khác biệt chính là tag: AIFF giữ tên bài, nghệ sĩ và ảnh bìa ổn định hơn khi chuyển giữa các phần mềm, còn tag của WAV dễ bị mất. Vì vậy nhiều DJ chọn AIFF.', en: 'Both are uncompressed and sound identical. The main difference is tags: AIFF keeps titles, artists and artwork more reliably as files move between programs, while WAV tags are easily lost. That is why many DJs choose AIFF.' } },
    { q: { vi: 'FLAC có chơi được trên CDJ không?', en: 'Can CDJs play FLAC?' }, a: { vi: 'Các đầu CDJ đời mới đọc được FLAC và ALAC, nhưng một số đời cũ thì không. Trước khi chơi ở club, hãy hỏi đầu phát là đời nào, hoặc mang thêm bản AIFF hay MP3 320 kbps của những bài quan trọng.', en: 'Newer CDJs read FLAC and ALAC, but some older models do not. Before a club gig, ask which players they have, or bring AIFF or 320 kbps MP3 copies of your important tracks.' } },
    { q: { vi: 'Đổi MP3 sang WAV có làm chất lượng tốt hơn không?', en: 'Does converting MP3 to WAV improve the quality?' }, a: { vi: 'Không. Khi nén MP3, một phần dữ liệu đã bị bỏ đi và không thể lấy lại. Đổi sang WAV chỉ làm file to hơn khoảng bốn lần với âm thanh y như cũ. Muốn chất lượng lossless, bạn cần mua hoặc tải bản lossless gốc.', en: 'No. MP3 compression throws some data away for good. Converting to WAV only makes the file about four times bigger with exactly the same sound. For lossless quality you need to buy or download the original lossless version.' } },
    { q: { vi: 'Playlist và crate khác nhau thế nào?', en: 'What is the difference between a playlist and a crate?' }, a: { vi: 'Playlist là danh sách có thứ tự, thường dùng cho một set cụ thể. Crate, hoặc smart playlist, là một nhóm bài theo tiêu chí như dòng nhạc, năng lượng hay key, không cần thứ tự. Tên gọi khác nhau theo phần mềm nhưng ý tưởng giống nhau.', en: 'A playlist is an ordered list, usually for a particular set. A crate, or smart playlist, is a group of tracks by criteria such as style, energy or key, with no order. The names differ between programs, but the idea is the same.' } },
  ],
  sources: [
    { title: 'Audio file format', url: wiki('Audio file format'), publisher: 'Wikipedia' },
    { title: 'MP3', url: wiki('MP3'), publisher: 'Wikipedia' },
    { title: 'Audio Interchange File Format', url: wiki('Audio Interchange File Format'), publisher: 'Wikipedia' },
    { title: 'FLAC', url: 'https://xiph.org/flac/', publisher: 'Xiph.Org Foundation' },
    { title: 'Apple Lossless Audio Codec', url: 'https://macosforge.github.io/alac/', publisher: 'Apple (open source)' },
  ],
  tracks: [],
};
