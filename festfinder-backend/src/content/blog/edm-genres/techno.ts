import type { PackPost } from '../../../services/blog-content.ts';
import { figure, guide, MEDIA, nights, wiki } from './media.ts';

const [cover, stage] = MEDIA.techno;
const fig = (lang: 'vi' | 'en') => figure(stage,
  { vi: 'Sân khấu chính Detroit Electronic Music Festival 2002 về đêm', en: 'The Detroit Electronic Music Festival main stage at night, 2002' },
  { vi: 'Detroit Electronic Music Festival 2002 ở Hart Plaza, tiền thân của lễ hội Movement', en: 'Detroit Electronic Music Festival 2002 at Hart Plaza, the forerunner of Movement' }, lang);

export const techno: PackPost = {
  key: 'edm-genres/techno',
  slug: 'techno',
  category: 'styles',
  lang: 'vi',
  title: {
    vi: 'Techno là gì? BPM, nguồn gốc Detroit và các sub-genre',
    en: 'What is techno? BPM, Detroit roots and sub-genres',
  },
  excerpt: {
    vi: 'Techno ra đời ở Detroit giữa thập niên 1980: kick 4/4, groove lặp thôi miên, 120–150 BPM. Nguồn gốc, đặc trưng, sub-genre, 5 nghệ sĩ và 5 track nên nghe.',
    en: 'Techno was born in Detroit in the mid-1980s: a 4/4 kick, hypnotic repetition, 120–150 BPM. Its roots, sound, sub-genres, five artists and five tracks to start with.',
  },
  cover: { url: cover.url, credit: `[${cover.author}](${cover.page}) · ${cover.license} · Wikimedia Commons` },
  styles: ['techno', 'melodic-techno', 'hard-techno', 'minimal', 'acid-techno', 'industrial-techno'],
  facts: [
    { label: { vi: 'BPM', en: 'BPM' }, value: { vi: '120–150 (peak time 128–135, hard techno 140–160)', en: '120–150 (peak time 128–135, hard techno 140–160)' } },
    { label: { vi: 'Nguồn gốc', en: 'Origin' }, value: { vi: 'Detroit, Mỹ · giữa thập niên 1980', en: 'Detroit, USA · mid-1980s' } },
    { label: { vi: 'Nhịp', en: 'Rhythm' }, value: { vi: 'Kick 4/4 four-on-the-floor, hi-hat off-beat', en: 'Four-on-the-floor 4/4 kick, off-beat hi-hats' } },
    { label: { vi: 'Âm thanh', en: 'Sound' }, value: { vi: 'Drum machine TR-808/TR-909, synth, acid line TB-303', en: 'TR-808/TR-909 drum machines, synths, TB-303 acid lines' } },
    { label: { vi: 'Nghệ sĩ tiêu biểu', en: 'Key artists' }, value: { vi: 'Juan Atkins, Derrick May, Kevin Saunderson, Jeff Mills', en: 'Juan Atkins, Derrick May, Kevin Saunderson, Jeff Mills' } },
    { label: { vi: 'Dòng nhạc gần', en: 'Related' }, value: { vi: 'House, Electro, Industrial, Trance', en: 'House, Electro, Industrial, Trance' } },
  ],
  body: {
    vi: `**Techno** là dòng nhạc điện tử ra đời ở Detroit (Mỹ) giữa thập niên 1980, dựa trên kick 4/4 đều đặn, những vòng lặp mang tính thôi miên và âm sắc máy móc của drum machine và synthesizer. Techno thường chạy ở 120–150 BPM và đặt groove, texture lên trước giai điệu hay lời hát.

## Techno nghe như thế nào?

- **Kick & drums:** kick four-on-the-floor là xương sống, hi-hat rơi vào nhịp off-beat, clap hoặc snare ở phách 2 và 4. Âm Roland TR-808 và TR-909 là "chất liệu" kinh điển.
- **Bass:** bassline ngắn, lặp, thường hòa với kick thành một khối; techno hiện đại hay dùng rumble bass trầm và dày.
- **Melody & harmony:** tối giản. Một hook synth, vài chord stab hoặc acid line từ Roland TB-303 thay cho giai điệu dài.
- **Arrangement:** bản nhạc phát triển bằng cách thêm bớt layer và mở filter từng chút, hiếm khi có drop kiểu mainstage. Một track thường dài 6–8 phút để DJ mix liền mạch.
- **Mix & master:** low-end chắc, nhiều reverb và delay, thêm noise hay texture công nghiệp để tạo không gian.

## Nguồn gốc: Detroit và "Belleville Three"

Techno bắt đầu từ ba người bạn học ở Belleville, Michigan: **Juan Atkins**, **Derrick May** và **Kevin Saunderson**, thường được gọi là Belleville Three. Họ nghe Kraftwerk, funk của Parliament và electro, rồi tới Chicago để nghe house của Frankie Knuckles và Ron Hardy. Từ đó họ tạo ra một thứ âm nhạc vừa máy móc vừa có hồn, phản chiếu Detroit hậu công nghiệp.

Juan Atkins (Cybotron, Model 500) phát hành "No UFO's" năm 1985 trên label Metroplex của mình. Derrick May (dưới tên Rhythim Is Rhythim) ra "Strings of Life" năm 1987, còn Inner City của Kevin Saunderson đưa "Good Life" (1988) lên bảng xếp hạng Anh. Cũng năm 1988, tuyển tập *Techno! The New Dance Sound of Detroit* do Neil Rushton thực hiện giúp cái tên techno được dùng rộng rãi.

${fig('vi')}

Đầu thập niên 1990, làn sóng thứ hai đến từ Underground Resistance, nhóm có **Jeff Mills** và Mike Banks. **Robert Hood** sau đó định hình minimal techno với album *Minimal Nation* (1994). Cùng lúc, techno trở thành âm thanh của Berlin sau khi bức tường sụp đổ, với club Tresor mở cửa năm 1991. Ngày nay techno có mặt ở mọi lễ hội lớn và các club underground khắp châu Á.

## 5 nghệ sĩ techno nên nghe

| Nghệ sĩ | Quốc gia | Vì sao nên nghe | Hồ sơ |
| --- | --- | --- | --- |
| Juan Atkins (Cybotron, Model 500) | Mỹ | "Godfather of Techno": nối electro và funk với âm thanh tương lai. | [Wikipedia](${wiki('Juan Atkins')}) |
| Derrick May | Mỹ | "Strings of Life" đưa chord và cảm xúc vào techno. | [Wikipedia](${wiki('Derrick May (musician)')}) |
| Kevin Saunderson | Mỹ | Đưa techno lên bảng xếp hạng cùng Inner City. | [Wikipedia](${wiki('Kevin Saunderson')}) |
| Jeff Mills | Mỹ | DJ huyền thoại, "The Bells" và tinh thần Underground Resistance. | [Wikipedia](${wiki('Jeff Mills')}) |
| Robert Hood | Mỹ | Người định hình minimal techno. | [Wikipedia](${wiki('Robert Hood')}) |

## Các sub-genre của techno

| Sub-genre | Điểm khác | BPM | Nghe thử |
| --- | --- | --- | --- |
| Detroit Techno | Gốc của techno: chord ấm, giàu cảm xúc | 120–130 | Derrick May |
| Minimal Techno | Ít layer, tập trung groove và biến đổi nhỏ | 120–130 | Robert Hood |
| Acid Techno | Line TB-303 "squelchy" làm chủ đạo | 130–145 | Hardfloor |
| Dub Techno | Chord vang, delay và reverb dày | 115–125 | Basic Channel |
| Industrial Techno | Noise, distortion, chất EBM | 130–145 | Surgeon |
| Melodic Techno | Pad, arpeggio, giai điệu cảm xúc | 120–126 | Tale Of Us |
| Peak Time / Driving | Năng lượng cao, rumble kick | 128–135 | Adam Beyer |
| Hard Techno | Kick distorted, nhanh và gắt | 140–160 | Làn sóng hard techno 2020s |
| Schranz | Loop gắt, dồn dập, gốc Đức | 145–160 | Chris Liebing (giai đoạn đầu) |
| Tech House | Lai với house: groove swing, bassline vui | 124–128 | Fisher |

## Techno khác house thế nào?

| Tiêu chí | Techno | House |
| --- | --- | --- |
| Nguồn gốc | Detroit, giữa thập niên 1980 | Chicago, đầu thập niên 1980 |
| BPM | 120–150 | 118–130 |
| Cảm giác | Thôi miên, máy móc, tối | Ấm, soulful, nhún nhảy |
| Giai điệu & vocal | Tối giản, ít vocal | Chord, vocal soul và disco |
| Ảnh hưởng | Electro, Kraftwerk, funk | Disco, soul, gospel |

## Cách nhận biết techno khi nghe

1. **Nghe kick:** đều ở mọi phách, gần như không dừng để chờ một cú drop.
2. **Nghe bass:** bass và kick hòa thành một khối rumble, ít giai điệu.
3. **Nghe arrangement:** bản nhạc thay đổi bằng filter và layer, chậm rãi và lặp lại.
4. **So với house:** ít vocal, ít swing, cảm giác "máy" hơn.

## DJ mix techno thế nào?

Techno được viết để blend dài. Phần lớn track mở đầu và kết thúc bằng 16 hoặc 32 bar chỉ có trống, nên DJ có thể đưa bài sau vào dưới bài đang chạy và để cả hai cùng chơi một phút hoặc lâu hơn. Những việc cơ bản:

1. **Khớp tempo, rồi khớp phrase.** Cho bài mới vào đúng phách đầu của một phrase (mỗi 8, 16 hoặc 32 bar) để hai bài cùng build và cùng break.
2. **Đổi phần trầm.** Hai kick và hai bassline chồng lên nhau sẽ đục: cắt bass của bài mới bằng EQ, rồi đổi bass giữa hai bài trong vài bar.
3. **Chồng lớp chứ không chỉ thay bài.** Một vòng lặp thôi miên của bài này đặt trên trống của bài kia là một phần của nghề; có DJ chơi ba, bốn deck cùng lúc.
4. **Dẫn năng lượng.** Một set techno là một đường cong chậm: sâu và thôi miên lúc đầu, mạnh và nhanh hơn ở giờ cao điểm, BPM thường tăng dần qua đêm.

Jeff Mills, biệt danh "The Wizard", nổi tiếng với lối mix nhanh, cắt ghép liên tục trên ba bàn xoay; nhiều DJ khác lại chuộng blend chậm và liền mạch. Cả hai đều là techno.

## Nghe techno ở đâu tại châu Á?

Techno là dòng nhạc chủ lực của nhiều club underground ở TP.HCM, Hà Nội, Bangkok, Tokyo hay Singapore. Xem [lịch techno sắp tới trên FeestFinder](${nights('techno', 'vi')}) để tìm đêm gần bạn.

## Đọc tiếp

- [Trance là gì?](${guide('trance', 'vi')}) Người anh em giàu giai điệu ra đời ở Đức.
- [Hardstyle là gì?](${guide('hardstyle', 'vi')}) Khi kick trở thành nhân vật chính.
- [Drum & Bass là gì?](${guide('drum-and-bass', 'vi')}) Breakbeat thay cho kick 4/4.`,
    en: `**Techno** is electronic music born in Detroit, USA, in the mid-1980s, built on a steady 4/4 kick, hypnotic loops and the machine sound of drum machines and synthesizers. It usually runs at 120–150 BPM and puts groove and texture ahead of melody or vocals.

## What does techno sound like?

- **Kick & drums:** the four-on-the-floor kick is the backbone, hi-hats sit on the off-beat, a clap or snare lands on beats 2 and 4. The Roland TR-808 and TR-909 are the classic palette.
- **Bass:** short, looping basslines that often fuse with the kick; modern techno favours a deep rumble bass.
- **Melody & harmony:** minimal. A synth hook, a few chord stabs or a Roland TB-303 acid line instead of long melodies.
- **Arrangement:** tracks evolve by adding and removing layers and slowly opening filters, rarely with a mainstage-style drop. A track often runs 6–8 minutes so DJs can mix it seamlessly.
- **Mix & master:** a solid low end, plenty of reverb and delay, noise and industrial textures for space.

## Origins: Detroit and the "Belleville Three"

Techno began with three school friends from Belleville, Michigan: **Juan Atkins**, **Derrick May** and **Kevin Saunderson**, known as the Belleville Three. They listened to Kraftwerk, Parliament's funk and electro, and travelled to Chicago to hear Frankie Knuckles and Ron Hardy play house. Out of that they made music that was mechanical yet soulful, a mirror of post-industrial Detroit.

Juan Atkins (Cybotron, Model 500) released "No UFO's" in 1985 on his own Metroplex label. Derrick May, as Rhythim Is Rhythim, put out "Strings of Life" in 1987, and Kevin Saunderson's Inner City took "Good Life" (1988) into the UK charts. The same year, Neil Rushton's compilation *Techno! The New Dance Sound of Detroit* made the name stick.

${fig('en')}

In the early 1990s a second wave came from Underground Resistance, with **Jeff Mills** and Mike Banks. **Robert Hood** then defined minimal techno with *Minimal Nation* (1994). At the same time techno became the sound of Berlin after the Wall fell, with the Tresor club opening in 1991. Today techno fills every major festival and underground clubs across Asia.

## 5 techno artists to know

| Artist | Country | Why listen | Profile |
| --- | --- | --- | --- |
| Juan Atkins (Cybotron, Model 500) | USA | The "Godfather of Techno": electro and funk turned futuristic. | [Wikipedia](${wiki('Juan Atkins')}) |
| Derrick May | USA | "Strings of Life" brought chords and emotion to techno. | [Wikipedia](${wiki('Derrick May (musician)')}) |
| Kevin Saunderson | USA | Took techno into the charts with Inner City. | [Wikipedia](${wiki('Kevin Saunderson')}) |
| Jeff Mills | USA | A legendary DJ, "The Bells" and the spirit of Underground Resistance. | [Wikipedia](${wiki('Jeff Mills')}) |
| Robert Hood | USA | The man who defined minimal techno. | [Wikipedia](${wiki('Robert Hood')}) |

## Techno sub-genres

| Sub-genre | What sets it apart | BPM | Listen to |
| --- | --- | --- | --- |
| Detroit Techno | The source: warm chords, emotional | 120–130 | Derrick May |
| Minimal Techno | Few layers, groove and small variations | 120–130 | Robert Hood |
| Acid Techno | A squelchy TB-303 line leads | 130–145 | Hardfloor |
| Dub Techno | Echoing chords, heavy delay and reverb | 115–125 | Basic Channel |
| Industrial Techno | Noise, distortion, an EBM edge | 130–145 | Surgeon |
| Melodic Techno | Pads, arpeggios, emotional melodies | 120–126 | Tale Of Us |
| Peak Time / Driving | High energy, rumbling kicks | 128–135 | Adam Beyer |
| Hard Techno | Distorted kicks, fast and harsh | 140–160 | The 2020s hard techno wave |
| Schranz | Relentless, harsh loops, German roots | 145–160 | Early Chris Liebing |
| Tech House | Crossed with house: swing and playful bass | 124–128 | Fisher |

## Techno vs house

| | Techno | House |
| --- | --- | --- |
| Origin | Detroit, mid-1980s | Chicago, early 1980s |
| BPM | 120–150 | 118–130 |
| Feel | Hypnotic, mechanical, dark | Warm, soulful, bouncy |
| Melody & vocals | Minimal, few vocals | Chords, soul and disco vocals |
| Influences | Electro, Kraftwerk, funk | Disco, soul, gospel |

## How to recognise techno

1. **Listen to the kick:** steady on every beat, hardly ever stopping for a drop.
2. **Listen to the bass:** bass and kick merge into one rumble, with little melody.
3. **Listen to the arrangement:** the track changes through filters and layers, slowly and repetitively.
4. **Compare with house:** fewer vocals, less swing, a more "machine" feel.

## How do DJs mix techno?

Techno is built for long blends. Most tracks open and close with 16 or 32 bars of drums alone, so a DJ can bring the next record in under the current one and let both run together for a minute or more. The basics:

1. **Match the tempo, then the phrase.** Start the new track on the first beat of a phrase (every 8, 16 or 32 bars) so both build and break at the same moment.
2. **Swap the low end.** Two kicks and two basslines at once turn to mud: cut the bass of the incoming track with the EQ, then trade the basses over a few bars.
3. **Layer, don't just replace.** A hypnotic loop from one record over the drums of another is part of the craft; some DJs work three or four decks at once.
4. **Ride the energy.** A techno set is a slow curve: deep and hypnotic early, harder and faster at peak time, the BPM often rising through the night.

Jeff Mills, nicknamed "The Wizard", is famous for fast, cut-up mixing across three turntables; many others prefer slow, seamless blends. Both are techno, and both start from the same habit of listening to the phrase before touching a fader.

## Where to hear techno in Asia

Techno drives many underground clubs in Ho Chi Minh City, Hanoi, Bangkok, Tokyo and Singapore. See [upcoming techno nights on FeestFinder](${nights('techno', 'en')}) to find one near you.

## Read next

- [What is trance?](${guide('trance', 'en')}) The melodic sibling born in Germany.
- [What is hardstyle?](${guide('hardstyle', 'en')}) When the kick becomes the star.
- [What is drum & bass?](${guide('drum-and-bass', 'en')}) Breakbeats instead of a 4/4 kick.`,
  },
  faq: [
    { q: { vi: 'Techno là gì?', en: 'What is techno?' }, a: { vi: 'Techno là dòng nhạc điện tử ra đời ở Detroit giữa thập niên 1980, dựa trên kick 4/4, vòng lặp mang tính thôi miên và âm thanh của drum machine, synth. Nó ưu tiên groove và texture hơn giai điệu.', en: 'Techno is electronic music born in Detroit in the mid-1980s, built on a 4/4 kick, hypnotic loops and the sound of drum machines and synths. It favours groove and texture over melody.' } },
    { q: { vi: 'Techno bao nhiêu BPM?', en: 'What BPM is techno?' }, a: { vi: 'Thường 120–150 BPM. Peak time techno hay ở 128–135 BPM, còn hard techno và schranz có thể lên 140–160 BPM.', en: 'Usually 120–150 BPM. Peak time techno sits around 128–135 BPM, while hard techno and schranz can reach 140–160 BPM.' } },
    { q: { vi: 'Techno khác house thế nào?', en: 'How is techno different from house?' }, a: { vi: 'House ra đời ở Chicago, ấm và soulful, nhiều vocal và chord gốc disco. Techno ra đời ở Detroit, máy móc và tối giản hơn, ít vocal và thường nhanh hơn một chút.', en: 'House came from Chicago and is warm and soulful, with vocals and disco-rooted chords. Techno came from Detroit and is more mechanical and minimal, with fewer vocals and usually a little faster.' } },
    { q: { vi: 'Người mới nên nghe sub-genre techno nào?', en: 'Which techno sub-genre suits beginners?' }, a: { vi: 'Melodic techno và Detroit techno dễ nghe nhất nhờ giai điệu và chord rõ ràng. Sau đó có thể thử peak time techno trước khi tới hard techno.', en: 'Melodic techno and Detroit techno are the easiest way in, thanks to clear melodies and chords. Then try peak time techno before moving on to hard techno.' } },
    { q: { vi: 'Nghệ sĩ techno tiêu biểu là ai?', en: 'Who are the key techno artists?' }, a: { vi: 'Belleville Three (Juan Atkins, Derrick May, Kevin Saunderson), Jeff Mills, Robert Hood và Carl Craig là những cái tên nền tảng.', en: 'The Belleville Three (Juan Atkins, Derrick May, Kevin Saunderson), Jeff Mills, Robert Hood and Carl Craig are the foundational names.' } },
  ],
  sources: [
    { title: 'Techno', url: wiki('Techno'), publisher: 'Wikipedia' },
    { title: 'The Belleville Three', url: wiki('The Belleville Three'), publisher: 'Wikipedia' },
    { title: 'Techno (tiếng Việt)', url: 'https://vi.wikipedia.org/wiki/Techno', publisher: 'Wikipedia tiếng Việt' },
    { title: 'Techno', url: 'https://www.britannica.com/art/techno-music', publisher: 'Encyclopaedia Britannica' },
    { title: 'This is the story of a techno revolution', url: 'https://www.redbull.com/za-en/quickfire-history-of-detroit-techno', publisher: 'Red Bull' },
  ],
  tracks: [
    { youtube: 'xcdOBLH_AXs', artist: 'Model 500', title: "No UFO's", year: 1985, channel: 'Model 500 - Topic', note: { vi: 'Một trong những bản techno đầu tiên: electro, funk và tương lai trong cùng một groove.', en: 'One of the first techno records: electro, funk and the future in one groove.' } },
    { youtube: 'vGFw2qeUp0s', artist: 'Rhythim Is Rhythim (Derrick May)', title: 'Strings of Life', year: 1987, channel: 'Derrick May - Topic', note: { vi: 'Piano và dây đàn dồn dập: bản quốc ca của Detroit techno.', en: 'Rushing piano and strings: the anthem of Detroit techno.' } },
    { youtube: 'KJxJxr9RlKM', artist: 'Inner City (Kevin Saunderson)', title: 'Good Life', year: 1988, channel: 'InnerCityVEVO', note: { vi: 'Techno có vocal đầu tiên lọt bảng xếp hạng Anh.', en: 'The vocal techno record that reached the UK charts.' } },
    { youtube: 'GBcmuFZIqYE', artist: 'Robert Hood', title: 'Minus', channel: 'Tresor Berlin', note: { vi: 'Minimal techno đúng nghĩa: vài yếu tố, groove không ngừng.', en: 'Minimal techno at its purest: a few elements, an endless groove.' } },
    { youtube: 'S-BlgAQ7uRQ', artist: 'Jeff Mills', title: 'The Bells', channel: 'Jeff Mills - Topic', note: { vi: 'Bản kinh điển của Jeff Mills, vẫn được chơi ở mọi sân khấu techno.', en: 'Jeff Mills’s classic, still played on every techno stage.' } },
  ],
};
