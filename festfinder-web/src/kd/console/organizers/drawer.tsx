'use client';
/**
 * One organiser in a drawer: its numbers, then verification (documents, payout account and
 * the test transfer, the verdict, strikes and suspension with a note), the whole profile, the
 * team (add, remove; the last owner stays) and its listings.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowSquareOutIcon, PlusIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { freshen } from '../../fresh';
import { fill, pick, type Lang, type Pair } from '../../copy';
import { count, money, whenShort } from '../../format';
import { useKd } from '../../runtime';
import { Button, IconButton, LinkButton } from '../../ui/actions';
import { Input, Segmented, Select, Switch, SwitchRow, TextArea } from '../../ui/forms';
import { ImageLinkField } from '../../ui/image-link';
import { Avatar, Stat, StatRow } from '../../ui/parts';
import { Tabs } from '../../ui/shell';
import { act, ago, Drawer, Empty, ErrorBox, Field, KV, Loading, Pill, stamp, useAsk, useLoad, useOptions } from '../kit';
import { useConsole } from '../root';
import { ORGS } from './copy';
import { StatePill, type OrgState } from './parts';

interface Member { id: string; name: string | null; email: string | null; phone: string | null; role: 'owner' | 'manager'; lastActiveAt: string | null; hasPassword: boolean }
interface Listing { id: string; slug: string; title: string; status: string; statusLabel: Pair | null; startsOn: string | null; genre: string | null }
export interface OrgDetail {
  id: string; slug: string; name: string; type: string; typeLabel: Pair | null; bio: Pair | null; logoUrl: string | null;
  website: string | null; legalName: string | null; taxCode: string | null; address: string | null; email: string | null; hotline: string | null; zalo: string | null;
  contactName: string | null; contactRole: string | null; since: number | null; followers: number;
  state: OrgState; docs: { id: boolean; tax: boolean; bank: boolean }; strikes: number; suspended: boolean; suspendedAt: string | null;
  bank: { bin: string | null; bankName: string | null; accountNo: string; accountName: string | null; verified: boolean; addedAt: string | null } | null;
  members: Member[]; events: Listing[];
  stats: { live: number; reports: number; gmv: number; decisions: Record<string, number> };
}

type Tab = 'verify' | 'profile' | 'team' | 'listings';

export function OrganizerDrawer({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { lang } = useConsole();
  const T = pick(ORGS, lang);
  const load = useLoad<OrgDetail>('/admin/organizers/' + id);
  const o = load.data;
  const [tab, setTab] = useState<Tab>('verify');
  const changed = () => { load.reload(); onChanged(); };
  return (
    <Drawer
      wide
      onClose={onClose}
      title={o ? o.name : T.loading}
      sub={o ? (
        <span className="flex flex-wrap items-center gap-2">
          <StatePill state={o.state} lang={lang} />
          {o.suspended ? <Pill tone="bad">{T.suspendedShort}</Pill> : null}
          <span>{fill(T.headLine, { type: FF.text(o.typeLabel, lang) || o.type, since: o.since ?? '—', f: count(o.followers, lang) })}</span>
        </span>
      ) : null}
      footer={o ? (
        <>
          <LinkButton href={'/o/' + o.slug} external target="_blank" rel="noopener">{T.publicPage}<ArrowSquareOutIcon size={14} aria-hidden="true" /></LinkButton>
          <LinkButton className="ml-auto" href={`/console/events/new?org=${encodeURIComponent(o.id)}&orgName=${encodeURIComponent(o.name)}`}><PlusIcon size={16} aria-hidden="true" />{T.newListing}</LinkButton>
        </>
      ) : null}
    >
      {load.error && !o ? <ErrorBox error={load.error} retry={load.reload} /> : !o ? <Loading /> : (
        <>
          <StatRow>
            <Stat value={o.stats.live} label={T.sLive} />
            <Stat value={`${o.stats.decisions.approved ?? 0} · ${o.stats.decisions.rejected ?? 0}`} label={T.sDecisions} />
            <Stat value={<span className={o.stats.reports ? 'text-warn' : undefined}>{o.stats.reports}</span>} label={T.sReports} />
            {/* Paid orders are FeestFinder checkout, which is VND only. */}
            <Stat value={money(o.stats.gmv, 'VND', lang)} label={T.sGmv} />
          </StatRow>
          <Tabs
            label={T.drawerTabs}
            current={tab}
            onSelect={(k) => setTab(k as Tab)}
            items={[
              { key: 'verify', label: T.dVerify },
              { key: 'profile', label: T.dProfile },
              { key: 'team', label: T.dTeam, count: o.members.length },
              { key: 'listings', label: T.dListings, count: o.events.length },
            ]}
          />
          {tab === 'verify' ? <Verification o={o} lang={lang} onChanged={changed} /> : null}
          {tab === 'profile' ? <ProfileForm key={o.name + o.type + (o.logoUrl ?? '')} o={o} lang={lang} onChanged={changed} /> : null}
          {tab === 'team' ? <Team o={o} lang={lang} onChanged={changed} /> : null}
          {tab === 'listings' ? <Listings o={o} lang={lang} /> : null}
        </>
      )}
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0" aria-label={title}>
      <h3 className="kd-hs">{title}</h3>
      {children}
    </section>
  );
}

function Verification({ o, lang, onChanged }: { o: OrgDetail; lang: Lang; onChanged: () => void }) {
  const T = pick(ORGS, lang);
  const kd = useKd();
  const ask = useAsk();
  const { refreshCounts } = useConsole();
  // Switches answer at once; a failed save puts them back.
  const [docs, setDocs] = useState(o.docs);
  const [bankOk, setBankOk] = useState(!!o.bank?.verified);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => { setDocs(o.docs); setBankOk(!!o.bank?.verified); }, [o]);
  const save = async (body: { docs?: Partial<OrgDetail['docs']>; bankVerified?: boolean; state?: OrgState }, key: string) => {
    setBusy(key);
    if (body.docs) setDocs((d) => ({ ...d, ...body.docs }));
    if (body.bankVerified !== undefined) setBankOk(body.bankVerified);
    try {
      const out = await FF.patch('/admin/organizers/' + o.id, body);
      kd.toast(out.message ? FF.text(out.message, lang) : T.saved);
      refreshCounts();
      onChanged();
    } catch (e) {
      kd.toast(FF.errorText(e, lang));
      setDocs(o.docs);
      setBankOk(!!o.bank?.verified);
    } finally { setBusy(null); }
  };
  const standing = async (body: { strikes?: number; suspended?: boolean }) => {
    let note: string | undefined;
    if (body.suspended === true) {
      const a = await ask({ title: fill(T.suspendAsk, { n: o.name }), body: T.suspendBody, confirm: T.suspendGo, danger: true, note: 'optional', noteLabel: T.internalNote });
      if (!a) return;
      note = a.note || undefined;
    }
    setBusy('standing');
    const out = await act(kd, lang, () => FF.post(`/admin/organizers/${o.id}/standing`, { ...body, note }));
    setBusy(null);
    if (out) { refreshCounts(); onChanged(); }
  };
  const docRows: [keyof OrgDetail['docs'], string][] = [['id', T.docId], ['tax', T.docTax], ['bank', T.docBank]];
  return (
    <div className="flex flex-col gap-5">
      <Section title={T.docsOnFile}>
        <div className="flex flex-col border-t border-line">
          {docRows.map(([k, label]) => <SwitchRow key={k} label={label} checked={docs[k]} disabled={busy === 'doc'} onChange={(v) => save({ docs: { [k]: v } }, 'doc')} />)}
        </div>
        <KV rows={[
          [T.legalName, o.legalName || '—'],
          [T.taxCode, o.taxCode ? <span className="kd-num">{o.taxCode}</span> : '—'],
          [T.payout, o.bank ? (
            <span>
              {o.bank.bankName ?? '—'} · <span className="kd-num">{o.bank.accountNo}</span>
              {o.bank.accountName ? ` · ${o.bank.accountName}` : <span className="text-warn"> · {T.holderMissing}</span>}
            </span>
          ) : '—'],
        ]} />
        {o.bank ? (
          <SwitchRow
            label={fill(T.testTransfer, { amount: money(1000, 'VND', lang) })}
            note={fill(T.bankAdded, { ago: ago(o.bank.addedAt, lang) })}
            checked={bankOk}
            disabled={busy === 'bank'}
            onChange={(v) => save({ bankVerified: v }, 'bank')}
          />
        ) : null}
      </Section>
      <Section title={T.verdict}>
        <Segmented<OrgState>
          label={T.verdict}
          value={o.state}
          onChange={(v) => { if (v !== o.state && busy !== 'state') void save({ state: v }, 'state'); }}
          options={[{ value: 'pending', label: T.pending }, { value: 'verified', label: T.verified }, { value: 'flagged', label: T.flagged }]}
        />
        {!docs.id && o.state !== 'verified' ? <p className="kd-s">{T.needsId}</p> : null}
      </Section>
      <Section title={T.standingHead}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="kd-flabel">{T.strikes}</span>
          <Segmented
            label={T.strikes}
            value={String(o.strikes)}
            onChange={(v) => { if (Number(v) !== o.strikes) void standing({ strikes: Number(v) }); }}
            options={['0', '1', '2', '3'].map((n) => ({ value: n, label: n }))}
          />
        </div>
        <SwitchRow
          label={o.suspended ? T.suspended : T.suspend}
          note={o.suspended && o.suspendedAt ? fill(T.since, { d: stamp(o.suspendedAt, lang) }) : null}
          checked={o.suspended}
          disabled={busy === 'standing'}
          onChange={(v) => standing({ suspended: v })}
        />
      </Section>
    </div>
  );
}

function ProfileForm({ o, lang, onChanged }: { o: OrgDetail; lang: Lang; onChanged: () => void }) {
  const T = pick(ORGS, lang);
  const kd = useKd();
  const opts = useOptions();
  const init = () => ({
    name: o.name ?? '', type: o.type, logoUrl: o.logoUrl ?? '', bioVi: o.bio?.vi ?? '', bioEn: o.bio?.en ?? '', website: o.website ?? '', legalName: o.legalName ?? '',
    taxCode: o.taxCode ?? '', address: o.address ?? '', email: o.email ?? '', hotline: o.hotline ?? '', zalo: o.zalo ?? '', contactName: o.contactName ?? '', contactRole: o.contactRole ?? '',
  });
  const [f, setF] = useState(init);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof ReturnType<typeof init>) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const dirty = JSON.stringify(f) !== JSON.stringify(init());
  const save = async () => {
    setBusy(true);
    const { bioVi, bioEn, logoUrl, ...rest } = f;
    let website = f.website.trim();
    if (website && !/^https?:\/\//i.test(website)) website = 'https://' + website;
    const out = await act(kd, lang, () => FF.patch(`/admin/organizers/${o.id}/profile`, { ...rest, website, logoUrl: logoUrl || null, bio: { vi: bioVi, en: bioEn } }));
    if (out) void freshen('o', o.slug);
    setBusy(false);
    if (out) onChanged();
  };
  const types: { value: string; label: Pair }[] = opts?.organizerTypes ?? [];
  return (
    <form className="grid gap-4 tab:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (dirty && f.name.trim().length >= 2) void save(); }}>
      <div className="flex items-center gap-3 tab:col-span-2">
        <Avatar org name={f.name || o.name} src={f.logoUrl || null} size={52} />
        {/* An organiser's logo is a link (only event media is uploaded), checked as it is pasted. */}
        <ImageLinkField lang={lang} purpose="logo" label={T.logo} hint={T.logoLinkHint} value={f.logoUrl || null} onChange={(v) => setF((x) => ({ ...x, logoUrl: v ?? '' }))} className="min-w-0 flex-1" />
      </div>
      <Field label={T.brandName} htmlFor="org-name"><Input id="org-name" required minLength={2} maxLength={80} value={f.name} onChange={set('name')} /></Field>
      <Field label={T.orgType} htmlFor="org-type">
        <Select id="org-type" value={f.type} onChange={set('type')}>
          {types.length ? types.map((t) => <option key={t.value} value={t.value}>{t.label[lang]}</option>) : <option value={f.type}>{FF.text(o.typeLabel, lang) || f.type}</option>}
        </Select>
      </Field>
      <div className="tab:col-span-2"><Field label={T.aboutVi} htmlFor="org-bio-vi"><TextArea id="org-bio-vi" rows={3} value={f.bioVi} onChange={set('bioVi')} /></Field></div>
      <div className="tab:col-span-2"><Field label={T.aboutEn} htmlFor="org-bio-en"><TextArea id="org-bio-en" rows={3} value={f.bioEn} onChange={set('bioEn')} /></Field></div>
      <Field label={T.website} htmlFor="org-web"><Input id="org-web" inputMode="url" value={f.website} onChange={set('website')} placeholder="https://" /></Field>
      <Field label={T.legalName} htmlFor="org-legal"><Input id="org-legal" value={f.legalName} onChange={set('legalName')} /></Field>
      <Field label={T.taxCode} hint={T.taxHint} htmlFor="org-tax"><Input id="org-tax" inputMode="numeric" value={f.taxCode} onChange={set('taxCode')} /></Field>
      <Field label={T.address} htmlFor="org-addr"><Input id="org-addr" value={f.address} onChange={set('address')} /></Field>
      <Field label={T.email} htmlFor="org-email"><Input id="org-email" type="email" value={f.email} onChange={set('email')} /></Field>
      <Field label={T.hotline} htmlFor="org-hotline"><Input id="org-hotline" inputMode="tel" value={f.hotline} onChange={set('hotline')} /></Field>
      <Field label={T.zalo} htmlFor="org-zalo"><Input id="org-zalo" value={f.zalo} onChange={set('zalo')} /></Field>
      <Field label={T.contactName} htmlFor="org-contact"><Input id="org-contact" value={f.contactName} onChange={set('contactName')} /></Field>
      <Field label={T.contactRole} htmlFor="org-contact-role"><Input id="org-contact-role" value={f.contactRole} onChange={set('contactRole')} /></Field>
      <div className="flex justify-end tab:col-span-2">
        <Button type="submit" tone="acc" disabled={busy || !dirty || f.name.trim().length < 2}>{T.saveProfile}</Button>
      </div>
    </form>
  );
}

function Team({ o, lang, onChanged }: { o: OrgDetail; lang: Lang; onChanged: () => void }) {
  const T = pick(ORGS, lang);
  const kd = useKd();
  const ask = useAsk();
  const blank = { email: '', name: '', role: 'manager' as 'manager' | 'owner' };
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const add = async () => {
    setBusy(true);
    const out = await act(kd, lang, () => FF.post(`/admin/organizers/${o.id}/members`, { email: f.email.trim(), name: f.name.trim() || undefined, role: f.role }));
    setBusy(false);
    if (out) { setF(blank); onChanged(); }
  };
  const remove = async (m: Member) => {
    if (!(await ask({ title: T.removeAsk, body: m.email ?? m.name ?? '', confirm: T.remove, danger: true }))) return;
    // The API refuses to remove the last owner (last_owner); its message is the toast.
    const out = await act(kd, lang, () => FF.del(`/admin/organizers/${o.id}/members/${m.id}`));
    if (out) onChanged();
  };
  return (
    <div className="flex flex-col gap-5">
      {o.members.length ? (
        <ul className="flex flex-col border-t border-line" aria-label={T.dTeam}>
          {o.members.map((m) => (
            <li key={m.id} className="flex min-h-14 flex-wrap items-center gap-3 border-b border-line py-2">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="kd-hs kd-ell">{m.name || m.email}</span>
                <span className="kd-s kd-ell">
                  {[m.email, m.phone].filter(Boolean).join(' · ')}
                  {m.lastActiveAt ? ' · ' + fill(T.active, { ago: ago(m.lastActiveAt, lang) }) : ''}
                </span>
              </div>
              {m.hasPassword ? null : <Pill tone="warn">{T.noPassword}</Pill>}
              <Pill tone={m.role === 'owner' ? 'live' : 'none'}>{m.role === 'owner' ? T.owner : T.manager}</Pill>
              <IconButton size="sm" label={fill(T.removeOne, { n: m.email ?? m.name ?? '' })} onClick={() => remove(m)}><XIcon size={16} aria-hidden="true" /></IconButton>
            </li>
          ))}
        </ul>
      ) : <p className="kd-s">{T.nobody}</p>}
      <form
        className="flex flex-col gap-3"
        aria-label={T.addMember}
        onSubmit={(e) => { e.preventDefault(); if (/@/.test(f.email)) void add(); }}
      >
        <h3 className="kd-hs">{T.addMember}</h3>
        <div className="grid gap-3 tab:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px_auto]">
          <Input type="email" required aria-label={T.memberEmail} placeholder="email@brand.vn" value={f.email} onChange={(e) => setF((x) => ({ ...x, email: e.target.value }))} />
          <Input aria-label={T.memberName} placeholder={T.memberName} value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))} />
          <Select aria-label={T.role} value={f.role} onChange={(e) => setF((x) => ({ ...x, role: e.target.value as 'manager' | 'owner' }))}>
            <option value="manager">{T.manager}</option>
            <option value="owner">{T.ownerLong}</option>
          </Select>
          <Button type="submit" disabled={busy || !/@/.test(f.email)}>{T.addGo}</Button>
        </div>
      </form>
    </div>
  );
}

function Listings({ o, lang }: { o: OrgDetail; lang: Lang }) {
  const T = pick(ORGS, lang);
  if (!o.events.length) return <Empty title={T.noListings} />;
  return (
    <ul className="flex flex-col border-t border-line" aria-label={T.dListings}>
      {o.events.map((e) => (
        <li key={e.id}>
          <a href={'/console/events/' + e.id} className="flex min-h-14 items-center gap-3 border-b border-line py-2 hover:bg-white/[0.03]">
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="kd-hs kd-ell">{e.title}</span>
              <span className="kd-s">{[e.startsOn ? whenShort({ startsOn: e.startsOn }, lang) : T.noDate, e.genre].filter(Boolean).join(' · ')}</span>
            </span>
            <Pill tone={e.status === 'live' ? 'live' : e.status === 'in_review' ? 'warn' : e.status === 'rejected' || e.status === 'removed' ? 'bad' : 'none'}>{FF.text(e.statusLabel, lang) || e.status}</Pill>
          </a>
        </li>
      ))}
    </ul>
  );
}
