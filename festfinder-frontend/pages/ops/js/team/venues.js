/*
 * Team mode: the venue registry every event form picks from, and the listings whose venue
 * was typed by hand and has no map pin yet. Pins come from a pasted Google Maps link or
 * coordinates, checked on a small map before saving.
 */
import { h, Fragment, useState, useEffect, useMemo, useRef, useLayoutEffect, t, tx, cx, fold, get, post, patch, href, navigate, useFetch, useQueryState, useRoute, setQuery, toast, errorText, emit, day, num } from '../core.js';
import { PageHeader, Button, Icon, Pill, Spinner, ErrorBox, Empty, FilterBar, FilterSelect, DataTable, Drawer, Field, Input, Combobox, Switch, Tabs, StatusPill, Card, Stat } from '../ui.js';
import { areaOptions } from '../opts.js';

/** Coordinates from a Google Maps / Apple Maps / OSM link, or from "10.77, 106.70". */
export function parseCoords(text) {
  const s = String(text || '').trim();
  const pats = [/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/, /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/, /[?&](?:q|ll|query|center)=(-?\d{1,3}\.\d+)(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i, /#map=\d+\/(-?\d{1,3}\.\d+)\/(-?\d{1,3}\.\d+)/, /^(-?\d{1,3}\.\d+)\s*[, ]\s*(-?\d{1,3}\.\d+)$/];
  for (const p of pats) {
    const m = p.exec(s);
    if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
  }
  return null;
}
const inVietnam = (lat, lng) => lat >= 8 && lat <= 24 && lng >= 102 && lng <= 110;

/** OpenStreetMap tiles around the pin, to check it lands on the right building before saving. */
export function MiniMap({ lat, lng, zoom = 16 }) {
  const box = useRef(null);
  const [w, setW] = useState(520);
  useLayoutEffect(() => {
    if (!box.current) return;
    const measure = () => setW(box.current?.clientWidth || 520);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  const hgt = Math.round(Math.min(w, 600) * 0.6);
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng) || !inVietnam(lat, lng)) {
    return h('div', { ref: box, className: 'op-minimap is-empty', style: { height: hgt } }, Icon('map-pin'), t('Chưa có toạ độ', 'No coordinates yet'));
  }
  const n = 2 ** zoom;
  const x = ((lng + 180) / 360) * n;
  const y = ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n;
  // Enough tiles either side that the box is always covered: 5 across, 3 down.
  const tx0 = Math.floor(x) - 2, ty0 = Math.floor(y) - 1;
  const left = (x - tx0) * 256 - w / 2, top = (y - ty0) * 256 - hgt / 2;
  const tiles = [];
  for (let dx = 0; dx < 5; dx++) for (let dy = 0; dy < 3; dy++) {
    tiles.push(h('img', { key: `${dx}-${dy}`, alt: '', loading: 'lazy', src: `https://tile.openstreetmap.org/${zoom}/${tx0 + dx}/${ty0 + dy}.png`, style: { left: dx * 256 - left, top: dy * 256 - top }, onError: (e) => { e.currentTarget.style.visibility = 'hidden'; } }));
  }
  return h('div', { ref: box, className: 'op-minimap', style: { height: hgt } }, tiles, h('span', { className: 'op-minimap-pin' }, Icon('map-pin', true)), h('span', { className: 'op-minimap-credit' }, '© OpenStreetMap'));
}

function VenueDrawer({ venue, preset, onClose, onSaved }) {
  const editing = !!venue?.id;
  const [f, setF] = useState(() => ({
    name: venue?.name ?? preset?.name ?? '', address: venue?.address ?? preset?.address ?? '', area: venue?.area ?? preset?.area ?? '',
    lat: venue?.lat ?? '', lng: venue?.lng ?? '', verified: venue?.verified ?? true, permitOnFile: venue?.permitOnFile ?? false,
  }));
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const lat = f.lat === '' ? null : Number(f.lat), lng = f.lng === '' ? null : Number(f.lng);
  const coordsOk = lat !== null && lng !== null && inVietnam(lat, lng);
  const ok = f.name.trim().length >= 2 && f.address.trim().length >= 3 && f.area && coordsOk;
  const takePaste = (v) => {
    setPaste(v);
    const c = parseCoords(v);
    if (c) setF((x) => ({ ...x, lat: c.lat.toFixed(6), lng: c.lng.toFixed(6) }));
  };
  const save = async () => {
    setBusy(true);
    try {
      const body = { name: f.name.trim(), address: f.address.trim(), area: f.area, lat, lng, verified: f.verified, permitOnFile: f.permitOnFile };
      const out = editing ? await patch(`/admin/venues/${venue.id}`, body) : await post('/admin/venues', body);
      toast(tx(out.message));
      onSaved(out);
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  const mapsQuery = encodeURIComponent(`${f.name} ${f.address}`.trim());
  return h(Drawer, {
    open: true, onClose, width: 600, title: editing ? venue.name : t('Thêm địa điểm', 'Add a venue'),
    sub: preset?.eventTitle ? t(`Sẽ gán cho tin "${preset.eventTitle}" sau khi lưu`, `Will be linked to "${preset.eventTitle}" once saved`) : t('Địa điểm đã xác minh hiện trong ô chọn của mọi form sự kiện.', 'Verified venues appear in every event form’s picker.'),
    footer: h(Fragment, null, h(Button, { onClick: onClose }, t('Huỷ', 'Cancel')), h('span', { className: 'op-spacer' }), h(Button, { variant: 'cta', icon: 'check', busy, disabled: !ok, onClick: save }, editing ? t('Lưu địa điểm', 'Save venue') : t('Thêm địa điểm', 'Add venue'))),
  },
  h('div', { className: 'op-form-grid' },
    h(Field, { label: t('Tên địa điểm', 'Venue name'), required: true, className: 'is-wide' }, h(Input, { value: f.name, onChange: set('name'), placeholder: t('vd: Nhà thi đấu Phú Thọ', 'e.g. Phú Thọ Arena'), autoFocus: !editing })),
    h(Field, { label: t('Địa chỉ', 'Address'), required: true, className: 'is-wide' }, h(Input, { value: f.address, onChange: set('address'), placeholder: t('Số nhà, đường, phường', 'Number, street, ward') })),
    h(Field, { label: t('Khu vực', 'District'), required: true }, h(Combobox, { value: f.area, options: areaOptions(), icon: 'map-trifold', placeholder: t('Chọn quận / khu vực', 'Pick a district'), onChange: (v) => set('area')(v ?? ''), onCreate: (v) => set('area')(v) })),
    h(Field, { label: t('Dán link bản đồ hoặc toạ độ', 'Paste a map link or coordinates'), hint: paste && !parseCoords(paste) ? t('Chưa đọc được toạ độ từ nội dung này.', 'No coordinates found in that.') : t('Google Maps, Apple Maps, OpenStreetMap hoặc "10.7714, 106.657".', 'Google Maps, Apple Maps, OpenStreetMap or "10.7714, 106.657".') },
      h(Input, { value: paste, onChange: takePaste, icon: 'link', placeholder: 'https://maps.google.com/…@10.77,106.70' })),
    h(Field, { label: t('Vĩ độ', 'Latitude'), required: true }, h(Input, { value: f.lat, onChange: set('lat'), inputMode: 'decimal', placeholder: '10.7714', invalid: f.lat !== '' && !coordsOk })),
    h(Field, { label: t('Kinh độ', 'Longitude'), required: true }, h(Input, { value: f.lng, onChange: set('lng'), inputMode: 'decimal', placeholder: '106.6570', invalid: f.lng !== '' && !coordsOk })),
    h('div', { className: 'is-wide' },
      h(MiniMap, { lat, lng }),
      h('div', { className: 'op-map-links' },
        h('a', { className: 'op-link', href: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`, target: '_blank', rel: 'noopener noreferrer' }, Icon('magnifying-glass'), t('Tìm trên Google Maps', 'Find on Google Maps')),
        coordsOk ? h('a', { className: 'op-link', href: `https://www.google.com/maps?q=${lat},${lng}`, target: '_blank', rel: 'noopener noreferrer' }, Icon('arrow-square-out'), t('Mở ghim này', 'Open this pin')) : null)),
    h(Field, { label: t('Xác minh', 'Verification') }, h(Switch, { checked: f.verified, onChange: set('verified'), label: t('Địa điểm đã xác minh', 'Verified venue'), hint: t('Hiện trong ô chọn của nhà tổ chức', 'Shown in organizers’ picker') })),
    h(Field, { label: t('Giấy phép', 'Permit') }, h(Switch, { checked: f.permitOnFile, onChange: set('permitOnFile'), label: t('Đã có giấy phép địa điểm', 'Venue permit on file'), hint: t('Cần cho sự kiện đông người', 'Needed for large crowds') }))));
}

function Unresolved({ items, onLink, onCreate }) {
  if (!items.length) return h(Empty, { icon: 'map-pin', title: t('Mọi tin đều đã có ghim bản đồ', 'Every listing has a map pin'), body: t('Tin có địa điểm gõ tay sẽ hiện ở đây để gán hoặc tạo địa điểm.', 'Listings with a hand-typed venue show up here to link or create one.') });
  return h('div', { className: 'op-unresolved' }, items.map((e) => h(Card, { key: e.id, className: 'op-unres-card' },
    h('div', { className: 'op-unres-head' },
      h('div', { style: { flex: 1, minWidth: 0 } },
        h('a', { className: 'op-cell-title', href: href('events', e.id), onClick: (ev) => { ev.preventDefault(); navigate(href('events', e.id)); } }, e.title),
        h('div', { className: 'op-cell-sub' }, [e.organizer, e.startsOn ? day(e.startsOn) : null].filter(Boolean).join(' · '))),
      h(StatusPill, { status: e.status })),
    h('div', { className: 'op-unres-typed' }, Icon('map-pin', true), h('div', null, h('strong', null, e.venueName), h('small', null, [e.address, e.area].filter(Boolean).join(' · ') || t('Không có địa chỉ', 'No address')))),
    e.suggestions.length ? h('div', { className: 'op-quick' }, h('span', { className: 'op-quick-label' }, t('Có thể là:', 'Could be:')), e.suggestions.map((s) => h('button', { key: s.id, type: 'button', className: 'op-chip is-suggest', onClick: () => onLink(e, s.id, s.name) }, Icon('link'), ` ${s.name} · ${s.area}`))) : null,
    h('div', { className: 'op-unres-actions' },
      h('div', { style: { flex: 1, minWidth: 220 } }, h(Combobox, { value: null, load: async (q) => (await get('/admin/venues' + (q ? `?q=${encodeURIComponent(q)}` : ''))).items.map((v) => ({ value: v.id, label: v.name, sub: `${v.address} · ${v.area}` })), placeholder: t('Gán địa điểm có sẵn…', 'Link a saved venue…'), icon: 'map-pin', onChange: (vid, o) => vid && onLink(e, vid, o.label) })),
      h(Button, { icon: 'plus', onClick: () => onCreate(e) }, t('Tạo địa điểm từ tin này', 'Create from this listing'))))));
}

export function Venues() {
  const route = useRoute();
  const [tab, setTab] = useQueryState('tab', 'all');
  const [q, setQ] = useQueryState('q', '');
  const [area, setArea] = useQueryState('area', '');
  const [flags, setFlags] = useQueryState('flags', '');
  const { data, error, loading, reload } = useFetch('/admin/venues');
  const [drawer, setDrawer] = useState(null);
  // Arriving from the review queue with a hand-typed venue: open "Add venue" prefilled.
  useEffect(() => {
    const qn = route.query.get('new');
    if (qn !== null) {
      setDrawer({ preset: { name: qn, address: route.query.get('address') ?? '', area: route.query.get('area') ?? '', eventId: route.query.get('event'), eventTitle: null } });
      setQuery({ new: '', address: '', area: '', event: '' });
    }
  }, []);
  const items = data?.items ?? [];
  const fl = flags ? flags.split(',') : [];
  const rows = useMemo(() => items
    .filter((v) => !q || fold(`${v.name} ${v.address} ${v.area}`).includes(fold(q)))
    .filter((v) => !area || v.area === area)
    .filter((v) => fl.every((k) => (k === 'unverified' ? !v.verified : k === 'nopermit' ? !v.permitOnFile : k === 'permit' ? v.permitOnFile : k === 'upcoming' ? v.upcoming > 0 : true))), [items, q, area, flags]);
  const link = async (ev, venueId, label) => {
    try { await patch(`/admin/events/${ev.id}`, { venueId }); toast(t(`Đã gán ${label} cho ${ev.title}`, `Linked ${label} to ${ev.title}`)); emit('counts'); reload(true); } catch (e) { toast(errorText(e), 'error'); }
  };
  const saved = async (out) => {
    const p = drawer?.preset;
    setDrawer(null);
    if (p?.eventId && out?.id) await link({ id: p.eventId, title: p.eventTitle ?? t('tin', 'the listing') }, out.id, out.name);
    reload(true);
  };
  const columns = [
    { key: 'name', label: t('Địa điểm', 'Venue'), render: (v) => h('div', null, h('div', { className: 'op-cell-title' }, v.name), h('div', { className: 'op-cell-sub' }, v.address)) },
    { key: 'area', label: t('Khu vực', 'District'), width: 130, render: (v) => v.area },
    { key: 'state', label: t('Trạng thái', 'Status'), width: 220, render: (v) => h('div', { className: 'op-flags' }, v.verified ? h(Pill, { tone: 'ok', icon: 'seal-check' }, t('Đã xác minh', 'Verified')) : h(Pill, { tone: 'warn' }, t('Chưa xác minh', 'Unverified')), v.permitOnFile ? h(Pill, { tone: 'info', icon: 'certificate' }, t('Có giấy phép', 'Permit')) : null) },
    { key: 'events', label: t('Sắp tới · tổng', 'Upcoming · total'), width: 140, align: 'right', render: (v) => h('span', { className: 'op-cell-num' }, h('strong', null, v.upcoming), ` · ${v.events}`) },
    { key: 'pin', label: t('Ghim', 'Pin'), width: 190, render: (v) => h('a', { className: 'op-ext op-mono', href: `https://www.google.com/maps?q=${v.lat},${v.lng}`, target: '_blank', rel: 'noopener noreferrer' }, `${Number(v.lat).toFixed(4)}, ${Number(v.lng).toFixed(4)}`, Icon('arrow-square-out')) },
    { key: 'act', label: '', width: 60, align: 'right', render: (v) => h(Button, { size: 'sm', variant: 'quiet', icon: 'pencil-simple', title: t('Sửa', 'Edit'), onClick: () => setDrawer({ venue: v }) }) },
  ];
  const areasInUse = [...new Set(items.map((v) => v.area))].sort();
  return h(Fragment, null,
    h(PageHeader, {
      eyebrow: t('Đối tác · danh mục địa điểm', 'Partners · venue registry'), title: t('Địa điểm', 'Venues'),
      sub: t('Một nguồn địa điểm chuẩn cho mọi form: tên, địa chỉ, quận và ghim bản đồ thống nhất.', 'One source of venues for every form: consistent names, addresses, districts and map pins.'),
      actions: h(Button, { variant: 'cta', icon: 'plus', onClick: () => setDrawer({}) }, t('Thêm địa điểm', 'Add venue')),
    }),
    h(Tabs, { value: tab, onChange: setTab, items: [
      { value: 'all', icon: 'map-pin', label: t('Danh mục', 'Registry'), count: items.length },
      { value: 'unresolved', icon: 'map-pin-line', label: t('Tin chưa có ghim', 'Listings without a pin'), count: data?.unresolved.length, alert: true },
    ] }),
    error ? h(ErrorBox, { error, onRetry: reload }) : null,
    loading && !data ? h(Spinner) : tab === 'unresolved'
      ? h(Unresolved, { items: data.unresolved, onLink: link, onCreate: (e) => setDrawer({ preset: { name: e.venueName, address: e.address ?? '', area: e.area ?? '', eventId: e.id, eventTitle: e.title } }) })
      : h(Fragment, null,
        h(FilterBar, { search: q, onSearch: setQ, placeholder: t('Tên, đường, quận…', 'Name, street, district…'), active: [area, flags].filter(Boolean).length, onReset: () => setQuery({ area: '', flags: '' }) },
          h(FilterSelect, { label: t('Khu vực', 'District'), icon: 'map-trifold', value: area, onChange: setArea, allLabel: t('Mọi khu vực', 'Every district'), options: areasInUse.map((a) => ({ value: a, label: a, count: items.filter((v) => v.area === a).length })) }),
          h(FilterSelect, { label: t('Lọc thêm', 'More'), icon: 'sliders-horizontal', multi: true, value: fl, onChange: (v) => setFlags(v.join(',')), options: [
            { value: 'upcoming', label: t('Có sự kiện sắp tới', 'Has upcoming events') }, { value: 'unverified', label: t('Chưa xác minh', 'Unverified') }, { value: 'permit', label: t('Có giấy phép', 'Permit on file') }, { value: 'nopermit', label: t('Chưa có giấy phép', 'No permit') }] })),
        h(DataTable, { columns, rows, onRowClick: (v) => setDrawer({ venue: v }), minWidth: 900 })),
    drawer ? h(VenueDrawer, { key: drawer.venue?.id ?? 'new', venue: drawer.venue, preset: drawer.preset, onClose: () => setDrawer(null), onSaved: saved }) : null);
}
