/** The artist directory's text. English from the legacy web screen's logic.js (dir*) where it had the line. */
import type { Dict } from '../../copy';

export const DIR = {
  // The titles match the API's own (services/seo.ts, buildDirectorySeo).
  titleAll: { en: 'Artists on FeestFinder', vi: 'Nghệ sĩ trên FeestFinder' },
  titleStyle: { en: '{s} artists', vi: 'Nghệ sĩ {s}' },
  titleCity: { en: 'Artists in {c}', vi: 'Nghệ sĩ ở {c}' },
  titleBoth: { en: '{s} artists in {c}', vi: 'Nghệ sĩ {s} ở {c}' },
  crumb: { en: 'Artists', vi: 'Nghệ sĩ' },
  count: { en: '{n} artists', vi: '{n} nghệ sĩ' },
  search: { en: 'Search artists', vi: 'Tìm nghệ sĩ' },
  filters: { en: 'Filters', vi: 'Bộ lọc' },
  role: { en: 'Role', vi: 'Vai trò' },
  anyRole: { en: 'Every role', vi: 'Mọi vai trò' },
  style: { en: 'Style', vi: 'Phong cách' },
  anyStyle: { en: 'Every style', vi: 'Mọi phong cách' },
  city: { en: 'City', vi: 'Thành phố' },
  anyCity: { en: 'Every city', vi: 'Mọi thành phố' },
  available: { en: 'Taking bookings', vi: 'Nhận booking' },
  upcoming: { en: 'Playing soon', vi: 'Sắp diễn' },
  clear: { en: 'Clear', vi: 'Bỏ lọc' },
  results: { en: 'Artists', vi: 'Danh sách nghệ sĩ' },
  empty: { en: 'No artists match', vi: 'Không có nghệ sĩ nào khớp' },
  more: { en: 'More artists', vi: 'Xem thêm' },
  next: { en: 'Next:', vi: 'Sắp diễn:' },
  verified: { en: 'Verified', vi: 'Đã xác minh' },
} satisfies Dict;
