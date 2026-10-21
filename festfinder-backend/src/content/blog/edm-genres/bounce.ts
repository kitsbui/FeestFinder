import type { PackPost } from '../../../services/blog-content.ts';
import { figure, guide, MEDIA, nights, wiki } from './media.ts';

const [cover, stage] = MEDIA.bounce;
const fig = (lang: 'vi' | 'en') => figure(stage,
  { vi: 'Sân khấu chính Tomorrowland 2018', en: 'The Tomorrowland main stage, 2018' },
  { vi: 'Bounce và big room cùng nhau thống trị sân khấu lễ hội đầu thập niên 2010 (Tomorrowland 2018)', en: 'Bounce and big room ruled festival stages together in the early 2010s (Tomorrowland 2018)' }, lang);

export const bounce: PackPost = {
  key: 'edm-genres/bounce',
  slug: 'bounce',
  category: 'styles',
  lang: 'vi',
  title: {
    vi: 'Bounce là gì? Melbourne bounce, BPM và các nhánh bounce',
    en: 'What is bounce? Melbourne bounce, BPM and its branches',
  },
  excerpt: {
    vi: 'Bounce (Melbourne bounce) là electro house ra đời ở Úc đầu thập niên 2010: bassline off-beat nảy, lead kiểu Dutch house, 126–130 BPM. Lịch sử, nghệ sĩ và track.',
    en: 'Melbourne bounce is electro house born in Australia in the early 2010s: a bouncy off-beat bassline, Dutch-style leads, 126–130 BPM. Its history, artists and tracks.',
  },
  cover: { url: cover.url, credit: `[${cover.author}](${cover.page}) · ${cover.license} · Wikimedia Commons` },
  styles: ['mainstage', 'edm', 'electro'],
  facts: [
    { label: { vi: 'Tên khác', en: 'Also known as' }, value: { vi: 'Melbourne bounce', en: 'Melbourne bounce' } },
    { label: { vi: 'BPM', en: 'BPM' }, value: { vi: '126–130 (thường 128)', en: '126–130 (usually 128)' } },
    { label: { vi: 'Nguồn gốc', en: 'Origin' }, value: { vi: 'Melbourne, Úc · đầu thập niên 2010', en: 'Melbourne, Australia · early 2010s' } },
    { label: { vi: 'Nhịp', en: 'Rhythm' }, value: { vi: 'Kick 4/4, bassline off-beat ngắn và nảy', en: '4/4 kick, short bouncy off-beat bassline' } },
    { label: { vi: 'Âm thanh', en: 'Sound' }, value: { vi: 'Lead "sừng" kiểu Dutch house, sample vui nhộn', en: 'Dutch house-style horn leads, playful samples' } },
    { label: { vi: 'Nghệ sĩ tiêu biểu', en: 'Key artists' }, value: { vi: 'Will Sparks, Joel Fletcher, TJR, Timmy Trumpet', en: 'Will Sparks, Joel Fletcher, TJR, Timmy Trumpet' } },
  ],
  body: {
    vi: `**Bounce**, thường là nói tới **Melbourne bounce**, là phong cách electro house ra đời ở Melbourne (Úc) đầu thập niên 2010, với bassline off-beat ngắn và "nảy" trên nền kick 4/4 cùng synth lead kiểu Dutch house. Bounce thường ở 126–130 BPM (hay gặp 128), vui nhộn, nhiều sample và rất hợp không khí tiệc.

> "Bounce" cũng được dùng như một tên gọi chung cho các phong cách có bassline nhảy nhót, từ Melbourne bounce tới Brazilian bass hay psy bounce. Bài này tập trung vào Melbourne bounce, nhánh gốc và phổ biến nhất.

## Bounce nghe như thế nào?

- **Kick & drums:** kick 4/4 gọn, clap mạnh, percussion lấp lánh.
- **Bass:** dấu ấn của bounce. Bassline off-beat ngắn, nhấn lệch phách làm cả bài như đang nhún lên xuống; tempo hơi nhanh hơn electro house giúp bass "nảy" hơn.
- **Melody & harmony:** lead "sừng" (horn) học từ Dutch house, hook đơn giản, nhiều sample hô hào hoặc tiếng động vui nhộn.
- **Arrangement:** build-up ngắn, drop nơi bassline và lead thay phiên nhau; nhiều remix bounce lấy từ các bản pop nổi tiếng.
- **Mix & master:** sáng và to, dải trung của lead nổi bật.

## Lịch sử: từ club Melbourne ra thế giới

Những người tiên phong như **Will Sparks** và **Joel Fletcher** định hình âm thanh này trong các club ở Melbourne quanh năm 2012. "Ah Yeah!" của Will Sparks được tạp chí In the Mix ghi nhận là bản khai sinh xu hướng Melbourne bounce. Từ giữa năm 2013, bounce lan sang Mỹ và châu Âu: TJR với "Ode to Oi", Deorro với "Five Hours", và Timmy Trumpet cùng Savage với "Freaks" (2014) trở thành hiện tượng toàn cầu.

Sau đó bounce tách thành nhiều nhánh: psy bounce mượn rolling bass của psytrance, hard bounce mượn kick của hardstyle, còn Brazilian bass và slap house mang tinh thần "bass nảy" sang tempo chậm hơn.

${fig('vi')}

## 5 nghệ sĩ bounce nên nghe

| Nghệ sĩ | Quốc gia | Vì sao nên nghe | Hồ sơ |
| --- | --- | --- | --- |
| Will Sparks | Úc | "Ah Yeah!" khai sinh làn sóng Melbourne bounce. | [Wikipedia](${wiki('Will Sparks')}) |
| TJR | Mỹ | "Ode to Oi" đưa bounce tới khán giả Mỹ. | [Wikipedia](${wiki('TJR (DJ)')}) |
| Joel Fletcher | Úc | Một trong những người tiên phong ở Melbourne. | [YouTube](https://www.youtube.com/@JoelFletcher) |
| Timmy Trumpet | Úc | Kèn trumpet sống trên sân khấu, "Freaks" toàn cầu. | [Wikipedia](${wiki('Timmy Trumpet')}) |
| Deorro | Mỹ | "Five Hours": giai điệu lễ hội không thể quên. | [Wikipedia](${wiki('Deorro')}) |

## Các nhánh của bounce

| Nhánh | Điểm khác | BPM | Nghe thử |
| --- | --- | --- | --- |
| Melbourne Bounce | Bassline off-beat nảy, lead Dutch house | 126–130 | Will Sparks |
| Dutch Bounce | Gần Dutch house: lead cao, swing | 126–130 | Dòng Dutch house |
| Brazilian Bounce / Slap House | Bass trầm "slap", chậm hơn, vocal pop | 120–126 | Alok |
| Hard Bounce | Kick mạnh kiểu hard dance | 130–150 | Dòng hard bounce |
| Psy Bounce | Rolling bass psytrance trên nền bounce | 128–132 | Timmy Trumpet (giai đoạn psy) |
| Bounce House | Bounce mềm hơn, groove house | 124–128 | Dòng bounce house |

## Bounce khác big room thế nào?

| Tiêu chí | Melbourne Bounce | Big Room |
| --- | --- | --- |
| Bass | Off-beat, nảy, chủ đạo | Ít bass, kick làm chủ |
| Lead | Sừng Dutch house, vui | Lead ngắn, mạnh |
| Cảm giác | Tiệc tùng, nhún nhảy | Bùng nổ, "đập" |
| Gốc | Club Melbourne | Lễ hội Hà Lan, Bỉ, Mỹ |

## Cách nhận biết bounce khi nghe

1. **Nghe bass:** lệch phách, ngắn, khiến bạn muốn nhún lên xuống.
2. **Nghe lead:** chói, kiểu kèn, giai điệu đơn giản.
3. **Đếm nhịp:** khoảng 128 BPM.
4. **So với big room:** bounce vui và nhiều bass hơn, big room nặng kick hơn.

## DJ mix bounce thế nào?

Bounce chung tempo với big room, khoảng 126–130 BPM, và được mix theo cùng một kiểu ngắn gọn, nhiều năng lượng.

1. **Chuyển bài nhanh.** Đoạn chồng ngắn, thường 8 hoặc 16 bar, vì hai bassline nảy cùng lúc sẽ rối.
2. **Dựa vào sample.** Tiếng hô và sample vocal là một phần của phong cách, và DJ dùng chúng làm cầu nối từ bài này sang bài sau.
3. **Mix cùng các dòng hàng xóm.** Bounce đứng cạnh big room và electro house rất hợp trong set lễ hội, và về sau cạnh cả slap house.
4. **Chơi những cú drop.** Bassline off-beat là thứ người ta nhảy theo, nên DJ để các drop nối nhau thật gần.

Bounce bắt đầu từ các club ở Melbourne, nên nhiều set vẫn mang không khí một đêm tiệc hơn là một màn trình diễn ánh sáng. Phần lớn track bounce ngắn, khoảng ba tới bốn phút, nên một set đi qua rất nhiều bài. Nhiều DJ còn chơi bản edit bounce của chính họ cho các bài pop và bài lễ hội, một lý do khiến phong cách này lan nhanh trên các sân khấu lễ hội đầu thập niên 2010.

## Nghe bounce ở đâu tại châu Á?

Bounce và các remix bounce xuất hiện nhiều trong các đêm EDM và lễ hội ở Việt Nam, Thái Lan và Úc gần kề. Xem [lịch mainstage và EDM sắp tới trên FeestFinder](${nights('mainstage', 'vi')}).

## Đọc tiếp

- [Mainstage EDM là gì?](${guide('mainstage-edm', 'vi')}) Big room, người anh em của bounce.
- [Psytrance là gì?](${guide('psytrance', 'vi')}) Nguồn rolling bass của psy bounce.
- [Hardstyle là gì?](${guide('hardstyle', 'vi')}) Nguồn kick của hard bounce.`,
    en: `**Bounce**, usually meaning **Melbourne bounce**, is a style of electro house born in Melbourne, Australia, in the early 2010s, with a short, bouncy off-beat bassline over a 4/4 kick and Dutch house-style synth leads. It usually runs at 126–130 BPM (often 128), playful and sample-heavy, made for parties.

> "Bounce" is also used as an umbrella for styles with a jumping bassline, from Melbourne bounce to Brazilian bass and psy bounce. This guide focuses on Melbourne bounce, the original and most popular branch.

## What does bounce sound like?

- **Kick & drums:** a tight 4/4 kick, a strong clap, sparkling percussion.
- **Bass:** bounce's signature. A short off-beat bassline that makes the whole track feel like it is jumping; a tempo slightly above electro house gives the bass extra spring.
- **Melody & harmony:** horn-like leads borrowed from Dutch house, simple hooks, plenty of shout samples and playful sounds.
- **Arrangement:** a short build-up and a drop where bassline and lead take turns; many bounce remixes are built on famous pop songs.
- **Mix & master:** bright and loud, with the lead's mids up front.

## History: from Melbourne clubs to the world

Pioneers such as **Will Sparks** and **Joel Fletcher** shaped the sound in Melbourne's clubs around 2012. Will Sparks's "Ah Yeah!" was credited by In the Mix magazine with giving rise to Melbourne bounce. From mid-2013 bounce spread to the US and Europe: TJR's "Ode to Oi", Deorro's "Five Hours", and Timmy Trumpet and Savage's "Freaks" (2014) became global hits.

Bounce then branched out: psy bounce borrowed psytrance's rolling bass, hard bounce borrowed hardstyle's kick, and Brazilian bass and slap house carried the "bouncing bass" idea to slower tempos.

${fig('en')}

## 5 bounce artists to know

| Artist | Country | Why listen | Profile |
| --- | --- | --- | --- |
| Will Sparks | Australia | "Ah Yeah!" started the Melbourne bounce wave. | [Wikipedia](${wiki('Will Sparks')}) |
| TJR | USA | "Ode to Oi" brought bounce to American crowds. | [Wikipedia](${wiki('TJR (DJ)')}) |
| Joel Fletcher | Australia | One of Melbourne's pioneers. | [YouTube](https://www.youtube.com/@JoelFletcher) |
| Timmy Trumpet | Australia | A live trumpet on stage and the global hit "Freaks". | [Wikipedia](${wiki('Timmy Trumpet')}) |
| Deorro | USA | "Five Hours": an unforgettable festival melody. | [Wikipedia](${wiki('Deorro')}) |

## Bounce branches

| Branch | What sets it apart | BPM | Listen to |
| --- | --- | --- | --- |
| Melbourne Bounce | Bouncy off-beat bass, Dutch house leads | 126–130 | Will Sparks |
| Dutch Bounce | Close to Dutch house: high leads, swing | 126–130 | The Dutch house scene |
| Brazilian Bounce / Slap House | Deep "slap" bass, slower, pop vocals | 120–126 | Alok |
| Hard Bounce | Hard dance-style kicks | 130–150 | The hard bounce scene |
| Psy Bounce | Psytrance rolling bass over bounce | 128–132 | Timmy Trumpet (psy era) |
| Bounce House | Softer bounce, house groove | 124–128 | The bounce house scene |

## Bounce vs big room

| | Melbourne Bounce | Big Room |
| --- | --- | --- |
| Bass | Off-beat, bouncy, leading | Little bass, the kick leads |
| Lead | Dutch house horns, playful | Short, powerful lead |
| Feel | Party, jumping | Explosive, hard-hitting |
| Roots | Melbourne clubs | Dutch, Belgian and US festivals |

## How to recognise bounce

1. **Listen to the bass:** off-beat and short, it makes you want to jump.
2. **Listen to the lead:** shrill and horn-like, with a simple melody.
3. **Count the tempo:** about 128 BPM.
4. **Compare with big room:** bounce is more playful and bass-led, big room is heavier on the kick.

## How do DJs mix bounce?

Bounce shares its tempo with big room, about 126–130 BPM, and it is mixed in the same short, energetic way.

1. **Quick transitions.** Overlaps are short, often 8 or 16 bars, because two bouncy basslines at once get crowded.
2. **Lean on samples.** Vocal shouts and samples are part of the style, and DJs use them to bridge one track into the next.
3. **Mix with neighbours.** Bounce sits well next to big room and electro house in festival sets, and in later years next to slap house too.
4. **Play the drops.** The off-beat bass is what people dance to, so DJs keep the drops close together.

Bounce began in Melbourne's clubs, so many sets still feel like a party night rather than a light show. A bounce DJ reads the room quickly: if the crowd is jumping, the next drop comes sooner, and if it needs a break, a vocal hook or a familiar sample brings it back. Most bounce tracks are short, around three to four minutes, so a set moves through many records. Many DJs also play their own bounce edits of pop and festival songs, which is part of why the style spread so fast on festival stages in the early 2010s.

## Where to hear bounce in Asia

Bounce and bounce remixes are all over EDM nights and festivals in Vietnam, Thailand and nearby Australia. See [upcoming mainstage and EDM nights on FeestFinder](${nights('mainstage', 'en')}).

## Read next

- [What is mainstage EDM?](${guide('mainstage-edm', 'en')}) Big room, bounce's sibling.
- [What is psytrance?](${guide('psytrance', 'en')}) Where psy bounce's rolling bass comes from.
- [What is hardstyle?](${guide('hardstyle', 'en')}) Where hard bounce's kick comes from.`,
  },
  faq: [
    { q: { vi: 'Bounce là gì?', en: 'What is bounce?' }, a: { vi: 'Bounce (Melbourne bounce) là phong cách electro house ra đời ở Melbourne, Úc đầu thập niên 2010, với bassline off-beat ngắn, nảy và lead kiểu Dutch house ở khoảng 128 BPM.', en: 'Bounce (Melbourne bounce) is a style of electro house born in Melbourne, Australia, in the early 2010s, with a short, bouncy off-beat bassline and Dutch house-style leads at around 128 BPM.' } },
    { q: { vi: 'Bounce bao nhiêu BPM?', en: 'What BPM is bounce?' }, a: { vi: 'Thường 126–130 BPM, phổ biến nhất là 128 BPM; hard bounce có thể nhanh hơn nhiều.', en: 'Usually 126–130 BPM, most commonly 128; hard bounce can be much faster.' } },
    { q: { vi: 'Ai khai sinh Melbourne bounce?', en: 'Who created Melbourne bounce?' }, a: { vi: 'Will Sparks thường được ghi nhận là người khai sinh với "Ah Yeah!", cùng Joel Fletcher và các DJ Melbourne khác trong cùng thời gian.', en: 'Will Sparks is usually credited with "Ah Yeah!", alongside Joel Fletcher and other Melbourne DJs of the same time.' } },
    { q: { vi: 'Bounce có phải một genre riêng không?', en: 'Is bounce a genre of its own?' }, a: { vi: 'Melbourne bounce là một nhánh của electro house; "bounce" theo nghĩa rộng là tên gọi chung cho các phong cách có bassline nảy.', en: 'Melbourne bounce is a branch of electro house; "bounce" in the broad sense is an umbrella for styles with a bouncing bassline.' } },
    { q: { vi: 'Bản bounce nổi tiếng nhất là gì?', en: 'What is the best-known bounce track?' }, a: { vi: '"Freaks" của Timmy Trumpet và Savage (2014) và "Ah Yeah!" của Will Sparks là hai bản tiêu biểu nhất.', en: 'Timmy Trumpet and Savage’s "Freaks" (2014) and Will Sparks’s "Ah Yeah!" are the two defining records.' } },
  ],
  sources: [
    { title: 'Melbourne bounce', url: wiki('Melbourne bounce'), publisher: 'Wikipedia' },
    { title: 'Ah Yeah!', url: wiki('Ah Yeah!'), publisher: 'Wikipedia' },
    { title: 'Did Melbourne bounce really start in Melbourne?', url: 'https://bassgorilla.com/did-melbourne-bounce-really-start-in-melbourne/', publisher: 'Bass Gorilla' },
    { title: 'Electro house', url: wiki('Electro house'), publisher: 'Wikipedia' },
    { title: 'Slap house', url: wiki('Slap house'), publisher: 'Wikipedia' },
    { title: 'EDMTunes interview: Will Sparks', url: 'https://www.edmtunes.com/2013/08/26/edmtunes-interview-will-sparks/', publisher: 'EDMTunes' },
  ],
  tracks: [
    { youtube: 'VhFvRGK4pVY', artist: 'Will Sparks', title: 'Ah Yeah!', channel: 'TMRW Music', note: { vi: 'Bản khai sinh làn sóng Melbourne bounce.', en: 'The record that started the Melbourne bounce wave.' } },
    { youtube: 'ApK40NcgB6M', artist: 'TJR', title: 'Ode To Oi', year: 2013, channel: 'TJR - Topic', note: { vi: 'Bassline nảy và sample "Oi" quen thuộc khắp lễ hội.', en: 'A bouncing bassline and the "Oi" sample every festival knows.' } },
    { youtube: 'Bq7ZeDCEzmw', artist: 'Joel Fletcher & Savage', title: 'Swing', year: 2013, channel: 'Embassy One', note: { vi: 'Melbourne bounce nguyên bản từ một người tiên phong.', en: 'Original Melbourne bounce from one of its pioneers.' } },
    { youtube: 'ofmzX1nI7SE', artist: 'Timmy Trumpet & Savage', title: 'Freaks', year: 2014, channel: 'TMRW Music', note: { vi: 'Hiện tượng toàn cầu, vẫn làm bùng nổ mọi đám đông.', en: 'A global phenomenon that still sets every crowd off.' } },
    { youtube: 'K_yBUfMGvzc', artist: 'Deorro', title: 'Five Hours', year: 2014, channel: 'PRMD Music', note: { vi: 'Giai điệu lễ hội dễ nhớ ngay lần đầu.', en: 'A festival melody that sticks the first time.' } },
  ],
};
