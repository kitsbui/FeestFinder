/** The covers of the drum & bass, dubstep, house and mainstage playlists: Wikimedia Commons files, checked on 2026-10-23. */
import type { Media } from '../edm-genres/media.ts';

export const PLAYLIST_MEDIA_C = {
  drumAndBass: { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2b/Chase_%26_Status_-_Roskilde_Festival_2011.jpg/1920px-Chase_%26_Status_-_Roskilde_Festival_2011.jpg', page: 'https://commons.wikimedia.org/wiki/File:Chase_%26_Status_-_Roskilde_Festival_2011.jpg', author: 'Bill Ebbesen', license: 'CC BY-SA 3.0' },
  dubstep: { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fa/Skrillex_live_in_Berlin.jpg/1920px-Skrillex_live_in_Berlin.jpg', page: 'https://commons.wikimedia.org/wiki/File:Skrillex_live_in_Berlin.jpg', author: 'gillyberlin', license: 'CC BY 2.0' },
  house: { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0c/Peggy_Gou%2C_Ray-Ban_stage.jpg/1920px-Peggy_Gou%2C_Ray-Ban_stage.jpg', page: 'https://commons.wikimedia.org/wiki/File:Peggy_Gou,_Ray-Ban_stage.jpg', author: 'Jwslubbock', license: 'CC BY-SA 4.0' },
  mainstage: { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Martin_Garrix_%40_VELD_Festival.jpg/1920px-Martin_Garrix_%40_VELD_Festival.jpg', page: 'https://commons.wikimedia.org/wiki/File:Martin_Garrix_@_VELD_Festival.jpg', author: 'Veld Music Festival', license: 'CC BY-SA 2.0' },
} satisfies Record<string, Media>;
