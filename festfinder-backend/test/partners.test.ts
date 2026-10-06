import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { conversionStatus, partnerLink } from '../src/services/partners.ts';

describe('the way out to tickets', () => {
  let env: TestEnv;
  let admin: string;
  let token = '';
  let partnerId = '';
  before(async () => {
    env = await setup();
    admin = await env.admin();
  });
  after(async () => { await env.close(); });

  const clicks = async (slug: string) => (await env.ctx.db.query<any>(
    `select k.* from outbound_clicks k join events e on e.id = k.event_id where e.slug = $1 order by k.created_at`, [slug])).rows;

  it('sends a ticket button to FeestFinder’s checkout when a tier is on sale, and counts it', async () => {
    const counted = async () => (await env.ctx.db.query<{ n: number }>(
      `select coalesce(sum(ticket_clicks), 0)::int as n from event_metrics_daily m join events e on e.id = m.event_id where e.slug = 'ravo'`)).rows[0].n;
    const before = await counted();
    const res = await env.as().get('/go/ravo?src=detail');
    assert.equal(res.status, 302);
    assert.equal(res.headers.location, '/app/checkout/ravo');
    assert.equal(res.headers['x-robots-tag'], 'noindex, nofollow');
    const tier = (await env.ctx.db.query<{ id: string }>(`select t.id from ticket_tiers t join events e on e.id = t.event_id where e.slug = 'ravo' and t.key = 'vip'`)).rows[0].id;
    assert.equal((await env.as().get(`/go/ravo?src=tier&tier=${tier}`)).headers.location, `/app/checkout/ravo?tier=${tier}`);
    const rows = await clicks('ravo');
    assert.deepEqual(rows.map((r) => [r.target, r.source]), [['checkout', 'detail'], ['checkout', 'tier']]);
    assert.equal(await counted(), before + 1, 'one person, one counted click');
    const detail = (await env.as().get('/events/ravo')).body;
    assert.equal(detail.links.go, '/go/ravo');
  });

  it('sends it to the organiser’s ticket link as it is when no partner sells there', async () => {
    // Every Rap Việt tier is gone; the organiser's own page may still have returns.
    const res = await env.as().get('/go/rapviet?src=hero');
    assert.equal(res.status, 302);
    assert.equal(res.headers.location, 'https://ticketbox.vn/rap-viet-live');
    assert.deepEqual((await clicks('rapviet')).map((r) => [r.target, r.target_host, r.partner_id]), [['organizer', 'ticketbox.vn', null]]);
  });

  it('goes back to the event page when there is nowhere to buy, and knows no unknown event', async () => {
    await env.ctx.db.query(`update events set status = 'draft' where slug = 'blues'`);
    assert.equal((await env.as().get('/go/blues')).headers.location, '/e/blues');
    await env.ctx.db.query(`update events set status = 'live' where slug = 'blues'`);
    assert.equal((await env.as().get('/go/no-such-event')).status, 404);
  });

  it('lets the team add a partner, and tracks its links from then on', async () => {
    assert.equal((await env.as().post('/admin/partners', { name: 'Ticketbox' })).status, 401);
    const bad = await env.as(admin).post('/admin/partners', { name: 'Ticketbox', linkTemplate: 'https://go.example/deep' });
    assert.equal(bad.status, 400);
    const res = await env.as(admin).post('/admin/partners', {
      name: 'Ticketbox', hosts: ['https://www.Ticketbox.vn/', 'not a host'], commissionPct: 5,
      linkParams: { utm_source: 'feestfinder', aff: 'FF1', sub1: '{click}' },
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.deepEqual([res.body.slug, res.body.hosts, res.body.hasToken], ['ticketbox', ['ticketbox.vn'], true]);
    assert.ok(res.body.token.length >= 24);
    assert.match(res.body.postbackUrl, /\/partners\/ticketbox\/postback\?token=TOKEN&order=/);
    token = res.body.token;
    partnerId = res.body.id;

    const go = await env.as().get('/go/rapviet?src=detail');
    const out = new URL(go.headers.location);
    const click = (await clicks('rapviet')).at(-1);
    assert.deepEqual([out.host, out.pathname, out.searchParams.get('aff'), out.searchParams.get('sub1')], ['ticketbox.vn', '/rap-viet-live', 'FF1', click.id]);
    assert.deepEqual([click.target, click.partner_id], ['partner', partnerId]);
  });

  it('wraps a link in a network’s tracking link when the partner has one', () => {
    const url = partnerLink('https://megatix.vn/events/x?ref=a', { link_template: 'https://go.network.example/deep?url={url}&sub={click}', link_params: { utm_source: 'feestfinder' } }, 'C1');
    const u = new URL(url);
    assert.equal(u.host, 'go.network.example');
    assert.equal(u.searchParams.get('sub'), 'C1');
    assert.equal(u.searchParams.get('url'), 'https://megatix.vn/events/x?ref=a&utm_source=feestfinder');
    assert.deepEqual(['Confirmed', 'cancelled', 'paid', 'whatever'].map(conversionStatus), ['approved', 'rejected', 'paid', 'pending']);
  });

  it('takes a partner’s sale reports with its token, ties them to the click, and settles them', async () => {
    const click = (await clicks('rapviet')).at(-1);
    assert.equal((await env.as().get(`/partners/ticketbox/postback?token=wrong&order=A1&amount=1300000`)).status, 401);
    assert.equal((await env.as().get(`/partners/nobody/postback?token=${token}&order=A1`)).status, 404);
    const first = await env.as().get(`/partners/ticketbox/postback?token=${token}&order_id=A1&sale_amount=1300000&currency=vnd&status=pending&sub1=${click.id}`);
    assert.equal(first.status, 201, JSON.stringify(first.body));
    assert.equal(first.body.matchedClick, true);
    const again = await env.call('POST', '/partners/ticketbox/postback', { body: { order: 'A1', amount: 1300000, status: 'approved' }, headers: { 'x-partner-token': token } });
    assert.equal(again.status, 200);
    const row = (await env.ctx.db.query<any>(`select c.*, e.slug from partner_conversions c left join events e on e.id = c.event_id where order_ref = 'A1'`)).rows[0];
    assert.deepEqual([row.status, Number(row.commission), row.currency, row.slug, 'token' in row.payload], ['approved', 65000, 'VND', 'rapviet', false]);

    const list = (await env.as(admin).get('/admin/partners')).body;
    const tb = list.items.find((p: any) => p.slug === 'ticketbox');
    assert.deepEqual(tb.totals, [{ currency: 'VND', orders: 1, sales: 1300000, earned: 65000, pending: 0 }]);
    assert.ok(tb.clicks30 >= 1);
    assert.ok(list.outbound.partner >= 1 && list.outbound.checkout >= 2);
    const conv = (await env.as(admin).get(`/admin/partners/${partnerId}/conversions`)).body;
    assert.equal(conv.items[0].event.slug, 'rapviet');
    assert.equal(conv.topEvents[0].slug, 'rapviet');

    assert.equal((await env.as(admin).patch(`/admin/conversions/${row.id}`, { status: 'paid' })).body.status, 'paid');
    await env.as().get(`/partners/ticketbox/postback?token=${token}&order=A1&amount=1300000&status=cancelled`);
    assert.equal((await env.ctx.db.query<any>(`select status from partner_conversions where order_ref = 'A1'`)).rows[0].status, 'paid', 'paid stays paid');
  });

  it('rotates the postback token, and the old one stops working', async () => {
    const res = await env.as(admin).post(`/admin/partners/${partnerId}/token`);
    assert.notEqual(res.body.token, token);
    assert.equal((await env.as().get(`/partners/ticketbox/postback?token=${token}&order=A2`)).status, 401);
    assert.equal((await env.as().get(`/partners/ticketbox/postback?token=${res.body.token}&order=A2`)).status, 201);
    const off = await env.as(admin).patch(`/admin/partners/${partnerId}`, { enabled: false });
    assert.equal(off.body.enabled, false);
    // Off: links go out untouched.
    assert.equal((await env.as().get('/go/rapviet')).headers.location, 'https://ticketbox.vn/rap-viet-live');
  });

  it('keeps search engines out of the redirects', async () => {
    const robots = (await env.as().get('/robots.txt')).body;
    assert.match(robots, /Disallow: \/go\//);
    assert.match(robots, /Disallow: \/partners\//);
  });
});
