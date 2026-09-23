/*
 * Organizer mode: create or edit one listing, then submit it for review. What the listing's
 * status means for editing is said at the top, with the moderator's note when it was sent back.
 */
import { h, Fragment, useState, t, tx, get, post, patch, put, del, href, navigate, useFetch, toast, errorText, stamp, ago, emit } from '../core.js';
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
    case 'draft':
      return h('div', { className: 'op-banner' }, Icon('pencil-simple', true), h('div', null, h('strong', null, t('Bản nháp', 'Draft')), h('span', null, t(' — tự lưu khi bạn gõ. Chỉ bạn thấy cho tới khi gửi duyệt.', ' — saves as you type. Only you can see it until you submit.'))));
    case 'in_review':
      return h('div', { className: 'op-banner op-banner--warn' }, Icon('hourglass-medium', true), h('div', null, h('strong', null, t('Đang chờ duyệt', 'In review')), h('span', null, t(` · gửi ${ago(draft.submittedAt)}. Thường có kết quả trong 2 giờ làm việc. Bạn vẫn sửa được — kiểm duyệt viên sẽ xem bản mới nhất.`, ` · submitted ${ago(draft.submittedAt)}. Usually decided within two working hours. You can still edit — the moderator sees the latest version.`))));
    case 'live':
      return h('div', { className: 'op-banner op-banner--ok' }, Icon('broadcast', true), h('div', null, h('strong', null, t('Đang đăng', 'Live')), h('span', null, t(' — sửa mô tả, nghệ sĩ, logo, link thì cập nhật ngay; sửa ngày, giờ, địa điểm, giá hoặc ảnh bìa sẽ đưa tin về hàng chờ duyệt.', ' — description, lineup, logo and links update at once; changing the dates, venue, price or cover sends it back to review.'))),
        h(Button, { size: 'sm', icon: 'arrow-square-out', href: `/e/${draft.slug}`, target: '_blank' }, t('Xem trên web', 'View on the web')));
    case 'rejected':
      return h('div', { className: 'op-banner op-banner--danger op-banner--stack' },
        h('div', { className: 'op-banner-row' }, Icon('arrow-u-up-left', true), h('div', null,
          h('strong', null, t('Bị trả lại', 'Sent back'), m?.reason ? ` · ${tx(m.reason)}` : ''),
          m?.decidedAt ? h('span', null, ` · ${stamp(m.decidedAt)}`) : null)),
        m?.message ? h('blockquote', { className: 'op-quote' }, m.message) : null,
        h('div', { className: 'op-banner-hint' }, t('Sửa theo góp ý ở trên rồi bấm "Gửi duyệt lại". Có thắc mắc thì trả lời trong Hộp thư kiểm duyệt.', 'Fix what is asked above, then press "Resubmit". Questions go in the moderation inbox.')),
        appealOpen ? h('div', { className: 'op-appeal' },
          h(Field, { label: t('Không đồng ý? Gửi phản hồi (một lần, trong 7 ngày)', 'Disagree? Reply once within 7 days'), hint: t('Giải thích vì sao tin đúng; kiểm duyệt viên xem trong một ngày.', 'Explain why the listing is right; a moderator looks within a day.') },
            h(TextArea, { rows: 3, value: reply, onChange: setReply, placeholder: t('vd: Địa điểm là kho số 12 cạnh cầu Kênh Tẻ, đã có giấy phép…', 'e.g. The venue is warehouse 12 next to Kênh Tẻ bridge, permit attached…') })),
          h(Button, { size: 'sm', busy, disabled: reply.trim().length < 10, onClick: send }, t('Gửi phản hồi', 'Send reply'))) : appeal && appeal.state === 'replied' ? h('div', { className: 'op-banner-hint' }, Icon('check'), t(' Đã gửi phản hồi — đang chờ kiểm duyệt xem lại.', ' Reply sent — waiting for a moderator.')) : null);
    case 'removed':
    case 'cancelled':
      return h('div', { className: 'op-banner op-banner--danger' }, Icon('prohibit', true), h('div', null, h('strong', null, draft.status === 'removed' ? t('Đã bị hạ', 'Taken down') : t('Đã huỷ', 'Cancelled')), h('span', null, t(' — tin không còn sửa được. Liên hệ FeestFinder qua Hộp thư nếu cần.', ' — this listing can no longer be edited. Write to FeestFinder in the inbox if needed.'))));
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
    if (!(await confirm({ title: t('Xoá bản nháp này?', 'Delete this draft?'), body: t('Bản nháp sẽ bị xoá hẳn và không khôi phục được.', 'The draft is deleted for good.'), confirm: t('Xoá nháp', 'Delete draft'), tone: 'danger' }))) return;
    try { await del(`/organizer/events/${id}`); toast(t('Đã xoá bản nháp', 'Draft deleted')); navigate(href('org', 'events'), { force: true }); } catch (e) { toast(errorText(e), 'error'); }
  };

  return h(Fragment, null,
    h(PageHeader, {
      back: { href: href('org', 'events'), label: t('Sự kiện của tôi', 'My events'), onClick: (e) => { e.preventDefault(); navigate(href('org', 'events')); } },
      eyebrow: draft ? h(Fragment, null, h(StatusPill, { status: draft.status }), draft.submittedAt ? ` · ${t('gửi', 'submitted')} ${stamp(draft.submittedAt)}` : '') : t('Đăng sự kiện · khoảng 4 phút', 'List an event · about 4 minutes'),
      title: draft ? draft.title : t('Tạo sự kiện mới', 'New event'),
      sub: draft ? null : t('Điền 6 mục bên dưới. Bản nháp tự lưu sau lần lưu đầu; khi đủ mục bắt buộc, bấm "Gửi duyệt".', 'Fill in the six sections below. After the first save the draft saves itself; when the required items are in, press "Submit for review".'),
      actions: draft ? h(Fragment, null,
        draft.slug ? h(Button, { icon: 'eye', href: `/e/${draft.slug}`, target: '_blank', title: t('Xem trước trang sự kiện', 'Preview the event page') }, t('Xem trước', 'Preview')) : null,
        h(Menu, { items: [
          { icon: 'copy', label: t('Nhân bản thành bản nháp mới', 'Duplicate as a new draft'), hint: t('Cho lần tổ chức tiếp theo', 'For the next edition'), onClick: duplicate },
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
