import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, DJ_MEDIA } from './media.ts';
import { figure, lesson, lessonFacts, MODULES, wiki } from './shared.ts';

const fig = (lang: 'vi' | 'en') => figure(DJ_MEDIA.terms,
  { vi: 'Hai đầu CDJ-2000 Nexus và mixer DJM-900 trong một booth', en: 'Two CDJ-2000 Nexus players and a DJM-900 mixer in a booth' },
  { vi: 'Bàn club tiêu chuẩn: hai đầu CDJ và một mixer rời. Controller gộp cả ba vào một khối', en: 'The club standard: two CDJs and a separate mixer. A controller folds all three into one unit' }, lang);

const vi = `**Controller DJ** là thiết bị cắm USB để điều khiển phần mềm DJ trên laptop: hai jog wheel thay cho hai đầu đĩa, ở giữa là một mixer với fader, EQ và nút cue. Đây là cách rẻ và gọn nhất để bắt đầu. Sau bài này bạn chọn được controller đầu tiên, cài phần mềm và nối đủ tai nghe, loa.

## Controller, mixer và CDJ khác nhau thế nào?

| Thiết bị | Là gì | Cần laptop? | Gặp ở đâu |
| --- | --- | --- | --- |
| Controller | Bàn điều khiển USB, âm thanh do phần mềm trên laptop xử lý | Có | Phòng tập ở nhà, bar nhỏ, tiệc |
| Máy all-in-one (standalone) | Controller có màn hình và bộ xử lý riêng, đọc nhạc từ USB | Không | Bar, sự kiện, DJ di động |
| CDJ + mixer rời | Hai đầu phát nhạc từ USB và một mixer riêng | Không (chuẩn bị nhạc trên laptop trước) | Club, lễ hội |
| Mâm đĩa than + mixer | Đĩa vinyl, hoặc đĩa timecode điều khiển phần mềm | Tuỳ | Club, DJ vinyl, scratch |

Bố cục của cả bốn gần như giống nhau: mỗi bên một deck có nút play, cue, pitch fader và jog wheel; ở giữa là các kênh với gain, EQ ba dải và channel fader. Vì vậy học trên controller rồi chuyển sang CDJ chỉ mất vài buổi làm quen.

${fig('vi')}

## Bạn cần chuẩn bị

- Laptop đang dùng, còn trống vài chục GB cho nhạc.
- Một controller hai kênh, hoặc danh sách hai ba mẫu bạn đang cân nhắc.
- Tai nghe chụp kín tai có dây, loa vi tính hoặc loa kiểm âm.
- Cáp USB đi kèm controller và cáp RCA (hai đầu đỏ trắng) cho loa.
- Ba bài nhạc cùng dòng để thử âm thanh.

## Các bước thực hiện

### Bước 1: Chọn controller theo ngân sách

- **Làm gì:** chọn loại hai kênh với jog wheel cỡ vừa tay, pitch fader dài, EQ ba dải kèm filter cho mỗi kênh, tám pad mỗi deck, cổng tai nghe phía trước và cổng master cho loa. Kiểm tra controller dùng phần mềm nào và có mở khoá bản đầy đủ không.
- **Nhìn đâu trên controller:** khoảng cách giữa hai jog wheel và mixer; đủ rộng để hai tay không vướng nhau.
- **Nghe gì để biết đúng:** khi thử ở cửa hàng, chạm nhẹ vào mép jog wheel: bài nhạc phải chậm lại hoặc nhanh lên một chút, mượt, không giật.

### Bước 2: Cài phần mềm và driver

- **Làm gì:** tải phần mềm từ trang của hãng (rekordbox, Serato DJ, Traktor hoặc djay Pro), cài driver âm thanh nếu dùng Windows, cập nhật firmware controller theo hướng dẫn của hãng.
- **Nhìn đâu:** trong phần cài đặt âm thanh (Audio hoặc Preferences) của phần mềm, chọn controller làm thiết bị phát, không phải loa của laptop.
- **Nghe gì để biết đúng:** bấm play một bài trên deck trái, tiếng phải ra ở loa nối vào controller chứ không ra ở loa laptop.

### Bước 3: Đọc bản đồ bàn điều khiển

- **Làm gì:** chia controller thành ba vùng. Hai bên là deck: jog wheel, play, cue, pitch fader, sync, pad, loop. Ở giữa là mixer: gain (hay trim), EQ high, mid, low, filter, channel fader, crossfader, nút cue tai nghe. Trên cùng là núm duyệt bài, núm master và núm tai nghe.
- **Nhìn đâu:** đặt tay trái lên jog trái, tay phải lên channel fader phải; đó là tư thế bạn sẽ dùng nhiều nhất.
- **Nghe gì để biết đúng:** kéo channel fader trái từ dưới lên, bài trái to dần; vặn low về hết bên trái, bass biến mất.

### Bước 4: Nối laptop, loa và tai nghe

- **Làm gì:** vặn mọi núm âm lượng về nhỏ nhất. Cắm USB thẳng vào laptop, không qua hub. Nối cổng master của controller tới loa, cắm tai nghe vào cổng phía trước. Bật laptop và controller trước, loa sau cùng; khi tắt thì tắt loa trước.
- **Nhìn đâu:** đèn của controller sáng và phần mềm báo đã nhận thiết bị.
- **Nghe gì để biết đúng:** loa không ù, không lẹt xẹt; bấm nút cue tai nghe của deck phải thì trong tai nghe chỉ nghe deck phải.

### Bước 5: Chỉnh mức âm cho sạch

- **Làm gì:** để channel fader và EQ ở giữa, tăng gain từng chút tới khi đèn mức của kênh nhảy quanh vạch xanh trên cùng, thỉnh thoảng chạm vàng. Master cũng vậy.
- **Nhìn đâu:** cột đèn mức của từng kênh và của master.
- **Nghe gì để biết đúng:** bass chắc, không rè; khi đổi sang bài khác, độ to gần như không đổi.

## Dấu hiệu bạn làm đúng

- Phần mềm nhận controller ngay khi cắm, không cần khởi động lại.
- Loa ra tiếng sạch, tai nghe nghe riêng được từng deck.
- Đèn mức không bao giờ chạm đỏ.

## Lỗi thường gặp và cách sửa

| Lỗi | Nghe hoặc nhìn ra sao | Cách sửa |
| --- | --- | --- |
| Loa không ra tiếng | Phần mềm chạy, đèn mức nhảy, loa im | Chọn controller làm thiết bị phát trong phần cài đặt âm thanh |
| Tiếng lẹt xẹt, rè | Như đĩa xước, nhất là khi duyệt bài | Tăng buffer size trong phần cài đặt âm thanh |
| Jog wheel trễ | Xoay rồi một lúc mới thấy đổi | Cắm USB thẳng vào laptop, tắt ứng dụng nặng |
| Tai nghe chỉ nghe nhạc đang phát | Không nghe được bài kế tiếp | Bấm nút cue của deck đó, vặn núm cue mix về phía cue |
| Đèn mức đỏ | Bass rè, tiếng bẹt | Giảm gain, không giảm bằng channel fader |

## Do & Don't

- ✅ Mua controller theo phần mềm bạn muốn học, không chỉ theo giá.
- ✅ Cập nhật firmware và driver ngay ngày đầu.
- ✅ Vặn âm lượng về nhỏ nhất trước khi bật loa.
- ❌ Cắm controller qua hub USB rẻ tiền.
- ❌ Mua controller bốn kênh "cho chắc" khi còn chưa dùng hết hai kênh.
- ❌ Để gain cao rồi kéo channel fader thấp để bù.

## Động tác thừa cần tránh

- **Bấm thử mọi nút ngay ngày đầu:** rối mắt và dễ bật nhầm chế độ. Chỉ dùng play, cue, pitch fader, channel fader và EQ trong tuần đầu.
- **Đổi phần mềm liên tục:** mỗi phần mềm một bố cục; ở yên một phần mềm ít nhất ba tháng.
- **Chỉnh âm lượng bằng núm trên laptop:** mất kiểm soát mức âm. Chỉnh bằng gain và master trên controller.

## Tư tưởng cũ cần bỏ: "đồ đắt mới là DJ giỏi"

Kỹ năng nằm ở tay và tai, không ở giá máy. Một controller nhập môn với tai nghe tốt và 30 phút tập mỗi ngày sẽ đưa bạn đi xa hơn một bộ máy đắt tiền ít khi bật. Hãy để dành tiền cho tai nghe tốt và cho nhạc bạn mua.

## Bài tập 20 phút

1. Cắm đủ dây theo bước 4, mọi núm ở mức nhỏ nhất.
2. Nạp một bài vào deck trái, chỉnh gain theo bước 5.
3. Nạp bài thứ hai vào deck phải, bấm cue tai nghe và chỉ nghe bài phải trong tai nghe.
4. Kéo channel fader phải lên trong 16 phách trong khi kéo fader trái xuống.
5. Lặp lại theo chiều ngược lại ba lần.

## Bài tiếp theo

Đã nối dây xong, việc đầu tiên là đặt điểm bắt đầu cho từng bài: [Cue point là gì và cách đặt cue đầu tiên](${lesson('cue-point', 'vi')}). Quay về [lộ trình Học DJ từ số 0](${lesson('hoc-dj-tu-so-0', 'vi')}) để xem cả 16 bài, hoặc đọc trước [25 thuật ngữ DJ](${lesson('thuat-ngu-dj', 'vi')}).`;

const en = `**A DJ controller** is a USB device that controls DJ software on a laptop: two jog wheels stand in for two turntables, with a mixer in the middle holding the faders, EQ and cue buttons. It is the cheapest way to start. After this lesson you can choose a first controller, install the software and wire up headphones and speakers.

## How is a controller different from a mixer or CDJs?

| Gear | What it is | Needs a laptop? | Where you meet it |
| --- | --- | --- | --- |
| Controller | A USB control surface; the software on the laptop makes the sound | Yes | Bedroom practice, small bars, parties |
| All-in-one (standalone) | A controller with its own screen and processor, playing from USB | No | Bars, events, mobile DJs |
| CDJs and a separate mixer | Two players reading USB sticks, plus their own mixer | No (music is prepared on a laptop first) | Clubs, festivals |
| Turntables and a mixer | Vinyl, or timecode records that control software | Depends | Clubs, vinyl DJs, scratch |

All four share almost the same layout: a deck on each side with play, cue, a pitch fader and a jog wheel; channels in the middle with gain, a three-band EQ and a channel fader. That is why moving from a controller to CDJs takes only a few sessions of getting used to.

${fig('en')}

## What you need

- The laptop you already have, with some free space for music.
- A two-channel controller, or a shortlist of two or three you are weighing up.
- Closed-back wired headphones, and computer speakers or studio monitors.
- The USB cable that came with the controller and an RCA cable (red and white plugs) for the speakers.
- Three tracks of one style to test the sound.

## Step by step

### Step 1: Choose a controller for your budget

- **Do:** pick a two-channel unit with comfortably sized jog wheels, long pitch faders, a three-band EQ and a filter on each channel, eight pads per deck, a headphone socket at the front and a master output for speakers. Check which software it is made for and whether it unlocks the full version.
- **Look at:** the space between the jog wheels and the mixer; it should be wide enough that your hands never get in each other's way.
- **Listen for:** in the shop, touch the edge of a jog wheel lightly: the track should slow down or speed up a little, smoothly, without jerking.

### Step 2: Install the software and the driver

- **Do:** download the software from the maker's site (rekordbox, Serato DJ, Traktor or djay Pro), install the audio driver if you are on Windows, and update the controller's firmware as the maker describes.
- **Look at:** the software's audio settings (Audio or Preferences); choose the controller as the output device, not the laptop's speakers.
- **Listen for:** press play on the left deck; the sound must come out of the speakers plugged into the controller, not the laptop.

### Step 3: Learn the map of the controller

- **Do:** split the controller into three zones. On each side, a deck: jog wheel, play, cue, pitch fader, sync, pads, loop. In the middle, the mixer: gain (or trim), high, mid and low EQ, filter, channel faders, crossfader, the headphone cue buttons. Along the top, the browse knob, the master knob and the headphone knob.
- **Look at:** put your left hand on the left jog and your right hand on the right channel fader; that is the position you will use most.
- **Listen for:** push the left channel fader up from the bottom and the left track grows louder; turn the low EQ fully left and the bass disappears.

### Step 4: Connect the laptop, speakers and headphones

- **Do:** turn every volume knob all the way down. Plug the USB cable straight into the laptop, not through a hub. Run the controller's master output to the speakers and plug the headphones into the front socket. Switch on the laptop and controller first and the speakers last; when you finish, switch the speakers off first.
- **Look at:** the controller's lights come on and the software shows the device as connected.
- **Listen for:** no hum and no crackle from the speakers; press the right deck's headphone cue button and you hear only the right deck in your headphones.

### Step 5: Set clean levels

- **Do:** with the channel fader up and the EQ at the centre, raise the gain bit by bit until the channel meter dances around the top green lights and only touches yellow now and then. Do the same with the master.
- **Look at:** each channel's level meter and the master meter.
- **Listen for:** a firm bass with no distortion; when you switch to another track, the loudness hardly changes.

## Signs you got it right

- The software recognises the controller as soon as you plug it in, without a restart.
- The speakers sound clean and the headphones can hear each deck on its own.
- The meters never reach red.

## Common mistakes and fixes

| Mistake | What you hear or see | Fix |
| --- | --- | --- |
| No sound from the speakers | The software runs, the meters move, the speakers stay silent | Choose the controller as the output device in the audio settings |
| Crackling or distortion | Like a scratched record, especially while browsing | Raise the buffer size in the audio settings |
| A laggy jog wheel | You turn it and the change comes a moment later | Plug the USB straight into the laptop and close heavy apps |
| Headphones only play the master | You cannot hear the next track | Press that deck's cue button and turn the cue mix knob towards cue |
| Red meters | Distorted, flattened bass | Lower the gain, not the channel fader |

## Dos and don'ts

- ✅ Buy a controller for the software you want to learn, not just for its price.
- ✅ Update the firmware and driver on day one.
- ✅ Turn the volume down before you switch on the speakers.
- ❌ Plug the controller in through a cheap USB hub.
- ❌ Buy a four-channel controller "just in case" before you have used two.
- ❌ Run the gain high and pull the channel fader low to make up for it.

## Wasted moves to drop

- **Pressing every button on day one:** it overloads your eyes and you switch on modes by accident. Use only play, cue, the pitch faders, the channel faders and the EQ in your first week.
- **Switching software again and again:** each one has its own layout; stay with one for at least three months.
- **Setting the volume from the laptop:** you lose control of your levels. Use the gain and master on the controller.

## Old idea to drop: "expensive gear makes a good DJ"

Skill lives in your hands and ears, not in the price tag. An entry-level controller with good headphones and thirty minutes of practice a day takes you further than an expensive setup that rarely gets switched on. Save the money for good headphones and for the music you buy.

## A 20-minute drill

1. Wire everything as in step 4, with every knob at its lowest.
2. Load a track on the left deck and set its gain as in step 5.
3. Load a second track on the right deck, press its headphone cue and hear only that track in your headphones.
4. Bring the right channel fader up over 16 beats while you take the left one down.
5. Do it the other way round, three times.

## Next lesson

With everything connected, the first job is to mark where each track starts: [What a cue point is and how to set your first one](${lesson('cue-point', 'en')}). Go back to [Learn to DJ from zero](${lesson('hoc-dj-tu-so-0', 'en')}) for all sixteen lessons, or skim [25 DJ terms](${lesson('thuat-ngu-dj', 'en')}) first.`;

export const controllerDj: PackPost = {
  key: 'dj-skills/controller-dj',
  slug: 'controller-dj',
  category: 'dj',
  lang: 'vi',
  title: {
    vi: 'Controller DJ là gì? Chọn, cài phần mềm và nối dây',
    en: 'What is a DJ controller? Choose, install and wire it up',
  },
  excerpt: {
    vi: 'Controller DJ là gì, khác CDJ và mixer thế nào; cách chọn controller đầu tiên, cài rekordbox, Serato hay Traktor, đọc bàn điều khiển và nối loa, tai nghe.',
    en: 'What a DJ controller is and how it differs from CDJs and a mixer; how to choose your first one, install rekordbox, Serato or Traktor, and connect speakers.',
  },
  cover: coverOf(DJ_MEDIA.controller),
  styles: [],
  facts: lessonFacts({
    module: MODULES.gear, minutes: '30',
    gear: { vi: 'Laptop, controller hai kênh, tai nghe, loa', en: 'Laptop, two-channel controller, headphones, speakers' },
    first: { vi: 'Không cần: đây là bài đầu tiên', en: 'Nothing: this is the first lesson' },
    after: { vi: 'Chọn, cài và nối dây cho bộ DJ đầu tiên', en: 'Choose, install and wire up your first DJ setup' },
  }),
  body: { vi, en },
  faq: [
    { q: { vi: 'Controller DJ khác CDJ thế nào?', en: 'How is a DJ controller different from a CDJ?' }, a: { vi: 'Controller chỉ là bàn điều khiển: âm thanh do phần mềm trên laptop xử lý. CDJ là đầu phát độc lập, đọc nhạc từ USB và đi cùng một mixer rời. Bố cục nút gần như giống nhau, nên kỹ năng học trên controller dùng được trên CDJ.', en: 'A controller is only a control surface: the software on the laptop makes the sound. A CDJ is a standalone player that reads music from USB and works with a separate mixer. The layouts are almost the same, so skills learned on a controller carry over to CDJs.' } },
    { q: { vi: 'Controller hai kênh có đủ không?', en: 'Is a two-channel controller enough?' }, a: { vi: 'Đủ cho gần như mọi thứ người mới cần và cho phần lớn set ở club: phần lớn DJ house và techno chỉ dùng hai deck tại một thời điểm. Bốn kênh chỉ hữu ích khi bạn đã thành thạo và muốn chồng nhiều lớp nhạc cùng lúc.', en: 'Yes, for almost everything a beginner needs and for most club sets: most house and techno DJs use only two decks at a time. Four channels only help once you are fluent and want to layer several tracks at once.' } },
    { q: { vi: 'Nên học rekordbox, Serato hay Traktor?', en: 'Should I learn rekordbox, Serato or Traktor?' }, a: { vi: 'Chọn phần mềm mà controller của bạn được làm cho. Nếu định chơi CDJ ở club, rekordbox giúp chuẩn bị USB cho đầu CDJ. Serato phổ biến với DJ hip-hop và open format, Traktor mạnh về effect. Kỹ năng nền tảng giống nhau ở cả ba.', en: 'Pick the software your controller is made for. If you plan to play club CDJs, rekordbox prepares USB sticks for them. Serato is popular with hip-hop and open-format DJs, and Traktor is strong on effects. The core skills are the same in all three.' } },
    { q: { vi: 'Có cần loa xịn để tập DJ không?', en: 'Do I need good speakers to practise?' }, a: { vi: 'Không. Loa vi tính nghe được bass là đủ để tập beatmatch và chuyển bài. Đầu tư vào tai nghe chụp kín tai trước, vì bạn dùng tai nghe để nghe bài kế tiếp trong mọi buổi tập và mọi buổi diễn.', en: 'No. Computer speakers that can reproduce some bass are enough to practise beatmatching and transitions. Invest in closed-back headphones first, because you use them to hear the next track in every practice session and every gig.' } },
    { q: { vi: 'Vì sao loa bị rè khi chơi bằng controller?', en: 'Why do my speakers distort when I use the controller?' }, a: { vi: 'Thường do gain quá cao làm đèn mức chạm đỏ, hoặc master của controller và âm lượng loa cùng để quá lớn. Giảm gain tới khi đèn mức ở vạch xanh trên cùng, để master vừa phải và tăng âm lượng ở loa thay vì ở controller.', en: 'Usually the gain is so high that the meters hit red, or the controller master and the speaker volume are both turned up too far. Lower the gain until the meters sit in the top green, keep the master moderate and turn the speakers up instead.' } },
  ],
  sources: [
    { title: 'DJ controller', url: wiki('DJ controller'), publisher: 'Wikipedia' },
    { title: 'DJ mixer', url: wiki('DJ mixer'), publisher: 'Wikipedia' },
    { title: 'AlphaTheta (Pioneer DJ)', url: 'https://www.alphatheta.com/en/', publisher: 'AlphaTheta' },
    { title: 'Serato DJ', url: 'https://serato.com/dj', publisher: 'Serato' },
    { title: 'Traktor', url: 'https://www.native-instruments.com/en/products/traktor/', publisher: 'Native Instruments' },
  ],
  tracks: [],
};
