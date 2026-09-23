/*
 * Team mode: organisers. The directory filters by verification, type and standing; a row
 * opens a drawer to verify documents, edit the profile, manage strikes and suspension, add
 * team members and see their listings. "Add organizer" onboards a new account.
 */
import { h, Fragment, useState, useEffect, useMemo, t, tx, cx, fold, get, post, patch, del, href, navigate, useFetch, useQueryState, setQuery, toast, errorText, emit, stamp, ago, num, money, day, monthYear } from '../core.js';
import {
  PageHeader, Button, Icon, Pill, Avatar, Spinner, ErrorBox, Empty, FilterBar, FilterSelect, DataTable, Drawer, Modal, Field, Input, TextArea, Select, Switch,
  Segmented, Tabs, KV, Stat, StatusPill, Checkbox, confirm, Card,
} from '../ui.js';
import { orgTypeOptions, orgTypeLabel, orgTypeShort } from '../opts.js';

const STATE = { pending: ['warn', 'seal-warning', 'Chờ xác minh', 'Pending'], verified: ['ok', 'seal-check', 'Đã xác minh', 'Verified'], flagged: ['danger', 'flag', 'Gắn cờ', 'Flagged'] };
const StatePill = ({ state }) => { const s = STATE[state] ?? STATE.pending; return h(Pill, { tone: s[0], icon: s[1] }, t(s[2], s[3])); };
const Doc = ({ ok, label }) => h('span', { className: cx('op-doc', ok && 'is-ok'), title: label }, Icon(ok ? 'check-circle' : 'circle', ok), label);

function Verification({ o, reload }) {
  const [busy, setBusy] = useState(null);
  const [strikes, setStrikes] = useState(String(o.strikes));
  // Switches answer at once; a failed save puts them back.
  const [docs, setDocs] = useState(o.docs);
  const [bankOk, setBankOk] = useState(!!o.bank?.verified);
  useEffect(() => setStrikes(String(o.strikes)), [o.strikes]);
  useEffect(() => { setDocs(o.docs); setBankOk(!!o.bank?.verified); }, [o]);
  const save = async (body, key) => {
    setBusy(key);
    if (body.docs) setDocs((d) => ({ ...d, ...body.docs }));
    if (body.bankVerified !== undefined) setBankOk(body.bankVerified);
    try { const out = await patch(`/admin/organizers/${o.id}`, body); if (out.message) toast(tx(out.message)); else toast(t('Đã lưu', 'Saved')); emit('counts'); reload(true); } catch (e) { toast(errorText(e), 'error'); setDocs(o.docs); setBankOk(!!o.bank?.verified); } finally { setBusy(null); }
  };
  const standing = async (body) => {
    let note;
    if (body.suspended === true) {
      const out = await confirm({ title: t(`Tạm dừng ${o.name}?`, `Suspend ${o.name}?`), body: t('Nhà tổ chức không gửi được tin mới cho tới khi mở lại. Tin đang đăng giữ nguyên.', 'They cannot submit new listings until reinstated. Live listings stay.'), confirm: t('Tạm dừng', 'Suspend'), tone: 'danger', withNote: { label: t('Ghi chú nội bộ', 'Internal note'), placeholder: t('Lý do tạm dừng…', 'Why…') } });
      if (!out) return;
      note = out.note;
    }
    setBusy('standing');
    try { const out = await post(`/admin/organizers/${o.id}/standing`, { ...body, note: note || undefined }); toast(tx(out.message)); reload(true); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(null); }
  };
  const ready = docs.id;
  return h(Fragment, null,
    h('div', { className: 'op-section' },
      h('h3', { className: 'op-section-title' }, Icon('files'), t('Giấy tờ đã nhận', 'Documents on file')),
      h('div', { className: 'op-doc-grid' },
        h(Checkbox, { checked: docs.id, onChange: (v) => save({ docs: { id: v } }, 'doc'), label: t('Giấy tờ tuỳ thân người đại diện', 'Representative ID') }),
        h(Checkbox, { checked: docs.tax, onChange: (v) => save({ docs: { tax: v } }, 'doc'), label: t('Giấy phép KD / mã số thuế', 'Business licence / tax code') }),
        h(Checkbox, { checked: docs.bank, onChange: (v) => save({ docs: { bank: v } }, 'doc'), label: t('Xác nhận tài khoản ngân hàng', 'Bank account proof') })),
      h(KV, { items: [
        [t('Tên pháp nhân', 'Registered name'), o.legalName || '—'],
        [t('Mã số thuế', 'Tax code'), o.taxCode ? h('span', { className: 'op-mono' }, o.taxCode) : '—'],
        [t('Tài khoản nhận tiền', 'Payout account'), o.bank ? h('span', null, `${o.bank.bankName ?? '—'} · `, h('span', { className: 'op-mono' }, o.bank.accountNo), o.bank.accountName ? ` · ${o.bank.accountName}` : h('span', { className: 'op-warn-text' }, t(' · thiếu tên chủ tài khoản', ' · holder name missing'))) : '—', true],
      ] }),
      o.bank ? h('div', { style: { marginTop: 12 } }, h(Switch, { checked: bankOk, onChange: (v) => save({ bankVerified: v }, 'bank'), label: t('Đã chuyển thử 1.000₫ thành công', '1,000₫ test transfer went through'), hint: t(`Thêm ${ago(o.bank.addedAt)}`, `Added ${ago(o.bank.addedAt)}`) })) : null),
    h('div', { className: 'op-section' },
      h('h3', { className: 'op-section-title' }, Icon('seal-check'), t('Kết luận xác minh', 'Verification')),
      h('div', { className: 'op-verify-row' },
        h(Segmented, { value: o.state, onChange: (v) => v !== o.state && save({ state: v }, 'state'), options: [
          { value: 'pending', label: t('Chờ xác minh', 'Pending'), icon: 'hourglass-medium' }, { value: 'verified', label: t('Đã xác minh', 'Verified'), icon: 'seal-check' }, { value: 'flagged', label: t('Gắn cờ', 'Flagged'), icon: 'flag' }] }),
        busy === 'state' ? h('span', { className: 'op-spin' }) : null),
      !ready && o.state !== 'verified' ? h('p', { className: 'op-hint' }, t('Cần có giấy tờ tuỳ thân trước khi xác minh.', 'An ID document is needed before verifying.')) : h('p', { className: 'op-hint' }, t('Nhà tổ chức đã xác minh có huy hiệu trên mọi thẻ và được ưu tiên trong tìm kiếm.', 'Verified organizers carry a badge on every card and rank higher in search.'))),
    h('div', { className: 'op-section' },
      h('h3', { className: 'op-section-title' }, Icon('warning'), t('Mức độ tuân thủ', 'Standing')),
      h('div', { className: 'op-verify-row' },
        h('span', { className: 'op-label' }, t('Số lần cảnh cáo', 'Strikes')),
        h(Segmented, { size: 'sm', value: strikes, onChange: (v) => { setStrikes(v); standing({ strikes: Number(v) }); }, options: ['0', '1', '2', '3'].map((n) => ({ value: n, label: n })) })),
      h('div', { style: { marginTop: 12 } }, h(Switch, { checked: o.suspended, disabled: busy === 'standing', onChange: (v) => standing({ suspended: v }), label: o.suspended ? t('Đang tạm dừng', 'Suspended') : t('Tạm dừng tài khoản', 'Suspend the account'), hint: o.suspended ? t(`Từ ${stamp(o.suspendedAt, true)} · không gửi được tin mới`, `Since ${stamp(o.suspendedAt, true)} · cannot submit`) : t('Cảnh cáo lần 3 sẽ tự tạm dừng.', 'A third strike suspends automatically.') }))));
}

function ProfileForm({ o, reload }) {
  const init = () => ({ name: o.name ?? '', type: o.type, bioVi: o.bio?.vi ?? '', bioEn: o.bio?.en ?? '', website: o.website ?? '', legalName: o.legalName ?? '', taxCode: o.taxCode ?? '', address: o.address ?? '', email: o.email ?? '', hotline: o.hotline ?? '', zalo: o.zalo ?? '', contactName: o.contactName ?? '', contactRole: o.contactRole ?? '' });
  const [f, setF] = useState(init);
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const dirty = JSON.stringify(f) !== JSON.stringify(init());
  const save = async () => {
    setBusy(true);
    try {
      const { bioVi, bioEn, ...rest } = f;
      const out = await patch(`/admin/organizers/${o.id}/profile`, { ...rest, bio: { vi: bioVi, en: bioEn }, website: f.website.trim() || '' });
      toast(tx(out.message));
      reload(true);
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  return h('div', { className: 'op-form-grid' },
    h(Field, { label: t('Tên thương hiệu', 'Brand name'), required: true }, h(Input, { value: f.name, onChange: set('name') })),
    h(Field, { label: t('Loại', 'Type') }, h(Select, { value: f.type, onChange: set('type'), options: orgTypeOptions() })),
    h(Field, { label: t('Giới thiệu (VI)', 'About (VI)'), className: 'is-wide' }, h(TextArea, { rows: 2, value: f.bioVi, onChange: set('bioVi') })),
    h(Field, { label: t('Giới thiệu (EN)', 'About (EN)'), className: 'is-wide', optional: true }, h(TextArea, { rows: 2, value: f.bioEn, onChange: set('bioEn') })),
    h(Field, { label: 'Website' }, h(Input, { value: f.website, onChange: set('website'), icon: 'globe' })),
    h(Field, { label: t('Tên pháp nhân', 'Registered name') }, h(Input, { value: f.legalName, onChange: set('legalName') })),
    h(Field, { label: t('Mã số thuế', 'Tax code'), hint: t('10–14 chữ số', '10–14 digits') }, h(Input, { value: f.taxCode, onChange: set('taxCode'), inputMode: 'numeric' })),
    h(Field, { label: t('Địa chỉ đăng ký', 'Registered address') }, h(Input, { value: f.address, onChange: set('address') })),
    h(Field, { label: 'Email' }, h(Input, { value: f.email, onChange: set('email'), icon: 'envelope-simple' })),
    h(Field, { label: 'Hotline' }, h(Input, { value: f.hotline, onChange: set('hotline'), icon: 'phone' })),
    h(Field, { label: 'Zalo OA' }, h(Input, { value: f.zalo, onChange: set('zalo') })),
    h(Field, { label: t('Người liên hệ', 'Contact person') }, h(Input, { value: f.contactName, onChange: set('contactName') })),
    h('div', { className: 'is-wide op-form-actions' }, h(Button, { variant: 'cta', icon: 'floppy-disk', busy, disabled: !dirty, onClick: save }, t('Lưu hồ sơ', 'Save profile'))));
}

function Members({ o, reload }) {
  const [f, setF] = useState({ email: '', name: '', role: 'manager' });
  const [busy, setBusy] = useState(false);
  const add = async () => {
    setBusy(true);
    try { const out = await post(`/admin/organizers/${o.id}/members`, f); toast(tx(out.message)); setF({ email: '', name: '', role: 'manager' }); reload(true); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  const remove = async (m) => {
    if (!(await confirm({ title: t('Gỡ thành viên?', 'Remove member?'), body: m.email ?? m.name, confirm: t('Gỡ', 'Remove'), tone: 'danger' }))) return;
    try { const out = await del(`/admin/organizers/${o.id}/members/${m.id}`); toast(tx(out.message)); reload(true); } catch (e) { toast(errorText(e), 'error'); }
  };
  return h(Fragment, null,
    o.members.length ? h('ul', { className: 'op-people' }, o.members.map((m) => h('li', { key: m.id },
      h('span', { className: 'op-people-name' }, m.name || m.email, h('small', null, [m.email, m.phone].filter(Boolean).join(' · '), m.lastActiveAt ? ` · ${t('hoạt động', 'active')} ${ago(m.lastActiveAt)}` : '')),
      h('span', { className: 'op-flags' },
        m.hasPassword ? null : h(Pill, { tone: 'warn', title: t('Chưa đặt mật khẩu — dùng "Quên mật khẩu" để đặt', 'No password yet — they use "Forgot password"') }, t('chưa đặt mật khẩu', 'no password')),
        h(Pill, { tone: m.role === 'owner' ? 'violet' : 'neutral' }, m.role === 'owner' ? t('Chủ', 'Owner') : t('Quản lý', 'Manager')),
        h(Button, { size: 'sm', variant: 'quiet', icon: 'x', title: t('Gỡ', 'Remove'), onClick: () => remove(m) }))))) : h('p', { className: 'op-hint' }, t('Chưa có ai đăng nhập được cho nhà tổ chức này.', 'Nobody can sign in for this organizer yet.')),
    h('div', { className: 'op-section-title', style: { marginTop: 18 } }, t('Thêm thành viên', 'Add a member')),
    h('div', { className: 'op-member-form' },
      h(Input, { value: f.email, onChange: (v) => setF((x) => ({ ...x, email: v })), placeholder: 'email@brand.vn', icon: 'envelope-simple', type: 'email' }),
      h(Input, { value: f.name, onChange: (v) => setF((x) => ({ ...x, name: v })), placeholder: t('Họ tên (tuỳ chọn)', 'Name (optional)') }),
      h(Select, { value: f.role, onChange: (v) => setF((x) => ({ ...x, role: v })), options: [{ value: 'manager', label: t('Quản lý', 'Manager') }, { value: 'owner', label: t('Chủ tài khoản', 'Owner') }] }),
      h(Button, { icon: 'user-plus', busy, disabled: !/@/.test(f.email), onClick: add }, t('Thêm', 'Add'))),
    h('p', { className: 'op-hint' }, t('Email chưa có tài khoản sẽ được tạo tài khoản mới; người đó đặt mật khẩu bằng "Quên mật khẩu" ở trang đăng nhập /ops.', 'An email without an account gets a new one; they set a password with "Forgot password" on the /ops sign-in.')));
}

function OrganizerDrawer({ id, onClose }) {
  const { data: o, error, loading, reload } = useFetch(`/admin/organizers/${id}`, [id]);
  const [tab, setTab] = useState('verify');
  return h(Drawer, {
    open: true, onClose, width: 720,
    title: o ? o.name : t('Đang tải…', 'Loading…'),
    head: o ? h('div', { className: 'op-drawer-avatar' }, h(Avatar, { name: o.name, src: o.logoUrl, art: o.art, size: 44, square: true })) : null,
    sub: o ? h(Fragment, null, h(StatePill, { state: o.state }), o.suspended ? h(Pill, { tone: 'danger', icon: 'prohibit' }, t('Tạm dừng', 'Suspended')) : null, h('span', null, `${tx(o.typeLabel)} · ${t('từ', 'since')} ${o.since} · ${num(o.followers)} ${t('người theo dõi', 'followers')}`)) : null,
    footer: o ? h(Fragment, null,
      h(Button, { icon: 'arrow-square-out', href: `/o/${o.slug}`, target: '_blank' }, t('Trang công khai', 'Public page')),
      h('span', { className: 'op-spacer' }),
      h(Button, { variant: 'cta', icon: 'plus', onClick: () => navigate(href('events', 'new') + `?org=${o.id}&orgName=${encodeURIComponent(o.name)}`) }, t('Tạo sự kiện cho NTC này', 'New listing for them'))) : null,
  },
  loading && !o ? h(Spinner) : error ? h(ErrorBox, { error, onRetry: reload }) : h(Fragment, null,
    h('div', { className: 'op-stats op-stats--compact' },
      h(Stat, { label: t('Đang đăng', 'Live'), value: o.stats.live }),
      h(Stat, { label: t('Đã duyệt · trả lại', 'Approved · sent back'), value: `${o.stats.decisions.approved ?? 0} · ${o.stats.decisions.rejected ?? 0}` }),
      h(Stat, { label: t('Báo cáo', 'Reports'), value: o.stats.reports, tone: o.stats.reports ? 'warn' : null }),
      h(Stat, { label: 'GMV', value: money(o.stats.gmv) })),
    h(Tabs, { value: tab, onChange: setTab, items: [
      { value: 'verify', icon: 'seal-check', label: t('Xác minh & tuân thủ', 'Verification') },
      { value: 'profile', icon: 'identification-card', label: t('Hồ sơ', 'Profile') },
      { value: 'members', icon: 'users-three', label: t('Thành viên', 'Team'), count: o.members.length },
      { value: 'events', icon: 'calendar-dots', label: t('Sự kiện', 'Listings'), count: o.events.length },
    ] }),
    tab === 'verify' ? h(Verification, { o, reload }) : null,
    tab === 'profile' ? h(ProfileForm, { key: o.name + o.type, o, reload }) : null,
    tab === 'members' ? h(Members, { o, reload }) : null,
    tab === 'events' ? (o.events.length ? h('ul', { className: 'op-list op-list--flush' }, o.events.map((e) => h('li', { key: e.id },
      h('a', { className: 'op-list-row', href: href('events', e.id), onClick: (ev) => { ev.preventDefault(); navigate(href('events', e.id)); } },
        h('span', { className: 'op-list-text' }, h('strong', null, e.title), h('small', null, [e.startsOn ? day(e.startsOn) : t('chưa có ngày', 'no date'), e.genre].filter(Boolean).join(' · '))),
        h(StatusPill, { status: e.status }))))) : h(Empty, { icon: 'calendar-blank', title: t('Chưa có tin nào', 'No listings yet') })) : null));
}

function Onboard({ open, onClose, onDone }) {
  const blank = { name: '', type: 'promoter', ownerEmail: '', ownerName: '', hotline: '', website: '', legalName: '', taxCode: '' };
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setF(blank); }, [open]);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const ok = f.name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.ownerEmail.trim());
  const save = async () => {
    setBusy(true);
    try {
      const body = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
      if (body.website && !/^https?:\/\//.test(body.website)) body.website = 'https://' + body.website;
      const out = await post('/admin/organizers', body);
      toast(tx(out.message));
      emit('counts');
      onDone(out.id);
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  return h(Modal, {
    open, onClose, width: 620, title: t('Thêm nhà tổ chức', 'Add an organizer'),
    footer: h(Fragment, null, h(Button, { onClick: onClose }, t('Huỷ', 'Cancel')), h(Button, { variant: 'cta', icon: 'check', busy, disabled: !ok, onClick: save }, t('Tạo nhà tổ chức', 'Create organizer'))),
  },
  h('p', { className: 'op-confirm-body' }, t('Tạo tài khoản cho đối tác mới. Chủ tài khoản đăng nhập /ops bằng email này và đặt mật khẩu qua "Quên mật khẩu / lần đầu đăng nhập".', 'Opens an account for a new partner. The owner signs in to /ops with this email and sets a password via "Forgot password / first sign-in".')),
  h('div', { className: 'op-form-grid' },
    h(Field, { label: t('Tên thương hiệu', 'Brand name'), required: true }, h(Input, { value: f.name, onChange: set('name'), autoFocus: true, placeholder: t('vd: Neon District', 'e.g. Neon District') })),
    h(Field, { label: t('Loại nhà tổ chức', 'Type'), required: true }, h(Select, { value: f.type, onChange: set('type'), options: orgTypeOptions() })),
    h(Field, { label: t('Email chủ tài khoản', 'Owner email'), required: true, hint: t('Dùng để đăng nhập.', 'Used to sign in.') }, h(Input, { type: 'email', value: f.ownerEmail, onChange: set('ownerEmail'), icon: 'envelope-simple', placeholder: 'booking@brand.vn' })),
    h(Field, { label: t('Họ tên chủ tài khoản', 'Owner name'), optional: true }, h(Input, { value: f.ownerName, onChange: set('ownerName') })),
    h(Field, { label: 'Hotline', optional: true }, h(Input, { value: f.hotline, onChange: set('hotline'), icon: 'phone', inputMode: 'tel' })),
    h(Field, { label: 'Website', optional: true }, h(Input, { value: f.website, onChange: set('website'), icon: 'globe', placeholder: 'https://' })),
    h(Field, { label: t('Tên pháp nhân', 'Registered name'), optional: true }, h(Input, { value: f.legalName, onChange: set('legalName') })),
    h(Field, { label: t('Mã số thuế', 'Tax code'), optional: true }, h(Input, { value: f.taxCode, onChange: set('taxCode'), inputMode: 'numeric' }))));
}

export function Organizers({ rest }) {
  const [state, setState] = useQueryState('state', '');
  const [type, setType] = useQueryState('type', '');
  const [standing, setStanding] = useQueryState('standing', '');
  const [q, setQ] = useQueryState('q', '');
  const [onboard, setOnboard] = useState(false);
  const { data, error, loading, reload } = useFetch('/admin/organizers');
  const current = rest[1] ?? null;
  const items = data?.items ?? [];
  const st = standing ? standing.split(',') : [];
  const rows = useMemo(() => items
    .filter((o) => !state || o.state === state)
    .filter((o) => !type || o.type === type)
    .filter((o) => !st.length || st.every((k) => (k === 'suspended' ? o.suspended : k === 'strikes' ? o.strikes > 0 : k === 'nobank' ? !o.bankOnFile : k === 'review' ? o.reviewEvents > 0 : true)))
    .filter((o) => !q || fold(`${o.name} ${o.legalName ?? ''} ${o.email ?? ''} ${o.taxCode ?? ''}`).includes(fold(q))), [items, state, type, standing, q]);
  const count = (k) => items.filter((o) => o.state === k).length;
  const columns = [
    { key: 'name', label: t('Nhà tổ chức', 'Organizer'), render: (o) => h('div', { className: 'op-cell-main' }, h(Avatar, { name: o.name, src: o.logoUrl, art: o.art, size: 36, square: true }),
      h('div', { style: { minWidth: 0 } }, h('div', { className: 'op-cell-title' }, o.name), h('div', { className: 'op-cell-sub' }, [orgTypeShort(o.type), o.legalName || o.email].filter(Boolean).join(' · ')))) },
    { key: 'events', label: t('Tin · đang đăng · chờ', 'Listings · live · queue'), width: 170, render: (o) => h('span', { className: 'op-cell-num' }, `${o.allEvents} · `, h('span', { className: 'op-ok-text' }, o.liveEvents), ' · ', o.reviewEvents ? h('span', { className: 'op-warn-text' }, o.reviewEvents) : '0') },
    { key: 'state', label: t('Xác minh', 'Verification'), width: 150, render: (o) => h('div', { className: 'op-status-cell' }, h(StatePill, { state: o.state }), o.suspended ? h(Pill, { tone: 'danger', icon: 'prohibit' }, t('Tạm dừng', 'Suspended')) : null) },
    { key: 'docs', label: t('Giấy tờ', 'Documents'), width: 190, render: (o) => h('div', { className: 'op-docs' }, h(Doc, { ok: o.docs.id, label: 'ID' }), h(Doc, { ok: o.docs.tax, label: t('Thuế', 'Tax') }), h(Doc, { ok: o.docs.bank && o.bankVerified, label: t('NH', 'Bank') })) },
    { key: 'strikes', label: t('Cảnh cáo', 'Strikes'), width: 100, render: (o) => h('span', { className: 'op-strikes', title: `${o.strikes}/3` }, [0, 1, 2].map((i) => h('span', { key: i, className: cx(i < o.strikes && 'is-on') }))) },
    { key: 'members', label: t('Thành viên', 'Team'), width: 100, align: 'right', render: (o) => o.members ? h('span', { className: 'op-cell-num' }, o.members) : h(Pill, { tone: 'warn' }, t('chưa có', 'none')) },
    { key: 'since', label: t('Tham gia', 'Joined'), width: 100, render: (o) => h('span', { className: 'op-cell-muted op-nowrap' }, monthYear(o.createdAt)) },
  ];
  return h(Fragment, null,
    h(PageHeader, {
      eyebrow: t('Đối tác', 'Partners'), title: t('Nhà tổ chức', 'Organizers'),
      sub: t('Xác minh giấy tờ, quản lý hồ sơ, thành viên và mức độ tuân thủ của từng nhà tổ chức.', 'Verify documents and manage each organizer’s profile, team and standing.'),
      actions: h(Button, { variant: 'cta', icon: 'user-plus', onClick: () => setOnboard(true) }, t('Thêm nhà tổ chức', 'Add organizer')),
    }),
    h('div', { className: 'op-stats' },
      h(Stat, { label: t('Chờ xác minh', 'Pending'), icon: 'seal-warning', value: count('pending'), tone: count('pending') ? 'warn' : null, active: state === 'pending', onClick: () => setState(state === 'pending' ? '' : 'pending') }),
      h(Stat, { label: t('Đã xác minh', 'Verified'), icon: 'seal-check', value: count('verified'), tone: 'ok', active: state === 'verified', onClick: () => setState(state === 'verified' ? '' : 'verified') }),
      h(Stat, { label: t('Gắn cờ', 'Flagged'), icon: 'flag', value: count('flagged'), tone: count('flagged') ? 'danger' : null, active: state === 'flagged', onClick: () => setState(state === 'flagged' ? '' : 'flagged') }),
      h(Stat, { label: t('Đang tạm dừng', 'Suspended'), icon: 'prohibit', value: items.filter((o) => o.suspended).length, onClick: () => setStanding(st.includes('suspended') ? '' : 'suspended') })),
    h(FilterBar, { search: q, onSearch: setQ, placeholder: t('Tên, pháp nhân, email, MST…', 'Name, legal name, email, tax code…'), active: [state, type, standing].filter(Boolean).length, onReset: () => setQuery({ state: '', type: '', standing: '' }) },
      h(FilterSelect, { label: t('Xác minh', 'Verification'), icon: 'seal-check', value: state, onChange: setState, allLabel: t('Mọi trạng thái', 'Any'), options: Object.entries(STATE).map(([k, v]) => ({ value: k, label: t(v[2], v[3]), count: count(k) })) }),
      h(FilterSelect, { label: t('Loại', 'Type'), icon: 'storefront', value: type, onChange: setType, allLabel: t('Mọi loại', 'Any type'), options: orgTypeOptions().map((x) => ({ ...x, count: items.filter((o) => o.type === x.value).length })) }),
      h(FilterSelect, { label: t('Tình trạng', 'Standing'), icon: 'warning', multi: true, value: st, onChange: (v) => setStanding(v.join(',')), options: [
        { value: 'review', label: t('Có tin đang chờ duyệt', 'Has listings in review') }, { value: 'strikes', label: t('Có cảnh cáo', 'Has strikes') }, { value: 'suspended', label: t('Đang tạm dừng', 'Suspended') }, { value: 'nobank', label: t('Chưa có tài khoản NH', 'No payout account') }] })),
    error ? h(ErrorBox, { error, onRetry: reload }) : null,
    h(DataTable, { columns, rows, loading, activeKey: current, onRowClick: (o) => navigate(href('organizers', o.id) + location.search), minWidth: 980 }),
    current ? h(OrganizerDrawer, { key: current, id: current, onClose: () => { navigate(href('organizers') + location.search, { replace: true }); reload(true); } }) : null,
    h(Onboard, { open: onboard, onClose: () => setOnboard(false), onDone: (id) => { setOnboard(false); reload(true); navigate(href('organizers', id)); } }));
}
