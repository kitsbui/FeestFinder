'use client';
/**
 * The owner's side of a project: /p/new starts one, /p/<slug>/manage edits it (the idea, the
 * numbers, what it looks for, the cover, sponsor packages), sends it for review, answers offers
 * (an accepted one shows how to reach the person) and links the event it became. /p/mine lists
 * one's projects and the offers one made. Anyone signed in may start one: no craft needed.
 */
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { CheckIcon, PlusIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../../copy';
import { money } from '../../format';
import { KdLink as Link, inLang } from '../../link';
import { useKd } from '../../runtime';
import { Button, Chip, LinkButton } from '../../ui/actions';
import { FieldError, FieldLabel, Input, Select, TextArea } from '../../ui/forms';
import { ImageLinkField } from '../../ui/image-link';
import { Card as Panel, Status, type StatusTone } from '../../ui/parts';
import { PROJ } from './copy';
import { SEEKING, SEEKING_LABEL, text, type Package, type Project, type Seeking } from './model';

interface Meta { cities: { slug: string; name: Pair }[]; styles: { key: string; label: Pair }[]; eventTypes: { key: string; label: Pair }[] }
interface Offer {
  id: string; kind: string; kindLabel: Pair; status: 'sent' | 'accepted' | 'declined'; message: string; from: string | null; person: string | null;
  artist: { slug: string; name: string } | null; package: string | null; amount: number | null; currency: string;
  contact: { email: string | null; phone: string | null } | null;
}

const STATUS_TONE: Record<Project['status'], StatusTone> = { draft: 'none', in_review: 'warn', open: 'ok', closed: 'none', realized: 'live', rejected: 'bad' };

function useStatusLabel(lang: Lang) {
  const T = pick(PROJ, lang);
  return { draft: T.sDraft, in_review: T.sReview, open: T.sOpen, closed: T.sClosed, realized: T.sRealized, rejected: T.sRejected } as Record<Project['status'], string>;
}

/** Signed in, or the way in. */
function Gate({ lang, children }: { lang: Lang; children: ReactNode }) {
  const T = pick(PROJ, lang);
  const kd = useKd();
  if (kd.session === undefined) return <div className="kd-skel h-60" aria-hidden="true" />;
  if (kd.user) return <>{children}</>;
  return (
    <Panel className="flex max-w-[420px] flex-col items-start gap-4 p-7">
      <h1 className="kd-d3">{T.gate}</h1>
      <Button tone="acc" onClick={() => kd.openSignIn(T.gate)}>{T.signIn}</Button>
    </Panel>
  );
}

export function ProjectManage({ lang, slug }: { lang: Lang; slug: string | null }) {
  return <Gate lang={lang}><Manage lang={lang} slug={slug} /></Gate>;
}

function Manage({ lang, slug }: { lang: Lang; slug: string | null }) {
  const T = pick(PROJ, lang);
  const kd = useKd();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [p, setP] = useState<Project | null | undefined>(slug ? undefined : null);
  useEffect(() => {
    FF.once('kd:discovery', () => FF.maybe(FF.get('/meta/discovery'), null)).then((d: any) => d && setMeta(d));
    if (slug) FF.maybe(FF.get('/projects/' + encodeURIComponent(slug)), null).then((x: Project | null) => setP(x && x.mine ? x : null));
  }, [slug]);
  if (!meta || p === undefined) return <div className="kd-skel h-60" aria-hidden="true" />;
  if (slug && !p) return <Panel className="p-7"><span className="kd-h">{T.empty}</span></Panel>;
  const saved = (x: Project) => {
    if (!p) { location.assign(`/p/${encodeURIComponent(x.slug)}/manage`); return; }
    setP(x);
    kd.toast(T.saved);
  };
  return (
    <div className="flex flex-col gap-10">
      <div className="kd-sec items-end">
        <h1 className="kd-d2">{p ? p.title : T.newTitle}</h1>
        {p && ['open', 'realized', 'closed'].includes(p.status) ? <LinkButton href={inLang('/p/' + encodeURIComponent(p.slug), lang)}>{T.view}</LinkButton> : null}
      </div>
      {p ? <StatusBar lang={lang} p={p} onChange={setP} /> : null}
      <Editor lang={lang} meta={meta} p={p} onSaved={saved} />
      {p ? <Packages lang={lang} p={p} onSaved={setP} /> : null}
      {p && p.status !== 'draft' ? <Offers lang={lang} p={p} /> : null}
      {p && ['open', 'closed', 'realized'].includes(p.status) ? <LinkEvent lang={lang} p={p} onSaved={setP} /> : null}
    </div>
  );
}

function StatusBar({ lang, p, onChange }: { lang: Lang; p: Project; onChange: (p: Project) => void }) {
  const T = pick(PROJ, lang);
  const label = useStatusLabel(lang);
  const kd = useKd();
  const [err, setErr] = useState('');
  const act = async (path: string) => {
    setErr('');
    try {
      const out = (await FF.post(`/me/projects/${p.id}/${path}`)) as Project & { message?: Pair };
      onChange(out);
      if (out.message) kd.toast(FF.text(out.message, lang));
    } catch (e) { setErr(FF.errorText(e, lang)); }
  };
  return (
    <Panel className="flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2"><span className="kd-m">{T.status}</span><Status tone={STATUS_TONE[p.status]}>{label[p.status]}</Status></span>
        <div className="flex flex-wrap gap-2">
          {p.status === 'draft' || p.status === 'rejected' ? <Button tone="acc" disabled={!!p.missing?.length} onClick={() => act('submit')}>{T.submit}</Button> : null}
          {p.status === 'open' ? <Button onClick={() => act('close')}>{T.close}</Button> : null}
        </div>
      </div>
      {p.decisionNote && p.status === 'rejected' ? <p className="kd-s text-paper">{fill(T.teamNote, { n: p.decisionNote })}</p> : null}
      {p.missing?.length ? <p className="kd-s">{fill(T.missing, { m: p.missing.map((m) => text(m, lang)).join(', ') })}</p> : null}
      <FieldError>{err}</FieldError>
    </Panel>
  );
}

function Editor({ lang, meta, p, onSaved }: { lang: Lang; meta: Meta; p: Project | null; onSaved: (p: Project) => void }) {
  const T = pick(PROJ, lang);
  const S = pick(SEEKING_LABEL, lang);
  const [f, setF] = useState({
    title: p?.title ?? '', pitch: p?.pitch ?? '', story: p?.story ?? '', city: p?.city.slug ?? meta.cities[0]?.slug ?? '',
    styles: p?.styles.map((s) => s.key) ?? [], eventType: p?.eventType?.key ?? '', targetOn: p?.targetOn ?? '',
    capacity: p?.capacity ? String(p.capacity) : '', budget: p?.budget != null ? String(p.budget) : '', raiseAmount: p?.raiseAmount != null ? String(p.raiseAmount) : '',
    seeking: (p?.seeking.map((s) => s.key) ?? []) as Seeking[], coverUrl: p?.coverUrl ?? null as string | null,
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const editable = !p || ['draft', 'rejected', 'open'].includes(p.status);
  const num = (s: string) => (s.replace(/\D/g, '') ? Number(s.replace(/\D/g, '')) : null);
  const toggle = <K extends 'styles' | 'seeking'>(k: K, v: string) =>
    setF((x) => ({ ...x, [k]: (x[k] as string[]).includes(v) ? (x[k] as string[]).filter((y) => y !== v) : [...(x[k] as string[]), v] }));
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    const body = {
      title: f.title, pitch: f.pitch, story: f.story, city: f.city, styles: f.styles, eventType: f.eventType || null, targetOn: f.targetOn || null,
      capacity: num(f.capacity), budget: num(f.budget), raiseAmount: num(f.raiseAmount), seeking: f.seeking, coverUrl: f.coverUrl,
    };
    try { onSaved((await (p ? FF.patch(`/me/projects/${p.id}`, body) : FF.post('/me/projects', body))) as Project); }
    catch (x) { setErr(FF.errorText(x, lang)); }
    setBusy(false);
  };
  const currency = p?.currency ?? '';
  return (
    <form onSubmit={save} className="grid max-w-[880px] grid-cols-1 gap-4 tab:grid-cols-2">
      <div className="flex flex-col gap-2 tab:col-span-2"><FieldLabel htmlFor="pj-title">{T.fTitle}</FieldLabel><Input id="pj-title" required minLength={3} maxLength={120} value={f.title} disabled={!editable} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
      <div className="flex flex-col gap-2 tab:col-span-2"><FieldLabel htmlFor="pj-pitch">{T.fPitch}</FieldLabel><Input id="pj-pitch" maxLength={200} value={f.pitch} disabled={!editable} onChange={(e) => setF({ ...f, pitch: e.target.value })} /></div>
      <div className="flex flex-col gap-2 tab:col-span-2"><FieldLabel htmlFor="pj-story" hint={T.fStoryHint}>{T.fStory}</FieldLabel><TextArea id="pj-story" rows={7} maxLength={6000} value={f.story} disabled={!editable} onChange={(e) => setF({ ...f, story: e.target.value })} /></div>
      <div className="flex flex-col gap-2"><FieldLabel htmlFor="pj-city">{T.fCity}</FieldLabel>
        <Select id="pj-city" value={f.city} disabled={!editable} onChange={(e) => setF({ ...f, city: e.target.value })}>{meta.cities.map((c) => <option key={c.slug} value={c.slug}>{c.name[lang]}</option>)}</Select>
      </div>
      <div className="flex flex-col gap-2"><FieldLabel htmlFor="pj-type">{T.fType}</FieldLabel>
        <Select id="pj-type" value={f.eventType} disabled={!editable} onChange={(e) => setF({ ...f, eventType: e.target.value })}>
          <option value="">{T.anyType}</option>
          {meta.eventTypes.map((t) => <option key={t.key} value={t.key}>{t.label[lang]}</option>)}
        </Select>
      </div>
      <div className="flex flex-col gap-2"><FieldLabel htmlFor="pj-date">{T.fDate}</FieldLabel><Input id="pj-date" type="date" className="kd-num" value={f.targetOn} disabled={!editable} onChange={(e) => setF({ ...f, targetOn: e.target.value })} /></div>
      <div className="flex flex-col gap-2"><FieldLabel htmlFor="pj-cap">{T.fCapacity}</FieldLabel><Input id="pj-cap" inputMode="numeric" className="kd-num" value={f.capacity} disabled={!editable} onChange={(e) => setF({ ...f, capacity: e.target.value })} /></div>
      <div className="flex flex-col gap-2"><FieldLabel htmlFor="pj-budget">{fill(T.fBudget, { c: currency || '…' })}</FieldLabel><Input id="pj-budget" inputMode="numeric" className="kd-num" value={f.budget} disabled={!editable} onChange={(e) => setF({ ...f, budget: e.target.value })} /></div>
      <div className="flex flex-col gap-2"><FieldLabel htmlFor="pj-raise">{fill(T.fRaise, { c: currency || '…' })}</FieldLabel><Input id="pj-raise" inputMode="numeric" className="kd-num" value={f.raiseAmount} disabled={!editable} onChange={(e) => setF({ ...f, raiseAmount: e.target.value })} /></div>
      <fieldset className="flex flex-col gap-2 tab:col-span-2" disabled={!editable}>
        <legend className="kd-flabel mb-2">{T.fSeeking}</legend>
        <div className="flex flex-wrap gap-2">{SEEKING.map((k) => <Chip key={k} on={f.seeking.includes(k)} onClick={() => toggle('seeking', k)}>{S[k]}</Chip>)}</div>
      </fieldset>
      <fieldset className="flex flex-col gap-2 tab:col-span-2" disabled={!editable}>
        <legend className="kd-flabel mb-2">{T.fStyles}</legend>
        <div className="flex flex-wrap gap-2">{meta.styles.map((s) => <Chip key={s.key} family="edm" on={f.styles.includes(s.key)} onClick={() => toggle('styles', s.key)}>{s.label[lang]}</Chip>)}</div>
      </fieldset>
      {/* A project's cover is a link (only event media is uploaded), checked as it is pasted. */}
      {editable ? (
        <ImageLinkField lang={lang} purpose="profile_cover" label={T.fCover} hint={T.fCoverHint} value={f.coverUrl} onChange={(v) => setF((x) => ({ ...x, coverUrl: v }))} className="tab:col-span-2" />
      ) : null}
      <FieldError>{err}</FieldError>
      {editable ? <Button type="submit" tone={p ? 'default' : 'acc'} disabled={busy} className="justify-self-start">{p ? T.save : T.start}</Button> : null}
    </form>
  );
}

function Packages({ lang, p, onSaved }: { lang: Lang; p: Project; onSaved: (p: Project) => void }) {
  const T = pick(PROJ, lang);
  const kd = useKd();
  type Row = { title: string; amount: string; perks: string; slots: string };
  const [rows, setRows] = useState<Row[]>(p.packages.map((k: Package) => ({ title: k.title, amount: String(k.amount), perks: k.perks, slots: k.slots ? String(k.slots) : '' })));
  const [err, setErr] = useState('');
  const editable = ['draft', 'rejected', 'open'].includes(p.status);
  const set = (i: number, patch: Partial<Row>) => setRows((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const save = async () => {
    setErr('');
    try {
      const items = rows.filter((r) => r.title.trim()).map((r) => ({ title: r.title, amount: Number(r.amount.replace(/\D/g, '') || 0), perks: r.perks, slots: r.slots ? Number(r.slots) : null }));
      onSaved((await FF.put(`/me/projects/${p.id}/packages`, { items })) as Project);
      kd.toast(T.saved);
    } catch (e) { setErr(FF.errorText(e, lang)); }
  };
  return (
    <section aria-labelledby="pk-h" className="flex max-w-[880px] flex-col gap-3">
      <h2 id="pk-h" className="kd-h">{T.packages}</h2>
      {rows.map((r, i) => (
        <div key={i} className="kd-card grid grid-cols-1 gap-3 p-4 tab:grid-cols-[2fr_1fr_100px_auto]">
          <Input aria-label={T.pTitle} placeholder={T.pTitle} value={r.title} disabled={!editable} onChange={(e) => set(i, { title: e.target.value })} />
          <Input aria-label={T.pAmount} placeholder={T.pAmount} inputMode="numeric" className="kd-num" value={r.amount} disabled={!editable} onChange={(e) => set(i, { amount: e.target.value })} />
          <Input aria-label={T.pSlots} placeholder={T.pSlots} inputMode="numeric" className="kd-num" value={r.slots} disabled={!editable} onChange={(e) => set(i, { slots: e.target.value })} />
          {editable ? <Button tone="ghost" aria-label={T.remove} onClick={() => setRows((xs) => xs.filter((_, j) => j !== i))}><XIcon size={16} aria-hidden="true" /></Button> : <span />}
          <TextArea aria-label={T.pPerks} placeholder={T.pPerks} rows={2} className="tab:col-span-4" value={r.perks} disabled={!editable} onChange={(e) => set(i, { perks: e.target.value })} />
        </div>
      ))}
      <FieldError>{err}</FieldError>
      {editable ? (
        <div className="flex flex-wrap gap-2">
          {rows.length < 8 ? <Button onClick={() => setRows((xs) => [...xs, { title: '', amount: '', perks: '', slots: '' }])}><PlusIcon size={16} aria-hidden="true" />{T.addPackage}</Button> : null}
          <Button onClick={save}>{T.savePackages}</Button>
        </div>
      ) : null}
    </section>
  );
}

function Offers({ lang, p }: { lang: Lang; p: Project }) {
  const T = pick(PROJ, lang);
  const kd = useKd();
  const [items, setItems] = useState<Offer[] | null>(null);
  const load = () => FF.maybe(FF.get(`/me/projects/${p.id}/offers`), { items: [] }).then((out: { items: Offer[] }) => setItems(out.items));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [p.id]);
  const answer = async (o: Offer, accept: boolean) => {
    try { const out = (await FF.post(`/me/projects/${p.id}/offers/${o.id}`, { accept })) as { message: Pair }; kd.toast(FF.text(out.message, lang)); load(); }
    catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  return (
    <section aria-labelledby="of-h" className="flex max-w-[880px] flex-col gap-3">
      <h2 id="of-h" className="kd-h">{T.offers}</h2>
      {!items ? <div className="kd-skel h-24" aria-hidden="true" /> : !items.length ? <p className="kd-s">{T.noOffers}</p> : (
        <ul className="flex flex-col gap-2">
          {items.map((o) => (
            <li key={o.id} className="kd-card flex flex-col gap-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="kd-tag">{text(o.kindLabel, lang)}</span>
                  <span className="kd-hs kd-ell">{o.artist ? <Link href={inLang('/a/' + encodeURIComponent(o.artist.slug), lang)} className="hover:underline">{o.artist.name}</Link> : o.from}</span>
                  {o.from && o.person && o.from !== o.person ? <span className="kd-s kd-ell">· {o.person}</span> : null}
                </span>
                {o.status === 'sent' ? (
                  <span className="flex gap-2">
                    <Button size="sm" tone="acc" onClick={() => answer(o, true)}><CheckIcon size={14} aria-hidden="true" />{T.accept}</Button>
                    <Button size="sm" onClick={() => answer(o, false)}>{T.decline}</Button>
                  </span>
                ) : <Status tone={o.status === 'accepted' ? 'ok' : 'none'}>{o.status === 'accepted' ? T.accepted : T.declined}</Status>}
              </div>
              {o.package || o.amount != null ? <span className="kd-s">{[o.package, o.amount != null ? money(o.amount, o.currency, lang) : ''].filter(Boolean).join(' · ')}</span> : null}
              {o.message ? <p className="kd-s whitespace-pre-line text-mist">{o.message}</p> : null}
              {o.contact ? <span className="kd-s text-paper">{T.contact}: {[o.contact.email, o.contact.phone].filter(Boolean).join(' · ')}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LinkEvent({ lang, p, onSaved }: { lang: Lang; p: Project; onSaved: (p: Project) => void }) {
  const T = pick(PROJ, lang);
  const [slug, setSlug] = useState(p.event?.slug ?? '');
  const [err, setErr] = useState('');
  const link = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    try { onSaved((await FF.post(`/me/projects/${p.id}/event`, { slug: slug.trim().replace(/^.*\/e\//, '') })) as Project); }
    catch (x) { setErr(FF.errorText(x, lang)); }
  };
  return (
    <form onSubmit={link} className="flex max-w-[560px] flex-col gap-2">
      <FieldLabel htmlFor="pj-ev" hint={T.linkHint}>{T.linkEvent}</FieldLabel>
      <div className="flex gap-2"><Input id="pj-ev" value={slug} onChange={(e) => setSlug(e.target.value)} boxClass="flex-1" /><Button type="submit">{T.link}</Button></div>
      <FieldError>{err}</FieldError>
    </form>
  );
}

/** /p/mine: one's projects, then the offers one made (an accepted one shows the owner's contact). */
export function MyProjects({ lang }: { lang: Lang }) {
  return <Gate lang={lang}><Mine lang={lang} /></Gate>;
}

function Mine({ lang }: { lang: Lang }) {
  const T = pick(PROJ, lang);
  const label = useStatusLabel(lang);
  const [projects, setProjects] = useState<(Project & { waiting: number })[] | null>(null);
  const [offers, setOffers] = useState<{ id: string; kindLabel: Pair; status: string; project: { slug: string; title: string }; contact: { name: string | null; email: string | null; phone: string | null } | null }[] | null>(null);
  useEffect(() => {
    FF.maybe(FF.get('/me/projects'), { items: [] }).then((o: any) => setProjects(o.items));
    FF.maybe(FF.get('/me/offers'), { items: [] }).then((o: any) => setOffers(o.items));
  }, []);
  return (
    <div className="flex flex-col gap-10">
      <div className="kd-sec items-end">
        <h1 className="kd-d2">{T.mine}</h1>
        <LinkButton tone="acc" href={inLang('/p/new', lang)}>{T.start}</LinkButton>
      </div>
      {!projects ? <div className="kd-skel h-24" aria-hidden="true" /> : !projects.length ? <p className="kd-s">{T.noneMine}</p> : (
        <ul className="flex max-w-[880px] flex-col gap-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`/p/${encodeURIComponent(p.slug)}/manage`} className="kd-card flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-white/[0.04]">
                <span className="flex min-w-0 flex-col"><span className="kd-hs kd-ell">{p.title}</span><span className="kd-s">{text(p.city.label, lang)}</span></span>
                <span className="flex items-center gap-2">
                  {p.waiting ? <span className="kd-tag">{fill(T.waitingN, { n: p.waiting })}</span> : null}
                  <Status tone={STATUS_TONE[p.status]}>{label[p.status]}</Status>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {offers?.length ? (
        <section aria-labelledby="mo-h" className="flex max-w-[880px] flex-col gap-3">
          <h2 id="mo-h" className="kd-h">{T.myOffers}</h2>
          <ul className="flex flex-col gap-2">
            {offers.map((o) => (
              <li key={o.id} className="kd-card flex flex-col gap-1 p-4">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="kd-tag">{text(o.kindLabel, lang)}</span>
                  <Link href={inLang('/p/' + encodeURIComponent(o.project.slug), lang)} className="kd-hs hover:underline">{o.project.title}</Link>
                  <span className="kd-s">· {({ accepted: T.accepted, sent: T.waiting, declined: T.declined, withdrawn: T.withdrawn } as Record<string, string>)[o.status] ?? o.status}</span>
                </span>
                {o.contact ? <span className="kd-s text-paper">{T.contact}: {[o.contact.name, o.contact.email, o.contact.phone].filter(Boolean).join(' · ')}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
