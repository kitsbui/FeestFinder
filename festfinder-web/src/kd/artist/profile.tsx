'use client';
/**
 * /studio/artist: the profile an artist keeps (PATCH /me/artist). Their upcoming and past shows,
 * the organisers they worked with and their shared lineups come from events, never from this
 * form. Leaving with unsaved changes asks first.
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowUpRightIcon, SealCheckIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { pick, type Lang, type Pair } from '../copy';
import { count } from '../format';
import { useKd } from '../runtime';
import { Button, LinkButton } from '../ui/actions';
import { Input, Select, SwitchRow, TextArea } from '../ui/forms';
import { Stat, StatRow } from '../ui/parts';
import { Body, Field, Loaded, PageHead, useLoad, useOptions } from '../console/kit';
import { ARTIST } from './copy';
import { Block, ChipPick } from './parts';
import { ImageLinkField } from '../ui/image-link';
import { useArtist } from './root';

interface Opt { key: string; label: Pair }
interface Me {
  profile: {
    id: string; slug: string; name: string; bio: Pair | null; imageUrl: string | null; coverUrl: string | null; website: string | null;
    roles: string[] | null; basedCity: string | null; languages: string[] | null; activeSince: number | null; styles: string[] | null;
    bookingStatus: string | null; travelScope: string | null; gigTypes: string[] | null; setLengths: string[] | null;
    links: Record<string, string> | null; openToBrands: boolean; verified: boolean;
  };
  stats: { upcoming: number; events: number; followers: number };
  options: { roles: Opt[]; booking: Opt[]; travel: Opt[]; gigs: Opt[]; setLengths: Opt[]; links: Opt[] };
}

export function ArtistProfile() {
  const { lang } = useArtist();
  const load = useLoad<Me>('/me/artist');
  return <Loaded load={load}>{(me) => <Form lang={lang} me={me} />}</Loaded>;
}

const formOf = (p: Me['profile']) => ({
  name: p.name, bioVi: p.bio?.vi ?? '', bioEn: p.bio?.en ?? '', imageUrl: p.imageUrl, coverUrl: p.coverUrl, website: p.website ?? '',
  roles: p.roles ?? [], basedCity: p.basedCity ?? '', languages: (p.languages ?? []).join(', '), activeSince: p.activeSince ? String(p.activeSince) : '',
  styles: p.styles ?? [], bookingStatus: p.bookingStatus ?? '', travelScope: p.travelScope ?? '', gigTypes: p.gigTypes ?? [], setLengths: p.setLengths ?? [],
  links: { ...(p.links ?? {}) } as Record<string, string>, openToBrands: !!p.openToBrands,
});
type F = ReturnType<typeof formOf>;

function Form({ lang, me }: { lang: Lang; me: Me }) {
  const T = pick(ARTIST, lang);
  const kd = useKd();
  const options = useOptions();
  const [f, setF] = useState<F>(() => formOf(me.profile));
  const [base, setBase] = useState(() => JSON.stringify(formOf(me.profile)));
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(f) !== base;
  const set = <K extends keyof F>(k: K) => (v: F[K]) => setF((x) => ({ ...x, [k]: v }));

  // Unsaved changes: the browser asks before the page goes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  }, [dirty]);

  const opt = (list: Opt[]) => list.map((x) => ({ value: x.key, label: x.label[lang] }));
  const cities = useMemo(() => (options?.cities ?? []).map((c) => ({ value: c.value, label: c.label[lang] })), [options, lang]);
  const styles = useMemo(() => (options?.styles ?? []).map((s) => ({ value: s.value, label: s.label[lang] })), [options, lang]);
  // Chosen styles first, in the order picked (the first is the main one), then the rest.
  const styleChips = useMemo(() => [...f.styles.map((v) => styles.find((s) => s.value === v) ?? { value: v, label: v }), ...styles.filter((s) => !f.styles.includes(s.value))], [styles, f.styles]);

  const save = async (e?: FormEvent) => {
    e?.preventDefault();
    const bad: Record<string, string> = {};
    if (f.name.trim().length < 2) bad.name = T.errName;
    if (f.website.trim() && !/^https?:\/\/\S+\.\S+/.test(f.website.trim())) bad.website = T.errLink;
    if (f.activeSince && !/^(19[5-9]\d|20\d\d)$/.test(f.activeSince)) bad.activeSince = T.errYear;
    setErr(bad);
    if (Object.keys(bad).length) return;
    setBusy(true);
    try {
      const out = await FF.patch('/me/artist', {
        name: f.name.trim(), bio: { vi: f.bioVi, en: f.bioEn }, imageUrl: f.imageUrl || null, coverUrl: f.coverUrl || null, website: f.website.trim() || null,
        roles: f.roles, basedCity: f.basedCity || null,
        languages: [...new Set(f.languages.split(/[\s,]+/).map((x) => x.trim().toLowerCase().slice(0, 2)).filter((x) => /^[a-z]{2}$/.test(x)))].slice(0, 8),
        activeSince: f.activeSince ? Number(f.activeSince) : null, styles: f.styles, bookingStatus: f.bookingStatus || null, travelScope: f.travelScope || null,
        gigTypes: f.gigTypes, setLengths: f.setLengths,
        links: Object.fromEntries(me.options.links.map((l) => [l.key, (f.links[l.key] || '').trim() || null])), openToBrands: f.openToBrands,
      });
      kd.toast(out.message ? FF.text(out.message, lang) : T.saved);
      const next = formOf(out.profile);
      setF(next);
      setBase(JSON.stringify(next));
      // The rail shows the stage name from the session.
      if (out.profile.name !== me.profile.name) void kd.refresh();
    } catch (x) {
      const d = (x as { code?: string; details?: { kind?: string } });
      if (d.code === 'invalid_link' && d.details?.kind) setErr({ ['link:' + d.details.kind]: FF.errorText(x, lang) });
      kd.toast(FF.errorText(x, lang));
    }
    setBusy(false);
  };

  return (
    <form onSubmit={save} noValidate>
      <PageHead
        eyebrow={me.profile.verified ? <span className="kd-s flex items-center gap-1.5"><SealCheckIcon size={16} weight="fill" className="text-acc" aria-hidden="true" />{T.verified}</span> : null}
        title={f.name || T.profile}
        actions={(
          <>
            <LinkButton href={'/a/' + me.profile.slug}>{T.publicProfile}<ArrowUpRightIcon size={14} aria-hidden="true" /></LinkButton>
            <Button tone="acc" type="submit" disabled={busy || !dirty}>{dirty ? T.saveChanges : T.saved}</Button>
          </>
        )}
      />
      <Body>
        <StatRow>
          <Stat value={count(me.stats.upcoming, lang)} label={T.upcoming} />
          <Stat value={count(me.stats.events, lang)} label={T.events} />
          <Stat value={count(me.stats.followers, lang)} label={T.followers} />
        </StatRow>
        <div className="kd-split gap-3">
          <div className="kd-main flex flex-col gap-3">
            <Block title={T.who}>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
                <Field label={T.stageName} htmlFor="ar-name" error={err.name}>
                  <Input id="ar-name" required maxLength={80} value={f.name} invalid={!!err.name} onChange={(e) => set('name')(e.target.value)} />
                </Field>
                <Field label={T.basedIn} htmlFor="ar-city">
                  <Select id="ar-city" value={f.basedCity} onChange={(e) => set('basedCity')(e.target.value)}>
                    <option value="">—</option>
                    {cities.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </Select>
                </Field>
              </div>
              <ChipPick label={T.roles} options={opt(me.options.roles)} value={f.roles} onChange={set('roles')} max={5} />
              <ChipPick label={`${T.styles} · ${T.stylesHint}`} options={styleChips} value={f.styles} onChange={set('styles')} max={6} />
              <Field label={T.bioVi} htmlFor="ar-bio" hint={`${f.bioVi.length}/1200`}>
                <TextArea id="ar-bio" rows={4} maxLength={1200} value={f.bioVi} onChange={(e) => set('bioVi')(e.target.value)} />
              </Field>
              <Field label={<>{T.bioEn} <span className="font-normal text-fog">{T.optional}</span></>} htmlFor="ar-bio-en">
                <TextArea id="ar-bio-en" rows={3} maxLength={1200} value={f.bioEn} onChange={(e) => set('bioEn')(e.target.value)} />
              </Field>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
                <Field label={T.activeSince} htmlFor="ar-since" error={err.activeSince}>
                  <Input id="ar-since" inputMode="numeric" placeholder="2018" maxLength={4} value={f.activeSince} invalid={!!err.activeSince} onChange={(e) => set('activeSince')(e.target.value.replace(/\D/g, ''))} />
                </Field>
                <Field label={T.languages} htmlFor="ar-lang" hint={T.languagesHint}>
                  <Input id="ar-lang" placeholder="vi, en" maxLength={40} value={f.languages} onChange={(e) => set('languages')(e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
                <ImageLinkField lang={lang} purpose="avatar" label={T.photo} hint={T.photoHint} value={f.imageUrl} onChange={set('imageUrl')} />
                <ImageLinkField lang={lang} purpose="profile_cover" label={T.cover} hint={T.coverHint} value={f.coverUrl} onChange={set('coverUrl')} />
              </div>
            </Block>
            <Block title={T.listen}>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
                <Field label={T.website} htmlFor="ar-web" error={err.website}>
                  <Input id="ar-web" type="url" inputMode="url" placeholder="https://" maxLength={500} value={f.website} invalid={!!err.website} onChange={(e) => set('website')(e.target.value)} />
                </Field>
                {me.options.links.map((l) => (
                  <Field key={l.key} label={l.label[lang]} htmlFor={'ar-l-' + l.key} error={err['link:' + l.key]}>
                    <Input
                      id={'ar-l-' + l.key} type="url" inputMode="url" placeholder="https://" maxLength={500} value={f.links[l.key] ?? ''} invalid={!!err['link:' + l.key]}
                      onChange={(e) => setF((x) => ({ ...x, links: { ...x.links, [l.key]: e.target.value } }))}
                    />
                  </Field>
                ))}
              </div>
            </Block>
          </div>
          <Block title={T.bookings} className="kd-side self-start">
            <Field label={T.bookingStatus} htmlFor="ar-booking">
              <Select id="ar-booking" value={f.bookingStatus} onChange={(e) => set('bookingStatus')(e.target.value)}>
                <option value="">—</option>
                {opt(me.options.booking).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </Field>
            <Field label={T.travel} htmlFor="ar-travel">
              <Select id="ar-travel" value={f.travelScope} onChange={(e) => set('travelScope')(e.target.value)}>
                <option value="">—</option>
                {opt(me.options.travel).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </Field>
            <ChipPick label={T.gigTypes} options={opt(me.options.gigs)} value={f.gigTypes} onChange={set('gigTypes')} max={9} />
            <ChipPick label={T.setLengths} options={opt(me.options.setLengths)} value={f.setLengths} onChange={set('setLengths')} max={5} />
            <div className="border-t border-line"><SwitchRow label={T.openToBrands} checked={f.openToBrands} onChange={set('openToBrands')} /></div>
          </Block>
        </div>
      </Body>
    </form>
  );
}
