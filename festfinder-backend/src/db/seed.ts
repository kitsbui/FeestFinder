/**
 * Demo data lifted from the design prototypes, so every screen shows the same content
 * the designs do. Accounts:
 *   attendee   minh@example.com     / festfinder123
 *   organiser  team@ravolution.vn   / ravolution2026
 *   admin      admin@festfinder.vn  / festfinder-admin
 */
import type { Db, Queryable } from './index.ts';
import { json, many, one } from './index.ts';
import { hashPassword } from '../lib/crypto.ts';
import { L, type Localized } from '../lib/i18n.ts';
import { addDays, atVn } from '../lib/time.ts';
import { sha256 } from '../lib/crypto.ts';
import { appendAudit } from '../services/audit.ts';
import { refreshDerived } from '../services/events.ts';
import { assessRisk } from '../services/risk.ts';

const ART = {
  violetCyan: 'linear-gradient(135deg,#8C6BFF,#2AC4E8)',
  blueViolet: 'linear-gradient(135deg,#1B6BD6,#8C6BFF)',
  amber: 'linear-gradient(135deg,#FFB35C,#FF8A3D)',
  cyanGreen: 'linear-gradient(135deg,#2AC4E8,#2E9E5B)',
  hozo: 'linear-gradient(135deg,#8A2BE2,#2AC4E8 70%)',
  rap: 'linear-gradient(135deg,#FF8A3D,#8A2BE2)',
  blues: 'linear-gradient(135deg,#1B6BD6,#2AC4E8)',
  greenCyan: 'linear-gradient(135deg,#2E9E5B,#2AC4E8)',
  book: 'linear-gradient(135deg,#2E9E5B,#FFD35C)',
  yoko: 'linear-gradient(135deg,#FF8A3D,#FFD35C)',
};

const ORGS: Record<string, any> = {
  hozoco: { name: 'HOZO Festival Co.', initials: 'HZ', state: 'verified', since: 2019, followers: 18400, art: ART.hozo, type: 'public',
    bio: L('The team behind Ho Chi Minh City’s free riverside music festival. Three nights, four stages, no ticket.', 'Đội ngũ đứng sau lễ hội âm nhạc miễn phí bên bờ sông Sài Gòn. Ba đêm, bốn sân khấu, không cần vé.') },
  ravoent: { name: 'Ravolution Entertainment', initials: 'RE', state: 'verified', since: 2023, followers: 9260, art: ART.violetCyan, type: 'promoter',
    bio: L('Vietnam’s longest-running EDM festival brand. Two stages, full production, since 2016.', 'Thương hiệu lễ hội EDM lâu đời nhất Việt Nam. Hai sân khấu, sản xuất đầy đủ, từ 2016.'),
    website: 'https://ravolution.vn', legal: 'Công ty TNHH Ravolution Entertainment', tax: '0316548792', address: '12 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM',
    email: 'team@ravolution.vn', hotline: '1900 6868', zalo: 'Ravolution Official', contactName: 'Trần Minh', contactRole: 'Head of Marketing',
    bank: { bin: '970436', name: 'Vietcombank', no: '0071004471', holder: 'RAVOLUTION ENT', verified: true } },
  outcastco: { name: 'Saigon Outcast', initials: 'SO', state: 'verified', since: 2018, followers: 5120, art: ART.amber, type: 'venue',
    bio: L('A courtyard venue in Thảo Điền running weekend night markets, film nights and small live sets.', 'Không gian sân vườn ở Thảo Điền với chợ đêm cuối tuần, đêm chiếu phim và các set nhạc nhỏ.') },
  rvlive: { name: 'Rap Việt Live', initials: 'RV', state: 'verified', since: 2021, followers: 24800, art: ART.rap, type: 'promoter',
    bio: L('Touring hip-hop stages built around the Rap Việt roster, playing indoor arenas nationwide.', 'Chuỗi sân khấu hip-hop lưu diễn cùng dàn nghệ sĩ Rap Việt, diễn tại các nhà thi đấu toàn quốc.') },
  bluemonkey: { name: 'Blue Monkey Bar', initials: 'BM', state: 'pending', since: 2024, followers: 860, art: ART.blues, type: 'venue',
    bio: L('A small Thảo Điền bar with live blues and jazz four nights a week.', 'Quán bar nhỏ ở Thảo Điền với nhạc blues và jazz sống bốn đêm mỗi tuần.') },
  momangco: { name: 'Mơ Màng Productions', initials: 'MM', state: 'verified', since: 2020, followers: 31200, art: ART.cyanGreen, type: 'promoter',
    bio: L('Indie and singer-songwriter festivals in Saigon, Đà Lạt and Hà Nội. Known for daytime sets and low stages.', 'Lễ hội indie và singer-songwriter ở Sài Gòn, Đà Lạt và Hà Nội. Nổi tiếng với các set ban ngày và sân khấu thấp.') },
  hcmc: { name: 'HCMC Conservatory', initials: 'NV', state: 'verified', since: 2022, followers: 2140, art: ART.greenCyan, type: 'public',
    bio: L('Student and faculty concerts, chamber recitals and free morning programmes in District 1.', 'Hoà nhạc sinh viên và giảng viên, recital thất tấu và các chương trình buổi sáng miễn phí tại Quận 1.') },
  vinwonder: { name: '8Wonder', initials: '8W', state: 'verified', since: 2023, followers: 42600, art: ART.blueViolet, type: 'company',
    bio: L('Stadium-scale pop concerts with international headliners at Vinhomes Grand Park.', 'Concert pop quy mô sân vận động với khách mời quốc tế tại Vinhomes Grand Park.') },
  duongsachco: { name: 'Đường Sách Nguyễn Văn Bình', initials: 'ĐS', state: 'verified', since: 2017, followers: 3480, art: ART.book, type: 'public',
    bio: L('The book street in District 1, with author talks, signings and reading festivals all year.', 'Đường sách ở Quận 1, với giao lưu tác giả, ký tặng và các ngày hội đọc sách suốt năm.') },
  yoko: { name: 'Yoko Saigon', initials: 'YS', state: 'verified', since: 2014, followers: 1900, art: ART.yoko, type: 'venue',
    bio: L('Live music seven nights a week for over a decade.', 'Nhạc sống bảy tối một tuần suốt hơn mười năm.') },
  neondistrict: { name: 'Neon District', initials: 'ND', state: 'verified', since: 2024, followers: 1240, art: ART.violetCyan, type: 'promoter', bio: L('Rooftop electronic nights in District 1.', 'Đêm nhạc điện tử trên sân thượng ở Quận 1.') },
  w12: { name: 'W12 Collective', initials: 'W1', state: 'pending', since: 2026, followers: 0, art: ART.blueViolet, type: 'promoter', bio: L('Warehouse techno.', 'Techno nhà kho.'), docs: { id: true }, bankRecent: true },
  bside: { name: 'Bside Cafe', initials: 'BC', state: 'pending', since: 2025, followers: 310, art: ART.cyanGreen, type: 'venue', bio: L('Acoustic sets at sunset in Thảo Điền.', 'Acoustic hoàng hôn ở Thảo Điền.'), docs: { id: true, tax: true, bank: true } },
  tripside: { name: 'Tripside Travel', initials: 'TT', state: 'flagged', since: 2024, followers: 780, art: ART.amber, type: 'agency', bio: L('Festival bus trips out of Saigon.', 'Xe đi lễ hội từ Sài Gòn.'), docs: { tax: true, bank: true } },
  sunside: { name: 'Sunside Club', initials: 'SC', state: 'verified', since: 2025, followers: 420, art: ART.cyanGreen, type: 'venue', bio: L('Pool parties in District 2.', 'Tiệc hồ bơi ở Quận 2.'), docs: { id: true, tax: true, bank: true } },
  concrete: { name: 'Concrete Crew', initials: 'CC', state: 'pending', since: 2025, followers: 150, art: ART.rap, type: 'promoter', bio: L('Hip-hop cyphers and warehouse raves.', 'Cypher hip-hop và rave nhà kho.') },
};

const VENUES: Record<string, [string, string, string, number, number]> = {
  secc: ['SECC — TT Hội chợ & Triển lãm Sài Gòn', '799 Nguyễn Văn Linh, P. Tân Phú', 'Quận 7', 10.7295, 106.7217],
  phuthoStadium: ['Sân vận động Phú Thọ', '219 Lý Thường Kiệt, P. Phú Thọ', 'Quận 11', 10.7714, 106.657],
  outcast: ['Saigon Outcast', '188/1 Nguyễn Văn Hưởng, TP. Thủ Đức', 'Thảo Điền', 10.8065, 106.7411],
  phuthoArena: ['Nhà thi đấu Phú Thọ', '1 Lữ Gia, P. Phú Thọ', 'Quận 11', 10.7692, 106.6538],
  riverside: ['Công viên bờ sông Sài Gòn', 'Đường Nguyễn Thiện Thành, TP. Thủ Đức', 'Thủ Đức', 10.7876, 106.7095],
  bluemonkey: ['Blue Monkey Bar Saigon', 'Hẻm 199M Nguyễn Văn Hưởng, P. An Khánh', 'Thảo Điền', 10.8038, 106.7364],
  idecaf: ['IDECAF', '31 Thái Văn Lung, P. Bến Nghé', 'Quận 1', 10.7808, 106.7042],
  grandpark: ['Vinhomes Grand Park', 'Nguyễn Xiển, TP. Thủ Đức', 'Thủ Đức', 10.8412, 106.833],
  duongsach: ['Đường sách Nguyễn Văn Bình', 'Nguyễn Văn Bình, P. Bến Nghé', 'Quận 1', 10.7797, 106.6993],
  yoko: ['Yoko Saigon', '22A Nguyễn Thị Diệu, P. Xuân Hòa', 'Quận 3', 10.7783, 106.6906],
  reverie: ['The Reverie Rooftop', '22-36 Nguyễn Huệ, P. Bến Nghé', 'Quận 1', 10.7743, 106.7045],
  neonRooftop: ['Neon District Rooftop', '77 Nguyễn Huệ, P. Bến Nghé', 'Quận 1', 10.774, 106.704],
  bside: ['Bside Cafe', '12 Thảo Điền, P. Thảo Điền', 'Thảo Điền', 10.803, 106.735],
  baiSau: ['Bãi Sau, Vũng Tàu', 'Thùy Vân, Vũng Tàu', 'Vũng Tàu', 10.346, 107.0843],
};

interface EventSeed {
  org: string; title: string; genre: string; starts: string; ends?: string; time: [string, string];
  venue?: keyof typeof VENUES; unresolved?: { name: string; address: string; area: string };
  price?: number; hype?: number; featured?: boolean; badge?: string; soldOut?: boolean; age?: string;
  lineup?: string[]; artists?: string[]; art?: string; status?: string; capacity?: number;
  description?: Localized; ticketUrl?: string; eventUrl?: string; brandUrl?: string; logo?: boolean; cover?: string;
}

const EVENTS: Record<string, EventSeed> = {
  hozo: { org: 'hozoco', title: 'HOZO Super Fest', genre: 'Festival', starts: '2026-09-18', ends: '2026-09-20', time: ['17:00', '23:00'], venue: 'riverside',
    hype: 4820, featured: true, badge: 'trending', art: ART.hozo, lineup: ['Trúc Nhân', 'Hoàng Thùy Linh', 'DTAP', 'Phương Mỹ Chi'], eventUrl: 'https://hozo.vn',
    description: L('Three nights on the Saigon riverside with four stages running in parallel, from Vietnamese pop headliners to a folk stage and a late electronic tent. Entry is free and unticketed; the site opens at 17:00 and the main stage runs until 23:00.',
      'Ba đêm bên bờ sông Sài Gòn với bốn sân khấu chạy song song, từ dàn ca sĩ pop Việt tới sân khấu dân gian và lều điện tử về khuya. Vào cửa miễn phí, không cần vé; khu vực mở từ 17:00 và sân khấu chính diễn đến 23:00.') },
  ravo: { org: 'ravoent', title: 'Ravolution Music Festival', genre: 'EDM', starts: '2026-09-19', time: ['16:00', '02:00'], venue: 'secc', price: 1_200_000,
    hype: 2140, featured: true, badge: 'low_tickets', art: ART.violetCyan, age: '18+', capacity: 4800, lineup: ['Hoaprox', 'DJ Mie', 'Wukong'], logo: true,
    ticketUrl: 'https://ticketbox.vn/ravolution-2026', eventUrl: 'https://festfinder.vn/e/ravolution-2026', brandUrl: 'https://ravolution.vn',
    description: L('An indoor electronic festival at SECC with two stages and full production. Doors at 16:00, last set at 02:00. The ticket includes re-entry until 22:00, so you can step out for food and come back.',
      'Lễ hội điện tử trong nhà tại SECC với hai sân khấu và sản xuất đầy đủ. Mở cửa 16:00, set cuối 02:00. Vé cho phép ra vào lại đến 22:00, bạn có thể ra ngoài ăn rồi quay lại.') },
  outcast: { org: 'outcastco', title: 'Saigon Outcast Night Market', genre: 'Food', starts: '2026-09-19', ends: '2026-09-20', time: ['16:00', '22:00'], venue: 'outcast',
    hype: 530, art: ART.amber, lineup: ['60+ gian hàng / vendors', 'DJ set 19:00'], artists: [],
    description: L('A weekend night market in the Saigon Outcast courtyard: more than sixty food and craft stalls, a DJ set from 19:00 and seating under the trees. Free to walk in, pay per stall.',
      'Chợ đêm cuối tuần trong sân Saigon Outcast: hơn sáu mươi gian hàng ăn uống và đồ thủ công, DJ set từ 19:00 và chỗ ngồi dưới hàng cây. Vào cửa miễn phí, trả tiền theo từng gian.') },
  rapviet: { org: 'rvlive', title: 'Rap Việt Live Stage', genre: 'Hip-Hop', starts: '2026-09-20', time: ['19:00', '23:00'], venue: 'phuthoArena', price: 650_000,
    hype: 1780, soldOut: true, art: ART.rap, age: '16+', lineup: ['Wowy', 'Karik', 'Blacka', 'Rhymastic'], ticketUrl: 'https://ticketbox.vn/rap-viet-live',
    description: L('The Rap Việt live roster on an indoor arena stage at Phú Thọ, with a full band behind the rappers. This date is sold out; the organiser releases returns on the event page occasionally.',
      'Dàn nghệ sĩ Rap Việt trên sân khấu nhà thi đấu Phú Thọ, có band chơi trực tiếp phía sau. Đêm này đã hết vé; nhà tổ chức thỉnh thoảng mở bán lại vé trả về trên trang sự kiện.') },
  blues: { org: 'bluemonkey', title: 'Vietnam Blues Experience', genre: 'Jazz', starts: '2026-09-14', time: ['19:00', '23:00'], venue: 'bluemonkey', price: 150_000,
    hype: 312, badge: 'selling_fast', art: ART.blues, age: '18+', lineup: ['Saigon Blues Collective', 'Hoàng Minh'], ticketUrl: 'https://bluemonkey.vn/tickets',
    description: L('A weekly blues night in a small Thảo Điền bar. Two sets, the first at 19:30, the second after 21:30. Tables are first come, first served.',
      'Đêm blues hàng tuần trong một quán bar nhỏ ở Thảo Điền. Hai set, set đầu 19:30, set sau từ 21:30. Bàn theo thứ tự đến trước.') },
  momang: { org: 'momangco', title: 'Những Thành Phố Mơ Màng', genre: 'Indie', starts: '2026-09-26', time: ['15:00', '22:30'], venue: 'phuthoStadium', price: 890_000,
    hype: 3260, badge: 'selling_fast', art: ART.cyanGreen, lineup: ['Đen', 'Vũ.', 'Hoàng Dũng', 'Chillies'], ticketUrl: 'https://ticketbox.vn/mo-mang-2026',
    description: L('A daytime-into-night indie festival at Phú Thọ stadium, built around Vietnamese singer-songwriters. Gates at 15:00, low stages, picnic seating on the field.',
      'Lễ hội indie từ chiều sang đêm tại sân Phú Thọ, xoay quanh các singer-songwriter Việt. Mở cổng 15:00, sân khấu thấp, ngồi picnic trên sân.') },
  nhacvien: { org: 'hcmc', title: 'Hòa nhạc Nhạc viện TP.HCM', genre: 'Culture', starts: '2026-09-16', time: ['09:00', '11:30'], venue: 'idecaf',
    hype: 41, art: ART.greenCyan, lineup: ['Sinh viên Nhạc viện TP.HCM'],
    description: L('A free morning concert by students of the HCMC Conservatory at IDECAF. Chamber and orchestral programme, roughly ninety minutes with one interval.',
      'Hoà nhạc buổi sáng miễn phí do sinh viên Nhạc viện TP.HCM biểu diễn tại IDECAF. Chương trình hoà tấu và giao hưởng, khoảng chín mươi phút, có một lần nghỉ.') },
  '8wonder': { org: 'vinwonder', title: '8Wonder Concert', genre: 'Pop', starts: '2026-10-03', time: ['18:00', '23:00'], venue: 'grandpark', price: 1_500_000,
    hype: 5940, badge: 'going_500', art: ART.blueViolet, lineup: ['Soobin Hoàng Sơn', 'HIEUTHUHAI'], ticketUrl: 'https://ticketbox.vn/8wonder',
    description: L('A stadium pop concert at Vinhomes Grand Park with Vietnamese headliners and an international guest. Gates at 18:00; the venue is a forty-minute drive from District 1.',
      'Concert pop sân vận động tại Vinhomes Grand Park với dàn ca sĩ Việt và một khách mời quốc tế. Mở cổng 18:00; địa điểm cách Quận 1 khoảng bốn mươi phút xe.') },
  duongsach: { org: 'duongsachco', title: 'Đường sách Nguyễn Văn Bình Book Fest', genre: 'Culture', starts: '2026-09-12', time: ['08:00', '21:00'], venue: 'duongsach',
    hype: 210, art: ART.book, lineup: ['Giao lưu tác giả'], artists: [],
    description: L('An all-day book festival along the District 1 book street, with author talks, signings and publisher stalls. Free, open from 08:00 to 21:00.',
      'Ngày hội sách cả ngày dọc đường sách Quận 1, có giao lưu tác giả, ký tặng và gian hàng nhà xuất bản. Miễn phí, mở từ 08:00 đến 21:00.') },
  'yoko-sinco': { org: 'yoko', title: 'Classic Pop Rock Hits — Sinco Band', genre: 'Pop', starts: '2026-09-14', time: ['20:45', '23:30'], venue: 'yoko', price: 120_000,
    hype: 96, badge: 'just_added', art: ART.yoko, age: '18+', lineup: ['Sinco Band'], ticketUrl: 'https://yokosaigon.vn',
    description: L('Yoko has run live music seven nights a week for over a decade. Sinco Band plays the classic pop-rock set — no cover after 23:00.',
      'Yoko chơi nhạc sống bảy tối một tuần suốt hơn mười năm. Sinco Band chơi set pop-rock kinh điển — miễn phí vào cửa sau 23:00.') },
  // Ravolution's back office
  'ravo-warmup': { org: 'ravoent', title: 'Ravolution Warm-up · Rooftop', genre: 'EDM', starts: '2026-09-18', time: ['19:00', '23:00'], venue: 'reverie', price: 350_000,
    hype: 640, art: ART.blueViolet, age: '18+', capacity: 900, lineup: ['DJ Mie', 'Trần Duy', 'SlimV'], logo: true, ticketUrl: 'https://ticketbox.vn/ravolution-warmup', eventUrl: 'https://ravolution.vn/warmup',
    description: L('A rooftop warm-up the night before the festival, with three local selectors and the city skyline.', 'Đêm khởi động trên sân thượng trước lễ hội, ba DJ địa phương và toàn cảnh thành phố.') },
  'ravo-after-hours': { org: 'ravoent', title: 'Ravolution After Hours', genre: 'EDM', starts: '2026-09-20', time: ['02:00', '06:00'], status: 'in_review',
    unresolved: { name: 'Warehouse — Quận 4', address: 'Tôn Thất Thuyết, Quận 4', area: 'Quận 4' }, price: 300_000, art: ART.amber, age: '18+', logo: true,
    lineup: ['Closing b2b', 'Triple D'], ticketUrl: 'https://ticketbox.vn/ravolution-after-hours', eventUrl: 'https://ravolution.vn/after-hours',
    description: L('Keep going after the festival closes.', 'Tiếp tục sau khi lễ hội đóng cửa.') },
  'ravo-bus': { org: 'ravoent', title: 'Ravolution Bus · Vũng Tàu', genre: 'EDM', starts: '2026-10-03', time: ['06:00', '22:00'], status: 'draft',
    unresolved: { name: 'Bãi Sau, Vũng Tàu', address: 'Thùy Vân, Vũng Tàu', area: 'Vũng Tàu' }, art: ART.cyanGreen, lineup: [] },
  'ravo-2025': { org: 'ravoent', title: 'Ravolution Music Festival 2025', genre: 'EDM', starts: '2025-09-20', time: ['16:00', '02:00'], venue: 'secc', price: 1_100_000,
    hype: 1980, art: ART.violetCyan, age: '18+', capacity: 4500, lineup: ['Hoaprox', 'KSHMR'], ticketUrl: 'https://ticketbox.vn/ravolution-2025' },
  // Past editions for organiser profiles
  'hozo-2025': { org: 'hozoco', title: 'HOZO Super Fest 2025', genre: 'Festival', starts: '2025-12-12', ends: '2025-12-14', time: ['17:00', '23:00'], venue: 'riverside', hype: 4100, art: ART.hozo, lineup: ['Mỹ Tâm'] },
  'momang-2025': { org: 'momangco', title: 'Những Thành Phố Mơ Màng 2025', genre: 'Indie', starts: '2025-09-27', time: ['15:00', '22:30'], venue: 'phuthoStadium', price: 790_000, hype: 2900, art: ART.cyanGreen, lineup: ['Ngọt'] },
  '8wonder-winter': { org: 'vinwonder', title: '8Wonder Winter', genre: 'Pop', starts: '2025-12-06', time: ['18:00', '23:00'], venue: 'grandpark', price: 1_400_000, hype: 5100, art: ART.blueViolet, lineup: ['Maroon 5'] },
  'bside-acoustic-1': { org: 'bside', title: 'Bside Acoustic Night · Vol. 1', genre: 'Indie', starts: '2026-06-14', time: ['18:00', '21:00'], venue: 'bside', price: 120_000, art: ART.cyanGreen, lineup: ['Thiện Thảo'] },
  'bside-acoustic-2': { org: 'bside', title: 'Bside Acoustic Night · Vol. 2', genre: 'Indie', starts: '2026-08-09', time: ['18:00', '21:00'], venue: 'bside', price: 120_000, art: ART.cyanGreen, lineup: ['Mỹ Anh'] },
  // Moderation queue
  'neon-rooftop-session': { org: 'neondistrict', title: 'Neon District Rooftop Session', genre: 'EDM', starts: '2026-09-26', time: ['20:00', '01:00'], venue: 'neonRooftop', price: 450_000,
    status: 'in_review', art: ART.violetCyan, lineup: ['Wukong', 'SlimV', 'Kreo'], logo: true, cover: 'neon-2026', ticketUrl: 'https://ticketbox.vn/neon-rooftop', eventUrl: 'https://neondistrict.vn' },
  'underground-techno-w12': { org: 'w12', title: 'Underground Techno — Warehouse 12', genre: 'EDM', starts: '2026-09-25', time: ['22:00', '05:00'], status: 'in_review',
    unresolved: { name: 'Warehouse 12', address: '12 Tôn Thất Thuyết, Quận 4', area: 'Quận 4' }, price: 300_000, art: ART.blueViolet, lineup: ['Dark Tempo'], logo: true, cover: 'w12-2026',
    ticketUrl: 'https://w12.vn/tickets', eventUrl: 'https://w12.vn' },
  'acoustic-sunset-bside': { org: 'bside', title: 'Acoustic Sunset · Thảo Điền', genre: 'Indie', starts: '2026-09-27', time: ['17:30', '20:00'], venue: 'bside', price: 150_000,
    status: 'in_review', art: ART.cyanGreen, capacity: 80, lineup: ['Hà Myo', 'Thiện Thảo', 'Ngũ Cung'], logo: true, cover: 'bside-sunset', ticketUrl: 'https://bside.vn/sunset', eventUrl: 'https://bside.vn' },
  'edm-beach-bus': { org: 'tripside', title: 'EDM Beach Bus — Vũng Tàu', genre: 'EDM', starts: '2026-10-03', time: ['06:00', '23:00'], status: 'in_review',
    venue: 'baiSau', price: 690_000, art: ART.amber, lineup: ['Local DJs'], logo: true, cover: 'tripside-bus',
    ticketUrl: 'https://tripside.vn/beach-bus-404', eventUrl: 'https://tripside.vn' },
  // Report subjects
  'edm-beach-bus-mui-ne': { org: 'tripside', title: 'EDM Beach Bus — Mũi Né', genre: 'EDM', starts: '2025-08-16', time: ['06:00', '23:00'], venue: 'secc', price: 650_000, art: ART.amber, cover: 'tripside-bus', lineup: ['Local DJs'] },
  'warehouse-rave-q4': { org: 'concrete', title: 'Warehouse Rave · Quận 4', genre: 'Hip-Hop', starts: '2026-09-25', time: ['21:00', '03:00'], venue: 'secc', price: 250_000, art: ART.rap, lineup: ['Concrete Crew'] },
  'rooftop-sessions-vol3': { org: 'neondistrict', title: 'Rooftop Sessions · Vol. 3', genre: 'EDM', starts: '2026-09-24', time: ['20:00', '00:00'], venue: 'neonRooftop', price: 400_000, art: ART.violetCyan, lineup: ['Wukong'] },
  // Appeals
  'rooftop-nye-countdown': { org: 'neondistrict', title: 'Rooftop NYE Countdown', genre: 'EDM', starts: '2026-12-31', time: ['20:00', '01:00'], venue: 'neonRooftop', price: 500_000, status: 'rejected', art: ART.blueViolet, lineup: ['Wukong'] },
  'pool-party-q2': { org: 'sunside', title: 'Pool Party · Quận 2', genre: 'EDM', starts: '2026-10-10', time: ['14:00', '22:00'], venue: 'reverie', price: 350_000, status: 'rejected', art: ART.cyanGreen, lineup: ['SlimV'] },
};

const m = (h: number, min = 0) => h * 60 + min;
const TIMETABLES: Record<string, { stages: [Localized, [string, number, number][]][]; day: string }[]> = {
  hozo: [
    { day: '2026-09-18', stages: [
      [L('Main stage', 'Sân khấu chính'), [['Mỹ Tâm', m(17, 30), m(18, 40)], ['Hà Anh Tuấn', m(19, 10), m(20, 20)], ['Sơn Tùng M-TP', m(21), m(22, 40)]]],
      [L('Riverside stage', 'Sân khấu bờ sông'), [['Ngọt', m(17, 45), m(18, 45)], ['Cá Hồi Hoang', m(19, 30), m(20, 30)], ['Da LAB', m(21, 15), m(22, 30)]]],
      [L('Folk tent', 'Lều dân gian'), [['Đàn tranh ensemble', m(17), m(18)], ['Hoàng Thùy Linh', m(19), m(20, 10)], ['Hà Mỹ và bạn', m(21, 30), m(22, 45)]]]] },
    { day: '2026-09-19', stages: [
      [L('Main stage', 'Sân khấu chính'), [['Phương Ly', m(17, 30), m(18, 30)], ['Bích Phương', m(19), m(20, 15)], ['Đen Vâu', m(21), m(22, 45)]]],
      [L('Riverside stage', 'Sân khấu bờ sông'), [['Chillies', m(18), m(19)], ['Vũ.', m(19, 45), m(20, 50)], ['Hoaprox', m(21, 30), m(22, 50)]]],
      [L('Folk tent', 'Lều dân gian'), [['Cải lương trẻ', m(17, 15), m(18, 15)], ['Hà Trần', m(19, 20), m(20, 20)], ['Lê Cát Trọng Lý', m(21), m(22, 15)]]]] },
    { day: '2026-09-20', stages: [
      [L('Main stage', 'Sân khấu chính'), [['Tùng Dương', m(17, 30), m(18, 40)], ['Hồ Ngọc Hà', m(19, 10), m(20, 20)], ['Mỹ Linh', m(21), m(22, 30)]]],
      [L('Riverside stage', 'Sân khấu bờ sông'), [['Thiện Thảo', m(18), m(19)], ['Mỹ Anh', m(19, 40), m(20, 45)], ['tlinh', m(21, 20), m(22, 40)]]],
      [L('Folk tent', 'Lều dân gian'), [['Nhạc cụ dân tộc', m(17), m(18)], ['Ngô Hồng Quang', m(19), m(20, 10)], ['Closing set', m(21, 30), m(22, 45)]]]] },
  ],
  ravo: [
    { day: '2026-09-19', stages: [
      [L('Arena stage', 'Sân khấu arena'), [['Wukong', m(16, 30), m(17, 45)], ['DJ Mie', m(18), m(19, 30)], ['Hoaprox', m(20), m(21, 30)], ['Alan Walker', m(22), m(23, 45)]]],
      [L('Bass room', 'Phòng bass'), [['Trần Duy', m(17), m(18, 30)], ['SlimV', m(19), m(20, 45)], ['Triple D', m(21, 15), m(23)], ['Closing b2b', m(23, 30), m(25, 30)]]]] },
  ],
};

const SITE: [string, string, number, number, number][] = [
  ['Mainstage', 'stage', 50, 22, 62], ['Bass Arena', 'stage', 22, 52, 34], ['Food court', 'food', 74, 52, 34],
  ['Entry / exit', 'entry', 50, 86, 40], ['Medical', 'medical', 86, 82, 26], ['Toilets', 'toilets', 14, 82, 24],
];

const FRIENDS: { key: string; name: string; source: 'fb' | 'ig' | 'zalo'; going: string[]; interested: string[] }[] = [
  { key: 'f1', name: 'Minh Trần', source: 'fb', going: ['ravo', 'hozo'], interested: ['momang'] },
  { key: 'f2', name: 'Linh Phạm', source: 'ig', going: ['ravo'], interested: ['blues'] },
  { key: 'f3', name: 'Đức Nguyễn', source: 'zalo', going: ['hozo', 'outcast'], interested: ['ravo'] },
  { key: 'f4', name: 'Thu Hà', source: 'fb', going: ['momang'], interested: ['hozo', 'rapviet'] },
  { key: 'f5', name: 'Quang Lê', source: 'ig', going: ['blues'], interested: ['outcast'] },
  { key: 'f6', name: 'Ngọc Anh', source: 'zalo', going: ['ravo', 'momang'], interested: [] },
];

const FAQ: [Localized, Localized][] = [
  [L('Which events this weekend are free?', 'Cuối tuần này sự kiện nào miễn phí?'),
    L('Two. HOZO Super Fest runs on the Saigon riverside park from 18 to 20 September, 17:00–23:00, and the Saigon Outcast Night Market in Thảo Điền runs 19–20 September, 16:00–22:00. Both are open to all ages and need no ticket.',
      'Hai sự kiện. HOZO Super Fest tại công viên bờ sông Sài Gòn từ 18 đến 20/9, 17:00–23:00, và Saigon Outcast Night Market ở Thảo Điền ngày 19–20/9, 16:00–22:00. Cả hai mở cho mọi lứa tuổi và không cần vé.')],
  [L('How much are Ravolution tickets?', 'Vé Ravolution giá bao nhiêu?'),
    L('From 1.200.000₫ for general admission at SECC in District 7. Doors open at 16:00 and the ticket includes re-entry until 22:00. Tickets are marked low, so the price tier may move before Saturday.',
      'Từ 1.200.000₫ cho vé thường tại SECC, Quận 7. Mở cửa 16:00 và vé bao gồm ra vào lại đến 22:00. Vé đang còn ít nên mức giá có thể thay đổi trước thứ Bảy.')],
  [L('Is anything already sold out?', 'Có show nào đã hết vé chưa?'),
    L('Rap Việt Live Stage at Nhà thi đấu Phú Thọ on Sunday 20 September is sold out. Resale is handled by the ticketing partner, not by FestFinder — we mark a listing sold out within minutes of the organizer updating it.',
      'Rap Việt Live Stage tại Nhà thi đấu Phú Thọ ngày Chủ nhật 20/9 đã hết vé. Việc sang nhượng do đối tác bán vé xử lý, không phải FestFinder — chúng tôi đánh dấu hết vé trong vài phút sau khi nhà tổ chức cập nhật.')],
  [L('How do I get to the riverside park for HOZO?', 'Đi tới công viên bờ sông dự HOZO thế nào?'),
    L('The entrance is on Nguyễn Thiện Thành in Thủ Đức, about 4 km from District 1. Parking near the gates fills before 18:00, so arriving early or by ride-hail is the safer plan on festival nights.',
      'Cổng vào nằm trên đường Nguyễn Thiện Thành, Thủ Đức, cách Quận 1 khoảng 4 km. Bãi xe gần cổng thường đầy trước 18:00, nên đến sớm hoặc đi xe công nghệ sẽ chắc chắn hơn trong các đêm lễ hội.')],
];

export interface SeedOptions { volume: 'full' | 'small'; log?: (m: string) => void }

export async function seed(db: Db, now: Date, opts: SeedOptions) {
  const existing = await one<any>(db, 'select count(*)::int as n from users');
  if (existing.n > 0) {
    opts.log?.('database already has users; skipping seed (run db:reset to start over)');
    return { skipped: true };
  }
  const log = opts.log ?? (() => {});
  const scale = opts.volume === 'full' ? 1 : 0.02;
  const n = (x: number) => Math.max(1, Math.round(x * scale));
  const hours = (h: number) => new Date(now.getTime() - h * 3600_000);

  const [adminHash, demoHash, orgHash] = await Promise.all([hashPassword('festfinder-admin'), hashPassword('festfinder123'), hashPassword('ravolution2026')]);

  return db.tx(async (q) => {
    const ids = { org: {} as Record<string, string>, venue: {} as Record<string, string>, event: {} as Record<string, string>, friend: {} as Record<string, string> };

    // ---- people ----
    const admin = await one<any>(q, `insert into users (name, email, password_hash, signup_method, role, city, locale, created_at) values ('FestFinder Admin','admin@festfinder.vn',$1,'email','admin','TP.HCM','en',$2) returning id`, [adminHash, hours(24 * 400)]);
    const demo = await one<any>(q,
      `insert into users (name, email, phone, password_hash, signup_method, city, locale, interests, birth_year, payee_bank_bin, payee_bank_name, payee_account_no, payee_account_name, created_at)
       values ('Minh Anh','minh@example.com','+84901234567',$1,'email','TP.HCM','en','{EDM,Indie,Nightlife}',1998,'970436','Vietcombank','0071008842','NGUYEN MINH ANH',$2) returning id`, [demoHash, hours(24 * 300)]);
    const orgUser = await one<any>(q, `insert into users (name, email, phone, password_hash, signup_method, city, created_at) values ('Trần Minh','team@ravolution.vn','+84903112884',$1,'email','TP.HCM',$2) returning id`, [orgHash, hours(24 * 500)]);
    await q.query(`insert into social_connections (user_id, provider, external_id, display_name) values ($1,'fb','fb-minh-anh','Minh Anh')`, [demo.id]);

    for (const [i, f] of FRIENDS.entries()) {
      const u = await one<any>(q, `insert into users (name, phone, signup_method, city, last_active_at, created_at) values ($1,$2,$3,'TP.HCM',$4,$5) returning id`,
        [f.name, `+8490800000${i + 1}`, f.source === 'zalo' ? 'zalo' : f.source, i % 2 === 0 ? hours(0.02) : hours(30), hours(24 * 200)]);
      ids.friend[f.key] = u.id;
      await q.query(`insert into social_connections (user_id, provider, external_id, display_name) values ($1,$2,$3,$4)`, [u.id, f.source, f.source === 'zalo' ? `+8490800000${i + 1}` : `${f.source}-${f.key}`, f.name]);
      await q.query(`insert into friendships (user_id, friend_id, source) values ($1,$2,$3), ($2,$1,$3)`, [demo.id, u.id, f.source]);
    }

    // Synthetic attendees: names, 44% with email, 71% with a phone app installed, 83% on Zalo.
    const people = opts.volume === 'full' ? 6000 : 120;
    await q.query(
      `insert into users (name, email, phone, signup_method, city, birth_year, interests, created_at, last_active_at)
       select (array['Nguyễn','Trần','Lê','Phạm','Hoàng','Huỳnh','Phan','Vũ','Võ','Đặng','Bùi','Đỗ','Hồ','Ngô','Dương','Lý'])[1 + i % 16] || ' ' ||
              (array['Văn','Thị','Hoài','Đức','Khánh','Thanh','Mỹ','Quang','Gia','Thu','Nhật','Kim','Minh','Ngọc'])[1 + (i / 3) % 14] || ' ' ||
              (array['An','Thịnh','Ly','Tùng','Linh','Huy','Hân','Trang','Minh','Ngân','Bảo','Vy','Khang','Phúc','Tâm','Nhi','Long','Hương','Duy','Trâm'])[1 + (i * 7) % 20],
              case when i % 25 < 11 then 'guest' || i || '@example.com' end,
              '+849' || lpad(i::text, 8, '0'),
              case when i % 25 < 11 then 'email' else 'zalo' end,
              case when i % 100 < 61 then 'TP.HCM' when i % 100 < 83 then 'Hà Nội' when i % 100 < 92 then 'Đà Nẵng' else '' end,
              1996 + i % 14,
              case when i % 100 < 71 then '{EDM,Nightlife}'::text[] else '{Indie,Food}'::text[] end,
              $1::timestamptz - make_interval(days => i % 365),
              case when i % 100 < 23 then $1::timestamptz - make_interval(hours => i % 150) else $1::timestamptz - make_interval(days => 8 + i % 60) end
         from generate_series(1, $2) i`, [now, people]);
    const synthetic = `(select id, row_number() over (order by phone) as rn, phone from users where phone like '+84900%')`;
    await q.query(`insert into devices (token, user_id, platform) select 'demo-device-' || rn, id, case when rn % 3 = 0 then 'ios' else 'android' end from ${synthetic} s where rn % 100 < 71`);
    await q.query(`insert into social_connections (user_id, provider, external_id) select id, 'zalo', phone from ${synthetic} s where rn % 100 < 83`);
    await q.query(`insert into user_activity_days (user_id, day) select id, ($1::date - (rn % 6)::int) from ${synthetic} s where rn % 100 < 23`, [now]);
    await q.query(`insert into user_activity_days (user_id, day) select id, ($1::date - 8 - (rn % 5)::int) from ${synthetic} s where rn % 100 < 30 on conflict do nothing`, [now]);

    // ---- organisers & venues ----
    for (const [slug, o] of Object.entries(ORGS)) {
      const row = await one<any>(q,
        `insert into organizers (slug, name, initials, type, bio, art, website, legal_name, tax_code, address, email, hotline, zalo, contact_name, contact_role,
                                 since_year, followers_count, verification_state, doc_id, doc_tax, doc_bank, bank_name, bank_bin, bank_account_no, bank_account_name, bank_verified, bank_added_at, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28) returning id`,
        [slug, o.name, o.initials, o.type, json(o.bio), o.art, o.website ?? null, o.legal ?? null, o.tax ?? null, o.address ?? null, o.email ?? null,
          o.hotline ?? null, o.zalo ?? null, o.contactName ?? null, o.contactRole ?? null, o.since, o.followers, o.state,
          o.state === 'verified' || !!o.docs?.id, o.state === 'verified' || !!o.docs?.tax, o.state === 'verified' || !!o.docs?.bank,
          o.bank?.name ?? (o.bankRecent ? 'Techcombank' : null), o.bank?.bin ?? (o.bankRecent ? '970407' : null), o.bank?.no ?? (o.bankRecent ? '19036677889900' : null),
          o.bank?.holder ?? null, o.bank?.verified ?? false, o.bankRecent ? hours(48) : o.bank ? hours(24 * 400) : null, hours(24 * 365 * Math.max(0.1, 2026 - o.since))]);
      ids.org[slug] = row.id;
    }
    await q.query(`insert into organizer_members (organizer_id, user_id, role) values ($1,$2,'owner')`, [ids.org.ravoent, orgUser.id]);

    for (const [key, [name, address, area, lat, lng]] of Object.entries(VENUES)) {
      const row = await one<any>(q, 'insert into venues (name, address, area, lat, lng, permit_on_file) values ($1,$2,$3,$4,$5,$6) returning id', [name, address, area, lat, lng, key === 'secc' || key === 'grandpark']);
      ids.venue[key] = row.id;
    }

    // ---- events ----
    for (const [slug, e] of Object.entries(EVENTS)) {
      const v = e.venue ? VENUES[e.venue] : null;
      const status = e.status ?? 'live';
      const paid = !!e.price;
      const row = await one<any>(q,
        `insert into events (slug, organizer_id, title, genre, description, venue_id, venue_name, address, area, lat, lng, starts_on, ends_on, start_time, end_time,
                             entry_mode, price_from, capacity, age, lineup, artists, art, logo_url, cover_url, cover_sha256, ticket_url, event_url, brand_url, badge, featured,
                             sold_out, hype_count, status, published_at, submitted_at, decided_at, ticket_link_status, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38) returning id`,
        [slug, ids.org[e.org], e.title, e.genre, json(e.description ?? { en: '', vi: '' }),
          e.venue ? ids.venue[e.venue] : null, v ? v[0] : e.unresolved?.name ?? null, v ? v[1] : e.unresolved?.address ?? null, v ? v[2] : e.unresolved?.area ?? null,
          v ? v[3] : null, v ? v[4] : null, e.starts, e.ends ?? e.starts, e.time[0], e.time[1],
          paid ? 'paid' : e.status === 'draft' ? 'paid' : 'free', e.price ?? 0, e.capacity ?? null, e.age ?? 'All ages', e.lineup ?? [], e.artists ?? e.lineup ?? [], e.art ?? ART.violetCyan,
          e.logo ? `https://assets.festfinder.vn/logos/${e.org}.png` : null,
          e.cover ? `https://assets.festfinder.vn/covers/${slug}.jpg` : null, e.cover ? sha256(e.cover) : null,
          e.ticketUrl ?? null, e.eventUrl ?? null, e.brandUrl ?? null, e.badge ?? null, !!e.featured, !!e.soldOut, e.hype ?? 0, status,
          status === 'live' ? hours(24 * 30) : null, null, null,
          slug === 'edm-beach-bus' ? 'broken' : e.ticketUrl && status === 'in_review' ? 'ok' : null, hours(24 * 40)]);
      ids.event[slug] = row.id;
      await refreshDerived(q, row.id);
    }
    await q.query('update events set previous_edition_id = $1 where id = $2', [ids.event['ravo-2025'], ids.event.ravo]);
    const submitted: Record<string, number> = { 'neon-rooftop-session': 2.6, 'underground-techno-w12': 3.7, 'acoustic-sunset-bside': 1.1, 'edm-beach-bus': 5.3, 'ravo-after-hours': 2 };
    for (const [slug, h] of Object.entries(submitted)) await q.query('update events set submitted_at = $2 where id = $1', [ids.event[slug], hours(h)]);

    // ---- tiers ----
    const tier = async (slug: string, key: string, name: Localized, price: number, capacity: number, sold: number, extra: Record<string, unknown> = {}) => {
      const r = await one<any>(q,
        `insert into ticket_tiers (event_id, key, name, price, capacity, sold, is_last, sales_open_at, price_rise_on, price_rise_to, sort)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,(select count(*) from ticket_tiers where event_id = $1)) returning id`,
        [ids.event[slug], key, json(name), price, capacity, sold, extra.isLast ?? false, extra.salesOpenAt ?? null, extra.riseOn ?? null, extra.riseTo ?? null]);
      return r.id as string;
    };
    const EARLY = L('Early bird', 'Vé sớm');
    const GA = L('General admission', 'Vé thường');
    const VIP = L('VIP', 'VIP');
    const TABLE = L('Table', 'Bàn');
    const ravoTiers = {
      early: await tier('ravo', 'early', EARLY, 900_000, n(500), 0),
      ga: await tier('ravo', 'ga', GA, 1_200_000, n(3200), 0, { isLast: true, riseOn: '2026-09-18', riseTo: 1_450_000 }),
      vip: await tier('ravo', 'vip', VIP, 2_400_000, n(1100), 0),
      table: await tier('ravo', 'table', TABLE, 5_040_000, 40, 0, { salesOpenAt: atVn('2026-09-18', '12:00') }),
    };
    const warmTiers = {
      standing: await tier('ravo-warmup', 'standing', L('Standing', 'Vé đứng'), 350_000, n(700), 0),
      table: await tier('ravo-warmup', 'table', L('Table for four', 'Bàn 4 người'), 1_400_000, n(200), 0),
    };
    await tier('ravo-after-hours', 'ga', GA, 300_000, 600, 0);
    await tier('ravo-2025', 'early', EARLY, 800_000, 500, 500);
    await tier('ravo-2025', 'ga', GA, 1_100_000, 3000, 2900);
    await tier('ravo-2025', 'vip', VIP, 2_200_000, 1000, 800);
    await tier('rapviet', 'early', EARLY, 520_000, 400, 400);
    await tier('rapviet', 'ga', GA, 650_000, 2600, 2600);
    await tier('rapviet', 'vip', VIP, 1_235_000, 300, 300);
    await tier('8wonder', 'ga', GA, 1_500_000, 12000, 9600);
    await tier('8wonder', 'vip', VIP, 3_600_000, 1500, 1388, { isLast: true });
    await tier('8wonder', 'table', TABLE, 7_500_000, 60, 60);
    await tier('momang', 'ga', GA, 890_000, 8000, 7100);
    await tier('blues', 'ga', GA, 150_000, 120, 104);
    await tier('yoko-sinco', 'ga', GA, 120_000, 150, 40);
    for (const s of ['momang-2025', '8wonder-winter', 'bside-acoustic-1', 'bside-acoustic-2', 'neon-rooftop-session', 'underground-techno-w12', 'acoustic-sunset-bside', 'edm-beach-bus', 'edm-beach-bus-mui-ne', 'warehouse-rave-q4', 'rooftop-sessions-vol3', 'rooftop-nye-countdown', 'pool-party-q2']) {
      await tier(s, 'ga', GA, EVENTS[s].price ?? 100_000, 800, s.startsWith('bside-acoustic') ? 70 : 0);
    }

    // ---- promo codes ----
    const promo = async (code: string, pct: number, cap: number, used: number, active: boolean, note: Localized) =>
      (await one<any>(q, 'insert into promo_codes (event_id, code, pct, cap, used, active, note) values ($1,$2,$3,$4,$5,$6,$7) returning id',
        [ids.event.ravo, code, pct, cap, used, active, json(note)])).id as string;
    const earlyUsed = n(412);
    const rave10Used = n(1183);
    const pEarly = await promo('EARLYBIRD', 25, n(500), earlyUsed, false, L('First 500 tickets', '500 vé đầu tiên'));
    const pRave = await promo('RAVE10', 10, n(3000), rave10Used, true, L('Instagram story campaign', 'Chiến dịch story Instagram'));
    await promo('CREW2026', 100, 120, n(64), true, L('Crew & artist guests', 'Khách của crew & nghệ sĩ'));

    // ---- generated sales: orders paid over the last two weeks, one ticket each ----
    const sell = async (slug: string, prefix: string, batches: { tierId: string; price: number; count: number; promoId?: string; promoPct?: number; promoCount?: number; status?: string }[]) => {
      let offset = 0;
      const total = batches.reduce((s, b) => s + b.count, 0);
      for (const b of batches) {
        await q.query(
          `with buyers as ${synthetic}
           insert into orders (code, user_id, event_id, tier_id, qty, unit_price, subtotal, discount, fee, total, promo_code_id, status, payment_method, created_at, expires_at, paid_at, refunded_at)
           select $1::text || lpad((i + $2::int)::text, 5, '0'), b.id, $3::uuid, $4::uuid, 1, p.unit, p.unit, p.disc, p.fee, p.unit - p.disc + p.fee,
                  case when i <= $7::int then $6::uuid end, $8::text, (array['momo','zalopay','vietqr','card'])[1 + i % 4],
                  t.paid, t.paid + interval '15 minutes', t.paid, case when $8::text = 'refunded' then t.paid + interval '2 days' end
             from generate_series(1, $9::int) i
             join buyers b on b.rn = i + $2::int
             cross join lateral (select $5::bigint as unit, case when i <= $7::int then round($5::bigint * $10::numeric / 100)::bigint else 0::bigint end as disc) d
             cross join lateral (select d.unit, d.disc, round((d.unit - d.disc) * 0.05)::bigint as fee) p
             cross join lateral (select $11::timestamptz - make_interval(days => 13 - floor(13 * power((i + $2::int)::float / $12::float, 0.6))::int, hours => (i * 7) % 20) as paid) t`,
          [prefix, offset, ids.event[slug], b.tierId, b.price, b.promoId ?? null, b.promoCount ?? 0, b.status ?? 'paid', b.count, b.promoPct ?? 0, hours(2), total]);
        offset += b.count;
      }
      // Ticket codes carry the order prefix (FF-RV-00001), so two events never share a code.
      await q.query(
        `insert into tickets (order_id, event_id, tier_id, user_id, code, holder_name, holder_phone, status, created_at)
         select o.id, o.event_id, o.tier_id, o.user_id, 'FF-' || replace($2::text, '-', '') || '-' || lpad(row_number() over (order by o.code)::text, 5, '0'),
                u.name, u.phone, case when o.status = 'refunded' then 'refunded' else 'valid' end, o.paid_at
           from orders o join users u on u.id = o.user_id where o.event_id = $1`, [ids.event[slug], prefix]);
      await q.query(`update ticket_tiers t set sold = (select count(*) from orders o where o.tier_id = t.id and o.status = 'paid') where t.event_id = $1`, [ids.event[slug]]);
    };
    await sell('ravo', 'RV-', [
      { tierId: ravoTiers.early, price: 900_000, count: n(500), promoId: pEarly, promoPct: 25, promoCount: earlyUsed },
      { tierId: ravoTiers.ga, price: 1_200_000, count: n(1847), promoId: pRave, promoPct: 10, promoCount: rave10Used },
      { tierId: ravoTiers.vip, price: 2_400_000, count: n(500) },
      { tierId: ravoTiers.ga, price: 1_200_000, count: n(38), status: 'refunded' },
    ]);
    await sell('ravo-warmup', 'RW-', [
      { tierId: warmTiers.standing, price: 350_000, count: n(642) },
      { tierId: warmTiers.table, price: 1_400_000, count: n(100) },
    ]);
    // Keep the GA "last tier" at 153 seats left, as on the event page.
    await q.query('update ticket_tiers set capacity = sold + $2 where id = $1', [ravoTiers.ga, n(153)]);

    // Demo attendee: 2 × GA for Ravolution.
    const demoOrder = await one<any>(q,
      `insert into orders (code, user_id, event_id, tier_id, qty, unit_price, subtotal, discount, fee, total, status, payment_method, created_at, expires_at, paid_at)
       values ('FFDEMO22', $1, $2, $3, 2, 1200000, 2400000, 0, 120000, 2520000, 'paid', 'momo', $4, $4, $4) returning id`,
      [demo.id, ids.event.ravo, ravoTiers.ga, hours(72)]);
    for (const code of ['FF-RAVO-DEM1', 'FF-RAVO-DEM2']) {
      await q.query(`insert into tickets (order_id, event_id, tier_id, user_id, code, holder_name, holder_phone) values ($1,$2,$3,$4,$5,'Minh Anh','+84901234567')`,
        [demoOrder.id, ids.event.ravo, ravoTiers.ga, demo.id, code]);
    }
    await q.query('update ticket_tiers set sold = sold + 2, capacity = capacity + 2 where id = $1', [ravoTiers.ga]);

    // ---- saves, hypes, going, follows ----
    const savers = n(4100);
    await q.query(`insert into saves (user_id, event_id, created_at) select id, $1, $2::timestamptz - make_interval(hours => (rn * 13 % 330)::int) from ${synthetic} s where rn <= $3`, [ids.event.ravo, now, savers]);
    await q.query(`insert into saves (user_id, event_id) select id, $1 from ${synthetic} s where rn % 3 = 0 and rn <= $2`, [ids.event.hozo, n(3000)]);
    const save = async (userId: string, slug: string) => q.query('insert into saves (user_id, event_id) values ($1,$2) on conflict do nothing', [userId, ids.event[slug]]);
    const go = async (userId: string, slug: string) => q.query('insert into going (user_id, event_id) values ($1,$2) on conflict do nothing', [userId, ids.event[slug]]);
    for (const f of FRIENDS) {
      for (const s of f.going) await go(ids.friend[f.key], s);
      for (const s of f.interested) await save(ids.friend[f.key], s);
    }
    await save(demo.id, 'hozo');
    await save(demo.id, 'ravo');
    await go(demo.id, 'ravo');
    for (const s of ['ravo', 'momang']) await q.query('insert into hypes (user_id, event_id) values ($1,$2)', [demo.id, ids.event[s]]);
    await q.query(`update events e set save_count = (select count(*) from saves s where s.event_id = e.id)`);
    for (const slug of ['ravoent', 'hozoco', 'momangco']) await q.query('insert into organizer_follows (user_id, organizer_id) values ($1,$2)', [demo.id, ids.org[slug]]);
    await q.query(`insert into artist_follows (user_id, artist) values ($1,'Hoaprox')`, [demo.id]);
    await q.query(`insert into smart_alerts (user_id, enabled, genres, areas, price_cap) values ($1, true, '{EDM}', '{Quận 1,Quận 3}', 1000000)`, [demo.id]);

    // ---- timetables & site maps ----
    for (const [slug, days] of Object.entries(TIMETABLES)) {
      const stageIds: string[] = [];
      for (const [i, [name]] of days[0].stages.entries()) {
        stageIds.push((await one<any>(q, 'insert into stages (event_id, name, sort) values ($1,$2,$3) returning id', [ids.event[slug], json(name), i])).id);
      }
      for (const day of days) {
        for (const [i, [, sets]] of day.stages.entries()) {
          for (const [artist, a, b] of sets) {
            const midnight = atVn(day.day).getTime();
            await q.query('insert into sets (event_id, stage_id, day, artist, starts_at, ends_at) values ($1,$2,$3,$4,$5,$6)',
              [ids.event[slug], stageIds[i], day.day, artist, new Date(midnight + a * 60_000), new Date(midnight + b * 60_000)]);
          }
        }
      }
      for (const [label, kind, x, y, w] of SITE) {
        await q.query('insert into site_zones (event_id, label, kind, x, y, w) values ($1,$2,$3,$4,$5,$6)', [ids.event[slug], slug === 'hozo' && label === 'Bass Arena' ? 'Folk tent' : label, kind, x, y, w]);
      }
    }
    const hoaprox = await one<any>(q, `select id from sets where event_id = $1 and artist = 'Hoaprox'`, [ids.event.ravo]);
    const djmie = await one<any>(q, `select id from sets where event_id = $1 and artist = 'DJ Mie'`, [ids.event.ravo]);
    const slimv = await one<any>(q, `select id from sets where event_id = $1 and artist = 'SlimV'`, [ids.event.ravo]);
    for (const s of [hoaprox, djmie, slimv]) await q.query('insert into plan_picks (user_id, set_id, remind) values ($1,$2,true)', [demo.id, s.id]);

    // ---- group plan ----
    const plan = await one<any>(q, `insert into group_plans (event_id, owner_id, meet_spot, created_at) values ($1,$2,'gate',$3) returning id`, [ids.event.ravo, demo.id, hours(70)]);
    await q.query(`insert into group_plan_members (plan_id, user_id, status, paid, invited_at, responded_at) values
      ($1,$2,'going',false,$5,$5), ($1,$3,'going',true,$5,$5), ($1,$4,'pending',false,$5,null)`, [plan.id, ids.friend.f1, ids.friend.f2, ids.friend.f6, hours(70)]);
    await q.query(`insert into group_plan_messages (plan_id, user_id, kind, body, created_at) values ($1,$2,'text','Works for me, see you there.',$4), ($1,$3,'text','Sending you the ticket money tonight.',$5)`,
      [plan.id, ids.friend.f1, ids.friend.f2, hours(69), hours(68)]);
    await q.query(`insert into direct_messages (sender_id, recipient_id, kind, event_id, created_at) values ($1,$2,'invite',$3,$4)`, [demo.id, ids.friend.f1, ids.event.ravo, hours(70)]);
    await q.query(`insert into direct_messages (sender_id, recipient_id, kind, body, created_at) values ($1,$2,'text','Sounds good — let’s go together!',$3)`, [ids.friend.f1, demo.id, hours(69.5)]);

    // ---- metrics for Ravolution (views, ticket clicks, traffic sources) ----
    const trend = [980, 1120, 860, 1340, 1520, 2280, 2610, 1890, 1720, 2140, 2880, 3320, 3740, 4180];
    for (const [i, views] of trend.entries()) {
      const v = Math.round(views * (opts.volume === 'full' ? 1 : 0.05));
      await q.query('insert into event_metrics_daily (event_id, day, views, ticket_clicks, sources) values ($1,$2,$3,$4,$5)',
        [ids.event.ravo, addDays('2026-09-03', i), v, Math.round(v * 0.1),
          json({ feed: Math.round(v * 0.38), shelf: Math.round(v * 0.24), shared: Math.round(v * 0.14), search: Math.round(v * 0.12), own: Math.round(v * 0.08), ads: Math.round(v * 0.04) })]);
    }
    await q.query(`insert into event_metrics_daily (event_id, day, views, ticket_clicks, sources) values ($1,'2025-09-10',$2,$3,'{"feed":1}')`, [ids.event['ravo-2025'], n(26600), n(2900)]);
    await q.query(`insert into event_metrics_daily (event_id, day, views, ticket_clicks, sources) values ($1,'2026-09-15',$2,$3,'{"feed":1}')`, [ids.event['ravo-warmup'], n(9800), n(620)]);

    // ---- door operations ----
    await q.query(`insert into event_staff (event_id, name, phone, gate, role, active, accepted_at, invited_at) values
      ($1,'Trần Minh','+84903112884','main','lead',true,$2,$2), ($1,'Lê Thu Hà','+84938447120','vip','scanner',true,$2,$2), ($1,'Phạm Gia Hân','+84912660391','side','scanner',false,null,$2)`,
      [ids.event.ravo, hours(96)]);
    const guest = (name: string, note: Localized, seats: number, inside: boolean) =>
      q.query('insert into guest_list (event_id, name, note, seats, checked_in) values ($1,$2,$3,$4,$5)', [ids.event.ravo, name, json(note), seats, inside]);
    await guest('Trần Minh Anh', L('Artist manager — Hoaprox', 'Quản lý nghệ sĩ — Hoaprox'), 4, false);
    await guest('Lê Thu Hà', L('Press — Kenh14', 'Báo chí — Kenh14'), 2, false);
    await guest('Nguyễn Quốc Bảo', L('Sponsor — Heineken VN', 'Nhà tài trợ — Heineken VN'), 6, false);
    await guest('Phạm Gia Hân', L('Photographer', 'Nhiếp ảnh'), 1, false);

    // ---- announcements ----
    const ann = (subject: string, body: string, audience: string, channels: string[], at: string, reach: number, openedPct: number) => {
      const sendAt = new Date(at);
      const sent = sendAt.getTime() <= now.getTime();
      return q.query(
        `insert into announcements (event_id, audience, channels, subject, body, status, send_at, sent_at, reach, opened, created_by, created_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [ids.event.ravo, audience, channels, subject, body, sent ? 'sent' : 'scheduled', sendAt, sent ? sendAt : null, reach, sent ? Math.round((reach * openedPct) / 100) : 0, orgUser.id, sendAt]);
    };
    await ann('After Hours lineup is out', 'Closing b2b and Triple D take the after-party. Tickets are on the event page.', 'saved', ['push', 'zalo'], '2026-09-13T18:00:00+07:00', n(5842), 61);
    await ann('Gate map and shuttle times', 'Main gate opens 16:00, VIP 15:30. Shuttles run from Nguyễn Huệ every 20 minutes from 15:00.', 'holders', ['push'], '2026-09-12T09:30:00+07:00', n(2847), 74);
    await ann('Last call for VIP tables', '48 VIP tickets left. The price holds until 18 Sep, after that it is general admission at the door only.', 'vip', ['push', 'zalo'], '2026-09-18T10:00:00+07:00', n(412), 0);

    // ---- organiser inbox & bell ----
    const t1 = await one<any>(q,
      `insert into inbox_threads (organizer_id, event_id, topic, subject, organizer_unread, updated_at, created_at) values ($1,$2,'moderation',$3,true,$4,$4) returning id`,
      [ids.org.ravoent, ids.event['ravo-after-hours'], json(L('After Hours needs two things', 'After Hours cần bổ sung hai thứ')), hours(1)]);
    await q.query(`insert into inbox_messages (thread_id, sender, body, created_at) values ($1,'ff',$2,$3), ($1,'ff',$4,$5)`, [t1.id,
      json(L('This listing needs a 1600×900 landscape image before it can go live — cards without art lose about 40% of taps.', 'Tin này cần ảnh ngang 1600×900 trước khi lên sóng — thẻ không ảnh mất khoảng 40% lượt bấm.')), hours(1.05),
      json(L('The venue also still shows as unverified. Send the exact venue name and a nearby landmark and we will approve today.', 'Địa điểm vẫn chưa xác minh. Gửi tên địa điểm chính xác kèm một mốc gần đó, chúng tôi duyệt trong hôm nay.')), hours(1)]);
    const t2 = await one<any>(q,
      `insert into inbox_threads (organizer_id, event_id, topic, subject, organizer_unread, updated_at, created_at) values ($1,$2,'partnerships',$3,false,$4,$4) returning id`,
      [ids.org.ravoent, ids.event.ravo, json(L('Trending shelf next week', 'Mục Đang hot tuần tới')), hours(20)]);
    await q.query(`insert into inbox_messages (thread_id, sender, body, created_at) values ($1,'ff',$2,$3), ($1,'org',$4,$5)`, [t2.id,
      json(L('We are building next week’s Trending shelf. Announce the After Hours lineup before Friday and we can include it — placement is editorial, not paid.', 'Chúng tôi đang dựng mục Đang hot tuần tới. Công bố đội hình After Hours trước thứ Sáu là chúng tôi đưa vào — vị trí này do biên tập chọn, không phải mua.')), hours(20.5),
      json(L('Noted — the lineup goes out Thursday morning.', 'Đã rõ — sáng thứ Năm chúng tôi công bố đội hình.')), hours(20)]);
    const orgNote = (kind: string, title: Localized, body: Localized, cta: Localized, link: object, at: Date, unread: boolean) =>
      q.query(`insert into notifications (organizer_id, kind, title, body, cta, link, read_at, created_at) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [ids.org.ravoent, kind, json(title), json(body), json(cta), json(link), unread ? null : at, at]);
    await orgNote('live', L('Ravolution Music Festival is live', 'Ravolution Music Festival đã lên sóng'), L('Approved four hours after review and now showing in Ho Chi Minh City.', 'Được duyệt sau bốn giờ và đang hiển thị tại TP.HCM.'), L('View dashboard', 'Xem dashboard'), { screen: 'dash' }, hours(72), false);
    await orgNote('payout', L('Payout scheduled', 'Đã lên lịch chi trả'), L('The post-event payout settles three working days after the event.', 'Khoản chi trả sau sự kiện về tài khoản 3 ngày làm việc sau sự kiện.'), L('Open payouts', 'Mở chi trả'), { screen: 'money' }, hours(26), false);
    await orgNote('tickets', L('VIP tickets running low', 'Vé VIP gần hết'), L('48 VIP left with three days to go.', 'Còn 48 vé VIP, còn ba ngày.'), L('See ticket tiers', 'Xem loại vé'), { screen: 'money' }, hours(3), true);
    await orgNote('reject', L('Listing sent back', 'Tin bị trả lại'), L('Ravolution After Hours needs a 1600×900 image and a verified venue before it can go live.', 'Ravolution After Hours cần ảnh 1600×900 và địa điểm đã xác minh trước khi lên sóng.'), L('Open moderation thread', 'Mở thư kiểm duyệt'), { screen: 'inbox', threadId: t1.id }, hours(1), true);

    // ---- attendee notification centre ----
    const userNote = (kind: string, title: Localized, body: Localized, link: object, at: Date) =>
      q.query(`insert into notifications (user_id, kind, title, body, link, created_at) values ($1,$2,$3,$4,$5,$6)`, [demo.id, kind, json(title), json(body), json(link), at]);
    await userNote('tickets_issued', L('Tickets are in My tickets', 'Vé đã vào mục Vé của tôi'), L('2 × Ravolution Music Festival', '2 × Ravolution Music Festival'), { screen: 'tickets' }, hours(72));
    await userNote('friend_going', L('Minh Trần is going', 'Minh Trần sẽ đi'), L('HOZO Super Fest', 'HOZO Super Fest'), { screen: 'event', eventId: ids.event.hozo }, hours(30));
    await userNote('smart_alert', L('Smart Alert · new match', 'Smart Alert · sự kiện mới khớp'), L('EDM · District 1 & 3 · This weekend', 'EDM · Quận 1 & 3 · Cuối tuần'), { screen: 'explore' }, hours(10));

    // ---- reports (distinct synthetic users) ----
    const report = async (slug: string, code: string, count: number, note: string, ageHours: number) => {
      await q.query(
        `insert into listing_reports (event_id, user_id, code, note, created_at)
         select $1, id, $2, case when rn = $3 then $4 else '' end, $5::timestamptz + make_interval(mins => rn::int) from ${synthetic} s where rn > 100 - $3 and rn <= 100`,
        [ids.event[slug], code, count, note, hours(ageHours)]);
      if (count >= 2) await q.query('update events set held_for_reports = true where id = $1', [ids.event[slug]]);
    };
    await report('edm-beach-bus-mui-ne', 'refund', Math.min(14, people - 1), 'The bus never showed up at the pickup point and nobody answered the hotline.', 4);
    await report('warehouse-rave-q4', 'safety', 2, 'No visible fire exits and the crowd was well past what the room can hold.', 48);
    await q.query(
      `insert into listing_reports (event_id, user_id, code, note, created_at) select $1, id, 'wrong', case when rn = 60 then 'The address on the listing is a closed building. Real venue was two streets away.' else '' end, $2 from ${synthetic} s where rn between 55 and 60`,
      [ids.event['warehouse-rave-q4'], hours(11)]);
    await q.query(
      `insert into listing_reports (event_id, user_id, code, note, created_at) select $1, id, 'price', case when rn = 3 then 'Listed at 400k but the door charged 700k with no explanation.' else '' end, $2 from ${synthetic} s where rn between 1 and 3`,
      [ids.event['rooftop-sessions-vol3'], hours(24)]);
    await q.query('update events set held_for_reports = true where id = $1', [ids.event['rooftop-sessions-vol3']]);

    // ---- risk on the queue ----
    for (const slug of Object.keys(submitted)) {
      const r = await assessRisk(q, ids.event[slug], now);
      await q.query('update events set risk_score = $2, risk_factors = $3, signals = $4, flag = $5 where id = $1', [ids.event[slug], r.score, json(r.factors), json(r.signals), r.flag]);
    }

    // ---- appeals ----
    const appeal = async (slug: string, code: 'image' | 'permit', state: string, reply: string | null, rejectedHoursAgo: number, closesInDays: number) => {
      const msg = code === 'image'
        ? 'This image already appears in an earlier listing. Upload an original photo of this event at 1600×900 and we will publish it.'
        : 'For a crowd this size we need the venue permit on file before the listing can go live. Attach it and we will review the same day.';
      const d = await one<any>(q, `insert into moderation_decisions (event_id, decision, reason_code, message, allow_appeal, decided_by, decided_at) values ($1,'rejected',$2,$3,true,$4,$5) returning id`,
        [ids.event[slug], code, msg, admin.id, hours(rejectedHoursAgo)]);
      await q.query(`insert into appeals (event_id, decision_id, reason_code, message, state, reply, replied_at, closes_at, created_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [ids.event[slug], d.id, code, msg, state, reply, reply ? hours(20) : null, new Date(now.getTime() + closesInDays * 86400_000), hours(rejectedHoursAgo)]);
    };
    await appeal('rooftop-nye-countdown', 'image', 'replied', 'The photo is ours — it was shot at our own 2025 edition and we hold the file. Original attached, plus the photographer invoice.', 120, 2);
    await appeal('pool-party-q2', 'permit', 'open', null, 48, 5);

    // ---- shelves ----
    const shelf = async (slug: string, name: Localized, note: Localized, enabled: boolean, from: string, to: string, events: string[], sort: number) => {
      const s = await one<any>(q, 'insert into shelves (slug, name, note, enabled, starts_on, ends_on, sort) values ($1,$2,$3,$4,$5,$6,$7) returning id', [slug, json(name), json(note), enabled, from, to, sort]);
      for (const [i, e] of events.entries()) await q.query('insert into shelf_items (shelf_id, event_id, sort) values ($1,$2,$3)', [s.id, ids.event[e], i]);
    };
    await shelf('trending', L('Trending this week', 'Đang hot tuần này'), L('Sits at the top of Explore in the app and on the web.', 'Hiện đầu trang Khám phá trong app và trên web.'), true, '2026-09-15', '2026-09-22', ['ravo', 'hozo', 'momang'], 0);
    await shelf('quiet-nights', L('Quiet nights', 'Đêm nhạc nhẹ'), L('For people browsing away from EDM.', 'Dành cho người tìm sự kiện không phải EDM.'), true, '2026-10-01', '2026-10-31', ['blues', 'nhacvien'], 1);
    await shelf('food-culture', L('Food & culture', 'Ăn uống & văn hoá'), L('Off until five approved events fill it.', 'Tắt cho tới khi có đủ 5 sự kiện đã duyệt.'), false, '2026-09-28', '2026-10-12', ['outcast', 'duongsach'], 2);

    // ---- SEO FAQ ----
    for (const path of ['ho-chi-minh/this-weekend', 'ho-chi-minh/free/this-weekend']) {
      for (const [i, [qn, an]] of FAQ.entries()) await q.query('insert into seo_faqs (path, question, answer, sort) values ($1,$2,$3,$4)', [path, json(qn), json(an), i]);
    }

    // ---- advertising ----
    const campaign = (brand: string, cat: string, logo: string, art: string, placement: string, active: boolean, head: Localized, body: Localized, cta: Localized, imp: number, clicks: number, spend: number, budget: number, alcohol = false) =>
      q.query(`insert into ad_campaigns (brand, category, logo, art, placement, active, headline, body, cta, impressions, clicks, spend, budget_total, is_alcohol) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [brand, cat, logo, art, placement, active, json(head), json(body), json(cta), imp, clicks, spend, budget, alcohol]);
    await campaign('Zenkai Energy', 'F&B', 'ZK', 'linear-gradient(135deg,#FFB35C,#FF5C5C)', 'feed', true, L('Two cans, six hours of set times.', 'Hai lon, sáu tiếng đứng sàn.'),
      L('Stalls at every FestFinder-listed festival in Saigon. Show the app, get the second can free.', 'Có mặt tại mọi lễ hội trên FestFinder ở Sài Gòn. Mở app, lon thứ hai miễn phí.'), L('Find a stall', 'Tìm gian hàng'), 120400, 2100, 21_700_000, 80_000_000);
    await campaign('EarGuard Pro', 'Healthcare', 'EG', 'linear-gradient(135deg,#2AC4E8,#1B6BD6)', 'banner', true, L('Hearing you can still use on Monday.', 'Đôi tai vẫn còn dùng được vào thứ Hai.'),
      L('Filtered earplugs made for live music — the sound stays, the damage does not. Delivered to your gate.', 'Nút tai lọc âm dành cho nhạc sống — giữ nguyên âm thanh, bỏ lại phần gây hại. Giao tới cổng sự kiện.'), L('Get a pair', 'Mua một cặp'), 80200, 1320, 19_200_000, 60_000_000);
    await campaign('Neon Thread', 'Fashion', 'NT', 'linear-gradient(135deg,#8C6BFF,#FF6FA5)', 'feed', true, L('Rave fits that survive a monsoon.', 'Outfit đi rave chịu được mưa Sài Gòn.'),
      L('Quick-dry mesh and reflective tape, cut in Saigon. New drop before every festival weekend.', 'Vải lưới nhanh khô, phản quang, cắt may tại Sài Gòn. Drop mới trước mỗi cuối tuần lễ hội.'), L('Shop the drop', 'Xem bộ mới'), 64000, 900, 11_500_000, 40_000_000);
    await campaign('Hydra Salts', 'F&B', 'HS', 'linear-gradient(135deg,#2E9E5B,#2AC4E8)', 'live', true, L('One sachet between sets.', 'Một gói giữa hai set nhạc.'),
      L('Electrolytes without the sugar crash. On sale at every water point inside.', 'Bù điện giải, không tụt đường. Bán tại mọi điểm nước bên trong.'), L('Nearest water point', 'Điểm nước gần nhất'), 412800, 9074, 74_300_000, 110_000_000);
    await campaign('Sài Gòn Denim', 'Fashion', 'SD', 'linear-gradient(135deg,#8C6BFF,#FF6FA5)', 'banner', true, L('Denim for the long night.', 'Denim cho đêm dài.'), L('Made in District 5.', 'May tại Quận 5.'), L('Shop', 'Mua'), 186400, 2609, 44_700_000, 49_000_000);
    await campaign('SleepWell Recovery', 'Healthcare', 'SW', 'linear-gradient(135deg,#2AC4E8,#1B6BD6)', 'live', false, L('Recover faster.', 'Hồi phục nhanh hơn.'), L('On-site recovery lounges.', 'Khu hồi phục tại chỗ.'), L('Find us', 'Tìm chúng tôi'), 38200, 1184, 9_100_000, 41_000_000);
    const inquiry = (brand: string, cat: string, email: string, budget: string, placements: string[], message: string, ageH: number) =>
      q.query(`insert into ad_inquiries (brand, category, email, budget, placements, message, created_at) values ($1,$2,$3,$4,$5,$6,$7)`, [brand, cat, email, budget, placements, message, hours(ageH)]);
    await inquiry('Zenkai Energy', 'F&B', 'mai@zenkai.vn', '150–400tr₫', ['feed', 'banner'], 'We want the EDM weekends in September and October, Saigon only. Launching a new can size.', 2);
    await inquiry('Neon Thread', 'Fashion', 'drops@neonthread.co', '50–150tr₫', ['feed', 'banner'], 'Streetwear drop timed to Ravolution. Happy to hand out samples at the gate too.', 6);
    await inquiry('EarGuard Pro', 'Healthcare', 'partners@earguard.asia', '400tr₫+', ['live', 'banner'], 'Filtered earplugs. We would like the in-event placement — that is the moment people wish they had them.', 24);
    await inquiry('Medik Rapid Care', 'Healthcare', 'bd@medikrapid.vn', 'Dưới 50tr₫', ['live'], 'On-site recovery clinics. We only want to appear to people already checked in at a festival.', 48);

    // ---- audit history (hash-chained) ----
    const hist: [number, 'admin' | 'system', string, string, string, { f: string; a: string; b: string }[] | null][] = [
      [8.8, 'admin', 'listing.rejected', 'Pool Party · Quận 2', 'event', [{ f: 'status', a: 'in_review', b: 'rejected' }, { f: 'reason_code', a: '—', b: 'permit' }, { f: 'appeal', a: '—', b: 'open 7 days' }]],
      [8.1, 'system', 'listing.auto_held', 'EDM Beach Bus — Vũng Tàu', 'event', [{ f: 'matches', a: '0', b: '1' }, { f: 'flagged_listing', a: '—', b: 'EDM Beach Bus — Vũng Tàu' }]],
      [7.5, 'admin', 'organizer.warned', 'Tripside Travel', 'organizer', [{ f: 'strikes', a: '1', b: '2' }, { f: 'next_step', a: '—', b: 'suspension at 3' }]],
      [6.2, 'admin', 'organizer.messaged', 'W12 Collective', 'organizer', null],
      [5.1, 'admin', 'shelf.published', 'Trending this week', 'shelf', [{ f: 'visible', a: 'false', b: 'true' }, { f: 'window', a: '—', b: '15/09 → 22/09' }]],
      [3.9, 'admin', 'listing.taken_down', 'Rooftop NYE Countdown', 'event', [{ f: 'status', a: 'live', b: 'removed' }, { f: 'reason_code', a: '—', b: 'image' }, { f: 'reports_open', a: '3', b: '0' }]],
      [3.4, 'admin', 'organizer.verified', 'Ravolution Entertainment', 'organizer', [{ f: 'verified', a: 'false', b: 'true' }, { f: 'badge', a: '—', b: 'shown on all cards' }]],
      [3.2, 'system', 'listing.auto_held', 'Underground Techno — Warehouse 12', 'event', [{ f: 'risk_score', a: '0', b: '70' }, { f: 'held_by', a: '—', b: 'venue_unresolved, new_account' }]],
      [2.9, 'admin', 'listing.approved', 'HOZO Super Fest', 'event', [{ f: 'status', a: 'pending', b: 'live' }, { f: 'decision_time', a: '—', b: '41m' }]],
    ];
    for (const [h, actorType, action, label, targetType, diff] of hist) {
      await appendAudit(q, {
        at: hours(h), actorType, actorId: actorType === 'admin' ? admin.id : null, actorLabel: actorType === 'admin' ? 'FestFinder Admin' : 'System',
        action, targetType, targetId: null, targetLabel: label, diff,
      });
    }
    await q.query(`update organizers set strikes = 2 where id = $1`, [ids.org.tripside]);

    const counts = await one<any>(q,
      `select (select count(*)::int from users) as users, (select count(*)::int from events) as events, (select count(*)::int from orders) as orders,
              (select count(*)::int from tickets) as tickets, (select count(*)::int from saves) as saves`);
    log(`seed complete: ${JSON.stringify(counts)}`);
    return { ...counts, accounts: { attendee: 'minh@example.com', organizer: 'team@ravolution.vn', admin: 'admin@festfinder.vn' }, ids };
  });
}
