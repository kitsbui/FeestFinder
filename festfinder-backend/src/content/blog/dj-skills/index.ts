/**
 * Learning to DJ from zero (owner, 2026-10-21, from the "Học DJ từ số 0" handoff): a pillar and
 * sixteen hands-on lessons under it, in Vietnamese and English, across six modules (gear and
 * software, hearing and reading music, beatmatching and mixing, building a set, music and the
 * market, mindset). Each lesson is one move on the controller: what to prepare, steps that say
 * what to do, where to look and what to listen for (read as HowTo by services/seo/blog.ts), signs
 * you got it right, common mistakes, dos and don'ts, wasted moves, old ideas to drop where they
 * fit, a drill and the next lesson. Pictures are Wikimedia Commons files (media.ts); no tracks.
 */
import type { BlogPack, PackPost } from '../../../services/blog-content.ts';
import { beatmatch } from './beatmatch.ts';
import { bpm } from './bpm.ts';
import { controllerDj } from './controller-dj.ts';
import { crossfader } from './crossfader.ts';
import { cuePoint } from './cue-point.ts';
import { djVietNam } from './dj-viet-nam.ts';
import { eqMixing } from './eq-mixing.ts';
import { fileNhac } from './file-nhac.ts';
import { ghiAm } from './ghi-am.ts';
import { harmonicMixing } from './harmonic-mixing.ts';
import { hocDj } from './hoc-dj.ts';
import { muaNhac } from './mua-nhac.ts';
import { phrasing } from './phrasing.ts';
import { sync } from './sync.ts';
import { thuatNgu } from './thuat-ngu.ts';
import { tuDuy } from './tu-duy.ts';
import { xaySet } from './xay-set.ts';

const under = (p: PackPost): PackPost => ({ ...p, parent: hocDj.key });

/** In the order of the modules, so the pillar's children read as a course. */
export const djSkills: BlogPack = {
  pack: 'dj-skills',
  byline: 'FeestFinder',
  posts: [hocDj, ...[
    controllerDj, cuePoint,
    bpm, phrasing, harmonicMixing,
    beatmatch, sync, eqMixing, crossfader,
    xaySet, ghiAm,
    fileNhac, muaNhac, djVietNam,
    tuDuy, thuatNgu,
  ].map(under)],
};
