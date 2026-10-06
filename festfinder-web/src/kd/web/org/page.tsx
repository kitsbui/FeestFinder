/**
 * /o/<slug> (and ?lang=en) in Kính đêm (design/Profile-Org-Web): the cover, the organiser,
 * its numbers, upcoming events and the ones it has run, then what it runs, the artists it books,
 * its venues and business details. The server renders it all with its structured data; following,
 * the follower count and the owner's controls come in the browser.
 */
import { CaretRightIcon, SealCheckIcon } from '@phosphor-icons/react/ssr';
import { api, jsonLdHtml, type Lang, type OrganizerSeo } from '@/lib/api';
import { fill, pick, type Pair } from '../../copy';
import { cx } from '../../cx';
import { count } from '../../format';
import { CHART_ORDER, FAMILY_LABEL, familyOf, g, type Family } from '../../genre';
import { KdLink as Link, inLang } from '../../link';
import { KdProvider } from '../../runtime';
import { Clamp } from '../../ui/clamp';
import { Accordion, Art, Avatar, Stat, Status, Tag } from '../../ui/parts';
import type { Card } from '../../types';
import { EventCard } from '../card';
import { Crumbs, WebFooter, WebNav } from '../chrome';
import { WEB } from '../copy';
import { PROFILE } from '../profile/copy';
import { ProfileLinks, type ProfileLink } from '../profile/links';
import { ClaimLink, EventTabs, FollowButton, FollowersStat, OwnerLink, PastList, ShareProfile, type Source } from '../profile/parts';

const enc = encodeURIComponent;

type Evidence = { events: number; lastOn: string | null; examples: { slug: string; title: string }[] };

export interface Org {
  id: string; slug: string; name: string; initials: string | null; art: string | null; logoUrl: string | null; coverUrl: string | null;
  bio: Pair | string | null; type: string | null; typeLabel: Pair | null; website: string | null; verified: boolean;
  markets: { slug: string; label: Pair | null }[];
  styles: { key: string; label: Pair }[];
  openForSubmissions: boolean;
  links: ProfileLink[];
  stats: { events: number; followers: number; since: number | null; artists: number };
  upcoming: Card[];
  past: Card[];
  artists: ({ id: string; slug: string; name: string } & Evidence)[];
  venues: ({ name: string; city: string; cityLabel: Pair | null } & Evidence)[];
}

export async function loadOrg(slug: string, lang: Lang) {
  const [org, seo] = await Promise.all([
    api<Org>(`/organizers/${enc(slug)}`, { lang }),
    api<OrganizerSeo>(`/seo/organizers/${enc(slug)}${lang === 'en' ? '?lang=en' : ''}`, { lang }),
  ]);
  return org && seo ? { org, seo } : null;
}

const text = (v: Pair | string | null | undefined, lang: Lang) => (!v ? '' : typeof v === 'string' ? v : v[lang] || v.vi || v.en || '');

/** Each family's share of what it has listed, biggest first; unknown genres are left out. */
function familyMix(events: Card[]) {
  const n = new Map<Exclude<Family, 'free'>, number>();
  for (const e of events) {
    const f = familyOf(e.genre);
    if (f !== 'free') n.set(f, (n.get(f) ?? 0) + 1);
  }
  return CHART_ORDER.filter((f) => n.get(f)).map((f) => ({ f, n: n.get(f)! }));
}

export function OrgPage({ org, seo, lang }: { org: Org; seo: OrganizerSeo; lang: Lang }) {
  const T = pick(PROFILE, lang);
  const W = pick(WEB, lang);
  const source: Source = { kind: 'org', slug: org.slug };
  const all = [...org.upcoming, ...org.past];
  const mix = familyMix(all);
  const mixTotal = mix.reduce((s, x) => s + x.n, 0);
  // The cover: its own image, or a mosaic in the colours of what it runs.
  const tiles: Family[] = [...mix.map((x) => x.f), ...CHART_ORDER].filter((f, i, a) => a.indexOf(f) === i).slice(0, 4);
  const meta = [
    text(org.typeLabel, lang) || T.orgKind,
    org.markets.map((m) => text(m.label, lang) || m.slug).join(', '),
    org.stats.since ? fill(T.since, { y: org.stats.since }) : '',
  ].filter(Boolean).join(' · ');
  const bio = text(org.bio, lang);
  const links: ProfileLink[] = [...org.links, ...(org.website ? [{ kind: 'website', label: { vi: host(org.website), en: host(org.website) }, url: org.website }] : [])];
  const otherLang = { href: seo.page.otherLang.path, label: lang === 'vi' ? W.english : W.vietnamese };
  const past = org.past.filter((e) => e.startsOn).map((e) => ({ slug: e.slug, title: e.title, startsOn: e.startsOn!, venue: e.venue.name, cityLabel: e.cityLabel ?? null, genre: e.genre, saveCount: e.saveCount }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(seo.jsonLd) }} />
      <KdProvider lang={lang}>
        <div className="flex min-h-dvh flex-col" lang={lang}>
          <WebNav lang={lang} />
          <Crumbs label={W.crumbs} items={seo.page.crumbs.map((c, i, a) => (i === a.length - 1 ? { name: c.name } : { name: c.name, href: c.path }))} />

          {/* ---- cover ---- */}
          <div className="kd-wrap" aria-hidden="true">
            {org.coverUrl ? (
              <Art family={tiles[0] ?? 'free'} cover={org.coverUrl} className="h-[clamp(120px,15vw,210px)]" />
            ) : (
              <div className="grid h-[clamp(120px,15vw,210px)] grid-cols-4 gap-2">
                {tiles.map((f, i) => <Art key={f} family={f} bone={i % 2 === 1} />)}
              </div>
            )}
          </div>

          {/* ---- who ---- */}
          <section className="kd-wrap" aria-label={T.orgKind}>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 pl-[clamp(0px,2vw,24px)]">
              <div className="flex min-w-0 flex-wrap items-end gap-x-6 gap-y-4">
                <Avatar org ring name={org.name} src={org.logoUrl} size={128} className="-mt-12 h-24! w-24! rounded-[16px]! text-[34px]! tab:-mt-16 tab:h-32! tab:w-32! tab:rounded-[20px]! tab:text-[44px]!" />
                <div className="flex min-w-0 flex-col gap-2">
                  <h1 className="kd-d1">
                    {org.name}
                    {org.verified ? <SealCheckIcon size={28} weight="fill" className="ml-3 inline-block align-[-0.05em] text-acc" role="img" aria-label={T.orgVerified} /> : null}
                  </h1>
                  {meta ? <span className="kd-m">{meta}</span> : null}
                  {org.styles.length || org.openForSubmissions ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {org.openForSubmissions ? <Status tone="ok">{T.open}</Status> : null}
                      {org.styles.map((s) => <Tag key={s.key} tone="line">{text(s.label, lang)}</Tag>)}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FollowButton lang={lang} kind="org" id={org.id} name={org.name} source={source} />
                <OwnerLink lang={lang} source={source} href="/ops/org" />
                <ShareProfile lang={lang} title={org.name} />
              </div>
            </div>
            <div className="mt-7 grid auto-cols-fr grid-flow-col border-y border-line py-4.5">
              <FollowersStat lang={lang} kind="org" id={org.id} source={source} served={org.stats.followers} />
              <Stat value={count(org.stats.events, lang)} label={T.orgEvents} />
              {org.stats.artists ? <Stat value={count(org.stats.artists, lang)} label={T.orgArtistsN} /> : null}
            </div>
          </section>

          {/* ---- events, and the rest at the side ---- */}
          <section className="kd-wrap pt-8">
            <div className="kd-split gap-[clamp(28px,4vw,56px)]">
              <div className="kd-main flex flex-col">
                <EventTabs
                  label={T.events}
                  tabs={[
                    {
                      key: 'up', label: T.upcoming, count: org.upcoming.length,
                      panel: org.upcoming.length ? (
                        <div className="kd-cards pt-5">{org.upcoming.map((e, i) => <EventCard key={e.id} e={e} i={i} lang={lang} />)}</div>
                      ) : <p className="kd-t pt-5 text-fog">{T.noUpcoming}</p>,
                    },
                    ...(past.length ? [{ key: 'past', label: T.past, count: past.length, panel: <PastList lang={lang} items={past} /> }] : []),
                  ]}
                />
              </div>

              <aside className="kd-side flex flex-col gap-8">
                {bio || links.length ? (
                  <div className="flex flex-col gap-2">
                    <span className="kd-m">{T.about}</span>
                    {bio ? <Clamp lines={3} more={T.more} less={T.less} className="kd-t whitespace-pre-line text-paper">{bio}</Clamp> : null}
                    {links.length ? <ProfileLinks links={links} lang={lang} label={T.links} /> : null}
                  </div>
                ) : null}

                {mix.length ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-baseline justify-between"><span className="kd-m">{T.families}</span><span className="kd-m kd-num">{fill(T.nEvents, { n: count(all.length, lang) })}</span></div>
                    <div className="flex h-2.5 gap-0.5" role="img" aria-label={mix.map((x) => `${FAMILY_LABEL[x.f][lang]} ${x.n}`).join(', ')}>
                      {mix.map((x, i) => (
                        <i key={x.f} className={cx(g(x.f), 'bg-[var(--g)]', i === 0 && 'rounded-l', i === mix.length - 1 && 'rounded-r')} style={{ flex: `${x.n} 1 0` }} />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {mix.map((x) => (
                        <span key={x.f} className={cx('kd-s flex items-center gap-2 text-mist', g(x.f))}>
                          <span className="kd-mk" aria-hidden="true" />{FAMILY_LABEL[x.f][lang]}<span className="kd-mb kd-num ml-auto">{Math.round((x.n / mixTotal) * 100)}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {org.artists.length ? (
                  <div className="flex flex-col">
                    <span className="kd-m pb-1.5">{T.orgArtists}</span>
                    {org.artists.slice(0, 6).map((a) => (
                      <Link key={a.id} className="kd-lrow" href={inLang('/a/' + a.slug, lang)}>
                        <Avatar name={a.name} size={40} />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="kd-hs kd-ell">{a.name}</span>
                          <span className="kd-s">{fill(T.nEvents, { n: a.events })}</span>
                        </span>
                        <CaretRightIcon size={16} className="text-fog" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-col border-t border-line">
                  {org.venues.length ? (
                    <Accordion small summary={T.orgVenues} aside={org.venues.length}>
                      <div className="flex flex-col">
                        {org.venues.map((v, i) => (
                          <div key={v.name + v.city} className={cx('kd-lrow', i === org.venues.length - 1 && 'border-b-0')}>
                            <span className="flex min-w-0 flex-1 flex-col">
                              <span className="kd-hs kd-ell">{v.name}</span>
                              <span className="kd-s">{text(v.cityLabel, lang) || v.city}</span>
                            </span>
                            <span className="kd-mb kd-num">{v.events}</span>
                          </div>
                        ))}
                      </div>
                    </Accordion>
                  ) : null}
                  <Accordion small summary={<span className="flex items-center gap-2">{T.business}<Status tone={org.verified ? 'ok' : 'none'}>{org.verified ? T.checked : T.unchecked}</Status></span>}>
                    <dl className="flex flex-col">
                      <div className="kd-lrow min-h-11"><dt className="kd-s flex-1">{T.businessType}</dt><dd className="kd-hs">{text(org.typeLabel, lang) || T.orgKind}</dd></div>
                      {org.markets.length ? <div className="kd-lrow min-h-11"><dt className="kd-s flex-1">{T.markets}</dt><dd className="kd-hs text-right">{org.markets.map((m) => text(m.label, lang) || m.slug).join(', ')}</dd></div> : null}
                      {org.website ? <div className="kd-lrow min-h-11"><dt className="kd-s flex-1">{T.website}</dt><dd className="kd-hs"><a href={org.website} rel="noopener nofollow" className="hover:underline">{host(org.website)}</a></dd></div> : null}
                      <div className="kd-lrow min-h-11 border-b-0"><dt className="kd-s flex-1">{T.verified}</dt><dd className="kd-hs">{org.verified ? T.checked : T.unchecked}</dd></div>
                    </dl>
                  </Accordion>
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
              {/* A verified organiser already has its people. */}
              {!org.verified ? <ClaimLink lang={lang} kind="organizer" name={org.name} source={source} /> : null}
            </div>
          </div>
        </div>
      </KdProvider>
    </>
  );
}

function host(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}
