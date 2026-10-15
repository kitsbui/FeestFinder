/**
 * Roles as the screens name them: every account attends, and has at most one craft besides —
 * it performs (the artist studio) or it organises (Studio). Switching craft keeps the other
 * profile; the API holds the rule (festfinder-backend/src/services/roles.ts, migration 033).
 */
import type { Dict } from './copy';

export type Craft = 'artist' | 'organizer';

/** Where each craft works. */
export const WORKSPACE: Record<Craft, string> = { artist: '/studio/artist', organizer: '/studio' };

export const otherCraft = (c: Craft): Craft => (c === 'artist' ? 'organizer' : 'artist');

export const CRAFT = {
  roles: { en: 'Role', vi: 'Vai trò' },
  attendee: { en: 'Attendee', vi: 'Người tham dự' },
  artist: { en: 'Artist', vi: 'Nghệ sĩ' },
  organizer: { en: 'Organiser', vi: 'Nhà tổ chức' },
  add: { en: 'Add a craft', vi: 'Thêm vai nghề' },
  switchTo: { en: 'Switch to {r}', vi: 'Đổi sang {r}' },
  waiting: { en: 'Waiting', vi: 'Chờ duyệt' },
  oneTitle: { en: 'One craft per account', vi: 'Mỗi tài khoản một vai nghề' },
  oneBody: {
    en: 'Besides attending, an account performs or organises. Switch from {a} to {b}? Your {a} profile stays, and you can switch back any time.',
    vi: 'Bên cạnh vai Người tham dự, mỗi tài khoản có một vai nghề. Chuyển từ {a} sang {b}? Hồ sơ {a} vẫn được giữ, đổi lại lúc nào cũng được.',
  },
  doSwitch: { en: 'Switch', vi: 'Chuyển' },
} satisfies Dict;
