'use client';
/**
 * The artist directory's list: search, then role, style and city, "taking bookings" and
 * "playing soon", then the artists, next show first (the API's order: who plays soonest, then
 * the fuller profile, then the name; never follower counts), 24 at a time.
 *
 * The address follows the choices (model.ts): a style or a city alone moves to its own page's
 * address, which is a new history entry, as the legacy screen did; typing only replaces it.
 * Back and forward read the address again.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { CalendarCheckIcon, CaretDownIcon, MagnifyingGlassIcon, MicrophoneStageIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../../copy';
import { cx } from '../../cx';
import { count } from '../../format';
import { familyOf, type Family } from '../../genre';
import { inLang } from '../../link';
import { useKd } from '../../runtime';
import { Button, Chip } from '../../ui/actions';
import { Input } from '../../ui/forms';
import { Menu, MenuItem } from '../../ui/menu';
import { Card as Panel, Marker } from '../../ui/parts';
import { Crumbs, WebFooter } from '../chrome';
import { WEB } from '../copy';
import { ArtistCard } from './card';
import { DIR } from './copy';
import {
  addressOf, apiQuery, fromScope, isFiltered, NO_FILTERS, PAGE, pathOf, readAddress, sameFilters, titleOf,
  type DirMeta, type DirPage, type Filters, type Scope,
} from './model';

const text = (v: Pair | null | undefined, lang: Lang) => (v ? v[lang] || v.vi || v.en || '' : '');

/** A directory address: /a, /a/style/<style> or /a/city/<city>. */
const DIRECTORY_PATH = /^\/a(\/(style|city)\/[^/]+)?\/?$/;

type List = Pick<DirPage, 'items' | 'total' | 'nextOffset'>;

export function DirectoryBrowser({ lang, scope, h1, first, start, meta }: {
  lang: Lang;
  /** The page the server rendered: all artists, one style's or one city's. */
  scope: Scope;
  /** That page's heading, as the API words it. */
  h1: string;
  /** The first artists under `start`. */
  first: DirPage;
  /** The filters the server rendered: the scope's, or what the query of /a names. */
  start: Filters;
  meta: DirMeta;
}) {
  const T = pick(DIR, lang);
  const W = pick(WEB, lang);
  const { toast } = useKd();
  const roles = useMemo(() => first.filters?.roles ?? [], [first.filters]);
  const initial = useMemo(() => fromScope({ style: scope.style, city: scope.city }), [scope.style, scope.city]);
  const [f, setF] = useState<Filters>(start);
  const [q, setQ] = useState(start.q);
  const [list, setList] = useState<List>({ items: first.items, total: first.total, nextOffset: first.nextOffset });
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);
  const current = useRef(f);
  current.current = f;
  const typing = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (next: Filters, offset = 0, had?: List) => {
    const n = ++seq.current;
    setBusy(true);
    try {
      let out = (await FF.get('/artists?' + apiQuery(next, offset))) as DirPage;
      if (n !== seq.current) return;
      // The list changed since its first page (a cached page, new artists): the next page would
      // not follow on, so read it again from the top, as far as it will now go.
      if (offset && had && out.total !== had.total) {
        out = (await FF.get('/artists?' + apiQuery(next, 0, Math.min(60, had.items.length + PAGE)))) as DirPage;
        if (n !== seq.current) return;
        offset = 0;
      }
      setList((cur) => {
        if (!offset) return { items: out.items, total: out.total, nextOffset: out.nextOffset };
        const known = new Set(cur.items.map((a) => a.id));
        return { items: [...cur.items, ...out.items.filter((a) => !known.has(a.id))], total: out.total, nextOffset: out.nextOffset };
      });
    } catch (e) {
      if (n === seq.current) toast(FF.errorText(e, lang));
    } finally {
      if (n === seq.current) setBusy(false);
    }
  }, [toast, lang]);

  // The list follows the address. Next keeps this page's state across a link back to it (its key
  // has no query) and across a trip to another page and back (a hidden Activity), so on mount, on
  // coming back, and whenever the server renders the page again, read the address: when the
  // server's artists are its list, take them as they came; else ask for them.
  const served = useRef(first);
  // Next re-renders with the props of its first load when a link leads back to this page, so the
  // path is what says the address changed.
  const pathname = usePathname();
  useEffect(() => {
    const fresh = served.current !== first;
    served.current = first;
    const at = readAddress(location.pathname, location.search, { roles, meta });
    if (sameFilters(at, start) && (fresh || !sameFilters(at, current.current))) {
      seq.current++;
      setF(at);
      setQ(at.q);
      setBusy(false);
      setList({ items: first.items, total: first.total, nextOffset: first.nextOffset });
      return;
    }
    if (sameFilters(at, current.current)) return;
    setF(at);
    setQ(at.q);
    load(at);
  }, [first, start, roles, meta, load, pathname]);

  // Back and forward between the directory's own addresses.
  useEffect(() => {
    const onPop = () => {
      if (!DIRECTORY_PATH.test(location.pathname)) return;
      const at = readAddress(location.pathname, location.search, { roles, meta });
      if (sameFilters(at, current.current)) return;
      setF(at);
      setQ(at.q);
      load(at);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [roles, meta, load]);

  useEffect(() => () => { if (typing.current) clearTimeout(typing.current); }, []);

  /** New filters: the address, then the list. A click on a filter is a step back can undo; typing is not. */
  const apply = (next: Filters, how: 'push' | 'replace') => {
    if (sameFilters(next, current.current)) return;
    setF(next);
    const to = addressOf(next, lang);
    if (to !== location.pathname + location.search) {
      if (how === 'push' && pathOf(next) !== location.pathname) history.pushState(null, '', to);
      else history.replaceState(null, '', to);
    }
    load(next);
  };

  // A link to another directory address on this page (the breadcrumb, the nav's "Nghệ sĩ") is a
  // change of filters here: Next would keep this page as it is and only change the address.
  const applyRef = useRef(apply);
  applyRef.current = apply;
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !DIRECTORY_PATH.test(url.pathname)) return;
      // The other language is a page of its own.
      if ((url.searchParams.get('lang') === 'en') !== (lang === 'en')) return;
      e.preventDefault();
      e.stopPropagation();
      applyRef.current(readAddress(url.pathname, url.search, { roles, meta }), 'push');
      window.scrollTo({ top: 0 });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [lang, roles, meta]);

  const change = (patch: Partial<Filters>) => {
    const next = { ...current.current, ...patch };
    if (patch.role !== undefined || patch.style !== undefined || patch.city !== undefined) {
      FF.track('directory_filter', { role: next.role, style: next.style, city: next.city });
    }
    apply(next, 'push');
  };

  const search = (value: string) => {
    const v = value.trim().slice(0, 80);
    if (v === current.current.q) return;
    if (v) FF.track('search', { screen: 'artists' });
    apply({ ...current.current, q: v }, 'replace');
  };

  const onType = (value: string) => {
    setQ(value);
    if (typing.current) clearTimeout(typing.current);
    typing.current = setTimeout(() => search(value), 300);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (typing.current) clearTimeout(typing.current);
    search(q);
  };

  const clear = () => {
    if (typing.current) clearTimeout(typing.current);
    setQ('');
    apply({ ...NO_FILTERS }, 'push');
  };

  const title = sameFilters(f, initial) ? h1 : titleOf(f, lang, meta);
  const filtered = isFiltered(f);
  const own = pathOf(f);
  const crumbs = [
    { name: 'FeestFinder', href: inLang('/', lang) },
    own === '/a' ? { name: T.crumb } : { name: T.crumb, href: inLang('/a', lang) },
    ...(own === '/a' ? [] : [{ name: title }]),
  ];
  const otherLang = useMemo(
    () => ({ href: addressOf(f, lang === 'vi' ? 'en' : 'vi'), label: lang === 'vi' ? W.english : W.vietnamese }),
    [f, lang, W.english, W.vietnamese],
  );

  const style = meta.styles.find((s) => s.key === f.style);
  const styleFamily = style ? familyOf(style.genre) : null;
  const role = roles.find((r) => r.key === f.role);
  const city = meta.cities.find((c) => c.slug === f.city);

  return (
    <>
      <Crumbs label={W.crumbs} items={crumbs} />
      <main className="kd-wrap flex flex-col gap-5 pb-8 pt-2" aria-labelledby="dir-title">
        <div className="kd-sec">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 id="dir-title" className="kd-d1">{title}</h1>
            <span className="kd-m kd-num" aria-live="polite">{fill(T.count, { n: count(list.total, lang) })}</span>
          </div>
          <form role="search" onSubmit={onSubmit} className="w-full tab:w-[340px]">
            <Input
              type="search"
              name="q"
              value={q}
              onChange={(e) => onType(e.target.value)}
              maxLength={80}
              placeholder={T.search}
              aria-label={T.search}
              icon={<MagnifyingGlassIcon size={18} aria-hidden="true" />}
            />
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={T.filters}>
          {roles.length ? (
            <PickChip label={T.role} on={!!role} value={role ? text(role.label, lang) : T.anyRole}>
              <MenuItem checked={!f.role} onSelect={() => change({ role: '' })}>{T.anyRole}</MenuItem>
              {roles.map((r) => (
                <MenuItem key={r.key} checked={f.role === r.key} onSelect={() => change({ role: r.key })}>{text(r.label, lang)}</MenuItem>
              ))}
            </PickChip>
          ) : null}
          {meta.styles.length ? (
            <PickChip
              label={T.style}
              on={!!style}
              value={style ? text(style.label, lang) : T.anyStyle}
              lead={styleFamily && styleFamily !== 'free' ? <Marker family={styleFamily} /> : null}
            >
              <MenuItem checked={!f.style} onSelect={() => change({ style: '' })}>{T.anyStyle}</MenuItem>
              {meta.styles.map((s) => {
                const fam: Family = familyOf(s.genre);
                return (
                  <MenuItem key={s.key} checked={f.style === s.key} icon={fam !== 'free' ? <Marker family={fam} /> : undefined} onSelect={() => change({ style: s.key })}>
                    {text(s.label, lang)}
                  </MenuItem>
                );
              })}
            </PickChip>
          ) : null}
          {meta.cities.length ? (
            <PickChip label={T.city} on={!!city} value={city ? text(city.name, lang) : T.anyCity}>
              <MenuItem checked={!f.city} onSelect={() => change({ city: '' })}>{T.anyCity}</MenuItem>
              {meta.cities.map((c) => (
                <MenuItem key={c.slug} checked={f.city === c.slug} onSelect={() => change({ city: c.slug })}>{text(c.name, lang)}</MenuItem>
              ))}
            </PickChip>
          ) : null}
          <Chip on={f.booking} onClick={() => change({ booking: !f.booking })}>
            <CalendarCheckIcon size={16} aria-hidden="true" />{T.available}
          </Chip>
          <Chip on={f.soon} onClick={() => change({ soon: !f.soon })}>
            <MicrophoneStageIcon size={16} aria-hidden="true" />{T.upcoming}
          </Chip>
          {filtered ? <button type="button" className="kd-more ml-1" onClick={clear}><XIcon size={14} aria-hidden="true" />{T.clear}</button> : null}
        </div>

        {list.items.length ? (
          <ul className={cx('kd-cards mt-2 transition-opacity', busy && 'opacity-60')} aria-label={T.results} aria-busy={busy}>
            {list.items.map((a, i) => <li key={a.id} className="min-w-0"><ArtistCard a={a} i={i} lang={lang} /></li>)}
          </ul>
        ) : busy ? (
          <div className="kd-skel h-40" aria-hidden="true" />
        ) : (
          <Panel role="status" className="flex flex-wrap items-center justify-between gap-4 p-7">
            <span className="kd-h">{T.empty}</span>
            {filtered ? <Button onClick={clear}>{T.clear}</Button> : null}
          </Panel>
        )}
        {list.nextOffset != null && list.items.length ? (
          <Button className="self-center" disabled={busy} onClick={() => load(f, list.nextOffset!, list)}>{T.more}</Button>
        ) : null}
      </main>
      <div className="mt-auto"><WebFooter lang={lang} otherLang={otherLang} /></div>
    </>
  );
}

/**
 * A filter as a dropdown chip that shows its choice: on (paper) once something is chosen. It is
 * named "Phong cách: Techno"; a long list scrolls inside the menu.
 */
function PickChip({ label, on, value, lead, children }: { label: string; on: boolean; value: string; lead?: ReactNode; children: ReactNode }) {
  return (
    <Menu
      label={label}
      trigger={(p, open) => (
        <button type="button" {...p} ref={p.ref} aria-label={`${label}: ${value}`} className={cx('kd-chip', (on || open) && 'kd-chip-on')}>
          {lead}{value}
          <CaretDownIcon size={14} className="kd-chev" aria-hidden="true" />
        </button>
      )}
    >
      <div className="flex max-h-[min(60vh,420px)] flex-col gap-0.5 overflow-y-auto">{children}</div>
    </Menu>
  );
}
