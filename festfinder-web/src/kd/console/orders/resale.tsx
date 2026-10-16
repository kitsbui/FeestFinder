'use client';
/**
 * Resale (/console/orders?view=resale): tickets attendees passed on to each other. FeestFinder
 * holds the buyer's money until the event has happened, then pays the seller by bank transfer
 * and records the bank's reference here; a failed sale, or one for an event cancelled before
 * the payout, is refunded to the buyer. The state is in the address (?rs=).
 */
import { useState } from 'react';
import { BankIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { money } from '../../format';
import { useKd } from '../../runtime';
import { Button } from '../../ui/actions';
import { Row, Table } from '../../ui/shell';
import { act, Choice, Empty, ErrorBox, FilterBar, Loading, Pill, stamp, useAsk, useLoad } from '../kit';
import { ORDERS } from './copy';
import { Cell, Two } from './parts';

/** Resale runs through FeestFinder's checkout, so it is in đồng. */
const RESALE_CURRENCY = 'VND';

type State = 'due' | 'upcoming' | 'paid_out' | 'failed';
interface Sale {
  id: string; code: string; price: number | string; fee: number | string; total: number | string;
  paidAt: string | null; payoutDueAt: string | null; paidOutAt: string | null; payoutRef: string | null;
  event: { id: string; title: string; cancelled: boolean };
  seller: { name: string; bank: { name: string; bin: string; accountNo: string; accountName: string } | null };
  buyer: { name: string };
}

const COLS = '110px minmax(200px,1.4fr) minmax(220px,1.4fr) 130px 140px 160px';

export function Resale({ lang, params, set }: { lang: Lang; params: URLSearchParams; set: (p: Record<string, string | null>) => void }) {
  const T = pick(ORDERS, lang);
  const kd = useKd();
  const ask = useAsk();
  const raw = params.get('rs');
  const state: State = raw === 'upcoming' || raw === 'paid_out' || raw === 'failed' ? raw : 'due';
  const load = useLoad<{ items: Sale[] }>('/admin/resale?state=' + state);
  const [busy, setBusy] = useState<string | null>(null);
  const m = (n: number | string) => money(Number(n), RESALE_CURRENCY, lang);

  const run = async (id: string, call: () => Promise<unknown>) => {
    setBusy(id);
    if (await act(kd, lang, call)) load.reload();
    setBusy(null);
  };
  const payout = async (r: Sale) => {
    const b = r.seller.bank;
    const ok = await ask({
      title: fill(T.rPayAsk, { m: m(r.price), n: r.seller.name }),
      body: b ? <span className="kd-num text-paper">{b.name} · {b.accountNo} · {b.accountName}</span> : T.rPayNoBank,
      confirm: T.rPayConfirm, note: 'required', noteLabel: T.rPayRef,
    });
    if (ok) run(r.id, () => FF.post(`/admin/resale/${r.id}/payout`, { reference: ok.note }));
  };
  const refund = async (r: Sale) => {
    const ok = await ask({ title: fill(T.rRefundAsk, { m: m(r.total), n: r.buyer.name }), body: r.event.title, confirm: T.rRefundConfirm, danger: true });
    if (ok) run(r.id, () => FF.post(`/admin/resale/${r.id}/refund`));
  };
  const states: { value: State; label: string }[] = [
    { value: 'due', label: T.rDue }, { value: 'upcoming', label: T.rUpcoming }, { value: 'paid_out', label: T.rPaidOut }, { value: 'failed', label: T.rFailed },
  ];

  return (
    <>
      <FilterBar>
        <Choice label={T.rState} any={false} value={state} options={states} onChange={(v) => set({ rs: v === 'due' ? null : v })} />
      </FilterBar>
      {load.error ? <ErrorBox error={load.error} retry={load.reload} /> : null}
      {!load.data ? (load.error ? null : <Loading />) : !load.data.items.length ? <Empty title={T.rNone} /> : (
        <Table label={T.rTable} cols={COLS} head={[T.rCode, T.rEvent, T.rPeople, T.rGets, state === 'paid_out' ? T.rPaidCol : T.rDueCol, '']}>
          {load.data.items.map((r) => (
            <Row key={r.id} cols={COLS}>
              <Cell className="kd-num text-xs text-paper">{r.code}</Cell>
              <Cell>
                <span className="flex min-w-0 flex-col items-start gap-1">
                  <span className="kd-ell text-sm text-paper">{r.event.title}</span>
                  {r.event.cancelled ? <Pill tone="bad">{T.rCancelled}</Pill> : null}
                </span>
              </Cell>
              <Cell><Two title={`${r.seller.name} → ${r.buyer.name}`} sub={r.seller.bank ? `${r.seller.bank.name} · ${r.seller.bank.accountNo}` : T.rNoBank} /></Cell>
              <Cell end className="kd-num text-sm text-paper">{m(r.price)}</Cell>
              <Cell className="kd-s kd-num text-xs">{stamp(r.paidOutAt ?? r.payoutDueAt ?? r.paidAt, lang)}</Cell>
              <Cell end>
                {state === 'due' && !r.event.cancelled
                  ? <Button size="sm" disabled={busy === r.id} onClick={() => payout(r)}><BankIcon size={14} aria-hidden="true" />{T.rPay}</Button>
                  : state === 'failed' || (r.event.cancelled && !r.paidOutAt)
                    ? <Button size="sm" className="kd-btn-danger" disabled={busy === r.id} onClick={() => refund(r)}>{T.rRefund}</Button>
                    : r.payoutRef ? <span className="kd-s kd-num text-xs">{r.payoutRef}</span> : null}
              </Cell>
            </Row>
          ))}
        </Table>
      )}
    </>
  );
}
