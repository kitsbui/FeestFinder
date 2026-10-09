'use client';
/**
 * /profile in Kính đêm (design/Profile-Fan-Web): the signed-in person's own profile on the web.
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
import { Badges, type BadgeView } from '../../ui/badges';
import type { Moment } from '../../ui/moments';
import { Art, Avatar, Card as Panel, Stat } from '../../ui/parts';
import { APP } from '../../app/copy';
import { EditSheet, FollowingSection, PassportSection, WrappedSheet, type Follows, type Me, type Order, type Passport } from '../../app/profile';

export function FanProfile({ lang }: { lang: Lang }) {
  const kd = useKd();
  const T = pick(APP, lang);
  if (kd.session === undefined) return <div className="kd-wrap py-8"><div className="kd-skel h-80" aria-hidden="true" /></div>;
  if (!kd.user) {
    return (
      <div className="kd-wrap flex justify-center py-16" data-ff-gate>
        <Panel className="flex w-full max-w-[420px] flex-col items-start gap-4 p-7">
          <h1 className="kd-d3">{T.myProfile}</h1>
          <p className="kd-s">{T.gateMe}</p>
          <button type="button" className={buttonClass({ tone: 'acc' })} onClick={() => kd.openSignIn(T.gateMe)}>{pick(COMMON, lang).signIn}</button>
        </Panel>
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
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [follows, setFollows] = useState<Follows | null>(null);
  const [badges, setBadges] = useState<BadgeView[] | null>(null);
  const [moments, setMoments] = useState<Moment[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [wrapped, setWrapped] = useState(false);
  useEffect(() => {
    FF.maybe(FF.get('/me'), null).then(setMe);
    FF.maybe(FF.get('/me/passport'), null).then(setPp);
    FF.maybe(FF.get('/me/tickets'), { items: [] }).then((w: { items: Order[] }) => setOrders(w.items));
    FF.maybe(FF.get('/me/follows'), null).then(setFollows);
    FF.maybe(FF.get('/me/badges'), null).then((b: { items: BadgeView[] } | null) => setBadges(b?.items ?? []));
    FF.maybe(FF.get('/me/moments'), null).then((m: { items: Moment[] } | null) => setMoments(m?.items ?? []));
  }, []);
  const now = FF.now().getTime();
  const coming = (clockReady ? orders ?? [] : []).filter((o) => o.status === 'paid' && o.tickets.length && !(o.event.endsAt && Date.parse(o.event.endsAt) < now));
  const u = me?.user;
  const year = new Date(FF.now()).getFullYear();
  const following = follows ? follows.organizers.following.length + (follows.artistPages ?? follows.artists).length : null;
  const en = lang === 'en' ? '?lang=en' : '';

  return (
    <div className="kd-wrap pb-16 pt-8">
      <div className="kd-split gap-[clamp(28px,4vw,56px)]">
        <aside className="kd-side flex flex-col gap-8 tab:max-w-[380px]" aria-label={T.myProfile}>
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
              <a className={buttonClass({ size: 'sm', tone: 'ghost' })} href="/app/settings">{T.notifSettings}</a>
            </div>
            <div className="grid grid-cols-3 border-y border-line py-3.5">
              <Stat value={pp ? pp.stats.nights : '–'} label={T.went} />
              <Stat value={orders ? coming.length : '–'} label={T.going} />
              <Stat value={following ?? '–'} label={T.followingTitle} />
            </div>
          </div>
          {moments ? <MomentsSection lang={lang} as="user" items={moments} owner compact /> : null}
        </aside>

        <div className="kd-main flex flex-col">
          {coming.length ? (
            <section className="flex flex-col gap-2.5" aria-labelledby="fp-going">
              <div className="flex items-baseline justify-between"><h2 id="fp-going" className="kd-d3">{T.going}</h2><a className={buttonClass({ size: 'sm' })} href="/app/tickets">{T.allTickets}</a></div>
              {coming.slice(0, 4).map((o, i) => {
                const fam = familyOf(o.event.genre);
                return (
                  <a key={o.id} href={'/e/' + o.event.slug + en} className={cx('kd-bonecard grid grid-cols-[76px_minmax(0,1fr)_auto] items-center gap-3.5 py-1.5 pl-1.5 pr-3.5', g(fam))}>
                    <Art family={fam} bone={i % 2 === 1} className="h-19 rounded-lg" />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="kd-m kd-num">{weekdayShort(o.event.startsOn, lang)} {dayMonth(o.event.startsOn, lang)}</span>
                      <span className="kd-hs kd-ell">{o.event.title}</span>
                      <span className="kd-s kd-ell">{[o.event.venueName, o.event.area, o.event.startTime ? fill(T.doorsAt, { t: o.event.startTime }) : null].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className="kd-tag bg-ink text-[#eeeeee]">{fill(T.nTickets, { n: o.tickets.length })}</span>
                  </a>
                );
              })}
            </section>
          ) : null}
          {pp ? <PassportSection lang={lang} pp={pp} year={year} onWrapped={() => setWrapped(true)} flush appLinks={false} /> : <div className="kd-skel mt-8 h-40" aria-hidden="true" />}
          <Badges lang={lang} items={badges} who={{ vi: 'người dùng', en: 'people' }} own className="pt-12" />
          {follows ? <FollowingSection lang={lang} f={follows} flush /> : null}
        </div>
      </div>
      {editing && u ? <EditSheet lang={lang} me={u} onClose={() => setEditing(false)} onSaved={(n) => { setMe((m) => m && { ...m, user: { ...m.user, ...n } }); setEditing(false); }} /> : null}
      {wrapped ? <WrappedSheet lang={lang} year={year} onClose={() => setWrapped(false)} /> : null}
    </div>
  );
}
