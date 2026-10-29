/**
 * The boxes the site's pages draw stored pictures in (kd/img.ts imgAttrs), from their CSS (kd.css,
 * theme.css): a module of its own, so the parts every screen loads (Art, Avatar) carry only the
 * arithmetic. An event card's boxes are web/card-fit.ts, a photo in a grid's ui/moments.tsx (MOMENT).
 */
import { fit } from './img';

export const FIT = {
  /** A square card in the artist directory: two to a row on a phone. */
  tile: fit('(max-width: 759px) 50vw, 260px', 192, 828, 'square'),
  /** The event page's 16:9 hero: the width on a phone, half of it from 900px. */
  hero: fit('(min-width: 900px) 50vw, 100vw', 640, 1920, 'wide'),
  /** A 16:9 picture in the reading column (a post's cover and pictures; --container-read is 760px). */
  read: fit('(min-width: 792px) 760px, 100vw', 384, 1600, 'wide'),
  /** Across the page, about 2:1 (an artist's cover, a project's). */
  banner: fit('100vw', 640, 1920, 'banner'),
  /** Across the page, about 4:1 or flatter (an organiser's banner). */
  strip: fit('100vw', 640, 1920, 'strip'),
};
