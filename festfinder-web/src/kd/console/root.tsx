'use client';
/**
 * The Console (/console/…) in Kính đêm: the team's whole back office (it took over /ops). One
 * root for every screen: the admin gate (an admin session only; admin comes from the allowlist
 * on a Google sign-in, never from here), the side rail with the screens in four groups and
 * their counts, the top bar with the search and the account menu (View as, log out), and the
 * confirm dialog every screen asks through.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowSquareOutIcon, BuildingsIcon, CalendarDotsIcon, ChartLineIcon, ChatTextIcon, ClockCounterClockwiseIcon, FlagIcon, GaugeIcon, HandWavingIcon,
  HandshakeIcon, LightbulbIcon, LinkSimpleIcon, MagnifyingGlassIcon, MapPinIcon, MegaphoneIcon, MicrophoneStageIcon, PlugsIcon, ReceiptIcon, StarIcon,
  TrayIcon, UsersIcon,
} from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { KdProvider, useKd } from '../runtime';
import { place } from '../app/place';
import { buttonClass } from '../ui/actions';
import { Input } from '../ui/forms';
import { Menu, MenuHeader, MenuItem, MenuSeparator } from '../ui/menu';
import { Card as Panel } from '../ui/parts';
import { Shell, type SideItem } from '../ui/shell';
import { AskHost } from './kit';
import { CONSOLE } from './copy';
import { Rail } from '../ui/rail';
import { Logo } from '../ui/logo';
import { WorkspaceSwitch } from '../ui/workspaces';

export type ConsoleTab =
  | 'overview' | 'queue' | 'claims' | 'events' | 'organizers' | 'venues' | 'artists' | 'sources' | 'reports' | 'feedback'
  | 'partners' | 'affiliate' | 'brands' | 'projects' | 'featured' | 'users' | 'orders' | 'insights' | 'audit';
export interface Counts {
  queue: number; verification: number; reports: number; ads: number; appeals: number;
  claims: number; profileClaims: number; allClaims: number; unresolvedVenues?: number; projects?: number;
}

interface ConsoleCtx { lang: Lang; q: string; counts: Counts | null; refreshCounts: () => void }
const Ctx = createContext<ConsoleCtx | null>(null);
export function useConsole(): ConsoleCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useConsole outside ConsoleRoot');
  return v;
}

const TABS: ConsoleTab[] = ['overview', 'claims', 'events', 'organizers', 'venues', 'artists', 'sources', 'reports', 'feedback', 'partners', 'affiliate', 'brands', 'projects', 'featured', 'users', 'orders', 'insights', 'audit'];
/** Routes that belong to a tab of another name. */
const ALIAS: Record<string, ConsoleTab> = { verification: 'organizers' };

export function ConsoleRoot({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('vi');
  useEffect(() => { const l = place.lang(); if (l) setLang(l); }, []);
  return (
    <KdProvider lang={lang}>
      <Gate lang={lang}>{children}</Gate>
    </KdProvider>
  );
}

function Gate({ lang, children }: { lang: Lang; children: ReactNode }) {
  const kd = useKd();
  const T = pick(CONSOLE, lang);
  const user = kd.user;
  if (kd.session === undefined) return <div className="kd-skel m-6 h-60" aria-hidden="true" />;
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4" data-ff-gate>
        <Panel className="flex w-full max-w-[420px] flex-col items-start gap-4 p-7">
          <span className="flex items-center gap-2.5"><Logo lang={lang} mark height={24} /><span className="kd-m text-fg-1">{T.console}</span></span>
          <h1 className="kd-d3">{!user ? T.gate : user.adminNeedsGoogle ? T.needsGoogle : T.notAdmin}</h1>
          {!user
            ? <button type="button" className={buttonClass({ tone: 'acc' })} onClick={() => kd.openSignIn(T.gate)}>{T.signIn}</button>
            : <button type="button" className={buttonClass({})} onClick={async () => { await kd.signOut(); if (user.adminNeedsGoogle) kd.openSignIn(T.needsGoogle); }}>{T.signOut}</button>}
        </Panel>
      </div>
    );
  }
  return <Console lang={lang} name={user.name || user.email || 'Admin'}>{children}</Console>;
}

function Console({ lang, name, children }: { lang: Lang; name: string; children: ReactNode }) {
  const T = pick(CONSOLE, lang);
  const kd = useKd();
  const path = usePathname() ?? '/console';
  const seg = path.split('/')[2] ?? '';
  const current: ConsoleTab = ALIAS[seg] ?? (TABS.includes(seg as ConsoleTab) ? seg as ConsoleTab : 'queue');
  const [counts, setCounts] = useState<Counts | null>(null);
  const [q, setQ] = useState('');
  const [viewing, setViewing] = useState<string | null>(null);
  const [options, setOptions] = useState<{ targetType: 'user' | 'organizer'; id: string; name: string; role: Pair }[] | null>(null);
  const refreshCounts = useCallback(() => {
    void Promise.all([FF.maybe(FF.get('/admin/counts'), null), FF.maybe(FF.get('/admin/overview'), null)]).then(([c, o]: [Counts | null, { unresolvedVenues?: number } | null]) => {
      setCounts(c ? { ...c, unresolvedVenues: o?.unresolvedVenues } : null);
    });
  }, []);
  // Counts on open, every minute, and when a screen says something changed.
  useEffect(() => {
    refreshCounts();
    const t = setInterval(refreshCounts, 60_000);
    return () => clearInterval(t);
  }, [refreshCounts]);
  // A new tab starts with an empty search.
  useEffect(() => { setQ(''); }, [current]);

  const startViewAs = async (o: { targetType: string; id: string; name: string }) => {
    try { await FF.post('/admin/impersonation', { targetType: o.targetType, targetId: o.id }); setViewing(o.name); } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  const endViewAs = async () => {
    try { const out = await FF.del('/admin/impersonation'); setViewing(null); kd.toast(FF.text(out.message, lang)); } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
  const n = (v: number | undefined) => (v ? v : null);
  const i = (Icon: typeof GaugeIcon) => <Icon size={18} aria-hidden="true" />;
  // The page's name, for the rail folded into a bar on a phone.
  const railLabel = ({ overview: T.tabOverview, queue: T.tabQueue, claims: T.tabClaims, reports: T.tabReports, feedback: T.tabFeedback, events: T.tabEvents,
    organizers: T.tabOrganizers, venues: T.tabVenues, artists: T.tabArtists, sources: T.tabSources, partners: T.tabPartners, affiliate: T.tabAffiliate,
    brands: T.tabBrands, projects: T.tabProjects, featured: T.tabFeatured, users: T.tabUsers, orders: T.tabOrders, insights: T.tabInsights, audit: T.tabAudit } as Record<string, string>)[current] ?? T.console;
  const group = (label: string, items: SideItem[]) => (
    <div className="flex flex-col gap-0.5" key={label}>
      <span className="kd-m kd-sn-hide px-2.5 pt-3 pb-1">{label}</span>
      {items.map((it) => (
        <Link key={it.key} href={it.href} className="kd-sn" aria-current={it.key === current ? 'page' : undefined}>
          {it.icon}
          <span className="kd-ell">{it.label}</span>
          {it.count ? <span className="kd-count kd-num">{it.count}</span> : null}
        </Link>
      ))}
    </div>
  );

  const nav = (
    <Rail label={T.console} current={railLabel}>
      {/* The logo leads home; the switcher to every other workspace (ui/workspaces.tsx). */}
      <Logo lang={lang} height={18} className="px-2.5" />
      <WorkspaceSwitch lang={lang} current="console" className="mb-1 w-full" />
      {group(T.navWork, [
        { key: 'overview', label: T.tabOverview, href: '/console/overview', icon: i(GaugeIcon) },
        { key: 'queue', label: T.tabQueue, href: '/console', icon: i(TrayIcon), count: n(counts?.queue) },
        { key: 'claims', label: T.tabClaims, href: '/console/claims', icon: i(HandWavingIcon), count: n(counts?.allClaims) },
        { key: 'reports', label: T.tabReports, href: '/console/reports', icon: i(FlagIcon), count: n(counts?.reports) },
        { key: 'feedback', label: T.tabFeedback, href: '/console/feedback', icon: i(ChatTextIcon) },
      ])}
      {group(T.navCatalogue, [
        { key: 'events', label: T.tabEvents, href: '/console/events', icon: i(CalendarDotsIcon) },
        { key: 'organizers', label: T.tabOrganizers, href: '/console/organizers', icon: i(BuildingsIcon), count: n(counts?.verification) },
        { key: 'venues', label: T.tabVenues, href: '/console/venues', icon: i(MapPinIcon), count: n(counts?.unresolvedVenues) },
        { key: 'artists', label: T.tabArtists, href: '/console/artists', icon: i(MicrophoneStageIcon) },
        { key: 'sources', label: T.tabSources, href: '/console/sources', icon: i(PlugsIcon) },
      ])}
      {group(T.navPartners, [
        { key: 'partners', label: T.tabPartners, href: '/console/partners', icon: i(HandshakeIcon) },
        { key: 'affiliate', label: T.tabAffiliate, href: '/console/affiliate', icon: i(LinkSimpleIcon) },
        { key: 'brands', label: T.tabBrands, href: '/console/brands', icon: i(MegaphoneIcon) },
        { key: 'projects', label: T.tabProjects, href: '/console/projects', icon: i(LightbulbIcon), count: n(counts?.projects) },
      ])}
      {group(T.navPlatform, [
        { key: 'featured', label: T.tabFeatured, href: '/console/featured', icon: i(StarIcon), count: n(counts?.ads) },
        { key: 'users', label: T.tabUsers, href: '/console/users', icon: i(UsersIcon) },
        { key: 'orders', label: T.tabOrders, href: '/console/orders', icon: i(ReceiptIcon) },
        { key: 'insights', label: T.tabInsights, href: '/console/insights', icon: i(ChartLineIcon) },
        { key: 'audit', label: T.tabAudit, href: '/console/audit', icon: i(ClockCounterClockwiseIcon) },
      ])}
      <div className="kd-sn-hide mt-auto flex flex-col gap-0.5 border-t border-line-1 pt-4">
        <a className="kd-sn" href="/" target="_blank" rel="noopener">{i(ArrowSquareOutIcon)}{T.toSite}</a>
        <button type="button" className="kd-sn w-full text-left" onClick={() => window.dispatchEvent(new Event('ff:feedback'))}>{i(ChatTextIcon)}{T.feedbackLink}</button>
      </div>
    </Rail>
  );

  return (
    <Ctx.Provider value={{ lang, q, counts, refreshCounts }}>
      <AskHost lang={lang}>
        <Shell nav={nav}>
          <div className="flex min-h-dvh flex-col">
            <header className="flex h-15 items-center gap-3.5 border-b border-line-1 px-[var(--kd-gutter)]">
              <Input
                boxClass="h-[38px] min-h-0 flex-[0_1_420px]"
                className="text-sm"
                icon={<MagnifyingGlassIcon size={16} className="text-fg-3" aria-hidden="true" />}
                type="search"
                value={q}
                placeholder={T.search}
                aria-label={T.searchLabel}
                onChange={(e) => setQ(e.target.value)}
              />
              <Menu
                align="end"
                label={T.account}
                className="ml-auto"
                trigger={(p) => (
                  <button type="button" {...p} ref={p.ref} aria-label={name} className="kd-mb ml-auto flex size-8 shrink-0 items-center justify-center rounded-full bg-info text-xs text-on-accent" onClick={() => { p.onClick(); if (!options) FF.maybe(FF.get('/admin/impersonation/options'), { items: [] }).then((o: { items: NonNullable<typeof options> }) => setOptions(o.items)); }}>
                    <span className="kd-av-i" data-i={initials} aria-hidden="true" />
                  </button>
                )}
              >
                <MenuHeader><span className="kd-m">{T.viewAs}</span></MenuHeader>
                {(options ?? []).map((o) => <MenuItem key={o.id} aside={o.role[lang]} onSelect={() => startViewAs(o)}>{o.name}</MenuItem>)}
                <MenuSeparator />
                <MenuItem onSelect={async () => { await kd.signOut(); location.assign('/console'); }}>{T.signOut}</MenuItem>
              </Menu>
            </header>
            {viewing ? (
              <div className="flex items-center gap-3 bg-warn px-4 py-2 text-on-inverse" role="status">
                <span className="kd-hs text-on-inverse">{fill(T.viewingAs, { n: viewing })}</span>
                <button type="button" className="kd-btn kd-btn-sm kd-btn-dark ml-auto" onClick={endViewAs}>{T.viewAsExit}</button>
              </div>
            ) : null}
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </div>
        </Shell>
      </AskHost>
    </Ctx.Provider>
  );
}
