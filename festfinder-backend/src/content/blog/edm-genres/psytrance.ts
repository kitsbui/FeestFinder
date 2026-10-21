import type { PackPost } from '../../../services/blog-content.ts';
import { figure, guide, MEDIA, nights, wiki } from './media.ts';

const [cover, party] = MEDIA.psytrance;
const fig = (lang: 'vi' | 'en') => figure(party,
  { vi: 'Một bữa tiệc Goa trance về đêm ở Vagator, Goa', en: 'A Goa trance party at night in Vagator, Goa' },
  { vi: 'Tiệc trance ở Vagator, Goa (Ấn Độ), nơi Goa trance ra đời', en: 'A trance party in Vagator, Goa, India, where Goa trance was born' }, lang);

export const psytrance: PackPost = {
  key: 'edm-genres/psytrance',
  slug: 'psytrance',
  category: 'styles',
  lang: 'vi',
  title: {
    vi: 'Psytrance là gì? Goa trance, BPM và các sub-genre psy',
    en: 'What is psytrance? Goa trance, BPM and psy sub-genres',
  },
  excerpt: {
    vi: 'Psytrance lớn lên từ Goa trance ở Ấn Độ đầu thập niên 1990: rolling bass 16 nốt, âm thanh psychedelic, 138–148 BPM. Lịch sử, các nhánh và 5 track nên nghe.',
    en: 'Psytrance grew out of Goa trance in India in the early 1990s: a 16th-note rolling bass, psychedelic sound design, 138–148 BPM. History, styles and five tracks.',
  },
  cover: { url: cover.url, credit: `[${cover.author}](${cover.page}) · ${cover.license} · Wikimedia Commons` },
  styles: ['psytrance', 'trance'],
  facts: [
    { label: { vi: 'Tên khác', en: 'Also known as' }, value: { vi: 'Psychedelic trance, psy', en: 'Psychedelic trance, psy' } },
    { label: { vi: 'BPM', en: 'BPM' }, value: { vi: '138–148 (progressive 132–138, dark 148–160+)', en: '138–148 (progressive 132–138, dark 148–160+)' } },
    { label: { vi: 'Nguồn gốc', en: 'Origin' }, value: { vi: 'Goa, Ấn Độ · Goa trance đầu thập niên 1990', en: 'Goa, India · Goa trance in the early 1990s' } },
    { label: { vi: 'Nhịp', en: 'Rhythm' }, value: { vi: 'Kick 4/4, rolling bass 16 nốt nối liền kick', en: '4/4 kick, a 16th-note rolling bass locked to the kick' } },
    { label: { vi: 'Âm thanh', en: 'Sound' }, value: { vi: 'Lead xoắn ốc, hiệu ứng psychedelic, sample nói', en: 'Spiralling leads, psychedelic effects, spoken samples' } },
    { label: { vi: 'Nghệ sĩ tiêu biểu', en: 'Key artists' }, value: { vi: 'Astral Projection, Infected Mushroom, Astrix, Vini Vici', en: 'Astral Projection, Infected Mushroom, Astrix, Vini Vici' } },
  ],
  body: {
    vi: `**Psytrance** (psychedelic trance) là dòng trance phát triển từ Goa trance ở bang Goa, Ấn Độ đầu thập niên 1990, đặc trưng bởi rolling bass 16 nốt nối liền kick, âm thanh psychedelic xoắn ốc và nhịp 138–148 BPM. Psytrance gắn với văn hóa lễ hội ngoài trời như Boom (Bồ Đào Nha) và Ozora (Hungary).

## Psytrance nghe như thế nào?

- **Kick & bass:** kick 4/4 ngắn, theo sau là **rolling bass** chia ba nốt giữa mỗi kick (kiểu "dum-ga-ga-ga"), tạo cảm giác lăn liên tục. Đây là dấu ấn rõ nhất.
- **Melody & harmony:** lead synth xoắn ốc, arpeggio nhanh, thang âm "phương Đông" (như Phrygian) ở Goa trance; psytrance hiện đại tập trung vào hiệu ứng hơn giai điệu.
- **Sound design:** filter quét, delay, phaser, âm thanh "ngoài hành tinh" và sample lời nói từ phim hoặc bài giảng.
- **Arrangement:** dài 7–9 phút, ít breakdown cảm xúc kiểu trance; năng lượng duy trì và biến hóa liên tục.
- **Mix & master:** low-end gọn để bass và kick không chồng nhau, dải cao đầy chi tiết.

## Lịch sử: từ bãi biển Goa tới lễ hội thế giới

Từ cuối thập niên 1960, Goa là điểm đến của người hippie. Trong thập niên 1980, các DJ ở đây chơi nhạc điện tử (EBM, industrial, new beat) trong những bữa tiệc trên bãi biển, và đầu thập niên 1990 âm thanh riêng mang tên **Goa trance** ra đời. Các label như Dragonfly, TIP Records (1994), Flying Rhino (1994) và Twisted (1996) đưa Goa trance ra thế giới; giai đoạn 1994–1997 được xem là thời hoàng kim.

Cuối thập niên 1990, Goa trance dần được gọi là **psytrance** và tách nhánh: **full-on** sôi động từ Israel, **dark psy** tối và nhanh, **progressive psy** chậm và tinh tế, **forest psy** hữu cơ và bí ẩn. Israel trở thành cường quốc với Astral Projection, Infected Mushroom, Astrix, Ace Ventura. Năm 2016, "Great Spirit" của Armin van Buuren và Vini Vici đưa psytrance lên sân khấu chính các lễ hội lớn.

${fig('vi')}

## 5 nghệ sĩ psytrance nên nghe

| Nghệ sĩ | Quốc gia | Vì sao nên nghe | Hồ sơ |
| --- | --- | --- | --- |
| Astral Projection | Israel | Goa trance kinh điển, "People Can Fly". | [Wikipedia](${wiki('Astral Projection (band)')}) |
| Astrix | Israel | Biểu tượng full-on, "Deep Jungle Walk". | [YouTube](https://www.youtube.com/@ASTRIX_official) |
| Infected Mushroom | Israel | Psytrance giàu thử nghiệm, pha rock và điện ảnh. | [Wikipedia](${wiki('Infected Mushroom')}) |
| Ace Ventura | Israel | Đại diện tiêu biểu của progressive psy. | [YouTube](https://www.youtube.com/@AceVenturaMusic) |
| Vini Vici | Israel | Đưa psytrance lên sân khấu chính lễ hội EDM. | [Wikipedia](${wiki('Vini Vici')}) |

## Các sub-genre của psytrance

| Sub-genre | Điểm khác | BPM | Nghe thử |
| --- | --- | --- | --- |
| Goa Trance | Giai điệu phương Đông, synth ấm | 130–150 | Astral Projection |
| Full-On | Sôi động, sáng, rolling bass dày | 142–148 | Astrix |
| Progressive Psy | Chậm, tối giản, groove sâu | 132–138 | Ace Ventura |
| Dark Psy | Tối, nhanh, âm thanh méo | 148–160+ | Dòng dark psy |
| Forest Psy | Hữu cơ, bí ẩn, nhiều texture | 145–160 | Dòng forest psy |
| Psy Bounce / Mainstage Psy | Psy gọn cho sân khấu EDM | 138–142 | Vini Vici |

## Psytrance khác uplifting trance thế nào?

| Tiêu chí | Psytrance | Uplifting Trance |
| --- | --- | --- |
| Bass | Rolling 16 nốt nối kick | Off-beat |
| Giai điệu | Hiệu ứng, lead xoắn ốc | Supersaw, chord cảm xúc |
| Breakdown | Ngắn, ít | Dài, cao trào lớn |
| Không gian | Lễ hội ngoài trời, rừng | Sân khấu lớn, club |

## Cách nhận biết psytrance khi nghe

1. **Nghe bass:** ba nốt bass lăn giữa mỗi kick, liên tục không ngừng.
2. **Nghe hiệu ứng:** âm thanh "vũ trụ", filter quét, sample lời nói.
3. **Đếm nhịp:** khoảng 140–148 BPM, nhanh hơn trance thường.
4. **So với trance:** ít chord và breakdown hơn, nhiều hiệu ứng và năng lượng liên tục hơn.

## DJ mix psytrance thế nào?

Psytrance chạy nhanh và rolling bass nằm trên từng nốt móc kép, khoá chặt với kick. Vì vậy mix psytrance là việc cần độ chính xác.

1. **Không bao giờ chồng hai bassline.** Hai rolling bass cùng lúc lệch nhau ngay, nên DJ cắt phần trầm của bài mới rồi đổi bass trong một động tác gọn đúng lúc chuyển phrase.
2. **Đếm theo nhóm tám.** Psytrance thay đổi một thứ gì đó sau mỗi 8 hoặc 16 bar; cho bài sau vào đúng những mốc đó giữ được mạch.
3. **Giữ tempo đều.** Một set thường ở trong một khoảng BPM hẹp và chỉ tăng chậm, vì tốc độ nhảy vọt sẽ làm đứt cảm giác trance trên sàn.
4. **Kể chuyện bằng âm thanh.** Ở lễ hội, những âm thanh tối như dark psy thường thuộc về ban đêm, còn full-on và progressive hay lấp đầy buổi sáng và ban ngày.

Ở các lễ hội ngoài trời, set thường kéo dài nhiều giờ, từ đêm sang sáng, nên nhịp độ của cả set quan trọng hơn kỹ thuật. Nhiều track psytrance dài bảy, tám phút, nên DJ có thời gian chuẩn bị từng lần chuyển, và những đoạn build dài cho đám đông chìm vào groove trước khi âm thanh đổi hướng.

## Nghe psytrance ở đâu tại châu Á?

Ấn Độ, Thái Lan, Nhật Bản và Việt Nam đều có cộng đồng psytrance sôi nổi, từ tiệc bãi biển tới lễ hội ngoài trời. Xem [lịch psytrance sắp tới trên FeestFinder](${nights('psytrance', 'vi')}).

## Đọc tiếp

- [Trance là gì?](${guide('trance', 'vi')}) Gia đình lớn của psytrance.
- [Bounce là gì?](${guide('bounce', 'vi')}) Psy bounce, khi psytrance gặp mainstage.
- [Techno là gì?](${guide('techno', 'vi')}) Một nhánh khác của nhạc lặp thôi miên.`,
    en: `**Psytrance** (psychedelic trance) is the trance branch that grew out of Goa trance in the Indian state of Goa in the early 1990s, defined by a 16th-note rolling bass locked to the kick, spiralling psychedelic sound design and tempos of 138–148 BPM. It is tied to open-air festival culture such as Boom in Portugal and Ozora in Hungary.

## What does psytrance sound like?

- **Kick & bass:** a short 4/4 kick followed by a **rolling bass** that fills three notes between each kick ("dum-ga-ga-ga"), a constant rolling feel. This is its clearest signature.
- **Melody & harmony:** spiralling synth leads, fast arpeggios and "eastern" scales (such as Phrygian) in Goa trance; modern psytrance focuses on effects over melody.
- **Sound design:** sweeping filters, delays, phasers, "alien" sounds and spoken samples from films or lectures.
- **Arrangement:** 7–9 minutes long, with few trance-style emotional breakdowns; the energy holds and keeps morphing.
- **Mix & master:** a tight low end so kick and bass never collide, a detailed top end.

## History: from Goa's beaches to the world's festivals

From the late 1960s Goa was a hippie destination. In the 1980s DJs there played electronic music (EBM, industrial, new beat) at beach parties, and in the early 1990s a sound of its own, **Goa trance**, was born. Labels such as Dragonfly, TIP Records (1994), Flying Rhino (1994) and Twisted (1996) took it worldwide; 1994–1997 is seen as its golden age.

By the late 1990s Goa trance was increasingly called **psytrance** and branched out: energetic **full-on** from Israel, dark and fast **dark psy**, slower and subtler **progressive psy**, organic and mysterious **forest psy**. Israel became a powerhouse with Astral Projection, Infected Mushroom, Astrix and Ace Ventura. In 2016 Armin van Buuren and Vini Vici's "Great Spirit" took psytrance to the main stages of the big festivals.

${fig('en')}

## 5 psytrance artists to know

| Artist | Country | Why listen | Profile |
| --- | --- | --- | --- |
| Astral Projection | Israel | Classic Goa trance, "People Can Fly". | [Wikipedia](${wiki('Astral Projection (band)')}) |
| Astrix | Israel | The icon of full-on, "Deep Jungle Walk". | [YouTube](https://www.youtube.com/@ASTRIX_official) |
| Infected Mushroom | Israel | Experimental psytrance with rock and cinematic touches. | [Wikipedia](${wiki('Infected Mushroom')}) |
| Ace Ventura | Israel | A leading name of progressive psy. | [YouTube](https://www.youtube.com/@AceVenturaMusic) |
| Vini Vici | Israel | Took psytrance to EDM festival main stages. | [Wikipedia](${wiki('Vini Vici')}) |

## Psytrance sub-genres

| Sub-genre | What sets it apart | BPM | Listen to |
| --- | --- | --- | --- |
| Goa Trance | Eastern melodies, warm synths | 130–150 | Astral Projection |
| Full-On | Energetic, bright, thick rolling bass | 142–148 | Astrix |
| Progressive Psy | Slower, minimal, deep groove | 132–138 | Ace Ventura |
| Dark Psy | Dark, fast, distorted sounds | 148–160+ | The dark psy scene |
| Forest Psy | Organic, mysterious, textured | 145–160 | The forest psy scene |
| Psy Bounce / Mainstage Psy | Streamlined psy for EDM stages | 138–142 | Vini Vici |

## Psytrance vs uplifting trance

| | Psytrance | Uplifting Trance |
| --- | --- | --- |
| Bass | 16th-note rolling, locked to the kick | Off-beat |
| Melody | Effects, spiralling leads | Supersaws, emotional chords |
| Breakdowns | Short, few | Long, big climaxes |
| Setting | Open-air festivals, forests | Big stages, clubs |

## How to recognise psytrance

1. **Listen to the bass:** three rolling bass notes between every kick, never stopping.
2. **Listen to the effects:** "cosmic" sounds, sweeping filters, spoken samples.
3. **Count the tempo:** about 140–148 BPM, faster than most trance.
4. **Compare with trance:** fewer chords and breakdowns, more effects and constant energy.

## How do DJs mix psytrance?

Psytrance moves fast, and its rolling bass sits on every 16th note, locked to the kick. That makes mixing it precise work.

1. **Never stack two basslines.** Two rolling basses at once clash immediately, so DJs cut the low end of the incoming track and swap the basses in one clean move at a phrase change.
2. **Count in eights.** Psytrance changes something every 8 or 16 bars; starting the next track on those boundaries keeps the flow.
3. **Keep the tempo steady.** A set usually stays within a narrow BPM band and rises slowly, because jumps in speed break the trance on the dancefloor.
4. **Tell a story with sound.** At festivals, darker sounds such as dark psy usually belong to the night, while full-on and progressive often fill the morning and the day.

At open-air festivals sets often run for hours, from night into morning, so the pacing of the whole set matters more than any single trick. A good psytrance DJ is judged by how long the dancefloor stays lost in the music. Many psytrance tracks run seven or eight minutes, so a DJ has time to prepare each change, and the long builds give the crowd time to sink into the groove before the next shift in sound.

## Where to hear psytrance in Asia

India, Thailand, Japan and Vietnam all have lively psytrance communities, from beach parties to open-air festivals. See [upcoming psytrance nights on FeestFinder](${nights('psytrance', 'en')}).

## Read next

- [What is trance?](${guide('trance', 'en')}) Psytrance's wider family.
- [What is bounce?](${guide('bounce', 'en')}) Psy bounce, where psytrance meets the mainstage.
- [What is techno?](${guide('techno', 'en')}) Another branch of hypnotic, repetitive music.`,
  },
  faq: [
    { q: { vi: 'Psytrance là gì?', en: 'What is psytrance?' }, a: { vi: 'Psytrance là dòng trance phát triển từ Goa trance ở Goa, Ấn Độ, với rolling bass 16 nốt, âm thanh psychedelic và nhịp 138–148 BPM.', en: 'Psytrance is the branch of trance that grew out of Goa trance in Goa, India, with a 16th-note rolling bass, psychedelic sound design and tempos of 138–148 BPM.' } },
    { q: { vi: 'Psytrance bao nhiêu BPM?', en: 'What BPM is psytrance?' }, a: { vi: 'Thường 138–148 BPM; progressive psy chậm hơn (132–138), dark psy và forest psy nhanh hơn (148–160 trở lên).', en: 'Usually 138–148 BPM; progressive psy is slower (132–138), dark and forest psy faster (148–160 and up).' } },
    { q: { vi: 'Goa trance và psytrance khác nhau thế nào?', en: 'What is the difference between Goa trance and psytrance?' }, a: { vi: 'Goa trance (đầu thập niên 1990) giàu giai điệu phương Đông và synth ấm. Psytrance là bước phát triển sau, tối giản giai điệu hơn và tập trung vào bass, sound design.', en: 'Goa trance (early 1990s) is rich in eastern melodies and warm synths. Psytrance is its later evolution, with less melody and more focus on bass and sound design.' } },
    { q: { vi: 'Người mới nên nghe sub-genre psy nào?', en: 'Which psy sub-genre suits beginners?' }, a: { vi: 'Progressive psy và full-on dễ nghe nhất; các bản crossover như "Great Spirit" của Armin van Buuren và Vini Vici là cửa ngõ tốt.', en: 'Progressive psy and full-on are the easiest way in; crossovers such as Armin van Buuren and Vini Vici’s "Great Spirit" are a good door.' } },
    { q: { vi: 'Lễ hội psytrance nổi tiếng nhất là gì?', en: 'What are the best-known psytrance festivals?' }, a: { vi: 'Boom Festival ở Bồ Đào Nha và Ozora ở Hungary là hai lễ hội psytrance nổi tiếng nhất thế giới.', en: 'Boom Festival in Portugal and Ozora in Hungary are the world’s best-known psytrance festivals.' } },
  ],
  sources: [
    { title: 'Psychedelic trance', url: wiki('Psychedelic trance'), publisher: 'Wikipedia' },
    { title: 'Goa trance', url: wiki('Goa trance'), publisher: 'Wikipedia' },
    { title: 'Progressive psytrance', url: wiki('Progressive psytrance'), publisher: 'Wikipedia' },
    { title: 'A brief history of psytrance and Sunburn in Goa', url: 'https://dancingastronaut.com/2014/12/brief-history-psytrance-sunburn-goa/', publisher: 'Dancing Astronaut' },
    { title: 'Boom Festival', url: 'https://www.boomfestival.org/', publisher: 'Boom Festival' },
  ],
  tracks: [
    { youtube: 'kJSyBUZshfs', artist: 'Astral Projection', title: 'People Can Fly', channel: 'Astral Projection', note: { vi: 'Goa trance kinh điển với giai điệu bay bổng.', en: 'Classic Goa trance with a soaring melody.' } },
    { youtube: 'lIuEuJvKos4', artist: 'Astrix', title: 'Deep Jungle Walk', year: 2004, channel: 'Astrix', note: { vi: 'Bản full-on được chơi nhiều nhất mọi thời.', en: 'One of the most-played full-on records ever.' } },
    { youtube: 'wVwQYSVNJVM', artist: 'Infected Mushroom', title: 'Becoming Insane', year: 2007, channel: 'Infected Mushroom - Topic', note: { vi: 'Psytrance pha guitar và vocal, đầy kịch tính.', en: 'Psytrance with guitars and vocals, full of drama.' } },
    { youtube: 'BnQ8o69EZ8c', artist: 'Ace Ventura', title: 'Presence', channel: 'Ace Ventura', note: { vi: 'Progressive psy: groove sâu, tối giản, cuốn hút.', en: 'Progressive psy: deep, minimal and hypnotic.' } },
    { youtube: 'yo4pmauhugo', artist: 'Armin van Buuren vs Vini Vici feat. Hilight Tribe', title: 'Great Spirit', year: 2016, channel: 'Armin van Buuren', note: { vi: 'Bản đưa psytrance lên sân khấu chính các lễ hội lớn.', en: 'The record that took psytrance to the big festivals’ main stages.' } },
  ],
};
