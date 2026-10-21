import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, DJ_MEDIA } from './media.ts';
import { figure, lesson, PILLAR, wiki } from './shared.ts';

const m = DJ_MEDIA.pillar;
const fig = (lang: 'vi' | 'en') => figure(DJ_MEDIA.controller,
  { vi: 'Controller Pioneer DDJ-RX nối với laptop đang chạy rekordbox', en: 'A Pioneer DDJ-RX controller connected to a laptop running rekordbox' },
  { vi: 'Bộ tập đầu tiên của phần lớn DJ: một controller hai kênh và laptop chạy phần mềm', en: 'Most DJs start here: a two-channel controller and a laptop running the software' }, lang);

const vi = `**Học DJ từ số 0** là học cách chọn và nối các bài nhạc thành một mạch liền: hai bài chạy cùng tốc độ, chuyển đúng câu nhạc, năng lượng lên xuống có chủ đích. Bạn cần một controller hai kênh, laptop, tai nghe và 20–30 phút mỗi ngày. Trang này là lộ trình 16 bài, mỗi bài một thao tác làm được ngay.

${fig('vi')}

## DJ thật ra làm gì?

Một DJ làm bốn việc, theo thứ tự quan trọng: **chọn bài**, **nghe phòng**, **nối bài** và **giữ âm thanh sạch**. Kỹ thuật (beatmatch, EQ, effect) chỉ là cách làm việc thứ ba cho êm. Người nghe không nhớ bạn vặn núm nào; họ nhớ lúc cả phòng cùng giơ tay, hoặc lúc nhạc bị "vấp" làm mọi người khựng lại.

Vì vậy chuỗi bài này không dạy "thành DJ chuyên nghiệp trong 30 ngày". Nó dạy từng thao tác cụ thể trên controller, theo đúng thứ tự mà tai và tay bạn cần: nhận ra phách, đếm câu nhạc, đưa hai bài về cùng tốc độ, rồi mới tới EQ, set và thị trường.

## Bạn cần gì để bắt đầu

| Thứ cần có | Gợi ý | Vì sao |
| --- | --- | --- |
| Controller | Loại hai kênh, có jog wheel, pitch fader và EQ ba dải | Đủ mọi thao tác cơ bản; club dùng cùng bố cục |
| Laptop | Máy đang dùng, còn trống vài chục GB | Phần mềm DJ nhẹ hơn bạn nghĩ |
| Phần mềm | rekordbox, Serato DJ, Traktor hoặc djay Pro | Thường đi kèm hoặc được mở khoá theo controller |
| Tai nghe | Loại chụp kín tai, có dây | Nghe bài kế tiếp mà không lẫn tiếng loa |
| Loa | Loa vi tính hoặc loa kiểm âm | Nghe được bass là đủ để tập |
| Nhạc | 10–20 bài cùng dòng nhạc, BPM gần nhau | Ít bài nhưng hiểu kỹ học nhanh hơn |

Không cần mua đồ đắt trước khi biết mình thích dòng nhạc nào. Bố cục của controller nhập môn giống bàn club: học trên máy rẻ, lên máy xịn vẫn quen tay. Chi tiết ở bài [Controller DJ là gì](${lesson('controller-dj', 'vi')}).

## Lộ trình 6 module, 16 bài

| Module | Bạn học gì | Bài |
| --- | --- | --- |
| 1 · Thiết bị và phần mềm | Controller, nối dây, đặt cue đầu tiên | [Controller DJ](${lesson('controller-dj', 'vi')}) · [Cue point](${lesson('cue-point', 'vi')}) |
| 2 · Nghe và đọc nhạc | Đếm BPM, đếm câu nhạc, đọc waveform, key | [BPM](${lesson('bpm-la-gi', 'vi')}) · [Phrasing](${lesson('phrasing-dj', 'vi')}) · [Harmonic mixing](${lesson('harmonic-mixing', 'vi')}) |
| 3 · Beatmatching và mixing | Beatmatch bằng tai, sync, EQ, fader | [Beatmatch bằng tai](${lesson('beatmatch-bang-tai', 'vi')}) · [Nút sync](${lesson('nut-sync', 'vi')}) · [EQ mixing](${lesson('eq-mixing', 'vi')}) · [Crossfader](${lesson('crossfader-channel-fader', 'vi')}) |
| 4 · Xây set 30–60 phút | Chọn bài, energy curve, ghi âm và đăng mix | [Xây set](${lesson('xay-set-dj', 'vi')}) · [Ghi âm và đăng mix](${lesson('ghi-am-dang-mix', 'vi')}) |
| 5 · Nhạc và thị trường | File nhạc, mua nhạc, nghề DJ ở Việt Nam | [File nhạc](${lesson('file-nhac-dj', 'vi')}) · [Mua nhạc](${lesson('mua-nhac-dj', 'vi')}) · [DJ ở Việt Nam](${lesson('dj-viet-nam', 'vi')}) |
| 6 · Tư duy và phát triển | Tư duy nghề, tư tưởng cũ cần bỏ, thuật ngữ | [Tư duy DJ](${lesson('tu-duy-dj', 'vi')}) · [25 thuật ngữ](${lesson('thuat-ngu-dj', 'vi')}) |

Mỗi bài theo cùng một khuôn: cần chuẩn bị gì, các bước (làm gì, nhìn đâu trên controller, nghe gì để biết đúng), dấu hiệu bạn làm đúng, lỗi thường gặp, nên và không nên, những động tác thừa, câu hỏi thường gặp và bài tiếp theo. Mở phần mềm, cắm controller, đọc tới đâu làm tới đó.

## Tuần đầu tiên: mỗi ngày 20–30 phút

1. **Ngày 1:** cài phần mềm, nối controller, tai nghe và loa; chọn 10 bài house hoặc techno cùng khoảng BPM.
2. **Ngày 2:** đặt cue ở phách đầu tiên của mỗi bài; bấm play đúng phách theo nhịp bài đang chạy.
3. **Ngày 3:** đếm 1-2-3-4 theo tiếng kick, rồi đếm câu 32 phách; đoán trước chỗ bài "đổi cảnh".
4. **Ngày 4:** beatmatch hai bài bằng tai, chỉ dùng pitch fader và jog wheel, không bật sync.
5. **Ngày 5:** nối hai bài bằng channel fader, cắt bass bài vào rồi đổi bass ở đầu một câu nhạc.
6. **Ngày 6:** ghép bốn bài thành một mix 15 phút, ghi âm lại.
7. **Ngày 7:** nghe lại bản ghi, đánh dấu ba chỗ vấp, tuần sau sửa đúng ba chỗ đó.

Tập ngắn mà đều hiệu quả hơn ngồi năm tiếng cuối tuần: tai cần ngủ một giấc để "ghi nhớ" cảm giác hai kick chồng khít.

## Một buổi tập 30 phút trông thế nào

Chia buổi tập làm ba phần, và chỉ một phần dành cho thứ bạn đang học:

- **5 phút khởi động:** chạy lại một lần chuyển bài bạn đã làm được hôm qua, để tay và tai vào nhịp.
- **15 phút cho một kỹ năng:** chỉ một thứ, ví dụ đổi bass ở đầu câu nhạc. Lặp lại cùng hai bài cho tới khi làm được ba lần liền không vấp.
- **10 phút chơi tự do và ghi âm:** nối ba bốn bài theo cảm giác, không dừng lại sửa. Phần này dạy bạn xử lý lỗi khi nhạc vẫn chạy, đúng như khi chơi thật.

Ghi một dòng vào sổ sau mỗi buổi: hôm nay tập gì, chỗ nào còn vấp, mai làm gì. Sau một tháng, cuốn sổ đó cho bạn thấy mình tiến bộ rõ hơn bất kỳ lời khen nào. Khi ba tuần liền bạn nối được bốn bài không vấp, hãy rủ vài người bạn tới nghe: chơi trước người thật là một kỹ năng riêng, nên tập nó sớm, ở nơi không có áp lực.

## Nên và không nên

- ✅ Tập 20–30 phút mỗi ngày với 2–3 bài cố định cho tới khi thuộc từng câu nhạc.
- ✅ Beatmatch bằng tai trước, dùng sync sau, khi đã hiểu sync làm gì.
- ✅ Học phrasing trước khi học effect.
- ✅ Ghi âm mọi buổi tập và nghe lại ít nhất một lần.
- ✅ Nghe set của DJ khác và chú ý đoạn chuyển bài, không chỉ đoạn drop.
- ✅ Gắn tag BPM, key và dòng nhạc ngay khi nhập bài vào thư viện.
- ❌ Tập với mười bài khác BPM ngay từ đầu.
- ❌ Bật effect liên tục để che lỗi mix.
- ❌ Đánh giá bản thân qua một bản mix đầu tiên.
- ❌ Mua đồ đắt trước khi biết mình thích dòng nhạc nào.
- ❌ Chép nguyên set của DJ khác rồi đăng như của mình.

## Động tác thừa cần tránh

| Động tác thừa | Vì sao thừa | Thay bằng |
| --- | --- | --- |
| Vặn EQ liên tục suốt bài | Mất groove, tai mệt | Chỉ chạm EQ khi chuyển bài |
| Bật 3–4 effect cùng lúc | Mix bị đục, khó kiểm soát | Một effect, một mục đích, một thời điểm |
| Xoay jog wheel khi chưa cần | Làm lệch phách đang khớp | Chỉ nudge khi nghe lệch |
| Đặt cue ở giữa bài | Không có điểm vào hợp lý | Cue ở phách 1 của intro hoặc của câu nhạc |
| Học mười kỹ thuật một lúc | Không sâu, dễ bỏ cuộc | Một kỹ thuật mỗi tuần, lặp tới khi thành thạo |

## Tư tưởng cũ cần bỏ

"Sync là gian lận", "phải thuộc một nghìn bài", "đồ đắt mới là DJ giỏi", "effect nhiều mới là tay nghề". Cả bốn đều làm người mới nản hoặc tiêu tiền sai chỗ. Bài [Tư duy DJ](${lesson('tu-duy-dj', 'vi')}) nói vì sao và thay bằng gì. Nói ngắn gọn: hiểu 50 bài kỹ hơn biết tên 1.000 bài, và controller rẻ tập đều thắng bộ máy đắt để phủ bụi.

## Bắt đầu từ đâu

Nếu chưa có thiết bị, đọc [Controller DJ là gì](${lesson('controller-dj', 'vi')}). Nếu đã cắm máy, đi thẳng tới [Cue point](${lesson('cue-point', 'vi')}) rồi [BPM](${lesson('bpm-la-gi', 'vi')}). Khi đã beatmatch được hai bài, ra club nghe DJ chơi thật là bài học tốt nhất: xem [các đêm sắp tới trên FeestFinder](/) và để ý họ chuyển bài ở đâu.`;

const en = `**Learning to DJ from zero** means learning to choose tracks and join them into one flow: two records at the same speed, changes landing on the phrase, energy rising and falling on purpose. You need a two-channel controller, a laptop, headphones and 20–30 minutes a day. This page maps sixteen lessons, each one move you can try.

${fig('en')}

## What does a DJ actually do?

A DJ does four things, in order of importance: **choosing tracks**, **reading the room**, **joining tracks** and **keeping the sound clean**. Technique (beatmatching, EQ, effects) is simply how you do the third one smoothly. Nobody on the floor remembers which knob you turned; they remember the moment the whole room raised its hands, or the moment the music stumbled and everyone froze.

So this series does not promise to make you a professional in thirty days. It teaches one concrete move on the controller at a time, in the order your ears and hands need them: hearing the beat, counting phrases, bringing two tracks to the same speed, and only then EQ, sets and the market.

## What you need to start

| What | Suggestion | Why |
| --- | --- | --- |
| Controller | Two channels, jog wheels, pitch faders, three-band EQ | Every basic move; clubs use the same layout |
| Laptop | The one you already have, with some free space | DJ software is lighter than you think |
| Software | rekordbox, Serato DJ, Traktor or djay Pro | Often bundled with or unlocked by the controller |
| Headphones | Closed-back, wired | Hear the next track without the speakers bleeding in |
| Speakers | Computer speakers or studio monitors | If you can hear the bass, you can practise |
| Music | 10–20 tracks of one style at close tempos | A few tracks you know well teach faster |

Do not buy expensive gear before you know which style you love. An entry-level controller shares its layout with a club setup, so what your hands learn on a cheap unit carries over to the real thing. The details are in [What is a DJ controller](${lesson('controller-dj', 'en')}).

## Six modules, sixteen lessons

| Module | What you learn | Lessons |
| --- | --- | --- |
| 1 · Gear and software | The controller, wiring, your first cue | [DJ controller](${lesson('controller-dj', 'en')}) · [Cue points](${lesson('cue-point', 'en')}) |
| 2 · Hearing and reading music | Counting BPM and phrases, reading waveforms, keys | [BPM](${lesson('bpm-la-gi', 'en')}) · [Phrasing](${lesson('phrasing-dj', 'en')}) · [Harmonic mixing](${lesson('harmonic-mixing', 'en')}) |
| 3 · Beatmatching and mixing | Beatmatching by ear, sync, EQ, faders | [Beatmatching by ear](${lesson('beatmatch-bang-tai', 'en')}) · [The sync button](${lesson('nut-sync', 'en')}) · [EQ mixing](${lesson('eq-mixing', 'en')}) · [Crossfader](${lesson('crossfader-channel-fader', 'en')}) |
| 4 · Building a 30–60 minute set | Track order, the energy curve, recording and posting a mix | [Building a set](${lesson('xay-set-dj', 'en')}) · [Recording and posting a mix](${lesson('ghi-am-dang-mix', 'en')}) |
| 5 · Music and the market | File formats, buying music, DJing in Vietnam | [File formats](${lesson('file-nhac-dj', 'en')}) · [Buying music](${lesson('mua-nhac-dj', 'en')}) · [DJing in Vietnam](${lesson('dj-viet-nam', 'en')}) |
| 6 · Mindset and growth | The craft, old ideas to drop, the vocabulary | [DJ mindset](${lesson('tu-duy-dj', 'en')}) · [25 DJ terms](${lesson('thuat-ngu-dj', 'en')}) |

Every lesson follows the same shape: what to prepare, the steps (what to do, where to look on the controller, what to listen for), signs you got it right, common mistakes, dos and don'ts, wasted moves, questions people ask and the next lesson. Open the software, plug in the controller and do each step as you read it.

## Your first week: 20–30 minutes a day

1. **Day 1:** install the software and connect the controller, headphones and speakers; pick ten house or techno tracks in one tempo range.
2. **Day 2:** set a cue on the first beat of every track, then press play exactly on the beat of the track that is running.
3. **Day 3:** count 1-2-3-4 along with the kick, then count 32-beat phrases and guess where each track "changes scene".
4. **Day 4:** beatmatch two tracks by ear using only the pitch fader and the jog wheel, with sync switched off.
5. **Day 5:** blend two tracks with the channel faders, cut the incoming bass and swap the basslines at the start of a phrase.
6. **Day 6:** join four tracks into a fifteen-minute mix and record it.
7. **Day 7:** listen back, mark three stumbles and spend the next week fixing exactly those three.

Short, regular practice beats a five-hour weekend session: your ears need a night's sleep to remember what two kicks locked together feel like.

## What a 30-minute session looks like

Split each session into three parts, and give only one of them to the thing you are learning:

- **5 minutes of warm-up:** run once through a transition you could already do yesterday, so your hands and ears find the groove.
- **15 minutes on one skill:** just one, for example swapping the bass at the start of a phrase. Repeat it with the same two tracks until you can do it three times in a row without a stumble.
- **10 minutes of free play, recorded:** join three or four tracks by feel and do not stop to fix anything. This part teaches you to recover while the music keeps running, exactly as you will have to when you play for real.

Write one line in a notebook after each session: what you practised, where you still stumble, what you will do tomorrow. After a month that notebook shows your progress more clearly than any compliment. When you have joined four tracks without a stumble for three weeks running, invite a few friends over to listen: playing in front of real people is a skill of its own, so practise it early, somewhere without pressure.

## Dos and don'ts

- ✅ Practise 20–30 minutes a day with the same two or three tracks until you know every phrase.
- ✅ Beatmatch by ear first, and use sync later, once you understand what it does.
- ✅ Learn phrasing before you learn effects.
- ✅ Record every session and listen back at least once.
- ✅ Listen to other DJs' sets and pay attention to the transitions, not only the drops.
- ✅ Tag BPM, key and style the moment a track enters your library.
- ❌ Practise with ten tracks at very different tempos from day one.
- ❌ Keep effects running to hide mixing mistakes.
- ❌ Judge yourself by your first mix.
- ❌ Buy expensive gear before you know which style you love.
- ❌ Copy another DJ's set track for track and post it as your own.

## Wasted moves to drop

| Wasted move | Why it is wasted | Do this instead |
| --- | --- | --- |
| Turning the EQ all through a track | Kills the groove and tires your ears | Touch the EQ only during a transition |
| Running three or four effects at once | Muddies the mix and is hard to control | One effect, one purpose, one moment |
| Spinning the jog wheel when nothing is wrong | Knocks a matched beat out of line | Nudge only when you hear a drift |
| Setting a cue in the middle of a track | Leaves no sensible way in | Cue on beat one of the intro or a phrase |
| Learning ten techniques at once | Nothing goes deep and you give up | One technique a week, repeated until it is easy |

## Old ideas to drop

"Sync is cheating", "you must know a thousand tracks", "expensive gear makes a good DJ", "more effects means more skill". All four either discourage beginners or send their money to the wrong place. The [DJ mindset](${lesson('tu-duy-dj', 'en')}) lesson explains why and what to think instead. In short: knowing fifty tracks deeply beats knowing the names of a thousand, and a cheap controller used every day beats an expensive one gathering dust.

## Where to start

If you have no gear yet, read [What is a DJ controller](${lesson('controller-dj', 'en')}). If you are already plugged in, go straight to [Cue points](${lesson('cue-point', 'en')}) and then [BPM](${lesson('bpm-la-gi', 'en')}). Once you can beatmatch two tracks, the best lesson is watching a DJ play for real: browse [the coming nights on FeestFinder](/?lang=en) and notice where they change tracks.`;

export const hocDj: PackPost = {
  key: PILLAR,
  slug: 'hoc-dj-tu-so-0',
  category: 'dj',
  lang: 'vi',
  title: {
    vi: 'Học DJ từ số 0: lộ trình 16 bài thực hành trên controller',
    en: 'Learn to DJ from zero: 16 hands-on controller lessons',
  },
  excerpt: {
    vi: 'Học DJ từ số 0 với controller hai kênh: thiết bị cần có, lộ trình 6 module 16 bài, kế hoạch tuần đầu 20–30 phút mỗi ngày, nên và không nên, động tác thừa.',
    en: 'Learn to DJ from zero on a two-channel controller: the gear you need, six modules and sixteen lessons, a first-week plan of 20–30 minutes a day, and the dos and don’ts.',
  },
  cover: coverOf(m),
  styles: ['house', 'techno'],
  facts: [
    { label: { vi: 'Dành cho', en: 'For' }, value: { vi: 'Người mới có controller đầu tiên hoặc sắp mua', en: 'Beginners with a first controller, or about to buy one' } },
    { label: { vi: 'Thiết bị tối thiểu', en: 'Minimum gear' }, value: { vi: 'Controller 2 kênh, laptop, tai nghe chụp tai, loa', en: 'Two-channel controller, laptop, closed-back headphones, speakers' } },
    { label: { vi: 'Phần mềm', en: 'Software' }, value: { vi: 'rekordbox, Serato DJ, Traktor, djay Pro', en: 'rekordbox, Serato DJ, Traktor, djay Pro' } },
    { label: { vi: 'Nhịp tập', en: 'Practice rhythm' }, value: { vi: '20–30 phút mỗi ngày', en: '20–30 minutes a day' } },
    { label: { vi: 'Lộ trình', en: 'Path' }, value: { vi: '6 module, 16 bài', en: '6 modules, 16 lessons' } },
    { label: { vi: 'Dòng nhạc dễ tập', en: 'Easiest styles to practise' }, value: { vi: 'House, techno (kick 4/4 đều, intro dài)', en: 'House, techno (a steady 4/4 kick, long intros)' } },
  ],
  body: { vi, en },
  faq: [
    { q: { vi: 'Học DJ mất bao lâu?', en: 'How long does it take to learn to DJ?' }, a: { vi: 'Tập 20–30 phút mỗi ngày, phần lớn người mới beatmatch được hai bài bằng tai sau vài tuần và ghép được một mix 30 phút trơn tru sau vài tháng. Tốc độ phụ thuộc vào việc tập đều, không phụ thuộc vào giá thiết bị.', en: 'Practising 20–30 minutes a day, most beginners can beatmatch two tracks by ear within a few weeks and play a smooth 30-minute mix within a few months. Regular practice matters far more than the price of the gear.' } },
    { q: { vi: 'Người mới nên mua controller hay CDJ?', en: 'Should a beginner buy a controller or CDJs?' }, a: { vi: 'Controller hai kênh là lựa chọn hợp lý: rẻ hơn nhiều, có cùng bố cục jog wheel, pitch fader và EQ như bàn club. Khi đã chơi đều, bạn có thể tập thêm trên CDJ và mixer ở studio thuê theo giờ trước khi đi gig.', en: 'A two-channel controller is the sensible choice: far cheaper, with the same layout of jog wheels, pitch faders and EQ as a club setup. Once you play regularly, rent time on CDJs and a mixer in a studio before your first gig.' } },
    { q: { vi: 'Có cần biết nhạc lý để làm DJ không?', en: 'Do I need music theory to DJ?' }, a: { vi: 'Không cần nhạc lý bài bản. Bạn cần nghe được phách, đếm được câu nhạc 8, 16 hay 32 phách và biết hai bài có hợp key hay không. Phần mềm phân tích BPM và key giúp nhiều, phần còn lại là tai được luyện mỗi ngày.', en: 'Not formal theory. You need to hear the beat, count 8, 16 and 32-beat phrases and tell whether two tracks sit well together in key. The software analyses BPM and key for you; the rest is ears trained every day.' } },
    { q: { vi: 'Nên tập dòng nhạc nào đầu tiên?', en: 'Which style should I practise first?' }, a: { vi: 'House và techno dễ tập nhất: kick 4/4 đều, tempo ổn định quanh 120–130 BPM, intro và outro dài để có thời gian nối bài. Khi đã quen, hãy chuyển sang dòng nhạc bạn thật sự muốn chơi.', en: 'House and techno are the easiest: a steady four-on-the-floor kick, stable tempos around 120–130 BPM and long intros and outros that give you time to blend. Once comfortable, move on to the style you really want to play.' } },
    { q: { vi: 'Dùng nút sync có phải là gian lận không?', en: 'Is using the sync button cheating?' }, a: { vi: 'Không. Sync là một công cụ, như máy tính trong phòng thi được phép mang vào. Kỹ năng thật là biết khi nào nên dùng và tự sửa được khi sync sai, vì vậy hãy học beatmatch bằng tai trước rồi dùng sync có chủ đích.', en: 'No. Sync is a tool, like a calculator you are allowed to bring into an exam. The real skill is knowing when to use it and being able to fix things when it gets them wrong, so learn to beatmatch by ear first and then use sync on purpose.' } },
  ],
  sources: [
    { title: 'Disc jockey', url: wiki('Disc jockey'), publisher: 'Wikipedia' },
    { title: 'DJ controller', url: wiki('DJ controller'), publisher: 'Wikipedia' },
    { title: 'rekordbox', url: 'https://rekordbox.com/en/', publisher: 'AlphaTheta' },
    { title: 'Serato DJ', url: 'https://serato.com/dj', publisher: 'Serato' },
    { title: 'Learn to beatmatch', url: 'https://www.digitaldjtips.com/2011/02/learn-to-beatmatch/', publisher: 'Digital DJ Tips' },
  ],
  tracks: [],
};
