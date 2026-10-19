'use client';
import dynamic from 'next/dynamic';
/**
 * Framing a picture: the point to keep in view and how close, saved in the picture's link
 * (kd/frame.ts). The whole picture is shown with that point marked; a tap or a drag moves it,
 * the arrow keys nudge it, the slider zooms. Beside it, the picture as each place shows it:
 * a wide cover, a card, a square, a round avatar.
 */
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { CropIcon } from '@phosphor-icons/react/ssr';
import { pick, type Lang } from '../copy';
import { cx } from '../cx';
import { CENTRE, frameOf, frameStyle, MAX_ZOOM, withFrame, type Frame } from '../frame';
import { Button } from './actions';
import { Sheet } from './sheet';

export type FrameShape = 'banner' | 'card' | 'square' | 'round';

export const COPY = {
  frame: { en: 'Frame', vi: 'Căn khung' },
  title: { en: 'Frame the picture', vi: 'Căn khung ảnh' },
  point: { en: 'Point to keep in view', vi: 'Tâm ảnh' },
  zoom: { en: 'Zoom', vi: 'Thu phóng' },
  reset: { en: 'Reset', vi: 'Đặt lại' },
  done: { en: 'Done', vi: 'Xong' },
  close: { en: 'Close', vi: 'Đóng' },
  banner: { en: 'Cover', vi: 'Ảnh bìa' },
  card: { en: 'Card', vi: 'Thẻ' },
  square: { en: 'Square', vi: 'Vuông' },
  round: { en: 'Avatar', vi: 'Đại diện' },
};

export const SHAPE: Record<FrameShape, string> = {
  banner: 'aspect-[3/1] w-full rounded-md',
  card: 'aspect-[16/10] w-full rounded-md',
  square: 'aspect-square w-full rounded-md',
  round: 'aspect-square w-full rounded-full',
};

/** A small picture drawn with its framing, clipped to its box (previews in forms and here). */
export function FramedThumb({ src, className, alt = '' }: { src: string; className?: string; alt?: string }) {
  return (
    <span className={cx('kd-fthumb relative block shrink-0 overflow-hidden bg-surface-2', className)}>
      <img src={src} alt={alt} referrerPolicy="no-referrer" className="absolute inset-0 size-full object-cover" style={frameStyle(src)} />
    </span>
  );
}

/** The "Căn khung" button and its sheet. `value` is the link as saved; `onChange` gets it framed. */
export function FrameButton({ lang, value, shapes, onChange, disabled }: {
  lang: Lang; value: string | null; shapes: FrameShape[]; onChange: (url: string) => void; disabled?: boolean;
}) {
  const T = pick(COPY, lang);
  const [open, setOpen] = useState(false);
  if (!value) return null;
  return (
    <>
      <Button size="sm" tone="ghost" disabled={disabled} onClick={() => setOpen(true)}>
        <CropIcon size={16} aria-hidden="true" />{T.frame}
      </Button>
      {open ? <FrameEditor lang={lang} src={value} shapes={shapes} onClose={() => setOpen(false)} onDone={(url) => { setOpen(false); if (url !== value) onChange(url); }} /> : null}
    </>
  );
}

/** The sheet, loaded when the button opens it. */
const FrameEditor = dynamic(() => import('./frame-sheet').then((m) => m.FrameEditor), { ssr: false });
export { FrameEditor };
