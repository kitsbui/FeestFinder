/** /about's text. English from the legacy web screen's logic.js (the `ab*` lines) where it had the line. */
import type { Dict } from '../../copy';

export const ABOUT = {
  title: { en: 'About FeestFinder', vi: 'Về FeestFinder' },
  headline: { en: 'One place to see what is on tonight', vi: 'Một nơi để biết tối nay có gì' },
  lede: {
    en: 'FeestFinder lists electronic music: club nights, raves and EDM festivals. Organisers publish for free, every listing is checked before it goes live, and tickets are sold by the organiser — we add no booking fee.',
    vi: 'FeestFinder tập hợp sự kiện nhạc điện tử: club, rave và lễ hội EDM. Nhà tổ chức đăng miễn phí, mọi tin đều được kiểm tra trước khi lên sóng, và vé do nhà tổ chức bán — chúng tôi không thu thêm phí đặt vé.',
  },
  metaDesc: {
    en: 'EDM club nights, raves and festivals in one place. How to reach FeestFinder: for people going out, organisers, brands and press.',
    vi: 'Club, rave và lễ hội EDM ở một nơi. Liên hệ FeestFinder: cho người đi chơi, nhà tổ chức, thương hiệu và báo chí.',
  },

  // numbers
  numbers: { en: 'FeestFinder in numbers', vi: 'FeestFinder qua các con số' },
  statEvents: { en: 'Upcoming events', vi: 'Sự kiện sắp diễn ra' },
  statCities: { en: 'Cities with events', vi: 'Thành phố có sự kiện' },
  statFee: { en: 'Booking fee', vi: 'Phí đặt vé' },

  // cities
  cities: { en: 'Cities', vi: 'Thành phố' },
  soon: { en: 'Coming soon', vi: 'Sắp có' },
  upcomingEvents: { en: 'upcoming events', vi: 'sự kiện sắp diễn ra' },

  // contact
  contact: { en: 'Contact', vi: 'Liên hệ' },
  users: { en: 'For people going out', vi: 'Cho người đi chơi' },
  usersBody: {
    en: 'A missing event, a wrong start time, a listing that looks off — tell us and we correct it, usually the same day.',
    vi: 'Thiếu sự kiện, sai giờ bắt đầu, tin trông không ổn — nhắn cho chúng tôi, thường sửa trong ngày.',
  },
  org: { en: 'For organisers', vi: 'Cho nhà tổ chức' },
  orgBody: {
    en: 'Publishing is free. Get verified once and your events keep the badge, with ticket clicks and saves in the organiser console.',
    vi: 'Đăng tin miễn phí. Xác minh một lần là sự kiện của bạn giữ nhãn đã xác minh, kèm số lượt bấm mua vé và lượt lưu trong bảng điều khiển.',
  },
  brand: { en: 'For brands & press', vi: 'Cho thương hiệu & báo chí' },
  brandBody: {
    en: 'Audience numbers, the rate card and interview requests. Ad placements are labelled and never target a person by name.',
    vi: 'Số liệu khán giả, bảng giá và các yêu cầu phỏng vấn. Quảng cáo luôn được gắn nhãn và không nhắm theo tên người dùng.',
  },
  advertise: { en: 'Advertise', vi: 'Đặt quảng cáo' },
  emailTo: { en: 'Email {e}', vi: 'Gửi email tới {e}' },

  // social
  social: { en: 'Follow us', vi: 'Theo dõi chúng tôi' },

  // office
  details: { en: 'Office and support', vi: 'Văn phòng và hỗ trợ' },
  office: { en: 'Office', vi: 'Văn phòng' },
  officeValue: { en: '48 Lê Lợi, Bến Nghé, Quận 1, TP.HCM', vi: '48 Lê Lợi, Bến Nghé, Quận 1, TP.HCM' },
  hotline: { en: 'Event-night hotline', vi: 'Hotline đêm sự kiện' },
  hotlineValue: { en: 'until 02:00 on festival nights', vi: 'đến 02:00 đêm lễ hội' },
  hours: { en: 'Support hours', vi: 'Giờ hỗ trợ' },
  hoursValue: { en: 'Monday to Saturday, 09:00 – 18:00', vi: 'Thứ Hai – Thứ Bảy, 09:00 – 18:00' },
  note: {
    en: 'Email is answered within two working days. If something is going wrong at an event tonight, call the hotline instead — it is staffed until 02:00 on festival nights.',
    vi: 'Email được trả lời trong hai ngày làm việc. Nếu đang có vấn đề tại sự kiện tối nay, hãy gọi hotline — trực đến 02:00 trong các đêm lễ hội.',
  },
  // The questions (on the home page until design v2 phase 2; owner, 2026-10-17)
  faq: { en: 'Questions', vi: 'Câu hỏi thường gặp' },
  q1: { en: 'What is FeestFinder?', vi: 'FeestFinder là gì?' },
  a1: {
    en: 'One place to see what is on tonight: EDM club nights, raves and festivals. Every listing is checked before it goes live.',
    vi: 'Một nơi để biết tối nay có gì: club, rave và lễ hội EDM. Mọi tin đều được kiểm tra trước khi lên sóng.',
  },
  q2: { en: 'Who sells the tickets?', vi: 'Ai bán vé?' },
  a2: {
    en: 'The organiser, or FeestFinder’s own checkout for the events it sells. FeestFinder adds no booking fee.',
    vi: 'Nhà tổ chức, hoặc FeestFinder với các sự kiện bán vé tại đây. FeestFinder không thu thêm phí đặt vé.',
  },
  q3: { en: 'Is listing an event free?', vi: 'Đăng sự kiện có mất phí không?' },
  a3: {
    en: 'Publishing is free. Get verified once and your events keep the badge, with ticket clicks and saves in your dashboard.',
    vi: 'Đăng tin miễn phí. Xác minh một lần là sự kiện của bạn giữ nhãn đã xác minh, kèm lượt bấm mua vé và lượt lưu trong bảng điều khiển.',
  },
  q4: { en: 'Something is wrong on a listing', vi: 'Tin đăng có thông tin sai' },
  a4: {
    en: 'Use “Report this listing” at the bottom of the event page, or write to hello@feestfinder.com. We usually correct it the same day.',
    vi: 'Bấm “Báo cáo tin này” cuối trang sự kiện, hoặc gửi về hello@feestfinder.com. Thường sửa trong ngày.',
  },
} satisfies Dict;
