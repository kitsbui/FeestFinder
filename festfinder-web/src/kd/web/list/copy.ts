/** The home page's text: the map, the calendar, the highlight and the banner. */
import type { Dict } from '../../copy';

export const LIST = {
  title: { en: 'Every event', vi: 'Tất cả sự kiện' },
  free: { en: 'Free', vi: 'Miễn phí' },
  seePrice: { en: 'See price', vi: 'Xem giá' },
  clear: { en: 'Clear filters', vi: 'Bỏ lọc' },
  // nothing to show, or the API did not answer
  noUpcoming: { en: 'No events coming up', vi: 'Chưa có sự kiện sắp tới' },
  noMatch: { en: 'Nothing matches', vi: 'Không có sự kiện nào khớp' },
  postEvent: { en: 'List your event', vi: 'Đăng sự kiện' },
  loadFailed: { en: 'The events could not load', vi: 'Không tải được sự kiện' },
  retry: { en: 'Try again', vi: 'Thử lại' },
  // the map
  mapLabel: { en: 'Event map', vi: 'Bản đồ sự kiện' },
  mapFailed: { en: 'The map could not load', vi: 'Không tải được bản đồ' },
  zoomIn: { en: 'Zoom in', vi: 'Phóng to' },
  zoomOut: { en: 'Zoom out', vi: 'Thu nhỏ' },
  gestureWin: { en: 'Use Ctrl + scroll to zoom the map', vi: 'Giữ Ctrl và cuộn để phóng to bản đồ' },
  gestureMac: { en: 'Use ⌘ + scroll to zoom the map', vi: 'Giữ ⌘ và cuộn để phóng to bản đồ' },
  gestureTouch: { en: 'Use two fingers to move the map', vi: 'Dùng hai ngón tay để di chuyển bản đồ' },
  details: { en: 'See details', vi: 'Xem chi tiết' },
  close: { en: 'Close', vi: 'Đóng' },
  // the calendar
  today: { en: 'Today', vi: 'Hôm nay' },
  tonight: { en: 'Tonight', vi: 'Tối nay' },
  tomorrow: { en: 'Tomorrow', vi: 'Ngày mai' },
  prevMonth: { en: 'Previous month', vi: 'Tháng trước' },
  nextMonth: { en: 'Next month', vi: 'Tháng sau' },
  addGoogleCal: { en: 'Add to Google Calendar', vi: 'Thêm vào Google Calendar' },
  addOne: { en: 'Add to calendar', vi: 'Thêm lịch' },
  moreRest: { en: 'more', vi: 'sự kiện nữa' },
  nNights: { en: '{n} events', vi: '{n} sự kiện' },
  stSold: { en: 'Sold out', vi: 'Hết vé' },
  // the highlight and the banner
  flagship: { en: 'World-class festivals', vi: 'Lễ hội lớn thế giới' },
  sponsored: { en: 'Sponsored', vi: 'Được tài trợ' },
  adHide: { en: 'Hide this ad', vi: 'Ẩn quảng cáo' },
} satisfies Dict;
