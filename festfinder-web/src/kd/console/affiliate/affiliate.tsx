'use client';
/**
 * /console/affiliate: affiliate links and the money side of partners, in three tabs kept in
 * the address (?tab=summary|links|payouts). The overview counts where every outbound click
 * came from (placement, device, country, link) over 7, 30 or 90 days (?days=) and what each
 * partner owes that is not settled yet; links are short /go/link/<code> addresses for merch,
 * products and campaigns; payouts settle a partner's approved sales over a period exactly
 * once, with a CSV for the partner or the accountant, then are marked paid.
 */
import { useState } from 'react';
import { CheckIcon, CopyIcon, DownloadSimpleIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { dayMonth, money } from '../../format';
import { useKd } from '../../runtime';
import { Button, buttonClass } from '../../ui/actions';
import { BarRow } from '../../ui/charts';
import { Input, Select, Switch } from '../../ui/forms';
import { Card as Panel } from '../../ui/parts';
import { Row, Table, Tabs } from '../../ui/shell';
import { act, Body, Choice, Drawer, Empty, ErrorBox, Field, FilterBar, Loading, PageHead, Pill, stamp, useLoad, useQuery } from '../kit';
import { useConsole } from '../root';
import { Cell, copyText, Tile, Tiles, Two } from '../orders/parts';
import { AFFILIATE } from './copy';

type Tab = 'summary' | 'links' | 'payouts';
type Kind = 'artist' | 'product' | 'brand' | 'campaign' | 'partner';
interface Link {
  id: string; code: string; label: string; destinationUrl: string; kind: Kind; enabled: boolean; url: string; clicks30: number;
  artist: { name: string } | null; organizer: { name: string } | null; partner: { name: string } | null;
}
interface Summary {
  clicks: number;
  byPlacement: { key: string | null; n: number }[]; byDevice: { key: string | null; n: number }[]; byCountry: { key: string | null; n: number }[];
  byLink: { id: string; code: string; label: string; n: number }[];
  sales: { partner: { id: string; name: string }; currency: string; unsettled: number }[];
}
interface Payout { id: string; partner: { id: string; name: string }; from: string; to: string; currency: string; conversions: number; commission: number; status: 'open' | 'paid'; paidAt: string | null }

const KINDS: Kind[] = ['artist', 'product', 'brand', 'campaign', 'partner'];
const nf = (n: number, lang: Lang) => n.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US');

export function Affiliate() {
  const { lang } = useConsole();
  const T = pick(AFFILIATE, lang);
  const [params, set] = useQuery();
  const raw = params.get('tab');
  const tab: Tab = raw === 'links' || raw === 'payouts' ? raw : 'summary';
  return (
    <>
      <PageHead title={T.title} />
      <Body>
        <Tabs label={T.tabs} current={tab} onSelect={(k) => set({ tab: k === 'summary' ? null : k })}
          items={[{ key: 'summary', label: T.tSummary }, { key: 'links', label: T.tLinks }, { key: 'payouts', label: T.tPayouts }]} />
        {tab === 'links' ? <Links lang={lang} /> : tab === 'payouts' ? <Payouts lang={lang} /> : <SummaryTab lang={lang} params={params} set={set} />}
      </Body>
    </>
  );
}

function SummaryTab({ lang, params, set }: { lang: Lang; params: URLSearchParams; set: (p: Record<string, string | null>) => void }) {
  const T = pick(AFFILIATE, lang);
  const days = ['7', '90'].includes(params.get('days') ?? '') ? params.get('days')! : '30';
  const load = useLoad<Summary>('/admin/affiliate/summary?days=' + days);
  const placement: Record<string, string> = {
    detail: T.pDetail, tier: T.pTier, hero: T.pHero, card: T.pCard, map: T.pMap, list: T.pList, app: T.pApp, link: T.pLink,
    artist: T.pArtist, organizer: T.pOrganizer, email: T.pEmail, external: T.pExternal,
  };
  const device: Record<string, string> = { mobile: T.dMobile, tablet: T.dTablet, desktop: T.dDesktop };
  return (
    <>
      <FilterBar>
        <Choice label={T.days} any={false} value={days} onChange={(v) => set({ days: v === '30' ? null : v })}
          options={['7', '30', '90'].map((d) => ({ value: d, label: fill(T.nDays, { n: d }) }))} />
      </FilterBar>
      {load.error && !load.data ? <ErrorBox error={load.error} retry={load.reload} /> : !load.data ? <Loading /> : (
        <>
          <Tiles>
            <Tile label={T.clicks} value={nf(load.data.clicks, lang)} />
            {load.data.sales.map((s) => <Tile key={s.partner.id + s.currency} label={fill(T.unsettled, { p: s.partner.name })} value={money(s.unsettled, s.currency, lang)} />)}
          </Tiles>
          <div className="grid gap-3 lg:grid-cols-2">
            <Breakdown lang={lang} title={T.byPlacement} rows={load.data.byPlacement.map((r) => ({ key: String(r.key), label: r.key ? placement[r.key] ?? r.key : T.unknown, n: r.n }))} />
            <Breakdown lang={lang} title={T.byDevice} rows={load.data.byDevice.map((r) => ({ key: String(r.key), label: r.key ? device[r.key] ?? r.key : T.unknown, n: r.n }))} />
            <Breakdown lang={lang} title={T.byCountry} rows={load.data.byCountry.map((r) => ({ key: String(r.key), label: r.key ?? T.unknown, n: r.n }))} />
            <Breakdown lang={lang} title={T.byLink} rows={load.data.byLink.map((r) => ({ key: r.id, label: `${r.label} · ${r.code}`, n: r.n }))} />
          </div>
        </>
      )}
    </>
  );
}

function Breakdown({ lang, title, rows }: { lang: Lang; title: string; rows: { key: string; label: string; n: number }[] }) {
  const T = pick(AFFILIATE, lang);
  const total = rows.reduce((a, r) => a + r.n, 0) || 1;
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <Panel as="section" aria-label={title} className="flex flex-col gap-3 p-5">
      <h2 className="kd-hs">{title}</h2>
      {rows.length
        ? rows.map((r) => <BarRow key={r.key} label={r.label} value={r.n} max={max} display={`${nf(r.n, lang)} · ${Math.round((r.n / total) * 100)}%`} />)
        : <p className="kd-s">{T.noClicks}</p>}
    </Panel>
  );
}

function Links({ lang }: { lang: Lang }) {
  const T = pick(AFFILIATE, lang);
  const kd = useKd();
  const load = useLoad<{ items: Link[] }>('/admin/affiliate/links');
  const [form, setForm] = useState<{ link?: Link } | null>(null);
  const kind: Record<Kind, string> = { artist: T.kArtist, product: T.kProduct, brand: T.kBrand, campaign: T.kCampaign, partner: T.kPartner };
  const COLS = 'minmax(220px,1.6fr) 180px 110px 150px 110px 90px';
  return (
    <>
      <div className="flex"><Button tone="acc" onClick={() => setForm({})}><PlusIcon size={16} aria-hidden="true" />{T.addLink}</Button></div>
      {load.error && !load.data ? <ErrorBox error={load.error} retry={load.reload} /> : !load.data ? <Loading /> : !load.data.items.length ? <Empty title={T.noLinks} /> : (
        <Table label={T.linksTable} cols={COLS} head={[T.cLink, T.cCode, T.cKind, T.cFor, T.cClicks, '']}>
          {load.data.items.map((l) => (
            <Row key={l.id} cols={COLS}>
              <Cell>
                <button type="button" className="flex w-full min-w-0 flex-col text-left hover:underline" aria-label={fill(T.editLink, { l: l.label })} onClick={() => setForm({ link: l })}>
                  <Two title={l.label} sub={l.destinationUrl.replace(/^https:\/\//, '').slice(0, 60)} />
                </button>
              </Cell>
              <Cell>
                <Button size="sm" aria-label={fill(T.copyCode, { c: l.code })} onClick={() => copyText(kd, lang, l.url)}><CopyIcon size={14} aria-hidden="true" /><span className="kd-num">{l.code}</span></Button>
              </Cell>
              <Cell className="kd-s">{kind[l.kind] ?? l.kind}</Cell>
              <Cell className="kd-s kd-ell">{l.artist?.name ?? l.organizer?.name ?? l.partner?.name ?? '—'}</Cell>
              <Cell end className="kd-num text-sm">{nf(l.clicks30, lang)}</Cell>
              <Cell>{l.enabled ? <Pill tone="ok">{T.on}</Pill> : <Pill>{T.off}</Pill>}</Cell>
            </Row>
          ))}
        </Table>
      )}
      {form ? <LinkForm key={form.link?.id ?? 'new'} lang={lang} link={form.link} kinds={kind} onClose={() => setForm(null)} onSaved={() => { setForm(null); load.reload(); }} /> : null}
    </>
  );
}

function LinkForm({ lang, link, kinds, onClose, onSaved }: { lang: Lang; link?: Link; kinds: Record<Kind, string>; onClose: () => void; onSaved: () => void }) {
  const T = pick(AFFILIATE, lang);
  const kd = useKd();
  const [f, setF] = useState(() => ({ label: link?.label ?? '', destinationUrl: link?.destinationUrl ?? 'https://', code: link?.code ?? '', kind: link?.kind ?? 'campaign', enabled: link?.enabled ?? true }));
  const [busy, setBusy] = useState(false);
  const upd = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  const destOk = /^https:\/\/\S+\.\S+/.test(f.destinationUrl.trim());
  const codeOk = !f.code || /^[a-z0-9-]{3,40}$/.test(f.code);
  const ok = f.label.trim().length >= 2 && destOk && codeOk;
  const save = async () => {
    setBusy(true);
    const body = { label: f.label.trim(), destinationUrl: f.destinationUrl.trim(), kind: f.kind, enabled: f.enabled, ...(f.code ? { code: f.code } : {}) };
    const out = await act(kd, lang, () => (link ? FF.patch('/admin/affiliate/links/' + link.id, body) : FF.post('/admin/affiliate/links', body)));
    setBusy(false);
    if (out) { kd.toast(T.saved); onSaved(); }
  };
  return (
    <Drawer
      title={link ? link.label : T.addLink}
      onClose={onClose}
      footer={<><Button onClick={onClose}>{T.cancel}</Button><span className="flex-1" /><Button tone="acc" disabled={!ok || busy} onClick={save}><CheckIcon size={16} aria-hidden="true" />{T.save}</Button></>}
    >
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (ok && !busy) void save(); }}>
        <Field label={T.fName} htmlFor="al-name"><Input id="al-name" value={f.label} autoFocus={!link} onChange={(e) => upd({ label: e.target.value })} /></Field>
        <Field label={T.fDest} htmlFor="al-dest" error={f.destinationUrl.length > 8 && !destOk ? T.fDestBad : null}>
          <Input id="al-dest" type="url" value={f.destinationUrl} invalid={f.destinationUrl.length > 8 && !destOk} onChange={(e) => upd({ destinationUrl: e.target.value })} />
        </Field>
        <Field label={<>{T.fCode} <span className="kd-s">({T.optional})</span></>} htmlFor="al-code" hint="a-z 0-9 -" error={codeOk ? null : T.fCodeBad}>
          <Input id="al-code" className="kd-num" value={f.code} invalid={!codeOk} placeholder="tet-2027" onChange={(e) => upd({ code: e.target.value.toLowerCase() })} />
        </Field>
        <Field label={T.fKind} htmlFor="al-kind">
          <Select id="al-kind" value={f.kind} onChange={(e) => upd({ kind: e.target.value as Kind })}>
            {KINDS.map((k) => <option key={k} value={k}>{kinds[k]}</option>)}
          </Select>
        </Field>
        <label className="flex min-h-12 items-center gap-3 kd-s text-fg-2">
          <Switch checked={f.enabled} label={T.fOn} onChange={(v) => upd({ enabled: v })} />{T.fOn}
        </label>
      </form>
    </Drawer>
  );
}

function Payouts({ lang }: { lang: Lang }) {
  const T = pick(AFFILIATE, lang);
  const kd = useKd();
  const load = useLoad<{ items: Payout[] }>('/admin/affiliate/payouts');
  const partners = useLoad<{ items: { id: string; name: string }[] }>('/admin/partners');
  const [f, setF] = useState({ partnerId: '', from: '', to: '' });
  const [busy, setBusy] = useState<string | null>(null);
  const make = async () => {
    setBusy('new');
    if (await act(kd, lang, () => FF.post('/admin/affiliate/payouts', f))) { kd.toast(T.settled); setF({ partnerId: '', from: '', to: '' }); load.reload(); }
    setBusy(null);
  };
  const paid = async (p: Payout) => {
    setBusy(p.id);
    if (await act(kd, lang, () => FF.post(`/admin/affiliate/payouts/${p.id}/paid`))) load.reload();
    setBusy(null);
  };
  const day = (iso: string) => `${dayMonth(iso, lang)}${lang === 'vi' ? '.' : ' '}${iso.slice(0, 4)}`;
  const period = (p: Payout) => `${day(p.from)} → ${day(p.to)}`;
  const COLS = 'minmax(160px,1fr) 220px 80px 150px 90px 200px';
  return (
    <>
      <Panel as="section" aria-label={T.settleTitle} className="flex flex-col gap-4 p-5">
        <h2 className="kd-hs">{T.settleTitle}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={T.partner} htmlFor="ap-partner">
            <Select id="ap-partner" value={f.partnerId} onChange={(e) => setF((x) => ({ ...x, partnerId: e.target.value }))}>
              <option value="">{T.pickPartner}</option>
              {(partners.data?.items ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label={T.from} htmlFor="ap-from">
            <Input id="ap-from" type="date" className="kd-num" value={f.from} max={f.to || undefined} onChange={(e) => setF((x) => ({ ...x, from: e.target.value }))} />
          </Field>
          <Field label={T.to} htmlFor="ap-to">
            <Input id="ap-to" type="date" className="kd-num" value={f.to} min={f.from || undefined} onChange={(e) => setF((x) => ({ ...x, to: e.target.value }))} />
          </Field>
        </div>
        <div className="flex"><Button tone="acc" disabled={!f.partnerId || !f.from || !f.to || busy === 'new'} onClick={make}><CheckIcon size={16} aria-hidden="true" />{T.settle}</Button></div>
      </Panel>
      {load.error && !load.data ? <ErrorBox error={load.error} retry={load.reload} /> : !load.data ? <Loading /> : !load.data.items.length ? <Empty title={T.noPayouts} /> : (
        <Table label={T.payoutsTable} cols={COLS} head={[T.cPartner, T.cPeriod, T.cOrders, T.cCommission, '', '']}>
          {load.data.items.map((p) => (
            <Row key={p.id} cols={COLS}>
              <Cell className="kd-ell text-sm text-fg-1">{p.partner.name}</Cell>
              <Cell className="kd-s kd-num">{period(p)}</Cell>
              <Cell end className="kd-num text-sm">{nf(p.conversions, lang)}</Cell>
              <Cell end className="kd-num text-sm text-fg-1">{money(p.commission, p.currency, lang)}</Cell>
              <Cell end>
                <a className={buttonClass({ size: 'sm' })} href={`/admin/affiliate/payouts/${p.id}/export.csv`} download aria-label={fill(T.csvLabel, { p: p.partner.name, d: period(p) })}>
                  <DownloadSimpleIcon size={14} aria-hidden="true" />CSV
                </a>
              </Cell>
              <Cell end>
                {p.status === 'paid'
                  ? <Pill tone="ok">{T.paid}{p.paidAt ? ' · ' + stamp(p.paidAt, lang, false) : ''}</Pill>
                  : <Button size="sm" disabled={busy === p.id} aria-label={fill(T.markPaidLabel, { p: p.partner.name, d: period(p) })} onClick={() => paid(p)}><CheckIcon size={14} aria-hidden="true" />{T.markPaid}</Button>}
              </Cell>
            </Row>
          ))}
        </Table>
      )}
    </>
  );
}
