'use client';
/**
 * "Tôi": a signed-in person's own places, one list shown in two places: the account menu on a
 * computer (web/chrome.tsx) and the hub at the top of /profile on a phone, where the tab bar's "Tôi"
 * leads. Their tickets, saved events, follows, projects and notifications; the workspaces
 * (ui/workspaces.tsx); then the language, settings, feedback and signing out.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { CaretRightIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { COMMON, pick, type Lang } from '../copy';
import { CRAFT } from '../craft';
import { inLang } from '../link';
import { useKd } from '../runtime';
import { MenuHeader, MenuItem, MenuSeparator } from '../ui/menu';
import { WorkspaceItems, WorkspaceRows } from '../ui/workspaces';
import { WEB } from './copy';
import { rememberLang, useOtherLang } from './lang';

export interface MeCounts { tickets: number; saved: number; handle: string }

/** The counts beside "Vé" and "Đã lưu", asked once per page. */
export function useMeCounts(): MeCounts | null {
  const kd = useKd();
  const [me, setMe] = useState<MeCounts | null>(null);
  useEffect(() => {
    if (!kd.user) return;
    FF.once('kd:me', () => FF.maybe(FF.get('/me'), null)).then((r: { counts: { tickets: number; saved: number }; user: { email?: string; phone?: string } } | null) => {
      if (r) setMe({ tickets: r.counts.tickets, saved: r.counts.saved, handle: r.user.email || r.user.phone || '' });
    });
  }, [kd.user]);
  return kd.user ? me : null;
}

interface Place { key: string; label: string; href: string; aside?: number | null }

/** Their own places, in the order of the hub. */
function places(lang: Lang, me: MeCounts | null): Place[] {
  const T = pick(WEB, lang);
  return [
    { key: 'tickets', label: T.myTickets, href: '/app/tickets', aside: me?.tickets ?? null },
    { key: 'saved', label: T.saved, href: inLang('/saved', lang), aside: me?.saved ?? null },
    { key: 'following', label: T.following, href: '/app/following' },
    { key: 'projects', label: T.myProjects, href: inLang('/p/mine', lang) },
    { key: 'notifications', label: T.notifications, href: '/app/notifications' },
    { key: 'alerts', label: T.alerts, href: '/app/alerts' },
  ];
}

const feedback = () => window.dispatchEvent(new Event('ff:feedback'));

/** The account menu's items (a computer). */
export function MeMenuItems({ lang, name }: { lang: Lang; name: string }) {
  const kd = useKd();
  const T = pick(WEB, lang);
  const me = useMeCounts();
  return (
    <>
      <MenuHeader>
        <span className="flex flex-col gap-0.5 border-b border-line-1 pb-2.5">
          <span className="kd-hs kd-ell">{name}</span>
          {me?.handle ? <span className="kd-m kd-ell normal-case">{me.handle}</span> : null}
        </span>
      </MenuHeader>
      <MenuItem href={inLang('/profile', lang)}>{T.myProfile}</MenuItem>
      {places(lang, me).map((p) => <MenuItem key={p.key} href={p.href} external aside={p.aside}>{p.label}</MenuItem>)}
      <MenuSeparator />
      <WorkspaceItems lang={lang} current="fan" />
      <MenuSeparator />
      <MenuItem href="/app/settings" external>{T.settings}</MenuItem>
      <MenuItem onSelect={feedback}>{T.feedback}</MenuItem>
      <MenuItem onSelect={() => kd.signOut()}>{T.signOut}</MenuItem>
    </>
  );
}

function Row({ href, onClick, children, aside, hrefLang }: { href?: string; onClick?: () => void; children: ReactNode; aside?: ReactNode; hrefLang?: string }) {
  const body = (
    <>
      <span className="kd-h min-w-0 flex-1 kd-ell">{children}</span>
      {aside != null ? <span className="kd-s kd-num">{aside}</span> : null}
      <CaretRightIcon size={16} className="shrink-0 text-fg-3" aria-hidden="true" />
    </>
  );
  return href
    ? <a href={href} hrefLang={hrefLang} onClick={onClick} className="kd-lrow min-h-13">{body}</a>
    : <button type="button" onClick={onClick} className="kd-lrow min-h-13 w-full text-left">{body}</button>;
}

/** The hub at the top of /profile: what the account menu holds, as a page (a phone). */
export function MeHub({ lang, className }: { lang: Lang; className?: string }) {
  const kd = useKd();
  const T = pick(WEB, lang);
  const K = pick(CRAFT, lang);
  const me = useMeCounts();
  const other = useOtherLang(lang);
  const next: Lang = lang === 'vi' ? 'en' : 'vi';
  return (
    <nav aria-label={T.me} className={className}>
      <div className="flex flex-col">
        {places(lang, me).map((p) => <Row key={p.key} href={p.href} aside={p.aside}>{p.label}</Row>)}
      </div>
      <h2 className="kd-m mb-1 mt-6">{K.workspaces}</h2>
      <div className="flex flex-col">
        <WorkspaceRows lang={lang} current="fan" row={(w) => (
          <Row key={w.key} href={w.href} onClick={w.onSelect} aside={w.current ? T.here : w.aside}>{w.label}</Row>
        )} />
      </div>
      <h2 className="kd-m mb-1 mt-6">{T.more}</h2>
      <div className="flex flex-col">
        <Row href={other} hrefLang={next} onClick={() => rememberLang(next)} aside={lang === 'vi' ? 'Tiếng Việt' : 'English'}>{T.language}</Row>
        <Row href="/app/settings">{T.settings}</Row>
        <Row onClick={feedback}>{T.feedback}</Row>
        <Row onClick={() => kd.signOut()}>{pick(COMMON, lang).signOut}</Row>
      </div>
    </nav>
  );
}
