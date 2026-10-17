import type { Ctx } from '../../context.ts';
import { many, type Queryable } from '../../db/index.ts';
import type { Lang } from '../../lib/i18n.ts';
import { formatMoney } from '../../lib/money.ts';
import { cityLabel, launchedCities } from '../../lib/places.ts';
import { styleByKey } from '../../lib/styles.ts';
import { searchArtists } from '../artists.ts';
import { OG_HEIGHT, OG_WIDTH } from '../ogimage.ts';
import { loadProject, presentProject } from '../projects.ts';
import { abs, addressOf, baseOf, clip, crumbList, type DirectorySeo, type Fact, inLang, longDate, ogFallback, type ProjectSeo, PUBLIC_EVENT, ROBOTS, shortDay, siteNodes, t, text, vnIso } from './shared.ts';

/* The artist directory and project pages for search engines and AI assistants. Part of services/seo.ts. */

/**
 * A public project page (services/projects.ts): what the idea is, where and when, what it is
 * looking for, who is on board. Drafts and projects in review have no page (null).
 */
export async function buildProjectSeo(ctx: Ctx, slug: string, lang: Lang = 'vi'): Promise<ProjectSeo | null> {
  const x = await loadProject(ctx.db, { slug });
  if (!x || !['open', 'realized', 'closed'].includes(x.p.status)) return null;
  const pr = presentProject(x.p, { packages: x.packages, counts: x.counts, event: x.event });
  const vi = lang === 'vi';
  const base = baseOf(ctx);
  const path = `/p/${pr.slug}`;
  const alternates = { vi: `${base}${path}`, en: `${base}${path}?lang=en`, 'x-default': `${base}${path}` };
  const url = alternates[lang];
  const city = text(pr.city.label, lang);
  const seeking = pr.seeking.map((k) => text(k.label, lang));
  const money = (n: number | null) => (n == null ? '' : formatMoney(n, pr.currency, lang));
  const onBoard = Object.entries(pr.onBoard).reduce((n, [, v]) => n + (v as number), 0);
  const summary = vi
    ? `${pr.title}: dự án sự kiện ở ${city}${seeking.length ? `, đang tìm ${seeking.join(', ').toLowerCase()}` : ''}. ${pr.pitch}`.trim()
    : `${pr.title}: an event project in ${city}${seeking.length ? `, looking for ${seeking.join(', ').toLowerCase()}` : ''}. ${pr.pitch}`.trim();
  const description = clip(summary, 160);
  const title = [`${pr.title} – ${t('project', lang).toLowerCase()} ${city}`, pr.title].find((s) => s.length <= 62) ?? clip(pr.title, 62);
  const image = pr.coverUrl
    ? { url: abs(ctx, pr.coverUrl)!, width: 1600, height: 900, type: 'image/jpeg' }
    : { url: ogFallback(base), width: OG_WIDTH, height: OG_HEIGHT, type: 'image/png' };
  const crumbs = [{ name: 'FeestFinder', path: inLang('/', lang) }, { name: t('projects', lang), path: inLang('/p', lang) }, { name: pr.title, path: inLang(path, lang) }];
  const facts: Fact[] = [
    { label: t('cities', lang), value: city },
    { label: t('target', lang), value: pr.targetOn ? longDate(pr.targetOn, lang) : '', datetime: pr.targetOn ?? undefined },
    { label: t('type', lang), value: text(pr.eventType?.label, lang) },
    { label: t('styles', lang), value: pr.styles.map((s) => text(s.label, lang)).join(', ') },
    { label: t('seeking', lang), value: seeking.join(', ') },
    { label: t('budget', lang), value: money(pr.budget) },
    { label: t('raise', lang), value: money(pr.raiseAmount) },
    { label: t('capacity', lang), value: pr.capacity ? String(pr.capacity) : '' },
    { label: t('onBoard', lang), value: onBoard ? String(onBoard) : '' },
    { label: t('by', lang), value: pr.owner.name ?? t('member', lang) },
    ...(pr.event ? [{ label: t('realized', lang), value: pr.event.title, href: inLang(`/e/${pr.event.slug}`, lang) }] : []),
  ].filter((f) => f.value);
  const ids = { page: url, project: `${url}#project`, crumbs: `${url}#breadcrumb` };
  const graph = [
    ...siteNodes(base),
    {
      '@type': 'WebPage', '@id': ids.page, url, name: `${title} | FeestFinder`, description, inLanguage: lang,
      isPartOf: { '@id': `${base}/#website` }, breadcrumb: { '@id': ids.crumbs }, mainEntity: { '@id': ids.project },
      primaryImageOfPage: { '@type': 'ImageObject', url: image.url, width: image.width, height: image.height },
      datePublished: vnIso(pr.publishedAt) ?? undefined, dateModified: vnIso(pr.updatedAt),
    },
    {
      '@type': 'Project', '@id': ids.project, name: pr.title, description: pr.pitch || description, url, image: image.url,
      location: { '@type': 'Place', address: { '@type': 'PostalAddress', ...addressOf(pr.city.slug), addressCountry: addressOf(pr.city.slug).country } },
      // What it asks for, as demands (schema.org `seeks`).
      seeks: seeking.map((name) => ({ '@type': 'Demand', name })),
      subjectOf: pr.event ? { '@type': 'Event', url: base + inLang(`/e/${pr.event.slug}`, lang), name: pr.event.title } : undefined,
    },
    crumbList(base, ids.crumbs, crumbs),
  ];
  return {
    kind: 'project', lang, url, canonical: url, alternates, markdown: `${path}.md${vi ? '' : '?lang=en'}`,
    title: `${title} | FeestFinder`, description,
    // A closed project keeps its page for links, out of search results.
    robots: x.p.status === 'closed' ? 'noindex, follow' : ROBOTS,
    image: { ...image, alt: pr.title },
    publishedAt: vnIso(pr.publishedAt) ?? null,
    updatedAt: vnIso(pr.updatedAt)!,
    headings: { facts: t('facts', lang), about: t('about', lang), upcoming: t('upcoming', lang), past: t('pastEvents', lang), updated: t('updated', lang) },
    page: {
      crumbs, kicker: [t('project', lang), city].join(' · '), h1: pr.title, summary, facts,
      about: [pr.story, text(pr.disclaimer, lang)].filter(Boolean).join('\n\n'),
      upcoming: [], past: [],
      otherLang: { label: t('otherLang', lang), path: vi ? `${path}?lang=en` : path },
    },
    jsonLd: { '@context': 'https://schema.org', '@graph': JSON.parse(JSON.stringify(graph)) },
  };
}

/** Which directory page a key names: '' for all artists, 'style:hard-techno', 'city:tokyo'. */
export function directoryScope(key: string): { style?: string; city?: string } | null {
  if (!key || key === 'all') return {};
  const [kind, value] = key.split(':');
  if (kind === 'style' && styleByKey(value)) return { style: value };
  if (kind === 'city' && cityLabel(value) && launchedCities().some((c) => c.slug === value)) return { city: value };
  return null;
}

/** A directory page gets indexed once it lists this many artists; thinner ones stay out of search results. */
export const DIRECTORY_INDEX_MIN = 3;

export async function buildDirectorySeo(ctx: Ctx, key: string, lang: Lang = 'vi'): Promise<DirectorySeo | null> {
  const scope = directoryScope(key);
  if (!scope) return null;
  const now = ctx.clock.now();
  const out = await searchArtists(ctx.db, { style: scope.style ? [scope.style] : undefined, city: scope.city, sort: 'next', limit: 60, offset: 0 }, now);
  const vi = lang === 'vi';
  const base = baseOf(ctx);
  const path = scope.style ? `/a/style/${scope.style}` : scope.city ? `/a/city/${scope.city}` : '/a';
  const alternates = { vi: `${base}${path}`, en: `${base}${path}?lang=en`, 'x-default': `${base}${path}` };
  const url = alternates[lang];
  const styleName = scope.style ? text(styleByKey(scope.style)!.label, lang) : '';
  const cityName = scope.city ? text(cityLabel(scope.city), lang) : '';
  const h1 = scope.style ? (vi ? `Nghệ sĩ ${styleName}` : `${styleName} artists`)
    : scope.city ? (vi ? `Nghệ sĩ ở ${cityName}` : `Artists in ${cityName}`)
    : (vi ? 'Nghệ sĩ trên FeestFinder' : 'Artists on FeestFinder');
  const withShows = out.items.filter((a) => a.upcoming > 0);
  const others = out.items.filter((a) => a.upcoming === 0);
  const names = out.items.slice(0, 5).map((a) => a.name);
  const summary = vi
    ? `${out.total} nghệ sĩ${scope.style ? ` chơi ${styleName}` : ''}${scope.city ? ` ở ${cityName}` : ''} trên FeestFinder, ${withShows.length} người có show sắp tới${names.length ? `: ${names.join(', ')}` : ''}.`
    : `${out.total} ${out.total === 1 ? 'artist' : 'artists'}${scope.style ? ` playing ${styleName}` : ''}${scope.city ? ` in ${cityName}` : ''} on FeestFinder, ${withShows.length} with shows coming up${names.length ? `: ${names.join(', ')}` : ''}.`;
  const description = clip(summary, 160);
  const title = clip(`${h1} – ${vi ? 'lịch diễn, booking' : 'shows and bookings'}`, 62);
  const image = { url: ogFallback(base), width: OG_WIDTH, height: OG_HEIGHT, type: 'image/png' };
  const crumbs = [{ name: 'FeestFinder', path: inLang('/', lang) }, { name: t('directory', lang), path: inLang('/a', lang) },
    ...(path !== '/a' ? [{ name: h1, path: inLang(path, lang) }] : [])];
  const updatedAt = out.items.map((a) => new Date(a.updatedAt)).sort((x, y) => y.getTime() - x.getTime())[0] ?? now;
  const line = (a: (typeof out.items)[number]) => [
    a.roles.map((r) => text(r.label, lang)).join(' / '),
    a.styles.slice(0, 2).map((x) => text(x.label, lang)).join(', '),
    a.nextShow ? `${t('nextShow', lang)}: ${a.nextShow.title} (${shortDay(a.nextShow.startsOn, lang)}${a.nextShow.cityLabel ? `, ${text(a.nextShow.cityLabel, lang)}` : ''})` : '',
  ].filter(Boolean).join(' · ');
  const links = (xs: typeof out.items) => xs.map((a) => ({ title: a.name, path: inLang(`/a/${a.slug}`, lang), line: line(a) }));
  const ids = { page: url, list: `${url}#list`, crumbs: `${url}#breadcrumb` };
  const graph = [
    ...siteNodes(base),
    {
      '@type': 'CollectionPage', '@id': ids.page, url, name: `${title} | FeestFinder`, description, inLanguage: lang,
      isPartOf: { '@id': `${base}/#website` }, breadcrumb: { '@id': ids.crumbs }, mainEntity: { '@id': ids.list }, dateModified: vnIso(updatedAt),
    },
    {
      '@type': 'ItemList', '@id': ids.list, name: h1, numberOfItems: out.total,
      itemListElement: out.items.slice(0, 50).map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: `${base}/a/${a.slug}${vi ? '' : '?lang=en'}`, name: a.name })),
    },
    crumbList(base, ids.crumbs, crumbs),
  ];
  return {
    kind: 'directory', lang, url, canonical: url, alternates, markdown: `${path}.md${vi ? '' : '?lang=en'}`,
    title: `${title} | FeestFinder`, description,
    // Only lists worth showing are offered to search results; every filter combination is not a page.
    robots: out.total >= DIRECTORY_INDEX_MIN ? ROBOTS : 'noindex, follow',
    image: { ...image, alt: h1 },
    publishedAt: null,
    updatedAt: vnIso(updatedAt)!,
    headings: { facts: t('facts', lang), about: t('about', lang), upcoming: t('withShows', lang), past: t('others', lang), updated: t('updated', lang) },
    page: {
      crumbs, kicker: t('directory', lang), h1, summary,
      facts: [{ label: t('artistCount', lang), value: String(out.total) }, { label: t('withShows', lang), value: String(withShows.length) }],
      about: '', upcoming: links(withShows), past: links(others),
      otherLang: { label: t('otherLang', lang), path: vi ? `${path}?lang=en` : path },
    },
    jsonLd: { '@context': 'https://schema.org', '@graph': JSON.parse(JSON.stringify(graph)) },
  };
}

/** The directory paths with at least DIRECTORY_INDEX_MIN artists: /a, /a/style/<style>, /a/city/<city>. */
export async function directoryPages(q: Queryable): Promise<string[]> {
  const rows = await many<{ styles: string[]; cities: string[] }>(q,
    `select a.styles || coalesce(array_agg(distinct s) filter (where s is not null), '{}') as styles,
            array_remove(array[a.based_city], null) || coalesce(array_agg(distinct e.city) filter (where e.city is not null), '{}') as cities
       from artists a left join event_artists ea on ea.artist_id = a.id
       left join events e on e.id = ea.event_id and ${PUBLIC_EVENT}
       left join lateral unnest(e.styles) s on true
      group by a.id having a.owner_user_id is not null or count(e.id) > 0`);
  if (rows.length < DIRECTORY_INDEX_MIN) return [];
  const count = (xs: string[]) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>());
  const styles = count(rows.flatMap((r) => [...new Set(r.styles)]));
  const cities = count(rows.flatMap((r) => [...new Set(r.cities)]));
  const launched = new Set(launchedCities().map((c) => c.slug));
  return [
    '/a',
    ...[...styles].filter(([k, n]) => n >= DIRECTORY_INDEX_MIN && styleByKey(k)).map(([k]) => `/a/style/${k}`).sort(),
    ...[...cities].filter(([k, n]) => n >= DIRECTORY_INDEX_MIN && launched.has(k)).map(([k]) => `/a/city/${k}`).sort(),
  ];
}
