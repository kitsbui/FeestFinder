/*
 * Artist mode: open gigs best fit first (a fixed score from styles, place, kind of gig, dates
 * and booking status), what they applied to, booking requests from organisers, and the dates
 * they are free or busy.
 */
import { h, Fragment, useState, useEffect, t, tx, post, put, useFetch, useQueryState, toast, errorText, num, day } from '../core.js';
import { PageHeader, Button, Pill, Spinner, ErrorBox, Empty, DataTable, Field, Input, TextArea, Select, DateInput, Tabs, Card, Modal } from '../ui.js';
import { cityOptions } from '../opts.js';

const fee = (min, max, currency) => (min == null && max == null ? '—' : [min, max].filter((x) => x != null).map(num).join(' – ') + ` ${currency}`);
const STATUS = {
  sent: ['neutral', () => t('Đã gửi', 'Sent')], shortlisted: ['info', () => t('Danh sách chọn', 'Shortlisted')], declined: ['danger', () => t('Chưa phù hợp', 'Not this time')],
  booked: ['ok', () => t('Đã chốt', 'Booked')], withdrawn: ['muted', () => t('Đã rút', 'Withdrawn')], accepted: ['ok', () => t('Đồng ý trao đổi', 'Interested')],
};
const pill = (k) => h(Pill, { tone: STATUS[k]?.[0] ?? 'neutral' }, STATUS[k]?.[1]() ?? k);

function Open() {
  const { data, error, loading, reload } = useFetch('/gigs');
  const [applying, setApplying] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try { const out = await post(`/gigs/${applying.id}/apply`, { message: msg.trim() }); toast(tx(out.message)); setApplying(null); setMsg(''); reload(true); }
    catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  const columns = [
    { key: 'gig', label: 'Gig', width: 280, render: (g) => h('div', null, h('div', { className: 'op-cell-title' }, g.title),
      h('div', { className: 'op-cell-sub' }, [g.organizer?.name, day(g.startsOn), tx(g.cityLabel), g.gigType ? tx(g.gigType.label) : ''].filter(Boolean).join(' · '))) },
    { key: 'fit', label: t('Phù hợp', 'Fit'), width: 90, align: 'right', render: (g) => (g.match ? h('span', { title: g.match.unavailable ? t('Bạn đã báo bận ngày này', 'You marked this date busy') : '' }, `${g.match.score}/100`) : '—') },
    { key: 'fee', label: t('Phí', 'Fee'), width: 180, align: 'right', render: (g) => fee(g.feeMin, g.feeMax, g.currency) },
    { key: 'act', label: '', width: 150, align: 'right', render: (g) => (g.applied ? pill(g.applied) : h(Button, { size: 'sm', variant: 'cta', onClick: () => setApplying(g) }, t('Ứng tuyển', 'Apply'))) },
  ];
  return h(Fragment, null,
    error ? h(ErrorBox, { error, onRetry: reload }) : loading && !data ? h(Spinner)
      : h(DataTable, { columns, rows: data.items, minWidth: 760, empty: h(Empty, { icon: 'megaphone', title: t('Chưa có gig nào đang mở', 'No open gigs right now') }) }),
    applying ? h(Modal, { open: true, onClose: () => setApplying(null), title: applying.title,
      footer: h(Fragment, null, h(Button, { onClick: () => setApplying(null) }, t('Huỷ', 'Cancel')), h(Button, { variant: 'cta', busy, onClick: send }, t('Gửi hồ sơ', 'Send'))) },
      h(Field, { label: t('Lời nhắn', 'Message'), optional: true }, h(TextArea, { value: msg, onChange: setMsg, rows: 4 }))) : null);
}

function Mine() {
  const { data, error, loading, reload } = useFetch('/me/artist/applications');
  const withdraw = async (a) => { try { await post(`/me/artist/applications/${a.id}/withdraw`); reload(true); } catch (e) { toast(errorText(e), 'error'); } };
  return error ? h(ErrorBox, { error, onRetry: reload }) : loading && !data ? h(Spinner) : h(DataTable, { columns: [
    { key: 'gig', label: 'Gig', width: 300, render: (a) => h('div', null, h('div', { className: 'op-cell-title' }, a.gig.title), h('div', { className: 'op-cell-sub' }, [a.gig.organizer?.name, day(a.gig.startsOn)].filter(Boolean).join(' · '))) },
    { key: 'state', label: '', width: 160, render: (a) => pill(a.status) },
    { key: 'act', label: '', width: 120, align: 'right', render: (a) => (['sent', 'shortlisted'].includes(a.status) ? h(Button, { size: 'sm', onClick: () => withdraw(a) }, t('Rút', 'Withdraw')) : null) },
  ], rows: data.items, minWidth: 600, empty: h(Empty, { icon: 'paper-plane-tilt', title: t('Chưa ứng tuyển gig nào', 'No applications yet') }) });
}

function Requests() {
  const { data, error, loading, reload } = useFetch('/me/artist/inquiries');
  const [answer, setAnswer] = useState(null);
  const [reply, setReply] = useState('');
  const send = async (accept) => {
    try { await post(`/me/artist/inquiries/${answer.id}`, { accept, reply: reply.trim() }); setAnswer(null); setReply(''); reload(true); } catch (e) { toast(errorText(e), 'error'); }
  };
  return h(Fragment, null,
    error ? h(ErrorBox, { error, onRetry: reload }) : loading && !data ? h(Spinner) : h(DataTable, { columns: [
      { key: 'from', label: t('Từ', 'From'), width: 200, render: (i) => h('div', null, h('strong', null, i.organizer.name), ' ', i.organizer.verified ? h(Pill, { tone: 'ok', icon: 'seal-check' }, '') : null) },
      { key: 'when', label: t('Ngày', 'Date'), width: 180, render: (i) => `${day(i.eventOn)} · ${tx(i.cityLabel)}` },
      { key: 'msg', label: t('Lời nhắn', 'Message'), width: 260, render: (i) => h('div', { style: { whiteSpace: 'pre-wrap' } }, i.message) },
      { key: 'fee', label: t('Phí', 'Fee'), width: 140, align: 'right', render: (i) => fee(i.feeOffer, null, i.currency) },
      { key: 'act', label: '', width: 140, align: 'right', render: (i) => (i.status === 'sent' ? h(Button, { size: 'sm', variant: 'cta', onClick: () => setAnswer(i) }, t('Trả lời', 'Answer')) : pill(i.status)) },
    ], rows: data.items, minWidth: 900, empty: h(Empty, { icon: 'envelope-simple', title: t('Chưa có lời mời nào', 'No requests yet') }) }),
    answer ? h(Modal, { open: true, onClose: () => setAnswer(null), title: answer.organizer.name,
      footer: h(Fragment, null, h(Button, { variant: 'danger', onClick: () => send(false) }, t('Từ chối', 'Decline')), h(Button, { variant: 'cta', onClick: () => send(true) }, t('Đồng ý trao đổi', 'Interested'))) },
      h(Field, { label: t('Trả lời', 'Reply'), optional: true }, h(TextArea, { value: reply, onChange: setReply, rows: 4 }))) : null);
}

function Brands() {
  const { data, error, loading, reload } = useFetch('/brand-campaigns');
  const mine = useFetch('/me/artist/brand-interests');
  const [writing, setWriting] = useState(null);
  const [msg, setMsg] = useState('');
  const send = async () => {
    try { const out = await post(`/brand-campaigns/${writing.id}/interest`, { message: msg.trim() }); toast(tx(out.message)); setWriting(null); setMsg(''); reload(true); mine.reload(true); }
    catch (e) { toast(errorText(e), 'error'); }
  };
  if (error) return h(ErrorBox, { error, onRetry: reload });
  if (loading && !data) return h(Spinner);
  if (!data.openToBrands) return h(Empty, { icon: 'sparkle', title: t('Bật "Nhận hợp tác thương hiệu" trong hồ sơ để xem chiến dịch', 'Turn on "Open to brand collaborations" in your profile to see campaigns') });
  const BSTATUS = { ...STATUS, selected: ['ok', () => t('Được chọn', 'Selected')] };
  return h(Fragment, null,
    h(DataTable, { columns: [
      { key: 'c', label: t('Chiến dịch', 'Campaign'), width: 300, render: (c) => h('div', null, h('div', { className: 'op-cell-title' }, `${c.brandName} · ${c.title}`),
        h('div', { className: 'op-cell-sub' }, [c.cities.map((x) => tx(x.label)).join(', '), c.closesOn ? t(`hạn ${day(c.closesOn)}`, `closes ${day(c.closesOn)}`) : ''].filter(Boolean).join(' · ')),
        c.brief ? h('div', { className: 'op-cell-sub', style: { whiteSpace: 'pre-wrap' } }, c.brief) : null) },
      { key: 'fee', label: t('Phí', 'Fee'), width: 180, align: 'right', render: (c) => fee(c.feeMin, c.feeMax, c.currency) },
      { key: 'act', label: '', width: 150, align: 'right', render: (c) => (c.interest ? h(Pill, { tone: BSTATUS[c.interest]?.[0] ?? 'neutral' }, BSTATUS[c.interest]?.[1]() ?? c.interest)
        : h(Button, { size: 'sm', variant: 'cta', onClick: () => setWriting(c) }, t('Quan tâm', 'Interested'))) },
    ], rows: data.items, minWidth: 700, empty: h(Empty, { icon: 'sparkle', title: t('Chưa có chiến dịch nào đang mở', 'No open campaigns') }) }),
    mine.data?.items.some((i) => i.status === 'selected') ? h(Card, { title: t('Thương hiệu đã chọn bạn', 'Brands that picked you'), icon: 'seal-check' },
      mine.data.items.filter((i) => i.status === 'selected').map((i) => h('div', { key: i.id, className: 'op-feed-line' }, `${i.campaign.brandName} · ${i.campaign.title}`))) : null,
    writing ? h(Modal, { open: true, onClose: () => setWriting(null), title: `${writing.brandName} · ${writing.title}`,
      footer: h(Fragment, null, h(Button, { onClick: () => setWriting(null) }, t('Huỷ', 'Cancel')), h(Button, { variant: 'cta', onClick: send }, t('Gửi', 'Send'))) },
      h(Field, { label: t('Lời nhắn', 'Message'), optional: true }, h(TextArea, { value: msg, onChange: setMsg, rows: 4 }))) : null);
}

function Availability() {
  const { data, error, loading, reload } = useFetch('/me/artist/availability');
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setRows(data.items.map((w) => ({ from: w.from, to: w.to, kind: w.kind, city: w.city ?? '', note: w.note }))); }, [data]);
  if (error) return h(ErrorBox, { error, onRetry: reload });
  if (!rows) return h(Spinner);
  const set = (i, k) => (v) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const save = async () => {
    setBusy(true);
    try { const out = await put('/me/artist/availability', { items: rows.filter((r) => r.from && r.to).map((r) => ({ ...r, city: r.city || null })) }); toast(tx(out.message)); reload(true); }
    catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  return h(Card, { title: t('Lịch trống', 'Availability'), icon: 'calendar-check' },
    rows.map((r, i) => h('div', { key: i, className: 'op-form-grid', style: { marginBottom: 10 } },
      h(Field, { label: t('Từ', 'From') }, h(DateInput, { value: r.from, onChange: set(i, 'from') })),
      h(Field, { label: t('Đến', 'To') }, h(DateInput, { value: r.to, onChange: set(i, 'to') })),
      h(Field, { label: t('Trạng thái', 'Status') }, h(Select, { value: r.kind, onChange: (v) => set(i, 'kind')(v || 'available'), options: [{ value: 'available', label: t('Rảnh', 'Free') }, { value: 'unavailable', label: t('Bận', 'Busy') }] })),
      h(Field, { label: t('Ở', 'In'), optional: true }, h(Select, { value: r.city, onChange: (v) => set(i, 'city')(v || ''), placeholder: '—', options: cityOptions() })),
      h(Field, { label: t('Ghi chú', 'Note'), optional: true, aside: h(Button, { size: 'sm', variant: 'danger', icon: 'trash', onClick: () => setRows((rs) => rs.filter((_, j) => j !== i)) }) }, h(Input, { value: r.note, onChange: set(i, 'note') })))),
    h('div', { className: 'op-row-actions' },
      h(Button, { icon: 'plus', onClick: () => setRows((rs) => [...rs, { from: '', to: '', kind: 'available', city: '', note: '' }]) }, t('Thêm khoảng', 'Add dates')),
      h(Button, { variant: 'cta', icon: 'check', busy, onClick: save }, t('Lưu', 'Save'))));
}

export function ArtistOpportunities() {
  const [tab, setTab] = useQueryState('tab', 'open');
  return h(Fragment, null,
    h(PageHeader, { title: t('Cơ hội diễn', 'Opportunities') }),
    h(Tabs, { value: tab, onChange: setTab, items: [
      { value: 'open', icon: 'megaphone', label: t('Gig đang mở', 'Open gigs') },
      { value: 'mine', icon: 'paper-plane-tilt', label: t('Đã ứng tuyển', 'Applied') },
      { value: 'requests', icon: 'envelope-simple', label: t('Lời mời', 'Requests') },
      { value: 'dates', icon: 'calendar-check', label: t('Lịch trống', 'Availability') },
      { value: 'brands', icon: 'sparkle', label: t('Thương hiệu', 'Brands') },
    ] }),
    tab === 'mine' ? h(Mine) : tab === 'requests' ? h(Requests) : tab === 'dates' ? h(Availability) : tab === 'brands' ? h(Brands) : h(Open));
}
