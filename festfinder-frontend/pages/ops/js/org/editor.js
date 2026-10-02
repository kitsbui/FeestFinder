/*
 * Organizer mode: create or edit one listing, then submit it for review. What the listing's
 * status means for editing is said at the top, with the moderator's note when it was sent back.
 */
import { h, Fragment, useState, t, tx, get, post, patch, put, del, href, navigate, useFetch, toast, errorText, stamp, emit } from '../core.js';
import { PageHeader, Button, Spinner, ErrorBox, Icon, StatusPill, confirm, TextArea, Field, Menu, Card, Input, Pill, Select, Switch } from '../ui.js';
import { EventForm } from '../event-form.js';

const MISSING = {
  title: ['Tên sự kiện', 'event name'], genre: ['thể loại', 'genre'], dates: ['ngày giờ', 'dates'], venue: ['địa điểm', 'venue'],
  price: ['giá vé và link bán vé', 'ticket price and link'], logo: ['logo', 'logo'], eventUrl: ['trang sự kiện', 'event page'],
};

function StatusBanner({ draft, onAppealed }) {
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  if (!draft) return null;
  const m = draft.moderation;
  const appeal = m?.appeal;
  const appealOpen = appeal && appeal.state === 'open' && new Date(appeal.closesAt) > new Date();
  const send = async () => {
    setBusy(true);
    try { const out = await post(`/organizer/events/${draft.id}/appeal`, { reply }); toast(tx(out.message)); onAppealed(); } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  switch (draft.status) {
    // Draft, in review and live need no banner: the header shows the status, and live
    // sections that re-trigger review carry their own tag.
    case 'rejected':
      return h('div', { className: 'op-banner op-banner--danger op-banner--stack' },
        h('div', { className: 'op-banner-row' }, Icon('arrow-u-up-left', true), h('div', null,
          h('strong', null, t('Bị trả lại', 'Sent back'), m?.reason ? ` · ${tx(m.reason)}` : ''),
          m?.decidedAt ? h('span', null, ` · ${stamp(m.decidedAt)}`) : null)),
        m?.message ? h('blockquote', { className: 'op-quote' }, m.message) : null,
        appealOpen ? h('div', { className: 'op-appeal' },
          h(Field, { label: t('Kháng nghị (một lần, trong 7 ngày)', 'Appeal (once, within 7 days)') },
            h(TextArea, { rows: 3, value: reply, onChange: setReply, placeholder: t('Vì sao tin này đúng…', 'Why the listing is right…') })),
          h(Button, { size: 'sm', busy, disabled: reply.trim().length < 10, onClick: send }, t('Gửi kháng nghị', 'Send appeal'))) : appeal && appeal.state === 'replied' ? h('div', { className: 'op-banner-hint' }, Icon('check'), t(' Đã gửi kháng nghị', ' Appeal sent')) : null);
    case 'removed':
    case 'cancelled':
      return h('div', { className: 'op-banner op-banner--danger' }, Icon('prohibit', true), h('div', null, h('strong', null, draft.status === 'removed' ? t('Đã bị hạ', 'Taken down') : t('Đã huỷ', 'Cancelled')), h('span', null, t(' — không sửa được nữa.', ' — can no longer be edited.'))));
    default:
      return null;
  }
}

/**
 * Milestones the event page shows under its hype count: "500 hype → 200 more early-bird
 * tickets". Reaching one notifies the team, who then deliver what was promised.
 */
function HypeGoals({ eventId }) {
  const { data, reload } = useFetch(`/organizer/events/${eventId}/hype-goals`, [eventId]);
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const list = rows ?? (data ? data.goals.map((g) => ({ threshold: String(g.threshold), vi: g.reward.vi, en: g.reward.en === g.reward.vi ? '' : g.reward.en, reached: g.reached })) : []);
  const edit = (i, k, v) => setRows(list.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const save = async () => {
    setBusy(true);
    try {
      const goals = list.filter((r) => r.threshold && r.vi.trim()).map((r) => ({ threshold: parseInt(r.threshold.replace(/\D/g, ''), 10), reward: { vi: r.vi.trim(), en: r.en.trim() } }));
      const out = await put(`/organizer/events/${eventId}/hype-goals`, { goals });
      toast(tx(out.message));
      setRows(null);
      reload(true);
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  if (!data) return null;
  return h(Card, { title: t('Mốc hype', 'Hype goals'), icon: 'fire', sub: t(`${data.hypeCount.toLocaleString('vi-VN')} hype hiện tại`, `${data.hypeCount.toLocaleString('en-US')} hype now`),
    actions: h(Button, { size: 'sm', variant: 'cta', busy, disabled: rows === null, onClick: save }, t('Lưu', 'Save')) },
  h('div', { className: 'op-goals' },
    list.map((r, i) => h('div', { key: i, className: 'op-goal-row', style: { display: 'grid', gridTemplateColumns: '120px 1fr 1fr auto', gap: 10, alignItems: 'center', marginBottom: 10 } },
      h(Input, { value: r.threshold, onChange: (v) => edit(i, 'threshold', v), inputMode: 'numeric', placeholder: '500', 'aria-label': t('Số hype', 'Hype count') }),
      h(Input, { value: r.vi, onChange: (v) => edit(i, 'vi', v), maxLength: 140, placeholder: t('Mở thêm 200 vé early bird', 'Mở thêm 200 vé early bird'), 'aria-label': t('Phần thưởng (tiếng Việt)', 'Reward (Vietnamese)') }),
      h(Input, { value: r.en, onChange: (v) => edit(i, 'en', v), maxLength: 140, placeholder: '200 more early-bird tickets', 'aria-label': t('Phần thưởng (tiếng Anh)', 'Reward (English)') }),
      r.reached ? h(Pill, { tone: 'ok', icon: 'check' }, t('Đã đạt', 'Reached')) : h(Button, { size: 'sm', variant: 'quiet', icon: 'x', title: t('Xoá mốc', 'Remove'), onClick: () => setRows(list.filter((_, j) => j !== i)) }))),
    list.length < 5 ? h(Button, { size: 'sm', icon: 'plus', onClick: () => setRows([...list, { threshold: '', vi: '', en: '', reached: false }]) }, t('Thêm mốc', 'Add a goal')) : null));
}

const UPDATE_KINDS = [
  { value: 'info', label: () => t('Cập nhật', 'Update') }, { value: 'delay', label: () => t('Đổi giờ', 'Schedule change') },
  { value: 'gate', label: () => t('Cổng vào', 'Entry') }, { value: 'safety', label: () => t('An toàn', 'Safety') }, { value: 'lineup', label: () => t('Đội hình', 'Lineup') },
];

/** What the organiser tells everyone on the night; ticket holders and people going get it as a notification. */
function LiveUpdates({ eventId }) {
  const { data, reload } = useFetch(`/organizer/events/${eventId}/updates`, [eventId]);
  const [kind, setKind] = useState('info');
  const [body, setBody] = useState('');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try {
      const out = await post(`/organizer/events/${eventId}/updates`, { kind, body: body.trim(), notify });
      toast(tx(out.message));
      setBody('');
      reload(true);
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  const remove = async (u) => {
    if (!(await confirm({ title: t('Gỡ bảng tin này?', 'Remove this update?'), body: u.body, confirm: t('Gỡ', 'Remove'), tone: 'danger' }))) return;
    try { const out = await del(`/organizer/events/${eventId}/updates/${u.id}`); toast(tx(out.message)); reload(true); } catch (e) { toast(errorText(e), 'error'); }
  };
  if (!data) return null;
  return h(Card, { title: t('Bảng tin trực tiếp', 'Live updates'), icon: 'broadcast' },
    h('div', { style: { display: 'grid', gridTemplateColumns: '170px 1fr', gap: 10, alignItems: 'start' } },
      h(Select, { value: kind, onChange: setKind, options: UPDATE_KINDS.map((k) => ({ value: k.value, label: k.label() })) }),
      h(TextArea, { rows: 2, value: body, onChange: setBody, maxLength: 500, placeholder: t('Cổng 3 mở sớm từ 15:30…', 'Gate 3 opens early at 15:30…') })),
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0 16px' } },
      h(Switch, { checked: notify, onChange: setNotify, label: t('Gửi thông báo cho người có vé và người sẽ đi', 'Notify ticket holders and people going') }),
      h('span', { className: 'op-spacer' }),
      h(Button, { size: 'sm', variant: 'cta', icon: 'paper-plane-right', busy, disabled: body.trim().length < 2, onClick: send }, t('Đăng', 'Post'))),
    data.items.map((u) => h('div', { key: u.id, style: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderTop: '1px solid var(--ff-line, rgba(255,252,225,.12))' } },
      h(Pill, { tone: u.kind === 'safety' || u.kind === 'delay' ? 'warn' : 'info' }, tx(u.kindLabel)),
      h('div', { style: { flex: 1, minWidth: 0 } }, h('div', { style: { whiteSpace: 'pre-wrap' } }, u.body),
        h('div', { className: 'op-cell-sub' }, stamp(u.createdAt), u.notified ? ' · ' + t('đã gửi thông báo', 'notified') : '')),
      h(Button, { size: 'sm', variant: 'quiet', icon: 'trash', title: t('Gỡ', 'Remove'), onClick: () => remove(u) }))));
}

export function OrgEditor({ rest }) {
  const id = rest[1] && rest[1] !== 'new' ? rest[1] : null;
  const { data, error, loading, reload } = useFetch(id ? `/organizer/events/${id}` : null, [id]);
  if (id && loading && !data) return h(Spinner);
  if (id && error) return h(ErrorBox, { error, onRetry: reload });
  const draft = id ? data : null;
  const canSubmit = !draft || ['draft', 'rejected'].includes(draft.status);
  const readOnly = draft && ['removed', 'cancelled'].includes(draft.status);

  const actions = {
    create: (p) => post('/organizer/events', p),
    update: (eid, p) => patch(`/organizer/events/${eid}`, p),
    tiers: (eid, tiers) => put(`/organizer/events/${eid}/tiers`, { tiers }),
    primary: canSubmit ? {
      label: draft?.status === 'rejected' ? t('Gửi duyệt lại', 'Resubmit for review') : t('Gửi duyệt', 'Submit for review'),
      run: async (eid) => {
        try {
          const out = await post(`/organizer/events/${eid}/submit`);
          toast(tx(out.message));
          emit('counts');
          navigate(href('org', 'events') + '?status=in_review', { force: true });
        } catch (e) {
          const miss = e.details?.missing;
          toast(miss ? t(`Còn thiếu: ${miss.map((k) => MISSING[k]?.[0] ?? k).join(', ')}`, `Still missing: ${miss.map((k) => MISSING[k]?.[1] ?? k).join(', ')}`) : errorText(e), 'error');
        }
      },
    } : null,
  };

  const duplicate = async () => {
    try { const out = await post(`/organizer/events/${id}/duplicate`); toast(tx(out.message)); navigate(href('org', 'events', out.id), { force: true }); } catch (e) { toast(errorText(e), 'error'); }
  };
  const remove = async () => {
    if (!(await confirm({ title: t('Xoá bản nháp này?', 'Delete this draft?'), body: t('Không khôi phục được.', 'This cannot be undone.'), confirm: t('Xoá nháp', 'Delete draft'), tone: 'danger' }))) return;
    try { await del(`/organizer/events/${id}`); toast(t('Đã xoá bản nháp', 'Draft deleted')); navigate(href('org', 'events'), { force: true }); } catch (e) { toast(errorText(e), 'error'); }
  };

  return h(Fragment, null,
    h(PageHeader, {
      back: { href: href('org', 'events'), label: t('Sự kiện của tôi', 'My events'), onClick: (e) => { e.preventDefault(); navigate(href('org', 'events')); } },
      eyebrow: draft ? h(Fragment, null, h(StatusPill, { status: draft.status }), draft.submittedAt ? ` · ${t('gửi', 'submitted')} ${stamp(draft.submittedAt)}` : '') : null,
      title: draft ? draft.title : t('Tạo sự kiện mới', 'New event'),
      actions: draft ? h(Fragment, null,
        draft.slug ? h(Button, { icon: 'eye', href: `/e/${draft.slug}`, target: '_blank', title: t('Xem trước trang sự kiện', 'Preview the event page') }, t('Xem trước', 'Preview')) : null,
        h(Menu, { items: [
          { icon: 'copy', label: t('Nhân bản thành nháp', 'Duplicate as draft'), onClick: duplicate },
          draft.status === 'draft' ? '-' : null,
          draft.status === 'draft' ? { icon: 'trash', label: t('Xoá bản nháp', 'Delete draft'), tone: 'danger', onClick: remove } : null,
        ] })) : null,
    }),
    h(EventForm, {
      key: `${draft?.id ?? 'new'}:${draft?.status ?? ''}`, mode: 'org', draft, actions, readOnly, autosave: draft && ['draft', 'rejected'].includes(draft.status),
      banner: h(StatusBanner, { draft, onAppealed: () => reload(true) }),
      onSaved: (out, { created }) => {
        if (created && out?.id) navigate(href('org', 'events', out.id), { replace: true, force: true });
        else if (out?.status && draft && out.status !== draft.status) reload(true);
      },
    }),
    draft && !readOnly ? h('div', { style: { marginTop: 20 } }, h(HypeGoals, { eventId: draft.id })) : null,
    draft && draft.status === 'live' ? h('div', { style: { marginTop: 20 } }, h(LiveUpdates, { eventId: draft.id })) : null);
}
