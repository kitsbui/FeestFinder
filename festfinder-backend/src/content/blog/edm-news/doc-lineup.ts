import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, guide, LABEL, nights, PILLAR, UPDATED, type Media } from './shared.ts';

type Lang = 'vi' | 'en';

/** Read on Wikimedia Commons on 2026-10-23: a stage hosted by Q-dance at Mysteryland. */
const COVER: Media = {
  url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/Mysteryland_2019_-_Qdance_floor_01.jpg/1920px-Mysteryland_2019_-_Qdance_floor_01.jpg',
  page: 'https://commons.wikimedia.org/wiki/File:Mysteryland_2019_-_Qdance_floor_01.jpg',
  author: 'Gerard.koymans',
  license: 'CC BY-SA 4.0',
};

const g = (slug: string, lang: Lang) => guide(slug, lang);
const artists = (lang: Lang) => `/a${lang === 'en' ? '?lang=en' : ''}`;

const vi = `**Đọc lineup festival** là đọc ba lớp thông tin: thứ bậc (ai được in to, ai được công bố trước), sân khấu (ai dẫn sân khấu nào, nhạc gì) và giờ diễn (ai trùng giờ ai). Nắm ba lớp đó, bạn biết lễ hội đặt cược vào đâu, đêm nào đáng đi và nên đứng ở sân khấu nào.

${UPDATED.vi}

## Lineup là gì, và vì sao nó được viết như vậy

Lineup là danh sách nghệ sĩ mà ban tổ chức công bố, nhưng nó cũng là một tấm quảng cáo. Mỗi chi tiết, từ cỡ chữ đến thứ tự công bố, được chọn để bán vé. Vì vậy người trong nghề đọc lineup như đọc một bản tin: không chỉ "ai chơi", mà "ban tổ chức muốn bạn chú ý đến ai, và vì sao".

## 1. Cỡ chữ và các tầng

${LABEL.analysis.vi} Trên poster truyền thống, tên ở dòng trên cùng, in to nhất, là headliner; dòng thứ hai là những tên đang lên hoặc đã có chỗ đứng; phần chữ nhỏ là nghệ sĩ địa phương, resident và những người chơi sớm. Cỡ chữ phản ánh sức bán vé và mức cát-xê nhiều hơn là chất lượng: rất nhiều set đáng nhớ nhất của một lễ hội nằm ở hàng chữ nhỏ.

${LABEL.fact.vi} Ngày càng nhiều lễ hội lớn bỏ hẳn thứ bậc. Lineup EDC Las Vegas 2026 được in theo thứ tự chữ cái từng sân khấu, không ghi ai là headliner, và kết bằng câu "headliner quan trọng nhất: chính bạn". Đợt công bố đầu tiên của Ultra Miami 2027 cũng xếp theo thứ tự chữ cái. Khi không có cỡ chữ, hãy nhìn vào nhãn đi kèm tên (xem mục 3) và vào sân khấu mà nghệ sĩ được xếp.

## 2. Các đợt công bố

${LABEL.fact.vi} Lễ hội lớn công bố lineup theo đợt (phase), và thứ tự đó có ý nghĩa. Ultra 2026 công bố đợt 1 ngày 8/10/2025 với 14 màn ra mắt, đợt 2 ngày 12/11/2025 thêm hơn 70 nghệ sĩ, lineup sân khấu RESISTANCE ngày 2/12/2025 và đợt 3 ngày 4/2/2026. ADE 2026 công bố đợt đầu hơn 350 nghệ sĩ ngày 30/6/2026 và chương trình đầy đủ ngày 6/10/2026, khi con số đã lên hơn 3.600 nghệ sĩ. Creamfields 2027 thì công bố từng tên một, bắt đầu với The Prodigy ngày 10/9/2026.

${LABEL.analysis.vi} Đợt đầu chứa những tên bán vé, để mở đợt bán; các đợt sau lấp sân khấu phụ và thêm bất ngờ. Nếu một tên bạn chờ chưa có ở đợt 1, đừng vội kết luận: hãy xem sân khấu nào còn trống. Và vì đợt cuối thường đến sát ngày, đừng mua vé chỉ vì một tên "chắc chắn sẽ có" mà ban tổ chức chưa in.

## 3. b2b, live, alias và "presents"

${LABEL.fact.vi} Lineup có cả một ngôn ngữ riêng. Ở Ultra 2026:

- **b2b** (back-to-back): hai DJ chơi chung một set, thay nhau từng bài. Amelie Lens b2b Sara Landry được Ultra gọi là set "đầu tiên, độc quyền thế giới".
- **Alias**: một nghệ sĩ chơi dưới tên khác. Outlaw là tên techno của DJ Snake, chơi b2b TYRM.
- **"presents"**: một dự án hoặc một show riêng. Ultra 2027 có Boris Brejcha b2b Eric Prydz presents Cirez D, Cirez D là tên techno của Eric Prydz.
- **Live**: biểu diễn trực tiếp thay vì DJ set, như Boys Noize Live ở Ultra 2026.
- **Debut / Exclusive**: lần đầu ở lễ hội, ở nước đó hoặc trên thế giới. Phần lớn tên ở đợt 1 của Ultra 2027 có nhãn "Exclusive".

${LABEL.analysis.vi} Một b2b ra mắt thường là lý do bán vé mạnh hơn hai set riêng, vì nó chỉ xảy ra một lần. Nhưng nó cũng có nghĩa là mỗi nghệ sĩ chỉ chơi nửa thời gian: nếu bạn đi vì một người, hãy xem họ có set riêng không.

## 4. Sân khấu và người dẫn sân khấu

${LABEL.fact.vi} Sân khấu cho bạn biết thể loại nhạc. Ultra có RESISTANCE cho techno và house underground, với Dennis Cruz b2b Seth Troxler là headliner năm 2026. Creamfields chia APEX, Arc và Steel Yard; năm 2026 Swedish House Mafia chơi APEX, Amelie Lens chơi Steel Yard, Disclosure (live) chơi Arc. Tomorrowland Thailand mang sân khấu CORE và Freedom lần đầu tới châu Á.

${LABEL.analysis.vi} Nhiều sân khấu được một label hoặc một nhóm tổ chức "dẫn" (stage host): label đó chọn nghệ sĩ, và tên label nói nhiều hơn từng cái tên. Trong tuần ADE 2026, các đêm Awakenings ở SugarFactory có đêm Drumcode và đêm Prophecy của Prospa; ảnh bìa bài này là sân khấu hardstyle do Q-dance dẫn ở Mysteryland. Nếu bạn thích một label, hãy tìm sân khấu của họ trước khi đọc từng tên.

## 5. Lịch giờ và trùng giờ

${LABEL.analysis.vi} Lịch giờ diễn (set times) thường ra rất muộn, chỉ vài ngày hay vài tuần trước lễ hội; DJ Mag đưa tin lịch giờ của CORE Melbourne vào ngày 22/10/2026, khoảng năm tuần trước đêm 28/11. Khi lịch ra, việc đầu tiên là tìm chỗ trùng: hai tên bạn muốn xem cùng giờ ở hai sân khấu xa nhau. Hãy chọn trước, tính cả thời gian đi bộ giữa sân khấu (ở lễ hội lớn có thể là 15–20 phút), và để dành một khung giờ trống để khám phá một tên lạ.

Giờ của set cũng là một tín hiệu. Set cuối ở sân khấu chính là chỗ của headliner; set lúc hoàng hôn thường dành cho người ban tổ chức muốn làm nổi bật; set mở cửa là chỗ của nghệ sĩ địa phương và người mới.

## 6. "Special guest", "TBA" và "and many more"

${LABEL.analysis.vi} "Special guest" hay "TBA" nghĩa là một chỗ đã có người nhưng chưa được nói ra, hoặc chưa có ai. Đó có thể là một bất ngờ thật, cũng có thể chỉ là một chỗ trống. "And many more" ở cuối danh sách, như trong bài giới thiệu Mainstage Tomorrowland 2026 ("Martin Garrix, Calvin Harris, David Guetta, Hardwell, and many more"), nghĩa là danh sách chưa đầy đủ. Đừng mua vé cho một tên chưa in.

## 7. Đọc hướng đi của một scene qua lineup

${LABEL.analysis.vi} Đặt lineup của cùng một lễ hội qua vài năm cạnh nhau, bạn thấy được xu hướng. Đợt 1 của Ultra Miami 2027 có I Hate Models, Indira Paganotto, Klangkuenstler, Nico Moreno b2b Novah và Sara Landry, những cái tên techno nhanh và mạnh, bên cạnh Martin Garrix và Calvin Harris. Ở DJ Mag Top 100 DJs 2026, Anyma tăng lên hạng 3 và Charlotte de Witte lên hạng 6. Cùng nhau, chúng cho thấy techno và hard techno đã lên tới sân khấu chính; đọc thêm ở [xu hướng hard techno](${g('xu-huong-hard-techno', 'vi')}).

Hãy nhìn cả hàng chữ nhỏ. Tomorrowland Thailand 2026 có hơn 100 nghệ sĩ từ hơn 20 quốc tịch, trong đó hơn 20 nghệ sĩ Thái như Nakadia, Mike Bond và Botcash. Số nghệ sĩ địa phương trên một lễ hội quốc tế cho biết scene ở đó đã lớn tới đâu.

## 8. Dùng FeestFinder để đọc lineup

${LABEL.analysis.vi} Trên FeestFinder, mỗi tên trong lineup của một đêm nhạc có thể dẫn tới trang nghệ sĩ: các show sắp tới, thông tin và mix để nghe. Trang sự kiện có "Nghe trước" để nghe một mix của mỗi nghệ sĩ có hồ sơ trước khi mua vé. Nếu một nghệ sĩ chưa có hồ sơ, "Nhắc khi có show" báo cho bạn khi họ có đêm mới. Thư mục [nghệ sĩ](${artists('vi')}) lọc theo dòng nhạc, và danh sách sự kiện lọc theo style, ví dụ [các đêm techno](${nights('techno', 'vi')}).

## Bảng kiểm nhanh

| Câu hỏi | Nhìn vào đâu |
| --- | --- |
| Lễ hội đặt cược vào ai? | Dòng đầu, đợt công bố đầu tiên |
| Nhạc ở đây là gì? | Tên sân khấu và label dẫn sân khấu |
| Set này có đặc biệt không? | Nhãn b2b, live, debut, exclusive |
| Có trùng giờ không? | Lịch giờ diễn, khoảng cách giữa sân khấu |
| Scene đang đi về đâu? | So lineup với các năm trước, đếm nghệ sĩ địa phương |

## Đọc tiếp

- [Festival EDM thế giới 2026 và lịch 2027](${g('festival-edm-the-gioi-2026', 'vi')})
- [Tomorrowland Thailand 2026](${g('tomorrowland-thailand-2026', 'vi')})
- [Lịch festival EDM châu Á](${g('lich-festival-edm-chau-a', 'vi')})
- [Tin tức EDM](${g('tin-tuc-edm', 'vi')}) · [Techno là gì?](${g('techno', 'vi')})`;

const en = `**Reading a festival line-up** means reading three layers: hierarchy (who is printed large, who is announced first), stages (who hosts which stage, with what music) and set times (who clashes with whom). Once you can read those, you know what the festival is betting on, which day to go and which stage to stand at.

${UPDATED.en}

## What a line-up is, and why it is written that way

A line-up is the list of artists an organiser announces, but it is also an advert. Every detail, from type size to the order of announcements, is chosen to sell tickets. That is why insiders read a line-up like a news story: not only "who plays", but "who the organiser wants you to notice, and why".

## 1. Type size and tiers

${LABEL.analysis.en} On a classic poster, the names on the top line, printed largest, are the headliners; the second line holds rising or established names; the small print is local artists, residents and the early slots. Type size reflects ticket pull and fees more than quality: many of a festival's most memorable sets sit in the small print.

${LABEL.fact.en} More and more big festivals drop the hierarchy altogether. The EDC Las Vegas 2026 line-up was printed alphabetically by stage with no headliner billing, closing with "the most important headliner of all: You". Ultra Miami's first wave for 2027 is alphabetical too. When there is no type size, look at the labels next to the names (see part 3) and at the stage each artist is booked on.

## 2. Announcement phases

${LABEL.fact.en} Big festivals announce their line-ups in phases, and the order matters. Ultra 2026 announced Phase 1 on 8 October 2025 with 14 debut performances, Phase 2 on 12 November 2025 with more than 70 acts, the RESISTANCE line-up on 2 December 2025 and Phase 3 on 4 February 2026. ADE 2026 announced a first wave of more than 350 artists on 30 June 2026 and its complete programme on 6 October 2026, by then more than 3,600 artists. Creamfields 2027 announces names one at a time, starting with The Prodigy on 10 September 2026.

${LABEL.analysis.en} The first phase carries the names that sell tickets, to open the sale; later phases fill the side stages and add surprises. If a name you are waiting for is not in Phase 1, don't conclude too fast: look at which stages are still empty. And because the last phase often comes close to the date, never buy a ticket for a name the organiser has not printed.

## 3. b2b, live, aliases and "presents"

${LABEL.fact.en} Line-ups have a language of their own. At Ultra 2026:

- **b2b** (back-to-back): two DJs share a set, trading tracks. Ultra called Amelie Lens b2b Sara Landry "the first-ever, world-exclusive" set.
- **Alias**: an artist playing under another name. Outlaw is DJ Snake's techno alias, playing b2b TYRM.
- **"presents"**: a project or a special show. Ultra 2027 has Boris Brejcha b2b Eric Prydz presents Cirez D, Cirez D being Eric Prydz's techno alias.
- **Live**: a live performance rather than a DJ set, such as Boys Noize Live at Ultra 2026.
- **Debut / Exclusive**: a first time at the festival, in that country or anywhere. Most names in Ultra 2027's first wave carry an "Exclusive" tag.

${LABEL.analysis.en} A debut back-to-back often sells better than two solo sets, because it happens once. But it also means each artist plays half the time: if you are going for one person, check whether they also have a solo set.

## 4. Stages and stage hosts

${LABEL.fact.en} The stage tells you the music. Ultra has RESISTANCE for underground techno and house, with Dennis Cruz b2b Seth Troxler headlining it in 2026. Creamfields splits APEX, Arc and Steel Yard; in 2026 Swedish House Mafia played APEX, Amelie Lens the Steel Yard and Disclosure (live) the Arc. Tomorrowland Thailand brings its CORE and Freedom stages to Asia for the first time.

${LABEL.analysis.en} Many stages are hosted by a label or a collective: the host picks the artists, and its name says more than any single act. During ADE 2026, the Awakenings nights at SugarFactory include a Drumcode night and Prospa's Prophecy; this post's cover is the hardstyle stage Q-dance hosted at Mysteryland. If you love a label, find its stage before you read the names.

## 5. Set times and clashes

${LABEL.analysis.en} Set times usually come late, days or weeks before the festival; DJ Mag reported CORE Melbourne's set times on 22 October 2026, about five weeks before the 28 November event. When they land, first look for clashes: two acts you want at the same time on stages far apart. Choose in advance, count the walk between stages (15–20 minutes at a big festival), and keep one slot free to discover a name you don't know.

The time slot is a signal too. The last set on the main stage belongs to the headliner; the sunset slot often goes to someone the organiser wants to spotlight; the opening slots are for local artists and newcomers.

## 6. "Special guest", "TBA" and "and many more"

${LABEL.analysis.en} "Special guest" or "TBA" means a slot is filled but not named, or not filled yet. It may be a real surprise, or simply a gap. "And many more" at the end of a list, as in Tomorrowland's 2026 Mainstage reveal ("Martin Garrix, Calvin Harris, David Guetta, Hardwell, and many more"), means the list is incomplete. Never buy a ticket for a name that is not printed.

## 7. Reading a scene's direction from line-ups

${LABEL.analysis.en} Put the same festival's line-ups from a few years side by side and the trends show. Ultra Miami 2027's first wave has I Hate Models, Indira Paganotto, Klangkuenstler, Nico Moreno b2b Novah and Sara Landry, fast and heavy techno names, beside Martin Garrix and Calvin Harris. In DJ Mag's Top 100 DJs 2026, Anyma rises to No. 3 and Charlotte de Witte to No. 6. Together they show techno and hard techno reaching the main stages; read more in [our hard techno trend report](${g('xu-huong-hard-techno', 'en')}).

Read the small print too. Tomorrowland Thailand 2026 has more than 100 artists from over 20 nationalities, including more than 20 Thai artists such as Nakadia, Mike Bond and Botcash. The number of local artists on an international festival tells you how far the local scene has grown.

## 8. Using FeestFinder to read a line-up

${LABEL.analysis.en} On FeestFinder, each name in a night's line-up can lead to the artist's page: their coming shows, their facts and mixes to play. The event page has "Listen first" to play a mix by each lineup artist with a profile before you buy. If an artist has no profile yet, "Tell me when they play" lets you know when they have a new night. The [artist directory](${artists('en')}) filters by style, and the list of events filters by style too, for example [techno nights](${nights('techno', 'en')}).

## A quick checklist

| Question | Where to look |
| --- | --- |
| Who is the festival betting on? | The top line, the first phase |
| What music is this? | The stage names and the label hosting each stage |
| Is this set special? | The b2b, live, debut and exclusive tags |
| Will I face clashes? | The set times and the distance between stages |
| Where is the scene going? | Compare with earlier years, count the local artists |

## Read next

- [World EDM festivals 2026 and the 2027 dates](${g('festival-edm-the-gioi-2026', 'en')})
- [Tomorrowland Thailand 2026](${g('tomorrowland-thailand-2026', 'en')})
- [The EDM festival calendar in Asia](${g('lich-festival-edm-chau-a', 'en')})
- [EDM news](${g('tin-tuc-edm', 'en')}) · [What is techno?](${g('techno', 'en')})`;

/** Explainer: reading a festival line-up, with sourced examples from the 2026–2027 announcements. */
export const docLineup: PackPost = {
  key: 'edm-news/cach-doc-lineup-festival',
  slug: 'cach-doc-lineup-festival',
  category: 'news',
  lang: 'vi',
  parent: PILLAR,
  title: {
    vi: 'Cách đọc lineup festival EDM như người trong nghề',
    en: 'How to read an EDM festival line-up like an insider',
  },
  excerpt: {
    vi: 'Cách đọc lineup festival EDM: cỡ chữ và các tầng, các đợt công bố, b2b, alias và live, sân khấu và label dẫn, giờ diễn, trùng giờ, ví dụ từ Ultra, ADE, Creamfields.',
    en: 'How to read an EDM festival line-up: type size and tiers, phases, b2b, aliases and live sets, stage hosts, set times, clashes; examples from Ultra, ADE, Creamfields.',
  },
  body: { vi, en },
  cover: coverOf(COVER),
  styles: ['edm', 'techno', 'hard-techno', 'mainstage', 'hardstyle'],
  facts: [
    { label: { vi: 'Ba lớp cần đọc', en: 'Three layers' }, value: { vi: 'Thứ bậc · sân khấu · giờ diễn', en: 'Hierarchy · stages · set times' } },
    { label: { vi: 'b2b', en: 'b2b' }, value: { vi: 'Hai DJ chơi chung một set', en: 'Two DJs sharing one set' } },
    { label: { vi: 'Lineup theo chữ cái', en: 'Alphabetical line-ups' }, value: { vi: 'EDC Las Vegas 2026, Ultra 2027 đợt 1', en: 'EDC Las Vegas 2026, Ultra 2027 Phase 1' } },
    { label: { vi: 'Lịch giờ diễn', en: 'Set times' }, value: { vi: 'Thường ra vài ngày đến vài tuần trước lễ hội', en: 'Usually out days to weeks before the festival' } },
    { label: { vi: 'Ví dụ đợt công bố', en: 'Phases, for example' }, value: { vi: 'ADE 2026: 350+ nghệ sĩ (30/6) → 3.600+ (6/10)', en: 'ADE 2026: 350+ artists (30 June) → 3,600+ (6 October)' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'b2b trong lineup nghĩa là gì?', en: 'What does b2b mean on a line-up?' }, a: { vi: 'Back-to-back: hai DJ chơi chung một set, thay nhau từng bài, như Amelie Lens b2b Sara Landry ở Ultra 2026.', en: 'Back-to-back: two DJs share one set, trading tracks, like Amelie Lens b2b Sara Landry at Ultra 2026.' } },
    { q: { vi: 'Headliner là ai trên một lineup?', en: 'Who are the headliners on a line-up?' }, a: { vi: 'Thường là tên ở dòng trên cùng, in to nhất, và được công bố ở đợt đầu. Khi lineup xếp theo thứ tự chữ cái như EDC Las Vegas 2026, hãy xem ai chơi set cuối ở sân khấu chính.', en: 'Usually the names on the top line, printed largest and announced first. When a line-up is alphabetical, as at EDC Las Vegas 2026, look at who plays the last set on the main stage.' } },
    { q: { vi: 'Khi nào có lịch giờ diễn?', en: 'When do set times come out?' }, a: { vi: 'Thường chỉ vài ngày đến vài tuần trước lễ hội; lịch giờ CORE Melbourne được công bố khoảng năm tuần trước đêm 28/11/2026.', en: 'Usually days to weeks before the festival; CORE Melbourne\'s set times came out about five weeks before its 28 November 2026 date.' } },
    { q: { vi: '"presents" trong lineup nghĩa là gì?', en: 'What does "presents" mean on a line-up?' }, a: { vi: 'Một dự án hoặc show riêng của nghệ sĩ, thường dưới tên khác, như Eric Prydz presents Cirez D, tên techno của Eric Prydz.', en: 'A project or special show by the artist, often under another name, such as Eric Prydz presents Cirez D, his techno alias.' } },
    { q: { vi: 'Có nên mua vé trước khi lineup đầy đủ?', en: 'Should I buy a ticket before the full line-up is out?' }, a: { vi: 'Chỉ khi bạn đi vì cả lễ hội. Đừng mua vé cho một tên mà ban tổ chức chưa in; "special guest" và "and many more" có thể chỉ là chỗ trống.', en: 'Only if you are going for the festival as a whole. Never buy for a name the organiser has not printed; "special guest" and "and many more" may just be gaps.' } },
  ],
  sources: [
    { title: 'Ultra Music Festival reveals Phase 3 lineup for 2026 edition', url: 'https://ultramusicfestival.com/news/ultra-music-festival-reveals-phase-3-lineup-for-2026-edition', publisher: 'Ultra Music Festival' },
    { title: 'Ultra Music Festival 2027 lineup', url: 'https://ultramusicfestival.com/lineup/', publisher: 'Ultra Music Festival' },
    { title: 'EDC Las Vegas lineup', url: 'https://lasvegas.edc.com/lineup/', publisher: 'Insomniac' },
    { title: 'First wave of artists for 30 YEARS ADE', url: 'https://www.amsterdam-dance-event.nl/en/news/first-wave-of-artists-for-30-years-ade/2805126/', publisher: 'Amsterdam Dance Event' },
    { title: '30 YEARS ADE: festival program complete', url: 'https://www.amsterdam-dance-event.nl/en/news/30-years-ade-festival-program-complete/2927685/', publisher: 'Amsterdam Dance Event' },
    { title: 'Creamfields 2027: announced so far', url: 'https://creamfields.com/announcements/', publisher: 'Creamfields' },
    { title: 'Tomorrowland Thailand unveils full Consciencia line-up', url: 'https://www.tomorrowland.com/article/tomorrowland-thailand-2026-line-up-new/', publisher: 'Tomorrowland' },
    { title: 'Top 100 DJs 2026', url: 'https://djmag.com/top100djs', publisher: 'DJ Mag' },
  ],
  tracks: [],
};
