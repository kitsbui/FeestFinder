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
