/*
 * Organizer mode: every listing the organiser has, by status, with what each one still
 * needs. Filters live in the URL, so "my drafts" or "sent back" can be bookmarked.
 */
import { h, Fragment, useMemo, t, tx, cx, fold, href, navigate, useFetch, useQueryState, setQuery, post, del, toast, errorText, day, ago, num, vnDate, emit } from '../core.js';
import { PageHeader, Button, FilterBar, FilterSelect, DataTable, StatusPill, Thumb, Meter, Menu, Tabs, Spinner, ErrorBox, Empty, Pill, Icon, confirm, DateBox } from '../ui.js';
import { genreOptions } from '../opts.js';

const MISSING = { title: ['tên', 'name'], genre: ['thể loại', 'genre'], dates: ['ngày giờ', 'dates'], venue: ['địa điểm', 'venue'], price: ['giá & link vé', 'price & link'], logo: ['logo', 'logo'], eventUrl: ['trang sự kiện', 'event page'] };

export function OrgEvents() {
  const { data, error, loading, reload } = useFetch('/organizer/events');
  const [status, setStatus] = useQueryState('status', 'all');
  const [q, setQ] = useQueryState('q', '');
  const [genre, setGenre] = useQueryState('genre', '');
  const [when, setWhen] = useQueryState('when', 'all');
  const [sort, setSort] = useQueryState('sort', 'date');
  const today = vnDate();
  const items = data?.items ?? [];
  const isPast = (e) => (e.endsOn || e.startsOn) && (e.endsOn || e.startsOn) < today;
  const counts = useMemo(() => {
    const c = { all: items.length, draft: 0, in_review: 0, live: 0, rejected: 0, past: 0 };
    for (const e of items) { if (isPast(e) && e.status === 'live') c.past++; else if (c[e.status] !== undefined) c[e.status]++; }
    return c;
  }, [items]);
  const genres = genre ? genre.split(',') : [];
  const rows = useMemo(() => items
    .filter((e) => status === 'all' || (status === 'past' ? isPast(e) && e.status === 'live' : e.status === status && !(status === 'live' && isPast(e))))
    .filter((e) => !q || fold(`${e.title} ${e.venueName ?? ''} ${e.area ?? ''}`).includes(fold(q)))
    .filter((e) => !genres.length || genres.includes(e.genre))
    .filter((e) => when === 'all' || (when === 'upcoming' ? !isPast(e) : when === 'past' ? isPast(e) : !e.startsOn))
    .sort((a, b) => sort === 'updated' ? String(b.updatedAt).localeCompare(String(a.updatedAt)) : sort === 'quality' ? (b.qualityScore ?? 0) - (a.qualityScore ?? 0) : 0), [items, status, q, genre, when, sort]);

  const open = (e) => navigate(href('org', 'events', e.id));
  const duplicate = async (e) => {
    try { const out = await post(`/organizer/events/${e.id}/duplicate`); toast(tx(out.message)); navigate(href('org', 'events', out.id)); } catch (err) { toast(errorText(err), 'error'); }
  };
  const submit = async (e) => {
    try { const out = await post(`/organizer/events/${e.id}/submit`); toast(tx(out.message)); emit('counts'); reload(true); } catch (err) { toast(errorText(err), 'error'); }
  };
  const remove = async (e) => {
    if (!(await confirm({ title: t('Xoá bản nháp?', 'Delete draft?'), body: e.title, confirm: t('Xoá', 'Delete'), tone: 'danger' }))) return;
    try { await del(`/organizer/events/${e.id}`); toast(t('Đã xoá', 'Deleted')); reload(true); } catch (err) { toast(errorText(err), 'error'); }
  };

  const active = [genre, when !== 'all' ? when : '', q].filter(Boolean).length;
  const columns = [
    { key: 'when', label: t('Ngày', 'Date'), width: 76, render: (e) => e.startsOn ? h(DateBox, { iso: e.startsOn }) : h('span', { className: 'op-cell-muted' }, t('Chưa có', 'None')) },
    { key: 'title', label: t('Sự kiện', 'Event'), render: (e) => h('div', { className: 'op-cell-main' }, h(Thumb, { src: e.coverUrl, art: e.art, title: e.title, w: 64 }),
      h('div', { style: { minWidth: 0 } }, h('div', { className: 'op-cell-title' }, e.title), h('div', { className: 'op-cell-sub' }, [e.genre, e.venueName, e.startTime && `${e.startTime}–${e.endTime}`].filter(Boolean).join(' · ') || tx(e.meta)))) },
    { key: 'status', label: t('Trạng thái', 'Status'), width: 200, render: (e) => h('div', { className: 'op-status-cell' },
      isPast(e) && e.status === 'live' ? h(Pill, { tone: 'neutral', icon: 'flag-checkered' }, t('Đã diễn ra', 'Ended')) : h(StatusPill, { status: e.status }),
      e.status === 'rejected' && e.lastDecision?.reason ? h('div', { className: 'op-cell-sub is-danger' }, tx(e.lastDecision.reason)) : null,
      ['draft', 'rejected'].includes(e.status) && e.missing?.length ? h('div', { className: 'op-cell-sub' }, t('Thiếu: ', 'Missing: ') + e.missing.map((k) => t(MISSING[k][0], MISSING[k][1])).join(', ')) : null,
      ['draft', 'rejected'].includes(e.status) && !e.missing?.length ? h('div', { className: 'op-cell-sub is-ok' }, t('Sẵn sàng gửi duyệt', 'Ready to submit')) : null,
      e.status === 'in_review' ? h('div', { className: 'op-cell-sub' }, t(`Gửi ${ago(e.submittedAt)}`, `Submitted ${ago(e.submittedAt)}`)) : null) },
    { key: 'quality', label: t('Chất lượng', 'Quality'), width: 116, render: (e) => e.qualityScore == null ? '—' : h('div', { className: 'op-nowrap' }, h(Meter, { value: e.qualityScore, tone: e.qualityScore >= 85 ? 'ok' : e.qualityScore >= 60 ? 'warn' : 'danger' }), h('span', { className: 'op-cell-num', style: { marginLeft: 8 } }, e.qualityScore)) },
    { key: 'perf', label: t('Xem · lưu · bấm vé', 'Views · saves · clicks'), width: 150, render: (e) => e.views == null ? h('span', { className: 'op-cell-muted' }, t('Chưa đăng', 'Not live yet')) : h('span', { className: 'op-cell-num' }, `${num(e.views)} · ${num(e.saves)} · ${num(e.clicks)}`) },
    { key: 'updated', label: t('Cập nhật', 'Updated'), width: 104, render: (e) => h('span', { className: 'op-cell-muted op-nowrap' }, ago(e.updatedAt)) },
    { key: 'act', label: '', width: 52, align: 'right', render: (e) => h(Menu, { items: [
      { icon: 'pencil-simple', label: t('Mở & sửa', 'Open & edit'), onClick: () => open(e) },
      ['draft', 'rejected'].includes(e.status) && !e.missing?.length ? { icon: 'paper-plane-right', label: e.status === 'rejected' ? t('Gửi duyệt lại', 'Resubmit') : t('Gửi duyệt', 'Submit for review'), tone: 'ok', onClick: () => submit(e) } : null,
      { icon: 'copy', label: t('Nhân bản thành nháp', 'Duplicate as draft'), onClick: () => duplicate(e) },
      { icon: 'arrow-square-out', label: t('Xem trang sự kiện', 'View event page'), onClick: () => window.open(`/e/${e.slug}`, '_blank', 'noopener') },
      e.status === 'draft' ? '-' : null,
      e.status === 'draft' ? { icon: 'trash', label: t('Xoá bản nháp', 'Delete draft'), tone: 'danger', onClick: () => remove(e) } : null,
    ] }) },
  ];

  return h(Fragment, null,
    h(PageHeader, {
      title: t('Sự kiện của tôi', 'My events'),
      actions: h(Button, { variant: 'cta', icon: 'plus', onClick: () => navigate(href('org', 'events', 'new')) }, t('Tạo sự kiện mới', 'New event')),
    }),
    h(Tabs, { value: status, onChange: setStatus, items: [
      { value: 'all', label: t('Tất cả', 'All'), count: counts.all },
      { value: 'draft', label: t('Nháp', 'Drafts'), count: counts.draft },
      { value: 'in_review', label: t('Chờ duyệt', 'In review'), count: counts.in_review },
      { value: 'live', label: t('Đang đăng', 'Live'), count: counts.live },
      { value: 'rejected', label: t('Bị trả lại', 'Sent back'), count: counts.rejected, alert: true },
      { value: 'past', label: t('Đã diễn ra', 'Ended'), count: counts.past },
    ] }),
    h(FilterBar, {
      search: q, onSearch: setQ, placeholder: t('Tìm theo tên, địa điểm…', 'Search by name, venue…'), active,
      onReset: () => setQuery({ q: '', genre: '', when: '' }),
      right: h(FilterSelect, { label: t('Sắp xếp', 'Sort'), icon: 'arrows-down-up', value: sort, onChange: (v) => setSort(v || 'date'), options: [
        { value: 'date', label: t('Ngày diễn ra', 'Event date') }, { value: 'updated', label: t('Mới cập nhật', 'Recently updated') }, { value: 'quality', label: t('Chất lượng cao nhất', 'Best quality') }] }),
    },
    h(FilterSelect, { label: t('Thể loại', 'Genre'), icon: 'music-notes', multi: true, value: genres, onChange: (v) => setGenre(v.join(',')), options: genreOptions() }),
    h(FilterSelect, { label: t('Thời gian', 'When'), icon: 'calendar-blank', value: when === 'all' ? '' : when, onChange: (v) => setWhen(v || 'all'), allLabel: t('Mọi thời gian', 'Any time'), options: [
      { value: 'upcoming', label: t('Sắp diễn ra', 'Upcoming') }, { value: 'past', label: t('Đã diễn ra', 'Past') }, { value: 'undated', label: t('Chưa có ngày', 'No date yet') }] })),
    error ? h(ErrorBox, { error, onRetry: reload }) : null,
    h(DataTable, {
      columns, rows, loading, onRowClick: open, rowTone: (e) => (isPast(e) && e.status === 'live' ? 'is-dim' : null),
      empty: items.length
        ? h(Empty, { icon: 'funnel', title: t('Không có tin nào khớp bộ lọc', 'No listing matches these filters'), action: h(Button, { onClick: () => setQuery({ q: '', genre: '', when: '', status: '' }) }, t('Xem tất cả', 'Show all')) })
        : h(Empty, { icon: 'calendar-plus', title: t('Chưa có sự kiện nào', 'No events yet'), action: h(Button, { variant: 'cta', icon: 'plus', onClick: () => navigate(href('org', 'events', 'new')) }, t('Tạo sự kiện', 'Create an event')) }),
    }));
}
