/**
 * A picture's framing, kept in its link as `#ff=<x>,<y>,<zoom>` (festfinder-backend
 * src/lib/frame.ts): the point to keep in view, in percent, and a zoom from 1 to 4. Drawn with
 * object-fit: cover around that point, one framing suits a wide cover, a card, a square and a
 * round avatar. The browser never sends the fragment, so the image loads as before.
 */
import type { CSSProperties } from 'react';

export interface Frame { x: number; y: number; z: number }

export const CENTRE: Frame = { x: 50, y: 50, z: 1 };
export const MAX_ZOOM = 3;

const FRAME = /#ff=(\d{1,3}(?:\.\d+)?),(\d{1,3}(?:\.\d+)?),(\d(?:\.\d+)?)$/;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** The link without its fragment: what is shown in a field and sent to be checked. */
export const baseOf = (url: string): string => url.replace(/#.*$/s, '');

export function frameOf(url: string | null | undefined): Frame | null {
  const m = url ? FRAME.exec(url) : null;
  if (!m) return null;
  return { x: clamp(Number(m[1]), 0, 100), y: clamp(Number(m[2]), 0, 100), z: clamp(Number(m[3]), 1, 4) };
}

/** The link with this framing (none for the centre at zoom 1), rounded as the API keeps it. */
export function withFrame(url: string, f: Frame): string {
  const x = Math.round(clamp(f.x, 0, 100) * 10) / 10;
  const y = Math.round(clamp(f.y, 0, 100) * 10) / 10;
  const z = Math.round(clamp(f.z, 1, 4) * 100) / 100;
  return baseOf(url) + (x === 50 && y === 50 && z === 1 ? '' : `#ff=${x},${y},${z}`);
}

/** The style that draws an <img> (already object-fit: cover, filling its box) with its framing. */
export function frameStyle(url: string | null | undefined): CSSProperties | undefined {
  const f = frameOf(url);
  if (!f) return undefined;
  const at = `${f.x}% ${f.y}%`;
  return { objectPosition: at, transformOrigin: at, transform: f.z > 1 ? `scale(${f.z})` : undefined };
}
