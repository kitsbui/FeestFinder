/*
 * Team mode: organisers asking to take over an event the community sent in. Approving moves
 * the event to their account and turns down any other request for it.
 */
import { h, Fragment, useState, t, tx, post, useFetch, useQueryState, toast, errorText, emit, day, stamp } from '../core.js';
import { PageHeader, Button, Pill, Spinner, ErrorBox, Empty, DataTable, Tabs, confirm, External } from '../ui.js';

export function Claims() {
  const [status, setStatus] = useQueryState('status', 'pending');
  const { data, error, loading, reload } = useFetch(`/admin/claims?status=${status}`, [status]);
  const [busy, setBusy] = useState(null);
  const decide = async (c, decision) => {
    const out = decision === 'approve'
      ? await confirm({ title: t(`Chuyển cho ${c.organizer.name}?`, `Move to ${c.organizer.name}?`), body: c.event.title, confirm: t('Chuyển sự kiện', 'Move the event') })
      : await confirm({ title: t('Từ chối yêu cầu?', 'Decline the request?'), body: c.event.title, confirm: t('Từ chối', 'Decline'), tone: 'danger',
        withNote: { label: t('Lời nhắn cho nhà tổ chức', 'Note to the organiser'), placeholder: t('Chưa xác nhận được bạn là BTC…', 'We could not confirm you run it…') } });
    if (!out) return;
    setBusy(c.id + decision);
    try {
      const res = await post(`/admin/claims/${c.id}/${decision}`, out.note ? { note: out.note.trim() } : {});
      toast(tx(res.message));
      emit('counts');
      reload(true);
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(null); }
  };
  const columns = [
    { key: 'event', label: t('Sự kiện', 'Event'), width: 230, render: (c) => h('div', null,
      h('a', { href: `/e/${c.event.slug}`, target: '_blank', rel: 'noopener' }, c.event.title),
      h('div', { className: 'op-cell-sub' }, day(c.event.startsOn), c.event.submittedBy ? ' · ' + t(`${c.event.submittedBy} gửi`, `sent by ${c.event.submittedBy}`) : '')) },
    { key: 'org', label: t('Nhà tổ chức', 'Organiser'), width: 210, render: (c) => h('div', null,
      h('strong', null, c.organizer.name), ' ', c.organizer.verified ? h(Pill, { tone: 'ok', icon: 'seal-check' }, t('Đã xác minh', 'Verified')) : null,
      h('div', { className: 'op-cell-sub' }, c.requestedBy.name, c.requestedBy.email ? ' · ' + c.requestedBy.email : '')) },
    { key: 'note', label: t('Lời nhắn', 'Note'), width: 300, render: (c) => h('div', null,
      h('div', { style: { whiteSpace: 'pre-wrap' } }, c.note),
      c.proofUrl ? h(External, { href: c.proofUrl }, c.proofUrl.replace(/^https?:\/\//, '').slice(0, 48)) : null,
      c.organizer.website ? h('div', { className: 'op-cell-sub' }, h(External, { href: c.organizer.website }, t('Website BTC', 'Organiser site'))) : null) },
    { key: 'when', label: t('Gửi lúc', 'Sent'), width: 130, render: (c) => stamp(c.createdAt) },
    status === 'pending'
      ? { key: 'act', label: '', width: 220, align: 'right', render: (c) => h('div', { className: 'op-row-actions' },
        h(Button, { size: 'sm', variant: 'ok', icon: 'check', busy: busy === c.id + 'approve', onClick: () => decide(c, 'approve') }, t('Duyệt', 'Approve')),
        h(Button, { size: 'sm', variant: 'danger', busy: busy === c.id + 'reject', onClick: () => decide(c, 'reject') }, t('Từ chối', 'Decline'))) }
      : { key: 'out', label: t('Kết quả', 'Outcome'), width: 220, render: (c) => h('div', null,
        h(Pill, { tone: c.status === 'approved' ? 'ok' : 'danger' }, c.status === 'approved' ? t('Đã chuyển', 'Moved') : t('Đã từ chối', 'Declined')),
        c.decisionNote ? h('div', { className: 'op-cell-sub' }, c.decisionNote) : null) },
  ];
  return h(Fragment, null,
    h(PageHeader, { title: t('Nhận quản lý sự kiện', 'Event claims') }),
    h(Tabs, { value: status, onChange: setStatus, items: [
      { value: 'pending', icon: 'hourglass', label: t('Đang chờ', 'Pending') },
      { value: 'approved', icon: 'check-circle', label: t('Đã chuyển', 'Moved') },
      { value: 'rejected', icon: 'x-circle', label: t('Đã từ chối', 'Declined') },
    ] }),
    error ? h(ErrorBox, { error, onRetry: reload }) : loading && !data ? h(Spinner)
      : h(DataTable, { columns, rows: data.items, minWidth: 1100, empty: h(Empty, { icon: 'seal-check', title: t('Không có yêu cầu nào', 'No requests') }) }));
}
