'use client';
/**
 * The app's people screens in Kính đêm: /app/plan/<event> (the group going together: who is in,
 * the meet spot, splitting the tickets with a VietQR request, the group chat; or "Rủ bạn bè"
 * when there is no plan yet), /app/chat/<friend>, /app/hyped and /app/following.
 */
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeftIcon, BellIcon, CheckIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { cx } from '../cx';
import { dayMonth, money } from '../format';
import { useKd } from '../runtime';
import { Button, IconButton } from '../ui/actions';
import { Input, Option, Segmented } from '../ui/forms';
import { Accordion, Avatar, Card as Panel, Status } from '../ui/parts';
import { QrCode } from '../ui/qr';
import { AppBar } from '../ui/shell';
import type { Card, EventDetail } from '../types';
import { APP } from './copy';
import { EventRow, SignInCard } from './row';

function Head({ lang, title, back, sub }: { lang: Lang; title: string; back: string; sub?: string }) {
  const T = pick(APP, lang);
  return (
    <AppBar className="pr-1.5">
      <a className="kd-ib -ml-2" href={back} aria-label={T.back}><ArrowLeftIcon size={22} aria-hidden="true" /></a>
      <span className="ml-1 flex min-w-0 flex-col"><h1 className="kd-hs kd-ell">{title}</h1>{sub ? <span className="kd-m">{sub}</span> : null}</span>
    </AppBar>
  );
}

function Gate({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const T = pick(APP, lang);
  const kd = useKd();
  if (kd.session === undefined) return <div className="kd-skel mx-4 h-40" aria-hidden="true" />;
  return kd.user ? <>{children}</> : <SignInCard lang={lang} note={T.gateMe} />;
}

// ---- group plan -----------------------------------------------------------------------------

interface Member { userId: string; name: string; photoUrl: string | null; status: 'going' | 'pending' | 'declined' | string; owner: boolean; paid: boolean }
interface Msg { id: string; kind: string; body: string; fromMe: boolean; author?: string; createdAt: string; payload?: { qrPayload?: string; amount?: number; reference?: string } | null }
interface Plan {
  id: string; isOwner: boolean; headsLine: Pair; members: Member[];
  meetSpots: { id: 'gate' | 'cafe' | 'park'; name: Pair; time: string }[]; meetSpot: string | null;
  split: { perHead: number; paidLine: Pair; owedCount: number; owedLine: Pair; payeeReady: boolean } | null;
  messages: Msg[];
}

export function PlanScreen({ lang, ev }: { lang: Lang; ev: EventDetail }) {
  return (
    <>
      <Head lang={lang} title={ev.title} back={'/app/e/' + ev.slug} sub={pick(APP, lang).plan} />
      <Gate lang={lang}><PlanBody lang={lang} ev={ev} /></Gate>
    </>
  );
}

function PlanBody({ lang, ev }: { lang: Lang; ev: EventDetail }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [plan, setPlan] = useState<Plan | null | undefined>(undefined);
  const [tab, setTab] = useState<'group' | 'chat'>('group');
  const load = useCallback(async () => {
    const list = await FF.maybe(FF.get('/me/plans'), { items: [] });
    const mine = list.items.find((p: { event: { id: string } }) => p.event.id === ev.id);
    setPlan(mine ? await FF.maybe(FF.get('/plans/' + mine.id), null) : null);
  }, [ev.id]);
  useEffect(() => { load(); }, [load]);
  const act = async (fn: () => Promise<{ message?: Pair } | unknown>) => {
    try {
      const out = await fn() as { message?: Pair } | null;
      if (out && out.message) kd.toast(FF.text(out.message, lang));
      await load();
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  if (plan === undefined) return <div className="kd-skel mx-4 h-60" aria-hidden="true" />;
  if (plan === null) return <Invite lang={lang} ev={ev} onDone={load} />;
  const me = plan.members.find((m) => m.userId === kd.user?.id);
  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      <Segmented label={T.planTabs} value={tab} onChange={setTab} options={[{ value: 'group', label: T.planGroup }, { value: 'chat', label: T.planChat }]} />
      {tab === 'chat' ? <Thread lang={lang} url={'/plans/' + plan.id + '/messages'} initial={plan.messages} placeholder={T.chatPh} /> : (
        <>
          <span className="kd-m">{plan.headsLine[lang]}</span>
          <ul className="flex flex-col border-t border-line">
            {plan.members.map((m) => (
              <li key={m.userId} className="kd-lrow min-h-15">
                <Avatar name={m.name} src={m.photoUrl} size={40} acc={m.userId === kd.user?.id} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="kd-hs kd-ell">{m.name}{m.owner ? <span className="kd-m ml-2">{T.owner}</span> : null}</span>
                  <Status tone={m.status === 'going' ? 'ok' : m.status === 'declined' ? 'none' : 'warn'}>{m.status === 'going' ? T.stGoing : m.status === 'declined' ? T.stDeclined : T.stPending}</Status>
                </span>
                {plan.isOwner && !m.owner && m.status === 'going' ? (
                  <button type="button" role="switch" aria-checked={m.paid} aria-label={fill(T.markPaid, { n: m.name })} className={cx('kd-chip', m.paid && 'kd-chip-on')}
                    onClick={() => act(() => FF.patch('/plans/' + plan.id + '/members/' + m.userId, { paid: !m.paid }))}>
                    {m.paid ? <><CheckIcon size={14} aria-hidden="true" />{T.paid}</> : T.unpaid}
                  </button>
                ) : m.paid ? <Status tone="ok">{T.paid}</Status> : null}
                {plan.isOwner && !m.owner && m.status === 'pending' ? (
                  <IconButton size="sm" label={fill(T.remindX, { n: m.name })} onClick={() => act(() => FF.post('/plans/' + plan.id + '/members/' + m.userId + '/remind'))}><BellIcon size={18} aria-hidden="true" /></IconButton>
                ) : null}
              </li>
            ))}
          </ul>
          {me && !me.owner ? (
            <div className="grid grid-cols-2 gap-2">
              <Button tone={me.status === 'going' ? 'acc' : 'default'} onClick={() => act(() => FF.post('/plans/' + plan.id + '/respond', { status: 'going' }))}>{T.imGoing}</Button>
              <Button tone="ghost" onClick={() => act(() => FF.post('/plans/' + plan.id + '/respond', { status: 'declined' }))}>{T.notGoing}</Button>
            </div>
          ) : null}
          <div role="radiogroup" aria-label={T.meetSpot} className="flex flex-col gap-1.5">
            <span className="kd-hs">{T.meetSpot}</span>
            {plan.meetSpots.map((s) => (
              <Option key={s.id} checked={plan.meetSpot === s.id} disabled={!plan.isOwner && plan.meetSpot !== s.id} title={s.name[lang]} price={s.time}
                onSelect={() => plan.isOwner && act(() => FF.patch('/plans/' + plan.id, { meetSpot: s.id }))} />
            ))}
          </div>
          {plan.split ? <Split lang={lang} plan={plan} /> : null}
        </>
      )}
    </div>
  );
}

function Split({ lang, plan }: { lang: Lang; plan: Plan }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const s = plan.split!;
  const [req, setReq] = useState<{ title: Pair; qrPayload: string; amount: number; reference: string; payeeLine: string; note: Pair } | null>(null);
  const ask = async (method: 'vietqr' | 'momo' | 'zalopay') => {
    try { setReq(await FF.post('/plans/' + plan.id + '/payment-requests', { method, post: true })); } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  return (
    <Panel className="flex flex-col gap-3 p-4">
      <div className="flex items-baseline justify-between"><span className="kd-hs">{T.split}</span><span className="kd-mb kd-num">{fill(T.perHead, { p: money(s.perHead, 'VND', lang) })}</span></div>
      <span className="kd-s">{s.paidLine[lang]}{s.owedCount ? ' · ' + s.owedLine[lang] : ''}</span>
      {plan.isOwner && s.owedCount && s.payeeReady ? (
        <div className="flex flex-wrap gap-2">
          {(['vietqr', 'momo', 'zalopay'] as const).map((m) => <Button key={m} size="sm" onClick={() => ask(m)}>{fill(T.askMoney, { m: m === 'vietqr' ? 'VietQR' : m === 'momo' ? 'MoMo' : 'ZaloPay' })}</Button>)}
        </div>
      ) : null}
      {req ? (
        <div className="flex flex-col items-center gap-2 pt-1">
          <QrCode value={req.qrPayload} size={180} label={req.title[lang]} />
          <span className="kd-s text-center">{req.payeeLine} · {money(req.amount, 'VND', lang)} · {req.reference}</span>
          <span className="kd-s text-center">{req.note[lang]}</span>
        </div>
      ) : null}
    </Panel>
  );
}

function Invite({ lang, ev, onDone }: { lang: Lang; ev: EventDetail; onDone: () => void }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [friends, setFriends] = useState<{ id: string; name: string; photoUrl: string | null }[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  useEffect(() => { FF.maybe(FF.get('/me/friends'), { items: [] }).then((r: { items: { id: string; name: string; photoUrl: string | null }[] }) => setFriends(r.items)); }, []);
  const send = async () => {
    try {
      const out = await FF.post('/events/' + ev.id + '/invites', { friendIds: picked });
      kd.toast(FF.text(out.message, lang));
      onDone();
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  return (
    <div className="flex flex-col gap-3 px-4 pb-8">
      <span className="kd-h">{T.planNone}</span>
      {friends === null ? <div className="kd-skel h-40" aria-hidden="true" /> : friends.length ? (
        <>
          <div role="group" aria-label={T.planInvite} className="flex flex-col">
            {friends.map((f) => {
              const on = picked.includes(f.id);
              return (
                <button key={f.id} type="button" aria-pressed={on} className="kd-lrow w-full text-left" onClick={() => setPicked((xs) => (on ? xs.filter((x) => x !== f.id) : [...xs, f.id]))}>
                  <Avatar name={f.name} src={f.photoUrl} size={40} />
                  <span className="kd-hs flex-1">{f.name}</span>
                  <span className={cx('flex h-6 w-6 items-center justify-center rounded-full border', on ? 'border-acc bg-acc text-void' : 'border-line2')}>{on ? <CheckIcon size={14} aria-hidden="true" /> : null}</span>
                </button>
              );
            })}
          </div>
          <Button tone="acc" block disabled={!picked.length} onClick={send}>{T.planInviteSend}</Button>
        </>
      ) : <span className="kd-s">{T.planNoFriends}</span>}
    </div>
  );
}

// ---- a conversation (a plan's, or with one friend) ------------------------------------------

function Thread({ lang, url, initial, placeholder }: { lang: Lang; url: string; initial?: Msg[]; placeholder: string }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [msgs, setMsgs] = useState<Msg[] | null>(initial ?? null);
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const load = () => FF.maybe(FF.get(url), null).then((out: Msg[] | { items: Msg[] } | null) => out && setMsgs(Array.isArray(out) ? out : out.items));
    if (!initial) load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, [url, initial]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs]);
  const send = async (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      const m: Msg = await FF.post(url, { body });
      setMsgs((xs) => [...(xs ?? []), m]);
    } catch (x) { setText(body); kd.toast(FF.errorText(x, lang)); }
  };
  return (
    <div className="flex flex-col gap-3">
      {msgs === null ? <div className="kd-skel h-40" aria-hidden="true" /> : msgs.length ? (
        <ol className="flex flex-col gap-2" aria-live="polite">
          {msgs.map((m) => (
            <li key={m.id} className={cx('flex max-w-[82%] flex-col gap-0.5', m.fromMe ? 'self-end items-end' : 'self-start')}>
              {!m.fromMe && m.author ? <span className="kd-m">{m.author}</span> : null}
              <span className={cx('rounded-card px-3.5 py-2.5 text-[15px]', m.fromMe ? 'bg-paper text-void' : 'kd-card text-paper')}>{m.body}</span>
              {m.payload?.qrPayload ? <span className="rounded-card bg-white p-2"><QrCode value={m.payload.qrPayload} size={140} label={m.payload.reference ?? ''} /></span> : null}
            </li>
          ))}
        </ol>
      ) : <span className="kd-s">{T.chatEmpty}</span>}
      <div ref={end} />
      <form onSubmit={send} className="sticky bottom-0 flex gap-2 bg-void pb-[calc(8px+env(safe-area-inset-bottom))] pt-2">
        <Input aria-label={placeholder} placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} boxClass="flex-1" maxLength={1000} />
        <Button type="submit" tone="acc">{T.send}</Button>
      </form>
    </div>
  );
}

export function ChatScreen({ lang, friendId }: { lang: Lang; friendId: string }) {
  const T = pick(APP, lang);
  const [name, setName] = useState('');
  useEffect(() => {
    FF.maybe(FF.get('/me/chats'), { items: [] }).then((r: { items: { friendId: string; name: string }[] }) => setName(r.items.find((c) => c.friendId === friendId)?.name ?? ''));
  }, [friendId]);
  return (
    <>
      <Head lang={lang} title={name || T.planChat} back="/app/profile" />
      <Gate lang={lang}><div className="px-4 pb-8"><Thread lang={lang} url={'/me/chats/' + friendId} placeholder={T.dmPh} /></div></Gate>
    </>
  );
}

// ---- hyped, following -----------------------------------------------------------------------

export function Hyped({ lang }: { lang: Lang }) {
  const T = pick(APP, lang);
  const [items, setItems] = useState<Card[] | null>(null);
  const kd = useKd();
  useEffect(() => { if (kd.user) FF.maybe(FF.get('/me/hypes?limit=100'), { items: [] }).then((r: { items: Card[] }) => setItems(r.items)); }, [kd.user]);
  const up = (items ?? []).filter((e) => !e.past);
  const past = (items ?? []).filter((e) => e.past);
  return (
    <>
      <Head lang={lang} title={T.hypedTitle} back="/app/profile" />
      <Gate lang={lang}>
        {!items ? <div className="kd-skel mx-4 h-40" aria-hidden="true" /> : items.length ? (
          <div className="flex flex-col px-4">
            <ul className="flex flex-col">{up.map((e) => <li key={e.id}><EventRow e={e} lang={lang} /></li>)}</ul>
            {past.length ? <Accordion small summary={T.past} aside={past.length}><ul className="flex flex-col">{past.map((e) => <li key={e.id}><EventRow e={e} lang={lang} dim /></li>)}</ul></Accordion> : null}
          </div>
        ) : <Panel className="m-4 p-6"><span className="kd-h">{T.hypedEmpty}</span></Panel>}
      </Gate>
    </>
  );
}

interface OrgRow { id: string; slug: string; name: string; logoUrl: string | null; next: { startsOn: string } | null }

export function Following({ lang }: { lang: Lang }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [f, setF] = useState<{ organizers: { following: OrgRow[]; discover: OrgRow[] }; artistPages?: { name: string; slug: string | null }[] } | null>(null);
  useEffect(() => { if (kd.user) FF.maybe(FF.get('/me/follows'), null).then(setF); }, [kd.user]);
  const row = (o: OrgRow) => {
    const key = 'org:' + o.id;
    const base = !!f?.organizers.following.some((x) => x.id === o.id);
    const on = kd.follows.has(key) ? !!kd.follows.get(key) : base;
    return (
      <li key={o.id} className="kd-lrow min-h-16">
        <a className="flex min-w-0 flex-1 items-center gap-3" href={'/o/' + o.slug + (lang === 'en' ? '?lang=en' : '')}>
          <Avatar org name={o.name} src={o.logoUrl} size={44} />
          <span className="flex min-w-0 flex-col"><span className="kd-hs kd-ell">{o.name}</span><span className="kd-s">{o.next ? fill(T.orgNext, { d: dayMonth(o.next.startsOn, lang) }) : T.orgNone}</span></span>
        </a>
        <Button size="sm" tone={on ? 'default' : 'acc'} aria-pressed={on} onClick={() => kd.setFollow('org', o.id, !on)}>{on ? T.followingBtn : T.follow}</Button>
      </li>
    );
  };
  return (
    <>
      <Head lang={lang} title={T.followingTitle} back="/app/profile" />
      <Gate lang={lang}>
        {!f ? <div className="kd-skel mx-4 h-40" aria-hidden="true" /> : (
          <div className="flex flex-col gap-6 px-4 pb-8">
            {(f.artistPages ?? []).length || f.organizers.following.length ? (
              <ul className="flex flex-col">
                {(f.artistPages ?? []).map((a) => {
                  const on = kd.follows.has('art:' + a.name) ? !!kd.follows.get('art:' + a.name) : true;
                  return (
                    <li key={a.name} className="kd-lrow min-h-16">
                      {a.slug ? <a className="flex min-w-0 flex-1 items-center gap-3" href={'/a/' + a.slug}><Avatar name={a.name} size={44} /><span className="kd-hs kd-ell">{a.name}</span></a>
                        : <span className="flex min-w-0 flex-1 items-center gap-3"><Avatar name={a.name} size={44} /><span className="kd-hs kd-ell">{a.name}</span></span>}
                      <Button size="sm" tone={on ? 'default' : 'acc'} aria-pressed={on} onClick={() => kd.setFollow('art', a.name, !on)}>{on ? T.followingBtn : T.follow}</Button>
                    </li>
                  );
                })}
                {f.organizers.following.map(row)}
              </ul>
            ) : <span className="kd-s">{T.followingEmpty}</span>}
            {f.organizers.discover.length ? (
              <section className="flex flex-col" aria-labelledby="fl-disc">
                <h2 id="fl-disc" className="kd-m pb-1.5">{T.discover}</h2>
                <ul className="flex flex-col">{f.organizers.discover.slice(0, 8).map(row)}</ul>
              </section>
            ) : null}
          </div>
        )}
      </Gate>
    </>
  );
}
