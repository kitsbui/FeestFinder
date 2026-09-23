/*
 * Organizer mode: the conversation with FeestFinder — moderation notes about a listing,
 * partnership and support threads — with a reply box under each.
 */
import { h, Fragment, useState, useEffect, useRef, t, tx, cx, href, navigate, useFetch, post, toast, errorText, stamp, ago, emit, store, useQueryState } from '../core.js';
import { PageHeader, Button, Icon, Spinner, ErrorBox, Empty, TextArea, FilterSelect, Pill } from '../ui.js';

const TOPIC_ICON = { moderation: 'shield-check', partnerships: 'handshake', support: 'lifebuoy' };

function Thread({ id, onRead }) {
  const { data, error, loading, reload, setData } = useFetch(`/organizer/inbox/${id}`, [id]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => { if (data) { onRead(id); end.current?.scrollIntoView({ block: 'end' }); } }, [data?.messages?.length]);
  if (loading && !data) return h(Spinner);
  if (error) return h(ErrorBox, { error, onRetry: reload });
  const send = async () => {
    setBusy(true);
    try {
      const out = await post(`/organizer/inbox/${id}/messages`, { body: text.trim() });
      setData((d) => ({ ...d, messages: [...d.messages, out] }));
      setText('');
      toast(tx(out.message));
      reload(true);
    } catch (e) { toast(errorText(e), 'error'); } finally { setBusy(false); }
  };
  return h('div', { className: 'op-thread' },
    h('div', { className: 'op-thread-head' },
      h('div', null, h('div', { className: 'op-thread-who' }, Icon(TOPIC_ICON[data.topic] ?? 'chat-circle', true), tx(data.who)), h('h2', { className: 'op-thread-subject' }, tx(data.subject)))),
    h('div', { className: 'op-thread-msgs' }, data.messages.map((m) => h('div', { key: m.id, className: cx('op-msg', m.fromMe ? 'is-me' : 'is-ff') },
      h('div', { className: 'op-msg-bubble' }, tx(m.body)),
      h('div', { className: 'op-msg-meta' }, m.fromMe ? t('Bạn', 'You') : 'FeestFinder', ' · ', stamp(m.createdAt)))), h('div', { ref: end })),
    h('div', { className: 'op-thread-reply' },
      h(TextArea, { rows: 3, value: text, onChange: setText, placeholder: t('Trả lời… (Ctrl/⌘+Enter để gửi)', 'Reply… (Ctrl/⌘+Enter to send)'), maxLength: 2000,
        onKeyDown: (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && text.trim()) send(); } }),
      h('div', { className: 'op-thread-reply-bar' },
        h('span', { className: 'op-spacer' }),
        h(Button, { variant: 'cta', icon: 'paper-plane-right', busy, disabled: !text.trim(), onClick: send }, t('Gửi', 'Send')))));
}

export function OrgInbox({ rest }) {
  const { data, error, loading, reload, setData } = useFetch('/organizer/inbox', [store.orgId]);
  const [topic, setTopic] = useQueryState('topic', '');
  const [unread, setUnread] = useQueryState('unread', '');
  const current = rest[1] ?? null;
  const items = (data?.items ?? []).filter((x) => (!topic || x.topic === topic) && (!unread || x.unread));
  useEffect(() => {
    if (!current && items.length && window.innerWidth > 900) navigate(href('org', 'inbox', items[0].id), { replace: true });
  }, [data, current]);
  const markRead = (id) => {
    if (data?.items.find((x) => x.id === id)?.unread) { setData((d) => ({ ...d, items: d.items.map((x) => (x.id === id ? { ...x, unread: false } : x)) })); emit('counts'); }
  };
  if (loading && !data) return h(Spinner);
  return h(Fragment, null,
    h(PageHeader, { title: t('Hộp thư kiểm duyệt', 'Moderation inbox') }),
    error ? h(ErrorBox, { error, onRetry: reload }) : null,
    h('div', { className: 'op-inbox' },
      h('div', { className: 'op-inbox-list op-card' },
        h('div', { className: 'op-inbox-filters' },
          h(FilterSelect, { label: t('Chủ đề', 'Topic'), value: topic, onChange: setTopic, allLabel: t('Mọi chủ đề', 'Every topic'), options: [
            { value: 'moderation', label: t('Kiểm duyệt', 'Moderation') }, { value: 'partnerships', label: t('Hợp tác', 'Partnerships') }, { value: 'support', label: t('Hỗ trợ', 'Support') }] }),
          h(FilterSelect, { label: t('Hiển thị', 'Show'), value: unread, onChange: setUnread, allLabel: t('Tất cả', 'All'), options: [{ value: '1', label: t('Chưa đọc', 'Unread') }] })),
        items.length ? items.map((x) => h('a', {
          key: x.id, href: href('org', 'inbox', x.id), className: cx('op-inbox-item', current === x.id && 'is-on', x.unread && 'is-unread'),
          onClick: (e) => { e.preventDefault(); navigate(href('org', 'inbox', x.id), { replace: !!current }); },
        },
        h('span', { className: 'op-inbox-ic' }, Icon(TOPIC_ICON[x.topic] ?? 'chat-circle', true)),
        h('span', { className: 'op-inbox-text' },
          h('span', { className: 'op-inbox-top' }, h('strong', null, tx(x.subject)), h('small', null, ago(x.updatedAt))),
          x.about ? h('span', { className: 'op-inbox-about' }, Icon('calendar-blank'), x.about.title) : null,
          h('span', { className: 'op-inbox-snippet' }, tx(x.snippet))))) : h(Empty, { icon: 'tray', title: t('Không có tin nhắn', 'No messages') })),
      h('div', { className: 'op-inbox-view op-card' }, current ? h(Thread, { key: current, id: current, onRead: markRead }) : h(Empty, { icon: 'chat-circle-text', title: t('Chọn một cuộc trò chuyện', 'Pick a conversation') }))));
}
