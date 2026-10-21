/** A project's page (/p/<slug>): its facts, offering, the waitlist; apart from the list's text so /p loads less. */
import type { Dict } from '../../copy';
import { PROJ } from './copy';

const PAGE = {
  kicker: { en: 'Project', vi: 'Dự án' },
  by: { en: 'Started by {n}', vi: 'Khởi xướng bởi {n}' },
  member: { en: 'a FeestFinder member', vi: 'một thành viên FeestFinder' },
  budget: { en: 'Budget', vi: 'Ngân sách' },
  waitlist: { en: 'Waitlist', vi: 'Danh sách chờ' },
  join: { en: 'Join the waitlist', vi: 'Vào danh sách chờ' },
  joined: { en: 'On the waitlist', vi: 'Đã vào danh sách chờ' },
  capacity: { en: 'Capacity', vi: 'Sức chứa' },
  people: { en: '{n} people', vi: '{n} người' },
  idea: { en: 'The idea', vi: 'Ý tưởng' },
  packages: { en: 'Sponsor packages', vi: 'Gói tài trợ' },
  slots: { en: '{n} slots', vi: '{n} suất' },
  onBoard: { en: 'On board', vi: 'Đã đồng hành' },
  became: { en: 'This project became an event', vi: 'Dự án đã thành sự kiện' },
  closed: { en: 'This project takes no more offers', vi: 'Dự án đã ngừng nhận đề nghị' },
  offer: { en: 'Offer to take part', vi: 'Đề nghị tham gia' },
  offered: { en: 'You offered: {k}', vi: 'Bạn đã đề nghị: {k}' },
  accepted: { en: 'accepted', vi: 'đã nhận' },
  waiting: { en: 'waiting', vi: 'đang chờ' },
  declined: { en: 'declined', vi: 'đã từ chối' },
  withdrawn: { en: 'withdrawn', vi: 'đã rút' },
  offerAs: { en: 'How you would take part', vi: 'Bạn tham gia với vai trò' },
  orgName: { en: 'Brand or venue', vi: 'Thương hiệu hoặc địa điểm' },
  package: { en: 'Package', vi: 'Gói' },
  noPackage: { en: 'No package', vi: 'Không chọn gói' },
  amount: { en: 'Amount ({c})', vi: 'Số tiền ({c})' },
  message: { en: 'Message to the owner', vi: 'Lời nhắn cho chủ dự án' },
  send: { en: 'Send offer', vi: 'Gửi đề nghị' },
  performNeedsArtist: { en: 'Offer to perform from your artist profile', vi: 'Đề nghị biểu diễn bằng hồ sơ nghệ sĩ của bạn' },
  manage: { en: 'Manage', vi: 'Quản lý' },
  lineup: { en: 'Lineup', vi: 'Line-up' },
} satisfies Dict;

/** The list's lines and the page's, for a project's page and what it opens. */
export const PROJ_PAGE = { ...PROJ, ...PAGE };
