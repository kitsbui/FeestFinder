/** /console/overview's text. */
import type { Dict } from '../../copy';

export const OVERVIEW = {
  title: { en: 'Overview', vi: 'Tổng quan' },
  newListing: { en: 'New listing', vi: 'Tạo sự kiện' },
  reviewN: { en: 'Review {n}', vi: 'Duyệt {n} tin' },
  reviewQueue: { en: 'Review queue', vi: 'Hàng chờ duyệt' },
  // tiles
  inQueue: { en: 'In queue', vi: 'Chờ duyệt' },
  inQueueNote: { en: 'Oldest {d} · {n} flagged', vi: 'Cũ nhất {d} · {n} bị gắn cờ' },
  queueClear: { en: 'Queue is clear', vi: 'Hàng chờ sạch' },
  decided: { en: 'Decided today', vi: 'Quyết định hôm nay' },
  decidedNote: { en: '{a} approved · {r} sent back', vi: '{a} duyệt · {r} trả lại' },
  live: { en: 'Live listings', vi: 'Đang đăng' },
  liveNote: { en: '{n} in the next 7 days', vi: '{n} diễn ra trong 7 ngày' },
  orders: { en: 'Orders today', vi: 'Đơn hàng hôm nay' },
  // to do
  todo: { en: 'To do', vi: 'Việc cần làm' },
  allClear: { en: 'All caught up', vi: 'Không có việc tồn đọng' },
  tBreach: { en: '{n} past the {h}-hour SLA', vi: '{n} tin quá hạn {h} giờ' },
  tOldest: { en: 'Oldest waiting {d}', vi: 'Cũ nhất chờ {d}' },
  tSoon: { en: '{n} due soon', vi: '{n} tin sắp quá hạn' },
  tReports: { en: '{n} reported listings', vi: '{n} tin bị báo cáo' },
  tAppeals: { en: '{n} open appeals', vi: '{n} kháng nghị đang mở' },
  tVenues: { en: '{n} listings without a map pin', vi: '{n} tin chưa có ghim bản đồ' },
  tVerify: { en: '{n} organisers awaiting verification', vi: '{n} nhà tổ chức chờ xác minh' },
  tAds: { en: '{n} new ad enquiries', vi: '{n} yêu cầu quảng cáo mới' },
  // coming up and activity
  upcoming: { en: 'Coming up', vi: 'Sắp diễn ra' },
  next7: { en: 'Next 7 days', vi: '7 ngày tới' },
  nothingUp: { en: 'Nothing coming up', vi: 'Không có sự kiện sắp tới' },
  sold: { en: '{s}/{c} sold', vi: '{s}/{c} vé' },
  activity: { en: 'Recent activity', vi: 'Hoạt động gần đây' },
  auditLog: { en: 'Audit log', vi: 'Nhật ký' },
  system: { en: 'System', vi: 'Hệ thống' },
  noActivity: { en: 'Nothing recorded', vi: 'Chưa có ghi nhận' },
} satisfies Dict;
