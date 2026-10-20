'use client';
/**
 * The phone's room for the page (owner, 2026-10-20):
 * - Scrolling down hides the frame (the nav on top, the tab bar and the install strip below; the
 *   event page's "Mua vé" bar drops to the bottom edge, still within reach); scrolling up, the top
 *   of the page or a focus inside the frame brings it back. `<html data-chrome-away>`, read by
 *   kd.css below 900px; transforms only, so nothing on the page moves.
 * - The first tap on a page asks the browser for full screen (Android's Chrome and the like; an
 *   iPhone has no full screen for a page, where Safari folds its own bars as the page scrolls).
 *   Browsers grant it only on a tap, never on load. Leaving it on purpose stops it for the visit
 *   (`ff:fullscreen` in sessionStorage); an installed app is already full screen.
 * Neither runs under automation (`navigator.webdriver`), so the screen checks see the frame still.
 */
import { useEffect } from 'react';

const PHONE = '(max-width: 899px) and (pointer: coarse)';
const INSTALLED = '(display-mode: standalone), (display-mode: fullscreen)';
const FS_KEY = 'ff:fullscreen';
/** Pixels scrolled before the frame changes, so a finger's wobble does nothing. */
const STEP = 8;
/** Below this the frame always shows: the page's top is its own. */
const TOP = 64;

const automated = () => typeof navigator !== 'undefined' && navigator.webdriver === true;

export function Immersive() {
  useEffect(() => {
    if (automated()) return;
    const root = document.documentElement;
    let last = window.scrollY;
    let frame = 0;
    const set = (away: boolean) => {
      if (away === root.hasAttribute('data-chrome-away')) return;
      if (away) root.setAttribute('data-chrome-away', '');
      else root.removeAttribute('data-chrome-away');
    };
    const read = () => {
      frame = 0;
      const y = window.scrollY;
      const dy = y - last;
      if (y < TOP) set(false);
      else if (Math.abs(dy) < STEP) return;
      else set(dy > 0 && matchMedia(PHONE).matches);
      last = y;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
      set(false);
    };
  }, []);

  useEffect(() => {
    if (automated() || window.self !== window.top) return;
    if (!matchMedia(PHONE).matches || matchMedia(INSTALLED).matches) return;
    const root = document.documentElement;
    if (!root.requestFullscreen || document.fullscreenEnabled === false) return;
    const remembered = () => { try { return sessionStorage.getItem(FS_KEY); } catch { return null; } };
    const remember = (v: string) => { try { sessionStorage.setItem(FS_KEY, v); } catch { /* storage blocked */ } };
    if (remembered() === 'off') return;
    let ours = false;
    const onTap = () => {
      if (document.fullscreenElement || remembered() === 'off') return;
      root.requestFullscreen({ navigationUI: 'hide' }).then(() => { ours = true; remember('on'); }).catch(() => { /* refused: the page stays as it is */ });
    };
    // Left while the page is on screen: the person chose to, so this visit asks no more.
    const onChange = () => {
      if (document.fullscreenElement || !ours || document.visibilityState !== 'visible') return;
      ours = false;
      remember('off');
      document.removeEventListener('click', onTap, true);
    };
    document.addEventListener('click', onTap, true);
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('click', onTap, true);
      document.removeEventListener('fullscreenchange', onChange);
    };
  }, []);

  return null;
}
