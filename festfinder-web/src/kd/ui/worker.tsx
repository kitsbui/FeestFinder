'use client';
/**
 * Every page installs the service worker (public/sw.js) once the page is idle, so the saved
 * nights open with no signal and an installed app keeps up with each deploy. In the root layout.
 */
import { useEffect } from 'react';

export function Worker() {
  useEffect(() => {
    // Its own chunk, after the page: no page carries the worker's code at boot.
    const go = () => { void import('@/runtime/pwa').then((m) => m.registerWorker()); };
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

/**
 * Chrome's install prompt can come before any of the install code has loaded: this line in the
 * head keeps it (window.__ffInstall) for kd/ui/install.tsx and runtime/pwa.ts.
 */
const CAPTURE = "addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__ffInstall=e;dispatchEvent(new Event('ff:installable'))});";
export function InstallCapture() {
  return <script dangerouslySetInnerHTML={{ __html: CAPTURE }} />;
}
