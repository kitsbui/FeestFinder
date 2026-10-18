import type { Ctx } from '../../context.ts';
import { many, one } from '../../db/index.ts';
import type { Row } from '../../db/rows.ts';
import type { Lang } from '../../lib/i18n.ts';
import { cityLabel, cityOf } from '../../lib/places.ts';
import { isoIn } from '../../lib/time.ts';
import { organizerArtists } from '../network.ts';
import { OG_HEIGHT, OG_WIDTH } from '../ogimage.ts';
import { presentOrgLinks } from '../organizers.ts';
import { abs, addressOf, baseOf, clip, crumbList, eventLine, type Fact, hostOf, inLang, ogFallback, ORG_TYPE, type OrganizerSeo, PUBLIC_EVENT, ROBOTS, SCHEMA_TYPE, shortDay, siteNodes, t, text, vnIso } from './shared.ts';

/* An organiser page for search engines and AI assistants. Part of services/seo.ts. */

/** Everything an organiser page says to search engines and AI assistants, or null if there is no such page. */
export async function buildOrganizerSeo(ctx: Ctx, slug: string, lang: Lang = 'vi'): Promise<OrganizerSeo | null> {
  const org = await one<Row<'organizers'>>(ctx.db, 'select * from organizers where slug = $1 and suspended_at is null', [slug]);
  if (!org) return null;
  const now = ctx.clock.now();
  const events = await many<Pick<Row<'events'>, 'slug' | 'title' | 'genre' | 'starts_on' | 'ends_on' | 'start_time' | 'end_time' | 'starts_at' | 'ends_at'
      | 'status' | 'venue_name' | 'address' | 'area' | 'city' | 'lat' | 'lng' | 'entry_mode' | 'price_from' | 'currency' | 'cover_url' | 'updated_at' | 'published_at'>>(ctx.db,
    `select e.slug, e.title, e.genre, e.starts_on, e.ends_on, e.start_time, e.end_time, e.starts_at, e.ends_at, e.status, e.venue_name, e.address,
            e.area, e.city, e.lat, e.lng, e.entry_mode, e.price_from, e.currency, e.cover_url, e.updated_at, e.published_at
       from events e where e.organizer_id = $1 and ${PUBLIC_EVENT} order by e.starts_at`, [org.id]);
  const upcoming = events.filter((e) => new Date(e.ends_at ?? 0) >= now && e.status === 'live');
  const past = events.filter((e) => new Date(e.ends_at ?? 0) < now).reverse().slice(0, 12);
  const vi = lang === 'vi';
  const base = baseOf(ctx);
  const path = `/o/${org.slug}`;
  const alternates = { vi: `${base}${path}`, en: `${base}${path}?lang=en`, 'x-default': `${base}${path}` };
  const url = alternates[lang];

  // What they put on, most first, and where.
  const rank = (xs: string[]) => [...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]).map(([x]) => x);
  const genres = rank(events.map((e) => e.genre).filter((g): g is string => !!g)).slice(0, 4);
  const cityKeys = rank(events.map((e) => cityOf(e.city).slug));
  const cities = cityKeys.map((c) => text(cityLabel(c), lang));
  const mainCity = cityKeys[0] ?? cityOf(null).slug;
  const verified = org.verification_state === 'verified';
  const kind = org.placeholder === 'radar' ? (vi ? 'trang của Feest Radar' : 'Feest Radar’s page')
    : org.is_community ? (vi ? 'trang cộng đồng' : 'community page') : text(ORG_TYPE[org.type] ?? ORG_TYPE.promoter, lang);
  const about = text(org.bio, lang);
  const next = upcoming[0];
  const n = (x: number) => x.toLocaleString(vi ? 'vi-VN' : 'en-US');
  const updatedAt = [org.created_at, ...events.map((e) => e.updated_at)].map((d) => new Date(d)).sort((a, b) => b.getTime() - a.getTime())[0];

  const summary = [
    vi
      ? `${org.name} là ${kind}${verified ? ' đã được FeestFinder xác minh' : ''}${genres.length ? `, tổ chức các sự kiện ${genres.join(', ')}` : ''}${cities.length ? ` ở ${cities.join(', ')}` : ''}${org.since_year ? `, hoạt động từ năm ${org.since_year}` : ''}.`
      : `${org.name} is ${/^[aeiou]/i.test(kind) ? 'an' : 'a'} ${kind}${verified ? ' verified by FeestFinder' : ''}${genres.length ? `, putting on ${genres.join(', ')} events` : ''}${cities.length ? ` in ${cities.join(', ')}` : ''}${org.since_year ? `, active since ${org.since_year}` : ''}.`,
    upcoming.length
      ? (vi ? `Có ${upcoming.length} sự kiện sắp diễn ra; gần nhất là ${next.title} (${eventLine(next, lang)}).` : `${upcoming.length} upcoming ${upcoming.length === 1 ? 'event' : 'events'}; next is ${next.title} (${eventLine(next, lang)}).`)
      : (vi ? 'Hiện chưa có sự kiện sắp diễn ra.' : 'No upcoming events right now.'),
    org.followers_count ? (vi ? `${n(org.followers_count)} người theo dõi trên FeestFinder.` : `${n(org.followers_count)} followers on FeestFinder.`) : '',
  ].filter(Boolean).join(' ');

  const description = clip([
    vi ? `${org.name}: ${kind}${genres.length ? ` ${genres.join(', ')}` : ''}${cities.length ? ` ở ${cities.join(', ')}` : ''}` : `${org.name}: ${kind}${genres.length ? `, ${genres.join(', ')}` : ''}${cities.length ? ` in ${cities.join(', ')}` : ''}`,
    upcoming.length ? `${t('upcoming', lang)}: ${upcoming.slice(0, 3).map((e) => `${e.title} (${shortDay(e.starts_on, lang)})`).join(', ')}` : '',
  ].filter(Boolean).join('. ') + '.', 160);
  const title = [`${org.name} – ${t('upcoming', lang).toLowerCase()}${cities[0] ? ` · ${cities[0]}` : ''}`, org.name].find((x) => x.length <= 62) ?? clip(org.name, 62);

  // A link preview needs a wide picture: the next event's cover, else the genre art.
  const cover = upcoming.find((e) => e.cover_url) ?? events.find((e) => e.cover_url);
  const image = cover
    ? { url: abs(ctx, cover.cover_url)!, width: 1600, height: 900, type: 'image/jpeg' }
    : { url: ogFallback(base), width: OG_WIDTH, height: OG_HEIGHT, type: 'image/png' };

  const crumbs = [
    { name: 'FeestFinder', path: inLang('/', lang) },
    { name: `${t('eventsIn', lang)} ${text(cityLabel(mainCity), lang)}`, path: inLang(`/?city=${mainCity}`, lang) },
    { name: org.name, path: inLang(path, lang) },
  ];
  const facts: Fact[] = [
    { label: t('type', lang), value: kind.charAt(0).toUpperCase() + kind.slice(1) },
    { label: t('cities', lang), value: cities.join(', ') },
    { label: t('genres', lang), value: genres.join(', ') },
    { label: t('upcoming', lang), value: String(upcoming.length) },
    { label: t('since', lang), value: org.since_year ? String(org.since_year) : '' },
    { label: t('followers', lang), value: org.followers_count ? n(org.followers_count) : '' },
    { label: t('verified', lang), value: t(verified ? 'yes' : 'no', lang) },
    ...(org.website ? [{ label: t('site', lang), value: hostOf(org.website), href: org.website }] : []),
    { label: t('artistsWorked', lang), value: (await organizerArtists(ctx.db, org.id, 6)).map((a) => a.name).join(', ') },
  ].filter((f) => f.value);

  const ids = { page: url, org: `${url}#organization`, crumbs: `${url}#breadcrumb` };
  const orgSameAs = [org.website, ...presentOrgLinks(org).map((l) => l.url)].filter(Boolean);
  const place = (e: (typeof events)[number]) => {
    const a = addressOf(e.city);
    return { '@type': 'Place', name: e.venue_name ?? undefined,
      address: { '@type': 'PostalAddress', streetAddress: [e.address, e.area].filter(Boolean).join(', ') || undefined, addressLocality: a.locality, addressRegion: a.region, addressCountry: a.country } };
  };
  const graph = [
    ...siteNodes(base),
    {
      '@type': 'ProfilePage', '@id': ids.page, url, name: `${title} | FeestFinder`, description, inLanguage: lang,
      isPartOf: { '@id': `${base}/#website` }, breadcrumb: { '@id': ids.crumbs }, mainEntity: { '@id': ids.org },
      primaryImageOfPage: { '@type': 'ImageObject', url: image.url, width: image.width, height: image.height },
      dateCreated: vnIso(org.created_at), dateModified: vnIso(updatedAt),
    },
    {
      '@type': 'Organization', '@id': ids.org, name: org.name, url, description: about || summary,
      logo: org.logo_url ? abs(ctx, org.logo_url) : undefined,
      sameAs: orgSameAs.length ? orgSameAs : undefined,
      foundingDate: org.since_year ? String(org.since_year) : undefined,
      areaServed: cities.length ? cityKeys.map((c) => ({ '@type': 'City', name: addressOf(c).locality })) : undefined,
      interactionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/FollowAction', userInteractionCount: org.followers_count },
      // Their upcoming events, each with its own page.
      event: upcoming.slice(0, 30).map((e) => ({
        '@type': SCHEMA_TYPE[e.genre ?? ''] ?? 'Event', name: e.title, url: `${base}/e/${e.slug}${vi ? '' : '?lang=en'}`,
        startDate: e.starts_at ? isoIn(new Date(e.starts_at), cityOf(e.city).timezone) : undefined, endDate: e.ends_at ? isoIn(new Date(e.ends_at ?? 0), cityOf(e.city).timezone) : undefined,
        eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: place(e), image: [e.cover_url ? abs(ctx, e.cover_url) : ogFallback(base)],
        organizer: { '@id': ids.org },
      })),
    },
    crumbList(base, ids.crumbs, crumbs),
  ];

  const links = (xs: typeof events) => xs.map((e) => ({ title: e.title, path: inLang(`/e/${e.slug}`, lang), line: eventLine(e, lang) }));
  return {
    kind: 'organizer', lang, url, canonical: url, alternates, markdown: `${path}.md${vi ? '' : '?lang=en'}`,
    title: `${title} | FeestFinder`, description, robots: ROBOTS,
    image: { ...image, alt: org.name },
    publishedAt: vnIso(org.created_at) ?? null,
    updatedAt: vnIso(updatedAt)!,
    headings: { facts: t('facts', lang), about: t('about', lang), upcoming: t('upcoming', lang), past: t('pastEvents', lang), updated: t('updated', lang) },
    page: {
      crumbs, kicker: [kind.charAt(0).toUpperCase() + kind.slice(1), cities[0], verified ? t('verifiedShort', lang) : null].filter(Boolean).join(' · '), h1: org.name, summary, facts, about,
      upcoming: links(upcoming), past: links(past),
      otherLang: { label: t('otherLang', lang), path: vi ? `${path}?lang=en` : path },
    },
    jsonLd: { '@context': 'https://schema.org', '@graph': JSON.parse(JSON.stringify(graph)) },
  };
}
