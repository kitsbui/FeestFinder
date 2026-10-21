import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, DJ_MEDIA } from './media.ts';
import { figure, lesson, lessonFacts, MODULES, wiki } from './shared.ts';

const fig = (lang: 'vi' | 'en') => figure(DJ_MEDIA.files,
  { vi: 'Đĩa timecode Traktor Scratch trên mâm đĩa than', en: 'A Traktor Scratch timecode record on a turntable' },
  { vi: 'DJ scratch dùng crossfader với curve sắc: một chạm là bật hoặc tắt hẳn một bên', en: 'Scratch DJs use the crossfader with a sharp curve: one flick fully opens or closes a side' }, lang);

const vi = `**Channel fader** chỉnh âm lượng của từng kênh riêng, còn **crossfader** là cần gạt ngang chia âm lượng giữa bên trái và bên phải. Phần lớn DJ house và techno nối bài bằng channel fader; crossfader hợp với cú cắt nhanh và scratch. Sau bài này bạn biết khi nào dùng cái nào, chỉnh curve và gán kênh đúng cách.

## So sánh nhanh

| | Channel fader | Crossfader |
| --- | --- | --- |
| Là gì | Một cần gạt dọc cho mỗi kênh | Một cần gạt ngang giữa hai bên A và B |
| Hợp nhất cho | Blend dài, đưa bài vào từ từ trong 8–32 nhịp | Cắt nhanh ở phách 1, scratch, chuyển kiểu hip-hop |
| Dòng nhạc hay dùng | House, techno, trance | Hip-hop, open format, scratch, drum and bass nhanh |
| Rủi ro thường gặp | Hai kênh cùng to quá, mix bị đục | Quên crossfader ở một bên, kéo fader mà không nghe gì |

Hai cái không loại trừ nhau. Nhiều DJ dùng channel fader để chỉnh mức của từng bài và crossfader cho khoảnh khắc đổi bài. Điều quan trọng là bạn hiểu crossfader đang ở đâu và đang làm gì, thay vì để nó ở giữa theo thói quen.

## Curve và gán kênh: hai thiết lập cần biết

- **Crossfader curve:** curve mềm (smooth) làm âm lượng hai bên đổi từ từ khi gạt, hợp để blend; curve sắc (sharp) làm một bên bật lên gần như ngay khi gạt, hợp để cắt và scratch. Một số mixer cho chỉnh curve cả channel fader.
- **Gán kênh (A / THRU / B):** mỗi kênh có một công tắc nhỏ hoặc một cài đặt chọn kênh đó đi qua bên A, bên B của crossfader, hay bỏ qua crossfader (THRU). Kênh để THRU chỉ nghe theo channel fader.

## Bạn cần chuẩn bị

- Controller hoặc mixer có crossfader và cài đặt curve (trên máy hoặc trong phần mềm).
- Hai bài cùng dòng nhạc đã beatmatch được.
- Một bài hip-hop hoặc bài có nhiều khoảng ngắt để thử cú cắt.

## Các bước thực hiện

### Bước 1: Kiểm tra crossfader đang gán thế nào

- **Làm gì:** tìm công tắc hoặc cài đặt gán kênh. Với blend house và techno, đặt cả hai kênh ở THRU, hoặc gán kênh trái về A, kênh phải về B và để crossfader ở giữa.
- **Nhìn đâu trên controller:** công tắc nhỏ dưới mỗi channel fader hoặc phía trước controller; phần mixer trong cài đặt phần mềm.
- **Nghe gì để biết đúng:** kéo từng channel fader lên, mỗi bài đều ra tiếng; gạt crossfader nếu đang dùng, âm lượng đổi theo đúng bên.

### Bước 2: Blend dài bằng channel fader

- **Làm gì:** beatmatch hai bài, ở đầu một câu nhạc kéo channel fader bài B lên dần trong 16 nhịp, đồng thời đổi bass bằng EQ (xem [EQ mixing](${lesson('eq-mixing', 'vi')})), rồi kéo fader bài A xuống trong câu tiếp theo.
- **Nhìn đâu:** hai channel fader và đèn mức master.
- **Nghe gì để biết đúng:** độ to tổng thể không phình lên hay hụt xuống; bài B thay bài A như một cuộc chuyển giao êm.

### Bước 3: Cắt nhanh bằng crossfader

- **Làm gì:** chỉnh crossfader curve sang sắc, gán hai kênh về A và B, để crossfader ở phía bài A. Đúng phách 1 của câu mới, gạt dứt khoát sang phía bài B.
- **Nhìn đâu:** núm hoặc cài đặt crossfader curve; tay đặt trên crossfader.
- **Nghe gì để biết đúng:** bài đổi ngay ở phách 1, gọn như cắt cảnh trong phim, không có tiếng hai bài chồng nhau.

### Bước 4: Kết hợp cả hai

- **Làm gì:** để channel fader của cả hai bài ở mức đã chỉnh sẵn, dùng crossfader cho lúc đổi bài. Khi xong, trả crossfader về vị trí bạn chọn làm mặc định.
- **Nhìn đâu:** vị trí crossfader trước mỗi lần chuyển bài.
- **Nghe gì để biết đúng:** bạn không bao giờ bị bất ngờ vì một bài im lặng hay to lên đột ngột.

${fig('vi')}

### Bước 5: Giữ mức hai bài ngang nhau

- **Làm gì:** để channel fader của bài đang phát ở cùng một vị trí (ví dụ hết cỡ), cân độ to bằng gain chứ không bằng fader.
- **Nhìn đâu:** đèn mức của hai kênh khi mỗi bài chạy một mình.
- **Nghe gì để biết đúng:** khi đổi bài, người nghe không thấy nhạc to lên hay nhỏ đi.

## Dấu hiệu bạn làm đúng

- Bạn luôn biết crossfader đang ở đâu trước khi kéo fader.
- Blend dài nghe đều, cú cắt nhanh nghe gọn.
- Độ to tổng thể ổn định qua mọi lần chuyển bài.

## Lỗi thường gặp và cách sửa

| Lỗi | Nghe hoặc nhìn ra sao | Cách sửa |
| --- | --- | --- |
| Crossfader ở một bên | Kéo fader bài B lên mà không nghe gì | Kiểm tra crossfader và gán kênh trước khi chuyển bài |
| Curve sắc khi blend | Bài B bật lên đột ngột | Đổi curve mềm, hoặc blend bằng channel fader |
| Hai kênh cùng hết cỡ quá lâu | Mix đục, đèn mức đỏ | Kéo bài cũ xuống trong câu tiếp theo |
| Cân độ to bằng fader | Bài sau to hoặc nhỏ hơn hẳn bài trước | Cân bằng gain, fader để cùng vị trí |
| Để crossfader ở giữa mà không biết vì sao | Không kiểm soát được lúc đổi bài | Chọn có chủ đích: THRU, hoặc A và B với một vị trí mặc định |

## Do & Don't

- ✅ Chọn một cách làm cho mỗi lần chuyển bài: blend bằng channel fader hoặc cắt bằng crossfader.
- ✅ Kiểm tra curve và gán kênh mỗi khi dùng máy lạ ở club.
- ✅ Cân độ to bằng gain.
- ❌ Đặt crossfader ở giữa mặc định mà không hiểu nó làm gì.
- ❌ Dùng curve sắc cho blend dài.
- ❌ Vừa gạt crossfader vừa kéo channel fader cho cùng một lần blend.

## Động tác thừa cần tránh

- **"Bơm" channel fader lên xuống theo nhạc:** người nghe thấy âm lượng chập chờn. Để fader yên khi không chuyển bài.
- **Gạt crossfader và channel fader cùng lúc:** hai tay làm cùng một việc, dễ làm hụt âm lượng. Một cần gạt cho một lần chuyển bài.
- **Đổi curve giữa chừng set:** tay đã quen một cảm giác; đổi curve trước khi bắt đầu chơi.

## Bài tập 20 phút

1. Đặt hai kênh ở THRU, blend hai bài bằng channel fader trong 16 nhịp, năm lần.
2. Gán kênh về A và B, curve sắc, cắt bằng crossfader ở phách 1, năm lần.
3. Thử cắt ở phách 1 của câu và ở phách 3; nghe sự khác biệt.
4. Ghi âm, nghe xem độ to có ổn định không.
5. Chọn cách bạn thích cho dòng nhạc của mình, ghi lại thiết lập.

## Bài tiếp theo

Bạn đã nối được hai bài theo nhiều cách, giờ ghép chúng thành một set: [xây set DJ 30–60 phút](${lesson('xay-set-dj', 'vi')}). Muốn chắc phần EQ, đọc lại [EQ mixing](${lesson('eq-mixing', 'vi')}). Cả lộ trình ở [Học DJ từ số 0](${lesson('hoc-dj-tu-so-0', 'vi')}).`;

const en = `**A channel fader** sets the volume of one channel, while **the crossfader** is a horizontal slider that shares volume between the left and right sides. Most house and techno DJs mix with the channel faders; the crossfader suits fast cuts and scratching. After this lesson you know when to use which and how to set the curve and channel assignment.

## A quick comparison

| | Channel fader | Crossfader |
| --- | --- | --- |
| What it is | A vertical slider for each channel | One horizontal slider between sides A and B |
| Best for | Long blends, bringing a track in over 8–32 bars | Fast cuts on beat one, scratching, hip-hop style changes |
| Styles that use it | House, techno, trance | Hip-hop, open format, scratch, fast drum and bass |
| Common risk | Both channels too loud together, a muddy mix | The crossfader left on one side, so a fader comes up silent |

The two are not rivals. Many DJs use the channel faders to set each track's level and the crossfader for the moment of change. What matters is knowing where the crossfader is and what it is doing, rather than leaving it in the middle out of habit.

## Curve and channel assignment: two settings to know

- **Crossfader curve:** a smooth curve changes the two sides' volume gradually as you slide, which suits blending; a sharp curve brings a side in almost instantly, which suits cuts and scratching. Some mixers let you set a curve for the channel faders too.
- **Channel assignment (A / THRU / B):** each channel has a small switch or setting that sends it to side A or side B of the crossfader, or bypasses the crossfader (THRU). A channel on THRU follows only its channel fader.

## What you need

- A controller or mixer with a crossfader and a curve setting (on the unit or in the software).
- Two tracks of one style that you can beatmatch.
- A hip-hop track or one with plenty of breaks to try cuts on.

## Step by step

### Step 1: Check how the crossfader is assigned

- **Do:** find the assignment switches or setting. For house and techno blends, set both channels to THRU, or assign the left channel to A and the right to B and leave the crossfader in the middle.
- **Look at:** the small switches under each channel fader or on the front of the controller, and the mixer section of the software's settings.
- **Listen for:** raise each channel fader and every track sounds; if you use the crossfader, sliding it changes the volume on the correct side.

### Step 2: A long blend with the channel faders

- **Do:** beatmatch two tracks and, at the start of a phrase, raise track B's channel fader over 16 bars while you swap the bass with the EQ (see [EQ mixing](${lesson('eq-mixing', 'en')})), then bring track A's fader down during the next phrase.
- **Look at:** both channel faders and the master meter.
- **Listen for:** the overall loudness neither swells nor dips; track B takes over from track A like a smooth handover.

### Step 3: A fast cut with the crossfader

- **Do:** set the crossfader curve to sharp, assign the channels to A and B, and leave the crossfader on track A's side. Exactly on beat one of a new phrase, slide it decisively to track B's side.
- **Look at:** the crossfader curve knob or setting, with your hand on the crossfader.
- **Listen for:** the track changes right on beat one, as clean as a cut in a film, with no moment of both tracks together.

### Step 4: Combine the two

- **Do:** leave both channel faders at the levels you set, and use the crossfader for the moment of change. Afterwards, return the crossfader to the position you chose as your default.
- **Look at:** where the crossfader is before every transition.
- **Listen for:** you are never surprised by a track that stays silent or suddenly jumps in volume.

${fig('en')}

### Step 5: Keep the two tracks at matching levels

- **Do:** keep the playing track's channel fader at the same position every time (for example fully up), and balance loudness with the gain, not the fader.
- **Look at:** each channel's meter while its track plays alone.
- **Listen for:** when the track changes, the listener hears no jump or dip in volume.

## Signs you got it right

- You always know where the crossfader is before you move a fader.
- Long blends sound even and fast cuts sound tight.
- The overall loudness stays steady through every transition.

## Common mistakes and fixes

| Mistake | What you hear or see | Fix |
| --- | --- | --- |
| The crossfader is on one side | You raise track B's fader and hear nothing | Check the crossfader and assignment before each transition |
| A sharp curve for a blend | Track B jumps in suddenly | Switch to a smooth curve, or blend with the channel faders |
| Both channels fully up for too long | A muddy mix and red meters | Take the old track down during the next phrase |
| Balancing loudness with the faders | The next track is clearly louder or quieter | Balance with the gain and keep the faders at the same position |
| Leaving the crossfader in the middle without knowing why | No control over the moment of change | Choose on purpose: THRU, or A and B with a default position |

## Dos and don'ts

- ✅ Pick one method for each transition: blend with the channel faders or cut with the crossfader.
- ✅ Check the curve and assignment whenever you play an unfamiliar club setup.
- ✅ Balance loudness with the gain.
- ❌ Leave the crossfader in the middle by default without understanding what it does.
- ❌ Use a sharp curve for long blends.
- ❌ Move the crossfader and the channel faders together for the same blend.

## Wasted moves to drop

- **Pumping a channel fader up and down with the music:** listeners hear the volume wobble. Leave the faders alone when you are not changing tracks.
- **Sliding the crossfader and channel faders at the same time:** both hands do the same job and the volume easily dips. One slider per transition.
- **Changing the curve mid-set:** your hands are used to one feel; set the curve before you start playing.

## A 20-minute drill

1. Set both channels to THRU and blend two tracks with the channel faders over 16 bars, five times.
2. Assign the channels to A and B, choose a sharp curve and cut with the crossfader on beat one, five times.
3. Try cutting on beat one of a phrase and on beat three; hear the difference.
4. Record it and listen for steady loudness.
5. Choose the method you like for your style and write down the settings.

## Next lesson

You can join two tracks in several ways; now string them into a set: [building a 30–60 minute DJ set](${lesson('xay-set-dj', 'en')}). To tighten your EQ work first, revisit [EQ mixing](${lesson('eq-mixing', 'en')}). The whole path is at [Learn to DJ from zero](${lesson('hoc-dj-tu-so-0', 'en')}).`;

export const crossfader: PackPost = {
  key: 'dj-skills/crossfader',
  slug: 'crossfader-channel-fader',
  category: 'dj',
  lang: 'vi',
  title: {
    vi: 'Crossfader và channel fader khác gì, dùng khi nào?',
    en: 'Crossfader vs channel faders: what each does and when',
  },
  excerpt: {
    vi: 'Crossfader và channel fader khác nhau thế nào: blend dài bằng channel fader, cắt nhanh bằng crossfader, chỉnh curve, gán kênh A, THRU, B và giữ mức hai bài.',
    en: 'How the crossfader and channel faders differ: long blends on the channel faders, fast cuts on the crossfader, setting the curve, A, THRU, B assignment and levels.',
  },
  cover: coverOf(DJ_MEDIA.crossfader),
  styles: [],
  facts: lessonFacts({
    module: MODULES.mixing, minutes: '20',
    gear: { vi: 'Controller hoặc mixer có crossfader và cài đặt curve', en: 'Controller or mixer with a crossfader and a curve setting' },
    first: { vi: 'EQ mixing: đổi bass', en: 'EQ mixing: the bass swap' },
    after: { vi: 'Chọn blend hay cắt, chỉnh curve và gán kênh', en: 'Choose a blend or a cut, set the curve and assignment' },
  }),
  body: { vi, en },
  faq: [
    { q: { vi: 'Crossfader và channel fader khác nhau thế nào?', en: 'What is the difference between a crossfader and a channel fader?' }, a: { vi: 'Channel fader chỉnh âm lượng của từng kênh riêng, là cần gạt dọc. Crossfader là một cần gạt ngang chia âm lượng giữa bên A và bên B. Channel fader hợp cho blend dài, crossfader hợp cho cú cắt nhanh và scratch.', en: 'A channel fader is a vertical slider that sets the volume of one channel. The crossfader is a horizontal slider that shares volume between side A and side B. Channel faders suit long blends; the crossfader suits fast cuts and scratching.' } },
    { q: { vi: 'DJ house và techno có dùng crossfader không?', en: 'Do house and techno DJs use the crossfader?' }, a: { vi: 'Ít khi. Phần lớn DJ house và techno nối bài bằng channel fader và EQ trong những lần blend dài 16–32 nhịp, nhiều người để kênh ở THRU để bỏ qua crossfader. Crossfader phổ biến hơn với hip-hop, open format và scratch.', en: 'Rarely. Most house and techno DJs mix with the channel faders and EQ over long 16–32 bar blends, and many set their channels to THRU to bypass the crossfader. The crossfader is more common in hip-hop, open format and scratching.' } },
    { q: { vi: 'Crossfader curve là gì?', en: 'What is the crossfader curve?' }, a: { vi: 'Curve quyết định âm lượng thay đổi thế nào khi bạn gạt crossfader. Curve mềm đổi từ từ, hợp để blend. Curve sắc làm một bên bật lên gần như ngay lập tức, hợp để cắt và scratch. Chỉnh curve trên mixer hoặc trong phần mềm.', en: 'The curve decides how the volume changes as you move the crossfader. A smooth curve changes gradually, which suits blending. A sharp curve brings a side in almost instantly, which suits cuts and scratching. Set it on the mixer or in the software.' } },
    { q: { vi: 'Vì sao kéo fader lên mà không nghe tiếng?', en: 'Why do I hear nothing when I raise a fader?' }, a: { vi: 'Thường do crossfader đang ở phía bên kia, trong khi kênh đó được gán vào crossfader. Gạt crossfader về giữa hoặc về phía kênh đó, hoặc đặt kênh ở THRU. Cũng kiểm tra gain và nút cue tai nghe.', en: 'Usually the crossfader sits on the other side while that channel is assigned to it. Slide the crossfader to the middle or to that channel’s side, or set the channel to THRU. Also check the gain and the headphone cue button.' } },
    { q: { vi: 'Nên để crossfader ở giữa không?', en: 'Should I leave the crossfader in the middle?' }, a: { vi: 'Được, nếu bạn biết vì sao: để giữa và blend bằng channel fader là cách nhiều DJ dùng. Điều cần tránh là để giữa theo thói quen mà không biết curve và gán kênh đang thế nào, vì như vậy bạn không kiểm soát được lúc đổi bài.', en: 'Yes, if you know why: leaving it centred and blending with the channel faders is how many DJs work. What to avoid is leaving it centred out of habit without knowing the curve and assignment, because then you are not in control of the moment of change.' } },
  ],
  sources: [
    { title: 'Crossfade', url: wiki('Crossfade'), publisher: 'Wikipedia' },
    { title: 'DJ mixer', url: wiki('DJ mixer'), publisher: 'Wikipedia' },
    { title: 'AlphaTheta (Pioneer DJ)', url: 'https://www.alphatheta.com/en/', publisher: 'AlphaTheta' },
    { title: 'rekordbox FAQ', url: 'https://rekordbox.com/en/support/faq/', publisher: 'AlphaTheta' },
    { title: 'Serato DJ', url: 'https://serato.com/dj', publisher: 'Serato' },
  ],
  tracks: [],
};
