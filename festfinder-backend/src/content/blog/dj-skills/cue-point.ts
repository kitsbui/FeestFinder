import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, DJ_MEDIA } from './media.ts';
import { figure, lesson, lessonFacts, MODULES, wiki } from './shared.ts';

const fig = (lang: 'vi' | 'en') => figure(DJ_MEDIA.sync,
  { vi: 'Controller Traktor Kontrol S4 với hàng pad dưới mỗi jog wheel', en: 'A Traktor Kontrol S4 controller with a row of pads under each jog wheel' },
  { vi: 'Hàng pad dưới jog wheel: ở chế độ Hot Cue, mỗi pad là một điểm nhảy lưu sẵn', en: 'The pads under the jog wheels: in Hot Cue mode, each pad is a saved jump point' }, lang);

const vi = `**Cue point** là điểm đánh dấu trong bài nhạc nơi bạn muốn bắt đầu phát, thường là phách đầu tiên của tiếng kick. Nút CUE đưa bài về điểm đó, còn hot cue là các điểm lưu sẵn trên pad để nhảy tới ngay. Sau bài này bạn đặt được cue đúng phách 1 và bấm play khớp nhịp bài đang chạy.

## Cue, hot cue và memory cue khác nhau thế nào?

| Loại | Là gì | Dùng khi nào |
| --- | --- | --- |
| Cue chính (nút CUE) | Một điểm tạm cho mỗi deck | Chuẩn bị bài kế tiếp trong tai nghe |
| Hot cue (pad 1–8) | Các điểm lưu cùng bài, bấm là nhảy tới và phát | Vào bài ở đoạn đẹp, nhảy tới breakdown hoặc drop |
| Memory cue (rekordbox) | Điểm lưu hiện trên waveform, mang sang CDJ | Đánh dấu chỗ chuyển bài khi chơi trên CDJ |
| Loop | Một đoạn lặp có điểm vào và điểm ra | Kéo dài intro hoặc outro khi cần thêm thời gian |

Ở phần lớn phần mềm và đầu CDJ, nút CUE hoạt động theo cùng một cách: khi bài đang dừng, bấm CUE để đặt điểm; khi bài đang chạy, bấm CUE để quay về điểm đó và dừng lại; giữ CUE để nghe thử, buông tay thì bài quay về điểm cue.

## Bạn cần chuẩn bị

- Controller đã nối dây và nhận phần mềm (xem [bài Controller DJ](${lesson('controller-dj', 'vi')})).
- Tai nghe, với nút cue tai nghe của deck đang chuẩn bị đã bật.
- Hai ba bài house hoặc techno có intro bắt đầu bằng kick rõ ràng.

## Các bước thực hiện

### Bước 1: Tìm phách 1

- **Làm gì:** nạp bài vào deck, phóng to waveform, tìm vạch đầu tiên cao và sắc ở dải bass. Đó thường là tiếng kick đầu tiên.
- **Nhìn đâu trên controller:** màn hình laptop, phần waveform phóng to của deck; tay đặt trên jog wheel.
- **Nghe gì để biết đúng:** một tiếng "thịch" đầy và chắc, không phải tiếng trống lấp (fill) hay hiệu ứng mở bài.

### Bước 2: Đặt cue

- **Làm gì:** dừng bài, xoay jog wheel từ từ cho tới khi vạch phát nằm ngay đầu tiếng kick, bấm CUE một lần.
- **Nhìn đâu:** vạch phát trên waveform phóng to; đầu vạch kick phải trùng vạch phát.
- **Nghe gì để biết đúng:** xoay jog qua lại quanh điểm đó, bạn nghe tiếng kick bắt đầu đúng chỗ, không có khoảng lặng hay tiếng lẹt xẹt phía trước.

### Bước 3: Thử cue bằng cách giữ nút

- **Làm gì:** giữ nút CUE: bài phát từ điểm cue. Buông tay: bài quay về điểm cue và dừng. Lặp lại vài lần.
- **Nhìn đâu:** đèn nút CUE và vạch phát trên waveform.
- **Nghe gì để biết đúng:** mỗi lần giữ nút, kick vang lên ngay, gọn như bấm một nút trống.

### Bước 4: Lưu hot cue cho những đoạn quan trọng

- **Làm gì:** chuyển hàng pad sang chế độ Hot Cue. Bấm pad 1 ở kick đầu tiên, pad 2 ở đầu breakdown, pad 3 ở đầu drop. Đặt màu riêng cho từng loại điểm nếu phần mềm cho phép.
- **Nhìn đâu:** pad sáng màu khi đã lưu điểm; trên waveform hiện các mốc tương ứng.
- **Nghe gì để biết đúng:** bấm pad 2 khi bài đang chạy, bài nhảy ngay tới breakdown mà nhịp không bị hụt.

### Bước 5: Bấm play đúng phách theo bài đang chạy

- **Làm gì:** cho bài A chạy trên loa. Đếm 1-2-3-4 theo tiếng kick của bài A. Đúng nhịp "1" của một vòng mới, bấm play bài B trong tai nghe.
- **Nhìn đâu:** không nhìn màn hình; nhìn tay và nghe.
- **Nghe gì để biết đúng:** kick bài B rơi đúng lúc kick bài A, nghe như một tiếng. Nếu nghe hai tiếng "thịch-thịch", bạn bấm sớm hoặc muộn.

${fig('vi')}

## Dấu hiệu bạn làm đúng

- Giữ CUE là nghe kick vang lên ngay, không có khoảng lặng.
- Bấm play bài B ở nhịp 1, kick của hai bài rơi cùng lúc trong vài phách đầu.
- Mỗi bài trong thư viện có ít nhất một hot cue ở phách 1 của intro.

## Lỗi thường gặp và cách sửa

| Lỗi | Nghe hoặc nhìn ra sao | Cách sửa |
| --- | --- | --- |
| Cue đặt vào tiếng trống lấp | Bài vào "lạc", không có lực | Tìm kick đầu tiên sau phần mở bài |
| Cue muộn một chút | Kick bị cụt đầu, nghe như tiếng "bụp" | Phóng to waveform, đặt lại ngay đầu vạch kick |
| Bật quantize khi beatgrid sai | Hot cue luôn lệch khỏi kick | Sửa beatgrid trước rồi mới đặt hot cue |
| Pad đang ở chế độ sampler | Bấm pad ra tiếng hiệu ứng | Chuyển pad về chế độ Hot Cue |
| Bấm play theo mắt | Hai kick lệch nhau dù waveform trông thẳng hàng | Đếm theo tai, bấm ở nhịp 1 |

## Do & Don't

- ✅ Đặt hot cue ở phách 1 cho mọi bài ngay khi nhập vào thư viện.
- ✅ Dùng cùng một màu cho cùng một loại điểm ở mọi bài.
- ✅ Bật quantize khi beatgrid đã đúng, để hot cue luôn rơi vào phách.
- ❌ Đặt cue ở giữa bài chỉ vì đoạn đó hay.
- ❌ Lưu tám hot cue cho mỗi bài ngay tuần đầu.
- ❌ Tin tuyệt đối vào điểm cue phần mềm tự đặt mà không nghe lại.

## Động tác thừa cần tránh

- **Tìm lại phách 1 mỗi lần chơi một bài:** tốn thời gian khi đang diễn. Lưu một hot cue một lần, dùng mãi.
- **Bấm CUE liên tục để nghe đi nghe lại:** làm tai mỏi và dễ trễ nhịp vào bài. Nghe thử hai lần là đủ, rồi chuẩn bị bấm play.
- **Đặt hot cue ở mọi đoạn:** pad nhiều màu làm rối mắt. Ba điểm (intro, breakdown, drop) là đủ cho người mới.

## Bài tập 20 phút

1. Chọn ba bài, đặt cue ở phách 1 cho từng bài bằng bước 1 và 2.
2. Lưu pad 1 ở phách 1, pad 2 ở breakdown, pad 3 ở drop cho cả ba bài.
3. Cho bài A chạy, bấm play bài B đúng nhịp 1 trong tai nghe mười lần liền.
4. Ghi lại bao nhiêu lần kick hai bài rơi cùng lúc.
5. Lặp lại ngày mai và so số lần đúng.

## Bài tiếp theo

Bấm play đúng phách mới là nửa việc: hai bài còn phải cùng tốc độ. Đọc tiếp [BPM là gì và cách đếm BPM bằng tai](${lesson('bpm-la-gi', 'vi')}), rồi [beatmatch bằng tai](${lesson('beatmatch-bang-tai', 'vi')}). Cả lộ trình ở [Học DJ từ số 0](${lesson('hoc-dj-tu-so-0', 'vi')}).`;

const en = `**A cue point** is a marker in a track where you want playback to start, usually the first beat of the kick. The CUE button takes the track back to that point; hot cues are points saved on the pads. After this lesson you can set a cue on beat one and press play in time with the running track.

## How are cues, hot cues and memory cues different?

| Type | What it is | When to use it |
| --- | --- | --- |
| Main cue (the CUE button) | One temporary point per deck | Preparing the next track in your headphones |
| Hot cue (pads 1–8) | Points saved with the track; press one to jump there and play | Starting from a good section, jumping to a breakdown or drop |
| Memory cue (rekordbox) | Saved points shown on the waveform, carried over to CDJs | Marking mix points when you play on CDJs |
| Loop | A repeating section with an in point and an out point | Stretching an intro or outro when you need more time |

In most software and on most CDJs the CUE button behaves the same way: with the track paused, press CUE to set the point; with the track playing, press CUE to jump back to that point and stop; hold CUE to preview, and when you let go the track returns to the cue point.

## What you need

- A controller that is connected and recognised by the software (see [the DJ controller lesson](${lesson('controller-dj', 'en')})).
- Headphones, with the headphone cue button of the deck you are preparing switched on.
- Two or three house or techno tracks whose intros start with a clear kick.

## Step by step

### Step 1: Find beat one

- **Do:** load a track, zoom into the waveform and look for the first tall, sharp line in the bass band. That is usually the first kick.
- **Look at:** the laptop screen, on the deck's zoomed waveform, with your hand resting on the jog wheel.
- **Listen for:** a full, solid thud, not a drum fill or an opening sound effect.

### Step 2: Set the cue

- **Do:** pause the track, turn the jog wheel slowly until the playhead sits right at the start of the kick, and press CUE once.
- **Look at:** the playhead on the zoomed waveform; the start of the kick line should meet it exactly.
- **Listen for:** rock the jog back and forth around that point and you hear the kick start right there, with no silence or crackle before it.

### Step 3: Test the cue by holding the button

- **Do:** hold CUE and the track plays from the cue point. Let go and it jumps back to the cue point and stops. Repeat a few times.
- **Look at:** the CUE button's light and the playhead on the waveform.
- **Listen for:** each time you hold the button, the kick sounds instantly, as tight as hitting a drum pad.

### Step 4: Save hot cues for the key sections

- **Do:** switch the pads to Hot Cue mode. Press pad 1 at the first kick, pad 2 at the start of the breakdown and pad 3 at the start of the drop. Give each kind of point its own colour if your software allows it.
- **Look at:** a pad lights up once it holds a point, and matching markers appear on the waveform.
- **Listen for:** press pad 2 while the track plays and it jumps straight to the breakdown without dropping a beat.

### Step 5: Press play on the beat of the running track

- **Do:** let track A play on the speakers. Count 1-2-3-4 along with track A's kick. Exactly on the "1" of a new bar, press play on track B in your headphones.
- **Look at:** not the screen; watch your hand and listen.
- **Listen for:** track B's kick lands with track A's kick and the two sound like one. If you hear a double "thud-thud", you pressed too early or too late.

${fig('en')}

## Signs you got it right

- Holding CUE makes the kick sound at once, with no gap.
- When you start track B on the one, the two kicks land together for the first few beats.
- Every track in your library has at least one hot cue on beat one of the intro.

## Common mistakes and fixes

| Mistake | What you hear or see | Fix |
| --- | --- | --- |
| The cue sits on a drum fill | The track comes in "lost", without punch | Find the first kick after the opening |
| The cue is a touch late | The kick loses its front and sounds like a "pop" | Zoom in and reset it at the very start of the kick line |
| Quantize on with a wrong beatgrid | Hot cues always land off the kick | Fix the beatgrid first, then set the hot cues |
| The pads are in sampler mode | Pressing a pad fires a sound effect | Switch the pads back to Hot Cue mode |
| Pressing play by eye | The two kicks drift apart even though the waveforms look aligned | Count by ear and press on the one |

## Dos and don'ts

- ✅ Put a hot cue on beat one of every track as soon as it enters your library.
- ✅ Use the same colour for the same kind of point in every track.
- ✅ Switch quantize on once the beatgrid is right, so hot cues always land on the beat.
- ❌ Set a cue in the middle of a track just because that part sounds good.
- ❌ Save eight hot cues per track in your first week.
- ❌ Trust the cue the software placed for you without listening to it.

## Wasted moves to drop

- **Hunting for beat one every time you play a track:** it eats time while you perform. Save a hot cue once and use it forever.
- **Pressing CUE over and over to listen again:** it tires your ears and makes you late for the mix. Preview twice, then get ready to press play.
- **Putting hot cues on every section:** a rainbow of pads overloads your eyes. Three points (intro, breakdown, drop) are enough for a beginner.

## A 20-minute drill

1. Pick three tracks and set a cue on beat one of each, using steps 1 and 2.
2. Save pad 1 on beat one, pad 2 on the breakdown and pad 3 on the drop of all three.
3. Let track A run and start track B exactly on the one in your headphones, ten times in a row.
4. Note how many times the two kicks landed together.
5. Repeat tomorrow and compare the count.

## Next lesson

Pressing play on the beat is only half the job: the two tracks also need the same speed. Read [What BPM is and how to count it by ear](${lesson('bpm-la-gi', 'en')}), then [beatmatching by ear](${lesson('beatmatch-bang-tai', 'en')}). The whole path is at [Learn to DJ from zero](${lesson('hoc-dj-tu-so-0', 'en')}).`;

export const cuePoint: PackPost = {
  key: 'dj-skills/cue-point',
  slug: 'cue-point',
  category: 'dj',
  lang: 'vi',
  title: {
    vi: 'Cue point là gì? Cách đặt cue và hot cue đầu tiên',
    en: 'What is a cue point? Set your first cue and hot cues',
  },
  excerpt: {
    vi: 'Cue point là điểm bắt đầu phát trong bài nhạc. Cách tìm phách 1, đặt cue, lưu hot cue trên pad và bấm play đúng nhịp bài đang chạy, kèm lỗi thường gặp.',
    en: 'A cue point marks where a track starts playing. How to find beat one, set a cue, save hot cues on the pads and press play in time with the running track.',
  },
  cover: coverOf(DJ_MEDIA.cue),
  styles: [],
  facts: lessonFacts({
    module: MODULES.gear, minutes: '20',
    gear: { vi: 'Controller, tai nghe, 2–3 bài có intro bắt đầu bằng kick', en: 'Controller, headphones, 2–3 tracks whose intros start with a kick' },
    first: { vi: 'Controller DJ: nối dây và cài phần mềm', en: 'DJ controller: wiring and software' },
    after: { vi: 'Đặt cue ở phách 1 và bấm play đúng nhịp', en: 'Set a cue on beat one and press play in time' },
  }),
  body: { vi, en },
  faq: [
    { q: { vi: 'Cue point là gì?', en: 'What is a cue point?' }, a: { vi: 'Cue point là điểm đánh dấu trong bài nhạc nơi bạn muốn bắt đầu phát, thường là phách đầu tiên của tiếng kick. Nút CUE đưa bài về điểm này để bạn chuẩn bị trong tai nghe và bấm play đúng nhịp khi chuyển bài.', en: 'A cue point is a marker where you want a track to start playing, usually the first beat of the kick. The CUE button takes the track back to it so you can prepare it in your headphones and press play in time when you mix.' } },
    { q: { vi: 'Hot cue khác cue thường thế nào?', en: 'How is a hot cue different from a normal cue?' }, a: { vi: 'Cue thường là một điểm tạm trên mỗi deck. Hot cue là nhiều điểm lưu cùng bài trên các pad: bấm pad là bài nhảy tới đó và phát ngay. Hot cue giúp vào bài ở đoạn đẹp hoặc nhảy tới breakdown, drop mà không phải tua.', en: 'A normal cue is one temporary point per deck. Hot cues are several points saved with the track on the pads: press a pad and the track jumps there and plays at once. They let you start from a good section or jump to a breakdown or drop without scrolling.' } },
    { q: { vi: 'Nên đặt bao nhiêu hot cue cho một bài?', en: 'How many hot cues should a track have?' }, a: { vi: 'Người mới chỉ cần ba: phách 1 của intro, đầu breakdown và đầu drop. Khi đã quen, có thể thêm điểm ở đầu outro hoặc đoạn vocal để chuyển bài. Dùng cùng một màu cho cùng một loại điểm ở mọi bài để nhìn là nhận ra.', en: 'Beginners need only three: beat one of the intro, the start of the breakdown and the start of the drop. Later you can add points at the start of the outro or a vocal section for transitions. Use the same colour for each kind of point in every track.' } },
    { q: { vi: 'Quantize là gì và có nên bật không?', en: 'What is quantize and should I switch it on?' }, a: { vi: 'Quantize làm cho cue, hot cue và loop tự rơi vào phách gần nhất theo beatgrid. Nên bật khi beatgrid của bài đã đúng. Nếu beatgrid lệch, quantize sẽ kéo mọi điểm lệch theo, nên kiểm tra beatgrid trước.', en: 'Quantize snaps cues, hot cues and loops to the nearest beat on the beatgrid. Switch it on once a track’s beatgrid is right. If the grid is off, quantize drags every point off with it, so check the grid first.' } },
    { q: { vi: 'Cue point có mang sang CDJ được không?', en: 'Do cue points carry over to CDJs?' }, a: { vi: 'Có, nếu bạn chuẩn bị nhạc bằng rekordbox: hot cue và memory cue được lưu cùng bài khi xuất ra USB, và đầu CDJ đọc được. Với phần mềm khác, hãy đưa thư viện vào rekordbox (bằng chức năng nhập của nó hoặc một công cụ chuyển thư viện) rồi mới xuất ra USB.', en: 'Yes, if you prepare your music in rekordbox: hot cues and memory cues are saved with each track when you export to USB, and CDJs read them. With other software, bring your library into rekordbox (with its import feature or a library conversion tool) before exporting to USB.' } },
  ],
  sources: [
    { title: 'Cue (audio)', url: wiki('Cue (audio)'), publisher: 'Wikipedia' },
    { title: 'rekordbox FAQ', url: 'https://rekordbox.com/en/support/faq/', publisher: 'AlphaTheta' },
    { title: 'Serato DJ', url: 'https://serato.com/dj', publisher: 'Serato' },
    { title: 'Learn to beatmatch', url: 'https://www.digitaldjtips.com/2011/02/learn-to-beatmatch/', publisher: 'Digital DJ Tips' },
  ],
  tracks: [],
};
