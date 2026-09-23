/*
 * Team mode: featured shelves on Explore. Each shelf has a name, an on/off switch, an
 * optional date window and an ordered list of live listings picked from a search box.
 */
import { h, Fragment, useState, useEffect, t, tx, cx, get, post, patch, put, useFetch, toast, errorText, day, vnDate } from '../core.js';
import { PageHeader, Button, Icon, Pill, Thumb, Spinner, ErrorBox, Empty, Card, Field, Input, Switch, DateInput, Combobox, Modal } from '../ui.js';
import { loadEvents } from '../opts.js';

const PHASE_TONE = { live: 'ok', always: 'ok', scheduled: 'info', ended: 'neutral', off: 'neutral' };

function Shelf({ shelf, onChange }) {
  const [busy, setBusy] = useState(null);
  const [name, setName] = useState({ vi: shelf.name.vi, en: shelf.name.en });
  const [items, setItems] = useState(shelf.items);
  useEffect(() => { setItems(shelf.items); setName({ vi: shelf.name.vi, en: shelf.name.en }); }, [shelf]);
  const orderDirty = items.map((i) => i.id).join() !== shelf.items.map((i) => i.id).join();
  const nameDirty = name.vi !== shelf.name.vi || name.en !== shelf.name.en;
  const save = async (body, key) => {
    setBusy(key);
    try { const out = await patch(`/admin/shelves/${shelf.id}`, body); onChange(out); toast(t('Đã lưu', 'Saved')); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(null); }
  };
  const saveItems = async () => {
    setBusy('items');
    try { const out = await put(`/admin/shelves/${shelf.id}/items`, { eventIds: items.map((i) => i.id) }); onChange(out); toast(t('Đã lưu danh sách', 'List saved')); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(null); }
  };
  const move = (i, d) => { const next = [...items]; const j = i + d; if (j < 0 || j >= next.length) return; [next[i], next[j]] = [next[j], next[i]]; setItems(next); };
  return h(Card, { className: 'op-shelf' },
    h('div', { className: 'op-shelf-head' },
      h('div', { className: 'op-shelf-names' },
        h(Input, { value: name.vi, onChange: (v) => setName((n) => ({ ...n, vi: v })), placeholder: t('Tên (tiếng Việt)', 'Name (Vietnamese)'), className: 'op-shelf-name' }),
        h(Input, { value: name.en, onChange: (v) => setName((n) => ({ ...n, en: v })), placeholder: t('Tên (tiếng Anh)', 'Name (English)') }),
        nameDirty ? h(Button, { size: 'sm', busy: busy === 'name', onClick: () => save({ name }, 'name') }, t('Lưu tên', 'Save name')) : null),
      h('div', { className: 'op-shelf-state' },
        h(Pill, { tone: PHASE_TONE[shelf.phase] }, tx(shelf.phaseLabel)),
        h(Switch, { checked: shelf.enabled, onChange: (v) => save({ enabled: v }, 'enabled'), label: shelf.enabled ? t('Đang bật', 'On') : t('Đang tắt', 'Off') }))),
    h('div', { className: 'op-shelf-window' },
      h(Field, { label: t('Hiện từ ngày', 'Show from') }, h(DateInput, { value: shelf.startsOn, onChange: (v) => save({ startsOn: v }, 'win') })),
      h(Field, { label: t('Đến hết ngày', 'Until') }, h(DateInput, { value: shelf.endsOn, min: shelf.startsOn ?? undefined, onChange: (v) => save({ endsOn: v }, 'win') })),
      h('div', { className: 'op-quick' }, h('span', { className: 'op-quick-label' }, t('Nhanh:', 'Quick:')),
        h('button', { type: 'button', className: 'op-chip', onClick: () => { const d = vnDate(); save({ startsOn: d, endsOn: new Date(Date.parse(d) + 6 * 864e5).toISOString().slice(0, 10) }, 'win'); } }, t('7 ngày từ hôm nay', '7 days from today')),
        h('button', { type: 'button', className: 'op-chip', onClick: () => save({ startsOn: null, endsOn: null }, 'win') }, t('Không giới hạn', 'No window')))),
    h('div', { className: 'op-shelf-items' },
      items.length ? items.map((e, i) => h('div', { key: e.id, className: 'op-shelf-item' },
        h('span', { className: 'op-shelf-n ff-num' }, i + 1),
        h(Thumb, { src: e.coverUrl ?? e.cover, art: e.art, title: e.title, w: 72 }),
        h('div', { className: 'op-list-text' }, h('strong', null, e.title), h('small', null, [e.dateLabel ? tx(e.dateLabel) : e.startsOn ? day(e.startsOn) : null, e.venue?.name ?? e.venueName].filter(Boolean).join(' · '))),
        h('div', { className: 'op-shelf-item-actions' },
          h(Button, { size: 'sm', variant: 'quiet', icon: 'caret-up', disabled: i === 0, onClick: () => move(i, -1), title: t('Lên', 'Up') }),
          h(Button, { size: 'sm', variant: 'quiet', icon: 'caret-down', disabled: i === items.length - 1, onClick: () => move(i, 1), title: t('Xuống', 'Down') }),
          h(Button, { size: 'sm', variant: 'quiet', icon: 'x', onClick: () => setItems(items.filter((x) => x.id !== e.id)), title: t('Bỏ khỏi dãy', 'Remove') })))) : h('p', { className: 'op-hint' }, t('Dãy chưa có tin nào.', 'No listings on this shelf yet.')),
      h('div', { className: 'op-shelf-add' },
        h('div', { style: { flex: 1 } }, h(Combobox, { value: null, load: (q) => loadEvents(q, { status: 'live', when: 'upcoming' }), placeholder: t('Thêm tin đang đăng vào dãy…', 'Add a live listing…'), icon: 'plus', onChange: (id, o) => id && !items.some((x) => x.id === id) && setItems([...items, { ...o.raw }]) })),
        orderDirty ? h(Button, { variant: 'cta', icon: 'floppy-disk', busy: busy === 'items', onClick: saveItems }, t('Lưu danh sách', 'Save list')) : null)));
}

export function Featured() {
  const { data, error, loading, reload, setData } = useFetch('/admin/shelves');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState({ vi: '', en: '' });
  const create = async () => {
    try { const out = await post('/admin/shelves', { name: { vi: name.vi.trim(), en: name.en.trim() || name.vi.trim() } }); setData((d) => ({ items: [...d.items, out] })); setCreating(false); setName({ vi: '', en: '' }); toast(t('Đã tạo dãy (đang tắt)', 'Shelf created (off)')); } catch (e) { toast(errorText(e), 'error'); }
  };
  if (loading && !data) return h(Spinner);
  if (error) return h(ErrorBox, { error, onRetry: reload });
  return h(Fragment, null,
    h(PageHeader, {
      eyebrow: t('Nền tảng · trang Khám phá', 'Platform · Explore'), title: t('Mục nổi bật', 'Featured shelves'),
      sub: t('Các dãy tin ngay dưới thanh tìm kiếm trên app và web. Chỉ tin đang đăng mới vào được dãy.', 'The rows right under the search bar on app and web. Only live listings can go on a shelf.'),
      actions: h(Button, { variant: 'cta', icon: 'plus', onClick: () => setCreating(true) }, t('Thêm dãy', 'New shelf')),
    }),
    data.items.length ? h('div', { className: 'op-shelves' }, data.items.map((s) => h(Shelf, { key: s.id, shelf: s, onChange: (out) => setData((d) => ({ items: d.items.map((x) => (x.id === out.id ? out : x)) })) }))) : h(Empty, { icon: 'star', title: t('Chưa có dãy nổi bật', 'No shelves yet') }),
    h(Modal, {
      open: creating, onClose: () => setCreating(false), title: t('Thêm dãy nổi bật', 'New featured shelf'),
      footer: h(Fragment, null, h(Button, { onClick: () => setCreating(false) }, t('Huỷ', 'Cancel')), h(Button, { variant: 'cta', disabled: !name.vi.trim(), onClick: create }, t('Tạo', 'Create'))),
    },
    h(Field, { label: t('Tên (tiếng Việt)', 'Name (Vietnamese)'), required: true }, h(Input, { value: name.vi, onChange: (v) => setName((n) => ({ ...n, vi: v })), autoFocus: true, placeholder: t('vd: Lễ hội cuối tuần', 'e.g. Weekend festivals') })),
    h(Field, { label: t('Tên (tiếng Anh)', 'Name (English)'), optional: true }, h(Input, { value: name.en, onChange: (v) => setName((n) => ({ ...n, en: v })) })),
    h('p', { className: 'op-hint' }, t('Dãy mới ở trạng thái tắt — thêm tin rồi bật lên.', 'New shelves start switched off — add listings, then switch on.'))));
}
