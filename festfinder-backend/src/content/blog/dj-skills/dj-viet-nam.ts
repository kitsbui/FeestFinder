import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, DJ_MEDIA } from './media.ts';
import { figure, lesson, lessonFacts, MODULES, wiki } from './shared.ts';

const fig = (lang: 'vi' | 'en') => figure(DJ_MEDIA.terms,
  { vi: 'Hai đầu CDJ-2000 Nexus và mixer DJM-900 trong booth', en: 'Two CDJ-2000 Nexus players and a DJM-900 mixer in a booth' },
  { vi: 'Nhiều club dùng bộ CDJ và mixer rời: mang USB đã chuẩn bị bằng rekordbox', en: 'Many clubs run CDJs and a separate mixer: bring a USB stick prepared in rekordbox' }, lang);

const vi = `**Nghề DJ ở Việt Nam** trải trên năm mảng chính: club, bar và lounge, đám cưới, streaming và mạng xã hội, sự kiện doanh nghiệp. Mỗi mảng có khán giả, dòng nhạc và cách làm việc riêng; điểm chung là một đêm thường đi qua nhiều thể loại. Sau bài này bạn biết mình hợp mảng nào, cần chuẩn bị gì và nhận gig đầu tiên ra sao.

## Năm mảng của thị trường

| Mảng | Khán giả | Dòng nhạc | Lưu ý |
| --- | --- | --- | --- |
| Club | Người trẻ, khách quốc tế | House, techno, hip-hop, V-Pop remix | Đọc phòng là chính, giờ cao điểm thường sau 23 giờ |
| Bar và lounge | Người đi làm, gặp gỡ, trò chuyện | Deep house, chill, R&B, lo-fi | Âm lượng vừa phải, không cần drop lớn |
| Đám cưới | Nhiều thế hệ | Pop, ballad, V-Pop, nhạc dance | Linh hoạt, theo ý gia chủ, không "cày" một thể loại |
| Streaming và TikTok | Gen Z | Đoạn ngắn, nhạc trend, remix | Hiểu trend, quay nội dung ngắn đều đặn |
| Sự kiện doanh nghiệp | Doanh nghiệp, khách mời | Chill, pop, nhạc nền | Chuyên nghiệp, đúng giờ, ít "chơi" |

Thị trường Việt có một đặc thù: **đa thể loại trong một đêm**. Một DJ ở club có thể phải đi từ V-Pop remix sang house rồi sang hip-hop mà không làm mất mạch. Đây là lợi thế nếu bạn biết khai thác: người chơi được nhiều thể loại có nhiều cơ hội hơn.

## Nên và không nên theo từng mảng

### Club

- ✅ Mang USB chuẩn bị bằng rekordbox, có bản dự phòng; hỏi trước đời đầu CDJ và mixer.
- ✅ Đến sớm, nghe người chơi trước, bắt đầu từ năng lượng họ để lại.
- ❌ Chơi những bài lớn nhất khi đang là DJ mở màn.
- ❌ Đổi thể loại đột ngột giữa câu nhạc.

### Bar và lounge

- ✅ Giữ âm lượng để khách nói chuyện được, tăng dần khi quán đông.
- ✅ Chuẩn bị nhiều bài deep house, nu-disco, R&B có groove đều.
- ❌ Thả drop lớn, effect ồn ào lúc quán còn vắng.
- ❌ Chơi một mạch techno nặng khi khách đang ăn uống.

### Đám cưới

- ✅ Hỏi gia chủ danh sách bài bắt buộc và bài không được chơi, khung giờ của từng nghi thức.
- ✅ Mang micro, dây dự phòng; thử âm thanh trước khi khách đến.
- ❌ "Cày" một thể loại suốt buổi vì đó là gu của bạn.
- ❌ Bật nhạc quá to lúc người lớn tuổi đang phát biểu.

### Streaming và TikTok

- ✅ Quay đoạn ngắn 15–60 giây có hình bạn chơi, đăng đều đặn.
- ✅ Hiểu quy định nhạc của nền tảng trước khi đăng (xem [ghi âm và đăng mix](${lesson('ghi-am-dang-mix', 'vi')})).
- ❌ Đăng set dài toàn bài có bản quyền rồi bất ngờ khi bị chặn.
- ❌ Chạy theo mọi trend đến mức mất phong cách riêng.

### Sự kiện doanh nghiệp

- ✅ Đúng giờ, ăn mặc theo yêu cầu, có kịch bản chương trình trong tay.
- ✅ Phối hợp với MC và kỹ thuật âm thanh, ánh sáng.
- ❌ Chơi nhạc có lời nhạy cảm.
- ❌ Biến phần nhạc nền thành một set club.

${fig('vi')}

## Bạn cần chuẩn bị

- Một set 30–60 phút đã ghi âm, làm "danh thiếp" (xem [xây set DJ](${lesson('xay-set-dj', 'vi')})).
- Thư viện chia crate theo mảng: club, bar, đám cưới, sự kiện.
- Ảnh chân dung rõ mặt, một đoạn giới thiệu ngắn, các đường link mix.

## Các bước thực hiện

### Bước 1: Chọn mảng bắt đầu

- **Làm gì:** chọn một hai mảng hợp với gu và lịch của bạn. Người mới thường bắt đầu ở bar nhỏ hoặc sự kiện của bạn bè, nơi áp lực thấp.
- **Nhìn đâu:** thư viện của bạn: bạn đang có nhiều bài cho mảng nào nhất?
- **Nghe gì để biết đúng:** nghe một set mẫu của mảng đó; bạn thấy thích và muốn chơi được như vậy.

### Bước 2: Xây crate cho mảng đó

- **Làm gì:** chọn 40–60 bài cho mảng đã chọn, gắn tag năng lượng và vai trò. Với club Việt, thêm một crate V-Pop remix và hip-hop để chuyển thể loại khi cần.
- **Nhìn đâu trên controller:** cây playlist và crate trong phần mềm.
- **Nghe gì để biết đúng:** thử chuyển từ V-Pop remix sang house bằng cú cắt ở đầu câu hoặc echo out; người nghe không bị khựng.

### Bước 3: Làm hồ sơ giới thiệu

- **Làm gì:** gom ảnh, đoạn giới thiệu ba bốn câu, link hai mix tốt nhất và thông tin liên hệ vào một trang. Bạn có thể [tạo hồ sơ nghệ sĩ trên FeestFinder](/studio/artist) để ban tổ chức tìm thấy bạn.
- **Nhìn đâu:** trang hồ sơ như người lạ nhìn vào lần đầu.
- **Nghe gì để biết đúng:** mix trong hồ sơ là bản bạn tự hào nhất, đã review kỹ.

### Bước 4: Nhận gig đầu tiên

- **Làm gì:** nhắn quán bar nhỏ, câu lạc bộ, nhóm bạn tổ chức sự kiện; gửi hồ sơ, đề nghị chơi một khung giờ sớm. Đi xem các đêm nhạc để gặp người trong nghề: [lịch các đêm sắp tới](/).
- **Nhìn đâu:** lịch sự kiện của những nơi bạn muốn chơi.
- **Nghe gì để biết đúng:** nghe kỹ yêu cầu của nơi đó về thể loại, âm lượng và giờ chơi.

### Bước 5: Thoả thuận bằng văn bản

- **Làm gì:** ghi rõ giờ chơi, thiết bị nơi đó có và bạn phải mang, thù lao, ăn uống, đi lại, thời điểm thanh toán. Một tin nhắn xác nhận cũng là văn bản.
- **Nhìn đâu:** tin nhắn hoặc hợp đồng trước ngày diễn.
- **Nghe gì để biết đúng:** không còn câu hỏi nào bạn phải đoán vào ngày diễn.

## Dấu hiệu bạn làm đúng

- Bạn có crate riêng cho từng mảng và một mix làm danh thiếp.
- Bạn chuyển được giữa hai thể loại mà không làm sàn khựng lại.
- Mọi gig của bạn đều có thoả thuận bằng văn bản.

## Lỗi thường gặp và cách sửa

| Lỗi | Nghe hoặc nhìn ra sao | Cách sửa |
| --- | --- | --- |
| Mang một kiểu set đi mọi nơi | Club thấy nhạt, đám cưới thấy ồn | Crate riêng cho từng mảng |
| Không hỏi thiết bị trước | Đến nơi mới biết đầu CDJ không đọc file | Hỏi đời máy, mang USB và bản dự phòng |
| Đổi thể loại giữa câu | Sàn khựng, người nhảy dừng lại | Đổi ở đầu câu, bằng cut hoặc echo out |
| Thoả thuận miệng | Tranh cãi về giờ chơi, thù lao | Xác nhận bằng tin nhắn hoặc hợp đồng |
| Coi thường V-Pop remix | Mất khách ở nhiều club Việt | Chọn những bản remix chất lượng, nối khéo |

## Do & Don't

- ✅ Học cả nhạc trong nước lẫn quốc tế, nối chúng khéo léo.
- ✅ Đến sớm, chào kỹ thuật âm thanh, hỏi về hệ thống.
- ✅ Giữ quan hệ tốt với người chơi trước và sau bạn.
- ❌ Nhận gig vượt quá khả năng chỉ vì sợ mất cơ hội.
- ❌ Chơi không đúng yêu cầu của gia chủ hoặc chủ quán.
- ❌ Chép set của DJ khác rồi đăng như của mình.

## Động tác thừa cần tránh

- **Mang theo cả thư viện vài nghìn bài:** khó tìm bài khi đang diễn. Mang crate đã chọn cho đúng mảng.
- **Gửi hồ sơ hàng loạt không đọc nơi nhận:** mỗi nơi một gu. Gửi ít mà đúng nơi.
- **Đăng mọi đoạn tập lên mạng xã hội:** chọn đoạn tốt nhất, đăng đều đặn.

## Tư tưởng cũ cần bỏ: "chỉ chơi nhạc Âu Mỹ mới là pro"

Thị trường Việt Nam cần sự đa dạng, và V-Pop remix có chỗ đứng thật ở nhiều club, đám cưới, sự kiện. Người giỏi là người hiểu cả nhạc trong nước lẫn quốc tế và nối chúng khéo léo, không phải người chỉ chơi một loại.

## Bài tập 20 phút

1. Chọn mảng bạn muốn bắt đầu.
2. Lập crate 20 bài đầu tiên cho mảng đó.
3. Tập một lần chuyển từ V-Pop remix sang house bằng echo out.
4. Viết đoạn giới thiệu ba câu về bạn.
5. Liệt kê ba nơi bạn có thể xin chơi khung giờ sớm.

## Bài tiếp theo

Đi làm nghề cần cái đầu vững: [tư duy DJ và những tư tưởng cũ cần bỏ](${lesson('tu-duy-dj', 'vi')}). Để có nhạc cho từng mảng, đọc [mua nhạc DJ](${lesson('mua-nhac-dj', 'vi')}). Cả lộ trình ở [Học DJ từ số 0](${lesson('hoc-dj-tu-so-0', 'vi')}).`;

const en = `**DJing in Vietnam** spans five main segments: clubs, bars and lounges, weddings, streaming and social media, and corporate events. Each has its own audience, music and way of working; what they share is that one night often moves through several genres. After this lesson you know which segment suits you, what to prepare and how to land a first gig.

## The five segments of the market

| Segment | Audience | Music | Notes |
| --- | --- | --- | --- |
| Clubs | Young people, international visitors | House, techno, hip-hop, V-Pop remixes | Reading the room is everything; peak time is usually after 11 pm |
| Bars and lounges | Office workers meeting and talking | Deep house, chill, R&B, lo-fi | Moderate volume, no need for big drops |
| Weddings | Several generations | Pop, ballads, V-Pop, dance music | Be flexible, follow the hosts, never "grind" one genre |
| Streaming and TikTok | Gen Z | Short clips, trending music, remixes | Understand trends and post short content regularly |
| Corporate events | Companies and their guests | Chill, pop, background music | Professional, punctual, little "showing off" |

The Vietnamese market has one particular trait: **many genres in one night**. A club DJ may have to move from a V-Pop remix to house and then to hip-hop without losing the thread. That is an advantage if you use it: DJs who can play several genres get more chances.

## Dos and don'ts by segment

### Clubs

- ✅ Bring a USB stick prepared in rekordbox, with a spare; ask beforehand which CDJs and mixer they have.
- ✅ Arrive early, listen to the DJ before you and start from the energy they leave.
- ❌ Play the biggest tracks when you are the warm-up DJ.
- ❌ Switch genre abruptly in the middle of a phrase.

### Bars and lounges

- ✅ Keep the volume low enough for guests to talk, and raise it as the bar fills.
- ✅ Prepare plenty of deep house, nu-disco and R&B with a steady groove.
- ❌ Drop big tracks and noisy effects while the bar is still empty.
- ❌ Play a long run of heavy techno while guests are eating.

### Weddings

- ✅ Ask the hosts for must-play and do-not-play lists, and the timing of each ceremony.
- ✅ Bring a microphone and spare cables; test the sound before the guests arrive.
- ❌ Grind one genre all night because it is your taste.
- ❌ Play loud while elders are giving speeches.

### Streaming and TikTok

- ✅ Film short 15–60 second clips that show you playing, and post regularly.
- ✅ Learn each platform's music rules before posting (see [recording and posting a mix](${lesson('ghi-am-dang-mix', 'en')})).
- ❌ Post long sets full of copyrighted tracks and be surprised when they are blocked.
- ❌ Chase every trend until your own style disappears.

### Corporate events

- ✅ Be on time, dress as asked and keep the running order in hand.
- ✅ Work with the host and the sound and lighting crew.
- ❌ Play tracks with sensitive lyrics.
- ❌ Turn the background music into a club set.

${fig('en')}

## What you need

- A recorded 30–60 minute set to serve as your calling card (see [building a DJ set](${lesson('xay-set-dj', 'en')})).
- A library split into crates by segment: club, bar, wedding, events.
- A clear portrait photo, a short bio and links to your mixes.

## Step by step

### Step 1: Choose a segment to start in

- **Do:** pick one or two segments that suit your taste and your schedule. Beginners usually start at a small bar or a friend's event, where the pressure is low.
- **Look at:** your library: which segment do you already have the most tracks for?
- **Listen for:** a sample set from that segment; you enjoy it and want to play like that.

### Step 2: Build a crate for that segment

- **Do:** choose 40–60 tracks for the segment and tag their energy and role. For Vietnamese clubs, add a crate of V-Pop remixes and hip-hop for genre changes when you need them.
- **Look at:** the playlist and crate tree in your software.
- **Listen for:** try moving from a V-Pop remix to house with a cut on the phrase or an echo out; the floor should not stall.

### Step 3: Make a profile that introduces you

- **Do:** gather a photo, a three or four sentence bio, links to your two best mixes and your contact details on one page. You can [create an artist profile on FeestFinder](/studio/artist) so organisers can find you.
- **Look at:** your profile as a stranger would see it the first time.
- **Listen for:** the mix on your profile is the one you are proudest of, carefully reviewed.

### Step 4: Land your first gig

- **Do:** message small bars, clubs and friends who organise events; send your profile and offer to play an early slot. Go to nights to meet people in the scene: [the coming nights](/?lang=en).
- **Look at:** the event calendars of the places you want to play.
- **Listen for:** what each place asks for in genre, volume and set times.

### Step 5: Agree the terms in writing

- **Do:** write down the set time, the gear they have and what you must bring, the fee, food, travel and when you will be paid. A confirmation message counts as writing.
- **Look at:** the message or contract before the day.
- **Listen for:** no question left that you would have to guess on the night.

## Signs you got it right

- You have a crate for each segment and one mix that works as your calling card.
- You can move between two genres without the floor stalling.
- Every gig you play has terms agreed in writing.

## Common mistakes and fixes

| Mistake | What you hear or see | Fix |
| --- | --- | --- |
| One kind of set for every place | Clubs find it bland, weddings find it loud | A crate for each segment |
| Not asking about the gear | You arrive to find the CDJs cannot read your files | Ask for the models and bring USB sticks and a spare |
| Switching genre mid-phrase | The floor stalls and dancers stop | Switch on the phrase, with a cut or echo out |
| Spoken agreements only | Arguments over set times and fees | Confirm by message or contract |
| Looking down on V-Pop remixes | Losing the crowd in many Vietnamese clubs | Choose good remixes and blend them well |

## Dos and don'ts

- ✅ Learn both Vietnamese and international music and join them skilfully.
- ✅ Arrive early, greet the sound engineer and ask about the system.
- ✅ Keep good relations with the DJs before and after you.
- ❌ Take gigs beyond your ability just for fear of missing out.
- ❌ Ignore what the hosts or the venue asked for.
- ❌ Copy another DJ's set and post it as your own.

## Wasted moves to drop

- **Carrying your whole library of thousands of tracks:** it is hard to find anything mid-set. Bring the crate chosen for the segment.
- **Mass-mailing your profile without reading who receives it:** every venue has its own taste. Send fewer, to the right places.
- **Posting every practice clip on social media:** pick the best moments and post regularly.

## Old idea to drop: "only Western music is professional"

The Vietnamese market needs variety, and V-Pop remixes have a real place in many clubs, weddings and events. A good DJ understands both local and international music and blends them skilfully, rather than playing only one kind.

## A 20-minute drill

1. Choose the segment you want to start in.
2. Build a first crate of 20 tracks for it.
3. Practise one move from a V-Pop remix to house with an echo out.
4. Write a three-sentence bio about yourself.
5. List three places where you could ask for an early slot.

## Next lesson

Working as a DJ takes a steady head: [the DJ mindset and old ideas to drop](${lesson('tu-duy-dj', 'en')}). To find music for each segment, read [buying music as a DJ](${lesson('mua-nhac-dj', 'en')}). The whole path is at [Learn to DJ from zero](${lesson('hoc-dj-tu-so-0', 'en')}).`;

export const djVietNam: PackPost = {
  key: 'dj-skills/dj-viet-nam',
  slug: 'dj-viet-nam',
  category: 'dj',
  lang: 'vi',
  title: {
    vi: 'Nghề DJ ở Việt Nam: club, bar, đám cưới, streaming, sự kiện',
    en: 'DJing in Vietnam: clubs, bars, weddings, streaming, events',
  },
  excerpt: {
    vi: 'Thị trường DJ ở Việt Nam qua năm mảng: club, bar, đám cưới, streaming, sự kiện. Nên và không nên cho từng mảng, chuyển thể loại trong một đêm, nhận gig đầu tiên.',
    en: 'The DJ market in Vietnam in five segments: clubs, bars, weddings, streaming and events. Dos and don’ts for each, switching genres in one night and a first gig.',
  },
  cover: coverOf(DJ_MEDIA.vietnam),
  styles: [],
  facts: lessonFacts({
    module: MODULES.music, minutes: '30',
    gear: { vi: 'Một mix đã ghi âm, ảnh, đoạn giới thiệu ngắn', en: 'A recorded mix, a photo, a short bio' },
    first: { vi: 'Xây set và ghi âm mix', en: 'Building and recording a set' },
    after: { vi: 'Chọn mảng, chuẩn bị crate và nhận gig đầu tiên', en: 'Pick a segment, prepare crates and land a first gig' },
  }),
  body: { vi, en },
  faq: [
    { q: { vi: 'Làm DJ ở Việt Nam có những mảng nào?', en: 'What kinds of DJ work are there in Vietnam?' }, a: { vi: 'Năm mảng chính là club, bar và lounge, đám cưới, streaming và mạng xã hội, sự kiện doanh nghiệp. Mỗi mảng có khán giả, dòng nhạc và yêu cầu riêng, nên nhiều DJ bắt đầu ở một hai mảng rồi mở rộng dần theo kinh nghiệm.', en: 'The five main segments are clubs, bars and lounges, weddings, streaming and social media, and corporate events. Each has its own audience, music and demands, so many DJs start in one or two and branch out as they gain experience.' } },
    { q: { vi: 'Club ở Việt Nam thường chơi nhạc gì?', en: 'What do clubs in Vietnam usually play?' }, a: { vi: 'Thường là house, tech house, techno, hip-hop và V-Pop remix, và một đêm có thể đi qua nhiều thể loại. Mỗi club có gu riêng: có nơi chuyên techno hay house, có nơi đa thể loại. Hãy đến nghe trước khi xin chơi.', en: 'Usually house, tech house, techno, hip-hop and V-Pop remixes, and one night can pass through several genres. Each club has its own taste: some focus on techno or house, others mix genres. Go and listen before you ask to play.' } },
    { q: { vi: 'Người mới nên nhận gig đầu tiên ở đâu?', en: 'Where should a beginner play a first gig?' }, a: { vi: 'Ở nơi áp lực thấp: quán bar nhỏ, sự kiện của bạn bè, một khung giờ sớm ở club. Gửi hồ sơ có ảnh, đoạn giới thiệu và một mix đã review kỹ. Thoả thuận rõ giờ chơi, thiết bị và thù lao bằng văn bản, kể cả chỉ là tin nhắn.', en: 'Somewhere low-pressure: a small bar, a friend’s event, an early slot at a club. Send a profile with a photo, a short bio and a carefully reviewed mix. Agree the set time, gear and fee in writing, even if it is only a message.' } },
    { q: { vi: 'DJ đám cưới cần chuẩn bị gì?', en: 'What does a wedding DJ need to prepare?' }, a: { vi: 'Danh sách bài gia chủ muốn và không muốn, khung giờ của từng nghi thức, micro và dây dự phòng, và một thư viện nhiều thế hệ: pop, ballad, V-Pop, nhạc dance. Thử âm thanh trước khi khách đến và luôn theo nhịp của buổi lễ.', en: 'The hosts’ must-play and do-not-play lists, the timing of each ceremony, a microphone and spare cables, and a library for several generations: pop, ballads, V-Pop, dance music. Test the sound before the guests arrive and follow the rhythm of the occasion.' } },
    { q: { vi: 'Có nên chơi V-Pop remix không?', en: 'Should I play V-Pop remixes?' }, a: { vi: 'Nên biết chơi. V-Pop remix có chỗ đứng thật ở nhiều club, đám cưới và sự kiện tại Việt Nam. Chọn những bản remix chất lượng, có quyền phát hành, và nối chúng khéo léo với nhạc quốc tế bằng cú cắt đúng câu hoặc echo out.', en: 'You should know how. V-Pop remixes have a real place in many clubs, weddings and events in Vietnam. Choose good-quality, properly released remixes and blend them with international music using a cut on the phrase or an echo out.' } },
  ],
  sources: [
    { title: 'DJ (tiếng Việt)', url: 'https://vi.wikipedia.org/wiki/DJ', publisher: 'Wikipedia tiếng Việt' },
    { title: 'Disc jockey', url: wiki('Disc jockey'), publisher: 'Wikipedia' },
    { title: 'VCPMC', url: 'https://www.vcpmc.org/', publisher: 'Trung tâm Bảo vệ Quyền tác giả Âm nhạc Việt Nam' },
    { title: 'rekordbox', url: 'https://rekordbox.com/en/', publisher: 'AlphaTheta' },
    { title: 'AlphaTheta (Pioneer DJ)', url: 'https://www.alphatheta.com/en/', publisher: 'AlphaTheta' },
  ],
  tracks: [],
};
