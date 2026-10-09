import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { legacyListPath } from '../src/routes/frontend.ts';

describe('event pages for search engines and AI assistants', () => {
  let env: TestEnv;
  before(async () => { env = await setup({ config: { serveFrontend: true } }); });
  after(async () => { await env.close(); });

  it('answers first, then gives the facts, in Vietnamese by default', async () => {
    const r = await env.as().get('/seo/events/ravo');
    assert.equal(r.status, 200);
    const s = r.body;
    assert.equal(s.lang, 'vi');
    assert.equal(s.canonical, 'http://test.local/e/ravo');
    assert.deepEqual(s.alternates, { vi: 'http://test.local/e/ravo', en: 'http://test.local/e/ravo?lang=en', 'x-default': 'http://test.local/e/ravo' });
    assert.equal(s.title, 'Ravolution Music Festival – 19/9 · SECC, TP.HCM | FeestFinder', 'short enough for a search result');
    assert.ok(s.description.length <= 160, s.description);
    assert.match(s.description, /^Ravolution Music Festival: EDM, Thứ Bảy, 19\/9\/2026/);
    assert.match(s.page.summary, /^Ravolution Music Festival là sự kiện EDM diễn ra vào Thứ Bảy, 19\/9\/2026, từ 16:00 – 02:00 \(hôm sau\) tại SECC/);
    assert.match(s.page.summary, /Vé từ 1\.200\.000₫ \(\d hạng vé\)/);
    assert.match(s.page.summary, /Dành cho khách 18\+\. Đội hình: Hoaprox, DJ Mie, Wukong\. Tổ chức bởi Ravolution Entertainment\.$/);
    const facts = Object.fromEntries(s.page.facts.map((f: any) => [f.label, f]));
    assert.equal(facts['Thời gian'].datetime, '2026-09-19T16:00:00+07:00');
    assert.match(facts['Địa điểm'].href, /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
    assert.equal(facts['Ban tổ chức'].href, '/o/ravoent');
    assert.ok(s.page.faq.length > 0, 'the organiser’s answers');
    assert.ok(s.page.updates.some((u: any) => /Cổng số 3/.test(u.body)), 'the organiser’s updates');
    assert.ok(s.page.related.length > 0 && s.page.related.every((x: any) => x.path !== '/e/ravo'));
    assert.deepEqual(s.page.crumbs.map((c: any) => c.path), ['/', '/list?city=ho-chi-minh', '/list?city=ho-chi-minh&genre=EDM', '/e/ravo']);
    assert.equal(s.image.url, 'http://test.local/og/v1/edm.png', 'genre art when there is no cover');
    assert.equal((await env.as().get('/seo/events/no-such-event')).status, 404);
    assert.equal((await env.as().get('/seo/events/ravo?lang=fr')).status, 400);
  });

  it('describes the event, the page and the site in one schema.org graph', async () => {
    const { jsonLd } = (await env.as().get('/seo/events/ravo')).body;
    const byType = Object.fromEntries(jsonLd['@graph'].map((n: any) => [n['@type'], n]));
    assert.deepEqual(Object.keys(byType).sort(), ['BreadcrumbList', 'FAQPage', 'MusicEvent', 'Organization', 'WebPage', 'WebSite']);
    const ev = byType.MusicEvent;
    assert.equal(ev['@id'], 'http://test.local/e/ravo#event');
    assert.equal(ev.startDate, '2026-09-19T16:00:00+07:00');
    assert.equal(ev.eventStatus, 'https://schema.org/EventScheduled');
    assert.deepEqual([ev.location.address.addressLocality, ev.location.address.addressRegion, ev.location.address.addressCountry], ['Thành phố Hồ Chí Minh', 'Thành phố Hồ Chí Minh', 'VN']);
    assert.equal(ev.offers['@type'], 'AggregateOffer');
    assert.equal(ev.offers.lowPrice, Math.min(...ev.offers.offers.map((o: any) => o.price)));
    assert.equal(ev.offers.priceCurrency, 'VND');
    assert.deepEqual(ev.performer.map((p: any) => p.name), ['Hoaprox', 'DJ Mie', 'Wukong']);
    assert.equal(ev.typicalAgeRange, '18-');
    assert.equal(byType.WebPage.mainEntity['@id'], ev['@id']);
    assert.match(byType.WebPage.dateModified, /\+07:00$/);
    assert.equal(byType.BreadcrumbList.itemListElement.at(-1).item, 'http://test.local/e/ravo');
    assert.ok(byType.FAQPage.mainEntity.every((q: any) => q.acceptedAnswer.text), 'only questions the organiser answered');
  });

  it('serves the page in English at ?lang=en, each version pointing at the other', async () => {
    const s = (await env.as().get('/seo/events/ravo?lang=en')).body;
    assert.equal(s.canonical, 'http://test.local/e/ravo?lang=en');
    assert.match(s.title, /^Ravolution Music Festival – 19 Sep · /);
    assert.match(s.page.summary, /^Ravolution Music Festival is an EDM event taking place on Saturday 19 September 2026, 16:00 – 02:00 \(next day\)/);
    assert.equal(s.page.otherLang.path, '/e/ravo');
    assert.equal(s.headings.facts, 'Key facts');
  });

  it('gives the page its head, one graph and its section headings, for the front to render', async () => {
    const res = await env.as().get('/seo/events/ravo');
    assert.equal(res.status, 200);
    assert.equal(res.headers['cache-control'], 'public, max-age=60');
    const s = res.body;
    assert.equal(s.robots, 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    assert.equal(s.image.width, 1200);
    assert.equal(s.jsonLd['@graph'].filter((n: any) => n['@type'] === 'MusicEvent').length, 1, 'one event in the structured data');
    const headings = Object.values(s.headings);
    for (const h of ['Thông tin chính', 'Đội hình', 'Vé', 'Tin từ BTC', 'Câu hỏi thường gặp', 'Sự kiện liên quan']) assert.ok(headings.includes(h), h);
    assert.equal(s.page.otherLang.path, '/e/ravo?lang=en');
  });

  it('says when an event is cancelled', async () => {
    await env.ctx.db.query(`update events set status = 'cancelled' where slug = 'blues'`);
    try {
      const s = (await env.as().get('/seo/events/blues')).body;
      assert.match(s.page.summary, /đã bị huỷ\./);
      assert.match(s.page.kicker, /Đã huỷ/);
      const ev = s.jsonLd['@graph'].find((n: any) => n['@id'].endsWith('#event'));
      assert.equal(ev.eventStatus, 'https://schema.org/EventCancelled');
    } finally {
      await env.ctx.db.query(`update events set status = 'live' where slug = 'blues'`);
    }
  });

  it('paints genre art for link previews when an event has no cover', async () => {
    const res = await env.app.inject({ method: 'GET', url: '/og/v1/edm.png' });
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['content-type'], 'image/png');
    assert.match(String(res.headers['cache-control']), /immutable/);
    const png = res.rawPayload;
    assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG');
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630]);
    assert.equal((await env.app.inject({ method: 'GET', url: '/og/v1/disco.png' })).statusCode, 404);
  });

  it('sends the old city landing pages to the list with the same filters', async () => {
    assert.equal(legacyListPath('vi', 'ho-chi-minh', 'this-weekend'), '/list?city=ho-chi-minh&time=weekend&lang=vi');
    assert.equal(legacyListPath('en', 'ho-chi-minh', 'free/edm'), '/list?city=ho-chi-minh&genre=EDM&lang=en');
    assert.equal(legacyListPath('vi', 'ho-chi-minh', 'thao-dien/night-market'), '/list?city=ho-chi-minh&genre=Food&lang=vi');
    assert.equal(legacyListPath('city', 'da-lat', ''), '/list');
    const res = await env.as().get('/city/ho-chi-minh/edm/this-weekend');
    assert.equal(res.status, 301);
    assert.equal(res.headers.location, '/list?city=ho-chi-minh&genre=EDM&time=weekend');
    // The Next front answers /vi/… and /en/… itself.
    assert.equal((await env.as().get('/vi/ho-chi-minh/edm/this-weekend')).status, 404);
    assert.equal((await env.as().get('/en/ha-noi')).status, 404);
    assert.equal((await env.as().get('/seo/landing/vi/ho-chi-minh/this-weekend')).status, 404);
  });

  it('gives organiser pages the same treatment: an answer, the facts, their events, one graph', async () => {
    const s = (await env.as().get('/seo/organizers/ravoent')).body;
    assert.equal(s.kind, 'organizer');
    assert.equal(s.canonical, 'http://test.local/o/ravoent');
    assert.ok(s.title.length <= 75, s.title);
    assert.match(s.page.summary, /^Ravolution Entertainment là đơn vị tổ chức sự kiện đã được FeestFinder xác minh, tổ chức các sự kiện EDM ở TP\.HCM/);
    assert.match(s.page.summary, /Có 2 sự kiện sắp diễn ra; gần nhất là Ravolution Warm-up/);
    assert.ok(s.page.upcoming.some((x: any) => x.path === '/e/ravo'));
    assert.ok(s.page.facts.every((f: any) => !/@|\+84/.test(f.value)), 'no private contact details');
    const types = s.jsonLd['@graph'].map((n: any) => n['@type']);
    assert.deepEqual(types, ['Organization', 'WebSite', 'ProfilePage', 'Organization', 'BreadcrumbList']);
    const org = s.jsonLd['@graph'][3];
    assert.equal(org['@id'], 'http://test.local/o/ravoent#organization');
    assert.deepEqual(org.sameAs, ['https://ravolution.vn']);
    assert.ok(org.event.some((e: any) => e.url === 'http://test.local/e/ravo' && e.location.address.addressCountry === 'VN'));
    assert.equal((await env.as().get('/seo/organizers/nobody')).status, 404);

    const en = (await env.as().get('/seo/organizers/ravoent?lang=en')).body;
    assert.match(en.page.summary, /^Ravolution Entertainment is an event promoter verified by FeestFinder/);
    assert.ok(en.page.upcoming.every((x: any) => x.path.endsWith('?lang=en')), 'English pages link to English pages');

    assert.equal(s.headings.upcoming, 'Sự kiện sắp diễn ra');
    assert.equal(s.page.upcoming[0].path, '/e/ravo-warmup');
  });

  it('serves every event and organiser page as Markdown, and an llms.txt that lists them', async () => {
    const md = await env.as().get('/e/ravo.md');
    assert.equal(md.status, 200);
    assert.match(String(md.headers['content-type']), /^text\/markdown/);
    assert.equal(md.headers.link, '<http://test.local/e/ravo>; rel="canonical"');
    assert.match(md.body, /^# Ravolution Music Festival\n\n> Ravolution Music Festival là sự kiện EDM/);
    assert.match(md.body, /- \*\*Thời gian:\*\* Thứ Bảy, 19\/9\/2026 · 16:00 – 02:00 \(hôm sau\)/);
    assert.match(md.body, /## Lịch diễn\n\n### Thứ Bảy, 19\/9\/2026/);
    assert.match(md.body, /\[English\]\(http:\/\/test\.local\/e\/ravo\.md\?lang=en\)/);
    const enMd = (await env.as().get('/o/ravoent.md?lang=en')).body as string;
    assert.match(enMd, /^# Ravolution Entertainment/);
    assert.match(enMd, /\[Ravolution Music Festival\]\(http:\/\/test\.local\/e\/ravo\?lang=en\)/);
    assert.equal((await env.as().get('/e/nothing.md')).status, 404);
    assert.equal((await env.as().get('/seo/events/ravo')).body.markdown, '/e/ravo.md');

    const llms = await env.as().get('/llms.txt');
    assert.equal(llms.status, 200);
    assert.match(llms.body, /^# FeestFinder\n\n> FeestFinder lists festivals/);
    assert.match(llms.body, /## Upcoming events\n\n- \[/);
    assert.match(llms.body, /- \[Ravolution Music Festival\]\(http:\/\/test\.local\/e\/ravo\.md\): EDM · 19 Sep 16:00/);
    assert.match(llms.body, /- \[Ravolution Entertainment\]\(http:\/\/test\.local\/o\/ravoent\.md\): 2 upcoming events · EDM/);
    assert.match((await env.as().get('/robots.txt')).body, /llms\.txt/);
  });

  it('lists event and organiser pages in both languages in the sitemap, and no landing pages', async () => {
    const map = (await env.as().get('/sitemap.xml')).body as string;
    assert.match(map, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
    assert.match(map, /<loc>http:\/\/test\.local\/e\/ravo<\/loc><lastmod>\d{4}-\d{2}-\d{2}<\/lastmod><priority>0\.9<\/priority><xhtml:link rel="alternate" hreflang="vi" href="http:\/\/test\.local\/e\/ravo"\/><xhtml:link rel="alternate" hreflang="en" href="http:\/\/test\.local\/e\/ravo\?lang=en"\/>/);
    assert.match(map, /<loc>http:\/\/test\.local\/e\/ravo\?lang=en<\/loc>/);
    assert.match(map, /<loc>http:\/\/test\.local\/list<\/loc>/);
    assert.match(map, /<loc>http:\/\/test\.local\/o\/ravoent<\/loc><lastmod>[^<]+<\/lastmod><priority>0\.6<\/priority><xhtml:link rel="alternate" hreflang="vi" href="http:\/\/test\.local\/o\/ravoent"\/>/);
    assert.match(map, /<loc>http:\/\/test\.local\/o\/ravoent\?lang=en<\/loc>/);
    assert.doesNotMatch(map, /\/vi\/ho-chi-minh/);
  });
});

describe('/ops behind a CDN', () => {
  let env: TestEnv;
  before(async () => { env = await setup({ config: { serveFrontend: true, env: 'production' } }); });
  after(async () => { await env.close(); });
  const get = (url: string, headers?: Record<string, string>) => env.app.inject({ method: 'GET', url, headers });

  it('names every file with the deployment version and keeps those for good', async () => {
    const shell = await get('/ops');
    assert.equal(shell.headers['cache-control'], 'public, max-age=0, s-maxage=86400', 'the edge keeps the empty shell for the deployment');
    const v = shell.body.match(/\/pages\/ops\/js\/main\.js\?v=([\w-]+)/)?.[1];
    assert.ok(v, 'the shell loads its scripts with the version');
    assert.match(shell.body, new RegExp(`/ui/theme\\.css\\?v=${v}`), 'and its stylesheets');
    assert.doesNotMatch(String(shell.headers['content-security-policy']), /unsafe-eval/);
    assert.equal((await get(`/pages/ops/ops.css?v=${v}`)).headers['cache-control'], 'public, max-age=31536000, immutable');
    assert.equal((await get('/pages/ops/ops.css')).headers['cache-control'], 'public, max-age=3600, s-maxage=86400', 'an unversioned URL is not kept for good');
    assert.equal((await get('/pages/ops/ops.css?v=old')).headers['cache-control'], 'public, max-age=3600, s-maxage=86400');
    assert.match((await get('/ui/vendor/phosphor/bold/style.css')).body, new RegExp(`Phosphor-Bold\\.woff2\\?v=${v}`), 'and the fonts they load');
  });

  it('serves none of the old screens: the Next front draws them', async () => {
    for (const path of ['/', '/list', '/app', '/studio', '/console', '/e/ravo', '/map', '/organizer']) {
      assert.equal((await get(path, { accept: 'text/html' })).statusCode, 404, path);
    }
  });
});
