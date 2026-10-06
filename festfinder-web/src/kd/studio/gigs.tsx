'use client';
/**
 * /studio/gigs: slots the organiser posts for artists to apply to, each opening its
 * applications (shortlist, decline, book; best match first, never by followers), a form to
 * post one, and the booking requests sent from artist profiles with their answers.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { dayMonth, money } from '../format';
import { KdLink } from '../link';
import { useKd } from '../runtime';
import { Button } from '../ui/actions';
import { FieldLabel, Input, Select, SwitchRow, TextArea } from '../ui/forms';
import { Accordion, Status } from '../ui/parts';
import { STUDIO } from './copy';
import { Block, Page } from './parts';
import { useStudio } from './root';

interface City { slug: string; name: Pair; currency: string }
interface Gig {
  id: string; title: string; description: string; city: string; cityLabel: Pair | null; startsOn: string; status: 'open' | 'closed' | 'filled';
  gigType: { key: string; label: Pair } | null; setLength: { key: string; label: Pair } | null; feeMin: number | null; feeMax: number | null; currency: string;
  travelCovered: boolean; closesOn: string | null; applications?: number;
}
interface Application { id: string; status: 'pending' | 'shortlisted' | 'declined' | 'booked' | string; message: string; artist: { slug: string; name: string; roles: { label: Pair }[]; basedIn: Pair | null } }
interface Inquiry { id: string; eventOn: string; cityLabel: Pair | null; message: string; feeOffer: number | null; currency: string; status: 'pending' | 'accepted' | 'declined' | string; reply: string | null; artist?: { slug: string; name: string } }

const GIG_TYPES: [string, Pair][] = [
  ['club', { en: 'Club', vi: 'Club' }], ['festival', { en: 'Festival', vi: 'Lễ hội' }], ['rave', { en: 'Rave', vi: 'Rave' }], ['concert', { en: 'Concert', vi: 'Concert' }],
  ['brand_event', { en: 'Brand event', vi: 'Sự kiện thương hiệu' }], ['private', { en: 'Private', vi: 'Riêng tư' }], ['support', { en: 'Support slot', vi: 'Diễn mở màn' }],
  ['headline', { en: 'Headline', vi: 'Diễn chính' }], ['b2b', { en: 'B2B', vi: 'B2B' }],
];
const SET_LENGTHS: [string, Pair][] = [
  ['60', { en: '60 min', vi: '60 phút' }], ['90', { en: '90 min', vi: '90 phút' }], ['120', { en: '120 min', vi: '120 phút' }],
  ['open_format', { en: 'Open format', vi: 'Linh hoạt' }], ['all_night_long', { en: 'All night long', vi: 'Cả đêm' }],
];

export function Gigs() {
  const { lang } = useStudio();
  const T = pick(STUDIO, lang);
  const [gigs, setGigs] = useState<Gig[] | null>(null);
  const [inq, setInq] = useState<Inquiry[] | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const load = useCallback(async () => {
    const [g, i] = await Promise.all([FF.maybe(FF.get('/organizer/gigs'), { items: [] }), FF.maybe(FF.get('/organizer/inquiries'), { items: [] })]);
    setGigs(g.items); setInq(i.items);
  }, []);
  useEffect(() => {
    load();
    FF.maybe(FF.get('/meta/discovery'), { cities: [] }).then((m: { cities: City[] }) => setCities(m.cities));
  }, [load]);

  return (
    <Page>
      <h1 className="kd-d2 pb-1">{T.gigs}</h1>
      <div className="kd-split gap-3">
        <div className="kd-main flex flex-col gap-3">
          <Block title={T.gigPosted}>
            {gigs === null ? <div className="kd-skel h-24" aria-hidden="true" /> : !gigs.length ? <span className="kd-s">{T.gigNone}</span> : (
              <div className="flex flex-col">{gigs.map((g) => <GigRow key={g.id} lang={lang} g={g} onChange={load} />)}</div>
            )}
          </Block>
          <Block title={T.inquiries}>
            {inq === null ? <div className="kd-skel h-16" aria-hidden="true" /> : !inq.length ? <span className="kd-s">{T.inqNone}</span> : (
              <ul className="flex flex-col">
                {inq.map((i) => (
                  <li key={i.id} className="flex flex-col gap-1 border-b border-line py-3 first:pt-0 last:border-b-0">
                    <span className="flex items-center justify-between gap-3">
                      {i.artist ? <KdLink className="kd-hs hover:underline" href={'/a/' + i.artist.slug}>{i.artist.name}</KdLink> : <span />}
                      <Status tone={i.status === 'accepted' ? 'ok' : i.status === 'declined' ? 'bad' : 'warn'}>{i.status === 'accepted' ? T.inqAccepted : i.status === 'declined' ? T.inqDeclined : T.inqPending}</Status>
                    </span>
                    <span className="kd-m kd-num">{[dayMonth(i.eventOn, lang), i.cityLabel?.[lang], i.feeOffer != null ? money(i.feeOffer, i.currency, lang) : null].filter(Boolean).join(' · ')}</span>
                    <span className="kd-s">{i.message}</span>
                    {i.reply ? <span className="kd-s border-l-2 border-line2 pl-3 text-mist">{i.reply}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </Block>
        </div>
        <NewGig lang={lang} cities={cities} onPosted={load} />
      </div>
    </Page>
  );
}

function GigRow({ lang, g, onChange }: { lang: Lang; g: Gig; onChange: () => void }) {
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const [apps, setApps] = useState<Application[] | null>(null);
  const loadApps = useCallback(async () => setApps((await FF.maybe(FF.get(`/organizer/gigs/${g.id}/applications`), { items: [] })).items), [g.id]);
  const act = async (run: () => Promise<unknown>) => { try { await run(); onChange(); loadApps(); } catch (e) { kd.toast(FF.errorText(e, lang)); } };
  const st = { open: { tone: 'ok' as const, label: T.gigOpen }, closed: { tone: 'none' as const, label: T.gigClosed }, filled: { tone: 'warn' as const, label: T.gigFilled } }[g.status];
  const fee = g.feeMin != null || g.feeMax != null ? [g.feeMin, g.feeMax].filter((x): x is number => x != null).map((x) => money(x, g.currency, lang)).join(' – ') : null;
  return (
      <Accordion
        onToggle={(open) => { if (open && apps === null) loadApps(); }}
        summary={<span className="flex flex-col gap-0.5"><span className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="kd-hs">{g.title}</span><Status tone={st.tone}>{st.label}</Status></span><span className="kd-s kd-num">{[dayMonth(g.startsOn, lang), g.cityLabel?.[lang], g.gigType?.label[lang], g.setLength?.label[lang], fee].filter(Boolean).join(' · ')}</span></span>}
        aside={g.applications != null ? fill(T.gigApps, { n: g.applications }) : undefined}
      >
        <div className="flex flex-col gap-3 pb-2">
          {g.description ? <p className="kd-s whitespace-pre-line">{g.description}</p> : null}
          {apps === null ? <div className="kd-skel h-12" aria-hidden="true" /> : !apps.length ? <span className="kd-s">{T.appsNone}</span> : (
            <ul className="flex flex-col">
              {apps.map((a) => (
                <li key={a.id} className="flex flex-col gap-1.5 border-b border-line py-3 last:border-b-0">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <KdLink className="kd-hs hover:underline" href={'/a/' + a.artist.slug}>{a.artist.name}</KdLink>
                    <Status tone={a.status === 'booked' ? 'ok' : a.status === 'shortlisted' ? 'warn' : a.status === 'declined' ? 'bad' : 'none'}>
                      {a.status === 'booked' ? T.appBooked : a.status === 'shortlisted' ? T.appShortlisted : a.status === 'declined' ? T.appDeclined : T.appNew}
                    </Status>
                  </span>
                  <span className="kd-m">{[a.artist.roles.map((r) => r.label[lang]).join(', '), a.artist.basedIn?.[lang]].filter(Boolean).join(' · ')}</span>
                  {a.message ? <span className="kd-s">{a.message}</span> : null}
                  {a.status !== 'booked' && a.status !== 'declined' && g.status !== 'filled' ? (
                    <span className="flex flex-wrap gap-2">
                      {a.status !== 'shortlisted' ? <Button size="sm" onClick={() => act(() => FF.post(`/organizer/gigs/${g.id}/applications/${a.id}`, { status: 'shortlisted' }))}>{T.shortlist}</Button> : null}
                      <Button size="sm" tone="acc" onClick={() => act(() => FF.post(`/organizer/gigs/${g.id}/applications/${a.id}`, { status: 'booked' }))}>{T.book}</Button>
                      <Button size="sm" tone="ghost" onClick={() => act(() => FF.post(`/organizer/gigs/${g.id}/applications/${a.id}`, { status: 'declined' }))}>{T.decline}</Button>
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {g.status !== 'filled' ? (
            <Button tone="ghost" size="sm" className="-ml-3 self-start" onClick={() => act(() => FF.patch(`/organizer/gigs/${g.id}`, { status: g.status === 'open' ? 'closed' : 'open' }))}>
              {g.status === 'open' ? T.gigClose : T.gigReopen}
            </Button>
          ) : null}
        </div>
      </Accordion>
  );
}

function NewGig({ lang, cities, onPosted }: { lang: Lang; cities: City[]; onPosted: () => void }) {
  const { events } = useStudio();
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const empty = { title: '', city: '', startsOn: '', closesOn: '', gigType: '', setLength: '', feeMin: '', feeMax: '', travelCovered: false, description: '', eventId: '' };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const city = f.city || cities[0]?.slug || '';
  const cur = cities.find((c) => c.slug === city)?.currency;
  const sym = cur === 'VND' ? '₫' : cur ?? '';
  const post = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await FF.post('/organizer/gigs', {
        title: f.title, city, startsOn: f.startsOn, closesOn: f.closesOn || null, gigType: f.gigType || null, setLength: f.setLength || null,
        feeMin: f.feeMin ? Number(f.feeMin) : null, feeMax: f.feeMax ? Number(f.feeMax) : null, travelCovered: f.travelCovered,
        description: f.description, eventId: f.eventId || null,
      });
      kd.toast(T.saved);
      setF(empty);
      onPosted();
    } catch (x) { kd.toast(FF.errorText(x, lang)); }
    setBusy(false);
  };
  const upcoming = events.filter((e) => e.status === 'live' || e.status === 'in_review');
  return (
    <Block className="kd-side self-start" title={T.gigNew}>
      <form className="flex flex-col gap-3.5" onSubmit={post}>
        <div className="flex flex-col gap-2"><FieldLabel htmlFor="gTitle">{T.gigTitle}</FieldLabel><Input id="gTitle" required minLength={3} maxLength={120} placeholder={T.gigTitlePh} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="gCity">{T.fCity}</FieldLabel><Select id="gCity" value={city} onChange={(e) => setF({ ...f, city: e.target.value })}>{cities.map((c) => <option key={c.slug} value={c.slug}>{c.name[lang]}</option>)}</Select></div>
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="gDate">{T.gigDate}</FieldLabel><Input id="gDate" type="date" required className="kd-num" value={f.startsOn} onChange={(e) => setF({ ...f, startsOn: e.target.value })} /></div>
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="gType">{T.gigType}</FieldLabel><Select id="gType" value={f.gigType} onChange={(e) => setF({ ...f, gigType: e.target.value })}><option value="">—</option>{GIG_TYPES.map(([k, l]) => <option key={k} value={k}>{l[lang]}</option>)}</Select></div>
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="gSet">{T.gigSet}</FieldLabel><Select id="gSet" value={f.setLength} onChange={(e) => setF({ ...f, setLength: e.target.value })}><option value="">—</option>{SET_LENGTHS.map(([k, l]) => <option key={k} value={k}>{l[lang]}</option>)}</Select></div>
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="gMin">{T.gigFeeMin} ({sym})</FieldLabel><Input id="gMin" inputMode="numeric" className="kd-num" value={f.feeMin} onChange={(e) => setF({ ...f, feeMin: e.target.value.replace(/\D/g, '') })} /></div>
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="gMax">{T.gigFeeMax} ({sym})</FieldLabel><Input id="gMax" inputMode="numeric" className="kd-num" value={f.feeMax} onChange={(e) => setF({ ...f, feeMax: e.target.value.replace(/\D/g, '') })} /></div>
          <div className="col-span-2 flex flex-col gap-2"><FieldLabel htmlFor="gCloses">{T.gigCloses}</FieldLabel><Input id="gCloses" type="date" className="kd-num" value={f.closesOn} onChange={(e) => setF({ ...f, closesOn: e.target.value })} /></div>
        </div>
        {upcoming.length ? (
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="gEvent">{T.gigEvent}</FieldLabel><Select id="gEvent" value={f.eventId} onChange={(e) => setF({ ...f, eventId: e.target.value })}><option value="">{T.gigNoEvent}</option>{upcoming.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</Select></div>
        ) : null}
        <div className="border-t border-line"><SwitchRow label={T.gigTravel} checked={f.travelCovered} onChange={(v) => setF({ ...f, travelCovered: v })} /></div>
        <div className="flex flex-col gap-2"><FieldLabel htmlFor="gDesc">{T.gigDesc} <span className="font-normal text-fog">{T.optional}</span></FieldLabel><TextArea id="gDesc" rows={3} maxLength={3000} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <Button tone="acc" type="submit" className="self-start" disabled={busy || !city}>{T.gigPost}</Button>
      </form>
    </Block>
  );
}
