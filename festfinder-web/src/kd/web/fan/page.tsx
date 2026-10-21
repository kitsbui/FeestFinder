'use client';
/**
 * /profile in Kính đêm (design/Profile-Fan-Web): the signed-in person's own profile on the web,
 * and on a phone the "Tôi" hub the tab bar leads to (their places, workspaces, language, sign out).
 * At the side, who they are (edit), their numbers, their photos (Moments); in the main column the
 * nights coming up, the passport (a stamp per night they were there) and their sound, badges, and
 * who they follow. Private (owner decision 2): no public fan page yet, never indexed.
 */
import { useEffect, useState } from 'react';
import { FF } from '@/runtime/ff';
import { COMMON, fill, pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import { dayMonth, weekdayShort } from '../../format';
import { familyOf, g } from '../../genre';
import { MomentsSection } from '../../moments';
import { useKd } from '../../runtime';
import { buttonClass, Button } from '../../ui/actions';
import type { BadgeView } from '../../ui/badges';
import { ProfileBadges } from '../../ui/profile-badges';
import type { Moment } from '../../ui/moments';
import { Art, Avatar, Card as Panel, Stat } from '../../ui/parts';
import { APP } from '../../app/copy';
import { EditSheet, PassportSection, WrappedSheet, type Me, type Passport } from '../../app/profile';
import type { Card } from '../../types';
import { FollowManager, FollowStats, type Follows } from '../../ui/follows';
import { GuestHub, MeHub } from '../me';

export function FanProfile({ lang }: { lang: Lang }) {
  const kd = useKd();
  const T = pick(APP, lang);
  if (kd.session === undefined) return <div className="kd-wrap py-8"><div className="kd-skel h-80" aria-hidden="true" /></div>;
  if (!kd.user) {
    // Signing in first, then what works without an account (design v2 phase 11).
    return (
      <div className="kd-wrap flex flex-col gap-6 py-8 tab:max-w-[520px]" data-ff-gate>
        <Panel className="flex flex-col items-start gap-4 p-6">
          <h1 className="kd-d3">{T.myProfile}</h1>
          <p className="kd-s">{T.gateMe}</p>
          <button type="button" className={buttonClass({ tone: 'acc' })} onClick={() => kd.openSignIn(T.gateMe)}>{pick(COMMON, lang).signIn}</button>
        </Panel>
        <GuestHub lang={lang} />
      </div>
    );
  }
  return <Mine lang={lang} />;
}

function Mine({ lang }: { lang: Lang }) {
  const T = pick(APP, lang);
  const { clockReady } = useKd();
  const [me, setMe] = useState<Me | null>(null);
  const [pp, setPp] = useState<Passport | null>(null);
  const [going, setGoing] = useState<Card[] | null>(null);
  const [follows, setFollows] = useState<Follows | null>(null);
  const [badges, setBadges] = useState<BadgeView[] | null>(null);
  const [pins, setPins] = useState<string[] | null>(null);
  const [moments, setMoments] = useState<Moment[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [wrapped, setWrapped] = useState(false);
  useEffect(() => {
    FF.maybe(FF.get('/me'), null).then(setMe);
    FF.maybe(FF.get('/me/passport'), null).then(setPp);
    // The nights they said they are going to, still to come (FeestFinder sells no tickets, so there are no orders to read).
    FF.maybe(FF.get('/me/going?past=exclude&limit=8'), { items: [] }).then((w: { items: Card[] }) => setGoing(w.items));
    FF.maybe(FF.get('/me/follows'), null).then(setFollows);
    FF.maybe(FF.get('/me/badges'), null).then((b: { items: BadgeView[]; pins: string[] } | null) => { setBadges(b?.items ?? []); setPins(b?.pins ?? []); });
    FF.maybe(FF.get('/me/moments'), null).then((m: { items: Moment[] } | null) => setMoments(m?.items ?? []));
  }, []);
  const coming = clockReady ? going ?? [] : [];
  const u = me?.user;
  const year = new Date(FF.now()).getFullYear();
  const en = lang === 'vi' ? '' : '?lang=' + lang;

  return (
    <div className="kd-wrap pb-16 pt-8">
      {/* One column in the middle (owner, 2026-10-20: no side column on any page): who, then their nights, the moments last. */}
      <div className="mx-auto flex w-full max-w-page flex-col">
        <section className="flex flex-col gap-8" aria-label={T.myProfile}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={u?.name || u?.email || '?'} src={u?.photoUrl} size={88} acc />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h1 className="kd-d2 kd-ell">{u?.name || '…'}</h1>
                <span className="kd-m kd-ell normal-case">{[u?.email || u?.phone, u?.city].filter(Boolean).join(' · ')}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setEditing(true)} disabled={!u}>{T.edit}</Button>
              {/* On a phone the hub below has "Cài đặt". */}
              <a className={buttonClass({ size: 'sm', tone: 'ghost' }, 'hidden desk:inline-flex')} href="/app/settings">{T.notifSettings}</a>
            </div>
            <div className="grid grid-cols-2 gap-y-3.5 border-y border-line-1 py-3.5 tab:grid-cols-4">
              <Stat value={pp ? pp.stats.nights : '–'} label={T.went} />
              <Stat value={going ? coming.length : '–'} label={T.going} />
              <FollowStats lang={lang} f={follows} />
            </div>
          </div>
          {/* "Tôi" on a phone: the tab bar leads here, and the account menu's places are a page (web/me.tsx). */}
          <MeHub lang={lang} className="desk:hidden" />
        </section>

        <div className="flex flex-col pt-10">
          {coming.length ? (
            <section className="flex flex-col gap-2.5" aria-labelledby="fp-going">
              <div className="flex items-baseline justify-between"><h2 id="fp-going" className="kd-d3">{T.going}</h2></div>
              <div className="grid gap-2.5 tab:grid-cols-2">
              {coming.slice(0, 4).map((e) => {
                const fam = familyOf(e.genre);
                return (
                  <a key={e.id} href={'/e/' + e.slug + en} className={cx('kd-bonecard grid grid-cols-[76px_minmax(0,1fr)] items-center gap-3.5 py-1.5 pl-1.5 pr-3.5', g(fam))}>
                    <Art family={fam} title={e.title} cover={e.coverUrl} className="h-19 rounded-lg" />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="kd-m kd-num">{e.startsOn ? `${weekdayShort(e.startsOn, lang)} ${dayMonth(e.startsOn, lang)}` : ''}</span>
                      <span className="kd-hs kd-ell">{e.title}</span>
                      <span className="kd-s kd-ell">{[e.venue.name, e.venue.area, e.startTime ? fill(T.doorsAt, { t: e.startTime }) : null].filter(Boolean).join(' · ')}</span>
                    </span>
                  </a>
                );
              })}
              </div>
            </section>
          ) : null}
          {pp ? <PassportSection lang={lang} pp={pp} year={year} onWrapped={() => setWrapped(true)} flush appLinks={false} /> : <div className="kd-skel mt-8 h-40" aria-hidden="true" />}
          {pins ? <ProfileBadges lang={lang} items={badges} pins={pins} own className="pt-12" /> : <div className="kd-skel mt-12 h-24" aria-hidden="true" />}
          {follows ? <FollowManager lang={lang} f={follows} flush /> : null}
          {moments ? <MomentsSection lang={lang} as="user" items={moments} owner compact /> : null}
        </div>
      </div>
      {editing && u ? <EditSheet lang={lang} me={u} onClose={() => setEditing(false)} onSaved={(n) => { setMe((m) => m && { ...m, user: { ...m.user, ...n } }); setEditing(false); }} /> : null}
      {wrapped ? <WrappedSheet lang={lang} year={year} onClose={() => setWrapped(false)} /> : null}
    </div>
  );
}
