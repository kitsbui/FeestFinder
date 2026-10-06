/*
 * Team mode: brand campaigns. The team posts a campaign for a brand; artists who are open to
 * brands say they are interested; the team shortlists and picks, and the artist is told.
 */
import { h, Fragment, useState, t, tx, get, post, patch, useFetch, toast, errorText, num, day } from '../core.js';
import { PageHeader, Button, Pill, Spinner, ErrorBox, Empty, DataTable, Drawer, Field, Input, TextArea, Select, DateInput, Combobox, Stat } from '../ui.js';
import { cityOptions, styleOptions } from '../opts.js';

const fee = (min, max, currency) => (min == null && max == null ? '—' : [min, max].filter((x) => x != null).map(num).join(' – ') + ` ${currency}`);
const STATUS = { draft: ['neutral', () => t('Nháp', 'Draft')], open: ['ok', () => t('Đang mở', 'Open')], closed: ['muted', () => t('Đã đóng', 'Closed')] };
const INTEREST = { sent: ['neutral', () => t('Mới', 'New')], shortlisted: ['info', () => t('Danh sách chọn', 'Shortlisted')], declined: ['danger', () => t('Từ chối', 'Declined')], selected: ['ok', () => t('Đã chọn', 'Selected')] };
const pill = (map, k) => h(Pill, { tone: map[k]?.[0] ?? 'neutral' }, map[k]?.[1]() ?? k);

/** Picks several values from a list: a combobox to add, chips to remove. */
function Many({ value, onChange, options, placeholder, max }) {
  const label = (v) => options.find((o) => o.value === v)?.label ?? v;
  return h(Fragment, null,
    h(Combobox, { value: null, options, placeholder, onChange: (v) => v && !value.includes(v) && value.length < max && onChange([...value, v]) }),
    value.length ? h('div', { className: 'op-quick', style: { marginTop: 6 } }, value.map((v) => h('button', { key: v, type: 'button', className: 'op-chip is-on', onClick: () => onChange(value.filter((x) => x !== v)) }, label(v), ' ×'))) : null);
}

function CampaignForm({ campaign, onClose, onSaved }) {
  const [f, setF] = useState(() => ({
    brandName: campaign?.brandName ?? '', title: campaign?.title ?? '', brief: campaign?.brief ?? '',
    cities: campaign?.cities.map((c) => c.slug) ?? [], styles: campaign?.styles.map((s) => s.key) ?? [],
    feeMin: campaign?.feeMin ?? '', feeMax: campaign?.feeMax ?? '', closesOn: campaign?.closesOn ?? '', status: campaign?.status ?? 'open',
  }));
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const ok = f.brandName.trim().length >= 2 && f.title.trim().length >= 3;
  const save = async () => {
    setBusy(true);
    try {
      const body = { brandName: f.brandName.trim(), title: f.title.trim(), brief: f.brief.trim(), cities: f.cities, styles: f.styles, status: f.status,
        feeMin: f.feeMin === '' ? null : Number(f.feeMin), feeMax: f.feeMax === '' ? null : Number(f.feeMax), closesOn: f.closesOn || null };
      if (campaign) await patch(`/admin/brand-campaigns/${campaign.id}`, body); else await post('/admin/brand-campaigns', body);
      toast(t('Đã lưu', 'Saved'));
      onSaved();
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  return h(Drawer, {
    open: true, onClose, width: 600, title: campaign ? campaign.title : t('Chiến dịch mới', 'New campaign'),
    footer: h(Fragment, null, h(Button, { onClick: onClose }, t('Huỷ', 'Cancel')), h('span', { className: 'op-spacer' }), h(Button, { variant: 'cta', icon: 'check', busy, disabled: !ok, onClick: save }, t('Lưu', 'Save'))),
  },
  h('div', { className: 'op-form-grid' },
    h(Field, { label: t('Thương hiệu', 'Brand'), required: true }, h(Input, { value: f.brandName, onChange: set('brandName'), autoFocus: !campaign })),
    h(Field, { label: t('Trạng thái', 'Status') }, h(Select, { value: f.status, onChange: (v) => set('status')(v || 'open'), options: Object.keys(STATUS).map((k) => ({ value: k, label: STATUS[k][1]() })) })),
    h(Field, { label: t('Tiêu đề', 'Title'), required: true, className: 'is-wide' }, h(Input, { value: f.title, onChange: set('title') })),
    h(Field, { label: t('Mô tả', 'Brief'), optional: true, className: 'is-wide' }, h(TextArea, { value: f.brief, onChange: set('brief'), rows: 4 })),
    h(Field, { label: t('Thành phố', 'Cities'), optional: true, hint: t('Phí tính theo tiền của thành phố đầu tiên', 'Fees are in the first city’s currency') },
      h(Many, { value: f.cities, onChange: set('cities'), options: cityOptions(), placeholder: t('Thêm thành phố', 'Add a city'), max: 10 })),
    h(Field, { label: t('Dòng nhạc', 'Styles'), optional: true }, h(Many, { value: f.styles, onChange: set('styles'), options: styleOptions(), placeholder: t('Thêm dòng nhạc', 'Add a style'), max: 8 })),
    h(Field, { label: t('Phí từ', 'Fee from'), optional: true }, h(Input, { value: String(f.feeMin), onChange: (v) => set('feeMin')(v.replace(/\D/g, '')), inputMode: 'numeric' })),
    h(Field, { label: t('Phí đến', 'Fee up to'), optional: true }, h(Input, { value: String(f.feeMax), onChange: (v) => set('feeMax')(v.replace(/\D/g, '')), inputMode: 'numeric' })),
    h(Field, { label: t('Hạn nhận', 'Closes on'), optional: true }, h(DateInput, { value: f.closesOn, onChange: set('closesOn') }))));
}

function Interests({ campaign, onClose }) {
  const { data, error, loading, reload } = useFetch(`/admin/brand-campaigns/${campaign.id}/interests`, [campaign.id]);
  const [busy, setBusy] = useState(null);
  const decide = async (i, status) => {
    setBusy(i.id + status);
    try { await post(`/admin/brand-campaigns/${campaign.id}/interests/${i.id}`, { status }); reload(true); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(null); }
  };
  const columns = [
    { key: 'artist', label: t('Nghệ sĩ', 'Artist'), width: 220, render: (i) => h('div', null, h('a', { href: `/a/${i.artist.slug}`, target: '_blank', rel: 'noopener' }, i.artist.name),
      h('div', { className: 'op-cell-sub' }, [i.artist.basedIn ? tx(i.artist.basedIn) : '', i.artist.styles.map((s) => tx(s.label)).join(', '), i.artist.email].filter(Boolean).join(' · '))) },
    { key: 'msg', label: t('Lời nhắn', 'Message'), width: 260, render: (i) => h('div', { style: { whiteSpace: 'pre-wrap' } }, i.message || '—') },
    { key: 'act', label: '', width: 280, align: 'right', render: (i) => (i.status === 'selected' || i.status === 'declined') ? pill(INTEREST, i.status) : h('div', { className: 'op-row-actions' },
      i.status === 'sent' ? h(Button, { size: 'sm', busy: busy === i.id + 'shortlisted', onClick: () => decide(i, 'shortlisted') }, t('Chọn sơ bộ', 'Shortlist')) : pill(INTEREST, i.status),
      h(Button, { size: 'sm', variant: 'ok', icon: 'check', busy: busy === i.id + 'selected', onClick: () => decide(i, 'selected') }, t('Chọn', 'Select')),
      h(Button, { size: 'sm', variant: 'danger', busy: busy === i.id + 'declined', onClick: () => decide(i, 'declined') }, t('Từ chối', 'Decline'))) },
  ];
  return h(Drawer, { open: true, onClose, width: 860, title: campaign.title, sub: campaign.brandName },
    error ? h(ErrorBox, { error, onRetry: reload }) : loading && !data ? h(Spinner)
      : h(DataTable, { columns, rows: data.items, minWidth: 760, empty: h(Empty, { icon: 'sparkle', title: t('Chưa có nghệ sĩ quan tâm', 'No interest yet') }) }));
}

export function Brands() {
  const { data, error, loading, reload } = useFetch('/admin/brand-campaigns');
  const [form, setForm] = useState(null);
  const [open, setOpen] = useState(null);
  const columns = [
    { key: 'title', label: t('Chiến dịch', 'Campaign'), width: 280, render: (c) => h('div', null, h('div', { className: 'op-cell-title' }, c.title),
      h('div', { className: 'op-cell-sub' }, [c.brandName, c.cities.map((x) => tx(x.label)).join(', '), c.closesOn ? t(`hạn ${day(c.closesOn)}`, `closes ${day(c.closesOn)}`) : ''].filter(Boolean).join(' · '))) },
    { key: 'fee', label: t('Phí', 'Fee'), width: 180, align: 'right', render: (c) => fee(c.feeMin, c.feeMax, c.currency) },
    { key: 'n', label: t('Quan tâm', 'Interested'), width: 110, align: 'right', render: (c) => num(c.interests) },
    { key: 'state', label: '', width: 110, render: (c) => pill(STATUS, c.status) },
    { key: 'act', label: '', width: 100, align: 'right', render: (c) => h(Button, { size: 'sm', icon: 'pencil-simple', onClick: (e) => { e.stopPropagation(); setForm({ campaign: c }); } }, t('Sửa', 'Edit')) },
  ];
  return h(Fragment, null,
    h(PageHeader, { title: t('Chiến dịch thương hiệu', 'Brand campaigns'), actions: h(Button, { variant: 'cta', icon: 'plus', onClick: () => setForm({}) }, t('Chiến dịch mới', 'New campaign')) }),
    error ? h(ErrorBox, { error, onRetry: reload }) : loading && !data ? h(Spinner) : h(Fragment, null,
      h('div', { className: 'op-stats op-stats--compact' }, h(Stat, { label: t('Nghệ sĩ nhận hợp tác', 'Artists open to brands'), value: num(data.artistsOpenToBrands) })),
      h(DataTable, { columns, rows: data.items, onRowClick: (c) => setOpen(c), minWidth: 860, empty: h(Empty, { icon: 'sparkle', title: t('Chưa có chiến dịch', 'No campaigns yet') }) })),
    form ? h(CampaignForm, { key: form.campaign?.id ?? 'new', campaign: form.campaign, onClose: () => setForm(null), onSaved: () => { setForm(null); reload(true); } }) : null,
    open ? h(Interests, { campaign: open, onClose: () => { setOpen(null); reload(true); } }) : null);
}
