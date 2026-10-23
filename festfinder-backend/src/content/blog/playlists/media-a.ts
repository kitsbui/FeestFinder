import type { Media } from '../edm-genres/media.ts';

/** The pictures of the playlist pillar, the yearly and monthly lists and the two moods (Wikimedia Commons, checked 2026-10-23). */
export const PLAYLIST_MEDIA_A = {
  pillar: { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/Vinyl_Store.jpg/1920px-Vinyl_Store.jpg', page: 'https://commons.wikimedia.org/wiki/File:Vinyl_Store.jpg', author: 'Celsoazevedo', license: 'CC0' },
  year: { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b9/Future_Music_Festival_2011_%285521514852%29.jpg/1920px-Future_Music_Festival_2011_%285521514852%29.jpg', page: 'https://commons.wikimedia.org/wiki/File:Future_Music_Festival_2011_(5521514852).jpg', author: 'Eva Rinaldi', license: 'CC BY-SA 2.0' },
  month: { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/Groove_and_needle_in_close_embrace_from_beginning_to_end.jpg/1920px-Groove_and_needle_in_close_embrace_from_beginning_to_end.jpg', page: 'https://commons.wikimedia.org/wiki/File:Groove_and_needle_in_close_embrace_from_beginning_to_end.jpg', author: 'Franz van Duns', license: 'CC BY-SA 4.0' },
  warmUp: { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/Elektro-Party_im_Potsdamer_Nuthe-Park_%282025%29.jpg/1920px-Elektro-Party_im_Potsdamer_Nuthe-Park_%282025%29.jpg', page: 'https://commons.wikimedia.org/wiki/File:Elektro-Party_im_Potsdamer_Nuthe-Park_(2025).jpg', author: 'Brataffe', license: 'CC BY 4.0' },
  peak: { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/Night_techno_party%2C_dancing%2C_Koh_Chang%2C_Thailand.jpg/1920px-Night_techno_party%2C_dancing%2C_Koh_Chang%2C_Thailand.jpg', page: 'https://commons.wikimedia.org/wiki/File:Night_techno_party,_dancing,_Koh_Chang,_Thailand.jpg', author: 'Vyacheslav Argenberg', license: 'CC BY 4.0' },
} satisfies Record<string, Media>;
