'use client';
/**
 * The live layer of an event page. The server renders the event as anyone sees it, cached for
 * a minute; in the browser the page asks the API once more, so ticket states, counts and ids
 * are current, and, for someone signed in, what is theirs (following, plan picks, whether
 * they reported it, their tickets). Every interactive part reads it from here.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { FF } from '@/runtime/ff';
import { useKd } from '../../runtime';
import type { EventDetail } from '../../types';

interface EventClient {
  /** The freshest copy: the browser's once it has arrived, the server's until then. */
  ev: EventDetail;
  /** The copy as the signed-in viewer sees it; null when signed out or not loaded yet. */
  personal: EventDetail | null;
  reload: () => Promise<void>;
}

const Ctx = createContext<EventClient | null>(null);

export function useEvent(): EventClient {
  const v = useContext(Ctx);
  if (!v) throw new Error('useEvent outside EventClientProvider');
  return v;
}

export function EventClientProvider({ ev: served, children }: { ev: EventDetail; children: ReactNode }) {
  const kd = useKd();
  const [ev, setEv] = useState<EventDetail>(served);
  const [personal, setPersonal] = useState<EventDetail | null>(null);
  const signedIn = kd.session === undefined ? undefined : !!kd.user;

  const tracked = useRef(false);
  const reload = useCallback(async () => {
    const d: EventDetail | null = await FF.maybe(FF.get('/events/' + encodeURIComponent(served.slug)), null);
    if (!d) return;
    setEv(d);
    setPersonal(d.me ? d : null);
    // Count the view once (by the event's id as it is now), crediting whoever shared the link.
    if (!tracked.current) {
      tracked.current = true;
      const q = new URLSearchParams(location.search);
      const ref = q.get('ref');
      FF.fire(FF.post('/events/' + d.id + '/track', ref
        ? { type: 'view', source: 'shared', ref, channel: q.get('ch') || 'copy' }
        : { type: 'view', source: 'feed' }));
      FF.track('event_view', { slug: d.slug, genre: d.genre ?? undefined, city: d.city });
    }
  }, [served.slug]);
  // Once the session is known, and again whenever who is signed in changes.
  useEffect(() => {
    if (signedIn === undefined) return;
    reload();
  }, [signedIn, kd.user, reload]);

  return <Ctx.Provider value={{ ev, personal, reload }}>{children}</Ctx.Provider>;
}
