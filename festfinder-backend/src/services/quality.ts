import { L, type Localized } from '../lib/i18n.ts';

/** The fields of a draft listing the quality score looks at. */
export interface DraftFacts {
  title: string;
  genre: string | null;
  description: Localized;
  logoUrl: string | null;
  coverUrl: string | null;
  venueResolved: boolean;
  entryMode: 'free' | 'paid' | 'donation';
  priceFrom: number;
  ticketUrl: string | null;
  lineup: string[];
  eventUrl: string | null;
}

export interface QualityCheck {
  key: string;
  ok: boolean;
  points: number;
  step: 1 | 2 | 3;
  label: Localized;
  why: Localized;
}

const isHttpUrl = (s: string | null) => !!s && /^https?:\/\/\S+\.\S+/.test(s.trim());

/** Nine weighted checks, 100 points total. Mirrors the organiser wizard's Listing quality card. */
export function qualityChecks(d: DraftFacts): QualityCheck[] {
  const paid = d.entryMode === 'paid';
  const longestDesc = Math.max(d.description.en.trim().length, d.description.vi.trim().length);
  return [
    { key: 'name', ok: d.title.trim().length >= 8, points: 10, step: 1,
      label: L('Event name reads clearly', 'Tên sự kiện đủ rõ'),
      why: L('Names under 8 characters get skipped in the feed.', 'Tên dưới 8 ký tự hay bị bỏ qua trong feed.') },
    { key: 'genre', ok: !!d.genre, points: 8, step: 1,
      label: L('Genre picked', 'Đã chọn thể loại'),
      why: L('Without a genre the listing never shows up in filters.', 'Không có thể loại thì tin không vào được bộ lọc.') },
    { key: 'description', ok: longestDesc >= 80, points: 14, step: 1,
      label: L('Description over 80 characters', 'Mô tả từ 80 ký tự'),
      why: L('Thin descriptions are the most common reason for a send-back.', 'Mô tả ngắn là lý do bị trả lại nhiều nhất.') },
    { key: 'logo', ok: !!d.logoUrl, points: 10, step: 1,
      label: L('Organizer logo added', 'Có logo nhà tổ chức'),
      why: L('The logo sits next to your brand name on every card.', 'Logo hiện cạnh tên thương hiệu trên mọi thẻ.') },
    { key: 'cover', ok: !!d.coverUrl, points: 20, step: 1,
      label: L('Landscape image 1600×900', 'Có ảnh ngang 1600×900'),
      why: L('Cards without art lose about 40% of taps.', 'Thẻ không ảnh mất khoảng 40% lượt bấm.') },
    { key: 'venue', ok: d.venueResolved, points: 14, step: 2,
      label: L('Venue resolves to a pin', 'Địa điểm định vị được'),
      why: L('Pick the venue from the list so it appears on the map.', 'Chọn địa điểm từ danh sách để hiện trên bản đồ.') },
    { key: 'tickets', ok: paid ? d.priceFrom > 0 && isHttpUrl(d.ticketUrl) : true, points: 12, step: 3,
      label: L('Price and a working ticket link', 'Giá vé và link mua vé'),
      why: L('A broken ticket link is the second most common rejection.', 'Link vé lỗi là lý do bị từ chối phổ biến thứ hai.') },
    { key: 'lineup', ok: d.lineup.length >= 3, points: 8, step: 3,
      label: L('Three or more artists listed', 'Có từ 3 nghệ sĩ'),
      why: L('A full lineup is what qualifies you for the Trending shelf.', 'Đội hình đầy đủ mới đủ điều kiện lên mục Đang hot.') },
    { key: 'event_url', ok: isHttpUrl(d.eventUrl), points: 4, step: 3,
      label: L('Own event page linked', 'Có trang sự kiện riêng'),
      why: L('We use it to cross-check details during review.', 'Dùng để đối chiếu thông tin khi duyệt.') },
  ];
}

export function qualityScore(d: DraftFacts) {
  const checks = qualityChecks(d);
  const score = checks.reduce((n, c) => n + (c.ok ? c.points : 0), 0);
  const band = score >= 85 ? 'strong' : score >= 60 ? 'passable' : 'at_risk';
  const verdict: Localized = band === 'strong'
    ? L('Listings like this clear review within an hour and qualify for the Trending shelf.',
      'Tin này thường được duyệt trong một giờ và đủ điều kiện vào mục Đang hot.')
    : band === 'passable'
      ? L('This will pass review, but it ranks below complete listings in the feed.',
        'Sẽ được duyệt, nhưng xếp hạng trong feed thấp hơn tin đầy đủ.')
      : L('This is missing what usually gets a listing sent back. Fill it in before submitting.',
        'Thiếu những thứ hay bị trả lại nhất. Bổ sung trước khi gửi.');
  const bandLabel = { strong: L('Strong', 'Mạnh'), passable: L('Passable', 'Đủ duyệt'), at_risk: L('At risk', 'Rủi ro') }[band];
  return { score, band, bandLabel, verdict, checks };
}

// ---- what search engines and AI assistants read ---------------------------------------------

/** What an event's page tells Google and AI assistants (services/seo.ts buildEventSeo's JSON-LD and Markdown). */
export interface SearchFacts {
  coverUrl: string | null;
  description: Localized;
  endTime: string | null;
  pinned: boolean;
  entryMode: 'free' | 'paid' | 'donation';
  priceFrom: number;
  ticketUrl: string | null;
  tiers: number;
  lineup: string[];
  styles: string[];
  eventType: string | null;
  eventUrl: string | null;
  orgLogo: boolean;
  orgLinks: number;
}

export interface SearchCheck { key: string; ok: boolean; points: number; label: Localized; why: Localized; field: string }

/**
 * Ten checks, 100 points: each one a part of the structured data or the text that search results
 * and AI answers quote. `field` is the editor's input to fix it (or 'profile', Studio's profile).
 */
export function searchChecks(f: SearchFacts): SearchCheck[] {
  const paid = f.entryMode === 'paid';
  return [
    { key: 'image', ok: !!f.coverUrl, points: 14, field: 'edMedia',
      label: L('A landscape image', 'Có ảnh ngang'),
      why: L('Google shows event results with an image first; AI answers link it.', 'Google ưu tiên kết quả sự kiện có ảnh; trợ lý AI dẫn kèm ảnh.') },
    { key: 'about_vi', ok: f.description.vi.trim().length >= 300, points: 14, field: 'edDescVi',
      label: L('Vietnamese description of 300 characters or more', 'Mô tả tiếng Việt từ 300 ký tự'),
      why: L('AI assistants answer from the description: who plays, what kind of night, who it is for.', 'Trợ lý AI trả lời dựa trên mô tả: ai diễn, đêm kiểu gì, dành cho ai.') },
    { key: 'about_en', ok: f.description.en.trim().length >= 150, points: 10, field: 'edDescEn',
      label: L('An English description', 'Có mô tả tiếng Anh'),
      why: L('The English page (?lang=en) is what visitors and assistants abroad find.', 'Trang tiếng Anh (?lang=en) là trang khách nước ngoài và AI quốc tế tìm thấy.') },
    { key: 'end', ok: !!f.endTime, points: 8, field: 'edEnd',
      label: L('An end time', 'Có giờ kết thúc'),
      why: L('Event results need a start and an end (endDate).', 'Kết quả sự kiện cần giờ bắt đầu và kết thúc (endDate).') },
    { key: 'geo', ok: f.pinned, points: 10, field: 'edAddr',
      label: L('The venue on the map', 'Địa điểm có toạ độ'),
      why: L('"Near me" searches and maps need the coordinates.', 'Tìm kiếm "gần tôi" và bản đồ cần toạ độ.') },
    { key: 'offers', ok: !paid || (f.priceFrom > 0 && (!!f.ticketUrl || f.tiers > 0)), points: 12, field: 'edPrice',
      label: L('Price, currency and where to buy', 'Giá, tiền tệ và nơi mua vé'),
      why: L('Without an offer Google shows no price, and assistants cannot say how much.', 'Thiếu thông tin vé thì Google không hiện giá và trợ lý không trả lời được giá bao nhiêu.') },
    { key: 'performers', ok: f.lineup.length > 0, points: 10, field: 'edLineup',
      label: L('A lineup', 'Có đội hình'),
      why: L('Each name becomes a performer with its own artist page, found by fans searching for them.', 'Mỗi tên thành một performer có trang nghệ sĩ riêng, fan tìm tên là thấy.') },
    { key: 'styles', ok: f.styles.length > 0 && !!f.eventType, points: 8, field: 'edType',
      label: L('Styles and the kind of night', 'Dòng nhạc và kiểu đêm'),
      why: L('"Techno this weekend" searches match on these.', 'Các tìm kiếm như "techno cuối tuần này" khớp theo hai trường này.') },
    { key: 'official', ok: isHttpUrl(f.eventUrl), points: 6, field: 'edPage',
      label: L('Your own event page linked', 'Có link trang sự kiện chính thức'),
      why: L('It tells search engines and assistants this listing is the real one.', 'Giúp công cụ tìm kiếm và AI xác nhận đây là tin chính chủ.') },
    { key: 'organizer', ok: f.orgLogo && f.orgLinks > 0, points: 8, field: 'profile',
      label: L('Organiser profile with a logo and a link', 'Hồ sơ nhà tổ chức có logo và link'),
      why: L('Your website and socials (sameAs) tie every listing to one organiser.', 'Website và mạng xã hội (sameAs) gắn mọi tin về đúng một nhà tổ chức.') },
  ];
}

export function searchScore(f: SearchFacts) {
  const checks = searchChecks(f);
  return { score: checks.reduce((n, c) => n + (c.ok ? c.points : 0), 0), checks };
}

