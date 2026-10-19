'use client';
/** The framing sheet of a picture (design v2 phase 16: loaded when it opens, never with the page). */
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { CropIcon } from '@phosphor-icons/react/ssr';
import { pick, type Lang } from '../copy';
import { cx } from '../cx';
import { CENTRE, frameOf, frameStyle, MAX_ZOOM, withFrame, type Frame } from '../frame';
import { Button } from './actions';
import { Sheet } from './sheet';
import { COPY, FramedThumb, SHAPE, type FrameShape } from './frame-editor';

export function FrameEditor({ lang, src, shapes, onClose, onDone }: {
  lang: Lang; src: string; shapes: FrameShape[]; onClose: () => void; onDone: (url: string) => void;
}) {
  const T = pick(COPY, lang);
  const [f, setF] = useState<Frame>(() => frameOf(src) ?? CENTRE);
  const stage = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const preview = withFrame(src, f);

  const moveTo = (e: PointerEvent<HTMLDivElement>) => {
    const box = stage.current?.querySelector('img')?.getBoundingClientRect();
    if (!box || !box.width || !box.height) return;
    const x = ((e.clientX - box.left) / box.width) * 100;
    const y = ((e.clientY - box.top) / box.height) * 100;
    setF((cur) => ({ ...cur, x: Math.round(Math.min(100, Math.max(0, x))), y: Math.round(Math.min(100, Math.max(0, y))) }));
  };
  const nudge = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    setF((cur) => ({ ...cur, x: Math.min(100, Math.max(0, cur.x + d[0])), y: Math.min(100, Math.max(0, cur.y + d[1])) }));
  };

  return (
    <Sheet title={T.title} closeLabel={T.close} onClose={onClose} wide>
      <div className="flex flex-col gap-5 pt-2">
        <div className="grid gap-5 tab:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* The whole picture, its point marked. */}
          <div
            ref={stage}
            role="slider"
            tabIndex={0}
            aria-label={T.point}
            aria-valuetext={`${Math.round(f.x)}% · ${Math.round(f.y)}%`}
            aria-valuenow={Math.round(f.x)}
            className="relative flex cursor-crosshair touch-none select-none items-center justify-center rounded-card bg-surface-2 p-2 outline-none focus-visible:shadow-[0_0_0_2px_var(--color-lime)]"
            onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); moveTo(e); }}
            onPointerMove={(e) => { if (dragging.current) moveTo(e); }}
            onPointerUp={() => { dragging.current = false; }}
            onPointerCancel={() => { dragging.current = false; }}
            onKeyDown={nudge}
          >
            <span className="relative inline-block max-h-[52vh] max-w-full">
                      <img src={src} alt="" referrerPolicy="no-referrer" draggable={false} className="block max-h-[52vh] max-w-full rounded-seg" />
              <span aria-hidden="true" className="pointer-events-none absolute inset-0">
                <span
                  className="absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-info bg-info/30 shadow-[0_0_0_2px_rgb(0_0_0/0.6)]"
                  style={{ left: `${f.x}%`, top: `${f.y}%` }}
                />
              </span>
            </span>
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {shapes.map((s) => (
                <div key={s} className={cx('flex min-w-0 flex-col gap-1.5', s === 'banner' && 'col-span-2')}>
                  <FramedThumb src={preview} className={SHAPE[s]} />
                  <span className="kd-m">{T[s]}</span>
                </div>
              ))}
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="kd-hs flex justify-between">{T.zoom}<span className="kd-num kd-s">{f.z.toFixed(1)}×</span></span>
              <input
                type="range" min={1} max={MAX_ZOOM} step={0.05} value={f.z}
                onChange={(e) => setF((cur) => ({ ...cur, z: Number(e.target.value) }))}
                className="w-full accent-info"
              />
            </label>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button tone="ghost" onClick={() => setF(CENTRE)}>{T.reset}</Button>
          <Button tone="acc" onClick={() => onDone(withFrame(src, f))}>{T.done}</Button>
        </div>
      </div>
    </Sheet>
  );
}
