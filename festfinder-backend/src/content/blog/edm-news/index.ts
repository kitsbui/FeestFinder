/**
 * EDM news (owner, 2026-10-22, from the "EDM News Hub" handoff): the pillar "Tin tức EDM" and nine
 * posts under it, in Vietnamese and English, category `news`: event coverage (Tomorrowland
 * Thailand, Asia's festival calendar, the world's festivals), trend reports (hard techno,
 * Vietnam's scene), explainers (AI, Vietnam's nightlife rules, reading a line-up) and the
 * 2026–2030 forecast. Facts, analysis and forecasts say which they are (shared.ts); every date
 * comes from the organiser. The press's own headlines are the automatic feed (services/news.ts).
 */
import type { BlogPack } from '../../../services/blog-content.ts';
import { aiEdm } from './ai-edm.ts';
import { docLineup } from './doc-lineup.ts';
import { duBaoEdm } from './du-bao-edm.ts';
import { edmVietNam } from './edm-viet-nam.ts';
import { festivalTheGioi } from './festival-the-gioi.ts';
import { hardTechno } from './hard-techno.ts';
import { lichFestivalChauA } from './lich-festival-chau-a.ts';
import { quyDinhNightlife } from './quy-dinh-nightlife.ts';
import { tinTucEdm } from './tin-tuc-edm.ts';
import { tomorrowlandThailand } from './tomorrowland-thailand.ts';

/** The events first, then the trends, the explainers and the outlook, as the pillar reads. */
export const edmNews: BlogPack = {
  pack: 'edm-news',
  byline: 'FeestFinder',
  // The owner approved the pack as written and asked for it public without the queue (2026-10-23).
  publish: true,
  posts: [
    tinTucEdm,
    lichFestivalChauA, tomorrowlandThailand, festivalTheGioi,
    hardTechno, aiEdm,
    quyDinhNightlife, edmVietNam,
    duBaoEdm, docLineup,
  ],
};
