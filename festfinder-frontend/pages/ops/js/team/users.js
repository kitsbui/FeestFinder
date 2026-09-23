/*
 * Team mode: accounts. Search by name, email or phone; filter by kind, sign-up method,
 * city and activity. The drawer shows what an account has done and lets an admin grant
 * or remove admin access (never their own).
 */
import { h, Fragment, useState, t, tx, cx, get, patch, post, href, navigate, useFetch, useQueryState, setQuery, qs, toast, errorText, stamp, ago, num, money, store, monthYear } from '../core.js';
import { PageHeader, Button, Icon, Pill, Avatar, Spinner, ErrorBox, Empty, FilterBar, FilterSelect, DataTable, Pagination, Drawer, KV, Stat, confirm } from '../ui.js';
import { signupOptions } from '../opts.js';

const phone = (p) => (p ? p.replace(/^\+84/, '0').replace(/(\d{4})(\d{3})(\d+)/, '$1 $2 $3') : null);

function UserDrawer({ id, onClose }) {
  const { data: u, error, loading, reload } = useFetch(`/admin/users/${id}`, [id]);
  const setRole = async (role) => {
    const ok = await confirm(role === 'admin'
      ? { title: t('Cấp quyền admin?', 'Make this account an admin?'), body: t('Vào được chế độ Vận hành và console kiểm duyệt.', 'They get team mode and the moderation console.'), confirm: t('Cấp quyền', 'Grant access'), tone: 'danger' }
      : { title: t('Gỡ quyền admin?', 'Remove admin access?'), body: null, confirm: t('Gỡ quyền', 'Remove access'), tone: 'danger' });
    if (!ok) return;
    try { const out = await patch(`/admin/users/${id}`, { role }); toast(tx(out.message)); reload(true); } catch (e) { toast(errorText(e), 'error'); }
  };
  const self = store.session?.user?.id === id;
  return h(Drawer, {
    open: true, onClose, width: 600, title: u ? (u.name || u.email || phone(u.phone)) : t('Đang tải…', 'Loading…'),
    head: u ? h('div', { className: 'op-drawer-avatar' }, h(Avatar, { name: u.name || u.email, src: u.photoUrl, size: 44 })) : null,
    sub: u ? h(Fragment, null, u.role === 'admin' ? h(Pill, { tone: 'violet', icon: 'shield-check' }, 'Admin') : null, u.organizers.length ? h(Pill, { tone: 'info', icon: 'storefront' }, t('Nhà tổ chức', 'Organizer')) : null, h('span', null, `${u.signupLabel} · ${t('tham gia', 'joined')} ${stamp(u.createdAt, true)}`)) : null,
    footer: u && !self ? h(Fragment, null, h('span', { className: 'op-spacer' }), u.role === 'admin'
      ? h(Button, { variant: 'danger', icon: 'shield-slash', onClick: () => setRole('user') }, t('Gỡ quyền admin', 'Remove admin'))
      : h(Button, { icon: 'shield-check', onClick: () => setRole('admin') }, t('Cấp quyền admin', 'Make admin'))) : null,
  },
  loading && !u ? h(Spinner) : error ? h(ErrorBox, { error, onRetry: reload }) : h(Fragment, null,
    h('div', { className: 'op-stats op-stats--compact' },
      h(Stat, { label: t('Vé', 'Tickets'), value: u.counts.tickets, note: t(`${u.counts.orders} đơn`, `${u.counts.orders} orders`) }),
      h(Stat, { label: t('Lưu · quan tâm', 'Saves · hype'), value: `${u.counts.saves} · ${u.counts.hypes}` }),
      h(Stat, { label: t('Bạn bè', 'Friends'), value: u.counts.friends }),
      h(Stat, { label: t('Ngày hoạt động', 'Active days'), value: u.counts.activeDays, note: u.lastActiveAt ? ago(u.lastActiveAt) : t('chưa từng', 'never') })),
    h('div', { className: 'op-section' },
      h('h3', { className: 'op-section-title' }, Icon('user-circle'), t('Tài khoản', 'Account')),
      h(KV, { items: [
        ['Email', u.email ?? '—'], [t('Điện thoại', 'Phone'), phone(u.phone) ?? '—'], [t('Thành phố', 'City'), u.city || '—'], [t('Ngôn ngữ', 'Language'), u.locale === 'vi' ? 'Tiếng Việt' : 'English'],
        [t('Năm sinh', 'Birth year'), u.birthYear ?? '—'], [t('Mật khẩu', 'Password'), u.hasPassword ? t('Đã đặt', 'Set') : t('Chưa đặt (đăng nhập bằng mã)', 'Not set (code sign-in)')],
        [t('Sở thích', 'Interests'), u.interests.length ? h('div', { className: 'op-flags' }, u.interests.map((x) => h(Pill, { key: x }, x))) : '—', true],
        [t('Liên kết', 'Connections'), u.connections.length ? u.connections.map((c) => c.label).join(', ') : '—', true],
        u.counts.reports ? [t('Đã báo cáo', 'Reports filed'), u.counts.reports] : null,
      ] })),
    u.organizers.length ? h('div', { className: 'op-section' },
      h('h3', { className: 'op-section-title' }, Icon('storefront'), t('Thành viên nhà tổ chức', 'Organizer teams')),
      h('ul', { className: 'op-people' }, u.organizers.map((o) => h('li', { key: o.id }, h('a', { href: href('organizers', o.id), onClick: (e) => { e.preventDefault(); navigate(href('organizers', o.id)); } }, o.name), h(Pill, null, o.role === 'owner' ? t('Chủ', 'Owner') : t('Quản lý', 'Manager')))))) : null,
    h('div', { className: 'op-section' },
      h('h3', { className: 'op-section-title' }, Icon('receipt'), t('Đơn hàng gần đây', 'Recent orders')),
      u.orders.length ? h('ul', { className: 'op-people' }, u.orders.map((o) => h('li', { key: o.id },
        h('a', { className: 'op-people-name', href: href('orders', o.id), onClick: (e) => { e.preventDefault(); navigate(href('orders', o.id)); } }, o.event, h('small', null, `${o.code} · ${stamp(o.createdAt)} · ${o.qty} ${t('vé', 'tickets')}`)),
        h('span', { className: 'op-flags' }, h('span', { className: 'op-cell-num' }, money(o.total)), h(Pill, { tone: o.status === 'paid' ? 'ok' : o.status === 'refunded' ? 'warn' : 'neutral' }, tx(o.statusLabel)))))) : h('p', { className: 'op-hint' }, t('Chưa có đơn nào.', 'No orders.')))));
}

export function Users({ rest }) {
  const [q, setQ] = useQueryState('q', '');
  const [kind, setKind] = useQueryState('kind', '');
  const [method, setMethod] = useQueryState('method', '');
  const [city, setCity] = useQueryState('city', '');
  const [active, setActive] = useQueryState('active', '');
  const [sort, setSort] = useQueryState('sort', 'new');
  const [offset, setOffset] = useQueryState('offset', '0');
  const [limit, setLimit] = useQueryState('limit', '25');
  const path = '/admin/users' + qs({ q, kind: kind || 'all', method, city, active: active || 'all', sort, offset, limit });
  const { data, error, loading, reload } = useFetch(path, [path]);
  const current = rest[1] ?? null;
  const reset = (p) => setQuery({ ...p, offset: '' });
  const columns = [
    { key: 'name', label: t('Tài khoản', 'Account'), render: (u) => h('div', { className: 'op-cell-main' }, h(Avatar, { name: u.name || u.email, src: u.photoUrl, size: 32 }),
      h('div', { style: { minWidth: 0 } }, h('div', { className: 'op-cell-title' }, u.name || h('span', { className: 'op-cell-muted' }, t('(chưa đặt tên)', '(no name)'))), h('div', { className: 'op-cell-sub' }, [u.email, phone(u.phone)].filter(Boolean).join(' · ')))) },
    { key: 'kind', label: t('Loại', 'Kind'), width: 200, render: (u) => h('div', { className: 'op-flags' }, u.role === 'admin' ? h(Pill, { tone: 'violet', icon: 'shield-check' }, 'Admin') : null, u.organizers.length ? h(Pill, { tone: 'info', icon: 'storefront', title: u.organizers.map((o) => o.name).join(', ') }, u.organizers[0].name) : null, u.role !== 'admin' && !u.organizers.length ? h('span', { className: 'op-cell-muted' }, t('Người dùng', 'Attendee')) : null) },
    { key: 'method', label: t('Đăng ký qua', 'Signed up via'), width: 120, render: (u) => u.signupLabel },
    { key: 'city', label: t('Thành phố', 'City'), width: 120, render: (u) => u.city || h('span', { className: 'op-cell-muted' }, '—') },
    { key: 'tickets', label: t('Vé · lưu', 'Tickets · saves'), width: 120, align: 'right', render: (u) => h('span', { className: 'op-cell-num' }, `${u.tickets} · ${u.saves}`) },
    { key: 'active', label: t('Hoạt động', 'Last active'), width: 130, render: (u) => h('span', { className: 'op-cell-muted' }, u.lastActiveAt ? ago(u.lastActiveAt) : t('chưa từng', 'never')) },
    { key: 'joined', label: t('Tham gia', 'Joined'), width: 100, render: (u) => h('span', { className: 'op-cell-muted op-nowrap' }, monthYear(u.createdAt)) },
  ];
  return h(Fragment, null,
    h(PageHeader, { title: t('Người dùng', 'Accounts') }),
    h(FilterBar, {
      search: q, onSearch: (v) => reset({ q: v }), placeholder: t('Tên, email, số điện thoại…', 'Name, email, phone…'), active: [kind, method, city, active].filter(Boolean).length,
      onReset: () => reset({ kind: '', method: '', city: '', active: '' }),
      right: h(FilterSelect, { label: t('Sắp xếp', 'Sort'), icon: 'arrows-down-up', value: sort, onChange: (v) => reset({ sort: v || 'new' }), options: [{ value: 'new', label: t('Mới tham gia', 'Newest') }, { value: 'active', label: t('Hoạt động gần nhất', 'Recently active') }, { value: 'tickets', label: t('Nhiều vé nhất', 'Most tickets') }, { value: 'name', label: t('Tên A → Z', 'Name A → Z') }] }),
    },
    h(FilterSelect, { label: t('Loại tài khoản', 'Kind'), icon: 'user-circle', value: kind, onChange: (v) => reset({ kind: v }), allLabel: t('Tất cả', 'Everyone'), options: [{ value: 'attendee', label: t('Người dùng', 'Attendees') }, { value: 'organizer', label: t('Nhà tổ chức', 'Organizers') }, { value: 'admin', label: 'Admin' }] }),
    h(FilterSelect, { label: t('Đăng ký qua', 'Signed up via'), icon: 'sign-in', multi: true, value: method ? method.split(',') : [], onChange: (v) => reset({ method: v.join(',') }), options: signupOptions() }),
    h(FilterSelect, { label: t('Thành phố', 'City'), icon: 'buildings', value: city, onChange: (v) => reset({ city: v }), allLabel: t('Mọi nơi', 'Anywhere'), options: (data?.cities ?? []).map((c) => ({ value: c.value, label: c.value, count: c.count })) }),
    h(FilterSelect, { label: t('Hoạt động', 'Activity'), icon: 'pulse', value: active, onChange: (v) => reset({ active: v }), allLabel: t('Bất kỳ', 'Any'), options: [{ value: '7d', label: t('Trong 7 ngày', 'In the last 7 days') }, { value: '30d', label: t('Trong 30 ngày', 'In the last 30 days') }, { value: 'dormant', label: t('Không hoạt động 30+ ngày', 'Dormant 30+ days') }] })),
    error ? h(ErrorBox, { error, onRetry: reload }) : null,
    h(DataTable, { columns, rows: data?.items ?? [], loading, activeKey: current, onRowClick: (u) => navigate(href('users', u.id) + location.search), minWidth: 1000 }),
    data ? h(Pagination, { offset: Number(offset), limit: Number(limit), total: data.total, onChange: (o) => setQuery({ offset: String(o) }), onLimit: (l) => setQuery({ limit: String(l), offset: '' }) }) : null,
    current ? h(UserDrawer, { key: current, id: current, onClose: () => navigate(href('users') + location.search, { replace: true }) }) : null);
}
