import type { Draft } from './normalize.ts';
import { cleanText, cleanUrl, coord, decodeEntities } from './normalize.ts';

/*
 * schema.org Event data, which ticket sites, venues and festivals put in their pages for
 * search engines: <script type="application/ld+json"> holding an Event, MusicEvent,
 * Festival or any other *Event, alone, in an array or inside an @graph.
 */

const EVENT_TYPE = /(^|[/#:])([A-Za-z]*Event|Festival)$/;

export function typesOf(node: any): string[] {
  return ([] as unknown[]).concat(node?.['@type'] ?? []).map((t) => String(t).replace(/^.*[/#:]/, ''));
}

/** Every Event-like node in a page's JSON-LD blocks, in page order. */
export function jsonLdEvents(html: string): any[] {
  const out: any[] = [];
  const walk = (n: any, depth: number) => {
    if (!n || typeof n !== 'object' || depth > 6) return;
    if (Array.isArray(n)) return n.forEach((x) => walk(x, depth + 1));
    if (([] as unknown[]).concat(n['@type'] ?? []).some((t) => EVENT_TYPE.test(String(t)))) out.push(n);
    if (n['@graph']) walk(n['@graph'], depth + 1);
    // Event series and venue pages list their events under these.
    for (const k of ['subEvent', 'event', 'events', 'itemListElement']) if (n[k]) walk(n[k], depth + 1);
    if (n.item && typeof n.item === 'object') walk(n.item, depth + 1);
  };
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data: unknown;
    // Some sites leave HTML comments or stray control characters around the JSON.
    const body = m[1].trim().replace(/^<!--|-->$/g, '').replace(/[\u0000-\u0019]+/g, ' ');
    try { data = JSON.parse(body); } catch { continue; }
    walk(data, 0);
  }
  return out;
}

const first = (v: any) => (Array.isArray(v) ? v[0] : v);
const nameOf = (v: any): string | null => (typeof v === 'string' ? v : typeof v?.name === 'string' ? v.name : null);

/** Ticket sites put their own name in front of the event's. */
export function stripSiteName(title: string): string {
  return title.replace(/^\s*(ticketbox|ticketgo|vé|ticketmaster|eventbrite|resident advisor|ra)\s*[|:–-]\s*/i, '');
}

/** The fields of one schema.org Event node, as an adapter draft. */
export function draftFromJsonLd(ev: any, pageUrl?: string | null): Draft {
  const loc = first(ev.location);
  const addr = loc && typeof loc.address === 'object' ? first(loc.address) : null;
  const street = typeof loc?.address === 'string' ? loc.address : addr?.streetAddress ?? null;
  const offers = ([] as any[]).concat(ev.offers ?? []).flatMap((o) => (typeOf(o) === 'AggregateOffer' ? [{ price: o.lowPrice ?? o.price, priceCurrency: o.priceCurrency }] : [o]));
  const priced = offers.map((o) => ({ price: Number(String(o?.price ?? '').replace(/[^\d.]/g, '') || NaN), currency: o?.priceCurrency ? String(o.priceCurrency) : null }))
    .filter((o) => Number.isFinite(o.price) && o.price >= 0);
  const paid = priced.filter((o) => o.price > 0).sort((a, b) => a.price - b.price);
  const free = ev.isAccessibleForFree === true || ev.isAccessibleForFree === 'true' || (priced.length > 0 && paid.length === 0);
  const performers = ([] as any[]).concat(ev.performer ?? []).map(nameOf).filter((p): p is string => !!p).map(decodeEntities);
  const status = String(ev.eventStatus ?? '');
  const geo = loc?.geo ?? null;
  const image = first(ev.image);
  const url = cleanUrl(ev.url, pageUrl) ?? cleanUrl(pageUrl);
  const ticket = cleanUrl(first(offers)?.url, pageUrl);
  const tags = [ev.genre, ev.keywords, ev.about?.name].flatMap((t) => (Array.isArray(t) ? t : t ? [t] : [])).map(String);
  return {
    title: ev.name ? stripSiteName(decodeEntities(String(ev.name))) : null,
    description: ev.description ? String(ev.description) : null,
    start: ev.startDate ? String(ev.startDate) : null,
    end: ev.endDate ? String(ev.endDate) : null,
    venueName: nameOf(loc) ? decodeEntities(nameOf(loc)!) : null,
    address: street ? decodeEntities(String(street)) : null,
    area: cleanText(addr?.addressLocality, 60),
    // The street address is read first: some ticket sites put the wrong city in addressLocality.
    cityTexts: [addr?.addressLocality, addr?.addressRegion],
    country: typeof addr?.addressCountry === 'string' ? addr.addressCountry : nameOf(addr?.addressCountry),
    lat: coord(geo?.latitude, 90),
    lng: coord(geo?.longitude, 180),
    lineup: performers,
    tags,
    schemaType: typesOf(ev).find((t) => EVENT_TYPE.test(t)) ?? null,
    imageUrl: cleanUrl(typeof image === 'string' ? image : image?.url, pageUrl),
    ticketUrl: ticket ?? url,
    eventUrl: url,
    price: paid.length ? paid[0].price : free ? 0 : null,
    currency: (paid[0] ?? priced[0])?.currency ?? null,
    free: free || null,
    cancelled: /EventCancelled$/.test(status),
    organizerName: nameOf(first(ev.organizer)),
  };
}

const typeOf = (o: any) => typesOf(o)[0] ?? '';
