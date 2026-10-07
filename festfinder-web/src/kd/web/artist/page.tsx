/**
 * /a/<slug> (and ?lang=en) in Kính đêm (design/Profile-Artist-Web): the cover, the artist, their
 * numbers, upcoming shows as dated rows (the next one in bone) and the ones they played, then their
 * bio and links, who they play with most, and the booking details. Every show and every line comes
 * from canonical events; follower counts are shown, never used to rank. The server renders it with
 * its structured data; following and the owner's controls come in the browser.
 */
import { CaretRightIcon, SealCheckIcon } from '@phosphor-icons/react/ssr';
import { api, jsonLdHtml, type ArtistSeo, type Lang } from '@/lib/api';
import { fill, pick, type Pair } from '../../copy';
import { cx } from '../../cx';
import { count, money, weekdayShort } from '../../format';
import { CHART_ORDER, FAMILY_LABEL, familyOf, g, type Family } from '../../genre';
import { KdLink as Link, inLang } from '../../link';
import { KdProvider } from '../../runtime';
import { buttonClass } from '../../ui/actions';
import { Badges, type BadgeView } from '../../ui/badges';
import type { Moment } from '../../ui/moments';
import { Clamp } from '../../ui/clamp';
import { Accordion, Art, Avatar, DateBlock, Marker, Stat, Status, type StatusTone } from '../../ui/parts';
import type { Card } from '../../types';
import { Crumbs, WebFooter, WebNav } from '../chrome';
import { WEB } from '../copy';
import { PROFILE } from '../profile/copy';
import { ProfileLinks, type ProfileLink } from '../profile/links';
import { ClaimLink, EventTabs, FollowButton, FollowersStat, OwnerLink, PastList, ProfileMoments, ShareProfile, type Source } from '../profile/parts';

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
    cities: { slug: string; label: Pair | null }[];
    followers: number;
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
  availability: { from: string; to: string; kind: 'available' | 'busy' | string; city: string | null; cityLabel: Pair | null }[];
  badges?: BadgeView[];
  moments?: Moment[];
}

export async function loadArtist(slug: string, lang: Lang) {
  const [data, seo] = await Promise.all([
    api<ArtistData>(`/artists/${enc(slug)}`, { lang }),
    api<ArtistSeo>(`/seo/artists/${enc(slug)}${lang === 'en' ? '?lang=en' : ''}`, { lang }),
  ]);
  return data && seo ? { data, seo } : null;
}

const text = (v: Pair | string | null | undefined, lang: Lang) => (!v ? '' : typeof v === 'string' ? v : v[lang] || v.vi || v.en || '');
const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
/** 2027-03-01 → 01/03. */
const dm = (iso: string) => iso.slice(8, 10) + '/' + iso.slice(5, 7);

const BOOKING_TONE: Record<string, StatusTone> = { available: 'ok', limited: 'warn', touring: 'live', unavailable: 'none' };

export function ArtistPage({ data, seo, lang }: { data: ArtistData; seo: ArtistSeo; lang: Lang }) {
  const T = pick(PROFILE, lang);
  const W = pick(WEB, lang);
  const a = data.artist;
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
  const hasBooking = !!(a.booking || a.travel || a.gigTypes.length || a.setLengths.length || languages.length || a.openToBrands || a.activeSince);
  const otherLang = { href: seo.page.otherLang.path, label: lang === 'vi' ? W.english : W.vietnamese };
  const past = data.past.map((e) => ({ slug: e.slug, title: e.title, startsOn: e.startsOn, venue: e.venue, cityLabel: e.cityLabel }));
  const month = (iso: string) => {
    const m = Number(iso.slice(5, 7));
    return lang === 'vi' ? 'Th' + m : new Date(Date.UTC(2000, m - 1, 15)).toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' });
  };

  const shows = data.upcoming.length ? (
    <ol className="flex flex-col">
      {data.upcoming.map((e, i) => {
        const fam = familyOf(e.genre);
        const free = e.isFree || e.entryMode === 'free';
        const tickets = !free && !e.soldOut && !e.past;
        return (
          <li key={e.id} className={cx('grid min-h-22 grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 border-b border-line', g(fam))}>
            {e.startsOn ? <DateBlock hi={i === 0} top={weekdayShort(e.startsOn, lang)} day={Number(e.startsOn.slice(8, 10))} bottom={month(e.startsOn)} /> : <span />}
            <span className="flex min-w-0 flex-col gap-1">
              <Link href={inLang('/e/' + e.slug, lang)} className="kd-h kd-ell hover:underline">{e.title}</Link>
              <span className="kd-s kd-ell flex items-center gap-1.5"><Marker family={fam} />{[e.venue.name, e.cityLabel?.[lang]].filter(Boolean).join(' · ')}</span>
            </span>
            <span className="flex items-center gap-3.5">
              <span className={cx('kd-mb kd-num hidden tab:inline', free && 'text-acc')}>
                {free ? T.freeEntry : e.soldOut ? T.soldOut : fill(T.fromPrice, { p: money(e.priceFrom, e.currency, lang) })}
              </span>
              {tickets ? <a className={buttonClass({ size: 'sm', tone: i === 0 ? 'acc' : 'default' })} href={`/go/${enc(e.slug)}?src=artist`}>{T.buy}</a> : null}
            </span>
          </li>
        );
      })}
    </ol>
  ) : <p className="kd-t pt-5 text-fog">{T.noShows}</p>;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(seo.jsonLd) }} />
      <KdProvider lang={lang}>
        <div className="flex min-h-dvh flex-col" lang={lang}>
          <WebNav lang={lang} />
          <Crumbs label={W.crumbs} items={seo.page.crumbs.map((c, i, all) => (i === all.length - 1 ? { name: c.name } : { name: c.name, href: c.path }))} />

          {/* ---- cover ---- */}
          <div className="kd-wrap" aria-hidden="true">
            {a.coverUrl ? (
              <Art family={tiles[0]} cover={a.coverUrl} className="h-[clamp(140px,17vw,240px)]" />
            ) : (
              <div className="grid h-[clamp(140px,17vw,240px)] grid-cols-[2fr_1fr_1fr] gap-2">
                {tiles.map((f, i) => <Art key={f} family={f} bone={i === 1} />)}
              </div>
            )}
          </div>

          {/* ---- who ---- */}
          <section className="kd-wrap" aria-label={T.artistKind}>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 pl-[clamp(0px,2vw,24px)]">
              <div className="flex min-w-0 flex-wrap items-end gap-x-6 gap-y-4">
                <Avatar ring name={a.name} src={a.imageUrl} size={128} className="-mt-12 h-24! w-24! text-[40px]! tab:-mt-16 tab:h-32! tab:w-32! tab:text-[54px]!" />
                <div className="flex min-w-0 flex-col gap-2">
                  <h1 className="kd-d1">
                    {a.name}
                    {a.verified ? <SealCheckIcon size={28} weight="fill" className="ml-3 inline-block align-[-0.05em] text-acc" role="img" aria-label={T.artistVerified} /> : null}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                    <span className="kd-m">{meta}</span>
                    {families.map((f) => <span key={f} className={cx('kd-tag', g(f))}><span className="kd-mk" aria-hidden="true" />{FAMILY_LABEL[f][lang]}</span>)}
                    {a.booking ? <Status tone={BOOKING_TONE[a.booking.key] ?? 'none'}>{text(a.booking.label, lang)}</Status> : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FollowButton lang={lang} kind="art" id={a.name} name={a.name} source={source} />
                <OwnerLink lang={lang} source={source} href="/ops/artist" />
                <ShareProfile lang={lang} title={a.name} />
              </div>
            </div>
            <div className="mt-7 grid auto-cols-fr grid-flow-col border-y border-line py-4.5">
              <FollowersStat lang={lang} kind="art" id={a.name} source={source} served={a.followers} />
              <Stat value={count(data.upcoming.length, lang)} label={T.shows} />
              {a.cities.length ? <Stat value={count(a.cities.length, lang)} label={T.cities} /> : null}
              {data.past.length ? <Stat value={data.past.length >= 20 ? '20+' : count(data.past.length, lang)} label={T.playedN} /> : null}
            </div>
          </section>

          {/* ---- shows, and the rest at the side ---- */}
          <section className="kd-wrap pt-8">
            <div className="kd-split gap-[clamp(28px,4vw,56px)]">
              <div className="kd-main flex flex-col">
                <EventTabs
                  label={T.dates}
                  tabs={[
                    { key: 'up', label: T.upcomingTab, count: data.upcoming.length, panel: shows },
                    ...(past.length ? [{ key: 'past', label: T.pastTab, count: past.length, panel: <PastList lang={lang} items={past} /> }] : []),
                  ]}
                />
                <ProfileMoments lang={lang} source={source} items={data.moments ?? []} className="mt-12" />
                <Badges lang={lang} items={data.badges} who={{ vi: 'nghệ sĩ', en: 'artists' }} className="mt-12" />
              </div>

              <aside className="kd-side flex flex-col gap-8">
                {bio || links.length ? (
                  <div className="flex flex-col gap-2">
                    <span className="kd-m">{T.about}</span>
                    {bio ? <Clamp lines={3} more={T.more} less={T.less} className="kd-t whitespace-pre-line text-paper">{bio}</Clamp> : null}
                    {links.length ? <ProfileLinks links={links} lang={lang} label={T.listen} /> : null}
                  </div>
                ) : null}

                {withMost.length ? (
                  <div className="flex flex-col">
                    <span className="kd-m pb-1.5">{T.mostWith}</span>
                    {withMost.map((x) => (
                      <Link key={x.key} className="kd-lrow" href={inLang(x.href, lang)}>
                        <Avatar name={x.name} src={x.logo} size={40} org={x.org} />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="kd-hs kd-ell">{x.name}</span>
                          <span className="kd-s">{x.line}</span>
                        </span>
                        <CaretRightIcon size={16} className="text-fog" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-col border-t border-line">
                  {data.availability.length ? (
                    <Accordion small summary={T.dates} aside={data.availability.length}>
                      <ul className="flex flex-col">
                        {data.availability.map((w) => (
                          <li key={w.from + w.kind} className="kd-lrow min-h-11">
                            <span className="kd-mb kd-num">{w.from === w.to ? dm(w.from) : `${dm(w.from)} – ${dm(w.to)}`}</span>
                            <span className="kd-s flex-1">{text(w.cityLabel, lang)}</span>
                            <Status tone={w.kind === 'busy' ? 'none' : 'ok'}>{w.kind === 'busy' ? T.busy : T.free}</Status>
                          </li>
                        ))}
                      </ul>
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
                  {rel.similar.length ? (
                    <Accordion small summary={T.similar} aside={rel.similar.length}>
                      <ul className="flex flex-col">
                        {rel.similar.map((x) => (
                          <li key={x.id}><Link className="kd-lrow" href={inLang('/a/' + x.slug, lang)}><Avatar name={x.name} size={32} /><span className="kd-hs kd-ell flex-1">{x.name}</span><CaretRightIcon size={16} className="text-fog" aria-hidden="true" /></Link></li>
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
                              {x.url ? <a href={x.url} rel="noopener sponsored" className="kd-hs kd-ell hover:underline">{[x.brand, x.name].filter(Boolean).join(' ')}</a> : <span className="kd-hs kd-ell">{[x.brand, x.name].filter(Boolean).join(' ')}</span>}
                              <span className="kd-s">{[text(x.categoryLabel, lang), text(x.usedForLabel, lang)].filter(Boolean).join(' · ')}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </Accordion>
                  ) : null}
                  {hasBooking ? (
                    <Accordion small summary={T.details}>
                      <dl className="flex flex-col">
                        {a.booking ? <Row k={T.booking} v={text(a.booking.label, lang)} /> : null}
                        {a.travel ? <Row k={T.travel} v={text(a.travel.label, lang)} /> : null}
                        {a.gigTypes.length ? <Row k={T.gigTypes} v={a.gigTypes.map((x) => text(x.label, lang)).join(', ')} /> : null}
                        {a.setLengths.length ? <Row k={T.setLengths} v={a.setLengths.map((x) => text(x.label, lang)).join(', ')} /> : null}
                        {languages.length ? <Row k={T.languages} v={languages.join(', ')} /> : null}
                        {a.activeSince ? <Row k={T.active} v={fill(T.since, { y: a.activeSince })} /> : null}
                        {a.openToBrands ? <Row k={T.brands} v="✓" /> : null}
                      </dl>
                    </Accordion>
                  ) : null}
                  <Accordion small summary={seo.headings.facts}>
                    <div className="flex flex-col gap-3">
                      <p className="kd-s">{seo.page.summary}</p>
                      <dl className="grid grid-cols-1 gap-y-2">
                        {seo.page.facts.map((f) => (
                          <div key={f.label} className="flex flex-col gap-0.5">
                            <dt className="kd-m">{f.label}</dt>
                            <dd className="kd-s text-mist">{f.href ? <a href={f.href} rel={/^https?:/.test(f.href) ? 'noopener' : undefined} className="underline decoration-line2 underline-offset-4 hover:text-paper">{f.value}</a> : f.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </Accordion>
                </div>
              </aside>
            </div>
          </section>

          <div className="mt-auto">
            <WebFooter lang={lang} otherLang={otherLang} />
            <div className="kd-wrap -mt-4 flex flex-wrap gap-1 pb-6">
              {!a.claimed ? <ClaimLink lang={lang} kind="artist" name={a.name} source={source} /> : null}
            </div>
          </div>
        </div>
      </KdProvider>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="kd-lrow min-h-11 last:border-b-0">
      <dt className="kd-s flex-1">{k}</dt>
      <dd className="kd-hs text-right">{v}</dd>
    </div>
  );
}
