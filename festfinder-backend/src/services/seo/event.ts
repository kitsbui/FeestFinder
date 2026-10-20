import type { Ctx } from '../../context.ts';
import { many, one } from '../../db/index.ts';
import type { Row } from '../../db/rows.ts';
import type { Lang } from '../../lib/i18n.ts';
import { formatMoney } from '../../lib/money.ts';
import { cityOf } from '../../lib/places.ts';
import { EVENT_TYPE_LABEL, type EventType } from '../../lib/styles.ts';
import { isoIn, timeIn } from '../../lib/time.ts';
import { loadTimetable } from '../../presenters/timetable.ts';
import { faqFor } from '../../routes/discussion.ts';
import { latestUpdates } from '../../routes/night.ts';
import { OG_HEIGHT, OG_WIDTH } from '../ogimage.ts';
import { sponsorsOf } from '../projects.ts';
import { abs, addressOf, baseOf, clip, crumbList, eventLine, type EventSeo, hostOf, inLang, longDate, ogFallback, orgSameAsOf, priceLine, ROBOTS, SCHEMA_TYPE, shortDay, siteNodes, t, text, vnIso, whenLine } from './shared.ts';

/* An event page for search engines and AI assistants. Part of services/seo.ts. */

type Related = Pick<Row<'events'>, 'slug' | 'title' | 'genre' | 'starts_on' | 'ends_on' | 'start_time' | 'end_time' | 'venue_name' | 'area' | 'city'
  | 'entry_mode' | 'price_from' | 'currency'>;

/** Everything an event page says to search engines and AI assistants, or null if it is not public. */
export async function buildEventSeo(ctx: Ctx, slug: string, lang: Lang = 'vi'): Promise<EventSeo | null> {
  const ev = await one<Row<'events'>>(ctx.db,
    `select e.* from events e where e.slug = $1 and e.status in ('live', 'cancelled') and not e.held_for_reports and e.published_at is not null`, [slug]);
  if (!ev) return null;
  const now = ctx.clock.now();
  const relatedSql = `select e.slug, e.title, e.genre, e.starts_on, e.ends_on, e.start_time, e.end_time, e.venue_name, e.area, e.city, e.entry_mode, e.price_from, e.currency
      from events e where e.status = 'live' and not e.held_for_reports and e.published_at is not null`;
  const [org, faq, updates, timetable, related, nextEdition, prevEdition] = await Promise.all([
    one<Pick<Row<'organizers'>, 'slug' | 'name' | 'website' | 'links'>>(ctx.db, 'select slug, name, website, links from organizers where id = $1', [ev.organizer_id]),
    faqFor(ctx.db, ev.id, 10),
    latestUpdates(ctx.db, ev.id, 5),
    loadTimetable(ctx.db, ev),
    // What else is on: the same city first, then the same genre, venue or organiser.
    many<Related>(ctx.db,
      `${relatedSql} and e.id <> $1 and e.ends_at >= $2
        order by (case when e.city = $3 then 4 else 0 end) + (case when e.genre = $4 then 2 else 0 end)
               + (case when e.venue_name = $5 or e.organizer_id = $6 then 1 else 0 end) desc, e.starts_at
        limit 6`, [ev.id, now, ev.city, ev.genre, ev.venue_name, ev.organizer_id]),
    one<Related>(ctx.db, `${relatedSql} and e.previous_edition_id = $1 order by e.starts_at limit 1`, [ev.id]),
    ev.previous_edition_id ? one<Related>(ctx.db, `${relatedSql} and e.id = $1`, [ev.previous_edition_id]) : null,
  ]);
  const base = baseOf(ctx);
  const path = `/e/${ev.slug}`;
  const alternates = { vi: `${base}${path}`, en: `${base}${path}?lang=en`, 'x-default': `${base}${path}` };
  const url = alternates[lang];
  const cityName = text(cityOf(ev.city).name, lang);
  const cityFull = addressOf(ev.city);
  // The event's own instants are written in its city's time.
  const tz = cityOf(ev.city).timezone;
  const zoned = (ts: Date | string | null | undefined) => (ts ? isoIn(new Date(ts), tz) : undefined);
  const cancelled = ev.status === 'cancelled';
  const past = !cancelled && ev.ends_at && new Date(ev.ends_at) < now;
  const soldOut = !!ev.sold_out;
  const low = !soldOut && ev.badge === 'low_tickets';
  const statusLabel = t(cancelled ? 'cancelled' : past ? 'past' : soldOut ? 'soldOut' : low ? 'low' : 'onSale', lang);
  const lineup = ((ev.lineup ?? []) as string[]).filter(Boolean);
  const about = text(ev.description, lang);
  const venueLine = [ev.venue_name, ev.area, cityName].filter(Boolean).join(', ');
  const street = [ev.address, ev.address && ev.area && ev.address.includes(ev.area) ? null : ev.area].filter(Boolean).join(', ');
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.lat != null && ev.lng != null ? `${ev.lat},${ev.lng}` : [ev.venue_name, ev.address, ev.area, cityName].filter(Boolean).join(', '))}`;
  // Feest Radar never reads an age: its finds' "All ages" is only the column's default.
  const ageKnown = !(ev.origin === 'radar' && ev.age === 'All ages');
  const ageLabel = !ageKnown ? '' : ev.age === 'All ages' ? t('allAges', lang) : ev.age;
  const startIso = zoned(ev.starts_at) ?? `${ev.starts_on}T${ev.start_time ?? '00:00'}:00`;
  const updatedAt = [ev.updated_at, ...updates.map((u) => u.createdAt)].map((d) => new Date(d)).sort((a, b) => b.getTime() - a.getTime())[0];
  const vi = lang === 'vi';

  // The answer first: what, when, where, how much, who. Facts only, the way an assistant would quote it.
  const summary = [
    cancelled
      ? (vi ? `${ev.title} đã bị huỷ.` : `${ev.title} has been cancelled.`)
      : vi
        ? `${ev.title} là sự kiện ${ev.genre ?? ''} ${past ? 'đã diễn ra' : 'diễn ra'} vào ${whenLine(ev, lang).replace(' · ', ', từ ')} tại ${[ev.venue_name, street, cityName].filter(Boolean).join(', ')}.`.replace(/\s+/g, ' ')
        : `${ev.title} is ${/^[aeiou]/i.test(ev.genre ?? '') ? 'an' : 'a'} ${ev.genre ?? ''} event ${past ? 'that took place' : 'taking place'} on ${whenLine(ev, lang).replace(' · ', ', ')} at ${[ev.venue_name, street, cityName].filter(Boolean).join(', ')}.`.replace(/\s+/g, ' '),
    ev.entry_mode === 'paid' && ev.price_from
      ? (vi ? `Vé từ ${formatMoney(ev.price_from, ev.currency, lang)}, ${statusLabel.toLowerCase()}.` : `Tickets from ${formatMoney(ev.price_from, ev.currency, lang)}, ${statusLabel.toLowerCase()}.`)
      : ev.entry_mode === 'donation' ? (vi ? 'Vào cửa tuỳ tâm.' : 'Pay what you like.') : (vi ? 'Vào cửa miễn phí.' : 'Free entry.'),
    ev.age !== 'All ages' ? (vi ? `Dành cho khách ${ev.age}.` : `Ages ${ev.age}.`) : '',
    lineup.length ? `${vi ? 'Đội hình' : 'Lineup'}: ${lineup.slice(0, 8).join(', ')}${lineup.length > 8 ? '…' : ''}.` : '',
    org ? (vi ? `Tổ chức bởi ${org.name}.` : `Organised by ${org.name}.`) : '',
  ].filter(Boolean).join(' ');

  const description = clip([
    `${ev.title}: ${[ev.genre, whenLine(ev, lang)].filter(Boolean).join(', ')}`,
    venueLine,
    cancelled ? statusLabel : priceLine(ev, lang),
    lineup.length ? `${vi ? 'Đội hình' : 'Lineup'}: ${lineup.slice(0, 4).join(', ')}` : '',
  ].filter(Boolean).join('. ') + '.', 160);
  // The longest title that still fits a search result: the venue's short name, then without it.
  const venueShort = String(ev.venue_name ?? '').split(/\s[—–-]\s/)[0];
  const title = [
    `${ev.title} – ${shortDay(ev.starts_on, lang)} · ${[venueShort, cityName].filter(Boolean).join(', ')}`,
    `${ev.title} – ${shortDay(ev.starts_on, lang)} · ${cityName}`,
    ev.title,
  ].find((x) => x.length <= 62) ?? clip(ev.title, 62);
  const fullTitle = `${title} | FeestFinder`;

  const image = ev.cover_url
    ? { url: abs(ctx, ev.cover_url)!, width: 1600, height: 900, type: 'image/jpeg' }
    : { url: ogFallback(base), width: OG_WIDTH, height: OG_HEIGHT, type: 'image/png' };
  const imageAlt = `${ev.title} · ${venueLine}`;

  const listPath = `/?city=${cityOf(ev.city).slug}`;
  // Home, the city's list, the night: every event is EDM, so a genre level would say nothing (design v2 phase 1).
  const crumbs = [
    { name: 'FeestFinder', path: inLang('/', lang) },
    { name: `${t('eventsIn', lang)} ${cityName}`, path: inLang(listPath, lang) },
    { name: ev.title, path: inLang(path, lang) },
  ];

  const facts: EventSeo['page']['facts'] = [
    { label: t('when', lang), value: whenLine(ev, lang), datetime: startIso },
    { label: t('venue', lang), value: ev.venue_name ?? '', href: mapsUrl },
    { label: t('address', lang), value: [street, cityName].filter(Boolean).join(', ') },
    { label: t('price', lang), value: priceLine(ev, lang) },
    { label: t('status', lang), value: statusLabel },
    { label: t('age', lang), value: ageLabel },
    ...(ev.genre ? [{ label: t('genre', lang), value: ev.genre }] : []),
    ...(ev.event_type && ev.event_type !== 'other' && EVENT_TYPE_LABEL[ev.event_type as EventType] ? [{ label: t('kind', lang), value: EVENT_TYPE_LABEL[ev.event_type as EventType][lang] }] : []),
    ...(lineup.length ? [{ label: t('lineup', lang), value: lineup.join(', ') }] : []),
    ...(org ? [{ label: t('organiser', lang), value: org.name, href: inLang(`/o/${org.slug}`, lang) }] : []),
    ...(ev.ticket_url ? [{ label: t('buy', lang), value: hostOf(ev.ticket_url), href: ev.ticket_url }] : []),
    ...(ev.event_url ? [{ label: t('site', lang), value: hostOf(ev.event_url), href: ev.event_url }] : []),
  ].filter((f) => f.value);

  const line = (r: Related) => eventLine(r, lang);

  const page: EventSeo['page'] = {
    crumbs,
    kicker: [ev.genre, cityName, statusLabel].filter(Boolean).join(' · '),
    h1: ev.title,
    summary,
    facts,
    about,
    lineup,
    timetable: (timetable?.days ?? []).map((d) => ({
      day: longDate(d.date, lang),
      sets: d.stages.flatMap((st) => st.sets.map((x) => ({ time: timeIn(new Date(x.startsAt), tz), artist: x.artist, stage: text(st.name, lang), at: new Date(x.startsAt).getTime() })))
        .sort((a, b) => a.at - b.at).map(({ time, artist, stage }) => ({ time, artist, stage })),
    })),
    tickets: ev.entry_mode === 'paid' && ev.price_from ? [{ name: t('tickets', lang), price: formatMoney(ev.price_from, ev.currency, lang), state: statusLabel }] : [],
    updates: updates.map((u) => ({ kind: text(u.kindLabel, lang), body: u.body, at: zoned(u.createdAt)!, atLabel: `${timeIn(new Date(u.createdAt), tz)} ${shortDay(zoned(u.createdAt)!.slice(0, 10), lang)}` })),
    faq: faq.map((f) => ({ question: f.question, answer: f.answer })),
    editions: [
      ...(prevEdition ? [{ label: t('previous', lang), title: prevEdition.title, path: inLang(`/e/${prevEdition.slug}`, lang), line: line(prevEdition) }] : []),
      ...(nextEdition ? [{ label: t('next', lang), title: nextEdition.title, path: inLang(`/e/${nextEdition.slug}`, lang), line: line(nextEdition) }] : []),
    ],
    related: related.map((r) => ({ title: r.title, path: inLang(`/e/${r.slug}`, lang), line: line(r) })),
    otherLang: { label: t('otherLang', lang), path: vi ? `${path}?lang=en` : path },
  };

  // ---- structured data ----
  const sponsors = await sponsorsOf(ctx.db, ev.id);
  const ids = { site: `${base}/#website`, page: url, event: `${url}#event`, crumbs: `${url}#breadcrumb`, faq: `${url}#faq` };
  const event = {
    '@type': SCHEMA_TYPE[ev.genre ?? ''] ?? 'Event',
    '@id': ids.event,
    name: ev.title,
    description: about || summary,
    url,
    mainEntityOfPage: { '@id': ids.page },
    image: [image.url],
    startDate: startIso,
    endDate: zoned(ev.ends_at),
    eventStatus: cancelled ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    inLanguage: lang,
    isAccessibleForFree: ev.entry_mode !== 'paid',
    typicalAgeRange: ev.age === '18+' ? '18-' : ev.age === '16+' ? '16-' : undefined,
    maximumAttendeeCapacity: ev.capacity ?? undefined,
    location: {
      '@type': 'Place',
      name: ev.venue_name ?? undefined,
      address: {
        '@type': 'PostalAddress',
        streetAddress: street || undefined,
        addressLocality: cityFull.locality,
        addressRegion: cityFull.region,
        addressCountry: cityFull.country,
      },
      geo: ev.lat != null && ev.lng != null ? { '@type': 'GeoCoordinates', latitude: ev.lat, longitude: ev.lng } : undefined,
      hasMap: mapsUrl,
    },
    organizer: org ? { '@type': 'Organization', name: org.name, url: base + inLang(`/o/${org.slug}`, lang), sameAs: orgSameAsOf(org) } : undefined,
    performer: lineup.length ? lineup.slice(0, 30).map((name) => ({ '@type': 'PerformingGroup', name })) : undefined,
    // Sponsors who backed the project the night came from (services/projects.ts).
    sponsor: sponsors.length ? sponsors.map((x) => ({ '@type': 'Organization', name: x.name })) : undefined,
    offers: ev.entry_mode !== 'paid'
        ? { '@type': 'Offer', price: 0, priceCurrency: ev.currency, availability: 'https://schema.org/InStock', url }
        : ev.price_from
          ? { '@type': 'Offer', price: ev.price_from, priceCurrency: ev.currency, availability: soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock', url: ev.ticket_url || url }
          // Sold at a price nobody gave yet: where to buy, no made-up price.
          : { '@type': 'Offer', priceCurrency: ev.currency, availability: soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock', url: ev.ticket_url || ev.event_url || url },
    interactionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: ev.hype_count },
  };
  const graph = [
    ...siteNodes(base),
    {
      '@type': 'WebPage', '@id': ids.page, url, name: fullTitle, description, inLanguage: lang,
      isPartOf: { '@id': ids.site }, breadcrumb: { '@id': ids.crumbs }, mainEntity: { '@id': ids.event },
      primaryImageOfPage: { '@type': 'ImageObject', url: image.url, width: image.width, height: image.height },
      datePublished: vnIso(ev.published_at), dateModified: vnIso(updatedAt),
    },
    event,
    crumbList(base, ids.crumbs, crumbs),
    // Only the organiser's own answers: they are shown on the page as its FAQ.
    ...(faq.length ? [{
      '@type': 'FAQPage', '@id': ids.faq, isPartOf: { '@id': ids.page },
      mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
    }] : []),
  ];

  return {
    kind: 'event', lang, url, canonical: url, alternates, markdown: `${path}.md${vi ? '' : '?lang=en'}`, title: fullTitle, description,
    robots: ROBOTS,
    image: { ...image, alt: imageAlt },
    publishedAt: vnIso(ev.published_at) ?? null,
    updatedAt: vnIso(updatedAt)!,
    headings: Object.fromEntries((['facts', 'about', 'lineup', 'timetable', 'tickets', 'updates', 'faq', 'editions', 'related', 'updated'] as const).map((k) => [k, t(k, lang)])) as EventSeo['headings'],
    page,
    jsonLd: { '@context': 'https://schema.org', '@graph': JSON.parse(JSON.stringify(graph)) },
  };
}
