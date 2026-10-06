'use client';
/**
 * A modal sheet on a native <dialog>: focus stays inside, Escape closes, the page behind is
 * inert. A bottom sheet on phones, a centred card from 760px.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { XIcon } from '@phosphor-icons/react/ssr';
import { cx } from '../cx';

export function Sheet({ open = true, onClose, title, children, closeLabel, wide, className }: {
  open?: boolean; onClose: () => void; title: ReactNode; children: ReactNode; closeLabel: string; wide?: boolean; className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      aria-labelledby="kd-sheet-title"
      className={cx(
        'kd-sheet m-0 mt-auto w-full max-w-none max-h-[92dvh] overflow-y-auto rounded-t-sheet bg-carbon p-0 text-mist shadow-[inset_0_0_0_1px_var(--color-line2)]',
        'tab:m-auto tab:rounded-sheet',
        wide ? 'tab:max-w-[640px]' : 'tab:max-w-[420px]',
        className,
      )}
    >
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <h2 id="kd-sheet-title" className="kd-h min-w-0 flex-1">{title}</h2>
        <button type="button" className="kd-ib kd-ib-sm" aria-label={closeLabel} onClick={onClose}>
          <XIcon size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="px-5 pb-[calc(20px+env(safe-area-inset-bottom))]">{children}</div>
    </dialog>
  );
}
