/*
 * Team mode: what users reported (grouped by listing and category) and organisers'
 * appeals against a send-back. Each row carries the decision buttons it needs.
 */
import { h, Fragment, useState, useMemo, t, tx, cx, post, href, navigate, useFetch, useQueryState, toast, errorText, emit, duration, stamp, num } from '../core.js';
import { PageHeader, Button, Icon, Pill, Thumb, Spinner, ErrorBox, Empty, FilterBar, FilterSelect, DataTable, Tabs, Stat, StatusPill, Card, confirm, Select } from '../ui.js';
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
      dismiss: [t('Bỏ qua báo cáo này?', 'Dismiss these reports?'), t('Báo cáo được đóng, tin giữ nguyên. Nếu tin đang bị tạm ẩn do báo cáo, tin hiện lại.', 'The reports close and the listing stays. If it was held after reports, it shows again.'), t('Bỏ qua', 'Dismiss')],
      warn: [t('Cảnh cáo nhà tổ chức?', 'Warn the organizer?'), t('Thêm một lần cảnh cáo. Đến 3 lần, tài khoản bị tạm dừng.', 'Adds a strike. At three, the account is suspended.'), t('Gửi cảnh cáo', 'Send warning')],
    }[kind];
    let body = { category: r.category };
    if (kind === 'take_down') {
      const out = await confirm({ title: t('Gỡ tin này?', 'Take this listing down?'), body: t(`"${r.subject}" sẽ bị gỡ khỏi FeestFinder và mọi báo cáo được đóng.`, `"${r.subject}" is removed from FeestFinder and every report closes.`), confirm: t('Gỡ tin', 'Take down'), tone: 'danger' });
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
    h('div', { className: 'op-stats' }, data.last30Days.map((c) => h(Stat, { key: c.category, label: tx(c.label), icon: CAT[c.category]?.[1], value: c.count, note: t('báo cáo trong 30 ngày', 'reports in 30 days'), active: cat === c.category, onClick: () => setCat(cat === c.category ? '' : c.category) }))),
    h(FilterBar, {
      active: cat ? 1 : 0, onReset: () => setCat(''),
      right: h(FilterSelect, { label: t('Sắp xếp', 'Sort'), icon: 'arrows-down-up', value: sort, onChange: (v) => setSort(v || 'count'), options: [{ value: 'count', label: t('Nhiều người báo nhất', 'Most reporters') }, { value: 'age', label: t('Mở lâu nhất', 'Open longest') }] }),
    }, h(FilterSelect, { label: t('Loại báo cáo', 'Category'), icon: 'flag', value: cat, onChange: setCat, allLabel: t('Mọi loại', 'Every category'), options: data.last30Days.map((c) => ({ value: c.category, label: tx(c.label), count: data.items.filter((x) => x.category === c.category).length })) })),
    h(DataTable, { columns, rows, minWidth: 1000, empty: h(Empty, { icon: 'check-circle', title: t('Không có báo cáo đang mở', 'No open reports'), body: t('Hai người báo cáo cùng một tin sẽ tự tạm ẩn tin khỏi feed.', 'Two reporters on the same listing hold it from the feed automatically.') }) }));
}

function AppealsTab() {
  const { data, error, loading, reload } = useFetch('/admin/appeals');
  const [busy, setBusy] = useState(null);
  const decide = async (a, kind) => {
    const ok = await confirm(kind === 'overturn'
      ? { title: t('Lật lại quyết định và đăng tin?', 'Overturn and publish?'), body: t(`"${a.title}" sẽ lên sóng ngay.`, `"${a.title}" goes live now.`), confirm: t('Lật lại & đăng', 'Overturn & publish') }
      : { title: t('Giữ quyết định trả lại?', 'Uphold the send-back?'), body: t('Kháng nghị được đóng; nhà tổ chức vẫn có thể sửa và gửi lại.', 'The appeal closes; the organizer can still fix and resubmit.'), confirm: t('Giữ quyết định', 'Uphold'), tone: 'danger' });
    if (!ok) return;
    setBusy(a.id + kind);
    try { const out = await post(`/admin/appeals/${a.id}/${kind}`); toast(tx(out.message)); emit('counts'); reload(true); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(null); }
  };
  if (loading && !data) return h(Spinner);
  if (error) return h(ErrorBox, { error, onRetry: reload });
  if (!data.items.length) return h(Empty, { icon: 'gavel', title: t('Không có kháng nghị đang mở', 'No open appeals'), body: t('Khi trả lại tin với lý do cho phép kháng nghị, nhà tổ chức có 7 ngày để phản hồi.', 'When a send-back allows an appeal, the organizer has 7 days to reply.') });
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

export function Reports({ counts }) {
  const [tab, setTab] = useQueryState('tab', 'reports');
  return h(Fragment, null,
    h(PageHeader, { eyebrow: t('Kiểm duyệt · sau khi đăng', 'Moderation · after publishing'), title: t('Báo cáo & kháng nghị', 'Reports & appeals'), sub: t('Báo cáo từ người dùng về tin đang đăng, và phản hồi của nhà tổ chức khi bị trả lại.', 'User reports on live listings, and organizers answering a send-back.') }),
    h(Tabs, { value: tab, onChange: setTab, items: [
      { value: 'reports', icon: 'flag', label: t('Báo cáo người dùng', 'User reports'), count: counts.reports, alert: true },
      { value: 'appeals', icon: 'gavel', label: t('Kháng nghị', 'Appeals'), count: counts.appeals, alert: true },
    ] }),
    tab === 'appeals' ? h(AppealsTab) : h(ReportsTab));
}
