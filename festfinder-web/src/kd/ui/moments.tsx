'use client';
/**
 * Moments: up to nine pictures in a 3×3 grid; the owner sees a dashed "+ Thêm" tile while
 * there is room. A tile opens the lightbox: glass controls, previous and next, "i / n", and
 * for the owner "Xoá ảnh". Arrow keys move, Escape closes.
 */
import { useEffect, useRef, useState } from 'react';
import { CaretLeftIcon, CaretRightIcon, PlusIcon, TrashIcon, XIcon } from '@phosphor-icons/react/ssr';
import { familyOf } from '../genre';
import { Art } from './parts';

export interface Moment { id: string; url: string | null; caption?: string | null; genre?: string | null; takenOn?: string | null }

export const MOMENTS_MAX = 9;

export function MomentsGrid({ items, owner, onAdd, onRemove, labels }: {
  items: Moment[];
  owner?: boolean;
  onAdd?: () => void;
  onRemove?: (m: Moment) => void;
  labels: { add: string; open: string; close: string; prev: string; next: string; remove: string };
}) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <div className="kd-mgrid">
        {items.slice(0, MOMENTS_MAX).map((m, i) => (
          <button key={m.id} type="button" className="kd-mtile" aria-label={m.caption ? `${labels.open}: ${m.caption}` : labels.open} onClick={() => setOpen(i)}>
            {m.url ? (
              // eslint-disable-next-line @next/next/no-img-element -- uploaded files from the API's storage
              <img src={m.url} alt={m.caption ?? ''} loading="lazy" />
            ) : (
              <Art family={familyOf(m.genre)} bone={i % 2 === 1} />
            )}
          </button>
        ))}
        {owner && items.length < MOMENTS_MAX && onAdd ? (
          <button type="button" className="kd-mplus" onClick={onAdd}>
            <PlusIcon size={20} aria-hidden="true" />
            <span className="kd-s">{labels.add}</span>
          </button>
        ) : null}
      </div>
      {open != null && items[open] ? (
        <Lightbox
          items={items}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          onRemove={owner && onRemove ? (m) => { onRemove(m); setOpen(null); } : undefined}
          labels={labels}
        />
      ) : null}
    </>
  );
}

function Lightbox({ items, index, onIndex, onClose, onRemove, labels }: {
  items: Moment[]; index: number; onIndex: (i: number) => void; onClose: () => void; onRemove?: (m: Moment) => void;
  labels: { close: string; prev: string; next: string; remove: string };
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const n = items.length;
  const m = items[index];
  useEffect(() => { ref.current?.showModal(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onIndex((index + 1) % n);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + n) % n);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, n, onIndex]);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      className="kd-sheet m-0 h-dvh max-h-none w-screen max-w-none bg-void p-0"
      aria-label={m.caption ?? `${index + 1} / ${n}`}
    >
      <div className="relative flex h-full w-full items-center justify-center">
        {m.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- uploaded files from the API's storage
          <img src={m.url} alt={m.caption ?? ''} className="max-h-full max-w-full object-contain" />
        ) : (
          <Art family={familyOf(m.genre)} className="aspect-square w-[min(90vw,90vh)]" />
        )}
        <div className="absolute inset-x-0 top-0 flex items-center gap-2 p-3">
          <span className="kd-tag kd-tag-glass kd-num">{index + 1} / {n}</span>
          <span className="flex-1" />
          {onRemove ? (
            <button type="button" className="kd-btn kd-btn-sm kd-btn-glass" onClick={() => onRemove(m)}>
              <TrashIcon size={16} aria-hidden="true" />
              {labels.remove}
            </button>
          ) : null}
          <button type="button" className="kd-ib kd-glass" aria-label={labels.close} onClick={onClose} autoFocus>
            <XIcon size={20} aria-hidden="true" />
          </button>
        </div>
        {n > 1 ? (
          <>
            <button type="button" className="kd-ib kd-glass absolute left-3 top-1/2 -translate-y-1/2" aria-label={labels.prev} onClick={() => onIndex((index - 1 + n) % n)}>
              <CaretLeftIcon size={20} aria-hidden="true" />
            </button>
            <button type="button" className="kd-ib kd-glass absolute right-3 top-1/2 -translate-y-1/2" aria-label={labels.next} onClick={() => onIndex((index + 1) % n)}>
              <CaretRightIcon size={20} aria-hidden="true" />
            </button>
          </>
        ) : null}
        {m.caption || m.takenOn ? (
          <div className="kd-glass absolute inset-x-3 bottom-3 flex flex-col gap-1 rounded-card p-3">
            {m.takenOn ? <span className="kd-m">{m.takenOn}</span> : null}
            {m.caption ? <span className="kd-t text-paper">{m.caption}</span> : null}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
