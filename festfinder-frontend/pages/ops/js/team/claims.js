/*
 * Team mode: organisers asking to take over an event the community sent in (approving moves
 * the event to their account and turns down any other request for it), and people asking to
 * manage an artist or organiser profile that is already listed.
 */
import { h, Fragment, useState, t, tx, post, useFetch, useQueryState, toast, errorText, emit, day, stamp } from '../core.js';
import { PageHeader, Button, Pill, Spinner, ErrorBox, Empty, DataTable, Tabs, confirm, External } from '../ui.js';

export function Claims() {
  const [what, setWhat] = useQueryState('what', 'events');
  const [status, setStatus] = useQueryState('status', 'pending');
  return h(Fragment, null,
    h(PageHeader, { title: t('Nhận quản lý', 'Claims') }),
    h(Tabs, { value: what, onChange: setWhat, items: [
      { value: 'events', icon: 'calendar-dots', label: t('Sự kiện', 'Events') },
      { value: 'profiles', icon: 'user-circle', label: t('Hồ sơ nghệ sĩ & BTC', 'Artist & organiser profiles') },
    ] }),
    h(Tabs, { value: status, onChange: setStatus, items: [
      { value: 'pending', icon: 'hourglass', label: t('Đang chờ', 'Pending') },
      { value: 'approved', icon: 'check-circle', label: t('Đã duyệt', 'Approved') },
      { value: 'rejected', icon: 'x-circle', label: t('Đã từ chối', 'Declined') },
    ] }),
    what === 'profiles' ? h(ProfileClaims, { status }) : h(EventClaims, { status }));
}

function ProfileClaims({ status }) {
  const { data, error, loading, reload } = useFetch(`/admin/profile-claims?status=${status}`, [status]);
  const [busy, setBusy] = useState(null);
  const decide = async (c, approve) => {
    const out = approve
      ? await confirm({ title: t(`Giao ${c.target.name} cho ${c.user.name || c.user.email}?`, `Give ${c.target.name} to ${c.user.name || c.user.email}?`), body: c.user.email || '', confirm: t('Duyệt', 'Approve') })
      : await confirm({ title: t('Từ chối yêu cầu?', 'Decline the request?'), body: c.target.name, confirm: t('Từ chối', 'Decline'), tone: 'danger',
        withNote: { label: t('Lời nhắn', 'Note'), placeholder: t('Chưa xác nhận được bạn là chủ hồ sơ…', 'We could not confirm this is you…') } });
    if (!out) return;
    setBusy(c.id + approve);
    try {
      await post(`/admin/profile-claims/${c.kind}/${c.id}/decision`, { approve, note: (out.note || '').trim() });
      toast(approve ? t('Đã duyệt', 'Approved') : t('Đã từ chối', 'Declined'));
      emit('counts');
      reload(true);
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(null); }
  };
  const columns = [
    { key: 'target', label: t('Hồ sơ', 'Profile'), width: 240, render: (c) => h('div', null,
      h(Pill, { tone: c.kind === 'artist' ? 'info' : 'neutral', icon: c.kind === 'artist' ? 'microphone-stage' : 'buildings' }, c.kind === 'artist' ? t('Nghệ sĩ', 'Artist') : t('BTC', 'Organiser')), ' ',
      h('a', { href: c.kind === 'artist' ? `/a/${c.target.slug}` : `/o/${c.target.slug}`, target: '_blank', rel: 'noopener' }, c.target.name),
      h('div', { className: 'op-cell-sub' }, c.kind === 'artist'
        ? [t(`${c.target.events} sự kiện`, `${c.target.events} events`), c.target.owned ? ' · ' + t('đã có người quản lý', 'already managed') : '']
        : t(`${c.target.members} thành viên`, `${c.target.members} members`))) },
    { key: 'user', label: t('Người gửi', 'From'), width: 220, render: (c) => h('div', null, h('strong', null, c.user.name || '—'), h('div', { className: 'op-cell-sub' }, c.user.email || '')) },
    { key: 'note', label: t('Lời nhắn', 'Note'), width: 300, render: (c) => h('div', null,
      h('div', { style: { whiteSpace: 'pre-wrap' } }, c.note),
      c.proofUrl ? h(External, { href: c.proofUrl }, c.proofUrl.replace(/^https?:\/\//, '').slice(0, 48)) : null) },
    { key: 'when', label: t('Gửi lúc', 'Sent'), width: 130, render: (c) => stamp(c.createdAt) },
    status === 'pending'
      ? { key: 'act', label: '', width: 220, align: 'right', render: (c) => h('div', { className: 'op-row-actions' },
        h(Button, { size: 'sm', variant: 'ok', icon: 'check', busy: busy === c.id + true, onClick: () => decide(c, true) }, t('Duyệt', 'Approve')),
        h(Button, { size: 'sm', variant: 'danger', busy: busy === c.id + false, onClick: () => decide(c, false) }, t('Từ chối', 'Decline'))) }
      : { key: 'out', label: t('Kết quả', 'Outcome'), width: 220, render: (c) => h('div', null,
        h(Pill, { tone: c.status === 'approved' ? 'ok' : 'danger' }, c.status === 'approved' ? t('Đã duyệt', 'Approved') : t('Đã từ chối', 'Declined')),
        c.decisionNote ? h('div', { className: 'op-cell-sub' }, c.decisionNote) : null) },
  ];
  return error ? h(ErrorBox, { error, onRetry: reload }) : loading && !data ? h(Spinner)
    : h(DataTable, { columns, rows: data.items, minWidth: 1100, empty: h(Empty, { icon: 'seal-check', title: t('Không có yêu cầu nào', 'No requests') }) });
}

function EventClaims({ status }) {
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
  return error ? h(ErrorBox, { error, onRetry: reload }) : loading && !data ? h(Spinner)
    : h(DataTable, { columns, rows: data.items, minWidth: 1100, empty: h(Empty, { icon: 'seal-check', title: t('Không có yêu cầu nào', 'No requests') }) });
}
