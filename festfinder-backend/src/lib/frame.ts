/*
 * A picture's framing travels in its link, as a fragment: `#ff=<x>,<y>,<zoom>`. x and y are the
 * point to keep in view, in percent of the width and height; zoom is from 1 (the whole picture
 * fills the box) to 4. Every screen draws a picture with object-fit: cover around that point
 * (festfinder-web/src/kd/frame.ts), so one framing fits a wide cover, a card, a square and a
 * round avatar. A browser never sends a fragment, so the host serves the same file; whatever
 * checks or compares a link (the link check, the weekly recheck, uploads, SEO) uses its base.
 */

const FRAME = /#ff=(\d{1,3}(?:\.\d+)?),(\d{1,3}(?:\.\d+)?),(\d(?:\.\d+)?)$/;

export interface Frame { x: number; y: number; z: number }

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

/** The link without any fragment: what is fetched, checked and compared. */
export const baseOf = (url: string): string => url.replace(/#.*$/s, '');

/** The framing a link carries, or null (the centre, whole). */
export function frameOf(url: string | null | undefined): Frame | null {
  const m = url ? FRAME.exec(url) : null;
  if (!m) return null;
  return { x: clamp(round(Number(m[1]), 1), 0, 100), y: clamp(round(Number(m[2]), 1), 0, 100), z: clamp(round(Number(m[3]), 2), 1, 4) };
}

/** The fragment for a framing; empty for the default (centre, zoom 1). */
export function frameFragment(f: Frame | null): string {
  if (!f || (f.x === 50 && f.y === 50 && f.z === 1)) return '';
  return `#ff=${f.x},${f.y},${f.z}`;
}

/** A link with only FeestFinder's framing as its fragment, in its one spelling. */
export const withFrame = (base: string, f: Frame | null): string => baseOf(base) + frameFragment(f);

/** Whether a fragment, if there is one, is a framing (anything else is not ours to keep). */
export const fragmentIsFrame = (url: string): boolean => !url.includes('#') || FRAME.test(url);
