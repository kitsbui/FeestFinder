'use client';
/**
 * /studio/new in Kính đêm (design/Studio-Wizard): one page, four accordion steps (basics; time
 * and place; tickets; review and submit), each header with its numbered dot and, folded, a line
 * of what it holds. The draft saves itself as it changes, so closing keeps it; ?draft=<id>
 * continues one. The right column is the card as the feed will show it. What submit needs is
 * what the API asks for (missingForSubmit): name, genre, logo, the event's own page, the dates,
 * the venue, and for paid events a price and the ticket link. The success card offers to push
 * the listing to the Trending shelf.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRightIcon, CaretDownIcon, CheckIcon, ImageSquareIcon, MapPinIcon, PlusIcon, RocketLaunchIcon, TrashIcon, XIcon,
} from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { cx } from '../cx';
import { money, whenShort } from '../format';
import { FAMILY_LABEL, familyOf, g } from '../genre';
import { KdLink } from '../link';
import { priceLine } from '../web/card';
import { useKd } from '../runtime';
import { Button, buttonClass, Chip, IconButton } from '../ui/actions';
import { FieldError, FieldLabel, Input, Segmented, Select, SwitchRow, TextArea } from '../ui/forms';
import { Art, Card as Panel, Status } from '../ui/parts';
import { STUDIO } from './copy';
import { useStudio } from './root';

const GENRES = ['Festival', 'EDM', 'Indie', 'Rock', 'Hip-Hop', 'Pop', 'Jazz', 'Food', 'Culture'] as const;
const GENRE_LABEL: Record<string, Pair> = {
  Festival: { vi: 'Lễ hội', en: 'Festival' }, EDM: { vi: 'EDM', en: 'EDM' }, Indie: { vi: 'Indie', en: 'Indie' },
  Rock: { vi: 'Rock', en: 'Rock' }, 'Hip-Hop': { vi: 'Hip-hop', en: 'Hip-hop' }, Pop: { vi: 'Pop', en: 'Pop' },
  Jazz: { vi: 'Jazz', en: 'Jazz' }, Food: { vi: 'Ẩm thực', en: 'Food' }, Culture: { vi: 'Văn hoá', en: 'Culture' },
};
const AGES = ['All ages', '16+', '18+'] as const;
const NAME_MAX = 60;

interface City { slug: string; name: Pair; currency: string }
interface Venue { id: string; name: string; address: string | null; area: string | null }
interface Tier { key: string; name: string; price: string; capacity: string; sold: number }
interface Form {
  title: string; genre: string | null; description: string; lineup: string[];
  logoUrl: string | null; coverUrl: string | null; eventUrl: string;
  date: string; start: string; end: string;
  venueId: string | null; venueName: string; city: string; age: (typeof AGES)[number];
  entryMode: 'paid' | 'free'; price: string; ticketUrl: string; register: boolean;
  sellHere: boolean; tiers: Tier[];
}
interface Draft {
  id: string; slug: string; status: string; statusLabel: Pair; title: string; genre: string | null; description: Pair | null;
  city: string; currency: string; logoUrl: string | null; coverUrl: string | null;
  startsOn: string | null; startTime: string | null; endTime: string | null;
  venue: { id: string | null; name: string | null };
  entryMode: 'free' | 'paid' | 'donation'; priceFrom: number; age: string | null; lineup: string[] | null;
  ticketUrl: string | null; eventUrl: string | null;
  tiers?: { key: string; name: Pair; price: number; capacity: number; sold: number }[];
  moderation?: { decision: string; reason: Pair | null; message: string | null; appeal: { state: string; closesAt: string } | null } | null;
}

const url = (s: string) => {
  const v = s.trim();
  if (!/^https?:\/\/\S+\.\S+/.test(v)) return null;
  try { return new URL(v).href === v || new URL(v).href === v + '/' ? v : new URL(v).href; } catch { return null; }
};
const int = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;

function fromDraft(d: Draft | null, orgLogo: string | null, city: string): Form {
  return {
    title: d?.title === 'Untitled event' ? '' : d?.title ?? '',
    genre: d?.genre ?? null,
    description: d?.description ? d.description.vi || d.description.en : '',
    lineup: d?.lineup ?? [],
    logoUrl: d ? d.logoUrl : orgLogo,
    coverUrl: d?.coverUrl ?? null,
    eventUrl: d?.eventUrl ?? '',
    date: d?.startsOn ?? '', start: d?.startTime ?? '', end: d?.endTime ?? '',
    venueId: d?.venue.id ?? null, venueName: d?.venue.name ?? '', city: d?.city || city,
    age: (AGES as readonly string[]).includes(d?.age ?? '') ? (d!.age as Form['age']) : '18+',
    entryMode: d?.entryMode === 'free' ? 'free' : 'paid',
    price: d?.priceFrom ? String(d.priceFrom) : '',
    ticketUrl: d?.ticketUrl ?? '',
    register: d?.entryMode === 'free' && !!d.ticketUrl,
    sellHere: !!d?.tiers?.length,
    tiers: (d?.tiers ?? []).map((t) => ({ key: t.key, name: t.name.vi || t.name.en, price: String(t.price), capacity: String(t.capacity), sold: t.sold })),
  };
}

/** The draft fields the API takes, from the form. Unfinished links and dates go as empty. */
function payload(f: Form) {
  const desc = f.description.trim();
  return {
    title: f.title.trim(),
    genre: f.genre,
    description: { vi: desc, en: desc },
    lineup: f.lineup,
    logoUrl: f.logoUrl,
    coverUrl: f.coverUrl,
    eventUrl: url(f.eventUrl),
    startsOn: f.date || null,
    endsOn: f.date || null,
    startTime: f.start || null,
    endTime: f.end || null,
    venueId: f.venueId,
    venueName: f.venueName.trim() || null,
    ...(f.venueId ? {} : { city: f.city }),
    age: f.age,
    entryMode: f.entryMode,
    ...(f.entryMode === 'paid' && !f.sellHere ? { priceFrom: int(f.price) } : {}),
    ticketUrl: f.entryMode === 'free' && !f.register ? null : url(f.ticketUrl),
  };
}
type Payload = ReturnType<typeof payload>;

const tierRows = (f: Form) => f.tiers.filter((t) => t.name.trim() && int(t.price) > 0 && int(t.capacity) > 0);
const tierBody = (f: Form) => tierRows(f).map((t) => ({ key: t.key, name: { vi: t.name.trim(), en: t.name.trim() }, price: int(t.price), capacity: int(t.capacity) }));

/** Which steps are complete, and what submit still needs (the API's missingForSubmit, read from the form). */
function check(f: Form) {
  const p = payload(f);
  const priced = f.entryMode === 'free' || ((f.sellHere ? tierRows(f).length > 0 : int(f.price) > 0) && !!p.ticketUrl);
  const missing: { key: string; step: number }[] = [];
  if (!p.title) missing.push({ key: 'mTitle', step: 0 });
  if (!f.genre) missing.push({ key: 'mGenre', step: 0 });
  if (!f.logoUrl) missing.push({ key: 'mLogo', step: 0 });
  if (!p.eventUrl) missing.push({ key: 'mEventUrl', step: 0 });
  if (!f.date || !f.start || !f.end) missing.push({ key: 'mDates', step: 1 });
  if (!p.venueName) missing.push({ key: 'mVenue', step: 1 });
  if (!priced) missing.push({ key: 'mPrice', step: 2 });
  const done = [0, 1, 2].map((s) => !missing.some((m) => m.step === s));
  return { missing, done };
}

export function Wizard() {
  const { lang, org, events, reload } = useStudio();
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const [cities, setCities] = useState<City[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [draft, setDraft] = useState<Draft | null | undefined>(undefined);
  const [f, setF] = useState<Form | null>(null);
  const [open, setOpen] = useState(0);
  const [agree, setAgree] = useState(false);
  const [save, setSave] = useState<{ state: 'idle' | 'saving' | 'saved' | 'error'; at?: string; error?: string }>({ state: 'idle' });
  const [sent, setSent] = useState<{ boost: 'none' | 'open' | 'busy' } | null>(null);
  const [busy, setBusy] = useState(false);
  const base = useRef<string>('');
  const tierBase = useRef<string>('');
  const id = useRef<string | null>(null);

  // The cities, the verified venues, and the draft named in the address.
  useEffect(() => {
    const ask = new URLSearchParams(location.search).get('draft');
    Promise.all([
      FF.maybe(FF.get('/meta/discovery'), { cities: [], defaultCity: 'ho-chi-minh' }),
      FF.maybe(FF.get('/venues?limit=200'), { items: [] }),
      ask ? FF.maybe(FF.get('/organizer/events/' + encodeURIComponent(ask)), null) : Promise.resolve(null),
    ]).then(([meta, v, d]: [{ cities: City[]; defaultCity: string }, { items: Venue[] }, Draft | null]) => {
      setCities(meta.cities);
      setVenues(v.items);
      const form = fromDraft(d, org.logoUrl, meta.defaultCity);
      id.current = d?.id ?? null;
      base.current = d ? JSON.stringify(payload(form)) : '';
      tierBase.current = JSON.stringify(tierBody(form));
      setDraft(d);
      setF(form);
      if (d) setOpen(check(form).missing[0]?.step ?? 3);
    });
  }, [org.logoUrl]);

  const editable = !draft || ['draft', 'rejected'].includes(draft.status);
  const live = draft?.status === 'live' || draft?.status === 'in_review';
  const city = cities.find((c) => c.slug === (f?.venueId ? draft?.city ?? f.city : f?.city));
  const currency = city?.currency ?? draft?.currency ?? 'VND';
  const canSellHere = currency === 'VND';

  // Saves what changed: the draft is created on the first change, then patched. Live listings save on the button only.
  const inflight = useRef<Promise<boolean>>(Promise.resolve(true));
  const persist = useCallback((form: Form): Promise<boolean> => {
    // One save at a time, so the first change can't create the draft twice.
    inflight.current = inflight.current.then(() => saveNow(form));
    return inflight.current;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- saveNow reads the refs and the latest render
  }, [canSellHere, draft, lang, org, reload]);
  const saveNow = async (form: Form): Promise<boolean> => {
    const body = payload(form);
    const json = JSON.stringify(body);
    const tiers = form.entryMode === 'paid' && form.sellHere && canSellHere ? tierBody(form) : [];
    const tiersJson = JSON.stringify(tiers);
    if (json === base.current && (tiersJson === tierBase.current || !tiers.length)) return true;
    setSave({ state: 'saving' });
    try {
      let out: Draft;
      if (!id.current) {
        out = await FF.post('/organizer/events', { ...body, title: body.title || undefined, brandUrl: url((org as { website?: string }).website ?? '') ?? undefined });
        id.current = out.id;
        const q = new URLSearchParams(location.search);
        q.set('draft', out.id);
        history.replaceState(history.state, '', location.pathname + '?' + q);
        reload();
      } else {
        const was = JSON.parse(base.current || '{}') as Partial<Payload>;
        const diff = Object.fromEntries(Object.entries(body).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify((was as Record<string, unknown>)[k])));
        out = Object.keys(diff).length ? await FF.patch('/organizer/events/' + id.current, diff) : (draft as Draft);
        if ('message' in (out as object)) kd.toast(FF.text((out as unknown as { message: Pair }).message, lang));
      }
      base.current = json;
      if (tiers.length && tiersJson !== tierBase.current) {
        await FF.put('/organizer/events/' + id.current + '/tiers', { tiers });
        tierBase.current = tiersJson;
      }
      setDraft((d) => ({ ...(d ?? {}), ...out } as Draft));
      setSave({ state: 'saved', at: new Date().toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) });
      return true;
    } catch (e) {
      setSave({ state: 'error', error: FF.errorText(e, lang) });
      return false;
    }
  };

  // Autosave a moment after the last change, drafts only.
  useEffect(() => {
    if (!f || !editable || sent) return;
    const has = !!(f.title.trim() || f.genre || f.date || f.venueName || f.description || f.coverUrl);
    if (!has && !id.current) return;
    const t = setTimeout(() => { persist(f); }, 800);
    return () => clearTimeout(t);
  }, [f, editable, sent, persist]);

  const set = (patch: Partial<Form>) => setF((x) => (x ? { ...x, ...patch } : x));
  const recent = useMemo(() => {
    const seen = new Set<string>();
    return events.map((e) => e.venueName).filter((n): n is string => !!n && !seen.has(n) && !!seen.add(n)).slice(0, 4);
  }, [events]);

  if (draft === undefined || !f) return <div className="kd-skel m-6 h-80" aria-hidden="true" />;

  const { missing, done } = check(f);
  const fam = familyOf(f.genre);
  const ready = !missing.length && agree;

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    if (!(await persist(f))) { setBusy(false); return; }
    if (live) { setBusy(false); reload(); return; }
    try {
      await FF.post('/organizer/events/' + id.current + '/submit');
      setSent({ boost: 'none' });
      reload();
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
    setBusy(false);
  };
  const boost = async () => {
    if (!sent || !id.current) return;
    setSent({ boost: 'busy' });
    try { const out = await FF.post('/organizer/events/' + id.current + '/boost'); kd.toast(FF.text(out.message, lang)); setSent({ boost: 'open' }); } catch (e) { kd.toast(FF.errorText(e, lang)); setSent({ boost: 'none' }); }
  };

  const sums = [
    [f.title.trim(), f.genre ? GENRE_LABEL[f.genre][lang] : ''].filter(Boolean).join(' · '),
    [f.date ? whenShort({ startsOn: f.date, endsOn: f.date, startTime: f.start || null, endTime: f.end || null }, lang) : '', f.venueName].filter(Boolean).join(' · '),
    f.entryMode === 'free' ? T.free : f.sellHere && tierRows(f).length
      ? tierRows(f).map((t) => `${t.name} ${money(int(t.price), currency, lang)}`).join(' · ')
      : int(f.price) ? fill(T.fPrice, { c: '' }).replace(/\s*\(\)/, '') + ' ' + money(int(f.price), currency, lang) : '',
    missing.length ? fill(T.wDone, { n: done.filter(Boolean).length }) : '',
  ];
  const step = (n: number, label: string, body: ReactNode) => {
    const on = open === n;
    const ok = n < 3 && done[n];
    return (
      <section className="border-b border-line">
        <button type="button" className="group flex min-h-18 w-full items-center gap-3.5 text-left" aria-expanded={on} onClick={() => setOpen(on ? -1 : n)}>
          <span className={cx('kd-mb flex size-7 shrink-0 items-center justify-center rounded-full text-xs', on ? 'bg-paper text-ink' : ok ? 'bg-ok text-ink' : 'text-fog shadow-[inset_0_0_0_1px_var(--color-line2)]')}>
            {ok && !on ? <CheckIcon size={14} weight="bold" aria-hidden="true" /> : n + 1}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="kd-h">{label}</span>
            {!on && sums[n] ? <span className="kd-s kd-ell">{sums[n]}</span> : null}
          </span>
          <CaretDownIcon size={18} className={cx('text-fog transition-transform group-hover:text-paper', on && 'rotate-180')} aria-hidden="true" />
        </button>
        {on ? <div className="flex flex-col gap-5 pb-7 sm:pl-[42px]">{body}</div> : null}
      </section>
    );
  };
  const next = (n: number) => <Button tone="acc" className="self-start" onClick={() => setOpen(n + 1)}>{T.wNext}</Button>;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="kd-wrap flex h-16 items-center gap-3.5">
          <KdLink href="/studio" aria-label={T.backToDash} className="flex h-11 items-center"><img src="/kd/ff-mark.svg" alt="FeestFinder" width={14} height={24} /></KdLink>
          <span className="kd-hs">{T.wTitle}</span>
          <span className={cx('kd-m max-sm:hidden', save.state === 'error' && 'text-hot normal-case')} role="status" aria-live="polite">
            {save.state === 'saving' ? T.wSaving : save.state === 'saved' ? fill(T.wSaved, { t: save.at ?? '' }) : save.state === 'error' ? fill(T.wNotSaved, { m: save.error ?? '' }) : editable ? T.wDraft : draft?.statusLabel[lang]}
          </span>
          <KdLink href="/studio" className="kd-ib kd-ib-line ml-auto" aria-label={T.wClose}><XIcon size={18} aria-hidden="true" /></KdLink>
        </div>
      </header>

      <div className="kd-wrap pb-12 pt-7">
        <div className="kd-split gap-[clamp(24px,4vw,56px)]">
          <form className="kd-main flex max-w-[720px] flex-col" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
              <h1 className="kd-d2">{draft ? (editable ? T.wNew : T.wEdit) : T.wNew}</h1>
              <span className="kd-m kd-num">{fill(T.wDone, { n: done.filter(Boolean).length })}</span>
            </div>
            {draft?.status === 'rejected' && draft.moderation?.reason ? (
              <div className="kd-card mt-4 flex flex-col gap-1 p-4" role="status">
                <Status tone="bad">{fill(T.sentBack, { r: draft.moderation.reason[lang] })}</Status>
                {draft.moderation.message ? <span className="kd-s">{draft.moderation.message}</span> : null}
                {draft.moderation.appeal?.state === 'open' ? <Appeal lang={lang} eventId={draft.id} /> : null}
              </div>
            ) : null}
            {live ? <p className="kd-s mt-4">{T.liveEdit}</p> : null}

            {step(0, T.s1, (
              <>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="evName" hint={`${f.title.length} / ${NAME_MAX}`}>{T.fName}</FieldLabel>
                  <Input id="evName" value={f.title} maxLength={Math.max(NAME_MAX, f.title.length)} placeholder={T.fNamePh} onChange={(e) => set({ title: e.target.value })} />
                </div>
                <fieldset className="flex flex-col gap-2">
                  <legend className="kd-flabel mb-2">{T.fGenre}</legend>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map((x) => <Chip key={x} family={familyOf(x)} on={f.genre === x} onClick={() => set({ genre: x })}>{GENRE_LABEL[x][lang]}</Chip>)}
                  </div>
                </fieldset>
                <Upload lang={lang} kind="logo" label={T.fLogo} hint={T.fLogoHint} value={f.logoUrl} onChange={(v) => set({ logoUrl: v })} required />
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="evPage">{T.fEventUrl}</FieldLabel>
                  <Input id="evPage" type="url" inputMode="url" value={f.eventUrl} placeholder={T.fEventUrlPh} invalid={!!f.eventUrl.trim() && !url(f.eventUrl)} onChange={(e) => set({ eventUrl: e.target.value })} />
                  {f.eventUrl.trim() && !url(f.eventUrl) ? <FieldError>{T.fUrlRule}</FieldError> : null}
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="evDesc">{T.fDesc} <span className="font-normal text-fog">{T.optional}</span></FieldLabel>
                  <TextArea id="evDesc" rows={3} value={f.description} placeholder={T.fDescPh} maxLength={4000} onChange={(e) => set({ description: e.target.value })} />
                </div>
                <Lineup lang={lang} value={f.lineup} onChange={(lineup) => set({ lineup })} />
                <Upload lang={lang} kind="cover" label={T.fCover} hint={T.fCoverHint} value={f.coverUrl} onChange={(v) => set({ coverUrl: v })} />
                {next(0)}
              </>
            ))}

            {step(1, T.s2, (
              <>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
                  <div className="flex flex-col gap-2"><FieldLabel htmlFor="evDate">{T.fDate}</FieldLabel><Input id="evDate" type="date" className="kd-num" value={f.date} onChange={(e) => set({ date: e.target.value })} /></div>
                  <div className="flex flex-col gap-2"><FieldLabel htmlFor="evStart">{T.fDoors}</FieldLabel><Input id="evStart" type="time" className="kd-num" value={f.start} onChange={(e) => set({ start: e.target.value })} /></div>
                  <div className="flex flex-col gap-2"><FieldLabel htmlFor="evEnd">{T.fEnd}</FieldLabel><Input id="evEnd" type="time" className="kd-num" value={f.end} onChange={(e) => set({ end: e.target.value })} /></div>
                </div>
                <VenueField lang={lang} venues={venues} recent={recent} value={{ id: f.venueId, name: f.venueName }} onChange={(v) => set({ venueId: v.id, venueName: v.name })} />
                <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                  {!f.venueId ? (
                    <div className="flex flex-col gap-2">
                      <FieldLabel htmlFor="evCity">{T.fCity}</FieldLabel>
                      <Select id="evCity" value={f.city} onChange={(e) => set({ city: e.target.value })}>
                        {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name[lang]}</option>)}
                      </Select>
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="evAge">{T.fAge}</FieldLabel>
                    <Select id="evAge" value={f.age} onChange={(e) => set({ age: e.target.value as Form['age'] })}>
                      {AGES.map((a) => <option key={a} value={a}>{a === 'All ages' ? T.allAges : a}</option>)}
                    </Select>
                  </div>
                </div>
                {next(1)}
              </>
            ))}

            {step(2, T.s3, (
              <>
                <Segmented full className="max-w-[360px]" label={T.fMode} value={f.entryMode} onChange={(v) => set({ entryMode: v })} options={[{ value: 'paid', label: T.paid }, { value: 'free', label: T.free }]} />
                {f.entryMode === 'paid' ? (
                  <>
                    {canSellHere ? <SwitchRow label={T.fSellHere} note={T.fSellNote} checked={f.sellHere} disabled={!!draft?.tiers?.some((t) => t.sold > 0) || (f.sellHere && tierBase.current !== '[]')} onChange={(v) => set({ sellHere: v, tiers: v && !f.tiers.length ? [newTier(f.price)] : f.tiers })} /> : null}
                    {f.sellHere && canSellHere ? (
                      <Tiers lang={lang} currency={currency} rows={f.tiers} onChange={(tiers) => set({ tiers })} />
                    ) : (
                      <div className="flex max-w-[260px] flex-col gap-2">
                        <FieldLabel htmlFor="evPrice">{fill(T.fPrice, { c: currency === 'VND' ? '₫' : currency })}</FieldLabel>
                        <Input id="evPrice" className="kd-num" inputMode="numeric" value={f.price ? int(f.price).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US') : ''} placeholder="450.000" onChange={(e) => set({ price: e.target.value.replace(/[^0-9]/g, '') })} />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <FieldLabel htmlFor="evLink">{T.fTicketUrl}</FieldLabel>
                      <Input id="evLink" type="url" inputMode="url" value={f.ticketUrl} placeholder="https://ticketbox.vn/…" invalid={!!f.ticketUrl.trim() && !url(f.ticketUrl)} onChange={(e) => set({ ticketUrl: e.target.value })} />
                      {f.ticketUrl.trim() && !url(f.ticketUrl) ? <FieldError>{T.fUrlRule}</FieldError> : <span className="kd-s">{f.sellHere && canSellHere ? T.fSellNote : T.fTicketNote}</span>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="border-t border-line"><SwitchRow label={T.fRegister} checked={f.register} onChange={(v) => set({ register: v })} /></div>
                    {f.register ? (
                      <div className="flex flex-col gap-2">
                        <FieldLabel htmlFor="evReg">{T.fRegisterUrl}</FieldLabel>
                        <Input id="evReg" type="url" inputMode="url" value={f.ticketUrl} placeholder="https://" invalid={!!f.ticketUrl.trim() && !url(f.ticketUrl)} onChange={(e) => set({ ticketUrl: e.target.value })} />
                        {f.ticketUrl.trim() && !url(f.ticketUrl) ? <FieldError>{T.fUrlRule}</FieldError> : null}
                      </div>
                    ) : null}
                  </>
                )}
                {next(2)}
              </>
            ))}

            {step(3, T.s4, sent ? (
              <Panel role="status" className="flex flex-col gap-3 p-[18px]">
                <Status tone="ok">{T.sent}</Status>
                <span className="kd-h">{fill(T.sentLine, { t: f.title.trim() })}</span>
                <span className="kd-s">{T.sentNote}</span>
                <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
                  <span className="kd-s">{T.boostOffer}</span>
                  {sent.boost === 'open' ? <Status tone="warn">{T.boostAsked}</Status> : <Button size="sm" disabled={sent.boost === 'busy'} onClick={boost}><RocketLaunchIcon size={14} aria-hidden="true" />{T.boost}</Button>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <KdLink className={buttonClass({ tone: 'light' })} href="/studio">{T.backToDash}</KdLink>
                  <a className={buttonClass({})} href="/studio/new">{T.listAnother}</a>
                </div>
              </Panel>
            ) : !editable && !live ? <span className="kd-s">{T.notEditable}</span> : (
              <>
                {missing.length ? (
                  <Panel role="status" className="flex flex-col gap-2 px-4 py-3.5">
                    <span className="kd-hs flex items-center gap-2"><span className="kd-st kd-warn" aria-hidden="true" />{T.missingHead}</span>
                    {missing.map((m) => (
                      <button key={m.key} type="button" className="kd-more" onClick={() => setOpen(m.step)}>
                        {T[m.key as keyof typeof T]}<ArrowRightIcon size={14} aria-hidden="true" />
                      </button>
                    ))}
                  </Panel>
                ) : null}
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-5 accent-acc" />
                  <span className="kd-t">{T.agree}</span>
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <Button tone="acc" size="lg" type="submit" disabled={!ready || busy}>{live ? T.saveChanges : T.submit}</Button>
                  {live ? null : <span className="kd-s">{T.submitNote}</span>}
                </div>
              </>
            ))}
          </form>

          <aside className="kd-side flex max-w-[400px] flex-col gap-3 self-start md:sticky md:top-6" aria-label={T.preview}>
            <span className="kd-m">{T.preview}</span>
            <article className={cx('kd-ev', g(fam))}>
              <div className="relative">
                <Art family={fam} cover={f.coverUrl} />
                <span className="kd-tag kd-tag-glass absolute left-2.5 top-2.5 text-paper">{T.justListed}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="kd-h">{f.title.trim() || T.noTitle}</span>
                <span className="kd-s flex min-w-0 items-center gap-1.5">
                  <span className="kd-mk" aria-hidden="true" />
                  <span className="kd-ell">{[f.date ? whenShort({ startsOn: f.date, endsOn: f.date, startTime: f.start || null, endTime: f.end || null }, lang) : T.noDate, f.venueName].filter(Boolean).join(' · ')}</span>
                </span>
                {(() => {
                  const p = f.sellHere && tierRows(f).length ? Math.min(...tierRows(f).map((t) => int(t.price))) : int(f.price);
                  if (f.entryMode !== 'free' && !p) return null;
                  return <span className={cx('kd-mb kd-num mt-0.5', f.entryMode === 'free' && 'text-acc')}>{f.entryMode === 'free' ? T.free : priceLine({ isFree: false, entryMode: 'paid', priceFrom: p, currency }, lang)}</span>;
                })()}
                {f.genre ? <span className="kd-m">{FAMILY_LABEL[fam][lang]}</span> : null}
              </div>
            </article>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** A listing sent back can be appealed once, within its window. */
function Appeal({ lang, eventId }: { lang: Lang; eventId: string }) {
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  if (done) return <Status tone="ok">{T.appealSent}</Status>;
  return (
    <div className="mt-2 flex flex-col gap-2">
      <FieldLabel htmlFor="appeal">{T.appeal}</FieldLabel>
      <TextArea id="appeal" rows={2} minLength={10} maxLength={2000} placeholder={T.appealPh} value={text} onChange={(e) => setText(e.target.value)} />
      <Button size="sm" className="self-start" disabled={text.trim().length < 10} onClick={async () => {
        try { const out = await FF.post(`/organizer/events/${eventId}/appeal`, { reply: text.trim() }); kd.toast(FF.text(out.message, lang)); setDone(true); } catch (e) { kd.toast(FF.errorText(e, lang)); }
      }}>{T.appealSend}</Button>
    </div>
  );
}

function newTier(price = ''): Tier {
  return { key: 't' + Math.random().toString(36).slice(2, 8), name: '', price, capacity: '', sold: 0 };
}

function Tiers({ lang, currency, rows, onChange }: { lang: Lang; currency: string; rows: Tier[]; onChange: (t: Tier[]) => void }) {
  const T = pick(STUDIO, lang);
  const sym = currency === 'VND' ? '₫' : currency;
  const upd = (i: number, p: Partial<Tier>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const cols = 'grid grid-cols-[minmax(0,1fr)_120px_96px_44px] items-center gap-2 max-sm:grid-cols-[minmax(0,1fr)_96px_72px_44px]';
  return (
    <div className="flex flex-col gap-2">
      <div className={cx(cols, 'kd-m')}><span>{T.tier}</span><span>{fill(T.tierPrice, { c: sym })}</span><span>{T.tierQty}</span><span /></div>
      {rows.map((t, i) => (
        <div key={t.key} className={cols}>
          <Input value={t.name} maxLength={60} placeholder={T.tierNamePh} aria-label={T.tierName} onChange={(e) => upd(i, { name: e.target.value })} />
          <Input className="kd-num" inputMode="numeric" value={t.price ? int(t.price).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US') : ''} placeholder="450.000" aria-label={fill(T.tierPrice, { c: sym })} onChange={(e) => upd(i, { price: e.target.value.replace(/[^0-9]/g, '') })} />
          <Input className="kd-num" inputMode="numeric" value={t.capacity} placeholder="100" aria-label={T.tierQty} onChange={(e) => upd(i, { capacity: e.target.value.replace(/[^0-9]/g, '') })} />
          <IconButton label={t.sold ? fill(T.tierSold, { n: t.sold }) : T.tierRemove} disabled={t.sold > 0 || rows.length === 1} onClick={() => onChange(rows.filter((_, j) => j !== i))}><TrashIcon size={16} aria-hidden="true" /></IconButton>
        </div>
      ))}
      {rows.length < 12 ? <Button tone="ghost" size="sm" className="-ml-3 self-start" onClick={() => onChange([...rows, newTier()])}><PlusIcon size={16} aria-hidden="true" />{T.addTier}</Button> : null}
    </div>
  );
}

function Lineup({ lang, value, onChange }: { lang: Lang; value: string[]; onChange: (v: string[]) => void }) {
  const T = pick(STUDIO, lang);
  const [text, setText] = useState('');
  const add = () => {
    const n = text.trim().slice(0, 100);
    if (n && !value.includes(n) && value.length < 80) onChange([...value, n]);
    setText('');
  };
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor="evLineup">{T.fLineup} <span className="font-normal text-fog">{T.optional}</span></FieldLabel>
      {value.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((a) => (
            <li key={a}><Chip on onClick={() => onChange(value.filter((x) => x !== a))} aria-label={fill(T.fRemoveArtist, { n: a })}>{a}<XIcon size={12} aria-hidden="true" /></Chip></li>
          ))}
        </ul>
      ) : null}
      <Input id="evLineup" value={text} placeholder={T.fLineupPh} onChange={(e) => setText(e.target.value)} onBlur={add} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }} />
    </div>
  );
}

function VenueField({ lang, venues, recent, value, onChange }: {
  lang: Lang; venues: Venue[]; recent: string[]; value: { id: string | null; name: string }; onChange: (v: { id: string | null; name: string }) => void;
}) {
  const T = pick(STUDIO, lang);
  const [focus, setFocus] = useState(false);
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
  const q = norm(value.name.trim());
  const hits = q && !value.id ? venues.filter((v) => norm(`${v.name} ${v.address ?? ''} ${v.area ?? ''}`).includes(q)).slice(0, 6) : [];
  const pick_ = (name: string) => { const v = venues.find((x) => x.name === name); onChange({ id: v?.id ?? null, name }); };
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor="evVenue">{T.fVenue}</FieldLabel>
      <div className="relative">
        <Input
          id="evVenue"
          icon={<MapPinIcon size={18} className="text-fog" aria-hidden="true" />}
          value={value.name}
          placeholder={T.fVenuePh}
          role="combobox"
          aria-expanded={focus && hits.length > 0}
          aria-controls="evVenueList"
          aria-autocomplete="list"
          autoComplete="off"
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 150)}
          onChange={(e) => onChange({ id: null, name: e.target.value })}
        />
        {focus && hits.length ? (
          <ul id="evVenueList" role="listbox" className="kd-menu absolute inset-x-0 top-full z-30 mt-1.5 flex flex-col p-1.5">
            {hits.map((v) => (
              <li key={v.id} role="option" aria-selected={false}>
                <button type="button" className="kd-mi w-full text-left" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange({ id: v.id, name: v.name }); setFocus(false); }}>
                  <span className="flex min-w-0 flex-col"><span className="kd-hs kd-ell">{v.name}</span><span className="kd-s kd-ell">{[v.address, v.area].filter(Boolean).join(' · ')}</span></span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {value.name.trim() && !value.id ? <span className="kd-s">{T.fVenueNew}</span> : null}
      {recent.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="kd-s">{T.fRecent}</span>
          {recent.map((n) => <Chip key={n} on={value.name === n} onClick={() => pick_(n)}>{n}</Chip>)}
        </div>
      ) : null}
    </div>
  );
}

function Upload({ lang, kind, label, hint, value, onChange, required }: {
  lang: Lang; kind: 'logo' | 'cover'; label: string; hint: string; value: string | null; onChange: (v: string | null) => void; required?: boolean;
}) {
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const send = async (file: File) => {
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const out = await FF.api('POST', '/uploads?purpose=' + kind, form);
      onChange(out.url);
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
    setBusy(false);
  };
  return (
    <div className="flex min-h-16 w-full items-center gap-3 rounded-[10px] border border-dashed border-line2 px-4 py-3">
      {value
        // eslint-disable-next-line @next/next/no-img-element -- uploads come from the API's file storage
        ? <img src={value} alt="" className={cx('shrink-0 object-cover', kind === 'logo' ? 'size-11 rounded-lg' : 'h-11 w-[78px] rounded-md')} />
        : <ImageSquareIcon size={22} className="shrink-0 text-fog" aria-hidden="true" />}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="kd-hs">{label} {required ? null : <span className="font-normal text-fog">{T.optional}</span>}</span>
        <span className="kd-s">{busy ? T.fUploading : hint}</span>
      </span>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { const file = e.target.files?.[0]; if (file) send(file); e.target.value = ''; }} />
      {value && !required ? <Button tone="ghost" size="sm" onClick={() => onChange(null)}>{T.fRemove}</Button> : null}
      <Button size="sm" disabled={busy} onClick={() => input.current?.click()} aria-label={`${value ? T.fChange : T.fUpload} · ${label}`}>{value ? T.fChange : T.fUpload}</Button>
    </div>
  );
}
