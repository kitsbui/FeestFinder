/** The covers of the techno, trance, psytrance and hardstyle playlists: Wikimedia Commons files, checked on 2026-10-23. */
import type { Media } from '../edm-genres/media.ts';

export const PLAYLIST_MEDIA_B = {
  techno: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Awakenings%2C_Gashouder_Amsterdam_%28Ank_Kumar%29_01.jpg/1920px-Awakenings%2C_Gashouder_Amsterdam_%28Ank_Kumar%29_01.jpg', page: 'https://commons.wikimedia.org/wiki/File:Awakenings,_Gashouder_Amsterdam_(Ank_Kumar)_01.jpg', author: 'Ank Kumar', license: 'CC BY-SA 4.0' },
  trance: { url: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Transmission_Prague_2018_-_lasers.jpg', page: 'https://commons.wikimedia.org/wiki/File:Transmission_Prague_2018_-_lasers.jpg', author: 'UnitedMusicEvents', license: 'CC BY-SA 4.0' },
  psytrance: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Main_stage_%289501905395%29.jpg/1920px-Main_stage_%289501905395%29.jpg', page: 'https://commons.wikimedia.org/wiki/File:Main_stage_(9501905395).jpg', author: 'Maciej Miąsik', license: 'CC BY 2.0' },
  hardstyle: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Defqon.1_-_2017_-_Red_Stage_%282%29.jpg/1920px-Defqon.1_-_2017_-_Red_Stage_%282%29.jpg', page: 'https://commons.wikimedia.org/wiki/File:Defqon.1_-_2017_-_Red_Stage_(2).jpg', author: 'Wvdp', license: 'CC0' },
} satisfies Record<string, Media>;
