'use client';
/**
 * /app/checkout/<slug> in Kính đêm: where every FeestFinder ticket button lands (through /go,
 * with ?tier=&qty=, or ?listing= for a resale ticket). The basket is priced by the API's quote
 * (tier, quantity up to 6, promo code, service fee); paying opens the VietQR transfer and waits
 * for the money, or, with the development payment stand-in, lands straight in Vé của tôi.
 * FeestFinder checkout is VND only (CLAUDE.md); the API refuses anything else.
 */
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeftIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { money, timeRange, whenShort } from '../format';
import { familyOf, g } from '../genre';
import { useKd } from '../runtime';
import { Button } from '../ui/actions';
import { FieldError, Input, Option, Stepper } from '../ui/forms';
import { Accordion, Art, Card as Panel, Status } from '../ui/parts';
import { QrCode } from '../ui/qr';
import { AppBar, Dock } from '../ui/shell';
import type { EventDetail, Tier } from '../types';
import { tierStatus } from '../web/event/tickets';
import { APP } from './copy';
import { SignInCard } from './row';

const MAX = 6;
const open = (t: Tier) => t.state === 'onsale' || t.state === 'last';

interface Quote { total: number; lines: { label: Pair; amount: number }[]; tier?: { left: number }; refundPolicy?: Pair }
interface Payment {
  status: 'paid' | 'awaiting_transfer'; qrPayload?: string; amount?: number; reference?: string; expiresAt?: string;
  bank?: { name: string; accountNo: string; accountName: string }; note?: Pair;
}

export function Checkout({ lang, slug }: { lang: Lang; slug: string }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [ev, setEv] = useState<EventDetail | null | undefined>(undefined);
  useEffect(() => {
    FF.maybe(FF.get('/events/' + encodeURIComponent(slug)), null).then(setEv);
  }, [slug]);
  return (
    <>
      <AppBar>
        <a className="kd-ib -ml-2" href={'/app/e/' + encodeURIComponent(slug)} aria-label={T.back}><ArrowLeftIcon size={22} aria-hidden="true" /></a>
        <h1 className="kd-h ml-1">{T.checkoutTitle}</h1>
      </AppBar>
      {ev === undefined || kd.session === undefined ? <div className="kd-skel mx-4 mt-2 h-60" aria-hidden="true" />
        : !ev ? <Panel className="m-4 p-6"><span className="kd-h">{T.notFound}</span></Panel>
        : !kd.user ? <SignInCard lang={lang} note={T.gateCheckout} />
        : <Basket lang={lang} ev={ev} />}
    </>
  );
}

function Basket({ lang, ev }: { lang: Lang; ev: EventDetail }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const params = useRef(new URLSearchParams(location.search));
  const listing = params.current.get('listing');
  const tiers = ev.tickets?.tiers ?? [];
  const [tierId, setTierId] = useState<string | null>(() => {
    const asked = params.current.get('tier');
    return tiers.find((t) => t.id === asked && open(t))?.id ?? tiers.find(open)?.id ?? null;
  });
  const [qty, setQty] = useState(() => Math.min(MAX, Math.max(1, Number(params.current.get('qty')) || 1)));
  const [promo, setPromo] = useState('');
  const [applied, setApplied] = useState<string | undefined>(undefined);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [err, setErr] = useState('');
  const [promoErr, setPromoErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ id: string; resale: boolean; payment: Payment } | null>(null);
  const seq = useRef(0);
  const tier = tiers.find((t) => t.id === tierId) ?? null;
  const max = Math.max(1, Math.min(MAX, quote?.tier?.left ?? tier?.left ?? MAX));

  const price = useCallback(async () => {
    const n = ++seq.current;
    setErr('');
    try {
      const q: Quote = listing
        ? await FF.post('/resale/' + listing + '/quote')
        : await FF.post('/checkout/quote', { eventId: ev.id, tierId, qty, ...(applied ? { promoCode: applied } : {}) });
      if (n === seq.current) setQuote(q);
    } catch (e) {
      if (n !== seq.current) return;
      // A code that does not work is dropped, and said so by the field until it changes.
      if ((e as { code?: string }).code?.startsWith('promo_')) { setPromoErr(FF.errorText(e, lang)); setApplied(undefined); return; }
      setQuote(null);
      setErr(FF.errorText(e, lang));
    }
  }, [listing, ev.id, tierId, qty, applied, lang]);
  useEffect(() => { if (listing || tierId) price(); }, [price, listing, tierId]);

  const pay = async () => {
    setBusy(true); setErr('');
    try {
      const out = listing
        ? await FF.post('/resale/' + listing + '/orders', { paymentMethod: 'vietqr' })
        : await FF.post('/orders', { eventId: ev.id, tierId, qty, paymentMethod: 'vietqr', ...(applied ? { promoCode: applied } : {}) });
      if (out.payment?.status === 'paid') {
        kd.toast(FF.text(out.message, lang) || T.ticketsIn);
        location.assign('/app/tickets');
        return;
      }
      setPending({ id: out.order.id, resale: !!listing, payment: out.payment });
    } catch (e) { setErr(FF.errorText(e, lang)); }
    setBusy(false);
  };

  if (pending) return <Transfer lang={lang} pending={pending} onCancelled={() => { setPending(null); price(); }} />;

  const fam = familyOf(ev.genre);
  return (
    <div className="flex flex-col gap-5 px-4 desk:max-w-[640px] pb-[calc(110px+env(safe-area-inset-bottom))] pt-2">
      <div className={`grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3 ${g(fam)}`}>
        <Art family={fam} cover={ev.coverUrl} className="h-16 rounded-lg" />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="kd-hs kd-ell">{ev.title}</span>
          <span className="kd-s kd-ell">{whenShort(ev, lang)}{timeRange(ev) ? ' · ' + timeRange(ev) : ''} · {ev.venue.name}</span>
        </span>
      </div>

      {listing ? (
        <Status tone="ok">{T.resaleTicket}</Status>
      ) : tiers.some(open) ? (
        <>
          <div role="radiogroup" aria-label={T.tier} className="flex flex-col gap-1.5">
            {tiers.map((t) => {
              const st = tierStatus(t, lang);
              return (
                <Option key={t.id} checked={t.id === tierId} disabled={!open(t)} onSelect={() => setTierId(t.id)}
                  title={t.name[lang]} price={money(t.price, ev.currency, lang)} note={t.note?.[lang]} status={<Status tone={st.tone}>{st.text}</Status>} />
              );
            })}
          </div>
          <div className="flex items-center justify-between">
            <span className="kd-hs">{T.quantity}</span>
            <Stepper value={qty} max={max} onChange={setQty} label={T.quantity} decLabel={T.qtyDec} incLabel={T.qtyInc} />
          </div>
          <form className="flex gap-2" onSubmit={(e: FormEvent) => { e.preventDefault(); setApplied(promo.trim().toUpperCase() || undefined); }}>
            <Input aria-label={T.promo} placeholder={T.promo} value={promo} onChange={(e) => { setPromo(e.target.value); setPromoErr(''); }} autoCapitalize="characters" boxClass="flex-1" invalid={!!promoErr} />
            <Button type="submit">{T.apply}</Button>
          </form>
          {promoErr ? <FieldError>{promoErr}</FieldError> : null}
        </>
      ) : (
        <p className="kd-t">{T.noTiers}</p>
      )}

      {quote ? (
        <dl className="flex flex-col border-t border-line">
          {quote.lines.map((l) => (
            <div key={l.label.en} className="kd-lrow min-h-11"><dt className="kd-s flex-1">{l.label[lang]}</dt><dd className="kd-mb kd-num">{money(l.amount, 'VND', lang)}</dd></div>
          ))}
          <div className="kd-lrow min-h-12 border-b-0"><dt className="kd-hs flex-1">{T.total}</dt><dd className="kd-h kd-num">{money(quote.total, 'VND', lang)}</dd></div>
        </dl>
      ) : null}
      {err ? <FieldError>{err}</FieldError> : null}
      <span className="kd-s">{T.payBy}</span>
      {quote?.refundPolicy ? <Accordion small summary={T.refund} className="border-t border-line"><p className="kd-s">{quote.refundPolicy[lang]}</p></Accordion> : null}

      <Dock>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="kd-h kd-num">{quote ? money(quote.total, 'VND', lang) : '—'}</span>
          <span className="kd-s kd-ell">{listing ? T.resaleTicket : tier ? `${tier.name[lang]} · ${qty}` : ''}</span>
        </div>
        <Button tone="acc" size="lg" className="ml-auto" disabled={!quote || busy} onClick={pay}>{quote ? fill(T.payNow, { p: money(quote.total, 'VND', lang) }) : T.buy}</Button>
      </Dock>
    </div>
  );
}

/** The VietQR the bank app scans, the details to type by hand, and the wait for the money. */
function Transfer({ lang, pending, onCancelled }: { lang: Lang; pending: { id: string; resale: boolean; payment: Payment }; onCancelled: () => void }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const p = pending.payment;
  const base = pending.resale ? '/resale/orders/' : '/orders/';
  // Every few seconds: has the money landed?
  useEffect(() => {
    const id = setInterval(async () => {
      const o = await FF.maybe(FF.get(base + pending.id), null);
      if (o?.status === 'paid') {
        clearInterval(id);
        kd.toast(T.ticketsIn);
        location.assign('/app/tickets');
      }
    }, 5000);
    return () => clearInterval(id);
  }, [base, pending.id, kd, T.ticketsIn]);
  const cancel = async () => {
    try { await FF.post(base + pending.id + '/cancel'); kd.toast(T.cancelled); onCancelled(); } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  const until = p.expiresAt ? new Date(p.expiresAt).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) : null;
  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-2">
      <h2 className="kd-d3">{T.transferTitle}</h2>
      {p.qrPayload ? (
        <div className="flex justify-center rounded-card bg-white p-3">
          <QrCode value={p.qrPayload} size={220} label={fill(T.transferQr, { p: money(p.amount ?? 0, 'VND', lang) })} />
        </div>
      ) : null}
      <dl className="flex flex-col border-t border-line">
        {p.bank ? <Row k={T.bankName} v={p.bank.name} /> : null}
        {p.bank ? <Row k={T.accountNo} v={p.bank.accountNo} /> : null}
        {p.bank ? <Row k={T.holder} v={p.bank.accountName} /> : null}
        {p.amount != null ? <Row k={T.amount} v={money(p.amount, 'VND', lang)} /> : null}
        {p.reference ? <Row k={T.reference} v={p.reference} /> : null}
      </dl>
      {p.note ? <p className="kd-s">{p.note[lang]}</p> : null}
      <Status tone="live">{T.waiting}</Status>
      {until ? <span className="kd-s">{fill(T.heldFor, { t: until })}</span> : null}
      <Button tone="ghost" onClick={cancel}>{T.cancelOrder}</Button>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="kd-lrow min-h-11"><dt className="kd-s flex-1">{k}</dt><dd className="kd-hs kd-num text-right">{v}</dd></div>;
}
