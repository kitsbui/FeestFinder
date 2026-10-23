import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, guide, nights, PILLAR } from './shared.ts';
import { PLAYLIST_MEDIA_A } from './media-a.ts';

type Lang = 'vi' | 'en';

const g = (slug: string, lang: Lang) => guide(slug, lang);
const artists = (style: string, lang: Lang) => `/a/style/${style}${lang === 'en' ? '?lang=en' : ''}`;

/** A style of the site with its guide and its playlist: one row of the pillar's map. */
const STYLE_ROWS: { style: string; name: Record<Lang, string>; guide: string; playlist: string }[] = [
  { style: 'techno', name: { vi: 'Techno', en: 'Techno' }, guide: 'techno', playlist: 'playlist-techno' },
  { style: 'house', name: { vi: 'House', en: 'House' }, guide: 'edm', playlist: 'playlist-house' },
  { style: 'trance', name: { vi: 'Trance', en: 'Trance' }, guide: 'trance', playlist: 'playlist-trance' },
  { style: 'psytrance', name: { vi: 'Psytrance', en: 'Psytrance' }, guide: 'psytrance', playlist: 'playlist-psytrance' },
  { style: 'hardstyle', name: { vi: 'Hardstyle', en: 'Hardstyle' }, guide: 'hardstyle', playlist: 'playlist-hardstyle' },
  { style: 'drum-and-bass', name: { vi: 'Drum & bass', en: 'Drum & bass' }, guide: 'drum-and-bass', playlist: 'playlist-drum-and-bass' },
  { style: 'dubstep', name: { vi: 'Dubstep', en: 'Dubstep' }, guide: 'dubstep', playlist: 'playlist-dubstep' },
  { style: 'mainstage', name: { vi: 'Mainstage', en: 'Mainstage' }, guide: 'mainstage-edm', playlist: 'playlist-mainstage-edm' },
];

const styleTable = (lang: Lang) => [
  lang === 'vi' ? '| Dòng nhạc | Playlist | Cẩm nang | Đêm nhạc sắp tới | Nghệ sĩ |' : '| Style | Playlist | Guide | Coming nights | Artists |',
  '| --- | --- | --- | --- | --- |',
  ...STYLE_ROWS.map((r) => `| ${r.name[lang]} | [${lang === 'vi' ? 'Nghe' : 'Listen'}](${g(r.playlist, lang)}) | [${lang === 'vi' ? 'Đọc' : 'Read'}](${g(r.guide, lang)}) | [${lang === 'vi' ? 'Xem lịch' : 'See nights'}](${nights(r.style, lang)}) | [${lang === 'vi' ? 'Xem nghệ sĩ' : 'See artists'}](${artists(r.style, lang)}) |`),
].join('\n');

const vi = `**Playlist EDM của FeestFinder** là các danh sách nghe được ngay: theo dòng nhạc (techno, house, trance, psytrance, hardstyle, drum & bass, dubstep, mainstage), theo tâm trạng (warm-up, peak time), theo năm (2026) và theo tháng (tháng 10/2026). Mỗi bài có player chính thức, lý do nên nghe và nguồn cho ngày phát hành; mỗi dòng nhạc nối thẳng tới lịch đêm nhạc, nghệ sĩ và cẩm nang của nó.

*Cập nhật ngày 23/10/2026.*

## Mọi playlist trong một bảng

| Playlist | Loại | Làm mới |
| --- | --- | --- |
| [Top track EDM 2026](${g('playlist-edm-2026', 'vi')}) | Theo năm | Mỗi quý, chốt sau bảng tổng kết tháng 12 |
| [Track mới tháng 10/2026](${g('playlist-thang-10-2026', 'vi')}) | Theo tháng | Một danh sách mới mỗi tháng |
| [Playlist warm-up](${g('playlist-warm-up', 'vi')}) | Tâm trạng | Xem lại mỗi năm |
| [Playlist peak time](${g('playlist-peak-time', 'vi')}) | Tâm trạng | Xem lại mỗi năm |
| [Playlist techno](${g('playlist-techno', 'vi')}) | Dòng nhạc | Xem lại mỗi năm |
| [Playlist house](${g('playlist-house', 'vi')}) | Dòng nhạc | Xem lại mỗi năm |
| [Playlist trance](${g('playlist-trance', 'vi')}) | Dòng nhạc | Xem lại mỗi năm |
| [Playlist psytrance](${g('playlist-psytrance', 'vi')}) | Dòng nhạc | Xem lại mỗi năm |
| [Playlist hardstyle](${g('playlist-hardstyle', 'vi')}) | Dòng nhạc | Xem lại mỗi năm |
| [Playlist drum & bass](${g('playlist-drum-and-bass', 'vi')}) | Dòng nhạc | Xem lại mỗi năm |
| [Playlist dubstep](${g('playlist-dubstep', 'vi')}) | Dòng nhạc | Xem lại mỗi năm |
| [Playlist mainstage](${g('playlist-mainstage-edm', 'vi')}) | Dòng nhạc | Xem lại mỗi năm |

## Bốn loại playlist

**Theo dòng nhạc.** Mỗi dòng nhạc có một danh sách bền vững gồm những bài định nghĩa nó: từ những bài kinh điển đã đặt nền móng đến những bài mới mà DJ đang chơi. Đây là nơi bắt đầu nếu bạn vừa đọc cẩm nang của một dòng nhạc và muốn nghe nó nghe như thế nào.

**Theo tâm trạng.** Một đêm nhạc có nhiều giờ khác nhau. Danh sách warm-up dành cho giờ mở màn, khi phòng còn vắng và cần không khí; danh sách peak time dành cho lúc phòng ở đỉnh. Hai danh sách được sắp theo năng lượng, nên bạn có thể nghe chúng nối nhau như một đêm hoàn chỉnh.

**Theo năm.** Danh sách năm 2026 gom những bài đã thật sự định hình năm nay: đứng đầu bảng xếp hạng, được chơi nhiều nhất ở festival, hoặc được báo chí chuyên ngành chọn. Chúng tôi xem lại danh sách mỗi quý và chốt nó sau khi các bảng tổng kết năm được công bố vào tháng 12.

**Theo tháng.** Mỗi tháng có một danh sách mới gồm những bài vừa phát hành trong tháng, kèm nguồn cho ngày phát hành của từng bài. Danh sách tháng cũ được giữ lại làm lưu trữ, nên sau một năm bạn có mười hai bức ảnh chụp những gì đã ra đời.

## Mỗi dòng nhạc nối với cả trang

Một dòng nhạc trên FeestFinder không chỉ là một playlist. Bộ lọc dòng nhạc của trang chủ, thư mục nghệ sĩ, cẩm nang và playlist dùng cùng một danh sách dòng nhạc, nên từ một bài viết bạn đi được tới mọi thứ khác của cùng dòng nhạc đó: những đêm nhạc sắp diễn ra, những nghệ sĩ chơi nó và bài giải thích nó đến từ đâu.

${styleTable('vi')}

Dưới mỗi bài viết trên blog, một khung cho dòng nhạc chính của bài gom các đường dẫn đó lại, thêm tin tức mới nhất và bảng xếp hạng hiện tại của dòng nhạc.

## Bảng xếp hạng cập nhật liên tục

Playlist do biên tập viên chọn và giải thích, nên chúng thay đổi chậm. Để biết điều gì đang lên ngay lúc này, khung dòng nhạc dưới mỗi bài hiển thị mười bài đầu của bảng xếp hạng dòng nhạc đó, đọc từ API của Beatport và từ các playlist Spotify mà đội ngũ chọn theo dõi. Hệ thống kiểm tra mỗi giờ, và mỗi bảng được đọc lại theo nhịp riêng, từ vài giờ đến một tuần, tuỳ tốc độ thay đổi của nó. Khi một bảng chưa được kết nối, khung chỉ hiện các đường dẫn.

Bảng xếp hạng là tín hiệu, không phải danh sách của chúng tôi. Một bài vào playlist khi có thêm bằng chứng: thứ hạng trên Billboard hoặc Official Charts, số lần được chơi ở festival theo 1001Tracklists, danh sách của DJ Mag hay Mixmag, và việc chính chúng tôi đã nghe nó.

## Chọn playlist nào cho lúc nào

| Bạn đang | Bắt đầu từ |
| --- | --- |
| Mới tìm hiểu một dòng nhạc | Playlist dòng nhạc, rồi đọc cẩm nang của nó |
| Chuẩn bị đi club tối nay | Playlist peak time, hoặc playlist của dòng nhạc đêm đó |
| Làm việc, đọc sách, ngồi quán | Playlist warm-up |
| Muốn biết năm nay nghe gì | Top track EDM 2026 |
| Tìm nhạc mới mỗi tuần | Danh sách tháng hiện tại |
| Đang học DJ | Playlist warm-up, các bài đủ gần nhau để tập chuyển bài dài |

Nếu bạn là DJ, hãy dùng các danh sách như một điểm khởi đầu chứ không phải một set dựng sẵn. Nghe từng bài trên dàn loa thật, xem nó hợp với phòng của bạn đến đâu, rồi tìm những bài cùng label hoặc cùng nghệ sĩ: đó là cách một bộ sưu tập nhạc thật sự lớn lên.

## Từ playlist đến sàn nhảy

Nghe một bài hay là bước đầu; nghe nó ở một club hay festival với dàn âm thanh đúng nghĩa là bước sau. Từ mỗi playlist, đường dẫn "Lịch đêm nhạc" mở danh sách những đêm sắp diễn ra của dòng nhạc đó ở Việt Nam và châu Á. Trên trang của một nghệ sĩ, bạn có thể theo dõi để biết khi họ có show, hoặc đặt nhắc khi một cái tên chưa có hồ sơ xuất hiện trong lineup. Lưu một đêm nhạc bằng nút trái tim, kể cả khi chưa đăng nhập, để quay lại sau.

## Cách chúng tôi chọn bài

- **Chỉ video chính thức.** Mỗi bài là bản tải lên của nghệ sĩ, label hoặc nơi công bố bài, đã kiểm tra phát được qua oEmbed của YouTube. Không có bản tải lại của người khác.
- **Không đoán số liệu.** Ngày phát hành, label, BPM và thứ hạng chỉ ghi khi một nguồn nói rõ. Thiếu nguồn thì để trống.
- **Lời của chính chúng tôi.** Mỗi lý do nên nghe được viết mới bằng tiếng Việt và tiếng Anh, không chép mô tả của nơi khác.
- **Ghi rõ ngoại lệ.** Khi một bài của năm trước vẫn dẫn đầu bảng năm nay, chúng tôi nói rõ thay vì xếp nó như bài mới.

## Nghe thế nào

Player của mỗi bài nằm ngay dưới phần chữ và chỉ tải khi bạn bấm phát, dùng chế độ bảo vệ quyền riêng tư của YouTube, nên trang mở nhanh và không theo dõi bạn trước khi bạn nghe. Mọi bài đều có trên Spotify, Apple Music và các dịch vụ lớn. Nếu bạn là DJ, phần lớn có bản extended trên Beatport và các cửa hàng nhạc số.

## Lịch làm mới

| Danh sách | Khi nào |
| --- | --- |
| Theo tháng | Đầu mỗi tháng, cho tháng vừa qua |
| Theo năm | Mỗi quý, chốt vào tháng 12 |
| Dòng nhạc và tâm trạng | Mỗi năm, hoặc khi một video chính thức không còn phát |
| Bảng xếp hạng | Tự động, từ vài giờ đến một tuần |

## Đọc tiếp

- [EDM là gì?](${g('edm', 'vi')}) Các dòng nhạc chính và cách chúng liên quan với nhau.
- [Học DJ từ số 0](${g('hoc-dj-tu-so-0', 'vi')}) Từ controller đến set đầu tiên.
- [Club EDM ở châu Á](${g('club-edm-chau-a', 'vi')}) Nơi nghe những bài này thật to.`;

const en = `**FeestFinder's EDM playlists** are lists you can play straight away: by style (techno, house, trance, psytrance, hardstyle, drum & bass, dubstep, mainstage), by mood (warm-up, peak time), by year (2026) and by month (October 2026). Every track has its official player, a reason to listen and a source for its release; every style links straight to its nights, its artists and its guide.

*Last updated 23 October 2026.*

## Every playlist in one table

| Playlist | Kind | Refreshed |
| --- | --- | --- |
| [Top dance tracks of 2026](${g('playlist-edm-2026', 'en')}) | Yearly | Every quarter, settled after December's year-end lists |
| [New tracks, October 2026](${g('playlist-thang-10-2026', 'en')}) | Monthly | A new list every month |
| [Warm-up playlist](${g('playlist-warm-up', 'en')}) | Mood | Reviewed every year |
| [Peak-time playlist](${g('playlist-peak-time', 'en')}) | Mood | Reviewed every year |
| [Techno playlist](${g('playlist-techno', 'en')}) | Style | Reviewed every year |
| [House playlist](${g('playlist-house', 'en')}) | Style | Reviewed every year |
| [Trance playlist](${g('playlist-trance', 'en')}) | Style | Reviewed every year |
| [Psytrance playlist](${g('playlist-psytrance', 'en')}) | Style | Reviewed every year |
| [Hardstyle playlist](${g('playlist-hardstyle', 'en')}) | Style | Reviewed every year |
| [Drum & bass playlist](${g('playlist-drum-and-bass', 'en')}) | Style | Reviewed every year |
| [Dubstep playlist](${g('playlist-dubstep', 'en')}) | Style | Reviewed every year |
| [Mainstage playlist](${g('playlist-mainstage-edm', 'en')}) | Style | Reviewed every year |

## Four kinds of playlist

**By style.** Each style has an evergreen list of the tracks that define it: from the classics that laid its foundations to the new records DJs are playing now. Start here if you have just read a style's guide and want to hear what it sounds like.

**By mood.** A night has different hours. The warm-up list is for the opening hour, when the room is still empty and needs atmosphere; the peak-time list is for when the room is at its height. Both are ordered by energy, so you can play them back to back like a whole night.

**By year.** The 2026 list gathers the tracks that actually shaped this year: top of the charts, most played at festivals, or picked by the specialist press. We review it every quarter and settle it once the year-end lists come out in December.

**By month.** Every month gets a new list of tracks released that month, with a source for each release. Past months stay as an archive, so after a year you have twelve snapshots of what came out.

## Every style connects to the whole site

A style on FeestFinder is more than a playlist. The home page's style filter, the artist directory, the guides and the playlists share one list of styles, so from any post you can reach everything else in that style: its coming nights, the artists who play it and the guide that explains where it came from.

${styleTable('en')}

Under every blog post, a panel for the post's main style gathers those links, plus the latest news and the style's current chart.

## Charts that keep updating

The playlists are chosen and explained by editors, so they change slowly. To show what is rising right now, the style panel under each post lists the top ten of that style's chart, read from Beatport's API and from Spotify playlists the team chooses to follow. The system checks every hour, and each chart is read again on its own rhythm, from a few hours to a week, depending on how fast it moves. When a chart is not connected yet, the panel shows only the links.

A chart is a signal, not our list. A track joins a playlist when there is more evidence: a position on Billboard or Official Charts, festival plays according to 1001Tracklists, a DJ Mag or Mixmag list, and our own listening.

## Which playlist for which moment

| You are | Start with |
| --- | --- |
| New to a style | Its style playlist, then its guide |
| Getting ready for a club tonight | The peak-time list, or the playlist of that night's style |
| Working, reading, sitting in a café | The warm-up list |
| Curious what this year sounds like | The top tracks of 2026 |
| Hunting for new music every week | The current monthly list |
| Learning to DJ | The warm-up list, whose tracks sit close enough to practise long blends |

If you DJ, treat the lists as a starting point rather than a ready-made set. Play each track on a real system, see how well it fits your room, then look for other records on the same label or by the same artist: that is how a record collection really grows. A playlist tells you what a track is and why it matters; only your own ears can tell you where it belongs in your set, what to play before it and what should come after.

## From the playlist to the dance floor

Hearing a great track is the first step; hearing it in a club or at a festival on a proper sound system is the next. From every playlist, the "Coming nights" link opens the upcoming nights in that style across Vietnam and Asia. On an artist's page you can follow them to know when they play, or set an alert when a name without a profile turns up in a line-up. Save a night with the heart button, even before signing in, to come back to it later. If you check in when you get there, the night joins your passport, and the artists you heard become the next names to look up in these lists and on their own pages.

We would rather you spent your Friday on a dance floor than in front of a screen, and these lists exist to get you there: listen at home, find the style that moves you, then find the room where it is played loud.

## How we choose the tracks

- **Official videos only.** Every track is the upload of the artist, the label or the publisher, checked to play through YouTube's oEmbed. No re-uploads by anyone else.
- **No guessed numbers.** Release dates, labels, BPMs and chart positions appear only when a source states them. Without a source, we leave them out.
- **Our own words.** Every reason to listen is written fresh in Vietnamese and English, never copied from another description.
- **Exceptions said out loud.** When last year's track still leads this year's chart, we say so rather than passing it off as new.

## How to listen

Each track's player sits right under the words and loads only when you press play, in YouTube's privacy-enhanced mode, so the page opens fast and nothing tracks you before you listen. Every track is on Spotify, Apple Music and the major services. If you DJ, most have extended mixes on Beatport and the download stores.

## When the lists change

| List | When |
| --- | --- |
| Monthly | Early each month, for the month just gone |
| Yearly | Every quarter, settled in December |
| Style and mood | Every year, or when an official video stops playing |
| Charts | Automatically, from a few hours to a week |

## Read next

- [What is EDM?](${g('edm', 'en')}) The main styles and how they relate.
- [Learn to DJ from zero](${g('hoc-dj-tu-so-0', 'en')}) From the controller to your first set.
- [EDM clubs in Asia](${g('club-edm-chau-a', 'en')}) Where to hear these tracks loud.`;

/** The pillar of the playlists: every list in one table, and how each style links across the site. */
export const playlistEdm: PackPost = {
  key: PILLAR,
  slug: 'playlist-edm',
  category: 'playlist',
  lang: 'vi',
  title: {
    vi: 'Playlist EDM 2026: theo dòng nhạc, tâm trạng, năm và tháng',
    en: 'EDM playlists 2026: by style, mood, year and month',
  },
  excerpt: {
    vi: 'Mọi playlist EDM của FeestFinder: techno, house, trance, hardstyle, drum & bass, warm-up, peak time, top 2026 và tháng 10, mỗi bài có player chính thức và nguồn.',
    en: 'Every FeestFinder EDM playlist: techno, house, trance, hardstyle, drum & bass, warm-up, peak time, the top of 2026 and October, each with its official player and source.',
  },
  body: { vi, en },
  cover: coverOf(PLAYLIST_MEDIA_A.pillar),
  styles: ['techno', 'house', 'trance', 'hardstyle', 'drum-and-bass', 'mainstage'],
  facts: [
    { label: { vi: 'Số playlist', en: 'Playlists' }, value: { vi: '12: 8 dòng nhạc, 2 tâm trạng, 1 năm, 1 tháng', en: '12: 8 styles, 2 moods, 1 yearly, 1 monthly' } },
    { label: { vi: 'Player', en: 'Player' }, value: { vi: 'Video chính thức trên YouTube, chỉ tải khi bấm phát', en: 'Official YouTube videos, loading only on play' } },
    { label: { vi: 'Bảng xếp hạng', en: 'Charts' }, value: { vi: 'Beatport và Spotify, tự cập nhật', en: 'Beatport and Spotify, updating on their own' } },
    { label: { vi: 'Danh sách tháng', en: 'Monthly list' }, value: { vi: 'Mới mỗi tháng, giữ làm lưu trữ', en: 'New every month, kept as an archive' } },
    { label: { vi: 'Danh sách năm', en: 'Yearly list' }, value: { vi: 'Xem lại mỗi quý', en: 'Reviewed every quarter' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: '23/10/2026', en: '23 October 2026' } },
  ],
  faq: [
    { q: { vi: 'Playlist EDM của FeestFinder có gì?', en: 'What playlists does FeestFinder have?' }, a: { vi: 'Tám playlist theo dòng nhạc (techno, house, trance, psytrance, hardstyle, drum & bass, dubstep, mainstage), hai theo tâm trạng (warm-up, peak time), top track năm 2026 và danh sách bài mới mỗi tháng.', en: 'Eight style playlists (techno, house, trance, psytrance, hardstyle, drum & bass, dubstep, mainstage), two mood lists (warm-up, peak time), the top tracks of 2026 and a new-releases list every month.' } },
    { q: { vi: 'Playlist được cập nhật bao lâu một lần?', en: 'How often are the playlists updated?' }, a: { vi: 'Danh sách tháng ra đầu mỗi tháng, danh sách năm được xem lại mỗi quý, danh sách dòng nhạc và tâm trạng mỗi năm. Bảng xếp hạng dưới mỗi bài tự cập nhật từ vài giờ đến một tuần.', en: 'The monthly list comes out early each month, the yearly list is reviewed every quarter, style and mood lists every year. The charts under each post update on their own, from a few hours to a week.' } },
    { q: { vi: 'Bảng xếp hạng lấy từ đâu?', en: 'Where do the charts come from?' }, a: { vi: 'Từ API của Beatport và các playlist Spotify mà đội ngũ theo dõi, đọc lại tự động. Bảng xếp hạng là tín hiệu; một bài vào playlist khi có thêm bằng chứng và được chúng tôi nghe.', en: 'From Beatport\'s API and Spotify playlists the team follows, read again automatically. A chart is a signal; a track joins a playlist when there is more evidence and we have listened to it.' } },
    { q: { vi: 'Nghe các playlist ở đâu?', en: 'Where can I listen?' }, a: { vi: 'Ngay trên FeestFinder: mỗi bài có player YouTube chính thức chỉ tải khi bấm phát. Mọi bài đều có trên Spotify và Apple Music.', en: 'Right on FeestFinder: each track has its official YouTube player, loading only when you press play. Every track is on Spotify and Apple Music.' } },
    { q: { vi: 'Làm sao tìm đêm nhạc của một dòng nhạc?', en: 'How do I find nights in a style?' }, a: { vi: 'Mỗi playlist và cẩm nang dẫn tới lịch đêm nhạc của dòng nhạc đó trên trang chủ, ví dụ /?style=techno, và tới thư mục nghệ sĩ của nó.', en: 'Every playlist and guide links to that style\'s nights on the home page, for example /?style=techno, and to its artist directory.' } },
  ],
  sources: [
    { title: 'Beatport API v4 documentation', url: 'https://api.beatport.com/v4/docs/', publisher: 'Beatport' },
    { title: 'Spotify Web API', url: 'https://developer.spotify.com/documentation/web-api', publisher: 'Spotify for Developers' },
    { title: 'Hot Dance/Electronic Songs', url: 'https://www.billboard.com/charts/dance-electronic-songs/', publisher: 'Billboard' },
    { title: 'Top 100 DJs', url: 'https://djmag.com/top100djs', publisher: 'DJ Mag' },
    { title: 'The best tracks of the year 2026 so far', url: 'https://mixmag.net/feature/best-dance-electronic-club-tracks-2026', publisher: 'Mixmag' },
    { title: 'Songs of Summer 2026 contenders', url: 'https://www.officialcharts.com/chart-news/songs-of-summer-2026-contenders/', publisher: 'Official Charts' },
  ],
  tracks: [],
};
