import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { setup, type TestEnv } from './helpers.ts';
import { many, one } from '../src/db/index.ts';
import { imgKey } from '../src/lib/remote-image.ts';
import { loadConfig } from '../src/config.ts';
import { imgTag, type ImageFetcher } from '../src/services/remote-images.ts';
import { imageCdnFrom, PURGE_BATCH, purgeTakedowns, runImageCdn, warmCovers, warmPaths } from '../src/services/image-cdn.ts';
import { jobs } from '../src/jobs.ts';

/** Every link is a 1600×1000 PNG. */
const pictures: ImageFetcher = async (url) => {
  const bytes = await sharp({ create: { width: 1600, height: 1000, channels: 3, background: { r: 30, g: 90, b: 160 } } }).png().toBuffer();
  return { url, status: 200, contentType: 'image/png', bytes, totalBytes: bytes.length };
};

describe('the CDN copies of /img: takedown and warming', () => {
  let env: TestEnv;
  let purged: string[][] = [];
  let warmed: string[] = [];
  let failPurge = false;
  const img = (link: string, box = '640x360') => env.app.inject({ method: 'GET', url: `/img/${box}/${imgKey(link)}.webp` });
  const queued = async (table: 'img_purges' | 'img_warms') => (await many<{ link: string }>(env.ctx.db, `select link from ${table} order by link`)).map((r) => r.link);

  before(async () => {
    env = await setup({ fetchImageFull: pictures });
    env.ctx.imageCdn = {
      purge: async (tags) => { if (failPurge) throw new Error('Vercel said no'); purged.push(tags); },
      warm: async (path) => { warmed.push(path); },
    };
  });
  beforeEach(async () => {
    // The seed's own writes queued their pictures: each test starts from empty queues.
    await env.ctx.db.query('delete from img_purges');
    await env.ctx.db.query('delete from img_warms');
    purged = [];
    warmed = [];
    failPurge = false;
  });
  after(async () => { await env.close(); });

  it('tags every copy with its picture, the same at every size and for every spelling of an upload', async () => {
    const cover = 'https://pics.example/tagged.jpg';
    await env.ctx.db.query(`update events set cover_url = $1 where id = $2`, [cover + '#ff=20,30,1', env.ids.event.ravo]);
    const a = await img(cover, '640x360');
    const b = await img(cover, '96x96');
    assert.equal(a.statusCode, 200);
    assert.equal(a.headers['vercel-cache-tag'], imgTag(env.ctx, cover));
    assert.equal(b.headers['vercel-cache-tag'], a.headers['vercel-cache-tag']);
    assert.match(String(a.headers['vercel-cache-tag']), /^img-[0-9a-f]{32}$/, 'no comma, far within 256 bytes');
    assert.equal((await img('https://pics.example/nobody.jpg')).headers['vercel-cache-tag'], imgTag(env.ctx, 'https://pics.example/nobody.jpg'), 'a miss the CDN keeps five minutes too');
    const key = 'cover/ab/' + 'b'.repeat(64) + '.png';
    assert.equal(imgTag(env.ctx, `/files/${key}`), imgTag(env.ctx, `http://test.local/files/${key}`));
  });

  it('purges a cover replaced, a profile hidden and a comment hidden once no row shows them, and nothing else', async () => {
    const old = 'https://pics.example/old-cover.jpg';
    const shared = 'https://pics.example/shared-cover.jpg';
    const photo = 'https://pics.example/artist-photo.jpg';
    const [ravo, warmup, after] = [env.ids.event.ravo, env.ids.event['ravo-warmup'], env.ids.event['ravo-after-hours']];
    await env.ctx.db.query(`update events set cover_url = $1 where id = $2`, [old + '#ff=10,10,1', ravo]);
    await env.ctx.db.query(`update events set cover_url = $1 where id = any($2::uuid[])`, [shared, [warmup, after]]);
    await env.ctx.db.query(`update artists set image_url = $1 where name = 'SlimV'`, [photo]);
    await env.ctx.db.query('delete from img_purges');

    // A new framing of the same picture is not a takedown.
    await env.ctx.db.query(`update events set cover_url = $1 where id = $2`, [old + '#ff=60,40,2', ravo]);
    assert.deepEqual(await queued('img_purges'), []);

    await env.ctx.db.query(`update events set cover_url = 'https://pics.example/new-cover.jpg' where id = $1`, [ravo]);
    await env.ctx.db.query(`update events set cover_url = null where id = $1`, [warmup]);
    await env.ctx.db.query(`update artists set hidden_at = now() where name = 'SlimV'`);
    assert.deepEqual(await queued('img_purges'), [photo, old, shared].sort());

    const r = await purgeTakedowns(env.ctx);
    assert.deepEqual(r, { purged: 2, kept: 1 }, 'the shared cover is still on another night');
    assert.deepEqual(purged.flat().sort(), [imgTag(env.ctx, old), imgTag(env.ctx, photo)].sort());
    assert.deepEqual(await queued('img_purges'), []);
    // And the origin no longer makes them, at any size.
    assert.equal((await img(old, '828x466')).statusCode, 404);
    assert.equal((await img(photo, '192x192')).statusCode, 404);
    assert.equal((await img(shared, '828x466')).statusCode, 200);
    await env.ctx.db.query(`update artists set hidden_at = null where name = 'SlimV'`);
  });

  it('purges what the team takes down through the API, and a deleted row’s pictures', async () => {
    const admin = await env.admin();
    const artist = await one<{ id: string }>(env.ctx.db, `select id from artists where name = 'Kreo'`);
    const photo = 'https://pics.example/kreo.jpg';
    await env.ctx.db.query(`update artists set image_url = $1, hidden_at = null where id = $2`, [photo, artist!.id]);
    await env.ctx.db.query('delete from img_purges');
    const hide = await env.as(admin).patch(`/admin/artists/${artist!.id}`, { hidden: true });
    assert.equal(hide.status, 200, JSON.stringify(hide.body));
    assert.deepEqual(await queued('img_purges'), [photo]);

    const thumb = 'https://pics.example/mix-thumb.jpg';
    const mix = await one<{ id: string }>(env.ctx.db,
      `insert into artist_mixes (artist_id, provider, kind, url, embed_src, title, thumbnail_url, created_by)
       values ($1, 'soundcloud', 'track', 'https://soundcloud.com/kreo/set', 'https://w.soundcloud.com/player/?url=x', 'Set', $2, (select id from users where email = 'minh@example.com')) returning id`,
      [artist!.id, thumb]);
    await env.ctx.db.query('delete from artist_mixes where id = $1', [mix!.id]);
    assert.deepEqual(await queued('img_purges'), [thumb, photo].sort());
    await purgeTakedowns(env.ctx);
    assert.deepEqual(purged.flat().sort(), [imgTag(env.ctx, photo), imgTag(env.ctx, thumb)].sort());
    await env.ctx.db.query(`update artists set hidden_at = null where id = $1`, [artist!.id]);
  });

  it('reads a list of links and a post’s body: a picture dropped from either is purged', async () => {
    const [a, b] = ['https://pics.example/recap-a.jpg', 'https://pics.example/recap-b.jpg'];
    const recap = await one<{ id: string }>(env.ctx.db,
      `insert into recaps (user_id, event_id, stars, photo_urls) values ((select id from users where email = 'minh@example.com'), $1, 5, $2) returning id`,
      [env.ids.event.ravo, [a, b + '#ff=50,50,1']]);
    await env.ctx.db.query('delete from img_purges');
    await env.ctx.db.query(`update recaps set photo_urls = $1 where id = $2`, [[a], recap!.id]);
    assert.deepEqual(await queued('img_purges'), [b]);

    const body = 'Intro.\n\n![Crowd](https://pics.example/in-body.jpg "Gate")';
    await env.ctx.db.query(
      `insert into blog_posts (slug, byline, category, title, body, status, published_at) values ('cdn-body', 'FeestFinder', 'styles', $1, $2, 'published', now())`,
      [{ en: 'Body', vi: 'Body' }, { en: body, vi: '' }]);
    await env.ctx.db.query(`update blog_posts set status = 'hidden' where slug = 'cdn-body'`);
    assert.deepEqual(await queued('img_purges'), ['https://pics.example/in-body.jpg', b]);
  });

  it('puts the links back when Vercel refuses, and asks in batches Vercel takes', async () => {
    const links = Array.from({ length: PURGE_BATCH + 3 }, (_, i) => `https://pics.example/gone-${i}.jpg`);
    await env.ctx.db.query(`insert into img_purges (link) select unnest($1::text[])`, [links]);
    failPurge = true;
    assert.deepEqual(await purgeTakedowns(env.ctx), { purged: 0, kept: 0 });
    assert.equal((await queued('img_purges')).length, links.length, 'tried again next minute');
    failPurge = false;
    assert.deepEqual(await purgeTakedowns(env.ctx), { purged: links.length, kept: 0 });
    assert.deepEqual(purged.map((p) => p.length), [PURGE_BATCH, 3]);
  });

  it('warms a cover’s common sizes when its night is approved, and when its cover changes while live', async () => {
    const admin = await env.admin();
    const id = env.ids.event['neon-rooftop-session'];
    const cover = 'https://pics.example/neon-live.jpg';
    await env.ctx.db.query(`update events set cover_url = $1 where id = $2`, [cover + '#ff=40,40,1', id]);
    assert.deepEqual(await queued('img_warms'), [], 'not public yet: nobody would see it');
    await env.ctx.db.query('delete from img_purges');
    const ok = await env.as(admin).post('/admin/listings/approve', { ids: [id] });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    assert.deepEqual(await queued('img_warms'), [cover]);

    assert.equal(await warmCovers(env.ctx), warmPaths(cover).length);
    assert.deepEqual(warmed.sort(), warmPaths(cover).sort());
    assert.ok(warmed.includes(`/img/828x466/${imgKey(cover)}.webp`) && warmed.includes(`/img/640x360/${imgKey(cover)}.webp`), 'the eager hero');
    assert.ok(warmed.includes(`/img/384x240/${imgKey(cover)}.webp`), 'a card');
    assert.deepEqual(await queued('img_warms'), []);

    // Nothing to do for an edit that leaves the picture, or a new framing of it.
    await env.ctx.db.query(`update events set cover_url = $1, title = 'Neon' where id = $2`, [cover + '#ff=10,10,2', id]);
    assert.deepEqual(await queued('img_warms'), []);
    const next = 'https://pics.example/neon-new.jpg';
    await env.ctx.db.query(`update events set cover_url = $1 where id = $2`, [next, id]);
    assert.deepEqual(await queued('img_warms'), [next]);
    assert.deepEqual(await queued('img_purges'), [cover], 'and the old one goes');
  });

  it('runs both from the job every minute, never failing a write', async () => {
    const id = env.ids.event['underground-techno-w12'];
    await env.ctx.db.query(`update events set cover_url = 'https://pics.example/w12.jpg', status = 'live', published_at = now() where id = $1`, [id]);
    env.ctx.imageCdn!.warm = async (path) => { warmed.push(path); throw new Error('timeout'); };
    try {
      assert.equal(await warmCovers(env.ctx), 0, 'a warm that fails is only logged');
      assert.equal(warmed.length, warmPaths('x').length);
    } finally {
      env.ctx.imageCdn!.warm = async (path) => { warmed.push(path); };
    }
    await env.ctx.db.query('delete from img_purges');
    await env.ctx.db.query(`insert into img_purges (link) values ('https://pics.example/job-gone.jpg')`);
    assert.equal(await jobs.imageCdn(env.ctx), 1);
    assert.deepEqual(purged.flat(), [imgTag(env.ctx, 'https://pics.example/job-gone.jpg')]);
  });

  it('without a purger or a warmer (the tests, a laptop) empties the queues and asks nobody', async () => {
    const cdn = env.ctx.imageCdn;
    env.ctx.imageCdn = undefined;
    try {
      await env.ctx.db.query(`insert into img_purges (link) values ('https://pics.example/x.jpg')`);
      await env.ctx.db.query(`insert into img_warms (link) values ('https://pics.example/y.jpg')`);
      assert.equal(await runImageCdn(env.ctx), 0);
      assert.deepEqual([await queued('img_purges'), await queued('img_warms')], [[], []]);
    } finally {
      env.ctx.imageCdn = cdn;
    }
    assert.deepEqual([purged, warmed], [[], []]);
  });
});

describe('imageCdnFrom: what production asks Vercel and the public origin', () => {
  const realFetch = globalThis.fetch;
  const calls: { url: string; init?: RequestInit }[] = [];
  before(() => {
    globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(String(url).includes('api.vercel.com') ? '{}' : 'webp', { status: 200 });
    }) as typeof fetch;
  });
  after(() => { globalThis.fetch = realFetch; });

  it('is off in the tests and in development: nothing is purged or warmed', () => {
    const cdn = imageCdnFrom(loadConfig({ env: 'test', imgPurge: null, imgWarmOrigin: null }), () => {});
    assert.deepEqual([cdn.purge, cdn.warm], [null, null]);
  });

  it('deletes the tags in each project named, with the token, and warms through the public origin', async () => {
    const cdn = imageCdnFrom(loadConfig({ env: 'test', imgPurge: { token: 'test-token', teamId: 'team_123', projects: ['feestfinder-web'] }, imgWarmOrigin: 'https://feestfinder.com' }), () => {});
    await cdn.purge!(['img-aaa', 'img-bbb']);
    const purge = calls.find((c) => c.url.includes('api.vercel.com'))!;
    assert.equal(purge.url, 'https://api.vercel.com/v1/edge-cache/dangerously-delete-by-tags?projectIdOrName=feestfinder-web&teamId=team_123');
    assert.equal(purge.init!.method, 'POST');
    assert.equal((purge.init!.headers as Record<string, string>).authorization, 'Bearer test-token');
    assert.deepEqual(JSON.parse(purge.init!.body as string), { tags: ['img-aaa', 'img-bbb'] });
    await cdn.warm!('/img/828x466/abc.webp');
    assert.equal(calls.at(-1)!.url, 'https://feestfinder.com/img/828x466/abc.webp');
  });
});
