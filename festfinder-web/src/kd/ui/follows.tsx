'use client';
/**
 * A person's follows, on their own profile (web and app): who they follow (artists' profiles,
 * organisers, people) and who follows them, each with its button. Unfollowing leaves the row
 * with "Theo dõi", so a slip is one tap back. Counts are of real follows (GET /me/follows).
 */
import { useState } from 'react';
import { CaretRightIcon } from '@phosphor-icons/react/ssr';
import { fill, pick, type Lang } from '../copy';
import { cx } from '../cx';
import { count, dayMonth } from '../format';
import { useKd, type FollowKind } from '../runtime';
import { Button } from './actions';
import { Avatar, Stat } from './parts';
import { Tabs } from './shell';

export interface Person { id: string; name: string | null; initials?: string; photoUrl: string | null }
export interface Follows {
  organizers: { following: { id: string; slug: string; name: string; logoUrl: string | null; next: { slug: string; title: string; startsOn: string } | null }[] };
  artists: string[];
  artistPages?: { name: string; slug: string | null }[];
  profiles?: { id: string; slug: string; name: string; imageUrl: string | null; next: { slug: string; title: string; startsOn: string } | null }[];
  people?: Person[];
  followers?: (Person & { following: boolean })[];
  counts?: { followers: number; following: number };
}

const COPY = {
  following: { en: 'Following', vi: 'Đang theo dõi' },
  followers: { en: 'Followers', vi: 'Người theo dõi' },
  follow: { en: 'Follow', vi: 'Theo dõi' },
  followBack: { en: 'Follow back', vi: 'Theo dõi lại' },
  artist: { en: 'Artist', vi: 'Nghệ sĩ' },
  organizer: { en: 'Organiser', vi: 'Nhà tổ chức' },
  person: { en: 'Person', vi: 'Người dùng' },
  next: { en: 'next {d}', vi: 'tiếp theo {d}' },
  noFollowing: { en: 'Not following anyone yet', vi: 'Chưa theo dõi ai' },
  noFollowers: { en: 'No followers yet', vi: 'Chưa có người theo dõi' },
  more: { en: 'Show all {n}', vi: 'Xem tất cả {n}' },
  someone: { en: 'Someone', vi: 'Một người dùng' },
};

interface Row { kind: FollowKind; id: string; name: string; href: string | null; photo: string | null; line: string; base: boolean; back?: boolean }

const SHOWN = 12;

/** The rows a person follows, as the API listed them. */
function followingRows(f: Follows, lang: Lang): Row[] {
  const T = pick(COPY, lang);
  const en = lang === 'en' ? '?lang=en' : '';
  const nextLine = (kind: string, n: { startsOn: string } | null) => (n ? `${kind} · ${fill(T.next, { d: dayMonth(n.startsOn, lang) })}` : kind);
  const profiles = f.profiles ?? [];
  const names = new Set(profiles.map((p) => p.name.toLowerCase()));
  // Follows kept by name from before profiles (migration 041): still there to unfollow.
  const byName = (f.artistPages ?? f.artists.map((name) => ({ name, slug: null }))).filter((a) => !names.has(a.name.toLowerCase()));
  return [
    ...profiles.map((a) => ({ kind: 'art' as const, id: a.id, name: a.name, href: '/a/' + a.slug + en, photo: a.imageUrl, line: nextLine(T.artist, a.next), base: true })),
    ...byName.map((a) => ({ kind: 'art' as const, id: a.name, name: a.name, href: a.slug ? '/a/' + a.slug + en : null, photo: null, line: T.artist, base: true })),
    ...f.organizers.following.map((o) => ({ kind: 'org' as const, id: o.id, name: o.name, href: '/o/' + o.slug + en, photo: o.logoUrl, line: nextLine(T.organizer, o.next), base: true })),
    ...(f.people ?? []).map((p) => ({ kind: 'person' as const, id: p.id, name: p.name || T.someone, href: null, photo: p.photoUrl, line: T.person, base: true })),
  ];
}

function useOn() {
  const kd = useKd();
  return (r: Row) => {
    const key = r.kind + ':' + r.id;
    return kd.follows.has(key) ? !!kd.follows.get(key) : r.base;
  };
}

/** "Người theo dõi" and "Đang theo dõi", moving with the buttons below. */
export function FollowStats({ lang, f }: { lang: Lang; f: Follows | null }) {
  const T = pick(COPY, lang);
  const on = useOn();
  const following = f ? followingRows(f, lang).filter(on).length : null;
  return (
    <>
      <Stat value={f ? count(f.counts?.followers ?? 0, lang) : '–'} label={T.followers} />
      <Stat value={following == null ? '–' : count(following, lang)} label={T.following} />
    </>
  );
}

export function FollowManager({ lang, f, flush }: { lang: Lang; f: Follows; flush?: boolean }) {
  const T = pick(COPY, lang);
  const kd = useKd();
  const on = useOn();
  const [tab, setTab] = useState<'following' | 'followers'>('following');
  const [all, setAll] = useState(false);
  const following = followingRows(f, lang);
  const followers: Row[] = (f.followers ?? []).map((p) => ({ kind: 'person', id: p.id, name: p.name || T.someone, href: null, photo: p.photoUrl, line: T.person, base: p.following, back: true }));
  const rows = tab === 'following' ? following : followers;
  const shown = all ? rows : rows.slice(0, SHOWN);
  const nFollowing = following.filter(on).length;

  return (
    <section className={cx('flex flex-col pt-8', !flush && 'px-4')} aria-labelledby="pf-follow">
      <h2 id="pf-follow" className="sr-only">{T.following}</h2>
      <Tabs
        label={T.following}
        current={tab}
        onSelect={(v) => { setTab(v as 'following' | 'followers'); setAll(false); }}
        items={[
          { key: 'following', label: T.following, count: nFollowing },
          { key: 'followers', label: T.followers, count: f.counts?.followers ?? followers.length },
        ]}
      />
      {!rows.length ? <p className="kd-s py-4">{tab === 'following' ? T.noFollowing : T.noFollowers}</p> : (
        <ul className="flex flex-col">
          {shown.map((r) => {
            const isOn = on(r);
            const who = (
              <>
                <Avatar name={r.name} src={r.photo} size={44} org={r.kind === 'org'} />
                <span className="flex min-w-0 flex-1 flex-col"><span className="kd-hs kd-ell">{r.name}</span><span className="kd-s kd-ell">{r.line}</span></span>
              </>
            );
            return (
              <li key={r.kind + ':' + r.id} className="kd-lrow min-h-16">
                {r.href ? (
                  <a className="flex min-w-0 flex-1 items-center gap-3" href={r.href}>{who}<CaretRightIcon size={16} className="shrink-0 text-fog" aria-hidden="true" /></a>
                ) : <span className="flex min-w-0 flex-1 items-center gap-3">{who}</span>}
                <Button size="sm" tone={isOn ? 'default' : 'acc'} aria-pressed={isOn} aria-label={`${isOn ? T.following : r.back ? T.followBack : T.follow} · ${r.name}`}
                  onClick={() => void kd.setFollow(r.kind, r.id, !isOn)}>
                  {isOn ? T.following : r.back ? T.followBack : T.follow}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {!all && rows.length > SHOWN ? <button type="button" className="kd-more self-start pt-2" onClick={() => setAll(true)}>{fill(T.more, { n: rows.length })}</button> : null}
    </section>
  );
}
