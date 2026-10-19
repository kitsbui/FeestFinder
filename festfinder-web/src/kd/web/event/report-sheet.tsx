'use client';
/** The report sheet of an event page (design v2 phase 14: loaded when it opens, never at boot). */
import type { FormEvent } from 'react';
import { pick, type Lang, tx } from '../../copy';
import { Button } from '../../ui/actions';
import { FieldLabel, TextArea } from '../../ui/forms';
import { Sheet } from '../../ui/sheet';
import { WEB } from '../copy';

const REPORT_CODES: Record<string, { en: string; vi: string }> = {
  wrong: { en: 'Details are wrong', vi: 'Thông tin sai' },
  cancelled: { en: 'Event was cancelled', vi: 'Sự kiện đã huỷ' },
  scam: { en: 'Looks like a scam', vi: 'Có dấu hiệu lừa đảo' },
  duplicate: { en: 'Posted twice', vi: 'Đăng trùng hai lần' },
  offensive: { en: 'Offensive content', vi: 'Nội dung không phù hợp' },
  price: { en: 'Price is not what was listed', vi: 'Giá khác với tin đăng' },
  refund: { en: 'Refund claim', vi: 'Đòi hoàn tiền' },
  safety: { en: 'Safety concern', vi: 'An toàn' },
};

export function ReportSheet({ lang, code, note, busy, onCode, onNote, onSubmit, onClose }: {
  lang: Lang; code: string; note: string; busy: boolean; onCode: (c: string) => void; onNote: (n: string) => void; onSubmit: (e: FormEvent) => void; onClose: () => void;
}) {
  const t = pick(WEB, lang);
  return (
        <Sheet title={t.report} closeLabel={t.close} onClose={onClose}>
          <form onSubmit={onSubmit} className="flex flex-col gap-3 pt-2">
            <fieldset className="flex flex-col gap-1.5">
              <legend className="kd-flabel mb-2">{t.reportWhat}</legend>
              {Object.entries(REPORT_CODES).map(([k, l]) => (
                <label key={k} className="kd-lrow min-h-11 cursor-pointer">
                  <input type="radio" name="code" value={k} checked={code === k} onChange={() => onCode(k)} className="kd-check" />
                  <span className="kd-t text-fg-1">{tx(l, lang)}</span>
                </label>
              ))}
            </fieldset>
            <FieldLabel htmlFor="kd-report-note">{t.reportMore}</FieldLabel>
            <TextArea id="kd-report-note" rows={2} maxLength={1000} value={note} onChange={(e) => onNote(e.target.value)} />
            <Button type="submit" tone="acc" block disabled={!code || busy}>{t.reportSend}</Button>
          </form>
        </Sheet>
  );
}
