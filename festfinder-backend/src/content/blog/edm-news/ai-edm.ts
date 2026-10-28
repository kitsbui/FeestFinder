import type { PackPost } from '../../../services/blog-content.ts';
import { coverOf, guide, LABEL, PILLAR, UPDATED } from './shared.ts';

type Lang = 'vi' | 'en';

const COVER = {
  url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/23/Thad_Osborne_In_His_Studio.jpg/1920px-Thad_Osborne_In_His_Studio.jpg',
  page: 'https://commons.wikimedia.org/wiki/File:Thad_Osborne_In_His_Studio.jpg',
  author: 'ThaddeusO',
  license: 'CC BY-SA 4.0',
};

const g = (slug: string, lang: Lang) => guide(slug, lang);

const vi = `**AI đang thay đổi EDM ở hai chỗ rõ nhất: tách stem ngay trong phần mềm DJ, và làn sóng nhạc do AI tạo ra trên các nền tảng nghe nhạc.** Đến năm 2026, các hãng đĩa lớn đã chuyển từ kiện tụng sang cấp phép cho Suno và Udio, còn Spotify, Deezer và Bandcamp siết luật với nhạc AI. Với DJ, AI là công cụ, chưa phải người thay thế.

${UPDATED.vi}

## AI trong phần mềm DJ: tách stem là thay đổi thật

${LABEL.fact.vi} Tính năng AI mà DJ dùng hằng ngày là tách stem: tách một bài thành các phần riêng để chơi hoặc tắt từng phần trong lúc mix. rekordbox của AlphaTheta có Stems, tách bài thành bốn phần (vocal, trống, bass và phần nhạc còn lại). djay của Algoriddim có Neural Mix, tách beat, nhạc cụ và vocal theo thời gian thực, cùng chế độ Automix dùng AI để tự chuyển bài. Serato DJ 5.0 ra ngày 20/10/2026 với beatgrid mới tên Lucid Beatgrids, cùng ngày ra mắt Serato DJ cho iPhone và iPad; từ 12/3/2026, Serato DJ Lite và Pro chơi được nhạc từ Spotify (cần Spotify Premium).

${LABEL.analysis.vi} Tách stem làm thay đổi cách mix: bạn có thể giữ vocal của bài này trên trống của bài kia, hoặc bỏ bass của bài cũ khi bài mới vào, mà không cần bản acapella hay instrumental riêng. Nhưng nó không thay được tai nghe nhạc. Chuyển bài đúng câu nhạc, giữ năng lượng phòng và chọn bài vẫn là việc của DJ. Stem tách bằng AI cũng có lỗi âm thanh khi bài dày, nên nghe lại trên loa trước khi dùng ở club. Nếu bạn mới học, hãy nắm [EQ mixing](${g('eq-mixing', 'vi')}) và [phrasing](${g('phrasing-dj', 'vi')}) trước khi dựa vào stem.

## Nhạc do AI tạo ra: con số từ các nền tảng

${LABEL.fact.vi} Deezer là nền tảng công bố số liệu đều nhất. Tháng 1/2025, khoảng 10.000 bài hoàn toàn do AI tạo ra được gửi lên mỗi ngày, khoảng 10% lượng bài mới. Đến tháng 9/2025 là hơn 30.000 bài mỗi ngày, hơn 28%. Đến tháng 6/2026 là gần 90.000 bài mỗi ngày, hơn một nửa lượng bài mới vào những ngày cao điểm. Dù vậy, nhạc AI chỉ chiếm 1–3% lượt nghe, và Deezer cho biết tới 85% lượt nghe trên các bài này năm 2025 là gian lận, bị loại khỏi tiền bản quyền. Một khảo sát Ipsos cho Deezer (11/2025, 9.000 người ở 8 nước) cho thấy 97% không phân biệt được nhạc AI và nhạc người làm khi nghe mù.

${LABEL.fact.vi} Ngày 13/10/2026, Deezer công bố nút gạt để loại hẳn bài, album và nghệ sĩ hoàn toàn do AI tạo ra khỏi kết quả tìm kiếm, triển khai toàn cầu trước cuối năm 2026. Ngày 20/10/2026, Spotify cho biết đã loại hơn 50 triệu bài "rác AI và spam" khỏi gợi ý chỉ riêng năm 2026; nhãn AI Credits ra mắt tháng 4/2026; hàng nghìn hồ sơ mang huy hiệu "AI Persona"; và các bài có khả năng cao do AI tạo ra có nguy cơ không đạt ngưỡng 1.000 lượt nghe để nhận tiền bản quyền cao gấp 10 lần. Chính sách của Spotify gỡ nhạc giả giọng một nghệ sĩ khác mà không được phép, kể cả khi ghi là "phiên bản AI". Bandcamp đi xa nhất: từ 14/1/2026 cấm nhạc làm "hoàn toàn hoặc phần lớn bằng AI".

## Hãng đĩa: từ kiện tụng sang cấp phép

${LABEL.fact.vi} Cuối năm 2025, ba thoả thuận đã đổi chiều cuộc chiến. Universal Music Group và Udio công bố hợp tác ngày 29/10/2025; Warner Music Group và Udio ngày 19/11/2025, đồng thời chấm dứt vụ kiện; Warner và Suno ngày 25/11/2025, theo đó Suno sẽ ra mô hình mới huấn luyện trên nhạc có bản quyền và nghệ sĩ Warner có thể chọn cho dùng giọng, hình ảnh và sáng tác của mình. Suno ra mô hình v6 ngày 9/9/2026, phát triển cùng Warner, BMG và Believe, và từ 3/9/2026 giới hạn số bài tải về theo gói.

${LABEL.fact.vi} Kiện tụng chưa hết. Ngày 18/9/2026, Universal và Sony nộp đơn kiện thứ hai chống lại Suno tại toà liên bang ở Boston, liên quan tới 60.202 bản thu, cho rằng v6 vẫn bắt nguồn từ các mô hình cũ đã huấn luyện trên nhạc của họ; Suno nói v6 được huấn luyện trên nội dung có cấp phép và dữ liệu từ người dùng. Ngày 5/6/2026, Liên đoàn Nhạc sĩ Mỹ (AFM) kiện Universal và Warner vì cho rằng bản thu của hội viên được cấp phép cho Suno và Udio mà không trả tiền hay ghi công. Ở Liên minh châu Âu, theo bản theo dõi của Future of Life Institute, các hệ thống tạo âm thanh tổng hợp đã có trên thị trường phải đánh dấu nội dung AI chậm nhất ngày 2/12/2026.

## Điều này có nghĩa gì

**Với người nghe.** ${LABEL.analysis.vi} Bạn sẽ thấy nhiều nhãn hơn: AI Credits và AI Persona trên Spotify, thẻ AI trên Deezer, và lựa chọn ẩn nhạc AI. Nhạc AI chiếm phần lớn lượng bài mới nhưng chỉ một phần nhỏ lượt nghe, nên trải nghiệm nghe hằng ngày chưa thay đổi nhiều.

**Với producer.** ${LABEL.analysis.vi} Nếu bạn dùng AI để tạo âm thanh, hãy khai báo khi phát hành: nhiều nhà phân phối hỗ trợ chuẩn DDEX để ghi phần AI trong credit. Giả giọng một nghệ sĩ có tên tuổi mà không được phép sẽ bị gỡ. Bandcamp không nhận nhạc làm phần lớn bằng AI. Phần mềm tạo nhạc như Suno nay giới hạn lượt tải và đang bị kiện, nên dùng bài tạo bằng AI trong bản phát hành thương mại vẫn có rủi ro pháp lý.

**Với DJ ở Việt Nam.** ${LABEL.analysis.vi} Thay đổi thực tế nhất là công cụ: rekordbox, Serato và djay đều có tách stem, nên một DJ ở Hà Nội hay TP.HCM có cùng công cụ với DJ ở Berlin. Chúng tôi chưa tìm thấy quy định riêng của Việt Nam về nhạc AI để trích dẫn ở đây. Cách an toàn là mua nhạc từ nguồn hợp pháp và giữ thói quen nghe kỹ bài trước khi chơi; xem [mua nhạc cho DJ](${g('mua-nhac-dj', 'vi')}) và [file nhạc cho DJ](${g('file-nhac-dj', 'vi')}).

## Độ tin cậy và giới hạn

${LABEL.analysis.vi} Độ tin cậy **cao** với các con số trên, vì chúng đến trực tiếp từ thông cáo của Deezer, Spotify, Suno, Udio và báo cáo của Music Business Worldwide. Độ tin cậy **thấp** với bất kỳ dự đoán nào rằng AI sẽ "thay thế DJ": chúng tôi không thấy bằng chứng nào cho điều đó. Các vụ kiện còn đang chạy và luật ở Anh, châu Âu và Mỹ còn thay đổi, nên bức tranh có thể khác vào năm 2027. Xem các kịch bản dài hơn trong [dự báo EDM 2026–2030](${g('du-bao-edm-2026-2030', 'vi')}).

## Đọc tiếp

- [Học DJ từ số 0](${g('hoc-dj-tu-so-0', 'vi')}) · [Ghi âm và đăng mix](${g('ghi-am-dang-mix', 'vi')})
- [Xu hướng hard techno 2026](${g('xu-huong-hard-techno', 'vi')})
- [Dự báo EDM 2026–2030](${g('du-bao-edm-2026-2030', 'vi')}) · [Tin tức EDM](${g('tin-tuc-edm', 'vi')})`;

const en = `**AI is changing EDM in two clear places: stem separation inside DJ software, and a flood of AI-generated music on streaming platforms.** By 2026 the major labels had moved from suing Suno and Udio to licensing them, while Spotify, Deezer and Bandcamp tightened their rules on AI music. For DJs, AI is a tool, not yet a replacement.

${UPDATED.en}

## AI in DJ software: stems are the real change

${LABEL.fact.en} The AI feature DJs use every day is stem separation: splitting a track into parts to play or mute each one while mixing. AlphaTheta's rekordbox has Stems, which splits a track into four parts (vocals, drums, bass and the rest of the instrumental). Algoriddim's djay has Neural Mix, which isolates beats, instruments and vocals in real time, and an AI-powered Automix mode for automatic transitions. Serato DJ 5.0 came out on 20 October 2026 with new "Lucid Beatgrids", the same day Serato DJ for iPhone and iPad launched; since 12 March 2026 Serato DJ Lite and Pro can stream from Spotify (Spotify Premium required).

${LABEL.analysis.en} Stems change how you mix: you can keep one track's vocal over another's drums, or drop the old track's bass as the new one comes in, without a separate acapella or instrumental. But they do not replace your ears. Mixing on the phrase, holding the room's energy and choosing the next track are still the DJ's job. AI-separated stems also carry artefacts on dense tracks, so listen on speakers before you use them in a club. If you are learning, get [EQ mixing](${g('eq-mixing', 'en')}) and [phrasing](${g('phrasing-dj', 'en')}) down before you lean on stems.

## AI-generated music: the platforms' numbers

${LABEL.fact.en} Deezer publishes the most regular figures. In January 2025 about 10,000 fully AI-generated tracks were delivered a day, roughly 10% of new uploads. By September 2025 it was over 30,000 a day, more than 28%. By June 2026 it was nearly 90,000 a day, more than half of new uploads on peak days. Yet AI music is only 1–3% of plays, and Deezer says up to 85% of the plays on these tracks in 2025 were fraudulent and excluded from royalties. An Ipsos survey for Deezer (November 2025, 9,000 people in 8 countries) found 97% could not tell AI music from human-made music in a blind test.

${LABEL.fact.en} On 13 October 2026 Deezer announced a toggle to exclude fully AI-generated tracks, albums and artists from search results, rolling out worldwide before the end of 2026. On 20 October 2026 Spotify said it had removed more than 50 million "AI-generated slop and spam" tracks from recommendations in 2026 alone; AI Credits launched in April 2026; thousands of profiles carry an "AI Persona" badge; and tracks with a high probability of AI generation are 10 times more likely to fall below the 1,000-stream royalty threshold. Spotify's policy removes music that impersonates another artist's voice without permission, even when labelled an "AI version". Bandcamp went furthest: since 14 January 2026 it bans music made "wholly or in substantial part by AI".

## The labels: from lawsuits to licences

${LABEL.fact.en} Three deals at the end of 2025 changed the fight. Universal Music Group and Udio announced a partnership on 29 October 2025; Warner Music Group and Udio on 19 November 2025, settling their litigation; Warner and Suno on 25 November 2025, under which Suno will release new models trained on licensed music and Warner artists can opt in to the use of their voices, likenesses and songs. Suno released its v6 models on 9 September 2026, developed with Warner, BMG and Believe, and since 3 September 2026 it caps downloads by plan.

${LABEL.fact.en} The lawsuits are not over. On 18 September 2026 Universal and Sony filed a second suit against Suno in federal court in Boston over 60,202 recordings, arguing v6 still descends from earlier models trained on their music; Suno says v6 was trained on licensed content and on its users' data. On 5 June 2026 the American Federation of Musicians sued Universal and Warner, alleging members' recordings were licensed to Suno and Udio without pay or credit. In the European Union, according to the Future of Life Institute's tracker, synthetic-audio systems already on the market must mark AI content by 2 December 2026.

## What it means

**For listeners.** ${LABEL.analysis.en} You will see more labels: AI Credits and AI Persona on Spotify, AI tags on Deezer, and options to hide AI music. AI tracks make up most new uploads but a small share of plays, so everyday listening has not changed much yet.

**For producers.** ${LABEL.analysis.en} If you use AI to make sounds, disclose it when you release: many distributors support the DDEX standard for crediting AI use. Imitating a named artist's voice without permission gets removed. Bandcamp will not take music made mostly by AI. Generators such as Suno now cap downloads and are being sued, so using AI-generated tracks in commercial releases still carries legal risk.

**For DJs in Vietnam.** ${LABEL.analysis.en} The most practical change is the tools: rekordbox, Serato and djay all separate stems, so a DJ in Hanoi or Ho Chi Minh City has the same toolkit as one in Berlin. We found no Vietnamese rule on AI music to cite here. The safe course is to buy music from legal sources and keep listening closely to each track before you play it; see [buying music as a DJ](${g('mua-nhac-dj', 'en')}) and [DJ music files](${g('file-nhac-dj', 'en')}).

## Confidence and caveats

${LABEL.analysis.en} Confidence is **high** in the figures above, which come straight from Deezer's, Spotify's, Suno's and Udio's announcements and from Music Business Worldwide's reporting. Confidence is **low** in any claim that AI will "replace DJs": we found no evidence for it. The lawsuits are still running and the law in the UK, the EU and the US is still moving, so the picture may look different in 2027. See the longer scenarios in the [EDM forecast 2026–2030](${g('du-bao-edm-2026-2030', 'en')}).

## Read next

- [Learning to DJ from zero](${g('hoc-dj-tu-so-0', 'en')}) · [Recording and posting a mix](${g('ghi-am-dang-mix', 'en')})
- [The hard techno trend in 2026](${g('xu-huong-hard-techno', 'en')})
- [EDM forecast 2026–2030](${g('du-bao-edm-2026-2030', 'en')}) · [EDM news](${g('tin-tuc-edm', 'en')})`;

/** Explainer and trend: what AI really changes for EDM production and DJing, 2025–2026. */
export const aiEdm: PackPost = {
  key: 'edm-news/ai-trong-edm',
  slug: 'ai-trong-edm',
  category: 'news',
  lang: 'vi',
  parent: PILLAR,
  title: {
    vi: 'AI trong EDM 2026: tách stem, nhạc AI và luật chơi mới',
    en: 'AI in EDM in 2026: stems, AI music and the new rules',
  },
  excerpt: {
    vi: 'AI trong EDM năm 2026: tách stem trong rekordbox, Serato, djay; nhạc AI trên Spotify, Deezer; hãng đĩa cấp phép cho Suno, Udio. Điều gì đổi thật với DJ.',
    en: 'AI in EDM in 2026: stems in rekordbox, Serato and djay; AI music on Spotify and Deezer; labels licensing Suno and Udio. What really changes for DJs and producers.',
  },
  body: { vi, en },
  cover: coverOf(COVER),
  styles: ['edm', 'techno', 'house'],
  facts: [
    { label: { vi: 'Loại bài', en: 'Type' }, value: { vi: 'Giải thích và xu hướng', en: 'Explainer and trend' } },
    { label: { vi: 'Nhạc AI gửi lên Deezer', en: 'AI tracks delivered to Deezer' }, value: { vi: 'Gần 90.000 bài/ngày (6/2026)', en: 'Nearly 90,000 a day (June 2026)' } },
    { label: { vi: 'Phần lượt nghe', en: 'Share of plays' }, value: { vi: '1–3% (Deezer)', en: '1–3% (Deezer)' } },
    { label: { vi: 'Tách stem', en: 'Stem separation' }, value: { vi: 'rekordbox Stems, djay Neural Mix', en: 'rekordbox Stems, djay Neural Mix' } },
    { label: { vi: 'Hãng đĩa và AI', en: 'Labels and AI' }, value: { vi: 'UMG–Udio, WMG–Udio, WMG–Suno (2025); UMG và Sony kiện Suno lần hai (9/2026)', en: 'UMG–Udio, WMG–Udio, WMG–Suno (2025); UMG and Sony sue Suno again (Sept 2026)' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'AI có thay thế DJ không?', en: 'Will AI replace DJs?' }, a: { vi: 'Chưa có bằng chứng nào cho điều đó. AI giúp tách stem và gợi ý chuyển bài, nhưng chọn bài, đọc phòng và chuyển đúng câu nhạc vẫn là việc của DJ.', en: 'There is no evidence of it. AI helps separate stems and suggest transitions, but choosing tracks, reading the room and mixing on the phrase are still the DJ\'s job.' } },
    { q: { vi: 'Phần mềm DJ nào có tách stem?', en: 'Which DJ software has stem separation?' }, a: { vi: 'rekordbox (Stems, bốn phần: vocal, trống, bass, nhạc nền), djay (Neural Mix, theo thời gian thực) và Serato DJ.', en: 'rekordbox (Stems, four parts: vocals, drums, bass, instrumental), djay (Neural Mix, in real time) and Serato DJ.' } },
    { q: { vi: 'Có bao nhiêu nhạc AI trên các nền tảng?', en: 'How much AI music is on streaming platforms?' }, a: { vi: 'Deezer nhận gần 90.000 bài hoàn toàn do AI tạo ra mỗi ngày (6/2026), hơn nửa lượng bài mới lúc cao điểm, nhưng chúng chỉ chiếm 1–3% lượt nghe.', en: 'Deezer receives nearly 90,000 fully AI-generated tracks a day (June 2026), more than half of new uploads at peak, yet they are only 1–3% of plays.' } },
    { q: { vi: 'Suno và Udio có hợp pháp không?', en: 'Are Suno and Udio legal?' }, a: { vi: 'Cả hai đã ký thoả thuận cấp phép với Warner (và Udio với Universal) năm 2025, nhưng Universal và Sony vẫn kiện Suno lần thứ hai vào 9/2026. Dùng bài tạo bằng AI để phát hành thương mại vẫn có rủi ro.', en: 'Both signed licensing deals with Warner (and Udio with Universal) in 2025, but Universal and Sony filed a second suit against Suno in September 2026. Releasing AI-generated tracks commercially still carries risk.' } },
    { q: { vi: 'Spotify xử lý nhạc AI thế nào?', en: 'How does Spotify handle AI music?' }, a: { vi: 'Spotify gỡ nhạc giả giọng nghệ sĩ khác khi không được phép, lọc spam, có nhãn AI Credits và huy hiệu AI Persona, và đã loại hơn 50 triệu bài rác AI khỏi gợi ý năm 2026.', en: 'Spotify removes music that impersonates another artist without permission, filters spam, shows AI Credits and AI Persona badges, and removed more than 50 million AI slop tracks from recommendations in 2026.' } },
  ],
  sources: [
    { title: 'Prioritizing human artistry', url: 'https://newsroom.spotify.com/2026-10-20/prioritizing-human-artistry/', publisher: 'Spotify' },
    { title: 'Deezer lets listeners exclude fully AI-generated music from search', url: 'https://newsroom-deezer.com/2026/10/deezer-ai-music-toggle/', publisher: 'Deezer' },
    { title: 'Suno and Warner Music Group partnership', url: 'https://suno.com/blog/wmg-partnership', publisher: 'Suno' },
    { title: 'A new era (Udio and Universal Music Group)', url: 'https://www.udio.com/blog/a-new-era', publisher: 'Udio' },
    { title: 'Suno confirms v6 model was trained on creations from users as it blasts latest Sony and Universal lawsuit', url: 'https://www.musicbusinessworldwide.com/suno-confirms-v6-model-was-trained-on-creations-from-users-as-it-blasts-latest-sony-and-universal-lawsuit/', publisher: 'Music Business Worldwide' },
    { title: 'Bandcamp bans AI-generated music', url: 'https://www.musicbusinessworldwide.com/bandcamp-bans-ai-generated-music-we-want-musicians-to-keep-making-music/', publisher: 'Music Business Worldwide' },
    { title: 'rekordbox', url: 'https://rekordbox.com/en/', publisher: 'AlphaTheta' },
    { title: 'Introducing Lucid Beatgrids in Serato DJ 5.0', url: 'https://the-drop.serato.com/announcements/introducing-lucid-beatgrids-in-serato-dj-5-0/', publisher: 'Serato' },
  ],
  tracks: [],
};
