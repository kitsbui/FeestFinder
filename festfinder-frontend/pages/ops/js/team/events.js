/*
 * Team mode: the whole catalogue. Every filter is a dropdown and lives in the URL; a row
 * opens the listing, where the team can edit it, change its status or read its history.
 * "New listing" creates one for an organiser, as a draft or published straight away.
 */
import {
  h, Fragment, useState, useEffect, useMemo, t, tx, cx, get, post, patch, put, href, navigate, useFetch, useQueryState, setQuery, qs, useRoute,
  toast, errorText, emit, day, dayRange, money, num, ago, stamp, vnDate,
} from '../core.js';
import {
  PageHeader, Button, Icon, Pill, Thumb, Avatar, Spinner, ErrorBox, Empty, FilterBar, FilterSelect, DataTable, Pagination, Menu, StatusPill, DateBox,
  Meter, Modal, Field, Select, TextArea, DateInput, confirm, Card, KV, Tabs, Stat,
} from '../ui.js';
import { genreOptions, areaOptions, statusOptions, entryOptions, rejectOptions, genreLabel } from '../opts.js';
import { EventForm } from '../event-form.js';
import { actionText } from './overview.js';

const WHEN = () => [
  { value: 'upcoming', label: t('Sắp diễn ra', 'Upcoming') }, { value: 'today', label: t('Hôm nay', 'Today') }, { value: 'weekend', label: t('Cuối tuần này', 'This weekend') },
  { value: 'week', label: t('7 ngày tới', 'Next 7 days') }, { value: 'month', label: t('Đến hết tháng', 'Rest of the month') }, { value: 'past', label: t('Đã diễn ra', 'Past') },
  { value: 'undated', label: t('Chưa có ngày', 'No date') }, { value: 'range', label: t('Khoảng ngày…', 'Date range…') },
];

// ---- status changes, shared by the list and the detail page -------------------------------------

function TakeDownDialog({ ev, onClose, onDone }) {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try { const out = await post(`/admin/events/${ev.id}/status`, { action: 'take_down', code: code || undefined, message: message.trim() || undefined }); toast(tx(out.message)); emit('counts'); onDone(out); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  return h(Modal, {
    open: !!ev, onClose, title: t('Gỡ tin khỏi FeestFinder', 'Take the listing down'),
    footer: h(Fragment, null, h(Button, { onClick: onClose }, t('Huỷ', 'Cancel')), h(Button, { variant: 'danger', icon: 'prohibit', busy, onClick: run }, t('Gỡ tin', 'Take down'))),
  },
  h('div', { className: 'op-confirm-body' }, t(`"${ev?.title}" sẽ biến mất khỏi feed, bản đồ và tìm kiếm. Nhà tổ chức được báo.`, `"${ev?.title}" disappears from the feed, map and search. The organizer is told.`)),
  h(Field, { label: t('Lý do', 'Reason'), optional: true }, h(Select, { value: code, onChange: setCode, placeholder: t('— Không ghi lý do —', '— No reason code —'), options: rejectOptions() })),
  h(Field, { label: t('Tin nhắn cho nhà tổ chức', 'Message to the organizer'), optional: true, hint: t('Gửi vào Hộp thư kiểm duyệt của họ.', 'Goes to their moderation inbox.') }, h(TextArea, { rows: 4, value: message, onChange: setMessage, maxLength: 2000 })));
}

export function useStatusActions(onChanged) {
  const [takeDown, setTakeDown] = useState(null);
  const run = async (ev, action) => {
    if (action === 'take_down') return setTakeDown(ev);
    const texts = {
      publish: [t('Đăng tin này ngay?', 'Publish this listing now?'), t('Tin lên sóng ngay, bỏ qua hàng chờ. Nhà tổ chức và người theo dõi được báo.', 'It goes live now, skipping the queue. The organizer and followers are told.'), t('Đăng ngay', 'Publish'), 'cta'],
      cancel: [t('Đánh dấu sự kiện đã huỷ?', 'Mark the event cancelled?'), t('Tin vẫn hiển thị nhưng ghi "Đã huỷ". Đơn đã thanh toán cần được hoàn tiền trong mục Đơn hàng.', 'The listing stays visible as "Cancelled". Paid orders need refunding from Orders.'), t('Đánh dấu huỷ', 'Mark cancelled'), 'danger'],
      restore: [t('Khôi phục tin?', 'Restore the listing?'), t('Tin chạy lại ngay trên feed.', 'It goes back on the feed right away.'), t('Khôi phục', 'Restore'), 'cta'],
    }[action];
    if (!(await confirm({ title: texts[0], body: texts[1], confirm: texts[2], tone: texts[3] === 'danger' ? 'danger' : undefined }))) return;
    try { const out = await post(`/admin/events/${ev.id}/status`, { action }); toast(tx(out.message)); emit('counts'); onChanged(out); } catch (e) {
      toast(e.details?.missing ? t(`Còn thiếu: ${e.details.missing.join(', ')}`, `Missing: ${e.details.missing.join(', ')}`) : errorText(e), 'error');
    }
  };
  const dialog = h(TakeDownDialog, { ev: takeDown, onClose: () => setTakeDown(null), onDone: (out) => { setTakeDown(null); onChanged(out); } });
  return { run, dialog };
}

function statusItems(ev, run, extra = []) {
  return [
    ['draft', 'in_review', 'rejected'].includes(ev.status) ? { icon: 'rocket-launch', label: ev.status === 'in_review' ? t('Duyệt & đăng', 'Approve & publish') : t('Đăng ngay', 'Publish now'), tone: 'ok', onClick: () => run(ev, 'publish') } : null,
    ['removed', 'cancelled'].includes(ev.status) ? { icon: 'arrow-counter-clockwise', label: t('Khôi phục', 'Restore'), tone: 'ok', onClick: () => run(ev, 'restore') } : null,
    ...extra,
    ['live', 'in_review', 'draft'].includes(ev.status) ? '-' : null,
    ['live', 'in_review'].includes(ev.status) ? { icon: 'prohibit', label: t('Gỡ tin…', 'Take down…'), tone: 'danger', onClick: () => run(ev, 'take_down') } : null,
    ['live', 'in_review', 'draft'].includes(ev.status) ? { icon: 'x-circle', label: t('Đánh dấu đã huỷ', 'Mark cancelled'), tone: 'danger', onClick: () => run(ev, 'cancel') } : null,
  ];
}

// ---- the catalogue ---------------------------------------------------------------------------------

function EventList() {
  const [q, setQ] = useQueryState('q', '');
  const [status, setStatus] = useQueryState('status', '');
  const [when, setWhen] = useQueryState('when', 'upcoming');
  const [from, setFrom] = useQueryState('from', '');
  const [to, setTo] = useQueryState('to', '');
  const [genre, setGenre] = useQueryState('genre', '');
  const [area, setArea] = useQueryState('area', '');
  const [org, setOrg] = useQueryState('org', '');
  const [entry, setEntry] = useQueryState('entry', '');
  const [traits, setTraits] = useQueryState('traits', '');
  const [sort, setSort] = useQueryState('sort', 'date');
  const [offset, setOffset] = useQueryState('offset', '0');
  const [limit, setLimit] = useQueryState('limit', '25');
  const orgs = useFetch('/admin/organizers');
  const tr = traits ? traits.split(',') : [];
  const params = {
    q, status, when, from: when === 'range' ? from : '', to: when === 'range' ? to : '', genre, area, organizerId: org, entry,
    featured: tr.includes('featured') ? 'true' : '', reported: tr.includes('reported') ? 'true' : '', unresolved: tr.includes('unpinned') ? 'true' : '', sort, offset, limit,
  };
  const path = '/admin/events' + qs(params);
  const { data, error, loading, reload, setData } = useFetch(path, [path]);
  const reset = (patchObj) => setQuery({ ...patchObj, offset: '' });
  const { run, dialog } = useStatusActions(() => reload(true));
  const feature = async (e) => {
    try { await patch(`/admin/events/${e.id}`, { featured: !e.featured }); toast(e.featured ? t('Đã bỏ nổi bật', 'Unfeatured') : t('Đã đặt nổi bật', 'Featured')); reload(true); } catch (err) { toast(errorText(err), 'error'); }
  };
  const duplicate = async (e) => {
    try { const out = await post(`/admin/events/${e.id}/duplicate`); toast(tx(out.message)); navigate(href('events', out.id)); } catch (err) { toast(errorText(err), 'error'); }
  };
  const active = [q, status, when !== 'upcoming' ? when : '', genre, area, org, entry, traits].filter(Boolean).length;
  const statuses = status ? status.split(',') : [];

  const columns = [
    { key: 'date', label: t('Ngày', 'Date'), width: 76, render: (e) => (e.startsOn ? h(DateBox, { iso: e.startsOn, sub: e.startTime }) : h('span', { className: 'op-cell-muted' }, '—')) },
    { key: 'title', label: t('Sự kiện', 'Listing'), render: (e) => h('div', { className: 'op-cell-main' }, h(Thumb, { src: e.coverUrl, art: e.art, title: e.title, w: 64 }),
      h('div', { style: { minWidth: 0 } }, h('div', { className: 'op-cell-title' }, e.featured ? Icon('star', true, 'op-star') : null, e.title),
        h('div', { className: 'op-cell-sub' }, [e.genre, e.venueName, e.area].filter(Boolean).join(' · ') || '—'))) },
    { key: 'org', label: t('Nhà tổ chức', 'Organizer'), width: 170, render: (e) => h('span', { className: 'op-org-cell' }, e.organizer.name, e.organizer.verified ? Icon('seal-check', true, 'op-verified') : null) },
    { key: 'status', label: t('Trạng thái', 'Status'), width: 150, render: (e) => h('div', { className: 'op-status-cell' }, h(StatusPill, { status: e.status }),
      h('div', { className: 'op-flags' },
        !e.venueResolved && e.venueName ? h(Pill, { tone: 'warn', icon: 'map-pin', title: t('Chưa có ghim bản đồ', 'No map pin') }, t('chưa ghim', 'no pin')) : null,
        e.openReports ? h(Pill, { tone: 'danger', icon: 'flag' }, e.openReports) : null,
        e.badge ? h(Pill, { tone: 'violet' }, e.badge.replace('_', ' ')) : null)) },
    { key: 'price', label: t('Giá', 'Price'), width: 110, align: 'right', render: (e) => h('span', { className: 'op-cell-num' }, e.entryMode === 'free' ? t('Miễn phí', 'Free') : e.entryMode === 'donation' ? t('Tuỳ tâm', 'Donation') : e.priceFrom ? money(e.priceFrom) : '—') },
    { key: 'sold', label: t('Vé bán', 'Sold'), width: 110, render: (e) => e.capacity ? h('div', { className: 'op-nowrap' }, h(Meter, { value: e.sold, max: e.capacity, tone: e.sold / e.capacity > 0.9 ? 'warn' : 'ok' }), h('small', { className: 'op-cell-num op-cell-muted', style: { marginLeft: 6 } }, `${num(e.sold)}`)) : h('span', { className: 'op-cell-num op-cell-muted' }, e.sold ? num(e.sold) : '—') },
    { key: 'hype', label: t('Quan tâm', 'Hype'), width: 96, align: 'right', title: t('Quan tâm · lưu', 'Hype · saves'), render: (e) => h('div', { className: 'op-cell-num', style: { textAlign: 'right' } }, h('div', null, num(e.hype)), h('small', { className: 'op-cell-muted' }, t(`${num(e.saves)} lưu`, `${num(e.saves)} saves`))) },
    { key: 'act', label: '', width: 48, align: 'right', render: (e) => h(Menu, { items: [
      { icon: 'pencil-simple', label: t('Mở & sửa', 'Open & edit'), onClick: () => navigate(href('events', e.id)) },
      { icon: 'arrow-square-out', label: t('Xem trang công khai', 'View public page'), onClick: () => window.open(`/e/${e.slug}`, '_blank', 'noopener') },
      e.status === 'in_review' ? { icon: 'stack', label: t('Mở trong hàng chờ duyệt', 'Open in the review queue'), onClick: () => navigate(href('review', e.id)) } : null,
      { icon: 'star', label: e.featured ? t('Bỏ nổi bật', 'Unfeature') : t('Đặt nổi bật', 'Feature'), onClick: () => feature(e) },
      { icon: 'copy', label: t('Nhân bản thành nháp', 'Duplicate as draft'), onClick: () => duplicate(e) },
      ...statusItems(e, run),
    ] }) },
  ];

  const orgOptions = (orgs.data?.items ?? []).map((o) => ({ value: o.id, label: o.name, hint: o.state === 'verified' ? t('Đã xác minh', 'Verified') : null, count: o.allEvents }));
  const csvHref = '/admin/events.csv' + qs({ ...params, offset: '', limit: '' });

  return h(Fragment, null,
    h(PageHeader, {
      eyebrow: t('Danh mục · mọi trạng thái', 'Catalogue · every status'), title: t('Sự kiện', 'Events'),
      sub: data ? t(`${num(data.total)} tin khớp bộ lọc. Bấm một dòng để sửa, đổi trạng thái hoặc xem lịch sử.`, `${num(data.total)} listings match. Click a row to edit, change status or read its history.`) : null,
      actions: h(Fragment, null,
        h(Button, { icon: 'download-simple', href: csvHref, title: t('Tải CSV theo bộ lọc hiện tại', 'Download CSV with the current filters') }, 'CSV'),
        h(Button, { variant: 'cta', icon: 'plus', onClick: () => navigate(href('events', 'new')) }, t('Tạo sự kiện', 'New listing'))),
    }),
    h(FilterBar, {
      search: q, onSearch: (v) => reset({ q: v }), placeholder: t('Tên, nghệ sĩ, địa điểm, nhà tổ chức…', 'Title, artist, venue, organizer…'), active,
      onReset: () => reset({ q: '', status: '', when: 'upcoming', from: '', to: '', genre: '', area: '', org: '', entry: '', traits: '' }),
      right: h(FilterSelect, { label: t('Sắp xếp', 'Sort'), icon: 'arrows-down-up', value: sort, onChange: (v) => reset({ sort: v || 'date' }), options: [
        { value: 'date', label: t('Ngày diễn ra (gần nhất)', 'Event date (soonest)') }, { value: 'date_desc', label: t('Ngày diễn ra (xa nhất)', 'Event date (latest)') }, { value: 'updated', label: t('Mới cập nhật', 'Recently updated') },
        { value: 'hype', label: t('Nhiều quan tâm nhất', 'Most hype') }, { value: 'saves', label: t('Nhiều lượt lưu nhất', 'Most saves') }, { value: 'sold', label: t('Bán nhiều vé nhất', 'Most tickets sold') },
        { value: 'quality', label: t('Chất lượng cao nhất', 'Best quality') }, { value: 'title', label: t('Tên A → Z', 'Title A → Z') }] }),
    },
    h(FilterSelect, { label: t('Trạng thái', 'Status'), icon: 'circle-half', multi: true, value: statuses, onChange: (v) => reset({ status: v.join(',') }), options: statusOptions(data?.facets?.status) }),
    h(FilterSelect, { label: t('Thời gian', 'When'), icon: 'calendar-blank', value: when === 'all' ? '' : when, onChange: (v) => reset({ when: v || 'all', ...(v === 'range' ? { from: from || vnDate(), to: to || vnDate() } : { from: '', to: '' }) }), allLabel: t('Mọi thời gian', 'Any time'), options: WHEN() }),
    when === 'range' ? h('div', { className: 'op-range' }, h(DateInput, { value: from, onChange: (v) => reset({ from: v ?? '' }) }), h('span', null, '→'), h(DateInput, { value: to, min: from, onChange: (v) => reset({ to: v ?? '' }) })) : null,
    h(FilterSelect, { label: t('Thể loại', 'Genre'), icon: 'music-notes', multi: true, value: genre ? genre.split(',') : [], onChange: (v) => reset({ genre: v.join(',') }), options: genreOptions() }),
    h(FilterSelect, { label: t('Khu vực', 'District'), icon: 'map-trifold', multi: true, value: area ? area.split('|') : [], onChange: (v) => reset({ area: v.join('|') }), options: areaOptions() }),
    h(FilterSelect, { label: t('Nhà tổ chức', 'Organizer'), icon: 'buildings', value: org, onChange: (v) => reset({ org: v }), allLabel: t('Mọi nhà tổ chức', 'Every organizer'), search: true, width: 300, options: orgOptions }),
    h(FilterSelect, { label: t('Vào cửa', 'Entry'), icon: 'ticket', multi: true, value: entry ? entry.split(',') : [], onChange: (v) => reset({ entry: v.join(',') }), options: entryOptions() }),
    h(FilterSelect, { label: t('Đặc điểm', 'Traits'), icon: 'sliders-horizontal', multi: true, value: tr, onChange: (v) => reset({ traits: v.join(',') }), options: [
      { value: 'featured', label: t('Đang nổi bật', 'Featured') }, { value: 'reported', label: t('Có báo cáo mở', 'Has open reports') }, { value: 'unpinned', label: t('Chưa có ghim bản đồ', 'No map pin') }] })),
    error ? h(ErrorBox, { error, onRetry: reload }) : null,
    h(DataTable, { columns, rows: data?.items ?? [], loading, onRowClick: (e) => navigate(href('events', e.id)), rowTone: (e) => (['removed', 'cancelled'].includes(e.status) ? 'is-dim' : null), minWidth: 980 }),
    data ? h(Pagination, { offset: Number(offset), limit: Number(limit), total: data.total, onChange: (o) => setQuery({ offset: String(o) }), onLimit: (l) => setQuery({ limit: String(l), offset: '' }) }) : null,
    dialog);
}

// ---- one listing ---------------------------------------------------------------------------------------

function History({ ev }) {
  return h('div', { className: 'op-grid op-grid--2' },
    h(Card, { title: t('Quyết định kiểm duyệt', 'Moderation decisions'), icon: 'gavel' },
      ev.decisions.length ? h('ul', { className: 'op-feed' }, ev.decisions.map((d) => h('li', { key: d.id },
        h('span', { className: `op-feed-dot is-${['approved', 'overturned'].includes(d.decision) ? 'ok' : 'bad'}` }),
        h('div', null, h('div', { className: 'op-feed-line' }, h('strong', null, d.decision), d.reason ? ` · ${tx(d.reason)}` : '', ' — ', d.by ?? 'FeestFinder'),
          d.message ? h('div', { className: 'op-feed-msg' }, d.message) : null, h('div', { className: 'op-feed-time' }, stamp(d.at, true)))))) : h('p', { className: 'op-hint' }, t('Chưa có quyết định nào.', 'No decisions yet.')),
      ev.appeal ? h('div', { className: 'op-note', style: { marginTop: 12 } }, Icon('gavel', true), h('span', null, t(`Kháng nghị: ${ev.appeal.state}`, `Appeal: ${ev.appeal.state}`), ev.appeal.reply ? ` — “${ev.appeal.reply}”` : '')) : null),
    h(Card, { title: t('Nhật ký thay đổi', 'Change log'), icon: 'scroll' },
      ev.history.length ? h('ul', { className: 'op-feed' }, ev.history.map((a) => h('li', { key: a.seq },
        h('span', { className: `op-feed-dot is-${a.actorType}` }),
        h('div', null, h('div', { className: 'op-feed-line' }, h('strong', null, a.actor), ' · ', a.label ? tx(a.label) : actionText(a.action)),
          a.diff.length ? h('div', { className: 'op-diff' }, a.diff.slice(0, 6).map((d, i) => h('div', { key: i }, h('code', null, d.field), h('span', { className: 'op-diff-a' }, d.before), Icon('arrow-right'), h('span', { className: 'op-diff-b' }, d.after)))) : null,
          h('div', { className: 'op-feed-time' }, stamp(a.at, true)))))) : h('p', { className: 'op-hint' }, t('Chưa có thay đổi nào.', 'Nothing yet.'))));
}

function EventDetail({ id }) {
  const { data: ev, error, loading, reload, setData } = useFetch(`/admin/events/${id}`, [id]);
  const [tab, setTab] = useQueryState('tab', 'edit');
  const { run, dialog } = useStatusActions((out) => setData(out));
  if (loading && !ev) return h(Spinner);
  if (error) return h(ErrorBox, { error, onRetry: reload });
  const actions = {
    create: null,
    update: (eid, p) => patch(`/admin/events/${eid}`, p),
    tiers: (eid, tiers) => put(`/admin/events/${eid}/tiers`, { tiers }),
    primary: ['draft', 'rejected', 'in_review'].includes(ev.status) ? {
      label: ev.status === 'in_review' ? t('Duyệt & đăng', 'Approve & publish') : t('Đăng ngay', 'Publish now'),
      run: async (eid) => { try { const out = await post(`/admin/events/${eid}/status`, { action: 'publish' }); toast(tx(out.message)); emit('counts'); setData(out); } catch (e) { toast(errorText(e), 'error'); } },
    } : null,
  };
  const m = ev.metrics;
  return h(Fragment, null,
    h(PageHeader, {
      back: { href: href('events'), label: t('Sự kiện', 'Events'), onClick: (e) => { e.preventDefault(); history.length > 1 ? history.back() : navigate(href('events')); } },
      eyebrow: h(Fragment, null, h(StatusPill, { status: ev.status }), ev.featured ? h(Pill, { tone: 'violet', icon: 'star', className: 'op-ml' }, t('Nổi bật', 'Featured')) : null, ev.heldForReports ? h(Pill, { tone: 'danger', icon: 'flag', className: 'op-ml' }, t('Tạm ẩn do báo cáo', 'Held after reports')) : null),
      title: ev.title,
      sub: h('span', { className: 'op-head-meta' },
        h(Avatar, { name: ev.organizer.name, src: ev.organizer.logoUrl, size: 20, square: true }),
        h('a', { href: href('organizers', ev.organizer.id), onClick: (e) => { e.preventDefault(); navigate(href('organizers', ev.organizer.id)); } }, ev.organizer.name),
        ev.organizer.verified ? Icon('seal-check', true, 'op-verified') : null,
        h('span', null, ` · ${t('tạo', 'created')} ${stamp(ev.createdAt, true)} · ${t('sửa', 'edited')} ${ago(ev.updatedAt)}`)),
      actions: h(Fragment, null,
        h(Button, { icon: 'eye', href: ev.publicUrl, target: '_blank' }, t('Trang công khai', 'Public page')),
        ev.status === 'in_review' ? h(Button, { icon: 'stack', onClick: () => navigate(href('review', ev.id)) }, t('Mở ở hàng chờ', 'Open in queue')) : null,
        h(Menu, { items: [
          { icon: 'copy', label: t('Nhân bản thành nháp', 'Duplicate as draft'), onClick: async () => { try { const out = await post(`/admin/events/${ev.id}/duplicate`); toast(tx(out.message)); navigate(href('events', out.id)); } catch (e) { toast(errorText(e), 'error'); } } },
          { icon: 'receipt', label: t('Xem đơn hàng', 'View orders'), onClick: () => navigate(href('orders') + `?event=${ev.id}&eventLabel=${encodeURIComponent(ev.title)}`) },
          ...statusItems(ev, run).filter((x) => !(x && x.icon === 'rocket-launch')),
        ] })),
    }),
    h('div', { className: 'op-stats op-stats--compact' },
      h(Stat, { label: t('Lượt xem', 'Views'), value: num(m.views), note: t(`${num(m.clicks)} lượt bấm mua vé`, `${num(m.clicks)} ticket clicks`) }),
      h(Stat, { label: t('Quan tâm · lưu', 'Hype · saves'), value: `${num(m.hype)} · ${num(m.saves)}` }),
      h(Stat, { label: t('Vé đã bán', 'Tickets sold'), value: num(m.tickets), note: ev.capacity ? t(`trên ${num(ev.capacity)} chỗ`, `of ${num(ev.capacity)}`) : null }),
      h(Stat, { label: t('Doanh thu vé', 'Ticket revenue'), value: money(m.gross), note: m.refunded ? t(`${m.refunded} đơn đã hoàn`, `${m.refunded} refunded`) : null }),
      h(Stat, { label: t('Mục nổi bật', 'Shelves'), value: ev.shelves.length, note: ev.shelves.map((s) => tx(s.name)).join(', ') || t('Không có', 'None') })),
    h(Tabs, { value: tab, onChange: setTab, items: [
      { value: 'edit', icon: 'pencil-simple', label: t('Nội dung tin', 'Listing') },
      { value: 'history', icon: 'clock-counter-clockwise', label: t('Kiểm duyệt & lịch sử', 'Moderation & history'), count: ev.history.length },
    ] }),
    tab === 'history' ? h(History, { ev }) : h(EventForm, {
      key: `${ev.id}:${ev.status}:${ev.updatedAt}`, mode: 'team', draft: ev, actions, readOnly: false, orgName: ev.organizer.name,
      banner: ev.status === 'in_review' ? h('div', { className: 'op-banner op-banner--warn' }, Icon('hourglass-medium', true), h('div', null, h('strong', null, t('Đang chờ duyệt', 'In review')), t(' — sửa ở đây không trả tin về cho nhà tổ chức; bấm "Duyệt & đăng" khi đã ổn.', ' — edits here do not bounce it back to the organizer; press "Approve & publish" when it is right.')))
        : ev.status === 'rejected' ? h('div', { className: 'op-banner op-banner--danger' }, Icon('arrow-u-up-left', true), h('div', null, h('strong', null, t('Đã trả lại', 'Sent back')), ev.decisions[0]?.reason ? ` · ${tx(ev.decisions[0].reason)}` : '')) : null,
      onSaved: (out) => out && setData(out),
    }),
    dialog);
}

function EventCreate() {
  const route = useRoute();
  const preset = route.query.get('org') ? { id: route.query.get('org'), label: route.query.get('orgName') } : null;
  const actions = {
    create: (p) => post('/admin/events', p),
    update: null, tiers: null, primary: null,
  };
  return h(Fragment, null,
    h(PageHeader, {
      back: { href: href('events'), label: t('Sự kiện', 'Events'), onClick: (e) => { e.preventDefault(); navigate(href('events')); } },
      eyebrow: t('Đội FeestFinder tạo thay nhà tổ chức', 'Created by the team for an organizer'), title: t('Tạo sự kiện', 'New listing'),
      sub: t('Dùng cho sự kiện đội tự thu thập hoặc nhận qua email/Zalo. Tạo nháp để nhà tổ chức hoàn thiện, hoặc bật "Đăng ngay" khi đã kiểm chứng.', 'For events the team sources itself or receives by email/Zalo. Create a draft for the organizer to finish, or turn on "Publish" when it is verified.'),
    }),
    h(EventForm, { mode: 'team', draft: null, actions, presetOrganizer: preset, onSaved: (out, { created }) => { if (created && out?.id) { emit('counts'); navigate(href('events', out.id), { replace: true, force: true }); } } }));
}

export function Events({ rest }) {
  const sub = rest[1];
  if (sub === 'new') return h(EventCreate);
  if (sub) return h(EventDetail, { key: sub, id: sub });
  return h(EventList);
}
