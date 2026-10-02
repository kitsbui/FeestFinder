import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { one } from '../src/db/index.ts';
import { hmac } from '../src/lib/crypto.ts';
import { jobs } from '../src/jobs.ts';
import { phoneUser } from './people.ts';

const ticketsOf = (r: any) => r.body.items.flatMap((o: any) => o.tickets.map((t: any) => ({ ...t, orderId: o.id, received: o.received, event: o.event.slug })));

describe('passing tickets on', () => {
  let env: TestEnv;
  let minh: string;
  let organizer: string;
  let admin: string;
  before(async () => {
    env = await setup();
    [minh, organizer, admin] = await Promise.all([env.attendee(), env.organizer(), env.admin()]);
  });
  after(async () => { await env.close(); });

  const scan = (token: string, id: string) => env.as(organizer).post(`/door/events/${env.ids.event.ravo}/scans`, { token, deviceId: 'gate-1', clientScanId: id });

  it('lists a ticket at no more than face value, and tells people waiting for one', async () => {
    const watcher = await phoneUser(env, '0913 100 200');
    await env.as(watcher).put(`/events/${env.ids.event.ravo}/resale/watch`);
    const [dem1] = ticketsOf(await env.as(minh).get('/me/tickets')).filter((t: any) => t.code === 'FF-RAVO-DEM1');
    assert.equal(dem1.transferable, true);
    assert.equal(dem1.faceValue, 1_200_000);
    const greedy = await env.as(minh).post(`/me/tickets/${dem1.id}/listing`, { price: 1_500_000 });
    assert.equal(greedy.body.error.code, 'above_face_value');
    const listed = await env.as(minh).post(`/me/tickets/${dem1.id}/listing`, { price: 1_100_000 });
    assert.equal(listed.status, 201);
    assert.equal((await env.as(minh).post(`/me/tickets/${dem1.id}/listing`, { price: 1_000_000 })).body.error.code, 'already_listed');
    const page = await env.as().get('/events/ravo/resale');
    assert.deepEqual(page.body.items.map((i: any) => i.price), [1_050_000, 1_100_000]);
    assert.equal(page.body.enabled, true);
    const bell = await env.as(watcher).get('/me/notifications');
    assert.ok(bell.body.items.some((n: any) => n.kind === 'resale_available'));
  });

  it('moves the ticket to the buyer and retires the seller’s QR, even at the door', async () => {
    const buyer = await phoneUser(env, '0913 100 300');
    const before = ticketsOf(await env.as(minh).get('/me/tickets')).find((t: any) => t.code === 'FF-RAVO-DEM1');
    assert.equal(before.listing.price, 1_100_000);
    const oldQr = before.qr;
    const manifest = await env.as(organizer).get(`/door/events/${env.ids.event.ravo}/manifest`);
    const cursor = manifest.body.cursor;

    const quote = await env.as(buyer).post(`/resale/${before.listing.id}/quote`);
    assert.equal(quote.body.total, 1_100_000 + 55_000);
    assert.equal((await env.as(minh).post(`/resale/${before.listing.id}/orders`, { paymentMethod: 'momo' })).body.error.code, 'own_listing');
    const bought = await env.as(buyer).post(`/resale/${before.listing.id}/orders`, { paymentMethod: 'momo' });
    assert.equal(bought.status, 201);
    assert.equal(bought.body.payment.status, 'paid');

    const mine = ticketsOf(await env.as(buyer).get('/me/tickets'));
    assert.equal(mine.length, 1);
    assert.equal(mine[0].received, true);
    assert.match(mine[0].qr, /^FF-RAVO-DEM1~1\./);
    const seller = await env.as(minh).get('/me/tickets');
    assert.deepEqual(ticketsOf(seller).map((t: any) => t.code), ['FF-RAVO-DEM2']);
    assert.equal(seller.body.resold[0].price, 1_100_000);
    assert.equal(new Date(seller.body.resold[0].payoutDueAt).toISOString(), '2026-09-21T19:00:00.000Z', 'paid two days after the night ends');

    const changed = await env.as(organizer).get(`/door/events/${env.ids.event.ravo}/manifest?since=${cursor}`);
    assert.deepEqual(changed.body.tickets.map((t: any) => [t.code, t.v]), [['FF-RAVO-DEM1', 1]]);
    assert.ok(changed.body.cursor > cursor);

    const stale = await scan(oldQr, 's1');
    assert.equal(stale.body.result, 'invalid');
    assert.equal(stale.body.reason, 'transferred');
    const fresh = await scan(mine[0].qr, 's2');
    assert.equal(fresh.body.result, 'valid');
  });

  it('gives a ticket to a friend by phone number', async () => {
    const dem2 = ticketsOf(await env.as(minh).get('/me/tickets')).find((t: any) => t.code === 'FF-RAVO-DEM2');
    const nobody = await env.as(minh).post(`/me/tickets/${dem2.id}/transfer`, { phone: '0999 999 999' });
    assert.equal(nobody.status, 404);
    const gift = await env.as(minh).post(`/me/tickets/${dem2.id}/transfer`, { phone: '0908 000 006' });
    assert.equal(gift.status, 200);
    assert.match(gift.body.message.en, /Sent to Ngọc Anh/);
    const ngoc = await phoneUser(env, '0908 000 006');
    const hers = ticketsOf(await env.as(ngoc).get('/me/tickets'));
    assert.ok(hers.some((t: any) => t.code === 'FF-RAVO-DEM2' && /~1\./.test(t.qr)));
    assert.equal(ticketsOf(await env.as(minh).get('/me/tickets')).length, 0);
    const going = await one(env.ctx.db, 'select 1 from going where user_id = (select id from users where email = $1) and event_id = $2', ['minh@example.com', env.ids.event.ravo]);
    assert.equal(going, null, 'no ticket left, so Minh is no longer going');
  });

  it('refuses to refund an order once one of its tickets changed hands', async () => {
    const order = await one<any>(env.ctx.db, `select id from orders where code = 'FFDEMO22'`);
    const r = await env.as(organizer).post(`/organizer/orders/${order.id}/refund`);
    assert.equal(r.body.error.code, 'ticket_transferred');
  });

  it('pays the seller after the event, from the admin queue', async () => {
    assert.equal((await env.as(admin).get('/admin/resale?state=due')).body.items.length, 0);
    assert.equal((await env.as(admin).get('/admin/resale?state=upcoming')).body.items.length, 1);
    env.clock.set('2026-09-22T09:00:00+07:00');
    try {
      const due = await env.as(admin).get('/admin/resale?state=due');
      assert.equal(due.body.items.length, 1);
      assert.equal(due.body.items[0].seller.bank.name, 'Vietcombank');
      const paid = await env.as(admin).post(`/admin/resale/${due.body.items[0].id}/payout`, { reference: 'VCB 220926 001' });
      assert.equal(paid.status, 200);
      assert.equal((await env.as(admin).get('/admin/resale?state=paid_out')).body.items.length, 1);
    } finally { env.clock.set('2026-09-14T10:00:00+07:00'); }
  });

  it('needs a bank account to sell, and stops at the end of the night', async () => {
    const rapper = await phoneUser(env, '0908 000 002');
    const linh = ticketsOf(await env.as(rapper).get('/me/tickets')).find((t: any) => t.code === 'FF-RAPV-LNH1');
    assert.ok(linh.listing, 'already listed in the demo data');
    await env.as(rapper).delete(`/me/tickets/${linh.id}/listing`);
    const noBank = await env.as(rapper).post(`/me/tickets/${linh.id}/listing`, { price: 600_000 });
    assert.equal(noBank.body.error.code, 'payee_missing');
    const withBank = await env.as(rapper).post(`/me/tickets/${linh.id}/listing`, { price: 600_000, payee: { bankBin: '970422', accountNo: '0123456789', accountName: 'Pham Linh' } });
    assert.equal(withBank.status, 201);
    env.clock.set('2026-09-21T10:00:00+07:00');
    try {
      await env.as(rapper).delete(`/me/tickets/${linh.id}/listing`);
      const late = await env.as(rapper).post(`/me/tickets/${linh.id}/listing`, { price: 600_000 });
      assert.equal(late.body.error.code, 'event_ended');
    } finally { env.clock.set('2026-09-14T10:00:00+07:00'); }
  });
});

describe('passing tickets on, paid by bank transfer', () => {
  let env: TestEnv;
  before(async () => { env = await setup({ config: { paymentProvider: 'vietqr', platformBank: { bin: '970436', accountNo: '0071000000001', accountName: 'CONG TY FESTFINDER' } } }); });
  after(async () => { await env.close(); });

  const webhook = (description: string, amount: number) => {
    const payload = JSON.stringify({ transactionId: `tx-${Math.random()}`, amount, description });
    return env.app.inject({ method: 'POST', url: '/payments/bank-transfer/webhook', payload, headers: { 'content-type': 'application/json', 'x-signature': hmac('test-webhook-secret', payload) } });
  };

  it('holds the ticket while the buyer pays, and hands it over when the money lands', async () => {
    const listing = (await env.as().get('/events/rapviet/resale')).body.items[0];
    const a = await phoneUser(env, '0914 000 001');
    const b = await phoneUser(env, '0914 000 002');
    const order = await env.as(a).post(`/resale/${listing.id}/orders`, { paymentMethod: 'vietqr' });
    assert.equal(order.body.payment.status, 'awaiting_transfer');
    assert.match(order.body.payment.reference, /^FR[2-9A-HJ-NP-Z]{6}$/);
    assert.equal((await env.as().get('/events/rapviet/resale')).body.count, 0, 'held while they pay');
    assert.equal((await env.as(b).post(`/resale/${listing.id}/orders`, { paymentMethod: 'vietqr' })).body.error.code, 'listing_gone');

    // Nobody pays: after ten minutes the ticket is back on the list.
    env.clock.advance(11 * 60_000);
    await jobs.expireOrders(env.ctx);
    assert.equal((await env.as().get('/events/rapviet/resale')).body.count, 1);

    const second = await env.as(b).post(`/resale/${listing.id}/orders`, { paymentMethod: 'vietqr' });
    const res = await webhook(`CHUYEN TIEN ${second.body.payment.reference}`, second.body.order.total);
    assert.equal(res.json().matched, true);
    const hers = (await env.as(b).get('/me/tickets')).body.items;
    assert.equal(hers[0].tickets[0].code, 'FF-RAPV-LNH1');
    assert.equal((await env.as(b).get(`/resale/orders/${second.body.order.id}`)).body.status, 'paid');

    // The first buyer pays late: the ticket is gone, so the money is owed back.
    const late = await webhook(`ck ${order.body.payment.reference}`, order.body.order.total);
    assert.equal(late.json().refundDue, true);
    const admin = await env.admin();
    const failed = await env.as(admin).get('/admin/resale?state=failed');
    assert.equal(failed.body.items.length, 1);
    const refund = await env.as(admin).post(`/admin/resale/${failed.body.items[0].id}/refund`);
    assert.equal(refund.status, 200);
  });
});
