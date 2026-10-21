import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, DJ_MEDIA } from './media.ts';
import { figure, lesson, lessonFacts, MODULES, wiki } from './shared.ts';

const fig = (lang: 'vi' | 'en') => figure(DJ_MEDIA.vietnam,
  { vi: 'Đám đông nhảy dưới ánh đèn trong một club', en: 'A crowd dancing under the lights in a club' },
  { vi: 'Người nghe không đếm phách, nhưng cơ thể họ chờ đầu câu nhạc: drop phải rơi đúng chỗ đó', en: 'Dancers never count, but their bodies wait for the start of the phrase: that is where the drop must land' }, lang);

const vi = `**Phrasing** là cách nhạc dance chia thành những câu đều nhau: 4 phách thành 1 nhịp (bar), 8 nhịp, tức 32 phách, thành 1 câu (phrase). Những thay đổi lớn như vào bass, breakdown hay drop gần như luôn rơi vào đầu câu. Sau bài này bạn đếm được câu 32 phách, đọc cấu trúc bài trên waveform và chuyển bài đúng chỗ.

## Cấu trúc một bài nhạc dance

| Đoạn | Thường dài | Bạn nghe gì | DJ dùng để làm gì |
| --- | --- | --- | --- |
| Intro | 16–32 nhịp | Chủ yếu là trống, ít giai điệu | Đưa bài vào mix |
| Groove (hay verse) | 16–32 nhịp | Kick, bass, hook chính | Để bài chạy, chuẩn bị bài kế |
| Breakdown | 8–32 nhịp | Kick tắt, còn pad, giai điệu, giọng hát | Tạo khoảng thở, đổi không khí |
| Build-up | 8–16 nhịp | Tiếng riser, snare dồn | Báo hiệu drop sắp tới |
| Drop | 16–32 nhịp | Mọi thứ trở lại, năng lượng cao nhất | Khoảnh khắc đám đông chờ |
| Outro | 16–32 nhịp | Các lớp rút dần, còn trống | Đưa bài ra khỏi mix |

Bài có lời hát thường thêm verse (đoạn kể) và chorus (điệp khúc) vào giữa, nhưng vẫn theo khung 8, 16 hay 32 nhịp. Bài dành cho DJ (bản "extended mix") có intro và outro dài chính là để bạn có chỗ nối bài.

## Bạn cần chuẩn bị

- Controller và phần mềm, với waveform phóng to hiển thị trên màn hình.
- Hai ba bài house hoặc techno có intro dài (bản extended mix).
- Một tờ giấy để ghi số nhịp của từng đoạn.

## Các bước thực hiện

### Bước 1: Đếm nhịp, nhấn vào phách 1

- **Làm gì:** cho bài chạy từ phách 1. Đếm thành tiếng "MỘT-hai-ba-bốn, HAI-hai-ba-bốn, BA-hai-ba-bốn…" tới "TÁM-hai-ba-bốn". Tám nhịp đó là một câu 32 phách.
- **Nhìn đâu trên controller:** bộ đếm nhịp (beat counter) cạnh waveform nếu phần mềm có; không có thì chỉ cần tai.
- **Nghe gì để biết đúng:** khi bạn đếm tới "MỘT" của câu tiếp theo, bài thường có gì đó mới: thêm hi-hat, vào bass, đổi hook.

### Bước 2: Tìm thay đổi lớn đầu tiên

- **Làm gì:** tiếp tục đếm câu, ghi lại thay đổi lớn đầu tiên rơi vào câu thứ mấy. Với house và techno, thường là sau 16 hoặc 32 nhịp.
- **Nhìn đâu:** vị trí thay đổi trên waveform: phần thân thường dày lên hoặc thắt lại ngay đó.
- **Nghe gì để biết đúng:** thay đổi rơi đúng vào "MỘT" bạn đếm. Nếu nó rơi vào "ba" hay "năm", bạn đã bắt đầu đếm sai chỗ.

### Bước 3: Đọc cấu trúc bài trên waveform

- **Làm gì:** thu nhỏ waveform để thấy cả bài. Phần thân dày và đều là đoạn có kick và bass; phần thắt mỏng là breakdown; phần dày đột ngột sau đoạn thắt là drop. Đặt hot cue ở đầu breakdown và đầu drop.
- **Nhìn đâu:** waveform tổng của cả bài, phía trên waveform phóng to.
- **Nghe gì để biết đúng:** bấm hot cue breakdown: kick tắt ngay; bấm hot cue drop: mọi thứ ùa vào ở phách 1.

${fig('vi')}

### Bước 4: Xếp đầu câu của hai bài

- **Làm gì:** khi bài A còn khoảng 32 nhịp trước outro, bấm play bài B ở phách 1 của một câu mới của bài A. Như vậy intro của B chạy song song với đoạn cuối của A, và đầu câu của hai bài trùng nhau.
- **Nhìn đâu:** vị trí phát trên waveform tổng của bài A; bộ đếm nhịp của cả hai deck.
- **Nghe gì để biết đúng:** khi bài A đổi đoạn, bài B cũng đổi đoạn đúng lúc đó; hai bài như cùng thở.

### Bước 5: Đổi bài ở ranh giới câu

- **Làm gì:** chờ đầu một câu mới rồi mới đổi bass, kéo fader hay tắt bài A. Không đổi giữa câu.
- **Nhìn đâu:** tay đặt sẵn trên núm EQ low của hai kênh, mắt nhìn bộ đếm nhịp.
- **Nghe gì để biết đúng:** người nghe không nhận ra lúc nào bài đổi, chỉ thấy năng lượng tiếp tục đi lên.

## Dấu hiệu bạn làm đúng

- Bạn đoán trước được chỗ bài sắp đổi đoạn mà không nhìn màn hình.
- Drop của bài B rơi đúng chỗ đầu câu của bài A.
- Lần chuyển bài nghe như một bài dài liền mạch.

## Lỗi thường gặp và cách sửa

| Lỗi | Nghe hoặc nhìn ra sao | Cách sửa |
| --- | --- | --- |
| Bấm play B giữa câu | Breakdown của B chen vào giữa drop của A | Chờ phách 1 của câu mới rồi mới bấm |
| Đếm từ tiếng trống lấp | Mọi thay đổi rơi vào phách 3 hoặc 5 | Bắt đầu đếm từ kick đầu tiên sau fill |
| Đổi bass giữa câu | Mix bị hụt hoặc chồng bass trong vài phách | Đổi bass ở "MỘT" của câu mới |
| Tin tuyệt đối vào màu waveform | Nhầm một đoạn lặng ngắn là breakdown | Nghe lại bằng hot cue trước khi diễn |
| Bài có câu lẻ | Bài đổi đoạn sau 12 hay 20 nhịp | Đánh dấu bằng hot cue, đếm lại từ đó |

## Do & Don't

- ✅ Ưu tiên bản extended mix có intro và outro dài khi mua nhạc.
- ✅ Đếm thành tiếng trong những tuần đầu, kể cả khi thấy ngại.
- ✅ Đánh dấu breakdown và drop bằng hot cue cùng màu cho mọi bài.
- ❌ Chuyển bài chỉ vì bài A "nghe lâu rồi" mà không chờ đầu câu.
- ❌ Dùng bản radio edit ngắn để tập nối bài.
- ❌ Học effect khi chưa đếm được câu nhạc.

## Động tác thừa cần tránh

- **Nhìn waveform để đếm từng phách:** mắt đọc chậm hơn tai. Nhìn để biết bài đang ở đoạn nào, đếm bằng tai.
- **Tua qua tua lại tìm drop mỗi lần chơi:** lưu hot cue một lần, bấm là tới.
- **Kéo dài transition qua nhiều câu khi bài B chưa sẵn sàng:** đặt loop 8 nhịp ở outro của A để có thêm thời gian, rồi đổi ở đầu câu.

## Bài tập 20 phút

1. Chọn hai bài, đếm thành tiếng từ đầu tới drop của từng bài, ghi số nhịp mỗi đoạn.
2. Đặt hot cue ở đầu intro, breakdown và drop.
3. Cho bài A chạy, bấm play bài B ở phách 1 của câu thứ tư của A.
4. Ghi lại: drop của B có rơi vào đầu câu của A không?
5. Lặp lại với điểm bắt đầu khác cho tới khi drop rơi đúng ba lần liền.

## Bài tiếp theo

Hai bài cùng câu nhạc còn cần hợp nhau về giai điệu: [Harmonic mixing và vòng Camelot](${lesson('harmonic-mixing', 'vi')}). Muốn biết phách và tốc độ trước, đọc [BPM là gì](${lesson('bpm-la-gi', 'vi')}). Cả lộ trình ở [Học DJ từ số 0](${lesson('hoc-dj-tu-so-0', 'vi')}).`;

const en = `**Phrasing** is the way dance music divides into equal sections: four beats make a bar, and eight bars, or 32 beats, make a phrase. Big changes, like a breakdown or a drop, almost always land at the start of a phrase. After this lesson you can count phrases, read the waveform and mix in the right place.

## The structure of a dance track

| Section | Usual length | What you hear | What a DJ uses it for |
| --- | --- | --- | --- |
| Intro | 16–32 bars | Mostly drums, little melody | Bringing the track into the mix |
| Groove (or verse) | 16–32 bars | Kick, bass, the main hook | Letting it run while you prepare the next track |
| Breakdown | 8–32 bars | The kick drops out; pads, melody, vocals remain | A breather, a change of mood |
| Build-up | 8–16 bars | Risers, a snare roll | Announcing the drop |
| Drop | 16–32 bars | Everything returns at full energy | The moment the crowd waits for |
| Outro | 16–32 bars | Layers fall away, drums remain | Taking the track out of the mix |

Vocal tracks often add verses and choruses in the middle, but they still follow the 8, 16 or 32-bar frame. Tracks made for DJs (the "extended mix") have long intros and outros precisely so you have room to mix.

## What you need

- A controller and software, with the zoomed waveform on screen.
- Two or three house or techno tracks with long intros (extended mixes).
- A sheet of paper to note how many bars each section lasts.

## Step by step

### Step 1: Count bars, stressing beat one

- **Do:** play the track from beat one. Count out loud "ONE-two-three-four, TWO-two-three-four, THREE-two-three-four…" up to "EIGHT-two-three-four". Those eight bars are one 32-beat phrase.
- **Look at:** the beat counter next to the waveform if your software has one; if not, your ears are enough.
- **Listen for:** when you reach the "ONE" of the next phrase, something new usually happens: hi-hats join, the bass enters, the hook changes.

### Step 2: Find the first big change

- **Do:** keep counting phrases and note which phrase brings the first big change. In house and techno it usually comes after 16 or 32 bars.
- **Look at:** where the change sits on the waveform: the body usually thickens or narrows right there.
- **Listen for:** the change lands exactly on the "ONE" you count. If it lands on "three" or "five", you started counting in the wrong place.

### Step 3: Read the structure on the waveform

- **Do:** zoom out to see the whole track. A thick, even body is a section with kick and bass; a thin waist is a breakdown; a sudden thick block after the waist is the drop. Put hot cues at the start of the breakdown and the drop.
- **Look at:** the overview waveform of the whole track, above the zoomed one.
- **Listen for:** press the breakdown hot cue and the kick stops at once; press the drop hot cue and everything rushes in on beat one.

${fig('en')}

### Step 4: Line up the phrases of two tracks

- **Do:** when track A has about 32 bars left before its outro, start track B on beat one of a new phrase of track A. Track B's intro then runs alongside the end of track A, and the phrases of the two tracks start together.
- **Look at:** the playhead on track A's overview waveform and the beat counters of both decks.
- **Listen for:** when track A changes section, track B changes at the same moment; the two tracks seem to breathe together.

### Step 5: Change tracks on a phrase boundary

- **Do:** wait for the start of a new phrase before you swap the bass, move a fader or take track A out. Never change in the middle of a phrase.
- **Look at:** keep your hands on both channels' low EQ and your eyes on the beat counter.
- **Listen for:** the listener cannot tell when the track changed, only that the energy keeps climbing.

## Signs you got it right

- You can predict where a track will change section without looking at the screen.
- Track B's drop lands right at the start of one of track A's phrases.
- The transition sounds like one long track.

## Common mistakes and fixes

| Mistake | What you hear or see | Fix |
| --- | --- | --- |
| Starting B mid-phrase | B's breakdown cuts into the middle of A's drop | Wait for beat one of a new phrase before pressing play |
| Counting from a drum fill | Every change lands on beat three or bar five | Start counting from the first kick after the fill |
| Swapping the bass mid-phrase | The mix thins out or the basslines clash for a few beats | Swap on the "ONE" of a new phrase |
| Trusting waveform colours blindly | A short gap is mistaken for a breakdown | Check with hot cues before you play out |
| A track with odd phrases | It changes after 12 or 20 bars | Mark it with a hot cue and count again from there |

## Dos and don'ts

- ✅ Prefer extended mixes with long intros and outros when you buy music.
- ✅ Count out loud in your first weeks, even if it feels silly.
- ✅ Mark breakdowns and drops with hot cues in the same colours on every track.
- ❌ Change tracks just because track A has "gone on long enough" without waiting for a phrase.
- ❌ Practise mixing with short radio edits.
- ❌ Learn effects before you can count phrases.

## Wasted moves to drop

- **Counting each beat on the waveform:** eyes read slower than ears. Look to see which section a track is in, and count with your ears.
- **Scrolling back and forth to find the drop every time:** save a hot cue once and press it.
- **Stretching a transition over several phrases when track B is not ready:** set an 8-bar loop on track A's outro for more time, then change at the start of a phrase.

## A 20-minute drill

1. Pick two tracks, count out loud from the start to the drop of each and note how many bars every section lasts.
2. Put hot cues at the start of the intro, the breakdown and the drop.
3. Let track A play and start track B on beat one of track A's fourth phrase.
4. Note whether B's drop lands at the start of one of A's phrases.
5. Try other starting points until the drop lands right three times in a row.

## Next lesson

Two tracks on the same phrase still need to agree in melody: [Harmonic mixing and the Camelot wheel](${lesson('harmonic-mixing', 'en')}). To learn beats and tempo first, read [What is BPM](${lesson('bpm-la-gi', 'en')}). The whole path is at [Learn to DJ from zero](${lesson('hoc-dj-tu-so-0', 'en')}).`;

export const phrasing: PackPost = {
  key: 'dj-skills/phrasing',
  slug: 'phrasing-dj',
  category: 'dj',
  lang: 'vi',
  title: {
    vi: 'Phrasing là gì? Đếm câu nhạc 32 phách và đọc waveform',
    en: 'Phrasing for DJs: count 32-beat phrases, read waveforms',
  },
  excerpt: {
    vi: 'Phrasing là cách nhạc dance chia thành câu 8, 16, 32 phách. Cách đếm câu, đọc intro, breakdown, drop trên waveform và chuyển bài đúng đầu câu cho người mới.',
    en: 'Phrasing is how dance music divides into 8, 16 and 32-beat phrases. How to count them, read intros, breakdowns and drops on the waveform, and mix on the phrase.',
  },
  cover: coverOf(DJ_MEDIA.phrasing),
  styles: [],
  facts: lessonFacts({
    module: MODULES.ears, minutes: '20',
    gear: { vi: 'Controller, phần mềm, 2–3 bản extended mix', en: 'Controller, software, 2–3 extended mixes' },
    first: { vi: 'BPM: đếm phách bằng tai', en: 'BPM: counting beats by ear' },
    after: { vi: 'Đếm câu 32 phách và chuyển bài đúng đầu câu', en: 'Count 32-beat phrases and mix on the phrase' },
  }),
  body: { vi, en },
  faq: [
    { q: { vi: 'Phrasing trong DJ là gì?', en: 'What is phrasing in DJing?' }, a: { vi: 'Phrasing là việc khớp các câu nhạc của hai bài khi chuyển bài. Nhạc dance chia thành câu 8 nhịp, tức 32 phách, và các thay đổi lớn rơi vào đầu câu. Chuyển bài đúng đầu câu giúp mix nghe liền mạch như một bài dài.', en: 'Phrasing means lining up the phrases of two tracks when you mix. Dance music divides into eight-bar phrases of 32 beats, and big changes land at the start of a phrase. Mixing on the phrase makes the transition sound like one long track.' } },
    { q: { vi: 'Một câu nhạc dance có bao nhiêu phách?', en: 'How many beats are in a dance music phrase?' }, a: { vi: 'Thường là 32 phách: 4 phách một nhịp, 8 nhịp một câu. Nhiều đoạn dài 16 hoặc 32 nhịp, tức hai hoặc bốn câu. Một số bài có câu lẻ như 12 hay 20 nhịp; hãy đánh dấu những chỗ đó bằng hot cue.', en: 'Usually 32 beats: four beats to a bar and eight bars to a phrase. Many sections last 16 or 32 bars, which is two or four phrases. Some tracks have odd phrases of 12 or 20 bars; mark those places with a hot cue.' } },
    { q: { vi: 'Làm sao nhận ra breakdown và drop trên waveform?', en: 'How do I spot a breakdown and a drop on the waveform?' }, a: { vi: 'Thu nhỏ waveform để thấy cả bài. Breakdown là phần thắt mỏng lại vì kick và bass tắt. Drop là khối dày đột ngột ngay sau breakdown và build-up. Luôn nghe lại bằng hot cue, vì một đoạn lặng ngắn cũng trông mỏng như breakdown.', en: 'Zoom out to see the whole track. A breakdown is the thin waist where the kick and bass drop out. The drop is the sudden thick block right after the breakdown and build-up. Always check by ear with a hot cue, because a short gap can look as thin as a breakdown.' } },
    { q: { vi: 'Vì sao nên dùng bản extended mix?', en: 'Why use extended mixes?' }, a: { vi: 'Bản extended mix có intro và outro dài, thường 16–32 nhịp chỉ có trống, để DJ có thời gian chồng hai bài và đổi bass. Bản radio edit ngắn, vào giai điệu ngay, nên rất khó nối bài mượt.', en: 'Extended mixes have long intros and outros, often 16–32 bars of mostly drums, which give a DJ time to overlap two tracks and swap the bass. Short radio edits jump straight into the melody, which makes smooth mixing very hard.' } },
    { q: { vi: 'Phần mềm có tự đánh dấu câu nhạc không?', en: 'Can the software mark phrases for me?' }, a: { vi: 'Một số phần mềm, như rekordbox, có thể phân tích và tô màu các đoạn của bài, và nhiều phần mềm có bộ đếm nhịp. Hãy dùng chúng để kiểm tra, không thay cho tai: phân tích tự động đôi khi nhầm, nhất là với bài có câu lẻ.', en: 'Some software, such as rekordbox, can analyse and colour a track’s sections, and many apps show a beat counter. Use them to check yourself, not to replace your ears: automatic analysis sometimes gets it wrong, especially with odd phrase lengths.' } },
  ],
  sources: [
    { title: 'Phrase (music)', url: wiki('Phrase (music)'), publisher: 'Wikipedia' },
    { title: 'DJ mix', url: wiki('DJ mix'), publisher: 'Wikipedia' },
    { title: 'rekordbox FAQ', url: 'https://rekordbox.com/en/support/faq/', publisher: 'AlphaTheta' },
    { title: 'How to edit beatgrids manually, and why you should do it', url: 'https://www.thomannmusic.com/blog/learn/how-to-edit-beatgrids-manually-and-why-you-should-do-it/', publisher: 'Thomann' },
    { title: 'Serato DJ', url: 'https://serato.com/dj', publisher: 'Serato' },
  ],
  tracks: [],
};
