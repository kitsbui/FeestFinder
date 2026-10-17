'use client';
/**
 * One listing in full, on the right of the queue. The head: family · submitted ago, the title,
 * the organiser (verification, strikes, community submitter, source), status, wait and risk,
 * Preview and Full edit, and the decisions: "Từ chối ▾" and "Yêu cầu sửa ▾" as reason menus
 * (picking a reason acts; "Kèm lời nhắn…" opens the written send-back), the primary "Duyệt". Below
 * the flag, four tabs (design v2 phase 5): "Thay đổi", a change to a live listing before and after
 * (only for one); "Toàn bộ tin", the card as the feed shows it, the images and whether they load,
 * the description in either language, the details with the genre and the venue pin fixed in place,
 * the links and the ticket link's state, the tiers; "Nguồn và bằng chứng", the fit, quality checks,
 * risk signals (recheck) and open reports; "Lịch sử", the review history and the thread with the
 * organiser. The queue keeps the tab chosen from one listing to the next.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ArrowSquareOutIcon, CaretDownIcon, CheckIcon, PencilSimpleIcon, EyeIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { freshen } from '../../fresh';
import { fill, pick, type Lang, type Pair, type Strings } from '../../copy';
import { cx } from '../../cx';
import { count, money, whenShort, whenLong, timeRange } from '../../format';
import { FAMILY_LABEL, familyOf, g } from '../../genre';
import { KdLink as Link } from '../../link';
import { useKd } from '../../runtime';
import { Button, Chip, LinkButton } from '../../ui/actions';
import { Segmented, Select, TextArea } from '../../ui/forms';
import { Menu, MenuHeader, MenuItem, MenuSeparator } from '../../ui/menu';
import { Tabs } from '../../ui/shell';
import { Accordion, Art, Avatar, Card as Panel, Marker, Status, type StatusTone } from '../../ui/parts';
import { CONSOLE } from '../copy';
import { AsyncPick, KV, ago as agoIso, stamp, useLoad, useOptions, qs, type PickItem } from '../kit';
import { REVIEW } from './copy';
import { duration, type Item, type Listing, type Reason, type Verb } from './types';

/** Reasons the organiser can fix go under "Yêu cầu sửa"; the rest are a rejection. */
export const FIXABLE = new Set(['venue', 'ticket', 'image', 'permit']);

const BAND_TONE: Record<string, StatusTone> = { low: 'ok', medium: 'warn', high: 'bad' };
const FIT_TONE = { recommend: 'ok', consider: 'warn', skip: 'bad' } as const;

/** The listing's tabs: what an organiser changed (a change to a live listing only), the listing, the evidence, the history. */
export type DetailTab = 'changes' | 'listing' | 'evidence' | 'history';

/** Saved, verified venues, for linking a listing's pin. */
const loadVenues = async (q: string): Promise<PickItem[]> => {
  const out = await FF.get('/venues' + qs({ q, limit: 30 }));
  return (out.items as { id: string; name: string; address: string; area: string }[]).map((v) => ({ value: v.id, label: v.name, sub: [v.address, v.area].filter(Boolean).join(' · ') }));
};

const text = (v: Pair | string | null | undefined, lang: Lang) => (v == null ? '' : typeof v === 'string' ? v : v[lang]);

function Section({ title, aside, children }: { title: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 border-b border-line-1 pb-2"><h2 className="kd-m">{title}</h2>{aside}</div>
      {children}
    </section>
  );
}

function Ext({ href }: { href: string | null }) {
  if (!href) return <span className="kd-s">—</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 items-center gap-1 text-sm text-fg-1 hover:underline">
      <span className="kd-ell">{href.replace(/^https?:\/\//, '')}</span><ArrowSquareOutIcon size={13} aria-hidden="true" />
    </a>
  );
}

/** An image and whether it loads. */
function Pic({ src, label, broken, none, ok, className }: { src: string | null; label: string; broken: string; none: string; ok: string; className: string }) {
  const [bad, setBad] = useState(false);
  return (
    <figure className="flex flex-col gap-1.5">
      <div className={cx('overflow-hidden rounded-lg bg-white/[0.04] shadow-[inset_0_0_0_1px_var(--color-line-1)]', className)}>
        {src && !bad ? (
           
          <img src={src} alt={label} className="size-full object-cover" onError={() => setBad(true)} />
        ) : null}
      </div>
      <figcaption className="flex items-center gap-2"><span className="kd-m">{label}</span><Status tone={!src ? 'warn' : bad ? 'bad' : 'ok'}>{!src ? none : bad ? broken : ok}</Status></figcaption>
    </figure>
  );
}

export function Detail({ lang, id, item, reasons, tab, onTab, onDecide, onSendBack, onChanged }: {
  lang: Lang; id: string; item: Item | null; reasons: Reason[];
  /** The tab the reviewer chose last (kept from one listing to the next), or null for the listing's own default. */
  tab: DetailTab | null; onTab: (t: DetailTab) => void;
  onDecide: (v: Verb, ids: string[], r?: Reason | null) => void;
  onSendBack: (ids: string[], titles: string[], code?: string | null) => void;
  onChanged: () => void;
}) {
  const T = pick(CONSOLE, lang);
  const R = pick(REVIEW, lang);
  const kd = useKd();
  const opts = useOptions();
  const load = useLoad<Listing>(`/admin/events/${id}`);
  const ev = load.data;
  const [desc, setDesc] = useState<Lang>(lang);
  const [busy, setBusy] = useState(false);
  const [rechecking, setRechecking] = useState(false);

  const title = item?.title ?? ev?.title ?? '';
  const fam = familyOf(item?.genre ?? ev?.genre);
  const waiting = item?.waitingMinutes ?? ev?.waitingMinutes ?? null;
  const inReview = item ? true : ev?.status === 'in_review';

  /** A fix in place (genre, venue): the listing comes back saved. */
  const quick = async (body: Record<string, unknown>, done: string) => {
    setBusy(true);
    try {
      const out = await FF.patch(`/admin/events/${id}`, body);
      load.setData(out);
      if (out.slug) void freshen('e', out.slug);
      kd.toast(done);
      onChanged();
    } catch (e) { kd.toast(FF.errorText(e, lang)); } finally { setBusy(false); }
  };
  const recheck = async () => {
    setRechecking(true);
    try { await FF.get(`/admin/listings/${id}/risk`); load.reload(); onChanged(); } catch (e) { kd.toast(FF.errorText(e, lang)); } finally { setRechecking(false); }
  };

  const reasonMenu = (label: string, head: string, verb: Verb, list: Reason[]) => (
    <Menu
      align="end"
      label={label}
      trigger={(p) => <button type="button" {...p} ref={p.ref} className="kd-btn">{label}<CaretDownIcon size={14} aria-hidden="true" /></button>}
    >
      <MenuHeader><span className="kd-m">{head}</span></MenuHeader>
      {list.map((r) => <MenuItem key={r.code} onSelect={() => onDecide(verb, [id], r)}>{r.label[lang]}</MenuItem>)}
      <MenuSeparator />
      <MenuItem onSelect={() => onSendBack([id], [title], list[0]?.code ?? null)}>{R.writeMessage}</MenuItem>
    </Menu>
  );

  const org = ev?.organizer ?? null;
  const v = ev?.venue;
  const price = !ev ? '—' : ev.entryMode === 'paid'
    ? fill(R.entryFrom, { e: entryLabel(opts, 'paid', lang), p: money(ev.priceFrom, ev.currency, lang) })
    : entryLabel(opts, ev.entryMode, lang);
  const linkState = ev?.ticketLinkStatus === 'ok' ? { tone: 'ok' as const, t: R.linkOk } : ev?.ticketLinkStatus === 'broken' ? { tone: 'bad' as const, t: R.linkBroken } : { tone: 'none' as const, t: R.linkUnchecked };
  const fails = ev?.quality.checks.filter((c) => !c.ok) ?? [];
  const passes = ev?.quality.checks.filter((c) => c.ok) ?? [];
  const badFactors = ev?.risk.factors.filter((f) => f.bad) ?? [];

  const changes = item?.kind === 'revision' ? item.changes ?? [] : [];
  const on: DetailTab = tab === 'changes' && !changes.length ? 'listing' : tab ?? (changes.length ? 'changes' : 'listing');
  const issues = fails.length + badFactors.length + (ev?.reports.length ?? 0);
  const said = (ev?.decisions.length ?? 0) + (ev?.thread?.messages ?? item?.threadMessages ?? 0);
  const tabs: { key: DetailTab; label: string; count?: number | null }[] = [
    ...(changes.length ? [{ key: 'changes' as const, label: R.tChanges, count: changes.length }] : []),
    { key: 'listing', label: R.tListing },
    { key: 'evidence', label: R.tEvidence, count: issues || null },
    { key: 'history', label: R.tHistory, count: said || null },
  ];
  const skel = <div className="kd-skel h-80" aria-hidden="true" />;

  return (
    <>
      <div className="kd-sec">
        <div className="flex min-w-0 flex-col gap-2.5">
          <span className="kd-m flex items-center gap-1.5"><Marker family={fam} />{waiting != null ? fill(T.submittedAgo, { g: FAMILY_LABEL[fam][lang], a: duration(waiting, lang) }) : FAMILY_LABEL[fam][lang]}</span>
          <h1 className="kd-d2">{title}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {org ? (
              <Link href={`/console/organizers?id=${org.id}`} className="kd-t flex items-center gap-2 text-fg-1 hover:underline"><Avatar org name={org.name} src={org.logoUrl} size={24} />{org.name}</Link>
            ) : <span className="kd-t">{item?.organizer.name}</span>}
            {org?.verified ?? item?.organizer.verified ? <Status tone="ok">{T.verified}</Status>
              : org?.state === 'flagged' ? <Status tone="bad">{R.flaggedOrg}</Status> : <Status tone="warn">{T.unverified}</Status>}
            {item?.organizer.newOrganizer ? <Status tone="warn">{T.newOrg}</Status> : null}
            {org?.strikes ? <Status tone="bad">{fill(R.strikes, { n: org.strikes })}</Status> : null}
            {org?.suspended ? <Status tone="bad">{R.suspended}</Status> : null}
            {ev?.submittedBy ? <Status tone="live">{fill(R.communityBy, { n: ev.submittedBy.name || ev.submittedBy.phone || '—', p: ev.submittedBy.published })}</Status> : null}
            {ev?.sourceUrl ? <a className="kd-s inline-flex items-center gap-1 hover:underline" href={ev.sourceUrl} target="_blank" rel="noopener noreferrer">{R.source}<ArrowSquareOutIcon size={13} aria-hidden="true" /></a> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ev && !inReview ? <Status>{ev.statusLabel[lang]}</Status> : null}
            {item?.kind === 'revision' ? <Status tone="warn">{R.revisionTag}</Status> : null}
            {waiting != null ? <Status tone={waiting >= 240 ? 'bad' : waiting >= 120 ? 'warn' : 'none'}>{fill(R.waitingFor, { d: duration(waiting, lang) })}</Status> : null}
            {item?.festival?.flagship ? <Status tone="live">{R.flagship}</Status> : null}
            {item?.fit ? <Status tone={FIT_TONE[item.fit.band]}>{fill(R.fitN, { n: item.fit.score })}</Status> : null}
            {ev ? <Status tone={BAND_TONE[ev.risk.band]}>{fill(ev.risk.band === 'high' ? R.riskHigh : ev.risk.band === 'medium' ? R.riskMedium : R.riskLow, { n: ev.risk.score })}</Status> : null}
          </div>
        </div>
        <div className="relative z-[27] flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            <LinkButton size="sm" tone="ghost" external href={ev?.publicUrl ?? `/e/${item?.slug ?? ''}`} target="_blank" rel="noopener"><EyeIcon size={14} aria-hidden="true" />{R.preview}</LinkButton>
            <LinkButton size="sm" tone="ghost" href={`/console/events/${id}`}><PencilSimpleIcon size={14} aria-hidden="true" />{R.fullEdit}</LinkButton>
          </div>
          {inReview ? (
            <div className="flex flex-wrap justify-end gap-2">
              {reasonMenu(T.reject, T.rejectHead, 'reject', reasons.filter((r) => !FIXABLE.has(r.code)))}
              {reasonMenu(T.fix, T.fixHead, 'fix', reasons.filter((r) => FIXABLE.has(r.code)))}
              <Button tone="acc" onClick={() => onDecide('approve', [id])}><CheckIcon size={16} aria-hidden="true" />{T.approve}</Button>
            </div>
          ) : <span className="kd-s">{R.notInQueue}</span>}
        </div>
      </div>

      {(item?.flag ?? ev?.flag) ? (
        <Panel className="flex items-center gap-3 px-4 py-3.5"><Status tone="bad">{T.flagged}</Status><span className="kd-t text-fg-1">{text((item?.flag ?? ev?.flag)!.label, lang)}</span></Panel>
      ) : null}

      {load.error && !ev ? <p role="alert" className="kd-s text-bad">{FF.errorText(load.error, lang)}</p> : null}

      <div className="flex flex-col gap-6">
        <Tabs label={R.parts} items={tabs} current={on} onSelect={(k) => onTab(k as DetailTab)} />
        <div role="tabpanel" aria-label={tabs.find((t) => t.key === on)?.label}>
          {on === 'changes' ? <Changes lang={lang} changes={changes} />
            : !ev ? skel
              : on === 'listing' ? (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] items-start gap-8">
                  <div className="flex flex-col gap-7">
                    <div className="flex flex-col gap-3">
                      <span className="kd-m">{T.inFeed}</span>
                      <article className={cx('kd-ev', g(fam))}>
                        <Art title={ev.title} family={fam} cover={ev.coverUrl} />
                        <div className="flex flex-col gap-1">
                          <span className="kd-h">{ev.title}</span>
                          <span className="kd-s flex items-center gap-1.5"><span className="kd-mk" aria-hidden="true" />{ev.startsOn ? whenShort(ev, lang) : '—'}{v?.name ? ' · ' + v.name : ''}</span>
                          <span className={cx('kd-mb kd-num', ev.entryMode === 'free' && 'text-info')}>{ev.entryMode === 'free' ? T.free : ev.priceFrom ? money(ev.priceFrom, ev.currency, lang) : '—'}</span>
                        </div>
                      </article>
                    </div>

                    <Section title={R.media}>
                      <div className="flex flex-wrap items-start gap-4">
                        <Pic key={'c' + ev.coverUrl} src={ev.coverUrl} label={R.cover} broken={R.coverBroken} none={R.noCover} ok={R.loads} className="aspect-[16/9] w-[220px]" />
                        <Pic key={'l' + ev.logoUrl} src={ev.logoUrl} label={R.logo} broken={R.logoBroken} none={R.noLogo} ok={R.loads} className="size-[84px]" />
                      </div>
                    </Section>

                    <Section title={R.description} aside={<Segmented label={R.descLang} value={desc} onChange={setDesc} options={[{ value: 'vi', label: 'VI' }, { value: 'en', label: 'EN' }]} />}>
                      <p className="kd-t whitespace-pre-line text-fg-2">{ev.description?.[desc]?.trim() || <span className="kd-s">{R.emptyText}</span>}</p>
                    </Section>
                  </div>

                  <div className="flex flex-col gap-7">
                    <Section title={R.details}>
                      <KV rows={[
                        [R.when, ev.startsOn ? <span className="kd-num">{whenLong(ev, lang)}{timeRange(ev) ? ' · ' + timeRange(ev) : ''}</span> : <span className="text-bad">{R.noDate}</span>],
                        [R.genre, (
                          <Select key={ev.genre ?? ''} aria-label={R.genre} boxClass="h-10 min-h-0 max-w-[260px]" value={ev.genre ?? ''} disabled={busy} onChange={(e) => quick({ genre: e.target.value || null }, R.genreChanged)}>
                            <option value="">{R.pickGenre}</option>
                            {(opts?.genres ?? []).map((x) => <option key={x.value} value={x.value}>{x.label[lang]}</option>)}
                          </Select>
                        )],
                        [R.venue, (
                          <span className="flex flex-col gap-1.5">
                            <span className="flex flex-wrap items-center gap-2"><span className="text-fg-1">{v?.name ?? '—'}</span><Status tone={v?.resolved ? 'ok' : 'bad'}>{v?.resolved ? R.pinned : R.noPin}</Status></span>
                            <span className="kd-s">{[v?.address, v?.area].filter(Boolean).join(' · ')}</span>
                          </span>
                        )],
                        ...(!v?.resolved ? [[R.linkVenue, (
                          <span className="flex flex-col gap-2">
                            <AsyncPick label={R.linkVenue} placeholder={R.linkVenuePh} load={loadVenues} onPick={(p) => { if (p) void quick({ venueId: p.value }, fill(R.linked, { n: p.label })); }} />
                            <LinkButton size="sm" className="self-start" href={`/console/venues${qs({ new: v?.name ?? '', address: v?.address ?? '', area: v?.area ?? '', event: id })}`}>{R.newVenue}</LinkButton>
                          </span>
                        )] as [ReactNode, ReactNode]] : []),
                        [R.entry, price],
                        [R.capAge, `${ev.capacity ? count(ev.capacity, lang) : '—'} · ${ev.age === 'All ages' ? T.allAges : ev.age}`],
                        [R.lineup, ev.lineup.length ? <span className="flex flex-wrap gap-1.5">{ev.lineup.map((a) => <span key={a} className="kd-tag">{a}</span>)}</span> : '—'],
                      ]} />
                    </Section>

                    <Section title={R.links}>
                      <KV rows={[
                        [R.ticketLink, <span key="t" className="flex flex-wrap items-center gap-2"><Ext href={ev.ticketUrl} />{ev.ticketUrl ? <Status tone={linkState.tone}>{linkState.t}</Status> : null}</span>],
                        [R.eventPage, <Ext key="e" href={ev.eventUrl} />],
                        [R.brand, <Ext key="b" href={ev.brandUrl} />],
                      ]} />
                    </Section>

                    {ev.tiers.length ? (
                      <Section title={R.tiers}>
                        <div role="table" aria-label={R.tiers} className="flex flex-col">
                          <div role="row" className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-line-1 pb-1.5">
                            <span role="columnheader" className="kd-m">{R.tierName}</span><span role="columnheader" className="kd-m text-right">{R.tierPrice}</span><span role="columnheader" className="kd-m text-right">{R.tierSold}</span>
                          </div>
                          {ev.tiers.map((x) => (
                            <div role="row" key={x.id} className="grid min-h-10 grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-line-1">
                              <span role="cell" className="kd-t text-fg-1">{text(x.name, lang)}</span>
                              <span role="cell" className="kd-num text-right text-sm">{money(x.price, ev.currency, lang)}</span>
                              <span role="cell" className="kd-s kd-num text-right">{count(x.sold, lang)}/{count(x.capacity, lang)}</span>
                            </div>
                          ))}
                        </div>
                      </Section>
                    ) : null}
                  </div>
                </div>
              ) : on === 'evidence' ? (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] items-start gap-8">
                  <div className="flex flex-col gap-7">
                    {item?.fit ? <FitPanel lang={lang} fit={item.fit} festival={item.festival ?? null} /> : null}
                    <Section title={fill(R.quality, { s: ev.quality.score })}>
                      <div className="flex flex-col">
                        {fails.map((c) => (
                          <div key={c.key} className="flex min-h-11 items-center justify-between gap-3 border-b border-line-1"><span className="kd-t text-fg-1">{c.label[lang]}</span><span className="flex items-center gap-2"><span className="kd-m kd-num">+{c.points}</span><Status tone="warn">{T.review}</Status></span></div>
                        ))}
                        {passes.length ? (
                          <Accordion small summary={<span className="kd-s">{fill(R.checksPass, { n: passes.length })}</span>}>
                            {passes.map((c) => <div key={c.key} className="flex min-h-9 items-center justify-between gap-3"><span className="kd-s">{c.label[lang]}</span><span className="flex items-center gap-2"><span className="kd-m kd-num">+{c.points}</span><Status tone="ok">{T.pass}</Status></span></div>)}
                          </Accordion>
                        ) : null}
                      </div>
                    </Section>
                  </div>

                  <div className="flex flex-col gap-7">
                    <Section title={R.riskSignals} aside={<Button size="sm" tone="ghost" disabled={rechecking} onClick={recheck}>{rechecking ? R.rechecking : R.recheck}</Button>}>
                      <ul className="flex flex-col">
                        {ev.risk.signals.map((s, i) => (
                          <li key={'s' + i} className="flex min-h-10 items-center justify-between gap-3 border-b border-line-1"><span className="kd-s text-fg-2">{s.label[lang]}</span><Status tone={s.ok ? 'ok' : 'warn'}>{s.ok ? T.pass : T.review}</Status></li>
                        ))}
                        {badFactors.map((f, i) => (
                          <li key={'f' + i} className="flex min-h-10 items-center justify-between gap-3 border-b border-line-1"><span className="kd-s text-fg-1">{f.label[lang]}</span><span className="kd-m kd-num text-bad">+{f.weight}</span></li>
                        ))}
                      </ul>
                    </Section>

                    {ev.reports.length ? (
                      <Section title={R.openReports}>
                        <div className="flex flex-wrap gap-2">{ev.reports.map((r) => <Status key={r.code} tone="bad">{text(r.label, lang) || r.code} × {r.count}</Status>)}</div>
                      </Section>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex max-w-read flex-col gap-7">
                  {ev.decisions.length ? (
                    <Section title={R.history}>
                      <ul className="flex flex-col gap-2.5">
                        {ev.decisions.map((d) => (
                          <li key={d.id} className="flex flex-col gap-0.5">
                            <span className="kd-t"><span className="text-fg-1">{d.by ?? 'FeestFinder'}</span> · {decisionLabel(d.decision, R)}{d.reason ? ' · ' + d.reason[lang] : ''}</span>
                            <span className="kd-m kd-num">{stamp(d.at, lang)}</span>
                          </li>
                        ))}
                      </ul>
                    </Section>
                  ) : null}
                  <Thread lang={lang} eventId={id} n={ev.thread?.messages ?? item?.threadMessages ?? 0} />
                </div>
              )}
        </div>
      </div>
    </>
  );
}

function entryLabel(opts: ReturnType<typeof useOptions>, mode: string, lang: Lang): string {
  const m = (opts?.entryModes as { value: string; label: Pair }[] | undefined)?.find((x) => x.value === mode);
  return m ? m.label[lang] : mode;
}

function decisionLabel(d: string, R: Strings<typeof REVIEW>): string {
  return ({ approved: R.dApproved, rejected: R.dRejected, overturned: R.dOverturned, upheld: R.dUpheld, taken_down: R.dTakenDown } as Record<string, string>)[d] ?? d;
}

/** The moderation thread with the organiser: messages, quick asks that fill the box, send. */
function Thread({ lang, eventId, n }: { lang: Lang; eventId: string; n: number }) {
  const T = pick(CONSOLE, lang);
  const R = pick(REVIEW, lang);
  const kd = useKd();
  const [data, setData] = useState<{ messages: { id: string; fromAdmin: boolean; body: Pair; createdAt: string }[]; quickAsks: { key: string; label: Pair; text: Pair }[] } | null>(null);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => setData(await FF.maybe(FF.get(`/admin/listings/${eventId}/thread`), { messages: [], quickAsks: [] })), [eventId]);
  useEffect(() => { if (n) void load(); }, [n, load]);
  const send = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      const m = await FF.post(`/admin/listings/${eventId}/thread`, { body: body.trim() });
      setData((d) => (d ? { ...d, messages: [...d.messages, m] } : d));
      setBody('');
      kd.toast(R.sent);
    } catch (e) { kd.toast(FF.errorText(e, lang)); } finally { setBusy(false); }
  };
  return (
    <Accordion small open={n > 0 || undefined} summary={T.thread} aside={(data?.messages.length ?? n) || null} onToggle={(open) => { if (open && !data && !n) void load(); }}>
      <div className="flex flex-col gap-3">
        {data && !data.messages.length ? <span className="kd-s">{R.noMsgs}</span> : null}
        {(data?.messages ?? []).map((m) => (
          <div key={m.id} className={cx('flex max-w-[85%] flex-col gap-1', m.fromAdmin ? 'self-end items-end' : 'self-start')}>
            <span className={cx('whitespace-pre-line rounded-xl px-3 py-2 text-sm', m.fromAdmin ? 'bg-fg-1 text-on-inverse' : 'bg-white/[0.06] text-fg-1')}>{m.body[lang]}</span>
            <span className="kd-m kd-num">{m.fromAdmin ? 'FeestFinder' : R.orgWord} · {agoIso(m.createdAt, lang)}</span>
          </div>
        ))}
        {data?.quickAsks.length ? (
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={R.quickAsk}>
            <span className="kd-m">{R.quickAsk}</span>
            {data.quickAsks.map((q) => <Chip key={q.key} onClick={() => setBody(q.text[lang])}>{q.label[lang]}</Chip>)}
          </div>
        ) : null}
        <TextArea rows={3} maxLength={2000} value={body} placeholder={T.threadPh} aria-label={T.thread} onChange={(e) => setBody(e.target.value)} />
        <Button className="self-end" disabled={!body.trim() || busy} onClick={send}>{T.send}</Button>
      </div>
    </Accordion>
  );
}

const REVIEW_COLUMNS = ['title', 'starts_on', 'ends_on', 'start_time', 'end_time', 'venue_id', 'venue_name', 'address', 'area', 'lat', 'lng', 'city', 'entry_mode', 'price_from', 'cover_url'];

/** An organiser's change to a live listing, before and after, field by field (the API's revisionChanges). */
function Changes({ lang, changes }: { lang: Lang; changes: { field: string; before: unknown; after: unknown }[] }) {
  const R = pick(REVIEW, lang);
  const names = R.fieldNames.split('|');
  const show = (v: unknown) => (v == null || v === '' ? '—' : String(v));
  const rows = changes.filter((c) => c.field !== 'venue_id' && c.field !== 'lng');
  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5" role="group" aria-label={R.revisionHead}>
      <span className="kd-m">{R.revisionHead}</span>
      {rows.map((c) => (
        <div key={c.field} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_minmax(0,1fr)] items-baseline gap-3 kd-s">
          <span className="kd-m">{names[REVIEW_COLUMNS.indexOf(c.field)] ?? c.field}</span>
          <span className="min-w-0 break-words text-fg-3 line-through" title={R.before}>{show(c.before)}</span>
          <span className="min-w-0 break-words text-fg-1" title={R.after}>{show(c.after)}</span>
        </div>
      ))}
    </div>
  );
}

/** Why a listing does or does not suit FeestFinder (festfinder-backend services/ingest/fit.ts), each reason with its points. */
function FitPanel({ lang, fit, festival }: { lang: Lang; fit: NonNullable<Item['fit']>; festival: Item['festival'] | null }) {
  const R = pick(REVIEW, lang);
  const tone = fit.band === 'recommend' ? 'ok' : fit.band === 'consider' ? 'warn' : 'bad';
  return (
    <section className="flex w-full flex-col gap-2" aria-label={R.fitHead}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="kd-m">{R.fitHead}</span>
        <Status tone={tone}>{`${fit.score} · ${fit.bandLabel[lang]}`}</Status>
        {festival?.flagship ? <Status tone="live">{R.flagship}</Status> : null}
      </div>
      <ul className="flex flex-col">
        {fit.reasons.map((r) => (
          <li key={r.key} className="kd-s flex items-baseline justify-between gap-3 border-t border-line-1 py-1.5">
            <span className="min-w-0">{r.label[lang]}</span>
            <span className={cx('kd-num shrink-0', r.points > 0 ? 'text-fg-1' : r.points < 0 ? 'text-bad' : 'text-fg-3')}>{r.points > 0 ? `+${r.points}` : r.points || '·'}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
