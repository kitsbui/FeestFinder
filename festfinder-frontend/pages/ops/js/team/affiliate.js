/*
 * Team mode: affiliate links and the money side of partners. Short /go/link/<code> links for
 * merch, products and campaigns; where every click came from (placement, device, country);
 * and payouts, which settle a partner's approved sales over a period exactly once.
 */
import { h, Fragment, useState, t, post, patch, useFetch, useQueryState, toast, errorText, num, stamp, day } from '../core.js';
import { PageHeader, Button, Pill, Spinner, ErrorBox, Empty, DataTable, Drawer, Field, Input, Select, Switch, Tabs, Card, Stat, DateInput } from '../ui.js';

const KIND = {
  artist: () => t('Nghệ sĩ', 'Artist'), product: () => t('Sản phẩm', 'Product'), brand: () => t('Thương hiệu', 'Brand'),
  campaign: () => t('Chiến dịch', 'Campaign'), partner: () => t('Đối tác', 'Partner'),
};
const PLACEMENT = {
  detail: () => t('Trang sự kiện', 'Event page'), tier: () => t('Hạng vé', 'Ticket tier'), hero: () => t('Ảnh bìa', 'Hero'), card: () => t('Thẻ sự kiện', 'Event card'),
  map: () => t('Bản đồ', 'Map'), list: () => t('Danh sách', 'List'), app: () => t('Ứng dụng', 'App'), link: () => t('Liên kết', 'Link'),
  artist: () => t('Trang nghệ sĩ', 'Artist page'), organizer: () => t('Trang BTC', 'Organiser page'), email: () => 'Email', external: () => t('Bên ngoài', 'Outside'),
};
const DEVICE = { mobile: () => t('Điện thoại', 'Phone'), tablet: () => t('Máy tính bảng', 'Tablet'), desktop: () => t('Máy tính', 'Desktop') };
const label = (map, k) => (k && map[k] ? map[k]() : k || t('Không rõ', 'Unknown'));

function Breakdown({ title, icon, rows, map }) {
  const total = rows.reduce((a, r) => a + r.n, 0) || 1;
  return h(Card, { title, icon },
    rows.length ? rows.map((r) => h('div', { key: String(r.key ?? r.id ?? r.code), className: 'op-feed-line', style: { display: 'flex', gap: 12 } },
      h('span', { style: { flex: 1 } }, map ? label(map, r.key) : r.key ?? r.label ?? r.name ?? t('Không rõ', 'Unknown')),
      h('span', { className: 'op-cell-muted' }, `${num(r.n)} · ${Math.round((r.n / total) * 100)}%`)))
      : h('div', { className: 'op-cell-muted' }, t('Chưa có lượt bấm', 'No clicks yet')));
}

function Summary() {
  const [days, setDays] = useQueryState('days', '30');
  const { data, error, loading, reload } = useFetch(`/admin/affiliate/summary?days=${days}`, [days]);
  if (error) return h(ErrorBox, { error, onRetry: reload });
  if (loading && !data) return h(Spinner);
  return h(Fragment, null,
    h('div', { style: { margin: '8px 0 12px', maxWidth: 200 } }, h(Select, { value: days, onChange: (v) => setDays(v || '30'), options: [
      { value: '7', label: t('7 ngày', '7 days') }, { value: '30', label: t('30 ngày', '30 days') }, { value: '90', label: t('90 ngày', '90 days') }] })),
    h('div', { className: 'op-stats op-stats--compact' },
      h(Stat, { label: t('Lượt bấm', 'Clicks'), value: num(data.clicks) }),
      ...data.sales.map((s) => h(Stat, { key: s.partner.id + s.currency, label: `${s.partner.name} · ${t('chưa chốt', 'unsettled')}`, value: `${num(s.unsettled)} ${s.currency}` }))),
    h('div', { className: 'op-grid op-grid--2' },
      h(Breakdown, { title: t('Vị trí bấm', 'Placement'), icon: 'cursor-click', rows: data.byPlacement, map: PLACEMENT }),
      h(Breakdown, { title: t('Thiết bị', 'Device'), icon: 'device-mobile', rows: data.byDevice, map: DEVICE }),
      h(Breakdown, { title: t('Quốc gia', 'Country'), icon: 'globe-hemisphere-east', rows: data.byCountry }),
      h(Breakdown, { title: t('Liên kết', 'Links'), icon: 'link', rows: data.byLink.map((l) => ({ ...l, key: `${l.label} · ${l.code}` })) })));
}

function LinkForm({ link, onClose, onSaved }) {
  const [f, setF] = useState(() => ({ label: link?.label ?? '', destinationUrl: link?.destinationUrl ?? 'https://', code: link?.code ?? '', kind: link?.kind ?? 'campaign', enabled: link?.enabled ?? true }));
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const ok = f.label.trim().length >= 2 && /^https:\/\/\S+\.\S+/.test(f.destinationUrl) && (!f.code || /^[a-z0-9-]{3,40}$/.test(f.code));
  const save = async () => {
    setBusy(true);
    try {
      const body = { label: f.label.trim(), destinationUrl: f.destinationUrl.trim(), kind: f.kind, enabled: f.enabled, ...(f.code ? { code: f.code } : {}) };
      const out = link ? await patch(`/admin/affiliate/links/${link.id}`, body) : await post('/admin/affiliate/links', body);
      toast(t('Đã lưu', 'Saved'));
      onSaved(out);
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  return h(Drawer, {
    open: true, onClose, width: 520, title: link ? link.label : t('Thêm liên kết', 'Add a link'),
    footer: h(Fragment, null, h(Button, { onClick: onClose }, t('Huỷ', 'Cancel')), h('span', { className: 'op-spacer' }), h(Button, { variant: 'cta', icon: 'check', busy, disabled: !ok, onClick: save }, t('Lưu', 'Save'))),
  },
  h('div', { className: 'op-form-grid op-form-grid--one' },
    h(Field, { label: t('Tên', 'Name'), required: true }, h(Input, { value: f.label, onChange: set('label'), autoFocus: !link })),
    h(Field, { label: t('Đích đến', 'Destination'), required: true }, h(Input, { value: f.destinationUrl, onChange: set('destinationUrl'), icon: 'link' })),
    h(Field, { label: t('Mã', 'Code'), optional: true, hint: 'a-z 0-9 -' }, h(Input, { value: f.code, onChange: (v) => set('code')(v.toLowerCase()), placeholder: 'tet-2027' })),
    h(Field, { label: t('Loại', 'Kind') }, h(Select, { value: f.kind, onChange: (v) => set('kind')(v || 'campaign'), options: Object.keys(KIND).map((k) => ({ value: k, label: KIND[k]() })) })),
    h(Switch, { checked: f.enabled, onChange: set('enabled'), label: t('Đang bật', 'On') })));
}

function Links() {
  const { data, error, loading, reload } = useFetch('/admin/affiliate/links');
  const [form, setForm] = useState(null);
  const copy = async (url) => { try { await navigator.clipboard.writeText(url); toast(t('Đã chép', 'Copied')); } catch { toast(url); } };
  const columns = [
    { key: 'label', label: t('Liên kết', 'Link'), width: 260, render: (l) => h('div', null, h('div', { className: 'op-cell-title' }, l.label),
      h('div', { className: 'op-cell-sub' }, l.destinationUrl.replace(/^https:\/\//, '').slice(0, 60))) },
    { key: 'code', label: t('Mã', 'Code'), width: 180, render: (l) => h(Button, { size: 'sm', icon: 'copy', onClick: (e) => { e.stopPropagation(); copy(l.url); } }, l.code) },
    { key: 'kind', label: t('Loại', 'Kind'), width: 120, render: (l) => label(KIND, l.kind) },
    { key: 'owner', label: t('Thuộc về', 'For'), width: 160, render: (l) => l.artist?.name ?? l.organizer?.name ?? l.partner?.name ?? '—' },
    { key: 'clicks', label: t('Bấm · 30 ngày', 'Clicks · 30d'), width: 120, align: 'right', render: (l) => num(l.clicks30) },
    { key: 'state', label: '', width: 100, render: (l) => (l.enabled ? h(Pill, { tone: 'ok' }, t('Đang bật', 'On')) : h(Pill, null, t('Đang tắt', 'Off'))) },
  ];
  return h(Fragment, null,
    h('div', { className: 'op-row-actions', style: { margin: '8px 0 12px' } }, h(Button, { variant: 'cta', icon: 'plus', onClick: () => setForm({}) }, t('Thêm liên kết', 'Add a link'))),
    error ? h(ErrorBox, { error, onRetry: reload }) : loading && !data ? h(Spinner)
      : h(DataTable, { columns, rows: data.items, onRowClick: (l) => setForm({ link: l }), minWidth: 940, empty: h(Empty, { icon: 'link', title: t('Chưa có liên kết nào', 'No links yet') }) }),
    form ? h(LinkForm, { key: form.link?.id ?? 'new', link: form.link, onClose: () => setForm(null), onSaved: () => { setForm(null); reload(true); } }) : null);
}

function Payouts() {
  const { data, error, loading, reload } = useFetch('/admin/affiliate/payouts');
  const partners = useFetch('/admin/partners');
  const [f, setF] = useState({ partnerId: '', from: '', to: '' });
  const [busy, setBusy] = useState(null);
  const make = async () => {
    setBusy('new');
    try {
      await post('/admin/affiliate/payouts', f);
      toast(t('Đã chốt kỳ', 'Period settled'));
      setF({ partnerId: '', from: '', to: '' });
      reload(true);
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(null); }
  };
  const paid = async (p) => {
    setBusy(p.id);
    try { await post(`/admin/affiliate/payouts/${p.id}/paid`); reload(true); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(null); }
  };
  const columns = [
    { key: 'partner', label: t('Đối tác', 'Partner'), width: 180, render: (p) => p.partner.name },
    { key: 'period', label: t('Kỳ', 'Period'), width: 200, render: (p) => `${day(p.from)} → ${day(p.to)}` },
    { key: 'n', label: t('Đơn', 'Orders'), width: 90, align: 'right', render: (p) => num(p.conversions) },
    { key: 'c', label: t('Hoa hồng', 'Commission'), width: 160, align: 'right', render: (p) => `${num(p.commission)} ${p.currency}` },
    { key: 'csv', label: '', width: 90, align: 'right', render: (p) => h(Button, { size: 'sm', icon: 'download-simple', href: `/admin/affiliate/payouts/${p.id}/export.csv` }, 'CSV') },
    { key: 'state', label: '', width: 200, align: 'right', render: (p) => p.status === 'paid'
      ? h(Pill, { tone: 'ok' }, t('Đã nhận tiền', 'Paid'), p.paidAt ? ` · ${stamp(p.paidAt)}` : '')
      : h(Button, { size: 'sm', variant: 'ok', icon: 'check', busy: busy === p.id, onClick: () => paid(p) }, t('Đã nhận tiền', 'Mark paid')) },
  ];
  return h(Fragment, null,
    h(Card, { title: t('Chốt kỳ thanh toán', 'Settle a period'), icon: 'receipt' },
      h('div', { className: 'op-form-grid' },
        h(Field, { label: t('Đối tác', 'Partner'), required: true }, h(Select, { value: f.partnerId, onChange: (v) => setF((x) => ({ ...x, partnerId: v || '' })), options: (partners.data?.items ?? []).map((p) => ({ value: p.id, label: p.name })) })),
        h(Field, { label: t('Từ ngày', 'From'), required: true }, h(DateInput, { value: f.from, onChange: (v) => setF((x) => ({ ...x, from: v })) })),
        h(Field, { label: t('Đến ngày', 'To'), required: true }, h(DateInput, { value: f.to, onChange: (v) => setF((x) => ({ ...x, to: v })) }))),
      h('div', { className: 'op-row-actions', style: { marginTop: 12 } }, h(Button, { variant: 'cta', icon: 'check', busy: busy === 'new', disabled: !f.partnerId || !f.from || !f.to, onClick: make }, t('Chốt kỳ', 'Settle')))),
    error ? h(ErrorBox, { error, onRetry: reload }) : loading && !data ? h(Spinner)
      : h(DataTable, { columns, rows: data.items, minWidth: 930, empty: h(Empty, { icon: 'receipt', title: t('Chưa chốt kỳ nào', 'No payouts yet') }) }));
}

export function Affiliate() {
  const [tab, setTab] = useQueryState('tab', 'summary');
  return h(Fragment, null,
    h(PageHeader, { title: t('Affiliate', 'Affiliate') }),
    h(Tabs, { value: tab, onChange: setTab, items: [
      { value: 'summary', icon: 'chart-bar', label: t('Tổng quan', 'Overview') },
      { value: 'links', icon: 'link', label: t('Liên kết', 'Links') },
      { value: 'payouts', icon: 'receipt', label: t('Thanh toán', 'Payouts') },
    ] }),
    tab === 'links' ? h(Links) : tab === 'payouts' ? h(Payouts) : h(Summary));
}
