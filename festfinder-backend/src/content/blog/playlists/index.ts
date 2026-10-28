/**
 * Playlists (owner, 2026-10-22, from the "Playlist Hub" handoff): the pillar "Playlist EDM" and
 * twelve lists under it, in Vietnamese and English, category `playlist`: eight by style (techno,
 * trance, psytrance, hardstyle, drum & bass, dubstep, house, mainstage), two by mood (warm-up,
 * peak time), the year 2026 and October 2026. Every track is a YouTube video from the artist, the
 * label or its network, checked through oEmbed; a year, label or BPM only where a source gives it.
 * The charts that change every day are the style hub's (services/charts.ts); a yearly or monthly
 * list is a new post each period.
 */
import type { BlogPack } from '../../../services/blog-content.ts';
import { playlist2026 } from './playlist-2026.ts';
import { playlistDrumAndBass } from './playlist-drum-and-bass.ts';
import { playlistDubstep } from './playlist-dubstep.ts';
import { playlistEdm } from './playlist-edm.ts';
import { playlistHardstyle } from './playlist-hardstyle.ts';
import { playlistHouse } from './playlist-house.ts';
import { playlistMainstage } from './playlist-mainstage.ts';
import { playlistPeakTime } from './playlist-peak-time.ts';
import { playlistPsytrance } from './playlist-psytrance.ts';
import { playlistTechno } from './playlist-techno.ts';
import { playlistThang10 } from './playlist-thang-10.ts';
import { playlistTrance } from './playlist-trance.ts';
import { playlistWarmUp } from './playlist-warm-up.ts';

/** The period lists first, then the moods, then the styles, as the pillar reads. */
export const playlists: BlogPack = {
  pack: 'playlists',
  byline: 'FeestFinder',
  // The owner approved the pack as written and asked for it public without the queue (2026-10-23).
  publish: true,
  posts: [
    playlistEdm,
    playlist2026, playlistThang10,
    playlistWarmUp, playlistPeakTime,
    playlistTechno, playlistTrance, playlistPsytrance, playlistHardstyle,
    playlistDrumAndBass, playlistDubstep, playlistHouse, playlistMainstage,
  ],
};
