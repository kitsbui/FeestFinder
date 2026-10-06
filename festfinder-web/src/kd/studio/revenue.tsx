'use client';
/**
 * /studio/revenue: what the chosen event's FeestFinder ticket sales made. Gross and net, tickets
 * sold, the average ticket and refunds; tickets per day over the last two weeks; sales by tier;
 * the fees; the three payouts (advance, after the event, the refund hold) each with its lines
 * and its statement; and the bank account the money goes to.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { DownloadSimpleIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Pair } from '../copy';
import { BANKS } from '../banks';
import { count, dayMonth, money } from '../format';
import { useKd } from '../runtime';
import { Button } from '../ui/actions';
import { BarRow, LineChart } from '../ui/charts';
import { FieldLabel, Input, Select } from '../ui/forms';
import { Accordion, Card as Panel, Status } from '../ui/parts';
import { STUDIO } from './copy';
import { StudioHead } from './head';
import { Block, CHECKOUT, Kpi, Kpis, NeedEvent, Page } from './parts';
import { useStudio } from './root';

interface Line { key: string; label: Pair; amount: number }
interface Payout { kind: 'advance' | 'post_event' | 'refund_hold'; period: Pair; status: 'paid' | 'available' | 'scheduled' | 'held' | 'released'; settles: Pair; lines: Line[]; net: number; reference: string | null }
interface Revenue {
  kpis: { gross: number; net: number; ticketsSold: number; avgTicket: number; refunds: { tickets: number; amount: number; pct: number } };
  daily: { day: string; fullPrice: number; withCode: number }[];
  tiers: { id: string | null; name: Pair; price: number; sold: number; gross: number | null }[];
  payouts: Payout[];
  account: { bankName: string; accountMasked: string; accountName: string; verified: boolean; note: Pair } | null;
  fees: Line[];
}

export function RevenueScreen() {
  const { lang, event } = useStudio();
  const T = pick(STUDIO, lang);
  const [r, setR] = useState<Revenue | null | undefined>(undefined);
  const load = useCallback(async () => {
    if (!event) return;
    setR(await FF.maybe(FF.get(`/organizer/events/${event.id}/revenue`), null));
  }, [event]);
  useEffect(() => { load(); }, [load]);
  const m = (n: number) => money(n, CHECKOUT, lang);
  const status: Record<Payout['status'], { tone: 'ok' | 'warn' | 'none'; label: string }> = {
    paid: { tone: 'ok', label: T.pPaid }, available: { tone: 'warn', label: T.pAvailable }, scheduled: { tone: 'none', label: T.pScheduled },
    held: { tone: 'none', label: T.pHeld }, released: { tone: 'ok', label: T.pReleased },
  };
  const maxTier = Math.max(1, ...(r?.tiers.map((t) => t.sold) ?? [1]));

  return (
    <Page>
      <StudioHead label={T.revenue} />
      {!event ? <NeedEvent /> : r === undefined ? <div className="kd-skel h-40" aria-hidden="true" /> : !r ? <NeedEvent /> : (
        <>
          <Kpis>
            <Kpi bone label={T.net} value={m(r.kpis.net)} note={`${T.gross} ${m(r.kpis.gross)}`} />
            <Kpi label={T.ticketsSold} value={count(r.kpis.ticketsSold, lang)} />
            <Kpi label={T.avgTicket} value={m(r.kpis.avgTicket)} />
            <Kpi label={T.refunds} value={m(r.kpis.refunds.amount)} note={fill(T.refundLine, { n: count(r.kpis.refunds.tickets, lang), p: r.kpis.refunds.pct })} />
          </Kpis>
          {!r.kpis.ticketsSold && !r.kpis.gross ? <Panel className="p-5"><span className="kd-s">{T.noSales}</span></Panel> : null}
          <div className="kd-split gap-3">
            <Block className="kd-main" title={T.salesPerDay} aside={<span className="kd-m kd-num">{fill(T.days, { n: 14 })}</span>}>
              <LineChart
                label={T.salesPerDay}
                height={200}
                points={r.daily.map((d) => ({ label: dayMonth(d.day, lang), value: d.fullPrice + d.withCode }))}
                format={(n) => `${count(n, lang)} ${T.ticketsSold.toLowerCase()}`}
              />
              <div className="flex flex-wrap gap-x-5 gap-y-1 kd-s kd-num">
                <span>{T.fullPrice}: {count(r.daily.reduce((n, d) => n + d.fullPrice, 0), lang)}</span>
                <span>{T.withCode}: {count(r.daily.reduce((n, d) => n + d.withCode, 0), lang)}</span>
              </div>
            </Block>
            <Block className="kd-side" title={T.byTier}>
              <div className="flex flex-col gap-3.5">
                {r.tiers.map((t) => (
                  <BarRow key={t.id ?? 'guest'} label={t.name[lang] + (t.price ? ' · ' + m(t.price) : '')} value={t.sold} max={maxTier} display={count(t.sold, lang)} />
                ))}
              </div>
            </Block>
          </div>
          <div className="kd-split gap-3">
            <Block className="kd-main" title={T.payouts}>
              <div className="flex flex-col">
                {r.payouts.map((p) => (
                  <Accordion
                    key={p.kind}
                    summary={<span className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="kd-hs">{p.period[lang]}</span><Status tone={status[p.status].tone}>{status[p.status].label}</Status></span>}
                    aside={m(p.net)}
                  >
                    <div className="flex flex-col gap-2 pb-2">
                      <span className="kd-s">{p.settles[lang]}{p.reference ? ' · ' + p.reference : ''}</span>
                      {p.lines.map((l) => (
                        <div key={l.key} className="flex items-baseline justify-between gap-3 kd-s"><span>{l.label[lang]}</span><span className="kd-num text-mist">{m(l.amount)}</span></div>
                      ))}
                      <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2"><span className="kd-hs">{T.net}</span><span className="kd-mb kd-num">{m(p.net)}</span></div>
                      <a className="kd-more" href={`/organizer/events/${event.id}/payouts/${p.kind}/statement.csv`} download><DownloadSimpleIcon size={14} aria-hidden="true" />{T.statement}</a>
                    </div>
                  </Accordion>
                ))}
              </div>
            </Block>
            <div className="kd-side flex flex-col gap-3">
              <Block title={T.fees}>
                <div className="flex flex-col gap-2">
                  {r.fees.map((f) => <div key={f.key} className="flex items-baseline justify-between gap-3 kd-s"><span>{f.label[lang]}</span><span className="kd-num text-mist">{m(f.amount)}</span></div>)}
                </div>
              </Block>
              <BankAccount account={r.account} onSaved={load} />
            </div>
          </div>
        </>
      )}
    </Page>
  );
}

function BankAccount({ account, onSaved }: { account: Revenue['account']; onSaved: () => void }) {
  const { lang, org } = useStudio();
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ bankBin: BANKS[0][0], accountNo: '', accountName: '' });
  const [busy, setBusy] = useState(false);
  const owner = org.myRole === 'owner';
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try { await FF.put('/organizer/bank', f); kd.toast(T.saved); setEdit(false); onSaved(); } catch (x) { kd.toast(FF.errorText(x, lang)); }
    setBusy(false);
  };
  return (
    <Block title={T.account} aside={account && owner && !edit ? <Button tone="ghost" size="sm" onClick={() => setEdit(true)}>{T.accountChange}</Button> : null}>
      {account && !edit ? (
        <div className="flex flex-col gap-1">
          <span className="kd-hs">{account.bankName}</span>
          <span className="kd-s kd-num">{account.accountMasked} · {account.accountName}</span>
          <Status tone={account.verified ? 'ok' : 'warn'}>{account.verified ? T.verified : T.unverified}</Status>
          <span className="kd-s mt-1">{account.note[lang]}</span>
        </div>
      ) : edit ? (
        <form className="flex flex-col gap-3" onSubmit={save}>
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="bBank">{T.bank}</FieldLabel><Select id="bBank" value={f.bankBin} onChange={(e) => setF({ ...f, bankBin: e.target.value })}>{BANKS.map(([bin, name]) => <option key={bin} value={bin}>{name}</option>)}</Select></div>
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="bNo">{T.accountNo}</FieldLabel><Input id="bNo" required inputMode="numeric" pattern="\d{6,19}" className="kd-num" value={f.accountNo} onChange={(e) => setF({ ...f, accountNo: e.target.value.replace(/\D/g, '').slice(0, 19) })} /></div>
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="bName">{T.accountName}</FieldLabel><Input id="bName" required minLength={2} maxLength={80} className="uppercase" value={f.accountName} onChange={(e) => setF({ ...f, accountName: e.target.value.toUpperCase() })} /></div>
          <div className="flex gap-2"><Button tone="acc" type="submit" disabled={busy}>{T.save}</Button><Button tone="ghost" onClick={() => setEdit(false)}>{T.cancel}</Button></div>
        </form>
      ) : owner ? <Button className="self-start" onClick={() => setEdit(true)}>{T.accountAdd}</Button> : null}
    </Block>
  );
}
