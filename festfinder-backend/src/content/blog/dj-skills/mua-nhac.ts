import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, DJ_MEDIA } from './media.ts';
import { figure, lesson, lessonFacts, MODULES, wiki } from './shared.ts';

const fig = (lang: 'vi' | 'en') => figure(DJ_MEDIA.files,
  { vi: 'Đĩa timecode Traktor Scratch trên mâm đĩa than', en: 'A Traktor Scratch timecode record on a turntable' },
  { vi: 'Đĩa than hay file số, nguồn nào cũng cần bản chính thức, chất lượng cao', en: 'Vinyl or digital, every source needs an official, high-quality copy' }, lang);

const vi = `**Mua nhạc DJ** là mua file tải về, hoặc thuê bao streaming tích hợp trong phần mềm DJ, từ các nguồn chính thức như Beatport, Bandcamp hay Traxsource, để có bản chất lượng cao và trả tiền cho nghệ sĩ. Sau bài này bạn biết mua ở đâu cho dòng nhạc của mình, phân biệt remix, bootleg, edit và tránh rắc rối bản quyền.

## Các nguồn nhạc cho DJ

| Nguồn | Loại | Hợp với | Cần biết |
| --- | --- | --- | --- |
| Beatport | Cửa hàng chuyên DJ | House, techno, tech house, trance, drum and bass | Bảng xếp hạng theo từng dòng nhạc; tải WAV, AIFF hoặc MP3 |
| Traxsource | Cửa hàng | House, garage, disco, soulful | Mạnh về house có vocal và nhạc gốc soul, funk |
| Bandcamp | Cửa hàng của nghệ sĩ và label | Indie, experimental, label nhỏ | Nghệ sĩ tự đặt giá và nhận phần lớn tiền; chọn FLAC, WAV, MP3 |
| SoundCloud | Streaming và tải miễn phí | Khám phá, bản edit, nghệ sĩ mới | Nhiều bài cho tải miễn phí khi nghệ sĩ cho phép |
| Streaming trong phần mềm DJ | Thuê bao hàng tháng | Thử nhiều bài, chơi ở nhà | Cần mạng ổn định; đừng phụ thuộc khi chơi ở club |
| Nhà sản xuất và cửa hàng Việt | Địa phương | V-Pop remix, nhạc dance Việt | Mua hoặc xin trực tiếp từ nhà sản xuất, hỏi quyền trước khi đăng |

Giá một bài trên các cửa hàng DJ thường khoảng 1–3 USD tuỳ cửa hàng và định dạng; trên Bandcamp, nghệ sĩ tự đặt giá. Mua ít mà chọn kỹ rẻ hơn mua nhiều rồi không chơi.

## Remix, bootleg, edit và mashup khác nhau thế nào?

| Loại | Là gì | Có chính thức không? |
| --- | --- | --- |
| Remix | Bản phối lại được chủ bài hát cho phép, phát hành qua label | Có: mua và chơi yên tâm |
| Bootleg | Bản phối lại không xin phép | Không: thường cho tải miễn phí, rủi ro khi bán hoặc đăng |
| Edit | Bản sắp xếp lại cho DJ dễ chơi, ví dụ thêm intro dài | Tuỳ: chính thức nếu label phát hành, không chính thức nếu tự làm |
| Mashup | Ghép hai bài trở lên thành một | Thường không chính thức |

Phát nhạc ở club hay bar thường nằm trong giấy phép mà nơi đó trả cho các tổ chức quản lý quyền tác giả (ở Việt Nam có VCPMC). Bán hoặc đăng bản bootleg, mashup lên mạng là chuyện khác: bạn đang phân phối tác phẩm của người khác. Đây không phải tư vấn pháp lý; khi định phát hành, hãy hỏi chủ bài hát.

${fig('vi')}

## Bạn cần chuẩn bị

- Danh sách dòng nhạc và sub-genre bạn muốn chơi.
- Tài khoản ở một hai cửa hàng, và một ngân sách hàng tháng nhỏ, cố định.
- Phần mềm DJ để nạp và gắn tag bài ngay sau khi mua (xem [file nhạc DJ](${lesson('file-nhac-dj', 'vi')})).

## Các bước thực hiện

### Bước 1: Biết mình chơi gì rồi mới chọn cửa hàng

- **Làm gì:** viết ra hai ba dòng nhạc chính. Techno, house, drum and bass: Beatport. House có vocal, disco: Traxsource. Nhạc lạ, label nhỏ: Bandcamp.
- **Nhìn đâu trên controller:** chưa cần; mở trang cửa hàng.
- **Nghe gì để biết đúng:** nghe bảng xếp hạng của đúng dòng nhạc bạn chơi; phần lớn bài hợp gu bạn.

### Bước 2: Tìm bài như một người đào nhạc

- **Làm gì:** đi theo label và nghệ sĩ bạn thích, nghe các chương trình radio và mix trên Mixcloud, xem tracklist của DJ bạn ngưỡng mộ. Đừng chỉ nghe top 10.
- **Nhìn đâu:** trang label, trang nghệ sĩ, danh sách "bài liên quan".
- **Nghe gì để biết đúng:** nghe đoạn preview ở cả intro, breakdown và drop, không chỉ đoạn đầu.

### Bước 3: Mua đúng bản và đúng định dạng

- **Làm gì:** chọn bản "Extended Mix" có intro và outro dài (xem [phrasing](${lesson('phrasing-dj', 'vi')})). Bài giữ lâu: AIFF, WAV hoặc FLAC. Bài thử: MP3 320 kbps.
- **Nhìn đâu:** tên bản (Original, Extended, Radio Edit) và lựa chọn định dạng khi thanh toán.
- **Nghe gì để biết đúng:** sau khi tải, nghe lại toàn bài: đúng bản, đủ dài, không có tiếng lạ.

### Bước 4: Nạp, phân tích và gắn tag ngay

- **Làm gì:** nạp bài vào phần mềm, kiểm beatgrid, gắn dòng nhạc, năng lượng, đặt hot cue phách 1 trước khi tắt máy.
- **Nhìn đâu:** cột BPM, Key và các ô tag trong thư viện.
- **Nghe gì để biết đúng:** bài mới nằm đúng crate, nghe thử nối với một bài cũ là thấy hợp.

### Bước 5: Ủng hộ nghệ sĩ trong nước

- **Làm gì:** theo dõi và mua nhạc trực tiếp từ nhà sản xuất Việt, hỏi quyền trước khi chơi hoặc đăng bản edit bài của họ, ghi tên họ trong tracklist.
- **Nhìn đâu:** trang Bandcamp, SoundCloud hoặc mạng xã hội của nhà sản xuất.
- **Nghe gì để biết đúng:** bản của họ đứng được cạnh bài quốc tế trong set của bạn.

## Dòng nhạc nào hợp controller giá rẻ và club Việt?

Mọi dòng nhạc đều chơi được trên controller nhập môn: máy rẻ không giới hạn dòng nhạc, chỉ giới hạn số kênh và effect. House và tech house dễ tập nhất nhờ kick đều và intro dài. Ở club Việt Nam, một đêm thường đi qua house, tech house, techno, hip-hop và V-Pop remix; chi tiết ở bài [nghề DJ ở Việt Nam](${lesson('dj-viet-nam', 'vi')}).

## Dấu hiệu bạn làm đúng

- Mỗi bài bạn mua đều đã được nghe trọn và có chỗ trong ít nhất một set.
- Thư viện của bạn không có bài tải từ video hay bản dưới 320 kbps.
- Tracklist của bạn ghi đủ tên nghệ sĩ, kể cả nghệ sĩ Việt.

## Lỗi thường gặp và cách sửa

| Lỗi | Nghe hoặc nhìn ra sao | Cách sửa |
| --- | --- | --- |
| Mua bản Radio Edit | Intro ngắn, khó nối bài | Chọn Extended Mix hoặc Original Mix |
| Chỉ mua top 10 | Set giống hệt mọi DJ khác | Đào theo label, nghệ sĩ, radio show |
| Tải bài từ video | Phần cao rè trên loa lớn | Mua bản chính thức |
| Đăng bootleg lên nền tảng bán nhạc | Bài bị gỡ, tài khoản bị cảnh cáo | Chỉ phát hành khi có quyền |
| Mua nhiều mà không nghe | Thư viện phình, không nhớ bài | Ngân sách nhỏ, cố định, nghe hết mới mua thêm |

## Do & Don't

- ✅ Mua bản Extended Mix cho bài bạn định nối.
- ✅ Đặt ngân sách nhạc nhỏ, đều đặn mỗi tháng.
- ✅ Ghi tên nghệ sĩ trong mọi tracklist bạn đăng.
- ❌ Mua đồ đắt trước khi biết mình thích dòng nhạc nào.
- ❌ Bán hoặc đăng bootleg như bản phát hành chính thức.
- ❌ Bỏ một bài hay chỉ vì nó không có trong bảng xếp hạng.

## Động tác thừa cần tránh

- **Lướt bảng xếp hạng mỗi ngày:** bảng xếp hạng đổi chậm hơn bạn nghĩ. Một buổi đào nhạc mỗi tuần là đủ.
- **Mua cùng một bài ở nhiều định dạng:** chọn một định dạng theo mục đích ngay từ đầu.
- **Lưu hàng trăm bài vào giỏ "để sau":** nghe và quyết định ngay, giỏ chỉ giữ vài bài.

## Bài tập 20 phút

1. Viết ra hai dòng nhạc bạn muốn chơi nhất.
2. Mở cửa hàng hợp với dòng nhạc đó, nghe bảng xếp hạng và hai trang label.
3. Chọn năm bài, nghe preview cả intro, breakdown và drop.
4. Mua hai bài tốt nhất ở định dạng phù hợp.
5. Nạp, gắn tag và thử nối với một bài bạn đã có.

## Bài tiếp theo

Có nhạc rồi, giờ hiểu nơi bạn sẽ chơi: [nghề DJ ở Việt Nam: club, bar, đám cưới, streaming](${lesson('dj-viet-nam', 'vi')}). Muốn chắc về định dạng, đọc lại [file nhạc DJ](${lesson('file-nhac-dj', 'vi')}). Cả lộ trình ở [Học DJ từ số 0](${lesson('hoc-dj-tu-so-0', 'vi')}).`;

const en = `**Buying DJ music** means buying downloads, or a streaming subscription built into your DJ software, from official sources such as Beatport, Bandcamp or Traxsource, so you get high-quality files and the artists get paid. After this lesson you know where to buy for your style, how remixes, bootlegs and edits differ, and how to stay clear of copyright trouble.

## Music sources for DJs

| Source | Type | Suits | Good to know |
| --- | --- | --- | --- |
| Beatport | A store for DJs | House, techno, tech house, trance, drum and bass | Charts for each style; download WAV, AIFF or MP3 |
| Traxsource | A store | House, garage, disco, soulful | Strong on vocal house and music rooted in soul and funk |
| Bandcamp | Artists' and labels' own store | Indie, experimental, small labels | Artists set their prices and keep most of the money; choose FLAC, WAV or MP3 |
| SoundCloud | Streaming and free downloads | Discovery, edits, new artists | Many tracks are free to download when the artist allows it |
| Streaming in DJ software | A monthly subscription | Trying lots of tracks, playing at home | Needs a stable connection; do not depend on it in a club |
| Vietnamese producers and stores | Local | V-Pop remixes, Vietnamese dance music | Buy or ask directly from the producer, and ask before posting |

A track on a DJ store usually costs around 1–3 US dollars depending on the store and format; on Bandcamp, artists set the price. Buying a few carefully chosen tracks costs less than buying many you never play.

## How do remixes, bootlegs, edits and mashups differ?

| Type | What it is | Official? |
| --- | --- | --- |
| Remix | A new version authorised by the song's owner and released through a label | Yes: buy and play it with confidence |
| Bootleg | A remix made without permission | No: often free to download, risky to sell or post |
| Edit | A rearrangement that is easier for DJs to play, for example with a long intro | Depends: official if a label releases it, unofficial if you make it yourself |
| Mashup | Two or more tracks combined into one | Usually unofficial |

Playing music in a club or bar is usually covered by the licence the venue pays to collecting societies (in Vietnam, VCPMC is one). Selling or posting a bootleg or mashup online is a different matter: you are distributing someone else's work. This is not legal advice; if you plan to release something, ask the song's owner.

${fig('en')}

## What you need

- A list of the styles and sub-genres you want to play.
- An account at one or two stores, and a small, fixed monthly budget.
- DJ software to import and tag tracks right after buying them (see [DJ file formats](${lesson('file-nhac-dj', 'en')})).

## Step by step

### Step 1: Know what you play before you pick a store

- **Do:** write down your two or three main styles. Techno, house, drum and bass: Beatport. Vocal house, disco: Traxsource. Unusual music, small labels: Bandcamp.
- **Look at:** nothing on the controller yet; open the store's site.
- **Listen for:** the chart of exactly the style you play; most of it should suit your taste.

### Step 2: Dig like a record collector

- **Do:** follow the labels and artists you like, listen to radio shows and mixes on Mixcloud, and read the tracklists of DJs you admire. Do not stop at the top 10.
- **Look at:** label pages, artist pages and "related tracks" lists.
- **Listen for:** the preview at the intro, the breakdown and the drop, not just the opening.

### Step 3: Buy the right version in the right format

- **Do:** choose the "Extended Mix" with long intros and outros (see [phrasing](${lesson('phrasing-dj', 'en')})). Keepers: AIFF, WAV or FLAC. Tracks to try: 320 kbps MP3.
- **Look at:** the version name (Original, Extended, Radio Edit) and the format choice at checkout.
- **Listen for:** after downloading, play the whole track: the right version, the full length, no strange noises.

### Step 4: Import, analyse and tag at once

- **Do:** import the track, check its beatgrid, tag its style and energy, and set a hot cue on beat one before you switch off.
- **Look at:** the BPM and Key columns and the tag fields in the library.
- **Listen for:** the new track sits in the right crate and blends well when you try it against an older one.

### Step 5: Support artists at home

- **Do:** follow and buy directly from Vietnamese producers, ask permission before playing or posting edits of their tracks, and credit them in your tracklists.
- **Look at:** the producer's Bandcamp, SoundCloud or social pages.
- **Listen for:** their tracks hold their own next to international ones in your set.

## Which styles suit a cheap controller and Vietnamese clubs?

Every style works on an entry-level controller: a cheap unit limits the number of channels and effects, not the music. House and tech house are the easiest to practise thanks to steady kicks and long intros. In Vietnamese clubs a night often moves through house, tech house, techno, hip-hop and V-Pop remixes; the details are in [DJing in Vietnam](${lesson('dj-viet-nam', 'en')}).

## Signs you got it right

- Every track you buy has been heard in full and has a place in at least one set.
- Your library holds no video rips and nothing below 320 kbps.
- Your tracklists name every artist, Vietnamese artists included.

## Common mistakes and fixes

| Mistake | What you hear or see | Fix |
| --- | --- | --- |
| Buying the Radio Edit | A short intro that is hard to mix | Choose the Extended Mix or Original Mix |
| Buying only the top 10 | A set identical to every other DJ's | Dig through labels, artists and radio shows |
| Ripping tracks from videos | A harsh top end on big speakers | Buy the official release |
| Posting bootlegs on a store or streaming service | Takedowns and account warnings | Release only what you have the rights to |
| Buying lots without listening | A swollen library you cannot remember | A small, fixed budget; listen to everything before buying more |

## Dos and don'ts

- ✅ Buy the Extended Mix of tracks you plan to mix.
- ✅ Set a small, regular monthly music budget.
- ✅ Credit the artists in every tracklist you post.
- ❌ Buy expensive gear before you know which style you love.
- ❌ Sell or post bootlegs as if they were official releases.
- ❌ Skip a great track just because it is not on a chart.

## Wasted moves to drop

- **Scrolling the charts every day:** charts change more slowly than you think. One digging session a week is enough.
- **Buying the same track in several formats:** pick one format for its purpose from the start.
- **Saving hundreds of tracks in a "later" cart:** listen and decide now; keep only a few in the cart.

## A 20-minute drill

1. Write down the two styles you most want to play.
2. Open the store that suits them and listen to its chart and two label pages.
3. Pick five tracks and preview the intro, breakdown and drop of each.
4. Buy the best two in the right format.
5. Import, tag and try blending them with a track you already own.

## Next lesson

Now that you have music, get to know where you will play: [DJing in Vietnam: clubs, bars, weddings and streaming](${lesson('dj-viet-nam', 'en')}). For more on formats, revisit [DJ file formats](${lesson('file-nhac-dj', 'en')}). The whole path is at [Learn to DJ from zero](${lesson('hoc-dj-tu-so-0', 'en')}).`;

export const muaNhac: PackPost = {
  key: 'dj-skills/mua-nhac',
  slug: 'mua-nhac-dj',
  category: 'dj',
  lang: 'vi',
  title: {
    vi: 'Mua nhạc DJ ở đâu? Beatport, Bandcamp và bản quyền remix',
    en: 'Where to buy DJ music: Beatport, Bandcamp and remix rights',
  },
  excerpt: {
    vi: 'Mua nhạc DJ ở đâu: Beatport, Traxsource, Bandcamp, SoundCloud, streaming và nhà sản xuất Việt. Phân biệt remix, bootleg, edit, mashup và cách mua đúng bản.',
    en: 'Where to buy DJ music: Beatport, Traxsource, Bandcamp, SoundCloud, streaming and Vietnamese producers. How remixes, bootlegs, edits and mashups differ.',
  },
  cover: coverOf(DJ_MEDIA.buy),
  styles: [],
  facts: lessonFacts({
    module: MODULES.music, minutes: '30',
    gear: { vi: 'Tài khoản cửa hàng, ngân sách nhạc nhỏ hàng tháng', en: 'A store account, a small monthly music budget' },
    first: { vi: 'File nhạc DJ và thư viện', en: 'DJ file formats and your library' },
    after: { vi: 'Mua đúng nguồn, đúng bản, tránh rắc rối bản quyền', en: 'Buy from the right source and version, avoid copyright trouble' },
  }),
  body: { vi, en },
  faq: [
    { q: { vi: 'DJ mua nhạc ở đâu?', en: 'Where do DJs buy music?' }, a: { vi: 'Phần lớn DJ nhạc điện tử mua ở Beatport, Traxsource và Bandcamp, tải file chất lượng cao như WAV, AIFF hoặc MP3 320 kbps. SoundCloud dùng để khám phá và tải các bài nghệ sĩ cho miễn phí. Với nhạc Việt, hãy mua hoặc xin trực tiếp từ nhà sản xuất.', en: 'Most electronic DJs buy from Beatport, Traxsource and Bandcamp, downloading high-quality WAV, AIFF or 320 kbps MP3 files. SoundCloud is for discovery and for tracks artists give away. For Vietnamese music, buy or ask directly from the producer.' } },
    { q: { vi: 'Bootleg là gì, có được chơi không?', en: 'What is a bootleg, and can I play one?' }, a: { vi: 'Bootleg là bản phối lại không được chủ bài hát cho phép. Nhiều DJ vẫn chơi bootleg ở club, nơi thường có giấy phép phát nhạc trả cho tổ chức quản lý quyền tác giả. Bán hoặc đăng bootleg lên mạng là phân phối tác phẩm của người khác và có thể bị gỡ.', en: 'A bootleg is a remix made without the song owner’s permission. Many DJs still play bootlegs in clubs, which usually hold a performance licence paid to a collecting society. Selling or posting a bootleg online distributes someone else’s work and can be taken down.' } },
    { q: { vi: 'Có thể chơi DJ bằng nhạc streaming không?', en: 'Can I DJ with streaming music?' }, a: { vi: 'Có, nhiều phần mềm DJ tích hợp dịch vụ streaming theo thuê bao, tiện để thử nhiều bài khi chơi ở nhà. Nhưng streaming cần mạng ổn định, và mạng ở club thường không đáng tin, nên hãy mang file đã mua cho những buổi diễn.', en: 'Yes, many DJ apps integrate subscription streaming services, which is handy for trying lots of tracks at home. But streaming needs a stable connection, and club Wi-Fi is rarely reliable, so bring purchased files to your gigs.' } },
    { q: { vi: 'Nên mua bản Extended Mix hay Radio Edit?', en: 'Should I buy the Extended Mix or the Radio Edit?' }, a: { vi: 'Extended Mix (hoặc Original Mix) cho DJ: intro và outro dài, thường 16–32 nhịp chỉ có trống, để bạn có thời gian chồng bài và đổi bass. Radio Edit ngắn, vào giai điệu ngay, hợp nghe radio nhưng rất khó nối bài mượt.', en: 'The Extended Mix (or Original Mix) for DJing: long intros and outros, often 16–32 bars of mostly drums, giving you time to overlap tracks and swap the bass. The Radio Edit is short and jumps straight into the melody; fine for radio, hard to mix smoothly.' } },
    { q: { vi: 'Một bài nhạc DJ giá bao nhiêu?', en: 'How much does a DJ track cost?' }, a: { vi: 'Trên các cửa hàng DJ, một bài thường khoảng 1–3 USD tuỳ cửa hàng và định dạng; bản lossless thường đắt hơn MP3 một chút. Trên Bandcamp, nghệ sĩ tự đặt giá. Một ngân sách nhỏ, đều đặn và chọn kỹ là cách xây thư viện bền nhất.', en: 'On DJ stores a track usually costs around 1–3 US dollars depending on the store and format, with lossless often slightly more than MP3. On Bandcamp, artists set the price. A small, regular, carefully spent budget is the most sustainable way to build a library.' } },
  ],
  sources: [
    { title: 'Beatport', url: 'https://www.beatport.com/', publisher: 'Beatport' },
    { title: 'Bandcamp', url: 'https://bandcamp.com/', publisher: 'Bandcamp' },
    { title: 'Remix', url: wiki('Remix'), publisher: 'Wikipedia' },
    { title: 'Mashup (music)', url: wiki('Mashup (music)'), publisher: 'Wikipedia' },
    { title: 'VCPMC', url: 'https://www.vcpmc.org/', publisher: 'Trung tâm Bảo vệ Quyền tác giả Âm nhạc Việt Nam' },
  ],
  tracks: [],
};
