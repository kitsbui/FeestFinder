'use client';
/**
 * A cover that does not load leaves the art it sits on (ui/parts.tsx, Art) instead of the
 * browser's broken-image icon: covers of events Feest Radar found come from other sites,
 * which move or block them. The same for linked photos (avatars, moments): they are links to
 * other sites too, and the initials or the art under them show instead. One listener for every page, so Art stays a server part: the error
 * of an <img> does not bubble, but a capturing listener on the document hears it, and the covers
 * that failed before this ran are found by looking.
 */
import { useEffect } from 'react';

const broken = (img: HTMLImageElement) => img.setAttribute('data-broken', '');
const LINKED = 'img.kd-cover, .kd-av img, .kd-mtile img, .kd-fthumb img';
/** The eager picture's inlined copy (Art `inline`): once painted, and the page loaded, the ladder's preloaded copy takes its place (no larger: the first paint stays the largest contentful paint). */
const INLINED = 'img[data-srcset][src^="data:"]';
const swap = (img: HTMLImageElement) => { img.sizes = img.dataset.sizes ?? ''; img.srcset = img.dataset.srcset ?? ''; img.src = img.dataset.src ?? img.src; };
const painted = (f: () => void) => {
  const go = () => requestAnimationFrame(() => requestAnimationFrame(f));
  if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
};

export function BrokenCovers() {
  useEffect(() => {
    const onError = (e: Event) => {
      const img = e.target;
      if (img instanceof HTMLImageElement && img.matches(LINKED)) broken(img);
    };
    // An inlined copy decoded after this ran (a page opened from another): the swap, once it is painted.
    const onLoad = (e: Event) => {
      const img = e.target;
      if (img instanceof HTMLImageElement && img.matches(INLINED)) painted(() => swap(img));
    };
    document.addEventListener('error', onError, true);
    document.addEventListener('load', onLoad, true);
    document.querySelectorAll<HTMLImageElement>(LINKED).forEach((img) => { if (img.complete && !img.naturalWidth && img.currentSrc) broken(img); });
    document.querySelectorAll<HTMLImageElement>(INLINED).forEach((img) => { if (img.complete) painted(() => swap(img)); });
    return () => { document.removeEventListener('error', onError, true); document.removeEventListener('load', onLoad, true); };
  }, []);
  return null;
}
