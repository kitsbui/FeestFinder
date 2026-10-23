import type { PackPost } from '../../../services/blog-content.ts';
import { cityNights } from '../club-guides/shared.ts';
import { coverOf, guide, LABEL, PILLAR, UPDATED, type Media } from './shared.ts';

type Lang = 'vi' | 'en';

const cover: Media = {
  url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/Bui_Vien_Street%2C_Ho_Chi_Minh_City%2C_at_night%2C_2023_%2807%29.jpg/1920px-Bui_Vien_Street%2C_Ho_Chi_Minh_City%2C_at_night%2C_2023_%2807%29.jpg',
  page: 'https://commons.wikimedia.org/wiki/File:Bui_Vien_Street,_Ho_Chi_Minh_City,_at_night,_2023_(07).jpg',
  author: 'Bahnfrend',
  license: 'CC BY-SA 4.0',
};

const g = (slug: string, lang: Lang) => guide(slug, lang);

const vi = `**Quy định nightlife ở Việt Nam** năm 2026 xoay quanh bốn văn bản: Nghị định 54/2019/NĐ-CP (vũ trường không được hoạt động từ 02:00 đến 08:00), Nghị định 148/2024/NĐ-CP (phòng cháy và giấy phép), Quyết định 1129/QĐ-TTg về kinh tế ban đêm, và Nghị định 144/2020/NĐ-CP về biểu diễn. Bài này giải thích từng quy định có nghĩa gì với một đêm EDM.

${UPDATED.vi}

Đây là bài giải thích, không phải tư vấn pháp lý. Mỗi điểm dưới đây dẫn văn bản hoặc bài báo chúng tôi đã đọc; chỗ nào văn bản không nói rõ, chúng tôi nói là chưa rõ.

## Tóm tắt: quy định nào chạm tới một đêm EDM

| Văn bản | Nội dung chính | Ảnh hưởng tới đêm nhạc |
| --- | --- | --- |
| Nghị định 54/2019/NĐ-CP | Vũ trường không hoạt động 02:00–08:00, karaoke 00:00–08:00; người dưới 18 tuổi không vào vũ trường | Giờ đóng cửa của club đăng ký là vũ trường |
| Nghị định 148/2024/NĐ-CP | Thêm yêu cầu phòng cháy theo QCVN 06:2022/BXD, giấy phép do UBND tỉnh cấp | Club vi phạm phòng cháy không khắc phục có thể bị thu hồi giấy phép |
| Quyết định 1129/QĐ-TTg (2020) | Đề án phát triển kinh tế ban đêm, thí điểm dịch vụ đến 06:00 ở 10 địa phương | Nền cho các khu phố đêm; chưa thấy club nào được cấp phép mở quá 02:00 |
| Nghị định 144/2020/NĐ-CP | Quản lý hoạt động nghệ thuật biểu diễn; dự thảo sửa đổi năm 2026 chuyển sang thông báo | Thủ tục cho festival và đêm có nghệ sĩ biểu diễn |
| QCVN 26:2025/BNNMT, Nghị định 45/2022/NĐ-CP | Quy chuẩn và mức phạt tiếng ồn | Loa của sân khấu ngoài trời và club gần khu dân cư |
| Nghị quyết 202/2025/QH15 | Cả nước còn 34 đơn vị hành chính cấp tỉnh | Địa chỉ club đổi sang phường mới |

## Giờ mở cửa: "luật 2 giờ sáng" đến từ đâu

${LABEL.fact.vi} Nghị định 54/2019/NĐ-CP về kinh doanh dịch vụ karaoke, dịch vụ vũ trường được ký ngày 19/6/2019 và có hiệu lực từ 1/9/2019. Điều 8 quy định vũ trường "không được hoạt động từ 02 giờ sáng đến 08 giờ sáng" và không cho người chưa đủ 18 tuổi vào; Điều 7 cấm karaoke hoạt động từ 0 giờ đến 8 giờ sáng. Vũ trường cũng phải cách trường học, bệnh viện, cơ sở tôn giáo và di tích từ 200 m trở lên.

${LABEL.fact.vi} Nghị định 148/2024/NĐ-CP, ký ngày 12/11/2024 và có hiệu lực ngay, sửa Nghị định 54: thêm yêu cầu phòng cháy theo QCVN 06:2022/BXD, chuyển việc cấp phép về UBND cấp tỉnh (sở văn hoá nhận hồ sơ), cho nộp hồ sơ điện tử, và cho phép thu hồi giấy phép nếu vi phạm phòng cháy không được khắc phục. Nghị định này không đổi giờ hoạt động. Năm 2023, Thanh Niên ghi nhận hơn 300 cơ sở karaoke và vũ trường ở TP.HCM đã đóng sau đợt kiểm tra phòng cháy.

${LABEL.analysis.vi} Vì vậy giờ đóng cửa chung cho một club được cấp phép là vũ trường là 02:00. Nhiều nơi mọi người gọi là club lại đăng ký theo loại hình khác (quán bar, nhà hàng), và các văn bản chúng tôi đọc không nói rõ giờ nào áp dụng cho những nơi đó. Đó là lý do bạn thấy các đêm underground ghi giờ kết thúc 04:00 hoặc 05:00 trên Resident Advisor: hãy tin giờ mà club đăng cho từng đêm, và biết rằng giờ đó có thể bị kiểm tra.

## Kinh tế ban đêm: khung năm 2020 và kế hoạch của các thành phố

${LABEL.fact.vi} Quyết định 1129/QĐ-TTg ngày 27/7/2020 phê duyệt Đề án Phát triển kinh tế ban đêm ở Việt Nam. Đề án định nghĩa ban đêm là từ 18:00 đến 06:00 sáng hôm sau, và cho thí điểm dịch vụ đến 6 giờ sáng tại một số điểm ở Hà Nội, Quảng Ninh, Hải Phòng, TP.HCM, Đà Nẵng, Hội An, Thừa Thiên Huế, Cần Thơ, Đà Lạt và Phú Quốc, với 5 nhóm giải pháp và 38 nhiệm vụ.

${LABEL.fact.vi} Hà Nội đã duyệt kế hoạch phát triển kinh tế ban đêm 2026–2030, tầm nhìn 2045 (Quyết định 2419): đến 2035, kinh tế đêm đóng góp khoảng 7–8% GRDP với 6–8 khu đêm trọng điểm và 15–20 tuyến phố hoạt động sau 24:00. Một dự thảo nghị quyết gửi HĐND thành phố ngày 2/6/2026 chia giờ thành ba khung: 18:00–24:00 là khung chính; 18:00–02:00 cho khu thương mại, văn hoá, phố đi bộ và khu đêm theo quy hoạch; 18:00–06:00 chỉ "có giới hạn, chọn lọc" ở khu đạt chuẩn nghiêm ngặt. Khu trung tâm lịch sử (Hoàn Kiếm, phố cổ, Hoàng thành) được quản lý chặt.

${LABEL.fact.vi} Tháng 10/2026, UBND TP.HCM lấy ý kiến dự thảo nghị quyết về quản lý và hỗ trợ hoạt động kinh tế đêm: khu, tuyến, điểm đêm được công nhận cần hồ sơ, quy chế và ý kiến cư dân; một hoạt động ảnh hưởng nghiêm trọng đến đời sống cư dân, hoặc bị nhiều cư dân phản đối, có thể bị điều chỉnh, tạm dừng hoặc chấm dứt. Bài báo không nêu giờ đóng cửa nào.

${LABEL.analysis.vi} Khung pháp lý cho "phố không ngủ" đang thành hình, nhưng tính đến 22/10/2026 chúng tôi chưa tìm thấy club hay khu nào được cấp phép rõ ràng để mở quá 02:00. Với dân EDM, điều đáng theo dõi là liệu khung 18:00–06:00 của Hà Nội có áp dụng cho cơ sở có sân khấu DJ, và quy chế cư dân của TP.HCM sẽ đo tiếng ồn ra sao.

## Tiếng ồn và giấy phép biểu diễn

${LABEL.fact.vi} Quy chuẩn tiếng ồn quốc gia mới, QCVN 26:2025/BNNMT, được ban hành ngày 15/5/2025, thay QCVN 26:2010/BTNMT. Theo Nghị định 45/2022/NĐ-CP, vượt chuẩn dưới 2 dBA bị cảnh cáo, còn vượt từ 40 dBA trở lên bị phạt 140–160 triệu đồng; Tuổi Trẻ (5/2026) dẫn Nghị định 282/2025/NĐ-CP cho phép phạt đến 2 triệu đồng và tịch thu thiết bị khi tụ tập gây ồn, không cần đo. Cùng tháng, Bộ Công an lấy ý kiến về việc đưa tiếng ồn vượt chuẩn vào Bộ luật Hình sự.

${LABEL.fact.vi} Nghị định 144/2020/NĐ-CP quy định về hoạt động nghệ thuật biểu diễn. Dự thảo sửa đổi (chưa có hiệu lực tại 16/10/2026) bỏ bốn thủ tục chấp thuận và chuyển sang thông báo, hậu kiểm: báo trước ít nhất 5 ngày làm việc với một buổi biểu diễn và 10 ngày với một cuộc thi hay liên hoan; đơn vị đã thông báo đúng và không bị yêu cầu dừng thì được tổ chức mà không chờ giấy phép.

${LABEL.fact.vi} Năm 2018, sau khi bảy người chết tại một lễ hội nhạc điện tử ở công viên nước Hồ Tây, Hà Nội ngừng cấp phép sự kiện EDM cho đến khi có kết luận điều tra; nhiều sự kiện ở Hải Phòng, Quảng Ninh, Nha Trang, Sài Gòn và Hà Nội bị huỷ vì không có giấy phép.

${LABEL.analysis.vi} Với nhà tổ chức, dự thảo sửa Nghị định 144 có thể rút ngắn thời gian chờ đáng kể nếu được thông qua. Nhưng tiền lệ 2018 cho thấy một sự cố an toàn có thể đóng băng cả dòng nhạc trong nhiều tháng; kế hoạch y tế, nước uống và kiểm soát ma tuý quan trọng không kém tờ giấy phép.

## Sáp nhập tỉnh 2025: vì sao địa chỉ club đổi

${LABEL.fact.vi} Nghị quyết 202/2025/QH15 được Quốc hội thông qua ngày 12/6/2025 với 461/465 đại biểu tán thành: cả nước còn 34 đơn vị hành chính cấp tỉnh (28 tỉnh, 6 thành phố), chính quyền mới hoạt động từ 1/7/2025, cấp huyện thôi hoạt động cùng ngày. TP.HCM nhập với Bà Rịa - Vũng Tàu và Bình Dương; Đà Nẵng nhập với Quảng Nam; Khánh Hoà nhập với Ninh Thuận; Hà Nội giữ nguyên.

${LABEL.analysis.vi} Vì vậy địa chỉ club trên FeestFinder dùng phường mới: phố Bùi Viện nay thuộc phường Bến Thành, APLUS ở phường Cầu Ông Lãnh. Khi gọi xe hay gửi địa chỉ cho bạn bè, tên quận cũ vẫn được hiểu, nhưng giấy tờ và bản đồ mới dùng tên phường.

## Ma tuý: kiểm tra ở club

${LABEL.fact.vi} Cảnh sát kiểm tra club thường xuyên và công khai kết quả. Ngày 20/10/2024, hơn 180 cảnh sát Đồng Nai kiểm tra bốn cơ sở ở Biên Hoà: 625 người được xét nghiệm, 24 người dương tính. Ngày 21/11/2024 ở Hải Phòng, 26 khách của New MDM Club dương tính. Khoảng 01:00 ngày 8/2/2026, cảnh sát ma tuý TP.HCM kiểm tra APLUS (phường Cầu Ông Lãnh) với hơn 500 người có mặt: 17 người dương tính, 2 người bị nghi tàng trữ. Tháng 9/2026, Viện kiểm sát Hà Nội truy tố chủ một quán bar và hai người khác về mua bán gần 107 kg ma tuý; các bị can không nhận tội và chưa có bản án.

${LABEL.analysis.vi} Với người đi club, một cuộc kiểm tra có nghĩa là có thể bị yêu cầu xét nghiệm ngay tại chỗ. Bóng cười (khí N2O) cũng bị thu giữ trong các đợt kiểm tra ở Bùi Viện năm 2025. Mang giấy tờ tuỳ thân, và đừng mang, mua hay nhận bất cứ chất gì.

## Thị thực cho khách và DJ quốc tế

${LABEL.fact.vi} Từ 15/8/2023, Việt Nam cấp thị thực điện tử cho công dân mọi nước. Nghị quyết 44/NQ-CP (7/3/2025) và Nghị quyết 229/NQ-CP (11/8/2025) miễn thị thực du lịch 45 ngày cho công dân 24 nước, trong đó có Anh, Đức, Pháp, Nhật, Hàn Quốc, Hà Lan và Bỉ, đợt mới áp dụng từ 15/8/2025 đến 14/8/2028.

${LABEL.analysis.vi} Điều này giúp khách quốc tế đến festival dễ hơn nhiều. Riêng DJ nước ngoài biểu diễn có thu tiền là chuyện khác: chúng tôi chưa đọc được quy định cụ thể cho nghệ sĩ nước ngoài theo Nghị định 144/2020, nên hãy để đơn vị tổ chức lo thủ tục với sở văn hoá.

## Điều này có nghĩa gì

**Với người đi rave:** mang hộ chiếu hoặc căn cước, biết rằng club có thể đóng lúc 02:00 dù lịch ghi muộn hơn, và hiểu rằng xét nghiệm ma tuý tại chỗ là chuyện có thật.

**Với DJ:** hỏi nhà tổ chức giờ kết thúc thật của đêm, và nếu là DJ nước ngoài, để họ lo giấy phép biểu diễn trước khi bạn bay.

**Với nhà tổ chức:** giấy phép phòng cháy là điều kiện sống còn theo Nghị định 148; theo dõi dự thảo sửa Nghị định 144; đo tiếng ồn khi làm sự kiện gần khu dân cư; và chuẩn bị kế hoạch y tế cho mọi đêm đông người.

## Những điều còn chưa rõ

- Hà Nội đã thông qua nghị quyết kinh tế đêm tại kỳ họp ngày 2/6/2026 chưa, và với lời văn cuối cùng ra sao.
- Ngày và số hiệu của dự thảo nghị quyết kinh tế đêm TP.HCM.
- Giờ nào áp dụng cho một quán bar có DJ không đăng ký là vũ trường.
- Thủ tục cụ thể cho nghệ sĩ nước ngoài theo Nghị định 144/2020.

## Đọc tiếp

- [Club ở TP.HCM](${g('club-sai-gon', 'vi')}) · [Club ở Hà Nội](${g('club-ha-noi', 'vi')}) · [Club ở Đà Nẵng](${g('club-da-nang', 'vi')})
- [EDM Việt Nam 2026: concert, festival và club](${g('edm-viet-nam-2026', 'vi')})
- [Dự báo EDM 2026–2030](${g('du-bao-edm-2026-2030', 'vi')})
- [Tin tức EDM](${g('tin-tuc-edm', 'vi')})
- [Lịch đêm nhạc ở TP.HCM](${cityNights('ho-chi-minh', 'vi')}) · [Hà Nội](${cityNights('ha-noi', 'vi')}) · [Đà Nẵng](${cityNights('da-nang', 'vi')})`;

const en = `**Vietnam's nightlife rules** in 2026 rest on four texts: Decree 54/2019/NĐ-CP (dance halls may not operate from 02:00 to 08:00), Decree 148/2024/NĐ-CP (fire safety and licensing), Decision 1129/QĐ-TTg on the night economy, and Decree 144/2020/NĐ-CP on performances. This explainer sets out what each one means for an EDM night.

${UPDATED.en}

This is an explainer, not legal advice. Every point below cites a legal text or an article we read; where a text does not say, we say it is unclear.

## In short: the rules that touch an EDM night

| Text | What it says | What it means for a night |
| --- | --- | --- |
| Decree 54/2019/NĐ-CP | Dance halls closed 02:00–08:00, karaoke 00:00–08:00; nobody under 18 in a dance hall | The closing time of a club licensed as a dance hall |
| Decree 148/2024/NĐ-CP | Adds fire safety under QCVN 06:2022/BXD; licences issued by the provincial People's Committee | A club that leaves fire-safety breaches unfixed can lose its licence |
| Decision 1129/QĐ-TTg (2020) | The night-economy scheme; pilots of services until 06:00 in 10 localities | The basis of the night streets; no club found licensed past 02:00 |
| Decree 144/2020/NĐ-CP | Performing-arts rules; a 2026 draft amendment moves to notification | The paperwork for festivals and nights with performers |
| QCVN 26:2025/BNNMT, Decree 45/2022/NĐ-CP | The noise standard and its fines | Speakers at open-air stages and clubs near homes |
| Resolution 202/2025/QH15 | Vietnam now has 34 provincial-level units | Club addresses moved to new wards |

## Opening hours: where the "2 am rule" comes from

${LABEL.fact.en} Decree 54/2019/NĐ-CP on karaoke and dance-hall businesses was signed on 19 June 2019 and took effect on 1 September 2019. Article 8 says a dance hall (vũ trường) "may not operate from 2 am to 8 am" and may not admit anyone under 18; Article 7 bars karaoke from midnight to 8 am. A dance hall must also be at least 200 m from schools, hospitals, religious sites and monuments.

${LABEL.fact.en} Decree 148/2024/NĐ-CP, signed on 12 November 2024 and effective on signing, amends Decree 54: it adds fire-safety compliance with QCVN 06:2022/BXD, moves licensing to the provincial People's Committee (with the culture department handling files), allows electronic filing, and lets a licence be revoked for fire-safety breaches left uncorrected. It does not change the hours. In 2023 Thanh Niên reported that more than 300 karaoke venues and dance halls in Ho Chi Minh City had closed after the fire-safety checks.

${LABEL.analysis.en} So the general closing time of a club licensed as a dance hall is 02:00. Many places people call clubs are registered as something else (a bar, a restaurant), and the texts we read do not say which hours apply to them. That is why underground nights list a 4 or 5 am finish on Resident Advisor: trust the hours a club posts for each night, and know they can be checked.

## The night economy: the 2020 framework and the cities' plans

${LABEL.fact.en} Decision 1129/QĐ-TTg of 27 July 2020 approved the scheme for developing Vietnam's night economy. It defines night as 18:00 to 06:00 and lets selected sites pilot services until 6 am in Hanoi, Quảng Ninh, Hải Phòng, Ho Chi Minh City, Đà Nẵng, Hội An, Thừa Thiên Huế, Cần Thơ, Đà Lạt and Phú Quốc, with 5 groups of measures and 38 tasks.

${LABEL.fact.en} Hanoi has approved a night-economy plan for 2026–2030 with a vision to 2045 (Decision 2419): by 2035 the night economy should make up about 7–8% of the city's GRDP, with 6–8 key night zones and 15–20 streets open after midnight. A draft resolution sent to the city People's Council on 2 June 2026 sets three bands: 18:00–24:00 as the main band; 18:00–02:00 for commercial and cultural areas, walking streets and planned night zones; and 18:00–06:00 only "on a limited, selective basis" in areas meeting strict standards. The historic centre (Hoàn Kiếm, the Old Quarter, the Imperial Citadel) stays tightly controlled.

${LABEL.fact.en} In October 2026 Ho Chi Minh City's People's Committee was collecting views on a draft resolution on managing and supporting night-time activity: recognised night areas, routes and spots need a file, operating rules and residents' feedback, and an activity that seriously affects residents, or that many of them oppose, can be adjusted, suspended or ended. The article gives no closing hour.

${LABEL.analysis.en} A legal frame for "streets that never sleep" is taking shape, but as of 22 October 2026 we found no club or zone clearly licensed to stay open past 02:00. For the EDM crowd, the things to watch are whether Hanoi's 18:00–06:00 band will cover venues with a DJ stage, and how Ho Chi Minh City's residents' rules will measure noise.

## Noise and performance permits

${LABEL.fact.en} A new national noise standard, QCVN 26:2025/BNNMT, was issued on 15 May 2025, replacing QCVN 26:2010/BTNMT. Under Decree 45/2022/NĐ-CP, exceeding the limit by under 2 dBA draws a warning and by 40 dBA or more a fine of 140–160 million VND; Tuổi Trẻ (May 2026) cites Decree 282/2025/NĐ-CP as allowing fines of up to 2 million VND and confiscation of the equipment for noisy gatherings, without a measurement. The same month the Ministry of Public Security consulted on adding excess noise to the Criminal Code.

${LABEL.fact.en} Decree 144/2020/NĐ-CP governs performing arts. A draft amendment (not in force as of 16 October 2026) would drop four approval procedures in favour of notification and later inspection: notice at least 5 working days before a performance and 10 days before a contest or festival; an organiser that has notified correctly and is not told to stop may go ahead without waiting for a permit.

${LABEL.fact.en} In 2018, after seven people died at an electronic music festival at the Hồ Tây water park, Hanoi stopped licensing EDM events until the police investigation concluded; events in Hải Phòng, Quảng Ninh, Nha Trang, Saigon and Hanoi were cancelled for lack of permits.

${LABEL.analysis.en} For organisers, the amendment to Decree 144 could cut waiting times sharply if it passes. But the 2018 precedent shows a single safety incident can freeze a whole genre for months; a medical plan, free water and drug control matter as much as the permit.

## The 2025 provincial merger: why club addresses changed

${LABEL.fact.en} Resolution 202/2025/QH15 was passed by the National Assembly on 12 June 2025, with 461 of 465 delegates in favour: Vietnam now has 34 provincial-level units (28 provinces and 6 cities), the new provincial governments started on 1 July 2025, and the district level stopped operating the same day. Ho Chi Minh City merged with Bà Rịa - Vũng Tàu and Bình Dương, Đà Nẵng with Quảng Nam, Khánh Hòa with Ninh Thuận; Hanoi was unchanged.

${LABEL.analysis.en} That is why club addresses on FeestFinder use the new wards: Bùi Viện street is now in Bến Thành ward, APLUS in Cầu Ông Lãnh ward. Drivers still understand the old district names, but papers and new maps use the wards.

## Drugs: checks at clubs

${LABEL.fact.en} Police check clubs often and publish the results. On 20 October 2024 more than 180 Đồng Nai officers inspected four venues in Biên Hòa: 625 people were tested and 24 were positive. On 21 November 2024 in Hải Phòng, 26 guests at New MDM Club tested positive. Around 01:00 on 8 February 2026 Ho Chi Minh City's drug police inspected APLUS (Cầu Ông Lãnh ward) with more than 500 people present: 17 tested positive and 2 were suspected of possession. In September 2026 Hanoi's procuracy indicted a bar owner and two others for trading nearly 107 kg of drugs; they deny the charges and no verdict has been given.

${LABEL.analysis.en} For a clubber, a check means you may be asked to take a test on the spot. Laughing-gas (N2O) cylinders were also seized in the 2025 checks on Bùi Viện. Carry ID, and don't carry, buy or accept anything.

## Visas for visitors and foreign DJs

${LABEL.fact.en} Since 15 August 2023 Vietnam has issued e-visas to citizens of every country. Resolution 44/NQ-CP (7 March 2025) and Resolution 229/NQ-CP (11 August 2025) grant 45-day visa-free tourist stays to citizens of 24 countries, including the UK, Germany, France, Japan, South Korea, the Netherlands and Belgium, the newer group from 15 August 2025 to 14 August 2028.

${LABEL.analysis.en} That makes festival trips far easier. A foreign DJ performing for a fee is another matter: we have not read the specific rules for foreign performers under Decree 144/2020, so leave the paperwork with the culture department to the organiser.

## What it means

**For ravers:** carry your passport or ID card, know a club may close at 02:00 even if the listing says later, and take on-the-spot drug tests as real.

**For DJs:** ask the organiser for the night's real finish time, and if you are a foreign DJ, make sure they handle the performance permit before you fly.

**For organisers:** fire-safety compliance is make-or-break under Decree 148; follow the draft amendment to Decree 144; measure noise at events near homes; and plan medical care for every big night.

## What is still unclear

- Whether Hanoi's People's Council adopted the night-economy resolution at its 2 June 2026 session, and in what final wording.
- The date and number of Ho Chi Minh City's draft night-economy resolution.
- Which hours apply to a bar with DJs that is not licensed as a dance hall.
- The exact procedure for foreign performers under Decree 144/2020.

## Read next

- [Clubs in Ho Chi Minh City](${g('club-sai-gon', 'en')}) · [Clubs in Hanoi](${g('club-ha-noi', 'en')}) · [Clubs in Da Nang](${g('club-da-nang', 'en')})
- [Vietnam's EDM scene in 2026: concerts, festivals and clubs](${g('edm-viet-nam-2026', 'en')})
- [EDM outlook 2026–2030](${g('du-bao-edm-2026-2030', 'en')})
- [EDM news](${g('tin-tuc-edm', 'en')})
- [Coming nights in Ho Chi Minh City](${cityNights('ho-chi-minh', 'en')}) · [Hanoi](${cityNights('ha-noi', 'en')}) · [Da Nang](${cityNights('da-nang', 'en')})`;

/** An explainer: the laws and plans behind Vietnam's club hours, noise, permits, addresses, drug checks and visas. */
export const quyDinhNightlife: PackPost = {
  key: 'edm-news/quy-dinh-nightlife-viet-nam',
  slug: 'quy-dinh-nightlife-viet-nam',
  category: 'news',
  lang: 'vi',
  parent: PILLAR,
  title: {
    vi: 'Quy định nightlife Việt Nam 2026: giờ club, giấy phép, visa',
    en: 'Vietnam nightlife rules 2026: club hours, permits and visas',
  },
  excerpt: {
    vi: 'Club ở Việt Nam được mở đến mấy giờ? Nghị định 54/2019 và 148/2024, đề án kinh tế ban đêm, tiếng ồn, giấy phép biểu diễn, sáp nhập tỉnh và visa, giải thích cho dân EDM.',
    en: 'How late may Vietnamese clubs open? Decrees 54/2019 and 148/2024, the night-economy plans, noise, performance permits, the 2025 merger and visas, explained for EDM fans.',
  },
  body: { vi, en },
  cover: coverOf(cover),
  styles: ['edm', 'techno', 'house'],
  facts: [
    { label: { vi: 'Giờ vũ trường', en: 'Dance-hall hours' }, value: { vi: 'Không hoạt động 02:00–08:00 (Nghị định 54/2019)', en: 'Closed 02:00–08:00 (Decree 54/2019)' } },
    { label: { vi: 'Độ tuổi', en: 'Age' }, value: { vi: 'Từ 18 tuổi vào vũ trường', en: '18+ for dance halls' } },
    { label: { vi: 'Kinh tế ban đêm', en: 'Night economy' }, value: { vi: 'Quyết định 1129/QĐ-TTg (2020): thí điểm đến 06:00', en: 'Decision 1129/QĐ-TTg (2020): pilots until 06:00' } },
    { label: { vi: 'Đơn vị hành chính', en: 'Provinces' }, value: { vi: '34 từ 12/6/2025 (Nghị quyết 202/2025/QH15)', en: '34 since 12 June 2025 (Resolution 202/2025/QH15)' } },
    { label: { vi: 'Thị thực', en: 'Visas' }, value: { vi: 'E-visa mọi quốc tịch; miễn 45 ngày cho 24 nước', en: 'E-visa for all nationalities; 45 days visa-free for 24 countries' } },
    { label: { vi: 'Cập nhật', en: 'Updated' }, value: { vi: 'Tháng 10/2026', en: 'October 2026' } },
  ],
  faq: [
    { q: { vi: 'Club ở Việt Nam được mở đến mấy giờ?', en: 'How late may clubs in Vietnam open?' }, a: { vi: 'Theo Nghị định 54/2019/NĐ-CP, vũ trường không được hoạt động từ 02:00 đến 08:00. Nơi đăng ký loại hình khác không được văn bản này nêu rõ; hãy xem giờ club đăng cho từng đêm.', en: 'Under Decree 54/2019/NĐ-CP, dance halls may not operate from 02:00 to 08:00. Venues registered as something else are not clearly covered by it; check the hours each club posts for each night.' } },
    { q: { vi: 'Bao nhiêu tuổi được vào club ở Việt Nam?', en: 'What is the clubbing age in Vietnam?' }, a: { vi: '18 tuổi: Nghị định 54/2019 không cho người chưa đủ 18 tuổi vào vũ trường. Mang căn cước hoặc hộ chiếu.', en: '18: Decree 54/2019 bars anyone under 18 from dance halls. Carry your ID card or passport.' } },
    { q: { vi: 'Có nơi nào được mở cửa đến 6 giờ sáng không?', en: 'Can anywhere stay open until 6 am?' }, a: { vi: 'Quyết định 1129/QĐ-TTg cho thí điểm dịch vụ đến 06:00 ở 10 địa phương, và dự thảo của Hà Nội có khung 18:00–06:00 "có giới hạn, chọn lọc". Đến 22/10/2026 chúng tôi chưa thấy club nào được cấp phép rõ ràng mở quá 02:00.', en: 'Decision 1129/QĐ-TTg lets 10 localities pilot services until 06:00, and Hanoi\'s draft has an 18:00–06:00 band "on a limited, selective basis". As of 22 October 2026 we found no club clearly licensed past 02:00.' } },
    { q: { vi: 'Vì sao địa chỉ club ở TP.HCM đổi tên phường?', en: 'Why did Ho Chi Minh City club addresses change?' }, a: { vi: 'Nghị quyết 202/2025/QH15 sắp xếp lại đơn vị hành chính; từ 1/7/2025 cấp huyện thôi hoạt động và địa chỉ dùng phường mới, ví dụ Bùi Viện thuộc phường Bến Thành.', en: 'Resolution 202/2025/QH15 reorganised the administrative units; from 1 July 2025 the district level stopped and addresses use the new wards, Bùi Viện being in Bến Thành ward.' } },
    { q: { vi: 'DJ nước ngoài có cần giấy phép để biểu diễn ở Việt Nam không?', en: 'Does a foreign DJ need a permit to play in Vietnam?' }, a: { vi: 'Hoạt động biểu diễn thuộc Nghị định 144/2020/NĐ-CP; chúng tôi chưa đọc được quy định cụ thể cho nghệ sĩ nước ngoài, nên hãy để đơn vị tổ chức làm thủ tục với sở văn hoá.', en: 'Performances fall under Decree 144/2020/NĐ-CP; we have not read the specific rules for foreign performers, so let the organiser handle the paperwork with the culture department.' } },
  ],
  sources: [
    { title: 'Nghị định 54/2019/NĐ-CP về kinh doanh dịch vụ karaoke, dịch vụ vũ trường', url: 'https://luatvietnam.vn/thuong-mai/nghi-dinh-54-2019-nd-cp-ve-kinh-doanh-dich-vu-karaoke-174772-d1.html', publisher: 'LuatVietnam' },
    { title: 'Nghị định 148/2024/NĐ-CP sửa đổi Nghị định 54/2019/NĐ-CP', url: 'https://luatvietnam.vn/thuong-mai/nghi-dinh-148-2024-nd-cp-sua-nd-54-2019-nd-cp-kinh-doanh-dich-vu-karaoke-vu-truong-373191-d1.html', publisher: 'LuatVietnam' },
    { title: 'Chi tiết 34 đơn vị hành chính cấp tỉnh từ 12/6/2025', url: 'https://xaydungchinhsach.chinhphu.vn/chi-tiet-34-don-vi-hanh-chinh-cap-tinh-tu-12-6-2025-119250612141845533.htm', publisher: 'Báo Điện tử Chính phủ' },
    { title: 'Nghiên cứu thực trạng kinh tế đêm tại Việt Nam', url: 'https://tapchikinhtetaichinh.vn/nghien-cuu-thuc-trang-kinh-te-dem-tai-viet-nam-22852.html', publisher: 'Tạp chí Kinh tế - Tài chính' },
    { title: 'Hà Nội tính cho một số tuyến phố kinh doanh xuyên đêm', url: 'https://tuoitre.vn/ha-noi-tinh-cho-mot-so-tuyen-pho-kinh-doanh-xuyen-dem-de-gia-tang-muc-chi-tieu-cua-du-khach-20260530093917329.htm', publisher: 'Tuổi Trẻ' },
    { title: 'Hoạt động kinh tế đêm nếu gây ảnh hưởng nghiêm trọng đời sống cư dân sẽ bị dừng?', url: 'https://tuoitre.vn/hoat-dong-kinh-te-dem-neu-gay-anh-huong-nghiem-trong-doi-song-cu-dan-se-bi-dung-100261006124311675.htm', publisher: 'Tuổi Trẻ' },
    { title: 'Dự thảo Nghị định sửa đổi, bổ sung Nghị định 144/2020/NĐ-CP về nghệ thuật biểu diễn', url: 'https://luatvietnam.vn/van-hoa/du-thao-nghi-dinh-sua-doi-bo-sung-nghi-dinh-144-2020-nd-cp-ve-nghe-thuat-bieu-dien-451104-d10.html', publisher: 'LuatVietnam' },
    { title: 'Gây tiếng ồn vượt chuẩn: Đề xuất xử lý hình sự', url: 'https://tuoitre.vn/gay-tieng-on-vuot-chuan-de-xuat-xu-ly-hinh-su-20260507093242065.htm', publisher: 'Tuổi Trẻ' },
    { title: 'Đột kích quán bar APLUS, phát hiện nhiều trường hợp dương tính ma túy', url: 'https://tuoitre.vn/dot-kich-quan-bar-aplus-phat-hien-nhieu-truong-hop-duong-tinh-ma-tuy-2026020814261784.htm', publisher: 'Tuổi Trẻ' },
    { title: 'Miễn thị thực cho công dân 12 nước vào Việt Nam du lịch từ 15-8', url: 'https://tuoitre.vn/mien-thi-thuc-cho-cong-dan-12-nuoc-vao-viet-nam-du-lich-tu-15-8-20250811161456888.htm', publisher: 'Tuổi Trẻ' },
    { title: 'Sau sự cố chết 7 người ở lễ hội âm nhạc, bao giờ nhạc điện tử trở lại?', url: 'https://tuoitre.vn/sau-su-co-chet-7-nguoi-o-le-hoi-am-nhac-bao-gio-nhac-dien-tu-tro-lai-20181023101158338.htm', publisher: 'Tuổi Trẻ' },
    { title: 'Kinh tế đêm - vì sao thắp mãi chưa sáng?', url: 'https://thanhnien.vn/kinh-te-dem-vi-sao-thap-mai-chua-sang-185230503002958688.htm', publisher: 'Thanh Niên' },
  ],
  tracks: [],
};
