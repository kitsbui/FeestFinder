import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';

describe('collections', () => {
  let env: TestEnv;
  let me: string;
  before(async () => {
    env = await setup({ config: { serveFrontend: true } });
    me = await emailUser(env, 'collector@example.com');
    await env.as(me).patch('/me', { name: 'Thu Hà' });
  });
  after(async () => { await env.close(); });

  it('keeps private lists of events, and collecting an event saves it', async () => {
    const made = await env.as(me).post('/me/collections', { name: 'Cuối tuần này', eventId: env.ids.event.ravo });
    assert.equal(made.status, 201);
    assert.deepEqual([made.body.name, made.body.count, made.body.isPublic, made.body.url, made.body.has], ['Cuối tuần này', 1, false, null, true]);
    assert.equal((await env.as(me).get(`/me/saves`)).body.items.some((e: any) => e.id === env.ids.event.ravo), true, 'it is in Saved too');

    env.clock.advance(60_000);
    await env.as(me).put(`/me/collections/${made.body.id}/events/${env.ids.event.hozo}`);
    const again = await env.as(me).put(`/me/collections/${made.body.id}/events/${env.ids.event.hozo}`);
    assert.equal(again.body.changed, false, 'adding twice changes nothing');

    const list = await env.as(me).get(`/me/collections?event=${env.ids.event.hozo}`);
    assert.deepEqual(list.body.items.map((c: any) => [c.name, c.count, c.has]), [['Cuối tuần này', 2, true]]);
    const one = await env.as(me).get(`/me/collections/${made.body.id}`);
    assert.deepEqual(one.body.items.map((e: any) => e.id), [env.ids.event.hozo, env.ids.event.ravo], 'newest first');

    await env.as(me).delete(`/me/collections/${made.body.id}/events/${env.ids.event.hozo}`);
    assert.equal((await env.as(me).get(`/me/collections/${made.body.id}`)).body.items.length, 1);
  });

  it('belongs to its owner alone', async () => {
    const mine = (await env.as(me).get('/me/collections')).body.items[0];
    const other = await emailUser(env, 'someone@example.com');
    assert.equal((await env.as(other).get(`/me/collections/${mine.id}`)).status, 404);
    assert.equal((await env.as(other).patch(`/me/collections/${mine.id}`, { isPublic: true })).status, 404);
    assert.equal((await env.as(other).put(`/me/collections/${mine.id}/events/${env.ids.event.blues}`)).status, 404);
    assert.equal((await env.as(other).delete(`/me/collections/${mine.id}`)).status, 404);
    assert.equal((await env.as().get('/me/collections')).status, 401);
  });

  it('gets a public link that survives a rename and stops working when made private', async () => {
    const c = (await env.as(me).get('/me/collections')).body.items[0];
    assert.equal((await env.as().get(`/collections/${c.id}`)).status, 404, 'a private list has no page');
    const pub = await env.as(me).patch(`/me/collections/${c.id}`, { isPublic: true });
    assert.match(pub.body.slug, /^cuoi-tuan-nay-[a-z0-9]{5}$/);
    assert.equal(pub.body.url, `http://test.local/c/${pub.body.slug}`);

    const seen = await env.as().get(`/collections/${pub.body.slug}`);
    assert.deepEqual([seen.body.name, seen.body.owner.name, seen.body.count, seen.body.mine], ['Cuối tuần này', 'Thu Hà', 1, false]);
    assert.equal((await env.as(me).get(`/collections/${pub.body.slug}`)).body.mine, true);

    const renamed = await env.as(me).patch(`/me/collections/${c.id}`, { name: 'Lễ hội tháng 9' });
    assert.equal(renamed.body.slug, pub.body.slug, 'the link stays the same');
    await env.as(me).patch(`/me/collections/${c.id}`, { isPublic: false });
    assert.equal((await env.as().get(`/collections/${pub.body.slug}`)).status, 404);
    const back = await env.as(me).patch(`/me/collections/${c.id}`, { isPublic: true });
    assert.equal(back.body.slug, pub.body.slug, 'and comes back when made public again');
  });

  it('has a page for search engines, a Markdown copy and a sitemap entry', async () => {
    const c = (await env.as(me).get('/me/collections')).body.items[0];
    const seo = await env.as().get(`/seo/collections/${c.slug}`);
    assert.equal(seo.status, 200);
    assert.equal(seo.body.kind, 'collection');
    assert.equal(seo.body.page.h1, 'Lễ hội tháng 9');
    assert.match(seo.body.page.summary, /bộ sưu tập 1 sự kiện do Thu Hà tạo/);
    const graph = seo.body.jsonLd['@graph'];
    assert.ok(graph.some((n: any) => n['@type'] === 'CollectionPage'));
    assert.equal(graph.find((n: any) => n['@type'] === 'ItemList').itemListElement[0].url, 'http://test.local/e/ravo');

    const html = await env.app.inject({ method: 'GET', url: `/c/${c.slug}` });
    assert.equal(html.statusCode, 200);
    assert.match(html.body, /<h1>Lễ hội tháng 9<\/h1>/);
    assert.match(html.body, /<link rel="canonical" href="http:\/\/test\.local\/c\//);
    const md = await env.app.inject({ method: 'GET', url: `/c/${c.slug}.md?lang=en` });
    assert.match(md.body, /^# Lễ hội tháng 9/);
    assert.match((await env.app.inject({ method: 'GET', url: '/sitemap.xml' })).body, new RegExp(`/c/${c.slug}</loc>`));

    await env.as(me).patch(`/me/collections/${c.id}`, { isPublic: false });
    assert.equal((await env.app.inject({ method: 'GET', url: `/c/${c.slug}` })).statusCode, 404);
    assert.doesNotMatch((await env.app.inject({ method: 'GET', url: '/sitemap.xml' })).body, new RegExp(`/c/${c.slug}<`));
  });

  it('counts shares to Instagram and TikTok', async () => {
    for (const channel of ['instagram', 'tiktok', 'messenger']) {
      const r = await env.as(me).post(`/events/${env.ids.event.ravo}/shares`, { channel });
      assert.equal(r.status, 200, channel);
      assert.match(r.body.url, new RegExp(`ch=${channel}`));
    }
  });

  it('deletes a collection and leaves the saved events saved', async () => {
    const c = (await env.as(me).get('/me/collections')).body.items[0];
    assert.equal((await env.as(me).delete(`/me/collections/${c.id}`)).body.deleted, true);
    assert.deepEqual((await env.as(me).get('/me/collections')).body.items, []);
    assert.equal((await env.as(me).get('/me/saves')).body.items.some((e: any) => e.id === env.ids.event.ravo), true);
  });
});
