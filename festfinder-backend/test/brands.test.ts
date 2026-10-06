import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';

describe('brand campaigns', () => {
  let env: TestEnv;
  let admin: string;
  let open: string;
  let closed: string;
  let campaign: any;
  before(async () => {
    env = await setup();
    admin = await env.admin();
    open = await emailUser(env, 'open.brands@example.com');
    closed = await emailUser(env, 'no.brands@example.com');
    await env.as(open).post('/me/roles/artist', { stageName: 'Brand Friendly', styles: ['house'] });
    await env.as(open).patch('/me/artist', { openToBrands: true });
    await env.as(closed).post('/me/roles/artist', { stageName: 'Purist' });
  });
  after(async () => { await env.close(); });

  const future = (days: number) => new Date(env.clock.now().getTime() + days * 86400_000).toISOString().slice(0, 10);

  it('lets only the team post a campaign, priced in its first city’s currency', async () => {
    assert.equal((await env.as(open).post('/admin/brand-campaigns', { brandName: 'Tiger', title: 'Summer series' })).status, 403);
    const res = await env.as(admin).post('/admin/brand-campaigns', {
      brandName: 'Tiger', title: 'Rooftop summer series', brief: 'Three sunset sets.', cities: ['bangkok'], styles: ['house'], feeMin: 20000, feeMax: 40000, closesOn: future(30),
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.currency, 'THB');
    campaign = res.body;
    assert.equal((await env.as(admin).post('/admin/brand-campaigns', { brandName: 'Xyz', title: 'Bad fee', feeMin: 10, feeMax: 1 })).body.error.code, 'fee_range');
    const list = (await env.as(admin).get('/admin/brand-campaigns')).body;
    assert.equal(list.artistsOpenToBrands, 1);
    assert.deepEqual((await env.as().get('/artists?brands=1')).body.items.map((a: any) => a.slug), ['brand-friendly']);
  });

  it('shows campaigns only to artists open to brands, and takes their interest once', async () => {
    const shut = (await env.as(closed).get('/brand-campaigns')).body;
    assert.deepEqual([shut.openToBrands, shut.items.length], [false, 0]);
    assert.equal((await env.as(closed).post(`/brand-campaigns/${campaign.id}/interest`, {})).body.error.code, 'not_open_to_brands');
    const mine = (await env.as(open).get('/brand-campaigns')).body;
    assert.equal(mine.items[0].id, campaign.id);
    assert.equal((await env.as(open).post(`/brand-campaigns/${campaign.id}/interest`, { message: 'Love sunsets.' })).status, 201);
    assert.equal((await env.as(open).post(`/brand-campaigns/${campaign.id}/interest`, { message: 'Again' })).status, 200);
    assert.equal((await env.as(open).get('/brand-campaigns')).body.items[0].interest, 'sent');
  });

  it('lets the team pick, and tells the artist', async () => {
    const ints = (await env.as(admin).get(`/admin/brand-campaigns/${campaign.id}/interests`)).body.items;
    assert.equal(ints.length, 1);
    assert.equal(ints[0].artist.email, 'open.brands@example.com');
    assert.equal((await env.as(admin).post(`/admin/brand-campaigns/${campaign.id}/interests/${ints[0].id}`, { status: 'selected' })).body.status, 'selected');
    const mine = (await env.as(open).get('/me/artist/brand-interests')).body.items;
    assert.deepEqual([mine[0].status, mine[0].campaign.brandName], ['selected', 'Tiger']);
    const told = await env.ctx.db.query<any>(`select count(*)::int as n from notifications n join users u on u.id = n.user_id where u.email = 'open.brands@example.com' and n.kind = 'brand_campaign'`);
    assert.equal(told.rows[0].n, 1);
  });

  it('keeps drafts and closed campaigns out', async () => {
    const draft = (await env.as(admin).post('/admin/brand-campaigns', { brandName: 'Secret', title: 'Not yet', status: 'draft' })).body;
    assert.ok(!(await env.as(open).get('/brand-campaigns')).body.items.some((c: any) => c.id === draft.id));
    assert.equal((await env.as(open).post(`/brand-campaigns/${draft.id}/interest`, {})).status, 404);
    await env.as(admin).patch(`/admin/brand-campaigns/${campaign.id}`, { status: 'closed' });
    assert.equal((await env.as(open).post(`/brand-campaigns/${campaign.id}/interest`, {})).body.error.code, 'campaign_closed');
  });
});
