/*
 * Team mode: the artist catalogue. What only the team sets lives here: the verified tick, the
 * other names an artist goes by, and the identity anchors (MusicBrainz, Wikidata, Spotify)
 * that beat a name match when sources are merged. And the gear catalogue: what artists name
 * that it lacks waits here for approval, and an item can carry an affiliate link.
 */
import { h, Fragment, useState, t, tx, get, patch, useFetch, useQueryState, toast, errorText, num } from '../core.js';
import { PageHeader, Button, Pill, Spinner, ErrorBox, Empty, FilterBar, DataTable, Drawer, Field, Input, Switch, Tabs, Combobox } from '../ui.js';

function ArtistDrawer({ artist, onClose, onSaved }) {
  const [f, setF] = useState(() => ({
    verified: artist.verified, aliases: (artist.aliases || []).join(', '),
    musicbrainzId: artist.musicbrainzId || '', wikidataId: artist.wikidataId || '', spotifyId: artist.spotifyId || '',
  }));
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    setBusy(true);
    try {
      await patch(`/admin/artists/${artist.id}`, {
        verified: f.verified,
        aliases: f.aliases.split(',').map((s) => s.trim()).filter(Boolean),
        musicbrainzId: f.musicbrainzId.trim() || null, wikidataId: f.wikidataId.trim() || null, spotifyId: f.spotifyId.trim() || null,
      });
      toast(t('Đã lưu', 'Saved'));
      onSaved();
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  return h(Drawer, {
    open: true, onClose, width: 560, title: artist.name, sub: artist.owner ? artist.owner.email : t('Chưa có người quản lý', 'Not claimed'),
    footer: h(Fragment, null, h(Button, { onClick: onClose }, t('Huỷ', 'Cancel')), h('span', { className: 'op-spacer' }), h(Button, { variant: 'cta', icon: 'check', busy, onClick: save }, t('Lưu', 'Save'))),
  },
  h('div', { className: 'op-form-grid op-form-grid--one' },
    h(Switch, { checked: f.verified, onChange: set('verified'), label: t('Đã xác minh', 'Verified') }),
    h(Field, { label: t('Tên khác', 'Other names'), hint: t('Cách nhau bằng dấu phẩy', 'Separated by commas') }, h(Input, { value: f.aliases, onChange: set('aliases'), placeholder: 'DJ Mie, Mie Mie' })),
    h(Field, { label: 'MusicBrainz ID', optional: true }, h(Input, { value: f.musicbrainzId, onChange: set('musicbrainzId'), placeholder: '00000000-0000-0000-0000-000000000000' })),
    h(Field, { label: 'Wikidata', optional: true }, h(Input, { value: f.wikidataId, onChange: set('wikidataId'), placeholder: 'Q123456' })),
    h(Field, { label: 'Spotify ID', optional: true }, h(Input, { value: f.spotifyId, onChange: set('spotifyId'), placeholder: '22 ký tự / characters' }))));
}

function Gear() {
  const [pending, setPending] = useQueryState('pending', '1');
  const { data, error, loading, reload } = useFetch(`/admin/gear?pending=${pending}`, [pending]);
  const [busy, setBusy] = useState(null);
  const change = async (g, body) => {
    setBusy(g.id);
    try { await patch(`/admin/gear/${g.id}`, body); toast(t('Đã lưu', 'Saved')); reload(true); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(null); }
  };
  const columns = [
    { key: 'name', label: t('Thiết bị', 'Item'), width: 260, render: (g) => h('div', null, h('strong', null, [g.brand, g.name].filter(Boolean).join(' ')),
      h('div', { className: 'op-cell-sub' }, tx(g.categoryLabel), g.suggestedBy ? ` · ${g.suggestedBy}` : '')) },
    { key: 'artists', label: t('Nghệ sĩ', 'Artists'), width: 90, align: 'right', render: (g) => num(g.artists) },
    { key: 'link', label: t('Link affiliate', 'Affiliate link'), width: 240, render: (g) => h(Combobox, { value: g.affiliateLinkId, valueLabel: g.linkCode, placeholder: t('Chọn liên kết…', 'Pick a link…'), icon: 'link',
      load: async () => (await get('/admin/affiliate/links')).items.map((l) => ({ value: l.id, label: l.code, sub: l.label })), onChange: (v) => change(g, { affiliateLinkId: v ?? null }) }) },
    { key: 'act', label: '', width: 150, align: 'right', render: (g) => g.approved
      ? h(Pill, { tone: 'ok', icon: 'check' }, t('Đã duyệt', 'Approved'))
      : h(Button, { size: 'sm', variant: 'ok', icon: 'check', busy: busy === g.id, onClick: () => change(g, { approved: true }) }, t('Duyệt', 'Approve')) },
  ];
  return h(Fragment, null,
    h(Tabs, { value: pending, onChange: setPending, items: [{ value: '1', icon: 'hourglass', label: t('Chờ duyệt', 'Waiting') }, { value: '0', icon: 'list', label: t('Tất cả', 'All') }] }),
    error ? h(ErrorBox, { error, onRetry: reload }) : loading && !data ? h(Spinner)
      : h(DataTable, { columns, rows: data.items, minWidth: 800, empty: h(Empty, { icon: 'headphones', title: t('Không có gì chờ duyệt', 'Nothing waiting') }) }));
}

export function Artists() {
  const [tab, setTab] = useQueryState('tab', 'artists');
  return h(Fragment, null,
    h(PageHeader, { title: t('Nghệ sĩ', 'Artists') }),
    h(Tabs, { value: tab, onChange: setTab, items: [{ value: 'artists', icon: 'microphone-stage', label: t('Nghệ sĩ', 'Artists') }, { value: 'gear', icon: 'headphones', label: t('Thiết bị', 'Gear') }] }),
    tab === 'gear' ? h(Gear) : h(Catalogue));
}

function Catalogue() {
  const [q, setQ] = useQueryState('q', '');
  const { data, error, loading, reload } = useFetch(`/admin/artists?limit=200${q ? `&q=${encodeURIComponent(q)}` : ''}`, [q]);
  const [open, setOpen] = useState(null);
  const columns = [
    { key: 'name', label: t('Nghệ sĩ', 'Artist'), width: 260, render: (a) => h('div', null,
      h('a', { href: `/a/${a.slug}`, target: '_blank', rel: 'noopener' }, a.name), ' ',
      a.verified ? h(Pill, { tone: 'ok', icon: 'seal-check' }, t('Đã xác minh', 'Verified')) : null,
      a.aliases.length ? h('div', { className: 'op-cell-sub' }, a.aliases.join(', ')) : null) },
    { key: 'owner', label: t('Người quản lý', 'Managed by'), width: 220, render: (a) => a.owner ? a.owner.email : h('span', { className: 'op-cell-sub' }, '—') },
    { key: 'anchors', label: t('Định danh', 'Anchors'), width: 200, render: (a) => [a.musicbrainzId && 'MusicBrainz', a.wikidataId && 'Wikidata', a.spotifyId && 'Spotify'].filter(Boolean).join(' · ') || '—' },
    { key: 'events', label: t('Sự kiện', 'Events'), width: 90, align: 'right', render: (a) => num(a.events) },
    { key: 'act', label: '', width: 110, align: 'right', render: (a) => h(Button, { size: 'sm', icon: 'pencil-simple', onClick: () => setOpen(a) }, t('Sửa', 'Edit')) },
  ];
  return h(Fragment, null,
    h(FilterBar, { search: q, onSearch: setQ, placeholder: t('Tìm theo tên…', 'Search by name…') }),
    error ? h(ErrorBox, { error, onRetry: reload }) : loading && !data ? h(Spinner)
      : h(DataTable, { columns, rows: data.items, minWidth: 900, empty: h(Empty, { icon: 'microphone-stage', title: t('Chưa có nghệ sĩ', 'No artists') }) }),
    open ? h(ArtistDrawer, { artist: open, onClose: () => setOpen(null), onSaved: () => { setOpen(null); reload(true); } }) : null);
}
