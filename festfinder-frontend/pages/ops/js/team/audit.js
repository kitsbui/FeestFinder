/*
 * Team mode: the audit log — every decision and change, who made it, and the before/after.
 * The log is hash-chained and append-only; the check under the title recomputes the chain.
 */
import { h, Fragment, useState, useEffect, t, tx, cx, get, useFetch, useQueryState, setQuery, qs, stamp, num } from '../core.js';
import { PageHeader, Button, Icon, Pill, Spinner, ErrorBox, Empty, FilterBar, FilterSelect, Card } from '../ui.js';

const AREAS = () => [
  { value: 'listing', label: t('Tin đăng', 'Listings') }, { value: 'organizer', label: t('Nhà tổ chức', 'Organizers') }, { value: 'venue', label: t('Địa điểm', 'Venues') },
  { value: 'shelf', label: t('Mục nổi bật', 'Shelves') }, { value: 'report', label: t('Báo cáo', 'Reports') }, { value: 'appeal', label: t('Kháng nghị', 'Appeals') },
  { value: 'order', label: t('Đơn hàng', 'Orders') }, { value: 'payout', label: t('Chi trả', 'Payouts') }, { value: 'user', label: t('Tài khoản', 'Accounts') },
  { value: 'ads', label: t('Quảng cáo', 'Ads') }, { value: 'impersonation', label: t('Xem hộ', 'View-as') },
];

export function Audit() {
  const [actor, setActor] = useQueryState('actor', '');
  const [area, setArea] = useQueryState('area', '');
  const [q, setQ] = useQueryState('q', '');
  const [pages, setPages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [more, setMore] = useState(false);
  const base = { actor: actor || 'all', area, q, limit: 40 };
  const first = useFetch('/admin/audit' + qs(base), [actor, area, q]);
  const verify = useFetch('/admin/audit/verify');
  useEffect(() => { if (first.data) { setPages(first.data.items); setCursor(first.data.nextCursor); } }, [first.data]);
  const loadMore = async () => {
    setMore(true);
    try { const out = await get('/admin/audit' + qs({ ...base, cursor })); setPages((p) => [...p, ...out.items]); setCursor(out.nextCursor); } finally { setMore(false); }
  };
  const v = verify.data;
  return h(Fragment, null,
    h(PageHeader, {
      eyebrow: v ? h(Pill, { tone: v.ok ? 'ok' : 'danger', icon: v.ok ? 'shield-check' : 'shield-warning' }, v.ok ? t(`Chuỗi hash hợp lệ · ${num(v.entries)} dòng`, `Hash chain intact · ${num(v.entries)} entries`) : t(`Chuỗi hỏng tại #${v.brokenAt}`, `Chain broken at #${v.brokenAt}`)) : null,
      title: t('Nhật ký hoạt động', 'Audit log'),
      actions: h(Button, { icon: 'download-simple', href: '/admin/audit.csv' + qs({ actor: actor || 'all', days: 90 }) }, t('Tải CSV 90 ngày', 'CSV · 90 days')),
    }),
    h(FilterBar, { search: q, onSearch: setQ, placeholder: t('Tìm người thực hiện hoặc đối tượng…', 'Search who or what…'), active: [actor, area].filter(Boolean).length, onReset: () => setQuery({ actor: '', area: '' }) },
      h(FilterSelect, { label: t('Người thực hiện', 'Actor'), icon: 'user-circle', value: actor, onChange: setActor, allLabel: t('Tất cả', 'Everyone'), options: [{ value: 'admin', label: t('Đội FeestFinder', 'FeestFinder team') }, { value: 'organizer', label: t('Nhà tổ chức', 'Organizers') }, { value: 'system', label: t('Hệ thống', 'System') }] }),
      h(FilterSelect, { label: t('Nhóm thao tác', 'Area'), icon: 'stack', value: area, onChange: setArea, allLabel: t('Mọi nhóm', 'Every area'), options: AREAS() })),
    first.error ? h(ErrorBox, { error: first.error, onRetry: first.reload }) : null,
    first.loading && !first.data ? h(Spinner) : pages.length ? h(Card, { pad: false },
      h('ul', { className: 'op-audit' }, pages.map((a) => h('li', { key: a.seq },
        h('span', { className: cx('op-audit-actor', `is-${a.actorType}`) }, Icon(a.actorType === 'admin' ? 'shield-check' : a.actorType === 'organizer' ? 'storefront' : 'gear', true)),
        h('div', { className: 'op-audit-main' },
          h('div', { className: 'op-audit-line' }, h('strong', null, tx(a.actor)), ' · ', tx(a.label), ' · ', h('span', { className: 'op-audit-target' }, a.target.label)),
          a.diff.length ? h('div', { className: 'op-diff' }, a.diff.map((d, i) => h('div', { key: i }, h('code', null, d.field), h('span', { className: 'op-diff-a' }, d.before), Icon('arrow-right'), h('span', { className: 'op-diff-b' }, d.after)))) : null),
        h('div', { className: 'op-audit-meta' }, h('div', null, stamp(a.at, true)), h('code', null, `#${a.seq} · ${a.hash}`))))),
      cursor ? h('div', { className: 'op-more' }, h(Button, { busy: more, onClick: loadMore }, t('Xem thêm', 'Load more'))) : null) : h(Empty, { icon: 'scroll', title: t('Không có dòng nào khớp', 'Nothing matches') }));
}
