'use client';
/**
 * /studio/inbox: messages with FeestFinder (moderation, partnerships) as threads with a reply
 * box; the organiser's notifications, each opening what it is about; and which topics notify.
 * ?thread=<id> opens a thread; ?tab=notifications or ?tab=settings opens those.
 */
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeftIcon, PaperPlaneRightIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { pick, type Pair } from '../copy';
import { cx } from '../cx';
import { dayMonth } from '../format';
import { KdLink } from '../link';
import { useKd } from '../runtime';
import { Button, IconButton } from '../ui/actions';
import { Input, SwitchRow } from '../ui/forms';
import { Card as Panel } from '../ui/parts';
import { Tabs } from '../ui/shell';
import { STUDIO } from './copy';
import { Page } from './parts';
import { useStudio } from './root';

type Tab = 'messages' | 'notifications' | 'settings';
interface Thread { id: string; who: Pair; subject: Pair; unread: boolean; updatedAt: string; about: { title: string; startsOn: string | null } | null; snippet: Pair | null }
interface Msg { id: string; fromMe: boolean; body: Pair | string; createdAt: string }
interface Notif { id: string; kind: string; title: Pair; body: Pair; cta: Pair | null; link: { screen?: string; eventId?: string; threadId?: string } | null; unread: boolean; createdAt: string }

/** Where an organiser notification's link goes in Studio. */
export function noticeHref(link: Notif['link']): string {
  const s = link?.screen;
  const ev = link?.eventId ? '?event=' + link.eventId : '';
  if (s === 'inbox') return '/studio/inbox' + (link?.threadId ? '?thread=' + link.threadId : '');
  if (s === 'door') return '/studio/door' + ev;
  if (s === 'gigs') return '/studio/gigs';
  return '/studio' + ev;
}

const stamp = (iso: string, lang: 'vi' | 'en') => `${dayMonth(iso.slice(0, 10), lang)} · ${FF.hhmm(iso)}`;
const text = (b: Pair | string, lang: 'vi' | 'en') => (typeof b === 'string' ? b : FF.text(b, lang));

export function Inbox() {
  const { lang } = useStudio();
  const T = pick(STUDIO, lang);
  const [tab, setTab] = useState<Tab>('messages');
  useEffect(() => {
    const t = new URLSearchParams(location.search).get('tab');
    if (t === 'notifications' || t === 'settings') setTab(t);
  }, []);
  const go = (t: string) => {
    setTab(t as Tab);
    const q = new URLSearchParams(location.search);
    q.delete('thread');
    if (t === 'messages') q.delete('tab'); else q.set('tab', t);
    history.replaceState(history.state, '', location.pathname + (q.size ? '?' + q : ''));
  };
  return (
    <Page>
      <h1 className="kd-d2 pb-1">{T.inbox}</h1>
      <Tabs label={T.inbox} current={tab} onSelect={go} items={[{ key: 'messages', label: T.messages }, { key: 'notifications', label: T.notifications }, { key: 'settings', label: T.notifSettings }]} />
      <div role="tabpanel" className="pt-2">
        {tab === 'messages' ? <Threads /> : tab === 'notifications' ? <Notices /> : <Topics />}
      </div>
    </Page>
  );
}

function Threads() {
  const { lang } = useStudio();
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const [list, setList] = useState<{ items: Thread[]; responseNote: Pair } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [thread, setThread] = useState<{ id: string; subject: Pair; who: Pair; messages: Msg[] } | null>(null);
  const [draft, setDraft] = useState('');
  const end = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const out = await FF.maybe(FF.get('/organizer/inbox'), { items: [], responseNote: { en: '', vi: '' } });
    setList(out);
    return out as { items: Thread[] };
  }, []);
  useEffect(() => {
    const t = new URLSearchParams(location.search).get('thread');
    load().then((out) => {
      // Side by side on a wide screen: the newest thread is open from the start.
      if (t) setOpen(t);
      else if (out.items[0] && matchMedia('(min-width: 900px)').matches) setOpen(out.items[0].id);
    });
  }, [load]);
  useEffect(() => {
    if (!open) { setThread(null); return; }
    FF.maybe(FF.get('/organizer/inbox/' + open), null).then((t: { id: string; subject: Pair; who: Pair; messages: Msg[] } | null) => { setThread(t); load(); });
  }, [open, load]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [thread]);

  const pickThread = (id: string | null) => {
    setOpen(id);
    const q = new URLSearchParams(location.search);
    if (id) q.set('thread', id); else q.delete('thread');
    history.replaceState(history.state, '', location.pathname + (q.size ? '?' + q : ''));
  };
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!open || !draft.trim()) return;
    try {
      await FF.post(`/organizer/inbox/${open}/messages`, { body: draft.trim() });
      setDraft('');
      setThread(await FF.get('/organizer/inbox/' + open));
    } catch (x) { kd.toast(FF.errorText(x, lang)); }
  };

  if (!list) return <div className="kd-skel h-60" aria-hidden="true" />;
  if (!list.items.length) return <Panel className="p-5"><span className="kd-s">{T.noThreads}</span></Panel>;
  return (
    <div className="kd-split gap-3">
      <Panel as="section" className={cx('kd-side flex flex-col overflow-hidden', open && 'max-[899px]:hidden')} aria-label={T.messages}>
        <ul className="flex flex-col">
          {list.items.map((t) => (
            <li key={t.id}>
              <button type="button" className={cx('flex w-full flex-col gap-0.5 border-b border-line px-4 py-3 text-left hover:bg-white/[0.03]', open === t.id && 'bg-white/[0.04]')} aria-current={open === t.id || undefined} onClick={() => pickThread(t.id)}>
                <span className="flex items-center justify-between gap-3">
                  <span className={cx('kd-hs kd-ell', t.unread && 'text-paper')}>{t.who[lang]}</span>
                  <span className="kd-m kd-num shrink-0">{dayMonth(t.updatedAt.slice(0, 10), lang)}</span>
                </span>
                <span className={cx('kd-s kd-ell', t.unread && 'text-mist')}>{t.unread ? <span className="mr-1.5 inline-block size-2 rounded-full bg-acc align-middle" aria-hidden="true" /> : null}{t.subject[lang]}</span>
                {t.about ? <span className="kd-m kd-ell">{t.about.title}{t.about.startsOn ? ' · ' + dayMonth(t.about.startsOn, lang) : ''}</span> : null}
                {t.snippet ? <span className="kd-s kd-ell text-fog">{t.snippet[lang]}</span> : null}
              </button>
            </li>
          ))}
        </ul>
        <span className="kd-s px-4 py-3">{list.responseNote[lang]}</span>
      </Panel>
      <Panel as="section" className={cx('kd-main flex min-h-[420px] flex-col', !open && 'max-[899px]:hidden')} aria-label={thread?.subject[lang] ?? T.messages}>
        {thread ? (
          <>
            <div className="flex items-center gap-2 border-b border-line px-2 py-2">
              <IconButton className="min-[900px]:hidden" label={T.backToList} onClick={() => pickThread(null)}><ArrowLeftIcon size={18} aria-hidden="true" /></IconButton>
              <div className="flex min-w-0 flex-col px-2"><h2 className="kd-hs kd-ell">{thread.subject[lang]}</h2><span className="kd-m">{thread.who[lang]}</span></div>
            </div>
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
              {thread.messages.map((m) => (
                <div key={m.id} className={cx('flex max-w-[80%] flex-col gap-1 rounded-xl px-3.5 py-2.5', m.fromMe ? 'self-end bg-paper text-ink' : 'self-start bg-white/[0.06]')}>
                  <span className="whitespace-pre-line text-sm">{text(m.body, lang)}</span>
                  <span className={cx('kd-m kd-num', m.fromMe && 'text-ink2')}>{stamp(m.createdAt, lang)}</span>
                </div>
              ))}
              <div ref={end} />
            </div>
            <form className="flex gap-2 border-t border-line p-3" onSubmit={send}>
              <Input boxClass="flex-1" value={draft} maxLength={2000} placeholder={T.reply} aria-label={T.reply} onChange={(e) => setDraft(e.target.value)} />
              <Button tone="acc" type="submit" disabled={!draft.trim()} aria-label={T.send}><PaperPlaneRightIcon size={16} aria-hidden="true" /></Button>
            </form>
          </>
        ) : open ? <div className="kd-skel m-4 h-40" aria-hidden="true" /> : null}
      </Panel>
    </div>
  );
}

function Notices() {
  const { lang } = useStudio();
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const [list, setList] = useState<{ items: Notif[]; unread: number } | null>(null);
  const load = useCallback(async () => setList(await FF.maybe(FF.get('/organizer/notifications?limit=50'), { items: [], unread: 0 })), []);
  useEffect(() => { load(); }, [load]);
  const readAll = async () => {
    try { const out = await FF.post('/organizer/notifications/read-all'); kd.toast(FF.text(out.message, lang)); load(); } catch (x) { kd.toast(FF.errorText(x, lang)); }
  };
  if (!list) return <div className="kd-skel h-60" aria-hidden="true" />;
  return (
    <Panel as="section" className="flex flex-col" aria-label={T.notifications}>
      <div className="flex justify-end px-4 pt-3">{list.unread ? <Button tone="ghost" size="sm" onClick={readAll}>{T.readAll}</Button> : null}</div>
      {!list.items.length ? <span className="kd-s px-4 pb-5">{T.noNotifs}</span> : (
        <ul className="flex flex-col">
          {list.items.map((n) => (
            <li key={n.id}>
              <KdLink href={noticeHref(n.link)} className="flex flex-col gap-0.5 border-b border-line px-4 py-3 hover:bg-white/[0.03]" onClick={() => { if (n.unread) FF.post(`/organizer/notifications/${n.id}/read`).catch(() => {}); }}>
                <span className="flex items-center justify-between gap-3">
                  <span className={cx('kd-hs', n.unread && 'text-paper')}>{n.unread ? <span className="mr-1.5 inline-block size-2 rounded-full bg-acc align-middle" aria-hidden="true" /> : null}{n.title[lang]}</span>
                  <span className="kd-m kd-num shrink-0">{stamp(n.createdAt, lang)}</span>
                </span>
                <span className="kd-s">{n.body[lang]}</span>
                {n.cta ? <span className="kd-s text-mist">{n.cta[lang]} →</span> : null}
              </KdLink>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Topics() {
  const { lang } = useStudio();
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const [topics, setTopics] = useState<{ key: string; enabled: boolean; channels: Pair }[] | null>(null);
  const load = useCallback(async () => {
    const out = await FF.maybe(FF.get('/organizer/notification-preferences'), null);
    setTopics(out?.topics ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  const names: Record<string, string> = { moderation: T.topicModeration, tickets: T.topicTickets, payouts: T.topicPayouts, crew: T.topicCrew, bookings: T.topicBookings };
  const set = async (key: string, on: boolean) => {
    setTopics((ts) => ts && ts.map((t) => (t.key === key ? { ...t, enabled: on } : t)));
    try { await FF.put('/organizer/notification-preferences', { [key]: on }); load(); } catch (x) { kd.toast(FF.errorText(x, lang)); load(); }
  };
  const test = async () => {
    try { const out = await FF.post('/organizer/notifications/test'); kd.toast(out.message ? FF.text(out.message, lang) : T.testPush); } catch (x) { kd.toast(FF.errorText(x, lang)); }
  };
  if (!topics) return <div className="kd-skel h-60" aria-hidden="true" />;
  return (
    <Panel as="section" className="flex max-w-[640px] flex-col px-4" aria-label={T.notifSettings}>
      {topics.map((t) => <SwitchRow key={t.key} label={names[t.key] ?? t.key} note={t.channels[lang]} checked={t.enabled} onChange={(v) => set(t.key, v)} />)}
      <Button tone="ghost" size="sm" className="-ml-3 my-2 self-start" onClick={test}>{T.testPush}</Button>
    </Panel>
  );
}
