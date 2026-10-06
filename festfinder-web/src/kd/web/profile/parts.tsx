'use client';
/**
 * The live parts of the organiser and artist pages. The server renders the profile as anyone
 * sees it; in the browser each part asks the API once more (shared through FF.once), so
 * whether the viewer follows, the follower count and the owner's controls are current.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { ExportIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import { count } from '../../format';
import { familyOf, g } from '../../genre';
import { KdLink as Link, inLang } from '../../link';
import { useKd } from '../../runtime';
import { buttonClass, IconButton } from '../../ui/actions';
import { DateBlock, Marker, Stat } from '../../ui/parts';
import { Tabs } from '../../ui/shell';
import { PROFILE } from './copy';

/** What the page's own API answer says about the viewer. */
export interface Viewer { following: boolean; followers: number; owner: boolean; claimed: boolean }

/** Whose page this is: plain data, so the server page can hand it over. */
export type Source = { kind: 'org' | 'artist'; slug: string };

const READ: Record<Source['kind'], { path: (slug: string) => string; read: (d: any) => Viewer }> = {
  org: {
    path: (slug) => '/organizers/' + encodeURIComponent(slug),
    read: (d) => ({ following: !!d.me?.following, followers: d.stats?.followers ?? 0, owner: !!d.me?.member, claimed: false }),
  },
  artist: {
    path: (slug) => '/artists/' + encodeURIComponent(slug),
    read: (d) => ({ following: !!d.artist?.following, followers: d.artist?.followers ?? 0, owner: !!d.artist?.editable, claimed: !!d.artist?.claimed }),
  },
};

/** The page's API answer, fetched once per page and per person signed in. */
export function useViewer(source: Source): Viewer | null {
  const { path, read } = { path: READ[source.kind].path(source.slug), read: READ[source.kind].read };
  const kd = useKd();
  const [v, setV] = useState<Viewer | null>(null);
  const who = kd.session === undefined ? undefined : kd.user?.id ?? '';
  useEffect(() => {
    if (who === undefined) return;
    let live = true;
    FF.once(`kd:profile:${path}:${who}`, () => FF.maybe(FF.get(path), null)).then((d: unknown) => { if (live && d) setV(read(d)); });
    return () => { live = false; };
  }, [path, read, who]);
  return v;
}

/** Following, as this tab last set it, else as the API said. */
function useFollowing(kind: 'org' | 'art', id: string, v: Viewer | null): [boolean, number] {
  const kd = useKd();
  const key = kind + ':' + id;
  const base = !!v?.following;
  const on = kd.follows.has(key) ? !!kd.follows.get(key) : base;
  const followers = (v?.followers ?? 0) + (on === base ? 0 : on ? 1 : -1);
  return [on, Math.max(0, followers)];
}

export function FollowButton({ lang, kind, id, name, source, className }: {
  lang: Lang; kind: 'org' | 'art'; id: string; name: string; source: Source; className?: string;
}) {
  const kd = useKd();
  const T = pick(PROFILE, lang);
  const v = useViewer(source);
  const [on] = useFollowing(kind, id, v);
  const toggle = async () => {
    const out = await kd.setFollow(kind, id, !on);
    if (out != null) kd.toast(fill(out ? T.followed : T.unfollowed, { n: name }));
  };
  return (
    <button type="button" aria-pressed={on} onClick={toggle} className={buttonClass({ tone: on ? 'default' : 'acc' }, cx('min-w-[148px]', className))}>
      {on ? T.following : T.follow}
    </button>
  );
}

/** The follower count, moving with the follow button. */
export function FollowersStat({ lang, kind, id, source, served }: { lang: Lang; kind: 'org' | 'art'; id: string; source: Source; served: number }) {
  const T = pick(PROFILE, lang);
  const v = useViewer(source);
  const [, n] = useFollowing(kind, id, v);
  return <Stat value={count(v ? n : served, lang)} label={T.followers} />;
}

/** "Chỉnh hồ sơ" for the profile's own people. */
export function OwnerLink({ lang, source, href }: { lang: Lang; source: Source; href: string }) {
  const T = pick(PROFILE, lang);
  const v = useViewer(source);
  if (!v?.owner) return null;
  return <a className={buttonClass({})} href={href}>{T.edit}</a>;
}

export function ShareProfile({ lang, title }: { lang: Lang; title: string }) {
  const kd = useKd();
  const T = pick(PROFILE, lang);
  const share = async () => {
    const url = location.href.split('#')[0];
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ title, url }); return; } catch { /* closed: fall back to copying */ }
    }
    try { await navigator.clipboard.writeText(url); kd.toast(T.linkCopied); } catch { kd.toast(url); }
  };
  return (
    <IconButton label={T.share} line onClick={share}>
      <ExportIcon size={20} aria-hidden="true" />
    </IconButton>
  );
}

/** "Bạn là nhà tổ chức / nghệ sĩ này?": sign in, then the role picker offers this listing. */
export function ClaimLink({ lang, kind, name, source }: { lang: Lang; kind: 'organizer' | 'artist'; name: string; source: Source }) {
  const kd = useKd();
  const T = pick(PROFILE, lang);
  const v = useViewer(source);
  if (v && (v.owner || v.claimed)) return null;
  const go = () => {
    if (!kd.requireSignIn(undefined, T.gateClaim)) return;
    kd.openRolePicker(kind, name);
  };
  return <button type="button" className="kd-nl" onClick={go}>{kind === 'organizer' ? T.isThisYouOrg : T.isThisYouArtist}</button>;
}

/** Upcoming / past: both panels are in the page's HTML; the tabs show one. */
export function EventTabs({ label, tabs }: { label: string; tabs: { key: string; label: string; count: number; panel: ReactNode }[] }) {
  const [cur, setCur] = useState(tabs[0]?.key ?? '');
  return (
    <div className="flex flex-col">
      <Tabs label={label} current={cur} onSelect={setCur} items={tabs.map((t) => ({ key: t.key, label: t.label, count: t.count }))} />
      {tabs.map((t) => (
        <div key={t.key} role="tabpanel" aria-label={t.label} hidden={t.key !== cur}>{t.panel}</div>
      ))}
    </div>
  );
}

export interface PastItem { slug: string; title: string; startsOn: string; venue: string | null; cityLabel?: { vi: string; en: string } | null; genre?: string | null; saveCount?: number }

/** Past events by year, newest first: a date block, the title, where. */
export function PastList({ lang, items, first = 10 }: { lang: Lang; items: PastItem[]; first?: number }) {
  const T = pick(PROFILE, lang);
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, first);
  const years: { y: string; items: PastItem[] }[] = [];
  for (const e of shown) {
    const y = e.startsOn.slice(0, 4);
    if (years.at(-1)?.y !== y) years.push({ y, items: [] });
    years.at(-1)!.items.push(e);
  }
  const month = (iso: string) => {
    const m = Number(iso.slice(5, 7));
    return lang === 'vi' ? 'Th' + m : new Date(Date.UTC(2000, m - 1, 15)).toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' });
  };
  return (
    <div className="flex flex-col">
      {years.map((yr) => (
        <section key={yr.y} aria-label={yr.y} className="flex flex-col">
          <span className="kd-m kd-num pb-1.5 pt-4.5">{yr.y}</span>
          {yr.items.map((e) => (
            <Link key={e.slug} href={inLang('/e/' + e.slug, lang)} className={cx('grid min-h-20 grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 border-b border-line hover:bg-white/[0.03]', g(familyOf(e.genre)))}>
              <DateBlock day={Number(e.startsOn.slice(8, 10))} bottom={month(e.startsOn)} />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="kd-hs kd-ell">{e.title}</span>
                <span className="kd-s kd-ell flex items-center gap-1.5">
                  {e.genre !== undefined ? <Marker family={familyOf(e.genre)} /> : null}
                  {[e.venue, e.cityLabel?.[lang]].filter(Boolean).join(' · ')}
                </span>
              </span>
              {e.saveCount ? <span className="kd-s kd-num hidden tab:inline">{fill(T.interested, { n: count(e.saveCount, lang) })}</span> : <span />}
            </Link>
          ))}
        </section>
      ))}
      {!all && items.length > first ? (
        <button type="button" className={buttonClass({ tone: 'ghost', size: 'sm' }, 'mt-3 self-start')} onClick={() => setAll(true)}>{fill(T.allPast, { n: items.length })}</button>
      ) : null}
    </div>
  );
}
