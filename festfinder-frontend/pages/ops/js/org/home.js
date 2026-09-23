/*
 * Organizer mode, first screen: where each listing stands, what needs the organiser now
 * (sent back, missing details, unread messages) and what is coming up.
 */
import { h, Fragment, useMemo, t, tx, href, navigate, useFetch, store, currentOrg, day, ago, num, vnDate } from '../core.js';
import { PageHeader, Button, Stat, Card, Icon, Pill, Thumb, Spinner, ErrorBox, Empty, StatusPill, DateBox } from '../ui.js';

const MISSING = { title: ['tên', 'name'], genre: ['thể loại', 'genre'], dates: ['ngày giờ', 'dates'], venue: ['địa điểm', 'venue'], price: ['giá & link vé', 'price & link'], logo: ['logo', 'logo'], eventUrl: ['trang sự kiện', 'event page'] };

export function OrgHome() {
  const events = useFetch('/organizer/events', [store.orgId]);
  const inbox = useFetch('/organizer/inbox', [store.orgId]);
  const profile = useFetch('/organizer/profile', [store.orgId]);
  const dash = useFetch('/organizer/dashboard?range=30d', [store.orgId]);
  const today = vnDate();
  const items = events.data?.items ?? [];
  const by = useMemo(() => {
    const c = { draft: [], in_review: [], live: [], rejected: [] };
    for (const e of items) if (c[e.status] && !(e.status === 'live' && (e.endsOn || e.startsOn) < today)) c[e.status].push(e);
    return c;
  }, [items]);
  const todo = [
    ...by.rejected.map((e) => ({ key: 'r' + e.id, tone: 'danger', icon: 'arrow-u-up-left', title: e.title, text: e.lastDecision?.reason ? t(`Bị trả lại · ${tx(e.lastDecision.reason)}`, `Sent back · ${tx(e.lastDecision.reason)}`) : t('Bị trả lại', 'Sent back'), cta: t('Sửa & gửi lại', 'Fix & resubmit'), go: href('org', 'events', e.id) })),
    ...by.draft.map((e) => ({ key: 'd' + e.id, tone: e.missing?.length ? 'warn' : 'ok', icon: e.missing?.length ? 'pencil-simple' : 'paper-plane-right', title: e.title, text: e.missing?.length ? t(`Nháp · còn thiếu ${e.missing.map((k) => MISSING[k][0]).join(', ')}`, `Draft · missing ${e.missing.map((k) => MISSING[k][1]).join(', ')}`) : t('Nháp · đã đủ thông tin, có thể gửi duyệt', 'Draft · complete, ready to submit'), cta: e.missing?.length ? t('Hoàn thiện', 'Finish') : t('Gửi duyệt', 'Submit'), go: href('org', 'events', e.id) })),
    ...(inbox.data?.items ?? []).filter((m) => m.unread).map((m) => ({ key: 'm' + m.id, tone: 'info', icon: 'chat-circle-text', title: tx(m.subject), text: `${tx(m.who)} · ${ago(m.updatedAt)}`, cta: t('Đọc', 'Read'), go: href('org', 'inbox', m.id) })),
  ];
  const upcoming = by.live.filter((e) => e.startsOn).sort((a, b) => a.startsOn.localeCompare(b.startsOn)).slice(0, 5);
  const org = currentOrg();
  const p = profile.data;
  const kpi = (key) => dash.data?.kpis?.find((k) => k.key === key);
  const go = (to) => (e) => { e?.preventDefault?.(); navigate(to); };

  if (events.loading && !events.data) return h(Spinner);
  if (events.error) return h(ErrorBox, { error: events.error, onRetry: events.reload });
  return h(Fragment, null,
    h(PageHeader, {
      eyebrow: h(Fragment, null, org?.name ?? '', p ? (p.verified ? h(Pill, { tone: 'ok', icon: 'seal-check', className: 'op-ml' }, t('Đã xác minh', 'Verified')) : h(Pill, { tone: 'warn', icon: 'seal-warning', className: 'op-ml' }, t('Chờ xác minh', 'Pending verification'))) : null),
      title: t(`Xin chào${store.session?.user?.name ? ', ' + store.session.user.name.split(' ').slice(-1)[0] : ''}`, `Hello${store.session?.user?.name ? ', ' + store.session.user.name.split(' ')[0] : ''}`),
      sub: todo.length ? t(`Có ${todo.length} việc cần bạn xử lý.`, `${todo.length} thing${todo.length > 1 ? 's' : ''} need you.`) : t('Mọi thứ đều ổn. Tạo sự kiện tiếp theo khi bạn sẵn sàng.', 'All clear. Create the next event when you are ready.'),
      actions: h(Button, { variant: 'cta', icon: 'plus', onClick: go(href('org', 'events', 'new')) }, t('Tạo sự kiện mới', 'New event')),
    }),
    h('div', { className: 'op-stats' },
      h(Stat, { label: t('Bản nháp', 'Drafts'), icon: 'pencil-simple', value: by.draft.length, note: t('Chỉ bạn thấy', 'Only you see these'), href: href('org', 'events') + '?status=draft', onClick: go(href('org', 'events') + '?status=draft') }),
      h(Stat, { label: t('Chờ duyệt', 'In review'), icon: 'hourglass-medium', value: by.in_review.length, tone: by.in_review.length ? 'warn' : null, note: tx(kpi('inReview')?.delta) || t('Thường xong trong 2 giờ', 'Usually within 2 hours'), href: href('org', 'events') + '?status=in_review', onClick: go(href('org', 'events') + '?status=in_review') }),
      h(Stat, { label: t('Đang đăng', 'Live'), icon: 'broadcast', value: by.live.length, tone: 'ok', note: t('Sắp diễn ra', 'Coming up'), href: href('org', 'events') + '?status=live', onClick: go(href('org', 'events') + '?status=live') }),
      h(Stat, { label: t('Bị trả lại', 'Sent back'), icon: 'arrow-u-up-left', value: by.rejected.length, tone: by.rejected.length ? 'danger' : null, note: by.rejected.length ? t('Cần sửa', 'Need fixing') : t('Không có', 'None'), href: href('org', 'events') + '?status=rejected', onClick: go(href('org', 'events') + '?status=rejected') }),
      kpi('views') ? h(Stat, { label: t('Lượt xem · 30 ngày', 'Views · 30 days'), icon: 'eye', value: num(kpi('views').value), note: tx(kpi('saves')?.delta) }) : null),
    h('div', { className: 'op-grid op-grid--main' },
      h('div', null,
        h(Card, { title: t('Cần bạn xử lý', 'Needs you'), icon: 'list-checks', pad: false },
          todo.length ? h('ul', { className: 'op-todo' }, todo.map((x) => h('li', { key: x.key },
            h('a', { href: x.go, onClick: go(x.go), className: 'op-todo-row' },
              h('span', { className: `op-todo-ic is-${x.tone}` }, Icon(x.icon, true)),
              h('span', { className: 'op-todo-text' }, h('strong', null, x.title), h('small', null, x.text)),
              h('span', { className: 'op-todo-cta' }, x.cta, Icon('caret-right'))))))
            : h(Empty, { icon: 'check-circle', title: t('Không có việc tồn đọng', 'Nothing waiting'), body: t('Tin bị trả lại, bản nháp dở dang và tin nhắn mới sẽ hiện ở đây.', 'Sent-back listings, unfinished drafts and new messages show up here.') })),
        h(Card, { title: t('Sắp diễn ra', 'Coming up'), icon: 'calendar-dots', pad: false, actions: h('a', { className: 'op-link', href: href('org', 'events'), onClick: go(href('org', 'events')) }, t('Tất cả', 'All'), Icon('caret-right')) },
          upcoming.length ? h('ul', { className: 'op-list' }, upcoming.map((e) => h('li', { key: e.id },
            h('a', { className: 'op-list-row', href: href('org', 'events', e.id), onClick: go(href('org', 'events', e.id)) },
              h(DateBox, { iso: e.startsOn }), h(Thumb, { src: e.coverUrl, art: e.art, title: e.title, w: 72 }),
              h('span', { className: 'op-list-text' }, h('strong', null, e.title), h('small', null, [e.venueName, e.startTime && `${e.startTime}–${e.endTime}`].filter(Boolean).join(' · '))),
              h('span', { className: 'op-list-meta ff-num' }, e.views != null ? t(`${num(e.views)} xem · ${num(e.saves)} lưu`, `${num(e.views)} views · ${num(e.saves)} saves`) : null)))))
            : h(Empty, { icon: 'calendar-blank', title: t('Chưa có sự kiện sắp tới', 'Nothing coming up') }))),
      h('div', null,
        p && !p.verified ? h(Card, { title: t('Xác minh tài khoản', 'Get verified'), icon: 'seal-warning' },
          h('p', { className: 'op-card-text' }, t('Nhà tổ chức đã xác minh có huy hiệu trên mọi thẻ sự kiện, được ưu tiên trong tìm kiếm và duyệt nhanh hơn.', 'Verified organizers carry a badge on every card, rank higher in search and clear review faster.')),
          h('ul', { className: 'op-mini-checks' },
            h('li', { className: p.legalName ? 'is-ok' : '' }, Icon(p.legalName ? 'check-circle' : 'circle', !!p.legalName), t('Tên pháp nhân', 'Registered name')),
            h('li', { className: p.taxCode ? 'is-ok' : '' }, Icon(p.taxCode ? 'check-circle' : 'circle', !!p.taxCode), t('Mã số thuế', 'Tax code')),
            h('li', { className: p.bank ? 'is-ok' : '' }, Icon(p.bank ? 'check-circle' : 'circle', !!p.bank), t('Tài khoản nhận tiền', 'Payout account'))),
          h(Button, { size: 'sm', icon: 'identification-card', onClick: go(href('org', 'profile')) }, t('Bổ sung hồ sơ', 'Complete the profile'))) : null,
        dash.data?.todo?.length ? h(Card, { title: t('Gợi ý tăng hiệu quả', 'Suggestions'), icon: 'lightbulb' },
          h('ul', { className: 'op-tips' }, dash.data.todo.slice(0, 4).map((x, i) => h('li', { key: i }, x.eventId ? h('a', { href: href('org', 'events', x.eventId), onClick: go(href('org', 'events', x.eventId)) }, tx(x.text)) : tx(x.text))))) : null,
        h(Card, { title: t('Để được duyệt nhanh', 'To clear review fast'), icon: 'lightning' },
          h('ul', { className: 'op-tips' },
            h('li', null, t('Chọn địa điểm từ danh sách để có ghim bản đồ.', 'Pick the venue from the list so it has a map pin.')),
            h('li', null, t('Mở thử link bán vé trước khi gửi — link lỗi là lý do trả lại phổ biến thứ hai.', 'Open the ticket link once before submitting — broken links are the second most common send-back.')),
            h('li', null, t('Dùng ảnh gốc 1600×900 của chính sự kiện.', 'Use an original 1600×900 image of this event.')),
            h('li', null, t('Mô tả từ 80 ký tự: ai biểu diễn, mấy giờ mở cửa, cần mang gì.', 'Write 80+ characters: who plays, when doors open, what to bring.')))))));
}
