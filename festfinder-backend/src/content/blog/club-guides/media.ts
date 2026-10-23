/**
 * The pictures of the club guides: Wikimedia Commons files under free licences (CC0, CC BY,
 * CC BY-SA), each with its author and licence, credited where it is shown (checked 2026-10-22:
 * every address answered with an image). Commons serves its thumbnails at listed widths only,
 * so these are the 1920 px renditions its API returns.
 */
import type { Media } from '../edm-genres/media.ts';

const thumb = (path: string, name: string) => `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/${name}/1920px-${name}`;

export const CLUB_MEDIA = {
  haNoi: [
    { url: thumb('7/78', 'Hanoi_Old_Quarter%2C_9_March_2019-2.jpg'), page: 'https://commons.wikimedia.org/wiki/File:Hanoi_Old_Quarter%2C_9_March_2019-2.jpg', author: 'Alexey Komarov', license: 'CC BY-SA 4.0' },
    { url: thumb('6/6e', 'T%E1%BA%A1_Hi%E1%BB%87n_Street.jpg'), page: 'https://commons.wikimedia.org/wiki/File:T%E1%BA%A1_Hi%E1%BB%87n_Street.jpg', author: 'Christophe95', license: 'CC BY-SA 4.0' },
  ],
} satisfies Record<string, Media[]>;
