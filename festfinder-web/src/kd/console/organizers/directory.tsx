'use client';
/**
 * /console/organizers: the directory. Tiles for each verification state (and suspended) filter
 * the list, as do the search, the type and the standing, all kept in the address. A row opens
 * the organiser's drawer at ?id=<id> with the list behind it; "Add organiser" onboards a new
 * one with its owner's account and opens it.
 */
import { useMemo, useState } from 'react';
import { CheckCircleIcon, CircleIcon, UserPlusIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../../copy';
import { cx } from '../../cx';
import { useKd } from '../../runtime';
import { Button } from '../../ui/actions';
import { Input, Select } from '../../ui/forms';
import { Avatar } from '../../ui/parts';
import { Row, Table } from '../../ui/shell';
import { act, Body, Choice, Drawer, Empty, Field, FilterBar, Loaded, MultiChoice, Pill, SearchField, useLoad, useOptions, useQuery } from '../kit';
import { useConsole } from '../root';
import { ORGS } from './copy';
import { OrganizerDrawer } from './drawer';
import { fold, OrgHead, StatePill, StatFilter, type OrgState } from './parts';

interface OrgRow {
  id: string; slug: string; name: string; state: OrgState; type: string; logoUrl: string | null; legalName: string | null; taxCode: string | null; email: string | null;
  docs: { id: boolean; tax: boolean; bank: boolean }; bankVerified: boolean; bankOnFile: boolean; strikes: number; suspended: boolean;
  allEvents: number; liveEvents: number; reviewEvents: number; members: number; createdAt: string;
}
type Standing = 'review' | 'strikes' | 'suspended' | 'nobank';

const COLS = 'minmax(220px,2.2fr) 150px 150px 150px 80px 80px 90px';

export function Organizers() {
  const { lang, refreshCounts } = useConsole();
  const T = pick(ORGS, lang);
  const opts = useOptions();
  const [params, setQuery] = useQuery();
  const load = useLoad<{ items: OrgRow[] }>('/admin/organizers');
  const [onboard, setOnboard] = useState(false);
  const state = params.get('state') ?? '';
  const type = params.get('type') ?? '';
  const q = params.get('q') ?? '';
  const st = (params.get('standing') ?? '').split(',').filter(Boolean) as Standing[];
  const current = params.get('id');
  const items = load.data?.items ?? [];
  const types: { value: string; label: Pair }[] = opts?.organizerTypes ?? [];
  const typeLabel = (v: string) => types.find((t) => t.value === v)?.label[lang] ?? v;

  const rows = useMemo(() => {
    const needle = fold(q.trim());
    return items
      .filter((o) => !state || o.state === state)
      .filter((o) => !type || o.type === type)
      .filter((o) => st.every((k) => (k === 'suspended' ? o.suspended : k === 'strikes' ? o.strikes > 0 : k === 'nobank' ? !o.bankOnFile : k === 'review' ? o.reviewEvents > 0 : true)))
      .filter((o) => !needle || fold(`${o.name} ${o.legalName ?? ''} ${o.email ?? ''} ${o.taxCode ?? ''}`).includes(needle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, state, type, params.get('standing'), q]);
  const n = (s: OrgState) => items.filter((o) => o.state === s).length;
  const toggleState = (s: OrgState) => setQuery({ state: state === s ? null : s });
  const joined = (iso: string) => new Date(iso).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { month: '2-digit', year: 'numeric' });

  return (
    <>
      <OrgHead lang={lang} current="directory" actions={<Button tone="acc" onClick={() => setOnboard(true)}><UserPlusIcon size={18} aria-hidden="true" />{T.add}</Button>} />
      <Body>
        <div className="grid grid-cols-2 gap-3 tab:grid-cols-4" role="group" aria-label={T.stateTiles}>
          <StatFilter label={T.pending} value={n('pending')} tone="warn" on={state === 'pending'} onClick={() => toggleState('pending')} />
          <StatFilter label={T.verified} value={n('verified')} tone="ok" on={state === 'verified'} onClick={() => toggleState('verified')} />
          <StatFilter label={T.flagged} value={n('flagged')} tone="bad" on={state === 'flagged'} onClick={() => toggleState('flagged')} />
          <StatFilter label={T.suspended} value={items.filter((o) => o.suspended).length} on={st.includes('suspended')} onClick={() => setQuery({ standing: st.includes('suspended') ? null : 'suspended' })} />
        </div>
        <FilterBar onReset={state || type || st.length || q ? () => setQuery({ state: null, type: null, standing: null, q: null }) : null}>
          <SearchField label={T.searchLabel} placeholder={T.search} value={q} onChange={(v) => setQuery({ q: v })} />
          <Choice
            label={T.type}
            value={type}
            onChange={(v) => setQuery({ type: v })}
            options={types.map((t) => ({ value: t.value, label: t.label[lang], aside: String(items.filter((o) => o.type === t.value).length) }))}
          />
          <MultiChoice
            label={T.standing}
            values={st}
            onChange={(v) => setQuery({ standing: v.join(',') })}
            options={[
              { value: 'review', label: T.stReview }, { value: 'strikes', label: T.stStrikes },
              { value: 'suspended', label: T.stSuspended }, { value: 'nobank', label: T.stNoBank },
            ]}
          />
          {load.data ? <span className="kd-m kd-num ml-auto">{fill(T.shown, { n: rows.length, t: items.length })}</span> : null}
        </FilterBar>
        <Loaded load={load}>
          {() => !rows.length ? <Empty /> : (
            <div className="[&_.kd-tr]:min-w-[1000px]">
              <Table label={T.title} cols={COLS} head={[T.colOrg, T.colListings, T.colState, T.colDocs, T.colStrikes, T.colTeam, T.colJoined]}>
                {rows.map((o) => (
                  <Row key={o.id} cols={COLS} current={o.id === current} onClick={() => setQuery({ id: o.id })}>
                    <span role="cell" className="flex min-w-0 items-center gap-3 py-2">
                      <Avatar org name={o.name} src={o.logoUrl} size={36} />
                      <span className="flex min-w-0 flex-col">
                        <span className="kd-hs kd-ell">{o.name}</span>
                        <span className="kd-s kd-ell">{[typeLabel(o.type), o.legalName || o.email].filter(Boolean).join(' · ')}</span>
                      </span>
                    </span>
                    <span role="cell" className="kd-num text-sm">
                      {o.allEvents} · <span className="text-ok">{o.liveEvents}</span> · <span className={o.reviewEvents ? 'text-warn' : undefined}>{o.reviewEvents}</span>
                    </span>
                    <span role="cell" className="flex flex-wrap gap-1.5">
                      <StatePill state={o.state} lang={lang} />
                      {o.suspended ? <Pill tone="bad">{T.suspendedShort}</Pill> : null}
                    </span>
                    <span role="cell" className="flex flex-wrap gap-2">
                      <Doc ok={o.docs.id} label={T.docIdShort} lang={lang} />
                      <Doc ok={o.docs.tax} label={T.docTaxShort} lang={lang} />
                      <Doc ok={o.docs.bank && o.bankVerified} label={T.docBankShort} lang={lang} />
                    </span>
                    <span role="cell" className="flex gap-1" title={fill(T.strikesOf, { n: o.strikes })} aria-label={fill(T.strikesOf, { n: o.strikes })}>
                      {[0, 1, 2].map((i) => <span key={i} aria-hidden="true" className={cx('size-2.5 rounded-full', i < o.strikes ? 'bg-hot' : 'bg-line2')} />)}
                    </span>
                    <span role="cell" className="kd-num text-sm">{o.members ? o.members : <Pill tone="warn">{T.noTeam}</Pill>}</span>
                    <span role="cell" className="kd-s kd-num whitespace-nowrap">{joined(o.createdAt)}</span>
                  </Row>
                ))}
              </Table>
            </div>
          )}
        </Loaded>
      </Body>
      {current ? <OrganizerDrawer key={current} id={current} onClose={() => { setQuery({ id: null }); load.reload(); }} onChanged={load.reload} /> : null}
      {onboard ? (
        <Onboard
          lang={lang}
          onClose={() => setOnboard(false)}
          onDone={(id) => { setOnboard(false); load.reload(); refreshCounts(); setQuery({ id }); }}
        />
      ) : null}
    </>
  );
}

function Doc({ ok, label, lang }: { ok: boolean; label: string; lang: Lang }) {
  const T = pick(ORGS, lang);
  const name = fill(ok ? T.docOn : T.docOff, { d: label });
  return (
    <span className={cx('inline-flex items-center gap-1 text-xs', ok ? 'text-ok' : 'text-fog')} title={name} aria-label={name}>
      {ok ? <CheckCircleIcon size={14} weight="fill" aria-hidden="true" /> : <CircleIcon size={14} aria-hidden="true" />}
      <span aria-hidden="true">{label}</span>
    </span>
  );
}

function Onboard({ lang, onClose, onDone }: { lang: Lang; onClose: () => void; onDone: (id: string) => void }) {
  const T = pick(ORGS, lang);
  const kd = useKd();
  const opts = useOptions();
  const types: { value: string; label: Pair }[] = opts?.organizerTypes ?? [];
  const [f, setF] = useState({ name: '', type: 'promoter', ownerEmail: '', ownerName: '', hotline: '', website: '', legalName: '', taxCode: '' });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const ok = f.name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.ownerEmail.trim());
  const save = async () => {
    setBusy(true);
    const body: Record<string, string> = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v !== ''));
    if (body.website && !/^https?:\/\//i.test(body.website)) body.website = 'https://' + body.website;
    const out = await act(kd, lang, () => FF.post('/admin/organizers', body));
    setBusy(false);
    if (out && out.id) onDone(out.id);
  };
  const opt = (label: string) => <>{label} <span className="kd-s">· {T.optional}</span></>;
  return (
    <Drawer
      title={T.onboardTitle}
      onClose={onClose}
      footer={(
        <>
          <Button onClick={onClose}>{T.cancel}</Button>
          <Button tone="acc" className="ml-auto" type="submit" form="org-onboard" disabled={busy || !ok}>{T.create}</Button>
        </>
      )}
    >
      <form id="org-onboard" className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (ok) void save(); }}>
        <Field label={T.brandName} htmlFor="ob-name"><Input id="ob-name" required minLength={2} maxLength={80} autoFocus value={f.name} onChange={set('name')} placeholder={T.namePh} /></Field>
        <Field label={T.orgType} htmlFor="ob-type">
          <Select id="ob-type" value={f.type} onChange={set('type')}>
            {types.length ? types.map((t) => <option key={t.value} value={t.value}>{t.label[lang]}</option>) : <option value={f.type}>{f.type}</option>}
          </Select>
        </Field>
        <Field label={T.ownerEmail} htmlFor="ob-email"><Input id="ob-email" type="email" required value={f.ownerEmail} onChange={set('ownerEmail')} placeholder="booking@brand.vn" /></Field>
        <Field label={opt(T.ownerName)} htmlFor="ob-owner"><Input id="ob-owner" value={f.ownerName} onChange={set('ownerName')} /></Field>
        <Field label={opt(T.hotline)} htmlFor="ob-hotline"><Input id="ob-hotline" inputMode="tel" value={f.hotline} onChange={set('hotline')} /></Field>
        <Field label={opt(T.website)} htmlFor="ob-web"><Input id="ob-web" inputMode="url" value={f.website} onChange={set('website')} placeholder="https://" /></Field>
        <Field label={opt(T.legalName)} htmlFor="ob-legal"><Input id="ob-legal" value={f.legalName} onChange={set('legalName')} /></Field>
        <Field label={opt(T.taxCode)} hint={T.taxHint} htmlFor="ob-tax"><Input id="ob-tax" inputMode="numeric" value={f.taxCode} onChange={set('taxCode')} /></Field>
      </form>
    </Drawer>
  );
}
