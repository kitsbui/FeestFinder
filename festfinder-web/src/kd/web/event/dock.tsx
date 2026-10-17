'use client';
/**
 * "Mua vé" within reach on a phone (design v2 phase 2): a bar above the tab bar with the lowest
 * price and the way to the tickets. It steps aside while the ticket panel is on screen, so the
 * page never shows two primary buttons at once. Not on a computer: the panel stays beside the page.
 */
import { useEffect, useState } from 'react';
import { pick, type Lang } from '../../copy';
import { buttonClass } from '../../ui/actions';
import { WEB } from '../copy';

export function BuyDock({ lang, price }: { lang: Lang; price: string | null }) {
  const T = pick(WEB, lang);
  const [away, setAway] = useState(false);
  useEffect(() => {
    const panel = document.getElementById('tickets');
    if (!panel) return;
    const io = new IntersectionObserver(([e]) => setAway(e.isIntersecting), { threshold: 0.1 });
    io.observe(panel);
    return () => io.disconnect();
  }, []);
  return (
    <div className="kd-buy-dock desk:hidden" data-away={away || undefined} aria-hidden={away || undefined}>
      {price ? (
        <span className="flex min-w-0 flex-col">
          <span className="kd-m">{T.dockFrom}</span>
          <span className="kd-h kd-num kd-ell">{price}</span>
        </span>
      ) : null}
      <a href="#tickets" tabIndex={away ? -1 : undefined} className={buttonClass({ tone: 'acc', size: 'lg', glow: true }, 'flex-1')}>{T.buyTickets}</a>
    </div>
  );
}
