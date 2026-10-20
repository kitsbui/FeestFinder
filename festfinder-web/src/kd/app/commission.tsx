'use client';
/**
 * "Hoa hồng" (growth plan card D): what a person's share links brought, per event. Opens of the
 * link, "Mua vé" clicks, partner sales and the share of FeestFinder's commission, in VND; and the
 * bank account the team pays it to. FeestFinder sells no tickets and takes nothing from anyone.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeftIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../copy';
import { money } from '../format';
import { inLang } from '../link';
import { useKd } from '../runtime';
import { Button } from '../ui/actions';
import { FieldLabel, Input, Select } from '../ui/forms';
import { Card as Panel } from '../ui/parts';
import { AppBar } from '../ui/shell';
import { BackLink } from '../ui/back-link';
import { APP } from './copy';
import { SignInCard } from './row';

interface Row { eventId: string; slug: string; title: string; opens: number; clicks: number; conversions: number; pending: number; payable: number; paid: number }
interface Commission {
  items: Row[]; totals: Omit<Row, 'eventId' | 'slug' | 'title'>; minPayout: number; sharePct: number;
  payee: { bankName: string | null; last4: string } | null; banks: { bin: string; name: string }[];
}

export function CommissionPage({ lang }: { lang: Lang }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [c, setC] = useState<Commission | null>(null);
  const load = () => FF.maybe(FF.get('/me/commission'), null).then(setC);
  useEffect(() => { if (kd.user) void load(); }, [kd.user]);
  const vnd = (n: number) => money(n, 'VND', lang);
  return (
    <>
      <AppBar className="pr-1.5">
        <BackLink className="kd-ib -ml-2" href="/profile" label={T.back}><ArrowLeftIcon size={22} aria-hidden="true" /></BackLink>
        <h1 className="kd-h ml-1">{T.commissionTitle}</h1>
      </AppBar>
      {kd.session === undefined ? <div className="kd-skel mx-4 h-40" aria-hidden="true" /> : !kd.user ? <SignInCard lang={lang} note={T.gateMe} /> : !c ? (
        <div className="kd-skel mx-4 h-40" aria-hidden="true" />
      ) : (
        <div className="flex flex-col gap-4 px-4 pb-8">
          <dl className="grid grid-cols-3 gap-2">
            {([[T.commissionOwed, c.totals.payable], [T.commissionPending, c.totals.pending], [T.commissionPaid, c.totals.paid]] as const).map(([label, n]) => (
              <Panel key={label} className="flex flex-col gap-1 p-3">
                <dt className="kd-m">{label}</dt>
                <dd className="kd-hs kd-num">{vnd(n)}</dd>
              </Panel>
            ))}
          </dl>
          {c.items.length ? (
            <ul className="flex flex-col" aria-label={T.commissionEvents}>
              {c.items.map((r) => (
                <li key={r.eventId} className="kd-lrow min-h-16">
                  <a className="flex min-w-0 flex-1 flex-col" href={inLang('/e/' + r.slug, lang)}>
                    <span className="kd-hs kd-ell">{r.title}</span>
                    <span className="kd-s kd-num">{fill(T.commissionLine, { o: r.opens, c: r.clicks, s: r.conversions })}</span>
                  </a>
                  <span className="kd-hs kd-num">{vnd(r.payable + r.pending + r.paid)}</span>
                </li>
              ))}
            </ul>
          ) : <Panel className="p-6"><span className="kd-h">{T.commissionEmpty}</span></Panel>}
          <Payee lang={lang} c={c} onSaved={load} />
        </div>
      )}
    </>
  );
}

function Payee({ lang, c, onSaved }: { lang: Lang; c: Commission; onSaved: () => void }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [open, setOpen] = useState(!c.payee);
  const [f, setF] = useState({ bankBin: c.banks[0]?.bin ?? '', accountNo: '', accountName: '' });
  const [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await FF.put('/me/payee', f);
      kd.toast(T.commissionSaved);
      setOpen(false);
      onSaved();
    } catch (err) { kd.toast(FF.errorText(err, lang)); } finally { setBusy(false); }
  };
  return (
    <section aria-labelledby="payee-h" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="payee-h" className="kd-hs">{T.commissionPayee}</h2>
        {c.payee && !open ? <Button size="sm" tone="ghost" onClick={() => setOpen(true)}>{T.commissionChange}</Button> : null}
      </div>
      {c.payee && !open ? <p className="kd-s">{c.payee.bankName ?? ''} ···· {c.payee.last4}</p> : null}
      {open ? (
        <form onSubmit={save} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="payBank">{T.bankName}</FieldLabel>
            <Select id="payBank" value={f.bankBin} onChange={(e) => setF({ ...f, bankBin: e.target.value })}>
              {c.banks.map((b) => <option key={b.bin} value={b.bin}>{b.name}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="payNo">{T.commissionAccount}</FieldLabel>
            <Input id="payNo" inputMode="numeric" autoComplete="off" value={f.accountNo} onChange={(e) => setF({ ...f, accountNo: e.target.value.replace(/\s/g, '') })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="payName">{T.commissionHolder}</FieldLabel>
            <Input id="payName" autoComplete="name" value={f.accountName} onChange={(e) => setF({ ...f, accountName: e.target.value })} />
          </div>
          <Button type="submit" tone="acc" disabled={busy || !f.accountNo || f.accountName.trim().length < 2}>{T.commissionSave}</Button>
        </form>
      ) : null}
      <p className="kd-s">{fill(T.commissionMin, { m: money(c.minPayout, 'VND', lang) })}</p>
    </section>
  );
}
