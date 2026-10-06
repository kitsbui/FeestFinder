'use client';
/**
 * The Console (/console/…) in Kính đêm (Console-Moderation, Console-Insights): the team's back
 * office. One root for every tab: the admin gate (an admin session only; admin comes from the
 * allowlist on a Google sign-in, never from here), the top bar with the search and the account
 * menu (View as, log out), and the tab row with its counts.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { KdProvider, useKd } from '../runtime';
import { place } from '../app/place';
import { buttonClass } from '../ui/actions';
import { Input } from '../ui/forms';
import { Menu, MenuHeader, MenuItem, MenuSeparator } from '../ui/menu';
import { Card as Panel } from '../ui/parts';
import { Tabs } from '../ui/shell';
import { CONSOLE } from './copy';

export type ConsoleTab = 'queue' | 'verification' | 'reports' | 'featured' | 'insights' | 'audit';
interface Counts { queue: number; verification: number; reports: number; ads: number; appeals: number }

interface ConsoleCtx { lang: Lang; q: string; counts: Counts | null; refreshCounts: () => void }
const Ctx = createContext<ConsoleCtx | null>(null);
export function useConsole(): ConsoleCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useConsole outside ConsoleRoot');
  return v;
}

const TABS: ConsoleTab[] = ['verification', 'reports', 'featured', 'insights', 'audit'];

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
  const user = kd.user as (NonNullable<typeof kd.user> & { role?: string; adminNeedsGoogle?: boolean }) | null;
  if (kd.session === undefined) return <div className="kd-skel m-6 h-60" aria-hidden="true" />;
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4" data-ff-gate>
        <Panel className="flex w-full max-w-[420px] flex-col items-start gap-4 p-7">
          <span className="flex items-center gap-2.5"><img src="/kd/ff-mark.svg" alt="FeestFinder" width={14} height={24} /><span className="kd-m text-paper">{T.console}</span></span>
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
  const seg = path.split('/')[2] as ConsoleTab | undefined;
  const current: ConsoleTab = seg && TABS.includes(seg) ? seg : 'queue';
  const [counts, setCounts] = useState<Counts | null>(null);
  const [q, setQ] = useState('');
  const [viewing, setViewing] = useState<string | null>(null);
  const [options, setOptions] = useState<{ targetType: 'user' | 'organizer'; id: string; name: string; role: Pair }[] | null>(null);
  const refreshCounts = useCallback(() => { FF.maybe(FF.get('/admin/counts'), null).then(setCounts); }, []);
  useEffect(() => { refreshCounts(); }, [refreshCounts]);
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

  return (
    <Ctx.Provider value={{ lang, q, counts, refreshCounts }}>
      <div className="flex min-h-dvh flex-col">
        <header className="flex h-15 items-center gap-3.5 bg-carbon px-4">
          <img src="/kd/ff-mark.svg" alt="FeestFinder" width={14} height={24} />
          <span className="kd-m text-paper">{T.console}</span>
          <Input
            boxClass="ml-auto h-[38px] min-h-0 flex-[0_1_420px]"
            className="text-sm"
            icon={<MagnifyingGlassIcon size={16} className="text-fog" aria-hidden="true" />}
            type="search"
            value={q}
            placeholder={T.search}
            aria-label={T.searchLabel}
            onChange={(e) => setQ(e.target.value)}
          />
          <Menu
            align="end"
            label={T.account}
            trigger={(p) => (
              <button type="button" {...p} ref={p.ref} aria-label={name} className="kd-mb flex size-8 shrink-0 items-center justify-center rounded-full bg-acc text-xs text-acc-ink" onClick={() => { p.onClick(); if (!options) FF.maybe(FF.get('/admin/impersonation/options'), { items: [] }).then((o: { items: NonNullable<typeof options> }) => setOptions(o.items)); }}>
                {initials}
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
          <div className="flex items-center gap-3 bg-warn px-4 py-2 text-ink" role="status">
            <span className="kd-hs text-ink">{fill(T.viewingAs, { n: viewing })}</span>
            <button type="button" className="kd-btn kd-btn-sm kd-btn-dark ml-auto" onClick={endViewAs}>{T.viewAsExit}</button>
          </div>
        ) : null}
        <nav aria-label={T.console} className="bg-carbon px-2">
          <Tabs
            label={T.console}
            current={current}
            className="border-b-0"
            items={[
              { key: 'queue', label: T.tabQueue, href: '/console', count: n(counts ? counts.queue : undefined) },
              { key: 'verification', label: T.tabVerify, href: '/console/verification', count: n(counts?.verification) },
              { key: 'reports', label: T.tabReports, href: '/console/reports', count: n(counts?.reports) },
              { key: 'featured', label: T.tabFeatured, href: '/console/featured', count: n(counts?.ads) },
              { key: 'insights', label: T.tabInsights, href: '/console/insights' },
              { key: 'audit', label: T.tabAudit, href: '/console/audit' },
            ]}
          />
        </nav>
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </Ctx.Provider>
  );
}
