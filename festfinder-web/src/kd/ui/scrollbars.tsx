'use client';
/**
 * Scrollbars that take no room: kd.css hides the browser's own everywhere, and this draws a
 * hairline thumb over whatever is scrolling (the page, a list column, a table, a sheet), only
 * while it scrolls. It fades out a moment after the scrolling stops. With a mouse, coming near
 * a scrollable edge brings it back, it thickens under the pointer and can be dragged; on touch
 * it is only an indicator.
 *
 * The thumbs live in a layer (<ff-scrollbars>) over the whole screen: one that is a manual
 * popover, so it sits in the top layer, and shown again (on top) when scrolling starts; and, for
 * a box inside an open sheet or drawer, one inside that <dialog>, since a modal dialog makes
 * everything outside it inert (the thumb would show there but not drag).
 */
import { useEffect, useRef } from 'react';

/** How long a thumb stays after the last scroll. */
const IDLE = 600;
/** The shortest a thumb gets. */
const MIN = 28;
/** Room left at each end of the edge. */
const PAD = 3;
/** The width of a thumb's grip (the visible bar inside it is 3px, 6px under the pointer). */
const GRIP = 12;
/** How near an edge the mouse brings the thumb back. */
const NEAR = 16;

interface Track { el: HTMLElement; layer: HTMLElement; y: HTMLElement; x: HTMLElement; timer: number; on: boolean; held: boolean }

export function Scrollbars() {
  const layer = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = layer.current;
    if (!root || typeof root.showPopover !== 'function') return;
    const tracks = new Map<HTMLElement, Track>();
    const page = () => (document.scrollingElement ?? document.documentElement) as HTMLElement;
    let frame = 0;

    /** On top of the top layer (a sheet may have opened since). */
    const raise = () => {
      try { if (root.matches(':popover-open')) root.hidePopover(); root.showPopover(); } catch { /* not in the page any more */ }
    };

    /** Where the scrolled box is on screen, inside its borders. */
    const box = (el: HTMLElement) => {
      if (el === page()) return { top: 0, left: 0, width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
      const r = el.getBoundingClientRect();
      return { top: r.top + el.clientTop, left: r.left + el.clientLeft, width: el.clientWidth, height: el.clientHeight };
    };

    /** Where a box's thumbs go: read in one pass, written in another, so layout is read once. */
    type Spot = { len: number; x: number; y: number } | null;
    const measure = (t: Track): [Spot, Spot] => {
      const el = t.el;
      if (!el.isConnected) return [null, null];
      const b = box(el);
      // A layer inside a dialog starts where the dialog puts it (a transform moves it).
      if (t.layer !== root) { const o = t.layer.getBoundingClientRect(); b.top -= o.top; b.left -= o.left; }
      const sh = el.scrollHeight, sw = el.scrollWidth;
      let y: Spot = null, x: Spot = null;
      if (sh > b.height + 1 && b.height > MIN * 2) {
        const room = b.height - PAD * 2;
        const len = Math.max(MIN, (room * b.height) / sh);
        y = { len, x: b.left + b.width - GRIP, y: b.top + PAD + ((room - len) * el.scrollTop) / Math.max(1, sh - b.height) };
      }
      if (sw > b.width + 1 && b.width > MIN * 2) {
        const room = b.width - PAD * 2;
        const len = Math.max(MIN, (room * b.width) / sw);
        x = { len, x: b.left + PAD + ((room - len) * Math.abs(el.scrollLeft)) / Math.max(1, sw - b.width), y: b.top + b.height - GRIP };
      }
      return [y, x];
    };
    const apply = (t: Track, [y, x]: [Spot, Spot]) => {
      t.y.hidden = !y;
      if (y) { t.y.style.height = `${y.len}px`; t.y.style.transform = `translate(${y.x}px, ${y.y}px)`; }
      t.x.hidden = !x;
      if (x) { t.x.style.width = `${x.len}px`; t.x.style.transform = `translate(${x.x}px, ${x.y}px)`; }
    };
    const place = (t: Track) => apply(t, measure(t));

    /** Every thumb on screen follows (an inner box moves when the page scrolls). */
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const on = [...tracks.values()].filter((t) => t.on);
        const spots = on.map(measure);
        on.forEach((t, i) => apply(t, spots[i]));
      });
    };

    const hide = (t: Track) => {
      if (t.held) return;
      t.on = false;
      t.y.classList.remove('on');
      t.x.classList.remove('on');
      if (!t.el.isConnected) { t.y.remove(); t.x.remove(); tracks.delete(t.el); }
    };

    const show = (t: Track) => {
      if (!t.on) {
        if (t.layer === root && ![...tracks.values()].some((o) => o.on && o.layer === root)) raise();
        t.on = true;
        place(t);
        t.y.classList.add('on');
        t.x.classList.add('on');
      }
      clearTimeout(t.timer);
      t.timer = window.setTimeout(() => hide(t), IDLE);
    };

    const drag = (t: Track, thumb: HTMLElement, axis: 'x' | 'y') => {
      thumb.addEventListener('pointerenter', () => { t.held = true; clearTimeout(t.timer); });
      thumb.addEventListener('pointerleave', () => {
        if (thumb.classList.contains('drag')) return;
        t.held = false;
        t.timer = window.setTimeout(() => hide(t), IDLE);
      });
      thumb.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        thumb.setPointerCapture(e.pointerId);
        thumb.classList.add('drag');
        const el = t.el, b = box(el);
        const from = axis === 'y' ? e.clientY : e.clientX;
        const start = axis === 'y' ? el.scrollTop : el.scrollLeft;
        const size = axis === 'y' ? b.height : b.width;
        const total = axis === 'y' ? el.scrollHeight : el.scrollWidth;
        const len = Math.max(MIN, ((size - PAD * 2) * size) / total);
        const ratio = (total - size) / Math.max(1, size - PAD * 2 - len);
        const move = (m: PointerEvent) => {
          const by = ((axis === 'y' ? m.clientY : m.clientX) - from) * ratio;
          if (axis === 'y') el.scrollTop = start + by; else el.scrollLeft = start + by;
        };
        const up = () => {
          thumb.classList.remove('drag');
          thumb.removeEventListener('pointermove', move);
          thumb.removeEventListener('pointerup', up);
          thumb.removeEventListener('pointercancel', up);
          if (!thumb.matches(':hover')) { t.held = false; t.timer = window.setTimeout(() => hide(t), IDLE); }
        };
        thumb.addEventListener('pointermove', move);
        thumb.addEventListener('pointerup', up);
        thumb.addEventListener('pointercancel', up);
      });
    };

    /** The layer a box's thumbs go in: its open dialog's own, or the top one. */
    const layerFor = (el: HTMLElement): HTMLElement => {
      const d = el.closest('dialog[open]');
      if (!d) return root;
      let l = d.querySelector<HTMLElement>(':scope > ff-scrollbars');
      if (!l) { l = document.createElement('ff-scrollbars'); l.setAttribute('aria-hidden', 'true'); d.append(l); }
      return l;
    };

    const track = (el: HTMLElement): Track => {
      let t = tracks.get(el);
      if (t && t.layer.isConnected) return t;
      if (t) { t.y.remove(); t.x.remove(); }
      const layer = layerFor(el);
      const y = document.createElement('i');
      const x = document.createElement('i');
      y.className = 'ff-sb ff-sb-y';
      x.className = 'ff-sb ff-sb-x';
      y.hidden = x.hidden = true;
      layer.append(y, x);
      t = { el, layer, y, x, timer: 0, on: false, held: false };
      tracks.set(el, t);
      drag(t, y, 'y');
      drag(t, x, 'x');
      return t;
    };

    const onScroll = (e: Event) => {
      const target = e.target === document ? page() : (e.target as HTMLElement);
      if (!(target instanceof HTMLElement)) return;
      // MapLibre's canvas container and the like never scroll; anything else that does gets a thumb.
      show(track(target));
      update();
    };

    /** The scrollable box under the pointer whose edge it is near, if any. */
    const nearEdge = (e: PointerEvent): HTMLElement | null => {
      const de = document.documentElement;
      if (e.clientX >= de.clientWidth - NEAR && page().scrollHeight > de.clientHeight + 1) return page();
      let el = e.target instanceof Element ? e.target as HTMLElement : null;
      for (let i = 0; el && el !== document.body && i < 12; i++, el = el.parentElement) {
        if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1 && e.clientX >= r.right - NEAR) return el;
          if (/(auto|scroll)/.test(s.overflowX) && el.scrollWidth > el.clientWidth + 1 && e.clientY >= r.bottom - NEAR) return el;
        }
      }
      return null;
    };
    let pending: PointerEvent | null = null;
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.buttons) return;
      if (pending) { pending = e; return; }
      pending = e;
      requestAnimationFrame(() => {
        const ev = pending!;
        pending = null;
        const el = nearEdge(ev);
        if (el) show(track(el));
      });
    };

    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    document.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true });
      document.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', update);
      if (frame) cancelAnimationFrame(frame);
      for (const t of tracks.values()) clearTimeout(t.timer);
      root.replaceChildren();
      document.querySelectorAll('dialog > ff-scrollbars').forEach((l) => l.remove());
    };
  }, []);

  return <ff-scrollbars ref={layer} popover="manual" aria-hidden="true" />;
}
