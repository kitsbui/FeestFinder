import type { PackPost } from '../../../services/blog-content.ts';
import { figure, guide, MEDIA, nights, wiki } from './media.ts';

const [cover, stage] = MEDIA['mainstage-edm'];
const fig = (lang: 'vi' | 'en') => figure(stage,
  { vi: 'Sân khấu chính Tomorrowland 2017 về đêm', en: 'The Tomorrowland main stage at night, 2017' },
  { vi: 'Sân khấu chính Tomorrowland (Boom, Bỉ) năm 2017: nơi big room từng ngự trị', en: 'Tomorrowland’s main stage in Boom, Belgium, 2017: big room’s home turf' }, lang);

export const mainstageEdm: PackPost = {
  key: 'edm-genres/mainstage-edm',
  slug: 'mainstage-edm',
  category: 'styles',
  lang: 'vi',
  title: {
    vi: 'Mainstage EDM là gì? Big room house, BPM và các nhánh',
    en: 'What is mainstage EDM? Big room house, BPM and styles',
  },
  excerpt: {
    vi: 'Mainstage EDM (big room) là nhạc cho sân khấu chính lễ hội đầu thập niên 2010: 126–132 BPM, build-up dài, drop tối giản, kick nặng. Lịch sử, nghệ sĩ và track.',
    en: 'Mainstage EDM (big room) is festival main-stage music of the early 2010s: 126–132 BPM, long build-ups, minimal drops with heavy kicks. History, artists and tracks.',
  },
  cover: { url: cover.url, credit: `[${cover.author}](${cover.page}) · ${cover.license} · Wikimedia Commons` },
  styles: ['mainstage', 'edm', 'progressive-house', 'electro', 'future-bass'],
  facts: [
    { label: { vi: 'Tên khác', en: 'Also known as' }, value: { vi: 'Big room, festival EDM', en: 'Big room, festival EDM' } },
    { label: { vi: 'BPM', en: 'BPM' }, value: { vi: '126–132 (thường 128)', en: '126–132 (usually 128)' } },
    { label: { vi: 'Nguồn gốc', en: 'Origin' }, value: { vi: 'Hà Lan, Bỉ, Mỹ · khoảng 2010–2013', en: 'Netherlands, Belgium, USA · around 2010–2013' } },
    { label: { vi: 'Nhịp', en: 'Rhythm' }, value: { vi: 'Kick 4/4 nặng, snare roll ở build-up', en: 'Heavy 4/4 kick, snare rolls in the build-up' } },
    { label: { vi: 'Âm thanh', en: 'Sound' }, value: { vi: 'Drop tối giản, synth lead đơn, hiệu ứng riser', en: 'Minimal drops, single synth leads, riser effects' } },
    { label: { vi: 'Nghệ sĩ tiêu biểu', en: 'Key artists' }, value: { vi: 'Martin Garrix, Hardwell, Dimitri Vegas & Like Mike, Afrojack', en: 'Martin Garrix, Hardwell, Dimitri Vegas & Like Mike, Afrojack' } },
  ],
  body: {
    vi: `**Mainstage EDM** (thường gọi là **big room**) là cách gọi chung nhóm nhạc điện tử viết cho sân khấu chính của các lễ hội lớn, bùng nổ đầu thập niên 2010. Big room house chạy quanh 126–132 BPM (thường 128), với build-up dài, snare roll dồn dập và drop tối giản gồm kick nặng cùng một synth lead đơn.

> "Mainstage" không phải một genre học thuật chặt chẽ mà là tên gọi theo nơi biểu diễn. Nó bao gồm big room house, progressive house thời EDM, electro house, Dutch house và nhiều nhánh lai khác. Bài này tập trung vào big room, nhánh tiêu biểu nhất.

## Mainstage EDM nghe như thế nào?

- **Kick & drums:** kick 4/4 rất nặng, thường có "tom" hoặc percussion kiểu bộ lạc ở drop; snare roll tăng tốc trong build-up.
- **Bass:** đơn giản, phục vụ kick; nhiều bản gần như không có bassline ở drop.
- **Melody & harmony:** một synth lead ngắn, dễ nhớ (thường là lead "sừng" hoặc sine biến dạng) thay cho chord phức tạp.
- **Arrangement:** breakdown giàu cảm xúc, build-up với riser và vocal "hô" đám đông, rồi drop tối giản bùng nổ. Hai drop là chuẩn.
- **Mix & master:** cực to, nhiều reverb, kick chiếm dải trầm, tối ưu cho hệ thống loa ngoài trời.

## Lịch sử: thời hoàng kim của lễ hội EDM

Cụm từ "big room" xuất hiện từ cuối thập niên 2000, nhưng âm thanh big room định hình khoảng 2010–2012 với những bản như "Epic" (Sandro Silva & Quintino) và "Cannonball" (Showtek & Justin Prime). Cùng lúc, làn sóng EDM ở Mỹ đưa Ultra, EDC và Electric Zoo thành những lễ hội khổng lồ, còn Tomorrowland ở Bỉ trở thành biểu tượng toàn cầu.

Năm 2013, Martin Garrix khi mới 17 tuổi phát hành "Animals" với drop tối giản chưa từng có, và big room thống trị DJ Mag Top 100: Hardwell đứng đầu năm 2013 và 2014, Martin Garrix đứng đầu các năm 2016–2018. Từ giữa thập niên 2010, mainstage chuyển dần sang future bass, slap house và các bản lai pop, nhưng drop big room vẫn là khoảnh khắc quen thuộc nhất của lễ hội.

${fig('vi')}

## 5 nghệ sĩ mainstage nên nghe

| Nghệ sĩ | Quốc gia | Vì sao nên nghe | Hồ sơ |
| --- | --- | --- | --- |
| Afrojack | Hà Lan | Dutch house với lead cao, swing đặc trưng. | [Wikipedia](${wiki('Afrojack')}) |
| Steve Aoki | Mỹ | Năng lượng sân khấu và electro house thời EDM. | [Wikipedia](${wiki('Steve Aoki')}) |
| Hardwell | Hà Lan | DJ số 1 thế giới (DJ Mag) năm 2013 và 2014. | [Wikipedia](${wiki('Hardwell')}) |
| Dimitri Vegas & Like Mike | Bỉ | Gắn liền với sân khấu chính Tomorrowland. | [Wikipedia](${wiki('Dimitri Vegas & Like Mike')}) |
| Martin Garrix | Hà Lan | "Animals" định nghĩa drop big room. | [Wikipedia](${wiki('Martin Garrix')}) |

## Các nhánh của mainstage EDM

| Nhánh | Điểm khác | BPM | Nghe thử |
| --- | --- | --- | --- |
| Big Room House | Drop tối giản, kick nặng, lead đơn | 126–132 | Martin Garrix |
| Progressive House (thời EDM) | Chord cảm xúc, vocal, build dài | 126–130 | Swedish House Mafia, Avicii |
| Electro House | Bass synth "bẩn", gai góc | 126–130 | Steve Aoki |
| Dutch House | Lead cao chói, swing, percussion | 126–130 | Afrojack |
| Melbourne Bounce | Bassline off-beat nảy | 126–130 | [Xem bài Bounce](${guide('bounce', 'vi')}) |
| Slap House / Brazilian Bass | Bass trầm "slap", vocal pop | 120–126 | Alok, Imanbek |
| Future Bass | Chord supersaw lắc, half-time | 130–160 | Flume |
| Big Room Trance | Big room với breakdown trance | 128–132 | Armin van Buuren (giai đoạn 2010s) |

## Big room khác progressive house thế nào?

| Tiêu chí | Big Room | Progressive House |
| --- | --- | --- |
| Drop | Tối giản, kick và lead | Giàu chord và giai điệu |
| Cảm xúc | Bùng nổ, "đập" | Bay bổng, ấm |
| Build-up | Snare roll, riser, hô đám đông | Tăng dần, mượt |
| Ví dụ | "Animals" | Swedish House Mafia |

## Cách nhận biết mainstage EDM khi nghe

1. **Nghe build-up:** snare roll tăng tốc, riser và câu hô "put your hands up".
2. **Nghe drop:** gần như chỉ có kick và một lead ngắn.
3. **Đếm nhịp:** khoảng 128 BPM.
4. **So với progressive:** big room ít chord, nhiều "cú đấm" hơn.

## DJ mix mainstage EDM thế nào?

Set mainstage được dựng cho đám đông lớn và những khoảnh khắc lớn, nên DJ mix từ drop sang drop.

1. **Thuộc cấu trúc.** Phần lớn track đi theo intro, build-up, drop, breakdown, build-up thứ hai và drop thứ hai, theo phrase 8 và 16 bar.
2. **Đổi bài ở build-up.** Bài sau thường vào ngay trong build-up, để drop của nó tới đúng lúc đám đông chờ một cú drop.
3. **Edit và mashup.** DJ lễ hội chuẩn bị phiên bản của riêng mình: vocal của bài này trên drop của bài kia, hoặc một bản edit ngắn hơn giữ cho set luôn chạy.
4. **Giữ quanh 128.** Phần lớn dòng nhạc nằm quanh 128 BPM, nên dễ đi qua lại giữa big room, progressive house và electro house.

Một set mainstage cũng là một buổi diễn, với ánh sáng, pháo hoa và hình ảnh canh đúng từng cú drop.

## Nghe mainstage EDM ở đâu tại châu Á?

Các lễ hội lớn ở Việt Nam, Thái Lan, Singapore và Nhật Bản luôn có sân khấu mainstage. Xem [lịch mainstage sắp tới trên FeestFinder](${nights('mainstage', 'vi')}).

## Đọc tiếp

- [Bounce là gì?](${guide('bounce', 'vi')}) Melbourne bounce, người anh em vui nhộn của big room.
- [Bass House là gì?](${guide('bass-house', 'vi')}) Âm thanh house nặng bass của các lễ hội.
- [Trance là gì?](${guide('trance', 'vi')}) Big room trance và nguồn cội của nó.`,
    en: `**Mainstage EDM** (often called **big room**) is the umbrella name for electronic music written for the main stages of big festivals, which exploded in the early 2010s. Big room house runs around 126–132 BPM (usually 128), with long build-ups, rushing snare rolls and minimal drops of a heavy kick and a single synth lead.

> "Mainstage" is not a strict musicological genre but a name taken from where the music is played. It covers big room house, EDM-era progressive house, electro house, Dutch house and many hybrids. This guide focuses on big room, its most typical branch.

## What does mainstage EDM sound like?

- **Kick & drums:** a very heavy 4/4 kick, often with toms or tribal percussion in the drop; snare rolls accelerate through the build-up.
- **Bass:** simple, serving the kick; many drops have almost no bassline.
- **Melody & harmony:** a short, catchy synth lead (often a horn-like lead or a distorted sine) instead of complex chords.
- **Arrangement:** an emotional breakdown, a build-up with risers and crowd-chant vocals, then an explosive minimal drop. Two drops are standard.
- **Mix & master:** extremely loud, reverb-heavy, the kick owns the low end, built for outdoor sound systems.

## History: the golden age of festival EDM

The phrase "big room" appeared in the late 2000s, but the big room sound took shape around 2010–2012 with records such as "Epic" (Sandro Silva & Quintino) and "Cannonball" (Showtek & Justin Prime). At the same time the US EDM boom turned Ultra, EDC and Electric Zoo into giant festivals, and Belgium's Tomorrowland became a global icon.

In 2013 Martin Garrix, aged 17, released "Animals" with an unprecedented minimal drop, and big room dominated the DJ Mag Top 100: Hardwell topped it in 2013 and 2014, Martin Garrix in 2016–2018. From the mid-2010s the main stage drifted towards future bass, slap house and pop crossovers, but the big room drop is still the most familiar moment of a festival.

${fig('en')}

## 5 mainstage artists to know

| Artist | Country | Why listen | Profile |
| --- | --- | --- | --- |
| Afrojack | Netherlands | Dutch house with high-pitched leads and swing. | [Wikipedia](${wiki('Afrojack')}) |
| Steve Aoki | USA | Stage energy and EDM-era electro house. | [Wikipedia](${wiki('Steve Aoki')}) |
| Hardwell | Netherlands | DJ Mag's number one DJ in 2013 and 2014. | [Wikipedia](${wiki('Hardwell')}) |
| Dimitri Vegas & Like Mike | Belgium | Synonymous with Tomorrowland's main stage. | [Wikipedia](${wiki('Dimitri Vegas & Like Mike')}) |
| Martin Garrix | Netherlands | "Animals" defined the big room drop. | [Wikipedia](${wiki('Martin Garrix')}) |

## Mainstage EDM styles

| Style | What sets it apart | BPM | Listen to |
| --- | --- | --- | --- |
| Big Room House | Minimal drops, heavy kick, single lead | 126–132 | Martin Garrix |
| Progressive House (EDM era) | Emotional chords, vocals, long builds | 126–130 | Swedish House Mafia, Avicii |
| Electro House | Dirty, gritty synth bass | 126–130 | Steve Aoki |
| Dutch House | Shrill high leads, swing, percussion | 126–130 | Afrojack |
| Melbourne Bounce | Bouncy off-beat bassline | 126–130 | [Read the bounce guide](${guide('bounce', 'en')}) |
| Slap House / Brazilian Bass | Deep "slap" bass, pop vocals | 120–126 | Alok, Imanbek |
| Future Bass | Wobbling supersaw chords, half-time | 130–160 | Flume |
| Big Room Trance | Big room with trance breakdowns | 128–132 | 2010s Armin van Buuren |

## Big room vs progressive house

| | Big Room | Progressive House |
| --- | --- | --- |
| Drop | Minimal: kick and lead | Rich in chords and melody |
| Mood | Explosive, hard-hitting | Soaring, warm |
| Build-up | Snare rolls, risers, crowd chants | Gradual, smooth |
| Example | "Animals" | Swedish House Mafia |

## How to recognise mainstage EDM

1. **Listen to the build-up:** accelerating snare rolls, risers and a "put your hands up" chant.
2. **Listen to the drop:** little more than a kick and a short lead.
3. **Count the tempo:** about 128 BPM.
4. **Compare with progressive:** big room has fewer chords and more punch.

## How do DJs mix mainstage EDM?

Mainstage sets are built for big crowds and big moments, so DJs mix from drop to drop.

1. **Know the structure.** Most tracks follow intro, build-up, drop, breakdown, a second build-up and a second drop, in phrases of 8 and 16 bars.
2. **Change on the build-up.** The next track often comes in during a build-up, so its drop arrives right where the crowd expects one.
3. **Edits and mashups.** Festival DJs prepare their own versions: a vocal from one song over the drop of another, or a shorter edit that keeps the set moving.
4. **Stay around 128.** Most of the style sits around 128 BPM, which makes it easy to move between big room, progressive house and electro house.

A mainstage set is also a show, with lights, pyrotechnics and visuals timed to the drops, so the DJ often plans the order of the set with the production team well before the festival.

## Where to hear mainstage EDM in Asia

The big festivals in Vietnam, Thailand, Singapore and Japan always have a mainstage. See [upcoming mainstage nights on FeestFinder](${nights('mainstage', 'en')}).

## Read next

- [What is bounce?](${guide('bounce', 'en')}) Melbourne bounce, big room's playful sibling.
- [What is bass house?](${guide('bass-house', 'en')}) The bass-heavy house of the festivals.
- [What is trance?](${guide('trance', 'en')}) Big room trance and where it came from.`,
  },
  faq: [
    { q: { vi: 'Mainstage EDM là gì?', en: 'What is mainstage EDM?' }, a: { vi: 'Mainstage EDM là cách gọi chung nhạc điện tử viết cho sân khấu chính lễ hội; tiêu biểu nhất là big room house ở khoảng 128 BPM với build-up dài và drop tối giản.', en: 'Mainstage EDM is the umbrella name for electronic music written for festival main stages; its typical form is big room house at around 128 BPM with long build-ups and minimal drops.' } },
    { q: { vi: 'Big room bao nhiêu BPM?', en: 'What BPM is big room?' }, a: { vi: 'Thường 126–132 BPM, phổ biến nhất là 128 BPM. Tempo gần với house; cảm giác “khổng lồ” đến từ build-up dài, một khoảng lặng ngắn và drop dựa trên kick nặng cùng một lead đơn giản.', en: 'Usually 126–132 BPM, most commonly 128 BPM. The tempo is close to house; the sense of scale comes from long build-ups, a short pause and a drop built on a heavy kick and a simple lead.' } },
    { q: { vi: 'Mainstage có phải một genre không?', en: 'Is mainstage a genre?' }, a: { vi: 'Không hẳn. "Mainstage" là tên gọi theo nơi biểu diễn, gồm big room, progressive house thời EDM, electro house, Dutch house và các nhánh lai.', en: 'Not strictly. "Mainstage" is named after where it is played and covers big room, EDM-era progressive house, electro house, Dutch house and hybrids.' } },
    { q: { vi: 'Bản big room nổi tiếng nhất là gì?', en: 'What is the most famous big room track?' }, a: { vi: '"Animals" của Martin Garrix (2013) thường được xem là bản big room tiêu biểu nhất nhờ drop tối giản mang tính biểu tượng.', en: 'Martin Garrix’s "Animals" (2013) is usually seen as the definitive big room track for its iconic minimal drop.' } },
    { q: { vi: 'Nghệ sĩ mainstage tiêu biểu là ai?', en: 'Who are the key mainstage artists?' }, a: { vi: 'Martin Garrix, Hardwell, Dimitri Vegas & Like Mike, Afrojack, Steve Aoki, cùng Swedish House Mafia và Avicii ở nhánh progressive house.', en: 'Martin Garrix, Hardwell, Dimitri Vegas & Like Mike, Afrojack and Steve Aoki, with Swedish House Mafia and Avicii on the progressive house side.' } },
  ],
  sources: [
    { title: 'Big room house', url: wiki('Big room house'), publisher: 'Wikipedia' },
    { title: 'Big room: the evolution of house music', url: 'https://recordingarts.com/record/evolution-of-house-music/big-room', publisher: 'Recording Arts' },
    { title: 'Electronic dance music', url: wiki('Electronic dance music'), publisher: 'Wikipedia' },
    { title: 'Progressive house', url: wiki('Progressive house'), publisher: 'Wikipedia' },
    { title: 'Dutch house', url: wiki('Dutch house'), publisher: 'Wikipedia' },
    { title: 'Beatport launches Mainstage, a new genre inspired by the festival experience', url: 'https://www.beatportal.com/articles/350255-beatport-launches-mainstage-a-new-genre-inspired-by-the-festival-experience', publisher: 'Beatportal' },
  ],
  tracks: [
    { youtube: 'Qh9_UM961aE', artist: 'Afrojack feat. Eva Simons', title: 'Take Over Control', year: 2010, channel: 'Afrojack', note: { vi: 'Dutch house gặp pop: lead cao và vocal dễ nhớ.', en: 'Dutch house meets pop: a high lead and a catchy vocal.' } },
    { youtube: 'gl2p4G3CUrI', artist: 'Steve Aoki, Chris Lake & Tujamo', title: 'Boneless', year: 2011, channel: 'Ultra Records', note: { vi: 'Electro house tối giản, một trong những bản "đập" nhất thời EDM.', en: 'Minimal electro house, one of the hardest-hitting records of the EDM era.' } },
    { youtube: 'XGedo4rM9lU', artist: 'Hardwell', title: 'Spaceman', year: 2012, channel: 'Hardwell - Topic', note: { vi: 'Lead vang khắp lễ hội: big room thời đầu.', en: 'A lead that rang through every festival: early big room.' } },
    { youtube: '_o-XIryB2gg', artist: 'Dimitri Vegas, MOGUAI & Like Mike', title: 'Mammoth', year: 2013, channel: "Spinnin' Records", note: { vi: 'Drop "voi ma mút" gắn với sân khấu Tomorrowland.', en: 'The "mammoth" drop tied to the Tomorrowland stage.' } },
    { youtube: 'IPYTxAHeR_o', artist: 'Martin Garrix', title: 'Animals', year: 2013, channel: 'Martin Garrix', note: { vi: 'Drop tối giản định nghĩa cả một thời big room.', en: 'The minimal drop that defined the big room era.' } },
  ],
};
