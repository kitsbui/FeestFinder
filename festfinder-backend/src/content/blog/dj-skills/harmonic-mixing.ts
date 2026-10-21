import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, DJ_MEDIA } from './media.ts';
import { figure, lesson, lessonFacts, MODULES, wiki } from './shared.ts';

const fig = (lang: 'vi' | 'en') => figure(DJ_MEDIA.crossfader,
  { vi: 'Mixer Pioneer DJM-2000 Nexus chụp đen trắng, cận cảnh các núm EQ', en: 'A Pioneer DJM-2000 Nexus mixer in black and white, close on the EQ knobs' },
  { vi: 'Khi hai bài lệch key, núm EQ mid và high giúp giấu phần giai điệu trong lúc chồng bài', en: 'When two tracks clash in key, the mid and high EQ hide the melody while they overlap' }, lang);

const vi = `**Harmonic mixing** là chọn và nối những bài có key (giọng) hợp nhau, để giai điệu, bass và giọng hát không "chỏi" khi hai bài chồng lên nhau. Vòng Camelot đánh số 24 key thành 1A–12A (giọng thứ) và 1B–12B (giọng trưởng) cho dễ nhớ. Sau bài này bạn chọn được bài kế tiếp hợp key chỉ trong vài giây.

## Key là gì, nói đơn giản

Mỗi bài nhạc xoay quanh một nốt "nhà" và một màu cảm xúc: giọng trưởng (major) thường sáng, giọng thứ (minor) thường tối và căng hơn. Phần lớn nhạc dance điện tử viết ở giọng thứ. Khi bạn chồng hai bài khác key xa nhau, giai điệu của chúng kéo về hai "nhà" khác nhau và tai nghe thấy lạc tông, như hai người hát hai bài cùng lúc.

Bạn không cần biết đọc nốt nhạc. Phần mềm DJ phân tích key cho từng bài, còn vòng Camelot biến chuyện hợp key thành phép cộng trừ trên mặt đồng hồ.

## Vòng Camelot: bốn nước đi an toàn

| Nước đi | Ví dụ | Cảm giác |
| --- | --- | --- |
| Cùng mã | 8A → 8A | Hợp hoàn toàn, chồng bài thoải mái |
| Cộng hoặc trừ 1, cùng chữ | 8A → 9A, 8A → 7A | Mượt, năng lượng nhích lên hoặc dịu xuống |
| Đổi chữ, cùng số | 8A → 8B | Đổi màu: từ tối sang sáng hoặc ngược lại |
| Cộng 2 hoặc cộng 7 | 8A → 10A, 8A → 3A | "Nâng tông" một cung hoặc nửa cung: dùng ít, có chủ đích |

Trên vòng Camelot, 8A là La thứ (A minor) và 8B là Đô trưởng (C major): một cặp giọng song song dùng chung các nốt. Bạn chỉ cần nhớ con số và chữ cái, không cần nhớ tên nốt.

## Bạn cần chuẩn bị

- Phần mềm DJ đã phân tích key cho thư viện (rekordbox, Serato DJ, Traktor đều làm được).
- Mười bài cùng dòng nhạc, có giai điệu hoặc giọng hát rõ.
- Tai nghe, để thử chồng bài trước khi đưa ra loa.

## Các bước thực hiện

### Bước 1: Hiện key theo ký hiệu Camelot

- **Làm gì:** trong phần cài đặt của phần mềm, chọn cách hiển thị key dạng chữ số (alphanumeric, kiểu Camelot hoặc Open Key) thay cho tên nốt. Phân tích lại những bài chưa có key.
- **Nhìn đâu trên controller:** cột Key trong thư viện trên màn hình laptop.
- **Nghe gì để biết đúng:** chưa cần nghe; mỗi bài đã có một mã như 8A hay 11B.

### Bước 2: Tìm bài hợp key với bài đang chạy

- **Làm gì:** xem mã của bài đang chạy, lọc hoặc sắp xếp thư viện theo key, tìm những bài cùng mã, cộng trừ 1 hoặc đổi chữ cùng số.
- **Nhìn đâu:** cột Key và cột BPM cạnh nhau; chọn bài vừa hợp key vừa gần BPM.
- **Nghe gì để biết đúng:** nghe thử bài ứng viên trong tai nghe; cảm giác của nó hợp với bài đang chạy.

### Bước 3: Thử chồng phần giai điệu

- **Làm gì:** beatmatch hai bài, rồi cho đoạn có giai điệu hoặc giọng hát của bài B chạy cùng bài A trong tai nghe, chế độ trộn cue và master.
- **Nhìn đâu:** núm cue mix trên controller, để giữa để nghe cả hai bài.
- **Nghe gì để biết đúng:** hai giai điệu hòa vào nhau, nghe như một bản phối. Nếu thấy lạc tông, "chua" hay nhức tai, hai key đang chỏi.

### Bước 4: Khi buộc phải nối hai bài lệch key

- **Làm gì:** chồng bài trong đoạn chỉ có trống (intro, outro), hạ EQ mid và high của bài vào cho tới khi bài cũ đã ra, hoặc dùng chức năng đổi key (key shift) để dịch bài B một hai nấc trên vòng Camelot.
- **Nhìn đâu:** núm EQ mid và high của kênh bài vào; nút key shift nếu phần mềm có.
- **Nghe gì để biết đúng:** không còn lúc nào hai giai điệu cùng vang to; người nghe chỉ thấy bài đổi.

### Bước 5: Để ý pitch fader khi tắt key lock

- **Làm gì:** nếu không bật key lock, mỗi khoảng 6% tốc độ làm key lệch khoảng nửa cung. Bật key lock khi chỉnh pitch nhiều để mã Camelot giữ đúng.
- **Nhìn đâu:** nút key lock (master tempo) trên deck và mã key hiển thị trên deck.
- **Nghe gì để biết đúng:** sau khi chỉnh tốc độ, hai bài vẫn hòa giọng như lúc thử trong bước 3.

${fig('vi')}

## Dấu hiệu bạn làm đúng

- Bạn chồng được đoạn breakdown của bài B lên đoạn cuối bài A mà không thấy chỏi.
- Bạn tìm ra hai ba bài hợp key với bài đang chạy trong chưa tới một phút.
- Bạn nghe ra ngay khi hai bài lạc tông, trước cả khi nhìn mã key.

## Lỗi thường gặp và cách sửa

| Lỗi | Nghe hoặc nhìn ra sao | Cách sửa |
| --- | --- | --- |
| Chỉ nhìn key, quên năng lượng | Hợp key nhưng set bị tụt | Chọn bài hợp key và hợp năng lượng |
| Chồng hai giọng hát | Hai câu hát đè nhau, rối | Chỉ để một giọng hát tại một thời điểm |
| Tắt key lock khi chỉnh pitch xa | Mã key đổi, bài vào bị chỏi | Bật key lock hoặc chọn bài gần BPM hơn |
| Tin tuyệt đối vào phân tích key | Hai bài cùng mã vẫn nghe lạc | Tai là người quyết định cuối cùng |
| Dùng cộng 2, cộng 7 liên tục | Set như leo thang mãi, mệt tai | Dùng nâng tông một hai lần một set |

## Do & Don't

- ✅ Ghi mã key vào tên playlist hoặc tag để tìm nhanh.
- ✅ Tập với một nhóm bài cùng hai ba mã kề nhau trên vòng Camelot.
- ✅ Kết hợp harmonic mixing với phrasing: đổi bài ở đầu câu, giữa hai bài hợp key.
- ❌ Bỏ một bài hay chỉ vì nó lệch key với bài trước.
- ❌ Đẩy key shift nhiều nấc làm bài méo tiếng.
- ❌ Coi harmonic mixing là luật bắt buộc cho mọi lần chuyển bài.

## Động tác thừa cần tránh

- **Kiểm tra key cho đoạn chỉ có trống:** trống gần như không có key; hai intro toàn kick chồng nhau không bao giờ chỏi.
- **Nhảy qua lại giữa các bài để tìm "đúng key" khi đang diễn:** chuẩn bị trước nhóm bài hợp key trong playlist.
- **Đổi key bài nào cũng đổi:** key shift làm âm thanh kém tự nhiên; chỉ dùng khi thật cần.

## Tư tưởng cũ cần bỏ: "phải mix đúng key 100%"

Harmonic mixing là công cụ giúp giai điệu hòa nhau, không phải luật. Nhiều lần chuyển bài hay nhất là cú cắt gọn giữa hai bài khác key, hoặc nối hai đoạn chỉ có trống. Hãy học vòng Camelot để hiểu vì sao hai bài hợp nhau, rồi để tai quyết định.

## Bài tập 20 phút

1. Đổi cách hiện key sang ký hiệu Camelot, phân tích lại thư viện.
2. Chọn một bài 8A (hoặc mã bất kỳ), tìm bốn bài theo bốn nước đi trong bảng.
3. Chồng đoạn giai điệu của từng bài lên bài gốc trong tai nghe.
4. Ghi lại nước đi nào nghe hòa nhất, nước đi nào bắt đầu chỏi.
5. Thử nối một cặp lệch key bằng cách hạ EQ mid và high.

## Bài tiếp theo

Đã chọn được bài hợp key, giờ học đưa hai bài về cùng tốc độ bằng tai: [beatmatch bằng tai](${lesson('beatmatch-bang-tai', 'vi')}). Nếu chưa đếm được câu nhạc, đọc lại [phrasing](${lesson('phrasing-dj', 'vi')}). Cả lộ trình ở [Học DJ từ số 0](${lesson('hoc-dj-tu-so-0', 'vi')}).`;

const en = `**Harmonic mixing** means choosing and joining tracks whose keys suit each other, so melodies, basslines and vocals do not clash when two tracks overlap. The Camelot wheel numbers the 24 keys as 1A–12A (minor) and 1B–12B (major) so they are easy to remember. After this lesson you can pick a next track in a matching key within seconds.

## What a key is, in plain words

Every track circles around a "home" note and an emotional colour: major keys tend to sound bright, minor keys darker and tenser. Most electronic dance music is written in minor keys. When you overlap two tracks in distant keys, their melodies pull towards two different homes and your ear hears them as out of tune, like two people singing two different songs at once.

You do not need to read music. DJ software analyses each track's key, and the Camelot wheel turns key matching into adding and subtracting on a clock face.

## The Camelot wheel: four safe moves

| Move | Example | How it feels |
| --- | --- | --- |
| Same code | 8A → 8A | A perfect match; overlap freely |
| Plus or minus one, same letter | 8A → 9A, 8A → 7A | Smooth; energy edges up or settles down |
| Switch letter, same number | 8A → 8B | A change of colour, from dark to bright or back |
| Plus two or plus seven | 8A → 10A, 8A → 3A | A "lift" of a whole step or a half step: use rarely, on purpose |

On the Camelot wheel, 8A is A minor and 8B is C major: a relative pair that shares the same notes. You only need to remember the number and the letter, not the note names.

## What you need

- DJ software that has analysed your library's keys (rekordbox, Serato DJ and Traktor all do).
- Ten tracks of one style with clear melodies or vocals.
- Headphones, to test overlaps before they reach the speakers.

## Step by step

### Step 1: Show keys in Camelot notation

- **Do:** in the software's settings, switch the key display to an alphanumeric notation (Camelot or Open Key style) instead of note names. Analyse any tracks that have no key yet.
- **Look at:** the Key column in the library on your laptop screen.
- **Listen for:** nothing yet; every track now carries a code such as 8A or 11B.

### Step 2: Find tracks that match the playing track

- **Do:** read the playing track's code, filter or sort the library by key, and look for the same code, plus or minus one, or the other letter with the same number.
- **Look at:** the Key and BPM columns side by side; choose a track that matches in key and sits close in tempo.
- **Listen for:** preview the candidate in your headphones; its mood suits the playing track.

### Step 3: Test the melodies together

- **Do:** beatmatch the two tracks, then let track B's melodic or vocal section run with track A in your headphones, with the cue mix blending cue and master.
- **Look at:** the cue mix knob on the controller, set to the middle so you hear both tracks.
- **Listen for:** the two melodies blend like one arrangement. If it sounds out of tune, sour or grating, the keys are clashing.

### Step 4: When you must join two tracks in clashing keys

- **Do:** overlap them only in drum-only sections (intros, outros), keep the incoming track's mid and high EQ down until the old track has left, or use key shift to move track B a step or two around the wheel.
- **Look at:** the mid and high EQ of the incoming channel, and the key shift control if your software has one.
- **Listen for:** at no point do both melodies sound loudly together; the listener only notices that the track has changed.

### Step 5: Watch the pitch fader when key lock is off

- **Do:** without key lock, every 6% or so of tempo change moves the key by about a half step. Switch key lock on for bigger pitch moves so the Camelot code stays true.
- **Look at:** the key lock (master tempo) button on the deck and the key shown on the deck.
- **Listen for:** after changing the tempo, the two tracks still blend the way they did in step 3.

${fig('en')}

## Signs you got it right

- You can lay track B's breakdown over the end of track A without a clash.
- You find two or three tracks in a matching key for the playing track in under a minute.
- You hear at once when two tracks are out of tune, before you even look at the codes.

## Common mistakes and fixes

| Mistake | What you hear or see | Fix |
| --- | --- | --- |
| Watching the key and forgetting the energy | It matches in key but the set sags | Choose tracks that match in key and in energy |
| Overlapping two vocals | Two lines talk over each other | Keep one vocal at a time |
| Key lock off on a big pitch move | The key code changes and the next track clashes | Turn key lock on or choose a track closer in tempo |
| Trusting key analysis blindly | Two tracks with the same code still sound off | Your ears have the final say |
| Using plus two or plus seven again and again | The set climbs forever and tires the ear | Use a lift once or twice a set |

## Dos and don'ts

- ✅ Put key codes in playlist names or tags so you can find them fast.
- ✅ Practise with a group of tracks in two or three neighbouring codes on the wheel.
- ✅ Combine harmonic mixing with phrasing: change on the phrase, between tracks in matching keys.
- ❌ Drop a great track just because it clashes with the one before.
- ❌ Push key shift so far that the track sounds warped.
- ❌ Treat harmonic mixing as a law for every transition.

## Wasted moves to drop

- **Checking keys for drum-only sections:** drums have almost no key; two kick-only intros never clash.
- **Jumping between tracks hunting for the "right key" mid-set:** prepare groups of matching tracks in your playlists beforehand.
- **Shifting the key of every track:** key shift makes the sound less natural; use it only when you really need it.

## Old idea to drop: "you must mix in key every time"

Harmonic mixing is a tool for making melodies blend, not a law. Many of the best transitions are a clean cut between tracks in different keys, or a blend of two drum-only sections. Learn the Camelot wheel to understand why two tracks work together, then let your ears decide.

## A 20-minute drill

1. Switch the key display to Camelot notation and re-analyse your library.
2. Take a track in 8A (or any code) and find four tracks, one for each move in the table.
3. Lay each one's melodic section over the original in your headphones.
4. Note which move blends best and which one starts to clash.
5. Try joining a clashing pair by keeping the mid and high EQ down.

## Next lesson

Now that you can pick tracks in matching keys, learn to bring two tracks to the same speed by ear: [beatmatching by ear](${lesson('beatmatch-bang-tai', 'en')}). If you cannot count phrases yet, go back to [phrasing](${lesson('phrasing-dj', 'en')}). The whole path is at [Learn to DJ from zero](${lesson('hoc-dj-tu-so-0', 'en')}).`;

export const harmonicMixing: PackPost = {
  key: 'dj-skills/harmonic-mixing',
  slug: 'harmonic-mixing',
  category: 'dj',
  lang: 'vi',
  title: {
    vi: 'Harmonic mixing là gì? Mix theo key với vòng Camelot',
    en: 'Harmonic mixing: mix in key with the Camelot wheel',
  },
  excerpt: {
    vi: 'Harmonic mixing là nối những bài hợp key để giai điệu không chỏi. Cách đọc vòng Camelot, bốn nước đi an toàn, nối bài lệch key bằng EQ và vai trò key lock.',
    en: 'Harmonic mixing joins tracks in matching keys so melodies never clash. How to read the Camelot wheel, four safe moves, blending clashing keys and key lock.',
  },
  cover: coverOf(DJ_MEDIA.harmonic),
  styles: [],
  facts: lessonFacts({
    module: MODULES.ears, minutes: '20',
    gear: { vi: 'Phần mềm đã phân tích key, 10 bài có giai điệu rõ, tai nghe', en: 'Software with keys analysed, 10 melodic tracks, headphones' },
    first: { vi: 'Phrasing: đếm câu 32 phách', en: 'Phrasing: counting 32-beat phrases' },
    after: { vi: 'Chọn bài kế tiếp hợp key bằng vòng Camelot', en: 'Pick the next track in key with the Camelot wheel' },
  }),
  body: { vi, en },
  faq: [
    { q: { vi: 'Harmonic mixing là gì?', en: 'What is harmonic mixing?' }, a: { vi: 'Harmonic mixing là kỹ thuật nối những bài có key hợp nhau để giai điệu, bass và giọng hát không chỏi khi chồng bài. DJ dùng phần mềm phân tích key và vòng Camelot để chọn bài kế tiếp: cùng mã, cộng trừ 1 hoặc đổi chữ cùng số.', en: 'Harmonic mixing is joining tracks whose keys suit each other, so melodies, basslines and vocals do not clash when they overlap. DJs use key analysis and the Camelot wheel to pick the next track: the same code, one step either way, or the other letter.' } },
    { q: { vi: 'Vòng Camelot là gì?', en: 'What is the Camelot wheel?' }, a: { vi: 'Vòng Camelot là cách đánh số 24 key nhạc thành 12 số và hai chữ: A cho giọng thứ, B cho giọng trưởng. Các mã kề nhau trên vòng hợp nhau, nên DJ chỉ cần cộng trừ 1 hoặc đổi chữ để chọn bài, không cần biết nhạc lý.', en: 'The Camelot wheel numbers the 24 musical keys with twelve numbers and two letters: A for minor, B for major. Neighbouring codes on the wheel work together, so a DJ only needs to step one number or switch the letter, with no music theory needed.' } },
    { q: { vi: 'Có bắt buộc phải mix đúng key không?', en: 'Do I always have to mix in key?' }, a: { vi: 'Không. Hai đoạn chỉ có trống không bao giờ chỏi, và nhiều cú chuyển hay là cú cắt gọn giữa hai key khác nhau. Harmonic mixing quan trọng nhất khi bạn chồng lâu hai đoạn có giai điệu hoặc giọng hát.', en: 'No. Two drum-only sections never clash, and many great transitions are clean cuts between different keys. Harmonic mixing matters most when you overlap two melodic or vocal sections for a long time.' } },
    { q: { vi: 'Pitch fader có làm đổi key không?', en: 'Does the pitch fader change the key?' }, a: { vi: 'Có, khi tắt key lock: tăng hoặc giảm khoảng 6% tốc độ làm key lệch khoảng nửa cung, và mã Camelot đổi theo. Bật key lock (master tempo) để giữ key khi chỉnh pitch, nhưng chỉnh quá xa vẫn làm âm thanh kém tự nhiên.', en: 'Yes, with key lock off: moving the tempo by about 6% shifts the key by roughly a half step, and the Camelot code changes with it. Switch on key lock (master tempo) to hold the key while you change pitch, though very large moves still sound unnatural.' } },
    { q: { vi: 'Phần mềm phân tích key có chính xác không?', en: 'Is software key analysis accurate?' }, a: { vi: 'Phần lớn trường hợp đủ dùng, nhưng không hoàn hảo, nhất là với bài nhiều tiếng ồn, ít giai điệu hoặc đổi key giữa bài. Hãy coi mã key là gợi ý và luôn nghe thử trong tai nghe trước khi chồng bài ra loa.', en: 'Good enough most of the time, but not perfect, especially with noisy tracks, tracks with little melody or tracks that change key midway. Treat the key code as a suggestion and always test the overlap in your headphones before it reaches the speakers.' } },
  ],
  sources: [
    { title: 'Harmonic mixing', url: wiki('Harmonic mixing'), publisher: 'Wikipedia' },
    { title: 'Camelot Wheel', url: 'https://mixedinkey.com/camelot-wheel/', publisher: 'Mixed In Key' },
    { title: 'rekordbox FAQ', url: 'https://rekordbox.com/en/support/faq/', publisher: 'AlphaTheta' },
    { title: 'Traktor', url: 'https://www.native-instruments.com/en/products/traktor/', publisher: 'Native Instruments' },
  ],
  tracks: [],
};
