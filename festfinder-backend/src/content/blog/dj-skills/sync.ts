import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, DJ_MEDIA } from './media.ts';
import { figure, lesson, lessonFacts, MODULES, wiki } from './shared.ts';

const fig = (lang: 'vi' | 'en') => figure(DJ_MEDIA.bpm,
  { vi: 'DJ Matthew Fisher chơi set năm 2013', en: 'DJ Matthew Fisher playing a set in 2013' },
  { vi: 'Khi máy lo phần tốc độ, đôi tay và đôi mắt của DJ dành cho EQ và cho đám đông', en: 'When the machine handles tempo, a DJ’s hands and eyes are free for the EQ and the crowd' }, lang);

const vi = `**Nút sync** tự đưa bài vào về cùng BPM với bài đang chạy, và ở chế độ beat sync còn khớp luôn vị trí phách, dựa trên beatgrid của phần mềm. Beatgrid đúng thì sync đáng tin; beatgrid sai thì sync sai theo. Sau bài này bạn biết bật sync đúng cách, kiểm tra beatgrid và nhận ra lúc sync làm lệch phách.

## Sync làm gì và không làm gì

| Việc | Sync có làm không? | Ghi chú |
| --- | --- | --- |
| Khớp tốc độ (BPM) | Có | Theo con số BPM phần mềm đo |
| Khớp vị trí phách | Có, ở chế độ beat sync | Chỉ đúng khi beatgrid của cả hai bài đúng |
| Chọn bài hợp nhau | Không | Việc của bạn: dòng nhạc, key, năng lượng |
| Chuyển bài đúng đầu câu | Không | Bạn vẫn phải đếm câu nhạc |
| EQ, đổi bass, fader | Không | Đây là phần tạo nên một lần chuyển bài hay |
| Đọc phòng | Không | Không máy nào làm được |

Sync có hai mức: **tempo sync** chỉ khớp BPM, còn **beat sync** khớp cả BPM lẫn vị trí phách. Phần mềm thường có khái niệm deck **master**: deck đang chạy giữ tốc độ, deck bật sync chạy theo. Tên gọi cụ thể khác nhau giữa rekordbox, Serato DJ và Traktor, nhưng nguyên tắc giống nhau. Trên đầu CDJ ở club, các đầu phải được nối với nhau (Pro DJ Link) thì mới sync được.

## Bạn cần chuẩn bị

- Phần mềm DJ đã phân tích BPM và beatgrid cho thư viện.
- Hai bài cùng dòng nhạc, đã từng beatmatch bằng tai (xem [bài beatmatch bằng tai](${lesson('beatmatch-bang-tai', 'vi')})).
- Tai nghe, để kiểm tra sync bằng tai.

## Các bước thực hiện

### Bước 1: Kiểm tra beatgrid của hai bài

- **Làm gì:** mở waveform phóng to, xem vạch đầu tiên của beatgrid (thường đậm hơn) có nằm đúng trên kick đầu tiên không. Tua tới giữa và cuối bài: các vạch vẫn phải nằm trên kick.
- **Nhìn đâu trên controller:** waveform phóng to và các vạch beatgrid trên màn hình laptop.
- **Nghe gì để biết đúng:** bật tiếng click của beatgrid (nếu có), click rơi đúng kick từ đầu tới cuối.

### Bước 2: Chọn deck master

- **Làm gì:** để bài đang chạy trên loa làm deck master. Thường phần mềm tự chọn deck đang phát; nếu không, bấm nút master trên deck đó.
- **Nhìn đâu:** nút hoặc chữ "MASTER" sáng trên deck đang phát.
- **Nghe gì để biết đúng:** chưa cần nghe; tốc độ bài đang chạy không thay đổi khi bạn bật sync ở deck kia.

### Bước 3: Bật sync ở deck bài vào

- **Làm gì:** nạp bài B, bấm SYNC trên deck của bài B. Con số BPM của B nhảy về bằng bài A; ở chế độ beat sync, bộ đo pha (phase meter) của hai deck thẳng hàng.
- **Nhìn đâu:** con số BPM hai deck, bộ đo pha nếu phần mềm có.
- **Nghe gì để biết đúng:** bấm play B ở phách 1, trong tai nghe hai kick khít nhau ngay.

### Bước 4: Vẫn tự chọn chỗ vào bài

- **Làm gì:** sync không biết đầu câu nhạc ở đâu. Đếm câu của bài A và bấm play bài B ở phách 1 của một câu mới (xem [phrasing](${lesson('phrasing-dj', 'vi')})).
- **Nhìn đâu:** bộ đếm nhịp và waveform tổng của bài A.
- **Nghe gì để biết đúng:** khi bài A đổi đoạn, bài B cũng đổi đoạn cùng lúc.

### Bước 5: Nghe kiểm tra suốt 32 phách

- **Làm gì:** dù đã bật sync, vẫn nghe hai bài trong tai nghe ít nhất 32 phách. Nếu nghe tiếng lệch, tắt sync và beatmatch bằng tai, sau đó sửa beatgrid của bài đó.
- **Nhìn đâu:** không nhìn; nghe.
- **Nghe gì để biết đúng:** hai kick vẫn khít từ đầu tới cuối câu.

${fig('vi')}

## Khi nào nên dùng sync

- Khi bạn cần hai tay cho EQ, loop, hot cue hay effect trong một lần chuyển bài dài.
- Khi chơi ba bốn deck cùng lúc.
- Khi beatgrid đã được kiểm tra kỹ, như với phần lớn nhạc điện tử làm trên máy.
- Khi bạn đã beatmatch bằng tai được và muốn dành sự chú ý cho đám đông.

## Khi nào không nên

- Trong những tuần đầu học, khi tai chưa quen nghe lệch phách.
- Với bài có tay trống thật hoặc tốc độ dao động (disco, funk, nhạc cũ): beatgrid không thẳng.
- Với bài chưa kiểm beatgrid.
- Khi chuyển giữa hai dòng nhạc rất khác tốc độ: sync kéo bài lệch xa, nghe méo.

## Dấu hiệu bạn làm đúng

- Bạn kiểm beatgrid trước khi tin sync.
- Bạn nghe ra ngay khi sync lệch và tắt nó trong một hai phách.
- Bạn dùng thời gian rảnh tay để đổi bass đúng đầu câu và nhìn đám đông.

## Lỗi thường gặp và cách sửa

| Lỗi | Nghe hoặc nhìn ra sao | Cách sửa |
| --- | --- | --- |
| Beatgrid lệch từ đầu | Sync bật mà kick vẫn lệch đều | Dời vạch đầu của beatgrid lên đúng kick đầu tiên |
| BPM gấp đôi hoặc gấp nửa | Bài vào chạy nhanh gấp đôi hoặc chậm một nửa | Nhân 2 hoặc chia 2 trong phần chỉnh beatgrid |
| Nhầm deck master | Bài đang chạy bỗng đổi tốc độ | Đặt bài đang phát làm master trước khi bật sync |
| Sync với bài có tay trống thật | Khớp đầu bài, lệch dần về sau | Tắt sync, beatmatch bằng tai |
| Nghĩ sync lo cả phrasing | Breakdown chen vào giữa drop | Vẫn đếm câu nhạc và vào bài ở phách 1 |

## Do & Don't

- ✅ Học beatmatch bằng tai trước, dùng sync sau.
- ✅ Kiểm beatgrid mỗi bài mới nhập.
- ✅ Dùng thời gian sync tiết kiệm được cho EQ, phrasing và đám đông.
- ❌ Bật sync rồi không nghe nữa.
- ❌ Dùng sync với bài chưa kiểm beatgrid khi đang diễn.
- ❌ Khinh người dùng sync, hoặc ngại dùng nó vì sợ bị chê.

## Động tác thừa cần tránh

- **Bấm sync rồi vẫn nudge jog liên tục:** nếu beatgrid đúng, sync đã khớp; nudge thêm chỉ làm lệch. Nếu phải nudge, beatgrid đang sai: sửa beatgrid.
- **Bật tắt sync nhiều lần trong một lần chuyển bài:** mỗi lần bật lại có thể làm bài nhảy tốc độ. Quyết định trước: sync hay tai.
- **Ngồi sửa beatgrid khi đang diễn:** việc của buổi chuẩn bị nhạc, không phải lúc đang chơi.

## Tư tưởng cũ cần bỏ: "sync là gian lận"

| Tư tưởng cũ | Vì sao cần bỏ | Tư duy mới |
| --- | --- | --- |
| "Sync là gian lận" | Sync là công cụ; kỹ năng thật là biết khi nào dùng, khi nào không | Học beatmatch bằng tai, nhưng không khinh thường sync |
| "DJ dùng sync là DJ kém" | Người nghe chỉ nghe kết quả: chọn bài, chuyển bài, năng lượng | Đánh giá một set bằng tai, không bằng nút được bấm |

## Bài tập 20 phút

1. Chọn năm bài, kiểm beatgrid từng bài theo bước 1, sửa những bài lệch.
2. Bật sync, chuyển qua lại giữa năm bài, mỗi lần nghe kiểm tra 32 phách.
3. Chọn một bài có tay trống thật, thử sync và nghe nó lệch dần.
4. Tắt sync, beatmatch bài đó bằng tai.
5. Ghi lại bài nào an toàn để sync, bài nào phải beatmatch bằng tai.

## Bài tiếp theo

Hai bài đã khớp phách, giờ làm cho chúng chồng lên nhau mà không đục: [EQ mixing: cắt bass khi chuyển bài](${lesson('eq-mixing', 'vi')}). Sau đó là [crossfader và channel fader](${lesson('crossfader-channel-fader', 'vi')}). Cả lộ trình ở [Học DJ từ số 0](${lesson('hoc-dj-tu-so-0', 'vi')}).`;

const en = `**The sync button** brings the incoming track to the same BPM as the playing one, and in beat sync mode also lines up the beats, using the software's beatgrid. With a correct grid, sync is reliable; with a wrong one, it goes wrong too. After this lesson you can use sync properly, check beatgrids and hear when sync drifts.

## What sync does and does not do

| Job | Does sync do it? | Notes |
| --- | --- | --- |
| Matching tempo (BPM) | Yes | From the BPM the software measured |
| Matching where the beats fall | Yes, in beat sync mode | Only right when both tracks' beatgrids are right |
| Choosing tracks that work together | No | Your job: style, key, energy |
| Changing tracks on the phrase | No | You still have to count phrases |
| EQ, bass swaps, faders | No | This is what makes a transition good |
| Reading the room | No | No machine can |

Sync comes at two levels: **tempo sync** matches BPM only, while **beat sync** matches BPM and beat position. Software usually has the idea of a **master** deck: the playing deck holds the tempo and the synced deck follows. The exact names differ between rekordbox, Serato DJ and Traktor, but the principle is the same. On club CDJs, the players must be linked to each other (Pro DJ Link) before sync works.

## What you need

- DJ software that has analysed BPM and beatgrids for your library.
- Two tracks of one style that you have already beatmatched by ear (see [the beatmatching by ear lesson](${lesson('beatmatch-bang-tai', 'en')})).
- Headphones, to check sync by ear.

## Step by step

### Step 1: Check both tracks' beatgrids

- **Do:** open the zoomed waveform and check that the first beatgrid line (usually bolder) sits right on the first kick. Skip to the middle and the end: the lines must still sit on the kicks.
- **Look at:** the zoomed waveform and the beatgrid lines on the laptop screen.
- **Listen for:** switch on the beatgrid click if there is one; it lands on the kick from start to finish.

### Step 2: Choose the master deck

- **Do:** make the track playing on the speakers the master deck. Software usually picks the playing deck itself; if not, press the master button on that deck.
- **Look at:** the lit "MASTER" button or label on the playing deck.
- **Listen for:** nothing yet; the playing track's speed does not change when you sync the other deck.

### Step 3: Switch sync on for the incoming deck

- **Do:** load track B and press SYNC on its deck. B's BPM jumps to match track A; in beat sync mode, the two decks' phase meters line up.
- **Look at:** the BPM on both decks, and the phase meter if your software has one.
- **Listen for:** start B on beat one and the two kicks lock immediately in your headphones.

### Step 4: Still choose where the track comes in

- **Do:** sync has no idea where a phrase starts. Count track A's phrases and start track B on beat one of a new phrase (see [phrasing](${lesson('phrasing-dj', 'en')})).
- **Look at:** the beat counter and track A's overview waveform.
- **Listen for:** when track A changes section, track B changes at the same moment.

### Step 5: Listen through 32 beats

- **Do:** even with sync on, listen to both tracks in your headphones for at least 32 beats. If you hear a drift, switch sync off and beatmatch by ear, then fix that track's beatgrid later.
- **Look at:** nothing; listen.
- **Listen for:** the two kicks stay locked to the end of the phrase.

${fig('en')}

## When to use sync

- When you need both hands for EQ, loops, hot cues or effects during a long transition.
- When you play three or four decks at once.
- When the beatgrids have been checked, as with most electronic music made on computers.
- When you can already beatmatch by ear and want to give your attention to the crowd.

## When not to

- In your first weeks of learning, before your ears know what drift sounds like.
- With tracks played by a live drummer or with drifting tempos (disco, funk, older music): their beatgrids are not straight.
- With tracks whose beatgrids you have not checked.
- Between two styles with very different tempos: sync drags a track far from its speed and it sounds warped.

## Signs you got it right

- You check the beatgrid before you trust sync.
- You hear at once when sync drifts and switch it off within a beat or two.
- You spend the freed-up time swapping the bass on the phrase and watching the crowd.

## Common mistakes and fixes

| Mistake | What you hear or see | Fix |
| --- | --- | --- |
| A beatgrid off from the start | Sync is on but the kicks are evenly apart | Move the first grid line onto the first kick |
| Doubled or halved BPM | The incoming track runs twice as fast or half as fast | Double or halve it in the beatgrid editor |
| The wrong master deck | The playing track suddenly changes speed | Make the playing track the master before syncing |
| Syncing a track with a live drummer | Locked at first, drifting later | Switch sync off and beatmatch by ear |
| Thinking sync handles phrasing | A breakdown cuts into the middle of a drop | Keep counting phrases and start on beat one |

## Dos and don'ts

- ✅ Learn to beatmatch by ear first and use sync after.
- ✅ Check the beatgrid of every new track.
- ✅ Spend the time sync saves on EQ, phrasing and the crowd.
- ❌ Switch sync on and stop listening.
- ❌ Sync tracks with unchecked beatgrids during a gig.
- ❌ Look down on DJs who use sync, or avoid it for fear of what people think.

## Wasted moves to drop

- **Pressing sync and still nudging the jog all the time:** with a correct grid, sync has already locked it; nudging only knocks it out. If you have to nudge, the grid is wrong: fix the grid.
- **Toggling sync on and off during a transition:** each time it comes back on, the track may jump in speed. Decide before you start: sync or ears.
- **Fixing beatgrids in the middle of a gig:** that belongs to preparing your music, not to playing.

## Old idea to drop: "sync is cheating"

| Old idea | Why drop it | New way of thinking |
| --- | --- | --- |
| "Sync is cheating" | Sync is a tool; the real skill is knowing when to use it and when not to | Learn to beatmatch by ear, without looking down on sync |
| "A DJ who uses sync is a bad DJ" | Listeners only hear the result: track choice, transitions, energy | Judge a set with your ears, not by the buttons pressed |

## A 20-minute drill

1. Pick five tracks, check each beatgrid as in step 1 and fix any that are off.
2. Switch sync on and move between the five tracks, checking 32 beats by ear each time.
3. Pick a track with a live drummer, sync it and hear it gradually drift.
4. Switch sync off and beatmatch that track by ear.
5. Note which tracks are safe to sync and which need beatmatching by ear.

## Next lesson

The beats are locked; now make the two tracks overlap without turning to mud: [EQ mixing: cutting the bass in a transition](${lesson('eq-mixing', 'en')}). Then comes [the crossfader and channel faders](${lesson('crossfader-channel-fader', 'en')}). The whole path is at [Learn to DJ from zero](${lesson('hoc-dj-tu-so-0', 'en')}).`;

export const sync: PackPost = {
  key: 'dj-skills/sync',
  slug: 'nut-sync',
  category: 'dj',
  lang: 'vi',
  title: {
    vi: 'Nút sync DJ: khi nào nên dùng, khi nào không',
    en: 'The DJ sync button: when to use it and when not to',
  },
  excerpt: {
    vi: 'Nút sync khớp tốc độ và phách dựa trên beatgrid. Cách kiểm beatgrid, chọn deck master, khi nào nên và không nên dùng sync, và vì sao sync không phải gian lận.',
    en: 'The sync button matches tempo and beats from the beatgrid. How to check grids, set the master deck, when to use sync and when not to, and why it is not cheating.',
  },
  cover: coverOf(DJ_MEDIA.sync),
  styles: [],
  facts: lessonFacts({
    module: MODULES.mixing, minutes: '20',
    gear: { vi: 'Phần mềm đã phân tích beatgrid, 5 bài, tai nghe', en: 'Software with beatgrids analysed, 5 tracks, headphones' },
    first: { vi: 'Beatmatch bằng tai', en: 'Beatmatching by ear' },
    after: { vi: 'Dùng sync có chủ đích và nhận ra lúc nó sai', en: 'Use sync on purpose and hear when it goes wrong' },
  }),
  body: { vi, en },
  faq: [
    { q: { vi: 'Nút sync trong DJ làm gì?', en: 'What does the sync button do?' }, a: { vi: 'Nút sync đưa bài vào về cùng BPM với bài đang chạy, và ở chế độ beat sync còn khớp vị trí phách, dựa trên beatgrid phần mềm phân tích. Nó không chọn bài, không đếm câu nhạc và không lo EQ: những việc đó vẫn là của DJ.', en: 'Sync brings the incoming track to the same BPM as the playing one and, in beat sync mode, lines up the beats, using the beatgrid the software analysed. It does not choose tracks, count phrases or handle the EQ: those remain the DJ’s job.' } },
    { q: { vi: 'Dùng sync có phải gian lận không?', en: 'Is using sync cheating?' }, a: { vi: 'Không. Sync là công cụ, giống như phần mềm phân tích BPM hay key. Người nghe chỉ nghe kết quả: bài được chọn, cách chuyển bài và năng lượng của set. Kỹ năng thật là biết khi nào dùng sync và tự sửa được khi nó sai.', en: 'No. Sync is a tool, like software that analyses BPM or key. Listeners only hear the result: the tracks chosen, the transitions and the energy of the set. The real skill is knowing when to use sync and being able to fix things when it goes wrong.' } },
    { q: { vi: 'Vì sao bật sync mà phách vẫn lệch?', en: 'Why do the beats drift even with sync on?' }, a: { vi: 'Thường do beatgrid sai: vạch đầu không nằm trên kick, BPM bị gấp đôi hoặc gấp nửa, hoặc bài có tay trống thật nên tốc độ dao động. Tắt sync, beatmatch bằng tai để cứu lần chuyển bài, rồi sửa beatgrid của bài đó sau buổi diễn.', en: 'Usually the beatgrid is wrong: the first line is not on the kick, the BPM is doubled or halved, or a live drummer makes the tempo drift. Switch sync off and beatmatch by ear to save the transition, then fix that track’s beatgrid after the gig.' } },
    { q: { vi: 'Người mới có nên dùng sync không?', en: 'Should beginners use sync?' }, a: { vi: 'Nên học beatmatch bằng tai trong vài tuần đầu, để tai biết tiếng lệch phách là gì. Sau đó dùng sync có chủ đích, khi cần rảnh tay cho EQ và phrasing. Học sync trước mà không biết beatmatch, bạn sẽ bế tắc khi sync sai.', en: 'Learn to beatmatch by ear for your first few weeks, so your ears know what drift sounds like. Then use sync on purpose, when you need your hands free for EQ and phrasing. Learn sync first without beatmatching and you will be stuck the moment sync gets it wrong.' } },
    { q: { vi: 'Đầu CDJ ở club có sync được không?', en: 'Can club CDJs sync?' }, a: { vi: 'Được, nếu các đầu CDJ được nối với nhau bằng Pro DJ Link và nhạc đã được chuẩn bị bằng rekordbox với beatgrid đúng. Nhiều DJ vẫn beatmatch bằng tai trên CDJ, nên hãy tập cả hai trước khi chơi ở club.', en: 'Yes, if the CDJs are linked to each other with Pro DJ Link and the music was prepared in rekordbox with correct beatgrids. Many DJs still beatmatch by ear on CDJs, so practise both before you play a club.' } },
  ],
  sources: [
    { title: 'Beatmatching', url: wiki('Beatmatching'), publisher: 'Wikipedia' },
    { title: 'rekordbox FAQ', url: 'https://rekordbox.com/en/support/faq/', publisher: 'AlphaTheta' },
    { title: 'Pro tips: beatgrids in Serato DJ', url: 'https://serato.com/latest/blog/16797/pro-tips-beatgrids-in-serato-dj', publisher: 'Serato' },
    { title: 'How to edit beatgrids manually, and why you should do it', url: 'https://www.thomannmusic.com/blog/learn/how-to-edit-beatgrids-manually-and-why-you-should-do-it/', publisher: 'Thomann' },
    { title: 'Learn to beatmatch', url: 'https://www.digitaldjtips.com/2011/02/learn-to-beatmatch/', publisher: 'Digital DJ Tips' },
  ],
  tracks: [],
};
