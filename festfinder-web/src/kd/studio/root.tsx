'use client';
/**
 * Studio (/studio/…) in Kính đêm: the organiser back office. One root for every screen: the
 * session gate (signed in, and part of an organiser team), the side nav of Studio-Dashboard
 * (the organiser, "Sự kiện mới", the screens, business details, sign out), and the event the
 * screens are about, kept in the address (?event=) and for the tab.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  BuildingsIcon, CalendarDotsIcon, CaretUpDownIcon, CoinsIcon, MegaphoneIcon, MicrophoneStageIcon, PlusIcon, QrCodeIcon, RocketLaunchIcon, SignOutIcon, SquaresFourIcon, TagIcon, TicketIcon, TrayIcon, UsersIcon,
} from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { CRAFT } from '../craft';
import { KdProvider, useKd } from '../runtime';
import { buttonClass } from '../ui/actions';
import { AskHost } from '../console/kit';
import { Menu, MenuItem } from '../ui/menu';
import { Avatar, Card as Panel } from '../ui/parts';
import { Shell, SideNav } from '../ui/shell';
import { place } from '../app/place';
import { STUDIO } from './copy';

export type StudioScreen = 'dash' | 'events' | 'new' | 'attendees' | 'door' | 'revenue' | 'inbox' | 'announce' | 'promos' | 'ads' | 'gigs' | 'profile';

export interface OrgEvent {
  id: string; slug: string; title: string; status: 'draft' | 'in_review' | 'live' | 'rejected' | 'ended' | string; statusLabel: Pair;
  startsOn: string | null; endsOn: string | null; startTime: string | null; endTime: string | null; genre: string | null;
  venueName: string | null; area: string | null; entryMode: 'free' | 'paid' | 'donation'; priceFrom: number;
  views: number | null; saves: number | null; clicks: number | null; sold: number | null; hasPerformance: boolean; meta: Pair;
  coverUrl?: string | null; qualityScore?: number | null; missing?: string[]; submittedAt?: string | null; updatedAt?: string | null;
  lastDecision?: { decision: string; code: string | null; message: string | null; at: string; reason: Pair | null } | null;
}
/** An organiser team the account belongs to (the session lists them). */
export interface OrgSeat { id: string; slug: string; name: string; role: string }
export interface OrgProfile { id: string; slug: string; name: string; logoUrl: string | null; verified: boolean; myRole: string }

interface StudioCtx {
  lang: Lang;
  org: OrgProfile;
  events: OrgEvent[];
  event: OrgEvent | null;
  setEvent: (id: string) => void;
  reload: () => Promise<void>;
  /** Every organiser this account belongs to, and switching between them. */
  seats: OrgSeat[];
  switchOrg: (id: string) => void;
}
const Ctx = createContext<StudioCtx | null>(null);
export function useStudio(): StudioCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStudio outside StudioRoot');
  return v;
}

const KEY = 'ff_studio_event';
/** The organiser chosen in /ops and here: kept per browser, as /ops kept it. */
const ORG_KEY = 'ff_ops_org';

/** Whether an event's last day is behind us (by the server's clock; a day either way does not matter here). */
export const isPast = (e: Pick<OrgEvent, 'startsOn' | 'endsOn'>) => !!e.startsOn && (e.endsOn ?? e.startsOn) < FF.now().toISOString().slice(0, 10);

const SCREENS: StudioScreen[] = ['events', 'new', 'attendees', 'door', 'revenue', 'inbox', 'announce', 'promos', 'ads', 'gigs', 'profile'];

/** The Studio layout: one root for every /studio path, so moving between screens keeps the organiser and the events. */
export function StudioRoot({ children }: { children: ReactNode }) {
  const path = usePathname() ?? '/studio';
  // The artist studio (/studio/artist/…) has its own root and gate.
  if (path.startsWith('/studio/artist')) return <>{children}</>;
  return <OrgRoot path={path}>{children}</OrgRoot>;
}

function OrgRoot({ path, children }: { path: string; children: ReactNode }) {
  const seg = path.split('/')[2] as StudioScreen | undefined;
  const current: StudioScreen = seg && SCREENS.includes(seg) ? seg : 'dash';
  const [lang, setLang] = useState<Lang>('vi');
  useEffect(() => { const l = place.lang(); if (l) setLang(l); }, []);
  return (
    <KdProvider lang={lang}>
      <AskHost lang={lang}>
        <Gate lang={lang} current={current}>{children}</Gate>
      </AskHost>
    </KdProvider>
  );
}

function Gate({ lang, current, children }: { lang: Lang; current: StudioScreen; children: ReactNode }) {
  const kd = useKd();
  const T = pick(STUDIO, lang);
  const orgs = useMemo(() => (kd.session as { organizers?: OrgSeat[] } | null | undefined)?.organizers ?? [], [kd.session]);
  // Which organiser the screens act for: the one picked before, else the one the account owns, else the first.
  const [picked, setPicked] = useState<string | null>(() => {
    try { return localStorage.getItem(ORG_KEY); } catch { return null; }
  });
  const orgId = orgs.some((o) => o.id === picked) ? picked : (orgs.find((o) => o.role === 'owner') ?? orgs[0])?.id ?? null;
  // Set before the screens below ask anything, so every /organizer request carries it.
  FF.organizerId = orgId;
  const switchOrg = useCallback((id: string) => {
    try { localStorage.setItem(ORG_KEY, id); } catch { /* storage blocked */ }
    try { sessionStorage.removeItem(KEY); } catch { /* storage blocked */ }
    FF.organizerId = id;
    const q = new URLSearchParams(location.search);
    q.delete('event');
    history.replaceState(history.state, '', location.pathname + (q.size ? '?' + q : ''));
    setPicked(id);
  }, []);
  if (kd.session === undefined) return <div className="kd-skel m-6 h-60" aria-hidden="true" />;
  if (!kd.user || !orgs.length) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4" data-ff-gate>
        <Panel className="flex w-full max-w-[420px] flex-col items-start gap-4 p-7">
          <img src="/kd/ff-wordmark.svg" alt="FeestFinder" width={127} height={22} />
          <h1 className="kd-d3">{kd.user ? T.notOrg : T.gate}</h1>
          {kd.user
            ? <button type="button" className={buttonClass({ tone: 'acc' })} onClick={() => kd.openRolePicker('organizer')}>{T.becomeOrg}</button>
            : <button type="button" className={buttonClass({ tone: 'acc' })} onClick={() => kd.openSignIn(T.gate)}>{T.signIn}</button>}
        </Panel>
      </div>
    );
  }
  // Organising is the account's craft only while it is on (kd/craft.ts); otherwise one switch away.
  const craft = kd.session?.craft ?? null;
  if (craft === 'artist' || kd.session?.roles?.organizer === 'disabled') {
    const K = pick(CRAFT, lang);
    const on = async () => {
      try { await FF.post('/me/roles/switch', { to: 'organizer' }); await kd.refresh(); } catch (e) { kd.toast(FF.errorText(e, lang)); }
    };
    return (
      <div className="flex min-h-dvh items-center justify-center p-4" data-ff-gate>
        <Panel className="flex w-full max-w-[420px] flex-col items-start gap-4 p-7">
          <img src="/kd/ff-wordmark.svg" alt="FeestFinder" width={127} height={22} />
          <h1 className="kd-d3">{craft === 'artist' ? T.asArtist : T.orgOff}</h1>
          {craft === 'artist' ? <p className="kd-s">{fill(K.oneBody, { a: K.artist, b: K.organizer })}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" className={buttonClass({ tone: 'acc' })} onClick={on}>{fill(K.switchTo, { r: K.organizer })}</button>
            <a className={buttonClass({})} href="/">{K.attendee}</a>
          </div>
        </Panel>
      </div>
    );
  }
  // A new organiser is a new Studio: every screen loads again for it.
  return <Studio key={orgId} lang={lang} current={current} seats={orgs} switchOrg={switchOrg}>{children}</Studio>;
}

function Studio({ lang, current, children, seats, switchOrg }: { lang: Lang; current: StudioScreen; children: ReactNode; seats: OrgSeat[]; switchOrg: (id: string) => void }) {
  const T = pick(STUDIO, lang);
  const K = pick(CRAFT, lang);
  const kd = useKd();
  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [events, setEvents] = useState<OrgEvent[] | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  const reload = useCallback(async () => {
    const out = await FF.maybe(FF.get('/organizer/events'), { items: [] });
    setEvents(out.items);
  }, []);
  useEffect(() => {
    FF.maybe(FF.get('/organizer/profile'), null).then(setOrg);
    FF.maybe(FF.get('/organizer/inbox'), null).then((r: { unread?: number } | null) => setUnread(r?.unread ?? 0));
    void reload();
  }, [reload]);

  // The event the screens are about: the address, else the last one picked in this tab, else the next live one.
  useEffect(() => {
    if (!events) return;
    let saved: string | null = null;
    try { saved = sessionStorage.getItem(KEY); } catch { /* storage blocked */ }
    const asked = new URLSearchParams(location.search).get('event');
    const ok = (id: string | null) => !!id && events.some((e) => e.id === id);
    const next = events.filter((e) => e.status === 'live' && !isPast(e)).sort((a, b) => (a.startsOn ?? '').localeCompare(b.startsOn ?? ''));
    setEventId(ok(asked) ? asked : ok(saved) ? saved : next[0]?.id ?? events.find((e) => e.status === 'live')?.id ?? events[0]?.id ?? null);
  }, [events]);
  const setEvent = useCallback((id: string) => {
    setEventId(id);
    try { sessionStorage.setItem(KEY, id); } catch { /* storage blocked */ }
    const q = new URLSearchParams(location.search);
    q.set('event', id);
    history.replaceState(history.state, '', location.pathname + '?' + q);
  }, []);

  const event = useMemo(() => events?.find((e) => e.id === eventId) ?? null, [events, eventId]);
  const i = (Icon: typeof SquaresFourIcon) => <Icon size={18} aria-hidden="true" />;
  const nav = (
    <SideNav
      label={T.nav}
      current={current}
      head={(
        <>
          <div className="kd-sn-hide flex items-center gap-2.5 px-2.5 pb-3.5 pt-1.5">
            <img src="/kd/ff-wordmark.svg" alt="FeestFinder" width={104} height={18} />
            <span className="kd-m">{T.studio}</span>
          </div>
          {org ? (
            <a className="kd-sn-hide kd-lrow mb-2 min-h-13 rounded-lg border-b-0 px-2.5 shadow-[inset_0_0_0_1px_var(--color-line)]" href={'/o/' + org.slug}>
              <Avatar org name={org.name} src={org.logoUrl} size={30} />
              <span className="flex min-w-0 flex-1 flex-col"><span className="kd-hs kd-ell text-sm">{org.name}</span><span className="kd-s text-xs">{T.publicProfile}</span></span>
            </a>
          ) : null}
          {seats.length > 1 && org ? (
            <Menu
              label={T.switchOrg}
              width={260}
              className="kd-sn-hide mb-2 w-full"
              trigger={(p) => (
                <button type="button" {...p} ref={p.ref} className="kd-sn w-full text-left" aria-label={T.switchOrg}>
                  {i(CaretUpDownIcon)}<span className="kd-ell">{T.switchOrg}</span>
                </button>
              )}
            >
              {seats.map((s) => (
                <MenuItem key={s.id} checked={s.id === org.id} aside={s.role === 'owner' ? T.roleOwner : T.roleMember} onSelect={() => { if (s.id !== org.id) switchOrg(s.id); }}>{s.name}</MenuItem>
              ))}
            </Menu>
          ) : null}
          <a className={buttonClass({ tone: 'acc', size: 'sm' }, 'mb-3 shrink-0')} href="/studio/new"><PlusIcon size={16} aria-hidden="true" />{T.newEvent}</a>
        </>
      )}
      items={[
        { key: 'dash', label: T.dash, href: '/studio', icon: i(SquaresFourIcon) },
        { key: 'events', label: T.events, href: '/studio/events', icon: i(CalendarDotsIcon) },
        { key: 'attendees', label: T.attendees, href: '/studio/attendees', icon: i(UsersIcon) },
        { key: 'door', label: T.door, href: '/studio/door', icon: i(QrCodeIcon) },
        { key: 'revenue', label: T.revenue, href: '/studio/revenue', icon: i(CoinsIcon) },
        { key: 'inbox', label: T.inbox, href: '/studio/inbox', icon: i(TrayIcon), count: unread || null },
        { key: 'announce', label: T.announce, href: '/studio/announce', icon: i(MegaphoneIcon) },
        { key: 'promos', label: T.promos, href: '/studio/promos', icon: i(TagIcon) },
        { key: 'ads', label: T.ads, href: '/studio/ads', icon: i(RocketLaunchIcon) },
        { key: 'gigs', label: T.gigs, href: '/studio/gigs', icon: i(MicrophoneStageIcon) },
      ]}
      footer={(
        <div className="kd-sn-hide mt-auto flex flex-col gap-0.5 border-t border-line pt-4">
          <a className="kd-sn" href="/studio/profile" aria-current={current === 'profile' ? 'page' : undefined}>{i(BuildingsIcon)}{T.business}</a>
          {/* The other roles: attending (the site), or performing instead of organising. */}
          <a className="kd-sn" href="/">{i(TicketIcon)}{K.attendee}</a>
          <button type="button" className="kd-sn w-full text-left" onClick={() => kd.openRolePicker('artist')}>{i(MicrophoneStageIcon)}{fill(K.switchTo, { r: K.artist })}</button>
          <button type="button" className="kd-sn w-full text-left" onClick={async () => { await kd.signOut(); location.assign('/studio'); }}>{i(SignOutIcon)}{T.signOut}</button>
        </div>
      )}
    />
  );
  // The wizard and the door are pages of their own (Studio-Wizard, Studio-Checkin): no side nav, their own top bar.
  const frame = (body: ReactNode) => (current === 'new' || current === 'door' ? body : <Shell nav={nav}>{body}</Shell>);
  if (!org || !events) return frame(<div className="kd-skel m-6 h-60" aria-hidden="true" />);
  return (
    <Ctx.Provider value={{ lang, org, events, event, setEvent, reload, seats, switchOrg }}>
      {frame(children)}
    </Ctx.Provider>
  );
}
