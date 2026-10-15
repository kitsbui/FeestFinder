'use client';
/**
 * /console/projects: projects people pitch (festfinder-backend routes/projects.ts). The team reads
 * one in review and approves it (it goes public) or sends it back with a reason; an open one can
 * be closed. FeestFinder connects the people and never handles money, so there is no payment here.
 */
import { useState } from 'react';
import { CheckIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../../copy';
import { money } from '../../format';
import { useKd } from '../../runtime';
import { Button } from '../../ui/actions';
import { TextArea } from '../../ui/forms';
import { Row, Table, Tabs } from '../../ui/shell';
import { act, Body, Drawer, Empty, ErrorBox, Field, Loading, PageHead, Pill, useLoad } from '../kit';
import { useConsole } from '../root';
import { Cell, Two } from '../orders/parts';

type Status = 'in_review' | 'open' | 'closed' | 'realized' | 'rejected';
interface Item {
  id: string; slug: string; title: string; pitch: string; story: string; city: { label: Pair | null }; seeking: { key: string; label: Pair }[];
  budget: number | null; raiseAmount: number | null; currency: string; targetOn: string | null; status: Status; ownerEmail: string | null;
  owner: { name: string | null }; offers: number; decisionNote?: string | null;
}

const P = {
  title: { en: 'Projects', vi: 'Dự án' },
  in_review: { en: 'In review', vi: 'Chờ duyệt' },
  open: { en: 'Open', vi: 'Đang mở' },
  closed: { en: 'Closed', vi: 'Đã đóng' },
  realized: { en: 'Became events', vi: 'Đã thành sự kiện' },
  rejected: { en: 'Sent back', vi: 'Đã gửi lại' },
  none: { en: 'Nothing here', vi: 'Không có dự án nào' },
  cProject: { en: 'Project', vi: 'Dự án' },
  cOwner: { en: 'Started by', vi: 'Người khởi xướng' },
  cOffers: { en: 'Offers', vi: 'Đề nghị' },
  openLabel: { en: 'Open {t}', vi: 'Mở {t}' },
  approve: { en: 'Approve', vi: 'Duyệt' },
  reject: { en: 'Send back', vi: 'Gửi lại' },
  close: { en: 'Close', vi: 'Đóng dự án' },
  note: { en: 'Reason for the owner', vi: 'Lý do gửi chủ dự án' },
  budget: { en: 'Budget', vi: 'Ngân sách' },
  raise: { en: 'Raising', vi: 'Cần gọi' },
  seeking: { en: 'Looking for', vi: 'Đang tìm' },
  view: { en: 'Public page', vi: 'Trang công khai' },
};
const STATUSES: Status[] = ['in_review', 'open', 'realized', 'closed', 'rejected'];
const COLS = 'minmax(280px,2fr) minmax(200px,1fr) 90px';

export function ConsoleProjects() {
  const { lang, refreshCounts } = useConsole();
  const T = pick(P, lang);
  const [status, setStatus] = useState<Status>('in_review');
  const load = useLoad<{ items: Item[]; counts: Record<string, number> }>('/admin/projects?status=' + status);
  const [open, setOpen] = useState<Item | null>(null);
  return (
    <>
      <PageHead title={T.title} />
      <Body>
        <Tabs label={T.title} current={status} onSelect={(k) => setStatus(k as Status)} items={STATUSES.map((s) => ({ key: s, label: T[s], count: load.data?.counts[s] ?? null }))} />
        {load.error && !load.data ? <ErrorBox error={load.error} retry={load.reload} /> : !load.data ? <Loading /> : !load.data.items.length ? <Empty title={T.none} /> : (
          <Table label={T.title} cols={COLS} head={[T.cProject, T.cOwner, T.cOffers]}>
            {load.data.items.map((p) => (
              <Row key={p.id} cols={COLS} current={open?.id === p.id}>
                <Cell>
                  <button type="button" className="flex w-full min-w-0 flex-col text-left hover:underline" aria-label={fill(T.openLabel, { t: p.title })} onClick={() => setOpen(p)}>
                    <Two title={p.title} sub={[FF.text(p.city.label, lang), p.seeking.map((s) => FF.text(s.label, lang)).join(', ')].filter(Boolean).join(' · ')} />
                  </button>
                </Cell>
                <Cell className="kd-s kd-ell">{[p.owner.name, p.ownerEmail].filter(Boolean).join(' · ')}</Cell>
                <Cell end className="kd-num text-sm text-paper">{p.offers}</Cell>
              </Row>
            ))}
          </Table>
        )}
      </Body>
      {open ? <Review key={open.id} lang={lang} p={open} onClose={(changed) => { setOpen(null); if (changed) { load.reload(); refreshCounts(); } }} /> : null}
    </>
  );
}

function Review({ lang, p, onClose }: { lang: Lang; p: Item; onClose: (changed: boolean) => void }) {
  const T = pick(P, lang);
  const kd = useKd();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const decide = async (action: 'approve' | 'reject' | 'close') => {
    setBusy(true);
    const ok = await act(kd, lang, () => FF.post(`/admin/projects/${p.id}/decision`, { action, note }));
    setBusy(false);
    if (ok) onClose(true);
  };
  return (
    <Drawer
      title={p.title}
      sub={[FF.text(p.city.label, lang), p.targetOn].filter(Boolean).join(' · ')}
      onClose={() => onClose(false)}
      footer={p.status === 'in_review' ? (
        <>
          <Button disabled={busy || !note.trim()} onClick={() => decide('reject')}><XIcon size={16} aria-hidden="true" />{T.reject}</Button>
          <span className="flex-1" />
          <Button tone="acc" disabled={busy} onClick={() => decide('approve')}><CheckIcon size={16} aria-hidden="true" />{T.approve}</Button>
        </>
      ) : p.status === 'open' ? <Button disabled={busy} onClick={() => decide('close')}>{T.close}</Button> : null}
    >
      <div className="flex flex-col gap-4">
        <span className="flex flex-wrap gap-1.5">{p.seeking.map((s) => <Pill key={s.key}>{FF.text(s.label, lang)}</Pill>)}</span>
        {p.pitch ? <p className="kd-t text-paper">{p.pitch}</p> : null}
        <p className="kd-s whitespace-pre-line">{p.story}</p>
        <dl className="grid grid-cols-2 gap-3">
          {p.budget != null ? <div><dt className="kd-m">{T.budget}</dt><dd className="kd-num text-paper">{money(p.budget, p.currency, lang)}</dd></div> : null}
          {p.raiseAmount != null ? <div><dt className="kd-m">{T.raise}</dt><dd className="kd-num text-paper">{money(p.raiseAmount, p.currency, lang)}</dd></div> : null}
        </dl>
        {p.status !== 'in_review' ? <a className="kd-s underline" href={`/p/${encodeURIComponent(p.slug)}`} target="_blank" rel="noopener">{T.view}</a> : null}
        {p.status === 'in_review' ? (
          <Field label={T.note} htmlFor="pr-note"><TextArea id="pr-note" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        ) : null}
      </div>
    </Drawer>
  );
}
