/**
 * The pictures of the EDM genre guides: Wikimedia Commons files under free licences, each with
 * its author and licence, credited where it is shown (checked 2026-10-20: every address answered
 * with an image). Covers are landscape, 1600 px wide.
 */
import type { Localized } from '../../../lib/i18n.ts';

export interface Media { url: string; page: string; author: string; license: string }

export const MEDIA = {
  'edm': [
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/Pattaya_Zoom_Music_Festival%2C_Main_stage_in_lights.jpg/1920px-Pattaya_Zoom_Music_Festival%2C_Main_stage_in_lights.jpg', page: 'https://commons.wikimedia.org/wiki/File:Pattaya_Zoom_Music_Festival,_Main_stage_in_lights.jpg', author: 'Vyacheslav Argenberg', license: 'CC BY 4.0' },
  ],
  'techno': [
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/Jeff_Mills_%284720043134%29.jpg/1920px-Jeff_Mills_%284720043134%29.jpg', page: 'https://commons.wikimedia.org/wiki/File:Jeff_Mills_%284720043134%29.jpg', author: 'Angie Linder', license: 'CC BY-SA 2.0' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Detroit_Electronic_Music_Festival_2002_main_stage_after_dark.jpg', page: 'https://commons.wikimedia.org/wiki/File:Detroit_Electronic_Music_Festival_2002_main_stage_after_dark.jpg', author: 'Myself248', license: 'CC BY-SA 4.0' },
  ],
  'trance': [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Armin_van_Buuren_2014.jpg', page: 'https://commons.wikimedia.org/wiki/File:Armin_van_Buuren_2014.jpg', author: 'Rutger Geerling', license: 'CC BY 2.0' },
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Sunburn_Festival%2C_Goa%2C_Ferry_Corsten_on_stage.jpg/1920px-Sunburn_Festival%2C_Goa%2C_Ferry_Corsten_on_stage.jpg', page: 'https://commons.wikimedia.org/wiki/File:Sunburn_Festival,_Goa,_Ferry_Corsten_on_stage.jpg', author: 'Vyacheslav Argenberg', license: 'CC BY 4.0' },
  ],
  'hardstyle': [
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/RED_Stage_%28DEFQON.1_Weekend_Festival_2022%29.jpg/1920px-RED_Stage_%28DEFQON.1_Weekend_Festival_2022%29.jpg', page: 'https://commons.wikimedia.org/wiki/File:RED_Stage_%28DEFQON.1_Weekend_Festival_2022%29.jpg', author: 'DELTAFXUniverse', license: 'CC BY-SA 4.0' },
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/Headhunterz_%40_Airbeat_One_2017.jpg/1920px-Headhunterz_%40_Airbeat_One_2017.jpg', page: 'https://commons.wikimedia.org/wiki/File:Headhunterz_@_Airbeat_One_2017.jpg', author: 'Q1q2q3qwertz', license: 'CC BY-SA 4.0' },
  ],
  'dubstep': [
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/07/Magnetic_Men_%284742889931%29.jpg/1920px-Magnetic_Men_%284742889931%29.jpg', page: 'https://commons.wikimedia.org/wiki/File:Magnetic_Men_%284742889931%29.jpg', author: 'wonker', license: 'CC BY 2.0' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Skream.jpg', page: 'https://commons.wikimedia.org/wiki/File:Skream.jpg', author: 'Simon Fernandez', license: 'CC BY 2.0' },
  ],
  'drum-and-bass': [
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/86/Andy_C_live_in_2011.jpg/1920px-Andy_C_live_in_2011.jpg', page: 'https://commons.wikimedia.org/wiki/File:Andy_C_live_in_2011.jpg', author: 'Stephen West', license: 'CC BY 2.0' },
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Netsky_%28DJ%29_2008.jpg/1920px-Netsky_%28DJ%29_2008.jpg', page: 'https://commons.wikimedia.org/wiki/File:Netsky_%28DJ%29_2008.jpg', author: 'James Starkey', license: 'CC BY 2.0' },
  ],
  'bass-house': [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/d/dc/Jauz_Tomorrowland_2019_Interview_97.8FM.png', page: 'https://commons.wikimedia.org/wiki/File:Jauz_Tomorrowland_2019_Interview_97.8FM.png', author: '97.8 Dance FM', license: 'CC BY 3.0' },
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/RIE2023Malaa_03.jpg/1920px-RIE2023Malaa_03.jpg', page: 'https://commons.wikimedia.org/wiki/File:RIE2023Malaa_03.jpg', author: 'Selbymay', license: 'CC BY-SA 4.0' },
  ],
  'mainstage-edm': [
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/78/Tomorrowland_2014_-_Main_Stage_%2823168639786%29.jpg/1920px-Tomorrowland_2014_-_Main_Stage_%2823168639786%29.jpg', page: 'https://commons.wikimedia.org/wiki/File:Tomorrowland_2014_-_Main_Stage_%2823168639786%29.jpg', author: 'sergejf', license: 'CC BY 2.0' },
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/ITomorrowland_Main_stage2017.jpg/1920px-ITomorrowland_Main_stage2017.jpg', page: 'https://commons.wikimedia.org/wiki/File:ITomorrowland_Main_stage2017.jpg', author: 'Arroser', license: 'CC BY-SA 4.0' },
  ],
  'bounce': [
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Will_Sparks_%40_Airbeat_One_2018.jpg/1920px-Will_Sparks_%40_Airbeat_One_2018.jpg', page: 'https://commons.wikimedia.org/wiki/File:Will_Sparks_@_Airbeat_One_2018.jpg', author: 'Q1q2q3qwertz', license: 'CC BY-SA 4.0' },
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Tomorrowland_2018_Main_Stage.jpg/1920px-Tomorrowland_2018_Main_Stage.jpg', page: 'https://commons.wikimedia.org/wiki/File:Tomorrowland_2018_Main_Stage.jpg', author: 'Vituhy', license: 'CC BY-SA 4.0' },
  ],
  'psytrance': [
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Boom_Festival_2014_-_photo_by_Jo%C3%A3o_Curiti.jpg/1920px-Boom_Festival_2014_-_photo_by_Jo%C3%A3o_Curiti.jpg', page: 'https://commons.wikimedia.org/wiki/File:Boom_Festival_2014_-_photo_by_Jo%C3%A3o_Curiti.jpg', author: 'Manelmanuel', license: 'CC BY-SA 4.0' },
    { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cd/Vagator%2C_Goa%2C_India%2C_Goa_trance_party.jpg/1920px-Vagator%2C_Goa%2C_India%2C_Goa_trance_party.jpg', page: 'https://commons.wikimedia.org/wiki/File:Vagator,_Goa,_India,_Goa_trance_party.jpg', author: 'Vyacheslav Argenberg', license: 'CC BY 4.0' },
  ],
} satisfies Record<string, Media[]>;

/** The credit a picture carries: its author, linked to its page on Commons, and its licence. */
export const credit = (m: Media, lang: 'vi' | 'en') => `${lang === 'vi' ? 'Ảnh' : 'Photo'}: [${m.author}](${m.page}) · ${m.license} · Wikimedia Commons`;

/** A picture in a post's words, its caption ending with its credit (web/blog/body.tsx draws it). */
export const figure = (m: Media, alt: Localized, caption: Localized, lang: 'vi' | 'en') =>
  `![${alt[lang]}](${m.url} "${caption[lang]} · ${credit(m, lang)}")`;

/** An English Wikipedia article (each one checked to exist on 2026-10-20). */
export const wiki = (title: string) => `https://en.wikipedia.org/wiki/${title.replace(/ /g, '_').replace(/\(/g, '%28').replace(/\)/g, '%29')}`;
/** The site's list of upcoming nights in a style, in the post's language. */
export const nights = (style: string, lang: 'vi' | 'en') => `/?style=${style}${lang === 'en' ? '&lang=en' : ''}`;
/** Another guide of the blog, in the post's language. */
export const guide = (slug: string, lang: 'vi' | 'en') => `/blog/${slug}${lang === 'en' ? '?lang=en' : ''}`;
