/*
 * Team mode: the sources FeestFinder reads on a schedule (venue and festival sites with
 * schema.org data, ICS calendars, Ticketmaster), what each run found, and the raw records
 * each one sent. New events from a source wait in the review queue like any submission.
 */
import { h, Fragment, useState, useEffect, t, tx, get, post, patch, del, useFetch, toast, errorText, emit, stamp, ago, num, href, navigate } from '../core.js';
import { PageHeader, Button, Icon, Pill, Spinner, ErrorBox, Empty, DataTable, Drawer, Field, Input, Select, Switch, Tabs, Card, Modal, Segmented } from '../ui.js';

const ADAPTER = {
  website: () => t('Trang web (schema.org)', 'Website (schema.org)'),
  ics: () => t('Lịch ICS', 'ICS calendar'),
  ticketmaster: () => 'Ticketmaster',
};
const AUTHORITY = {
  official: () => t('Chính thức', 'Official'),
  ticketing: () => t('Bán vé', 'Ticket seller'),
  listing: () => t('Trang đăng tin', 'Listing'),
};
const RAW_STATUS = {
  created: ['ok', () => t('Tạo mới', 'New')],
  merged: ['info', () => t('Đã gộp', 'Merged')],
  rejected: ['warn', () => t('Bỏ qua', 'Skipped')],
  failed: ['danger', () => t('Lỗi', 'Failed')],
  pending: ['neutral', () => t('Đang chờ', 'Pending')],
};

/** Launched cities for the city picker, read once. */
let citiesCache = null;
function useCities() {
  const [cities, setCities] = useState(citiesCache ?? []);
  useEffect(() => {
    if (citiesCache) return;
    get('/meta/discovery').then((m) => { citiesCache = m.cities; setCities(m.cities); }).catch(() => {});
  }, []);
  return cities;
}

function runLine(r) {
  if (!r) return h('span', { className: 'op-cell-muted' }, t('Chưa chạy', 'Not run yet'));
  return h('div', { className: 'op-cell-num' },
    h('div', null, t(`${num(r.created)} mới · ${num(r.merged)} gộp`, `${num(r.created)} new · ${num(r.merged)} merged`)),
    h('small', { className: 'op-cell-muted' }, t(`${num(r.fetched)} đọc · ${num(r.rejected)} bỏ qua`, `${num(r.fetched)} read · ${num(r.rejected)} skipped`), r.failed ? ` · ${num(r.failed)} ${t('lỗi', 'failed')}` : ''));
}

function SourceForm({ source, onClose, onSaved }) {
  const cities = useCities();
  const editing = !!source?.id;
  const [f, setF] = useState(() => ({
    adapter: source?.adapter ?? 'website', name: source?.name ?? '', url: source?.url ?? '', city: source?.city ?? '',
    authority: source?.authority ?? 'official', hours: String(Math.round((source?.intervalMinutes ?? 720) / 60)), enabled: source?.enabled ?? true,
    follow: source?.config?.follow ?? '', maxPages: String(source?.config?.maxPages ?? 20),
    countryCode: source?.config?.countryCode ?? '', tmCity: source?.config?.city ?? '', pages: String(source?.config?.pages ?? 1),
  }));
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const needsUrl = f.adapter !== 'ticketmaster';
  const ok = f.name.trim().length >= 2 && (!needsUrl || /^https?:\/\/\S+\.\S+/.test(f.url.trim())) && Number(f.hours) >= 1;
  const save = async () => {
    setBusy(true);
    const config = f.adapter === 'website' ? (f.follow.trim() ? { follow: f.follow.trim(), maxPages: Number(f.maxPages) || 20 } : {})
      : f.adapter === 'ticketmaster' ? { ...(f.countryCode ? { countryCode: f.countryCode.toUpperCase() } : {}), ...(f.tmCity ? { city: f.tmCity } : {}), pages: Number(f.pages) || 1 } : {};
    const body = {
      adapter: f.adapter, name: f.name.trim(), url: needsUrl ? f.url.trim() : null, city: f.city || null, authority: f.authority,
      intervalMinutes: Math.round(Number(f.hours) * 60), enabled: f.enabled, config,
    };
    try {
      const out = editing ? await patch(`/admin/sources/${source.id}`, body) : await post('/admin/sources', body);
      toast(editing ? t('Đã lưu nguồn', 'Source saved') : t('Đã thêm nguồn', 'Source added'));
      onSaved(out);
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  return h(Drawer, {
    open: true, onClose, width: 600, title: editing ? source.name : t('Thêm nguồn', 'Add a source'),
    footer: h(Fragment, null, h(Button, { onClick: onClose }, t('Huỷ', 'Cancel')), h('span', { className: 'op-spacer' }),
      h(Button, { variant: 'cta', icon: 'check', busy, disabled: !ok, onClick: save }, editing ? t('Lưu', 'Save') : t('Thêm nguồn', 'Add source'))),
  },
  h('div', { className: 'op-form-grid' },
    h(Field, { label: t('Loại nguồn', 'Kind'), className: 'is-wide' },
      h(Segmented, { value: f.adapter, onChange: set('adapter'), options: Object.keys(ADAPTER).map((k) => ({ value: k, label: ADAPTER[k]() })) })),
    h(Field, { label: t('Tên', 'Name'), required: true, className: 'is-wide' }, h(Input, { value: f.name, onChange: set('name'), placeholder: t('vd: The Warehouse BKK', 'e.g. The Warehouse BKK'), autoFocus: !editing })),
    needsUrl ? h(Field, { label: f.adapter === 'ics' ? t('Địa chỉ lịch (.ics)', 'Calendar address (.ics)') : t('Địa chỉ trang', 'Page address'), required: true, className: 'is-wide' },
      h(Input, { value: f.url, onChange: set('url'), icon: 'link', placeholder: 'https://' })) : null,
    f.adapter === 'website' ? h(Fragment, null,
      h(Field, { label: t('Đọc cả các trang có đường dẫn chứa', 'Also read linked pages whose path contains'), optional: true, hint: t('Biểu thức, vd: /event/', 'A pattern, e.g. /event/') },
        h(Input, { value: f.follow, onChange: set('follow'), placeholder: '/event/' })),
      h(Field, { label: t('Tối đa số trang', 'Most pages') }, h(Input, { value: f.maxPages, onChange: set('maxPages'), inputMode: 'numeric' }))) : null,
    f.adapter === 'ticketmaster' ? h(Fragment, null,
      h(Field, { label: t('Mã quốc gia', 'Country code'), hint: 'SG, TH, JP…' }, h(Input, { value: f.countryCode, onChange: set('countryCode'), placeholder: 'SG', maxLength: 2 })),
      h(Field, { label: t('Thành phố (theo Ticketmaster)', 'City (as Ticketmaster names it)'), optional: true }, h(Input, { value: f.tmCity, onChange: set('tmCity'), placeholder: 'Singapore' })),
      h(Field, { label: t('Số trang (100 sự kiện/trang)', 'Pages (100 events each)') }, h(Input, { value: f.pages, onChange: set('pages'), inputMode: 'numeric' }))) : null,
    h(Field, { label: t('Thành phố mặc định', 'Default city') },
      h(Select, { value: f.city, onChange: set('city'), placeholder: t('— Theo địa chỉ từng sự kiện —', '— From each event’s address —'), options: cities.map((c) => ({ value: c.slug, label: tx(c.name) })) })),
    h(Field, { label: t('Mức tin cậy', 'Authority') },
      h(Select, { value: f.authority, onChange: set('authority'), options: Object.keys(AUTHORITY).map((k) => ({ value: k, label: AUTHORITY[k]() })) })),
    h(Field, { label: t('Đọc lại sau (giờ)', 'Read every (hours)') }, h(Input, { value: f.hours, onChange: set('hours'), inputMode: 'numeric' })),
    h(Switch, { checked: f.enabled, onChange: set('enabled'), label: t('Đang bật', 'Enabled') })));
}

function RawModal({ id, onClose }) {
  const { data, error, loading } = useFetch(id ? `/admin/raw/${id}` : null, [id]);
  return h(Modal, { open: !!id, onClose, width: 760, title: t('Bản ghi gốc', 'Raw record') },
    loading ? h(Spinner) : error ? h(ErrorBox, { error }) : data ? h(Fragment, null,
      h('div', { className: 'op-cell-sub', style: { marginBottom: 8 } }, [data.externalId, data.error].filter(Boolean).join(' · ')),
      h('pre', { className: 'op-json' }, JSON.stringify(data.payload, null, 2))) : null);
}

function SourceDetail({ source, onClose, onChanged }) {
  const [tab, setTab] = useState('runs');
  const [status, setStatus] = useState('');
  const runs = useFetch(`/admin/sources/${source.id}/runs`, [source.id, source.lastRunAt]);
  const raw = useFetch(`/admin/sources/${source.id}/raw${status ? `?status=${status}` : ''}`, [source.id, status, source.lastRunAt]);
  const [rawId, setRawId] = useState(null);
  const [busy, setBusy] = useState('');
  const act = async (what) => {
    setBusy(what);
    try {
      const out = await post(`/admin/sources/${source.id}/${what}`);
      const s = out.summary;
      toast(t(`${s.created} mới · ${s.merged} gộp · ${s.rejected} bỏ qua${s.failed ? ` · ${s.failed} lỗi` : ''}`, `${s.created} new · ${s.merged} merged · ${s.rejected} skipped${s.failed ? ` · ${s.failed} failed` : ''}`), s.failed && !s.created && !s.merged ? 'error' : 'ok');
      emit('counts');
      onChanged();
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(''); }
  };
  const runCols = [
    { key: 'started', label: t('Lúc', 'When'), width: 150, render: (r) => h('div', null, h('div', null, stamp(r.startedAt, true)), h('small', { className: 'op-cell-muted' }, r.trigger === 'manual' ? t('Chạy tay', 'Manual') : t('Theo lịch', 'Scheduled'))) },
    { key: 'counts', label: t('Kết quả', 'Result'), render: (r) => runLine(r) },
    { key: 'errors', label: t('Lỗi', 'Errors'), render: (r) => (r.errors?.length ? h('small', { className: 'op-cell-muted' }, r.errors.slice(0, 2).join(' · ')) : '—') },
  ];
  const rawCols = [
    { key: 'status', label: t('Kết quả', 'Result'), width: 110, render: (r) => h(Pill, { tone: RAW_STATUS[r.status]?.[0] ?? 'neutral' }, RAW_STATUS[r.status]?.[1]() ?? r.status) },
    { key: 'what', label: t('Bản ghi', 'Record'), render: (r) => h('div', { style: { minWidth: 0 } },
      r.event ? h('a', { className: 'op-cell-title', href: href('events', r.event.id), onClick: (e) => { e.preventDefault(); navigate(href('events', r.event.id)); } }, r.event.title) : h('div', { className: 'op-cell-title' }, r.externalId.replace(/^https?:\/\//, '').slice(0, 80)),
      h('div', { className: 'op-cell-sub' }, [r.error, r.matchReason ? `${r.matchScore} · ${r.matchReason}` : null].filter(Boolean).join(' · ') || ago(r.fetchedAt))) },
    { key: 'raw', label: '', width: 60, align: 'right', render: (r) => h(Button, { size: 'sm', variant: 'quiet', icon: 'code', title: t('Xem bản ghi gốc', 'Raw record'), onClick: () => setRawId(r.id) }) },
  ];
  return h(Drawer, {
    open: true, onClose, width: 820, title: source.name, sub: [ADAPTER[source.adapter]?.(), source.cityLabel ? tx(source.cityLabel) : null, source.url].filter(Boolean).join(' · '),
    footer: h(Fragment, null,
      h(Button, { icon: 'arrows-clockwise', busy: busy === 'reprocess', onClick: () => act('reprocess') }, t('Xử lý lại', 'Reprocess')),
      h('span', { className: 'op-spacer' }),
      h(Button, { variant: 'cta', icon: 'play', busy: busy === 'run', onClick: () => act('run') }, t('Chạy ngay', 'Run now'))),
  },
  source.lastError ? h('div', { className: 'op-banner op-banner--danger', style: { marginBottom: 12 } }, Icon('warning', true), h('div', null, source.lastError)) : null,
  h(Tabs, { value: tab, onChange: setTab, items: [
    { value: 'runs', icon: 'clock-counter-clockwise', label: t('Các lần chạy', 'Runs'), count: runs.data?.items.length },
    { value: 'raw', icon: 'files', label: t('Bản ghi', 'Records') },
  ] }),
  tab === 'runs'
    ? (runs.loading && !runs.data ? h(Spinner) : h(DataTable, { columns: runCols, rows: runs.data?.items ?? [], minWidth: 600, empty: h(Empty, { icon: 'clock', title: t('Chưa chạy lần nào', 'No runs yet') }) }))
    : h(Fragment, null,
      h('div', { style: { margin: '8px 0 12px' } }, h(Segmented, { size: 'sm', value: status, onChange: setStatus, options: [{ value: '', label: t('Tất cả', 'All') }, ...['created', 'merged', 'rejected', 'failed'].map((k) => ({ value: k, label: RAW_STATUS[k][1]() }))] })),
      raw.loading && !raw.data ? h(Spinner) : h(DataTable, { columns: rawCols, rows: raw.data?.items ?? [], minWidth: 600, empty: h(Empty, { icon: 'files', title: t('Không có bản ghi', 'No records') }) })),
  h(RawModal, { id: rawId, onClose: () => setRawId(null) }));
}

export function Sources() {
  const { data, error, loading, reload } = useFetch('/admin/sources');
  const [form, setForm] = useState(null);
  const [adding, setAdding] = useState(false);
  const addStarter = async () => {
    setAdding(true);
    try { const out = await post('/admin/sources/starter'); toast(tx(out.message)); reload(true); } catch (e) { toast(errorText(e), 'error'); } finally { setAdding(false); }
  };
  const [openId, setOpenId] = useState(null);
  const items = data?.items ?? [];
  const open = items.find((s) => s.id === openId) ?? null;
  const columns = [
    { key: 'name', label: t('Nguồn', 'Source'), render: (s) => h('div', { style: { minWidth: 0 } },
      h('div', { className: 'op-cell-title' }, s.name, s.enabled ? null : h(Pill, { tone: 'neutral', className: 'op-ml' }, t('Tắt', 'Off'))),
      h('div', { className: 'op-cell-sub' }, [ADAPTER[s.adapter]?.(), s.url ? s.url.replace(/^https?:\/\//, '').slice(0, 60) : null].filter(Boolean).join(' · '))) },
    { key: 'city', label: t('Thành phố', 'City'), width: 130, render: (s) => (s.cityLabel ? tx(s.cityLabel) : '—') },
    { key: 'authority', label: t('Mức tin cậy', 'Authority'), width: 130, render: (s) => AUTHORITY[s.authority]?.() ?? s.authority },
    { key: 'events', label: t('Sự kiện', 'Events'), width: 90, align: 'right', render: (s) => h('span', { className: 'op-cell-num' }, num(s.events)) },
    { key: 'last', label: t('Lần chạy gần nhất', 'Last run'), width: 210, render: (s) => h('div', null, runLine(s.lastRun),
      s.lastError ? h(Pill, { tone: 'danger', icon: 'warning', title: s.lastError }, t('Lỗi', 'Error')) : null) },
    { key: 'next', label: t('Lần tới', 'Next'), width: 120, render: (s) => (s.enabled ? h('small', { className: 'op-cell-muted' }, stamp(s.nextRunAt)) : '—') },
    { key: 'act', label: '', width: 60, align: 'right', render: (s) => h(Button, { size: 'sm', variant: 'quiet', icon: 'pencil-simple', title: t('Sửa', 'Edit'), onClick: () => setForm({ source: s }) }) },
  ];
  return h(Fragment, null,
    h(PageHeader, {
      title: t('Nguồn dữ liệu', 'Sources'),
      actions: h(Fragment, null,
        h(Button, { icon: 'sparkle', busy: adding, onClick: addStarter }, t('Thêm nguồn gợi ý', 'Add suggested sources')),
        h(Button, { variant: 'cta', icon: 'plus', onClick: () => setForm({}) }, t('Thêm nguồn', 'Add source'))),
    }),
    error ? h(ErrorBox, { error, onRetry: reload }) : null,
    !data ? (loading ? h(Spinner) : null) : h(Fragment, null,
      data?.cancelledBySource.length ? h(Card, { title: t('Nguồn báo đã huỷ', 'Cancelled at the source'), icon: 'warning', className: 'op-mb' },
        h('ul', { className: 'op-feed' }, data.cancelledBySource.map((c) => h('li', { key: c.id },
          h('span', { className: 'op-feed-dot is-bad' }),
          h('div', null, h('a', { className: 'op-feed-line', href: href('events', c.id), onClick: (e) => { e.preventDefault(); navigate(href('events', c.id) + '?tab=sources'); } }, h('strong', null, c.title)),
            h('div', { className: 'op-feed-time' }, [c.startsOn, c.host].filter(Boolean).join(' · '))))))) : null,
      h(DataTable, { columns, rows: items, onRowClick: (s) => setOpenId(s.id), minWidth: 980,
        empty: h(Empty, { icon: 'broadcast', title: t('Chưa có nguồn nào', 'No sources yet'), action: h(Button, { variant: 'cta', icon: 'sparkle', busy: adding, onClick: addStarter }, t('Thêm nguồn gợi ý', 'Add suggested sources')) }) })),
    form ? h(SourceForm, { key: form.source?.id ?? 'new', source: form.source, onClose: () => setForm(null), onSaved: () => { setForm(null); reload(true); } }) : null,
    open ? h(SourceDetail, { key: open.id, source: open, onClose: () => setOpenId(null), onChanged: () => reload(true) }) : null);
}

// ---- where one event came from, on its page in the catalogue -------------------------------------

const PROVIDER_ICON = { organizer: 'buildings', community: 'users-three', team: 'seal-check', website: 'globe', ics: 'calendar-dots', ticketmaster: 'ticket', resident_advisor: 'link', facebook: 'facebook-logo', instagram: 'instagram-logo', link: 'link' };

export function Provenance({ eventId }) {
  const { data, error, loading, reload } = useFetch(`/admin/events/${eventId}/provenance`, [eventId]);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [rawId, setRawId] = useState(null);
  if (loading && !data) return h(Spinner);
  if (error) return h(ErrorBox, { error, onRetry: reload });
  const add = async () => {
    setBusy(true);
    try { await post(`/admin/events/${eventId}/sources`, { url: url.trim() }); setUrl(''); toast(t('Đã thêm nguồn', 'Source added')); reload(true); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  const detach = async (s) => {
    try { await del(`/admin/events/${eventId}/sources/${s.id}`); toast(t('Đã gỡ nguồn', 'Source detached')); reload(true); } catch (e) { toast(errorText(e), 'error'); }
  };
  const c = data.confidence;
  return h('div', { className: 'op-grid op-grid--2' },
    h(Card, { title: t('Nguồn', 'Sources'), icon: 'link' },
      h('ul', { className: 'op-feed' }, data.sources.map((s) => h('li', { key: s.id },
        h('span', { className: `op-feed-dot is-${s.conflicts.length || s.cancelled ? 'bad' : 'ok'}` }),
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('div', { className: 'op-feed-line' }, Icon(PROVIDER_ICON[s.provider] ?? 'link'), ' ', h('strong', null, tx(s.providerLabel)),
            s.host ? h(Fragment, null, ' · ', s.url ? h('a', { className: 'op-ext', href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.host, Icon('arrow-square-out')) : s.host) : null,
            s.matchReason ? h(Pill, { tone: 'info', className: 'op-ml', title: t('Điểm khớp', 'Match score') }, `${s.matchScore} · ${s.matchReason}`) : null,
            s.cancelled ? h(Pill, { tone: 'danger', className: 'op-ml' }, t('Báo huỷ', 'Says cancelled')) : null),
          s.conflicts.map((x, i) => h('div', { key: i, className: 'op-feed-msg' }, `${x.field}: ${x.source} ≠ ${x.event}`)),
          h('div', { className: 'op-feed-time' }, t(`Thấy lần đầu ${stamp(s.firstSeenAt, true)} · gần nhất ${ago(s.lastSeenAt)}`, `First seen ${stamp(s.firstSeenAt, true)} · last ${ago(s.lastSeenAt)}`), s.ingestSource ? ` · ${s.ingestSource.name}` : '')),
        h('div', { className: 'op-nowrap' },
          s.rawEventId ? h(Button, { size: 'sm', variant: 'quiet', icon: 'code', title: t('Bản ghi gốc', 'Raw record'), onClick: () => setRawId(s.rawEventId) }) : null,
          ['organizer', 'community', 'team'].includes(s.provider) ? null : h(Button, { size: 'sm', variant: 'quiet', icon: 'link-break', title: t('Gỡ nguồn này', 'Detach'), onClick: () => detach(s) }))))),
      h('div', { className: 'op-inline-form', style: { marginTop: 12 } },
        h(Input, { value: url, onChange: setUrl, icon: 'link', placeholder: t('Dán link nơi thấy sự kiện (RA, Facebook…)', 'Paste a link where the event appears (RA, Facebook…)') }),
        h(Button, { icon: 'plus', busy, disabled: !/^https?:\/\/\S+\.\S+/.test(url.trim()), onClick: add }, t('Thêm', 'Add')))),
    h(Card, { title: t('Độ tin cậy', 'Confidence'), icon: 'seal-check' },
      c ? h(Fragment, null,
        h('div', { className: 'op-conf-head' }, h('strong', { className: 'op-conf-score' }, c.score), h(Pill, { tone: c.score >= 70 ? 'ok' : c.score >= 40 ? 'info' : 'warn' }, tx(c.labelText))),
        h('ul', { className: 'op-conf-lines' }, c.breakdown.map((l) => h('li', { key: l.rule, className: l.points < 0 ? 'is-bad' : '' }, h('span', null, tx(l.label)), h('span', { className: 'op-cell-num' }, (l.points > 0 ? '+' : '') + l.points)))),
        h('div', { className: 'op-feed-time' }, [data.event.lastVerifiedAt ? t(`Xác minh ${ago(data.event.lastVerifiedAt)}`, `Verified ${ago(data.event.lastVerifiedAt)}`) : null, t(`${data.event.sourceCount} nguồn độc lập`, `${data.event.sourceCount} independent sources`)].filter(Boolean).join(' · ')))
        : h('p', { className: 'op-hint' }, '—')),
    h(RawModal, { id: rawId, onClose: () => setRawId(null) }));
}
