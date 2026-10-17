import type { Ctx } from '../../context.ts';
import { many, one } from '../../db/index.ts';
import type { Row } from '../../db/rows.ts';
import type { Lang } from '../../lib/i18n.ts';
import { cityLabel, cityOf } from '../../lib/places.ts';
import { OG_HEIGHT, OG_WIDTH } from '../ogimage.ts';
import { abs, baseOf, clip, type CollectionSeo, crumbList, eventLine, type Fact, inLang, ogFallback, PUBLIC_EVENT, ROBOTS, shortDay, siteNodes, t, text, vnIso } from './shared.ts';

/* A public collection's page for search engines and AI assistants. Part of services/seo.ts. */

/** Everything a public collection's page says to search engines and AI assistants, or null. */
export async function buildCollectionSeo(ctx: Ctx, slug: string, lang: Lang = 'vi'): Promise<CollectionSeo | null> {
  const c = await one<Row<'collections'> & { owner_name: string | null }>(ctx.db,
    `select c.*, u.name as owner_name from collections c join users u on u.id = c.user_id where c.slug = $1 and c.is_public`, [slug]);
  if (!c) return null;
  const now = ctx.clock.now();
  const events = await many<Pick<Row<'events'>, 'slug' | 'title' | 'genre' | 'starts_on' | 'ends_on' | 'start_time' | 'end_time' | 'starts_at' | 'ends_at'
      | 'status' | 'venue_name' | 'address' | 'area' | 'city' | 'entry_mode' | 'price_from' | 'currency' | 'cover_url' | 'updated_at'>>(ctx.db,
    `select e.slug, e.title, e.genre, e.starts_on, e.ends_on, e.start_time, e.end_time, e.starts_at, e.ends_at, e.status, e.venue_name, e.address,
            e.area, e.city, e.entry_mode, e.price_from, e.currency, e.cover_url, e.updated_at
       from collection_items i join events e on e.id = i.event_id
      where i.collection_id = $1 and ${PUBLIC_EVENT} order by e.starts_at`, [c.id]);
  const upcoming = events.filter((e) => new Date(e.ends_at ?? 0) >= now && e.status === 'live');
  const past = events.filter((e) => new Date(e.ends_at ?? 0) < now).reverse().slice(0, 12);
  const vi = lang === 'vi';
  const base = baseOf(ctx);
  const path = `/c/${c.slug}`;
  const alternates = { vi: `${base}${path}`, en: `${base}${path}?lang=en`, 'x-default': `${base}${path}` };
  const url = alternates[lang];
  const owner = (c.owner_name as string | null)?.trim() || t('member', lang);
  const rank = (xs: string[]) => [...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]).map(([x]) => x);
  const genres = rank(events.map((e) => e.genre).filter((g): g is string => !!g)).slice(0, 4);
  const cities = rank(events.map((e) => cityOf(e.city).slug)).map((k) => text(cityLabel(k), lang));
  const next = upcoming[0];
  const updatedAt = [c.updated_at, ...events.map((e) => e.updated_at)].map((d) => new Date(d)).sort((a, b) => b.getTime() - a.getTime())[0];

  const summary = [
    vi
      ? `“${c.name}” là bộ sưu tập ${events.length} sự kiện do ${owner} tạo trên FeestFinder${genres.length ? `: ${genres.join(', ')}` : ''}${cities.length ? ` ở ${cities.join(', ')}` : ''}.`
      : `“${c.name}” is a collection of ${events.length} ${events.length === 1 ? 'event' : 'events'} made by ${owner} on FeestFinder${genres.length ? `: ${genres.join(', ')}` : ''}${cities.length ? ` in ${cities.join(', ')}` : ''}.`,
    next ? (vi ? `Gần nhất là ${next.title} (${eventLine(next, lang)}).` : `Next up is ${next.title} (${eventLine(next, lang)}).`) : '',
  ].filter(Boolean).join(' ');
  const description = clip(`${c.name}: ${upcoming.length ? upcoming.slice(0, 3).map((e) => `${e.title} (${shortDay(e.starts_on, lang)})`).join(', ') : summary}.`, 160);
  const title = [`${c.name} – ${t('collection', lang).toLowerCase()}`, c.name].find((x) => x.length <= 62) ?? clip(c.name, 62);
  const cover = upcoming.find((e) => e.cover_url) ?? events.find((e) => e.cover_url);
  const image = cover
    ? { url: abs(ctx, cover.cover_url)!, width: 1600, height: 900, type: 'image/jpeg' }
    : { url: ogFallback(base), width: OG_WIDTH, height: OG_HEIGHT, type: 'image/png' };
  const crumbs = [{ name: 'FeestFinder', path: inLang('/', lang) }, { name: c.name, path: inLang(path, lang) }];
  const facts: Fact[] = [
    { label: t('madeBy', lang), value: owner },
    { label: t('eventCount', lang), value: String(events.length) },
    { label: t('upcoming', lang), value: String(upcoming.length) },
    { label: t('genres', lang), value: genres.join(', ') },
    { label: t('cities', lang), value: cities.join(', ') },
  ].filter((f) => f.value);

  const ids = { page: url, list: `${url}#list`, crumbs: `${url}#breadcrumb` };
  const graph = [
    ...siteNodes(base),
    {
      '@type': 'CollectionPage', '@id': ids.page, url, name: `${title} | FeestFinder`, description, inLanguage: lang,
      isPartOf: { '@id': `${base}/#website` }, breadcrumb: { '@id': ids.crumbs }, mainEntity: { '@id': ids.list },
      primaryImageOfPage: { '@type': 'ImageObject', url: image.url, width: image.width, height: image.height },
      dateCreated: vnIso(c.created_at), dateModified: vnIso(updatedAt),
    },
    {
      '@type': 'ItemList', '@id': ids.list, name: c.name, numberOfItems: events.length,
      itemListElement: [...upcoming, ...past].slice(0, 50).map((e, i) => ({
        '@type': 'ListItem', position: i + 1, url: `${base}/e/${e.slug}${vi ? '' : '?lang=en'}`, name: e.title,
      })),
    },
    crumbList(base, ids.crumbs, crumbs),
  ];
  const links = (xs: typeof events) => xs.map((e) => ({ title: e.title, path: inLang(`/e/${e.slug}`, lang), line: eventLine(e, lang) }));
  return {
    kind: 'collection', lang, url, canonical: url, alternates, markdown: `${path}.md${vi ? '' : '?lang=en'}`,
    title: `${title} | FeestFinder`, description,
    // An empty list has nothing for a search engine to show.
    robots: events.length ? ROBOTS : 'noindex, follow',
    image: { ...image, alt: c.name },
    publishedAt: vnIso(c.created_at) ?? null,
    updatedAt: vnIso(updatedAt)!,
    headings: { facts: t('facts', lang), about: t('about', lang), upcoming: t('upcoming', lang), past: t('pastEvents', lang), updated: t('updated', lang) },
    page: {
      crumbs, kicker: [t('collection', lang), owner].join(' · '), h1: c.name, summary, facts, about: '',
      upcoming: links(upcoming), past: links(past),
      otherLang: { label: t('otherLang', lang), path: vi ? `${path}?lang=en` : path },
    },
    jsonLd: { '@context': 'https://schema.org', '@graph': JSON.parse(JSON.stringify(graph)) },
  };
}
