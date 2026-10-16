import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';
import { fakeImages, multipart, png } from './files.ts';
import { many, one } from '../src/db/index.ts';
import { normalizeImageUrl, previewImageOf } from '../src/lib/remote-image.ts';
import { webImageInfo } from '../src/lib/image.ts';
import { checkRemoteImages } from '../src/services/remote-images.ts';

const code = (fn: () => unknown) => {
  try { fn(); return null; } catch (e) { return (e as { code?: string }).code ?? 'thrown'; }
};

describe('image links, pure', () => {
  it('takes https links only, never a bare IP, a private name, credentials or a port', () => {
    assert.equal(normalizeImageUrl(' https://i.imgur.com/abc.jpg#x '), 'https://i.imgur.com/abc.jpg');
    for (const bad of ['http://i.imgur.com/a.jpg', 'https://127.0.0.1/a.png', 'https://[::1]/a.png', 'https://user:pw@x.com/a.png',
      'https://x.com:8443/a.png', 'https://intranet/a.png', 'https://box.local/a.png', 'ftp://x.com/a.png', 'not a link']) {
      assert.equal(code(() => normalizeImageUrl(bad)), 'invalid_image_link', bad);
    }
  });

  it('refuses addresses that expire, and FeestFinder’s own uploads', () => {
    assert.equal(code(() => normalizeImageUrl('https://scontent-sin6-1.xx.fbcdn.net/v/t39/1.jpg')), 'image_link_expires');
    assert.equal(code(() => normalizeImageUrl('https://p16-sign.tiktokcdn.com/a.jpeg')), 'image_link_expires');
    assert.equal(code(() => normalizeImageUrl('https://bucket.s3.amazonaws.com/a.jpg?X-Amz-Signature=abc')), 'image_link_expires');
    assert.equal(code(() => normalizeImageUrl('/files/avatar/ab/' + 'a'.repeat(64) + '.jpg')), 'upload_not_allowed');
    assert.equal(code(() => normalizeImageUrl('https://feestfinder.com/files/x.png', ['feestfinder.com'])), 'upload_not_allowed');
  });

  it('turns share pages into the file itself', () => {
    assert.equal(normalizeImageUrl('https://www.dropbox.com/scl/fi/abc/photo.jpg?rlkey=k&dl=0'), 'https://www.dropbox.com/scl/fi/abc/photo.jpg?rlkey=k&raw=1');
    assert.equal(normalizeImageUrl('https://github.com/ff/brand/blob/main/logo.png'), 'https://raw.githubusercontent.com/ff/brand/main/logo.png');
    assert.equal(normalizeImageUrl('https://drive.google.com/file/d/1AbCdEfGhIjKlMn/view?usp=sharing'), 'https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMn&sz=w2000');
  });

  it('reads a page’s preview picture, made absolute', () => {
    assert.equal(previewImageOf('<meta content="/a.jpg" property="og:image">', 'https://site.test/p/1'), 'https://site.test/a.jpg');
    assert.equal(previewImageOf('<meta name="twitter:image" content="https://cdn.test/b.png?x=1&amp;y=2">', 'https://site.test/'), 'https://cdn.test/b.png?x=1&y=2');
    assert.equal(previewImageOf('<title>none</title>', 'https://site.test/'), null);
  });

  it('reads GIF and AVIF sizes as well as PNG, JPEG and WebP', () => {
    const gif = Buffer.alloc(16); gif.write('GIF89a', 0, 'ascii'); gif.writeUInt16LE(640, 6); gif.writeUInt16LE(480, 8);
    assert.deepEqual(webImageInfo(gif), { mime: 'image/gif', width: 640, height: 480 });
    const avif = Buffer.alloc(64); avif.writeUInt32BE(32, 0); avif.write('ftypavif', 4, 'ascii'); avif.write('ispe', 40, 'ascii');
    avif.writeUInt32BE(1920, 48); avif.writeUInt32BE(1080, 52);
    assert.deepEqual(webImageInfo(avif), { mime: 'image/avif', width: 1920, height: 1080 });
    assert.deepEqual(webImageInfo(png(10, 20)), { mime: 'image/png', width: 10, height: 20 });
  });
});

describe('image links, through the API', () => {
  let env: TestEnv;
  let owner: string;
  const hits: string[] = [];
  before(async () => {
    env = await setup({ fetchImage: fakeImages(hits) });
    owner = await emailUser(env, 'photo.owner@example.com');
    await env.as(owner).post('/me/roles/artist', { stageName: 'Ánh Đèn', roles: ['dj'], basedCity: 'ha-noi', styles: ['techno'] });
  });
  after(async () => { await env.close(); });

  it('checks a pasted link for the screens, and does not fetch it again the same day', async () => {
    assert.equal((await env.as().post('/images/check', { url: 'https://img.test/a.png', purpose: 'avatar' })).status, 401);
    const first = await env.as(owner).post('/images/check', { url: 'https://img.test/a.png?w=800&h=800', purpose: 'avatar' });
    assert.equal(first.status, 200, JSON.stringify(first.body));
    assert.deepEqual(first.body, { url: 'https://img.test/a.png?w=800&h=800', width: 800, height: 800, mime: 'image/png' });
    const before = hits.length;
    await env.as(owner).post('/images/check', { url: 'https://img.test/a.png?w=800&h=800', purpose: 'avatar' });
    assert.equal(hits.length, before, 'served from what the first check found');
    const tooSmall = await env.as(owner).post('/images/check', { url: 'https://img.test/a.png?w=800&h=800', purpose: 'profile_cover' });
    assert.equal(tooSmall.body.error.code, 'cover_size', 'the same picture is too narrow for a cover');
    const heavy = await env.as(owner).post('/images/check', { url: 'https://img.test/heavy.png?bytes=20000000', purpose: 'avatar' });
    assert.equal(heavy.body.error.code, 'image_too_heavy');
    const notImage = await env.as(owner).post('/images/check', { url: 'https://page.test/empty', purpose: 'avatar' });
    assert.equal(notImage.body.error.code, 'not_an_image');
  });

  it('saves an artist’s photo and cover as links; a picture uploaded before still saves unchanged', async () => {
    const saved = await env.as(owner).patch('/me/artist', { imageUrl: 'https://img.test/me.png?w=600&h=600', coverUrl: 'https://img.test/cover.png?w=1800&h=600' });
    assert.equal(saved.status, 200, JSON.stringify(saved.body));
    assert.equal(saved.body.profile.imageUrl, 'https://img.test/me.png?w=600&h=600');
    assert.equal((await env.as(owner).patch('/me/artist', { coverUrl: 'https://img.test/tall.png?w=1200&h=1600' })).body.error.code, 'cover_size');
    assert.equal((await env.as(owner).patch('/me/artist', { imageUrl: '/files/avatar/ab/' + 'a'.repeat(64) + '.jpg' })).body.error.code, 'upload_not_allowed');

    // An upload from before links were the rule: the form sends it back unchanged with the rest.
    const legacy = '/files/avatar/ab/' + 'b'.repeat(64) + '.jpg';
    await env.ctx.db.query(`update artists set image_url = $1 where slug = 'anh-den'`, [legacy]);
    const again = await env.as(owner).patch('/me/artist', { imageUrl: legacy, bio: { en: 'Techno', vi: 'Techno' } });
    assert.equal(again.status, 200, JSON.stringify(again.body));
    assert.equal(again.body.profile.imageUrl, legacy);
    assert.equal((await env.as(owner).patch('/me/artist', { imageUrl: null })).body.profile.imageUrl, null);
  });

  it('takes no new avatar or moment uploads, but still takes an event’s cover', async () => {
    for (const purpose of ['avatar', 'moment']) {
      const mp = multipart(png(1600, 900), 'x.png');
      const res = await env.app.inject({ method: 'POST', url: `/uploads?purpose=${purpose}`, payload: mp.payload, headers: { 'content-type': mp.type, authorization: `Bearer ${owner}` } });
      assert.equal(res.json().error.code, 'upload_not_allowed', purpose);
    }
    const mp = multipart(png(1600, 900), 'cover.png');
    const cover = await env.app.inject({ method: 'POST', url: '/uploads?purpose=cover', payload: mp.payload, headers: { 'content-type': mp.type, authorization: `Bearer ${owner}` } });
    assert.equal(cover.statusCode, 201, cover.body);
  });

  it('a person’s photo is a checked link too', async () => {
    const r = await env.as(owner).patch('/me', { photoUrl: 'https://img.test/face.png?w=400&h=400' });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal((await env.as(owner).patch('/me', { photoUrl: 'https://img.test/tiny.png?w=50&h=50' })).body.error.code, 'avatar_size');
  });

  it('checks saved links every week; three failures in a row mark one broken and tell its owner, once', async () => {
    const monthAgo = () => new Date(env.clock.now().getTime() - 30 * 24 * 3600_000);
    const url = 'https://img.test/fading.png?w=600&h=600';
    assert.equal((await env.as(owner).patch('/me/artist', { imageUrl: url })).status, 200);
    const userId = (await one<{ owner_user_id: string }>(env.ctx.db, `select owner_user_id from artists where slug = 'anh-den'`))!.owner_user_id;
    // The host starts failing (the fake network refuses any link with "broken" in it).
    const dead = url.replace('fading', 'broken');
    await env.ctx.db.query(`update remote_images set url = $2 where url = $1`, [url, dead]);
    await env.ctx.db.query(`update artists set image_url = $2 where image_url = $1`, [url, dead]);
    for (let i = 0; i < 3; i++) {
      await env.ctx.db.query(`update remote_images set checked_at = $2 where url = $1`, [dead, monthAgo()]);
      await checkRemoteImages(env.ctx);
    }
    const row = await one<{ status: string; fail_count: number }>(env.ctx.db, 'select status, fail_count from remote_images where url = $1', [dead]);
    assert.deepEqual(row, { status: 'broken', fail_count: 3 });
    const notes = await many<{ kind: string; link: any }>(env.ctx.db, `select kind, link from notifications where user_id = $1 and kind = 'broken_image'`, [userId]);
    assert.equal(notes.length, 1);
    assert.equal(notes[0].link.url, '/studio/artist');
    // A link that still opens is just stamped again.
    await env.ctx.db.query(`update remote_images set checked_at = $1 where url = 'https://img.test/me.png?w=600&h=600'`, [monthAgo()]);
    await checkRemoteImages(env.ctx);
    assert.equal((await one<{ status: string }>(env.ctx.db, `select status from remote_images where url = 'https://img.test/me.png?w=600&h=600'`))!.status, 'ok');
  });
});
