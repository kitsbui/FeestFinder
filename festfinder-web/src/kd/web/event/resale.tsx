'use client';
/** Tickets people pass on (design v2 phase 14: loaded after the page, it asks the API anyway). */
import { useEffect, useState } from 'react';
import { BellIcon, BellRingingIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, tx } from '../../copy';
import { money } from '../../format';
import { useKd } from '../../runtime';
import { buttonClass, Button } from '../../ui/actions';
import { Accordion } from '../../ui/parts';
import type { Resale, Tier } from '../../types';
import { WEB } from '../copy';
import { useEvent } from './context';

/** FeestFinder's checkout sells at most this many per order (routes/commerce.ts). */
const MAX_PER_ORDER = 6;

const open = (t: Tier) => t.state === 'onsale' || t.state === 'last';

/** "Vé thường" → "thường" after "Mua 2 vé", so the word is not said twice. */
const tierShort = (name: string) => name.replace(/^(vé|ticket)\s+/i, '');

/** Tickets people pass on, at most face value: buy one, or be told when one comes up. */
export function ResaleBlock({ lang }: { lang: Lang }) {
  const { ev, personal } = useEvent();
  const kd = useKd();
  const T = pick(WEB, lang);
  const [r, setR] = useState<Resale | null>(null);
  const load = () => FF.maybe(FF.get('/events/' + ev.id + '/resale'), null).then((x: Resale | null) => setR(x));
  useEffect(() => { if (ev.resale?.enabled || ev.resale?.count) load();   }, [ev.id, kd.user]);
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
    <Accordion small summary={T.resale} aside={r ? r.count : ev.resale?.count ?? 0} className="border-t border-line-1">
      <div className="flex flex-col gap-2">
        <span className="kd-m">{T.resaleCap}</span>
        {r && r.items.length ? r.items.map((it) => (
          <div key={it.id} className="kd-lrow">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="kd-hs kd-ell">{tx(it.tier, lang) ?? 'GA'} · {it.seller.name}</span>
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
