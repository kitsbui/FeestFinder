'use client';
/**
 * /studio/promos: the chosen event's promo codes (each with its uses against its cap, on or
 * off) and a new one; and its guest list (seats, checked in or not) with a new guest.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { TrashIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Pair } from '../copy';
import { count, money } from '../format';
import { useKd } from '../runtime';
import { Button, IconButton } from '../ui/actions';
import { FieldLabel, Input, Switch } from '../ui/forms';
import { BarTrack, Status } from '../ui/parts';
import { STUDIO } from './copy';
import { StudioHead } from './head';
import { Block, CHECKOUT, NeedEvent, Page } from './parts';
import { useStudio } from './root';

interface Promo { id: string; code: string; pct: number; used: number; cap: number; active: boolean; nearlyUsedUp: boolean; value: Pair; note: Pair | null }
interface Guest { id: string; name: string; seats: number; checkedIn: boolean; note: Pair | null }

export function Promos() {
  const { lang, event } = useStudio();
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const [promos, setPromos] = useState<{ items: Promo[]; stats: { redemptions: number; discountGiven: number } } | null>(null);
  const [guests, setGuests] = useState<{ items: Guest[]; countLine: Pair } | null>(null);
  const [code, setCode] = useState({ code: '', pct: '', cap: '' });
  const [guest, setGuest] = useState({ name: '', seats: '1' });
  const base = event ? `/organizer/events/${event.id}` : null;

  const load = useCallback(async () => {
    if (!base) return;
    const [p, g] = await Promise.all([FF.maybe(FF.get(base + '/promos'), null), FF.maybe(FF.get(base + '/guests'), null)]);
    setPromos(p); setGuests(g);
  }, [base]);
  useEffect(() => { load(); }, [load]);

  const act = async (run: () => Promise<{ message?: Pair } | undefined>, after?: () => void) => {
    try { const out = await run(); if (out?.message) kd.toast(FF.text(out.message, lang)); after?.(); load(); } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  const addCode = (e: FormEvent) => {
    e.preventDefault();
    act(() => FF.post(base + '/promos', { code: code.code, pct: Number(code.pct), cap: Number(code.cap) || 500 }), () => setCode({ code: '', pct: '', cap: '' }));
  };
  const addGuest = (e: FormEvent) => {
    e.preventDefault();
    act(() => FF.post(base + '/guests', { name: guest.name, seats: Number(guest.seats) || 1 }), () => setGuest({ name: '', seats: '1' }));
  };

  return (
    <Page>
      <StudioHead label={T.promos} />
      {!event ? <NeedEvent /> : (
        <div className="kd-split gap-3">
          <Block
            className="kd-main"
            title={T.promoCodes}
            aside={promos ? <span className="kd-m kd-num">{fill(T.promoStats, { r: count(promos.stats.redemptions, lang), d: money(promos.stats.discountGiven, CHECKOUT, lang) })}</span> : null}
          >
            {promos === null ? <div className="kd-skel h-24" aria-hidden="true" /> : (
              <>
                {promos.items.length ? (
                  <ul className="flex flex-col">
                    {promos.items.map((p) => (
                      <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-line py-3 first:pt-0">
                        <span className="flex min-w-0 items-baseline gap-2.5">
                          <span className="kd-mb kd-num font-mono text-paper">{p.code}</span>
                          <span className="kd-s kd-num">{p.value[lang]}</span>
                          {p.nearlyUsedUp ? <Status tone="warn">{T.promoNearly}</Status> : null}
                        </span>
                        <Switch checked={p.active} label={fill(T.promoOn, { c: p.code })} onChange={(v) => act(() => FF.patch(`${base}/promos/${p.id}`, { active: v }))} />
                        <div className="col-span-2 flex items-center gap-3">
                          <BarTrack className="flex-1" value={p.used} max={p.cap} label={fill(T.promoUsed, { u: p.used, c: p.cap })} />
                          <span className="kd-m kd-num shrink-0">{fill(T.promoUsed, { u: count(p.used, lang), c: count(p.cap, lang) })}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : <span className="kd-s">{T.promoNone}</span>}
                <form className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] items-end gap-3 border-t border-line pt-4" onSubmit={addCode} aria-label={T.promoNew}>
                  <div className="flex flex-col gap-2"><FieldLabel htmlFor="pCode">{T.promoCode}</FieldLabel><Input id="pCode" required minLength={3} maxLength={24} className="font-mono uppercase" value={code.code} onChange={(e) => setCode({ ...code, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} /></div>
                  <div className="flex flex-col gap-2"><FieldLabel htmlFor="pPct">{T.promoPct}</FieldLabel><Input id="pPct" required inputMode="numeric" className="kd-num" value={code.pct} onChange={(e) => setCode({ ...code, pct: e.target.value.replace(/\D/g, '').slice(0, 3) })} /></div>
                  <div className="flex flex-col gap-2"><FieldLabel htmlFor="pCap">{T.promoCap}</FieldLabel><Input id="pCap" inputMode="numeric" className="kd-num" placeholder="500" value={code.cap} onChange={(e) => setCode({ ...code, cap: e.target.value.replace(/\D/g, '') })} /></div>
                  <Button tone="acc" type="submit">{T.promoCreate}</Button>
                </form>
              </>
            )}
          </Block>
          <Block className="kd-side self-start" title={T.guests} aside={guests ? <span className="kd-m kd-num">{guests.countLine[lang]}</span> : null}>
            {guests === null ? <div className="kd-skel h-24" aria-hidden="true" /> : (
              <>
                {guests.items.length ? (
                  <ul className="flex flex-col">
                    {guests.items.map((g) => (
                      <li key={g.id} className="flex min-h-13 items-center gap-3 border-b border-line">
                        <span className="flex min-w-0 flex-1 flex-col"><span className="kd-hs kd-ell">{g.name}</span><span className="kd-s kd-num">{fill(T.guestSeats + ': {n}', { n: g.seats })}</span></span>
                        <Switch checked={g.checkedIn} label={fill(T.guestIn, { n: g.name })} onChange={(v) => act(() => FF.patch(`${base}/guests/${g.id}`, { checkedIn: v }))} />
                        <IconButton size="sm" label={fill(T.guestRemove, { n: g.name })} onClick={() => act(() => FF.del(`${base}/guests/${g.id}`))}><TrashIcon size={16} aria-hidden="true" /></IconButton>
                      </li>
                    ))}
                  </ul>
                ) : <span className="kd-s">{T.guestNone}</span>}
                <form className="flex flex-wrap items-end gap-3" onSubmit={addGuest} aria-label={T.guestAdd}>
                  <div className="flex min-w-[140px] flex-1 flex-col gap-2"><FieldLabel htmlFor="gName">{T.guestName}</FieldLabel><Input id="gName" required maxLength={80} value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} /></div>
                  <div className="flex w-20 flex-col gap-2"><FieldLabel htmlFor="gSeats">{T.guestSeats}</FieldLabel><Input id="gSeats" inputMode="numeric" className="kd-num" value={guest.seats} onChange={(e) => setGuest({ ...guest, seats: e.target.value.replace(/\D/g, '').slice(0, 2) })} /></div>
                  <Button type="submit">{T.guestAdd}</Button>
                </form>
              </>
            )}
          </Block>
        </div>
      )}
    </Page>
  );
}
