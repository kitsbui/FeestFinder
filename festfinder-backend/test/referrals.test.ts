import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';
import { SHARE_PCT } from '../src/lib/affiliate.ts';
import { sellerFor, utmLink } from '../src/services/partners.ts';

/*
 * Smart affiliate links (growth plan card D): a share link's referrer is carried to the seller,
 * a partner's approved sale earns them SHARE_PCT of FeestFinder's commission, and each viewer is
 * sent to the seller for their country.
 */

const PHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';

describe('referrals and the referrer’s share', () => {
  let env: TestEnv;
  let admin: string;
  let token = '';
  let sharer: string;
  let buyer: string;
  let ref = '';
  let ravo = '';
  before(async () => {
    env = await setup();
    admin = await env.admin();
    token = (await env.as(admin).post('/admin/partners', { name: 'Ticketbox', hosts: ['ticketbox.vn'], commissionPct: 10, linkParams: { sub1: '{click}' } })).body.token;
    sharer = await emailUser(env, 'sharer@example.com');
    buyer = await emailUser(env, 'buyer@example.com');
    ravo = env.ids.event.ravo;
    for (const r of (await env.ctx.db.query<{ id: string }>('select id from outbound_clicks where event_id = $1', [ravo])).rows) seen.add(r.id);
  });
  after(async () => { await env.close(); });

  // The test clock stands still, so the newest click is the one not seen before.
  const seen = new Set<string>();
  type Click = { id: string; ref_user: string | null; target: string; target_host: string | null };
  const lastClick = async () => {
    const rows = (await env.ctx.db.query<Click>('select * from outbound_clicks where event_id = $1', [ravo])).rows;
    const fresh = rows.filter((r) => !seen.has(r.id));
    for (const r of rows) seen.add(r.id);
    assert.equal(fresh.length, 1, 'one new click');
    return fresh[0];
  };
  const go = (path: string, who?: string, country = 'VN') => env.call('GET', path, { token: who, headers: { 'user-agent': PHONE, 'x-vercel-ip-country': country } });

  it('tags a seller without a deal with UTM, and picks the seller by country', () => {
    assert.equal(utmLink('https://x.example/e?a=1', 'ravo', 'detail'), 'https://x.example/e?a=1&utm_source=feestfinder&utm_medium=referral&utm_campaign=ravo&utm_content=detail');
    assert.equal(utmLink('https://x.example/e?utm_source=me', 'ravo', 'detail'), 'https://x.example/e?utm_source=me', 'its own tags stay');
    const links = [{ url: 'https://megatix.sg/ravo', countries: ['SG', 'MY'] }, { url: 'https://other.sg/ravo', countries: ['SG'] }];
    assert.equal(sellerFor('https://main.example', links, 'SG'), 'https://megatix.sg/ravo', 'the first link for a country wins');
    assert.equal(sellerFor('https://main.example', links, 'VN'), 'https://main.example');
    assert.equal(sellerFor('https://main.example', links, null), 'https://main.example', 'no country: the main link');
  });

  it('gives a short share link that opens the page with the sharer’s code', async () => {
    const share = await env.as(sharer).post(`/events/${ravo}/shares`, { channel: 'copy' });
    ref = share.body.ref;
    assert.match(ref, /^[2-9A-HJ-NP-Z]{6}$/);
    assert.match(share.body.short, new RegExp(`/r/${ref}/ravo$`));
    const r = await env.as().get(`/r/${ref}/ravo`);
    assert.equal(r.status, 302);
    assert.equal(r.headers.location, `/e/ravo?ref=${ref}&ch=copy`);
    assert.equal(r.headers['x-robots-tag'], 'noindex, nofollow');
    assert.equal((await env.as().get('/r/not-a-code/ravo')).headers.location, '/e/ravo');
    assert.equal((await env.as().get(`/r/${ref}/no-such-event`)).headers.location, '/');
  });

  it('credits the referrer only after their link was opened, and never the person clicking', async () => {
    await go(`/go/ravo?src=share&ref=${ref}`, buyer);
    assert.equal((await lastClick()).ref_user, null, 'a code pasted by hand, before any visit, earns nothing');
    // The buyer opens the shared link: the page counts the visit for the sharer.
    assert.equal((await env.as(buyer).post(`/events/${ravo}/track`, { type: 'view', source: 'shared', ref, channel: 'copy' })).status, 202);
    const out = await go(`/go/ravo?src=share&ref=${ref.toLowerCase()}`, buyer);
    assert.equal(out.status, 302);
    const k = await lastClick();
    const sharerId = (await env.as(sharer).get('/auth/session')).body.user.id;
    assert.equal(k.ref_user, sharerId);
    assert.equal(k.target, 'partner');
    assert.equal(new URL(out.headers.location).searchParams.get('sub1'), k.id, 'the partner gets the click id');
    await go(`/go/ravo?src=share&ref=${ref}`, sharer);
    assert.equal((await lastClick()).ref_user, null, 'nobody refers themselves');
    await go('/go/ravo?src=share&ref=ZZ', buyer);
    assert.equal((await lastClick()).ref_user, null, 'a malformed code is ignored');
  });

  it('turns an approved partner sale into the referrer’s share, voids a rejected one, and pays by period', async () => {
    const click = (await env.ctx.db.query<{ id: string }>('select id from outbound_clicks where event_id = $1 and ref_user is not null limit 1', [ravo])).rows[0].id;
    const pb = await env.as().get(`/partners/ticketbox/postback?token=${token}&order=R1&amount=1000000&commission=100000&status=approved&click=${click}`);
    assert.equal(pb.status, 201);
    assert.equal(pb.body.matchedClick, true);
    const earning = async (order: string) => (await env.ctx.db.query<{ amount: string | null; amount_src: string; status: string; reason: string | null }>(
      'select a.* from ambassador_earnings a join partner_conversions c on c.id = a.conversion_id where c.order_ref = $1', [order])).rows[0];
    assert.deepEqual([Number((await earning('R1')).amount), (await earning('R1')).status], [100000 * SHARE_PCT / 100, 'payable']);

    // A sale in another currency is shared at the fixed rate; one with no rate waits with its reason.
    await env.as().get(`/partners/ticketbox/postback?token=${token}&order=R2&amount=100&currency=SGD&commission=10&status=pending&click=${click}`);
    assert.deepEqual([Number((await earning('R2')).amount_src), (await earning('R2')).status], [5, 'pending']);
    await env.as().get(`/partners/ticketbox/postback?token=${token}&order=R3&amount=100&currency=XYZ&commission=10&status=approved&click=${click}`);
    assert.deepEqual([(await earning('R3')).amount, (await earning('R3')).status, (await earning('R3')).reason], [null, 'pending', 'no_rate']);
    // The team approves R2 and rejects R3.
    const id = async (order: string) => (await env.ctx.db.query<{ id: string }>('select id from partner_conversions where order_ref = $1', [order])).rows[0].id;
    await env.as(admin).patch(`/admin/conversions/${await id('R2')}`, { status: 'approved' });
    assert.equal((await earning('R2')).status, 'payable');
    assert.ok(Number((await earning('R2')).amount) > 50_000, 'SGD at the fixed rate, in đồng');
    await env.as(admin).patch(`/admin/conversions/${await id('R3')}`, { status: 'rejected' });
    assert.equal((await earning('R3')).status, 'void');

    const mine = (await env.as(sharer).get('/me/commission')).body;
    const row = mine.items.find((r: { slug: string }) => r.slug === 'ravo');
    assert.equal(row.opens, 1);
    assert.equal(row.conversions, 2);
    assert.equal(row.payable, Number((await earning('R1')).amount) + Number((await earning('R2')).amount));
    assert.equal(mine.sharePct, SHARE_PCT);
    assert.equal(mine.payee, null);
    assert.equal((await env.as(buyer).get('/me/commission')).body.items.length, 0);

    const sharerId = (await env.as(sharer).get('/auth/session')).body.user.id;
    const list = (await env.as(admin).get('/admin/affiliate/ambassadors')).body;
    assert.equal(list.items.find((a: { user: { id: string } }) => a.user.id === sharerId).payable, row.payable);
    assert.equal((await env.as(admin).post(`/admin/affiliate/ambassadors/${sharerId}/payout`)).body.error.code, 'no_payee');
    await env.as(sharer).put('/me/payee', { bankBin: '970436', accountNo: '0123456789', accountName: 'Share Person' });
    assert.equal((await env.as(sharer).post(`/admin/affiliate/ambassadors/${sharerId}/payout`)).status, 403, 'the team only');
    const payout = await env.as(admin).post(`/admin/affiliate/ambassadors/${sharerId}/payout`);
    assert.equal(payout.status, 201, JSON.stringify(payout.body));
    assert.equal((await env.as(admin).post(`/admin/affiliate/ambassadors/${sharerId}/payout`)).body.error.code, 'below_minimum', 'nothing left owed');
    assert.equal((await env.as(admin).post(`/admin/ambassador-payouts/${payout.body.id}/paid`)).status, 200);
    assert.equal((await earning('R1')).status, 'paid');
    // A paid sale's share stays paid when the partner reports it again.
    await env.as().get(`/partners/ticketbox/postback?token=${token}&order=R1&amount=1000000&commission=100000&status=approved&click=${click}`);
    assert.equal((await earning('R1')).status, 'paid');
    assert.equal((await env.as(sharer).get('/me/commission')).body.totals.paid, row.payable);
  });

  it('tells a signed-in sharer their share when the seller is a partner', async () => {
    assert.equal((await env.as(sharer).get('/events/ravo')).body.mine.commissionPct, 10 * SHARE_PCT / 100);
    assert.equal((await env.as().get('/events/ravo')).body.mine, null);
  });

  it('sends each viewer to the seller listed for their country', async () => {
    const r = await env.as(admin).patch(`/admin/events/${ravo}`, { ticketLinks: [{ url: 'https://megatix.sg/ravo', countries: ['sg', 'MY'] }] });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal((await env.as(admin).patch(`/admin/events/${ravo}`, { ticketLinks: [{ url: 'http://megatix.sg/ravo', countries: ['SG'] }] })).status, 400, 'https only');
    const sg = await go('/go/ravo?src=detail', undefined, 'SG');
    assert.equal(sg.headers.location, 'https://megatix.sg/ravo?utm_source=feestfinder&utm_medium=referral&utm_campaign=ravo&utm_content=detail');
    assert.equal((await lastClick()).target_host, 'megatix.sg');
    const vn = await go('/go/ravo?src=detail', undefined, 'VN');
    assert.match(vn.headers.location, /^https:\/\/ticketbox\.vn\/ravolution-2026\?sub1=/, 'everyone else: the main link, through the partner');
    const csv = await env.as(admin).get('/admin/partners/to-sign.csv');
    assert.match(String(csv.body), /^\uFEFF?host,clicks,events,cities\r?\n/);
    assert.match(String(csv.body), /\nmegatix\.sg,1,1,ho-chi-minh\r?\n/);
  });
});
