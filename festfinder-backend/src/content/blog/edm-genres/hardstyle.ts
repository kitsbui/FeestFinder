import type { PackPost } from '../../../services/blog-content.ts';
import { figure, guide, MEDIA, nights, wiki } from './media.ts';

const [cover, artist] = MEDIA.hardstyle;
const fig = (lang: 'vi' | 'en') => figure(artist,
  { vi: 'Headhunterz biểu diễn tại Airbeat One 2017', en: 'Headhunterz performing at Airbeat One 2017' },
  { vi: 'Headhunterz, gương mặt của euphoric hardstyle, tại Airbeat One 2017 (Đức)', en: 'Headhunterz, the face of euphoric hardstyle, at Airbeat One 2017 in Germany' }, lang);

export const hardstyle: PackPost = {
  key: 'edm-genres/hardstyle',
  slug: 'hardstyle',
  category: 'styles',
  lang: 'vi',
  title: {
    vi: 'Hardstyle là gì? BPM, nguồn gốc Hà Lan và các sub-genre',
    en: 'What is hardstyle? BPM, Dutch roots and sub-genres',
  },
  excerpt: {
    vi: 'Hardstyle là hard dance ra đời ở Hà Lan cuối thập niên 1990: kick distorted, reverse bass, giai điệu euphoric hoặc raw, 150–160 BPM. Lịch sử, sub-genre, 5 nghệ sĩ và 5 track nên nghe.',
    en: 'Hardstyle is hard dance born in the Netherlands in the late 1990s: distorted kicks, reverse bass, euphoric or raw melodies, 150–160 BPM. History, sub-genres, five artists, five tracks.',
  },
  cover: { url: cover.url, credit: `[${cover.author}](${cover.page}) · ${cover.license} · Wikimedia Commons` },
  styles: ['hardstyle', 'rawstyle', 'hardcore', 'gabber', 'hard-dance'],
  facts: [
    { label: { vi: 'BPM', en: 'BPM' }, value: { vi: '150–160 (thời đầu 140–150)', en: '150–160 (early years 140–150)' } },
    { label: { vi: 'Nguồn gốc', en: 'Origin' }, value: { vi: 'Hà Lan, Bỉ, Ý · cuối thập niên 1990', en: 'Netherlands, Belgium, Italy · late 1990s' } },
    { label: { vi: 'Nhịp', en: 'Rhythm' }, value: { vi: 'Kick 4/4 distorted, reverse bass off-beat', en: 'Distorted 4/4 kick, off-beat reverse bass' } },
    { label: { vi: 'Âm thanh', en: 'Sound' }, value: { vi: 'Kick "đấm" có pitch, screech, lead euphoric', en: 'Pitched punchy kicks, screeches, euphoric leads' } },
    { label: { vi: 'Nghệ sĩ tiêu biểu', en: 'Key artists' }, value: { vi: 'Headhunterz, Brennan Heart, Da Tweekaz, Ran-D', en: 'Headhunterz, Brennan Heart, Da Tweekaz, Ran-D' } },
    { label: { vi: 'Dòng nhạc gần', en: 'Related' }, value: { vi: 'Hard Trance, Hardcore, Gabber, Frenchcore', en: 'Hard Trance, Hardcore, Gabber, Frenchcore' } },
  ],
  body: {
    vi: `**Hardstyle** là dòng hard dance ra đời ở Hà Lan, Bỉ và Ý cuối thập niên 1990, nổi tiếng với kick distorted "đấm" mạnh, reverse bass và giai điệu euphoric hoặc raw. Hardstyle hiện đại thường ở 150–160 BPM và được viết cho những sân khấu khổng lồ như Defqon.1 hay Qlimax.

## Hardstyle nghe như thế nào?

- **Kick:** nhân vật chính. Kick được distort, có pitch và đuôi dài, đôi khi mang cả giai điệu (tone kick).
- **Bass:** reverse bass off-beat là dấu ấn của giai đoạn đầu; hardstyle hiện đại để kick tự gánh phần bass.
- **Melody & harmony:** euphoric hardstyle dùng lead supersaw và vocal như trance; rawstyle thay bằng screech, giọng MC và âm thanh tối.
- **Arrangement:** intro, breakdown giàu giai điệu, climax với kick và lead, rồi "anti-climax" gắt hơn ở các bản raw.
- **Mix & master:** cực kỳ to và dày, low-end dành trọn cho kick.

## Lịch sử: từ hard trance tới Defqon.1

Hardstyle lớn lên từ hard trance, hardcore và gabber. Khoảng 1999–2000, DJ Hà Lan bắt đầu thử kick distorted và synth lặp ở tốc độ chậm hơn hardcore. Sự kiện đầu tiên được ghi nhận là hardstyle là **Qlubtempo** của Q-dance năm 2000 ở Zaandam. Các label như Scantraxx (do DJ The Prophet sáng lập) và Fusion định hình âm thanh những năm đầu với reverse bass đặc trưng.

Từ giữa thập niên 2000, hardstyle tăng tốc lên quanh 150 BPM và tách thành hai hướng: **euphoric** giàu giai điệu (Headhunterz, Brennan Heart) và **rawstyle** tối, gắt. Các lễ hội như Defqon.1, Qlimax và Hard Bass đưa hardstyle đi khắp châu Âu, Úc, Mỹ và châu Á.

${fig('vi')}

## 5 nghệ sĩ hardstyle nên nghe

| Nghệ sĩ | Quốc gia | Vì sao nên nghe | Hồ sơ |
| --- | --- | --- | --- |
| Headhunterz | Hà Lan | Biểu tượng euphoric hardstyle, "Dragonborn" là bản quốc ca. | [Wikipedia](${wiki('Headhunterz')}) |
| Brennan Heart | Hà Lan | Giai điệu và vocal giàu cảm xúc, label I AM HARDSTYLE. | [Wikipedia](${wiki('Brennan Heart')}) |
| Da Tweekaz | Na Uy | Hardstyle vui nhộn, nhiều hook dễ nhớ. | [YouTube](https://www.youtube.com/channel/UCMg5kDwotqWmQYfhEIbN-kA) |
| Ran-D | Hà Lan | Cầu nối giữa raw và euphoric. | [Wikipedia](${wiki('Ran-D')}) |
| Sub Zero Project | Hà Lan | Sound design hiện đại, kick nặng, chất điện ảnh. | [Wikipedia](${wiki('Sub Zero Project')}) |

## Các sub-genre và dòng gần hardstyle

| Sub-genre | Điểm khác | BPM | Nghe thử |
| --- | --- | --- | --- |
| Euphoric Hardstyle | Giai điệu, vocal, breakdown như trance | 150–155 | Headhunterz |
| Rawstyle | Kick gắt, screech, không khí tối | 150–158 | Ran-D (giai đoạn raw) |
| Extra Raw | Raw hơn nữa, kick dày đặc | 155–160 | Thế hệ raw mới |
| Reverse Bass | Hardstyle thời đầu, bass off-beat đảo ngược | 140–150 | Scantraxx đầu thập niên 2000 |
| Hardcore | Nhanh và nặng hơn hẳn | 160–200 | Dòng hardcore Hà Lan |
| Gabber | Hardcore Rotterdam thập niên 1990 | 160–190 | Gabber Rotterdam |
| Frenchcore | Kick dồn dập kiểu Pháp, rất nhanh | 180–200+ | Dòng frenchcore |
| Uptempo Hardcore | Nhanh nhất, kick liên tục | 190–220+ | Thế hệ uptempo |

## Hardstyle khác hardcore thế nào?

| Tiêu chí | Hardstyle | Hardcore |
| --- | --- | --- |
| BPM | 150–160 | 160–200 trở lên |
| Kick | Có pitch, đuôi dài | Ngắn, dồn, distort mạnh |
| Giai điệu | Euphoric hoặc raw, nhiều vocal | Ít giai điệu, gắt hơn |
| Nguồn gốc | Hard trance, cuối thập niên 1990 | Gabber Rotterdam, đầu thập niên 1990 |

## Cách nhận biết hardstyle khi nghe

1. **Nghe kick:** distort, có "giọng" và đuôi kéo dài, như một nhạc cụ riêng.
2. **Đếm nhịp:** khoảng 150 BPM, nhanh hơn trance nhưng chậm hơn hardcore.
3. **Nghe breakdown:** euphoric có giai điệu lớn, raw có screech và vocal MC.
4. **So với hardcore:** hardstyle chậm và giàu giai điệu hơn.

## Nghe hardstyle ở đâu tại châu Á?

Hardstyle có cộng đồng mạnh ở Thái Lan, Nhật Bản, Úc và ngày càng lớn ở Việt Nam. Xem [lịch hardstyle sắp tới trên FeestFinder](${nights('hardstyle', 'vi')}).

## Đọc tiếp

- [Trance là gì?](${guide('trance', 'vi')}) Hard trance là tổ tiên của hardstyle.
- [Techno là gì?](${guide('techno', 'vi')}) Hard techno và schranz.
- [Bounce là gì?](${guide('bounce', 'vi')}) Hard bounce mượn kick từ hardstyle.`,
    en: `**Hardstyle** is hard dance born in the Netherlands, Belgium and Italy in the late 1990s, famous for its punchy distorted kick, reverse bass and euphoric or raw melodies. Modern hardstyle usually runs at 150–160 BPM and is made for huge stages such as Defqon.1 and Qlimax.

## What does hardstyle sound like?

- **Kick:** the star. Distorted and pitched with a long tail, sometimes carrying a melody of its own (tone kicks).
- **Bass:** the off-beat reverse bass marked the early years; modern hardstyle lets the kick carry the low end.
- **Melody & harmony:** euphoric hardstyle uses supersaw leads and vocals like trance; rawstyle swaps them for screeches, MC vocals and darker sounds.
- **Arrangement:** intro, a melodic breakdown, a climax of kick and lead, then a harder "anti-climax" in raw tracks.
- **Mix & master:** extremely loud and dense, with the low end given entirely to the kick.

## History: from hard trance to Defqon.1

Hardstyle grew out of hard trance, hardcore and gabber. Around 1999–2000 Dutch DJs began experimenting with distorted kicks and looped synths at tempos slower than hardcore. The first event credited as hardstyle was Q-dance's **Qlubtempo** in 2000 in Zaandam. Labels such as Scantraxx (founded by DJ The Prophet) and Fusion shaped the early sound and its signature reverse bass.

From the mid-2000s hardstyle sped up to around 150 BPM and split into two directions: melodic **euphoric** hardstyle (Headhunterz, Brennan Heart) and dark, harsh **rawstyle**. Festivals such as Defqon.1, Qlimax and Hard Bass took it across Europe, Australia, the Americas and Asia.

${fig('en')}

## 5 hardstyle artists to know

| Artist | Country | Why listen | Profile |
| --- | --- | --- | --- |
| Headhunterz | Netherlands | The icon of euphoric hardstyle; "Dragonborn" is an anthem. | [Wikipedia](${wiki('Headhunterz')}) |
| Brennan Heart | Netherlands | Emotional melodies and vocals, the I AM HARDSTYLE label. | [Wikipedia](${wiki('Brennan Heart')}) |
| Da Tweekaz | Norway | Playful hardstyle full of catchy hooks. | [YouTube](https://www.youtube.com/channel/UCMg5kDwotqWmQYfhEIbN-kA) |
| Ran-D | Netherlands | A bridge between raw and euphoric. | [Wikipedia](${wiki('Ran-D')}) |
| Sub Zero Project | Netherlands | Modern sound design, heavy kicks, a cinematic feel. | [Wikipedia](${wiki('Sub Zero Project')}) |

## Hardstyle sub-genres and neighbours

| Sub-genre | What sets it apart | BPM | Listen to |
| --- | --- | --- | --- |
| Euphoric Hardstyle | Melodies, vocals, trance-like breakdowns | 150–155 | Headhunterz |
| Rawstyle | Harsh kicks, screeches, dark mood | 150–158 | Ran-D (raw era) |
| Extra Raw | Rawer still, dense kicks | 155–160 | The new raw generation |
| Reverse Bass | Early hardstyle's inverted off-beat bass | 140–150 | Early-2000s Scantraxx |
| Hardcore | Much faster and heavier | 160–200 | Dutch hardcore |
| Gabber | 1990s Rotterdam hardcore | 160–190 | Rotterdam gabber |
| Frenchcore | Pounding French-style kicks, very fast | 180–200+ | The frenchcore scene |
| Uptempo Hardcore | The fastest, relentless kicks | 190–220+ | The uptempo generation |

## Hardstyle vs hardcore

| | Hardstyle | Hardcore |
| --- | --- | --- |
| BPM | 150–160 | 160–200 and up |
| Kick | Pitched, long tail | Short, pounding, heavily distorted |
| Melody | Euphoric or raw, many vocals | Less melody, harsher |
| Origin | Hard trance, late 1990s | Rotterdam gabber, early 1990s |

## How to recognise hardstyle

1. **Listen to the kick:** distorted, with a "voice" and a long tail, like an instrument of its own.
2. **Count the tempo:** about 150 BPM, faster than trance and slower than hardcore.
3. **Listen to the breakdown:** euphoric tracks bring big melodies, raw tracks screeches and MC vocals.
4. **Compare with hardcore:** hardstyle is slower and more melodic.

## Where to hear hardstyle in Asia

Hardstyle has strong communities in Thailand, Japan and Australia, and a growing one in Vietnam. See [upcoming hardstyle nights on FeestFinder](${nights('hardstyle', 'en')}).

## Read next

- [What is trance?](${guide('trance', 'en')}) Hard trance is hardstyle's ancestor.
- [What is techno?](${guide('techno', 'en')}) Hard techno and schranz.
- [What is bounce?](${guide('bounce', 'en')}) Hard bounce borrows hardstyle's kick.`,
  },
  faq: [
    { q: { vi: 'Hardstyle là gì?', en: 'What is hardstyle?' }, a: { vi: 'Hardstyle là dòng hard dance ra đời ở Hà Lan cuối thập niên 1990, với kick distorted có pitch, reverse bass và giai điệu euphoric hoặc raw, thường ở 150–160 BPM.', en: 'Hardstyle is hard dance born in the Netherlands in the late 1990s, with pitched distorted kicks, reverse bass and euphoric or raw melodies, usually at 150–160 BPM.' } },
    { q: { vi: 'Hardstyle bao nhiêu BPM?', en: 'What BPM is hardstyle?' }, a: { vi: 'Hardstyle hiện đại thường 150–160 BPM; những năm đầu chậm hơn, khoảng 140–150 BPM.', en: 'Modern hardstyle usually runs 150–160 BPM; the early years were slower, around 140–150 BPM.' } },
    { q: { vi: 'Euphoric hardstyle và rawstyle khác nhau thế nào?', en: 'What is the difference between euphoric hardstyle and rawstyle?' }, a: { vi: 'Euphoric dùng giai điệu, vocal và breakdown giàu cảm xúc như trance; rawstyle tối và gắt hơn, với screech, kick nặng và vocal MC.', en: 'Euphoric uses melodies, vocals and emotional, trance-like breakdowns; rawstyle is darker and harsher, with screeches, heavy kicks and MC vocals.' } },
    { q: { vi: 'Người mới nên nghe hardstyle thế nào?', en: 'Where should a beginner start with hardstyle?' }, a: { vi: 'Bắt đầu với euphoric hardstyle như Headhunterz, Brennan Heart hay Da Tweekaz, rồi thử rawstyle khi đã quen với kick.', en: 'Start with euphoric hardstyle such as Headhunterz, Brennan Heart or Da Tweekaz, then try rawstyle once the kick feels familiar.' } },
    { q: { vi: 'Lễ hội hardstyle nổi tiếng nhất là gì?', en: 'What is the best-known hardstyle festival?' }, a: { vi: 'Defqon.1 của Q-dance ở Hà Lan là lễ hội hardstyle lớn nhất thế giới; Qlimax là sự kiện trong nhà nổi tiếng nhất.', en: 'Q-dance’s Defqon.1 in the Netherlands is the world’s biggest hardstyle festival; Qlimax is the best-known indoor event.' } },
  ],
  sources: [
    { title: 'Hardstyle', url: wiki('Hardstyle'), publisher: 'Wikipedia' },
    { title: 'Q-dance', url: wiki('Q-dance'), publisher: 'Wikipedia' },
    { title: "A Stage Hopper's guide to the history of hardstyle", url: 'https://stagehoppers.com/a-stage-hoppers-guide-to-the-history-of-hardstyle/', publisher: 'Stage Hoppers' },
    { title: 'The Prophet', url: 'https://www.scantraxx.com/artists/the-prophet', publisher: 'Scantraxx' },
    { title: 'Rawstyle', url: wiki('Rawstyle'), publisher: 'Wikipedia' },
  ],
  tracks: [
    { youtube: 'VaiHTvifGt0', artist: 'Headhunterz', title: 'Dragonborn', year: 2012, channel: 'Headhunterz', note: { vi: 'Bản quốc ca euphoric hardstyle lấy cảm hứng từ Skyrim.', en: 'The Skyrim-inspired euphoric hardstyle anthem.' } },
    { youtube: 'h9I-9Sj4sKs', artist: 'Brennan Heart & Jonathan Mendelsohn', title: 'Imaginary', year: 2015, channel: 'I AM HARDSTYLE', note: { vi: 'Vocal và giai điệu khiến cả lễ hội hát theo.', en: 'Vocals and melody a whole festival sings along to.' } },
    { youtube: 'koTZc4gSQgk', artist: 'Da Tweekaz', title: 'Tequila', channel: 'Dirty Workz', note: { vi: 'Hardstyle vui nhộn, hook dễ nhớ ngay lần đầu.', en: 'Fun hardstyle with a hook that sticks the first time.' } },
    { youtube: '8ga_tSyiRvQ', artist: 'Ran-D', title: 'Zombie', channel: 'Ran-D', note: { vi: 'Bản cover "Zombie" của The Cranberries trong hình hài hardstyle.', en: 'The Cranberries’ "Zombie" reimagined as hardstyle.' } },
    { youtube: 'JUGOvsXPIOA', artist: 'Sub Zero Project', title: 'The Project', channel: 'Dirty Workz', note: { vi: 'Sound design hiện đại, kick nặng: hardstyle thế hệ mới.', en: 'Modern sound design and heavy kicks: new-generation hardstyle.' } },
  ],
};
