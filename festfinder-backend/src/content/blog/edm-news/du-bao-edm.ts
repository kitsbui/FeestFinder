import type { PackPost } from '../../../services/blog-content.ts';
import { CONFIDENCE, coverOf, figure, guide, LABEL, PILLAR, scenarioTable, UPDATED, type Media, type Scenario } from './shared.ts';

type Lang = 'vi' | 'en';

const COVER: Media = {
  url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/Rave_%282013-04-12_by_Ian_T._McFarland%29.jpg/1920px-Rave_%282013-04-12_by_Ian_T._McFarland%29.jpg',
  page: 'https://commons.wikimedia.org/wiki/File:Rave_(2013-04-12_by_Ian_T._McFarland).jpg',
  author: 'Ian T. McFarland',
  license: 'CC BY-SA 2.0',
};

const SAIGON: Media = {
  url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a5/Ho_Chi_Minh_City_skyline_at_night_12-10-2024_1.jpg/1920px-Ho_Chi_Minh_City_skyline_at_night_12-10-2024_1.jpg',
  page: 'https://commons.wikimedia.org/wiki/File:Ho_Chi_Minh_City_skyline_at_night_12-10-2024_1.jpg',
  author: 'Xuanphuocle',
  license: 'CC BY-SA 4.0',
};

const fig = (lang: Lang) => figure(SAIGON,
  { vi: 'Đường chân trời trung tâm TP.HCM về đêm nhìn từ bờ sông Thủ Đức', en: 'Ho Chi Minh City\'s centre at night, seen from the Thủ Đức riverbank' },
  { vi: 'TP.HCM đặt mục tiêu 20 triệu lượt khách quốc tế vào năm 2030', en: 'Ho Chi Minh City aims for 20 million international arrivals by 2030' }, lang);

const S = {
  base: { vi: 'Cơ sở', en: 'Base' },
  up: { vi: 'Lạc quan', en: 'Optimistic' },
  down: { vi: 'Thận trọng', en: 'Conservative' },
} as const;

const global2026: Scenario[] = [
  { name: S.base, confidence: 'high', prediction: { vi: 'Giá trị ngành nhạc điện tử tiếp tục tăng một chữ số, quanh mức 6–7% của hai năm gần nhất', en: 'The electronic music industry keeps growing in single digits, around the 6–7% of the last two years' }, drivers: { vi: 'IMS: +6% năm 2024, +7% năm 2025 (15,1 tỷ USD)', en: 'IMS: +6% in 2024, +7% in 2025 ($15.1bn)' } },
  { name: S.up, confidence: 'medium', prediction: { vi: 'Tăng trưởng trở lại gần 9% như năm 2023, kéo bởi lượng khán giả live', en: 'Growth returns towards the 9% of 2023, pulled by live attendance' }, drivers: { vi: 'Live Nation dự kiến lượng khán giả 2026 +10%; 143 triệu vé đến giữa tháng 7', en: 'Live Nation guides 2026 attendance +10%; 143 million tickets by mid-July' } },
  { name: S.down, confidence: 'medium', prediction: { vi: 'Tăng dưới 6% nếu chi tiêu cho vé chững lại và thời tiết cực đoan làm huỷ thêm lễ hội', en: 'Growth below 6% if ticket spending stalls and extreme weather cancels more festivals' }, drivers: { vi: 'Defqon.1 2026 bị huỷ vì thời tiết; IMS gọi bối cảnh chung là khó khăn', en: 'Defqon.1 2026 cancelled for weather; IMS points to a difficult wider climate' } },
];

const global2027: Scenario[] = [
  { name: S.base, confidence: 'medium', prediction: { vi: 'Công cụ AI có bản quyền và nhãn "do AI tạo" trở thành chuẩn chung của các nền tảng', en: 'Licensed AI tools and "AI-generated" labels become the platforms\' common standard' }, drivers: { vi: 'Suno, Udio ký với các hãng lớn; Spotify AI Credits; EU AI Act yêu cầu đánh dấu nội dung tổng hợp từ 2/12/2026', en: 'Suno and Udio deals with majors; Spotify AI Credits; the EU AI Act\'s marking duty from 2 Dec 2026' } },
  { name: S.up, confidence: 'low', prediction: { vi: 'Vé bán qua nhiều chợ vé hơn, phí giảm ở các địa điểm của Live Nation tại Mỹ', en: 'Tickets sold through more marketplaces, lower fees at Live Nation\'s US venues' }, drivers: { vi: 'Thoả thuận DOJ: mở phân phối vé trong 275 ngày, trần phí 15% ở amphitheatre', en: 'DOJ settlement: open ticket distribution within 275 days, a 15% fee cap at amphitheatres' } },
  { name: S.down, confidence: 'medium', prediction: { vi: 'Tranh chấp bản quyền AI kéo dài, nhạc AI tiếp tục lấn kho nhạc mà không thành lượt nghe', en: 'AI copyright fights drag on and AI tracks keep flooding catalogues without becoming plays' }, drivers: { vi: 'UMG và Sony kiện Suno lần hai (18/9/2026); Deezer: hơn 50% bài tải lên lúc cao điểm là AI, chỉ 1–3% lượt nghe', en: 'UMG and Sony sue Suno again (18 Sep 2026); Deezer: over 50% of uploads at peak are AI, 1–3% of plays' } },
];

const global2030: Scenario[] = [
  { name: S.base, confidence: 'medium', prediction: { vi: 'Doanh thu nhạc live tăng khoảng 5% mỗi năm đến 2030; lễ hội lớn vẫn là nguồn thu chính của EDM', en: 'Live music revenue grows about 5% a year to 2030; big festivals remain EDM\'s main income' }, drivers: { vi: 'Goldman Sachs (2023): CAGR 5% cho nhạc live 2023–2030; IMS: lễ hội và club là nguồn thu lớn nhất', en: 'Goldman Sachs (2023): 5% CAGR for live music 2023–2030; IMS: festivals and clubs are the largest source' } },
  { name: S.up, confidence: 'low', prediction: { vi: 'Show nhập vai (màn hình 360°, âm thanh không gian) thành một mảng thường xuyên của nhạc điện tử', en: 'Immersive shows (360° screens, spatial sound) become a regular strand of electronic music' }, drivers: { vi: 'Anyma ở Sphere 2024–2025 (8 đêm); Cercle Odyssey 2025; nhưng Sphere chưa xếp nghệ sĩ điện tử nào cho 2026–2027', en: 'Anyma at Sphere 2024–25 (8 nights); Cercle Odyssey 2025; but Sphere lists no electronic act for 2026–27' } },
  { name: S.down, confidence: 'low', prediction: { vi: 'Vé Web3/token không phổ biến; thị trường vé tập trung vào vài tập đoàn lớn', en: 'Web3/token ticketing stays marginal; ticketing concentrates in a few large groups' }, drivers: { vi: 'Không có số liệu dùng vé on-chain 2025–2026; KKR mua Superstruct, Fever mua DICE', en: 'No 2025–26 on-chain ticketing data; KKR bought Superstruct, Fever bought DICE' } },
];

const vn2026: Scenario[] = [
  { name: S.base, confidence: 'high', prediction: { vi: 'Việt Nam giữ các show EDM lớn một đêm và các club trong DJ Mag; giờ đóng cửa 02:00 cho vũ trường chưa đổi', en: 'Vietnam keeps its big one-night EDM shows and its DJ Mag clubs; the 02:00 dance-hall closing rule stays' }, drivers: { vi: 'Ravolution × ASOT 13/6/2026; APLUS Hà Nội 43, APLUS Saigon 59, CINÉ 68; Nghị định 148/2024 không đổi giờ', en: 'Ravolution × ASOT on 13 June 2026; APLUS Hanoi 43, APLUS Saigon 59, CINÉ 68; Decree 148/2024 left the hours' } },
  { name: S.up, confidence: 'medium', prediction: { vi: 'Khách quốc tế đạt mục tiêu 25 triệu, Hà Nội và TP.HCM thông qua khung giờ đêm muộn hơn ở vài khu', en: 'Arrivals reach the 25 million target; Hanoi and HCMC adopt later night hours in some zones' }, drivers: { vi: '17,7 triệu lượt sau 9 tháng (71% mục tiêu); dự thảo Hà Nội: khung 18:00–02:00 và 18:00–06:00', en: '17.7 million after nine months (71% of target); Hanoi draft: 18:00–02:00 and 18:00–06:00 bands' } },
  { name: S.down, confidence: 'medium', prediction: { vi: 'Kiểm tra ma tuý và phòng cháy tiếp tục làm club phải tạm dừng; một số phòng underground đóng cửa', en: 'Drug and fire-safety checks keep forcing clubs to pause; some underground rooms close' }, drivers: { vi: 'Đột kích APLUS 8/2/2026; The Observatory sắp kết thúc sau 13 năm (Mixmag Asia, 10/2026)', en: 'The APLUS raid on 8 Feb 2026; The Observatory nearing its end after 13 years (Mixmag Asia, Oct 2026)' } },
];

const vn2027: Scenario[] = [
  { name: S.base, confidence: 'medium', prediction: { vi: 'Nhiều nghệ sĩ quốc tế ghé Việt Nam hơn qua các liên minh khu vực, chủ yếu ở TP.HCM và Hà Nội', en: 'More international acts stop in Vietnam through regional alliances, mostly in HCMC and Hanoi' }, drivers: { vi: 'Ravolution hợp tác Insomniac, Livescape; 700–900 sự kiện âm nhạc mỗi năm (Ultra Worldwide, 5/2026)', en: 'Ravolution\'s ties with Insomniac and Livescape; 700–900 music events a year (Ultra Worldwide, May 2026)' } },
  { name: S.up, confidence: 'low', prediction: { vi: 'Một thương hiệu lễ hội quốc tế tổ chức phiên bản đầu tiên ở Việt Nam', en: 'An international festival brand holds its first Vietnamese edition' }, drivers: { vi: 'Ravolution liệt kê "CreamFields Viet Nam" nhưng chưa có ngày, địa điểm hay lineup', en: 'Ravolution lists "CreamFields Viet Nam" with no date, venue or line-up yet' } },
  { name: S.down, confidence: 'medium', prediction: { vi: 'Lễ hội lớn của khu vực ở Thái Lan hút khán giả Việt ra nước ngoài thay vì về Việt Nam', en: 'The region\'s big festivals in Thailand draw Vietnamese fans abroad instead of to Vietnam' }, drivers: { vi: 'Tomorrowland Thái Lan (hợp đồng ít nhất 5 năm), EDC Thái Lan; chưa có Tomorrowland hay Ultra ở Việt Nam', en: 'Tomorrowland Thailand (a deal of five years or more), EDC Thailand; no Tomorrowland or Ultra in Vietnam' } },
];

const vn2030: Scenario[] = [
  { name: S.base, confidence: 'medium', prediction: { vi: 'Khách quốc tế 40–45 triệu lượt năm 2030; kinh tế đêm có khu riêng ở Hà Nội, TP.HCM, Đà Nẵng, Nha Trang', en: '40–45 million international arrivals in 2030; dedicated night zones in Hanoi, HCMC, Da Nang and Nha Trang' }, drivers: { vi: 'Quyết định 2338 (kịch bản trung bình, 12–15%/năm); Quyết định 2419 của Hà Nội', en: 'Decision 2338 (medium scenario, 12–15% a year); Hanoi\'s Decision 2419' } },
  { name: S.up, confidence: 'low', prediction: { vi: '45–50 triệu lượt khách; Việt Nam thành điểm dừng nightlife của khu vực, nghệ sĩ Việt ký label quốc tế đều đặn', en: '45–50 million arrivals; Vietnam becomes a regional nightlife stop, Vietnamese artists sign to international labels regularly' }, drivers: { vi: 'Kịch bản cao của Quyết định 2338; Hoaprox ký Spinnin\' Records, phát hành trên Monstercat', en: 'Decision 2338\'s high scenario; Hoaprox signed to Spinnin\' Records, released on Monstercat' } },
  { name: S.down, confidence: 'medium', prediction: { vi: '35–38 triệu lượt khách; quy định giờ và hồ sơ cấp phép vẫn là nút thắt chính của club', en: '35–38 million arrivals; hours and licensing remain the clubs\' main bottleneck' }, drivers: { vi: 'Kịch bản thấp của Quyết định 2338; Sở Công Thương TP.HCM: thiếu khung pháp lý cho kinh tế đêm (3/2026)', en: 'Decision 2338\'s low scenario; HCMC\'s trade department: no legal frame for the night economy (Mar 2026)' } },
];

interface Genre { name: string; global: { vi: string; en: string }; vn: { vi: string; en: string }; confidence: keyof typeof CONFIDENCE }

const GENRES: Genre[] = [
  { name: 'Mainstage EDM', confidence: 'high', global: { vi: 'Giữ đỉnh: David Guetta và Martin Garrix đứng 1–2 DJ Mag 2026, Garrix và Swedish House Mafia dẫn Tomorrowland Thái Lan', en: 'Holding the top: David Guetta and Martin Garrix are 1–2 in DJ Mag 2026; Garrix and Swedish House Mafia head Tomorrowland Thailand' }, vn: { vi: 'Âm thanh của show lớn một đêm (8Wonder 2025 với DJ Snake, hơn 50.000 người) và superclub', en: 'The sound of big one-night shows (8Wonder 2025 with DJ Snake, 50,000+) and the superclubs' } },
  { name: 'Techno', confidence: 'medium', global: { vi: 'Đi lên ở bảng xếp hạng: Charlotte de Witte lên 6, Anyma (melodic techno) lên 3 DJ Mag 2026', en: 'Rising in the polls: Charlotte de Witte up to 6 and Anyma (melodic techno) up to 3 in DJ Mag 2026' }, vn: { vi: 'CINÉ Saigon vào DJ Mag Top 100 Clubs (68); The Observatory sắp khép lại', en: 'CINÉ Saigon entered DJ Mag\'s Top 100 Clubs (68); The Observatory is closing' } },
  { name: 'Hard techno', confidence: 'low', global: { vi: 'Chưa có số liệu đáng tin: các nguồn chuyên ngành không đọc được trong đợt kiểm tra này', en: 'No reliable figures: the trade press could not be read for this check' }, vn: { vi: 'Chưa có số liệu', en: 'No data' } },
  { name: 'Trance', confidence: 'medium', global: { vi: 'Ổn định: Armin van Buuren hạng 7; A State of Trance công bố lễ hội đầu tiên ở Mỹ (10/2026)', en: 'Steady: Armin van Buuren at 7; A State of Trance announced its first US festival (Oct 2026)' }, vn: { vi: 'Ravolution × ASOT Vietnam 13/6/2026, điểm dừng Đông Nam Á duy nhất của tour', en: 'Ravolution × ASOT Vietnam on 13 June 2026, the tour\'s only Southeast Asian stop' } },
  { name: 'Hardstyle', confidence: 'medium', global: { vi: 'Defqon.1 lên hạng 5 DJ Mag Top 100 Festivals dù bản 2026 bị huỷ; Timmy Trumpet hạng 8', en: 'Defqon.1 rose to 5 in DJ Mag\'s Top 100 Festivals although 2026 was cancelled; Timmy Trumpet at 8' }, vn: { vi: 'Chưa có số liệu', en: 'No data' } },
  { name: 'House', confidence: 'medium', global: { vi: 'Rộng hơn: Afro House từ hạng 23 lên hạng 4 lượt tìm trên Beatport (2024); Fred again.., John Summit, Mau P cùng tăng hơn 17 bậc', en: 'Broadening: Afro House rose from 23rd to 4th most-searched on Beatport (2024); Fred again.., John Summit and Mau P each up 17+ places' }, vn: { vi: 'Vinahouse được các nhóm tiệc trẻ ở Sài Gòn tiếp nhận lại (Saigoneer, 2026)', en: 'Vinahouse reclaimed by young Saigon party collectives (Saigoneer, 2026)' } },
  { name: 'Drum & bass', confidence: 'low', global: { vi: 'Bền: Hospital Records tròn 30 năm (Beatportal, 9/2026); Netsky có mặt ở Tomorrowland Thái Lan', en: 'Durable: Hospital Records turned 30 (Beatportal, Sep 2026); Netsky plays Tomorrowland Thailand' }, vn: { vi: 'Phòng nhỏ, như Birdcage ở Hà Nội', en: 'Small rooms, such as Birdcage in Hanoi' } },
  { name: 'Dubstep / bass', confidence: 'low', global: { vi: 'Có mặt ở lễ hội lớn (Subtronics ở EDC Thái Lan) nhưng không có số liệu xu hướng', en: 'On the big bills (Subtronics at EDC Thailand) but with no trend data' }, vn: { vi: 'Chưa có số liệu', en: 'No data' } },
];

const genreTable = (lang: Lang) => [
  lang === 'vi' ? '| Dòng nhạc | Thế giới | Việt Nam | Độ tin cậy |' : '| Style | Global | Vietnam | Confidence |',
  '| --- | --- | --- | --- |',
  ...GENRES.map((g) => `| ${g.name} | ${g.global[lang]} | ${g.vn[lang]} | ${CONFIDENCE[g.confidence][lang]} |`),
].join('\n');

const g = (slug: string, lang: Lang) => guide(slug, lang);

const vi = `**Dự báo EDM 2026–2030:** theo kịch bản cơ sở, ngành nhạc điện tử thế giới khả năng cao tiếp tục tăng khoảng 6–7% mỗi năm, kéo bởi lễ hội và streaming, trong khi AI buộc các nền tảng gắn nhãn và cấp phép. Việt Nam có thể trở thành điểm dừng của khu vực nếu khách quốc tế tăng như kế hoạch và luật giờ đêm được nới.

${UPDATED.vi}

Đây là bài phân tích, không phải tin tức: mỗi dự báo dưới đây đi kèm kịch bản, giả định, độ tin cậy và nguồn. Phần "Sự kiện" là điều đã xảy ra; phần "Dự báo" là điều có thể xảy ra.

## Phương pháp

Chúng tôi chỉ dùng số liệu đã công bố và đọc được trực tiếp vào tháng 10/2026: báo cáo IMS Electronic Music Business Report (do MIDiA Research viết), kết quả quý của Live Nation, các thông cáo của Deezer và Spotify về nhạc AI, bảng xếp hạng DJ Mag Top 100 năm 2026, số liệu khách quốc tế của Cục Thống kê, và các quyết định, nghị định của Việt Nam về du lịch và kinh tế đêm.

Ba giả định chung: kinh tế thế giới không suy thoái sâu; không có đại dịch làm đóng cửa sự kiện; và chính sách hiện hành của Việt Nam (giờ đóng cửa, cấp phép biểu diễn) chỉ thay đổi từng bước như các dự thảo đã công bố.

Thang độ tin cậy: **Cao** khi xu hướng đã kéo dài nhiều năm và có số liệu chính thức; **Trung bình** khi có tín hiệu rõ nhưng mới một hoặc hai năm; **Thấp** khi chỉ có vài ví dụ hoặc thiếu số liệu. Không có con số nào trong bài là do chúng tôi tự ước tính.

${LABEL.fact.vi} Hai kỳ báo cáo IMS không cùng cơ sở. Kỳ 2025 tính năm 2024 là 12,9 tỷ USD (+6%); kỳ 2025/26 tính năm 2025 là 15,1 tỷ USD và gọi đó là tăng 7%, nghĩa là năm 2024 đã được tính lại cao hơn. Vì vậy bài này so tốc độ tăng, không so tổng.

## Thế giới: ba kịch bản

### 2026

${scenarioTable(global2026, 'vi')}

${LABEL.fact.vi} IMS định giá ngành nhạc điện tử năm 2025 ở 15,1 tỷ USD, tăng 7%, với streaming, xuất bản và hàng hoá là những mảng mạnh nhất; doanh thu vé club ở Ibiza đạt 160 triệu euro dù số đêm giảm. Live Nation (mọi thể loại) đã bán hơn 143 triệu vé cho các show năm 2026 tính đến giữa tháng 7 và dự kiến lượng khán giả cả năm tăng 10%.

${LABEL.forecast.vi} Với hai năm tăng 6% và 7% liên tiếp, kịch bản cơ sở cho 2026 là một năm tăng tương tự. Rủi ro lớn nhất trong năm nay không nằm ở nhu cầu mà ở vận hành: Defqon.1 2026 bị huỷ vì thời tiết cực đoan và người giữ vé được chọn chuyển sang 2027 hoặc hoàn tiền.

### 2027

${scenarioTable(global2027, 'vi')}

${LABEL.fact.vi} Lượng bài nhạc hoàn toàn do AI tạo gửi lên Deezer tăng từ khoảng 10% số bài mỗi ngày (1/2025) lên hơn 50% lúc cao điểm (giữa 2026), trong khi chúng chỉ chiếm 1–3% lượt nghe và tới 85% lượt nghe của chúng là gian lận. Spotify cho biết đã loại hơn 50 triệu bài "rác AI" khỏi gợi ý trong năm 2026. Suno và Udio đã ký thoả thuận cấp phép với Warner và Universal, nhưng Universal và Sony lại kiện Suno lần hai vào ngày 18/9/2026.

${LABEL.forecast.vi} Khả năng cao là đến 2027, nhãn AI và nhạc AI có bản quyền sẽ là chuẩn chung, vì nghĩa vụ đánh dấu nội dung tổng hợp của Đạo luật AI châu Âu áp dụng với các hệ thống đang có mặt trên thị trường từ ngày 2/12/2026. Kết quả các vụ kiện là biến số khó đoán nhất. Với DJ, AI đã nằm sẵn trong phần mềm: tách stem trong rekordbox, Neural Mix trong djay.

### 2028–2030

${scenarioTable(global2030, 'vi')}

${LABEL.forecast.vi} Con số dài hạn duy nhất có trong nguồn là dự báo năm 2023 của Goldman Sachs: doanh thu nhạc live tăng khoảng 5% mỗi năm từ 2023 đến 2030, cho mọi thể loại. Show nhập vai và vé on-chain là hai hướng hay được nhắc, nhưng bằng chứng còn mỏng: Sphere ở Las Vegas từng có Anyma (8 đêm, 2024–2025) mà chưa xếp nghệ sĩ điện tử nào cho mùa 2026–2027, và không có số liệu dùng vé Web3 nào cho 2025–2026. Chúng tôi xếp cả hai ở độ tin cậy thấp.

## Việt Nam: ba kịch bản

${fig('vi')}

### 2026

${scenarioTable(vn2026, 'vi')}

${LABEL.fact.vi} Việt Nam đón gần 21,2 triệu lượt khách quốc tế năm 2025 (+20,4%) và 17,7 triệu lượt trong 9 tháng đầu 2026 (+14,5%), khoảng 71% mục tiêu 25 triệu của năm. DJ Mag Top 100 Clubs 2026 có ba club Việt Nam: APLUS Hà Nội (43), APLUS Saigon (59) và CINÉ Saigon (68). Ravolution tổ chức đêm kỷ niệm 10 năm cùng A State of Trance của Armin van Buuren ngày 13/6/2026 tại TP.HCM.

${LABEL.fact.vi} Nghị định 54/2019 cấm vũ trường hoạt động từ 02:00 đến 08:00 và cấm người dưới 18 tuổi; Nghị định 148/2024 siết phòng cháy và cấp phép nhưng không đổi giờ. Hà Nội đã duyệt kế hoạch kinh tế đêm 2026–2030 và đưa ra dự thảo với khung 18:00–02:00 ở khu thương mại, du lịch, và 18:00–06:00 có chọn lọc. Đọc thêm ở bài [quy định nightlife Việt Nam](${g('quy-dinh-nightlife-viet-nam', 'vi')}).

### 2027

${scenarioTable(vn2027, 'vi')}

${LABEL.forecast.vi} Kịch bản cơ sở cho 2027 là nhiều nghệ sĩ quốc tế ghé Việt Nam hơn trong các tour châu Á, vì nhà tổ chức trong nước đã có đối tác khu vực. Một lễ hội thương hiệu quốc tế đầu tiên ở Việt Nam là kịch bản lạc quan, độ tin cậy thấp: hiện chưa có ngày, địa điểm hay lineup nào được công bố. Trong khi đó, Tomorrowland Thái Lan (11–13/12/2026, đã bán hết vé) và EDC Thái Lan có thể hút khán giả Việt ra nước ngoài.

### 2028–2030

${scenarioTable(vn2030, 'vi')}

${LABEL.fact.vi} Quyết định 2338/QĐ-BVHTTDL (9/2026) đặt ba kịch bản cho năm 2030: 35–38 triệu, 40–45 triệu và 45–50 triệu lượt khách quốc tế. TP.HCM nhắm 20 triệu lượt vào năm 2030; Hà Nội muốn kinh tế đêm đóng góp 7–8% GRDP vào năm 2035. Hoaprox, nghệ sĩ Việt đầu tiên ký với Spinnin' Records, là ví dụ cho hướng xuất khẩu nghệ sĩ.

${LABEL.forecast.vi} Chúng tôi dùng chính ba kịch bản khách quốc tế của Quyết định 2338 làm khung, vì lượng khách nước ngoài là động lực rõ nhất cho club và lễ hội ở Việt Nam. Điều kiện để đạt kịch bản cao không chỉ là khách: theo Sở Công Thương TP.HCM (3/2026), thiếu khung pháp lý phù hợp là lý do nhiều mô hình kinh tế đêm chưa chạy được.

## Từng dòng nhạc

${genreTable('vi')}

Bảng chỉ ghi hướng đi mà nguồn cho thấy; ô "Chưa có số liệu" nghĩa là chúng tôi chưa đọc được bằng chứng, không có nghĩa là dòng nhạc đó đứng yên. Xem thêm bài [hard techno](${g('xu-huong-hard-techno', 'vi')}) và [AI trong EDM](${g('ai-trong-edm', 'vi')}).

## Rủi ro và biến số

- **Thời tiết cực đoan:** Defqon.1 2026 bị huỷ; lễ hội ngoài trời ở Đông Nam Á cũng phải tính mùa mưa.
- **Ma tuý và phòng cháy:** các đợt kiểm tra ở club Việt Nam (APLUS tháng 2/2026) có thể làm đêm nhạc bị dừng bất cứ lúc nào.
- **Vụ kiện AI:** phán quyết trong vụ Universal và Sony kiện Suno có thể đổi cách các công cụ AI được dùng trong sản xuất.
- **Giá vé và phí:** thoả thuận DOJ với Live Nation, vụ kiện BOTS Act của FTC và trần giá bán lại ở Anh đang định lại cách bán vé.
- **Cạnh tranh khu vực:** Thái Lan có hợp đồng Tomorrowland ít nhất năm năm; Việt Nam chưa có thương hiệu lễ hội quốc tế nào có ngày cụ thể.

## Đọc tiếp

- [Tin tức EDM](${g('tin-tuc-edm', 'vi')}): mọi bài tin và phân tích.
- [EDM ở Việt Nam năm 2026](${g('edm-viet-nam-2026', 'vi')}) · [Lịch festival EDM châu Á](${g('lich-festival-edm-chau-a', 'vi')}) · [Tomorrowland Thái Lan 2026](${g('tomorrowland-thailand-2026', 'vi')})
- [Festival EDM thế giới 2026](${g('festival-edm-the-gioi-2026', 'vi')}) · [Cách đọc lineup festival](${g('cach-doc-lineup-festival', 'vi')})
- [Club EDM ở châu Á](${g('club-edm-chau-a', 'vi')}) · [EDM là gì?](${g('edm', 'vi')}) · [Techno](${g('techno', 'vi')}) · [Trance](${g('trance', 'vi')}) · [Hardstyle](${g('hardstyle', 'vi')})`;

const en = `**EDM outlook 2026–2030:** in the base case, the global electronic music industry is likely to keep growing about 6–7% a year, carried by festivals and streaming, while AI pushes platforms to label and license. Vietnam could become a regional stop if international arrivals grow as planned and the night-time rules loosen.

${UPDATED.en}

This is analysis, not news: every forecast below comes with a scenario, its assumptions, a confidence level and a source. "Fact" marks what has happened; "Forecast" marks what may happen.

## Methodology

We use only published figures that we could read directly in October 2026: the IMS Electronic Music Business Report (written by MIDiA Research), Live Nation's quarterly results, Deezer's and Spotify's releases on AI music, DJ Mag's 2026 Top 100 polls, Vietnam's official arrival statistics, and Vietnam's decisions and decrees on tourism and the night economy.

Three shared assumptions: no deep global recession; no pandemic that shuts events; and Vietnam's current rules (closing hours, performance licences) change only step by step, as the published drafts suggest.

Confidence scale: **High** when a trend has run for several years with official figures; **Medium** when the signal is clear but only one or two years old; **Low** when there are only a few examples or no figures. No number in this article is our own estimate.

${LABEL.fact.en} The two IMS editions are not on the same basis. The 2025 edition put 2024 at $12.9 billion (+6%); the 2025/26 edition put 2025 at $15.1 billion and called it 7% growth, which means 2024 was restated higher. So this article compares growth rates, not totals.

## Global: three scenarios

### 2026

${scenarioTable(global2026, 'en')}

${LABEL.fact.en} IMS values the electronic music industry at $15.1 billion in 2025, up 7%, with streaming, publishing and merchandise the strongest areas; Ibiza's club ticketing reached €160 million despite fewer nights. Live Nation (all genres) had sold more than 143 million tickets for 2026 shows by mid-July and guides full-year attendance up 10%.

${LABEL.forecast.en} After two years of 6% and 7% growth, the base case for 2026 is a similar year. The biggest risk this year is operational rather than demand: Defqon.1 2026 was cancelled for extreme weather, and ticket holders could move to 2027 or take a refund.

### 2027

${scenarioTable(global2027, 'en')}

${LABEL.fact.en} Fully AI-generated tracks delivered to Deezer went from about 10% of daily uploads (January 2025) to more than 50% at peak (mid-2026), while they make up 1–3% of plays and up to 85% of their plays are fraudulent. Spotify says it removed more than 50 million "AI slop" tracks from recommendations in 2026. Suno and Udio have licensing deals with Warner and Universal, yet Universal and Sony sued Suno a second time on 18 September 2026.

${LABEL.forecast.en} It is likely that by 2027 AI labels and licensed AI music are the common standard, because the EU AI Act's marking duty for synthetic content applies to systems already on the market from 2 December 2026. The outcome of the lawsuits is the hardest variable to call. For DJs, AI is already inside the software: stems in rekordbox, Neural Mix in djay.

### 2028–2030

${scenarioTable(global2030, 'en')}

${LABEL.forecast.en} The only long-run figure in our sources is Goldman Sachs' 2023 forecast: live music revenue growing about 5% a year from 2023 to 2030, across all genres. Immersive shows and on-chain ticketing are often mentioned, but the evidence is thin: Sphere in Las Vegas hosted Anyma (8 nights, 2024–2025) yet lists no electronic act for 2026–2027, and there are no 2025–2026 figures on Web3 ticketing. We rate both low.

## Vietnam: three scenarios

${fig('en')}

### 2026

${scenarioTable(vn2026, 'en')}

${LABEL.fact.en} Vietnam received nearly 21.2 million international visitors in 2025 (+20.4%) and 17.7 million in the first nine months of 2026 (+14.5%), about 71% of the year's 25 million target. DJ Mag's Top 100 Clubs 2026 has three Vietnamese clubs: APLUS Hanoi (43), APLUS Saigon (59) and CINÉ Saigon (68). Ravolution held its tenth-anniversary night with Armin van Buuren's A State of Trance on 13 June 2026 in Ho Chi Minh City.

${LABEL.fact.en} Decree 54/2019 bars dance halls from operating between 02:00 and 08:00 and admits no one under 18; Decree 148/2024 tightened fire safety and licensing but did not change the hours. Hanoi approved a 2026–2030 night-economy plan and drafted bands of 18:00–02:00 for commercial and tourist areas and 18:00–06:00 on a selective basis. More in our piece on [Vietnam's nightlife rules](${g('quy-dinh-nightlife-viet-nam', 'en')}).

### 2027

${scenarioTable(vn2027, 'en')}

${LABEL.forecast.en} The base case for 2027 is more international acts adding Vietnam to Asian tours, since local promoters now have regional partners. A first international festival brand in Vietnam is the optimistic case, at low confidence: no date, venue or line-up has been announced. Meanwhile Tomorrowland Thailand (11–13 December 2026, sold out) and EDC Thailand may pull Vietnamese fans abroad.

### 2028–2030

${scenarioTable(vn2030, 'en')}

${LABEL.fact.en} Decision 2338/QĐ-BVHTTDL (September 2026) sets three scenarios for 2030: 35–38 million, 40–45 million and 45–50 million international arrivals. Ho Chi Minh City aims for 20 million by 2030; Hanoi wants the night economy to reach 7–8% of its GRDP by 2035. Hoaprox, the first Vietnamese artist signed to Spinnin' Records, shows the export path.

${LABEL.forecast.en} We use Decision 2338's three arrival scenarios as the frame, because foreign visitors are the clearest driver of Vietnam's clubs and festivals. Reaching the high case takes more than visitors: according to Ho Chi Minh City's trade department (March 2026), the lack of a fitting legal framework is why many night-economy models do not yet work.

## Style by style

${genreTable('en')}

The table only shows directions the sources support; "No data" means we could not read evidence, not that the style is standing still. See also our pieces on [hard techno](${g('xu-huong-hard-techno', 'en')}) and [AI in EDM](${g('ai-trong-edm', 'en')}).

## Risks and wildcards

- **Extreme weather:** Defqon.1 2026 was cancelled; open-air festivals in Southeast Asia also have to plan around the rainy season.
- **Drugs and fire safety:** inspections at Vietnamese clubs (APLUS in February 2026) can stop a night at any time.
- **AI lawsuits:** a ruling in Universal and Sony's case against Suno could change how AI tools are used in production.
- **Ticket prices and fees:** the DOJ's settlement with Live Nation, the FTC's BOTS Act suit and the UK's resale cap are reshaping how tickets are sold.
- **Regional competition:** Thailand has a Tomorrowland deal of at least five years; Vietnam has no international festival brand with a date yet.

## Read next

- [EDM news](${g('tin-tuc-edm', 'en')}): every news and analysis piece.
- [EDM in Vietnam in 2026](${g('edm-viet-nam-2026', 'en')}) · [Asia's EDM festival calendar](${g('lich-festival-edm-chau-a', 'en')}) · [Tomorrowland Thailand 2026](${g('tomorrowland-thailand-2026', 'en')})
- [World EDM festivals 2026](${g('festival-edm-the-gioi-2026', 'en')}) · [How to read a festival line-up](${g('cach-doc-lineup-festival', 'en')})
- [EDM clubs in Asia](${g('club-edm-chau-a', 'en')}) · [What is EDM?](${g('edm', 'en')}) · [Techno](${g('techno', 'en')}) · [Trance](${g('trance', 'en')}) · [Hardstyle](${g('hardstyle', 'en')})`;

/** The 2026–2030 outlook (handoff template D): three scenarios per horizon, each with what it rests on and how sure. */
export const duBaoEdm: PackPost = {
  key: 'edm-news/du-bao-edm-2026-2030',
  slug: 'du-bao-edm-2026-2030',
  category: 'news',
  lang: 'vi',
  parent: PILLAR,
  title: {
    vi: 'Dự báo EDM 2026–2030: thế giới và Việt Nam',
    en: 'EDM outlook 2026–2030: global and Vietnam forecasts',
  },
  excerpt: {
    vi: 'Dự báo EDM 2026–2030 cho thế giới và Việt Nam: ba kịch bản mỗi giai đoạn, giả định và độ tin cậy, dựa trên IMS, DJ Mag, Deezer và số liệu du lịch chính thức.',
    en: 'EDM forecasts for 2026–2030, global and Vietnam: three scenarios per horizon with their assumptions and confidence, built on IMS, DJ Mag, Deezer and official data.',
  },
  body: { vi, en },
  cover: coverOf(COVER),
  styles: ['edm', 'mainstage', 'techno', 'trance', 'hardstyle', 'house'],
  facts: [
    { label: { vi: 'Giá trị ngành 2025', en: 'Industry value 2025' }, value: { vi: '15,1 tỷ USD, +7% (IMS)', en: '$15.1bn, +7% (IMS)' } },
    { label: { vi: 'Nhạc live đến 2030', en: 'Live music to 2030' }, value: { vi: 'Khoảng +5%/năm (Goldman Sachs, 2023)', en: 'About +5% a year (Goldman Sachs, 2023)' } },
    { label: { vi: 'Nhạc AI trên Deezer', en: 'AI tracks on Deezer' }, value: { vi: 'Hơn 50% bài tải lên lúc cao điểm, 1–3% lượt nghe', en: 'Over 50% of uploads at peak, 1–3% of plays' } },
    { label: { vi: 'Khách quốc tế Việt Nam', en: 'Vietnam arrivals' }, value: { vi: '21,2 triệu (2025); 35–50 triệu (kịch bản 2030)', en: '21.2 million (2025); 35–50 million (2030 scenarios)' } },
    { label: { vi: 'Club Việt trong DJ Mag 2026', en: 'Vietnamese clubs in DJ Mag 2026' }, value: { vi: 'APLUS Hà Nội 43 · APLUS Saigon 59 · CINÉ 68', en: 'APLUS Hanoi 43 · APLUS Saigon 59 · CINÉ 68' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Ngành EDM có tiếp tục tăng trưởng đến 2030 không?', en: 'Will the EDM industry keep growing to 2030?' }, a: { vi: 'Theo kịch bản cơ sở, khả năng cao là có: IMS ghi nhận tăng 6% năm 2024 và 7% năm 2025, và Goldman Sachs dự báo nhạc live tăng khoảng 5% mỗi năm đến 2030. Đây là dự báo, không phải điều chắc chắn.', en: 'In the base case, likely yes: IMS recorded 6% growth in 2024 and 7% in 2025, and Goldman Sachs forecasts live music growing about 5% a year to 2030. This is a forecast, not a certainty.' } },
    { q: { vi: 'AI sẽ thay đổi EDM thế nào?', en: 'How will AI change EDM?' }, a: { vi: 'Nhạc AI đã chiếm hơn một nửa số bài tải lên Deezer lúc cao điểm nhưng chỉ 1–3% lượt nghe. Khả năng cao đến 2027 nhãn AI và nhạc AI có bản quyền thành chuẩn chung; kết quả các vụ kiện là biến số lớn nhất.', en: 'AI tracks already make up more than half of Deezer\'s uploads at peak but only 1–3% of plays. By 2027, AI labels and licensed AI music are likely to be the norm; the lawsuits are the biggest variable.' } },
    { q: { vi: 'Việt Nam có Tomorrowland hay Ultra không?', en: 'Does Vietnam have Tomorrowland or Ultra?' }, a: { vi: 'Chưa. Tháng 10/2026, lịch của Tomorrowland và Ultra không có phiên bản nào ở Việt Nam; Tomorrowland đầu tiên ở châu Á diễn ra ở Thái Lan, 11–13/12/2026.', en: 'Not yet. In October 2026 neither Tomorrowland\'s nor Ultra\'s calendar lists a Vietnamese edition; Tomorrowland\'s first Asian festival is in Thailand, 11–13 December 2026.' } },
    { q: { vi: 'Club ở Việt Nam có được mở sau 2 giờ sáng không?', en: 'Can Vietnamese clubs open after 2 am?' }, a: { vi: 'Nghị định 54/2019 cấm vũ trường hoạt động từ 02:00 đến 08:00. Hà Nội đã có dự thảo cho phép khung 18:00–06:00 có chọn lọc ở một số khu; chưa có quy định chung mới.', en: 'Decree 54/2019 bars dance halls from 02:00 to 08:00. Hanoi has a draft allowing an 18:00–06:00 band selectively in some zones; there is no new national rule yet.' } },
    { q: { vi: 'Dòng nhạc nào đang lên năm 2026?', en: 'Which styles are rising in 2026?' }, a: { vi: 'Theo nguồn đọc được: techno ở bảng xếp hạng DJ (Charlotte de Witte, Anyma), Afro House trên Beatport, và hardstyle ở bảng xếp hạng lễ hội (Defqon.1 hạng 5). Mainstage vẫn đứng đầu các lễ hội lớn.', en: 'From the sources we read: techno in the DJ polls (Charlotte de Witte, Anyma), Afro House on Beatport, and hardstyle in the festival poll (Defqon.1 at 5). Mainstage still tops the big festivals.' } },
  ],
  sources: [
    { title: 'IMS Electronic Music Business Report 2025/26', url: 'https://www.internationalmusicsummit.com/news/ims-electronic-music-business-report-2025-26', publisher: 'International Music Summit' },
    { title: 'Live Nation Entertainment reports second quarter 2026 results', url: 'https://news.livenationentertainment.com/news/live-nation-entertainment-reports-second-quarter-2026-results/', publisher: 'Live Nation Entertainment' },
    { title: 'Goldman Sachs Music in the Air 2023', url: 'https://www.musicbusinessworldwide.com/peloton-paid-the-record-industry-more-than-tiktok-last-year-says-goldman-sachs-in-latest-music-in-the-air/', publisher: 'Music Business Worldwide' },
    { title: 'Deezer lets listeners filter out fully AI-generated music', url: 'https://newsroom-deezer.com/2026/10/deezer-ai-music-toggle/', publisher: 'Deezer' },
    { title: 'Prioritizing human artistry', url: 'https://newsroom.spotify.com/2026-10-20/prioritizing-human-artistry/', publisher: 'Spotify' },
    { title: 'EU AI Act implementation timeline', url: 'https://artificialintelligenceact.eu/implementation-timeline/', publisher: 'Future of Life Institute' },
    { title: 'Top 100 Clubs 2026', url: 'https://djmag.com/top100clubs', publisher: 'DJ Mag' },
    { title: 'Top 100 DJs 2026', url: 'https://djmag.com/top100djs', publisher: 'DJ Mag' },
    { title: 'Tình hình kinh tế – xã hội quý III và 9 tháng năm 2026', url: 'https://www.nso.gov.vn/bai-top/2026/10/mot-so-net-chinh-tinh-hinh-kinh-te-xa-hoi-quy-iii-va-9-thang-nam-2026/', publisher: 'Cục Thống kê' },
    { title: 'Ba kịch bản để đón 45–50 triệu lượt khách quốc tế vào năm 2030', url: 'https://tuoitre.vn/ba-kich-ban-de-don-45-50-trieu-luot-khach-quoc-te-vao-nam-2030-100260911220245758.htm', publisher: 'Tuổi Trẻ' },
    { title: 'Nghị định 54/2019/NĐ-CP về kinh doanh dịch vụ karaoke, vũ trường', url: 'https://luatvietnam.vn/thuong-mai/nghi-dinh-54-2019-nd-cp-ve-kinh-doanh-dich-vu-karaoke-174772-d1.html', publisher: 'LuatVietnam' },
    { title: 'Hà Nội tính cho một số tuyến phố kinh doanh xuyên đêm', url: 'https://tuoitre.vn/ha-noi-tinh-cho-mot-so-tuyen-pho-kinh-doanh-xuyen-dem-de-gia-tang-muc-chi-tieu-cua-du-khach-20260530093917329.htm', publisher: 'Tuổi Trẻ' },
    { title: 'RAVO 10 Years', url: 'https://www.ravolution.asia/ravo10years', publisher: 'Ravolution Asia' },
  ],
  tracks: [],
};
