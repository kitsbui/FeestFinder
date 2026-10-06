'use client';
/**
 * Tickets: the tiers with their state, the quantity, and the one lime "Mua n vé · total".
 * Every ticket button goes through /go/<event> (routes/outbound.ts), which counts the click
 * and opens FeestFinder's checkout or the seller. Below it: refunds and resale.
 */
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRightIcon, BellIcon, BellRingingIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { money } from '../../format';
import { useKd } from '../../runtime';
import { buttonClass, Button } from '../../ui/actions';
import { Option, Stepper } from '../../ui/forms';
import { Accordion, Status, type StatusTone } from '../../ui/parts';
import type { Resale, Tier } from '../../types';
import { WEB } from '../copy';
import { useEvent } from './context';

/** FeestFinder's checkout sells at most this many per order (routes/commerce.ts). */
const MAX_PER_ORDER = 6;

const open = (t: Tier) => t.state === 'onsale' || t.state === 'last';

/** "Vé thường" → "thường" after "Mua 2 vé", so the word is not said twice. */
const tierShort = (name: string) => name.replace(/^(vé|ticket)\s+/i, '');

export function tierStatus(t: Tier, lang: Lang): { tone: StatusTone; text: string } {
  const T = pick(WEB, lang);
  if (t.state === 'soldout' || t.state === 'closed') return { tone: 'none', text: T.tierSoldOut };
  if (t.state === 'soon') return { tone: 'none', text: T.tierSoon };
  if (t.state === 'last' || (t.left != null && t.left > 0 && t.left <= 50)) return { tone: 'warn', text: t.left != null && t.left <= 50 ? fill(T.tierLeft, { n: t.left }) : T.tierLast };
  return { tone: 'ok', text: T.tierOnSale };
}

export function TicketsPanel({ lang }: { lang: Lang }) {
  const { ev } = useEvent();
  const kd = useKd();
  const T = pick(WEB, lang);
  const tiers = useMemo(() => ev.tickets?.tiers ?? [], [ev.tickets]);
  const firstOpen = tiers.find(open) ?? null;
  const [tierId, setTierId] = useState<string | null>(firstOpen?.id ?? null);
  const [qty, setQty] = useState(1);
  const [watched, setWatched] = useState<Record<string, boolean>>({});
  // The browser's fresh copy may carry other tiers than the cached page did.
  useEffect(() => {
    if (!tiers.some((t) => t.id === tierId)) setTierId(tiers.find(open)?.id ?? null);
  }, [tiers, tierId]);
  const tier = tiers.find((t) => t.id === tierId) ?? null;
  const max = Math.max(1, Math.min(MAX_PER_ORDER, tier?.left ?? MAX_PER_ORDER));
  useEffect(() => { if (qty > max) setQty(max); }, [max, qty]);

  const ticketHost = ev.links.tickets ? ev.links.tickets.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : null;
  const sellsHere = tiers.some(open);
  const anyOpen = !!firstOpen;
  const panelStatus = tiers.length
    ? (anyOpen ? tierStatus(firstOpen!, lang) : { tone: 'none' as StatusTone, text: tiers.every((t) => t.state === 'soon') ? T.tierSoon : T.tierSoldOut })
    : null;

  const buyHref = (() => {
    if (ev.past) return null;
    if (tier && open(tier)) return `/go/${encodeURIComponent(ev.slug)}?src=tier&tier=${tier.id}${qty > 1 ? '&qty=' + qty : ''}`;
    if (!anyOpen && ev.links.go) return `/go/${encodeURIComponent(ev.slug)}?src=detail`;
    return null;
  })();

  const watch = async (t: Tier) => {
    if (!kd.requireSignIn(undefined, T.tierNotify)) return;
    try {
      const out = await FF.put('/events/' + ev.id + '/tiers/' + t.id + '/watch');
      setWatched((w) => ({ ...w, [t.id]: true }));
      kd.toast(FF.text(out.message, lang));
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };

  if (ev.isFree) {
    return (
      <div id="tickets" className="kd-card flex scroll-mt-32 flex-col gap-3 p-4">
        <div className="flex items-center justify-between"><h2 className="kd-h">{T.tickets}</h2><span className="kd-tag kd-tag-acc">{T.free}</span></div>
        <p className="kd-s">{T.freeNote}</p>
        <a className={buttonClass({ tone: 'acc', size: 'lg', block: true })} href="#venue">{T.directions}</a>
      </div>
    );
  }

  return (
    <div id="tickets" className="kd-card flex scroll-mt-32 flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="kd-h">{T.tickets}</h2>
        {panelStatus ? <Status tone={panelStatus.tone}>{panelStatus.text}</Status> : null}
      </div>
      {tiers.length ? (
        <div role="radiogroup" aria-label={T.ticketTiers} className="flex flex-col gap-1.5">
          {tiers.map((t) => {
            const st = tierStatus(t, lang);
            const can = open(t);
            return (
              <div key={t.id} className="flex flex-col gap-1">
                <Option
                  checked={t.id === tierId}
                  disabled={!can}
                  onSelect={() => setTierId(t.id)}
                  title={t.name[lang]}
                  price={money(t.price, ev.currency, lang)}
                  note={t.note?.[lang]}
                  status={<Status tone={st.tone}>{st.text}</Status>}
                />
                {t.state === 'soon' ? (
                  <button type="button" className="kd-more self-end" disabled={watched[t.id]} onClick={() => watch(t)}>
                    {watched[t.id] ? <BellRingingIcon size={14} aria-hidden="true" /> : <BellIcon size={14} aria-hidden="true" />}
                    {T.tierNotify}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
      {ev.tickets?.urgency ? <p className="kd-s text-warn">{ev.tickets.urgency[lang]}</p> : null}
      {tier && open(tier) ? (
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="kd-s">{T.quantity}</span>
          <Stepper value={qty} max={max} onChange={setQty} label={T.qtyLabel} decLabel={T.qtyDec} incLabel={T.qtyInc} />
        </div>
      ) : null}
      {ev.past ? (
        <p className="kd-s">{T.eventEnded}</p>
      ) : buyHref ? (
        <a
          className={buttonClass({ tone: 'acc', size: 'lg', block: true })}
          href={buyHref}
          onClick={() => FF.track('ticket_click', { slug: ev.slug, source: tier ? 'tier' : 'detail' })}
        >
          {tier && open(tier)
            ? fill(T.buyN, { n: qty, t: tierShort(tier.name[lang]), p: money(tier.price * qty, ev.currency, lang) })
            : T.buyTickets}
          <ArrowUpRightIcon size={16} aria-hidden="true" />
        </a>
      ) : (
        <p className="kd-s">{T.noTicketLink}</p>
      )}
      <p className="kd-s">
        {sellsHere ? fill(T.soldHere, { n: MAX_PER_ORDER }) : ticketHost ? fill(T.soldVia, { h: ticketHost, n: MAX_PER_ORDER }) : ev.ticketNote[lang]}
      </p>
      {ev.tickets?.refundPolicy ? (
        <Accordion small summary={T.refund} className="border-t border-line">
          <p className="kd-s">{ev.tickets.refundPolicy[lang]}</p>
        </Accordion>
      ) : null}
      <ResaleBlock lang={lang} />
    </div>
  );
}

/** Tickets people pass on, at most face value: buy one, or be told when one comes up. */
function ResaleBlock({ lang }: { lang: Lang }) {
  const { ev, personal } = useEvent();
  const kd = useKd();
  const T = pick(WEB, lang);
  const [r, setR] = useState<Resale | null>(null);
  const load = () => FF.maybe(FF.get('/events/' + ev.id + '/resale'), null).then((x: Resale | null) => setR(x));
  useEffect(() => { if (ev.resale?.enabled || ev.resale?.count) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [ev.id, kd.user]);
  if (!(ev.resale?.enabled || r?.count)) return null;
  const toggleWatch = async () => {
    if (!kd.requireSignIn(undefined, T.resaleWatch)) return;
    const on = !r?.watching;
    try {
      const out = await (on ? FF.put : FF.del)('/events/' + ev.id + '/resale/watch');
      kd.toast(FF.text(out.message, lang));
      load();
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  return (
    <Accordion small summary={T.resale} aside={r ? r.count : ev.resale?.count ?? 0} className="border-t border-line">
      <div className="flex flex-col gap-2">
        <span className="kd-m">{T.resaleCap} · {fill(T.resaleFee, { p: ev.resale?.feePct ?? 5 })}</span>
        {r && r.items.length ? r.items.map((it) => (
          <div key={it.id} className="kd-lrow">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="kd-hs kd-ell">{it.tier?.[lang] ?? 'GA'} · {it.seller.name}</span>
              <span className="kd-s">{fill(T.resaleFace, { p: money(it.faceValue, ev.currency, lang) })}</span>
            </span>
            <span className="kd-mb kd-num">{money(it.price, ev.currency, lang)}</span>
            {it.mine ? <span className="kd-tag">{T.resaleMine}</span> : (
              <Button size="sm" onClick={() => {
                if (!kd.requireSignIn(undefined, T.resaleBuy)) return;
                location.assign('/app/checkout/' + encodeURIComponent(ev.slug) + '?listing=' + it.id);
              }}>{T.resaleBuy}</Button>
            )}
          </div>
        )) : <span className="kd-s">{T.resaleNone}</span>}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" tone="ghost" aria-pressed={!!r?.watching} onClick={toggleWatch}>
            {r?.watching ? <BellRingingIcon size={14} aria-hidden="true" /> : <BellIcon size={14} aria-hidden="true" />}
            {r?.watching ? T.resaleWatching : T.resaleWatch}
          </Button>
          {personal?.mine?.validTickets ? <a className={buttonClass({ size: 'sm', tone: 'ghost' })} href="/app/tickets">{T.resaleSell}</a> : null}
        </div>
      </div>
    </Accordion>
  );
}
