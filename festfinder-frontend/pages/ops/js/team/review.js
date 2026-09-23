/*
 * Team mode: the review queue. Pick a listing on the left, read everything about it on the
 * right, fix small things in place (genre, venue pin), then approve or send it back with a
 * reason. Several at once with the checkboxes; J/K, A and R from the keyboard.
 */
import {
  h, Fragment, useState, useEffect, useMemo, useRef, t, tx, cx, fold, get, post, patch, href, navigate, useFetch, useQueryState, setQuery,
  toast, errorText, emit, duration, day, dayRange, money, num, stamp, ago, options,
} from '../core.js';
import {
  PageHeader, Button, Icon, Pill, Thumb, Avatar, Spinner, ErrorBox, Empty, FilterSelect, Checkbox, KV, Tabs, Modal, Field, Select, TextArea, Switch,
  Combobox, External, useKeys, confirm, QualityRing, StatusPill, Img,
} from '../ui.js';
import { genreOptions, areaOptions, rejectOptions, loadVenues, genreLabel, entryLabel } from '../opts.js';

const SLA_TONE = { ok: 'info', soon: 'warn', breach: 'danger' };
const RISK_TONE = { low: 'ok', medium: 'warn', high: 'danger' };
const RISK_LABEL = { low: ['Rủi ro thấp', 'Low risk'], medium: ['Rủi ro vừa', 'Medium risk'], high: ['Rủi ro cao', 'High risk'] };
const LINK_STATUS = { ok: ['ok', 'Link hoạt động', 'Link works'], broken: ['danger', 'Link lỗi', 'Broken link'], unchecked: ['neutral', 'Chưa kiểm tra', 'Not checked'] };

// ---- send back ----------------------------------------------------------------------------------

export function RejectDialog({ open, onClose, ids, titles, onDone }) {
  const reasons = useFetch(open ? '/admin/reject-reasons' : null, [open]);
  const [code, setCode] = useState('');
  const [lang, setLang] = useState('vi');
  const [message, setMessage] = useState('');
  const [appeal, setAppeal] = useState(true);
  const [busy, setBusy] = useState(false);
  const reason = reasons.data?.items.find((r) => r.code === code);
  useEffect(() => { if (open) { setCode(''); setMessage(''); setAppeal(true); } }, [open]);
  useEffect(() => { if (reason) { setMessage(reason.template[lang]); setAppeal(reason.appealAllowed); } }, [code, lang]);
  const send = async () => {
    setBusy(true);
    try {
      const out = await post('/admin/listings/reject', { ids, code, message: message.trim(), allowAppeal: appeal && !!reason?.appealAllowed });
      toast(tx(out.message));
      onDone(out.rejected);
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  return h(Modal, {
    open, onClose, width: 580, title: ids.length > 1 ? t(`Trả lại ${ids.length} tin`, `Send back ${ids.length} listings`) : t('Trả lại tin cho nhà tổ chức', 'Send the listing back'),
    footer: h(Fragment, null, h(Button, { onClick: onClose }, t('Huỷ', 'Cancel')), h(Button, { variant: 'danger', icon: 'arrow-u-up-left', busy, disabled: !code || !message.trim(), onClick: send }, t('Trả lại', 'Send back'))),
  },
  h('div', { className: 'op-confirm-body' }, ids.length > 1 ? titles.join(' · ') : titles[0]),
  h(Field, { label: t('Lý do', 'Reason'), required: true, hint: reason ? (reason.appealAllowed ? t('Nhà tổ chức có thể phản hồi một lần trong 7 ngày.', 'The organizer may reply once within 7 days.') : t('Mã này không cho phép kháng nghị.', 'This reason does not allow an appeal.')) : t('Mỗi lý do có sẵn một mẫu tin nhắn, bạn có thể sửa.', 'Each reason comes with a message template you can edit.') },
    h(Select, { value: code, onChange: setCode, placeholder: t('— Chọn lý do —', '— Pick a reason —'), options: (reasons.data?.items ?? []).map((r) => ({ value: r.code, label: `${tx(r.label)}${r.appealAllowed ? '' : t(' · không kháng nghị', ' · no appeal')}` })) })),
  h(Field, { label: t('Tin nhắn gửi nhà tổ chức', 'Message to the organizer'), required: true, counter: [message.length, 2000], aside: h('div', { className: 'op-seg op-seg--sm' }, ['vi', 'en'].map((l) => h('button', { key: l, type: 'button', className: cx('op-seg-item', lang === l && 'is-on'), onClick: () => setLang(l) }, l === 'vi' ? t('Mẫu tiếng Việt', 'Vietnamese template') : t('Mẫu tiếng Anh', 'English template')))) },
    h(TextArea, { rows: 6, value: message, onChange: setMessage, maxLength: 2000, placeholder: t('Chọn lý do để điền mẫu…', 'Pick a reason to fill in a template…') })),
  h(Switch, { checked: appeal && !!reason?.appealAllowed, disabled: !reason?.appealAllowed, onChange: setAppeal, label: t('Cho phép kháng nghị trong 7 ngày', 'Allow an appeal within 7 days'), hint: t('Tin nhắn vào Hộp thư kiểm duyệt của nhà tổ chức và họ nhận thông báo.', 'The message lands in the organizer’s moderation inbox and they are notified.') }));
}

// ---- one listing, in full --------------------------------------------------------------------------

function Thread({ id, onSent }) {
  const { data, reload, setData } = useFetch(`/admin/listings/${id}/thread`, [id]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try { const m = await post(`/admin/listings/${id}/thread`, { body: text.trim() }); setData((d) => ({ ...d, messages: [...(d?.messages ?? []), m] })); setText(''); toast(t('Đã gửi cho nhà tổ chức', 'Sent to the organizer')); onSent?.(); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  if (!data) return h(Spinner);
  return h('div', { className: 'op-rv-thread' },
    data.messages.length ? h('div', { className: 'op-thread-msgs op-thread-msgs--inline' }, data.messages.map((m) => h('div', { key: m.id, className: cx('op-msg', m.fromAdmin ? 'is-me' : 'is-ff') },
      h('div', { className: 'op-msg-bubble' }, tx(m.body)), h('div', { className: 'op-msg-meta' }, m.fromAdmin ? 'FeestFinder' : t('Nhà tổ chức', 'Organizer'), ' · ', stamp(m.createdAt))))) : h('div', { className: 'op-hint' }, t('Chưa có trao đổi nào về tin này.', 'No messages about this listing yet.')),
    h('div', { className: 'op-quick' }, h('span', { className: 'op-quick-label' }, t('Hỏi nhanh:', 'Quick ask:')), data.quickAsks.map((q) => h('button', { key: q.key, type: 'button', className: 'op-chip', onClick: () => setText(tx(q.text)) }, tx(q.label)))),
    h(TextArea, { rows: 3, value: text, onChange: setText, placeholder: t('Nhắn nhà tổ chức mà không trả lại tin…', 'Message the organizer without sending the listing back…'), maxLength: 2000 }),
    h('div', { className: 'op-rv-thread-bar' }, h('span', { className: 'op-hint' }, t('Được ghi vào nhật ký.', 'Recorded in the audit log.')), h(Button, { size: 'sm', icon: 'paper-plane-right', busy, disabled: !text.trim(), onClick: send }, t('Gửi', 'Send'))));
}

function ReviewPanel({ id, onDecided, onReject }) {
  const { data: ev, error, loading, reload, setData } = useFetch(`/admin/events/${id}`, [id]);
  const [desc, setDesc] = useState('vi');
  const [busy, setBusy] = useState(null);
  const [riskBusy, setRiskBusy] = useState(false);
  if (loading && !ev) return h(Spinner);
  if (error) return h(ErrorBox, { error, onRetry: reload });
  const quick = async (body, label) => {
    setBusy('fix');
    try { const out = await patch(`/admin/events/${id}`, body); setData(out); toast(label ?? tx(out.message)); emit('counts'); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(null); }
  };
  const approve = async () => {
    setBusy('approve');
    try { const out = await post('/admin/listings/approve', { ids: [id] }); toast(tx(out.message)); onDecided([id]); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(null); }
  };
  const recheck = async () => {
    setRiskBusy(true);
    try { await get(`/admin/listings/${id}/risk`); await reload(true); } finally { setRiskBusy(false); }
  };
  const v = ev.venue;
  const linkState = LINK_STATUS[ev.ticketLinkStatus];
  const inReview = ev.status === 'in_review';
  return h('div', { className: 'op-rv' },
    h('div', { className: 'op-rv-scroll' },
      h('div', { className: 'op-rv-head' },
        h('div', { className: 'op-rv-pills' },
          h(StatusPill, { status: ev.status }),
          ev.waitingMinutes != null ? h(Pill, { tone: ev.waitingMinutes >= 240 ? 'danger' : ev.waitingMinutes >= 120 ? 'warn' : 'info', icon: 'clock' }, t(`Chờ ${duration(ev.waitingMinutes)}`, `Waiting ${duration(ev.waitingMinutes)}`)) : null,
          h(Pill, { tone: RISK_TONE[ev.risk.band], icon: 'shield-warning' }, t(RISK_LABEL[ev.risk.band][0], RISK_LABEL[ev.risk.band][1]), ` · ${ev.risk.score}`),
          ev.flag ? h(Pill, { tone: 'danger', icon: 'flag' }, tx(ev.flag.label)) : null),
        h('h2', { className: 'op-rv-title' }, ev.title),
        h('div', { className: 'op-rv-org' },
          h(Avatar, { name: ev.organizer.name, src: ev.organizer.logoUrl, size: 24, square: true }),
          h('a', { href: href('organizers', ev.organizer.id), onClick: (e) => { e.preventDefault(); navigate(href('organizers', ev.organizer.id)); } }, ev.organizer.name),
          ev.organizer.verified ? h(Pill, { tone: 'ok', icon: 'seal-check' }, t('Đã xác minh', 'Verified')) : ev.organizer.state === 'flagged' ? h(Pill, { tone: 'danger', icon: 'flag' }, t('NTC bị gắn cờ', 'Flagged organizer')) : h(Pill, { tone: 'warn', icon: 'seal-warning' }, t('Chưa xác minh', 'Unverified')),
          ev.organizer.strikes ? h(Pill, { tone: 'danger' }, t(`${ev.organizer.strikes} cảnh cáo`, `${ev.organizer.strikes} strike${ev.organizer.strikes > 1 ? 's' : ''}`)) : null,
          h('span', { className: 'op-rv-sub' }, t(`gửi ${ago(ev.submittedAt)}`, `submitted ${ago(ev.submittedAt)}`))),
        h('div', { className: 'op-rv-tools' },
          h(Button, { size: 'sm', icon: 'eye', href: ev.publicUrl, target: '_blank' }, t('Xem trang', 'Preview')),
          h(Button, { size: 'sm', icon: 'pencil-simple', onClick: () => navigate(href('events', id)) }, t('Sửa đầy đủ', 'Full edit')))),

      h('div', { className: 'op-rv-media' },
        h(Img, { className: 'op-rv-cover', src: ev.coverUrl, fallback: h('div', { className: 'op-rv-cover is-empty ff-art', style: { background: ev.art } }, Icon(ev.coverUrl ? 'image-broken' : 'image'), ev.coverUrl ? t('Ảnh bìa không tải được', 'The cover does not load') : t('Không có ảnh bìa', 'No cover image')) }),
        h('div', { className: 'op-rv-logo' }, h(Img, { src: ev.logoUrl, fallback: h('span', null, ev.logoUrl ? t('Logo lỗi', 'Logo broken') : t('Không logo', 'No logo')) }))),

      h('section', { className: 'op-rv-sec' },
        h('h3', { className: 'op-section-title' }, Icon('info'), t('Thông tin', 'Details')),
        h(KV, { items: [
          [t('Thời gian', 'When'), ev.startsOn ? `${dayRange(ev.startsOn, ev.endsOn)} · ${ev.startTime ?? '?'}–${ev.endTime ?? '?'}` : h('span', { className: 'op-cell-sub is-danger' }, t('Chưa có ngày', 'No date'))],
          [t('Thể loại', 'Genre'), h(Select, { value: ev.genre ?? '', placeholder: t('— Chọn —', '— Pick —'), options: genreOptions(), disabled: busy === 'fix', onChange: (g) => quick({ genre: g || null }, t('Đã đổi thể loại', 'Genre changed')) })],
          [t('Địa điểm', 'Venue'), h('div', { className: 'op-rv-venue' },
            h('div', null, h('strong', null, v.name ?? '—'), h('small', null, [v.address, v.area].filter(Boolean).join(' · '))),
            v.resolved ? h(Pill, { tone: 'ok', icon: 'map-pin' }, t('Có ghim', 'Pinned')) : h(Pill, { tone: 'danger', icon: 'map-pin' }, t('Chưa có ghim', 'No pin'))), true],
          !v.resolved ? [t('Gán địa điểm có sẵn', 'Link a saved venue'), h('div', { className: 'op-rv-fix' },
            h(Combobox, { value: null, load: loadVenues, placeholder: t('Tìm địa điểm đã xác minh…', 'Search verified venues…'), icon: 'map-pin', onChange: (vid, o) => vid && quick({ venueId: vid }, t(`Đã gán ${o.label}`, `Linked ${o.label}`)) }),
            h(Button, { size: 'sm', icon: 'plus', onClick: () => navigate(href('venues') + `?new=${encodeURIComponent(v.name ?? '')}&address=${encodeURIComponent(v.address ?? '')}&area=${encodeURIComponent(v.area ?? '')}&event=${id}`) }, t('Tạo địa điểm mới', 'Create a venue'))), true] : null,
          [t('Vào cửa', 'Entry'), ev.entryMode === 'paid' ? `${entryLabel('paid')} · ${t('từ', 'from')} ${money(ev.priceFrom)}` : entryLabel(ev.entryMode)],
          [t('Sức chứa · độ tuổi', 'Capacity · age'), `${ev.capacity ? num(ev.capacity) : '—'} · ${ev.age}`],
          [t('Nghệ sĩ', 'Lineup'), ev.lineup.length ? h('div', { className: 'op-flags' }, ev.lineup.map((a) => h(Pill, { key: a }, a))) : '—', true],
        ] })),

      h('section', { className: 'op-rv-sec' },
        h('h3', { className: 'op-section-title' }, Icon('link'), t('Liên kết', 'Links')),
        h('div', { className: 'op-rv-links' },
          h('div', null, h('span', null, t('Link bán vé', 'Ticket link')), ev.ticketUrl ? h(External, { href: ev.ticketUrl }) : '—', linkState ? h(Pill, { tone: linkState[0] }, t(linkState[1], linkState[2])) : null),
          h('div', null, h('span', null, t('Trang sự kiện', 'Event page')), h(External, { href: ev.eventUrl })),
          h('div', null, h('span', null, t('Thương hiệu', 'Brand')), h(External, { href: ev.brandUrl })))),

      h('section', { className: 'op-rv-sec' },
        h('h3', { className: 'op-section-title' }, Icon('text-align-left'), t('Mô tả', 'Description'),
          h('span', { className: 'op-seg op-seg--sm op-ml' }, ['vi', 'en'].map((l) => h('button', { key: l, type: 'button', className: cx('op-seg-item', desc === l && 'is-on'), onClick: () => setDesc(l) }, l.toUpperCase())))),
        h('p', { className: 'op-rv-desc' }, ev.description?.[desc]?.trim() || h('span', { className: 'op-cell-muted' }, t('(trống)', '(empty)')))),

      h('section', { className: 'op-rv-sec op-rv-checks' },
        h('div', null,
          h('h3', { className: 'op-section-title' }, Icon('list-checks'), t('Chất lượng', 'Quality'), h('span', { className: 'op-ml' }, h(QualityRing, { score: ev.quality.score, size: 34 }))),
          h('ul', { className: 'op-checks' }, ev.quality.checks.map((c) => h('li', { key: c.key, className: cx('op-check-row', c.ok && 'is-ok') }, h('span', { className: 'op-check-ic' }, Icon(c.ok ? 'check-circle' : 'x-circle', true)), h('span', { className: 'op-check-text' }, tx(c.label)), h('span', { className: 'op-check-pts' }, `+${c.points}`))))),
        h('div', null,
          h('h3', { className: 'op-section-title' }, Icon('shield-warning'), t('Tín hiệu rủi ro', 'Risk signals'), h('button', { type: 'button', className: 'op-link op-ml', onClick: recheck, disabled: riskBusy }, riskBusy ? t('đang tính…', 'checking…') : t('tính lại', 'recheck'))),
          h('ul', { className: 'op-checks' },
            ev.risk.signals.map((s, i) => h('li', { key: 's' + i, className: cx('op-check-row', s.ok && 'is-ok') }, h('span', { className: 'op-check-ic' }, Icon(s.ok ? 'check-circle' : 'warning', true)), h('span', { className: 'op-check-text' }, tx(s.label)))),
            ev.risk.factors.filter((f) => f.bad).map((f, i) => h('li', { key: 'f' + i, className: 'op-check-row' }, h('span', { className: 'op-check-ic is-bad' }, Icon('warning-diamond', true)), h('span', { className: 'op-check-text' }, tx(f.label)), h('span', { className: 'op-check-pts' }, `+${f.weight}`)))))),

      ev.tiers.length ? h('section', { className: 'op-rv-sec' },
        h('h3', { className: 'op-section-title' }, Icon('ticket'), t('Hạng vé', 'Tiers')),
        h('table', { className: 'op-mini-table' }, h('tbody', null, ev.tiers.map((x) => h('tr', { key: x.key }, h('td', null, tx(x.name)), h('td', { className: 'op-cell-num' }, money(x.price)), h('td', { className: 'op-cell-num op-cell-muted' }, t(`${num(x.sold)}/${num(x.capacity)} vé`, `${num(x.sold)}/${num(x.capacity)}`))))))) : null,

      ev.reports.length ? h('section', { className: 'op-rv-sec' },
        h('h3', { className: 'op-section-title' }, Icon('flag'), t('Báo cáo đang mở', 'Open reports')),
        h('div', { className: 'op-flags' }, ev.reports.map((r) => h(Pill, { key: r.code, tone: 'danger' }, `${tx(r.label)} × ${r.count}`)))) : null,

      h('section', { className: 'op-rv-sec' },
        h('h3', { className: 'op-section-title' }, Icon('chat-circle-text'), t('Trao đổi với nhà tổ chức', 'Messages with the organizer')),
        h(Thread, { id })),

      ev.decisions.length ? h('section', { className: 'op-rv-sec' },
        h('h3', { className: 'op-section-title' }, Icon('clock-counter-clockwise'), t('Lịch sử kiểm duyệt', 'Review history')),
        h('ul', { className: 'op-feed' }, ev.decisions.map((d) => h('li', { key: d.id }, h('span', { className: `op-feed-dot is-${d.decision === 'approved' || d.decision === 'overturned' ? 'ok' : 'bad'}` }),
          h('div', null, h('div', { className: 'op-feed-line' }, h('strong', null, d.by ?? 'FeestFinder'), ' · ', d.decision, d.reason ? ` · ${tx(d.reason)}` : ''), h('div', { className: 'op-feed-time' }, stamp(d.at, true))))))) : null),

    inReview ? h('div', { className: 'op-rv-foot' },
      h(Button, { variant: 'danger', icon: 'arrow-u-up-left', onClick: () => onReject([id], [ev.title]), title: 'R' }, t('Trả lại…', 'Send back…')),
      h('span', { className: 'op-spacer' }),
      h('span', { className: 'op-kbd-hint' }, h('kbd', null, 'J'), h('kbd', null, 'K'), t(' chuyển tin', ' move')),
      h(Button, { variant: 'cta', icon: 'check', busy: busy === 'approve', onClick: approve, title: 'A' }, t('Duyệt & đăng', 'Approve & publish'))) : h('div', { className: 'op-rv-foot' }, h('span', { className: 'op-hint' }, t('Tin này không còn ở hàng chờ.', 'This listing is no longer in the queue.'))));
}

// ---- the queue --------------------------------------------------------------------------------------

export function Review({ rest }) {
  const { data, error, loading, reload, setData } = useFetch('/admin/queue?sort=age');
  const [view, setView] = useQueryState('view', 'all');
  const [sla, setSla] = useQueryState('sla', '');
  const [genre, setGenre] = useQueryState('genre', '');
  const [area, setArea] = useQueryState('area', '');
  const [risk, setRisk] = useQueryState('risk', '');
  const [flag, setFlag] = useQueryState('flag', '');
  const [sort, setSort] = useQueryState('sort', 'age');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState([]);
  const [reject, setReject] = useState(null);
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);
  const current = rest[1] ?? null;
  const items = data?.items ?? [];
  const genres = genre ? genre.split(',') : [];
  const areas = area ? area.split('|') : [];
  const rows = useMemo(() => items
    .filter((i) => view === 'all' || (view === 'breach' ? i.sla.state === 'breach' : view === 'flagged' ? i.flagged : view === 'new' ? i.organizer.newOrganizer : !i.flagged))
    .filter((i) => !sla || i.sla.state === sla)
    .filter((i) => !genres.length || genres.includes(i.genre))
    .filter((i) => !areas.length || areas.includes(i.area))
    .filter((i) => !risk || i.riskBand === risk)
    .filter((i) => !flag || (flag === 'none' ? !i.flag : i.flag?.code === flag))
    .filter((i) => !q || fold(`${i.title} ${i.organizer.name} ${i.venueName ?? ''}`).includes(fold(q)))
    .sort((a, b) => sort === 'risk' ? b.riskScore - a.riskScore : sort === 'new' ? a.waitingMinutes - b.waitingMinutes : sort === 'date' ? String(a.startsOn).localeCompare(String(b.startsOn)) : b.waitingMinutes - a.waitingMinutes),
  [items, view, sla, genre, area, risk, flag, q, sort]);

  // Open the first listing when none is chosen (on a wide screen).
  useEffect(() => {
    if (!current && rows.length && window.innerWidth > 1100) navigate(href('review', rows[0].id) + location.search, { replace: true });
  }, [data, current]);

  const idx = rows.findIndex((r) => r.id === current);
  const open = (id) => navigate(href('review', id) + location.search, { replace: true });
  const move = (d) => { if (!rows.length) return; const next = rows[Math.max(0, Math.min(rows.length - 1, (idx < 0 ? 0 : idx + d)))]; open(next.id); setTimeout(() => listRef.current?.querySelector('.is-on')?.scrollIntoView({ block: 'nearest' }), 30); };

  const decided = (ids) => {
    const nextRow = rows.slice(idx + 1).find((r) => !ids.includes(r.id)) ?? rows.slice(0, idx).reverse().find((r) => !ids.includes(r.id));
    setData((d) => ({ ...d, items: d.items.filter((x) => !ids.includes(x.id)), counts: undefined }));
    setSelected((s) => s.filter((x) => !ids.includes(x)));
    emit('counts');
    if (ids.includes(current)) navigate(nextRow ? href('review', nextRow.id) + location.search : href('review') + location.search, { replace: true });
    reload(true);
  };
  const approveMany = async (ids) => {
    if (ids.length > 1 && !(await confirm({ title: t(`Duyệt ${ids.length} tin?`, `Approve ${ids.length} listings?`), body: t('Tất cả sẽ lên sóng ngay và nhà tổ chức được báo.', 'They all go live now and their organizers are told.'), confirm: t('Duyệt tất cả', 'Approve all') }))) return;
    setBusy(true);
    try { const out = await post('/admin/listings/approve', { ids }); toast(tx(out.message)); decided(out.approved); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  useKeys({
    j: () => move(1), k: () => move(-1), arrowdown: () => move(1), arrowup: () => move(-1),
    a: () => current && approveMany([current]),
    r: () => { const it = rows.find((x) => x.id === current); if (it) setReject({ ids: [it.id], titles: [it.title] }); },
    e: () => current && navigate(href('events', current)),
    x: () => current && setSelected((s) => (s.includes(current) ? s.filter((y) => y !== current) : [...s, current])),
  }, [rows, current]);

  const c = data?.counts ?? {};
  const active = [sla, genre, area, risk, flag].filter(Boolean).length;
  const flagOptions = [...options().rejectReasons.map((r) => ({ value: r.code, label: tx(r.label) })), { value: 'none', label: t('Không gắn cờ', 'Not flagged') }];

  return h(Fragment, null,
    h(PageHeader, {
      eyebrow: t(`Kiểm duyệt · hạn ${data?.slaHours ?? 4} giờ làm việc`, `Moderation · ${data?.slaHours ?? 4} working-hour SLA`),
      title: t('Duyệt tin đăng', 'Review queue'),
      sub: data ? (items.length ? t(`${items.length} tin đang chờ${data.oldestLabel ? ' · ' + tx(data.oldestLabel).toLowerCase() : ''}. Tin bị gắn cờ luôn cần người xem — không có gì tự duyệt.`, `${items.length} waiting${data.oldestLabel ? ' · ' + tx(data.oldestLabel).toLowerCase() : ''}. Flagged listings always need a person — nothing auto-approves.`) : t('Hàng chờ sạch.', 'The queue is clear.')) : null,
      actions: h(Button, { icon: 'arrow-clockwise', onClick: () => reload() }, t('Làm mới', 'Refresh')),
    }),
    h('div', { className: 'op-views' },
      [['all', t('Tất cả', 'All'), c.all], ['breach', t('Quá hạn', 'Past SLA'), c.breach], ['flagged', t('Bị gắn cờ', 'Flagged'), c.flagged], ['new', t('NTC mới', 'New organizer'), c.new], ['clean', t('Không cờ', 'Clean'), c.clean]].map(([k, label, n]) =>
        h('button', { key: k, type: 'button', className: cx('op-view', view === k && 'is-on', k === 'breach' && n && 'is-alert'), onClick: () => setView(k) }, label, h('span', { className: 'op-view-n ff-num' }, n ?? '·')))),
    h('div', { className: 'op-filterbar' },
      h('div', { className: 'op-search' }, Icon('magnifying-glass'), h('input', { value: q, onChange: (e) => setQ(e.target.value), placeholder: t('Tìm tên tin, nhà tổ chức…', 'Search listing, organizer…') })),
      h('div', { className: 'op-filters' },
        h(FilterSelect, { label: 'SLA', icon: 'clock', value: sla, onChange: setSla, allLabel: t('Mọi trạng thái', 'Any'), options: [{ value: 'breach', label: t('Quá hạn', 'Past SLA'), dot: '#F4A3A3' }, { value: 'soon', label: t('Sắp quá hạn', 'Due soon'), dot: '#F0A07F' }, { value: 'ok', label: t('Trong hạn', 'On time'), dot: '#B6D9FC' }] }),
        h(FilterSelect, { label: t('Rủi ro', 'Risk'), icon: 'shield-warning', value: risk, onChange: setRisk, allLabel: t('Mọi mức', 'Any'), options: [{ value: 'high', label: t('Cao', 'High'), dot: '#F4A3A3' }, { value: 'medium', label: t('Vừa', 'Medium'), dot: '#F0A07F' }, { value: 'low', label: t('Thấp', 'Low'), dot: '#6CC7B6' }] }),
        h(FilterSelect, { label: t('Cờ', 'Flag'), icon: 'flag', value: flag, onChange: setFlag, allLabel: t('Mọi loại', 'Any'), options: flagOptions }),
        h(FilterSelect, { label: t('Thể loại', 'Genre'), icon: 'music-notes', multi: true, value: genres, onChange: (v) => setGenre(v.join(',')), options: genreOptions().map((g) => ({ ...g, count: items.filter((i) => i.genre === g.value).length })) }),
        h(FilterSelect, { label: t('Khu vực', 'District'), icon: 'map-trifold', multi: true, value: areas, onChange: (v) => setArea(v.join('|')), options: areaOptions().map((a) => ({ ...a, count: items.filter((i) => i.area === a.value).length })) }),
        active ? h('button', { type: 'button', className: 'op-link op-reset', onClick: () => setQuery({ sla: '', genre: '', area: '', risk: '', flag: '' }) }, Icon('arrow-counter-clockwise'), t('Bỏ lọc', 'Clear')) : null),
      h('div', { className: 'op-filterbar-right' }, h(FilterSelect, { label: t('Sắp xếp', 'Sort'), icon: 'arrows-down-up', value: sort, onChange: (v) => setSort(v || 'age'), options: [
        { value: 'age', label: t('Chờ lâu nhất', 'Waiting longest') }, { value: 'risk', label: t('Rủi ro cao nhất', 'Highest risk') }, { value: 'date', label: t('Diễn ra sớm nhất', 'Happening soonest') }, { value: 'new', label: t('Mới gửi', 'Newest') }] }))),
    error ? h(ErrorBox, { error, onRetry: reload }) : null,
    loading && !data ? h(Spinner) : h('div', { className: 'op-review' },
      h('div', { className: 'op-queue op-card', ref: listRef },
        rows.length ? h('div', { className: 'op-queue-head' },
          h(Checkbox, { checked: rows.length > 0 && rows.every((r) => selected.includes(r.id)), indeterminate: selected.length > 0 && !rows.every((r) => selected.includes(r.id)), onChange: (on) => setSelected(on ? rows.map((r) => r.id) : []), label: t(`${rows.length} tin`, `${rows.length} listings`) })) : null,
        rows.length ? rows.map((i) => h('div', {
          key: i.id, className: cx('op-qitem', current === i.id && 'is-on', selected.includes(i.id) && 'is-selected'), role: 'button', tabIndex: 0,
          onClick: (e) => { if (e.target.closest('label')) return; open(i.id); }, onKeyDown: (e) => { if (e.key === 'Enter') open(i.id); },
        },
        h(Checkbox, { checked: selected.includes(i.id), onChange: (on) => setSelected((s) => (on ? [...s, i.id] : s.filter((x) => x !== i.id))) }),
        h(Thumb, { src: i.coverUrl, art: i.art, title: i.title, w: 64 }),
        h('div', { className: 'op-qitem-text' },
          h('div', { className: 'op-qitem-title' }, i.title),
          h('div', { className: 'op-qitem-sub' }, i.organizer.name, i.organizer.verified ? Icon('seal-check', true, 'op-verified') : null, i.organizer.newOrganizer ? h('span', { className: 'op-new' }, t('mới', 'new')) : null),
          h('div', { className: 'op-qitem-sub' }, [i.startsOn ? day(i.startsOn) : null, i.venueName, i.genre].filter(Boolean).join(' · ')),
          h('div', { className: 'op-flags' },
            h(Pill, { tone: SLA_TONE[i.sla.state], icon: 'clock' }, duration(i.waitingMinutes)),
            h(Pill, { tone: RISK_TONE[i.riskBand] }, `${t('Rủi ro', 'Risk')} ${i.riskScore}`),
            i.flag ? h(Pill, { tone: 'danger', icon: 'flag' }, tx(i.flag.label)) : null,
            i.threadMessages ? h(Pill, { icon: 'chat-circle-text' }, i.threadMessages) : null)))) : h(Empty, { icon: items.length ? 'funnel' : 'check-circle', title: items.length ? t('Không có tin khớp bộ lọc', 'No listing matches') : t('Hàng chờ sạch', 'The queue is clear'), body: items.length ? null : t('Tin mới gửi sẽ hiện ở đây.', 'New submissions show up here.') })),
      h('div', { className: 'op-review-panel op-card' }, current ? h(ReviewPanel, { key: current, id: current, onDecided: decided, onReject: (ids, titles) => setReject({ ids, titles }) }) : h(Empty, { icon: 'cursor-click', title: t('Chọn một tin để xem', 'Pick a listing to review'), body: t('Phím J/K để chuyển tin, A để duyệt, R để trả lại.', 'J/K to move, A to approve, R to send back.') }))),
    selected.length ? h('div', { className: 'op-bulk' },
      h('span', { className: 'op-bulk-text' }, t(`Đã chọn ${selected.length} tin`, `${selected.length} selected`)),
      h(Button, { size: 'sm', variant: 'quiet', onClick: () => setSelected([]) }, t('Bỏ chọn', 'Clear')),
      h(Button, { size: 'sm', variant: 'danger', icon: 'arrow-u-up-left', onClick: () => setReject({ ids: selected, titles: items.filter((x) => selected.includes(x.id)).map((x) => x.title) }) }, t('Trả lại…', 'Send back…')),
      h(Button, { size: 'sm', variant: 'ok', icon: 'check', busy, onClick: () => approveMany(selected) }, t(`Duyệt ${selected.length} tin`, `Approve ${selected.length}`))) : null,
    h(RejectDialog, { open: !!reject, ids: reject?.ids ?? [], titles: reject?.titles ?? [], onClose: () => setReject(null), onDone: (ids) => { setReject(null); decided(ids); } }));
}
