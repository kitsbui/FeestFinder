'use client';
/**
 * The public site's frame (design v2 phase 1, artboard 03 of the design review): one frame for
 * every public page, the same addresses.
 * - A computer: one bar with the logo, the four places (Sự kiện, Nghệ sĩ, Dự án, Nhà tổ chức), the
 *   search field (⌘K or Ctrl+K; an icon below 1200px), VI · EN, "Đăng sự kiện" (straight to the
 *   wizard) and the account menu, "Tôi" (web/me.tsx).
 * - A phone: the logo and "Đăng sự kiện" on top, and the tab bar at the bottom: Sự kiện, Bản đồ,
 *   Tìm (a sheet with the search, the other places and the styles), Đã lưu, Tôi (/profile, the hub).
 * - The one-line footer, and the breadcrumbs of a detail page.
 * Styles are filters of the list, not a place: the list's bar and the search sheet offer them.
 */
import { KdLink as Link, inLang } from '../link';
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type RefObject } from 'react';
import { CalendarBlankIcon, CaretRightIcon, HeartIcon, MagnifyingGlassIcon, MapTrifoldIcon, UserIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../copy';
import { cx } from '../cx';
import { g, styleChips, styleLabel } from '../genre';
import { useKd } from '../runtime';
import { buttonClass, IconButton } from '../ui/actions';
import { Menu } from '../ui/menu';
import { Avatar } from '../ui/parts';
import { Sheet } from '../ui/sheet';
import { Input } from '../ui/forms';
import { Logo } from '../ui/logo';
import { TabBar } from '../ui/shell';
import { WEB } from './copy';
import { LANG_KEY, rememberLang, useHere, useOtherLang } from './lang';
import { MeMenuItems } from './me';

/** Which place the page is: it marks the nav link and the tab. */
export type WebSection = 'list' | 'artists' | 'projects' | 'saved' | 'me' | 'none';

/** Where a style leads: every upcoming event of it (the list), the same events its count counts. Only music styles: price is a filter, not a style. */
export const styleHref = (k: string, lang: Lang = 'vi') => inLang(`/?style=${k}`, lang);

/** Which ways in people use (the design funnel): the nav, the tab bar, the search sheet, the footer. */
const track = (kind: string, surface: string) => () => FF.track('nav_click', { kind, surface });

/** Whether this is a Mac (⌘K) or not (Ctrl K); the server says ⌘. */
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform);
const never = () => () => {};

export function WebNav({ lang, current = 'none' }: { lang: Lang; current?: WebSection }) {
  const kd = useKd();
  const T = pick(WEB, lang);
  const [search, setSearch] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const user = kd.user;

  // ⌘K / Ctrl+K: the bar's field when it is there, else the search sheet.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return;
      e.preventDefault();
      if (field.current && field.current.offsetParent !== null) field.current.focus();
      else setSearch(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const place = (key: WebSection, href: string, label: string, kind: string) => (
    <Link className="kd-nl" href={inLang(href, lang)} aria-current={current === key ? 'page' : undefined} onClick={track(kind, 'nav')}>{label}</Link>
  );
  return (
    <>
      <header className="kd-nav">
        <div className="kd-wrap flex h-14 items-center gap-2 desk:h-16">
          <Logo lang={lang} height={20} className="mr-2 desk:mr-3" />
          <nav aria-label={T.mainNav} className="hidden items-center gap-0.5 desk:flex">
            {place('list', '/', T.events, 'events')}
            {place('artists', '/a', T.artists, 'artists')}
            {place('projects', '/p', T.projects, 'projects')}
            <a className="kd-nl" href="/studio" onClick={track('organisers', 'nav')}>{T.organisers}</a>
          </nav>
          <NavSearch lang={lang} field={field} />
          <div className="ml-auto flex items-center gap-1.5">
            <IconButton label={T.search} className="hidden desk:inline-flex wide:hidden" aria-haspopup="dialog" onClick={() => { track('search', 'nav')(); setSearch(true); }}>
              <MagnifyingGlassIcon size={20} aria-hidden="true" />
            </IconButton>
            <LangSwitch lang={lang} className="hidden desk:inline-flex" />
            {/* Straight to the wizard (owner, 2026-10-17); a project starts from /p. Outlined: the page's own action is the one primary on the screen. */}
            <Link className={buttonClass({ size: 'sm' })} href="/studio/new" onClick={track('post', 'nav')}>{T.listEvent}</Link>
            {user ? (
              <div className="hidden desk:block">
              <Menu
                label={T.account}
                align="end"
                trigger={(p) => (
                  <button type="button" {...p} ref={p.ref} aria-label={T.account} className="flex h-11 w-11 items-center justify-center rounded-full">
                    <Avatar name={user.name || user.email || '?'} size={32} acc />
                  </button>
                )}
              >
                <MeMenuItems lang={lang} name={user.name || T.you} />
              </Menu>
              </div>
            ) : kd.session === undefined ? (
              <span className="hidden h-11 w-11 desk:block" aria-hidden="true" />
            ) : (
              <button type="button" className={buttonClass({ size: 'sm', tone: 'ghost' }, 'hidden desk:inline-flex')} onClick={() => { track('sign-in', 'nav')(); kd.openSignIn(); }}>{T.signIn}</button>
            )}
          </div>
        </div>
      </header>
      <WebTabs lang={lang} current={current} onSearch={() => { track('search', 'tabs')(); setSearch(true); }} />
      {search ? <SearchSheet lang={lang} onClose={() => setSearch(false)} /> : null}
    </>
  );
}

/** The search field in the bar (from 1200px): a search of the list, named by the shortcut that reaches it. */
function NavSearch({ lang, field }: { lang: Lang; field: RefObject<HTMLInputElement | null> }) {
  const T = pick(WEB, lang);
  const [q, setQ] = useState('');
  const mac = useSyncExternalStore(never, isMac, () => true);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    FF.track('search', { screen: 'nav' });
    location.assign(inLang('/?q=' + encodeURIComponent(v), lang));
  };
  return (
    <form role="search" aria-label={T.search} onSubmit={submit} className="hidden min-w-0 flex-1 justify-center px-6 wide:flex">
      <Input
        ref={field}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={T.searchPh}
        aria-label={T.search}
        aria-keyshortcuts="Meta+K Control+K"
        boxClass="h-10 min-h-0 w-full max-w-md"
        className="text-sm"
        icon={<MagnifyingGlassIcon size={16} className="text-fg-3" aria-hidden="true" />}
        end={<kbd className="kd-kbd" aria-hidden="true">{mac ? '⌘K' : 'Ctrl K'}</kbd>}
      />
    </form>
  );
}

/** VI · EN: the same page in the other language, the current one lit. */
function LangSwitch({ lang, className }: { lang: Lang; className?: string }) {
  const other = useOtherLang(lang);
  const next: Lang = lang === 'vi' ? 'en' : 'vi';
  return (
    <a className={cx('kd-nl', className)} href={other} hrefLang={next} onClick={() => { FF.track('nav_click', { kind: 'lang', surface: 'nav' }); rememberLang(next); }}>
      <span className={lang === 'vi' ? 'text-fg-1' : 'text-fg-3'}>VI</span>
      <span aria-hidden="true" className="text-fg-3">·</span>
      <span className={lang === 'en' ? 'text-fg-1' : 'text-fg-3'}>EN</span>
      <span className="sr-only">{lang === 'vi' ? ', English' : ', Tiếng Việt'}</span>
    </a>
  );
}

/** The phone's tab bar: below 900px, on every public page. */
function WebTabs({ lang, current, onSearch }: { lang: Lang; current: WebSection; onSearch: () => void }) {
  const T = pick(WEB, lang);
  const here = useHere();
  const onMap = current === 'list' && /[?&]view=map\b/.test(here);
  const tab = current === 'list' ? (onMap ? 'map' : 'events') : current === 'saved' ? 'saved' : current === 'me' ? 'me' : '';
  const i = (Icon: typeof UserIcon) => <Icon size={22} aria-hidden="true" />;
  return (
    <TabBar
      edge
      label={T.mainNav}
      current={tab}
      items={[
        // The list's own views: a full load, so the list reads its address again.
        { key: 'events', label: T.events, href: inLang('/', lang), external: true, icon: i(CalendarBlankIcon), onClick: track('events', 'tabs') },
        { key: 'map', label: T.map, href: inLang('/?view=map', lang), external: true, icon: i(MapTrifoldIcon), onClick: track('map', 'tabs') },
        { key: 'search', label: T.searchTab, icon: i(MagnifyingGlassIcon), onClick: onSearch, dialog: true },
        { key: 'saved', label: T.saved, href: inLang('/saved', lang), icon: i(HeartIcon), onClick: track('saved', 'tabs') },
        { key: 'me', label: T.me, href: inLang('/profile', lang), icon: i(UserIcon), onClick: track('me', 'tabs') },
      ]}
    />
  );
}

/** "Tìm": the search, then the places the tab bar has no room for, then the styles (filters of the list). */
function SearchSheet({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const T = pick(WEB, lang);
  const [q, setQ] = useState('');
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    // Counted over every upcoming event, as the links lead to all of them.
    FF.once('kd:style-counts', () => FF.maybe(FF.get('/events?time=all&upcoming=1&limit=1'), null)).then((r: { facets?: { style?: Record<string, number> } } | null) => {
      if (r?.facets?.style) setCounts(r.facets.style);
    });
  }, []);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    FF.track('search', { screen: 'nav' });
    location.assign(inLang('/?q=' + encodeURIComponent(v), lang));
  };
  const go = ([kind, href, label]: readonly [string, string, string]) => (
    <a key={kind} href={href} onClick={track(kind, 'search')} className="kd-lrow min-h-13">
      <span className="kd-h min-w-0 flex-1">{label}</span>
      <CaretRightIcon size={16} className="text-fg-3" aria-hidden="true" />
    </a>
  );
  return (
    <Sheet title={T.search} closeLabel={T.close} onClose={onClose}>
      <form role="search" onSubmit={submit} className="flex flex-col gap-3 pt-2">
        <Input
          type="search"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={T.searchPh}
          aria-label={T.search}
          icon={<MagnifyingGlassIcon size={18} aria-hidden="true" />}
        />
        <button type="submit" className={buttonClass({ tone: 'acc', block: true })}>{T.searchGo}</button>
      </form>
      <nav aria-label={T.goTo} className="mt-5 flex flex-col">
        {([['artists', inLang('/a', lang), T.artists], ['projects', inLang('/p', lang), T.projects], ['organisers', '/studio', T.organisers]] as const).map(go)}
      </nav>
      <h3 className="kd-m mb-2.5 mt-5">{T.genres}</h3>
      <div className="flex flex-wrap gap-2">
        {styleChips(counts, 10).map((k) => (
          <a key={k} href={styleHref(k, lang)} className="kd-chip" onClick={track('style', 'search')}>
            <span className={`kd-mk ${g('edm')}`} aria-hidden="true" />{styleLabel(k, lang)}
            {counts?.[k] != null ? <span className="kd-num text-fg-3">{counts[k]}</span> : null}
          </a>
        ))}
      </div>
    </Sheet>
  );
}

/** The one-line footer: the logo, a few links, the other language, the company line. */
export function WebFooter({ lang, otherLang }: { lang: Lang; otherLang?: { href: string; label: string } | null }) {
  const T = pick(WEB, lang);
  // The language picked before on this device: a page in Vietnamese by default moves to its
  // English address. An address that says ?lang=en is never moved back.
  useEffect(() => {
    if (!otherLang || lang !== 'vi') return;
    let saved: string | null = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch { /* storage blocked */ }
    if (saved === 'en') location.replace(otherLang.href);
  }, [lang, otherLang]);
  const foot = (kind: string) => track(kind, 'footer');
  return (
    <footer className="mt-14 border-t border-line-1 tab:mt-24">
      <div className="kd-wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-6">
        <Logo lang={lang} height={18} />
        <nav aria-label={T.footerNav} className="-mx-2.5 flex flex-wrap items-center gap-0.5">
          <a className="kd-nl" href="/studio" onClick={foot('organisers')}>{T.forOrganisers}</a>
          <a className="kd-nl" href={inLang('/p', lang)} onClick={foot('projects')}>{T.projects}</a>
          <a className="kd-nl" href={inLang('/about', lang)} onClick={foot('about')}>{T.about}</a>
          <a className="kd-nl" href={inLang('/advertise', lang)} onClick={foot('advertise')}>{T.advertise}</a>
          {/* Opens the feedback sheet (kd/feedback/widget.tsx). */}
          <button type="button" className="kd-nl" onClick={() => window.dispatchEvent(new Event('ff:feedback'))}>{T.feedback}</button>
          <a className="kd-nl" href="mailto:hello@feestfinder.com">hello@feestfinder.com</a>
          {otherLang ? <a className="kd-nl" href={otherLang.href} hrefLang={lang === 'vi' ? 'en' : 'vi'} onClick={() => rememberLang(lang === 'vi' ? 'en' : 'vi')}>{otherLang.label}</a> : null}
        </nav>
        <span className="kd-m">{fill(T.company, { y: new Date().getFullYear() })}</span>
      </div>
    </footer>
  );
}

/**
 * Where a detail page sits: its list, then the page ("Sự kiện ở TP.HCM › Ravolution"). The home
 * crumb the search engines get (services/seo.ts) is the logo here; a page one step from home shows none.
 */
export function Crumbs({ items, label }: { items: { name: string; href?: string }[]; label: string }) {
  const shown = items.filter((c, i) => !(i === 0 && c.name === 'FeestFinder'));
  if (shown.length < 2) return null;
  return (
    <nav aria-label={label} className="kd-wrap flex min-h-12 flex-wrap items-center gap-2 kd-s">
      {shown.map((c, i) => (
        <span key={i} className="flex min-w-0 items-center gap-2">
          {i ? <CaretRightIcon size={12} className="shrink-0 text-fg-3" aria-hidden="true" /> : null}
          {c.href ? <Link href={c.href} className="text-fg-3 hover:text-fg-1">{c.name}</Link> : <span className="kd-ell text-fg-2" aria-current="page">{c.name}</span>}
        </span>
      ))}
    </nav>
  );
}
