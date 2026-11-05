'use client';
/**
 * The page's eager picture when the server inlined a small copy of it (lib/api.ts inlineCover,
 * Art `inline`): the HTML draws that copy, so it is on screen at the first paint; the ladder's copy,
 * preloaded with the page, takes its place once the inlined one is painted and the page loaded (and
 * after a client navigation, when this mounts). Chrome keeps the first paint as the largest
 * contentful paint (the later picture is no larger), and the copy a visitor keeps is the same as
 * before. Only a page with an inlined picture mounts this; a listener on the document for every
 * page cost every screen main-thread time in the perf check (2026-11-05).
 */
import { useEffect, useRef, type ImgHTMLAttributes } from 'react';
import { preload } from 'react-dom';

export function LqCover({ inline, src, srcSet, sizes, ...rest }: ImgHTMLAttributes<HTMLImageElement> & { inline: string; src: string }) {
  const ref = useRef<HTMLImageElement>(null);
  // React preloads no data URI (its own rule), so the ladder's copy is asked for here, with the page.
  preload(src, { as: 'image', imageSrcSet: srcSet, imageSizes: sizes, fetchPriority: 'high' });
  useEffect(() => {
    const img = ref.current;
    if (!img) return;
    let frame = 0;
    const swap = () => { img.sizes = sizes ?? ''; img.srcset = srcSet ?? ''; img.src = src; };
    // Two frames on: the inlined copy has been painted (and measured) before the ladder's replaces it.
    const go = () => { frame = requestAnimationFrame(() => { frame = requestAnimationFrame(swap); }); };
    if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
    return () => { cancelAnimationFrame(frame); removeEventListener('load', go); };
  }, [src, srcSet, sizes]);
  return <img ref={ref} {...rest} src={inline} data-src={src} data-srcset={srcSet} data-sizes={sizes} />;
}
