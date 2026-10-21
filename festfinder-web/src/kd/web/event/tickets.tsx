'use client';
/**
 * Tickets: the price and the one primary "Mua vé" (the accent gradient, glowing). FeestFinder sells
 * no tickets (owner, 2026-10-20): the button goes through /go/<event> (routes/outbound.ts), which
 * counts the click and sends the person to the seller with the partner's tracking when there is one.
 */
import { useEffect, useState } from 'react';
import { ArrowUpRightIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, tx } from '../../copy';
import { money } from '../../format';
import { buttonClass } from '../../ui/actions';
import { Status } from '../../ui/parts';
import { WEB } from '../copy';
import { useEvent } from './context';
import { refFor } from './referral';

export function TicketsPanel({ lang }: { lang: Lang }) {
  const { ev } = useEvent();
  const T = pick(WEB, lang);
  // The sharer who brought this visitor rides along to /go once the page runs (the server render has none).
  const [ref, setRef] = useState<string | null>(null);
  useEffect(() => { setRef(refFor(ev.id)); }, [ev.id]);
  const ticketHost = ev.links.tickets ? ev.links.tickets.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : null;

  if (ev.isFree) {
    return (
      <div id="tickets" className="kd-card flex scroll-mt-32 flex-col gap-3 p-4">
        <div className="flex items-center justify-between"><h2 className="kd-h">{T.tickets}</h2><span className="kd-tag kd-tag-acc">{T.free}</span></div>
        {/* No ticket to buy: the way there is in the facts and under the venue, once each (design v2 phase 11). */}
        <p className="kd-s">{T.freeNote}</p>
      </div>
    );
  }

  const price = ev.priceUnknown || !ev.priceFrom ? T.priceUnknown : fill(T.fromPrice, { p: money(ev.priceFrom, ev.currency, lang) });
  return (
    // One row from 760px (the page is one column, design v2, owner 2026-10-20): what it costs, then the button.
    <div id="tickets" className="kd-card flex scroll-mt-32 flex-col gap-3 p-4 tab:flex-row tab:items-center tab:gap-6 tab:p-5">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <h2 className="kd-h">{T.tickets}</h2>
          {ev.soldOut ? <Status tone="none">{T.tierSoldOut}</Status> : null}
        </div>
        <p className="kd-mb kd-num">{price}</p>
        <p className="kd-s">{ticketHost ? fill(T.soldVia, { h: ticketHost }) : tx(ev.ticketNote, lang)}</p>
      </div>
      {ev.past ? (
        <p className="kd-s">{T.eventEnded}</p>
      ) : ev.links.go ? (
        <a
          className={buttonClass({ tone: 'acc', size: 'lg', block: true, glow: true }, 'tab:w-auto tab:shrink-0')}
          href={`/go/${encodeURIComponent(ev.slug)}?src=detail${ref ? '&ref=' + ref : ''}`}
          onClick={() => FF.track('ticket_click', { slug: ev.slug, source: 'detail' })}
        >
          {T.buyTickets}
          <ArrowUpRightIcon size={16} aria-hidden="true" />
        </a>
      ) : (
        <p className="kd-s">{T.noTicketLink}</p>
      )}
    </div>
  );
}
