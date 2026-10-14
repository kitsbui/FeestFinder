'use client';
/**
 * One short message at the bottom of the screen, with an optional action (Hoàn tác). It is a
 * manual popover, so it shows in the top layer: above an open drawer or dialog too.
 */
import { useEffect, useLayoutEffect, useRef } from 'react';
import { XIcon } from '@phosphor-icons/react/ssr';
import type { ToastMsg } from '../runtime';

export function Toast({ msg, onDone, closeLabel }: { msg: ToastMsg | null; onDone: () => void; closeLabel: string }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, msg.action ? 6000 : 3200);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  const box = useRef<HTMLDivElement>(null);
  // Shown afresh for each message, so it lands above whatever opened since the last one.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el || typeof el.showPopover !== 'function') return;
    try { if (el.matches(':popover-open')) el.hidePopover(); el.showPopover(); } catch { /* already gone */ }
  }, [msg]);
  return (
    <div role="status" aria-live="polite" className="contents">
      {msg ? (
        <div key={msg.id} ref={box} popover="manual" className="kd-toast kd-glass">
          <span className="min-w-0">{msg.text}</span>
          {msg.action ? (
            <button type="button" className="kd-btn kd-btn-sm kd-btn-ghost text-acc" onClick={() => { msg.action!.run(); onDone(); }}>
              {msg.action.label}
            </button>
          ) : null}
          <button type="button" className="kd-ib kd-ib-sm" aria-label={closeLabel} onClick={onDone}>
            <XIcon size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
