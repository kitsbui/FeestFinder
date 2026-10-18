'use client';
/**
 * The one question before friends see the nights someone goes to (migration 045, owner 2026-10-18):
 * asked the first time they save a night, join a plan or have a ticket; changed later in settings.
 * Loaded when it opens (runtime.tsx), so no page carries it.
 */
import { useState } from 'react';
import { FF } from '@/runtime/ff';
import { pick, type Lang } from '../copy';
import { Button } from './actions';
import { Sheet } from './sheet';

const T = {
  title: { en: 'Let friends see the nights you go to?', vi: 'Cho bạn bè thấy bạn đi những đêm nào?' },
  yes: { en: 'Show friends', vi: 'Cho bạn bè thấy' },
  no: { en: 'Keep private', vi: 'Để riêng tư' },
  close: { en: 'Close', vi: 'Đóng' },
};

/** `onDone(true|false)` once answered, `onDone(null)` when closed without an answer (asked again next visit). */
export function ShareAsk({ lang, onDone }: { lang: Lang; onDone: (share: boolean | null) => void }) {
  const t = pick(T, lang);
  const [busy, setBusy] = useState(false);
  const answer = async (share: boolean) => {
    setBusy(true);
    try {
      await FF.put('/me/share-nights', { share });
      onDone(share);
    } catch {
      onDone(null);
    }
  };
  return (
    <Sheet onClose={() => onDone(null)} title={t.title} closeLabel={t.close}>
      <div className="flex flex-col gap-2.5 pt-2">
        <Button tone="acc" block disabled={busy} onClick={() => answer(true)}>{t.yes}</Button>
        <Button tone="default" block disabled={busy} onClick={() => answer(false)}>{t.no}</Button>
      </div>
    </Sheet>
  );
}
