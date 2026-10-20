import type { PackPost } from '../../../services/blog-content.ts';
import { figure, guide, MEDIA, nights, wiki } from './media.ts';

const [cover, artist] = MEDIA['bass-house'];
const fig = (lang: 'vi' | 'en') => figure(artist,
  { vi: 'Malaa biểu diễn tại Rock in Evreux 2023', en: 'Malaa performing at Rock in Evreux 2023' },
  { vi: 'Malaa, nghệ sĩ bass house người Pháp luôn đeo mặt nạ, tại Rock in Evreux 2023', en: 'Malaa, the masked French bass house artist, at Rock in Evreux 2023' }, lang);

export const bassHouse: PackPost = {
  key: 'edm-genres/bass-house',
  slug: 'bass-house',
  category: 'styles',
  lang: 'vi',
  title: {
    vi: 'Bass House là gì? BPM, nguồn gốc UK bassline và sub-genre',
    en: 'What is bass house? BPM, UK bassline roots and sub-genres',
  },
  excerpt: {
    vi: 'Bass House là house hiện đại giữa thập niên 2010: kick 4/4, bassline gầm gừ kiểu UK bass và dubstep, 124–128 BPM. Nguồn gốc, đặc trưng, sub-genre, 5 nghệ sĩ và 5 track nên nghe.',
    en: 'Bass house is mid-2010s house music: a 4/4 kick under growling UK bass and dubstep-style basslines at 124–128 BPM. Roots, sound, sub-genres, five artists and five tracks.',
  },
  cover: { url: cover.url, credit: `[${cover.author}](${cover.page}) · ${cover.license} · Wikimedia Commons` },
  styles: ['bass-house', 'uk-garage', 'house', 'tech-house'],
  facts: [
    { label: { vi: 'BPM', en: 'BPM' }, value: { vi: '124–128', en: '124–128' } },
    { label: { vi: 'Nguồn gốc', en: 'Origin' }, value: { vi: 'Anh (bassline, speed garage) và Mỹ · giữa thập niên 2010', en: 'UK (bassline, speed garage) and USA · mid-2010s' } },
    { label: { vi: 'Nhịp', en: 'Rhythm' }, value: { vi: 'Kick 4/4, hi-hat swing kiểu UK garage', en: '4/4 kick, UK garage-style swung hats' } },
    { label: { vi: 'Âm thanh', en: 'Sound' }, value: { vi: 'Bassline sound design kỹ, vocal chop, drop ngắn', en: 'Heavily designed basslines, vocal chops, punchy drops' } },
    { label: { vi: 'Nghệ sĩ tiêu biểu', en: 'Key artists' }, value: { vi: 'Jauz, Malaa, JOYRYDE, AC Slater, Habstrakt', en: 'Jauz, Malaa, JOYRYDE, AC Slater, Habstrakt' } },
    { label: { vi: 'Dòng nhạc gần', en: 'Related' }, value: { vi: 'Tech House, UK Garage, Dubstep, Future House', en: 'Tech House, UK Garage, Dubstep, Future House' } },
  ],
  body: {
    vi: `**Bass House** là dòng house hiện đại phổ biến từ giữa thập niên 2010, kết hợp kick 4/4 của house với bassline "gầm gừ" kiểu UK bass, garage và dubstep. Bass House thường ở 124–128 BPM, với drop ngắn gọn, bass được sound design kỹ, vocal chop và nhịp swing.

## Bass House nghe như thế nào?

- **Kick & drums:** kick 4/4 chắc, hi-hat và percussion swing học từ UK garage và 2-step.
- **Bass:** nhân vật chính. Bassline thay hình đổi dạng liên tục, từ "wub" kiểu dubstep tới reese và bass bị distort, thường đổi âm sắc ở mỗi ô nhịp.
- **Melody & harmony:** tối giản. Vocal chop, sample hip-hop hoặc một hook ngắn thay cho giai điệu dài.
- **Arrangement:** build-up ngắn, drop "đập" thẳng vào bass; nhiều bản có drop thứ hai đổi bass hoàn toàn.
- **Mix & master:** low-end và dải trung của bass rất to, kick được sidechain để bass "thở" theo nhịp.

## Nguồn gốc: từ UK bassline tới Night Bass

Gốc của bass house nằm ở **speed garage** và **bassline** của Anh thập niên 1990 và 2000, đặc biệt ở các club miền Bắc nước Anh như Sheffield và Birmingham. Giữa thập niên 2010, âm thanh này bùng nổ ở Mỹ: AC Slater mở đêm **Night Bass** ở Hollywood năm 2014, sau đó thành label; "Feel the Volume" của Jauz trên label Mad Decent được xem là bản mở đường cho bass house tới khán giả đại chúng. OWSLA, UKF và các nghệ sĩ như JOYRYDE, Malaa đẩy âm thanh này lên các lễ hội.

Malaa và Tchami (label Confession) còn gắn với **G-house**, nhánh house tối giản dùng vocal hip-hop. Từ đó bass house trở thành một phần quen thuộc của các set house lễ hội, giao thoa với tech house và future house.

${fig('vi')}

## 5 nghệ sĩ bass house nên nghe

| Nghệ sĩ | Quốc gia | Vì sao nên nghe | Hồ sơ |
| --- | --- | --- | --- |
| Jauz | Mỹ | "Feel the Volume" đưa bass house lên sân khấu lớn. | [Wikipedia](${wiki('Jauz')}) |
| Malaa | Pháp | Nghệ sĩ đeo mặt nạ, bassline tối giản và G-house. | [Wikipedia](${wiki('Malaa')}) |
| JOYRYDE | Anh | Bass nặng, năng lượng kiểu hip-hop. | [Wikipedia](${wiki('Joyryde')}) |
| AC Slater | Mỹ | Người lập Night Bass, cầu nối UK bassline và Mỹ. | [YouTube](https://www.youtube.com/channel/UCAzvQYecfOEeHOWFVzPSCOQ) |
| Habstrakt | Pháp | Sound design bass sắc nét của thế hệ mới. | [YouTube](https://www.youtube.com/@HabstraktOfficial) |

## Các sub-genre của bass house

| Sub-genre | Điểm khác | BPM | Nghe thử |
| --- | --- | --- | --- |
| Classic Bass House | Bassline kiểu UK, đậm chất club | 125–128 | AC Slater |
| G-House | Tối giản, vocal hip-hop | 124–126 | Malaa |
| UK Bass / Garage-influenced | Nhịp swing 2-step, bass UK | 128–132 | Dòng UK bass |
| Tech Bass House | Groove tech house cộng bass nặng | 125–128 | Dòng tech bass |
| Juke / Footwork-influenced | Vocal chop dồn, nhịp gãy | 125–130 | Thử nghiệm của thế hệ mới |
| Deep Bass House | Không khí deep, bass trầm ấm | 122–125 | Dòng deep bass |
| Future Bass crossover | Chord sáng, bass có giai điệu | 125–128 | Giao thoa future bass |

## Bass House khác Tech House thế nào?

| Tiêu chí | Bass House | Tech House |
| --- | --- | --- |
| BPM | 124–128 | 124–128 |
| Bass | Gầm gừ, sound design nặng, đổi liên tục | Ngắn, nảy, groove |
| Cảm giác | Năng lượng, "đập" | Nhún nhảy, cuốn |
| Gốc | UK bassline, dubstep | Techno và house |

## Cách nhận biết bass house khi nghe

1. **Nghe kick:** 4/4 đều như house, không half-time.
2. **Nghe drop:** bass chiếm toàn bộ, "gầm" và đổi âm sắc liên tục.
3. **Nghe vocal:** chop ngắn hoặc sample hip-hop, ít giai điệu hát.
4. **So với tech house:** tech house groove nhẹ hơn, bass house nặng và ồn hơn.

## Nghe bass house ở đâu tại châu Á?

Bass house xuất hiện thường xuyên trong các đêm house và EDM ở TP.HCM, Hà Nội, Bangkok và Singapore. Xem [lịch bass house sắp tới trên FeestFinder](${nights('bass-house', 'vi')}).

## Đọc tiếp

- [Dubstep là gì?](${guide('dubstep', 'vi')}) Nơi bass "wub" ra đời.
- [Mainstage EDM là gì?](${guide('mainstage-edm', 'vi')}) Âm thanh của sân khấu chính.
- [Techno là gì?](${guide('techno', 'vi')}) Tech house nằm giữa techno và house.`,
    en: `**Bass house** is modern house music that took off in the mid-2010s, pairing house's 4/4 kick with the growling basslines of UK bass, garage and dubstep. It usually runs at 124–128 BPM, with punchy drops, heavily designed bass, vocal chops and swing.

## What does bass house sound like?

- **Kick & drums:** a solid 4/4 kick, with hi-hats and percussion swung like UK garage and 2-step.
- **Bass:** the star. The bassline keeps changing shape, from dubstep-style "wubs" to reese and distorted bass, often switching timbre every bar.
- **Melody & harmony:** minimal. Vocal chops, hip-hop samples or a short hook instead of long melodies.
- **Arrangement:** a short build-up, a drop that hits straight into the bass; many tracks have a second drop with a completely different bass.
- **Mix & master:** a loud low end and bass mids, with sidechain so the bass "breathes" with the kick.

## Origins: from UK bassline to Night Bass

Bass house is rooted in the **speed garage** and **bassline** of 1990s and 2000s Britain, especially in northern English clubs in Sheffield and Birmingham. In the mid-2010s the sound exploded in the US: AC Slater started the **Night Bass** party in Hollywood in 2014, which became a label, and Jauz's "Feel the Volume" on Mad Decent is widely seen as the record that brought bass house to a mainstream dance crowd. OWSLA, UKF and artists such as JOYRYDE and Malaa took it to the festivals.

Malaa and Tchami's Confession label are also tied to **G-house**, a minimal branch of house with hip-hop vocals. Bass house has since become a familiar part of festival house sets, crossing over with tech house and future house.

${fig('en')}

## 5 bass house artists to know

| Artist | Country | Why listen | Profile |
| --- | --- | --- | --- |
| Jauz | USA | "Feel the Volume" took bass house to the big stages. | [Wikipedia](${wiki('Jauz')}) |
| Malaa | France | The masked artist of minimal basslines and G-house. | [Wikipedia](${wiki('Malaa')}) |
| JOYRYDE | UK | Heavy bass with hip-hop energy. | [Wikipedia](${wiki('Joyryde')}) |
| AC Slater | USA | Founder of Night Bass, a bridge between UK bassline and the US. | [YouTube](https://www.youtube.com/channel/UCAzvQYecfOEeHOWFVzPSCOQ) |
| Habstrakt | France | The sharp bass sound design of a new generation. | [YouTube](https://www.youtube.com/@HabstraktOfficial) |

## Bass house sub-genres

| Sub-genre | What sets it apart | BPM | Listen to |
| --- | --- | --- | --- |
| Classic Bass House | UK-style basslines, club-heavy | 125–128 | AC Slater |
| G-House | Minimal, hip-hop vocals | 124–126 | Malaa |
| UK Bass / Garage-influenced | 2-step swing, UK bass | 128–132 | The UK bass scene |
| Tech Bass House | Tech house groove plus heavy bass | 125–128 | The tech bass scene |
| Juke / Footwork-influenced | Rapid vocal chops, broken rhythms | 125–130 | New-generation experiments |
| Deep Bass House | Deep mood, warm low bass | 122–125 | The deep bass scene |
| Future Bass crossover | Bright chords, melodic bass | 125–128 | Future bass crossovers |

## Bass house vs tech house

| | Bass House | Tech House |
| --- | --- | --- |
| BPM | 124–128 | 124–128 |
| Bass | Growling, heavily designed, ever-changing | Short, bouncy, groovy |
| Feel | High-energy, hard-hitting | Bouncy, rolling |
| Roots | UK bassline, dubstep | Techno and house |

## How to recognise bass house

1. **Listen to the kick:** a steady 4/4 like house, never half-time.
2. **Listen to the drop:** the bass takes over, growling and changing timbre.
3. **Listen to the vocals:** short chops or hip-hop samples, little sung melody.
4. **Compare with tech house:** tech house grooves more lightly, bass house is heavier and louder.

## Where to hear bass house in Asia

Bass house turns up in house and EDM nights across Ho Chi Minh City, Hanoi, Bangkok and Singapore. See [upcoming bass house nights on FeestFinder](${nights('bass-house', 'en')}).

## Read next

- [What is dubstep?](${guide('dubstep', 'en')}) Where the "wub" was born.
- [What is mainstage EDM?](${guide('mainstage-edm', 'en')}) The sound of the main stage.
- [What is techno?](${guide('techno', 'en')}) Tech house sits between techno and house.`,
  },
  faq: [
    { q: { vi: 'Bass House là gì?', en: 'What is bass house?' }, a: { vi: 'Bass House là dòng house hiện đại (giữa thập niên 2010) kết hợp kick 4/4 với bassline gầm gừ kiểu UK bass và dubstep, thường ở 124–128 BPM.', en: 'Bass house is modern house music (mid-2010s) that pairs a 4/4 kick with growling UK bass and dubstep-style basslines, usually at 124–128 BPM.' } },
    { q: { vi: 'Bass House bao nhiêu BPM?', en: 'What BPM is bass house?' }, a: { vi: 'Thường 124–128 BPM, giống house và tech house.', en: 'Usually 124–128 BPM, like house and tech house.' } },
    { q: { vi: 'Bass House khác Tech House thế nào?', en: 'How is bass house different from tech house?' }, a: { vi: 'Cùng tempo, nhưng bass house dùng bassline nặng, sound design kỹ và drop "đập"; tech house groove nhẹ, bass ngắn và nảy.', en: 'Same tempo, but bass house uses heavy, intricately designed basslines and hard-hitting drops; tech house grooves lightly with short, bouncy bass.' } },
    { q: { vi: 'G-house là gì?', en: 'What is G-house?' }, a: { vi: 'G-house là nhánh house tối giản dùng vocal và sample hip-hop, gắn với Malaa và label Confession của Tchami.', en: 'G-house is a minimal branch of house built on hip-hop vocals and samples, tied to Malaa and Tchami’s Confession label.' } },
    { q: { vi: 'Nghệ sĩ bass house tiêu biểu là ai?', en: 'Who are the key bass house artists?' }, a: { vi: 'Jauz, Malaa, JOYRYDE, AC Slater, Habstrakt; ở Anh có Chris Lorenzo, người đến từ dòng bassline Birmingham.', en: 'Jauz, Malaa, JOYRYDE, AC Slater, Habstrakt; in the UK, Chris Lorenzo, who came out of the Birmingham bassline scene.' } },
  ],
  sources: [
    { title: 'Bass house', url: wiki('Bass house'), publisher: 'Wikipedia' },
    { title: 'How AC Slater created his own movement', url: 'https://ukf.com/read/how-ac-slater-created-his-own-movement/', publisher: 'UKF' },
    { title: 'Bassline (music genre)', url: wiki('Bassline (music genre)'), publisher: 'Wikipedia' },
    { title: 'G-house', url: wiki('G-house'), publisher: 'Wikipedia' },
    { title: 'Tech house', url: wiki('Tech house'), publisher: 'Wikipedia' },
  ],
  tracks: [
    { youtube: 'mub2x7cP0Ng', artist: 'Jauz', title: 'Feel The Volume', channel: 'JAUZ', note: { vi: 'Bản mở đường cho bass house tới khán giả đại chúng.', en: 'The record that opened bass house to a mainstream crowd.' } },
    { youtube: 'YDHguiBuFsA', artist: 'Malaa', title: 'Notorious', year: 2016, channel: 'Malaa - Topic', note: { vi: 'Bassline tối giản, cuốn: chuẩn mực của Malaa.', en: 'A minimal, addictive bassline: classic Malaa.' } },
    { youtube: '8bCkadgRskA', artist: 'JOYRYDE', title: 'HOT DRUM', channel: 'OWSLA', note: { vi: 'Bass nặng và năng lượng hip-hop trên label OWSLA.', en: 'Heavy bass and hip-hop energy on OWSLA.' } },
    { youtube: '6XJkPtxqWM8', artist: 'AC Slater', title: 'Bass Inside', channel: 'OWSLA', note: { vi: 'Tinh thần Night Bass: house cho người mê bass.', en: 'The Night Bass spirit: house for bass lovers.' } },
    { youtube: 'QSQlrvTzw_A', artist: 'Habstrakt & Simona Shao', title: 'Mine', channel: 'Monstercat Uncaged', note: { vi: 'Bass house hiện đại, sound design sắc nét.', en: 'Modern bass house with sharp sound design.' } },
  ],
};
