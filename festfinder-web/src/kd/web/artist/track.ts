/** A track of an artist's MP3 playlist, as the API sends it (festfinder-backend routes/tracks.ts). */
import { clock } from '../../format';

export interface Track { id: string; title: string; url: string; durationS: number | null; peaks: number[] }

/** 245 → 4:05, nothing when the length is unknown. */
export const length = (s: number | null) => (s == null ? '' : clock(Math.floor(s)));
