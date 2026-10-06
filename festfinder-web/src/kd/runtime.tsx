'use client';
/**
 * The browser side of a Kính đêm page: who is signed in, what they saved and follow, the
 * sign-in sheet and the toast. Pages render their public content on the server; this
 * provider adds the personal layer once the page is in the browser.
 *
 * API calls go through FF (src/runtime/ff.ts), the same client the legacy screens use.
 */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import { FF, type Session } from '@/runtime/ff';
import { COMMON, pick, type Lang } from './copy';
import { RolePicker, type RoleStep } from './role-picker';
import { SignInSheet } from './sign-in';
import { Toast } from './ui/toast';

/** Something the visitor was doing when sign-in got in the way, done once they are in. */
export type Intent =
  | { kind: 'save'; id: string }
  | { kind: 'follow-org'; id: string }
  | { kind: 'follow-artist'; name: string }
  | { kind: 'go'; href: string };

const encodeIntent = (i: Intent) =>
  i.kind === 'save' ? 'save:' + i.id : i.kind === 'follow-org' ? 'org:' + i.id : i.kind === 'follow-artist' ? 'art:' + i.name : 'go:' + i.href;
function decodeIntent(s: string | null | undefined): Intent | null {
  if (!s) return null;
  const at = s.indexOf(':');
  const k = s.slice(0, at), v = s.slice(at + 1);
  if (!v) return null;
  if (k === 'save') return { kind: 'save', id: v };
  if (k === 'org') return { kind: 'follow-org', id: v };
  if (k === 'art') return { kind: 'follow-artist', name: v };
  if (k === 'go' && v.startsWith('/')) return { kind: 'go', href: v };
  return null;
}

export interface ToastMsg { text: string; action?: { label: string; run: () => void }; id: number }

interface Kd {
  lang: Lang;
  /** Flips once the API's clock is known (FF.now() follows it from then on). */
  clockReady: boolean;
  /** undefined while the session is being read. */
  session: Session | null | undefined;
  user: Session['user'] | null;
  saved: ReadonlySet<string>;
  /** Overrides for follow state the page loaded: 'org:<id>' / 'art:<name>'. */
  follows: ReadonlyMap<string, boolean>;
  toggleSave: (id: string) => Promise<boolean | null>;
  setFollow: (key: 'org' | 'art', id: string, on: boolean) => Promise<boolean | null>;
  /** True when signed in; otherwise opens the sign-in sheet and returns false. */
  requireSignIn: (intent?: Intent, note?: string) => boolean;
  openSignIn: (note?: string) => void;
  /** The fan / artist / organiser picker (also opened by ?role=artist|organizer). */
  openRolePicker: (start?: RoleStep, name?: string) => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<Session | null>;
  toast: (text: string, action?: ToastMsg['action']) => void;
}

/** Where the last server-clock offset is kept (the compiled screens' key too). */
const CLOCK_KEY = 'ff:clock-offset';

const Ctx = createContext<Kd | null>(null);

export function useKd(): Kd {
  const v = useContext(Ctx);
  if (!v) throw new Error('useKd outside KdProvider');
  return v;
}

/** The current language, for components that only need that. */
export const useLang = () => useKd().lang;

export function KdProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  const [follows, setFollows] = useState<Map<string, boolean>>(() => new Map());
  const [sheet, setSheet] = useState<{ note?: string; intent?: Intent } | null>(null);
  const [toastMsg, setToast] = useState<ToastMsg | null>(null);
  const [role, setRole] = useState<{ step: RoleStep; name?: string } | null>(null);
  const [clockReady, setClockReady] = useState(false);
  const toastId = useRef(0);
  // Settles once the first session read is back: what a click made while it loads waits for.
  const ready = useRef<{ promise: Promise<Session | null>; resolve: (s: Session | null) => void } | null>(null);
  if (!ready.current) {
    let resolve!: (s: Session | null) => void;
    const promise = new Promise<Session | null>((r) => { resolve = r; });
    ready.current = { promise, resolve };
  }
  const C = pick(COMMON, lang);

  FF.lang = lang;

  const toast = useCallback((text: string, action?: ToastMsg['action']) => {
    toastId.current += 1;
    setToast({ text, action, id: toastId.current });
  }, []);

  const loadPersonal = useCallback(async (s: Session | null) => {
    if (!s?.user) { setSaved(new Set()); return; }
    const out = await FF.maybe(FF.get('/me/saves?limit=100&past=exclude'), { items: [] as { id: string }[] });
    setSaved(new Set(out.items.map((e: { id: string }) => e.id)));
  }, []);

  const refresh = useCallback(async () => {
    FF.forget('kd:session');
    const s = await FF.once('kd:session', () => FF.refreshSession());
    setSession(s);
    await loadPersonal(s);
    ready.current!.resolve(s);
    // For the tests: the page has hydrated and knows who is there.
    document.documentElement.dataset.kdSession = s?.user ? 'user' : 'none';
    // A new account says what it is first; ?role= opens the picker at that step.
    if (s?.user) {
      const asked = new URLSearchParams(location.search).get('role');
      if (asked === 'artist' || asked === 'organizer') setRole({ step: asked });
      else if (s.user.onboarded === false) setRole({ step: 'menu' });
    }
    return s;
  }, [loadPersonal]);

  const runIntent = useCallback(async (i: Intent | null) => {
    if (!i) return;
    if (i.kind === 'save') {
      await FF.fire(FF.put('/me/saves/' + i.id));
      setSaved((prev) => new Set(prev).add(i.id));
      toast(C.saved);
    } else if (i.kind === 'follow-org') {
      await FF.fire(FF.put('/me/follows/organizers/' + i.id));
      setFollows((prev) => new Map(prev).set('org:' + i.id, true));
    } else if (i.kind === 'follow-artist') {
      await FF.fire(FF.put('/me/follows/artists/' + encodeURIComponent(i.name)));
      setFollows((prev) => new Map(prev).set('art:' + i.name, true));
    } else if (i.kind === 'go') {
      location.assign(i.href);
    }
  }, [toast, C.saved]);

  // The server's clock: "n minutes ago" and countdowns follow it (it is pinned in the tests).
  // With no signal the check fails and the last offset holds, as in the compiled screens
  // (ff-client.js keeps it under the same key): a ticket stays "upcoming" offline.
  useEffect(() => {
    FF.once('kd:clock', () => FF.maybe(FF.get('/health'), null)).then((h: { time?: string } | null) => {
      if (h?.time) {
        FF.clockOffset = new Date(h.time).getTime() - Date.now();
        try { localStorage.setItem(CLOCK_KEY, String(FF.clockOffset)); } catch { /* storage blocked */ }
      } else {
        try { FF.clockOffset = Number(localStorage.getItem(CLOCK_KEY)) || 0; } catch { /* storage blocked */ }
      }
      setClockReady(true);
    });
  }, []);

  // The session, and the hand-back from Google if this page is where the browser came back to.
  useEffect(() => {
    FF.takeOAuthResult();
    const back = FF.data.oauth as { error?: string; via?: string; next?: string | null } | undefined;
    FF.data.oauth = undefined;
    refresh().then((s) => {
      if (!back) return;
      if (back.error) {
        if (s?.user) toast(FF.oauthErrorText(back.error, lang));
        else setSheet({ note: FF.oauthErrorText(back.error, lang), intent: decodeIntent(back.next) ?? undefined });
        return;
      }
      toast(back.via === 'signup' ? C.welcome : C.loggedIn);
      runIntent(decodeIntent(back.next));
    });
    // Once per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requireSignIn = useCallback((intent?: Intent, note?: string) => {
    if (session?.user) return true;
    if (session === undefined) {
      // Still reading the session: decide once it is known.
      ready.current!.promise.then((s) => {
        if (!s?.user) setSheet({ note, intent });
        else if (intent) runIntent(intent);
      });
      return false;
    }
    setSheet({ note, intent });
    return false;
  }, [session, runIntent]);

  const toggleSave = useCallback(async (id: string) => {
    if (!requireSignIn({ kind: 'save', id }, C.gateSave)) return null;
    const on = !saved.has(id);
    setSaved((prev) => { const n = new Set(prev); if (on) n.add(id); else n.delete(id); return n; });
    try {
      await (on ? FF.put('/me/saves/' + id) : FF.del('/me/saves/' + id));
      return on;
    } catch (e) {
      setSaved((prev) => { const n = new Set(prev); if (on) n.delete(id); else n.add(id); return n; });
      toast(FF.errorText(e, lang));
      return null;
    }
  }, [saved, requireSignIn, toast, lang, C.gateSave]);

  const setFollow = useCallback(async (key: 'org' | 'art', id: string, on: boolean) => {
    const intent: Intent = key === 'org' ? { kind: 'follow-org', id } : { kind: 'follow-artist', name: id };
    if (!requireSignIn(intent, C.gateFollow)) return null;
    const k = key + ':' + id;
    setFollows((prev) => new Map(prev).set(k, on));
    const path = key === 'org' ? '/me/follows/organizers/' + id : '/me/follows/artists/' + encodeURIComponent(id);
    try {
      await (on ? FF.put(path) : FF.del(path));
      return on;
    } catch (e) {
      setFollows((prev) => new Map(prev).set(k, !on));
      toast(FF.errorText(e, lang));
      return null;
    }
  }, [requireSignIn, toast, lang, C.gateFollow]);

  const signOut = useCallback(async () => {
    await FF.fire(FF.del('/auth/session'));
    FF.forget();
    setSession(null);
    setSaved(new Set());
    setFollows(new Map());
    toast(C.signedOut);
  }, [toast, C.signedOut]);

  const value = useMemo<Kd>(() => ({
    lang, clockReady, session, user: session?.user ?? null, saved, follows,
    toggleSave, setFollow, requireSignIn, signOut, refresh, toast,
    openSignIn: (note?: string) => setSheet({ note }),
    openRolePicker: (start: RoleStep = 'menu', name?: string) => setRole({ step: start, name }),
  }), [lang, clockReady, session, saved, follows, toggleSave, setFollow, requireSignIn, signOut, refresh, toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {sheet ? (
        <SignInSheet
          lang={lang}
          note={sheet.note}
          intent={sheet.intent ? encodeIntent(sheet.intent) : null}
          onClose={() => setSheet(null)}
          onDone={async (created) => {
            const intent = sheet.intent ?? null;
            setSheet(null);
            await refresh();
            toast(created ? C.welcome : C.loggedIn);
            runIntent(intent);
          }}
        />
      ) : null}
      {role && session?.user && !sheet ? (
        <RolePicker lang={lang} start={role.step} name={role.name} onClose={() => { setRole(null); refresh(); }} />
      ) : null}
      <Toast msg={toastMsg} onDone={() => setToast(null)} closeLabel={C.close} />
    </Ctx.Provider>
  );
}

/** Whether an event is saved, and the toggle (which asks for sign-in first when needed). */
export function useSaved(id: string): [boolean, () => void] {
  const kd = useKd();
  return [kd.saved.has(id), () => { kd.toggleSave(id); }];
}

/** Follow state for an organiser (`org`, by id) or an artist (`art`, by name). */
export function useFollow(key: 'org' | 'art', id: string, initial: boolean): [boolean, () => void] {
  const kd = useKd();
  const k = key + ':' + id;
  const on = kd.follows.has(k) ? !!kd.follows.get(k) : initial;
  return [on, () => { kd.setFollow(key, id, !on); }];
}
