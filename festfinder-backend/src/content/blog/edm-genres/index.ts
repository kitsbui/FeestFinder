/**
 * The EDM genre guides (owner, 2026-10-20, from the "EDM Genre Knowledge Base" handoff): a guide to
 * EDM itself and its nine main genres under it, in Vietnamese and English, each with quick facts,
 * five artists, five tracks checked through YouTube's oEmbed, sub-genres, a comparison, questions
 * and answers, and the sources it rests on.
 */
import type { BlogPack, PackPost } from '../../../services/blog-content.ts';
import { bassHouse } from './bass-house.ts';
import { bounce } from './bounce.ts';
import { drumAndBass } from './drum-and-bass.ts';
import { dubstep } from './dubstep.ts';
import { edm } from './edm.ts';
import { hardstyle } from './hardstyle.ts';
import { mainstageEdm } from './mainstage-edm.ts';
import { psytrance } from './psytrance.ts';
import { techno } from './techno.ts';
import { trance } from './trance.ts';

const under = (p: PackPost): PackPost => ({ ...p, parent: edm.key });

export const edmGenres: BlogPack = {
  pack: 'edm-genres',
  byline: 'FeestFinder',
  posts: [edm, ...[techno, trance, psytrance, hardstyle, dubstep, drumAndBass, bassHouse, mainstageEdm, bounce].map(under)],
};
