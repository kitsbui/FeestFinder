import type { PackPost } from '../../../services/blog-content.ts';
import { figure, guide, MEDIA, nights, wiki } from './media.ts';

const [cover, stage] = MEDIA.trance;
const fig = (lang: 'vi' | 'en') => figure(stage,
  { vi: 'Ferry Corsten biểu diễn tại Sunburn Festival, Goa', en: 'Ferry Corsten on stage at Sunburn Festival, Goa' },
  { vi: 'Ferry Corsten tại Sunburn Festival ở Goa, Ấn Độ', en: 'Ferry Corsten at Sunburn Festival in Goa, India' }, lang);

export const trance: PackPost = {
  key: 'edm-genres/trance',
  slug: 'trance',
  category: 'styles',
  lang: 'vi',
  title: {
    vi: 'Trance là gì? BPM, lịch sử và các sub-genre của trance',
    en: 'What is trance? BPM, history and trance sub-genres',
  },
  excerpt: {
    vi: 'Trance là nhạc điện tử ra đời ở Đức đầu thập niên 1990: giai điệu synth bay bổng, breakdown dài, 128–140 BPM. Lịch sử, đặc trưng, sub-genre, 5 nghệ sĩ và 5 track nên nghe.',
    en: 'Trance is electronic music born in Germany in the early 1990s: soaring synth melodies, long breakdowns, 128–140 BPM. Its history, sound, sub-genres, five artists and five tracks.',
  },
  cover: { url: cover.url, credit: `[${cover.author}](${cover.page}) · ${cover.license} · Wikimedia Commons` },
  styles: ['trance', 'psytrance'],
  facts: [
    { label: { vi: 'BPM', en: 'BPM' }, value: { vi: '128–140 (uplifting 136–140)', en: '128–140 (uplifting 136–140)' } },
    { label: { vi: 'Nguồn gốc', en: 'Origin' }, value: { vi: 'Frankfurt, Đức · đầu thập niên 1990', en: 'Frankfurt, Germany · early 1990s' } },
    { label: { vi: 'Nhịp', en: 'Rhythm' }, value: { vi: 'Kick 4/4, bassline off-beat hoặc rolling', en: '4/4 kick, off-beat or rolling bassline' } },
    { label: { vi: 'Âm thanh', en: 'Sound' }, value: { vi: 'Supersaw, arpeggio, pad, breakdown dài và cao trào', en: 'Supersaws, arpeggios, pads, long breakdowns and climaxes' } },
    { label: { vi: 'Nghệ sĩ tiêu biểu', en: 'Key artists' }, value: { vi: 'Paul van Dyk, Ferry Corsten, Tiësto, Armin van Buuren', en: 'Paul van Dyk, Ferry Corsten, Tiësto, Armin van Buuren' } },
    { label: { vi: 'Dòng nhạc gần', en: 'Related' }, value: { vi: 'Techno, Psytrance, Progressive House', en: 'Techno, Psytrance, Progressive House' } },
  ],
  body: {
    vi: `**Trance** là dòng nhạc điện tử ra đời ở Đức đầu thập niên 1990, nổi bật với giai điệu synth bay bổng, breakdown dài và những cao trào cảm xúc. Trance thường chạy ở 128–140 BPM, dùng arpeggio, pad và hợp âm supersaw để đưa người nghe vào trạng thái "trance" mà cái tên gợi ra.

## Trance nghe như thế nào?

- **Kick & drums:** kick 4/4 đều, hi-hat off-beat, snare roll dồn dập trước mỗi cao trào.
- **Bass:** bassline off-beat hoặc rolling bass 16 nốt bám sát kick, giữ năng lượng liên tục.
- **Melody & harmony:** trung tâm của trance. Lead supersaw, arpeggio lấp lánh và chord progression giàu cảm xúc, thường ở giọng thứ.
- **Arrangement:** intro cho DJ mix, phần chính, rồi **breakdown** dài khi kick dừng và giai điệu hiện ra, sau đó build-up và "climax" bùng nổ.
- **Mix & master:** rộng, sáng, nhiều reverb; pad và lead chiếm dải trung cao.

## Lịch sử: từ Frankfurt tới sân khấu thế giới

Những năm đầu của trance gắn với Frankfurt và các label như Eye Q (1991) và Harthouse (1992) do Sven Väth đồng sáng lập. Eye Q theo hướng mềm và giàu giai điệu, Harthouse theo hướng mạnh và acid hơn, với những bản như "Acperience" của Hardfloor. Trance mang trong mình acid house, techno và cả không khí tiệc bãi biển Goa.

Giữa thập niên 1990, trance lan sang Anh và Hà Lan. "For an Angel" của Paul van Dyk (1994) và các bản của Ferry Corsten mở đường cho giai đoạn "epic" cuối thập niên 1990 và 2000. Armin van Buuren bắt đầu chương trình radio *A State of Trance* năm 2001, còn Tiësto biểu diễn trong lễ khai mạc Olympic Athens 2004. Above & Beyond và label Anjunabeats đưa vocal trance tới một thế hệ mới.

${fig('vi')}

## 5 nghệ sĩ trance nên nghe

| Nghệ sĩ | Quốc gia | Vì sao nên nghe | Hồ sơ |
| --- | --- | --- | --- |
| Paul van Dyk | Đức | "For an Angel" là một trong những bản trance định hình thể loại. | [Wikipedia](${wiki('Paul van Dyk')}) |
| Ferry Corsten | Hà Lan | Tiên phong của trance Hà Lan, từ uplifting tới tech trance. | [Wikipedia](${wiki('Ferry Corsten')}) |
| Tiësto | Hà Lan | Đưa trance lên sân vận động và lễ khai mạc Olympic. | [Wikipedia](${wiki('Tiësto')}) |
| Armin van Buuren | Hà Lan | *A State of Trance*: chương trình trance có ảnh hưởng nhất. | [Wikipedia](${wiki('Armin van Buuren')}) |
| Above & Beyond | Anh | Vocal trance giàu cảm xúc, label Anjunabeats. | [Wikipedia](${wiki('Above & Beyond (band)')}) |

## Các sub-genre của trance

| Sub-genre | Điểm khác | BPM | Nghe thử |
| --- | --- | --- | --- |
| Progressive Trance | Phát triển chậm, tinh tế, ít cao trào gắt | 128–134 | Above & Beyond |
| Uplifting Trance | Breakdown dài, supersaw, cao trào "epic" | 136–140 | Ferry Corsten |
| Psytrance | Rolling bass, âm thanh psychedelic | 138–148 | [Xem bài Psytrance](${guide('psytrance', 'vi')}) |
| Goa Trance | Gốc của psytrance, giai điệu phương Đông | 130–150 | Astral Projection |
| Hard Trance | Kick mạnh, acid, năng lượng cao | 140–150 | Trance Đức thập niên 1990 |
| Vocal Trance | Giọng hát dẫn dắt cả bài | 130–138 | Above & Beyond |
| Balearic Trance | Không khí Ibiza, guitar, nhẹ nhàng | 120–130 | Chicane |
| Dream Trance | Giai điệu piano mơ màng | 130–138 | Robert Miles |
| Tech Trance | Lai techno: kick khô, ít giai điệu | 135–142 | Ferry Corsten |

## Trance khác techno thế nào?

| Tiêu chí | Trance | Techno |
| --- | --- | --- |
| Nguồn gốc | Frankfurt, đầu thập niên 1990 | Detroit, giữa thập niên 1980 |
| BPM | 128–140 | 120–150 |
| Giai điệu | Trung tâm: lead, arpeggio, chord | Tối giản, texture |
| Cấu trúc | Breakdown dài, build-up, climax | Lặp, thay đổi bằng filter |
| Cảm xúc | Bay bổng, euphoric | Thôi miên, tối |

## Cách nhận biết trance khi nghe

1. **Chờ breakdown:** kick dừng, pad và giai điệu hiện ra, thường kéo dài 30 giây tới hơn một phút.
2. **Nghe lead:** supersaw dày và arpeggio chạy nhanh là dấu hiệu rõ nhất.
3. **Nghe bass:** off-beat hoặc rolling, không "gầm" như dubstep.
4. **So với psytrance:** trance nhiều giai điệu và chord hơn, psytrance tập trung vào bass và hiệu ứng.

## Nghe trance ở đâu tại châu Á?

Trance có cộng đồng trung thành ở Việt Nam, Thái Lan và Nhật Bản. Xem [lịch trance sắp tới trên FeestFinder](${nights('trance', 'vi')}).

## Đọc tiếp

- [Psytrance là gì?](${guide('psytrance', 'vi')}) Nhánh psychedelic sinh ra từ Goa.
- [Techno là gì?](${guide('techno', 'vi')}) Người anh em máy móc từ Detroit.
- [Mainstage EDM là gì?](${guide('mainstage-edm', 'vi')}) Khi trance gặp big room.`,
    en: `**Trance** is electronic music born in Germany in the early 1990s, known for soaring synth melodies, long breakdowns and emotional climaxes. It usually runs at 128–140 BPM and uses arpeggios, pads and supersaw chords to carry listeners into the "trance" its name promises.

## What does trance sound like?

- **Kick & drums:** a steady 4/4 kick, off-beat hi-hats, rushing snare rolls before every climax.
- **Bass:** an off-beat bassline or a 16th-note rolling bass hugging the kick, keeping the energy up.
- **Melody & harmony:** the heart of trance. Supersaw leads, glittering arpeggios and emotional chord progressions, often in a minor key.
- **Arrangement:** a DJ-friendly intro, the main section, then a long **breakdown** where the kick drops out and the melody appears, followed by a build-up and an explosive climax.
- **Mix & master:** wide, bright, plenty of reverb; pads and leads fill the upper mids.

## History: from Frankfurt to the world's stages

Trance's early years belong to Frankfurt and labels such as Eye Q (1991) and Harthouse (1992), co-founded by Sven Väth. Eye Q leaned soft and melodic, Harthouse harder and more acid, with records like Hardfloor's "Acperience". Trance carried acid house, techno and the spirit of Goa's beach parties.

In the mid-1990s trance spread to the UK and the Netherlands. Paul van Dyk's "For an Angel" (1994) and Ferry Corsten's records paved the way for the "epic" era of the late 1990s and 2000s. Armin van Buuren started his radio show *A State of Trance* in 2001, and Tiësto played the opening ceremony of the Athens 2004 Olympics. Above & Beyond and their Anjunabeats label brought vocal trance to a new generation.

${fig('en')}

## 5 trance artists to know

| Artist | Country | Why listen | Profile |
| --- | --- | --- | --- |
| Paul van Dyk | Germany | "For an Angel" is one of the records that defined the genre. | [Wikipedia](${wiki('Paul van Dyk')}) |
| Ferry Corsten | Netherlands | A pioneer of Dutch trance, from uplifting to tech trance. | [Wikipedia](${wiki('Ferry Corsten')}) |
| Tiësto | Netherlands | Took trance to stadiums and an Olympic opening ceremony. | [Wikipedia](${wiki('Tiësto')}) |
| Armin van Buuren | Netherlands | *A State of Trance*: the most influential trance show. | [Wikipedia](${wiki('Armin van Buuren')}) |
| Above & Beyond | UK | Emotional vocal trance and the Anjunabeats label. | [Wikipedia](${wiki('Above & Beyond (band)')}) |

## Trance sub-genres

| Sub-genre | What sets it apart | BPM | Listen to |
| --- | --- | --- | --- |
| Progressive Trance | Slow-building and subtle, fewer big peaks | 128–134 | Above & Beyond |
| Uplifting Trance | Long breakdowns, supersaws, epic climaxes | 136–140 | Ferry Corsten |
| Psytrance | Rolling bass, psychedelic sound design | 138–148 | [Read the psytrance guide](${guide('psytrance', 'en')}) |
| Goa Trance | Psytrance's root, eastern-tinged melodies | 130–150 | Astral Projection |
| Hard Trance | Hard kicks, acid, high energy | 140–150 | 1990s German trance |
| Vocal Trance | A vocal leads the whole track | 130–138 | Above & Beyond |
| Balearic Trance | Ibiza mood, guitars, gentle | 120–130 | Chicane |
| Dream Trance | Dreamy piano melodies | 130–138 | Robert Miles |
| Tech Trance | Crossed with techno: dry kicks, less melody | 135–142 | Ferry Corsten |

## Trance vs techno

| | Trance | Techno |
| --- | --- | --- |
| Origin | Frankfurt, early 1990s | Detroit, mid-1980s |
| BPM | 128–140 | 120–150 |
| Melody | Central: leads, arpeggios, chords | Minimal, texture |
| Structure | Long breakdown, build-up, climax | Repetition, change through filters |
| Mood | Soaring, euphoric | Hypnotic, dark |

## How to recognise trance

1. **Wait for the breakdown:** the kick stops, pads and melody take over, often for 30 seconds to over a minute.
2. **Listen to the lead:** thick supersaws and fast arpeggios are the clearest sign.
3. **Listen to the bass:** off-beat or rolling, never growling like dubstep.
4. **Compare with psytrance:** trance has more melody and chords, psytrance focuses on bass and effects.

## Where to hear trance in Asia

Trance has loyal communities in Vietnam, Thailand and Japan. See [upcoming trance nights on FeestFinder](${nights('trance', 'en')}).

## Read next

- [What is psytrance?](${guide('psytrance', 'en')}) The psychedelic branch born in Goa.
- [What is techno?](${guide('techno', 'en')}) The mechanical sibling from Detroit.
- [What is mainstage EDM?](${guide('mainstage-edm', 'en')}) Where trance meets big room.`,
  },
  faq: [
    { q: { vi: 'Trance là gì?', en: 'What is trance?' }, a: { vi: 'Trance là dòng nhạc điện tử ra đời ở Đức đầu thập niên 1990, đặc trưng bởi giai điệu synth bay bổng, breakdown dài và cao trào cảm xúc ở khoảng 128–140 BPM.', en: 'Trance is electronic music born in Germany in the early 1990s, defined by soaring synth melodies, long breakdowns and emotional climaxes at around 128–140 BPM.' } },
    { q: { vi: 'Trance bao nhiêu BPM?', en: 'What BPM is trance?' }, a: { vi: 'Thường 128–140 BPM. Uplifting trance hay ở 136–140, progressive trance chậm hơn ở 128–134, còn psytrance thường 138–148.', en: 'Usually 128–140 BPM. Uplifting trance sits at 136–140, progressive trance is slower at 128–134, and psytrance usually runs 138–148.' } },
    { q: { vi: 'Trance khác techno thế nào?', en: 'How is trance different from techno?' }, a: { vi: 'Trance đặt giai điệu và cao trào cảm xúc ở trung tâm, với breakdown dài. Techno tối giản, lặp lại và tập trung vào groove, texture.', en: 'Trance puts melody and emotional climaxes at the centre, with long breakdowns. Techno is minimal and repetitive, focused on groove and texture.' } },
    { q: { vi: 'Người mới nên nghe sub-genre trance nào?', en: 'Which trance sub-genre suits beginners?' }, a: { vi: 'Vocal trance và uplifting trance dễ nghe nhất nhờ giai điệu rõ ràng. Progressive trance hợp với ai thích sự tinh tế, psytrance hợp với ai thích năng lượng liên tục.', en: 'Vocal and uplifting trance are the easiest way in, thanks to clear melodies. Progressive trance suits those who like subtlety, psytrance those who like constant energy.' } },
    { q: { vi: 'Nghệ sĩ trance tiêu biểu là ai?', en: 'Who are the key trance artists?' }, a: { vi: 'Paul van Dyk, Ferry Corsten, Tiësto, Armin van Buuren và Above & Beyond là những cái tên tiêu biểu; ở giai đoạn đầu có Sven Väth và các label Eye Q, Harthouse.', en: 'Paul van Dyk, Ferry Corsten, Tiësto, Armin van Buuren and Above & Beyond are the key names; in the early days, Sven Väth and the Eye Q and Harthouse labels.' } },
  ],
  sources: [
    { title: 'Trance music', url: wiki('Trance music'), publisher: 'Wikipedia' },
    { title: 'Harthouse', url: wiki('Harthouse'), publisher: 'Wikipedia' },
    { title: "Ralf Hildenbeutel: Eye Q, Earth Nation and Frankfurt's 90s trance scene", url: 'https://threadsradio.com/ralf-hildenbeutel-eye-q-earth-nation-and-frankfurts-90s-trance-scene/', publisher: 'Threads Radio' },
    { title: 'Uplifting trance', url: wiki('Uplifting trance'), publisher: 'Wikipedia' },
    { title: 'Nhạc trance', url: 'https://vi.wikipedia.org/wiki/Nh%E1%BA%A1c_trance', publisher: 'Wikipedia tiếng Việt' },
  ],
  tracks: [
    { youtube: '--3eIRSg2RY', artist: 'Paul van Dyk', title: 'For An Angel', year: 1994, channel: 'Paul van Dyk', note: { vi: 'Bản trance kinh điển, vẫn vang lên ở mọi sân khấu sau ba thập kỷ.', en: 'A trance classic still heard on every stage three decades on.' } },
    { youtube: '-4iJ8aCH_oc', artist: 'Ferry Corsten', title: 'Punk', year: 2002, channel: 'Ferry Corsten', note: { vi: 'Năng lượng gắt, lead đặc trưng: trance đầu thập niên 2000.', en: 'Raw energy and a signature lead: early-2000s trance.' } },
    { youtube: '2EaE0_gQLw0', artist: 'Tiësto', title: 'Adagio For Strings', year: 2004, channel: 'Tiësto', note: { vi: 'Tác phẩm của Samuel Barber trong hình hài trance sân vận động.', en: 'Samuel Barber’s piece reborn as stadium trance.' } },
    { youtube: '5GowkwJN-qU', artist: 'Armin van Buuren feat. Susana', title: 'Shivers', year: 2005, channel: 'Armin van Buuren', note: { vi: 'Vocal trance tiêu biểu của Armin.', en: 'Armin’s defining vocal trance record.' } },
    { youtube: 'll5ykbAumD4', artist: 'Above & Beyond feat. Richard Bedford', title: 'Sun & Moon', year: 2011, channel: 'Above & Beyond', note: { vi: 'Một trong những bản vocal trance được yêu thích nhất.', en: 'One of the best-loved vocal trance records.' } },
  ],
};
