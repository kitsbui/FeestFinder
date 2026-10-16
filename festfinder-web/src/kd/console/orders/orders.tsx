'use client';
/**
 * /console/orders: ticket orders, for support, and resale payouts (?view=resale). Find an order
 * by code, buyer or event; filter by status, payment method and date, all kept in the address
 * (?event=&eventLabel= is how the events screen links here); the tiles count each status and
 * toggle it. An order opens in a drawer (?id=, or /console/orders/<id>) with its tickets, and
 * is refunded there when no ticket was scanned, with a reason for the audit log.
 */
import { useCallback } from 'react';
import { CalendarDotsIcon, ReceiptXIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../../copy';
import { dayMonth, money } from '../../format';
import { KdLink } from '../../link';
import { useKd } from '../../runtime';
import { Button, LinkButton } from '../../ui/actions';
import { Input } from '../../ui/forms';
import { Table, Row, Tabs } from '../../ui/shell';
import { act, AsyncPick, Body, Drawer, Empty, ErrorBox, FilterBar, KV, Loading, MultiChoice, PageHead, Pager, Pill, qs, SearchField, stamp, useAsk, useLoad, useOptions, useQuery, type PickItem } from '../kit';
import { useConsole } from '../root';
import { ORDERS } from './copy';
import { Cell, CHECKOUT_CURRENCY, Section, STATUS_TONE, Tile, Tiles, Two, useTyped } from './parts';
import { Resale } from './resale';


type Status = 'pending' | 'paid' | 'cancelled' | 'expired' | 'refunded';
interface OrderRow {
  id: string; code: string; status: Status; statusLabel: Pair; method: string; methodLabel: string; qty: number; total: number; createdAt: string;
  buyer: { id: string; name: string | null; email: string | null; phone: string | null };
  event: { id: string; title: string; startsOn: string | null }; tier: Pair | string;
}
interface OrderList { items: OrderRow[]; total: number; summary: Partial<Record<Status, { count: number; total: number }>> }
interface OrderDetail extends OrderRow {
  providerRef: string | null; unitPrice: number; subtotal: number; discount: number; fee: number; promo: string | null; paidAt: string | null; refundedAt: string | null;
  event: { id: string; title: string; startsOn: string | null; slug: string };
  tickets: { id: string; code: string; holder: string | null; status: 'valid' | 'used' | 'refunded' | 'void'; checkedInAt: string | null; gate: string | null }[];
  refundable: boolean;
}

const COLS = '110px 130px minmax(180px,1.2fr) minmax(220px,1.6fr) 100px 120px 150px';

export function Orders() {
  const { lang } = useConsole();
  const T = pick(ORDERS, lang);
  const [params, set] = useQuery();
  const view = params.get('view') === 'resale' ? 'resale' : 'orders';
  return (
    <>
      <PageHead title={T.title} />
      <Body>
        <Tabs
          label={T.tabs}
          current={view}
          onSelect={(k) => set({ view: k === 'resale' ? 'resale' : null })}
          items={[{ key: 'orders', label: T.tabOrders }, { key: 'resale', label: T.tabResale }]}
        />
        {view === 'resale' ? <Resale lang={lang} params={params} set={set} /> : <OrderList lang={lang} params={params} set={set} />}
      </Body>
    </>
  );
}

function OrderList({ lang, params, set }: { lang: Lang; params: URLSearchParams; set: (p: Record<string, string | null>) => void }) {
  const T = pick(ORDERS, lang);
  const opts = useOptions();
  const get = (k: string) => params.get(k) ?? '';
  const status = get('status'), method = get('method'), event = get('event'), from = get('from'), to = get('to');
  const offset = Number(get('offset') || 0), limit = Number(get('limit') || 25);
  const id = get('id');
  const reset = useCallback((p: Record<string, string | null>) => set({ ...p, offset: null }), [set]);
  const [text, setText] = useTyped(get('q'), useCallback((v: string) => reset({ q: v }), [reset]));
  const path = '/admin/orders' + qs({ q: get('q'), status, method, eventId: event, from, to, offset, limit });
  const load = useLoad<OrderList>(path);
  const sum = load.data?.summary ?? {};
  const statuses = status ? status.split(',') : [];
  const toggle = (s: Status) => reset({ status: status === s ? null : s });
  const loadEvents = useCallback(async (q: string): Promise<PickItem[]> => {
    const out = await FF.get('/admin/events' + qs({ q, limit: 20, sort: 'date' }));
    return out.items.map((e: { id: string; title: string; startsOn: string | null; venueName: string | null; organizer: { name: string } }) => ({
      value: e.id, label: e.title, sub: [e.startsOn ? dayMonth(e.startsOn, lang) : '', e.venueName, e.organizer.name].filter(Boolean).join(' · '),
    }));
  }, [lang]);
  const filtered = !!(get('q') || status || method || event || from || to);

  return (
    <>
      <Tiles>
        {(['paid', 'pending', 'refunded'] as const).map((s) => (
          <Tile key={s} label={T[s]} value={(sum[s]?.count ?? 0).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')} note={money(sum[s]?.total ?? 0, CHECKOUT_CURRENCY, lang)} on={status === s} onClick={() => toggle(s)} />
        ))}
      </Tiles>
      <FilterBar onReset={filtered ? () => { setText(''); reset({ q: null, status: null, method: null, event: null, eventLabel: null, from: null, to: null }); } : null}>
        <SearchField value={text} onChange={setText} label={T.searchLabel} placeholder={T.search} />
        <MultiChoice label={T.status} values={statuses} onChange={(v) => reset({ status: v.join(',') })}
          options={(opts?.orderStatuses ?? []).map((s: { value: string; label: Pair }) => ({ value: s.value, label: s.label[lang] }))} />
        <MultiChoice label={T.method} values={method ? method.split(',') : []} onChange={(v) => reset({ method: v.join(',') })}
          options={(opts?.paymentMethods ?? []).map((m: { value: string; label: string }) => ({ value: m.value, label: m.label }))} />
        <div className="w-full max-w-[300px]">
          <AsyncPick label={T.eventLabel} placeholder={T.event} load={loadEvents}
            value={event ? { value: event, label: get('eventLabel') || event } : null}
            onPick={(i) => reset({ event: i?.value ?? null, eventLabel: i?.label ?? null })} />
        </div>
        <span className="flex items-center gap-1.5">
          <Input type="date" boxClass="h-10 min-h-0" className="kd-num" aria-label={T.from} value={from} max={to || undefined} onChange={(e) => reset({ from: e.target.value })} />
          <span className="kd-s" aria-hidden="true">→</span>
          <Input type="date" boxClass="h-10 min-h-0" className="kd-num" aria-label={T.to} value={to} min={from || undefined} onChange={(e) => reset({ to: e.target.value })} />
        </span>
      </FilterBar>
      {load.error ? <ErrorBox error={load.error} retry={load.reload} /> : null}
      {!load.data ? (load.error ? null : <Loading />) : (
        <>
          {!load.data.items.length ? <Empty /> : <Table label={T.table} cols={COLS} head={[T.colCode, T.colWhen, T.colBuyer, T.colEvent, T.colMethod, T.colTotal, T.colStatus]}>
            {load.data.items.map((o) => (
              <Row key={o.id} cols={COLS} current={o.id === id} onClick={() => set({ id: o.id })}>
                <Cell className="kd-num text-xs text-paper">{o.code}</Cell>
                <Cell className="kd-s kd-num text-xs">{stamp(o.createdAt, lang)}</Cell>
                <Cell><Two title={o.buyer.name || '—'} sub={o.buyer.email ?? o.buyer.phone ?? ''} /></Cell>
                <Cell><Two title={o.event.title} sub={`${FF.text(o.tier, lang)} × ${o.qty}`} /></Cell>
                <Cell className="kd-s">{o.methodLabel}</Cell>
                <Cell end className="kd-num text-sm text-paper">{money(o.total, CHECKOUT_CURRENCY, lang)}</Cell>
                <Cell><Pill tone={STATUS_TONE[o.status]}>{o.statusLabel[lang]}</Pill></Cell>
              </Row>
            ))}
          </Table>}
          <Pager offset={offset} limit={limit} total={load.data.total} onChange={(o, l) => set({ offset: o ? String(o) : null, limit: l === 25 ? null : String(l) })} />
        </>
      )}
      {id ? <OrderDrawer key={id} id={id} lang={lang} onClose={() => set({ id: null })} onChanged={load.reload} /> : null}
    </>
  );
}

function OrderDrawer({ id, lang, onClose, onChanged }: { id: string; lang: Lang; onClose: () => void; onChanged: () => void }) {
  const T = pick(ORDERS, lang);
  const kd = useKd();
  const ask = useAsk();
  const load = useLoad<OrderDetail>('/admin/orders/' + id);
  const o = load.data;
  const m = (n: number) => money(n, CHECKOUT_CURRENCY, lang);
  const TICKET: Record<string, [Parameters<typeof Pill>[0]['tone'], string]> = { valid: ['ok', T.tValid], used: ['live', T.tUsed], refunded: ['warn', T.tRefunded], void: ['none', T.tVoid] };
  const refund = async () => {
    if (!o) return;
    const ok = await ask({ title: fill(T.refundAsk, { c: o.code }), body: fill(T.refundBody, { m: m(o.total), n: o.qty }), confirm: T.refund, danger: true, note: 'required', noteLabel: T.refundReason });
    if (!ok) return;
    if (await act(kd, lang, () => FF.post(`/admin/orders/${id}/refund`, { reason: ok.note }))) { load.reload(); onChanged(); }
  };
  return (
    <Drawer
      title={o ? <span className="kd-num">{o.code}</span> : T.loading}
      sub={o ? <span className="flex flex-wrap items-center gap-2"><Pill tone={STATUS_TONE[o.status]}>{o.statusLabel[lang]}</Pill><span>{o.methodLabel} · {stamp(o.createdAt, lang)}</span></span> : null}
      onClose={onClose}
      footer={o ? (
        <>
          <LinkButton size="sm" href={'/console/events/' + o.event.id}><CalendarDotsIcon size={16} aria-hidden="true" />{T.openEvent}</LinkButton>
          <span className="flex-1" />
          {o.refundable
            ? <Button size="sm" className="kd-btn-danger" onClick={refund}><ReceiptXIcon size={16} aria-hidden="true" />{T.refund}</Button>
            : o.status === 'paid' ? <span className="kd-s">{T.noRefund}</span> : null}
        </>
      ) : null}
    >
      {load.error && !o ? <ErrorBox error={load.error} retry={load.reload} /> : !o ? <Loading /> : (
        <>
          <Section title={T.order}>
            <KV rows={[
              [T.kEvent, `${o.event.title}${o.event.startsOn ? ' · ' + dayMonth(o.event.startsOn, lang) : ''}`],
              [T.kTier, FF.text(o.tier, lang)],
              [T.kQty, `${o.qty} × ${m(o.unitPrice)}`],
              [T.kSubtotal, m(o.subtotal)],
              [T.kDiscount, o.discount ? `−${m(o.discount)}${o.promo ? ` (${o.promo})` : ''}` : '—'],
              [T.kFee, m(o.fee)],
              [T.kTotal, <strong key="t" className="kd-num">{m(o.total)}</strong>],
              [T.kPaidAt, o.paidAt ? stamp(o.paidAt, lang) : '—'],
              [T.kRefundedAt, o.refundedAt ? stamp(o.refundedAt, lang) : '—'],
              [T.kRef, o.providerRef ? <span key="r" className="kd-num text-xs">{o.providerRef}</span> : '—'],
            ]} />
          </Section>
          <Section title={T.buyer}>
            <KV rows={[
              [T.kName, <KdLink key="n" className="underline-offset-2 hover:underline" href={'/console/users?id=' + o.buyer.id}>{o.buyer.name || '—'}</KdLink>],
              [T.kEmail, o.buyer.email ?? '—'],
              [T.kPhone, o.buyer.phone ?? '—'],
            ]} />
          </Section>
          <Section title={fill(T.tickets, { n: o.tickets.length })}>
            <ul className="flex flex-col">
              {o.tickets.map((x) => (
                <li key={x.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-line py-2">
                  <span className="kd-num text-xs text-paper">{x.code}</span>
                  <span className="kd-s kd-ell">{x.holder || '—'}</span>
                  <Pill tone={TICKET[x.status]?.[0] ?? 'none'}>{TICKET[x.status]?.[1] ?? x.status}</Pill>
                  {x.checkedInAt ? <span className="kd-s kd-num col-span-3 text-xs">{stamp(x.checkedInAt, lang)}{x.gate ? ' · ' + x.gate : ''}</span> : null}
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}
    </Drawer>
  );
}
