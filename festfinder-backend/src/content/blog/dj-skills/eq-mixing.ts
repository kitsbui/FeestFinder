import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, DJ_MEDIA } from './media.ts';
import { figure, lesson, lessonFacts, MODULES, wiki } from './shared.ts';

const fig = (lang: 'vi' | 'en') => figure(DJ_MEDIA.phrasing,
  { vi: 'Booth DJ của club Matrix ở Berlin với mixer và đầu phát', en: 'The DJ booth at Matrix in Berlin, with a mixer and players' },
  { vi: 'Lúc đổi bass, mỗi tay đặt trên núm low của một kênh và cùng xoay ở phách 1', en: 'For a bass swap, each hand rests on one channel’s low knob and both turn on beat one' }, lang);

const vi = `**EQ mixing** là dùng ba núm EQ (low, mid, high) trên mỗi kênh để hai bài chồng lên nhau mà không đục. Nguyên tắc quan trọng nhất: không bao giờ để hai đường bass chạy hết cỡ cùng lúc. Filter, reverb và echo là gia vị, dùng tiết chế. Sau bài này bạn làm được một lần đổi bass (bass swap) sạch ở đầu câu nhạc.

## Ba dải EQ nghe ra sao?

| Núm | Bạn nghe gì | Dùng khi chuyển bài |
| --- | --- | --- |
| Low | Kick, bassline, độ "đập" vào ngực | Chỉ một bài giữ bass tại một thời điểm |
| Mid | Giọng hát, synth, thân tiếng snare | Hạ bớt khi hai giai điệu hoặc giọng hát chỏi nhau |
| High | Hi-hat, cymbal, độ "sáng" | Hạ nhẹ bài vào để hai lớp hi-hat không rối |
| Filter (một núm) | Vặn trái: tiếng bí như nghe từ phòng bên; vặn phải: tiếng mỏng, chỉ còn phần cao | Đưa một bài vào hoặc ra từ từ trong một câu |

EQ trên mixer DJ được thiết kế để **cắt** nhiều hơn là **tăng**: vặn hết về trái là gần như tắt dải đó, còn vặn quá giữa sang phải chỉ tăng thêm một chút và dễ làm tiếng rè. Hãy coi vị trí giữa là "bình thường" và chủ yếu vặn xuống.

## Bạn cần chuẩn bị

- Controller hoặc mixer có EQ ba dải và filter trên mỗi kênh.
- Hai bài house hoặc techno đã beatmatch được, có intro và outro dài.
- Gain của hai kênh đã chỉnh để đèn mức ngang nhau (xem [bài Controller DJ](${lesson('controller-dj', 'vi')})).

## Các bước thực hiện

### Bước 1: Đưa bài B vào với bass đã cắt

- **Làm gì:** beatmatch bài B trong tai nghe. Vặn low của kênh B về hết bên trái. Ở đầu một câu nhạc, kéo channel fader của B lên dần trong 8–16 nhịp.
- **Nhìn đâu trên controller:** núm low và channel fader của kênh B; đèn mức master.
- **Nghe gì để biết đúng:** bạn nghe thêm hi-hat, percussion của bài B, nhưng tiếng kick và bass vẫn chỉ là của bài A, không đục, không ù.

### Bước 2: Hạ nhẹ high của bài vào

- **Làm gì:** nếu hai lớp hi-hat nghe rối, vặn high của B xuống khoảng một phần tư.
- **Nhìn đâu:** núm high kênh B.
- **Nghe gì để biết đúng:** phần cao gọn lại, nghe như một lớp hi-hat chứ không phải hai.

### Bước 3: Đổi bass ở phách 1 của câu mới

- **Làm gì:** đặt tay trái lên low kênh A, tay phải lên low kênh B. Đếm câu nhạc; đúng "MỘT" của câu mới, cùng lúc vặn low A về hết trái và low B về giữa.
- **Nhìn đâu:** hai núm low; bộ đếm nhịp nếu cần.
- **Nghe gì để biết đúng:** kick và bass đổi chủ ngay ở phách 1, độ đập vào ngực không hụt chút nào, không có lúc nào hai bass chồng nhau.

${fig('vi')}

### Bước 4: Dọn bài A ra khỏi mix

- **Làm gì:** trong 8–16 nhịp tiếp theo, hạ mid rồi high của bài A, sau đó kéo channel fader A xuống ở đầu câu kế tiếp. Trả EQ của kênh A về giữa để sẵn cho bài sau.
- **Nhìn đâu:** núm mid, high và channel fader kênh A.
- **Nghe gì để biết đúng:** bài A biến mất mà người nghe không nhận ra lúc nào; chỉ còn bài B, đầy đủ.

### Bước 5: Dùng một effect, cho một mục đích

- **Làm gì:** khi muốn kết thúc bài A gọn hơn, bật echo (delay) 1/2 hoặc 1 nhịp ở phách cuối của một câu, kéo fader A xuống, để tiếng vọng tự tắt. Tắt effect ngay sau đó.
- **Nhìn đâu:** núm hoặc nút effect và nút bật tắt của nó.
- **Nghe gì để biết đúng:** tiếng vọng rơi đúng nhịp, tắt dần trong vài nhịp, không đè lên drop của bài B.

## Dấu hiệu bạn làm đúng

- Không có lúc nào hai đường bass cùng chạy hết cỡ.
- Đèn mức master giữ ổn định suốt lần chuyển bài.
- Bạn trả mọi núm EQ về giữa sau mỗi lần chuyển bài.

## Lỗi thường gặp và cách sửa

| Lỗi | Nghe hoặc nhìn ra sao | Cách sửa |
| --- | --- | --- |
| Hai bass chạy cùng lúc | Ù, đục, loa như sắp vỡ | Cắt low bài vào cho tới phách đổi bass |
| Cắt bass cả hai bài | Một "lỗ" không có kick, sàn khựng lại | Đổi cùng lúc ở phách 1, không để khoảng trống |
| Đổi bass giữa câu | Bass vào lạc chỗ, nghe hụt | Chờ "MỘT" của câu mới |
| Tăng EQ quá giữa | Tiếng rè, đèn mức đỏ | Cắt dải khác thay vì tăng dải này |
| Quên tắt effect | Echo, reverb kéo dài sang bài mới | Một effect, bật rồi tắt ngay |

## Do & Don't

- ✅ Cắt nhiều hơn tăng; vị trí giữa là bình thường.
- ✅ Đổi bass đúng phách 1 của câu mới.
- ✅ Trả EQ về giữa sau mỗi lần chuyển bài.
- ❌ Vặn EQ liên tục suốt bài khi không chuyển bài.
- ❌ Bật ba bốn effect cùng lúc.
- ❌ Dùng filter để che một lần beatmatch lệch.

## Động tác thừa cần tránh

| Động tác thừa | Vì sao thừa | Thay bằng |
| --- | --- | --- |
| Vặn EQ liên tục suốt bài | Mất groove, tai mệt | Chỉ chạm EQ khi chuyển bài hoặc cần tạo khoảng trống |
| Bật 3–4 effect cùng lúc | Mix đục, khó kiểm soát | Một effect, một mục đích, một thời điểm |
| Quét filter qua lại nhiều lần | Người nghe mất cảm giác nhịp | Một lần quét chậm, trong một câu |

## Tư tưởng cũ cần bỏ: "effect nhiều mới là tay nghề cao"

Effect lạm dụng che lỗi, không phải kỹ năng. Người nghe nhớ lần đổi bass sạch và drop rơi đúng chỗ, không nhớ bạn bật bao nhiêu hiệu ứng. Ít effect, đúng lúc, nghe được ý đồ: đó mới là tay nghề.

## Bài tập 20 phút

1. Beatmatch hai bài, đưa bài B vào với low cắt hết theo bước 1.
2. Đổi bass ở phách 1 của câu mới, mười lần, mỗi lần với một câu khác.
3. Ghi âm, nghe lại xem có lần nào hai bass chồng hoặc có "lỗ" không.
4. Thử kết thúc bài A bằng echo theo bước 5.
5. Trả mọi núm về giữa và lặp lại theo chiều ngược lại.

## Bài tiếp theo

Bạn đã đổi bass bằng EQ, giờ học hai cách đưa âm lượng lên xuống: [crossfader và channel fader khác gì](${lesson('crossfader-channel-fader', 'vi')}). Nếu hai bài còn lệch phách, quay lại [beatmatch bằng tai](${lesson('beatmatch-bang-tai', 'vi')}). Cả lộ trình ở [Học DJ từ số 0](${lesson('hoc-dj-tu-so-0', 'vi')}).`;

const en = `**EQ mixing** means using the three EQ knobs (low, mid, high) on each channel so two overlapping tracks never turn to mud. The most important rule: never let two basslines run at full strength together. Filters, reverb and echo are seasoning, used sparingly. After this lesson you can make a clean bass swap at the start of a phrase.

## What do the three EQ bands sound like?

| Knob | What you hear | How to use it in a transition |
| --- | --- | --- |
| Low | The kick, the bassline, the thump in your chest | Only one track holds the bass at a time |
| Mid | Vocals, synths, the body of the snare | Lower it when two melodies or vocals clash |
| High | Hi-hats, cymbals, the sparkle | Lower the incoming track a little so two layers of hats do not tangle |
| Filter (one knob) | Left: muffled, as if from the next room; right: thin, only the top remains | Bringing a track in or out gradually over a phrase |

The EQ on a DJ mixer is designed to **cut** more than to **boost**: fully left almost removes that band, while going past the centre to the right adds only a little and easily distorts. Treat the centre as "normal" and mostly turn down.

## What you need

- A controller or mixer with a three-band EQ and a filter on each channel.
- Two house or techno tracks you can beatmatch, with long intros and outros.
- The gain on both channels set so their meters match (see [the DJ controller lesson](${lesson('controller-dj', 'en')})).

## Step by step

### Step 1: Bring track B in with its bass cut

- **Do:** beatmatch track B in your headphones. Turn channel B's low fully left. At the start of a phrase, raise B's channel fader gradually over 8–16 bars.
- **Look at:** channel B's low knob and channel fader, and the master meter.
- **Listen for:** you hear track B's hats and percussion join in, but the kick and bass still belong only to track A, with no mud and no boom.

### Step 2: Ease the incoming highs down

- **Do:** if the two layers of hi-hats sound busy, turn B's high down by about a quarter.
- **Look at:** channel B's high knob.
- **Listen for:** the top end tightens and sounds like one layer of hats rather than two.

### Step 3: Swap the bass on beat one of a new phrase

- **Do:** put your left hand on channel A's low and your right hand on channel B's low. Count the phrase; exactly on the "ONE" of the new phrase, turn A's low fully left and B's low to the centre at the same time.
- **Look at:** the two low knobs, and the beat counter if you need it.
- **Listen for:** the kick and bass change owners right on beat one, the thump never dips, and at no moment do the two basslines overlap.

${fig('en')}

### Step 4: Clear track A out of the mix

- **Do:** over the next 8–16 bars, lower track A's mids and then its highs, then pull channel A's fader down at the start of the following phrase. Return channel A's EQ to the centre, ready for the next track.
- **Look at:** channel A's mid, high and channel fader.
- **Listen for:** track A disappears without the listener noticing when; only track B remains, complete.

### Step 5: One effect, one purpose

- **Do:** when you want track A to finish more neatly, switch on a 1/2 or 1-beat echo (delay) on the last beat of a phrase, pull A's fader down and let the echo fade by itself. Switch the effect off straight after.
- **Look at:** the effect knob or button and its on/off switch.
- **Listen for:** the echoes land on the beat and fade over a few bars without covering track B's drop.

## Signs you got it right

- At no point do two basslines run at full strength together.
- The master meter stays steady through the whole transition.
- You return every EQ knob to the centre after each transition.

## Common mistakes and fixes

| Mistake | What you hear or see | Fix |
| --- | --- | --- |
| Two basslines at once | Boomy, muddy, speakers straining | Keep the incoming low cut until the swap |
| Cutting the bass on both tracks | A "hole" with no kick, and the floor stalls | Swap both at once on beat one, leaving no gap |
| Swapping mid-phrase | The bass arrives in the wrong place and feels short | Wait for the "ONE" of a new phrase |
| Boosting past the centre | Distortion and red meters | Cut another band instead of boosting this one |
| Forgetting to switch an effect off | Echo or reverb spills into the new track | One effect, on and then straight off |

## Dos and don'ts

- ✅ Cut more than you boost; the centre is normal.
- ✅ Swap the bass exactly on beat one of a new phrase.
- ✅ Return the EQ to the centre after every transition.
- ❌ Keep turning the EQ all through a track when you are not mixing.
- ❌ Run three or four effects at once.
- ❌ Use a filter to hide a beatmatch that is off.

## Wasted moves to drop

| Wasted move | Why it is wasted | Do this instead |
| --- | --- | --- |
| Turning the EQ all through a track | Kills the groove and tires your ears | Touch it only during a transition or to make space |
| Running three or four effects at once | Muddies the mix and is hard to control | One effect, one purpose, one moment |
| Sweeping the filter back and forth | Listeners lose the feel of the beat | One slow sweep over a phrase |

## Old idea to drop: "more effects means more skill"

Overused effects hide mistakes; they are not a skill. Listeners remember a clean bass swap and a drop that lands in the right place, not how many effects you switched on. Few effects, at the right moment, with an intention people can hear: that is skill.

## A 20-minute drill

1. Beatmatch two tracks and bring track B in with its low fully cut, as in step 1.
2. Swap the bass on beat one of a new phrase ten times, on a different phrase each time.
3. Record it and listen back for any overlap of basslines or any "hole".
4. Try finishing track A with an echo, as in step 5.
5. Return every knob to the centre and do it all the other way round.

## Next lesson

You can swap the bass with the EQ; now learn the two ways to move volume up and down: [the crossfader vs channel faders](${lesson('crossfader-channel-fader', 'en')}). If the beats still drift, go back to [beatmatching by ear](${lesson('beatmatch-bang-tai', 'en')}). The whole path is at [Learn to DJ from zero](${lesson('hoc-dj-tu-so-0', 'en')}).`;

export const eqMixing: PackPost = {
  key: 'dj-skills/eq-mixing',
  slug: 'eq-mixing',
  category: 'dj',
  lang: 'vi',
  title: {
    vi: 'EQ mixing: cắt bass khi chuyển bài, dùng filter đúng lúc',
    en: 'EQ mixing: cut the bass in a transition, filter with care',
  },
  excerpt: {
    vi: 'EQ mixing là dùng low, mid, high để hai bài chồng nhau không đục. Cách đưa bài vào với bass đã cắt, đổi bass ở phách 1, dọn bài cũ và dùng echo, filter tiết chế.',
    en: 'EQ mixing uses low, mid and high so overlapping tracks never turn muddy. Bring a track in with its bass cut, swap the bass on beat one, clear the old track, echo out.',
  },
  cover: coverOf(DJ_MEDIA.eq),
  styles: ['house', 'techno'],
  facts: lessonFacts({
    module: MODULES.mixing, minutes: '20',
    gear: { vi: 'Controller có EQ ba dải và filter, 2 bài có intro dài', en: 'Controller with three-band EQ and filters, 2 tracks with long intros' },
    first: { vi: 'Beatmatch bằng tai và phrasing', en: 'Beatmatching by ear and phrasing' },
    after: { vi: 'Đổi bass sạch ở đầu câu nhạc', en: 'A clean bass swap at the start of a phrase' },
  }),
  body: { vi, en },
  faq: [
    { q: { vi: 'EQ mixing là gì?', en: 'What is EQ mixing?' }, a: { vi: 'EQ mixing là dùng ba núm low, mid, high trên mỗi kênh của mixer để hai bài chồng lên nhau mà không đục. Việc quan trọng nhất là đổi bass: chỉ một bài giữ kick và bassline tại một thời điểm, và đổi đúng phách 1 của câu mới.', en: 'EQ mixing means using the low, mid and high knobs on each mixer channel so two overlapping tracks never turn muddy. The key move is the bass swap: only one track holds the kick and bassline at a time, and they change over on beat one of a new phrase.' } },
    { q: { vi: 'Vì sao phải cắt bass khi chuyển bài?', en: 'Why cut the bass in a transition?' }, a: { vi: 'Hai đường bass và hai tiếng kick chạy hết cỡ cùng lúc dồn năng lượng vào cùng một dải tần, làm âm thanh ù, đục và đèn mức dễ chạm đỏ. Cắt bass bài vào giúp mix sạch, rồi đổi bass ở đầu câu để năng lượng không hụt.', en: 'Two basslines and two kicks at full strength pile energy into the same frequencies, so the sound turns boomy and muddy and the meters hit red. Cutting the incoming bass keeps the mix clean, and swapping on the phrase keeps the energy from dipping.' } },
    { q: { vi: 'Filter khác EQ thế nào?', en: 'How is a filter different from the EQ?' }, a: { vi: 'EQ chỉnh riêng từng dải low, mid, high. Filter là một núm cắt cả một phía: vặn trái cắt phần cao làm tiếng bí, vặn phải cắt phần trầm làm tiếng mỏng. Filter hợp để đưa một bài vào hoặc ra từ từ trong một câu nhạc.', en: 'The EQ adjusts the low, mid and high bands separately. A filter is one knob that cuts a whole side: left removes the top for a muffled sound, right removes the bottom for a thin one. Filters suit bringing a track in or out gradually over a phrase.' } },
    { q: { vi: 'Có nên tăng EQ quá vị trí giữa không?', en: 'Should I boost the EQ past the centre?' }, a: { vi: 'Hạn chế. EQ trên mixer DJ chủ yếu để cắt; tăng quá giữa dễ làm tiếng rè và đèn mức đỏ. Nếu muốn bass nổi hơn, hãy cắt bớt mid hoặc high thay vì tăng low, và luôn trả EQ về giữa sau khi chuyển bài.', en: 'Rarely. The EQ on a DJ mixer is mostly for cutting; boosting past the centre easily distorts and pushes the meters into red. If you want more bass, cut some mid or high instead of boosting the low, and always return the EQ to the centre afterwards.' } },
    { q: { vi: 'Người mới nên dùng effect nào?', en: 'Which effect should a beginner use?' }, a: { vi: 'Echo (delay) theo nhịp là effect dễ dùng và hữu ích nhất: bật ở phách cuối của một câu, kéo fader bài cũ xuống, để tiếng vọng tự tắt. Dùng một effect cho một mục đích, rồi tắt ngay; đừng để effect chạy liên tục.', en: 'A beat-synced echo (delay) is the easiest and most useful: switch it on at the last beat of a phrase, pull the old track’s fader down and let the echo fade by itself. Use one effect for one purpose and switch it off right away; never leave effects running.' } },
  ],
  sources: [
    { title: 'Equalization (audio)', url: wiki('Equalization (audio)'), publisher: 'Wikipedia' },
    { title: 'DJ mixer', url: wiki('DJ mixer'), publisher: 'Wikipedia' },
    { title: 'AlphaTheta (Pioneer DJ)', url: 'https://www.alphatheta.com/en/', publisher: 'AlphaTheta' },
    { title: 'rekordbox FAQ', url: 'https://rekordbox.com/en/support/faq/', publisher: 'AlphaTheta' },
    { title: 'Traktor', url: 'https://www.native-instruments.com/en/products/traktor/', publisher: 'Native Instruments' },
  ],
  tracks: [],
};
