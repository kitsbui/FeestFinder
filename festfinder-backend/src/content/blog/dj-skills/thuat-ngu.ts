import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, DJ_MEDIA } from './media.ts';
import { figure, lesson, lessonFacts, MODULES, wiki } from './shared.ts';

const fig = (lang: 'vi' | 'en') => figure(DJ_MEDIA.harmonic,
  { vi: 'Controller Traktor Kontrol S4 MK2 nhìn từ trên xuống', en: 'A Traktor Kontrol S4 MK2 controller seen from above' },
  { vi: 'Jog wheel, pad, fader, EQ: mỗi bộ phận trên controller là một thuật ngữ trong bài', en: 'Jog wheels, pads, faders, EQ: every part of the controller is a term on this page' }, lang);

const l = lesson;

const vi = `**Thuật ngữ DJ** là những từ người trong nghề dùng hằng ngày, phần lớn giữ nguyên tiếng Anh: BPM, cue, beatmatch, phrase, drop… Hiểu đúng 25 thuật ngữ dưới đây, bạn đọc được mọi hướng dẫn, nói chuyện được với kỹ thuật âm thanh ở club và học nhanh hơn. Mỗi thuật ngữ có lời giải thích dễ hiểu và bài để tập.

${fig('vi')}

## Thiết bị

| Thuật ngữ | Giải thích dễ hiểu | Bài liên quan |
| --- | --- | --- |
| Controller | Bàn điều khiển cắm USB, điều khiển phần mềm DJ trên laptop; gộp hai deck và một mixer vào một khối | [Controller DJ](${l('controller-dj', 'vi')}) |
| CDJ | Đầu phát nhạc độc lập dùng ở club, đọc nhạc từ USB, đi cùng một mixer rời | [Controller DJ](${l('controller-dj', 'vi')}) |
| Mixer | Phần ở giữa, nơi các kênh gặp nhau: gain, EQ, fader, nút cue tai nghe | [EQ mixing](${l('eq-mixing', 'vi')}) |
| Jog wheel | Đĩa xoay lớn trên mỗi deck: xoay mép để đẩy bài lên trước hoặc kéo lùi một chút | [Beatmatch bằng tai](${l('beatmatch-bang-tai', 'vi')}) |
| Pitch fader | Cần gạt dọc chỉnh tốc độ bài nhạc, tính bằng phần trăm | [BPM](${l('bpm-la-gi', 'vi')}) |
| Crossfader | Cần gạt ngang chia âm lượng giữa bên trái và bên phải | [Crossfader](${l('crossfader-channel-fader', 'vi')}) |

## Nghe và đọc nhạc

| Thuật ngữ | Giải thích dễ hiểu | Bài liên quan |
| --- | --- | --- |
| BPM | Số phách mỗi phút, tức tốc độ bài nhạc; house thường 120–128 | [BPM](${l('bpm-la-gi', 'vi')}) |
| Phách và nhịp | Phách (beat) là mỗi tiếng kick đều đặn; bốn phách làm một nhịp (bar) | [Phrasing](${l('phrasing-dj', 'vi')}) |
| Phrase | Câu nhạc, thường 8 nhịp tức 32 phách; thay đổi lớn rơi vào đầu câu | [Phrasing](${l('phrasing-dj', 'vi')}) |
| Key | Giọng của bài; hai bài hợp key thì giai điệu không chỏi khi chồng nhau | [Harmonic mixing](${l('harmonic-mixing', 'vi')}) |
| Breakdown | Đoạn kick và bass tắt, chỉ còn giai điệu, giọng hát: khoảng thở của bài | [Phrasing](${l('phrasing-dj', 'vi')}) |
| Drop | Đoạn mọi thứ trở lại sau build-up, năng lượng cao nhất của bài | [Phrasing](${l('phrasing-dj', 'vi')}) |

## Kỹ thuật

| Thuật ngữ | Giải thích dễ hiểu | Bài liên quan |
| --- | --- | --- |
| Cue point | Điểm đánh dấu nơi bài bắt đầu phát, thường là phách đầu tiên | [Cue point](${l('cue-point', 'vi')}) |
| Hot cue | Điểm lưu trên pad: bấm là bài nhảy tới đó và phát ngay | [Cue point](${l('cue-point', 'vi')}) |
| Beatmatching | Đưa hai bài về cùng tốc độ và cùng phách để kick khít như một tiếng | [Beatmatch bằng tai](${l('beatmatch-bang-tai', 'vi')}) |
| Sync | Nút để phần mềm tự khớp tốc độ, và cả phách, theo beatgrid | [Nút sync](${l('nut-sync', 'vi')}) |
| Beatgrid | Lưới vạch phần mềm đặt lên từng phách của bài; sync và quantize dựa vào nó | [Nút sync](${l('nut-sync', 'vi')}) |
| EQ | Ba núm low, mid, high trên mỗi kênh để cắt bớt từng dải âm khi chồng bài | [EQ mixing](${l('eq-mixing', 'vi')}) |
| Loop | Một đoạn 1, 2, 4 hay 8 nhịp lặp lại, để kéo dài intro hoặc outro | [Xây set](${l('xay-set-dj', 'vi')}) |
| Key lock | Chức năng giữ nguyên cao độ khi đổi tốc độ, để giọng hát không bị cao lên | [BPM](${l('bpm-la-gi', 'vi')}) |

## File nhạc

| Thuật ngữ | Giải thích dễ hiểu | Bài liên quan |
| --- | --- | --- |
| Lossless | Định dạng giữ đủ dữ liệu của bản gốc: WAV, AIFF, FLAC, ALAC | [File nhạc DJ](${l('file-nhac-dj', 'vi')}) |
| Bitrate | Lượng dữ liệu mỗi giây nhạc; MP3 tốt nhất là 320 kbps | [File nhạc DJ](${l('file-nhac-dj', 'vi')}) |

## Đi diễn

| Thuật ngữ | Giải thích dễ hiểu | Bài liên quan |
| --- | --- | --- |
| Set | Toàn bộ phần chơi của một DJ, thường 30 phút tới vài tiếng | [Xây set](${l('xay-set-dj', 'vi')}) |
| Warm-up | Khung giờ mở màn: giữ năng lượng vừa phải để phòng ấm dần | [Xây set](${l('xay-set-dj', 'vi')}) |
| Peak time | Giờ cao điểm, khi sàn đông nhất và năng lượng lên cao nhất | [Nghề DJ ở Việt Nam](${l('dj-viet-nam', 'vi')}) |

## Những cặp hay bị nhầm

| Cặp | Khác nhau ở đâu |
| --- | --- |
| Controller và CDJ | Controller cần laptop chạy phần mềm; CDJ tự phát nhạc từ USB |
| Beatmatch và sync | Beatmatch là kỹ năng tự khớp bằng tai; sync là máy khớp theo beatgrid |
| Cue và hot cue | Cue là một điểm tạm mỗi deck; hot cue là nhiều điểm lưu cùng bài |
| Crossfader và channel fader | Crossfader chia âm lượng giữa hai bên; channel fader chỉnh từng kênh |
| Lossless và bitrate cao | MP3 320 kbps vẫn là nén có mất dữ liệu; lossless thì không mất gì |
| Pitch fader và jog wheel | Pitch fader sửa tốc độ lâu dài; jog wheel đẩy hoặc kéo phách trong chốc lát |

## Cách nhớ thuật ngữ nhanh

1. Mỗi ngày học năm thuật ngữ và tìm đúng bộ phận đó trên controller của bạn.
2. Khi tập, nói thành tiếng việc bạn đang làm: "cue ở phách 1", "đổi bass ở đầu phrase".
3. Xem một set trên mạng và gọi tên từng việc DJ làm khi chuyển bài.
4. Sau một tuần, tự giải thích lại 25 thuật ngữ cho một người bạn không biết gì về DJ.
5. Thuật ngữ nào còn mơ hồ, mở bài liên quan và làm theo các bước.

## Do & Don't

- ✅ Giữ nguyên thuật ngữ tiếng Anh khi nói chuyện trong nghề: ai cũng hiểu.
- ✅ Học thuật ngữ cùng lúc với thao tác, không học thuộc lòng suông.
- ✅ Hỏi lại khi kỹ thuật âm thanh dùng một từ bạn chưa chắc.
- ❌ Dùng thuật ngữ để tỏ ra sành sỏi khi nói với khách hay gia chủ.
- ❌ Nhầm beatmatch với sync khi đọc hướng dẫn.
- ❌ Bỏ qua phần giải thích chỉ vì đã nghe từ đó nhiều lần.

## Bài tiếp theo

Đã nói chung một thứ tiếng, hãy bắt đầu từ thao tác đầu tiên: [cue point](${l('cue-point', 'vi')}), rồi [beatmatch bằng tai](${l('beatmatch-bang-tai', 'vi')}). Cả 16 bài nằm trong [lộ trình Học DJ từ số 0](${l('hoc-dj-tu-so-0', 'vi')}).`;

const en = `**DJ terms** are the words people in the craft use every day, most of them in English everywhere: BPM, cue, beatmatch, phrase, drop… Understand the 25 terms below and you can read any tutorial, talk to the sound engineer at a club and learn faster. Each term comes with a plain explanation and a lesson to practise it.

${fig('en')}

## Gear

| Term | In plain words | Related lesson |
| --- | --- | --- |
| Controller | A USB control surface that drives DJ software on a laptop; two decks and a mixer in one unit | [DJ controller](${l('controller-dj', 'en')}) |
| CDJ | A standalone club player that reads music from USB and works with a separate mixer | [DJ controller](${l('controller-dj', 'en')}) |
| Mixer | The middle section where the channels meet: gain, EQ, faders, headphone cue buttons | [EQ mixing](${l('eq-mixing', 'en')}) |
| Jog wheel | The large wheel on each deck: turn its edge to push a track ahead or hold it back a little | [Beatmatching by ear](${l('beatmatch-bang-tai', 'en')}) |
| Pitch fader | A vertical slider that changes a track's speed, shown as a percentage | [BPM](${l('bpm-la-gi', 'en')}) |
| Crossfader | A horizontal slider that shares volume between the left and right sides | [Crossfader](${l('crossfader-channel-fader', 'en')}) |

## Hearing and reading music

| Term | In plain words | Related lesson |
| --- | --- | --- |
| BPM | Beats per minute, the speed of a track; house usually runs at 120–128 | [BPM](${l('bpm-la-gi', 'en')}) |
| Beat and bar | A beat is each steady kick; four beats make a bar | [Phrasing](${l('phrasing-dj', 'en')}) |
| Phrase | A musical sentence, usually eight bars or 32 beats; big changes land at its start | [Phrasing](${l('phrasing-dj', 'en')}) |
| Key | A track's tonal home; two tracks in matching keys do not clash when they overlap | [Harmonic mixing](${l('harmonic-mixing', 'en')}) |
| Breakdown | The section where the kick and bass drop out, leaving melody and vocals: the track's breather | [Phrasing](${l('phrasing-dj', 'en')}) |
| Drop | The moment everything returns after the build-up, the track's peak energy | [Phrasing](${l('phrasing-dj', 'en')}) |

## Technique

| Term | In plain words | Related lesson |
| --- | --- | --- |
| Cue point | A marker where a track starts playing, usually the first beat | [Cue points](${l('cue-point', 'en')}) |
| Hot cue | A point saved on a pad: press it and the track jumps there and plays at once | [Cue points](${l('cue-point', 'en')}) |
| Beatmatching | Bringing two tracks to the same speed and beat so their kicks lock like one | [Beatmatching by ear](${l('beatmatch-bang-tai', 'en')}) |
| Sync | A button that lets the software match tempo, and beats too, from the beatgrid | [The sync button](${l('nut-sync', 'en')}) |
| Beatgrid | The grid of lines the software lays over each beat of a track; sync and quantize rely on it | [The sync button](${l('nut-sync', 'en')}) |
| EQ | The low, mid and high knobs on each channel, used to cut bands when tracks overlap | [EQ mixing](${l('eq-mixing', 'en')}) |
| Loop | A 1, 2, 4 or 8-bar section that repeats, used to stretch an intro or outro | [Building a set](${l('xay-set-dj', 'en')}) |
| Key lock | Keeps the pitch the same when you change speed, so vocals do not rise | [BPM](${l('bpm-la-gi', 'en')}) |

## Music files

| Term | In plain words | Related lesson |
| --- | --- | --- |
| Lossless | A format that keeps all of the original's data: WAV, AIFF, FLAC, ALAC | [DJ file formats](${l('file-nhac-dj', 'en')}) |
| Bitrate | The amount of data per second of music; the best MP3 is 320 kbps | [DJ file formats](${l('file-nhac-dj', 'en')}) |

## Playing out

| Term | In plain words | Related lesson |
| --- | --- | --- |
| Set | Everything a DJ plays in one slot, usually from 30 minutes to a few hours | [Building a set](${l('xay-set-dj', 'en')}) |
| Warm-up | The opening slot: keep the energy moderate so the room warms up gradually | [Building a set](${l('xay-set-dj', 'en')}) |
| Peak time | The busiest hours, when the floor is fullest and the energy highest | [DJing in Vietnam](${l('dj-viet-nam', 'en')}) |

## Pairs people mix up

| Pair | The difference |
| --- | --- |
| Controller and CDJ | A controller needs a laptop running software; a CDJ plays music from USB on its own |
| Beatmatching and sync | Beatmatching is the skill of matching by ear; sync is the machine matching from the beatgrid |
| Cue and hot cue | A cue is one temporary point per deck; hot cues are several points saved with the track |
| Crossfader and channel fader | The crossfader shares volume between two sides; a channel fader sets one channel |
| Lossless and high bitrate | A 320 kbps MP3 is still lossy; lossless loses nothing |
| Pitch fader and jog wheel | The pitch fader fixes speed for good; the jog wheel pushes or holds the beat for a moment |

## How to learn the terms quickly

1. Learn five terms a day and find each one on your own controller.
2. While you practise, say out loud what you are doing: "cue on beat one", "swap the bass at the start of the phrase".
3. Watch a set online and name each thing the DJ does during a transition.
4. After a week, explain all 25 terms to a friend who knows nothing about DJing.
5. For any term that still feels vague, open its lesson and follow the steps.

## Dos and don'ts

- ✅ Keep the English terms when you talk shop: everyone in the craft understands them.
- ✅ Learn each term together with the move it names, not by rote.
- ✅ Ask again when a sound engineer uses a word you are not sure of.
- ❌ Use jargon to sound clever with guests or hosts.
- ❌ Confuse beatmatching with sync when you read a tutorial.
- ❌ Skip an explanation just because you have heard the word many times.

## Next lesson

Now that you speak the language, start with the first move: [cue points](${l('cue-point', 'en')}), then [beatmatching by ear](${l('beatmatch-bang-tai', 'en')}). All sixteen lessons are in [Learn to DJ from zero](${l('hoc-dj-tu-so-0', 'en')}).`;

export const thuatNgu: PackPost = {
  key: 'dj-skills/thuat-ngu',
  slug: 'thuat-ngu-dj',
  category: 'dj',
  lang: 'vi',
  title: {
    vi: '25 thuật ngữ DJ cho người mới, giải thích dễ hiểu',
    en: '25 DJ terms for beginners, explained in plain words',
  },
  excerpt: {
    vi: '25 thuật ngữ DJ cho người mới: controller, CDJ, BPM, phrase, key, cue, hot cue, beatmatch, sync, beatgrid, EQ, lossless và hơn nữa, giải thích dễ hiểu kèm bài tập.',
    en: '25 DJ terms for beginners: controller, CDJ, BPM, phrase, key, cue, hot cue, beatmatching, sync, beatgrid, EQ, lossless and more, each explained with a lesson.',
  },
  cover: coverOf(DJ_MEDIA.terms),
  styles: [],
  facts: lessonFacts({
    module: MODULES.mind, minutes: '15',
    gear: { vi: 'Controller của bạn, để tìm từng bộ phận', en: 'Your controller, to find each part on it' },
    first: { vi: 'Không cần: đọc lúc nào cũng được', en: 'Nothing: read it any time' },
    after: { vi: 'Hiểu 25 thuật ngữ và các cặp hay bị nhầm', en: 'Know 25 terms and the pairs people mix up' },
  }),
  body: { vi, en },
  faq: [
    { q: { vi: 'Beatmatch nghĩa là gì?', en: 'What does beatmatching mean?' }, a: { vi: 'Beatmatch là đưa hai bài về cùng tốc độ và cùng vị trí phách để tiếng kick của chúng khít như một tiếng. DJ dùng pitch fader để sửa tốc độ và jog wheel để sửa vị trí phách, bằng tai hoặc với sự giúp đỡ của nút sync.', en: 'Beatmatching means bringing two tracks to the same speed and beat position so their kicks lock together like one sound. DJs use the pitch fader to fix speed and the jog wheel to fix position, by ear or with help from the sync button.' } },
    { q: { vi: 'Drop và breakdown khác nhau thế nào?', en: 'What is the difference between a drop and a breakdown?' }, a: { vi: 'Breakdown là đoạn kick và bass tắt, chỉ còn giai điệu hoặc giọng hát, như một khoảng thở. Drop là lúc mọi thứ trở lại sau build-up với năng lượng cao nhất. DJ thường đặt hot cue ở đầu cả hai đoạn.', en: 'A breakdown is the section where the kick and bass drop out, leaving melody or vocals, like a breather. The drop is when everything returns after the build-up at full energy. DJs often set hot cues at the start of both.' } },
    { q: { vi: 'Beatgrid là gì?', en: 'What is a beatgrid?' }, a: { vi: 'Beatgrid là lưới vạch phần mềm DJ đặt lên từng phách của bài sau khi phân tích BPM. Sync, quantize, loop và hot cue đều dựa vào beatgrid, nên khi beatgrid lệch, những chức năng này cũng lệch theo. Hãy kiểm tra beatgrid với mỗi bài mới.', en: 'A beatgrid is the grid of lines DJ software lays over each beat of a track after analysing its BPM. Sync, quantize, loops and hot cues all rely on it, so when the grid is off, they are off too. Check the beatgrid of every new track.' } },
    { q: { vi: 'Warm-up và peak time là gì?', en: 'What are warm-up and peak time?' }, a: { vi: 'Warm-up là khung giờ mở màn của một đêm: DJ giữ năng lượng vừa phải để phòng ấm dần và không chơi những bài lớn nhất. Peak time là giờ cao điểm, khi sàn đông nhất và DJ đẩy năng lượng lên cao nhất.', en: 'Warm-up is the opening slot of a night: the DJ keeps the energy moderate so the room warms up gradually and saves the biggest tracks. Peak time is the busiest stretch, when the floor is fullest and the DJ takes the energy highest.' } },
    { q: { vi: 'Có nên dịch thuật ngữ DJ sang tiếng Việt không?', en: 'Should DJ terms be translated?' }, a: { vi: 'Khi nói chuyện trong nghề, nên giữ nguyên tiếng Anh như BPM, cue, drop, vì kỹ thuật âm thanh, phần mềm và mọi hướng dẫn đều dùng những từ này. Khi giải thích cho người mới, hãy kèm lời giải thích dễ hiểu bằng tiếng Việt.', en: 'When talking shop, keep the English terms such as BPM, cue and drop, because sound engineers, software and tutorials all use them. When explaining to a newcomer in another language, add a plain explanation in their own words.' } },
  ],
  sources: [
    { title: 'Disc jockey', url: wiki('Disc jockey'), publisher: 'Wikipedia' },
    { title: 'Beatmatching', url: wiki('Beatmatching'), publisher: 'Wikipedia' },
    { title: 'rekordbox FAQ', url: 'https://rekordbox.com/en/support/faq/', publisher: 'AlphaTheta' },
    { title: 'Camelot Wheel', url: 'https://mixedinkey.com/camelot-wheel/', publisher: 'Mixed In Key' },
    { title: 'Serato DJ', url: 'https://serato.com/dj', publisher: 'Serato' },
  ],
  tracks: [],
};
