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
    vi: 'EDM (Electronic Dance Music) là nhạc điện tử viết để nhảy, từ techno, house, trance tới dubstep, drum & bass, hardstyle. Bản đồ 9 dòng chính với BPM, cảm giác và cách chọn dòng hợp với bạn.',
    en: 'EDM (electronic dance music) is electronic music made for dancing, from techno, house and trance to dubstep, drum & bass and hardstyle. A map of nine main genres with BPM, feel and where to start.',
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
  ],
  tracks: [],
};
