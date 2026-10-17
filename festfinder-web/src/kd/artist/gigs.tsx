'use client';
/**
 * /studio/artist/gigs: the artist's side of bookings, in tabs kept in the address (?tab=). What
 * they applied to (withdraw while it is sent or shortlisted), booking requests from organisers
 * (interested or decline, with a reply), the dates they are free or busy, and the gigs they
 * report. A reported gig is matched like an import: it joins the event already listed or waits
 * for a moderator, and the organiser decides who is on their lineup.
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PlusIcon, SealCheckIcon, TrashIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { pick, type Lang, type Pair } from '../copy';
import { dayMonth } from '../format';
import { KdLink } from '../link';
import { useKd } from '../runtime';
import { Button, IconButton } from '../ui/actions';
import { Input, Select, TextArea } from '../ui/forms';
import { Status } from '../ui/parts';
import { Sheet } from '../ui/sheet';
import { Row, Table, Tabs } from '../ui/shell';
import { act, Body, Empty, Field, Loaded, PageHead, useAsk, useLoad, useOptions, useQuery } from '../console/kit';
import { ARTIST } from './copy';
import { Block, feeText, statusOf } from './parts';
import { useArtist } from './root';

type Tab = 'mine' | 'requests' | 'dates' | 'report';
const TABS: Tab[] = ['mine', 'requests', 'dates', 'report'];

interface Application {
  id: string; status: string; message: string; createdAt: string;
  gig: { id: string; title: string; startsOn: string; cityLabel: Pair | null; organizer?: { slug: string; name: string } };
}
interface Inquiry {
  id: string; eventOn: string; cityLabel: Pair | null; message: string; feeOffer: number | null; currency: string; status: string; reply: string | null;
  organizer?: { slug: string; name: string; verified: boolean };
}
interface Window { from: string; to: string; kind: 'available' | 'unavailable'; city: string; note: string }
interface Report {
  id: string; outcome: string; createdAt: string;
  report: { title: string; startsOn: string; venueName: string };
  event: { slug: string; title: string; status: string; startsOn: string } | null; onLineup: boolean;
}

export function ArtistGigs() {
  const { lang } = useArtist();
  const T = pick(ARTIST, lang);
  const [params, setParams] = useQuery();
  const tab: Tab = TABS.includes(params.get('tab') as Tab) ? params.get('tab') as Tab : 'mine';
  return (
    <>
      <PageHead title={T.gigs} />
      <Body>
        <Tabs
          label={T.gigs}
          current={tab}
          onSelect={(k) => setParams({ tab: k === 'mine' ? null : k })}
          items={[
            { key: 'mine', label: T.tabMine },
            { key: 'requests', label: T.tabRequests },
            { key: 'dates', label: T.tabDates },
            { key: 'report', label: T.tabReport },
          ]}
        />
        {tab === 'requests' ? <Requests lang={lang} /> : tab === 'dates' ? <Availability lang={lang} /> : tab === 'report' ? <Reported lang={lang} /> : <Mine lang={lang} />}
      </Body>
    </>
  );
}

// ---- applications -------------------------------------------------------------------------

const MINE_COLS = 'minmax(240px,2fr) minmax(140px,1fr) minmax(100px,auto)';

function Mine({ lang }: { lang: Lang }) {
  const T = pick(ARTIST, lang);
  const kd = useKd();
  const ask = useAsk();
  const load = useLoad<{ items: Application[] }>('/me/artist/applications');
  const withdraw = async (a: Application) => {
    if (!await ask({ title: T.withdrawAsk, body: a.gig.title, confirm: T.withdraw, danger: true })) return;
    if (await act(kd, lang, () => FF.post(`/me/artist/applications/${a.id}/withdraw`))) { kd.toast(T.withdrawn); load.reload(); }
  };
  return (
    <Loaded load={load}>
      {({ items }) => !items.length ? <Empty title={T.noApplications} /> : (
        <Table cols={MINE_COLS} label={T.tabMine} head={[T.gig, T.status, '']}>
          {items.map((a) => {
            const st = statusOf(a.status, lang);
            return (
              <Row key={a.id} cols={MINE_COLS} className="py-3">
                <span role="cell" className="flex min-w-0 flex-col gap-0.5">
                  <span className="kd-hs kd-ell">{a.gig.title}</span>
                  <span className="kd-s kd-num">{[a.gig.organizer?.name, dayMonth(a.gig.startsOn, lang), a.gig.cityLabel?.[lang]].filter(Boolean).join(' · ')}</span>
                  {a.message ? <span className="kd-s kd-ell">{a.message}</span> : null}
                </span>
                <span role="cell"><Status tone={st.tone}>{st.label}</Status></span>
                <span role="cell" className="flex justify-end">
                  {['sent', 'shortlisted'].includes(a.status) ? <Button size="sm" onClick={() => withdraw(a)} aria-label={`${T.withdraw} · ${a.gig.title}`}>{T.withdraw}</Button> : null}
                </span>
              </Row>
            );
          })}
        </Table>
      )}
    </Loaded>
  );
}

// ---- booking requests ---------------------------------------------------------------------

const REQ_COLS = 'minmax(160px,1fr) minmax(140px,auto) minmax(220px,2fr) minmax(120px,auto) minmax(120px,auto)';

function Requests({ lang }: { lang: Lang }) {
  const T = pick(ARTIST, lang);
  const kd = useKd();
  const load = useLoad<{ items: Inquiry[] }>('/me/artist/inquiries');
  const [answer, setAnswer] = useState<Inquiry | null>(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async (accept: boolean) => {
    if (!answer) return;
    setBusy(true);
    const ok = await act(kd, lang, () => FF.post(`/me/artist/inquiries/${answer.id}`, { accept, reply: reply.trim() }));
    setBusy(false);
    if (ok) { kd.toast(T.answered); setAnswer(null); setReply(''); load.reload(); }
  };
  return (
    <>
      <Loaded load={load}>
        {({ items }) => !items.length ? <Empty title={T.noRequests} /> : (
          <Table cols={REQ_COLS} label={T.tabRequests} head={[T.from, T.date, T.message, T.fee, '']}>
            {items.map((i) => {
              const st = statusOf(i.status, lang);
              const who = i.organizer?.name ?? '—';
              return (
                <Row key={i.id} cols={REQ_COLS} className="py-3">
                  <span role="cell" className="flex min-w-0 items-center gap-1.5">
                    {i.organizer ? <KdLink className="kd-hs kd-ell hover:underline" href={'/o/' + i.organizer.slug}>{who}</KdLink> : <span className="kd-hs">{who}</span>}
                    {i.organizer?.verified ? <SealCheckIcon size={16} weight="fill" className="shrink-0 text-info" role="img" aria-label={T.verified} /> : null}
                  </span>
                  <span role="cell" className="kd-s kd-num">{[dayMonth(i.eventOn, lang), i.cityLabel?.[lang]].filter(Boolean).join(' · ')}</span>
                  <span role="cell" className="flex min-w-0 flex-col gap-1">
                    <span className="kd-s whitespace-pre-line text-fg-2">{i.message}</span>
                    {i.reply ? <span className="kd-s border-l-2 border-line-2 pl-3">{T.yourReply}: {i.reply}</span> : null}
                  </span>
                  <span role="cell" className="kd-num text-right text-fg-1">{feeText(i.feeOffer, null, i.currency, lang)}</span>
                  <span role="cell" className="flex justify-end">
                    {i.status === 'sent'
                      ? <Button size="sm" tone="acc" onClick={() => { setReply(''); setAnswer(i); }} aria-label={`${T.answer} · ${who}`}>{T.answer}</Button>
                      : <Status tone={st.tone}>{st.label}</Status>}
                  </span>
                </Row>
              );
            })}
          </Table>
        )}
      </Loaded>
      {answer ? (
        <Sheet title={answer.organizer?.name ?? T.answer} closeLabel={T.close} onClose={() => setAnswer(null)}>
          <div className="flex flex-col gap-4 pt-1">
            <span className="kd-s kd-num">{[dayMonth(answer.eventOn, lang), answer.cityLabel?.[lang], answer.feeOffer != null ? feeText(answer.feeOffer, null, answer.currency, lang) : null].filter(Boolean).join(' · ')}</span>
            <p className="kd-s whitespace-pre-line text-fg-2">{answer.message}</p>
            <Field label={<>{T.reply} <span className="font-normal text-fg-3">{T.optional}</span></>} htmlFor="ar-reply">
              <TextArea id="ar-reply" rows={4} maxLength={2000} value={reply} onChange={(e) => setReply(e.target.value)} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button disabled={busy} onClick={() => send(false)}>{T.decline}</Button>
              <Button tone="acc" disabled={busy} onClick={() => send(true)}>{T.accept}</Button>
            </div>
          </div>
        </Sheet>
      ) : null}
    </>
  );
}

// ---- availability -------------------------------------------------------------------------

function Availability({ lang }: { lang: Lang }) {
  const T = pick(ARTIST, lang);
  const kd = useKd();
  const options = useOptions();
  const load = useLoad<{ items: (Omit<Window, 'city'> & { city: string | null })[] }>('/me/artist/availability');
  const [rows, setRows] = useState<Window[] | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (load.data) setRows(load.data.items.map((w) => ({ from: w.from, to: w.to, kind: w.kind, city: w.city ?? '', note: w.note ?? '' }))); }, [load.data]);
  const cities = useMemo(() => (options?.cities ?? []).map((c) => ({ value: c.value, label: c.label[lang] })), [options, lang]);
  const set = (i: number, patch: Partial<Window>) => setRows((rs) => rs!.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!rows) return;
    setBusy(true);
    if (await act(kd, lang, () => FF.put('/me/artist/availability', { items: rows.filter((r) => r.from && r.to).map((r) => ({ ...r, city: r.city || null, note: r.note.trim() })) }))) load.reload();
    setBusy(false);
  };
  if (load.error && !load.data) return <Loaded load={load}>{() => null}</Loaded>;
  if (!rows) return <div className="kd-skel h-40" aria-hidden="true" />;
  return (
    <Block title={T.tabDates}>
      <form className="flex flex-col gap-3" onSubmit={save}>
        {!rows.length ? <span className="kd-s">{T.noDates}</span> : null}
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] items-end gap-3 border-b border-line-1 pb-3" role="group" aria-label={`${T.tabDates} ${i + 1}`}>
            <Field label={T.dateFrom} htmlFor={`av-from-${i}`}><Input id={`av-from-${i}`} type="date" required value={r.from} onChange={(e) => set(i, { from: e.target.value })} /></Field>
            <Field label={T.dateTo} htmlFor={`av-to-${i}`}><Input id={`av-to-${i}`} type="date" required min={r.from || undefined} value={r.to} onChange={(e) => set(i, { to: e.target.value })} /></Field>
            <Field label={T.status} htmlFor={`av-kind-${i}`}>
              <Select id={`av-kind-${i}`} value={r.kind} onChange={(e) => set(i, { kind: e.target.value as Window['kind'] })}>
                <option value="available">{T.free}</option>
                <option value="unavailable">{T.busy}</option>
              </Select>
            </Field>
            <Field label={T.inCity} htmlFor={`av-city-${i}`}>
              <Select id={`av-city-${i}`} value={r.city} onChange={(e) => set(i, { city: e.target.value })}>
                <option value="">—</option>
                {cities.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </Field>
            <div className="flex items-end gap-2">
              <Field label={T.note} htmlFor={`av-note-${i}`}><Input id={`av-note-${i}`} maxLength={200} value={r.note} onChange={(e) => set(i, { note: e.target.value })} /></Field>
              <IconButton label={T.removeDates} line size="sm" className="mb-1.5" onClick={() => setRows((rs) => rs!.filter((_, j) => j !== i))}><TrashIcon size={16} aria-hidden="true" /></IconButton>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button disabled={rows.length >= 50} onClick={() => setRows((rs) => [...rs!, { from: '', to: '', kind: 'available', city: '', note: '' }])}><PlusIcon size={16} aria-hidden="true" />{T.addDates}</Button>
          <Button tone="acc" type="submit" disabled={busy}>{T.save}</Button>
        </div>
      </form>
    </Block>
  );
}

// ---- reported gigs ------------------------------------------------------------------------

const REP_COLS = 'minmax(240px,2fr) minmax(140px,1fr) minmax(170px,1fr)';
const blank = () => ({ title: '', startsOn: '', startTime: '', city: '', venueName: '', address: '', ticketUrl: '', with: '' });

function Reported({ lang }: { lang: Lang }) {
  const T = pick(ARTIST, lang);
  const kd = useKd();
  const options = useOptions();
  const load = useLoad<{ items: Report[] }>('/me/artist/gigs');
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof ReturnType<typeof blank>) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const timeOk = !f.startTime || /^([01]\d|2[0-3]):[0-5]\d$/.test(f.startTime);
  const ok = f.title.trim().length >= 3 && !!f.startsOn && !!f.city && f.venueName.trim().length >= 2 && timeOk;
  const statusLabel = (s: string) => options?.statuses?.find((x: { value: string }) => x.value === s)?.label?.[lang] ?? s;
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!ok) return;
    setBusy(true);
    const out = await act(kd, lang, () => FF.post('/me/artist/gigs', {
      title: f.title.trim(), startsOn: f.startsOn, startTime: f.startTime || null, city: f.city, venueName: f.venueName.trim(),
      address: f.address.trim() || null, ticketUrl: f.ticketUrl.trim() || null,
      with: [...new Set(f.with.split(',').map((x) => x.trim()).filter(Boolean))].slice(0, 30),
    }));
    setBusy(false);
    if (out) { setF(blank()); load.reload(); }
  };
  return (
    <div className="kd-split gap-3">
      <div className="kd-main flex flex-col gap-3">
        <Loaded load={load}>
          {({ items }) => !items.length ? <Empty title={T.noReports} /> : (
            <Table cols={REP_COLS} label={T.tabReport} head={[T.gig, T.status, T.lineup]}>
              {items.map((r) => (
                <Row key={r.id} cols={REP_COLS} className="py-3">
                  <span role="cell" className="flex min-w-0 flex-col gap-0.5">
                    {/* Only a public listing has a page: one still in review would answer 404. */}
                    {r.event?.status === 'live' ? <KdLink className="kd-hs kd-ell hover:underline" href={'/e/' + r.event.slug}>{r.event.title}</KdLink> : <span className="kd-hs kd-ell">{r.event?.title ?? r.report.title}</span>}
                    <span className="kd-s kd-num">{[dayMonth(r.event?.startsOn ?? r.report.startsOn, lang), r.report.venueName].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span role="cell">{r.event ? <Status tone={r.event.status === 'live' ? 'ok' : r.event.status === 'in_review' ? 'warn' : r.event.status === 'rejected' ? 'bad' : 'none'}>{statusLabel(r.event.status)}</Status> : <Status tone="bad">{T.notTaken}</Status>}</span>
                  <span role="cell">{!r.event ? null : r.onLineup ? <Status tone="ok">{T.onLineup}</Status> : <Status tone="warn">{T.waitLineup}</Status>}</span>
                </Row>
              ))}
            </Table>
          )}
        </Loaded>
      </div>
      <Block title={T.reportGig} className="kd-side self-start">
        <form className="flex flex-col gap-3" onSubmit={send}>
          <Field label={T.eventName} htmlFor="rg-title"><Input id="rg-title" required maxLength={160} value={f.title} onChange={(e) => set('title')(e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={T.date} htmlFor="rg-date"><Input id="rg-date" type="date" required value={f.startsOn} onChange={(e) => set('startsOn')(e.target.value)} /></Field>
            <Field label={T.startTime} htmlFor="rg-time" hint="HH:MM" error={timeOk ? null : 'HH:MM'}><Input id="rg-time" type="time" value={f.startTime} invalid={!timeOk} onChange={(e) => set('startTime')(e.target.value)} /></Field>
          </div>
          <Field label={T.city} htmlFor="rg-city">
            <Select id="rg-city" required value={f.city} onChange={(e) => set('city')(e.target.value)}>
              <option value="">—</option>
              {(options?.cities ?? []).map((c) => <option key={c.value} value={c.value}>{c.label[lang]}</option>)}
            </Select>
          </Field>
          <Field label={T.venue} htmlFor="rg-venue"><Input id="rg-venue" required maxLength={160} value={f.venueName} onChange={(e) => set('venueName')(e.target.value)} /></Field>
          <Field label={<>{T.address} <span className="font-normal text-fg-3">{T.optional}</span></>} htmlFor="rg-address"><Input id="rg-address" maxLength={240} value={f.address} onChange={(e) => set('address')(e.target.value)} /></Field>
          <Field label={<>{T.ticketLink} <span className="font-normal text-fg-3">{T.optional}</span></>} htmlFor="rg-link"><Input id="rg-link" type="url" inputMode="url" placeholder="https://" maxLength={500} value={f.ticketUrl} onChange={(e) => set('ticketUrl')(e.target.value)} /></Field>
          <Field label={<>{T.playingWith} <span className="font-normal text-fg-3">{T.optional}</span></>} htmlFor="rg-with" hint={T.playingWithHint}><Input id="rg-with" value={f.with} onChange={(e) => set('with')(e.target.value)} /></Field>
          <Button tone="acc" type="submit" className="self-start" disabled={busy || !ok}>{T.send}</Button>
        </form>
      </Block>
    </div>
  );
}
