import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { phoneUser } from './people.ts';
import { multipart, png } from './files.ts';

describe('the night and after', () => {
  let env: TestEnv;
  let minh: string;
  let organizer: string;
  before(async () => {
    env = await setup();
    [minh, organizer] = await Promise.all([env.attendee(), env.organizer()]);
  });
  after(async () => { await env.close(); });

  it('sends the organiser’s live updates to everyone with a ticket', async () => {
    const ravo = env.ids.event.ravo;
    const listed = await env.as().get('/events/ravo/updates');
    assert.match(listed.body.items[0].body, /Cổng số 3/);
    const post = await env.as(organizer).post(`/organizer/events/${ravo}/updates`, { kind: 'delay', body: 'Set Hoaprox lùi 15 phút, bắt đầu lúc 20:15.' });
    assert.equal(post.status, 201);
    assert.ok(post.body.reached > 0);
    const bell = await env.as(minh).get('/me/notifications');
    assert.ok(bell.body.items.some((n: any) => n.kind === 'event_update' && /20:15/.test(n.body.vi)));
    const detail = await env.as().get('/events/ravo');
    assert.equal(detail.body.updates[0].kindLabel.vi, 'Đổi giờ');
    assert.equal((await env.as(minh).post(`/organizer/events/${ravo}/updates`, { body: 'Not mine to post' })).status, 403);
    const quiet = await env.as(organizer).post(`/organizer/events/${ravo}/updates`, { kind: 'info', body: 'Khu ăn uống mở thêm hai quầy.', notify: false });
    assert.equal(quiet.body.update.notified, false);
    const removed = await env.as(organizer).delete(`/organizer/events/${ravo}/updates/${quiet.body.update.id}`);
    assert.equal(removed.status, 200);
  });

  it('puts memory photos on the event’s photo wall', async () => {
    const ravo = env.ids.event.ravo;
    const mp = multipart(png(1200, 900), 'night.png');
    const up = await env.app.inject({ method: 'POST', url: '/uploads?purpose=recap', payload: mp.payload, headers: { 'content-type': mp.type, authorization: `Bearer ${minh}` } });
    assert.equal(up.statusCode, 201, up.body);
    const url = up.json().url;
    env.clock.set('2026-09-19T21:00:00+07:00');
    try {
      const other = await phoneUser(env, '0915 000 222');
      assert.equal((await env.as(other).post(`/events/${ravo}/posts`, { kind: 'memory', body: 'Ảnh của người khác', photoUrl: url })).body.error.code, 'photo_unknown');
      const post = await env.as(minh).post(`/events/${ravo}/posts`, { kind: 'memory', body: 'Khoảnh khắc drop đầu tiên', photoUrl: url });
      assert.equal(post.status, 201);
      assert.equal(post.body.post.photoUrl, url);
      const wall = await env.as().get('/events/ravo/photos');
      assert.equal(wall.body.items[0].url, url);
      assert.equal(wall.body.items[0].caption, 'Khoảnh khắc drop đầu tiên');
    } finally { env.clock.set('2026-09-14T10:00:00+07:00'); }
  });

  it('stamps a raver passport for every night someone was there', async () => {
    const p = await env.as(minh).get('/me/passport');
    assert.equal(p.status, 200);
    assert.equal(p.body.stats.nights, 5);
    assert.deepEqual(p.body.stamps.map((s: any) => s.slug), ['bside-acoustic-2', 'bside-acoustic-1', '8wonder-winter', 'momang-2025', 'ravo-2025']);
    const earned = p.body.badges.filter((b: any) => b.earned).map((b: any) => b.key);
    assert.deepEqual(earned, ['first', 'five', 'hopper', 'afterdark']);
    assert.equal((await env.as().get('/me/passport')).status, 401);
  });

  it('wraps up the year', async () => {
    const y2025 = await env.as(minh).get('/me/wrapped?year=2025');
    assert.equal(y2025.body.nights, 3);
    assert.equal(y2025.body.first.title, 'Ravolution Music Festival 2025');
    assert.equal(y2025.body.latestNight.until, '02:00');
    const y2026 = await env.as(minh).get('/me/wrapped');
    assert.equal(y2026.body.year, 2026);
    assert.equal(y2026.body.topGenre.genre, 'Indie');
    assert.equal(y2026.body.topVenue.times, 2);
    assert.ok(y2026.body.hypes >= 0);
    const empty = await env.as(minh).get('/me/wrapped?year=2024');
    assert.equal(empty.body.empty, true);
  });
});
