/*
 * Team mode: orders, for support. Find an order by code, buyer or event; filter by status,
 * payment method and date; open it to see the tickets and refund when the rules allow.
 */
import { h, Fragment, useState, t, tx, cx, get, post, href, navigate, useFetch, useQueryState, useRoute, setQuery, qs, toast, errorText, stamp, num, money, day } from '../core.js';
import { PageHeader, Button, Icon, Pill, Spinner, ErrorBox, FilterBar, FilterSelect, DataTable, Pagination, Drawer, KV, DateInput, Combobox, confirm, Stat, Tabs, Empty } from '../ui.js';
import { orderStatusOptions, payMethodOptions, loadEvents } from '../opts.js';

const TONE = { paid: 'ok', pending: 'warn', refunded: 'info', cancelled: 'neutral', expired: 'neutral' };
const TICKET = { valid: ['ok', 'Hợp lệ', 'Valid'], used: ['info', 'Đã vào cửa', 'Checked in'], refunded: ['warn', 'Đã hoàn', 'Refunded'], void: ['neutral', 'Huỷ', 'Void'] };

function OrderDrawer({ id, onClose, onChanged }) {
  const { data: o, error, loading, reload } = useFetch(`/admin/orders/${id}`, [id]);
  const refund = async () => {
    const out = await confirm({ title: t(`Hoàn tiền đơn ${o.code}?`, `Refund order ${o.code}?`), body: t(`${money(o.total)} · ${o.qty} vé sẽ mất hiệu lực.`, `${money(o.total)} · ${o.qty} tickets stop working.`), confirm: t('Hoàn tiền', 'Refund'), tone: 'danger', withNote: { label: t('Lý do (ghi vào nhật ký)', 'Reason (for the audit log)'), placeholder: t('vd: Khách mua nhầm ngày', 'e.g. Bought the wrong date'), required: true } });
    if (!out) return;
    try { const r = await post(`/admin/orders/${id}/refund`, { reason: out.note }); toast(tx(r.message)); reload(true); onChanged(); } catch (e) { toast(errorText(e), 'error'); }
  };
  return h(Drawer, {
    open: true, onClose, width: 560, title: o ? o.code : t('Đang tải…', 'Loading…'),
    sub: o ? h(Fragment, null, h(Pill, { tone: TONE[o.status] }, tx(o.statusLabel)), h('span', null, `${o.methodLabel} · ${stamp(o.createdAt, true)}`)) : null,
    footer: o ? h(Fragment, null,
      h(Button, { icon: 'calendar-dots', onClick: () => navigate(href('events', o.event.id)) }, t('Mở sự kiện', 'Open event')),
      h('span', { className: 'op-spacer' }),
      o.refundable ? h(Button, { variant: 'danger', icon: 'receipt-x', onClick: refund }, t('Hoàn tiền', 'Refund')) : o.status === 'paid' ? h('span', { className: 'op-hint' }, t('Có vé đã vào cửa — không hoàn được.', 'A ticket was scanned in — no refund.')) : null) : null,
  },
  loading && !o ? h(Spinner) : error ? h(ErrorBox, { error, onRetry: reload }) : h(Fragment, null,
    h('div', { className: 'op-section' },
      h('h3', { className: 'op-section-title' }, Icon('receipt'), t('Đơn hàng', 'Order')),
      h(KV, { items: [
        [t('Sự kiện', 'Event'), `${o.event.title} · ${day(o.event.startsOn)}`, true],
        [t('Hạng vé', 'Tier'), tx(o.tier)], [t('Số lượng', 'Quantity'), `${o.qty} × ${money(o.unitPrice)}`],
        [t('Tạm tính', 'Subtotal'), money(o.subtotal)], [t('Giảm giá', 'Discount'), o.discount ? `−${money(o.discount)}${o.promo ? ` (${o.promo})` : ''}` : '—'],
        [t('Phí dịch vụ', 'Service fee'), money(o.fee)], [t('Tổng', 'Total'), h('strong', null, money(o.total))],
        [t('Thanh toán lúc', 'Paid at'), o.paidAt ? stamp(o.paidAt, true) : '—'], [t('Hoàn tiền lúc', 'Refunded at'), o.refundedAt ? stamp(o.refundedAt, true) : '—'],
        [t('Mã giao dịch', 'Provider ref'), o.providerRef ? h('span', { className: 'op-mono' }, o.providerRef) : '—', true],
      ] })),
    h('div', { className: 'op-section' },
      h('h3', { className: 'op-section-title' }, Icon('user-circle'), t('Người mua', 'Buyer')),
      h(KV, { items: [[t('Tên', 'Name'), h('a', { href: href('users', o.buyer.id), onClick: (e) => { e.preventDefault(); navigate(href('users', o.buyer.id)); } }, o.buyer.name || '—')], ['Email', o.buyer.email ?? '—'], [t('Điện thoại', 'Phone'), o.buyer.phone ?? '—']] })),
    h('div', { className: 'op-section' },
      h('h3', { className: 'op-section-title' }, Icon('ticket'), t(`Vé (${o.tickets.length})`, `Tickets (${o.tickets.length})`)),
      h('table', { className: 'op-mini-table' }, h('tbody', null, o.tickets.map((x) => h('tr', { key: x.id },
        h('td', { className: 'op-mono' }, x.code), h('td', null, x.holder || '—'),
        h('td', null, h(Pill, { tone: TICKET[x.status]?.[0] }, t(TICKET[x.status]?.[1] ?? x.status, TICKET[x.status]?.[2] ?? x.status))),
        h('td', { className: 'op-cell-muted' }, x.checkedInAt ? `${stamp(x.checkedInAt)}${x.gate ? ' · ' + x.gate : ''}` : ''))))))));
}

/**
 * Tickets attendees passed on to each other. FeestFinder holds the buyer's money until the
 * event has happened, then pays the seller by bank transfer and records the reference here.
 */
function Resale() {
  const [state, setState] = useQueryState('rs', 'due');
  const { data, error, loading, reload } = useFetch(`/admin/resale?state=${state}`, [state]);
  const [busy, setBusy] = useState(null);
  const payout = async (r) => {
    const out = await confirm({ title: t(`Đã chuyển ${money(r.price)} cho ${r.seller.name}?`, `Paid ${money(r.price)} to ${r.seller.name}?`),
      body: r.seller.bank ? `${r.seller.bank.name} · ${r.seller.bank.accountNo} · ${r.seller.bank.accountName}` : t('Người bán chưa có tài khoản ngân hàng.', 'The seller has no bank account on file.'),
      confirm: t('Ghi nhận đã chuyển', 'Record payout'), withNote: { label: t('Mã giao dịch ngân hàng', 'Bank reference'), placeholder: 'VCB 220926 001', required: true } });
    if (!out) return;
    setBusy(r.id);
    try { const x = await post(`/admin/resale/${r.id}/payout`, { reference: out.note }); toast(tx(x.message)); reload(true); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(null); }
  };
  const refund = async (r) => {
    if (!(await confirm({ title: t(`Hoàn ${money(r.total)} cho ${r.buyer.name}?`, `Refund ${money(r.total)} to ${r.buyer.name}?`), body: r.event.title, confirm: t('Đã hoàn tiền', 'Refunded'), tone: 'danger' }))) return;
    setBusy(r.id);
    try { const x = await post(`/admin/resale/${r.id}/refund`); toast(tx(x.message)); reload(true); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(null); }
  };
  const columns = [
    { key: 'code', label: t('Mã', 'Code'), width: 110, render: (r) => h('span', { className: 'op-mono' }, r.code) },
    { key: 'event', label: t('Sự kiện', 'Event'), render: (r) => h('div', null, h('div', { className: 'op-cell-title' }, r.event.title), r.event.cancelled ? h(Pill, { tone: 'danger' }, t('Sự kiện đã huỷ', 'Event cancelled')) : null) },
    { key: 'seller', label: t('Người bán → người mua', 'Seller → buyer'), render: (r) => h('div', null, h('div', { className: 'op-cell-title' }, `${r.seller.name} → ${r.buyer.name}`), h('div', { className: 'op-cell-sub' }, r.seller.bank ? `${r.seller.bank.name} · ${r.seller.bank.accountNo}` : t('Chưa có tài khoản', 'No bank account'))) },
    { key: 'price', label: t('Người bán nhận', 'Seller gets'), width: 140, align: 'right', render: (r) => h('span', { className: 'op-cell-num' }, money(r.price)) },
    { key: 'due', label: state === 'paid_out' ? t('Đã chuyển', 'Paid out') : t('Đến hạn', 'Due'), width: 150, render: (r) => h('span', { className: 'op-cell-muted op-nowrap' }, stamp(r.paidOutAt ?? r.payoutDueAt ?? r.paidAt)) },
    { key: 'act', label: '', width: 170, align: 'right', render: (r) => state === 'due' && !r.event.cancelled ? h(Button, { size: 'sm', variant: 'ok', icon: 'bank', busy: busy === r.id, onClick: () => payout(r) }, t('Đã chuyển', 'Paid'))
      : state === 'failed' || (r.event.cancelled && !r.paidOutAt) ? h(Button, { size: 'sm', variant: 'danger', busy: busy === r.id, onClick: () => refund(r) }, t('Hoàn tiền', 'Refund'))
      : r.payoutRef ? h('span', { className: 'op-mono op-cell-muted' }, r.payoutRef) : null },
  ];
  return h(Fragment, null,
    h(FilterBar, { active: 0 }, h(FilterSelect, { label: t('Trạng thái', 'State'), icon: 'circle-half', value: state, onChange: (v) => setState(v || 'due'), options: [
      { value: 'due', label: t('Đến hạn trả người bán', 'Due to sellers') }, { value: 'upcoming', label: t('Chờ sự kiện diễn ra', 'Waiting for the event') },
      { value: 'paid_out', label: t('Đã chuyển', 'Paid out') }, { value: 'failed', label: t('Cần hoàn cho người mua', 'Refund to buyer') },
    ] })),
    error ? h(ErrorBox, { error, onRetry: reload }) : null,
    h(DataTable, { columns, rows: data?.items ?? [], loading, minWidth: 980, empty: h(Empty, { icon: 'check-circle', title: t('Không có giao dịch', 'Nothing here') }) }));
}

export function Orders({ rest }) {
  const [view, setView] = useQueryState('view', 'orders');
  if (view === 'resale') {
    return h(Fragment, null,
      h(PageHeader, { title: t('Đơn hàng', 'Orders') }),
      h(Tabs, { value: view, onChange: setView, items: [{ value: 'orders', icon: 'receipt', label: t('Đơn bán vé', 'Ticket orders') }, { value: 'resale', icon: 'arrows-left-right', label: t('Pass vé', 'Resale') }] }),
      h(Resale));
  }
  return h(OrderList, { rest, tabs: h(Tabs, { value: view, onChange: setView, items: [{ value: 'orders', icon: 'receipt', label: t('Đơn bán vé', 'Ticket orders') }, { value: 'resale', icon: 'arrows-left-right', label: t('Pass vé', 'Resale') }] }) });
}

function OrderList({ rest, tabs }) {
  const route = useRoute();
  const [q, setQ] = useQueryState('q', '');
  const [status, setStatus] = useQueryState('status', '');
  const [method, setMethod] = useQueryState('method', '');
  const [event, setEvent] = useQueryState('event', '');
  const [from, setFrom] = useQueryState('from', '');
  const [to, setTo] = useQueryState('to', '');
  const [offset] = useQueryState('offset', '0');
  const [limit] = useQueryState('limit', '25');
  const eventLabel = route.query.get('eventLabel');
  const path = '/admin/orders' + qs({ q, status, method, eventId: event, from, to, offset, limit });
  const { data, error, loading, reload } = useFetch(path, [path]);
  const current = rest[1] ?? null;
  const reset = (p) => setQuery({ ...p, offset: '' });
  const sum = data?.summary ?? {};
  const columns = [
    { key: 'code', label: t('Mã đơn', 'Order'), width: 120, render: (o) => h('span', { className: 'op-mono' }, o.code) },
    { key: 'when', label: t('Thời điểm', 'When'), width: 130, render: (o) => h('span', { className: 'op-cell-muted op-nowrap' }, stamp(o.createdAt)) },
    { key: 'buyer', label: t('Người mua', 'Buyer'), render: (o) => h('div', null, h('div', { className: 'op-cell-title' }, o.buyer.name || '—'), h('div', { className: 'op-cell-sub' }, o.buyer.email ?? o.buyer.phone ?? '')) },
    { key: 'event', label: t('Sự kiện · hạng vé', 'Event · tier'), render: (o) => h('div', null, h('div', { className: 'op-cell-title' }, o.event.title), h('div', { className: 'op-cell-sub' }, `${tx(o.tier)} × ${o.qty}`)) },
    { key: 'method', label: t('Thanh toán', 'Payment'), width: 110, render: (o) => o.methodLabel },
    { key: 'total', label: t('Tổng', 'Total'), width: 130, align: 'right', render: (o) => h('span', { className: 'op-cell-num' }, money(o.total)) },
    { key: 'status', label: t('Trạng thái', 'Status'), width: 140, render: (o) => h(Pill, { tone: TONE[o.status] }, tx(o.statusLabel)) },
  ];
  return h(Fragment, null,
    h(PageHeader, { title: t('Đơn hàng', 'Orders') }),
    tabs,
    h('div', { className: 'op-stats' },
      h(Stat, { label: t('Đã thanh toán', 'Paid'), icon: 'check-circle', value: num(sum.paid?.count ?? 0), note: money(sum.paid?.total ?? 0), tone: 'ok', active: status === 'paid', onClick: () => reset({ status: status === 'paid' ? '' : 'paid' }) }),
      h(Stat, { label: t('Chờ thanh toán', 'Awaiting payment'), icon: 'hourglass-medium', value: num(sum.pending?.count ?? 0), note: money(sum.pending?.total ?? 0), active: status === 'pending', onClick: () => reset({ status: status === 'pending' ? '' : 'pending' }) }),
      h(Stat, { label: t('Đã hoàn tiền', 'Refunded'), icon: 'receipt-x', value: num(sum.refunded?.count ?? 0), note: money(sum.refunded?.total ?? 0), tone: 'warn', active: status === 'refunded', onClick: () => reset({ status: status === 'refunded' ? '' : 'refunded' }) })),
    h(FilterBar, { search: q, onSearch: (v) => reset({ q: v }), placeholder: t('Mã đơn, email, SĐT, tên người mua…', 'Order code, email, phone, buyer…'), active: [status, method, event, from, to].filter(Boolean).length, onReset: () => reset({ status: '', method: '', event: '', eventLabel: '', from: '', to: '' }) },
      h(FilterSelect, { label: t('Trạng thái', 'Status'), icon: 'circle-half', multi: true, value: status ? status.split(',') : [], onChange: (v) => reset({ status: v.join(',') }), options: orderStatusOptions() }),
      h(FilterSelect, { label: t('Thanh toán', 'Payment'), icon: 'credit-card', multi: true, value: method ? method.split(',') : [], onChange: (v) => reset({ method: v.join(',') }), options: payMethodOptions() }),
      h('div', { className: 'op-filter-combo' }, h(Combobox, { value: event || null, valueLabel: eventLabel, load: (qq) => loadEvents(qq), placeholder: t('Lọc theo sự kiện…', 'Filter by event…'), icon: 'calendar-dots', onChange: (v, o) => reset({ event: v ?? '', eventLabel: o?.label ?? '' }) })),
      h('div', { className: 'op-range' }, h(DateInput, { value: from, onChange: (v) => reset({ from: v ?? '' }) }), h('span', null, '→'), h(DateInput, { value: to, min: from || undefined, onChange: (v) => reset({ to: v ?? '' }) }))),
    error ? h(ErrorBox, { error, onRetry: reload }) : null,
    h(DataTable, { columns, rows: data?.items ?? [], loading, activeKey: current, onRowClick: (o) => navigate(href('orders', o.id) + location.search), minWidth: 1000 }),
    data ? h(Pagination, { offset: Number(offset), limit: Number(limit), total: data.total, onChange: (o) => setQuery({ offset: String(o) }), onLimit: (l) => setQuery({ limit: String(l), offset: '' }) }) : null,
    current ? h(OrderDrawer, { key: current, id: current, onClose: () => navigate(href('orders') + location.search, { replace: true }), onChanged: () => reload(true) }) : null);
}
