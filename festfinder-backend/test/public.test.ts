import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';

describe('public discovery (Web + App, signed out)', () => {
  let env: TestEnv;
  before(async () => { env = await setup(); });
  after(async () => { await env.close(); });

  it('reports health', async () => {
    const r = await env.as().get('/health');
    assert.equal(r.status, 200);
    assert.equal(r.body.ok, true);
  });

  it('lists this weekend by default, with time facet counts and a featured hero', async () => {
    const r = await env.as().get('/events?limit=20');
    assert.equal(r.status, 200);
    const slugs = r.body.items.map((e: any) => e.slug);
    for (const s of ['hozo', 'ravo', 'outcast', 'rapviet', 'ravo-warmup']) assert.ok(slugs.includes(s), `${s} is on this weekend`);
    assert.ok(!slugs.includes('momang'), '26 Sep is next weekend');
    assert.deepEqual(r.body.window, { from: '2026-09-18', to: '2026-09-20' });
    assert.ok(r.body.facets.time.tonight >= 2, 'blues and yoko are tonight');
    assert.ok(r.body.facets.time.month >= r.body.facets.time.weekend);
    assert.equal(r.body.hero.featured, true);
    const ravo = r.body.items.find((e: any) => e.slug === 'ravo');
    assert.equal(ravo.badge.key, 'low_tickets');
    assert.deepEqual(ravo.badge.label, { en: 'Low Tickets', vi: 'Còn ít vé' });
    assert.equal(ravo.organizer.verified, true);
    assert.equal(ravo.viewer, null);
    assert.equal(typeof ravo.distanceKm, 'number');
  });

  it('filters by genre and price band, and paginates with a cursor', async () => {
    const free = await env.as().get('/events?time=month&price=free&limit=50');
    assert.ok(free.body.items.length > 0);
    assert.ok(free.body.items.every((e: any) => e.isFree));
    const edm = await env.as().get('/events?time=month&genre=EDM&limit=1');
    assert.equal(edm.body.items.length, 1);
    assert.equal(edm.body.items[0].genre, 'EDM');
    assert.ok(edm.body.nextCursor);
    const next = await env.as().get(`/events?time=month&genre=EDM&limit=1&cursor=${edm.body.nextCursor}`);
    assert.notEqual(next.body.items[0].id, edm.body.items[0].id);
  });

  it('searches across all dates, ignoring diacritics, with ended events last', async () => {
    const r = await env.as().get('/events?q=thu%20duc&limit=20');
    const slugs = r.body.items.map((e: any) => e.slug);
    assert.ok(slugs.includes('hozo') && slugs.includes('8wonder'));
    const pastIdx = r.body.items.findIndex((e: any) => e.past);
    const lastUpcoming = r.body.items.map((e: any) => e.past).lastIndexOf(false);
    if (pastIdx >= 0) assert.ok(pastIdx > lastUpcoming);
  });

  it('does not show listings pulled for reports, in review, or rejected', async () => {
    const r = await env.as().get('/events?time=all&limit=60');
    const slugs = r.body.items.map((e: any) => e.slug);
    for (const s of ['warehouse-rave-q4', 'ravo-after-hours', 'pool-party-q2', 'ravo-bus']) assert.ok(!slugs.includes(s), `${s} hidden`);
    const detail = await env.as().get('/events/ravo-after-hours');
    assert.equal(detail.status, 404);
  });

  it('returns event detail with tier ladder, refund policy and timetable', async () => {
    const r = await env.as().get('/events/ravo');
    assert.equal(r.status, 200);
    assert.deepEqual(r.body.tickets.tiers.map((t: any) => [t.key, t.state]), [['early', 'soldout'], ['ga', 'last'], ['vip', 'onsale'], ['table', 'soon']]);
    assert.equal(r.body.tickets.urgency.en, 'Price rises to 1,450,000₫ on 18 Sep');
    assert.match(r.body.tickets.refundPolicy.en, /Refunds up to 7 days/);
    assert.equal(r.body.timetable.days.length, 1);
    const bass = r.body.timetable.days[0].stages.find((s: any) => s.name.en === 'Bass room');
    const closing = bass.sets.find((s: any) => s.artist === 'Closing b2b');
    assert.equal(closing.endMin, 25 * 60 + 30, 'minutes run past midnight');
    assert.equal(r.body.organizer.slug, 'ravoent');
    assert.equal(r.body.similar.length, 3);
    assert.equal(r.body.me, null);
    assert.equal(r.body.hasLiveMode, true);
  });

  it('shows an organiser profile with upcoming and past events', async () => {
    const r = await env.as().get('/organizers/ravoent');
    assert.equal(r.status, 200);
    assert.ok(r.body.upcoming.some((e: any) => e.slug === 'ravo'));
    assert.ok(r.body.past.some((e: any) => e.slug === 'ravo-2025'));
    assert.equal(r.body.stats.since, 2023);
  });

  it('serves live featured shelves inside their date window only', async () => {
    const r = await env.as().get('/shelves');
    assert.deepEqual(r.body.items.map((s: any) => s.slug), []);
    env.clock.set('2026-09-16T10:00:00+07:00');
    const live = await env.as().get('/shelves');
    assert.deepEqual(live.body.items.map((s: any) => s.slug), ['trending']);
    env.clock.set('2026-09-14T10:00:00+07:00');
  });

  it('searches the map inside a bounding box', async () => {
    const d7 = await env.as().get('/events/map?bbox=106.70,10.70,106.75,10.75');
    assert.deepEqual(d7.body.items.map((e: any) => e.slug), ['ravo']);
    const free = await env.as().get('/events/map?free=true');
    assert.ok(free.body.items.every((e: any) => e.isFree));
  });

  it('builds the SEO landing page with metadata, answers, FAQ and JSON-LD', async () => {
    const r = await env.as().get('/seo/landing/en/ho-chi-minh/free/this-weekend');
    assert.equal(r.status, 200);
    assert.equal(r.body.h1, 'Free events in Ho Chi Minh City this weekend');
    assert.equal(r.body.meta.canonical, 'http://test.local/en/ho-chi-minh/free/this-weekend');
    assert.equal(r.body.meta.alternates.vi, 'http://test.local/vi/ho-chi-minh/free/this-weekend');
    assert.equal(r.body.revalidateSeconds, 900);
    assert.deepEqual(r.body.events.map((e: any) => e.slug).sort(), ['hozo', 'outcast']);
    assert.equal(r.body.faqs.length, 4);
    assert.deepEqual(r.body.jsonLd.map((x: any) => x['@type']), ['ItemList', 'FAQPage', 'BreadcrumbList']);
    const vi = await env.as().get('/seo/landing/vi/ho-chi-minh/edm');
    assert.equal(vi.body.h1, 'Sự kiện EDM ở TP.HCM');
    assert.equal((await env.as().get('/seo/landing/vi/ho-chi-minh/not-a-facet')).status, 404);
    assert.equal((await env.as().get('/seo/landing/vi/ha-noi/edm')).status, 404);
  });

  it('powers the hero stat cards and drill-downs', async () => {
    const r = await env.as().get('/explore/stats?view=venues');
    assert.ok(r.body.counts.free >= 2);
    assert.ok(r.body.venues.some((v: any) => v.name.startsWith('SECC')));
  });

  it('autocompletes venues and artists without diacritics', async () => {
    const v = await env.as().get('/venues?q=phu%20tho');
    assert.equal(v.body.items.length, 2);
    const a = await env.as().get('/artists?q=hoap');
    assert.deepEqual(a.body.items.map((x: any) => x.name), ['Hoaprox']);
  });

  it('serves one sponsored ad per placement, never alcohol to unknown ages', async () => {
    const r = await env.as().get('/ads?placement=live');
    assert.equal(r.body.ad.brand, 'Hydra Salts');
    assert.deepEqual(r.body.ad.sponsoredLabel, { en: 'Sponsored', vi: 'Được tài trợ' });
    const imp = await env.as().post(`/ads/${r.body.ad.id}/impression`);
    assert.equal(imp.status, 202);
  });

  it('counts a view once per visitor per half hour', async () => {
    const id = env.ids.event.hozo;
    const first = await env.as().post(`/events/${id}/track`, { type: 'view', source: 'shelf' });
    const again = await env.as().post(`/events/${id}/track`, { type: 'view', source: 'shelf' });
    assert.equal(first.body.counted, true);
    assert.equal(again.body.counted, false);
  });

  it('exports a calendar file', async () => {
    const r = await env.as().get(`/events/${env.ids.event.ravo}/calendar.ics`);
    assert.equal(r.status, 200);
    assert.match(r.body, /DTSTART:20260919T090000Z/);
    assert.match(r.body, /SUMMARY:Ravolution Music Festival/);
  });

  it('returns errors in the requested language with a stable code', async () => {
    const en = await env.as().get('/events/nope');
    assert.equal(en.status, 404);
    assert.equal(en.body.error.message, 'Event not found');
    const vi = await env.call('GET', '/events/nope', { headers: { 'x-lang': 'vi' } });
    assert.equal(vi.body.error.message, 'Không tìm thấy sự kiện');
    const bad = await env.as().get('/events?genre=Techno');
    assert.equal(bad.status, 400);
    assert.equal(bad.body.error.code, 'invalid_input');
    assert.equal(bad.body.error.details.fields[0].path, 'genre');
    const unauth = await env.as().get('/me');
    assert.equal(unauth.status, 401);
  });
});

describe('rate limit', () => {
  let env: TestEnv;
  before(async () => { env = await setup({ config: { rateLimitPerMinute: 3 } }); });
  after(async () => { await env.close(); });

  /** A request as the API sees it; `forwardedFor` also marks it as proxied by Next, as Next does. */
  const hit = (remoteAddress: string, forwardedFor?: string, proxied = forwardedFor !== undefined) => env.app.inject({
    method: 'GET', url: '/genres', remoteAddress,
    headers: {
      'x-lang': 'en',
      ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
      ...(proxied ? { 'x-forwarded-host': 'festfinder.vn' } : {}),
    },
  });

  it('answers 429 with its own message once a client goes over', async () => {
    for (let i = 0; i < 3; i++) assert.equal((await hit('203.0.113.9')).statusCode, 200);
    const over = await hit('203.0.113.9');
    assert.equal(over.statusCode, 429);
    assert.equal(over.json().error.code, 'rate_limited');
    assert.match(over.json().error.message, /Too many requests/);
    assert.ok(over.headers['retry-after']);
  });

  it('counts each browser behind the Next.js app on its own', async () => {
    for (let i = 0; i < 3; i++) assert.equal((await hit('127.0.0.1', '198.51.100.7')).statusCode, 200);
    assert.equal((await hit('127.0.0.1', '198.51.100.7')).statusCode, 429);
    assert.equal((await hit('127.0.0.1', '198.51.100.8')).statusCode, 200);
  });

  it('ignores a forwarded address from a client that is not our proxy', async () => {
    for (let i = 0; i < 3; i++) await hit('203.0.113.50', `192.0.2.${i}`);
    assert.equal((await hit('203.0.113.50', '192.0.2.99')).statusCode, 429);
  });

  it('never limits server-side rendering from our own network', async () => {
    for (let i = 0; i < 6; i++) assert.equal((await hit('10.0.0.5')).statusCode, 200);
  });

  it('limits a browser that claims a private address through the proxy', async () => {
    for (let i = 0; i < 3; i++) assert.equal((await hit('127.0.0.2', '10.9.9.9')).statusCode, 200);
    assert.equal((await hit('127.0.0.2', '10.9.9.9')).statusCode, 429);
  });

  it('limits proxied browsers even when no forwarded address reaches us', async () => {
    for (let i = 0; i < 3; i++) assert.equal((await hit('10.0.0.6', undefined, true)).statusCode, 200);
    assert.equal((await hit('10.0.0.6', undefined, true)).statusCode, 429);
  });
});
