'use client';
/**
 * A cover that does not load leaves the art it sits on (ui/parts.tsx, Art) instead of the
 * browser's broken-image icon: covers of events FeestFinder Radar found come from other sites,
 * which move or block them. One listener for every page, so Art stays a server part: the error
 * of an <img> does not bubble, but a capturing listener on the document hears it, and the covers
 * that failed before this ran are found by looking.
 */
import { useEffect } from 'react';

const broken = (img: HTMLImageElement) => img.setAttribute('data-broken', '');

export function BrokenCovers() {
  useEffect(() => {
    const onError = (e: Event) => {
      const img = e.target;
      if (img instanceof HTMLImageElement && img.classList.contains('kd-cover')) broken(img);
    };
    document.addEventListener('error', onError, true);
    document.querySelectorAll<HTMLImageElement>('img.kd-cover').forEach((img) => { if (img.complete && !img.naturalWidth && img.currentSrc) broken(img); });
    return () => document.removeEventListener('error', onError, true);
  }, []);
  return null;
}
