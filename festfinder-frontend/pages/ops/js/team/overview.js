/*
 * Team mode, first screen: what needs a person now (queue and SLA, reports, appeals,
 * verification, venues without a pin), today's numbers and the latest activity.
 */
import { h, Fragment, t, tx, href, navigate, useFetch, duration, money, num, day, ago, store } from '../core.js';
import { PageHeader, Button, Stat, Card, Icon, Pill, Thumb, Spinner, ErrorBox, Empty, DateBox, Meter } from '../ui.js';

const ACTION_TEXT = {
  'listing.submitted': ['gửi duyệt', 'submitted'], 'listing.approved': ['đã duyệt', 'approved'], 'listing.approved_bulk': ['đã duyệt (lô)', 'approved (bulk)'],
  'listing.rejected': ['trả lại', 'sent back'], 'listing.taken_down': ['hạ tin', 'took down'], 'listing.published_by_team': ['đăng trực tiếp', 'published'],
  'listing.edited_by_team': ['sửa tin', 'edited'], 'listing.created_by_team': ['tạo tin', 'created'], 'organizer.verified': ['xác minh', 'verified'],
  'organizer.created': ['tạo nhà tổ chức', 'onboarded'], 'venue.created': ['thêm địa điểm', 'added venue'], 'venue.updated': ['sửa địa điểm', 'edited venue'],
  'order.refunded': ['hoàn tiền', 'refunded'], 'report.dismissed': ['bỏ qua báo cáo', 'dismissed report'], 'organizer.warned': ['cảnh cáo', 'warned'],
};
export const actionText = (a) => { const x = ACTION_TEXT[a]; return x ? t(x[0], x[1]) : a.replace(/[._]/g, ' '); };

export function Overview() {
  const { data, error, loading, reload } = useFetch('/admin/overview');
  const go = (to) => (e) => { e?.preventDefault?.(); navigate(to); };
  if (loading && !data) return h(Spinner);
  if (error) return h(ErrorBox, { error, onRetry: reload });
  const d = data;
  const q = d.queue;
  const todo = [
    q.breach ? { tone: 'danger', icon: 'alarm', title: t(`${q.breach} tin quá hạn duyệt ${d.queue.slaMinutes / 60} giờ`, `${q.breach} listing${q.breach > 1 ? 's' : ''} past the ${d.queue.slaMinutes / 60}-hour SLA`), text: t(`Cũ nhất đã chờ ${duration(q.oldestMinutes)}`, `The oldest has waited ${duration(q.oldestMinutes)}`), to: href('review') + '?sla=breach', cta: t('Duyệt ngay', 'Review now') } : null,
    q.soon ? { tone: 'warn', icon: 'hourglass-medium', title: t(`${q.soon} tin sắp quá hạn`, `${q.soon} listing${q.soon > 1 ? 's' : ''} due soon`), text: t('Còn dưới 2 giờ trước hạn SLA', 'Under two hours left on the SLA'), to: href('review') + '?sla=soon', cta: t('Mở hàng chờ', 'Open queue') } : null,
    d.reports ? { tone: 'danger', icon: 'flag', title: t(`${d.reports} tin bị người dùng báo cáo`, `${d.reports} listing${d.reports > 1 ? 's' : ''} reported by users`), text: t('Hoàn tiền, sai thông tin, giá, an toàn', 'Refunds, wrong details, price, safety'), to: href('reports'), cta: t('Xử lý', 'Handle') } : null,
    d.appeals ? { tone: 'warn', icon: 'gavel', title: t(`${d.appeals} kháng nghị đang mở`, `${d.appeals} open appeal${d.appeals > 1 ? 's' : ''}`), text: t('Nhà tổ chức phản hồi quyết định trả lại', 'Organizers answering a send-back'), to: href('reports') + '?tab=appeals', cta: t('Xem', 'Review') } : null,
    d.unresolvedVenues ? { tone: 'info', icon: 'map-pin', title: t(`${d.unresolvedVenues} tin chưa có ghim bản đồ`, `${d.unresolvedVenues} listing${d.unresolvedVenues > 1 ? 's' : ''} without a map pin`), text: t('Tạo hoặc gán địa điểm để tin hiện trên Map', 'Create or link a venue so they show on the map'), to: href('venues') + '?tab=unresolved', cta: t('Gán địa điểm', 'Link venues') } : null,
    d.verification ? { tone: 'info', icon: 'seal-warning', title: t(`${d.verification} nhà tổ chức chờ xác minh`, `${d.verification} organizer${d.verification > 1 ? 's' : ''} awaiting verification`), text: t('Kiểm tra giấy tờ, mã số thuế và tài khoản ngân hàng', 'Check ID, tax code and bank account'), to: href('organizers') + '?state=pending', cta: t('Xác minh', 'Verify') } : null,
  ].filter(Boolean);

  return h(Fragment, null,
    h(PageHeader, {
      eyebrow: t('Vận hành · hôm nay', 'Operations · today'),
      title: t(`Chào ${store.session?.user?.name?.split(' ').slice(-1)[0] ?? 'bạn'}, đây là việc hôm nay`, `Hi ${store.session?.user?.name?.split(' ')[0] ?? 'there'}, here is today`),
      sub: todo.length ? t(`${todo.length} nhóm việc cần người xử lý. Hạn duyệt tin là ${q.slaMinutes / 60} giờ làm việc.`, `${todo.length} groups of work need a person. Listings are due within ${q.slaMinutes / 60} working hours.`) : t('Không có việc tồn đọng. Hàng chờ sạch.', 'Nothing is waiting. The queue is clear.'),
      actions: h(Fragment, null,
        h(Button, { icon: 'plus', onClick: go(href('events', 'new')) }, t('Tạo sự kiện', 'New listing')),
        h(Button, { variant: 'cta', icon: 'stack', onClick: go(href('review')) }, q.total ? t(`Duyệt ${q.total} tin`, `Review ${q.total}`) : t('Hàng chờ duyệt', 'Review queue'))),
    }),
    h('div', { className: 'op-stats' },
      h(Stat, { label: t('Chờ duyệt', 'In queue'), icon: 'stack', value: q.total, tone: q.breach ? 'danger' : q.total ? 'warn' : 'ok', note: q.total ? t(`Cũ nhất ${duration(q.oldestMinutes)} · ${q.flagged} bị gắn cờ`, `Oldest ${duration(q.oldestMinutes)} · ${q.flagged} flagged`) : t('Hàng chờ sạch', 'Queue is clear'), onClick: go(href('review')) }),
      h(Stat, { label: t('Quyết định hôm nay', 'Decided today'), icon: 'check-circle', value: d.today.approved + d.today.rejected, note: t(`${d.today.approved} duyệt · ${d.today.rejected} trả lại`, `${d.today.approved} approved · ${d.today.rejected} sent back`) }),
      h(Stat, { label: t('Đang đăng', 'Live listings'), icon: 'broadcast', value: num(d.catalog.live), tone: 'ok', note: t(`${d.catalog.next7Days} diễn ra trong 7 ngày`, `${d.catalog.next7Days} in the next 7 days`), onClick: go(href('events') + '?status=live&when=upcoming') }),
      h(Stat, { label: t('Đơn hàng hôm nay', 'Orders today'), icon: 'receipt', value: num(d.today.orders), note: money(d.today.gross), onClick: go(href('orders')) }),
      h(Stat, { label: t('Tăng trưởng', 'Growth'), icon: 'chart-line-up', value: `+${num(d.growth.newUsers7Days)}`, note: t(`người dùng mới 7 ngày · ${d.growth.newOrganizers30Days} NTC mới 30 ngày`, `new users in 7 days · ${d.growth.newOrganizers30Days} new organizers in 30`), onClick: go(href('users') + '?sort=new') })),
    h('div', { className: 'op-grid op-grid--main' },
      h('div', null,
        h(Card, { title: t('Việc cần làm', 'To do'), icon: 'list-checks', pad: false },
          todo.length ? h('ul', { className: 'op-todo' }, todo.map((x, i) => h('li', { key: i },
            h('a', { className: 'op-todo-row', href: x.to, onClick: go(x.to) },
              h('span', { className: `op-todo-ic is-${x.tone}` }, Icon(x.icon, true)),
              h('span', { className: 'op-todo-text' }, h('strong', null, x.title), h('small', null, x.text)),
              h('span', { className: 'op-todo-cta' }, x.cta, Icon('caret-right'))))))
            : h(Empty, { icon: 'check-circle', title: t('Không có việc tồn đọng', 'All caught up'), body: t('Tin chờ duyệt, báo cáo và kháng nghị mới sẽ hiện ở đây.', 'New listings, reports and appeals show up here.') })),
        h(Card, { title: t('Sắp diễn ra', 'Coming up'), icon: 'calendar-dots', pad: false, actions: h('a', { className: 'op-link', href: href('events') + '?when=week&status=live', onClick: go(href('events') + '?when=week&status=live') }, t('7 ngày tới', 'Next 7 days'), Icon('caret-right')) },
          d.upcoming.length ? h('ul', { className: 'op-list' }, d.upcoming.map((e) => h('li', { key: e.id },
            h('a', { className: 'op-list-row', href: href('events', e.id), onClick: go(href('events', e.id)) },
              h(DateBox, { iso: e.startsOn, sub: e.startTime }), h(Thumb, { src: e.coverUrl, art: e.art, title: e.title, w: 72 }),
              h('span', { className: 'op-list-text' }, h('strong', null, e.title), h('small', null, [e.organizer, e.venueName].filter(Boolean).join(' · '))),
              e.capacity ? h('span', { className: 'op-list-meta' }, h(Meter, { value: e.sold, max: e.capacity, tone: e.sold / e.capacity > 0.85 ? 'warn' : 'ok' }), ' ', t(`${num(e.sold)}/${num(e.capacity)} vé`, `${num(e.sold)}/${num(e.capacity)} sold`)) : null))))
            : h(Empty, { icon: 'calendar-blank', title: t('Không có sự kiện sắp tới', 'Nothing coming up') }))),
      h('div', null,
        h(Card, { title: t('Hoạt động gần đây', 'Recent activity'), icon: 'scroll', actions: h('a', { className: 'op-link', href: href('audit'), onClick: go(href('audit')) }, t('Nhật ký', 'Audit log'), Icon('caret-right')) },
          h('ul', { className: 'op-feed' }, d.activity.map((a) => h('li', { key: a.seq },
            h('span', { className: `op-feed-dot is-${a.actorType}` }),
            h('div', null,
              h('div', { className: 'op-feed-line' }, h('strong', null, a.actorType === 'system' ? t('Hệ thống', 'System') : a.actor), ' · ', a.label ? tx(a.label) : actionText(a.action), ' · ', h('span', { className: 'op-feed-target' }, a.target.label)),
              h('div', { className: 'op-feed-time' }, ago(a.at))))))),
        d.adInquiries ? h(Card, { title: t('Quảng cáo', 'Advertising'), icon: 'megaphone' },
          h('p', { className: 'op-card-text' }, t(`${d.adInquiries} yêu cầu quảng cáo mới đang chờ trong console kiểm duyệt.`, `${d.adInquiries} new ad enquiries are waiting in the moderation console.`)),
          h(Button, { size: 'sm', icon: 'arrow-square-out', href: '/console/ads', target: '_blank' }, t('Mở Quảng cáo & đối tác', 'Open Ads & partners'))) : null)));
}
