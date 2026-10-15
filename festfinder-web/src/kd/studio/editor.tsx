'use client';
/**
 * /studio/events/<id>: one listing, whatever its status, with every field the API takes, in
 * six sections (basics; date and time; venue; tickets and entry; lineup; images and links).
 * Drafts and listings sent back save themselves a moment after a change; a listing in review or
 * live saves on the button (or Ctrl/⌘+S), and asks first when the change sends it back to review
 * (the API's REVIEWED_FIELDS). Sent back: the moderator's reason and note, and the appeal.
 * Below the form: the hype goals, and on a live listing the updates posted on the night.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowUpRightIcon, DotsThreeIcon, TrashIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { cx } from '../cx';
import { STYLE_LABEL, styleLabel } from '../genre';
import { KdLink } from '../link';
import { useKd } from '../runtime';
import { Button, buttonClass, Chip, IconButton } from '../ui/actions';
import { FieldError, FieldLabel, Input, Segmented, Select, SwitchRow, TextArea } from '../ui/forms';
import { Menu, MenuItem, MenuSeparator } from '../ui/menu';
import { Card as Panel, Status } from '../ui/parts';
import { act, ErrorBox, stamp, useAsk, useOptions } from '../console/kit';
import { STUDIO } from './copy';
import { missingText } from './events';
import { statusTone } from './head';
import { Block, Page } from './parts';
import { useStudio } from './root';
import { Appeal, Lineup, newTier, Tiers, Upload, VenueField, type Tier, type Venue } from './wizard';

const STYLES = Object.keys(STYLE_LABEL);
const STYLE_MAX = 5;
const AGES = ['All ages', '16+', '18+'];
/** Edits to these on a live listing send it back to review (organizer/events.ts REVIEWED_FIELDS). */
const REVIEWED = ['title', 'startsOn', 'endsOn', 'startTime', 'endTime', 'venueId', 'venueName', 'entryMode', 'priceFrom', 'coverUrl'];
/** The sections a reviewed field lives in, tagged on a live listing. */
const REVIEWED_SECTIONS = new Set(['basics', 'when', 'where', 'tickets', 'media']);

interface SavedTier { key: string; name: Pair; note: Pair | null; price: number; capacity: number; sold: number; isLast: boolean; salesOpenAt: string | null; priceRiseOn: string | null; priceRiseTo: number | null }
interface Listing {
  id: string; slug: string; status: string; statusLabel: Pair; title: string; styles: string[]; eventType: string | null; description: Pair | null;
  city: string; currency: string; logoUrl: string | null; coverUrl: string | null;
  startsOn: string | null; endsOn: string | null; startTime: string | null; endTime: string | null;
  venue: { id: string | null; name: string | null; address: string | null; area: string | null };
  entryMode: 'free' | 'paid' | 'donation'; priceFrom: number; capacity: number | null; age: string | null; lineup: string[] | null;
  ticketUrl: string | null; eventUrl: string | null; brandUrl: string | null; submittedAt: string | null;
  quality: { score: number; bandLabel: Pair; checks: { key: string; ok: boolean; points: number; label: Pair }[] };
  tiers?: SavedTier[];
  moderation?: { reason: Pair | null; message: string | null; decidedAt: string; appeal: { state: string; closesAt: string } | null } | null;
}
interface Form {
  title: string; styles: string[]; eventType: string; age: string; descVi: string; descEn: string;
  multiDay: boolean; startsOn: string; endsOn: string; startTime: string; endTime: string;
  venueId: string | null; venueName: string; city: string; area: string; address: string;
  entryMode: 'free' | 'paid' | 'donation'; price: string; capacity: string; ticketUrl: string; sellHere: boolean; tiers: Tier[];
  lineup: string[]; logoUrl: string | null; coverUrl: string | null; eventUrl: string; brandUrl: string;
}

const isUrl = (s: string) => /^https?:\/\/\S+\.\S+/.test(s.trim());
const int = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;

function fromListing(d: Listing): Form {
  return {
    title: d.title === 'Untitled event' ? '' : d.title, styles: (d.styles ?? []).filter((k) => STYLE_LABEL[k]), eventType: d.eventType ?? '',
    age: AGES.includes(d.age ?? '') ? d.age! : 'All ages', descVi: d.description?.vi ?? '', descEn: d.description?.en ?? '',
    multiDay: !!(d.endsOn && d.startsOn && d.endsOn !== d.startsOn), startsOn: d.startsOn ?? '', endsOn: d.endsOn ?? '', startTime: d.startTime ?? '', endTime: d.endTime ?? '',
    venueId: d.venue.id, venueName: d.venue.name ?? '', city: d.city, area: d.venue.id ? '' : d.venue.area ?? '', address: d.venue.id ? '' : d.venue.address ?? '',
    entryMode: d.entryMode, price: d.priceFrom ? String(d.priceFrom) : '', capacity: d.capacity ? String(d.capacity) : '', ticketUrl: d.ticketUrl ?? '',
    sellHere: !!d.tiers?.length,
    tiers: (d.tiers ?? []).map((t) => ({ key: t.key, name: t.name.vi || t.name.en, price: String(t.price), capacity: String(t.capacity), sold: t.sold })),
    lineup: d.lineup ?? [], logoUrl: d.logoUrl, coverUrl: d.coverUrl, eventUrl: d.eventUrl ?? '', brandUrl: d.brandUrl ?? '',
  };
}

/** The listing fields the API takes (organizer/events.ts DraftInput), from the form. */
function payload(f: Form) {
  const link = (s: string) => (s.trim() ? s.trim() : null);
  return {
    title: f.title.trim(), genre: 'EDM', styles: f.styles, eventType: f.eventType || null, age: f.age,
    description: { vi: f.descVi.trim(), en: f.descEn.trim() },
    startsOn: f.startsOn || null, endsOn: f.startsOn ? (f.multiDay && f.endsOn ? f.endsOn : f.startsOn) : null,
    startTime: f.startTime || null, endTime: f.endTime || null,
    venueId: f.venueId, venueName: f.venueName.trim() || null,
    ...(f.venueId ? {} : { city: f.city, area: f.area.trim() || null, address: f.address.trim() || null }),
    entryMode: f.entryMode,
    ...(f.entryMode !== 'paid' ? { priceFrom: 0 } : f.sellHere ? {} : { priceFrom: int(f.price) }),
    capacity: f.capacity ? int(f.capacity) || null : null,
    ticketUrl: link(f.ticketUrl), lineup: f.lineup, logoUrl: f.logoUrl, coverUrl: f.coverUrl, eventUrl: link(f.eventUrl), brandUrl: link(f.brandUrl),
  };
}

/** Tiers for PUT …/tiers: what the form edits, keeping what it doesn't (last tier, note, sale times, price rise). */
function tierBody(f: Form, saved: SavedTier[]) {
  return f.tiers.filter((t) => t.name.trim() && int(t.price) > 0 && int(t.capacity) > 0).map((t) => {
    const o = saved.find((x) => x.key === t.key);
    return {
      key: t.key, name: { vi: t.name.trim(), en: o && o.name.vi === t.name.trim() ? o.name.en : t.name.trim() }, price: int(t.price), capacity: int(t.capacity),
      isLast: o?.isLast ?? false, note: o?.note ?? null, salesOpenAt: o?.salesOpenAt ?? null, priceRiseOn: o?.priceRiseOn ?? null, priceRiseTo: o?.priceRiseTo ?? null,
    };
  });
}

/** What submit still needs: the API's missingForSubmit, read from the form. */
function missingOf(f: Form) {
  const m: string[] = [];
  if (!f.title.trim()) m.push('title');
  if (!f.startsOn || !f.startTime || !f.endTime) m.push('dates');
  if (!f.venueName.trim()) m.push('venue');
  if (f.entryMode === 'paid' && (!(f.sellHere ? f.tiers.some((t) => int(t.price) > 0) : int(f.price) > 0) || !f.ticketUrl.trim())) m.push('price');
  if (!f.logoUrl) m.push('logo');
  if (!f.eventUrl.trim()) m.push('eventUrl');
  return m;
}

export function EventEditor({ id }: { id: string }) {
  const { lang, events, reload } = useStudio();
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const ask = useAsk();
  const router = useRouter();
  const opts = useOptions();
  const [d, setD] = useState<Listing | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [f, setF] = useState<Form | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [save, setSave] = useState<{ state: 'idle' | 'saving' | 'saved' | 'error'; at?: string; error?: string }>({ state: 'idle' });
  const [busy, setBusy] = useState(false);
  const base = useRef('');
  const tierBase = useRef('[]');

  const load = useCallback(async () => {
    setError(null);
    try {
      const out: Listing = await FF.get('/organizer/events/' + encodeURIComponent(id));
      const form = fromListing(out);
      base.current = JSON.stringify(payload(form));
      tierBase.current = JSON.stringify(tierBody(form, out.tiers ?? []));
      setD(out);
      setF(form);
      setSave({ state: 'idle' });
    } catch (e) { setError(e); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { FF.maybe(FF.get('/venues?limit=200'), { items: [] }).then((v: { items: Venue[] }) => setVenues(v.items)); }, []);

  const body = useMemo(() => (f ? payload(f) : null), [f]);
  const tiers = useMemo(() => (f && d ? tierBody(f, d.tiers ?? []) : []), [f, d]);
  const changed = useMemo(() => {
    if (!body) return [] as string[];
    const was = JSON.parse(base.current || '{}') as Record<string, unknown>;
    return Object.keys(body).filter((k) => JSON.stringify((body as Record<string, unknown>)[k]) !== JSON.stringify(was[k]));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- base moves with save()
  }, [body, save]);
  const currency = opts?.cities.find((c) => c.value === (f?.venueId ? d?.city : f?.city))?.currency ?? d?.currency ?? 'VND';
  const canSellHere = currency === 'VND';
  const tiersChanged = !!f && f.entryMode === 'paid' && f.sellHere && canSellHere && tiers.length > 0 && JSON.stringify(tiers) !== tierBase.current;
  const dirty = changed.length > 0 || tiersChanged;
  const readOnly = !!d && ['removed', 'cancelled'].includes(d.status);
  const draftLike = !!d && ['draft', 'rejected'].includes(d.status);
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!f) return e;
    for (const k of ['ticketUrl', 'eventUrl', 'brandUrl'] as const) if (f[k].trim() && !isUrl(f[k])) e[k] = T.fUrlRule;
    if (f.multiDay && f.endsOn && f.startsOn && f.endsOn < f.startsOn) e.endsOn = T.endBeforeStart;
    return e;
  }, [f, T]);
  const valid = !Object.keys(errors).length;

  /** Saves what changed. `quiet` is the autosave: no confirm, no toast, and it never sends a live listing back. */
  const persist = async (quiet: boolean): Promise<Listing | null> => {
    if (!d || !f || !body || readOnly) return null;
    if (!dirty) return d;
    if (!valid) { if (!quiet) kd.toast(T.checkFields); return null; }
    const sendsBack = d.status === 'live' && changed.some((k) => REVIEWED.includes(k));
    if (sendsBack) {
      if (quiet) return null;
      if (!(await ask({ title: T.reAskTitle, body: T.reAskBody, confirm: T.resubmit }))) return null;
    }
    setSave({ state: 'saving' });
    try {
      let out: Listing = d;
      if (changed.length) {
        const diff = Object.fromEntries(changed.map((k) => [k, (body as Record<string, unknown>)[k]]));
        // A venue picked from the list says the city; a typed one carries its own.
        if ('venueId' in diff || 'venueName' in diff) Object.assign(diff, { venueId: body.venueId, venueName: body.venueName });
        const res = await FF.patch('/organizer/events/' + d.id, diff);
        if (!quiet && res.message) kd.toast(FF.text(res.message, lang));
        out = { ...d, ...res };
      }
      base.current = JSON.stringify(body);
      if (tiersChanged) {
        await FF.put(`/organizer/events/${d.id}/tiers`, { tiers });
        tierBase.current = JSON.stringify(tiers);
        out = await FF.get('/organizer/events/' + d.id);
      }
      setD(out);
      setSave({ state: 'saved', at: new Date().toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) });
      if (!quiet && !changed.length) kd.toast(T.saved);
      if (out.status !== d.status || changed.includes('title')) reload();
      return out;
    } catch (e) {
      setSave({ state: 'error', error: FF.errorText(e, lang) });
      if (!quiet) kd.toast(FF.errorText(e, lang));
      return null;
    }
  };

  // Drafts and listings sent back save themselves a moment after the last change.
  useEffect(() => {
    if (!draftLike || !dirty || !valid) return;
    const t = setTimeout(() => { persist(true); }, 1500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- persist reads the latest render
  }, [f, draftLike]);
  // Ctrl/⌘+S saves; leaving with unsaved changes asks the browser first.
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); persist(false); } };
    const leave = (e: BeforeUnloadEvent) => { if (dirty && !readOnly) e.preventDefault(); };
    addEventListener('keydown', key);
    addEventListener('beforeunload', leave);
    return () => { removeEventListener('keydown', key); removeEventListener('beforeunload', leave); };
  });

  if (error && !d) return <Page><ErrorBox error={error} retry={load} /></Page>;
  if (!d || !f) return <Page><div className="kd-skel h-80" aria-hidden="true" /></Page>;

  const set = (p: Partial<Form>) => setF((x) => (x ? { ...x, ...p } : x));
  const missing = missingOf(f);
  const live = d.status === 'live';
  const tag = (sec: string) => (live && REVIEWED_SECTIONS.has(sec) ? <Status tone="warn">{T.reReview}</Status> : undefined);
  const recent = [...new Set(events.map((e) => e.venueName).filter((n): n is string => !!n))].slice(0, 4);
  const appealOpen = d.moderation?.appeal?.state === 'open' && new Date(d.moderation.appeal.closesAt) > FF.now();

  const submit = async () => {
    if (missing.length) { kd.toast(fill(T.stillMissing, { m: missingText(missing, lang) })); return; }
    setBusy(true);
    const saved = await persist(false);
    if (saved) {
      try {
        const out = await FF.post(`/organizer/events/${d.id}/submit`);
        kd.toast(FF.text(out.message, lang));
        await reload();
        router.push('/studio/events?status=in_review');
      } catch (e) {
        const miss = (e as { details?: { missing?: string[] } }).details?.missing;
        kd.toast(miss ? fill(T.stillMissing, { m: missingText(miss, lang) }) : FF.errorText(e, lang));
      }
    }
    setBusy(false);
  };
  const duplicate = async () => {
    const out = await act(kd, lang, () => FF.post(`/organizer/events/${d.id}/duplicate`));
    if (out?.id) { await reload(); router.push('/studio/events/' + out.id); }
  };
  const remove = async () => {
    if (!(await ask({ title: T.deleteDraftAsk, body: d.title, confirm: T.deleteDraft, danger: true }))) return;
    if (await act(kd, lang, () => FF.del('/organizer/events/' + d.id))) { kd.toast(T.deleted); await reload(); router.push('/studio/events'); }
  };

  const saveLine = readOnly ? T.notEditable : save.state === 'saving' ? T.wSaving : save.state === 'error' ? fill(T.wNotSaved, { m: save.error ?? '' })
    : dirty ? (draftLike ? T.wSaving : T.unsaved) : save.state === 'saved' ? fill(T.wSaved, { t: save.at ?? '' }) : T.saved;
  const field = (fid: string, label: ReactNode, input: ReactNode, err?: string, hint?: ReactNode) => (
    <div className="flex min-w-0 flex-col gap-2">
      <FieldLabel htmlFor={fid} hint={hint}>{label}</FieldLabel>
      {input}
      {err ? <FieldError>{err}</FieldError> : null}
    </div>
  );
  const grid = 'grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3';

  return (
    <Page>
      <div className="kd-sec items-end pb-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <KdLink href="/studio/events" className="kd-m flex items-center gap-1.5 hover:text-paper"><ArrowLeftIcon size={14} aria-hidden="true" />{T.myEvents}</KdLink>
          <h1 className="kd-d2 kd-ell">{f.title.trim() || T.noTitle}</h1>
          <span className="kd-s flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <Status tone={statusTone(d.status)}>{d.statusLabel[lang]}</Status>
            {d.submittedAt ? <span className="kd-num">{fill(T.submittedOn, { t: stamp(d.submittedAt, lang) })}</span> : null}
            <span role="status" aria-live="polite" className={cx(save.state === 'error' && 'text-hot')}>{saveLine}</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {live ? <a className={buttonClass({ size: 'sm' })} href={'/e/' + d.slug}>{T.viewPage}<ArrowUpRightIcon size={14} aria-hidden="true" /></a> : null}
          <Menu label={T.moreActions} align="end" width={240} trigger={(p) => (
            <button type="button" {...p} ref={p.ref} className="kd-ib kd-ib-line" aria-label={T.moreActions}><DotsThreeIcon size={18} aria-hidden="true" /></button>
          )}>
            <MenuItem onSelect={duplicate}>{T.duplicate}</MenuItem>
            {d.status === 'draft' ? <><MenuSeparator /><MenuItem onSelect={remove}>{T.deleteDraft}</MenuItem></> : null}
          </Menu>
          {!readOnly ? <Button size="sm" tone={draftLike ? 'default' : 'acc'} disabled={!dirty || save.state === 'saving'} onClick={() => persist(false)}>{dirty ? T.saveChanges : T.saved}</Button> : null}
          {draftLike ? <Button size="sm" tone="acc" disabled={busy} onClick={submit}>{d.status === 'rejected' ? T.resubmitShort : T.submit}</Button> : null}
        </div>
      </div>

      {d.status === 'rejected' ? (
        <Panel role="status" className="flex flex-col gap-1 p-4">
          <Status tone="bad">{d.moderation?.reason ? fill(T.sentBack, { r: d.moderation.reason[lang] }) : T.evRejected}</Status>
          {d.moderation?.decidedAt ? <span className="kd-m kd-num">{stamp(d.moderation.decidedAt, lang)}</span> : null}
          {d.moderation?.message ? <span className="kd-s whitespace-pre-line">{d.moderation.message}</span> : null}
          {appealOpen ? <Appeal lang={lang} eventId={d.id} /> : d.moderation?.appeal?.state === 'replied' ? <Status tone="ok">{T.appealSent}</Status> : null}
        </Panel>
      ) : null}
      {readOnly ? <Panel role="status" className="p-4"><Status tone="bad">{d.status === 'removed' ? T.takenDown : T.cancelledNote}</Status></Panel> : null}

      <div className="kd-split gap-3">
        <fieldset disabled={readOnly} className="kd-main m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
          <Block title={T.sBasics} aside={tag('basics')}>
            {field('edTitle', T.fName, <Input id="edTitle" value={f.title} maxLength={120} placeholder={T.fNamePh} onChange={(e) => set({ title: e.target.value })} />, undefined, `${f.title.length} / 120`)}
            <fieldset className="flex flex-col gap-2">
              <legend className="kd-flabel mb-2">{T.fGenre}</legend>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((x) => {
                  const on = f.styles.includes(x);
                  return <Chip key={x} family="edm" on={on} disabled={!on && f.styles.length >= STYLE_MAX} onClick={() => set({ styles: on ? f.styles.filter((k) => k !== x) : [...f.styles, x] })}>{styleLabel(x, lang)}</Chip>;
                })}
              </div>
            </fieldset>
            <div className={grid}>
              {field('edType', <>{T.fType} <span className="font-normal text-fog">{T.optional}</span></>, (
                <Select id="edType" value={f.eventType} onChange={(e) => set({ eventType: e.target.value })}>
                  <option value="">—</option>
                  {(opts?.eventTypes ?? []).map((t) => <option key={t.value} value={t.value}>{t.label[lang]}</option>)}
                </Select>
              ))}
              {field('edAge', T.fAge, (
                <Select id="edAge" value={f.age} onChange={(e) => set({ age: e.target.value })}>
                  {AGES.map((a) => <option key={a} value={a}>{a === 'All ages' ? T.allAges : a}</option>)}
                </Select>
              ))}
            </div>
            {field('edDescVi', T.fDescVi, <TextArea id="edDescVi" rows={5} maxLength={4000} placeholder={T.fDescPh} value={f.descVi} onChange={(e) => set({ descVi: e.target.value })} />, undefined, `${f.descVi.length} / 4000`)}
            {field('edDescEn', <>{T.fDescEn} <span className="font-normal text-fog">{T.optional}</span></>, <TextArea id="edDescEn" rows={3} maxLength={4000} value={f.descEn} onChange={(e) => set({ descEn: e.target.value })} />)}
          </Block>

          <Block title={T.sWhen} aside={tag('when')}>
            <Segmented className="max-w-[320px]" full label={T.sWhen} value={f.multiDay ? 'multi' : 'one'} onChange={(v) => set({ multiDay: v === 'multi', endsOn: v === 'multi' ? f.endsOn || f.startsOn : f.endsOn })} options={[{ value: 'one', label: T.oneDay }, { value: 'multi', label: T.multiDay }]} />
            <div className={grid}>
              {field('edStart', f.multiDay ? T.fFirstDay : T.fDate, <Input id="edStart" type="date" className="kd-num" value={f.startsOn} onChange={(e) => set({ startsOn: e.target.value, endsOn: f.endsOn && e.target.value && f.endsOn < e.target.value ? e.target.value : f.endsOn })} />)}
              {f.multiDay ? field('edEnd', T.fLastDay, <Input id="edEnd" type="date" className="kd-num" min={f.startsOn || undefined} invalid={!!errors.endsOn} value={f.endsOn} onChange={(e) => set({ endsOn: e.target.value })} />, errors.endsOn) : null}
              {field('edT1', T.fDoors, <Input id="edT1" type="time" className="kd-num" value={f.startTime} onChange={(e) => set({ startTime: e.target.value })} />)}
              {field('edT2', T.fEnd, <Input id="edT2" type="time" className="kd-num" value={f.endTime} onChange={(e) => set({ endTime: e.target.value })} />)}
            </div>
          </Block>

          <Block title={T.sWhere} aside={tag('where')}>
            <VenueField lang={lang} venues={venues} recent={recent} value={{ id: f.venueId, name: f.venueName }} onChange={(v) => set({ venueId: v.id, venueName: v.name })} />
            {!f.venueId ? (
              <div className={grid}>
                {field('edCity', T.fCity, (
                  <Select id="edCity" value={f.city} onChange={(e) => set({ city: e.target.value })}>
                    {(opts?.cities ?? []).map((c) => <option key={c.value} value={c.value}>{c.label[lang]}</option>)}
                  </Select>
                ))}
                {field('edArea', T.fArea, (
                  <>
                    <Input id="edArea" list="edAreas" maxLength={60} value={f.area} onChange={(e) => set({ area: e.target.value })} />
                    <datalist id="edAreas">{(opts?.areaGroups ?? []).flatMap((g) => g.areas).map((a) => <option key={a} value={a} />)}</datalist>
                  </>
                ))}
                {field('edAddr', T.fAddress, <Input id="edAddr" maxLength={240} value={f.address} onChange={(e) => set({ address: e.target.value })} />)}
              </div>
            ) : null}
          </Block>

          <Block title={T.sTickets} aside={tag('tickets')}>
            <Segmented className="max-w-[420px]" full label={T.fMode} value={f.entryMode} onChange={(v) => set({ entryMode: v })} options={(opts?.entryModes as { value: Form['entryMode']; label: Pair }[] | undefined)?.map((m) => ({ value: m.value, label: m.label[lang] })) ?? [{ value: 'paid' as const, label: T.paid }, { value: 'free' as const, label: T.free }]} />
            {f.entryMode === 'paid' && canSellHere ? (
              <SwitchRow label={T.fSellHere} note={T.fSellNote} checked={f.sellHere} disabled={!!d.tiers?.some((t) => t.sold > 0)} onChange={(v) => set({ sellHere: v, tiers: v && !f.tiers.length ? [newTier(f.price)] : f.tiers })} />
            ) : null}
            {f.entryMode === 'paid' && f.sellHere && canSellHere ? <Tiers lang={lang} currency={currency} rows={f.tiers} onChange={(t) => set({ tiers: t })} /> : null}
            <div className={grid}>
              {f.entryMode === 'paid' && !(f.sellHere && canSellHere)
                ? field('edPrice', fill(T.fPrice, { c: currency === 'VND' ? '₫' : currency }), <Input id="edPrice" className="kd-num" inputMode="numeric" value={f.price ? int(f.price).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US') : ''} onChange={(e) => set({ price: e.target.value.replace(/[^0-9]/g, '') })} />)
                : null}
              {field('edCap', <>{T.fCapacity} <span className="font-normal text-fog">{T.optional}</span></>, <Input id="edCap" className="kd-num" inputMode="numeric" value={f.capacity} onChange={(e) => set({ capacity: e.target.value.replace(/[^0-9]/g, '') })} />)}
            </div>
            {field('edTicket', f.entryMode === 'paid' ? T.fTicketUrl : <>{T.fRegisterUrl} <span className="font-normal text-fog">{T.optional}</span></>, (
              <Input id="edTicket" type="url" inputMode="url" placeholder="https://" invalid={!!errors.ticketUrl} value={f.ticketUrl} onChange={(e) => set({ ticketUrl: e.target.value })} />
            ), errors.ticketUrl)}
          </Block>

          <Block title={T.sLineup} id="edLineup">
            <Lineup lang={lang} value={f.lineup} onChange={(lineup) => set({ lineup })} />
          </Block>

          <Block title={T.sMedia} aside={tag('media')} id="edMedia">
            <Upload lang={lang} kind="cover" label={T.fCover} hint={T.fCoverHint} value={f.coverUrl} onChange={(v) => set({ coverUrl: v })} />
            <Upload lang={lang} kind="logo" label={T.fLogo} hint={T.fLogoHint} value={f.logoUrl} onChange={(v) => set({ logoUrl: v })} required />
            <div className={grid}>
              {field('edPage', T.fEventUrl, <Input id="edPage" type="url" inputMode="url" placeholder={T.fEventUrlPh} invalid={!!errors.eventUrl} value={f.eventUrl} onChange={(e) => set({ eventUrl: e.target.value })} />, errors.eventUrl)}
              {field('edBrand', <>{T.fBrandUrl} <span className="font-normal text-fog">{T.optional}</span></>, <Input id="edBrand" type="url" inputMode="url" placeholder="https://" invalid={!!errors.brandUrl} value={f.brandUrl} onChange={(e) => set({ brandUrl: e.target.value })} />, errors.brandUrl)}
            </div>
          </Block>
        </fieldset>

        <aside className="kd-side flex flex-col gap-3 self-start md:sticky md:top-6" aria-label={T.quality}>
          <Panel className="flex flex-col gap-3 p-5">
            <span className="kd-m">{T.quality}</span>
            <span className="flex items-baseline gap-2"><span className="kd-d2 kd-num">{d.quality.score}</span><span className="kd-s">/ 100 · {d.quality.bandLabel[lang]}</span></span>
            {draftLike ? (missing.length ? (
              <div className="flex flex-col gap-1 border-t border-line pt-3">
                <span className="kd-hs">{T.missingHead}</span>
                <span className="kd-s">{missingText(missing, lang)}</span>
              </div>
            ) : <span className="kd-s text-ok border-t border-line pt-3">{T.readyToSubmit}</span>) : null}
            {d.quality.checks.some((c) => !c.ok) ? (
              <ul className="flex flex-col gap-1.5 border-t border-line pt-3">
                {d.quality.checks.filter((c) => !c.ok).map((c) => (
                  <li key={c.key} className="kd-s flex justify-between gap-3"><span>{c.label[lang]}</span><span className="kd-mb kd-num">+{c.points}</span></li>
                ))}
              </ul>
            ) : null}
          </Panel>
          <SearchCard lang={lang} eventId={d.id} saved={d} />
        </aside>
      </div>

      {!readOnly ? <HypeGoals lang={lang} eventId={d.id} /> : null}
      {live ? <LiveUpdates lang={lang} eventId={d.id} /> : null}
    </Page>
  );
}

// ---- hype goals ---------------------------------------------------------------------------

interface GoalRow { threshold: string; vi: string; en: string; reached: boolean }

/** Milestones the event page shows under its hype count: "500 hype → 200 more early-bird tickets". Up to five. */
function HypeGoals({ lang, eventId }: { lang: Lang; eventId: string }) {
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const [data, setData] = useState<{ hypeCount: number; goals: { threshold: number; reward: Pair; reached: boolean }[] } | null>(null);
  const [rows, setRows] = useState<GoalRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => setData(await FF.maybe(FF.get(`/organizer/events/${eventId}/hype-goals`), null)), [eventId]);
  useEffect(() => { load(); }, [load]);
  if (!data) return null;
  const list = rows ?? data.goals.map((g) => ({ threshold: String(g.threshold), vi: g.reward.vi, en: g.reward.en === g.reward.vi ? '' : g.reward.en, reached: g.reached }));
  const edit = (i: number, p: Partial<GoalRow>) => setRows(list.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const saveGoals = async () => {
    setBusy(true);
    const goals = list.filter((r) => int(r.threshold) && r.vi.trim()).map((r) => ({ threshold: int(r.threshold), reward: { vi: r.vi.trim(), en: r.en.trim() } }));
    if (await act(kd, lang, () => FF.put(`/organizer/events/${eventId}/hype-goals`, { goals }))) { setRows(null); load(); }
    setBusy(false);
  };
  const cols = 'grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 max-sm:grid-cols-[80px_minmax(0,1fr)_auto]';
  return (
    <Block title={T.hypeGoals} aside={<span className="kd-m kd-num">{fill(T.hypeNow, { n: data.hypeCount.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US') })}</span>}>
      {list.map((r, i) => (
        <div key={i} className={cols}>
          <Input className="kd-num" inputMode="numeric" placeholder="500" aria-label={T.hypeCount} value={r.threshold} onChange={(e) => edit(i, { threshold: e.target.value.replace(/\D/g, '') })} />
          <Input maxLength={140} placeholder={T.hypePh} aria-label={T.hypeRewardVi} value={r.vi} onChange={(e) => edit(i, { vi: e.target.value })} />
          <Input boxClass="max-sm:hidden" maxLength={140} placeholder="200 more early-bird tickets" aria-label={T.hypeRewardEn} value={r.en} onChange={(e) => edit(i, { en: e.target.value })} />
          {r.reached ? <Status tone="ok">{T.hypeReached}</Status> : <IconButton size="sm" label={T.hypeRemove} onClick={() => setRows(list.filter((_, j) => j !== i))}><TrashIcon size={16} aria-hidden="true" /></IconButton>}
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        {list.length < 5 ? <Button tone="ghost" size="sm" className="-ml-3" onClick={() => setRows([...list, { threshold: '', vi: '', en: '', reached: false }])}>{T.hypeAdd}</Button> : null}
        <Button size="sm" className="ml-auto" disabled={rows === null || busy} onClick={saveGoals}>{T.hypeSave}</Button>
      </div>
    </Block>
  );
}

// ---- live updates -------------------------------------------------------------------------

const KINDS = ['info', 'delay', 'gate', 'safety', 'lineup'] as const;
interface Update { id: string; kind: string; kindLabel: Pair; body: string; createdAt: string; notified: boolean }

/** What the organiser tells everyone on the night; ticket holders and people going get it as a notification. */
function LiveUpdates({ lang, eventId }: { lang: Lang; eventId: string }) {
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const ask = useAsk();
  const [items, setItems] = useState<Update[] | null>(null);
  const [kind, setKind] = useState<(typeof KINDS)[number]>('info');
  const [text, setText] = useState('');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => setItems((await FF.maybe(FF.get(`/organizer/events/${eventId}/updates`), { items: [] })).items), [eventId]);
  useEffect(() => { load(); }, [load]);
  const kindLabel: Record<string, string> = { info: T.updInfo, delay: T.updDelay, gate: T.updGate, safety: T.updSafety, lineup: T.updLineup };
  const post = async () => {
    setBusy(true);
    if (await act(kd, lang, () => FF.post(`/organizer/events/${eventId}/updates`, { kind, body: text.trim(), notify }))) { setText(''); load(); }
    setBusy(false);
  };
  const remove = async (u: Update) => {
    if (!(await ask({ title: T.updRemoveAsk, body: u.body, confirm: T.updRemove, danger: true }))) return;
    if (await act(kd, lang, () => FF.del(`/organizer/events/${eventId}/updates/${u.id}`))) load();
  };
  return (
    <Block title={T.updates}>
      <div className="grid grid-cols-[170px_minmax(0,1fr)] gap-3 max-sm:grid-cols-1">
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="updKind">{T.updKind}</FieldLabel>
          <Select id="updKind" value={kind} onChange={(e) => setKind(e.target.value as (typeof KINDS)[number])}>{KINDS.map((k) => <option key={k} value={k}>{kindLabel[k]}</option>)}</Select>
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="updBody" hint={`${text.length} / 500`}>{T.updBody}</FieldLabel>
          <TextArea id="updBody" rows={2} maxLength={500} placeholder={T.updPh} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1"><SwitchRow label={T.updNotify} checked={notify} onChange={setNotify} /></div>
        <Button size="sm" disabled={busy || text.trim().length < 2} onClick={post}>{T.updPost}</Button>
      </div>
      {items === null ? <div className="kd-skel h-12" aria-hidden="true" /> : !items.length ? <span className="kd-s">{T.updNone}</span> : (
        <ul className="flex flex-col">
          {items.map((u) => (
            <li key={u.id} className="flex items-start gap-3 border-t border-line py-3">
              <Status tone={u.kind === 'safety' || u.kind === 'delay' ? 'warn' : 'none'}>{u.kindLabel[lang]}</Status>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="kd-t whitespace-pre-wrap">{u.body}</span>
                <span className="kd-m kd-num">{stamp(u.createdAt, lang)}{u.notified ? ' · ' + T.updNotified : ''}</span>
              </span>
              <IconButton size="sm" label={T.updRemove} onClick={() => remove(u)}><TrashIcon size={16} aria-hidden="true" /></IconButton>
            </li>
          ))}
        </ul>
      )}
    </Block>
  );
}

// ---- what search engines and AI assistants read ---------------------------------------------

interface SearchCheck { key: string; ok: boolean; points: number; label: Pair; why: Pair; field: string }

/**
 * "Hiển thị trên Google & AI": the parts of the listing's structured data and text that search
 * results and AI answers use (festfinder-backend services/quality.ts searchChecks), each missing
 * one a button to its field. Asked again after each save.
 */
function SearchCard({ lang, eventId, saved }: { lang: Lang; eventId: string; saved: unknown }) {
  const T = pick(STUDIO, lang);
  const [s, setS] = useState<{ score: number; checks: SearchCheck[] } | null>(null);
  useEffect(() => {
    FF.maybe(FF.get(`/organizer/events/${eventId}/search`), null).then((out: { score: number; checks: SearchCheck[] } | null) => out && setS(out));
  }, [eventId, saved]);
  if (!s) return null;
  const go = (field: string) => {
    if (field === 'profile') { location.assign('/studio/profile'); return; }
    const el = document.getElementById(field);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.focus({ preventScroll: true });
  };
  const missing = s.checks.filter((c) => !c.ok);
  return (
    <Panel as="section" className="flex flex-col gap-3 p-5" aria-label={T.searchTitle}>
      <span className="kd-m">{T.searchTitle}</span>
      <span className="flex items-baseline gap-2"><span className="kd-d2 kd-num">{s.score}</span><span className="kd-s">/ 100</span></span>
      {missing.length ? (
        <ul className="flex flex-col gap-1 border-t border-line pt-3">
          {missing.map((c) => (
            <li key={c.key}>
              <button type="button" className="flex w-full flex-col gap-0.5 rounded-seg px-1.5 py-1.5 text-left hover:bg-white/[0.04]" onClick={() => go(c.field)}>
                <span className="kd-s flex w-full justify-between gap-3 text-mist"><span>{c.label[lang]}</span><span className="kd-mb kd-num">+{c.points}</span></span>
                <span className="kd-s text-xs text-fog">{c.why[lang]}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : <span className="kd-s text-ok border-t border-line pt-3">{T.searchDone}</span>}
    </Panel>
  );
}

