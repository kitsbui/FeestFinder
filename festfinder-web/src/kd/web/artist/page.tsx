/**
 * /a/<slug> (and ?lang=en), one column like a music service's artist page (owner, 2026-10-20): the
 * hero (their cover across the page when they have one, fading into the night under their photo
 * and their name set large), "Phát" (a link the playlist takes over), follow or claim, then in this order: the shows to come (three
 * as cards, the rest as rows), everything about them (bio, the key facts, links, the booking facts, who
 * they play with, the shows they played, the rest folded), their music (the MP3 playlist with its waveform,
 * ./playlist.tsx, then their mixes, ./mixes.tsx) and, last, the moments. Every show and every line
 * comes from canonical events; follower counts are shown, never used to rank. Anchors #shows,
 * #about, #played, #mix and #listen keep the old tabs' links working.
 */
import { CaretRightIcon, PlayIcon, SealCheckIcon } from '@phosphor-icons/react/ssr';
import { api, jsonLdHtml, type ArtistSeo, type Lang } from '@/lib/api';
import { fill, pick, type Pair, tx } from '../../copy';
import { cx } from '../../cx';
import { count, money, weekdayShort } from '../../format';
import { CHART_ORDER, familyOf, g, type Family } from '../../genre';
import { KdLink as Link, inLang } from '../../link';
import { KdProvider } from '../../runtime';
import { buttonClass } from '../../ui/actions';
import { Badges, type BadgeView } from '../../ui/badges';
import type { Moment } from '../../ui/moments';
import { RadarTag } from '../../ui/origin';
import { Accordion, Art, Avatar, DateBlock, Marker, Stat, Status, type StatusTone } from '../../ui/parts';
import type { Card } from '../../types';
import { WebFooter, WebNav } from '../chrome';
import { Crumbs } from '../crumbs';
import { WEB } from '../copy';
import { PROFILE } from '../profile/copy';
import { ProfileLinks, type ProfileLink } from '../profile/links';
import { ArtistMixes, type Mix } from './mixes';
import { LazyPlaylist } from './music';
import type { Track } from './track';
import { EventCard } from '../card';
import { MIXES } from './copy';
import { ClaimButton, FollowButton, FollowersStat, OwnerLink, PastList, ProfileMoments, RemindButton, ShareProfile, type Source } from '../profile/parts';
import { InLang } from '@/kd/ui/in-lang';

const enc = encodeURIComponent;

type Keyed = { key: string; label: Pair };
type Evidence = { events: number; lastOn: string | null; examples: { slug: string; title: string }[] };

export interface ArtistData {
  artist: {
    id: string; slug: string; name: string; bio: Pair | string | null; imageUrl: string | null; coverUrl: string | null; website: string | null;
    styles: string[]; styleLabels: (Keyed & { genre: string | null })[]; roles: Keyed[];
    basedIn: { city: string; label: Pair | null; country: string | null } | null;
    languages: string[]; activeSince: number | null;
    booking: Keyed | null; travel: Keyed | null; gigTypes: Keyed[]; setLengths: Keyed[];
    links: ProfileLink[]; openToBrands: boolean; verified: boolean; claimed: boolean;
    /** 'radar': known only from events Feest Radar found, and nobody runs the profile. */
    origin?: 'posted' | 'radar';
    /** 'owned': the artist runs it (or the team verified it); otherwise a name nobody runs yet (D13). */
    kind?: 'owned' | 'unclaimed' | 'radar';
    cities: { slug: string; label: Pair | null }[];
    followers: number;
    followingCount?: number;
  };
  upcoming: Card[];
  past: { id: string; slug: string; title: string; startsOn: string; city: string; cityLabel: Pair | null; venue: string | null }[];
  relationships: {
    organizers: ({ id: string; slug: string; name: string; logoUrl: string | null; verified: boolean } & Evidence)[];
    venues: ({ name: string; city: string; cityLabel: Pair | null } & Evidence)[];
    sharedLineups: ({ id: string; slug: string; name: string } & Evidence)[];
    similar: { id: string; slug: string; name: string; score: number }[];
  };
  gear: { id: string; slug: string; name: string; brand: string | null; category: string; categoryLabel: Pair; url: string | null; usedForLabel?: Pair }[];
  availability: { from: string; to: string; kind: 'available' | 'unavailable'; city: string | null; cityLabel: Pair | null }[];
  badges?: BadgeView[];
  moments?: Moment[];
  mixes?: Mix[];
  /** The MP3 playlist (routes/tracks.ts). */
  tracks?: Track[];
}

export async function loadArtist(slug: string, lang: Lang) {
  const [data, seo] = await Promise.all([
    api<ArtistData>(`/artists/${enc(slug)}`, { lang }),
    api<ArtistSeo>(`/seo/artists/${enc(slug)}${lang === 'vi' ? '' : '?lang=en'}`, { lang }),
  ]);
  return data && seo ? { data, seo } : null;
}

const text = (v: Pair | string | null | undefined, lang: Lang) => (!v ? '' : typeof v === 'string' ? v : tx(v, lang) || v.vi || v.en || '');
const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
/** 2027-03-01 → 01/03. */
const dm = (iso: string) => iso.slice(8, 10) + '/' + iso.slice(5, 7);

const BOOKING_TONE: Record<string, StatusTone> = { available: 'ok', limited: 'warn', touring: 'live', unavailable: 'none' };

export function ArtistPage({ data, seo, lang }: { data: ArtistData; seo: ArtistSeo; lang: Lang }) {
  const T = pick(PROFILE, lang);
  const W = pick(WEB, lang);
  const a = data.artist;
  const unclaimed = !!a.kind && a.kind !== 'owned';
  const P = pick(PROFILE, lang);
  const rel = data.relationships;
  const source: Source = { kind: 'artist', slug: a.slug };
  // The families of the nights they play, most first; their own styles say it when no show does.
  const famCount = new Map<Exclude<Family, 'free'>, number>();
  for (const f of [...data.upcoming.map((e) => familyOf(e.genre)), ...a.styleLabels.map((s) => familyOf(s.genre))]) {
    if (f !== 'free') famCount.set(f, (famCount.get(f) ?? 0) + 1);
  }
  const families = CHART_ORDER.filter((f) => famCount.get(f)).sort((x, y) => famCount.get(y)! - famCount.get(x)!);
  const tiles: Family[] = [...families, 'edm', 'fest', 'live'].filter((f, i, all) => all.indexOf(f) === i).slice(0, 3) as Family[];
  const meta = [
    a.roles.length ? a.roles.map((r) => text(r.label, lang)).join(' · ') : T.artistKind,
    ...a.styleLabels.slice(0, 2).map((s) => text(s.label, lang)),
    a.basedIn ? text(a.basedIn.label, lang) || a.basedIn.city : '',
  ].filter(Boolean).join(' · ');
  const bio = text(a.bio, lang);
  const links: ProfileLink[] = [...a.links, ...(a.website ? [{ kind: 'website', label: { vi: host(a.website), en: host(a.website) }, url: a.website }] : [])];
  // Who they play with most: the organisers who book them, then the artists on their lineups.
  const withMost = [
    ...rel.organizers.map((o) => ({ key: 'o' + o.id, href: '/o/' + o.slug, name: o.name, logo: o.logoUrl, org: true, line: fill(T.orgShows, { n: o.events }) })),
    ...rel.sharedLineups.map((x) => ({ key: 'a' + x.id, href: '/a/' + x.slug, name: x.name, logo: null, org: false, line: fill(T.together, { n: x.events }) })),
  ].slice(0, 5);
  const languages = a.languages.map((code) => {
    try { return new Intl.DisplayNames([lang], { type: 'language' }).of(code) ?? code; } catch { return code; }
  });
  const otherLang = { href: seo.page.otherLang.path, label: lang === 'vi' ? W.english : W.vietnamese };
  const past = data.past.map((e) => ({ slug: e.slug, title: e.title, startsOn: e.startsOn, venue: e.venue, cityLabel: e.cityLabel }));
  const month = (iso: string) => {
    const m = Number(iso.slice(5, 7));
    return lang === 'vi' ? 'Th' + m : new Date(Date.UTC(2000, m - 1, 15)).toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' });
  };

  const M = pick(MIXES, lang);
  const mixes = data.mixes ?? [];
  const tracks = data.tracks ?? [];
  // The upcoming shows: three as cards, the rest as dated rows.
  const highlights = data.upcoming.slice(0, 3);
  const rest = data.upcoming.slice(3);
  const facts: { k: string; v: string }[] = [
    a.roles.length ? { k: T.rolesK, v: a.roles.map((r) => text(r.label, lang)).join(', ') } : null,
    a.styleLabels.length ? { k: T.stylesK, v: a.styleLabels.map((x) => text(x.label, lang)).join(', ') } : null,
    a.basedIn ? { k: T.basedIn, v: text(a.basedIn.label, lang) || a.basedIn.city } : null,
    a.booking ? { k: T.booking, v: text(a.booking.label, lang) } : null,
    a.travel ? { k: T.travel, v: text(a.travel.label, lang) } : null,
    a.gigTypes.length ? { k: T.gigTypes, v: a.gigTypes.map((x) => text(x.label, lang)).join(', ') } : null,
    a.setLengths.length ? { k: T.setLengths, v: a.setLengths.map((x) => text(x.label, lang)).join(', ') } : null,
    languages.length ? { k: T.languages, v: languages.join(', ') } : null,
    a.activeSince ? { k: T.active, v: fill(T.since, { y: a.activeSince }) } : null,
    a.openToBrands ? { k: T.brands, v: '✓' } : null,
  ].filter((x): x is { k: string; v: string } => !!x);

  const rows = (items: Card[]) => (
    <ol className="flex flex-col">
      {items.map((e) => {
        const fam = familyOf(e.genre);
        const free = e.isFree || e.entryMode === 'free';
        const tickets = !free && !e.soldOut && !e.past;
        return (
          <li key={e.id} className={cx('grid min-h-22 grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 border-b border-line-1', g(fam))}>
            {e.startsOn ? <DateBlock top={weekdayShort(e.startsOn, lang)} day={Number(e.startsOn.slice(8, 10))} bottom={month(e.startsOn)} /> : <span />}
            <span className="flex min-w-0 flex-col gap-1">
              <Link href={inLang('/e/' + e.slug, lang)} className="kd-h kd-ell kd-hit hover:underline">{e.title}</Link>
              <span className="kd-s kd-ell flex items-center gap-1.5"><Marker family={fam} />{[e.venue.name, tx(e.cityLabel, lang)].filter(Boolean).join(' · ')}</span>
            </span>
            <span className="flex items-center gap-3.5">
              <span className={cx('kd-mb kd-num hidden tab:inline', free && 'text-info')}>
                {free ? T.freeEntry : e.soldOut ? T.soldOut : fill(T.fromPrice, { p: money(e.priceFrom, e.currency, lang) })}
              </span>
              {tickets ? <a className={buttonClass({ size: 'sm' })} href={`/go/${enc(e.slug)}?src=artist`}>{T.buy}</a> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );

  return (
    <InLang lang={lang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(seo.jsonLd) }} />
      <KdProvider lang={lang}>
        <div className="flex min-h-dvh flex-col" lang={lang}>
          <WebNav lang={lang} current="artists" />
          <Crumbs width="page" label={W.crumbs} items={seo.page.crumbs.map((c, i, all) => (i === all.length - 1 ? { name: c.name } : { name: c.name, href: c.path }))} />

          {/* ---- the hero: their cover across the page, fading into the night under their name (no cover, no banner) ---- */}
          <header className={cx('relative', g(tiles[0]))}>
            {a.coverUrl ? (
              <div className="kd-wrap" aria-hidden="true">
                <div className="kd-artist-cover relative overflow-hidden rounded-card">
                  <Art family={tiles[0]} cover={a.coverUrl} eager className="absolute inset-0 rounded-none" />
                  <div className="kd-hero-fade absolute inset-0" />
                </div>
              </div>
            ) : null}
            <div className={cx('kd-wrap relative', a.coverUrl ? '-mt-24 tab:-mt-32' : 'pt-6')}>
              <div className="mx-auto flex max-w-page flex-col items-start gap-5 tab:flex-row tab:items-end tab:gap-8">
                {/* Without a cover, the photo is the page's main picture (on a phone, larger than the name): fetched first. */}
                <Avatar ring name={a.name} src={a.imageUrl} size={192} eager={a.coverUrl ? false : 'high'} className="kd-artist-photo shrink-0" />
                <div className="flex min-w-0 flex-col gap-3 pb-1">
                  <span className="kd-m flex flex-wrap items-center gap-2">
                    {a.verified ? <><SealCheckIcon size={18} weight="fill" className="text-info" aria-hidden="true" /><span>{T.artistVerified}</span></> : <span>{T.artistKind}</span>}
                    {a.origin === 'radar' ? <RadarTag lang={lang} /> : null}
                    {unclaimed ? <span className="kd-tag">{P.unclaimed}</span> : null}
                  </span>
                  <h1 className="kd-artist-name">{a.name}</h1>
                  <span className="kd-s">{meta}</span>
                </div>
              </div>
            </div>
          </header>

          <main className="kd-wrap flex flex-col">
            <div className="mx-auto flex w-full max-w-page flex-col">
              {/* ---- what to do: play, follow (or claim), share ---- */}
              <div className="flex flex-wrap items-center gap-3 pt-7">
                {tracks.length || mixes.length ? (
                  // The playlist plays it when its code is in (data-play-artist); before that, and without tracks, it is a link.
                  <a href={tracks.length ? '#listen' : '#mix'} data-play-artist={tracks.length ? '' : undefined} className={buttonClass({ tone: 'acc', glow: true, pill: true })}>
                    <PlayIcon size={20} weight="fill" aria-hidden="true" />{M.playTrack}
                  </a>
                ) : null}
                {unclaimed ? (
                  // Nobody runs this profile: claiming it is the action, and a fan asks to be told instead of following.
                  <>
                    <ClaimButton lang={lang} kind="artist" name={a.name} />
                    <RemindButton lang={lang} name={a.name} />
                  </>
                ) : (
                  <>
                    <FollowButton lang={lang} kind="art" id={a.id} name={a.name} source={source} />
                    <OwnerLink lang={lang} source={source} href="/studio/artist" />
                  </>
                )}
                <ShareProfile lang={lang} title={a.name} />
                {a.booking ? <Status tone={BOOKING_TONE[a.booking.key] ?? 'none'}>{text(a.booking.label, lang)}</Status> : null}
              </div>
              {!unclaimed || a.claimed ? (
                <div className="mt-6 flex flex-wrap gap-x-12 gap-y-4 border-y border-line-1 py-4">
                  {unclaimed ? null : <FollowersStat lang={lang} kind="art" id={a.id} source={source} served={a.followers} />}
                  {a.claimed ? <Stat value={count(a.followingCount ?? 0, lang)} label={T.followingN} /> : null}
                  <Stat value={count(data.upcoming.length, lang)} label={T.upcomingTab} />
                </div>
              ) : null}

              {/* ---- 1. the shows to come, first ---- */}
              <section id="shows" aria-labelledby="shows-h" className="flex scroll-mt-32 flex-col gap-5 pt-12">
                <h2 id="shows-h" className="kd-d2">{T.upcomingTab}</h2>
                {highlights.length ? (
                  <>
                    {/* One or two shows share the row in halves; three or more take the cards' grid. */}
                    <div className={highlights.length < 3 ? 'grid grid-cols-1 gap-x-4 gap-y-7 tab:grid-cols-2' : 'kd-cards'}>
                      {highlights.map((e) => {
                        const tickets = !(e.isFree || e.entryMode === 'free') && !e.soldOut && !e.past;
                        return (
                          <div key={e.id} className="flex min-w-0 flex-col gap-3">
                            <EventCard e={e} lang={lang} />
                            {tickets ? <a className={buttonClass({ size: 'sm' }, 'self-start')} href={`/go/${enc(e.slug)}?src=artist`}>{T.buy}</a> : null}
                          </div>
                        );
                      })}
                    </div>
                    {rest.length ? rows(rest) : null}
                  </>
                ) : <p className="kd-t text-fg-3">{T.noShows}</p>}
              </section>

              {/* ---- 2. everything about them ---- */}
              <section id="about" aria-labelledby="about-h" className="flex scroll-mt-32 flex-col gap-6 pt-14">
                <h2 id="about-h" className="kd-d2">{T.about}</h2>
                {bio ? <p className="kd-tl max-w-read whitespace-pre-line text-fg-1">{bio}</p> : null}
                {/* The key facts right under the bio (owner, 2026-10-20). */}
                <Accordion small summary={seo.headings.facts} className="max-w-read border-y border-line-1">
                  <div className="flex flex-col gap-3">
                    <p className="kd-s">{seo.page.summary}</p>
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 tab:grid-cols-2">
                      {seo.page.facts.map((f) => (
                        <div key={f.label} className="flex flex-col gap-0.5">
                          <dt className="kd-m">{f.label}</dt>
                          <dd className="kd-s text-fg-2">{f.href ? <a href={f.href} rel={/^https?:/.test(f.href) ? 'noopener' : undefined} className="underline decoration-line-2 underline-offset-4 hover:text-fg-1">{f.value}</a> : f.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </Accordion>
                {links.length ? <ProfileLinks links={links} lang={lang} label={T.listen} /> : null}
                {facts.length ? (
                  <dl className="grid grid-cols-1 gap-x-8 gap-y-4 border-y border-line-1 py-5 tab:grid-cols-2 desk:grid-cols-3">
                    {facts.map((f) => (
                      <div key={f.k} className="flex flex-col gap-0.5">
                        <dt className="kd-m">{f.k}</dt>
                        <dd className="kd-hs">{f.v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {withMost.length ? (
                  <div className="flex flex-col gap-3">
                    <h3 className="kd-h">{T.mostWith}</h3>
                    <ul className="grid grid-cols-1 gap-x-6 tab:grid-cols-2 desk:grid-cols-3">
                      {withMost.map((x) => (
                        <li key={x.key}>
                          <Link className="kd-lrow" href={inLang(x.href, lang)}>
                            <Avatar name={x.name} src={x.logo} size={40} org={x.org} />
                            <span className="flex min-w-0 flex-1 flex-col">
                              <span className="kd-hs kd-ell">{x.name}</span>
                              <span className="kd-s">{x.line}</span>
                            </span>
                            <CaretRightIcon size={16} className="text-fg-3" aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="grid grid-cols-1 gap-x-8 border-t border-line-1 tab:grid-cols-2">
                  {data.availability.length ? (
                    <Accordion small summary={T.dates} aside={data.availability.length}>
                      <ul className="flex flex-col">
                        {data.availability.map((w) => (
                          <li key={w.from + w.kind} className="kd-lrow min-h-11">
                            <span className="kd-mb kd-num">{w.from === w.to ? dm(w.from) : `${dm(w.from)} – ${dm(w.to)}`}</span>
                            <span className="kd-s flex-1">{text(w.cityLabel, lang)}</span>
                            <Status tone={w.kind === 'unavailable' ? 'none' : 'ok'}>{w.kind === 'unavailable' ? T.busy : T.free}</Status>
                          </li>
                        ))}
                      </ul>
                    </Accordion>
                  ) : null}
                  {past.length ? (
                    <Accordion small summary={T.pastTab} aside={past.length} id="played">
                      <PastList lang={lang} items={past} />
                    </Accordion>
                  ) : null}
                  {rel.venues.length ? (
                    <Accordion small summary={T.playedAt} aside={rel.venues.length}>
                      <ul className="flex flex-col">
                        {rel.venues.map((v) => (
                          <li key={v.name + v.city} className="kd-lrow">
                            <span className="flex min-w-0 flex-1 flex-col"><span className="kd-hs kd-ell">{v.name}</span><span className="kd-s">{text(v.cityLabel, lang) || v.city}</span></span>
                            <span className="kd-mb kd-num">{v.events}</span>
                          </li>
                        ))}
                      </ul>
                    </Accordion>
                  ) : null}
                  {data.gear.length ? (
                    <Accordion small summary={T.gear} aside={data.gear.length}>
                      <ul className="flex flex-col">
                        {data.gear.map((x) => (
                          <li key={x.id} className="kd-lrow">
                            <span className="flex min-w-0 flex-1 flex-col">
                              {x.url ? <a href={x.url} rel="noopener sponsored" className="kd-hit kd-hs kd-ell hover:underline">{[x.brand, x.name].filter(Boolean).join(' ')}</a> : <span className="kd-hs kd-ell">{[x.brand, x.name].filter(Boolean).join(' ')}</span>}
                              <span className="kd-s">{[text(x.categoryLabel, lang), text(x.usedForLabel, lang)].filter(Boolean).join(' · ')}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </Accordion>
                  ) : null}
                </div>
                <Badges lang={lang} items={data.badges} who={{ vi: 'nghệ sĩ', en: 'artists' }} />
              </section>

              {/* ---- 3. their music: the MP3 playlist, then their mixes ---- */}
              {tracks.length || mixes.length ? (
                <section id="listen" aria-labelledby="listen-h" className="flex scroll-mt-32 flex-col gap-6 pt-14">
                  <h2 id="listen-h" className="kd-d2">{M.title}</h2>
                  {tracks.length ? <LazyPlaylist lang={lang} tracks={tracks} artist={a.name} /> : null}
                  {mixes.length ? (
                    <ArtistMixes lang={lang} slug={a.slug} items={mixes} title={M.tab} id="mix" />
                  ) : null}
                </section>
              ) : null}

              {/* ---- 4. the moments, last ---- */}
              <ProfileMoments lang={lang} source={source} items={data.moments ?? []} className="pt-14" />
            </div>
          </main>

          <div className="mt-auto">
            <WebFooter lang={lang} otherLang={otherLang} />
          </div>
        </div>
      </KdProvider>
    </InLang>
  );
}
