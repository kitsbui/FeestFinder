/** /advertise's text. English from the legacy web screen's logic.js (the `ad*` lines) where it had the line. */
import type { Dict } from '../../copy';

export const ADVERTISE = {
  title: { en: 'Advertise on FeestFinder', vi: 'Quảng cáo trên FeestFinder' },
  kicker: { en: 'Advertise', vi: 'Quảng cáo' },
  sub: {
    en: 'For brands the festival crowd already carries: drinks, clothing, hearing protection, recovery. Tell us who you are and we come back within two working days.',
    vi: 'Dành cho thương hiệu mà người đi lễ hội vốn đã dùng: nước uống, quần áo, bảo vệ tai, phục hồi. Cho chúng tôi biết bạn là ai, chúng tôi phản hồi trong hai ngày làm việc.',
  },
  metaDesc: {
    en: 'Labelled ad placements on FeestFinder: feed cards, the explore banner and in-event. The rate card, and an enquiry form for brands.',
    vi: 'Quảng cáo có gắn nhãn trên FeestFinder: thẻ feed, banner Khám phá và trong sự kiện. Bảng giá và mẫu gửi yêu cầu cho thương hiệu.',
  },
  reach: { en: '{e} upcoming events in {c} cities', vi: '{e} sự kiện sắp diễn ra ở {c} thành phố' },

  // the form
  form: { en: 'Book advertising', vi: 'Đặt quảng cáo' },
  brandLabel: { en: 'Brand name', vi: 'Tên thương hiệu' },
  brandPh: { en: 'Zenkai Energy', vi: 'Zenkai Energy' },
  catLabel: { en: 'Category', vi: 'Ngành hàng' },
  catFB: { en: 'Food & drink', vi: 'Ăn uống' },
  catFashion: { en: 'Fashion', vi: 'Thời trang' },
  catHealth: { en: 'Healthcare', vi: 'Sức khoẻ' },
  emailLabel: { en: 'Work email', vi: 'Email công việc' },
  emailPh: { en: 'you@brand.com', vi: 'ban@thuonghieu.com' },
  budgetLabel: { en: 'Monthly budget', vi: 'Ngân sách tháng' },
  under: { en: 'Under {a}', vi: 'Dưới {a}' },
  between: { en: '{a} – {b}', vi: '{a} – {b}' },
  over: { en: '{a} and up', vi: 'Từ {a}' },
  placeLabel: { en: 'Where you want to appear', vi: 'Vị trí bạn muốn xuất hiện' },
  placeFeed: { en: 'Feed card', vi: 'Thẻ trong feed' },
  placeBanner: { en: 'Explore banner', vi: 'Banner trang Khám phá' },
  placeLive: { en: 'In-event (live mode)', vi: 'Trong sự kiện (chế độ trực tiếp)' },
  msgLabel: { en: 'Anything else', vi: 'Thông tin thêm' },
  msgPh: { en: 'Which festivals, which months, what you are launching.', vi: 'Lễ hội nào, tháng nào, bạn đang ra mắt gì.' },
  submit: { en: 'Send enquiry', vi: 'Gửi yêu cầu' },
  sending: { en: 'Sending…', vi: 'Đang gửi…' },
  submitted: { en: 'Enquiry sent — we reply within two working days', vi: 'Đã gửi — chúng tôi phản hồi trong hai ngày làm việc' },
  sentTitle: { en: 'Enquiry sent', vi: 'Đã gửi yêu cầu' },
  another: { en: 'Send another', vi: 'Gửi yêu cầu khác' },
  errBrand: { en: 'Enter your brand name', vi: 'Nhập tên thương hiệu' },
  errEmail: { en: 'That email doesn’t look right', vi: 'Email chưa đúng định dạng' },
  gate: { en: 'Log in to book advertising', vi: 'Đăng nhập để đặt quảng cáo' },

  // the side
  rates: { en: 'Rate card', vi: 'Bảng giá' },
  cpm: { en: '{p} CPM', vi: '{p} CPM' },
  partners: { en: 'Partnerships', vi: 'Đối tác' },
} satisfies Dict;
