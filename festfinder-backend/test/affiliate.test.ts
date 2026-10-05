import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';
import { countryOf, deviceOf } from '../src/services/partners.ts';

const PHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';

describe('affiliate links, click context and payouts', () => {
  let env: TestEnv;
  let admin: string;
  let partner: any;
  let token = '';
  before(async () => {
    env = await setup();
    admin = await env.admin();
    const res = await env.as(admin).post('/admin/partners', { name: 'Ticketbox', hosts: ['ticketbox.vn'], commissionPct: 10, linkParams: { sub1: '{click}' } });
    partner = res.body;
    token = res.body.token;
  });
  after(async () => { await env.close(); });

  it('reads the device and country, and leaves robots out', () => {
    assert.equal(deviceOf(PHONE), 'mobile');
    assert.equal(deviceOf('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)'), 'tablet');
    assert.equal(deviceOf('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130'), 'desktop');
    assert.equal(deviceOf('facebookexternalhit/1.1'), null);
    assert.equal(deviceOf('Googlebot/2.1'), null);
    assert.equal(countryOf({ 'x-vercel-ip-country': 'vn' }), 'VN');
    assert.equal(countryOf({ 'cf-ipcountry': 'XX' }), null);
  });

  it('records where a ticket click came from, and not a crawler', async () => {
    const res = await env.call('GET', '/go/rapviet?src=card', { headers: { 'user-agent': PHONE, 'x-vercel-ip-country': 'VN', referer: 'https://www.instagram.com/p/x' } });
    assert.equal(res.status, 302);
    const k = (await env.ctx.db.query<any>(`select k.* from outbound_clicks k join events e on e.id = k.event_id where e.slug = 'rapviet' order by k.created_at desc limit 1`)).rows[0];
    assert.deepEqual([k.source, k.device, k.country, k.referrer_host, k.target], ['card', 'mobile', 'VN', 'instagram.com', 'partner']);
    const before = (await env.ctx.db.query<any>('select count(*)::int as n from outbound_clicks')).rows[0].n;
    const bot = await env.call('GET', '/go/rapviet', { headers: { 'user-agent': 'Googlebot/2.1' } });
    assert.equal(bot.headers.location, 'https://ticketbox.vn/rap-viet-live', 'a robot still lands on the plain link');
    assert.equal((await env.ctx.db.query<any>('select count(*)::int as n from outbound_clicks')).rows[0].n, before);
  });

  it('lets the team make a short link that goes through a partner’s tracking, for admins only', async () => {
    const user = await emailUser(env, 'not.admin@example.com');
    assert.equal((await env.as(user).post('/admin/affiliate/links', { label: 'Merch', destinationUrl: 'https://shop.example/tee' })).status, 403);
    assert.equal((await env.as(admin).post('/admin/affiliate/links', { label: 'Merch', destinationUrl: 'http://shop.example/tee' })).status, 400, 'https only');
    const hoaprox = (await env.ctx.db.query<any>(`select id from artists where slug = 'hoaprox'`)).rows[0].id;
    const merch = await env.as(admin).post('/admin/affiliate/links', { label: 'Hoaprox merch', destinationUrl: 'https://shop.example/hoaprox', kind: 'artist', artistId: hoaprox });
    assert.equal(merch.status, 201, JSON.stringify(merch.body));
    assert.equal(merch.body.code, 'hoaprox-merch');
    assert.match(merch.body.url, /\/go\/link\/hoaprox-merch$/);
    const tix = await env.as(admin).post('/admin/affiliate/links', { label: 'Tết promo', code: 'tet', destinationUrl: 'https://ticketbox.vn/promo' });
    assert.equal(tix.status, 201);
    assert.equal((await env.as(admin).post('/admin/affiliate/links', { label: 'Again', code: 'tet', destinationUrl: 'https://x.example' })).body.error.code, 'code_taken');

    const go = await env.call('GET', '/go/link/hoaprox-merch?src=artist', { headers: { 'user-agent': PHONE } });
    assert.equal(go.headers.location, 'https://shop.example/hoaprox');
    const out = new URL((await env.call('GET', '/go/link/TET', { headers: { 'user-agent': PHONE } })).headers.location);
    const k = (await env.ctx.db.query<any>(`select k.* from outbound_clicks k join affiliate_links l on l.id = k.link_id where l.code = 'tet'`)).rows[0];
    assert.deepEqual([out.host, out.searchParams.get('sub1'), k.partner_id, k.target, k.event_id], ['ticketbox.vn', k.id, partner.id, 'link', null]);

    await env.as(admin).patch(`/admin/affiliate/links/${tix.body.id}`, { enabled: false });
    assert.equal((await env.call('GET', '/go/link/tet', { headers: { 'user-agent': PHONE } })).status, 404);

    // A sale on a link click is tied to the link.
    await env.as().get(`/partners/ticketbox/postback?token=${token}&order=L1&amount=500000&status=approved&click=${k.id}`);
    const sale = (await env.ctx.db.query<any>(`select link_id, event_id from partner_conversions where order_ref = 'L1'`)).rows[0];
    assert.deepEqual([sale.link_id, sale.event_id], [tix.body.id, null]);

    const owner = await emailUser(env, 'hoaprox.owner@example.com');
    await env.ctx.db.query(`update artists set owner_user_id = (select id from users where email = 'hoaprox.owner@example.com') where slug = 'hoaprox'`);
    const mine = (await env.as(owner).get('/me/artist/links')).body.items;
    assert.deepEqual(mine.map((l: any) => [l.code, l.clicks30]), [['hoaprox-merch', 1]]);
  });

  it('sums clicks by placement, device and country for the team, and for an organiser their own events only', async () => {
    const sum = (await env.as(admin).get('/admin/affiliate/summary?days=30')).body;
    assert.ok(sum.clicks >= 3);
    assert.ok(sum.byPlacement.some((r: any) => r.key === 'card'));
    assert.ok(sum.byDevice.some((r: any) => r.key === 'mobile'));
    assert.ok(sum.byCountry.some((r: any) => r.key === 'VN'));
    assert.ok(sum.byLink.some((r: any) => r.code === 'tet'));
    const tb = sum.sales.find((r: any) => r.partner.id === partner.id);
    assert.deepEqual([tb.earned, tb.unsettled], [50000, 50000]);

    const org = await env.organizer();
    const mine = await env.as(org).get('/organizer/affiliate');
    assert.equal(mine.status, 200, JSON.stringify(mine.body));
    const own = (await env.ctx.db.query<any>(`select e.slug from events e join organizers o on o.id = e.organizer_id where o.slug = 'ravoent'`)).rows.map((r) => r.slug);
    assert.ok(mine.body.byEvent.every((e: any) => own.includes(e.slug)), 'only their own events');
    assert.equal((await env.as(await emailUser(env, 'nobody.org@example.com')).get('/organizer/affiliate')).status, 403);
  });

  it('settles approved sales in a period once, and marks them paid when the money arrives', async () => {
    await env.as().get(`/partners/ticketbox/postback?token=${token}&order=P1&amount=1000000&status=pending`);
    const today = env.clock.now().toISOString().slice(0, 10);
    const pay = await env.as(admin).post('/admin/affiliate/payouts', { partnerId: partner.id, from: '2020-01-01', to: today });
    assert.equal(pay.status, 201, JSON.stringify(pay.body));
    assert.deepEqual([pay.body.conversions, pay.body.commission, pay.body.status], [1, 50000, 'open'], 'pending sales stay out');
    const again = await env.as(admin).post('/admin/affiliate/payouts', { partnerId: partner.id, from: '2020-01-01', to: today });
    assert.equal(again.body.error.code, 'nothing_to_settle', 'a sale is never settled twice');
    const paid = await env.as(admin).post(`/admin/affiliate/payouts/${pay.body.id}/paid`);
    assert.equal(paid.body.status, 'paid');
    assert.equal((await env.ctx.db.query<any>(`select status from partner_conversions where order_ref = 'L1'`)).rows[0].status, 'paid');
    assert.equal((await env.as(admin).post(`/admin/affiliate/payouts/${pay.body.id}/paid`)).status, 409);
    assert.equal((await env.as(admin).get('/admin/affiliate/payouts')).body.items.length, 1);
  });
});
