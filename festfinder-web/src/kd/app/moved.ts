import { permanentRedirect } from 'next/navigation';

/**
 * An app address that moved into the site (design v2 phase 4, owner 2026-10-17: one surface to
 * discover on, one frame): a permanent redirect to its new place that keeps every query the old
 * address carried (filters, ?ride=1, ?mix=…), after the ones the new address names itself.
 */
export async function moved(to: string, searchParams: Promise<Record<string, string | string[] | undefined>>): Promise<never> {
  const [path, own] = to.split('?');
  const q = new URLSearchParams(own ?? '');
  for (const [k, v] of Object.entries(await searchParams)) {
    for (const x of [v].flat()) if (x != null && !q.has(k)) q.append(k, x);
  }
  permanentRedirect(path + (q.size ? '?' + q : ''));
}
