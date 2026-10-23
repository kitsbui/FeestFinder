import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setup, type TestEnv } from './helpers.ts';
import { jobs } from '../src/jobs.ts';
import { PageUnavailable } from '../src/services/fetchpage.ts';
import type { IngestIO } from '../src/services/ingest/types.ts';
import { clipText, decodeEntities, type Digest, fetchDueNews, fetchNewsSource, KEEP_DAYS, type NewsDigester, parseFeed, regionOf, topicOf } from '../src/services/news.ts';
import { STARTER_NEWS_SOURCES } from '../src/services/news-starter.ts';

/*
 * The news feed (migration 063, services/news.ts, routes/news.ts): the EDM press's own feeds
 * read on a schedule, each headline kept with its picture, sorted by topic and region, digested
 * in both languages when Claude is on, hidden by the team when needed, and gone after six months.
 */

const fixture = (name: string) => readFileSync(new URL(`./fixtures/news/${name}`, import.meta.url), 'utf8');

/** The network as fixtures: each feed address answers with its file; a known ETag answers 304. */
function fakeIO(now: Date, pages: Record<string, string>, opts: { etag?: string } = {}): IngestIO & { hits: string[] } {
  const hits: string[] = [];
  const fetchText = async (url: string, init: { headers?: Record<string, string> } = {}) => {
    hits.push(url);
    const text = pages[url];
    if (text === undefined) throw new PageUnavailable('upstream', 'status 404');
    if (opts.etag && init.headers?.['if-none-match'] === opts.etag) return { status: 304, url, text: '', etag: opts.etag, lastModified: null };
    return { status: 200, url, text, etag: opts.etag ?? null, lastModified: null };
  };
  return { now, secrets: {}, hits, fetchText, fetchPage: async (url) => ({ url, html: (await fetchText(url)).text }) };
}

class FakeDigester implements NewsDigester {
  readonly enabled = true;
  calls = 0;
  async digest(input: { title: string }): Promise<Digest> {
    this.calls++;
    return { en: `In short: ${input.title}.`, vi: `Tóm lại: ${input.title}.` };
  }
}

describe('reading a feed', () => {
  it('reads RSS 2.0: CDATA and entities, the summary as plain text, the picture from media:content, an enclosure or the words', () => {
    const feed = parseFeed(fixture('mixmag.xml'));
    assert.equal(feed.title, 'Mixmag');
    // The item without a link is left out; the old one is read (the fetch decides what to keep).
    assert.deepEqual(feed.items.map((i) => i.guid), ['mixmag-1001', 'https://mixmag.example/feature/hard-techno-beatport-report', 'mixmag-1003', 'mixmag-0001']);
    const [tml, hard, vina] = feed.items;
    assert.equal(tml.title, 'Tomorrowland announces 2027 dates & pre-registration');
    assert.equal(tml.summary, 'The Belgian festival will return to Boom over two weekends in July. Pre-registration opens next week, the organisers said on Monday.');
    assert.equal(tml.imageUrl, 'https://mixmag.example/images/tomorrowland-2027.jpg');
    assert.deepEqual([tml.author, tml.categories, tml.publishedAt?.toISOString()], ['Becky Buckle', ['News', 'Festivals'], '2026-10-20T09:30:00.000Z']);
    assert.equal(hard.title, 'Hard techno keeps rising: Beatport’s mid-year report');
    assert.equal(hard.imageUrl, 'https://mixmag.example/images/beatport-report.png');
    assert.equal(vina.title, "Vinahouse heads west: how Vietnam's club sound reached London");
    assert.equal(vina.imageUrl, 'https://mixmag.example/images/vinahouse.jpg');
    assert.equal(vina.summary, "From Saigon's clubs to a London warehouse: a short history of Vinahouse and the DJs carrying it abroad. Read on.");
  });

  it('reads Atom: the alternate link, the id, the author, the summary, the thumbnail', () => {
    const feed = parseFeed(fixture('atom.xml'));
    assert.equal(feed.title, 'DJ TechTools');
    assert.equal(feed.items.length, 2);
    const [rb, br] = feed.items;
    assert.deepEqual([rb.url, rb.guid, rb.title], ['https://djtt.example/rekordbox-8-stems', 'tag:djtt.example,2026:rekordbox-8', 'rekordbox 8 adds stem separation on the CDJ-3000 & more']);
    assert.deepEqual([rb.author, rb.categories, rb.publishedAt?.toISOString()], ['Dan White', ['Software'], '2026-10-21T08:00:00.000Z']);
    assert.equal(rb.summary, 'The update brings stems to the players themselves, no laptop needed.');
    assert.equal(rb.imageUrl, 'https://djtt.example/img/rekordbox-8-thumb.jpg');
    assert.deepEqual([br.url, br.imageUrl, br.publishedAt?.toISOString()], ['https://djtt.example/boiler-room-bangkok', null, '2026-10-20T10:00:00.000Z']);
    assert.deepEqual(parseFeed('<html><body>not a feed</body></html>').items, []);
  });

  it('sorts a headline by topic and region from its words, and clips text at a word', () => {
    assert.equal(topicOf('Tomorrowland announces 2027 dates & pre-registration'), 'festival');
    assert.equal(topicOf('rekordbox 8 adds stem separation on the CDJ-3000'), 'tech');
    assert.equal(topicOf('Universal signs a licensing deal with Udio'), 'industry');
    assert.equal(topicOf('Charlotte de Witte shares a new single'), 'artist');
    assert.equal(topicOf('A night in Hoàn Kiếm'), 'scene');
    assert.equal(regionOf('Vinahouse heads west: how Vietnam\'s club sound reached London', 'global'), 'vietnam');
    assert.equal(regionOf('Boiler Room announces a Bangkok show with a Thai line-up', 'global'), 'asia');
    assert.equal(regionOf('A new club opens in Berlin', 'asia'), 'asia');
    assert.equal(regionOf('A new club opens in Berlin', 'global'), 'global');
    assert.equal(decodeEntities('Beatport&#8217;s &amp; &quot;more&quot; &eacute;'), 'Beatport’s & "more" é');
    assert.equal(clipText('one two three four five six', 14), 'one two three…');
    assert.equal(clipText('short', 14), 'short');
  });
});

describe('the news feed: fetched on a schedule, pictured, digested, served, hidden by the team', () => {
  let env: TestEnv;
  let admin: string;
  const digester = new FakeDigester();
  const pages = {
    'https://mixmag.example/rss.xml': fixture('mixmag.xml'),
    'https://djtt.example/feed/atom/': fixture('atom.xml'),
    'https://vietcetera.example/rss': fixture('vn.xml'),
  };
  let io: ReturnType<typeof fakeIO>;
  before(async () => {
    env = await setup({ digester, ingestIO: () => io });
    io = fakeIO(env.clock.now(), pages, { etag: '"v1"' });
    admin = await env.admin();
  });
  after(async () => { await env.close(); });

  const sources: Record<string, string> = {};

  it('lists the suggested publications once, and the team adds a feed of its own', async () => {
    const first = await env.as(admin).post('/admin/news/sources/starter');
    assert.equal(first.body.added, STARTER_NEWS_SOURCES.length);
    assert.equal((await env.as(admin).post('/admin/news/sources/starter')).body.added, 0);
    // Only addresses the fixtures answer are read in this test: the starters are switched off here.
    const all = (await env.as(admin).get('/admin/news')).body;
    assert.equal(all.items.length, STARTER_NEWS_SOURCES.length);
    assert.equal(all.digests, true);
    for (const s of all.items) assert.equal((await env.as(admin).patch(`/admin/news/sources/${s.id}`, { enabled: false })).body.enabled, false);
    for (const [name, siteUrl, feedUrl, region] of [
      ['Mixmag (test)', 'https://mixmag.example/', 'https://mixmag.example/rss.xml', 'global'],
      ['DJ TechTools (test)', 'https://djtt.example/', 'https://djtt.example/feed/atom/', 'global'],
      ['Vietcetera (test)', 'https://vietcetera.example/', 'https://vietcetera.example/rss', 'vietnam'],
    ]) {
      const r = await env.as(admin).post('/admin/news/sources', { name, siteUrl, feedUrl, region, lang: region === 'vietnam' ? 'vi' : 'en', intervalMinutes: 60 });
      assert.equal(r.status, 201, JSON.stringify(r.body));
      sources[name] = r.body.id;
    }
    assert.equal((await env.as(admin).post('/admin/news/sources', { name: 'Again', siteUrl: 'https://mixmag.example/', feedUrl: 'https://mixmag.example/rss.xml' })).status, 409);
    assert.equal((await env.as().get('/admin/news')).status, 401);
  });

  it('reads every due feed, keeps the headlines of the last six months with their pictures, and costs nothing when a feed is unchanged', async () => {
    const runs = await fetchDueNews(env.ctx, { io });
    const by = Object.fromEntries(runs.map((r) => [r.name, r]));
    assert.deepEqual([by['Mixmag (test)'].fetched, by['Mixmag (test)'].added, by['Mixmag (test)'].error], [4, 3, null], 'the old item is not kept');
    assert.deepEqual([by['DJ TechTools (test)'].added, by['Vietcetera (test)'].added], [2, 1]);
    // Pictures: the feed's when it carries one, else the article's own preview (the fake network answers every link with a picture).
    const rows = await env.ctx.db.query<{ guid: string; image_from: string; image_url: string }>(`select guid, image_from, image_url from news_items order by guid`);
    const pic = Object.fromEntries(rows.rows.map((r) => [r.guid, [r.image_from, r.image_url]]));
    assert.deepEqual(pic['mixmag-1001'], ['feed', 'https://mixmag.example/images/tomorrowland-2027.jpg']);
    assert.deepEqual(pic['tag:djtt.example,2026:br-bkk'], ['page', 'https://djtt.example/boiler-room-bangkok']);
    assert.deepEqual(pic['vc-1'], ['page', 'https://vietcetera.example/vn/ha-noi-thi-diem-gio-mo-cua'], 'an http:// picture is not taken');
    // A second run: the ETag says nothing changed, nothing is read twice.
    env.clock.advance?.(2 * 3600_000);
    const hitsBefore = io.hits.length;
    const again = await fetchNewsSource(env.ctx, sources['Mixmag (test)'], { io });
    assert.deepEqual([again.notModified, again.added, again.fetched], [true, 0, 0]);
    assert.equal(io.hits.length, hitsBefore + 1);
    const src = (await env.as(admin).get('/admin/news')).body.items.find((s: { id: string }) => s.id === sources['Mixmag (test)']);
    assert.deepEqual([src.items, src.lastCount, src.lastError], [3, 4, null]);
  });

  it('serves the headlines newest first with their publisher, topic, region and styles, filtered, and cached for the CDN', async () => {
    const r = await env.as().get('/news');
    assert.equal(r.status, 200);
    assert.ok(String(r.headers['vercel-cdn-cache-control']).includes('max-age=60'));
    const list = r.body;
    assert.equal(list.total, 6);
    assert.deepEqual(list.items.map((i: { title: string }) => i.title.slice(0, 12)), ['rekordbox 8 ', 'Hà Nội thí đ', 'Boiler Room ', 'Tomorrowland', 'Hard techno ', 'Vinahouse he']);
    const tml = list.items.find((i: { title: string }) => i.title.startsWith('Tomorrowland'));
    assert.deepEqual([tml.topic, tml.region, tml.source.name, tml.source.host, tml.imageUrl, tml.digest], ['festival', 'global', 'Mixmag (test)', 'mixmag.example', 'https://mixmag.example/images/tomorrowland-2027.jpg', null]);
    const hard = list.items.find((i: { title: string }) => i.title.startsWith('Hard techno'));
    assert.deepEqual([hard.topic, hard.styles.map((s: { key: string }) => s.key)], ['industry', ['hard-techno', 'hard-dance']]);
    const vn = list.items.find((i: { title: string }) => i.title.startsWith('Hà Nội'));
    assert.deepEqual([vn.topic, vn.region, vn.source.lang], ['industry', 'vietnam', 'vi']);
    assert.deepEqual(list.topics, { festival: 2, artist: 0, industry: 2, tech: 1, scene: 1 });
    assert.equal((await env.as().get('/news?topic=festival')).body.items.length, 2);
    assert.equal((await env.as().get('/news?region=vietnam')).body.items.length, 2);
    assert.equal((await env.as().get('/news?style=hard-techno')).body.items.length, 1);
    assert.equal((await env.as().get('/news?limit=2')).body.nextOffset, 2);
    assert.equal((await env.as().get('/news?topic=nope')).status, 400);
  });

  it('writes a digest in both languages for the newest headlines, and again when a headline changes', async () => {
    assert.equal((await env.as(admin).get('/admin/news')).body.undigested, 6);
    const out = await jobs.digestNews(env.ctx);
    assert.equal(out, 6);
    const tml = (await env.as().get('/news?topic=festival')).body.items.find((i: { title: string }) => i.title.startsWith('Tomorrowland'));
    assert.deepEqual(tml.digest, { en: 'In short: Tomorrowland announces 2027 dates & pre-registration.', vi: 'Tóm lại: Tomorrowland announces 2027 dates & pre-registration.' });
    assert.equal(await jobs.digestNews(env.ctx), 0);
    // The publisher rewrote the headline: the item keeps its place, the digest is written again.
    io = fakeIO(env.clock.now(), { ...pages, 'https://mixmag.example/rss.xml': pages['https://mixmag.example/rss.xml'].replace('Tomorrowland announces 2027 dates & pre-registration', 'Tomorrowland confirms 2027 dates') });
    const run = await fetchNewsSource(env.ctx, sources['Mixmag (test)'], { io });
    assert.deepEqual([run.added, run.updated], [0, 1]);
    assert.equal((await env.as().get('/news?topic=festival')).body.items.find((i: { title: string }) => i.title.startsWith('Tomorrowland')).digest, null);
    assert.equal(await jobs.digestNews(env.ctx), 1);
  });

  it('lets the team hide a headline, read a feed now, switch a publication off, and never shows a hidden or switched-off one', async () => {
    const items = (await env.as(admin).get(`/admin/news/items?source=${sources['Mixmag (test)']}`)).body;
    assert.equal(items.total, 3);
    const vina = items.items.find((i: { title: string }) => i.title.startsWith('Vinahouse'));
    assert.equal((await env.as(admin).post(`/admin/news/items/${vina.id}/hide`)).body.hidden, true);
    assert.equal((await env.as().get('/news')).body.total, 5);
    assert.equal((await env.as(admin).get('/admin/news/items?hidden=1')).body.total, 1);
    assert.equal((await env.as(admin).post(`/admin/news/items/${vina.id}/show`)).body.hidden, false);
    assert.equal((await env.as().get('/news')).body.total, 6);
    const run = (await env.as(admin).post(`/admin/news/sources/${sources['DJ TechTools (test)']}/run`)).body;
    assert.deepEqual([run.run.fetched, run.run.added, run.source.lastError], [2, 0, null]);
    assert.equal((await env.as(admin).patch(`/admin/news/sources/${sources['Vietcetera (test)']}`, { enabled: false })).body.enabled, false);
    assert.equal((await env.as().get('/news')).body.total, 5);
    assert.equal((await env.as(admin).patch(`/admin/news/sources/${sources['Vietcetera (test)']}`, { enabled: true })).body.enabled, true);
    // A feed that does not answer: the source says so and waits its interval.
    const broken = (await env.as(admin).post('/admin/news/sources', { name: 'Gone', siteUrl: 'https://gone.example/', feedUrl: 'https://gone.example/feed' })).body;
    const failed = (await env.as(admin).post(`/admin/news/sources/${broken.id}/run`)).body;
    assert.match(failed.source.lastError, /404/);
    assert.ok(new Date(failed.source.nextRunAt) > env.clock.now());
    assert.equal((await env.as(admin).post(`/admin/news/items/00000000-0000-0000-0000-000000000000/hide`)).status, 404);
  });

  it('purges headlines older than six months', async () => {
    const old = new Date(env.clock.now().getTime() - (KEEP_DAYS + 1) * 24 * 3600_000);
    await env.ctx.db.query(`insert into news_items (source_id, guid, url, title, published_at) values ($1, 'old-1', 'https://mixmag.example/old', 'Old', $2)`, [sources['Mixmag (test)'], old]);
    assert.equal((await env.as().get('/news')).body.total, 7);
    await jobs.fetchNews(env.ctx);
    assert.equal((await env.as().get('/news')).body.total, 6);
  });
});
