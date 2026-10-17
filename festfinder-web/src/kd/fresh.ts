/**
 * After a save, the public pages it changed render again at once (app/kd-fresh/route.ts): the
 * page cache (revalidate: 60) would otherwise show the owner their old cover for a minute or more.
 * Called from the screens that edit an event, an artist, an organiser or a project; it never
 * fails a save.
 */
import type { FreshKind } from './fresh-paths';

export function freshen(kind: FreshKind, slug: string): Promise<void> {
  return fetch('/kd-fresh', {
    method: 'POST', credentials: 'same-origin', keepalive: true,
    headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind, slug }),
  }).then(() => undefined, () => undefined);
}
