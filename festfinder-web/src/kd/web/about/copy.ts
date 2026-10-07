/** /about's text. English from the legacy web screen's logic.js (the `ab*` lines) where it had the line. */
import type { Dict } from '../../copy';

export const ABOUT = {
  title: { en: 'About FeestFinder', vi: 'Về FeestFinder' },
  headline: { en: 'One place to see what is on tonight', vi: 'Một nơi để biết tối nay có gì' },
  lede: {
    en: 'FeestFinder lists festivals, live shows and night markets. Organisers publish for free, every listing is checked before it goes live, and tickets are sold by the organiser — we add no booking fee.',
    vi: 'FeestFinder tập hợp lễ hội, show nhạc sống và chợ đêm. Nhà tổ chức đăng miễn phí, mọi tin đều được kiểm tra trước khi lên sóng, và vé do nhà tổ chức bán — chúng tôi không thu thêm phí đặt vé.',
  },
  metaDesc: {
    en: 'Festivals, live shows and night markets in one place. How to reach FeestFinder: for people going out, organisers, brands and press.',
    vi: 'Lễ hội, show nhạc sống và chợ đêm ở một nơi. Liên hệ FeestFinder: cho người đi chơi, nhà tổ chức, thương hiệu và báo chí.',
  },

  // numbers
  numbers: { en: 'FeestFinder in numbers', vi: 'FeestFinder qua các con số' },
  statEvents: { en: 'Upcoming events', vi: 'Sự kiện sắp diễn ra' },
  statCities: { en: 'Cities with events', vi: 'Thành phố có sự kiện' },
  statFee: { en: 'Booking fee', vi: 'Phí đặt vé' },

  // cities
  cities: { en: 'Cities', vi: 'Thành phố' },
  soon: { en: 'Coming soon', vi: 'Sắp có' },
  cityEvents: { en: '{c}: {n} upcoming events', vi: '{c}: {n} sự kiện sắp diễn ra' },

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
} satisfies Dict;
