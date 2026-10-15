'use client';
/**
 * The public site's frame: the sticky glass nav (Khám phá, Sự kiện, the Thể loại menu with live
 * counts, search, "Đăng sự kiện" and the account menu; below desk width a Menu button opens the
 * same pages, styles and "Đăng sự kiện" in a sheet), and the one-line footer.
 */
import { KdLink as Link, inLang } from '../link';
import { useEffect, useState, type FormEvent } from 'react';
import { CaretDownIcon, ListIcon, MagnifyingGlassIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../copy';
import { g, styleChips, styleLabel } from '../genre';
import { useKd } from '../runtime';
import { buttonClass, IconButton } from '../ui/actions';
import { Menu, MenuHeader, MenuItem, MenuSeparator } from '../ui/menu';
import { Avatar } from '../ui/parts';
import { Sheet } from '../ui/sheet';
import { Input } from '../ui/forms';
import { CRAFT, WORKSPACE, otherCraft } from '../craft';
import { WEB } from './copy';

/** Which nav link is the current page: 'list' is Sự kiện, in each of its views (table, grid, map). */
export type WebSection = 'explore' | 'list' | 'artists' | 'none';

/** Where the chosen language is kept: the old web screen's key, so a visitor's choice carries over. */
const LANG_KEY = 'ff_lang';

/** Where a style leads: the home page filtered to it. Only music styles: price is a filter, not a style. */
export const styleHref = (k: string, lang: Lang = 'vi') => inLang(`/?style=${k}`, lang);

export function WebNav({ lang, current = 'none', styleCounts }: { lang: Lang; current?: WebSection; styleCounts?: Record<string, number> | null }) {
  const kd = useKd();
  const T = pick(WEB, lang);
  const [counts, setCounts] = useState<Record<string, number> | null>(styleCounts ?? null);
  const [me, setMe] = useState<{ tickets: number; saved: number; handle: string } | null>(null);
  const [search, setSearch] = useState(false);
  const [menu, setMenu] = useState(false);

  const loadCounts = () => {
    if (counts) return;
    FF.once('kd:style-counts', () => FF.maybe(FF.get('/events?time=all&upcoming=1&limit=1'), null)).then((r: any) => {
      if (r?.facets?.style) setCounts(r.facets.style);
    });
  };
  useEffect(() => {
    if (!kd.user) { setMe(null); return; }
    FF.once('kd:me', () => FF.maybe(FF.get('/me'), null)).then((r: any) => {
      if (r) setMe({ tickets: r.counts.tickets, saved: r.counts.saved, handle: r.user.email || r.user.phone || '' });
    });
  }, [kd.user]);

  const user = kd.user;
  const K = pick(CRAFT, lang);
  const roles = kd.session?.roles;
  const craft = kd.session?.craft ?? null;
  return (
    <header className="kd-nav kd-glass">
      <div className="kd-wrap flex h-16 items-center gap-3">
        <Link href={inLang('/', lang)} aria-label={T.home} className="flex h-11 items-center">
          <img src="/kd/ff-wordmark.svg" alt="FeestFinder" width={127} height={22} />
        </Link>
        <nav aria-label={T.mainNav} className="ml-3 hidden items-center gap-0.5 desk:flex">
          <Link className="kd-nl" href={inLang('/', lang)} aria-current={current === 'explore' ? 'page' : undefined}>{T.explore}</Link>
          <Link className="kd-nl" href={inLang('/list', lang)} aria-current={current === 'list' ? 'page' : undefined}>{T.events}</Link>
          <Link className="kd-nl" href={inLang('/a', lang)} aria-current={current === 'artists' ? 'page' : undefined}>{T.artists}</Link>
          <Menu
            label={T.genres}
            trigger={(p) => (
              <button type="button" {...p} ref={p.ref} className="kd-nl" onPointerEnter={loadCounts} onFocus={loadCounts}>
                {T.genres}
                <CaretDownIcon size={14} className="kd-chev" aria-hidden="true" />
              </button>
            )}
          >
            {styleChips(counts, 10).map((k) => (
              <MenuItem key={k} href={styleHref(k, lang)} external aside={counts?.[k] ?? null} icon={<span className={`kd-mk ${g('edm')}`} aria-hidden="true" />}>
                {styleLabel(k, lang)}
              </MenuItem>
            ))}
          </Menu>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <IconButton label={T.search} onClick={() => setSearch(true)}>
            <MagnifyingGlassIcon size={20} aria-hidden="true" />
          </IconButton>
          <a className={buttonClass({ tone: 'light', size: 'sm', pill: true }, 'hidden desk:inline-flex')} href="/studio">{T.listEvent}</a>
          {user ? (
            <Menu
              label={T.account}
              align="end"
              trigger={(p) => (
                <button type="button" {...p} ref={p.ref} aria-label={T.account} className="flex h-11 w-11 items-center justify-center rounded-full">
                  <Avatar name={user.name || user.email || '?'} size={32} acc />
                </button>
              )}
            >
              <MenuHeader>
                <span className="flex flex-col gap-0.5 border-b border-line pb-2.5">
                  <span className="kd-hs kd-ell">{user.name || T.you}</span>
                  {me?.handle ? <span className="kd-m kd-ell normal-case">{me.handle}</span> : null}
                </span>
              </MenuHeader>
              {/* Attending here; the one craft (if any) has its workspace; the other is a switch. */}
              <MenuHeader><span className="kd-m">{K.roles}</span></MenuHeader>
              <MenuItem checked onSelect={() => {}}>{K.attendee}</MenuItem>
              {craft ? (
                <MenuItem checked={false} href={WORKSPACE[craft]} external aside={roles?.[craft] === 'pending' ? K.waiting : null}>{K[craft]}</MenuItem>
              ) : (
                <MenuItem onSelect={() => kd.openRolePicker()}>{K.add}</MenuItem>
              )}
              {craft ? <MenuItem onSelect={() => kd.openRolePicker(otherCraft(craft))}>{fill(K.switchTo, { r: K[otherCraft(craft)] })}</MenuItem> : null}
              <MenuSeparator />
              <MenuItem href={inLang('/profile', lang)}>{T.myProfile}</MenuItem>
              <MenuItem href="/app/tickets" external aside={me ? me.tickets : null}>{T.myTickets}</MenuItem>
              <MenuItem href={inLang('/saved', lang)} external aside={me ? me.saved : null}>{T.saved}</MenuItem>
              <MenuSeparator />
              <MenuItem onSelect={() => kd.signOut()}>{T.signOut}</MenuItem>
            </Menu>
          ) : kd.session === undefined ? (
            <span className="h-11 w-11" aria-hidden="true" />
          ) : (
            <button type="button" className={buttonClass({ size: 'sm', tone: 'ghost' })} onClick={() => kd.openSignIn()}>{T.signIn}</button>
          )}
          <IconButton label={T.menu} className="desk:hidden" aria-haspopup="dialog" aria-expanded={menu} onClick={() => { loadCounts(); setMenu(true); }}>
            <ListIcon size={22} aria-hidden="true" />
          </IconButton>
        </div>
      </div>
      {search ? <SearchSheet lang={lang} onClose={() => setSearch(false)} /> : null}
      {menu ? (
        <Sheet title={T.menu} closeLabel={T.close} onClose={() => setMenu(false)}>
          <nav aria-label={T.mainNav} className="flex flex-col gap-0.5 pt-1">
            {([['explore', '/', T.explore], ['list', '/list', T.events], ['artists', '/a', T.artists]] as const).map(([k, href, label]) => (
              <Link
                key={k}
                href={inLang(href, lang)}
                aria-current={current === k ? 'page' : undefined}
                onClick={() => setMenu(false)}
                className="kd-h flex min-h-13 items-center rounded-opt px-3 text-mist hover:bg-white/[0.04] aria-[current=page]:bg-white/[0.06] aria-[current=page]:text-paper"
              >
                {label}
              </Link>
            ))}
          </nav>
          <h3 className="kd-m mt-5 mb-2.5 px-3">{T.genres}</h3>
          <div className="flex flex-wrap gap-2 px-1">
            {styleChips(counts, 10).map((k) => (
              <a key={k} href={styleHref(k, lang)} className="kd-chip">
                <span className={`kd-mk ${g('edm')}`} aria-hidden="true" />{styleLabel(k, lang)}
                {counts?.[k] != null ? <span className="kd-num text-fog">{counts[k]}</span> : null}
              </a>
            ))}
          </div>
          <a href="/studio" className={buttonClass({ tone: 'light', block: true }, 'mt-6')}>{T.listEvent}</a>
        </Sheet>
      ) : null}
    </header>
  );
}

function SearchSheet({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const T = pick(WEB, lang);
  const [q, setQ] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    FF.track('search', { screen: 'nav' });
    location.assign(inLang('/list?q=' + encodeURIComponent(v), lang));
  };
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
    </Sheet>
  );
}

/** The one-line footer: the wordmark, a few links, the other language, the company line. */
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
  const remember = () => { try { localStorage.setItem(LANG_KEY, lang === 'vi' ? 'en' : 'vi'); } catch { /* storage blocked */ } };
  return (
    <footer className="mt-14 border-t border-line tab:mt-24">
      <div className="kd-wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-6">
        <img src="/kd/ff-wordmark.svg" alt="FeestFinder" width={104} height={18} />
        <nav aria-label={T.footerNav} className="flex flex-wrap items-center gap-0.5">
          <a className="kd-nl" href="/studio">{T.forOrganisers}</a>
          <a className="kd-nl" href={inLang('/about', lang)}>{T.about}</a>
          <a className="kd-nl" href={inLang('/advertise', lang)}>{T.advertise}</a>
          <a className="kd-nl" href="mailto:hello@feestfinder.com">hello@feestfinder.com</a>
          {otherLang ? <a className="kd-nl" href={otherLang.href} hrefLang={lang === 'vi' ? 'en' : 'vi'} onClick={remember}>{otherLang.label}</a> : null}
        </nav>
        <span className="kd-m">{fill(T.company, { y: new Date().getFullYear() })}</span>
      </div>
    </footer>
  );
}

/** Where a page sits: Khám phá / family / the page. */
export function Crumbs({ items, label }: { items: { name: string; href?: string }[]; label: string }) {
  return (
    <nav aria-label={label} className="kd-wrap flex min-h-12 flex-wrap items-center gap-2 kd-s">
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-2">
          {i ? <span aria-hidden="true">/</span> : null}
          {c.href ? <Link href={c.href} className="text-fog hover:text-paper">{c.name}</Link> : <span className="text-mist" aria-current="page">{c.name}</span>}
        </span>
      ))}
    </nav>
  );
}
