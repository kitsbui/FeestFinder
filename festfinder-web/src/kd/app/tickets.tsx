'use client';
/**
 * /app/tickets in Kính đêm (design/App-Ticket): "Vé của tôi" with Sắp tới / Đã qua, each order
 * as a bone ticket card (art with the doors countdown, tier, doors, the QR the gate scans, its
 * code, a dot per ticket), then "Thêm vào lịch" and "Chỉ đường". Each ticket can be given to
 * a phone number or passed on at no more than face value. The service worker keeps the last
 * answer, so the codes still show with no signal.
 */
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { BroadcastIcon, CalendarBlankIcon, NavigationArrowIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { cx } from '../cx';
import { money, whenShort } from '../format';
import { FAMILY_LABEL, familyOf, g } from '../genre';
import { useKd } from '../runtime';
import { Button, buttonClass } from '../ui/actions';
import { FieldError, FieldLabel, Input, Segmented, Select } from '../ui/forms';
import { Art, Card as Panel, Status } from '../ui/parts';
import { QrCode } from '../ui/qr';
import { Sheet } from '../ui/sheet';
import { APP } from './copy';
import { SignInCard } from './row';
import { BANKS } from '../banks';

interface Ticket {
  id: string; code: string; status: 'valid' | 'used' | 'void' | string; checkedInAt: string | null; qr: string;
  faceValue: number; transferable: boolean; listing: { id: string; price: number; status: string } | null;
}
interface Order {
  id: string; code: string; status: string; received: boolean;
  event: {
    id: string; slug: string; title: string; startsOn: string; endsOn: string | null; startTime: string | null; endTime: string | null;
    venueName: string | null; area: string | null; startsAt: string | null; endsAt: string | null; genre: string | null; city: string;
    timezone: string | null; lat: number | null; lng: number | null;
  };
  tier: { key: string; name: Pair };
  tickets: Ticket[];
}
interface Wallet { items: Order[]; resold: { id: string; price: number; soldAt: string; payoutDueAt: string | null; paidOutAt: string | null; event: { title: string; slug: string } }[]; payee: { bankName: string | null; accountMasked: string } | null }

export function Tickets({ lang }: { lang: Lang }) {
  const T = pick(APP, lang);
  const kd = useKd();
  return (
    <>
      {kd.session === undefined ? <div className="kd-skel mx-4 mt-4 h-96" aria-hidden="true" /> : kd.user ? <Wallet lang={lang} /> : (
        <>
          <header className="flex h-15 items-center px-4"><h1 className="kd-d3">{T.ticketsTitle}</h1></header>
          <SignInCard lang={lang} note={T.gateTickets} />
        </>
      )}
    </>
  );
}

function Wallet({ lang }: { lang: Lang }) {
  const T = pick(APP, lang);
  const [w, setW] = useState<Wallet | null>(null);
  const [which, setWhich] = useState<'up' | 'past'>('up');
  const [offline, setOffline] = useState(false);
  // Upcoming or past is by the server's clock, so the list waits for it.
  const { clockReady } = useKd();
  const load = useCallback(async () => {
    const out = await FF.maybe(FF.get('/me/tickets'), null);
    if (out) setW(out);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const on = () => setOffline(!navigator.onLine);
    on();
    addEventListener('online', on); addEventListener('offline', on);
    return () => { removeEventListener('online', on); removeEventListener('offline', on); };
  }, []);
  const now = FF.now().getTime();
  const ended = (o: Order) => !!o.event.endsAt && Date.parse(o.event.endsAt) < now;
  const orders = (w?.items ?? []).filter((o) => o.status === 'paid' && o.tickets.length && (which === 'past' ? ended(o) : !ended(o)));

  return (
    <div className="flex flex-col gap-4 pb-4">
      <header className="flex h-15 items-center justify-between px-4">
        <h1 className="kd-d3">{T.ticketsTitle}</h1>
        <Segmented label={T.ticketsFilter} value={which} onChange={setWhich} options={[{ value: 'up', label: T.upcoming }, { value: 'past', label: T.past }]} />
      </header>
      {w === null || !clockReady ? <div className="kd-skel mx-4 h-96" aria-hidden="true" /> : orders.length ? (
        orders.map((o) => <OrderCard key={o.id} lang={lang} o={o} offline={offline} payee={w.payee} onChanged={load} />)
      ) : (
        <Panel role="status" className="mx-4 flex flex-col items-start gap-2 px-5 py-7">
          <span className="kd-h">{T.ticketsEmpty}</span>
          <span className="kd-s">{T.ticketsEmptyBody}</span>
          <a className={buttonClass({ size: 'sm' }, 'mt-1')} href="/app">{T.tabExplore}</a>
        </Panel>
      )}
      {which === 'up' && w?.resold.length ? (
        <section aria-labelledby="resold-h" className="flex flex-col px-4 pt-2">
          <h2 id="resold-h" className="kd-m pb-1.5">{T.resold}</h2>
          {w.resold.map((r) => (
            <div key={r.id} className="kd-lrow">
              <span className="flex min-w-0 flex-1 flex-col"><span className="kd-hs kd-ell">{r.event.title}</span>
                <span className="kd-s">{r.paidOutAt ? T.resoldPaid : r.payoutDueAt ? fill(T.resoldDue, { d: new Date(r.payoutDueAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB') }) : ''}</span></span>
              <span className="kd-mb kd-num">{money(r.price, 'VND', lang)}</span>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}

/** "Mở cửa sau 04:12:40" under a day out, "sau 5 ngày" before; by the API's clock. */
function useDoors(o: Order, lang: Lang) {
  const T = pick(APP, lang);
  const { clockReady } = useKd();
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (!clockReady || !o.event.startsAt) return;
    const tick = () => {
      const left = Date.parse(o.event.startsAt!) - FF.now().getTime();
      if (o.event.endsAt && FF.now().getTime() > Date.parse(o.event.endsAt)) return setText(null);
      if (left <= 0) return setText(T.doorsOpen);
      if (left > 86_400_000) return setText(fill(T.doorsDays, { n: Math.floor(left / 86_400_000) }));
      const s = Math.floor(left / 1000);
      const pad = (n: number) => String(n).padStart(2, '0');
      setText(fill(T.doorsIn, { t: `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}` }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [o.event.startsAt, o.event.endsAt, clockReady, T.doorsOpen, T.doorsDays, T.doorsIn]);
  return text;
}

function OrderCard({ lang, o, offline, payee, onChanged }: { lang: Lang; o: Order; offline: boolean; payee: Wallet['payee']; onChanged: () => void }) {
  const T = pick(APP, lang);
  const [i, setI] = useState(0);
  const [move, setMove] = useState<'give' | 'sell' | null>(null);
  const kd = useKd();
  const t = o.tickets[Math.min(i, o.tickets.length - 1)];
  const fam = familyOf(o.event.genre);
  const doors = useDoors(o, lang);
  const live = doors === T.doorsOpen;
  const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(o.event.lat != null && o.event.lng != null ? `${o.event.lat},${o.event.lng}` : [o.event.venueName, o.event.area].filter(Boolean).join(', '));
  const used = t.status === 'used' || !!t.checkedInAt;
  const unlist = async () => {
    try { await FF.del('/me/tickets/' + t.id + '/listing'); onChanged(); } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };

  return (
    <div className="flex flex-col gap-2 px-4 desk:max-w-[480px]">
      <article className={cx('kd-bonecard overflow-hidden', g(fam))} aria-label={o.event.title}>
        <Art family={fam} className="relative h-33 rounded-none">
          {doors ? <span className="kd-tag kd-tag-glass kd-num absolute bottom-3 left-3 h-7 text-paper"><span className="h-2 w-2 rounded-full bg-acc" aria-hidden="true" />{doors}</span> : null}
        </Art>
        <div className="flex flex-col gap-1.5 px-4.5 pt-4">
          <span className="kd-m flex items-center gap-1.5"><span className="kd-mk" aria-hidden="true" />{FAMILY_LABEL[fam][lang]} · {fill(T.ticketN, { i: i + 1, n: o.tickets.length })}</span>
          <h2 className="kd-d3">{o.event.title}</h2>
          <span className="kd-s kd-num">{whenShort(o.event, lang)}{o.event.venueName ? ' · ' + o.event.venueName : ''}{o.event.area ? ' · ' + o.event.area : ''}</span>
        </div>
        <div className="relative mt-2.5 h-6" aria-hidden="true">
          <span className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-void" />
          <span className="absolute -right-3 top-0 h-6 w-6 rounded-full bg-void" />
          <span className="absolute inset-x-4.5 top-3 border-t-[1.5px] border-dashed border-[#c4c4c4]" />
        </div>
        <div className="grid grid-cols-3 gap-3 px-4.5 pt-1.5">
          <div className="flex flex-col gap-0.5"><span className="kd-m">{T.tier}</span><span className="kd-h">{o.tier.name[lang]}</span></div>
          <div className="flex flex-col gap-0.5"><span className="kd-m">{T.doors}</span><span className="kd-h kd-num">{o.event.startTime ?? '—'}</span></div>
          <div className="flex flex-col gap-0.5"><span className="kd-m">{T.code}</span><span className="kd-h kd-num">{o.code}</span></div>
        </div>
        <div className={cx('flex justify-center pt-4', used && 'opacity-30')}>
          <QrCode value={t.qr} size={184} label={fill(T.qrLabel, { c: t.code })} />
        </div>
        <div className="kd-num pt-2.5 text-center font-mono text-[15px] font-medium tracking-[0.12em] text-[#101010]">{t.code}</div>
        <div className="flex items-center justify-between py-1.5 pl-4.5 pr-2">
          <span className="kd-s">
            {used ? T.checkedIn : t.listing ? fill(T.listed, { p: money(t.listing.price, 'VND', lang) }) : o.received ? T.received : offline ? T.offlineNow : T.offlineReady}
          </span>
          {o.tickets.length > 1 ? (
            <span className="flex items-center">
              {o.tickets.map((x, k) => (
                <button key={x.id} type="button" aria-label={fill(T.showTicket, { i: k + 1 })} aria-pressed={k === i} onClick={() => setI(k)} className="flex h-11 w-8 items-center justify-center">
                  <span className={cx('block h-2 rounded-full transition-all', k === i ? 'w-5 bg-[#101010]' : 'w-2 bg-[#101010]/30')} />
                </button>
              ))}
            </span>
          ) : null}
        </div>
      </article>

      <div className="grid grid-cols-2 gap-2">
        <a className={buttonClass({})} href={`/events/${o.event.id}/calendar.ics`} download><CalendarBlankIcon size={18} aria-hidden="true" />{pick({ c: { vi: 'Thêm vào lịch', en: 'Add to calendar' } }, lang).c}</a>
        <a className={buttonClass({})} href={maps} target="_blank" rel="noopener"><NavigationArrowIcon size={18} aria-hidden="true" />{T.directions}</a>
      </div>
      {live ? <a className={buttonClass({ tone: 'acc', block: true })} href={'/app/live/' + o.event.slug}><BroadcastIcon size={18} aria-hidden="true" />{T.liveMode}</a> : null}
      {t.transferable && !used ? (
        <div className="flex gap-2">
          {t.listing ? (
            <Button size="sm" onClick={unlist}>{T.unlist}</Button>
          ) : (
            <>
              <Button size="sm" tone="ghost" onClick={() => setMove('give')}>{T.give}</Button>
              <Button size="sm" tone="ghost" onClick={() => setMove('sell')}>{T.resell}</Button>
            </>
          )}
        </div>
      ) : null}
      {move ? <MoveSheet lang={lang} mode={move} t={t} payee={payee} onClose={() => setMove(null)} onDone={() => { setMove(null); onChanged(); }} /> : null}
    </div>
  );
}

/** Give a ticket to a phone number, or put it up for resale at no more than face value. */
function MoveSheet({ lang, mode, t, payee, onClose, onDone }: { lang: Lang; mode: 'give' | 'sell'; t: Ticket; payee: Wallet['payee']; onClose: () => void; onDone: () => void }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [phone, setPhone] = useState('');
  const [price, setPrice] = useState(String(t.faceValue));
  const [bank, setBank] = useState('970436');
  const [acc, setAcc] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const cap = useMemo(() => fill(T.cap, { p: money(t.faceValue, 'VND', lang) }), [T.cap, t.faceValue, lang]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const out = mode === 'give'
        ? await FF.post('/me/tickets/' + t.id + '/transfer', { phone: phone.trim() })
        : await FF.post('/me/tickets/' + t.id + '/listing', {
          price: Number(price.replace(/\D/g, '')),
          ...(payee ? {} : { payee: { bankBin: bank, accountNo: acc.trim(), accountName: name.trim() } }),
        });
      kd.toast(FF.text(out.message, lang) || T.sendGift);
      onDone();
    } catch (x) { setErr(FF.errorText(x, lang)); setBusy(false); }
  };
  return (
    <Sheet title={mode === 'give' ? T.giveTitle : T.sellTitle} closeLabel={T.close} onClose={onClose}>
      <form className="flex flex-col gap-3 pt-1" onSubmit={submit}>
        {mode === 'give' ? (
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="kd-give-phone">{T.phone}</FieldLabel>
            <Input id="kd-give-phone" type="tel" inputMode="tel" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="kd-sell-price">{T.price}</FieldLabel>
              <Input id="kd-sell-price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} required />
              <span className="kd-s">{cap}</span>
            </div>
            {payee ? <Status tone="ok">{fill(T.payee, { b: [payee.bankName, payee.accountMasked].filter(Boolean).join(' ') })}</Status> : (
              <>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor="kd-sell-bank">{T.bank}</FieldLabel>
                  <Select id="kd-sell-bank" value={bank} onChange={(e) => setBank(e.target.value)}>
                    {BANKS.map(([bin, label]) => <option key={bin} value={bin}>{label}</option>)}
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor="kd-sell-acc">{T.account}</FieldLabel>
                  <Input id="kd-sell-acc" inputMode="numeric" value={acc} onChange={(e) => setAcc(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor="kd-sell-name">{T.accountName}</FieldLabel>
                  <Input id="kd-sell-name" value={name} onChange={(e) => setName(e.target.value)} autoCapitalize="characters" required />
                </div>
              </>
            )}
          </>
        )}
        {err ? <FieldError>{err}</FieldError> : null}
        <Button type="submit" tone="acc" block disabled={busy}>{mode === 'give' ? T.sendGift : T.sendSell}</Button>
      </form>
    </Sheet>
  );
}
