/**
 * What the DJ lessons share: their links, the facts every lesson carries (level, time, gear, what
 * comes first and what you can do after), and the pillar's key.
 */
import type { Localized } from '../../../lib/i18n.ts';

export { figure, guide as lesson, wiki } from '../edm-genres/media.ts';

export const PILLAR = 'dj-skills/hoc-dj';

const fact = (label: Localized, value: Localized) => ({ label, value });

/** A lesson's quick facts: its module, level, time, gear, what to learn first and what you can do after. */
export const lessonFacts = (o: { module: Localized; minutes: string; gear: Localized; first: Localized; after: Localized; level?: Localized }) => [
  fact({ vi: 'Module', en: 'Module' }, o.module),
  fact({ vi: 'Cấp độ', en: 'Level' }, o.level ?? { vi: 'Người mới', en: 'Beginner' }),
  fact({ vi: 'Thời gian tập', en: 'Practice time' }, { vi: `${o.minutes} phút mỗi buổi`, en: `${o.minutes} minutes a session` }),
  fact({ vi: 'Cần có', en: 'You need' }, o.gear),
  fact({ vi: 'Học trước', en: 'Learn first' }, o.first),
  fact({ vi: 'Sau bài này', en: 'After this lesson' }, o.after),
];

export const MODULES = {
  gear: { vi: '1 · Thiết bị và phần mềm', en: '1 · Gear and software' },
  ears: { vi: '2 · Nghe và đọc nhạc', en: '2 · Hearing and reading music' },
  mixing: { vi: '3 · Beatmatching và mixing', en: '3 · Beatmatching and mixing' },
  sets: { vi: '4 · Xây set 30–60 phút', en: '4 · Building a 30–60 minute set' },
  music: { vi: '5 · Nhạc và thị trường', en: '5 · Music and the market' },
  mind: { vi: '6 · Tư duy và phát triển', en: '6 · Mindset and growth' },
} satisfies Record<string, Localized>;
