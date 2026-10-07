/** A public collection's text (/c/<slug>); English from the legacy web screen where it had the line. */
import type { Dict } from '../../copy';

export const COLLECTION = {
  kicker: { en: 'Collection', vi: 'Bộ sưu tập' },
  madeBy: { en: 'Made by {n}', vi: 'Tạo bởi {n}' },
  member: { en: 'A FeestFinder member', vi: 'Thành viên FeestFinder' },
  events: { en: 'Events', vi: 'Sự kiện' },
  upcoming: { en: 'Upcoming', vi: 'Sắp tới' },
  past: { en: 'Past', vi: 'Đã qua' },
  cities: { en: 'Cities', vi: 'Thành phố' },
  families: { en: 'Genres', vi: 'Thể loại' },
  nEvents: { en: '{n} events', vi: '{n} sự kiện' },
  empty: { en: 'Nothing in this collection yet', vi: 'Bộ sưu tập chưa có sự kiện' },
  noUpcoming: { en: 'Nothing coming up in this collection', vi: 'Bộ sưu tập chưa có sự kiện sắp tới' },
  explore: { en: 'Explore events', vi: 'Khám phá sự kiện' },
  moreN: { en: 'Show {n} more', vi: 'Xem thêm {n}' },
  less: { en: 'Show less', vi: 'Thu gọn' },
  share: { en: 'Share', vi: 'Chia sẻ' },
} satisfies Dict;
