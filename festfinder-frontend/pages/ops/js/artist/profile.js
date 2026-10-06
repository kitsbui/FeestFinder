/*
 * Artist mode: the profile an artist keeps. Their upcoming and past shows, the organisers
 * they worked with and their shared lineups come from events, never from this form.
 */
import { h, Fragment, useState, useEffect, t, tx, cx, useFetch, patch, toast, errorText, useLeaveGuard, num } from '../core.js';
import { PageHeader, Button, Card, Field, Input, TextArea, Select, Uploader, Pill, Spinner, ErrorBox, Switch, Stat, ChipsInput } from '../ui.js';
import { cityOptions, styleOptions } from '../opts.js';

const pick = (list, value, set, max) => h('div', { className: 'op-quick' }, list.map((o) => {
  const on = value.includes(o.value);
  return h('button', { key: o.value, type: 'button', className: cx('op-chip', on && 'is-on'), disabled: !on && max && value.length >= max,
    onClick: () => set(on ? value.filter((x) => x !== o.value) : [...value, o.value]) }, o.label);
}));

export function ArtistProfile() {
  const { data, error, loading, reload } = useFetch('/me/artist');
  const [f, setF] = useState(null);
  const [base, setBase] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState({});
  useEffect(() => {
    if (!data) return;
    const p = data.profile;
    const next = {
      name: p.name, bioVi: p.bio?.vi ?? '', bioEn: p.bio?.en ?? '', imageUrl: p.imageUrl ?? '', coverUrl: p.coverUrl ?? '', website: p.website ?? '',
      roles: p.roles ?? [], basedCity: p.basedCity ?? '', languages: p.languages ?? [], activeSince: p.activeSince ? String(p.activeSince) : '',
      styles: p.styles ?? [], bookingStatus: p.bookingStatus ?? '', travelScope: p.travelScope ?? '', gigTypes: p.gigTypes ?? [], setLengths: p.setLengths ?? [],
      links: { ...(p.links ?? {}) }, openToBrands: !!p.openToBrands,
    };
    setF(next);
    setBase(JSON.stringify(next));
  }, [data]);
  const dirty = f && JSON.stringify(f) !== base;
  useLeaveGuard(!!dirty);
  if (loading && !data) return h(Spinner);
  if (error) return h(ErrorBox, { error, onRetry: reload });
  if (!f) return null;
  const o = data.options;
  const opt = (list) => list.map((x) => ({ value: x.key, label: tx(x.label) }));
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const setLink = (k) => (v) => setF((x) => ({ ...x, links: { ...x.links, [k]: v } }));

  const save = async () => {
    const e = {};
    if (f.name.trim().length < 2) e.name = t('Cần nghệ danh', 'A stage name is required');
    if (f.website && !/^https?:\/\/\S+\.\S+/.test(f.website.trim())) e.website = t('Link cần bắt đầu bằng https://', 'Links start with https://');
    if (f.activeSince && !/^(19[5-9]\d|20\d\d)$/.test(f.activeSince)) e.activeSince = t('Một năm, vd 2018', 'A year, e.g. 2018');
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const links = Object.fromEntries(Object.entries(f.links).map(([k, v]) => [k, (v || '').trim() || null]));
      const out = await patch('/me/artist', {
        name: f.name.trim(), bio: { vi: f.bioVi, en: f.bioEn }, imageUrl: f.imageUrl || null, coverUrl: f.coverUrl || null, website: f.website.trim() || null,
        roles: f.roles, basedCity: f.basedCity || null, languages: f.languages, activeSince: f.activeSince ? Number(f.activeSince) : null,
        styles: f.styles, bookingStatus: f.bookingStatus || null, travelScope: f.travelScope || null, gigTypes: f.gigTypes, setLengths: f.setLengths,
        links, openToBrands: f.openToBrands,
      });
      toast(tx(out.message) || t('Đã lưu', 'Saved'));
      setBase(JSON.stringify(f));
    } catch (x) {
      if (x?.code === 'invalid_link' && x.details?.kind) setErr({ ['link:' + x.details.kind]: errorText(x) });
      toast(errorText(x), 'error');
    } finally { setBusy(false); }
  };

  return h(Fragment, null,
    h(PageHeader, {
      title: f.name || t('Hồ sơ nghệ sĩ', 'Artist profile'),
      actions: h(Fragment, null,
        data.profile.verified ? h(Pill, { tone: 'ok', icon: 'seal-check' }, t('Đã xác minh', 'Verified')) : null,
        h(Button, { icon: 'arrow-square-out', onClick: () => window.open(`/a/${data.profile.slug}`, '_blank', 'noopener') }, t('Xem trang công khai', 'View public page')),
        h(Button, { variant: 'cta', icon: 'floppy-disk', busy, disabled: !dirty, onClick: save }, dirty ? t('Lưu thay đổi', 'Save changes') : t('Đã lưu', 'Saved'))),
    }),
    h('div', { className: 'op-stats op-stats--compact' },
      h(Stat, { label: t('Show sắp tới', 'Upcoming shows'), value: num(data.stats.upcoming) }),
      h(Stat, { label: t('Tổng sự kiện', 'Events'), value: num(data.stats.events) }),
      h(Stat, { label: t('Người theo dõi', 'Followers'), value: num(data.stats.followers) })),
    h('div', { className: 'op-grid op-grid--main' },
      h('div', null,
        h(Card, { title: t('Bạn là ai', 'Who you are'), icon: 'microphone-stage', sub: t('Hiện công khai', 'Public') },
          h('div', { className: 'op-form-grid' },
            h(Field, { label: t('Nghệ danh', 'Stage name'), required: true, error: err.name }, h(Input, { value: f.name, onChange: set('name'), maxLength: 80, invalid: !!err.name })),
            h(Field, { label: t('Thành phố', 'Based in') }, h(Select, { value: f.basedCity, onChange: set('basedCity'), placeholder: '—', options: cityOptions() })),
            h(Field, { label: t('Vai trò', 'Roles'), className: 'is-wide' }, pick(opt(o.roles), f.roles, set('roles'))),
            h(Field, { label: t('Phong cách nhạc', 'Music styles'), className: 'is-wide', hint: t('Cái đầu tiên là phong cách chính · tối đa 6', 'The first is your main style · up to 6') },
              pick(styleOptions(), f.styles, set('styles'), 6)),
            h(Field, { label: t('Giới thiệu (tiếng Việt)', 'About (Vietnamese)'), className: 'is-wide', counter: [f.bioVi.length, 1200] }, h(TextArea, { rows: 4, value: f.bioVi, onChange: set('bioVi'), maxLength: 1200 })),
            h(Field, { label: t('Giới thiệu (tiếng Anh)', 'About (English)'), optional: true, className: 'is-wide' }, h(TextArea, { rows: 3, value: f.bioEn, onChange: set('bioEn'), maxLength: 1200 })),
            h(Field, { label: t('Hoạt động từ năm', 'Active since'), optional: true, error: err.activeSince }, h(Input, { value: f.activeSince, onChange: set('activeSince'), inputMode: 'numeric', placeholder: '2018', maxLength: 4 })),
            h(Field, { label: t('Ngôn ngữ', 'Languages'), optional: true, hint: 'vi, en, th…' }, h(ChipsInput, { value: f.languages, onChange: (v) => set('languages')(v.map((x) => x.toLowerCase().slice(0, 2)).filter((x) => /^[a-z]{2}$/.test(x))), placeholder: 'vi' })),
            h(Field, { label: t('Ảnh đại diện', 'Photo'), optional: true }, h(Uploader, { purpose: 'avatar', value: f.imageUrl || null, onChange: set('imageUrl'), compact: true })),
            h(Field, { label: t('Ảnh bìa', 'Cover'), optional: true }, h(Uploader, { purpose: 'cover', value: f.coverUrl || null, onChange: set('coverUrl'), compact: true })))),
        h(Card, { title: t('Nghe và theo dõi', 'Listen and follow'), icon: 'waveform' },
          h('div', { className: 'op-form-grid' },
            h(Field, { label: 'Website', optional: true, error: err.website }, h(Input, { value: f.website, onChange: set('website'), icon: 'globe', placeholder: 'https://', invalid: !!err.website })),
            ...o.links.map((l) => h(Field, { key: l.key, label: tx(l.label), optional: true, error: err['link:' + l.key] },
              h(Input, { value: f.links[l.key] ?? '', onChange: setLink(l.key), icon: 'link', placeholder: 'https://', invalid: !!err['link:' + l.key] }))))),
      ),
      h('div', null,
        h(Card, { title: t('Booking', 'Bookings'), icon: 'calendar-check' },
          h('div', { className: 'op-form-grid op-form-grid--one' },
            h(Field, { label: t('Tình trạng', 'Status') }, h(Select, { value: f.bookingStatus, onChange: set('bookingStatus'), placeholder: '—', options: opt(o.booking) })),
            h(Field, { label: t('Đi diễn', 'Travels') }, h(Select, { value: f.travelScope, onChange: set('travelScope'), placeholder: '—', options: opt(o.travel) })),
            h(Field, { label: t('Loại show', 'Gig types') }, pick(opt(o.gigs), f.gigTypes, set('gigTypes'))),
            h(Field, { label: t('Độ dài set', 'Set lengths') }, pick(opt(o.setLengths), f.setLengths, set('setLengths'))),
            h(Switch, { checked: f.openToBrands, onChange: set('openToBrands'), label: t('Nhận hợp tác thương hiệu', 'Open to brand collaborations') }))))));
}
