/** An event's price line ("Miễn phí", "Chưa rõ giá", "Từ 300.000 ₫"): a module of its own, so the Studio's forms show it without the card (web/card.tsx). */
import { fill, pick, type Lang } from '../copy';
import { money } from '../format';
import type { Card } from '../types';
import { WEB } from './copy';

export function priceLine(e: Pick<Card, 'isFree' | 'priceFrom' | 'currency' | 'entryMode' | 'priceUnknown'>, lang: Lang): string {
  const T = pick(WEB, lang);
  if (e.isFree || e.entryMode === 'free') return T.free;
  // Sold at a price nobody gave yet: never "free" (design v2 phase 11).
  if (e.priceUnknown) return T.priceUnknown;
  return fill(T.fromPrice, { p: money(e.priceFrom, e.currency, lang) });
}
