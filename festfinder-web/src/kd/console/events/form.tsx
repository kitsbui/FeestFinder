'use client';
/**
 * The team's event form (/ops event-form.js in team mode): create a listing for an organiser,
 * fix one, publish it. Seven sections, each with its done tick: basics (organiser on create,
 * name, genre, age, styles, kind, descriptions), date and time (quick dates and presets),
 * venue (saved, or new with city, district and address), tickets and entry (price, capacity,
 * ticket link with its partner, the tier editor), lineup, images and links, and the team's own
 * settings (featured, card badge, publish on create). The rail scores the listing as the server
 * does, lists what publishing still needs, saves (Ctrl/⌘+S) and shows the card as the feed will.
 * Leaving with unsaved changes asks first. It talks to /admin/events.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckCircleIcon, FloppyDiskIcon, MapPinIcon, PaperPlaneRightIcon, SealCheckIcon, TranslateIcon, WarningCircleIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { freshen } from '../../fresh';
import { fill, pick, type Pair, type Strings } from '../../copy';
import { cx } from '../../cx';
import { day as dayParts, todayIn, whenShort } from '../../format';
import { useKd } from '../../runtime';
import { priceLine } from '../../web/card';
import { Button, Chip } from '../../ui/actions';
import { Input, Segmented, Select, SwitchRow, TextArea } from '../../ui/forms';
import { Art, Card as Panel, Status } from '../../ui/parts';
import { AsyncPick, Field, Loading, useOptions, type FormOptions, type PickItem } from '../kit';
import { useConsole } from '../root';
import { EVENTS } from './copy';
import { loadOrganizers } from './list';
import { useLeaveGuard, usePlaces, type City, type EventDetail, type Tier } from './model';
import { jump, Lineup, PriceInput, Section, TierEditor, TimeSelect, Upload, type TierRow } from './parts';

type Str = Strings<typeof EVENTS>;
type Entry = 'free' | 'paid' | 'donation';

interface F {
  title: string; genre: string; styles: string[]; eventType: string; city: string; age: string; descVi: string; descEn: string;
  multiDay: boolean; startsOn: string; endsOn: string; startTime: string; endTime: string;
  venueMode: 'saved' | 'new'; venueId: string | null; venueLabel: string | null; venueSub: string; venueArea: string;
  venueName: string; address: string; area: string;
  entryMode: Entry; priceFrom: number; capacity: string; ticketUrl: string; lineup: string[];
  logoUrl: string | null; coverUrl: string | null; eventUrl: string; brandUrl: string; featured: boolean; badge: string; tiers: TierRow[];
}

const SECTIONS = ['basics', 'when', 'where', 'tickets', 'lineup', 'media'] as const;
type Sec = (typeof SECTIONS)[number] | 'team';

/** The nine checks the server scores with (services/quality.ts), so the score moves as people type. */
const CHECKS: { key: string; pts: number; sec: Sec; label: keyof Str }[] = [
  { key: 'name', pts: 10, sec: 'basics', label: 'qName' },
  { key: 'genre', pts: 8, sec: 'basics', label: 'qGenre' },
  { key: 'description', pts: 14, sec: 'basics', label: 'qDescription' },
  { key: 'logo', pts: 10, sec: 'media', label: 'qLogo' },
  { key: 'cover', pts: 20, sec: 'media', label: 'qCover' },
  { key: 'venue', pts: 14, sec: 'where', label: 'qVenue' },
  { key: 'tickets', pts: 12, sec: 'tickets', label: 'qTickets' },
  { key: 'lineup', pts: 8, sec: 'lineup', label: 'qLineup' },
  { key: 'event_url', pts: 4, sec: 'media', label: 'qEventUrl' },
];
/** Quality checks that repeat a required item; the rail lists those once, as required. */
const COVERED: Record<string, string> = { genre: 'genre', venue: 'venue', tickets: 'price' };
const REQUIRED: Record<string, { sec: Sec; label: keyof Str }> = {
  title: { sec: 'basics', label: 'rTitle' }, genre: { sec: 'basics', label: 'rGenre' }, dates: { sec: 'when', label: 'rDates' },
  venue: { sec: 'where', label: 'rVenue' }, price: { sec: 'tickets', label: 'rPrice' },
};
const PARTNERS: [string, string][] = [['ticketbox.vn', 'Ticketbox'], ['ticketgo.vn', 'TicketGo'], ['vebo.vn', 'Vebo'], ['eventbrite', 'Eventbrite'], ['facebook.com', 'Facebook'], ['zalo.me', 'Zalo'], ['momo.vn', 'MoMo']];
const PRICE_PRESETS = [100000, 150000, 200000, 300000, 500000, 1000000];

const isUrl = (s: string) => !!s && /^https?:\/\/\S+\.\S+/.test(s.trim());
const withScheme = (s: string) => (s && !/^https?:\/\//i.test(s.trim()) && /\.\S/.test(s) ? 'https://' + s.trim() : s.trim());
const partnerOf = (url: string) => PARTNERS.find(([d]) => url.includes(d))?.[1] ?? null;
const mins = (hhmm: string) => (hhmm ? Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5)) : null);
const addDays = (iso: string, n: number) => {
  const { y, m, d } = dayParts(iso);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

function fromDraft(d: EventDetail | null, o: FormOptions, defaultCity: string): F {
  const v = d?.venue ?? { id: null, name: null, address: null, area: null };
  return {
    title: d?.title && d.title !== 'Untitled event' ? d.title : '',
    genre: d?.genre ?? (o.genres.length === 1 ? o.genres[0].value : ''),
    styles: d?.styles ?? [],
    eventType: d?.eventType ?? '',
    city: d?.city || defaultCity,
    age: d?.age ?? 'All ages',
    descVi: d?.description?.vi ?? '',
    descEn: d?.description?.en ?? '',
    multiDay: !!(d?.endsOn && d.startsOn && d.endsOn !== d.startsOn),
    startsOn: d?.startsOn ?? '', endsOn: d?.endsOn ?? '', startTime: d?.startTime ?? '', endTime: d?.endTime ?? '',
    venueMode: v.id || !v.name ? 'saved' : 'new',
    venueId: v.id ?? null,
    venueLabel: v.id ? v.name : null,
    venueSub: v.id ? [v.address, v.area].filter(Boolean).join(' · ') : '',
    venueArea: v.area ?? '',
    venueName: v.id ? '' : v.name ?? '',
    address: v.id ? '' : v.address ?? '',
    area: v.id ? '' : v.area ?? '',
    entryMode: d?.entryMode ?? 'paid',
    priceFrom: Number(d?.priceFrom ?? 0),
    capacity: d?.capacity ? String(d.capacity) : '',
    ticketUrl: d?.ticketUrl ?? '',
    lineup: d?.lineup ?? [],
    logoUrl: d?.logoUrl ?? null,
    coverUrl: d?.coverUrl ?? null,
    eventUrl: d?.eventUrl ?? '',
    brandUrl: d?.brandUrl ?? '',
    featured: !!d?.featured,
    badge: d?.badge ?? '',
    tiers: (d?.tiers ?? []).map((t) => ({ key: t.key, nameVi: t.name?.vi ?? '', nameEn: t.name?.en ?? '', price: t.price, capacity: String(t.capacity), sold: t.sold })),
  };
}

function toPayload(f: F) {
  const p: Record<string, unknown> = {
    title: f.title.trim(),
    genre: f.genre || null,
    styles: f.styles,
    eventType: f.eventType || null,
    age: f.age,
    description: { vi: f.descVi, en: f.descEn },
    startsOn: f.startsOn || null,
    endsOn: f.startsOn ? (f.multiDay && f.endsOn ? f.endsOn : f.startsOn) : null,
    startTime: f.startTime || null,
    endTime: f.endTime || null,
    entryMode: f.entryMode,
    priceFrom: f.entryMode === 'paid' ? f.priceFrom || 0 : 0,
    capacity: f.capacity === '' ? null : Number(f.capacity),
    ticketUrl: f.ticketUrl.trim() || null,
    lineup: f.lineup,
    logoUrl: f.logoUrl || null,
    coverUrl: f.coverUrl || null,
    eventUrl: f.eventUrl.trim() || null,
    brandUrl: f.brandUrl.trim() || null,
    featured: f.featured,
    badge: f.badge || null,
  };
  if (f.venueMode === 'saved') Object.assign(p, { venueId: f.venueId || null, ...(f.venueId ? {} : { venueName: null, address: null, area: null }) });
  else Object.assign(p, { venueId: null, venueName: f.venueName.trim() || null, address: f.address.trim() || null, area: f.area.trim() || null, city: f.city });
  return p;
}

/** Tiers as PUT /admin/events/:id/tiers takes them; what the form doesn't edit is kept from the saved tier. */
function tiersPayload(f: F, original: Tier[]) {
  return f.tiers.map((x) => {
    const o = original.find((y) => y.key === x.key);
    return {
      key: x.key, name: { vi: x.nameVi.trim() || x.nameEn.trim(), en: x.nameEn.trim() || x.nameVi.trim() }, price: x.price || 0, capacity: Number(x.capacity) || 0,
      isLast: o?.isLast ?? false, note: o?.note ?? null, salesOpenAt: o?.salesOpenAt ?? null, priceRiseOn: o?.priceRiseOn ?? null, priceRiseTo: o?.priceRiseTo ?? null,
    };
  });
}

function qualityOf(f: F) {
  const ok: Record<string, boolean> = {
    name: f.title.trim().length >= 8,
    genre: !!f.genre,
    description: Math.max(f.descVi.trim().length, f.descEn.trim().length) >= 80,
    logo: !!f.logoUrl,
    cover: !!f.coverUrl,
    venue: f.venueMode === 'saved' && !!f.venueId,
    tickets: f.entryMode === 'paid' ? f.priceFrom > 0 && isUrl(f.ticketUrl) : true,
    lineup: f.lineup.length >= 3,
    event_url: isUrl(f.eventUrl),
  };
  const checks = CHECKS.map((c) => ({ ...c, ok: ok[c.key] }));
  const score = checks.reduce((n, c) => n + (c.ok ? c.pts : 0), 0);
  return { score, checks, band: score >= 85 ? 'strong' : score >= 60 ? 'passable' : 'at_risk' };
}

/** What the team needs before publishing (missingForPublish: the logo and event page are optional here). */
function missingOf(f: F) {
  const m: string[] = [];
  if (!f.title.trim()) m.push('title');
  if (!f.genre) m.push('genre');
  if (!f.startsOn || !f.startTime || !f.endTime) m.push('dates');
  if (!(f.venueMode === 'saved' ? f.venueId : f.venueName.trim())) m.push('venue');
  if (f.entryMode === 'paid' && (!f.priceFrom || !f.ticketUrl.trim())) m.push('price');
  return m;
}

function sectionDone(id: Sec, f: F) {
  switch (id) {
    case 'basics': return !!f.title.trim() && !!f.genre;
    case 'when': return !!f.startsOn && !!f.startTime && !!f.endTime;
    case 'where': return f.venueMode === 'saved' ? !!f.venueId : !!f.venueName.trim() && !!f.area.trim();
    case 'tickets': return f.entryMode !== 'paid' || (f.priceFrom > 0 && isUrl(f.ticketUrl));
    case 'lineup': return f.lineup.length > 0;
    case 'media': return !!f.logoUrl && !!f.coverUrl && isUrl(f.eventUrl);
    default: return false;
  }
}

export interface Primary { label: string; run: (id: string) => Promise<void> }

/** Loads the option lists and the cities, then the form. */
export function EventForm(props: {
  draft: EventDetail | null; onSaved: (out: any, info: { created: boolean }) => void; primary?: Primary | null; banner?: ReactNode;
  orgName?: string | null; presetOrganizer?: PickItem | null;
}) {
  const o = useOptions();
  const places = usePlaces();
  if (!o || !places) return <Loading className="h-96" />;
  return <Form {...props} o={o} cities={places.cities} defaultCity={places.defaultCity || o.cities[0]?.value || ''} />;
}

function Form({ draft, onSaved, primary, banner, orgName, presetOrganizer, o, cities, defaultCity }: Parameters<typeof EventForm>[0] & { o: FormOptions; cities: City[]; defaultCity: string }) {
  const { lang } = useConsole();
  const T = pick(EVENTS, lang);
  const kd = useKd();
  const id = draft?.id ?? null;
  const [f, setF] = useState<F>(() => fromDraft(draft, o, defaultCity));
  const [base, setBase] = useState(() => JSON.stringify(toPayload(fromDraft(draft, o, defaultCity))));
  const [tierBase, setTierBase] = useState(() => JSON.stringify(tiersPayload(fromDraft(draft, o, defaultCity), draft?.tiers ?? [])));
  const [organizer, setOrganizer] = useState<PickItem | null>(presetOrganizer ?? null);
  const [publishNow, setPublishNow] = useState(false);
  const [busy, setBusy] = useState<'save' | 'primary' | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showEn, setShowEn] = useState(!!draft?.description?.en);
  const [showTiers, setShowTiers] = useState((draft?.tiers ?? []).length > 0);
  const set = (patch: Partial<F>) => setF((x) => ({ ...x, ...patch }));
  const payload = useMemo(() => toPayload(f), [f]);
  const tiers = useMemo(() => tiersPayload(f, draft?.tiers ?? []), [f, draft]);
  const dirty = JSON.stringify(payload) !== base || (!!id && showTiers && JSON.stringify(tiers) !== tierBase);
  const q = qualityOf(f);
  const missing = missingOf(f);
  const boosts = q.checks.filter((c) => !c.ok && !missing.includes(COVERED[c.key]));
  useLeaveGuard(dirty, T.leave);
  const findOrganizers = useCallback((s: string) => loadOrganizers(s, lang), [lang]);
  const findVenues = useCallback(async (s: string) => ((await FF.get('/venues' + `?limit=30${s ? '&q=' + encodeURIComponent(s) : ''}`)).items as { id: string; name: string; address: string; area: string }[])
    .map((v) => ({ value: v.id, label: v.name, sub: [v.address, v.area].filter(Boolean).join(' · '), area: v.area })), []);

  const city = cities.find((c) => c.slug === f.city) ?? cities.find((c) => c.slug === defaultCity) ?? null;
  const currency = (f.venueMode === 'new' ? city?.currency : draft?.currency ?? city?.currency) ?? '';
  const canTier = currency === 'VND';
  const today = todayIn(city?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);

  const validate = () => {
    const e: Record<string, string> = {};
    if (f.title.length > 120) e.title = T.eTitle;
    if (f.multiDay && f.endsOn && f.startsOn && f.endsOn < f.startsOn) e.endsOn = T.eEnds;
    for (const k of ['ticketUrl', 'eventUrl', 'brandUrl'] as const) if (f[k].trim() && !isUrl(f[k])) e[k] = T.eUrl;
    if (f.capacity !== '' && (Number(f.capacity) < 1 || !Number.isInteger(Number(f.capacity)))) e.capacity = T.eCapacity;
    if (!id && !organizer) e.organizer = T.eOrganizer;
    if (showTiers && f.tiers.some((x) => !x.nameVi.trim() && !x.nameEn.trim())) e.tiers = T.eTiers;
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      jump(({ title: 'basics', organizer: 'basics', endsOn: 'when', ticketUrl: 'tickets', capacity: 'tickets', tiers: 'tickets', eventUrl: 'media', brandUrl: 'media' } as Record<string, string>)[first] ?? 'basics');
      return false;
    }
    return true;
  };

  /** Saves the fields (and the tiers, when edited); returns the saved listing, or null. */
  const save = async (): Promise<any> => {
    if (!validate()) { kd.toast(T.checkFields); return null; }
    setBusy('save');
    try {
      let out: any;
      if (!id) {
        out = await FF.post('/admin/events', { ...payload, organizerId: organizer!.value, publish: publishNow });
      } else {
        out = JSON.stringify(payload) !== base ? await FF.patch(`/admin/events/${id}`, payload) : draft;
        if (showTiers && JSON.stringify(tiers) !== tierBase && f.entryMode === 'paid' && tiers.length) {
          const t2 = await FF.put(`/admin/events/${id}/tiers`, { tiers });
          out = { ...out, ...t2, message: out?.message };
          setTierBase(JSON.stringify(tiers));
        }
      }
      setBase(JSON.stringify(payload));
      if (out?.slug) void freshen('e', out.slug);
      setSavedAt(new Date().toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-GB', { hour: '2-digit', minute: '2-digit' }));
      kd.toast(out?.message ? FF.text(out.message as Pair, lang) : T.saved);
      onSaved(out, { created: !id });
      return out;
    } catch (e) {
      kd.toast(FF.errorText(e, lang));
      const fields = (e as { details?: { fields?: { path: string; message: string }[] } })?.details?.fields;
      if (fields) setErrors(Object.fromEntries(fields.map((x) => [x.path.split('.')[0], x.message])));
      return null;
    } finally { setBusy(null); }
  };

  const runPrimary = async () => {
    if (!primary) return;
    if (missing.length) { jump(REQUIRED[missing[0]].sec); kd.toast(T.missingSome); return; }
    const saved = dirty || !id ? await save() : draft;
    if (!saved) return;
    setBusy('primary');
    try { await primary.run(saved.id ?? id); } finally { setBusy(null); }
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); void save(); } };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  });

  const dur = (() => {
    const a = mins(f.startTime), b = mins(f.endTime);
    if (a === null || b === null) return null;
    return { m: b > a ? b - a : b + 1440 - a, overnight: b <= a };
  })();
  const whenSub = dur && f.startsOn
    ? `${whenShort({ startsOn: f.startsOn, endsOn: f.multiDay ? f.endsOn || null : null }, lang)} · ${f.startTime} → ${f.endTime}${dur.overnight ? ' ' + T.nextDay : ''} · ${Math.floor(dur.m / 60)}h${dur.m % 60 ? String(dur.m % 60).padStart(2, '0') : ''}`
    : null;
  const dow = dayParts(today).dow;
  const next = (target: number) => addDays(today, (target - dow + 7) % 7);
  const datePicks = [{ label: T.pToday, value: today }, { label: T.pFri, value: next(5) }, { label: T.pSat, value: next(6) }, { label: T.pSun, value: next(0) }];
  const timePicks = [
    { label: T.tEvening, s: '19:00', e: '23:00' }, { label: T.tLate, s: '16:00', e: '22:00' },
    { label: T.tAllDay, s: '09:00', e: '21:00' }, { label: T.tAllNight, s: '22:00', e: '04:00' },
  ];
  const err = (k: string) => errors[k];
  const opt = <span className="font-normal text-fog">{T.optional}</span>;
  const sec = (k: Sec) => ({ basics: T.secBasics, when: T.secWhen, where: T.secWhere, tickets: T.secTickets, lineup: T.secLineup, media: T.secMedia, team: T.secTeam }[k]);
  const entryModes = (o.entryModes ?? []) as { value: Entry; label: Pair; hint: Pair }[];
  const partner = partnerOf(f.ticketUrl);
  const where = f.venueMode === 'saved' ? f.venueLabel : f.venueName;
  const area = f.venueMode === 'saved' ? f.venueArea : f.area;
  const saveLabel = id ? (dirty ? T.saveChanges : T.saved) : publishNow ? T.createPublish : T.createDraft;

  return (
    <div className="kd-split gap-[clamp(24px,3vw,40px)]">
      <form className="kd-main flex flex-col gap-4" noValidate onSubmit={(e) => { e.preventDefault(); void save(); }}>
        {banner}

        <Section id="basics" n={1} title={sec('basics')} done={sectionDone('basics', f)} doneLabel={T.done}>
          {!id ? (
            <Field label={T.organizer} error={err('organizer')}>
              <AsyncPick label={T.organizer} placeholder={T.organizerPh} value={organizer} load={findOrganizers} onPick={setOrganizer} />
            </Field>
          ) : null}
          <Field label={T.name} htmlFor="evTitle" hint={`${f.title.length} / 120`} error={err('title')}>
            <Input id="evTitle" value={f.title} maxLength={140} placeholder={T.namePh} invalid={!!err('title')} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            {o.genres.length > 1 ? (
              <Field label={T.genre} htmlFor="evGenre">
                <Select id="evGenre" value={f.genre} onChange={(e) => set({ genre: e.target.value })}>
                  <option value="">{T.genrePh}</option>
                  {o.genres.map((g) => <option key={g.value} value={g.value}>{g.label[lang]}</option>)}
                </Select>
              </Field>
            ) : null}
            <Field label={T.age}>
              <Segmented label={T.age} value={f.age} onChange={(v) => set({ age: v })}
                options={((o.ages ?? []) as { value: string; label: Pair }[]).map((a) => ({ value: a.value, label: a.value === 'All ages' ? a.label[lang] : a.value }))} />
            </Field>
            <Field label={<>{T.kind} {opt}</>} htmlFor="evType">
              <Select id="evType" value={f.eventType} onChange={(e) => set({ eventType: e.target.value })}>
                <option value="">{T.kindPh}</option>
                {o.eventTypes.map((t) => <option key={t.value} value={t.value}>{t.label[lang]}</option>)}
              </Select>
            </Field>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 flex w-full items-baseline justify-between gap-3"><span className="kd-flabel">{T.styles} {opt}</span><span className="kd-s">{T.stylesMax}</span></legend>
            <div className="flex flex-wrap gap-2">
              {o.styles.filter((s) => !f.genre || !s.genre || s.genre === f.genre || f.styles.includes(s.value)).map((s) => {
                const on = f.styles.includes(s.value);
                return <Chip key={s.value} family="edm" on={on} disabled={!on && f.styles.length >= 5} onClick={() => set({ styles: on ? f.styles.filter((x) => x !== s.value) : [...f.styles, s.value] })}>{s.label[lang]}</Chip>;
              })}
            </div>
          </fieldset>
          <Field label={T.descVi} htmlFor="evDescVi" hint={`${f.descVi.length} / 4000`}>
            <TextArea id="evDescVi" rows={5} maxLength={4000} value={f.descVi} placeholder={T.descPh} onChange={(e) => set({ descVi: e.target.value })} />
          </Field>
          {showEn ? (
            <Field label={<>{T.descEn} {opt}</>} htmlFor="evDescEn" hint={`${f.descEn.length} / 4000`}>
              <TextArea id="evDescEn" rows={4} maxLength={4000} value={f.descEn} onChange={(e) => set({ descEn: e.target.value })} />
            </Field>
          ) : (
            <Button tone="ghost" size="sm" className="-ml-3 self-start" onClick={() => setShowEn(true)}><TranslateIcon size={16} aria-hidden="true" />{T.addEn}</Button>
          )}
        </Section>

        <Section id="when" n={2} title={sec('when')} sub={whenSub} done={sectionDone('when', f)} doneLabel={T.done}>
          <Segmented label={T.days} className="self-start" value={f.multiDay ? 'multi' : 'one'}
            onChange={(v) => set({ multiDay: v === 'multi', endsOn: v === 'multi' ? f.endsOn || f.startsOn : f.endsOn })}
            options={[{ value: 'one', label: T.oneDay }, { value: 'multi', label: T.multiDay }]} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={f.multiDay ? T.firstDay : T.date} htmlFor="evStart">
              <Input id="evStart" type="date" className="kd-num" value={f.startsOn} onChange={(e) => { const v = e.target.value; set({ startsOn: v, endsOn: f.endsOn && v && f.endsOn < v ? v : f.endsOn }); }} />
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={T.quickDates}>
                {datePicks.map((p) => <Chip key={p.label} on={f.startsOn === p.value} onClick={() => set({ startsOn: p.value, endsOn: f.endsOn && f.endsOn < p.value ? p.value : f.endsOn })}>{p.label}</Chip>)}
              </div>
            </Field>
            {f.multiDay ? (
              <Field label={T.lastDay} htmlFor="evEnd" error={err('endsOn')}>
                <Input id="evEnd" type="date" className="kd-num" min={f.startsOn || undefined} invalid={!!err('endsOn')} value={f.endsOn} onChange={(e) => set({ endsOn: e.target.value })} />
              </Field>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={T.doors} htmlFor="evT1"><TimeSelect id="evT1" value={f.startTime} nextDay={T.nextDay} onChange={(v) => set({ startTime: v })} /></Field>
            <Field label={T.ends} htmlFor="evT2"><TimeSelect id="evT2" value={f.endTime} after={f.startTime} nextDay={T.nextDay} onChange={(v) => set({ endTime: v })} /></Field>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={T.quickTimes}>
            {timePicks.map((p) => <Chip key={p.s} on={f.startTime === p.s && f.endTime === p.e} onClick={() => set({ startTime: p.s, endTime: p.e })}>{p.label}</Chip>)}
          </div>
        </Section>

        <Section id="where" n={3} title={sec('where')} done={sectionDone('where', f)} doneLabel={T.done}>
          <Segmented label={T.venueMode} className="self-start" value={f.venueMode} onChange={(v) => set({ venueMode: v })}
            options={[{ value: 'saved', label: T.savedVenue }, { value: 'new', label: T.newVenue }]} />
          {f.venueMode === 'saved' ? (
            <>
              <Field label={T.venue}>
                <AsyncPick label={T.venue} placeholder={T.venuePh}
                  value={f.venueId ? { value: f.venueId, label: f.venueLabel ?? '', sub: f.venueSub } : null}
                  load={findVenues}
                  onPick={(i) => set({ venueId: i?.value ?? null, venueLabel: i?.label ?? null, venueSub: i?.sub ?? '', venueArea: (i as { area?: string } | null)?.area ?? '' })} />
              </Field>
              {f.venueId ? <span className="self-start"><Status tone="ok"><MapPinIcon size={14} aria-hidden="true" />{T.pinned}</Status></span> : null}
            </>
          ) : (
            <>
              <Field label={T.city} htmlFor="evCity" hint={city && city.currency !== 'VND' ? fill(T.pricesIn, { c: city.currency }) : undefined}>
                <Select id="evCity" value={f.city} onChange={(e) => set({ city: e.target.value || defaultCity })}>
                  {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name[lang]}</option>)}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={T.venueName} htmlFor="evVname"><Input id="evVname" value={f.venueName} placeholder={T.venueNamePh} maxLength={160} onChange={(e) => set({ venueName: e.target.value })} /></Field>
                <Field label={T.area} htmlFor="evArea">
                  <Input id="evArea" list="evAreaList" value={f.area} placeholder={T.areaPh} maxLength={60} onChange={(e) => set({ area: e.target.value })} />
                  <datalist id="evAreaList">{o.areaGroups.flatMap((g) => g.areas.map((a) => <option key={g.label.en + a} value={a}>{g.label[lang]}</option>))}</datalist>
                </Field>
              </div>
              <Field label={<>{T.address} {opt}</>} htmlFor="evAddr"><Input id="evAddr" value={f.address} placeholder={T.addressPh} maxLength={240} onChange={(e) => set({ address: e.target.value })} /></Field>
              <p className="kd-s">{T.newVenueNote}</p>
            </>
          )}
        </Section>

        <Section id="tickets" n={4} title={sec('tickets')} done={sectionDone('tickets', f)} doneLabel={T.done}>
          <Field label={T.entry} hint={entryModes.find((m) => m.value === f.entryMode)?.hint[lang]}>
            <Segmented label={T.entry} className="self-start" value={f.entryMode} onChange={(v) => set({ entryMode: v })} options={entryModes.map((m) => ({ value: m.value, label: m.label[lang] }))} />
          </Field>
          {f.entryMode === 'paid' ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={fill(T.priceFrom, { c: currency })} htmlFor="evPrice" hint={T.priceHint}>
                  <PriceInput id="evPrice" lang={lang} value={f.priceFrom} onChange={(v) => set({ priceFrom: v })} />
                  {currency === 'VND' ? (
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label={T.pricePresets}>
                      {PRICE_PRESETS.map((n) => <Chip key={n} on={f.priceFrom === n} onClick={() => set({ priceFrom: n })}>{n.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}</Chip>)}
                    </div>
                  ) : null}
                </Field>
                <Field label={<>{T.capacity} {opt}</>} htmlFor="evCap" error={err('capacity')}>
                  <Input id="evCap" className="kd-num" inputMode="numeric" value={f.capacity} placeholder={T.capacityPh} invalid={!!err('capacity')} onChange={(e) => set({ capacity: e.target.value.replace(/\D/g, '').slice(0, 6) })} />
                </Field>
              </div>
              <Field label={<span className="inline-flex items-center gap-2">{T.ticketUrl}{partner ? <Status tone="ok"><SealCheckIcon size={12} aria-hidden="true" />{partner}</Status> : null}</span>} htmlFor="evTicket" error={err('ticketUrl')}>
                <Input id="evTicket" type="url" inputMode="url" value={f.ticketUrl} placeholder="https://ticketbox.vn/…" invalid={!!err('ticketUrl')}
                  onChange={(e) => set({ ticketUrl: e.target.value })} onBlur={() => set({ ticketUrl: withScheme(f.ticketUrl) })} />
              </Field>
              <div className="border-t border-line">
                <SwitchRow label={T.tiersSwitch} note={!id ? T.tiersNeedDraft : !canTier ? T.tiersVndOnly : undefined} checked={showTiers}
                  disabled={!id || (!canTier && !showTiers)} onChange={(v) => setShowTiers(v)} />
              </div>
              {showTiers && id ? (
                <TierEditor lang={lang} rows={f.tiers} onChange={(rows) => set({ tiers: rows })} presets={(o.tierPresets ?? []) as { key: string; name: Pair }[]} priceFrom={f.priceFrom} currency={currency} />
              ) : null}
              {err('tiers') ? <p role="alert" className="kd-s text-hot">{err('tiers')}</p> : null}
            </>
          ) : null}
        </Section>

        <Section id="lineup" n={5} title={sec('lineup')} done={sectionDone('lineup', f)} doneLabel={T.done}>
          <Field label={<>{T.lineup} {opt}</>} htmlFor="evLineup" hint={T.lineupHint}>
            <Lineup lang={lang} id="evLineup" value={f.lineup} onChange={(lineup) => set({ lineup })} />
          </Field>
        </Section>

        <Section id="media" n={6} title={sec('media')} done={sectionDone('media', f)} doneLabel={T.done}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Upload lang={lang} purpose="cover" label={T.cover} value={f.coverUrl} onChange={(v) => set({ coverUrl: v })} />
            <Upload lang={lang} purpose="logo" label={T.logo} value={f.logoUrl} onChange={(v) => set({ logoUrl: v })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={<>{T.eventUrl} {opt}</>} htmlFor="evPage" error={err('eventUrl')}>
              <Input id="evPage" type="url" inputMode="url" value={f.eventUrl} placeholder="https://…" invalid={!!err('eventUrl')} onChange={(e) => set({ eventUrl: e.target.value })} onBlur={() => set({ eventUrl: withScheme(f.eventUrl) })} />
            </Field>
            <Field label={<>{T.brandUrl} {opt}</>} htmlFor="evBrand" error={err('brandUrl')}>
              <Input id="evBrand" type="url" inputMode="url" value={f.brandUrl} placeholder="https://facebook.com/…" invalid={!!err('brandUrl')} onChange={(e) => set({ brandUrl: e.target.value })} onBlur={() => set({ brandUrl: withScheme(f.brandUrl) })} />
            </Field>
          </div>
        </Section>

        <Section id="team" n={7} title={sec('team')} done={false} doneLabel={T.done}>
          <div className="flex flex-col border-t border-line">
            <SwitchRow label={T.featuredSwitch} checked={f.featured} onChange={(v) => set({ featured: v })} />
            {!id ? <SwitchRow label={T.publishOnCreate} checked={publishNow} onChange={setPublishNow} /> : null}
          </div>
          <Field label={<>{T.badge} {opt}</>} htmlFor="evBadge">
            <Select id="evBadge" value={f.badge} onChange={(e) => set({ badge: e.target.value })}>
              <option value="">{T.noBadge}</option>
              {((o.badges ?? []) as { value: string; label: Pair }[]).map((b) => <option key={b.value} value={b.value}>{b.label[lang]}</option>)}
            </Select>
          </Field>
        </Section>
      </form>

      <aside className="kd-side flex flex-col gap-4 self-start md:sticky md:top-6" aria-label={T.quality}>
        <Panel className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <span className={cx('kd-d3 kd-num', q.band === 'strong' ? 'text-ok' : q.band === 'passable' ? 'text-paper' : 'text-warn')}>{q.score}</span>
            <span className="flex flex-col gap-0.5">
              <span className="kd-m">{T.quality}</span>
              <Status tone={q.band === 'strong' ? 'ok' : q.band === 'passable' ? 'none' : 'warn'}>{q.band === 'strong' ? T.qStrong : q.band === 'passable' ? T.qPassable : T.qAtRisk}</Status>
            </span>
          </div>
          {missing.length ? (
            <div className="flex flex-col gap-2">
              <span className="kd-hs flex items-center gap-2"><WarningCircleIcon size={16} className="text-warn" aria-hidden="true" />{fill(T.missingN, { n: missing.length })}</span>
              <div className="flex flex-wrap gap-1.5">{missing.map((k) => <Chip key={k} onClick={() => jump(REQUIRED[k].sec)}>{T[REQUIRED[k].label]}</Chip>)}</div>
            </div>
          ) : <span className="kd-hs flex items-center gap-2"><CheckCircleIcon size={16} className="text-ok" aria-hidden="true" />{T.ready}</span>}
          {boosts.length ? (
            <ul className="flex flex-col">
              {boosts.map((c) => (
                <li key={c.key}>
                  <button type="button" className="flex w-full items-center gap-2 border-t border-line py-2 text-left text-sm hover:text-paper" onClick={() => jump(c.sec)}>
                    <span className="min-w-0 flex-1">{T[c.label]}</span><span className="kd-m kd-num">+{c.pts}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button tone={primary ? 'default' : 'acc'} disabled={busy !== null || (!dirty && !!id)} onClick={() => save()}><FloppyDiskIcon size={16} aria-hidden="true" />{saveLabel}</Button>
            {primary ? <Button tone="acc" disabled={busy !== null || missing.length > 0} onClick={runPrimary}><PaperPlaneRightIcon size={16} aria-hidden="true" />{primary.label}</Button> : null}
          </div>
          <span className="kd-m" role="status" aria-live="polite">{dirty ? T.unsaved : savedAt ? fill(T.savedAt, { t: savedAt }) : id ? T.saved : T.notSaved}</span>
        </Panel>
        <span className="kd-m">{T.preview}</span>
        <article className="kd-ev kd-g-edm">
          <Art family="edm" cover={f.coverUrl} />
          <div className="flex flex-col gap-1">
            <span className="kd-s kd-num">{f.startsOn ? `${whenShort({ startsOn: f.startsOn }, lang)}${f.startTime ? ' · ' + f.startTime : ''}` : T.noDate}</span>
            <span className="kd-h">{f.title.trim() || T.noTitle}</span>
            <span className="kd-s flex min-w-0 items-center gap-1.5"><span className="kd-mk" aria-hidden="true" /><span className="kd-ell">{[where, area].filter(Boolean).join(' · ') || T.noVenue}</span></span>
            <span className={cx('kd-mb kd-num mt-0.5', f.entryMode === 'free' && 'text-acc')}>
              {f.entryMode === 'donation' ? T.donation : f.entryMode === 'free' || f.priceFrom ? priceLine({ isFree: f.entryMode === 'free', entryMode: f.entryMode, priceFrom: f.priceFrom, currency }, lang) : T.noPrice}
            </span>
            {orgName ?? organizer?.label ? <span className="kd-m">{orgName ?? organizer?.label}</span> : null}
          </div>
        </article>
      </aside>
    </div>
  );
}

