import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, DJ_MEDIA } from './media.ts';
import { figure, lesson, lessonFacts, MODULES, wiki } from './shared.ts';

const fig = (lang: 'vi' | 'en') => figure(DJ_MEDIA.beatmatch,
  { vi: 'DJ đeo tai nghe chỉnh tốc độ bài nhạc trong booth của club Tresor, Berlin', en: 'A DJ in headphones adjusting a track’s tempo in the booth at Tresor, Berlin' },
  { vi: 'Đếm phách, so tốc độ, chỉnh pitch: việc DJ làm trước mỗi lần chuyển bài', en: 'Counting beats, comparing speeds, adjusting pitch: what a DJ does before every transition' }, lang);

const vi = `**BPM** (beats per minute, số phách mỗi phút) là tốc độ của một bài nhạc: house thường chạy 120–128 BPM, drum and bass khoảng 170–175. Phần mềm DJ tự đo BPM, nhưng đếm được bằng tai giúp bạn nhận ra khi phần mềm đo sai và beatmatch nhanh hơn. Sau bài này bạn đếm được BPM của một bài trong 15 giây.

## BPM của các dòng nhạc điện tử

| Dòng nhạc | BPM thường gặp | Ghi chú |
| --- | --- | --- |
| Deep house, house | 118–128 | Dễ tập beatmatch nhất |
| Tech house, bass house | 124–128 | Kick và bass rõ, ít thay đổi tốc độ |
| [Techno](${lesson('techno', 'vi')}) | 120–150 | Peak time 128–135, hard techno trên 140 |
| [Trance](${lesson('trance', 'vi')}) | 128–140 | Uplifting thường 136–140 |
| [Dubstep](${lesson('dubstep', 'vi')}) | Khoảng 140 | Nghe như 70 vì nhịp half-time |
| [Hardstyle](${lesson('hardstyle', 'vi')}) | 150–160 | Kick méo là nhân vật chính |
| [Drum and bass](${lesson('drum-and-bass', 'vi')}) | 160–180 | Thường 172–175, nhịp breakbeat |

Hai bài cùng dòng thường chỉ chênh nhau vài BPM, nên dễ đưa về cùng tốc độ. Hai dòng xa nhau (house 124 và drum and bass 174) không thể chỉnh pitch cho khớp mà vẫn nghe tự nhiên; khi đó DJ chuyển bằng cách cắt (cut), dùng echo hoặc đi qua một bài trung gian.

## Bạn cần chuẩn bị

- Controller hoặc chỉ cần phần mềm DJ trên laptop.
- Đồng hồ bấm giờ trên điện thoại.
- Ba bài khác dòng nhạc (ví dụ house, techno, drum and bass) để nghe sự khác biệt.

## Các bước thực hiện

### Bước 1: Tìm "nhịp tim" của bài

- **Làm gì:** cho bài chạy, nhắm mắt, gõ chân theo tiếng kick. Với house và techno, kick rơi vào mọi phách; với drum and bass, hãy gõ theo snare ở phách 2 và 4 rồi nhân đôi.
- **Nhìn đâu trên controller:** không nhìn; tai và chân làm việc.
- **Nghe gì để biết đúng:** chân bạn gõ đều, không phải vội đuổi hay chờ; bạn có thể gật đầu theo mà không thấy gượng.

### Bước 2: Đếm 15 giây rồi nhân 4

- **Làm gì:** bấm đồng hồ, đếm số phách trong 15 giây, nhân 4. Đếm 32 phách mà hết khoảng 15 giây nghĩa là bài chạy khoảng 128 BPM.
- **Nhìn đâu:** đồng hồ điện thoại, không nhìn số BPM trên màn hình phần mềm.
- **Nghe gì để biết đúng:** bạn đếm theo một tiếng duy nhất (kick), không lẫn sang hi-hat hay tiếng vỗ tay.

### Bước 3: Dùng nút TAP

- **Làm gì:** nhiều phần mềm và mixer có nút TAP. Gõ nút theo kick 8–16 lần, con số BPM hiện ra.
- **Nhìn đâu:** con số cạnh nút TAP hoặc trong phần chỉnh beatgrid.
- **Nghe gì để biết đúng:** con số đứng yên sau vài lần gõ, không nhảy lên xuống quá 1 BPM.

### Bước 4: So với con số phần mềm đo

- **Làm gì:** so BPM bạn đếm với BPM phần mềm hiện. Nếu phần mềm ghi 87 mà bạn đếm 174, đó là lỗi gấp đôi hoặc gấp nửa: mở phần chỉnh beatgrid và bấm nút nhân 2 hoặc chia 2.
- **Nhìn đâu:** cột BPM trong thư viện và waveform của deck; các vạch beatgrid phải nằm đúng trên kick.
- **Nghe gì để biết đúng:** bật metronome hoặc tiếng click của beatgrid (nếu phần mềm có), click rơi đúng vào kick suốt bài.

### Bước 5: Tính khoảng chỉnh pitch

- **Làm gì:** muốn đưa bài 124 BPM lên 128 BPM, bạn tăng khoảng 3,2%. Pitch fader thường có các khoảng ±6%, ±8%, ±16%; chọn khoảng đủ rộng cho bài của bạn nhưng không rộng hơn, vì khoảng hẹp chỉnh tinh hơn.
- **Nhìn đâu:** con số phần trăm cạnh pitch fader trên màn hình.
- **Nghe gì để biết đúng:** sau khi chỉnh, bài vẫn nghe tự nhiên. Bật key lock (master tempo) để giọng hát không bị cao lên như chạy nhanh băng cassette.

${fig('vi')}

## Dấu hiệu bạn làm đúng

- BPM bạn đếm chênh với phần mềm không quá 1.
- Bạn nhận ra ngay khi phần mềm đo gấp đôi hoặc gấp nửa.
- Nghe một bài mới vài giây là đoán được nó thuộc khoảng BPM nào.

## Lỗi thường gặp và cách sửa

| Lỗi | Nghe hoặc nhìn ra sao | Cách sửa |
| --- | --- | --- |
| Đếm theo hi-hat | Ra con số gấp đôi | Đếm theo kick, tiếng trầm nhất |
| Tin con số gấp nửa | Dubstep hiện 70, drum and bass hiện 87 | Chỉnh beatgrid nhân 2 |
| Bài có tốc độ thay đổi | Beatgrid khớp đầu bài, lệch cuối bài | Bài thu với tay trống thật cần beatgrid động hoặc beatmatch bằng tai |
| Chỉnh pitch quá xa | Giọng hát méo, kick mềm | Giữ trong khoảng ±3–4%, chọn bài gần BPM hơn |
| Bỏ quên key lock | Giọng hát cao lên khi tăng tốc | Bật key lock trước khi chỉnh pitch nhiều |

## Do & Don't

- ✅ Xếp thư viện theo BPM để biết bài nào nối được với bài nào.
- ✅ Tập với hai bài chênh nhau 1–2 BPM trước.
- ✅ Kiểm tra beatgrid mỗi bài mới nhập, nhất là bài cũ và bài thu trực tiếp.
- ❌ Ép một bài lệch 10 BPM cho khớp bằng pitch fader.
- ❌ Chọn bài chỉ nhìn con số BPM mà không nghe cảm giác nhịp.
- ❌ Để pitch fader ở khoảng ±16% khi chỉ cần chỉnh 2%.

## Động tác thừa cần tránh

- **Nhìn con số BPM liên tục khi đang mix:** con số không cho biết phách có lệch không. Nghe hai tiếng kick.
- **Bấm TAP cả chục lần cho mọi bài:** phần mềm đo đúng phần lớn bài; chỉ đếm lại khi con số trông lạ.
- **Đổi khoảng pitch giữa chừng một lần chuyển bài:** bài đang chạy sẽ nhảy tốc độ. Chọn khoảng trước khi bắt đầu.

## Bài tập 20 phút

1. Chọn ba bài khác dòng nhạc, che con số BPM trên màn hình.
2. Đếm 15 giây nhân 4 cho từng bài, ghi ra giấy.
3. Gõ nút TAP cho từng bài, so với số bạn đếm.
4. Mở che, so với BPM phần mềm đo; ghi lại chênh lệch.
5. Tính phần trăm pitch cần chỉnh để đưa bài chậm nhất về bằng bài nhanh nhất cùng dòng.

## Bài tiếp theo

Biết tốc độ rồi, giờ học đếm câu nhạc để chuyển bài đúng chỗ: [Phrasing: câu nhạc 8, 16, 32 phách](${lesson('phrasing-dj', 'vi')}). Khi đã sẵn sàng đưa hai bài về cùng tốc độ, đọc [beatmatch bằng tai](${lesson('beatmatch-bang-tai', 'vi')}). Cả lộ trình ở [Học DJ từ số 0](${lesson('hoc-dj-tu-so-0', 'vi')}).`;

const en = `**BPM** (beats per minute) is the speed of a track: house usually runs at 120–128 BPM, drum and bass around 170–175. DJ software measures BPM for you, but counting it by ear helps you spot when the software gets it wrong and makes beatmatching faster. After this lesson you can count a track's BPM in fifteen seconds.

## BPM across electronic music styles

| Style | Typical BPM | Notes |
| --- | --- | --- |
| Deep house, house | 118–128 | The easiest to practise beatmatching on |
| Tech house, bass house | 124–128 | A clear kick and bass, few tempo changes |
| [Techno](${lesson('techno', 'en')}) | 120–150 | Peak time 128–135, hard techno above 140 |
| [Trance](${lesson('trance', 'en')}) | 128–140 | Uplifting often 136–140 |
| [Dubstep](${lesson('dubstep', 'en')}) | Around 140 | Feels like 70 because of the half-time beat |
| [Hardstyle](${lesson('hardstyle', 'en')}) | 150–160 | The distorted kick is the star |
| [Drum and bass](${lesson('drum-and-bass', 'en')}) | 160–180 | Usually 172–175, on breakbeats |

Two tracks of the same style are usually only a few BPM apart, so they are easy to bring to the same speed. Two distant styles (house at 124 and drum and bass at 174) cannot be pitched together and still sound natural; DJs move between them with a cut, an echo out, or a track in between.

## What you need

- A controller, or just DJ software on a laptop.
- The stopwatch on your phone.
- Three tracks of different styles (for example house, techno and drum and bass) to hear the difference.

## Step by step

### Step 1: Find the track's heartbeat

- **Do:** let the track play, close your eyes and tap your foot with the kick. In house and techno the kick lands on every beat; in drum and bass, tap along with the snare on beats two and four and double it.
- **Look at:** nothing; your ears and your foot do the work.
- **Listen for:** your foot taps evenly, never rushing or waiting, and you can nod along without forcing it.

### Step 2: Count fifteen seconds and multiply by four

- **Do:** start the stopwatch, count the beats in fifteen seconds and multiply by four. If 32 beats take about fifteen seconds, the track runs at about 128 BPM.
- **Look at:** the stopwatch, not the BPM shown by the software.
- **Listen for:** you count one sound only (the kick), never drifting onto the hi-hats or the claps.

### Step 3: Use the TAP button

- **Do:** many apps and mixers have a TAP button. Tap it with the kick eight to sixteen times and a BPM appears.
- **Look at:** the number next to the TAP button or in the beatgrid editor.
- **Listen for:** the number settles after a few taps and stops jumping by more than one BPM.

### Step 4: Compare with what the software measured

- **Do:** compare your count with the software's BPM. If the software says 87 and you counted 174, it has halved the tempo: open the beatgrid editor and press the double or halve button.
- **Look at:** the BPM column in the library and the deck's waveform; the beatgrid lines must sit right on the kicks.
- **Listen for:** switch on the metronome or the beatgrid click if your software has one; the click should land on the kick all the way through.

### Step 5: Work out how far to move the pitch

- **Do:** to take a 124 BPM track to 128 BPM you speed it up by about 3.2%. Pitch faders usually offer ranges such as ±6%, ±8% and ±16%; pick one wide enough for your tracks but no wider, because a narrow range gives finer control.
- **Look at:** the percentage shown next to the pitch fader on the screen.
- **Listen for:** after the change the track still sounds natural. Switch on key lock (master tempo) so vocals do not rise like a cassette played too fast.

${fig('en')}

## Signs you got it right

- Your count is within one BPM of the software's.
- You notice at once when the software has doubled or halved a tempo.
- A few seconds of a new track tell you which BPM range it belongs to.

## Common mistakes and fixes

| Mistake | What you hear or see | Fix |
| --- | --- | --- |
| Counting the hi-hats | You get double the real number | Count the kick, the lowest sound |
| Trusting a halved number | Dubstep shows 70, drum and bass shows 87 | Double the beatgrid |
| A track whose tempo drifts | The grid fits the start and slips by the end | Tracks with a live drummer need a dynamic grid or beatmatching by ear |
| Pitching too far | Warped vocals, a soft kick | Stay within about ±3–4% and choose tracks closer in tempo |
| Forgetting key lock | Vocals rise as you speed up | Turn key lock on before big pitch moves |

## Dos and don'ts

- ✅ Sort your library by BPM so you can see which tracks will mix together.
- ✅ Practise with two tracks one or two BPM apart first.
- ✅ Check the beatgrid of every new track, especially older and live recordings.
- ❌ Force a track ten BPM away into place with the pitch fader.
- ❌ Choose tracks by the BPM number alone without hearing how the beat feels.
- ❌ Leave the pitch range at ±16% when you only need to move 2%.

## Wasted moves to drop

- **Watching the BPM number all through the mix:** the number cannot tell you whether the beats are drifting. Listen to the two kicks.
- **Tapping TAP a dozen times for every track:** the software gets most tracks right; recount only when a number looks odd.
- **Changing the pitch range in the middle of a transition:** the playing track jumps in speed. Pick the range before you start.

## A 20-minute drill

1. Pick three tracks of different styles and cover the BPM on the screen.
2. Count fifteen seconds times four for each track and write the numbers down.
3. Tap the TAP button for each track and compare with your counts.
4. Uncover the screen, compare with the software's BPM and note the differences.
5. Work out the pitch change needed to bring the slowest track up to the fastest one of the same style.

## Next lesson

Now that you know the speed, learn to count phrases so you change tracks in the right place: [Phrasing: 8, 16 and 32-beat phrases](${lesson('phrasing-dj', 'en')}). When you are ready to bring two tracks to the same speed, read [beatmatching by ear](${lesson('beatmatch-bang-tai', 'en')}). The whole path is at [Learn to DJ from zero](${lesson('hoc-dj-tu-so-0', 'en')}).`;

export const bpm: PackPost = {
  key: 'dj-skills/bpm',
  slug: 'bpm-la-gi',
  category: 'dj',
  lang: 'vi',
  title: {
    vi: 'BPM là gì? Cách đếm BPM bằng tai cho người mới học DJ',
    en: 'What is BPM? How to count a track’s tempo by ear',
  },
  excerpt: {
    vi: 'BPM là số phách mỗi phút, tốc độ của một bài nhạc. BPM từng dòng nhạc điện tử, cách đếm BPM bằng tai trong 15 giây, nút TAP, lỗi gấp đôi và cách tính pitch.',
    en: 'BPM is beats per minute, the speed of a track. Typical BPM by electronic style, how to count it by ear in fifteen seconds, the TAP button, halved tempos and pitch maths.',
  },
  cover: coverOf(DJ_MEDIA.bpm),
  styles: [],
  facts: lessonFacts({
    module: MODULES.ears, minutes: '20',
    gear: { vi: 'Phần mềm DJ, đồng hồ bấm giờ, 3 bài khác dòng nhạc', en: 'DJ software, a stopwatch, 3 tracks of different styles' },
    first: { vi: 'Cue point: đặt cue ở phách 1', en: 'Cue points: a cue on beat one' },
    after: { vi: 'Đếm BPM bằng tai và tính khoảng chỉnh pitch', en: 'Count BPM by ear and work out pitch changes' },
  }),
  body: { vi, en },
  faq: [
    { q: { vi: 'BPM là gì?', en: 'What is BPM?' }, a: { vi: 'BPM là viết tắt của beats per minute, số phách trong một phút, tức tốc độ của bài nhạc. Bài 128 BPM có 128 tiếng kick mỗi phút. DJ dùng BPM để chọn những bài nối được với nhau và để chỉnh hai bài về cùng tốc độ.', en: 'BPM stands for beats per minute, the number of beats in one minute, which is the speed of a track. A 128 BPM track has 128 kicks a minute. DJs use BPM to choose tracks that will mix together and to bring two tracks to the same speed.' } },
    { q: { vi: 'Làm sao đếm BPM bằng tai?', en: 'How do I count BPM by ear?' }, a: { vi: 'Gõ chân theo tiếng kick, đếm số phách trong 15 giây rồi nhân 4. Cách nhanh hơn là gõ nút TAP trong phần mềm theo nhịp kick 8–16 lần. Luôn đếm theo kick, không đếm theo hi-hat, vì hi-hat thường cho ra con số gấp đôi.', en: 'Tap your foot with the kick, count the beats in fifteen seconds and multiply by four. A faster way is to tap the software’s TAP button along with the kick eight to sixteen times. Always count the kick, not the hi-hats, which often give double the number.' } },
    { q: { vi: 'Vì sao phần mềm hiện BPM sai?', en: 'Why does the software show the wrong BPM?' }, a: { vi: 'Phần mềm đôi khi đo gấp đôi hoặc gấp nửa, nhất là với dubstep (hiện 70 thay vì 140) và drum and bass (hiện 87 thay vì 174). Bài thu với tay trống thật cũng có tốc độ dao động. Mở phần chỉnh beatgrid để nhân 2, chia 2 hoặc sửa điểm đầu.', en: 'Software sometimes doubles or halves the tempo, especially with dubstep (70 instead of 140) and drum and bass (87 instead of 174). Recordings with a live drummer also drift in tempo. Open the beatgrid editor to double, halve or move the first downbeat.' } },
    { q: { vi: 'Hai bài chênh bao nhiêu BPM thì mix được?', en: 'How far apart can two tracks be in BPM?' }, a: { vi: 'Chênh vài BPM (khoảng ±3–4%) thì chỉnh pitch vẫn nghe tự nhiên, nhất là khi bật key lock. Xa hơn, bài bắt đầu méo. Với hai dòng nhạc rất khác tốc độ, DJ chuyển bằng cách cắt, dùng echo hoặc đi qua một bài trung gian.', en: 'A few BPM apart (about ±3–4%) still sounds natural after a pitch change, especially with key lock on. Further than that, tracks start to sound warped. Between styles with very different tempos, DJs use a cut, an echo out or a track in between.' } },
    { q: { vi: 'Key lock là gì?', en: 'What is key lock?' }, a: { vi: 'Key lock (còn gọi master tempo) giữ nguyên cao độ của bài khi bạn đổi tốc độ. Không có key lock, tăng tốc làm giọng hát cao lên như băng cassette chạy nhanh. Nên bật key lock khi chỉnh pitch nhiều, nhưng chỉnh quá xa vẫn làm âm thanh kém tự nhiên.', en: 'Key lock (also called master tempo) keeps a track’s pitch the same when you change its speed. Without it, speeding up raises the vocals like a cassette played too fast. Switch it on for bigger pitch moves, though pitching very far still sounds unnatural.' } },
  ],
  sources: [
    { title: 'Tempo', url: wiki('Tempo'), publisher: 'Wikipedia' },
    { title: 'Beatmatching', url: wiki('Beatmatching'), publisher: 'Wikipedia' },
    { title: 'rekordbox FAQ', url: 'https://rekordbox.com/en/support/faq/', publisher: 'AlphaTheta' },
    { title: 'Pro tips: beatgrids in Serato DJ', url: 'https://serato.com/latest/blog/16797/pro-tips-beatgrids-in-serato-dj', publisher: 'Serato' },
    { title: 'How to edit beatgrids manually, and why you should do it', url: 'https://www.thomannmusic.com/blog/learn/how-to-edit-beatgrids-manually-and-why-you-should-do-it/', publisher: 'Thomann' },
  ],
  tracks: [],
};
