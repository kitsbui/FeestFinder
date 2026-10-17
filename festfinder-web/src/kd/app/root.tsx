'use client';
/**
 * The app's screens (/app/…: tickets, checkout, notifications, settings, the group plan, the
 * guide, live mode, recap) in the site's own frame since design v2 phase 4: the site's nav on top
 * and, on a phone, its tab bar at the bottom, so buying a ticket from the list never changes frame.
 * The app's discovery (Khám phá, its map, saved, profile, event) moved into the site and those
 * addresses redirect there (app/moved.ts). The root keeps the session, the language this device
 * picked (?lang= on the address wins), and the service worker that keeps tickets working offline.
 * Each screen fetches what is personal in the browser; the app is never indexed.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { FF } from '@/runtime/ff';
import { forgetDevice, registerServiceWorker } from '@/runtime/pwa';
import type { Lang } from '../copy';
import { KdProvider } from '../runtime';
import { WebNav, type WebSection } from '../web/chrome';
import { place } from './place';

/** Which of the site's places a screen belongs to: it lights that tab. */
export type AppTab = 'saved' | 'tickets' | 'me' | null;

interface AppChrome { lang: Lang; setLang: (l: Lang) => void }
const ChromeCtx = createContext<AppChrome>({ lang: 'vi', setLang: () => {} });
/** The app's language and the way to change it (Settings). */
export const useApp = () => useContext(ChromeCtx);

const SECTION: Record<Exclude<AppTab, null>, WebSection> = { saved: 'saved', tickets: 'me', me: 'me' };

export function AppRoot({ tab, children }: { tab: AppTab; children: (lang: Lang) => ReactNode }) {
  const [lang, setLangState] = useState<Lang>('vi');
  useEffect(() => {
    // The site's language link (VI · EN) says ?lang=; otherwise what this device chose before.
    const asked = new URLSearchParams(location.search).get('lang');
    if (asked === 'en' || asked === 'vi') place.setLang(asked);
    const saved = asked === 'en' || asked === 'vi' ? asked : place.lang();
    if (saved) setLangState(saved);
    registerServiceWorker();
    // Signing out stops this browser's notifications.
    FF.beforeSignOut = forgetDevice;
  }, []);
  const setLang = (l: Lang) => { place.setLang(l); setLangState(l); };
  return (
    <ChromeCtx.Provider value={{ lang, setLang }}>
      <KdProvider lang={lang}>
        <WebNav lang={lang} current={tab ? SECTION[tab] : 'none'} />
        <main className="kd-app" lang={lang}>
          {children(lang)}
        </main>
      </KdProvider>
    </ChromeCtx.Provider>
  );
}
