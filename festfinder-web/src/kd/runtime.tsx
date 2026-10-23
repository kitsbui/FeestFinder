'use client';
/**
 * The browser side of a Kính đêm page: who is signed in, what they saved and follow, the
 * sign-in sheet and the toast. Pages render their public content on the server; this
 * provider adds the personal layer once the page is in the browser.
 *
 * API calls go through FF (src/runtime/ff.ts), the site's API client.
 */
import {
  createContext, startTransition, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import dynamic from 'next/dynamic';
import { FF, type Session } from '@/runtime/ff';
import { COMMON, pick, type Lang } from './copy';
import type { RoleStep } from './role-picker';
import { Toast } from './ui/toast';

// The sign-in sheet and the role picker load the first time one opens (design v2 phase 7): most
// visits never open them, and every page would carry them otherwise.
const SignInSheet = dynamic(() => import('./sign-in').then((m) => m.SignInSheet), { ssr: false });
const RolePicker = dynamic(() => import('./role-picker').then((m) => m.RolePicker), { ssr: false });
const ShareAsk = dynamic(() => import('./ui/share-ask').then((m) => m.ShareAsk), { ssr: false });

/** Nights saved on this device before signing in (design v2 phase 11): moved to the account at sign-in. */
const DEVICE_SAVES = 'ff:saves';
export function deviceSaves(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(DEVICE_SAVES) || '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 200) : [];
  } catch { return []; }
}
function keepDeviceSaves(ids: string[]) {
  try { if (ids.length) localStorage.setItem(DEVICE_SAVES, JSON.stringify(ids)); else localStorage.removeItem(DEVICE_SAVES); } catch { /* storage blocked */ }
}

/** Something the visitor was doing when sign-in got in the way, done once they are in. */
export type Intent =
  | { kind: 'save'; id: string }
  | { kind: 'follow-org'; id: string }
  | { kind: 'follow-artist'; name: string }
  | { kind: 'follow-person'; id: string }
  | { kind: 'go'; href: string };

const encodeIntent = (i: Intent) =>
  i.kind === 'save' ? 'save:' + i.id : i.kind === 'follow-org' ? 'org:' + i.id : i.kind === 'follow-artist' ? 'art:' + i.name
    : i.kind === 'follow-person' ? 'person:' + i.id : 'go:' + i.href;
function decodeIntent(s: string | null | undefined): Intent | null {
  if (!s) return null;
  const at = s.indexOf(':');
  const k = s.slice(0, at), v = s.slice(at + 1);
  if (!v) return null;
  if (k === 'save') return { kind: 'save', id: v };
  if (k === 'org') return { kind: 'follow-org', id: v };
  if (k === 'art') return { kind: 'follow-artist', name: v };
  if (k === 'person') return { kind: 'follow-person', id: v };
  if (k === 'go' && v.startsWith('/')) return { kind: 'go', href: v };
  return null;
}

/** What a follow is of: an organiser's page, an artist's profile, a person. */
export type FollowKind = 'org' | 'art' | 'person';

export interface ToastMsg { text: string; action?: { label: string; run: () => void }; id: number }

interface Kd {
  lang: Lang;
  /** Flips once the API's clock is known (FF.now() follows it from then on): it comes with the session. */
  clockReady: boolean;
  /** undefined while the session is being read. */
  session: Session | null | undefined;
  user: Session['user'] | null;
  saved: ReadonlySet<string>;
  /** Overrides for follow state the page loaded: 'org:<id>' / 'art:<name>'. */
  follows: ReadonlyMap<string, boolean>;
  toggleSave: (id: string) => Promise<boolean | null>;
  setFollow: (key: FollowKind, id: string, on: boolean) => Promise<boolean | null>;
  /** True when signed in; otherwise opens the sign-in sheet and returns false. */
  requireSignIn: (intent?: Intent, note?: string) => boolean;
  openSignIn: (note?: string) => void;
  /** The fan / artist / organiser picker (also opened by ?role=artist|organizer). */
  openRolePicker: (start?: RoleStep, name?: string) => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<Session | null>;
  /** Asks once whether friends may see the nights this person goes to, if they were never asked (migration 045). */
  askShare: () => void;
  toast: (text: string, action?: ToastMsg['action']) => void;
}

const Ctx = createContext<Kd | null>(null);

export function useKd(): Kd {
  const v = useContext(Ctx);
  if (!v) throw new Error('useKd outside KdProvider');
  return v;
}

/** The current language, for components that only need that. */
export function KdProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  const [follows, setFollows] = useState<Map<string, boolean>>(() => new Map());
  const [sheet, setSheet] = useState<{ note?: string; intent?: Intent } | null>(null);
  const [toastMsg, setToast] = useState<ToastMsg | null>(null);
  const [role, setRole] = useState<{ step: RoleStep; name?: string } | null>(null);
  const [clockReady, setClockReady] = useState(false);
  /** Who is there, for the tests' html[data-kd-session], once the page has drawn it with their saves. */
  const [known, setKnown] = useState<'user' | 'none' | null>(null);
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

  /** What a signed-in person saved; their device's saves join the account first. */
  const loadSaves = useCallback(async () => {
    const kept = deviceSaves();
    if (kept.length) {
      await Promise.all(kept.map((id) => FF.fire(FF.put('/me/saves/' + id))));
      keepDeviceSaves([]);
    }
    // Past nights too, so their hearts read as saved (upcoming come first in the answer).
    const out = await FF.maybe(FF.get('/me/saves?limit=100'), { items: [] as { id: string }[] });
    return new Set<string>(out.items.map((e: { id: string }) => e.id));
  }, []);

  // The session, the API's clock (it comes with it, runtime/ff.ts) and the saves land in one render,
  // in a transition: the page stays responsive while everything that reads them draws again.
  const refresh = useCallback(async () => {
    FF.forget('kd:session');
    const s = await FF.once('kd:session', () => FF.refreshSession());
    if (!s?.user) {
      // Signed out, a heart saves on the device: the same empty set when there is none, so nothing draws again.
      const kept = deviceSaves();
      startTransition(() => {
        setClockReady(true);
        setSession(s);
        setSaved((prev) => (!kept.length && !prev.size ? prev : new Set(kept)));
        setKnown('none');
      });
    } else {
      startTransition(() => { setClockReady(true); setSession(s); });
      const mine = await loadSaves();
      startTransition(() => { setSaved(mine); setKnown('user'); });
    }
    ready.current!.resolve(s);
    // A new account says what it is first; ?role= opens the picker at that step.
    if (s?.user) {
      const asked = new URLSearchParams(location.search).get('role');
      if (asked === 'artist' || asked === 'organizer') setRole({ step: asked });
      else if (s.user.onboarded === false) setRole({ step: 'menu' });
    }
    return s;
  }, [loadSaves]);

  // For the tests: the page has hydrated and drawn who is there.
  useEffect(() => { if (known) document.documentElement.dataset.kdSession = known; }, [known]);

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
    } else if (i.kind === 'follow-person') {
      await FF.fire(FF.put('/me/follows/people/' + i.id));
      setFollows((prev) => new Map(prev).set('person:' + i.id, true));
    } else if (i.kind === 'go') {
      location.assign(i.href);
    }
  }, [toast, C.saved]);

  // The session, and the hand-back from Google if this page is where the browser came back to.
  useEffect(() => {
    FF.takeOAuthResult();
    const back = FF.data.oauth as { error?: string; via?: string; next?: string | null } | undefined;
    FF.data.oauth = undefined;
    void refresh().then((s) => {
      if (!back) return;
      if (back.error) {
        if (s?.user) toast(FF.oauthErrorText(back.error, lang));
        else setSheet({ note: FF.oauthErrorText(back.error, lang), intent: decodeIntent(back.next) ?? undefined });
        return;
      }
      toast(back.via === 'signup' ? C.welcome : C.loggedIn);
      void runIntent(decodeIntent(back.next));
    });
    // Once per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requireSignIn = useCallback((intent?: Intent, note?: string) => {
    if (session?.user) return true;
    if (session === undefined) {
      // Still reading the session: decide once it is known.
      void ready.current!.promise.then((s) => {
        if (!s?.user) setSheet({ note, intent });
        else if (intent) void runIntent(intent);
      });
      return false;
    }
    setSheet({ note, intent });
    return false;
  }, [session, runIntent]);

  // Whether friends may see this person's nights: asked once per visit at most, only while unanswered.
  const [shareOpen, setShareOpen] = useState(false);
  const shareAsked = useRef(false);
  const sharePending = useRef(false);
  const askShare = useCallback(() => {
    // Asked before the session is read (a screen that loads at once): once it is.
    if (session === undefined) { sharePending.current = true; return; }
    if (shareAsked.current || !session?.user || session.user.shareNights !== null) return;
    shareAsked.current = true;
    setShareOpen(true);
  }, [session]);
  useEffect(() => {
    if (session === undefined || !sharePending.current) return;
    sharePending.current = false;
    askShare();
  }, [session, askShare]);

  const toggleSave = useCallback(async (id: string) => {
    // Signed out, a heart saves on this device (owner, 2026-10-18); signing in moves it to the account.
    const s = session === undefined ? await ready.current!.promise : session;
    if (!s?.user) {
      const kept = deviceSaves();
      const on = !kept.includes(id);
      const next = on ? [id, ...kept] : kept.filter((x) => x !== id);
      keepDeviceSaves(next);
      setSaved(new Set(next));
      if (on) toast(C.saved, { label: C.signIn, run: () => setSheet({ note: C.gateSave }) });
      return on;
    }
    const on = !saved.has(id);
    setSaved((prev) => { const n = new Set(prev); if (on) n.add(id); else n.delete(id); return n; });
    try {
      await (on ? FF.put('/me/saves/' + id) : FF.del('/me/saves/' + id));
      if (on) askShare();
      return on;
    } catch (e) {
      setSaved((prev) => { const n = new Set(prev); if (on) n.delete(id); else n.add(id); return n; });
      toast(FF.errorText(e, lang));
      return null;
    }
  }, [session, saved, toast, lang, C.gateSave, C.saved, C.signIn, askShare]);

  const setFollow = useCallback(async (key: FollowKind, id: string, on: boolean) => {
    const intent: Intent = key === 'org' ? { kind: 'follow-org', id } : key === 'person' ? { kind: 'follow-person', id } : { kind: 'follow-artist', name: id };
    if (!requireSignIn(intent, C.gateFollow)) return null;
    const k = key + ':' + id;
    setFollows((prev) => new Map(prev).set(k, on));
    const path = key === 'org' ? '/me/follows/organizers/' + id : key === 'person' ? '/me/follows/people/' + id : '/me/follows/artists/' + encodeURIComponent(id);
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
    toggleSave, setFollow, requireSignIn, signOut, refresh, toast, askShare,
    openSignIn: (note?: string) => setSheet({ note }),
    openRolePicker: (start: RoleStep = 'menu', name?: string) => setRole({ step: start, name }),
  }), [lang, clockReady, session, saved, follows, toggleSave, setFollow, requireSignIn, signOut, refresh, toast, askShare]);

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
            void runIntent(intent);
          }}
        />
      ) : null}
      {role && session?.user && !sheet ? (
        <RolePicker lang={lang} start={role.step} name={role.name} onClose={() => { setRole(null); void refresh(); }} />
      ) : null}
      {shareOpen && session?.user && !sheet && !role ? (
        <ShareAsk lang={lang} onDone={(share) => { setShareOpen(false); if (share !== null) void refresh(); }} />
      ) : null}
      <Toast msg={toastMsg} onDone={() => setToast(null)} closeLabel={C.close} />
    </Ctx.Provider>
  );
}

/** Whether an event is saved, and the toggle (which asks for sign-in first when needed). */
export function useSaved(id: string): [boolean, () => void] {
  const kd = useKd();
  return [kd.saved.has(id), () => { void kd.toggleSave(id); }];
}

