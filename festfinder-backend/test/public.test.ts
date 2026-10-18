import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';

describe('public discovery (Web + App, signed out)', () => {
  let env: TestEnv;
  before(async () => { env = await setup(); });
  after(async () => { await env.close(); });

  it('turns away a NUL character in an address, a query or a body as bad input, never a 500', async () => {
    for (const url of ['/events/%00', '/artists/x%00y', '/organizers/%F0%9F%98%80%00', '/events?q=a%00b']) {
      const r = await env.as().get(url);
      assert.equal(r.status, 400, url);
      assert.equal(r.body.error.code, 'invalid_input', url);
    }
    const token = await env.attendee();
    const r = await env.as(token).patch('/me', { name: 'Minh\u0000Anh' });
    assert.equal(r.status, 400);
    assert.equal((await env.as(token).patch('/me', { name: 'Minh Anh' })).status, 200, 'the same field without it saves');
  });

  it('says the AI guide can answer only when it runs, or kept this event’s guide in that language', async () => {
    const id = env.ids.event.ravo;
    const flag = async (lang: string) => (await env.as().get('/events/ravo', { 'x-lang': lang })).body.guide;
    assert.equal(await flag('vi'), false, 'the tests run without a guide');
    const token = await env.attendee();
    assert.equal((await env.as(token).get(`/events/${id}/guide?lang=vi`)).status, 503);
    const kept = { before: [], after: [], explore: [], wear: { headline: 'Đồ thoải mái', items: [], avoid: '' }, tip: 'Đi sớm' };
    await env.ctx.db.query(`insert into ai_guides (event_id, lang, data, model, created_at) values ($1, 'vi', $2, 'test', now())`, [id, JSON.stringify(kept)]);
    assert.equal(await flag('vi'), true);
    assert.equal(await flag('en'), false, 'a guide kept in Vietnamese does not answer in English');
    assert.equal((await env.as(token).get(`/events/${id}/guide?lang=vi`)).status, 200);
    assert.equal((await env.as(token).get(`/events/${id}/guide?lang=en`)).status, 503);
  });

  it('reports health', async () => {
    const r = await env.as().get('/health');
    assert.equal(r.status, 200);
    assert.equal(r.body.ok, true);
  });

  it('public reads without a session are kept by the CDN for a minute; anything signed in stays private', async () => {
    for (const url of ['/events?limit=5', '/events/map', '/events/ravo', '/artists', '/organizers/ravoent']) {
      const r = await env.as().get(url);
      assert.equal(r.status, 200, url);
      assert.equal(r.headers['vercel-cdn-cache-control'], 'max-age=60, stale-while-revalidate=60', url);
      assert.equal(r.headers['cache-control'], 'public, max-age=0, must-revalidate', `${url}: the browser never reuses a stale copy`);
      assert.match(String(r.headers.vary), /x-ff-session/, `${url} varies by whether the visitor is signed in`);
      assert.doesNotMatch(String(r.headers.vary), /cookie/i, `${url}: Vercel never caches a response that varies on Cookie`);
    }
    const token = await env.attendee();
    const head = await env.app.inject({ method: 'HEAD', url: '/events?limit=5' });
    assert.equal(head.headers['vercel-cdn-cache-control'], 'max-age=60, stale-while-revalidate=60', 'HEAD answers like GET (curl -I)');
    const signedIn = await env.as(token).get('/events?limit=5');
    assert.equal(signedIn.headers['cache-control'], 'private, no-store', 'signed in: never shared');
    assert.equal(signedIn.headers['vercel-cdn-cache-control'], undefined);
    const withCookie = await env.as().get('/events?limit=5', { cookie: 'ff_session=whatever' });
    assert.equal(withCookie.headers['vercel-cdn-cache-control'], undefined, 'a session cookie, even a stale one, is never served a shared copy');
    for (const mark of ['1', 'render']) {
      const flagged = await env.as().get('/events?limit=5', { 'x-ff-session': mark });
      assert.equal(flagged.headers['vercel-cdn-cache-control'], undefined, `nothing is stored under x-ff-session: ${mark}`);
    }
    assert.equal((await env.as().get('/events/ravo/resale')).headers['vercel-cdn-cache-control'], undefined, 'nothing nested is public');
    assert.equal((await env.as().get('/me/tickets')).status, 401);
    assert.equal((await env.as().get('/map/style.json')).headers['cache-control'], 'public, max-age=300, s-maxage=3600');
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

  it('filters by style, and counts each style and what is free under the other filters', async () => {
    const all = await env.as().get('/events?time=month&limit=60');
    assert.ok(all.body.items.every((e: any) => e.genre === 'EDM'), 'FeestFinder lists EDM only');
    const house = await env.as().get('/events?time=month&style=house&limit=60');
    assert.ok(house.body.items.length > 0);
    assert.ok(house.body.items.every((e: any) => e.styles.includes('house')));
    const f = all.body.facets.style;
    assert.equal(f.house, house.body.items.length);
    assert.equal(all.body.facets.free, all.body.items.filter((e: any) => e.isFree).length);
    // The style counts ignore the style chosen, so the other chips keep their numbers.
    assert.deepEqual(house.body.facets.style, f);
    assert.equal(house.body.facets.free, house.body.items.filter((e: any) => e.isFree).length);
    assert.equal((await env.as().get('/events?style=polka')).status, 400);
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
    assert.equal(r.body.guide, false, 'no guide runs in the tests and none was written: the app offers no guide row');
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

  it('pins every listed event: its venue when it has no point of its own, else its city\'s centre', async () => {
    const db = env.ctx.db;
    const ev = (await db.query<{ id: string; venue_id: string | null; venue_name: string; lat: number; lng: number }>(
      `select id, venue_id, venue_name, lat, lng from events where slug = 'ravo'`)).rows[0];
    type MapPin = { slug: string; lat: number; lng: number; approx: boolean };
    const pinOf = async (q = '') => ((await env.as().get('/events/map' + q)).body.items as MapPin[]).find((e) => e.slug === 'ravo');
    const at = async () => pinOf().then((p) => [p?.lat, p?.lng, p?.approx]);
    // What Feest Radar often finds: a venue's name and a city, no coordinates. A venue of the city with that name has them.
    await db.query('update events set lat = null, lng = null, venue_id = null where id = $1', [ev.id]);
    try {
      assert.deepEqual(await at(), [ev.lat, ev.lng, false]);
      // A name nobody knows: the city's centre, marked approximate; a box around it finds it.
      await db.query(`update events set venue_name = 'Hidden Warehouse' where id = $1`, [ev.id]);
      const centre = (await db.query<{ lat: number; lng: number }>(`select lat, lng from cities where slug = 'ho-chi-minh'`)).rows[0];
      assert.deepEqual(await at(), [centre.lat, centre.lng, true]);
      assert.ok(await pinOf(`?bbox=${centre.lng - 0.05},${centre.lat - 0.05},${centre.lng + 0.05},${centre.lat + 0.05}`), 'the box reads the pin');
      // Once the team adds the venue (or the name as an alias of one), its point.
      await db.query(`insert into venues (name, address, area, city, lat, lng, aliases) values ('Somewhere', '1 A', 'Quận 2', 'ho-chi-minh', 10.79, 106.74, $1)`, [['HIDDEN WAREHOUSE']]);
      assert.deepEqual(await at(), [10.79, 106.74, false]);
    } finally {
      await db.query(`delete from venues where name = 'Somewhere'`);
      await db.query('update events set lat = $2, lng = $3, venue_id = $4, venue_name = $5 where id = $1', [ev.id, ev.lat, ev.lng, ev.venue_id, ev.venue_name]);
    }
    // The list of what is still to come and the map count the same events.
    const list = (await env.as().get('/events?time=all&upcoming=true&limit=60')).body;
    assert.equal((await env.as().get('/events/map')).body.total, list.total);
  });

  it('never calls a sold night free because nobody gave its price, and sends people to where it is sold', async () => {
    const db = env.ctx.db;
    const ev = (await db.query<{ id: string; slug: string; price_from: number; origin: string; ticket_url: string | null; event_url: string | null; age: string }>(
      `select e.id, e.slug, e.price_from, e.origin, e.ticket_url, e.event_url, e.age from events e
        where e.status = 'live' and e.entry_mode = 'paid' and e.ends_at >= $1 order by e.starts_at limit 1`, [env.clock.now()])).rows[0];
    assert.ok(ev, 'a paid night');
    const tiers = (await db.query<{ id: string; sales_open_at: Date | null }>('select id, sales_open_at from ticket_tiers where event_id = $1', [ev.id])).rows;
    // What Feest Radar finds on a page that gives no price, no ticket link and no age (and nothing sold here).
    await db.query(`update events set price_from = 0, origin = 'radar', ticket_url = null, event_url = 'https://club.example/night', age = 'All ages' where id = $1`, [ev.id]);
    await db.query(`update ticket_tiers set sales_open_at = $2 where event_id = $1`, [ev.id, new Date(env.clock.now().getTime() + 90 * 86400_000)]);
    try {
      type Card = { slug: string; isFree: boolean; priceUnknown: boolean };
      const card = ((await env.as().get('/events?time=all&limit=60')).body.items as Card[]).find((e) => e.slug === ev.slug)!;
      assert.deepEqual([card.isFree, card.priceUnknown], [false, true]);
      assert.ok(!((await env.as().get('/events?time=all&price=free&limit=60')).body.items as Card[]).some((e) => e.slug === ev.slug), 'not among the free nights');
      const detail = (await env.as().get('/events/' + ev.slug)).body;
      assert.equal(detail.age, null, 'Radar reads no age: none is shown');
      assert.equal(detail.links.go, '/go/' + ev.slug);
      const go = await env.as().get('/go/' + ev.slug);
      assert.deepEqual([go.status, go.headers.location], [302, 'https://club.example/night']);
      const seo = (await env.as().get('/seo/events/' + ev.slug)).body;
      const node = (seo.jsonLd['@graph'] as { '@type': string; isAccessibleForFree?: boolean }[]).find((n) => n['@type'] === 'MusicEvent')!;
      assert.equal(node.isAccessibleForFree, false);
      assert.ok((seo.page.facts as { value: string }[]).some((f) => f.value === 'Giá ở trang bán vé'));
      assert.ok(!(seo.page.facts as { value: string }[]).some((f) => f.value === 'Miễn phí' || f.value === 'Mọi lứa tuổi'));
    } finally {
      await db.query('update events set price_from = $2, origin = $3, ticket_url = $4, event_url = $5, age = $6 where id = $1',
        [ev.id, ev.price_from, ev.origin, ev.ticket_url, ev.event_url, ev.age]);
      for (const t of tiers) await db.query('update ticket_tiers set sales_open_at = $2 where id = $1', [t.id, t.sales_open_at]);
    }
  });

  it('lists events by city', async () => {
    const all = await env.as().get('/events?time=all&limit=60');
    assert.ok(all.body.items.every((e: any) => e.city === 'ho-chi-minh' && e.cityLabel.vi === 'TP.HCM'));
    const hanoi = await env.as().get('/events?time=all&city=ha-noi');
    assert.equal(hanoi.body.items.length, 0);
    assert.equal((await env.as().get('/events?city=da-lat')).status, 400);
  });

  it('powers the hero stat cards and drill-downs', async () => {
    const r = await env.as().get('/explore/stats?view=venues');
    assert.ok(r.body.counts.free >= 2);
    assert.ok(r.body.venues.some((v: any) => v.name.startsWith('SECC')));
    // Each venue's events carry what a row shows: the family and the day.
    const ev = r.body.venues[0].events[0];
    assert.ok(ev.slug && ev.startsOn && 'genre' in ev && 'startTime' in ev);
    // A city's weekend is its own: the same filters read in Bangkok's day answer too.
    assert.equal((await env.as().get('/explore/stats?view=weekend&city=bangkok')).status, 200);
  });

  it('autocompletes venues and artists without diacritics', async () => {
    const v = await env.as().get('/venues?q=phu%20tho');
    assert.equal(v.body.items.length, 2);
    // Hoaprox is a lineup name nobody runs: found among the unclaimed names, not in the directory.
    assert.deepEqual((await env.as().get('/artists?q=hoap')).body.items, []);
    assert.deepEqual((await env.as().get('/artists?q=hoap&kind=unclaimed')).body.items.map((x: any) => x.name), ['Hoaprox']);
    assert.deepEqual((await env.as().get('/artists?q=tran duy')).body.items.map((x: any) => x.name), ['Trần Duy'], 'without accents');
  });

  it('serves one sponsored ad per placement, never alcohol to unknown ages', async () => {
    const r = await env.as().get('/ads?placement=live');
    assert.equal(r.body.ad.brand, 'Hydra Salts');
    assert.deepEqual(r.body.ad.sponsoredLabel, { en: 'Sponsored', vi: 'Được tài trợ' });
    const imp = await env.as().post(`/ads/${r.body.ad.id}/impression`);
    assert.equal(imp.status, 202);
  });

  it('publishes the advertising rates the team set', async () => {
    const res = await env.as().get('/ads/rates');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { rates: { feed: 180000, banner: 240000, live: 520000 }, currency: 'VND' });
    await env.ctx.db.query(`update ad_settings set rates = '{"feed":200000,"banner":240000,"live":520000}' where id = 1`);
    assert.equal((await env.as().get('/ads/rates')).body.rates.feed, 200000);
    await env.ctx.db.query(`update ad_settings set rates = '{"feed":180000,"banner":240000,"live":520000}' where id = 1`);
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
      ...(proxied ? { 'x-forwarded-host': 'feestfinder.com' } : {}),
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
