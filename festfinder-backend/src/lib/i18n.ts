export type Lang = 'en' | 'vi';
export interface Localized { en: string; vi: string }

export const L = (en: string, vi: string): Localized => ({ en, vi });
export const same = (s: string): Localized => ({ en: s, vi: s });

export function tr(lang: Lang, text: Localized | string): string {
  return typeof text === 'string' ? text : text[lang];
}

/** Replaces {name} placeholders in both languages. */
export function fill(text: Localized, vars: Record<string, string | number>): Localized {
  const sub = (s: string) => s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
  return { en: sub(text.en), vi: sub(text.vi) };
}

/** `?lang=` wins, then `x-lang`, then Accept-Language. Vietnamese is the default market. */
export function langFrom(query: unknown, headers: Record<string, string | string[] | undefined>): Lang {
  const q = (query as Record<string, unknown> | undefined)?.lang;
  if (q === 'en' || q === 'vi') return q;
  const x = headers['x-lang'];
  if (x === 'en' || x === 'vi') return x;
  const accept = String(headers['accept-language'] ?? '').toLowerCase();
  if (accept.startsWith('en')) return 'en';
  return 'vi';
}

export const GENRES = ['EDM', 'Festival', 'Indie', 'Hip-Hop', 'Pop', 'Jazz', 'Food', 'Culture'] as const;
export type Genre = (typeof GENRES)[number];

export const BADGES: Record<string, Localized> = {
  trending: L('Trending', 'Đang hot'),
  low_tickets: L('Low Tickets', 'Còn ít vé'),
  selling_fast: L('Selling Fast', 'Sắp hết vé'),
  going_500: L('500+ Going', '500+ tham gia'),
  just_added: L('Just Added', 'Vừa thêm'),
};

export const REPORT_CODES: Record<string, Localized> = {
  wrong: L('Details are wrong', 'Thông tin sai'),
  cancelled: L('Event was cancelled', 'Sự kiện đã huỷ'),
  scam: L('Looks like a scam', 'Có dấu hiệu lừa đảo'),
  duplicate: L('Posted twice', 'Đăng trùng hai lần'),
  offensive: L('Offensive content', 'Nội dung không phù hợp'),
  price: L('Price is not what was listed', 'Giá khác với tin đăng'),
  refund: L('Refund claim', 'Đòi hoàn tiền'),
  safety: L('Safety concern', 'An toàn'),
};

/** How user report codes roll up into the admin's four report categories. */
export const REPORT_CATEGORY: Record<string, 'refund' | 'wrong' | 'price' | 'safety'> = {
  refund: 'refund', scam: 'refund',
  wrong: 'wrong', cancelled: 'wrong', duplicate: 'wrong',
  price: 'price',
  safety: 'safety', offensive: 'safety',
};

export const REJECT_REASONS: Record<string, { label: Localized; message: Localized; appeal: boolean }> = {
  venue: {
    appeal: true,
    label: L('Venue unverifiable', 'Không xác minh được địa điểm'),
    message: L(
      'We could not place this address on the map. Send the exact venue name and a nearby landmark and we will review again — usually within two hours.',
      'Chúng tôi không đặt được địa chỉ này lên bản đồ. Anh/chị gửi tên địa điểm chính xác kèm một mốc gần đó, chúng tôi sẽ duyệt lại — thường trong hai giờ.'),
  },
  ticket: {
    appeal: true,
    label: L('Ticket link broken', 'Link vé lỗi'),
    message: L(
      'The ticket link on this listing returns a 404. Replace it with a working link and resubmit — nothing else needs to change.',
      'Link vé trên tin trả về lỗi 404. Anh/chị thay bằng link còn hoạt động rồi gửi lại — những phần khác giữ nguyên.'),
  },
  image: {
    appeal: true,
    label: L('Image not original', 'Ảnh không phải ảnh gốc'),
    message: L(
      'This image already appears in an earlier listing. Upload an original photo of this event at 1600×900 and we will publish it.',
      'Ảnh này đã xuất hiện ở một tin trước đó. Anh/chị tải lên ảnh gốc của sự kiện, khổ 1600×900, chúng tôi sẽ đăng.'),
  },
  permit: {
    appeal: true,
    label: L('Permit missing', 'Thiếu giấy phép'),
    message: L(
      'For a crowd this size we need the venue permit on file before the listing can go live. Attach it and we will review the same day.',
      'Với quy mô này chúng tôi cần giấy phép địa điểm trước khi tin lên sóng. Anh/chị gửi kèm, chúng tôi duyệt trong ngày.'),
  },
  duplicate: {
    appeal: true,
    label: L('Duplicate listing', 'Tin trùng lặp'),
    message: L(
      'This event is already live under another listing. Edit the original instead of posting a second one so saves and reminders stay in one place.',
      'Sự kiện này đã có một tin khác đang chạy. Anh/chị sửa tin gốc thay vì đăng thêm, để lượt lưu và nhắc lịch không bị chia ra.'),
  },
  policy: {
    appeal: false,
    label: L('Breaks content policy', 'Vi phạm chính sách nội dung'),
    message: L(
      'This listing breaks our content policy and will not be published. Written to you separately with the specific clause.',
      'Tin này vi phạm chính sách nội dung và sẽ không được đăng. Chúng tôi gửi riêng điều khoản cụ thể.'),
  },
};

export const TIER_NAMES: Record<string, Localized> = {
  early: L('Early bird', 'Vé sớm'),
  ga: L('General admission', 'Vé thường'),
  vip: L('VIP', 'VIP'),
  table: L('Table', 'Bàn'),
};

export const NOTIFICATION_TOPICS = ['saved', 'tickets', 'artists', 'orgs', 'friends', 'weekly', 'sets'] as const;
export type NotificationTopic = (typeof NOTIFICATION_TOPICS)[number];

export const QUIET_HOURS = { start: '23:00', end: '08:00' };
export const QUIET_HOURS_RULE = L(
  'Nothing between 23:00 and 08:00 except changes to an event starting today.',
  'Không gửi gì từ 23:00 đến 08:00, trừ thay đổi của sự kiện diễn ra trong ngày.');
