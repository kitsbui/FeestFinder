import type { PackPost } from '../../../services/blog-content.ts';
import { guide, MEDIA, wiki } from './media.ts';

const [cover] = MEDIA.edm;
const row = (lang: 'vi' | 'en', slug: string, name: string, bpm: string, feel: { vi: string; en: string }) =>
  `| [${name}](${guide(slug, lang)}) | ${bpm} | ${feel[lang]} |`;
const table = (lang: 'vi' | 'en') => [
  lang === 'vi' ? '| Dòng nhạc | BPM | Cảm giác |' : '| Genre | BPM | Feel |',
  '| --- | --- | --- |',
  row(lang, 'techno', 'Techno', '120–150', { vi: 'Lặp, thôi miên, máy móc', en: 'Repetitive, hypnotic, mechanical' }),
  row(lang, 'trance', 'Trance', '128–140', { vi: 'Giai điệu bay bổng, breakdown dài', en: 'Soaring melodies, long breakdowns' }),
  row(lang, 'psytrance', 'Psytrance', '138–148', { vi: 'Rolling bass, psychedelic', en: 'Rolling bass, psychedelic' }),
  row(lang, 'hardstyle', 'Hardstyle', '150–160', { vi: 'Kick distorted, euphoric hoặc raw', en: 'Distorted kicks, euphoric or raw' }),
  row(lang, 'dubstep', 'Dubstep', '140 (half-time)', { vi: 'Sub-bass nặng, wobble', en: 'Heavy sub-bass, wobble' }),
  row(lang, 'drum-and-bass', 'Drum & Bass', '160–180', { vi: 'Breakbeat nhanh, bass lăn', en: 'Fast breakbeats, rolling bass' }),
  row(lang, 'bass-house', 'Bass House', '124–128', { vi: 'House với bass gầm gừ', en: 'House with growling bass' }),
  row(lang, 'mainstage-edm', 'Mainstage / Big Room', '126–132', { vi: 'Build-up dài, drop tối giản', en: 'Long build-ups, minimal drops' }),
  row(lang, 'bounce', 'Bounce', '126–130', { vi: 'Bassline off-beat nảy, vui nhộn', en: 'Bouncy off-beat bass, playful' }),
].join('\n');

export const edm: PackPost = {
  key: 'edm-genres/edm',
  slug: 'edm',
  category: 'styles',
  lang: 'vi',
  title: {
    vi: 'EDM là gì? Bản đồ các dòng nhạc điện tử từ techno tới bounce',
    en: 'What is EDM? A map of electronic dance music genres',
  },
  excerpt: {
    vi: 'EDM là nhạc điện tử viết để nhảy, từ techno, house, trance tới dubstep, drum & bass, hardstyle. Bản đồ 9 dòng chính với BPM, cảm giác và nơi bắt đầu.',
    en: 'EDM is electronic music made for dancing, from techno, house and trance to dubstep, drum & bass and hardstyle. Nine main genres with BPM, feel and where to start.',
  },
  cover: { url: cover.url, credit: `[${cover.author}](${cover.page}) · ${cover.license} · Wikimedia Commons` },
  styles: ['edm', 'techno', 'trance', 'dubstep', 'drum-and-bass', 'hardstyle'],
  facts: [
    { label: { vi: 'Tên đầy đủ', en: 'Full name' }, value: { vi: 'Electronic Dance Music (nhạc dance điện tử)', en: 'Electronic dance music' } },
    { label: { vi: 'BPM', en: 'BPM' }, value: { vi: 'Từ khoảng 120 (house) tới hơn 200 (hardcore)', en: 'From about 120 (house) to over 200 (hardcore)' } },
    { label: { vi: 'Nguồn gốc', en: 'Origin' }, value: { vi: 'Disco, nhạc điện tử; house Chicago và techno Detroit thập niên 1980', en: 'Disco and electronic music; Chicago house and Detroit techno in the 1980s' } },
    { label: { vi: 'Nhạc cụ', en: 'Instruments' }, value: { vi: 'Drum machine, synthesizer, sampler, DAW', en: 'Drum machines, synthesizers, samplers, DAWs' } },
    { label: { vi: 'Nơi nghe', en: 'Where' }, value: { vi: 'Club, rave, lễ hội', en: 'Clubs, raves, festivals' } },
  ],
  body: {
    vi: `**EDM** (Electronic Dance Music, nhạc dance điện tử) là tên gọi chung cho nhạc điện tử viết để nhảy, được tạo bằng drum machine, synthesizer và máy tính, chơi bởi DJ ở club, rave và lễ hội. EDM gồm nhiều dòng rất khác nhau, từ techno, house, trance tới dubstep, drum & bass và hardstyle, phân biệt chủ yếu qua BPM, nhịp và âm thanh bass.

## EDM ra đời thế nào?

Gốc của EDM nằm ở disco và nhạc điện tử thập niên 1970 (Giorgio Moroder, Kraftwerk). Đầu thập niên 1980, **house** ra đời ở Chicago và **techno** ở Detroit. Cuối thập niên 1980 và thập niên 1990, làn sóng rave ở Anh và châu Âu sinh ra trance, jungle, drum & bass, hardcore. Thập niên 2000 có dubstep và hardstyle, còn thập niên 2010 là thời bùng nổ của lễ hội EDM với big room và bass music.

Ở Mỹ, từ "EDM" thường chỉ âm thanh mainstage của thập niên 2010; còn trên FeestFinder, EDM là cả gia đình nhạc điện tử để nhảy, đúng như nghĩa gốc của nó.

## 9 dòng EDM chính

${table('vi')}

## Chọn dòng nhạc theo gu của bạn

- **Thích giai điệu và cảm xúc:** bắt đầu với [trance](${guide('trance', 'vi')}) hoặc melodic techno.
- **Thích groove liên tục, nhảy cả đêm:** [techno](${guide('techno', 'vi')}) và tech house.
- **Thích bass thật nặng:** [dubstep](${guide('dubstep', 'vi')}), [bass house](${guide('bass-house', 'vi')}).
- **Thích tốc độ:** [drum & bass](${guide('drum-and-bass', 'vi')}) hoặc [hardstyle](${guide('hardstyle', 'vi')}).
- **Thích không khí lễ hội:** [mainstage](${guide('mainstage-edm', 'vi')}) và [bounce](${guide('bounce', 'vi')}).
- **Thích lễ hội ngoài trời và âm thanh psychedelic:** [psytrance](${guide('psytrance', 'vi')}).

## Cách phân biệt các dòng EDM

1. **Đếm BPM:** khoảng 125 thường là house; 130–140 là techno hoặc trance; 140 half-time là dubstep; 150 là hardstyle; 174 là drum & bass.
2. **Nghe kick:** 4/4 đều (house, techno, trance, hardstyle) hay breakbeat (drum & bass, breakbeat)?
3. **Nghe bass:** off-beat (trance), rolling (psytrance), wobble (dubstep), reese (drum & bass), nảy (bounce)?
4. **Nghe cấu trúc:** breakdown dài (trance), drop tối giản (big room), lặp và biến đổi chậm (techno).

## Thuật ngữ EDM cơ bản

| Thuật ngữ | Nghĩa |
| --- | --- |
| BPM | Số phách mỗi phút, tốc độ của bản nhạc |
| Kick | Tiếng trống bass, nhịp chính của hầu hết các dòng EDM |
| Four-on-the-floor | Kick đều ở cả bốn phách của ô nhịp 4/4 |
| Bassline | Đường bass, thường quyết định "chất" của một dòng nhạc |
| Build-up | Đoạn dồn năng lượng trước drop: snare roll, riser |
| Drop | Khoảnh khắc bùng nổ sau build-up, khi kick và bass trở lại |
| Breakdown | Đoạn nghỉ, kick dừng để giai điệu hoặc không khí hiện ra |
| Set | Phần biểu diễn liền mạch của một DJ, thường 1–2 giờ |
| B2B | Back-to-back: hai DJ thay phiên chơi trong cùng một set |
| Sub-genre | Nhánh nhỏ của một dòng nhạc, như minimal techno hay liquid DnB |

## Một track EDM được dựng thế nào?

Gần như mọi track EDM đều gồm những phần giống nhau, sắp theo phrase 8, 16 hoặc 32 bar:

1. **Intro:** trống và vài lớp âm thanh, để DJ mix vào.
2. **Build-up:** căng dần với riser, snare roll và filter.
3. **Drop:** lúc beat đầy đủ cùng bass hoặc lead chính vào cùng lúc, phần người ta nhảy hết mình nhất.
4. **Breakdown:** trống lùi lại, giai điệu hoặc không khí lên tiếng.
5. **Build-up và drop thứ hai:** thường lớn hơn lần đầu.
6. **Outro:** lại là trống, để bài sau vào.

Thứ đổi theo từng dòng là nhịp bên dưới. House, techno, trance và big room dùng kick **four-on-the-floor**, mỗi phách một tiếng. Drum & bass và breakbeat dùng nhịp trống gãy (broken beat), còn dubstep chạy 140 BPM với cảm giác half-time. Tempo là gợi ý nhanh nhất: house khoảng 120–128 BPM, trance 128–140, hardstyle 150–160, drum & bass 160–180.

## Club, rave và lễ hội khác nhau thế nào?

EDM có ba kiểu nơi để nghe, mỗi nơi một cảm giác:

- **Đêm club:** một phòng vài trăm người, thường từ tối muộn tới rạng sáng, một hai DJ chơi set dài. Đây là nơi techno, house, drum & bass sống hằng tuần.
- **Rave:** tiệc trong nhà kho, bãi đất trống hay những nơi không phải club, thường kéo dài cả đêm và xoay quanh một scene hay một kiểu âm thanh.
- **Lễ hội (festival):** từ một tới vài ngày, nhiều sân khấu, hàng chục nghệ sĩ từ DJ địa phương tới headliner. Mỗi sân khấu thường có một dòng nhạc riêng, nên lễ hội là cách tốt để nghe nhiều dòng trong một cuối tuần.

Ngoài ba kiểu trên còn có những buổi ban ngày như coffee rave, sunset session hay day party: nhạc điện tử nhưng nhẹ nhàng hơn, hợp với người mới.

## Đêm EDM đầu tiên của bạn

- **Chọn đêm theo line-up và dòng nhạc,** không chỉ theo địa điểm: các dòng nhạc ghi trên trang sự kiện cho bạn biết sẽ nghe gì.
- **Mua vé ở nơi bán chính thức.** Nút Mua vé trên FeestFinder đưa bạn tới nơi bán của nhà tổ chức.
- **Xem giới hạn tuổi và giờ mở cửa** trước khi đi; nhiều đêm club là 18+.
- **Giữ gìn đôi tai.** Nút tai dành cho nghe nhạc giảm âm lượng mà không làm méo tiếng, và thỉnh thoảng ra xa loa cũng giúp nhiều.
- **Đến sớm** nếu được: DJ mở màn đặt không khí cho cả đêm, và những set mở màn là nơi nhiều headliner tương lai được chú ý lần đầu.
- **Uống nước, tính trước đường về** và đi cùng bạn bè.

## Đọc trang sự kiện trên FeestFinder

Mỗi đêm trên FeestFinder trả lời cùng những câu hỏi theo cùng một thứ tự: khi nào, ở đâu, giá bao nhiêu, từ bao nhiêu tuổi, rồi tới line-up và dòng nhạc.

- **Dòng nhạc** là gợi ý đầu tiên về âm thanh: một đêm gắn techno hay hard techno sẽ rất khác một đêm gắn house hay trance.
- **Giá** là mức vé thấp nhất nơi bán đưa ra ("từ"). Khi nguồn không ghi giá, trang ghi là chưa rõ giá chứ không gọi đêm đó là miễn phí.
- **Được đăng hay được tìm thấy:** đêm do nhà tổ chức hoặc cộng đồng đăng sẽ ghi rõ; đêm do Feest Radar tìm thấy trên trang của club hay trang bán vé mang dấu Radar, và nút mua vé đưa bạn tới trang nơi nó được tìm thấy.
- **Lưu lại** bằng trái tim để tìm lại trong mục Đã lưu, hoặc đặt nhắc khi có show cho một dòng nhạc hay một nghệ sĩ để được báo khi có đêm mới ở thành phố của bạn.

Nếu line-up có nghệ sĩ đã có hồ sơ, trang của họ cho bạn nghe mix trước khi mua vé.

## EDM ở châu Á

Châu Á có một trong những cộng đồng nhạc điện tử sôi động nhất thế giới: Goa (Ấn Độ) là nơi Goa trance ra đời, Tokyo có văn hóa club techno và house lâu đời, Bangkok và Bali là điểm hẹn của các lễ hội ngoài trời, còn TP.HCM và Hà Nội có những club underground và rave ngày càng lớn. Nhiều DJ quốc tế đưa châu Á vào lịch lưu diễn hằng năm, và các nghệ sĩ châu Á cũng đang tạo dấu ấn riêng.

## Nghe EDM ở đâu tại châu Á?

FeestFinder liệt kê club night, rave và lễ hội nhạc điện tử ở TP.HCM, Hà Nội, Đà Nẵng, Nha Trang, Bangkok, Tokyo, Singapore và Bali. Xem [tất cả sự kiện sắp tới](/) hoặc lọc theo dòng nhạc bạn thích.`,
    en: `**EDM** (electronic dance music) is the umbrella name for electronic music made for dancing, created with drum machines, synthesizers and computers and played by DJs in clubs, raves and festivals. It spans very different genres, from techno, house and trance to dubstep, drum & bass and hardstyle, told apart mainly by BPM, rhythm and bass sound.

## Where did EDM come from?

EDM's roots are in the disco and electronic music of the 1970s (Giorgio Moroder, Kraftwerk). In the early 1980s **house** was born in Chicago and **techno** in Detroit. The late-1980s and 1990s rave wave in the UK and Europe gave birth to trance, jungle, drum & bass and hardcore. The 2000s brought dubstep and hardstyle, and the 2010s the festival EDM boom with big room and bass music.

In the US "EDM" often means the mainstage sound of the 2010s; on FeestFinder, EDM is the whole family of electronic dance music, as the name originally meant.

## 9 main EDM genres

${table('en')}

## Pick a genre by taste

- **Love melody and emotion:** start with [trance](${guide('trance', 'en')}) or melodic techno.
- **Love a non-stop groove, dancing all night:** [techno](${guide('techno', 'en')}) and tech house.
- **Love heavy bass:** [dubstep](${guide('dubstep', 'en')}), [bass house](${guide('bass-house', 'en')}).
- **Love speed:** [drum & bass](${guide('drum-and-bass', 'en')}) or [hardstyle](${guide('hardstyle', 'en')}).
- **Love festival energy:** [mainstage](${guide('mainstage-edm', 'en')}) and [bounce](${guide('bounce', 'en')}).
- **Love open-air festivals and psychedelic sounds:** [psytrance](${guide('psytrance', 'en')}).

## How to tell EDM genres apart

1. **Count the BPM:** about 125 is usually house; 130–140 techno or trance; 140 half-time dubstep; 150 hardstyle; 174 drum & bass.
2. **Listen to the kick:** a steady 4/4 (house, techno, trance, hardstyle) or breakbeats (drum & bass, breakbeat)?
3. **Listen to the bass:** off-beat (trance), rolling (psytrance), wobble (dubstep), reese (drum & bass), bouncing (bounce)?
4. **Listen to the structure:** long breakdowns (trance), minimal drops (big room), slow repetition and change (techno).

## Basic EDM terms

| Term | Meaning |
| --- | --- |
| BPM | Beats per minute, a track's tempo |
| Kick | The bass drum, the main pulse of most EDM |
| Four-on-the-floor | A kick on all four beats of a 4/4 bar |
| Bassline | The bass part, often what defines a genre's character |
| Build-up | The rise before the drop: snare rolls, risers |
| Drop | The explosive moment after the build-up, when kick and bass return |
| Breakdown | The pause where the kick stops and melody or atmosphere takes over |
| Set | A DJ's continuous performance, usually 1–2 hours |
| B2B | Back-to-back: two DJs taking turns in one set |
| Sub-genre | A smaller branch of a genre, such as minimal techno or liquid DnB |

## How is an EDM track built?

Almost every EDM track is made of the same parts, arranged in phrases of 8, 16 or 32 bars:

1. **Intro:** drums and a few elements, so a DJ can mix in.
2. **Build-up:** rising tension with risers, snare rolls and filters.
3. **Drop:** the moment the full beat and the main bass or lead hit together, the part people dance hardest to.
4. **Breakdown:** the drums step back and the melody or the atmosphere takes over.
5. **Second build-up and drop:** often bigger than the first.
6. **Outro:** drums again, so the next track can come in.

What changes from genre to genre is the rhythm underneath. House, techno, trance and big room use a **four-on-the-floor** kick, one on every beat. Drum & bass and breakbeat use broken drum patterns, and dubstep plays at 140 BPM with a half-time feel. Tempo is the quickest clue: house around 120–128 BPM, trance 128–140, hardstyle 150–160, drum & bass 160–180.

## Clubs, raves and festivals: what is the difference?

EDM is heard in three kinds of places, and each feels different:

- **Club nights:** a room for a few hundred people, usually from late evening into the early morning, with one or two DJs playing long sets. This is where techno, house and drum & bass live week to week.
- **Raves:** parties in warehouses, open fields or other places that are not regular clubs, often all night long and built around one scene or one sound.
- **Festivals:** one to several days, many stages and dozens of artists, from local DJs to headliners. Each stage often has its own style, so a festival is a good way to hear several genres in one weekend.

Besides these, daytime events such as coffee raves, sunset sessions and day parties play electronic music in a gentler setting, a good first step for newcomers.

## Your first EDM night

- **Pick the night by its line-up and its styles,** not only by the venue: the styles on an event page tell you what you will hear.
- **Buy tickets from the official seller.** The ticket buttons on FeestFinder take you to the organiser's seller.
- **Check the age limit and the door time** before you go; many club nights are 18+.
- **Protect your hearing.** Earplugs made for music lower the volume without muffling the sound, and short breaks away from the speakers help too.
- **Arrive early** if you can: the warm-up DJs set the mood of the night, and their opening sets are where many future headliners first get noticed.
- **Drink water, plan the way home** and stay with your friends.

## Reading an event page on FeestFinder

Every night on FeestFinder answers the same questions in the same order: when, where, how much and from what age, then the line-up and the styles.

- **Styles** are the first clue to the sound: a night tagged techno or hard techno will feel very different from one tagged house or trance.
- **Price** is the lowest ticket the seller lists ("from"). When a source gives no price, the page says the price is unknown rather than calling the night free.
- **Posted or found:** a night an organiser or the community posted says so; a night Feest Radar found on a club's site or a ticket site carries the Radar mark, and its ticket button goes to the page where it was found.
- **Save it** with the heart to find it again under Saved, or set an alert for a style or an artist to be told when a new night comes up in your city.

When the line-up names artists with a profile, their pages let you listen to their mixes before you buy a ticket.

## EDM in Asia

Asia has one of the liveliest electronic music communities in the world: Goa in India is where Goa trance was born, Tokyo has a long-standing techno and house club culture, Bangkok and Bali are meeting points for open-air festivals, and Ho Chi Minh City and Hanoi have growing underground clubs and raves. Many international DJs put Asia on their yearly tour calendars, and Asian artists are making their own mark.

## Where to hear EDM in Asia

FeestFinder lists electronic club nights, raves and festivals in Ho Chi Minh City, Hanoi, Da Nang, Nha Trang, Bangkok, Tokyo, Singapore and Bali. See [every upcoming event](/?lang=en) or filter by the genre you love.`,
  },
  faq: [
    { q: { vi: 'EDM là gì?', en: 'What is EDM?' }, a: { vi: 'EDM (Electronic Dance Music) là tên gọi chung cho nhạc điện tử viết để nhảy, gồm techno, house, trance, dubstep, drum & bass, hardstyle và nhiều dòng khác.', en: 'EDM (electronic dance music) is the umbrella name for electronic music made for dancing, including techno, house, trance, dubstep, drum & bass, hardstyle and more.' } },
    { q: { vi: 'EDM có bao nhiêu thể loại?', en: 'How many EDM genres are there?' }, a: { vi: 'Có hàng chục dòng và hàng trăm nhánh nhỏ. Chín dòng chính trong bài này là techno, trance, psytrance, hardstyle, dubstep, drum & bass, bass house, mainstage và bounce.', en: 'There are dozens of genres and hundreds of sub-genres. The nine main ones in this guide are techno, trance, psytrance, hardstyle, dubstep, drum & bass, bass house, mainstage and bounce.' } },
    { q: { vi: 'EDM và nhạc house khác nhau thế nào?', en: 'What is the difference between EDM and house?' }, a: { vi: 'House là một dòng nhạc cụ thể ra đời ở Chicago; EDM là tên gọi chung bao gồm cả house lẫn các dòng khác.', en: 'House is a specific genre born in Chicago; EDM is the umbrella name that includes house and every other dance genre.' } },
    { q: { vi: 'Người mới nên nghe dòng EDM nào?', en: 'Which EDM genre should a beginner start with?' }, a: { vi: 'Melodic techno, vocal trance, liquid drum & bass và mainstage là những cửa ngõ dễ nghe nhất nhờ giai điệu rõ ràng.', en: 'Melodic techno, vocal trance, liquid drum & bass and mainstage are the easiest doors in, thanks to clear melodies.' } },
    { q: { vi: 'BPM là gì?', en: 'What is BPM?' }, a: { vi: 'BPM (beats per minute) là số phách mỗi phút, cho biết tốc độ bản nhạc. Mỗi dòng EDM có khoảng BPM đặc trưng, ví dụ house khoảng 125, drum & bass khoảng 174.', en: 'BPM (beats per minute) measures a track’s tempo. Each EDM genre has a typical range, for example house around 125 and drum & bass around 174.' } },
  ],
  sources: [
    { title: 'Electronic dance music', url: wiki('Electronic dance music'), publisher: 'Wikipedia' },
    { title: 'Nhạc dance điện tử', url: 'https://vi.wikipedia.org/wiki/Nh%E1%BA%A1c_dance_%C4%91i%E1%BB%87n_t%E1%BB%AD', publisher: 'Wikipedia tiếng Việt' },
    { title: 'Techno', url: wiki('Techno'), publisher: 'Wikipedia' },
    { title: 'Trance music', url: wiki('Trance music'), publisher: 'Wikipedia' },
    { title: 'Electronic dance music', url: 'https://www.britannica.com/art/electronic-dance-music', publisher: 'Encyclopaedia Britannica' },
    { title: 'Electronic dance music (definition)', url: 'https://www.merriam-webster.com/dictionary/electronic%20dance%20music', publisher: 'Merriam-Webster' },
  ],
  tracks: [],
};
