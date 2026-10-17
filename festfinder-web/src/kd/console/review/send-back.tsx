'use client';
/**
 * Sending one listing or several back with a written message: the reason (a reason that allows
 * no appeal says so), the message filled from the reason's template in Vietnamese or English and
 * editable, and whether the organiser may appeal within 7 days. The queue holds the decision
 * five seconds like any other.
 */
import { useEffect, useState } from 'react';
import { fill, pick, type Lang } from '../../copy';
import { Button } from '../../ui/actions';
import { Segmented, Select, Switch, TextArea } from '../../ui/forms';
import { Drawer, Field, KIT } from '../kit';
import { REVIEW } from './copy';
import type { Reason } from './types';

export function SendBack({ lang, reasons, ids, titles, initial, onClose, onSend }: {
  lang: Lang; reasons: Reason[]; ids: string[]; titles: string[]; initial?: string | null;
  onClose: () => void; onSend: (reason: Reason, message: string, allowAppeal: boolean) => void;
}) {
  const R = pick(REVIEW, lang);
  const [code, setCode] = useState(initial ?? '');
  const [tpl, setTpl] = useState<Lang>(lang);
  const [message, setMessage] = useState('');
  const [appeal, setAppeal] = useState(true);
  const reason = reasons.find((r) => r.code === code) ?? null;
  // A reason (or the template language) fills the message with its template.
  useEffect(() => {
    if (!reason) return;
    setMessage(reason.template[tpl]);
    setAppeal(reason.appealAllowed);
  }, [reason, tpl]);
  const can = !!reason && !!message.trim();
  return (
    <Drawer
      title={ids.length > 1 ? fill(R.sbMany, { n: ids.length }) : R.sbOne}
      sub={titles.join(' · ')}
      onClose={onClose}
      footer={(
        <>
          <Button onClick={onClose}>{pick(KIT, lang).cancel}</Button>
          <button type="button" className="kd-btn kd-btn-danger ml-auto" disabled={!can} onClick={() => reason && onSend(reason, message.trim(), appeal && reason.appealAllowed)}>{R.sendBackGo}</button>
        </>
      )}
    >
      <Field label={R.reason} htmlFor="sb-reason">
        <Select id="sb-reason" value={code} onChange={(e) => setCode(e.target.value)}>
          <option value="">{R.pickReason}</option>
          {reasons.map((r) => <option key={r.code} value={r.code}>{r.label[lang]}{r.appealAllowed ? '' : R.noAppealTag}</option>)}
        </Select>
      </Field>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="sb-message" className="kd-flabel">{R.message}</label>
          <Segmented label={R.templateLang} value={tpl} onChange={setTpl} options={[{ value: 'vi', label: 'VI' }, { value: 'en', label: 'EN' }]} />
        </div>
        <TextArea id="sb-message" rows={7} maxLength={2000} value={message} placeholder={R.messagePh} onChange={(e) => setMessage(e.target.value)} />
        <span className="kd-s kd-num self-end">{message.length}/2000</span>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-line-1 pt-3">
        <span className="kd-t text-fg-2">{R.allowAppeal}</span>
        <Switch label={R.allowAppeal} checked={appeal && !!reason?.appealAllowed} disabled={!reason?.appealAllowed} onChange={setAppeal} />
      </div>
    </Drawer>
  );
}
