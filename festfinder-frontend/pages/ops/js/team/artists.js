/*
 * Team mode: the artist catalogue. What only the team sets lives here: the verified tick, the
 * other names an artist goes by, and the identity anchors (MusicBrainz, Wikidata, Spotify)
 * that beat a name match when sources are merged.
 */
import { h, Fragment, useState, t, patch, useFetch, useQueryState, toast, errorText, num } from '../core.js';
import { PageHeader, Button, Pill, Spinner, ErrorBox, Empty, FilterBar, DataTable, Drawer, Field, Input, Switch } from '../ui.js';

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

export function Artists() {
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
    h(PageHeader, { title: t('Nghệ sĩ', 'Artists') }),
    h(FilterBar, { search: q, onSearch: setQ, placeholder: t('Tìm theo tên…', 'Search by name…') }),
    error ? h(ErrorBox, { error, onRetry: reload }) : loading && !data ? h(Spinner)
      : h(DataTable, { columns, rows: data.items, minWidth: 900, empty: h(Empty, { icon: 'microphone-stage', title: t('Chưa có nghệ sĩ', 'No artists') }) }),
    open ? h(ArtistDrawer, { artist: open, onClose: () => setOpen(null), onSaved: () => { setOpen(null); reload(true); } }) : null);
}
