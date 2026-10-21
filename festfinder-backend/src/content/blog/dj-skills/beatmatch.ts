import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, DJ_MEDIA } from './media.ts';
import { figure, lesson, lessonFacts, MODULES, wiki } from './shared.ts';

const fig = (lang: 'vi' | 'en') => figure(DJ_MEDIA.record,
  { vi: 'Tai nghe DJ đặt trên controller', en: 'DJ headphones resting on a controller' },
  { vi: 'Beatmatch bằng tai bắt đầu từ tai nghe: một bên nghe bài kế tiếp, một bên nghe loa', en: 'Beatmatching by ear starts in the headphones: one ear on the next track, the other on the speakers' }, lang);

const vi = `**Beatmatch bằng tai** là chỉnh hai bài về cùng tốc độ và cùng phách bằng cách nghe, không dựa vào nút sync. Bạn dùng pitch fader để sửa tốc độ và jog wheel để sửa vị trí phách. Sau bài này bạn mix được hai bài mà kick không bị "phách lệch", nghe khít như một tiếng.

## Bạn cần chuẩn bị

- Controller bất kỳ có hai kênh, mỗi deck có pitch fader và jog wheel.
- Hai bài cùng dòng nhạc, BPM chênh nhau không quá 2 (ví dụ 124 và 125,5).
- Tai nghe chụp kín tai, nút cue tai nghe của deck chuẩn bị đã bật.
- Tắt sync, che con số BPM trên màn hình nếu bạn muốn luyện tai thật sự.

Trước khi bắt đầu, nhớ hai việc khác nhau: **pitch fader sửa tốc độ** (bài nào chạy nhanh hơn), còn **jog wheel sửa vị trí** (phách đang sớm hay muộn). Phần lớn người mới rối vì dùng jog để sửa tốc độ, nên phải xoay mãi.

| | Pitch fader | Jog wheel |
| --- | --- | --- |
| Sửa gì | Tốc độ: bài nào chạy nhanh hơn | Vị trí: phách đang sớm hay muộn |
| Tác dụng | Lâu dài, tới khi bạn kéo lại | Trong chốc lát, buông tay là hết |
| Dùng khi nào | Tiếng lệch cứ giãn ra dần | Tốc độ đã đúng mà hai kick vẫn lệch một chút |

## Các bước thực hiện

### Bước 1: Đặt cue ở phách 1 của bài B

- **Làm gì:** nạp bài B vào deck phải, nhấn CUE ở kick đầu tiên sau phần mở bài (xem [bài Cue point](${lesson('cue-point', 'vi')})).
- **Nhìn đâu trên controller:** nút CUE của deck phải, waveform phóng to.
- **Nghe gì để biết đúng:** giữ CUE, một tiếng kick thật, đầy và rõ vang lên ngay, không phải tiếng trống lấp.

### Bước 2: Chạy bài A, đếm bốn phách, bấm play bài B

- **Làm gì:** cho bài A chạy trên loa. Đếm "1-2-3-4" theo kick của A, bấm play bài B ở phách 1 của nhịp kế tiếp.
- **Nhìn đâu:** không nhìn màn hình; nhìn tay bạn trên nút play.
- **Nghe gì để biết đúng:** trong tai nghe, kick của B rơi cùng kick của A trong vài phách đầu.

### Bước 3: Nghe xem bài nào nhanh, bài nào chậm

- **Làm gì:** nghe một lúc. Nếu kick bài B dần "đi trước" kick bài A, B đang nhanh hơn: kéo pitch fader của B xuống nhẹ. Nếu B dần "đi sau", đẩy pitch lên nhẹ. Chỉnh từng chút, khoảng 0,1–0,2% mỗi lần, rồi nghe lại.
- **Nhìn đâu:** pitch fader của deck B; tay đặt sẵn, chỉ di chuyển rất ít.
- **Nghe gì để biết đúng:** tiếng "thịch-thịch" như ngựa phi (hai kick lệch nhau) giãn ra chậm dần rồi không còn giãn thêm.

### Bước 4: Dùng jog wheel để đẩy phách vào chỗ

- **Làm gì:** khi tốc độ đã gần đúng mà hai kick vẫn lệch nhau một chút, xoay nhẹ mép jog wheel: xoay xuôi để kéo B lên trước, xoay ngược để kéo B lùi lại.
- **Nhìn đâu:** mép ngoài của jog wheel; không chạm mặt trên nếu jog đang ở chế độ vinyl, vì chạm mặt trên sẽ làm bài dừng hoặc scratch.
- **Nghe gì để biết đúng:** hai kick "dính" vào nhau, nghe như một tiếng dày hơn.

### Bước 5: Giữ khớp suốt một câu nhạc

- **Làm gì:** để hai bài chạy cùng nhau ít nhất 32 phách trong tai nghe. Nếu tiếng lệch quay lại, tốc độ vẫn chưa đúng hẳn: chỉnh pitch thêm một chút, không chỉ nudge.
- **Nhìn đâu:** vẫn không nhìn màn hình; tai bạn là đồng hồ.
- **Nghe gì để biết đúng:** sau 32 phách, hai kick vẫn khít, không có tiếng lạc nhịp lặp lại.

${fig('vi')}

## Mẹo nghe: một tai trong, một tai ngoài

Đeo tai nghe một bên để nghe bài B, tai kia để trống nghe bài A từ loa. Cách này giống hệt khi chơi ở club, nơi loa booth phát bài đang chạy. Nếu controller có núm cue mix, bạn cũng có thể để giữa để nghe cả hai bài trong tai nghe khi mới tập.

## Dấu hiệu bạn làm đúng

- Kick của hai bài chồng khít, nghe như một tiếng dày hơn.
- Không còn tiếng "lạc nhịp" lặp lại sau 32 phách.
- Bạn biết ngay phải kéo pitch lên hay xuống chỉ sau vài phách nghe.

## Lỗi thường gặp và cách sửa

| Lỗi | Nghe hoặc nhìn ra sao | Cách sửa |
| --- | --- | --- |
| Đếm sai phách 1 | Cue lệch, bài vào lạc | Nghe lại từ đầu intro, cue ở kick thật đầu tiên |
| Chỉnh pitch quá tay | Bài đổi tốc độ rõ, lệch sang phía ngược lại | Chỉnh từng 0,1–0,2% |
| Dùng jog để sửa tốc độ | Vừa khớp xong lại lệch | Sửa tốc độ bằng pitch fader, jog chỉ để sửa vị trí |
| Chạm mặt trên jog | Bài dừng hoặc kêu rít | Chỉ chạm mép, hoặc tắt chế độ vinyl khi tập |
| Tai nghe quá to | Tai mỏi, khó nghe lệch nhỏ | Hạ tai nghe, để vừa đủ nghe rõ kick |

## Do & Don't

- ✅ Tập với hai bài cùng dòng, BPM gần nhau.
- ✅ Nghe bằng một tai monitor, một tai cue.
- ✅ Tập mỗi ngày 20 phút với cùng hai bài trong một tuần.
- ❌ Tập với hai bài BPM xa nhau ngay từ đầu.
- ❌ Hạ volume monitor quá nhỏ để "nghe cho xong".
- ❌ Nhìn waveform để beatmatch thay vì nghe.

## Động tác thừa cần tránh

- **Vặn EQ khi chưa beatmatch xong:** làm rối tai. Beatmatch trước, EQ sau.
- **Bật nhiều effect:** effect che lỗi beatmatch thay vì sửa nó.
- **Xoay jog liên tục khi chưa cần:** mỗi lần chạm là một lần làm lệch thêm. Chỉ nudge khi nghe lệch.

## Tư tưởng cũ cần bỏ: "sync là gian lận"

Học beatmatch bằng tai không phải để bỏ sync, mà để hiểu sync làm gì và tự sửa được khi nó sai (beatgrid lệch, bài có tay trống thật, đầu CDJ không bật sync). Khi đã beatmatch được bằng tai, dùng sync để rảnh tay cho EQ và đọc phòng là lựa chọn hoàn toàn chính đáng. Đọc tiếp [nút sync: khi nào nên và không nên dùng](${lesson('nut-sync', 'vi')}).

## Bài tập 20 phút

1. Che con số BPM, đặt pitch fader của cả hai deck về 0.
2. Đẩy pitch của bài B lệch đi một chút bất kỳ (không nhìn số).
3. Bấm play B ở phách 1, nghe và sửa bằng pitch fader cho tới khi khớp.
4. Giữ khớp 32 phách, rồi mở che xem chênh lệch còn bao nhiêu.
5. Lặp lại năm lần, ghi thời gian mỗi lần để thấy mình nhanh dần.

## Bài tiếp theo

Đã beatmatch bằng tai, giờ học khi nào nên giao việc đó cho máy: [nút sync: khi nào nên và không nên dùng](${lesson('nut-sync', 'vi')}). Sau đó học [EQ mixing](${lesson('eq-mixing', 'vi')}) để hai bài chồng lên nhau mà không đục. Cả lộ trình ở [Học DJ từ số 0](${lesson('hoc-dj-tu-so-0', 'vi')}).`;

const en = `**Beatmatching by ear** means bringing two tracks to the same speed and the same beat by listening, without relying on the sync button. You use the pitch fader to fix the speed and the jog wheel to fix where the beat sits. After this lesson you can mix two tracks without the kicks drifting apart, locked together like one sound.

## What you need

- Any two-channel controller with a pitch fader and a jog wheel on each deck.
- Two tracks of the same style, no more than 2 BPM apart (for example 124 and 125.5).
- Closed-back headphones, with the headphone cue of the deck you are preparing switched on.
- Sync switched off, and the BPM numbers covered if you really want to train your ears.

Before you start, keep two different jobs apart: **the pitch fader fixes speed** (which track runs faster), while **the jog wheel fixes position** (whether the beat is early or late). Most beginners struggle because they use the jog wheel to fix speed, so they have to keep turning it forever.

| | Pitch fader | Jog wheel |
| --- | --- | --- |
| Fixes | Speed: which track runs faster | Position: whether the beat is early or late |
| Effect | Lasting, until you move it back | Momentary, gone when you let go |
| When to use it | The drift keeps widening | The speed is right but the kicks are still slightly apart |

## Step by step

### Step 1: Set a cue on beat one of track B

- **Do:** load track B on the right deck and press CUE on the first kick after the opening (see [the cue point lesson](${lesson('cue-point', 'en')})).
- **Look at:** the right deck's CUE button and the zoomed waveform.
- **Listen for:** hold CUE and a real, full, clear kick sounds instantly, not a drum fill.

### Step 2: Play track A, count four beats, start track B

- **Do:** let track A play on the speakers. Count "1-2-3-4" with track A's kick and press play on track B on beat one of the next bar.
- **Look at:** not the screen; watch your hand on the play button.
- **Listen for:** in your headphones, track B's kick lands with track A's kick for the first few beats.

### Step 3: Hear which track is faster

- **Do:** listen for a while. If track B's kick gradually gets ahead of track A's, B is faster: pull B's pitch fader down slightly. If B gradually falls behind, push the pitch up slightly. Move it a little at a time, around 0.1–0.2% per move, and listen again.
- **Look at:** deck B's pitch fader; keep your hand on it and move it only a tiny amount.
- **Listen for:** the "galloping horse" sound of two kicks slightly apart widens more slowly, then stops widening.

### Step 4: Nudge the beat into place with the jog wheel

- **Do:** when the speed is nearly right but the kicks are still a touch apart, turn the edge of the jog wheel gently: forwards to pull track B ahead, backwards to pull it back.
- **Look at:** the outer edge of the jog wheel; do not touch the top if the jog is in vinyl mode, because touching the top stops or scratches the track.
- **Listen for:** the two kicks "stick" together and sound like one thicker kick.

### Step 5: Keep them locked for a whole phrase

- **Do:** let the two tracks run together for at least 32 beats in your headphones. If the drift comes back, the speed is still not quite right: move the pitch a little more rather than just nudging.
- **Look at:** still not the screen; your ears are the clock.
- **Listen for:** after 32 beats the two kicks are still tight, with no repeating stumble.

${fig('en')}

## A listening trick: one ear in, one ear out

Wear one side of the headphones to hear track B and leave the other ear free to hear track A from the speakers. That is exactly how it works in a club, where the booth monitors play the running track. If your controller has a cue mix knob, you can also set it to the middle while you are learning, to hear both tracks in the headphones.

## Signs you got it right

- The two kicks lock together and sound like one thicker kick.
- No stumble keeps coming back after 32 beats.
- After a few beats you know at once whether to move the pitch up or down.

## Common mistakes and fixes

| Mistake | What you hear or see | Fix |
| --- | --- | --- |
| Miscounting beat one | The cue is off and the track comes in lost | Listen again from the start of the intro and cue on the first real kick |
| Overcorrecting the pitch | The tempo shifts audibly and drifts the other way | Move it 0.1–0.2% at a time |
| Fixing speed with the jog wheel | It locks, then drifts again | Fix speed with the pitch fader and use the jog only for position |
| Touching the top of the jog | The track stops or squeals | Touch only the edge, or switch vinyl mode off while practising |
| Headphones too loud | Tired ears that miss small drifts | Turn them down until the kick is just clear |

## Dos and don'ts

- ✅ Practise with two tracks of one style at close tempos.
- ✅ Listen with one ear on the monitors and one on the cue.
- ✅ Practise 20 minutes a day with the same two tracks for a week.
- ❌ Practise with two tracks far apart in BPM from the start.
- ❌ Turn the monitors down too low just to "get it over with".
- ❌ Beatmatch by watching waveforms instead of listening.

## Wasted moves to drop

- **Touching the EQ before the beats are matched:** it confuses your ears. Beatmatch first, EQ second.
- **Switching on several effects:** effects hide a beatmatching mistake instead of fixing it.
- **Turning the jog wheel when nothing is wrong:** every touch knocks the beat further out. Nudge only when you hear a drift.

## Old idea to drop: "sync is cheating"

You learn to beatmatch by ear not to give up sync, but to understand what sync does and to fix things when it goes wrong (a wrong beatgrid, a track with a live drummer, CDJs without sync linked). Once you can beatmatch by ear, using sync to free your hands for EQ and reading the room is a perfectly honest choice. Read [the sync button: when to use it and when not to](${lesson('nut-sync', 'en')}).

## A 20-minute drill

1. Cover the BPM numbers and set both pitch faders to zero.
2. Push track B's pitch off by some random amount (without looking at the numbers).
3. Start B on beat one, listen, and correct with the pitch fader until it locks.
4. Hold the lock for 32 beats, then uncover the screen and see how far apart they still are.
5. Repeat five times, timing each attempt to watch yourself get faster.

## Next lesson

Now that you can beatmatch by ear, learn when to hand the job to the machine: [the sync button: when to use it and when not to](${lesson('nut-sync', 'en')}). Then learn [EQ mixing](${lesson('eq-mixing', 'en')}) so two overlapping tracks never sound muddy. The whole path is at [Learn to DJ from zero](${lesson('hoc-dj-tu-so-0', 'en')}).`;

export const beatmatch: PackPost = {
  key: 'dj-skills/beatmatch',
  slug: 'beatmatch-bang-tai',
  category: 'dj',
  lang: 'vi',
  title: {
    vi: 'Cách beatmatch bằng tai: từng bước cho người mới',
    en: 'How to beatmatch by ear: a step-by-step guide',
  },
  excerpt: {
    vi: 'Beatmatch bằng tai là chỉnh hai bài về cùng tốc độ và phách mà không dùng sync. Năm bước với pitch fader và jog wheel, cách nghe bài nào nhanh, lỗi thường gặp.',
    en: 'Beatmatching by ear brings two tracks to the same speed and beat without sync. Five steps with the pitch fader and jog wheel, hearing which track is faster, and fixes.',
  },
  cover: coverOf(DJ_MEDIA.beatmatch),
  styles: ['house', 'techno'],
  facts: lessonFacts({
    module: MODULES.mixing, minutes: '20',
    gear: { vi: 'Controller 2 kênh, tai nghe, 2 bài chênh không quá 2 BPM', en: 'Two-channel controller, headphones, 2 tracks within 2 BPM' },
    first: { vi: 'Cue point và BPM', en: 'Cue points and BPM' },
    after: { vi: 'Mix hai bài khít phách mà không cần sync', en: 'Mix two tracks with locked beats, no sync needed' },
  }),
  body: { vi, en },
  faq: [
    { q: { vi: 'Sync có làm hỏng kỹ năng beatmatch không?', en: 'Does sync ruin your beatmatching skills?' }, a: { vi: 'Không, nếu bạn học beatmatch bằng tai trước. Sync chỉ làm hỏng kỹ năng khi bạn chưa từng tự làm và không nhận ra lúc nó sai. Biết beatmatch bằng tai rồi, sync là công cụ giúp bạn rảnh tay cho EQ, effect và đọc phòng.', en: 'Not if you learn to beatmatch by ear first. Sync only hurts when you have never done it yourself and cannot tell when it goes wrong. Once you can beatmatch by ear, sync is a tool that frees your hands for EQ, effects and reading the room.' } },
    { q: { vi: 'Bao lâu thì beatmatch bằng tai thành thạo?', en: 'How long does it take to beatmatch by ear?' }, a: { vi: 'Tập 20 phút mỗi ngày với cùng hai bài, phần lớn người mới khớp được phách trong vài tuần đầu. Để khớp nhanh và chắc với mọi bài, kể cả bài có tốc độ dao động, cần thêm vài tháng chơi đều đặn.', en: 'Practising 20 minutes a day with the same two tracks, most beginners can lock the beats within their first few weeks. Matching any track quickly and reliably, including tracks whose tempo drifts, takes a few more months of regular playing.' } },
    { q: { vi: 'Có cần tai nghe đắt để beatmatch không?', en: 'Do I need expensive headphones to beatmatch?' }, a: { vi: 'Không cần đắt, nhưng nên là loại chụp kín tai, cách âm tốt và nghe rõ dải bass, để tiếng kick trong tai nghe không lẫn với tiếng loa. Một chiếc tai nghe DJ tầm trung bền chắc là đủ cho nhiều năm tập và đi diễn.', en: 'Not expensive ones, but they should be closed-back, isolate well and reproduce the bass clearly, so the kick in your headphones does not blur with the speakers. A sturdy mid-range pair of DJ headphones will last for years of practice and gigs.' } },
    { q: { vi: 'Làm sao biết bài nào đang nhanh hơn?', en: 'How do I tell which track is faster?' }, a: { vi: 'Nghe tiếng kick của bài trong tai nghe so với bài trên loa. Nếu nó dần đi trước, bài đó nhanh hơn; nếu dần đi sau, bài đó chậm hơn. Mẹo: đẩy nhẹ jog lên trước; nếu tiếng lệch đỡ hơn, bài đó đang đi sau và cần tăng pitch.', en: 'Compare the kick in your headphones with the kick on the speakers. If it gradually gets ahead, that track is faster; if it falls behind, it is slower. A trick: nudge the jog forwards; if the drift improves, that track was behind and needs more pitch.' } },
    { q: { vi: 'Pitch fader và jog wheel khác nhau thế nào khi beatmatch?', en: 'What is the difference between the pitch fader and the jog wheel?' }, a: { vi: 'Pitch fader đổi tốc độ của bài một cách lâu dài, nên dùng để sửa chuyện bài nào nhanh hơn. Jog wheel chỉ đẩy bài lên trước hoặc kéo lùi trong chốc lát, nên dùng để sửa vị trí phách khi tốc độ đã đúng.', en: 'The pitch fader changes a track’s speed for good, so it fixes which track is faster. The jog wheel only pushes the track ahead or holds it back for a moment, so it fixes where the beat sits once the speed is right.' } },
  ],
  sources: [
    { title: 'Beatmatching', url: wiki('Beatmatching'), publisher: 'Wikipedia' },
    { title: 'Learn to beatmatch', url: 'https://www.digitaldjtips.com/2011/02/learn-to-beatmatch/', publisher: 'Digital DJ Tips' },
    { title: 'rekordbox FAQ', url: 'https://rekordbox.com/en/support/faq/', publisher: 'AlphaTheta' },
    { title: 'Serato DJ', url: 'https://serato.com/dj', publisher: 'Serato' },
    { title: 'Disc jockey', url: wiki('Disc jockey'), publisher: 'Wikipedia' },
  ],
  tracks: [],
};
