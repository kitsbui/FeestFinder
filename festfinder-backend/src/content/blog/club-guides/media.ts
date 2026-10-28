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
  daNang: [
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/2024-12-04_Da_Nang_at_night.jpg/1920px-2024-12-04_Da_Nang_at_night.jpg', page: 'https://commons.wikimedia.org/wiki/File:2024-12-04_Da_Nang_at_night.jpg', author: 'Alexkom000', license: 'CC BY 4.0' },
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4a/Novotel_Danang_Premier_Han_River_Night_View.jpg/1920px-Novotel_Danang_Premier_Han_River_Night_View.jpg', page: 'https://commons.wikimedia.org/wiki/File:Novotel_Danang_Premier_Han_River_Night_View.jpg', author: 'Tú Hồ', license: 'CC BY 2.0' },
  ],
  saiGon: [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/2024-11-16_Ho_Chi_Minh_City_at_night_1.jpg/1920px-2024-11-16_Ho_Chi_Minh_City_at_night_1.jpg', page: 'https://commons.wikimedia.org/wiki/File:2024-11-16_Ho_Chi_Minh_City_at_night_1.jpg', author: 'Alexkom000', license: 'CC BY 4.0' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Bui_Vien_Street%2C_Ho_Chi_Minh_City%2C_at_night%2C_2023_%2804%29.jpg/1920px-Bui_Vien_Street%2C_Ho_Chi_Minh_City%2C_at_night%2C_2023_%2804%29.jpg', page: 'https://commons.wikimedia.org/wiki/File:Bui_Vien_Street,_Ho_Chi_Minh_City,_at_night,_2023_(04).jpg', author: 'Bahnfrend', license: 'CC BY-SA 4.0' },
  ],
  singapore: [
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/22/Clarke_Quay_at_night%2C_Singapore%2C_20240205_1946_6058.jpg/1920px-Clarke_Quay_at_night%2C_Singapore%2C_20240205_1946_6058.jpg', page: 'https://commons.wikimedia.org/wiki/File:Clarke_Quay_at_night%2C_Singapore%2C_20240205_1946_6058.jpg', author: 'Jakub Hałun', license: 'CC BY 4.0' },
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/Boat-Quay-night-2017-Luka-Peternel.jpg/1920px-Boat-Quay-night-2017-Luka-Peternel.jpg', page: 'https://commons.wikimedia.org/wiki/File:Boat-Quay-night-2017-Luka-Peternel.jpg', author: 'Luka Peternel', license: 'CC BY-SA 4.0' },
  ],
  tokyo: [
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dc/Colorful_neon_street_signs_in_Kabukich%C5%8D%2C_Shinjuku%2C_Tokyo.jpg/1920px-Colorful_neon_street_signs_in_Kabukich%C5%8D%2C_Shinjuku%2C_Tokyo.jpg', page: 'https://commons.wikimedia.org/wiki/File:Colorful_neon_street_signs_in_Kabukich%C5%8D,_Shinjuku,_Tokyo.jpg', author: 'Basile Morin', license: 'CC BY-SA 4.0' },
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Womb_Nightclub_Tokyo_Main_Room.jpg/1920px-Womb_Nightclub_Tokyo_Main_Room.jpg', page: 'https://commons.wikimedia.org/wiki/File:Womb_Nightclub_Tokyo_Main_Room.jpg', author: 'Yuki Shimazu', license: 'CC BY-SA 2.0' },
  ],
  osaka: [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Osaka_Dotonbori_yoru.jpg/1920px-Osaka_Dotonbori_yoru.jpg', page: 'https://commons.wikimedia.org/wiki/File:Osaka_Dotonbori_yoru.jpg', author: 'Sakai Yayoi', license: 'CC0' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Dotonbori_river_night.jpg/1920px-Dotonbori_river_night.jpg', page: 'https://commons.wikimedia.org/wiki/File:Dotonbori_river_night.jpg', author: 'Emma0mb', license: 'CC BY 4.0' },
  ],
  seoul: [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Seoul_at_night%2C_itaewon.jpg/1920px-Seoul_at_night%2C_itaewon.jpg', page: 'https://commons.wikimedia.org/wiki/File:Seoul_at_night%2C_itaewon.jpg', author: 'AhmadElq', license: 'CC BY-SA 4.0' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Hongdae_Party_District_at_Night%2C_Seoul.jpg/1920px-Hongdae_Party_District_at_Night%2C_Seoul.jpg', page: 'https://commons.wikimedia.org/wiki/File:Hongdae_Party_District_at_Night%2C_Seoul.jpg', author: 'Ken Eckert', license: 'CC BY-SA 4.0' },
  ],
  shanghai: [
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Shanghai_Bund_at_night_20260417_%282%29.jpg/1920px-Shanghai_Bund_at_night_20260417_%282%29.jpg', page: 'https://commons.wikimedia.org/wiki/File:Shanghai_Bund_at_night_20260417_(2).jpg', author: 'DvTor8303', license: 'CC0' },
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/83/Bund_at_night_Shanghai.jpg/1920px-Bund_at_night_Shanghai.jpg', page: 'https://commons.wikimedia.org/wiki/File:Bund_at_night_Shanghai.jpg', author: 'Ernest Jourdier', license: 'CC BY 4.0' },
  ],
  beijing: [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/202309_Apple_Sanlitun_at_Night.jpg/1920px-202309_Apple_Sanlitun_at_Night.jpg', page: 'https://commons.wikimedia.org/wiki/File:202309_Apple_Sanlitun_at_Night.jpg', author: 'MNXANL', license: 'CC BY-SA 4.0' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Beijing_Workers%27_Stadium.jpg/1920px-Beijing_Workers%27_Stadium.jpg', page: 'https://commons.wikimedia.org/wiki/File:Beijing_Workers%27_Stadium.jpg', author: 'Picrazy2', license: 'CC BY-SA 4.0' },
  ],
  shenzhen: [
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/55/Night_View_of_Office_Buildings_in_Shenzhen_Bay.jpg/1920px-Night_View_of_Office_Buildings_in_Shenzhen_Bay.jpg', page: 'https://commons.wikimedia.org/wiki/File:Night_View_of_Office_Buildings_in_Shenzhen_Bay.jpg', author: 'Sparktour', license: 'CC BY-SA 4.0' },
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/57/Night_of_Civic_Center_Shenzhen_from_Lianhua_Mountain.jpg/1920px-Night_of_Civic_Center_Shenzhen_from_Lianhua_Mountain.jpg', page: 'https://commons.wikimedia.org/wiki/File:Night_of_Civic_Center_Shenzhen_from_Lianhua_Mountain.jpg', author: 'Sparktour', license: 'CC BY-SA 4.0' },
  ],
  kualaLumpur: [
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Kuala_Lumpur%2C_Malaysia%2C_Petronas_Towers_at_night.jpg/1920px-Kuala_Lumpur%2C_Malaysia%2C_Petronas_Towers_at_night.jpg', page: 'https://commons.wikimedia.org/wiki/File:Kuala_Lumpur,_Malaysia,_Petronas_Towers_at_night.jpg', author: 'Vyacheslav Argenberg', license: 'CC BY 4.0' },
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/Kuala_Lumpur%2C_Malaysia%2C_Changkat_Bukit_Bintang%2C_Rain.jpg/1920px-Kuala_Lumpur%2C_Malaysia%2C_Changkat_Bukit_Bintang%2C_Rain.jpg', page: 'https://commons.wikimedia.org/wiki/File:Kuala_Lumpur,_Malaysia,_Changkat_Bukit_Bintang,_Rain.jpg', author: 'Vyacheslav Argenberg', license: 'CC BY 4.0' },
  ],
} satisfies Record<string, Media[]>;
