/*
 * The event form, shared by organisers (submit for review) and the FeestFinder team
 * (create for an organiser, fix a listing, publish directly).
 *
 * Six short sections instead of one long page of fields; every fixed list is picked from
 * a dropdown; the right-hand rail scores the listing live, lists what is still missing
 * before it can be sent, and shows the card exactly as the feed will.
 */
import {
  h, Fragment, useState, useEffect, useMemo, useRef, t, tx, cx, fold, money, day, vnDate, addDays, options, toast, errorText, useLeaveGuard, now,
} from './core.js';
import {
  Icon, Button, Field, Input, TextArea, Select, Segmented, RadioCards, Combobox, ChipsInput, MoneyInput, TimeSelect, DateInput,
  Uploader, QualityRing, Pill, Card, Switch, confirm, Avatar, Img,
} from './ui.js';
import { genreOptions, ageOptions, areaOptions, loadVenues, suggestArtists, loadOrganizers, genreLabel, badgeOptions } from './opts.js';

export const SECTIONS = [
  { id: 'basics', icon: 'text-aa', vi: 'Thông tin cơ bản', en: 'Basics' },
  { id: 'when', icon: 'calendar-blank', vi: 'Thời gian', en: 'Date & time' },
  { id: 'where', icon: 'map-pin', vi: 'Địa điểm', en: 'Venue' },
  { id: 'tickets', icon: 'ticket', vi: 'Vé & vào cửa', en: 'Tickets & entry' },
  { id: 'lineup', icon: 'music-notes', vi: 'Nghệ sĩ', en: 'Lineup' },
  { id: 'media', icon: 'image', vi: 'Hình ảnh & liên kết', en: 'Images & links' },
];

/** The same nine checks the server scores with (services/quality.ts), so the ring moves as people type. */
const CHECKS = [
  { key: 'name', pts: 10, sec: 'basics', vi: 'Tên sự kiện đủ rõ (từ 8 ký tự)', en: 'Event name reads clearly (8+ characters)' },
  { key: 'genre', pts: 8, sec: 'basics', vi: 'Đã chọn thể loại', en: 'Genre picked' },
  { key: 'description', pts: 14, sec: 'basics', vi: 'Mô tả từ 80 ký tự', en: 'Description of 80+ characters' },
  { key: 'logo', pts: 10, sec: 'media', vi: 'Có logo nhà tổ chức', en: 'Organizer logo added' },
  { key: 'cover', pts: 20, sec: 'media', vi: 'Có ảnh ngang 1600×900', en: 'Landscape image 1600×900' },
  { key: 'venue', pts: 14, sec: 'where', vi: 'Địa điểm có định vị bản đồ', en: 'Venue resolves to a map pin' },
  { key: 'tickets', pts: 12, sec: 'tickets', vi: 'Có giá và link mua vé', en: 'Price and a ticket link' },
  { key: 'lineup', pts: 8, sec: 'lineup', vi: 'Có từ 3 nghệ sĩ', en: 'Three or more artists' },
  { key: 'event_url', pts: 4, sec: 'media', vi: 'Có trang sự kiện riêng', en: 'Own event page linked' },
];

const REQUIRED = {
  title: { sec: 'basics', vi: 'Tên sự kiện', en: 'Event name' },
  genre: { sec: 'basics', vi: 'Thể loại', en: 'Genre' },
  dates: { sec: 'when', vi: 'Ngày và giờ', en: 'Date and times' },
  venue: { sec: 'where', vi: 'Địa điểm', en: 'Venue' },
  price: { sec: 'tickets', vi: 'Giá vé và link bán vé', en: 'Ticket price and link' },
  logo: { sec: 'media', vi: 'Logo', en: 'Logo' },
  eventUrl: { sec: 'media', vi: 'Trang sự kiện', en: 'Event page' },
};

/** Listing fields that send a live listing back to review when an organiser changes them. */
const REVIEWED = ['title', 'startsOn', 'endsOn', 'startTime', 'endTime', 'venueId', 'venueName', 'entryMode', 'priceFrom', 'coverUrl'];

const isUrl = (s) => !!s && /^https?:\/\/\S+\.\S+/.test(s.trim());
const withScheme = (s) => (s && !/^https?:\/\//i.test(s.trim()) && /\.\S/.test(s) ? 'https://' + s.trim() : s?.trim() ?? '');
const PARTNERS = [['ticketbox.vn', 'Ticketbox'], ['ticketgo.vn', 'TicketGo'], ['vebo.vn', 'Vebo'], ['eventbrite', 'Eventbrite'], ['facebook.com', 'Facebook'], ['zalo.me', 'Zalo'], ['momo.vn', 'MoMo']];
const partnerOf = (url) => PARTNERS.find(([d]) => (url || '').includes(d))?.[1] ?? null;
const mins = (hhmm) => (hhmm ? Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5)) : null);

function fromDraft(d) {
  const v = d?.venue ?? {};
  return {
    title: d?.title && d.title !== 'Untitled event' ? d.title : '',
    genre: d?.genre ?? '',
    age: d?.age ?? 'All ages',
    descVi: d?.description?.vi ?? '',
    descEn: d?.description?.en ?? '',
    multiDay: !!(d?.endsOn && d?.startsOn && d.endsOn !== d.startsOn),
    startsOn: d?.startsOn ?? '',
    endsOn: d?.endsOn ?? '',
    startTime: d?.startTime ?? '',
    endTime: d?.endTime ?? '',
    venueMode: v.id || !v.name ? 'saved' : 'new',
    venueId: v.id ?? null,
    venueLabel: v.id ? v.name : null,
    venueSub: v.id ? [v.address, v.area].filter(Boolean).join(' · ') : '',
    venueName: v.id ? '' : v.name ?? '',
    address: v.id ? '' : v.address ?? '',
    area: v.id ? '' : v.area ?? '',
    venueArea: v.area ?? '',
    entryMode: d?.entryMode ?? 'paid',
    priceFrom: Number(d?.priceFrom ?? 0),
    capacity: d?.capacity ?? '',
    ticketUrl: d?.ticketUrl ?? '',
    lineup: d?.lineup ?? [],
    logoUrl: d?.logoUrl ?? null,
    coverUrl: d?.coverUrl ?? null,
    eventUrl: d?.eventUrl ?? '',
    brandUrl: d?.brandUrl ?? '',
    featured: !!d?.featured,
    badge: d?.badge ?? '',
    tiers: (d?.tiers ?? []).map((x) => ({ ...x, nameVi: x.name?.vi ?? '', nameEn: x.name?.en ?? '' })),
  };
}

function toPayload(f, mode) {
  const saved = f.venueMode === 'saved';
  const p = {
    title: f.title.trim(),
    genre: f.genre || null,
    age: f.age,
    description: { vi: f.descVi, en: f.descEn },
    startsOn: f.startsOn || null,
    endsOn: f.startsOn ? (f.multiDay && f.endsOn ? f.endsOn : f.startsOn) : null,
    startTime: f.startTime || null,
    endTime: f.endTime || null,
    entryMode: f.entryMode,
    priceFrom: f.entryMode === 'paid' ? Number(f.priceFrom) || 0 : 0,
    capacity: f.capacity === '' || f.capacity === null ? null : Number(f.capacity),
    ticketUrl: f.ticketUrl.trim() || null,
    lineup: f.lineup,
    logoUrl: f.logoUrl || null,
    coverUrl: f.coverUrl || null,
    eventUrl: f.eventUrl.trim() || null,
    brandUrl: f.brandUrl.trim() || null,
  };
  if (saved) Object.assign(p, { venueId: f.venueId || null, ...(f.venueId ? {} : { venueName: null, address: null, area: null }) });
  else Object.assign(p, { venueId: null, venueName: f.venueName.trim() || null, address: f.address.trim() || null, area: f.area || null });
  if (mode === 'team') Object.assign(p, { featured: f.featured, badge: f.badge || null });
  return p;
}

function tiersPayload(f, original) {
  return f.tiers.map((x) => {
    const o = original.find((y) => y.key === x.key);
    return {
      key: x.key, name: { vi: x.nameVi.trim() || x.nameEn.trim(), en: x.nameEn.trim() || x.nameVi.trim() }, price: Number(x.price) || 0, capacity: Number(x.capacity) || 0,
      isLast: o?.isLast ?? false, note: o?.note ?? null, salesOpenAt: o?.salesOpenAt ?? null, priceRiseOn: o?.priceRiseOn ?? null, priceRiseTo: o?.priceRiseTo ?? null,
    };
  });
}

export function qualityOf(f) {
  const paid = f.entryMode === 'paid';
  const ok = {
    name: f.title.trim().length >= 8,
    genre: !!f.genre,
    description: Math.max(f.descVi.trim().length, f.descEn.trim().length) >= 80,
    logo: !!f.logoUrl,
    cover: !!f.coverUrl,
    venue: f.venueMode === 'saved' && !!f.venueId,
    tickets: paid ? f.priceFrom > 0 && isUrl(f.ticketUrl) : true,
    lineup: f.lineup.length >= 3,
    event_url: isUrl(f.eventUrl),
  };
  const checks = CHECKS.map((c) => ({ ...c, ok: ok[c.key] }));
  const score = checks.reduce((n, c) => n + (c.ok ? c.pts : 0), 0);
  return { score, checks, band: score >= 85 ? 'strong' : score >= 60 ? 'passable' : 'at_risk' };
}

export function missingOf(f, mode) {
  const m = [];
  if (!f.title.trim()) m.push('title');
  if (!f.genre) m.push('genre');
  if (!f.startsOn || !f.startTime || !f.endTime) m.push('dates');
  if (!(f.venueMode === 'saved' ? f.venueId : f.venueName.trim())) m.push('venue');
  if (f.entryMode === 'paid' && (!f.priceFrom || !f.ticketUrl.trim())) m.push('price');
  if (mode !== 'team') {
    if (!f.logoUrl) m.push('logo');
    if (!f.eventUrl.trim()) m.push('eventUrl');
  }
  return m;
}

function sectionDone(id, f) {
  switch (id) {
    case 'basics': return !!f.title.trim() && !!f.genre;
    case 'when': return !!f.startsOn && !!f.startTime && !!f.endTime;
    case 'where': return f.venueMode === 'saved' ? !!f.venueId : !!f.venueName.trim() && !!f.area;
    case 'tickets': return f.entryMode !== 'paid' || (f.priceFrom > 0 && isUrl(f.ticketUrl));
    case 'lineup': return f.lineup.length > 0;
    case 'media': return !!f.logoUrl && !!f.coverUrl && isUrl(f.eventUrl);
    default: return false;
  }
}

const jump = (id) => {
  const el = document.getElementById('sec-' + id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.classList.remove('is-flash');
  void el.offsetWidth;
  el.classList.add('is-flash');
};

/** Upcoming weekday dates as quick picks: today, this Friday, Saturday, Sunday. */
function datePicks() {
  const today = vnDate();
  const dow = new Date(today + 'T00:00:00Z').getUTCDay();
  const next = (target) => addDays(today, (target - dow + 7) % 7);
  return [
    { label: t('Hôm nay', 'Today'), value: today },
    { label: t('Thứ 6 này', 'This Friday'), value: next(5) },
    { label: t('Thứ 7 này', 'This Saturday'), value: next(6) },
    { label: t('Chủ nhật này', 'This Sunday'), value: next(0) },
  ];
}
const TIME_PICKS = () => [
  { label: t('Tối 19:00–23:00', 'Evening 19–23'), s: '19:00', e: '23:00' },
  { label: t('Chiều tối 16:00–22:00', 'Late afternoon 16–22'), s: '16:00', e: '22:00' },
  { label: t('Cả ngày 09:00–21:00', 'All day 09–21'), s: '09:00', e: '21:00' },
  { label: t('Xuyên đêm 22:00–04:00', 'All night 22–04'), s: '22:00', e: '04:00' },
];

function Section({ id, n, f, children, sub, locked }) {
  const s = SECTIONS.find((x) => x.id === id) ?? { vi: 'Thiết lập của đội FeestFinder', en: 'FeestFinder team settings' };
  const done = sectionDone(id, f);
  return h('section', { id: 'sec-' + id, className: 'op-fsec op-card' },
    h('div', { className: 'op-fsec-head' },
      h('span', { className: cx('op-fsec-n', done && 'is-done') }, done ? Icon('check') : n),
      h('div', null, h('h2', { className: 'op-fsec-title' }, t(s.vi, s.en)), sub ? h('div', { className: 'op-fsec-sub' }, sub) : null),
      locked ? h(Pill, { tone: 'warn', icon: 'arrows-clockwise', title: t('Sửa phần này sẽ đưa tin về hàng chờ duyệt', 'Changing this sends the listing back to review') }, t('Sửa sẽ duyệt lại', 'Edits re-review')) : null),
    h('div', { className: 'op-fsec-body' }, children));
}

/** The feed card, as attendees will see it. */
export function CardPreview({ f, organizer }) {
  const art = 'linear-gradient(135deg,#8C6BFF,#2AC4E8)';
  const price = f.entryMode === 'free' ? t('Miễn phí', 'Free') : f.entryMode === 'donation' ? t('Tuỳ tâm', 'Pay what you want') : f.priceFrom ? t(`Từ ${money(f.priceFrom)}`, `From ${money(f.priceFrom)}`) : t('Chưa có giá', 'No price yet');
  const where = f.venueMode === 'saved' ? f.venueLabel : f.venueName;
  const area = f.venueMode === 'saved' ? f.venueArea : f.area;
  return h('div', { className: 'op-feedcard' },
    h('div', { className: 'op-feedcard-art ff-art', style: { background: art } },
      h(Img, { src: f.coverUrl, fallback: h('span', { className: 'op-feedcard-poster' }, f.title || 'FeestFinder') }),
      f.genre ? h('span', { className: 'op-feedcard-genre' }, f.genre) : null,
      h(Img, { className: 'op-feedcard-logo', src: f.logoUrl })),
    h('div', { className: 'op-feedcard-body' },
      h('div', { className: 'op-feedcard-when' }, f.startsOn ? `${day(f.startsOn)}${f.startTime ? ' · ' + f.startTime : ''}` : t('Chưa chọn ngày', 'No date yet')),
      h('div', { className: 'op-feedcard-title' }, f.title || t('Tên sự kiện', 'Event name')),
      h('div', { className: 'op-feedcard-where' }, Icon('map-pin', true), [where, area].filter(Boolean).join(' · ') || t('Chưa chọn địa điểm', 'No venue yet')),
      h('div', { className: 'op-feedcard-foot' }, h('span', { className: 'op-feedcard-price' }, price), organizer ? h('span', { className: 'op-feedcard-org' }, organizer) : null)));
}

function TierEditor({ f, set, original, canEdit }) {
  const presets = options().tierPresets;
  const rows = f.tiers;
  const update = (i, patchObj) => set({ tiers: rows.map((r, j) => (j === i ? { ...r, ...patchObj } : r)) });
  const add = () => {
    const used = new Set(rows.map((r) => r.key));
    const p = presets.find((x) => !used.has(x.key));
    set({ tiers: [...rows, p ? { key: p.key, nameVi: p.name.vi, nameEn: p.name.en, price: f.priceFrom || 0, capacity: 100, sold: 0 } : { key: `tier-${rows.length + 1}`, nameVi: '', nameEn: '', price: 0, capacity: 100, sold: 0 }] });
  };
  const total = rows.reduce((n, r) => n + (Number(r.capacity) || 0), 0);
  return h('div', { className: 'op-tiers' },
    rows.length ? h('div', { className: 'op-tiers-table' },
      h('div', { className: 'op-tiers-head' }, h('span', null, t('Hạng vé', 'Tier')), h('span', null, t('Tên hiển thị', 'Display name')), h('span', null, t('Giá', 'Price')), h('span', null, t('Số lượng', 'Quantity')), h('span')),
      rows.map((r, i) => h('div', { key: i, className: 'op-tiers-row' },
        h(Select, {
          value: presets.some((p) => p.key === r.key) ? r.key : '__custom', disabled: r.sold > 0,
          options: [...presets.map((p) => ({ value: p.key, label: tx(p.name), disabled: rows.some((x, j) => j !== i && x.key === p.key) })), { value: '__custom', label: t('Tuỳ chỉnh…', 'Custom…') }],
          onChange: (v) => {
            if (v === '__custom') update(i, { key: `tier-${i + 1}-${Math.random().toString(36).slice(2, 5)}` });
            else { const p = presets.find((x) => x.key === v); update(i, { key: v, nameVi: p.name.vi, nameEn: p.name.en }); }
          },
        }),
        h(Input, { value: r.nameVi, placeholder: t('vd: Vé sớm', 'e.g. Early bird'), onChange: (v) => update(i, { nameVi: v, nameEn: r.nameEn || v }) }),
        h(MoneyInput, { value: Number(r.price) || 0, onChange: (v) => update(i, { price: v }) }),
        h(Input, { type: 'number', min: r.sold || 0, value: r.capacity, onChange: (v) => update(i, { capacity: v }), suffix: r.sold ? t(`đã bán ${r.sold}`, `${r.sold} sold`) : null }),
        h(Button, { variant: 'quiet', size: 'sm', icon: 'trash', title: r.sold ? t('Hạng vé đã có người mua, không xoá được', 'This tier has sales and cannot be removed') : t('Xoá hạng vé', 'Remove tier'), disabled: r.sold > 0 || !canEdit, onClick: () => set({ tiers: rows.filter((_, j) => j !== i) }) })))) : null,
    h('div', { className: 'op-tiers-foot' },
      h(Button, { size: 'sm', icon: 'plus', onClick: add, disabled: rows.length >= 12 || !canEdit }, t('Thêm hạng vé', 'Add a tier')),
      rows.length ? h('span', { className: 'op-hint' }, t(`Tổng ${total.toLocaleString('vi-VN')} vé · giá từ tự lấy theo hạng rẻ nhất`, `${total.toLocaleString('en-US')} tickets in total · "price from" follows the cheapest tier`)) : h('span', { className: 'op-hint' }, t('Chỉ cần khi bán vé qua FeestFinder. Bán qua đối tác thì chỉ cần link vé ở trên.', 'Only needed when FeestFinder sells the tickets. For a ticketing partner, the link above is enough.'))));
}

/**
 * props:
 *   mode       'org' | 'team'
 *   draft      the listing as the API returns it, or null for a new one
 *   actions    { create(payload), update(id, payload), tiers(id, tiers), primary?: {label, run(id), needs: 'submit'|'publish'} }
 *   onSaved    (draft) after a create or update
 *   banner     optional node above the form (status, moderator notes)
 *   readOnly   listings that can no longer change
 */
export function EventForm({ mode, draft, actions, onSaved, banner, readOnly, autosave, orgName, presetOrganizer }) {
  const [f, setF] = useState(() => fromDraft(draft));
  const [base, setBase] = useState(() => JSON.stringify(toPayload(fromDraft(draft), mode)));
  const [tierBase, setTierBase] = useState(() => JSON.stringify(tiersPayload(fromDraft(draft), draft?.tiers ?? [])));
  const [organizerId, setOrganizerId] = useState(presetOrganizer?.id ?? null);
  const [organizerLabel, setOrganizerLabel] = useState(presetOrganizer?.label ?? null);
  const [publishNow, setPublishNow] = useState(false);
  const [busy, setBusy] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [errors, setErrors] = useState({});
  const [showEn, setShowEn] = useState(!!draft?.description?.en);
  const [showTiers, setShowTiers] = useState((draft?.tiers ?? []).length > 0);
  const id = draft?.id ?? null;
  const set = (patchObj) => setF((x) => ({ ...x, ...patchObj }));
  const payload = useMemo(() => toPayload(f, mode), [f, mode]);
  const tiers = useMemo(() => tiersPayload(f, draft?.tiers ?? []), [f.tiers]);
  const dirty = JSON.stringify(payload) !== base || (id && showTiers && JSON.stringify(tiers) !== tierBase);
  const q = qualityOf(f);
  const missing = missingOf(f, mode);
  const live = draft?.status === 'live';
  const reviewedChanged = mode === 'org' && live && (() => { const b = JSON.parse(base); return REVIEWED.some((k) => JSON.stringify(b[k] ?? null) !== JSON.stringify(payload[k] ?? null)); })();
  const reviewedSections = mode === 'org' && live ? new Set(['basics', 'when', 'where', 'tickets', 'media']) : new Set();
  useLeaveGuard(!!dirty && !readOnly);

  /** Field errors; `quiet` (autosave) checks without marking fields while someone is still typing. */
  const validate = (quiet) => {
    const e = {};
    if (f.title.length > 120) e.title = t('Tối đa 120 ký tự', 'Up to 120 characters');
    if (f.multiDay && f.endsOn && f.startsOn && f.endsOn < f.startsOn) e.endsOn = t('Ngày kết thúc trước ngày bắt đầu', 'The end date is before the start');
    for (const k of ['ticketUrl', 'eventUrl', 'brandUrl']) if (f[k].trim() && !isUrl(f[k])) e[k] = t('Link cần bắt đầu bằng https://', 'Links start with https://');
    if (f.capacity !== '' && f.capacity !== null && (Number(f.capacity) < 1 || !Number.isInteger(Number(f.capacity)))) e.capacity = t('Nhập số nguyên dương', 'Enter a whole number');
    if (mode === 'team' && !id && !organizerId) e.organizer = t('Chọn nhà tổ chức', 'Pick the organizer');
    if (showTiers && f.tiers.some((x) => !x.nameVi.trim() && !x.nameEn.trim())) e.tiers = t('Mỗi hạng vé cần tên', 'Every tier needs a name');
    if (quiet) return !Object.keys(e).length;
    setErrors(e);
    if (Object.keys(e).length) {
      const first = { title: 'basics', endsOn: 'when', ticketUrl: 'tickets', capacity: 'tickets', tiers: 'tickets', eventUrl: 'media', brandUrl: 'media', organizer: 'basics' }[Object.keys(e)[0]];
      if (first) jump(first);
      return false;
    }
    return true;
  };

  /** Saves the fields (and tiers, when edited). Returns the saved listing, or null. */
  const save = async (opts = {}) => {
    if (readOnly) return null;
    if (!validate(opts.quiet)) { if (!opts.quiet) toast(t('Kiểm tra lại các ô được đánh dấu', 'Check the highlighted fields'), 'error'); return null; }
    if (reviewedChanged && !opts.confirmed && !opts.quiet) {
      const ok = await confirm({ title: t('Gửi duyệt lại tin đang đăng?', 'Send this live listing back to review?'), body: t('Bạn đã sửa ngày, giờ, địa điểm, giá hoặc ảnh bìa. Tin sẽ tạm vào hàng chờ duyệt (thường dưới 2 giờ) và vẫn giữ lượt lưu, lượt quan tâm.', 'You changed the date, times, venue, price or cover. The listing goes back into the review queue (usually under two hours); saves and hype are kept.'), confirm: t('Lưu và gửi duyệt lại', 'Save and re-submit') });
      if (!ok) return null;
    }
    if (opts.quiet && reviewedChanged) return null;
    setBusy(opts.busy ?? 'save');
    try {
      let out;
      if (!id) {
        out = await actions.create({ ...payload, ...(mode === 'team' ? { organizerId, publish: publishNow } : {}) });
      } else {
        out = JSON.stringify(payload) !== base || opts.force ? await actions.update(id, payload) : draft;
        if (showTiers && JSON.stringify(tiers) !== tierBase && f.entryMode === 'paid' && tiers.length) {
          const t2 = await actions.tiers(id, tiers);
          if (t2 && t2.tiers) out = { ...out, tiers: t2.tiers };
          setTierBase(JSON.stringify(tiers));
        }
      }
      setBase(JSON.stringify(toPayload(f, mode)));
      setSavedAt(now());
      if (!opts.quiet && out?.message) toast(tx(out.message));
      else if (!opts.quiet) toast(t('Đã lưu', 'Saved'));
      onSaved?.(out, { created: !id });
      return out;
    } catch (e) {
      if (!opts.quiet) toast(errorText(e), 'error');
      if (e.details?.fields) setErrors(Object.fromEntries(e.details.fields.map((x) => [x.path.split('.')[0], x.message])));
      return null;
    } finally { setBusy(null); }
  };

  const runPrimary = async () => {
    const p = actions.primary;
    if (!p) return;
    if (missing.length) { jump(REQUIRED[missing[0]].sec); toast(t('Còn thiếu thông tin bắt buộc', 'Some required details are missing'), 'error'); return; }
    const saved = dirty || !id ? await save({ busy: 'primary', confirmed: true }) : draft;
    if (!saved) return;
    setBusy('primary');
    try { await p.run(saved.id ?? id, saved); } finally { setBusy(null); }
  };

  // Drafts save themselves a moment after the last change.
  useEffect(() => {
    if (!autosave || !id || !dirty || readOnly || reviewedChanged) return;
    const timer = setTimeout(() => save({ quiet: true }), 1800);
    return () => clearTimeout(timer);
  }, [payload, autosave]);

  useEffect(() => {
    const key = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  });

  const dur = (() => {
    const a = mins(f.startTime), b = mins(f.endTime);
    if (a === null || b === null) return null;
    const m = b > a ? b - a : b + 1440 - a;
    return { m, overnight: b <= a };
  })();

  const err = (k) => errors[k];
  const dis = !!readOnly;

  const primaryLabel = actions.primary?.label;
  return h('div', { className: 'op-form-layout' },
    h('div', { className: 'op-form-main' },
      banner ?? null,
      h('nav', { className: 'op-steps', 'aria-label': t('Các mục', 'Sections') }, SECTIONS.map((s, i) =>
        h('button', { key: s.id, type: 'button', className: cx('op-step', sectionDone(s.id, f) && 'is-done'), onClick: () => jump(s.id) },
          h('span', { className: 'op-step-n' }, sectionDone(s.id, f) ? Icon('check') : i + 1), h('span', null, t(s.vi, s.en))))),

      h('fieldset', { className: 'op-fieldset', disabled: dis },
        // 1 · basics
        h(Section, { id: 'basics', n: 1, f, locked: reviewedSections.has('basics'), sub: t('Tên, thể loại và mô tả hiện trên thẻ sự kiện và trong kết quả tìm kiếm.', 'Name, genre and description show on the card and in search.') },
          mode === 'team' && !id ? h(Field, { label: t('Nhà tổ chức', 'Organizer'), required: true, error: err('organizer'), hint: t('Tin được tạo dưới tên nhà tổ chức này; họ thấy và sửa được trong Studio.', 'The listing is created for this organizer; they can see and edit it in their studio.') },
            h(Combobox, { value: organizerId, valueLabel: organizerLabel, load: loadOrganizers, placeholder: t('Tìm theo tên, email, mã số thuế…', 'Search by name, email, tax code…'), icon: 'buildings', invalid: !!err('organizer'), onChange: (v, o) => { setOrganizerId(v); setOrganizerLabel(o?.label ?? null); } })) : null,
          h(Field, { label: t('Tên sự kiện', 'Event name'), required: true, id: 'f-title', counter: [f.title.length, 120], error: err('title'), hint: t('Rõ ràng, có thương hiệu và năm nếu là sự kiện thường niên. Nên dưới 60 ký tự.', 'Clear, with the brand and year for a yearly event. Best under 60 characters.') },
            h(Input, { id: 'f-title', value: f.title, onChange: (v) => set({ title: v }), placeholder: t('vd: Ravolution Music Festival 2026', 'e.g. Ravolution Music Festival 2026'), maxLength: 140, invalid: !!err('title') })),
          h('div', { className: 'op-row-2' },
            h(Field, { label: t('Thể loại', 'Genre'), required: true, id: 'f-genre', hint: f.genre ? tx(options().genres.find((g) => g.value === f.genre)?.hint) : t('Quyết định sự kiện hiện ở bộ lọc nào.', 'Decides which filters the listing appears in.') },
              h(Select, { id: 'f-genre', value: f.genre, onChange: (v) => set({ genre: v }), placeholder: t('— Chọn thể loại —', '— Pick a genre —'), options: genreOptions() })),
            h(Field, { label: t('Độ tuổi', 'Age policy'), id: 'f-age' },
              h(Segmented, { value: f.age, onChange: (v) => set({ age: v }), options: ageOptions().map((a) => ({ value: a.value, label: a.value === 'All ages' ? t('Mọi lứa tuổi', 'All ages') : a.value })) }))),
          h(Field, { label: t('Mô tả (tiếng Việt)', 'Description (Vietnamese)'), id: 'f-desc', counter: [f.descVi.length, 4000], hint: f.descVi.trim().length < 80 ? t(`Còn ${80 - f.descVi.trim().length} ký tự nữa để đạt mức tối thiểu 80. Nêu: có gì diễn ra, ai biểu diễn, mở cửa lúc mấy giờ, cần mang gì.`, `${80 - f.descVi.trim().length} more characters to reach 80. Say what happens, who plays, when doors open, what to bring.`) : t('Hai dòng đầu hiện trong kết quả tìm kiếm.', 'The first two lines show in search results.') },
            h(TextArea, { id: 'f-desc', rows: 5, value: f.descVi, onChange: (v) => set({ descVi: v }), maxLength: 4000, placeholder: t('Có gì diễn ra, ai biểu diễn, mở cửa khi nào, cần mang theo gì…', 'What happens, who is playing, when doors open, what to bring…') })),
          showEn
            ? h(Field, { label: t('Mô tả (tiếng Anh)', 'Description (English)'), optional: true, id: 'f-desc-en', counter: [f.descEn.length, 4000] },
              h(TextArea, { id: 'f-desc-en', rows: 4, value: f.descEn, onChange: (v) => set({ descEn: v }), maxLength: 4000, placeholder: 'What happens, who is playing, when doors open…' }))
            : h('button', { type: 'button', className: 'op-link op-add-en', onClick: () => setShowEn(true) }, Icon('translate'), t('Thêm mô tả tiếng Anh cho khách quốc tế', 'Add an English description for visitors'))),

        // 2 · when
        h(Section, { id: 'when', n: 2, f, locked: reviewedSections.has('when'), sub: dur && f.startsOn ? `${day(f.startsOn)}${f.multiDay && f.endsOn ? ' → ' + day(f.endsOn) : ''} · ${f.startTime} → ${f.endTime}${dur.overnight ? t(' (hôm sau)', ' (next day)') : ''} · ${Math.floor(dur.m / 60)}h${dur.m % 60 ? String(dur.m % 60).padStart(2, '0') : ''}` : t('Giờ sau nửa đêm được hiểu là rạng sáng hôm sau.', 'Times after midnight count as the next morning.') },
          h(Segmented, { value: f.multiDay ? 'multi' : 'one', onChange: (v) => set({ multiDay: v === 'multi', endsOn: v === 'multi' ? f.endsOn || f.startsOn : f.endsOn }), options: [{ value: 'one', label: t('Một ngày', 'One day') }, { value: 'multi', label: t('Nhiều ngày', 'Several days') }] }),
          h('div', { className: 'op-row-2' },
            h(Field, { label: f.multiDay ? t('Ngày bắt đầu', 'First day') : t('Ngày diễn ra', 'Date'), required: true, id: 'f-start' },
              h(DateInput, { id: 'f-start', value: f.startsOn, min: mode === 'org' ? vnDate() : undefined, onChange: (v) => set({ startsOn: v ?? '', endsOn: f.endsOn && v && f.endsOn < v ? v : f.endsOn }) }),
              h('div', { className: 'op-quick' }, datePicks().map((p) => h('button', { key: p.value + p.label, type: 'button', className: cx('op-chip', f.startsOn === p.value && 'is-on'), onClick: () => set({ startsOn: p.value }) }, p.label)))),
            f.multiDay ? h(Field, { label: t('Ngày kết thúc', 'Last day'), required: true, id: 'f-end', error: err('endsOn') },
              h(DateInput, { id: 'f-end', value: f.endsOn, min: f.startsOn || undefined, invalid: !!err('endsOn'), onChange: (v) => set({ endsOn: v ?? '' }) })) : h('div')),
          h('div', { className: 'op-row-2' },
            h(Field, { label: t('Giờ mở cửa', 'Doors open'), required: true, id: 'f-t1' }, h(TimeSelect, { id: 'f-t1', value: f.startTime, onChange: (v) => set({ startTime: v }) })),
            h(Field, { label: t('Giờ kết thúc', 'Ends'), required: true, id: 'f-t2', hint: dur?.overnight ? t('Kết thúc sau nửa đêm — tính sang hôm sau.', 'Ends after midnight — counted as the next day.') : null },
              h(TimeSelect, { id: 'f-t2', value: f.endTime, after: f.startTime, onChange: (v) => set({ endTime: v }) }))),
          h('div', { className: 'op-quick' }, h('span', { className: 'op-quick-label' }, t('Khung giờ nhanh:', 'Quick times:')),
            TIME_PICKS().map((p) => h('button', { key: p.s, type: 'button', className: cx('op-chip', f.startTime === p.s && f.endTime === p.e && 'is-on'), onClick: () => set({ startTime: p.s, endTime: p.e }) }, p.label)))),

        // 3 · where
        h(Section, { id: 'where', n: 3, f, locked: reviewedSections.has('where'), sub: t('Chọn địa điểm có sẵn để tự điền địa chỉ, quận và ghim bản đồ.', 'Pick a saved venue to fill the address, district and map pin.') },
          h(Segmented, { value: f.venueMode, onChange: (v) => set({ venueMode: v }), options: [{ value: 'saved', label: t('Chọn từ danh sách', 'Saved venue'), icon: 'map-pin' }, { value: 'new', label: t('Địa điểm mới', 'New venue'), icon: 'plus' }] }),
          f.venueMode === 'saved'
            ? h(Fragment, null,
              h(Field, { label: t('Địa điểm', 'Venue'), required: true, id: 'f-venue', hint: t('Không thấy địa điểm? Chọn "Địa điểm mới" — đội FeestFinder sẽ xác minh và ghim bản đồ.', 'Not in the list? Choose "New venue" — the FeestFinder team verifies and pins it.') },
                h(Combobox, { id: 'f-venue', value: f.venueId, valueLabel: f.venueLabel, load: loadVenues, placeholder: t('Tìm tên địa điểm, đường, quận…', 'Search venue, street, district…'), icon: 'map-pin', onChange: (v, o) => set({ venueId: v, venueLabel: o?.label ?? null, venueSub: o?.sub ?? '', venueArea: o?.raw?.area ?? '' }), emptyText: t('Không có địa điểm này — hãy chọn "Địa điểm mới"', 'Not found — choose "New venue"') })),
              f.venueId ? h('div', { className: 'op-venue-card' }, Icon('map-pin', true), h('div', null, h('div', { className: 'op-venue-name' }, f.venueLabel), h('div', { className: 'op-venue-sub' }, f.venueSub)), h(Pill, { tone: 'ok', icon: 'check-circle' }, t('Có định vị', 'Pinned'))) : null)
            : h(Fragment, null,
              h('div', { className: 'op-row-2' },
                h(Field, { label: t('Tên địa điểm', 'Venue name'), required: true, id: 'f-vname' }, h(Input, { id: 'f-vname', value: f.venueName, onChange: (v) => set({ venueName: v }), placeholder: t('vd: Warehouse 12', 'e.g. Warehouse 12') })),
                h(Field, { label: t('Khu vực', 'District'), required: true, id: 'f-area', hint: t('Chọn từ danh sách để lọc theo quận chính xác.', 'Pick from the list so district filters work.') },
                  h(Combobox, { id: 'f-area', value: f.area, options: areaOptions(), placeholder: t('Chọn quận / khu vực', 'Pick a district'), icon: 'map-trifold', onChange: (v) => set({ area: v ?? '' }), onCreate: (v) => set({ area: v }), createLabel: t('Khu vực khác: “{q}”', 'Other area: “{q}”') }))),
              h(Field, { label: t('Địa chỉ', 'Address'), id: 'f-addr', hint: t('Số nhà, đường, phường. Kèm một mốc gần đó nếu khó tìm.', 'Number, street, ward. Add a landmark if it is hard to find.') }, h(Input, { id: 'f-addr', value: f.address, onChange: (v) => set({ address: v }), placeholder: t('vd: 12 Tôn Thất Thuyết, P. 16', 'e.g. 12 Tôn Thất Thuyết, Ward 16') })),
              h('div', { className: 'op-note op-note--warn' }, Icon('info', true), h('span', null, t('Địa điểm mới cần được đội FeestFinder xác minh và ghim bản đồ trước khi hiện trên Map — việc duyệt có thể lâu hơn một chút.', 'A new venue has to be verified and pinned by the FeestFinder team before it shows on the map — review may take a little longer.'))))),

        // 4 · tickets
        h(Section, { id: 'tickets', n: 4, f, locked: reviewedSections.has('tickets'), sub: t('Hình thức vào cửa quyết định các ô bên dưới.', 'The entry type decides what else is needed.') },
          h(RadioCards, { value: f.entryMode, onChange: (v) => set({ entryMode: v }), options: options().entryModes.map((e) => ({ value: e.value, label: tx(e.label), hint: tx(e.hint) })) }),
          f.entryMode === 'paid' ? h(Fragment, null,
            h('div', { className: 'op-row-2' },
              h(Field, { label: t('Giá từ', 'Price from'), required: true, id: 'f-price', hint: t('Giá vé rẻ nhất, đã gồm VAT.', 'The cheapest ticket, VAT included.') },
                h(MoneyInput, { id: 'f-price', value: f.priceFrom, onChange: (v) => set({ priceFrom: v }), presets: [100000, 150000, 200000, 300000, 500000, 1000000] })),
              h(Field, { label: t('Sức chứa', 'Capacity'), optional: true, id: 'f-cap', error: err('capacity'), hint: t('Dùng để hiện "Sắp hết vé" và tính tiến độ bán.', 'Drives "Selling fast" and the sales pace.') },
                h(Input, { id: 'f-cap', type: 'number', min: 1, value: f.capacity, onChange: (v) => set({ capacity: v }), placeholder: t('vd: 800', 'e.g. 800'), invalid: !!err('capacity') }))),
            h(Field, { label: t('Link bán vé', 'Ticket link'), required: true, id: 'f-ticket', error: err('ticketUrl'), aside: partnerOf(f.ticketUrl) ? h(Pill, { tone: 'ok', icon: 'seal-check' }, partnerOf(f.ticketUrl)) : null, hint: t('Link vé lỗi là lý do bị trả lại phổ biến thứ hai — hãy mở thử trước khi gửi.', 'A broken ticket link is the second most common send-back — open it once before submitting.') },
              h(Input, { id: 'f-ticket', type: 'url', icon: 'link', value: f.ticketUrl, invalid: !!err('ticketUrl'), onChange: (v) => set({ ticketUrl: v }), onBlur: () => set({ ticketUrl: withScheme(f.ticketUrl) }), placeholder: 'https://ticketbox.vn/…' })),
            h('div', { className: 'op-tier-toggle' },
              h(Switch, { checked: showTiers, onChange: setShowTiers, label: t('Chia hạng vé (Vé sớm, Thường, VIP…)', 'Ticket tiers (Early bird, GA, VIP…)'), hint: id ? t('Khi bán vé trực tiếp trên FeestFinder.', 'When FeestFinder sells the tickets.') : t('Lưu nháp trước, sau đó thêm hạng vé.', 'Save the draft first, then add tiers.'), disabled: !id })),
            showTiers && id ? h(TierEditor, { f, set, original: draft?.tiers ?? [], canEdit: !dis }) : null,
            err('tiers') ? h('div', { className: 'op-field-error' }, Icon('warning-circle', true), err('tiers')) : null)
            : h('div', { className: 'op-note' }, Icon('info', true), h('span', null, f.entryMode === 'free' ? t('Tin miễn phí hiện trong bộ lọc "Miễn phí" và các trang "Sự kiện miễn phí cuối tuần".', 'Free listings appear in the Free filter and the "free this weekend" pages.') : t('Khách trả tuỳ ý tại cửa. Ghi mức gợi ý trong mô tả nếu có.', 'People pay what they want at the door. Put a suggested amount in the description if you have one.')))),

        // 5 · lineup
        h(Section, { id: 'lineup', n: 5, f, sub: t('Tên nghệ sĩ được gợi ý từ các sự kiện khác để viết thống nhất — người theo dõi nghệ sĩ sẽ được báo.', 'Names are suggested from other listings so they are spelled the same — followers of an artist get told.') },
          h(Field, { label: t('Dàn nghệ sĩ', 'Lineup'), optional: true, id: 'f-lineup', hint: t('Gõ tên rồi Enter, hoặc dán cả danh sách cách nhau bằng dấu phẩy. Thứ tự = thứ tự hiển thị. Từ 3 nghệ sĩ giúp tin vào mục Đang hot.', 'Type a name and press Enter, or paste a comma-separated list. Order is display order. Three or more qualifies for Trending.') },
            h(ChipsInput, { id: 'f-lineup', value: f.lineup, onChange: (v) => set({ lineup: v }), suggest: suggestArtists, placeholder: t('vd: Hoaprox, DJ Mie, Wukong', 'e.g. Hoaprox, DJ Mie, Wukong') }))),

        // 6 · media
        h(Section, { id: 'media', n: 6, f, locked: reviewedSections.has('media'), sub: t('Ảnh bìa chiếm 20 điểm chất lượng: thẻ không có ảnh mất khoảng 40% lượt bấm.', 'The cover is worth 20 quality points: cards without art lose about 40% of taps.') },
          h('div', { className: 'op-row-media' },
            h(Field, { label: t('Ảnh bìa', 'Cover image'), optional: true }, h(Uploader, { purpose: 'cover', value: f.coverUrl, onChange: (v) => set({ coverUrl: v }) })),
            h(Field, { label: t('Logo thương hiệu', 'Brand logo'), required: mode === 'org' }, h(Uploader, { purpose: 'logo', value: f.logoUrl, onChange: (v) => set({ logoUrl: v }) }))),
          h('div', { className: 'op-row-2' },
            h(Field, { label: t('Trang sự kiện', 'Event page'), required: mode === 'org', id: 'f-eurl', error: err('eventUrl'), hint: t('Dùng để đối chiếu thông tin khi duyệt.', 'Used to cross-check details during review.') },
              h(Input, { id: 'f-eurl', type: 'url', icon: 'globe', value: f.eventUrl, invalid: !!err('eventUrl'), onChange: (v) => set({ eventUrl: v }), onBlur: () => set({ eventUrl: withScheme(f.eventUrl) }), placeholder: 'https://…' })),
            h(Field, { label: t('Trang thương hiệu', 'Brand page'), optional: true, id: 'f-burl', error: err('brandUrl'), hint: t('Facebook, Instagram hoặc website.', 'Facebook, Instagram or website.') },
              h(Input, { id: 'f-burl', type: 'url', icon: 'link', value: f.brandUrl, invalid: !!err('brandUrl'), onChange: (v) => set({ brandUrl: v }), onBlur: () => set({ brandUrl: withScheme(f.brandUrl) }), placeholder: 'https://facebook.com/…' })))),

        mode === 'team' ? h(Section, { id: 'team', n: 7, f, sub: t('Chỉ đội FeestFinder thấy và chỉnh được.', 'Only the FeestFinder team sees these.') },
          h('div', { className: 'op-row-2' },
            h(Field, { label: t('Nổi bật', 'Featured') }, h(Switch, { checked: f.featured, onChange: (v) => set({ featured: v }), label: t('Ưu tiên trong feed Khám phá', 'Boost in the Explore feed') })),
            h(Field, { label: t('Nhãn trên thẻ', 'Card badge'), optional: true }, h(Select, { value: f.badge, onChange: (v) => set({ badge: v }), placeholder: t('— Không nhãn —', '— No badge —'), options: badgeOptions() }))),
          !id ? h(Switch, { checked: publishNow, onChange: setPublishNow, label: t('Đăng ngay sau khi tạo', 'Publish as soon as it is created'), hint: t('Bỏ qua hàng chờ: dùng cho sự kiện đội FeestFinder tự thu thập và đã kiểm chứng.', 'Skips the queue: for listings the team sourced and checked itself.') }) : null) : null)),

    // ---- the rail --------------------------------------------------------------------------
    h('aside', { className: 'op-form-rail' },
      h('div', { className: 'op-rail-sticky' },
        h(Card, { className: 'op-rail-card' },
          h('div', { className: 'op-quality' },
            h(QualityRing, { score: q.score, size: 70 }),
            h('div', null,
              h('div', { className: 'op-quality-label' }, t('Chất lượng tin', 'Listing quality')),
              h('div', { className: cx('op-quality-band', `is-${q.band}`) }, q.band === 'strong' ? t('Mạnh — thường duyệt trong 1 giờ', 'Strong — usually cleared within an hour') : q.band === 'passable' ? t('Đủ duyệt — xếp hạng thấp hơn tin đầy đủ', 'Passable — ranks below complete listings') : t('Rủi ro — dễ bị trả lại', 'At risk — likely to be sent back')))),
          h('ul', { className: 'op-checks' }, q.checks.map((c) => h('li', { key: c.key },
            h('button', { type: 'button', className: cx('op-check-row', c.ok && 'is-ok'), onClick: () => jump(c.sec) },
              h('span', { className: 'op-check-ic' }, c.ok ? Icon('check-circle', true) : Icon('circle')), h('span', { className: 'op-check-text' }, t(c.vi, c.en)), h('span', { className: 'op-check-pts ff-num' }, `+${c.pts}`)))))),
        h(Card, { className: 'op-rail-card' },
          missing.length
            ? h(Fragment, null,
              h('div', { className: 'op-rail-title' }, Icon('warning-circle', true), t(`Còn thiếu ${missing.length} mục bắt buộc`, `${missing.length} required item${missing.length > 1 ? 's' : ''} missing`)),
              h('div', { className: 'op-missing' }, missing.map((k) => h('button', { key: k, type: 'button', className: 'op-chip', onClick: () => jump(REQUIRED[k].sec) }, t(REQUIRED[k].vi, REQUIRED[k].en)))))
            : h('div', { className: 'op-rail-title is-ok' }, Icon('check-circle', true), mode === 'team' ? t('Đủ thông tin để đăng', 'Ready to publish') : t('Đủ thông tin để gửi duyệt', 'Ready to submit')),
          h('div', { className: 'op-rail-actions' },
            !readOnly ? h(Button, { icon: 'floppy-disk', busy: busy === 'save', onClick: () => save(), disabled: !dirty && !!id }, id ? (dirty ? t('Lưu thay đổi', 'Save changes') : t('Đã lưu', 'Saved')) : mode === 'team' ? (publishNow ? t('Tạo và đăng', 'Create and publish') : t('Tạo bản nháp', 'Create draft')) : t('Lưu nháp', 'Save draft')) : null,
            primaryLabel && !readOnly ? h(Button, { variant: 'cta', icon: 'paper-plane-right', busy: busy === 'primary', onClick: runPrimary, disabled: missing.length > 0 }, primaryLabel) : null),
          h('div', { className: 'op-savestate' }, readOnly ? t('Tin này không còn sửa được.', 'This listing can no longer be edited.') : dirty ? (autosave && !reviewedChanged ? t('Đang có thay đổi — tự lưu sau vài giây', 'Unsaved — saving in a moment') : t('Có thay đổi chưa lưu · Ctrl/⌘+S', 'Unsaved changes · Ctrl/⌘+S')) : savedAt ? t(`Đã lưu lúc ${savedAt.toTimeString().slice(0, 5)}`, `Saved at ${savedAt.toTimeString().slice(0, 5)}`) : id ? t('Mọi thay đổi đã được lưu', 'All changes saved') : t('Chưa lưu', 'Not saved yet'))),
        h('div', { className: 'op-rail-preview' },
          h('div', { className: 'op-rail-title op-rail-title--quiet' }, Icon('eye'), t('Xem trước trên feed', 'Feed preview')),
          h(CardPreview, { f, organizer: orgName ?? organizerLabel })))));
}
