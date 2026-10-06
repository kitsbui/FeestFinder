import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';

describe('gear and software', () => {
  let env: TestEnv;
  let admin: string;
  let artist: string;
  before(async () => {
    env = await setup();
    admin = await env.admin();
    artist = await emailUser(env, 'gear.owner@example.com');
    await env.as(artist).post('/me/roles/artist', { stageName: 'Gear Head', roles: ['producer'] });
  });
  after(async () => { await env.close(); });

  it('has a curated catalogue to pick from', async () => {
    const all = await env.as().get('/gear?category=daw');
    assert.ok(all.body.items.some((g: any) => g.slug === 'ableton-live'));
    assert.ok(all.body.items.every((g: any) => g.category === 'daw'));
    assert.deepEqual((await env.as().get('/gear?q=cdj')).body.items.map((g: any) => g.slug), ['cdj-3000']);
  });

  it('lets an artist list what they use; a new name waits for the team before anyone sees it', async () => {
    const ableton = (await env.as().get('/gear?q=ableton live')).body.items[0];
    const res = await env.as(artist).put('/me/artist/gear', { items: [
      { gearId: ableton.id, usedFor: 'studio' },
      { name: 'Moog Subsequent 37', brand: 'Moog', category: 'synth', usedFor: 'live' },
    ] });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.deepEqual(res.body.items.map((g: any) => [g.name, g.approved, g.usedFor]), [['Ableton Live', true, 'studio'], ['Moog Subsequent 37', false, 'live']]);
    const page = (await env.as().get('/artists/gear-head')).body;
    assert.deepEqual(page.gear.map((g: any) => g.name), ['Ableton Live'], 'unapproved gear stays off the public page');
    assert.equal((await env.as().get('/gear?q=moog')).body.items.length, 0);
    assert.deepEqual((await env.as().get('/artists?gear=ableton-live')).body.items.map((a: any) => a.slug), ['gear-head']);
    assert.equal((await env.as(artist).put('/me/artist/gear', { items: [{ gearId: '00000000-0000-0000-0000-000000000000' }] })).status, 400);
  });

  it('lets only the team approve, and a tracked link becomes where to get it', async () => {
    const pending = (await env.as(admin).get('/admin/gear?pending=1')).body.items;
    const moog = pending.find((g: any) => g.name === 'Moog Subsequent 37');
    assert.equal(moog.suggestedBy, 'gear.owner@example.com');
    assert.equal((await env.as(artist).patch(`/admin/gear/${moog.id}`, { approved: true })).status, 403);
    const link = await env.as(admin).post('/admin/affiliate/links', { label: 'Moog', code: 'moog-37', kind: 'product', destinationUrl: 'https://shop.example/moog' });
    assert.equal((await env.as(admin).patch(`/admin/gear/${moog.id}`, { approved: true, affiliateLinkId: link.body.id })).status, 200);
    const page = (await env.as().get('/artists/gear-head')).body;
    const shown = page.gear.find((g: any) => g.name === 'Moog Subsequent 37');
    assert.match(shown.url, /\/go\/link\/moog-37\?src=artist$/);
  });
});
