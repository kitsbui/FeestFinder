import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { one } from '../src/db/index.ts';
import { multipart, png } from './files.ts';

describe('moments', () => {
  let env: TestEnv;
  let minh: string;
  let organizer: string;
  let admin: string;
  before(async () => {
    env = await setup();
    minh = await env.attendee();
    organizer = await env.organizer();
    admin = await env.admin();
  });
  after(async () => { await env.close(); });

  const upload = async (token: string, w = 1200, h = 900) => {
    const mp = multipart(png(w, h), 'moment.png');
    const res = await env.app.inject({ method: 'POST', url: '/uploads?purpose=moment', payload: mp.payload, headers: { 'content-type': mp.type, authorization: `Bearer ${token}` } });
    return res;
  };

  it('takes uploaded photos only, its owner’s own, up to nine', async () => {
    const small = await upload(minh, 300, 300);
    assert.equal(small.statusCode, 400);
    assert.equal(small.json().error.code, 'moment_size');
    const up = await upload(minh);
    assert.equal(up.statusCode, 201, up.body);
    const url = up.json().url;

    assert.equal((await env.as(minh).post('/me/moments', { url: 'https://example.com/x.jpg' })).body.error.code, 'upload_required');
    assert.equal((await env.as(organizer).post('/me/moments', { as: 'organizer', url })).body.error.code, 'upload_required', 'someone else’s upload');

    const made = await env.as(minh).post('/me/moments', { url, caption: 'Drop đầu tiên', takenOn: '2026-09-12' });
    assert.equal(made.status, 201);
    assert.equal(made.body.caption, 'Drop đầu tiên');
    for (let i = 0; i < 8; i++) assert.equal((await env.as(minh).post('/me/moments', { url })).status, 201);
    const full = await env.as(minh).post('/me/moments', { url });
    assert.equal(full.status, 409);
    assert.equal(full.body.error.code, 'moments_full');
    const mine = await env.as(minh).get('/me/moments');
    assert.equal(mine.body.items.length, 9);
    assert.equal(mine.body.items[0].caption, 'Drop đầu tiên');

    // Reorder, edit and remove.
    const ids = mine.body.items.map((m: any) => m.id).reverse();
    const ordered = await env.as(minh).put('/me/moments/order', { ids });
    assert.equal(ordered.body.items[8].caption, 'Drop đầu tiên');
    const edited = await env.as(minh).patch(`/me/moments/${ids[0]}`, { caption: 'Mở màn' });
    assert.equal(edited.body.caption, 'Mở màn');
    assert.equal((await env.as(organizer).delete(`/me/moments/${ids[0]}`)).status, 403);
    assert.equal((await env.as(minh).delete(`/me/moments/${ids[0]}`)).status, 200);
    assert.equal((await env.as(minh).get('/me/moments')).body.items.length, 8);
  });

  it('an organiser’s show on its public page; a report goes to the moderators, who remove it', async () => {
    const up = await upload(organizer);
    const made = await env.as(organizer).post('/me/moments', { as: 'organizer', url: up.json().url, caption: 'Sân khấu chính' });
    assert.equal(made.status, 201);
    const page = await env.as().get('/organizers/ravoent');
    assert.equal(page.body.moments[0].caption, 'Sân khấu chính');

    assert.equal((await env.as().post(`/moments/${made.body.id}/report`, { reason: 'spam' })).status, 401);
    assert.equal((await env.as(minh).post(`/moments/${made.body.id}/report`, { reason: 'spam' })).status, 201);
    assert.equal((await env.as(minh).post(`/moments/${made.body.id}/report`, { reason: 'spam' })).status, 200, 'once per person');
    assert.equal((await env.as(minh).get('/admin/moments/reports')).status, 403);
    const queue = await env.as(admin).get('/admin/moments/reports');
    const item = queue.body.items.find((m: any) => m.id === made.body.id);
    assert.equal(item.reports, 1);
    assert.equal(item.owner.href, '/o/ravoent');

    assert.equal((await env.as(admin).post(`/admin/moments/${made.body.id}/remove`, {})).status, 200);
    assert.equal((await env.as().get('/organizers/ravoent')).body.moments.length, 0);
    const audit = await one<{ action: string }>(env.ctx.db, `select action from audit_log where target_id = $1 order by seq desc limit 1`, [made.body.id]);
    assert.equal(audit!.action, 'moment.removed');
    assert.equal((await env.as(admin).get('/admin/moments/reports')).body.items.some((m: any) => m.id === made.body.id), false);
  });

  it('a photo goes to the organiser named, and only one the person is on the team of', async () => {
    const id = (await env.as().get('/organizers/ravoent')).body.id;
    const other = await one<{ id: string }>(env.ctx.db, 'select id from organizers where id <> $1 limit 1', [id]);
    const url = (await upload(organizer)).json().url;
    const made = await env.as(organizer).post('/me/moments', { as: 'organizer', organizerId: id, url });
    assert.equal(made.status, 201);
    assert.equal((await env.as(organizer).get(`/me/moments?as=organizer&organizerId=${id}`)).body.items.some((m: any) => m.id === made.body.id), true);
    const elsewhere = await env.as(organizer).post('/me/moments', { as: 'organizer', organizerId: other!.id, url });
    assert.equal(elsewhere.status, 403);
    assert.equal(elsewhere.body.error.code, 'not_yours');
    // A day that does not exist is a 400, not a database error.
    const bad = await env.as(organizer).post('/me/moments', { as: 'organizer', organizerId: id, url, takenOn: '2026-02-30' });
    assert.equal(bad.status, 400);
    assert.equal((await env.as(organizer).patch(`/me/moments/${made.body.id}`, { takenOn: '2026-13-01' })).status, 400);
    assert.equal((await env.as(organizer).delete(`/me/moments/${made.body.id}`)).status, 200);
  });

  it('publishing on a public profile needs a confirmed phone', async () => {
    await env.ctx.db.query(`update users set phone_verified_at = null where email = 'team@ravolution.vn'`);
    const r = await env.as(organizer).post('/me/moments', { as: 'organizer', url: '/files/moment/00/' + '0'.repeat(64) + '.png' });
    assert.equal(r.status, 403);
    assert.equal(r.body.error.code, 'phone_unverified');
  });
});
