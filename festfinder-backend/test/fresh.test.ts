import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setup, type TestEnv } from './helpers.ts';
import { ensureAdmin } from '../src/bootstrap.ts';
import { hashPassword } from '../src/lib/crypto.ts';
import { DbStorage } from '../src/services/storage.ts';

/**
 * Production starts from the migrations alone: no demo events, organisers or accounts. Every
 * screen's reads have to answer there, and the first organiser, listing and decision have
 * to go through end to end.
 */
describe('a new, empty database', () => {
  let env: TestEnv;
  let admin: string;
  let attendee: string;
  let organizer: string;
  const password = 'a-long-password-1';
  const setPassword = async (email: string) => {
    await env.ctx.db.query('update users set password_hash = $2 where email = $1', [email, await hashPassword(password)]);
  };
  /** POST /uploads with a PNG of that size (only the header is read). */
  const upload = async (token: string, purpose: string, width: number, height: number) => {
    const png = Buffer.alloc(64);
    png.writeUInt32BE(0x89504e47, 0); png.write('IHDR', 12, 'ascii'); png.writeUInt32BE(width, 16); png.writeUInt32BE(height, 20);
    const boundary = 'ff-test-boundary';
    const payload = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${purpose}.png"\r\nContent-Type: image/png\r\n\r\n`),
      png, Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const res = await env.app.inject({
      method: 'POST', url: `/uploads?purpose=${purpose}`, payload,
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}`, authorization: `Bearer ${token}` },
    });
    assert.equal(res.statusCode, 201, res.body);
    return res.json() as { url: string };
  };
  /** Every path answers without a server error. */
  const readsAll = async (token: string | undefined, paths: string[]) => {
    for (const path of paths) {
      const r = await env.as(token).get(path);
      assert.ok(r.status < 500, `GET ${path} → ${r.status} ${JSON.stringify(r.body).slice(0, 300)}`);
    }
  };

  before(async () => {
    env = await setup({ seed: false });
    // What a deployment without object storage uses: the database itself.
    env.ctx.storage = new DbStorage(env.ctx.db);
    await ensureAdmin(env.ctx.db, 'owner@feestfinder.vn', () => {});
    await setPassword('owner@feestfinder.vn');
    admin = await env.login('owner@feestfinder.vn', password);
    await env.ctx.db.query(`insert into users (name, email, signup_method) values ('Lan', 'lan@example.vn', 'email')`);
    await setPassword('lan@example.vn');
    attendee = await env.login('lan@example.vn', password);
  });
  after(async () => { await env.close(); });

  it('has nothing from the demo data', async () => {
    const counts = (await env.ctx.db.query<any>(
      `select (select count(*)::int from events) as events, (select count(*)::int from organizers) as organizers, (select count(*)::int from venues) as venues`)).rows[0];
    assert.deepEqual(counts, { events: 0, organizers: 0, venues: 0 });
  });

  it('answers every public and attendee read', async () => {
    await readsAll(undefined, [
      '/health', '/events', '/events?time=all', '/events?time=tonight', '/events?time=month&price=free', '/events?q=nhac',
      '/events/map?bbox=106.6,10.7,106.8,10.9', '/explore/stats', '/explore/stats?view=venues', '/explore/stats?view=free',
      '/genres', '/artists', '/venues', '/shelves', '/ads?placement=feed', '/ads?placement=banner', '/ads?placement=live',
      '/seo/landing/vi/ho-chi-minh/this-weekend', '/seo/landing/en/ho-chi-minh/free/this-weekend', '/seo/landing/vi/ho-chi-minh/edm',
      '/seo/landing/vi/ho-chi-minh/2026-10', '/meta/form-options', '/push/public-key', `/events/${randomUUID()}`, '/organizers/nobody',
    ]);
    await readsAll(attendee, [
      '/auth/session', '/me', '/me/tickets', '/me/saves', '/me/hypes', '/me/going', '/me/friends', '/me/plans',
      '/me/notifications', '/me/notification-preferences', '/me/alert', '/me/follows', '/me/chats',
    ]);
  });

  it('answers every admin read', async () => {
    await readsAll(admin, [
      '/admin/counts', '/admin/overview', '/admin/queue', '/admin/queue?sort=risk', '/admin/reject-reasons', '/admin/appeals',
      '/admin/reports', '/admin/organizers', '/admin/shelves', '/admin/ads', '/admin/insights', '/admin/audit', '/admin/audit/verify',
      '/admin/audit.csv', '/admin/events', '/admin/events?when=upcoming', '/admin/events.csv', '/admin/venues', '/admin/users',
      '/admin/orders', '/admin/impersonation/options',
    ]);
  });

  it('onboards the first organiser and takes its first listing live', async () => {
    const created = await env.as(admin).post('/admin/organizers', { name: 'Saigon Sound', type: 'promoter', ownerEmail: 'hello@saigonsound.vn' });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    await setPassword('hello@saigonsound.vn');
    organizer = await env.login('hello@saigonsound.vn', password);
    await readsAll(organizer, [
      '/organizer/events', '/organizer/dashboard', '/organizer/dashboard?range=30d', '/organizer/audience', '/organizer/profile',
      '/organizer/inbox', '/organizer/notifications', '/organizer/notification-preferences',
    ]);

    // An upload is kept in the database and served from a path, and a listing takes that path.
    const cover = await upload(organizer, 'cover', 1600, 900);
    const logo = await upload(organizer, 'logo', 512, 512);
    assert.match(cover.url, /^\/files\/cover\/[0-9a-f]{2}\/[0-9a-f]{64}\.png$/);
    const served = await env.as().get(cover.url);
    assert.equal(served.status, 200);
    assert.match(String(served.headers['cache-control']), /s-maxage=31536000/);
    const draft = await env.as(organizer).post('/organizer/events', {
      title: 'Đêm nhạc bến Bạch Đằng', genre: 'Indie', startsOn: '2026-10-03', startTime: '19:00', endTime: '22:00',
      venueName: 'Bến Bạch Đằng', address: 'Tôn Đức Thắng, Quận 1', area: 'Quận 1', entryMode: 'free',
      logoUrl: logo.url, coverUrl: cover.url, eventUrl: 'https://saigonsound.vn/ben-bach-dang',
    });
    assert.equal(draft.status, 201, JSON.stringify(draft.body));
    const id = draft.body.id;
    const submitted = await env.as(organizer).post(`/organizer/events/${id}/submit`);
    assert.ok(submitted.status < 300, JSON.stringify(submitted.body));
    const queue = await env.as(admin).get('/admin/queue');
    assert.deepEqual(queue.body.items.map((q: any) => q.id), [id]);

    const approved = await env.as(admin).post('/admin/listings/approve', { ids: [id] });
    assert.equal(approved.status, 200, JSON.stringify(approved.body));
    const pub = await env.as().get(`/events/${id}`);
    assert.equal(pub.status, 200);
    assert.equal(pub.body.coverUrl, cover.url);
    const listed = await env.as().get('/events?time=all');
    assert.deepEqual(listed.body.items.map((e: any) => e.id), [id]);

    await readsAll(undefined, [`/events/${pub.body.slug}`, `/organizers/${pub.body.organizer.slug}`, `/events/${id}/calendar.ics`]);
    await readsAll(organizer, [
      `/organizer/events/${id}`, `/organizer/events/${id}/performance`, `/organizer/events/${id}/attendees`, `/organizer/events/${id}/attendees.csv`,
      `/organizer/events/${id}/announcements`, `/organizer/events/${id}/announcements/estimate?audience=saved&channels=push`,
      `/organizer/events/${id}/promos`, `/organizer/events/${id}/guests`, `/organizer/events/${id}/revenue`, `/organizer/events/${id}/quality`,
      `/organizer/events/${id}/staff`, `/door/events/${id}/summary`, `/door/events/${id}/manifest`,
    ]);
    await readsAll(admin, [
      `/admin/events/${id}`, `/admin/listings/${id}/risk`, `/admin/listings/${id}/thread`, `/admin/organizers/${created.body.id}`,
      '/admin/overview', '/admin/insights', '/admin/audit/verify',
    ]);
    const chain = await env.as(admin).get('/admin/audit/verify');
    assert.equal(chain.body.ok, true);
  });
});
