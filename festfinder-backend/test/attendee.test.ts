import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { crc16, parseTlv } from '../src/lib/vietqr.ts';
import type { Guide, GuideGenerator } from '../src/services/guide.ts';
import { many } from '../src/db/index.ts';

class FakeGuide implements GuideGenerator {
  readonly model = 'fake';
  calls = 0;
  async generate(): Promise<Guide> {
    this.calls++;
    const spot = { name: 'Bánh mì Huỳnh Hoa', kind: 'food' as const, walk: '6 min ride', why: 'Busy, fast and filling before doors.' };
    return { before: [spot, spot, spot, spot], after: [], explore: [], wear: { headline: 'Light layers', items: ['Mesh top'], avoid: 'Heels' }, tip: 'Arrive before 18:00.' };
  }
}

describe('attendee (Web + App, signed in)', () => {
  let env: TestEnv;
  let token: string;
  const guide = new FakeGuide();
  before(async () => {
    env = await setup({ guide });
    token = await env.attendee();
  });
  after(async () => { await env.close(); });

  it('shows my state and friends on event cards', async () => {
    const r = await env.as(token).get('/events?limit=20');
    const ravo = r.body.items.find((e: any) => e.slug === 'ravo');
    assert.deepEqual(ravo.viewer, { saved: true, hyped: true, going: true });
    assert.deepEqual(ravo.friends.going.map((f: any) => f.name).sort(), ['Linh Phạm', 'Minh Trần', 'Ngọc Anh']);
    assert.deepEqual(ravo.friends.interested.map((f: any) => f.name), ['Đức Nguyễn']);
    const friendsOnly = await env.as(token).get('/events?time=month&friendsOnly=true&limit=20');
    assert.ok(friendsOnly.body.items.every((e: any) => e.friends.going.length > 0));
  });

  it('saves and unsaves, keeping the count in step', async () => {
    const id = env.ids.event.momang;
    const before = (await env.as().get('/events/momang')).body.saveCount;
    assert.equal((await env.as(token).put(`/me/saves/${id}`)).body.saved, true);
    assert.equal((await env.as(token).put(`/me/saves/${id}`)).body.changed, false, 'saving twice is a no-op');
    assert.equal((await env.as().get('/events/momang')).body.saveCount, before + 1);
    await env.as(token).delete(`/me/saves/${id}`);
    assert.equal((await env.as().get('/events/momang')).body.saveCount, before);
    const list = await env.as(token).get('/me/saves');
    assert.deepEqual(list.body.items.map((e: any) => e.slug).sort(), ['hozo', 'ravo']);
  });

  it('follows organisers and artists', async () => {
    const org = env.ids.org.vinwonder;
    const f = await env.as(token).put(`/me/follows/organizers/${org}`);
    assert.equal(f.body.message.en, 'Following 8Wonder');
    await env.as(token).put(`/me/follows/artists/${encodeURIComponent('Wukong')}`);
    const detail = await env.as(token).get('/events/ravo');
    assert.equal(detail.body.me.followingOrganizer, true);
    assert.deepEqual(detail.body.me.followingArtists.sort(), ['Hoaprox', 'Wukong']);
    assert.match(detail.body.me.followingArtistsLine.en, /^Following 2 of this lineup/);
    const panel = await env.as(token).get('/me/follows');
    assert.ok(panel.body.organizers.following.some((o: any) => o.slug === 'vinwonder'));
  });

  it('builds a set-time plan and reports clashes', async () => {
    const detail = await env.as(token).get('/events/ravo');
    // Seeded picks: DJ Mie 18:00–19:30, SlimV 19:00–20:45, Hoaprox 20:00–21:30.
    assert.deepEqual(detail.body.me.plan.clashes.map((c: any) => [c.a.artist, c.b.artist, c.minutes]), [['DJ Mie', 'SlimV', 30], ['SlimV', 'Hoaprox', 45]]);
    const arena = detail.body.timetable.days[0].stages[0].sets;
    const walker = arena.find((s: any) => s.artist === 'Alan Walker');
    const plan = await env.as(token).put(`/me/plan/sets/${walker.id}`, { remind: true });
    assert.equal(plan.body.setIds.length, 4);
    assert.ok(plan.body.remindSetIds.includes(walker.id));
    const cleared = await env.as(token).patch(`/me/plan/events/${env.ids.event.ravo}`, { clear: true });
    assert.deepEqual(cleared.body.setIds, []);
  });

  it('keeps the notification matrix and smart alert', async () => {
    const prefs = await env.as(token).get('/me/notification-preferences');
    assert.equal(prefs.body.matrix.saved.push, true);
    assert.equal(prefs.body.quietHours.start, '23:00');
    const updated = await env.as(token).put('/me/notification-preferences', { matrix: { weekly: { email: false, push: true } } });
    assert.deepEqual(updated.body.matrix.weekly, { push: true, zalo: false, email: false });
    const alert = await env.as(token).get('/me/alert');
    assert.equal(alert.body.matches, 1, 'EDM in Quận 1 & 3 under 1tr: only the rooftop warm-up');
    const wider = await env.as(token).put('/me/alert', { enabled: true, genres: ['EDM'], artists: [], organizerIds: [], areas: [], priceCap: null });
    assert.ok(wider.body.matches > alert.body.matches);
  });

  it('registers a browser push subscription as a web device', async () => {
    const key = await env.as(token).get('/push/public-key');
    assert.equal(key.status, 200);
    assert.equal(key.body.key, null, 'no VAPID keys in tests');
    env.ctx.config.webPush = { publicKey: 'BTestPublicKey', privateKey: 'k', subject: 'mailto:t@example.com' };
    assert.equal((await env.as(token).get('/push/public-key')).body.key, 'BTestPublicKey');
    env.ctx.config.webPush = null;
    const sub = JSON.stringify({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'p', auth: 'a' } });
    assert.equal((await env.as(token).post('/me/devices', { token: sub, platform: 'web' })).status, 200);
    const rows = await many<any>(env.ctx.db, 'select platform from devices where token = $1', [sub]);
    assert.deepEqual(rows.map((r) => r.platform), ['web']);
  });

  it('pulls a listing from the feed once two people report it', async () => {
    const other = await env.login('team@ravolution.vn', 'ravolution2026');
    const id = env.ids.event.blues;
    const first = await env.as(token).post(`/events/${id}/reports`, { code: 'price', note: 'Door price was higher' });
    assert.equal(first.status, 201);
    assert.equal(first.body.heldFromFeed, false);
    assert.equal((await env.as(token).post(`/events/${id}/reports`, { code: 'wrong' })).body.error.code, 'already_reported');
    const second = await env.as(other).post(`/events/${id}/reports`, { code: 'scam' });
    assert.equal(second.body.heldFromFeed, true);
    const feed = await env.as().get('/events?time=tonight&limit=20');
    assert.ok(!feed.body.items.some((e: any) => e.slug === 'blues'));
  });

  it('checks out with a promo code and gets signed tickets', async () => {
    const detail = await env.as(token).get('/events/ravo');
    const vip = detail.body.tickets.tiers.find((t: any) => t.key === 'vip');
    const quote = await env.as(token).post('/checkout/quote', { eventId: env.ids.event.ravo, tierId: vip.id, qty: 2, promoCode: 'rave10' });
    assert.equal(quote.status, 200);
    assert.equal(quote.body.subtotal, 4_800_000);
    assert.equal(quote.body.discount, 480_000);
    assert.equal(quote.body.fee, 216_000);
    assert.equal(quote.body.total, 4_536_000);

    const bad = await env.as(token).post('/checkout/quote', { eventId: env.ids.event.ravo, tierId: vip.id, qty: 2, promoCode: 'EARLYBIRD' });
    assert.equal(bad.body.error.code, 'promo_invalid', 'EARLYBIRD is paused');
    const early = detail.body.tickets.tiers.find((t: any) => t.key === 'early');
    assert.equal((await env.as(token).post('/checkout/quote', { eventId: env.ids.event.ravo, tierId: early.id, qty: 1 })).body.error.code, 'tier_sold_out');
    assert.equal((await env.as(token).post('/checkout/quote', { eventId: env.ids.event.hozo, tierId: vip.id, qty: 1 })).body.error.code, 'no_tickets_needed');

    const order = await env.as(token).post('/orders', { eventId: env.ids.event.ravo, tierId: vip.id, qty: 2, promoCode: 'RAVE10', paymentMethod: 'momo' });
    assert.equal(order.status, 201);
    assert.equal(order.body.payment.status, 'paid');
    assert.equal(order.body.order.tickets.length, 2);
    assert.match(order.body.order.tickets[0].qr, /^FF-RAVO-[2-9A-Z]{4}\.[\w-]{22}$/);

    const after = await env.as().get('/events/ravo');
    assert.equal(after.body.tickets.tiers.find((t: any) => t.key === 'vip').left, vip.left - 2);
    const mine = await env.as(token).get('/me/tickets');
    assert.equal(mine.body.items.length, 2, 'seeded GA order plus this one');
    const wallet = await env.as(token).post(`/me/tickets/${order.body.order.tickets[0].id}/wallet`, { platform: 'apple' });
    assert.equal(wallet.body.message.en, 'Pass added · it opens from the lock screen at the gate');
    const notes = await env.as(token).get('/me/notifications');
    assert.ok(notes.body.items.some((n: any) => n.kind === 'tickets_issued' && n.unread));
  });

  it('refuses to oversell a tier', async () => {
    const detail = await env.as(token).get('/events/ravo');
    const ga = detail.body.tickets.tiers.find((t: any) => t.key === 'ga');
    const r = await env.as(token).post('/checkout/quote', { eventId: env.ids.event.ravo, tierId: ga.id, qty: Math.min(6, ga.left + 1) });
    if (ga.left < 6) {
      assert.equal(r.status, 409);
      assert.equal(r.body.error.code, 'not_enough_tickets');
    }
  });

  it('runs a group plan: invite, accept, split the cost and request by VietQR', async () => {
    const plans = await env.as(token).get('/me/plans');
    const planId = plans.body.items[0].id;
    let plan = await env.as(token).get(`/plans/${planId}`);
    assert.equal(plan.body.members.length, 4);
    assert.equal(plan.body.split.paidLine.en, '1 of 2 paid');
    assert.equal(plan.body.split.owedLine.en, '1 still owe you 1,200,000₫');

    const invite = await env.as(token).post(`/events/${env.ids.event.ravo}/invites`, { friendIds: [env.ids.friend.f3] });
    assert.equal(invite.body.id, planId, 'adds to the existing plan');
    const friendToken = (await env.ctx.db.tx(async (q) => {
      const { createSession } = await import('../src/http/session.ts');
      return createSession(q, env.clock.now(), { kind: 'user', userId: env.ids.friend.f3 });
    })).token;
    const accepted = await env.as(friendToken).post(`/plans/${planId}/respond`, { status: 'going' });
    assert.equal(accepted.body.members.find((m: any) => m.name === 'Đức Nguyễn').status, 'going');

    const spot = await env.as(token).patch(`/plans/${planId}`, { meetSpot: 'cafe' });
    assert.equal(spot.body.meetSpot, 'cafe');
    assert.equal(spot.body.message.en, 'Meet spot set · 15:00');

    const req = await env.as(token).post(`/plans/${planId}/payment-requests`, { method: 'momo', post: true });
    assert.equal(req.status, 200);
    assert.equal(req.body.amount, 1_200_000);
    assert.equal(req.body.payeeLine, 'NGUYEN MINH ANH · Vietcombank •••• 8842');
    assert.match(req.body.reference, /^FF-RAVO-4P-[2-9A-Z]{3}$/, 'three friends going plus the owner');
    const tlv = parseTlv(req.body.qrPayload);
    assert.equal(tlv['54'], '1200000');
    assert.equal(req.body.qrPayload.slice(-4), crc16(req.body.qrPayload.slice(0, -4)));
    plan = await env.as(friendToken).get(`/plans/${planId}`);
    assert.equal(plan.body.messages.at(-1).kind, 'payment_request');
    assert.equal(plan.body.isOwner, false);

    const paid = await env.as(token).patch(`/plans/${planId}/members/${env.ids.friend.f1}`, { paid: true });
    assert.equal(paid.body.split.paidCount, 2);
    const notOwner = await env.as(friendToken).patch(`/plans/${planId}/members/${env.ids.friend.f1}`, { paid: false });
    assert.equal(notOwner.status, 403);
  });

  it('chats with friends and refuses strangers', async () => {
    const sent = await env.as(token).post(`/me/chats/${env.ids.friend.f2}`, { body: 'See you at the arena stage' });
    assert.equal(sent.body.fromMe, true);
    const thread = await env.as(token).get(`/me/chats/${env.ids.friend.f2}`);
    assert.equal(thread.body.items.at(-1).body, 'See you at the arena stage');
    const stranger = (await many<any>(env.ctx.db, `select id from users where email = 'team@ravolution.vn'`))[0].id;
    assert.equal((await env.as(token).post(`/me/chats/${stranger}`, { body: 'hi' })).status, 403);
  });

  it('switches to live mode on the night', async () => {
    env.clock.set('2026-09-19T20:15:00+07:00');
    const zones = await many<any>(env.ctx.db, `select id, label from site_zones where event_id = $1`, [env.ids.event.ravo]);
    const friend = (await env.ctx.db.tx(async (q) => (await import('../src/http/session.ts')).createSession(q, env.clock.now(), { kind: 'user', userId: env.ids.friend.f1 }))).token;
    await env.as(friend).put(`/events/${env.ids.event.ravo}/presence`, { zoneId: zones.find((z) => z.label === 'Mainstage').id });

    const live = await env.as(token).get(`/events/${env.ids.event.ravo}/live`);
    assert.equal(live.status, 200);
    const arena = live.body.stages.find((s: any) => s.name.en === 'Arena stage');
    assert.equal(arena.now.artist, 'Hoaprox');
    assert.equal(arena.now.minutesLeft, 75);
    assert.equal(arena.next.artist, 'Alan Walker');
    assert.equal(arena.sets.find((s: any) => s.artist === 'DJ Mie').state, 'played');
    assert.deepEqual(live.body.friendsOnSite.map((f: any) => [f.name, f.zoneLabel]), [['Minh Trần', 'Mainstage']]);
    assert.equal(live.body.friendsLine.en, '1 friends on the site');

    const wave = await env.as(token).post(`/events/${env.ids.event.ravo}/waves/${env.ids.friend.f1}`);
    assert.equal(wave.body.message.en, 'Waved at Minh');
    assert.equal((await env.as(token).post(`/events/${env.ids.event.ravo}/waves/${env.ids.friend.f1}`)).status, 429);

    // After midnight still belongs to Saturday's lineup.
    env.clock.set('2026-09-20T00:30:00+07:00');
    const late = await env.as(token).get(`/events/${env.ids.event.ravo}/live`);
    assert.equal(late.body.day, '2026-09-19');
    assert.equal(late.body.stages.find((s: any) => s.name.en === 'Bass room').now.artist, 'Closing b2b');
    env.clock.set('2026-09-14T10:00:00+07:00');
  });

  it('generates the AI local guide once and serves it from cache', async () => {
    const first = await env.as(token).get(`/events/${env.ids.event.hozo}/guide?lang=vi`);
    assert.equal(first.status, 200);
    assert.equal(first.body.cached, false);
    assert.equal(first.body.before.length, 3, 'trimmed to three spots');
    const second = await env.as(token).get(`/events/${env.ids.event.hozo}/guide?lang=vi`);
    assert.equal(second.body.cached, true);
    assert.equal(guide.calls, 1);
  });

  it('rates an event after attending', async () => {
    const early = await env.as(token).post(`/events/${env.ids.event.ravo}/recaps`, { stars: 5 });
    assert.equal(early.body.error.code, 'not_started');
    env.clock.set('2026-09-20T12:00:00+07:00');
    const r = await env.as(token).post(`/events/${env.ids.event.ravo}/recaps`, { stars: 5, aspects: ['sound', 'crowd'] });
    assert.equal(r.status, 201);
    const recap = await env.as(token).get(`/events/${env.ids.event.ravo}/recap`);
    assert.equal(recap.body.submitted.stars, 5);
    const stranger = await env.as(token).post(`/events/${env.ids.event.duongsach}/recaps`, { stars: 4 });
    assert.equal(stranger.body.error.code, 'not_attended');
    env.clock.set('2026-09-14T10:00:00+07:00');
  });

  it('updates the profile but protects the sign-in email', async () => {
    const r = await env.as(token).patch('/me', { name: 'Minh Anh Nguyễn', city: 'TP.HCM', zalo: '0901 234 567' });
    assert.equal(r.body.user.name, 'Minh Anh Nguyễn');
    const locked = await env.as(token).patch('/me', { email: 'other@example.com' });
    assert.equal(locked.body.error.code, 'login_email_locked');
  });
});
