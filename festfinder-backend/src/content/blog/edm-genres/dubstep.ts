import type { PackPost } from '../../../services/blog-content.ts';
import { figure, guide, MEDIA, nights, wiki } from './media.ts';

const [cover, artist] = MEDIA.dubstep;
const fig = (lang: 'vi' | 'en') => figure(artist,
  { vi: 'Skream, một trong những người tiên phong của dubstep', en: 'Skream, one of dubstep’s pioneers' },
  { vi: 'Skream, nhà sản xuất của "Midnight Request Line", một trong những bản dubstep đầu tiên', en: 'Skream, producer of "Midnight Request Line", one of the first dubstep records' }, lang);

export const dubstep: PackPost = {
  key: 'edm-genres/dubstep',
  slug: 'dubstep',
  category: 'styles',
  lang: 'vi',
  title: {
    vi: 'Dubstep là gì? 140 BPM half-time, lịch sử và sub-genre',
    en: 'What is dubstep? 140 BPM half-time, history, sub-genres',
  },
  excerpt: {
    vi: 'Dubstep ra đời ở Nam London đầu thập niên 2000: 140 BPM cảm giác half-time, sub-bass sâu, wobble bass. Từ Croydon tới brostep, riddim: lịch sử và 5 track.',
    en: 'Dubstep was born in South London in the early 2000s: 140 BPM with a half-time feel, deep sub-bass, wobble bass. From Croydon to brostep and riddim, with five tracks.',
  },
  cover: { url: cover.url, credit: `[${cover.author}](${cover.page}) · ${cover.license} · Wikimedia Commons` },
  styles: ['dubstep', 'bass'],
  facts: [
    { label: { vi: 'BPM', en: 'BPM' }, value: { vi: 'Khoảng 140 (cảm giác half-time 70)', en: 'Around 140 (a 70 half-time feel)' } },
    { label: { vi: 'Nguồn gốc', en: 'Origin' }, value: { vi: 'Nam London (Croydon), Anh · đầu thập niên 2000', en: 'South London (Croydon), UK · early 2000s' } },
    { label: { vi: 'Nhịp', en: 'Rhythm' }, value: { vi: 'Half-time: snare ở phách 3, beat thưa', en: 'Half-time: snare on beat 3, sparse beats' } },
    { label: { vi: 'Âm thanh', en: 'Sound' }, value: { vi: 'Sub-bass, wobble bass (LFO), sound system dub', en: 'Sub-bass, LFO wobble bass, dub sound-system weight' } },
    { label: { vi: 'Nghệ sĩ tiêu biểu', en: 'Key artists' }, value: { vi: 'Skream, Benga, Burial, Excision, Virtual Riot', en: 'Skream, Benga, Burial, Excision, Virtual Riot' } },
    { label: { vi: 'Dòng nhạc gần', en: 'Related' }, value: { vi: 'UK garage, Grime, Drum & Bass, Trap', en: 'UK garage, Grime, Drum & Bass, Trap' } },
  ],
  body: {
    vi: `**Dubstep** là dòng nhạc điện tử ra đời ở Nam London đầu thập niên 2000, chạy quanh 140 BPM nhưng mang cảm giác half-time chậm và nặng, với sub-bass sâu và wobble bass. Từ chất underground u tối ở Croydon, dubstep phát triển thành brostep và riddim bùng nổ trên sân khấu lễ hội.

## Dubstep nghe như thế nào?

- **Drums:** tempo 140 BPM nhưng snare rơi vào phách 3 của mỗi ô nhịp, tạo cảm giác half-time 70 BPM. Beat thưa, nhiều khoảng trống.
- **Bass:** trung tâm của dubstep. Sub-bass rất sâu kế thừa sound system reggae và dub; **wobble bass** dùng LFO để bass "lắc" theo nhịp.
- **Melody & harmony:** dubstep gốc tối giản, u ám, nhiều tiếng vang; brostep và melodic dubstep thêm lead và chord rõ ràng.
- **Arrangement:** intro, build-up rồi **drop** nơi bass chiếm lĩnh; dubstep lễ hội thường có hai drop với sound design khác nhau.
- **Mix & master:** dải trầm dưới 60 Hz rất mạnh, cần hệ thống loa tốt để cảm nhận.

## Lịch sử: Croydon, FWD>> và DMZ

Dubstep lớn lên từ UK garage, 2-step, grime và văn hóa sound system dub. Cửa hàng đĩa **Big Apple Records** ở Croydon là nơi những cái tên như Skream, Benga, Mala và Coki (Digital Mystikz) gặp nhau. Đêm nhạc **FWD>>** (từ 2001, sau này ở club Plastic People) và đài Rinse FM là nơi âm thanh mới được thử nghiệm. Đêm **DMZ** ở Brixton của Mala, Coki và Loefah trở thành thánh địa của dubstep sâu và nặng.

Năm 2005, Skream ra "Midnight Request Line", còn Burial phát hành album *Untrue* (2007) trên label Hyperdub. Khoảng năm 2010, dubstep sang Mỹ và biến thành **brostep** ồn ào hơn, với Skrillex và Excision, rồi tách tiếp thành riddim, tearout, melodic dubstep và colour bass.

${fig('vi')}

## 5 nghệ sĩ dubstep nên nghe

| Nghệ sĩ | Quốc gia | Vì sao nên nghe | Hồ sơ |
| --- | --- | --- | --- |
| Skream | Anh | "Midnight Request Line": cột mốc của dubstep sớm. | [Wikipedia](${wiki('Skream')}) |
| Benga | Anh | Đồng sáng lập dubstep ở Croydon, nhóm Magnetic Man. | [Wikipedia](${wiki('Benga (musician)')}) |
| Burial | Anh | Dubstep đô thị, buồn và đầy không khí. | [Wikipedia](${wiki('Burial (musician)')}) |
| Excision | Canada | Biểu tượng của dubstep nặng ở Bắc Mỹ, lễ hội Lost Lands. | [Wikipedia](${wiki('Excision (musician)')}) |
| Virtual Riot | Đức | Sound design phức tạp của thế hệ dubstep hiện đại. | [Wikipedia](${wiki('Virtual Riot')}) |

## Các sub-genre của dubstep

| Sub-genre | Điểm khác | BPM | Nghe thử |
| --- | --- | --- | --- |
| Original / Deep Dubstep | Sub-bass, không gian, chất sound system | 138–142 | Mala, Digital Mystikz |
| Brostep | Bass trung gầm gừ, drop dữ dội | 140–150 | Skrillex, Excision |
| Riddim | Bass lặp tối giản, nảy liên tục | 140–150 | Thế hệ riddim 2010s |
| Tearout | Gắt, hỗn loạn, bass xé tai | 140–150 | Làn sóng tearout |
| Melodic Dubstep | Chord, vocal, cảm xúc | 140–150 | Seven Lions, Illenium |
| Future / Colour Bass | Bass có giai điệu, nhiều màu sắc | 140–150 | Chime |
| Deathstep | Tối và nặng nhất, ảnh hưởng metal | 140–150 | Dòng deathstep |

## Dubstep khác drum & bass thế nào?

| Tiêu chí | Dubstep | Drum & Bass |
| --- | --- | --- |
| BPM | Khoảng 140 (cảm giác 70) | 160–180 (thường 174) |
| Nhịp | Half-time, snare phách 3 | Breakbeat nhanh, snare phách 2 và 4 |
| Bass | Sub và wobble chiếm lĩnh | Reese bass, sub lăn liên tục |
| Nguồn gốc | UK garage, đầu thập niên 2000 | Jungle, đầu thập niên 1990 |

## Cách nhận biết dubstep khi nghe

1. **Đếm nhịp:** nếu nhanh nhưng "cảm giác chậm" với snare thưa, đó là half-time 140 BPM.
2. **Nghe bass:** bass lắc theo nhịp (wobble) hoặc gầm gừ ở drop.
3. **Nghe khoảng trống:** dubstep gốc nhiều không gian và tiếng vang.
4. **So với D&B:** D&B nhanh hơn hẳn với breakbeat dồn dập.

## DJ mix dubstep thế nào?

Dubstep chạy khoảng 140 BPM nhưng cảm giác chậm một nửa, và năng lượng của nó nằm ở drop. Cách DJ mix dubstep đến từ văn hoá sound system ở Anh.

1. **Mix nhanh và dứt khoát.** Thay vì blend dài, nhiều lần chuyển bài rất ngắn: vài bar chồng lên nhau hoặc cắt đúng phrase.
2. **Double drop.** Canh hai bài để drop của chúng nổ cùng lúc là một chiêu kinh điển, dùng khi hai bassline hợp nhau.
3. **Rewind.** Khi một drop nổ đúng lúc, DJ có thể kéo bài lại và chơi từ đầu, một thói quen thừa hưởng từ sound system reggae và jungle.
4. **Chừa chỗ cho sub-bass.** Trên một hệ thống loa lớn, sub-bass gánh cả bài, nên DJ chỉ để một bassline nặng tại một thời điểm.

Một MC thường dẫn set, khuấy đám đông và hô báo những cú drop. Set riddim và brostep đi nhanh hơn dubstep Anh thời đầu, drop đổi gần như mỗi phút, nhưng thói quen của sound system vẫn giữ nguyên.

## Nghe dubstep ở đâu tại châu Á?

Dubstep và bass music có cộng đồng sôi nổi ở Việt Nam, Thái Lan và Nhật Bản. Xem [lịch dubstep sắp tới trên FeestFinder](${nights('dubstep', 'vi')}).

## Đọc tiếp

- [Drum & Bass là gì?](${guide('drum-and-bass', 'vi')}) Người anh em nhanh hơn cùng gốc UK.
- [Bass House là gì?](${guide('bass-house', 'vi')}) Bass dubstep trên nền house.
- [Techno là gì?](${guide('techno', 'vi')}) Một thế giới khác của kick 4/4.`,
    en: `**Dubstep** is electronic music born in South London in the early 2000s, running at around 140 BPM but with a slow, heavy half-time feel, deep sub-bass and wobble bass. From Croydon's dark underground it grew into the brostep and riddim that explode on festival stages.

## What does dubstep sound like?

- **Drums:** 140 BPM, but the snare lands on beat 3 of each bar, giving a 70 BPM half-time feel. Sparse beats, lots of space.
- **Bass:** the heart of dubstep. A very deep sub-bass inherited from reggae and dub sound systems; **wobble bass** uses an LFO to make the bass "shake" in time.
- **Melody & harmony:** original dubstep is minimal, gloomy and full of echo; brostep and melodic dubstep add clear leads and chords.
- **Arrangement:** intro, build-up, then a **drop** where the bass takes over; festival dubstep often has two drops with different sound design.
- **Mix & master:** very strong energy below 60 Hz, made to be felt on a proper sound system.

## History: Croydon, FWD>> and DMZ

Dubstep grew out of UK garage, 2-step, grime and dub sound-system culture. The **Big Apple Records** shop in Croydon was where Skream, Benga, Mala and Coki (Digital Mystikz) crossed paths. The **FWD>>** night (from 2001, later at the Plastic People club) and Rinse FM were the testing ground for the new sound, and the **DMZ** night in Brixton, run by Mala, Coki and Loefah, became the temple of deep, heavy dubstep.

In 2005 Skream released "Midnight Request Line", and Burial put out *Untrue* (2007) on Hyperdub. Around 2010 dubstep crossed to the US and turned into louder **brostep** with Skrillex and Excision, then split again into riddim, tearout, melodic dubstep and colour bass.

${fig('en')}

## 5 dubstep artists to know

| Artist | Country | Why listen | Profile |
| --- | --- | --- | --- |
| Skream | UK | "Midnight Request Line": a landmark of early dubstep. | [Wikipedia](${wiki('Skream')}) |
| Benga | UK | A Croydon co-founder of dubstep, part of Magnetic Man. | [Wikipedia](${wiki('Benga (musician)')}) |
| Burial | UK | Urban, melancholic, atmospheric dubstep. | [Wikipedia](${wiki('Burial (musician)')}) |
| Excision | Canada | North America's heavy dubstep icon, founder of Lost Lands. | [Wikipedia](${wiki('Excision (musician)')}) |
| Virtual Riot | Germany | The intricate sound design of modern dubstep. | [Wikipedia](${wiki('Virtual Riot')}) |

## Dubstep sub-genres

| Sub-genre | What sets it apart | BPM | Listen to |
| --- | --- | --- | --- |
| Original / Deep Dubstep | Sub-bass, space, sound-system weight | 138–142 | Mala, Digital Mystikz |
| Brostep | Growling mid-bass, violent drops | 140–150 | Skrillex, Excision |
| Riddim | Minimal looping bass, constant bounce | 140–150 | The 2010s riddim wave |
| Tearout | Harsh, chaotic, ripping bass | 140–150 | The tearout wave |
| Melodic Dubstep | Chords, vocals, emotion | 140–150 | Seven Lions, Illenium |
| Future / Colour Bass | Melodic, colourful bass | 140–150 | Chime |
| Deathstep | The darkest and heaviest, metal-influenced | 140–150 | The deathstep scene |

## Dubstep vs drum & bass

| | Dubstep | Drum & Bass |
| --- | --- | --- |
| BPM | Around 140 (a 70 feel) | 160–180 (often 174) |
| Rhythm | Half-time, snare on beat 3 | Fast breakbeats, snare on 2 and 4 |
| Bass | Sub and wobble dominate | Reese bass, rolling sub |
| Origin | UK garage, early 2000s | Jungle, early 1990s |

## How to recognise dubstep

1. **Count the tempo:** fast but "feels slow" with a sparse snare means 140 BPM half-time.
2. **Listen to the bass:** a bass that wobbles in time or growls at the drop.
3. **Listen for space:** original dubstep is full of room and echo.
4. **Compare with D&B:** D&B is much faster, with rushing breakbeats.

## How do DJs mix dubstep?

Dubstep runs at about 140 BPM but feels half as fast, and its energy lives in the drop. The way DJs mix it comes from UK sound-system culture.

1. **Quick, punchy mixes.** Instead of long blends, many transitions are short: a few bars of overlap, or a cut on the phrase.
2. **Double drops.** Lining up two tracks so their drops land together is a classic move, used when both basslines fit.
3. **Rewinds.** When a drop lands well, the DJ may pull the record back and start it again, a habit inherited from reggae and jungle sound systems.
4. **Room for the sub.** On a big sound system the sub-bass carries the track, so DJs keep only one heavy bassline playing at a time.

An MC often hosts the set, hyping the crowd and calling the drops. Early dubstep nights in London were built around the sound system itself, and the best sets still treat the speakers as an instrument: space, weight and the silence before a drop matter as much as speed. Riddim and brostep sets move faster than early UK dubstep, with drops changing almost every minute, but the habits of the sound system stay the same.

## Where to hear dubstep in Asia

Dubstep and bass music have lively communities in Vietnam, Thailand and Japan. See [upcoming dubstep nights on FeestFinder](${nights('dubstep', 'en')}).

## Read next

- [What is drum & bass?](${guide('drum-and-bass', 'en')}) The faster sibling with UK roots.
- [What is bass house?](${guide('bass-house', 'en')}) Dubstep's bass over a house beat.
- [What is techno?](${guide('techno', 'en')}) Another world of 4/4 kicks.`,
  },
  faq: [
    { q: { vi: 'Dubstep là gì?', en: 'What is dubstep?' }, a: { vi: 'Dubstep là dòng nhạc điện tử ra đời ở Nam London đầu thập niên 2000, khoảng 140 BPM với cảm giác half-time, sub-bass sâu và wobble bass.', en: 'Dubstep is electronic music born in South London in the early 2000s, around 140 BPM with a half-time feel, deep sub-bass and wobble bass.' } },
    { q: { vi: 'Dubstep bao nhiêu BPM?', en: 'What BPM is dubstep?' }, a: { vi: 'Khoảng 140 BPM, nhưng snare ở phách 3 khiến nhạc có cảm giác như 70 BPM (half-time).', en: 'Around 140 BPM, but the snare on beat 3 makes it feel like 70 BPM (half-time).' } },
    { q: { vi: 'Brostep khác dubstep gốc thế nào?', en: 'How is brostep different from original dubstep?' }, a: { vi: 'Dubstep gốc ở London tối giản, tập trung vào sub-bass và không gian. Brostep (Mỹ, khoảng 2010) dùng bass trung gầm gừ, drop dữ dội và năng lượng kiểu rock.', en: 'Original London dubstep is minimal, focused on sub-bass and space. Brostep (US, around 2010) uses growling mid-bass, violent drops and rock-style energy.' } },
    { q: { vi: 'Người mới nên nghe dubstep nào?', en: 'Which dubstep should a beginner try?' }, a: { vi: 'Melodic dubstep dễ nghe nhất; muốn hiểu gốc rễ hãy nghe Skream, Benga và Burial; muốn năng lượng lễ hội hãy nghe Excision và Virtual Riot.', en: 'Melodic dubstep is the easiest way in; for the roots, try Skream, Benga and Burial; for festival energy, Excision and Virtual Riot.' } },
    { q: { vi: 'Nghệ sĩ dubstep tiêu biểu là ai?', en: 'Who are the key dubstep artists?' }, a: { vi: 'Skream, Benga, Digital Mystikz (Mala và Coki), Burial, Kode9 ở giai đoạn đầu; Skrillex, Excision và Virtual Riot ở giai đoạn sau.', en: 'Skream, Benga, Digital Mystikz (Mala and Coki), Burial and Kode9 in the early days; Skrillex, Excision and Virtual Riot later.' } },
  ],
  sources: [
    { title: 'Dubstep', url: wiki('Dubstep'), publisher: 'Wikipedia' },
    { title: 'A brief history of early dubstep', url: 'https://museumofyouthculture.com/a-brief-history-of-early-dubstep', publisher: 'Museum of Youth Culture' },
    { title: 'Transatlantic vibrations: 10 years of DMZ and Dub War', url: 'https://factmag.com/2015/06/03/transatlantic-vibrations-10-years-of-dmz-and-dub-war', publisher: 'FACT' },
    { title: 'DMZ: it changed dubstep forever', url: 'https://www.dummymag.com/features/dmz', publisher: 'Dummy' },
    { title: 'Brostep', url: wiki('Brostep'), publisher: 'Wikipedia' },
  ],
  tracks: [
    { youtube: 'lcMAbnZy8l8', artist: 'Skream', title: 'Midnight Request Line', year: 2005, channel: 'Skream', note: { vi: 'Một trong những bản đưa dubstep ra khỏi London.', en: 'One of the records that carried dubstep beyond London.' } },
    { youtube: '8k_f2QK77ew', artist: 'Burial', title: 'Archangel', year: 2007, channel: 'Hyperdub', note: { vi: 'Vocal vỡ vụn, mưa đêm thành phố: dubstep giàu cảm xúc nhất.', en: 'Shattered vocals and city rain: dubstep at its most emotional.' } },
    { youtube: 'rNStVlJWy88', artist: 'Benga & Coki', title: 'Night', channel: 'TempaOfficial', note: { vi: 'Bass tối giản nhưng không thể đứng yên: kinh điển của dancefloor.', en: 'Minimal bass you cannot stand still to: a dancefloor classic.' } },
    { youtube: 'UNUkh58DzLY', artist: 'Excision & Space Laces', title: "Throwin' Elbows", channel: 'Excision', note: { vi: 'Dubstep nặng kiểu lễ hội Bắc Mỹ.', en: 'Heavy North American festival dubstep.' } },
    { youtube: 'PpXvuhSzPh8', artist: 'Virtual Riot & YDG feat. Luma', title: 'Paralyzed', channel: 'Monstercat Uncaged', note: { vi: 'Sound design hiện đại hòa với vocal giàu giai điệu.', en: 'Modern sound design meets a melodic vocal.' } },
  ],
};
