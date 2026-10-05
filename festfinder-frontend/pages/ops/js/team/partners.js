/*
 * Team mode: ticket partners. Which sites each one sells on, how a link to them is tracked,
 * what a sale earns, and the sales each one has reported. Every ticket button goes out
 * through /go/<event>, so the clicks here are every click, partner or not.
 */
import { h, Fragment, useState, t, post, patch, useFetch, toast, errorText, stamp, num, href, navigate } from '../core.js';
import { PageHeader, Button, Pill, Spinner, ErrorBox, Empty, DataTable, Drawer, Field, Input, TextArea, Switch, Tabs, Card, Modal, Stat, KV, Select, ChipsInput } from '../ui.js';

const STATUS = {
  pending: ['neutral', () => t('Chờ duyệt', 'Pending')],
  approved: ['info', () => t('Đã duyệt', 'Approved')],
  rejected: ['danger', () => t('Bị huỷ', 'Rejected')],
  paid: ['ok', () => t('Đã nhận tiền', 'Paid')],
};
const amount = (n, currency) => `${num(n)} ${currency}`;
const paramsText = (p) => Object.entries(p ?? {}).map(([k, v]) => `${k}=${v}`).join('\n');
const paramsOf = (text) => Object.fromEntries(text.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
  const i = l.indexOf('=');
  return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : [l, ''];
}));

function copy(text) {
  navigator.clipboard?.writeText(text).then(() => toast(t('Đã chép', 'Copied')), () => toast(t('Không chép được', 'Could not copy'), 'error'));
}

function TokenModal({ token, partner, onClose }) {
  const url = partner.postbackUrl.replace('TOKEN', token);
  return h(Modal, { open: true, onClose, width: 640, title: t('Mã nhận báo cáo bán vé', 'Sale report token'),
    footer: h(Button, { variant: 'cta', icon: 'check', onClick: onClose }, t('Đã lưu mã', 'I have saved it')) },
  h('div', { className: 'op-banner op-banner--warn', style: { marginBottom: 12 } }, t('Mã chỉ hiện một lần.', 'This token is shown once.')),
  h(Field, { label: t('Mã', 'Token') }, h(Input, { value: token, onChange: () => {}, readOnly: true, suffix: h(Button, { size: 'sm', variant: 'quiet', icon: 'copy', onClick: () => copy(token) }) })),
  h(Field, { label: t('Địa chỉ gửi cho đối tác', 'Address to give the partner'), hint: t('Thay phần trong {} bằng macro của đối tác', 'Replace each {…} with the partner’s own macro') },
    h(TextArea, { value: url, onChange: () => {}, readOnly: true, rows: 3 })),
  h(Button, { icon: 'copy', onClick: () => copy(url) }, t('Chép địa chỉ', 'Copy address')));
}

function PartnerForm({ partner, preset, onClose, onSaved }) {
  const editing = !!partner?.id;
  const [f, setF] = useState(() => ({
    name: partner?.name ?? '', hosts: partner?.hosts ?? preset?.hosts ?? [], pct: String(partner?.commissionPct ?? 0),
    params: paramsText(partner?.linkParams ?? { utm_source: 'feestfinder', utm_medium: 'affiliate', sub1: '{click}' }),
    template: partner?.linkTemplate ?? '', notes: partner?.notes ?? '', enabled: partner?.enabled ?? true,
  }));
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const templateOk = !f.template.trim() || (/^https:\/\/\S+$/.test(f.template.trim()) && f.template.includes('{url}'));
  const pct = Number(f.pct);
  const ok = f.name.trim().length >= 2 && templateOk && pct >= 0 && pct <= 100;
  const save = async () => {
    setBusy(true);
    const body = { name: f.name.trim(), hosts: f.hosts, commissionPct: pct, linkParams: paramsOf(f.params), linkTemplate: f.template.trim() || null, notes: f.notes, enabled: f.enabled };
    try {
      const out = editing ? await patch(`/admin/partners/${partner.id}`, body) : await post('/admin/partners', body);
      toast(editing ? t('Đã lưu đối tác', 'Partner saved') : t('Đã thêm đối tác', 'Partner added'));
      onSaved(out);
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  return h(Drawer, {
    open: true, onClose, width: 600, title: editing ? partner.name : t('Thêm đối tác bán vé', 'Add a ticket partner'),
    footer: h(Fragment, null, h(Button, { onClick: onClose }, t('Huỷ', 'Cancel')), h('span', { className: 'op-spacer' }),
      h(Button, { variant: 'cta', icon: 'check', busy, disabled: !ok, onClick: save }, editing ? t('Lưu', 'Save') : t('Thêm đối tác', 'Add partner'))),
  },
  h('div', { className: 'op-form-grid' },
    h(Field, { label: t('Tên', 'Name'), required: true, className: 'is-wide' }, h(Input, { value: f.name, onChange: set('name'), placeholder: 'Ticketbox', autoFocus: !editing })),
    h(Field, { label: t('Trang bán vé', 'Sells on'), className: 'is-wide', hint: 'ticketbox.vn, megatix.vn' }, h(ChipsInput, { value: f.hosts, onChange: set('hosts'), placeholder: 'ticketbox.vn' })),
    h(Field, { label: t('Hoa hồng (%)', 'Commission (%)') }, h(Input, { value: f.pct, onChange: set('pct'), inputMode: 'decimal', invalid: !(pct >= 0 && pct <= 100) })),
    h(Switch, { checked: f.enabled, onChange: set('enabled'), label: t('Đang bật', 'Enabled') }),
    h(Field, { label: t('Tham số thêm vào link', 'Parameters added to the link'), className: 'is-wide', hint: t('Mỗi dòng một cặp khoá=giá trị. {click} là mã lượt bấm.', 'One key=value a line. {click} is the click’s id.') },
      h(TextArea, { value: f.params, onChange: set('params'), rows: 4 })),
    h(Field, { label: t('Link theo dõi của mạng affiliate', 'Affiliate network tracking link'), optional: true, className: 'is-wide', error: templateOk ? null : t('Link https có chứa {url}', 'An https link containing {url}'), hint: 'https://…?url={url}&sub={click}' },
      h(Input, { value: f.template, onChange: set('template'), icon: 'link', placeholder: 'https://', invalid: !templateOk })),
    h(Field, { label: t('Ghi chú', 'Notes'), optional: true, className: 'is-wide' }, h(TextArea, { value: f.notes, onChange: set('notes'), rows: 3 }))));
}

function PartnerDetail({ partner, onClose, onEdit, onChanged }) {
  const [tab, setTab] = useState('sales');
  const [status, setStatus] = useState('');
  const conv = useFetch(`/admin/partners/${partner.id}/conversions${status ? `?status=${status}` : ''}`, [partner.id, status]);
  const [token, setToken] = useState(null);
  const [busy, setBusy] = useState(false);
  const rotate = async () => {
    setBusy(true);
    try { const out = await post(`/admin/partners/${partner.id}/token`); setToken(out.token); onChanged(); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  const settle = async (c, next) => {
    try { await patch(`/admin/conversions/${c.id}`, { status: next }); conv.reload(true); onChanged(); } catch (e) { toast(errorText(e), 'error'); }
  };
  const cols = [
    { key: 'when', label: t('Lúc', 'When'), width: 140, render: (c) => h('div', null, h('div', null, stamp(c.occurredAt, true)), h('small', { className: 'op-cell-muted' }, c.orderRef)) },
    { key: 'event', label: t('Sự kiện', 'Event'), render: (c) => c.event
      ? h('a', { className: 'op-cell-title', href: href('events', c.event.id), onClick: (e) => { e.preventDefault(); navigate(href('events', c.event.id)); } }, c.event.title)
      : h('span', { className: 'op-cell-muted' }, t('Không khớp lượt bấm', 'No matching click')) },
    { key: 'amount', label: t('Giá trị', 'Sale'), align: 'right', render: (c) => h('div', { className: 'op-cell-num' }, h('div', null, amount(c.amount, c.currency)), h('small', { className: 'op-cell-muted' }, amount(c.commission, c.currency))) },
    { key: 'status', label: t('Trạng thái', 'Status'), width: 170, render: (c) => h(Select, { value: c.status, onChange: (v) => settle(c, v), options: Object.keys(STATUS).map((k) => ({ value: k, label: STATUS[k][1]() })) }) },
  ];
  const top = conv.data?.topEvents ?? [];
  return h(Drawer, {
    open: true, onClose, width: 860, title: partner.name, sub: partner.hosts.join(' · ') || t('Chưa có trang bán vé', 'No sites yet'),
    footer: h(Fragment, null,
      h(Button, { icon: 'key', busy, onClick: rotate }, t('Tạo mã mới', 'New token')),
      h('span', { className: 'op-spacer' }),
      h(Button, { variant: 'cta', icon: 'pencil-simple', onClick: onEdit }, t('Sửa', 'Edit'))),
  },
  h(KV, { items: [
    [t('Hoa hồng', 'Commission'), `${partner.commissionPct}%`],
    [t('Lượt bấm 30 ngày', 'Clicks, 30 days'), num(partner.clicks30)],
    [t('Link mẫu', 'Example link'), h('code', { className: 'op-code-inline' }, partner.example), true],
    [t('Địa chỉ nhận báo cáo', 'Sale report address'), h('code', { className: 'op-code-inline' }, partner.postbackUrl), true],
  ] }),
  h(Tabs, { value: tab, onChange: setTab, items: [
    { value: 'sales', icon: 'receipt', label: t('Đơn bán', 'Sales'), count: conv.data?.items.length },
    { value: 'events', icon: 'calendar-dots', label: t('Sự kiện được bấm nhiều', 'Most clicked'), count: top.length },
  ] }),
  tab === 'sales' ? h(Fragment, null,
    h('div', { style: { margin: '8px 0 12px', maxWidth: 220 } }, h(Select, { value: status, onChange: setStatus, placeholder: t('Mọi trạng thái', 'Every status'), options: Object.keys(STATUS).map((k) => ({ value: k, label: STATUS[k][1]() })) })),
    conv.loading && !conv.data ? h(Spinner) : conv.error ? h(ErrorBox, { error: conv.error }) : h(DataTable, { columns: cols, rows: conv.data?.items ?? [], minWidth: 700, empty: h(Empty, { icon: 'receipt', title: t('Chưa có đơn nào', 'No sales yet') }) }))
    : h(DataTable, { columns: [
      { key: 'title', label: t('Sự kiện', 'Event'), render: (e) => h('a', { className: 'op-cell-title', href: href('events', e.id), onClick: (x) => { x.preventDefault(); navigate(href('events', e.id)); } }, e.title) },
      { key: 'clicks', label: t('Lượt bấm', 'Clicks'), align: 'right', width: 100, render: (e) => num(e.clicks) },
    ], rows: top, minWidth: 500, empty: h(Empty, { icon: 'cursor-click', title: t('Chưa có lượt bấm', 'No clicks yet') }) }),
  token ? h(TokenModal, { token, partner, onClose: () => setToken(null) }) : null);
}

export function Partners() {
  const { data, error, loading, reload } = useFetch('/admin/partners');
  const [form, setForm] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [made, setMade] = useState(null);
  const items = data?.items ?? [];
  const open = items.find((p) => p.id === openId) ?? null;
  const out = data?.outbound ?? {};
  const columns = [
    { key: 'name', label: t('Đối tác', 'Partner'), render: (p) => h('div', null, h('div', { className: 'op-cell-title' }, p.name), h('div', { className: 'op-cell-sub' }, p.hosts.join(', ') || '—')) },
    { key: 'pct', label: t('Hoa hồng', 'Commission'), align: 'right', width: 110, render: (p) => `${p.commissionPct}%` },
    { key: 'clicks', label: t('Bấm · 30 ngày', 'Clicks · 30d'), align: 'right', width: 120, render: (p) => num(p.clicks30) },
    { key: 'sales', label: t('Đơn', 'Orders'), align: 'right', width: 90, render: (p) => num(p.totals.reduce((n, x) => n + x.orders, 0)) },
    { key: 'earned', label: t('Hoa hồng đã duyệt', 'Earned'), align: 'right', width: 170, render: (p) => (p.totals.length ? h('div', { className: 'op-cell-num' },
      p.totals.map((x) => h('div', { key: x.currency }, amount(x.earned, x.currency), x.pending ? h('small', { className: 'op-cell-muted' }, ` · ${amount(x.pending, x.currency)} ${t('chờ', 'pending')}`) : null))) : '—') },
    { key: 'state', label: '', width: 110, render: (p) => (p.enabled ? h(Pill, { tone: 'ok' }, t('Đang bật', 'On')) : h(Pill, null, t('Đang tắt', 'Off'))) },
  ];
  return h(Fragment, null,
    h(PageHeader, {
      title: t('Đối tác bán vé', 'Ticket partners'),
      actions: h(Button, { variant: 'cta', icon: 'plus', onClick: () => setForm({}) }, t('Thêm đối tác', 'Add partner')),
    }),
    error ? h(ErrorBox, { error, onRetry: reload }) : null,
    !data ? (loading ? h(Spinner) : null) : h(Fragment, null,
      h('div', { className: 'op-stats op-stats--compact' },
        h(Stat, { label: t('Sang đối tác · 30 ngày', 'To partners · 30d'), value: num(out.partner ?? 0) }),
        h(Stat, { label: t('Sang trang nhà tổ chức', 'To organisers’ links'), value: num(out.organizer ?? 0) }),
        h(Stat, { label: t('Vào checkout FeestFinder', 'To FeestFinder checkout'), value: num(out.checkout ?? 0) })),
      data.topUncovered.length ? h(Card, { title: t('Trang bán vé chưa có đối tác', 'Sites without a partner'), icon: 'handshake' },
        data.topUncovered.map((x) => h('div', { key: x.host, className: 'op-feed-line', style: { display: 'flex', alignItems: 'center', gap: 12 } },
          h('strong', { style: { flex: 1 } }, x.host), h('span', { className: 'op-cell-muted' }, t(`${num(x.n)} lượt bấm`, `${num(x.n)} clicks`)),
          h(Button, { size: 'sm', icon: 'plus', onClick: () => setForm({ preset: { hosts: [x.host] } }) }, t('Thêm', 'Add'))))) : null,
      h(DataTable, { columns, rows: items, onRowClick: (p) => setOpenId(p.id), minWidth: 860,
        empty: h(Empty, { icon: 'handshake', title: t('Chưa có đối tác nào', 'No partners yet'), action: h(Button, { variant: 'cta', icon: 'plus', onClick: () => setForm({}) }, t('Thêm đối tác', 'Add partner')) }) })),
    form ? h(PartnerForm, { key: form.partner?.id ?? 'new', partner: form.partner, preset: form.preset, onClose: () => setForm(null),
      onSaved: (p) => { setForm(null); reload(true); if (p.token) setMade(p); } }) : null,
    open ? h(PartnerDetail, { key: open.id, partner: open, onClose: () => setOpenId(null), onEdit: () => setForm({ partner: open }), onChanged: () => reload(true) }) : null,
    made ? h(TokenModal, { token: made.token, partner: made, onClose: () => setMade(null) }) : null);
}
