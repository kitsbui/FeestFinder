/*
 * Artist mode: the gear and software they play and produce with. Picked from the catalogue;
 * a name the catalogue lacks waits for the team before it shows on their page.
 */
import { h, Fragment, useState, useEffect, t, tx, get, put, useFetch, toast, errorText } from '../core.js';
import { PageHeader, Button, Card, Field, Input, Select, Combobox, Pill, Spinner, ErrorBox, Empty, DataTable } from '../ui.js';

const USE = [['both', () => t('Phòng thu & biểu diễn', 'Studio and live')], ['studio', () => t('Phòng thu', 'Studio')], ['live', () => t('Biểu diễn', 'Live')]];

export function ArtistGear() {
  const { data, error, loading, reload } = useFetch('/me/artist/gear');
  const cats = useFetch('/gear?limit=1');
  const [items, setItems] = useState(null);
  const [fresh, setFresh] = useState({ name: '', brand: '', category: 'other' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setItems(data.items.map((g) => ({ gearId: g.id, name: [g.brand, g.name].filter(Boolean).join(' '), approved: g.approved, usedFor: g.usedFor }))); }, [data]);
  if (error) return h(ErrorBox, { error, onRetry: reload });
  if (loading && !data || !items) return h(Spinner);
  const save = async (next) => {
    setBusy(true);
    try {
      const out = await put('/me/artist/gear', { items: next.map((x) => (x.gearId ? { gearId: x.gearId, usedFor: x.usedFor } : { name: x.name, brand: x.brand, category: x.category, usedFor: x.usedFor })) });
      toast(tx(out.message));
      reload(true);
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  const columns = [
    { key: 'name', label: t('Thiết bị', 'Item'), width: 280, render: (x) => h('div', null, h('strong', null, x.name), ' ', x.approved ? null : h(Pill, { tone: 'warn', icon: 'hourglass' }, t('Chờ duyệt', 'Waiting'))) },
    { key: 'use', label: t('Dùng cho', 'Used for'), width: 220, render: (x) => h(Select, { value: x.usedFor, onChange: (v) => save(items.map((y) => (y === x ? { ...y, usedFor: v || 'both' } : y))), options: USE.map(([k, l]) => ({ value: k, label: l() })) }) },
    { key: 'act', label: '', width: 100, align: 'right', render: (x) => h(Button, { size: 'sm', variant: 'danger', icon: 'trash', onClick: () => save(items.filter((y) => y !== x)) }, t('Bỏ', 'Remove')) },
  ];
  return h(Fragment, null,
    h(PageHeader, { title: t('Thiết bị & phần mềm', 'Gear & software') }),
    h(Card, { title: t('Thêm từ danh mục', 'Add from the catalogue'), icon: 'plus' },
      h(Combobox, { value: null, placeholder: t('Tìm: Ableton, CDJ-3000…', 'Search: Ableton, CDJ-3000…'), icon: 'magnifying-glass',
        load: async (q) => (await get('/gear' + (q ? `?q=${encodeURIComponent(q)}` : ''))).items.map((g) => ({ value: g.id, label: [g.brand, g.name].filter(Boolean).join(' '), sub: tx(g.categoryLabel) })),
        onChange: (id) => id && !items.some((x) => x.gearId === id) && save([...items, { gearId: id, usedFor: 'both' }]) })),
    h(Card, { title: t('Không có trong danh mục', 'Not in the catalogue'), icon: 'sparkle' },
      h('div', { className: 'op-form-grid' },
        h(Field, { label: t('Tên', 'Name'), required: true }, h(Input, { value: fresh.name, onChange: (v) => setFresh((f) => ({ ...f, name: v })) })),
        h(Field, { label: t('Hãng', 'Brand'), optional: true }, h(Input, { value: fresh.brand, onChange: (v) => setFresh((f) => ({ ...f, brand: v })) })),
        h(Field, { label: t('Loại', 'Category') }, h(Select, { value: fresh.category, onChange: (v) => setFresh((f) => ({ ...f, category: v || 'other' })),
          options: (cats.data?.categories ?? []).map((c) => ({ value: c.key, label: tx(c.label) })) }))),
      h('div', { className: 'op-row-actions', style: { marginTop: 12 } }, h(Button, { icon: 'plus', busy, disabled: fresh.name.trim().length < 2,
        onClick: () => { save([...items, { ...fresh, usedFor: 'both' }]); setFresh({ name: '', brand: '', category: 'other' }); } }, t('Thêm', 'Add')))),
    h(DataTable, { columns, rows: items, rowKey: (x) => x.gearId ?? x.name, minWidth: 600, empty: h(Empty, { icon: 'headphones', title: t('Chưa có thiết bị nào', 'Nothing listed yet') }) }));
}
