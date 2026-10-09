'use client';
/**
 * The app (/app/…) in Kính đêm: one root for every rebuilt app screen. It keeps the session,
 * the language this device picked (Vietnamese unless it chose English), the service worker
 * that keeps tickets working offline, and the tab bar. Each screen fetches what is personal in
 * the browser; the app is never indexed.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { CompassIcon, HeartIcon, MapTrifoldIcon, TicketIcon, UserIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { forgetDevice, registerServiceWorker } from '@/runtime/pwa';
import { pick, type Lang } from '../copy';
import { KdProvider } from '../runtime';
import { TabBar } from '../ui/shell';
import { APP } from './copy';
import { place } from './place';

export type AppTab = 'explore' | 'map' | 'saved' | 'tickets' | 'me' | null;

interface AppChrome { lang: Lang; setLang: (l: Lang) => void; setTabs: (on: boolean) => void }
const ChromeCtx = createContext<AppChrome>({ lang: 'vi', setLang: () => {}, setTabs: () => {} });
/** The app's language and the way to change it (Settings), and the tab bar's switch (onboarding hides it). */
export const useApp = () => useContext(ChromeCtx);

export function AppRoot({ tab, children }: { tab: AppTab; children: (lang: Lang) => ReactNode }) {
  const [lang, setLangState] = useState<Lang>('vi');
  const [tabs, setTabs] = useState(true);
  useEffect(() => {
    const saved = place.lang();
    if (saved) setLangState(saved);
    registerServiceWorker();
    // Signing out stops this browser's notifications.
    FF.beforeSignOut = forgetDevice;
  }, []);
  const setLang = (l: Lang) => { place.setLang(l); setLangState(l); };
  return (
    <ChromeCtx.Provider value={{ lang, setLang, setTabs }}>
      <KdProvider lang={lang}>
        <div className={tab && tabs ? 'kd-app kd-app-tabs' : 'kd-app'} lang={lang}>
          {children(lang)}
        </div>
        {tab && tabs ? <AppTabs lang={lang} current={tab} /> : null}
      </KdProvider>
    </ChromeCtx.Provider>
  );
}

function AppTabs({ lang, current }: { lang: Lang; current: Exclude<AppTab, null> }) {
  const T = pick(APP, lang);
  const i = (Icon: typeof CompassIcon) => <Icon size={22} aria-hidden="true" />;
  return (
    <TabBar
      label={T.mainNav}
      current={current}
      items={[
        { key: 'explore', label: T.tabExplore, href: '/app', icon: i(CompassIcon) },
        { key: 'map', label: T.tabMap, href: '/app/list', icon: i(MapTrifoldIcon) },
        { key: 'saved', label: T.tabSaved, href: '/app/saved', icon: i(HeartIcon) },
        { key: 'tickets', label: T.tabTickets, href: '/app/tickets', icon: i(TicketIcon) },
        { key: 'me', label: T.tabMe, href: '/app/profile', icon: i(UserIcon) },
      ]}
    />
  );
}
