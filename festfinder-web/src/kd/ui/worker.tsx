'use client';
/**
 * Every page installs the service worker (public/sw.js) once the page is idle, so the saved
 * nights open with no signal and an installed app keeps up with each deploy. In the root layout.
 */
import { useEffect } from 'react';
import { registerWorker } from '@/runtime/pwa';

export function Worker() {
  useEffect(() => {
    const go = () => { registerWorker(); };
    // Safari has no requestIdleCallback: a moment after the page, then.
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback && w.cancelIdleCallback) {
      const id = w.requestIdleCallback(go, { timeout: 4000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(go, 1500);
    return () => clearTimeout(t);
  }, []);
  return null;
}
