import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';
import { multipart } from './files.ts';
import { many, one } from '../src/db/index.ts';
import { IMG_SHAPES, IMG_WIDTHS, imgHeight, imgKey, isImgBox, linkOfKey, upstreamFor } from '../src/lib/remote-image.ts';
import { fakeImageFull, PICTURE_COLUMNS, type ImageFetcher } from '../src/services/remote-images.ts';
import { vnDate } from '../src/lib/time.ts';

/** A real picture of w×h, as a host would send it. */
const picture = (w: number, h: number, g = 40) =>
  sharp({ create: { width: w, height: h, channels: 3, background: { r: 200, g, b: 90 } } }).png().toBuffer();

/**
 * The whole-file network of these tests: every link is a 1600×1000 PNG (or ?w=&h=), except a
 * link with "broken" in it, which does not open, and one with "junk" in it, which is not a picture.
 */
const pictures = (hits: string[]): ImageFetcher => async (url) => {
  hits.push(url);
  if (/broken/.test(url)) throw new TypeError('fetch failed');
  const u = new URL(url);
  const bytes = /junk/.test(url) ? Buffer.from('<html>not a picture</html>')
    : /animated/.test(url) ? await sharp([await picture(300, 200), await picture(300, 200, 160)], { join: { animated: true } }).gif().toBuffer()
    : await picture(Number(u.searchParams.get('w') ?? 1600), Number(u.searchParams.get('h') ?? 1000));
  return { url, status: 200, contentType: 'image/png', bytes, totalBytes: bytes.length };
};

describe('the boxes and keys of /img, pure', () => {
  it('has a box for every width in every shape, with heights in whole pixels', () => {
    assert.equal(imgHeight(828, 'wide'), 466);
    assert.equal(imgHeight(1080, 'wide'), 608);
    assert.equal(imgHeight(828, 'card'), 518);
    assert.equal(imgHeight(1920, 'strip'), 480);
    for (const w of IMG_WIDTHS) for (const s of Object.keys(IMG_SHAPES) as (keyof typeof IMG_SHAPES)[]) assert.ok(isImgBox(w, imgHeight(w, s)), `${w} ${s}`);
    for (const [w, h] of [[200, 200], [9999, 1], [192, 100], [828, 465], [0, 0]]) assert.equal(isImgBox(w, h), false, `${w}x${h}`);
  });

  it('keys a link without its framing, and reads back only a key it made', () => {
    const link = 'https://pics.example/a b/ảnh.jpg?x=1&y=2';
    assert.equal(imgKey(link + '#ff=30,40,2'), imgKey(link));
    assert.equal(linkOfKey(imgKey(link)), link);
    assert.equal(linkOfKey(Buffer.from(link + '#ff=30,40,2').toString('base64url')), null, 'a fragment is the screen’s, never in the key');
    assert.equal(linkOfKey(Buffer.from(link).toString('base64') + '='), null);
    assert.equal(linkOfKey('a'), null, 'not the base64url of anything');
  });

  it('asks a host that resizes for a smaller copy, never a bigger one', () => {
    const wiki = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Crowd.jpg/1920px-Crowd.jpg';
    assert.equal(upstreamFor(wiki, 480), 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Crowd.jpg/500px-Crowd.jpg');
    assert.equal(upstreamFor(wiki, 640), 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Crowd.jpg/960px-Crowd.jpg');
    assert.equal(upstreamFor(wiki, 2160), null, 'no step above the box');
    assert.equal(upstreamFor(wiki.replace('1920px', '400px'), 480), null, 'never above the linked size');
    assert.equal(upstreamFor('https://upload.wikimedia.org/wikipedia/commons/a/ab/Crowd.jpg', 480), null, 'an original is fetched as it is');
    assert.equal(upstreamFor('https://images.microcms-assets.io/assets/x/y/cover.jpg', 384), 'https://images.microcms-assets.io/assets/x/y/cover.jpg?w=384&fit=max&fm=webp');
    assert.equal(upstreamFor('https://images.microcms-assets.io/assets/x/y/cover.jpg?w=100', 384), null, 'a link that already asks for a size');
    assert.equal(upstreamFor('https://i.pinimg.com/originals/aa/bb/cc.jpg', 384), 'https://i.pinimg.com/736x/aa/bb/cc.jpg');
    assert.equal(upstreamFor('https://i.pinimg.com/originals/aa/bb/cc.jpg', 1080), null);
    assert.equal(upstreamFor('https://media.megatix.com.au/cover.jpg', 384), null);
  });

  it('the screen tests’ network gives a real picture at pics.example only', async () => {
    const got = await fakeImageFull('https://pics.example/cover.jpg?w=320&h=200');
    const meta = await sharp(got.bytes).metadata();
    assert.deepEqual([meta.width, meta.height], [320, 200]);
    await assert.rejects(fakeImageFull('https://covers.example/cover.jpg'));
    await assert.rejects(fakeImageFull('https://pics.example/broken.jpg'));
  });
});

describe('GET /img', () => {
  let env: TestEnv;
  const hits: string[] = [];
  const cover = 'https://pics.example/ravo-cover.jpg';
  const img = async (link: string, box: string, headers: Record<string, string> = {}) => {
    const res = await env.app.inject({ method: 'GET', url: `/img/${box}/${imgKey(link)}.webp`, headers });
    return { status: res.statusCode, headers: res.headers, body: res.rawPayload };
  };
  const sizeOf = async (webp: Buffer) => { const m = await sharp(webp).metadata(); return [m.format, m.width, m.height]; };

  before(async () => {
    env = await setup({ fetchImageFull: pictures(hits) });
    // The framing travels in the stored link; the key names the picture without it.
    await env.ctx.db.query(`update events set cover_url = $1 where id = $2`, [cover + '#ff=30,40,2', env.ids.event.ravo]);
  });
  after(async () => { await env.close(); });

  it('resizes a stored cover to cover the box, as WebP kept for a year, never enlarged', async () => {
    const res = await img(cover, '192x192');
    assert.equal(res.status, 200, res.body.toString());
    assert.equal(res.headers['content-type'], 'image/webp');
    assert.equal(res.headers['cache-control'], 'public, max-age=31536000, s-maxage=31536000, immutable');
    assert.equal(res.headers['cdn-cache-control'], 'public, max-age=31536000, immutable', 'for the CDN in front of the web app too');
    assert.match(String(res.headers.etag), /^"[0-9a-f]{32}"$/);
    assert.equal(res.headers['set-cookie'], undefined);
    assert.deepEqual(await sizeOf(res.body), ['webp', 307, 192], 'the shorter side fills the box, nothing cropped');
    assert.deepEqual(await sizeOf((await img(cover, '828x518')).body), ['webp', 829, 518]);
    assert.deepEqual(await sizeOf((await img(cover, '96x24')).body), ['webp', 96, 60]);
    assert.deepEqual(await sizeOf((await img(cover, '1920x1080')).body), ['webp', 1600, 1000], 'a 1600×1000 source is never enlarged');
    assert.equal((await img(cover, '192x192', { 'if-none-match': String(res.headers.etag) })).status, 304);
  });

  it('turns away a box off the ladder, a key it does not make, and a link that is neither https nor an upload', async () => {
    for (const box of ['200x200', '9999x1', '192x100', '192x192x2']) assert.equal((await img(cover, box)).status, 400, box);
    const call = (url: string) => env.app.inject({ method: 'GET', url });
    assert.equal((await call(`/img/192x192/${Buffer.from(cover + '#ff=30,40,2').toString('base64url')}.webp`)).statusCode, 400, 'the framing is never in the key');
    assert.equal((await call(`/img/192x192/${imgKey(cover)}.png`)).statusCode, 400);
    assert.equal((await call('/img/192x192/!!.webp')).statusCode, 400);
    await env.ctx.db.query(`update users set photo_url = 'http://pics.example/plain.jpg' where email = 'minh@example.com'`);
    assert.equal((await img('http://pics.example/plain.jpg', '192x192')).status, 400);
    const query = await call(`/img/192x192/${imgKey(cover)}.webp?v=2`);
    assert.equal(query.statusCode, 301, 'a query would only make the CDN keep another copy');
    assert.equal(query.headers.location, `/img/192x192/${imgKey(cover)}.webp`);
  });

  it('never fetches a link no page shows', async () => {
    const before = hits.length;
    const res = await img('https://pics.example/nobody-stores-this.jpg', '192x192');
    assert.equal(res.status, 404);
    assert.equal(res.headers['cache-control'], 'public, max-age=300, s-maxage=300');
    assert.equal(res.headers['cdn-cache-control'], 'public, max-age=300');
    assert.equal(hits.length, before, 'nothing fetched');
  });

  it('sends the browser to the link itself when it does not open, is not a picture, or moves', async () => {
    const events = [env.ids.event['ravo-warmup'], env.ids.event['ravo-after-hours']];
    const links = ['https://pics.example/broken-cover.jpg', 'https://pics.example/junk-cover.jpg'];
    for (const [i, link] of links.entries()) {
      await env.ctx.db.query(`update events set cover_url = $1 where id = $2`, [link, events[i]]);
      const res = await img(link, '384x240');
      assert.equal(res.status, 302, link);
      assert.equal(res.headers.location, link);
      assert.equal(res.headers['cache-control'], 'public, max-age=600, s-maxage=600');
    }
    const animated = 'https://pics.example/animated-logo.gif';
    await env.ctx.db.query(`update organizers set logo_url = $1 where id = (select organizer_id from events where id = $2)`, [animated, env.ids.event.ravo]);
    assert.equal((await img(animated, '192x192')).status, 302, 'an animated picture keeps moving, from its host');
  });

  it('serves an upload from storage, by its path or its full address', async () => {
    const mp = multipart(await picture(1600, 900), 'cover.png');
    const token = await env.attendee();
    const up = await env.app.inject({ method: 'POST', url: '/uploads?purpose=cover', payload: mp.payload, headers: { 'content-type': mp.type, authorization: `Bearer ${token}` } });
    assert.equal(up.statusCode, 201, up.body);
    const url: string = up.json().url;
    const path = url.slice(url.indexOf('/files/'));
    const before = hits.length;
    for (const link of [url, path]) {
      const res = await img(link, '640x360');
      assert.equal(res.status, 200, link);
      assert.deepEqual(await sizeOf(res.body), ['webp', 640, 360]);
    }
    assert.equal(hits.length, before, 'read from storage, not fetched');
    assert.equal((await img('/files/cover/ab/' + 'a'.repeat(64) + '.png', '640x360')).status, 404, 'an upload nobody made');
  });

  it('knows a picture that is only in a post’s body, and only as a whole link', async () => {
    const body = 'Intro.\n\n![The crowd](https://pics.example/body-only.jpg "At the gate")\n\n![Booth](https://pics.example/booth.jpg)';
    await env.ctx.db.query(
      `insert into blog_posts (slug, byline, category, title, body, status, published_at) values ('img-body-test', 'FeestFinder', 'styles', $1, $2, 'published', now())`,
      [{ en: 'Body', vi: 'Body' }, { en: body, vi: '' }]);
    assert.equal((await img('https://pics.example/body-only.jpg', '828x466')).status, 200);
    assert.equal((await img('https://pics.example/booth.jpg', '828x466')).status, 200);
    assert.equal((await img('https://pics.example/body-only.jp', '828x466')).status, 404, 'a piece of a link is not a link');
    await env.ctx.db.query(`update blog_posts set status = 'hidden' where slug = 'img-body-test'`);
    assert.equal((await img('https://pics.example/booth.jpg', '828x466')).status, 404, 'a post the team hid shows nothing');
  });

  it('asks Wikimedia for a smaller step first, and the link itself when that fails', async () => {
    const wiki = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Crowd.jpg/1920px-Crowd.jpg';
    await env.ctx.db.query(`update artists set cover_url = $1 where name = 'SlimV'`, [wiki]);
    const from = hits.length;
    assert.equal((await img(wiki, '384x240')).status, 200);
    assert.deepEqual(hits.slice(from), [wiki.replace('1920px-', '500px-')]);
    const broken = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Booth.jpg/1920px-Booth.jpg';
    await env.ctx.db.query(`update artists set image_url = $1 where name = 'SlimV'`, [broken]);
    const fetcher = env.ctx.fetchImageFull;
    env.ctx.fetchImageFull = (url) => (url.includes('500px-') ? Promise.reject(new TypeError('fetch failed')) : fetcher(url));
    try {
      const at = hits.length;
      assert.equal((await img(broken, '384x240')).status, 200);
      assert.deepEqual(hits.slice(at), [broken], 'the step failed, the stored link answered');
    } finally {
      env.ctx.fetchImageFull = fetcher;
    }
  });

  it('reads no session and sets no cookie, so one copy serves everyone', async () => {
    const token = await emailUser(env, 'img.viewer@example.com');
    const user = await one<{ id: string }>(env.ctx.db, `select id from users where email = 'img.viewer@example.com'`);
    const activity = async () => (await many(env.ctx.db, 'select 1 from user_activity_days where user_id = $1 and day = $2', [user!.id, vnDate(env.clock.now())])).length;
    const res = await img(cover, '256x256', { cookie: `ff_session=${token}`, authorization: `Bearer ${token}` });
    assert.equal(res.status, 200);
    assert.equal(res.headers['set-cookie'], undefined);
    assert.equal(res.headers['cache-control'], 'public, max-age=31536000, s-maxage=31536000, immutable');
    assert.equal(await activity(), 0, 'the session was never looked up');
    await env.as(token).get('/auth/session');
    assert.equal(await activity(), 1, 'any other request does');
  });

  it('knows every column that holds a picture link', async () => {
    const cols = await many<{ table_name: string; column_name: string }>(env.ctx.db,
      `select table_name, column_name from information_schema.columns
        where table_schema = 'public' and (column_name ~ '(cover|image|logo|photo|thumbnail)_urls?$' or column_name ~ 'images$')`);
    const known = new Set(PICTURE_COLUMNS.flatMap((t) => [...t.columns, ...(t.lists ?? [])].map((c) => `${t.table}.${c}`)));
    const missing = cols.map((c) => `${c.table_name}.${c.column_name}`).filter((c) => !known.has(c));
    assert.deepEqual(missing, [], 'add these to PICTURE_COLUMNS (services/remote-images.ts)');
    assert.ok(cols.length >= 15, 'the query found the picture columns');
  });
});
