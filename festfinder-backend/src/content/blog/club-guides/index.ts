/**
 * Club guides (owner, 2026-10-22, from the "Club Guide" handoff): a pillar and eleven city guides
 * under it, in Vietnamese and English, category `venues`. Every club was checked against its own
 * page, Resident Advisor, DJ Mag or the local press in October 2026; closed clubs were dropped and
 * an unpublished fact says so, which is why the cities hold four to eight clubs each. Pictures are
 * Wikimedia Commons files (media.ts); no tracks.
 */
import type { BlogPack } from '../../../services/blog-content.ts';
import { clubBacKinh } from './bac-kinh.ts';
import { clubEdmChauA } from './club-edm-chau-a.ts';
import { clubDaNang } from './da-nang.ts';
import { clubHaNoi } from './ha-noi.ts';
import { clubKualaLumpur } from './kuala-lumpur.ts';
import { clubOsaka } from './osaka.ts';
import { clubSaiGon } from './sai-gon.ts';
import { clubSeoul } from './seoul.ts';
import { clubSingapore } from './singapore.ts';
import { clubThamQuyen } from './tham-quyen.ts';
import { clubThuongHai } from './thuong-hai.ts';
import { clubTokyo } from './tokyo.ts';

/** Vietnam first, then Southeast Asia, Japan and Korea, China, as the pillar reads. */
export const clubGuides: BlogPack = {
  pack: 'club-guides',
  byline: 'FeestFinder',
  // The owner approved the pack as written and asked for it public without the queue (2026-10-23).
  publish: true,
  posts: [
    clubEdmChauA,
    clubHaNoi, clubSaiGon, clubDaNang,
    clubSingapore, clubKualaLumpur,
    clubTokyo, clubOsaka, clubSeoul,
    clubThuongHai, clubBacKinh, clubThamQuyen,
  ],
};
