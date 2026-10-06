'use client';
/**
 * /console in Kính đêm (design/Console-Moderation): the review queue. Left, "Hàng chờ" with its
 * counts, filter chips (Tất cả, Sắp quá mốc, Bị gắn cờ, Khiếu nại) and the rows (art, title,
 * organiser · age, SLA, flag), with a checkbox each for approving several at once. Right, the
 * listing: family · submitted ago, title, organiser and its verification, "Từ chối ▾" and
 * "Yêu cầu sửa ▾" as reason menus (picking a reason acts), lime "Duyệt"; the flag; the card as
 * the feed shows it; the automatic checks (failing ones shown, passing ones folded); key facts;
 * and the thread with the organiser.
 *
 * Every decision is held for five seconds before it is sent (the owner's choice: a client-side
 * hold, not a revert endpoint): the status line offers "Hoàn tác", and the next listing opens.
 * Leaving the page sends what is held. j / k move, a approves.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { CaretDownIcon, CheckIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { cx } from '../cx';
import { money, whenShort } from '../format';
import { FAMILY_LABEL, familyOf, g } from '../genre';
import { useKd } from '../runtime';
import { Button, Chip } from '../ui/actions';
import { Input } from '../ui/forms';
import { Menu, MenuHeader, MenuItem } from '../ui/menu';
import { Accordion, Art, Card as Panel, Marker, Status } from '../ui/parts';
import { CONSOLE } from './copy';
import { useConsole } from './root';

interface Item {
  id: string; slug: string; title: string; coverUrl: string | null; genre: string | null;
  organizer: { id: string; name: string; verified: boolean; newOrganizer: boolean; community: boolean };
  startsOn: string | null; endsOn: string | null; startTime: string | null; endTime: string | null; venueName: string | null; area: string | null;
  currency: string; age: string | null; entryMode: string; priceFrom: number;
  flagged: boolean; flag: { code: string; label: Pair } | null;
  waitingMinutes: number; sla: { state: 'ok' | 'soon' | 'breach'; label: Pair };
  signals: { ok: boolean; label: Pair }[];
}
interface Appeal { id: string; eventId: string; title: string; coverUrl: string | null; organizer: string; state: 'open' | 'replied'; stateLabel: Pair; reason: Pair | null; message: string; reply: string | null; closesInDays: number }
interface Reason { code: string; label: Pair }
type Filter = 'all' | 'due' | 'flagged' | 'appeals';
type Verb = 'approve' | 'reject' | 'fix';
interface Held { verb: Verb; ids: string[]; title: string; reason: Reason | null; timer: number }

/** Reasons the organiser can fix go under "Yêu cầu sửa"; the rest are a rejection. */
const FIXABLE = new Set(['venue', 'ticket', 'image', 'permit']);
const HOLD_MS = 5000;

const ago = (min: number, lang: Lang) => (min < 60 ? `${min} ${lang === 'vi' ? 'phút' : 'min'}` : `${Math.floor(min / 60)}${lang === 'vi' ? ' giờ' : 'h'} ${min % 60}${lang === 'vi' ? ' phút' : 'm'}`);

export function Queue() {
  const { lang, q, refreshCounts, counts } = useConsole();
  const T = pick(CONSOLE, lang);
  const kd = useKd();
  const [items, setItems] = useState<Item[] | null>(null);
  const [appeals, setAppeals] = useState<Appeal[] | null>(null);
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [selId, setSelId] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [held, setHeld] = useState<Held | null>(null);
  const heldRef = useRef<Held | null>(null);
  heldRef.current = held;

  const load = useCallback(async () => {
    const [qu, ap] = await Promise.all([FF.maybe(FF.get('/admin/queue'), { items: [] }), FF.maybe(FF.get('/admin/appeals'), { items: [] })]);
    setItems(qu.items); setAppeals(ap.items);
    refreshCounts();
  }, [refreshCounts]);
  useEffect(() => {
    load();
    FF.maybe(FF.get('/admin/reject-reasons'), { items: [] }).then((r: { items: Reason[] }) => setReasons(r.items));
    if (new URLSearchParams(location.search).get('filter') === 'appeals') setFilter('appeals');
  }, [load]);

  /** Sends a held decision. `beacon` is for a page that is going away: the request outlives it. */
  const send = useCallback(async (h: Held, beacon = false) => {
    const path = h.verb === 'approve' ? '/admin/listings/approve' : '/admin/listings/reject';
    const body = h.verb === 'approve' ? { ids: h.ids } : { ids: h.ids, code: h.reason!.code };
    if (beacon) {
      fetch(path, { method: 'POST', keepalive: true, credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-lang': lang }, body: JSON.stringify(body) }).catch(() => {});
      return;
    }
    try { await FF.post(path, body); } catch (e) { kd.toast(FF.errorText(e, lang)); }
    load();
  }, [kd, lang, load]);
  const sendRef = useRef(send);
  sendRef.current = send;
  // Leaving the page (or this tab of the Console) sends what is held.
  useEffect(() => {
    const flush = () => { const h = heldRef.current; if (h) { clearTimeout(h.timer); heldRef.current = null; sendRef.current(h, true); } };
    addEventListener('pagehide', flush);
    return () => { removeEventListener('pagehide', flush); flush(); };
  }, []);

  const hidden = useMemo(() => new Set(held?.ids ?? []), [held]);
  const needle = q.trim().toLowerCase();
  const visible = useMemo(() => (items ?? []).filter((i) => !hidden.has(i.id)
    && (filter === 'all' || (filter === 'due' && i.sla.state !== 'ok') || (filter === 'flagged' && i.flagged))
    && (!needle || `${i.title} ${i.organizer.name} ${i.slug}`.toLowerCase().includes(needle))), [items, hidden, filter, needle]);
  const sel = visible.find((i) => i.id === selId) ?? visible[0] ?? null;
  const left = (items ?? []).filter((i) => !hidden.has(i.id)).length;

  const decide = (verb: Verb, ids: string[], reason: Reason | null = null) => {
    if (!ids.length) return;
    // A new decision sends the one still held.
    if (held) { clearTimeout(held.timer); send(held); }
    const order = visible.map((i) => i.id);
    const at = order.indexOf(ids[0]);
    const nextId = order.filter((id) => !ids.includes(id))[Math.max(0, at)] ?? null;
    const title = ids.length > 1 ? fill(T.selected, { n: ids.length }) : (items ?? []).find((i) => i.id === ids[0])?.title ?? '';
    const h: Held = { verb, ids, title, reason, timer: 0 };
    h.timer = window.setTimeout(() => { setHeld((cur) => (cur === h ? null : cur)); send(h); }, HOLD_MS);
    setHeld(h);
    setPicked([]);
    setSelId(nextId);
  };
  const undo = () => {
    if (!held) return;
    clearTimeout(held.timer);
    setSelId(held.ids[0]);
    setHeld(null);
  };

  // j / k move between listings, a approves the one open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || t.closest('input, textarea, select, [contenteditable="true"], [role="menu"]')) return;
      if (filter === 'appeals' || !sel) return;
      const i = visible.findIndex((x) => x.id === sel.id);
      if (e.key === 'j' && visible[i + 1]) { setSelId(visible[i + 1].id); e.preventDefault(); }
      if (e.key === 'k' && visible[i - 1]) { setSelId(visible[i - 1].id); e.preventDefault(); }
      if (e.key === 'a') { decide('approve', [sel.id]); e.preventDefault(); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  const chips: { key: Filter; label: string; n: number }[] = [
    { key: 'all', label: T.fAll, n: left },
    { key: 'due', label: T.fBreach, n: (items ?? []).filter((i) => !hidden.has(i.id) && i.sla.state !== 'ok').length },
    { key: 'flagged', label: T.fFlagged, n: (items ?? []).filter((i) => !hidden.has(i.id) && i.flagged).length },
    { key: 'appeals', label: T.fAppeals, n: appeals?.length ?? counts?.appeals ?? 0 },
  ];
  const verbLabel = { approve: T.didApprove, reject: T.didReject, fix: T.didFix };

  return (
    <div className="flex min-h-0 flex-1 flex-wrap">
      <aside className="flex max-w-full flex-[1_1_340px] flex-col gap-3 border-r border-line p-4 max-[899px]:border-b max-[899px]:border-r-0" aria-label={T.queue}>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="kd-hs">{T.queue}</h2>
          <span className="kd-m kd-num">{left} {lang === 'vi' ? 'chờ' : 'waiting'}</span>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={T.queue}>
          {chips.map((c) => <Chip key={c.key} on={filter === c.key} count={c.n} onClick={() => setFilter(c.key)}>{c.label}</Chip>)}
        </div>
        {picked.length ? (
          <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2" role="status">
            <span className="kd-s flex-1">{fill(T.selected, { n: picked.length })}</span>
            <Button size="sm" tone="ghost" onClick={() => setPicked([])}>{T.clear}</Button>
            <Button size="sm" tone="acc" onClick={() => decide('approve', picked)}>{fill(T.approveN, { n: picked.length })}</Button>
          </div>
        ) : null}
        {filter === 'appeals' ? <AppealList lang={lang} appeals={appeals} onDone={load} /> : items === null ? <div className="kd-skel h-60" aria-hidden="true" /> : (
          <ul className="flex flex-col gap-0.5">
            {visible.map((i) => (
              <li key={i.id} className={cx('group relative flex items-center gap-1 rounded-lg', sel?.id === i.id && 'bg-white/[0.05]')}>
                <input
                  type="checkbox"
                  className="ml-1.5 size-4 shrink-0 accent-acc"
                  checked={picked.includes(i.id)}
                  aria-label={fill(T.selectRow, { t: i.title })}
                  onChange={(e) => setPicked((p) => (e.target.checked ? [...p, i.id] : p.filter((x) => x !== i.id)))}
                />
                <button type="button" aria-pressed={sel?.id === i.id} className={cx('flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 text-left hover:bg-white/[0.03]', g(familyOf(i.genre)))} onClick={() => setSelId(i.id)}>
                  <Art family={familyOf(i.genre)} cover={i.coverUrl} className="size-12 shrink-0 rounded-lg" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="kd-hs kd-ell">{i.title}</span>
                    <span className="kd-s kd-ell">{i.organizer.name} · {ago(i.waitingMinutes, lang)}</span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <Status tone={i.sla.state === 'breach' ? 'bad' : i.sla.state === 'soon' ? 'warn' : 'none'}>{i.sla.label[lang]}</Status>
                    {i.flagged ? <Status tone="bad">{T.flagged}</Status> : null}
                  </span>
                </button>
              </li>
            ))}
            {!visible.length ? (
              <li className="flex flex-col gap-1 px-2 py-5">
                <span className="kd-hs">{filter === 'all' ? T.emptyQueue : T.emptyFilter}</span>
                {filter !== 'all' ? <span className="kd-s">{T.emptyHint}</span> : null}
              </li>
            ) : null}
          </ul>
        )}
        <span className="kd-m mt-auto pt-2 max-[899px]:hidden">{T.shortcuts}</span>
      </aside>

      <section className={cx('flex min-w-0 flex-[999_1_560px] flex-col gap-6 p-[clamp(16px,3vw,32px)]', sel && g(familyOf(sel.genre)))} aria-label={sel?.title ?? T.queue}>
        <div role="status" aria-live="polite">
          {held ? (
            <Panel className="flex items-center gap-3 py-2.5 pl-4 pr-2.5">
              <Status tone={held.verb === 'approve' ? 'ok' : held.verb === 'fix' ? 'warn' : 'bad'}>{verbLabel[held.verb]}</Status>
              <span className="kd-s kd-ell flex-1 text-mist">{held.title}{held.reason ? ' · ' + held.reason.label[lang] : ''}</span>
              <Button size="sm" tone="ghost" onClick={undo}>{T.undo}</Button>
            </Panel>
          ) : null}
        </div>
        {filter !== 'appeals' && sel ? <Detail key={sel.id} lang={lang} item={sel} reasons={reasons} onDecide={decide} /> : null}
      </section>
    </div>
  );
}

function Detail({ lang, item, reasons, onDecide }: { lang: Lang; item: Item; reasons: Reason[]; onDecide: (v: Verb, ids: string[], r?: Reason | null) => void }) {
  const T = pick(CONSOLE, lang);
  const fam = familyOf(item.genre);
  const [checks, setChecks] = useState<{ label: Pair; bad: boolean }[] | null>(null);
  useEffect(() => {
    FF.maybe(FF.get(`/admin/listings/${item.id}/risk`), null).then((r: { factors: { label: Pair; bad: boolean }[] } | null) => {
      setChecks(r ? r.factors : item.signals.map((s) => ({ label: s.label, bad: !s.ok })));
    });
  }, [item]);
  const fails = checks?.filter((c) => c.bad) ?? [];
  const passes = checks?.filter((c) => !c.bad) ?? [];
  const when = item.startsOn ? whenShort(item, lang) : '—';
  const price = item.entryMode === 'free' ? T.free : item.priceFrom ? money(item.priceFrom, item.currency, lang) : '—';
  const reasonMenu = (label: string, head: string, verb: Verb, list: Reason[]) => (
    <Menu
      align="end"
      label={label}
      trigger={(p) => <button type="button" {...p} ref={p.ref} className="kd-btn">{label}<CaretDownIcon size={14} aria-hidden="true" /></button>}
    >
      <MenuHeader><span className="kd-m">{head}</span></MenuHeader>
      {list.map((r) => <MenuItem key={r.code} onSelect={() => onDecide(verb, [item.id], r)}>{r.label[lang]}</MenuItem>)}
    </Menu>
  );
  return (
    <>
      <div className="kd-sec">
        <div className="flex min-w-0 flex-col gap-2.5">
          <span className="kd-m flex items-center gap-1.5"><Marker family={fam} />{fill(T.submittedAgo, { g: FAMILY_LABEL[fam][lang], a: ago(item.waitingMinutes, lang) })}</span>
          <h1 className="kd-d2">{item.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="kd-t">{item.organizer.name}</span>
            <Status tone={item.organizer.verified ? 'ok' : 'warn'}>{item.organizer.verified ? T.verified : T.unverified}</Status>
            {item.organizer.newOrganizer ? <Status tone="warn">{T.newOrg}</Status> : null}
          </div>
        </div>
        <div className="relative z-[27] flex flex-wrap gap-2">
          {reasonMenu(T.reject, T.rejectHead, 'reject', reasons.filter((r) => !FIXABLE.has(r.code)))}
          {reasonMenu(T.fix, T.fixHead, 'fix', reasons.filter((r) => FIXABLE.has(r.code)))}
          <Button tone="acc" onClick={() => onDecide('approve', [item.id])}><CheckIcon size={16} aria-hidden="true" />{T.approve}</Button>
        </div>
      </div>

      {item.flag ? (
        <Panel className="flex items-center gap-3 px-4 py-3.5 shadow-[inset_0_0_0_1px_rgba(235,87,87,0.45)]"><Status tone="bad">{T.flagged}</Status><span className="kd-t text-paper">{item.flag.label[lang]}</span></Panel>
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-7">
        <div className="flex flex-col gap-3">
          <span className="kd-m">{T.inFeed}</span>
          <article className={cx('kd-ev', g(fam))}>
            <Art family={fam} cover={item.coverUrl} />
            <div className="flex flex-col gap-1">
              <span className="kd-h">{item.title}</span>
              <span className="kd-s flex items-center gap-1.5"><span className="kd-mk" aria-hidden="true" />{when}{item.venueName ? ' · ' + item.venueName : ''}</span>
              <span className={cx('kd-mb kd-num', item.entryMode === 'free' && 'text-acc')}>{price}</span>
            </div>
          </article>
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col">
            <span className="kd-m pb-2">{fill(T.checks, { p: passes.length, n: checks?.length ?? 0 })}</span>
            <div className="border-t border-line">
              {checks === null ? <div className="kd-skel mt-2 h-16" aria-hidden="true" /> : null}
              {fails.map((c, i) => (
                <div key={i} className="flex min-h-12 items-center justify-between gap-3 border-b border-line"><span className="kd-t text-paper">{c.label[lang]}</span><Status tone="warn">{T.review}</Status></div>
              ))}
              {passes.length ? (
                <Accordion small summary={<span className="kd-s">{fill(T.checksPass, { n: passes.length })}</span>}>
                  {passes.map((c, i) => <div key={i} className="flex min-h-9 items-center justify-between gap-3"><span className="kd-s">{c.label[lang]}</span><Status tone="ok">{T.pass}</Status></div>)}
                </Accordion>
              ) : null}
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1"><dt className="kd-m">{T.kDate}</dt><dd className="kd-hs kd-num">{when}</dd></div>
            <div className="flex flex-col gap-1"><dt className="kd-m">{T.kVenue}</dt><dd className="kd-hs">{[item.venueName, item.area].filter(Boolean).join(' · ') || '—'}</dd></div>
            <div className="flex flex-col gap-1"><dt className="kd-m">{T.kPrice}</dt><dd className="kd-hs kd-num">{price}</dd></div>
            <div className="flex flex-col gap-1"><dt className="kd-m">{T.kAge}</dt><dd className="kd-hs">{item.age === 'All ages' ? T.allAges : item.age ?? '—'}</dd></div>
          </dl>
          <Thread lang={lang} eventId={item.id} />
        </div>
      </div>
    </>
  );
}

function Thread({ lang, eventId }: { lang: Lang; eventId: string }) {
  const T = pick(CONSOLE, lang);
  const kd = useKd();
  const [msgs, setMsgs] = useState<{ id: string; fromAdmin: boolean; body: Pair; createdAt: string }[] | null>(null);
  const [text, setText] = useState('');
  const load = useCallback(async () => {
    const out = await FF.maybe(FF.get(`/admin/listings/${eventId}/thread`), null);
    setMsgs(out?.messages ?? []);
  }, [eventId]);
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try { await FF.post(`/admin/listings/${eventId}/thread`, { body: text.trim() }); setText(''); load(); } catch (x) { kd.toast(FF.errorText(x, lang)); }
  };
  return (
    <Accordion small summary={T.thread} aside={msgs?.length || null} onToggle={(open) => { if (open && msgs === null) load(); }}>
      <div className="flex flex-col gap-2">
        {(msgs ?? []).map((m) => (
          <div key={m.id} className={cx('flex max-w-[85%] flex-col gap-1 rounded-xl px-3 py-2', m.fromAdmin ? 'self-end bg-paper text-ink' : 'self-start bg-white/[0.06]')}>
            <span className="whitespace-pre-line text-sm">{m.body[lang]}</span>
          </div>
        ))}
        <form className="flex gap-2" onSubmit={send}>
          <Input boxClass="flex-1" value={text} maxLength={2000} placeholder={T.threadPh} aria-label={T.thread} onChange={(e) => setText(e.target.value)} />
          <Button type="submit" disabled={!text.trim()}>{T.send}</Button>
        </form>
      </div>
    </Accordion>
  );
}

function AppealList({ lang, appeals, onDone }: { lang: Lang; appeals: Appeal[] | null; onDone: () => void }) {
  const T = pick(CONSOLE, lang);
  const kd = useKd();
  const act = async (path: string) => {
    try { const out = await FF.post(path); kd.toast(FF.text(out.message, lang)); onDone(); } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  if (appeals === null) return <div className="kd-skel h-40" aria-hidden="true" />;
  if (!appeals.length) return <span className="kd-s px-2 py-5">{T.noAppeals}</span>;
  return (
    <ul className="flex flex-col gap-3">
      {appeals.map((a) => (
        <li key={a.id}>
          <Panel className="flex flex-col gap-2 p-4">
            <span className="flex items-center justify-between gap-2"><span className="kd-hs kd-ell">{a.title}</span><Status tone={a.state === 'replied' ? 'warn' : 'none'}>{a.stateLabel[lang]}</Status></span>
            <span className="kd-s">{a.organizer}{a.reason ? ' · ' + fill(T.appealReason, { r: a.reason[lang] }) : ''}</span>
            {a.reply ? (
              <div className="flex flex-col gap-1 border-l-2 border-line2 pl-3"><span className="kd-m">{T.appealReply}</span><span className="kd-s text-mist">{a.reply}</span></div>
            ) : <span className="kd-s">{fill(T.appealWaiting, { d: a.closesInDays })}</span>}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" tone="acc" onClick={() => act(`/admin/appeals/${a.id}/overturn`)}>{T.overturn}</Button>
              <Button size="sm" onClick={() => act(`/admin/appeals/${a.id}/uphold`)}>{T.uphold}</Button>
            </div>
          </Panel>
        </li>
      ))}
    </ul>
  );
}
