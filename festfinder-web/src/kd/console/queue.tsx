'use client';
/**
 * /console in Kính đêm (design/Console-Moderation): the review queue. Left, "Hàng chờ" with its
 * counts, the views (Tất cả, Quá hạn, Sắp quá hạn, Bị gắn cờ, NTC mới, Khiếu nại), the risk, flag,
 * genre and district filters and the sort (all kept in the address), and the rows (art, title,
 * organiser or community submitter · wait, SLA, risk, flag, messages), with a checkbox each for
 * approving or sending back several at once. The top bar's search matches title, organiser,
 * submitter and venue. Right, the listing in full (review/detail.tsx), or the appeals.
 *
 * Every decision is held for five seconds before it is sent (the owner's choice: a client-side
 * hold, not a revert endpoint): the status line offers "Hoàn tác", and the next listing opens.
 * Leaving the page sends what is held. j / k (or the arrows) move, a approves, r sends back with
 * a message, e opens the full edit, x selects. /console?id=<event> opens one listing.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowClockwiseIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { freshen } from '../fresh';
import { fill, pick } from '../copy';
import { cx } from '../cx';
import { whenShort } from '../format';
import { familyOf, g } from '../genre';
import { useKd } from '../runtime';
import { Button, Chip, IconButton } from '../ui/actions';
import { Art, Card as Panel, Status } from '../ui/parts';
import { CONSOLE } from './copy';
import { Choice, ErrorBox, FilterBar, MultiChoice, useAsk, useOptions, useQuery } from './kit';
import { useConsole } from './root';
import { Appeals } from './review/appeals';
import { REVIEW } from './review/copy';
import { Detail, FIXABLE } from './review/detail';
import { SendBack } from './review/send-back';
import { duration, type Appeal, type Held, type Item, type Reason, type Verb } from './review/types';

type View = 'all' | 'breach' | 'soon' | 'flagged' | 'new';
const VIEWS: View[] = ['all', 'breach', 'soon', 'flagged', 'new'];
const FIT_TONE = { recommend: 'ok', consider: 'warn', skip: 'bad' } as const;
const HOLD_MS = 5000;

const inView = (i: Item, v: View) => v === 'all' || (v === 'flagged' ? i.flagged : v === 'new' ? i.organizer.newOrganizer : i.sla.state === v);

export function Queue() {
  const { lang, q, refreshCounts, counts } = useConsole();
  const T = pick(CONSOLE, lang);
  const R = pick(REVIEW, lang);
  const kd = useKd();
  const ask = useAsk();
  const router = useRouter();
  const opts = useOptions();
  const [params, setParams] = useQuery();
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [appeals, setAppeals] = useState<Appeal[] | null>(null);
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [held, setHeld] = useState<Held | null>(null);
  const [sendBack, setSendBack] = useState<{ ids: string[]; titles: string[]; code: string | null } | null>(null);
  const heldRef = useRef<Held | null>(null);
  heldRef.current = held;

  const appealsOn = params.get('filter') === 'appeals';
  const view: View = VIEWS.includes(params.get('view') as View) ? params.get('view') as View : 'all';
  const genres = useMemo(() => (params.get('genre') ?? '').split(',').filter(Boolean), [params]);
  const areas = useMemo(() => (params.get('area') ?? '').split('|').filter(Boolean), [params]);
  const risk = params.get('risk') ?? '';
  const flag = params.get('flag') ?? '';
  const source = params.get('source') ?? '';
  const fit = params.get('fit') ?? '';
  const sort = params.get('sort') ?? 'age';

  const load = useCallback(async () => {
    const [qu, ap] = await Promise.all([
      FF.get('/admin/queue').then((r: { items: Item[] }) => { setError(null); return r.items; }, (e: unknown) => { setError(e); return null; }),
      FF.maybe(FF.get('/admin/appeals'), { items: [] }),
    ]);
    if (qu) setItems(qu);
    setAppeals(ap.items);
    refreshCounts();
  }, [refreshCounts]);
  useEffect(() => {
    void load();
    FF.maybe(FF.get('/admin/reject-reasons'), { items: [] }).then((r: { items: Reason[] }) => setReasons(r.items));
  }, [load]);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  /** Sends a held decision. `beacon` is for a page that is going away: the request outlives it. */
  const send = useCallback(async (h: Held, beacon = false) => {
    const path = h.verb === 'approve' ? '/admin/listings/approve' : '/admin/listings/reject';
    const body = h.verb === 'approve' ? { ids: h.ids }
      : { ids: h.ids, code: h.reason!.code, ...(h.message ? { message: h.message } : {}), ...(h.allowAppeal !== undefined ? { allowAppeal: h.allowAppeal } : {}) };
    if (beacon) {
      fetch(path, { method: 'POST', keepalive: true, credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-lang': lang }, body: JSON.stringify(body) }).catch(() => {});
      return;
    }
    try {
      await FF.post(path, body);
      for (const id of h.ids) { const slug = itemsRef.current?.find((i) => i.id === id)?.slug; if (slug) void freshen('e', slug); }
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
    void load();
  }, [kd, lang, load]);
  const sendRef = useRef(send);
  sendRef.current = send;
  // Leaving the page (or this tab of the Console) sends what is held.
  useEffect(() => {
    const flush = () => { const h = heldRef.current; if (h) { clearTimeout(h.timer); heldRef.current = null; void sendRef.current(h, true); } };
    addEventListener('pagehide', flush);
    return () => { removeEventListener('pagehide', flush); flush(); };
  }, []);

  const hidden = useMemo(() => new Set(held?.ids ?? []), [held]);
  const live = useMemo(() => (items ?? []).filter((i) => !hidden.has(i.id)), [items, hidden]);
  const needle = q.trim().toLowerCase();
  const visible = useMemo(() => live
    .filter((i) => inView(i, view))
    .filter((i) => !genres.length || genres.includes(i.genre ?? ''))
    .filter((i) => !areas.length || areas.includes(i.area ?? ''))
    .filter((i) => !risk || i.riskBand === risk)
    .filter((i) => !flag || (flag === 'none' ? !i.flag : i.flag?.code === flag))
    .filter((i) => !source || (i.origin ?? 'posted') === source)
    .filter((i) => !fit || i.fit?.band === fit)
    .filter((i) => !needle || `${i.title} ${i.organizer.name} ${i.submittedBy?.name ?? ''} ${i.venueName ?? ''} ${i.slug}`.toLowerCase().includes(needle))
    .sort((a, b) => sort === 'fit' ? Number(!!b.festival?.flagship) - Number(!!a.festival?.flagship) || (b.fit?.score ?? -1) - (a.fit?.score ?? -1)
      : sort === 'risk' ? b.riskScore - a.riskScore
      : sort === 'new' ? a.waitingMinutes - b.waitingMinutes
        : sort === 'date' ? (a.startsOn ?? '9999').localeCompare(b.startsOn ?? '9999')
          : b.waitingMinutes - a.waitingMinutes),
  [live, view, genres, areas, risk, flag, source, fit, needle, sort]);

  // The open listing: the one in the address when it is shown (or not in the queue at all: a
  // deep link to a decided listing), else the first row.
  const idParam = params.get('id');
  const selId = idParam && !hidden.has(idParam) && (visible.some((i) => i.id === idParam) || (items && !items.some((i) => i.id === idParam)))
    ? idParam : visible[0]?.id ?? null;
  const sel = visible.find((i) => i.id === selId) ?? null;
  // On a narrow screen the listing renders under the whole queue: a tap scrolls to it, or it would seem to do nothing.
  const open = useCallback((id: string | null) => {
    setParams({ id });
    if (id && matchMedia('(max-width: 899px)').matches) requestAnimationFrame(() => document.getElementById('q-detail')?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  }, [setParams]);

  const decide = (verb: Verb, ids: string[], reason: Reason | null = null, extra: { message?: string; allowAppeal?: boolean } = {}) => {
    if (!ids.length) return;
    // A new decision sends the one still held.
    if (held) { clearTimeout(held.timer); void send(held); }
    const order = visible.map((i) => i.id);
    const at = Math.max(0, order.indexOf(ids[0]));
    const nextId = order.filter((id) => !ids.includes(id))[at] ?? order.filter((id) => !ids.includes(id))[at - 1] ?? null;
    const title = ids.length > 1 ? fill(T.selected, { n: ids.length }) : (items ?? []).find((i) => i.id === ids[0])?.title ?? '';
    const h: Held = { verb, ids, title, reason, ...extra, timer: 0 };
    h.timer = window.setTimeout(() => { setHeld((cur) => (cur === h ? null : cur)); void send(h); }, HOLD_MS);
    setHeld(h);
    setPicked((p) => p.filter((x) => !ids.includes(x)));
    open(nextId);
  };
  const undo = () => {
    if (!held) return;
    clearTimeout(held.timer);
    open(held.ids[0]);
    setHeld(null);
  };
  const approveMany = async (ids: string[]) => {
    if (ids.length > 1 && !(await ask({ title: fill(R.approveAsk, { n: ids.length }), body: R.approveAskBody, confirm: R.approveAll }))) return;
    decide('approve', ids);
  };
  const titlesOf = (ids: string[]) => ids.map((id) => (items ?? []).find((i) => i.id === id)?.title ?? '');
  const startSendBack = (ids: string[], titles: string[], code: string | null = null) => setSendBack({ ids, titles, code });

  // The keyboard: j / k / arrows move, a approves, r sends back, e edits, x selects.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || t.closest('input, textarea, select, [contenteditable="true"], [role="menu"]') || document.querySelector('dialog[open]')) return;
      if (appealsOn || !selId) return;
      const i = visible.findIndex((x) => x.id === selId);
      const k = e.key.toLowerCase();
      const go = (d: number) => { const n = visible[i < 0 ? 0 : i + d]; if (n) { open(n.id); document.getElementById('q-' + n.id)?.scrollIntoView({ block: 'nearest' }); } };
      if (k === 'j' || k === 'arrowdown') { go(1); e.preventDefault(); }
      else if (k === 'k' || k === 'arrowup') { go(-1); e.preventDefault(); }
      else if (k === 'a' && sel) { decide('approve', [selId]); e.preventDefault(); }
      else if (k === 'r' && sel) { startSendBack([selId], [sel.title]); e.preventDefault(); }
      else if (k === 'e') { router.push(`/console/events/${selId}`); e.preventDefault(); }
      else if (k === 'x' && sel) { setPicked((p) => (p.includes(selId) ? p.filter((x) => x !== selId) : [...p, selId])); e.preventDefault(); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  const viewLabel: Record<View, string> = { all: T.fAll, breach: R.vBreach, soon: R.vSoon, flagged: T.fFlagged, new: R.vNew };
  const verbLabel = { approve: T.didApprove, reject: T.didReject, fix: T.didFix };
  const active = !!(genres.length || areas.length || risk || flag || source || fit);
  const n = (pred: (i: Item) => boolean) => live.filter(pred).length;
  const allPicked = visible.length > 0 && visible.every((i) => picked.includes(i.id));
  const areaOptions = useMemo(() => {
    const present = new Set([...live.map((i) => i.area ?? '').filter(Boolean), ...areas]);
    return [...present].sort().map((a) => ({ value: a, label: a, aside: String(live.filter((i) => i.area === a).length) }));
  }, [live, areas]);

  return (
    <div className="flex min-h-0 flex-1 flex-wrap">
      <aside className="flex max-w-full flex-[1_1_360px] flex-col gap-3 border-r border-line-1 p-4 max-[899px]:border-b max-[899px]:border-r-0" aria-label={T.queue}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="kd-hs">{T.queue}</h2>
          <span className="flex items-center gap-1">
            <span className="kd-m kd-num">{appealsOn ? fill(R.appealsN, { n: appeals?.length ?? 0 }) : fill(R.waiting, { n: live.length })}</span>
            <IconButton size="sm" label={R.refresh} onClick={load}><ArrowClockwiseIcon size={16} aria-hidden="true" /></IconButton>
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={R.views}>
          {VIEWS.map((v) => (
            <Chip key={v} on={!appealsOn && view === v} count={v === 'all' ? live.length : n((i) => inView(i, v))}  onClick={() => setParams({ view: v === 'all' ? null : v, filter: null })}>
              {viewLabel[v]}
            </Chip>
          ))}
          <Chip on={appealsOn} count={appeals?.length ?? counts?.appeals ?? 0} onClick={() => setParams({ filter: 'appeals', view: null, id: null })}>{T.fAppeals}</Chip>
        </div>
        {!appealsOn ? (
          <FilterBar onReset={active ? () => setParams({ genre: null, area: null, risk: null, flag: null, source: null, fit: null }) : null}>
            <Choice label={R.fSource} value={source} onChange={(v) => setParams({ source: v })} options={[{ value: 'radar', label: R.srcRadar }, { value: 'posted', label: R.srcPosted }]} />
            <Choice label={R.fFit} value={fit} onChange={(v) => setParams({ fit: v })} options={[{ value: 'recommend', label: R.fitRecommend }, { value: 'consider', label: R.fitConsider }, { value: 'skip', label: R.fitSkip }]} />
            <Choice label={R.fRisk} value={risk} onChange={(v) => setParams({ risk: v })} options={[{ value: 'high', label: R.high }, { value: 'medium', label: R.medium }, { value: 'low', label: R.low }]} />
            <Choice label={R.fFlag} value={flag} onChange={(v) => setParams({ flag: v })} options={[...((opts?.rejectReasons ?? []) as Reason[]).map((r) => ({ value: r.code, label: r.label[lang] })), { value: 'none', label: R.notFlagged }]} />
            <MultiChoice label={R.fGenre} values={genres} onChange={(v) => setParams({ genre: v.join(',') })} options={(opts?.genres ?? []).map((x) => ({ value: x.value, label: x.label[lang], aside: String(live.filter((i) => i.genre === x.value).length) }))} />
            <MultiChoice label={R.fArea} values={areas} onChange={(v) => setParams({ area: v.join('|') })} options={areaOptions} />
            <Choice label={R.sort} any={false} value={sort} onChange={(v) => setParams({ sort: v === 'age' ? null : v })} options={[{ value: 'age', label: R.sAge }, { value: 'fit', label: R.sFit }, { value: 'risk', label: R.sRisk }, { value: 'date', label: R.sDate }, { value: 'new', label: R.sNew }]} />
          </FilterBar>
        ) : null}
        {!appealsOn && visible.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" tone="ghost" onClick={() => setPicked(allPicked ? [] : visible.map((i) => i.id))}>{allPicked ? T.clear : fill(R.selectAll, { n: visible.length })}</Button>
          </div>
        ) : null}
        {picked.length && !appealsOn ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2" role="status">
            <span className="kd-s flex-1">{fill(T.selected, { n: picked.length })}</span>
            <Button size="sm" tone="ghost" onClick={() => setPicked([])}>{T.clear}</Button>
            <Button size="sm" onClick={() => startSendBack(picked, titlesOf(picked))}>{R.sendBack}</Button>
            <Button size="sm" tone="acc" onClick={() => approveMany(picked)}>{fill(T.approveN, { n: picked.length })}</Button>
          </div>
        ) : null}
        {appealsOn ? null : error && !items ? <ErrorBox error={error} retry={load} /> : items === null ? <div className="kd-skel h-60" aria-hidden="true" /> : (
          <ul className="flex flex-col gap-0.5">
            {visible.map((i) => (
              <li key={i.id} id={'q-' + i.id} className={cx('group relative flex items-center gap-1 rounded-lg', selId === i.id && 'bg-white/[0.05]')}>
                {/* A 44px box around the 16px box: the whole square toggles it. */}
                <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
                  <input
                    type="checkbox"
                    className="size-4 accent-info"
                    checked={picked.includes(i.id)}
                    aria-label={fill(T.selectRow, { t: i.title })}
                    onChange={(e) => setPicked((p) => (e.target.checked ? [...p, i.id] : p.filter((x) => x !== i.id)))}
                  />
                </label>
                <button type="button" aria-pressed={selId === i.id} className={cx('flex min-w-0 flex-1 flex-wrap items-center gap-3 rounded-lg p-2 text-left hover:bg-white/[0.03] tab:flex-nowrap', g(familyOf(i.genre)))} onClick={() => open(i.id)}>
                  <Art title={i.title} family={familyOf(i.genre)} cover={i.coverUrl} className="size-12 shrink-0 rounded-lg" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="kd-hs kd-ell">{i.title}</span>
                    {i.kind === 'revision' ? <span className="kd-m text-warn">{R.revisionTag}</span> : null}
                    <span className="kd-s kd-ell">
                      {i.submittedBy ? fill(R.community, { n: i.submittedBy.name || '—' }) : i.organizer.name}
                      {i.organizer.newOrganizer && !i.submittedBy ? <span className="text-warn"> · {R.newTag}</span> : null}
                      {' · '}{duration(i.waitingMinutes, lang)}
                    </span>
                    <span className="kd-m kd-ell kd-num">{[i.startsOn ? whenShort(i, lang) : null, i.venueName].filter(Boolean).join(' · ')}</span>
                  </span>
                  {/* On a phone the statuses go under the title, so the title keeps the row. */}
                  <span className="flex basis-full flex-wrap items-center gap-x-3 gap-y-1 pl-15 tab:basis-auto tab:flex-col tab:items-end tab:pl-0">
                    <Status tone={i.sla.state === 'breach' ? 'bad' : i.sla.state === 'soon' ? 'warn' : 'none'}>{i.sla.label[lang]}</Status>
                    {i.festival?.flagship ? <Status tone="live">{R.flagship}</Status> : null}
                    {i.fit ? <Status tone={FIT_TONE[i.fit.band]}>{fill(R.fitN, { n: i.fit.score })}</Status> : null}
                    <Status tone={i.riskBand === 'high' ? 'bad' : i.riskBand === 'medium' ? 'warn' : 'ok'}>{fill(R.riskN, { n: i.riskScore })}</Status>
                    {i.flagged ? <Status tone="bad">{i.flag?.label[lang] ?? T.flagged}</Status> : null}
                    {i.threadMessages ? <span className="kd-m kd-num">{fill(R.msgsN, { n: i.threadMessages })}</span> : null}
                  </span>
                </button>
              </li>
            ))}
            {!visible.length ? (
              <li className="flex flex-col gap-1 px-2 py-5">
                <span className="kd-hs">{!live.length ? T.emptyQueue : R.emptyMatch}</span>
                {live.length && view !== 'all' ? <span className="kd-s">{T.emptyHint}</span> : null}
              </li>
            ) : null}
          </ul>
        )}
        <span className="kd-m mt-auto pt-2 max-[899px]:hidden">{R.shortcuts}</span>
      </aside>

      <section className={cx('flex min-w-0 flex-[999_1_560px] flex-col gap-6 p-[clamp(16px,3vw,32px)]', sel && g(familyOf(sel.genre)))} aria-label={appealsOn ? T.fAppeals : sel?.title ?? T.queue}>
        <div role="status" aria-live="polite">
          {held ? (
            <Panel className="flex items-center gap-3 py-2.5 pl-4 pr-2.5">
              <Status tone={held.verb === 'approve' ? 'ok' : held.verb === 'fix' ? 'warn' : 'bad'}>{verbLabel[held.verb]}</Status>
              <span className="kd-s kd-ell flex-1 text-fg-2">{held.title}{held.reason ? ' · ' + held.reason.label[lang] : ''}</span>
              <Button size="sm" tone="ghost" onClick={undo}>{T.undo}</Button>
            </Panel>
          ) : null}
        </div>
        <span id="q-detail" className="block scroll-mt-16" aria-hidden="true" />
        {appealsOn ? <Appeals lang={lang} appeals={appeals} onDone={load} />
          : selId && items ? (
            <Detail
              key={selId}
              lang={lang}
              id={selId}
              item={sel}
              reasons={reasons}
              onDecide={(v, ids, r) => decide(v, ids, r ?? null)}
              onSendBack={startSendBack}
              onChanged={load}
            />
          ) : null}
      </section>

      {sendBack ? (
        <SendBack
          lang={lang}
          reasons={reasons}
          ids={sendBack.ids}
          titles={sendBack.titles}
          initial={sendBack.code}
          onClose={() => setSendBack(null)}
          onSend={(reason, message, allowAppeal) => {
            const ids = sendBack.ids;
            setSendBack(null);
            decide(reason.code && FIXABLE.has(reason.code) ? 'fix' : 'reject', ids, reason, { message, allowAppeal });
          }}
        />
      ) : null}
    </div>
  );
}
