import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { jobs } from '../src/jobs.ts';
import { many, one } from '../src/db/index.ts';
import { atVn } from '../src/lib/time.ts';

describe('background jobs', () => {
  let env: TestEnv;
  before(async () => { env = await setup(); });
  after(async () => { await env.close(); });

  it('sends a scheduled announcement when its time comes', async () => {
    const pending = await one<any>(env.ctx.db, `select id, reach from announcements where status = 'scheduled'`);
    assert.ok(pending, 'the VIP last call is scheduled for 18 Sep');
    assert.equal(await jobs.sendScheduledAnnouncements(env.ctx), 0);
    env.clock.set('2026-09-18T10:00:30+07:00');
    assert.equal(await jobs.sendScheduledAnnouncements(env.ctx), 1);
    const sent = await one<any>(env.ctx.db, 'select status, sent_at from announcements where id = $1', [pending.id]);
    assert.equal(sent.status, 'sent');
    const notices = await one<any>(env.ctx.db, `select count(*)::int as n from notifications where dedupe_key = $1`, [`announcement:${pending.id}`]);
    assert.ok(notices.n > 0);
  });

  it('delivers the outbox, holding non-urgent messages through quiet hours', async () => {
    env.clock.set('2026-09-14T23:30:00+07:00');
    const user = await one<any>(env.ctx.db, `select id from users where email = 'minh@example.com'`);
    await env.ctx.db.query(`insert into devices (token, user_id, platform) values ('test-device-token-1', $1, 'ios')`, [user.id]);
    const { notifyUser } = await import('../src/services/notify.ts');
    await env.ctx.db.tx((q) => notifyUser(q, env.clock.now(), {
      userId: user.id, topic: 'saved', kind: 'test', title: { en: 'Night', vi: 'Đêm' }, body: { en: 'b', vi: 'b' },
    }));
    const queued = await one<any>(env.ctx.db, `select not_before from outbox where address = 'test-device-token-1'`);
    assert.equal(new Date(queued.not_before).toISOString(), atVn('2026-09-15', '08:00').toISOString());
    const early = await jobs.deliverOutbox(env.ctx);
    assert.ok(!env.transport.sent.some((m) => m.address === 'test-device-token-1'));
    env.clock.set('2026-09-15T08:00:01+07:00');
    await jobs.deliverOutbox(env.ctx);
    assert.ok(env.transport.sent.some((m) => m.address === 'test-device-token-1'));
    assert.ok(early.sent >= 0);
  });

  it('retries failed deliveries with backoff', async () => {
    const failing = { send: async () => { throw new Error('provider down'); } };
    const user = await one<any>(env.ctx.db, `select id from users where email = 'minh@example.com'`);
    const { enqueue } = await import('../src/services/notify.ts');
    await enqueue(env.ctx.db, user.id, 'email', 'minh@example.com', 'retry-test', { lang: 'en' }, env.clock.now());
    const { deliverDue } = await import('../src/services/messaging.ts');
    const r = await deliverDue(env.ctx.db, env.clock, failing);
    assert.ok(r.failed >= 1);
    const row = await one<any>(env.ctx.db, `select status, attempts, not_before, error from outbox where template = 'retry-test'`);
    assert.equal(row.status, 'pending');
    assert.equal(row.attempts, 1);
    assert.equal(row.error, 'provider down');
    assert.ok(new Date(row.not_before) > env.clock.now());
  });

  it('expires unpaid holds and closes old appeals', async () => {
    env.clock.set('2026-09-14T10:00:00+07:00');
    const { ctx } = env;
    const token = await env.attendee();
    const detail = await env.as(token).get('/events/momang');
    const ga = detail.body.tickets.tiers[0];
    ctx.config.paymentProvider = 'vietqr';
    const order = await env.as(token).post('/orders', { eventId: env.ids.event.momang, tierId: ga.id, qty: 1, paymentMethod: 'vietqr' });
    ctx.config.paymentProvider = 'mock';
    assert.equal(order.body.payment.status, 'awaiting_transfer');
    assert.match(order.body.payment.qrPayload, /^000201010212/);
    env.clock.advance(16 * 60_000);
    assert.equal(await jobs.expireOrders(ctx), 1);
    env.clock.set('2026-09-30T00:00:00+07:00');
    assert.ok(await jobs.expireAppeals(ctx) >= 1);
  });

  it('confirms a bank transfer from a signed webhook', async () => {
    env.clock.set('2026-09-14T11:00:00+07:00');
    const token = await env.attendee();
    const detail = await env.as(token).get('/events/momang');
    env.ctx.config.paymentProvider = 'vietqr';
    const order = await env.as(token).post('/orders', { eventId: env.ids.event.momang, tierId: detail.body.tickets.tiers[0].id, qty: 1, paymentMethod: 'vietqr' });
    env.ctx.config.paymentProvider = 'mock';
    const body = JSON.stringify({ transactionId: 'VCB123', amount: order.body.payment.amount, description: `CK ${order.body.payment.reference} thanh toan` });
    const { hmac } = await import('../src/lib/crypto.ts');
    const unsigned = await env.app.inject({ method: 'POST', url: '/payments/bank-transfer/webhook', payload: body, headers: { 'content-type': 'application/json', 'x-signature': 'nope' } });
    assert.equal(unsigned.statusCode, 401);
    const signed = await env.app.inject({ method: 'POST', url: '/payments/bank-transfer/webhook', payload: body,
      headers: { 'content-type': 'application/json', 'x-signature': hmac(env.ctx.config.paymentWebhookSecret, body) } });
    assert.equal(signed.statusCode, 200);
    const paid = await env.as(token).get(`/orders/${order.body.order.id}`);
    assert.equal(paid.body.status, 'paid');
    assert.equal(paid.body.tickets.length, 1);
    const replay = await env.app.inject({ method: 'POST', url: '/payments/bank-transfer/webhook', payload: body,
      headers: { 'content-type': 'application/json', 'x-signature': hmac(env.ctx.config.paymentWebhookSecret, body) } });
    assert.equal(replay.json().alreadyPaid, true);
  });

  it('reminds people a day before a saved event and 15 minutes before a picked set', async () => {
    env.clock.set('2026-09-18T18:30:00+07:00');
    const sent = await jobs.reminders(env.ctx);
    assert.ok(sent > 0);
    const user = await one<any>(env.ctx.db, `select id from users where email = 'minh@example.com'`);
    const saved = await many<any>(env.ctx.db, `select dedupe_key from notifications where user_id = $1 and kind = 'saved_reminder'`, [user.id]);
    assert.ok(saved.some((n) => n.dedupe_key === `saved-reminder:${env.ids.event.ravo}`));
    assert.equal(await jobs.reminders(env.ctx) >= 0, true);
    const again = await many<any>(env.ctx.db, `select 1 from notifications where user_id = $1 and dedupe_key = $2`, [user.id, `saved-reminder:${env.ids.event.ravo}`]);
    assert.equal(again.length, 1, 'no duplicate reminder');

    env.clock.set('2026-09-19T17:50:00+07:00');
    await jobs.reminders(env.ctx);
    const set = await many<any>(env.ctx.db, `select title from notifications where user_id = $1 and kind = 'set_reminder'`, [user.id]);
    assert.deepEqual(set.map((s) => s.title.en), ['DJ Mie at 18:00']);
  });

  it('tells the organiser when a tier passes 90% sold, once', async () => {
    env.clock.set('2026-09-14T12:00:00+07:00');
    const first = await jobs.lowTicketAlerts(env.ctx);
    assert.ok(first >= 1);
    assert.equal(await jobs.lowTicketAlerts(env.ctx), 0);
  });
});
