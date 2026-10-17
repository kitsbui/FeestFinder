'use client';
/**
 * /console/partners: ticket partners. Which sites each one sells on, how a link to them is
 * tracked (parameters, or a network's tracking link around {url}), what a sale earns, and the
 * sales each one has reported, settled here one by one. Every ticket button goes out through
 * /go/<event>, so the 30-day numbers are every click, partner or not, and the busiest sites no
 * partner covers are offered as the next partner to add. A partner's postback token is shown
 * once, when it is made.
 */
import { useState } from 'react';
import { CheckIcon, CopyIcon, KeyIcon, PencilSimpleIcon, PlusIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { money } from '../../format';
import { KdLink } from '../../link';
import { useKd } from '../../runtime';
import { Button, IconButton } from '../../ui/actions';
import { Input, Select, Switch, TextArea } from '../../ui/forms';
import { Card as Panel } from '../../ui/parts';
import { Sheet } from '../../ui/sheet';
import { Row, Table, Tabs } from '../../ui/shell';
import { act, Body, Drawer, Empty, ErrorBox, Field, KV, Loading, PageHead, Pill, stamp, useAsk, useLoad } from '../kit';
import { useConsole } from '../root';
import { Cell, copyText, Tile, Tiles, Two } from '../orders/parts';
import { PARTNERS } from './copy';

interface Total { currency: string; orders: number; sales: number; earned: number; pending: number }
export interface Partner {
  id: string; slug: string; name: string; hosts: string[]; linkTemplate: string | null; linkParams: Record<string, string>;
  commissionPct: number; enabled: boolean; notes: string; postbackUrl: string; example: string; clicks30: number; totals: Total[];
  token?: string;
}
type ConvStatus = 'pending' | 'approved' | 'rejected' | 'paid';
interface Conversion {
  id: string; orderRef: string; amount: number; currency: string; commission: number; status: ConvStatus; occurredAt: string;
  event: { id: string; slug: string; title: string } | null;
}

const STATUSES: ConvStatus[] = ['pending', 'approved', 'rejected', 'paid'];
const paramsText = (p: Record<string, string> | undefined) => Object.entries(p ?? {}).map(([k, v]) => `${k}=${v}`).join('\n');
const paramsOf = (text: string) => Object.fromEntries(text.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
  const i = l.indexOf('=');
  return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : [l, ''];
}));
const COLS = 'minmax(220px,1.6fr) 110px 110px 80px minmax(170px,1fr) 100px';

export function Partners() {
  const { lang } = useConsole();
  const T = pick(PARTNERS, lang);
  const load = useLoad<{ items: Partner[]; outbound: Record<string, number>; topUncovered: { host: string; n: number }[] }>('/admin/partners');
  const [form, setForm] = useState<{ partner?: Partner; hosts?: string[] } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [made, setMade] = useState<Partner | null>(null);
  const items = load.data?.items ?? [];
  const open = items.find((p) => p.id === openId) ?? null;
  const out = load.data?.outbound ?? {};
  const n = (v: number) => v.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US');
  const addButton = <Button tone="acc" onClick={() => setForm({})}><PlusIcon size={16} aria-hidden="true" />{T.add}</Button>;

  return (
    <>
      <PageHead title={T.title} actions={addButton} />
      <Body>
        {load.error ? <ErrorBox error={load.error} retry={load.reload} /> : null}
        {!load.data ? (load.error ? null : <Loading />) : (
          <>
            <Tiles>
              <Tile label={T.toPartners} value={n(out.partner ?? 0)} />
              <Tile label={T.toOrganizers} value={n(out.organizer ?? 0)} />
              <Tile label={T.toCheckout} value={n(out.checkout ?? 0)} />
            </Tiles>
            {load.data.topUncovered.length ? (
              <Panel as="section" aria-label={T.uncovered} className="flex flex-col p-5">
                <h2 className="kd-hs pb-2">{T.uncovered}</h2>
                <ul className="flex flex-col">
                  {load.data.topUncovered.map((x) => (
                    <li key={x.host} className="flex min-h-11 items-center gap-3 border-b border-line-1 last:border-b-0">
                      <span className="kd-ell flex-1 text-sm text-fg-1">{x.host}</span>
                      <span className="kd-s kd-num">{fill(T.nClicks, { n: n(x.n) })}</span>
                      <Button size="sm" aria-label={fill(T.addHostLabel, { h: x.host })} onClick={() => setForm({ hosts: [x.host] })}><PlusIcon size={14} aria-hidden="true" />{T.addHost}</Button>
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}
            {!items.length ? <Empty title={T.none} /> : (
              <Table label={T.table} cols={COLS} head={[T.colPartner, T.colPct, T.colClicks, T.colOrders, T.colEarned, '']}>
                {items.map((p) => (
                  <Row key={p.id} cols={COLS} current={p.id === openId} onClick={() => setOpenId(p.id)}>
                    <Cell><Two title={p.name} sub={p.hosts.join(', ') || '—'} /></Cell>
                    <Cell end className="kd-num text-sm">{p.commissionPct}%</Cell>
                    <Cell end className="kd-num text-sm">{n(p.clicks30)}</Cell>
                    <Cell end className="kd-num text-sm">{n(p.totals.reduce((a, x) => a + x.orders, 0))}</Cell>
                    <Cell end className="kd-num text-sm text-fg-1">
                      {p.totals.length ? p.totals.map((x) => (
                        <span key={x.currency} className="block">
                          {money(x.earned, x.currency, lang)}
                          {x.pending ? <span className="kd-s text-xs"> · {fill(T.pendingN, { m: money(x.pending, x.currency, lang) })}</span> : null}
                        </span>
                      )) : '—'}
                    </Cell>
                    <Cell>{p.enabled ? <Pill tone="ok">{T.on}</Pill> : <Pill>{T.off}</Pill>}</Cell>
                  </Row>
                ))}
              </Table>
            )}
          </>
        )}
      </Body>
      {open ? <PartnerDetail key={open.id} lang={lang} partner={open} onClose={() => setOpenId(null)} onEdit={() => setForm({ partner: open })} onChanged={load.reload} /> : null}
      {form ? (
        <PartnerForm
          key={form.partner?.id ?? 'new'}
          lang={lang}
          partner={form.partner}
          presetHosts={form.hosts}
          onClose={() => setForm(null)}
          onSaved={(p) => { setForm(null); load.reload(); if (p.token) setMade(p); }}
        />
      ) : null}
      {made?.token ? <TokenSheet lang={lang} token={made.token} partner={made} onClose={() => setMade(null)} /> : null}
    </>
  );
}

/** The token, once, with the postback address to give the partner. */
function TokenSheet({ lang, token, partner, onClose }: { lang: Lang; token: string; partner: Pick<Partner, 'postbackUrl'>; onClose: () => void }) {
  const T = pick(PARTNERS, lang);
  const kd = useKd();
  const url = partner.postbackUrl.replace('TOKEN', token);
  return (
    <Sheet wide title={T.tokenTitle} closeLabel={T.close} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p role="status" className="kd-hs rounded-lg bg-warn/15 px-3 py-2 text-warn">{T.tokenOnce}</p>
        <Field label={T.token}>
          <Input readOnly value={token} aria-label={T.token} className="kd-num text-sm"
            end={<IconButton size="sm" label={T.copyToken} onClick={() => copyText(kd, lang, token)}><CopyIcon size={16} aria-hidden="true" /></IconButton>} />
        </Field>
        <Field label={T.address} hint={T.addressHint}>
          <TextArea readOnly rows={3} value={url} aria-label={T.address} className="kd-num text-xs" />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => copyText(kd, lang, url)}><CopyIcon size={16} aria-hidden="true" />{T.copyAddress}</Button>
          <Button tone="acc" className="ml-auto" onClick={onClose}><CheckIcon size={16} aria-hidden="true" />{T.savedIt}</Button>
        </div>
      </div>
    </Sheet>
  );
}

function PartnerForm({ lang, partner, presetHosts, onClose, onSaved }: {
  lang: Lang; partner?: Partner; presetHosts?: string[]; onClose: () => void; onSaved: (p: Partner) => void;
}) {
  const T = pick(PARTNERS, lang);
  const kd = useKd();
  const editing = !!partner;
  const [f, setF] = useState(() => ({
    name: partner?.name ?? '', hosts: partner?.hosts ?? presetHosts ?? [], pct: String(partner?.commissionPct ?? 0),
    params: paramsText(partner?.linkParams ?? { utm_source: 'feestfinder', utm_medium: 'affiliate', sub1: '{click}' }),
    template: partner?.linkTemplate ?? '', notes: partner?.notes ?? '', enabled: partner?.enabled ?? true,
  }));
  const [host, setHost] = useState('');
  const [busy, setBusy] = useState(false);
  const upd = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const addHost = () => {
    const h = host.trim().toLowerCase();
    if (h && !f.hosts.includes(h)) upd({ hosts: [...f.hosts, h] });
    setHost('');
  };
  const templateOk = !f.template.trim() || (/^https:\/\/\S+$/.test(f.template.trim()) && f.template.includes('{url}'));
  const pct = Number(f.pct.replace(',', '.'));
  const pctOk = f.pct.trim() !== '' && pct >= 0 && pct <= 100;
  const ok = f.name.trim().length >= 2 && templateOk && pctOk;
  const save = async () => {
    setBusy(true);
    const typed = host.trim().toLowerCase();
    const hosts = typed && !f.hosts.includes(typed) ? [...f.hosts, typed] : f.hosts;
    const body = { name: f.name.trim(), hosts, commissionPct: pct, linkParams: paramsOf(f.params), linkTemplate: f.template.trim() || null, notes: f.notes, enabled: f.enabled };
    const out = await act(kd, lang, () => (editing ? FF.patch('/admin/partners/' + partner.id, body) : FF.post('/admin/partners', body)));
    setBusy(false);
    if (out) { kd.toast(editing ? T.saved : T.added); onSaved(out); }
  };
  return (
    <Drawer
      title={editing ? partner.name : T.newTitle}
      onClose={onClose}
      footer={<><Button onClick={onClose}>{T.cancel}</Button><span className="flex-1" /><Button tone="acc" disabled={!ok || busy} onClick={save}><CheckIcon size={16} aria-hidden="true" />{editing ? T.save : T.add}</Button></>}
    >
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (ok && !busy) void save(); }}>
        <Field label={T.name} htmlFor="pf-name">
          <Input id="pf-name" value={f.name} onChange={(e) => upd({ name: e.target.value })} placeholder="Ticketbox" autoFocus={!editing} />
        </Field>
        <Field label={T.hosts} htmlFor="pf-host">
          <div className="flex gap-2">
            <Input id="pf-host" boxClass="flex-1" value={host} placeholder="ticketbox.vn" onChange={(e) => setHost(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addHost(); } }} />
            <Button disabled={!host.trim()} onClick={addHost}>{T.hostAdd}</Button>
          </div>
          {f.hosts.length ? (
            <ul className="flex flex-wrap gap-1.5 pt-1">
              {f.hosts.map((h) => (
                <li key={h}>
                  <button type="button" className="kd-chip kd-chip-on" aria-label={fill(T.hostRemove, { h })} onClick={() => upd({ hosts: f.hosts.filter((x) => x !== h) })}>
                    {h}<XIcon size={12} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </Field>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-40">
            <Field label={T.pct} htmlFor="pf-pct">
              <Input id="pf-pct" inputMode="decimal" className="kd-num" value={f.pct} invalid={!pctOk} onChange={(e) => upd({ pct: e.target.value })} />
            </Field>
          </div>
          <label className="flex min-h-12 items-center gap-3 kd-s text-fg-2">
            <Switch checked={f.enabled} label={T.enabled} onChange={(v) => upd({ enabled: v })} />{T.enabled}
          </label>
        </div>
        <Field label={T.params} htmlFor="pf-params" hint={T.paramsHint}>
          <TextArea id="pf-params" rows={4} className="kd-num text-xs" value={f.params} onChange={(e) => upd({ params: e.target.value })} />
        </Field>
        <Field label={<>{T.template} <span className="kd-s">({T.optional})</span></>} htmlFor="pf-tpl" hint="https://…?url={url}&sub={click}" error={templateOk ? null : T.templateBad}>
          <Input id="pf-tpl" value={f.template} invalid={!templateOk} placeholder="https://" onChange={(e) => upd({ template: e.target.value })} />
        </Field>
        <Field label={<>{T.notes} <span className="kd-s">({T.optional})</span></>} htmlFor="pf-notes">
          <TextArea id="pf-notes" rows={3} value={f.notes} onChange={(e) => upd({ notes: e.target.value })} />
        </Field>
      </form>
    </Drawer>
  );
}

function PartnerDetail({ lang, partner, onClose, onEdit, onChanged }: { lang: Lang; partner: Partner; onClose: () => void; onEdit: () => void; onChanged: () => void }) {
  const T = pick(PARTNERS, lang);
  const kd = useKd();
  const ask = useAsk();
  const [tab, setTab] = useState<'sales' | 'events'>('sales');
  const [status, setStatus] = useState<ConvStatus | ''>('');
  const conv = useLoad<{ items: Conversion[]; topEvents: { id: string; slug: string; title: string; clicks: number }[] }>(
    `/admin/partners/${partner.id}/conversions${status ? '?status=' + status : ''}`);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const label: Record<ConvStatus, string> = { pending: T.sPending, approved: T.sApproved, rejected: T.sRejected, paid: T.sPaid };
  const rotate = async () => {
    if (!(await ask({ title: T.newTokenAsk, body: T.newTokenBody, confirm: T.newToken }))) return;
    setBusy(true);
    const out = await act(kd, lang, () => FF.post(`/admin/partners/${partner.id}/token`));
    setBusy(false);
    if (out?.token) { setToken(out.token); onChanged(); }
  };
  const settle = async (c: Conversion, next: ConvStatus) => {
    if (await act(kd, lang, () => FF.patch('/admin/conversions/' + c.id, { status: next }))) { conv.reload(); onChanged(); }
  };
  const top = conv.data?.topEvents ?? [];
  const SALE_COLS = '150px minmax(200px,1.5fr) 150px 170px';
  const TOP_COLS = 'minmax(240px,1fr) 100px';
  return (
    <Drawer
      wide
      title={partner.name}
      sub={partner.hosts.join(' · ') || T.noSites}
      onClose={onClose}
      footer={<>
        <Button size="sm" disabled={busy} onClick={rotate}><KeyIcon size={16} aria-hidden="true" />{T.newToken}</Button>
        <span className="flex-1" />
        <Button size="sm" tone="acc" onClick={onEdit}><PencilSimpleIcon size={16} aria-hidden="true" />{T.edit}</Button>
      </>}
    >
      <KV rows={[
        [T.kPct, `${partner.commissionPct}%`],
        [T.kClicks, partner.clicks30.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')],
        [T.kExample, <code key="e" className="kd-num text-xs break-all">{partner.example}</code>],
        [T.kPostback, <code key="p" className="kd-num text-xs break-all">{partner.postbackUrl}</code>],
      ]} />
      <Tabs label={T.tabs} current={tab} onSelect={(k) => setTab(k as 'sales' | 'events')}
        items={[{ key: 'sales', label: T.tSales, count: conv.data?.items.length ?? null }, { key: 'events', label: T.tTop, count: conv.data ? top.length : null }]} />
      {conv.error && !conv.data ? <ErrorBox error={conv.error} retry={conv.reload} /> : !conv.data ? <Loading /> : tab === 'sales' ? (
        <>
          <div className="max-w-[220px]">
            <Select aria-label={T.everyStatus} value={status} onChange={(e) => setStatus(e.target.value as ConvStatus | '')}>
              <option value="">{T.allStatuses}</option>
              {STATUSES.map((s) => <option key={s} value={s}>{label[s]}</option>)}
            </Select>
          </div>
          {!conv.data.items.length ? <Empty title={T.noSales} /> : (
            <Table label={T.tSales} cols={SALE_COLS} head={[T.cWhen, T.cEvent, T.cSale, T.cStatus]}>
              {conv.data.items.map((c) => (
                <Row key={c.id} cols={SALE_COLS}>
                  <Cell><Two title={<span className="kd-num text-xs">{stamp(c.occurredAt, lang)}</span>} sub={c.orderRef} /></Cell>
                  <Cell>{c.event
                    ? <KdLink className="kd-ell block text-sm text-fg-1 hover:underline" href={'/console/events/' + c.event.id}>{c.event.title}</KdLink>
                    : <span className="kd-s">{T.noMatch}</span>}</Cell>
                  <Cell end className="kd-num text-sm text-fg-1"><Two title={money(c.amount, c.currency, lang)} sub={money(c.commission, c.currency, lang)} /></Cell>
                  <Cell>
                    <Select boxClass="h-10 min-h-0" aria-label={fill(T.statusOf, { o: c.orderRef })} value={c.status} onChange={(e) => settle(c, e.target.value as ConvStatus)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{label[s]}</option>)}
                    </Select>
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </>
      ) : !top.length ? <Empty title={T.noClicks} /> : (
        <Table label={T.tTop} cols={TOP_COLS} head={[T.cEvent, T.cClicks]}>
          {top.map((e) => (
            <Row key={e.id} cols={TOP_COLS}>
              <Cell><KdLink className="kd-ell block text-sm text-fg-1 hover:underline" href={'/console/events/' + e.id}>{e.title}</KdLink></Cell>
              <Cell end className="kd-num text-sm">{e.clicks.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}</Cell>
            </Row>
          ))}
        </Table>
      )}
      {token ? <TokenSheet lang={lang} token={token} partner={partner} onClose={() => setToken(null)} /> : null}
    </Drawer>
  );
}
