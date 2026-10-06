'use client';
/**
 * /studio/profile: the organiser's details. What the public page shows (logo, cover, name, type,
 * about, website, cities, links, open to artist submissions), the business and contact details
 * review and invoices use, and the team.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRightIcon, SealCheckIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { pick, type Lang, type Pair } from '../copy';
import { useKd } from '../runtime';
import { Button, buttonClass, Chip } from '../ui/actions';
import { FieldLabel, Input, Select, SwitchRow, TextArea } from '../ui/forms';
import { Avatar, Status } from '../ui/parts';
import { STUDIO } from './copy';
import { Block, Page } from './parts';
import { useStudio } from './root';

interface City { slug: string; name: Pair }
interface Profile {
  slug: string; name: string; type: string; bio: Pair | null; logoUrl: string | null; coverUrl: string | null; website: string | null;
  legalName: string | null; taxCode: string | null; address: string | null; email: string | null; hotline: string | null; zalo: string | null;
  contactName: string | null; contactRole: string | null; verified: boolean; markets: string[] | null; openForSubmissions: boolean;
  links: Record<string, string> | null; members: { id: string; name: string; email: string; role: string }[]; myRole: string;
}

const TYPES: [string, Pair][] = [
  ['promoter', { en: 'Promoter', vi: 'Đơn vị tổ chức' }], ['venue', { en: 'Club or venue', vi: 'Club / địa điểm' }], ['festival', { en: 'Festival', vi: 'Lễ hội' }],
  ['agency', { en: 'Agency', vi: 'Agency' }], ['collective', { en: 'Collective', vi: 'Collective' }], ['independent', { en: 'Independent organiser', vi: 'Tổ chức độc lập' }],
  ['company', { en: 'Company', vi: 'Doanh nghiệp' }], ['public', { en: 'Public body', vi: 'Cơ quan công' }],
];
const LINKS: [string, string][] = [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['tiktok', 'TikTok'], ['x', 'X'], ['youtube', 'YouTube'], ['soundcloud', 'SoundCloud'], ['spotify', 'Spotify']];

export function BusinessProfile() {
  const { lang } = useStudio();
  const T = pick(STUDIO, lang);
  const [p, setP] = useState<Profile | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  useEffect(() => {
    FF.maybe(FF.get('/organizer/profile'), null).then(setP);
    FF.maybe(FF.get('/meta/discovery'), { cities: [] }).then((m: { cities: City[] }) => setCities(m.cities));
  }, []);
  if (!p) return <Page><div className="kd-skel h-80" aria-hidden="true" /></Page>;
  return (
    <Page>
      <div className="kd-sec items-end pb-2">
        <div className="flex min-w-0 items-center gap-3.5">
          <Avatar org name={p.name} src={p.logoUrl} size={52} />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="kd-m">{T.business}</span>
            <h1 className="kd-d2 kd-ell">{p.name}</h1>
            {p.verified ? <span className="kd-s flex items-center gap-1.5"><SealCheckIcon size={16} weight="fill" className="text-acc" aria-hidden="true" />{T.bizVerified}</span> : <Status>{T.bizUnverified}</Status>}
          </div>
        </div>
        <a className={buttonClass({ size: 'sm' })} href={'/o/' + p.slug}>{T.publicProfile}<ArrowUpRightIcon size={14} aria-hidden="true" /></a>
      </div>
      <div className="kd-split gap-3">
        <div className="kd-main flex flex-col gap-3">
          <PublicForm lang={lang} p={p} cities={cities} onSaved={setP} />
          <LegalForm lang={lang} p={p} onSaved={setP} />
        </div>
        <Block className="kd-side self-start" title={T.bizTeam}>
          <ul className="flex flex-col">
            {p.members.map((m) => (
              <li key={m.id} className="flex min-h-13 items-center gap-3 border-b border-line last:border-b-0">
                <Avatar name={m.name} size={32} />
                <span className="flex min-w-0 flex-1 flex-col"><span className="kd-hs kd-ell">{m.name}</span><span className="kd-s kd-ell">{m.email}</span></span>
                <span className="kd-m">{m.role === 'owner' ? T.roleOwner : T.roleMember}</span>
              </li>
            ))}
          </ul>
        </Block>
      </div>
    </Page>
  );
}

function useSave(lang: Lang, onSaved: (p: Profile) => void) {
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const [busy, setBusy] = useState(false);
  const save = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const out = await FF.patch('/organizer/profile', body);
      kd.toast(out.message ? FF.text(out.message, lang) : T.saved);
      onSaved(await FF.get('/organizer/profile'));
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
    setBusy(false);
  };
  return { busy, save };
}

function PublicForm({ lang, p, cities, onSaved }: { lang: Lang; p: Profile; cities: City[]; onSaved: (p: Profile) => void }) {
  const T = pick(STUDIO, lang);
  const { busy, save } = useSave(lang, onSaved);
  const [f, setF] = useState({
    name: p.name, type: p.type, bioVi: p.bio?.vi ?? '', bioEn: p.bio?.en ?? '', website: p.website ?? '', logoUrl: p.logoUrl, coverUrl: p.coverUrl,
    markets: p.markets ?? [], open: p.openForSubmissions, links: { ...(p.links ?? {}) } as Record<string, string>,
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save({
      name: f.name.trim(), type: f.type, bio: { vi: f.bioVi.trim(), en: f.bioEn.trim() || f.bioVi.trim() }, website: f.website.trim(),
      logoUrl: f.logoUrl, coverUrl: f.coverUrl, markets: f.markets, openForSubmissions: f.open,
      links: Object.fromEntries(LINKS.map(([k]) => [k, f.links[k]?.trim() || null])),
    });
  };
  return (
    <Block title={T.bizPublic}>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          <ImagePick lang={lang} kind="logo" label={T.fLogo} hint={T.fLogoHint} value={f.logoUrl} onChange={(v) => setF({ ...f, logoUrl: v })} />
          <ImagePick lang={lang} kind="cover" label={T.fCover} hint="1600 × 900" value={f.coverUrl} onChange={(v) => setF({ ...f, coverUrl: v })} />
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="bzName">{T.bizName}</FieldLabel><Input id="bzName" required maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="bzType">{T.bizType}</FieldLabel><Select id="bzType" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{TYPES.map(([k, l]) => <option key={k} value={k}>{l[lang]}</option>)}</Select></div>
        </div>
        <div className="flex flex-col gap-2"><FieldLabel htmlFor="bzBio">{T.bizBio}</FieldLabel><TextArea id="bzBio" rows={3} maxLength={4000} value={f.bioVi} onChange={(e) => setF({ ...f, bioVi: e.target.value })} /></div>
        <div className="flex flex-col gap-2"><FieldLabel htmlFor="bzBioEn">{T.bizBio} (English) <span className="font-normal text-fog">{T.optional}</span></FieldLabel><TextArea id="bzBioEn" rows={2} maxLength={4000} value={f.bioEn} onChange={(e) => setF({ ...f, bioEn: e.target.value })} /></div>
        <div className="flex flex-col gap-2"><FieldLabel htmlFor="bzWeb">{T.bizWebsite}</FieldLabel><Input id="bzWeb" type="url" inputMode="url" placeholder="https://" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></div>
        <fieldset className="flex flex-col gap-2">
          <legend className="kd-flabel mb-2">{T.bizMarkets}</legend>
          <div className="flex flex-wrap gap-1.5">
            {cities.map((c) => <Chip key={c.slug} on={f.markets.includes(c.slug)} onClick={() => setF({ ...f, markets: f.markets.includes(c.slug) ? f.markets.filter((x) => x !== c.slug) : [...f.markets, c.slug].slice(0, 12) })}>{c.name[lang]}</Chip>)}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="kd-flabel mb-2">{T.bizLinks}</legend>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
            {LINKS.map(([k, label]) => (
              <Input key={k} type="url" inputMode="url" aria-label={label} placeholder={label} maxLength={500} value={f.links[k] ?? ''} onChange={(e) => setF({ ...f, links: { ...f.links, [k]: e.target.value } })} />
            ))}
          </div>
        </fieldset>
        <div className="border-t border-line"><SwitchRow label={T.bizOpen} checked={f.open} onChange={(v) => setF({ ...f, open: v })} /></div>
        <Button tone="acc" type="submit" className="self-start" disabled={busy}>{T.save}</Button>
      </form>
    </Block>
  );
}

function LegalForm({ lang, p, onSaved }: { lang: Lang; p: Profile; onSaved: (p: Profile) => void }) {
  const T = pick(STUDIO, lang);
  const { busy, save } = useSave(lang, onSaved);
  const keys = ['legalName', 'taxCode', 'address', 'email', 'hotline', 'zalo', 'contactName', 'contactRole'] as const;
  const [f, setF] = useState(Object.fromEntries(keys.map((k) => [k, p[k] ?? ''])) as Record<(typeof keys)[number], string>);
  const label: Record<(typeof keys)[number], string> = {
    legalName: T.bizLegalName, taxCode: T.bizTax, address: T.bizAddress, email: T.bizEmail, hotline: T.bizHotline, zalo: T.bizZalo, contactName: T.bizContact, contactRole: T.bizRole,
  };
  const max: Record<(typeof keys)[number], number> = { legalName: 160, taxCode: 20, address: 240, email: 200, hotline: 30, zalo: 80, contactName: 80, contactRole: 80 };
  return (
    <Block title={T.bizLegal}>
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save(Object.fromEntries(keys.map((k) => [k, f[k].trim()]))); }}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          {keys.map((k) => (
            <div key={k} className="flex flex-col gap-2">
              <FieldLabel htmlFor={'lg-' + k} hint={k === 'taxCode' ? T.bizTaxHint : undefined}>{label[k]}</FieldLabel>
              <Input id={'lg-' + k} type={k === 'email' ? 'email' : k === 'hotline' ? 'tel' : 'text'} inputMode={k === 'taxCode' ? 'numeric' : undefined} maxLength={max[k]} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
            </div>
          ))}
        </div>
        <Button tone="acc" type="submit" className="self-start" disabled={busy}>{T.save}</Button>
      </form>
    </Block>
  );
}

function ImagePick({ lang, kind, label, hint, value, onChange }: { lang: Lang; kind: 'logo' | 'cover'; label: string; hint: string; value: string | null; onChange: (v: string | null) => void }) {
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const send = async (file: File) => {
    setBusy(true);
    try { const form = new FormData(); form.append('file', file); onChange((await FF.api('POST', '/uploads?purpose=' + kind, form)).url); } catch (e) { kd.toast(FF.errorText(e, lang)); }
    setBusy(false);
  };
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-[10px] border border-dashed border-line2 px-4 py-3">
      {value
        // eslint-disable-next-line @next/next/no-img-element -- uploads come from the API's file storage
        ? <img src={value} alt="" className={kind === 'logo' ? 'size-11 shrink-0 rounded-lg object-cover' : 'h-11 w-[78px] shrink-0 rounded-md object-cover'} />
        : null}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5"><span className="kd-hs">{label}</span><span className="kd-s">{busy ? T.fUploading : hint}</span></span>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { const file = e.target.files?.[0]; if (file) send(file); e.target.value = ''; }} />
      <Button size="sm" disabled={busy} onClick={() => input.current?.click()} aria-label={`${value ? T.fChange : T.fUpload} · ${label}`}>{value ? T.fChange : T.fUpload}</Button>
    </div>
  );
}
