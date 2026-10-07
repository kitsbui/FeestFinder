'use client';
/**
 * /app/profile, the "Tôi" tab, in Kính đêm (design/Profile-Fan-App): who you are, how many nights
 * you went to and have coming, the tickets coming up, the raver passport (a stamp per scanned
 * ticket, filtered by family) and Wrapped, your sound, your photos (Moments), your badges, who
 * you follow, and settings. Private: it is the signed-in person's own (owner decision 2).
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CaretRightIcon, GearSixIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../copy';
import { cx } from '../cx';
import { dayMonth, weekdayShort } from '../format';
import { CHART_ORDER, FAMILY_LABEL, familyOf, g, type Family } from '../genre';
import { inLang } from '../link';
import { useKd } from '../runtime';
import { Button, Chip } from '../ui/actions';
import { FieldError, FieldLabel, Input, Segmented, Select } from '../ui/forms';
import { Accordion, Art, Avatar, Stamp, Stat } from '../ui/parts';
import { AppBar } from '../ui/shell';
import { Sheet } from '../ui/sheet';
import { MomentsSection } from '../moments';
import { Badges, type BadgeView } from '../ui/badges';
import type { Moment } from '../ui/moments';
import { APP } from './copy';
import { useCity, useDiscovery } from './explore';
import { useApp } from './root';
import { SignInCard } from './row';

export interface Me { user: { id: string; name: string | null; email: string | null; phone: string | null; city: string | null; photoUrl: string | null; locale: 'vi' | 'en' } }
export interface Passport { stats: { nights: number; events: number; genres: number; venues: number; cities: number }; stamps: { eventId: string; slug: string; title: string; genre: string | null; date: string; venue: string | null }[] }
export interface Follows {
  organizers: { following: { id: string; slug: string; name: string; logoUrl: string | null; next: { slug: string; title: string; startsOn: string } | null }[] };
  artists: string[];
  artistPages?: { name: string; slug: string | null }[];
}
export interface Order { id: string; status: string; event: { slug: string; title: string; startsOn: string; startTime: string | null; venueName: string | null; area: string | null; genre: string | null; endsAt: string | null }; tickets: unknown[] }

export function Profile({ lang }: { lang: Lang }) {
  const T = pick(APP, lang);
  const kd = useKd();
  return (
    <>
      <AppBar className="pr-1.5">
        <span className="kd-m">{T.myProfile}</span>
        <a className="kd-ib ml-auto" href="#settings" aria-label={T.settings}><GearSixIcon size={22} aria-hidden="true" /></a>
      </AppBar>
      {kd.session === undefined ? <div className="kd-skel mx-4 mt-2 h-40" aria-hidden="true" /> : kd.user ? <Mine lang={lang} /> : <SignInCard lang={lang} note={T.gateMe} />}
      <Settings lang={lang} />
    </>
  );
}

function Mine({ lang }: { lang: Lang }) {
  const T = pick(APP, lang);
  const [me, setMe] = useState<Me | null>(null);
  const [pp, setPp] = useState<Passport | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [follows, setFollows] = useState<Follows | null>(null);
  const [badges, setBadges] = useState<BadgeView[] | null>(null);
  const [moments, setMoments] = useState<Moment[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [wrapped, setWrapped] = useState(false);
  const { clockReady } = useKd();
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

  return (
    <div className="flex flex-col">
      <section className="flex flex-col gap-4 px-4 pt-1" aria-label={T.myProfile}>
        <div className="flex items-center gap-3.5">
          <Avatar name={u?.name || u?.email || '?'} src={u?.photoUrl} size={72} acc />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1 className="kd-d3 kd-ell">{u?.name || '…'}</h1>
            <span className="kd-m kd-ell normal-case">{[u?.email || u?.phone, u?.city].filter(Boolean).join(' · ')}</span>
          </div>
          <Button size="sm" onClick={() => setEditing(true)} disabled={!u}>{T.edit}</Button>
        </div>
        <div className="grid grid-cols-2 border-y border-line py-3.5">
          <Stat value={pp ? pp.stats.nights : '–'} label={T.went} />
          <Stat value={orders ? coming.length : '–'} label={T.going} />
        </div>
      </section>

      {coming.length ? (
        <section className="flex flex-col gap-2.5 px-4 pt-7" aria-labelledby="pf-going">
          <div className="flex items-baseline justify-between"><h2 id="pf-going" className="kd-h">{T.going}</h2><a className="kd-s text-mist" href="/app/tickets">{T.allTickets}</a></div>
          {coming.slice(0, 3).map((o, i) => {
            const fam = familyOf(o.event.genre);
            return (
              <a key={o.id} href="/app/tickets" className={cx('kd-bonecard grid grid-cols-[76px_minmax(0,1fr)_auto] items-center gap-3.5 py-1.5 pl-1.5 pr-3.5', g(fam))}>
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

      {pp ? <PassportSection lang={lang} pp={pp} year={year} onWrapped={() => setWrapped(true)} /> : null}
      {moments ? <MomentsSection lang={lang} as="user" items={moments} owner compact className="px-4 pt-8" /> : null}
      <Badges lang={lang} items={badges} who={{ vi: 'người dùng', en: 'people' }} own compact className="px-4 pt-8" />
      {follows ? <FollowingSection lang={lang} f={follows} /> : null}

      {editing && u ? <EditSheet lang={lang} me={u} onClose={() => setEditing(false)} onSaved={(n) => { setMe((m) => m && { ...m, user: { ...m.user, ...n } }); setEditing(false); }} /> : null}
      {wrapped ? <WrappedSheet lang={lang} year={year} onClose={() => setWrapped(false)} /> : null}
    </div>
  );
}

export function PassportSection({ lang, pp, year, onWrapped, flush, appLinks = true }: { lang: Lang; pp: Passport; year: number; onWrapped: () => void; flush?: boolean; appLinks?: boolean }) {
  const T = pick(APP, lang);
  const [only, setOnly] = useState<Family | null>(null);
  const [all, setAll] = useState(false);
  const mix = useMemo(() => {
    const n = new Map<Family, number>();
    for (const s of pp.stamps) { const f = familyOf(s.genre); if (f !== 'free') n.set(f, (n.get(f) ?? 0) + 1); }
    return CHART_ORDER.filter((f) => n.get(f)).map((f) => ({ f, n: n.get(f)! }));
  }, [pp.stamps]);
  const shown = all ? pp.stamps : pp.stamps.slice(0, 8);
  return (
    <>
      <section className={cx('flex flex-col gap-3 pt-8', !flush && 'px-4')} aria-labelledby="pf-pass">
        <div className="flex items-baseline justify-between"><h2 id="pf-pass" className="kd-h">{T.passport}</h2><span className="kd-m kd-num">{fill(T.stamps, { n: pp.stamps.length })}</span></div>
        <span className="kd-s">{fill(T.passportLine, { n: pp.stats.nights, g: pp.stats.genres, c: pp.stats.cities })}</span>
        {pp.stamps.length ? (
          <>
            <div className="kd-hscroll" role="group" aria-label={T.genres}>
              {mix.map(({ f }) => <Chip key={f} family={f} on={only === f} onClick={() => setOnly(only === f ? null : f)}>{FAMILY_LABEL[f][lang]}</Chip>)}
            </div>
            <ul className="mt-1 grid grid-cols-4 gap-x-2 gap-y-3.5">
              {shown.map((s) => (
                <li key={s.eventId}>
                  <Stamp family={familyOf(s.genre)} date={dayMonth(s.date, lang)} name={s.title} dim={!!only && familyOf(s.genre) !== only} href={appLinks ? '/app/e/' + s.slug : inLang('/e/' + s.slug, lang)} />
                </li>
              ))}
            </ul>
            {pp.stamps.length > 8 ? <button type="button" className="kd-more" onClick={() => setAll(!all)} aria-expanded={all}>{all ? T.showLess : fill(T.seeAll, { n: pp.stamps.length - 8 })}</button> : null}
          </>
        ) : <p className="kd-s">{T.noStamps}</p>}
        <Button size="sm" className="self-start" onClick={onWrapped}>{fill(T.wrapped, { y: year })}</Button>
      </section>

      {mix.length ? (
        <section className={cx('flex flex-col gap-3.5 pt-8', !flush && 'px-4')} aria-labelledby="pf-sound">
          <div className="flex items-baseline justify-between"><h2 id="pf-sound" className="kd-h">{T.yourSound}</h2><span className="kd-m">{T.byNights}</span></div>
          <div className="flex h-3 gap-0.5" role="img" aria-label={mix.map((x) => `${FAMILY_LABEL[x.f][lang]} ${x.n}`).join(', ')}>
            {mix.map((x, i) => <i key={x.f} className={cx(g(x.f), 'bg-[var(--g)]', i === 0 && 'rounded-l', i === mix.length - 1 && 'rounded-r')} style={{ flex: `${x.n} 1 0` }} />)}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {mix.map((x) => (
              <span key={x.f} className={cx('kd-s flex items-center gap-2 text-mist', g(x.f))}><span className="kd-mk" aria-hidden="true" />{FAMILY_LABEL[x.f][lang]}<span className="kd-mb kd-num ml-auto">{x.n}</span></span>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

export function FollowingSection({ lang, f, flush }: { lang: Lang; f: Follows; flush?: boolean }) {
  const T = pick(APP, lang);
  const rows = [
    ...(f.artistPages ?? f.artists.map((name) => ({ name, slug: null }))).map((a) => ({ key: 'a:' + a.name, href: a.slug ? '/a/' + a.slug : null, name: a.name, org: false, logo: null as string | null, line: T.artistRole })),
    ...f.organizers.following.map((o) => ({
      key: 'o:' + o.id, href: '/o/' + o.slug, name: o.name, org: true, logo: o.logoUrl,
      line: o.next ? fill(T.orgNext, { d: dayMonth(o.next.startsOn, lang) }) : T.orgNone,
    })),
  ];
  if (!rows.length) return null;
  return (
    <section className={cx('flex flex-col pt-8', !flush && 'px-4')} aria-labelledby="pf-follow">
      <div className="flex items-baseline justify-between pb-1.5"><h2 id="pf-follow" className="kd-h">{T.followingTitle}</h2><span className="kd-m kd-num">{rows.length}</span></div>
      {rows.slice(0, 6).map((r) => {
        const body = (
          <>
            <Avatar name={r.name} src={r.logo} size={44} org={r.org} />
            <span className="flex min-w-0 flex-1 flex-col"><span className="kd-hs kd-ell">{r.name}</span><span className="kd-s kd-ell">{r.line}</span></span>
            {r.href ? <CaretRightIcon size={16} className="text-fog" aria-hidden="true" /> : null}
          </>
        );
        // A followed name nobody is listed under yet has no page to open.
        return r.href
          ? <a key={r.key} className="kd-lrow min-h-16" href={r.href + (lang === 'en' ? '?lang=en' : '')}>{body}</a>
          : <div key={r.key} className="kd-lrow min-h-16">{body}</div>;
      })}
    </section>
  );
}

function Settings({ lang }: { lang: Lang }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const { setLang } = useApp();
  const meta = useDiscovery();
  const [city, setCity] = useCity(meta);
  const pickLang = (l: Lang) => {
    setLang(l);
    if (kd.user) FF.fire(FF.patch('/me', { locale: l }));
  };
  return (
    <div id="settings" className="scroll-mt-4 px-4 pb-6 pt-6">
      <Accordion summary={T.settings} open className="border-t border-line">
        <div className="flex flex-col">
          {kd.user ? (
            <>
              <a className="kd-lrow" href="/app/alerts"><span className="flex flex-1 flex-col"><span className="kd-hs">{T.alerts}</span><span className="kd-s">{T.alertsSub}</span></span><CaretRightIcon size={16} className="text-fog" aria-hidden="true" /></a>
              <a className="kd-lrow" href="/app/settings"><span className="flex flex-1 flex-col"><span className="kd-hs">{T.notifSettings}</span><span className="kd-s">{T.notifSub}</span></span><CaretRightIcon size={16} className="text-fog" aria-hidden="true" /></a>
            </>
          ) : null}
          <div className="kd-lrow">
            <label htmlFor="pf-city" className="kd-hs flex-1">{T.city}</label>
            <Select id="pf-city" value={city ?? ''} onChange={(e) => setCity(e.target.value)} boxClass="h-10 w-44">
              {(meta?.cities ?? []).map((c) => <option key={c.slug} value={c.slug}>{c.name[lang]}</option>)}
            </Select>
          </div>
          <div className="kd-lrow">
            <span className="kd-hs flex-1">{T.language}</span>
            <Segmented label={T.language} value={lang} onChange={pickLang} options={[{ value: 'vi', label: 'Tiếng Việt' }, { value: 'en', label: 'English' }]} />
          </div>
          {kd.user ? <button type="button" className="kd-lrow w-full text-left text-[15px] text-fog" onClick={() => kd.signOut()}>{T.signOut}</button> : null}
        </div>
      </Accordion>
    </div>
  );
}

export function EditSheet({ lang, me, onClose, onSaved }: { lang: Lang; me: Me['user']; onClose: () => void; onSaved: (n: { name: string; city: string | null }) => void }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [name, setName] = useState(me.name ?? '');
  const [city, setCity] = useState(me.city ?? '');
  const [err, setErr] = useState('');
  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await FF.patch('/me', { name: name.trim(), city: city.trim() });
      kd.toast(T.saved2);
      onSaved({ name: name.trim(), city: city.trim() || null });
      kd.refresh();
    } catch (x) { setErr(FF.errorText(x, lang)); }
  };
  return (
    <Sheet title={T.editTitle} closeLabel={T.close} onClose={onClose}>
      <form className="flex flex-col gap-3 pt-1" onSubmit={save}>
        <div className="flex flex-col gap-1.5"><FieldLabel htmlFor="pf-name">{T.name}</FieldLabel><Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} /></div>
        <div className="flex flex-col gap-1.5"><FieldLabel htmlFor="pf-city2">{T.city}</FieldLabel><Input id="pf-city2" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} /></div>
        {err ? <FieldError>{err}</FieldError> : null}
        <Button type="submit" tone="acc" block>{T.save}</Button>
      </form>
    </Sheet>
  );
}

interface Wrapped {
  year: number; empty: boolean; nights: number; events: number; topGenre: { genre: string; nights: number } | null; topArtist: { name: string; times: number } | null;
  topVenue: { name: string; times: number } | null; posts: number; helpful: number; brought: number; passedOn: number; cities: { vi: string; en: string }[];
}

export function WrappedSheet({ lang, year, onClose }: { lang: Lang; year: number; onClose: () => void }) {
  const T = pick(APP, lang);
  const kd = useKd();
  const [w, setW] = useState<Wrapped | null>(null);
  useEffect(() => { FF.maybe(FF.get('/me/wrapped?year=' + year), null).then(setW); }, [year]);
  const share = async () => {
    if (!w) return;
    const how = await FF.shareStory({
      genre: w.topGenre?.genre, kicker: fill(T.wrapped, { y: w.year }), title: `${w.nights} ${T.wrNights}`,
      lines: [w.topGenre ? `${T.wrGenre}: ${w.topGenre.genre}` : '', w.topArtist ? `${T.wrArtist}: ${w.topArtist.name}` : '', w.topVenue ? `${T.wrVenue}: ${w.topVenue.name}` : ''].filter(Boolean),
      url: location.host,
    }, 'wrapped-' + w.year).catch((e: unknown) => { kd.toast(FF.errorText(e, lang)); return null; });
    if (how === 'saved') kd.toast(T.storySaved);
  };
  return (
    <Sheet title={fill(T.wrapped, { y: year })} closeLabel={T.close} onClose={onClose}>
      {!w ? <div className="kd-skel h-40" aria-hidden="true" /> : w.empty ? <p className="kd-t">{fill(T.wrEmpty, { y: year })}</p> : (
        <div className={cx('flex flex-col gap-4 pt-1', g(familyOf(w.topGenre?.genre)))}>
          <div className="flex items-baseline gap-2"><span className="kd-d1 kd-num">{w.nights}</span><span className="kd-t">{T.wrNights}</span></div>
          <dl className="flex flex-col">
            {w.topGenre ? <Row k={T.wrGenre} v={w.topGenre.genre} /> : null}
            {w.topArtist ? <Row k={T.wrArtist} v={`${w.topArtist.name} · ${fill(T.wrTimes, { n: w.topArtist.times })}`} /> : null}
            {w.topVenue ? <Row k={T.wrVenue} v={`${w.topVenue.name} · ${fill(T.wrTimes, { n: w.topVenue.times })}`} /> : null}
          </dl>
          <div className="flex flex-col gap-1">
            <span className="kd-m">{T.wrGave}</span>
            <span className="kd-s">{[`${w.posts} ${T.wrPosts}`, `${w.helpful} ${T.wrHelpful}`, `${w.brought} ${T.wrBrought}`, `${w.passedOn} ${T.wrPassed}`].join(' · ')}</span>
          </div>
          <Button tone="acc" block onClick={share}>{T.wrShare}</Button>
        </div>
      )}
    </Sheet>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="kd-lrow min-h-11"><dt className="kd-s flex-1">{k}</dt><dd className="kd-hs text-right">{v}</dd></div>;
}
