'use client';
/**
 * The artist studio (/studio/artist/…) in Kính đêm: the artist mode of /ops. One root for every
 * screen: the gate (signed in, with an artist profile switched on; a pending claim waits, a
 * turned-off profile can be turned back on, anyone else is offered the artist role picker), the
 * side rail (the artist and their public page, the screens, Studio when the account also
 * organises, sign out) and the confirm dialog the screens ask through.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  ArrowSquareOutIcon, CalendarCheckIcon, HeadphonesIcon, MegaphoneIcon, MicrophoneStageIcon, SignOutIcon, StorefrontIcon,
} from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { pick, type Lang } from '../copy';
import { KdProvider, useKd } from '../runtime';
import { place } from '../app/place';
import { buttonClass } from '../ui/actions';
import { Avatar, Card as Panel } from '../ui/parts';
import { Shell, SideNav } from '../ui/shell';
import { AskHost } from '../console/kit';
import { ARTIST } from './copy';

export type ArtistScreen = 'profile' | 'gigs' | 'opportunities' | 'gear';
const SCREENS: ArtistScreen[] = ['gigs', 'opportunities', 'gear'];

/** What /auth/session says about the artist persona (services/roles.ts personasOf). */
interface Personas {
  roles?: { artist: 'active' | 'pending' | 'disabled' | null; organizer: string | null };
  artist?: { id: string; slug: string; name: string } | null;
  organizers?: unknown[];
}
export interface ArtistRef { id: string; slug: string; name: string }

interface ArtistCtx { lang: Lang; artist: ArtistRef }
const Ctx = createContext<ArtistCtx | null>(null);
export function useArtist(): ArtistCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useArtist outside ArtistRoot');
  return v;
}

export function ArtistRoot({ children }: { children: ReactNode }) {
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
  const T = pick(ARTIST, lang);
  const [busy, setBusy] = useState(false);
  const s = kd.session as (typeof kd.session & Personas) | null | undefined;
  if (s === undefined) return <div className="kd-skel m-6 h-60" aria-hidden="true" />;
  const state = s?.roles?.artist ?? null;
  if (s?.user && state === 'active' && s.artist) return <Studio lang={lang} artist={s.artist} organizes={!!s.organizers?.length}>{children}</Studio>;

  const turnOn = async () => {
    setBusy(true);
    try { await FF.put('/me/roles/artist'); await kd.refresh(); } catch (e) { kd.toast(FF.errorText(e, lang)); }
    setBusy(false);
  };
  return (
    <div className="flex min-h-dvh items-center justify-center p-4" data-ff-gate>
      <Panel className="flex w-full max-w-[420px] flex-col items-start gap-4 p-7">
        <span className="flex items-center gap-2.5"><img src="/kd/ff-mark.svg" alt="FeestFinder" width={14} height={24} /><span className="kd-m text-paper">{T.studio}</span></span>
        <h1 className="kd-d3">{!s?.user ? T.gate : state === 'pending' ? T.pending : state === 'disabled' ? T.disabled : T.noArtist}</h1>
        <div className="flex flex-wrap gap-2">
          {!s?.user
            ? <button type="button" className={buttonClass({ tone: 'acc' })} onClick={() => kd.openSignIn(T.gate)}>{T.signIn}</button>
            : state === 'pending' ? null
            : state === 'disabled' && s.artist
              ? <button type="button" className={buttonClass({ tone: 'acc' })} disabled={busy} onClick={turnOn}>{T.turnOn}</button>
              : <button type="button" className={buttonClass({ tone: 'acc' })} onClick={() => kd.openRolePicker('artist')}>{T.create}</button>}
          {s?.user ? <button type="button" className={buttonClass({})} onClick={() => kd.signOut()}>{T.switchAccount}</button> : null}
        </div>
      </Panel>
    </div>
  );
}

function Studio({ lang, artist, organizes, children }: { lang: Lang; artist: ArtistRef; organizes: boolean; children: ReactNode }) {
  const T = pick(ARTIST, lang);
  const kd = useKd();
  const path = usePathname() ?? '/studio/artist';
  const seg = path.split('/')[3] as ArtistScreen | undefined;
  const current: ArtistScreen = seg && SCREENS.includes(seg) ? seg : 'profile';
  const i = (Icon: typeof MicrophoneStageIcon) => <Icon size={18} aria-hidden="true" />;
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
          <a className="kd-sn-hide kd-lrow mb-2 min-h-13 rounded-lg border-b-0 px-2.5 shadow-[inset_0_0_0_1px_var(--color-line)]" href={'/a/' + artist.slug}>
            <Avatar name={artist.name} size={30} />
            <span className="flex min-w-0 flex-1 flex-col"><span className="kd-hs kd-ell text-sm">{artist.name}</span><span className="kd-s text-xs">{T.publicProfile}</span></span>
          </a>
        </>
      )}
      items={[
        { key: 'profile', label: T.profile, href: '/studio/artist', icon: i(MicrophoneStageIcon) },
        { key: 'gigs', label: T.gigs, href: '/studio/artist/gigs', icon: i(CalendarCheckIcon) },
        { key: 'opportunities', label: T.opportunities, href: '/studio/artist/opportunities', icon: i(MegaphoneIcon) },
        { key: 'gear', label: T.gear, href: '/studio/artist/gear', icon: i(HeadphonesIcon) },
      ]}
      footer={(
        <div className="kd-sn-hide mt-auto flex flex-col gap-0.5 border-t border-line pt-4">
          {organizes ? <a className="kd-sn" href="/studio">{i(StorefrontIcon)}{T.toStudio}</a> : null}
          <a className="kd-sn" href="/" target="_blank" rel="noopener">{i(ArrowSquareOutIcon)}{T.toSite}</a>
          <button type="button" className="kd-sn w-full text-left" onClick={async () => { await kd.signOut(); location.assign('/studio/artist'); }}>{i(SignOutIcon)}{T.signOut}</button>
        </div>
      )}
    />
  );
  return (
    <Ctx.Provider value={{ lang, artist }}>
      <AskHost lang={lang}>
        <Shell nav={nav}>{children}</Shell>
      </AskHost>
    </Ctx.Provider>
  );
}
