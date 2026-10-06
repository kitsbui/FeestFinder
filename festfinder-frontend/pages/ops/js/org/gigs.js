/*
 * Organizer mode: gigs. Post a slot, read applications best fit first (a fixed score, never
 * follower counts), shortlist or book; and ask an artist directly. Fees are only a starting
 * point: no money moves through FeestFinder here.
 */
import { h, Fragment, useState, t, tx, get, post, useFetch, useQueryState, toast, errorText, num, day, store } from '../core.js';
import { PageHeader, Button, Pill, Spinner, ErrorBox, Empty, DataTable, Drawer, Field, Input, TextArea, Select, DateInput, Combobox, Switch, Tabs, Card } from '../ui.js';
import { cityOptions, styleOptions } from '../opts.js';

const fee = (min, max, currency) => (min == null && max == null ? '—' : [min, max].filter((x) => x != null).map(num).join(' – ') + ` ${currency}`);
const GIG_TYPES = [['club', 'Club'], ['festival', () => t('Lễ hội', 'Festival')], ['rave', 'Rave'], ['concert', 'Concert'], ['brand_event', () => t('Sự kiện thương hiệu', 'Brand event')],
  ['private', () => t('Riêng tư', 'Private')], ['support', () => t('Diễn mở màn', 'Support slot')], ['headline', () => t('Diễn chính', 'Headline')], ['b2b', 'B2B']];
const lbl = (x) => (typeof x === 'function' ? x() : x);
const APP_STATUS = {
  sent: ['neutral', () => t('Mới', 'New')], shortlisted: ['info', () => t('Danh sách chọn', 'Shortlisted')],
  declined: ['danger', () => t('Đã từ chối', 'Declined')], booked: ['ok', () => t('Đã chốt', 'Booked')], withdrawn: ['muted', () => t('Đã rút', 'Withdrawn')],
};
const GIG_STATUS = { open: ['ok', () => t('Đang mở', 'Open')], closed: ['neutral', () => t('Đã đóng', 'Closed')], filled: ['info', () => t('Đã chốt', 'Filled')] };
const pill = (map, k) => h(Pill, { tone: map[k]?.[0] ?? 'neutral' }, map[k]?.[1]() ?? k);

function GigForm({ onClose, onSaved }) {
  const [f, setF] = useState({ title: '', description: '', city: 'ho-chi-minh', startsOn: '', styles: [], gigType: '', feeMin: '', feeMax: '', travelCovered: false, closesOn: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const ok = f.title.trim().length >= 3 && f.startsOn && f.city;
  const save = async () => {
    setBusy(true);
    try {
      await post('/organizer/gigs', {
        title: f.title.trim(), description: f.description.trim(), city: f.city, startsOn: f.startsOn, styles: f.styles, gigType: f.gigType || null,
        feeMin: f.feeMin === '' ? null : Number(f.feeMin), feeMax: f.feeMax === '' ? null : Number(f.feeMax), travelCovered: f.travelCovered, closesOn: f.closesOn || null,
      });
      toast(t('Đã đăng gig', 'Gig posted'));
      onSaved();
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  return h(Drawer, {
    open: true, onClose, width: 600, title: t('Đăng gig', 'Post a gig'),
    footer: h(Fragment, null, h(Button, { onClick: onClose }, t('Huỷ', 'Cancel')), h('span', { className: 'op-spacer' }), h(Button, { variant: 'cta', icon: 'check', busy, disabled: !ok, onClick: save }, t('Đăng', 'Post'))),
  },
  h('div', { className: 'op-form-grid' },
    h(Field, { label: t('Tiêu đề', 'Title'), required: true, className: 'is-wide' }, h(Input, { value: f.title, onChange: set('title'), autoFocus: true })),
    h(Field, { label: t('Thành phố', 'City'), required: true }, h(Select, { value: f.city, onChange: (v) => set('city')(v || 'ho-chi-minh'), options: cityOptions() })),
    h(Field, { label: t('Ngày diễn', 'Date'), required: true }, h(DateInput, { value: f.startsOn, onChange: set('startsOn') })),
    h(Field, { label: t('Dòng nhạc', 'Styles'), optional: true, className: 'is-wide' }, h(Combobox, { value: null, options: styleOptions(), placeholder: f.styles.length ? f.styles.join(', ') : t('Thêm dòng nhạc', 'Add a style'),
      onChange: (v) => v && !f.styles.includes(v) && f.styles.length < 6 && set('styles')([...f.styles, v]) })),
    f.styles.length ? h('div', { className: 'op-quick is-wide' }, f.styles.map((s) => h('button', { key: s, type: 'button', className: 'op-chip is-on', onClick: () => set('styles')(f.styles.filter((x) => x !== s)) }, s, ' ×'))) : null,
    h(Field, { label: t('Loại gig', 'Kind of gig'), optional: true }, h(Select, { value: f.gigType, onChange: (v) => set('gigType')(v || ''), placeholder: '—', options: GIG_TYPES.map(([k, l]) => ({ value: k, label: lbl(l) })) })),
    h(Field, { label: t('Hạn nhận hồ sơ', 'Applications close'), optional: true }, h(DateInput, { value: f.closesOn, onChange: set('closesOn') })),
    h(Field, { label: t('Phí từ', 'Fee from'), optional: true }, h(Input, { value: f.feeMin, onChange: (v) => set('feeMin')(v.replace(/\D/g, '')), inputMode: 'numeric' })),
    h(Field, { label: t('Phí đến', 'Fee up to'), optional: true }, h(Input, { value: f.feeMax, onChange: (v) => set('feeMax')(v.replace(/\D/g, '')), inputMode: 'numeric' })),
    h(Field, { label: t('Mô tả', 'Description'), optional: true, className: 'is-wide' }, h(TextArea, { value: f.description, onChange: set('description'), rows: 4 })),
    h(Switch, { checked: f.travelCovered, onChange: set('travelCovered'), label: t('Lo đi lại', 'Travel covered') })));
}

function Applications({ gig, onClose, onChanged }) {
  const { data, error, loading, reload } = useFetch(`/organizer/gigs/${gig.id}/applications`, [gig.id]);
  const [busy, setBusy] = useState(null);
  const decide = async (a, status) => {
    setBusy(a.id + status);
    try { await post(`/organizer/gigs/${gig.id}/applications/${a.id}`, { status }); reload(true); onChanged(); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(null); }
  };
  const columns = [
    { key: 'artist', label: t('Nghệ sĩ', 'Artist'), width: 220, render: (a) => h('div', null, h('a', { href: `/a/${a.artist.slug}`, target: '_blank', rel: 'noopener' }, a.artist.name),
      h('div', { className: 'op-cell-sub' }, [a.artist.roles.map((r) => tx(r.label)).join(' / '), a.artist.basedIn ? tx(a.artist.basedIn) : ''].filter(Boolean).join(' · '))) },
    { key: 'fit', label: t('Phù hợp', 'Fit'), width: 80, align: 'right', render: (a) => `${a.matchScore}/100` },
    { key: 'msg', label: t('Lời nhắn', 'Message'), width: 240, render: (a) => h('div', { style: { whiteSpace: 'pre-wrap' } }, a.message || '—') },
    { key: 'act', label: '', width: 260, align: 'right', render: (a) => a.status === 'booked' || a.status === 'declined' ? pill(APP_STATUS, a.status) : h('div', { className: 'op-row-actions' },
      a.status === 'sent' ? h(Button, { size: 'sm', busy: busy === a.id + 'shortlisted', onClick: () => decide(a, 'shortlisted') }, t('Chọn', 'Shortlist')) : pill(APP_STATUS, a.status),
      h(Button, { size: 'sm', variant: 'ok', icon: 'check', busy: busy === a.id + 'booked', onClick: () => decide(a, 'booked') }, t('Chốt', 'Book')),
      h(Button, { size: 'sm', variant: 'danger', busy: busy === a.id + 'declined', onClick: () => decide(a, 'declined') }, t('Từ chối', 'Decline'))) },
  ];
  return h(Drawer, { open: true, onClose, width: 860, title: gig.title, sub: `${day(gig.startsOn)} · ${tx(gig.cityLabel)}` },
    error ? h(ErrorBox, { error, onRetry: reload }) : loading && !data ? h(Spinner)
      : h(DataTable, { columns, rows: data.items, minWidth: 780, empty: h(Empty, { icon: 'microphone-stage', title: t('Chưa có hồ sơ nào', 'No applications yet') }) }));
}

function Inquiries() {
  const { data, error, loading, reload } = useFetch('/organizer/inquiries', [store.orgId]);
  const [f, setF] = useState({ artistId: null, artistName: '', eventOn: '', city: 'ho-chi-minh', message: '', feeOffer: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const send = async () => {
    setBusy(true);
    try {
      const out = await post('/organizer/inquiries', { artistId: f.artistId, eventOn: f.eventOn, city: f.city, message: f.message.trim(), feeOffer: f.feeOffer === '' ? null : Number(f.feeOffer) });
      toast(tx(out.message));
      setF({ artistId: null, artistName: '', eventOn: '', city: 'ho-chi-minh', message: '', feeOffer: '' });
      reload(true);
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  const STATUS = { sent: ['neutral', () => t('Đã gửi', 'Sent')], accepted: ['ok', () => t('Đồng ý trao đổi', 'Interested')], declined: ['danger', () => t('Từ chối', 'Declined')], withdrawn: ['muted', () => t('Đã rút', 'Withdrawn')] };
  return h(Fragment, null,
    h(Card, { title: t('Mời nghệ sĩ', 'Ask an artist'), icon: 'paper-plane-tilt' },
      h('div', { className: 'op-form-grid' },
        h(Field, { label: t('Nghệ sĩ', 'Artist'), required: true }, h(Combobox, { value: f.artistId, valueLabel: f.artistName, placeholder: t('Tìm nghệ sĩ…', 'Find an artist…'), icon: 'microphone-stage',
          load: async (q) => (await get('/artists?limit=20' + (q ? `&q=${encodeURIComponent(q)}` : ''))).items.map((a) => ({ value: a.id, label: a.name })),
          onChange: (v, o) => setF((x) => ({ ...x, artistId: v ?? null, artistName: o?.label ?? '' })) })),
        h(Field, { label: t('Ngày', 'Date'), required: true }, h(DateInput, { value: f.eventOn, onChange: set('eventOn') })),
        h(Field, { label: t('Thành phố', 'City'), required: true }, h(Select, { value: f.city, onChange: (v) => set('city')(v || 'ho-chi-minh'), options: cityOptions() })),
        h(Field, { label: t('Phí đề xuất', 'Fee offer'), optional: true }, h(Input, { value: f.feeOffer, onChange: (v) => set('feeOffer')(v.replace(/\D/g, '')), inputMode: 'numeric' })),
        h(Field, { label: t('Lời nhắn', 'Message'), required: true, className: 'is-wide' }, h(TextArea, { value: f.message, onChange: set('message'), rows: 3 }))),
      h('div', { className: 'op-row-actions', style: { marginTop: 12 } }, h(Button, { variant: 'cta', icon: 'paper-plane-tilt', busy, disabled: !f.artistId || !f.eventOn || f.message.trim().length < 10, onClick: send }, t('Gửi lời mời', 'Send request')))),
    error ? h(ErrorBox, { error, onRetry: reload }) : loading && !data ? h(Spinner) : h(DataTable, { columns: [
      { key: 'artist', label: t('Nghệ sĩ', 'Artist'), width: 200, render: (i) => i.artist.name },
      { key: 'when', label: t('Ngày', 'Date'), width: 180, render: (i) => `${day(i.eventOn)} · ${tx(i.cityLabel)}` },
      { key: 'fee', label: t('Phí', 'Fee'), width: 150, align: 'right', render: (i) => fee(i.feeOffer, null, i.currency) },
      { key: 'state', label: '', width: 260, render: (i) => h('div', null, pill(STATUS, i.status), i.reply ? h('div', { className: 'op-cell-sub' }, i.reply) : null) },
    ], rows: data.items, minWidth: 800, empty: h(Empty, { icon: 'paper-plane-tilt', title: t('Chưa gửi lời mời nào', 'No requests sent') }) }));
}

export function OrgGigs() {
  const [tab, setTab] = useQueryState('tab', 'gigs');
  const { data, error, loading, reload } = useFetch('/organizer/gigs', [store.orgId]);
  const [form, setForm] = useState(false);
  const [open, setOpen] = useState(null);
  const columns = [
    { key: 'title', label: 'Gig', width: 260, render: (g) => h('div', null, h('div', { className: 'op-cell-title' }, g.title), h('div', { className: 'op-cell-sub' }, `${day(g.startsOn)} · ${tx(g.cityLabel)}`)) },
    { key: 'fee', label: t('Phí', 'Fee'), width: 200, align: 'right', render: (g) => fee(g.feeMin, g.feeMax, g.currency) },
    { key: 'apps', label: t('Hồ sơ', 'Applications'), width: 110, align: 'right', render: (g) => num(g.applications) },
    { key: 'state', label: '', width: 120, render: (g) => pill(GIG_STATUS, g.status) },
  ];
  return h(Fragment, null,
    h(PageHeader, { title: 'Gigs', actions: h(Button, { variant: 'cta', icon: 'plus', onClick: () => setForm(true) }, t('Đăng gig', 'Post a gig')) }),
    h(Tabs, { value: tab, onChange: setTab, items: [{ value: 'gigs', icon: 'megaphone', label: t('Gig đã đăng', 'Posted gigs') }, { value: 'inquiries', icon: 'paper-plane-tilt', label: t('Lời mời', 'Requests') }] }),
    tab === 'inquiries' ? h(Inquiries) : error ? h(ErrorBox, { error, onRetry: reload }) : loading && !data ? h(Spinner)
      : h(DataTable, { columns, rows: data.items, onRowClick: (g) => setOpen(g), minWidth: 760, empty: h(Empty, { icon: 'megaphone', title: t('Chưa đăng gig nào', 'No gigs yet') }) }),
    form ? h(GigForm, { onClose: () => setForm(false), onSaved: () => { setForm(false); reload(true); } }) : null,
    open ? h(Applications, { gig: open, onClose: () => setOpen(null), onChanged: () => reload(true) }) : null);
}
