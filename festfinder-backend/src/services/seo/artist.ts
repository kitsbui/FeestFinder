import type { Ctx } from '../../context.ts';
import { many, one } from '../../db/index.ts';
import type { Row } from '../../db/rows.ts';
import type { Lang } from '../../lib/i18n.ts';
import { cityLabel, cityOf } from '../../lib/places.ts';
import { styleByKey } from '../../lib/styles.ts';
import { isoIn } from '../../lib/time.ts';
import { presentLinks } from '../artists.ts';
import { mixesOf } from '../mixes.ts';
import { tracksOf } from '../audio.ts';
import { OG_HEIGHT, OG_WIDTH } from '../ogimage.ts';
import { abs, addressOf, type ArtistSeo, baseOf, clip, crumbList, eventLine, type Fact, hostOf, inLang, ogFallback, PUBLIC_EVENT, ROBOTS, SCHEMA_TYPE, shortDay, siteNodes, t, text, vnIso } from './shared.ts';

/* An artist page for search engines and AI assistants. Part of services/seo.ts. */

/** An artist's own channels, once the profile is theirs (claimed) or the team verified it: unproven links name no one. */
function sameAsOf(a: Row<'artists'>): string[] | undefined {
  const urls = [a.website, ...((a.owner_user_id || a.verified) ? presentLinks(a).map((l) => l.url) : [])].filter((u): u is string => !!u);
  return urls.length ? urls : undefined;
}

/** Everything an artist page says to search engines and AI assistants, or null when no public event lists them. */
export async function buildArtistSeo(ctx: Ctx, slug: string, lang: Lang = 'vi'): Promise<ArtistSeo | null> {
  const a = await one<Row<'artists'>>(ctx.db, 'select * from artists where slug = $1 and hidden_at is null', [slug]);
  if (!a) return null;
  const now = ctx.clock.now();
  const events = await many<Pick<Row<'events'>, 'slug' | 'title' | 'genre' | 'styles' | 'starts_on' | 'ends_on' | 'start_time' | 'end_time' | 'starts_at'
      | 'ends_at' | 'status' | 'venue_name' | 'address' | 'area' | 'city' | 'entry_mode' | 'price_from' | 'currency' | 'cover_url' | 'updated_at'>>(ctx.db,
    `select e.slug, e.title, e.genre, e.styles, e.starts_on, e.ends_on, e.start_time, e.end_time, e.starts_at, e.ends_at, e.status, e.venue_name,
            e.address, e.area, e.city, e.entry_mode, e.price_from, e.currency, e.cover_url, e.updated_at
       from event_artists ea join events e on e.id = ea.event_id
      where ea.artist_id = $1 and ${PUBLIC_EVENT} order by e.starts_at`, [a.id]);
  // A profile someone claimed has a page before its first show (kept out of search results below).
  if (!events.length && !a.owner_user_id) return null;
  const upcoming = events.filter((e) => new Date(e.ends_at ?? 0) >= now && e.status === 'live');
  const past = events.filter((e) => new Date(e.ends_at ?? 0) < now).reverse().slice(0, 12);
  const vi = lang === 'vi';
  const base = baseOf(ctx);
  const path = `/a/${a.slug}`;
  const alternates = { vi: `${base}${path}`, en: `${base}${path}?lang=en`, 'x-default': `${base}${path}` };
  const url = alternates[lang];
  const rank = (xs: string[]) => [...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>())].sort((x, y) => y[1] - x[1]).map(([x]) => x);
  // The styles the artist wrote first, then what their events say.
  const styles = [...new Set([...(a.styles ?? []), ...rank(events.flatMap((e) => e.styles ?? []))])].slice(0, 4).map((k) => text(styleByKey(k)?.label, lang) || k);
  const genres = rank(events.map((e) => e.genre).filter((g): g is string => !!g)).slice(0, 3);
  const cities = rank(upcoming.map((e) => cityOf(e.city).slug)).map((k) => text(cityLabel(k), lang));
  const next = upcoming[0];
  const updatedAt = [a.created_at, ...events.map((e) => e.updated_at)].map((d) => new Date(d)).sort((x, y) => y.getTime() - x.getTime())[0];
  const what = styles.length ? styles.join(', ') : genres.join(', ');
  const bio = text(a.bio, lang);
  const mixes = await mixesOf(ctx.db, a.id);
  const tracks = await tracksOf(ctx.db, a.id);

  const summary = [
    vi
      ? `${a.name}${what ? ` (${what})` : ''} có ${upcoming.length} show sắp diễn ra trên FeestFinder${cities.length ? ` ở ${cities.join(', ')}` : ''}.`
      : `${a.name}${what ? ` (${what})` : ''} has ${upcoming.length} upcoming ${upcoming.length === 1 ? 'show' : 'shows'} on FeestFinder${cities.length ? ` in ${cities.join(', ')}` : ''}.`,
    next ? (vi ? `Gần nhất là ${next.title} (${eventLine(next, lang)}).` : `Next is ${next.title} (${eventLine(next, lang)}).`) : '',
  ].filter(Boolean).join(' ');
  const description = clip(`${a.name}: ${upcoming.length ? upcoming.slice(0, 3).map((e) => `${e.title} (${shortDay(e.starts_on, lang)}${cityOf(e.city) ? `, ${text(cityLabel(e.city), lang)}` : ''})`).join('; ') : summary}`, 160);
  const title = [`${a.name} – ${vi ? 'lịch diễn' : 'upcoming shows'}${cities[0] ? ` · ${cities[0]}` : ''}`, a.name].find((x) => x.length <= 62) ?? clip(a.name, 62);
  const cover = a.image_url ? { cover_url: a.image_url } : upcoming.find((e) => e.cover_url) ?? events.find((e) => e.cover_url);
  const image = cover
    ? { url: abs(ctx, cover.cover_url)!, width: 1600, height: 900, type: 'image/jpeg' }
    : { url: ogFallback(base), width: OG_WIDTH, height: OG_HEIGHT, type: 'image/png' };
  const crumbs = [{ name: 'FeestFinder', path: inLang('/', lang) }, { name: lang === 'vi' ? 'Nghệ sĩ' : 'Artists', path: inLang('/a', lang) }, { name: a.name, path: inLang(path, lang) }];
  const facts: Fact[] = [
    { label: t('styles', lang), value: what },
    { label: t('upcoming', lang), value: String(upcoming.length) },
    { label: t('playsIn', lang), value: cities.join(', ') },
    ...(next ? [{ label: t('nextShow', lang), value: `${next.title} · ${eventLine(next, lang)}`, href: inLang(`/e/${next.slug}`, lang) }] : []),
    ...(a.website ? [{ label: t('site', lang), value: hostOf(a.website), href: a.website }] : []),
  ].filter((f) => f.value);

  const ids = { page: url, artist: `${url}#artist`, crumbs: `${url}#breadcrumb` };
  const place = (e: (typeof events)[number]) => {
    const ad = addressOf(e.city);
    return { '@type': 'Place', name: e.venue_name ?? undefined,
      address: { '@type': 'PostalAddress', streetAddress: [e.address, e.area].filter(Boolean).join(', ') || undefined, addressLocality: ad.locality, addressRegion: ad.region, addressCountry: ad.country } };
  };
  const graph = [
    ...siteNodes(base),
    {
      '@type': 'ProfilePage', '@id': ids.page, url, name: `${title} | FeestFinder`, description, inLanguage: lang,
      isPartOf: { '@id': `${base}/#website` }, breadcrumb: { '@id': ids.crumbs }, mainEntity: { '@id': ids.artist },
      primaryImageOfPage: { '@type': 'ImageObject', url: image.url, width: image.width, height: image.height },
      dateModified: vnIso(updatedAt),
    },
    {
      '@type': 'MusicGroup', '@id': ids.artist, name: a.name, url, description: bio || summary,
      genre: [...styles, ...genres].slice(0, 5), sameAs: sameAsOf(a),
      image: a.image_url ? abs(ctx, a.image_url) : undefined,
      event: upcoming.slice(0, 30).map((e) => ({
        '@type': SCHEMA_TYPE[e.genre ?? ''] ?? 'Event', name: e.title, url: `${base}/e/${e.slug}${vi ? '' : '?lang=en'}`,
        startDate: e.starts_at ? isoIn(new Date(e.starts_at), cityOf(e.city).timezone) : undefined,
        endDate: e.ends_at ? isoIn(new Date(e.ends_at ?? 0), cityOf(e.city).timezone) : undefined,
        eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: place(e), image: [e.cover_url ? abs(ctx, e.cover_url) : ogFallback(base)],
        performer: { '@id': ids.artist },
      })),
      // Their MP3 playlist (routes/tracks.ts), then their sets, played by each service's own player (services/mixes.ts).
      track: tracks.length || mixes.length ? [...tracks.map((tr) => ({
        '@type': 'MusicRecording', name: tr.title, byArtist: { '@id': ids.artist },
        duration: tr.durationS ? `PT${Math.floor(tr.durationS / 60)}M${tr.durationS % 60}S` : undefined,
        audio: { '@type': 'AudioObject', name: tr.title, contentUrl: tr.url, encodingFormat: 'audio/mpeg' },
      })), ...mixes.map((m) => ({
        '@type': ['track', 'show', 'episode'].includes(m.kind) ? 'MusicRecording' : 'MusicPlaylist',
        name: m.title, url: m.url, image: m.thumbnailUrl ?? undefined, byArtist: { '@id': ids.artist },
        audio: { '@type': 'AudioObject', name: m.title, embedUrl: m.embedSrc, provider: { '@type': 'Organization', name: m.providerLabel } },
        recordedAt: m.event ? { '@type': 'Event', name: m.event.title, url: `${base}/e/${m.event.slug}${vi ? '' : '?lang=en'}` } : undefined,
        interactionStatistic: [
          { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: m.likeCount },
          { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: m.commentCount },
        ],
      }))] : undefined,
    },
    crumbList(base, ids.crumbs, crumbs),
  ];
  const links = (xs: typeof events) => xs.map((e) => ({ title: e.title, path: inLang(`/e/${e.slug}`, lang), line: eventLine(e, lang) }));
  return {
    kind: 'artist', lang, url, canonical: url, alternates, markdown: `${path}.md${vi ? '' : '?lang=en'}`,
    title: `${title} | FeestFinder`, description,
    // An artist with nothing coming up is a thin page: kept, but not offered to search results.
    robots: upcoming.length ? ROBOTS : 'noindex, follow',
    image: { ...image, alt: a.name },
    publishedAt: vnIso(a.created_at) ?? null,
    updatedAt: vnIso(updatedAt)!,
    headings: { facts: t('facts', lang), about: t('about', lang), upcoming: t('upcoming', lang), past: t('pastEvents', lang), updated: t('updated', lang), mixes: t('mixes', lang) },
    page: {
      crumbs, kicker: [t('artist', lang), what].filter(Boolean).join(' · '), h1: a.name, summary, facts, about: bio,
      upcoming: links(upcoming), past: links(past),
      mixes: mixes.map((m) => ({ title: m.title, url: m.url, line: m.providerLabel })),
      otherLang: { label: t('otherLang', lang), path: vi ? `${path}?lang=en` : path },
    },
    jsonLd: { '@context': 'https://schema.org', '@graph': JSON.parse(JSON.stringify(graph)) },
  };
}
