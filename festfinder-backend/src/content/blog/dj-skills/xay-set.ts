import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, DJ_MEDIA } from './media.ts';
import { figure, lesson, lessonFacts, MODULES, wiki } from './shared.ts';

const fig = (lang: 'vi' | 'en') => figure(DJ_MEDIA.vietnam,
  { vi: 'Đám đông nhảy trong club dưới ánh đèn', en: 'A crowd dancing in a club under the lights' },
  { vi: 'Năng lượng của sàn nhảy lên xuống theo set: đọc nó trước khi đi tiếp', en: 'A dance floor’s energy rises and falls with the set: read it before you move on' }, lang);

const vi = `**Xây set DJ** là chọn và sắp xếp khoảng 8–15 bài thành một hành trình 30–60 phút có mở đầu, cao trào và kết thúc, nối bằng những kiểu chuyển bài hợp với từng cặp bài. Set hay không phải vì "cháy" từ đầu tới cuối, mà vì năng lượng lên xuống có chủ đích. Sau bài này bạn lên được set đầu tiên của mình.

## Energy curve: hình dáng của một set

| Đoạn | Thời gian (set 60 phút) | Năng lượng | Bạn chơi gì |
| --- | --- | --- | --- |
| Mở | 0–10 phút | Vừa phải | Bài có groove rõ, ít drop lớn, để người nghe vào nhịp |
| Lên | 10–25 phút | Tăng dần | Thêm percussion, vocal, bài có build-up rõ hơn |
| Cao trào | 25–45 phút | Cao nhất | Những bài mạnh nhất, đã được chờ đợi |
| Thở | Một hai bài giữa cao trào | Hạ nhẹ | Một breakdown dài hoặc một bài sâu hơn, để lần lên sau mạnh hơn |
| Kết | 45–60 phút | Đỉnh cuối hoặc dịu xuống | Một bài đáng nhớ, hợp với người chơi sau bạn |

Hãy chấm năng lượng cho mỗi bài từ 1 tới 10 và ghi vào tag. Khi xếp set, bạn nhìn dãy số 4-5-5-6-7-6-8-9-7-9 thay vì tên bài, và thấy ngay chỗ nào phẳng, chỗ nào tụt.

Vai trò cũng quyết định hình dáng. DJ mở màn (warm-up) giữ năng lượng vừa phải để phòng ấm dần, không chơi những bài lớn nhất trước người chơi chính. DJ chơi giờ cao điểm mới là người đẩy lên đỉnh.

## Các kiểu chuyển bài

| Kiểu | Làm thế nào | Hợp khi |
| --- | --- | --- |
| Cut (cắt) | Đổi hẳn sang bài mới ở phách 1 của câu | Hai bài khác tốc độ hoặc key, cần bất ngờ |
| Blend | Chồng hai bài 16–32 nhịp, đổi bass bằng EQ | House, techno, hai bài hợp key |
| EQ swap | Đổi low, rồi mid, rồi high giữa hai bài theo từng câu | Muốn chuyển êm, kéo dài |
| Loop | Lặp 4 hoặc 8 nhịp outro của bài cũ để có thêm thời gian | Bài cũ hết outro quá sớm |
| Hot cue | Vào bài mới thẳng từ drop hoặc breakdown đã đánh dấu | Đẩy năng lượng ngay, bỏ qua intro |
| Echo out | Bật echo ở phách cuối, kéo bài cũ xuống | Kết thúc gọn, chuyển sang dòng nhạc khác |

Ba kiểu đầu là nền tảng; ba kiểu sau là nâng cao, dùng khi đã chắc phrasing và EQ.

## Bạn cần chuẩn bị

- Thư viện đã gắn tag BPM, key, dòng nhạc và năng lượng (xem [file nhạc và thư viện](${lesson('file-nhac-dj', 'vi')})).
- Khoảng 20–25 bài cho một set 60 phút: bài chính và bài dự phòng.
- Phần mềm ghi âm sẵn trong phần mềm DJ.

## Các bước thực hiện

### Bước 1: Xác định bối cảnh

- **Làm gì:** trả lời bốn câu: chơi ở đâu, cho ai, bao lâu, ai chơi trước và sau bạn. Set 30 phút ở bar khác set 60 phút giờ cao điểm ở club.
- **Nhìn đâu trên controller:** chưa cần; viết ra giấy hoặc ghi chú.
- **Nghe gì để biết đúng:** nghe lại vài bài của người chơi trước bạn để biết bạn bắt đầu từ năng lượng nào.

### Bước 2: Chọn xương sống trước

- **Làm gì:** chọn bài mở, bài kết và hai ba bài cao trào. Đây là những điểm cố định của set.
- **Nhìn đâu:** playlist mới trong phần mềm, đặt tên theo ngày và nơi chơi.
- **Nghe gì để biết đúng:** nghe năm bài này nối nhau trong đầu: chúng kể một câu chuyện từ đầu tới cuối.

### Bước 3: Điền vào giữa theo năng lượng, BPM và key

- **Làm gì:** thêm bài để nối các điểm cố định, mỗi bài nhích năng lượng, BPM hoặc key một chút. Dùng [vòng Camelot](${lesson('harmonic-mixing', 'vi')}) cho những cặp chồng lâu.
- **Nhìn đâu:** cột năng lượng, BPM và key cạnh nhau trong playlist.
- **Nghe gì để biết đúng:** dãy số năng lượng có hình dáng như bảng energy curve, không phẳng, không tụt đột ngột.

### Bước 4: Lên kế hoạch cho từng lần chuyển bài

- **Làm gì:** với mỗi cặp bài, chọn kiểu chuyển (cut, blend, EQ swap…) và đặt hot cue ở điểm bắt đầu chuyển của bài cũ và điểm vào của bài mới.
- **Nhìn đâu:** hot cue trên waveform của từng bài.
- **Nghe gì để biết đúng:** thử từng lần chuyển trong tai nghe; lần nào vấp thì đổi kiểu hoặc đổi bài.

### Bước 5: Tập cả set, ghi âm, giữ bài dự phòng

- **Làm gì:** chơi trọn set và ghi âm. Giữ một crate dự phòng gồm vài bài nhẹ hơn và vài bài mạnh hơn cho mỗi đoạn, vì khi chơi thật bạn có thể phải đổi kế hoạch theo phòng.
- **Nhìn đâu:** nút ghi âm và playlist dự phòng ngay dưới playlist chính.
- **Nghe gì để biết đúng:** khi nghe lại, năng lượng đi lên có chủ đích; không có đoạn nào bạn thấy chán.

${fig('vi')}

## Dấu hiệu bạn làm đúng

- Dãy số năng lượng của set có lên, có thở, có đỉnh.
- Bạn biết trước kiểu chuyển cho mỗi cặp bài, nhưng sẵn sàng đổi.
- Bản ghi nghe như một câu chuyện, không như một danh sách bài.

## Lỗi thường gặp và cách sửa

| Lỗi | Nghe hoặc nhìn ra sao | Cách sửa |
| --- | --- | --- |
| Mở set bằng bài mạnh nhất | Phòng mệt sau 15 phút, không còn chỗ để lên | Để bài mạnh nhất cho đoạn cao trào |
| Năng lượng phẳng | Mọi bài đều ở mức 7, nghe đơn điệu | Xếp lại theo dãy số lên xuống |
| Chuyển bài cùng một kiểu suốt set | Set đều đều, đoán được | Xen cut, blend và echo out |
| Không có bài dự phòng | Phòng không hợp mà không biết chơi gì | Giữ crate dự phòng nhẹ hơn và mạnh hơn |
| Chơi đúng 100% kế hoạch | Không để ý phòng đang phản ứng thế nào | Kế hoạch là bản đồ, đám đông là đường thật |

## Do & Don't

- ✅ Chấm năng lượng 1–10 cho mỗi bài.
- ✅ Chuẩn bị nhiều hơn số bài bạn cần.
- ✅ Hỏi trước về người chơi trước và sau bạn.
- ❌ Chơi những bài lớn nhất khi đang là DJ mở màn.
- ❌ Chép nguyên set của DJ khác rồi đăng như của mình.
- ❌ Bỏ một bài hay chỉ vì nó "không hot".

## Động tác thừa cần tránh

| Động tác thừa | Vì sao thừa | Thay bằng |
| --- | --- | --- |
| Lục thư viện tìm bài kế tiếp giữa lúc chuyển bài | Dễ trễ phrase, mất tập trung | Chọn bài kế tiếp ngay khi bài hiện tại vừa vào |
| Loại bài chỉ vì "không hot" | Bỏ lỡ màu sắc riêng của set | Chọn theo energy curve và theo đám đông |
| Sửa thứ tự set ngay trước giờ chơi | Mất phần chuẩn bị đã tập | Chỉ đổi bài dự phòng, giữ xương sống |

## Tư tưởng cũ cần bỏ: "set phải cháy từ đầu tới cuối"

Một set lúc nào cũng ở mức cao nhất khiến đỉnh không còn là đỉnh, và người nghe mệt trước khi bạn kịp chơi bài hay nhất. Những khoảng thở làm cho lần lên sau mạnh hơn. Đọc phòng quan trọng hơn kế hoạch: biết khi nào nên hạ nhịp, khi nào nên thả bài lớn.

## Bài tập 20 phút

1. Chọn 12 bài, chấm năng lượng 1–10 cho từng bài.
2. Chọn bài mở, bài kết và hai bài cao trào.
3. Xếp các bài còn lại để dãy số có lên, có thở, có đỉnh.
4. Ghi kiểu chuyển cho mỗi cặp bài.
5. Chơi thử ba lần chuyển khó nhất, ghi âm và nghe lại.

## Bài tiếp theo

Set đã sẵn sàng, giờ ghi lại và chia sẻ đúng cách: [ghi âm và đăng mix lên SoundCloud, Mixcloud, YouTube](${lesson('ghi-am-dang-mix', 'vi')}). Để set hợp với phòng ở Việt Nam, đọc [nghề DJ ở Việt Nam](${lesson('dj-viet-nam', 'vi')}). Cả lộ trình ở [Học DJ từ số 0](${lesson('hoc-dj-tu-so-0', 'vi')}).`;

const en = `**Building a DJ set** means choosing and ordering roughly 8–15 tracks into a 30–60 minute journey with an opening, a peak and an ending, joined by transitions that suit each pair of tracks. A good set is not "on fire" from start to finish; its energy rises and falls on purpose. After this lesson you can plan your first set.

## The energy curve: the shape of a set

| Section | Time (60-minute set) | Energy | What you play |
| --- | --- | --- | --- |
| Opening | 0–10 minutes | Moderate | Tracks with a clear groove and few big drops, so listeners find the beat |
| Rise | 10–25 minutes | Building | More percussion, vocals, tracks with clearer build-ups |
| Peak | 25–45 minutes | Highest | Your strongest tracks, the ones people wait for |
| Breather | One or two tracks within the peak | A little lower | A long breakdown or a deeper track, so the next climb hits harder |
| Ending | 45–60 minutes | A last high or a wind-down | A memorable track that suits whoever plays after you |

Score each track's energy from 1 to 10 and write it into a tag. When you order a set, you read a row of numbers like 4-5-5-6-7-6-8-9-7-9 instead of titles, and you see at once where it goes flat or sags.

Your role shapes the curve too. An opening (warm-up) DJ keeps the energy moderate so the room warms up gradually, and never plays the biggest tracks before the headliner. The peak-time DJ is the one who takes it to the top.

## Types of transition

| Type | How | When it suits |
| --- | --- | --- |
| Cut | Switch straight to the new track on beat one of a phrase | Tracks in different tempos or keys, or when you want surprise |
| Blend | Overlap two tracks for 16–32 bars and swap the bass with the EQ | House, techno, two tracks in matching keys |
| EQ swap | Swap the low, then the mid, then the high between tracks, phrase by phrase | A smooth, extended change |
| Loop | Loop 4 or 8 bars of the old track's outro to buy time | The old track's outro runs out too soon |
| Hot cue | Bring the new track in straight from a marked drop or breakdown | Raising the energy at once, skipping the intro |
| Echo out | Switch on an echo on the last beat and pull the old track down | A clean ending, a move to another style |

The first three are the foundation; the last three are advanced, for when your phrasing and EQ are solid.

## What you need

- A library tagged with BPM, key, style and energy (see [file formats and your library](${lesson('file-nhac-dj', 'en')})).
- About 20–25 tracks for a 60-minute set: the main ones and the backups.
- The recorder built into your DJ software.

## Step by step

### Step 1: Know the context

- **Do:** answer four questions: where you are playing, for whom, for how long, and who plays before and after you. A 30-minute bar set is not a 60-minute peak-time club set.
- **Look at:** nothing on the controller yet; write it on paper or in a note.
- **Listen for:** a few tracks the DJ before you plays, so you know which energy you start from.

### Step 2: Choose the backbone first

- **Do:** pick the opener, the closer and two or three peak tracks. These are the fixed points of the set.
- **Look at:** a new playlist in the software, named after the date and the venue.
- **Listen for:** these five tracks played in your head one after another; they tell a story from beginning to end.

### Step 3: Fill the gaps by energy, BPM and key

- **Do:** add tracks that link the fixed points, each one nudging the energy, BPM or key a little. Use [the Camelot wheel](${lesson('harmonic-mixing', 'en')}) for pairs you will overlap for a long time.
- **Look at:** the energy, BPM and key columns side by side in the playlist.
- **Listen for:** the row of energy numbers has the shape of the energy curve table, neither flat nor suddenly sagging.

### Step 4: Plan each transition

- **Do:** for each pair of tracks, choose a transition type (cut, blend, EQ swap…) and set hot cues where the change starts in the old track and where the new track comes in.
- **Look at:** the hot cues on each track's waveform.
- **Listen for:** try each transition in your headphones; when one stumbles, change the type or the track.

### Step 5: Rehearse the whole set, record it, keep backups

- **Do:** play the whole set and record it. Keep a backup crate with a few lighter and a few stronger tracks for each section, because when you play for real you may have to change the plan to suit the room.
- **Look at:** the record button, and the backup playlist right under the main one.
- **Listen for:** on playback, the energy climbs on purpose and there is no stretch where you get bored.

${fig('en')}

## Signs you got it right

- The set's row of energy numbers rises, breathes and peaks.
- You know the transition for each pair in advance, but you are ready to change it.
- The recording sounds like a story, not a list of tracks.

## Common mistakes and fixes

| Mistake | What you hear or see | Fix |
| --- | --- | --- |
| Opening with your strongest track | The room is tired after 15 minutes, with nowhere left to climb | Save the strongest tracks for the peak |
| Flat energy | Every track sits at 7 and it all sounds the same | Reorder by a row of numbers that rises and falls |
| One transition type all set long | An even, predictable set | Mix cuts, blends and echo outs |
| No backups | The room is not responding and you do not know what to play | Keep a lighter and a stronger backup crate |
| Following the plan to the letter | You miss how the room is reacting | The plan is the map; the crowd is the road |

## Dos and don'ts

- ✅ Score every track's energy from 1 to 10.
- ✅ Prepare more tracks than you need.
- ✅ Ask beforehand about the DJs before and after you.
- ❌ Play the biggest tracks when you are the warm-up DJ.
- ❌ Copy another DJ's set track for track and post it as your own.
- ❌ Drop a great track just because it is "not a hit".

## Wasted moves to drop

| Wasted move | Why it is wasted | Do this instead |
| --- | --- | --- |
| Digging for the next track in the middle of a transition | You miss the phrase and lose focus | Choose the next track as soon as the current one is in |
| Dropping tracks because they are "not hot" | You lose the set's own colour | Choose by the energy curve and the crowd |
| Reordering the set just before you play | You lose the preparation you rehearsed | Swap only backups and keep the backbone |

## Old idea to drop: "a set must be on fire from start to finish"

A set that always sits at full energy has no real peak, and listeners tire before you play your best track. Breathers make the next climb stronger. Reading the room matters more than the plan: know when to bring the energy down and when to drop the big one.

## A 20-minute drill

1. Pick 12 tracks and score each one's energy from 1 to 10.
2. Choose the opener, the closer and two peak tracks.
3. Order the rest so the numbers rise, breathe and peak.
4. Write down the transition type for each pair.
5. Play the three hardest transitions, record them and listen back.

## Next lesson

Your set is ready; now record it and share it the right way: [recording and posting a mix on SoundCloud, Mixcloud and YouTube](${lesson('ghi-am-dang-mix', 'en')}). To fit your set to rooms in Vietnam, read [DJing in Vietnam](${lesson('dj-viet-nam', 'en')}). The whole path is at [Learn to DJ from zero](${lesson('hoc-dj-tu-so-0', 'en')}).`;

export const xaySet: PackPost = {
  key: 'dj-skills/xay-set',
  slug: 'xay-set-dj',
  category: 'dj',
  lang: 'vi',
  title: {
    vi: 'Xây set DJ 30–60 phút: chọn bài, energy curve, transition',
    en: 'Build a 30–60 minute DJ set: track order and energy curve',
  },
  excerpt: {
    vi: 'Cách xây set DJ 30–60 phút: energy curve, chọn bài mở, cao trào và kết, chấm năng lượng 1–10, sáu kiểu chuyển bài, bài dự phòng và đọc phòng khi chơi thật.',
    en: 'How to build a 30–60 minute DJ set: the energy curve, opener, peak and closer, scoring energy 1–10, six transition types, backup tracks and reading the room.',
  },
  cover: coverOf(DJ_MEDIA.set),
  styles: [],
  facts: lessonFacts({
    module: MODULES.sets, minutes: '30',
    gear: { vi: 'Thư viện đã gắn tag, 20–25 bài, phần mềm ghi âm', en: 'A tagged library, 20–25 tracks, a recorder' },
    first: { vi: 'Beatmatch, EQ mixing và phrasing', en: 'Beatmatching, EQ mixing and phrasing' },
    after: { vi: 'Lên set 30–60 phút có energy curve rõ ràng', en: 'Plan a 30–60 minute set with a clear energy curve' },
  }),
  body: { vi, en },
  faq: [
    { q: { vi: 'Một set DJ 60 phút cần bao nhiêu bài?', en: 'How many tracks does a 60-minute DJ set need?' }, a: { vi: 'Thường khoảng 12–15 bài nếu mỗi bài chơi 4–5 phút; nhiều hơn nếu bạn chuyển bài nhanh. Hãy chuẩn bị thêm khoảng một nửa số đó làm bài dự phòng, vì khi chơi thật bạn có thể phải đổi hướng theo phòng.', en: 'Usually around 12–15 if each track plays for 4–5 minutes, more if you mix quickly. Prepare about half as many again as backups, because when you play for real you may need to change direction to suit the room.' } },
    { q: { vi: 'Energy curve là gì?', en: 'What is an energy curve?' }, a: { vi: 'Energy curve là hình dáng năng lượng của set theo thời gian: mở vừa phải, lên dần, cao trào, có khoảng thở, rồi kết. Chấm năng lượng 1–10 cho mỗi bài giúp bạn nhìn thấy hình dáng đó và tránh set phẳng hoặc tụt đột ngột.', en: 'An energy curve is the shape of a set’s energy over time: a moderate opening, a gradual rise, a peak with breathers, then an ending. Scoring each track’s energy from 1 to 10 lets you see that shape and avoid a flat set or sudden sags.' } },
    { q: { vi: 'Nên mở set bằng bài gì?', en: 'What should I open a set with?' }, a: { vi: 'Một bài có groove rõ, năng lượng vừa phải, ít drop lớn, hợp với chỗ người chơi trước dừng lại. Nếu bạn chơi đầu tiên, hãy để phòng ấm dần: những bài mạnh nhất để dành cho đoạn cao trào hoặc cho người chơi chính.', en: 'A track with a clear groove, moderate energy and few big drops that picks up where the previous DJ left off. If you play first, let the room warm up gradually and save your strongest tracks for the peak or for the headliner.' } },
    { q: { vi: 'Có nên chuẩn bị set trước hay chơi ngẫu hứng?', en: 'Should I plan a set or improvise?' }, a: { vi: 'Người mới nên chuẩn bị xương sống trước: bài mở, bài kết, vài bài cao trào và kiểu chuyển cho từng cặp. Giữ bài dự phòng để ngẫu hứng khi phòng phản ứng khác dự đoán. Càng có kinh nghiệm, phần ngẫu hứng càng nhiều.', en: 'Beginners should plan a backbone: an opener, a closer, a few peak tracks and a transition for each pair. Keep backups so you can improvise when the room reacts differently from what you expected. The more experience you have, the more you improvise.' } },
    { q: { vi: 'Transition nào dễ nhất cho người mới?', en: 'Which transition is easiest for a beginner?' }, a: { vi: 'Blend có đổi bass bằng EQ với hai bài house hoặc techno hợp key là dễ và hiệu quả nhất. Cut ở phách 1 của câu cũng dễ, hợp khi hai bài khác tốc độ. Loop, hot cue và echo out là bước tiếp theo khi phrasing đã chắc.', en: 'A blend with an EQ bass swap between two house or techno tracks in matching keys is the easiest and most effective. A cut on beat one of a phrase is also easy and suits tracks at different tempos. Loops, hot cues and echo outs come next, once your phrasing is solid.' } },
  ],
  sources: [
    { title: 'DJ mix', url: wiki('DJ mix'), publisher: 'Wikipedia' },
    { title: 'Disc jockey', url: wiki('Disc jockey'), publisher: 'Wikipedia' },
    { title: 'Camelot Wheel', url: 'https://mixedinkey.com/camelot-wheel/', publisher: 'Mixed In Key' },
    { title: 'rekordbox FAQ', url: 'https://rekordbox.com/en/support/faq/', publisher: 'AlphaTheta' },
    { title: 'Beatport', url: 'https://www.beatport.com/', publisher: 'Beatport' },
  ],
  tracks: [],
};
