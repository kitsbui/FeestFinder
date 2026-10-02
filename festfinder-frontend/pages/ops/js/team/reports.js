/*
 * Team mode: what users reported (grouped by listing and category) and organisers'
 * appeals against a send-back. Each row carries the decision buttons it needs.
 */
import { h, Fragment, useState, useMemo, t, tx, cx, post, patch, del, href, navigate, useFetch, useQueryState, toast, errorText, emit, duration, stamp, num } from '../core.js';
import { PageHeader, Button, Icon, Pill, Thumb, Spinner, ErrorBox, Empty, FilterBar, FilterSelect, DataTable, Tabs, StatusPill, Card, confirm, Select } from '../ui.js';
import { rejectOptions } from '../opts.js';

const CAT = { refund: ['danger', 'receipt-x'], wrong: ['warn', 'map-pin-line'], price: ['warn', 'tag'], safety: ['danger', 'warning-octagon'] };

function ReportsTab() {
  const { data, error, loading, reload, setData } = useFetch('/admin/reports');
  const [cat, setCat] = useQueryState('cat', '');
  const [sort, setSort] = useQueryState('sort', 'count');
  const [busy, setBusy] = useState(null);
  const rows = useMemo(() => (data?.items ?? []).filter((r) => !cat || r.category === cat).sort((a, b) => (sort === 'age' ? b.ageMinutes - a.ageMinutes : b.count - a.count)), [data, cat, sort]);
  const act = async (r, kind) => {
    const copy = {
      dismiss: [t('Bỏ qua báo cáo này?', 'Dismiss these reports?'), t('Tin giữ nguyên và hiện lại nếu đang bị tạm ẩn.', 'The listing stays and shows again if it was held.'), t('Bỏ qua', 'Dismiss')],
      warn: [t('Cảnh cáo nhà tổ chức?', 'Warn the organizer?'), t('Cảnh cáo lần 3 sẽ tạm dừng tài khoản.', 'A third strike suspends the account.'), t('Gửi cảnh cáo', 'Send warning')],
    }[kind];
    let body = { category: r.category };
    if (kind === 'take_down') {
      const out = await confirm({ title: t('Gỡ tin này?', 'Take this listing down?'), body: r.subject, confirm: t('Gỡ tin', 'Take down'), tone: 'danger' });
      if (!out) return;
      body = {};
    } else if (!(await confirm({ title: copy[0], body: copy[1], confirm: copy[2], tone: kind === 'warn' ? 'danger' : undefined }))) return;
    setBusy(r.id + kind);
    try {
      const out = await post(`/admin/reports/${r.eventId}/${kind === 'take_down' ? 'take-down' : kind}`, body);
      toast(tx(out.message));
      emit('counts');
      reload(true);
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(null); }
  };
  if (loading && !data) return h(Spinner);
  if (error) return h(ErrorBox, { error, onRetry: reload });
  const columns = [
    { key: 'subject', label: t('Tin bị báo cáo', 'Reported listing'), render: (r) => h('div', null, h('div', { className: 'op-cell-title' }, r.subject), h('div', { className: 'op-flags', style: { marginTop: 4 } }, h(StatusPill, { status: r.eventStatus }), r.heldFromFeed ? h(Pill, { tone: 'danger', icon: 'eye-slash' }, t('Tạm ẩn khỏi feed', 'Held from feed')) : null)) },
    { key: 'cat', label: t('Loại', 'Category'), width: 150, render: (r) => h(Pill, { tone: CAT[r.category]?.[0], icon: CAT[r.category]?.[1] }, tx(r.categoryLabel)) },
    { key: 'n', label: t('Người báo', 'Reporters'), width: 100, align: 'right', render: (r) => h('strong', { className: 'op-cell-num' }, r.count) },
    { key: 'quote', label: t('Trích dẫn', 'Quote'), render: (r) => r.quote ? h('span', { className: 'op-quote-inline' }, `“${r.quote}”`) : h('span', { className: 'op-cell-muted' }, '—') },
    { key: 'age', label: t('Mở từ', 'Open for'), width: 100, render: (r) => h('span', { className: 'op-cell-muted op-nowrap' }, duration(r.ageMinutes)) },
    { key: 'act', label: '', width: 330, align: 'right', render: (r) => h('div', { className: 'op-row-actions' },
      h(Button, { size: 'sm', variant: 'quiet', icon: 'eye', onClick: () => navigate(href('events', r.eventId)), title: t('Xem tin', 'Open listing') }),
      h(Button, { size: 'sm', busy: busy === r.id + 'dismiss', onClick: () => act(r, 'dismiss') }, t('Bỏ qua', 'Dismiss')),
      h(Button, { size: 'sm', busy: busy === r.id + 'warn', onClick: () => act(r, 'warn') }, t('Cảnh cáo', 'Warn')),
      r.eventStatus !== 'removed' ? h(Button, { size: 'sm', variant: 'danger', busy: busy === r.id + 'take_down', onClick: () => act(r, 'take_down') }, t('Gỡ tin', 'Take down')) : null) },
  ];
  return h(Fragment, null,
    h(FilterBar, {
      active: cat ? 1 : 0, onReset: () => setCat(''),
      right: h(FilterSelect, { label: t('Sắp xếp', 'Sort'), icon: 'arrows-down-up', value: sort, onChange: (v) => setSort(v || 'count'), options: [{ value: 'count', label: t('Nhiều người báo nhất', 'Most reporters') }, { value: 'age', label: t('Mở lâu nhất', 'Open longest') }] }),
    }, h(FilterSelect, { label: t('Loại báo cáo', 'Category'), icon: 'flag', value: cat, onChange: setCat, allLabel: t('Mọi loại', 'Every category'), options: data.last30Days.map((c) => ({ value: c.category, label: tx(c.label), count: data.items.filter((x) => x.category === c.category).length })) })),
    h(DataTable, { columns, rows, minWidth: 1000, empty: h(Empty, { icon: 'check-circle', title: t('Không có báo cáo đang mở', 'No open reports') }) }));
}

function AppealsTab() {
  const { data, error, loading, reload } = useFetch('/admin/appeals');
  const [busy, setBusy] = useState(null);
  const decide = async (a, kind) => {
    const ok = await confirm(kind === 'overturn'
      ? { title: t('Lật lại quyết định và đăng tin?', 'Overturn and publish?'), body: t(`"${a.title}" sẽ lên sóng ngay.`, `"${a.title}" goes live now.`), confirm: t('Lật lại & đăng', 'Overturn & publish') }
      : { title: t('Giữ quyết định trả lại?', 'Uphold the send-back?'), body: a.title, confirm: t('Giữ quyết định', 'Uphold'), tone: 'danger' });
    if (!ok) return;
    setBusy(a.id + kind);
    try { const out = await post(`/admin/appeals/${a.id}/${kind}`); toast(tx(out.message)); emit('counts'); reload(true); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(null); }
  };
  if (loading && !data) return h(Spinner);
  if (error) return h(ErrorBox, { error, onRetry: reload });
  if (!data.items.length) return h(Empty, { icon: 'gavel', title: t('Không có kháng nghị đang mở', 'No open appeals') });
  return h('div', { className: 'op-appeals' }, data.items.map((a) => h(Card, { key: a.id, className: 'op-appeal-card' },
    h('div', { className: 'op-appeal-head' },
      h(Thumb, { src: a.coverUrl, art: a.art, title: a.title, w: 88 }),
      h('div', { style: { flex: 1, minWidth: 0 } },
        h('div', { className: 'op-cell-title' }, a.title),
        h('div', { className: 'op-cell-sub' }, a.organizer, ' · ', t(`trả lại ${stamp(a.rejectedAt)}`, `sent back ${stamp(a.rejectedAt)}`)),
        h('div', { className: 'op-flags', style: { marginTop: 6 } }, h(Pill, { tone: 'danger', icon: 'arrow-u-up-left' }, tx(a.reason)), h(Pill, { tone: a.state === 'replied' ? 'warn' : 'neutral' }, tx(a.stateLabel)), h(Pill, { icon: 'clock' }, t(`còn ${a.closesInDays} ngày`, `${a.closesInDays} days left`))))),
    h('div', { className: 'op-appeal-body' },
      h('div', null, h('div', { className: 'op-section-title' }, t('FeestFinder đã viết', 'FeestFinder wrote')), h('blockquote', { className: 'op-quote' }, a.message)),
      h('div', null, h('div', { className: 'op-section-title' }, t('Nhà tổ chức phản hồi', 'The organizer replied')), a.reply ? h('blockquote', { className: 'op-quote op-quote--org' }, a.reply) : h('p', { className: 'op-hint' }, t('Chưa phản hồi.', 'No reply yet.')))),
    h('div', { className: 'op-appeal-actions' },
      h(Button, { size: 'sm', variant: 'quiet', icon: 'eye', onClick: () => navigate(href('events', a.eventId)) }, t('Xem tin', 'Open listing')),
      h('span', { className: 'op-spacer' }),
      h(Button, { size: 'sm', variant: 'danger', busy: busy === a.id + 'uphold', onClick: () => decide(a, 'uphold') }, t('Giữ quyết định', 'Uphold')),
      h(Button, { size: 'sm', variant: 'ok', icon: 'check', busy: busy === a.id + 'overturn', onClick: () => decide(a, 'overturn') }, t('Lật lại & đăng', 'Overturn & publish'))))));
}

const POST_CODE = { spam: ['Spam', 'Spam'], scalping: ['Phe vé', 'Scalping'], abuse: ['Xúc phạm', 'Abuse'], drugs: ['Chất cấm', 'Drugs'], personal: ['Thông tin cá nhân', 'Personal data'], other: ['Khác', 'Other'] };

/** Discussion posts people reported, across every event page. Three reports hide a post until someone decides. */
function PostsTab() {
  const { data, error, loading, reload } = useFetch('/admin/posts/reported');
  const [busy, setBusy] = useState(null);
  const act = async (p, kind) => {
    if (kind === 'remove' && !(await confirm({ title: t('Xoá bài này?', 'Delete this post?'), body: p.body.slice(0, 160), confirm: t('Xoá', 'Delete'), tone: 'danger' }))) return;
    setBusy(p.id + kind);
    try {
      const out = kind === 'dismiss' ? await post(`/admin/posts/${p.id}/dismiss`)
        : kind === 'remove' ? await del(`/posts/${p.id}`)
        : await patch(`/posts/${p.id}`, { hidden: kind === 'hide' });
      toast(tx(out.message));
      reload(true);
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(null); }
  };
  if (loading && !data) return h(Spinner);
  if (error) return h(ErrorBox, { error, onRetry: reload });
  const columns = [
    { key: 'body', label: t('Bài viết', 'Post'), render: (p) => h('div', null, h('div', { className: 'op-quote-inline' }, `“${p.body}”`), h('div', { className: 'op-cell-sub' }, p.author.name, ' · ', tx(p.kindLabel), ' · ', stamp(p.createdAt))) },
    { key: 'event', label: t('Sự kiện', 'Event'), width: 220, render: (p) => h('a', { href: `/e/${p.event.slug}#thao-luan`, target: '_blank', rel: 'noopener' }, p.event.title) },
    { key: 'why', label: t('Lý do', 'Why'), width: 190, render: (p) => h('div', { className: 'op-flags' }, p.codes.map((c) => h(Pill, { key: c, tone: c === 'scalping' || c === 'drugs' ? 'danger' : 'warn' }, t(...(POST_CODE[c] ?? [c, c]))))) },
    { key: 'n', label: t('Lượt báo', 'Reports'), width: 90, align: 'right', render: (p) => h('strong', { className: 'op-cell-num' }, p.reports) },
    { key: 'status', label: t('Trạng thái', 'Status'), width: 110, render: (p) => p.status === 'hidden' ? h(Pill, { tone: 'danger', icon: 'eye-slash' }, t('Đang ẩn', 'Hidden')) : h(Pill, { tone: 'ok' }, t('Đang hiện', 'Visible')) },
    { key: 'act', label: '', width: 290, align: 'right', render: (p) => h('div', { className: 'op-row-actions' },
      h(Button, { size: 'sm', busy: busy === p.id + 'dismiss', onClick: () => act(p, 'dismiss') }, t('Giữ bài', 'Keep')),
      p.status === 'hidden' ? null : h(Button, { size: 'sm', busy: busy === p.id + 'hide', onClick: () => act(p, 'hide') }, t('Ẩn', 'Hide')),
      h(Button, { size: 'sm', variant: 'danger', busy: busy === p.id + 'remove', onClick: () => act(p, 'remove') }, t('Xoá', 'Delete'))) },
  ];
  return h(DataTable, { columns, rows: data.items, minWidth: 1000, empty: h(Empty, { icon: 'check-circle', title: t('Không có bài bị báo cáo', 'No reported posts') }) });
}

export function Reports({ counts }) {
  const [tab, setTab] = useQueryState('tab', 'reports');
  return h(Fragment, null,
    h(PageHeader, { title: t('Báo cáo & kháng nghị', 'Reports & appeals') }),
    h(Tabs, { value: tab, onChange: setTab, items: [
      { value: 'reports', icon: 'flag', label: t('Báo cáo người dùng', 'User reports'), count: counts.reports, alert: true },
      { value: 'appeals', icon: 'gavel', label: t('Kháng nghị', 'Appeals'), count: counts.appeals, alert: true },
      { value: 'posts', icon: 'chats-circle', label: t('Bài thảo luận', 'Discussion posts') },
    ] }),
    tab === 'appeals' ? h(AppealsTab) : tab === 'posts' ? h(PostsTab) : h(ReportsTab));
}
