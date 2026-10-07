/**
 * The rate card, read on the server: the CPM rates the team sets in the Console (ad_settings),
 * from GET /ads/rates. Null when the API does not answer: the rate card then hides, rather than
 * showing prices nobody set.
 */
import { apiOr } from '@/lib/api';
import { AD_CURRENCY, type RateCard } from './model';

export async function loadRates(): Promise<RateCard | null> {
  const out = await apiOr<Partial<RateCard> | null>('/ads/rates', null, { revalidate: 300 });
  const r = out?.rates;
  if (!r || ![r.feed, r.banner, r.live].every((n) => typeof n === 'number' && n > 0)) return null;
  return { rates: r, currency: out.currency || AD_CURRENCY };
}
