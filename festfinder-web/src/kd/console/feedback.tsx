'use client';
/**
 * /console/feedback: reports from the feedback button on every page (festfinder-backend
 * routes/feedback.ts). Open ones first (new, triaged, in progress), filtered by kind; a drawer
 * shows the report, what the page attached by itself and the screenshots (served to the team
 * only), sets its status, opens the JSON the issue tools read, and files it on GitHub without
 * who sent it. ?id=<report> opens one (the chat webhook's link).
 */
import { useEffect, useState } from 'react';
import { ArrowSquareOutIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { useKd } from '../runtime';
import { Button, LinkButton } from '../ui/actions';
import { Select } from '../ui/forms';
import type { StatusTone } from '../ui/parts';
import { Row, Table, Tabs } from '../ui/shell';
import { act, Body, Drawer, Empty, ErrorBox, Field, Loading, PageHead, Pill, stamp, useLoad } from './kit';
import { useConsole } from './root';
import { Cell, Two } from './orders/parts';

type Kind = 'bug' | 'ui_ux' | 'feature' | 'support';
type St = 'new' | 'triaged' | 'in_progress' | 'done' | 'wont_fix';
interface Report {
  id: string; ticketId: string; type: Kind; typeLabel: Pair; severity: string | null; title: string; description: string; steps: string | null;
  csat: number | null; status: St; createdAt: string; githubIssueUrl: string | null; attachmentCount: number;
  from: { kind: 'user' | 'guest'; id?: string; name: string | null; email: string | null };
  telemetry: { pagePath?: string; userAgent?: string; screen?: string; viewport?: string; dpr?: number; language?: string; errors?: string[]; lastApiError?: { method?: string; path?: string; status?: number; code?: string }; buildId?: string };
  attachments?: { n: number; width: number; height: number; url: string }[];
}

const F = {
  title: { en: 'Feedback', vi: 'Góp ý' },
  open: { en: 'Open', vi: 'Đang mở' },
  all: { en: 'All kinds', vi: 'Mọi loại' },
  bug: { en: 'Bugs', vi: 'Lỗi' },
  ui_ux: { en: 'Design', vi: 'Giao diện' },
  feature: { en: 'Features', vi: 'Tính năng' },
  support: { en: 'Support', vi: 'Hỗ trợ' },
  none: { en: 'Nothing here', vi: 'Không có góp ý nào' },
  cReport: { en: 'Report', vi: 'Góp ý' },
  cFrom: { en: 'From', vi: 'Người gửi' },
  cStatus: { en: 'Status', vi: 'Trạng thái' },
  s_new: { en: 'New', vi: 'Mới' },
  s_triaged: { en: 'Triaged', vi: 'Đã phân loại' },
  s_in_progress: { en: 'In progress', vi: 'Đang xử lý' },
  s_done: { en: 'Done', vi: 'Đã xong' },
  s_wont_fix: { en: 'Won’t fix', vi: 'Không xử lý' },
  severity: { en: 'Severity {s}', vi: 'Mức {s}' },
  steps: { en: 'Steps to reproduce', vi: 'Các bước tái hiện' },
  attached: { en: 'Attached by the page', vi: 'Trang tự đính kèm' },
  page: { en: 'Page', vi: 'Trang' },
  browser: { en: 'Browser', vi: 'Trình duyệt' },
  screen: { en: 'Screen', vi: 'Màn hình' },
  errors: { en: 'Errors', vi: 'Lỗi' },
  api: { en: 'Last API failure', vi: 'Lần gọi API lỗi gần nhất' },
  build: { en: 'Build', vi: 'Bản build' },
  csat: { en: 'Score {n}/5', vi: 'Điểm {n}/5' },
  guest: { en: 'Guest', vi: 'Khách' },
  shots: { en: 'Screenshots', vi: 'Ảnh chụp' },
  setStatus: { en: 'Status', vi: 'Trạng thái' },
  json: { en: 'JSON', vi: 'JSON' },
  github: { en: 'File on GitHub', vi: 'Tạo GitHub issue' },
  issue: { en: 'GitHub issue', vi: 'GitHub issue' },
};
const KINDS: (Kind | 'all')[] = ['all', 'bug', 'ui_ux', 'feature', 'support'];
const STATUSES: St[] = ['new', 'triaged', 'in_progress', 'done', 'wont_fix'];
const TONE: Record<St, StatusTone> = { new: 'warn', triaged: 'live', in_progress: 'live', done: 'ok', wont_fix: 'none' };
const SEV_TONE: Record<string, StatusTone> = { critical: 'bad', high: 'bad', medium: 'warn', low: 'none' };
const COLS = 'minmax(300px,2.2fr) minmax(180px,1fr) 130px';

export function ConsoleFeedback() {
  const { lang } = useConsole();
  const T = pick(F, lang);
  const [kind, setKind] = useState<Kind | 'all'>('all');
  const [status, setStatus] = useState<St | 'open'>('open');
  const load = useLoad<{ items: Report[]; counts: { new: number; open: number } }>(`/admin/feedback?status=${status}${kind === 'all' ? '' : '&type=' + kind}`);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { const id = new URLSearchParams(location.search).get('id'); if (id) setOpen(id); }, []);
  return (
    <>
      <PageHead title={T.title} sub={load.data ? `${load.data.counts.new} ${T.s_new.toLowerCase()} · ${load.data.counts.open} ${T.open.toLowerCase()}` : undefined} />
      <Body>
        <div className="flex flex-wrap items-center gap-3">
          <Tabs label={T.title} current={kind} onSelect={(k) => setKind(k as Kind | 'all')} items={KINDS.map((k) => ({ key: k, label: T[k] }))} />
          <Select aria-label={T.cStatus} value={status} onChange={(e) => setStatus(e.target.value as St | 'open')} boxClass="ml-auto w-48">
            <option value="open">{T.open}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{T[`s_${s}`]}</option>)}
          </Select>
        </div>
        {load.error && !load.data ? <ErrorBox error={load.error} retry={load.reload} /> : !load.data ? <Loading /> : !load.data.items.length ? <Empty title={T.none} /> : (
          <Table label={T.title} cols={COLS} head={[T.cReport, T.cFrom, T.cStatus]}>
            {load.data.items.map((r) => (
              <Row key={r.id} cols={COLS} current={open === r.id}>
                <Cell>
                  <button type="button" className="flex w-full min-w-0 flex-col text-left hover:underline" onClick={() => setOpen(r.id)}>
                    <Two title={r.title} sub={[r.ticketId, FF.text(r.typeLabel, lang), r.severity ? fill(T.severity, { s: r.severity }) : null, stamp(r.createdAt, lang)].filter(Boolean).join(' · ')} />
                  </button>
                </Cell>
                <Cell className="kd-s kd-ell">{r.from.kind === 'guest' ? `${T.guest} · ${r.from.email ?? ''}` : r.from.name || r.from.email || ''}</Cell>
                <Cell><Pill tone={TONE[r.status]}>{T[`s_${r.status}`]}</Pill></Cell>
              </Row>
            ))}
          </Table>
        )}
      </Body>
      {open ? <ReportDrawer key={open} lang={lang} id={open} onClose={(changed) => { setOpen(null); if (changed) load.reload(); }} /> : null}
    </>
  );
}

function ReportDrawer({ lang, id, onClose }: { lang: Lang; id: string; onClose: (changed: boolean) => void }) {
  const T = pick(F, lang);
  const kd = useKd();
  const load = useLoad<Report>(`/admin/feedback/${id}`);
  const [busy, setBusy] = useState(false);
  const [changed, setChanged] = useState(false);
  const r = load.data;
  const setStatus = async (status: St) => {
    setBusy(true);
    if (await act(kd, lang, () => FF.patch(`/admin/feedback/${id}`, { status }))) { setChanged(true); load.reload(); }
    setBusy(false);
  };
  const github = async () => {
    setBusy(true);
    if (await act(kd, lang, () => FF.post(`/admin/feedback/${id}/github`))) { setChanged(true); load.reload(); }
    setBusy(false);
  };
  const t = r?.telemetry ?? {};
  return (
    <Drawer
      wide
      title={r ? r.title : '…'}
      sub={r ? `${r.ticketId} · ${FF.text(r.typeLabel, lang)}` : undefined}
      onClose={() => onClose(changed)}
      footer={r ? (
        <>
          <LinkButton href={`/admin/feedback/${id}/export`} external target="_blank" rel="noopener">{T.json}<ArrowSquareOutIcon size={14} aria-hidden="true" /></LinkButton>
          {r.githubIssueUrl
            ? <LinkButton href={r.githubIssueUrl} external target="_blank" rel="noopener">{T.issue}<ArrowSquareOutIcon size={14} aria-hidden="true" /></LinkButton>
            : <Button disabled={busy} onClick={github}>{T.github}</Button>}
        </>
      ) : null}
    >
      {load.error && !r ? <ErrorBox error={load.error} retry={load.reload} /> : !r ? <Loading /> : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {r.severity ? <Pill tone={SEV_TONE[r.severity] ?? 'none'}>{fill(T.severity, { s: r.severity })}</Pill> : null}
            {r.csat ? <Pill>{fill(T.csat, { n: r.csat })}</Pill> : null}
            <span className="kd-s">{r.from.kind === 'guest' ? `${T.guest} · ${[r.from.name, r.from.email].filter(Boolean).join(' · ')}` : [r.from.name, r.from.email].filter(Boolean).join(' · ')} · {stamp(r.createdAt, lang)}</span>
          </div>
          <p className="kd-t whitespace-pre-line text-paper">{r.description}</p>
          {r.steps ? <Field label={T.steps}><p className="kd-s whitespace-pre-line">{r.steps}</p></Field> : null}
          <Field label={T.setStatus} htmlFor="fb-status">
            <Select id="fb-status" value={r.status} disabled={busy} onChange={(e) => setStatus(e.target.value as St)}>
              {STATUSES.map((s) => <option key={s} value={s}>{T[`s_${s}`]}</option>)}
            </Select>
          </Field>
          {r.attachments?.length ? (
            <Field label={T.shots}>
              <div className="flex flex-wrap gap-2">
                {r.attachments.map((a) => (
                  <a key={a.n} href={a.url} target="_blank" rel="noopener">
                    { }
                    <img src={a.url} alt={`${T.shots} ${a.n}`} className="h-40 w-auto rounded-seg object-contain shadow-[inset_0_0_0_1px_var(--color-line)]" />
                  </a>
                ))}
              </div>
            </Field>
          ) : null}
          <Field label={T.attached}>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5">
              <dt className="kd-m">{T.page}</dt><dd className="kd-s kd-ell">{t.pagePath ? <a className="underline" href={t.pagePath} target="_blank" rel="noopener">{t.pagePath}</a> : '—'}</dd>
              <dt className="kd-m">{T.browser}</dt><dd className="kd-s break-words">{t.userAgent ?? '—'}</dd>
              <dt className="kd-m">{T.screen}</dt><dd className="kd-s kd-num">{[t.viewport, t.screen, t.dpr ? `×${t.dpr}` : null, t.language].filter(Boolean).join(' · ') || '—'}</dd>
              <dt className="kd-m">{T.errors}</dt><dd className="kd-s break-words">{t.errors?.length ? t.errors.map((e, i) => <span key={i} className="block">{e}</span>) : '—'}</dd>
              <dt className="kd-m">{T.api}</dt><dd className="kd-s">{t.lastApiError ? `${t.lastApiError.method ?? ''} ${t.lastApiError.path ?? ''} · ${t.lastApiError.status ?? ''} ${t.lastApiError.code ?? ''}` : '—'}</dd>
              <dt className="kd-m">{T.build}</dt><dd className="kd-s kd-num">{t.buildId || '—'}</dd>
            </dl>
          </Field>
        </div>
      )}
    </Drawer>
  );
}
