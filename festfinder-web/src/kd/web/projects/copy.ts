/** The projects' text the list (/p) needs; a project's page adds copy-page.ts, the owner's screens copy-own.ts. */
import type { Dict } from '../../copy';

export const PROJ = {
  nav: { en: 'Projects', vi: 'Dự án' },
  title: { en: 'Projects looking for backers', vi: 'Dự án đang kêu gọi' },
  start: { en: 'Start a project', vi: 'Tạo dự án' },
  mine: { en: 'My projects', vi: 'Dự án của tôi' },
  all: { en: 'All', vi: 'Tất cả' },
  seeking: { en: 'Looking for', vi: 'Đang tìm' },
  allCities: { en: 'All cities', vi: 'Mọi thành phố' },
  city: { en: 'City', vi: 'Thành phố' },
  empty: { en: 'No project is looking for that right now', vi: 'Chưa có dự án nào đang tìm điều này' },
  none: { en: 'No projects yet', vi: 'Chưa có dự án nào' },
  clear: { en: 'Clear filters', vi: 'Bỏ lọc' },
  more: { en: 'Load more', vi: 'Tải thêm' },
  target: { en: 'Planned for', vi: 'Dự kiến' },
  waitlistOf: { en: '{n} of {t} waiting', vi: '{n}/{t} người chờ' },
  waitlistN: { en: '{n} waiting', vi: '{n} người chờ' },
} satisfies Dict;
