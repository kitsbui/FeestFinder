/*
 * Organizer mode: create or edit one listing, then submit it for review. What the listing's
 * status means for editing is said at the top, with the moderator's note when it was sent back.
 */
import { h, Fragment, useState, t, tx, get, post, patch, put, del, href, navigate, useFetch, toast, errorText, stamp, emit } from '../core.js';
import { PageHeader, Button, Spinner, ErrorBox, Icon, StatusPill, confirm, TextArea, Field, Menu } from '../ui.js';
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
    }));
}
