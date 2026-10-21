import type { PackPost } from '../../../services/blog-content.ts';
import { figure, guide, MEDIA, nights, wiki } from './media.ts';

const [cover, artist] = MEDIA['drum-and-bass'];
const fig = (lang: 'vi' | 'en') => figure(artist,
  { vi: 'Netsky chơi nhạc năm 2008', en: 'Netsky playing in 2008' },
  { vi: 'Netsky, gương mặt của liquid drum & bass, năm 2008', en: 'Netsky, a face of liquid drum & bass, in 2008' }, lang);

export const drumAndBass: PackPost = {
  key: 'edm-genres/drum-and-bass',
  slug: 'drum-and-bass',
  category: 'styles',
  lang: 'vi',
  title: {
    vi: 'Drum & Bass là gì? BPM, jungle và các sub-genre của DnB',
    en: 'What is drum & bass? BPM, jungle and DnB sub-genres',
  },
  excerpt: {
    vi: 'Drum & Bass ra đời ở Anh đầu thập niên 1990: breakbeat dồn dập 160–180 BPM, bassline nặng. Từ jungle tới liquid, neurofunk: lịch sử, nghệ sĩ và 5 track.',
    en: 'Drum & bass was born in the UK in the early 1990s: rushing breakbeats at 160–180 BPM and heavy basslines. From jungle to liquid and neurofunk, with artists and tracks.',
  },
  cover: { url: cover.url, credit: `[${cover.author}](${cover.page}) · ${cover.license} · Wikimedia Commons` },
  styles: ['drum-and-bass', 'breakbeat'],
  facts: [
    { label: { vi: 'Tên khác', en: 'Also known as' }, value: { vi: 'DnB, D&B, drum n bass', en: 'DnB, D&B, drum n bass' } },
    { label: { vi: 'BPM', en: 'BPM' }, value: { vi: '160–180 (thường 172–175)', en: '160–180 (usually 172–175)' } },
    { label: { vi: 'Nguồn gốc', en: 'Origin' }, value: { vi: 'Anh (London, Bristol) · đầu thập niên 1990', en: 'UK (London, Bristol) · early 1990s' } },
    { label: { vi: 'Nhịp', en: 'Rhythm' }, value: { vi: 'Breakbeat nhanh, snare ở phách 2 và 4', en: 'Fast breakbeats, snare on beats 2 and 4' } },
    { label: { vi: 'Âm thanh', en: 'Sound' }, value: { vi: 'Amen break, reese bass, sub-bass lăn', en: 'The Amen break, reese bass, rolling sub-bass' } },
    { label: { vi: 'Nghệ sĩ tiêu biểu', en: 'Key artists' }, value: { vi: 'Goldie, LTJ Bukem, Andy C, Noisia, Netsky', en: 'Goldie, LTJ Bukem, Andy C, Noisia, Netsky' } },
  ],
  body: {
    vi: `**Drum & Bass** (DnB, D&B) là dòng nhạc điện tử ra đời ở Anh đầu thập niên 1990, nổi bật với breakbeat dồn dập ở 160–180 BPM (thường 172–175) và bassline nặng, sâu. DnB phát triển từ jungle và breakbeat hardcore của các bữa rave, rồi tách thành liquid, neurofunk, jump-up và nhiều nhánh khác.

## Drum & Bass nghe như thế nào?

- **Drums:** breakbeat được cắt và sắp xếp lại từ các đoạn trống funk, nổi tiếng nhất là **Amen break**. Snare rơi vào phách 2 và 4, nhanh và gọn.
- **Bass:** sub-bass lăn liên tục và **reese bass** (hai sóng saw lệch nhau tạo tiếng "rền") là dấu ấn của DnB.
- **Melody & harmony:** liquid dùng chord jazz, soul và vocal; neurofunk gần như không có giai điệu, tập trung vào bass.
- **Arrangement:** intro dài cho DJ, drop, breakdown, drop thứ hai; DJ DnB thường mix nhanh và chồng hai bản cùng lúc.
- **Mix & master:** trống sáng, sắc; bass dày nhưng gọn để giữ được tốc độ.

## Lịch sử: từ jungle tới Metalheadz

Đầu thập niên 1990, breakbeat hardcore trong các bữa rave ở Anh tăng tốc và tối dần thành **jungle** (khoảng 1992–1994), mang theo bass reggae và vocal ragga. Giữa thập niên 1990, cái tên **drum & bass** dùng cho hướng đi gọn và kỹ thuật hơn.

Goldie cùng Kemistry & Storm lập label **Metalheadz** năm 1994, mở đêm Sunday Sessions huyền thoại ở club Blue Note, và Goldie phát hành album *Timeless* (1995) với "Inner City Life". LTJ Bukem và label Good Looking theo hướng atmospheric "intelligent". Năm 1997, Roni Size & Reprazent giành Mercury Prize với album *New Forms*. Thập niên 2000 và 2010 thuộc về Andy C và RAM Records, Sub Focus, Noisia, Netsky, Hospital Records, và DnB vẫn đang bùng nổ trở lại trong thập niên 2020.

${fig('vi')}

## 5 nghệ sĩ drum & bass nên nghe

| Nghệ sĩ | Quốc gia | Vì sao nên nghe | Hồ sơ |
| --- | --- | --- | --- |
| LTJ Bukem | Anh | Atmospheric DnB, label Good Looking. | [Wikipedia](${wiki('LTJ Bukem')}) |
| Goldie | Anh | *Timeless* và label Metalheadz: nền móng của DnB. | [Wikipedia](${wiki('Goldie')}) |
| Sub Focus | Anh | DnB dancefloor của RAM Records, cầu nối với mainstream. | [Wikipedia](${wiki('Sub Focus')}) |
| Noisia | Hà Lan | Bậc thầy neurofunk và sound design. | [Wikipedia](${wiki('Noisia')}) |
| Netsky | Bỉ | Liquid giàu giai điệu của Hospital Records. | [Wikipedia](${wiki('Netsky (musician)')}) |

## Các sub-genre của drum & bass

| Sub-genre | Điểm khác | BPM | Nghe thử |
| --- | --- | --- | --- |
| Jungle | Amen break cắt dồn dập, bass reggae | 160–170 | Jungle thập niên 1990 |
| Ragga Jungle | Jungle với vocal ragga, dancehall | 160–170 | Jungle Anh 1993–1995 |
| Liquid Funk | Soulful, chord jazz, vocal | 170–175 | Netsky, Hospital Records |
| Atmospheric / Intelligent | Pad, không gian, nhẹ nhàng | 160–172 | LTJ Bukem |
| Neurofunk | Reese bass phức tạp, tối, kỹ thuật | 172–176 | Noisia |
| Techstep | Tối, ảnh hưởng techno, cuối thập niên 1990 | 170–175 | Ed Rush & Optical |
| Jump-Up | Bass wobble vui nhộn, năng lượng đám đông | 172–176 | Dòng jump-up |
| Dancefloor DnB | Hook lớn, dễ nghe, hợp lễ hội | 172–176 | Sub Focus |
| Halftime | Tempo DnB nhưng cảm giác một nửa | 170–175 (cảm giác 85) | Dòng halftime |
| Drumstep | Nhịp dubstep ở tempo DnB | 170–175 | Dòng drumstep |

## Drum & Bass khác jungle thế nào?

| Tiêu chí | Drum & Bass | Jungle |
| --- | --- | --- |
| Thời điểm | Từ giữa thập niên 1990 | 1992–1995 |
| Drums | Gọn, chính xác, ít cắt rối | Amen break cắt dồn dập, phức tạp |
| Bass | Reese, sub, sound design hiện đại | Bass reggae, sub dub |
| Vocal | Đa dạng, từ soul tới không lời | Ragga, MC |

## Cách nhận biết drum & bass khi nghe

1. **Đếm nhịp:** rất nhanh, khoảng 174 BPM; nhún theo nửa tốc độ vẫn được.
2. **Nghe trống:** breakbeat thay cho kick 4/4, snare đanh ở phách 2 và 4.
3. **Nghe bass:** sub lăn liên tục hoặc reese "rền".
4. **So với dubstep:** dubstep chậm hơn (140, cảm giác 70) và thưa hơn nhiều.

## DJ mix drum & bass thế nào?

Drum & bass nhanh nhưng cấu trúc rất đều: intro và outro 16 hoặc 32 bar, rồi tới drop. DJ dựa vào đó để giữ năng lượng luôn cao.

1. **Mix theo phrase.** Bài mới được cho vào sao cho drop của nó nổ đúng lúc bài đang chạy hết một đoạn.
2. **Double drop.** Hai drop cùng lúc, khi hai bassline hợp nhau, là một trong những khoảnh khắc đặc trưng của dòng nhạc.
3. **Đổi bass.** EQ rút phần trầm của một bài trong khi bass của bài kia vào, để reese và sub-bass không bao giờ đè nhau.
4. **Rewind và MC.** Một bài hay có thể bị kéo lại và chơi lần nữa khi đám đông đòi, và MC thường cưỡi lên beat suốt set.

Nhiều DJ drum & bass mix rất nhanh, đổi bài mỗi một hai phút, nên một set một tiếng có thể chứa rất nhiều bài. Set liquid thì êm hơn, với những đoạn blend dài để giai điệu của hai bài chồng lên nhau.

## Nghe drum & bass ở đâu tại châu Á?

DnB có những đêm nhạc trung thành ở TP.HCM, Hà Nội, Bangkok, Tokyo và Singapore. Xem [lịch drum & bass sắp tới trên FeestFinder](${nights('drum-and-bass', 'vi')}).

## Đọc tiếp

- [Dubstep là gì?](${guide('dubstep', 'vi')}) Người anh em half-time cùng gốc UK.
- [Techno là gì?](${guide('techno', 'vi')}) Techstep mượn nhiều từ techno.
- [Bass House là gì?](${guide('bass-house', 'vi')}) Bass UK trên nền house.`,
    en: `**Drum & bass** (DnB, D&B) is electronic music born in the UK in the early 1990s, known for rushing breakbeats at 160–180 BPM (usually 172–175) and deep, heavy basslines. It grew out of the jungle and breakbeat hardcore of the rave era and split into liquid, neurofunk, jump-up and many more branches.

## What does drum & bass sound like?

- **Drums:** breakbeats chopped and rearranged from funk drum breaks, most famously the **Amen break**. The snare lands on beats 2 and 4, fast and tight.
- **Bass:** a constantly rolling sub-bass and the **reese bass** (two detuned saw waves that "growl") are DnB's signature.
- **Melody & harmony:** liquid uses jazz and soul chords and vocals; neurofunk has almost no melody and focuses on bass.
- **Arrangement:** a long DJ intro, drop, breakdown, second drop; DnB DJs mix fast and often layer two tracks at once.
- **Mix & master:** bright, crisp drums; thick but tight bass to keep the speed.

## History: from jungle to Metalheadz

In the early 1990s the breakbeat hardcore of UK raves sped up and darkened into **jungle** (around 1992–1994), carrying reggae bass and ragga vocals. By the mid-1990s the name **drum & bass** described a cleaner, more technical direction.

Goldie, with Kemistry & Storm, founded **Metalheadz** in 1994, launched the legendary Sunday Sessions at the Blue Note club, and released *Timeless* (1995) with "Inner City Life". LTJ Bukem and his Good Looking label took the atmospheric "intelligent" route. In 1997 Roni Size & Reprazent won the Mercury Prize for *New Forms*. The 2000s and 2010s belonged to Andy C and RAM Records, Sub Focus, Noisia, Netsky and Hospital Records, and DnB is booming again in the 2020s.

${fig('en')}

## 5 drum & bass artists to know

| Artist | Country | Why listen | Profile |
| --- | --- | --- | --- |
| LTJ Bukem | UK | Atmospheric DnB and the Good Looking label. | [Wikipedia](${wiki('LTJ Bukem')}) |
| Goldie | UK | *Timeless* and Metalheadz: DnB's foundations. | [Wikipedia](${wiki('Goldie')}) |
| Sub Focus | UK | RAM Records dancefloor DnB, a bridge to the mainstream. | [Wikipedia](${wiki('Sub Focus')}) |
| Noisia | Netherlands | Masters of neurofunk and sound design. | [Wikipedia](${wiki('Noisia')}) |
| Netsky | Belgium | Melodic liquid from Hospital Records. | [Wikipedia](${wiki('Netsky (musician)')}) |

## Drum & bass sub-genres

| Sub-genre | What sets it apart | BPM | Listen to |
| --- | --- | --- | --- |
| Jungle | Frantic chopped Amen breaks, reggae bass | 160–170 | 1990s jungle |
| Ragga Jungle | Jungle with ragga and dancehall vocals | 160–170 | UK jungle 1993–1995 |
| Liquid Funk | Soulful, jazz chords, vocals | 170–175 | Netsky, Hospital Records |
| Atmospheric / Intelligent | Pads, space, gentle | 160–172 | LTJ Bukem |
| Neurofunk | Complex reese bass, dark, technical | 172–176 | Noisia |
| Techstep | Dark, techno-influenced, late 1990s | 170–175 | Ed Rush & Optical |
| Jump-Up | Playful wobble bass, crowd energy | 172–176 | The jump-up scene |
| Dancefloor DnB | Big hooks, accessible, festival-ready | 172–176 | Sub Focus |
| Halftime | DnB tempo with a half-speed feel | 170–175 (an 85 feel) | The halftime scene |
| Drumstep | Dubstep rhythms at DnB tempo | 170–175 | The drumstep scene |

## Drum & bass vs jungle

| | Drum & Bass | Jungle |
| --- | --- | --- |
| Era | From the mid-1990s | 1992–1995 |
| Drums | Clean, precise, less chopped | Frantic, complex Amen chops |
| Bass | Reese, sub, modern sound design | Reggae bass, dub sub |
| Vocals | Varied, from soul to none | Ragga, MCs |

## How to recognise drum & bass

1. **Count the tempo:** very fast, around 174 BPM; you can also move at half speed.
2. **Listen to the drums:** breakbeats instead of a 4/4 kick, a crisp snare on 2 and 4.
3. **Listen to the bass:** a rolling sub or a growling reese.
4. **Compare with dubstep:** dubstep is slower (140, a 70 feel) and far sparser.

## How do DJs mix drum & bass?

Drum & bass is fast, but its structure is regular: intros and outros of 16 or 32 bars, then the drop. DJs use that to keep the energy high.

1. **Mix on the phrase.** The incoming track starts so that its drop lands just as the current one finishes a section.
2. **Double drops.** Two drops at once, when the basslines agree, is one of the genre's signature moments.
3. **Swap the bass.** The EQ takes the low end out of one track while the other's bass comes in, so the reese and the sub never clash.
4. **Rewinds and MCs.** A big tune can be pulled back and played again on the crowd's call, and an MC often rides the beat through the set.

Many drum & bass DJs mix quickly, changing tracks every minute or two, so a one-hour set can hold a large number of records. That pace, the MC and the rewinds come straight from the jungle raves and pirate radio of the early 1990s. Liquid sets run smoother, with longer blends that let the melodies of two tracks overlap.

## Where to hear drum & bass in Asia

DnB has loyal nights in Ho Chi Minh City, Hanoi, Bangkok, Tokyo and Singapore. See [upcoming drum & bass nights on FeestFinder](${nights('drum-and-bass', 'en')}).

## Read next

- [What is dubstep?](${guide('dubstep', 'en')}) The half-time sibling with UK roots.
- [What is techno?](${guide('techno', 'en')}) Techstep borrowed a lot from techno.
- [What is bass house?](${guide('bass-house', 'en')}) UK bass over a house beat.`,
  },
  faq: [
    { q: { vi: 'Drum & Bass là gì?', en: 'What is drum & bass?' }, a: { vi: 'Drum & Bass là dòng nhạc điện tử ra đời ở Anh đầu thập niên 1990, với breakbeat nhanh 160–180 BPM và bassline nặng, phát triển từ jungle.', en: 'Drum & bass is electronic music born in the UK in the early 1990s, with fast 160–180 BPM breakbeats and heavy basslines, grown out of jungle.' } },
    { q: { vi: 'Drum & Bass bao nhiêu BPM?', en: 'What BPM is drum & bass?' }, a: { vi: 'Thường 160–180 BPM, phổ biến nhất là 172–175 BPM. Jungle thời đầu hay ở khoảng 160–170 BPM; drum & bass hiện đại, từ liquid tới neurofunk, phần lớn chơi ở khoảng 174 BPM để DJ dễ nối bài.', en: 'Usually 160–180 BPM, most commonly 172–175 BPM. Early jungle often sat around 160–170 BPM; most modern drum & bass, from liquid to neurofunk, is played at about 174 BPM so DJs can blend tracks smoothly.' } },
    { q: { vi: 'Jungle và drum & bass khác nhau thế nào?', en: 'What is the difference between jungle and drum & bass?' }, a: { vi: 'Jungle (1992–1995) dùng Amen break cắt dồn dập, bass reggae và vocal ragga. Drum & bass là hướng đi sau đó, gọn và kỹ thuật hơn, với reese bass và sound design hiện đại.', en: 'Jungle (1992–1995) uses frantic Amen break chops, reggae bass and ragga vocals. Drum & bass is the direction that followed, cleaner and more technical, with reese bass and modern sound design.' } },
    { q: { vi: 'Người mới nên nghe sub-genre DnB nào?', en: 'Which DnB sub-genre suits beginners?' }, a: { vi: 'Liquid funk và dancefloor DnB dễ nghe nhất nhờ giai điệu và vocal; neurofunk hợp khi bạn đã quen với tốc độ và bass.', en: 'Liquid funk and dancefloor DnB are the easiest way in, thanks to melodies and vocals; neurofunk suits you once the speed and bass feel familiar.' } },
    { q: { vi: 'Nghệ sĩ drum & bass tiêu biểu là ai?', en: 'Who are the key drum & bass artists?' }, a: { vi: 'Goldie, LTJ Bukem, Roni Size, Andy C ở giai đoạn đầu; Sub Focus, Noisia, Netsky và Chase & Status ở giai đoạn sau.', en: 'Goldie, LTJ Bukem, Roni Size and Andy C in the early days; Sub Focus, Noisia, Netsky and Chase & Status later.' } },
  ],
  sources: [
    { title: 'Drum and bass', url: wiki('Drum and bass'), publisher: 'Wikipedia' },
    { title: 'Jungle music', url: wiki('Jungle music'), publisher: 'Wikipedia' },
    { title: 'Metalheadz', url: wiki('Metalheadz'), publisher: 'Wikipedia' },
    { title: 'Drum and bass (tiếng Việt)', url: 'https://vi.wikipedia.org/wiki/Drum_and_bass', publisher: 'Wikipedia tiếng Việt' },
    { title: 'Drum and bass', url: 'https://www.britannica.com/art/drum-and-bass', publisher: 'Encyclopaedia Britannica' },
    { title: 'The origins and evolution of drum’n’bass', url: 'https://www.redbull.com/ie-en/history-of-drum-and-bass-music', publisher: 'Red Bull' },
  ],
  tracks: [
    { youtube: 'DNQDoiuGq58', artist: 'LTJ Bukem', title: 'Music', year: 1993, channel: 'LTJ Bukem - Topic', note: { vi: 'Atmospheric DnB kinh điển: pad và breakbeat bồng bềnh.', en: 'Classic atmospheric DnB: floating pads and breakbeats.' } },
    { youtube: '6vHkOI-Z7lY', artist: 'Goldie', title: 'Inner City Life', year: 1994, channel: 'GOLDIE', note: { vi: 'Vocal soul của Diane Charlemagne trên nền jungle: một cột mốc.', en: 'Diane Charlemagne’s soul vocal over jungle: a landmark.' } },
    { youtube: 'k_jOkWf1lRg', artist: 'Sub Focus', title: 'Rock It', year: 2008, channel: 'RAM Records', note: { vi: 'DnB dancefloor của RAM Records, năng lượng lễ hội.', en: 'RAM Records dancefloor DnB with festival energy.' } },
    { youtube: 'Oj1_lhCc4M0', artist: 'Noisia', title: 'Diplodocus', year: 2010, channel: 'Noisia - Topic', note: { vi: 'Neurofunk: bass được sound design tới từng chi tiết.', en: 'Neurofunk: bass sound-designed down to the last detail.' } },
    { youtube: 'DpYdXERlkFk', artist: 'Netsky', title: 'Memory Lane', year: 2010, channel: 'Hospital Records', note: { vi: 'Liquid giàu giai điệu, cửa ngõ dễ nhất vào DnB.', en: 'Melodic liquid, the easiest door into DnB.' } },
  ],
};
