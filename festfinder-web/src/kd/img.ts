/**
 * A stored picture, resized: the API's GET /img/<w>x<h>/<key>.webp (festfinder-backend
 * routes/images.ts) makes a WebP copy that covers a box of the ladder below, never cropped or
 * enlarged, kept a year by the browser and the CDN. <key> is the link without its #ff= framing as
 * base64url (lib/remote-image.ts imgKey, the same arithmetic): the framing stays the <img>'s style
 * (frame.ts, whose arithmetic on a link this repeats so as to import nothing). Only an https link a
 * page stores, or an upload (/files/…): an unsaved pasted link is shown as it is, because /img
 * answers only what a row keeps. Pure, server- and browser-safe.
 * A box (`Fit`) carries its own `attrs`, so Art, Avatar and Stamp (ui/parts.tsx, in every screen's
 * bundle) import nothing from here: only a screen that draws a stored picture loads this module.
 * The site's boxes are kd/fits.ts and web/card-fit.ts.
 */

/** The widths a copy comes in (the API's IMG_WIDTHS). */
const WIDTHS = [96, 192, 256, 384, 640, 828, 1080, 1280, 1600, 1920];
/** A box's height over its width (the API's IMG_SHAPES, each exact in binary): square, card 1.6:1, wide 16:9, banner 2:1, strip 4:1. */
const SHAPES = { square: 1, card: 0.625, wide: 0.5625, banner: 0.5, strip: 0.25 };
export type Shape = keyof typeof SHAPES;

type Attrs = { src: string; srcSet?: string; sizes?: string };

/**
 * Where a picture is drawn: the `sizes` of its <img>, the narrowest and widest copy it may need,
 * the shape of its box, and `attrs`, the <img>'s attributes for a stored link drawn there.
 */
export interface Fit { sizes: string; from: number; to: number; shape: Shape; attrs: (url: string, lazy?: boolean) => Attrs }

export function fit(sizes: string, from: number, to: number, shape: Shape): Fit {
  const box: Fit = { sizes, from, to, shape, attrs: (url, lazy) => imgAttrs(url, box, lazy) };
  return box;
}

/** A square box `px` CSS pixels wide (an avatar, a row's picture): copies for one to three device pixels per CSS pixel. */
export const square = (px: number, sizes = px + 'px'): Fit => fit(sizes, px, px * 3, 'square');

/** The smallest width of the ladder that holds `n` pixels (the largest when none does). */
const up = (n: number) => WIDTHS.find((w) => w >= n) ?? 1920;

/**
 * An <img>'s src, srcSet and sizes for a stored picture drawn in `box`; the link alone when /img
 * cannot make copies of it (not https, not an upload), or for an unsaved one (no `box`). A box of
 * 256px or less is a thumbnail, square whatever the box above it (a card becomes an 88px row on a
 * phone). A framing's zoom draws the picture larger than its box, so each width asks for a copy
 * that much wider. `lazy`: Chrome measures the box itself (`sizes="auto"`), the rest read the list.
 */
export function imgAttrs(url: string, box: Fit | null | undefined, lazy = false): Attrs {
  if (!box || !/^(https:\/\/|\/files\/)/i.test(url)) return { src: url };
  let bin = '';
  for (const b of new TextEncoder().encode(url.split('#')[0])) bin += String.fromCharCode(b);
  const key = btoa(bin).replace(/[+/=]/g, (c) => (c == '+' ? '-' : c == '/' ? '_' : ''));
  // The framing's zoom (frame.ts frameOf), 1 to 4.
  const z = Math.min(4, Math.max(1, Number(/#ff=\d{1,3}(?:\.\d+)?,\d{1,3}(?:\.\d+)?,(\d(?:\.\d+)?)$/.exec(url)?.[1] ?? 1)));
  const copy = (w: number) => {
    const c = up(w * z);
    return `/img/${c}x${Math.round(c * (w > 256 ? SHAPES[box.shape] : 1))}/${key}.webp`;
  };
  const widths = WIDTHS.filter((w) => w >= up(box.from) && w <= up(box.to));
  return { src: copy(widths.find((w) => w >= 384) ?? widths[widths.length - 1]), srcSet: widths.map((w) => `${copy(w)} ${w}w`).join(), sizes: lazy ? 'auto,' + box.sizes : box.sizes };
}
