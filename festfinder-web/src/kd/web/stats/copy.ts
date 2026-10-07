/** /stats/<key>'s text; English from the legacy web screen where it had the line. */
import type { Dict } from '../../copy';

export const STATS = {
  kicker: { en: 'Filtered list', vi: 'Danh sách đã lọc' },
  // the three stats: the page's title, and its chip
  free: { en: 'Free entry, no ticket needed', vi: 'Vào cửa miễn phí, không cần vé' },
  weekend: { en: 'On this weekend', vi: 'Diễn ra cuối tuần này' },
  venues: { en: 'Venues with something on', vi: 'Địa điểm đang có sự kiện' },
  views: { en: 'Lists', vi: 'Danh sách' },
  chipFree: { en: 'Free', vi: 'Miễn phí' },
  chipWeekend: { en: 'This weekend', vi: 'Cuối tuần này' },
  chipVenues: { en: 'Venues', vi: 'Địa điểm' },

  // filters
  filters: { en: 'Filters', vi: 'Bộ lọc' },
  when: { en: 'When', vi: 'Thời gian' },
  tonight: { en: 'Tonight', vi: 'Tối nay' },
  thisWeekend: { en: 'This weekend', vi: 'Cuối tuần này' },
  next7: { en: 'Next 7 days', vi: '7 ngày tới' },
  month: { en: 'This month', vi: 'Tháng này' },
  city: { en: 'City', vi: 'Thành phố' },
  allCities: { en: 'All cities', vi: 'Mọi thành phố' },
  remove: { en: 'Remove filter: {f}', vi: 'Bỏ lọc: {f}' },
  clear: { en: 'Clear filters', vi: 'Bỏ lọc' },

  // the list
  oneEvent: { en: '1 event', vi: '1 sự kiện' },
  nEvents: { en: '{n} events', vi: '{n} sự kiện' },
  oneVenue: { en: '1 venue', vi: '1 địa điểm' },
  nVenues: { en: '{n} venues', vi: '{n} địa điểm' },
  hype: { en: '{n} hype', vi: '{n} hype' },
  moreHere: { en: '{n} more here', vi: 'Thêm {n} sự kiện' },
  moreN: { en: 'Show {n} more', vi: 'Xem thêm {n}' },
  less: { en: 'Show less', vi: 'Thu gọn' },

  // nothing, or no answer
  empty: { en: 'Nothing matches these filters', vi: 'Không có gì khớp bộ lọc' },
  widen: { en: 'See this month', vi: 'Xem cả tháng' },
  explore: { en: 'Explore events', vi: 'Khám phá sự kiện' },
  failed: { en: 'This list could not load', vi: 'Không tải được danh sách' },
  retry: { en: 'Try again', vi: 'Thử lại' },
} satisfies Dict;
