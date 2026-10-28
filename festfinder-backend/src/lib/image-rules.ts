import { badRequest } from './errors.ts';
import { L } from './i18n.ts';

/**
 * What each kind of image must measure, for uploads (event media) and linked images alike.
 *
 *   cover          an event's cover: 16:9, 1600×900 or larger (uploaded)
 *   logo           an event's or an organiser's logo
 *   avatar         a person's or an artist's photo
 *   profile_cover  the banner of an artist, an organiser or a project: landscape, 1200 wide or more
 *   moment         a photo on a profile
 *   recap          a photo a fan took at an event (uploaded)
 *   news           the picture of a headline on the news feed (a feed's, or an article's preview): 300 wide or more, landscape or square
 */
export const IMAGE_PURPOSES = ['cover', 'logo', 'avatar', 'profile_cover', 'moment', 'recap', 'news'] as const;
export type ImagePurpose = (typeof IMAGE_PURPOSES)[number];

export function checkDimensions(purpose: ImagePurpose, w: number, h: number) {
  if (purpose === 'cover') {
    if (w < 1600 || h < 900 || Math.abs(w / h - 16 / 9) > 0.01) {
      throw badRequest('cover_size', L('Use a landscape image of at least 1600×900 (16:9)', 'Dùng ảnh ngang tối thiểu 1600×900 (16:9)'), { width: w, height: h });
    }
  }
  if (purpose === 'profile_cover' && (w < 1200 || w <= h)) {
    throw badRequest('cover_size', L('Use a landscape image at least 1200 pixels wide', 'Dùng ảnh ngang rộng tối thiểu 1200 điểm ảnh'), { width: w, height: h });
  }
  if (purpose === 'logo' && (w < 256 || h < 256)) {
    throw badRequest('logo_size', L('Logos need to be at least 256×256', 'Logo cần tối thiểu 256×256'), { width: w, height: h });
  }
  if (purpose === 'moment' && Math.min(w, h) < 400) {
    throw badRequest('moment_size', L('Photos need to be at least 400 pixels on the short side', 'Ảnh cần tối thiểu 400 điểm ảnh ở cạnh ngắn'), { width: w, height: h });
  }
  if (purpose === 'news' && (w < 300 || h < 150 || h > w * 1.25)) {
    throw badRequest('news_image_size', L('Not a picture to show with a headline', 'Không phải ảnh minh hoạ cho tin'), { width: w, height: h });
  }
  if (purpose === 'avatar' && (w < 128 || h < 128)) {
    throw badRequest('avatar_size', L('Photos need to be at least 128×128', 'Ảnh cần tối thiểu 128×128'), { width: w, height: h });
  }
}
